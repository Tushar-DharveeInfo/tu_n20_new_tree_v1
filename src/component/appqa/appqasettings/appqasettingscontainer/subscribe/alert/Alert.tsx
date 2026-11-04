
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import { Key } from 'rc-tree/lib/interface';
import { CheckInfo } from 'rc-tree/lib/Tree';
import { useSessionContext } from '../../../../../shared/context/hooks/SessionHooks';
import { useStatusBarContext } from '../../../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../../../shared/interceptors/Interceptor';
import '../../../../allcss/appqasettingscontainer/subscribe/Alert.css'
import { ALERT, AUTH, EM } from '../../../../../shared/interceptors/EndPoints';
import { SettingSubgroups } from '../../../../../constants/Feature';
import { EntityNameEnums, RootNode } from '../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { FnTransformDataToHierarchy } from '../../../../allcommon/FnTransformDataToHierarchy';
import { FnConvertHierarchicalDataToTree } from '../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree';
import { IControl } from '../../../../../shared/allinterface/settingsform/ISettingsLibForm';
import { IAlert } from '../../../../allinterface/iappqasettingscontainer/subscribe/IAlert';
import { IFeatureTree, ITreeForHierarchicalDataContainer } from '../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer';
import { ITreeNode, ISelectedNodeInfo } from '../../../../../shared/allinterface/tree/ITreeControl';
import { TreeWithFormEditor } from '../../template/reporttemplate/treewithformeditor/TreeWithFormEditor';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { IListItem } from '../../../../../shared/allinterface/basic/ICheckedListPanel';
import { Label } from '../../../../../shared/basic/label/Label';
import { FnGetCssVariable } from '../../../../../appcontainer/allcommon/FnGetCssVariable';
import { Check, User24x24 } from '@n20a/libicon';
import { FnParseJsonSafely } from '../../../../../appcontainer/allcommon/FnParseJsonSafely';
import { filterEnabledUsers } from '../../../../allcommon/FnIsAuthorizedUser';
import { CardLayout } from '../../../../../shared/cardlayout/CardLayout';
import { ICardLayoutField } from '../../../../../shared/allinterface/cardlayout/ICardLayout';
import { FnHandleAPIResponse } from '../../../../../shared/allcommon/basic/FnHandleAPIResponse';
import { Image } from '../../../../../shared/basic/image/Image';
import { FnIsTruthyFlag } from '../../../../../shared/allcommon/basic/FnIsTruthyFlag';
import { FnGetAddressDisplay, FnGetDisplayValue } from '../../../../allcommon/FnGetAddressDisplay';

const getExpandedNodesBasedOnCheckedKeys = (
    treeNodes: ITreeNode[],
    checkedNodeKeys: string[]
): {
    expandedNodes: string[];
    checkedNodes: ITreeNode[];
} => {
    const checkedKeySet = new Set(
        checkedNodeKeys.map(key => key.toLowerCase())
    );

    const expandedKeySet = new Set<string>();
    const checkedNodes: ITreeNode[] = [];

    const traverse = (nodes: ITreeNode[]): void => {
        for (const node of nodes) {
            if (
                node.NodeEntID &&
                checkedKeySet.has(node.NodeEntID.toLowerCase())
            ) {
                checkedNodes.push(node);

                if (node.parentEntID) {
                    expandedKeySet.add(node.parentEntID);
                }
            }

            if (node.children?.length) {
                traverse(node.children);
            }
        }
    };

    traverse(treeNodes);

    return {
        expandedNodes: [...expandedKeySet],
        checkedNodes
    };
};

const Alert = (alertDeliveryProps: IAlert) => {
    const [controlData, setControlData] = useState<IControl[]>([]);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [profileString, setProfileString] = useState<string>("");
    const [disableDelete, setDisableDelete] = useState<boolean>(true);
    const [allowRenderForm, setAllowRenderForm] = useState<boolean>(false);
    const [apiDataForTree, setApiDataForTree] = useState<unknown>();
    const [entityName, setEntityName] = useState<string>("");
    const [treeContainerProps, setTreeContainerProps] = useState<ITreeForHierarchicalDataContainer>()
    const [defaultCheckedKeys, setDefaultCheckedKeys] = useState<Key[]>([]);
    const [userList, setUserList] = useState<IListItem[]>([]);
    const [selectedUser, setSelectedUser] = useState<IListItem>();
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);

    const lastModifiedNodeEntIDRef = useRef<string | undefined>(undefined);

    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();

    // parse json value
    const parseJsonValue = (value: unknown): unknown => {
        if (typeof value !== "string") {
            return value;
        }

        const trimmed = value.trim();

        if (
            !trimmed.startsWith("{") &&
            !trimmed.startsWith("[")
        ) {
            return value;
        }

        try {
            return FnParseJsonSafely(trimmed);
        } catch {
            return value;
        }
    };

    // returns is data is user or not 
    const isUserRecord = (value: unknown): value is IListItem => {
        if (!value || typeof value !== "object") {
            return false;
        }
        const record = value as Record<string, unknown>;
        return Boolean(record.EntID || record._User || record.LoginUser || record.ContactName || record.Email);
    };

    // to find users from json object
    const findUsersArray = (value: unknown): IListItem[] => {
        try {
            const parsedValue = parseJsonValue(value);

            if (Array.isArray(parsedValue)) {
                if (parsedValue.some(isUserRecord)) {
                    return parsedValue
                        .filter(
                            (user): user is IListItem =>
                                isUserRecord(user) && user.Enabled === true
                        )
                        .sort((a, b) =>
                            (a.UserName?.trim() ?? "").localeCompare(
                                b.UserName?.trim() ?? "",
                                undefined,
                                { sensitivity: "base" }
                            )
                        );
                }

                for (const item of parsedValue) {
                    const childArray = findUsersArray(item);
                    if (childArray.length) {
                        return childArray;
                    }
                }
            }

            if (parsedValue && typeof parsedValue === "object") {
                const objectValue = parsedValue as Record<string, unknown>;

                for (const key of Object.keys(objectValue)) {
                    const childArray = findUsersArray(objectValue[key]);
                    if (childArray.length) {
                        return childArray;
                    }
                }
            }
        } catch (error) {
            console.error("Error while finding users array:", error);
        }

        return [];
    };


    const makeUserName = (userName: string, role?: string) => {
        if (role?.length) {
            return `${userName} (${role})`;
        } else {
            return userName
        }
    }
    /* Builds CardLayout name/value rows from a subscribe-alert user list item. */
    const buildAlertUserCardFields = (
        Enabled: string,
        userName: string,
        role: string,
        description: string,
        contactName: string,
        email: string,
        emailOptin: unknown,
        phone: string,
        address: string,
        phoneType: string
    ): ICardLayoutField[] => {
        const fields: ICardLayoutField[] = [
            {
                Name: "Username",
                Value: makeUserName(userName, role) || "—",
                Header: 1,
            },
        ];
        if (Enabled === "true") {
            fields.push({
                Name: "", Value: "", Header: 2, ValueContent: <Image uniqueName={"Enabled"}
                    source={<Check />}
                    tooltip="Enabled"
                    w={"var(--image-size-1)"} />
            });
        }
        if (email) {
            fields.push({
                Name: "Email",
                Value: email,
                Group: "email-row",
                Row: "inline",
            });
            fields.push({
                Name: "OptIn",
                Value: FnIsTruthyFlag(emailOptin) ? "✓" : "X",
                Group: "email-row",
                Row: "inline",
            });
        }
        if (contactName) {
            fields.push({
                Name: "Contact",
                Value: contactName,
                Group: "contact-row",
                Row: "inline",
            });
        }
        if (phone) {
            fields.push({
                Name: "Phone",
                Value: `${phone} (${phoneType})`,
                Group: "contact-row",
                Row: "inline",
            });
        }
        if (address) {
            fields.push({ Name: "Address", Value: address, Row: "inline", });
        }
        if (description) {
            fields.push({ Name: "Description", Value: description });
        }
        return fields;
    };

    // UseEffect to set user list and based on session set default selected user
    useEffect(() => {
        const handleGetUsersApiResponse = (response: unknown, status?: string) => {
            setIsLoadingUsers(false);
            if (status !== "200" || !response || typeof response !== "object") {
                alertDeliveryProps.handleShowUserMessage?.("Something went wrong in get Users")
                return;
            }
            const usersJson = "usersJson" in response
                ? (response as { usersJson: unknown }).usersJson
                : response;
            const userData = findUsersArray(usersJson)
            if (!userData.length) {
                alertDeliveryProps.handleShowUserMessage?.("No users found to enable")
                return;
            }
            let userId = "";
            if (sessionContext.SessionList) {
                const filteredUserId = sessionContext.SessionList.find(
                    (item) => item.VariableName === "LoginUserID"
                );
                userId = filteredUserId?.SessionValue ?? "";
            }
            let selectedUser: IListItem | null = null;
            const users: IListItem[] = userData.map((element) => {
                const id = String(element.EntID ?? element.id ?? "");
                const isCurrentUser = userId === id;
                const user: IListItem = {
                    ...element,
                    label: FnGetDisplayValue(element, ["_User", "LoginUser", "label"]),
                    id,
                    checked: isCurrentUser,
                    selected: isCurrentUser
                };
                if (isCurrentUser) {
                    selectedUser = user;
                }
                return user;
            });
            setUserList(users);
            if (selectedUser) {
                setSelectedUser(selectedUser);
            }
        };
        setIsLoadingUsers(true);
        axiosInterceptor(
            {
                url: AUTH.GetUsers,
                data: {
                    includeCurrentUser: true
                },
                allowShowLoader: true,
                setFetchData: handleGetUsersApiResponse
            },
            statusBarContext
        );
    }, []);

    // UseEffect to set the state based on props
    useEffect(() => {
        const handleNameChange = async () => {
            const fProps: IFeatureTree = {
                instanceName: "alert_delivery",
                allowCheckbox: true,
                allowIcon: false,
                hideCopyIcon: false,
                hideKebabMenu: true
            };
            // call api to get controls and get data for tree
            setControlData(alertDeliveryProps.formControls);
            const treeProps: ITreeForHierarchicalDataContainer = {
                uniqueName: `${alertDeliveryProps.uniqueName}-create-entities-tree`,
                apiData: undefined,
                featureId: alertDeliveryProps.featureId,
                featureTreeProps: fProps,
                allowGenerateTreeData: false
            }
            setTreeContainerProps(treeProps);
            let entityName: string | null = null;
            if (alertDeliveryProps.selectedSubGroup === SettingSubgroups.Alert) {
                entityName = EntityNameEnums.AlertProfile;
                setEntityName(entityName);
            }
            if (alertDeliveryProps.apiData && Object.keys(alertDeliveryProps.apiData)?.length > 0) {
                setApiDataForTree(alertDeliveryProps.apiData);
            }
        }
        handleNameChange();
    }, [alertDeliveryProps.selectedSubGroup, alertDeliveryProps.uniqueName
        , alertDeliveryProps.featureId, alertDeliveryProps.formControls, alertDeliveryProps.apiData])

    // UseEffect to handle api data set from state and convert to tree
    useEffect(() => {
        const handleApiDataChange = async () => {
            try {
                if (!apiDataForTree || !treeContainerProps) {
                    return;
                }

                const firstKey = Object.keys(apiDataForTree)[0];

                if (!firstKey) {
                    return;
                }

                const records = (apiDataForTree as Record<string, unknown>)[firstKey] as Record<string, any>[];

                if (!Array.isArray(records)) {
                    return;
                }

                const rootNode = { ...RootNode };
                rootNode.Name = `Available ${alertDeliveryProps.selectedSubGroup}s`;
                rootNode.Description = alertDeliveryProps.selectedSubGroup;

                const result = await FnTransformDataToHierarchy(
                    records,
                    ["GroupName"],
                    `_${entityName}`,
                    "EntID",
                    rootNode.EntID,
                    true
                );

                if (!result) {
                    return;
                }

                rootNode.children = result as never;

                const convertedData = await FnConvertHierarchicalDataToTree(
                    { data: [rootNode] },
                    treeContainerProps,
                    lastModifiedNodeEntIDRef.current
                );

                if (!convertedData) {
                    return;
                }

                setTreeData(convertedData.treeData);

                const checkedNodeKeys = records
                    .filter(
                        (item): item is { EntID: string; Subscribe: boolean } =>
                            !!item?.EntID && !!item?.Subscribe
                    )
                    .map(item => item.EntID);

                if (
                    convertedData.treeData.length > 0 &&
                    checkedNodeKeys.length > 0
                ) {
                    const { expandedNodes } =
                        getExpandedNodesBasedOnCheckedKeys(
                            convertedData.treeData,
                            checkedNodeKeys
                        );

                    setDefaultExpandedKeys([
                        ...new Set([
                            ...convertedData.expandedKeys,
                            ...expandedNodes
                        ])
                    ]);
                } else {
                    setDefaultExpandedKeys(
                        convertedData.expandedKeys
                    );
                }

                setDefaultCheckedKeys(checkedNodeKeys);

                if (convertedData.selectedKey) {
                    setDefaultSelectedKeys([
                        convertedData.selectedKey
                    ]);
                }

                if (
                    convertedData.selectedNode &&
                    convertedData.selectedNode.NodeEntityname ===
                    EntityNameEnums.AlertProfile
                ) {
                    const nodeData = {
                        ...convertedData.selectedNode
                    };

                    nodeData.title = "";
                    nodeData.icon = null;

                    setProfileString(
                        JSON.stringify([nodeData])
                    );
                    setAllowRenderForm(true);
                    setDisableDelete(false);

                    setDefaultSelectedNodeInfo({
                        event: "select",
                        selected: true,
                        node: convertedData.selectedNode,
                        selectedNodes: [
                            convertedData.selectedNode
                        ]
                    });
                } else {
                    setAllowRenderForm(false);
                    setDisableDelete(true);
                }

                setControlData([...controlData]);
            } catch (error) {
                console.error(
                    "Error while processing tree data:",
                    error
                );

                alertDeliveryProps.handleShowUserMessage?.(
                    "Unable to load tree data."
                );
            }
        };

        void handleApiDataChange();
    }, [apiDataForTree, treeContainerProps]);

    // This will set profile if node entityname is AlertProfile and show form disabled 
    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        if (info && info.node && info.node.NodeEntityname === EntityNameEnums.AlertProfile) {
            const nodeData = { ...info.node };
            nodeData.title = "";
            nodeData.icon = null;
            setProfileString(JSON.stringify([nodeData]));
            setAllowRenderForm(true);
            setControlData([...controlData]);
            setDisableDelete(false);
        }
        else {
            setAllowRenderForm(false);
            setDisableDelete(true);
        }
        setDefaultSelectedNodeInfo(info);
        setDefaultSelectedKeys([info.node.key]);
        setDefaultExpandedKeys(expandedKeys);
    }

    // Handle check logic when user checked node
    const handleNodeCheck = async (
        checked: Key[] | { checked: Key[]; halfChecked: Key[] },
        info: CheckInfo<ITreeNode>
    ) => {
        const nodeData = info.node;
        nodeData.checked = info.checked;

        try {
            if (!selectedUser?.id) {
                return;
            }

            const parsedData = FnParseJsonSafely(info.node.NodeDetail);

            if (!parsedData || typeof parsedData !== "object") {
                return;
            }
            if (info.checked) {
                setDefaultCheckedKeys(prev => [
                    ...new Set([...prev, nodeData.key])
                ]);
            } else {
                setDefaultCheckedKeys(prev =>
                    prev.filter(key => key !== nodeData.key)
                );
            }
            const existingUsers =
                typeof parsedData.UsersToNotifyJson === "string"
                    ? parsedData.UsersToNotifyJson
                    : "";

            const users = new Set(
                existingUsers
                    .split(";")
                    .map((user: string) => user.trim())
                    .filter(Boolean)
            );

            if (info.checked) {
                users.add(selectedUser.label);
            } else {
                users.delete(selectedUser.label);
            }

            const payload = {
                [`_${entityName}`]: [
                    {
                        UsersToNotifyJson: [...users].join(";"),
                        EntID: parsedData.EntID,
                        RecID: parsedData.RecID,
                        [`_${entityName}`]:
                            parsedData[`_${entityName}`],
                        HTML: parsedData.HTML
                    }
                ]
            };

            axiosInterceptor(
                {
                    url: EM.AddUpdateTableRecord,
                    data: {
                        jsonString: JSON.stringify(payload)
                    },
                    allowShowLoader: true,
                    setFetchData: (
                        _resp: unknown,
                        status?: string
                    ) => {
                        if (status !== "200") {
                            // Rollback
                            if (info.checked) {
                                setDefaultCheckedKeys(prev =>
                                    prev.filter(key => key !== nodeData.key)
                                );
                            } else {
                                setDefaultCheckedKeys(prev => [
                                    ...new Set([...prev, nodeData.key])
                                ]);
                            }

                            alertDeliveryProps.handleShowUserMessage?.(
                                `Something went wrong in subscribe: ${info.node.Name}`
                            );
                        }
                    }
                },
                statusBarContext
            );
        } catch (error) {
            console.error(
                "Error in handleNodeCheck:",
                error
            );

            alertDeliveryProps.handleShowUserMessage?.(
                "Unable to update subscription."
            );
        }
    };

    // This will call API to get authorised alert profiles for selected user and set checked
    const handleUserSelect = (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement> | undefined, selectedUserCard: unknown) => {
        event?.stopPropagation();
        if (!selectedUserCard) {
            return
        }
        const userData = selectedUserCard as IListItem
        setSelectedUser(userData)
        if (userData.label) {
            try {
                axiosInterceptor({
                    url: ALERT.GetAlertProfiles,
                    data: {
                        entityName: EntityNameEnums.AlertProfile,
                        userName: userData.label
                    },
                    setFetchData: (apiResp: unknown, status?: string) => {
                        if (status === "200" && apiResp && typeof apiResp === "object" && 'alertJson' in apiResp && apiResp.alertJson) {
                            const parsedJson = FnHandleAPIResponse(apiResp.alertJson, "Dataset");
                            if (parsedJson && Array.isArray(parsedJson) && parsedJson.length) {
                                setApiDataForTree({ [`_${entityName}`]: parsedJson })
                            }
                            else {
                                setDefaultCheckedKeys([]);
                            }
                        }
                        else {
                            alertDeliveryProps.handleShowUserMessage?.(`Something went wrong in get ${EntityNameEnums.AlertProfile} for selected ${userData.label}`);
                            setDefaultCheckedKeys([]);
                        }
                    }
                }, statusBarContext)
            } catch (error) {
                console.error('error :', error);
            }
        }
    }

    if (!treeData || !controlData) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No data found for subscribe</div>;
    }
    return (
        <div className='nz-template-container'>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100 nz-template-content' >
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-appqa-message-left-pane">
                    <div className="nz-wh-100 ">
                        {controlData && treeData && treeContainerProps && <TreeWithFormEditor
                            uniqueName={'alert_template'}
                            formControls={allowRenderForm ? controlData : []}
                            treeData={treeData}
                            defaultSelectedKeys={defaultSelectedKeys}
                            isDisableForm={true}
                            defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                            defaultExpandedKeys={defaultExpandedKeys}
                            defaultCheckedKeys={defaultCheckedKeys}
                            featureTreeProps={treeContainerProps.featureTreeProps}
                            allowShowHeader={false}
                            headerText={`View ${alertDeliveryProps.selectedSubGroup} Profile`}
                            profileString={profileString}
                            id={defaultSelectedNodeInfo?.node?.NodeEntID || ""}
                            headerTextForTree={`${alertDeliveryProps.selectedSubGroup}s`}
                            allowAdd={false}
                            allowDelete={false}
                            disableAdd={!defaultSelectedNodeInfo?.node?.NodeEntID}
                            disableDelete={disableDelete}
                            handleNodeSelect={handleNodeSelect}
                            handleNodeCheck={handleNodeCheck}
                        />}
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={25} minSize={20} className={`nz-d-flex-column nz-justify-center nz-appqa-message-right-pane nz-pane-3`} >
                    <div className="nz-message-user-card-list">
                        <div className="nz-sub-header">
                            <Label
                                uniqueName={`${alertDeliveryProps.uniqueName}-user-header`}
                                label="User"
                                fontWeight="bold"
                            />
                        </div>
                        <div className="nz-message-user-card-scroll">
                            {isLoadingUsers ? (
                                <div className="nz-message-user-card-status">Loading...</div>
                            ) : userList.length ? (
                                userList.map((item, index) => {
                                    const userName = FnGetDisplayValue(item, ["UserName"]);
                                    const Enabled = item?.Enabled ? "true" : "false";
                                    const role = FnGetDisplayValue(item, ["Role", "RoleName"]);
                                    const description = FnGetDisplayValue(item, ["Desc250", "Description"]);
                                    const contactName = FnGetDisplayValue(item, ["ContactName"]);
                                    const email = FnGetDisplayValue(item, ["Email"]);
                                    const phone = FnGetDisplayValue(item, ["Phone", "Mobile"]);
                                    const address = FnGetAddressDisplay(item);
                                    const phoneType = FnGetDisplayValue(item, ["PhoneType"]);

                                    const cardFields = buildAlertUserCardFields(
                                        Enabled,
                                        userName,
                                        role,
                                        description,
                                        contactName,
                                        email,
                                        item.EmailOptin,
                                        phone,
                                        address,
                                        phoneType
                                    );

                                    return (
                                        <CardLayout
                                            key={`${alertDeliveryProps.uniqueName}-user-${item.id}`}
                                            uniqueName={`${alertDeliveryProps.uniqueName}-user-card-${index}`}
                                            className="nz-message-user-card-main"
                                            data={item}
                                            fields={cardFields}
                                            isSelected={selectedUser?.id === item.id}
                                            onClick={handleUserSelect}
                                            hideRightMouseMenu
                                            ContentImage={{
                                                uniqueName: `${alertDeliveryProps.uniqueName}-user-image-${index}`,
                                                source: <User24x24 size={FnGetCssVariable("--image-size-2")} fill="none" strokeWidth={1} />,
                                                w: "var(--image-size-2)",
                                                tooltip: "User",
                                                type: "svg",
                                            }}
                                        />
                                    );
                                })
                            ) : (
                                <div className="nz-message-user-card-status">No Data Found</div>
                            )}
                        </div>
                    </div>
                </SplitterPanel>
            </Splitter>
        </div>
    )
}
export { Alert }
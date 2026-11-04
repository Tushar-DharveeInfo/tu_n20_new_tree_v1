import { Splitter, SplitterPanel } from "primereact/splitter"
import { SettingsLibForm } from "../../../../../shared/settingsform/settingslibform/SettingsLibForm"
import { useEffect, useMemo, useRef, useState } from "react";
import { FnConvertHierarchicalDataToTree } from "../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { IFeatureTree, ITreeForHierarchicalDataContainer } from "../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { ISelectedNodeInfo, ITreeNode } from "../../../../../shared/allinterface/tree/ITreeControl";
import { FnParseJsonSafely } from "../../../../../appcontainer/allcommon/FnParseJsonSafely";
import { axiosInterceptor } from "../../../../../shared/interceptors/Interceptor";
import { AUTH, EM, LOG } from "../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../shared/context/hooks/StatusBarHooks";
import { TreeControl } from "../../../../../shared/tree/treecontrol/TreeControl";
import { IManageRole } from "../../../../allinterface/iappqaentitiescontainer/role/IManageRole";
import { Key } from "rc-tree/lib/interface";
import { useMainAppContext } from "../../../../../shared/context/hooks/MainAppHooks";
import { IEmItem } from "../../../../../shared/context/allinterface/IMainApp";
import { DisplayControlEnums } from "../../../../../shared/alldefaultprops/basic/DefaultPropsFormContainer";
import { FnMapTableToFormControl } from "../../../../../shared/allcommon/settingsform/FnMapTableToFormControl";
import { IControl } from "../../../../../shared/allinterface/settingsform/ISettingsLibForm";
import { getMuForSite } from "../../../../../shared/context/contextandprovider/ExplorerTree";
import { YesNoFormContainer } from "../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from "../../../../../shared/allcommon/basic/FnHandleContainerKeyDown";

const ManageRole = (manageRoleProps: IManageRole) => {
    const { uniqueName, featureId, handleShowUserMessage } = manageRoleProps;
    const [loading, setLoading] = useState<boolean>(true);
    const [treeData, setTreeData] = useState<ITreeNode[]>();
    const [selectedNodeKeys, setSelectedNodeKeys] = useState<Key[]>()
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo>();
    const [expandedNodeKeys, setExpandedNodeKeys] = useState<Key[]>()
    const [formControls, setFormControls] = useState<IControl[]>();
    const [isAddMode, setIsAddMode] = useState<boolean>(false);
    const [profileString, setProfileString] = useState<string>();
    const [isShowConfirmDialog, setIsShowConfirmDialog] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isShowOk, setIsShowOk] = useState<boolean>(false);

    const statusbarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();

    const lastSelectedRoleIdRef = useRef<string>(undefined)
    const featureTreeProps: IFeatureTree = {
        instanceName: "RoleByUser_for_userAuth",
        hideKebabMenu: true,
        allowCheckbox: true,
        allowIcon: false,
        isAllowDrag: false,
        hideCopyIcon: false,
        reuseFromCache: false,
        isAllowDrop: false,
        allowInternalDrag: false,
        openAllNodes: true,
        multiRootNode: false
    };

    const treeDataObjectRef = useRef<ITreeForHierarchicalDataContainer>({
        uniqueName: `${uniqueName}-tree`,
        apiData: undefined,
        featureId: featureId,
        featureTreeProps: featureTreeProps,
        allowGenerateTreeData: false,
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
        className: "tree-container",
        selectedNodeExplorer: undefined
    });

    const formControlForEntity = useMemo(() => {
        const records = mainAppContext.emRecords;
        if (!records?.length) {
            return null;
        }
        const entityControls: IEmItem[] = [];
        for (const item of records) {
            const table = item.TableName?.toLowerCase();
            if (
                table === `_role`
                && item.DisplayControl?.length
                && (item.RequiredToAddRecord
                    || item.DisplayControl !== DisplayControlEnums.TextControl)
            ) {
                if (item.PName.toLowerCase() === "groupname") {
                    item.DisplayControl = DisplayControlEnums.TextControl;
                    item.DefaultValue = ""
                }
                entityControls.push(item);
            }
        }
        const mainControls = FnMapTableToFormControl(
            entityControls,
            "Role",
            `Role Details`
        );

        return {
            entityControls: mainControls
        };
    }, [
        mainAppContext.emRecords
    ]);

    useEffect(() => {
        if (!formControlForEntity?.entityControls?.length) {
            return;
        }
        setFormControls([...formControlForEntity.entityControls]);
    }, [formControlForEntity]);

    const FnCreateProfileStringFromSelectedNode = (
        node: ITreeNode,
        controls: IControl[]
    ): string => {

        if (!node || !controls?.length) {
            node.title = ""
            node.children = []
            return JSON.stringify([node]);
        }

        const parsedNodeDetail = node.NodeDetail
            ? FnParseJsonSafely(node.NodeDetail)
            : {};

        const sourceData = {
            ...node,
            ...(parsedNodeDetail ?? {})
        };

        const mappedData: Record<string, any> = {};

        for (const control of controls) {

            const ap = control._AP;

            if (!ap) {
                continue;
            }

            // direct AP match
            if (sourceData[ap] !== undefined) {
                mappedData[ap] = sourceData[ap];
                continue;
            }

            // fallback mappings
            switch (ap.toLowerCase()) {

                case "_role":
                    mappedData[ap] =
                        sourceData._Role
                        ?? sourceData.Name
                        ?? "";
                    break;

                case "desc250":
                    mappedData[ap] =
                        sourceData.Desc250
                        ?? sourceData.Description
                        ?? "";
                    break;

                case "groupname":
                    mappedData[ap] =
                        sourceData.GroupName
                        ?? "";
                    break;

                case "sortorder":
                    mappedData[ap] =
                        sourceData.SortOrder
                        ?? "";
                    break;

                case "priority":
                    mappedData[ap] =
                        sourceData.Priority
                        ?? "";
                    break;

                default:

                    mappedData[ap] =
                        sourceData[control.Name]
                        ?? sourceData[ap]
                        ?? "";
                    break;
            }
        }

        // preserve ids
        mappedData.EntID =
            sourceData.EntID
            ?? sourceData.NodeEntID;

        mappedData.RecID =
            sourceData.RecID
            ?? undefined;

        return JSON.stringify([mappedData]);
    };

    const getRoleByUser = () => {
        const handleApiResponseForGetRolesByUser = (responseData: unknown, status?: string) => {
            if (status === "200" && responseData && typeof responseData === "object" && "jsonStringOutput" in responseData) {
                const parsedResponse = FnParseJsonSafely(responseData.jsonStringOutput as string);

                if (parsedResponse) {

                    FnConvertHierarchicalDataToTree(
                        parsedResponse,
                        treeDataObjectRef.current,
                        lastSelectedRoleIdRef.current,
                        {
                            enabled: true,
                            sortBy: 'SortOrder'
                        }
                    ).then((result: { treeData: ITreeNode[]; selectedNode?: ITreeNode, expandedKeys: Key[] } | undefined) => {
                        if (result?.treeData && result.treeData.length) {
                            if (result.selectedNode) {

                                setSelectedNodeInfo({
                                    event: 'auto-select',
                                    node: result.selectedNode,
                                    selected: true,
                                    selectedNodes: []
                                });
                                const mappedProfileString =
                                    FnCreateProfileStringFromSelectedNode(
                                        result.selectedNode,
                                        formControls ?? []
                                    );

                                setProfileString(mappedProfileString);
                                setSelectedNodeKeys([result.selectedNode.key])
                            }
                            setExpandedNodeKeys(result.expandedKeys)
                            setTreeData(result.treeData);
                        }
                        else {
                            setTreeData([]);
                            handleShowUserMessage?.(
                                "Failed to load roles."
                            );
                        }

                    });
                }
                setLoading(false)
                return;
            }

            setTreeData([]);
        };


        axiosInterceptor({
            url: AUTH.GetRolesByUser,
            data: {
            },
            allowShowLoader: true,
            setFetchData: handleApiResponseForGetRolesByUser
        }, statusbarContext)
    };

    useEffect(() => {
        if (formControls?.length && !treeData?.length) {
            getRoleByUser();
        }
    }, [formControls])

    const refreshTree = () => {
        getRoleByUser();
    };

    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[] | undefined, isCalledFromExpand?: boolean | undefined): void => {
        setIsAddMode(false);
        setSelectedNodeKeys(selectedKeys);
        if (expandedNodeKeys)
            setExpandedNodeKeys(expandedNodeKeys)
        setSelectedNodeInfo(info);

        const nodeData = info.node;

        if (
            nodeData
            && nodeData.NodeType === "RoleNode"
        ) {
            const mappedProfileString =
                FnCreateProfileStringFromSelectedNode(
                    nodeData,
                    formControls ?? []
                );
            setFormControls((prev) => {

                if (!prev?.length) {
                    return prev;
                }

                return prev.map((control) => {

                    if (
                        control._AP?.toLowerCase() === "groupname"
                    ) {

                        return {
                            ...control,
                            Value: "",
                            DefaultAPValue: "",
                            DisplayControl: DisplayControlEnums.TextControl
                        };
                    } else if (
                        control._AP?.toLowerCase() === "priority"
                    ) {

                        return {
                            ...control,
                            Value: "",
                            DefaultAPValue: "",
                            DisplayControl: DisplayControlEnums.TextControl
                        };
                    }

                    return {
                        ...control
                    };
                });
            });
            setProfileString(mappedProfileString);
        }
        else {
            setProfileString(undefined);
        }
    }

    const handleAIClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string | undefined, payload?: unknown): void => {
        if (actionCode === "add") {

            setIsAddMode(true);
            const selectedNode = selectedNodeInfo?.node;
            const groupName: string =
                selectedNode?.NodeType?.toLowerCase() === "rolenode"
                    ? (selectedNode?.Name ?? "")
                    : (selectedNode?.GroupName ?? "");
            const Priority: string =
                selectedNode?.NodeType?.toLowerCase() === "rolenode"
                    ? (selectedNode?.Priority ?? "")
                    : "";
            setFormControls((prev) => {

                if (!prev?.length) {
                    return prev;
                }

                return prev.map((control) => {

                    if (
                        control._AP?.toLowerCase() === "groupname"
                    ) {

                        return {
                            ...control,
                            Value: groupName,
                            DefaultAPValue: groupName,
                            DisplayControl: DisplayControlEnums.TextControl
                        };
                    } else if (
                        control._AP?.toLowerCase() === "priority"
                    ) {

                        return {
                            ...control,
                            Value: Priority,
                            DefaultAPValue: Priority,
                            DisplayControl: DisplayControlEnums.TextControl
                        };
                    }

                    return {
                        ...control
                    };
                });
            });
            setProfileString(undefined);

            return;
        }
        else if (
            actionCode === "delete"
            && selectedNodeInfo?.node
        ) {

            axiosInterceptor({
                url: LOG.CreateMessage,
                data: {
                    projectInitial: "Common",
                    msgID: "151"
                },
                setFetchData: (
                    response: unknown,
                    status?: string
                ) => {

                    if (
                        status === "200"
                        && response
                        && typeof response === "object"
                        && "finalMessage" in response
                    ) {

                        setIsShowOk(false);

                        setConfirmMessage(
                            response.finalMessage as string
                        );

                        setIsShowConfirmDialog(true);
                    }
                }
            }, statusbarContext);
        }
    }

    const handleSaveForm = (profileData: string, id?: string | undefined): void => {
        const parsedRows = FnParseJsonSafely(profileData);

        if (
            !Array.isArray(parsedRows)
            || !parsedRows.length
        ) {
            handleShowUserMessage?.(
                "Invalid role data."
            );

            return;
        }

        const roleData = parsedRows[0];

        const payload = {
            ...roleData,
            EntityName: "Role",
            BasicRole: roleData.GroupName
        };

        axiosInterceptor({
            url: EM.AddUpdateTableRecord,
            data: {
                jsonString: JSON.stringify({
                    "_Role": [payload]
                })
            },
            allowShowLoader: true,
            setFetchData: (
                response: unknown,
                status?: string
            ) => {

                if (
                    status !== "200"
                    || !response
                    || typeof response !== "object"
                ) {
                    handleShowUserMessage?.(
                        "Failed to save role."
                    );
                    return;
                }

                if (isAddMode) {

                    const apiResponse = response as {
                        jsonStringOutput?: string;
                    };

                    if (apiResponse.jsonStringOutput) {

                        const parsedResponse = FnParseJsonSafely(
                            apiResponse.jsonStringOutput
                        );

                        const roleRecords =
                            parsedResponse?._Role;

                        if (
                            Array.isArray(roleRecords)
                            && roleRecords.length
                        ) {

                            const savedRole = roleRecords[0];

                            lastSelectedRoleIdRef.current =
                                savedRole?.EntID
                                ?? savedRole?.RecID
                                ?? "";
                        }
                    }
                }
                else {

                    lastSelectedRoleIdRef.current = id ?? "";
                }

                setIsAddMode(false);
                handleShowUserMessage?.(
                    isAddMode
                        ? "Role added successfully."
                        : "Role updated successfully."
                );
                refreshTree();
            }
        }, statusbarContext);
    }

    const handleYesButtonClick = () => {

        const node = selectedNodeInfo?.node;

        if (!node) {
            return;
        }

        axiosInterceptor({
            url: EM.DeleteTableRecords,
            data: {
                tableName: "_Role",
                entIDs: node.NodeEntID ?? node.EntID,
                recIDs: node.RecID ?? undefined
            },
            allowShowLoader: true,
            setFetchData: (
                response: unknown,
                status?: string
            ) => {

                if (
                    status === "200"
                    && response === ""
                ) {
                    lastSelectedRoleIdRef.current =
                        node.parentEntID
                        ?? undefined;

                    setSelectedNodeInfo(undefined);

                    setSelectedNodeKeys([]);

                    setProfileString(undefined);
                    handleShowUserMessage?.(
                        "Role deleted successfully."
                    );
                    refreshTree();
                }
                else {
                    handleShowUserMessage?.(
                        "Failed to delete role."
                    );
                }
            }
        }, statusbarContext);

        setIsShowConfirmDialog(false);
    };

    const handleNoButtonClick = () => {
        setIsShowConfirmDialog(false);
    };

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }
    if (!treeData || !formControls) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Roles data not found </div>;
    }


    return (
        <div className="nz-wh-100">
            <Splitter tabIndex={-1} className="nz-w-100 nz-h-100">
                <SplitterPanel
                    tabIndex={-1}
                    size={25}
                    minSize={10}
                    className="nz-wh-100 nz-role-container nz-pane-1"
                >
                    <div className="nz-wh-100 nz-role-content">
                        <TreeControl
                            uniqueName={uniqueName + "role-tree"}
                            treeData={treeData}
                            defaultExpandedKeys={expandedNodeKeys ?? []}
                            defaultSelectedKeys={selectedNodeKeys ?? []}
                            defaultCheckedKeys={[]}
                            defaultSelectedNodeInfo={selectedNodeInfo}
                            allowAdd={selectedNodeInfo?.node.NodeType?.toLowerCase() === "rolenode" ? true : false}
                            allowDelete={selectedNodeInfo?.node.NodeType?.toLowerCase() === "rolenode" ? true : false}
                            disableAdd={isAddMode || selectedNodeInfo?.node.GroupName?.length ? true : false}
                            disableDelete={selectedNodeInfo?.node.IsNZ ?? false}
                            handleAIClick={handleAIClick}
                            handleNodeSelect={handleNodeSelect}
                        />
                    </div>
                </SplitterPanel>
                <SplitterPanel
                    tabIndex={-1}
                    size={75}
                    minSize={10}
                    className="nz-wh-100 nz-d-flex-column nz-align-center"
                >
                    <div className="nz-wh-100 nz-form-controls-container" onKeyDownCapture={handleFormControlsKeyDown}
                        onKeyDown={handleFormControlsBubbleKeyDown}>
                        {(isAddMode
                            || (
                                selectedNodeInfo?.node
                                && selectedNodeInfo.node.NodeType === "RoleNode"
                            )) && (
                                <SettingsLibForm
                                    uniqueName={`${uniqueName}-role-form`}
                                    controls={formControls}
                                    profileString={profileString ?? ""}
                                    allowShowHeader={false}
                                    headerText={
                                        isAddMode
                                            ? "Add Role"
                                            : `${selectedNodeInfo?.node.GroupName ? "Edit" : "View"} ${selectedNodeInfo?.node?.Name ?? "Role"}`
                                    }
                                    isAutoSave={false}
                                    measurementUnit={getMuForSite()}
                                    container={"Role"}
                                    allowTestIcon={false}
                                    isDisableForm={selectedNodeInfo?.node.GroupName || isAddMode ? false : true}
                                    id={
                                        !isAddMode
                                            ? String(selectedNodeInfo?.node?.RecID ?? selectedNodeInfo?.node?.NodeEntID)
                                            : undefined
                                    }
                                    handleSaveForm={handleSaveForm}
                                />
                            )}
                    </div>
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer
                uniqueName={`${uniqueName}-confirm`}
                isOpen={isShowConfirmDialog}
                message={confirmMessage}
                handleYesButtonClick={handleYesButtonClick}
                handleNoButtonClick={handleNoButtonClick}
                showOkButton={isShowOk}
                handleOkButtonClick={() => {
                    setIsShowConfirmDialog(false);
                }}
            />
        </div>
    )
}

export default ManageRole
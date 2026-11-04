import { useEffect, useRef, useState } from "react";
import { Key } from "rc-tree/lib/interface";
import { CheckInfo } from "rc-tree/lib/Tree";
import "../../../../../../allcss/appqaentitiescontainer/user/Role.css";
import { axiosInterceptor } from "../../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../../../shared/context/hooks/StatusBarHooks";
import { TreeForHierarchicalDataContainer } from "../../../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { IConvertedTreeResponse, IFeatureTree } from "../../../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { AppQA } from "../../../../../../../constants/Feature";
import { ISelectedNodeInfo, ITreeNode } from "../../../../../../../shared/allinterface/tree/ITreeControl";
import { FnConvertHierarchicalDataToTree } from "../../../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { IFnCreateForensiclog } from "../../../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useMainAppContext } from "../../../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../../../shared/context/hooks/SessionHooks";
import { FnCreateForensiclog } from "../../../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { IRoleAuthPayloadItem, IRoleProps } from "../../../../../../allinterface/iappqaentitiescontainer/user/IRole";
import { FnParseJsonSafely } from "../../../../../../../appcontainer/allcommon/FnParseJsonSafely";


const getCheckedKeysForRole = async (apiData: Record<string, unknown>[]) => {
    let selected = false;
    const selectedKeys: Key[] = [];

    for (let index = 0; index < apiData.length; index++) {
        const element = apiData[index];
        if (element.Selected) {
            selected = true;
            selectedKeys.push(element.EntID as Key);
        }
        const children = element.Children as Record<string, unknown>[] | undefined;
        if (children?.length) {
            const childResult = await getCheckedKeysForRole(children);
            if (childResult.selected) {
                selected = true;
            }
            selectedKeys.push(...childResult.selectedKeys);
        }
    }

    return { selected, selectedKeys };
};

const Role = (roleProps: IRoleProps) => {
    const uniqueName = roleProps.uniqueName ?? "role-card";
    const [apiDataForRole, setApiDataForRole] = useState<ITreeNode[] | null>(null);
    const [defaultCheckedKeys, setDefaultCheckedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | undefined>();
    const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(false);
    const [loadedUserId, setLoadedUserId] = useState<string>();

    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const defaultCheckedKeysInfo = useRef<ITreeNode>(null);
    const selectedUserId = roleProps.selectedUser?.EntID;

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
    };

    const treeDataObjectRef = useRef({
        uniqueName: `${uniqueName}-tree`,
        apiData: apiDataForRole,
        featureId: AppQA.Entities,
        featureTreeProps: featureTreeProps,
        allowGenerateTreeData: false,
        defaultExpandedKeys: [] as Key[],
        defaultSelectedKeys: defaultSelectedKeys,
        defaultCheckedKeys: defaultCheckedKeys,
        defaultSelectedNodeInfo: defaultSelectedNodeInfo,
        isSiteByTenant: false,
        isFloorTree: false,
        allowAPICallOnExpand: true,
        allowAdd: false,
        allowEdit: false,
        allowDelete: false,
        allowMultiple: true,
        className: "tree-container",
        selectedNodeExplorer: undefined,
    });

    const getRoleByUser = (userId: string) => {
        const handleApiResponseForGetRolesByUser = async (responseData: unknown, status?: string) => {
            setIsLoadingRoles(false);
            setLoadedUserId(userId);

            if (status === "200" && responseData && typeof responseData === "object" && "jsonStringOutput" in responseData) {
                const parsedResponse = FnParseJsonSafely(responseData.jsonStringOutput as string) as Record<string, unknown>;
                const roleDataOnly = Object.values(parsedResponse)[0] as Record<string, unknown>[];
                const rolesRoot = roleDataOnly?.[0]?.Roles as Record<string, unknown>[] | undefined;

                FnConvertHierarchicalDataToTree(
                    parsedResponse,
                    treeDataObjectRef.current,
                    undefined,
                    {
                        enabled: true,
                        sortBy: 'SortOrder'
                    }
                ).then(async (result: IConvertedTreeResponse | undefined) => {
                    if (result) {
                        if (result.selectedNode) {
                            setDefaultSelectedNodeInfo({
                                event: "auto-select",
                                selected: true,
                                node: result.selectedNode,
                                selectedNodes: []
                            });
                        }
                        if (rolesRoot?.length) {
                            const checkedKeys = await getCheckedKeysForRole(rolesRoot);
                            setDefaultCheckedKeys(checkedKeys.selectedKeys ?? []);
                        } else {
                            setDefaultCheckedKeys([]);
                        }

                        setApiDataForRole(result.treeData);
                    }

                });
                return;
            }

            setApiDataForRole(null);
            setDefaultCheckedKeys([]);
        };

        setIsLoadingRoles(true);
        axiosInterceptor({
            url: AUTH.GetRolesByUser,
            data: {
                userId: userId
            },
            allowShowLoader: true,
            setFetchData: handleApiResponseForGetRolesByUser
        }, statusBarContextRef.current)
    };

    useEffect(() => {
        if (!selectedUserId) {
            setApiDataForRole(null);
            setDefaultCheckedKeys([]);
            setLoadedUserId(undefined);
            return;
        }

        getRoleByUser(selectedUserId);
    }, [selectedUserId]);

    const saveRoleAuthorization = (array: IRoleAuthPayloadItem[]) => {
        if (!roleProps.selectedUser) return;

        const ownerEntityJson = [{
            EntID: roleProps.selectedUser.EntID,
            OwnerEntity: roleProps.selectedUser.LoginUser,
            Selected: true
        }];

        const rowSelection = array.map((item) => ({
            EntID: item.EntID,
            Selected: item.Selected,
            selected: item.Selected,
            AuthEntityName: item.AuthEntityName,
            AuthEntity: item.AuthEntityName
        }));

        const authEntityNames = rowSelection
            .filter((item) => item.Selected)
            .map((item) => item.AuthEntity)
            .filter(Boolean);

        axiosInterceptor({
            url: AUTH.AddAuthByEntity,
            data: {
                ownerEntityName: "User",
                authEntityName: "Role",
                ownerEntityJson: JSON.stringify(ownerEntityJson),
                authEntityJson: JSON.stringify(rowSelection)
            },
            allowShowLoader: true,
            setFetchData: (handleResp: unknown, status?: string) => {
                if (status !== "200" || handleResp === undefined) return;
                roleProps.handleRefreshUsersData?.(authEntityNames.length ? authEntityNames[0] : "", defaultCheckedKeysInfo.current ?? undefined);

                const payload: IFnCreateForensiclog = {
                    logType: "UserAction",
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Auth,
                    SubGroupName: LogSubGroupName.Auth,
                    LogName: LogName.AssignEntity,
                    actionObject: {
                        entityType: "Role",
                        entityList: authEntityNames.join(", "),
                        userList: roleProps.selectedUser?.LoginUser ?? ""
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                };
                FnCreateForensiclog(payload);
            }
        }, statusBarContext);
    };

    const handleCheckRole = (checked: Key[]) => {
        let payloadDataRole: IRoleAuthPayloadItem[] = [];
        let payload: IRoleAuthPayloadItem[] = [];

        apiDataForRole?.forEach((ele) => {
            ele?.children?.forEach((child) => {
                child?.children?.forEach((subChild) => {
                    const existsInChecked = checked.includes(subChild.EntID as Key);

                    if (existsInChecked) {
                        payloadDataRole.push({
                            EntID: String(subChild.EntID),
                            Selected: true,
                            AuthEntityName: String(subChild.Name ?? "")
                        });
                    } else {
                        payload.push({
                            EntID: String(subChild.EntID),
                            Selected: false,
                            AuthEntityName: String(subChild.Name ?? "")
                        });
                    }
                });
            });
        });

        if (checked.length === 0) {
            payloadDataRole = payload.map((item) => ({ ...item, Selected: false }));
            payload = [];
        }

        const makeUnique = (items: IRoleAuthPayloadItem[]) =>
            [...new Map(items.map((item) => [item.EntID, item])).values()];

        const unique = makeUnique(payload);
        let array: IRoleAuthPayloadItem[] = [];

        if (payloadDataRole.length > 0) {
            const payloads = unique.filter((val) => !checked.includes(val.EntID as Key));
            array = [...payloads, ...payloadDataRole];
        } else {
            array = [...unique];
        }

        saveRoleAuthorization(array);
    };

    const isWaitingForSelectedUser = Boolean(selectedUserId) && loadedUserId !== selectedUserId;
    const shouldShowLoading = isLoadingRoles || isWaitingForSelectedUser;
    const shouldShowNoData = !shouldShowLoading && loadedUserId === selectedUserId && !apiDataForRole?.length;

    return (
        <div className="nz-role-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-role-card-status-message">Loading...</div>
            ) : apiDataForRole && defaultCheckedKeys ? (
                <TreeForHierarchicalDataContainer
                    {...treeDataObjectRef.current}
                    uniqueName={`${uniqueName}-tree`}
                    apiData={apiDataForRole}
                    featureId={roleProps.featureId ?? AppQA.Settings}
                    disableAdd={false}
                    disableEdit={false}
                    defaultExpandedKeys={defaultExpandedKeys}
                    defaultCheckedKeys={defaultCheckedKeys}
                    handleAIClick={() => { }}
                    handleNodeCheck={(checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => {
                        const checkedKey = info.checked ? [info.node.key] : []
                        setDefaultCheckedKeys(checkedKey);
                        handleCheckRole(checkedKey);
                        defaultCheckedKeysInfo.current = info.checked ? info.node : null
                        roleProps.handleCheckedRoles?.(checkedKey, info.node.Name ?? "");
                    }}
                    handleNodeSelect={(
                        _selectedKeys: Key[],
                        info: ISelectedNodeInfo,
                        expandedKeys: Key[]
                    ) => {
                        setDefaultExpandedKeys(expandedKeys);
                        setDefaultSelectedKeys([info.node.key])
                    }}
                />
            ) : shouldShowNoData ? (
                <div className="nz-role-card-status-message">No Data Found</div>
            ) : null}
        </div>
    );
};

export { Role };

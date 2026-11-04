import { useEffect, useRef, useState } from "react";
import { CheckInfo } from "rc-tree/lib/Tree";
import { Key } from "rc-tree/lib/interface";
import "../../../../../../allcss/appqaentitiescontainer/user/Entities.css";
import { axiosInterceptor } from "../../../../../../../shared/interceptors/Interceptor";
import { AUTH, MISC } from "../../../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../../../shared/context/hooks/StatusBarHooks";
import { useMainAppContext } from "../../../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../../../shared/context/hooks/SessionHooks";
import { IConvertedTreeResponse, IFeatureTree } from "../../../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITreeNode, ISelectedNodeInfo } from "../../../../../../../shared/allinterface/tree/ITreeControl";
import { FnConvertHierarchicalDataToTree } from "../../../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { FnGetCheckedNodesForAuth } from "../../../../../../allcommon/FnGetCheckedNodesForAuth";
import { IFnCreateForensiclog } from "../../../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { FnCreateForensiclog } from "../../../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { TreeForHierarchicalDataContainer } from "../../../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { IEntitiesProps } from "../../../../../../allinterface/iappqaentitiescontainer/user/IEntities";
import { FnParseJsonSafely } from "../../../../../../../appcontainer/allcommon/FnParseJsonSafely";
import { SidebarContainer } from "../../../../../../../appcontainer/sidebarcontainer/SidebarContainer";
import { FeatureQARange, FEnums } from "../../../../../../../constants/Feature";
import { IFeatureItem } from "../../../../../../../shared/context/allinterface/IMainApp";
import { IMenuItem } from "../../../../../../../shared/allinterface/menu/IMainMenu";

const Entities = (entitiesProps: IEntitiesProps) => {
    const uniqueName = entitiesProps.uniqueName ?? "entities-card";
    const secureEntityName = "Site";
    const [apiDataForSecure, setApiDataForSecure] = useState<unknown>();
    const [treeDataSecure, setTreeDataSecure] = useState<ITreeNode[] | null>([]);
    const [defaultCheckedKeysSecure, setDefaultCheckedKeysSecure] = useState<Key[]>([]);
    const [defaultExpandedKeysSecure, setDefaultExpandedKeysSecure] = useState<Key[]>([]);
    const [defaultSelectedKeysSecure, setDefaultSelectedKeysSecure] = useState<Key[]>([]);
    const [defaultSelectedNodeInfoSecure, setDefaultSelectedNodeInfoSecure] = useState<ISelectedNodeInfo | null>(null);
    const [checkedNodeData, setCheckedNodeData] = useState<ITreeNode[]>();
    const [treeContainerPropsSecure, setTreeContainerPropsSecure] = useState<any>();
    const [isLoadingSecure, setIsLoadingSecure] = useState<boolean>(false);
    const [loadedUserId, setLoadedUserId] = useState<string>();
    const [featureQAData, setFeatureQAData] = useState<IFeatureItem[]>();
    const [selectNode, setSelectNode] = useState<ITreeNode>();
    const [selectedKebabMenuExplorer, setSelectedKebabMenuExplorer] = useState<IMenuItem>();
    const [authorizeContainerHeight, setAuthorizeContainerHeight] = useState<number>();

    const secureApiRef = useRef<unknown>(null);
    const entitiesRootRef = useRef<HTMLDivElement | null>(null);
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const selectedCardId = entitiesProps.selectedCard?.EntID;
    useEffect(() => {
        let filtered_qa = mainAppContext.featureRecords.filter((item) => {
            if (item.MenuID == FEnums.Assets
                && (item._Feature as unknown as number) > FeatureQARange.MIN
                && (item._Feature as unknown as number) < FeatureQARange.MAX
            ) {
                return item
            }
        })
        if (filtered_qa) {
            filtered_qa = filtered_qa.sort(
                (a, b) => a.SortOrder - b.SortOrder
            );
            if (mainAppContext.apRecords) {
                setFeatureQAData(filtered_qa);
            }
        }
    }, [mainAppContext.featureRecords])
    useEffect(() => {
        const featureTreePropsForSecureData: IFeatureTree = {
            instanceName: "SecureData_tree",
            hideKebabMenu: true,
            allowCheckbox: true,
            allowIcon: false,
            isAllowDrag: false,
            hideCopyIcon: true,
            reuseFromCache: false,
            isAllowDrop: false,
            allowInternalDrag: true,
            openAllNodes: false,
        };
        const secureDataTreeObject: any = {
            uniqueName: `${uniqueName}-secureData_tree`,
            apiData: null,
            featureId: entitiesProps.featureId,
            featureTreeProps: featureTreePropsForSecureData,
            allowGenerateTreeData: false,
            defaultExpandedKeys: [],
            defaultSelectedKeys: [],
            defaultCheckedKeys: [],
            defaultSelectedNodeInfo: undefined,
            isSiteByTenant: false,
            isFloorTree: false,
            allowAPICallOnExpand: true,
            allowAdd: false,
            allowEdit: false,
            allowDelete: false,
            disableAdd: true,
            disableEdit: false,
            disableDelete: false,
            allowMultiple: true,
            className: "tree-container",
            selectedNodeExplorer: undefined,
        };
        setTreeContainerPropsSecure(secureDataTreeObject);
    }, [entitiesProps.featureId, uniqueName]);

    const combineSecuredEntitiesData = (hwParsed: unknown, nzParsed: unknown): Record<string, any> => {
        if (!hwParsed && !nzParsed) return {};
        if (!nzParsed) return (hwParsed as Record<string, any>) || {};
        if (!hwParsed) return (nzParsed as Record<string, any>) || {};

        const hwObj = JSON.parse(JSON.stringify(hwParsed)) as Record<string, any>;
        const nzObj = nzParsed as Record<string, any>;

        // Helper to find the "Secured Entities" node in a response object
        const findSecuredNode = (obj: any): any => {
            if (!obj) return null;
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    if (item?.Name && String(item.Name).trim().toLowerCase() === "secured entities") {
                        return item;
                    }
                    const found = findSecuredNode(item.Secured_Entities || item.children || item.Entities);
                    if (found) return found;
                }
            } else if (typeof obj === "object") {
                for (const key of Object.keys(obj)) {
                    if (Array.isArray(obj[key])) {
                        const found = findSecuredNode(obj[key]);
                        if (found) return found;
                    }
                }
            }
            return null;
        };

        const hwSecuredNode = findSecuredNode(hwObj);
        const nzSecuredNode = findSecuredNode(nzObj);

        if (hwSecuredNode && nzSecuredNode) {
            const hwChildren = hwSecuredNode.Secured_Entities || hwSecuredNode.children;
            const nzChildren = nzSecuredNode.Secured_Entities || nzSecuredNode.children;

            if (Array.isArray(hwChildren) && Array.isArray(nzChildren)) {
                nzChildren.forEach((nzChild: any) => {
                    const childName = nzChild?.Name;
                    const existingIdx = hwChildren.findIndex((h: any) => h?.Name === childName);
                    if (existingIdx >= 0) {
                        hwChildren[existingIdx] = nzChild;
                    } else {
                        hwChildren.push(nzChild);
                    }
                });
                return hwObj;
            }
        }

        return hwObj;
    };

    const isReportProfileBranchNode = (node: ITreeNode, treeData: ITreeNode[] | null): boolean => {
        if (!node) return false;
        const name = String(node.Name ?? "").toLowerCase();
        const treetype = String(node.treetype ?? "").toLowerCase();
        const entityName = String(node.NodeEntityname ?? (node as any).EntityName ?? "").toLowerCase();
        const nodeType = String(node.NodeType ?? "").toLowerCase();

        if (
            treetype.includes("report") ||
            entityName.includes("report") ||
            nodeType.includes("report") ||
            name === "reportprofile" ||
            name === "report profile" ||
            name === "reports" ||
            name === "netzoom entities" ||
            treetype.includes("netzoom") ||
            nodeType.includes("netzoom")
        ) {
            return true;
        }

        const containsTarget = (nodes: ITreeNode[], target: ITreeNode): boolean => {
            for (const item of nodes) {
                if (item.key === target.key || item.NodeEntID === target.NodeEntID) {
                    return true;
                }
                if (item.children && item.children.length > 0) {
                    if (containsTarget(item.children, target)) return true;
                }
            }
            return false;
        };

        const isUnderReportBranch = (nodes: ITreeNode[]): boolean => {
            for (const item of nodes) {
                const itemName = String(item.Name ?? "").toLowerCase();
                const isReportOrNz =
                    itemName === "netzoom entities" ||
                    itemName === "reportprofile" ||
                    itemName === "report profile" ||
                    itemName === "reports";

                if (isReportOrNz) {
                    if (item.key === node.key || item.NodeEntID === node.NodeEntID) {
                        return true;
                    }
                    if (item.children && containsTarget(item.children, node)) {
                        return true;
                    }
                } else if (item.children && item.children.length > 0) {
                    if (isUnderReportBranch(item.children)) {
                        return true;
                    }
                }
            }
            return false;
        };

        if (treeData && treeData.length > 0) {
            return isUnderReportBranch(treeData);
        }
        return false;
    };

    useEffect(() => {
        if (entitiesProps.isCollapsed) return;
        if (!selectedCardId) {
            setApiDataForSecure(undefined);
            setTreeDataSecure([]);
            setCheckedNodeData([]);
            setDefaultCheckedKeysSecure([]);
            setLoadedUserId(undefined);
            return;
        }

        let isCancelled = false;
        setIsLoadingSecure(true);

        const fetchHardware = new Promise<{ data: unknown; status?: string }>((resolve) => {
            axiosInterceptor({
                url: MISC.GetSecuredEntitiesData,
                data: {
                    entityType: "Hardware",
                    excludedEntity: "",
                    entID: selectedCardId
                },
                setFetchData: (data: unknown, status?: string) => {
                    resolve({ data, status });
                }
            }, statusBarContext);
        });

        const fetchNetZoom = new Promise<{ data: unknown; status?: string }>((resolve) => {
            axiosInterceptor({
                url: MISC.GetSecuredEntitiesData,
                data: {
                    entityType: "NetZoom",
                    excludedEntity: "AP;BackgroundTaskProfile;BackgroundTaskQueue;Feature;NZLicenseKey;Partner;Site;Role;User",
                    entID: selectedCardId
                },
                setFetchData: (data: unknown, status?: string) => {
                    resolve({ data, status });
                }
            }, statusBarContext);
        });

        Promise.all([fetchHardware, fetchNetZoom])
            .then(([hwResp, nzResp]) => {
                if (isCancelled) return;
                setIsLoadingSecure(false);
                setLoadedUserId(selectedCardId);

                const hwDataJson = (
                    hwResp.status === "200" &&
                    hwResp.data &&
                    typeof hwResp.data === "object" &&
                    "dataJson" in hwResp.data
                ) ? (hwResp.data as { dataJson?: string }).dataJson : undefined;

                const nzDataJson = (
                    nzResp.status === "200" &&
                    nzResp.data &&
                    typeof nzResp.data === "object" &&
                    "dataJson" in nzResp.data
                ) ? (nzResp.data as { dataJson?: string }).dataJson : undefined;

                const hwParsed = hwDataJson ? FnParseJsonSafely(hwDataJson) : undefined;
                const nzParsed = nzDataJson ? FnParseJsonSafely(nzDataJson) : undefined;

                if (hwParsed || nzParsed) {
                    const combinedData = combineSecuredEntitiesData(hwParsed, nzParsed);
                    setApiDataForSecure(combinedData);
                    setSelectNode(undefined);
                    return;
                }

                setApiDataForSecure(undefined);
                setTreeDataSecure([]);
                setCheckedNodeData([]);
                setDefaultCheckedKeysSecure([]);
            })
            .catch((error) => {
                if (isCancelled) return;
                console.error("Error fetching secured entities data:", error);
                setIsLoadingSecure(false);
                setLoadedUserId(selectedCardId);
                setApiDataForSecure(undefined);
                setTreeDataSecure([]);
                setCheckedNodeData([]);
                setDefaultCheckedKeysSecure([]);
            });

        return () => {
            isCancelled = true;
        };
    }, [secureEntityName, selectedCardId, entitiesProps.isCollapsed]);

    useEffect(() => {
        const dataChange = apiDataForSecure !== secureApiRef.current;
        if (apiDataForSecure && treeContainerPropsSecure && dataChange) {
            secureApiRef.current = apiDataForSecure;
            FnConvertHierarchicalDataToTree(apiDataForSecure, treeContainerPropsSecure, undefined, {
                enabled: true,
                sortBy: "Name",
            }).then(
                (result: IConvertedTreeResponse | undefined) => {
                    if (result) {
                        setTreeDataSecure(result.treeData);
                        setDefaultExpandedKeysSecure(result.expandedKeys);
                        setDefaultSelectedKeysSecure(result?.selectedKey ? [result?.selectedKey] : []);
                        if (result.selectedNode) {
                            setDefaultSelectedNodeInfoSecure({
                                event: "select",
                                selected: true,
                                node: result.selectedNode,
                                selectedNodes: [result.selectedNode],
                            });
                        }
                        const data = FnGetCheckedNodesForAuth(result.treeData, false);
                        if (data.checkedNodes) {
                            const checkedDataobj: ITreeNode[] = [];
                            data.checkedNodes.forEach((item) => {
                                item.checked = true;
                                checkedDataobj.push(item);
                            });
                            setCheckedNodeData(checkedDataobj);
                            setDefaultCheckedKeysSecure(data.checkedKeys as Key[]);
                        }
                    }
                }
            );
        }
    }, [apiDataForSecure, treeContainerPropsSecure]);

    const getCheckedApiData = (node: ITreeNode[], selected: boolean) => {
        const result: { EntID: string; Selected: boolean; AuthEntity: string }[] = [];
        const traverse = (nodes: ITreeNode[]) => {
            nodes.forEach((element: ITreeNode) => {
                result.push({
                    EntID: element.NodeEntID ?? element.EntID ?? "",
                    Selected: selected,
                    AuthEntity: element.Name ?? ""
                });
                if (element.children && element.children.length > 0) {
                    traverse(element.children);
                }
            });
        };
        traverse(node);
        return result;
    };

    const handleSecureDataChecked = (
        checked: Key[] | { checked: Key[]; halfChecked: Key[] },
        info: CheckInfo<ITreeNode>
    ) => {
        const nextCheckedKeys = Array.isArray(checked) ? checked : checked.checked;
        setDefaultCheckedKeysSecure(nextCheckedKeys);

        let checkedNodes = checkedNodeData ?? [];
        if (info.checked) {
            checkedNodes = [...checkedNodes, { ...info.node, checked: true }];
            setCheckedNodeData(checkedNodes);
        } else if (treeDataSecure && info.node.parentEntID) {
            const checkedDataobj: ITreeNode[] = [];
            checkedNodes.forEach((item) => {
                item.checked = item.NodeEntID === info.node.NodeEntID ? false : item.checked;
                checkedDataobj.push(item);
            });
            setCheckedNodeData([...checkedDataobj]);
            checkedNodes = checkedDataobj;
        }

        if (!info.node.parentEntID && treeDataSecure && info.node.children.length) {
            const childIds = new Set(info.node.children.map(c => c.NodeEntID ?? c.EntID));
            const existingOtherNodes = (checkedNodeData ?? []).filter(item => !childIds.has(item.NodeEntID ?? item.EntID));
            const childrenArr: ITreeNode[] = [];
            for (let index = 0; index < info.node.children.length; index++) {
                const element = { ...info.node.children[index], checked: info.checked };
                childrenArr.push(element);
            }

            checkedNodes = [...existingOtherNodes, ...childrenArr];
            setCheckedNodeData(checkedNodes);
        }

        if (selectedCardId) {
            const isReport = isReportProfileBranchNode(info.node, treeDataSecure);
            const authEntityName = isReport ? "ReportProfile" : "Device";

            const branchCheckedNodes = checkedNodes.filter(node =>
                isReport ? isReportProfileBranchNode(node, treeDataSecure) : !isReportProfileBranchNode(node, treeDataSecure)
            );

            let authEntityJson: { EntID: string; Selected: boolean; AuthEntity: string }[] = [];
            branchCheckedNodes.forEach((element) => {
                authEntityJson.push({
                    EntID: element.NodeEntID ?? element.EntID ?? "",
                    Selected: element.checked ?? false,
                    AuthEntity: element.Name ?? ""
                });
            });

            if (info.node.children && info.node.children.length > 0) {
                const data = getCheckedApiData(info.node.children, info.checked);
                for (let index = 0; index < data.length; index++) {
                    authEntityJson.push(data[index]);
                }
            } else {
                authEntityJson.push({
                    EntID: info.node.NodeEntID ?? info.node.EntID ?? "",
                    Selected: info.checked,
                    AuthEntity: info.node.Name ?? ""
                });
            }

            const makeUnique = (
                items: { EntID: string; Selected: boolean; AuthEntity: string }[]
            ) => {
                const filteredItems = items.filter(item =>
                    item.EntID &&
                    item.EntID.trim() !== "" &&
                    item.EntID !== "report-profile-root" &&
                    item.EntID !== "netzoom-entities-root" &&
                    item.EntID !== "secured-entities-root"
                );
                return [...new Map(filteredItems.map(item => [item.EntID, item])).values()];
            };

            const uniqueAuthEntityJson = makeUnique(authEntityJson);
            const ownerEntityJson = [{
                EntID: entitiesProps.selectedCard && entitiesProps.selectedCard.EntID,
                OwnerEntity: entitiesProps.selectedCard && (entitiesProps.selectedCard.LoginUser ?? entitiesProps.selectedCard.Name ?? ""),
                Selected: true
            }];

            const authEntityNames = uniqueAuthEntityJson.map(item => item.AuthEntity);
            const ownerEntityNames = ownerEntityJson.map(item => item.OwnerEntity);

            const payload = {
                authEntityName: authEntityName,
                authEntityJson: JSON.stringify(uniqueAuthEntityJson),
                ownerEntityName: entitiesProps.ownerEntityName,
                ownerEntityJson: JSON.stringify(ownerEntityJson)
            };

            const handleAddAuthByEntityApiResponse = (addAuthByEntityApiResponse: unknown, status?: string) => {
                if (status === "200" && addAuthByEntityApiResponse === "") {
                    const forensicPayload: IFnCreateForensiclog = {
                        logType: "UserAction",
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Auth,
                        SubGroupName: LogSubGroupName.Auth,
                        LogName: LogName.AuthorizeEntities,
                        actionObject: {
                            entityType: entitiesProps.ownerEntityName === "Role" ? "Authorize Role" : "Authorize User",
                            secureDatas: authEntityNames.join(", "),
                            entitiesList: ownerEntityNames.join(", ")
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    };
                    FnCreateForensiclog(forensicPayload);
                }
            };

            axiosInterceptor({
                url: AUTH.AddAuthByEntity,
                data: payload,
                allowShowLoader: true,
                setFetchData: handleAddAuthByEntityApiResponse
            }, statusBarContext);
        }
    };

    const isWaitingForselectedCard = Boolean(selectedCardId) && loadedUserId !== selectedCardId;
    const shouldShowLoading = isLoadingSecure || isWaitingForselectedCard;

    // Notify parent after entities card content finishes loading/rendering.
    useEffect(() => {
        if (!entitiesProps.isCollapsed && !shouldShowLoading) {
            entitiesProps.onContentReady?.();
        }
    }, [entitiesProps, shouldShowLoading, treeDataSecure]);

    useEffect(() => {
        const root = entitiesRootRef.current;
        if (!root) return;

        const cardContent = root.closest('.nz-card-container-content') as HTMLElement | null;
        const findAuthorizeContainer = (node: HTMLElement): HTMLElement | null => {
            let parent: HTMLElement | null = node;
            while (parent) {
                const hasAuthorizeContainerClass = Array.from(parent.classList).some((className) =>
                    className.endsWith('authorize-container') || className.endsWith('authorize-sections')
                );
                if (hasAuthorizeContainerClass) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        };

        const sizeTarget = cardContent ?? findAuthorizeContainer(root);
        if (!sizeTarget) return;

        const updateHeight = () => {
            if (cardContent) {
                setAuthorizeContainerHeight(Math.max(0, cardContent.clientHeight));
                return;
            }
            const cardContainer = root.closest('.nz-card-container') as HTMLElement | null;
            const cardHeader = cardContainer?.querySelector('.nz-card-container-header') as HTMLElement | null;
            const headerHeight = cardHeader?.offsetHeight ?? 0;
            const adjustedHeight = Math.max(0, sizeTarget.clientHeight - headerHeight);
            setAuthorizeContainerHeight(adjustedHeight);
        };

        updateHeight();

        const resizeObserver = new ResizeObserver(() => {
            updateHeight();
        });
        resizeObserver.observe(sizeTarget);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    function handleNodeSelect(selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]): void {
        if (expandedKeys) {
            setDefaultExpandedKeysSecure(expandedKeys);
        }
        setDefaultSelectedKeysSecure([info.node.key]);
        setDefaultSelectedNodeInfoSecure(info);
        if (info.node.NodeType === "SecuredDataNode") {
            setSelectNode(info.node);
            entitiesProps.handleShowSidebarOpenBtn?.(true);
        } else {
            entitiesProps.handleShowSidebarOpenBtn?.(false);
            setSelectNode(undefined);
        }
    }
    // Syncs sidebar submenu state when sidebar menu icon is clicked.
    const handleMouseSidebar = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: IMenuItem) => {
        if (selectNode) {
            setSelectedKebabMenuExplorer(payload)
        }
    }

    return (
        <div ref={entitiesRootRef} className="nz-entities-card-container" key={uniqueName}>
            <div style={{ position: "relative", flex: 1, minHeight: 300, height: authorizeContainerHeight ? `${authorizeContainerHeight}px` : "100%" }}>
                {shouldShowLoading ? (
                    <div className="nz-entities-card-status-message">Loading...</div>
                ) : treeDataSecure && treeContainerPropsSecure ? (
                    <TreeForHierarchicalDataContainer
                        {...treeContainerPropsSecure}
                        apiData={treeDataSecure}
                        defaultCheckedKeys={defaultCheckedKeysSecure}
                        defaultSelectedKeys={defaultSelectedKeysSecure}
                        defaultExpandedKeys={defaultExpandedKeysSecure}
                        defaultSelectedNodeInfo={defaultSelectedNodeInfoSecure || undefined}
                        handleNodeCheck={(checked, info) => {
                            handleSecureDataChecked(checked, info);
                        }}
                        handleNodeExpand={(expanded, info) => {
                            setDefaultExpandedKeysSecure(expanded);
                        }}
                        handleNodeSelect={handleNodeSelect}
                    />
                ) : (
                    <div className="nz-entities-card-status-message">No Data Found</div>
                )}
                {selectNode && <SidebarContainer
                    uniqueName={"nz-entites-sidebar"}
                    featureQaList={featureQAData ?? []}
                    featureId={FEnums.Assets}
                    selectedNode={selectNode}
                    isHideMaximizeButton={true}
                    selectedFeatureQa={selectedKebabMenuExplorer ?? null}
                    headerText={selectNode.Name ?? ""}
                    isShowSidebar={entitiesProps.isSidebarOpen ?? false}
                    handleMouse={handleMouseSidebar}
                    handleCloseSidebar={function (): void {
                        entitiesProps.handleCloseSidebar?.();
                    }}
                />}
            </div>
        </div>
    );
};

export { Entities };

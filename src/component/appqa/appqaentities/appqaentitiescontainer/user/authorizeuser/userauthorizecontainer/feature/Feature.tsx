import { useEffect, useRef, useState } from "react";
import { Key } from "rc-tree/lib/interface";
import { CheckInfo } from "rc-tree/lib/Tree";
import "../../../../../../allcss/appqaentitiescontainer/user/Feature.css";
import { axiosInterceptor } from "../../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../../../shared/context/hooks/StatusBarHooks";
import { TreeForHierarchicalDataContainer } from "../../../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { IFeatureTree, IHierarchicalApiData, ITreeForHierarchicalDataContainer } from "../../../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { ISelectedNodeInfo, ITreeNode } from "../../../../../../../shared/allinterface/tree/ITreeControl";
import { FnConvertHierarchicalDataToTree } from "../../../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { FnSearchKeywordInLocalTree } from "../../../../../../../shared/allcommon/settingsform/FnSearchKeywordInLocalTree";
import { FnGetCheckedNodesForAuth } from "../../../../../../allcommon/FnGetCheckedNodesForAuth";
import { SearchControl } from "../../../../../../../shared/searchfilter/searchcontrol/SearchControl";
import { IFnCreateForensiclog } from "../../../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useMainAppContext } from "../../../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../../../shared/context/hooks/SessionHooks";
import { FnCreateForensiclog } from "../../../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { AppQA } from "../../../../../../../constants/Feature";
import { IFeatureAuthPayloadItem, IFeatureProps } from "../../../../../../allinterface/iappqaentitiescontainer/user/IFeature";
import { FnParseJsonSafely } from "../../../../../../../appcontainer/allcommon/FnParseJsonSafely";

/** GetFeaturesByEntity child-array keys that hold MenuID / SortOrder records. */
const FEATURES_CHILD_ARRAY_KEYS = new Set([
    "Feature",
    "Children",
    "FeatureQA",
    "FeatureKebobMenu",
    "AppQAKebobMenu",
    "AppQAKebobSubMenu",
]);

const isFeatureRecord = (value: unknown): value is Record<string, unknown> => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const menuId = (value as Record<string, unknown>).MenuID;
    return menuId != null && menuId !== "";
};

const shouldSortFeatureArray = (items: unknown[]): boolean =>
    items.some(isFeatureRecord);

const getMenuIdSortValue = (record: Record<string, unknown>): number => {
    const menuId = record.MenuID;
    if (menuId == null || menuId === "") {
        return 0;
    }
    return Number(menuId);
};

const getSortOrderValue = (record: Record<string, unknown>): number =>
    Number(record.SortOrder ?? 0);

/** Sort by MenuID first, then SortOrder (API sends both as string or number). */
const compareFeatureRecords = (
    a: Record<string, unknown>,
    b: Record<string, unknown>
): number => {
    const menuDiff = getMenuIdSortValue(a) - getMenuIdSortValue(b);
    if (menuDiff !== 0) {
        return menuDiff;
    }
    return getSortOrderValue(a) - getSortOrderValue(b);
};

const sortFeatureRecordArray = (items: unknown[]): unknown[] =>
    [...items]
        .map((item) => sortFeaturesApiData(item))
        .sort((a, b) => {
            if (!isFeatureRecord(a) || !isFeatureRecord(b)) {
                return 0;
            }
            return compareFeatureRecords(a, b);
        });

/**
 * Sort GetFeaturesByEntity payload: Features → Feature → Children →
 * FeatureQA / FeatureKebobMenu / AppQAKebobMenu, etc.
 */
const sortFeaturesApiData = (data: unknown): unknown => {
    if (Array.isArray(data)) {
        if (shouldSortFeatureArray(data)) {
            return sortFeatureRecordArray(data);
        }
        return data.map((item) => sortFeaturesApiData(item));
    }

    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(record)) {
            if (Array.isArray(value)) {
                if (FEATURES_CHILD_ARRAY_KEYS.has(key) || shouldSortFeatureArray(value)) {
                    sorted[key] = sortFeatureRecordArray(value);
                } else {
                    sorted[key] = value.map((item) => sortFeaturesApiData(item));
                }
            } else if (value && typeof value === "object") {
                sorted[key] = sortFeaturesApiData(value);
            } else {
                sorted[key] = value;
            }
        }
        return sorted;
    }

    return data;
};

const sortTreeNodesByMenuIdAndSortOrder = (nodes: ITreeNode[]): ITreeNode[] =>
    [...nodes]
        .sort((a, b) =>
            compareFeatureRecords(
                a as Record<string, unknown>,
                b as Record<string, unknown>
            )
        )
        .map((node) => ({
            ...node,
            children: node.children?.length
                ? sortTreeNodesByMenuIdAndSortOrder(node.children)
                : node.children,
            HasChildren: node.children?.length > 0 ? 1 : 0,
            isLeaf: node.children?.length > 0 ? false : true
        }));

const isAllowedForBasicRole = (record: Record<string, unknown>, targetRole: string): boolean => {
    const targetRoleLower = targetRole.trim().toLowerCase();
    if (!targetRoleLower) {
        return true;
    }

    const matchingKey = Object.keys(record).find(
        (key) => key.toLowerCase() === targetRoleLower
    );

    if (!matchingKey) {
        return true;
    }

    const val = record[matchingKey];
    if (val === undefined || val === null) {
        return false;
    }
    return val === 1 || val === "1" || val === true;
};

const filterFeaturesApiData = (data: unknown, targetRole: string): unknown => {
    if (Array.isArray(data)) {
        const filteredArray: unknown[] = [];
        for (const item of data) {
            const filteredItem = filterFeaturesApiData(item, targetRole);
            if (filteredItem !== null && filteredItem !== undefined) {
                filteredArray.push(filteredItem);
            }
        }
        return filteredArray;
    }

    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;

        if (!isAllowedForBasicRole(record, targetRole)) {
            return null;
        }

        const filteredRecord: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
            if (Array.isArray(value)) {
                filteredRecord[key] = filterFeaturesApiData(value, targetRole);
            } else if (value && typeof value === "object") {
                filteredRecord[key] = filterFeaturesApiData(value, targetRole);
            } else {
                filteredRecord[key] = value;
            }
        }

        return filteredRecord;
    }

    return data;
};

const getBasicRoleFromSelectedCard = (card: unknown): string | null => {
    if (!card || typeof card !== "object") return null;
    const rec = card as Record<string, unknown>;
    const roleCandidate = rec.GroupName ?? rec.BasicRole ?? rec._Role ?? rec.Role ?? rec.Name;
    return roleCandidate ? String(roleCandidate).trim() : null;
};

const FnGetAllChildNodes = (selectedNode: ITreeNode): ITreeNode[] => {
    const result: ITreeNode[] = [];

    const traverse = (node: ITreeNode) => {
        result.push(node);

        if (node.children?.length > 0) {
            node.children.forEach(traverse);
        }
    };

    traverse(selectedNode);

    return result;
};

const Feature = (featureProps: IFeatureProps) => {
    const uniqueName = featureProps.uniqueName ?? "feature-card";
    const [rawApiFeaturesData, setRawApiFeaturesData] = useState<unknown>(null);
    const [apiDataForFeatureTree, setApiDataForFeatureTree] = useState<IHierarchicalApiData | null>(null);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [searchText, setSearchText] = useState<string>("");
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [checkedNodeData, setCheckedNodeData] = useState<ITreeNode[]>([]);
    const [defaultCheckedKeys, setDefaultCheckedKeys] = useState<Key[]>([]);
    const [isLoadingFeatures, setIsLoadingFeatures] = useState<boolean>(false);
    const [loadedUserId, setLoadedUserId] = useState<string>();

    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const selectedCardId = featureProps.selectedCard?.EntID;

    const featureTreeProps: IFeatureTree = {
        instanceName: "features_tree",
        hideKebabMenu: false,
        allowCheckbox: true,
        allowIcon: true,
        isAllowDrag: false,
        hideCopyIcon: false,
        reuseFromCache: false,
        isAllowDrop: false,
        allowInternalDrag: true,
        openAllNodes: false,
        allowCheckStrictly: false,
    };

    const treeProps: ITreeForHierarchicalDataContainer = {
        uniqueName: `${uniqueName}-tree`,
        apiData: apiDataForFeatureTree,
        featureId: featureProps.featureId ?? AppQA.Settings,
        featureTreeProps: featureTreeProps,
        allowGenerateTreeData: false,
        defaultExpandedKeys: [] as Key[],
        defaultSelectedKeys: [] as Key[],
        defaultCheckedKeys: [] as Key[],
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
    const treePropsRef = useRef(treeProps);

    const buildTreeFromApiData = (apiData: Record<string, unknown>) => {
        FnConvertHierarchicalDataToTree(apiData, treePropsRef.current).then((result: {
            treeData: ITreeNode[];
            expandedKeys?: Key[];
            selectedKey?: Key;
            selectedNode?: ITreeNode;
        } | undefined) => {
            if (result) {
                const sortedTreeData = sortTreeNodesByMenuIdAndSortOrder(result.treeData);

                setTreeData(sortedTreeData);
                setDefaultExpandedKeys(result.expandedKeys ?? []);
                setDefaultSelectedKeys(result.selectedKey ? [result.selectedKey] : []);

                if (result.selectedNode) {
                    setDefaultSelectedNodeInfo({
                        event: "select",
                        selected: true,
                        node: result.selectedNode,
                        selectedNodes: [result.selectedNode],
                    });
                }
                const data = FnGetCheckedNodesForAuth(sortedTreeData, false);
                if (data.checkedNodes) {
                    const checkedDataobj: ITreeNode[] = [];
                    data.checkedNodes.forEach((item) => {
                        item.checked = true;
                        checkedDataobj.push(item);
                    });
                    setCheckedNodeData(checkedDataobj);
                    setDefaultCheckedKeys(data.checkedKeys);
                }
            }
        });
    };

    const basicRole = getBasicRoleFromSelectedCard(featureProps.selectedCard);

    const applyRoleFilterAndBuildTree = (data: unknown) => {
        if (!data) {
            setApiDataForFeatureTree(null);
            setTreeData([]);
            setDefaultCheckedKeys([]);
            setCheckedNodeData([]);
            return;
        }

        const filtered = basicRole
            ? filterFeaturesApiData(data, basicRole)
            : data;

        if (filtered && typeof filtered === "object") {
            const hierarchicalData = filtered as IHierarchicalApiData;
            setApiDataForFeatureTree({ ...hierarchicalData });
            buildTreeFromApiData(hierarchicalData);
        } else {
            setApiDataForFeatureTree(null);
            setTreeData([]);
            setDefaultCheckedKeys([]);
            setCheckedNodeData([]);
        }
    };

    const getFeaturesByUser = (userId: string) => {
        const handleGetFeaturesByEntityApiResponse = (getFeaturesByEntityApiResponse: unknown, status?: string) => {
            setIsLoadingFeatures(false);
            setLoadedUserId(userId);

            if (
                status === "200" &&
                getFeaturesByEntityApiResponse &&
                typeof getFeaturesByEntityApiResponse === "object" &&
                "featuresJson" in getFeaturesByEntityApiResponse
            ) {
                const parsedData = sortFeaturesApiData(
                    FnParseJsonSafely(getFeaturesByEntityApiResponse.featuresJson as string)
                ) as IHierarchicalApiData;
                setRawApiFeaturesData(parsedData);
                applyRoleFilterAndBuildTree(parsedData);
                return;
            }

            setRawApiFeaturesData(null);
            setApiDataForFeatureTree(null);
            setTreeData([]);
            setDefaultCheckedKeys([]);
            setCheckedNodeData([]);
        };

        setIsLoadingFeatures(true);
        axiosInterceptor({
            url: AUTH.GetFeaturesByEntity,
            data: {
                entityName: featureProps.entityName,
                entID: userId
            },
            allowShowLoader: true,
            setFetchData: handleGetFeaturesByEntityApiResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingFeatures(false);
            setLoadedUserId(userId);
            setRawApiFeaturesData(null);
            setApiDataForFeatureTree(null);
            setTreeData([]);
            setDefaultCheckedKeys([]);
            setCheckedNodeData([]);
        });
    };

    useEffect(() => {
        if (featureProps.isCollapsed) return;
        if (!selectedCardId) {
            setRawApiFeaturesData(null);
            setApiDataForFeatureTree(null);
            setTreeData([]);
            setDefaultCheckedKeys([]);
            setCheckedNodeData([]);
            setLoadedUserId(undefined);
            return;
        }

        getFeaturesByUser(selectedCardId);
    }, [selectedCardId, featureProps.isCollapsed]);

    // Re-filter tree if basic role changes for the current card without needing an API refetch
    useEffect(() => {
        if (!rawApiFeaturesData || loadedUserId !== selectedCardId) {
            return;
        }
        applyRoleFilterAndBuildTree(rawApiFeaturesData);
    }, [basicRole]);

    const getCheckedApiData = (node: ITreeNode[], selected: boolean): IFeatureAuthPayloadItem[] => {
        const result: IFeatureAuthPayloadItem[] = [];

        node.forEach((element: ITreeNode) => {
            result.push({
                EntID: element.NodeEntID ?? "",
                Selected: selected,
                AuthEntity: element.Name ?? ""
            });
            if (element.children && element.children.length > 0) {
                result.push(...getCheckedApiData(element.children, selected));
            }
        });

        return result;
    };

    const saveFeatureAuthorization = (checkedData: ITreeNode[], info: CheckInfo<ITreeNode>) => {
        if (!featureProps.selectedCard?.EntID) return;

        let authEntityJson: IFeatureAuthPayloadItem[] = [];
        checkedData.forEach((element) => {
            authEntityJson.push({
                EntID: element.NodeEntID ?? "",
                Selected: Boolean(element.checked),
                AuthEntity: element.Name ?? ""
            });
        });

        const makeUnique = (items: IFeatureAuthPayloadItem[]) =>
            [...new Map(items.map((item) => [item.EntID, item])).values()];

        if (info.node.children && info.node.children.length > 0) {
            const childData = getCheckedApiData(info.node.children, info.checked);
            authEntityJson = [...authEntityJson, ...childData];
        }

        const ownerEntityJson = [{
            EntID: featureProps.selectedCard.EntID,
            OwnerEntity: featureProps.selectedCard.LoginUser ?? featureProps.selectedCard.Name ?? "",
            Selected: true
        }];

        let uniqueAuthEntityJson = makeUnique(authEntityJson);
        uniqueAuthEntityJson = uniqueAuthEntityJson.filter(
            (item) => item.EntID && item.EntID.trim()?.toLowerCase() !== "null"
        );

        const authEntityNames = uniqueAuthEntityJson.map((item) => item.AuthEntity);
        const ownerEntityNames = ownerEntityJson.map((item) => item.OwnerEntity);

        if (ownerEntityJson.length > 0) {
            axiosInterceptor({
                url: AUTH.AddAuthByEntity,
                data: {
                    authEntityName: "Feature",
                    authEntityJson: JSON.stringify(uniqueAuthEntityJson),
                    ownerEntityName: featureProps.ownerEntityName,
                    ownerEntityJson: JSON.stringify(ownerEntityJson)
                },
                allowShowLoader: true,
                setFetchData: (addAuthByEntityApiResponse: unknown, status?: string) => {
                    if (status !== "200" || addAuthByEntityApiResponse === undefined) return;

                    const payload: IFnCreateForensiclog = {
                        logType: "UserAction",
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Auth,
                        SubGroupName: LogSubGroupName.Auth,
                        LogName: LogName.AuthorizeFeatures,
                        actionObject: {
                            entityType: "Authorize User",
                            features: authEntityNames.join(", "),
                            entitiesList: ownerEntityNames.join(", ")
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    };
                    FnCreateForensiclog(payload);
                }
            }, statusBarContext);
        }
    };

    const handleSearchDeviceEntities = async (isNext: boolean = false, isRegex: boolean = false) => {
        if (searchText.length > 0 && treeData) {
            const historyToExclude = isNext ? searchHistory : [];
            let foundedNode = FnSearchKeywordInLocalTree(
                searchText,
                treeData,
                historyToExclude,
                [],
                isRegex
            );

            if (foundedNode && foundedNode.foundNode) {
                const parentNodeKeys = foundedNode.parentNodes.map((item: ITreeNode) => item.key);
                setDefaultExpandedKeys([...parentNodeKeys, ...defaultExpandedKeys]);
                setDefaultSelectedKeys([foundedNode.foundNode.key]);
                setSearchHistory(prev => isNext ? [...prev, foundedNode.foundNode!.key] : [foundedNode.foundNode!.key]);
            } else {
                if (!isNext) {
                    setSearchHistory([]);
                }
                const message = isNext ? "No next node found" : "No matching node found";
                alert(message);
            }
        }
    };

    const handleCheckedNode = (
        checked: Key[] | { checked: Key[]; halfChecked: Key[] },
        info: CheckInfo<ITreeNode>
    ) => {
        if (!treeData) return;

        let checkedNodes: ITreeNode[] = checkedNodeData || [];
        setDefaultCheckedKeys(checked as Key[]);

        if (info.checked) {
            checkedNodes.push({ ...info.node, checked: true });
            setCheckedNodeData(checkedNodes);
        } else {
            const nodesToUncheck = FnGetAllChildNodes(info.node);
            if (info.node.parentEntID) {
                const checkedDataobj: ITreeNode[] = [];
                checkedNodes.forEach((item) => {
                    if (nodesToUncheck.find((subitem) => subitem.NodeEntID === item.NodeEntID)) {
                        item.checked = false;
                    }
                    checkedDataobj.push(item);
                });
                setCheckedNodeData(checkedDataobj);
                checkedNodes = checkedDataobj;
            }
        }

        if (!info.node.parentEntID && treeData && info.node.children.length) {
            const children = info.node.children;
            const childrenArr: ITreeNode[] = [];
            for (let index = 0; index < children.length; index++) {
                const element = children[index];
                element.checked = info.checked;
                childrenArr.push(element);
            }
            setCheckedNodeData(childrenArr);
            checkedNodes = childrenArr;
        }

        if (!info.node.NodeEntID && info.node.children) {
            for (let index = 0; index < info.node.children.length; index++) {
                const element = info.node.children[index];
                checkedNodes.push({ ...element, checked: info.checked });
            }
        }

        saveFeatureAuthorization(checkedNodes || [], info);
    };

    const isWaitingForselectedCard = Boolean(selectedCardId) && loadedUserId !== selectedCardId;
    const shouldShowLoading = isLoadingFeatures || isWaitingForselectedCard;
    const shouldShowNoData = !shouldShowLoading && loadedUserId === selectedCardId && !treeData.length;

    // Notify parent after feature card content finishes loading/rendering.
    useEffect(() => {
        if (!featureProps.isCollapsed && !shouldShowLoading) {
            featureProps.onContentReady?.();
        }
    }, [featureProps.isCollapsed, shouldShowLoading, treeData.length, featureProps]);

    return (
        <div className="nz-feature-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-feature-card-status-message">Loading...</div>
            ) : treeData.length ? (
                <div className="nz-features-tree-tree">
                    <div className="nz-features-tree-search">
                        <SearchControl
                            uniqueName={`${uniqueName}-tree-search`}
                            isShowFilterControl={false}
                            lensDirty={searchText.length > 0}
                            filterDirty={false}
                            searchValueChange={(value: string) => {
                                setSearchText(value);
                                setSearchHistory([]);
                            }}
                            handleLensMouse={() => {
                                const isNext = searchHistory.length > 0;
                                handleSearchDeviceEntities(isNext);
                            }}
                            hideRightMouseMenu={true}
                            searchInputValue={searchText}
                            handleFilterMouse={() => { }}
                        />
                        <div className="nz-features-tree-tree-div">
                            <TreeForHierarchicalDataContainer
                                {...treeProps}
                                apiData={treeData}
                                defaultExpandedKeys={defaultExpandedKeys}
                                defaultSelectedKeys={defaultSelectedKeys}
                                defaultCheckedKeys={defaultCheckedKeys}
                                defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                                handleAIClick={() => { }}
                                handleNodeCheck={(
                                    checked: Key[] | { checked: Key[]; halfChecked: Key[] },
                                    info: CheckInfo<ITreeNode>
                                ) => {
                                    handleCheckedNode(checked, info);
                                }}
                                handleNodeSelect={(
                                    _selectedKeys: Key[],
                                    info: ISelectedNodeInfo,
                                    expandedKeys: Key[]
                                ) => {
                                    setDefaultExpandedKeys(expandedKeys);
                                    setDefaultSelectedKeys([info.node.key]);
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : shouldShowNoData ? (
                <div className="nz-feature-card-status-message">No Data Found</div>
            ) : null}
        </div>
    );
};

export { Feature };

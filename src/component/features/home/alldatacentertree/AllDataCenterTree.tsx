
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { EventDataNode, Key } from 'rc-tree/lib/interface'
import { CheckInfo } from 'rc-tree/lib/Tree'

import '../../allcss/home/AllDataCenterTree.css'

import { useExplorerTreeContext } from '../../../shared/context/hooks/ExplorerTreeHooks'
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks'

import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely'
import { FnSearchKeywordInLocalTree } from '../../../shared/allcommon/FnSearchKeywordInLocalTree'
import { FnDeepClone } from '../../../shared/allcommon/basic/FnDeepClone'
import { FnGetSessionVariableFromStorage } from '../../../shared/allcommon/basic/FnGetSessionVariableFromStorage'
import { FnFilterTenantDataWithDevices } from './FnFilterTenantDataWithDevices'
import { FnFindNodeAndParents } from '../../../shared/allcommon/tablegrid/FnFindNodeAndParents'
import { FnConvertFlatDataToHierarchyData } from '../../../shared/allcommon/tree/FnConvertFlatDataToHierarchyData'
import { FnGetSelectionFromHierarchy } from '../../../shared/allcommon/tree/FnGetSelectionFromHierarchy'
import { FnUpdateNodeWithTitleAndIcon } from '../../../shared/allcommon/tree/FnUpdateNodeWithTitleAndIcon'
import { FnUpdateTreeNodeBasedOnKey } from '../../../shared/allcommon/tree/FnUpdateTreeNodeBasedOnKey'
import { ReuseDataForFeatures } from '../../../shared/alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer'
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor'
import { TENANT } from '../../../shared/interceptors/EndPoints'

import { IAllTenantRecords } from '../../../shared/allinterface/IGoogleMap'
import { IAllDataCenterTree, IAllDcTreeApiData } from '../../allinterface/home/IAllDataCenterTree'
import { IActionImageForSubMenu } from '../../../shared/allinterface/basic/IActionImageList'
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from '../../../shared/allinterface/tree/ITreeControl'
import { IFeatureTree, ITreeForFlatDataContainer } from '../../../shared/allinterface/tree/ITreeForFlatDataContainer'

import { FilterFormContainer } from '../../../shared/searchfilter/filterformcontainer/FilterFormContainer'
import { SearchControl } from '../../../shared/searchfilter/searchcontrol/SearchControl'
import { TreeControl } from '../../../shared/tree/treecontrol/TreeControl'

// Sorts tree nodes by Name (A-Z) recursively for consistent hierarchy rendering.
function sortTreeNodesByName(nodes: ITreeNode[]): ITreeNode[] {
    return [...nodes]
        .map((node) => ({
            ...node,
            children: node.children?.length ? sortTreeNodesByName(node.children) : node.children,
        }))
        .sort((firstNode, secondNode) =>
            (firstNode.Name ?? "").localeCompare(secondNode.Name ?? "", undefined, { sensitivity: "base" })
        );
}

const AllDataCenterTree = (allDataCenterTreeProps: IAllDataCenterTree) => {
    const [featureTreeProps, setFeatureTreeProps] = useState<IFeatureTree | null>(null);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [apiData, setApiData] = useState<IAllDcTreeApiData | null>(null);
    const [isShowFilterForm, setIsShowFilterForm] = useState<boolean>(false);
    const [isFilterChange, setIsFilterChange] = useState<boolean>(false);

    const [treeData, setTreeData] = useState<ITreeNode[]>();
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null)

    const [treeContainerFlatDataProps, setTreeContainerFlatDataProps] = useState<ITreeForFlatDataContainer>();
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    const [selectedRadioValue, setSelectedRadioValue] = useState<"AllSites" | "TenantsBySite" | "SitesByTenant">("AllSites");

    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();
    const explorerTreeContext = useExplorerTreeContext();

    // Applies hierarchy selection rules and renders only visible nodes for the flat tree.
    const displayOnlyVisibleNode = async (
        hierarchyData: ITreeNode[],
        treeProps: IFeatureTree,
        selectedFeatureId: string,
        selectedExplorerNode: ISelectedNodeInfo | null = null,
        treeContainerFlatProps: ITreeForFlatDataContainer | null = null,
        selectedRadio: "AllSites" | "TenantsBySite" | "SitesByTenant" = "AllSites"
    ) => {
        if (treeProps && treeContainerFlatProps) {
            const explorerSelection = selectedExplorerNode ?? treeContainerFlatProps.selectedNodeExplorer ?? null;
            const result = await FnGetSelectionFromHierarchy(
                hierarchyData,
                selectedFeatureId,
                treeProps,
                explorerSelection,
                statusBarContext,
                sessionContext.SessionList,
                selectedRadio === "SitesByTenant"
            );
            if (result) {
                setDefaultExpandedKeys(result.expandKeys);
                const newSelectedNodeKeys: Key[] = selectedRadio === "AllSites"
                    ? [result.originalTreeData[0].key]
                    : [result.selectedNode?.node.key ?? result.originalTreeData[0].key];
                const selectednode: ISelectedNodeInfo = selectedRadio === "AllSites"
                    ? { event: "auto-select", node: result.originalTreeData[0], selected: true, selectedNodes: [] }
                    : {
                        event: "auto-select",
                        node: result.selectedNode?.node ?? result.originalTreeData[0],
                        selected: true,
                        selectedNodes: []
                    };
                setDefaultSelectedKeys([...newSelectedNodeKeys]);
                setDefaultSelectedNodeInfo(selectednode || null);
                if (allDataCenterTreeProps.handleNodeSelect && selectednode) {
                    allDataCenterTreeProps.handleNodeSelect(newSelectedNodeKeys, selectednode, result.expandKeys, hierarchyData, selectedRadio);
                }
                const updatedTree = FnUpdateNodeWithTitleAndIcon(hierarchyData, treeProps, selectedFeatureId)
                setTreeData(updatedTree);
            }
        }
    }

    const treeDataRef = useRef(treeData);
    const selectedRadioRef = useRef(selectedRadioValue);
    const displayOnlyVisibleNodeRef = useRef(displayOnlyVisibleNode);

    useEffect(() => {
        treeDataRef.current = treeData;
        return () => {
            treeDataRef.current = [];
        }
    }, [treeData])

    useEffect(() => {
        selectedRadioRef.current = selectedRadioValue;
    }, [selectedRadioValue])

    // Updates status bar counts when the selected all-DC tree node changes.
    useEffect(() => {
        if (!defaultSelectedNodeInfo?.node || !allDataCenterTreeProps.updateStatusBarData) return;
        const node = defaultSelectedNodeInfo.node;
        const nodeType = node.NodeType?.toLowerCase() ?? "";
        const childCount = node.children?.length ?? 0;
        const sendStatusBarData = (data: Record<string, string | number>) => {
            allDataCenterTreeProps.updateStatusBarData && allDataCenterTreeProps.updateStatusBarData(JSON.stringify(data), true);
        };
        if (nodeType === "alldatacenters" && childCount > 0) {
            sendStatusBarData(
                selectedRadioRef.current === "TenantsBySite"
                    ? { Sites: childCount }
                    : { Tenants: childCount }
            );
        }
        else if (nodeType === "site" && childCount > 0 && node.Name) {
            sendStatusBarData({
                Site: node.Name,
                Tenants: childCount
            });
        }
        else if (nodeType === "tenant" && childCount > 0 && node.Name) {
            sendStatusBarData({
                Tenant: node.Name,
                Sites: childCount
            });
        }
        else if (treeDataRef.current) {
            const parentNodes = FnFindNodeAndParents(treeDataRef.current, node.key);
            if (!parentNodes) return;
            if (selectedRadioRef.current === "TenantsBySite") {
                const parentSite = parentNodes.find(p => p.NodeType?.toLowerCase() === "site");
                sendStatusBarData({
                    Site: parentSite?.Name ?? "",
                    Tenant: node.Name ?? ""
                });
            } else {
                const parentTenant = parentNodes.find(p => p.NodeType?.toLowerCase() === "tenant");
                sendStatusBarData({
                    Tenant: parentTenant?.Name ?? "",
                    Site: node.Name ?? ""
                });
            }
        }
    }, [
        defaultSelectedNodeInfo?.node,
        selectedRadioRef.current
    ]);

    // Rebuilds hierarchy tree when tenant API data or filter radio changes.
    useEffect(() => {
        const handleAPIDataChange = async () => {
            if (!treeContainerFlatDataProps || !apiData) return;
            try {
                const cloneData = FnFilterTenantDataWithDevices(FnDeepClone(apiData), selectedRadioRef.current === "AllSites");
                const hierarchyData = await FnConvertFlatDataToHierarchyData(
                    cloneData,
                    null,
                    treeContainerFlatDataProps.featureId,
                    selectedRadioRef.current,
                    undefined,
                    true
                );
                const sortedHierarchyData = hierarchyData?.length ? sortTreeNodesByName(hierarchyData) : hierarchyData;
                if (sortedHierarchyData && sortedHierarchyData.length > 0 && treeContainerFlatDataProps.featureTreeProps && treeContainerFlatDataProps.featureId && !treeContainerFlatDataProps.featureTreeProps.openAllNodes) {
                    await displayOnlyVisibleNodeRef.current(
                        sortedHierarchyData,
                        treeContainerFlatDataProps.featureTreeProps,
                        treeContainerFlatDataProps.featureId,
                        null,
                        treeContainerFlatDataProps,
                        selectedRadioValue
                    );
                } else if (sortedHierarchyData?.length) {
                    const updatedTree = FnUpdateNodeWithTitleAndIcon(sortedHierarchyData, treeContainerFlatDataProps.featureTreeProps, treeContainerFlatDataProps.featureId)
                    setTreeData(updatedTree);
                } else {
                    allDataCenterTreeProps.handleClearNodeSelection?.();
                    setTreeData([])
                    allDataCenterTreeProps.handleShowUserMessage?.("Data center details not found to display.")
                }
            } catch (error) {
                console.error("Failed to convert all DC tree API data", error);
                allDataCenterTreeProps.handleShowUserMessage?.("Data center details not found to display.");
                setTreeData([]);
            }
        }
        handleAPIDataChange();
    }, [apiData, featureTreeProps, allDataCenterTreeProps.featureId, treeContainerFlatDataProps])

    const handleKebabMenuSelect = useCallback((selectedItem: IActionImageForSubMenu) => {
        treeContainerFlatDataProps?.handleKebabMenuSelect?.(selectedItem);
    }, [treeContainerFlatDataProps]);

    const handleSelectedKeyChange = useCallback(async (currentTreeData: ITreeNode[]) => {
        if (!treeContainerFlatDataProps) return;
        try {
            const updatedTreeData = await FnUpdateTreeNodeBasedOnKey(
                currentTreeData,
                defaultSelectedKeys[0],
                treeContainerFlatDataProps.featureTreeProps.hideCopyIcon === false,
                treeContainerFlatDataProps.featureTreeProps.hideKebabMenu === false,
                treeContainerFlatDataProps,
                treeContainerFlatDataProps.selectedNodeExplorer,
                handleKebabMenuSelect
            );
            setTreeData([...updatedTreeData]);
        } catch (error) {
            console.error("Failed to update tree node for selected key", error);
        }
    }, [defaultSelectedKeys, treeContainerFlatDataProps, handleKebabMenuSelect]);

    // Refreshes kebab/copy icons when default selected key changes.
    useEffect(() => {
        if (defaultSelectedKeys && defaultSelectedKeys.length > 0 && treeDataRef.current && (!featureTreeProps?.hideCopyIcon || !featureTreeProps?.hideKebabMenu)) {
            handleSelectedKeyChange(treeDataRef.current);
        }
    }, [defaultSelectedKeys, handleSelectedKeyChange, featureTreeProps]);

    function handleNodeCheck(checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>): void {
        allDataCenterTreeProps.handleNodeCheck?.(checked, info);
    }

    // Expands node children from cached original tree data.
    async function handleNodeExpand(expandedNodeKeys: Key[], info: IExpandedNodeInfo) {
        if (!info?.node || !treeContainerFlatDataProps || !treeData) return;
        setDefaultExpandedKeys(expandedNodeKeys);
    }

    async function handleNodeSelect(selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[]) {
        if (treeContainerFlatDataProps && treeData && (!featureTreeProps?.hideCopyIcon || !featureTreeProps.hideKebabMenu)) {
            const updatedTreeData = await FnUpdateTreeNodeBasedOnKey(treeData, defaultSelectedKeys[0], false, false, treeContainerFlatDataProps, null);
            setTreeData([...updatedTreeData]);
        }
        if (expandedNodeKeys) {
            setDefaultExpandedKeys(expandedNodeKeys);
        }
        setDefaultSelectedKeys([info.node.key]);
        setDefaultSelectedNodeInfo(info);
        allDataCenterTreeProps.handleNodeSelect?.(selectedKeys, info, defaultExpandedKeys, treeData, selectedRadioValue);
    }

    // Initializes flat tree props and loads tenant hierarchy for the active feature.
    useEffect(() => {
        if (!allDataCenterTreeProps.featureId) return;
        const featureProps: IFeatureTree = {
            hideKebabMenu: true,
            allowCheckbox: false,
            allowIcon: true,
            hideCopyIcon: true,
            reuseFromCache: ReuseDataForFeatures.includes(allDataCenterTreeProps.featureId),
            instanceName: "all_dc_tree",
            isAllowDrag: false,
            isAllowDrop: false,
            allowCheckStrictly: false,
            allowInternalDrag: false,
            multiRootNode: false,
            openAllNodes: false,
            allowCustomCheck: false,
            disableSelection: false
        }
        setFeatureTreeProps(featureProps);
        const handleFeatureChange = async () => {
            const treeContainerFlatProps: ITreeForFlatDataContainer = {
                uniqueName: `${allDataCenterTreeProps.uniqueName}-dce-flat`,
                featureId: allDataCenterTreeProps.featureId,
                featureTreeProps: featureProps,
                flatAPIData: undefined
            }
            setTreeContainerFlatDataProps(treeContainerFlatProps)
            const sessionData = FnGetSessionVariableFromStorage("Location", "SiteID", sessionContext.SessionList);
            if (!sessionData?.length) return;
            const handleGetAllTenantsApiResponse = (getAllTenantsApiResponse: unknown, status?: string) => {
                if (status !== "200") return;
                if (!getAllTenantsApiResponse || typeof getAllTenantsApiResponse !== "object" || !('tenantJson' in getAllTenantsApiResponse)) {
                    return;
                }
                try {
                    const parsedData = FnParseJsonSafely<IAllTenantRecords[]>(getAllTenantsApiResponse.tenantJson as string);
                    if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].SitesVsTenants) {
                        explorerTreeContext.setAllTenantRecords(parsedData[0])
                        setApiData({ Tenants: parsedData[0].SitesVsTenants });
                    }
                } catch (error) {
                    console.error("Failed to parse all tenants API response", error);
                }
            }

            await axiosInterceptor({
                url: TENANT.GetAllTenants,
                data: {
                    siteID: sessionData[0].SessionValue?.length ? sessionData[0].SessionValue : undefined
                },
                setFetchData: handleGetAllTenantsApiResponse
            }, statusBarContext).catch((error) => {
                console.error("Failed to load all tenants for DC tree", error);
            });
        }
        handleFeatureChange();
    }, [allDataCenterTreeProps.featureId, allDataCenterTreeProps.uniqueName])

    const handleAIClick = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => {
        if (allDataCenterTreeProps.handleAIClick) {
            allDataCenterTreeProps.handleAIClick(event, actionCode);
        } else {
            alert("Handle Action Image click")
        }
    }

    const handleFilterActionClick = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => {
        if (treeContainerFlatDataProps && selectedRadioValue) {
            treeContainerFlatDataProps.isSiteByTenant = selectedRadioValue === "SitesByTenant";
            setTreeContainerFlatDataProps(treeContainerFlatDataProps);
            if (isShowFilterForm) {
                if (isFilterChange && apiData) {
                    setApiData({ ...apiData });
                }
                setIsFilterChange(false);
            }
            setIsShowFilterForm(!isShowFilterForm);
        }
    }

    const handleFilterFormChange = (value: string, name: string) => {
        if (value && treeContainerFlatDataProps) {
            setSelectedRadioValue(value as "AllSites" | "TenantsBySite" | "SitesByTenant");
            setIsFilterChange(true);
        }
    }

    const handleFilterClick = () => {
        if (isShowFilterForm) {
            if (isFilterChange && apiData) {
                setApiData({ ...apiData });
            }
            setIsFilterChange(false);
        }
        setIsShowFilterForm(!isShowFilterForm);
    }

    // Searches visible tree first, then falls back to cached original tree data.
    const handleKeywordSearch = async (
        searchText: string,
        searchAllWord: boolean = false,
        isNext: boolean = false,
        useRegex?: boolean
    ) => {
        if (!treeData || !searchText?.trim()) return;
        try {
            const isRegex = useRegex ?? false;
            const historyToExclude = isNext ? searchHistory : [];
            let searchInUserTree = FnSearchKeywordInLocalTree(
                searchText,
                treeData,
                historyToExclude,
                [],
                isRegex
            );

            if (searchInUserTree?.foundNode) {
                const parentNodeKeys = searchInUserTree.parentNodes.map((item: ITreeNode) => item.key);
                if (featureTreeProps && parentNodeKeys.length > 0 && allDataCenterTreeProps.featureId) {
                    setTreeData(treeData);
                }
                setDefaultExpandedKeys([...parentNodeKeys, ...defaultExpandedKeys]);
                setDefaultSelectedKeys([searchInUserTree.foundNode.key]);
                setSearchHistory(prev => isNext ? [...prev, searchInUserTree.foundNode!.key] : [searchInUserTree.foundNode!.key]);
            } else {
                if (!isNext) {
                    setSearchHistory([]);
                }
                const message = isNext ? "No next node found" : "No matching node found";
                if (allDataCenterTreeProps.handleShowUserMessage) {
                    allDataCenterTreeProps.handleShowUserMessage(message);
                } else {
                    alert(message);
                }
            }
        } catch (error) {
            console.error("Failed to search keyword in all DC tree", error);
        }
    }

    const handleNodeDoubleClick = (
        e: React.MouseEvent<HTMLSpanElement>,
        node: EventDataNode<ITreeNode>
    ) => {
        e.stopPropagation();
        if (node.NodeType?.toLowerCase() === "site" && node.NodeEntID) {
            allDataCenterTreeProps.selectDcExplorer?.(node.NodeEntID, undefined, undefined, undefined, node.DateFormat)
        }
    };

    if (treeData === undefined) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }

    if (!treeData || !treeData.length) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>;
    }

    return (
        <div className='nz-all-dc-tree-container'>
            <div className='nz-dce-search-container'>
                {!isShowFilterForm ? <SearchControl uniqueName={`${allDataCenterTreeProps.uniqueName}-search`}
                    isShowFilterControl={true}
                    lensDirty={(searchText || "")?.length > 0}
                    filterDirty={isShowFilterForm}
                    searchInputValue={searchText || ""}
                    hideSearchControl={isShowFilterForm}
                    hideRightMouseMenu={isShowFilterForm}
                    searchValueChange={(value: string) => {
                        setSearchText(value);
                        setSearchHistory([]);
                    }}
                    handleFilterMouse={() => {
                        handleFilterClick();
                    }}
                    handleLensMouse={(selectedCondion: "AND" | string = "AND") => {
                        if (searchText && (searchText || "").length > 0) {
                            const isNext = searchHistory.length > 0;
                            handleKeywordSearch(searchText, selectedCondion === "AND", isNext, true);
                        }
                    }} /> : <></>}
            </div>
            <div className={`nz-dce-tree-container${isShowFilterForm ? " nz-dce-filter-form" : ""}`}>
                {featureTreeProps && treeContainerFlatDataProps && treeData && treeData.length > 0 ? <TreeControl
                    uniqueName={treeContainerFlatDataProps.uniqueName}
                    treeData={treeData}
                    defaultExpandedKeys={defaultExpandedKeys}
                    defaultSelectedKeys={defaultSelectedKeys}
                    defaultCheckedKeys={[]}
                    defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                    allowAPICallOnExpand={treeContainerFlatDataProps.allowAPICallOnExpand}
                    allowAdd={allDataCenterTreeProps.allowAdd}
                    allowEdit={allDataCenterTreeProps.allowEdit}
                    allowDelete={allDataCenterTreeProps.allowDelete}
                    allowCheckStrictly={featureTreeProps.allowCheckStrictly}
                    allowCheckbox={featureTreeProps.allowCheckbox}
                    allowDefaultExpandAll={featureTreeProps.openAllNodes}
                    allowIcon={featureTreeProps.allowIcon}
                    allowInternalDrag={featureTreeProps.allowInternalDrag}
                    allowMultiple={false}
                    className={`nz-dce-tree-for-flat-data`}
                    disableSelection={featureTreeProps.disableSelection}
                    handleAIClick={handleAIClick}
                    handleNodeCheck={handleNodeCheck}
                    handleNodeExpand={handleNodeExpand}
                    handleNodeSelect={handleNodeSelect}
                    handleNodeDoubleClick={handleNodeDoubleClick}
                /> : !isShowFilterForm ? <div className="nz-wh-100 nz-d-flex-hv-left">Data center sites not found to display</div> : <></>}
                {isShowFilterForm &&
                    <FilterFormContainer uniqueName={`all-dc-filter-form`}
                        allowHeader={true}
                        controls={[]}
                        allowFilterTree={false}
                        headerText='Select Filter and Data Center'
                        customValue={selectedRadioValue}
                        isFilterChange={isFilterChange}
                        iconToShow={"select"}
                        handleActionImageClick={handleFilterActionClick}
                        handleFilterFormChange={handleFilterFormChange}
                    />
                }
            </div>
        </div>
    )
}
export { AllDataCenterTree }

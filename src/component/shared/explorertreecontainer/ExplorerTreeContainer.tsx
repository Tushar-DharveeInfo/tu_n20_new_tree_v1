import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EventDataNode, Key } from "rc-tree/lib/interface";
import { NodeDragEventParams } from "rc-tree/lib/contextTypes";

import '../allcss/ExplorerTreeContainer.css'

import { useStatusBarContext } from "../context/hooks/StatusBarHooks";

import { FnOrderSubNodes } from "../../appcontainer/allcommon/FnOrderSubNodes";
import { FnGetNodeTypeCountsFromNodeAsString } from "../../appcontainer/allcommon/FnGetNodeTypeCountsFromNodeAsString";
import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { FEnums, RightMouseMenuTreeNode } from "../../constants/Feature";
import { FnBuildUrlForFind, FnBuildUrlForFindHierarchy } from "../allcommon/FnBuildSessionPayloadForFind";
import { FnSearchKeywordInLocalTree } from "../allcommon/FnSearchKeywordInLocalTree";
import { FnGetNodeDetailsBaseOnEntID } from "../allcommon/basic/FnGetNodeDetailsBaseOnEntID";
import { FnFindNodeAndParents } from "../allcommon/tablegrid/FnFindNodeAndParents";
import { FnConvertHierarchicalDataToTree } from "../allcommon/tree/FnConvertHierarchicalDataToTree";
import { FnGetAllKeysOfTree } from "../allcommon/tree/FnGetAllKeysOfTree";
import { FnUpdateTreeNodeBasedOnKeyForHierarchicalData } from "../allcommon/tree/FnUpdateTreeNodeBasedOnKeyForHierarchicalData";
import { axiosInterceptor, axiosInterceptorForPowerBi } from "../interceptors/Interceptor";
import { AUDIT, BS, CLOUD, EXPAPI, EXPLORER, KWD, MISC, PROPERTY, VIRTUAL } from "../interceptors/EndPoints";

import { IActionImageForSubMenu } from "../allinterface/basic/IActionImageList";
import { IExplorerTreeContainer, IPowerBiReportItem } from "../allinterface/IExplorerTreeContainer";
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from "../allinterface/tree/ITreeControl";
import { IConvertedTreeResponse, IHierarchicalApiData, ITreeForHierarchicalDataContainer } from "../allinterface/tree/ITreeForHierarchicalDataContainer";

import { SearchControl } from "../searchfilter/searchcontrol/SearchControl";
import { YesNoFormContainer } from "../basic/yesnoformcontainer/YesNoFormContainer";
import { TreeForHierarchicalDataContainer } from "../tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { FnGetExpApiUrlBasedOnEndPoint } from "../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint";
import { FnGetDeviceIdFromEntID } from "../../appcontainer/allcommon/FnGetDeviceIdFromEntID";
import { FindInInventoryVariables } from "../../appcontainer/alldefaultprops/DefaultPropsFeatureContainer";
import { useSessionContext } from "../context/hooks/SessionHooks";
import { FnGetParentHierarchy } from "../../appcontainer/allcommon/FnGetParentHierarchy";
import { FnCopyToClipboard } from "../allcommon/basic/FnCopyToClipboard";

type IHierarchyJsonField = "hierarchyJson" | "bsJson" | "data";

// Returns true when converted tree response has required hierarchy fields.
function isConvertedTreeResponse(value: IConvertedTreeResponse | undefined): value is IConvertedTreeResponse {
    return typeof value === "object" &&
        value !== null &&
        "treeData" in value &&
        "expandedKeys" in value &&
        "selectedKey" in value &&
        "selectedNode" in value;
}

// Matches legacy parsed hierarchy payload guard used before tree conversion.
function shouldUseParsedHierarchyData(parsedData: unknown): boolean {
    return !!parsedData && !!typeof (parsedData as Record<string, unknown>).object;
}

// Parses hierarchy JSON from API response when status is 200.
function parseHierarchyApiJson(
    response: unknown,
    status: string | undefined,
    jsonField: IHierarchyJsonField
): IHierarchicalApiData | null {
    if (status !== "200") {
        return null;
    }
    if (!response || typeof response !== "object" || !(jsonField in response)) {
        return null;
    }
    const jsonString = (response as Record<string, unknown>)[jsonField];
    if (typeof jsonString !== "string") {
        return null;
    }
    try {
        const parsedData = FnParseJsonSafely(jsonString);
        if (shouldUseParsedHierarchyData(parsedData)) {
            return parsedData as IHierarchicalApiData;
        }
    } catch (error) {
        console.error(`Failed to parse ${jsonField}:`, error);
    }
    return null;
}

const ExplorerTreeContainer = (explorerTreeContainerProps: IExplorerTreeContainer) => {
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
    const [searchText, setSearchText] = useState<string>();
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [treeData, setTreeData] = useState<ITreeNode[]>();
    const [searchParams] = useSearchParams();
    const [defaultSelectedNodeKeys, setDefaultSelectedNodeKeys] = useState<Key[]>([]);
    const [defaultExpandedNodeKeys, setDefaultExpandedNodeKeys] = useState<Key[]>([]);
    const [defaultCheckedNodeKeys, setDefaultCheckedNodeKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo>();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const treeforhierarchicaldatacontainerProps: ITreeForHierarchicalDataContainer = {
        uniqueName: `${explorerTreeContainerProps.uniqueName}`,
        apiData: undefined,
        featureId: explorerTreeContainerProps.featureId,
        featureTreeProps: {
            instanceName: explorerTreeContainerProps.featureId === FEnums.PowerBI.toString() ? "feature-power-bi-tree" : "feature-explorer-tree",
            allowCheckbox: false,
            allowIcon: true,
            openAllNodes: explorerTreeContainerProps.featureId === FEnums.PowerBI.toString() ? false : true,
            hideKebabMenu: false,
            isAllowDrop: explorerTreeContainerProps.allowDrop ?? false,
            isAllowDrag: explorerTreeContainerProps.allowDrag ?? false,
            allowInternalDrag: explorerTreeContainerProps.allowInternalDrag ?? false,
            multiRootNode: explorerTreeContainerProps.featureId === FEnums.PowerBI.toString() ? true : false,
        },
        allowGenerateTreeData: false,
        allowUseParentIDForKey: explorerTreeContainerProps.featureId === FEnums.ModelBusinessService.toString() || explorerTreeContainerProps.featureId === FEnums.ManageBusinessService.toString()
    };

    const prevApiDataRef = useRef<unknown>(null);
    const treeDataRef = useRef<ITreeNode[]>(undefined);

    // Converts incoming apiData prop into hierarchical tree state.
    useEffect(() => {
        if (!explorerTreeContainerProps.apiData) return;
        if (prevApiDataRef.current === explorerTreeContainerProps.apiData) return;
        prevApiDataRef.current = explorerTreeContainerProps.apiData;
        const handleApiDataChange = async () => {
            const deviceId = searchParams.get('deviceid');
            const convertedTreeData: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(
                explorerTreeContainerProps.apiData as IHierarchicalApiData,
                treeforhierarchicaldatacontainerProps,
                deviceId || explorerTreeContainerProps.defaultSelectedNodeKey?.toString()
            );
            if (isConvertedTreeResponse(convertedTreeData)) {
                const { treeData, expandedKeys, selectedNode } = convertedTreeData;
                let updatedTreeData = treeData;
                if (selectedNode
                    && !treeforhierarchicaldatacontainerProps.featureTreeProps.hideCopyIcon
                    && !treeforhierarchicaldatacontainerProps.featureTreeProps.hideKebabMenu) {
                    updatedTreeData = await FnUpdateTreeNodeBasedOnKeyForHierarchicalData(
                        treeData,
                        selectedNode.key,
                        treeforhierarchicaldatacontainerProps.featureTreeProps.hideCopyIcon === false,
                        treeforhierarchicaldatacontainerProps.featureTreeProps.hideKebabMenu === false,
                        treeforhierarchicaldatacontainerProps,
                        treeforhierarchicaldatacontainerProps.selectedNodeExplorer,
                        handleKebabMenuSelect
                    )
                }
                const keysToExpand = treeforhierarchicaldatacontainerProps.featureTreeProps.openAllNodes
                    ? FnGetAllKeysOfTree(updatedTreeData)
                    : expandedKeys;
                setTreeData(updatedTreeData);
                setDefaultExpandedNodeKeys(keysToExpand);
                if (selectedNode) {
                    setDefaultSelectedNodeKeys([selectedNode.key]);
                    const nodeInfo: ISelectedNodeInfo = {
                        event: "auto-select",
                        node: selectedNode,
                        selected: true,
                        selectedNodes: []
                    };
                    setDefaultSelectedNodeInfo(nodeInfo);
                    explorerTreeContainerProps.handleNodeSelect?.(
                        [selectedNode.key],
                        nodeInfo,
                        keysToExpand,
                        updatedTreeData
                    );
                }
            } else {
                setTreeData([]);
            }
        };
        handleApiDataChange();
    }, [
        explorerTreeContainerProps.apiData,
        explorerTreeContainerProps.featureId,
        explorerTreeContainerProps.defaultSelectedNodeKey,
        explorerTreeContainerProps.handleNodeSelect,
        explorerTreeContainerProps.handleKebabMenuSelect,
        searchParams.get('deviceid')
    ]);



    // Mirrors treeData into a ref for status bar calculations.
    useEffect(() => {
        treeDataRef.current = treeData;
    }, [treeData])

    // Updates status bar counts when the selected node changes.
    useEffect(() => {
        if (defaultSelectedNodeInfo?.node) {
            const sendStatusBarData = (data: Record<string, string | number | undefined>) => {
                explorerTreeContainerProps.updateStatusBarData && explorerTreeContainerProps.updateStatusBarData(JSON.stringify(data), true);
            };
            let statusBarData: Record<string, string | number | undefined> = {
                "Sessions": defaultSelectedNodeInfo?.node.NodeType?.toLowerCase() === "auditsessions" ? defaultSelectedNodeInfo.node.children.length : 0
            }
            if (explorerTreeContainerProps.featureId === FEnums.AuditSession) {
                if (defaultSelectedNodeInfo?.node.NodeType?.toLowerCase() === "auditsessions" && defaultSelectedNodeInfo.node.children.length) {
                    const executed = defaultSelectedNodeInfo.node.children.filter((nodeItem) => nodeItem.AuditSessionStatus?.toLowerCase() === "executed");
                    statusBarData = {
                        ...statusBarData,
                        "Executed": executed.length
                    };
                }
                else if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "auditsessionnode") {
                    statusBarData = {
                        ...statusBarData,
                        "AuditSession": defaultSelectedNodeInfo.node.Name ?? undefined
                    };
                }
                sendStatusBarData(statusBarData);
            }
            else if (explorerTreeContainerProps.featureId === FEnums.InventoryCollection || explorerTreeContainerProps.featureId === FEnums.InventoryReconciliation) {
                if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "auditsessionnode") {
                    const parentNodes = treeDataRef.current ? FnFindNodeAndParents(treeDataRef.current, defaultSelectedNodeInfo.node.key) : [];
                    const rootNode = parentNodes?.find((nodeItem) => nodeItem.NodeType?.toLowerCase() === "auditsessions");
                    statusBarData = {
                        ...statusBarData,
                        "Sessions": rootNode?.children.length,
                        "AuditSession": defaultSelectedNodeInfo.node.Name ?? undefined
                    };
                }
                sendStatusBarData(statusBarData);
            }
            else if (explorerTreeContainerProps.featureId === FEnums.ModelBusinessService ||
                explorerTreeContainerProps.featureId === FEnums.ManageBusinessService
            ) {
                if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "businessservices" && defaultSelectedNodeInfo.node.children.length) {
                    const bsNodes = defaultSelectedNodeInfo.node.children.filter((nodeItem) => nodeItem.NodeType?.toLowerCase() === "businessservicenode");
                    statusBarData = {
                        "Services": bsNodes.length
                    };
                }
                else if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "businessservicenode" && defaultSelectedNodeInfo.node.children.length) {
                    // Counts sub-services and devices under a business service node.
                    function FnGetBusinessServiceNodeCounts(tree: ITreeNode[]): Record<string, string | number | undefined> {
                        let bsNodeCount = 0;
                        let deviceNodeCount = 0;
                        function traverse(nodes: ITreeNode[]) {
                            for (const node of nodes) {
                                if (node.NodeType?.toLowerCase() === "businessservicenode") {
                                    bsNodeCount++;
                                }
                                else if (node.NodeType?.toLowerCase() === "device") {
                                    deviceNodeCount++;
                                }
                                if (Array.isArray(node.children) && node.children.length > 0) {
                                    traverse(node.children);
                                }
                            }
                        }
                        traverse(tree);
                        if (bsNodeCount > 0 || deviceNodeCount > 0)
                            return {
                                "SubServices": bsNodeCount,
                                "Devices": deviceNodeCount
                            };
                        else
                            return {};
                    }
                    const servicesData = FnGetBusinessServiceNodeCounts(defaultSelectedNodeInfo.node.children)
                    statusBarData = {
                        "Service": defaultSelectedNodeInfo.node.Name ?? undefined,
                        ...servicesData
                    }
                }
                else if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "device" && defaultSelectedNodeInfo.node.parentEntID && treeDataRef.current) {
                    const parentNodes = FnGetNodeDetailsBaseOnEntID(treeDataRef.current, defaultSelectedNodeInfo.node.parentEntID);
                    statusBarData = {
                        "Service": parentNodes.parentNodeData?.node?.Name,
                        "Device": defaultSelectedNodeInfo.node.Name ?? undefined
                    }
                }
                sendStatusBarData(statusBarData);
            }
            else if (explorerTreeContainerProps.featureId === FEnums.VirtualCompute) {
                if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "virtualcompute" && defaultSelectedNodeInfo.node.children.length) {
                    statusBarData = {
                        "Hypervisors": defaultSelectedNodeInfo.node.children.length
                    }
                }
                else if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "hypervisornode") {
                    statusBarData = {
                        "Hypervisor": defaultSelectedNodeInfo.node.Name ?? undefined,
                        "Hosts": defaultSelectedNodeInfo.node.children.length
                    }
                }
                else {
                    statusBarData = {
                        "Host": defaultSelectedNodeInfo.node.Name ?? undefined
                    }
                }
                sendStatusBarData(statusBarData);
            }
            else if (explorerTreeContainerProps.featureId === FEnums.CloudCompute) {
                if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "cloudcompute" && defaultSelectedNodeInfo.node.children.length) {
                    statusBarData = {
                        "Providers": defaultSelectedNodeInfo.node.children.length
                    }
                }
                else if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "cloudprovidernode") {
                    statusBarData = {
                        "Provider": defaultSelectedNodeInfo.node.Name ?? undefined,
                        "Vms": defaultSelectedNodeInfo.node.children.length
                    }
                }
                else {
                    statusBarData = {
                        "Vm": defaultSelectedNodeInfo.node.Name ?? undefined
                    }
                }
                sendStatusBarData(statusBarData);
            }
            else if (explorerTreeContainerProps.featureId === FEnums.PowerBI && treeDataRef.current) {
                const statusBarString = FnGetNodeTypeCountsFromNodeAsString(treeDataRef.current, "Workspace|Report")
                sendStatusBarData(statusBarString)
            }
        }
    }, [defaultSelectedNodeInfo?.node, explorerTreeContainerProps.featureId])

    // Searches the local hierarchical tree and expands to the matched node.
    const handleKeywordSearch = async (
        searchText: string,
        searchAllWord: boolean = false,
        isNext: boolean = false,
        useRegex?: boolean
    ) => {
        if (treeData && searchText?.trim()) {
            const isRegex = useRegex ?? (
                explorerTreeContainerProps.featureId === FEnums.AssetPlacement ||
                explorerTreeContainerProps.featureId === FEnums.AuditSession ||
                explorerTreeContainerProps.featureId === FEnums.InboundAssetPlacement
            );
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
                const expandedKeys = [...parentNodeKeys, ...defaultExpandedNodeKeys];
                setDefaultExpandedNodeKeys(expandedKeys);
                setDefaultSelectedNodeKeys([foundedNode.foundNode.key]);
                setSearchHistory(prev => isNext ? [...prev, foundedNode.foundNode!.key] : [foundedNode.foundNode!.key]);
                if (explorerTreeContainerProps.handleNodeSelect) {
                    explorerTreeContainerProps.handleNodeSelect([foundedNode.foundNode.key],
                        {
                            event: "auto-select",
                            node: foundedNode.foundNode,
                            selected: true,
                            selectedNodes: []
                        },
                        expandedKeys, treeData
                    )
                }
            } else {
                if (!isNext) {
                    setSearchHistory([]);
                }
                const message = isNext ? "No next node found" : "No matching node found";
                setShowConfirm(true);
                setConfirmMessage(message);
                if (explorerTreeContainerProps.handleShowMessage) {
                    explorerTreeContainerProps.handleShowMessage(true, message);
                }
            }
        }
    }

    // Reloads hierarchy from feature API and reapplies tree conversion.
    const callApiToRefreshTree = () => {
        const handleApiDataChange = async (apiData: IHierarchicalApiData) => {
            const convertedTreeData: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(
                apiData,
                treeforhierarchicaldatacontainerProps,
                defaultSelectedNodeKeys?.length ? defaultSelectedNodeKeys[0].toString() : (searchParams.get('deviceid') || explorerTreeContainerProps.defaultSelectedNodeKey?.toString())
            );
            if (isConvertedTreeResponse(convertedTreeData)) {
                const { treeData, expandedKeys, selectedNode } = convertedTreeData;
                let updatedTreeData = treeData;
                if (selectedNode
                    && !treeforhierarchicaldatacontainerProps.featureTreeProps.hideCopyIcon
                    && !treeforhierarchicaldatacontainerProps.featureTreeProps.hideKebabMenu) {
                    updatedTreeData = await FnUpdateTreeNodeBasedOnKeyForHierarchicalData(
                        treeData,
                        selectedNode.key,
                        treeforhierarchicaldatacontainerProps.featureTreeProps.hideCopyIcon === false,
                        treeforhierarchicaldatacontainerProps.featureTreeProps.hideKebabMenu === false,
                        treeforhierarchicaldatacontainerProps,
                        treeforhierarchicaldatacontainerProps.selectedNodeExplorer,
                        handleKebabMenuSelect
                    )
                }
                const keysToExpand = treeforhierarchicaldatacontainerProps.featureTreeProps.openAllNodes
                    ? FnGetAllKeysOfTree(updatedTreeData)
                    : expandedKeys;
                setTreeData(updatedTreeData);
                setDefaultExpandedNodeKeys(keysToExpand);
                if (selectedNode) {
                    setDefaultSelectedNodeKeys([selectedNode.key]);
                    const nodeInfo: ISelectedNodeInfo = {
                        event: "auto-select",
                        node: selectedNode,
                        selected: true,
                        selectedNodes: []
                    };
                    setDefaultSelectedNodeInfo(nodeInfo);
                    explorerTreeContainerProps.handleNodeSelect?.(
                        [selectedNode.key],
                        nodeInfo,
                        keysToExpand
                    );
                }
            }
        };
        if (explorerTreeContainerProps.featureId === FEnums.CloudCompute) {
            axiosInterceptor({
                url: CLOUD.GetLocationHierarchy,
                data: {},
                setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                    const parsedData = parseHierarchyApiJson(getLocationHierarchyApiResponse, status, "hierarchyJson");
                    if (parsedData) {
                        handleApiDataChange(parsedData);
                    }
                }
            }, statusBarContext)
        }
        else if (explorerTreeContainerProps.featureId === FEnums.VirtualCompute) {
            axiosInterceptor({
                url: VIRTUAL.GetLocationHierarchy,
                data: {},
                setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                    const parsedData = parseHierarchyApiJson(getLocationHierarchyApiResponse, status, "hierarchyJson");
                    if (parsedData) {
                        handleApiDataChange(parsedData);
                    }
                }
            }, statusBarContext)
        }
        else if (explorerTreeContainerProps.featureId === FEnums.ModelBusinessService || explorerTreeContainerProps.featureId === FEnums.ManageBusinessService) {
            axiosInterceptor({
                url: BS.GetBs,
                data: {},
                setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                    const parsedData = parseHierarchyApiJson(getLocationHierarchyApiResponse, status, "bsJson");
                    if (parsedData) {
                        handleApiDataChange(parsedData);
                    }
                }
            }, statusBarContext)
        }
        else if (explorerTreeContainerProps.featureId === FEnums.AuditSession || explorerTreeContainerProps.featureId === FEnums.InventoryCollection
            || explorerTreeContainerProps.featureId === FEnums.InventoryReconciliation
        ) {
            axiosInterceptor({
                url: AUDIT.GetAllAuditsessions,
                data: {
                    auditFeatureType: explorerTreeContainerProps.featureId === FEnums.AuditSession ? 1 : explorerTreeContainerProps.featureId === FEnums.InventoryCollection ? 2 : 3,
                    openOnly: false
                },
                setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                    const parsedData = parseHierarchyApiJson(getLocationHierarchyApiResponse, status, "data");
                    if (parsedData) {
                        handleApiDataChange({ ...parsedData });
                    }
                }
            }, statusBarContext)
        }
    }

    // Handles kebab menu actions for order, refresh, find, and parent delegation.
    const handleKebabMenuSelect = async (selectedItem: IActionImageForSubMenu) => {

        if (selectedItem && selectedItem.payload
            && typeof selectedItem.payload === "object" && 'Label' in selectedItem.payload) {
            if ((selectedItem.payload.Label === RightMouseMenuTreeNode.OrderSubnodes || selectedItem.payload.Label === RightMouseMenuTreeNode.DonotOrderSubnodes) && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
                const orderedNodes = FnOrderSubNodes(treeData, defaultSelectedNodeInfo.node.key, selectedItem.payload.Label);
                if (orderedNodes.updatedTree && treeforhierarchicaldatacontainerProps && orderedNodes.selectedNode && (!treeforhierarchicaldatacontainerProps.featureTreeProps.hideCopyIcon || !treeforhierarchicaldatacontainerProps.featureTreeProps.hideKebabMenu)) {
                    const updatedSelectedNodeData = await FnUpdateTreeNodeBasedOnKeyForHierarchicalData(orderedNodes.updatedTree, orderedNodes.selectedNode?.key, true, true, treeforhierarchicaldatacontainerProps, null, handleKebabMenuSelect);
                    setTreeData([...updatedSelectedNodeData]);
                }
                else {
                    setTreeData(orderedNodes.updatedTree);
                }
                if (orderedNodes.selectedNode) {
                    setDefaultSelectedNodeInfo({
                        event: "select",
                        node: orderedNodes.selectedNode,
                        selected: true,
                        selectedNodes: []
                    });
                }
            }
            else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Refresh) {
                if (explorerTreeContainerProps.featureId === FEnums.AssetPlacement && defaultSelectedNodeInfo) {
                    explorerTreeContainerProps.handleKebabMenuSelect?.(selectedItem, defaultSelectedNodeInfo);
                }
                else {
                    callApiToRefreshTree();
                }
            }
            else if (selectedItem.payload.Label === RightMouseMenuTreeNode.FindInPhysicalCompute && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
                if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "device") {
                    let EQID: string | number | null = defaultSelectedNodeInfo.node.EQID ?? defaultSelectedNodeInfo.node.Name;
                    const sessionId = statusBarContext.userSessionId
                    if (!EQID || !sessionId) return;
                    axiosInterceptor({
                        url: MISC.GetTableData,
                        data: {
                            "entityName": defaultSelectedNodeInfo.node.NodeEntityname,
                            "tableName": "_Device",
                            "entIDList": defaultSelectedNodeInfo.node.NodeEntID
                        },
                        setFetchData: (_respTableRec: unknown, status?: string) => {
                            if (status === "200" && _respTableRec && typeof _respTableRec === "object" && 'dataJson' in _respTableRec) {
                                try {
                                    const parsedData = FnParseJsonSafely(_respTableRec.dataJson as string);
                                    if (Array.isArray(parsedData) && parsedData.length) {
                                        const firstRow = parsedData[0] as Record<string, unknown>;
                                        EQID = firstRow.EQID ? firstRow.EQID as string | number : EQID;

                                        const hierarchyUrl = FnBuildUrlForFind(parsedData);

                                        const sessionId = statusBarContext.userSessionId

                                        if (!sessionId) {
                                            explorerTreeContainerProps.handleShowMessage?.(true, "Session ID missing");
                                            return;
                                        }
                                        const url = `${window.location.origin}/feature/${FEnums.Server}?isnew=true&id=${sessionId}${hierarchyUrl}`;

                                        //  safer open
                                        const newTab = window.open(url, "_blank");

                                        if (!newTab) {
                                            explorerTreeContainerProps.handleShowMessage?.(true, "Popup blocked");
                                        }
                                    }
                                } catch (error) {
                                    console.error("Failed to parse device table data:", error);
                                }
                            }
                        }
                    }, statusBarContext)
                }
            }
            else if (selectedItem.payload.Label === RightMouseMenuTreeNode.FindInInventory && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
                if (defaultSelectedNodeInfo.node.NodeType?.toLowerCase() === "device") {
                    let EQID: string | number | null = null;
                    if (defaultSelectedNodeInfo.node.EQID) {
                        EQID = defaultSelectedNodeInfo.node.EQID;
                    }
                    else {
                        const deviceId = FnGetDeviceIdFromEntID(treeData, defaultSelectedNodeInfo.node.NodeEntID ?? defaultSelectedNodeInfo.node.key);
                        if (deviceId) {
                            const handleGetPropertyValueApiResponse = (getPropertyValueApiResponse: unknown, status?: string) => {
                                if (status === "200" && getPropertyValueApiResponse && typeof getPropertyValueApiResponse === "object" && 'currentValue' in getPropertyValueApiResponse) {
                                    let parsedData = FnParseJsonSafely(getPropertyValueApiResponse.currentValue as string);
                                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                                        EQID = parsedData[0].CurrentValue;
                                    }
                                }
                            }
                            await axiosInterceptor({
                                url: PROPERTY.GetPropertyValue,
                                data: {
                                    "entID": deviceId,
                                    "entityName": defaultSelectedNodeInfo.node.NodeEntityname?.replace("__", ""),
                                    "pgName": FindInInventoryVariables.PGHardware.toString(),
                                    "propertyName": FindInInventoryVariables.EQID.toString()
                                },
                                setFetchData: handleGetPropertyValueApiResponse
                            }, statusBarContext)
                        }
                    }
                    if (!EQID) {
                        explorerTreeContainerProps.handleShowMessage?.(true, "Unable to find EQID for the selected node.");
                    }
                    else {
                        axiosInterceptor({
                            url: EXPLORER.SearchKeyword,
                            data: {
                                keyword: EQID,
                                searchAllWord: true,
                                exploreType: 0,
                                excludedEntIDs: undefined
                            },
                            setFetchData: (searchKeywordApiResponse: unknown, status?: string) => {
                                const sessionId = statusBarContext.userSessionId
                                const showRedirectError = () => {
                                    explorerTreeContainerProps.handleShowMessage?.(true, `Device Model (${EQID}) is not found in Spare inventory`);
                                };
                                if (status === "200" && sessionId && searchKeywordApiResponse && typeof searchKeywordApiResponse === "object" && 'searchEntIDsJson' in searchKeywordApiResponse) {
                                    if (searchKeywordApiResponse.searchEntIDsJson) {
                                        const parsedJson = FnParseJsonSafely(searchKeywordApiResponse.searchEntIDsJson as string);
                                        if (parsedJson && Array.isArray(parsedJson) && parsedJson.length > 0) {
                                            const siteName = sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "sitename")
                                            if (siteName?.SessionValue) {
                                                const hierarchyUrl = FnBuildUrlForFindHierarchy(parsedJson, siteName?.SessionValue);
                                                const url = `${window.location.origin}/feature/${FEnums.InventoryManagement}?isnew=true&location=${FEnums.InventoryManagement}&id=${sessionId}${hierarchyUrl}`;

                                                const newTab = window.open(url, "_blank");
                                                if (!newTab) {
                                                    explorerTreeContainerProps.handleShowMessage?.(true, "Popup blocked");
                                                }
                                                else {
                                                    axiosInterceptor({
                                                        url: KWD.DropSessionKeywordTable,
                                                        data: {},
                                                        setFetchData: (data: unknown) => {
                                                            if (import.meta.env.DEV)
                                                                console.log('data :', data);
                                                        }
                                                    }, statusBarContext)
                                                }
                                                return;
                                            }
                                        }
                                    }
                                }
                                showRedirectError();
                            }
                        }, statusBarContext)
                    }
                }
            }
            else if (
                selectedItem.payload.Label === RightMouseMenuTreeNode.CopyHyperlink &&
                treeDataRef.current &&
                defaultSelectedNodeInfo?.node
            ) {
                const parentNodes = FnGetParentHierarchy(
                    treeDataRef.current,
                    defaultSelectedNodeInfo.node?.key
                );
                const siteid = sessionContext.SessionList.find(
                    (item) => item.VariableName.toLowerCase() === "siteid"
                );
                const sitename = sessionContext.SessionList.find(
                    (item) => item.VariableName.toLowerCase() === "sitename"
                );
                if (siteid && siteid.SessionValue?.length) {

                    // Build hierarchy:
                    // NodeEntityName:Name/NodeEntityName:Name
                    const hierarchyPath = parentNodes
                        ?.filter((node) => node.NodeEntityname && node.Name)
                        .map((node) => `${node.NodeEntityname}:${node.Name}`)
                        .join("/");
                    let deviceid = "";
                    if (explorerTreeContainerProps.featureId === FEnums.AssetPlacement && defaultSelectedNodeInfo?.node) {
                        deviceid = (defaultSelectedNodeInfo.node.NodeEntID || defaultSelectedNodeInfo.node.key || "").toString();
                    }

                    const url =
                        `${window.location.href.split("?")[0]}` +
                        `?isnew=true` +
                        `&siteid=${siteid.SessionValue}` +
                        `&sitename=${sitename?.SessionValue || ""}` +
                        `&deviceid=${encodeURIComponent(deviceid ?? "")}` + (deviceid ? "" : `&hierarchy=${encodeURIComponent(hierarchyPath ?? "")}`);

                    FnCopyToClipboard(url);
                    explorerTreeContainerProps.handleShowUserMessage?.("Copied!", undefined, true)
                }
            }
            else if (explorerTreeContainerProps.handleKebabMenuSelect && defaultSelectedNodeInfo) {
                explorerTreeContainerProps.handleKebabMenuSelect(selectedItem, defaultSelectedNodeInfo);
            }
        }
        else {
            if (explorerTreeContainerProps.handleKebabMenuSelect && defaultSelectedNodeInfo) {
                explorerTreeContainerProps.handleKebabMenuSelect(selectedItem, defaultSelectedNodeInfo);
            }
        }
    }

    // Forwards node selection to parent and syncs local selection state.
    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        setDefaultExpandedNodeKeys(expandedKeys);
        setDefaultSelectedNodeInfo(info);
        setDefaultSelectedNodeKeys(selectedKeys);
        if (explorerTreeContainerProps.handleNodeSelect) {
            explorerTreeContainerProps.handleNodeSelect(selectedKeys, info, expandedKeys, treeData)
        }
    }

    // Delegates internal tree drop to parent handler when provided.
    const handleNodeDropEvent = (info: NodeDragEventParams<ITreeNode> & {
        dragNode: EventDataNode<ITreeNode>;
        dragNodesKeys: Key[];
        dropPosition: number;
        dropToGap: boolean;
    }) => {
        if (explorerTreeContainerProps.onDrop) {
            explorerTreeContainerProps.onDrop(info);
        }
        else {
            //handle drop event for internal drag
        }
    }

    // Delegates drag start to parent handler when provided.
    const handleDragStart = (info: NodeDragEventParams<ITreeNode>) => {
        if (explorerTreeContainerProps.handleDragStart) {
            explorerTreeContainerProps.handleDragStart(info);
        }
    }

    // Lazy-loads Power BI reports when a workspace node is expanded.
    const handleNodeExpand = async (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => {
        if (info.node.NodeType === "Workspace" && !info.node.children.length) {
            statusBarContext.setIsLoading(true);
            const reports = await axiosInterceptorForPowerBi(`${FnGetExpApiUrlBasedOnEndPoint(EXPAPI.PowerBIReport)}?workspaceId=${info.node.NodeEntID}`);
            if (reports.status === 200 && reports.data && typeof reports.data === "object" && 'reports' in reports.data && Array.isArray(reports.data.reports) && treeData) {
                statusBarContext.setIsLoading(false);
                const reportsData: IPowerBiReportItem[] = reports.data.reports
                const children = reportsData.map(item => ({
                    Name: item.reportName,
                    EntID: item.reportId,
                    parentEntID: item.workspaceId,
                    NodeType: "Report",
                    Children: [],
                    embedUrl: item.embedUrl,
                    embedToken: item.embedToken,
                    workspaceId: item.workspaceId,
                    EntityName: "PowerBI",
                    Description: "Report"
                }))
                FnConvertHierarchicalDataToTree({ report: children }, treeforhierarchicaldatacontainerProps, undefined).then((updatedTree: IConvertedTreeResponse | undefined) => {
                    if (updatedTree?.treeData) {
                        const updateTreeData = []
                        for (let index = 0; index < treeData.length; index++) {
                            const element: ITreeNode = treeData[index];
                            if (element.NodeEntID === info.node.NodeEntID) {
                                element.children = updatedTree.treeData;
                            }
                            updateTreeData.push(element);
                        }
                        setTreeData(updateTreeData);
                    }
                })
            } else {
                statusBarContext.setIsLoading(false);
            }
            setDefaultExpandedNodeKeys(expandedNodeKeys);
        }
    }

    if (treeData === undefined) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }

    if (!treeData || !treeData.length) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>;
    }

    return (
        <div className='nz-explorer-tree-main-container' key={explorerTreeContainerProps.uniqueName}>
            {explorerTreeContainerProps.allowSearchControl && <div className='nz-explorer-search-container'
            >
                <SearchControl uniqueName={`${explorerTreeContainerProps.uniqueName}-search`}
                    isShowFilterControl={false}
                    lensDirty={(searchText || "")?.length > 0}
                    filterDirty={false}
                    searchInputValue={searchText || ""}
                    hideSearchControl={false}
                    hideRightMouseMenu={true}
                    searchValueChange={(value: string) => {
                        setSearchText(value);
                        setSearchHistory([]);
                    }}
                    handleFilterMouse={() => {
                    }}
                    handleLensMouse={(selectedCondion: "AND" | string = "AND") => {
                        if (searchText && (searchText || "").length > 0) {
                            const isNext = searchHistory.length > 0;
                            handleKeywordSearch(searchText, selectedCondion === "AND", isNext);
                        }
                    }} />
            </div>}
            <div className={`nz-explorer-tree-container`}>
                {treeforhierarchicaldatacontainerProps && treeData && <TreeForHierarchicalDataContainer
                    {...treeforhierarchicaldatacontainerProps}
                    apiData={treeData}
                    autoFocus={true}
                    defaultExpandedKeys={defaultExpandedNodeKeys}
                    defaultSelectedKeys={defaultSelectedNodeKeys}
                    defaultSelectedNodeInfo={defaultSelectedNodeInfo}
                    defaultCheckedKeys={defaultCheckedNodeKeys}
                    handleKebabMenuSelect={handleKebabMenuSelect}
                    handleNodeSelect={handleNodeSelect}
                    onDrop={handleNodeDropEvent}
                    handleDragStart={handleDragStart}
                    handleNodeExpand={handleNodeExpand}
                    canAcceptExternalDrop={explorerTreeContainerProps.canAcceptExternalDrop}
                    handleExternalDrop={explorerTreeContainerProps.handleExternalDrop}
                />}
            </div>
            <YesNoFormContainer
                isOpen={showConfirm}
                showOkButton={true}
                uniqueName={`${explorerTreeContainerProps.uniqueName}-search-alert`}
                message={confirmMessage || ""}
                handleOkButtonClick={() => {
                    setShowConfirm(false);
                    setConfirmMessage(null);
                }}
            />
        </div>
    )
}
export { ExplorerTreeContainer }

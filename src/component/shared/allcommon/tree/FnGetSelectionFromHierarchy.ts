
import { FeatureMinimumExpandNodeTypes, ReuseDataForFeatures } from "../../alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer";
import { FEnums } from "../../../constants/Feature";
import { DropableControlElementEnums } from "../../../appcontainer/alldefaultprops/Enums";
import { FnAddSubNode } from "./FnAddSubNode";
import { FnConvertFlatDataToHierarchyData } from "./FnConvertFlatDataToHierarchyData";
import { FnDeepClone } from "../basic/FnDeepClone";
import { FnGetSessionVariables } from "../basic/FnGetSessionVariables";
import { FnProcessStringToCompare } from "../basic/FnProcessStringToCompare";
import { FnRemoveChildrenNodes } from "./FnRemoveChildrenNodes";
import { FnFindChildrenBasedOnKey } from "./FnFindChildrenBasedOnKey";
import { IFeatureTree } from "../../allinterface/tree/ITreeForFlatDataContainer";
import { ISelectedNodeInfo, ITreeNode } from "../../allinterface/tree/ITreeControl";
import { ISessionVariable } from "../../allinterface/basic/ISessionVariable";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { EXPLORER } from "../../interceptors/EndPoints";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { ISession } from "../../context/allinterface/ISession";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnSearchKeyword } from "../FnSearchKeywordUsingAPICall";
import { IDcSearchParams } from "../../allinterface/IDcExplorerContainer";
import { FnTraverseTreeByHierarchy } from "./FnTraverseTreeByHierarchy";
import { FnCallApiToGetDataForTree } from "./FnCallApiToGetDataForTree";
import { FnFindNodeAndParents } from "../tablegrid/FnFindNodeAndParents";
import { FnFilterTreeById } from "./FnFilterTreeById";

const isFloorOrStoreNode = (node: ITreeNode): boolean => {
    const nodeType = (node.NodeType ?? node.treetype ?? "").toLowerCase();
    return nodeType === "floor" || nodeType === "store";
};

// Workorder/Analytics may have forced floors to isLeaf on shared reused tree data.
// Restore expandability so location/device/rack features can load floor children again.
const restoreFloorExpandabilityForFeatureTree = (nodes: ITreeNode[]): void => {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isFloorOrStoreNode(node)) {
            if (node.HasChildren) {
                node.isLeaf = false;
            }
            continue;
        }
        if (node.children && node.children.length > 0) {
            restoreFloorExpandabilityForFeatureTree(node.children);
        }
    }
};

const isMinimumNodeMatch = (
    node: ITreeNode,
    minimumNodeTypes: string[],
    featureId: string
): boolean => {
    const nodeType = node.NodeType ?? "";

    const isTypeMatch = minimumNodeTypes.some(type =>
        FnProcessStringToCompare(nodeType, type)
    );

    if (!isTypeMatch) {
        return false;
    }

    if (featureId === FEnums.Discover) {
        const dcmState = (node.MountedDeviceIntelDCMState || node.IntelDCMState || "").trim().toLowerCase();
        return dcmState === "discovered" || dcmState === "discoverable";
    }

    if (featureId === FEnums.Monitor) {
        const dcmState = (node.MountedDeviceIntelDCMState || node.IntelDCMState || "").trim().toLowerCase();
        return dcmState === "monitored" || dcmState === "discovered";
    }

    return true;
};

const FnFindMinimumNodeWithoutApi = (
    currentNode: ITreeNode,
    minimumNodeOpen: string,
    treeData: ITreeNode[],
    expandKeys: string[],
    expandedNodes: ITreeNode[],
    featureId: string
): ITreeNode | null => {

    const visited = new Set<string>();

    const minimumNodeTypes = minimumNodeOpen
        .split("/")
        .map(type => type.trim())
        .filter(Boolean);

    const isMatch = (node: ITreeNode): boolean => {
        return isMinimumNodeMatch(node, minimumNodeTypes, featureId);
    };

    /**
     * Same child lookup.
     * No API call.
     */
    const getFeatureChildren = (
        parent: ITreeNode
    ): ITreeNode[] => {

        return FnFindChildrenBasedOnKey(
            treeData,
            parent.key,
            featureId
        ) ?? [];
    };

    /**
     * Stores only the nodes which are actually
     * on the successful path to the minimum node.
     *
     * The minimum/selected node itself is NOT added.
     */
    const successfulPath: ITreeNode[] = [];

    const traverse = (
        node: ITreeNode
    ): ITreeNode | null => {

        if (
            !node ||
            visited.has(node.key)
        ) {
            return null;
        }

        visited.add(node.key);

        /**
         * Current node is the minimum node.
         */
        if (isMatch(node)) {
            return node;
        }

        /**
         * Get only already-loaded children.
         */
        const children = getFeatureChildren(node);

        if (children.length === 0) {
            return null;
        }

        for (const child of children) {

            /**
             * If the child itself is the minimum node,
             * current node is its parent and therefore
             * must be expanded.
             */
            if (isMatch(child)) {

                successfulPath.push(node);

                return child;
            }

            /**
             * Search recursively.
             */
            const result = traverse(child);

            if (result) {

                /**
                 * The result exists somewhere below this node.
                 *
                 * Therefore this node belongs to the
                 * successful expansion path.
                 */
                successfulPath.push(node);

                return result;
            }
        }

        return null;
    };

    if (!currentNode) {
        return null;
    }

    /**
     * Search the existing tree first.
     */
    const minimumNode = traverse(currentNode);

    /**
     * Nothing found.
     *
     * Do not modify expansion state.
     */
    if (!minimumNode) {
        return null;
    }

    /**
     * successfulPath is collected bottom-up:
     *
     * Floor
     * Room
     * Site
     *
     * Reverse it so expansion happens:
     *
     * Site
     * Room
     * Floor
     */
    successfulPath.reverse();

    /**
     * Update expansion state ONLY after the
     * complete minimum-node path is known.
     *
     * This prevents feature switching from leaving
     * partial expansion state.
     */
    for (const node of successfulPath) {

        if (!expandKeys.includes(node.key)) {
            expandKeys.push(node.key);
        }

        if (
            !expandedNodes.some(
                item => item.key === node.key
            )
        ) {
            expandedNodes.push(node);
        }
    }

    /**
     * Minimum node itself is returned as selected node,
     * but is intentionally NOT expanded.
     */
    return minimumNode;
};

// In-flight request cache for GetFirstDevice
const inFlightGetFirstDeviceRequests = new Map<number, Promise<any>>();

// This function returns the expanded and selected node based on hierarchy
async function FnGetSelectionFromHierarchy(trees: ITreeNode[], featureId: string
    , treeDataProps: IFeatureTree, selectedExplorerNode: ISelectedNodeInfo | null
    , statusBarContext?: IStatusBar, sessionData?: ISession[]
    , isReverse?: boolean, floorDeviceRecords?: Record<string, any>
    , searchParams?: IDcSearchParams) {
    let expandKeys: string[] = [];
    let expandedNodes: ITreeNode[] = [];
    let hasChildrenForFloor: boolean = false;
    let selectedNodeKey = '';
    let selectedNode: ISelectedNodeInfo | null = null;
    let originalTreeData: ITreeNode[] = FnDeepClone(trees);

    // Shared explorer tree can retain Workorder/Analytics floor isLeaf flags.
    // Clear those before selection for features that expand below floor.
    if (
        featureId !== FEnums.Workorder &&
        featureId !== FEnums.AssetPlacement &&
        featureId !== FEnums.AnalyticsAndCharts
    ) {
        restoreFloorExpandabilityForFeatureTree(originalTreeData);
    }

    try {
        if (sessionData && statusBarContext) {
            const locationData: ISessionVariable[] | null = FnGetSessionVariables(["Inventory", "Location", "Node", "Filter"], "ID", sessionData);
            if (featureId === FEnums.SelectDataCenterSite) {

                const siteID =
                    locationData?.find((item) => item.VariableName === "SiteID")?.SessionValue || null;
                const tenantID =
                    locationData?.find((item) => item.VariableName === "TenantID")?.SessionValue || null;

                const targetID = isReverse ? tenantID : siteID;
                let found = false;
                const tempExpandKeys: string[] = [];
                const tempExpandedNodes: ITreeNode[] = [];

                const traverse = async (currentNode: ITreeNode): Promise<void> => {
                    if (found) return;

                    // Track in temp arrays first (only commit to expandKeys if found)
                    tempExpandKeys.push(currentNode.key);
                    tempExpandedNodes.push(currentNode);

                    // If we have a target ID, search for it
                    if (targetID && currentNode.key === targetID) {
                        expandKeys.push(...tempExpandKeys);
                        expandedNodes.push(...tempExpandedNodes);
                        selectedNodeKey = currentNode.key;
                        selectedNode = {
                            node: currentNode,
                            event: "auto-select",
                            selected: true,
                            selectedNodes: []
                        };
                        found = true;
                        return;
                    }

                    // Continue searching if targetID is set
                    if (targetID && currentNode.children?.length > 0) {
                        for (const child of currentNode.children) {
                            await traverse(child);
                            if (found) return;
                        }
                    }
                };

                if (originalTreeData?.length) {
                    if (targetID) {
                        // Search mode
                        for (const treeNode of originalTreeData) {
                            await traverse(treeNode);
                            if (found) break;
                        }
                    } else {
                        // Auto-expand until branching or leaf
                        let currentNode = originalTreeData[0];
                        expandKeys.push(currentNode.key);
                        expandedNodes.push(currentNode);

                        while (currentNode.children?.length === 1) {
                            currentNode = currentNode.children[0];
                            expandKeys.push(currentNode.key);
                            expandedNodes.push(currentNode);
                        }

                        // Select the first branching node or leaf
                        if (currentNode.children?.length) {
                            selectedNodeKey = currentNode.children[0].key;
                            selectedNode = {
                                node: currentNode.children[0],
                                event: "auto-select",
                                selected: true,
                                selectedNodes: []
                            };
                        } else {
                            selectedNodeKey = currentNode.key;
                            selectedNode = {
                                node: currentNode,
                                event: "auto-select",
                                selected: true,
                                selectedNodes: []
                            };
                        }
                    }
                }
            }

            else if (((featureId === FEnums.AuditSession) && selectedExplorerNode && selectedExplorerNode.node && selectedExplorerNode.node.NodeType && FnProcessStringToCompare(selectedExplorerNode.node.NodeType, "AuditSessionNode"))) {
                let siteID: string | null = null;
                let roomID: string | null = null;
                let floorID: string | null = null;
                let locationID: string | null = null;
                let deviceID: string | null = null;
                let isSelectionDone = false;

                Object.keys(selectedExplorerNode.node).forEach((item: string) => {
                    const value = selectedExplorerNode.node[item] as unknown as string;
                    if (item?.toLowerCase() === DropableControlElementEnums.SiteName?.toLowerCase() && value) {
                        siteID = selectedExplorerNode.node["SiteID"] as unknown as string;
                    }
                    else if (item?.toLowerCase() === DropableControlElementEnums.RoomName?.toLowerCase() && value) {
                        roomID = selectedExplorerNode.node["RoomID"] as unknown as string;
                    }
                    else if (item?.toLowerCase() === DropableControlElementEnums.FloorName?.toLowerCase() && value) {
                        floorID = selectedExplorerNode.node["FloorID"] as unknown as string;
                    }
                    else if (item?.toLowerCase() === DropableControlElementEnums.LocationName?.toLowerCase() && value) {
                        locationID = selectedExplorerNode.node["LocationID"] as unknown as string;
                    }
                    else if (item?.toLowerCase() === DropableControlElementEnums.DeviceName?.toLowerCase() && value) {
                        deviceID = selectedExplorerNode.node["DeviceID"] as unknown as string;
                    }
                });
                let lastMatchedNode: ITreeNode | null = null;
                const traverseForAudit = async (currentNode: ITreeNode, isCalledForSession: boolean) => {
                    if ((currentNode.children && currentNode.children.length > 0) || isCalledForSession) {
                        expandKeys.push(currentNode.key);
                        expandedNodes.push(currentNode);
                        if (siteID && (roomID || floorID || locationID || deviceID)) {
                            // Logic for when IsRefreshed is true (use locationData)
                            if (currentNode.NodeEntID && (FnProcessStringToCompare(currentNode.NodeEntID, siteID) || (roomID && FnProcessStringToCompare(currentNode.NodeEntID, roomID)) || (floorID && FnProcessStringToCompare(currentNode.NodeEntID, floorID)) || (locationID && FnProcessStringToCompare(currentNode.NodeEntID, locationID)))) {
                                // Expand the node hierarchy based on the IDs from locationData
                                if (currentNode.children?.length > 0) {
                                    const filteredNodes = await FnRemoveChildrenNodes(currentNode.children, null, featureId, treeDataProps, originalTreeData);

                                    for (let index = 0; index < filteredNodes.length; index++) {
                                        const childNode = filteredNodes[index];
                                        // ALWAYS check device first
                                        if (deviceID && childNode.NodeEntID === deviceID) {
                                            selectedNodeKey = childNode.key;
                                            selectedNode = {
                                                node: childNode,
                                                event: "auto-select",
                                                selected: true,
                                                selectedNodes: []
                                            };
                                            isSelectionDone = true;
                                            return;
                                        }

                                        // THEN check hierarchy
                                        else if (
                                            (roomID && childNode.NodeEntID === roomID) ||
                                            (floorID && childNode.NodeEntID === floorID) ||
                                            (locationID && childNode.NodeEntID === locationID)
                                        ) {
                                            lastMatchedNode = childNode;
                                            await traverseForAudit(childNode, true);
                                        }

                                        // fallback
                                        else if (!deviceID && currentNode.NodeType && FnProcessStringToCompare(currentNode.NodeType, "Location")) {
                                            selectedNodeKey = currentNode.key;
                                            selectedNode = {
                                                node: currentNode,
                                                event: "auto-select",
                                                selected: true,
                                                selectedNodes: []
                                            };
                                        }
                                    }
                                    if (!isSelectionDone && lastMatchedNode) {
                                        selectedNodeKey = lastMatchedNode.key;
                                        selectedNode = {
                                            node: lastMatchedNode,
                                            event: "auto-select",
                                            selected: true,
                                            selectedNodes: []
                                        };
                                    }
                                    else if (!isSelectionDone && !selectedNodeKey) {
                                        selectedNodeKey = filteredNodes[0].key;
                                        selectedNode = {
                                            node: filteredNodes[0],
                                            event: "auto-select",
                                            selected: true,
                                            selectedNodes: []
                                        };
                                    }

                                }
                                else {
                                    if (currentNode.NodeType && (FnProcessStringToCompare(currentNode.NodeType, "floor") || FnProcessStringToCompare(currentNode.NodeType, "store"))) {
                                        let exploreType = 2;
                                        const handleAPIForFloorNode = async (floorNodeApiResponse: unknown, status?: string) => {
                                            if (status === "200" && floorNodeApiResponse && typeof floorNodeApiResponse === "object" && 'hierarchyJson' in floorNodeApiResponse) {

                                                const apiData = FnParseJsonSafely(floorNodeApiResponse.hierarchyJson as string);
                                                const formattedData = await FnConvertFlatDataToHierarchyData(apiData, currentNode.NodeEntID);
                                                if (formattedData && formattedData.length > 0) {
                                                    originalTreeData = await FnAddSubNode(originalTreeData, currentNode.key, formattedData, treeDataProps, featureId, true, currentNode.stepNo);
                                                    let clonnedData = FnDeepClone(formattedData)
                                                    clonnedData = await FnRemoveChildrenNodes(clonnedData, null, featureId, treeDataProps, originalTreeData);
                                                    currentNode.children = clonnedData;
                                                    for (let index = 0; index < currentNode.children.length; index++) {
                                                        const childNode = currentNode.children[index];
                                                        if (deviceID && childNode.NodeEntID === deviceID) {
                                                            selectedNodeKey = childNode.key;
                                                            selectedNode = {
                                                                node: childNode,
                                                                event: "auto-select",
                                                                selected: true,
                                                                selectedNodes: []
                                                            };
                                                            isSelectionDone = true;
                                                            return;
                                                        }
                                                        else if (
                                                            (roomID && childNode.NodeEntID === roomID) ||
                                                            (floorID && childNode.NodeEntID === floorID) ||
                                                            (locationID && childNode.NodeEntID === locationID)
                                                        ) {
                                                            await traverseForAudit(childNode, true);
                                                        }
                                                    }
                                                }
                                            }

                                        }
                                        // Call API to get florr device configuration
                                        await new Promise<void>((resolve, reject) => {
                                            axiosInterceptor({
                                                url: EXPLORER.FloorDevicesConfigurationHierarchyReduced,
                                                data: {
                                                    floorID: currentNode.NodeEntID,
                                                    exploreType: exploreType,
                                                    isRefresh: false
                                                },
                                                allowShowLoader: true,
                                                setFetchData: async (floorNodeApiResponse: unknown, status?: string) => {
                                                    try {
                                                        await handleAPIForFloorNode(floorNodeApiResponse, status);
                                                        resolve(); // <-- resolve only after handleAPI completes
                                                    } catch (error) {
                                                        reject(error);
                                                    }
                                                }
                                            }, statusBarContext);
                                        });


                                    } else if (currentNode.NodeEntID === deviceID) {
                                        // If the current node is the selected node based on SelectedNodeID
                                        selectedNodeKey = currentNode.key;
                                        selectedNode = { node: currentNode, event: "auto-select", selected: true, selectedNodes: [] };
                                    } else {
                                        selectedNodeKey = currentNode.key;
                                        selectedNode = { node: currentNode, event: "auto-select", selected: true, selectedNodes: [] };
                                    }
                                }
                            } else if (currentNode.NodeEntID === deviceID) {
                                // If the current node is the selected node based on SelectedNodeID
                                selectedNodeKey = currentNode.key;
                                selectedNode = { node: currentNode, event: "auto-select", selected: true, selectedNodes: [] };
                            } else {
                                selectedNodeKey = currentNode.key;
                                selectedNode = { node: currentNode, event: "auto-select", selected: true, selectedNodes: [] };
                            }
                        }
                        else {
                            if (currentNode.children.length === 1) {
                                await traverseForAudit(currentNode.children[0], false);
                            } else {
                                selectedNodeKey = currentNode.children[0].key;
                                selectedNode = { node: currentNode.children[0], event: "auto-select", selected: true, selectedNodes: [] };
                            }
                        }
                    }
                }
                // Process each root node in the array
                if (originalTreeData?.length === 1) {

                    for (const treeNode of originalTreeData) {
                        await traverseForAudit(treeNode, false);
                        if (!deviceID) {
                            expandKeys.pop();
                            expandedNodes.pop();
                        }
                    }

                }
            }
            else {

                let exploreType = 2;
                const isInv = featureId === FEnums.InventoryManagement || featureId === FEnums.InventoryConfiguration ? true : false
                if (featureId === FEnums.AssetConfiguration) {
                    exploreType = 2;
                } else if (featureId === FEnums.ConfigureDevice) {
                    exploreType = 3;
                }
                else if (isInv) {
                    exploreType = 1;
                }
                if (!searchParams?.isDisableSearch && (searchParams?.eqidToSearch || searchParams?.hierarchyToSearch)) {
                    let hierarchyOfTree: { EntityName: string, EntID?: string, Name?: string }[] = [];
                    if (searchParams?.eqidToSearch) {
                        const result = await FnSearchKeyword(searchParams?.eqidToSearch, true, exploreType, "", statusBarContext);
                        if (result?.length) {
                            hierarchyOfTree = result.map((item) => ({
                                EntityName: item.EntityName,
                                EntID: item.EntID
                            }));
                        }
                    }
                    else if (searchParams?.hierarchyToSearch) {
                        const path = searchParams.hierarchyToSearch;

                        const guidRegex =
                            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

                        hierarchyOfTree = path.split("/").map((item) => {
                            const [entityName, ...nameParts] = item.split(":");
                            const value = nameParts.join(":");

                            return {
                                EntityName: entityName,
                                ...(guidRegex.test(value)
                                    ? { EntID: value }
                                    : { Name: value })
                            };
                        });
                    }
                    if (hierarchyOfTree.length) {
                        const searchResult =
                            await FnTraverseTreeByHierarchy(
                                originalTreeData,
                                hierarchyOfTree,
                                featureId,
                                exploreType,
                                treeDataProps,
                                statusBarContext
                            );

                        expandKeys =
                            searchResult.expandKeys;

                        expandedNodes =
                            searchResult.expandedNodes;

                        selectedNodeKey =
                            searchResult.selectedNodeKey;

                        selectedNode =
                            searchResult.selectedNode;

                        // Hierarchy path not fully matched — keep last expanded node selected.
                        if (!selectedNode && expandedNodes.length) {
                            const lastExpandedNode = expandedNodes[expandedNodes.length - 1];
                            const nodeType = (lastExpandedNode.NodeType ?? lastExpandedNode.treetype ?? "").toLowerCase();
                            selectedNodeKey = lastExpandedNode.key;
                            selectedNode = {
                                node: (nodeType === "site" || nodeType === "room" || nodeType === "inventory")
                                    ? lastExpandedNode
                                    : { ...lastExpandedNode, children: [] },
                                event: "auto-select",
                                selected: true,
                                selectedNodes: []
                            };
                        }

                        originalTreeData =
                            searchResult.originalTreeData;
                    }
                    return {
                        expandKeys,
                        expandedNodes,
                        selectedNodeKey,
                        selectedNode: selectedNode as ISelectedNodeInfo | null,
                        originalTreeData
                    };
                }
                // Extract IDs from location data (only if isRefreshed is true)
                const siteID = locationData?.find((item) => item.VariableName === 'SiteID')?.SessionValue || null;
                const roomID = isInv ? locationData?.find((item) => item.VariableName === 'InventoryID')?.SessionValue ?? null : locationData?.find((item) => item.VariableName === 'RoomID')?.SessionValue || null;
                const floorID = isInv ? locationData?.find((item) => item.VariableName === 'StoreID')?.SessionValue ?? null : locationData?.find((item) => item.VariableName === 'FloorID')?.SessionValue || null;
                const locationID = isInv ? locationData?.find((item) => item.VariableName === 'BinID')?.SessionValue ?? null : locationData?.find((item) => item.VariableName === 'LocationID')?.SessionValue || null;
                const selectedNodeID = locationData?.find((item) => item.VariableName === 'SelectedNodeID')?.SessionValue || null;
                const minimumNodeOpen = FeatureMinimumExpandNodeTypes[featureId];
                const preferSessionSelection = searchParams?.isAppqaLaunch === true;

                // Build selected-node payload without mutating the tree node's children.
                // Site/Room/Inventory keep children on the selected object; others are view-only trimmed.
                const toSelectedNode = (node: ITreeNode): ITreeNode => {
                    const nodeType = (node.NodeType ?? node.treetype ?? "").toLowerCase();
                    if (nodeType === "site" || nodeType === "room" || nodeType === "inventory") {
                        return node;
                    }
                    const isWorkorderOrAnalytics =
                        featureId === FEnums.Workorder ||
                        featureId === FEnums.AssetPlacement ||
                        featureId === FEnums.AnalyticsAndCharts;
                    return {
                        ...node,
                        children: [],
                        ...(isWorkorderOrAnalytics && isFloorOrStoreNode(node)
                            ? { isLeaf: true }
                            : {})
                    };
                };

                if (featureId === FEnums.Workorder) {
                    let roomToFilter: string | null = locationData?.find((item) => item.VariableName === "FilterRoomID")?.SessionValue || null;
                    if (roomToFilter) {
                        const filteredTree = FnFilterTreeById(originalTreeData, undefined, roomToFilter);
                        if (filteredTree.length) {
                            originalTreeData = filteredTree;
                        }
                    }

                    const allFloors: ITreeNode[] = [];
                    const collectFloors = (nodes: ITreeNode[]) => {
                        for (let i = 0; i < nodes.length; i++) {
                            const node = nodes[i];
                            if (isFloorOrStoreNode(node)) {
                                allFloors.push(node);
                                continue;
                            }
                            if (node.children && node.children.length > 0) {
                                collectFloors(node.children);
                            }
                        }
                    };
                    collectFloors(originalTreeData);

                    const isWOExists = (node: ITreeNode): boolean => {
                        const val = node.WOExists;
                        return val === true || (val as any) === 1 || (val as any) === "1" || String(val).toLowerCase() === "true";
                    };

                    let targetFloor = allFloors.find(f => (f.NodeEntID === floorID || f.key === floorID) && isWOExists(f))
                        ?? allFloors.find(f => isWOExists(f));
                    if (!targetFloor && floorID) {
                        targetFloor = allFloors.find(f => f.NodeEntID === floorID || f.key === floorID);
                    }
                    if (!targetFloor && allFloors.length > 0) {
                        targetFloor = allFloors[0];
                    }

                    if (targetFloor) {
                        const path = FnFindNodeAndParents(originalTreeData, targetFloor.key);
                        if (path && path.length > 0) {
                            const ancestors = path.slice(0, -1);
                            for (const ancestor of ancestors) {
                                if (!expandKeys.includes(ancestor.key)) {
                                    expandKeys.push(ancestor.key);
                                }
                                if (!expandedNodes.some(n => n.key === ancestor.key)) {
                                    expandedNodes.push(ancestor);
                                }
                            }
                        }

                        selectedNodeKey = targetFloor.key;
                        selectedNode = {
                            node: toSelectedNode(targetFloor),
                            event: "auto-select",
                            selected: true,
                            selectedNodes: []
                        };
                    } else if (originalTreeData.length > 0) {
                        selectedNodeKey = originalTreeData[0].key;
                        selectedNode = {
                            node: toSelectedNode(originalTreeData[0]),
                            event: "auto-select",
                            selected: true,
                            selectedNodes: []
                        };
                    }

                    return {
                        expandKeys,
                        expandedNodes,
                        selectedNodeKey,
                        selectedNode: selectedNode as ISelectedNodeInfo | null,
                        originalTreeData
                    };
                }

                const traverse = async (currentNode: ITreeNode, isCalledForSession: boolean) => {
                    if (
                        (featureId === FEnums.Workorder || featureId === FEnums.AssetPlacement || featureId === FEnums.AnalyticsAndCharts) &&
                        floorID &&
                        currentNode.NodeEntID === floorID
                    ) {
                        //  STOP going deeper — do not clear children on original tree
                        selectedNodeKey = currentNode.key;
                        selectedNode = {
                            node: toSelectedNode(currentNode),
                            event: "auto-select",
                            selected: true,
                            selectedNodes: []
                        };

                        return; //  EXIT traversal
                    }
                    let foundNode: ITreeNode | null = null;
                    if ((currentNode.children && currentNode.children.length > 0) || isCalledForSession) {
                        expandKeys.push(currentNode.key);
                        expandedNodes.push(currentNode);
                        if (ReuseDataForFeatures.includes(featureId) && siteID && (roomID || floorID || locationID || selectedNodeID)) {
                            // Logic for when IsRefreshed is true (use locationData)
                            if (currentNode.key === siteID || currentNode.key === roomID || currentNode.key === floorID || currentNode.key === locationID) {
                                // Expand the node hierarchy based on the IDs from locationData
                                if (currentNode.children?.length > 0) {

                                    for (let index = 0; index < currentNode.children.length; index++) {
                                        const childNode = currentNode.children[index];
                                        if (childNode.key === selectedNodeID) {
                                            // If the current node is the selected node based on SelectedNodeID
                                            selectedNodeKey = childNode.key;
                                            foundNode = childNode;
                                            if (foundNode.children.length) {
                                                hasChildrenForFloor = true;
                                            }
                                            selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                                        } else if (
                                            childNode.key === roomID ||
                                            childNode.key === floorID ||
                                            childNode.key === locationID
                                        ) {

                                            await traverse(childNode, true);
                                        }
                                    }
                                    if (!selectedNodeKey) {
                                        selectedNodeKey = currentNode.children[0].key;
                                        foundNode = currentNode.children[0];
                                        selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                                    }

                                }
                                else {
                                    if (featureId !== FEnums.Workorder && featureId !== FEnums.AssetPlacement && featureId !== FEnums.AnalyticsAndCharts && currentNode.NodeType && (FnProcessStringToCompare(currentNode.NodeType, "floor") || FnProcessStringToCompare(currentNode.NodeType, "store"))) {
                                        if (floorDeviceRecords && Object.keys(floorDeviceRecords).length) {
                                            const formattedData = await FnConvertFlatDataToHierarchyData(floorDeviceRecords, currentNode.NodeEntID);
                                            if (formattedData && formattedData.length > 0) {
                                                const clonnedData = FnDeepClone(formattedData)

                                                originalTreeData = await FnAddSubNode(originalTreeData, currentNode.key, formattedData, treeDataProps, featureId, true, currentNode.stepNo);
                                                currentNode.children = clonnedData;

                                                // Feature-filter for session matching only — do not prune original tree nodes.
                                                const childrenForTraverse = FnFindChildrenBasedOnKey([currentNode], currentNode.key, featureId) ?? currentNode.children;

                                                for (let index = 0; index < childrenForTraverse.length; index++) {
                                                    const childNode = childrenForTraverse[index];
                                                    if (childNode.key === selectedNodeID) {
                                                        selectedNodeKey = childNode.key;
                                                        foundNode = childNode;
                                                        selectedNode = { node: toSelectedNode(childNode), event: "auto-select", selected: true, selectedNodes: [] };
                                                    } else if (
                                                        childNode.key === roomID ||
                                                        childNode.key === floorID ||
                                                        childNode.key === locationID
                                                    ) {
                                                        await traverse(childNode, true);
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            // Minimum-node search will load floor children via API.
                                            // Skip the duplicate floor fetch here and keep session floor selected.
                                            // App QA Launch copies session variables — always traverse via API instead.
                                            if (minimumNodeOpen && !preferSessionSelection) {
                                                selectedNodeKey = currentNode.key;
                                                foundNode = currentNode;
                                                selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                                            } else {
                                                const filteredData = await FnCallApiToGetDataForTree(originalTreeData, currentNode, featureId, statusBarContext, sessionData);
                                                if (filteredData.originalTreeData) {
                                                    originalTreeData = filteredData.originalTreeData
                                                    if (filteredData.formattedTree) {
                                                        const clonnedData = FnDeepClone(filteredData.formattedTree);
                                                        currentNode.children = clonnedData;

                                                        // Feature-filter for session matching only — do not prune original tree nodes.
                                                        const childrenForTraverse = FnFindChildrenBasedOnKey([currentNode], currentNode.key, featureId) ?? currentNode.children;

                                                        for (let index = 0; index < childrenForTraverse.length; index++) {
                                                            const childNode = childrenForTraverse[index];
                                                            if (childNode.key === selectedNodeID) {
                                                                selectedNodeKey = childNode.key;
                                                                foundNode = childNode;
                                                                selectedNode = { node: toSelectedNode(childNode), event: "auto-select", selected: true, selectedNodes: [] };
                                                            } else if (
                                                                childNode.key === roomID ||
                                                                childNode.key === floorID ||
                                                                childNode.key === locationID
                                                            ) {
                                                                await traverse(childNode, true);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else if (currentNode.key === selectedNodeID) {
                                        // If the current node is the selected node based on SelectedNodeID
                                        selectedNodeKey = currentNode.key;
                                        foundNode = currentNode;
                                        selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                                    } else {
                                        selectedNodeKey = currentNode.key;
                                        foundNode = currentNode;
                                        selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                                    }
                                }
                            } else if (currentNode.key === selectedNodeID) {
                                // If the current node is the selected node based on SelectedNodeID
                                selectedNodeKey = currentNode.key;
                                foundNode = currentNode;
                                selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                            } else {
                                selectedNodeKey = currentNode.key;
                                foundNode = currentNode;
                                selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                            }
                        }
                        else {
                            if (currentNode.children.length === 1) {
                                await traverse(currentNode.children[0], false);
                            } else {
                                selectedNodeKey = currentNode.children[0].key;
                                foundNode = currentNode.children[0];
                                selectedNode = { node: toSelectedNode(foundNode), event: "auto-select", selected: true, selectedNodes: [] };
                            }
                        }
                    }
                }

                // Process each root node in the array
                if (originalTreeData?.length === 1) {
                    let roomToFilter: string | null = locationData?.find((item) => item.VariableName === "FilterRoomID")?.SessionValue || null;
                    if (roomToFilter) {
                        const filteredTree = FnFilterTreeById(originalTreeData, undefined, roomToFilter);
                        if (filteredTree.length) {
                            originalTreeData = filteredTree;
                        }
                    }
                    else {
                        for (const treeNode of originalTreeData) {
                            await traverse(treeNode, false);
                        }
                    }
                    if (minimumNodeOpen && !preferSessionSelection) {

                        const minimumNodeTypes = minimumNodeOpen
                            .split("/")
                            .map(type => type.trim())
                            .filter(Boolean);

                        const foundNodeFromOpen = expandedNodes.find(item =>
                            isMinimumNodeMatch(item, minimumNodeTypes, featureId)
                        );

                        if (!foundNodeFromOpen) {
                            // Use originalTreeData directly (same reference passed into traverse)
                            // so floor API updates are visible to getFeatureChildren lookups.
                            let startNodeForMinimum = originalTreeData[0];
                            if (floorID) {
                                const sessionFloorPath = FnFindNodeAndParents(originalTreeData, floorID);
                                if (sessionFloorPath?.length) {
                                    startNodeForMinimum = sessionFloorPath[sessionFloorPath.length - 1];
                                }
                            }
                            const minNode = FnFindMinimumNodeWithoutApi(
                                startNodeForMinimum,
                                minimumNodeOpen,
                                originalTreeData,
                                expandKeys,
                                expandedNodes,
                                featureId
                            );
                            if (minNode) {
                                selectedNodeKey = minNode.key;
                                const selectedNodeType = (minNode.NodeType ?? minNode.treetype ?? "").toLowerCase();
                                const isWorkorderOrAnalytics =
                                    featureId === FEnums.Workorder ||
                                    featureId === FEnums.AssetPlacement ||
                                    featureId === FEnums.AnalyticsAndCharts;
                                selectedNode = {
                                    node: (selectedNodeType === "site" || selectedNodeType === "room")
                                        ? minNode
                                        : {
                                            ...minNode,
                                            children: [],
                                            // WO/Analytics: leaf only on the selected view node — never on shared originalTreeData.
                                            ...(isWorkorderOrAnalytics && isFloorOrStoreNode(minNode)
                                                ? { isLeaf: true }
                                                : {})
                                        },
                                    event: "auto-select",
                                    selected: true,
                                    selectedNodes: []
                                };

                            }
                            else {
                                let getFirstDevicePromise = inFlightGetFirstDeviceRequests.get(exploreType);
                                if (!getFirstDevicePromise) {
                                    getFirstDevicePromise = new Promise<any>(async (resolve) => {
                                        const handleGetFirstDeviceApiResponse = (
                                            getFirstDeviceApiResponse: unknown, status?: string
                                        ) => {
                                            if (status === "200" &&
                                                getFirstDeviceApiResponse &&
                                                typeof getFirstDeviceApiResponse === "object" &&
                                                "deviceJson" in getFirstDeviceApiResponse
                                            ) {
                                                resolve(
                                                    FnParseJsonSafely(
                                                        getFirstDeviceApiResponse.deviceJson as string
                                                    )
                                                );
                                            } else {
                                                resolve(null);
                                            }
                                        };
                                        await axiosInterceptor(
                                            {
                                                url: EXPLORER.GetFirstDevice,
                                                data: {
                                                    "exploreType": exploreType
                                                },
                                                allowShowLoader: true,
                                                setFetchData: handleGetFirstDeviceApiResponse
                                            },
                                            statusBarContext
                                        ).catch(() => resolve(null));
                                    });
                                    inFlightGetFirstDeviceRequests.set(exploreType, getFirstDevicePromise);
                                    getFirstDevicePromise.finally(() => {
                                        setTimeout(() => {
                                            inFlightGetFirstDeviceRequests.delete(exploreType);
                                        }, 1000);
                                    });
                                }

                                const hierarchyOfTree = await getFirstDevicePromise;
                                if (hierarchyOfTree?.length) {
                                    const searchResult =
                                        await FnTraverseTreeByHierarchy(
                                            originalTreeData,
                                            hierarchyOfTree,
                                            featureId,
                                            exploreType,
                                            treeDataProps,
                                            statusBarContext
                                        );

                                    expandKeys =
                                        searchResult.expandKeys;

                                    expandedNodes =
                                        searchResult.expandedNodes;

                                    selectedNodeKey =
                                        searchResult.selectedNodeKey;

                                    selectedNode =
                                        searchResult.selectedNode;

                                    // Hierarchy path not fully matched — keep last expanded node selected.
                                    if (!selectedNode && expandedNodes.length) {
                                        const lastExpandedNode = expandedNodes[expandedNodes.length - 1];
                                        const nodeType = (lastExpandedNode.NodeType ?? lastExpandedNode.treetype ?? "").toLowerCase();
                                        selectedNodeKey = lastExpandedNode.key;
                                        selectedNode = {
                                            node: (nodeType === "site" || nodeType === "room" || nodeType === "inventory")
                                                ? lastExpandedNode
                                                : { ...lastExpandedNode, children: [] },
                                            event: "auto-select",
                                            selected: true,
                                            selectedNodes: []
                                        };
                                    }

                                    originalTreeData =
                                        searchResult.originalTreeData;
                                }

                                if (!selectedNode) {
                                    const allFloors: ITreeNode[] = [];
                                    const collectFloors = (nodes: ITreeNode[]) => {
                                        for (let i = 0; i < nodes.length; i++) {
                                            const node = nodes[i];
                                            if (isFloorOrStoreNode(node)) {
                                                allFloors.push(node);
                                                continue;
                                            }
                                            if (node.children && node.children.length > 0) {
                                                collectFloors(node.children);
                                            }
                                        }
                                    };
                                    collectFloors(originalTreeData);

                                    let targetFloor = floorID
                                        ? allFloors.find(
                                            (f) =>
                                                f.NodeEntID === floorID ||
                                                f.key === floorID ||
                                                f.NodeEntID?.split("##")[0] === floorID?.split("##")[0] ||
                                                String(f.key).split("##")[0] === String(floorID).split("##")[0]
                                        )
                                        : undefined;
                                    if (!targetFloor && allFloors.length > 0) {
                                        targetFloor = allFloors[0];
                                    }

                                    if (targetFloor) {
                                        const path =
                                            FnFindNodeAndParents(originalTreeData, targetFloor.key) ??
                                            (targetFloor.NodeEntID
                                                ? FnFindNodeAndParents(originalTreeData, targetFloor.NodeEntID)
                                                : null);
                                        if (path && path.length > 0) {
                                            const ancestors = path.slice(0, -1);
                                            for (const ancestor of ancestors) {
                                                if (!expandKeys.includes(ancestor.key)) {
                                                    expandKeys.push(ancestor.key);
                                                }
                                                if (!expandedNodes.some((n) => n.key === ancestor.key)) {
                                                    expandedNodes.push(ancestor);
                                                }
                                            }
                                        }

                                        selectedNodeKey = targetFloor.key;
                                        selectedNode = {
                                            node: toSelectedNode(targetFloor),
                                            event: "auto-select",
                                            selected: true,
                                            selectedNodes: []
                                        };
                                    } else if (originalTreeData?.length > 0) {
                                        selectedNodeKey = originalTreeData[0].key;
                                        selectedNode = {
                                            node: toSelectedNode(originalTreeData[0]),
                                            event: "auto-select",
                                            selected: true,
                                            selectedNodes: []
                                        };
                                    }
                                }

                                if (
                                    featureId !== FEnums.Workorder &&
                                    featureId !== FEnums.AssetPlacement &&
                                    featureId !== FEnums.AnalyticsAndCharts &&
                                    statusBarContext &&
                                    selectedNode &&
                                    selectedNode.node &&
                                    selectedNode.node.NodeType?.toLowerCase() === "floor" &&
                                    !selectedNode.node.children?.length &&
                                    selectedNode.node.HasChildren &&
                                    !hasChildrenForFloor
                                ) {
                                    const floorNode = selectedNode.node;
                                    const filteredData = await FnCallApiToGetDataForTree(
                                        originalTreeData,
                                        floorNode,
                                        featureId,
                                        statusBarContext,
                                        sessionData
                                    );
                                    if (filteredData.originalTreeData) {
                                        originalTreeData = filteredData.originalTreeData;
                                    }
                                }

                                return {
                                    expandKeys,
                                    expandedNodes,
                                    selectedNodeKey,
                                    selectedNode: selectedNode as ISelectedNodeInfo | null,
                                    originalTreeData
                                };

                            }

                        }
                    }
                }
            }
        }

        if (featureId !== FEnums.Workorder && featureId !== FEnums.AssetPlacement && featureId !== FEnums.AnalyticsAndCharts && statusBarContext && selectedNode && selectedNode.node && selectedNode.node.NodeType?.toLowerCase() === "floor" && !selectedNode.node.children.length && selectedNode.node.HasChildren && !hasChildrenForFloor) {

            const floorNode = selectedNode.node;
            const filteredData = await FnCallApiToGetDataForTree(originalTreeData, floorNode, featureId, statusBarContext, sessionData);
            if (filteredData.originalTreeData) {
                originalTreeData = filteredData.originalTreeData;
            }
        }
    } catch (error) {
        console.error(
            "Error in function(FnGetSelectionFromHierarchy): ",
            error
        );
    }
    return {
        expandKeys,
        expandedNodes,
        selectedNodeKey,
        selectedNode: selectedNode as ISelectedNodeInfo | null,
        originalTreeData
    };
}

export { FnGetSelectionFromHierarchy }
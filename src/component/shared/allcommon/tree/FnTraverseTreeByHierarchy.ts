
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { ISelectedNodeInfo, ITreeNode } from "../../allinterface/tree/ITreeControl";
import { IFeatureTree } from "../../allinterface/tree/ITreeForFlatDataContainer";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { EXPLORER } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { FnDeepClone } from "../basic/FnDeepClone";
import { FnProcessStringToCompare } from "../basic/FnProcessStringToCompare";
import { FnAddSubNode } from "./FnAddSubNode";
import { FnCallApiToGetDataForTree } from "./FnCallApiToGetDataForTree";
import { FnConvertFlatDataToHierarchyData } from "./FnConvertFlatDataToHierarchyData";
import { FnFindChildrenBasedOnKey } from "./FnFindChildrenBasedOnKey";

interface IHierarchySearchItem {
    EntityName: string;
    EntID?: string;
    Name?: string;
}

interface IHierarchySearchResult {
    expandKeys: string[];
    expandedNodes: ITreeNode[];
    selectedNodeKey: string;
    selectedNode: ISelectedNodeInfo | null;
    originalTreeData: ITreeNode[];
}

const FnTraverseTreeByHierarchy = async (
    trees: ITreeNode[],
    hierarchyOfTree: IHierarchySearchItem[],
    featureId: string,
    exploreType: number,
    treeDataProps: IFeatureTree,
    statusBarContext: IStatusBar
): Promise<IHierarchySearchResult> => {
    let originalTreeData = FnDeepClone(trees);
    const expandKeys: string[] = [];
    const expandedNodes: ITreeNode[] = [];
    let selectedNodeKey = "";
    let selectedNode: ISelectedNodeInfo | null = null;
    // ------------------------------------------------------------
    // Compare hierarchy item with tree node
    //
    // Priority:
    // 1. EntID
    // 2. EntityName + Name
    // ------------------------------------------------------------
    const isNodeMatch = (
        node: ITreeNode,
        hierarchyItem: IHierarchySearchItem
    ): boolean => {
        // If EntID exists, use EntID
        if (hierarchyItem.EntID) {
            const targetEntId = hierarchyItem.EntID.toLowerCase();
            return (
                node.NodeEntID?.toLowerCase() === targetEntId ||
                node.key?.toLowerCase() === targetEntId ||
                node.MountedDeviceID?.toString().toLowerCase() === targetEntId ||
                node.MountedDeviceEntID?.toString().toLowerCase() === targetEntId
            );
        }
        const nodeEntityName =
            node.NodeEntityname ??
            "";
        const nodeName =
            node.Name ??
            "";
        if (hierarchyItem.EntityName?.toLowerCase() === "parentdevice") {
            return FnProcessStringToCompare(
                nodeName,
                hierarchyItem.Name ?? ""
            );
        }
        if (nodeEntityName.length && nodeName.length) {
            return (
                (
                    FnProcessStringToCompare(
                        nodeEntityName,
                        hierarchyItem.EntityName
                    ) ||
                    FnProcessStringToCompare(
                        nodeEntityName.replace(/^__/, ""),
                        hierarchyItem.EntityName.replace(/^__/, "")
                    ) ||
                    ["device", "_device"].includes(hierarchyItem.EntityName?.toLowerCase() ?? "")
                ) &&
                FnProcessStringToCompare(
                    nodeName,
                    hierarchyItem.Name ?? ""
                )
            );
        }
        else {
            return FnProcessStringToCompare(
                nodeName,
                hierarchyItem.Name ?? ""
            );
        }
    };
    // ------------------------------------------------------------
    // Add node to expanded list without duplicate
    // ------------------------------------------------------------
    const addExpandedNode = (node: ITreeNode) => {
        if (!expandKeys.includes(node.key)) {
            expandKeys.push(node.key);
        }
        if (
            !expandedNodes.some(
                (item) => item.key === node.key
            )
        ) {
            expandedNodes.push(node);
        }
    };
    // ------------------------------------------------------------
    // Get children based on selected feature
    //
    // IMPORTANT:
    // FnFindChildrenBasedOnKey is used here instead of directly
    // using node.children.
    // ------------------------------------------------------------
    const getFeatureChildren = (
        node: ITreeNode
    ): ITreeNode[] => {
        const children = FnFindChildrenBasedOnKey(
            originalTreeData,
            node.key,
            featureId
        );
        if (children?.length) {
            node.children = children;
            return children;
        }
        return [];
    };
    // ------------------------------------------------------------
    // Load Floor / Store hierarchy from API
    // ------------------------------------------------------------
    const loadFloorChildren = async (
        floorNode: ITreeNode
    ): Promise<ITreeNode[]> => {
        return await new Promise<ITreeNode[]>(
            (resolve, reject) => {
                axiosInterceptor(
                    {
                        url:
                            EXPLORER.FloorDevicesConfigurationHierarchyReduced,
                        data: {
                            floorID:
                                floorNode.NodeEntID,
                            exploreType,
                            isRefresh: false
                        },
                        allowShowLoader: true,
                        setFetchData: async (
                            response: unknown,
                            status?: string
                        ) => {
                            try {
                                if (
                                    status !== "200" ||
                                    !response ||
                                    typeof response !== "object" ||
                                    !("hierarchyJson" in response)
                                ) {
                                    resolve([]);
                                    return;
                                }
                                const apiData =
                                    FnParseJsonSafely(
                                        response
                                            .hierarchyJson as string
                                    );
                                const formattedData =
                                    await FnConvertFlatDataToHierarchyData(
                                        apiData,
                                        floorNode.NodeEntID,
                                        featureId
                                    );
                                if (!formattedData?.length) {
                                    resolve([]);
                                    return;
                                }

                                // Add complete hierarchy to original tree
                                originalTreeData =
                                    await FnAddSubNode(
                                        originalTreeData,
                                        floorNode.key,
                                        formattedData,
                                        treeDataProps,
                                        featureId,
                                        true,
                                        floorNode.stepNo
                                    );
                                /*
                                 * IMPORTANT
                                 *
                                 * Do not directly use formattedData.
                                 *
                                 * Get children again using
                                 * FnFindChildrenBasedOnKey so feature-specific
                                 * tree rules are applied.
                                 */
                                const featureChildren =
                                    FnFindChildrenBasedOnKey(
                                        originalTreeData,
                                        floorNode.key,
                                        featureId
                                    );
                                floorNode.children =
                                    featureChildren ?? [];
                                resolve(
                                    floorNode.children
                                );
                            } catch (error) {
                                reject(error);
                            }
                        }
                    },
                    statusBarContext
                );
            }
        );
    };
    // ------------------------------------------------------------
    // Ensure children are available
    // ------------------------------------------------------------
    const ensureChildren = async (
        node: ITreeNode
    ): Promise<ITreeNode[]> => {
        // First always check feature-specific children
        let children = getFeatureChildren(node);

        if (children.length) {
            return children;
        }

        const nodeType =
            node.NodeType ??
            "";
        const treeType =
            node.treetype ??
            "";

        const normalizedNodeType = nodeType.toLowerCase();
        const normalizedTreeType = treeType.toLowerCase();

        const isFloorOrStore =
            normalizedNodeType === "floor" ||
            normalizedNodeType === "store";

        const isRack =
            normalizedNodeType === "rack" ||
            normalizedTreeType === "rack";

        const isDeviceOrSlot =
            ["deviceslot", "device", "mounteddevice"].includes(normalizedTreeType) ||
            ["ru", "slot", "deviceslot", "device", "mounteddevice"].includes(normalizedNodeType);

        // Floor / Store: existing API logic
        if (
            isFloorOrStore &&
            node.HasChildren
        ) {
            await loadFloorChildren(node);

            children = getFeatureChildren(node);
        }

        // Rack / Device / Slot / RU: use existing FnCallApiToGetDataForTree
        else if (
            (isRack || isDeviceOrSlot) &&
            (
                Boolean(node.HasChildren) ||
                (node.HasChildren != null && Number(node.HasChildren) > 0) ||
                Boolean(node.MountedDeviceEntID && node.MountedDeviceEntID.length > 0) ||
                isRack
            )
        ) {
            const result = await FnCallApiToGetDataForTree(
                originalTreeData,
                node,
                featureId,
                statusBarContext
            );

            // IMPORTANT: update the local original tree
            // because FnCallApiToGetDataForTree adds API data to it.
            originalTreeData = result.originalTreeData;

            // Re-read children using feature-specific hierarchy rules
            children = getFeatureChildren(node);
        }

        return children;
    };
    // ------------------------------------------------------------
    // Find matching node at current hierarchy level
    // ------------------------------------------------------------
    interface IFindHierarchyNodeResult {
        node: ITreeNode;
        parentPath: ITreeNode[];
    }

    const findMatchingNode = (
        nodes: ITreeNode[],
        hierarchyItem: IHierarchySearchItem
    ): IFindHierarchyNodeResult | null => {

        const traverse = (
            currentNodes: ITreeNode[],
            parentPath: ITreeNode[]
        ): IFindHierarchyNodeResult | null => {

            for (const node of currentNodes) {

                // Found requested hierarchy item
                if (isNodeMatch(node, hierarchyItem)) {
                    return {
                        node,
                        parentPath
                    };
                }

                // Get feature-specific children
                const featureChildren =
                    FnFindChildrenBasedOnKey(
                        originalTreeData,
                        node.key,
                        featureId
                    );

                if (featureChildren?.length) {

                    const result = traverse(
                        featureChildren,
                        [
                            ...parentPath,
                            node
                        ]
                    );

                    if (result) {
                        return result;
                    }
                }
            }

            return null;
        };

        return traverse(nodes, []);
    };
    // ------------------------------------------------------------
    // Main hierarchy traversal
    // ------------------------------------------------------------
    let currentNodes = originalTreeData;
    let isLastHierarchyNodeFound = false;

    const isRackHierarchyItem = (item: IHierarchySearchItem): boolean => {
        const entityName = (item.EntityName ?? "").toLowerCase().replace(/^__/, "");
        return entityName === "rack" || entityName === "parentdevice";
    };

    const rackItemIndex = hierarchyOfTree.findIndex(
        (item, idx) => idx < hierarchyOfTree.length - 1 && isRackHierarchyItem(item)
    );

    if (rackItemIndex !== -1) {
        let rackNode: ITreeNode | null = null;

        for (let i = 0; i <= rackItemIndex; i++) {
            const hierarchyItem = hierarchyOfTree[i];
            let matchResult = findMatchingNode(currentNodes, hierarchyItem);

            // Fallback: If intermediate node (e.g. Location) was not matched,
            // check if the Rack itself exists under currentNodes directly
            if (!matchResult && i < rackItemIndex) {
                const directRackResult = findMatchingNode(currentNodes, hierarchyOfTree[rackItemIndex]);
                if (directRackResult) {
                    matchResult = directRackResult;
                    i = rackItemIndex;
                }
            }

            if (!matchResult) {
                currentNodes = [];
                break;
            }

            const matchedNode = matchResult.node;
            for (const parentNode of matchResult.parentPath) {
                addExpandedNode(parentNode);
            }
            addExpandedNode(matchedNode);

            await ensureChildren(matchedNode);

            if (i === rackItemIndex) {
                rackNode = matchedNode;
                break;
            }

            const children =
                FnFindChildrenBasedOnKey(
                    originalTreeData,
                    matchedNode.key,
                    featureId
                ) ?? [];

            if (!children.length) {
                currentNodes = [];
                break;
            }

            currentNodes = children;
        }

        // Under the matched Rack, find the target mounted device
        if (rackNode) {
            const targetItem = hierarchyOfTree[hierarchyOfTree.length - 1];

            // 1. Search under rackNode for targetItem directly (matching NodeEntID, key, MountedDeviceID, MountedDeviceEntID)
            let targetMatch = findMatchingNode([rackNode], targetItem);

            // 2. If not found directly, check intermediate items after rack in reverse order (e.g. Slot)
            if (!targetMatch) {
                for (let j = hierarchyOfTree.length - 2; j > rackItemIndex; j--) {
                    targetMatch = findMatchingNode([rackNode], hierarchyOfTree[j]);
                    if (targetMatch) break;
                }
            }

            if (targetMatch) {
                for (const parentNode of targetMatch.parentPath) {
                    addExpandedNode(parentNode);
                }

                isLastHierarchyNodeFound = true;
                selectedNodeKey = targetMatch.node.key;
                selectedNode = {
                    node: {
                        ...targetMatch.node,
                        children: []
                    },
                    event: "auto-select",
                    selected: true,
                    selectedNodes: []
                };
            }
        }
    } else {
        for (
            let hierarchyIndex = 0;
            hierarchyIndex < hierarchyOfTree.length;
            hierarchyIndex++
        ) {
            const hierarchyItem =
                hierarchyOfTree[hierarchyIndex];

            let matchResult =
                findMatchingNode(
                    currentNodes,
                    hierarchyItem
                );

            const isLastHierarchyItem =
                hierarchyIndex === hierarchyOfTree.length - 1;

            // Fallback: If intermediate node was not found, check if last target exists in currentNodes
            if (!matchResult && !isLastHierarchyItem) {
                const targetFallbackMatch = findMatchingNode(
                    currentNodes,
                    hierarchyOfTree[hierarchyOfTree.length - 1]
                );
                if (targetFallbackMatch) {
                    matchResult = targetFallbackMatch;
                    hierarchyIndex = hierarchyOfTree.length - 1;
                }
            }

            if (!matchResult) {
                break;
            }

            const matchedNode =
                matchResult.node;

            // Expand intermediate nodes
            for (const parentNode of matchResult.parentPath) {
                addExpandedNode(parentNode);
            }

            // ONLY select when actual LAST hierarchy item is found
            if (hierarchyIndex === hierarchyOfTree.length - 1) {
                isLastHierarchyNodeFound = true;

                selectedNodeKey =
                    matchedNode.key;

                selectedNode = {
                    node: {
                        ...matchedNode,
                        children: []
                    },
                    event: "auto-select",
                    selected: true,
                    selectedNodes: []
                };

                break;
            }

            // Current matched hierarchy node needs expansion
            addExpandedNode(matchedNode);

            // Get/load children
            await ensureChildren(matchedNode);

            const children =
                FnFindChildrenBasedOnKey(
                    originalTreeData,
                    matchedNode.key,
                    featureId
                ) ?? [];

            if (!children.length) {
                break;
            }

            currentNodes = children;
        }
    }

    // ------------------------------------------------------------
    // If LAST hierarchy node was not found,
    // explicitly return no selection
    // ------------------------------------------------------------
    if (!isLastHierarchyNodeFound) {
        selectedNodeKey = "";
        selectedNode = null;
    }
    return {
        expandKeys,
        expandedNodes,
        selectedNodeKey,
        selectedNode,
        originalTreeData
    };
};
export type { IHierarchySearchItem, IHierarchySearchResult }
export { FnTraverseTreeByHierarchy }
import { FnFindChildrenBasedOnKey } from "./FnFindChildrenBasedOnKey";
import { FnUpdateNodeWithTitleAndIcon } from "./FnUpdateNodeWithTitleAndIcon";
import { IFeatureTree } from "../../allinterface/tree/ITreeForFlatDataContainer";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { FEnums } from "../../../constants/Feature";
import { FnGetIsLeafForRack } from "./FnGetIsLeafForRack";

// This function used to remove children nodes based on feature and other conditions
const FnRemoveChildrenNodes = async (
    treeData: ITreeNode[],
    keyToFind: string | null,
    featureId: string,
    featureTreeProps: IFeatureTree,
    originalData: ITreeNode[],
    isFilterApplied?: boolean
) => {
    try {
        const isConfigurationFeature =
            featureId === FEnums.AssetConfiguration ||
            featureId === FEnums.ConfigureDevice ||
            featureId === FEnums.InventoryConfiguration;

        const isFeatureShowsUptoFloor = featureId === FEnums.AnalyticsAndCharts ||
            featureId === FEnums.Workorder;

        const updateIsLeaf = (
            node: ITreeNode,
            nodeType: string | undefined
        ) => {
            const hasChildren =
                node.HasChildren != null &&
                node.HasChildren > 0 && !isFilterApplied;

            // Floor and Store should never be leaf nodes
            // when HasChildren > 0.
            if (
                hasChildren && !isFeatureShowsUptoFloor &&
                (nodeType === "floor" || nodeType === "store")
            ) {
                node.isLeaf = false;
                return;
            }

            if (nodeType === "rack") {
                node.isLeaf = FnGetIsLeafForRack(node, featureId);
                return;
            }

            if (isConfigurationFeature) {
                node.isLeaf = !hasChildren;
            } else if (
                featureId === FEnums.EditFloorLayout ||
                featureId === FEnums.Relocate ||
                featureId === FEnums.AuditSession
            ) {
                node.isLeaf =
                    nodeType === "device" ||
                    nodeType === "rack";
            } else {
                node.isLeaf =
                    nodeType === "rack" && hasChildren
                        ? false
                        : true;
            }
        };

        const updateNode = async (nodes: ITreeNode[]) => {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];

                const nodeType = node.NodeType?.toLowerCase();
                const treeType = node.treetype?.toLowerCase();

                if (keyToFind && node.key === keyToFind) {
                    let foundNodes = FnFindChildrenBasedOnKey(
                        originalData,
                        node.key,
                        featureId
                    );

                    if (!foundNodes?.length) {
                        updateIsLeaf(node, nodeType);
                        node.children = [];
                    } else {
                        foundNodes = FnUpdateNodeWithTitleAndIcon(
                            foundNodes,
                            featureTreeProps,
                            featureId
                        );

                        node.children = foundNodes;
                    }
                } else {
                    let foundNodes = FnFindChildrenBasedOnKey(
                        originalData,
                        node.key,
                        featureId
                    );

                    if (!foundNodes?.length) {
                        updateIsLeaf(node, nodeType);
                        node.children = [];
                    } else {
                        foundNodes = FnUpdateNodeWithTitleAndIcon(
                            foundNodes,
                            featureTreeProps,
                            featureId
                        );

                        node.children = foundNodes;
                    }
                }

                if (node.children?.length) {
                    await updateNode(node.children);
                }
            }
        };

        await updateNode(treeData);
    } catch (error) {
        console.error(
            "Error in function(FnRemoveChildrenNodes): ",
            error
        );
    }

    return treeData;
};

export { FnRemoveChildrenNodes };
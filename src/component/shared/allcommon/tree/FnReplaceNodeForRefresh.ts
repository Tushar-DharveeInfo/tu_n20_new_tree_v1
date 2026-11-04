
import { FnCheckAllowCheckbox } from "./FnCheckAllowCheckbox";
import { FnDeepClone } from "../basic/FnDeepClone";
import { IFeatureTree } from "../../allinterface/tree/ITreeForFlatDataContainer";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { TreeNodeIcon } from "../../tree/treenodeicon/TreeNodeIcon";
import { TreeNodeTitle } from "../../tree/treenodetitle/TreeNodeTitle";

// This function replaces a node with the matching key
const FnReplaceNodeForRefresh = async (
    tree: ITreeNode[],
    nodeKey: string,
    newNode: ITreeNode | ITreeNode[],
    treeDataPorps: IFeatureTree,
    featureId: string,
    updateOriginalTree: boolean,
    stepNo: number,
    isMountedDevice?: boolean
): Promise<ITreeNode[]> => {
    if (!tree || !Array.isArray(tree)) return [];
    if (!newNode) return tree;
    if (Array.isArray(newNode) && newNode.length === 0) return tree;

    const result = FnDeepClone(tree);

    try {
        let isFound = false;

        const updateNode = (
            nodes: ITreeNode[],
            nodeIndex: number = 0
        ): void => {
            if (!nodes || !Array.isArray(nodes)) return;
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (!node) continue;

                node.stepNo = nodeIndex + 1;
                node.NaturalSortorder = i;

                node.title = TreeNodeTitle(node, treeDataPorps, featureId);
                node.checkable = FnCheckAllowCheckbox(node, featureId);

                if (treeDataPorps?.allowIcon) {
                    node.icon = TreeNodeIcon(
                        node,
                        treeDataPorps.instanceName ?? ""
                    );
                }

                if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                    updateNode(node.children, nodeIndex + 1);
                }
            }
        };

        const replaceNode = (nodes: ITreeNode[]): void => {
            if (!nodes || !Array.isArray(nodes)) return;
            for (let i = 0; i < nodes.length; i++) {
                if (!nodes[i]) continue;
                if (nodes[i].key === nodeKey) {
                    isFound = true;
                    if (isMountedDevice && Array.isArray(newNode)) {
                        if (newNode.length == 1 && newNode.find((item) => item.key === nodeKey)) {
                            nodes[i] = newNode[0] as ITreeNode;
                        }
                        else {
                            nodes[i].children = newNode;
                        }
                    }
                    else {
                        const targetNode = Array.isArray(newNode) ? (newNode[0] ?? nodes[i]) : newNode;
                        if (targetNode) {
                            nodes[i] = targetNode as ITreeNode;
                        }
                    }
                    return;
                }

                if (nodes[i].children && Array.isArray(nodes[i].children)) {
                    replaceNode(nodes[i].children!);
                    if (isFound) return;
                }
            }
        };

        if (!updateOriginalTree) {
            const nodesToUpdate = Array.isArray(newNode) ? newNode.filter(Boolean) : [newNode].filter(Boolean);
            if (nodesToUpdate.length > 0) {
                updateNode(nodesToUpdate, stepNo);
            }
        }

        replaceNode(result);

        return result;
    } catch (error) {
        console.error("Error in function(FnReplaceNode): ", error);
        return result;
    }
};

export { FnReplaceNodeForRefresh };
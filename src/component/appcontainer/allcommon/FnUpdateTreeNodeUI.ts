
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { IFeatureTree } from "../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { TreeNodeIcon } from "../../shared/tree/treenodeicon/TreeNodeIcon";
import { TreeNodeTitle } from "../../shared/tree/treenodetitle/TreeNodeTitle";

function FnUpdateTreeNodeUI(
    treeData: ITreeNode[],
    treeDataProps: IFeatureTree,
    featureId: string
): ITreeNode[] {

    const updateNodes = (nodes: ITreeNode[]): ITreeNode[] => {
        return nodes.map((node, index) => {

            const updatedNode: ITreeNode = {
                ...node,
                NaturalSortorder: index,
                title: TreeNodeTitle(node, treeDataProps, featureId),
                ...(treeDataProps.allowIcon && {
                    icon: TreeNodeIcon(node, treeDataProps.instanceName ?? "")
                })
            };

            if (node.children?.length) {
                updatedNode.children = updateNodes(node.children);
            }

            return updatedNode;
        });
    };

    return updateNodes(treeData);
}

export { FnUpdateTreeNodeUI };
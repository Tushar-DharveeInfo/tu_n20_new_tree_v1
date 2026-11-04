
import { FnCheckAllowCheckbox } from "./tree/FnCheckAllowCheckbox";
import { FnUpdateTreeNodesBasedOnFeatureId } from "./FnUpdateTreeNodesBasedOnFeatureId";
import { IFeatureTree } from "../allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITreeNode } from "../allinterface/tree/ITreeControl";
import { TreeNodeTitle } from "../tree/treenodetitle/TreeNodeTitle";
import { TreeNodeIcon } from '../tree/treenodeicon/TreeNodeIcon'

// This function updates visible tree nodes 
async function FnUpdateVisibleTreeData(originalTreeData: ITreeNode[], treeData: ITreeNode[], parentNodeKeys: string[], treeDataPorps: IFeatureTree, featureId: string, foundFromCache: boolean = false) {
    const visibleNodes: ITreeNode[] = [];
    try {
        let filteredTreeData = originalTreeData;
        if (!foundFromCache) {
            filteredTreeData = await FnUpdateTreeNodesBasedOnFeatureId(originalTreeData, featureId);
        }

        // Function to find and update treeData with missing nodes from originalTreeData
        const updateTreeDataFromOriginal = (originalData: ITreeNode[], newData: ITreeNode[], parentKeys: string[]): ITreeNode[] => {
            const updatedData: ITreeNode[] = [];

            for (let i = 0; i < originalData.length; i++) {
                const originalNode = originalData[i];
                // Check if the current node exists in newData
                let existingNode = newData.find((node: ITreeNode) => node.key === originalNode.key);

                // If the node is expanded (part of parentNodeKeys) and it doesn't exist, add it from originalTreeData
                if (parentKeys.includes(originalNode.key)) {
                    if (!existingNode) {
                        // Add the missing node from originalTreeData
                        existingNode = { ...originalNode, children: [] }; // Initialize without children
                    }

                    // Recursively update its children if it has any
                    if (originalNode.children && originalNode.children.length > 0) {
                        existingNode.children = updateTreeDataFromOriginal(originalNode.children, existingNode.children || [], parentKeys);
                    }
                }

                // Push the updated or original node to the updatedData array
                updatedData.push(existingNode || { ...originalNode, children: [] });
            }

            return updatedData;
        };

        // Update the current treeData with originalTreeData, only adding missing nodes
        const updatedTreeData = updateTreeDataFromOriginal(filteredTreeData, treeData, parentNodeKeys);
        const findVisibleNodes = (data: ITreeNode[], parentNode: ITreeNode | null, nodeIndex: number = 0): void => {
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                element.stepNo = nodeIndex + 1;
                element.NaturalSortorder = index;
                element.title = TreeNodeTitle(element, treeDataPorps, featureId);
                element.checkable = FnCheckAllowCheckbox(element, featureId);
                if (treeDataPorps.allowIcon) {
                    element.icon = TreeNodeIcon(element, treeDataPorps.instanceName ?? "");
                }

                // Check if the current node is present in treeData
                const newNode = { ...element, children: [] };

                if (parentNode) {
                    parentNode.children.push(newNode);
                } else {
                    visibleNodes.push(newNode);
                }

                // Recursively process children
                if (element.children && element.children.length > 0) {
                    findVisibleNodes(element.children, newNode, nodeIndex + 1);
                }
            }
        };


        // Start processing visible nodes based on updated treeData
        findVisibleNodes(updatedTreeData, null);
    } catch (error) {
        console.error(
            "Error in function(FnUpdateVisibleTreeData): ",
            error
        );

    }
    return { visibleTree: visibleNodes };
}

export { FnUpdateVisibleTreeData }
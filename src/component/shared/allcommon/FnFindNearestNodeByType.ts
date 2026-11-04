
import { ITreeNode } from "../allinterface/tree/ITreeControl";

function FnFindNearestNodeByType(
    originalTreeData: ITreeNode[],
    currentNode: ITreeNode,
    targetNodeType: string,
    isDuplicateAvailable?: boolean,
    isUpdateNeededFromTree?: boolean
): ITreeNode | null {
    let node: ITreeNode | null = currentNode;


    if (
        currentNode.NodeType?.toLowerCase() === targetNodeType.toLowerCase() &&
        !isUpdateNeededFromTree
    ) {
        return currentNode;
    }

    try {
        // Recursive function to find node by key
        function findNodeByKey(
            tree: ITreeNode[],
            key: string,
            typeToFind?: string
        ): ITreeNode | null {
            for (const node of tree) {
                if (node.key === key || node.NodeEntID === key) {
                    if (!typeToFind || typeToFind === node.NodeType) {
                        return node;
                    }
                }

                if (node.children?.length) {
                    const found = findNodeByKey(node.children, key, typeToFind);
                    if (found) {
                        return found;
                    }
                }
            }

            return null;
        }

        // Return latest Floor node from tree if update is needed
        if (
            isUpdateNeededFromTree &&
            currentNode.NodeType?.toLowerCase() === "floor"
        ) {
            const floorNode = findNodeByKey(
                originalTreeData,
                currentNode.NodeEntID ?? currentNode.key
            );

            if (floorNode) {
                return floorNode;
            }
        }

        // Traverse upwards by following parentEntID
        while (node && node.parentEntID) {
            const parentNode = findNodeByKey(
                originalTreeData,
                node.parentEntID,
                isDuplicateAvailable ? targetNodeType : undefined
            );

            if (!parentNode) {
                return null;
            }

            if (
                parentNode.NodeType?.toLowerCase() === targetNodeType?.toLowerCase() ||
                parentNode.treetype?.toLowerCase() === targetNodeType?.toLowerCase()
            ) {
                return parentNode;
            }

            node = parentNode;
        }
    } catch (error) {
        console.error("Error in function(FnFindNearestNodeByType): ", error);
    }

    return null;
}

export { FnFindNearestNodeByType }
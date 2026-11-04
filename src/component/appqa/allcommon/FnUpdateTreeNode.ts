import { FnDeepClone } from "../../shared/allcommon/basic/FnDeepClone";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";


const FnUpdateTreeNode = (
    treeData: ITreeNode[],
    updateNodeKey: string,
    updatedNodeDetails: Partial<ITreeNode>
): ITreeNode[] => {
    const result = FnDeepClone(treeData);

    const updateNode = (nodes: ITreeNode[]): boolean => {
        for (const node of nodes) {
            if (node.key === updateNodeKey) {
                Object.assign(node, updatedNodeDetails);
                return true;
            }

            if (node.children?.length && updateNode(node.children)) {
                return true;
            }
        }

        return false;
    };

    updateNode(result);

    return result;
};
export { FnUpdateTreeNode };
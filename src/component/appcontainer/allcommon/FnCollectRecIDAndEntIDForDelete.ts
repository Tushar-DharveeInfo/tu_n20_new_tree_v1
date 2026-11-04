
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";

const FnCollectRecIDAndEntIDForDelete = (
    treeNodes: ITreeNode[]
): { recIDs: string; entIDs: string } => {
    const recIDList: string[] = [];
    const entIDList: string[] = [];

    const traverse = (nodes: ITreeNode[]) => {
        for (const node of nodes) {
            if (node.RecID) recIDList.push(node.RecID);
            if (node.EntID) entIDList.push(node.EntID);

            if (node.children && node.children.length > 0) {
                traverse(node.children);
            }
        }
    };

    traverse(treeNodes);

    return {
        recIDs: recIDList.join(";"),
        entIDs: entIDList.join(";")
    };
}

export { FnCollectRecIDAndEntIDForDelete }

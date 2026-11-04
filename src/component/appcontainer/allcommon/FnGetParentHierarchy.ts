import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";

const FnGetParentHierarchy = (
    treeData: ITreeNode[],
    targetKey: string
): ITreeNode[] => {

    const path: ITreeNode[] = [];

    const dfs = (nodes: ITreeNode[], currentPath: ITreeNode[]): boolean => {
        for (const node of nodes) {

            const newPath = [...currentPath, node];

            if (node.key === targetKey || node.NodeEntID === targetKey) {
                path.push(...newPath);
                return true;
            }

            if (node.children && dfs(node.children, newPath)) {
                return true;
            }
        }
        return false;
    };

    dfs(treeData, []);
    return path;
};

export { FnGetParentHierarchy }
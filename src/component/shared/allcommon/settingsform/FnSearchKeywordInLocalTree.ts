import { ITreeNode } from "../../allinterface/tree/ITreeControl";

function FnSearchKeywordInLocalTree(
    searchText: string,
    treeData: ITreeNode[],
    excludeEntIDs: string[] = [],
    parentNodes: ITreeNode[] = [],
    isRegex: boolean = false
): { foundNode: ITreeNode | null, parentNodes: ITreeNode[] } {
    try {
        if (!searchText || !treeData || treeData.length === 0) {
            return { foundNode: null, parentNodes: [] };
        }

        let regex: RegExp | null = null;
        if (isRegex) {
            try {
                regex = new RegExp(searchText, "i");
            } catch (err) {
                console.error("Invalid regular expression pattern in settingsform/FnSearchKeywordInLocalTree:", err);
                return { foundNode: null, parentNodes: [] };
            }
        }

        for (const node of treeData) {
            const isExcluded = (node.NodeEntID && excludeEntIDs.includes(node.NodeEntID)) || excludeEntIDs.includes(node.key);

            // Check match only if not excluded
            if (!isExcluded) {
                if (isRegex && regex) {
                    if ((node.Name && regex.test(node.Name)) || (node.NodeEntID && regex.test(node.NodeEntID))) {
                        return { foundNode: node, parentNodes };
                    }
                } else {
                    if (node.Name && node.Name?.toLowerCase().includes(searchText?.toLowerCase())) {
                        return { foundNode: node, parentNodes };
                    }
                }
            }

            // Always check children regardless of exclusion
            if (node.children && node.children.length > 0) {
                const result = FnSearchKeywordInLocalTree(
                    searchText,
                    node.children,
                    excludeEntIDs,
                    [...parentNodes, node],
                    isRegex
                );
                if (result.foundNode) {
                    return result;
                }
            }
        }
    } catch (error) {
        console.error('Error in search keyword: ', error);
    }

    return { foundNode: null, parentNodes: [] };
}

export { FnSearchKeywordInLocalTree }


import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// find parents based on node
function FnFindNodeAndParents(
    data: ITreeNode[],
    targetKey: string
): ITreeNode[] | null {
    try {
        // Helper function to recursively search for the node and collect parent nodes
        function search(
            nodes: ITreeNode[],
            key: string,
            parents: ITreeNode[] = []
        ): ITreeNode[] | null {

            if (!Array.isArray(nodes)) return null;

            for (const node of nodes) {
                if (!node || typeof node !== "object") continue;

                const lowerKey = typeof key === "string" ? key.toLowerCase() : "";

                const nodeKey = typeof node.key === "string" ? node.key.toLowerCase() : "";
                const nodeEntId = typeof node.NodeEntID === "string" ? node.NodeEntID.toLowerCase() : "";
                const nodeEqId = typeof node.EQID === "string" ? node.EQID.toLowerCase() : "";

                // Match conditions (unchanged logic)
                if (
                    nodeKey === lowerKey ||
                    nodeEntId === lowerKey ||
                    nodeEqId === lowerKey
                ) {
                    return [...parents, node];
                }

                // Recursive search
                if (Array.isArray(node.children)) {
                    const result = search(node.children, key, [...parents, node]);
                    if (result) {
                        return result;
                    }
                }
            }

            return null;
        }

        // Input validation
        if (!Array.isArray(data) || typeof targetKey !== "string") {
            return null;
        }

        // Start searching from the root level
        return search(data, targetKey);

    } catch (error) {
        console.error("FnFindNodeAndParents error:", error);
        return null;
    }
}
export { FnFindNodeAndParents }
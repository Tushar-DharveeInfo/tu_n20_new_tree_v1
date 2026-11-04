
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// This function will return the tree node if key found
const FnGetNodeDetailsBasedOnKey = (
    treeData: ITreeNode[],    // Hierarchical tree data
    key: Key            // Key to search for
): { key: string, node: ITreeNode } | null => {
    try {
        // Iterate through each node in the tree
        for (const item of treeData) {
            const keyStr = key !== undefined && key !== null ? key.toString().toLowerCase() : undefined;
            const isMatch =
                item.key === key ||
                (keyStr !== undefined && (
                    item.key?.toString().toLowerCase() === keyStr ||
                    item.NodeEntID?.toString().toLowerCase() === keyStr ||
                    item.MountedDeviceID?.toString().toLowerCase() === keyStr
                ));

            // If key matches, return the node
            if (isMatch) {
                return { key: item.key, node: item };
            }

            // If children exist, search recursively
            if (item.children && item.children.length > 0) {
                const result = FnGetNodeDetailsBasedOnKey(item.children, key); // Recursive call
                if (result) {
                    return result; // Return as soon as match is found
                }
            }
        }
    } catch (error) {
        console.error(
            "Error in function(FnGetNodeDetailsBasedOnKey): ",
            error
        );
    }

    // Return null if no match is found
    return null;
};

export { FnGetNodeDetailsBasedOnKey }
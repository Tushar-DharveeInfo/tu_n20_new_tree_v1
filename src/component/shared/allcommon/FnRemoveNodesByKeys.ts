
import { Key } from "react";
import { ITreeNode } from "../allinterface/tree/ITreeControl";

function FnRemoveNodesByKeys(
    tree: ITreeNode[],
    keysToRemove: Key[]
): ITreeNode[] {
    try {
        const normalizedKeys = new Set(
            keysToRemove.map(key => String(key).toLowerCase())
        );

        const removeNodes = (nodes: ITreeNode[]) => {
            for (let i = nodes.length - 1; i >= 0; i--) {
                const node = nodes[i];

                if (normalizedKeys.has(String(node.key).toLowerCase())) {
                    nodes.splice(i, 1);
                    continue;
                }

                if (node.children?.length) {
                    removeNodes(node.children);

                    if (node.children.length === 0) {
                        node.children = [];
                        node.isLeaf = true;
                        if (import.meta.env.PROD)
                            console.log('setleaf true:', node);
                    }
                }
            }
        };

        removeNodes(tree);
    } catch (error) {
        console.error(
            "Error in function(FnRemoveNodesByKeys): ",
            error
        );
    }

    return tree;
}

export { FnRemoveNodesByKeys }

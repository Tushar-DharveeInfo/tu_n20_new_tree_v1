
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";

function FnGetNodeTypeCountsFromNodeAsString(
    tree: ITreeNode[],
    nodeTypes: string
): Record<string, string | number | undefined> {
    try {
        // Validate inputs
        if (!Array.isArray(tree) || !nodeTypes || typeof nodeTypes !== "string" || !nodeTypes.length) {
            return {};
        }

        const types = nodeTypes
            .split("|")
            .map(type => type.trim())
            .filter(Boolean);

        if (!types.length) {
            return {};
        }

        const counts: Record<string, number> = {};

        // Initialize counts
        types.forEach(type => {
            counts[type] = 0;
        });

        const traverse = (nodes: ITreeNode[]): void => {
            if (!Array.isArray(nodes) || !nodes.length) {
                return;
            }

            for (const node of nodes) {
                try {
                    if (!node || typeof node !== "object") {
                        continue;
                    }

                    const entity = node.NodeEntityname;
                    const type = node.NodeType;

                    let actualType: string | undefined;
                    let normalizedEntity = entity;

                    // Remove leading underscores
                    if (
                        typeof entity === "string" &&
                        entity.startsWith("_")
                    ) {
                        normalizedEntity = entity.replace(/^_+/, "");
                    }

                    // Match entity name first
                    if (
                        typeof normalizedEntity === "string" &&
                        types.includes(normalizedEntity)
                    ) {
                        actualType = normalizedEntity;
                    }
                    // Match node type
                    else if (
                        typeof type === "string" &&
                        types.includes(type)
                    ) {
                        actualType = type;
                    }

                    if (actualType) {
                        counts[actualType] =
                            (counts[actualType] ?? 0) + 1;
                    }

                    // Traverse children safely
                    if (
                        Array.isArray(node.children) &&
                        node.children.length > 0
                    ) {
                        traverse(node.children);
                    }
                } catch (nodeError) {
                    console.error(
                        "Error in node traversal:",
                        nodeError
                    );
                }
            }
        };

        traverse(tree);

        const result: Record<string, string | number | undefined> = {};

        for (const type of types) {
            if ((counts[type] ?? 0) > 0) {
                result[`${type}s`] = counts[type];
            }
        }

        return result;
    } catch (error) {
        console.error(
            "Error in get nodetypes from node:",
            error
        );

        return {};
    }
}

export { FnGetNodeTypeCountsFromNodeAsString };

import { FnGenerateUID } from "../../shared/allcommon/settingsform/FnGenerateUID";

// This function transforms api data to hierarchy
const FnTransformDataToHierarchy = async <T,>(
    data: T[],
    groupKeys: (keyof T)[],
    nameKey: keyof T,
    entIdKey: keyof T,
    parentEntId: string,
    allowSort?: boolean
): Promise<any[]> => {
    const sortByName = (arr: any[]) => {
        try {
            if (!allowSort) return arr;
            return arr.sort((a, b) =>
                String(a.Name ?? "").localeCompare(
                    String(b.Name ?? ""),
                    undefined,
                    { sensitivity: "base" }
                )
            );
        } catch (error) {
            console.error(
                "Error sorting hierarchy data:",
                error
            );
            return arr;
        }
    };
    const buildHierarchy = async (
        data: T[],
        groupKeys: (keyof T)[],
        level = 0
    ): Promise<any[]> => {
        try {
            if (level >= groupKeys.length) {
                const leafNodes = data.map((item: any) => {
                    try {
                        const entID = item[entIdKey]
                            ? String(item[entIdKey])
                            : FnGenerateUID();
                        return {
                            ...item,
                            EntID: entID,
                            Name: item[nameKey] || item.Name,
                            checkable: false
                        };
                    } catch (error) {
                        console.error(
                            "Error creating leaf node:",
                            error
                        );
                        return null;
                    }
                }).filter(Boolean);
                return sortByName(leafNodes);
            }
            const currentGroupKey = groupKeys[level];
            const grouped = data.reduce((acc, item) => {
                try {
                    const group = item[currentGroupKey];
                    const groupString = group
                        ? String(group)
                        : null;
                    if (groupString) {
                        if (!acc[groupString]) {
                            acc[groupString] = [];
                        }
                        acc[groupString].push(item);
                    } else {
                        acc["no-group"] =
                            acc["no-group"] || [];
                        acc["no-group"].push(item);
                    }
                    return acc;
                } catch (error) {
                    console.error(
                        "Error grouping hierarchy data:",
                        error
                    );
                    return acc;
                }
            }, {} as Record<string, T[]>);
            const nodes: any[] = [];
            // Handle no-group first (same behavior as concat order)
            if (grouped["no-group"]) {
                const noGroupNodes =
                    await buildHierarchy(
                        grouped["no-group"],
                        groupKeys,
                        level + 1
                    );
                nodes.push(...noGroupNodes);
            }
            // Handle grouped nodes
            const groupNodes = await Promise.all(
                Object.entries(grouped)
                    .filter(
                        ([groupName]) =>
                            groupName !== "no-group"
                    )
                    .map(
                        async (
                            [groupName, children]
                        ) => {
                            try {
                                return {
                                    title: groupName,
                                    Name: groupName,
                                    EntID:
                                        FnGenerateUID(),
                                    parentEntID:
                                        parentEntId,
                                    children:
                                        await buildHierarchy(
                                            children,
                                            groupKeys,
                                            level + 1
                                        )
                                };
                            } catch (error) {
                                console.error(
                                    "Error building group node:",
                                    error
                                );
                                return null;
                            }
                        }
                    )
            );
            const sortedGroupNodes =
                sortByName(
                    groupNodes.filter(Boolean)
                );
            // Keep no-group nodes always at top
            return [
                ...nodes,
                ...sortedGroupNodes
            ];
        } catch (error) {
            console.error(
                "Error building hierarchy:",
                error
            );
            return [];
        }
    };
    try {
        return buildHierarchy(
            data,
            groupKeys
        );
    } catch (error) {
        console.error(
            "FnTransformDataToHierarchy error:",
            error
        );
        return [];
    }
};
export { FnTransformDataToHierarchy };
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

interface FilterResult {
    nodes: ITreeNode[];
    hasDeviceDescendant: boolean;
}

const EMPTY_FILTER_RESULT: FilterResult = {
    nodes: [],
    hasDeviceDescendant: false
};

/**
 * Zero-allocation check to determine whether a comma-separated ID list contains the target ID.
 * Avoids String(val).split(",").map(...).includes(...) which creates millions of temporary arrays and strings.
 */
function listContainsId(value: unknown, target: string): boolean {
    if (value == null) return false;
    const str = typeof value === "string" ? value : String(value);
    const len = str.length;
    const tLen = target.length;
    if (len === 0 || tLen === 0) return false;

    let i = 0;
    while (i < len) {
        // Skip leading whitespace and commas
        while (i < len && (str.charCodeAt(i) === 32 || str.charCodeAt(i) === 44)) {
            i++;
        }
        if (i >= len) break;

        const tokenStart = i;
        // Find next comma or end of string
        while (i < len && str.charCodeAt(i) !== 44) {
            i++;
        }
        let tokenEnd = i;
        // Trim trailing whitespace from token
        while (tokenEnd > tokenStart && str.charCodeAt(tokenEnd - 1) === 32) {
            tokenEnd--;
        }

        if (tokenEnd - tokenStart === tLen) {
            let match = true;
            for (let j = 0; j < tLen; j++) {
                if (str.charCodeAt(tokenStart + j) !== target.charCodeAt(j)) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }

        i++;
    }
    return false;
}

const FnFilterTreeById = (
    tree: ITreeNode[],
    filteredId?: string,
    roomId?: string
): ITreeNode[] => {
    if (!tree || tree.length === 0 || (!filteredId && !roomId)) {
        return tree ?? [];
    }

    const targetId = filteredId ? String(filteredId).trim() : "";
    const hasTargetId = targetId.length > 0;
    const targetRoomId = roomId ? String(roomId).trim() : "";
    const hasTargetRoomId = targetRoomId.length > 0;

    if (!hasTargetId && !hasTargetRoomId) {
        return tree;
    }

    /**
     * Classifies node in a single pass to avoid repeated string lowercasing and duplicate checks.
     */
    const classifyNode = (node: ITreeNode): { isStructural: boolean; isDevice: boolean } => {
        const tt = node.treetype ? node.treetype.toLowerCase() : "";
        const nt = node.NodeType ? node.NodeType.toLowerCase() : "";

        const isStructural =
            tt === "site" ||
            tt === "floor" ||
            tt === "room" ||
            nt === "site" ||
            nt === "floor" ||
            nt === "room";

        if (isStructural) {
            return { isStructural: true, isDevice: false };
        }

        const isDeviceOrSlot =
            tt === "device" ||
            tt === "mounteddevice" ||
            tt === "ru" ||
            tt === "pm" ||
            tt === "deviceslot" ||
            nt === "device" ||
            nt === "mounteddevice" ||
            nt === "ru" ||
            nt === "pm" ||
            nt === "deviceslot";

        const hasFilterLists =
            Boolean(node.TenantIDList) ||
            Boolean(node.TeamIDList) ||
            Boolean(node.TagIDList) ||
            Boolean(node.VendorIDList) ||
            Boolean(node.MountedDeviceTenantIDList) ||
            Boolean(node.MountedDeviceTeamIDList) ||
            Boolean(node.MountedDeviceTagIDList) ||
            Boolean(node.MountedDeviceVendorIDList);

        return {
            isStructural: false,
            isDevice: isDeviceOrSlot || hasFilterLists
        };
    };

    /**
     * Checks if the node matches the targetId across all 8 filter lists with early short-circuit.
     */
    const isNodeMatched = (node: ITreeNode): boolean => {
        return (
            listContainsId(node.TenantIDList, targetId) ||
            listContainsId(node.TeamIDList, targetId) ||
            listContainsId(node.TagIDList, targetId) ||
            listContainsId(node.VendorIDList, targetId) ||
            listContainsId(node.MountedDeviceTenantIDList, targetId) ||
            listContainsId(node.MountedDeviceTeamIDList, targetId) ||
            listContainsId(node.MountedDeviceTagIDList, targetId) ||
            listContainsId(node.MountedDeviceVendorIDList, targetId)
        );
    };

    const filterByRoom = (
        nodes: ITreeNode[],
        rId: string
    ): ITreeNode[] => {
        const result: ITreeNode[] = [];
        const len = nodes.length;

        for (let i = 0; i < len; i++) {
            const node = nodes[i];
            if (node.NodeEntID != null && String(node.NodeEntID) === rId) {
                // Room matched — keep full subtree; do not strip children.
                result.push({
                    ...node,
                    children: node.children ?? []
                });
                continue;
            }

            if (node.children && node.children.length > 0) {
                const children = filterByRoom(node.children, rId);
                if (children.length > 0) {
                    result.push({
                        ...node,
                        children
                    });
                }
            }
        }

        return result;
    };

    const filterByDevice = (
        nodes: ITreeNode[]
    ): FilterResult => {
        const result: ITreeNode[] = [];
        let hasDeviceDescendant = false;
        const len = nodes.length;

        for (let i = 0; i < len; i++) {
            const node = nodes[i];
            const childResult = (node.children && node.children.length > 0)
                ? filterByDevice(node.children)
                : EMPTY_FILTER_RESULT;

            const { isStructural, isDevice } = classifyNode(node);

            if (isDevice) {
                if (isNodeMatched(node) || childResult.nodes.length > 0) {
                    hasDeviceDescendant = true;
                    result.push({
                        ...node,
                        children: childResult.nodes
                    });
                }
                continue;
            }

            const originallyHadDevices = childResult.hasDeviceDescendant;
            if (originallyHadDevices) {
                hasDeviceDescendant = true;
            }

            const hasData = originallyHadDevices;
            const newNode: ITreeNode = {
                ...node,
                children: (!isStructural && !hasData) ? [] : childResult.nodes
            };

            if (!isStructural && !hasData) {
                newNode.isLeaf = true;
            }

            result.push(newNode);
        }

        return {
            nodes: result,
            hasDeviceDescendant
        };
    };

    let treeData = tree;

    // Step 1: Filter by room (if supplied)
    if (hasTargetRoomId) {
        treeData = filterByRoom(treeData, targetRoomId);
    }

    // Step 2: Filter by device (if supplied)
    if (hasTargetId) {
        treeData = filterByDevice(treeData).nodes;
    }

    return treeData;
};

export { FnFilterTreeById };

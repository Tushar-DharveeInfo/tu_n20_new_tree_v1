import { Device, layoutConfig, Location } from "@n20a/liblayout";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { FEnums } from "../../constants/Feature";

const isFloorLayoutDeviceNode = (node: ITreeNode): boolean => {
    const nodeType = node.NodeType?.toLowerCase();
    const type = node.Type?.toLowerCase();
    const treeType = node.treetype?.toLowerCase();
    return (
        type === "floordevice" ||
        nodeType === "device" ||
        treeType === "device"
    );
};

/** Collects device EntIDs under a floor node from the explorer tree. */
const FnCollectVisibleFloorDeviceEntIds = (floorNode: ITreeNode | null | undefined, featureId?: string): Set<string> => {
    const deviceEntIds = new Set<string>();
    if (!floorNode) {
        return deviceEntIds;
    }

    const walk = (nodes: ITreeNode[]) => {
        for (const node of nodes) {
            if (isFloorLayoutDeviceNode(node) && node.NodeEntID) {
                if (featureId === FEnums.Server) {
                    const isServer = Boolean(
                        node.NodeEntityname?.toLowerCase().includes("server") ||
                        node.NodeType?.toLowerCase() === "server" ||
                        node.treetype?.toLowerCase() === "server"
                    );
                    if (isServer || node.NodeType?.toLowerCase() === 'rack') {
                        deviceEntIds.add(node.NodeEntID.toUpperCase());
                    }
                } else {
                    deviceEntIds.add(node.NodeEntID.toUpperCase());
                }
            }
            if (node.children?.length) {
                walk(node.children);
            }
        }
    };

    if (floorNode.children?.length) {
        walk(floorNode.children);
    }

    return deviceEntIds;
};

/**
 * Sets ishidden=true on layout devices that exist in config JSON
 * but are not present under selectedFloorNode.children
 * (e.g. filtered out by tenant in the explorer).
 */
const FnHideLayoutDevicesNotInTree = (
    pageObj: layoutConfig,
    selectedFloorNode: ITreeNode | null | undefined,
    featureId?: string
): layoutConfig => {
    try {
        if (!pageObj || !selectedFloorNode?.children?.length) {
            return pageObj;
        }

        const visibleDeviceEntIds = FnCollectVisibleFloorDeviceEntIds(selectedFloorNode, featureId);
        if (visibleDeviceEntIds.size === 0) {
            return pageObj;
        }

        const updateDevice = (device: Device): Device => {
            const entId = device.entId?.toUpperCase();
            if (entId && !visibleDeviceEntIds.has(entId)) {
                return {
                    ...device,
                    ishidden: true
                };
            }
            return device;
        };

        return {
            ...pageObj,
            locationArray: pageObj.locationArray?.map((location: Location) => ({
                ...location,
                deviceArray: location.deviceArray?.map(updateDevice)
            })),
            deviceArray: pageObj.deviceArray?.map(updateDevice)
        };
    } catch (error) {
        console.error(
            "Error in function(FnHideLayoutDevicesNotInTree): ",
            error
        );
        return pageObj;
    }
};

export { FnHideLayoutDevicesNotInTree, FnCollectVisibleFloorDeviceEntIds };

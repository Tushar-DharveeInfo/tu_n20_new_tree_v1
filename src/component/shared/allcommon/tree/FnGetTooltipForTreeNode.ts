import { ITreeNode } from "../../allinterface/tree/ITreeControl"

const FnGetTooltipForTreeNode = (treeNode: ITreeNode): string => {
    try {
        const nodeType = treeNode.NodeType?.toLowerCase() ?? treeNode.treetype?.toLowerCase();

        // Map node types to the properties we want in tooltip
        const relevantPropsMap: Record<string, (keyof ITreeNode)[]> = {
            alldatacenters: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType"],
            site: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID"],
            tenant: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID"],
            room: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID"],
            floor: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID"],
            location: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID"],
            audit: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "NodeState", "DateApproved", "CloseDate"],
            device: [
                "Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "DeviceID", "EQType", "EQID", "HasPowerPorts",
                "HasNetworkPorts", "IntelDCMState", "MountedDeviceName", "SlotsNeeded", "WOID",
                "NodeState"
            ],
            mounteddevice: [
                "Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "DeviceID", "EQType", "EQID", "HasPowerPorts",
                "HasNetworkPorts", "IntelDCMState", "MountedDeviceName", "Height", "Width", "Length", "SlotsNeeded", "WOID",
                "NodeState"
            ],
            port: [
                "Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "PortStatus", "EQID", "ParentName", "NodeState", "WOID"
            ],
            slot: [
                "Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "PortStatus", "EQID", "ParentName", "NodeState", "WOID"
            ],
            rearview: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID", "ShapeID", "NodeState", "ViewShortName", "MountedDeviceID"],
            frontview: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID", "ShapeID", "NodeState", "ViewShortName", "MountedDeviceID"],
            // default / fallback type
            default: ["Name", "Description", "NodeEntID", "NodeEntityname", "NodeType", "parentEntID", "IsNZ", "HasChildren", "key", "WOID"]
        };

        // Pick the correct property list
        const relevantProps = relevantPropsMap[nodeType] ?? relevantPropsMap.default;

        // Build filtered object
        const tooltipData: Record<string, unknown> = {};
        relevantProps.forEach((prop) => {
            const value = treeNode[prop];
            if (value !== undefined && value !== null && value !== "") {
                tooltipData[prop] = value;
            }
        });

        // Return formatted JSON string
        return Object.keys(tooltipData).length > 0
            ? JSON.stringify(tooltipData, null, 2)
            : "";
    } catch (error) {
        console.error(
            "Error in function(FnGetSelectionFromHierarchy): ",
            error
        );
        return ""
    }
};

export { FnGetTooltipForTreeNode };

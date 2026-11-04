
import { FEnums } from "../../../constants/Feature";
import { FnCheckToSkipNode } from "../basic/FnCheckToSkipNode";
import { FnProcessStringToCompare } from "../basic/FnProcessStringToCompare";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { IShouldSkip } from "../../allinterface/tree/ITreeForFlatDataContainer";

// Main function to decide if a node should be skipped based on featureId
const FnCheckToSkipNodeForFeature = (child: ITreeNode, featureId: string): IShouldSkip => {
    // Feature-specific condition check functions for skipping nodes
    const skipNodeForAssetPowerCabling = (child: ITreeNode): IShouldSkip => {
        const hasPowerPortsInTree = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceHasPowerPort) return true;

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {
            let foundInChildren: boolean = false;
            if (child.HasPowerPorts && child.children && child.children.length > 0) {

                foundInChildren = child.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            else {
                foundInChildren = hasPowerPortsInTree(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren || FnProcessStringToCompare(child.NodeType, "Rack")) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        }
        else if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "MountedDevice"))) {
            if (child.HasPowerPorts) {
                return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: true };
        }
        else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    // Feature-specific condition check functions for skipping nodes
    const skipNodeForManagement = (child: ITreeNode): IShouldSkip => {
        const hasMountedDevice = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceEntID) return true;

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasMountedDevice(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {

            let foundInChildren: boolean = false;
            if (child.children && child.children.length > 0) {
                foundInChildren = child.children.some((childNode) => hasMountedDevice(childNode));
            }
            else {
                foundInChildren = hasMountedDevice(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren || FnProcessStringToCompare(child.NodeType, "Rack")) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: false, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        } else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    const skipNodeForWorkorder = (child: ITreeNode): IShouldSkip => {

        if (child.NodeType && ["site", "room", "floor"].includes(child.NodeType.toLowerCase())) {

            let foundInChildren: boolean = false;



            return { shouldSkip: false, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        } else {
            return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: false }; // skip if conditions are met
        }
    };


    const skipNodeForDevicePowerCabling = (child: ITreeNode): IShouldSkip => {
        const hasPowerPortsInTree = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceHasPowerPort) return true;

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {
            let foundInChildren: boolean = false;
            if (child.HasPowerPorts && child.children && child.children.length > 0) {

                foundInChildren = child.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            else {
                foundInChildren = hasPowerPortsInTree(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren || FnProcessStringToCompare(child.NodeType, "Rack")) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        } else if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "MountedDevice"))) {
            if (child.HasPowerPorts) {
                return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: true };
        } else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    const skipNodeForDiscover = (child: ITreeNode): IShouldSkip => {
        const hasPowerPortsInTree = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceHasPowerPort) return true;

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {
            let foundInChildren: boolean = false;
            if (child.HasPowerPorts && child.children && child.children.length > 0) {

                foundInChildren = child.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            else {
                foundInChildren = hasPowerPortsInTree(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren || FnProcessStringToCompare(child.NodeType, "Rack")) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        } else if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "MountedDevice"))) {
            if (child.HasPowerPorts) {
                return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: true };
        } else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    const skipNodeForMonitor = (child: ITreeNode): IShouldSkip => {

        const hasPowerPortsInTree = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceHasPowerPort && node.MountedDeviceIntelDCMState && FnProcessStringToCompare(node.MountedDeviceIntelDCMState, "Not Discoverable")) {
                return true;
            }

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {
            let foundInChildren: boolean = false;
            if (child.HasPowerPorts && child.IntelDCMState && FnProcessStringToCompare(child.IntelDCMState, "Not Discoverable") && child.children && child.children.length > 0) {
                foundInChildren = child.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            else {
                foundInChildren = hasPowerPortsInTree(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren || FnProcessStringToCompare(child.NodeType, "Rack")) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        }
        else if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "MountedDevice"))) {
            if (child.HasPowerPorts && child.IntelDCMState && FnProcessStringToCompare(child.IntelDCMState, "Not Discoverable")) {
                return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: true };
        }
        else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    const skipNodeForPhysicalCompute = (child: ITreeNode) => {

        const hasPowerPortsInTree = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceEntityName && (FnProcessStringToCompare(node.MountedDeviceEntityName, "__Rack") ||
                FnProcessStringToCompare(node.MountedDeviceEntityName, "__Server") ||
                FnProcessStringToCompare(node.MountedDeviceEntityName, "__BladeServer"))) return true;

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasPowerPortsInTree(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {
            let foundInChildren: boolean = false;
            let shouldSkip: boolean = true;
            if (child.NodeEntityname && (FnProcessStringToCompare(child.NodeEntityname, "__Rack") ||
                FnProcessStringToCompare(child.NodeEntityname, "__Server") ||
                FnProcessStringToCompare(child.NodeEntityname, "__BladeServer")) && child.children && child.children.length > 0) {
                foundInChildren = child.children.some((childNode) => hasPowerPortsInTree(childNode));
                shouldSkip = false
            }
            else {
                foundInChildren = hasPowerPortsInTree(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: shouldSkip, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        }
        else if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "MountedDevice"))) {

            if (child.NodeEntityname && !FnProcessStringToCompare(child.NodeEntityname, "__Rack") &&
                !FnProcessStringToCompare(child.NodeEntityname, "__Server") &&
                !FnProcessStringToCompare(child.NodeEntityname, "__BladeServer")) {
                return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: true };
            }
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: true };
        }
        else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    const skipNodeForAssetNetworkCabling = (child: ITreeNode): IShouldSkip => {
        const hasNetworkPortsInTree = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceHasNetworkPort) return true;

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasNetworkPortsInTree(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {
            let foundInChildren: boolean = false;
            if (child.HasNetworkPorts && child.children && child.children.length > 0) {

                foundInChildren = child.children.some((childNode) => hasNetworkPortsInTree(childNode));
            }
            else {
                foundInChildren = hasNetworkPortsInTree(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren || FnProcessStringToCompare(child.NodeType, "Rack")) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        } else if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "MountedDevice"))) {
            if (child.HasNetworkPorts) {
                return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: true };
        } else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    const skipNodeForDeviceNetworkCabling = (child: ITreeNode): IShouldSkip => {
        const hasNetworkPortsInTree = (node: ITreeNode): boolean => {
            // Base case: if the current node has power ports
            if (node.MountedDeviceHasNetworkPort) return true;

            // Recursive case: check children if they exist
            if (node.children && node.children.length > 0) {
                return node.children.some((childNode) => hasNetworkPortsInTree(childNode));
            }
            return false;
        };
        if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "Device") || FnProcessStringToCompare(child.NodeType, "Rack"))) {
            let foundInChildren: boolean = false;
            if (child.HasNetworkPorts && child.children && child.children.length > 0) {

                foundInChildren = child.children.some((childNode) => hasNetworkPortsInTree(childNode));
            }
            else {
                foundInChildren = hasNetworkPortsInTree(child);
            }

            // Do not skip if power ports are found in children or the node is a Rack
            if (foundInChildren || FnProcessStringToCompare(child.NodeType, "Rack")) {
                return { shouldSkip: false, foundInChildren, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: foundInChildren, isCheckedInChildren: true }; // Skip if no power ports are found
        } else if (child.NodeType && (FnProcessStringToCompare(child.NodeType, "MountedDevice"))) {
            if (child.HasNetworkPorts) {
                return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: true };
            }
            return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: true };
        } else {
            return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // Do not skip if conditions are not met
        }
    };

    if (child.NodeType && FnCheckToSkipNode(child.NodeType, featureId)) {
        return { shouldSkip: true, foundInChildren: false, isCheckedInChildren: false };
    }
    try {
        switch (featureId) {
            case FEnums.ReviewPowerCabling:
                return skipNodeForAssetPowerCabling(child);
            case FEnums.PowerTrace:
                return skipNodeForAssetPowerCabling(child);
            case FEnums.PowerNavigate:
                return skipNodeForAssetPowerCabling(child);
            case FEnums.EditPowerCabling:
                return skipNodeForDevicePowerCabling(child);
            case FEnums.Discover:
                return skipNodeForDiscover(child);
            case FEnums.Assets:
                return skipNodeForManagement(child);
            case FEnums.InboundAssetPlacement:
                return skipNodeForManagement(child);
            case FEnums.InboundAssets:
                return skipNodeForManagement(child);
            case FEnums.AssetAssignment:
                return skipNodeForManagement(child);
            case FEnums.AssetAssignmentPlan:
                return skipNodeForManagement(child);
            case FEnums.Relocate:
                return skipNodeForManagement(child);
            case FEnums.AssetPlacement:
                return skipNodeForWorkorder(child);
            case FEnums.Transfer:
                return skipNodeForManagement(child);
            case FEnums.Delete:
                return skipNodeForManagement(child);
            case FEnums.ReplacementProfile:
                return skipNodeForManagement(child);
            case FEnums.Replace:
                return skipNodeForManagement(child);
            case FEnums.Workorder:
                return skipNodeForWorkorder(child);
            case FEnums.AnalyticsAndCharts:
                return skipNodeForWorkorder(child);
            case FEnums.MoveAddChange:
                return skipNodeForManagement(child);
            case FEnums.Monitor:
                return skipNodeForMonitor(child);
            case FEnums.Server:
                return skipNodeForPhysicalCompute(child);
            case FEnums.ReviewNetworkCabling:
                return skipNodeForAssetNetworkCabling(child);
            case FEnums.NetworkTrace:
                return skipNodeForAssetNetworkCabling(child);
            case FEnums.NetworkNavigate:
                return skipNodeForAssetNetworkCabling(child);
            case FEnums.EditNetworkCabling:
                return skipNodeForDeviceNetworkCabling(child);
            default:
                return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false }; // No skipping for unhandled featureIds
        }
    } catch (error) {
        console.error(
            "Error in function(FnCheckToSkipNodeForFeature): ",
            error
        );
        return { shouldSkip: false, foundInChildren: false, isCheckedInChildren: false };
    }
};

export { FnCheckToSkipNodeForFeature }

import { FEnums } from "../../../constants/Feature";
import { FnProcessStringToCompare } from "../basic/FnProcessStringToCompare";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// This function checks whether children nodes are there or not   
const FnFindInChildrenNode = (nodeChildren: ITreeNode[], featureId: string) => {
    let foundNode: boolean = false;
    try {

        const traverseChildrens = (childNodes: ITreeNode[], nodeType: string) => {

            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (featureId !== FEnums.Server && featureId !== FEnums.ModelBusinessService && featureId !== FEnums.ManageBusinessService && node && node.MountedDeviceNodeType && FnProcessStringToCompare(node.MountedDeviceNodeType, nodeType) && node.MountedDeviceHasPowerPort) {

                    if (featureId === FEnums.Monitor) {
                        const monitorState = node.MountedDeviceIntelDCMState?.toLowerCase();
                        if (monitorState === "discovered" || monitorState === "monitored") {
                            foundNode = true;
                            break;
                        }
                    }
                    else if (featureId === FEnums.Discover) {
                        if (node.MountedDeviceIntelDCMState && !FnProcessStringToCompare(node.MountedDeviceIntelDCMState, "Monitored")
                            && !FnProcessStringToCompare(node.MountedDeviceIntelDCMState, "Not Discoverable")) {
                            foundNode = true;
                            break;
                        }
                    }
                    else if ((featureId === FEnums.AuditSession || featureId === FEnums.InventoryCollection || featureId === FEnums.InventoryReconciliation) && node.MountedDeviceEntID) {
                        foundNode = false;

                    }
                    else {
                        foundNode = true;
                        break;
                    }
                }
                else if ((featureId === FEnums.Discover || featureId === FEnums.Monitor) && node && (
                    (node.NodeType && (FnProcessStringToCompare(node.NodeType, "Device") || FnProcessStringToCompare(node.NodeType, "Rack")))
                )) {
                    const isRack = (node.NodeType && FnProcessStringToCompare(node.NodeType, "Rack")) ||
                        (node.treetype && FnProcessStringToCompare(node.treetype, "Rack"));

                    if (featureId === FEnums.Monitor) {
                        if (isRack) {
                            const states = node.IntelDCMState ? node.IntelDCMState.split(",").map(s => s.trim().toLowerCase()) : [];
                            if (states.some(s => s === "discovered" || s === "monitored")) {
                                foundNode = true;
                                break;
                            }
                        } else {
                            const monitorState = node.IntelDCMState?.toLowerCase();
                            if (monitorState === "discovered" || monitorState === "monitored") {
                                foundNode = true;
                                break;
                            }
                        }
                    }
                    else if (featureId === FEnums.Discover) {
                        if (isRack) {
                            const states = node.IntelDCMState ? node.IntelDCMState.split(",").map(s => s.trim()) : [];
                            if (
                                states.some(
                                    s =>
                                        s &&
                                        !FnProcessStringToCompare(s, "Monitored") &&
                                        !FnProcessStringToCompare(s, "Not Discoverable")
                                )
                            ) {
                                foundNode = true;
                                break;
                            }
                        } else {
                            if (node.IntelDCMState && !FnProcessStringToCompare(node.IntelDCMState, "Monitored")
                                && !FnProcessStringToCompare(node.IntelDCMState, "Not Discoverable")) {
                                foundNode = true;
                                break;
                            }
                        }
                    }

                    if (node.children?.length > 0) {
                        traverseChildrens(node.children, nodeType);
                        if (foundNode) break;
                    }
                }
                else if (featureId === FEnums.Server || featureId === FEnums.ModelBusinessService || featureId === FEnums.ManageBusinessService) {
                    if (node.NodeEntityname &&
                        node.NodeType && FnProcessStringToCompare(node.NodeType, "Device") &&
                        (FnProcessStringToCompare(node.NodeEntityname, "__Rack") ||
                            FnProcessStringToCompare(node.NodeEntityname, "__Server") ||
                            FnProcessStringToCompare(node.NodeEntityname, "__BladeServer"))) {
                        foundNode = true;
                        break;
                    }
                    else if (node.MountedDeviceEntityName &&
                        node.MountedDeviceNodeType && FnProcessStringToCompare(node.MountedDeviceNodeType, "MountedDevice") &&
                        (FnProcessStringToCompare(node.MountedDeviceEntityName, "__Rack") ||
                            FnProcessStringToCompare(node.MountedDeviceEntityName, "__Server") ||
                            FnProcessStringToCompare(node.MountedDeviceEntityName, "__BladeServer"))) {
                        foundNode = true;
                        break;
                    }
                    else if (node && node.children?.length > 0) {
                        traverseChildrens(node.children, nodeType)
                    }
                }
                else if (node && node.children?.length > 0) {
                    traverseChildrens(node.children, nodeType)
                }
            }
        }
        traverseChildrens(nodeChildren, "MountedDevice");
        return foundNode;
    } catch (error) {
        console.error(
            "Error in function(FnFindInChildrenNode): ",
            error
        );
        return false;
    }
}

export { FnFindInChildrenNode }
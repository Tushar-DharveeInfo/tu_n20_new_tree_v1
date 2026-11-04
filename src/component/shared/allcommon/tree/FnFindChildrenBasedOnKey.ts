
import { FeatureHierarchies } from "../../alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer";
import { FEnums } from "../../../constants/Feature";
import { FnCheckToSkipNode } from "../basic/FnCheckToSkipNode";
import { FnCheckToSkipNodeForFeature } from "./FnCheckToSkipNodeForFeature";
import { FnFindInChildrenNode } from "./FnFindInChildrenNode";
import { FnGetNextNodeType } from "../basic/FnGetNextNodeType";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { FnDeepClone } from "../basic/FnDeepClone";
import { FnGetIsLeafForRack } from "./FnGetIsLeafForRack";

const isMonitorVisibleIntelDCMState = (state?: string | null): boolean => {
    if (!state) {
        return false;
    }

    const states = state.split(",").map(s => s.trim().toLowerCase());
    return states.some(s => s === "discovered" || s === "monitored");
};

const isDiscoverVisibleIntelDCMState = (state?: string | null): boolean => {
    if (!state) {
        return false;
    }

    const states = state.split(",").map(s => s.trim().toLowerCase());
    return states.some(s => s && s !== "monitored" && s !== "not discoverable");
};

// Find children based on the key and apply NodeType hierarchy conditions
const FnFindChildrenBasedOnKey = (
    tree: ITreeNode[],
    key: string,
    featureId: string
): ITreeNode[] | null => {
    const hierarchy = FeatureHierarchies[featureId];
    if (!hierarchy) {
        return null;
    }
    try {
        const result = tree;
        let childrenNodes = null;
        // Helper function to find a node by its key and apply hierarchy conditions
        const findNode = (nodes: ITreeNode[]): boolean => {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];

                // Check if we have found the node by key
                if (node.key === key && node.NodeType) {
                    const clonnedNode = FnDeepClone(node);
                    // Get the next expected node type based on the hierarchy for the featureId
                    const nextNodeType = FnGetNextNodeType(featureId, node.NodeType);
                    if (clonnedNode.children && clonnedNode.children.length > 0) {
                        // Traverse children to skip skippable nodes and return relevant ones
                        let skippedNode: boolean = false;
                        let newParentNode: ITreeNode | null = null;
                        const addedNodeNames = new Set<string>();
                        const isPower = [
                            FEnums.ReviewPowerCabling.toString(),
                            FEnums.PowerTrace.toString(),
                            FEnums.PowerNavigate.toString(),
                            FEnums.EditPowerCabling.toString(),
                        ].includes(featureId);
                        const isNetwork = [
                            FEnums.ReviewNetworkCabling.toString(),
                            FEnums.NetworkTrace.toString(),
                            FEnums.NetworkNavigate.toString(),
                            FEnums.EditNetworkCabling.toString(),
                        ].includes(featureId);

                        const isConfigureFeature = [
                            FEnums.AssetConfiguration.toString(),
                            FEnums.ConfigureDevice.toString()
                        ].includes(featureId);


                        const hasSecuredDevice = (
                            nodes?: ITreeNode[]
                        ): boolean => {
                            if (!nodes?.length) {
                                return false;
                            }

                            return nodes.some((item) => {

                                // First check current node
                                if (
                                    item.NodeType?.toLowerCase() === "device" &&
                                    item.Secured
                                ) {
                                    return true;
                                }

                                // Then recursively check children
                                return hasSecuredDevice(item.children);
                            });
                        };

                        const traverseNodes = (childNodes: ITreeNode[]): ITreeNode[] => {
                            const filteredChildren: ITreeNode[] = [];

                            for (const child of childNodes) {
                                // If this node should be skipped, we need to check its children
                                const nodeType = child.NodeType?.toLowerCase();
                                const treeType = child.treetype.toLowerCase();
                                const nodeTypesParsed = nextNodeType ? nextNodeType.split("/") : [];
                                const isNextTypeMatch = nodeTypesParsed.some(t => {
                                    const target = t.toLowerCase();
                                    const cNodeType = child.NodeType?.toLowerCase();
                                    const cTreeType = child.treetype?.toLowerCase();
                                    const cType = child.Type?.toLowerCase();
                                    return (
                                        target === cTreeType ||
                                        target === cNodeType ||
                                        (target === "device" && (cNodeType === "floordevice" || cTreeType === "floordevice" || cType === "floordevice"))
                                    );
                                });
                                if (nodeType && child.NodeType && FnCheckToSkipNode(child.NodeType, featureId)) {
                                    // Recursively traverse the children of the skipped node
                                    skippedNode = true;
                                    if (newParentNode === null) {
                                        newParentNode = node;
                                    }

                                    if (treeType.includes("deviceslot") && !nodeType.includes("port")
                                        && child.MountedDeviceEntID
                                        && child.MountedDeviceEntID.length > 0 && child.MountedDeviceName && !addedNodeNames.has(child.MountedDeviceName)) {
                                        if (isPower && !child.MountedDeviceHasPowerPort) {
                                            continue;
                                        }
                                        else if (
                                            featureId === FEnums.Discover &&
                                            (
                                                //  no required ports
                                                !child.MountedDeviceHasPowerPort ||
                                                !child.MountedDeviceHasNetworkPort ||

                                                //  neither discoverable nor discovered
                                                (
                                                    child.MountedDeviceIntelDCMState &&
                                                    (child.MountedDeviceIntelDCMState.toLowerCase() === "monitored"
                                                        || child.MountedDeviceIntelDCMState.toLowerCase() === "not discoverable")
                                                )
                                            )
                                        ) {
                                            continue;
                                        }
                                        else if (featureId === FEnums.DCMConsole && !child.MountedDeviceHasNetworkPort) {
                                            continue;
                                        }
                                        else if (
                                            featureId === FEnums.Monitor &&
                                            child.MountedDeviceIntelDCMState &&
                                            !isMonitorVisibleIntelDCMState(child.MountedDeviceIntelDCMState)
                                        ) {
                                            continue;
                                        }
                                        else if (
                                            featureId === FEnums.Monitor &&
                                            !child.MountedDeviceHasPowerPort &&
                                            !isMonitorVisibleIntelDCMState(child.MountedDeviceIntelDCMState)
                                        ) {
                                            continue;
                                        }
                                        else if (featureId === FEnums.EditFloorLayout || featureId === FEnums.Relocate || featureId === FEnums.AuditSession) {
                                            continue;
                                        }
                                        else if ((featureId === FEnums.Server || featureId === FEnums.ModelBusinessService || featureId === FEnums.ManageBusinessService) &&
                                            child.MountedDeviceEntityName &&
                                            child.MountedDeviceNodeType &&
                                            child.MountedDeviceNodeType?.toLowerCase() === "mounteddevice" &&
                                            child.MountedDeviceEntityName?.toLowerCase() !== "__rack" &&
                                            child.MountedDeviceEntityName?.toLowerCase() !== "__server" &&
                                            child.MountedDeviceEntityName?.toLowerCase() !== "__bladeserver"
                                        ) {
                                            continue;
                                        }
                                        else if (isNetwork && !child.MountedDeviceHasNetworkPort) {
                                            continue;
                                        }
                                        if (child.MountedDeviceName) {
                                            addedNodeNames.add(child.MountedDeviceName);
                                        }
                                        const mountPosition = child.Name
                                            ? Number(child.Name.match(/#(\d+)/)?.[1])
                                            : undefined;
                                        const newNode: ITreeNode = {
                                            Name: child.MountedDeviceName || "",
                                            key: child.MountedDeviceEntID,
                                            NodeEntityname: child.MountedDeviceEntityName || "",
                                            stepNo: node.stepNo + 1,
                                            parentEntID: node.NodeEntID,
                                            NodeEntID: child.MountedDeviceEntID || "",
                                            NodeType: child.MountedDeviceNodeType,
                                            Description: child.MountedDeviceDescription || "",
                                            NodeState: null,
                                            checkable: false,
                                            MountPosition: mountPosition ?? undefined,
                                            HasPowerPorts: child.MountedDeviceHasPowerPort,
                                            HasNetworkPorts: child.MountedDeviceHasNetworkPort,
                                            IntelDCMState: child.MountedDeviceIntelDCMState,
                                            SlotsNeeded: child.MountedDeviceSlotsNeeded,
                                            title: child.MountedDeviceName ? child.MountedDeviceName : "",
                                            icon: null,
                                            HasChildren: 0,
                                            isLeaf: true,
                                            treetype: "MountedDevice",
                                            type: "MountedDevice",
                                            children: [],
                                            Type: null,
                                            Height: child.MountedDeviceHeight,
                                            Width: child.MountedDeviceWidth,
                                            Length: child.MountedDeviceLength,
                                            Secured: child.MountedDeviceSecured,
                                            TenantIDList: child.MountedDeviceTenantIDList ?? undefined,
                                            TeamIDList: child.MountedDeviceTeamIDList ?? undefined,
                                            TagIDList: child.MountedDeviceTagIDList ?? undefined,
                                            VendorIDList: child.MountedDeviceVendorIDList ?? undefined,
                                        }
                                        filteredChildren.push(newNode);
                                    }
                                    else if (child.children) {
                                        const nestedChildren = traverseNodes(child.children);
                                        if (nestedChildren.length > 0) {
                                            filteredChildren.push(...nestedChildren);
                                        }
                                    }
                                } else if (child.NodeType && child.treetype && nextNodeType && isNextTypeMatch) {
                                    // If not skippable and matches nextNodeType, include it
                                    const isRack = child.NodeType?.toLowerCase() === "rack" || child.treetype?.toLowerCase() === "rack";
                                    const isDevice = !isRack && (
                                        child.NodeType?.toLowerCase() === "device" ||
                                        child.treetype?.toLowerCase() === "device"
                                    );

                                    if (isPower && nodeTypesParsed.length > 1
                                        && nodeTypesParsed[1]?.toLowerCase() === "device"
                                        && isDevice) {
                                        if (!child.HasPowerPorts) {
                                            continue;
                                        }
                                        else {
                                            const isChildFound = FnCheckToSkipNodeForFeature(child, featureId);
                                            if (!isChildFound.foundInChildren && isChildFound.isCheckedInChildren) {
                                                child.isLeaf = true;
                                                if (import.meta.env.PROD)
                                                    console.log('setleaf true:', child);
                                            }
                                        }
                                    }
                                    else if (featureId === FEnums.Monitor
                                        && (isRack || isDevice)) {
                                        if (isDevice) {
                                            if (!isMonitorVisibleIntelDCMState(child.IntelDCMState)) {
                                                continue;
                                            }
                                        } else if (isRack) {
                                            const isVisibleMonitorRack = isMonitorVisibleIntelDCMState(child.IntelDCMState);
                                            if (!isVisibleMonitorRack) {
                                                if (child.children?.length) {
                                                    const foundNode = FnFindInChildrenNode(child.children, featureId);
                                                    if (foundNode === false) {
                                                        continue;
                                                    }
                                                } else {
                                                    continue;
                                                }
                                            }
                                        }
                                    }
                                    else if ((featureId === FEnums.Discover || featureId === FEnums.DCMConsole)
                                        && (isRack || isDevice)) {
                                        if (isDevice) {
                                            if (!isDiscoverVisibleIntelDCMState(child.IntelDCMState)) {
                                                continue;
                                            }
                                        } else if (isRack) {
                                            const isVisibleDiscoverRack = isDiscoverVisibleIntelDCMState(child.IntelDCMState);
                                            if (!isVisibleDiscoverRack) {

                                                if (!child.HasPowerPorts) {
                                                    if (child.children && child.children.length > 0) {
                                                        const foundNode = FnFindInChildrenNode(child.children, featureId);
                                                        if (foundNode === false) {
                                                            continue;
                                                        }
                                                    } else {
                                                        continue
                                                    }
                                                } else {
                                                    continue
                                                }
                                            }
                                            else if (featureId === FEnums.Discover) {
                                                if (child.children && child.children.length > 0) {
                                                    const foundNode = FnFindInChildrenNode(child.children, featureId);
                                                    if (foundNode === false) {
                                                        continue;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else if (isNetwork && nodeTypesParsed.length > 1
                                        && nodeTypesParsed[1]?.toLowerCase() === "device"
                                        && isDevice) {
                                        if (!child.HasNetworkPorts) {
                                            continue;
                                        }
                                        else {
                                            const isChildFound = FnCheckToSkipNodeForFeature(child, featureId);
                                            if (!isChildFound.foundInChildren && isChildFound.isCheckedInChildren) {
                                                child.isLeaf = true;
                                                if (import.meta.env.PROD)
                                                    console.log('setleaf true:', child);
                                            }
                                        }
                                    }
                                    else if ((featureId === FEnums.Server || featureId === FEnums.ModelBusinessService || featureId === FEnums.ManageBusinessService) &&
                                        child.NodeEntityname &&
                                        child.NodeType?.toLowerCase() === "device" &&
                                        child.NodeEntityname?.toLowerCase() !== "__rack" &&
                                        child.NodeEntityname?.toLowerCase() !== "__server" &&
                                        child.NodeEntityname?.toLowerCase() !== "__bladeserver"
                                    ) {
                                        continue;
                                    }
                                    const nodeData: ITreeNode = { ...child };
                                    if (skippedNode) {
                                        nodeData.isLeaf = true;
                                        nodeData.parentEntID = newParentNode && newParentNode.NodeEntID;
                                    }
                                    else if (nodeData.NodeType?.toLowerCase() === "rack") {
                                        nodeData.isLeaf = FnGetIsLeafForRack(nodeData, featureId);
                                    }
                                    else {
                                        if (featureId !== FEnums.AssetConfiguration && featureId !== FEnums.ConfigureDevice && featureId !== FEnums.InventoryConfiguration) {

                                            const hasChildren = FnFindInChildrenNode(nodeData.children, featureId);
                                            if ((featureId === FEnums.EditFloorLayout || featureId === FEnums.Relocate || featureId === FEnums.AuditSession) &&
                                                nodeData.treetype && nodeData.treetype?.toLowerCase() === "device") {
                                                nodeData.isLeaf = true;
                                                if (import.meta.env.PROD)
                                                    console.log('setleaf true:', child);
                                            }
                                            else if (featureId === FEnums.Discover && !hasChildren && nodeData.NodeType && ["rack", "device", "floordevice", "location"].includes(nodeData.NodeType?.toLowerCase())) {
                                                nodeData.isLeaf = true;
                                                if (import.meta.env.PROD)
                                                    console.log('setleaf true:', child);
                                            }
                                            else if ((featureId === FEnums.Workorder || featureId === FEnums.AssetPlacement || featureId === FEnums.AnalyticsAndCharts) &&
                                                nodeData.NodeType && nodeData.NodeType?.toLowerCase() === "floor") {
                                                nodeData.isLeaf = true;
                                                if (import.meta.env.PROD)
                                                    console.log('setleaf true:', child);
                                            }
                                            else if (!hasChildren && nodeData.NodeType
                                                && ((nodeData.NodeType?.toLowerCase() === "location" && featureId === FEnums.Monitor)
                                                    || nodeData.NodeType?.toLowerCase() === "device" || nodeData.NodeType?.toLowerCase() === "floordevice")) {
                                                nodeData.isLeaf = true;
                                                if (import.meta.env.PROD)
                                                    console.log('setleaf true:', child);
                                            }

                                        }
                                    }
                                    filteredChildren.push(nodeData);
                                }
                                else {
                                    if (!isConfigureFeature && nodeType?.toLowerCase() === "mounteddevice" && treeType.toLowerCase() === "deviceview") {
                                        continue
                                    }
                                    filteredChildren.push(child);
                                }
                            }

                            return filteredChildren;
                        };

                        // Apply the traversal and filtering logic
                        childrenNodes = traverseNodes(clonnedNode.children);
                    } else {
                        // No further nodes in hierarchy or no children, return the node as is
                        childrenNodes = node.children || [];
                    }
                    return true;
                } else if (node.children && node.children.length > 0) {
                    // Recursively call for children and exit immediately when found
                    if (findNode(node.children)) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Start searching from the root
        findNode(result);

        // Return the filtered children
        return childrenNodes;
    } catch (error) {
        console.error(
            "Error in function(FnFindChildrenBasedOnKey): ",
            error
        );
        return null;
    }
}

export { FnFindChildrenBasedOnKey }

import { FnCheckToSkipNodeForFeature } from "./tree/FnCheckToSkipNodeForFeature";
import { IShouldSkip } from "../allinterface/tree/ITreeForFlatDataContainer";
import { ITreeNode } from "../allinterface/tree/ITreeControl";

// This function update tree nodes based on featureId
const FnUpdateTreeNodesBasedOnFeatureId = async (treeData: ITreeNode[], featureId: string): Promise<ITreeNode[]> => {
    const treeNodes: ITreeNode[] = [];
    // Recursive function to traverse tree nodes and bind children
    const addedNodeNames: string[] = [];
    try {

        const traversTreeNodes = async (nodes: ITreeNode[], parentNode: ITreeNode | null): Promise<void> => {
            for (let index = 0; index < nodes.length; index++) {
                const element = nodes[index];

                // Check if this node should be skipped based on the featureId
                const shouldSkipNode: IShouldSkip = FnCheckToSkipNodeForFeature(element, featureId);
                // Clone the current node with empty children initially
                const newNode: ITreeNode = { ...element, children: [] };
                // Check if the node is already added to the parentNode.children array

                if (shouldSkipNode.shouldSkip) {
                    // Skip the node and manage the MountedDevice condition
                    if (isMountedDevice(element)) {
                        const mountedDeviceNode = await createMountedDeviceNode(element, parentNode);
                        if (parentNode && parentNode.children && mountedDeviceNode.NodeEntID) {
                            const shouldSkipMountedNode: IShouldSkip = FnCheckToSkipNodeForFeature(mountedDeviceNode, featureId);
                            if (!addedNodeNames.includes(mountedDeviceNode.NodeEntID) && !shouldSkipMountedNode.shouldSkip) {
                                addedNodeNames.push(mountedDeviceNode.NodeEntID);
                                parentNode.children.push(mountedDeviceNode);
                            }
                        }
                    } else {
                        // Continue traversing children of the skipped node
                        if (element.children && element.children.length > 0 && shouldSkipNode.isCheckedInChildren === false) {
                            await traversTreeNodes(element.children, parentNode);
                        }
                    }
                } else {
                    // Handle the case where children need to be updated based on found children
                    if (shouldSkipNode.isCheckedInChildren) {
                        const isRack = element.NodeType?.toLowerCase() === "rack";
                        if (!isRack) {
                            newNode.HasChildren = shouldSkipNode.foundInChildren ? 1 : 0;
                            newNode.isLeaf = !shouldSkipNode.foundInChildren;
                        }
                    }

                    // If the node is not skipped, attach it to the parent or root
                    if (parentNode && newNode.NodeEntID) {
                        if (!parentNode.children) {
                            parentNode.children = []; // Ensure children array exists
                        }
                        if (!addedNodeNames.includes(newNode.NodeEntID)) {
                            addedNodeNames.push(newNode.NodeEntID);
                            parentNode.children.push(newNode);
                        }
                    } else {
                        treeNodes.push(newNode);
                    }

                    // Continue traversing children
                    if (element.children && element.children.length > 0) {
                        await traversTreeNodes(element.children, newNode);
                    }
                }
            }
        };

        // Function to check if the node is a mounted device
        const isMountedDevice = (node: ITreeNode): boolean => {
            return !!(node.MountedDeviceEntID && node.treetype && ["deviceslot"].includes(node.treetype.toLowerCase()));
        };

        // Function to create a MountedDevice node
        const createMountedDeviceNode = async (node: ITreeNode, parentNode: ITreeNode | null): Promise<ITreeNode> => {
            return {
                Name: node.MountedDeviceName || "",
                key: node.MountedDeviceEntID || "",
                NodeEntityname: node.MountedDeviceEntityName || "",
                stepNo: parentNode ? (parentNode.stepNo + 1) : 0,
                parentEntID: parentNode ? parentNode.NodeEntID : "",
                NodeEntID: node.MountedDeviceEntID || "",
                NodeType: node.MountedDeviceNodeType,
                Description: node.MountedDeviceDescription || "",
                NodeState: null,
                checkable: false,
                HasPowerPorts: node.MountedDeviceHasPowerPort,
                HasNetworkPorts: node.MountedDeviceHasNetworkPort,
                IntelDCMState: node.MountedDeviceIntelDCMState,
                title: node.MountedDeviceName || "",
                icon: null,
                HasChildren: 0,
                isLeaf: true,
                treetype: "MountedDevice",
                type: "MountedDevice",
                children: [],
                Type: "MountedDevice"
            };
        };

        // Start processing the tree from the root
        await traversTreeNodes(treeData, null);
    } catch (error) {
        console.error(
            "Error in function(FnUpdateTreeNodesBasedOnFeatureId): ",
            error
        );

    }
    return treeNodes; // Return the new tree structure
};
export { FnUpdateTreeNodesBasedOnFeatureId }
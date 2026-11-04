
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// Returns the parent hierarchy of a given tree node using DOM attributes
const FnGetParentTreeNodeInfoUsingDiv = (
    info: ITreeNode,                     // Current node info
    clear: boolean = false,        // Clear parent data when starting
    parentObj: ITreeNode[] = []          // Accumulates parent information (default empty array)
): ITreeNode[] => {
    // Clear parent object if requested
    if (clear) {
        parentObj = [];
    }

    // Base case: Stop if no parentEntID is present
    if (!info?.parentEntID) {
        return parentObj;
    }

    // Attempt to retrieve parent node info
    const nodeDiv = document.getElementById(info.parentEntID);
    if (!nodeDiv) {
        console.warn(`Node with ID ${info.parentEntID} not found.`);
        return parentObj; // Return collected parents so far
    }

    // Parse the node-info attribute
    let nodeInfo;
    try {
        const attr = nodeDiv.getAttribute("node-info");
        if (attr) {
            nodeInfo = JSON.parse(attr); // Parse JSON safely
        } else {
            console.warn(`Node-info attribute missing for ID ${info.parentEntID}`);
            return parentObj; // Return collected parents so far
        }
    } catch (error) {
        console.error("Error parsing node-info:", error);
        return parentObj; // Return collected parents so far
    }

    // Add the parent node info to the array
    parentObj.push(nodeInfo);

    // Recursive call to fetch higher-level parents
    return FnGetParentTreeNodeInfoUsingDiv(nodeInfo, false, parentObj);
};

export { FnGetParentTreeNodeInfoUsingDiv }
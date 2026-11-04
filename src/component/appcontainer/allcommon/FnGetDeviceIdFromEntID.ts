
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";


const FnGetDeviceIdFromEntID = (treeData: ITreeNode[], targetId: string): string | null => {
    for (const node of treeData) {
        if (node.NodeEntID === targetId) {
            // If the current node is the target and a Device, return its ID
            return node.treetype === "Device" ? node.NodeEntID : null;
        }

        if (node.children) {
            const result = FnGetDeviceIdFromEntID(node.children, targetId);
            if (result) return result;
        }
    }

    return null;
};

export { FnGetDeviceIdFromEntID }
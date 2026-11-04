
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// get parent node of node
const FnGetImmediateParentTreeInfoUsingDiv = (info: ITreeNode) => {
    if (info.parentEntID) {
        const nodeDiv: HTMLElement | null = document.getElementById(info.parentEntID)
        if (nodeDiv) {
            let nodeInfo = nodeDiv?.getAttribute("node-info")
            if (nodeInfo) {
                nodeInfo = JSON.parse(nodeInfo)
                return nodeInfo;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    return null;
}

export { FnGetImmediateParentTreeInfoUsingDiv }
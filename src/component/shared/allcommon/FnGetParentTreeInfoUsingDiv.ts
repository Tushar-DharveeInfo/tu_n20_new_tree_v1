
import { ITreeNode } from "../allinterface/tree/ITreeControl";

let ParentObj: ITreeNode[] = [];
const FnGetParentTreeInfoUsingDiv = (info: any, clear: boolean = false) => {
    if (clear) {
        ParentObj = [];
    }
    try {
        if (info?.parentEntID) {
            const nodeDiv: HTMLElement | null = document.getElementById(info.parentEntID)
            const nodeInfo = nodeDiv?.getAttribute("node-info")
            if (nodeInfo) {
                const parsedNodeData = JSON.parse(nodeInfo)
                ParentObj.push(parsedNodeData)
                FnGetParentTreeInfoUsingDiv(parsedNodeData)
            }
        }
    } catch (error) {
        console.error(
            "Error in function(FnGetParentTreeInfoUsingDiv): ",
            error
        );
    }
    return ParentObj
}

export { FnGetParentTreeInfoUsingDiv }
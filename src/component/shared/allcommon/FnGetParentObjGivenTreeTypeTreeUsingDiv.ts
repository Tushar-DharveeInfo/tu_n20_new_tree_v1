import { ITreeNode } from "../allinterface/tree/ITreeControl";

let ParentObjData: ITreeNode[] = []
const FnGetParentObjGivenTreeTypeTreeUsingDiv = (info: ITreeNode, treeType: string, clear: boolean = false) => {
    if (clear) {
        ParentObjData = [];
    }
    try {
        if (info.parentEntID) {
            if (info.treetype != treeType) {
                const nodeDiv: HTMLElement | null = document.getElementById(info.parentEntID)
                const nodeInfo = nodeDiv?.getAttribute("node-info");
                if (nodeInfo) {

                    const parsedNode = JSON.parse(nodeInfo)
                    ParentObjData.push((parsedNode as unknown) as ITreeNode)
                    FnGetParentObjGivenTreeTypeTreeUsingDiv(parsedNode, treeType)
                }
            }
        }
    } catch (error) {
        console.error(
            "Error in function(FnGetParentObjGivenTreeTypeTreeUsingDiv): ",
            error
        );

    }
    return ParentObjData
}

export { FnGetParentObjGivenTreeTypeTreeUsingDiv }
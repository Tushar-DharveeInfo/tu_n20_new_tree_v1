import { ITreeNode } from "../../allinterface/tree/ITreeControl";

let parentNodeData: any = null

let node: any = null;
//  this function return node based on entid
const FnGetNodeDetailsBaseOnEntID = (treeData: ITreeNode[], entId: string) => {

  treeData?.forEach((item) => {
    if (item.NodeEntID == entId || item.key == entId) {
      parentNodeData = { node: item };
      return { entId, node };
    } else {
      if (item.children)
        FnGetNodeDetailsBaseOnEntID(item.children, entId)
    }
  });

  return { entId, parentNodeData };
}

export { FnGetNodeDetailsBaseOnEntID }

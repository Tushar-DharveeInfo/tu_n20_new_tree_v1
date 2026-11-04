
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";

// this function will return checked keys and nodes based on the Selected or Checked properties
const FnGetCheckedNodesForDeviceOrCableEntities = (
  nodes: ITreeNode[],
  strictlyCheck: boolean = false
) => {
  const keys: Key[] = [];
  const checkedNode: ITreeNode[] = [];
  const halfCheckedKeys: Key[] = [];
  const halfCheckedNode: ITreeNode[] = [];

  const traverseAndUpdate = (
    data: ITreeNode[],
    parentNode: ITreeNode | null = null
  ): ITreeNode[] => {
    let checkedLength = 0;

    const updatedNodes = data.map((node) => {
      const updatedNode = { ...node };

      if (node.Selected || node.Checked) {
        keys.push(node.key);
        checkedNode.push(node);
        checkedLength++;
      }

      // Update node properties for HWEntity
      if (node.NodeEntityname === "HWEntity") {
        updatedNode.isLeaf = false;
        updatedNode.HasChildren = 1;
      }

      // Recursively update children
      if (node.children && node.children.length > 0) {
        updatedNode.children = traverseAndUpdate(node.children, updatedNode);
      }

      return updatedNode;
    });

    if (strictlyCheck && parentNode) {
      if (checkedLength > 0 && checkedLength === parentNode.children?.length) {
        keys.push(parentNode.key);
        checkedNode.push(parentNode);
      } else if (checkedLength !== parentNode.children?.length) {
        halfCheckedKeys.push(parentNode.key);
        halfCheckedNode.push(parentNode);
      }
    }

    return updatedNodes;
  };

  const updatedTree = traverseAndUpdate(nodes);

  return {
    updatedTree, // Updated tree with changes applied
    checkedKeys: keys,
    checkedNodes: checkedNode,
    halfCheckedKeys,
    halfCheckedNode,
  };
};

export { FnGetCheckedNodesForDeviceOrCableEntities }
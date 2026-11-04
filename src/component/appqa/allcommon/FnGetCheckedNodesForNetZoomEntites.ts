
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
// Returns checked nodes and kesy based on Selected or Checked property
const FnGetCheckedNodesForNetZoomEntites = (
	nodes: ITreeNode[]
) => {
	const keys: Key[] = [];
	const checkedNode: ITreeNode[] = [];

	const traverseAndUpdate = (
		data: ITreeNode[]
	): ITreeNode[] => {

		const updatedNodes = data.map((node) => {
			const updatedNode = { ...node };

			if (node.Selected || node.Checked) {
				keys.push(node.key);
				checkedNode.push(node);
				if (node.IsNZ) {
					updatedNode.disableCheckbox = true;
				}
			}

			// Update node properties for HWEntity
			if (node.NodeType === "Tables") {
				updatedNode.checkable = false;
			}

			// Recursively update children
			if (node.children && node.children.length > 0) {
				updatedNode.children = traverseAndUpdate(node.children);
			}

			return updatedNode;
		});

		return updatedNodes;
	};

	const updatedTree = traverseAndUpdate(nodes);

	return {
		updatedTree, // Updated tree with changes applied
		checkedKeys: keys,
		checkedNodes: checkedNode,
	};
};
export { FnGetCheckedNodesForNetZoomEntites };

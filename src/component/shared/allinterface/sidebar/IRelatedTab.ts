import { Key } from "rc-tree/lib/interface";
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { NodeDragEventParams } from "rc-tree/lib/contextTypes";

interface IRelatedTab {
    uniqueName: string;
    treeData: any; // Hierarchical tree data
    treeProps: any; // tree data props
    defaultExpandedKeys?: Key[]; // Array of keys for expanded nodes
    defaultSelectedKeys?: Key[]; // Array of keys for selected nodes
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => void;
    handleNodeExpand?: (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => void;// when API call is required for expand
    handleNodeClick?: (event: React.MouseEvent, node: ITreeNode, treeData: ITreeNode[]) => void;
    handleDragStart?: (info: NodeDragEventParams<ITreeNode>) => void;
    handleDragEnd?: (info: NodeDragEventParams<ITreeNode>) => void;
    canAllowDragDrop?: (sourceNode: ITreeNode) => boolean;
}

export type { IRelatedTab }
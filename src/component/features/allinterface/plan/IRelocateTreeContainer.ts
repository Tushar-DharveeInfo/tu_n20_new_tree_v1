import { Key } from 'react';
import { ISelectedNodeInfo, ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';

interface IRelocateTreeContainer {
    uniqueName: string;
    featureId: string;
    treeData?: ITreeNode[];
    selectedNodeExplorer?: ISelectedNodeInfo;
    selectedFloorNode?: ITreeNode;
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[], newTreeData?: ITreeNode[]) => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IRelocateTreeContainer };

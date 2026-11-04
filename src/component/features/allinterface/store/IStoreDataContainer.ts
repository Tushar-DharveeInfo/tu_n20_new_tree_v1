
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IStoreDataContainer {
    uniqueName: string;
    featureId: string;
    selectedNode?: ITreeNode;
    selectedFloorNode?: ITreeNode;
    treeData?: ITreeNode[];
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IStoreDataContainer }
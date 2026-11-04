
import { ISelectedNodeInfo, ITreeNode } from "../../../shared/allinterface/tree/ITreeControl"

interface ITransferContainer {
    uniqueName: string
    selectedNodeInfo: ISelectedNodeInfo;
    featureId: string;
    treeData?: ITreeNode[]
    handleShowUserMessage?: (messageText: string) => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
}



export type { ITransferContainer }
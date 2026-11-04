import { ISelectedNodeInfo, ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IInboundAssetContainer {
    uniqueName: string,
    featureId: string
    selectedNodeInfo: ISelectedNodeInfo
    selectedFeatuerQa?: string
    treeData?: ITreeNode[] | null; // tree data for the sidebar
}

export type { IInboundAssetContainer }
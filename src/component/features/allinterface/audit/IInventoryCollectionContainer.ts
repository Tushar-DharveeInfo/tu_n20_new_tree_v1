
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IInventoryCollectionContainer {
    uniqueName: string;
    featureId: string;
    selectedNode: ITreeNode;
    tableToShow: string;
    treeData: ITreeNode[];
    hideAddForm?: boolean;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    handleShowUserMessage?: (messageText: string) => void;
    handleReloadTree?: (treeFor: string) => void;
}

interface IPgRecord {
    tableName: string;
    tableLabel: string;
    properties: string;
}

export type { IInventoryCollectionContainer, IPgRecord }
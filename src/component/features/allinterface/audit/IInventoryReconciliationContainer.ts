
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IInventoryReconciliationContainer {
    uniqueName: string;
    featureId: string;
    selectedNode: ITreeNode;
    tableToShow: string;
    treeData: ITreeNode[];
    hideAddForm?: boolean;
    headerToShow?: string;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    handleShowUserMessage?: (messageText: string) => void;
    handleReloadTree?: (treeFor: string) => void;
}

export type { IInventoryReconciliationContainer }
import type { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IDeviceFloorLayoutContainer {
    uniqueName: string;
    featureId: string;
    selectedNode: ITreeNode;
    selectedFloorNode: ITreeNode;
    treeData?: ITreeNode[];
    headerText?: string;
    hideHeader?: boolean;
    isSidebarOpen?: boolean;
    handleSidebarOpenClose?: (action: "open" | "close") => void;
    selectDcExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IDeviceFloorLayoutContainer }

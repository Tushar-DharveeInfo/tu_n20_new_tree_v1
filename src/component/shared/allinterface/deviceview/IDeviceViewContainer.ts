import { ITreeNode } from "../tree/ITreeControl";

interface IDeviceViewContainer {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;
    selectedNode: ITreeNode;
    headerTitle?: string;
    treeData?: ITreeNode[];
    selectedDeviceViewId?: string;
    viewType: "device" | "mounted";
    hideHeader?: boolean;
    isSidebarOpen?: boolean;
    isShowSidebarBtn?: boolean;
    isHideMountDeviceInView?: boolean;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    handleSelectedTabChanges?: (selectedTabName: string, selectedTabData: any) => void;
    handleViewClick?: (entID: string) => void
    handleShowUserMessage?: (messageText: string) => void;

}

export type { IDeviceViewContainer }

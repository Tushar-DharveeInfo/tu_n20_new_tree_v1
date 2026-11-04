
import { ITreeNode } from "../tree/ITreeControl";

interface IMountedDeviceViewContainer {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;
    selectedNode: ITreeNode;
    treeData?: ITreeNode[];
    headerTitle?: string
    tabIndex?: string
    isSidebarOpen?: boolean;
    isShowSidebarBtn?: boolean;
    hideHeader?: boolean;
    splitterLayout?: 'vertical' | 'horizontal'
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    handleViewClick?: (entID: string) => void
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IMountedDeviceViewContainer }

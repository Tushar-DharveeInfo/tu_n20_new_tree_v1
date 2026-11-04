import { ISelectedNodeInfo, ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IDeleteContainer {
    uniqueName: string;
    featureId: string;
    selectedNodeInfo?: ISelectedNodeInfo;
    selectedFloorNode?: ITreeNode;
    treeData?: ITreeNode[];
    showFloorLayout?: boolean;
    isSidebarOpen?: boolean;
    isShowSidebarBtn?: boolean;
    hideSidebarBtn?: boolean;
    hideSideBarCloseBtn?: boolean;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    handleSidebarClose?: () => void;
    selectDcExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string, dateFormat?: string) => void;
    handleShowUserMessage?: (messageText: string) => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
}

export type { IDeleteContainer };

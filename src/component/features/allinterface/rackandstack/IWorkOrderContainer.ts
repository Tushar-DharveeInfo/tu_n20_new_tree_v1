
import { IMenuItem } from "../../../shared/allinterface/menu/IMainMenu";
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IWorkOrderContainer {
    uniqueName: string;
    featureId: string;
    selectedFeature?: IMenuItem;
    selectedNode?: ITreeNode;
    isShowSidebarBtn?: boolean;
    handleShowUserMessage?: (messageText: string) => void;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
}

export type { IWorkOrderContainer }
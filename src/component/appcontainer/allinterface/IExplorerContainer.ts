
import { Key } from "rc-tree/lib/interface";
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";
import { ISelectedNodeInfo, ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { IFeatureItem } from "../../shared/context/allinterface/IMainApp";

interface IExplorerContainer {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    featureData: IFeatureItem[];
    allowShowHeader: boolean;
    originalTreeData?: ITreeNode[];
    selectedKebabMenu?: IMenuItem;// for handle kebabmenu to select featureQa
    subTreeFeatureId?: string;// this will be used for second tree in the page to render
    headerText?: string;
    selectedFeatureData?: IMenuItem;
    selectedNodeExplorer?: ISelectedNodeInfo;// for use in sidebar to show properties 
    tabIndex?: string;
    selectedNodeForCustomization?: ITreeNode;
    selectedFloorNode?: ITreeNode;
    firstPaneTreeData?: ITreeNode[];
    updateOriginalTreeDataset?: (updatedTreedata: ITreeNode[], expandedKeys: Key[], selectedKeys: Key[], userTreeData: ITreeNode[] | null) => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
    handleCloseSidebar?: () => void;
    clearCacheTreeData?: () => void;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    handleShowUserMessage?: (messageText: string, container?: HTMLDivElement, isShowAsPrompt?: boolean) => void;

}
export type { IExplorerContainer }
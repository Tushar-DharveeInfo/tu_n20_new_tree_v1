
import { Key } from "rc-tree/lib/interface";
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";
import { ISelectedNodeInfo, ITreeNode } from "../../shared/allinterface/tree/ITreeControl";

interface ILayoutContainer {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    showFloorLayout: boolean;// indicates to show floor layout or not
    featureRecords: IMenuItem[]
    treeData?: ITreeNode[];// for all data centers 
    isSiteByTenant?: "AllSites" | "TenantsBySite" | "SitesByTenant";// for all data centers
    headerText?: string;//to show header for the controls 
    selectedNodeInfo?: ISelectedNodeInfo; //selected node info from the tree
    selectedExplorerNodeInfo?: ISelectedNodeInfo;// for custom implementations 
    selectedFeatureItem?: IMenuItem;
    selectedSubGroupItemForMenu?: IMenuItem;
    selectedFloorNode?: ITreeNode;
    defaultCheckedKeys?: Key[];
    checkedNode?: ITreeNode;
    manuallyNodeSelected?: boolean;
    selectedNodeForCustomization?: ITreeNode;
    isSidebarOpen?: boolean;
    isShowSidebarBtn?: boolean;
    handleSidebarClose?: () => void;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    selectDcExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string, dateFormat?: string) => void;
    addToCableRtmSelect?: any;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    selectedKebabMenu?: IMenuItem
    handleReloadTree?: (treeFor: string, entID?: string) => void;
    handleShowUserMessage?: (messageText: string) => void;
}
export type { ILayoutContainer }
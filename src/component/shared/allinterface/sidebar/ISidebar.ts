import { IMenuItem } from "../menu/IMainMenu";
import { ITreeNode } from "../tree/ITreeControl";

interface IDevicePropertyInfo {
    selectedMfg: string;
    selectedMfgProdNo: string;
    selectedMfgEQID?: string;
}
interface ISidebar {
    featureId: string;
    uniqueName: string; // unique identifier for the control
    isShowSidebar: boolean;// whether to show sidebar or not
    headerText: string; // header text from selected node 
    isShowNotification: boolean; // whether notification is shown or not
    selectedNodeEntID: string;//selected node entid for API call 
    featureQAList: IMenuItem[]; // list of feature QA items
    handleCloseSidebar: () => void;// to handle close sidebar 
    selectedFeatureQa?: IMenuItem | null; //for set selected data
    selectedRightMouseMenu?: any;// to pass selected rightmouse menu if needed
    selectedNode?: ITreeNode; //selected node data
    fullView?: boolean
    showPopupSidebar?: boolean;
    selectedMenuFeature?: IMenuItem;
    subTreeFeatureId?: string;// for custom handling 
    treeData?: ITreeNode[] | null; // tree data for the sidebar
    hideSideBarCloseBtn?: boolean; // to hide sidebar close button
    selectedNodeExplorer?: ITreeNode;
    isHideMaximizeButton?: boolean;
    handleReloadTree?: (featureId: string, entID?: string) => void;
    handleMouse?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any) => void;// to handle mouse events
    apValueChange?: (value: any, EntID: string, event: unknown, selectedData: unknown, instanceName?: string) => void; // ap form value change
    handleShowErrorDialog?: (message: string, isOpen: boolean) => void;
}


interface IEMRecord {
    TableName?: string;
    DefaultValue?: string;
    RequiredToAddRecord?: boolean;
    RequiredToUpdateRecord?: boolean;
    DisplayControl?: string;
}
interface IKebabMenuResponse {
    KebabMenu?: IMenuItem[];
}


export type { ISidebar, IDevicePropertyInfo, IEMRecord, IKebabMenuResponse }
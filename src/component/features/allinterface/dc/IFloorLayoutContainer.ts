import { IinboundLocation } from "../../../shared/allinterface/plan/IPlacementExplorer";
import { IActionLabelItem } from "../../../shared/allinterface/basic/IActionLabelItem";
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";
import { IPlacementDevice } from "../../../shared/allinterface/plan/IEditFloorLayout";

interface IFloorLayoutContainer {
    uniqueName: string;//Unique identifier and required
    allowEdit: boolean;
    selectedFloorNode: ITreeNode;
    featureId: string;
    selectedNode?: ITreeNode;
    treeData?: ITreeNode[];
    overlayButtonForDevice?: { label: string, tooltip: string }[];
    isSidebarOpen?: boolean;
    hideSearchControl?: boolean;
    selectedPlacement?: IActionLabelItem;
    selectedFeatureTreeNode?: ITreeNode;
    isFloorNode?: boolean;
    hideHeader?: boolean;
    hideSidebarBtn?: boolean;
    inboundLocationData?: IinboundLocation
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    handleOverlayButtonForDeviceClick?: (buttonName: string, payload?: Record<string, any>, selectedPlacement?: IPlacementDevice) => void;
    handleMouse?: (event: any, actionCode?: string, payload?: any) => void;
    handleMouseDouble?: (event: any, actionCode?: string, payload?: any) => void;
    handleRUSelect?: (Ru: string, EntID?: string) => void;
    handleShowUserMessage?: (messageText: string) => void;
    selectDcExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
}



export type { IFloorLayoutContainer }
import { IMenuItem } from "../menu/IMainMenu";
import { ISelectedNodeInfo, ITreeNode } from "../tree/ITreeControl";
import type { ReactNode } from "react";
import { CellClickedEvent, ICellRendererParams } from "ag-grid-community";
import { IBasicGridColDef } from "./IBasicGrid";

interface ICablingPortStatusJson {
    PortID?: string | null;
}

interface ICablingGridRow {
    FromDeviceCompositePortName?: string | null;
    FromDevicePortStatus?: string | null;
    FromDevicePortID?: string;
    FromDevicePortGender?: string;
    FromDevicePortIndex?: number;
    FromDeviceViewID?: string;
    FromDeviceViewName?: string;
    FromDeviceEntityID?: string;
    FromDeviceEntityName?: string;
    FromDeviceName?: string;
    FromDeviceDescription?: string;
    FromDevicePath?: string;
    FromDeviceAssetID?: string;
    FromDevicePortDesc?: string;
    FromDevicePortNodeType?: string;
    FromDevicePortPortType?: string;
    ToDeviceCompositePortName?: string | null;
    ToDevicePortStatus?: string | null;
    ToDevicePortID?: string;
    ToDeviceAssetID?: string;
    ToDevicePortGender?: string;
    ToDevicePortIndex?: number;
    ToDeviceViewID?: string;
    ToDeviceViewName?: string;
    ToDeviceEntityID?: string;
    ToDeviceEntityName?: string;
    ToDeviceName?: string;
    ToDeviceDescription?: string;
    ToDevicePath?: string;
    ToDevicePortDesc?: string;
    ToDevicePortNodeType?: string;
    ToDevicePortPortType?: string;
    PortACompositeName?: string;
    PortAStatus?: string | null;
    PortAEntityID?: string | null;
    PortAViewName?: string | null;
    PortADesc?: string | null;
    PortAGender?: string | null;
    PortANodeType?: string | null;
    PortAPortType?: string | null;
    PortACableViewID?: string | null;
    PortBCompositeName?: string | null;
    PortBStatus?: string | null;
    PortBEntityID?: string | null;
    PortBViewName?: string | null;
    PortBDesc?: string | null;
    PortBGender?: string | null;
    PortBNodeType?: string | null;
    PortBPortType?: string | null;
    PortBCableViewID?: string | null;
    CableEntityName?: string;
    CableEntityID?: string;
    CableAssetID?: string;
    CableName?: string;
    CableDescription?: string;
    tableIndex?: number;
    ID?: string;
}

interface ICablingGridSection {
    columnDefs?: IBasicGridColDef[];
    rowData: ICablingGridRow[];
    FromDeviceName?: string;
}

interface ICablingCableComboItem {
    cableID?: string;
    cableName?: string;
    isUsed?: number;
    assetID?: string;
    cableColor?: string;
    cableLength?: string | number;
    cableWidth?: string | number;
    customCable?: boolean;
    entityName?: string;
}

interface ICablingCloneCableRequest {
    cableID: string;
}

interface ICablingCloneCableResponse {
    clonedCableID: string;
}

interface ICablingCablesWithPortRequest {
    cableIDList: (string | null)[];
    isPower: boolean;
}

interface ICablingDropNode extends ICablingGridRow {
    FromDevicePortID?: string;
    ToDevicePortID?: string;
}

interface ICablingPortApiItem {
    DevicePortIndex?: number;
    ToDeviceEntityName?: string;
    EntityID?: string;
    DeviceAssetID?: string;
    DevicePath?: string;
    DeviceName?: string;
    DeviceDescription?: string;
    ViewName?: string;
    DeviceViewID?: string;
    DevicePortID?: string;
    CompositePortName?: string;
    PortDesc?: string;
    DevicePortStatus?: string;
    PortGender?: string;
    NodeType?: string;
    PortType?: string;
}


interface ICablingJsonResponse {
    Cabling: ICablingGridRow[];
}

interface IGetCablingApiPayload {
    fromDeviceID: string;
}

interface ICablingSetPortStatusPayload {
    isPower: boolean;
    portID?: string;
    portStatus: string;
}

interface ICablingDisconnectPortPayload {
    forceConnect: boolean;
    cablePortID: string | null;
    devicePortID: string | null;
}



interface ICablingSessionUpdateItem {
    VariableContext: string;
    VariableName: string;
    SessionValue: string;
}

interface ICablingDragPortNode {
    PortAViewName?: string;
    PortAEntityID?: string;
    PortACompositeName?: string;
    PortAStatus?: string;
    PortADesc?: string;
    PortAGender?: string;
    PortANodeType?: string;
    PortAPortType?: string;
    PortBStatus?: string;
    PortBCompositeName?: string;
    PortBDesc?: string;
    PortBEntityID?: string;
    PortBViewName?: string;
    PortBGender?: string;
    PortBNodeType?: string;
    PortBPortType?: string;
}

interface ICablingGridContext {
    Cabling?: ICablingGridSection[];
    diagnosticLevel?: string | number;
}

type ICablingCellRendererParams = ICellRendererParams<ICablingGridRow, string | null, ICablingGridContext>;

type ICablingCellRenderer = (params: ICablingCellRendererParams) => ReactNode;

type ICablingCellClickParams = CellClickedEvent<ICablingGridRow, string | null, ICablingGridContext> & {
    type?: string;
    eventPath?: Event[];
    column?: { colId: string };
    colDef?: IBasicGridColDef;
};

type CablingDragHandlers = {
    handleDragStart: (event: DragEvent) => void;
    handleDrag: (event: DragEvent) => void;
    handleDragEnd: (event: DragEvent) => void | Promise<null | undefined>;
};


interface ICablingGrid {
    uniqueName: string;
    featureId: string; // feature id
    selectedNodeInfo: ISelectedNodeInfo//selected node
    checkedNodes?: ITreeNode// checked node of grid
    hidePaneTitles?: any // pane title arry
    allowHidePane?: boolean; // allow to hide show pane
    paneName?: string;//pane name
    allowShowPane?: boolean// show pane base on flag
    isReadOnly?: boolean; // read only
    selectedNodeMenu?: IMenuItem//selcted right mouse menu on grid.
    isExportOnCopy?: boolean;
    treeData?: ITreeNode[];
    catchFromData?: any;
    catchTableData?: any;
    handleCatchFromData: (data: any) => void;
    handleCatchTableData: (data: any) => void;
    handleCloseOpenPane?: (paneName?: string, status?: string, headerTitle?: string) => void
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
}
export type {
    ICablingPortStatusJson,
    ICablingGridRow,
    ICablingGridSection,
    ICablingCableComboItem,
    ICablingCloneCableRequest,
    ICablingCloneCableResponse,
    ICablingCablesWithPortRequest,
    ICablingDropNode,
    ICablingPortApiItem,
    ICablingJsonResponse,
    IGetCablingApiPayload,
    ICablingSetPortStatusPayload,
    ICablingDisconnectPortPayload,
    ICablingSessionUpdateItem,
    ICablingDragPortNode,
    ICablingGridContext,
    ICablingCellRendererParams,
    ICablingCellRenderer,
    ICablingCellClickParams,
    ICablingGrid,
    CablingDragHandlers
};

import { IBasicGridColDef } from "../../../shared/allinterface/tablegrid/IBasicGrid";
import { ISelectedNodeInfo } from "../../../shared/allinterface/tree/ITreeControl";


interface ICablingNavigation {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;
    selectedNode: ISelectedNodeInfo;
}
interface ICablingPortApiItem {
    DeviceName?: string;
    DeviceViewID?: string;
    ViewName?: string;
    EntityID?: string;
    DeviceAssetID?: string;
    DevicePath?: string;
    DeviceDescription?: string;
    DevicePortID?: string | null;
    CompositePortName?: string;
    PortDesc?: string;
    DevicePortStatus?: string;
    PortGender?: string;
    NodeType?: string;
    ToDeviceEntityName?: string;
}

interface ICablingNavigationRow extends ICablingPortApiItem {
    ToDeviceEntityName?: string;
    ToDeviceEntityID?: string;
    ToDeviceAssetID?: string;
    ToDevicePath?: string;
    ToDeviceName?: string;
    ToDeviceDescription?: string;
    ToDeviceViewName?: string;
    ToDeviceViewID?: string;
    ToDevicePortID?: string | null;
    ToDeviceCompositePortName?: string;
    ToDevicePortDesc?: string;
    ToDevicePortStatus?: string;
    ToDevicePortGender?: string;
    ToDevicePortNodeType?: string;
    ConnectedCompositePortName?: string;
    ID?: string | number;
}

interface ICablingNavigationSection {
    columnDefs: IBasicGridColDef[];
    rowData: ICablingNavigationRow[];
    DeviceViewID: string;
    viewName: string;
}

interface IPortsJsonResponse {
    Ports: ICablingPortApiItem[];
}

interface IPortStatusJson {
    PortID: string;
}

interface IConnectionTraceItem {
    ConnectedDevicePortID: string;
}

export type { ICablingNavigation, ICablingPortApiItem, ICablingNavigationRow, ICablingNavigationSection, IPortsJsonResponse, IPortStatusJson, IConnectionTraceItem }
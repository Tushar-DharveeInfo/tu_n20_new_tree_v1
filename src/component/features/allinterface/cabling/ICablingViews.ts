import { ISelectedNodeInfo } from "../../../shared/allinterface/tree/ITreeControl";


interface ICablingViews {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;
    fromDeviceViewEntID: string;
    fromDeviceViewType: string;
    cableViewEntID: string;
    toDeviceViewEntID: string;
    toDeviceViewType: string;
    CableName: string;
    selectedNode: ISelectedNodeInfo;
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
}

export type { ICablingViews }
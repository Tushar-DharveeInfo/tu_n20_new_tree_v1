import { ISelectedNodeInfo, ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";


interface INavigationView {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;
    DeviceViewID: string;
    selectedNode: ISelectedNodeInfo;
    ViewName: string;
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
}

export type { INavigationView }
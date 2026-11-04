
import { ISessionVariable } from "../basic";
import { ISelectedNodeInfo } from "../tree/ITreeControl";
import { IFeatureItem } from "../../context/allinterface/IMainApp";

interface ISessionContainer {
    uniqueName: string; // A unique identifier for session
    showGrid: boolean; // show session container or not
    sessionData: ISessionVariable[];
    featureId: string;
    featureData?: IFeatureItem[]; // feature data
    selectedNodeInfo?: ISelectedNodeInfo // selected node info 
}

export type { ISessionContainer }
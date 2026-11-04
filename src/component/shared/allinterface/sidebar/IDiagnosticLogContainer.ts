
import { IFeatureItem } from "../../context/allinterface/IMainApp";
import { ITreeNode } from "../tree/ITreeControl";

interface IDiagnosticLogContainer {
    uniqueName: string; // A unique identifier for the actin log
    showGrid: boolean; // show session container or not
    featureId: string;
    selectedNode: ITreeNode | undefined;
    featureData?: IFeatureItem[]; // feature data
    actionData?: Record<string, any>[]; // action log data 
}

export type { IDiagnosticLogContainer }

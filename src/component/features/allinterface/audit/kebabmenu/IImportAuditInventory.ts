import { ISelectedNodeInfo } from "../../../../shared/allinterface/tree/ITreeControl";

interface IImportAuditInventory {
    uniqueName: string;// unique identifier for the control 
    selectedNodeInfo: ISelectedNodeInfo; // Replace 'any' with a more specific type if available
    featureId: string;
    headerText: string;
    handleCloseDialog: (isReloadNeeded?: boolean) => void;
}

export type { IImportAuditInventory }
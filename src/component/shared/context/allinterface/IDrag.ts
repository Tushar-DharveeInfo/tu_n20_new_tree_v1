import { ITreeNode } from "../../allinterface/tree/ITreeControl";



interface IInventoryDeviceDetails {
    EQID?: string;
    deviceName?: string;
    moduleDeviceID?: string;
    moduleViewID1?: string | null;
    moduleViewID2?: string | null;
    slotsNeeded?: number;
    sourcePath?: string;
    networkPort?: number;
    powerPort?: number;
    rawDetails?: Record<string, any>;
}

interface IDragItem {
    source: "devicemodel" | "it";
    node: ITreeNode;
    subSource?: string;
    sourceTreeData?: ITreeNode[];
    MorePropertyData?: Record<string, any>[];
    inventoryDeviceDetails?: IInventoryDeviceDetails;
}
interface IReloadTree {
    source: "devicemodel";
    nodeToRemove: ITreeNode;
}
interface IDrag {
    dragItem?: IDragItem;
    setDragItem: (item: IDragItem | undefined) => void;

    reloadTreeFor?: IReloadTree;
    setReloadTreeFor: (reload: IReloadTree | undefined) => void;

    inventoryDeviceDetails?: IInventoryDeviceDetails;
    setInventoryDeviceDetails?: (details: IInventoryDeviceDetails | undefined) => void;
}
export type { IDragItem, IDrag, IReloadTree, IInventoryDeviceDetails }
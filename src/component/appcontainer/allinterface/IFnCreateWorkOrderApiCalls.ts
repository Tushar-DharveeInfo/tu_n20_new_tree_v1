import { ISessionContextProps } from "../../shared/context/allinterface/ISession";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";

interface IFnCreateWorkOrderApiCall {
    action: string;
    WorkorderType: "Placement" | "Add" | "Transfer" | "Relocate" | "Move" | "Delete" | "Empty" | "Change Port" | "Change Slot" | "Change AuditInventory Status" | "Paste" | "Replacement" | "Delete Audit Inventory";
    statusBarContext: IStatusBar;
    sessionContext: ISessionContextProps;
    treeData?: ITreeNode[];
    sourceNodeEntID?: string;
    sourceNodeName?: string;
    sourceNodePath?: string;
    EntityName?: string;
    sourceNodeType?: string;
    SeqNo?: number;
    _WorkOrderProfile?: Record<string, any>;
    ParentEntityName?: string;
    ParentID?: string;
    RUPosition?: string;
    destNodeEntityname?: string;
    destNodeEntID?: string;
    destNodeObj?: Record<string, any>;
    destNodePath?: string;
    sourceNodeObj?: unknown;
    EQID?: string;
    mountedShortView?: string;
    PortStatus?: string;
    SlotStatus?: string;
    AuditStatus?: string;
    sourceTreeData?: ITreeNode[];
    AuditName?: string;
    workOrderProfileName?: string;
    workOrderItems?: Record<string, any>[],
    PortName?: string;
    PortID?: string;
    networkPort?: number;
    powerPort?: number;
    extraSouceObj?: Record<string, any>; // if you passed then it will add extra source in source object 
    extraDestObj?: Record<string, any>; // if you passed then it will add extra dest in dest object
    SiteID?: string,
    RoomID?: string;
    FloorID?: string;
    DESC250?: string;
    isFloorDevice?: boolean;
}
export type { IFnCreateWorkOrderApiCall };
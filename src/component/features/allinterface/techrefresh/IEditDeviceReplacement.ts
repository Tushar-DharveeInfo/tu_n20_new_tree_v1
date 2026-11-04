
import { ColDef, FirstDataRenderedEvent, RowDataUpdatedEvent } from "ag-grid-community";
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IEditDeviceReplacement {
    uniqueName: string;
    featureId: string;
    selectedNodeExplorer?: ITreeNode;
    handleShowUserMessage?: (messageText: string) => void;
    handleSidebarClose?: () => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
}

interface IPropertyDefinition {
    TableName: string;
    PName: string;
    Description: string;
    MaxLength: number | null;
    SortOrder: number;
    RequiredToAddRecord: boolean;
    RequiredToUpdateRecord: boolean;
    DisplayControl: string;
    InputMask: string;
    PropertyLabel: string;
}

interface IFloorRackResponse {
    floorRacksJson: string;
}
interface IMountedDeviceResponse {
    rackMountedDevicesJson: string;
}
interface IDevicePortGrid {
    uniqueName: string;
    portType: 'power' | 'network';
    instanceName: string;
    featureId: string;
    columnDefs: ColDef[];
    allowHeader: boolean;
    headerText: string;
    onFirstDataRendered?: (event: FirstDataRenderedEvent<any, any>) => void;
    onRowDataUpdated?: (event: RowDataUpdatedEvent<any, any>) => void;
    rowData?: Record<string, string | number | boolean | unknown | null | undefined>[]
}

interface IPortDataItem {
    Name: string;
    CompositeName: string;
    Gender: "Male" | "Female" | string; // enum-like if limited values
    PortUse: string;
    PortType: string;
    [key: string]: string | unknown;
}
type OperationType = 'MOVE' | 'ADD' | 'DELETE' | 'MOVE_WITHIN_GROUP' | 'REPLACE';
interface Operation {
    id: string;
    type: OperationType;
    deviceId: string;
    // For MOVE operations
    fromRackName?: string;
    fromStartRuId?: number;
    // For ADD and MOVE operations
    toRackName?: string;
    toStartRuId?: number;
    // For ADD operations
    RURequired?: number;
    // For REPLACE operations
    oldDeviceId?: string;
    newDeviceId?: string;
}
interface ConflictError {
    operationId: string;
    type: 'INSUFFICIENT_RuS' | 'RuS_OCCUPIED' | 'ITEM_NOT_FOUND' | 'INVALID_OPERATION' | 'GROUP_NOT_FOUND' | 'BUDGET_EXCEEDED' | 'INVALID_BOUNDS';
    message: string;
    operation: Operation;
}
interface IDcTreeContainer {
    uniqueName: string;
    selectedDevice?: Record<string, any>;
    featureId: string;
    handleNodeSelect: (selectedNode?: ITreeNode, treeData?: ITreeNode[], isTargetNotFound?: boolean) => void;
    targetEqid?: string;
    hasReplacementProfile?: boolean;
    isProfileLoading?: boolean;
    treeRefreshKey?: number;
}
type ICreateReplacementContainer = IEditDeviceReplacement;
export type { IEditDeviceReplacement, ICreateReplacementContainer, IDevicePortGrid, IPropertyDefinition, IPortDataItem, IFloorRackResponse, IMountedDeviceResponse, ConflictError, IDcTreeContainer }
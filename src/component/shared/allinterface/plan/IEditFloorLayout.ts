
import { AgentType } from "@n20a/libmcpclient";
import { Device, Location } from "@n20a/liblayout";
import { IChartProfile } from "../../context/allinterface/IChartProfile";
import { IInMemoryUrl } from "../../context/allinterface/IInMemoryUrl";
import { ISessionContextProps } from "../../context/allinterface/ISession";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { IChatResponse } from "../IAIContainer";
import { ITreeNode } from "../tree/ITreeControl";

interface IMemoryVariables {
    InMemoryUrlContext: IInMemoryUrl,
    statusBarContext: IStatusBar,
    chartProfileContext: IChartProfile,
    sessionContext: ISessionContextProps,
    apiProfiles: unknown[],
    isReturnCurrentURL: boolean,
    sendPrompt?: (
        agentType: AgentType,
        prompt: string,
        apiKey: string,
        context?: string
    ) => Promise<IChatResponse>
}
interface IEditFloorLayout {
    uniqueName: string;
    featureId: string;
    selectedFloorNode: ITreeNode;
    mode: "canvas" | "tree";
    statusBarContext: IStatusBar;
    selectedNode?: ITreeNode;
    AvailableRack?: IAvailableRack[];
    allowEdit?: boolean;
    selectedPlacement?: IPlacementDevice;
    availableRacks?: IAvailableRack[];
    handleMouse?: (event: any, actionCode?: string, payload?: any) => void;
    handleMouseDouble?: (event: any, actionCode?: string, payload?: any) => void;
    selectDcExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
    handleShowUserMessage?: (messageText: string) => void;
}

interface IFloorRack {
    RackName: string;
    EntId: string;
    EntityName: string;
    totalRU: number;
    FreeRU?: number;
    FreePowerAvailable?: number; // Total power available for the rack, 
    FreeThermal?: number; // Thermal capacity available
    FreePowerPort?: number; // Power ports available
    FreeNetworkPort?: number; // Network ports available
    FreeWeight?: number; // Weight capacity available
}

interface IMountedDevice {
    Name: string; // device name
    EntityName: string;
    EntId: string;

    RackName: string;
    RackEntName: string;
    RackEntId: string;
    StartMountIndex: number;
    RURequired?: number;
    Power?: number; // Power requirement of the item,
    Thermal?: number; // Thermal requirement of the item
    PowerPort?: number; // Power port requirement
    NetworkPort?: number; // Network port requirement
    Weight?: number; // Weight of the device
}

interface IPlacementDevice {
    Name: string; // device name
    EntityName: string;
    EntId: string;

    RURequired?: number;
    power?: number; // Power requirement of the item,
    thermal?: number; // Thermal requirement of the item
    powerport?: number; // Power port requirement
    networkport?: number; // Network port requirement
    Weight?: number; // Weight of the device.
    EQID?: string; // device id for replacement
}

// Interface for available rack positions
interface IAvailableRack {
    RackName: string;
    EntityName: string;
    EntId: string;
    availablePositions: number[]; // array of RU positions available
}

interface IRenderMountedRackProps {
    rack: IFloorRack;
    rackmountedDevices: IMountedDevice[];
    proposedPlacements?: IMountedDevice[];
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

interface IPlacementDevice {
    Name: string; // device name
    DeviceID: string; // device name
    _Device?: string;// device name from placement 
    EntityName: string;
    EntId: string;
    RURequired?: number;
    Power?: number; // Power requirement of the item,
    Thermal?: number; // Thermal requirement of the item
    PowerPort?: number; // Power port requirement
    NetworkPort?: number; // Network port requirement
    Weight?: number; // Weight of the device
    StartMountIndex: number;
}

interface ILayoutTableRow {
    EntID?: string;
    LocationLayoutConfig?: string | Location;
    DeviceLayoutConfig?: string | Device;
    FloorLayoutConfig?: string;
    [key: string]: unknown;
}

interface IRackApiRow {
    RackName: string;
    EntId: string;
    EntityName: string;
    FreePowerAvailable?: number;
    FreeThermal?: number;
    totalRU: number;
    FreeRU?: number;
    FreePowerPort?: number;
    FreeNetworkPort?: number;
    TotalWeight?: number;
}

interface IMountedDeviceApiRow {
    EntId: string;
    Name: string;
    EntityName: string;
    RackName: string;
    RackEntName: string;
    RackEntId: string;
    RURequired?: number;
    PowerPort?: number;
    NetworkPort?: number;
    Weight?: number;
}

interface IDragActionImage {
    actionCode: string;
}

export type {
    IEditFloorLayout,
    IMemoryVariables,
    IRenderMountedRackProps,
    ConflictError,
    IAvailableRack,
    IPlacementDevice,
    IMountedDevice,
    IFloorRack,
    ILayoutTableRow,
    IRackApiRow,
    IMountedDeviceApiRow,
    IDragActionImage,
}
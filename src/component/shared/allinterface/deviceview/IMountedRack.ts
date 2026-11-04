// Interfaces for RenderMountedRack component

import { IAvailableRack } from "../plan/IEditFloorLayout";

export interface IFloorRack {
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
  TotalWeight?: number;
}

export interface IMountedDevice {
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

// Interface for available rack positions


export interface IRenderMountedRackProps {
  rack: IFloorRack;
  rackmountedDevices: IMountedDevice[];
  availablePositions: Number[]
  availableRackData: IAvailableRack[]
  proposedPlacements?: IMountedDevice[];
  selectedRU?: string;
  disabledSelectionRU?: boolean;
  handleSelectRU: (RUDetails: string, EntID?: string) => void;
  treeData?: any[];
  views?: any[];
  slots?: any[];
}

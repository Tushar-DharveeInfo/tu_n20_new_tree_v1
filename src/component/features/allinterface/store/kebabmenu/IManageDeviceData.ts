import { ISelectedNodeInfo } from "../../../../shared/allinterface/tree/ITreeControl";

type DeviceEntityType = 'floor' | 'location' | 'device';

interface IManageDeviceData {
    uniqueName?: string;
    selectedNodeInfo?: ISelectedNodeInfo;
    entityName?: string;
    entID?: string;
    headerText?: string;
};

interface ManageDeviceDataProperty {
    id: string;
    name: string;
    label: string;
    displayControl: string;
    currentValue: string;
    description?: string;
    checked?: boolean;
};

interface PgGroupApiItem {
    ID: number;
    Name: string;
    Label: string;
    Description?: string;
    SortOrder?: number;
    RequiredColumns?: string[] | string;
    RecordCount?: number;
};

interface PgGroupPropApiItem {
    ID: number;
    TableName: string;
    PropName: string;
    PropertyLabel: string;
    Description?: string;
    SortOrder?: number;
    DisplayControl?: string;
};

interface ManageDeviceDataTable {
    pgTable: string;
    label: string;
    description?: string;
    recordCount: number;
    requiredColumns: string[];
    properties: ManageDeviceDataProperty[];
};
export type {
    DeviceEntityType,
    IManageDeviceData,
    ManageDeviceDataProperty,
    PgGroupApiItem,
    PgGroupPropApiItem,
    ManageDeviceDataTable,
};

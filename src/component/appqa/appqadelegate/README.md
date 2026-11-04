# Simple Delegate to another user

## How to use this component 
- User need to use this component Delegate to another user Grid.

## Developer: TU

## Packages used for the component 
> 
> npm i ag-grid-react
> npm i ag-grid-community
> npm i @mui/material
> npm i @emotion/react
> npm i @emotion/styled
> npm i lodash
> npm i @types/lodash
> npm i date-fns



interface IDelegateToAnotherUser {
    groupName: string;
    subGroupName: string;
    selectedNodeData: ISelectedNodeInfo;
    featureId?: string;
}

interface IDelegateUser {
    _User?: string; // user name
    LoginUser?: string; // login user name 
    DelegateUserEntID: string;
    DelegateUser: string; // delegate user name
    StartDate: string;
    EndDate: string;
    EntID?: string;
    RecID?: string;
    LastUpdated?: string;
    selected: boolean; // if true then checked checkbox
    EntityName?: string;
}


interface ITreeNode {
    key: string;
    NodeEntityname: string | null;
    NodeEntID: string | null;
    stepNo: number;
    parentEntID: string | null;
    NodeState: string | null;
    Description: string | null;
    title: JSX.Element | string;
    children: ITreeNode[];
    treetype: string;
    Name: string | null;
    Type: string | null;
    icon: JSX.Element | null;
    HasChildren: number | null;
    IsNZ?: boolean;
    checkable?: boolean;
    Secured?: boolean;
    ParentEQID?: string | number;
    GroupName?: string;
    IsAuthorized?: boolean;
    IsPatchPort?: boolean;
    DCIFromSiteNode?: boolean;
    DCIToSiteNode?: boolean;
    className?: string;
    PortStatus?: string | null;
    NodeType?: string;
    ViewShortName?: string;
    SlotsNeeded?: number;
    EntityPgClass?: string;
    TableLabel?: string;
    HasRelated?: boolean;
    SubGroupEntID?: string | number;
    DeviceID?: string | number;
    EQID?: string | number;
    ShapeID?: string | number;
    disabled?: boolean;
    checkStrictly?: boolean;
    MountedDeviceEntID?: string;
    MountedDeviceViewEntID?: string;
    MountedDeviceName?: string;
    MountedDeviceDescription?: string;
    MountedDeviceHasPowerPort?: number;
    MountedDeviceHasNetworkPort?: number;
    MountedDeviceIntelDCMState?: string;
    MountedDeviceEntityName?: string;
    MountedDeviceNodeType?: string;
    isLeaf?: boolean;
    MaxInstances?: number;
    DisplayControl?: string | unknown;
    ParentName?: string;
    HasPowerPorts?: number;
    HasNetworkPorts?: number;
    PGClassName?: string;
    NaturalSortorder?: number;
    DisplayOrder?: number;
    MountPosition?: number;
    IntelDCMState?: string;
    [key: string]: string | any; // to allow dynamic properties
}

interface ISelectedNodeInfo {
    event: "select";
    selected: boolean;
    node: ITreeNode;
    selectedNodes: ITreeNode[];
    nativeEvent?: MouseEvent;
}
# sample  Data Center Hierarchy

## How to use this component : 
- To use this component user need to pass required props and set layout

## Developer: TU

## Packages used for the component 

# component:datacenterhierarchy
# types and interfaces


interface IDataCenterHierarchy {
    uniqueName: string; //uniqueName for the control and required
    selectedNodeExplorer: ISelectedNodeInfo
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
# ServiceNow control using Form Container control. 

# How to use this component 
- To use this component user need to pass required parameters and set the layout. 

## Developer: NK 
## Packages used for the component 

# component:servicenow
# types and interfaces

interface IServiceNow {
    uniqueName: string;// unique identifier for the control 
    group: string; // groupName Of selected subGroup name
    subGroup: string; // subgroup name from selected node
    selectedFeatureItem: IFeatureItem;// selected node properties 
    featureId: string;// selected feature id if required
    formControls: IControl[];// form controls to render form
    profileItems: IActionLabelItem[]; // profile Items if available else pass empty array
    allowActionList: boolean;// allow action list to show or not 
    allowAdd?: boolean;// allow add button or not
    allowDelete?: boolean;// allow delete or not
    isAutoSave?: boolean;// whether to allow auto save 
    profileString?: string;// profile string in case of edit mode if action list pane is not show
    id?: string;// if in edit mode without action list pane 
    entityName?: string;// entity name if needed
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean | undefined) => void;//if isAutoSave is true then it will be used to get updated data
    handleSaveAction?: (profileData: string, id?: string | undefined) => void;// This will be called if allowActionList===false 

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

interface IControl {
    CanChange: number; // Indicates if the property can be changed (0 = No, 1 = Yes)
    IsRequired: number; // Indicates if the property is required (0 = No, 1 = Yes)
    GroupName: string; // Name of the group the property belongs to
    GroupNameDesc: string; // Description of the group
    SubGroupEntID: string; // Unique identifier for the subgroup entity
    SubGroupName: string; // Name of the subgroup
    SubGroupNameDesc: string; // Description of the subgroup
    _AP: string; // Internal identifier or key for the property
    PropertyLabel: string; // Label to display for the property
    NameDesc: string; // Description or tooltip for the property
    DefaultAPValue: string; // Default value of the property
    Value: string | null; // Current value of the property
    ValueDesc: string; // Additional description for the value
    SortOrder: number; // Order of the property in the form
    MaxInstances: number; // Maximum number of instances allowed
    InputMask: string | null; // Input mask or reference data for the property
    RegEx: string | null; // Regular expression for validation
    DisplayGroupControl: string | null; // Display group control information
    DisplayControl: string; // Control type to display (e.g., EditTextControl, DateControl)
    ChangeEvent: string; // Event triggered when the property value changes
    Secured: boolean; // Indicates if the property is secured
    IsNZ: boolean; // Indicates if the property is specific to NZ
    EntID: string; // Unique identifier for the entity
    RecID: string; // Record identifier
    LastUpdated: string; // Last updated timestamp (ISO 8601 or standard date string format)
    EntityName: string; // Name of the entity
    Name: string; // Name of the property
    disabled: boolean; // Indicates if the property is disabled
    isNewLine?: boolean;// Indicates whether control need to render in new line or not 
}

interface IActionLabelItem {
    label: string;
    tooltip: string;
    actionCode: string;
    [key: string]: any;
}
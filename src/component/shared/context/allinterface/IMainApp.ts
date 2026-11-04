import { AuthSession } from "@n20a/libauth";
import { ISession } from "./ISession";
import { IStatusBar } from "./IStatusBar";

interface ISiteProperties {
    GroupName: string;
    _Site: string;
    Desc250: string;
    SiteType: string;
    Managed: boolean;
    Locked: boolean;
    EntID: string;
    RecID: string;
    [key: string]: string | any;
}
interface IFeatureItem {
    PopupQa?: boolean;
    MenuID: string;
    _Feature: string;
    Label: string;
    NodeType: string;
    Tooltip: string;
    FeatureTag: string;  // New property to categorize features
    SortOrder: number;
    DefaultQA: boolean;
    FilterForm: string;
    SearchPrompt: string | null;
    Secured: boolean;
    Internet?: boolean;
    PaneProps?: string;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
    Lock?: boolean;
    Alias?: string;
    [key: string]: string | any;
}

interface IApItem {
    CanChange: number;
    IsRequired: number;
    GroupName: string;
    GroupNameDesc: string;
    SubGroupEntID: string;
    SubGroupName: string;
    SubGroupNameDesc: string;
    _AP: string;
    Name: string;
    PropertyLabel: string;
    NameDesc: string;
    DefaultAPValue: string;
    Value: string;
    ValueDesc: string;
    SortOrder: number;
    MaxInstances: number;
    InputMask: string;
    RegEx: string;
    DisplayGroupControl: string;
    DisplayControl: string;
    ChangeEvent: string;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
}
interface IAlertProfileItem {
    GroupName: string;
    _AlertProfile: string;
    UserName: string;
    EscalationLevel: number;
    AttemptCount: number;
    AlertSeverity: string;
    Duration: string;
    HTML: string;
    Keywords: string;
    DateCreated: string;
    LastUpdatedBy: string;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
}

interface IApProfileItem {
    GroupName: string;
    SubGroupName: string;
    _AP: string;
    InstanceName: string;
    InstanceDesc: string;
    ProfileType: string;
    Multiple: string;
    ProfileString: string;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
    NodeType: string;
    Value?: string | any;

}

interface IFeatureForHelp {
    featureID: string;
    featureName: string;
}

interface IRefItem {
    GroupName: string;         // Name of the group to which the reference belongs
    SubGroupName: string;      // Name of the subgroup
    Name: string;              // Name of the reference item
    RefValue: string;          // Reference value
    SortOrder: number;         // Sorting order for the item
    IsNZ: boolean;             // Indicates if this is a NetZoom-related reference
    EntID: string;             // Entity ID (unique identifier)
    RecID: string;             // Record ID (unique identifier)
    LastUpdated: string;       // Timestamp of the last update
}

interface IEmItem {
    TableName: string;
    PName: string;
    RequiredToAddRecord: boolean;
    RequiredToUpdateRecord: boolean;
    DefaultValue: string;
    DisplayControl: string;
    ExcludeDataGridField?: boolean | number | string;
    NullNotAllowed?: boolean;
    [key: string]: unknown; // Allow additional properties
}

interface IUserProfileRecord {
    Email: string;
    Enabled: boolean;
    _User: string;
    Shortname: string;
    EntID: string;
    RecID: string;

    Designation?: string;
    TimeZone?: string;
    DisplayTheme?: string;
    Secured?: boolean;
    IsNZ?: boolean;
    EntityName?: string;
    NodeType?: string;
}

interface IUserAuthSession {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    authType: string;
    phoneNumber?: string;
    tenantNickname?: string;
    bid: string;
    cid: string;
}


interface IUserData extends AuthSession {
    bid: string;
    cid: string;
}

type IHierarchyFlatData = Record<string, unknown[]> | Record<string, unknown> | unknown[];

interface IAllSitesHierarchy {
    DCHierarchy?: IHierarchyFlatData;
    StoreHierarchy?: IHierarchyFlatData;
}

interface IMainApp {
    featureRecords: IFeatureItem[];
    setFeatureRecords: React.Dispatch<React.SetStateAction<IFeatureItem[]>>;

    allFeatureRecords: IFeatureItem[];
    setAllFeatureRecords: React.Dispatch<React.SetStateAction<IFeatureItem[]>>;

    apRecords: IApItem[];
    setApRecords: React.Dispatch<React.SetStateAction<IApItem[]>>;

    emRecords: IEmItem[];
    setEmRecords: React.Dispatch<React.SetStateAction<IEmItem[]>>;

    userProfileRecord?: IUserProfileRecord;
    setUserProfileRecord: React.Dispatch<React.SetStateAction<IUserProfileRecord | undefined>>;

    impUserProfileRecord?: IUserProfileRecord;
    setImpUserProfileRecord: React.Dispatch<React.SetStateAction<IUserProfileRecord | undefined>>;

    apProfileRecords: IApProfileItem[];
    setApProfileRecords: React.Dispatch<
        React.SetStateAction<IApProfileItem[]>
    >;

    alertProfileRecords: IAlertProfileItem[];
    setAlertProfileRecords: React.Dispatch<
        React.SetStateAction<IAlertProfileItem[]>
    >;

    alertRecords: Record<string, any>[];
    setAlertRecords: React.Dispatch<
        React.SetStateAction<Record<string, any>[]>
    >;

    refTableRecords: IRefItem[];
    setRefTableRecords: React.Dispatch<
        React.SetStateAction<IRefItem[]>
    >;

    apiProfileRecords: Record<string, any>[];
    setApiProfileRecords: React.Dispatch<
        React.SetStateAction<Record<string, any>[]>
    >;

    deploymentVars: Record<string, any>[];
    setDeploymentVars: React.Dispatch<
        React.SetStateAction<Record<string, any>[]>
    >;

    allSitesHierarchyRecords?: IAllSitesHierarchy;
    setAllSitesHierarchyRecords: React.Dispatch<
        React.SetStateAction<IAllSitesHierarchy | undefined>
    >;

    isInternetAvailable: boolean;
    setIsInternetAvailable: React.Dispatch<
        React.SetStateAction<boolean>
    >
    checkIsInternetAvailable: () => Promise<boolean>;

    siteProperties?: ISiteProperties;
    setSiteProperties: React.Dispatch<
        React.SetStateAction<ISiteProperties | undefined>
    >
    dciRecords?: Record<string, any>[];
    setDciRecords: React.Dispatch<
        React.SetStateAction<Record<string, any>[] | undefined>
    >
    autoExecuteWorkorder?: boolean;
    setAutoExecuteWorkorder: React.Dispatch<
        React.SetStateAction<boolean>
    >

    selectedFeatureForHelp?: IFeatureForHelp;
    setSelectedFeatureForHelp: React.Dispatch<
        React.SetStateAction<IFeatureForHelp | undefined>
    >

    userAuthSession?: IUserAuthSession;
    setUserAuthSession: React.Dispatch<
        React.SetStateAction<IUserAuthSession | undefined>
    >


    fetchFeatures: (
        statusBarContext: IStatusBar,
        sessionVars: ISession[]
    ) => void;

    fetchApRecords: (statusBarContext: IStatusBar
    ) => Promise<void>;
    fetchApProfileRecords: (statusBarContext: IStatusBar
    ) => void;
    fetchAlertProfileRecords: (statusBarContext: IStatusBar
    ) => void;
}


export type { IMainApp, IAllSitesHierarchy, IHierarchyFlatData, ISiteProperties, IUserData, IApItem, IFeatureItem, IFeatureForHelp, IApProfileItem, IAlertProfileItem, IRefItem, IEmItem, IUserProfileRecord, IUserAuthSession };

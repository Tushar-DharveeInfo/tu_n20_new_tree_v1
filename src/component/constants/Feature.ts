/*
Since all menu and features and QA and kebab menu are unique names, why not we directly use those string to filter or compare 
*/

// Appqa range for filter
const AppQARange = { MIN: 10, MAX: 99 }

// Feature Menu range for filter 
const FeatureMenuRange = { MIN: 100, MAX: 999 }

// Feature QA Range for filter 
const FeatureQARange = { MIN: 1000, MAX: 9000 }

//Appqa:Entities menu range for filter
const EntitiesTreeRange = { MIN: 9300, MAX: 9499 }

//Appqa:Settings menu range for filter
const SettingsTreeRange = { MIN: 9500, MAX: 9999 }

//Kebab menu filter range 
const KebabMenuRange = { MIN: 10000, MAX: 100000 }

// Feature Constants 
enum FEnums {
    // Home
    Dashboard = "104",            // we could directly use "Dashboard"
    SelectDataCenterSite = "106",
    AnalyticsAndCharts = "108",
    PowerBI = "110",
    // DC
    Assets = "123",
    AssetConfiguration = "126",
    AssetAssignment = "128",
    // Cabling
    ReviewPowerCabling = "153",
    EditPowerCabling = "156",
    PowerTrace = "159",
    PowerNavigate = "162",
    ReviewNetworkCabling = "165",
    EditNetworkCabling = "168",
    NetworkTrace = "171",
    NetworkNavigate = "174",
    // Plan
    EditFloorLayout = "203",
    AssetPlacement = '206',
    AssetAssignmentPlan = "208",
    Relocate = '209',
    Transfer = '212',
    Delete = '215',
    InboundAssetPlacement = "218",
    InboundAssets = "221",
    // Rack and Stack
    MoveAddChange = "253",
    ConfigureDevice = "256",
    Workorder = '262',
    // Tech Refresh
    ReplacementProfile = '282',
    Replace = '284',
    // Power
    DCMConsole = "303",
    Configure = "306",
    Discover = "309",
    Monitor = "312",
    // Store
    InventoryManagement = "353",
    InventoryConfiguration = "356",
    // Compute
    Server = "403",
    VirtualCompute = "406",
    CloudCompute = "409",
    // IT
    ModelBusinessService = "453",
    ManageBusinessService = "456",
    // Audit
    AuditSession = "603",
    InventoryCollection = "606",
    InventoryReconciliation = "609",
}

// Appqa Constants
enum AppQA {
    Face = "41",
    Help = "43",
    Settings = "42",
    Theme = "44",
    Launch = "45",
    Message = "46",
    Report = "47",
    Delegate = "91",
    Reminder = "92",
    Task = "93",
    Alerts = "94",
    Log = "95",
    Entities = "96",
    Signout = "97",
}

//Menus for appqa settings 
enum SettingGroups {
    AboutNetZoom = "About NetZoom",     //// we could directly use "About NetZoom"
    AdminConfiguration = "Admin Configuration",
    AdminScheduler = "Admin Scheduler",
    AdminTool = "Admin Tool",
    Api = "Api",
    DataCenterInterconnect = "Data Center Interconnect",
    Integration = "Integration",
    NetZoomAddon = "NetZoom Addon",
    Subscribe = "Subscribe",
    Template = "Template",
}

// Features for appqa settings 
enum SettingSubgroups {
    DCIMStatistics = "DCIM Statistics",
    Information = "Information",

    EnvNzIntHub = "env-nzinthub",
    EnvExpApi = "env-expapi",
    EnvDcmListener = "env-dcmlistener",
    Configure = "Configure",
    ServiceCharges = "Service Charges",

    SchedulePurge = "Schedule Purge",
    ScheduleReportDelivery = "Schedule Report Delivery",
    ScheduleAlertDelivery = "Schedule Alert Delivery",
    ScheduleSQLJob = "Schedule SQLJob",
    ScheduleWindowsService = "Schedule Windows Service",
    ScheduleDataArchive = "Schedule Data Archive",
    ScheduleDailyTasks = "Schedule Daily Tasks",
    ScheduleDCMReading = "Schedule DCM Reading",


    OptimizeNetZoom = "Optimize NetZoom",
    StartNetZoom = "Start NetZoom",
    StopNetZoom = "Stop NetZoom",
    MigrateVersion18 = "Migrate Version 18",
    ServerStatus = "Server Status",

    Api = "Api",

    DataCenterInterconnect = "Data Center Interconnect",

    AIGemini = "AIGemini",
    SMTPServer = "SMTP Server",
    CloudAWS = "CloudAWS",
    CloudAzure = "CloudAzure",
    CloudGoogle = "CloudGoogle",
    DCM = "DCM",
    DeviceLibrary = "DeviceLibrary",
    GoogleMap = "GoogleMap",
    HyperV = "HyperV",
    MSSQL = "MSSQL",
    PowerBI = "PowerBI",
    ServiceNow = "ServiceNow",
    Twilio = "Twilio",
    vSphere = "vSphere",
    Workday = "Workday",
    MobileApp = "Mobile App",
    OfficeAddin = "Office Addin",
    VisioStencilShapeOptions = "Visio Stencil Shape Options",

    Alert = "Alert",
    Report = "Report",
    DeliveryStatus = "Delivery Status",

    BroadcastTemplate = "Broadcast Template",
    ChartTemplate = "Chart Template",
    BackgroundTaskProfile = "Background Task Profile",
    CustomIDTemplate = "CustomID Template",
    ReportTemplate = "Report Template",
    WatermarkTemplate = "Watermark Template",

    RequestSupport = "Request Support",
}

// Menus for appqa entites 
enum EntitesGroups {
    User = "User",
    Role = "Role",
    Tenant = "Tenant",
    Team = "Team",
    Tag = "Tag",
    Vendor = "Vendor",
    CloudProvider = "Cloud Provider",
    Site = "Site",
    CableEntity = "Cable Entity",
    DeviceEntity = "Device Entity",
    NetZoomEntity = "NetZoom Entity",
    ManageEntityTables = "Manage Entity Tables",
    ValidateXlsx = "Validate xlsx"
}

// Features for appqa entities 
enum EntitiesSubGroups {
    EditCableEntityMapping = "Edit Cable Entity Mapping",
    ExportCableEntity = "Export Cable Entity",
    ImportCableEntity = "Import Cable Entity",
    EditDeviceEntityMapping = "Edit Device Entity Mapping",
    ExportDeviceEntity = "Export Device Entity",
    ImportDeviceEntity = "Import Device Entity",
    EditNetZoomEntityMapping = "Edit NetZoom Entity Mapping",
    ExportNetZoomEntity = "Export NetZoom Entity",
    ImportNetZoomEntity = "Import NetZoom Entity",
    ImportNewTablesAndProperties = "Import New Tables and Properties",
    PurgeEntityDataTable = "Purge Entity Data Table",
    ValidateXlsx = "Validate xlsx",
    DataCenterHierarchy = "Data Center Hierarchy",
    InventoryStoreAndBins = "Inventory Store and Bins",
    ManageTenant = "Manage Tenant",
    ManageTeam = "Manage Team",
    ManageTag = "Manage Tag",
    ManageCloudProvider = "Manage Cloud Provider",
    ManageVendor = "Manage Vendor",
    ManageUser = "Manage User",
    ManageRole = "Manage Role",
    AuthorizeUser = "Authorize User",
    AuthorizeTeam = "Authorize Team",
    AuthorizeTenant = "Authorize Tenant",
    AuthorizeRole = "Authorize Role",
    ManageLicense = "Manage License",
    AssetAssignment = "Asset Assignment"
}

enum SidebarEnum {
    Property = "Property",
    Log = "Log",
    Notes = "Notes",
    Alerts = "Alerts",
    ActionLog = "ActionLog",
    Assign = "Assign",
    Profile = "Profile",
    AddNewAuditSession = "Add New Audit Session",
    AddNewBusinessService = "Add New Business Service",
    Device = "Device"
}

// Kebab menus for tree 
enum RightMouseMenuTreeNode {
    SortAtoZ = "Sort A-Z",
    SortZtoA = "Sort Z-A",
    Refresh = "Refresh",
    OrderSubnodesAsc = "Order Subnodes Asc",
    DoNotOrderSubnodes = "Do not Order Subnodes",
    FindInInventory = "Find in Inventory",
    FindInPhysicalCompute = "Find in Physical Compute",
    Copy = "Copy",
    Paste = "Paste",
    Cut = "Cut",
    Delete = "Delete",
    Remove = "Remove",
    RemoveCable = "Remove Cable",
    MoveUp = "Move Up",
    MoveDown = "Move Down",
    Export = "Export Properties",
    UpdateProperties = 'Update Properties',
    ImportPowerCables = "Import Power Cables",
    ImportNetworkCables = "Import Network Cables",
    ExportNetworkCables = "Export Network Cables",
    ExportPowerCables = "Export Power Cables",
    OrderSubnodes = "Order Subnodes Asc",
    DonotOrderSubnodes = "Do not Order Subnodes",
    SetProperty = "Set Property",
    AddToCabling = "Add to Cabling",
    EditPowerCabling = "Edit Power Cabling",
    EditNetworkCabling = "Edit Network Cabling",
    ReviewNetworkCabling = "Review Network Cabling",
    ReviewPowerCabling = "Review Power Cabling",
    ImportDevices = "Import Devices",
    ExportDevices = "Export Devices",
    BlockAll = "Block All",
    unblockAll = "Unblock All",
    NormalSlot = "Normal SLOT",
    BlockSlot = "Block SLOT",
    ReserveSlot = "Reserve SLOT",
    NormalRU = "Normal RU",
    BlockRU = "Block RU",
    ReserveRU = "Reserve RU",
    EmptyDevice = "Empty Device",
    EmptyRack = `Empty Rack`,
    SwapDeviceViews = "Swap Device Views",
    NormalPort = "Normal Port",
    BlockPort = "Block Port",
    ReservePort = "Reserve Port",
    BADPort = "BAD Port",
    AddNewAuditSession = "Add New Audit Session",
    PreviewAuditInventory = "Preview Audit Inventory",
    Add = "Add",
    Approve = "Approve",
    Unapprove = "Unapprove",
    Execute = "Execute",
    Reject = "Reject",
    Open = "Open",
    Close = "Close",
    Accept = "Accept",
    ImportAuditInventory = "Import",
    ExportAuditInventory = "Export",
    Snapshot = "Snapshot",
    AddRoom = "Add Room",
    AddFloor = "Add Floor",
    AddNewSiteDataCenter = "Add New Data Center Site",
    AddBin = "Add Bin",
    EmptySiteDataCenter = "Empty Data Center Site",
    DeleteSiteDataCenter = "Delete Data Center Site",
    EmptyFloor = "Empty Floor",
    EmptyBin = "Empty Bin",
    EmptyStore = "Empty Store",
    DeleteFloor = "Delete Floor",
    DeleteRoom = "Delete Room",
    EmptyRoom = "Empty Room",
    DeleteBin = "Delete Bin",
    AddNewBusinessService = "Add New Business Service",
    AddDCISegment = "Add DCI Segment",
    DeleteDCISegment = "Delete DCI Segment",
    addDCI = "Add DCI",
    DeleteDCI = "Delete DCI",
    DisconnectCable = "Disconnect Cable",
    DisconnectPort = "Disconnect Port",
    HideAll = "Hide All",
    UnhideAll = "Unhide All",
    PushUp = "Push Up",
    PushDown = "Push Down",
    MapPorts = "Map Ports",
    Info = "Info",
    ImportDevicesToInventory = "Import Devices to Inventory",
    EditFloorLayout = "Edit Floor Layout",
    Charts = "Charts",
    CopyHyperlink = "Copy Hyperlink",
    DeleteBusinessService = "Delete Business Service",
    DeleteLink = "Delete Link",
    AddGroup = "Add Group",
    AddText = "Add Text",
    AddImage = "Add Image",
    AddChart = "Add Chart",
    AddTable = "Add Table",
    AddHSpace = "Add HSpace",
    AddVSpace = "Add VSpace",
    DeleteGroup = "Delete Group",
    AddColumn = "Add Column",
    AddLocation = "Add Location",
    AddRect = "Add Rect",
    AddCircle = "Add Circle",
    DeleteLocation = "Delete Location",
    SaveAs = "Save As",
    SelectInDCExplorer = "Select in DC explorer",
    DeleteAll = "Delete All",
    Discover = "Discover",
    ReDiscover = "ReDiscover",
    FindDataCenterInterconnect = "Find Data Center Interconnect",
    CloseSession = "CloseSession",
    Monitor = "Monitor",
    ResetToDiscover = "Reset to Discover",
    UpdateAggregates = "Update Aggregates",
    EmptyFloorLocation = "Empty Floor Location",
    ExportNetworkCabling = "Export Network Cabling",
    ExportPowerCabling = "Export Power Cabling",
    ImportNetworkCabling = "Import Network Cabling",
    ImportPowerCabling = "Import Power Cabling",
    DisposeAll = "Dispose All",
    DoNotMonitor = "Do Not Monitor",
    RecreateLayout = "Recreate Layout",
    DeleteFromLayout = "Delete from Layout",
    ManageDeviceData = "Manage Device Data",
    ClearWatermark = "Clear Watermark",
    ClearWatermarkforSubnodes = "Clear Watermark for Subnodes",
    Recalculate = "Recalculate",
}

// Kebab menus on Grid 
enum RightMouseMenuGrid {
    Refresh = "Refresh",
    Accept = "Accept",
    Reject = "Reject",
    Delete = "Delete",
    Snapshot = "Snapshot",
    Match = "Match",
    Move = "Move",
    New = "New",
    Missing = "Missing",
    Close = "Close",
    Reopen = "Reopen",
    LowerPriority = "Lower Priority",
    RaisePriority = "Raise Priority",
    Suspend = "Suspend",
    Kill = "Kill",
    OSResume = "Resume",
    OSClose = "Close",
    OSPause = "Pause",
    WSPause = "Pause",
    WSStop = "Stop",
    WSStart = "Start",
    SQLJobStart = "Start",
    SQLJobStop = "Stop",
    SQLJobDelete = "Delete",
    SQLJobStartAll = "Start All",
    SQLJobStopAll = "Stop All",
    SQLJobDeleteAll = "Delete All",
    EditWaypoints = "Edit Waypoints",
    Discard = "Discard",
    FindInSite = "Find in Site"
}

export {
    FEnums, FeatureMenuRange, AppQA, AppQARange
    , SettingGroups, SettingSubgroups
    , EntitesGroups, EntitiesSubGroups
    , SettingsTreeRange, EntitiesTreeRange
    , FeatureQARange
    , SidebarEnum
    , RightMouseMenuTreeNode
    , RightMouseMenuGrid
    , KebabMenuRange
}

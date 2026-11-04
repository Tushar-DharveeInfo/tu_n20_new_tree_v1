import { SettingSubgroups } from "../../../constants/Feature"
import { FnGenerateUID } from "../../allcommon/settingsform/FnGenerateUID"


enum PowerConfigureGroup {
    DiscoveryAndMonitoring = "Discovery and Monitoring"
}
enum PowerConfigureSubGroup {
    DeviceHealth = "Device Health",
    StepTwoOutbandIcmp = "Step-2, Outband (ICMP) Discovery Profiles",
    StepTwoOutbandSsh = "Step-2, Outband (SSH) Discovery Profiles",
    StepTwoOutbandWsman = "Step-2, Outband (WSMAN) Discovery Profiles",

    SetInbandIcmpDiscoveryProfiles = "Set Inband (ICMP) Discovery Profiles",
    SetInbandTcpDiscoveryProfiles = "Set Inband (TCP) Discovery Profiles",
    SetInbandWmiDiscoveryProfiles = "Set Inband (WMI) Discovery Profiles",
    SetOutbandIpmiDiscoveryProfiles = "Set Outband (IPMI) Discovery Profiles",
    SetOutbandSnmpDiscoveryProfiles = "Set Outband (SNMP) Discovery Profiles",
    SetOutbandSnmpv3DiscoveryProfiles = "Set Outband (SNMPv3) Discovery Profiles",
    SelectDeviceEventsAndAlerts = "Select Device Events and Alerts",
    SelectPredefinedEventsAndAlerts = "Select Predefined Events and Alerts",
    SetDcmInstanceAndItsCredentials = "Set DCM Instance and its Credentials"
}

const PowerConfigureWithoutProfile = [
    PowerConfigureSubGroup.DeviceHealth.toString(),
    PowerConfigureSubGroup.SelectPredefinedEventsAndAlerts.toString(),
    PowerConfigureSubGroup.SetDcmInstanceAndItsCredentials.toString()
]

const PowerConfigureWithProfile = [
    PowerConfigureSubGroup.SetInbandIcmpDiscoveryProfiles.toString(),
    PowerConfigureSubGroup.SetInbandTcpDiscoveryProfiles.toString(),
    PowerConfigureSubGroup.SetInbandWmiDiscoveryProfiles.toString(),
    PowerConfigureSubGroup.StepTwoOutbandIcmp.toString(),
    PowerConfigureSubGroup.SetOutbandIpmiDiscoveryProfiles.toString(),
    PowerConfigureSubGroup.SetOutbandSnmpDiscoveryProfiles.toString(),
    PowerConfigureSubGroup.SetOutbandSnmpv3DiscoveryProfiles.toString(),
    PowerConfigureSubGroup.StepTwoOutbandSsh.toString(),
    PowerConfigureSubGroup.StepTwoOutbandWsman.toString(),
    PowerConfigureSubGroup.SelectDeviceEventsAndAlerts.toString()
]

const SettingWithoutProfile = [
    SettingSubgroups.DCIMStatistics.toString(),
    SettingSubgroups.Information.toString(),
    SettingSubgroups.MobileApp.toString(),
    SettingSubgroups.OfficeAddin.toString(),
    SettingSubgroups.Configure.toString(),
    SettingSubgroups.ServiceCharges.toString(),
    SettingSubgroups.VisioStencilShapeOptions.toString(),
    SettingSubgroups.ScheduleDataArchive.toString(),
    SettingSubgroups.SchedulePurge.toString(),
    SettingSubgroups.ScheduleReportDelivery.toString(),
    SettingSubgroups.ScheduleWindowsService.toString()
]

const SettingWithProfile = [
    SettingSubgroups.BroadcastTemplate.toString(),
    SettingSubgroups.AIGemini.toString(),
    SettingSubgroups.SMTPServer.toString(),
    SettingSubgroups.CloudAWS.toString(),
    SettingSubgroups.CloudAzure.toString(),
    SettingSubgroups.CloudGoogle.toString(),
    SettingSubgroups.DCM.toString(),
    SettingSubgroups.DeviceLibrary.toString(),
    SettingSubgroups.GoogleMap.toString(),
    SettingSubgroups.HyperV.toString(),
    SettingSubgroups.PowerBI.toString(),
    SettingSubgroups.ServiceNow.toString(),
    SettingSubgroups.Twilio.toString(),
    SettingSubgroups.vSphere.toString(),
    SettingSubgroups.Workday.toString(),
    SettingSubgroups.MSSQL.toString(),
    SettingSubgroups.ScheduleSQLJob.toString(),
    SettingSubgroups.CustomIDTemplate.toString(),
    SettingSubgroups.WatermarkTemplate.toString(),
]

const SettingForTreeForm = [
    SettingSubgroups.Report.toString(),
    SettingSubgroups.Alert.toString(),
    SettingSubgroups.ChartTemplate.toString(),
    SettingSubgroups.ReportTemplate.toString(),
]

const SettingForIntegration = [
    SettingSubgroups.AIGemini.toString(),
    SettingSubgroups.SMTPServer.toString(),
    SettingSubgroups.CloudAWS.toString(),
    SettingSubgroups.CloudAzure.toString(),
    SettingSubgroups.CloudGoogle.toString(),
    SettingSubgroups.DCM.toString(),
    SettingSubgroups.DeviceLibrary.toString(),
    SettingSubgroups.GoogleMap.toString(),
    SettingSubgroups.HyperV.toString(),
    SettingSubgroups.PowerBI.toString(),
    SettingSubgroups.ServiceNow.toString(),
    SettingSubgroups.Twilio.toString(),
    SettingSubgroups.vSphere.toString(),
    SettingSubgroups.Workday.toString(),
    SettingSubgroups.MSSQL.toString()
]

const SettingForEntityForm = [
    SettingSubgroups.Api.toString(),
    SettingSubgroups.BackgroundTaskProfile.toString()
]

const SettingHeaderNotRequired = [
    SettingSubgroups.DataCenterInterconnect.toString()
]

enum RtmLabelForDataCenterHirerarchy {
    AddRoom = 'Add Room',
    AddNewDataCenterSite = 'Add New Data Center Site',
    AddFloor = 'Add Floor',
    EmptyDataCenterSite = 'Empty Data Center Site',
    DeleteDataCenterSite = 'Delete Data Center Site',
    EmptyRoom = 'Empty Room',
    DeleteRoom = 'Delete Room',
    EmptyFloor = 'Empty Floor',
    DeleteFloor = 'Delete Floor',
    EmptyStore = 'Empty Store',
    AddBin = "Add Bin",
    EmptyBin = 'Empty Bin',
    DeleteBin = 'Delete Bin',
    Refresh = 'Refresh'
}

enum RtmLabelForDCI {
    AddDCI = "Add DCI",
    DeleteDciSegment = "Delete DCI Segment"
}

enum EntityNameEnums {
    ReportProfile = "ReportProfile",
    AlertProfile = "AlertProfile",
    AuditSession = "AuditSession",
    AP = "AP",
    Room = "Room",
    Site = "Site",
    Floor = "Floor",
    Bin = "Bin",
    BS = "BS",
    DCI = "DCI",
    Role = "Role",
    LayoutFilterProfile = 'LayoutFilterProfile',
    ChartProfile = 'ChartProfile',
    ApiProfile = "ApiProfile",
    BackgroundTaskProfile = "BackgroundTaskProfile",
    User = "User",
    Partner = "Partner",
    NZLicenseKey = "NZLicenseKey",
    WorkorderProfile = "WorkorderProfile",
    Location = "Location"
}

const RootNode = {
    EntID: FnGenerateUID(),
    Name: "NetZoom Settings",
    Description: "NetZoom Settings",
    NodeType: "Helptip",
    HasChildren: 1,
    children: undefined,
}
enum FeatureState {
    Stopped = -1,
    Running = 0,
    Paused = 1,
}

enum SettingsIntegrationFormUniquName {
    AiGemini = "aigemini",
    CloudAws = "cloudaws",
    CloudAzure = "cloudazure",
    CloudGoogle = "cloudgoogle",
    DbMail = "dbmail",
    Dcm = "dcm",
    DeviceLibrary = "devicelibrary",
    GoogleMap = "googlemap",
    HyperV = "hyperv",
    MSSQL = "mssql",
    PowerBi = "powerbi",
    ServiceNow = "servicenow",
    Twilio = "twilio",
    Vsphere = "vsphere",
    Workday = "workday",
}

enum FileGroupNameEnums {
    Icon = "Icon",
    Report = "Report",
    WM = "WM",
    Other = "Other"
}

enum SettingApNames {
    HideFloorLayout = "HideFloorLayout",
    DateFormat = "DateFormat",
    DiagnosticLevel = "DiagnosticLevel",
    Measurement = "Measurement",
    DisplayTheme = "DisplayTheme",
    HelpTip = "HelpTip",
    maxAudioRecordingTime = "maxAudioRecordingTime",
    maxVideoRecordingTime = "maxVideoRecordingTime",
    Whatsnew = "Whatsnew"
}

const SettingsToggleControl = {
    Enabled: "Enabled"
}
export {
    SettingWithoutProfile, SettingWithProfile, SettingForTreeForm
    , RtmLabelForDataCenterHirerarchy
    , RtmLabelForDCI
    , EntityNameEnums
    , RootNode
    , SettingHeaderNotRequired
    , FeatureState
    , SettingsIntegrationFormUniquName,
    FileGroupNameEnums,
    PowerConfigureSubGroup,
    PowerConfigureGroup,
    PowerConfigureWithProfile,
    PowerConfigureWithoutProfile,
    SettingForEntityForm,
    SettingForIntegration,
    SettingApNames,
    SettingsToggleControl,
}

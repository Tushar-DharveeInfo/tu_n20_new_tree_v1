import { AppQA, FEnums } from "../../constants/Feature"

enum DropableControlElementEnums {
    SiteName = "_Site",
    RoomName = "_Room",
    FloorName = "_Floor",
    LocationName = "_Location",
    DeviceName = "_Device"
}

enum deviceModelTabs {
    Search = "Search",
    Property = "Property",
    Related = "Related",
    Result = "Result"
}

const HomeMenus = [
    FEnums.Dashboard.toString(),
    FEnums.SelectDataCenterSite.toString(),
    FEnums.AnalyticsAndCharts.toString(),
    FEnums.PowerBI.toString()
]

const FeaturesThatAllowsPropertyChange = [
    AppQA.Settings
    , AppQA.Entities
    , FEnums.AuditSession
    , FEnums.ModelBusinessService
    , FEnums.ManageBusinessService] as string[];
export { DropableControlElementEnums, deviceModelTabs, HomeMenus, FeaturesThatAllowsPropertyChange }
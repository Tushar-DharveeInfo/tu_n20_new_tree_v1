import { EntitesGroups, EntitiesSubGroups, FEnums, SettingGroups, SettingSubgroups } from "../../constants/Feature";

interface IFeaturePermission {
    AppQAName: string;
    AppQAMenuName: string;
    AppQAFeatureName: string;
}

const editableEntityPermissions: IFeaturePermission[] = [
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.User,
        AppQAFeatureName: EntitiesSubGroups.ManageUser
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.User,
        AppQAFeatureName: EntitiesSubGroups.AuthorizeUser
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Role,
        AppQAFeatureName: EntitiesSubGroups.ManageRole
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Role,
        AppQAFeatureName: EntitiesSubGroups.AuthorizeRole
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Tenant,
        AppQAFeatureName: EntitiesSubGroups.ManageTenant
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Tenant,
        AppQAFeatureName: EntitiesSubGroups.AuthorizeTenant
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Team,
        AppQAFeatureName: EntitiesSubGroups.ManageTeam
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Team,
        AppQAFeatureName: EntitiesSubGroups.AuthorizeTeam
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Tag,
        AppQAFeatureName: EntitiesSubGroups.ManageTag
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Vendor,
        AppQAFeatureName: EntitiesSubGroups.ManageVendor
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.CloudProvider,
        AppQAFeatureName: EntitiesSubGroups.ManageCloudProvider
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Site,
        AppQAFeatureName: EntitiesSubGroups.DataCenterHierarchy
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.Site,
        AppQAFeatureName: EntitiesSubGroups.InventoryStoreAndBins
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.CableEntity,
        AppQAFeatureName: EntitiesSubGroups.EditCableEntityMapping
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.CableEntity,
        AppQAFeatureName: EntitiesSubGroups.ExportCableEntity
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.CableEntity,
        AppQAFeatureName: EntitiesSubGroups.ImportCableEntity
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.DeviceEntity,
        AppQAFeatureName: EntitiesSubGroups.EditDeviceEntityMapping
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.DeviceEntity,
        AppQAFeatureName: EntitiesSubGroups.ExportDeviceEntity
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.DeviceEntity,
        AppQAFeatureName: EntitiesSubGroups.ImportDeviceEntity
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.NetZoomEntity,
        AppQAFeatureName: EntitiesSubGroups.EditNetZoomEntityMapping
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.NetZoomEntity,
        AppQAFeatureName: EntitiesSubGroups.ExportNetZoomEntity
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.NetZoomEntity,
        AppQAFeatureName: EntitiesSubGroups.ImportNetZoomEntity
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.ManageEntityTables,
        AppQAFeatureName: EntitiesSubGroups.ImportNewTablesAndProperties
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.ManageEntityTables,
        AppQAFeatureName: EntitiesSubGroups.PurgeEntityDataTable
    },
    {
        AppQAName: "Entities",
        AppQAMenuName: EntitesGroups.ValidateXlsx,
        AppQAFeatureName: EntitiesSubGroups.ValidateXlsx
    },
    {
        AppQAName: "Settings",
        AppQAMenuName: SettingGroups.Api,
        AppQAFeatureName: SettingSubgroups.Api
    },
    {
        AppQAName: "Settings",
        AppQAMenuName: SettingGroups.Template,
        AppQAFeatureName: SettingSubgroups.BackgroundTaskProfile
    }
];

const editableFeaturePermissions: string[] = [
    "Configure Device",
    "Move Add Change",
    "Inventory Management",
    "Inventory Configuration",
    "Edit Floor Layout"
]

const FnCheckPermissionToEditName = (
    session: IFeaturePermission | string,
    isFeature?: boolean
): boolean => {
    if (isFeature && typeof session === "string") {
        return editableFeaturePermissions.includes(session)
    }
    else {
        return editableEntityPermissions.some(permission =>
            permission.AppQAName === (session as IFeaturePermission).AppQAName &&
            (permission.AppQAMenuName === "" ||
                permission.AppQAMenuName === (session as IFeaturePermission).AppQAMenuName) &&
            (permission.AppQAFeatureName === "" ||
                permission.AppQAFeatureName === (session as IFeaturePermission).AppQAFeatureName)
        );
    }
};

export { FnCheckPermissionToEditName };
export type { IFeaturePermission }
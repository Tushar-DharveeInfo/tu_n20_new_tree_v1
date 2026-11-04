
const SESSION_API_URL = `/session`;
const FEATURE_API_URL = `/feature`;
const EM_API_URL = `/em`;
const NODE_API_URL = `/node`;
const FS_API_URL = `/fs`;
const EXPLORER_API_URL = `/explorer`;
const MISC_API_URL = `/misc`;
const AP_API_URL = `/ap`;
const POWERBI_API_URL = `/powerbi`;
const INTEGRATION_API_URL = `/integration`;
const TWILIO_API_URL = `/twilio`;
const HYPERV_API_URL = `/hyperv`;
const PROPERTY_API_URL = `/property`;
const TQ_API_URL = `/tq`;
const WINSVC_API_URL = `/winsvc`;
const DATAGRID_API_URL = `/datagrid`;
const SQLJOB_API_URL = `/sqljob`;
const DC_API_URL = `/dc`;
const LOG_API_URL = `/log`;
const HWENTITY_API_URL = `/hwentity`;
const LIBRARY_API_URL = `/library`;
const NZENTITY_API_URL = `/nzentity`;
const DCI_API_URL = `/dci`;
const ALERT_API_URL = `/alert`;
const DELEGATE_API_URL = `/delegate`;
const AUTH_API_URL = `/auth`;
const TENANT_API_URL = `/tenant`;
const DEVICE_API_URL = `/device`;
const TASK_API_URL = `/task`;
const REPORTPROFILE_API_URI = `/reportprofile`
const CDN_API_URI = `/cdn`
const CABLING_API_URI = `/cabling`
const VIRTUAL_API_URI = `/virtual`
const CLOUD_API_URI = `/cloud`
const BS_API_URI = `/bs`
const AUDIT_API_URI = `/audit`
const LIB_API_URL = `/lib`;
const DEVICEMODEL_API_URL = `/devicemodel`
const STATS_API_URL = '/stats'
const PURGE_API_URL = '/purge'
const REMINDER_API_URL = '/reminder'
const CHART_URL = '/chart'
const ASK_URL = '/ask'
const INTEL_URL = '/intel'
const KWD_URL = '/kwd'

export const ASK = {
    SiteDataset: `${ASK_URL}/site_dataset`,
    FloorDataset: `${ASK_URL}/floor_dataset`,
    DeviceDataset: `${ASK_URL}/device_dataset`,
}
export const DEVICEMODEL = {
    GetMfg: `${DEVICEMODEL_API_URL}/get_mfg`,
    GetEqtype: `${DEVICEMODEL_API_URL}/get_eqtype`,
    GetProductno: `${DEVICEMODEL_API_URL}/get_prodno`,
    GetFilteredDevices: `${DEVICEMODEL_API_URL}/get_filtered_devices`,
    GetPropertiesForDeviceid: `${DEVICEMODEL_API_URL}/get_properties_for_deviceid`,
    GetRelatedForFilteredDevice: `${DEVICEMODEL_API_URL}/get_related_for_filtered_device`,
    GetDeviceModelViews: `${DEVICEMODEL_API_URL}/get_devicemodel_views`,
    GetDeviceModelSvg: `${DEVICEMODEL_API_URL}/get_devicemodel_svg`,

    GetMfgNew: `${DEVICEMODEL_API_URL}/get_mfg_new`,
    GetDeviceDetailsForMfg: `${DEVICEMODEL_API_URL}/get_device_details_for_mfg`,
    GetDeviceDetails: `${DEVICEMODEL_API_URL}/get_device_details`,
    GetSearchData: `${DEVICEMODEL_API_URL}/get_search_data`,
}
export const CHART = {
    GetData: `${CHART_URL}/get_data`
}
export const SESSION = {
    CreateSession: `${SESSION_API_URL}/create_session`,
    GetSessionVariables: `${SESSION_API_URL}/get_session_variables`,
    CloseSession: `${SESSION_API_URL}/close_session`,
    IsSessionOpen: `${SESSION_API_URL}/is_session_open`,
    UpdateSession: `${SESSION_API_URL}/update_session`,
    GetOpenSession: `${SESSION_API_URL}/get_open_sessions`,
    ResumeSession: `${SESSION_API_URL}/resume_session`,
    PauseSession: `${SESSION_API_URL}/pause_session`,
    ValidateLicense: `${SESSION_API_URL}/validate_license`,
    InitSession: `${SESSION_API_URL}/init_session`
}

export const LIB = {
    GetManufacturers: `${LIB_API_URL}/get_manufacturers`,
    GetMfgSubsets: `${LIB_API_URL}/get_mfg_subsets`,
    GetSearchResults: `${LIB_API_URL}/get_search_results`,
    GetDetails: `${LIB_API_URL}/get_details`,
    GetShapeViews: `${LIB_API_URL}/get_shape_views`,
}
export const CABLING = {
    ImportCables: `${CABLING_API_URI}/import_cables`,
    ImportCable: `${CABLING_API_URI}/import_cable`,
    GetCablesForPortMapping: `${CABLING_API_URI}/get_cables_for_port_mapping`,
    GetPortsForMapping: `${CABLING_API_URI}/get_ports_for_mapping`,
    SetPortStatus: `${CABLING_API_URI}/set_port_status`,
    DeleteInternalConnection: `${CABLING_API_URI}/delete_internal_connection`,
    SetInternalConnection: `${CABLING_API_URI}/set_internal_connection`,
    GetCables: `${CABLING_API_URI}/get_cables`,
    GetCabling: `${CABLING_API_URI}/get_cabling`,
    GetDevicePort: `${CABLING_API_URI}/get_device_ports`,
    GetCablesWithPort: `${CABLING_API_URI}/get_cables_with_ports`,
    CloneCable: `${CABLING_API_URI}/clone_cable`,
    AddUpdateConnection: `${CABLING_API_URI}/add_update_connection`,
    DeleteConnection: `${CABLING_API_URI}/delete_connection`,
    DeleteDeviceConnections: `${CABLING_API_URI}/delete_device_connections`,
    GetNetworkTraceData: `${CABLING_API_URI}/get_network_trace_data`,
    GetPowerTraceData: `${CABLING_API_URI}/get_power_trace_data`,
    GetConnectionForPort: `${CABLING_API_URI}/get_connection_for_port`,
    GetConnectivity: `${CABLING_API_URI}/get_connectivity`,
    AddCableFromLibrary: `${CABLING_API_URI}/add_cable_from_library`,
    ValidateInput: `${CABLING_API_URI}/validate_input`,
    ExportCabling: `${CABLING_API_URI}/export_cabling`,
    ImportCabling: `${CABLING_API_URI}/import_cabling`,
    ValidateCabling: `${CABLING_API_URI}/validate_cabling`
}
export const CDN = {
    GetPublicFile: `${CDN_API_URI}/get_public_file`
}
export const FEATURE = {
    GetFeatures: `${FEATURE_API_URL}/get_features`,
}
export const DEVICE = {
    ValidateInput: `${DEVICE_API_URL}/validate_input`,
    ImportMounting: `${DEVICE_API_URL}/import_mounting`,
    SetPasteSource: `${DEVICE_API_URL}/set_paste_source`,
    DeleteDevice: `${DEVICE_API_URL}/delete_device`,
    EmptyDevice: `${DEVICE_API_URL}/empty_device`,
    EmptyRack: `${DEVICE_API_URL}/empty_rack`,
    BlockAvailableRus: `${DEVICE_API_URL}/block_available_rus`,
    MoveUpdownMountedDevice: `${DEVICE_API_URL}/move_updown_mounted_device`,
    SwapviewMountedDevice: `${DEVICE_API_URL}/swapview_mounted_device`,
    AddDeviceFromLibrary: `${DEVICE_API_URL}/add_device_from_library`,
    AddMounteddeviceFromLibrary: `${DEVICE_API_URL}/add_mounteddevice_from_library`,
    MoveFloorToSlot: `${DEVICE_API_URL}/move_floor_to_slot`,
    MoveFloorDevices: `${DEVICE_API_URL}/move_floor_devices`,
    MoveMountedDeviceToSlot: `${DEVICE_API_URL}/move_mounted_device_to_slot`,
    GetSvgdata: `${DEVICE_API_URL}/get_svgdata`,
    Paste: `${DEVICE_API_URL}/paste`,
    Unmount: `${DEVICE_API_URL}/unmount`,
    GetSvgdatanew: `${DEVICE_API_URL}/get_svgdatanew`,
    SetSlotStatus: `${DEVICE_API_URL}/set_slot_status`,
    DeleteAllChildren: `${DEVICE_API_URL}/delete_all_children`,
    AssignmentArray: `${DEVICE_API_URL}/assignment_array`,
    PartnerArray: `${DEVICE_API_URL}/partner_array`,
    ClearWoid: `${DEVICE_API_URL}/clear_woid`,
    AssetsForBin: `${DEVICE_API_URL}/assets_for_bin`,
    ExecuteWorkorder: `${DEVICE_API_URL}/execute_workorder`,
    WorkorderDetails: `${DEVICE_API_URL}/workorder_details`,
    Recalculate: `${DEVICE_API_URL}/recalculate`
}
export const EM = {
    GetEntityRecords: `${EM_API_URL}/get_entity_records`,
    GetPgGroups: `${EM_API_URL}/get_pggroups`,
    GetPgGroupProps: `${EM_API_URL}/get_pggroupprops`,
    GetNzpgRecords: `${EM_API_URL}/get_nzpg_records`,
    GetFilteredTableRecord: `${EM_API_URL}/get_filtered_table_record`,
    GetTableVsProperty: `${EM_API_URL}/get_table_vs_property`,
    UpdateTableRecord: `${EM_API_URL}/update_table_record`,
    AddTableRecord: `${EM_API_URL}/add_table_record`,
    DeleteTableRecords: `${EM_API_URL}/delete_table_records`,
    AddEntityRecords: `${EM_API_URL}/add_entity_records`,
    CreateDefaultSiteHierarchy: `${EM_API_URL}/create_default_site_hierarchy`,
    DeleteEntityRecords: `${EM_API_URL}/delete_entity_records`,
    GetAllEntities: `${EM_API_URL}/get_all_entities`,
    UpdateEntityRecords: `${EM_API_URL}/update_entity_records`,
    GetEntityVsTable: `${EM_API_URL}/get_entity_vs_table`,
    GetEntityRecordsForExport: `${EM_API_URL}/get_entity_records_for_export`,
    DownloadProps: `${EM_API_URL}/download_props`,
    UpdateRecordCount: `${EM_API_URL}/update_record_count`,
    ValidateTableAndPropertyImport: `${EM_API_URL}/validate_table_and_property_import`,
    ImportTablesAndProperties: `${EM_API_URL}/import_tables_and_properties`,
    GetFieldList: `${EM_API_URL}/get_field_list`,
    ValidateEntitySheet: `${EM_API_URL}/validate_entity_sheet`,
    ImportEntitySheet: `${EM_API_URL}/import_entity_sheet`,
    GetAllTablesRecord: `${EM_API_URL}/get_all_tables_record`,
    GetTableRecord: `${EM_API_URL}/get_table_record`,
    AddUpdateTableRecord: `${EM_API_URL}/add_update_table_record`,
    AddUpdateMultipleTableRecords: `${EM_API_URL}/add_update_multiple_table_records`,
    GetEntityDiagramData: `${EM_API_URL}/get_entity_diagram_data`
};
export const NODE = {
    GetKebabMenuData: `${NODE_API_URL}/get_kebab_menu_data`,
    UpdateNodePathForHierarchy: `${NODE_API_URL}/update_node_path_for_hierarchy`,
}

export const MISC = {
    GetAllReminders: `${MISC_API_URL}/get_all_reminders`,
    GetRefList: `${MISC_API_URL}/get_ref_list`,
    GetLibRefList: `${MISC_API_URL}/get_lib_ref_list`,
    GetSecuredEntities: `${MISC_API_URL}/get_secured_entities`,
    GetSecuredData: `${MISC_API_URL}/get_secured_data`,
    GetSiteRooms: `${MISC_API_URL}/get_site_rooms`,
    GetTableData: `${MISC_API_URL}/get_table_data`,
    ComputeCustomId: `${MISC_API_URL}/compute_custom_id`,
    GetSecuredEntitiesData: `${MISC_API_URL}/get_secured_entities_data`,
    CreateUpdateCustomSequence: `${MISC_API_URL}/create_update_custom_sequence`,
    DeleteCustomSequence: `${MISC_API_URL}/delete_custom_sequence`
}

export const FS = {
    UploadFileStream: `${FS_API_URL}/upload_file_stream`,
    DeleteFileStream: `${FS_API_URL}/delete_file_stream`,
    GetFileStream: `${FS_API_URL}/get_file_stream`,
}

export const EXPLORER = {
    SiteHierarchy: `${EXPLORER_API_URL}/site_hierarchy`,
    AllSitesHierarchy: `${EXPLORER_API_URL}/all_sites_hierarchy`,
    SiteHierarchyWithFilter: `${EXPLORER_API_URL}/site_hierarchy_with_filter`,
    FloorDevicesConfigurationHierarchy: `${EXPLORER_API_URL}/floor_devices_configuration_hierarchy`,
    FloorDevicesConfigurationHierarchyReduced: `${EXPLORER_API_URL}/floor_devices_configuration_hierarchy_reduced`,
    MountedDeviceConfigurationHierarchyNew: `${EXPLORER_API_URL}/mounted_device_configuration_hierarchy_new`,
    MountedDeviceConfigurationHierarchy: `${EXPLORER_API_URL}/mounted_device_configuration_hierarchy`,
    DatacenterHierarchy: `${EXPLORER_API_URL}/datacenter_hierarchy`,
    InventoryHierarchy: `${EXPLORER_API_URL}/inventory_hierarchy`,
    DeviceEntityHierarchy: `${EXPLORER_API_URL}/device_entity_hierarchy`,
    SearchKeyword: `${EXPLORER_API_URL}/search_keyword`,
    SearchKeywordNew: `${EXPLORER_API_URL}/search_keyword_new`,
    ExploreSettings: `${EXPLORER_API_URL}/explore_settings`,
    GetFirstDevice: `${EXPLORER_API_URL}/get_first_device`
}

export const AP = {
    SetNameValue: `${AP_API_URL}/set_namevalue`,
    AddApInstance: `${AP_API_URL}/add_profile`,
    UpdateApInstance: `${AP_API_URL}/set_profile`,
    DeleteApInstance: `${AP_API_URL}/delete_profile`,
    GetAllCol: `${AP_API_URL}/get_all_col`
}

export const POWERBI = {
    ConnectionValid: `${POWERBI_API_URL}/connection_valid`,
    Workspace: `${POWERBI_API_URL}/workspace`,
    UpdateDatasetParameter: `${POWERBI_API_URL}/update-dataset-parameters`,
}

export const INTEGRATION = {
    ConnectionValid: `${INTEGRATION_API_URL}/connection_valid`
}

export const TWILIO = {
    ConnectionValid: `${TWILIO_API_URL}/connection_valid`
}
export const HYPERV = {
    ConnectionValid: `${HYPERV_API_URL}/connection_valid`
}
export const PROPERTY = {
    GetKebabMenu: `${PROPERTY_API_URL}/get_kebab_menu`,
    GetPropertyValue: `${PROPERTY_API_URL}/get_property_value`,
    GetEntityTableNames: `${PROPERTY_API_URL}/get_entity_table_names`,
    GetPgTableNames: `${PROPERTY_API_URL}/get_pg_table_names`,
    GetPropertyNames: `${PROPERTY_API_URL}/get_property_names`,
    SetPropertyValue: `${PROPERTY_API_URL}/set_property_value`,
    GetUpdatableRecordCount: `${PROPERTY_API_URL}/get_updatable_record_count`,
    GetEntityNamesForSet: `${PROPERTY_API_URL}/get_entity_names_for_set`


}

export const WINSVC = {
    GetAllWindowsServices: `${WINSVC_API_URL}/get_all_windows_services`,
    StartWindowsService: `${WINSVC_API_URL}/start_windows_service`,
    PauseWindowsService: `${WINSVC_API_URL}/pause_windows_service`,
    StopWindowsService: `${WINSVC_API_URL}/stop_windows_service`,
}
export const DATAGRID = {
    SetDatagridJsonColwidtharray: `${DATAGRID_API_URL}/set_datagrid_json_colwidtharray`,
    GetDatagridJsonColwidtharray: `${DATAGRID_API_URL}/get_datagrid_json_colwidtharray`,
};

export const SQLJOB = {
    GetAllJobs: `${SQLJOB_API_URL}/get_all_jobs`,
    SetAction: `${SQLJOB_API_URL}/set_action`
}

export const DC = {
    EmptySite: `${DC_API_URL}/empty_site`,
    EmptyRoom: `${DC_API_URL}/empty_room`,
    EmptyFloor: `${DC_API_URL}/empty_floor`,
    EmptyBin: `${DC_API_URL}/empty_bin`,
    EmptyStore: `${DC_API_URL}/empty_store`,
    DeleteSite: `${DC_API_URL}/delete_site`,
    DeleteRoom: `${DC_API_URL}/delete_room`,
    DeleteFloor: `${DC_API_URL}/delete_floor`,
    DeleteLocation: `${DC_API_URL}/delete_location`,
    DeleteStore: `${DC_API_URL}/delete_store`,
    DeleteBin: `${DC_API_URL}/delete_bin`,
    DeleteInventory: `${DC_API_URL}/delete_inventory`,
    EmptyLocation: `${DC_API_URL}/empty_location`,
    MoveDevicesToFloorAndDeleteLocation: `${DC_API_URL}/move_devices_to_floor_and_delete_location`,
    AddBin: `${DC_API_URL}/add_bin`
}

export const HWENTITY = {
    GetEntities: `${HWENTITY_API_URL}/get_entities`,
    GetMfgEqtype: `${HWENTITY_API_URL}/get_mfg_eqtype`,
    AssignMfgEqType: `${HWENTITY_API_URL}/assign_mfg_eq_type`,
    AddMfgEqType: `${HWENTITY_API_URL}/add_mfg_eq_type`,
    Add: `${HWENTITY_API_URL}/add`,
}
export const TQ = {
    GetBackgroundTasks: `${TQ_API_URL}/get_background_tasks`,
    FinalizeBackgroundtask: `${TQ_API_URL}/finalize_backgroundtask`,

}

export const TASK = {
    ProcessNextTask: `${TASK_API_URL}/process_next_task`,
};
export const DATAGRI = {
    SetDatagridJsonColwidtharray: `${DATAGRID}/set_datagrid_json_colwidtharray`,
    GetDatagridJsonColwidtharray: `${DATAGRID}/get_datagrid_json_colwidtharray`,
};

export const LOG = {
    CreateMessage: `${LOG_API_URL}/create_message`,
    GetFilteredLog: `${LOG_API_URL}/get_filtered_log`,
    AppendForensicLog: `${LOG_API_URL}/append_forensic_log`,
};

export const LIBRARY = {
    GetFilteredDevicesByMfgeqtype: `${LIBRARY_API_URL}/get_filtered_devices_by_mfgeqtype`,
    GetPropertiesForEqidlist: `${LIBRARY_API_URL}/get_properties_for_eqidlist`,
    GetDevicemodelViews: `${LIBRARY_API_URL}/get_devicemodel_views`,
    GetDevicemodelSvg: `${LIBRARY_API_URL}/get_devicemodel_svg`
}

export const NZENTITY = {
    GetEntities: `${NZENTITY_API_URL}/get_entities`,
    GetPgTables: `${NZENTITY_API_URL}/get_pg_tables`,
    GetPgProperties: `${NZENTITY_API_URL}/get_pg_properties`,
    AssignPgTablesToEntity: `${NZENTITY_API_URL}/assign_pg_tables_to_entity`,
};
export const DCI = {
    DciHierarchy: `${DCI_API_URL}/dci_hierarchy`,
    ContainedByDevices: `${DCI_API_URL}/contained_by_devices`
}
export const ALERT = {
    GetAlertProfiles: `${ALERT_API_URL}/get_alert_profiles`,
    GetAlertsToProcess: `${ALERT_API_URL}/get_alerts_to_process`,
    GetFilteredLogs: `${ALERT_API_URL}/get_filtered_logs`,
    CreateAlertMessage: `${ALERT_API_URL}/create_alert_message`,
    AddToAlertQueue: `${ALERT_API_URL}/add_to_alert_queue`,
    GetAlertDeliveryLogs: `${ALERT_API_URL}/get_alert_delivery_logs`
}

export const DELEGATE = {
    GetAllDelegates: `${DELEGATE_API_URL}/get_all_delegates`,
    GetAllDelegatesForUser: `${DELEGATE_API_URL}/get_all_impersonated_users`,
}

export const AUTH = {
    GetEntitiesForFeatureAuth: `${AUTH_API_URL}/get_entities_for_feature_auth`,
    GetFeaturesByEntity: `${AUTH_API_URL}/get_features_by_entity`,
    AddAuthByEntity: `${AUTH_API_URL}/add_auth_by_entity`,
    GetUsers: `${AUTH_API_URL}/get_users`,
    GetSitesByUser: `${AUTH_API_URL}/get_sites_by_user`,
    GetLicensesByUser: `${AUTH_API_URL}/get_licenses_by_user`,
    GetTeamsByUser: `${AUTH_API_URL}/get_teams_by_user`,
    GetRolesByUser: `${AUTH_API_URL}/get_roles_by_user`,
    GetTenantsByUser: `${AUTH_API_URL}/get_tenants_by_user`,
    GetApiUserSessionid: `${AUTH_API_URL}/get_api_user_sessionid`,
    GetAllAuthorizedReports: `${AUTH_API_URL}/get_all_authorized_reports`,
    GetAuthorizedEntity: `${AUTH_API_URL}/get_authorized_entity`,
    GetAuthorizedEntityWithRecid: `${AUTH_API_URL}/get_authorized_entity_with_recid`,
    GetUsersContactsEntities: `${AUTH_API_URL}/get_users_contacts_entities`,
    GetTenantUserForSite: `${AUTH_API_URL}/get_tenant_user_for_site`,
    IsAuthorized: `${AUTH_API_URL}/isauthorized`,
    EnableDisableUser: `${AUTH_API_URL}/enable_disable_user`
}

export const TENANT = {
    GetAllTenants: `${TENANT_API_URL}/get_all_tenants`
}

export const REPORTPROFILE = {
    DownloadTemplates: `${REPORTPROFILE_API_URI}/download_templates`,
};

export const VIRTUAL = {
    GetLocationHierarchy: `${VIRTUAL_API_URI}/get_location_hierarchy`
}

export const CLOUD = {
    GetLocationHierarchy: `${CLOUD_API_URI}/get_location_hierarchy`
}

export const BS = {
    GetBs: `${BS_API_URI}/get_bs`,
    GetBsDiagramData: `${BS_API_URI}/get_bs_diagram_data`
}

export const AUDIT = {
    GetAllAuditsessions: `${AUDIT_API_URI}/get_all_auditsessions`,
    UpdateAuditStatus: `${AUDIT_API_URI}/update_audit_status`,
    SnapshotInventoryForAudit: `${AUDIT_API_URI}/snapshotinventory_for_audit`,
    GetInventoryForAudit: `${AUDIT_API_URI}/get_inventory_for_audit`,
    GetDevicedetailsForScannedcode: `${AUDIT_API_URI}/get_devicedetails_for_scannedcode`,
    AddInventoryForAudit: `${AUDIT_API_URI}/add_inventory_for_audit`,
    UpdateAuditInventoryStatus: `${AUDIT_API_URI}/update_audit_inventory_status`,
    NewAuditSessionOrInventoryAllowed: `${AUDIT_API_URI}/new_auditsession_or_inventory_allowed`,
    GetAuditDeviceCount: `${AUDIT_API_URI}/get_audit_device_count`,
    GetHierarchyForScannedcode: `${AUDIT_API_URI}/get_hierarchy_for_scannedcode`
}

export const STATS = {
    UpdateGlobalStatistics: `${STATS_API_URL}/update_global_statistics`,
    UpdateSiteStatistics: `${STATS_API_URL}/update_site_statistics`,
    GetChildrenStatistics: `${STATS_API_URL}/get_children_statistics`,
    GetImountedDevice: `${STATS_API_URL}/get_imounted_device`,
    GetIfloorRack: `${STATS_API_URL}/get_ifloor_rack`,

}
export const PURGE = {
    PurgeTables: `${PURGE_API_URL}/purge_tables`
}
export const REMINDER = {
    SetReminderStatus: `${REMINDER_API_URL}/set_reminder_status`
}

export const EXPAPI = {
    DCMConsoleStatus: `/dcmconsole/status`,
    DCMConsoleEnv: `/dcmconsole/env`,

    GoogleMapStatus: `/googlemap/status`,
    GoogleMapEnv: `/googlemap/env`,

    TwilioStatus: `/twilio/status`,
    TwilioEnv: `/twilio/env`,

    PowerBiStatus: `/powerbi/status`,
    PowerBiEnv: `/powerbi/env`,

    SqlDbStatus: `/sqldb/status`,
    SqlDbEnv: `/sqldb/env`,

    DeviceLibraryStatus: `/devicelibrary/status`,
    DeviceLibraryEnv: `/devicelibrary/env`,

    AiGeminiStatus: `/aigemini/status`,
    AiGeminiEnv: `/aigemini/env`,

    HyperVStatus: `/hyperv/status`,
    HyperVEnv: `/hyperv/env`,

    VCenterStatus: `/vcenter/status`,
    VCenterEnv: `/vcenter/env`,

    CloudAwsStatus: `/cloudaws/status`,
    CloudAwsEnv: `/cloudaws/env`,

    CloudAzureStatus: `/cloudazure/status`,
    CloudAzureEnv: `/cloudazure/env`,

    CloudGcpStatus: `/cloudgcp/status`,
    CloudGcpEnv: `/cloudgcp/env`,

    ServiceNowStatus: `/servicenow/status`,
    ServiceNowEnv: `/servicenow/env`,

    WorkdayStatus: `/workday/status`,
    WorkdayEnv: `/workday/env`,

    ServerStatus: `/server/status`,
    ServerEnv: `/server/env`,

    MsSqlStatus: `/mssql/status`,
    MsSqlEnv: `/mssql/env`,

    DeploymentEnv: `/deployment/env`,
    DeploymentAll: `/deployment`,

    PowerBIWorkspaces: `/powerbi/workspaces`,
    PowerBIReport: `/powerbi/reports`,

    ValidateNzUser: `/nzuser/validateNzUser`,
    AddNzUser: `/nzuser/addNzUser`,
    DeleteNzUser: `/nzuser/deleteNzUser`
};


export const INTEL = {
    DiscoverHierarchy: `${INTEL_URL}/discover_hierarchy`,
    DiscoverSingleIp: `${INTEL_URL}/discover_single_ip`,
    SetDcmStatus: `${INTEL_URL}/set_dcm_status`,
    MonitorDevice: `${INTEL_URL}/monitor_device`,
    ResetDcmData: `${INTEL_URL}/reset_dcm_data`,
    SyncDcmDailyPduPowerAggregates: `${INTEL_URL}/sync_dcm_daily_pdu_power_aggregates`
}

export const KWD = {
    DropSessionKeywordTable: `${KWD_URL}/drop_session_keyword_table`
}

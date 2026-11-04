
import { SettingSubgroups } from "../../constants/Feature";
import { FnMapTableToFormControl } from "../../shared/allcommon/settingsform/FnMapTableToFormControl";
import { IEmItem } from "../../shared/context/allinterface/IMainApp";
import { EntityNameEnums } from "../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";

const FnGetFormControlsFromEm = (subGroupName: string, emRecords: IEmItem[]) => {
    let entityName = "";
    let tableName = "";
    let isSubscribeApi = false;

    switch (subGroupName?.toLowerCase()) {
        case SettingSubgroups.Alert.toLowerCase():
            entityName = EntityNameEnums.AlertProfile;
            tableName = `_${EntityNameEnums.AlertProfile}`;
            isSubscribeApi = true;
            break;

        case SettingSubgroups.Report.toLowerCase():
            entityName = EntityNameEnums.ReportProfile;
            tableName = `_${EntityNameEnums.ReportProfile}`;
            isSubscribeApi = true;
            break;

        case SettingSubgroups.ChartTemplate.toLowerCase():
            entityName = EntityNameEnums.ChartProfile;
            tableName = `_${EntityNameEnums.ChartProfile}`;
            break;

        case SettingSubgroups.ReportTemplate.toLowerCase():
            entityName = EntityNameEnums.ReportProfile;
            tableName = `_${EntityNameEnums.ReportProfile}`;
            break;

        case SettingSubgroups.Api.toLowerCase():
            entityName = EntityNameEnums.ApiProfile;
            tableName = `_${EntityNameEnums.ApiProfile}`;
            break;

        case SettingSubgroups.BackgroundTaskProfile.toLowerCase():
            entityName = EntityNameEnums.BackgroundTaskProfile;
            tableName = `_${EntityNameEnums.BackgroundTaskProfile}`;
            break;

    }
    if (!emRecords.length || !subGroupName.length) return [];
    const filteredRecords = emRecords.filter((item) => item.TableName.toLowerCase() === tableName.toLowerCase()
        && (item.PropertyLabel as string | undefined)?.length && !item.ExcludeDataGridField)
    if (!filteredRecords.length) return [];
    return FnMapTableToFormControl(filteredRecords, entityName, "");
}

export { FnGetFormControlsFromEm }
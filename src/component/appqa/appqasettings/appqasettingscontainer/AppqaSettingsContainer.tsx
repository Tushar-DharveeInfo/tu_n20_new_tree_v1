
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { useAppqaSettingsVarContext } from '../../../shared/context/hooks/AppqaSettingsVarHooks';
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { useCommonVariableContext } from '../../../shared/context/hooks/CommonVariableHooks';
import { useSelectedNodeContext } from '../../../shared/context/hooks/SelectedNodeHooks';
import { axiosInterceptor, axiosInterceptorForHead, axiosInterceptorForHeadAll, axiosInterceptorForTest } from '../../../shared/interceptors/Interceptor';
import '../../allcss/appqasettingscontainer/AppqaSettingsContainer.css'
import { ALERT, AP, EM, FS, LOG, MISC } from '../../../shared/interceptors/EndPoints';
import { FEnums } from '../../../constants/Feature';
import { SettingSubgroups, SettingGroups } from '../../../constants/Feature';
import { EntityNameEnums, FileGroupNameEnums, PowerConfigureGroup, PowerConfigureSubGroup, PowerConfigureWithoutProfile, PowerConfigureWithProfile, SettingApNames, SettingForEntityForm, SettingForIntegration, SettingForTreeForm, SettingHeaderNotRequired, SettingWithoutProfile, SettingWithProfile } from '../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { FnGetApProfilesWithControls } from '../../allcommon/FnGetApProfilesWithControls';
import { FnGetApplicationParameter } from '../../../shared/allcommon/basic/FnGetApplicationParameter';
import { FnHandleAPIResponse } from '../../../shared/allcommon/settingsform/FnHandleAPIResponse';
import { FnSetSessionStorageItem } from '../../../appcontainer/allcommon/FnSetSessionStorageItem';
import { FnGetEnvVariableByKey } from '../../../appcontainer/allcommon/FnGetEnvVariableByKey';
import { IApItem } from '../../../shared/context/allinterface/IMainApp';
import { IHelpTipProperty } from '../../../shared/context/allinterface/IHelpTip';
import { IApProfileItem } from '../../../shared/context/allinterface/IApProfile';
import { IAppqaSettingsContainer, IPayloadObject, PayloadValue } from '../../../shared/allinterface/IAppqaSettingsContainer'
import { IControl } from '../../../shared/allinterface/settingsform/ISettingsLibForm';
import { IActionLabelItem } from '../../../shared/allinterface/basic/IActionLabelItem';
import { Label } from '../../../shared/basic/label/Label';
import { BackgroundTaskProfile } from './template/backgroundtaskprofile/BackgroundTaskProfile';
import { DcimStatistics } from './aboutnetzoom/dcimstatistics/DcimStatistics';
import { MsSql } from './integration/mssql/MsSql';
import { Information } from './aboutnetzoom/information/Information';
import { MobileApp } from './netzoomaddon/mobileapp/MobileApp';
import { BroadcastTemplate } from './template/broadcasttemplate/BroadcastTemplate';
import { AiGemini } from './integration/aigemini/AiGemini';
import { Dcm } from './integration/dcm/Dcm';
import { GoogleMap } from './integration/googlemap/GoogleMap';
import { Api } from './api/api/Api';
import { PowerBi } from './integration/powerbi/PowerBi';
import { ServiceNow } from './integration/servicenow/ServiceNow';
import { Twilio } from './integration/twilio/Twilio';
import { Workday } from './integration/workday/Workday';
import { CustomIdTemplate } from './template/customidtemplate/CustomIdTemplate';
import { Configure } from './adminconfiguration/configure/Configure';
import { ServiceCharges } from './adminconfiguration/servicecharges/ServiceCharges';
import { VisioStencilShapeOptions } from './netzoomaddon/visiostencilshapeoptions/VisioStencilShapeOptions';
import { ScheduleDataArchive } from './adminscheduler/scheduledataarchive/ScheduleDataArchive';
import { SchedulePurge } from './adminscheduler/schedulepurge/SchedulePurge';
import { ScheduleReportDelivery } from './adminscheduler/schedulereportdelivery/ScheduleReportDelivery';
import { ScheduleSqlJob } from './adminscheduler/schedulesqljob/ScheduleSqlJob';
import { ScheduleWindowsService } from './adminscheduler/schedulewindowsservice/ScheduleWindowsService';
import { WatermarkTemplate } from './template/watermarktemplate/WatermarkTemplate';
import { DataCenterInterconnect } from './datacenterinterconnect/datacenterinterconnect/DataCenterInterconnect';
import { Alert } from './subscribe/alert/Alert';
import { Report } from './subscribe/report/Report';
import { ChartTemplate } from './template/charttemplate/ChartTemplate';
import { ReportTemplate } from './template/reporttemplate/ReportTemplate';
import { AdminTool } from './admintool/AdminTool';
import { ServerStatus } from './admintool/ServerStatus';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { DeviceHealth } from '../../../features/power/configure/devicehealth/DeviceHealth';
import { SetInbandIcmpDiscoveryProfiles } from '../../../features/power/configure/setinbandicmpdiscoveryprofiles/SetInbandIcmpDiscoveryProfiles';
import { SetInbandTcpDiscoveryProfiles } from '../../../features/power/configure/setinbandtcpdiscoveryprofiles/SetInbandTcpDiscoveryProfiles';
import { SetInbandWmiDiscoveryProfiles } from '../../../features/power/configure/setinbandwmidiscoveryprofiles/SetInbandWmiDiscoveryProfiles';
import { StepTwoOutbandIcmp } from '../../../features/power/configure/steptwooutbandicmp/StepTwoOutbandIcmp';
import { SetOutbandIpmiDiscoveryProfiles } from '../../../features/power/configure/setoutbandipmidiscoveryprofiles/SetOutbandIpmiDiscoveryProfiles';
import { SetOutbandSnmpDiscoveryProfiles } from '../../../features/power/configure/setoutbandsnmpdiscoveryprofiles/SetOutbandSnmpDiscoveryProfiles';
import { SetOutbandSnmpv3DiscoveryProfiles } from '../../../features/power/configure/setoutbandsnmpv3discoveryprofiles/SetOutbandSnmpv3DiscoveryProfiles';
import { StepTwoOutbandSsh } from '../../../features/power/configure/steptwooutbandssh/StepTwoOutbandSsh';
import { StepTwoOutbandWsman } from '../../../features/power/configure/steptwooutbandwsman/StepTwoOutbandWsman';
import { SelectDeviceEventsAndAlerts } from '../../../features/power/configure/selectdeviceeventsandalerts/SelectDeviceEventsAndAlerts';
import { SelectPredefinedEventsAndAlerts } from '../../../features/power/configure/selectpredefinedeventsandalerts/SelectPredefinedEventsAndAlerts';
import { SetDcmInstanceAndItsCredentials } from '../../../features/power/configure/setdcminstanceanditscredentials/SetDcmInstanceAndItsCredentials';
import { DELIMITER } from '../../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid';
import { OfficeAddin } from './netzoomaddon/officeaddin/OfficeAddin';
import { DeliveryStatus } from './subscribe/deliverystatus/DeliveryStatus';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { Close24x24, Help24x24 } from '@n20a/libicon';
import { IImage } from '../../../shared/allinterface/basic/IImage';
import { getDiagnosticLevelData } from '../../../shared/context/contextandprovider/CommonVariable';
import { IErrorData } from '../../../shared/allinterface/IApiResponse';
import { InMemoryUrlProvider } from '../../../shared/context/contextandprovider/InMemoryUrl';
import { FnCallApiForIntegration } from '../../../shared/allcommon/settingsform/FnCallApiForIntegration';
import { FnGetBaseUrlFromKey } from '../../../shared/allcommon/charts/FnGetBaseUrlFromKey';
import { FnNormalizeTestApiResponse } from '../../allcommon/FnNormalizeTestApiResponse';
import { FnUpdateStatisticsAndRefresh } from '../../../appcontainer/allcommon/FnUpdateStatisticsAndRefresh';
import { LogGroupName, LogName, LogSubGroupName } from '../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { IFnCreateForensiclog } from '../../../appcontainer/allinterface/IFnCreateForensiclog';
import { FnCreateForensiclog } from '../../../appcontainer/allcommon/FnCreateForensiclog';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import Help, { Helptip } from '../../../shared/Help';
import EnvExpApi from './adminconfiguration/env-expapi/EnvExpApi';
import EnvNzIntHub from './adminconfiguration/env-nzinthub/EnvNzIntHub';
import EnvDcmListener from './adminconfiguration/env-dcmlistener/EnvDcmListener';
import { FnIsApiInUse } from '../../allcommon/FnIsApiInUse';
import { envVarEnums } from '../../../appcontainer/alldefaultprops/DefaultPropsAppContainer';
import { FnGetFormControlsFromEm } from '../../allcommon/FnGetFormControlsFromEm ';
import { ScheduleDailyTasks } from './adminscheduler/ScheduleDailyTasks';
import { ScheduleDcmReading } from './adminscheduler/ScheduleDcmReading';
import { ScheduleAlertDelivery } from './adminscheduler/ScheduleAlertDelivery';
import { SmtpServer } from './integration/SmtpServer';
import { RequestSupport } from './aboutnetzoom/requestsupport/RequestSupport';

const AppqaSettingsContainer = (appqaSettingsContainerProps: IAppqaSettingsContainer) => {
    const [isShowHelptip, setIsShowHelptip] = useState<boolean>(false);
    const [helptipString, setHelptipString] = useState<string>("");
    const [formControls, setFormControls] = useState<IControl[]>();
    const [profileItems, setProfileItems] = useState<IActionLabelItem[]>();
    const [apiDataForTree, setApiDataForTree] = useState<unknown>();
    const [allowToShowHeader, setAllowToShowHeader] = useState<boolean>(true);
    const [lastSavedProfileId, setLastSavedProfileId] = useState<string>();
    const [profileitem, setProfileItem] = useState<IActionLabelItem>();
    const [isShowConfirmDialog, setIsShowConfirmDialog] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isShowOkOnly, setIsShowOkOnly] = useState<boolean>(false);
    const [selectedItemToDelete, setSelectedItemToDelete] = useState<IActionLabelItem>();
    const [testApiJson, setTestApiJson] = useState<Record<string, any>>();
    const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
    const [maxInstances, setMaxInstances] = useState<number>(0);

    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();
    const selectedNodeContext = useSelectedNodeContext();
    const appqaSettingsContext = useAppqaSettingsVarContext();
    const commonVariableContext = useCommonVariableContext();
    const helpTipsContext = useHelpTipContext();

    const getHelpTips = (name: string) => {
        const normalizedName = name?.toLowerCase().replace(/\s+/g, "_");
        return helpTipsContext.helpTipRecords.filter((item: IHelpTipProperty) =>
            item.featureid?.toLowerCase().includes(normalizedName)
        );
    }
    const statusBarContext = useStatusBarContext();

    const userNameRef = useRef<string>(undefined);

    const apRecordRef = useRef<IApItem[]>(undefined);

    useEffect(() => {
        if (sessionContext.SessionList.length) {
            const userName = sessionContext.SessionList ? sessionContext.SessionList.find((item) => { return item.VariableName === "LoginShortName" }) : null;

            userNameRef.current = userName?.SessionValue ? userName.SessionValue : "";
        }
    }, [sessionContext.SessionList])

    useEffect(() => {
        if (mainAppContext.apRecords) {
            apRecordRef.current = mainAppContext.apRecords;

            const records = FnGetApplicationParameter(SettingGroups.AdminConfiguration, SettingSubgroups.Configure, mainAppContext.apRecords, undefined
                , undefined, true, null, userNameRef.current)
            if (records?.length) {
                const diagnosticLevel = records.find((item: IApProfileItem) => item._AP === SettingApNames.DiagnosticLevel);
                if (diagnosticLevel?.Value) {
                    commonVariableContext.setDiagnosticLevel(diagnosticLevel.Value);
                }
                const measurement = records.find((item: IApProfileItem) => item._AP === SettingApNames.Measurement);
                if (measurement?.Value) {
                    commonVariableContext.setMeasurement(measurement.Value);
                }

                const dateFormat = records.find((item: IApProfileItem) => item._AP === SettingApNames.DateFormat);
                if (dateFormat?.Value) {
                    FnSetSessionStorageItem("app_date_format", dateFormat.Value);
                }
            }

        }
    }, [mainAppContext.apRecords, undefined])

    const profileSignature = useMemo(
        () => JSON.stringify(mainAppContext.apProfileRecords?.map(p => p.RecID + p.InstanceName)),
        [mainAppContext.apProfileRecords]
    );

    useEffect(() => {
        let cancelled = false; // guard to prevent stale async updates

        const run = async () => {
            const feature = appqaSettingsContainerProps.selectedFeatureItem;
            if (!feature) {
                setIsShowHelptip(false);
                return;
            }

            setIsOpenHelpDialog(false)
            if (feature.NodeType?.toLowerCase() === "helptip" || feature.NodeType?.toLowerCase() === "subhelptip") {
                let data: IHelpTipProperty[] = getHelpTips(feature._Feature?.toString() ?? "");
                if (!cancelled) {
                    if (data.length) {
                        setHelptipString(data[0].tip);
                    } else {
                        setHelptipString(`SC- Need helptip for ${feature._Feature?.toString()}`);
                    }
                    setIsShowHelptip(true);
                }
            } else {
                const getSettingsDataForSubGroup = async (group: string, subGroupName: string) => {
                    let sqlDbEnv: Record<string, string | null> | null = null;
                    if (subGroupName?.toLowerCase() === SettingSubgroups.DCIMStatistics?.toLowerCase()) {
                        await FnUpdateStatisticsAndRefresh(statusBarContext, mainAppContext)
                    }
                    else if (subGroupName?.toLowerCase() === SettingSubgroups.Information?.toLowerCase()) {
                        sqlDbEnv = {
                            DateInstalled: FnGetEnvVariableByKey(envVarEnums.DATE_INSTALLED) ?? null,
                            DateLastUpdated: FnGetEnvVariableByKey(envVarEnums.DATE_LASTUPDATED) ?? null,
                        };

                    }
                    if (apRecordRef.current) {

                        const apData = FnGetApplicationParameter(
                            group,
                            subGroupName,
                            apRecordRef.current,
                            undefined,
                            undefined,
                            true,
                            null,
                            userNameRef.current
                        );
                        if (!cancelled && apData) {
                            const array: IControl[] = [];
                            apData.forEach((element: Record<string, any>) => {
                                let value = element.Value ? element.Value : element.IsRequired ? element.DefaultAPValue : "";
                                if (sqlDbEnv) {
                                    value = sqlDbEnv[element.Name];
                                }
                                array.push({
                                    RecID: element.RecID,
                                    CanChange: element.CanChange,
                                    GroupName: element.GroupName,
                                    DefaultAPValue: element.DefaultAPValue,
                                    GroupNameDesc: element.GroupNameDesc,
                                    SubGroupName: element.SubGroupName,
                                    SubGroupNameDesc: element.SubGroupNameDesc,
                                    ChangeEvent: element.ChangeEvent,
                                    EntID: element.EntID,
                                    EntityName: element.EntityName,
                                    PropertyLabel: element.PropertyLabel,
                                    _AP: element.Name,
                                    Name: element.Name,
                                    NameDesc: element.NameDesc,
                                    Value: value,
                                    ValueDesc: element.ValueDesc,
                                    MaxInstances: element.MaxInstances,
                                    IsNZ: element.IsNZ,
                                    IsRequired: element.IsRequired,
                                    LastUpdated: element.LastUpdated,
                                    NOrder: element.SortOrder,
                                    DisplayControl: element.DisplayControl,
                                    InputMask: element.InputMask,
                                    RegEx: element.RegEx,
                                    GroupControl: element.DisplayGroupControl,
                                    IsSaved: false,
                                    OldValue: element.Value,
                                    IsReadOnly: element.DisplayControl === "TextControl" ? true : false,
                                    SubGroupEntID: '',
                                    SortOrder: element.SortOrder ?? 0,
                                    DisplayGroupControl: element.DisplayGroupControl,
                                    Secured: false,
                                    disabled: false
                                });
                            });
                            setFormControls(array);
                            appqaSettingsContext?.setFormControls(array);
                        }
                    }
                };

                const getSettingsProfileDataForSubGroup = async (group: string, subGroupName: string) => {
                    const getApProfilesWithControls = async (apProfileRecords?: IApProfileItem[]) => {
                        if (mainAppContext.apRecords) {

                            const controlsAndProfiles = FnGetApProfilesWithControls(
                                group,
                                subGroupName,
                                mainAppContext.apRecords,
                                undefined,
                                apProfileRecords,
                                undefined,
                                true
                            );

                            if (!cancelled && controlsAndProfiles && controlsAndProfiles.controls?.length > 0) {
                                if (controlsAndProfiles.maxInstances) {
                                    setMaxInstances(controlsAndProfiles.maxInstances);
                                }
                                if (controlsAndProfiles.profileItems?.length > 0) {
                                    controlsAndProfiles.profileItems.sort((a, b) =>
                                        a.label?.toLowerCase().localeCompare(b.label?.toLowerCase())
                                    );
                                    if (controlsAndProfiles.profileItems && controlsAndProfiles.profileItems.length > 0) {
                                        setProfileItem(controlsAndProfiles.profileItems[0] ?? undefined);
                                    }

                                    setProfileItems(controlsAndProfiles.profileItems);
                                    if (lastSavedProfileId && lastSavedProfileId !== "") {
                                        const filteredData = controlsAndProfiles.profileItems.find((item) => {
                                            return item.actionCode === lastSavedProfileId || item.label === lastSavedProfileId;
                                        });
                                        if (filteredData) {
                                            appqaSettingsContext?.setSelectedProfileItem(filteredData);
                                        } else {
                                            appqaSettingsContext?.setSelectedProfileItem(controlsAndProfiles.profileItems[0]);
                                        }
                                    } else {
                                        appqaSettingsContext?.setSelectedProfileItem(controlsAndProfiles.profileItems[0]);
                                    }
                                } else {
                                    setProfileItems([]);
                                }

                                setFormControls(controlsAndProfiles.controls);
                                appqaSettingsContext?.setFormControls(controlsAndProfiles.controls);
                            }
                        }
                    };

                    await getApProfilesWithControls(mainAppContext.apProfileRecords as IApProfileItem[]);
                };

                const getSettingsForTreeFrom = async (group: string, subGroupName: string) => {
                    const callApiForTreeData = (entityName: string, tableName: string) => {
                        const handleGetEntityRecordsApiResponse = (getEntityRecordsApiResponse: unknown, status?: string) => {
                            if (!cancelled && status === "200" && getEntityRecordsApiResponse && typeof getEntityRecordsApiResponse === "string") {
                                const parsedData = FnHandleAPIResponse(getEntityRecordsApiResponse, "Dataset");
                                if (subGroupName?.toLowerCase() === SettingSubgroups.Api?.toLowerCase() || subGroupName?.toLowerCase() === SettingSubgroups.BackgroundTaskProfile?.toLowerCase()) {
                                    if (parsedData &&
                                        typeof parsedData === "object" &&
                                        Array.isArray((parsedData as Record<string, unknown>)[`_${entityName}`])) {
                                        const profiles: IActionLabelItem[] = [];
                                        const isDiagnosticOn: string | undefined = getDiagnosticLevelData();
                                        for (let index = 0; index < parsedData[`_${entityName}`].length; index++) {
                                            const element = parsedData[`_${entityName}`][index];
                                            let isInUse = true;
                                            if (subGroupName?.toLowerCase() === SettingSubgroups.Api?.toLowerCase() && element[`_${entityName}`]) {
                                                isInUse = FnIsApiInUse(element[`_${entityName}`], element["APIUsage"])
                                            }
                                            if (subGroupName?.toLowerCase() === SettingSubgroups.Api?.toLowerCase() && isDiagnosticOn === "0" && !element.Public) continue;
                                            profiles.push({
                                                label: element[`_${entityName}`],
                                                tooltip: element.Description,
                                                actionCode: element.RecID,
                                                profileString: JSON.stringify([element]),
                                                subGroupName: subGroupName,
                                                groupName: group,
                                                EntID: element.EntID,
                                                isInUse: isInUse
                                            });

                                            profiles.sort((a, b) =>
                                                (a.label ?? "").localeCompare(b.label ?? "")
                                            );
                                        }

                                        if (profiles.length > 0) {
                                            appqaSettingsContext?.setSelectedProfileItem(profiles[0]);
                                        }
                                        setProfileItems(profiles);
                                    } else {
                                        setProfileItems([]);
                                    }
                                }

                                setApiDataForTree(parsedData);
                            }
                        };

                        axiosInterceptor({
                            url: EM.GetEntityRecords,
                            data: {
                                "entityName": entityName,
                                "entIDs": "",
                                "tableName": tableName,
                                "filterJsonString": null,
                                "andor": "OR",
                                "startRec": 0,
                                "endRec": 0
                            },
                            setFetchData: handleGetEntityRecordsApiResponse
                        }, statusBarContext);
                    };

                    const callApiForSubscribe = (entityName: string, tableName: string) => {
                        const handleSubscribeApiResponse = (subscribeApiResponse: unknown, status?: string) => {
                            if (!cancelled && status === "200" && subscribeApiResponse && typeof subscribeApiResponse === "object" && 'alertJson' in subscribeApiResponse) {
                                const parsedData = FnHandleAPIResponse(subscribeApiResponse.alertJson, "Dataset");
                                setApiDataForTree({ [`_${entityName}`]: parsedData });
                            }
                        };

                        axiosInterceptor({
                            url: ALERT.GetAlertProfiles,
                            data: {
                                "entityName": entityName,
                                "userName": userNameRef.current
                            },
                            setFetchData: handleSubscribeApiResponse
                        }, statusBarContext);
                    };

                    if (mainAppContext.emRecords) {
                        const filteredEmRecords = FnGetFormControlsFromEm(subGroupName, mainAppContext.emRecords);
                        if (!cancelled && filteredEmRecords && filteredEmRecords.length > 0) {

                            setMaxInstances(1000);
                            setFormControls(filteredEmRecords);
                            appqaSettingsContext?.setFormControls(filteredEmRecords);
                        }
                        else {
                            const controlsAndProfiles = FnGetApProfilesWithControls(
                                group,
                                subGroupName,
                                mainAppContext.apRecords,
                                undefined,
                                undefined,
                                undefined,
                                false
                            );
                            if (!cancelled && controlsAndProfiles && controlsAndProfiles.controls?.length > 0) {
                                if (controlsAndProfiles.maxInstances) {
                                    setMaxInstances(controlsAndProfiles.maxInstances);
                                }
                                setFormControls(controlsAndProfiles.controls);
                                appqaSettingsContext?.setFormControls(controlsAndProfiles.controls);
                            }
                        }

                        if (subGroupName?.toLowerCase() === SettingSubgroups.Alert?.toLowerCase()) {
                            callApiForSubscribe(EntityNameEnums.AlertProfile, `_${EntityNameEnums.AlertProfile}`);
                        } else if (subGroupName?.toLowerCase() === SettingSubgroups.Report?.toLowerCase()) {
                            callApiForSubscribe(EntityNameEnums.ReportProfile, `_${EntityNameEnums.ReportProfile}`);
                        } else if (subGroupName?.toLowerCase() === SettingSubgroups.ChartTemplate?.toLowerCase()) {
                            callApiForTreeData(EntityNameEnums.ChartProfile, `_${EntityNameEnums.ChartProfile}`);
                        } else if (subGroupName?.toLowerCase() === SettingSubgroups.ReportTemplate?.toLowerCase()) {
                            callApiForTreeData(EntityNameEnums.ReportProfile, `_${EntityNameEnums.ReportProfile}`);
                        } else if (subGroupName?.toLowerCase() === SettingSubgroups.Api?.toLowerCase()) {
                            callApiForTreeData(EntityNameEnums.ApiProfile, `_${EntityNameEnums.ApiProfile}`);
                        } else if (subGroupName?.toLowerCase() === SettingSubgroups.BackgroundTaskProfile?.toLowerCase()) {
                            callApiForTreeData(EntityNameEnums.BackgroundTaskProfile, `_${EntityNameEnums.BackgroundTaskProfile}`);
                        }

                    }
                };
                if (feature.parentName && feature.Label) {
                    let data: IHelpTipProperty[] = getHelpTips(feature._Feature?.toString() ?? "");
                    if (!cancelled) {
                        if (data.length) {
                            setHelptipString(data[0]?.tip ?? "");
                        } else {
                            setHelptipString(`SC- Need helptip for ${feature._Feature?.toString()}`);
                        }
                    }

                    if (SettingWithoutProfile.includes(feature.Label)) {
                        await getSettingsDataForSubGroup(feature.parentName, feature.Label);
                        if (!cancelled) setAllowToShowHeader(true);
                    } else if (SettingWithProfile.includes(feature.Label)) {
                        await getSettingsProfileDataForSubGroup(feature.parentName, feature.Label);
                        if (!cancelled) setAllowToShowHeader(true);
                    } else if (SettingForTreeForm.includes(feature.Label)) {
                        await getSettingsForTreeFrom(feature.parentName, feature.Label);
                        if (SettingHeaderNotRequired.includes(feature.Label)) {
                            setAllowToShowHeader(false);
                        }
                    } else if (SettingForEntityForm.includes(feature.Label)) {
                        await getSettingsForTreeFrom(feature.parentName, feature.Label);
                    } else if (PowerConfigureWithoutProfile.includes(feature.Label)) {
                        await getSettingsDataForSubGroup(feature.parentName, feature.Label);
                        if (!cancelled) setAllowToShowHeader(true);
                    } else if (PowerConfigureWithProfile.includes(feature.Label)) {
                        await getSettingsProfileDataForSubGroup(feature.parentName, feature.Label);
                        if (!cancelled) setAllowToShowHeader(true);
                    } else {
                        if (!cancelled) {
                            if (SettingHeaderNotRequired.includes(feature.Label)) {
                                setAllowToShowHeader(false);
                            } else {
                                setAllowToShowHeader(true);
                            }
                        }
                    }
                }
                if (!cancelled) setIsShowHelptip(false);
            }
        };
        run().catch((error) => {
            console.error("useEffect run error:", error);
        });;

        return () => {
            cancelled = true; // stop old async work
            appqaSettingsContext?.setFormControls([]);
            setFormControls(undefined);
            setProfileItems(undefined);
            setProfileItem(undefined);
            setApiDataForTree(undefined);
            setLastSavedProfileId(undefined);
            setTestApiJson(undefined)
            appqaSettingsContext?.setIsFormValid(undefined);
        };
    }, [
        appqaSettingsContainerProps.selectedFeatureItem,
        profileSignature,
        mainAppContext.emRecords.length
    ]);

    const callApiToRefreshData = (group: string, subGroupName: string, entityName: string, recIdToSelect?: string) => {
        const handleGetEntityRecordsApiResponse = (getEntityRecordsApiResponse: unknown, status?: string) => {
            if (status === "200" && getEntityRecordsApiResponse && typeof getEntityRecordsApiResponse === "string") {
                const parsedData = FnHandleAPIResponse(getEntityRecordsApiResponse, "Dataset");

                if (subGroupName.toLowerCase() === SettingSubgroups.Api.toLowerCase() || subGroupName.toLowerCase() === SettingSubgroups.BackgroundTaskProfile.toLowerCase()) {
                    if (parsedData &&
                        typeof parsedData === "object" &&
                        Array.isArray((parsedData as Record<string, unknown>)[`_${entityName}`])) {
                        const profiles: IActionLabelItem[] = [];
                        let selectedItem: IActionLabelItem | undefined = undefined;
                        const isDiagnosticOn: string | undefined = getDiagnosticLevelData();

                        for (let index = 0; index < parsedData[`_${entityName}`].length; index++) {
                            const element = parsedData[`_${entityName}`][index];
                            let isInUse = true;
                            if (subGroupName?.toLowerCase() === SettingSubgroups.Api?.toLowerCase() && element[`_${entityName}`]) {
                                isInUse = FnIsApiInUse(element[`_${entityName}`], element["APIUsage"])
                            }
                            if (subGroupName?.toLowerCase() === SettingSubgroups.Api?.toLowerCase() && isDiagnosticOn === "0" && !element.Public) continue;
                            const profile = {
                                label: element[`_${entityName}`],
                                tooltip: element.Description,
                                actionCode: element.RecID,
                                profileString: JSON.stringify([element]),
                                subGroupName: subGroupName,
                                groupName: group,
                                isInUse: isInUse
                            }
                            if (element.RecID === recIdToSelect) {
                                selectedItem = profile;
                            }
                            profiles.push(profile);
                        }
                        profiles.sort((a, b) => a.label.localeCompare(b.label));
                        appqaSettingsContext?.setSelectedProfileItem(selectedItem ?? profiles[0]);
                        setProfileItems(profiles);
                    }
                    else {
                        setProfileItems([]);
                    }
                }
                setApiDataForTree(parsedData);
            }
        }
        axiosInterceptor({
            url: EM.GetEntityRecords,
            data: {
                "entityName": entityName,
                "entIDs": "",
                "tableName": `_${entityName}`,
                "filterJsonString": null,
                "andor": "OR",
                "startRec": 0,
                "endRec": 0
            },
            setFetchData: handleGetEntityRecordsApiResponse
        }, statusBarContext)
    }

    const handleShowMessage = (message: string, isShowOkOnly?: boolean | undefined): void | Promise<boolean> => {
        setConfirmMessage(message);
        setIsShowOkOnly(true);
        setIsShowConfirmDialog(true);
    }

    const handleSaveForm = (profileData: string, id?: string | undefined, isSilent?: boolean) => {
        if (appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.Api || appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.BackgroundTaskProfile) {
            const entityName = appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.Api ? EntityNameEnums.ApiProfile : EntityNameEnums.BackgroundTaskProfile;
            let entityTable = `_${entityName}`;
            const parsedData = FnParseJsonSafely(profileData);

            const callApiToSaveEntityRecord = () => {
                const handleAddEditEntityRecordResponse = (addEntityRecordResponse: unknown, status?: string) => {
                    if (status === "200") {

                        const payload: IFnCreateForensiclog = {
                            logType: 'UserAction',
                            GroupName: LogGroupName.ForensicLogTemplate,
                            _Forensiclog: LogSubGroupName.Entity,
                            SubGroupName: LogSubGroupName.Entity,
                            LogName: id ? LogName.UpdateEntity : LogName.AddEntity,
                            actionObject: {
                                Name: parsedData[0][`_${entityName}`],
                                FeatureName: appqaSettingsContainerProps.selectedFeatureItem.Label,
                            },
                            sessionContext: sessionContext,
                            statusBarContext: statusBarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        }
                        FnCreateForensiclog(payload)
                        if (addEntityRecordResponse && typeof addEntityRecordResponse === "object" && 'jsonStringOutput' in addEntityRecordResponse) {
                            const parsedData = FnParseJsonSafely(addEntityRecordResponse.jsonStringOutput as string);
                            let recId: string | undefined = undefined;
                            if (parsedData &&
                                typeof parsedData === "object" &&
                                Array.isArray((parsedData as Record<string, unknown>)[`_${entityName}`])) {
                                recId = parsedData[`_${entityName}`][0].RecID
                            }
                            if (!isSilent)
                                callApiToRefreshData(appqaSettingsContainerProps.selectedFeatureItem.parentName, appqaSettingsContainerProps.selectedFeatureItem.Label, entityName, recId)
                        }
                        const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
                        if (saveButton) {
                            saveButton.style.display = "none";
                        }
                    }

                }
                const profileJson = parsedData[0];

                if (id) {

                    profileJson["RecID"] = parsedData[0].RecID;
                    profileJson["EntID"] = parsedData[0].EntID;
                    profileJson["LastUpdated"] = undefined;
                    profileJson["IsNZ"] = parsedData[0].IsNZ ? 1 : 0;
                    profileJson["Secured"] = parsedData[0].Secured ? 1 : 0;
                }
                profileJson["EntityName"] = entityName;

                let jsonData = { [entityTable]: [profileJson] };
                axiosInterceptor({
                    url: EM.AddUpdateTableRecord,
                    data: {
                        jsonString: JSON.stringify(jsonData)
                    },
                    callSilently: isSilent ? true : false,
                    setFetchData: handleAddEditEntityRecordResponse
                }, statusBarContext);

            }
            callApiToSaveEntityRecord();
        }
        else {
            const parsedData = FnParseJsonSafely(profileData, {
                fallback: null
            });
            const callApiToSaveInstance = () => {
                const handleResponseOfAddUpdateInstance = (addUpdateInstanceResponse: unknown, status?: string) => {
                    if (status === "200" && addUpdateInstanceResponse) {

                        const payload: IFnCreateForensiclog = {
                            logType: 'UserAction',
                            GroupName: LogGroupName.ForensicLogTemplate,
                            _Forensiclog: LogSubGroupName.ApProfile,
                            SubGroupName: LogSubGroupName.ApProfile,
                            LogName: id ? LogName.UpdateAPProfile : LogName.AddAPProfile,
                            actionObject: {
                                Name: parsedData[0].InstanceName,
                                FeatureName: appqaSettingsContainerProps.selectedFeatureItem.Label,
                            },
                            sessionContext: sessionContext,
                            statusBarContext: statusBarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        }
                        FnCreateForensiclog(payload)
                        if (typeof addUpdateInstanceResponse === "object" && 'entID' in addUpdateInstanceResponse && ('recID' in addUpdateInstanceResponse || id)) {
                            if (parsedData && parsedData.length > 0 && (parsedData[0].FPFileContent || (parsedData[0].TemplateFileName && Array.isArray(parsedData[0].TemplateFileName)))) {
                                const handleUploadFileStreamResponse = (uploadFileStreamResponse: unknown, status?: string) => {
                                    if (status === "200" && uploadFileStreamResponse && typeof uploadFileStreamResponse === "object"
                                        && 'fileUID' in uploadFileStreamResponse) {

                                        mainAppContext.fetchApProfileRecords(statusBarContext)
                                    }
                                    else if ('recID' in addUpdateInstanceResponse) {
                                        const handleDeleteFileStreamResponse = (deleteFileStreamResponse: unknown, status?: string) => {
                                            if (status === "200" && deleteFileStreamResponse !== null) {

                                            }
                                        }
                                        axiosInterceptor({
                                            url: AP.DeleteApInstance,
                                            data: {
                                                recID: addUpdateInstanceResponse.recID
                                            },
                                            setFetchData: handleDeleteFileStreamResponse
                                        }, statusBarContext);
                                    }
                                }
                                const userName = sessionContext.SessionList ? sessionContext.SessionList.find((item) => { return item.VariableName === "LoginShortName" }) : null;
                                if (parsedData[0].TemplateFileName && Array.isArray(parsedData[0].TemplateFileName)) {
                                    axiosInterceptor({
                                        url: FS.UploadFileStream,
                                        data: {
                                            fileCategory: "Text",
                                            fileExtension: `.${parsedData[0].TemplateFileName[0].extension}`,
                                            fileBlob: parsedData[0].TemplateFileName[0].fileContentBlob,
                                            fileName: parsedData[0].TemplateFileName[0].fileName,
                                            prefix: appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.WatermarkTemplate ? FileGroupNameEnums.WM : FileGroupNameEnums.Other,
                                            userName: userName ? userName.SessionValue : "",
                                            entID: addUpdateInstanceResponse.entID,
                                            entityname: appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.WatermarkTemplate ? EntityNameEnums.AP : ""
                                        },
                                        setFetchData: handleUploadFileStreamResponse
                                    }, statusBarContext);
                                }
                                else {
                                    axiosInterceptor({
                                        url: FS.UploadFileStream,
                                        data: {
                                            fileCategory: "Text",
                                            fileExtension: `.${parsedData[0].FPFileExtension}`,
                                            fileBlob: parsedData[0].FPFileContent,
                                            fileName: parsedData[0].FPFileName,
                                            prefix: appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.WatermarkTemplate ? FileGroupNameEnums.WM : FileGroupNameEnums.Other,
                                            userName: userName ? userName.SessionValue : "",
                                            entID: addUpdateInstanceResponse.entID,
                                            entityname: appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.WatermarkTemplate ? EntityNameEnums.AP : ""
                                        },
                                        setFetchData: handleUploadFileStreamResponse
                                    }, statusBarContext);
                                }

                            }
                            else {
                                mainAppContext.fetchApProfileRecords(statusBarContext);
                            }
                            if (appqaSettingsContainerProps.selectedFeatureItem.parentName === SettingGroups.Integration) {
                                handleShowUserMessage("You need to reload the application to view effect");
                                mainAppContext.fetchFeatures(statusBarContext, sessionContext.SessionList);
                            }
                            else if (appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.CustomIDTemplate) {
                                if (!parsedData[0].InstanceName || !parsedData[0].Start || !parsedData[0].Increment) {
                                    handleShowUserMessage("No data provided for create/update custom sequence.")
                                    return
                                }
                                axiosInterceptor({
                                    url: MISC.CreateUpdateCustomSequence,
                                    data: {
                                        instanceName: parsedData[0].InstanceName,
                                        startNumber: Number(parsedData[0].Start),
                                        increment: Number(parsedData[0].Increment)
                                    },
                                    setFetchData: (_respCreateSeq: unknown, status?: string) => {
                                        if (status !== "200") {
                                            handleShowUserMessage("Something went wrong in create/update sequence.");
                                        }
                                    }
                                }, statusBarContext)
                            }
                        }
                    }
                }

                const clonnedProfile = { ...parsedData[0] }
                clonnedProfile.TemplateFileName = Array.isArray(parsedData[0].TemplateFileName) ? parsedData[0].TemplateFileName[0].fullName : parsedData[0].fullName ? parsedData[0].fullName : parsedData[0].TemplateFileName;
                if (id && id !== "") {
                    if (parsedData && parsedData.length > 0) {

                        if (!parsedData[0].Enabled || parsedData[0].Enabled === "0") {
                            parsedData[0].EnvVariables = "";
                        }
                        setLastSavedProfileId(id);
                        axiosInterceptor({
                            url: AP.UpdateApInstance,
                            data: {
                                recID: id,
                                instanceName: parsedData[0].InstanceName || "",
                                instanceDesc: parsedData[0].Description || "",
                                profileString: JSON.stringify([clonnedProfile])
                            },
                            callSilently: isSilent ? true : false,
                            setFetchData: handleResponseOfAddUpdateInstance
                        }, statusBarContext);
                    }
                } else {
                    if (parsedData && parsedData.length > 0
                        && appqaSettingsContainerProps.selectedFeatureItem.Label
                        && appqaSettingsContainerProps.selectedFeatureItem.parentName
                        && parsedData[0].InstanceName) {
                        setLastSavedProfileId(parsedData[0].InstanceName);
                        axiosInterceptor({
                            url: AP.AddApInstance,
                            data: {
                                groupName: appqaSettingsContainerProps.selectedFeatureItem.parentName,
                                subGroupName: appqaSettingsContainerProps.selectedFeatureItem.Label,
                                instanceName: parsedData[0].InstanceName,
                                instanceDesc: parsedData[0].Description || "",
                                profileString: JSON.stringify([clonnedProfile])
                            },
                            callSilently: isSilent ? true : false,
                            setFetchData: handleResponseOfAddUpdateInstance
                        }, statusBarContext);
                    }
                }
            }
            const selectedFeature = appqaSettingsContainerProps.selectedFeatureItem.Label?.toLowerCase();
            const subGroup = SettingForIntegration.find((item) => item.toLowerCase() === selectedFeature);
            if (subGroup && parsedData?.length && parsedData[0].Enabled && parsedData[0].EnvPrefix) {

                FnCallApiForIntegration(subGroup?.toLowerCase(),
                    parsedData[0].EnvPrefix, handleShowMessage
                ).then((result) => {
                    if (result) {
                        callApiToSaveInstance();
                    }
                });
            }
            else {
                callApiToSaveInstance();
            }
        }

        const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
        if (saveButton) {
            saveButton.style.display = "none";
        }
    }

    const handleFormElementValueChange = (
        value: any,
        name: string | undefined,
        isDefault?: boolean
    ): Promise<boolean> => {
        return new Promise<boolean>(async (resolve) => {

            if (isDefault || value === undefined) {
                resolve(false);
                return;
            }


            const callApiToSetNameValue = async (
                fileUID?: string,
                updatedValue?: string
            ) => {
                if (!formControls || formControls.length === 0) {
                    resolve(false);
                    return;
                }

                const filteredControl = formControls.find(c => c._AP === name);
                if (!filteredControl) {
                    resolve(false);
                    return;
                }

                const isMySetting =
                    appqaSettingsContainerProps.featureId === FEnums.Configure.toString()
                        ? 2
                        : filteredControl.CanChange ? 1 : 0;

                const handleResponseOfSetNameValue = async (response: unknown, status?: string) => {
                    if (status === "200") {
                        if (filteredControl) {
                            const payload: IFnCreateForensiclog = {
                                logType: 'UserAction',
                                GroupName: LogGroupName.ForensicLogTemplate,
                                _Forensiclog: LogSubGroupName.Ap,
                                SubGroupName: LogSubGroupName.Ap,
                                LogName: LogName.UpdateValue,
                                actionObject: {
                                    ApName: filteredControl.Name,
                                    ApValue: value,
                                    FeatureName: filteredControl.SubGroupName,
                                },
                                sessionContext: sessionContext,
                                statusBarContext: statusBarContext,
                                RefTableItems: mainAppContext.refTableRecords
                            }
                            FnCreateForensiclog(payload)
                        }
                        await mainAppContext.fetchApRecords(statusBarContext);
                        resolve(true);
                    } else {
                        // rollback uploaded file if needed
                        if (fileUID) {
                            const handleDeleteFileStreamResponse = (deleteFileStreamResponse: unknown, status?: string) => {
                                if (status === "200" && deleteFileStreamResponse !== null) {
                                    // same as original – no-op
                                }
                            };

                            axiosInterceptor({
                                url: FS.DeleteFileStream,
                                data: {
                                    fileCategory: "Text",
                                    fileExtension: `.${value[0].extension}`,
                                    fileUID
                                },
                                setFetchData: handleDeleteFileStreamResponse
                            }, statusBarContext);
                        }
                        resolve(false);
                    }
                };

                axiosInterceptor({
                    url: AP.SetNameValue,
                    data: {
                        entID: filteredControl.EntID,
                        value: updatedValue ?? value,
                        isMySetting
                    },
                    allowShowLoader: true,
                    setFetchData: handleResponseOfSetNameValue
                }, statusBarContext);
            };

            const control = formControls?.find(c => c._AP === name);
            const userName = sessionContext.SessionList?.find(
                i => i.VariableName === "LoginShortName"
            )?.SessionValue ?? "";

            if (value?.[0]?.fileContentBlob && control) {
                const handleUploadFileStreamResponse = (res: unknown, status?: string) => {
                    if (status === "200" && res && typeof res === "object" && 'fileUID' in res && res.fileUID) {
                        callApiToSetNameValue(res.fileUID as string, value[0].fullName);
                    } else {
                        resolve(false);
                    }
                };

                axiosInterceptor({
                    url: FS.UploadFileStream,
                    data: {
                        fileCategory: "Binary",
                        fileExtension: `.${value[0].extension}`,
                        fileBlob: value[0].fileContentBlob,
                        fileName: value[0].fileName,
                        prefix: FileGroupNameEnums.Icon,
                        userName,
                        entityname: "AP",
                        entID: control.EntID
                    },
                    setFetchData: handleUploadFileStreamResponse
                }, statusBarContext);
            } else {
                callApiToSetNameValue();
            }
        });
    };

    const updatePayloadFromSessionAndNodeProperty = (
        payload: IPayloadObject
    ): IPayloadObject => {

        const updatedPayload: IPayloadObject = {};

        try {

            const convertToCorrectType = (value: PayloadValue): PayloadValue => {

                if (typeof value !== "string") {
                    return value;
                }

                const trimmed = value.trim().toLowerCase();

                if (trimmed === "true") {
                    return true;
                }

                if (trimmed === "false") {
                    return false;
                }

                if (trimmed === "") {
                    return "";
                }

                // Handle numeric string
                if (!Number.isNaN(Number(trimmed)) && trimmed !== "") {
                    return Number(trimmed);
                }

                return value;
            };

            const resolvePlaceholder = (val: string): PayloadValue => {

                try {

                    const isPlaceholder = /^<[^<>?]+(\?)?>$/.test(val);

                    if (!isPlaceholder) {
                        return convertToCorrectType(val);
                    }

                    const isOptional = val.includes("?>");

                    const key = val.replace(/^<|[\?>]*>$/g, "");

                    const sessionItem = sessionContext.SessionList?.find(
                        (item) => item.VariableName === key
                    );

                    const sessionValue = sessionItem?.SessionValue;

                    const nodeValue =
                        selectedNodeContext.selectedNodeProperty?.[
                        key as keyof typeof selectedNodeContext.selectedNodeProperty
                        ];

                    const nodePropertyValue =
                        selectedNodeContext.selectedNodeAllProperties?.[
                        key as keyof typeof selectedNodeContext.selectedNodeAllProperties
                        ];

                    const resolved =
                        sessionValue ??
                        nodeValue ??
                        nodePropertyValue;

                    if (resolved !== undefined) {
                        return convertToCorrectType(resolved as PayloadValue);
                    }

                    return isOptional ? undefined : "";

                } catch (error) {

                    console.error(
                        "Error resolving placeholder:",
                        val,
                        error
                    );

                    return undefined;
                }
            };

            const processValue = (
                value: PayloadValue
            ): PayloadValue => {

                try {

                    if (Array.isArray(value)) {

                        return value
                            .map((item) => processValue(item))
                            .filter(
                                (item): item is Exclude<PayloadValue, undefined> =>
                                    item !== undefined
                            );
                    }

                    if (
                        value !== null &&
                        typeof value === "object"
                    ) {

                        const result: IPayloadObject = {};

                        Object.keys(value).forEach((key) => {

                            const processed = processValue(
                                value[key]
                            );

                            if (processed !== undefined) {
                                result[key] = processed;
                            }
                        });

                        return result;
                    }

                    if (typeof value === "string") {
                        return resolvePlaceholder(value);
                    }

                    return convertToCorrectType(value);

                } catch (error) {

                    console.error(
                        "Error processing payload value:",
                        value,
                        error
                    );

                    return undefined;
                }
            };

            Object.keys(payload).forEach((key) => {

                try {

                    const normalizedKey = key.endsWith("?")
                        ? key.slice(0, -1)
                        : key;

                    if (normalizedKey === "sessionId") {
                        return;
                    }

                    const processed = processValue(payload[key]);

                    if (processed !== undefined) {
                        updatedPayload[normalizedKey] = processed;
                    }

                } catch (error) {

                    console.error(
                        `Error processing key: ${key}`,
                        error
                    );
                }
            });

        } catch (error) {

            console.error(
                "Error in updatePayloadFromSessionAndNodeProperty:",
                error
            );
        }

        return updatedPayload;
    };

    const handleActionImageClickForm = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: IActionLabelItem | unknown) => {
        if (actionCode === "add") {
            setLastSavedProfileId(undefined);
            appqaSettingsContext?.setSelectedProfileItem(null);
        }
        else if (actionCode === "delete") {
            const handleCreateMessageApiResponse = (createMessageApiResponse: unknown, status?: string) => {
                if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                    setIsShowOkOnly(false);
                    setConfirmMessage(createMessageApiResponse.finalMessage as string);
                    setIsShowConfirmDialog(true);
                    setSelectedItemToDelete(payload as IActionLabelItem);
                }
            }
            axiosInterceptor({
                url: LOG.CreateMessage,
                data: {
                    projectInitial: "Common",
                    msgID: "151"
                },
                setFetchData: handleCreateMessageApiResponse
            }, statusBarContext)
        }
        else if (actionCode === "preflightall") {
            if (profileItems && profileItems.length > 0) {

                const urls: string[] = [];
                for (let index = 0; index < profileItems.length; index++) {
                    const element = profileItems[index];
                    if (element.profileString && typeof element.profileString === "string") {
                        const parsed = FnParseJsonSafely(element.profileString);
                        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                            const baseUrl = parsed[0].BaseURL;
                            let baseUrlKey = "";
                            const method = parsed[0].Method;
                            if (baseUrl && method) {
                                if (parsed[0].BaseURL) {
                                    baseUrlKey = FnGetBaseUrlFromKey(parsed[0].BaseURL as string)
                                }

                                const sanitizedBaseUrl = baseUrlKey.replace(/\/+$/, ''); // remove trailing slashes
                                const sanitizedMethod = method?.toLowerCase().trim().replace(/^\/+/, ''); // remove leading slashes
                                urls.push(`${sanitizedBaseUrl}/${sanitizedMethod}`);
                            }
                        }
                    }

                }
                if (urls.length) {
                    axiosInterceptorForHeadAll({
                        urls: urls,
                        batchSize: 20,
                        onComplete: (results) => {
                            if (results && results.length > 0) {
                                const filtered = results.filter((item) => {
                                    const statusCode = Number(
                                        item.error?.match(/status code (\d+)/i)?.[1]
                                    );

                                    return item.isReachable === false && statusCode !== 405;
                                });
                                if (filtered.length) {
                                    statusBarContext.setTestApiData(JSON.stringify(filtered));
                                }
                                else {
                                    statusBarContext.setUserActionData(`${urls.length} apis tested successfully.`);
                                }
                            }
                        },
                    })
                }
            }
        }
        else {
            if (actionCode === "testapi" && payload && typeof payload == "object") {
                try {

                    statusBarContext.setFetchDataError(null);
                    statusBarContext.setFetchError(null);
                    let payloadToPass: IPayloadObject = {};
                    const baseUrl: string | null = FnGetEnvVariableByKey(envVarEnums.N20_API_URL);
                    let method: string | null = null;
                    let isAddEdit: boolean = false;
                    let isGet: boolean = false;

                    if ('Payload' in payload && payload.Payload) {
                        payloadToPass = typeof payload.Payload === "string" && payload.Payload.length ? FnParseJsonSafely(payload.Payload, { fallback: {} }) as IPayloadObject : payload.Payload as IPayloadObject
                    }
                    if ('Method' in payload && payload.Method) {
                        method = payload.Method as string;
                    }
                    if ('AddEdit' in payload) {
                        isAddEdit = (payload.AddEdit as string) === "1";
                    }

                    if ('GET' in payload) {
                        isGet = (payload.GET as string) === "1";
                    }
                    if (baseUrl && method && payloadToPass) {
                        if (isAddEdit) {
                            if (baseUrl) {
                                const sanitizedBaseUrl = baseUrl.replace(/\/+$/, ''); // remove trailing slashes
                                const sanitizedMethod = method?.toLowerCase().trim().replace(/^\/+/, ''); // remove leading slashes
                                const request_url = `${sanitizedBaseUrl}/${sanitizedMethod}`
                                axiosInterceptorForHead({
                                    url: request_url,
                                    onHeadersReceived: (headers: Record<string, string> | null, isReachable: boolean, error: string | unknown) => {
                                        if (!headers && !isReachable) {
                                            const apiJson = {
                                                preflight: "Trying Preflight",
                                                url: request_url,
                                                response: {
                                                    error: "No header found"
                                                }
                                            }
                                            setTestApiJson(apiJson)
                                        }
                                        else {
                                            const apiJson = {
                                                preflight: "Trying Preflight",
                                                url: request_url,
                                                response: headers
                                            }
                                            setTestApiJson(apiJson)
                                        }

                                    }
                                })
                            }
                        }
                        else {
                            const headerToPass = {
                                "Authorization": ""
                            }
                            const sessionId = statusBarContext.userSessionId;
                            if (sessionId)
                                headerToPass.Authorization = `nzSessionId ${sessionId}`;

                            if (payloadToPass && Object.keys(payloadToPass).length) {
                                payloadToPass = updatePayloadFromSessionAndNodeProperty(payloadToPass);
                            }
                            if (baseUrl) {
                                const sanitizedBaseUrl = baseUrl.replace(/\/+$/, ''); // remove trailing slashes
                                const sanitizedMethod = method?.toLowerCase().trim().replace(/^\/+/, ''); // remove leading slashes
                                const request_url = `${sanitizedBaseUrl}/${sanitizedMethod}`
                                axiosInterceptorForTest({
                                    url: `/${sanitizedMethod}`,
                                    customBaseUrl: sanitizedBaseUrl,
                                    data: payloadToPass,
                                    customHeader: headerToPass,
                                    method: isGet ? "GET" : "POST",
                                    setFetchData: (apiResponse: unknown, status?: string, errors?: IErrorData[]) => {
                                        if (status) {
                                            const apiJson = {
                                                "url": request_url,
                                                "header": headerToPass,
                                                "payload": payloadToPass,
                                                "response": {
                                                    "status": status,
                                                    "data": FnNormalizeTestApiResponse(apiResponse),
                                                    "error": errors
                                                }
                                            }
                                            setTestApiJson(apiJson)
                                        }
                                    }
                                }, statusBarContext)
                            }
                        }
                        return;
                    }
                } catch (error) {
                    console.error('error in api call:', error);
                    return
                }
            }
        }
    }

    const handleYesButtonClick = () => {
        if (selectedItemToDelete) {
            if (appqaSettingsContainerProps.selectedFeatureItem.Label?.toLowerCase() === SettingSubgroups.Api?.toLowerCase()
                || appqaSettingsContainerProps.selectedFeatureItem.Label?.toLowerCase() === SettingSubgroups.BackgroundTaskProfile?.toLowerCase()) {
                const entityToDelete = appqaSettingsContainerProps.selectedFeatureItem.Label?.toLowerCase() === SettingSubgroups.BackgroundTaskProfile?.toLowerCase() ? EntityNameEnums.BackgroundTaskProfile : EntityNameEnums.ApiProfile
                setLastSavedProfileId(undefined);
                appqaSettingsContext?.setSelectedProfileItem(null);
                const handleApiCallDeleteTableRecords = (deleteResponse: unknown, status?: string) => {
                    if (deleteResponse === "" && status === "200") {
                        const payload: IFnCreateForensiclog = {
                            logType: 'UserAction',
                            GroupName: LogGroupName.ForensicLogTemplate,
                            _Forensiclog: LogSubGroupName.Entity,
                            SubGroupName: LogSubGroupName.Entity,
                            LogName: LogName.DeleteEntity,
                            actionObject: {
                                Name: selectedItemToDelete.label,
                                FeatureName: appqaSettingsContainerProps.selectedFeatureItem.Label,
                            },
                            sessionContext: sessionContext,
                            statusBarContext: statusBarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        }
                        FnCreateForensiclog(payload)
                        callApiToRefreshData(appqaSettingsContainerProps.selectedFeatureItem.parentName, appqaSettingsContainerProps.selectedFeatureItem.Label, entityToDelete, undefined)
                    }
                }
                const profileString = selectedItemToDelete.profileString ? FnParseJsonSafely(selectedItemToDelete.profileString) : [];
                if (Array.isArray(profileString) && profileString.length && profileString[0].RecID && profileString[0].EntID) {
                    axiosInterceptor({
                        url: EM.DeleteTableRecords,
                        data: {
                            tableName: `_${entityToDelete}`,
                            recIDs: selectedItemToDelete.actionCode,
                            entIDs: profileString[0].EntID
                        },
                        setFetchData: handleApiCallDeleteTableRecords
                    }, statusBarContext);
                }
            }
            else {

                setLastSavedProfileId(undefined);
                appqaSettingsContext?.setSelectedProfileItem(null);
                const handleApiCallApProfileDelete = (apDeleteResponse: unknown, status?: string) => {
                    if (status !== "200") return
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.ApProfile,
                        SubGroupName: LogSubGroupName.ApProfile,
                        LogName: LogName.DeleteAPProfile,
                        actionObject: {
                            Name: selectedItemToDelete.label,
                            FeatureName: appqaSettingsContainerProps.selectedFeatureItem.Label,
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload)
                    mainAppContext.fetchApProfileRecords(statusBarContext);
                    if (appqaSettingsContainerProps.selectedFeatureItem.Label === SettingSubgroups.CustomIDTemplate && selectedItemToDelete.label) {
                        axiosInterceptor({
                            url: MISC.DeleteCustomSequence,
                            data: {
                                instanceName: selectedItemToDelete.label
                            },
                            setFetchData: (_respDeleteSeq: unknown, status?: string) => {
                                if (status !== "200") {
                                    handleShowUserMessage("Something went wrong in delete custom sequence.")
                                }
                            }
                        }, statusBarContext)
                    }
                }
                axiosInterceptor({
                    url: AP.DeleteApInstance,
                    data: { recID: selectedItemToDelete.actionCode },
                    setFetchData: handleApiCallApProfileDelete
                }, statusBarContext);
            }
        }
        setIsShowConfirmDialog(false);

    }
    const handleNoButtonClick = () => {
        setIsShowConfirmDialog(false);
    }

    useEffect(() => {
        if (profileItems && profileItems?.length > 0 && appqaSettingsContainerProps.selectedFeatureItem.Label?.toLowerCase() === SettingSubgroups.Api?.toLowerCase() && selectedNodeContext.selectedNode) {
            if (selectedNodeContext.selectedNode.NodeEntityname) {
                const nodeEntID = selectedNodeContext.selectedNode.NodeEntID;
                axiosInterceptor({
                    url: EM.GetTableVsProperty,
                    data: {
                        entityName: selectedNodeContext.selectedNode.NodeEntityname
                    },
                    setFetchData: (getTableVsPropertyApiResponse: unknown, status?: string) => {
                        if (getTableVsPropertyApiResponse && status === "200" && Array.isArray(getTableVsPropertyApiResponse) && getTableVsPropertyApiResponse.length > 0) {

                            let oneToOneTables: string[] = [];
                            for (let index = 0; index < getTableVsPropertyApiResponse.length; index++) {
                                const element = getTableVsPropertyApiResponse[index];
                                if (!element.isOneToManyRelation)
                                    oneToOneTables.push(element.tableName)

                            }

                            if (oneToOneTables.length > 0 && nodeEntID) {

                                axiosInterceptor({
                                    url: EM.GetAllTablesRecord,
                                    data: {
                                        entID: nodeEntID,
                                        tableNames: oneToOneTables.join(DELIMITER.separator),
                                    },
                                    setFetchData: (getEntityRecordsApiResponse: unknown, status?: string) => {
                                        if (status === "200" && getEntityRecordsApiResponse && typeof getEntityRecordsApiResponse === "object" && 'jsonStringOutput' in getEntityRecordsApiResponse && getEntityRecordsApiResponse.jsonStringOutput) {
                                            try {
                                                const jsonData: Record<string, any> = FnParseJsonSafely(getEntityRecordsApiResponse.jsonStringOutput as string);

                                                if (!Array.isArray(jsonData?.AllTables)) {
                                                    return;
                                                }

                                                const result: Record<string, any> = {};

                                                jsonData.AllTables.forEach((table) => {
                                                    if (!Array.isArray(table?.TableData)) return;

                                                    (table.TableData as Record<string, any>[]).forEach((item) => {
                                                        if (item?.Name !== undefined && typeof item?.Name === "string") {
                                                            result[item.Name] = item.Value;
                                                        }
                                                    });
                                                });
                                                selectedNodeContext.setSelectedNodeAllProperties(result);

                                            } catch (err) {
                                                console.error("Error in handle API call:", err);
                                            }
                                        }

                                    }
                                }, statusBarContext);

                            }
                        }
                    }
                }, statusBarContext)


            }
        }
        if (appqaSettingsContainerProps.selectedFeatureItem.NodeType === "" && appqaSettingsContainerProps.selectedFeatureItem.subMenu?.length) {
            statusBarContext.setFetchError([`Selected menu(${appqaSettingsContainerProps.selectedFeatureItem.Label}) does not have NodeType.`]);
        }
    }, [profileItems, appqaSettingsContainerProps.selectedFeatureItem, selectedNodeContext.selectedNode])

    const handleShowUserMessage = (messageText: string) => {
        setIsShowOkOnly(true);
        setConfirmMessage(messageText)
        setIsShowConfirmDialog(true);
    }

    const handleActionClick = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: Record<string, any>): void => {
        setIsOpenHelpDialog(actionCode === "help" ? true : false);
    }

    const helpImageData: IImage = {
        source: <Help24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-1)',
        tooltip: "Click to get Help",
        uniqueName: `${appqaSettingsContainerProps.uniqueName}-ihelp`,
        type: 'svg'
    }
    const closeImageData: IImage = {
        source: <Close24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-1)',
        tooltip: "Click to close Help",
        uniqueName: `${appqaSettingsContainerProps.uniqueName}-ihelp`,
        type: 'svg'
    }

    return (
        <div key={appqaSettingsContainerProps.uniqueName} className='nz-w-100 nz-h-100 nz-setting-component-container'>
            {appqaSettingsContainerProps.selectedFeatureItem.NodeType === "SubHelpTip" && helptipString
                && <div className='nz-w-100 nz-h-100 nz-d-flex-column'>
                    <Help uniqueName={`${appqaSettingsContainerProps.uniqueName}-helptip`}
                        featureId={appqaSettingsContainerProps.featureId} />
                </div>}

            {!isShowHelptip && appqaSettingsContainerProps.selectedFeatureItem && <div className='nz-w-100 nz-h-100 nz-d-flex-column'>
                {allowToShowHeader &&
                    <div className='nz-sub-header'>
                        <Label uniqueName={`${appqaSettingsContainerProps.uniqueName}-subgroup-header`} label={`${appqaSettingsContainerProps.selectedFeatureItem.Label}` || ""} />
                        {appqaSettingsContainerProps.selectedFeatureItem.Label?.toLowerCase() === SettingSubgroups.Api.toLowerCase() &&
                            <ActionImage uniqueName={`${appqaSettingsContainerProps.uniqueName}-ai-help`}
                                image={isOpenHelpDialog === false ? helpImageData : closeImageData} w={'var(--node_height)'}
                                h={'var(--node_height)'}
                                handleMouse={handleActionClick}
                                actionCode={isOpenHelpDialog === false ? 'help' : "Close"} />
                        }
                    </div>}
                {helptipString &&
                    <Helptip uniqueName={`${appqaSettingsContainerProps.uniqueName}-helptip`}
                        mdString={helptipString} />
                }
                {!appqaSettingsContainerProps.selectedFeatureItem.subMenu ? <div className='nz-setting-subgroup-container'>
                    {(() => {
                        switch (appqaSettingsContainerProps.selectedFeatureItem.Label?.toLowerCase()) {

                            case SettingSubgroups.DCIMStatistics?.toLowerCase():
                                return formControls ? (<DcimStatistics uniqueName={`${appqaSettingsContainerProps.uniqueName}-dcim-statistics`} group={SettingGroups.AboutNetZoom} subGroup={SettingSubgroups.DCIMStatistics} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case SettingSubgroups.Information?.toLowerCase():
                                return formControls ? (<Information uniqueName={`${appqaSettingsContainerProps.uniqueName}-information`} group={SettingGroups.AboutNetZoom} subGroup={SettingSubgroups.Information} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;

                            case SettingSubgroups.RequestSupport?.toLowerCase():
                                return <RequestSupport uniqueName={`${appqaSettingsContainerProps.uniqueName}-request-support`} featureId={appqaSettingsContainerProps.featureId} />;
                                {/* Admin Configuration */ }
                            case SettingSubgroups.EnvNzIntHub?.toLowerCase():
                                return (<EnvNzIntHub uniqueName={`${appqaSettingsContainerProps.uniqueName}-env-nzinithub`} featureId={appqaSettingsContainerProps.featureId} />);
                            case SettingSubgroups.EnvExpApi?.toLowerCase():
                                return (<EnvExpApi uniqueName={`${appqaSettingsContainerProps.uniqueName}-env-expapi`} featureId={appqaSettingsContainerProps.featureId} />);
                            case SettingSubgroups.EnvDcmListener?.toLowerCase():
                                return (<EnvDcmListener uniqueName={`${appqaSettingsContainerProps.uniqueName}-envdcmlistener`} featureId={appqaSettingsContainerProps.featureId} />);
                            case SettingSubgroups.Configure?.toLowerCase():
                                return formControls ? (<Configure uniqueName={`${appqaSettingsContainerProps.uniqueName}-configure`} group={SettingGroups.AdminConfiguration} subGroup={SettingSubgroups.Configure} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case SettingSubgroups.ServiceCharges?.toLowerCase():
                                return formControls ? (<ServiceCharges uniqueName={`${appqaSettingsContainerProps.uniqueName}-service-charges`} group={SettingGroups.AdminConfiguration} subGroup={SettingSubgroups.ServiceCharges} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;

                                {/*Admin Scheduler */ }
                            case SettingSubgroups.SchedulePurge?.toLowerCase():
                                return formControls ? (<SchedulePurge uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-purge`} group={SettingGroups.AdminScheduler} subGroup={SettingSubgroups.SchedulePurge} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case SettingSubgroups.ScheduleReportDelivery?.toLowerCase():
                                return (<ScheduleReportDelivery uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-report-delivery`} />);
                            case SettingSubgroups.ScheduleAlertDelivery?.toLowerCase():
                                return (<ScheduleAlertDelivery uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-alert-delivery`} />);
                            case SettingSubgroups.ScheduleDailyTasks?.toLowerCase():
                                return (<ScheduleDailyTasks uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-daily-tasks`} />);
                            case SettingSubgroups.ScheduleDCMReading?.toLowerCase():
                                return (<ScheduleDcmReading uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-dcm-reading`} />);
                            case SettingSubgroups.ScheduleSQLJob?.toLowerCase():
                                return formControls && profileItems ? (<ScheduleSqlJob uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-sqljob`} group={SettingGroups.AdminScheduler} subGroup={SettingSubgroups.ScheduleSQLJob} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.ScheduleWindowsService?.toLowerCase():
                                return formControls ? (<ScheduleWindowsService uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-windows-service`} group={SettingGroups.AdminScheduler} subGroup={SettingSubgroups.ScheduleWindowsService} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case SettingSubgroups.ScheduleDataArchive?.toLowerCase():
                                return formControls ? (<ScheduleDataArchive uniqueName={`${appqaSettingsContainerProps.uniqueName}-schedule-data-archive`} group={SettingGroups.AdminScheduler} subGroup={SettingSubgroups.ScheduleDataArchive} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;

                                {/* Admin Tool */ }
                            case SettingSubgroups.OptimizeNetZoom?.toLowerCase():
                                return (<AdminTool uniqueName={`${appqaSettingsContainerProps.uniqueName}-optimize-netzoom`} featureLabel={SettingSubgroups.OptimizeNetZoom} featureId={appqaSettingsContainerProps.featureId} featureDescription={''} />);
                            case SettingSubgroups.StartNetZoom?.toLowerCase():
                                return (<AdminTool uniqueName={`${appqaSettingsContainerProps.uniqueName}-start-netzoom`} featureLabel={SettingSubgroups.StartNetZoom} featureId={appqaSettingsContainerProps.featureId} featureDescription={''} />);
                            case SettingSubgroups.StopNetZoom?.toLowerCase():
                                return (<AdminTool uniqueName={`${appqaSettingsContainerProps.uniqueName}-stop-netzoom`} featureLabel={SettingSubgroups.StopNetZoom} featureId={appqaSettingsContainerProps.featureId} featureDescription={''} />);
                            case SettingSubgroups.MigrateVersion18?.toLowerCase():
                                return (<AdminTool uniqueName={`${appqaSettingsContainerProps.uniqueName}-migrate-version-18`} featureLabel={SettingSubgroups.MigrateVersion18} featureId={appqaSettingsContainerProps.featureId} featureDescription={''} />);
                            case SettingSubgroups.ServerStatus?.toLowerCase():
                                return (<ServerStatus uniqueName={`${appqaSettingsContainerProps.uniqueName}-server-status`} featureId={appqaSettingsContainerProps.featureId} />);

                                {/*Api */ }
                            case SettingSubgroups.Api?.toLowerCase():
                                return formControls && profileItems ? (<Api uniqueName={`${appqaSettingsContainerProps.uniqueName}-api`} group={SettingGroups.Api} subGroup={SettingSubgroups.Api} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} allowTestApi={true} allowPreflight={true} allowFilter={true} testApiJson={testApiJson} allowHelp={isOpenHelpDialog} allowRecordLabel={true} />) : null;

                                {/* DCI */ }
                            case SettingSubgroups.DataCenterInterconnect?.toLowerCase():
                                return (<DataCenterInterconnect selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} uniqueName={`${appqaSettingsContainerProps.uniqueName}-data-center-interconnect`} handleShowUserMessage={handleShowUserMessage} />);

                                {/* Integration */ }
                            case SettingSubgroups.AIGemini?.toLowerCase():
                                return formControls && profileItems ? (<AiGemini uniqueName={`${appqaSettingsContainerProps.uniqueName}-aigemini`} group={SettingGroups.Integration} subGroup={SettingSubgroups.AIGemini} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} selectedProfileItem={profileitem} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.SMTPServer?.toLowerCase():
                                return formControls && profileItems ? (<SmtpServer uniqueName={`${appqaSettingsContainerProps.uniqueName}-smtpserver`} group={SettingGroups.Integration} subGroup={SettingSubgroups.SMTPServer} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} selectedProfileItem={profileitem} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.DCM?.toLowerCase():
                                return formControls && profileItems ? (<Dcm uniqueName={`${appqaSettingsContainerProps.uniqueName}-dcm`} group={SettingGroups.Integration} subGroup={SettingSubgroups.DCM} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={false} entityName='_AP' selectedProfileItem={profileitem} isAutoSave={false} profileString={profileitem?.profileString} id={profileitem?.actionCode} handleSaveAction={handleSaveForm} />) : null;
                            case SettingSubgroups.GoogleMap?.toLowerCase():
                                return formControls && profileItems ? (<GoogleMap uniqueName={`${appqaSettingsContainerProps.uniqueName}-googlemap`} group={SettingGroups.Integration} subGroup={SettingSubgroups.GoogleMap} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={false} entityName='_AP' selectedProfileItem={profileitem} isAutoSave={false} profileString={profileitem?.profileString} id={profileitem?.actionCode} handleSaveAction={handleSaveForm} />) : null;
                            case SettingSubgroups.MSSQL?.toLowerCase():
                                return formControls && profileItems ? (<MsSql uniqueName={`${appqaSettingsContainerProps.uniqueName}-mssql`} group={SettingGroups.Integration} subGroup={SettingSubgroups.MSSQL} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={false} entityName='_AP' selectedProfileItem={profileitem} isAutoSave={false} profileString={profileitem?.profileString} id={profileitem?.actionCode} handleSaveAction={handleSaveForm} />) : null;
                            case SettingSubgroups.PowerBI?.toLowerCase():
                                return formControls && profileItems ? (<PowerBi uniqueName={`${appqaSettingsContainerProps.uniqueName}-powerbi`} group={SettingGroups.Integration} subGroup={SettingSubgroups.PowerBI} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} selectedProfileItem={profileitem} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.ServiceNow?.toLowerCase():
                                return formControls && profileItems ? (<ServiceNow uniqueName={`${appqaSettingsContainerProps.uniqueName}-servicenow`} group={SettingGroups.Integration} subGroup={SettingSubgroups.ServiceNow} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} selectedProfileItem={profileitem} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.Twilio?.toLowerCase():
                                return formControls && profileItems ? (<Twilio uniqueName={`${appqaSettingsContainerProps.uniqueName}-twilio`} group={SettingGroups.Integration} subGroup={SettingSubgroups.Twilio} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={false} entityName='_AP' isAutoSave={false} selectedProfileItem={profileitem} profileString={profileitem?.profileString} id={profileitem?.actionCode} handleSaveAction={handleSaveForm} />) : null;
                            case SettingSubgroups.Workday?.toLowerCase():
                                return formControls && profileItems ? (<Workday uniqueName={`${appqaSettingsContainerProps.uniqueName}-workday`} group={SettingGroups.Integration} subGroup={SettingSubgroups.Workday} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} selectedProfileItem={profileitem} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;

                                {/*NetZoom Addon */ }
                            case SettingSubgroups.MobileApp?.toLowerCase():
                                return formControls ? (<MobileApp uniqueName={`${appqaSettingsContainerProps.uniqueName}-mobile-app`} group={SettingGroups.NetZoomAddon} subGroup={SettingSubgroups.MobileApp} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case SettingSubgroups.OfficeAddin?.toLowerCase():
                                return formControls ? (<OfficeAddin uniqueName={`${appqaSettingsContainerProps.uniqueName}-office-addin`} group={SettingGroups.NetZoomAddon} subGroup={SettingSubgroups.OfficeAddin} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case SettingSubgroups.VisioStencilShapeOptions?.toLowerCase():
                                return formControls ? (<VisioStencilShapeOptions uniqueName={`${appqaSettingsContainerProps.uniqueName}-visio-stencil-shape-options`} group={SettingGroups.NetZoomAddon} subGroup={SettingSubgroups.VisioStencilShapeOptions} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} allowActionList={false} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;

                                {/* Subscribe */ }
                            case SettingSubgroups.Alert?.toLowerCase():
                                return formControls ? (<Alert formControls={formControls} uniqueName={`${appqaSettingsContainerProps.uniqueName}-alert`} selectedGroup={SettingGroups.Subscribe} selectedSubGroup={SettingSubgroups.Alert} featureId={appqaSettingsContainerProps.featureId} apiData={apiDataForTree} handleShowUserMessage={handleShowUserMessage} />) : null;
                            case SettingSubgroups.Report?.toLowerCase():
                                return formControls ? (<Report formControls={formControls} uniqueName={`${appqaSettingsContainerProps.uniqueName}-report`} selectedGroup={SettingGroups.Subscribe} selectedSubGroup={SettingSubgroups.Report} featureId={appqaSettingsContainerProps.featureId} apiData={apiDataForTree} handleShowUserMessage={handleShowUserMessage} />) : null;
                            case SettingSubgroups.DeliveryStatus?.toLowerCase():
                                return (<DeliveryStatus uniqueName={`${appqaSettingsContainerProps.uniqueName}-delivery-status`} />);

                                {/* Template */ }
                            case SettingSubgroups.BroadcastTemplate?.toLowerCase():
                                return formControls && profileItems ? (<BroadcastTemplate uniqueName={`${appqaSettingsContainerProps.uniqueName}-broadcast-template`} group={SettingGroups.Template} subGroup={SettingSubgroups.BroadcastTemplate} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.ChartTemplate?.toLowerCase():
                                return formControls ? (<ChartTemplate formControls={formControls} uniqueName={`${appqaSettingsContainerProps.uniqueName}-chart-template`} selectedGroup={SettingGroups.Template} selectedSubGroup={SettingSubgroups.ChartTemplate} featureId={appqaSettingsContainerProps.featureId} apiData={apiDataForTree} />) : null;
                            case SettingSubgroups.BackgroundTaskProfile?.toLowerCase():
                                return formControls && profileItems ? (<BackgroundTaskProfile uniqueName={`${appqaSettingsContainerProps.uniqueName}-background-task-profile`} group={SettingGroups.AdminTool} subGroup={SettingSubgroups.BackgroundTaskProfile} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.CustomIDTemplate?.toLowerCase():
                                return formControls && profileItems ? (<CustomIdTemplate uniqueName={`${appqaSettingsContainerProps.uniqueName}-customid-template`} group={SettingGroups.Template} subGroup={SettingSubgroups.CustomIDTemplate} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={false} allowDelete={false} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case SettingSubgroups.ReportTemplate?.toLowerCase():
                                return formControls ? (<InMemoryUrlProvider><ReportTemplate uniqueName={`${appqaSettingsContainerProps.uniqueName}-report-template`} formControls={formControls} selectedGroup={SettingGroups.Template} selectedSubGroup={SettingSubgroups.ReportTemplate} featureId={appqaSettingsContainerProps.featureId} apiData={apiDataForTree} /></InMemoryUrlProvider >) : null;
                            case SettingSubgroups.WatermarkTemplate?.toLowerCase():
                                return formControls && profileItems ? (<WatermarkTemplate uniqueName={`${appqaSettingsContainerProps.uniqueName}-watermark-template`} group={SettingGroups.Template} subGroup={SettingSubgroups.WatermarkTemplate} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;

                                {/* {Configure } */ }
                            case PowerConfigureSubGroup.DeviceHealth?.toLowerCase():
                                return formControls ? (<DeviceHealth uniqueName={`${appqaSettingsContainerProps.uniqueName}-device-health`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.DeviceHealth} allowActionList={false} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case PowerConfigureSubGroup.SetInbandIcmpDiscoveryProfiles?.toLowerCase():
                                return formControls && profileItems ? (<SetInbandIcmpDiscoveryProfiles uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-inband-icmp`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SetInbandIcmpDiscoveryProfiles} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.SetInbandTcpDiscoveryProfiles?.toLowerCase():
                                return formControls && profileItems ? (<SetInbandTcpDiscoveryProfiles uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-inband-tcp`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SetInbandTcpDiscoveryProfiles} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.SetInbandWmiDiscoveryProfiles?.toLowerCase():
                                return formControls && profileItems ? (<SetInbandWmiDiscoveryProfiles uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-inband-wmi`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SetInbandWmiDiscoveryProfiles} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.StepTwoOutbandIcmp?.toLowerCase():
                                return formControls && profileItems ? (<StepTwoOutbandIcmp uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-outband-icmp`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.StepTwoOutbandIcmp} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.SetOutbandIpmiDiscoveryProfiles?.toLowerCase():
                                return formControls && profileItems ? (<SetOutbandIpmiDiscoveryProfiles uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-outband-ipmi`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SetOutbandIpmiDiscoveryProfiles} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.SetOutbandSnmpDiscoveryProfiles?.toLowerCase():
                                return formControls && profileItems ? (<SetOutbandSnmpDiscoveryProfiles uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-outband-snmp`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SetOutbandSnmpDiscoveryProfiles} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.SetOutbandSnmpv3DiscoveryProfiles?.toLowerCase():
                                return formControls && profileItems ? (<SetOutbandSnmpv3DiscoveryProfiles uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-outband-snmp-vthree`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SetOutbandSnmpv3DiscoveryProfiles} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.StepTwoOutbandSsh?.toLowerCase():
                                return formControls && profileItems ? (<StepTwoOutbandSsh uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-outband-ssh`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.StepTwoOutbandSsh} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.StepTwoOutbandWsman?.toLowerCase():
                                return formControls && profileItems ? (<StepTwoOutbandWsman uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-two-outband-wsman`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.StepTwoOutbandWsman} featureId={appqaSettingsContainerProps.featureId} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} formControls={formControls} profileItems={profileItems} allowActionList={maxInstances > 1 ? true : false} profileString={maxInstances > 1 ? "" : profileitem?.profileString} id={maxInstances > 1 ? undefined : profileitem?.actionCode} allowAdd={true} allowDelete={true} entityName='_AP' handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.SelectDeviceEventsAndAlerts?.toLowerCase():
                                return formControls && profileItems ? (<SelectDeviceEventsAndAlerts uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-three-device-events-and-alerts`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SelectDeviceEventsAndAlerts} allowActionList={true} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={profileItems} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={false} handleSaveAction={handleSaveForm} handleActionImageClick={handleActionImageClickForm} />) : null;
                            case PowerConfigureSubGroup.SelectPredefinedEventsAndAlerts?.toLowerCase():
                                return formControls ? (<SelectPredefinedEventsAndAlerts uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-three-predefined-events-and-alerts`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SelectPredefinedEventsAndAlerts} allowActionList={false} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            case PowerConfigureSubGroup.SetDcmInstanceAndItsCredentials?.toLowerCase():
                                return formControls ? (<SetDcmInstanceAndItsCredentials uniqueName={`${appqaSettingsContainerProps.uniqueName}-step-four-select-dcm-and-its-credential`} group={PowerConfigureGroup.DiscoveryAndMonitoring} subGroup={PowerConfigureSubGroup.SetDcmInstanceAndItsCredentials} allowActionList={false} featureId={appqaSettingsContainerProps.featureId} formControls={formControls} profileItems={[]} selectedFeatureItem={appqaSettingsContainerProps.selectedFeatureItem} allowAdd={false} allowDelete={false} entityName='_AP' isAutoSave={true} handleValueChange={handleFormElementValueChange} />) : null;
                            default:
                                return null;
                        }
                    })()}
                </div> : <></>}
            </div >}
            <YesNoFormContainer uniqueName={`${appqaSettingsContainerProps.uniqueName}-confirm`}
                isOpen={isShowConfirmDialog}
                message={confirmMessage}
                showOkButton={isShowOkOnly}
                handleOkButtonClick={() => {
                    setIsShowConfirmDialog(false);
                }}
                handleYesButtonClick={handleYesButtonClick}
                handleNoButtonClick={handleNoButtonClick} />

        </div >
    )
}
export { AppqaSettingsContainer }




import { useCallback, useEffect, useRef, useState } from "react";
import { handleNestedZoneContainerKeyDown } from '../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { ICascadeFilterContext } from "../../shared/allinterface/searchfilter/ISearchControlWithFilter";
import { Alertlog, IAlertLogRecord } from "@n20a/libalerts";
import '@n20a/libalerts/style.css'
import '../allcss/AppqaAlerts.css'
import { FnHandleAPIResponse } from "../../shared/allcommon/basic/FnHandleAPIResponse";
import { useStatusBarContext } from "../../shared/context/hooks/StatusBarHooks";
import { useSessionContext } from "../../shared/context/hooks/SessionHooks";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { ALERT, EM } from "../../shared/interceptors/EndPoints";
import { IAppqaAlerts } from "../allinterface/IAppqaAlerts";
import { Label } from "../../shared/basic/label/Label";
import { SearchControlWithFilter } from "../../shared/searchfilter/searchcontrolwithfilter/SearchControlWithFilter";
import { AppqaAlertFilterForm } from "./AppqaAlertFilterForm";
import { IAppqaAlertFilterValues } from "../allinterface/IAppqaAlerts";
import {
    buildAppqaAlertFilterPayload,
    buildDefaultAppqaAlertFilters,
    toApiAndOrFilter,
} from "../allcommon/FnAppqaAlertFilterUtils";

const getValidHtml = (value: unknown): string => {
    try {
        if (typeof value !== "string" || !value.trim()) {
            return "";
        }

        return value
            .replace(/\\{1,}\/+/g, "/")
            .replace(/\\"/g, '"')
            .trim();
    } catch (error) {
        console.error("getValidHtml error:", error);
        return "";
    }
};

const mapToAlertLogRecord = (data: Record<string, any>): IAlertLogRecord => {
    return {
        AlertSeverity: data.Severity,
        IsClosed: data.IsClosed,
        _AlertQueue: data.AlertQueueName,
        AssignedTo: data.AssignedTo,
        AttemptCount: data.AttemptCount,
        LastDelivered: data.LastDelivered,
        AlertProfileName: data.AlertProfileName,
        HTML: typeof data.HTML === "string" ? getValidHtml(data.HTML)
            : "",
        EntityName: data.EntityName,
        EntId: data.EntID,
        AlertEntityName: data.AlertEntityName,
        AlertEntID: data.AlertEntID,
        FileUID: data.FileUID,
        FileType: data.FileType,
        UsersToNotifyJson: data.UsersToNotifyJson,
        AlertID: "",
    };
};

const emptyFilterValues: IAppqaAlertFilterValues = {
    SiteName: '',
    TenantName: '',
    AssignedTo: '',
    Severity: 'All',
    Status: 'All',
    StartDate: '',
    EndDate: '',
    Keywords: '',
    AndOR: 'And',
};

const parseFilteredAlertRecords = (handleApiResp: unknown): Record<string, unknown>[] => {
    if (!handleApiResp || typeof handleApiResp !== "object") {
        return [];
    }

    const response = handleApiResp as Record<string, unknown>;

    if ("alertJson" in response && response.alertJson) {
        const alertJson = response.alertJson;
        if (typeof alertJson === "string") {
            try {
                const parsed: unknown = JSON.parse(alertJson);
                if (Array.isArray(parsed)) {
                    return parsed as Record<string, unknown>[];
                }
                const dataset = FnHandleAPIResponse(alertJson, "Dataset");
                if (Array.isArray(dataset)) {
                    return dataset as Record<string, unknown>[];
                }
            } catch (error) {
                console.error("AppqaAlerts: failed to parse alertJson", error);
            }
        }
    }

    if ("logJson" in response && typeof response.logJson === "string") {
        const dataset = FnHandleAPIResponse(response.logJson, "Dataset");
        if (Array.isArray(dataset)) {
            return dataset as Record<string, unknown>[];
        }
    }

    return [];
};

const AppqaAlerts = (appqaAlertsProps: IAppqaAlerts) => {
    const [alertRecords, setAlertRecords] = useState<IAlertLogRecord[]>([]);
    const [originalAlertData, setOriginalAlertData] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [appliedFilterValues, setAppliedFilterValues] = useState<IAppqaAlertFilterValues>(emptyFilterValues);
    const [hasUserAppliedFilter, setHasUserAppliedFilter] = useState(false);
    const [filterFormKey, setFilterFormKey] = useState(0);
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const statusBarContextRef = useRef(statusBarContext);
    const sessionListRef = useRef(sessionContext.SessionList);
    const handleShowUserMessageRef = useRef(appqaAlertsProps.handleShowUserMessage);
    const initialFetchStartedRef = useRef(false);
    const hasUserAppliedFilterRef = useRef(false);
    const appliedFilterValuesRef = useRef(appliedFilterValues);
    const filterValuesRef = useRef<IAppqaAlertFilterValues>(emptyFilterValues);

    statusBarContextRef.current = statusBarContext;
    appliedFilterValuesRef.current = appliedFilterValues;
    sessionListRef.current = sessionContext.SessionList;
    handleShowUserMessageRef.current = appqaAlertsProps.handleShowUserMessage;

    const applyAlertDataset = useCallback((parsed: Record<string, any>[]) => {
        setOriginalAlertData([...parsed]);
        setAlertRecords(parsed.map(mapToAlertLogRecord));
    }, []);

    const fetchFilteredAlerts = useCallback((
        filters: IAppqaAlertFilterValues,
        options?: { onComplete?: () => void }
    ) => {
        axiosInterceptor({
            url: ALERT.GetFilteredLogs,
            data: {
                filterJsonString: JSON.stringify(buildAppqaAlertFilterPayload(filters)),
                startPage: 0,
                recordCount: 0,
            },
            allowShowLoader: true,
            setFetchData: (handleApiResp: unknown, status?: string) => {
                try {
                    if (status === "200") {
                        applyAlertDataset(parseFilteredAlertRecords(handleApiResp) as Record<string, any>[]);
                    } else {
                        applyAlertDataset([]);
                    }
                } catch (error) {
                    console.error("AppqaAlerts: failed to process filtered alert response", error);
                    handleShowUserMessageRef.current?.("Invalid data to show");
                    applyAlertDataset([]);
                } finally {
                    setLoading(false);
                    options?.onComplete?.();
                }
            },
        }, statusBarContextRef.current);
    }, [applyAlertDataset]);

    const fetchFilteredAlertsRef = useRef(fetchFilteredAlerts);
    fetchFilteredAlertsRef.current = fetchFilteredAlerts;

    useEffect(() => {
        if (initialFetchStartedRef.current) {
            return;
        }
        initialFetchStartedRef.current = true;
        const defaults = buildDefaultAppqaAlertFilters(sessionListRef.current);
        filterValuesRef.current = defaults;
        setAppliedFilterValues(defaults);
        setLoading(true);
        fetchFilteredAlertsRef.current(defaults);
    }, []);

    const handleFilterFormClick = useCallback(() => {
        setFilterOpen((previous) => {
            const opening = !previous;
            if (opening) {
                if (hasUserAppliedFilterRef.current) {
                    filterValuesRef.current = { ...appliedFilterValuesRef.current };
                }
                setFilterFormKey((key) => key + 1);
            }
            return opening;
        });
    }, []);

    const handleFilterChange = useCallback((
        values: IAppqaAlertFilterValues,
        options?: { isDefault?: boolean }
    ) => {
        if (options?.isDefault && hasUserAppliedFilterRef.current) {
            return;
        }
        filterValuesRef.current = values;

        if (options?.isDefault && !hasUserAppliedFilterRef.current) {
            setAppliedFilterValues(values);
            fetchFilteredAlertsRef.current(values);
        }
    }, []);

    const applyAlertFilters = useCallback((appliedFilters: IAppqaAlertFilterValues) => {
        filterValuesRef.current = appliedFilters;
        setAppliedFilterValues(appliedFilters);
        hasUserAppliedFilterRef.current = true;
        setHasUserAppliedFilter(true);
        fetchFilteredAlertsRef.current(appliedFilters);
    }, []);

    const handleFilterFormData = useCallback((_data: Record<string, unknown>) => {
        const appliedFilters: IAppqaAlertFilterValues = {
            ...filterValuesRef.current,
            Keywords: appliedFilterValuesRef.current.Keywords ?? '',
            AndOR: appliedFilterValuesRef.current.AndOR ?? 'And',
        };
        setFilterOpen(false);
        applyAlertFilters(appliedFilters);
    }, [applyAlertFilters]);

    const handleLensFormData = useCallback((data: Record<string, unknown>) => {
        const appliedFilters: IAppqaAlertFilterValues = {
            ...appliedFilterValuesRef.current,
            Keywords: String(data.Keywords ?? '').trim(),
            AndOR: toApiAndOrFilter(data.AndOR ?? data.ANDOR),
        };
        applyAlertFilters(appliedFilters);
    }, [applyAlertFilters]);

    const handleOnRefreshStatus = useCallback(async (): Promise<void> => {
        fetchFilteredAlertsRef.current(appliedFilterValuesRef.current);
    }, []);

    const renderAppqaAlertFilterForm = useCallback((context: ICascadeFilterContext) => (
        <AppqaAlertFilterForm
            key={filterFormKey}
            uniqueName={context.uniqueName}
            loginType={context.loginType}
            profileSiteName={context.profileSiteName}
            hasUserAppliedFilter={hasUserAppliedFilter}
            initialFilterValues={
                hasUserAppliedFilter
                    ? appliedFilterValues
                    : filterValuesRef.current
            }
            onCascadeValuesChange={context.onValuesChange}
            onFilterChange={handleFilterChange}
        />
    ), [appliedFilterValues, filterFormKey, hasUserAppliedFilter, handleFilterChange]);

    const handleAssignToMe = async (entityName: string, entId: string, code: string): Promise<void> => {
        const loginuser = sessionContext.SessionList.find((item) => item.VariableName === "LoginShortName");

        const alertToUpdate = originalAlertData.find((item) => item.EntID === entId);
        if (alertToUpdate && loginuser?.SessionValue) {
            alertToUpdate.AssignedTo = loginuser?.SessionValue ?? "";
            const payload = {
                ["_AlertQueue"]: [{
                    AlertProfileName: alertToUpdate.AlertProfileName,
                    MessageSource: alertToUpdate.MessageSource,
                    AlertProfileID: alertToUpdate.AlertProfileID,
                    EscalationLevel: alertToUpdate.EscalationLevel,
                    AttemptCount: alertToUpdate.AttemptCount,
                    Severity: alertToUpdate.AlertSeverity,
                    AssignedTo: alertToUpdate.AssignedTo,
                    _AlertQueue: alertToUpdate.AlertQueueName,
                    HTML: alertToUpdate.HTML,
                    EntityName: entityName,
                    EntID: alertToUpdate.EntID,
                    RecID: alertToUpdate.RecID
                }]
            };
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payload)
                },
                allowShowLoader: true,
                setFetchData: ((addTableRecordApiResponse: unknown, status) => {
                    if (addTableRecordApiResponse !== undefined && status === '200') {
                        appqaAlertsProps.handleShowUserMessage?.("Alert is assigned to: " + alertToUpdate.AssignedTo)
                    }
                    else {
                        appqaAlertsProps.handleShowUserMessage?.("Somthing went wrong while assign alert")
                    }

                })
            }, statusBarContext)
        }

    }

    const handleStatusChange = async (entityName: string, entId: string, code: string): Promise<void> => {

        const alertToUpdate = originalAlertData.find((item) => item.EntID === entId);
        if (alertToUpdate) {
            if (code?.toLowerCase() === "close") {
                alertToUpdate.IsClosed = true;
            }
            else {
                alertToUpdate.IsClosed = false;
            }
            const payload = {
                ["_AlertQueue"]: [{
                    AlertProfileName: alertToUpdate.AlertProfileName,
                    MessageSource: alertToUpdate.MessageSource,
                    AlertProfileID: alertToUpdate.AlertProfileID,
                    EscalationLevel: alertToUpdate.EscalationLevel,
                    AttemptCount: alertToUpdate.AttemptCount,
                    Severity: alertToUpdate.AlertSeverity,
                    AssignedTo: alertToUpdate.AssignedTo,
                    _AlertQueue: alertToUpdate.AlertQueueName,
                    IsClosed: alertToUpdate.IsClosed,
                    HTML: alertToUpdate.HTML,
                    EntityName: entityName,
                    EntID: alertToUpdate.EntID,
                    RecID: alertToUpdate.RecID
                }]
            };
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payload)
                },
                allowShowLoader: true,
                setFetchData: ((addTableRecordApiResponse: unknown, status) => {
                    if (addTableRecordApiResponse !== undefined && status === '200') {
                        handleOnRefreshStatus()
                        appqaAlertsProps.handleShowUserMessage?.("Status of alert: " + alertToUpdate.AlertProfileName + " is changed with: " + (code ?? "close"))
                    }
                    else {
                        appqaAlertsProps.handleShowUserMessage?.("Somthing went wrong while change status of alert")
                    }
                })
            }, statusBarContext)
        }
    }
    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading alert logs...</div>;
    }

    return (
        <div
            className='nz-appqa-alerts-container' tabIndex={1} onKeyDown={handleNestedZoneContainerKeyDown}
            key={appqaAlertsProps.uniqueName}
        >
            <div className='nz-sub-header'>
                <Label uniqueName={`${appqaAlertsProps.uniqueName}-task-header`} label={`${appqaAlertsProps.headerText}`} />
            </div>
            <div className={`nz-appqa-alerts-search-control ${filterOpen ? 'nz-appqa-alerts-search-control-open' : ''}`}>
                <SearchControlWithFilter
                    uniqueName={`${appqaAlertsProps.uniqueName}-alert-filter`}
                    controls={[]}
                    filterIconTooltip='Filter'
                    fromProfileString={JSON.stringify(appliedFilterValues)}
                    allowSiteUserCascade
                    loginType='user'
                    cascadeControlNames={['sitename', 'tenantname', 'assignedto']}
                    renderCascadeFilter={renderAppqaAlertFilterForm}
                    handleFilterFormData={handleFilterFormData}
                    handleLensFormData={handleLensFormData}
                    handleFilterFormClick={handleFilterFormClick}
                    searchProps={{
                        uniqueName: `${appqaAlertsProps.uniqueName}-alert-search`,
                        isShowFilterControl: true,
                        hideRightMouseMenu: false,
                        lensDirty: false,
                        filterDirty: false,
                        searchInputValue: '',
                        hideSearchControl: false,
                        searchValueChange: () => undefined,
                        handleFilterMouse: () => undefined,
                        handleLensMouse: () => undefined,
                    }}
                />
            </div>
            <div
                className='nz-appqa-alerts-body'
                style={{ display: filterOpen ? 'none' : 'block' }}
            >
                <Alertlog
                    alertRecords={alertRecords}
                    onRefreshStatus={handleOnRefreshStatus}
                    onAssignToMe={handleAssignToMe}
                    onStatusChange={handleStatusChange}
                />
            </div>
        </div>
    )
}

export default AppqaAlerts


import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";
import { EditableCallbackParams, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import '../../allcss/sidebar//ForensicLog.css'
import { FnCellEditorSelector } from '../../allcommon/tablegrid/FnCellEditorSelector';
import { FnGetSessionVariableFromStorage } from '../../allcommon/basic/FnGetSessionVariableFromStorage';
import {
    IBasicGridColDef,
    IColumnWidthEntry,
    IForensicLogPaginationPayload,
    IFilteredLogApiResponse,
    TGridRow,
    TGridRowData,
} from '../../allinterface/tablegrid/IBasicGrid';
import { IDateRangeField, IForensicLog, IForensicLogColumn, IForensicLogFilterFormData, IForensicLogPayload, IForensicLogTableData } from '../../allinterface/sidebar/IForensicLog';
import { SearchControlWithFilter } from '../../searchfilter/searchcontrolwithfilter/SearchControlWithFilter';
import { SiteTenantUserCascade } from './SiteTenantUserCascade';
import { FnHandleAPIResponse } from '../../allcommon/basic/FnHandleAPIResponse';
import { useSessionContext } from '../../context/hooks/SessionHooks';
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks';
import { handleNestedZoneContainerKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown';
import { LOG } from '../../interceptors/EndPoints';
import { formControls } from '../../../../sampledata/FormControlsForensicLogFilter';
import { axiosInterceptor } from '../../interceptors/Interceptor';
import { FnGetColumnWidthFromSession } from '../../allcommon/tablegrid/FnGetColumnWidthFromSession';
import { FORENSIC_LOG_EM_TABLE, FnGetDataGridColumnHide, getExcludeDataGridFieldValue } from '../../allcommon/tablegrid/FnGetDataGridColumnHide';
import { useMainAppContext } from '../../context/hooks/MainAppHooks';
import { AgGridReact } from 'ag-grid-react';
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';
import { ISession } from '../../context/allinterface/ISession';
import { BasicGrid } from '../../tablegrid/BasicGrid';
import { IControl } from '../../allinterface/settingsform/ISettingsLibForm';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { getDateFormat } from '../../context/contextandprovider/ExplorerTree';

const padDatePart = (value: number) => value.toString().padStart(2, '0');

/*Format year/month/day using app date format without UTC timezone shift. */
const formatLocalCalendarDate = (year: number, month: number, day: number): string => {
    const format = getDateFormat();
    if (format === 'MM/dd/yyyy') {
        return `${padDatePart(month)}/${padDatePart(day)}/${year}`;
    }
    return `${padDatePart(day)}/${padDatePart(month)}/${year}`;
};


/*API expects StartDate / EndDate as MM/DD/YYYY (e.g. 06/10/2026) — same calendar day user picked. */
const formatForensicLogDate = (dateValue: unknown): string => {
    if (dateValue == null || dateValue === '') {
        return '';
    }

    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return formatLocalCalendarDate(
            dateValue.getFullYear(),
            dateValue.getMonth() + 1,
            dateValue.getDate()
        );
    }

    const dateText = String(dateValue).trim();
    if (!dateText) {
        return '';
    }

    // Date picker value (e.g. 04/05/2026) — do not run through UTC conversion.
    const slashParts = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashParts) {
        const first = Number(slashParts[1]);
        const second = Number(slashParts[2]);
        const year = Number(slashParts[3]);
        const format = getDateFormat();
        if (format === 'MM/dd/yyyy') {
            return formatLocalCalendarDate(year, first, second);
        }
        return formatLocalCalendarDate(year, second, first);
    }

    // ISO date only (YYYY-MM-DD) — use date parts as-is, not UTC midnight.
    const isoParts = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoParts) {
        return formatLocalCalendarDate(
            Number(isoParts[1]),
            Number(isoParts[2]),
            Number(isoParts[3])
        );
    }

    return FnConvertDateToUtcOrUtcToDate(dateText, false, false);
};

/*API payload expects StartDate / EndDate in yyyy-mm-dd format. */
const formatForensicLogDateForPayload = (dateValue: unknown): string => {
    if (dateValue == null || dateValue === '') {
        return '';
    }

    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        const year = dateValue.getFullYear();
        const month = padDatePart(dateValue.getMonth() + 1);
        const day = padDatePart(dateValue.getDate());
        return `${year}-${month}-${day}`;
    }

    const dateText = String(dateValue).trim();
    if (!dateText) {
        return '';
    }

    // Match YYYY-MM-DD (e.g. 2026-09-27 or 2026-09-27 13:45:30 or ISO)
    const isoParts = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoParts) {
        const year = isoParts[1];
        const month = padDatePart(Number(isoParts[2]));
        const day = padDatePart(Number(isoParts[3]));
        return `${year}-${month}-${day}`;
    }

    // Match DD/MM/YYYY or MM/DD/YYYY from date picker
    const slashParts = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashParts) {
        const first = Number(slashParts[1]);
        const second = Number(slashParts[2]);
        const year = Number(slashParts[3]);
        const format = getDateFormat();
        let month: string;
        let day: string;
        if (format === 'MM/dd/yyyy') {
            month = padDatePart(first);
            day = padDatePart(second);
        } else {
            day = padDatePart(first);
            month = padDatePart(second);
        }
        return `${year}-${month}-${day}`;
    }

    const parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = padDatePart(parsed.getMonth() + 1);
        const day = padDatePart(parsed.getDate());
        return `${year}-${month}-${day}`;
    }

    return dateText;
};

/*Initial API payload: last 24 hours as yyyy-mm-dd. */
const getInitialPayloadStartDate = (): string => {
    const start = new Date();
    start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
    return formatForensicLogDateForPayload(start);
};

const getInitialPayloadEndDate = (): string => formatForensicLogDateForPayload(new Date());

/*Form controls: calendar date only (e.g. 07/01/2026). */
const getDefaultFormStartDate = (): string => {
    const start = new Date();
    start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
    return formatForensicLogDate(start);
};

const getDefaultFormEndDate = (): string => formatForensicLogDate(new Date());

/*Narrow unknown API / form values to a plain object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

/*dateRange control stores { startDate, endDate } instead of flat StartDate / EndDate. */
const isDateRangeField = (value: unknown): value is IDateRangeField =>
    isRecord(value) && ('startDate' in value || 'endDate' in value);

const isForensicLogColumn = (value: unknown): value is IForensicLogColumn =>
    isRecord(value) &&
    typeof value.PropertyLabel === 'string' &&
    typeof value.PName === 'string';

const toForensicLogColumnArray = (value: unknown): IForensicLogColumn[] | null => {
    if (!Array.isArray(value)) {
        return null;
    }
    const columns = value.filter(isForensicLogColumn);
    return columns.length > 0 ? columns : null;
};

const toGridRowData = (value: unknown): TGridRowData | null =>
    Array.isArray(value) ? value as TGridRowData : null;

const isColumnWidthEntryArray = (value: unknown): value is IColumnWidthEntry[] =>
    Array.isArray(value) &&
    value.every(
        (entry) =>
            isRecord(entry) &&
            typeof entry.colname === 'string' &&
            typeof entry.colwidth === 'number'
    );

const getDisplayControlFromColDef = (colDef: EditableCallbackParams['colDef']): string | undefined => {
    if (!colDef || !('DisplayControl' in colDef)) {
        return undefined;
    }
    const displayControl = colDef.DisplayControl;
    return typeof displayControl === 'string' ? displayControl : undefined;
};

/*Read dates from dateRange control or legacy StartDate / EndDate fields. */
const extractFilterDates = (filters: Record<string, unknown>) => {
    const dateRange = filters.dateRange;
    if (isDateRangeField(dateRange)) {
        return { start: dateRange.startDate, end: dateRange.endDate };
    }

    for (const key of Object.keys(filters)) {
        if (!key.toLowerCase().includes("daterange")) {
            continue;
        }
        const value = filters[key];
        if (isDateRangeField(value)) {
            return { start: value.startDate, end: value.endDate };
        }
    }

    return { start: filters.StartDate, end: filters.EndDate };
};

/*API uses StartDate / EndDate only — not dateRange objects. */
const removeDateRangeFields = (payload: Record<string, unknown>) => {
    delete payload.dateRange;
    Object.keys(payload).forEach((key) => {
        if (key.toLowerCase().includes("daterange")) {
            delete payload[key];
        }
    });
};

/*API expects "AND" / "OR". */
const normalizeForensicLogAndOr = (value: unknown): string => {
    const normalized = String(value ?? 'AND').trim().toUpperCase();
    return normalized === 'OR' ? 'OR' : 'AND';
};

/*API uses StartDate / EndDate only — not dateRange objects. */
const normalizeForensicLogNameFilter = (value: unknown): string => {
    const normalized = String(value ?? '').trim();
    if (!normalized || normalized.toLowerCase() === 'all') {
        return '';
    }
    return normalized;
};

const buildForensicLogFilterPayload = (filters: Record<string, unknown>, removeUserName?: boolean): Record<string, unknown> => {

    const payload: Record<string, unknown> = { ...filters };
    const rawAndOr = payload.AndOR ?? payload.ANDOR;
    delete payload.ANDOR;
    payload.AndOR = normalizeForensicLogAndOr(rawAndOr);

    delete payload.CompanyName;

    payload.Keywords = typeof payload.Keywords === 'string' ? payload.Keywords : '';

    payload.SiteName = normalizeForensicLogNameFilter(payload.SiteName);
    payload.TenantName = normalizeForensicLogNameFilter(payload.TenantName);

    const normalizedUserName = normalizeForensicLogNameFilter(payload.UserName);
    payload.Users = normalizedUserName
        ? normalizedUserName.toLowerCase()
        : '';
    if (removeUserName) {
        delete payload.UserName
    }
    if (!payload.TenantName) {
        payload.TenantName = '';
    }

    const { start, end } = extractFilterDates(filters);
    removeDateRangeFields(payload);

    const startDate = formatForensicLogDateForPayload(start);
    const endDate = formatForensicLogDateForPayload(end);
    payload.StartDate = startDate || '';
    payload.EndDate = endDate || '';

    return payload;
};

const ForensicLog = (props: IForensicLog) => {
    const [columnDefs, setColumnDefs] = useState<IBasicGridColDef[]>([]);
    const [rowData, setRowData] = useState<TGridRowData | null | undefined>()
    const [forensicLogTableData, setForensicLogTableData] = useState<IForensicLogTableData | null>(null);
    const [filterOpen, setFilterOpen] = useState<boolean>(false)
    const [dynamicHeight, setDynamicHeight] = useState<number>(290)
    const [totalRecords, setTotalRecords] = useState<number>(0)
    const [filterControl, setFilterControl] = useState<IControl[] | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [fromProfile, setFromProfile] = useState<string>('')
    const [hasUserAppliedFilter, setHasUserAppliedFilter] = useState(false)
    const [initRecordCount, setInitRecordCout] = useState<number>(0)
    const sessionData = useSessionContext()
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const gridRef = useRef<AgGridReact>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = gridContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            window.dispatchEvent(new Event('resize'));
        });

        resizeObserver.observe(container);
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!filterOpen) {
            const timer = setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [filterOpen]);

    useEffect(() => {
        if (rowData && rowData.length > 0) {
            const timer = setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [rowData]);

    useEffect(() => {
        const api = gridRef.current?.api;
        if (!api || columnDefs.length === 0) return;
        const visibleCols = api.getAllGridColumns()?.filter((col) => !col.isPinned() && col.isVisible());
        if (visibleCols && visibleCols.length > 0) {
            const lastCol = visibleCols[visibleCols.length - 1];
            api.applyColumnState({
                state: [
                    {
                        colId: lastCol.getColId(),
                        flex: 1,
                    }
                ],
                applyOrder: false,
            });
        }
    }, [columnDefs]);
    const sessionFilterInitializedRef = useRef(false);
    const initialApiLoadedRef = useRef(false);
    const selectedNodeReloadKeyRef = useRef<string>('');
    const emRecordsRef = useRef(mainAppContext.emRecords);
    const forensicColumnBuildKeyRef = useRef<string | null>(null);
    const completedForensicColumnBuildKeyRef = useRef<string | null>(null);

    emRecordsRef.current = mainAppContext.emRecords;
    const emRecordsLoaded = mainAppContext.emRecords.length > 0;

    const appliedProfileFilters = useMemo((): Record<string, unknown> => {
        if (!fromProfile) {
            return {};
        }
        const parsed: unknown = FnParseJsonSafely(fromProfile);
        return isRecord(parsed) ? parsed : {};
    }, [fromProfile]);

    useEffect(() => {
        if (forensicLogTableData === null) {
            forensicColumnBuildKeyRef.current = null;
            completedForensicColumnBuildKeyRef.current = null;
            setRowData(null);
            setFilterOpen(false);
            setDynamicHeight(290);
            return;
        }

        const buildKey = JSON.stringify({
            columnPNames: forensicLogTableData.ColumnList?.map((column) => column.PName) ?? [],
            dataset: forensicLogTableData.Dataset,
            emRecordsLoaded,
        });

        if (completedForensicColumnBuildKeyRef.current === buildKey) {
            return;
        }
        forensicColumnBuildKeyRef.current = buildKey;

        let cancelled = false;

        const FnSetColumnDefsWidth = async () => {
            try {
                const columnsSettingsRaw = await FnGetColumnWidthFromSession('nz_forcensic_log', "", statusBarContext);
                if (cancelled) {
                    return;
                }

                const columnsSettings = isColumnWidthEntryArray(columnsSettingsRaw) ? columnsSettingsRaw : null;
                const resposeData = forensicLogTableData.Dataset;
                const columnListData = forensicLogTableData.ColumnList;
                if (!columnListData) {
                    return;
                }

                const colDefs: IBasicGridColDef[] = [];
                for (let index = 0; index < columnListData.length; index++) {
                    const column = columnListData[index];
                    const width = columnsSettings?.find((c: IColumnWidthEntry) => c.colname === column.PName)?.colwidth;
                    const columnSession = columnsSettings?.find((c: IColumnWidthEntry) => c.colname === column.PropertyLabel);
                    const isHidden = columnSession?.isHidden;
                    const excludeDataGridField = getExcludeDataGridFieldValue(
                        column.ExcludeDataGridField,
                        emRecordsRef.current,
                        FORENSIC_LOG_EM_TABLE,
                        column.PName
                    );

                    const colDef: IBasicGridColDef = {
                        headerName: column.PropertyLabel,
                        field: column.PName,
                        width: width ?? 150,
                        DisplayControl: column.DisplayControl,
                        resizable: true,
                        hide: FnGetDataGridColumnHide(isHidden, excludeDataGridField),
                        editable: (params: EditableCallbackParams) => {
                            const displayControl = getDisplayControlFromColDef(params.colDef);
                            return !!displayControl && displayControl !== "TextControl" &&
                                !displayControl.toLowerCase().includes("apform_");
                        },
                        cellEditorSelector: (params) => {
                            return FnCellEditorSelector(params);
                        },
                        cellRenderer: (params: ICellRendererParams) => {
                            return <span>{params.value}</span>;
                        }
                    };

                    if (column.PropertyLabel && column.PropertyLabel.trim() !== "") {
                        if (column.PName?.toLowerCase() === "lastupdated") {
                            colDef.cellRenderer = (params: ICellRendererParams) => {
                                return <span>{params.value ? FnConvertDateToUtcOrUtcToDate(params.value, false, true) : ""}</span>;
                            };
                        }
                        colDefs.push(colDef);
                    }
                }

                if (colDefs.length > 0) {
                    let lastVisibleIndex = -1;
                    for (let i = colDefs.length - 1; i >= 0; i--) {
                        if (!colDefs[i].hide) {
                            lastVisibleIndex = i;
                            break;
                        }
                    }
                    const targetIndex = lastVisibleIndex >= 0 ? lastVisibleIndex : colDefs.length - 1;
                    colDefs.forEach((col, idx) => {
                        if (idx === targetIndex) {
                            col.flex = 1;
                            delete col.width;
                            delete col.initialWidth;
                            col.minWidth = 100;
                            col.resizable = false;
                        } else {
                            delete col.flex;
                        }
                    });
                }

                if (cancelled) {
                    return;
                }

                completedForensicColumnBuildKeyRef.current = buildKey;
                setColumnDefs(colDefs);
                if (resposeData && resposeData.length > 0) {
                    setRowData(resposeData);
                } else {
                    setRowData([]);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }
                console.error('ForensicLog: failed to build column definitions', error);
                setColumnDefs([]);
                setRowData([]);
            }
        };

        FnSetColumnDefsWidth();

        return () => {
            cancelled = true;
        };
    }, [forensicLogTableData, emRecordsLoaded])


    useEffect(() => {

        const selectedNodeReloadKey =
            String(props.selectedNode?.NodeEntID ?? '');

        if (selectedNodeReloadKey !== selectedNodeReloadKeyRef.current) {
            selectedNodeReloadKeyRef.current = selectedNodeReloadKey;
            initialApiLoadedRef.current = false;
            sessionFilterInitializedRef.current = false;
            setHasUserAppliedFilter(false);
            setLoading(true);
        }

        if (initialApiLoadedRef.current || hasUserAppliedFilter) {
            return;
        }


        const calculateProperRecordCount = (): number => {
            let div: HTMLElement | null = gridContainerRef.current
                || (props.isSetting
                    ? (document.querySelector('.nz-main-search-control-log') || document.querySelector('.nz-logs-grid'))
                    : (document.querySelector('.nz-sidebar-container') || document.querySelector('.nz-main-search-control-log'))) as HTMLElement | null;

            if (div) {
                let divHeight = div.offsetHeight || 0;
                let subtract = 92;
                if (divHeight > subtract) {
                    let endRec = Math.floor((divHeight - subtract) / 24);
                    return Math.max(1, endRec) + 1;
                }
            }
            return 8;
        };

        const init = async () => {
            const defaultStartDate = getInitialPayloadStartDate();
            const defaultEndDate = getInitialPayloadEndDate();
            const isNodeFilter = String(props.loginType ?? '').toLowerCase() === 'node';
            let userDetails: ISession[] | null = FnGetSessionVariableFromStorage("RequestedBy", 'LoginShortName', sessionData.SessionList)
            let defaultSite: ISession[] | null = FnGetSessionVariableFromStorage("Location", "SiteName", sessionData.SessionList)
            let TenantNameObj: ISession[] | null = FnGetSessionVariableFromStorage("Filter", "TenantName", sessionData.SessionList)
            if (userDetails && userDetails?.length > 0 && defaultSite && defaultSite?.length > 0 && TenantNameObj && TenantNameObj?.length > 0) {
                initialApiLoadedRef.current = true;
                const initialRecordCount = calculateProperRecordCount();
                apiCallForGridData({
                    sessionId: statusBarContext.userSessionId ?? "",
                    filterJsonString: JSON.stringify({
                        Users: userDetails[0].SessionValue,
                        AndOR: "AND",
                        Keywords: "",
                        FilterBy: props.loginType,
                        SiteName: defaultSite[0].SessionValue,
                        TenantName: TenantNameObj[0].SessionValue,
                        StartDate: isNodeFilter ? '' : defaultStartDate,
                        EndDate: isNodeFilter ? '' : defaultEndDate,
                    }),
                    startPage: 1,
                    recordCount: isNodeFilter ? 100 : (initRecordCount > 0 ? initRecordCount : initialRecordCount)
                })
            }

        }
        init()
    }, [sessionData.SessionList, hasUserAppliedFilter, props.selectedNode])


    const apiCallForGridData = async (
        payload: IForensicLogPayload & IForensicLogPaginationPayload,
        isdownload?: boolean
    ) => {
        if (payload?.filterJsonString) {
            try {
                const parsedFilters: unknown = JSON.parse(payload.filterJsonString);
                if (isRecord(parsedFilters)) {
                    payload.filterJsonString = JSON.stringify(buildForensicLogFilterPayload(parsedFilters, true));
                }
            } catch (error) {
                // Keep original filterJsonString when profile JSON is invalid.
                console.error('ForensicLog: invalid filterJsonString', error);
            }
        }
        const isNodeFilter = String(props.loginType ?? '').toLowerCase() === 'node';
        let div: HTMLElement | null = gridContainerRef.current
            || (props.isSetting
                ? (document.querySelector('.nz-main-search-control-log') || document.querySelector('.nz-logs-grid'))
                : (document.querySelector('.nz-sidebar-container') || document.querySelector('.nz-main-search-control-log'))) as HTMLElement | null;

        if (isNodeFilter && !isdownload) {
            // FilterBy "Node": request up to 100 records.
            payload.recordCount = 100;
            setInitRecordCout(100);
        } else if (!isdownload) {
            let divHeight = div?.offsetHeight || 0;
            let subtract = 92;
            let endRec = divHeight > subtract ? Math.floor((divHeight - subtract) / 24) : 7;
            if (endRec < 1) {
                endRec = 7;
            }
            const properCount = endRec + 1;
            payload.recordCount = properCount;
            setInitRecordCout(properCount);
        }
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();
        const handleApiGetFilteredLogResponse = async (response: IFilteredLogApiResponse) => {
            if (!response?.logJson) {
                return;
            }

            try {
                let TotalRecords = 0;
                const rawResponse = response as Record<string, unknown>;
                if (rawResponse?.recordCount != null) {
                    TotalRecords = Number(rawResponse.recordCount) || 0;
                } else if (rawResponse?.RecordCount != null) {
                    TotalRecords = Number(rawResponse.RecordCount) || 0;
                } else if (rawResponse?.totalRecords != null) {
                    TotalRecords = Number(rawResponse.totalRecords) || 0;
                } else if (rawResponse?.TotalRecords != null) {
                    TotalRecords = Number(rawResponse.TotalRecords) || 0;
                }

                try {
                    const logs = JSON.parse(response.logJson) as Record<string, unknown>;
                    if (!TotalRecords) {
                        if (logs?.recordCount != null) {
                            TotalRecords = Number(logs.recordCount) || 0;
                        } else if (logs?.RecordCount != null) {
                            TotalRecords = Number(logs.RecordCount) || 0;
                        } else if (logs?.totalRecords != null) {
                            TotalRecords = Number(logs.totalRecords) || 0;
                        } else if (logs?.TotalRecords != null) {
                            TotalRecords = Number(logs.TotalRecords) || 0;
                        }
                    }

                    if (!TotalRecords) {
                        const data: unknown[] = Object.values(logs);
                        if (data.length > 0) {
                            const rowdata = data[0];
                            if (Array.isArray(rowdata) && rowdata.length > 0) {
                                const firstRow = rowdata[0];
                                if (isRecord(firstRow)) {
                                    if (firstRow.TotalRecords != null) {
                                        TotalRecords = Number(firstRow.TotalRecords) || 0;
                                    } else if (firstRow.RecordCount != null) {
                                        TotalRecords = Number(firstRow.RecordCount) || 0;
                                    } else if (firstRow.recordCount != null) {
                                        TotalRecords = Number(firstRow.recordCount) || 0;
                                    } else if (firstRow.totalRecords != null) {
                                        TotalRecords = Number(firstRow.totalRecords) || 0;
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('ForensicLog: failed to parse TotalRecords from logJson', error);
                }

                const resposeData = toGridRowData(FnHandleAPIResponse(response.logJson, "Dataset"));
                const columnListData = toForensicLogColumnArray(FnHandleAPIResponse(response.logJson, "ColumnList"));

                if (!TotalRecords && resposeData) {
                    TotalRecords = resposeData.length;
                }

                // FilterBy "Node": pagination total = returned record length (100 if 100, else actual length).
                if (isNodeFilter && !isdownload) {
                    const apiRecordLength = resposeData?.length ?? 0;
                    TotalRecords = apiRecordLength === 100 ? 100 : apiRecordLength;
                    payload.recordCount = TotalRecords;
                    setInitRecordCout(TotalRecords);
                }

                if (!isdownload) {
                    setForensicLogTableData({ Dataset: resposeData, ColumnList: columnListData, apiParams: payload });
                } else {
                    try {
                        const headers: string[] = [];
                        let sortedColumnKeys: string[] = [];

                        columnListData?.forEach((item: IForensicLogColumn) => {
                            headers.push(item.PropertyLabel);
                            sortedColumnKeys.push(item.PName)
                        });

                        const rows: (string | number)[][] = [];
                        if (headers.length > 0) {
                            rows.push(headers);
                        }

                        resposeData?.forEach((dataRow: TGridRow) => {
                            const orderedRow = sortedColumnKeys.map((key) => {
                                const cellValue = dataRow[key];
                                if (cellValue == null) {
                                    return '';
                                }
                                if (typeof cellValue === 'string' || typeof cellValue === 'number') {
                                    return cellValue;
                                }
                                return String(cellValue);
                            });
                            rows.push(orderedRow);
                        });

                        const worksheet = XLSX.utils.aoa_to_sheet(rows);
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'forensiclog');

                        // Export workbook
                        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([wbout], {
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        });
                        saveAs(blob, `forensiclog.xlsx`);
                    } catch (error) {
                        console.error('ForensicLog: failed to export forensic log', error);
                        props.handleShowUserMessage?.('Unable to export forensic log. Please try again.');
                    }
                }
                setTotalRecords(TotalRecords);
                setLoading(false);
            } catch (error) {
                console.error('ForensicLog: failed to process filtered log response', error);
                setRowData([]);
                setLoading(false);
            }
        }
        axiosInterceptor({
            url: LOG.GetFilteredLog,
            data: payload,
            allowShowLoader: true,
            setFetchData: handleApiGetFilteredLogResponse
        }, statusBarContext)
    }

    const handleDownloadData = async () => {
        let userDetails: ISession[] | null = FnGetSessionVariableFromStorage("RequestedBy", 'LoginShortName', sessionData.SessionList)
        let defaultSite: ISession[] | null = FnGetSessionVariableFromStorage("Location", "SiteName", sessionData.SessionList)
        let TenantNameObj: ISession[] | null = FnGetSessionVariableFromStorage("Filter", "TenantName", sessionData.SessionList)
        let profileFilters: IForensicLogFilterFormData = {};
        try {
            if (fromProfile?.length) {
                const parsedProfile: unknown = JSON.parse(fromProfile);
                if (isRecord(parsedProfile)) {
                    profileFilters = parsedProfile;
                }
            }
        } catch (error) {
            console.error('ForensicLog: invalid fromProfile JSON for download', error);
            profileFilters = {};
        }
        // Download requires session defaults when profile fields are missing.
        if (userDetails && userDetails?.length > 0 && defaultSite && defaultSite?.length > 0 && TenantNameObj && TenantNameObj?.length > 0) {
            const cleanedProfileFilters = { ...profileFilters };
            delete cleanedProfileFilters.ANDOR;
            apiCallForGridData({
                filterJsonString: JSON.stringify({
                    ...cleanedProfileFilters,
                    Users: profileFilters.UserName ?? userDetails[0].SessionValue,
                    AndOR: normalizeForensicLogAndOr(profileFilters.AndOR ?? profileFilters.ANDOR),
                    Keywords: profileFilters.Keywords ?? "",
                    FilterBy: props.loginType,
                    SiteName: profileFilters.SiteName ?? defaultSite[0].SessionValue,
                    TenantName: profileFilters.TenantName ?? TenantNameObj[0].SessionValue,
                }),
                startPage: 1,
                recordCount: totalRecords,
            },
                true
            )
        }
    }


    useEffect(() => {
        if (hasUserAppliedFilter) {
            return;
        }

        const setValueForFilter = async () => {
            const defaultStartDate = getDefaultFormStartDate();
            const defaultEndDate = getDefaultFormEndDate();
            let data: IControl[] = []
            const gridColumns = ["StartDate", "EndDate"]
            const userDetails: ISession[] | null = FnGetSessionVariableFromStorage("RequestedBy", 'LoginShortName', sessionData.SessionList)
            const defaultSite: ISession[] | null = FnGetSessionVariableFromStorage("Location", "SiteName", sessionData.SessionList)
            const TenantNameObj: ISession[] | null = FnGetSessionVariableFromStorage("Filter", "TenantName", sessionData.SessionList)
            let profile: Record<string, string | null> = {}

            for (let index = 0; index < gridColumns.length; index++) {
                const element = gridColumns[index];
                if (element !== '') {
                    const staticData = formControls.find((item: IControl) => item.Name?.toLowerCase() === element?.toLowerCase())

                    if (element === "StartDate" && staticData) {
                        const valueOFStaticData: IControl = { ...staticData, DefaultAPValue: defaultStartDate }
                        data.push(valueOFStaticData)
                    } else if (element === "EndDate" && staticData) {
                        const valueOFStaticData: IControl = { ...staticData, DefaultAPValue: defaultEndDate }
                        data.push(valueOFStaticData)
                    }
                }
            }
            if (defaultSite?.length) {
                profile.SiteName = defaultSite[0].SessionValue ?? ""
            }
            if (TenantNameObj?.length) {
                profile.TenantName = TenantNameObj[0].SessionValue ?? ""
            }
            if (userDetails?.length) {
                profile.UserName = userDetails[0].SessionValue?.toLowerCase() ?? ""
            }
            if (data.length > 0) {
                setFilterControl([...data])
                if (!sessionFilterInitializedRef.current) {
                    // Date range reads StartDate / EndDate from profile when session fields are present.
                    setFromProfile(JSON.stringify({
                        ...profile,
                        StartDate: defaultStartDate,
                        EndDate: defaultEndDate,
                    }))
                    sessionFilterInitializedRef.current = true;
                }
            } else {
                setFilterControl(null)
            }
        }
        setValueForFilter()
    }, [sessionData.SessionList, hasUserAppliedFilter])


    useEffect(() => {
        const sidebarContainer: HTMLElement | null = document.querySelector('.nz-qa-sidebar-container');
        if (sidebarContainer) {
            // Select all AG Grids inside the sidebar only
            const gridPanelsInSidebar = sidebarContainer.querySelectorAll('.nz-qa-sidebar-container .ag-paging-panel');

            gridPanelsInSidebar.forEach((panel) => {
                const recordCount = panel.querySelector('.custom-record-count') as HTMLElement;
                const summaryPanel = panel.querySelector('.ag-paging-row-summary-panel') as HTMLElement;

                const width = panel.getBoundingClientRect().width;

                if (recordCount) {
                    recordCount.style.display = width < 475 ? 'none' : 'inline-block';
                }
                if (summaryPanel) {
                    summaryPanel.style.display = width < 375 ? 'none' : 'inline-block';
                }
            });
        }
    }, [rowData])

    return (
        <div className='nz-forensic-log-root' tabIndex={1} onKeyDown={handleNestedZoneContainerKeyDown}>
            <div className='nz-main-search-control-log'>
                <div className={rowData && rowData.length > 0 ? 'nz-log-searchControl' : 'nz-searchControl-not-display'} >
                    {filterControl &&
                        <SearchControlWithFilter
                            controls={filterControl}
                            filterIconTooltip='Filter'
                            fromProfileString={fromProfile}
                            allowSiteUserCascade
                            loginType={props.loginType}
                            renderCascadeFilter={({
                                uniqueName,
                                loginType,
                                profileSiteName,
                                onValuesChange,
                            }) => (
                                <SiteTenantUserCascade
                                    uniqueName={uniqueName}
                                    loginType={loginType}
                                    profileSiteName={profileSiteName}
                                    initialSiteName={
                                        hasUserAppliedFilter
                                            ? String(appliedProfileFilters.SiteName ?? '')
                                            : undefined
                                    }
                                    initialTenantName={
                                        hasUserAppliedFilter
                                            ? String(appliedProfileFilters.TenantName ?? '')
                                            : undefined
                                    }
                                    initialUserName={
                                        hasUserAppliedFilter
                                            ? String(appliedProfileFilters.UserName ?? '')
                                            : undefined
                                    }
                                    onValuesChange={onValuesChange}
                                />
                            )}
                            handleFilterFormData={(data: Record<string, unknown>) => {
                                setFilterOpen(false);
                                setHasUserAppliedFilter(true);
                                gridRef.current?.api?.paginationGoToPage(0);
                                // Flatten dateRange to StartDate / EndDate so reopening the filter restores dates.
                                const normalizedFilters = buildForensicLogFilterPayload(data);

                                function buildHeaderFilterString(filters: Record<string, unknown>): string {
                                    const formatLabel = (key: string): string =>
                                        key.replace(/([a-z])([A-Z])/g, '$1 $2');

                                    const parts = Object.entries(filters)
                                        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                        .map(([key, value]) => {
                                            return `${formatLabel(key)}: ${value}`;
                                        });

                                    return parts.length ? `(${parts.join(' | ')})` : '';
                                }

                                props.handleUpdateHeaderTitle && props.handleUpdateHeaderTitle(buildHeaderFilterString(normalizedFilters))
                                if (Object.keys(normalizedFilters).length > 0) {
                                    const isNodeFilter = String(props.loginType ?? '').toLowerCase() === 'node';
                                    const filtersWithFilterBy = {
                                        ...normalizedFilters,
                                        FilterBy: props.loginType,
                                    };
                                    setFromProfile(JSON.stringify(filtersWithFilterBy))
                                    apiCallForGridData({
                                        filterJsonString: JSON.stringify(filtersWithFilterBy), startPage: 1,
                                        recordCount: isNodeFilter ? 100 : (initRecordCount > 0 ? initRecordCount : 8)
                                    })
                                }
                            }}
                            handleFilterFormClick={() => {
                                setFilterOpen((previous) => !previous);
                            }}
                            uniqueName={'search-log'}
                            searchProps={{
                                uniqueName: "filtericon",
                                isShowFilterControl: true, //show filter control.
                                lensDirty: false,
                                filterDirty: false,
                                searchInputValue: '',
                                hideRightMouseMenu: false,
                                hideSearchControl: false,
                                searchValueChange: (value: string) => { },// to pass input value of parent control.
                                handleFilterMouse: () => { },// handle mouse event for filter
                                handleLensMouse: (selectedCondion: string) => { },// handle mouse event for lens
                            }} />
                    }
                </div>
                <div ref={gridContainerRef} className={filterOpen ? `nz-logs-grid nz-log-filter-open ${props.isSetting ? "" : "nz-exproer-log"}` : `nz-logs-grid  ${props.isSetting ? "" : "nz-exproer-filter-close-log"}`}>

                    {loading ? (
                        <div className="nz-forensic-log-loading nz-forensic-log-no-data-to-show">Loading...</div>
                    ) : rowData && rowData.length > 0 && dynamicHeight ? (
                        <BasicGrid
                            gridRef={gridRef}
                            showGrid={true}
                            uniqueName={"nz_forcensic_log"}
                            allowAutoSizeColumn={false}
                            containerName={props.isSetting ? "nz_forcensic_log" : "nz_f_log_setting"}
                            instanceName="nz_forcensic_log"
                            featureId={props.featureId}
                            allowColumnResize={true}
                            isExportOnCopy={true}
                            rowData={rowData}
                            isReadOnly={true}
                            allowColumnFilter={true}
                            columnDefs={columnDefs}
                            allowPagination={true}
                            dynamicPagination={true}
                            paginationAutoPageSize={true}
                            paginationPageSize={initRecordCount > 1 ? (initRecordCount - 1) : 7}
                            allowSort={props.allowSort}
                            totalRecords={totalRecords}
                            // Pass mutable API payload for dynamic pagination; undefined until first successful load.
                            apiPayloadForPagination={forensicLogTableData?.apiParams ? forensicLogTableData.apiParams : undefined}
                            featureData={undefined}
                            initRecordCount={initRecordCount}
                            loginType={props.loginType}
                            handleDownloadData={handleDownloadData}
                            handleGridReady={(params: GridReadyEvent) => {
                                const api = params.api;
                                setTimeout(() => {
                                    window.dispatchEvent(new Event('resize'));
                                    if (!api) return;
                                    const visibleCols = api.getAllGridColumns()?.filter((col) => !col.isPinned() && col.isVisible());
                                    if (visibleCols && visibleCols.length > 0) {
                                        const lastCol = visibleCols[visibleCols.length - 1];
                                        api.applyColumnState({
                                            state: [
                                                {
                                                    colId: lastCol.getColId(),
                                                    flex: 1,
                                                }
                                            ],
                                            applyOrder: false,
                                        });
                                    }
                                }, 50);
                            }}
                        />
                    ) : (
                        // case 3: no data
                        rowData && rowData.length === 0 && (
                            <div className="nz-forensic-log-no-data-to-show">Forensic log details not found.</div>
                        )
                    )}
                </div>
            </div>
        </div>

    )
}



export { ForensicLog }

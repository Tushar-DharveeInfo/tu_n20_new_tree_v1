
import { useCallback, useEffect, useRef, useState } from "react"
import { Splitter, SplitterPanel } from "primereact/splitter"
import '@n20a/libform/style.css'
import '../../allcss/techrefresh/EditDeviceReplacement.css'
import { IEditDeviceReplacement, IPortDataItem, IPropertyDefinition } from "../../allinterface/techrefresh/IEditDeviceReplacement"
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor"
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks"
import { ALERT, CABLING, DEVICE, EM, LOG } from "../../../shared/interceptors/EndPoints"
import { FnHandleAPIResponse } from "../../../shared/allcommon/basic/FnHandleAPIResponse"
import { ColDef, ICellRendererParams } from "ag-grid-community"
import { DevicePortGrid } from "./DevicePortGrid"
import { getDiagnosticLevelData } from "../../../shared/context/contextandprovider/CommonVariable"
import { hideGridData } from "../../../shared/alldefaultprops/tablegrid/DefaultPropsBasicGrid"
import { Label } from "../../../shared/basic/label/Label"
import { DELIMITER } from "../../../shared/alldefaultprops/basic/DefaultPropsChekedListBoxControl"
import { BasicGrid } from "../../../shared/tablegrid/BasicGrid"
import { IPlacementDevice } from "../../../shared/allinterface/plan/IEditFloorLayout"
import { ValueRenderer } from "./ValueRenderer"
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks"
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl"
import { DcTreeContainer } from "./DcTreeContainer"
import { FnCallApiForUpdateDeviceWoProfile, FnCreateWorkOrderApiCalls, FnFindMessageAndReplaceVariables, FnGetWorkOrderProfile, callAPIForGetWorkorderName } from "../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls"
import { OverlayTab } from "../../../shared/basic/overlaytab/OverlayTab"
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable"
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage"
import { OpenSidebar24x24 } from "@n20a/libicon"
import { FEnums } from "../../../constants/Feature"
import { IChangeMeta, YesNoControl, Workorderlog, IWorkorderRecord, IWorkorderItem } from "@n20a/libform"
import '@n20a/libform/style.css'
import '../../allcss/rackandstack/WorkOrderContainer.css'
import { IBasicGridColDef } from "../../../shared/allinterface/tablegrid/IBasicGrid"
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely"
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer"
import { EntityNameEnums } from "../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer"
import { GeneratePdf } from "../../../shared/generatepdf/GeneratePdf"
import { TReportLayoutJson } from "../../../shared/allinterface/IGeneratePdf"
import { FnCreateReportForPrint } from "../../../shared/allcommon/generatepdf/FnCreateReportForPrint"
import { FnUpdateSession } from "../../../shared/allcommon/FnUpdateSession"
import { ISessionVariable } from "../../../shared/allinterface/basic/ISessionVariable"
import { useSelectedNodeContext } from "../../../shared/context/hooks/SelectedNodeHooks"
import { FnGetSessionVariableFromStorage } from "../../../shared/allcommon/basic/FnGetSessionVariableFromStorage"


type GridValue = string | number | boolean | null | undefined;
type BasicPropItem = { Name: string; Value: GridValue; PropertyLabel: string };
type UnknownRecord = Record<string, unknown>;
type ParsedWorkorderItem = {
    ItemJson?: string | UnknownRecord;
    _WorkorderProfile?: string;
    _workorderProfile?: string;
};

const parseUtcDateToLocal = (dateInput: string | Date | undefined | null): Date | undefined => {
    if (!dateInput) return undefined;
    if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? undefined : dateInput;

    const str = String(dateInput).trim();
    if (!str) return undefined;

    const dateOnlyMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch.map(Number);
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? undefined : d;
    }

    if (/Z$/i.test(str) || /[+-]\d{2}(:?\d{2})?$/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? undefined : d;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/i.test(str)) {
        const d = new Date(`${str}Z`);
        return isNaN(d.getTime()) ? undefined : d;
    }

    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? undefined : fallback;
};

const mapProfilesToWorkorderRecords = (profiles: UnknownRecord[], fallbackWoid: string): IWorkorderRecord[] => {
    const rows = profiles.length ? profiles : (fallbackWoid ? [{ _WorkorderProfile: fallbackWoid }] : []);
    return rows.map((item): IWorkorderRecord => ({
        ...item,
        _Site: String((item as UnknownRecord)._Site ?? ""),
        _Room: String((item as UnknownRecord)._Room ?? ""),
        _Floor: String((item as UnknownRecord)._Floor ?? ""),
        _Workorder: String(
            (item as UnknownRecord)._WorkorderProfile
            ?? (item as UnknownRecord)._Workorder
            ?? fallbackWoid
            ?? ""
        ),
        Desc250: String((item as UnknownRecord).Desc250 ?? (item as UnknownRecord).DESC250 ?? ""),
        WorkorderType: String((item as UnknownRecord).WorkorderType ?? "Replacement"),
        DateCreated: parseUtcDateToLocal((item as UnknownRecord).DateCreated as string | Date | undefined),
        CreatedBy: String((item as UnknownRecord).CreatedBy ?? ""),
        DateApproved: parseUtcDateToLocal((item as UnknownRecord).DateApproved as string | Date | undefined),
        ApprovedBy: String((item as UnknownRecord).ApprovedBy ?? ""),
        DateExecuted: parseUtcDateToLocal((item as UnknownRecord).DateExecuted as string | Date | undefined),
        ExecutedBy: String((item as UnknownRecord).ExecutedBy ?? ""),
        DateAssigned: parseUtcDateToLocal((item as UnknownRecord).DateAssigned as string | Date | undefined),
        AssignedBy: String((item as UnknownRecord).AssignedBy ?? ""),
        AssignedTo: String((item as UnknownRecord).AssignedTo ?? ""),
        Instructions: String((item as UnknownRecord).Instructions ?? ""),
        Status: String((item as UnknownRecord).Status ?? ""),
    }));
};

const mapItemsToWorkorderItems = (items: ParsedWorkorderItem[], fallbackWoid: string): IWorkorderItem[] => {
    return items.map((item, index) => {
        let parsed: UnknownRecord = {};
        try {
            parsed = typeof item.ItemJson === "string"
                ? JSON.parse(item.ItemJson) as UnknownRecord
                : (item.ItemJson ?? {});
        } catch {
            parsed = {};
        }
        const source = (parsed.source ?? {}) as UnknownRecord;
        const dest = (parsed.dest ?? {}) as UnknownRecord;
        const raw = item as unknown as UnknownRecord;
        return {
            _Workorder: String(parsed.Workordername ?? raw._WorkorderProfile ?? raw._Workorder ?? fallbackWoid ?? ""),
            SeqNo: Number(raw.SeqNo ?? index + 1),
            Operation: String(parsed.action ?? raw.Operation ?? ""),
            SourceEntityName: String(source.EntityName ?? "Device"),
            SourceEntId: String(source.EntId ?? ""),
            TargetEntityName: String(dest.EntityName ?? ""),
            TargetEntId: String(dest.EntId ?? ""),
            Instructions: String(parsed.Instructions ?? ""),
            message: parsed.message as string | undefined,
            Status: String(raw.Status ?? "")
        };
    });
};


const EditDeviceReplacement = (editDeviceReplacementProps: IEditDeviceReplacement) => {
    const [columnDefsPowerPort, setColumnDefsPowerPort] = useState<ColDef[]>();
    const [columnDefsNetworkPort, setColumnDefsNetworkPort] = useState<ColDef[]>();
    const [leftDeviceBasicProps, setLeftDeviceBasicProps] = useState<BasicPropItem[]>([]);
    const [leftPowerPortData, setLeftPowerPortData] = useState<IPortDataItem[]>([]);
    const [leftNetworkPortData, setLeftNetworkPortData] = useState<IPortDataItem[]>([]);
    const [rightDeviceBasicProps, setRightDeviceBasicProps] = useState<BasicPropItem[]>([]);
    const rightDeviceBasicPropsRef = useRef<BasicPropItem[]>([]);
    rightDeviceBasicPropsRef.current = rightDeviceBasicProps;
    const [leftDevicePath, setLeftDevicePath] = useState<string>();
    const [isTransferPortLabel, setIsTransferPortLabel] = useState<boolean>(false);

    const [rightPowerPortData, setRightPowerPortData] = useState<IPortDataItem[]>([]);
    const [rightNetworkPortData, setRightNetworkPortData] = useState<IPortDataItem[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<IPlacementDevice>();
    const [rightDevicePath, setRightDevicePath] = useState<string>();
    const [defaultSelectedNode, setDefaultSelectedNode] = useState<ITreeNode>();
    const [isPortChanged, setIsPortChanged] = useState<boolean>(false)
    const [deviceWorkorderProfile, setDeviceWorkorderProfile] = useState<string>("");
    const [isLeftDeviceLoading, setIsLeftDeviceLoading] = useState<boolean>(false);
    const [restoreTrigger, setRestoreTrigger] = useState<number>(0);
    const [isOptedOut, setIsOptedOut] = useState<boolean>(false);

    const getReplacementTemplateWoid = useCallback((): string => {
        if (isOptedOut) return "";
        const node = editDeviceReplacementProps.selectedNodeExplorer as any;
        let woid =
            node?.ReplacementTemplateWOID
            ?? node?.ReplacementTemplate
            ?? node?.ReplacementProfile
            ?? node?.replacementProfile;
        if (!woid || String(woid).trim().toLowerCase() === "null" || String(woid).trim().toLowerCase() === "undefined") {
            woid = rightDeviceBasicPropsRef.current.find(
                (item: BasicPropItem) =>
                    item.Name?.toLowerCase() === "replacementtemplatewoid" ||
                    item.Name?.toLowerCase() === "replacementtemplate" ||
                    item.Name?.toLowerCase() === "replacementprofile"
            )?.Value?.toString().trim();
        }
        if (!woid || String(woid).trim().toLowerCase() === "null" || String(woid).trim().toLowerCase() === "undefined") {
            woid = rightDeviceBasicProps.find(
                (item: BasicPropItem) =>
                    item.Name?.toLowerCase() === "replacementtemplatewoid" ||
                    item.Name?.toLowerCase() === "replacementtemplate" ||
                    item.Name?.toLowerCase() === "replacementprofile"
            )?.Value?.toString().trim();
        }
        if (!woid || String(woid).trim().toLowerCase() === "null" || String(woid).trim().toLowerCase() === "undefined") {
            return deviceWorkorderProfile || "";
        }
        return String(woid).trim();
    }, [
        isOptedOut,
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.ReplacementTemplateWOID,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.ReplacementTemplate,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.ReplacementProfile,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.replacementProfile,
        deviceWorkorderProfile,
        rightDeviceBasicProps
    ]);
    const sessionContext = useSessionContext();
    const statusbarContext = useStatusBarContext();
    const selectedNodeContext = useSelectedNodeContext();

    const [popupWorkorderId, setPopupWorkorderId] = useState<string>("");
    const [popupWorkorderRecords, setPopupWorkorderRecords] = useState<IWorkorderRecord[]>([]);
    const [popupWorkorderItems, setPopupWorkorderItems] = useState<IWorkorderItem[]>([]);

    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>();
    const [userAction, setUserAction] = useState<{ action: "DELETE"; wo: string }>();

    const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);

    const handleGetWorkOrderItems = (_workorder: string): IWorkorderItem[] => {
        const filteredItems = popupWorkorderItems.filter((item) => item._Workorder?.toLowerCase() === _workorder?.toLowerCase());
        if (filteredItems) {
            filteredItems.sort((a, b) => a.SeqNo - b.SeqNo);
            return filteredItems;
        } else {
            return [];
        }
    };

    const persistReplacementProfile = async (woid: string) => {
        if (!woid) return;
        const node = editDeviceReplacementProps.selectedNodeExplorer as any;
        if (node) {
            node.ReplacementTemplateWOID = woid;
            node.ReplacementTemplate = woid;
            node.ReplacementProfile = woid;
        }
        try {
            await FnCallApiForUpdateDeviceWoProfile(
                editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? "",
                woid,
                statusbarContext,
                editDeviceReplacementProps.featureId
            );
        } catch (err) {
            console.error("Error updating device workorder profile:", err);
        }
        editDeviceReplacementProps.handleReloadTree?.(
            editDeviceReplacementProps.featureId,
            editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? ""
        );
    };

    // Stubs for handlers not required to be implemented
    const handleApproveWorkorder = (_data: { _workorder: string; DateApproved?: Date; ApprovedBy: string }) => { };
    const handleWorkorderAssign = (_data: { _workorder: string; DateAssigned?: Date; AssignedBy: string; AssignedTo: string }) => { };
    const handleExecuteWorkorder = (_workorder: string) => { };
    const handleRefreshWorkorder = (_workorder: string) => { };
    const handleGetUserNameList = (): string[] => [];
    const handleSetWorkorderItemNotes = (_workorderItem: IWorkorderItem) => { };
    const handleSetWorkOrderRecord = (_workorderRecord: IWorkorderRecord) => { };

    // Delete handler
    const handleDeleteWorkorder = async (_workorder: string): Promise<void> => {
        const workOrderRecord = popupWorkorderRecords?.find(
            (item) => item._Workorder?.toLowerCase() === _workorder?.toLowerCase()
        );

        if (!workOrderRecord || !(workOrderRecord as Record<string, any>).EntID) {
            editDeviceReplacementProps.handleShowUserMessage?.(`Workorder(${_workorder}) not found to delete`);
            return;
        }
        const handleCreateMessageApiResponse = (createMessageApiResponse: unknown) => {
            if (createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                setIsConfirmOpen(true);
                setUserAction({
                    action: "DELETE",
                    wo: _workorder
                });
            }
        };
        axiosInterceptor({
            url: LOG.CreateMessage,
            data: {
                projectInitial: "Common",
                msgID: "151"
            },
            setFetchData: handleCreateMessageApiResponse
        }, statusbarContext);
    };

    const handleConfirmYesClick = (): void => {
        if (userAction && userAction.action === "DELETE") {
            setIsConfirmOpen(false);
            const workOrderRecord = popupWorkorderRecords?.find(
                (item) => item._Workorder?.toLowerCase() === userAction.wo?.toLowerCase()
            );

            if (!workOrderRecord || !(workOrderRecord as Record<string, any>).EntID) {
                editDeviceReplacementProps.handleShowUserMessage?.(`Workorder(${workOrderRecord?._Workorder}) not found to delete`);
                return;
            }
            const entID = (workOrderRecord as Record<string, any>).EntID;

            axiosInterceptor({
                url: EM.DeleteTableRecords,
                data: {
                    entityName: EntityNameEnums.WorkorderProfile,
                    tableName: "PG.WorkorderItem",
                    entIDs: entID
                },
                setFetchData: (_: unknown, status?: string) => {
                    if (status === "200") {
                        axiosInterceptor({
                            url: EM.DeleteTableRecords,
                            data: {
                                entityName: EntityNameEnums.WorkorderProfile,
                                tableName: `_${EntityNameEnums.WorkorderProfile}`,
                                entIDs: entID
                            },
                            setFetchData: async (_: unknown, status?: string) => {
                                if (status === "200") {
                                    const devEntId = editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? "";
                                    if (devEntId) {
                                        try {
                                            await FnCallApiForUpdateDeviceWoProfile(
                                                devEntId,
                                                "",
                                                statusbarContext,
                                                FEnums.ReplacementProfile
                                            );
                                        } catch (err) {
                                            console.error("Error clearing device replacement template:", err);
                                        }
                                    }
                                    editDeviceReplacementProps.handleShowUserMessage?.(
                                        `Workorder(${workOrderRecord._Workorder}) deleted successfully`
                                    );
                                    setIsOptedOut(true);
                                    setPopupWorkorderId("");
                                    setPopupWorkorderRecords([]);
                                    setPopupWorkorderItems([]);
                                    setDeviceWorkorderProfile("");
                                    const node = editDeviceReplacementProps.selectedNodeExplorer as any;
                                    if (node) {
                                        node.ReplacementTemplateWOID = "";
                                        node.ReplacementTemplate = "";
                                        node.ReplacementProfile = "";
                                        node.replacementProfile = "";
                                    }
                                    editDeviceReplacementProps.handleReloadTree?.(
                                        editDeviceReplacementProps.featureId,
                                        devEntId
                                    );
                                }
                            }
                        }, statusbarContext);
                    }
                }
            }, statusbarContext);
        }
    };

    // Print handler
    const handlePrintWorkorder = async (workorder: {
        workorderEntityname: string;
        workorderEntityId: string;
    }) => {
        try {
            const workOrderRecord = popupWorkorderRecords?.find(
                (item) => item._Workorder === workorder.workorderEntityId
            );
            if (workOrderRecord && selectedNodeContext?.setSelectedWorkorderRecord) {
                selectedNodeContext.setSelectedWorkorderRecord(workOrderRecord);
            }
            statusbarContext.setIsLoading(true);
            const sessionData: ISessionVariable[] = [
                {
                    VariableContext: "Workorder",
                    VariableName: "SelectedWorkorder",
                    SessionValue: workorder.workorderEntityId,
                },
            ];
            await FnUpdateSession(sessionData, sessionContext, statusbarContext);

            const result = await FnCreateReportForPrint(
                "Workorder",
                statusbarContext,
                undefined,
                undefined
            );
            if (result && result.template) {
                setReportTemplateJson(result.template as TReportLayoutJson);
                setIsReportDialogOpen(true);
            } else {
                statusbarContext?.setUserActionData?.("Workorder Report Template not found.");
            }
        } catch (error) {
            console.error("Error printing workorder:", error);
            statusbarContext?.setUserActionData?.("Failed to generate workorder report.");
        } finally {
            statusbarContext.setIsLoading(false);
        }
    };
    const columnDefsForDeviceProps: IBasicGridColDef[] = [
        { field: "id", hide: true },

        {
            field: "PropertyLabel",
            headerName: "Name",
            cellClass: "nz-name-cell nz-read-only-property-cell",
            suppressMovable: true,
            resizable: true,
            editable: false

        },

        {
            field: "Value",
            headerName: "Value",
            flex: 1,
            cellDataType: "text",
            resizable: false,
            cellClass: "text-control-cellvalue-cell nz-read-only-property-cell",
            suppressMovable: true,
            minWidth: 100,
            editable: false,
            cellRendererSelector: () => ({
                component: ValueRenderer,
            }),
        },
    ];


    // drag and drop
    const leftPowerPortGridRef = useRef<HTMLDivElement>(null);
    const leftNetworkPortGridRef = useRef<HTMLDivElement>(null);

    const rightPowerPortGridRef = useRef<HTMLDivElement>(null);
    const rightNetworkPortGridRef = useRef<HTMLDivElement>(null);


    const draggedRowPowerPortRef = useRef<IPortDataItem | null>(null);
    const draggedRowNetworkPortRef = useRef<IPortDataItem | null>(null);

    const dropTargetRowPowerPortRef = useRef<IPortDataItem | null>(null);
    const dropTargetRowNetworkPortRef = useRef<IPortDataItem | null>(null);

    const rowDraggedFromRef = useRef<'power' | 'network' | null>(null);
    const dragSourceGridRef = useRef<'left' | 'right' | null>(null);
    const restoredMappingTokenRef = useRef<string>("");
    const restoreInProgressRef = useRef<boolean>(false);
    const prevSelectedNodeEntIdRef = useRef<string | undefined>(undefined);

    const leftPowerPortDataRef = useRef<IPortDataItem[]>([]);
    const leftNetworkPortDataRef = useRef<IPortDataItem[]>([]);
    const rightPowerPortDataRef = useRef<IPortDataItem[]>([]);
    const rightNetworkPortDataRef = useRef<IPortDataItem[]>([]);

    useEffect(() => {
        leftPowerPortDataRef.current = leftPowerPortData;
    }, [leftPowerPortData]);
    useEffect(() => {
        leftNetworkPortDataRef.current = leftNetworkPortData;
    }, [leftNetworkPortData]);
    useEffect(() => {
        rightPowerPortDataRef.current = rightPowerPortData;
    }, [rightPowerPortData]);
    useEffect(() => {
        rightNetworkPortDataRef.current = rightNetworkPortData;
    }, [rightNetworkPortData]);

    useEffect(() => {
        return () => {
            leftPowerPortGridRef.current = null;
            leftNetworkPortGridRef.current = null;
            rightPowerPortGridRef.current = null;
            rightNetworkPortGridRef.current = null;
            draggedRowNetworkPortRef.current = null;
            draggedRowPowerPortRef.current = null;
            dropTargetRowNetworkPortRef.current = null;
            dropTargetRowPowerPortRef.current = null;
            rowDraggedFromRef.current = null;
            dragSourceGridRef.current = null;
            restoredMappingTokenRef.current = "";
            restoreInProgressRef.current = false;
        }
    }, [])

    const workorderCacheRef = useRef<Map<string, { profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }>>(new Map());
    const workorderInFlightRef = useRef<Map<string, Promise<{ profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }>>>(new Map());
    const activeWorkorderNodeEntIdRef = useRef<string | undefined>(undefined);
    const activeWorkorderWoidRef = useRef<string | undefined>(undefined);
    const restorePendingRef = useRef<boolean>(false);

    const fetchWorkorderDetails = useCallback(
        async (woid: string, forceFresh = false): Promise<{ profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }> => {
            const trimmed = (woid || "").trim();
            if (!trimmed) {
                return { profiles: [], items: [] };
            }
            const cacheKey = trimmed.toLowerCase();
            const currentNodeEntId = (editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? "").toString().trim();

            const isNodeChanged = activeWorkorderNodeEntIdRef.current !== currentNodeEntId;
            const isWoidChanged = activeWorkorderWoidRef.current !== cacheKey;

            // 1. If an exact request for this WOID is already in flight, reuse and await that promise
            // (prevents parallel duplicate network calls across effects)
            if (workorderInFlightRef.current.has(cacheKey)) {
                return workorderInFlightRef.current.get(cacheKey)!;
            }

            // 2. If not forcing fresh and node/woid haven't changed, return cached data
            if (!forceFresh && !isNodeChanged && !isWoidChanged && workorderCacheRef.current.has(cacheKey)) {
                return workorderCacheRef.current.get(cacheKey)!;
            }

            activeWorkorderNodeEntIdRef.current = currentNodeEntId;
            activeWorkorderWoidRef.current = cacheKey;
            if (forceFresh || isNodeChanged || isWoidChanged) {
                workorderCacheRef.current.delete(cacheKey);
            }

            const fetchPromise = new Promise<{ profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }>((resolve) => {
                axiosInterceptor({
                    url: DEVICE.WorkorderDetails,
                    data: { woid: trimmed },
                    setFetchData: (resp: unknown, status?: string) => {
                        if (status !== "200" || !resp || typeof resp !== "object") {
                            resolve({ profiles: [], items: [] });
                            return;
                        }

                        try {
                            const responseData = resp as Record<string, unknown>;
                            const deviceJsonValue = responseData.deviceJson ?? responseData.devicesJson;
                            const deviceJson = typeof deviceJsonValue === "string" ? JSON.parse(deviceJsonValue) : (deviceJsonValue ?? responseData);
                            const detailsData = typeof (deviceJson as any)?.Data === "string" ? JSON.parse((deviceJson as any).Data) : ((deviceJson as any)?.Data ?? (responseData as any)?.Data ?? deviceJson);

                            let profileRows: UnknownRecord[] = [];
                            const candidateProfiles =
                                (detailsData as any)?._WorkorderProfile ??
                                (detailsData as any)?.WorkorderProfile ??
                                (detailsData as any)?.workorderProfile ??
                                (deviceJson as any)?._WorkorderProfile ??
                                (deviceJson as any)?.WorkorderProfile ??
                                (deviceJson as any)?.workorderProfile ??
                                (responseData as any)?._WorkorderProfile ??
                                (responseData as any)?.WorkorderProfile ??
                                (responseData as any)?.workorderProfile;

                            if (Array.isArray(candidateProfiles)) {
                                profileRows = candidateProfiles;
                            } else if (candidateProfiles && typeof candidateProfiles === "object") {
                                profileRows = [candidateProfiles];
                            } else if (Array.isArray(detailsData)) {
                                profileRows = detailsData;
                            } else if (detailsData && typeof detailsData === "object") {
                                profileRows = [detailsData];
                            }

                            let itemRows = profileRows.flatMap((profile: UnknownRecord) => {
                                const items =
                                    (profile as any)?.["PG.WorkorderItem"] ??
                                    profile?.workorderitems ??
                                    profile?.workorderItems ??
                                    profile?.WorkorderItems ??
                                    profile?.items ??
                                    profile?.Items;
                                return Array.isArray(items) ? items : [];
                            });

                            if (!itemRows.length) {
                                const directItems =
                                    (detailsData as any)?.["PG.WorkorderItem"] ??
                                    (deviceJson as any)?.["PG.WorkorderItem"] ??
                                    (responseData as any)?.["PG.WorkorderItem"] ??
                                    (deviceJson as any)?.WorkorderItems ??
                                    (deviceJson as any)?.workorderitems ??
                                    (deviceJson as any)?.Items ??
                                    (deviceJson as any)?.items ??
                                    (responseData as any)?.WorkorderItems ??
                                    (responseData as any)?.Items;
                                if (Array.isArray(directItems)) {
                                    itemRows = directItems;
                                }
                            }

                            resolve({
                                profiles: profileRows,
                                items: itemRows
                            });
                        } catch (error) {
                            console.error('Error in handle api response :', error);
                            resolve({ profiles: [], items: [] });
                        }
                    }
                }, statusbarContext);
            });

            workorderInFlightRef.current.set(cacheKey, fetchPromise);

            try {
                const result = await fetchPromise;
                workorderCacheRef.current.set(cacheKey, result);
                return result;
            } finally {
                workorderInFlightRef.current.delete(cacheKey);
            }
        },
        [statusbarContext, editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID]
    );

    useEffect(() => {
        let cancelled = false;
        const woid = getReplacementTemplateWoid();
        if (!woid) {
            setPopupWorkorderId("");
            setPopupWorkorderRecords([]);
            setPopupWorkorderItems([]);
            return;
        }

        setPopupWorkorderId((prev) => (prev === woid ? prev : woid));
        setPopupWorkorderRecords((prev) => {
            const currentId = prev[0]?._Workorder ?? "";
            if (currentId && currentId.toLowerCase() !== woid.toLowerCase()) return [];
            return prev;
        });
        setPopupWorkorderItems((prev) => {
            const currentId = prev[0]?._Workorder ?? "";
            if (currentId && currentId.toLowerCase() !== woid.toLowerCase()) return [];
            return prev;
        });

        fetchWorkorderDetails(woid)
            .then((details) => {
                if (cancelled) return;
                const records = mapProfilesToWorkorderRecords(details.profiles, woid);
                const items = mapItemsToWorkorderItems(details.items, woid);
                if (records.length) setPopupWorkorderRecords(records);
                if (items.length) setPopupWorkorderItems(items);
            })
            .catch((err) => {
                console.error("Error loading replacement workorder log:", err);
            });

        return () => {
            cancelled = true;
        };
    }, [
        getReplacementTemplateWoid,
        fetchWorkorderDetails,
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        deviceWorkorderProfile,
        isOptedOut
    ]);

    // ── Clear X marks whenever the selected device changes ──
    // This runs independently of the workorder-restore effect so it is never
    // blocked by token guards, restoreInProgress, or missing EQIDs.
    useEffect(() => {
        const clearRowMark = (row: IPortDataItem): IPortDataItem => {
            const cleaned = { ...row } as Record<string, unknown>;
            delete cleaned.dragInPortType;
            cleaned.tooltip = "";
            cleaned.transferportlabel = false;
            cleaned.connectedportEntityName = "";
            cleaned.connectedportEntId = "";
            return cleaned as IPortDataItem;
        };

        // Always clear unconditionally via functional updaters — they always
        // receive the latest state so there is no stale-closure or stale-ref risk.
        setLeftPowerPortData((prev) => prev.map(clearRowMark));
        setRightPowerPortData((prev) => prev.map(clearRowMark));
        setLeftNetworkPortData((prev) => prev.map(clearRowMark));
        setRightNetworkPortData((prev) => prev.map(clearRowMark));

        // Reset the restore token so the workorder-restore effect re-runs
        // and applies fresh marks for the newly selected device.
        restoredMappingTokenRef.current = "";
    }, [
        defaultSelectedNode?.NodeEntID,
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID
    ]);

    useEffect(() => {
        if (editDeviceReplacementProps.featureId === FEnums.ReplacementProfile) {
            const normalize = (value: unknown) =>
                value?.toString().toLowerCase().replace(/[^a-z0-9#]+/g, "").trim() ?? "";
            const getString = (value: unknown) => value?.toString().trim() ?? "";

            interface IParsedEndpoint {
                raw: string;
                deviceName: string;
                portName: string;
                segments: string[];
            }

            interface IDeviceTargetInfo {
                eqid: string;
                name: string;
                entityName: string;
                props: BasicPropItem[];
            }

            const parseEndpoint = (value: unknown): IParsedEndpoint => {
                if (value && typeof value === "object") {
                    const obj = value as Record<string, unknown>;
                    const name = getString(obj.Name ?? obj.DeviceName ?? obj._Device ?? obj.Device ?? obj.PortName ?? obj.CompositePortName);
                    const path = getString(obj.Path ?? obj.CompositeName ?? obj.CompositePortName ?? obj.sourcePath ?? obj.destPath);
                    const rawStr = path || name || "";
                    if (rawStr && rawStr.includes("->")) {
                        const segments = rawStr.split("->").map((s) => s.trim()).filter(Boolean);
                        const portName = segments[segments.length - 1] ?? "";
                        const deviceName = getString(obj.DeviceName ?? obj._Device) || (segments.length >= 2 ? segments[segments.length - 2] : "");
                        return {
                            raw: rawStr,
                            deviceName,
                            portName,
                            segments
                        };
                    }
                    if (rawStr && rawStr.includes(".")) {
                        const segments = rawStr.split(".").map((s) => s.trim()).filter(Boolean);
                        const portName = segments[segments.length - 1] ?? "";
                        const firstSegment = segments[0] ?? "";
                        const deviceName = firstSegment.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                        return { raw: rawStr, deviceName, portName, segments };
                    }
                    return {
                        raw: rawStr,
                        deviceName: getString(obj.DeviceName ?? obj._Device),
                        portName: name || rawStr,
                        segments: [name || rawStr].filter(Boolean)
                    };
                }

                const raw = getString(value);
                if (!raw) {
                    return { raw: "", deviceName: "", portName: "", segments: [] };
                }

                if (raw.includes("->")) {
                    const segments = raw.split("->").map((s) => s.trim()).filter(Boolean);
                    const portName = segments[segments.length - 1] ?? "";
                    const deviceName = segments.length >= 2 ? segments[segments.length - 2] : "";
                    return { raw, deviceName, portName, segments };
                }

                if (raw.includes(".")) {
                    const segments = raw.split(".").map((s) => s.trim()).filter(Boolean);
                    const portName = segments[segments.length - 1] ?? "";
                    const firstSegment = segments[0] ?? "";
                    // Strip trailing face indicator such as (R), (F), (Front), (Rear), (Top), (Bottom)
                    const deviceName = firstSegment.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                    return { raw, deviceName, portName, segments };
                }

                return { raw, deviceName: "", portName: raw.trim(), segments: [raw.trim()] };
            };

            const getEqid = (props: BasicPropItem[]) =>
                props.find((item) => item.Name?.toString().toLowerCase() === "eqid")?.Value?.toString().trim() ?? "";

            const selectedNodeEqid =
                editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
                || getEqid(rightDeviceBasicProps)
                || selectedDevice?.EQID?.toString().trim()
                || "";
            const defaultNodeEqid =
                getEqid(leftDeviceBasicProps)
                || defaultSelectedNode?.EQID?.toString().trim()
                || (defaultSelectedNode as any)?.eqid?.toString().trim()
                || "";

            const clearRowMark = (row: IPortDataItem): IPortDataItem => {
                const cleaned = { ...row } as Record<string, unknown>;
                delete cleaned.dragInPortType;
                cleaned.tooltip = "";
                cleaned.transferportlabel = false;
                cleaned.connectedportEntityName = "";
                cleaned.connectedportEntId = "";
                return cleaned as IPortDataItem;
            };

            const clearAllGrids = () => {
                setLeftPowerPortData((prev) => prev.map(clearRowMark));
                setRightPowerPortData((prev) => prev.map(clearRowMark));
                setLeftNetworkPortData((prev) => prev.map(clearRowMark));
                setRightNetworkPortData((prev) => prev.map(clearRowMark));
            };

            if (!selectedNodeEqid || !defaultNodeEqid) {
                if (!defaultSelectedNode) {
                    clearAllGrids();
                }
                return;
            }
            if (!rightPowerPortData.length && !rightNetworkPortData.length) return;
            if (!leftPowerPortData.length && !leftNetworkPortData.length) return;
            if (restoreInProgressRef.current) {
                restorePendingRef.current = true;
                return;
            }

            const targetRight: IDeviceTargetInfo = {
                eqid: selectedNodeEqid,
                name: editDeviceReplacementProps.selectedNodeExplorer?.Name || selectedDevice?._Device || selectedDevice?.Name || "",
                entityName: editDeviceReplacementProps.selectedNodeExplorer?.NodeEntityname || "",
                props: rightDeviceBasicProps
            };

            const targetLeft: IDeviceTargetInfo = {
                eqid: defaultNodeEqid,
                name: defaultSelectedNode?.Name || "",
                entityName: defaultSelectedNode?.NodeEntityname || "",
                props: leftDeviceBasicProps
            };

            const matchesDevice = (candidate: string, target: IDeviceTargetInfo): boolean => {
                if (!candidate || !target) return false;

                // Clean face indicator from candidate, e.g. "Nexus 9K, Fixed Switch(R)" -> "Nexus 9K, Fixed Switch"
                const cleanedCandidate = candidate.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                const candNorm = normalize(cleanedCandidate);
                if (!candNorm) return false;

                // Collect target device identifiers
                const identifiers: string[] = [];

                if (target.eqid) {
                    identifiers.push(normalize(target.eqid));
                }
                if (target.name) {
                    const cleanedName = target.name.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                    identifiers.push(normalize(cleanedName));
                    identifiers.push(normalize(target.name));
                }
                if (target.entityName) {
                    identifiers.push(normalize(target.entityName));
                }

                // Only inspect specific device identity property values from target.props (e.g. _Device, Model, EQID, Name)
                if (Array.isArray(target.props)) {
                    for (const p of target.props) {
                        const pName = (p.Name ?? "").toString().toLowerCase().trim();
                        if (["_device", "device", "model", "eqid", "name", "devicename"].includes(pName)) {
                            if (p.Value) {
                                const cleanedVal = p.Value.toString().replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                                identifiers.push(normalize(cleanedVal));
                            }
                        }
                    }
                }

                const validIdentifiers = identifiers.filter(Boolean);
                if (!validIdentifiers.length) return false;

                return validIdentifiers.some((id) => {
                    if (!id) return false;
                    if (candNorm === id) return true;
                    if (candNorm.length >= 3 && id.length >= 3) {
                        if (candNorm.startsWith(id) || id.startsWith(candNorm)) return true;
                    }
                    return false;
                });
            };

            const matchPortRow = (row: IPortDataItem, endpoint: IParsedEndpoint, targetDevice: IDeviceTargetInfo): boolean => {
                if (!row || !endpoint) return false;

                // 1. Device Match Check:
                // Only verify device if endpoint has an explicit deviceName that differs from the portName
                if (endpoint.deviceName && endpoint.deviceName !== endpoint.portName) {
                    if (targetDevice.name || targetDevice.eqid) {
                        if (!matchesDevice(endpoint.deviceName, targetDevice)) {
                            const normDev = normalize(endpoint.deviceName);
                            const isGeneric = normDev.includes("inventory") || normDev.includes("replace") || normDev.includes("device");
                            if (!isGeneric) {
                                return false;
                            }
                        }
                    }
                }

                // 2. Port Name Match Check:
                const rowNameNorm = normalize(row.Name);
                const rowCompNorm = normalize(row.CompositeName);
                const endPortNorm = normalize(endpoint.portName);
                const endRawNorm = normalize(endpoint.raw);

                const portMatches =
                    (rowCompNorm && (rowCompNorm === endRawNorm || rowCompNorm === endPortNorm)) ||
                    (rowNameNorm && endPortNorm && rowNameNorm === endPortNorm) ||
                    (rowNameNorm && endRawNorm && rowNameNorm === endRawNorm) ||
                    (rowCompNorm && endPortNorm && rowCompNorm.endsWith(endPortNorm)) ||
                    (endRawNorm && rowNameNorm && endRawNorm.endsWith(rowNameNorm)) ||
                    (endPortNorm && rowCompNorm && endPortNorm.endsWith(rowCompNorm));

                return Boolean(portMatches);
            };

            const getMappingPortType = (
                mapping: { source: string; dest: string },
                lp: IPortDataItem[],
                ln: IPortDataItem[],
                rp: IPortDataItem[],
                rn: IPortDataItem[]
            ): "power" | "network" | "" => {
                const destEp = parseEndpoint(mapping.dest);
                const srcEp = parseEndpoint(mapping.source);

                const matchesAny = (rows: IPortDataItem[], ep: IParsedEndpoint, target: IDeviceTargetInfo) =>
                    rows.some((r) => matchPortRow(r, ep, target));

                const isPower =
                    matchesAny(lp, srcEp, targetLeft) ||
                    matchesAny(rp, destEp, targetRight) ||
                    matchesAny(lp, destEp, targetLeft) ||
                    matchesAny(rp, srcEp, targetRight);

                const isNetwork =
                    matchesAny(ln, srcEp, targetLeft) ||
                    matchesAny(rn, destEp, targetRight) ||
                    matchesAny(ln, destEp, targetLeft) ||
                    matchesAny(rn, srcEp, targetRight);

                if (isPower && !isNetwork) return "power";
                if (isNetwork && !isPower) return "network";

                const text = `${mapping.source} ${mapping.dest}`.toLowerCase();
                const hasPowerText = /power|plug|outlet|inlet|grounding/.test(text);
                const hasNetworkText = /network|ethernet|serial|rs232|rs485|analog|digital|gpio|rj45|rj-45|usb|fiber|sfp|qsfp|console|mgmt|lan|wan/.test(text);

                if (hasPowerText && !hasNetworkText) return "power";
                if (hasNetworkText && !hasPowerText) return "network";
                return "";
            };

            const templateWoid = getReplacementTemplateWoid();
            const token = `${selectedNodeEqid}|${defaultNodeEqid}|${defaultSelectedNode?.NodeEntID ?? ""}|${templateWoid}|LP:${leftPowerPortData.length}|LN:${leftNetworkPortData.length}|RP:${rightPowerPortData.length}|RN:${rightNetworkPortData.length}|LBP:${leftDeviceBasicProps.length}|RBP:${rightDeviceBasicProps.length}`;
            if (restoredMappingTokenRef.current === token) return;
            restoredMappingTokenRef.current = token;
            restoreInProgressRef.current = true;

            const applyRestoredMappings = async () => {
                const clearRowMark = (row: IPortDataItem): IPortDataItem => {
                    const cleaned = { ...row } as Record<string, unknown>;
                    delete cleaned.dragInPortType;
                    cleaned.tooltip = "";
                    cleaned.transferportlabel = false;
                    cleaned.connectedportEntityName = "";
                    cleaned.connectedportEntId = "";
                    return cleaned as IPortDataItem;
                };

                const clearAllGrids = () => {
                    setLeftPowerPortData((prev) => prev.map(clearRowMark));
                    setRightPowerPortData((prev) => prev.map(clearRowMark));
                    setLeftNetworkPortData((prev) => prev.map(clearRowMark));
                    setRightNetworkPortData((prev) => prev.map(clearRowMark));
                };

                const cleanLeftPower = leftPowerPortDataRef.current.length ? leftPowerPortDataRef.current : leftPowerPortData;
                const cleanRightPower = rightPowerPortDataRef.current.length ? rightPowerPortDataRef.current : rightPowerPortData;
                const cleanLeftNetwork = leftNetworkPortDataRef.current.length ? leftNetworkPortDataRef.current : leftNetworkPortData;
                const cleanRightNetwork = rightNetworkPortDataRef.current.length ? rightNetworkPortDataRef.current : rightNetworkPortData;

                if (!templateWoid) {
                    clearAllGrids();
                    return;
                }

                const workorderDetails = await fetchWorkorderDetails(templateWoid);
                const profiles = workorderDetails.profiles;
                if (!Array.isArray(profiles) || !profiles.length || !workorderDetails.items.length) {
                    clearAllGrids();
                    return;
                }

                const isProfileMatch = (pName: string, items?: ParsedWorkorderItem[], pDesc?: string) => {
                    const pNorm = normalize(pName);
                    const descNorm = normalize(pDesc ?? "");
                    const selEq = normalize(selectedNodeEqid);
                    const defEq = normalize(defaultNodeEqid);
                    const selNameNorm = normalize(targetRight.name);
                    const defNameNorm = normalize(targetLeft.name);

                    // 1. Direct EQID pair convention (e.g. replace_csys192_257s005 or reverse)
                    const c1 = normalize(`replace_${selEq}_${defEq}`);
                    const c2 = normalize(`replace_${defEq}_${selEq}`);
                    if (pNorm === c1 || pNorm === c2 || descNorm === c1 || descNorm === c2) return true;

                    // 2. Both EQIDs included in profile name or description
                    if (selEq && defEq && ((pNorm.includes(selEq) && pNorm.includes(defEq)) || (descNorm.includes(selEq) && descNorm.includes(defEq)))) return true;

                    // 3. Both Device Names included in profile name or description
                    if (selNameNorm && defNameNorm && ((pNorm.includes(selNameNorm) && pNorm.includes(defNameNorm)) || (descNorm.includes(selNameNorm) && descNorm.includes(defNameNorm)))) return true;

                    // 4. Combination of EQID and Device Name in profile name or description
                    if (selEq && defNameNorm && ((pNorm.includes(selEq) && pNorm.includes(defNameNorm)) || (descNorm.includes(selEq) && descNorm.includes(defNameNorm)))) return true;
                    if (defEq && selNameNorm && ((pNorm.includes(defEq) && pNorm.includes(selNameNorm)) || (descNorm.includes(defEq) && descNorm.includes(selNameNorm)))) return true;

                    // 5. Workorder items check: MUST contain items matching BOTH Pane 1 (targetRight) AND Pane 3 (targetLeft)
                    if (items && items.length) {
                        const hasRightMatch = items.some((it) => {
                            try {
                                const parsed = typeof it.ItemJson === "string" ? JSON.parse(it.ItemJson) : it.ItemJson;
                                if (!parsed) return false;
                                if (parsed.dest && typeof parsed.dest === "object" && matchesDevice(getString((parsed.dest as any).Name || (parsed.dest as any).Path || (parsed.dest as any)._Device), targetRight)) return true;
                                if (parsed.fromDevice && matchesDevice(getString(parsed.fromDevice.Name || parsed.fromDevice.Path || parsed.fromDevice._Device), targetRight)) return true;
                                if (parsed.toDevice && matchesDevice(getString(parsed.toDevice.Name || parsed.toDevice.Path || parsed.toDevice._Device), targetRight)) return true;
                                const src = parseEndpoint(parsed.source);
                                const dst = parseEndpoint(parsed.dest);
                                return (
                                    (src.deviceName && matchesDevice(src.deviceName, targetRight)) ||
                                    (dst.deviceName && matchesDevice(dst.deviceName, targetRight))
                                );
                            } catch {
                                return false;
                            }
                        });

                        const hasLeftMatch = items.some((it) => {
                            try {
                                const parsed = typeof it.ItemJson === "string" ? JSON.parse(it.ItemJson) : it.ItemJson;
                                if (!parsed) return false;
                                if (parsed.source && typeof parsed.source === "object" && matchesDevice(getString((parsed.source as any).Name || (parsed.source as any).Path || (parsed.source as any)._Device), targetLeft)) return true;
                                if (parsed.toDevice && matchesDevice(getString(parsed.toDevice.Name || parsed.toDevice.Path || parsed.toDevice._Device), targetLeft)) return true;
                                if (parsed.fromDevice && matchesDevice(getString(parsed.fromDevice.Name || parsed.fromDevice.Path || parsed.fromDevice._Device), targetLeft)) return true;
                                const src = parseEndpoint(parsed.source);
                                const dst = parseEndpoint(parsed.dest);
                                return (
                                    (src.deviceName && matchesDevice(src.deviceName, targetLeft)) ||
                                    (dst.deviceName && matchesDevice(dst.deviceName, targetLeft))
                                );
                            } catch {
                                return false;
                            }
                        });

                        // Both Pane 1 (selected node) and Pane 3 (inventory node) MUST match
                        if (hasRightMatch && hasLeftMatch) return true;
                    }

                    return false;
                };

                const matchedProfile =
                    profiles.find((item) => {
                        const pName = getString(item?._WorkorderProfile ?? item?._workorderProfile ?? item?._Workorder ?? item?._workorder);
                        return pName.toLowerCase() === templateWoid.toLowerCase();
                    })
                    || profiles.find((item) => {
                        const profileName = getString(item?._WorkorderProfile ?? item?._workorderProfile ?? item?._workorderprofile);
                        const profileDesc = getString(item?.DESC250 ?? item?.Desc250 ?? item?.desc250);
                        return isProfileMatch(profileName, workorderDetails.items, profileDesc);
                    })
                    || profiles[0];

                if (!matchedProfile) {
                    clearAllGrids();
                    return;
                }

                const matchedProfileName = getString(matchedProfile?._WorkorderProfile ?? matchedProfile?._workorderProfile ?? matchedProfile?._workorderprofile).toLowerCase();
                const matchedProfileDesc = getString(matchedProfile?.DESC250 ?? matchedProfile?.Desc250 ?? matchedProfile?.desc250).toLowerCase();
                const allItems = workorderDetails.items;
                if (!allItems.length) {
                    clearAllGrids();
                    return;
                }

                const profileItems = allItems.filter((item) => {
                    let parsedItem: UnknownRecord | undefined;
                    try {
                        parsedItem = typeof item?.ItemJson === "string" ? JSON.parse(item.ItemJson) : item?.ItemJson;
                    } catch (error) {
                        console.error('Error in parse json string :', error);
                        parsedItem = undefined;
                    }
                    const itemProfile = getString(item?._WorkorderProfile ?? item?._workorderProfile ?? parsedItem?.Workordername).toLowerCase();
                    return !matchedProfileName || !itemProfile || itemProfile === matchedProfileName || (matchedProfileDesc && itemProfile === matchedProfileDesc) || isProfileMatch(itemProfile, allItems);
                });
                const itemsToUse = profileItems.length > 0 ? profileItems : allItems;

                const mappings: Array<{ source: string; dest: string }> = [];
                itemsToUse.forEach((item) => {
                    try {
                        const parsed = typeof item.ItemJson === "string" ? JSON.parse(item.ItemJson) : item.ItemJson;
                        if (!parsed) return;
                        const action = getString(parsed.action).toLowerCase();
                        if (action && !["replacement", "replace device", "replace", "replacementprofile"].includes(action)) return;

                        if (parsed.transferlabel !== undefined) {
                            setIsTransferPortLabel(parsed.transferlabel === "True" || parsed.transferlabel === true);
                        }

                        if (Array.isArray(parsed.portmapping) && parsed.portmapping.length > 0) {
                            parsed.portmapping.forEach((pm: any) => {
                                if (pm) {
                                    const s = typeof pm.source === "string" ? pm.source : getString(pm.source);
                                    const d = typeof pm.dest === "string" ? pm.dest : getString(pm.dest);
                                    if (s || d) {
                                        mappings.push({ source: s, dest: d });
                                    }
                                }
                            });
                        } else {
                            const sourceRaw = parsed.source;
                            const destRaw = parsed.dest;
                            const getCompositeName = (value: unknown) => {
                                if (typeof value === "string") {
                                    return value;
                                }
                                if (value && typeof value === "object") {
                                    const portValue = value as UnknownRecord;
                                    return getString(
                                        portValue.CompositePortName
                                        ?? portValue.CompositeName
                                        ?? portValue.Name
                                        ?? portValue.PortName
                                    );
                                }
                                return "";
                            };
                            const s = getCompositeName(sourceRaw) || getString(parsed.sourcePath);
                            const d = getCompositeName(destRaw) || getString(parsed.destPath);
                            if (s || d) {
                                mappings.push({ source: s, dest: d });
                            }
                        }
                    } catch (error) {
                        console.error('Error in handle profile items  :', error);
                    }
                });
                if (!mappings.length) {
                    clearAllGrids();
                    return;
                }

                const applyByType = (
                    leftRows: IPortDataItem[],
                    rightRows: IPortDataItem[],
                    portType: "power" | "network"
                ) => {
                    const getEntId = (row: IPortDataItem) => String(row?.EntID ?? "");

                    // Strip X marks — the cell renderer shows X when !!row.tooltip is true.
                    const clearMark = (row: IPortDataItem): IPortDataItem => {
                        const cleaned = { ...row } as Record<string, unknown>;
                        delete cleaned.dragInPortType;
                        cleaned.tooltip = "";
                        cleaned.transferportlabel = false;
                        cleaned.connectedportEntityName = "";
                        cleaned.connectedportEntId = "";
                        return cleaned as IPortDataItem;
                    };
                    const cleanedLeft = leftRows.map(clearMark);
                    const cleanedRight = rightRows.map(clearMark);
                    const hadMarks =
                        leftRows.some((r) => r.tooltip || r.dragInPortType || r.transferportlabel) ||
                        rightRows.some((r) => r.tooltip || r.dragInPortType || r.transferportlabel);

                    const usedLeft = new Set<string>();
                    const usedRight = new Set<string>();

                    const mappingsForThisType = mappings.filter((m) => {
                        const mappingPortType = getMappingPortType(m, leftPowerPortData, leftNetworkPortData, rightPowerPortData, rightNetworkPortData);
                        if (mappingPortType && mappingPortType !== portType) return false;
                        return true;
                    });

                    const pairs = mappingsForThisType
                        .map((m) => {
                            const destEp = parseEndpoint(m.dest);
                            const srcEp = parseEndpoint(m.source);

                            // When workorder was saved:
                            // dest was rightRows (device being replaced)
                            // source was leftRows (replacement device)
                            let left = cleanedLeft.find(
                                (row) => !usedLeft.has(getEntId(row)) && matchPortRow(row, srcEp, targetLeft)
                            );
                            let right = cleanedRight.find(
                                (row) => !usedRight.has(getEntId(row)) && matchPortRow(row, destEp, targetRight)
                            );

                            // Fallback if roles were reversed in saved workorder
                            if (!left || !right) {
                                const reversedLeft = cleanedLeft.find(
                                    (row) => !usedLeft.has(getEntId(row)) && matchPortRow(row, destEp, targetLeft)
                                );
                                const reversedRight = cleanedRight.find(
                                    (row) => !usedRight.has(getEntId(row)) && matchPortRow(row, srcEp, targetRight)
                                );
                                if (reversedLeft && reversedRight) {
                                    left = reversedLeft;
                                    right = reversedRight;
                                }
                            }

                            if (!left || !right) return null;

                            const rightEntId = getEntId(right);
                            const leftEntId = getEntId(left);
                            if (!rightEntId || !leftEntId) return null;

                            usedLeft.add(leftEntId);
                            usedRight.add(rightEntId);
                            return {
                                leftEntId,
                                rightEntId,
                                rightName: right.CompositeName?.toString() ?? right.Name?.toString() ?? "",
                                leftName: left.CompositeName?.toString() ?? left.Name?.toString() ?? ""
                            };
                        })
                        .filter((p): p is { leftEntId: string; rightEntId: string; rightName: string; leftName: string } => !!p);

                    // No valid pairs — return cleaned rows (X marks removed) if there were any
                    if (!pairs.length) {
                        return { leftRows: cleanedLeft, rightRows: cleanedRight, changed: hadMarks };
                    }

                    const leftIdSet = new Set(pairs.map((p) => p.leftEntId));
                    const rightIdSet = new Set(pairs.map((p) => p.rightEntId));
                    const rightNameByLeft = new Map(pairs.map((p) => [p.leftEntId, p.rightName]));
                    const leftNameByRight = new Map(pairs.map((p) => [p.rightEntId, p.leftName]));

                    const lPath = defaultSelectedNode?.NodePath || leftDevicePath || defaultSelectedNode?.Name || "Inventory Device";
                    const rPath = editDeviceReplacementProps.selectedNodeExplorer?.NodePath || rightDevicePath || selectedDevice?._Device || "Replaced Device";

                    // Apply X marks only to matched pairs; all other rows stay clean
                    const updatedLeft = cleanedLeft.map((row) => {
                        const rowId = getEntId(row);
                        if (!leftIdSet.has(rowId)) return row;
                        const targetName = rightNameByLeft.get(rowId) ?? "";
                        return {
                            ...row,
                            tooltip: `From: ${lPath}->${row.Name}, To: ${rPath}->${targetName}`,
                            dragInPortType: portType,
                            transferportlabel: true,
                            connectedportEntityName: row.EntityName,
                            connectedportEntId: row.EntID
                        };
                    });

                    const updatedRight = cleanedRight.map((row) => {
                        const rowId = getEntId(row);
                        if (!rightIdSet.has(rowId)) return row;
                        const pair = pairs.find((p) => p.rightEntId === rowId);
                        const sourceRow = pair ? cleanedLeft.find((l) => getEntId(l) === pair.leftEntId) : undefined;
                        const sourcePortName = leftNameByRight.get(rowId) ?? sourceRow?.Name ?? "";
                        return {
                            ...row,
                            tooltip: `From: ${lPath}->${sourcePortName}, To: ${rPath}->${row.Name}`,
                            dragInPortType: portType,
                            transferportlabel: true,
                            connectedportEntityName: sourceRow?.EntityName ?? "",
                            connectedportEntId: sourceRow?.EntID ?? ""
                        };
                    });

                    return { leftRows: updatedLeft, rightRows: updatedRight, changed: true };
                };

                // ── Phase 2: Apply new X marks on top of the already-cleaned rows ──
                const power = applyByType(cleanLeftPower, cleanRightPower, "power");
                const network = applyByType(cleanLeftNetwork, cleanRightNetwork, "network");
                if (power.changed) {
                    setLeftPowerPortData(power.leftRows);
                    setRightPowerPortData(power.rightRows);
                }
                if (network.changed) {
                    setLeftNetworkPortData(network.leftRows);
                    setRightNetworkPortData(network.rightRows);
                }
            };

            applyRestoredMappings()
                .catch((err) => {
                    console.error("Error applying restored mappings:", err);
                })
                .finally(() => {
                    restoreInProgressRef.current = false;
                    if (restorePendingRef.current) {
                        restorePendingRef.current = false;
                        restoredMappingTokenRef.current = "";
                        setRestoreTrigger((prev) => prev + 1);
                    }
                });
        }
    }, [
        editDeviceReplacementProps.featureId,
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        editDeviceReplacementProps.selectedNodeExplorer?.EQID,
        defaultSelectedNode?.NodeEntID,
        defaultSelectedNode?.EQID,
        leftPowerPortData.length,
        leftNetworkPortData.length,
        rightPowerPortData.length,
        rightNetworkPortData.length,
        leftDeviceBasicProps,
        rightDeviceBasicProps,
        restoreTrigger,
        getReplacementTemplateWoid,
        fetchWorkorderDetails
    ]);

    const clearDragAndDropEvents = useCallback((gridContainer: HTMLDivElement | null) => {
        if (!gridContainer) return;
        type RowWithDragHandlers = HTMLElement & {
            __nzDragHandlers?: {
                dragstart: (e: DragEvent) => void;
                dragenter: () => void;
            };
        };
        const rows = gridContainer.querySelectorAll(".ag-row");
        rows.forEach((rowNode) => {
            const row = rowNode as RowWithDragHandlers;
            const previous = row.__nzDragHandlers;
            if (previous) {
                row.removeEventListener("dragstart", previous.dragstart);
                row.removeEventListener("dragenter", previous.dragenter);
                delete row.__nzDragHandlers;
            }
            row.ondragstart = null;
            row.ondragenter = null;
            row.setAttribute("draggable", "false");
            (row as HTMLElement).style.cursor = "default";
            row.querySelectorAll(".ag-cell").forEach((cell) => {
                (cell as HTMLElement).setAttribute("draggable", "false");
                (cell as HTMLElement).style.cursor = "default";
            });
        });
    }, []);

    const makeRowDraggable = (target: HTMLElement | null) => {
        if (!target) return;
        const row = target.closest(".ag-row") as HTMLElement | null;
        if (row) {
            if (row.getAttribute("draggable") !== "true") {
                row.setAttribute("draggable", "true");
                row.style.cursor = "grab";
            }
            row.querySelectorAll(".ag-cell").forEach((cell) => {
                if (cell.getAttribute("draggable") !== "true") {
                    (cell as HTMLElement).setAttribute("draggable", "true");
                    (cell as HTMLElement).style.cursor = "grab";
                }
            });
        }
    };

    const attachDragAndDropEvents = useCallback(
        (gridContainer: HTMLDivElement | null, data: IPortDataItem[], portType: 'power' | 'network', gridSide: 'left' | 'right') => {
            if (!gridContainer) return;

            type RowWithDragHandlers = HTMLElement & {
                __nzDragHandlers?: {
                    dragstart: (e: DragEvent) => void;
                    dragenter: () => void;
                };
            };

            const applyDraggable = () => {
                const rows = gridContainer.querySelectorAll(".ag-row");
                rows.forEach((rowNode, index: number) => {
                    const row = rowNode as RowWithDragHandlers;
                    row.setAttribute("draggable", "true");
                    row.style.cursor = "grab";

                    const rowIndexAttr = row.getAttribute("row-index");
                    const rowIndex = rowIndexAttr !== null ? parseInt(rowIndexAttr, 10) : index;
                    const dataset = gridSide === 'left'
                        ? (portType === 'power' ? leftPowerPortDataRef.current : leftNetworkPortDataRef.current)
                        : (portType === 'power' ? rightPowerPortDataRef.current : rightNetworkPortDataRef.current);
                    const rowData = rowIndex >= 0 && rowIndex < dataset.length ? dataset[rowIndex] : data[index];

                    row.querySelectorAll(".ag-cell").forEach((cell) => {
                        (cell as HTMLElement).setAttribute("draggable", "true");
                        (cell as HTMLElement).style.cursor = "grab";
                    });

                    const previous = row.__nzDragHandlers;
                    if (previous) {
                        row.removeEventListener("dragstart", previous.dragstart);
                        row.removeEventListener("dragenter", previous.dragenter);
                    }

                    const onDragStart = (e: DragEvent) => {
                        rowDraggedFromRef.current = portType;
                        dragSourceGridRef.current = gridSide;
                        if (portType === 'power') {
                            draggedRowNetworkPortRef.current = null;
                            dropTargetRowNetworkPortRef.current = null;
                            dropTargetRowPowerPortRef.current = null;
                            draggedRowPowerPortRef.current = rowData;
                        } else {
                            draggedRowPowerPortRef.current = null;
                            dropTargetRowPowerPortRef.current = null;
                            dropTargetRowNetworkPortRef.current = null;
                            draggedRowNetworkPortRef.current = rowData;
                        }
                        if (e.dataTransfer) {
                            e.dataTransfer.effectAllowed = "copy";
                            e.dataTransfer.setData("text/plain", JSON.stringify({
                                gridSide,
                                portType,
                                rowIndex,
                                entId: rowData?.EntID
                            }));
                        }
                    };

                    const onDragEnter = () => {
                        if (
                            rowDraggedFromRef.current === portType
                            && dragSourceGridRef.current
                            && dragSourceGridRef.current !== gridSide
                        ) {
                            if (portType === 'power') {
                                dropTargetRowPowerPortRef.current = rowData;
                            } else {
                                dropTargetRowNetworkPortRef.current = rowData;
                            }
                        }
                    };

                    row.__nzDragHandlers = {
                        dragstart: onDragStart,
                        dragenter: onDragEnter
                    };
                    row.addEventListener("dragstart", onDragStart);
                    row.addEventListener("dragenter", onDragEnter);
                });
            };

            applyDraggable();

            const observer = new MutationObserver(() => {
                applyDraggable();
            });
            observer.observe(gridContainer, { childList: true, subtree: true });

            return () => {
                observer.disconnect();
            };
        },
        []
    );

    const handleContainerDragStart = (e: React.DragEvent, portType: 'power' | 'network', gridSide: 'left' | 'right') => {
        const rowNode = (e.target as HTMLElement)?.closest(".ag-row");
        if (!rowNode) return;
        const rowIndexAttr = rowNode.getAttribute("row-index");
        const rowIndex = rowIndexAttr !== null ? parseInt(rowIndexAttr, 10) : -1;
        const dataset = gridSide === 'left'
            ? (portType === 'power' ? leftPowerPortDataRef.current : leftNetworkPortDataRef.current)
            : (portType === 'power' ? rightPowerPortDataRef.current : rightNetworkPortDataRef.current);
        const itemData = rowIndex >= 0 && rowIndex < dataset.length ? dataset[rowIndex] : null;
        if (!itemData) return;

        rowDraggedFromRef.current = portType;
        dragSourceGridRef.current = gridSide;
        if (portType === 'power') {
            draggedRowNetworkPortRef.current = null;
            dropTargetRowNetworkPortRef.current = null;
            dropTargetRowPowerPortRef.current = null;
            draggedRowPowerPortRef.current = itemData;
        } else {
            draggedRowPowerPortRef.current = null;
            dropTargetRowPowerPortRef.current = null;
            dropTargetRowNetworkPortRef.current = null;
            draggedRowNetworkPortRef.current = itemData;
        }
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "copy";
            e.dataTransfer.setData("text/plain", JSON.stringify({
                gridSide,
                portType,
                rowIndex,
                entId: itemData.EntID
            }));
        }
    };

    useEffect(() => {
        const cleanup = attachDragAndDropEvents(leftPowerPortGridRef.current, leftPowerPortData, 'power', 'left');
        return () => {
            cleanup?.();
            clearDragAndDropEvents(leftPowerPortGridRef.current);
        };
    }, [leftPowerPortData, attachDragAndDropEvents, clearDragAndDropEvents]);

    useEffect(() => {
        const cleanup = attachDragAndDropEvents(leftNetworkPortGridRef.current, leftNetworkPortData, 'network', 'left');
        return () => {
            cleanup?.();
            clearDragAndDropEvents(leftNetworkPortGridRef.current);
        };
    }, [leftNetworkPortData, attachDragAndDropEvents, clearDragAndDropEvents]);

    useEffect(() => {
        const cleanup = attachDragAndDropEvents(rightPowerPortGridRef.current, rightPowerPortData, 'power', 'right');
        return () => {
            cleanup?.();
            clearDragAndDropEvents(rightPowerPortGridRef.current);
        };
    }, [rightPowerPortData, attachDragAndDropEvents, clearDragAndDropEvents]);

    useEffect(() => {
        const cleanup = attachDragAndDropEvents(rightNetworkPortGridRef.current, rightNetworkPortData, 'network', 'right');
        return () => {
            cleanup?.();
            clearDragAndDropEvents(rightNetworkPortGridRef.current);
        };
    }, [rightNetworkPortData, attachDragAndDropEvents, clearDragAndDropEvents]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const targetContainer = e.currentTarget as HTMLElement | null;
        const targetGridSide =
            (targetContainer?.getAttribute("data-grid-side") as 'left' | 'right' | null)
            || (targetContainer === leftPowerPortGridRef.current || targetContainer === leftNetworkPortGridRef.current ? 'left' : 'right');
        const targetPortCategory =
            (targetContainer?.getAttribute("data-port-type") as 'power' | 'network' | null)
            || (targetContainer === leftPowerPortGridRef.current || targetContainer === rightPowerPortGridRef.current ? 'power' : 'network');

        let sourceGridSide = dragSourceGridRef.current;
        let sourcePortCategory = rowDraggedFromRef.current;
        let payloadEntId: unknown = undefined;
        let payloadRowIndex: number | undefined = undefined;

        if (e.dataTransfer) {
            try {
                const text = e.dataTransfer.getData("text/plain");
                if (text) {
                    const parsed = JSON.parse(text);
                    if (parsed.gridSide) sourceGridSide = parsed.gridSide;
                    if (parsed.portType) sourcePortCategory = parsed.portType;
                    if (parsed.entId) payloadEntId = parsed.entId;
                    if (typeof parsed.rowIndex === "number") payloadRowIndex = parsed.rowIndex;
                }
            } catch {
                // Ignore parse error
            }
        }

        // Must drop across sides (left <-> right)
        if (
            sourceGridSide &&
            targetGridSide &&
            sourceGridSide === targetGridSide
        ) {
            return;
        }

        if (
            sourcePortCategory &&
            targetPortCategory &&
            sourcePortCategory !== targetPortCategory
        ) {
            return;
        }

        const effectivePortType = sourcePortCategory || targetPortCategory || 'power';

        // Resolve dropped row from event target element (.ag-row) if possible
        const targetList = effectivePortType === 'power'
            ? (targetGridSide === 'left' ? leftPowerPortDataRef.current : rightPowerPortDataRef.current)
            : (targetGridSide === 'left' ? leftNetworkPortDataRef.current : rightNetworkPortDataRef.current);

        let droppedRowFromTarget: IPortDataItem | null = null;
        let rowElement = (e.target as HTMLElement | null)?.closest(".ag-row");
        if (!rowElement) {
            rowElement = document.elementFromPoint(e.clientX, e.clientY)?.closest(".ag-row") ?? null;
        }

        if (rowElement) {
            const rowIndexAttr = rowElement.getAttribute("row-index");
            if (rowIndexAttr !== null && rowIndexAttr !== undefined) {
                const rowIndex = parseInt(rowIndexAttr, 10);
                if (!isNaN(rowIndex) && rowIndex >= 0 && rowIndex < targetList.length) {
                    droppedRowFromTarget = targetList[rowIndex] ?? null;
                }
            }
        }

        let droppedRow = droppedRowFromTarget ?? (dropTargetRowPowerPortRef.current ?? dropTargetRowNetworkPortRef.current);
        if (!droppedRow && targetList.length === 1) {
            droppedRow = targetList[0];
        }

        let draggedRow = draggedRowPowerPortRef.current ?? draggedRowNetworkPortRef.current;
        if (!draggedRow) {
            const sourceList = effectivePortType === 'power'
                ? (sourceGridSide === 'left' ? leftPowerPortDataRef.current : rightPowerPortDataRef.current)
                : (sourceGridSide === 'left' ? leftNetworkPortDataRef.current : rightNetworkPortDataRef.current);
            if (payloadEntId) {
                draggedRow = sourceList.find((r) => String(r.EntID) === String(payloadEntId)) ?? null;
            }
            if (!draggedRow && typeof payloadRowIndex === "number" && payloadRowIndex >= 0) {
                draggedRow = sourceList[payloadRowIndex] ?? null;
            }
        }

        if (!draggedRow || !droppedRow) return;

        // Pane 4 is 'left' (Inventory / Replace with)
        // Pane 2 is 'right' (Replaced Device)
        const fromLeft = sourceGridSide === 'left';
        const inventoryRow = fromLeft ? draggedRow : droppedRow;
        const replacementRow = fromLeft ? droppedRow : draggedRow;

        const lPath = defaultSelectedNode?.NodePath || leftDevicePath || defaultSelectedNode?.Name || "Inventory Device";
        const rPath = editDeviceReplacementProps.selectedNodeExplorer?.NodePath || rightDevicePath || selectedDevice?._Device || "Replaced Device";

        const tooltipText = `From: ${lPath}->${inventoryRow.Name}, To: ${rPath}->${replacementRow.Name}`;

        const inventoryId = String(inventoryRow.EntID);
        const replacementId = String(replacementRow.EntID);
        const oldInventoryConnId = String(replacementRow.connectedportEntId || "");
        const oldReplacementConnId = String(inventoryRow.connectedportEntId || "");

        if (effectivePortType === 'power') {
            setLeftPowerPortData((prev) =>
                prev.map((row) => {
                    const rowId = String(row.EntID);
                    if (rowId === inventoryId) {
                        return {
                            ...row,
                            tooltip: tooltipText,
                            dragInPortType: effectivePortType,
                            transferportlabel: true,
                            connectedportEntityName: replacementRow.EntityName,
                            connectedportEntId: inventoryRow.EntID
                        };
                    }
                    if (
                        String(row.connectedportEntId) === inventoryId ||
                        (oldInventoryConnId && String(row.EntID) === oldInventoryConnId)
                    ) {
                        return {
                            ...row,
                            tooltip: "",
                            transferportlabel: false,
                            connectedportEntityName: "",
                            connectedportEntId: ""
                        };
                    }
                    return row;
                })
            );

            setRightPowerPortData((prev) =>
                prev.map((row) => {
                    const rowId = String(row.EntID);
                    if (rowId === replacementId) {
                        return {
                            ...row,
                            tooltip: tooltipText,
                            dragInPortType: effectivePortType,
                            transferportlabel: true,
                            connectedportEntityName: inventoryRow.EntityName,
                            connectedportEntId: inventoryRow.EntID,
                            Name: isTransferPortLabel ? inventoryRow.Name : row.Name,
                            CompositeName: isTransferPortLabel ? inventoryRow.CompositeName : row.CompositeName
                        };
                    }
                    if (
                        String(row.connectedportEntId) === inventoryId ||
                        (oldReplacementConnId && String(row.connectedportEntId) === oldReplacementConnId)
                    ) {
                        return {
                            ...row,
                            tooltip: "",
                            transferportlabel: false,
                            connectedportEntityName: "",
                            connectedportEntId: ""
                        };
                    }
                    return row;
                })
            );
        } else {
            setLeftNetworkPortData((prev) =>
                prev.map((row) => {
                    const rowId = String(row.EntID);
                    if (rowId === inventoryId) {
                        return {
                            ...row,
                            tooltip: tooltipText,
                            dragInPortType: effectivePortType,
                            transferportlabel: true,
                            connectedportEntityName: replacementRow.EntityName,
                            connectedportEntId: inventoryRow.EntID
                        };
                    }
                    if (
                        String(row.connectedportEntId) === inventoryId ||
                        (oldInventoryConnId && String(row.EntID) === oldInventoryConnId)
                    ) {
                        return {
                            ...row,
                            tooltip: "",
                            transferportlabel: false,
                            connectedportEntityName: "",
                            connectedportEntId: ""
                        };
                    }
                    return row;
                })
            );

            setRightNetworkPortData((prev) =>
                prev.map((row) => {
                    const rowId = String(row.EntID);
                    if (rowId === replacementId) {
                        return {
                            ...row,
                            tooltip: tooltipText,
                            dragInPortType: effectivePortType,
                            transferportlabel: true,
                            connectedportEntityName: inventoryRow.EntityName,
                            connectedportEntId: inventoryRow.EntID,
                            Name: isTransferPortLabel ? inventoryRow.Name : row.Name,
                            CompositeName: isTransferPortLabel ? inventoryRow.CompositeName : row.CompositeName
                        };
                    }
                    if (
                        String(row.connectedportEntId) === inventoryId ||
                        (oldReplacementConnId && String(row.connectedportEntId) === oldReplacementConnId)
                    ) {
                        return {
                            ...row,
                            tooltip: "",
                            transferportlabel: false,
                            connectedportEntityName: "",
                            connectedportEntId: ""
                        };
                    }
                    return row;
                })
            );
        }
        setIsPortChanged(true);

        draggedRowPowerPortRef.current = null;
        dropTargetRowPowerPortRef.current = null;
        draggedRowNetworkPortRef.current = null;
        dropTargetRowNetworkPortRef.current = null;
        rowDraggedFromRef.current = null;
        dragSourceGridRef.current = null;
    };

    const handleDragOver = (e: React.DragEvent, gridCategory: "power" | "network") => {
        e.preventDefault();

        if (!e.dataTransfer) return;

        if (!rowDraggedFromRef.current || rowDraggedFromRef.current === gridCategory) {
            e.dataTransfer.dropEffect = "copy";
        } else {
            e.dataTransfer.dropEffect = "none";
        }
    };

    const buildAgGridColumns = (
        data: IPropertyDefinition[],
        portType?: 'power' | 'network'
    ): ColDef[] => {
        const firstColumn = [
            {
                headerName: "Action",
                field: "action",
                width: 60,
                cellRenderer: (params: ICellRendererParams) => {
                    const row = params.data as IPortDataItem;
                    const showX = Boolean(row?.tooltip || row?.transferportlabel || row?.connectedportEntId);

                    return (
                        <span
                            style={{
                                cursor: showX ? "pointer" : "default",
                                color: showX ? "red" : "inherit",
                                fontWeight: showX ? "bold" : "normal",
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                            title={showX ? row.tooltip as string : undefined}
                            onClick={() => {
                                if (showX) {
                                    const connectedportEntId = row.connectedportEntId;
                                    if (!connectedportEntId) return;
                                    const matchId = String(connectedportEntId);
                                    const portCategory = row.dragInPortType || portType || 'power';
                                    if (portCategory === 'power') {
                                        setLeftPowerPortData((prev) =>
                                            prev.map((r) =>
                                                String(r.EntID) === matchId || String(r.connectedportEntId) === matchId ? {
                                                    ...r, tooltip: ""
                                                    , transferportlabel: false
                                                    , connectedportEntityName: ""
                                                    , connectedportEntId: ""
                                                } : r
                                            )
                                        );

                                        setRightPowerPortData((prev) =>
                                            prev.map((r) =>
                                                String(r.connectedportEntId) === matchId || String(r.EntID) === matchId ? {
                                                    ...r, tooltip: ""
                                                    , transferportlabel: false
                                                    , connectedportEntityName: ""
                                                    , connectedportEntId: ""
                                                } : r
                                            )
                                        );
                                    }
                                    else {
                                        setLeftNetworkPortData((prev) =>
                                            prev.map((r) =>
                                                String(r.EntID) === matchId || String(r.connectedportEntId) === matchId ? {
                                                    ...r, tooltip: ""
                                                    , transferportlabel: false
                                                    , connectedportEntityName: ""
                                                    , connectedportEntId: ""
                                                } : r
                                            )
                                        );

                                        setRightNetworkPortData((prev) =>
                                            prev.map((r) =>
                                                String(r.connectedportEntId) === matchId || String(r.EntID) === matchId ? {
                                                    ...r, tooltip: ""
                                                    , transferportlabel: false
                                                    , connectedportEntityName: ""
                                                    , connectedportEntId: ""
                                                } : r
                                            )
                                        );
                                    }
                                    setIsPortChanged(true);
                                }
                            }}
                        >
                            {showX ? "✖" : ((params.node?.rowIndex ?? 0) + 1)}
                        </span>
                    );
                },
            },
        ];

        const columnsForPort = ["Name", "CompositeName", "Gender", "PortUse", "PortType"]
        let columns: ColDef[] = [];
        const sortedColumns = data
            .sort((a, b) => a.SortOrder - b.SortOrder)
            .filter((item) => columnsForPort.includes(item.PName));
        for (let index = 0; index < sortedColumns.length; index++) {
            const element = sortedColumns[index];

            columns.push({
                field: element.PName,
                headerName: element.PropertyLabel || element.PName,
                editable: false,
                sortable: false,
                filter: false,
                resizable: index === (sortedColumns.length - 1) ? false : true,
                tooltipField: "tooltip",
                minWidth: 100,
                flex: index === (sortedColumns.length - 1) ? 1 : 0
            });
        }



        let diagnosticLevelData = getDiagnosticLevelData()
        if (Number(diagnosticLevelData) === 0) {
            columns = columns.filter((item) => item.field && !hideGridData.includes(item.field))
        }
        return [...firstColumn, ...columns]
    };


    useEffect(() => {
        setIsPortChanged(false);
        const currentNodeEntId = editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID;
        const isDifferentNode = prevSelectedNodeEntIdRef.current !== currentNodeEntId;
        prevSelectedNodeEntIdRef.current = currentNodeEntId || "";

        if (isDifferentNode) {
            setIsOptedOut(false);
            setDefaultSelectedNode(undefined);
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setRightPowerPortData([]);
            setRightNetworkPortData([]);
            setLeftDeviceBasicProps([]);
            setLeftDevicePath(undefined);
            setDeviceWorkorderProfile("");
            rightDeviceBasicPropsRef.current = [];
            restoredMappingTokenRef.current = "";
            setIsLeftDeviceLoading(false);
        }

        if (editDeviceReplacementProps.selectedNodeExplorer && editDeviceReplacementProps.selectedNodeExplorer.NodeEntID &&
            editDeviceReplacementProps.selectedNodeExplorer.NodeType == "Device") {
            const handleClickIgnoreConflict = (deviceData: IPlacementDevice) => {

                if (!deviceData.EntityName) {
                    editDeviceReplacementProps.handleShowUserMessage?.("Device EntityName is not found");
                    return
                }
                setRightPowerPortData([]);
                setRightNetworkPortData([]);
                let payload = {
                    entityName: deviceData.EntityName
                }
                axiosInterceptor({
                    url: EM.GetTableVsProperty,
                    data: payload,
                    setFetchData: (getTablevsPropertyApiResp: unknown, status?: string) => {
                        if (status === "200" && getTablevsPropertyApiResp) {
                            if (Array.isArray(getTablevsPropertyApiResp) && getTablevsPropertyApiResp.length) {

                                let oneToOneTables: string[] = [];
                                let columnList: UnknownRecord[] = [];
                                for (let index = 0; index < getTablevsPropertyApiResp.length; index++) {
                                    const element = getTablevsPropertyApiResp[index];
                                    if (!element.isOneToManyRelation) {
                                        oneToOneTables.push(element.tableName);
                                        if (element.properties) {
                                            const parsedArray = FnParseJsonSafely(element.properties)
                                            columnList = [...columnList, ...parsedArray];
                                        }
                                    }

                                }
                                if (oneToOneTables.length > 0) {
                                    axiosInterceptor({
                                        url: EM.GetAllTablesRecord,
                                        data: {
                                            entID: deviceData.DeviceID,
                                            tableNames: oneToOneTables.join(DELIMITER.separator),
                                        },
                                        setFetchData: (response: unknown) => {
                                            if (response && typeof response === "object" && 'jsonStringOutput' in response) {
                                                if (response.jsonStringOutput) {

                                                    const jsonData = FnParseJsonSafely(response.jsonStringOutput as string);
                                                    const result: BasicPropItem[] = [];
                                                    const deviceProps = [
                                                        "_Device", "_WorkorderProfile", "WorkorderProfile",
                                                        "ReplacementTemplate", "ReplacementTemplateWOID",
                                                        "RURequired", "Power", "Thermal", "Power port", "Network port",
                                                        "Weight", "EQID", "Path", "Manufacturer", "MfgEqType", "MfgProdLine"
                                                    ];

                                                    if (!Array.isArray(jsonData?.AllTables)) {
                                                        return;
                                                    }

                                                    const addedProps = new Set<string>();

                                                    jsonData.AllTables.forEach((table: UnknownRecord) => {
                                                        if (!Array.isArray(table?.TableData)) return;

                                                        table.TableData.forEach((item: UnknownRecord) => {
                                                            const itemName = String(item?.Name ?? "").toLowerCase();

                                                            if (!deviceProps.some(p => p.toLowerCase() === itemName)) return;

                                                            //  Prevent duplicates
                                                            if (addedProps.has(itemName)) return;

                                                            addedProps.add(itemName);

                                                            if (item.Name === "Path") {
                                                                setRightDevicePath(item.Value as string | undefined);
                                                            }

                                                            const column = columnList.find(
                                                                (column) => column.PName === item.Name
                                                            );

                                                            result.push({
                                                                Name: item.Name as string,
                                                                Value: item.Value as string,
                                                                PropertyLabel: (column?.PropertyLabel ?? item.Name) as string
                                                            });
                                                        });
                                                    });


                                                    setRightDeviceBasicProps(result);
                                                    const propWoid = result.find(item =>
                                                        ["replacementtemplate", "replacementtemplatewoid", "replacementprofile"].includes(item.Name?.toLowerCase() || "")
                                                    )?.Value?.toString().trim();
                                                    if (propWoid && propWoid.toLowerCase() !== "null" && propWoid.toLowerCase() !== "undefined") {
                                                        setDeviceWorkorderProfile(propWoid);
                                                    } else {
                                                        setDeviceWorkorderProfile("");
                                                    }
                                                }
                                            }
                                        }
                                    }, statusbarContext);

                                }
                                const powerPortTableRecord = getTablevsPropertyApiResp.find((item) => item.tableName === "PG.DevicePowerPort");
                                const networkPortTableRecord = getTablevsPropertyApiResp.find((item) => item.tableName === "PG.DeviceNetworkPort");
                                if (powerPortTableRecord && powerPortTableRecord.properties && typeof powerPortTableRecord.properties === "string") {
                                    const parsed = FnParseJsonSafely(powerPortTableRecord.properties);
                                    setColumnDefsPowerPort(buildAgGridColumns(parsed, 'power'));

                                }
                                if (networkPortTableRecord && networkPortTableRecord.properties && typeof networkPortTableRecord.properties === "string") {
                                    const parsed = FnParseJsonSafely(networkPortTableRecord.properties);
                                    setColumnDefsNetworkPort(buildAgGridColumns(parsed, 'network'));
                                }
                            }
                        }
                    }
                }, statusbarContext)
                axiosInterceptor({
                    url: CABLING.GetDevicePort,
                    data: {
                        deviceEntID: deviceData.DeviceID,
                        isPower: true
                    },
                    setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                        let powerPorts: IPortDataItem[] = [];
                        if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object") {
                            try {
                                const rawPortsJson = (getConnectivityApiResponse as Record<string, unknown>).portsJson;
                                const parsed = typeof rawPortsJson === "string" ? FnParseJsonSafely(rawPortsJson) : rawPortsJson;
                                const portsArray = (parsed as any)?.Ports ?? (getConnectivityApiResponse as any)?.Ports;
                                if (Array.isArray(portsArray) && portsArray.length > 0) {
                                    for (let index = 0; index < portsArray.length; index++) {
                                        const element = portsArray[index];
                                        powerPorts.push({
                                            Name: element.DevicePortName,
                                            CompositeName: element.CompositePortName,
                                            Gender: element.PortGender,
                                            PortUse: element.DevicePortUse,
                                            PortType: element.DevicePortType,
                                            EntID: element.DevicePortID
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error('Error parsing power ports:', error);
                            }
                        }
                        setRightPowerPortData(powerPorts);
                    }
                }, statusbarContext)
                axiosInterceptor({
                    url: CABLING.GetDevicePort,
                    data: {
                        deviceEntID: deviceData.DeviceID,
                        isPower: false
                    },
                    setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                        let networkPorts: IPortDataItem[] = [];
                        if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object") {
                            try {
                                const rawPortsJson = (getConnectivityApiResponse as Record<string, unknown>).portsJson;
                                const parsed = typeof rawPortsJson === "string" ? FnParseJsonSafely(rawPortsJson) : rawPortsJson;
                                const portsArray = (parsed as any)?.Ports ?? (getConnectivityApiResponse as any)?.Ports;
                                if (Array.isArray(portsArray) && portsArray.length > 0) {
                                    for (let index = 0; index < portsArray.length; index++) {
                                        const element = portsArray[index];
                                        networkPorts.push({
                                            Name: element.DevicePortName,
                                            CompositeName: element.CompositePortName,
                                            Gender: element.PortGender,
                                            PortUse: element.DevicePortUse,
                                            PortType: element.DevicePortType,
                                            EntID: element.DevicePortID
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error('Error parsing network ports:', error);
                            }
                        }
                        setRightNetworkPortData(networkPorts);
                    }
                }, statusbarContext)
            }
            const deviceDetails: IPlacementDevice = {
                Name: editDeviceReplacementProps.selectedNodeExplorer.Name ?? "",
                _Device: editDeviceReplacementProps.selectedNodeExplorer.Name ?? "",
                EntityName: editDeviceReplacementProps.selectedNodeExplorer.NodeEntityname ?? "",
                EntId: editDeviceReplacementProps.selectedNodeExplorer.NodeEntID ?? "",
                RURequired: editDeviceReplacementProps.selectedNodeExplorer.SlotsNeeded,
                power: editDeviceReplacementProps.selectedNodeExplorer.Power ?? 0,
                thermal: editDeviceReplacementProps.selectedNodeExplorer.Thermal ?? 0,
                powerport: editDeviceReplacementProps.selectedNodeExplorer.HasNetworkPorts ?? 0,
                networkport: editDeviceReplacementProps.selectedNodeExplorer.HasNetworkPorts ?? 0,
                Weight: editDeviceReplacementProps.selectedNodeExplorer.Weight ?? 0,
                DeviceID: editDeviceReplacementProps.selectedNodeExplorer.NodeEntID ?? "",
                StartMountIndex: 0
            }
            handleClickIgnoreConflict(deviceDetails);
            setSelectedDevice(deviceDetails);
            const rawTemplateWoid =
                (editDeviceReplacementProps.selectedNodeExplorer as any)?.ReplacementTemplateWOID
                ?? (editDeviceReplacementProps.selectedNodeExplorer as any)?.ReplacementTemplate
                ?? (editDeviceReplacementProps.selectedNodeExplorer as any)?.ReplacementProfile
                ?? (editDeviceReplacementProps.selectedNodeExplorer as any)?.replacementProfile;
            const explorerWo = rawTemplateWoid && String(rawTemplateWoid).trim().toLowerCase() !== "null" && String(rawTemplateWoid).trim().toLowerCase() !== "undefined"
                ? String(rawTemplateWoid).trim()
                : "";

            setDefaultSelectedNode(undefined);
            setLeftDeviceBasicProps([]);
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDevicePath(undefined);
            setIsPortChanged(false);
            restoredMappingTokenRef.current = "";

            if (explorerWo) {
                setDeviceWorkorderProfile(explorerWo);
            } else {
                setDeviceWorkorderProfile("");
                setIsLeftDeviceLoading(false);
            }
        } else {
            setSelectedDevice(undefined);
            setRightNetworkPortData([]);
            setRightPowerPortData([]);
            setColumnDefsPowerPort([]);
            setRightDeviceBasicProps([]);
            setColumnDefsNetworkPort([]);
            setDeviceWorkorderProfile("");
            restoredMappingTokenRef.current = "";
        }
    }, [
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID
    ])



    const handleToggleChange = (value: boolean, meta: IChangeMeta): void => {
        setIsTransferPortLabel(value);
    }

    const handleClickInformation = async () => {
        setIsPortChanged(false);
        workorderCacheRef.current.clear();

        const eqid =
            rightDeviceBasicProps.find(
                (item: BasicPropItem) => item.Name?.toLowerCase() === "eqid"
            )?.Value?.toString().trim()
            || editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
            || selectedDevice?.EQID?.toString().trim()
            || "";
        const eqidLeft =
            leftDeviceBasicProps.find(
                (item: BasicPropItem) => item.Name?.toLowerCase() === "eqid"
            )?.Value?.toString().trim()
            || defaultSelectedNode?.EQID?.toString().trim()
            || (defaultSelectedNode as any)?.eqid?.toString().trim()
            || "";

        if (!eqid) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                "Device details not found to create workorder"
            );
            return;
        }
        if (!defaultSelectedNode || !defaultSelectedNode.NodeEntID) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                "Please select a replacement device from inventory"
            );
            return;
        }
        const woDesc = `Replace_${eqid}_${eqidLeft}`;
        const existingTemplateWoid = getReplacementTemplateWoid()?.trim() || "";
        if (existingTemplateWoid) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                "Replacement profile already exists"
            );
            return;
        }

        let woidToUse = "";

        // Generate WOID automatically using MISC.ComputeCustomId
        try {
            woidToUse = (await callAPIForGetWorkorderName(statusbarContext)) as string;
        } catch (error) {
            console.error("Error generating WOID via MISC.ComputeCustomId:", error);
        }

        if (!woidToUse) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                "Failed to generate Workorder ID"
            );
            return;
        }

        const sourceEntId = String(
            defaultSelectedNode?.NodeEntID
            ?? (defaultSelectedNode as any)?.EntID
            ?? (defaultSelectedNode as any)?.EntId
            ?? ""
        );
        const sourceEntityName = String(
            defaultSelectedNode?.NodeEntityname
            ?? (defaultSelectedNode as any)?.EntityName
            ?? "Device"
        );
        const sourceDevice = String(
            defaultSelectedNode?.Name
            ?? (defaultSelectedNode as any)?._Device
            ?? ""
        );
        const sourceEqid = String(
            eqidLeft
            || defaultSelectedNode?.EQID?.toString().trim()
            || (defaultSelectedNode as any)?.eqid?.toString().trim()
            || ""
        );
        const sourcePath = String(
            leftDevicePath
            || defaultSelectedNode?.NodePath
            || (defaultSelectedNode as any)?.nodePath
            || (defaultSelectedNode as any)?.node?.NodePath
            || (defaultSelectedNode as any)?.Path
            || sourceDevice
            || ""
        );

        const destEntId = String(
            editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID
            ?? selectedDevice?.EntId
            ?? ""
        );
        const destEntityName = String(
            editDeviceReplacementProps.selectedNodeExplorer?.NodeEntityname
            ?? selectedDevice?.EntityName
            ?? "Device"
        );
        const destDevice = String(
            editDeviceReplacementProps.selectedNodeExplorer?.Name
            ?? selectedDevice?._Device
            ?? selectedDevice?.Name
            ?? ""
        );
        const destEqid = String(
            eqid
            || editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
            || selectedDevice?.EQID?.toString().trim()
            || ""
        );
        const destPath = String(
            rightDevicePath
            || editDeviceReplacementProps.selectedNodeExplorer?.NodePath
            || (editDeviceReplacementProps.selectedNodeExplorer as any)?.nodePath
            || (editDeviceReplacementProps.selectedNodeExplorer as any)?.node?.NodePath
            || (editDeviceReplacementProps.selectedNodeExplorer as any)?.Path
            || (selectedDevice as any)?.Path
            || destDevice
            || ""
        );

        function getMessage(messageObj: UnknownRecord) {
            const replaceDevice = messageObj["Replace Device"];
            if (replaceDevice && typeof replaceDevice === "object") {
                const msg = (replaceDevice as UnknownRecord).message;
                return typeof msg === "string" ? msg : "";
            }
            return "";
        }

        const getPortName = (port: any): string => {
            return String(
                port?.Name
                || port?.DevicePortName
                || port?.PortName
                || (port?.CompositeName ? String(port.CompositeName).split('.').pop() : "")
                || ""
            ).trim();
        };

        const getPortView = (port: any): string => {
            const rawView = String(port?.ViewName || port?.View || port?.DevicePortView || "").trim();
            if (rawView.toLowerCase().includes("rear") || String(port?.CompositeName || "").includes("(R)")) {
                return "Rear";
            }
            return "Front";
        };

        const portmappings: Array<{ source: string; sourceview: string; dest: string; destview: string }> = [];

        if (rightPowerPortData.length) {
            for (let index = 0; index < rightPowerPortData.length; index++) {
                const element = rightPowerPortData[index];
                if (element.connectedportEntId) {
                    const filterSelecteditem = leftPowerPortData.find((item) =>
                        String(item.EntID) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.EntID)
                    );
                    if (filterSelecteditem) {
                        portmappings.push({
                            source: getPortName(filterSelecteditem),
                            sourceview: getPortView(filterSelecteditem),
                            dest: getPortName(element),
                            destview: getPortView(element)
                        });
                    }
                }
            }
        }

        if (rightNetworkPortData.length) {
            for (let index = 0; index < rightNetworkPortData.length; index++) {
                const element = rightNetworkPortData[index];
                if (element.connectedportEntId) {
                    const filterSelecteditem = leftNetworkPortData.find((item) =>
                        String(item.EntID) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.EntID)
                    );
                    if (filterSelecteditem) {
                        portmappings.push({
                            source: getPortName(filterSelecteditem),
                            sourceview: getPortView(filterSelecteditem),
                            dest: getPortName(element),
                            destview: getPortView(element)
                        });
                    }
                }
            }
        }

        const payload = {
            sourcePath: destPath || destDevice,
            FromEQID: destEqid,
            ToEQID: sourceEqid
        };
        const messageObj = FnFindMessageAndReplaceVariables(payload, "Replacement");
        let msg = getMessage(messageObj);
        if (!msg) {
            msg = `Replace device model ${destEqid} with ${sourceEqid} at ${destPath || destDevice}`;
        }

        const itemJsonObj = {
            source: {
                EntId: sourceEntId,
                EntityName: sourceEntityName,
                _Device: sourceDevice,
                EQID: sourceEqid,
                Path: sourcePath
            },
            dest: {
                EntId: destEntId,
                EntityName: destEntityName,
                _Device: destDevice,
                EQID: destEqid,
                Path: destPath
            },
            action: "ReplacementProfile",
            Workordername: woidToUse,
            message: msg,
            portmapping: portmappings,
            transferlabel: isTransferPortLabel ? "True" : "False"
        };

        const woItems: UnknownRecord[] = [
            {
                ItemJson: JSON.stringify(itemJsonObj),
                SeqNo: 1
            }
        ];
        const result = await FnCreateWorkOrderApiCalls({
            action: "Replacement",
            WorkorderType: "Replacement",
            ParentEntityName: defaultSelectedNode?.NodeEntityname ?? "",
            ParentID: defaultSelectedNode?.NodeEntID ?? "",
            statusBarContext: statusbarContext,
            sessionContext: sessionContext,
            workOrderProfileName: woidToUse,
            DESC250: woDesc,
            workOrderItems: woItems
        });

        if (result) {
            const finalWoid =
                (result as any)?.workorderProfile?.[0]?._WorkorderProfile
                || (result as any)?.workorderProfile?.[0]?._Workorder
                || (result as any)?.woid
                || woidToUse;

            setDeviceWorkorderProfile(finalWoid);
            setIsOptedOut(false);
            setIsPortChanged(false);

            editDeviceReplacementProps.handleShowUserMessage?.(
                `Replacement profile (${finalWoid}) created successfully`
            );

            // Populate popup with updated / newly created workorder only
            const rawProfile = (result as any)?.workorderProfile?.[0] || {};
            const initialRecord: IWorkorderRecord = {
                _Workorder: finalWoid,
                WorkorderType: "Replacement",
                Desc250: woDesc,
                _Site: editDeviceReplacementProps.selectedNodeExplorer?.SiteName || "",
                _Room: "",
                _Floor: "",
                DateCreated: new Date(),
                CreatedBy: sessionContext.SessionList?.find((item) => item.VariableName?.toLowerCase() === "loginshortname")?.SessionValue ?? "",
                Status: "Open",
                ...rawProfile,
            };
            const initialItems: IWorkorderItem[] = [
                {
                    _Workorder: finalWoid,
                    SeqNo: 1,
                    Operation: "ReplacementProfile",
                    SourceEntityName: sourceEntityName || "Device",
                    SourceEntId: sourceEntId || "",
                    TargetEntityName: destEntityName || "",
                    TargetEntId: destEntId || "",
                    Instructions: "",
                    message: msg,
                    Status: "Open"
                }
            ];
            setPopupWorkorderRecords([initialRecord]);
            setPopupWorkorderItems(initialItems);
            setPopupWorkorderId(finalWoid);
            await persistReplacementProfile(finalWoid);
        }

    }

    const handleNodeSelect = (selectedNode?: ITreeNode, _treeNodes?: ITreeNode[], isTargetNotFound?: boolean): void => {
        restoredMappingTokenRef.current = "";

        const isDeviceNode = Boolean(
            selectedNode &&
            selectedNode.NodeEntID &&
            selectedNode.NodeEntityname &&
            selectedNode.NodeEntityname.toLowerCase() !== "__rack" &&
            selectedNode.NodeType?.toLowerCase() !== "bin" &&
            (Number(selectedNode.SlotsNeeded) > 0 || Boolean(selectedNode.EQID) || Boolean((selectedNode as any).eqid))
        );

        if (isDeviceNode && selectedNode && selectedNode.NodeEntID && selectedNode.NodeEntityname) {
            setIsLeftDeviceLoading(true);

            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDeviceBasicProps([]);

            setRightPowerPortData((prev) =>
                prev.map((r) => ({
                    ...r,
                    tooltip: "",
                    connectedportEntId: "",
                    connectedportEntityName: "",
                    transferportlabel: false
                }))
            );
            setRightNetworkPortData((prev) =>
                prev.map((r) => ({
                    ...r,
                    tooltip: "",
                    connectedportEntId: "",
                    connectedportEntityName: "",
                    transferportlabel: false
                }))
            );

            let payload = {
                entityName: selectedNode.NodeEntityname
            }

            axiosInterceptor({
                url: EM.GetTableVsProperty,
                data: payload,
                setFetchData: (getTablevsPropertyApiResp: unknown, status?: string) => {
                    if (status === "200" && getTablevsPropertyApiResp) {
                        if (Array.isArray(getTablevsPropertyApiResp) && getTablevsPropertyApiResp.length) {

                            let oneToOneTables: string[] = [];
                            let columnList: UnknownRecord[] = [];
                            for (let index = 0; index < getTablevsPropertyApiResp.length; index++) {
                                const element = getTablevsPropertyApiResp[index];
                                if (!element.isOneToManyRelation) {
                                    oneToOneTables.push(element.tableName);
                                    if (element.properties) {
                                        const parsedArray = FnParseJsonSafely(element.properties)
                                        columnList = [...columnList, ...parsedArray];
                                    }
                                }

                            }

                            if (oneToOneTables.length > 0) {
                                axiosInterceptor({
                                    url: EM.GetAllTablesRecord,
                                    data: {
                                        entID: selectedNode.NodeEntID,
                                        tableNames: oneToOneTables.join(DELIMITER.separator),
                                    },
                                    setFetchData: (response: unknown) => {
                                        try {
                                            if (response && typeof response === "object" && 'jsonStringOutput' in response) {
                                                if (response.jsonStringOutput) {
                                                    const jsonData = JSON.parse(response.jsonStringOutput as string);
                                                    const result: BasicPropItem[] = [];
                                                    const deviceProps = [
                                                        "_Device", "Manufacturer", "MfgEqType", "MfgProdLine",
                                                        "RURequired", "Power", "Thermal", "Power port", "Network port",
                                                        "Weight", "EQID", "Path"
                                                    ];

                                                    if (!Array.isArray(jsonData?.AllTables)) {
                                                        return;
                                                    }

                                                    const addedProps = new Set<string>();

                                                    jsonData.AllTables.forEach((table: UnknownRecord) => {
                                                        if (!Array.isArray(table?.TableData)) return;

                                                        table.TableData.forEach((item: UnknownRecord) => {
                                                            const itemName = String(item?.Name ?? "");
                                                            if (!deviceProps.some(p => p.toLowerCase() === itemName.toLowerCase())) return;

                                                            //  Prevent duplicates
                                                            if (addedProps.has(itemName.toLowerCase())) return;

                                                            addedProps.add(itemName.toLowerCase());

                                                            if (itemName.toLowerCase() === "path") {
                                                                setLeftDevicePath(item.Value as string);
                                                            }

                                                            const column = columnList.find(
                                                                (column) => (column.PName as string)?.toLowerCase() === itemName.toLowerCase()
                                                            );

                                                            result.push({
                                                                Name: item.Name as string,
                                                                Value: item.Value as string,
                                                                PropertyLabel: column?.PropertyLabel as string ?? item.Name as string
                                                            });
                                                        });
                                                    });
                                                    setLeftDeviceBasicProps(result);
                                                }
                                            }
                                        } finally {
                                            setIsLeftDeviceLoading(false);
                                        }
                                    }
                                }, statusbarContext).catch(() => {
                                    setIsLeftDeviceLoading(false);
                                });

                            } else {
                                setIsLeftDeviceLoading(false);
                            }


                        } else {
                            setIsLeftDeviceLoading(false);
                        }
                    } else {
                        setIsLeftDeviceLoading(false);
                    }
                }
            }, statusbarContext).catch(() => {
                setIsLeftDeviceLoading(false);
            });


            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);

            axiosInterceptor({
                url: CABLING.GetDevicePort,
                data: {
                    deviceEntID: selectedNode.NodeEntID,
                    isPower: true
                },
                setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                    let powerPorts: IPortDataItem[] = [];
                    if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object") {
                        try {
                            const rawPortsJson = (getConnectivityApiResponse as Record<string, unknown>).portsJson;
                            const parsed = typeof rawPortsJson === "string" ? FnParseJsonSafely(rawPortsJson) : rawPortsJson;
                            const portsArray = (parsed as any)?.Ports ?? (getConnectivityApiResponse as any)?.Ports;
                            if (Array.isArray(portsArray) && portsArray.length > 0) {
                                for (let index = 0; index < portsArray.length; index++) {
                                    const element = portsArray[index];
                                    powerPorts.push({
                                        Name: element.DevicePortName,
                                        CompositeName: element.CompositePortName,
                                        Gender: element.PortGender,
                                        PortUse: element.DevicePortUse,
                                        PortType: element.DevicePortType,
                                        EntID: element.DevicePortID
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing left power ports:', error);
                        }
                    }
                    setLeftPowerPortData(powerPorts);
                }
            }, statusbarContext)
            axiosInterceptor({
                url: CABLING.GetDevicePort,
                data: {
                    deviceEntID: selectedNode.NodeEntID,
                    isPower: false
                },
                setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                    let networkPorts: IPortDataItem[] = [];
                    if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object") {
                        try {
                            const rawPortsJson = (getConnectivityApiResponse as Record<string, unknown>).portsJson;
                            const parsed = typeof rawPortsJson === "string" ? FnParseJsonSafely(rawPortsJson) : rawPortsJson;
                            const portsArray = (parsed as any)?.Ports ?? (getConnectivityApiResponse as any)?.Ports;
                            if (Array.isArray(portsArray) && portsArray.length > 0) {
                                for (let index = 0; index < portsArray.length; index++) {
                                    const element = portsArray[index];
                                    networkPorts.push({
                                        Name: element.DevicePortName,
                                        CompositeName: element.CompositePortName,
                                        Gender: element.PortGender,
                                        PortUse: element.DevicePortUse,
                                        PortType: element.DevicePortType,
                                        EntID: element.DevicePortID
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing left network ports:', error);
                        }
                    }
                    setLeftNetworkPortData(networkPorts);
                }
            }, statusbarContext)
            setDefaultSelectedNode(selectedNode);
        } else {
            setDefaultSelectedNode(undefined);
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDeviceBasicProps([]);
            setLeftDevicePath(undefined);
            if (selectedNode !== undefined || !getReplacementTemplateWoid() || isTargetNotFound) {
                setIsLeftDeviceLoading(false);
            }
        }
    }
    const handleOptin = (): void => {
        setIsPortChanged(false);
        handleClickInformation();
    };

    const handleOptout = async (): Promise<void> => {
        const woidToDelete = getReplacementTemplateWoid() || deviceWorkorderProfile || "";
        const deviceEntId = editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? "";
        const deviceName = editDeviceReplacementProps.selectedNodeExplorer?.Name ?? "";

        if (!woidToDelete && !deviceEntId) {
            editDeviceReplacementProps.handleShowUserMessage?.("No workorder found to delete");
            return;
        }

        statusbarContext.setIsLoading(true);

        try {
            // Find _WorkorderProfile table's EntID
            let profileEntId = "";
            let finalWoid = woidToDelete;

            // 1. First, call GetWorkorderDetails api passing ReplacementTemplateWOID to get EntID of _WorkorderProfile table
            if (woidToDelete) {
                try {
                    const details = await fetchWorkorderDetails(woidToDelete, true);
                    if (details.profiles && details.profiles.length > 0) {
                        for (const p of details.profiles as any[]) {
                            const ent =
                                p?.EntID ??
                                p?.EntId ??
                                p?.entid ??
                                p?._EntID ??
                                p?._EntId ??
                                p?._WorkorderProfileEntID ??
                                p?.ProfileEntID ??
                                p?.WorkorderProfileID ??
                                p?.workorderProfileID ??
                                p?.ID ??
                                p?.id;
                            if (ent) {
                                profileEntId = String(ent);
                                break;
                            }
                            const nested = p?._WorkorderProfile ?? p?.WorkorderProfile ?? p?.workorderProfile;
                            if (Array.isArray(nested) && nested.length > 0) {
                                const nestedEnt = nested[0]?.EntID ?? nested[0]?.EntId ?? nested[0]?.entid ?? nested[0]?._WorkorderProfileEntID;
                                if (nestedEnt) {
                                    profileEntId = String(nestedEnt);
                                    break;
                                }
                            } else if (nested && typeof nested === "object") {
                                const nestedEnt = nested?.EntID ?? nested?.EntId ?? nested?.entid ?? nested?._WorkorderProfileEntID;
                                if (nestedEnt) {
                                    profileEntId = String(nestedEnt);
                                    break;
                                }
                            }
                        }
                    }

                    // Check items from details if profileEntId not found yet (in PG.WorkorderItem, EntID is the profile's EntID)
                    if (!profileEntId && details.items && details.items.length > 0) {
                        for (const it of details.items as any[]) {
                            const ent =
                                it?.EntID ??
                                it?.EntId ??
                                it?.entid ??
                                it?._EntID ??
                                it?._WorkorderProfileEntID ??
                                it?.ProfileEntID ??
                                it?.WorkorderProfileID ??
                                it?.workorderProfileID ??
                                it?.ParentID;
                            if (ent) {
                                profileEntId = String(ent);
                                break;
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error reading WorkorderProfile from GetWorkorderDetails:", err);
                }
            }

            // 2. Check popup records if available
            if (!profileEntId) {
                const fromPopup = popupWorkorderRecords?.find(
                    (item) => !woidToDelete || item._Workorder?.toLowerCase() === woidToDelete?.toLowerCase()
                );
                if (fromPopup) {
                    const ent = (fromPopup as any).EntID ?? (fromPopup as any).EntId ?? (fromPopup as any).entid ?? (fromPopup as any)._WorkorderProfileEntID;
                    if (ent) {
                        profileEntId = String(ent);
                    }
                    if (!finalWoid && fromPopup._Workorder) {
                        finalWoid = fromPopup._Workorder;
                    }
                }
            }
            if (!profileEntId && popupWorkorderItems?.length > 0) {
                const fromItem = popupWorkorderItems.find(
                    (it) => !woidToDelete || it._Workorder?.toLowerCase() === woidToDelete?.toLowerCase()
                );
                if (fromItem) {
                    const ent = (fromItem as any).EntID ?? (fromItem as any).EntId ?? (fromItem as any).entid ?? (fromItem as any)._WorkorderProfileEntID ?? (fromItem as any).ParentID;
                    if (ent) {
                        profileEntId = String(ent);
                    }
                }
            }

            // 3. Fallback: Query ALERT.GetAlertProfiles to get _WorkorderProfile table rows and take EntID
            if (!profileEntId) {
                let allProfiles: UnknownRecord[] = [];
                try {
                    allProfiles = await new Promise<UnknownRecord[]>((resolve) => {
                        axiosInterceptor({
                            url: ALERT.GetAlertProfiles,
                            data: {
                                entityName: EntityNameEnums.WorkorderProfile,
                            },
                            setFetchData: (handleApiResp: unknown, status?: string) => {
                                if (status === "200" && handleApiResp && typeof handleApiResp === "object" && 'alertJson' in handleApiResp) {
                                    try {
                                        const data = FnHandleAPIResponse((handleApiResp as any).alertJson, "Dataset");
                                        resolve(Array.isArray(data) ? data : []);
                                    } catch {
                                        resolve([]);
                                    }
                                } else {
                                    resolve([]);
                                }
                            }
                        }, statusbarContext);
                    });
                } catch {
                    allProfiles = [];
                }

                if (!allProfiles.length) {
                    const siteName = FnGetSessionVariableFromStorage('Location', "SiteName", sessionContext.SessionList);
                    try {
                        allProfiles = await new Promise<UnknownRecord[]>((resolve) => {
                            axiosInterceptor({
                                url: ALERT.GetAlertProfiles,
                                data: {
                                    entityName: EntityNameEnums.WorkorderProfile,
                                    siteName: siteName
                                },
                                setFetchData: (handleApiResp: unknown, status?: string) => {
                                    if (status === "200" && handleApiResp && typeof handleApiResp === "object" && 'alertJson' in handleApiResp) {
                                        try {
                                            const data = FnHandleAPIResponse((handleApiResp as any).alertJson, "Dataset");
                                            resolve(Array.isArray(data) ? data : []);
                                        } catch {
                                            resolve([]);
                                        }
                                    } else {
                                        resolve([]);
                                    }
                                }
                            }, statusbarContext);
                        });
                    } catch {
                        allProfiles = [];
                    }
                }

                if (!allProfiles.length) {
                    try {
                        allProfiles = (await FnGetWorkOrderProfile(sessionContext, statusbarContext)) as UnknownRecord[];
                    } catch {
                        allProfiles = [];
                    }
                }

                const woidNorm = (woidToDelete || "").trim().toLowerCase();
                const devEntNorm = (deviceEntId || "").trim().toLowerCase();
                const devNameNorm = (deviceName || "").trim().toLowerCase();

                const matchedProfile = allProfiles.find((item: UnknownRecord) => {
                    const pName = String(item._WorkorderProfile ?? item.WorkorderProfile ?? item._Workorder ?? item.Name ?? "").trim().toLowerCase();
                    if (woidNorm && pName === woidNorm) return true;
                    const ent = String((item as any).EntID ?? (item as any).EntId ?? (item as any).entid ?? "").trim().toLowerCase();
                    if (woidNorm && ent === woidNorm) return true;
                    if (devEntNorm && (String(item.ParentID).toLowerCase() === devEntNorm || String(item.DeviceID).toLowerCase() === devEntNorm)) return true;
                    if (devNameNorm && String(item._Device ?? item.DeviceName ?? "").toLowerCase() === devNameNorm) return true;
                    return false;
                });

                if (matchedProfile) {
                    const ent = (matchedProfile as any).EntID ?? (matchedProfile as any).EntId ?? (matchedProfile as any).entid ?? (matchedProfile as any)._WorkorderProfileEntID;
                    if (ent) {
                        profileEntId = String(ent);
                    }
                    if (!finalWoid) {
                        finalWoid = String(matchedProfile._WorkorderProfile ?? matchedProfile.WorkorderProfile ?? matchedProfile._Workorder ?? "");
                    }
                }
            }

            // If profileEntId is still not found: user explicitly removed records from database!
            if (!profileEntId) {
                if (deviceEntId) {
                    try {
                        await FnCallApiForUpdateDeviceWoProfile(
                            deviceEntId,
                            "",
                            statusbarContext,
                            editDeviceReplacementProps.featureId
                        );
                    } catch (err) {
                        console.error("Error clearing device workorder profile:", err);
                    }
                } else if (finalWoid) {
                    await new Promise<void>((resolve) => {
                        axiosInterceptor({
                            url: DEVICE.ClearWoid,
                            data: {
                                woid: finalWoid
                            },
                            setFetchData: (_: unknown) => resolve()
                        }, statusbarContext);
                    });
                }

                // Reset UI state & clear caches
                setIsOptedOut(true);
                workorderCacheRef.current.clear();
                workorderInFlightRef.current.clear();
                setDeviceWorkorderProfile("");
                setPopupWorkorderId("");
                setPopupWorkorderRecords([]);
                setPopupWorkorderItems([]);
                setDefaultSelectedNode(undefined);
                setLeftPowerPortData([]);
                setLeftNetworkPortData([]);
                setLeftDeviceBasicProps([]);
                setLeftDevicePath(undefined);
                setIsLeftDeviceLoading(false);
                setIsPortChanged(false);
                restoredMappingTokenRef.current = "";

                if (editDeviceReplacementProps.selectedNodeExplorer) {
                    const node = editDeviceReplacementProps.selectedNodeExplorer as any;
                    delete node.ReplacementTemplateWOID;
                    delete node.ReplacementTemplate;
                    delete node.ReplacementProfile;
                    delete node.replacementProfile;
                    delete node.replacementTemplateWOID;
                    node.ReplacementTemplateWOID = "";
                    node.ReplacementTemplate = "";
                    node.ReplacementProfile = "";
                }
                rightDeviceBasicPropsRef.current = rightDeviceBasicPropsRef.current.map((item) => {
                    if (["replacementtemplate", "replacementtemplatewoid", "replacementprofile", "_workorderprofile"].includes(item.Name?.toLowerCase() || "")) {
                        return { ...item, Value: "" };
                    }
                    return item;
                });
                setRightDeviceBasicProps((prev) =>
                    prev.map((item) => {
                        if (["replacementtemplate", "replacementtemplatewoid", "replacementprofile", "_workorderprofile"].includes(item.Name?.toLowerCase() || "")) {
                            return { ...item, Value: "" };
                        }
                        return item;
                    })
                );

                editDeviceReplacementProps.handleShowUserMessage?.(
                    finalWoid ? `Workorder(${finalWoid}) profile record not found to delete` : "Workorder profile record not found to delete"
                );
                editDeviceReplacementProps.handleReloadTree?.(
                    editDeviceReplacementProps.featureId,
                    deviceEntId
                );
                return;
            }

            // Normal case: delete records from database
            // Delete PG.WorkorderItem using _WorkorderProfile's EntID
            await new Promise<void>((resolve, reject) => {
                axiosInterceptor({
                    url: EM.DeleteTableRecords,
                    data: {
                        entityName: EntityNameEnums.WorkorderProfile,
                        tableName: "PG.WorkorderItem",
                        entIDs: profileEntId,
                    },
                    allowShowLoader: true,
                    setFetchData: (_response: unknown, status?: string) => {
                        if (status === "200") resolve();
                        else reject(new Error("Failed to delete workorder items"));
                    }
                }, statusbarContext);
            });

            // Delete _WorkorderProfile using _WorkorderProfile's EntID
            await new Promise<void>((resolve, reject) => {
                axiosInterceptor({
                    url: EM.DeleteTableRecords,
                    data: {
                        entityName: EntityNameEnums.WorkorderProfile,
                        tableName: `_${EntityNameEnums.WorkorderProfile}`,
                        entIDs: profileEntId,
                    },
                    allowShowLoader: true,
                    setFetchData: (_response: unknown, status?: string) => {
                        if (status === "200") resolve();
                        else reject(new Error("Failed to delete workorder profile"));
                    }
                }, statusbarContext);
            });

            // Clear device workorder profile in device table if deviceEntId, else clear WOID
            if (deviceEntId) {
                try {
                    await FnCallApiForUpdateDeviceWoProfile(
                        deviceEntId,
                        "",
                        statusbarContext,
                        editDeviceReplacementProps.featureId
                    );
                } catch (err) {
                    console.error("Error clearing device workorder profile:", err);
                }
            } else if (finalWoid) {
                await new Promise<void>((resolve) => {
                    axiosInterceptor({
                        url: DEVICE.ClearWoid,
                        data: {
                            woid: finalWoid
                        },
                        setFetchData: (_: unknown) => resolve()
                    }, statusbarContext);
                });
            }

            // Reset UI state & clear caches
            setIsOptedOut(true);
            workorderCacheRef.current.clear();
            workorderInFlightRef.current.clear();
            setDeviceWorkorderProfile("");
            setPopupWorkorderId("");
            setPopupWorkorderRecords([]);
            setPopupWorkorderItems([]);
            setDefaultSelectedNode(undefined);
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDeviceBasicProps([]);
            setLeftDevicePath(undefined);
            setIsLeftDeviceLoading(false);
            setIsPortChanged(false);
            restoredMappingTokenRef.current = "";

            if (editDeviceReplacementProps.selectedNodeExplorer) {
                const node = editDeviceReplacementProps.selectedNodeExplorer as any;
                delete node.ReplacementTemplateWOID;
                delete node.ReplacementTemplate;
                delete node.ReplacementProfile;
                delete node.replacementProfile;
                delete node.replacementTemplateWOID;
                node.ReplacementTemplateWOID = "";
                node.ReplacementTemplate = "";
                node.ReplacementProfile = "";
            }
            rightDeviceBasicPropsRef.current = rightDeviceBasicPropsRef.current.map((item) => {
                if (["replacementtemplate", "replacementtemplatewoid", "replacementprofile", "_workorderprofile"].includes(item.Name?.toLowerCase() || "")) {
                    return { ...item, Value: "" };
                }
                return item;
            });
            setRightDeviceBasicProps((prev) =>
                prev.map((item) => {
                    if (["replacementtemplate", "replacementtemplatewoid", "replacementprofile", "_workorderprofile"].includes(item.Name?.toLowerCase() || "")) {
                        return { ...item, Value: "" };
                    }
                    return item;
                })
            );

            // Notify user and reload tree
            editDeviceReplacementProps.handleShowUserMessage?.(
                finalWoid
                    ? `Successfully deleted replacement workorder (${finalWoid})`
                    : "Successfully deleted replacement workorder"
            );
            editDeviceReplacementProps.handleReloadTree?.(
                editDeviceReplacementProps.featureId,
                deviceEntId
            );
        } catch (error) {
            console.error("Error during optout:", error);
            const msg = error instanceof Error ? error.message : "Failed to delete replacement workorder";
            editDeviceReplacementProps.handleShowUserMessage?.(msg);
        } finally {
            statusbarContext.setIsLoading(false);
        }
    };

    function handleSelectedTabs(tab: string[]): void {
        setIsPortChanged(false);
        if (tab.includes("OptOut") || tab.includes("Optout")) {
            handleOptout();
        } else if (tab.includes("OptIn") || tab.includes("Optin")) {
            handleOptin();
        } else {
            handleClickInformation();
        }
    }

    function handleClose(_event: unknown, _actionCode?: string | undefined, _payload?: unknown): void {
        editDeviceReplacementProps.handleSidebarClose?.();
    }

    const currentWoid = getReplacementTemplateWoid();
    const hasWoid = Boolean(currentWoid) && !isOptedOut;
    const nodeProfileWoid = (() => {
        const node = editDeviceReplacementProps.selectedNodeExplorer as any;
        const raw =
            node?.ReplacementTemplateWOID
            ?? node?.ReplacementTemplate
            ?? node?.ReplacementProfile
            ?? node?.replacementProfile;
        const text = raw == null ? "" : String(raw).trim();
        if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") {
            return "";
        }
        return text;
    })();
    const showWorkorderLog = !isOptedOut && Boolean(nodeProfileWoid || deviceWorkorderProfile);
    const isDeviceNodeSelected = Boolean(defaultSelectedNode && defaultSelectedNode.NodeEntID);

    const optInTab = {
        uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optin`,
        label: {
            uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optin-label`,
            label: "OptIn",
            tooltip: "OptIn"
        },
        w: "auto",
        h: "calc(var(--node_height) - var(--spacing-1))",
        actionCode: "OptIn",
        handleMouse: function (): void {
            handleOptin();
        }
    };

    const optOutTab = {
        uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optout`,
        label: {
            uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optout-label`,
            label: "OptOut",
            tooltip: "OptOut"
        },
        w: "auto",
        h: "calc(var(--node_height) - var(--spacing-1))",
        actionCode: "OptOut",
        handleMouse: function (): void {
            handleOptout();
        }
    };

    const overlayTabs = hasWoid || showWorkorderLog
        ? [optOutTab]
        : (isDeviceNodeSelected ? [optInTab] : []);

    return (
        <div key={editDeviceReplacementProps.uniqueName} className="nz-wh-100 nz-edit-device-replacement-container">
            <div className='nz-sub-header'>
                {overlayTabs.length > 0 ? (
                    <OverlayTab
                        uniqueName={`${editDeviceReplacementProps.uniqueName}-replacement-overlay`}
                        tabs={overlayTabs}
                        ShowOnlyIcon={true}
                        allowUnSelect={true}
                        selectedTabName={""}
                        tabAlignment={"horizontal"}
                        headerText={`Replace Device`}
                        useContainer={false}
                        handleSelectedTab={handleSelectedTabs}
                    />
                ) : (
                    <Label label={"Replace Device"} uniqueName={`${editDeviceReplacementProps.uniqueName}-title`} />
                )}
                <ActionImage uniqueName={`${editDeviceReplacementProps.uniqueName}-explorer-tree-info-ai`}
                    image={{
                        uniqueName: `${editDeviceReplacementProps.uniqueName}-explorer-tree-info-image`,
                        source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                            fill="none"
                            strokeWidth={1} />,
                        w: 'var(--image-size-2)',
                        tooltip: "Click to view node details in sidebar",
                        type: "svg"

                    }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'} handleMouse={handleClose} />

            </div>
            <Splitter key={showWorkorderLog ? "replacement-log" : "replacement-panes"} tabIndex={-1} className="nz-wh-100 nz-edit-device-replacement-content">
                {[
                    <SplitterPanel key="device" tabIndex={-1} size={30} minSize={20} className="nz-wh-100 nz-d-flex-column nz-edit-device-replacement-pane2 nz-pane-2">
                        <div className="nz-replacement-container">
                            {
                                selectedDevice ? <div className="nz-wh-100 nz-replacement-container">
                                    <div className='nz-w-100 nz-sub-header nz-alert-delivery-main-header'>
                                        <Label uniqueName={`${editDeviceReplacementProps.uniqueName}-edit-replacement-pane2`}
                                            label={`Device Replacement : (${selectedDevice?._Device})`} />

                                    </div>
                                    <div className="nz-h-auto">
                                        <BasicGrid
                                            uniqueName={`${editDeviceReplacementProps.uniqueName}-device-props2`}
                                            instanceName={"deviceprops2"}
                                            showGrid={true}
                                            allowColumnResize={true}
                                            allowAutoSizeColumn={true}
                                            columnDefs={columnDefsForDeviceProps}
                                            rowData={rightDeviceBasicProps}
                                            containerName={"deviceprops2"} />
                                    </div>
                                    {Boolean(rightPowerPortData && rightPowerPortData.length > 0 && columnDefsPowerPort && columnDefsPowerPort.length > 0) ? <div
                                        ref={rightPowerPortGridRef}
                                        data-grid-side="right"
                                        data-port-type="power"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => handleDragOver(e, "power")}
                                        onDragStart={(e) => handleContainerDragStart(e, 'power', 'right')}
                                        onMouseDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onPointerDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseEnter={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseMove={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        className="nz-h-auto"
                                    > <DevicePortGrid
                                            uniqueName={`${editDeviceReplacementProps.uniqueName}-right-power-port`}
                                            portType={"power"}
                                            instanceName={"pane2powerport"}
                                            featureId={editDeviceReplacementProps.featureId}
                                            columnDefs={columnDefsPowerPort!}
                                            allowHeader={true}
                                            headerText={`Power Ports (${selectedDevice?._Device})`}
                                            onFirstDataRendered={() => {
                                                attachDragAndDropEvents(rightPowerPortGridRef.current, rightPowerPortData, 'power', 'right')
                                            }}
                                            onRowDataUpdated={() => {
                                                attachDragAndDropEvents(rightPowerPortGridRef.current, rightPowerPortData, 'power', 'right')
                                            }}
                                            rowData={rightPowerPortData} /></div> : null}
                                    {Boolean(rightNetworkPortData && rightNetworkPortData.length > 0 && columnDefsNetworkPort && columnDefsNetworkPort.length > 0) ? <div
                                        ref={rightNetworkPortGridRef}
                                        data-grid-side="right"
                                        data-port-type="network"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => handleDragOver(e, "network")}
                                        onDragStart={(e) => handleContainerDragStart(e, 'network', 'right')}
                                        onMouseDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onPointerDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseEnter={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseMove={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        className="nz-h-auto"
                                    ><DevicePortGrid
                                            uniqueName={`${editDeviceReplacementProps.uniqueName}-right-network-port`}
                                            portType={"network"}
                                            instanceName={"pane2networkport"}
                                            featureId={editDeviceReplacementProps.featureId}
                                            columnDefs={columnDefsNetworkPort!}
                                            allowHeader={true}
                                            headerText={`Network Ports (${selectedDevice?._Device})`}
                                            onFirstDataRendered={() => {
                                                attachDragAndDropEvents(rightNetworkPortGridRef.current, rightNetworkPortData, 'network', 'right')
                                            }}
                                            onRowDataUpdated={() => {
                                                attachDragAndDropEvents(rightNetworkPortGridRef.current, rightNetworkPortData, 'network', 'right')
                                            }}
                                            rowData={rightNetworkPortData} /></div> : null}
                                </div> :
                                    <div className="nz-error-message" >
                                        <Label uniqueName={`${editDeviceReplacementProps.uniqueName}-no-selected`} label={"Please Select Device to Replace"} />
                                    </div>}
                        </div>
                    </SplitterPanel>,

                    showWorkorderLog ? (
                        <SplitterPanel key="workorder-log" tabIndex={-1} size={70} minSize={30} className="nz-wh-100 nz-d-flex-column nz-pane-3">
                            <div className="nz-wh-100 nz-delivery-log-container" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
                                <div className="nz-h-40-px nz-d-flex-row nz-align-center nz-sub-header" style={{ padding: "0 10px", flexShrink: 0 }}>
                                    <Label
                                        label={`Replacement Profile : ${popupWorkorderId || currentWoid}`}
                                        uniqueName={`${editDeviceReplacementProps.uniqueName}-workorder-log-title`}
                                        fontWeight="bold"
                                    />
                                </div>
                                <div className="nz-delivery-log-content" style={{ flexGrow: 1, overflow: "hidden", minHeight: 0 }}>
                                    {popupWorkorderRecords.length > 0 ? (
                                        <Workorderlog
                                            workorderRecords={popupWorkorderRecords}
                                            selectWorkorder={popupWorkorderId || currentWoid}
                                            hideWorkorderList={true}
                                            readonlyWorkorderlog={true}
                                            getWorkorderItems={handleGetWorkOrderItems}
                                            onApprove={handleApproveWorkorder}
                                            onAssignTo={handleWorkorderAssign}
                                            onDelete={handleDeleteWorkorder}
                                            onExecute={handleExecuteWorkorder}
                                            onRefresh={handleRefreshWorkorder}
                                            getassignToNames={handleGetUserNameList}
                                            printWorkorder={handlePrintWorkorder}
                                            setWorkorderItemNotes={handleSetWorkorderItemNotes}
                                            setWorkorderRecord={handleSetWorkOrderRecord}
                                        />
                                    ) : (
                                        <div className="nz-wh-100 nz-d-flex-hv-left" style={{ padding: "16px" }}>
                                            Loading Workorder Log...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SplitterPanel>
                    ) : (
                        <SplitterPanel tabIndex={-1} size={25} minSize={15} className="nz-wh-100 nz-d-flex-column nz-pane-3">
                            <div className="nz-dc-explorer-container">


                                <div className='nz-sub-header'>
                                    <Label label={"Available devices in Inventory"} uniqueName={`${editDeviceReplacementProps.uniqueName}-title`} />
                                </div>
                                <div>

                                    <DcTreeContainer
                                        uniqueName={"dcexplorer"}
                                        selectedDevice={selectedDevice}
                                        featureId={editDeviceReplacementProps.featureId}
                                        handleNodeSelect={handleNodeSelect} />
                                </div>
                            </div>
                        </SplitterPanel>
                    ),
                    !showWorkorderLog ? (
                        <SplitterPanel key="replace" size={25} minSize={20} className="nz-wh-100 nz-d-flex-column nz-edit-device-replacement-pane4 nz-pane-4">
                            {leftDeviceBasicProps?.length ? <div className="nz-replace-container">
                                <div className='nz-sub-header'>
                                    <Label label={"Replace with"} uniqueName={`${editDeviceReplacementProps.uniqueName}-title`} />
                                </div>
                                <div className="nz-w-100 nz-replacement-container">

                                    <div className="nz-h-auto">
                                        <BasicGrid
                                            uniqueName={`${editDeviceReplacementProps.uniqueName}-device-props1`}
                                            instanceName={"deviceprops"}
                                            showGrid={true}
                                            columnDefs={columnDefsForDeviceProps}
                                            rowData={leftDeviceBasicProps}
                                            allowAutoSizeColumn={true}
                                            allowColumnResize={true}
                                            containerName={"deviceprops"}
                                        />
                                    </div>
                                    <div className="nz-toggle-container">
                                        <p>Drag and drop ports to map</p>
                                        <div className="nz-toggle-container-transfer" >
                                            <YesNoControl
                                                name={`${editDeviceReplacementProps.uniqueName}-transfer-toggle`}
                                                label={"Transfer Port Label"}
                                                value={isTransferPortLabel}
                                                onChange={handleToggleChange} />

                                        </div>
                                    </div>
                                    {Boolean(leftPowerPortData && leftPowerPortData.length > 0 && columnDefsPowerPort && columnDefsPowerPort.length > 0) ? <div
                                        ref={leftPowerPortGridRef}
                                        data-grid-side="left"
                                        data-port-type="power"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => handleDragOver(e, "power")}
                                        onDragStart={(e) => handleContainerDragStart(e, 'power', 'left')}
                                        onMouseDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onPointerDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseEnter={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseMove={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        className="nz-h-auto"
                                    > <DevicePortGrid
                                            uniqueName={`${editDeviceReplacementProps.uniqueName}-left-power-port`}
                                            portType={"power"}
                                            instanceName={"pane4powerport"}
                                            featureId={editDeviceReplacementProps.featureId}
                                            columnDefs={columnDefsPowerPort!}
                                            allowHeader={true}
                                            headerText={`Power Ports (${defaultSelectedNode?.Name})`}
                                            onFirstDataRendered={() => {
                                                attachDragAndDropEvents(leftPowerPortGridRef.current, leftPowerPortData, 'power', 'left')
                                            }}
                                            onRowDataUpdated={() => {
                                                attachDragAndDropEvents(leftPowerPortGridRef.current, leftPowerPortData, 'power', 'left')
                                            }}
                                            rowData={leftPowerPortData} /></div> : null}
                                    {Boolean(leftNetworkPortData && leftNetworkPortData.length > 0 && columnDefsNetworkPort && columnDefsNetworkPort.length > 0) ? <div
                                        ref={leftNetworkPortGridRef}
                                        data-grid-side="left"
                                        data-port-type="network"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => handleDragOver(e, "network")}
                                        onDragStart={(e) => handleContainerDragStart(e, 'network', 'left')}
                                        onMouseDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onPointerDown={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseEnter={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        onMouseMove={(e) => makeRowDraggable(e.target as HTMLElement)}
                                        className="nz-h-auto"
                                    ><DevicePortGrid
                                            uniqueName={`${editDeviceReplacementProps.uniqueName}-left-network-port`}
                                            portType={"network"}
                                            instanceName={"pane4networkport"}
                                            featureId={editDeviceReplacementProps.featureId}
                                            columnDefs={columnDefsNetworkPort!}
                                            allowHeader={true}
                                            headerText={`Network Ports (${defaultSelectedNode?.Name})`}
                                            onFirstDataRendered={() => {
                                                attachDragAndDropEvents(leftNetworkPortGridRef.current, leftNetworkPortData, 'network', 'left')
                                            }}
                                            onRowDataUpdated={() => {
                                                attachDragAndDropEvents(leftNetworkPortGridRef.current, leftNetworkPortData, 'network', 'left')
                                            }}
                                            rowData={leftNetworkPortData} /></div> : null}
                                </div>
                            </div> : isLeftDeviceLoading ? (
                                <div className="nz-error-message">
                                    <Label uniqueName={`${editDeviceReplacementProps.uniqueName}-loading`} label={"Loading..."} />
                                </div>
                            ) : (
                                <div className="nz-error-message">
                                    <Label uniqueName={`${editDeviceReplacementProps.uniqueName}-no-selected`} label={"No Device Selected, Please Select Device"} />
                                </div>
                            )}
                        </SplitterPanel>
                    ) : null
                ].filter(Boolean)}

            </Splitter>

            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={`${editDeviceReplacementProps.uniqueName}-workorder-confirm`}
                message={confirmMessage ?? ""}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={() => {
                    setIsConfirmOpen(false);
                }}
            />
            {isReportDialogOpen && (
                <GeneratePdf
                    uniqueName={`${editDeviceReplacementProps.uniqueName}-workorder-report`}
                    isOpen={isReportDialogOpen}
                    reportJson={reportTemplateJson}
                    title="Work Order Report"
                    selectedNode={editDeviceReplacementProps.selectedNodeExplorer}
                    onClose={() => {
                        setIsReportDialogOpen(false);
                        setReportTemplateJson(null);
                    }}
                />
            )}

        </div>
    )
}

export { EditDeviceReplacement }

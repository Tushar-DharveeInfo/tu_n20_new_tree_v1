
import { useCallback, useEffect, useRef, useState } from "react";
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { Workorderlog, IWorkorderRecord, IWorkorderItem } from "@n20a/libform";
import '@n20a/libform/style.css'
import '../../allcss/rackandstack/WorkOrderContainer.css'
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor";
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks";
import { EntityNameEnums } from "../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { ALERT, AUTH, DEVICE, EM, LOG, MISC } from "../../../shared/interceptors/EndPoints";
import { IWorkOrderContainer } from "../../allinterface/rackandstack/IWorkOrderContainer"
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl"
import { FnHandleAPIResponse } from "../../../shared/allcommon/basic/FnHandleAPIResponse";
import { getDiagnosticLevelData } from "../../../shared/context/contextandprovider/CommonVariable";
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks";
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { FnAutoExecuteWorkOrder, FnCallApiForUpdateDeviceWoProfile } from "../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls";
import { FEnums } from "../../../constants/Feature";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { parseAssignToUserNames } from "../../../appqa/allcommon/FnAppqaAlertFilterUtils";
import { Label } from "../../../shared/basic/label/Label";
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage";
import { OpenSidebar24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { ISessionVariable } from "../../../shared/allinterface/basic/ISessionVariable";
import { FnUpdateSession } from "../../../shared/allcommon/FnUpdateSession";
import { FnCreateReportForPrint } from "../../../shared/allcommon/generatepdf/FnCreateReportForPrint";
import { GeneratePdf } from "../../../shared/generatepdf/GeneratePdf";
import { TReportLayoutJson } from "../../../shared/allinterface/IGeneratePdf";
import { useSelectedNodeContext } from "../../../shared/context/hooks/SelectedNodeHooks";

const parseUtcDateToLocal = (dateInput: string | Date | undefined | null): Date | undefined => {
    if (!dateInput) return undefined;
    if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? undefined : dateInput;

    const str = String(dateInput).trim();
    if (!str) return undefined;

    // 1. Date-Only (YYYY-MM-DD or YYYY/MM/DD) - construct local midnight so it does not shift to previous day
    const dateOnlyMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch.map(Number);
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? undefined : d;
    }

    // 2. Full DateTime with explicit 'Z' or offset (+HH:MM / -HH:MM)
    if (/Z$/i.test(str) || /[+-]\d{2}(:?\d{2})?$/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? undefined : d;
    }

    // 3. Naive ISO DateTime (e.g. 2026-09-14T14:11:00 or with .217) - treat as UTC by appending 'Z'
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/i.test(str)) {
        const d = new Date(`${str}Z`);
        return isNaN(d.getTime()) ? undefined : d;
    }

    // 4. Fallback
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? undefined : fallback;
};

const mapWorkOrderData = (data: any[]): IWorkorderRecord[] => {
    return data.map((item): IWorkorderRecord => ({
        ...item,
        _Site: item._Site || "",
        _Room: item._Room || "",
        _Floor: item._Floor || "",

        //  important mapping
        _Workorder: item._WorkorderProfile || "",

        Desc250: item.Desc250 || "",
        WorkorderType: item.WorkorderType || "",

        DateCreated: parseUtcDateToLocal(item.DateCreated),
        CreatedBy: item.CreatedBy || "",

        DateApproved: parseUtcDateToLocal(item.DateApproved),
        ApprovedBy: item.ApprovedBy || "",

        DateExecuted: parseUtcDateToLocal(item.DateExecuted),
        ExecutedBy: item.ExecutedBy || "",

        DateAssigned: parseUtcDateToLocal(item.DateAssigned),
        AssignedBy: item.AssignedBy || "",
        AssignedTo: item.AssignedTo || "",

        //  new field
        Instructions: item.Instructions || "",
        Status: item.Status ?? "",
    }));
};

const mapWorkOrderItems = (data: any[]) => {
    return data.map((item, index) => {
        let parsed: any = {};

        try {
            parsed = item.ItemJson ? JSON.parse(item.ItemJson) : {};
        } catch (e) {
            console.error("Invalid ItemJson:", item.ItemJson);
        }

        const source = parsed?.source || {};
        const dest = parsed?.dest || {};

        return {
            _Workorder: parsed?.Workordername || item._WorkorderProfile || "",

            SeqNo: item.SeqNo ?? index + 1,

            Operation: parsed?.action || "",


            //  Source mapping
            SourceEntityName: source?.EntityName || "Device",
            SourceEntId: source?.EntId || "",

            //  Destination mapping
            TargetEntityName: dest?.EntityName || "",
            TargetEntId: dest?.EntId || "",

            //  Optional (useful for UI/debug)
            SourceDetails: source,
            TargetDetails: dest,
            Instructions: parsed.Instructions ?? "",
            message: parsed.message,
            Status: item.Status ?? ""
        };
    });
};

const WorkOrderContainer = (workOrderContainerProps: IWorkOrderContainer) => {
    const diagnosticLevel = getDiagnosticLevelData()
    const [originalWorkOrderRecords, setOriginalWorkOrderRecords] = useState<any[]>([]);
    const [originalWorkOrderItems, setOriginalWorkOrderItems] = useState<any[]>([]);
    const [workOrderRecords, setWorkOrderRecords] = useState<IWorkorderRecord[]>();
    const [workOrderItems, setWorkOrderItems] = useState<IWorkorderItem[]>([]);
    const [getAssignToUserNames, setGetAssignToUserNames] = useState<string[]>([])
    const [selectedWorkorderProfile, setSelectedWorkorderProfile] = useState<string>();
    const [loading, setLoading] = useState(true);

    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>();
    const [userAction, setUserAction] = useState<{ action: "DELETE" | "EXECUTE"; wo: string }>();
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);

    const sessionContext = useSessionContext();
    const selectedNodeContext = useSelectedNodeContext();
    const [wo] = useState(() => new URLSearchParams(window.location.search).get("wo"));
    const siteName = sessionContext?.SessionList?.find(
        (item) => item.VariableName?.toLowerCase() === "sitename"
    )?.SessionValue;

    const statusBarContext = useStatusBarContext();
    const siteNameRef = useRef(siteName);
    const selectedNodeRef = useRef(workOrderContainerProps.selectedNode);
    const handleShowUserMessageRef = useRef(workOrderContainerProps.handleShowUserMessage);
    const fetchGenerationRef = useRef(0);
    siteNameRef.current = siteName;
    selectedNodeRef.current = workOrderContainerProps.selectedNode;
    handleShowUserMessageRef.current = workOrderContainerProps.handleShowUserMessage;

    const isValidWorkorderNode = (node?: ITreeNode | null): boolean => {
        const nodeType = node?.NodeType?.toLowerCase();
        return Boolean(nodeType && ["site", "floor", "room"].includes(nodeType));
    };

    const getNodeIdCandidates = (node?: ITreeNode) => {
        const ids = [node?.NodeEntID, node?.EntID, node?.key]
            .filter(Boolean)
            .map((id) => id!.toString().toLowerCase());

        return new Set(
            ids.flatMap((id) => {
                const baseId = id.split("##")[0];
                return baseId && baseId !== id ? [id, baseId] : [id];
            })
        );
    };

    const fetchWorkOrderProfiles = useCallback((): Promise<IWorkorderRecord[]> => {
        return new Promise((resolve) => {
            const targetNode = selectedNodeRef.current;
            if (!isValidWorkorderNode(targetNode)) {
                resolve([]);
                return;
            }

            axiosInterceptor({
                url: ALERT.GetAlertProfiles,
                data: {
                    entityName: EntityNameEnums.WorkorderProfile,
                },
                setFetchData: (resp: unknown, status?: string) => {
                    if (
                        status === "200" &&
                        resp &&
                        typeof resp === "object" &&
                        'alertJson' in resp
                    ) {
                        try {
                            const data = FnHandleAPIResponse(resp.alertJson, "Dataset");

                            // ALWAYS store original data
                            setOriginalWorkOrderRecords(data);

                            const currentNode = selectedNodeRef.current;
                            if (!isValidWorkorderNode(currentNode)) {
                                resolve([]);
                                return;
                            }
                            const currentSiteName = siteNameRef.current;
                            const nodeType = currentNode?.NodeType?.toLowerCase() ?? "";
                            const nodeIds = getNodeIdCandidates(currentNode);

                            const filteredData =
                                diagnosticLevel === "0"
                                    ? data
                                    : data.filter((item: any) => {
                                        // SiteName may update after feature switch; do not block Floor/Room id matches.
                                        const isSiteMatch =
                                            !currentSiteName ||
                                            item._Site?.toLowerCase() === currentSiteName.toLowerCase();

                                        switch (nodeType) {
                                            case "site":
                                                return isSiteMatch;

                                            case "floor": {
                                                const floorId = item.FloorID?.toString().toLowerCase() ?? "";
                                                return floorId !== "" && nodeIds.has(floorId);
                                            }

                                            case "room": {
                                                const roomId = item.RoomID?.toString().toLowerCase() ?? "";
                                                return roomId !== "" && nodeIds.has(roomId);
                                            }

                                            default:
                                                return false;
                                        }
                                    });

                            resolve(mapWorkOrderData(filteredData));

                        } catch {
                            resolve([]);
                        }
                    } else {
                        resolve([]);
                    }
                }
            }, statusBarContext);
        });
    }, [diagnosticLevel, statusBarContext]);

    const fetchWorkOrderItems = useCallback((): Promise<IWorkorderItem[]> => {
        return new Promise((resolve) => {
            axiosInterceptor({
                url: MISC.GetTableData,
                data: {
                    tableName: "PG.WorkorderItem",
                },
                setFetchData: (resp: unknown, status?: string) => {
                    if (status === "200" && resp && typeof resp === "object" && 'dataJson' in resp) {
                        try {
                            const parsed = JSON.parse(resp.dataJson as string);
                            setOriginalWorkOrderItems(parsed);
                            resolve(mapWorkOrderItems(parsed));
                        } catch (error) {
                            console.error('Error in parse json string :', error);
                            resolve([]);
                        }
                    } else {
                        resolve([]);
                    }
                }
            }, statusBarContext);
        });
    }, [statusBarContext]);

    const refreshWorkOrders = useCallback(
        async (tableName?: "PROFILE" | "ITEM") => {
            const selectedNode = selectedNodeRef.current;
            if (!isValidWorkorderNode(selectedNode)) {
                setLoading(false);
                return;
            }

            const currentFetchGen = ++fetchGenerationRef.current;
            setLoading(true);

            if (tableName === "PROFILE") {

                const profiles = await fetchWorkOrderProfiles();
                if (currentFetchGen !== fetchGenerationRef.current) return;
                setWorkOrderRecords(profiles);

            }
            else if (tableName === "ITEM") {

                const items = await fetchWorkOrderItems();
                if (currentFetchGen !== fetchGenerationRef.current) return;
                setWorkOrderItems(items);

            }
            else {

                const [profiles, items] = await Promise.all([
                    fetchWorkOrderProfiles(),
                    fetchWorkOrderItems()
                ]);
                if (currentFetchGen !== fetchGenerationRef.current) return;

                setWorkOrderRecords(profiles);
                setWorkOrderItems(items);
            }

            setLoading(false);

        },
        [fetchWorkOrderProfiles, fetchWorkOrderItems]
    );
    const refreshWorkOrdersRef = useRef(refreshWorkOrders);
    refreshWorkOrdersRef.current = refreshWorkOrders;

    useEffect(() => {

        if (wo) {
            setSelectedWorkorderProfile(wo);

            // clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [wo]);

    // Fetch only when selected node is a valid workorder node (Site/Room/Floor) — ignore device or other node types.
    useEffect(() => {
        if (!isValidWorkorderNode(workOrderContainerProps.selectedNode)) {
            return;
        }
        refreshWorkOrdersRef.current();
    }, [
        workOrderContainerProps.selectedNode?.NodeEntID,
        workOrderContainerProps.selectedNode?.NodeType
    ]);

    // Load assign-to users once per mount.
    useEffect(() => {
        const handleGetUsersApiResponse = (response: unknown, status?: string) => {
            if (status === "200" && response) {
                setGetAssignToUserNames(parseAssignToUserNames(response));
            }
        }

        axiosInterceptor({
            url: AUTH.GetUsers,
            data: {
                includeCurrentUser: true
            },
            allowShowLoader: true,
            setFetchData: handleGetUsersApiResponse
        }, statusBarContext)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const handleGetWorkOrderItems = (_workorder: string): IWorkorderItem[] => {

        const filteredItems = workOrderItems.filter((item) => item._Workorder === _workorder);
        if (filteredItems) {
            filteredItems.sort((a, b) => a.SeqNo - b.SeqNo);
            return filteredItems;
        }
        else {
            return [];
        }
    }

    const handleApproveWorkorder = (data: {
        _workorder: string;
        DateApproved?: Date;
        ApprovedBy: string;
    }): void => {
        if (originalWorkOrderRecords?.length) {
            const workOrderToUpdate = originalWorkOrderRecords.find((item) => item._WorkorderProfile.toLowerCase() === data._workorder.toLowerCase())
            const userName = sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "loginshortname")?.SessionValue ?? "";
            if (workOrderToUpdate) {
                workOrderToUpdate.ApprovedBy = userName;
                workOrderToUpdate.DateApproved = new Date().toISOString();
            }
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({
                        [`_${EntityNameEnums.WorkorderProfile}`]: [workOrderToUpdate]
                    })
                },
                setFetchData: async (resp: any, status?: string) => {
                    if (status !== "200") return;

                    try {
                        const parsed = JSON.parse(resp.jsonStringOutput);
                        const insertedId =
                            parsed?.[`_${EntityNameEnums.WorkorderProfile}`]?.[0]?.EntID || "";

                        setSelectedWorkorderProfile(data._workorder)
                        if (insertedId) {

                            workOrderContainerProps.handleShowUserMessage?.(
                                `Workorder (${data._workorder}) approved successfully`
                            );

                            // reload records
                            await refreshWorkOrders();
                        }

                    } catch (e) {
                        console.error("update workorderprofile failed", e);
                    }
                }
            }, statusBarContext);
        }

    }

    const handleWorkorderAssign = (data: {
        _workorder: string;
        DateAssigned?: Date;
        AssignedBy: string;
        AssignedTo: string;
    }): void => {
        if (originalWorkOrderRecords?.length) {
            const workOrderToUpdate = originalWorkOrderRecords.find((item) => item._WorkorderProfile.toLowerCase() === data._workorder.toLowerCase())
            const userName = sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "loginshortname")?.SessionValue ?? "";
            if (workOrderToUpdate) {
                workOrderToUpdate.AssignedBy = userName;
                workOrderToUpdate.AssignedTo = data.AssignedTo;
                workOrderToUpdate.DateAssigned = data.DateAssigned ?? new Date().toISOString();
            }
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({
                        [`_${EntityNameEnums.WorkorderProfile}`]: [workOrderToUpdate]
                    })
                },
                setFetchData: async (resp: any, status?: string) => {
                    if (status !== "200") return;

                    try {
                        const parsed = JSON.parse(resp.jsonStringOutput);

                        const insertedId =
                            parsed?.[`_${EntityNameEnums.WorkorderProfile}`]?.[0]?.EntID || "";
                        setSelectedWorkorderProfile(data._workorder)
                        if (insertedId) {

                            workOrderContainerProps.handleShowUserMessage?.(
                                `Workorder (${data._workorder}) is assigned to ${data.AssignedTo} successfully`
                            );

                            // reload records
                            await refreshWorkOrders();
                        }

                    } catch (e) {
                        console.error("update workorderprofile failed", e);
                    }
                }
            }, statusBarContext);
        }
    }

    const handleDeleteWorkorder = async (_workorder: string): Promise<void> => {
        const workOrderRecord = workOrderRecords?.find(
            (item) => item._Workorder === _workorder
        );

        if (!workOrderRecord || !(workOrderRecord as Record<string, any>).EntID) {
            workOrderContainerProps.handleShowUserMessage?.(`Workorder(${_workorder}) not found to delete`);
            return;
        }
        const handleCreateMessageApiResponse = (createMessageApiResponse: unknown) => {
            if (createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {

                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                setIsConfirmOpen(true);
                setUserAction({
                    action: "DELETE",
                    wo: _workorder
                })

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

    };

    const handleExecuteWorkorder = async (
        _workorder: string
    ): Promise<void> => {
        let currentRecord = workOrderRecords?.find(
            (item) => item._Workorder?.toLowerCase() === _workorder.toLowerCase()
        );

        try {
            if (
                !currentRecord ||
                !(currentRecord as Record<string, any>).EntID
            ) {
                workOrderContainerProps.handleShowUserMessage?.(
                    `Workorder(${_workorder}) not found to execute`
                );
                return;
            }

            setSelectedWorkorderProfile(_workorder);
            const isExecuted = await FnAutoExecuteWorkOrder(
                _workorder,
                statusBarContext
            );

            const responseError =
                isExecuted && typeof isExecuted === "object"
                    ? (isExecuted.errString ||
                        isExecuted.error ||
                        isExecuted.errorMessage ||
                        ((isExecuted.status === "Error" || isExecuted.status === "error" || isExecuted.Status === "Error")
                            ? (isExecuted.message || isExecuted.msg || "Execution error")
                            : undefined) ||
                        (isExecuted.success === false ? (isExecuted.message || "Execution failed") : undefined))
                    : undefined;

            if (responseError) {
                throw new Error(String(responseError));
            }

            if (isExecuted) {
                workOrderContainerProps.handleShowUserMessage?.(
                    `Workorder (${_workorder}) executed successfully`
                );
                await refreshWorkOrders();
            }

        } catch (error) {
            console.error(
                "Error while executing workorder",
                error
            );

            const rawError = error instanceof Error ? error.message : String(error);
            const errString = rawError?.trim() || `Failed to execute workorder : ${_workorder}`;
            const formattedError = errString.startsWith("ExecutionError:")
                ? errString
                : `ExecutionError:${errString}`;

            const filteredItem = originalWorkOrderRecords?.find(
                (item) => item._WorkorderProfile?.toLowerCase() === _workorder.toLowerCase()
            );

            const currentInstructions = (filteredItem?.Instructions ?? currentRecord?.Instructions ?? "").trim();
            const newInstructions = currentInstructions
                ? `${currentInstructions}\n${formattedError}`
                : formattedError;

            const itemToUpdate = filteredItem ?? (currentRecord ? {
                ...currentRecord,
                _WorkorderProfile: currentRecord._Workorder,
                EntityName: EntityNameEnums.WorkorderProfile
            } : null);

            if (itemToUpdate) {
                itemToUpdate.Instructions = newInstructions;
                axiosInterceptor({
                    url: EM.AddUpdateTableRecord,
                    data: {
                        jsonString: JSON.stringify({
                            [`_${EntityNameEnums.WorkorderProfile}`]: [itemToUpdate]
                        })
                    },
                    setFetchData: async (resp: any, status?: string) => {
                        if (status !== "200") return;

                        try {
                            const parsed = JSON.parse(resp.jsonStringOutput);

                            const insertedId =
                                parsed?.[`_${EntityNameEnums.WorkorderProfile}`]?.[0]?.EntID || "";
                            setSelectedWorkorderProfile(_workorder);
                            if (insertedId) {
                                await refreshWorkOrders('PROFILE');
                            }

                        } catch (e) {
                            console.error("update workorderprofile instructions failed", e);
                        }
                    }
                }, statusBarContext);
            }

            // Immediately update local records state to reflect new instructions in UI
            setWorkOrderRecords((prev) =>
                prev?.map((item) =>
                    item._Workorder.toLowerCase() === _workorder.toLowerCase()
                        ? { ...item, Instructions: newInstructions }
                        : item
                )
            );

            workOrderContainerProps.handleShowUserMessage?.(
                rawError || `Failed to execute workorder : ${_workorder}`
            );
        }
    };

    const handleRefreshWorkorder = (_workorder: string): void => {
        setSelectedWorkorderProfile(_workorder)
        refreshWorkOrders();

    }

    const handleGetUserNameList = (): string[] => {
        return getAssignToUserNames
    }
    const handlePrintWorkorder = async (workorder: {
        workorderEntityname: string;
        workorderEntityId: string;
    }) => {
        try {
            const workOrderRecord = workOrderRecords?.find(
                (item) => item._Workorder === workorder.workorderEntityId
            );
            if (workOrderRecord) {
                selectedNodeContext.setSelectedWorkorderRecord(workOrderRecord);
            }
            statusBarContext.setIsLoading(true);
            // update session variable
            const sessionData: ISessionVariable[] = [
                {
                    VariableContext: "Workorder",
                    VariableName: "SelectedWorkorder",
                    SessionValue: workorder.workorderEntityId,
                },
            ];
            await FnUpdateSession(sessionData, sessionContext, statusBarContext);

            const result = await FnCreateReportForPrint(
                "Workorder",
                statusBarContext,
                undefined,
                undefined
            );

            if (result && result.template) {
                setReportTemplateJson(result.template as TReportLayoutJson);
                setIsReportDialogOpen(true);
            } else {
                statusBarContext?.setUserActionData?.("Workorder Report Template not found.");
            }
        } catch (error) {
            console.error("Error printing workorder:", error);
            statusBarContext?.setUserActionData?.("Failed to generate workorder report.");
        } finally {
            statusBarContext.setIsLoading(false);
        }
    };

    const getDeviceEntIdsForWorkorder = async (woid: string): Promise<string[]> => {
        const ids = new Set<string>();

        const matchedRecord = workOrderRecords?.find(
            (item) => item._Workorder?.toLowerCase() === woid.toLowerCase()
        );
        const origRecord = originalWorkOrderRecords?.find(
            (item) => item._WorkorderProfile?.toLowerCase() === woid.toLowerCase()
        );

        if (matchedRecord) {
            if ((matchedRecord as any).ParentID) ids.add(String((matchedRecord as any).ParentID));
            if ((matchedRecord as any).DeviceID) ids.add(String((matchedRecord as any).DeviceID));
        }
        if (origRecord) {
            if (origRecord.ParentID) ids.add(String(origRecord.ParentID));
            if (origRecord.DeviceID) ids.add(String(origRecord.DeviceID));
        }

        const matchedItems = workOrderItems?.filter(
            (it) => it._Workorder?.toLowerCase() === woid.toLowerCase()
        ) || [];
        for (const it of matchedItems) {
            if (it.TargetEntId) ids.add(String(it.TargetEntId));
            if (it.SourceEntId) ids.add(String(it.SourceEntId));
        }

        const matchedOrigItems = originalWorkOrderItems?.filter(
            (it) => (it._WorkorderProfile || it._Workorder)?.toLowerCase() === woid.toLowerCase()
        ) || [];
        for (const it of matchedOrigItems) {
            if (it.ItemJson) {
                try {
                    const parsed = typeof it.ItemJson === "string" ? JSON.parse(it.ItemJson) : it.ItemJson;
                    if (parsed?.dest?.EntId) ids.add(String(parsed.dest.EntId));
                    if (parsed?.source?.EntId) ids.add(String(parsed.source.EntId));
                } catch {
                    // ignore
                }
            }
        }

        if (ids.size === 0) {
            try {
                await new Promise<void>((resolve) => {
                    axiosInterceptor({
                        url: DEVICE.WorkorderDetails,
                        data: { woid },
                        callSilently: true,
                        setFetchData: (resp: unknown, status?: string) => {
                            if (status === "200" && resp && typeof resp === "object") {
                                try {
                                    const responseData = resp as Record<string, unknown>;
                                    const deviceJsonValue = responseData.deviceJson ?? responseData.devicesJson;
                                    const deviceJson = typeof deviceJsonValue === "string" ? JSON.parse(deviceJsonValue) : deviceJsonValue ?? responseData;
                                    const detailsData = typeof (deviceJson as any)?.Data === "string" ? JSON.parse((deviceJson as any).Data) : (deviceJson as any)?.Data;
                                    const profiles = Array.isArray(detailsData) ? detailsData : detailsData ? [detailsData] : [];
                                    for (const p of profiles) {
                                        if (p?.ParentID) ids.add(String(p.ParentID));
                                        if (p?.DeviceID) ids.add(String(p.DeviceID));
                                        const items = p?.WorkorderItems ?? p?.workorderItems ?? [];
                                        for (const it of items) {
                                            const itemJson = typeof it?.ItemJson === "string" ? JSON.parse(it.ItemJson) : it?.ItemJson;
                                            if (itemJson?.dest?.EntId) ids.add(String(itemJson.dest.EntId));
                                            if (itemJson?.source?.EntId) ids.add(String(itemJson.source.EntId));
                                            if (it?.TargetEntId) ids.add(String(it.TargetEntId));
                                            if (it?.SourceEntId) ids.add(String(it.SourceEntId));
                                        }
                                    }
                                } catch {
                                    // ignore
                                }
                            }
                            resolve();
                        }
                    }, statusBarContext);
                });
            } catch {
                // ignore
            }
        }

        return Array.from(ids).filter(Boolean);
    };

    const handleConfirmYesClick = (): void => {
        if (userAction && userAction.action === "DELETE") {
            setIsConfirmOpen(false);
            const workOrderRecord = workOrderRecords?.find(
                (item) => item._Workorder === userAction.wo
            );

            if (!workOrderRecord || !(workOrderRecord as Record<string, any>).EntID) {
                workOrderContainerProps.handleShowUserMessage?.(`Workorder(${workOrderRecord?._Workorder}) not found to delete`);
                return;
            }
            const entID = (workOrderRecord as Record<string, any>).EntID;
            const woid = workOrderRecord._Workorder;

            const origRecord = originalWorkOrderRecords?.find(
                (item) => item._WorkorderProfile?.toLowerCase() === woid.toLowerCase()
            );
            const desc = (workOrderRecord.Desc250 || origRecord?.Desc250 || origRecord?.DESC250 || "").trim();
            const isReplacementTemplate =
                workOrderRecord.WorkorderType?.toLowerCase() === "replacement" ||
                origRecord?.WorkorderType?.toLowerCase() === "replacement" ||
                /Replace_[^_]+_[^_]+/i.test(desc) ||
                desc.toLowerCase().includes("replace_") ||
                desc.toLowerCase().startsWith("replace");

            // Step 1: delete items
            axiosInterceptor({
                url: EM.DeleteTableRecords,
                data: {
                    entityName: EntityNameEnums.WorkorderProfile,
                    tableName: "PG.WorkorderItem",
                    entIDs: entID
                },
                setFetchData: (_: unknown, status?: string) => {
                    if (status === "200") {

                        // Step 2: delete profile
                        axiosInterceptor({
                            url: EM.DeleteTableRecords,
                            data: {
                                entityName: EntityNameEnums.WorkorderProfile,
                                tableName: `_${EntityNameEnums.WorkorderProfile}`,
                                entIDs: entID
                            },
                            setFetchData: async (_: unknown, status?: string) => {
                                if (status === "200") {
                                    if (isReplacementTemplate) {
                                        // Clearing replacement template: do not call clearwoid, only clear ReplacementTemplate on device(s)
                                        try {
                                            const deviceIds = await getDeviceEntIdsForWorkorder(woid);
                                            if (deviceIds.length > 0) {
                                                await Promise.all(
                                                    deviceIds.map((devId) =>
                                                        FnCallApiForUpdateDeviceWoProfile(
                                                            devId,
                                                            "",
                                                            statusBarContext,
                                                            FEnums.ReplacementProfile
                                                        ).catch((err) => {
                                                            console.error(`Error clearing ReplacementTemplate on device ${devId}:`, err);
                                                        })
                                                    )
                                                );
                                            }
                                        } catch (err) {
                                            console.error("Error clearing replacement template on devices:", err);
                                        }

                                        workOrderContainerProps.handleShowUserMessage?.(
                                            `Workorder(${woid}) deleted successfully`
                                        );

                                        //  IMPORTANT: refresh after delete
                                        await refreshWorkOrders();
                                    } else {
                                        // Standard workorder: call ClearWoid (only one call is needed at a time)
                                        axiosInterceptor({
                                            url: DEVICE.ClearWoid,
                                            data: {
                                                woid: woid
                                            },
                                            setFetchData: async (_: unknown, clearStatus?: string) => {
                                                if (clearStatus === "200") {
                                                    workOrderContainerProps.handleShowUserMessage?.(
                                                        `Workorder(${woid}) deleted successfully`
                                                    );

                                                    //  IMPORTANT: refresh after delete
                                                    await refreshWorkOrders();
                                                }
                                            }
                                        }, statusBarContext);
                                    }
                                }
                            }
                        }, statusBarContext);
                    }
                }
            }, statusBarContext);
        }
    }

    const handleSetWorkorderItemNotes = (workorderItem: IWorkorderItem) => {
        const filteredItem = originalWorkOrderItems.find((item) => item._WorkorderProfile.toLowerCase() === workorderItem._Workorder.toLowerCase() && item.SeqNo === workorderItem.SeqNo);
        if (filteredItem && filteredItem.ItemJson) {
            const parsedJson = FnParseJsonSafely(filteredItem.ItemJson);
            parsedJson.Instructions = workorderItem.Instructions;
            filteredItem.ItemJson = JSON.stringify(parsedJson);
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({
                        [`PG.WorkorderItem`]: [filteredItem]
                    })
                },
                setFetchData: async (resp: any, status?: string) => {
                    if (status !== "200") return;

                    try {
                        const parsed = JSON.parse(resp.jsonStringOutput);

                        const insertedId =
                            parsed?.[`PG.WorkorderItem`]?.[0]?.EntID || "";

                        setSelectedWorkorderProfile(workorderItem._Workorder)
                        if (insertedId) {

                            workOrderContainerProps.handleShowUserMessage?.(
                                `Instructions for workorder(${workorderItem._Workorder}) item (${workorderItem.SeqNo}) updated successfully.`
                            );
                            // reload records
                            await refreshWorkOrders('ITEM');
                        }

                    } catch (e) {
                        console.error("update workorderprofile failed", e);
                    }
                }
            }, statusBarContext);
        }
    }

    const handleSetWorkOrderRecord = (workorderRecord: IWorkorderRecord) => {
        const filteredItem = originalWorkOrderRecords.find((item) => item._WorkorderProfile.toLowerCase() === workorderRecord._Workorder.toLowerCase());
        if (filteredItem) {
            filteredItem.Instructions = workorderRecord.Instructions;
            filteredItem.Desc250 = workorderRecord.Desc250;
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({
                        [`_${EntityNameEnums.WorkorderProfile}`]: [filteredItem]
                    })
                },
                setFetchData: async (resp: any, status?: string) => {
                    if (status !== "200") return;

                    try {
                        const parsed = JSON.parse(resp.jsonStringOutput);

                        const insertedId =
                            parsed?.[`_${EntityNameEnums.WorkorderProfile}`]?.[0]?.EntID || "";
                        setSelectedWorkorderProfile(workorderRecord._Workorder)
                        if (insertedId) {

                            workOrderContainerProps.handleShowUserMessage?.(
                                `Instructions for workorder(${workorderRecord._Workorder}) updated successfully.`
                            );

                            // reload records
                            await refreshWorkOrders('PROFILE');
                        }

                    } catch (e) {
                        console.error("update workorderprofile failed", e);
                    }
                }
            }, statusBarContext);
        }
    }


    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading alert logs...</div>;
    }

    if (!workOrderRecords || workOrderRecords?.length === 0) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No workorders found</div>;
    }


    return (
        <div className='nz-wh-100 nz-delivery-log-container' tabIndex={1} onKeyDown={handleContainerKeyDown} key={workOrderContainerProps.uniqueName}>
            <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                <div className="nz-d-flex-row nz-align-center nz-w-100">
                    <div className='nz-sub-header'>
                        <Label label={isValidWorkorderNode(workOrderContainerProps.selectedNode) ? `Workorders for: ${workOrderContainerProps.selectedNode?.Name}` : "Workorders"} uniqueName={`${workOrderContainerProps.uniqueName}-title`} />
                    </div>
                </div>
                {workOrderContainerProps.isShowSidebarBtn && <ActionImage uniqueName={`${workOrderContainerProps.uniqueName}-explorer-tree-info-ai`}
                    image={{
                        uniqueName: `${workOrderContainerProps.uniqueName}-explorer-tree-info-image`,
                        source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                            fill="none"
                            strokeWidth={1} />,
                        w: 'var(--image-size-2)',
                        tooltip: "Click to view node details in sidebar",
                        type: "svg"

                    }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'}
                    handleMouse={() => {
                        workOrderContainerProps.handleSidebarOpenClose?.('open')
                    }} />
                }

            </div>
            <div className="nz-delivery-log-content">
                <Workorderlog workorderRecords={workOrderRecords}
                    selectWorkorder={selectedWorkorderProfile}
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
            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'appqatask-confirm'}
                message={confirmMessage ?? ""}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={() => {
                    setIsConfirmOpen(false);
                }} />
            {isReportDialogOpen && (
                <GeneratePdf
                    uniqueName={`${workOrderContainerProps.uniqueName}-workorder-report`}
                    isOpen={isReportDialogOpen}
                    reportJson={reportTemplateJson}
                    title="Work Order Report"
                    selectedNode={workOrderContainerProps.selectedNode}
                    onClose={() => {
                        setIsReportDialogOpen(false);
                        setReportTemplateJson(null);
                    }}
                />
            )}
        </div>
    )
}

export default WorkOrderContainer
import { useCallback, useEffect, useMemo, useState } from 'react'
import '../allcss/audit/InventoryCollectionContainer.css'
import { IInventoryCollectionContainer, IPgRecord } from '../allinterface/audit/IInventoryCollectionContainer'
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks'
import { axiosInterceptor } from '../../shared/interceptors/Interceptor'
import { AUDIT, EM, LOG } from '../../shared/interceptors/EndPoints'
import { IPropertyColumn } from '../../shared/allinterface/sidebar/IPropertyFormContainer'
import { ChangedValueMap, IFormData, IFormElements, IWorkorderRecord, SelectWorkorder } from '@n20a/libform'
import { FnHandleAPIResponse } from '../../shared/allcommon/basic/FnHandleAPIResponse'
import { FnDeepClone } from '../../shared/allcommon/basic/FnDeepClone'
import { IActionImageForSubMenu } from '../../shared/allinterface/basic/IActionImageList'
import { RightMouseMenuGrid } from '../../constants/Feature'
import { hideGridData } from '../../shared/alldefaultprops/tablegrid/DefaultPropsBasicGrid'
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer'
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely'
import { FnBuildUrlForFind } from '../../shared/allcommon/FnBuildSessionPayloadForFind'
import { FEnums } from '../../constants/Feature'
import OneToManyFormForInventory from './OneToManyFormForInventory'
import { getDiagnosticLevelData } from '../../shared/context/contextandprovider/CommonVariable'
import { FnBuildFormElementsFromDataset } from '../../shared/allcommon/sidebar/FnBuildFormElementsFromDataset'
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks'
import { getMuForSite } from '../../shared/context/contextandprovider/ExplorerTree'
import { IBasicGridColDef, IColumnWidthEntry } from '../../shared/allinterface/tablegrid/IBasicGrid'
import { FnGetColumnWidthFromSession } from '../../shared/allcommon/tablegrid/FnGetColumnWidthFromSession'
import { IDialogActionBtn } from '../../shared/allinterface/basic/IYesNoFormContainer'
import { FnAutoExecuteWorkOrder, FnCreateWorkOrderApiCalls, FnGetWorkOrderProfile } from '../../appcontainer/allcommon/FnCreateWorkOrderApiCalls'
import { IFnCreateWorkOrderApiCall } from '../../appcontainer/allinterface/IFnCreateWorkOrderApiCalls'
import { FnNavigateToWorkOrder } from '../../shared/allcommon/FnNavigateToWorkOrder'
import { useSessionContext } from '../../shared/context/hooks/SessionHooks'

const InventoryCollectionContainer = ({ uniqueName, featureId, tableToShow, hideAddForm, selectedNode, treeData, updateStatusBarData, handleShowUserMessage, handleReloadTree }: IInventoryCollectionContainer) => {
    const [entityTables, setEntityTables] = useState<IPgRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [pgRecord, setPgRecord] = useState<IPgRecord>();
    const [defaultProfile, setDefaultProfile] = useState<Record<string, any>>();
    const [updatedProfile, setUpdatedProfile] = useState<Record<string, any>>();
    const [tableData, setTableData] = useState<Record<string, any>[]>();
    const [confirmMessage, setConfirmMessage] = useState<string>();
    const [isOpenConfirmBox, setIsOpenConfirmBox] = useState<boolean>(false);
    const [isShowOkOnly, setIsShowOkOnly] = useState<boolean>(false);
    const [selectedRow, setSelectedRow] = useState<Record<string, any>>();
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<string>();
    const [formElements, setFormElements] = useState<IFormElements>();
    const [gridColumns, setGridColumns] = useState<IBasicGridColDef[]>([]);
    const [formNodeId, setFormNodeId] = useState<string | undefined>();
    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
    const [customButtons, setCustomButtons] = useState<IDialogActionBtn[]>();
    const [showSelectWorkorder, setShowSelectWorkorder] = useState<boolean>(false);
    const [workorderRecords, setWorkorderRecords] = useState<IWorkorderRecord[]>([]);
    const [createWorkOrderPayload, setCreateWorkOrderPayload] = useState<IFnCreateWorkOrderApiCall>();
    const { NodeEntityname, Name, NodeEntID } = selectedNode
    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();

    // cleanup the variables
    useEffect(() => {
        setFormElements(undefined);
        setFormNodeId(undefined);
        setIsFormDirty(false);
        setTableData(undefined);
        setGridColumns([]);
        setLoading(true);
    }, [NodeEntID]);

    //useEffect to call api to get table definitions
    useEffect(() => {
        if (!NodeEntityname) return;

        axiosInterceptor(
            {
                url: EM.GetTableVsProperty,
                allowShowLoader: true,
                data: {
                    entityName: NodeEntityname,
                    tableNames: "",
                },
                setFetchData: (apiResponse: unknown, status?: string) => {
                    setEntityTables(
                        status === "200" && Array.isArray(apiResponse)
                            ? apiResponse
                            : []
                    );
                },
            },
            statusBarContext
        );
    }, [NodeEntityname]);

    // memoize entity tables based on tables to show
    const pgTable = useMemo(() => {

        return entityTables.find(
            t => t.tableName?.toLowerCase() === tableToShow.toLowerCase()
        );

    }, [entityTables, tableToShow]);

    // useCallbact to fetch inventory data
    const fetchInventoryForAudit = useCallback((EntID: string) => {
        axiosInterceptor(
            {
                url: AUDIT.GetInventoryForAudit,
                data: {
                    auditID: EntID,
                    showAll: true
                },
                setFetchData: (getInventoryForAuditApiResponse: unknown, status?: string) => {
                    try {

                        if (status === "200" &&
                            getInventoryForAuditApiResponse &&
                            typeof getInventoryForAuditApiResponse === "object" &&
                            "data" in getInventoryForAuditApiResponse
                        ) {
                            let resposeData = FnHandleAPIResponse(
                                getInventoryForAuditApiResponse.data,
                                "Dataset"
                            );

                            if (Array.isArray(resposeData) && resposeData.length > 0) {
                                let statusbarString: Record<string, string | number | undefined> = {
                                    Inventory: resposeData.length
                                };

                                let acceptedCount = 0;
                                let rejectedCount = 0;

                                for (let index = 0; index < resposeData.length; index++) {
                                    const element = resposeData[index];

                                    if (element.InventoryStatus === "Accepted") acceptedCount++;
                                    else if (element.InventoryStatus === "Reject") rejectedCount++;
                                }

                                if (acceptedCount > 0)
                                    statusbarString = { ...statusbarString, Accepted: acceptedCount };

                                if (rejectedCount > 0)
                                    statusbarString = { ...statusbarString, Rejected: rejectedCount };


                                resposeData = { "PG.AuditInventory": resposeData };

                                if (updateStatusBarData) {
                                    updateStatusBarData(
                                        JSON.stringify(statusbarString)
                                    );
                                }
                            }

                            const noDataMessage = () => {
                                setTableData([]);
                                handleShowUserMessage?.("No inventory data available");
                            };

                            if (
                                resposeData &&
                                typeof resposeData === "object" &&
                                !Array.isArray(resposeData)
                            ) {
                                const firstValue = Object.values(resposeData)[0];

                                if (Array.isArray(firstValue) && firstValue.length > 0) {
                                    setTableData(firstValue as Record<string, any>[]);
                                } else {
                                    noDataMessage();
                                }
                            } else {
                                noDataMessage();
                            }
                        } else {
                            setTableData([]);
                        }
                    } catch (error) {
                        console.error('Error in handle api response :', error);
                        handleShowUserMessage?.("Something went wrong in get inventory collection data");
                        setTableData([]);
                    }
                }
            },
            statusBarContext
        );
    }, [
        updateStatusBarData
    ]);

    const userBasicRole = useMemo(() => {
        return sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "loginuserbasicrolename")?.SessionValue
    }, [sessionContext.SessionList])

    // useEffect to load form to collect inventory
    useEffect(() => {
        if (!entityTables.length) return;
        const loadForm = async () => {
            if (!pgTable?.properties) {
                setLoading(false);
                setTableData([]);
                return;
            }

            setFormElements(undefined);
            setIsFormDirty(false);
            try {
                const parsedJson = typeof pgTable.properties === 'string' && JSON.parse(pgTable.properties) as IPropertyColumn[];

                if (parsedJson && parsedJson?.length) {
                    const defaultValues: Record<string, any> = {};

                    for (let index = 0; index < parsedJson.length; index++) {
                        const element = parsedJson[index];

                        if (element.InputMask?.toLowerCase() === "refassetid") {
                            element.InputMask = element.InputMask + "|" + NodeEntID;
                        }
                        else if (element.PName?.toLowerCase() === "entityname") {
                            defaultValues[element.PName] = NodeEntityname;
                        }
                        else if (element.PName?.toLowerCase() === "_auditsession") {
                            defaultValues[element.PName] = Name;
                        }
                    }
                    setDefaultProfile(FnDeepClone(defaultValues));
                    setUpdatedProfile(defaultValues);
                }

                const updatedPgTable = {
                    ...pgTable,
                    properties: JSON.stringify(parsedJson)
                };

                setPgRecord(updatedPgTable);

                if (NodeEntID) {
                    fetchInventoryForAudit(NodeEntID);
                }

            } catch (e) {
                console.error("Failed to load form", e);
            }
        }
        loadForm();

    }, [pgTable, NodeEntityname, Name, NodeEntID, fetchInventoryForAudit]);


    //useEffect to create form elements 
    useEffect(() => {
        if (!pgRecord || !updatedProfile || !NodeEntID) return;
        let isCancelled = false;

        const loadFormAndColumns = async () => {
            const { tableName, tableLabel, properties } = pgRecord;
            setLoading(true);
            try {
                const diagnosticLevel = getDiagnosticLevelData();
                const columns = typeof properties === "string" ? JSON.parse(properties) as IPropertyColumn[] : [];

                const myFormElements = FnBuildFormElementsFromDataset(
                    tableLabel ? tableLabel : "Properties",
                    {
                        [tableName]: {
                            label: `${'Add'} ${tableLabel}`,
                            columns: columns
                        }
                    },
                    {
                        [tableName]: [updatedProfile]
                    },
                    statusBarContext,
                    mainAppContext.refTableRecords,
                    getMuForSite(),
                    diagnosticLevel,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    handleControlValueChanged,
                    undefined,
                    userBasicRole ?? undefined
                );

                if (isCancelled) return;
                setFormElements(myFormElements);

                let savedColumns: IColumnWidthEntry[] = [];
                try {
                    const savedColumnsRaw = await FnGetColumnWidthFromSession('audit_inventory', "", statusBarContext);
                    if (Array.isArray(savedColumnsRaw)) {
                        savedColumns = savedColumnsRaw;
                    }
                } catch (e) {
                    console.error("Failed to fetch column widths from session:", e);
                }

                const gridColumns: IBasicGridColDef[] = [];
                for (let index = 0; index < columns.length; index++) {
                    const element = columns[index];
                    if (diagnosticLevel === "0" && hideGridData.includes(element.PName)) continue;
                    if (element.DisplayControl) {
                        const def: IBasicGridColDef = {
                            field: element.PName,
                            headerName: element.PropertyLabel,
                            suppressSizeToFit: true,
                            editable: false,
                            minWidth: 120
                        };

                        const matchedCol = savedColumns.find((c: IColumnWidthEntry) => {
                            const colName = c.colname?.toString().toLowerCase().trim();
                            const headerName = c.headerName?.toString().toLowerCase().trim();
                            const fieldLower = def.field?.toString().toLowerCase().trim();
                            const headerLower = def.headerName?.toString().toLowerCase().trim();

                            return (
                                (colName && (colName === headerLower || colName === fieldLower)) ||
                                (headerName && (headerName === headerLower || headerName === fieldLower))
                            );
                        });

                        if (matchedCol) {
                            if (typeof matchedCol.isHidden === 'boolean') {
                                def.hide = matchedCol.isHidden;
                            }
                            if (typeof matchedCol.colwidth === 'number' && matchedCol.colwidth > 0) {
                                def.width = matchedCol.colwidth;
                            }
                        }

                        gridColumns.push(def);
                    }
                }
                if (gridColumns.length > 0) {
                    gridColumns[gridColumns.length - 1].flex = 1;
                    gridColumns[gridColumns.length - 1].minWidth = 150;
                }

                if (isCancelled) return;
                setGridColumns(gridColumns);
            } catch (error) {
                console.error('error :', error);
            } finally {
                if (!isCancelled) {
                    setFormNodeId(NodeEntID);
                    setLoading(false);
                }
            }
        };

        loadFormAndColumns();

        return () => {
            isCancelled = true;
        };
    }, [pgRecord, updatedProfile, userBasicRole]);

    // handle valuechange to get details based on selected device scanned code 
    const handleControlValueChanged = (changedValue: ChangedValueMap): boolean => {
        if (changedValue?.ScannedCode) {
            axiosInterceptor(
                {
                    url: AUDIT.GetDevicedetailsForScannedcode,
                    data: {
                        scannedCode: changedValue.ScannedCode
                    },
                    callSilently: true,
                    setFetchData: (getDevicedetailsForScannedcodeApiResponse: unknown) => {
                        try {
                            if (
                                getDevicedetailsForScannedcodeApiResponse &&
                                typeof getDevicedetailsForScannedcodeApiResponse === "object" &&
                                "data" in getDevicedetailsForScannedcodeApiResponse
                            ) {
                                const parsedData = JSON.parse(
                                    (getDevicedetailsForScannedcodeApiResponse as { data: string }).data
                                );

                                ;

                                if (
                                    pgRecord &&
                                    parsedData &&
                                    parsedData[tableToShow]?.length
                                ) {
                                    const scannedCodeData = parsedData[tableToShow][0];
                                    setIsFormDirty(true);
                                    setUpdatedProfile({ ...updatedProfile, ...scannedCodeData });
                                }
                            }
                        } catch (error) {
                            console.error("Error processing scanned code response:", error);
                        }
                    }
                },
                statusBarContext
            );
        }

        return true;
    };

    // handler to save records 
    const handleSaveOneToManyRecord = (updatedRecords: Record<string, any>, tableName?: string | undefined): void | Promise<Record<string, any>[]> => {
        axiosInterceptor({
            url: AUDIT.AddInventoryForAudit,
            data: {
                auditID: NodeEntID,
                inventoryString: JSON.stringify({
                    [tableToShow]: [updatedRecords]
                })
            },
            setFetchData: (_resp: unknown, status?: string) => {
                if (status === "200" && NodeEntID) {
                    fetchInventoryForAudit(NodeEntID)
                    setUpdatedProfile(defaultProfile);
                }
            }
        }, statusBarContext)
    }

    // handler to save propert form 
    const handleSavePropertyForm = async (formData: IFormData) => {
        if (!formData?.TableSections || !Object.keys(formData?.TableSections)?.length || !pgRecord) return;
        const { tableName, tableLabel, properties } = pgRecord
        try {
            const parsedPgTable = FnParseJsonSafely(properties) as { PName: string }[];

            const pgTableUpdatedData = formData.TableSections[`${'Add'} ${tableLabel}`]
            const pgData: Record<string, any> = {};
            parsedPgTable.forEach((col) => {
                if (!tableName) return;
                if (col.PName) {
                    let value = pgTableUpdatedData[col.PName];
                    pgData[col.PName] = value === "" ? undefined : value;
                }
            });

            handleSaveOneToManyRecord(pgData, tableName)
        }
        catch (error) {
            console.error('error :', error);
            handleShowUserMessage?.("Something went wrong in save")
        }
    }

    // call api to create message 
    const callApiToCreateMessage = async (paylaod: unknown, isShowOk?: boolean) => {
        await axiosInterceptor({
            url: LOG.CreateMessage,
            data: paylaod,
            setFetchData: (createMessageApiResponse: unknown) => {
                if (createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                    setConfirmMessage(createMessageApiResponse.finalMessage as string);
                    setIsOpenConfirmBox(true);
                    setIsShowOkOnly(isShowOk ?? false)
                }
            }
        }, statusBarContext)
    }

    // handler for kebab menu click 
    const handleNodeMenuClick = (value: IActionImageForSubMenu, selectedRow: Record<string, any>, instanceName: string): void => {
        const label = value.payload?.Label;
        setSelectedRow(selectedRow)
        if (NodeEntID) {
            const auditId = NodeEntID;

            if (label === RightMouseMenuGrid.Accept.toString()
                || label === RightMouseMenuGrid.Reject.toString()) {
                const inventoryID = selectedRow?.RecID ? [selectedRow?.RecID] : null;
                if (auditId) {
                    if (inventoryID) {
                        setSelectedKebabMenu(label);
                        // Are you sure you want to {#status}?
                        callApiToCreateMessage({
                            projectInitial: "Audit",
                            msgID: "151",
                            optionalMessage: label
                        });
                    }
                    else {
                        // Audit Inventory must be selected to {#action}
                        callApiToCreateMessage({
                            projectInitial: "Audit",
                            msgID: "153",
                            optionalMessage: label
                        }, true);

                    }
                }
                else {
                    // Audit must be selected to {#action}
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "152",
                        optionalMessage: label
                    }, true);
                }

            } else if (label === RightMouseMenuGrid.Snapshot.toString()) {

                let errorMsg = `${RightMouseMenuGrid.Snapshot.toString()} ${selectedRow?.Name}`;
                if (auditId) {
                    // Are you sure you want to {#status}?
                    setSelectedKebabMenu(label);
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "151",
                        optionalMessage: errorMsg
                    });

                } else {
                    // Audit must be selected to {#action}
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "152",
                        optionalMessage: label
                    }, true);

                }
            }
            else if (
                label === RightMouseMenuGrid.FindInSite.toString() &&
                selectedRow?.ScannedCode
            ) {
                try {
                    axiosInterceptor(
                        {
                            url: AUDIT.GetHierarchyForScannedcode,
                            data: {
                                scannedCode: selectedRow.ScannedCode
                            },
                            setFetchData: async (_resp: unknown, status?: string) => {
                                try {
                                    if (
                                        status !== "200" ||
                                        !_resp ||
                                        typeof _resp !== "object" ||
                                        !("data" in _resp)
                                    ) {
                                        handleShowUserMessage?.("Device not found")
                                        return;
                                    } else {

                                        const parsedData = FnParseJsonSafely(
                                            _resp.data as string,
                                            { key: "Device" }
                                        );

                                        if (!parsedData || !parsedData.length) {
                                            handleShowUserMessage?.("Device not found");
                                            return;
                                        }
                                        const hierarchyUrl = FnBuildUrlForFind(parsedData);

                                        const sessionId = statusBarContext.userSessionId;

                                        if (!sessionId) {
                                            handleShowUserMessage?.("Session ID missing");
                                            return;
                                        }
                                        const url = `${window.location.origin}/feature/${FEnums.Assets}?isnew=true&id=${sessionId}${hierarchyUrl}`;

                                        //  safer open
                                        const newTab = window.open(url, "_blank");

                                        if (!newTab) {
                                            handleShowUserMessage?.("Popup blocked");
                                        }
                                    }

                                } catch (err) {
                                    handleShowUserMessage?.("Error in hierarchy processing:");
                                }
                            }
                        },
                        statusBarContext
                    );
                } catch (err) {
                    handleShowUserMessage?.("Unexpected error:");
                }
            }
            else if (label === RightMouseMenuGrid.Delete.toString()) {

                let inventoryID = selectedRow?.RecID ? [selectedRow?.RecID] : null;
                let entIDs = selectedRow?.EntID ? [selectedRow?.EntID] : null;
                let errorMsg = `${RightMouseMenuGrid.Delete.toString()} ${selectedRow?.Name}`;
                if (inventoryID && entIDs) {
                    setSelectedKebabMenu(label);
                    // Are you sure you want to {#status}?
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "151",
                        optionalMessage: errorMsg
                    });

                }
                else {
                    // Audit Inventory must be selected to {#action}
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "153",
                        optionalMessage: label
                    });
                }
            }
            else {
                setIsOpenConfirmBox(false);
            }
        }
    }

    // on confirm call apis to perform actions 
    const handleClickYesButton = async () => {
        if (selectedKebabMenu && NodeEntID) {
            let auditId = NodeEntID;
            if (selectedKebabMenu === RightMouseMenuGrid.Snapshot.toString()) {
                if (auditId) {
                    axiosInterceptor({
                        url: AUDIT.SnapshotInventoryForAudit,
                        data: {
                            auditID: auditId
                        },
                        setFetchData: (snapshotInventoryForAuditApiResponse: unknown, status?: string) => {
                            if (snapshotInventoryForAuditApiResponse !== null && status === "200") {
                                fetchInventoryForAudit(auditId);
                            }
                        }
                    }, statusBarContext)


                }
                // snapshotToCompleteInventory
            }
            else if (selectedKebabMenu === RightMouseMenuGrid.Accept.toString()
                || selectedKebabMenu === RightMouseMenuGrid.Reject.toString()
            ) {
                let inventoryID = selectedRow?.RecID ? [selectedRow?.RecID] : null;
                if (auditId) {
                    if (inventoryID) {
                        let status = selectedKebabMenu === RightMouseMenuGrid.Accept.toString() ? "Accepted" : selectedKebabMenu === RightMouseMenuGrid.Reject.toString() ? "Reject" : selectedKebabMenu;
                        if (mainAppContext.siteProperties?.Managed) {
                            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
                            setWorkorderRecords(workOrderProfile);
                            setShowSelectWorkorder(true);
                            if (selectedRow) {
                                setCreateWorkOrderPayload({
                                    treeData: treeData,
                                    sourceNodeEntID: selectedRow?.EntID ?? "",
                                    sourceNodeName: selectedRow?.NodeEntityname ?? "",
                                    EntityName: "WorkorderProfile",
                                    WorkorderType: "Change AuditInventory Status",
                                    action: "Change AuditInventory Status",
                                    SeqNo: 1,
                                    sessionContext: sessionContext,
                                    statusBarContext: statusBarContext,
                                    RUPosition: undefined,
                                    AuditName: selectedRow?.Name, // added for audit name
                                    AuditStatus: status,
                                    ParentEntityName: selectedRow?.EntityName,
                                    ParentID: selectedRow?.EntID,
                                    sourceNodeObj: selectedRow,
                                    SiteID: selectedNode.SiteID,
                                    RoomID: selectedNode.RoomID,
                                    FloorID: selectedNode.FloorID,
                                })
                            }

                        } else {
                            axiosInterceptor({
                                url: AUDIT.UpdateAuditInventoryStatus,
                                data: {
                                    auditID: auditId,
                                    inventoryID: JSON.stringify(inventoryID),
                                    status
                                },
                                setFetchData: (updateAuditInventoryStatusApiResponse: unknown, status?: string) => {
                                    if (updateAuditInventoryStatusApiResponse !== null && status === "200") {

                                        fetchInventoryForAudit(auditId);
                                    }
                                }
                            }, statusBarContext)
                        }

                    } else {
                        // Audit Inventory must be selected to {#action}
                        callApiToCreateMessage({
                            projectInitial: "Audit",
                            msgID: "153",
                            optionalMessage: selectedKebabMenu
                        }, true);

                    }
                } else {
                    // Audit must be selected to {#action}
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "152",
                        optionalMessage: selectedKebabMenu
                    }, true);
                }
            }
            else if (selectedKebabMenu === RightMouseMenuGrid.Delete.toString()) {
                if (selectedRow?.IsNZ) {
                    setIsShowOkOnly(true);
                    setConfirmMessage("This record cannot be deleted because it is a required record for application to work.");
                    setIsShowOkOnly(true);
                    return
                }
                let inventoryID = selectedRow?.RecID ? selectedRow?.RecID : null;
                let entIDs = selectedRow?.EntID ? selectedRow?.EntID : null;
                if (inventoryID && entIDs && tableToShow) {
                    if (mainAppContext.siteProperties?.Managed) {
                        if (treeData && selectedRow) {
                            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
                            setWorkorderRecords(workOrderProfile);
                            setShowSelectWorkorder(true);
                            setCreateWorkOrderPayload({
                                treeData: treeData,
                                sourceNodeEntID: selectedRow.EntID ?? "",
                                sourceNodeName: selectedRow.NodeEntityname ?? "",
                                EntityName: "WorkorderProfile",
                                WorkorderType: "Delete",
                                action: "Delete Audit Inventory",
                                SeqNo: 1,
                                sessionContext: sessionContext,
                                statusBarContext: statusBarContext,
                                _WorkOrderProfile: undefined,
                                AuditName: selectedRow?.Name, // added for audit name
                                ParentEntityName: selectedRow?.EntityName ?? "",
                                ParentID: selectedRow.EntID ?? "",
                                RUPosition: undefined,
                                sourceNodeObj: selectedRow,
                                SiteID: selectedNode.SiteID,
                                RoomID: selectedNode.RoomID,
                                FloorID: selectedNode.FloorID,
                            })
                        }
                    } else {
                        axiosInterceptor({
                            url: EM.DeleteTableRecords,
                            data: {
                                entIDs: entIDs,
                                recIDs: inventoryID,
                                tableName: tableToShow
                            },
                            setFetchData: (updateAuditInventoryStatusApiResponse: unknown, status?: string) => {
                                if (updateAuditInventoryStatusApiResponse !== null && status === "200") {
                                    axiosInterceptor({
                                        url: AUDIT.GetAuditDeviceCount,
                                        data: {
                                            auditID: auditId
                                        },
                                        setFetchData: (getAuditDeviceCountApiResponse: unknown, status?: string) => {
                                            if (status === "200" && getAuditDeviceCountApiResponse !== undefined) {
                                                fetchInventoryForAudit(auditId);
                                                handleReloadTree?.(featureId)
                                            }
                                        }
                                    }, statusBarContext)
                                }
                            }
                        }, statusBarContext)
                    }

                }
                else {
                    // Audit Inventory must be selected to {#action}
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "153",
                        optionalMessage: selectedKebabMenu
                    }, true);

                }
            }

        }

        setIsOpenConfirmBox(false);
    }

    const handleClickNoButton = (): void => {
        setIsOpenConfirmBox(false);
    }

    const handleOkButtonClick = (): void => {
        setIsOpenConfirmBox(false);
        setConfirmMessage("");
        setIsShowOkOnly(false);
    }

    const renderedFormElements = useMemo(() => {
        if (!formElements) return undefined;

        return {
            ...formElements,
            Formisdirty: isFormDirty,
            onSave: handleSavePropertyForm
        };
    }, [formElements, isFormDirty]);

    const isFormReady = formNodeId === NodeEntID;
    const handleSelectWorkorder = async (workorderId: string) => {
        setShowSelectWorkorder(false);
        const findWorkOrder = workorderRecords.find(x => x._Workorder === workorderId);
        if (createWorkOrderPayload) {
            const payload: IFnCreateWorkOrderApiCall = { ...createWorkOrderPayload, _WorkOrderProfile: findWorkOrder ? [findWorkOrder] : undefined }
            const result = await FnCreateWorkOrderApiCalls(payload)

            if (result) {
                function getWorkorderProfileName(data: any): string | null {
                    return data?.workorderProfile?.[0]?._WorkorderProfile ?? null;
                }
                if (mainAppContext.autoExecuteWorkorder) {
                    setIsShowOkOnly(false);
                    const actions: IDialogActionBtn[] = [
                        {
                            label: "No",
                            onClick: () => {
                                setIsOpenConfirmBox(false)
                                setConfirmMessage("");
                                setCustomButtons(undefined);
                            }
                        },
                        {
                            label: "Yes",
                            onClick: async () => {
                                // Call the API to auto execute the workorder 
                                await FnAutoExecuteWorkOrder(getWorkorderProfileName(result) ?? "", statusBarContext);
                                NodeEntID && fetchInventoryForAudit(NodeEntID);
                                handleReloadTree?.(featureId)
                                setIsOpenConfirmBox(false)
                                setConfirmMessage("");
                                setCustomButtons(undefined);
                            },
                            autoFocus: true
                        },
                        {
                            label: "Workorders",
                            onClick: () => {
                                const name = getWorkorderProfileName(result)
                                if (name) {
                                    FnNavigateToWorkOrder(name, statusBarContext.userSessionId, sessionContext.SessionList);
                                }
                            },
                            className: "highlight-btn"
                        }
                    ];
                    setCustomButtons(actions);
                    setConfirmMessage(`Workorder (${getWorkorderProfileName(result)}) is ${workorderId ? "append" : "created"} successfully. 
                    Would you like to auto execute workorder: ${getWorkorderProfileName(result)}? `)
                    setIsOpenConfirmBox(true);
                } else {
                    setIsShowOkOnly(true);
                    setCustomButtons(undefined);
                    setConfirmMessage(`Workorder (${getWorkorderProfileName(result)}) is ${workorderId ? "append" : "created"} successfully.`);
                    setIsOpenConfirmBox(true);
                }
            }
        }
    }
    if (loading || tableData === undefined) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }

    if (hideAddForm && tableData.length === 0) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Inventory collection details not found.</div>;
    }

    return (
        <div key={uniqueName} className='nz-wh-100 nz-inventory-collection-container'>
            {isFormReady && renderedFormElements && tableData ?
                <OneToManyFormForInventory
                    key={NodeEntID}
                    uniqueName={uniqueName + 'onetomany-form' + NodeEntID}
                    featureId={featureId}
                    renderedFormElements={renderedFormElements}
                    hideAddForm={hideAddForm ?? false}
                    gridData={tableData}
                    gridColumns={gridColumns}
                    allowEdit={false}
                    allowDelete={false}
                    containerName={'audit_inventory'}
                    handleNodeMenuOnClick={handleNodeMenuClick}
                    allowColumnFilter={true}
                />
                :
                <></>
            }
            <YesNoFormContainer
                isOpen={isOpenConfirmBox}
                uniqueName="onetomanyDelete"
                buttons={customButtons}
                message={confirmMessage ?? ""}
                handleYesButtonClick={handleClickYesButton}
                handleNoButtonClick={handleClickNoButton}
                showOkButton={isShowOkOnly}
                handleOkButtonClick={handleOkButtonClick}
            />
            {showSelectWorkorder &&
                <div className="nz-dialog-overlay">
                    <div
                        className="nz-wo-dialog-container "
                        style={{ width: '100%', height: 500, overflow: 'auto' }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <SelectWorkorder workorderRecords={workorderRecords} onSelect={handleSelectWorkorder} onCancel={() => {
                            setShowSelectWorkorder(false)
                            setWorkorderRecords([])
                        }} />
                    </div>
                </div>
            }
        </div>
    )
}

export { InventoryCollectionContainer }
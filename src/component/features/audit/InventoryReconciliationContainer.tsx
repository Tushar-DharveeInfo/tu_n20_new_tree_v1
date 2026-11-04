
import { useCallback, useEffect, useMemo, useState } from "react";
import '../allcss/audit/InventoryReconciliationContainer.css'
import { IWorkorderRecord, SelectWorkorder, YesNoControl } from "@n20a/libform";
import { IInventoryReconciliationContainer } from "../allinterface/audit/IInventoryReconciliationContainer";
import { IBasicGridColDef, IColumnWidthEntry } from "../../shared/allinterface/tablegrid/IBasicGrid";
import { FnGetColumnWidthFromSession } from "../../shared/allcommon/tablegrid/FnGetColumnWidthFromSession";
import { useStatusBarContext } from "../../shared/context/hooks/StatusBarHooks";
import { useSessionContext } from "../../shared/context/hooks/SessionHooks";
import { useMainAppContext } from "../../shared/context/hooks/MainAppHooks";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { AUDIT, EM, LOG } from "../../shared/interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../shared/allcommon/basic/FnHandleAPIResponse";
import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { IPropertyColumn } from "../../shared/allinterface/sidebar/IPropertyFormContainer";
import { getDiagnosticLevelData } from "../../shared/context/contextandprovider/CommonVariable";
import { hideGridData } from "../../shared/alldefaultprops/tablegrid/DefaultPropsBasicGrid";
import { IActionImageForSubMenu } from "../../shared/allinterface/basic/IActionImageList";
import { FEnums, RightMouseMenuGrid } from "../../constants/Feature";
import { FnBuildUrlForFind } from "../../shared/allcommon/FnBuildSessionPayloadForFind";
import { IFnCreateForensiclog } from "../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { FnCreateForensiclog } from "../../appcontainer/allcommon/FnCreateForensiclog";
import { Label } from "../../shared/basic/label/Label";
import OneToManyFormForInventory from "./OneToManyFormForInventory";
import { YesNoFormContainer } from "../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { IFnCreateWorkOrderApiCall } from "../../appcontainer/allinterface/IFnCreateWorkOrderApiCalls";
import { FnAutoExecuteWorkOrder, FnCreateWorkOrderApiCalls, FnGetWorkOrderProfile } from "../../appcontainer/allcommon/FnCreateWorkOrderApiCalls";
import { IDialogActionBtn } from "../../shared/allinterface/basic/IYesNoFormContainer";
import { FnNavigateToWorkOrder } from "../../shared/allcommon/FnNavigateToWorkOrder";

const InventoryReconciliationContainer = (inventoryReconciliationProps: IInventoryReconciliationContainer) => {
    const { uniqueName, featureId, tableToShow, hideAddForm, selectedNode, headerToShow
        , updateStatusBarData, handleShowUserMessage } = inventoryReconciliationProps

    const [entityTables, setEntityTables] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isShowAll, setIsShowAll] = useState<boolean>(false);
    const [tableData, setTableData] = useState<Record<string, any>[]>();
    const [confirmMessage, setConfirmMessage] = useState<string>();
    const [customButtons, setCustomButtons] = useState<IDialogActionBtn[]>();
    const [isOpenConfirmBox, setIsOpenConfirmBox] = useState<boolean>(false);
    const [isShowOkOnly, setIsShowOkOnly] = useState<boolean>(false);
    const [selectedRow, setSelectedRow] = useState<Record<string, any>>();
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<string>();
    const [gridColumns, setGridColumns] = useState<IBasicGridColDef[]>([]);
    const [showSelectWorkorder, setShowSelectWorkorder] = useState<boolean>(false);
    const [workorderRecords, setWorkorderRecords] = useState<IWorkorderRecord[]>([]);
    const [createWorkOrderPayload, setCreateWorkOrderPayload] = useState<IFnCreateWorkOrderApiCall>();

    const { NodeEntityname, Name, NodeEntID } = selectedNode

    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();

    // cleanup the variables
    useEffect(() => {
        setTableData(undefined);
        setGridColumns([]);
        setLoading(true);
    }, [NodeEntID]);

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

    const pgTable = useMemo(() => {

        return entityTables.find(
            t => t.tableName?.toLowerCase() === tableToShow.toLowerCase()
        );

    }, [entityTables, tableToShow]);

    // useCallback to fetch inventory for selected audit 
    const fetchInventoryForAudit = useCallback((EntID: string, allowShowAll?: boolean) => {
        axiosInterceptor(
            {
                url: AUDIT.GetInventoryForAudit,
                data: {
                    auditID: EntID,
                    showAll: allowShowAll
                },
                setFetchData: (getInventoryForAuditApiResponse: unknown, status?: string) => {
                    if (status === "200" &&
                        getInventoryForAuditApiResponse &&
                        typeof getInventoryForAuditApiResponse === "object" &&
                        "data" in getInventoryForAuditApiResponse
                    ) {
                        const resposeData = FnHandleAPIResponse(
                            getInventoryForAuditApiResponse.data,
                            "Dataset"
                        );

                        if (Array.isArray(resposeData) && resposeData.length > 0) {
                            let statusbarString: Record<string, string | number | undefined> = {
                                Inventory: resposeData.length
                            };

                            let moveCount = 0;
                            let matchCount = 0;
                            let newCount = 0;
                            let missingCount = 0;
                            for (let index = 0; index < resposeData.length; index++) {
                                const element = resposeData[index];
                                if (element.AuditedDeviceState === "Move")
                                    moveCount++;
                                else if (element.AuditedDeviceState === "Match")
                                    matchCount++;
                                else if (element.AuditedDeviceState === "New")
                                    newCount++;
                                else if (element.AuditedDeviceState === "Missing")
                                    missingCount++;

                            }
                            if ((moveCount + newCount + missingCount) > 0)
                                statusbarString = { ...statusbarString, "Reconciled": moveCount + newCount + missingCount }
                            if (moveCount > 0)
                                statusbarString = { ...statusbarString, "Move": moveCount }
                            if (newCount > 0)
                                statusbarString = { ...statusbarString, "New": newCount }
                            if (missingCount > 0)
                                statusbarString = { ...statusbarString, "Missing": missingCount }

                            if (updateStatusBarData) {
                                updateStatusBarData(
                                    JSON.stringify(statusbarString)
                                );
                            }
                        }

                        if (resposeData) {
                            setTableData([...resposeData]);
                        }
                        else {
                            setTableData([]);
                            handleShowUserMessage?.("No inventory data available for reconciliation");
                        }
                    } else {
                        setTableData([]);
                    }
                }
            },
            statusBarContext
        );
    }, [
        updateStatusBarData
    ]);

    // useEffect to create column definitions 
    useEffect(() => {
        if (!entityTables.length) return;
        const loadForm = async () => {
            if (!pgTable?.properties) {
                setLoading(false);
                setTableData([]);
                return;
            }
            try {
                const parsedJson = FnParseJsonSafely(pgTable.properties) as IPropertyColumn[];

                if (!parsedJson?.length) {
                    return;
                }
                const diagnosticLevel = getDiagnosticLevelData();
                const columns = parsedJson;

                let savedColumns: IColumnWidthEntry[] = [];
                try {
                    const savedColumnsRaw = await FnGetColumnWidthFromSession('audit_reconciliation', "", statusBarContext);
                    if (Array.isArray(savedColumnsRaw)) {
                        savedColumns = savedColumnsRaw;
                    }
                } catch (err) {
                    console.error("Failed to fetch column widths from session:", err);
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
                setGridColumns(gridColumns);
                if (NodeEntID) {
                    fetchInventoryForAudit(NodeEntID, isShowAll);
                }

            } catch (e) {
                console.error("Failed to load form", e);
            } finally {
                setLoading(false);
            }
        }
        loadForm();

    }, [pgTable, NodeEntityname, Name, NodeEntID, isShowAll, fetchInventoryForAudit]);

    // call api to create message for confirm 
    const callApiToCreateMessage = async (paylaod: unknown, isShowOk?: boolean) => {
        await axiosInterceptor({
            url: LOG.CreateMessage,
            data: paylaod,
            setFetchData: (createMessageApiResponse: unknown, status?: string) => {
                if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                    if (isShowOk) {
                        handleShowUserMessage?.(createMessageApiResponse.finalMessage as string)
                    } else {
                        setConfirmMessage(createMessageApiResponse.finalMessage as string);
                        setIsOpenConfirmBox(true);
                    }
                }
                else {
                    handleShowUserMessage?.("Something wrong in create message")
                }
            }
        }, statusBarContext)
    }

    // handler for kebabmenu click 
    const handleNodeMenuClick = (value: IActionImageForSubMenu, selectedRow: any): void => {
        const label = value.payload?.Label;
        setSelectedRow(selectedRow)
        if (NodeEntID) {
            const auditId = NodeEntID;

            if (label === RightMouseMenuGrid.Match.toString()
                || label === RightMouseMenuGrid.Move.toString()
                || label === RightMouseMenuGrid.Discard.toString()
                || label === RightMouseMenuGrid.Missing.toString()
                || label === RightMouseMenuGrid.New.toString()) {
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

            } else if (
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
            else {
                setIsOpenConfirmBox(false);
            }
        }

    }

    // function to create forensic log 
    const CreateLogForNode = async (LogName: string, LogSubGroupName: string, actionObject: Record<string, any>) => {
        try {
            const payload: IFnCreateForensiclog = {
                logType: 'UserAction',
                GroupName: LogGroupName.ForensicLogTemplate,
                _Forensiclog: LogSubGroupName,
                SubGroupName: LogSubGroupName,
                LogName: LogName,
                actionObject: actionObject,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                RefTableItems: mainAppContext.refTableRecords
            }
            FnCreateForensiclog(payload)

        } catch (err) {
            console.error(err)
            throw new Error("Failed to create forensic log")
        }
    }

    // handler for call api on confirm 
    const handleClickYesButton = async () => {
        if (selectedKebabMenu && NodeEntID) {

            let auditId = NodeEntID;

            if (selectedKebabMenu === RightMouseMenuGrid.Match.toString()
                || selectedKebabMenu === RightMouseMenuGrid.Move.toString()
                || selectedKebabMenu === RightMouseMenuGrid.Discard.toString()
                || selectedKebabMenu === RightMouseMenuGrid.Missing.toString()
                || selectedKebabMenu === RightMouseMenuGrid.New.toString()) {
                let inventoryID = selectedRow?.RecID ? [selectedRow?.RecID] : null;
                if (auditId) {
                    if (inventoryID) {
                        let status = selectedKebabMenu;
                        if (auditId) {
                            if (mainAppContext.siteProperties?.Managed) {
                                const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
                                setWorkorderRecords(workOrderProfile);
                                setShowSelectWorkorder(true);
                                if (selectedRow) {
                                    setCreateWorkOrderPayload({
                                        treeData: inventoryReconciliationProps.treeData,
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
                                            CreateLogForNode(LogName.StatusChange, LogSubGroupName.InventoryReconciliation, { AuditName: selectedRow?.Name, StatusName: selectedKebabMenu });
                                            fetchInventoryForAudit(auditId, isShowAll);
                                            if (typeof updateAuditInventoryStatusApiResponse === "object" && 'sessionExecuted' in updateAuditInventoryStatusApiResponse && updateAuditInventoryStatusApiResponse.sessionExecuted) {
                                                inventoryReconciliationProps.handleReloadTree?.(FEnums.InventoryReconciliation);
                                            }
                                        }
                                    }
                                }, statusBarContext)
                            }
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

    // handler to create workorder if manage flag is true 
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
                                NodeEntID && fetchInventoryForAudit(NodeEntID, isShowAll);
                                NodeEntID && inventoryReconciliationProps.handleReloadTree?.(FEnums.InventoryReconciliation);
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
        return <div className="nz-wh-100 nz-d-flex-hv-left">Inventory reconciliation details not found.</div>;
    }
    return (
        <div key={uniqueName} className='nz-wh-100 nz-inventory-reconciliation-container'>
            <div className='nz-sub-header nz-d-flex-row nz-align-center nz-justify-between'>
                <Label uniqueName={uniqueName + "header"} label={headerToShow ?? `Inventory Reconciliation:${Name}`} fontWeight="bold" />
                <YesNoControl label="Show All" value={isShowAll} onChange={(value) => {
                    setIsShowAll(value)
                }} />
            </div>
            {tableData ?
                <OneToManyFormForInventory
                    key={NodeEntID}   // still keep this
                    uniqueName={uniqueName + 'onetomany-form' + NodeEntID}
                    featureId={featureId}
                    hideAddForm={hideAddForm ?? false}
                    gridData={tableData}
                    gridColumns={gridColumns}
                    allowEdit={false}
                    allowDelete={false}
                    containerName={'audit_reconciliation'}
                    handleNodeMenuOnClick={handleNodeMenuClick}
                    allowColumnFilter={true}
                />
                :
                <></>
            }
            <YesNoFormContainer
                isOpen={isOpenConfirmBox}
                uniqueName="onetomanyDelete"
                message={confirmMessage ?? ""}
                buttons={customButtons}
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

export { InventoryReconciliationContainer }
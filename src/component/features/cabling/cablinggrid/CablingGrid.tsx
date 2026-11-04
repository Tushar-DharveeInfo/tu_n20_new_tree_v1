
import React, { useCallback, useEffect, useRef, useState } from "react";
import '../../allcss/cabling/CablingGrid.css'
import { FEnums } from "../../../constants/Feature";
import { AddtoCabling24x24 } from "@n20a/libicon";
import { FnDeepClone } from "../../../shared/allcommon/basic/FnDeepClone";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { CablingDragHandlers, ICablingGrid } from "../../../shared/allinterface/tablegrid/ICablingGrid";
import {
    ICablingCableComboItem,
    ICablingCablesWithPortRequest,
    ICablingCloneCableRequest,
    ICablingCloneCableResponse,
    ICablingDropNode,
    ICablingCellClickParams,
    ICablingCellRenderer,
    ICablingCellRendererParams,
    ICablingDisconnectPortPayload,
    ICablingDragPortNode,
    ICablingGridRow,
    ICablingGridSection,
    ICablingJsonResponse,
    ICablingPortApiItem,
    ICablingPortStatusJson,
    ICablingSessionUpdateItem,
    ICablingSetPortStatusPayload,
    IGetCablingApiPayload,
} from "../../../shared/allinterface/tablegrid/ICablingGrid";
import { IBasicGridColDef } from "../../../shared/allinterface/tablegrid/IBasicGrid";
import { IActionImageForSubMenu } from "../../../shared/allinterface/basic/IActionImageList";
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor";
import { CABLING, SESSION } from "../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks";
import { FnHandleAPIResponse } from "../../../shared/allcommon/basic/FnHandleAPIResponse";
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks";
import { useCommonVariableContext } from "../../../shared/context/hooks/CommonVariableHooks";
import { useMainAppContext } from "../../../shared/context/hooks/MainAppHooks";
import { CellClickedEvent, CellMouseDownEvent, RowClickedEvent } from "ag-grid-community";
import { CablingViews } from "./CablingViews";
import { RightMouseMenuTreeNode } from "../../../constants/Feature";
import { Label } from "../../../shared/basic/label/Label";
import { Image } from "../../../shared/basic/image/Image";
import { NodeMenu } from "../../../shared/menu/nodemenu/NodeMenu";
import { BasicGrid } from "../../../shared/tablegrid/BasicGrid";
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { FnAutoExecuteWorkOrder, FnCreateWorkOrderApiCalls, FnGetWorkOrderProfile } from "../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls";
import { ComboBoxControl, IChangeMeta, IOptionItem, IWorkorderRecord, SelectWorkorder } from "@n20a/libform";
import { IFnCreateWorkOrderApiCall } from "../../../appcontainer/allinterface/IFnCreateWorkOrderApiCalls";
import { FnCopyToClipboard } from "../../../shared/allcommon/basic/FnCopyToClipboard";
import { IDialogActionBtn } from "../../../shared/allinterface/basic/IYesNoFormContainer";
import { FnNavigateToWorkOrder } from "../../../shared/allcommon/FnNavigateToWorkOrder";
import { IFnCreateForensiclog } from "../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { FnCreateForensiclog } from "../../../appcontainer/allcommon/FnCreateForensiclog";
import { AgGridReact } from "ag-grid-react";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnSortGetDevicePort, FnSortGetCablingData, FnConvertCellName } from "../../allcommon/FnSortCablingData";
import { FnTooltipForCell } from "../../allcommon/FnTooltipForCell";
import { Helptip } from "../../../shared/Help";
import { useHelpTipContext } from "../../../shared/context/hooks/HelptipHooks";
/* 
********Cabling component Overview/workflow********

Brief information:
  -> Cabling component is to manage cables and add new cable which is to assign to devices
  -> We can change port status in the component
  -> We can manage devices from different Entity devices

***Custom logic:***
Described below function that have created custom logic.

handlePortStatus:
-> Change port status to perticular status like Bad status 
onCellClicked:
  -> Drag and drop for the cell is apply in the function to manage the ports
  -> Cell color apply when cell is clicked
handleHideColumns:
-> Hide items in the UI
unHideColumns:
-> unhide items in the UI
  */
const isPortTypeCompatible = (type1?: string | null, type2?: string | null): boolean => {
    if (!type1 || !type2) return true;
    const t1 = type1.trim().toLowerCase();
    const t2 = type2.trim().toLowerCase();
    const isT1Copper = t1.includes("copper");
    const isT1Fiber = t1.includes("fiber");
    const isT2Copper = t2.includes("copper");
    const isT2Fiber = t2.includes("fiber");

    if ((isT1Copper && isT2Fiber) || (isT1Fiber && isT2Copper)) {
        return false;
    }
    return true;
};

const CablingGrid = (props: ICablingGrid) => {
    // Each grid section = one device-to-device table (columnDefs + rowData).
    const [originalTableData, setOriginalTableData] = useState<ICablingGridSection[]>([]);
    const [coldef, setColdef] = useState<IBasicGridColDef[]>();
    const [cableCombo, setCableCombo] = useState<IOptionItem[]>();
    const [cableComboApiData, setCableComboApiData] = useState<ICablingCableComboItem[]>();
    const [cableComboUsed, setCableComboUsed] = useState<ICablingCableComboItem[]>();
    const [selectComboValue, setSelectedComboValue] = useState<string | null>(null)
    const [activeCableCombo, setActiveCableCombo] = useState<string | null>(null);
    const [fromDeviceViewEntID, setFromDeviceViewEntID] = useState<string | null>(null)
    const [fromDeviceViewType, setFromDeviceViewType] = useState<"Front" | "Rear" | null>(null)
    const [toDeviceViewType, setToDeviceViewType] = useState<"Front" | "Rear" | null>(null)
    const [cableViewEntID, setCableViewEntID] = useState<string | null>(null)
    const [toDeviceViewEntId, setToDeviceViewEntID] = useState<string | null>(null)
    const [selectedCableName, setSelectedCableName] = useState<string | null>(null)
    const [tableData, setTableData] = useState<ICablingGridSection[]>([])
    const [selectedRowObj, setSelectedRowObj] = useState<{ tableIndex: number, rowIndex: number } | null>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [diagnosticLevel, setDiagnosticLevel] = useState<string>("")
    const [customButtons, setCustomButtons] = useState<IDialogActionBtn[]>();
    const [showSelectWorkorder, setShowSelectWorkorder] = useState<boolean>(false);
    const [workorderRecords, setWorkorderRecords] = useState<IWorkorderRecord[]>([]);
    const [createWorkOrderPayload, setCreateWorkOrderPayload] = useState<IFnCreateWorkOrderApiCall>();

    const statusBarContext = useStatusBarContext();
    const helpTipsContext = useHelpTipContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();
    const CommonVariableContext = useCommonVariableContext()

    const gridRef = useRef<AgGridReact>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectedFeatureLabelRef = useRef<string>(undefined);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (CommonVariableContext.diagnosticLevel) {
            setDiagnosticLevel(CommonVariableContext.diagnosticLevel)
        }
    }, [CommonVariableContext.diagnosticLevel])

    // Re-apply column visibility when user toggles hide from-port / cable / to-port in the UI.
    useEffect(() => {
        if (tableData) {
            const tables = tableData.map((element: ICablingGridSection) => {
                if (element.columnDefs && element.columnDefs.length) {
                    // hide must be a strict boolean (ColDef.hide allows null/undefined).
                    let updatedColumnDefs: (IBasicGridColDef & { hide: boolean })[] = element.columnDefs.map((item: IBasicGridColDef) => {
                        let hide = false;
                        if (
                            (CommonVariableContext.cablingHideColumnObject?.fromPort && item.field === "FromDeviceCompositePortName") ||
                            (CommonVariableContext.cablingHideColumnObject?.cable &&
                                (item.field === "PortACompositeName" || item.field === 'CableName' || item.field === 'PortBCompositeName')) ||
                            (CommonVariableContext.cablingHideColumnObject?.toDevicePort && item.field === "ToDeviceCompositePortName")
                        ) {
                            hide = true;
                        }
                        return { ...item, hide };
                    });

                    // Find the index of the last visible column
                    const lastVisibleIndex = [...updatedColumnDefs]
                        .reverse()
                        .findIndex((col) => !col.hide);

                    if (lastVisibleIndex !== -1) {
                        const trueIndex = updatedColumnDefs.length - 1 - lastVisibleIndex;

                        // Last visible column gets flex:1; strip old flex/hide from ColDef before re-applying hide.
                        updatedColumnDefs = updatedColumnDefs.map((col, index): IBasicGridColDef & { hide: boolean } => {
                            const hide = col.hide === true;
                            const { flex: _flex, hide: _colHide, ...rest } = col;
                            if (!hide && index === trueIndex) {
                                return { ...rest, hide, flex: 1 };
                            }
                            return { ...rest, hide };
                        });

                    }

                    return { ...element, columnDefs: updatedColumnDefs };
                }
                return element;
            });

            setTableData(tables);
            props.handleCatchTableData(tables)
        }
    }, [CommonVariableContext.cablingHideColumnObject])

    // Load cabling rows for selected/checked tree node and optionally refresh cable combo list.
    const makeCablingApiCall = async (RefeshCombo: boolean, isDeleteCableConnection?: boolean) => {
        try {
            let cablingData = []
            if (props?.checkedNodes && props?.checkedNodes?.NodeEntID !== props?.selectedNodeInfo?.node?.NodeEntID) {
                cablingData = await makeGetCablingApiCall(isDeleteCableConnection ? props?.selectedNodeInfo?.node?.NodeEntID : null, props?.checkedNodes?.NodeEntID)
            } else {
                cablingData = await makeGetCablingApiCall(isDeleteCableConnection ? null : props?.selectedNodeInfo?.node?.NodeEntID,
                    isDeleteCableConnection ? props?.checkedNodes?.NodeEntID ?? null : null)
            }
            if (RefeshCombo) {
                makeApiCallComboCabling()
            }
            return cablingData
        } catch (error) {
            console.error("Error in makeCablingApiCall:", error);
            return []
        }
    };



    useEffect(() => {
        if (props.selectedNodeMenu && props.selectedNodeMenu.Label) {
            selectedFeatureLabelRef.current = props.selectedNodeMenu.Label;
        }
    }, [props?.selectedNodeMenu])


    const checkIfDeviceExist = async (data: ICablingGridSection[], id: string) => {
        try {
            let checkIfDeviceExist = false
            for (let index = 0; index < data.length; index++) {
                const tableData = data[index];

                if (tableData.rowData) {
                    const cableData = tableData.rowData.filter((item: ICablingGridRow) =>
                        (item.ToDeviceEntityID && item.ToDeviceEntityID === id)
                    );
                    if (cableData.length) {
                        checkIfDeviceExist = true
                    }
                }
            }
            return checkIfDeviceExist
        } catch (error) {
            console.error("error in check device exits:", error)
        }
    }

    // Keep only FromDevice* fields when merging a new "to device" column into an existing table.
    function getOnlyFromDeviceFields(data: Record<string, any>[]) {
        try {
            data = data.filter((item: Record<string, any>) => item.FromDeviceCompositePortName !== null);
            data = data.map((item: Record<string, any>) => {
                const fromDeviceOnly: Partial<Record<string, any>> = {};
                for (const key in item) {
                    if (
                        key.startsWith("FromDevice") &&
                        item[key] !== "" &&
                        item[key] !== null &&
                        item[key] !== undefined
                    ) {
                        fromDeviceOnly[key] = item[key];
                    }
                }

                return fromDeviceOnly;
            });
            data = data.filter(obj => Object.keys(obj).length > 0);
            return data
        } catch (error) {
            console.error("Error in getOnlyFromDeviceFields ", error)
            return []
        }

    }

    // Add-to-cabling: load ports for checked/secondary device and merge into grid as a new to-device section.
    const getDevicePort = async () => {
        try {
            // Run when user checked a different node than the tree selection, or target is a patch panel.
            if (
                (props.checkedNodes && props.checkedNodes.NodeEntID !== props?.selectedNodeInfo?.node?.NodeEntID)
                || props?.selectedNodeInfo.node.NodeEntityname === '__PatchPanel'
            ) {
                let cablesDevicePort = {
                    isPower:
                        props.featureId == FEnums.EditPowerCabling ? true : false,
                    deviceEntID: props?.selectedNodeInfo?.node?.NodeEntID,

                };
                const handleGetDevicePort = async (response: unknown, status?: string) => {

                    if (status === "200" && response && typeof response === "object" && 'portsJson' in response) {

                        let jsonData = typeof response?.portsJson === "string" ? FnParseJsonSafely(response?.portsJson as string) : {};
                        if (jsonData?.Ports && jsonData?.Ports?.length > 0) {
                            jsonData = FnSortGetDevicePort(jsonData);
                            let portData = jsonData?.Ports;
                            if (Array.isArray(portData) && portData.length) {
                                if (props.catchTableData && portData.length) {
                                    let fromDataUpdated = null
                                    if (props.catchTableData.length) {
                                        fromDataUpdated = getOnlyFromDeviceFields(props.catchTableData[0].rowData)
                                    }
                                    // Map API port rows into to-device column fields for the grid.
                                    let toDeviceData = []
                                    for (let index = 0; index < portData.length; index++) {
                                        const item = portData[index];
                                        let dataObj = {
                                            ToDeviceEntityName: item.ToDeviceEntityName,
                                            ToDeviceEntityID: item.EntityID,
                                            ToDeviceAssetID: item.DeviceAssetID,
                                            ToDevicePath: item.DevicePath,
                                            ToDeviceName: item.DeviceName,
                                            ToDeviceDescription: item.DeviceDescription,
                                            ToDeviceViewName: item.ViewName,
                                            ToDeviceViewID: item.DeviceViewID,
                                            ToDevicePortID: item.DevicePortID,
                                            ToDeviceCompositePortName: item.CompositePortName,
                                            ToDevicePortDesc: item.PortDesc,
                                            ToDevicePortStatus: item.DevicePortStatus,
                                            ToDevicePortGender: item.PortGender,
                                            ToDevicePortNodeType: item.NodeType,
                                            ToDevicePortPortType: item.PortType
                                        };
                                        toDeviceData.push(dataObj)
                                    }

                                    // Skip merge if this to-device block is already on the grid.
                                    const deviceExist = await checkIfDeviceExist(props.catchTableData, toDeviceData[0].ToDeviceEntityID)
                                    if (!deviceExist) {
                                        // Placeholder "To Device" section exists: fill it with real port rows.
                                        if (props.catchTableData[props.catchTableData.length - 1] && props.catchTableData[props.catchTableData.length - 1].columnDefs?.length &&
                                            props.catchTableData[props.catchTableData.length - 1].columnDefs[props.catchTableData[props.catchTableData.length - 1].columnDefs.length - 1].headerName === "To Device"
                                        ) {

                                            const cloneCatchTableData = props.catchTableData
                                            const lastRowData = props.catchTableData[props.catchTableData.length - 1].rowData
                                            // Pad rows to the longer of existing from rows vs new to-device ports.
                                            const lengths = {
                                                lastRowData: lastRowData.length,
                                                toDeviceData: toDeviceData.length
                                            };
                                            const maxKey = (Object.keys(lengths) as (keyof typeof lengths)[])
                                                .reduce((a, b) => lengths[a] > lengths[b] ? a : b);
                                            const maxVal = lengths[maxKey];
                                            let rows = []
                                            for (let j = 0; j < maxVal; j++) {
                                                rows.push({
                                                    ...(lastRowData[j] ?? {}),
                                                    ...(toDeviceData[j] ?? {}),
                                                });

                                            }

                                            const column = await getColDef(lastRowData[0].FromDeviceName, toDeviceData[0].ToDeviceName)
                                            cloneCatchTableData[cloneCatchTableData.length - 1] = { columnDefs: FnDeepClone(column), rowData: rows }
                                            setTableData(cloneCatchTableData)
                                            if (cloneCatchTableData) {
                                                setSelectedRowObj({ tableIndex: cloneCatchTableData.length - 1, rowIndex: 0 })
                                            }
                                            makeDefultSelectionOfView(cloneCatchTableData)
                                            props.handleCatchTableData(cloneCatchTableData)
                                        } else if (fromDataUpdated) {
                                            // No placeholder: append a new device-to-device table section.
                                            const groupObject = props.catchTableData
                                            const fromData = fromDataUpdated
                                            const lengths = {
                                                fromData: fromDataUpdated.length,
                                                toDeviceData: toDeviceData.length
                                            };
                                            const maxKey = (Object.keys(lengths) as (keyof typeof lengths)[])
                                                .reduce((a, b) => lengths[a] > lengths[b] ? a : b);
                                            const maxVal = lengths[maxKey];
                                            let rows = []
                                            for (let j = 0; j < maxVal; j++) {
                                                const from = fromData[j];
                                                const to = toDeviceData[j];

                                                if (from || to) {
                                                    rows.push({
                                                        ...(from ?? {}),
                                                        ...(to ?? {}),
                                                        tableIndex: fromDataUpdated.length
                                                    });
                                                }
                                            }

                                            const column = await getColDef(fromData[0].FromDeviceName, toDeviceData[0].ToDeviceName)
                                            groupObject.push({ columnDefs: FnDeepClone(column), rowData: rows })

                                            setTableData([...groupObject])
                                            if (groupObject) {
                                                setSelectedRowObj({ tableIndex: groupObject.length - 1, rowIndex: 0 })
                                            }
                                            makeDefultSelectionOfView(groupObject)
                                            props.handleCatchTableData(groupObject)
                                        }

                                    }


                                }
                            } else {
                                console.warn("Port Data not Found")
                            }

                        }
                    }


                }
                axiosInterceptor({
                    url: CABLING.GetDevicePort,
                    data: cablesDevicePort,
                    allowShowLoader: true,
                    setFetchData: handleGetDevicePort

                }, statusBarContext)

            }
            // Refresh cable combo list whenever add-to-cabling runs (with or without port API).
            makeApiCallComboCabling();
        } catch (error) {
            console.error("error in get device port : ", error)
        }

    };

    const getColDef = async (fromDeviceName: string, toDeviceName: string) => {
        try {

            let finalColDef: IBasicGridColDef[] = [];
            const cloneCableColumn: Record<string, any>[] = [...cableColumn];

            // First pass: apply hide logic and header updates
            for (let index = 0; index < cloneCableColumn.length; index++) {
                const element = { ...cloneCableColumn[index] }; // Clone to avoid mutating original
                element.flex = undefined; // Remove any existing flex setting

                if (element.headerName === "From Port") {
                    element.headerName = "From: " + fromDeviceName;
                    if (CommonVariableContext.cablingHideColumnObject?.fromPort) {
                        element.hide = true;
                    }
                } else if (element.field === "ToDeviceCompositePortName") {
                    element.headerName = toDeviceName === "To Device" ? "To Device" : "To: " + toDeviceName;
                    if (CommonVariableContext.cablingHideColumnObject?.toDevicePort) {
                        element.hide = true;
                    }
                } else {
                    if (CommonVariableContext.cablingHideColumnObject?.cable) {
                        element.hide = true;
                    }
                }

                finalColDef.push(element);
            }

            // Second pass: find last visible column and assign flex: 1 only to it
            for (let i = finalColDef.length - 1; i >= 0; i--) {
                if (!finalColDef[i].hide) {
                    finalColDef[i].flex = 1;
                    break; // only one column should get flex: 1
                }
            }

            return finalColDef;
        } catch (error) {
            console.error("error in getcoldef : ", error)
        }
    };

    const getUniqueToDeviceData = (data: Record<string, any>[]) => {
        const grouped: string[] = [];
        data.forEach((item: Record<string, any>) => {
            const key = item.ToDeviceName;
            if (!grouped.includes(key) && key) {
                grouped.push(key);
            }
        });
        return grouped
    }

    const getUniqueCableData = (data: ICablingGridRow[]) => {
        const seen = new Set<string>();
        const uniqueCables: ICablingGridRow[] = [];

        data.forEach((item: ICablingGridRow) => {
            const key = `${item.PortAEntityID || ''}-${item.PortBEntityID || ''}`;
            const isCableNameValid = item.CableName && item.CableName.trim() !== '';

            if (key && !seen.has(key) && isCableNameValid) {
                seen.add(key);

                uniqueCables.push({
                    PortAViewName: item.PortAViewName,
                    PortAEntityID: item.PortAEntityID,
                    PortAStatus: item.PortAStatus,
                    PortACompositeName: item.PortACompositeName,
                    PortADesc: item.PortADesc,
                    PortAGender: item.PortAGender,
                    PortACableViewID: item.PortACableViewID,
                    PortANodeType: item.PortANodeType,
                    PortAPortType: item.PortAPortType ?? (item as any).PortAType ?? (item as any).PortType,
                    CableEntityName: item.CableEntityName,
                    CableEntityID: item.CableEntityID,
                    CableAssetID: item.CableAssetID,
                    CableName: item.CableName,
                    CableDescription: item.CableDescription,
                    PortBStatus: item.PortBStatus,
                    PortBCompositeName: item.PortBCompositeName,
                    PortBDesc: item.PortBDesc,
                    PortBEntityID: item.PortBEntityID,
                    PortBViewName: item.PortBViewName,
                    PortBGender: item.PortBGender,
                    PortBNodeType: item.PortBNodeType,
                    PortBPortType: item.PortBPortType ?? (item as any).PortBType ?? (item as any).PortType,
                    PortBCableViewID: item.PortBCableViewID
                });
            }
        });

        return uniqueCables;
    };
    // below function we are get first row of table and set default selection view.
    const makeDefultSelectionOfView = (data: ICablingGridSection[]) => {
        const tableDataobj = data.filter((item: ICablingGridSection, index: number) => { return index === (data.length - 1) })
        if (Array.isArray(tableDataobj) && tableDataobj.length > 0 && tableDataobj[0].rowData.length > 0) {
            let fromDeviceItem = tableDataobj[0].rowData.filter((item: ICablingGridRow) => item.FromDeviceViewID)
            let toDeviceItem = tableDataobj[0].rowData.filter((item: ICablingGridRow) => item.ToDeviceViewID)
            let cableItem = tableDataobj[0].rowData.filter((item: ICablingGridRow) => item.CableEntityID)
            setFromDeviceViewType(null)
            setToDeviceViewType(null)
            if (fromDeviceItem.length > 0) {
                setFromDeviceViewEntID(fromDeviceItem[0].FromDeviceViewID ?? "")
                setFromDeviceViewType(fromDeviceItem[0].FromDeviceViewName as "Front" | "Rear")
            }
            if (toDeviceItem.length > 0) {
                setToDeviceViewEntID(toDeviceItem[0].ToDeviceViewID ?? "")
                setToDeviceViewType(fromDeviceItem[0].ToDeviceViewName as "Front" | "Rear")
            } else {
                setToDeviceViewEntID(null)
            }
            if (cableItem.length > 0) {
                setCableViewEntID(cableItem[0].PortACableViewID ?? "")
                setSelectedCableName(cableItem[0].CableName ?? "")
            } else {
                setCableViewEntID(null)
                setSelectedCableName(null)
            }
        }
    }

    //When add to cable press from the kebab menu first call this useEffect to get data 
    useEffect(() => {
        const targetNode = props.checkedNodes ?? props.selectedNodeInfo?.node;
        const targetNodeType = (targetNode?.treetype || targetNode?.NodeType || "").toLowerCase();
        const isDevice = targetNodeType === "device" || targetNodeType === "mounteddevice";
        const featureLabel = props.selectedNodeMenu?.Label || selectedFeatureLabelRef.current;
        const isCablingAction =
            props.featureId === FEnums.EditNetworkCabling ||
            props.featureId === FEnums.EditPowerCabling ||
            props.featureId === FEnums.ReviewNetworkCabling ||
            props.featureId === FEnums.ReviewPowerCabling;

        if (isDevice) {
            setToDeviceViewEntID(null)
            setCableViewEntID(null)

            if (
                featureLabel === RightMouseMenuTreeNode.AddToCabling.toString()
            ) {
                if (props.checkedNodes) {
                    const cablingDiv = document.querySelectorAll('.nz-cabling-div .ag-row-focus')
                    const cablingRowSelected = document.querySelectorAll('.nz-cabling-div .ag-row-selected')
                    if (cablingDiv) {
                        cablingDiv.forEach(row => {
                            row.classList.remove('ag-row-focus');
                        });
                    }
                    if (cablingRowSelected) {
                        cablingRowSelected.forEach(row => {
                            row.classList.remove('ag-row-selected');
                        });
                    }

                    getDevicePort();
                }
            } else
                if (isCablingAction) {

                    setTableData([])
                    setColdef([])
                    setCableViewEntID(null)
                    setFromDeviceViewEntID(null)
                    setToDeviceViewEntID(null)
                    const getCablingDataObject = async () => {
                        const cablingData = await makeCablingApiCall(true);
                        const fromData = getOnlyFromDeviceFields(cablingData);
                        props.handleCatchFromData(fromData);
                        const toDevice = getUniqueToDeviceData(cablingData)
                        const cables = getUniqueCableData(cablingData)
                        const groupObject = []
                        if (toDevice.length) {

                            for (let index = 0; index < toDevice.length; index++) {
                                const element = toDevice[index];
                                let toDeviceData = []
                                for (let i = 0; i < cablingData.length; i++) {
                                    const device = cablingData[i];
                                    if (device.ToDeviceName === element) {
                                        toDeviceData.push({
                                            ToDeviceEntityName: device.ToDeviceEntityName,
                                            ToDeviceEntityID: device.ToDeviceEntityID,
                                            ToDeviceAssetID: device.ToDeviceAssetID,
                                            ToDevicePath: device.ToDevicePath,
                                            ToDeviceName: device.ToDeviceName,
                                            ToDeviceDescription: device.ToDeviceDescription,
                                            ToDeviceViewName: device.ToDeviceViewName,
                                            ToDeviceViewID: device.ToDeviceViewID,
                                            ToDevicePortID: device.ToDevicePortID,
                                            ToDeviceCompositePortName:
                                                device.ToDeviceCompositePortName,
                                            ToDevicePortDesc: device.ToDevicePortDesc,
                                            ToDevicePortStatus: device.ToDevicePortStatus,
                                            ToDevicePortGender: device.ToDevicePortGender,
                                            ToDevicePortNodeType: device.ToDevicePortNodeType,
                                            ToDevicePortPortType: device.ToDevicePortPortType
                                        })

                                    }
                                }

                                toDeviceData.sort((a, b) => {
                                    const aView = a.ToDeviceViewName ?? "";
                                    const bView = b.ToDeviceViewName ?? "";
                                    const viewCompare = aView.localeCompare(bView, undefined, { sensitivity: "base" });
                                    if (viewCompare !== 0) return viewCompare;
                                    return FnConvertCellName(a.ToDeviceCompositePortName ?? "").localeCompare(
                                        FnConvertCellName(b.ToDeviceCompositePortName ?? ""),
                                        undefined,
                                        { numeric: true, sensitivity: "base" }
                                    );
                                });

                                const lengths = {
                                    fromData: fromData.length,
                                    toDeviceData: toDeviceData.length,
                                    cables: index === 0 ? cables.length : 0
                                };

                                const maxKey = (Object.keys(lengths) as (keyof typeof lengths)[])
                                    .reduce((a, b) => lengths[a] > lengths[b] ? a : b);

                                const maxVal = lengths[maxKey];
                                let rows = []
                                for (let j = 0; j < maxVal; j++) {
                                    if (index === 0) {
                                        rows.push({
                                            ...(fromData[j] ?? {}),
                                            ...(cables[j] ?? {}),
                                            ...(toDeviceData[j] ?? {}),
                                            tableIndex: index

                                        });
                                    } else {
                                        rows.push({
                                            ...(fromData[j] ?? {}),
                                            ...(toDeviceData[j] ?? {}),
                                            tableIndex: index
                                        });
                                    }
                                }
                                const column = await getColDef(fromData[0].FromDeviceName, element)
                                groupObject.push({ columnDefs: FnDeepClone(column), rowData: rows })

                            }

                            setTableData(groupObject)
                            makeDefultSelectionOfView(groupObject)
                            props.handleCatchTableData(groupObject)

                        } else {
                            const lengths = {
                                fromData: fromData.length,
                                cables: cables.length
                            };
                            const maxKey = (Object.keys(lengths) as (keyof typeof lengths)[])
                                .reduce((a, b) => lengths[a] > lengths[b] ? a : b);
                            const maxVal = lengths[maxKey];
                            let rows = []
                            for (let j = 0; j < maxVal; j++) {
                                rows.push({
                                    ...(fromData[j] ?? {}),
                                    ...(cables[j] ?? {}),
                                });

                            }
                            const column = fromData.length && await getColDef(fromData[0].FromDeviceName, 'To Device')
                            groupObject.push({ columnDefs: FnDeepClone(column), rowData: FnDeepClone(rows) })
                            setTableData([...groupObject] as ICablingGridSection[])
                            makeDefultSelectionOfView(groupObject as ICablingGridSection[])
                            props.handleCatchTableData(groupObject)
                        }
                        if (groupObject) {
                            setSelectedRowObj({ tableIndex: groupObject.length - 1, rowIndex: 0 })
                        }
                    }
                    getCablingDataObject()
                }
        } else {
            setTableData([])
            setColdef([])
            setCableViewEntID(null)
            setFromDeviceViewEntID(null)
            setToDeviceViewEntID(null)
        }
    }, [props.checkedNodes, props.selectedNodeInfo, props.featureId, props.selectedNodeMenu]);

    function sortCablesByName(cables: Record<string, any>[]) {
        // Sort the cables array by the 'cableName' field
        return cables.sort((a: Record<string, any>, b: Record<string, any>) => {
            if (a.cableName < b.cableName) {
                return -1;
            }
            if (a.cableName > b.cableName) {
                return 1;
            }
            return 0;
        });
    }
    // fetch cable data
    const makeApiCallComboCabling = async () => {
        const handleGetCablesForPortMapping = async (response: unknown, status?: string) => {
            if (status === '200' && Array.isArray(response)) {
                const sortedList = Array.isArray(response) ? sortCablesByName(response) : []
                const options = []
                for (let index = 0; index < sortedList.length; index++) {
                    const element = sortedList[index];
                    options.push({
                        label: element.cableName,
                        value: element.cableID
                    })
                }
                setCableComboApiData(sortedList)
                setCableCombo(options)
            }

        }
        axiosInterceptor({
            url: CABLING.GetCables,
            allowShowLoader: true,
            data: {
                cableType: props.featureId == FEnums.EditPowerCabling
                    ? "Power"
                    : "Network"
            },
            setFetchData: handleGetCablesForPortMapping

        }, statusBarContext)

    }


    // Fetch cabling rows for a device
    const apiCallForGetCabling = async (payload: IGetCablingApiPayload): Promise<ICablingGridRow[]> => {
        let Cabling: ICablingGridRow[] = [];

        const handleGetCabling = async (response: unknown, status?: string) => {
            if (status === "200" && response && typeof response === "object" && 'cablingJson' in response) {
                const jsonCablingData = FnParseJsonSafely((response as { cablingJson: string }).cablingJson) as ICablingJsonResponse;
                const portData: string[] = [];
                if (jsonCablingData?.Cabling.length) {
                    const cablingData = FnSortGetCablingData(jsonCablingData);
                    for (let index = 0; index < cablingData?.Cabling.length; index++) {
                        const element = cablingData?.Cabling[index];
                        // Power cabling: PDU counts female ports; other devices count male ports.
                        // below condtion have apply for status bar variable to show status.
                        if (props.featureId === FEnums.ReviewPowerCabling || props.featureId === FEnums.EditPowerCabling) {

                            const entityName = (props.checkedNodes?.NodeEntityname || props.selectedNodeInfo?.node?.NodeEntityname)?.toLowerCase();
                            if (entityName === "__pdu") {
                                if (element.FromDevicePortGender === "F" && element.FromDevicePortID
                                    && !portData.includes(element.FromDevicePortID)) {
                                    portData.push(element.FromDevicePortID);
                                }
                            }
                            else {
                                if (element.FromDevicePortGender === "M" && element.FromDevicePortID
                                    && !portData.includes(element.FromDevicePortID)) {
                                    portData.push(element.FromDevicePortID);
                                }
                            }
                        }
                        else {
                            if (element.FromDevicePortGender === "F" && element.FromDevicePortID
                                && !portData.includes(element.FromDevicePortID)) {
                                portData.push(element.FromDevicePortID);
                            }
                        }

                        Cabling.push(element);
                    }
                }

                if (portData.length && props.updateStatusBarData)
                    props.updateStatusBarData(JSON.stringify({ "Ports": portData.length }), false);

            }
        };

        await axiosInterceptor({
            url: CABLING.GetCabling,
            data: payload,
            allowShowLoader: true,
            setFetchData: handleGetCabling
        }, statusBarContext);


        return Cabling;
    };

    const makeGetCablingApiCall = async (NodeEntID: string | null, checkNodeEntID: string | null): Promise<ICablingGridRow[]> => {
        let result: ICablingGridRow[] = []
        if (NodeEntID) {
            const payload = { fromDeviceID: NodeEntID };
            result = await apiCallForGetCabling(payload);;
        } else if (checkNodeEntID) {
            const payload = { fromDeviceID: checkNodeEntID };
            result = await apiCallForGetCabling(payload);;
        } else {
            console.error("Error in makeGetCablingApiCall: No NodeEntID or checkNodeEntID provided.");
        }
        return result;
    };


    // below when user click on right click menu function for set port status in cabling 
    const apiCallPortStatus = async (
        selectedRow: ICablingGridRow,
        Label: string,
        container: string
    ) => {

        let payload: ICablingSetPortStatusPayload | null = null;
        let portID: string | null = null
        let portName: string | null = null
        let status = Label == RightMouseMenuTreeNode.BlockPort.toString() ? "Blocked" : Label == RightMouseMenuTreeNode.ReservePort.toString() ? "Reserved" : Label.replace("Port", "").trim()

        if (container == "cabling_componet_deviceA") {
            payload = {
                isPower: props.featureId == FEnums.EditPowerCabling ? true : false,
                portID: selectedRow.FromDevicePortID,

                portStatus: status,
            };
            portName = selectedRow.FromDeviceCompositePortName ?? ""
            if (
                selectedRow.FromDevicePortStatus &&
                selectedRow.FromDevicePortStatus?.includes("PortID") &&
                (Label == RightMouseMenuTreeNode.BADPort.toString() ||
                    Label == RightMouseMenuTreeNode.BlockPort.toString())
            ) {
                portID = FnParseJsonSafely(selectedRow.FromDevicePortStatus).PortID;

            }
        } else if (container == "cabling_componet_deviceC") {
            payload = {
                isPower: props.featureId == FEnums.EditPowerCabling ? true : false,
                portID: selectedRow.ToDevicePortID,
                portStatus: status,
            };
            portName = selectedRow.ToDeviceCompositePortName ?? ""
            if (
                selectedRow.ToDevicePortStatus &&
                selectedRow.ToDevicePortStatus?.includes("PortID") &&
                (Label == RightMouseMenuTreeNode.BADPort.toString() ||
                    Label == RightMouseMenuTreeNode.BlockPort.toString())
            ) {
                portID = FnParseJsonSafely(selectedRow.ToDevicePortStatus).PortID;

            }
        } else {
            console.error("Error in apiCallPortStatus: Not Match container provided.");
        }

        if (props.treeData && mainAppContext.siteProperties?.Managed) {

            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
            setWorkorderRecords(workOrderProfile);
            setCreateWorkOrderPayload({
                treeData: props.treeData,
                sourceNodeEntID: props.selectedNodeInfo.node.NodeEntID ?? "",
                sourceNodeName: props.selectedNodeInfo.node.Name ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Change Port",
                action: "Change Port",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: props.selectedNodeInfo.node.NodeEntityname ?? "",
                ParentID: props.selectedNodeInfo.node.NodeEntID ?? "",
                PortStatus: Label,
                PortName: portName as string,
                PortID: payload?.portID
            })
            setShowSelectWorkorder(true);

        } else {
            const handleSetPortStatus = (response: unknown, status?: string) => {
                if (status === '200') {
                    const updatedTableData = tableData.map((element: ICablingGridSection) => {
                        if (!element.rowData) return element;
                        const payload: IFnCreateForensiclog = {
                            logType: 'UserAction',
                            GroupName: LogGroupName.ForensicLogTemplate,
                            _Forensiclog: LogSubGroupName.Cabling,
                            SubGroupName: LogSubGroupName.Cabling,
                            LogName: LogName.StatusChange,
                            actionObject: {
                                Status: Label,
                                Feature: props.featureId === FEnums.EditPowerCabling ? "Edit Power Cabling" : "Edit Network Cabling",
                                PortName: portName,
                            },
                            sessionContext: sessionContext,
                            statusBarContext: statusBarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        }
                        FnCreateForensiclog(payload)

                        const updatedRows = element.rowData.map((row: ICablingGridRow) => {
                            let updatedRow = { ...row }; // avoid mutating original row
                            if (container == "cabling_componet_deviceA") {
                                if (updatedRow.FromDevicePortID == selectedRow.FromDevicePortID) {
                                    if (
                                        selectedRow.FromDevicePortStatus?.includes("PortID") &&
                                        (Label == RightMouseMenuTreeNode.NormalPort.toString() ||
                                            Label == RightMouseMenuTreeNode.ReservePort.toString())
                                    ) {
                                        updatedRow.FromDevicePortStatus = updatedRow.FromDevicePortStatus;
                                    } else {
                                        updatedRow.FromDevicePortStatus = Label.replace("Port", "").trim();
                                    }
                                }
                            } else if (container == "cabling_componet_deviceC") {
                                if (updatedRow.ToDevicePortID == selectedRow.ToDevicePortID) {
                                    if (
                                        selectedRow.ToDevicePortStatus?.includes("PortID") &&
                                        (Label == RightMouseMenuTreeNode.NormalPort.toString() ||
                                            Label == RightMouseMenuTreeNode.ReservePort.toString())
                                    ) {
                                        updatedRow.ToDevicePortStatus = updatedRow.ToDevicePortStatus;
                                    } else {
                                        updatedRow.ToDevicePortStatus = Label.replace("Port", "").trim();
                                    }
                                }
                            }
                            if (portID) {
                                if (updatedRow.PortAEntityID === portID) {
                                    updatedRow.PortAStatus = null
                                }
                                if (updatedRow.PortBEntityID === portID) {
                                    updatedRow.PortBStatus = null;
                                }
                            }
                            return updatedRow;
                        });

                        return {
                            ...element,
                            rowData: updatedRows,
                        };
                    });
                    setTableData(updatedTableData)
                    props.handleCatchTableData(updatedTableData)
                }

            }
            await axiosInterceptor({
                url: CABLING.SetPortStatus,
                data: payload,
                allowShowLoader: true,
                setFetchData: handleSetPortStatus
            }, statusBarContext)
        }
    };
    // below when user click on right click menu function for disconnect port
    const apiCallForDisconnectPort = async (
        selectedRow: ICablingGridRow,
        container: string,
    ) => {
        let payload: ICablingDisconnectPortPayload | null = null;

        let portName = ""
        if (container == "cabling_componet_deviceA") {
            payload = {
                forceConnect: true,
                cablePortID: null,
                devicePortID: selectedRow.FromDevicePortID ?? null,
            };
            portName = selectedRow.FromDeviceCompositePortName ?? ""
        } else if (container == "cabling_componet_deviceC") {
            payload = {
                forceConnect: true,
                cablePortID: null,
                devicePortID: selectedRow.ToDevicePortID ?? "",
            };
            portName = selectedRow.ToDeviceCompositePortName ?? ""
        } else {
            console.error("Error in apiCallForDisconnectPort: not match container provided.");
        }
        const handleDeleteConnection = (response: unknown, status?: string) => {
            if (status === "200") {
                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Cabling,
                    SubGroupName: LogSubGroupName.Cabling,
                    LogName: LogName.DeleteConnection,
                    actionObject: {
                        Feature: props.featureId === FEnums.EditPowerCabling ? "Edit Power Cabling" : "Edit Network Cabling",
                        PortName: portName,
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)
                let dataCabling: ICablingGridSection[] = [];
                let FromDevicePortStatus: { PortID: string } | string | null =
                    selectedRow.FromDevicePortStatus?.includes("PortID")
                        ? FnParseJsonSafely(selectedRow.FromDevicePortStatus)
                        : null;
                let ToDevicePortStatus: { PortID: string } | string | null =
                    selectedRow.ToDevicePortStatus?.includes("PortID")
                        ? FnParseJsonSafely(selectedRow.ToDevicePortStatus)
                        : null;

                dataCabling = tableData.map((element: ICablingGridSection) => {
                    if (!element.rowData) return element;

                    const updatedRows = element.rowData.map((row: ICablingGridRow) => {
                        let updatedRow = { ...row }; // avoid mutating original row
                        if (container === "cabling_componet_deviceA" && row.FromDevicePortID === selectedRow.FromDevicePortID) {
                            updatedRow.FromDevicePortStatus = null;
                        } else if (container === "cabling_componet_deviceC" && row.ToDevicePortID === selectedRow.ToDevicePortID) {
                            updatedRow.ToDevicePortStatus = null;
                        }
                        return updatedRow;
                    });

                    return {
                        ...element,
                        rowData: updatedRows,
                    };
                });
                let portStatusArray: ICablingGridSection[] = [];
                if (
                    FromDevicePortStatus && typeof FromDevicePortStatus === "object" && FromDevicePortStatus?.PortID !== null ||
                    ToDevicePortStatus && typeof ToDevicePortStatus === "object" && ToDevicePortStatus?.PortID !== null
                ) {
                    portStatusArray = dataCabling.map((element: ICablingGridSection) => {
                        if (!element.rowData) return element;

                        const updatedRows = element.rowData.map((row: ICablingGridRow) => {
                            let updatedRow = { ...row }; // avoid mutating original row

                            if (FromDevicePortStatus && typeof FromDevicePortStatus === "object" && FromDevicePortStatus?.PortID !== null) {
                                if (updatedRow.PortAEntityID === FromDevicePortStatus.PortID && container === "cabling_componet_deviceA") {
                                    updatedRow.PortAStatus = null;
                                }

                                if (updatedRow.PortBEntityID === FromDevicePortStatus.PortID && container === "cabling_componet_deviceA") {
                                    updatedRow.PortBStatus = null;
                                }
                                if (updatedRow.PortBEntityID === FromDevicePortStatus.PortID && container === "cabling_componet_deviceC") {
                                    updatedRow.PortBStatus = null;
                                }
                                if (updatedRow.PortAEntityID === FromDevicePortStatus.PortID && container === "cabling_componet_deviceC") {
                                    updatedRow.PortAStatus = null;
                                }
                            }
                            if (ToDevicePortStatus && typeof ToDevicePortStatus === "object" && ToDevicePortStatus?.PortID !== null) {
                                if (updatedRow.PortAEntityID === ToDevicePortStatus?.PortID && container === "cabling_componet_deviceA") {
                                    updatedRow.PortAStatus = null;
                                }
                                if (updatedRow.PortBEntityID === ToDevicePortStatus?.PortID && container === "cabling_componet_deviceA") {
                                    updatedRow.PortBStatus = null;
                                }
                                if (updatedRow.PortBEntityID === ToDevicePortStatus?.PortID && container === "cabling_componet_deviceC") {
                                    updatedRow.PortBStatus = null;
                                }
                                if (updatedRow.PortAEntityID === ToDevicePortStatus.PortID && container === "cabling_componet_deviceC") {
                                    updatedRow.PortAStatus = null;
                                }
                            }

                            return updatedRow;
                        });

                        return {
                            ...element,
                            rowData: updatedRows,
                        };
                    });

                    setTableData(portStatusArray);
                    props.handleCatchTableData(portStatusArray);
                } else {
                    setTableData(dataCabling);
                    props.handleCatchTableData(dataCabling);
                }
                makeApiCallComboCabling()
            }

        }
        await axiosInterceptor({
            url: CABLING.DeleteConnection,
            data: payload,
            allowShowLoader: true,
            setFetchData: handleDeleteConnection
        }, statusBarContext)


    };
    // below when user click on right click menu function for disconnect cable
    const apiCallForDisconnectCable = async (
        selectedRow: ICablingGridRow,
        cableContainer: string
    ) => {

        let portId: string = "";
        let cableId: string = selectedRow?.CableEntityID ?? "";
        let cableName: string = selectedRow?.CableName ?? "";

        if (
            cableContainer === "cabling_componet_deviceC" &&
            selectedRow.ToDevicePortStatus?.toLowerCase().includes("port")
        ) {
            let devicePort = FnParseJsonSafely(selectedRow.ToDevicePortStatus);
            portId = devicePort?.PortID ?? "";
        } else if (
            cableContainer === "cabling_componet_deviceA" &&
            selectedRow.FromDevicePortStatus?.toLowerCase().includes("port")
        ) {
            let devicePort = FnParseJsonSafely(selectedRow.FromDevicePortStatus);
            portId = devicePort?.PortID ?? "";
        } else {
            console.error("error in apiCallForDisconnectCable Not Match calebleContainer/PortID");
        }

        if (portId) {
            tableData.forEach((element: ICablingGridSection) => {
                if (!element.rowData) return;
                element.rowData.forEach((row: ICablingGridRow) => {
                    if (row.PortAEntityID === portId || row.PortBEntityID === portId) {
                        cableName = row.CableName ?? cableName;
                        cableId = row.CableEntityID ?? cableId;
                    }
                });
            });
        }

        if (!cableId && cableName) {
            tableData.forEach((element: ICablingGridSection) => {
                if (!element.rowData) return;
                element.rowData.forEach((row: ICablingGridRow) => {
                    if (row.CableName === cableName && row.CableEntityID) {
                        cableId = row.CableEntityID;
                    }
                });
            });
        }

        const cablePortIDs = new Set<string>();
        const connectedDevicePortIDs = new Set<string>();

        if (portId) {
            cablePortIDs.add(portId);
        }
        if (cableContainer === "cabling_componet_deviceA" && selectedRow?.FromDevicePortID) {
            connectedDevicePortIDs.add(selectedRow.FromDevicePortID);
        }
        if (cableContainer === "cabling_componet_deviceC" && selectedRow?.ToDevicePortID) {
            connectedDevicePortIDs.add(selectedRow.ToDevicePortID);
        }

        if (cableId || cableName) {
            tableData.forEach((element: ICablingGridSection) => {
                if (!element.rowData) return;
                element.rowData.forEach((row: ICablingGridRow) => {
                    const isSameCable =
                        (cableId && row.CableEntityID === cableId) ||
                        (cableName && row.CableName === cableName);

                    if (isSameCable) {
                        if (row.PortAEntityID) cablePortIDs.add(row.PortAEntityID);
                        if (row.PortBEntityID) cablePortIDs.add(row.PortBEntityID);

                        if (row.PortAStatus && row.PortAStatus.toString().includes("PortID")) {
                            const parsedA = FnParseJsonSafely(row.PortAStatus);
                            if (parsedA?.PortID) connectedDevicePortIDs.add(parsedA.PortID);
                        }
                        if (row.PortBStatus && row.PortBStatus.toString().includes("PortID")) {
                            const parsedB = FnParseJsonSafely(row.PortBStatus);
                            if (parsedB?.PortID) connectedDevicePortIDs.add(parsedB.PortID);
                        }
                    }
                });
            });
        }

        if (cableId) {
            const handleDeleteDeviceConnections = (response: unknown, status?: string) => {
                if (status === "200") {
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Cabling,
                        SubGroupName: LogSubGroupName.Cabling,
                        LogName: LogName.DisconnectCable,
                        actionObject: {
                            Feature: props.featureId === FEnums.EditPowerCabling ? "Edit Power Cabling" : "Edit Network Cabling",
                            CableName: cableName
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload)
                    const updatedTableData = tableData.map((element: ICablingGridSection) => {
                        if (!element.rowData) return element;
                        const updatedRows = element.rowData.map((row: ICablingGridRow) => {
                            let updatedRow = { ...row }; // avoid mutating original row

                            const fromPortStatusId = updatedRow.FromDevicePortStatus && updatedRow.FromDevicePortStatus.toString().includes("PortID")
                                ? FnParseJsonSafely(updatedRow.FromDevicePortStatus)?.PortID
                                : null;

                            const isFromConnectedToCable =
                                (updatedRow.FromDevicePortID && connectedDevicePortIDs.has(updatedRow.FromDevicePortID)) ||
                                (fromPortStatusId && cablePortIDs.has(fromPortStatusId)) ||
                                Array.from(cablePortIDs).some((cId) => updatedRow.FromDevicePortStatus?.toString().includes(cId)) ||
                                Array.from(connectedDevicePortIDs).some((dId) => updatedRow.FromDevicePortStatus?.toString().includes(dId));

                            if (isFromConnectedToCable) {
                                updatedRow.FromDevicePortStatus = null;
                            }

                            const toPortStatusId = updatedRow.ToDevicePortStatus && updatedRow.ToDevicePortStatus.toString().includes("PortID")
                                ? FnParseJsonSafely(updatedRow.ToDevicePortStatus)?.PortID
                                : null;

                            const isToConnectedToCable =
                                (updatedRow.ToDevicePortID && connectedDevicePortIDs.has(updatedRow.ToDevicePortID)) ||
                                (toPortStatusId && cablePortIDs.has(toPortStatusId)) ||
                                Array.from(cablePortIDs).some((cId) => updatedRow.ToDevicePortStatus?.toString().includes(cId)) ||
                                Array.from(connectedDevicePortIDs).some((dId) => updatedRow.ToDevicePortStatus?.toString().includes(dId));

                            if (isToConnectedToCable) {
                                updatedRow.ToDevicePortStatus = null;
                            }

                            const isSameCable =
                                (cableId && updatedRow.CableEntityID === cableId) ||
                                (cableName && updatedRow.CableName === cableName);

                            if (isSameCable) {
                                updatedRow.PortAStatus = null;
                                updatedRow.PortBStatus = null;
                            }
                            return updatedRow;
                        });

                        return {
                            ...element,
                            rowData: updatedRows,
                        };
                    });
                    setTableData(updatedTableData)
                    props.handleCatchTableData(updatedTableData)
                    makeApiCallComboCabling()
                }
            }
            await axiosInterceptor({
                url: CABLING.DeleteDeviceConnections,
                data: { entIDList: [cableId] },
                allowShowLoader: true,
                setFetchData: handleDeleteDeviceConnections
            }, statusBarContext)
        }
    };

    // right mouse menu actions
    const handleSelectNodeMenu = async (value: Record<string, any>, name: string, selectedRow: ICablingGridRow, rowIndex: number) => {
        if (value) {
            setOriginalTableData(tableData)
            if (value.Label === RightMouseMenuTreeNode.BADPort.toString() ||
                value.Label === RightMouseMenuTreeNode.BlockPort.toString() ||
                value.Label === RightMouseMenuTreeNode.ReservePort.toString() ||
                value.Label === RightMouseMenuTreeNode.NormalPort.toString()) {

                apiCallPortStatus(
                    selectedRow,
                    value.Label,
                    name
                )
            } else if (
                value.Label === RightMouseMenuTreeNode.DisconnectPort.toString()
            ) {
                apiCallForDisconnectPort(
                    selectedRow,
                    name
                );

            } else if (value.Label === RightMouseMenuTreeNode.HideAll.toString()) {
                const updatedTableData = tableData.map((element: ICablingGridSection) => {
                    if (!element.rowData) return element;
                    const updatedRows = element.rowData.map((row: ICablingGridRow, index: number) => {
                        let updatedRow = { ...row }; // avoid mutating original row
                        if (row.tableIndex === selectedRow.tableIndex) {
                            if (index === rowIndex) {
                                return updatedRow
                            }
                        } else {
                            return updatedRow;
                        }
                    }).filter((row) => row !== undefined);;

                    return {
                        ...element,
                        rowData: updatedRows,
                    };
                });
                setTableData([...updatedTableData] as ICablingGridSection[]);
            } else if (
                value.Label === RightMouseMenuTreeNode.PushUp.toString()
            ) {

                if (rowIndex === 0) {
                    return;
                }
                const updatedTableData = tableData.map((element: ICablingGridSection) => {
                    if (!element.rowData?.length) return element;

                    // Check if any row in this element belongs to the selected tableIndex
                    const isMatchingTable = element.rowData.some(
                        (row: ICablingGridRow) => row.tableIndex === selectedRow.tableIndex
                    );

                    if (!isMatchingTable) return element;

                    const updatedRows = [...element.rowData]; // clone row array

                    if (rowIndex > 0 && rowIndex < updatedRows.length) {
                        // Perform swap
                        const temp = updatedRows[rowIndex];
                        updatedRows[rowIndex] = updatedRows[rowIndex - 1];
                        updatedRows[rowIndex - 1] = temp;
                    }

                    return {
                        ...element,
                        rowData: updatedRows,
                    };
                });

                setTableData([...updatedTableData]);


            } else if (
                value.Label ===
                RightMouseMenuTreeNode.PushDown.toString()
            ) {

                const updatedTableData = tableData.map((element: ICablingGridSection) => {
                    if (!element.rowData?.length) return element;

                    // Check if any row in this element belongs to the selected tableIndex
                    const isMatchingTable = element.rowData.some(
                        (row: ICablingGridRow) => row.tableIndex === selectedRow.tableIndex
                    );

                    if (!isMatchingTable) return element;

                    const updatedRows = [...element.rowData]; // clone row array

                    if (rowIndex < updatedRows.length - 1) {
                        // Perform swap to push row down
                        const temp = updatedRows[rowIndex];
                        updatedRows[rowIndex] = updatedRows[rowIndex + 1];
                        updatedRows[rowIndex + 1] = temp;
                    }

                    return {
                        ...element,
                        rowData: updatedRows,
                    };
                });

                setTableData(updatedTableData as ICablingGridSection[]);
            } else if (
                value.Label ===
                RightMouseMenuTreeNode.RemoveCable.toString()
            ) {

                setCableViewEntID(null)
                function clearCableDataAndReturnUpdated(data: ICablingGridSection[], cableName: string) {
                    if (!Array.isArray(data)) return data;

                    const cableKeysToRemove: (keyof ICablingGridRow)[] = [
                        "PortAViewName", "PortAEntityID", "PortAStatus", "PortACompositeName",
                        "PortADesc", "PortAGender", "PortACableViewID", "PortANodeType",
                        "CableEntityName", "CableEntityID", "CableAssetID", "CableName",
                        "CableDescription", "PortBStatus", "PortBCompositeName", "PortBDesc",
                        "PortBEntityID", "PortBViewName", "PortBGender", "PortBNodeType",
                        "PortBCableViewID"
                    ];

                    return data.map(table => {
                        if (!Array.isArray(table.rowData)) return table;

                        const updatedRowData = table.rowData.map((item: ICablingGridRow) => {
                            if (item.CableName === cableName) {
                                const updatedItem = { ...item } as ICablingGridRow; // clone item to avoid direct mutation
                                cableKeysToRemove.forEach((key: keyof ICablingGridRow) => {
                                    delete updatedItem[key];
                                });
                                return updatedItem;
                            }
                            return item;
                        });

                        return { ...table, rowData: updatedRowData };
                    });

                }

                let cableData = clearCableDataAndReturnUpdated(tableData, selectedRow.CableName ?? "")
                setTableData(cableData);
                props.handleCatchTableData(cableData);

            } else if (
                value.Label ===
                RightMouseMenuTreeNode.UnhideAll.toString()
            ) {
                setTableData(originalTableData.length ? originalTableData : tableData)
            } else if (
                value.Label ===
                RightMouseMenuTreeNode.DisconnectCable.toString()
            ) {
                setFromDeviceViewEntID(null)
                setToDeviceViewEntID(null)
                apiCallForDisconnectCable(
                    selectedRow,
                    name
                );
            }
        }
        CommonVariableContext.setSelectedNodeMenu(null);
    }

    useEffect(() => {
        if (CommonVariableContext.selectedNodeMenu) {
            handleSelectNodeMenu(CommonVariableContext.selectedNodeMenu.payload,
                CommonVariableContext.selectedNodeMenu.container,
                CommonVariableContext.selectedNodeMenu.selectedRow,
                CommonVariableContext.selectedNodeMenu.rowIndex)
        }
    }, [CommonVariableContext.selectedNodeMenu])


    // Custom cell renderer for the from-device port column (status color, tooltip, context menu).
    const toFromPortCell: ICablingCellRenderer = useCallback((params: ICablingCellRendererParams) => {

        if (!params || !params.data) return null;
        let postStatus: string | null = params.data?.FromDevicePortStatus?.toLowerCase().includes("portid")
            ? "portconnected"
            : params.data?.FromDevicePortStatus?.toLowerCase() || null;
        let FromDevicePortStatus = null
        if (params?.data?.FromDevicePortStatus?.toLowerCase().includes("portid")) {
            let data = FnParseJsonSafely(params?.data?.FromDevicePortStatus)
            FromDevicePortStatus = 'port-' + data.PortID
        }
        const tooltipString: string = FnTooltipForCell(params.data, params.context.Cabling as ICablingGridSection[], "FromDeviceCompositePortName") as string

        return (
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
                key={params.data && params.data?.FromDevicePortID ? params.data?.FromDevicePortID + params.data?.FromDeviceName : params.data?.FromDeviceName}
            >
                <span
                    id={FromDevicePortStatus ? `${FromDevicePortStatus}` : ''}
                    title={tooltipString}
                    style={{ width: "100%" }}
                >
                    <span
                        style={{
                            paddingRight: "10px",
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "center",
                        }}
                    >
                        <>
                            {params.value && !props.isReadOnly &&
                                <div
                                    id="desc"
                                    className="nz-desc nz-cabling-rtm"
                                    aria-describedby={"desc"}

                                >
                                    <NodeMenu
                                        showIcon={true}
                                        uniqueName="deviceA"
                                        handleSelect={(value: IActionImageForSubMenu) => {
                                        }}
                                        container="cabling_componet_deviceA"
                                        selectedRow={params.data}
                                        rowIndex={params.node.rowIndex ?? 0}
                                        featureId={props.featureId}
                                        selectedNode={props.selectedNodeInfo.node}
                                        field="FromDeviceCompositePortName"
                                        featureData={mainAppContext.featureRecords}

                                    />
                                </div>
                            }
                            {params.data?.FromDevicePortID !== null && params.value && (
                                <span
                                    style={{
                                        color:
                                            postStatus === null
                                                || postStatus === "available"
                                                || postStatus === "normal"
                                                || postStatus === ""
                                                || postStatus === "portconnected"
                                                || postStatus === "connected"
                                                ? "green"
                                                : postStatus === "bad"
                                                    ? "red"
                                                    : postStatus === "reserve"
                                                        ? "blue"
                                                        : postStatus === "block"
                                                            ? "black"
                                                            : "green",
                                    }}
                                >
                                    {postStatus === "block"
                                        || postStatus === "bad" ||
                                        postStatus === "reserve" ||
                                        postStatus === "connected"
                                        ? (
                                            <>[O]</>
                                        ) :
                                        postStatus === "portconnected" ? (
                                            <>[X]</>
                                        ) : postStatus === undefined || postStatus === null ||
                                            postStatus === "" ||
                                            postStatus === "available"
                                            || postStatus === "normal"
                                            ? (<>[&nbsp; &nbsp;]</>) : (
                                                <>[O]</>
                                            )}
                                </span>
                            )}
                        </>
                        <span id="nz-cell-value-string"
                            port-gender={params.data.FromDevicePortGender}
                            port-type={params.data.FromDevicePortPortType ?? ""}
                            allow-drop={(
                                postStatus === null ||
                                postStatus === "" ||
                                postStatus === "available" ||
                                postStatus === "normal") ? 'true' : 'false'}
                            data-index={params.data?.ID?.toString() ? params.data?.ID?.toString() : ""}
                            node-value={params.value}
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}

                        >
                            &nbsp;{FnConvertCellName(params.value ? params.value : "")}
                        </span>
                    </span>
                </span >

            </div >
        );
    }, [props.featureId, props.isReadOnly, props.selectedNodeInfo, tableData])

    // Custom cell renderer for the to-device port column (same patterns as toFromPortCell).
    const toDeviceCell = useCallback((params: any) => {

        if (!params || !params.data) return null;
        let postStatus = params?.data?.ToDevicePortStatus ?
            params?.data?.ToDevicePortStatus?.toLowerCase().includes("portid") ? "portconnected" : params?.data?.ToDevicePortStatus?.toLowerCase()
            : null
        let ToDevicePortStatus = null
        if (params?.data?.ToDevicePortStatus?.toLowerCase().includes("portid")) {
            let data = FnParseJsonSafely(params?.data?.ToDevicePortStatus)
            ToDevicePortStatus = 'port-' + data.PortID
        }

        // below code for display tooltip
        const tooltipString: string = FnTooltipForCell(params.data, params.context.Cabling as ICablingGridSection[], "ToDeviceCompositePortName") as string


        return (
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
                key={params.data?.ToDevicePortID + params.data?.ToDeviceCompositePortName}
            >
                <span
                    id={ToDevicePortStatus ? `${ToDevicePortStatus}` : ''}
                    title={tooltipString}
                >
                    <span
                        style={{
                            paddingRight: "10px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <>
                            {params.data.ToDeviceViewName && props.isReadOnly === false && <div
                                id="desc"
                                className="nz-desc nz-cabling-rtm"
                                aria-describedby={"desc"}

                            >
                                <NodeMenu
                                    showIcon={true}
                                    handleSelect={(value: IActionImageForSubMenu) => {
                                    }}
                                    uniqueName="deviceC"
                                    container="cabling_componet_deviceC"
                                    selectedRow={params.data}
                                    featureId={props.featureId}
                                    selectedNode={props.selectedNodeInfo.node}
                                    field="ToDeviceCompositePortName"
                                    rowIndex={params.node.rowIndex}
                                    featureData={mainAppContext.featureRecords} />
                            </div>}
                            {params?.data?.ToDevicePortID !== null && params.value && (
                                <span
                                    style={{
                                        color:
                                            postStatus === null ||
                                                postStatus === "available" || postStatus === "normal" || postStatus === "connected" || postStatus === "portconnected" ||
                                                postStatus === ""
                                                ? "green"
                                                : postStatus === "bad"
                                                    ? "red"
                                                    : postStatus ===
                                                        "reserve"
                                                        ? "blue"
                                                        : postStatus ===
                                                            "block"
                                                            ? "black"
                                                            : "green",
                                    }}
                                >
                                    {
                                        postStatus === "block" ||
                                            postStatus === "bad" ||
                                            postStatus === "reserve" || postStatus === "connected" ? (
                                            <>[O]</>
                                        ) : postStatus === "portconnected" ? (
                                            <>[X]</>
                                        ) : postStatus === undefined || postStatus === null ||
                                            postStatus === "" ||
                                            postStatus === "available" ||
                                            postStatus === "normal"
                                            ? (<>[&nbsp; &nbsp;]</>) :
                                            (
                                                <>[O]</>
                                            )}
                                </span>
                            )}
                        </>
                        <span id="nz-cell-value-string"
                            port-gender={params.data.ToDevicePortGender}
                            port-type={params.data.ToDevicePortPortType ?? params.data.ToDevicePortType ?? ""}
                            allow-drop={(postStatus === null ||
                                postStatus === "" ||
                                postStatus === "available" ||
                                postStatus === "normal") ? 'true' : 'false'}
                            data-index={params.data.ID?.toString() ? params.data.ID?.toString() : ""}
                            node-value={params.value}
                        >

                            &nbsp; {FnConvertCellName(params.value ? params.value : "")}
                        </span>
                    </span>
                </span>

            </div>
        );
    }, [props.featureId, props.isReadOnly, props.selectedNodeInfo])

    //Default grid options
    const gridOptions = {
        // Other grid options...
        defaultColDef: {
            enableRowGroup: false,
            enablePivot: false,
            enableValue: true,
            resizable: true,
            filter: false,
            editable: false,
            menuTabs: [],
        },
        getRowStyle: (params: ICablingCellRendererParams) => {
            return { background: "" };
        },
    };

    // Default column layout: from port | cable A/B | to port (used when building new grid sections).
    const cableColumn =
        [
            {
                headerName: "From Port",
                field: "FromDeviceCompositePortName",
                suppressMovable: true,
                cellClass: [
                    "nz-coldef-from-device-column",
                ],
                resizable: true,
                minWidth: 80,
                cellRendererSelector: (params: ICablingCellRendererParams) => {
                    return { component: toFromPortCell, params: params };
                },
            },
            {
                headerName: "Front Port",
                minWidth: 100,
                cellClass: [
                    "nz-cable-columns",
                ],
                suppressMovable: true,
                cellClassRules: {
                    'disable-selection-cell': (params: ICablingCellRendererParams) => !params.value,
                },
                resizable: true,
                field: "PortACompositeName",
                cellRenderer: (params: ICablingCellRendererParams) => {
                    function getLastWord(input: string): string {
                        const parts = input.trim().split(/\s+/);
                        return parts[parts.length - 1] || "";
                    }
                    let postStatus = params?.data?.PortAStatus?.toLowerCase().includes("portid") ? "connected" : params?.data?.PortAStatus?.toLowerCase()
                    let PortAStatus = null
                    if (params?.data?.PortAStatus?.toLowerCase().includes("portid")) {
                        PortAStatus = 'port-' + params?.data?.PortAEntityID
                    }
                    let tooltipObj = {}
                    if (params.context.Cabling) {

                        if (params.data?.PortAStatus && params.data.PortAStatus.toString()
                            ?.toLowerCase()
                            .includes("portid")) {
                            let portID = FnParseJsonSafely(params.data.PortAStatus)
                            if (portID.PortID) {
                                portID = portID.PortID
                            }
                            let connectedToName = ''
                            let connectedToPort = ''
                            if (portID) {

                                params.context.Cabling.map((element: ICablingGridSection) => {
                                    if (!element.rowData) return element;
                                    element.rowData.map((row: ICablingGridRow) => {
                                        let updatedRow = { ...row }; // avoid mutating original row
                                        if (portID === updatedRow.FromDevicePortStatus || portID === updatedRow.FromDevicePortID) {
                                            connectedToName = updatedRow.FromDeviceCompositePortName ?? ""
                                            connectedToPort = updatedRow.FromDeviceViewName ?? ""
                                        } else if (portID === updatedRow.ToDeviceEntityID || portID === updatedRow.ToDevicePortID) {
                                            connectedToName = updatedRow.ToDeviceCompositePortName ?? ""
                                            connectedToPort = updatedRow.ToDeviceViewName ?? ""
                                        }
                                    });
                                });

                            }

                            tooltipObj = {
                                "PortACompositeName": params.data?.PortACompositeName,
                                "connectedToName": connectedToName,
                                "connectedToPort": connectedToPort,
                                "PortAViewName": params.data?.PortAViewName,
                                "PortAGender": params.data.PortAGender,
                                "PortAStatus": params.data?.PortAStatus,
                                PortAEntityID: params.data.PortAEntityID
                            }
                        } else {
                            tooltipObj = {
                                "PortACompositeName": params.data?.PortACompositeName,
                                "connectedToName": "",
                                "connectedToPort": "",
                                "PortAViewName": params.data?.PortAViewName,
                                "PortAGender": params.data?.PortAGender,
                                "PortAStatus": params.data?.PortAStatus,
                                PortAEntityID: params.data?.PortAEntityID
                            }
                        }

                    }
                    if (params.context.diagnosticLevel?.toString() == "0" && params?.data) {
                        tooltipObj = params?.data
                    }

                    return (
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: 'space-between'
                            }}
                            key={params.data && params.data?.PortAEntityID && params.data?.PortAEntityID + params.data?.PortACompositeName}
                        >

                            <span
                                id={PortAStatus ? PortAStatus : ''}
                                title={JSON.stringify(tooltipObj ? tooltipObj : params?.data, null, 2)}
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >

                                {params.data?.PortAViewName && params.data?.PortAEntityID && (
                                    <span
                                        style={{
                                            color:
                                                postStatus === undefined ||
                                                    postStatus === null ||
                                                    postStatus === "" ||
                                                    postStatus === "available" ||
                                                    postStatus === "normal" || postStatus === "connected"
                                                    ? "green"
                                                    : postStatus === "bad"
                                                        ? "red"
                                                        : postStatus === "reserve"
                                                            ? "blue"
                                                            : postStatus === "block"
                                                                ? "black"
                                                                : "green",
                                        }}
                                    >
                                        {
                                            postStatus === "block" ||
                                                postStatus === "bad" ||
                                                postStatus === "reserve"
                                                ? (
                                                    <>[O]</>
                                                ) :
                                                postStatus === "connected" ? (
                                                    <>[X]</>
                                                ) :
                                                    postStatus === undefined ||
                                                        postStatus === null ||
                                                        postStatus === "" ||
                                                        postStatus === "available" ||
                                                        postStatus === "normal" ? (<>[&nbsp; &nbsp;]</>) :
                                                        (
                                                            <>[O]</>
                                                        )}
                                    </span>
                                )}
                                <span style={{ paddingLeft: 5, width: '100%' }}
                                    port-gender={params.data?.PortAGender}>
                                    {`${params.data?.PortAGender ? `${params.data?.PortAGender + " " + getLastWord(params.data?.PortACompositeName ?? "")}` : ""}`}
                                </span>
                            </span>

                        </div>
                    );
                },
            },
            {
                headerName: "Cable",
                minWidth: 80,
                cellClass: [
                    "nz-cable-columns",

                ],
                field: "CableName",
                suppressMovable: true,
                resizable: true,
                cellClassRules: {
                    'disable-selection-cell': (params: ICablingCellRendererParams) => !params.value,
                },
                cellRenderer: (params: ICablingCellRendererParams) => {
                    let PortAStatus = params?.data?.PortAStatus?.toLowerCase().includes("portid") ? "connected" : params?.data?.PortAStatus?.toLowerCase()
                    let PortBStatus = params?.data?.PortBStatus?.toLowerCase().includes("portid") ? "connected" : params?.data?.PortBStatus?.toLowerCase()
                    function areAllCablePortsCleared(data: ICablingGridSection[], cableName: string): boolean {
                        if (!Array.isArray(data)) return false;

                        const matchingCables: ICablingGridRow[] = [];

                        for (const table of data) {
                            if (!Array.isArray(table.rowData)) continue;

                            for (const item of table.rowData) {
                                if (item.CableName === cableName) {
                                    matchingCables.push(item);
                                }
                            }
                        }

                        if (matchingCables.length === 0) return false;

                        const allCleared = matchingCables.every(item => {
                            const portAStatus = item.PortAStatus;
                            const portBStatus = item.PortBStatus;

                            const isPortAValid =
                                portAStatus === null ||
                                portAStatus === '' ||
                                portAStatus === undefined ||
                                (typeof portAStatus === 'string' && !portAStatus?.toLowerCase().includes('portid'));

                            const isPortBValid =
                                portBStatus === null ||
                                portBStatus === '' ||
                                portBStatus === undefined ||
                                (typeof portBStatus === 'string' && !portBStatus?.toLowerCase().includes('portid'));

                            return isPortAValid && isPortBValid;
                        });

                        return allCleared;
                    }
                    let status: boolean = params.context.Cabling ? areAllCablePortsCleared(params.context.Cabling, params.data?.CableName ?? "") : false;

                    return (
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: 'start'
                            }}
                            key={params.node?.rowIndex ?? "" + params?.value}
                        >
                            <>
                                <div
                                    id="desc"
                                    className="nz-desc nz-cabling-rtm"
                                    aria-describedby={"desc"}

                                >
                                    {params.value && PortAStatus !== 'connected' && PortBStatus !== 'connected' && !props.isReadOnly && status &&
                                        <NodeMenu
                                            showIcon={true}
                                            uniqueName="deviceA"
                                            handleSelect={(value: IActionImageForSubMenu) => {
                                            }}
                                            container="cabling_componet_cable"
                                            selectedRow={params.data}
                                            rowIndex={params.node?.rowIndex ?? 0}
                                            featureId={props.featureId}
                                            selectedNode={props.selectedNodeInfo.node}
                                            field="CableName"
                                            featureData={mainAppContext.featureRecords}

                                        />
                                    }
                                </div>
                                <span
                                    title={JSON.stringify(params?.data, null, 2)}
                                    style={{ paddingRight: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                    {params.value ? params.value : ""}
                                </span>

                            </>
                        </div>
                    );
                },
            },
            {
                headerName: "Rear Port",
                minWidth: 100,
                field: "PortBCompositeName",
                suppressMovable: true,
                resizable: true,
                cellClass: [
                    "nz-cable-columns",

                ],
                cellClassRules: {
                    'disable-selection-cell': (params: ICablingCellRendererParams) => !params.value,
                },

                cellRenderer: (params: ICablingCellRendererParams) => {
                    function getLastWord(input: string): string {
                        const parts = input.trim().split(/\s+/);
                        return parts[parts.length - 1] || "";
                    }
                    let postStatus = params?.data?.PortBStatus?.toLowerCase().includes("portid") ? "connected" : params?.data?.PortBStatus?.toLowerCase()
                    let PortBStatus = null
                    if (params?.data?.PortBStatus?.toLowerCase().includes("portid")) {
                        PortBStatus = 'port-' + params?.data?.PortBEntityID
                    }
                    let tooltipObj = {}
                    if (params.context.Cabling) {
                        if (params.data?.PortBStatus && params.data?.PortBStatus.toString()
                            ?.toLowerCase()
                            .includes("portid")) {
                            let portID = params.data?.PortBStatus ? FnParseJsonSafely(params.data?.PortBStatus) : ""
                            if (portID.PortID) {
                                portID = portID.PortID
                            }
                            let connectedToName = ''
                            let connectedToPort = ''
                            if (portID) {

                                params.context.Cabling.map((element: ICablingGridSection) => {
                                    if (!element.rowData) return element;
                                    element.rowData.map((row: ICablingGridRow) => {
                                        let updatedRow = { ...row }; // avoid mutating original row
                                        if (portID === updatedRow.FromDevicePortStatus || portID === updatedRow.FromDevicePortID) {
                                            connectedToName = updatedRow.FromDeviceCompositePortName ?? ""
                                            connectedToPort = updatedRow.FromDeviceViewName ?? ""
                                        } else if (portID === updatedRow.ToDeviceEntityID || portID === updatedRow.ToDevicePortID) {
                                            connectedToName = updatedRow.ToDeviceCompositePortName ?? ""
                                            connectedToPort = updatedRow.ToDeviceViewName ?? ""
                                        }
                                    });
                                });

                            }

                            tooltipObj = {
                                "PortBCompositeName": params.data?.PortBCompositeName,
                                "connectedToName": connectedToName,
                                "connectedToPort": connectedToPort,
                                "PortBViewName": params.data?.PortBViewName,
                                "PortBGender": params.data?.PortBGender,
                                "PortBStatus": params.data?.PortBStatus,
                                PortBEntityID: params.data?.PortBEntityID
                            }
                        } else {
                            tooltipObj = {
                                "PortBCompositeName": params.data?.PortBCompositeName,
                                "connectedToName": "",
                                "connectedToPort": "",
                                "PortBViewName": params.data?.PortBViewName,
                                "PortBGender": params.data?.PortBGender,
                                "PortBStatus": params.data?.PortBStatus,
                                PortBEntityID: params.data?.PortBEntityID

                            }
                        }

                    }
                    if (params.context.diagnosticLevel?.toString() == "0") {
                        tooltipObj = params?.data as ICablingGridRow
                    }

                    return (
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: 'space-between'
                            }}
                            key={params.data?.PortBEntityID ?? "" + params.data?.PortBCompositeName}
                        >

                            <span
                                id={PortBStatus ? PortBStatus : ''}
                                title={JSON.stringify(tooltipObj ? tooltipObj : params?.data, null, 2)}
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                                <>

                                    {params.data?.PortBViewName && params.data.PortBEntityID && (
                                        <span
                                            style={{
                                                color:
                                                    postStatus === undefined ||
                                                        postStatus === null ||
                                                        postStatus === "available" ||
                                                        postStatus === "normal" ||
                                                        postStatus === "connected" ||
                                                        postStatus === ""
                                                        ? "green"
                                                        : postStatus === "bad"
                                                            ? "red"
                                                            : postStatus === "reserve"
                                                                ? "blue"
                                                                : postStatus === "block"
                                                                    ? "black"
                                                                    : "green",
                                            }}
                                        >
                                            {postStatus === "block" ||
                                                postStatus === "bad" ||
                                                postStatus === "reserve"
                                                ? (
                                                    <>[O]</>
                                                ) : postStatus === "connected" ? (
                                                    <>[X]</>
                                                ) : postStatus === undefined || postStatus === null ||
                                                    postStatus === "" ||
                                                    postStatus === "available" ||
                                                    postStatus === "normal" ? (<>[&nbsp; &nbsp;]</>) : (
                                                    <>[O]</>
                                                )}
                                        </span>
                                    )}
                                </>
                                <span style={{ paddingLeft: 5 }}
                                    port-gender={params.data?.PortBGender}>
                                    {`${params.data?.PortBGender ? `${params.data?.PortBGender + " " + getLastWord(params.data?.PortBCompositeName ?? "")}` : ""}`}
                                </span>
                            </span>

                        </div>
                    );
                },
            },
            {
                headerName: "To Device",
                minWidth: 200,
                field: "ToDeviceCompositePortName",
                suppressMovable: true,
                resizable: true,
                cellClass: [
                    "nz-coldef-to-device-column",
                ],

                cellRendererSelector: (params: ICablingCellRendererParams) => {
                    return { component: toDeviceCell, params: params };
                },

            }

        ]



    // /Manage next column when it scroll
    const getNextColumnId = (currentColDef: IBasicGridColDef) => {
        let columnData = coldef;
        if (columnData && columnData?.length > 0) {
            const allColumnIds = coldef?.map((col: IBasicGridColDef) => col.field);
            const currentIndex = allColumnIds?.indexOf(currentColDef?.field);
            if (allColumnIds && allColumnIds?.length > 0) {
                return allColumnIds[currentIndex ?? 0 + 1];
            } else {
                return allColumnIds && allColumnIds[0];
            }
        }
    };

    function removeAllMatchingClass(className: string) {
        // Select all elements with the specified class
        const elements = document.querySelectorAll(`.${className}`);

        // Iterate through the elements and remove the class
        elements.forEach(element => {
            element.classList.remove(className);
        });
    }

    // below function scroll to the provide element
    function scrollToClass(className: string) {
        try {
            const selector = '.' + className.trim().split(/\s+/).join('.');
            const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
            const clickedElement = document.activeElement as HTMLElement;
            const other = elements.find(el => el !== clickedElement);
            if (!other) return;

            other.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
            });
            return elements
        } catch (error) {
            console.error("Error in scrollToClass:", error);
        }
    }
    // below function to added pulse class or active class
    const addClassNamePulse = (ClassName: string, columnNameClass?: string) => {
        let portId = document.querySelectorAll(`#port-${ClassName}`)
        portId.forEach((element) => {
            let div = element.closest('.ag-cell')
            if (div) {
                div.classList.add('nz-active-port');
                if (columnNameClass) {
                    div.classList.add(columnNameClass)
                }
            }
        });
    }
    // below function to update session on selection of cabling grid from device and to device.
    const callApiToUpdateSession = async (data: ICablingSessionUpdateItem[]) => {
        const handleUpdateSessionApiResponse = (updateSessionApiResponse: unknown, status?: string) => {
            if (status === "200" && updateSessionApiResponse && typeof updateSessionApiResponse === "object" && 'jsonSessionOutput' in updateSessionApiResponse) {
                const extractedData = FnHandleAPIResponse(updateSessionApiResponse.jsonSessionOutput, 'Dataset');
                if (extractedData && Array.isArray(extractedData)) {
                    sessionContext.setSessionList(extractedData);
                }
            }
        }

        await axiosInterceptor({
            url: SESSION.UpdateSession,
            data: {
                jsonSession: JSON.stringify(data)
            },
            allowShowLoader: true,
            setFetchData: handleUpdateSessionApiResponse
        }, statusBarContext)
    }

    const findCableData = (data: ICablingGridSection[], portID: string) => {
        const matchedCables: ICablingGridRow[] = [];

        for (let index = 0; index < data.length; index++) {
            const tableData = data[index];

            if (tableData.rowData) {
                const cableData = tableData.rowData.filter((item: ICablingGridRow) =>
                    (item.PortAEntityID && item.PortAEntityID.includes(portID)) ||
                    (item.PortBEntityID && item.PortBEntityID.includes(portID))
                );

                if (cableData.length) {
                    matchedCables.push(...cableData);
                }
            }
        }

        return matchedCables.length ? matchedCables[0] : null;
    };
    // below function to find cable connected device
    const findoutCableConnectedDevice = (data: ICablingGridSection[], portID: string, type: "toDevice" | "fromDevice") => {
        const matchedCables: ICablingGridRow[] = [];

        for (let index = 0; index < data.length; index++) {
            const tableData = data[index];

            if (tableData.rowData) {
                const cableData = tableData.rowData.filter((item: ICablingGridRow) =>
                    (item.ToDevicePortID && item.ToDevicePortID.includes(portID) && type == "toDevice") ||
                    (item.FromDevicePortID && item.FromDevicePortID.includes(portID) && type == "fromDevice") ||
                    (item.FromDevicePortStatus && item.FromDevicePortStatus.includes(portID) && type == "fromDevice") ||
                    (item.ToDevicePortStatus && item.ToDevicePortStatus.includes(portID) && type == "toDevice")
                );

                if (cableData.length) {
                    matchedCables.push(...cableData);
                }
            }
        }

        return matchedCables.length ? matchedCables[0] : null;
    };
    // below function to findout cable connected port
    const findOutConnectedPort = (data: ICablingGridSection[], portID: string, type: "toDevice" | "fromDevice") => {
        const matchedCables: ICablingGridRow[] = [];

        for (let index = 0; index < data.length; index++) {
            const tableData = data[index];

            if (tableData.rowData) {
                const cableData = tableData.rowData.filter((item: ICablingGridRow) =>
                    (item.ToDevicePortStatus && item.ToDevicePortStatus.includes(portID) && type == "toDevice") ||
                    (item.FromDevicePortStatus && item.FromDevicePortStatus.includes(portID) && type == "fromDevice")
                );

                if (cableData.length) {
                    matchedCables.push(...cableData);
                }
            }
        }

        return matchedCables.length ? matchedCables[0] : null;
    };
    // below function to find other side port(s) for a cable (supports 1-to-many and many-to-one cables)
    const findCableOtherPort = (
        data: ICablingGridSection[],
        cableData: ICablingGridRow,
        targetPortType: "PortA" | "PortB"
    ): string[] => {
        if (!cableData) return [];
        const portField = targetPortType === "PortA" ? "PortAEntityID" : "PortBEntityID";
        const results: string[] = [];
        if (cableData[portField]) {
            results.push(cableData[portField] as string);
        }
        if (cableData.CableEntityID || cableData.CableName) {
            for (const section of data) {
                if (section.rowData) {
                    for (const row of section.rowData) {
                        if (
                            row !== cableData &&
                            ((cableData.CableEntityID && row.CableEntityID === cableData.CableEntityID) ||
                                (cableData.CableName && row.CableName === cableData.CableName)) &&
                            row[portField]
                        ) {
                            const val = row[portField] as string;
                            if (!results.includes(val)) {
                                results.push(val);
                            }
                        }
                    }
                }
            }
        }
        return results;
    };
    // below function to find cable view ID across cable rows (supports 1-to-many cables where PortACableViewID is on row 1)
    const findCableViewId = (data: ICablingGridSection[], cableData: ICablingGridRow | null | undefined): string => {
        if (!cableData) return "";
        if (cableData.PortACableViewID) return cableData.PortACableViewID;
        if (cableData.CableEntityID || cableData.CableName) {
            for (const section of data) {
                if (section.rowData) {
                    const match = section.rowData.find((r: ICablingGridRow) =>
                        ((cableData.CableEntityID && r.CableEntityID === cableData.CableEntityID) ||
                            (cableData.CableName && r.CableName === cableData.CableName)) &&
                        r.PortACableViewID
                    );
                    if (match?.PortACableViewID) {
                        return match.PortACableViewID;
                    }
                }
            }
        }
        return "";
    };
    // below function to highlight cell
    const makeHighlightCell = (data: ICablingGridSection[], portID: string, cellClass: string) => {
        let cableData = findCableData(data, portID);
        if (!cableData) return;
        if (cableData.PortAEntityID && cableData.PortAEntityID.includes(portID)) {
            const portBIds = findCableOtherPort(data, cableData, "PortB");
            for (const id of portBIds) {
                addClassNamePulse(id, cellClass);
            }
        } else if (cableData.PortBEntityID && cableData.PortBEntityID.includes(portID)) {
            const portAIds = findCableOtherPort(data, cableData, "PortA");
            for (const id of portAIds) {
                addClassNamePulse(id, cellClass);
            }
        }
    };
    const FnHighlightConnectedPort = (colId: string, params: any) => {
        try {
            //  From / To device port columns: update views and highlight connected path 
            if (colId === "FromDeviceCompositePortName") {
                // Connected from-port: follow PortID through cable to to-device and cable preview.
                if (
                    params.data &&
                    params.data.FromDevicePortStatus &&
                    params.data.FromDevicePortStatus.toString()
                        ?.toLowerCase()
                        .includes("portid")
                ) {
                    let { PortID } = FnParseJsonSafely(params.data.FromDevicePortStatus);
                    if (PortID) {
                        let otherConnectedPort = ''
                        let cableData = findCableData(params.context.Cabling as ICablingGridSection[], PortID)
                        if (cableData && cableData.PortAEntityID && cableData.PortAEntityID.includes(PortID)) {
                            const portBIds = findCableOtherPort(params.context.Cabling as ICablingGridSection[], cableData, "PortB");
                            for (const bId of portBIds) {
                                const toDevRow = findOutConnectedPort(params.context.Cabling as ICablingGridSection[], bId, "toDevice");
                                if (toDevRow) {
                                    otherConnectedPort = bId;
                                    break;
                                }
                            }
                            if (!otherConnectedPort && portBIds.length) {
                                otherConnectedPort = portBIds[0];
                            }
                        } else if (cableData && cableData.PortBEntityID && cableData.PortBEntityID.includes(PortID)) {
                            const portAIds = findCableOtherPort(params.context.Cabling as ICablingGridSection[], cableData, "PortA");
                            for (const aId of portAIds) {
                                const toDevRow = findOutConnectedPort(params.context.Cabling as ICablingGridSection[], aId, "toDevice");
                                if (toDevRow) {
                                    otherConnectedPort = aId;
                                    break;
                                }
                            }
                            if (!otherConnectedPort && portAIds.length) {
                                otherConnectedPort = portAIds[0];
                            }
                        }
                        if (otherConnectedPort) {
                            let data = findOutConnectedPort(params.context.Cabling as ICablingGridSection[], otherConnectedPort, "toDevice")
                            if (data) {
                                setToDeviceViewEntID(data.ToDeviceViewID ?? "")
                            } else {
                                setToDeviceViewEntID("")
                                setFromDeviceViewEntID(params.data.FromDeviceViewID ?? "")
                            }
                        }
                        setCableViewEntID(findCableViewId(params.context.Cabling as ICablingGridSection[], cableData))
                        setSelectedCableName(cableData?.CableName ?? "")
                    }
                    if (params.context.Cabling) {
                        makeHighlightCell(params.context.Cabling, PortID, "nz-todevice-selected")
                    }
                    addClassNamePulse(PortID, "nz-from-selected");
                    if (PortID) {
                        const deviceb = scrollToClass("nz-coldef-to-device-column nz-todevice-selected")
                        if (!deviceb) {
                            const devicea = scrollToClass("nz-coldef-from-device-column nz-todevice-selected")
                            if (!devicea) {
                                scrollToClass("nz-cable-columns nz-active-port")
                            }
                        }
                    } else {
                        scrollToClass("nz-cable-columns nz-active-port")
                    }
                } else {
                    // Unconnected from-port: show from-device view only.
                    if (params.data && params.data.FromDeviceViewID) {
                        setFromDeviceViewEntID(params.data.FromDeviceViewID)
                        setToDeviceViewEntID(null)
                        setCableViewEntID("")
                        setSelectedCableName("")
                    } else {
                        setFromDeviceViewEntID(null)
                        setToDeviceViewEntID(null)
                        setCableViewEntID(null)
                    }
                    scrollToClass("nz-cable-columns nz-active-port")
                }
            } else if (colId === "ToDeviceCompositePortName") {
                // Connected to-port: same traversal as from-port but roles reversed.
                if (
                    params.data &&
                    params.data.ToDevicePortStatus &&
                    params.data.ToDevicePortStatus.toString()
                        ?.toLowerCase()
                        .includes("portid")
                ) {
                    let { PortID } = FnParseJsonSafely(params.data.ToDevicePortStatus);
                    if (PortID) {
                        let otherConnectedPort = ''
                        let cableData = findCableData(params.context.Cabling as ICablingGridSection[], PortID)
                        if (cableData && cableData.PortAEntityID && cableData.PortAEntityID.includes(PortID)) {
                            const portBIds = findCableOtherPort(params.context.Cabling as ICablingGridSection[], cableData, "PortB");
                            for (const bId of portBIds) {
                                const fromDevRow = findOutConnectedPort(params.context.Cabling as ICablingGridSection[], bId, "fromDevice");
                                if (fromDevRow) {
                                    otherConnectedPort = bId;
                                    break;
                                }
                            }
                            if (!otherConnectedPort && portBIds.length) {
                                otherConnectedPort = portBIds[0];
                            }
                        } else if (cableData && cableData.PortBEntityID && cableData.PortBEntityID.includes(PortID)) {
                            const portAIds = findCableOtherPort(params.context.Cabling as ICablingGridSection[], cableData, "PortA");
                            for (const aId of portAIds) {
                                const fromDevRow = findOutConnectedPort(params.context.Cabling as ICablingGridSection[], aId, "fromDevice");
                                if (fromDevRow) {
                                    otherConnectedPort = aId;
                                    break;
                                }
                            }
                            if (!otherConnectedPort && portAIds.length) {
                                otherConnectedPort = portAIds[0];
                            }
                        }
                        if (otherConnectedPort) {
                            let data = findOutConnectedPort(params.context.Cabling as ICablingGridSection[], otherConnectedPort, "fromDevice")
                            if (data) {
                                setFromDeviceViewEntID(data.FromDeviceViewID ?? "")
                                setToDeviceViewEntID(params.data.ToDeviceViewID ?? "")
                            } else {
                                setFromDeviceViewEntID('')
                                setToDeviceViewEntID(params.data.ToDeviceViewID ?? "")
                            }
                        }
                        setCableViewEntID(findCableViewId(params.context.Cabling as ICablingGridSection[], cableData))
                        setSelectedCableName(cableData?.CableName ?? "")
                    }
                    if (params.context.Cabling) {
                        makeHighlightCell(params.context.Cabling, PortID, "nz-from-selected")
                    }
                    addClassNamePulse(PortID, "nz-todevice-selected");
                    if (PortID) {
                        const devicea = scrollToClass("nz-coldef-from-device-column nz-from-selected")
                        if (!devicea) {
                            const deviceb = scrollToClass("nz-coldef-to-device-column nz-from-selected")
                            if (!deviceb) {
                                scrollToClass("nz-cable-columns nz-active-port")
                            }
                        }
                    } else {
                        scrollToClass("nz-cable-columns nz-active-port")
                    }
                } else {
                    // Unconnected to-port: show to-device view only.
                    if (params.data && params.data.ToDeviceViewID) {
                        setToDeviceViewEntID(params.data.ToDeviceViewID)
                        setFromDeviceViewEntID(null)

                        setCableViewEntID("")
                        setSelectedCableName("")
                    } else {
                        setFromDeviceViewEntID(null)
                        setToDeviceViewEntID(null)
                        setCableViewEntID(null)
                    }
                    scrollToClass("nz-cable-columns nz-active-port")

                }
            }
        } catch (error) {
            console.error("Error in FnHighlightConnectedPort:", error);
        }
    }
    // below make api call for connection between two ports 
    const FnMakeConnections = (dragNode: ICablingDragPortNode | null, nodeValue: string, portID: string | null) => {
        try {
            let dropNodeObj: ICablingDropNode | null = null;
            let isFromDevice = false;
            let objectData: any = null;
            let dropObjKey: string | null = null;
            // Match drop cell node-value to a row field to find from-port vs to-port target.
            if (tableData.length) {
                for (let index = 0; index < tableData.length; index++) {
                    const rowData = tableData[index].rowData;

                    let found = false;

                    for (const ele of rowData) {
                        for (const value of Object.keys(ele)) {
                            const str = (ele as Record<string, any>)[value];

                            if (str === nodeValue.trim()) {
                                dropObjKey = value;
                                objectData = ele;
                                found = true;
                                break;
                            }
                        }

                        if (found) break;
                    }

                    if (found) break;
                }
            }
            if (objectData) {
                // Build drop payload from matched row field (from-port vs to-port column).
                if (objectData && dropObjKey && dropObjKey === "FromDeviceCompositePortName") {
                    isFromDevice = true;
                    dropNodeObj = {
                        FromDeviceEntityName: objectData?.FromDeviceEntityName,
                        FromDeviceEntityID: objectData?.FromDeviceEntityID,
                        FromDeviceAssetID: objectData?.FromDeviceAssetID,
                        FromDevicePath: objectData?.FromDevicePath,
                        FromDeviceName: objectData?.FromDeviceName,
                        FromDeviceDescription: objectData?.FromDeviceDescription,
                        FromDeviceViewName: objectData?.FromDeviceViewName,
                        FromDevicePortID: objectData?.FromDevicePortID,
                        FromDeviceCompositePortName:
                            objectData?.FromDeviceCompositePortName,
                        FromDevicePortDesc: objectData?.FromDevicePortDesc,
                        FromDevicePortStatus: objectData?.FromDevicePortStatus ?
                            objectData?.FromDevicePortStatus : null,
                        FromDevicePortNodeType: objectData?.FromDevicePortNodeType,
                        FromDevicePortGender: objectData?.FromDevicePortGender,
                        FromDevicePortPortType: objectData?.FromDevicePortPortType ?? objectData?.FromDevicePortType ?? objectData?.PortType,
                    };
                } else if (objectData && dropObjKey === "ToDeviceCompositePortName") {
                    isFromDevice = false;
                    dropNodeObj = {
                        ToDeviceEntityName: objectData.ToDeviceEntityName,
                        ToDeviceEntityID: objectData.ToDeviceEntityID,
                        ToDeviceAssetID: objectData.ToDeviceAssetID,
                        ToDevicePath: objectData.ToDevicePath,
                        ToDeviceName: objectData.ToDeviceName,
                        ToDeviceDescription: objectData.ToDeviceDescription,
                        ToDeviceViewName: objectData.ToDeviceViewName,
                        ToDevicePortID: objectData.ToDevicePortID,
                        ToDeviceCompositePortName:
                            objectData.ToDeviceCompositePortName,
                        ToDevicePortDesc: objectData.ToDevicePortDesc,
                        ToDevicePortStatus: objectData.ToDevicePortStatus ? objectData.ToDevicePortStatus : null,
                        ToDevicePortNodeType: objectData.ToDevicePortNodeType,
                        ToDevicePortGender: objectData.ToDevicePortGender,
                        ToDevicePortPortType: objectData.ToDevicePortPortType ?? objectData.ToDevicePortType ?? objectData.PortType
                    };
                } else {
                    console.warn("Not drop on From-port or To-port")
                }
            }
            if (
                dropNodeObj &&
                ((dropNodeObj.FromDevicePortStatus !== undefined &&
                    (dropNodeObj.FromDevicePortStatus === null ||
                        dropNodeObj.FromDevicePortStatus === "" ||
                        dropNodeObj.FromDevicePortStatus?.toLowerCase() === "normal" ||
                        dropNodeObj.FromDevicePortStatus?.toLowerCase() === "available")) ||
                    (dropNodeObj.ToDevicePortStatus !== undefined &&
                        (dropNodeObj.ToDevicePortStatus === null ||
                            dropNodeObj.ToDevicePortStatus === "" ||
                            dropNodeObj.ToDevicePortStatus?.toLowerCase() === "normal" ||
                            dropNodeObj.ToDevicePortStatus?.toLowerCase() === "available")))
            ) {
                const isNetworkCabling =
                    props.featureId === FEnums.EditNetworkCabling ||
                    props.featureId === FEnums.ReviewNetworkCabling;
                // Network: a free from/to port is enough. Power: opposite gender still required.
                if (isNetworkCabling) {
                    const dragPortType = dragNode?.PortAPortType ?? dragNode?.PortBPortType;
                    const dropPortType = isFromDevice ? dropNodeObj.FromDevicePortPortType : dropNodeObj.ToDevicePortPortType;

                    if (!isPortTypeCompatible(dragPortType, dropPortType)) {
                        setCustomButtons(undefined);
                        setConfirmMessage(`Cannot connect ${dragPortType ? `${dragPortType} ` : ""}port to ${dropPortType ? `${dropPortType} ` : ""}port in network cabling.`);
                        setIsConfirmOpen(true);
                        return;
                    }

                    ApiCallAddUpdateConnection(
                        dropNodeObj,
                        portID ?? "",
                        isFromDevice,
                    );
                } else if (
                    dropNodeObj.FromDevicePortGender !== undefined &&
                    dragNode?.PortAGender !== undefined &&
                    dropNodeObj.FromDevicePortGender != dragNode.PortAGender
                ) {
                    ApiCallAddUpdateConnection(
                        dropNodeObj,
                        portID ?? "",
                        isFromDevice,
                    );
                } else if (
                    dropNodeObj.FromDevicePortGender !== undefined &&
                    dragNode?.PortBGender !== undefined &&
                    dropNodeObj.FromDevicePortGender != dragNode.PortBGender
                ) {
                    ApiCallAddUpdateConnection(
                        dropNodeObj,
                        portID ?? "",
                        isFromDevice,
                    );
                } else if (
                    dropNodeObj.ToDevicePortGender !== undefined &&
                    dragNode?.PortAGender !== undefined &&
                    dropNodeObj.ToDevicePortGender != dragNode.PortAGender
                ) {
                    ApiCallAddUpdateConnection(
                        dropNodeObj,
                        portID ?? "",
                        isFromDevice,
                    );
                } else if (
                    dropNodeObj.ToDevicePortGender !== undefined &&
                    dragNode?.PortBGender !== undefined &&
                    dropNodeObj.ToDevicePortGender != dragNode.PortBGender
                ) {
                    ApiCallAddUpdateConnection(
                        dropNodeObj,
                        portID ?? "",
                        isFromDevice,
                    );
                }
            }
        } catch (error) {
            console.error("Error in ApiCallAddUpdateConnection", error)
        }
    }
    // cable port have port status then we have to hightlight selected port
    const FnPortSelection = (colId: string, params: any) => {
        try {
            let PortEntityID: string | undefined;
            if (colId === "PortACompositeName") {

                PortEntityID = params.data.PortAEntityID;
                if (params.data.PortAStatus?.toLowerCase().includes("portid")) {
                    setCableViewEntID(findCableViewId(params.context?.Cabling ?? [], params.data))
                    let { PortID } = FnParseJsonSafely(params.data.PortAStatus);
                    if (PortID) {
                        addClassNamePulse(PortEntityID ?? "");
                        let Fromdata = findoutCableConnectedDevice(params.context.Cabling, PortID, "fromDevice")
                        let Todata = findoutCableConnectedDevice(params.context.Cabling, PortID, "toDevice")
                        if (Fromdata) {
                            scrollToClass("nz-coldef-from-device-column nz-active-port")
                            setFromDeviceViewEntID(Fromdata.FromDeviceViewID ?? "")
                        } else {
                            setFromDeviceViewEntID('')
                        }
                        if (Todata) {
                            scrollToClass("nz-coldef-to-device-column nz-active-port")
                            setToDeviceViewEntID(Todata.ToDeviceViewID ?? "")
                        } else {
                            setToDeviceViewEntID('')
                        }
                    } else {
                        setFromDeviceViewEntID('')
                        setToDeviceViewEntID('')
                    }
                } else {
                    setFromDeviceViewEntID(params.data.FromDeviceViewID)
                    setToDeviceViewEntID('')
                    setCableViewEntID(findCableViewId(params.context?.Cabling ?? [], params.data))
                }
            } else {
                if (params.data.PortBStatus?.toLowerCase().includes("portid")) {
                    setCableViewEntID(findCableViewId(params.context?.Cabling ?? [], params.data))
                    let { PortID } = FnParseJsonSafely(params.data.PortBStatus);
                    if (PortID) {
                        addClassNamePulse(params.data.PortBEntityID);
                        let Fromdata = findoutCableConnectedDevice(params.context.Cabling, PortID, "fromDevice")
                        let Todata = findoutCableConnectedDevice(params.context.Cabling, PortID, "toDevice")
                        if (Fromdata) {
                            scrollToClass("nz-coldef-from-device-column nz-active-port")
                            setFromDeviceViewEntID(Fromdata.FromDeviceViewID ?? "")
                        } else {
                            setFromDeviceViewEntID('')
                        }
                        if (Todata) {
                            scrollToClass("nz-coldef-to-device-column nz-active-port")
                            setToDeviceViewEntID(Todata.ToDeviceViewID ?? "")
                        } else {
                            setToDeviceViewEntID('')
                        }
                    } else {
                        setFromDeviceViewEntID('')
                        setToDeviceViewEntID('')
                    }
                } else {
                    setFromDeviceViewEntID(params.data.FromDeviceViewID)
                    setToDeviceViewEntID('')
                    setCableViewEntID(findCableViewId(params.context?.Cabling ?? [], params.data))
                }
            }
        } catch (error) {
            console.error("error in FnPortSelection", error)
        }
    }
    const FnGetPortDetails = (
        data: Record<string, any>,
        value: string,
        dataKeys: string[]
    ): { cellPortStatus: string; portID: string | null } => {
        let cellPortStatus = "";
        let portID: string | null = null;

        dataKeys?.forEach((key) => {
            if (data && data[key] === value) {
                if (key === "PortACompositeName") {
                    cellPortStatus = String(data.PortAStatus ?? "");
                    portID = data.PortAEntityID ?? "";
                }

                if (key === "PortBCompositeName") {
                    cellPortStatus = String(data.PortBStatus ?? "");
                    portID = data.PortBEntityID ?? "";
                }
            }
        });

        return { cellPortStatus, portID };
    };

    const FnMakePortDraggable = (
        domElement: HTMLElement | null,
        cellPortStatus: string
    ) => {
        const isPortAvailable =
            cellPortStatus === "" ||
            ["normal", "available"].includes(cellPortStatus?.toLowerCase());

        if (
            domElement &&
            domElement.className.includes("ag-cell") &&
            isPortAvailable
        ) {
            domElement.setAttribute("id", "drag-div");
            domElement.classList.add("cell-draggable");
            domElement.setAttribute("draggable", "true");
        }
    };
    const FnGetDragNodeAndUpdateSession = (params: any): ICablingDragPortNode | null => {
        try {
            let dragNode: ICablingDragPortNode | null = null;
            let data: string[] = params.data && (Object.keys(params.data) ?? []);
            data.forEach((key: string) => {
                if (params.data && key && params.data[key] == params.value) {
                    if (key == "PortACompositeName" && params.data) {
                        dragNode = {
                            PortAViewName: params.data.PortAViewName,
                            PortAEntityID: params.data.PortAEntityID,
                            PortACompositeName: params.data.PortACompositeName,
                            PortAStatus: params.data.PortAStatus ?? "",
                            PortADesc: params.data.PortADesc,
                            PortAGender: params.data.PortAGender,
                            PortANodeType: params.data.PortANodeType,
                            PortAPortType: params.data.PortAPortType ?? params.data.PortAType ?? params.data.PortType,
                        };
                    } else if (key == "PortBCompositeName" && params.data) {
                        dragNode = {
                            PortBStatus: params.data.PortBStatus ?? "",
                            PortBCompositeName: params.data.PortBCompositeName,
                            PortBDesc: params.data.PortBDesc,
                            PortBEntityID: params.data.PortBEntityID ?? "",
                            PortBViewName: params.data.PortBViewName,
                            PortBGender: params.data.PortBGender,
                            PortBNodeType: params.data.PortBNodeType,
                            PortBPortType: params.data.PortBPortType ?? params.data.PortBType ?? params.data.PortType,
                        };
                    }
                    // Persist selected device entity in session for port-picker context.
                    if (key == "FromDeviceCompositePortName") {
                        callApiToUpdateSession([
                            {
                                VariableContext: "SelectedPortNode",
                                VariableName: "PortContainedByEntityName",
                                SessionValue: params.data?.FromDeviceEntityName ?? "",
                            },
                        ]);
                    } else if (key == "ToDevicePortStatus") {
                        callApiToUpdateSession([
                            {
                                VariableContext: "SelectedPortNode",
                                VariableName: "PortContainedByEntityName",
                                SessionValue: params.data?.ToDeviceEntityName ? params.data.ToDeviceEntityName : '',
                            },
                        ]);
                    }
                }
            });
            return dragNode;
        } catch (error) {
            console.error("Error in getDragNodeAndUpdateSession", error)
            return null;
        }
    }
    // below function to remove drag listeners
    const removeCablingDragListeners = (element: HTMLElement | null | undefined) => {
        try {
            if (!element) {
                return;
            }
            const stored = (element as HTMLElement & { _cablingDragHandlers?: CablingDragHandlers })._cablingDragHandlers;
            if (!stored) {
                return;
            }
            element.removeEventListener("dragstart", stored.handleDragStart);
            element.removeEventListener("drag", stored.handleDrag);
            element.removeEventListener("dragend", stored.handleDragEnd);
            delete (element as HTMLElement & { _cablingDragHandlers?: CablingDragHandlers })._cablingDragHandlers;
            delete (element as HTMLElement & { _listenersAdded?: boolean })._listenersAdded;
        } catch (error) {
            console.error("Error in removeCablingDragListeners", error)
        }
    };

    // Cell click: updates device/cable previews, selection highlight, and port drag-and-drop wiring.
    const onCellClicked = (params: any, gridRef: unknown, tableIndex: number) => {
        try {
            // DOM cell element used for native HTML5 drag (eventPath index is ag-Grid cell wrapper).
            let el = params.event?.target;
            while (el && !el.classList.contains('ag-cell-wrapper')) {
                el = el.parentElement;
            }

            let DomData = el;
            var nodeValue = ""
            // Port-related columns that drive views, highlights, and drag-and-drop.
            let colids = ["FromDeviceCompositePortName", "PortACompositeName", "PortBCompositeName", "ToDeviceCompositePortName"];
            // Mouse-down on a non-port cell: clear device/cable previews.
            if (!colids.includes(params.column.colId) && (params.type && params.type == "cellMouseDown")) {
                setFromDeviceViewEntID('')
                setCableViewEntID('')
                setToDeviceViewEntID('')
                return;
            }

            if (params) {
                // Remember which grid section and row the user clicked (used by add-cable, etc.).
                const selectedObj: { tableIndex: number, rowIndex: number } = {
                    tableIndex: tableIndex,
                    rowIndex: params.rowIndex ?? 0
                }
                setSelectedRowObj({ ...selectedObj })
                // Resolve which port (cable A/B or device) was clicked from row field values.
                let dragNode: ICablingDragPortNode | null = FnGetDragNodeAndUpdateSession(params);

                const colId = params?.colDef?.field;
                // Reset prior cell highlight classes before applying new selection styling.
                if (colId) {
                    removeAllMatchingClass("nz-active-port");
                    removeAllMatchingClass('nz-from-selected')
                    removeAllMatchingClass('nz-todevice-selected')
                }
                // set the FromDeviceViewEntID for preview fromdevice
                if (params.data && params.data.FromDeviceViewID) {
                    setFromDeviceViewEntID(params.data.FromDeviceViewID)
                }
                let dragged: Record<string, any> | undefined;

                //  Cable port column (Port A / Port B): preview connected devices + enable drag 
                if (colId === "PortACompositeName" || colId === "PortBCompositeName") {
                    // cable port have port status then we have to hightlight selected port
                    FnPortSelection(colId, params)

                    // Allow drag only when cable port status is empty, Normal, or Available.                
                    var statusOfDrag = false
                    const dataKeys = params.data && Object.keys(params.data) as (keyof ICablingGridRow)[];
                    // get clieck port details
                    const { cellPortStatus, portID } = FnGetPortDetails(
                        params.data,
                        params.value,
                        dataKeys
                    );
                    FnMakePortDraggable(DomData, cellPortStatus);

                    // Horizontal scroll container while dragging across wide port rows.
                    let slider = document.querySelector(
                        ".nz-dropzone .ag-center-cols-viewport"
                    ) as HTMLElement | null;
                    let startX: number = 0;

                    const handleDragStart = (event: any) => {
                        if (props.isReadOnly === false) {
                            const target = event.target;
                            if (target) {
                                dragged = target;
                                target.classList.add("dragging");
                                startX = event.clientX - dragged?.getBoundingClientRect().left;
                            }
                        }
                    };
                    // Tracks the current valid drop cell (for dragover cleanup on dragend).
                    let overDropDiv: HTMLElement | null = null;
                    const clearDropTarget = () => {
                        if (overDropDiv) {
                            overDropDiv.style.cursor = "default";
                            overDropDiv.removeEventListener("dragover", handleDragOver);
                            overDropDiv = null;
                        }
                    };
                    const setDropTarget = (target: HTMLElement) => {
                        if (overDropDiv === target) {
                            return;
                        }
                        clearDropTarget();
                        target.style.cursor = "copy";
                        target.addEventListener("dragover", handleDragOver);
                        overDropDiv = target;
                    };
                    const FnAddCablingDragListeners = (element: HTMLElement) => {
                        removeCablingDragListeners(element);
                        const handlers: CablingDragHandlers = { handleDragStart, handleDrag, handleDragEnd };
                        (element as HTMLElement & { _cablingDragHandlers?: CablingDragHandlers })._cablingDragHandlers = handlers;
                        element.addEventListener("dragstart", handleDragStart);
                        element.addEventListener("drag", handleDrag);
                        element.addEventListener("dragend", handleDragEnd);
                        (element as HTMLElement & { _listenersAdded?: boolean })._listenersAdded = true;
                    };

                    // below are javasript event handlers for drag port and drop on port.
                    const handleDragOver = (event: DragEvent) => {
                        event.preventDefault();
                    };
                    const handleDrag = (event: DragEvent) => {
                        if (dragged && slider) {
                            const rect = slider.getBoundingClientRect();
                            const clientX: number = event.clientX;
                            const clientY: number = event.clientY;
                            const x = clientX - rect.left - startX;
                            const deltaX = x - startX;
                            // Element under cursor while dragging (may be a valid from/to port cell).
                            const DropDiv = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
                            if (!DropDiv) {
                                return;
                            }
                            const attrib = DropDiv.getAttribute("allow-drop");
                            const portGender = DropDiv.getAttribute("port-gender");
                            const portType = DropDiv.getAttribute("port-type");
                            nodeValue = DropDiv.getAttribute('node-value') ?? ""
                            const dragPortGender = dragNode?.PortAGender
                                ? dragNode.PortAGender
                                : dragNode?.PortBGender;
                            const dragPortType = dragNode?.PortAPortType != null
                                ? dragNode.PortAPortType
                                : dragNode?.PortBPortType;

                            if (String(attrib) === "true") {
                                const isNetworkCabling =
                                    props.featureId === FEnums.EditNetworkCabling ||
                                    props.featureId === FEnums.ReviewNetworkCabling;
                                const gendersDiffer =
                                    portGender != null &&
                                    portGender?.toLowerCase() != dragPortGender?.toLowerCase();
                                const portTypesCompatible = !isNetworkCabling || isPortTypeCompatible(dragPortType, portType);
                                // Network: free port is enough and compatible port type (copper/fiber). Power: free port and opposite gender.
                                if ((isNetworkCabling && portTypesCompatible) || (!isNetworkCabling && gendersDiffer)) {
                                    if (props.featureId === FEnums.EditPowerCabling || props.featureId === FEnums.EditNetworkCabling) {
                                        if (statusOfDrag) {
                                            if (overDropDiv === DropDiv) {
                                                clearDropTarget();
                                            } else {
                                                DropDiv.style.cursor = "default";
                                                DropDiv.removeEventListener("dragover", handleDragOver);
                                            }
                                        } else {
                                            setDropTarget(DropDiv);
                                        }
                                    } else {
                                        setDropTarget(DropDiv);
                                    }
                                } else {
                                    if (overDropDiv === DropDiv) {
                                        clearDropTarget();
                                    } else {
                                        DropDiv.style.cursor = "default";
                                        DropDiv.removeEventListener("dragover", handleDragOver);
                                    }
                                }
                            } else {
                                if (overDropDiv === DropDiv) {
                                    clearDropTarget();
                                }
                            }
                            // Determine the direction based on the change in X position
                            const direction = deltaX < 0 ? "left" : "right";
                            // Set the scroll direction explicitly
                            const scrollDistance =
                                Math.abs(x) * (direction == "left" ? 0.5 : 0.005);
                            // Scroll the slider
                            if (direction === "left") {
                                slider.scrollLeft -= scrollDistance;
                            } else {
                                slider.scrollLeft += scrollDistance;
                            }
                        }
                    };
                    const handleDragEnd = async (event: DragEvent) => {
                        // Drag blocked 
                        if (statusOfDrag) {
                            clearDropTarget();
                            removeCablingDragListeners(DomData);
                            return null
                        }
                        clearDropTarget();
                        removeCablingDragListeners(DomData);
                        if (slider)
                            slider.dataset.dragging = 'false';
                        event.dataTransfer && (event.dataTransfer.dropEffect = "move");
                        const x = event.clientX;
                        const y = event.clientY;
                        const dropTarget = document.elementFromPoint(x, y) as HTMLElement | null;
                        if (dropTarget) {
                            nodeValue = dropTarget.getAttribute('node-value') ?? ""
                            // Connect when the drop port is free. Power also requires opposite gender.
                            FnMakeConnections(dragNode, nodeValue, portID);

                        }
                        // Reset drag styling on source cell after drop completes.
                        DomData?.classList.add("dropped");
                        DomData?.classList.remove("dragging");
                        DomData = null;
                    };

                    // Register drag listeners on cable cell (remove prior handlers on same node first).
                    if (DomData) {
                        FnAddCablingDragListeners(DomData);
                    }
                } else {
                    // Not a cable cell: clear cable drag listeners from prior cable cells (if any).
                    FnHighlightConnectedPort(colId, params)
                    // Device port cells are not cable-drag sources; clear cable drag listeners from prior cable cells.
                    document.querySelectorAll("#drag-div").forEach((node) => {
                        removeCablingDragListeners(node as HTMLElement);
                    });
                    DomData?.removeAttribute("id");
                }
                const { colDef } = params;
                getNextColumnId(colDef);
            } else {
                console.error("Error in onCellClicked: params is undefined");
            }
        } catch (error) {
            console.error("Error in onCellClicked:", error);
        }
    };
    const isApiCallInProgressRef = useRef(false);

    // Persists a cable-to-device connection after drag-and-drop onto a valid port cell.
    const ApiCallAddUpdateConnection = async (
        dropNodeObj: ICablingDropNode,
        portID: string,
        isFromDevice: boolean,
    ) => {
        if (isApiCallInProgressRef.current) return;
        isApiCallInProgressRef.current = true;
        let devicePortId = null;

        let dropPortName = ''
        if (dropNodeObj?.FromDevicePortID) {
            devicePortId = dropNodeObj.FromDevicePortID;
            dropPortName = dropNodeObj.FromDeviceCompositePortName ?? ""
        }
        if (dropNodeObj?.ToDevicePortID) {
            devicePortId = dropNodeObj?.ToDevicePortID;
            dropPortName = dropNodeObj?.ToDeviceCompositePortName ?? ""
        }
        const handleAddUpdateConnection = (_resp: unknown, status?: string) => {
            if (status === '200') {

                let dragPortName = ''
                const updatedTableData = tableData.map((row: ICablingGridSection) => {
                    const updatedRowData = row.rowData.map((item: ICablingGridRow) => {
                        const newItem = { ...item };

                        if (isFromDevice) {
                            if (newItem.FromDevicePortID === dropNodeObj.FromDevicePortID) {
                                newItem.FromDevicePortStatus = JSON.stringify({ PortID: portID });
                            }
                        } else {
                            if (newItem.ToDevicePortID === dropNodeObj.ToDevicePortID) {
                                newItem.ToDevicePortStatus = JSON.stringify({ PortID: portID });
                            }
                        }

                        if (newItem.PortAEntityID === portID) {
                            dragPortName = newItem.PortACompositeName ?? ""
                            newItem.PortAStatus = JSON.stringify({ PortID: portID });
                        } else if (newItem.PortBEntityID === portID) {
                            dragPortName = newItem.PortBCompositeName ?? ""
                            newItem.PortBStatus = JSON.stringify({ PortID: portID });
                        }

                        return newItem;
                    });

                    return {
                        ...row,
                        rowData: updatedRowData
                    };
                });
                if (dropPortName && dragPortName) {
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Cabling,
                        SubGroupName: LogSubGroupName.Cabling,
                        LogName: LogName.CreateConnection,
                        actionObject: {
                            Feature: props.featureId === FEnums.EditPowerCabling ? "Edit Power Cabling" : "Edit Network Cabling",
                            dragPortName: dragPortName,
                            dropPortName: dropPortName
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload)
                }
                setTableData(updatedTableData)
                props.handleCatchTableData(updatedTableData)
            }
            isApiCallInProgressRef.current = false;
        }
        await axiosInterceptor({
            url: CABLING.AddUpdateConnection,
            data: {
                cablePortID: portID,
                devicePortID: devicePortId,
                forceConnect: false,
            },
            allowShowLoader: true,
            setFetchData: handleAddUpdateConnection
        }, statusBarContext)
    };
    // blow function to get cable with full detials 
    const getCablingWithPortApiCall = async (cablesWithPort: ICablingCablesWithPortRequest): Promise<ICablingGridRow[] | null> => {
        return new Promise((resolve, reject) => {
            const handleGetCablesWithPort = async (response: unknown, status?: string) => {
                try {
                    if (status === '200' && response && typeof response === "object" && 'cablePortsJson' in response) {
                        const jsonData = FnParseJsonSafely((response as { cablePortsJson: string }).cablePortsJson) as { Cables?: ICablingGridRow[] };
                        const cables = jsonData?.Cables?.map((c: any) => ({
                            ...c,
                            PortAPortType: c.PortAPortType ?? c.PortAType ?? c.PortType,
                            PortBPortType: c.PortBPortType ?? c.PortBType ?? c.PortType,
                        }));
                        resolve(cables ?? null);
                    } else {
                        resolve(null);  // or reject if needed
                    }
                } catch (error) {
                    reject(error);
                }
            };

            axiosInterceptor({
                url: CABLING.GetCablesWithPort,
                data: cablesWithPort,
                allowShowLoader: true,
                setFetchData: handleGetCablesWithPort
            }, statusBarContext);
        });
    };
    //below function to clone cable
    const cloneCable = async (data: ICablingCloneCableRequest): Promise<ICablingCloneCableResponse | null> => {
        return new Promise((resolve) => {
            const handleCloneCable = (response: unknown, status?: string) => {
                if (status === '200' && response && typeof response === "object" && 'clonedCableID' in response) {
                    resolve(response as ICablingCloneCableResponse);
                } else {
                    resolve(null);
                }
            };

            axiosInterceptor({
                url: CABLING.CloneCable,
                data: data,
                allowShowLoader: true,
                setFetchData: handleCloneCable,
            }, statusBarContext);
        });
    };

    // Assign selected combo cable to the active row; clones generic cables when required.
    const handleAddCable = async () => {
        try {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            if (!selectedRowObj) {
                setConfirmMessage("Please select row on table.")
                setIsConfirmOpen(true)
            } else {
                let standardCloneId: string | null = null;
                let selectedCable: ICablingCableComboItem | undefined = cableComboApiData?.find((item) => item.cableID == activeCableCombo);
                var cables: ICablingGridRow[] | null = null;
                let cablesWithPort = {
                    cableIDList: [activeCableCombo],
                    isPower: props.featureId === FEnums.ReviewPowerCabling || props.featureId === FEnums.EditPowerCabling ? true : false
                };
                let cloneCableData: ICablingCloneCableResponse | null = null;
                cables = await getCablingWithPortApiCall(cablesWithPort);
                let isAllredayAdded = false
                if (cables && Array.isArray(cables) && cables.length > 0) {

                    let checkSelectedCableCell = false
                    tableData.forEach((element: ICablingGridSection, tableIndex: number) => {
                        if (!element.rowData) return element;
                        element.rowData.forEach((row: ICablingGridRow, index: number) => {
                            let updatedRow = { ...row }; // avoid mutating original row
                            if (updatedRow.CableName) {
                                if (Array.isArray(cables) && updatedRow.CableName === cables[0].CableName) {
                                    if (cables[0].CableName.includes('Generic') !== true || cables[0].CableName.includes('~') === true) {
                                        isAllredayAdded = true
                                    }
                                }
                                if (tableIndex === selectedRowObj.tableIndex && index === selectedRowObj.rowIndex && updatedRow.CableName) {
                                    checkSelectedCableCell = true
                                }
                            }

                        });
                    });
                    if (isAllredayAdded) {
                        // as par new requirement i have disable this code
                    } else if (checkSelectedCableCell) {
                        setConfirmMessage("Cable is already available on selected row,please try with other row.")
                        setIsConfirmOpen(true)
                        return;
                    }
                }
                // if client chagne requiment do not add cable if alreday added in grid then remove IsAllRedadyAdded condition
                if ((cables?.length && cables[0].CableName && !cables[0].CableName.includes('~')) || isAllredayAdded) {
                    if (selectedCable && selectedCable.cableID) {
                        cloneCableData = await cloneCable({ cableID: selectedCable?.cableID });
                        standardCloneId = cloneCableData?.clonedCableID ?? "";
                        let cablesWithPortObj = {
                            cableIDList: [standardCloneId ? standardCloneId : activeCableCombo],
                            isPower: props.featureId === FEnums.ReviewPowerCabling || props.featureId === FEnums.EditPowerCabling ? true : false
                        };
                        cables = await getCablingWithPortApiCall(cablesWithPortObj);
                        makeApiCallComboCabling();
                    }

                }
                if (cables && cables.length && cables[0].PortACableViewID) {
                    setCableViewEntID(cables[0].PortACableViewID)
                } else {
                    setCableViewEntID(null)
                }
                let addedCable: string[] = [];
                let cablingDataObj: ICablingGridRow[] = [];

                if (tableData.length && selectedRowObj) {

                    const cloneTabeData = [...tableData]
                    const Rowdata = tableData.filter((item: ICablingGridSection, index: number) => { return index === selectedRowObj.tableIndex })
                    if (Rowdata.length > 0) {
                        let newRowIndex = selectedRowObj.rowIndex
                        Rowdata[0].rowData.forEach((cablingItem: ICablingGridRow, index: number) => {
                            let cable = cables?.filter((item: ICablingGridRow) => {
                                return !addedCable.includes((item.PortAEntityID ?? '') + (item.PortBEntityID ?? ''));
                            });
                            if (index === newRowIndex) {
                                if (!cablingItem.CableName && cable?.length && cable[0]) {
                                    addedCable.push((cable[0].PortAEntityID ?? '') + (cable[0].PortBEntityID ?? ''));
                                    cablingDataObj.push({ ...cablingItem, ...cable[0] });
                                    newRowIndex++;
                                } else if (cablingItem.CableName) {
                                    cablingDataObj.push({ ...cablingItem });
                                    newRowIndex++;
                                } else {
                                    cablingDataObj.push({ ...cablingItem });
                                }
                            } else {
                                cablingDataObj.push({ ...cablingItem });
                            }
                        });
                    }
                    let notAddcables = cables?.filter((item: ICablingGridRow) => {
                        return !addedCable.includes((item.PortAEntityID ?? '') + (item.PortBEntityID ?? ''));
                    });
                    if (notAddcables && notAddcables?.length > 0) {
                        notAddcables.forEach((element: ICablingGridRow) => {
                            cablingDataObj.push(element);
                        });
                    }

                    const tableObj: ICablingGridSection[] = []
                    cloneTabeData.map((item: ICablingGridSection, index: number) => {
                        if (index === selectedRowObj.tableIndex) {
                            item.rowData = cablingDataObj
                        }
                        tableObj.push(item)
                    })
                    setTableData([...tableObj]);
                    props.handleCatchTableData(tableObj)
                    setSelectedRowObj(null)

                }
                let cableUsedState: ICablingCableComboItem[] = [];
                cableComboUsed?.map((items: ICablingCableComboItem) => {
                    if (items?.cableID === activeCableCombo) {
                        if (
                            items?.cableName?.includes("Standard") ||
                            items?.cableName?.includes("Generic")
                        ) {
                            items.isUsed = 0;
                        } else {
                            items.isUsed = 1;
                        }
                        cableUsedState.push(items);
                    } else {
                        cableUsedState.push(items);
                    }
                });


                if (cables && cables.length > 0 && selectedCable && cloneCableData) {
                    const newCableData: ICablingCableComboItem = {
                        assetID: selectedCable.assetID,
                        cableColor: selectedCable.cableColor,
                        cableID: standardCloneId ?? undefined,
                        cableLength: selectedCable.cableLength,
                        cableName: cables[0].CableName,
                        cableWidth: selectedCable.cableWidth,
                        customCable: selectedCable.customCable,
                        entityName: cables[0].CableEntityName,
                        isUsed: 0,
                    };
                    cableUsedState.push(newCableData);
                }
                setCableComboUsed([...cableUsedState]);
                if (cables && cables[0].CableName && !cables[0].CableName.includes('Generic') && cables[0].CableName.includes('~')) {
                    timeoutRef.current = setTimeout(() => {
                        if (cables && cables.length > 0 && standardCloneId) {
                            setActiveCableCombo(standardCloneId);
                        } else {
                            setActiveCableCombo(null);
                        }
                    }, 200);
                }
                if (Array.isArray(cables) && cables.length && cables[0].CableName && !cables[0].CableName.includes('Generic') && cables[0].CableName.includes('~')) {
                    setActiveCableCombo(null)
                }
            }
        } catch (error) {
            console.error("Error while adding cable in cabling grid", error)
        }
    };

    function handleMouseEvent(event: CellClickedEvent<ICablingGridRow> | RowClickedEvent<ICablingGridRow> | CellMouseDownEvent<ICablingGridRow>, _gridRef: unknown, tableIndex: number): void {
        if (event) {

            const selectedObj: { tableIndex: number, rowIndex: number } = {
                tableIndex: tableIndex,
                rowIndex: event.rowIndex ? event.rowIndex : 0
            }
            setSelectedRowObj({ ...selectedObj })
            // Step 1: Get the grid container (ag-root) of the clicked row
            const clickedRowElement = (event.event?.target as HTMLElement)?.closest('.ag-row');
            const currentGridElement = clickedRowElement?.closest('.ag-root');

            // Step 2: Loop through all grids
            document.querySelectorAll('.ag-root').forEach(grid => {
                const header = grid.querySelector('.ag-header');

                if (grid !== currentGridElement) {
                    // Remove focus from other grids
                    grid.querySelectorAll('.ag-row.ag-row-focus').forEach(row => {
                        row.classList.remove('ag-row-focus');
                    });

                    grid.querySelectorAll('.ag-row.ag-row-selected').forEach(row => {
                        row.classList.remove('ag-row-selected');
                    });
                    // Remove header highlight
                    if (header) header.classList.remove('nz-highlight-header');
                } else {
                    // Add highlight to current grid header
                    if (header) header.classList.add('nz-highlight-header');
                }
            });

        }
    }
    /**
 * Re-calls the cabling API and rebuilds the entire cabling grid data and column definitions.
 *
 * @param refreshCombo Whether to refresh the cable dropdown combo list (default: true)
 * @param isDeleteCableConnection Flag if refreshing after a cable connection deletion
 */
    const refreshCablingGrid = useCallback(async (refreshCombo: boolean = true, isDeleteCableConnection?: boolean) => {
        try {
            // 1. Reset current grid state
            setTableData([]);
            setColdef([]);
            setCableViewEntID(null);

            // 2. Fetch fresh cabling data via API
            const cablingData = await makeCablingApiCall(refreshCombo, isDeleteCableConnection);
            if (!cablingData || !Array.isArray(cablingData) || cablingData.length === 0) {
                setTableData([]);
                props.handleCatchTableData?.([]);
                return;
            }

            // 3. Extract From Device fields and pass to parent
            const fromData = getOnlyFromDeviceFields(cablingData);
            props.handleCatchFromData?.(fromData);

            // 4. Extract unique To Device names and Cables
            const toDevice = getUniqueToDeviceData(cablingData);
            const cables = getUniqueCableData(cablingData);
            const groupObject: ICablingGridSection[] = [];

            // 5. Build grid sections
            if (toDevice.length > 0) {
                for (let index = 0; index < toDevice.length; index++) {
                    const element = toDevice[index];
                    const toDeviceData = [];

                    for (let i = 0; i < cablingData.length; i++) {
                        const device = cablingData[i];
                        if (device.ToDeviceName === element) {
                            toDeviceData.push({
                                ToDeviceEntityName: device.ToDeviceEntityName,
                                ToDeviceEntityID: device.ToDeviceEntityID,
                                ToDeviceAssetID: device.ToDeviceAssetID,
                                ToDevicePath: device.ToDevicePath,
                                ToDeviceName: device.ToDeviceName,
                                ToDeviceDescription: device.ToDeviceDescription,
                                ToDeviceViewName: device.ToDeviceViewName,
                                ToDeviceViewID: device.ToDeviceViewID,
                                ToDevicePortID: device.ToDevicePortID,
                                ToDeviceCompositePortName: device.ToDeviceCompositePortName,
                                ToDevicePortDesc: device.ToDevicePortDesc,
                                ToDevicePortStatus: device.ToDevicePortStatus,
                                ToDevicePortGender: device.ToDevicePortGender,
                                ToDevicePortNodeType: device.ToDevicePortNodeType,
                                ToDevicePortPortType: device.ToDevicePortPortType
                            });
                        }
                    }

                    toDeviceData.sort((a, b) => {
                        const aView = a.ToDeviceViewName ?? "";
                        const bView = b.ToDeviceViewName ?? "";
                        const viewCompare = aView.localeCompare(bView, undefined, { sensitivity: "base" });
                        if (viewCompare !== 0) return viewCompare;
                        return FnConvertCellName(a.ToDeviceCompositePortName ?? "").localeCompare(
                            FnConvertCellName(b.ToDeviceCompositePortName ?? ""),
                            undefined,
                            { numeric: true, sensitivity: "base" }
                        );
                    });

                    const lengths = {
                        fromData: fromData.length,
                        toDeviceData: toDeviceData.length,
                        cables: index === 0 ? cables.length : 0
                    };

                    const maxKey = (Object.keys(lengths) as (keyof typeof lengths)[])
                        .reduce((a, b) => (lengths[a] > lengths[b] ? a : b));

                    const maxVal = lengths[maxKey];
                    const rows = [];
                    for (let j = 0; j < maxVal; j++) {
                        if (index === 0) {
                            rows.push({
                                ...(fromData[j] ?? {}),
                                ...(cables[j] ?? {}),
                                ...(toDeviceData[j] ?? {}),
                                tableIndex: index
                            });
                        } else {
                            rows.push({
                                ...(fromData[j] ?? {}),
                                ...(toDeviceData[j] ?? {}),
                                tableIndex: index
                            });
                        }
                    }

                    const column = await getColDef(fromData[0]?.FromDeviceName, element);
                    groupObject.push({ columnDefs: FnDeepClone(column), rowData: rows });
                }

                setTableData(groupObject);
                makeDefultSelectionOfView(groupObject);
                props.handleCatchTableData?.(groupObject);
            } else {
                const lengths = {
                    fromData: fromData.length,
                    cables: cables.length
                };
                const maxKey = (Object.keys(lengths) as (keyof typeof lengths)[])
                    .reduce((a, b) => (lengths[a] > lengths[b] ? a : b));

                const maxVal = lengths[maxKey];
                const rows = [];
                for (let j = 0; j < maxVal; j++) {
                    rows.push({
                        ...(fromData[j] ?? {}),
                        ...(cables[j] ?? {}),
                    });
                }

                const column = fromData.length ? await getColDef(fromData[0]?.FromDeviceName, 'To Device') : [];
                groupObject.push({ columnDefs: FnDeepClone(column), rowData: FnDeepClone(rows) });

                setTableData([...groupObject] as ICablingGridSection[]);
                makeDefultSelectionOfView(groupObject as ICablingGridSection[]);
                props.handleCatchTableData?.(groupObject);
            }

            // 6. Reset selected row pointer
            if (groupObject && groupObject.length > 0) {
                setSelectedRowObj({ tableIndex: groupObject.length - 1, rowIndex: 0 });
            }
        } catch (error) {
            console.error("Error refreshing cabling grid:", error);
        }
    }, [
        props.checkedNodes,
        props.selectedNodeInfo,
        props.handleCatchFromData,
        props.handleCatchTableData,
        makeCablingApiCall,
        getOnlyFromDeviceFields,
        getUniqueToDeviceData,
        getUniqueCableData,
        getColDef,
        makeDefultSelectionOfView
    ]);
    const handleSelectWorkorder = async (workorderId: string) => {
        setShowSelectWorkorder(false)
        const findWorkOrder = workorderRecords && Array.isArray(workorderRecords) && workorderRecords.find(x => x._Workorder === workorderId);
        if (createWorkOrderPayload) {
            function getWorkorderProfileName(data: { workorderProfile?: { _WorkorderProfile?: string }[] }): string | null {
                return data?.workorderProfile?.[0]?._WorkorderProfile ?? null;
            }
            const payload: IFnCreateWorkOrderApiCall = { ...createWorkOrderPayload, _WorkOrderProfile: findWorkOrder ? [findWorkOrder] : undefined }
            const result = await FnCreateWorkOrderApiCalls(payload)

            if (result) {
                if (mainAppContext.autoExecuteWorkorder) {
                    const actions: IDialogActionBtn[] = [
                        {
                            label: "No",
                            onClick: () => {
                                setIsConfirmOpen(false)
                                setConfirmMessage("");
                                setCustomButtons(undefined);
                            }
                        },
                        {
                            label: "Yes",
                            onClick: async () => {
                                // Call the API to auto execute the workorder 
                                await FnAutoExecuteWorkOrder(getWorkorderProfileName(result) ?? "", statusBarContext);
                                setIsConfirmOpen(false)
                                setConfirmMessage("");
                                setCustomButtons(undefined);
                                await refreshCablingGrid(true);
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
                    setCreateWorkOrderPayload(undefined);
                    setShowSelectWorkorder(false);
                    setIsConfirmOpen(true);
                } else {
                    setCustomButtons(undefined);
                    setConfirmMessage(`Workorder (${getWorkorderProfileName(result)}) is ${workorderId ? "append" : "created"} successfully.`);
                    setCreateWorkOrderPayload(undefined);
                    setShowSelectWorkorder(false);
                    setIsConfirmOpen(true);
                }
            }
        }
    }
    // when user click on copy button then we are created data then it copy.
    function handleDownloadData(item: ICablingGridSection, index: number): void {
        const rowData: ICablingGridRow[] = item?.rowData || [];
        try {
            if (rowData && rowData?.length > 0) {
                const columnDefs = item?.columnDefs || [];

                const fromHeader = columnDefs?.[0]?.headerName || "Device";
                const toHeader = columnDefs?.[4]?.headerName || "ToDevice";

                function getLastWord(input: string): string {
                    const parts = input.trim().split(/\s+/);
                    return parts[parts.length - 1] || "";
                }
                const extractPortId = (status: string | ICablingPortStatusJson | null | undefined): string | null => {
                    try {
                        if (!status) return null;
                        if (typeof status === "string") {
                            const parsed = FnParseJsonSafely(status);
                            return parsed?.PortID || null;
                        }
                        return status?.PortID || null;
                    } catch {
                        return null;
                    }
                };

                const getView = (val: string) => {
                    if (!val) return "";
                    return val.includes("(R)") ? "Rear" : "Front";
                };

                //  Only cable rows
                let cableRows: ICablingGridRow[] = []
                for (const element of tableData) {
                    const found = element.rowData.filter(
                        (r: ICablingGridRow) => r.CableName && r.PortAEntityID && r.PortBEntityID
                    );
                    cableRows.push(...cableRows, ...found)
                }

                const result = rowData
                    .filter((r: ICablingGridRow) => r.FromDeviceCompositePortName)
                    .map((row: ICablingGridRow) => {
                        const fromPortFull = row.FromDeviceCompositePortName;
                        const fromPortId = extractPortId(row.FromDevicePortStatus);
                        let otherEndConnectPort: ICablingGridRow | null = null
                        const base: Record<string, any> = {
                            [fromHeader]: {
                                port: FnConvertCellName(fromPortFull ?? ""),
                                FromDevicePortStatus: row.FromDevicePortStatus
                            }
                        };

                        if (!fromPortId) return base;

                        // FIX: Match with EntityID (NOT status)
                        const cableRow = cableRows.find((c: ICablingGridRow) => {
                            return (
                                c.PortAEntityID?.toLowerCase() === fromPortId.toLowerCase() ||
                                c.PortBEntityID?.toLowerCase() === fromPortId.toLowerCase()
                            );
                        });

                        if (!cableRow) return base;

                        const isA = cableRow.PortAEntityID?.toLowerCase() === fromPortId.toLowerCase();
                        const isB = cableRow.PortBEntityID?.toLowerCase() === fromPortId.toLowerCase();

                        if (isA || isB) {
                            for (const element of tableData) {
                                const found = element.rowData.find((d: ICablingGridRow) => {
                                    if (isA && cableRow.PortBEntityID === extractPortId(d.ToDevicePortStatus)) {
                                        return true;
                                    }
                                    if (isB && cableRow.PortAEntityID === extractPortId(d.ToDevicePortStatus)) {
                                        return true;
                                    }
                                    return false;
                                });

                                if (found) {
                                    otherEndConnectPort = found;
                                    break; //  breaks outer loop
                                }
                            }

                        }

                        const connectedPort = isA
                            ? cableRow.PortACompositeName
                            : cableRow.PortBCompositeName;
                        const connectPortName = isA ?
                            `${cableRow.PortAGender ? `${cableRow.PortAGender + " " + getLastWord(cableRow?.PortACompositeName ?? "")}` : ""}`
                            : `${cableRow.PortBGender ? `${cableRow.PortBGender + " " + getLastWord(cableRow?.PortBCompositeName ?? "")}` : ""}`
                        const otherPort = isA
                            ? cableRow.PortBCompositeName
                            : cableRow.PortACompositeName;

                        const otherPortName = !isA ?
                            `${cableRow.PortAGender ? `${cableRow.PortAGender + " " + getLastWord(cableRow?.PortACompositeName ?? "")}` : ""}`
                            : `${cableRow.PortBGender ? `${cableRow.PortBGender + " " + getLastWord(cableRow?.PortBCompositeName ?? "")}` : ""}`
                        const otherPortId = isA
                            ? cableRow.PortBEntityID
                            : cableRow.PortAEntityID;

                        const toPortFull = otherEndConnectPort && otherEndConnectPort.ToDeviceCompositePortName;
                        const toPortId = otherEndConnectPort && extractPortId(otherEndConnectPort.ToDevicePortStatus);
                        const toDeviceHeader = otherEndConnectPort && otherEndConnectPort.ToDeviceName
                        //  Connected
                        base[fromHeader].status = "connected";
                        base[fromHeader].cable = {
                            CableName: cableRow.CableName,
                            CableConnectedPort: getView(connectedPort ?? ""),
                            CableConnectedPortName: connectPortName
                        };

                        //  To Device
                        if (toPortFull) {
                            base[fromHeader].cable.toDevicePort = {
                                device: toDeviceHeader ?? toHeader,
                                port: FnConvertCellName(toPortFull),
                                CableConnectedPort: getView(otherPort ?? ""),
                                CableConnectedPortName: otherPortName,
                                status:
                                    toPortId === otherPortId
                                        ? "connected"
                                        : "not connected"
                            };
                        }

                        if (!cableRow) {
                            base[fromHeader].description =
                                `${fromHeader} ${FnConvertCellName(fromPortFull ?? "")} (${getView(fromPortFull ?? "")}) is not connected`;
                        }
                        else if (cableRow && (!toPortId || toPortId !== otherPortId)) {
                            //  Connected to cable but NOT to device
                            base[fromHeader].description =
                                `${fromHeader} ${FnConvertCellName(fromPortFull ?? "")} (${getView(fromPortFull ?? "")}) is connected to cable ` +
                                `${cableRow.CableName} via ${connectPortName}, ` +
                                `but other end of cable not connected `;
                        }
                        else {
                            //  Fully connected
                            base[fromHeader].description =
                                `${fromHeader} ${FnConvertCellName(fromPortFull ?? "")} (${getView(fromPortFull ?? "")}) → ` +
                                `Cable ${connectPortName} → ` +
                                `${cableRow.CableName} →` +
                                `Cable ${otherPortName} → ` +
                                `${toDeviceHeader ?? toHeader} ${FnConvertCellName(toPortFull ?? "")} (${getView(toPortFull ?? "")})`;
                        }

                        return base;
                    });

                FnCopyToClipboard(JSON.stringify(result, null, 2));
            }

        } catch (error) {
            console.error("Error while downloading data:", error);
        }

    }
    //Active cable to store in UI side
    const handleChangeForCable = (value: string | number | null, meta: IChangeMeta) => {
        if (value && typeof value === "string") {
            setSelectedComboValue(value as string)
            setActiveCableCombo(value as string)
        } else {
            setActiveCableCombo(null)
        }
    }
    const getTipByFeatureId = (featureId: string, featureName?: string): string | undefined => {
        const target = helpTipsContext.helpTipRecords.find(item => item.featureid.startsWith(`${featureId}_`));
        return target?.tip ? target?.tip : `Helptip missing for ${featureName ?? featureId} report to SC….`;
    }


    return (
        <div className="nz-cabling-container" >
            <Helptip uniqueName={`${props.uniqueName}-helptip`} mdString={getTipByFeatureId(props.featureId, "Cabling")} hideCloseBtn={true} />
            <div className={`${props.isReadOnly ? "" : "nz-cablingCompoDiv"} nz-cabling-combo-grid`}>
                {!props.isReadOnly && (
                    <div className="nz-cablingCableCombo">
                        <span style={{ fontWeight: "bold", marginLeft: "var(--spacing-1)" }}>
                            <Label label="Cables" uniqueName='cableCombo' />
                        </span>
                        <div className="nz-cable-cabling-combo">
                            <ComboBoxControl
                                name={"cabllingPortMap"}
                                value={selectComboValue}
                                options={cableCombo ? cableCombo : []}
                                onChange={handleChangeForCable}
                            />
                        </div>
                        <span
                            title="Add Cable"
                            className={`nz-cabling-add-btn ${activeCableCombo ? "nz-cabling-add-btn-active" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={(e) => handleAddCable()}
                        >
                            {activeCableCombo &&
                                <Image uniqueName="download" source={<AddtoCabling24x24
                                    size={FnGetCssVariable('--image-size-2')}
                                    fill='none'
                                    strokeWidth={1} />}
                                    type="svg" w="var(--image-size-2)" h="var(--image-size-2)" />
                            }
                        </span>

                    </div>

                )}
            </div>
            <div className={`nz-cabling-grid-and-view-container${fromDeviceViewEntID || cableViewEntID || toDeviceViewEntId ? " nz-cabling-grid-with-view" : ""} `}>
                <div className={` nz-dropzone ${props?.isReadOnly ? "nz-cabling-isReadOnly" : " nz-cabling-div"} `}>
                    {tableData.map((item: ICablingGridSection, index: number) => {
                        return (
                            <BasicGrid
                                uniqueName={"cablingGrid" + index}
                                gridRef={gridRef}
                                key={index}
                                showGrid={true}
                                columnDefs={item?.columnDefs && [...item.columnDefs]}
                                isExportOnCopy={props.isExportOnCopy}
                                rowData={item.rowData}
                                instanceName={"CablingGrid"}
                                allowAutoSizeColumn={true}
                                onCellClicked={(params, gridRef) => { onCellClicked(params as ICablingCellClickParams, gridRef, index) }}
                                gridOptions={gridOptions}
                                containerName={"cablingGrid"}
                                id={(tableData.length - 1) === index ? "cabling-last-grid" : 'cabling-grid'}
                                cablingTabelData={tableData}
                                diagnosticLevel={diagnosticLevel}
                                handleMouseEvent={(event, gridRef) => {
                                    handleMouseEvent(event, gridRef, index)
                                }}
                                handleDownloadData={() => handleDownloadData(item, index)}
                            />
                        )
                    })}

                </div>


                {(fromDeviceViewEntID || cableViewEntID || toDeviceViewEntId) &&
                    <CablingViews
                        fromDeviceViewType={fromDeviceViewType ?? ""}
                        toDeviceViewType={toDeviceViewType ?? ""}
                        fromDeviceViewEntID={fromDeviceViewEntID ?? ""}
                        cableViewEntID={cableViewEntID ?? ""}
                        toDeviceViewEntID={toDeviceViewEntId ?? ""}
                        CableName={selectedCableName ?? ""}
                        uniqueName={"cabling-view" + props.uniqueName}
                        featureId={props.featureId}
                        selectedNode={props.selectedNodeInfo}
                        handleSelectDCExplorer={props.handleSelectDCExplorer}
                    />
                }

            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={props.uniqueName + "confirmbox"}
                message={confirmMessage}
                buttons={customButtons}
                showOkButton={true}
                handleOkButtonClick={
                    () => {
                        setIsConfirmOpen(false);
                        setConfirmMessage("");
                    }
                }

            />

            {showSelectWorkorder &&
                <div className="nz-dialog-overlay">
                    <div
                        className="nz-wo-dialog-container "
                        style={{ width: '100%', height: 500, overflow: 'auto' }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <SelectWorkorder workorderRecords={workorderRecords} onSelect={handleSelectWorkorder}
                            onCancel={() => {
                                setShowSelectWorkorder(false)
                                setWorkorderRecords([])
                            }} />
                    </div>
                </div>
            }
        </div>
    );
};

export default CablingGrid;

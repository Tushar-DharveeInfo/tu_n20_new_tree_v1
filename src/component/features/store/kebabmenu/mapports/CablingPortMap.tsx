
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import '../../../allcss/store/kebabmenu/CablingPortMap.css'
import { axiosInterceptor } from "../../../../shared/interceptors/Interceptor";
import { useMainAppContext } from "../../../../shared/context/hooks/MainAppHooks";
import { useStatusBarContext } from "../../../../shared/context/hooks/StatusBarHooks";
import { FEnums } from "../../../../constants/Feature";
import { RightMouseMenuTreeNode } from "../../../../constants/Feature";
import { ICablingPortMap } from "../../../allinterface/store/kebabmenu/ICablingPortMap";
import { AddtoCabling24x24, Connector24x24, Cross, Display24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../appcontainer/allcommon/FnGetCssVariable";
import { Label } from '../../../../shared/basic/label/Label'
import { Image } from "../../../../shared/basic/image/Image";
import { BasicGrid } from "../../../../shared/tablegrid/BasicGrid";
import { FrontPort } from "./FrontPort";
import { RearPort } from "./RearPort";
import { ActionImage } from "../../../../shared/basic/actionimage/ActionImage";
import { CABLING } from "../../../../shared/interceptors/EndPoints";
import { ComboBoxControl, IChangeMeta } from "@n20a/libform";
import { IBasicGridColDef } from "../../../../shared/allinterface/tablegrid/IBasicGrid";
import { FnParseJsonSafely } from "../../../../appcontainer/allcommon/FnParseJsonSafely";

const CablingPortMap = (props: ICablingPortMap) => {
    const [cablingData, setCablingData] = useState<any>([]);
    const [cableCombo, setCableCombo] = useState<any>();
    const [originalData, setOriginalData] = useState<any>([]);
    const [activeCableCombo, setActiveCableCombo] = useState<any>();
    const [deviceEntid, setDeviceEntId] = useState<any>(null)
    const [deviceEntname, setDeviceEntName] = useState<any>(null)
    const [connectBtn, setConnectBtn] = useState<boolean>(true)
    const [frontPortIDs, setFrontPortIDs] = useState<string[]>([])
    const [rearPortIDs, setRearPortIDs] = useState<string[]>([])
    const [headerTitle, setHeaderTitle] = useState<string>("Map Ports")
    const [selectComboValue, setSelectedComboValue] = useState<string | null>(null)
    const [cableComboApiData, setCableComboApiData] = useState<Record<string, any>[]>();
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    let gridRef: any = useRef<any>(null);

    useEffect(() => {
        makeApiCallComboCabling()
        return () => {
            setCableCombo([])
            setHeaderTitle("Map Ports")
        }
    }, [])

    const makeApiCallComboCabling = async () => {
        const handleGetCablesForPortMapping = async (response: unknown) => {
            if (response && Array.isArray
                (response)
            ) {
                const options = []
                for (let index = 0; index < response.length; index++) {
                    const element = response[index];
                    options.push({
                        label: element.cableName,
                        value: element.cableID
                    })
                }
                setCableComboApiData(response)
                setCableCombo(options)

            }
        }
        axiosInterceptor({
            url: CABLING.GetCablesForPortMapping,
            data: {
                cableType: props.featureId == FEnums.EditPowerCabling
                    ? "Power"
                    : "Network"
            },
            setFetchData: handleGetCablesForPortMapping

        }, statusBarContext)
    }

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


    };



    useEffect(() => {

        if (frontPortIDs.length > 0 && rearPortIDs.length > 0) {
            setConnectBtn(false)
        }
    }, [frontPortIDs, rearPortIDs])

    const handleChangeForFront = useCallback((value: string, name: string, rowData: any, props: any) => {

        if (!rowData.MappedPortsA) {
            setDeviceEntId(rowData.EntityID)
            setDeviceEntName(rowData.EntityName)
            if (value === '1') {
                let data: any = frontPortIDs
                data.push(rowData.DeviceAPortID)
                setFrontPortIDs([...data])
            } else {
                frontPortIDs.splice(frontPortIDs.indexOf(rowData.DeviceAPortID), 1);
                setFrontPortIDs(frontPortIDs)
            }
            props.node.setDataValue(props.colDef.field, value === "1" ? true : false);
        }
    }, [frontPortIDs])

    const handleChangeRearCheckbox = useCallback((value: string, name: string, rowData: any, props: any) => {

        if (!rowData.MappedPortsB) {
            setDeviceEntId(rowData.EntityID)
            setDeviceEntName(rowData.EntityName)
            if (value === '1') {
                let data: any = rearPortIDs
                data.push(rowData.DeviceBPortID)
                setRearPortIDs([...data])
            } else {
                rearPortIDs.splice(rearPortIDs.indexOf(rowData.DeviceBPortID), 1);
                setRearPortIDs(rearPortIDs)
            }
            props.node.setDataValue(props.colDef.field, value === "1" ? true : false);
        }
    }, [rearPortIDs]);

    const handleNodeMenuSelect = (value: any, name: string, selectedRow: any, rowIndex: number, cablingRowData: any) => {
        let payload: any = null
        if (value) {
            if (value?.uniqueName == RightMouseMenuTreeNode.BADPort.toString()
                || value?.uniqueName == RightMouseMenuTreeNode.BlockPort.toString()
                || value?.uniqueName == RightMouseMenuTreeNode.ReservePort.toString()
                || value?.uniqueName == RightMouseMenuTreeNode.NormalPort.toString()
                || value?.uniqueName == RightMouseMenuTreeNode.DisconnectCable.toString()
            ) {

                if (name == "mapping_FrontA") {
                    payload = {
                        isPower: props.featureId == FEnums.EditPowerCabling ? true : false,
                        portID: selectedRow.DeviceAPortID,
                        portStatus: value?.uniqueName.replace('Port', '').trim()
                    }
                } else if (name == "mapping_FrontB") {
                    payload = {
                        isPower: props.featureId == FEnums.EditPowerCabling ? true : false,
                        portID: selectedRow.DeviceAPortID.DeviceBPortID,
                        portStatus: value?.uniqueName.replace('Port', '').trim()
                    }
                }

                const handleSetPortStatus = (reponse: unknown) => {
                    apiCallForGetPortsForMapping(activeCableCombo ? activeCableCombo : props.selectedNodeInfo.node.NodeEntID)
                }
                axiosInterceptor({
                    url: CABLING.SetPortStatus,
                    data: payload,
                    setFetchData: handleSetPortStatus

                }, statusBarContext)
            } else if (value?.uniqueName == RightMouseMenuTreeNode.DisconnectPort.toString()) {
                if (name == "mapping_FrontA") {
                    payload = {
                        deviceCableID: selectedRow.EntityID,
                        deviceCablePortID: selectedRow.DeviceAPortID
                    }
                }
                else if (name == "mapping_FrontB") {
                    payload = {
                        deviceCableID: selectedRow.EntityID,
                        deviceCablePortID: selectedRow.DeviceBPortID
                    }
                }
                const handleDeleteInternalConnection = (response: unknown) => {
                    apiCallForGetPortsForMapping(activeCableCombo ? activeCableCombo : props.selectedNodeInfo.node.NodeEntID)
                }
                axiosInterceptor({
                    url: CABLING.DeleteInternalConnection,
                    data: payload,
                    setFetchData: handleDeleteInternalConnection

                }, statusBarContext)
            } else if (value?.uniqueName == RightMouseMenuTreeNode.HideAll.toString()) {

                setOriginalData(cablingRowData)
                let hideItems: any = [];
                if (cablingRowData?.length > 0) {
                    cablingRowData?.map((items: any, index: number) => {
                        if (index === rowIndex) {
                            hideItems.push(items)
                        }
                    });

                    setCablingData([...hideItems]);
                }
            }
            else if (value?.uniqueName == RightMouseMenuTreeNode.PushUp.toString()) {
                let id = rowIndex
                if (id === 0) {
                    return; // Row is already at the top
                }
                const updatedRowData = [...cablingRowData];
                const temp = updatedRowData[id];
                updatedRowData[id] = updatedRowData[id - 1];
                updatedRowData[id - 1] = temp;
                setCablingData(updatedRowData);
            } else if (value?.uniqueName == RightMouseMenuTreeNode.PushDown.toString()) {
                if (rowIndex === cablingData.length - 1) {
                    return; // Row is already at the bottom
                }
                const updatedRowData = [...cablingRowData];
                const temp = updatedRowData[rowIndex];
                updatedRowData[rowIndex] = updatedRowData[rowIndex + 1];
                updatedRowData[rowIndex + 1] = temp;
                setCablingData(updatedRowData);
            } else if (value?.uniqueName == RightMouseMenuTreeNode.UnhideAll.toString()) {
                setCablingData(originalData.length > 0 ? originalData : cablingRowData);
            } else if (value?.uniqueName == RightMouseMenuTreeNode.Delete.toString()) {
                let hideItems: any = [];
                let originalValue: any = [];
                setOriginalData(cablingRowData)
                if (cablingRowData?.length > 0) {
                    cablingRowData?.map((items: any) => {
                        if (items.ID == rowIndex) {
                            hideItems.push(items);
                        } else {
                            originalValue.push(items);
                        }
                    });
                    setCablingData([...originalValue])
                }
            }
        }
    }

    let cableColumn: IBasicGridColDef[] = useMemo(() => {
        return [
            {
                headerName: "Front Port",
                suppressMovable: false,
                field: "CompositePortNameA",
                cellRendererSelector: (params: any) => {
                    const valueRender = {
                        component: FrontPort,
                        params: {
                            params: params,
                            cablingMapProps: props,
                            selectedRow: params.data,
                            rowIndex: params.node.rowIndex,
                            selected_node: props?.selectedNodeInfo,
                            handleChangeForFront: handleChangeForFront,
                            handleSelect: handleNodeMenuSelect,
                            cablingData: cablingData,
                            featureRecords: mainAppContext.featureRecords
                        },
                    };

                    return valueRender;
                },
            },
            {
                headerName: "Device/Cable",

                field: "DeviceName",
                suppressMovable: false,


                cellRenderer: (p: any) => {
                    return (
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                            }}

                        >
                            {p.value && props.isReadOnly === false && <div
                                id="desc"
                                className="nz-desc nz-cabling-rtm"
                                aria-describedby={"desc"}
                                style={{ marginRight: 10 }}

                            >

                            </div>}
                            <span
                                title={JSON.stringify(p?.data, null, 2)}
                            >
                                {p.value ? p.value : ""}
                            </span>


                        </div>
                    );
                },
            },
            {
                headerName: "Rear Port",
                field: "CompositePortNameB",
                suppressMovable: false,
                cellClassRules: {
                    'disable-selection-cell': params => !params.value,
                },
                flex: 1,
                cellRendererSelector: (params: any) => {
                    const valueRender = {
                        component: RearPort,
                        params: {
                            params: params,
                            cablingMapProps: props,
                            handleChangeRearCheckbox: handleChangeRearCheckbox,
                            selectedRow: params.data,
                            rowIndex: params.node.rowIndex,
                            selected_node: props?.selectedNodeInfo,
                            handleSelect: handleNodeMenuSelect,
                            cablingData: cablingData,
                            featureRecords: mainAppContext.featureRecords
                        },
                    };

                    return valueRender;
                },
            },


        ]
    }, [handleChangeForFront, handleChangeRearCheckbox, props, cablingData]);

    useEffect(() => {
        if (props.selectedNodeInfo.node && props.selectedNodeInfo.node.NodeEntID) {
            apiCallForGetPortsForMapping(props.selectedNodeInfo.node.NodeEntID)
        }
    }, [props.selectedNodeInfo])

    const apiCallForGetPortsForMapping = async (entID: any) => {

        const handleGetPortsForMapping = async (response: unknown) => {

            if (response && typeof response === "object" && 'cablePortsJson' in response) {
                let cablePortsJson = FnParseJsonSafely(response.cablePortsJson as string)
                let obj: any = Object.values(cablePortsJson)[0]

                let frontViewData: any = []
                let rearViewData: any = []
                obj.forEach((element: any) => {
                    if (element.ViewName === "Front") {
                        frontViewData.push(element)
                    } else {
                        rearViewData.push(element)
                    }
                });
                let gridData: any = []
                if (frontViewData.length >= rearViewData.length) {
                    frontViewData.forEach((item: any, index: any) => {
                        let ItemB = rearViewData[index]
                        let object: any = {
                            EntityName: item.EntityName,
                            EntityID: item.EntityID,
                            DeviceAssetID: item.DeviceAssetID,
                            DevicePath: item.DevicePath,
                            DeviceName: item.DeviceName,
                            DeviceDescription: item.DeviceDescription,
                            ViewNameA: item.ViewName,
                            DeviceAPortID: item.DevicePortID,
                            CompositePortNameA: item.CompositePortName,
                            PortADesc: item.PortDesc,
                            PortAGender: item.PortGender,
                            MappedPortsA: item.MappedPorts,
                            NodeType: item.NodeType,
                            PortAStatus: item.PortStatus,
                            ID: index,
                        }
                        if (ItemB) {
                            object = {
                                ...object,
                                ViewNameB: ItemB.ViewName,
                                DeviceBPortID: ItemB.DevicePortID,
                                CompositePortNameB: ItemB.CompositePortName,
                                PortBDesc: ItemB.PortDesc,
                                PortBGender: ItemB.PortGender,
                                MappedPortsB: ItemB.MappedPorts,
                                NodeType: ItemB.NodeType,
                                PortBStatus: ItemB.PortStatus,
                            }
                        }
                        gridData.push(object)
                    })
                } else {
                    rearViewData.forEach((item: any, index: any) => {
                        let ItemA = frontViewData[index]
                        let object: any = {
                            EntityName: item.EntityName,
                            EntityID: item.EntityID,
                            DeviceAssetID: item.DeviceAssetID,
                            DevicePath: item.DevicePath,
                            DeviceName: item.DeviceName,
                            DeviceDescription: item.DeviceDescription,
                            ViewNameB: item.ViewName,
                            DeviceBPortID: item.DevicePortID,
                            CompositePortNameB: item.CompositePortName,
                            PortBDesc: item.PortDesc,
                            PortBGender: item.PortGender,
                            MappedPortsB: item.MappedPorts,
                            NodeType: item.NodeType,
                            PortBStatus: item.PortStatus,
                        }
                        if (ItemA) {
                            object = {
                                ...object,
                                ViewNameA: ItemA.ViewName,
                                DeviceAPortID: ItemA.DevicePortID,
                                CompositePortNameA: ItemA.CompositePortName,
                                PortADesc: ItemA.PortDesc,
                                PortAGender: ItemA.PortGender,
                                MappedPortsA: ItemA.MappedPorts,
                                NodeType: ItemA.NodeType,
                                PorAStatus: ItemA.PortStatus,
                            }
                        }
                        gridData.push(object)
                    })
                }
                setCablingData(gridData)

            }

        }
        axiosInterceptor({
            url: CABLING.GetPortsForMapping,
            data: {
                isPower: props.featureId === FEnums.EditPowerCabling ? true : false,
                entID: entID
            },
            setFetchData: handleGetPortsForMapping

        }, statusBarContext)

    }

    const handleAddCable = async (e: any) => {
        apiCallForGetPortsForMapping(activeCableCombo);
        setActiveCableCombo(null)
        setFrontPortIDs([])
        setRearPortIDs([])
        setDeviceEntId(null)
        setDeviceEntName(null)
    }

    const handleConnect = async () => {
        let payload = {
            frontPortIDs: frontPortIDs.join(';'), rearPortIDs: rearPortIDs.join(';'), entID: deviceEntid, entityName: deviceEntname
        }
        const handleSetInternalConnection = (resp: unknown) => {
            apiCallForGetPortsForMapping(activeCableCombo ? activeCableCombo : props.selectedNodeInfo.node.NodeEntID)
            setRearPortIDs([])
            setFrontPortIDs([])
            setDeviceEntId(null)
            setDeviceEntName(null)
            setConnectBtn(true)
        }
        axiosInterceptor({
            url: CABLING.SetInternalConnection,
            data: payload,
            setFetchData: handleSetInternalConnection

        }, statusBarContext)
    }

    const addClassNamePulse = (ClassName: string) => {
        let portId: any = document.querySelectorAll(`${ClassName}`);
        portId.forEach((element: any) => {
            let div = element.closest(".ag-cell");
            if (div) {
                div.classList.add("nz-active-port");
            }
        });
    };

    function removeAllMatchingClass(className: string) {
        // Select all elements with the specified class
        const elements = document.querySelectorAll(`.${className}`);

        // Iterate through the elements and remove the class
        elements.forEach((element) => {
            element.classList.remove(className);
        });
    }

    const onCellClicked = async (params: any) => {

        const colId = params?.colDef?.field;
        if (colId) {
            removeAllMatchingClass("nz-active-port")
        }
        if (colId === "CompositePortNameA") {
            const escapeId = (id: string) => `#${CSS.escape(id)}`;
            if (params.data.MappedPortsA) {
                let ids = params.data.MappedPortsA.split(',')
                addClassNamePulse(escapeId(params.data.DeviceAPortID))
                for (let i = 0; i < ids.length; i++) {
                    addClassNamePulse(escapeId(ids[i]));
                }
            }
        } else if (colId === "CompositePortNameB") {
            const escapeId = (id: string) => `#${CSS.escape(id)}`;
            if (params.data.MappedPortsB) {
                let ids = params.data.MappedPortsB.split(',')
                addClassNamePulse(escapeId(params.data.DeviceBPortID))
                for (let i = 0; i < ids.length; i++) {
                    addClassNamePulse(escapeId(ids[i]));
                }
            }
        }
    }

    const handleChangeForCable = (value: string | number | null, meta: IChangeMeta) => {
        if (value && typeof value === "string") {
            setSelectedComboValue(value as string)
            setActiveCableCombo(value as string)
        } else {
            setActiveCableCombo(null)
        }
    }

    return (
        <div className="nz-port-map-container">
            <div className="cablingCompoDiv">
                <div className="nz-sub-header nz-form-title-header">
                    <div className={"nz-qa-bar-title-subpane"}>
                        <Label label={headerTitle} uniqueName='headertitle' />
                    </div>
                    <div className='nz-device-preview-action'>
                        {!connectBtn &&
                            <ActionImage
                                image={{
                                    uniqueName: "Connector icons",
                                    source: <Connector24x24
                                        size={FnGetCssVariable('--image-size-2')}
                                        fill='none'
                                        strokeWidth={1} />,
                                    type: "svg",
                                    w: "var(--image-size-2)",
                                    h: "var(--image-size-2)",
                                    tooltip: `connect cable`
                                }}
                                uniqueName='connect icon'
                                actionCode='connect cable'
                                w='var(--node_height)'
                                h='var(--node_height)'
                                disabled={connectBtn}
                                handleMouse={handleConnect}
                            />
                        }
                        {props.allowShowPane && <div className="nz-prop-action-icon">
                            <ActionImage
                                image={{
                                    uniqueName: "Preview",
                                    source: <Display24x24
                                        size={FnGetCssVariable('--image-size-2')}
                                        fill='none'
                                        strokeWidth={1} />,
                                    type: "svg",
                                    w: "var(--image-size-2)",
                                    h: "var(--image-size-2)",
                                    tooltip: `Open ${props.hidePaneTitles && props.hidePaneTitles.length > 0 ? props.hidePaneTitles[props.hidePaneTitles.length - 1] : ""} Pane`
                                }}
                                uniqueName='previewIcon'
                                actionCode='preview'
                                w='var(--node_height)'
                                h='var(--node_height)'
                                handleMouse={() => {
                                    props.handleCloseOpenPane && props.handleCloseOpenPane(props.paneName, "open")
                                }}
                            />

                        </div>}
                        {props.allowHidePane && <div className="nz-prop-action-icon">
                            <ActionImage
                                image={{
                                    uniqueName: "Cancel",
                                    source: <Cross
                                        size={FnGetCssVariable('--image-size-2')}
                                        fill='red' />,
                                    type: "svg",
                                    w: "var(--image-size-2)",
                                    h: "var(--image-size-2)",
                                    tooltip: `Close ${headerTitle} Pane`
                                }}
                                uniqueName='cancelIcon'
                                actionCode='cancel'
                                w='var(--node_height)'
                                h='var(--node_height)'
                                handleMouse={() => {
                                    props.handleCloseOpenPane && props.handleCloseOpenPane(props.paneName, "close", headerTitle)
                                }}
                            />
                        </div>}
                    </div>
                </div>
            </div >
            <div className="nz-cabling-port-map-grid">
                {props.isReadOnly === false && (
                    <div
                        className="nz-cablingCableCombo"
                    >
                        <span style={{ marginLeft: "5px" }}>
                            <Label label="Cables" uniqueName='cableCombo' fontWeight="normal" />
                        </span>
                        <ComboBoxControl
                            name={"cabllingPortMap"}
                            value={selectComboValue}
                            options={cableCombo ? cableCombo : []}
                            onChange={handleChangeForCable}
                        />

                        <span
                            className="nz-cabling-add-btn"
                            title="Add Cable"
                            style={{ cursor: "pointer" }}
                            onClick={(e: any) => handleAddCable(e)}
                        >
                            {activeCableCombo && <Image uniqueName="download" source={<AddtoCabling24x24
                                size={FnGetCssVariable('--image-size-2')}
                                fill='none'
                                strokeWidth={1} />} type="svg" w="var(--image-size-2)" h="var(--image-size-2)" />}
                        </span>
                    </div>
                )}

                <div className="ag-theme-alpine nz-dropzone nz-cabling-Grid">
                    <BasicGrid
                        uniqueName="cablingPortMap"
                        gridRef={gridRef}
                        isExportOnCopy={props.isExportOnCopy}
                        showGrid={true}
                        columnDefs={cableColumn}
                        rowData={cablingData.length > 0 ? cablingData : []}
                        instanceName={"CablingGrid"}
                        containerName="mapports_cablingGrid"
                        rowSelection="multiple"
                        onCellClicked={onCellClicked}
                        gridOptions={gridOptions}
                        allowAutoSizeColumn={true}
                    />
                </div>
            </div>
        </div >
    );
};

export { CablingPortMap };

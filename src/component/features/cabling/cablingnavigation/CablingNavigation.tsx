import React, { useEffect, useRef, useState } from 'react'
import { CellClickedEvent, ICellRendererParams } from 'ag-grid-community'
import { NavigationView } from './NavigationView'
import { ICablingNavigation, ICablingNavigationRow, ICablingNavigationSection, IConnectionTraceItem, IPortsJsonResponse, IPortStatusJson } from '../../allinterface/cabling/ICablingNavigation'
import '../../allcss/cabling/CablingNavigation.css'
import { FEnums } from '../../../constants/Feature'
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor'
import { CABLING } from '../../../shared/interceptors/EndPoints'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks'
import { FnDeepClone } from '../../../shared/allcommon/basic/FnDeepClone'
import { BasicGrid } from '../../../shared/tablegrid/BasicGrid'
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely'
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks'
import { Helptip } from '../../../shared/Help'

const portIdEquals = (left?: string | null, right?: string | null): boolean =>
    Boolean(left && right && left.toLowerCase() === right.toLowerCase());

const isDeviceAlreadyDisplayed = (
    sections: ICablingNavigationSection[] | null | undefined,
    deviceViewId: string,
    entityId?: string,
    deviceName?: string
): boolean => {
    if (!sections?.length) {
        return false;
    }

    return sections.some((section) => {
        if (deviceViewId && portIdEquals(section.DeviceViewID, deviceViewId)) {
            return true;
        }
        if (deviceName && section.columnDefs?.[0]?.headerName === deviceName) {
            return true;
        }
        return section.rowData.some((row) =>
            portIdEquals(row.EntityID, entityId) ||
            portIdEquals(row.ToDeviceEntityID, entityId)
        );
    });
};

const isConnectedPortAlreadyDisplayed = (
    sections: ICablingNavigationSection[] | null | undefined,
    connectedDevicePortId: string
): boolean => {
    if (!sections?.length) {
        return false;
    }

    return sections.some((section) =>
        section.rowData.some((row) =>
            portIdEquals(row.DevicePortID, connectedDevicePortId) ||
            portIdEquals(row.ToDevicePortID, connectedDevicePortId)
        )
    );
};

const CablingNavigation = (props: ICablingNavigation) => {

    const [fromDeviceData, setFromDeviceData] = useState<ICablingNavigationSection[] | null>(null)
    const [deviceEntIDs, setDeviceEntIDs] = useState<string[]>([])
    const statusBarContext = useStatusBarContext();

    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const helpTipsContext = useHelpTipContext();

    const deviceNameCell = (params: ICellRendererParams<ICablingNavigationRow>) => {
        function convertToOrientationOnly(input: string): string {
            return input
                .replace(/.*\((R)\)\./, ' Rear-')
                .replace(/.*\((F)\)\./, ' Front-');
        }
        if (!params || !params.data) return null;
        let postStatus = params?.data?.ToDevicePortStatus ?
            params?.data?.ToDevicePortStatus?.toLowerCase().includes("portid") ? "connected" : params?.data?.ToDevicePortStatus?.toLowerCase()
            : null

        let ToDevicePortStatus = null
        if (params?.data?.ToDevicePortStatus && params?.data?.ToDevicePortStatus?.toLowerCase().includes("portid")) {
            const portStatusData = FnParseJsonSafely(params.data.ToDevicePortStatus) as IPortStatusJson
            ToDevicePortStatus = 'port-' + portStatusData.PortID
        }

        let objTooltip = {
            "DeviceCompositePortName": params.data?.ToDeviceCompositePortName,
            "connectedToName": params.data?.ConnectedCompositePortName ?? "",
            "DevicePortStatus": params?.data?.ToDevicePortStatus,
            "DeviceViewName": params?.data?.ToDeviceViewName,
            "DevicePortGender": params?.data?.ToDevicePortGender,
        }
        return (
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
                key={params?.data?.ToDevicePortID}
            >
                <span
                    id={ToDevicePortStatus ? `${ToDevicePortStatus}` : ''}
                    title={JSON.stringify(objTooltip, null, 2)}
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
                            {params?.data?.ToDevicePortID !== null && params.value && (
                                <span
                                    style={{
                                        color:
                                            postStatus === null ||
                                                postStatus === "available" || postStatus === "normal" || postStatus === "connected" ||
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
                                            postStatus === "reserve" ? (
                                            <>[O]</>
                                        ) : postStatus === "connected" ? (
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
                        <span id="nz-cell-value-string" port-gender={params.data.ToDevicePortGender} allow-drop={(postStatus === null ||
                            postStatus === "" ||
                            postStatus === "available" ||
                            postStatus === "normal") ? 'true' : 'false'}
                            data-index={params.data.ID?.toString() ? params.data.ID?.toString() : ""}
                            node-value={params.value}
                            className={postStatus === "connected" ? "nz-cabling-make-hipertlink" : "nz-cabling-navigation-cell"}
                        >
                            {convertToOrientationOnly(params.value ? params.value : "")}
                        </span>
                    </span>
                </span>

            </div>
        );
    }
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current)
            }
        }
    }, [])
    useEffect(() => {
        if (props.selectedNode && props.selectedNode.node.NodeEntID) {
            getPortApiCall(props.selectedNode.node.NodeEntID, [], true)
        }
    }, [props.selectedNode])

    const getPortApiCall = (NodeEntID: string, oldData?: ICablingNavigationSection[], isSelectedNodeChange?: boolean) => {
        try {

            if (deviceEntIDs.includes(NodeEntID) && !isSelectedNodeChange) return
            let checkEntID = deviceEntIDs
            if (isSelectedNodeChange) {
                setDeviceEntIDs([])
                checkEntID = []
            }
            let cablesDevicePort = {
                isPower:
                    props.featureId == FEnums.EditPowerCabling || props.featureId == FEnums.ReviewPowerCabling || props.featureId == FEnums.PowerTrace || props.featureId === FEnums.PowerNavigate ? true : false,
                deviceEntID: NodeEntID,
            };
            const handleGetDevicePort = async (response: unknown, status?: string) => {

                if (status === '200' && response && typeof response === "object" && 'portsJson' in response) {

                    const jsonData = FnParseJsonSafely(response?.portsJson as string) as IPortsJsonResponse;
                    if (jsonData?.Ports?.length > 0) {
                        const data: ICablingNavigationSection[] = oldData ? oldData : []
                        const rowData: ICablingNavigationRow[] = []
                        let deviceName = ''
                        let DeviceViewID = ''
                        let viewName = ''
                        for (let index = 0; index < jsonData.Ports.length; index++) {
                            const element = jsonData.Ports[index];
                            if (index === 0) {
                                deviceName = element.DeviceName ?? ""
                                DeviceViewID = element.DeviceViewID ?? ""
                                viewName = element.ViewName ?? ""
                            }
                            const dataObj: ICablingNavigationRow = {
                                ...element,
                                ToDeviceEntityName: element.ToDeviceEntityName,
                                ToDeviceEntityID: element.EntityID,
                                ToDeviceAssetID: element.DeviceAssetID,
                                ToDevicePath: element.DevicePath,
                                ToDeviceName: element.DeviceName,
                                ToDeviceDescription: element.DeviceDescription,
                                ToDeviceViewName: element.ViewName,
                                ToDeviceViewID: element.DeviceViewID,
                                ToDevicePortID: element.DevicePortID,
                                ToDeviceCompositePortName:
                                    element.CompositePortName,
                                ToDevicePortDesc: element.PortDesc,
                                ToDevicePortStatus: element.DevicePortStatus,
                                ToDevicePortGender: element.PortGender,
                                ToDevicePortNodeType: element.NodeType,
                            };
                            rowData.push(dataObj)
                        }


                        const entityId = rowData[0]?.EntityID ?? rowData[0]?.ToDeviceEntityID;
                        if (isDeviceAlreadyDisplayed(data, DeviceViewID, entityId, deviceName)) {
                            setFromDeviceData(FnDeepClone(data));
                            return;
                        }

                        data.push({
                            columnDefs: FnDeepClone([{
                                headerName: deviceName,
                                minWidth: 80,
                                field: "ToDeviceCompositePortName",
                                cellRendererSelector: (params: ICellRendererParams<ICablingNavigationRow>) => {
                                    return { component: deviceNameCell, params: params };
                                },
                                flex: 1
                            }

                            ]),
                            rowData: rowData,
                            DeviceViewID: DeviceViewID,
                            viewName: viewName
                        })
                        setDeviceEntIDs([...checkEntID, NodeEntID])
                        setFromDeviceData(FnDeepClone(data))
                        if (rowData.length == 1 && rowData[0].ToDevicePortStatus && rowData[0].ToDevicePortStatus?.toLowerCase() === "connected") {
                            const devicePortID = rowData[0].ToDevicePortID
                            const handleGetConnectionForPort = async (response: unknown, status?: string) => {
                                if (status === "200" && response && typeof response === "object" && 'traceJson' in response) {
                                    if (response?.traceJson !== null) {
                                        const traceData = FnParseJsonSafely(response?.traceJson as string) as IConnectionTraceItem[];
                                        if (traceData.length) {
                                            const jsonDataObj = traceData[0]
                                            if (
                                                jsonDataObj.ConnectedDevicePortID &&
                                                !isConnectedPortAlreadyDisplayed(data, jsonDataObj.ConnectedDevicePortID)
                                            ) {
                                                if (devicePortID) {
                                                    setDeviceEntIDs(deviceEntIDs.length ? [...deviceEntIDs, jsonDataObj.ConnectedDevicePortID] : [devicePortID])
                                                }
                                                getPortApiCall(jsonDataObj.ConnectedDevicePortID, data)
                                            }
                                        }
                                    }
                                }
                            }
                            const payload = {
                                "isPower": props.featureId == FEnums.EditPowerCabling || props.featureId == FEnums.ReviewPowerCabling || props.featureId == FEnums.PowerTrace || props.featureId === FEnums.PowerNavigate ? true : false,
                                "devicePortID": devicePortID
                            }
                            await axiosInterceptor({
                                url: CABLING.GetConnectionForPort,
                                data: payload,
                                setFetchData: handleGetConnectionForPort

                            }, statusBarContext)
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
            scrollTimeoutRef.current = setTimeout(() => {
                const nav = document.querySelector('.nz-cabling-navigation');
                if (nav) {
                    nav.scrollLeft = nav.scrollWidth;
                    nav.scrollTo({
                        left: nav.scrollWidth,
                        behavior: 'smooth',
                    });
                }

            }, 1000)
        } catch (error) {
            console.error("error in getPortApiCall", error)
        }
    }
    const FnCallGetConnectionForPort = async (DevicePortID: string): Promise<IConnectionTraceItem | null> => {
        return new Promise((resolve) => {
            const handleGetConnectionForPort = (
                response: unknown,
                status?: string
            ) => {
                if (
                    status === "200" &&
                    response &&
                    typeof response === "object" &&
                    "traceJson" in response &&
                    response.traceJson !== null
                ) {
                    const traceData = FnParseJsonSafely(
                        response.traceJson as string
                    ) as IConnectionTraceItem[];

                    resolve(traceData.length ? traceData[0] : null);
                } else {
                    resolve(null);
                }
            };

            const payload = {
                isPower:
                    props.featureId === FEnums.EditPowerCabling ||
                    props.featureId === FEnums.ReviewPowerCabling ||
                    props.featureId === FEnums.PowerTrace ||
                    props.featureId === FEnums.PowerNavigate,
                devicePortID: DevicePortID,
            };

            axiosInterceptor(
                {
                    url: CABLING.GetConnectionForPort,
                    data: payload,
                    allowShowLoader: true,
                    setFetchData: handleGetConnectionForPort,
                },
                statusBarContext
            );
        });
    };

    const addedDeviceArray = useRef<string[]>([])
    async function onCellClicked(params: CellClickedEvent<ICablingNavigationRow>, _gridRef: unknown, index: number) {
        if (!params.data) {
            return;
        }

        if (params.data.DevicePortID && params.data.DevicePortStatus && (params.data.DevicePortStatus?.toLowerCase() === 'connected')) {

            if (addedDeviceArray.current.includes(params.data.DevicePortID + index)) {
                return;
            }
            addedDeviceArray.current.push(params.data.DevicePortID + index)

            //  slice removed here
            const fromData: ICablingNavigationSection[] = [];
            if (fromDeviceData) {
                for (let i = 0; i <= index && i < fromDeviceData.length; i++) {
                    fromData.push(fromDeviceData[i]);
                }
            }
            if (index === 0) {
                addedDeviceArray.current = []
                focusTimeoutRef.current = setTimeout(() => {
                    const gridContainer = document.querySelector('#cabling-navigation-other-grid') ||
                        document.querySelector('.ag-center-cols-container');

                    if (gridContainer) {
                        // Remove row focus from all rows
                        const focusedRows = gridContainer.querySelectorAll('.ag-row-focus');
                        focusedRows.forEach(row => row.classList.remove('ag-row-focus'));

                        // Remove cell focus from all cells
                        const focusedCells = gridContainer.querySelectorAll('.ag-cell-focus');
                        focusedCells.forEach(cell => cell.classList.remove('ag-cell-focus'));
                    }
                }, 2000);
                if (fromDeviceData?.length) {
                    fromData.length = 0;
                    fromData.push(fromDeviceData[0]);
                }
            } {
                addedDeviceArray.current = addedDeviceArray.current.filter((item: string) => !item.includes(String(index)))
            }
            if (fromData.length !== 10) {
                const data = await FnCallGetConnectionForPort(params.data.DevicePortID);
                if (data?.ConnectedDevicePortID) {
                    if (isConnectedPortAlreadyDisplayed(fromDeviceData, data.ConnectedDevicePortID)) {
                        setFromDeviceData(FnDeepClone(fromData));
                        return;
                    }
                    getPortApiCall(data.ConnectedDevicePortID, fromData)
                }
            }
        }

    }
    const getTipByFeatureId = (featureId: string, featureName?: string): string | undefined => {
        const target = helpTipsContext.helpTipRecords.find(item => item.featureid.startsWith(`${featureId}_`));
        return target?.tip ? target?.tip : `Helptip missing for ${featureName ?? featureId} report to SC….`;
    }

    return (
        <div className='nz-main-cabling-navigation-container'>
            <Helptip uniqueName={`${props.uniqueName}-helptip`} mdString={getTipByFeatureId(props.featureId, "Cabling")} hideCloseBtn={true} />
            <div className='nz-cabling-navigation'>
                {fromDeviceData && fromDeviceData.map((item: ICablingNavigationSection, index: number) => {
                    return (<div className='nz-cabling-navigation-container' key={index}>
                        <div className='nz-cabling-navigation-grid' id={index == 0 ? 'cabling-navigation-first-grid' : 'cabling-navigation-other-grid'} >
                            <BasicGrid
                                uniqueName="cabling-navigation"
                                showGrid={true}
                                id={'cabling-navigation' + index}
                                columnDefs={item.columnDefs}
                                rowData={item.rowData}
                                instanceName={"cabling-navigation"}
                                allowAutoSizeColumn={true}
                                onCellClicked={(params, gridRef) => { onCellClicked(params as CellClickedEvent<ICablingNavigationRow>, gridRef, index) }}
                                containerName={"cabling-navigation"}
                            />
                        </div>
                        <div className='nz-cabling-navigation-view'>
                            <NavigationView
                                uniqueName={props.uniqueName}
                                featureId={props.featureId}
                                DeviceViewID={item.DeviceViewID}
                                ViewName={item.viewName}
                                selectedNode={props.selectedNode}
                            />
                        </div>
                    </div >)
                })}
            </div>

        </div>
    )
}
export default CablingNavigation 
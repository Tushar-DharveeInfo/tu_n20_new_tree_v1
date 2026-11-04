import React, { useEffect, useState } from 'react'
import { ViewContainer } from '../../../shared/deviceview/viewcontainer/ViewContainer'
import { DEVICE } from '../../../shared/interceptors/EndPoints';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { ICablingViews } from '../../allinterface/cabling/ICablingViews';
import '../../allcss/cabling/CablingViews.css'
import { ITab } from '../../../shared/allinterface/deviceview/ITab';
import { IView } from '../../../shared/allinterface/deviceview/IView';
import { FEnums } from '../../../constants/Feature';
import { useCommonVariableContext } from '../../../shared/context/hooks/CommonVariableHooks';
import { OverlayTab } from '../../../shared/basic/overlaytab/OverlayTab';
import PowerTrace from '../powertrace/PowerTrace';
import NetworkTrace from '../networktrace/NetworkTrace';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { Label } from '../../../shared/basic/label/Label';

interface ISvgShapeParentItem {
    SVGFile: string;
    ShapeID: string;
    _Device?: string;
    _Cable?: string;
}

interface ISvgShapeDataInput {
    Parent: ISvgShapeParentItem[];
}

const CablingViews = (props: ICablingViews) => {
    const [viewsFrom, setViewsFrom] = useState<IView[]>([])
    const [cableData, setCableData] = useState<IView[]>([])
    const [viewsDevice, setViewsDevice] = useState<IView[]>([])
    const [hideFrom, setHideFrom] = useState<boolean>(true);
    const [hideCable, setHideCable] = useState<boolean>(true);
    const [hideTodevice, setHideTodevice] = useState<boolean>(true);
    const [selectedTabName, setSelectedTabName] = useState<string>('Device View')
    const [tabsObj, setTabsObj] = useState<ITab[]>()
    const [isLoadingFrom, setIsLoadingFrom] = useState<boolean>(false)
    const [isLoadingCable, setIsLoadingCable] = useState<boolean>(false)
    const [isLoadingTo, setIsLoadingTo] = useState<boolean>(false)
    const statusBarContext = useStatusBarContext();
    const CommonVariableContext = useCommonVariableContext()

    const renderViewLoading = () => (
        <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>
    )

    useEffect(() => {
        if (props.featureId) {
            const tabs: ITab[] = [
                {
                    label: "Device View",
                    tooltip: "Click to View"
                },
                {
                    label: props.featureId == FEnums.EditPowerCabling || props.featureId == FEnums.ReviewPowerCabling || props.featureId == FEnums.PowerTrace || props.featureId === FEnums.PowerNavigate ? "Power Trace" : "Network Trace",
                    tooltip: "Click to Power Trace"
                }
            ]
            setTabsObj(tabs)
            setSelectedTabName("Device View")
        }
    }, [props.featureId])

    useEffect(() => {
        if (CommonVariableContext) {
            setHideFrom(!CommonVariableContext.cablingHideColumnObject?.fromPort)
            setHideCable(!CommonVariableContext.cablingHideColumnObject?.cable)
            setHideTodevice(!CommonVariableContext.cablingHideColumnObject?.toDevicePort)

        }
    }, [CommonVariableContext.cablingHideColumnObject])

    function transformShapeData(input: ISvgShapeDataInput): { views: IView[] } {
        return {
            views: input.Parent.map((item: ISvgShapeParentItem) => {
                const title = item._Device ? item._Device : item._Cable ?? '';
                return {
                    svg: item.SVGFile,
                    viewTitle: title,
                    uniqueName: item.ShapeID,
                    tab: {
                        label: title,
                        tooltip: title,
                    },
                };
            }),
        };
    }

    const parseSvgShapeData = (svgJson: string): ISvgShapeDataInput =>
        FnParseJsonSafely(svgJson) as ISvgShapeDataInput;

    useEffect(() => {
        if (props.fromDeviceViewEntID) {
            setIsLoadingFrom(true);
            const handleGetSvgdata = async (response: unknown) => {
                try {
                    if (response && typeof response === "object" && 'svgJson' in response) {
                        const data = transformShapeData(parseSvgShapeData(response.svgJson as string))
                        setViewsFrom([...data.views])
                    } else {
                        setViewsFrom([])
                    }
                } finally {
                    setIsLoadingFrom(false);
                }
            }
            axiosInterceptor({
                url: DEVICE.GetSvgdata,
                data: {
                    deviceView: props.fromDeviceViewEntID
                },
                setFetchData: handleGetSvgdata
            }, statusBarContext)
        } else {
            setViewsFrom([])
            setIsLoadingFrom(false);
        }

        if (props.toDeviceViewEntID) {
            setIsLoadingTo(true);
            const handleGetSvgdata = async (response: unknown, status?: string) => {
                try {
                    if (status === "200" && response && typeof response === "object" && 'svgJson' in response) {
                        const data = transformShapeData(parseSvgShapeData(response.svgJson as string))
                        setViewsDevice([...data.views])
                    } else {
                        setViewsDevice([])
                    }
                } finally {
                    setIsLoadingTo(false);
                }
            }
            axiosInterceptor({
                url: DEVICE.GetSvgdata,
                data: {
                    deviceView: props.toDeviceViewEntID
                },
                setFetchData: handleGetSvgdata
            }, statusBarContext)
        } else {
            setViewsDevice([])
            setIsLoadingTo(false);
        }

        if (props.cableViewEntID) {
            setIsLoadingCable(true);
            const handleGetSvgdata = async (response: unknown, status?: string) => {
                try {
                    if (status === "200" && response && typeof response === "object" && 'svgJson' in response) {
                        const data = transformShapeData(parseSvgShapeData(response.svgJson as string))
                        setCableData([...data.views])
                    } else {
                        setCableData([])
                    }
                } finally {
                    setIsLoadingCable(false);
                }
            }
            axiosInterceptor({
                url: DEVICE.GetSvgdata,
                data: {
                    deviceView: props.cableViewEntID
                },
                setFetchData: handleGetSvgdata
            }, statusBarContext)
        } else {
            setCableData([])
            setIsLoadingCable(false);
        }

    }, [props.fromDeviceViewEntID, props.toDeviceViewEntID, props.cableViewEntID])

    function handleMousetabs(tab: string[]): void {
        setSelectedTabName(tab[0])
    }

    return (
        <div className='nz-device-view-container nz-cabling-view'>
            <div className='nz-cabling-view-container'>
                <div className='nz-view-tab-container'>
                    {(props.featureId === FEnums.ReviewPowerCabling || props.featureId === FEnums.ReviewNetworkCabling) && tabsObj && selectedTabName &&
                        <OverlayTab
                            uniqueName={`${props.uniqueName}-replacement-overlay`}
                            tabs={tabsObj && tabsObj.map((t, index) => ({
                                uniqueName: `${props.uniqueName}-overlay-tab-${index}`,
                                label: {
                                    uniqueName: `${props.uniqueName}-overlay-tab-${index}-label`,
                                    label: t.label,
                                    tooltip: t.tooltip
                                },
                                w: "auto",
                                h: "calc(var(--node_height) - var(--spacing-1))",
                                actionCode: t.label,
                                handleMouse: function (_event: React.MouseEvent<HTMLDivElement>, _actionCode?: string): void {
                                }
                            }))}
                            allowUnSelect={false}
                            selectedTabName={selectedTabName}
                            tabAlignment={"horizontal"}
                            headerText={``}
                            useContainer={false}
                            handleSelectedTab={handleMousetabs}

                        />
                    }
                </div>
                {selectedTabName === "Device View" && <div className='nz-cabling-views-container-div'>
                    {hideFrom && <div className='nz-device-view-from'>
                        <div className='nz-sub-header'>
                            <Label uniqueName={props.uniqueName + '-from-device-view-label'} label={`From Device ${props.fromDeviceViewType} View`} />
                        </div>
                        {isLoadingFrom ? renderViewLoading() : <ViewContainer
                            views={viewsFrom}
                            responsive={false}
                            selectedTabName={''}
                            uniqueName={"deviceview"}
                            isEncrypted={true}
                            featureId={props.featureId}
                            entID={""}
                            hideChartAndAsk={true}
                            hideTreeDView={true}
                            handleMouse={(event: React.MouseEvent | null, actionCode?: string) => {
                                alert('clicked' + actionCode);
                            }}
                            handleMouseDoubleClick={(event: React.MouseEvent, actionCode?: string) => {
                                alert('Double clicked' + actionCode);
                            }} viewType={'device'}
                            hideSignalTabHeader={true} viewLabel={undefined} SvgParentJSONForThreeD={undefined} />}
                    </div>}

                    {hideCable && <div className='nz-device-view-cable'>
                        <div className='nz-sub-header'>
                            <Label uniqueName={props.uniqueName + '-from-cable-view-label'} label={`Cable Preview`} />
                        </div>
                        {isLoadingCable ? renderViewLoading() : <ViewContainer
                            views={cableData}
                            responsive={false}
                            selectedTabName={''}
                            featureId={props.featureId}
                            uniqueName={"deviceview"}
                            isEncrypted={true}
                            entID={""}
                            hideTreeDView={true}
                            hideChartAndAsk={true}
                            handleMouse={(event: React.MouseEvent | null, actionCode?: string) => {
                                alert('clicked' + actionCode);
                            }}
                            handleMouseDoubleClick={(event: React.MouseEvent, actionCode?: string) => {
                                alert('Double clicked' + actionCode);
                            }} viewType={'device'}
                            hideSignalTabHeader={true} viewLabel={undefined} SvgParentJSONForThreeD={undefined} />}
                    </div>}

                    {hideTodevice && <div className='nz-device-view-device'>
                        <div className='nz-sub-header'>
                            <Label uniqueName={props.uniqueName + '-from-to-view-label'} label={`To Device ${props.toDeviceViewType} View`} />
                        </div>
                        {isLoadingTo ? renderViewLoading() : <ViewContainer
                            views={viewsDevice}
                            responsive={false}
                            selectedTabName={''}
                            uniqueName={"deviceview"}
                            featureId={props.featureId}
                            isEncrypted={true}
                            entID={""}
                            hideTreeDView={true}
                            hideChartAndAsk={true}
                            handleMouse={(event: React.MouseEvent | null, actionCode?: string) => {
                                alert('clicked' + actionCode);
                            }}
                            handleMouseDoubleClick={(event: React.MouseEvent, actionCode?: string) => {
                                alert('Double clicked' + actionCode);
                            }} viewType={'device'} hideSignalTabHeader={true} viewLabel={undefined} SvgParentJSONForThreeD={undefined} />}
                    </div>}
                </div>}
                {(props.featureId === FEnums.ReviewPowerCabling || props.featureId === FEnums.ReviewNetworkCabling) && props.selectedNode && selectedTabName !== "Device View" && <div className='nz-cabling-device-view-trace'>
                    {selectedTabName === "Power Trace" &&
                        <PowerTrace uniqueName={props.uniqueName} featureId={props.featureId} selectedNode={props.selectedNode} handleSelectDCExplorer={props.handleSelectDCExplorer} />
                    }
                    {selectedTabName === "Network Trace" &&
                        <NetworkTrace uniqueName={props.uniqueName} featureId={props.featureId} selectedNode={props.selectedNode} handleSelectDCExplorer={props.handleSelectDCExplorer} />
                    }
                </div>}


            </div>
        </div>
    )
}
export { CablingViews }

import { useCallback, useEffect, useRef, useState } from "react"
import { ViewContainer } from "../viewcontainer/ViewContainer"
import { IView } from "../../allinterface/deviceview/IView"
import { axiosInterceptor } from "../../interceptors/Interceptor"
import { DEVICE, DEVICEMODEL } from "../../interceptors/EndPoints"
import { useStatusBarContext } from "../../context/hooks/StatusBarHooks"
import { IDeviceViewContainer } from "../../allinterface/deviceview/IDeviceViewContainer"
import '../../allcss/deviceview/DeviceViewContainer.css'
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable"
import { FnFindNearestNodeByType } from "../../allcommon/FnFindNearestNodeByType"
import { ITreeNode } from "../../allinterface/tree/ITreeControl"
import isEqual from "lodash/isEqual"
import { ActionImage } from "../../basic/actionimage/ActionImage"
import { ParentJSON } from "@n20a/libbox3d"
import { OpenSidebar24x24 } from "@n20a/libicon"
import { useSelectedNodeContext } from "../../context/hooks/SelectedNodeHooks"
import { useMainAppContext } from "../../context/hooks/MainAppHooks"
import { Label } from "../../basic/label/Label"
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely"

const DeviceViewContainer = (props: IDeviceViewContainer) => {
    const [selectedTabs, setSelectedTabs] = useState<string>('');
    const [views, setViews] = useState<IView[]>();
    const [deviceViews, setDeviceViews] = useState<any>();
    const [isViewLoaded, setIsViewLoaded] = useState<boolean>(true);
    const [viewLabel, setViewLabel] = useState<string>()
    const selectedNodeRef = useRef<ITreeNode | null>(null);
    const is3dEnabledRef = useRef<boolean>(true);
    const isHideNodeChartRef = useRef<boolean>(true);
    const [threeDviewSvg, setThreeDviewSvg] = useState<ParentJSON | []>();

    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();

    const statusBarContextRef = useRef(statusBarContext);
    const SelectedNodeContext = useSelectedNodeContext();
    const SelectedNodeContextRef = useRef(SelectedNodeContext);
    const EntIDRef = useRef<string>('');
    const handleSelectedTabChangesRef = useRef(props.handleSelectedTabChanges);
    const handleViewClickRef = useRef(props.handleViewClick);

    useEffect(() => {
        statusBarContextRef.current = statusBarContext;
    }, [statusBarContext])

    useEffect(() => {
        handleSelectedTabChangesRef.current = props.handleSelectedTabChanges;
    }, [props.handleSelectedTabChanges])

    useEffect(() => {
        handleViewClickRef.current = props.handleViewClick;
    }, [props.handleViewClick])

    useEffect(() => {
        SelectedNodeContextRef.current = SelectedNodeContext;
    }, [SelectedNodeContext])

    useEffect(() => {
        if (mainAppContext.apRecords?.length) {
            const find3dRecord = mainAppContext.apRecords.find((item) => item.Name.toLowerCase() === "3d");
            if (find3dRecord) {
                is3dEnabledRef.current = find3dRecord.Value?.toLowerCase() === "0" ? false : true;
            }

            const findNodeChartRecord = mainAppContext.apRecords.find((item) => item.Name.toLowerCase() === "nodechart");
            if (findNodeChartRecord) {
                isHideNodeChartRef.current = findNodeChartRecord.Value?.toLowerCase() === "1" ? true : false;
            }
        }
    }, [mainAppContext.apRecords])


    useEffect(() => {
        const abortController = new AbortController();
        const { signal } = abortController;
        const checkedNodeChange = selectedNodeRef.current === null || !isEqual(selectedNodeRef.current, props.selectedNode)
        if (props.selectedNode && props.selectedNode?.NodeEntID && checkedNodeChange) {
            selectedNodeRef.current = props.selectedNode;

            const isSlotNode = props.selectedNode.treetype?.toLowerCase() === "deviceslot"
                || props.selectedNode.treetype?.toLowerCase() === "slot"
                || props.selectedNode.NodeType?.toLowerCase() === "ru"
                || props.selectedNode.NodeType?.toLowerCase() === "slot";

            if (props.selectedNode.treetype?.toLowerCase() === "deviceview") {
                setSelectedTabs(props.selectedNode.Name ?? "")
            } else if (isSlotNode) {
                // Determine view (Front/Rear) for slot from ancestor DeviceView
                const foundViewNode = props.treeData ? FnFindNearestNodeByType(props.treeData, props.selectedNode, "DeviceView") : null;
                if (foundViewNode?.Name) {
                    setSelectedTabs(foundViewNode?.NodeType?.toLowerCase() === "rearview" ? "Rear" : "Front");
                } else {
                    const nodeTypeLower = props.selectedNode.NodeType?.toLowerCase();
                    if (nodeTypeLower === "frontview") {
                        setSelectedTabs("Front");
                    } else if (nodeTypeLower === "rearview") {
                        setSelectedTabs("Rear");
                    } else {
                        setSelectedTabs("Front");
                    }
                }
            } else {
                const nodeTypeLower = props.selectedNode.NodeType?.toLowerCase();
                if (nodeTypeLower === "frontview") {
                    setSelectedTabs("Front");
                } else if (nodeTypeLower === "rearview") {
                    setSelectedTabs("Rear");
                } else {
                    setSelectedTabs(props.selectedNode?.NodeType === "MountedModule" || props.selectedNode.PGClassName === "_Cable" || props.selectedNode.NodeEntityname === "__Card" ? "Front" : !is3dEnabledRef.current ? "3D" : "Front")
                }
            }

            let entID: string = props.selectedNode.treetype?.toLowerCase() === "deviceview" ? props.selectedNode.parentEntID ?? "" : props.selectedNode.NodeEntID ?? ""
            if (props.treeData && isSlotNode) {
                const foundDeviceNode = FnFindNearestNodeByType(props.treeData, props.selectedNode, "Device");
                if (foundDeviceNode?.NodeEntID) {
                    entID = foundDeviceNode.NodeEntID;
                    setViewLabel(foundDeviceNode.Name ?? "");
                }
            } else if (props.treeData && (props.selectedNode.treetype?.toLowerCase() === "devicenetworkport"
                || props.selectedNode.treetype?.toLowerCase() === "networkport"
                || props.selectedNode.treetype?.toLowerCase() === "devicepowerport"
                || props.selectedNode.treetype?.toLowerCase() === "powerport")) {
                entID = props.selectedNode.ContainedByDeviceID ?? entID;
                setViewLabel(props.selectedNode.Name ?? "")
            } else if (props.selectedNode.treetype?.toLowerCase() === "deviceview" && props.treeData) {
                let foundDeviceNode = FnFindNearestNodeByType(props.treeData, props.selectedNode, "DeviceSlot");
                if (!foundDeviceNode) {
                    foundDeviceNode = FnFindNearestNodeByType(props.treeData, props.selectedNode, "Device");
                    if (foundDeviceNode)
                        setViewLabel(foundDeviceNode.Name ?? "")
                }
                else {
                    entID = foundDeviceNode.MountedDeviceEntID ?? entID;
                    setViewLabel(foundDeviceNode.MountedDeviceName ?? "");

                    setSelectedTabs(props.selectedNode?.NodeType?.toLowerCase() === "rearview" ? "Rear" : "Front");
                }

            } else if (props.selectedNode.treetype?.toLowerCase() === "device" && props.treeData) {
                setViewLabel(props.selectedNode.Name ?? "");
            }


            if (entID && entID !== EntIDRef.current) {
                setIsViewLoaded(true);
                EntIDRef.current = entID
                try {


                    const handleDeviceViews = (response: unknown) => {
                        if (signal.aborted) return;
                        if (response && typeof response === "object" && 'devicePreviewJson' in response) {
                            try {
                                const data = JSON.parse(response.devicePreviewJson as string);

                                if (data?.DeviceView) {
                                    if (props.selectedNode.PGClassName === "_Cable" && data.DeviceView.length > 1) {
                                        setDeviceViews([data.DeviceView[0]]);
                                    } else {
                                        setDeviceViews(data.DeviceView);
                                    }

                                    setIsViewLoaded(true); //  SUCCESS
                                } else {
                                    setDeviceViews([]);
                                    setViews([]);
                                    setIsViewLoaded(true); //  EMPTY but LOADED
                                }
                            } catch (error) {
                                console.error('error in handle response:', error);
                                setViews([]);
                                setIsViewLoaded(true); //  ERROR but LOADED
                            }
                        } else {
                            setViews([]);
                            setIsViewLoaded(true); //  INVALID but LOADED
                        }
                    };
                    axiosInterceptor({
                        url: DEVICEMODEL.GetDeviceModelViews,
                        allowShowLoader: true,
                        data: {
                            deviceEntID: entID
                        },
                        signal,
                        setFetchData: handleDeviceViews
                    }, statusBarContextRef.current).catch(() => undefined);
                } catch (error) {
                    console.error("error in handle GetDeviceModelViews:", error);
                }
            }
        }

        return () => {
            abortController.abort();
        };
    }, [props.selectedNode, props.treeData]);
    useEffect(() => {
        if (!isViewLoaded && deviceViews && !deviceViews.length) {
            props.handleShowUserMessage?.("No views available for the current selection: " + props.selectedNode.Name)
        }
    }, [isViewLoaded, deviceViews])

    useEffect(() => {
        const abortController = new AbortController();
        const { signal } = abortController;

        if (deviceViews?.length) {
            function mapToViews(data: any[], viewTitle: string): IView[] {
                return data.map((item) => ({
                    svg: item.Parent, // assuming base64 SVG string
                    viewTitle: viewTitle,
                    uniqueName: item.DeviceViewID,
                    tab: {
                        label: item.ViewShortName || "Tab",
                        tooltip: item.ToolTip || item.ViewShortName || "Tab"
                    },
                }));
            }
            const views: IView[] = [];
            const svgArr: any = [];
            let deviceViewID: string;

            const fetchAll = async () => {
                if (signal.aborted) return;

                const promises = deviceViews.map((element: any) => {
                    return new Promise<void>((resolve, reject) => {
                        if (signal.aborted) {
                            resolve();
                            return;
                        }
                        try {

                            const handleDeviceViews = (response: unknown) => {
                                if (signal.aborted) {
                                    resolve();
                                    return;
                                }
                                try {
                                    if (response && typeof response === "object" && 'svgJson' in response) {
                                        if ((response as any).svgJson) {
                                            const data = JSON.parse((response as any).svgJson as string);
                                            if (data.Parent) {

                                                views.push({ Parent: JSON.stringify(data), ...element });
                                                svgArr.push(data.Parent);
                                            }
                                        }
                                    }
                                    resolve();
                                } catch (err) {
                                    reject(err);
                                }
                            };

                            axiosInterceptor(
                                {
                                    url: DEVICE.GetSvgdata,
                                    data: {
                                        deviceView: element.DeviceViewID,
                                        preview: true,
                                    },
                                    allowShowLoader: true,
                                    signal,
                                    setFetchData: handleDeviceViews,
                                },
                                statusBarContextRef.current
                            ).catch(() => resolve());

                        } catch (err) {
                            console.error("error in handle GetSvgdata:", err);
                        }
                    });
                });

                await Promise.all(promises);
                if (signal.aborted) return;
                deviceViewID = deviceViews[0].DeviceViewID

                if (deviceViews.length > 1 && !is3dEnabledRef.current) {
                    try {
                        await axiosInterceptor(
                            {
                                url: DEVICE.GetSvgdatanew,
                                data: {
                                    deviceView: deviceViewID,
                                    preview: true
                                },
                                allowShowLoader: true,
                                signal,
                                setFetchData: (reponse: unknown) => {
                                    if (signal.aborted) return;
                                    if (reponse && typeof reponse === "object" && 'svgJson' in reponse) {
                                        const data = FnParseJsonSafely(reponse.svgJson as string)
                                        setThreeDviewSvg(data as ParentJSON);
                                    }
                                },
                            },
                            statusBarContextRef.current
                        );

                    } catch (err) {
                        if (signal.aborted) return;
                        console.error("error in handle GetSvgdatanew:", err);
                    }
                } else {
                    if (signal.aborted) return;
                    setThreeDviewSvg([])
                    setSelectedTabs(deviceViews[0].ViewShortName || "Front")
                }
                if (signal.aborted) return;
                if (views.length) {
                    const viewsSort = views.sort((a: any, b: any) => a.ViewShortName.localeCompare(b.ViewShortName));
                    const deviceViews = mapToViews(viewsSort, props.selectedNode?.Name ?? "");
                    setViews(deviceViews);
                } else {
                    setViews([]);
                }
                setIsViewLoaded(false);
            };

            void fetchAll();
        } else if (deviceViews) {
            setViews([]);
            setIsViewLoaded(false);
        }

        return () => {
            abortController.abort();
        };
    }, [deviceViews, props.isHideMountDeviceInView]);

    const handleViewMouse = useCallback((_event: React.MouseEvent | null, actionCode?: string) => {
        function isValidUUID(uuid: string) {
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            return uuidRegex.test(uuid);
        }

        if (actionCode && isValidUUID(actionCode)) {
            handleViewClickRef.current?.(actionCode)
        }
    }, [])

    const handleViewDoubleClick = useCallback(() => {
    }, [])

    const handleSelectedTabChanges = useCallback((selectedTabName: string, selectedTabData: unknown) => {
        if (selectedTabName) {
            setSelectedTabs(selectedTabName);
        }
        handleSelectedTabChangesRef.current?.(selectedTabName, selectedTabData)
    }, [])

    const makeTitleForheader = () => {
        if (props.selectedNode.NodeType?.toLowerCase() === "frontview" || props.selectedNode.NodeType?.toLowerCase() === "rearview") {
            return props.selectedNode.NodeType?.toLowerCase() === "frontview" ? "Front View" : "Rear View"
        } else {
            return `${props.selectedNode.NodeType}: ${props.selectedNode.Name}${props.selectedNode.EQID ? " (" + props.selectedNode.EQID + ")" : ""}`
        }
    }

    return (
        <div className={`nz-device-view-container ${props.selectedNode.NodeType === "MountedDevice" ? "nz-mounted-device-view" : "nz-device-view"}`} >
            {!props.hideHeader && (
                <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                    <div className="nz-d-flex-row nz-align-center nz-w-100">
                        <div className='nz-sub-header'>
                            <Label label={makeTitleForheader()} uniqueName={`${props.uniqueName}-title`} />
                        </div>
                    </div>
                    {props.isShowSidebarBtn && <ActionImage uniqueName={`${props.uniqueName}-explorer-tree-info-ai`}
                        image={{
                            uniqueName: `${props.uniqueName}-explorer-tree-info-image`,
                            source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                                fill="none"
                                strokeWidth={1} />,
                            w: 'var(--image-size-2)',
                            tooltip: "Click to view node details in sidebar",
                            type: "svg"

                        }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'}
                        handleMouse={() => {
                            props.handleSidebarOpenClose?.('open')
                        }} />
                    }

                </div>
            )}
            <div className="nz-device-view"
                style={{ position: "relative" }}
            >
                {

                    views?.length && threeDviewSvg ? (
                        <ViewContainer
                            views={views}
                            responsive={true}
                            selectedTabName={selectedTabs}
                            title={props.headerTitle ? props.headerTitle : "Preview"}
                            uniqueName={"Preview pane"}
                            isEncrypted={false}
                            featureId={props.featureId}
                            hideTreeDView={is3dEnabledRef.current ? true : (props.selectedNode?.NodeType === "MountedModule" || props.selectedNode.PGClassName === "_Cable" || props.selectedNode.NodeEntityname === "__Card") && views.length > 1 ? true : false}
                            hideChart={isHideNodeChartRef.current}
                            viewType={props.viewType}
                            selectedDeviceViewId={props.selectedDeviceViewId}
                            selectedNode={props.selectedNode}
                            entID={""}
                            viewLabel={viewLabel ? viewLabel : (props.selectedNode.Name ?? "")}
                            handleMouse={handleViewMouse}
                            handleMouseDoubleClick={handleViewDoubleClick}
                            handleSelectedTabChanges={handleSelectedTabChanges}
                            SvgParentJSONForThreeD={threeDviewSvg as ParentJSON || undefined}

                        />
                    )
                        : (
                            isViewLoaded ?
                                <div className="nz-w-100 nz-h-100 nz-d-flex-hv-left">Loading...</div>
                                :
                                <div className="nz-w-100 nz-h-100 nz-d-flex-hv-left">Device view not found.</div>
                        )
                }
            </div>

        </div >
    )
}

export default DeviceViewContainer

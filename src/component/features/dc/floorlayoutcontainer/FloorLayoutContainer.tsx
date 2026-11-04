import React, { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import '../../allcss/dc/FloorLayoutContainer.css'
import { ParentJSON } from '@n20a/libbox3d';
import { Close24x24, FloorLayout24x24, OpenSidebar24x24, RowOfRacks24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { IFloorLayoutContainer } from '../../allinterface/dc/IFloorLayoutContainer';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { SearchControl } from '../../../shared/searchfilter/searchcontrol/SearchControl';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { DashboardChart } from '../../home/dashboardchartscontainer/DashboardChart';
import { IView } from '../../../shared/allinterface/deviceview/IView';
import { ViewContainer } from '../../../shared/deviceview/viewcontainer/ViewContainer';
import { OverlayTab } from '../../../shared/basic/overlaytab/OverlayTab';
import { ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';
import { FnFindNearestNodeByType } from '../../../shared/allcommon/FnFindNearestNodeByType';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { EditFloorLayout } from '../../plan/editfloorlayout/EditFloorLayout';
import { InMemoryUrlProvider } from '../../../shared/context/contextandprovider/InMemoryUrl';
import { FnGetNodeDetailsBaseOnEntID } from '../../../shared/allcommon/basic/FnGetNodeDetailsBaseOnEntID';
import { FEnums } from '../../../constants/Feature';
import { isEqual } from 'lodash';
import { ASK, DEVICE, DEVICEMODEL, EM } from '../../../shared/interceptors/EndPoints';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { AIContainer } from '../../../shared/aicontainer/AIContainer';
import { DELIMITER } from '../../../shared/alldefaultprops/basic/DefaultPropsChekedListBoxControl';
import { useSelectedNodeContext } from '../../../shared/context/hooks/SelectedNodeHooks';
import { IRenderMountedRackProps } from '../../../shared/allinterface/deviceview/IMountedRack';
import { IAvailableRack, IMountedDevice, IPlacementDevice } from '../../../shared/allinterface/plan/IEditFloorLayout';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { FindRackPositions } from '../../allcommon/FindRackPositions';
import { usePlacementContext } from '../../../shared/context/hooks/PlacementHooks';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { RowOfRacksContainer } from '../../rackandstack/rowofrackscontainer/RowOfRacksContainer';

const tabs = [
    {
        "label": "Chart",
        "tooltip": "Click to view Chart"
    },
]

const FloorLayoutContainer = (props: IFloorLayoutContainer) => {
    const [searchText, setSearchText] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<"Chart" | "Device" | "Ask">("Chart");
    const [selectedTabs, setSelectedTabs] = useState<string>('');
    const [threeDviewSvg, setThreeDviewSvg] = useState<ParentJSON>();
    const [selectedNodeFromLayout, setSelectedNodeFromLayout] = useState<ITreeNode>();
    const [views, setViews] = useState<IView[]>();
    const [viewLabel, setViewLabel] = useState<string>()
    const [showChart, setShowChart] = useState<boolean>(false);
    const [isViewLoaded, setIsViewLoaded] = useState<boolean>(false);
    const [selectedFloorNode, setSelectedFloorNode] = useState<ITreeNode>()
    const [deviceViews, setDeviceViews] = useState<any>();
    const [selectedNodeAllProperties, setSelectedNodeAllProperties] = useState<object>();
    const [availableRacks, setAvailableRacks] = useState<IAvailableRack[]>([])
    const [hideOptainBtn, setHideOptainBtn] = useState<boolean>(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [showOkButton, setShowOkButton] = useState<boolean>(false)
    const [confirmMessage, setConfirmMessage] = useState("");
    const [ApiObjectForFloorData, setApiObjectForFloorData] = useState<{ racks: Record<string, any>, mountedDevices: IMountedDevice[] }>()
    const [placementDevice, setPlacementDevice] = useState<IPlacementDevice>()
    const [MountedRackProps, setMountedRackProps] = useState<IRenderMountedRackProps>()
    const [rackSlots, setRackSlots] = useState<any[]>([]);
    const [showRowOfRacks, setShowRowOfRacks] = useState<boolean>(false);
    const [tabObj, setTabObj] = useState(tabs)

    const RefSelectedNodeFromLayout = useRef<ITreeNode | null>(null);
    const is3dEnabledRef = useRef<boolean>(true);

    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();
    const SelectedNodeContext = useSelectedNodeContext();
    const mainAppContext = useMainAppContext();
    const placementContext = usePlacementContext();

    //useeffect to check whether 3d is enabled or not 
    useEffect(() => {
        if (mainAppContext.apRecords?.length) {
            const find3dRecord = mainAppContext.apRecords.find((item) => item.Name.toLowerCase() === "3d");
            if (find3dRecord) {
                is3dEnabledRef.current = find3dRecord.Value?.toLowerCase() === "0" ? false : true;
            }
        }
    }, [mainAppContext.apRecords])

    // useEffect to call API to get FloorDataset
    useEffect(() => {
        if (props.selectedFeatureTreeNode !== undefined && props.selectedFeatureTreeNode.NodeEntID && props.selectedFeatureTreeNode.NodeType === "Device") {
            if (props.selectedFeatureTreeNode.SlotsNeeded) {
                setTabObj(tabs)
                axiosInterceptor({
                    url: ASK.FloorDataset,
                    data: {
                        placement: true
                    },
                    allowShowLoader: true,
                    setFetchData: async (response: unknown) => {
                        if (response && typeof response === "object" && "askJson" in response && response.askJson !== null) {
                            const data = FnParseJsonSafely(response.askJson as string);
                            const racks = data.length > 0 && data[0]?.Racks?.length ? data[0].Racks : [];
                            const MountedDevices = data.length > 0 && data[0]?.MountedDevices?.length ? data[0].MountedDevices : [];
                            const device = props.selectedFeatureTreeNode
                            if (device) {
                                const deviceDetails: IPlacementDevice = {
                                    Name: device.Name ?? "",
                                    EntityName: device.EntityName,
                                    EntId: device.NodeEntID ?? "",
                                    RURequired: device.SlotsNeeded,
                                    power: device.Power ?? 0,
                                    thermal: device.Thermal ?? 0,
                                    powerport: device.HasNetworkPorts ?? 0,
                                    networkport: device.HasNetworkPorts ?? 0,
                                    Weight: device.Weight ?? 0,
                                    DeviceID: device.NodeEntID ?? "",
                                    StartMountIndex: 0
                                }
                                const availableRacks = FindRackPositions({ racks, items: MountedDevices, targetItem: deviceDetails })
                                setApiObjectForFloorData({ racks, mountedDevices: MountedDevices })
                                if (availableRacks.length === 0) {
                                    setDeleteOpen(true)
                                    setConfirmMessage("No racks are available for Placement.")
                                    setShowOkButton(true)
                                }
                                setPlacementDevice(deviceDetails)
                                setAvailableRacks(availableRacks)
                            } else {
                                setAvailableRacks([])
                                setApiObjectForFloorData({ racks, mountedDevices: MountedDevices })
                            }
                        }
                    }
                }, statusBarContext)
            }
        } else {
            setTabObj(tabs)
        }
    }, [props.selectedFeatureTreeNode, props.selectedFloorNode.NodeEntID])

    // useEffect to call API to get node properties 
    useEffect(() => {
        const handleApiCallForDeviceInfo = async () => {
            if (props.selectedFloorNode && props.selectedFloorNode.NodeEntID && props.selectedFloorNode.NodeEntityname) {
                axiosInterceptor({
                    url: EM.GetTableVsProperty,
                    data: {
                        entityName: props.selectedFloorNode.NodeEntityname
                    },
                    setFetchData: (getTableVsPropertyApiResponse: unknown, status?: string) => {
                        if (getTableVsPropertyApiResponse && status === "200" && Array.isArray(getTableVsPropertyApiResponse) && getTableVsPropertyApiResponse.length > 0) {
                            let oneToOneTables: string[] = [];
                            for (let index = 0; index < getTableVsPropertyApiResponse.length; index++) {
                                const element = getTableVsPropertyApiResponse[index];
                                if (!element.isOneToManyRelation && (element.tableName.startsWith("_") || element.tableName.startsWith("PG.")))
                                    oneToOneTables.push(element.tableName)
                            }
                            if (oneToOneTables.length > 0 && props.selectedFloorNode.NodeEntID) {
                                axiosInterceptor({
                                    url: EM.GetAllTablesRecord,
                                    data: {
                                        entID: props.selectedFloorNode.NodeEntID,
                                        tableNames: oneToOneTables.join(DELIMITER.separator),
                                    },
                                    setFetchData: (response: unknown, status?: string) => {
                                        if (status === "200" && response && typeof response === "object" && 'jsonStringOutput' in response) {
                                            if (response.jsonStringOutput) {
                                                const jsonData = FnParseJsonSafely(response.jsonStringOutput as string);
                                                const result: Record<string, any> = {};
                                                if (!Array.isArray(jsonData?.AllTables)) {
                                                    return;
                                                }
                                                jsonData.AllTables.forEach((table: any) => {
                                                    if (!Array.isArray(table?.TableData)) return;
                                                    table.TableData.forEach((item: any) => {
                                                        if (item?.Name !== undefined) {
                                                            result[item.Name] = item.Value;
                                                        }
                                                    });
                                                });
                                                SelectedNodeContext.setSelectedNodeAllProperties(result);
                                                setSelectedNodeAllProperties(result)
                                            }
                                            else {
                                                setSelectedNodeAllProperties({})
                                            }
                                        }
                                        else {
                                            setSelectedNodeAllProperties({})
                                        }
                                    }
                                }, statusBarContext);
                            }
                            else {
                                setSelectedNodeAllProperties({})
                            }
                        }
                        else {
                            setSelectedNodeAllProperties({})
                        }
                    }
                }, statusBarContext)
            }
        }
        handleApiCallForDeviceInfo();
        return () => {
            setSelectedNodeAllProperties(undefined)
        }
    }, [props.selectedFloorNode])

    // set selected tab based on selcted device from layout 
    useEffect(() => {
        const checkedNodeChange = RefSelectedNodeFromLayout.current === null || !isEqual(RefSelectedNodeFromLayout.current, selectedNodeFromLayout)
        if (selectedNodeFromLayout && selectedNodeFromLayout?.NodeEntID && checkedNodeChange) {
            setIsViewLoaded(true);
            if (selectedNodeFromLayout.treetype?.toLowerCase() === "deviceview") {
                setSelectedTabs(selectedNodeFromLayout.Name ?? "")
            } else {
                setSelectedTabs(selectedNodeFromLayout?.NodeType === "MountedModule" || selectedNodeFromLayout.PGClassName === "_Cable" || selectedNodeFromLayout.NodeEntityname === "__Card" ? "Front" : "3D")
            }
            let entID: string = selectedNodeFromLayout.NodeEntID
            if (props.treeData && selectedNodeFromLayout.treetype?.toLowerCase() === "deviceslot") {
                let foundDeviceNode = FnFindNearestNodeByType(props.treeData, selectedNodeFromLayout, "DeviceSlot");
                if (!foundDeviceNode) {
                    foundDeviceNode = FnFindNearestNodeByType(props.treeData, selectedNodeFromLayout, "Device");
                    if (foundDeviceNode?.NodeEntID) {
                        entID = foundDeviceNode.NodeEntID;
                        setViewLabel(foundDeviceNode.Name ?? "")
                    }
                }
                else {
                    entID = foundDeviceNode.MountedDeviceEntID ?? entID;
                    setViewLabel(foundDeviceNode.MountedDeviceName ?? "")
                }
                const foundViewNode = FnFindNearestNodeByType(props.treeData, selectedNodeFromLayout, "DeviceView");
                if (foundViewNode?.Name) {
                    setSelectedTabs(foundViewNode?.NodeType?.toLowerCase() === "rearview" ? "Rear" : "Front")
                }
            } else if (selectedNodeFromLayout.treetype?.toLowerCase() === "deviceview" && props.treeData) {
                let foundDeviceNode = FnFindNearestNodeByType(props.treeData, selectedNodeFromLayout, "DeviceSlot");
                if (!foundDeviceNode) {
                    foundDeviceNode = FnFindNearestNodeByType(props.treeData, selectedNodeFromLayout, "Device");
                    if (foundDeviceNode)
                        setViewLabel(foundDeviceNode.Name ?? "")
                }
                else {
                    entID = foundDeviceNode.MountedDeviceEntID ?? entID;
                    setViewLabel(foundDeviceNode.MountedDeviceName ?? "");
                    setSelectedTabs(selectedNodeFromLayout?.NodeType?.toLowerCase() === "rearview" ? "Rear" : "Front");
                }
            } else if (selectedNodeFromLayout.treetype?.toLowerCase() === "device" && props.treeData) {
                setViewLabel(selectedNodeFromLayout.Name ?? "");
            }
            if (entID) {
                try {

                    const handleDeviceViews = (response: unknown) => {
                        if (response && typeof response === "object" && 'devicePreviewJson' in response) {
                            try {
                                const data = FnParseJsonSafely(response.devicePreviewJson as string);
                                if (data?.DeviceView) {
                                    if (selectedNodeFromLayout.PGClassName === "_Cable" && data.DeviceView.length > 1) {
                                        setDeviceViews([data.DeviceView[0]]);
                                    } else {
                                        setDeviceViews(data.DeviceView);
                                    }
                                } else {
                                    setDeviceViews([]);
                                    setViews([]);
                                    setIsViewLoaded(false);
                                }
                            } catch (error) {
                                console.error('error in handle response:', error);
                                setViews([]);
                                setIsViewLoaded(false);
                            }
                        } else {
                            setViews([]);
                            setIsViewLoaded(false);
                        }
                        RefSelectedNodeFromLayout.current = selectedNodeFromLayout;
                    }
                    axiosInterceptor({
                        url: DEVICEMODEL.GetDeviceModelViews,
                        allowShowLoader: true,
                        data: {
                            deviceEntID: entID
                        },
                        setFetchData: handleDeviceViews
                    }, statusBarContext);
                } catch (error) {
                    console.error("error in handle GetDeviceModelViews:", error);
                }
            }
        }
        return () => {
            setDeviceViews(undefined);
            setViews(undefined);
        }
    }, [selectedNodeFromLayout, props.treeData]);

    // useEffect to call api for deviceview svg data
    useEffect(() => {
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
            const extractedSlots: any[] = [];
            const fetchAll = async () => {
                const promises = deviceViews.map((element: any) => {
                    return new Promise<void>((resolve, reject) => {
                        try {
                            const handleDeviceViews = (response: unknown) => {
                                try {
                                    if (response && typeof response === "object" && 'svgJson' in response) {
                                        if ((response as any).svgJson) {
                                            const data = FnParseJsonSafely((response as any).svgJson as string);
                                            if (data.Parent) {
                                                views.push({ Parent: JSON.stringify(data), ...element });
                                                svgArr.push(data.Parent);
                                                if (Array.isArray(data.Parent[0]?.Slots)) {
                                                    extractedSlots.push(...data.Parent[0].Slots);
                                                }
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
                                    setFetchData: handleDeviceViews,
                                },
                                statusBarContext
                            );
                        } catch (err) {
                            console.error("error in handle GetSvgdata:", err);
                        }
                    });
                });
                await Promise.all(promises);
                if (extractedSlots.length) {
                    setRackSlots(extractedSlots);
                }
                deviceViewID = deviceViews[0].DeviceViewID
                if (deviceViews.length > 1) {
                    try {
                        await axiosInterceptor(
                            {
                                url: DEVICE.GetSvgdatanew,
                                data: {
                                    deviceView: deviceViewID,
                                    preview: true
                                },
                                allowShowLoader: true,
                                setFetchData: (reponse: unknown) => {
                                    if (reponse && typeof reponse === "object" && 'svgJson' in reponse) {
                                        const data = FnParseJsonSafely(reponse.svgJson as string)
                                        setThreeDviewSvg(data as ParentJSON);
                                    }
                                },
                            },
                            statusBarContext
                        );
                    } catch (err) {
                        console.error("error in handle GetSvgdatanew:", err);
                    }
                } else {
                    setThreeDviewSvg(undefined)
                    setSelectedTabs(deviceViews[0].ViewShortName || "Front")
                }
                if (views.length) {
                    const viewsSort = views.sort((a: any, b: any) => a.ViewShortName.localeCompare(b.ViewShortName));
                    const deviceViews = mapToViews(viewsSort, props.selectedFloorNode?.Name ?? "");
                    setViews(deviceViews);
                } else {
                    setViews([]);
                }
                setIsViewLoaded(false);
            };
            fetchAll();
        } else if (deviceViews) {
            setViews([]);
            setIsViewLoaded(false);
        }
    }, [deviceViews]);

    // Keep MountedRackProps in sync with loaded views, slots and treeData
    useEffect(() => {
        if (MountedRackProps && (rackSlots.length > 0 || (views && views.length > 0) || props.treeData)) {
            setMountedRackProps(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    slots: rackSlots.length > 0 ? rackSlots : prev.slots,
                    views: views && views.length > 0 ? views : prev.views,
                    treeData: props.treeData ?? prev.treeData
                };
            });
        }
    }, [rackSlots, views, props.treeData]);

    // useEffect to set Selected floor node from props 
    useEffect(() => {
        if (props.treeData) {
            if (props.selectedFloorNode.NodeType?.toLowerCase() === "floor") {
                setSelectedFloorNode(props.selectedFloorNode)
            } else {
                if (props.treeData) {
                    const floorNode = FnFindNearestNodeByType(props.treeData, props.selectedFloorNode, "Floor");
                    if (floorNode) {
                        setSelectedFloorNode(floorNode)
                    }
                }
            }
        }
    }, [props.selectedFloorNode, props.treeData])

    // handler to search keyword not implemented
    const handleKeywordSearch = async (searchText: string, searchAllWord: boolean) => {
        if (import.meta.env.DEV)
            console.log('searchText :', searchText, searchAllWord);
    }

    // handler to set css classes based on nodetype
    const handleDisplayChart = (NodeType: string, display: boolean) => {
        const className = ".nz-edit-floor-layout-main ";
        const chartDiv = document.querySelector(
            `${className} .p-splitter-gutter`
        ) as HTMLElement;
        const chartPane = document.querySelector(
            `${className} .nz-chart-with-sub-header-pane`
        ) as HTMLElement;
        if (chartPane && chartDiv) {
            const baseClass =
                NodeType === "MountedDevice"
                    ? "nz-chart-mounted-device"
                    : "nz-chart-device-preview";
            if (display) {
                chartPane.classList.add(baseClass, "nz-chart-hidden");
                chartDiv.classList.add(baseClass, "nz-chart-hidden");
            } else {
                chartPane.classList.remove(baseClass, "nz-chart-hidden");
                chartDiv.classList.remove(baseClass, "nz-chart-hidden");
            }
        }
    };

    // useEffect to setShowChart to false when featureId change
    useEffect(() => {
        setShowChart(false)
    }, [props.featureId])

    // based on selected floor node set css class
    useEffect(() => {
        if (showChart === false && props?.selectedFloorNode && props?.selectedFloorNode.NodeType) {
            handleDisplayChart(props.selectedFloorNode.NodeType, true)
        } else if (props?.selectedFloorNode && props.selectedFloorNode.NodeType && showChart) {
            handleDisplayChart(props.selectedFloorNode.NodeType, false)
        }
    }, [props.selectedFloorNode])

    // handler to open sidebar
    function handleClickInformation(event: any, actionCode?: string | undefined, payload?: any): void {
        props.handleSidebarOpenClose?.('open')
    }

    const floorTabObj = [
        {
            "label": "Chart",
            "tooltip": "Click to view Chart"
        },
    ]

    // handler for tab selection and show component or API call based on conditions
    const handleSelectedTabs = async (tab: string[]) => {
        if (tab.length) {
            if (tab[0] === "Chart") {
                setDisplayMode("Chart")
                setShowChart(true)
                if (props.selectedFloorNode && props.selectedFloorNode.NodeType) {
                    handleDisplayChart(props.selectedFloorNode.NodeType, false)
                }
            } else if (tab[0] === "Ask") {
                setShowChart(true)
                setDisplayMode("Ask")
                if (props.selectedFloorNode && props.selectedFloorNode.NodeType) {
                    handleDisplayChart(props.selectedFloorNode.NodeType, false)
                }
            } else {
                setDisplayMode("Device")
                setShowChart(true)
                if (props.selectedFloorNode && props.selectedFloorNode.NodeType) {
                    handleDisplayChart(props.selectedFloorNode.NodeType, false)
                }
            }
        } else {
            setShowChart(false)
            if (props.selectedFloorNode && props.selectedFloorNode.NodeType)
                handleDisplayChart(props.selectedFloorNode.NodeType, true)
        }
    }

    // handle selected device from layout 
    const selectDcExplorer = async (site?: string | undefined, tenant?: string | undefined, entityName?: string | undefined, entId?: string | undefined) => {
        if (entId && props.treeData) {
            if (props.selectDcExplorer) {
                props.selectDcExplorer(site, tenant, entityName, entId);
                return;
            }
            if (selectedNodeFromLayout?.NodeEntID === entId || selectedNodeFromLayout?.key === entId) {
                return;
            }
            props.handleRUSelect?.("")
            const treeNode: ITreeNode = {
                key: entId,
                NodeEntityname: entityName || "",
                NodeEntID: entId,
                stepNo: 0,
                parentEntID: null,
                NodeState: null,
                Description: null,
                title: '',
                children: [],
                treetype: 'device',
                Name: "",
                Type: null,
                icon: null,
                HasChildren: null
            }
            const nodeData = FnGetNodeDetailsBaseOnEntID(props.treeData, entId)
            setViews([])
            setDeviceViews(undefined)
            const baseNode = nodeData.parentNodeData?.node || treeNode;
            let rackNodePath: string | undefined;
            if (ApiObjectForFloorData) {
                const racks: any = ApiObjectForFloorData.racks;
                const rack: any = Array.isArray(racks) ? racks.find((item: any) => item.EntId === entId) : undefined;
                rackNodePath = rack?.NodePath;
            }
            setSelectedNodeFromLayout(rackNodePath ? { ...baseNode, NodePath: rackNodePath } : baseNode)
            setSelectedTabs("Device")
            setDisplayMode("Device")
            if (ApiObjectForFloorData) {
                const racks: any = ApiObjectForFloorData.racks
                const rack: any = Array.isArray(racks) ? racks.find((item: any) => item.EntId === entId) : undefined;
                if (placementDevice) {
                    const DeviceList: IMountedDevice = {
                        ...placementDevice,
                        Name: placementDevice?.Name ?? "",
                        EntityName: placementDevice?.EntityName ?? "",
                        EntId: placementDevice?.EntId ?? "",
                        StartMountIndex: 0,
                        RackName: '',
                        RackEntName: '',
                        RackEntId: ''
                    }
                    if (rack && ApiObjectForFloorData?.mountedDevices) {
                        let selectedRU = ''
                        if (placementContext.lastSelectedInboundLocation) {
                            const allPositions = placementContext.lastSelectedInboundLocation.RuPos?.trim();
                            selectedRU = allPositions || (placementContext.lastSelectedInboundLocation.RUPos?.toString() ?? "");
                        }
                        const rackMountedDevices = ApiObjectForFloorData?.mountedDevices.filter(item => item.RackName === rack.RackName);
                        const matchRack = availableRacks.find((item: any) => item.RackName === rack.RackName)
                        if (!matchRack) {
                            setHideOptainBtn(true)
                        } else {
                            setHideOptainBtn(false)
                        }
                        const MountedRackProps: IRenderMountedRackProps = {
                            rack: rack,
                            availablePositions: matchRack?.availablePositions ?? [],
                            availableRackData: availableRacks,
                            rackmountedDevices: rackMountedDevices as any,
                            proposedPlacements: [DeviceList],
                            selectedRU: selectedRU.replace("RU", " ").trim(),
                            disabledSelectionRU: selectedRU ? true : false,
                            handleSelectRU: (ru: string, entId?: string) => {
                                props.handleRUSelect && props.handleRUSelect(ru, entId)
                            },
                            treeData: props.treeData,
                            views: views,
                            slots: rackSlots
                        }
                        setMountedRackProps(MountedRackProps)
                    } else {
                        setMountedRackProps(undefined)
                    }
                    if (showChart === false) {
                        setShowChart(true)
                        if (props.selectedFloorNode && props.selectedFloorNode.NodeType) {
                            handleDisplayChart(props.selectedFloorNode.NodeType, false)
                        }
                    }
                }
            }
        }
    }

    // handler to get tab details
    const getTabsDetails = () => {
        let sourceTabs: any[] = [];
        if (
            selectedFloorNode &&
            props.isFloorNode &&
            (props.featureId !== FEnums.AssetPlacement && props.featureId !== FEnums.Transfer && props.featureId !== FEnums.Delete && props.featureId !== FEnums.Relocate && props.featureId !== FEnums.InboundAssetPlacement)
        ) {
            sourceTabs = floorTabObj ?? [];
        } else {
            sourceTabs = tabObj ?? [];
        }
        return sourceTabs.map((t, index) => ({
            uniqueName: `${props.uniqueName}-overlay-tab-${index}`,
            label: {
                uniqueName: `${props.uniqueName}-overlay-tab-${index}-label`,
                label: t.label,
                tooltip: t.tooltip
            },
            w: "auto",
            h: "calc(var(--node_height) - var(--spacing-1))",
            actionCode: t.label,
            handleMouse: function (event: any, actionCode?: string): void {
                // add logic here if needed
            }
        }));
    };

    function handleSwitchLayout(event: MouseEvent | KeyboardEvent, actionCode?: string | undefined, payload?: Record<string, any> | undefined): void {
        setShowRowOfRacks(!showRowOfRacks);
    }

    return (
        <div className='nz-edit-floor-layout-main' tabIndex={1} onKeyDown={handleContainerKeyDown}>
            {!props.hideHeader && (
                <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                    <div className="nz-d-flex-row nz-align-center nz-w-100">
                        {(props.selectedNode && Number(props.selectedNode.HasChildren) > 0) && <ActionImage
                            uniqueName={`${props.uniqueName}-open-sidebar`}
                            image={{
                                uniqueName: `${props.uniqueName}-open-sidebar-image`,
                                source: showRowOfRacks ? <FloorLayout24x24
                                    size={FnGetCssVariable("--image-size-1")}
                                    fill="none"
                                    strokeWidth={1}
                                /> : <RowOfRacks24x24
                                    size={FnGetCssVariable("--image-size-1")}
                                    fill="none"
                                    strokeWidth={1}
                                />,
                                w: "var(--image-size-1)",
                                tooltip: showRowOfRacks ? "Click to view Floor Layout" : "Click to view Row of Racks",
                                type: "svg"
                            }}
                            w={"var(--image-size-2)"}
                            h={"var(--image-size-2)"}
                            actionCode={"open-sidebar"}
                            handleMouse={handleSwitchLayout}
                        />}
                        <OverlayTab
                            uniqueName={`${props.uniqueName}-replacement-overlay`}
                            tabs={getTabsDetails()}
                            allowUnSelect={true}
                            hideOverlayPanel={showRowOfRacks ? true : false}
                            selectedTabName={selectedTabs}
                            tabAlignment={"horizontal"}
                            headerText={`${showRowOfRacks ? "Row of Racks" : 'Floor Layout'}: ${props.selectedFloorNode.Name}`}
                            useContainer={false}
                            handleSelectedTab={handleSelectedTabs}
                            ShowOnlyIcon={true}
                        />
                    </div>
                    {!props.hideSidebarBtn && <ActionImage uniqueName={`${props.uniqueName}-explorer-tree-info-ai`}
                        image={{
                            uniqueName: `${props.uniqueName}-explorer-tree-info-image`,
                            source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                                fill="none"
                                strokeWidth={1} />,
                            w: 'var(--image-size-2)',
                            tooltip: "Click to view node details in sidebar",
                            type: "svg"
                        }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'} handleMouse={handleClickInformation} />}
                </div>
            )}
            {showRowOfRacks && props.selectedNode ? <RowOfRacksContainer uniqueName={`${props.uniqueName}-row-of-racks`}

                featureId={props.featureId}
                selectedNode={props.selectedNode}
                handleShowUserMessage={props.handleShowUserMessage}
            /> : <>
                <Splitter tabIndex={-1} className='nz-w-100 nz-h-100 '>
                    <SplitterPanel tabIndex={-1} size={50} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-left-pane" >
                        <div className='nz-layout-container' key={props.uniqueName} style={{ flexDirection: props.allowEdit ? 'row' : 'column', position: 'relative' }}>
                            <div className='nz-filter-container'>
                                {!props.hideSearchControl && <SearchControl uniqueName={`${props.uniqueName}-search`}
                                    isShowFilterControl={false}
                                    lensDirty={(searchText || "")?.length > 0}
                                    filterDirty={false}
                                    searchInputValue={searchText || ""}
                                    hideSearchControl={false}
                                    hideRightMouseMenu={false}
                                    filterIconTooltip='Filter'
                                    searchValueChange={(value: string) => {
                                        setSearchText(value);
                                    }}
                                    handleLensMouse={(selectedCondion: "AND" | string = "AND") => {
                                        if (searchText && (searchText || "").length > 0) {
                                            handleKeywordSearch(searchText, selectedCondion === "AND");
                                        }
                                    }} handleFilterMouse={function (): void {
                                        // Handle if needed
                                    }} />}
                            </div>
                            {selectedFloorNode && <InMemoryUrlProvider> <EditFloorLayout
                                uniqueName={`${props.uniqueName}-edit-floor-layout`}
                                featureId={props.featureId}
                                mode={"canvas"}
                                allowEdit={false}
                                selectedFloorNode={selectedFloorNode}
                                statusBarContext={statusBarContext}
                                selectedPlacement={placementDevice}
                                selectedNode={props.selectedNode}
                                availableRacks={availableRacks}
                                selectDcExplorer={selectDcExplorer}
                            /></InMemoryUrlProvider>}

                        </div>
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={50} minSize={10} className={`nz-d-flex-column nz-align-center nz-right-pane nz-chart-with-sub-header-pane nz-floor-layout-device-chart-splitter ${props.selectedFloorNode && props.selectedFloorNode.NodeType === "MountedDevice" ? 'nz-chart-mounted-device' : 'nz-chart-device-preview'} nz-chart-hidden`}>
                        <div className="nz-device-chart-container">
                            <div className="nz-sub-header">
                                {props.overlayButtonForDevice && props.overlayButtonForDevice.length > 0 && hideOptainBtn === false ?
                                    <OverlayTab
                                        uniqueName={`${props.uniqueName}-replacement-overlay-tab`}
                                        tabs={props.overlayButtonForDevice.map((t: any, index) => ({
                                            uniqueName: `${props.uniqueName}-overlay-tab-${index}`,
                                            label: {
                                                uniqueName: `${props.uniqueName}-overlay-tab-${index}-label`,
                                                label: t.label,
                                                tooltip: t.tooltip
                                            },
                                            w: "auto",
                                            h: "calc(var(--node_height) - var(--spacing-1))",
                                            actionCode: t.label,
                                            handleMouse: function (event: any, actionCode?: string): void {
                                                // add logic here if needed
                                            }
                                        }))}
                                        ShowOnlyIcon={true}
                                        allowUnSelect={true}
                                        selectedTabName={""}
                                        tabAlignment={"horizontal"}
                                        headerText={`${displayMode} For ${selectedFloorNode?.Name ?? props.selectedFloorNode.Name}`}
                                        useContainer={false}
                                        handleSelectedTab={(tabs: string[]) => {
                                            if (tabs.length) {
                                                const racks: any = ApiObjectForFloorData?.racks;
                                                const rack: any = Array.isArray(racks) ? racks.find((item: any) => item.EntId === selectedNodeFromLayout?.NodeEntID || item.EntId === selectedNodeFromLayout?.key) : undefined;

                                                const payloadWithNodePath = {
                                                    ...selectedNodeFromLayout,
                                                    ...(selectedNodeFromLayout?.NodePath ? { NodePath: selectedNodeFromLayout.NodePath } : rack?.NodePath ? { NodePath: rack.NodePath } : {})
                                                };
                                                props.handleOverlayButtonForDeviceClick && props.handleOverlayButtonForDeviceClick(tabs[0], payloadWithNodePath, placementDevice)
                                            }
                                        }}
                                    /> : `${displayMode} For ${selectedFloorNode?.Name ?? props.selectedFloorNode.Name}`}
                                <div className='nz-floor-layou-device-action-button'>
                                    <ActionImage
                                        image={{
                                            uniqueName: "cancel",
                                            source: <Close24x24
                                                size={FnGetCssVariable('--image-size-2')}
                                                fill='none'
                                                strokeWidth={1} />,
                                            type: "svg",
                                            w: "var(--image-size-2)",
                                            h: "var(--image-size-2)",
                                            tooltip: `Close ${displayMode}`
                                        }}
                                        uniqueName='cancelIcon'
                                        actionCode='cancel'
                                        w='var(--node_height)'
                                        handleMouse={() => {
                                            setShowChart(false)
                                            setViews([])
                                            setSelectedNodeFromLayout(undefined)
                                            RefSelectedNodeFromLayout.current = null
                                            setMountedRackProps(undefined)
                                            if (props.selectedFloorNode && props.selectedFloorNode.NodeType)
                                                handleDisplayChart(props.selectedFloorNode.NodeType, true)
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={`nz-device-chart-view ${displayMode === "Ask" ? "nz-ask-floor-views" : ""}`}
                                style={{ position: 'relative', height: '100%', width: '100%' }}>
                                {showChart && displayMode === "Chart" &&
                                    <DashboardChart
                                        hideHeader={true} title='Dashboardchart'
                                        uniqueName={props.uniqueName} featureId={props.featureId}
                                        outputFormat={"jsx"} displayPerRow={1} isDashboard={false}
                                        selectedNode={props.selectedFloorNode}
                                        parentClassName={props.selectedFloorNode && props.selectedFloorNode.NodeType === "MountedDevice" ? 'nz-chart-mounted-device' : 'nz-chart-device-preview'}
                                    />
                                }
                                {
                                    displayMode === "Device" && isViewLoaded ? (
                                        <div className="nz-w-100 nz-h-100 nz-d-flex-hv-left">Loading...</div>
                                    ) : views && views?.length > 0 ? (
                                        <ViewContainer
                                            views={views}
                                            responsive={true}
                                            title={"Preview"}
                                            uniqueName={"Preview pane"}
                                            isEncrypted={false}
                                            hideTreeDView={!is3dEnabledRef.current ? true : false}
                                            viewType={"device"}
                                            selectedNode={selectedNodeFromLayout}
                                            entID={""}
                                            ReckPositions={availableRacks}
                                            MountedRackProps={MountedRackProps}
                                            handleMouseDoubleClick={(event: React.MouseEvent, actionCode?: string) => {
                                            }}
                                            SvgParentJSONForThreeD={threeDviewSvg} viewLabel={viewLabel ?? undefined} featureId={props.featureId ?? ''} />
                                    ) : (
                                        displayMode === "Device" ? <div className="nz-w-100 nz-h-100 nz-d-flex-hv-left">Floor layout not found for: {props.selectedFloorNode.Name}</div> : <></>//  shown only if not loading
                                    )
                                }
                                {
                                    displayMode === "Ask" && selectedNodeAllProperties && props.selectedFloorNode && <div className='nz-Floor-ask-componet'>
                                        <AIContainer uniqueName={`${props.uniqueName}-fqa-info`}
                                            selectedNode={props.selectedFloorNode}
                                            featureId={props.featureId}
                                            sessionVars={sessionContext.SessionList}
                                            selectedAllProperties={selectedNodeAllProperties} />
                                    </div>
                                }
                            </div>
                        </div>
                    </SplitterPanel>
                </Splitter>
            </>}
            <YesNoFormContainer
                isOpen={deleteOpen}
                uniqueName={props.uniqueName}
                message={confirmMessage}
                showOkButton={showOkButton}
                handleNoButtonClick={() => {
                    setDeleteOpen(false);
                }}
                handleOkButtonClick={() => {
                    setDeleteOpen(false);
                }}
            />
        </div >
    )
}
export default FloorLayoutContainer 
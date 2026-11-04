
import { DragEvent, KeyboardEvent, MouseEvent, useCallback, useEffect, useRef, useState } from "react"
import { useCommonVariableContext } from "../../../shared/context/hooks/CommonVariableHooks"
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor"
import { useAgent } from "@n20a/libmcpclient"
import { DataTable, ImageObject, KonvaEditor, layoutConfig, TextObject, getObjectTemplate, Device, Location } from '@n20a/liblayout'
import '../../allcss/plan/EditFloorLayout.css'
import '@n20a/liblayout/style.css'
import { EM, LOG, MISC, NODE, STATS } from "../../../shared/interceptors/EndPoints"
import { IMenuItem, IMainMenu } from "../../../shared/allinterface/menu/IMainMenu"
import { IAvailableRack, IDragActionImage, IEditFloorLayout, IFloorRack, ILayoutTableRow, IMountedDevice, IMountedDeviceApiRow, IRackApiRow } from "../../../shared/allinterface/plan/IEditFloorLayout"
import { MainMenu } from "../../../shared/menu/mainmenu/MainMenu"
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer"
import { JsonViewer } from "../../../shared/jsonviewer/JsonViewer"
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl"
import { createRoot } from "react-dom/client"
import { getDiagnosticLevelData } from "../../../shared/context/contextandprovider/CommonVariable"
import { FnGenerateFloorLayoutConfig } from "../../allcommon/FnGenerateFloorLayoutConfig"
import { FnHideLayoutDevicesNotInTree } from "../../allcommon/FnHideLayoutDevicesNotInTree"
import { FnSaveFloorLayoutData } from "../../allcommon/FnSaveFloorLayoutData"
import { FnDeepClone } from "../../../shared/allcommon/basic/FnDeepClone"
import { FnResolveApisForFloorLayout } from "../../allcommon/FnResolveApisForFloorLayout"
import { FnGetApiProfiles } from "../../../shared/allcommon/FnGetApiProfiles"
import { FnGenerateUniqueId } from "../../../shared/allcommon/basic/FnGenerateUniqueId"
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely"
import { useInMemoryUrlContext } from "../../../shared/context/hooks/InMemoryUrlHooks"
import { useChartProfileContext } from "../../../shared/context/hooks/ChartProfileHooks"
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks"
import { useMainAppContext } from "../../../shared/context/hooks/MainAppHooks"
import { useExplorerTreeContext } from "../../../shared/context/hooks/ExplorerTreeHooks"
import { AppContextWrapper } from "../../../shared/context/AppContextWrapper"
import { FEnums } from "../../../constants/Feature"
import { DELIMITER } from "../../../shared/alldefaultprops/basic/DefaultPropsChekedListBoxControl"
import { InMemoryUrlProvider } from "../../../shared/context/contextandprovider/InMemoryUrl"
import { Label } from "../../../shared/basic/label/Label"
import { useSelectedNodeContext } from "../../../shared/context/hooks/SelectedNodeHooks"
import { GeneratePdf } from "../../../shared/generatepdf/GeneratePdf"
import { TReportLayoutJson } from "../../../shared/allinterface/IGeneratePdf"

const floorLayoutMenus = [
    {
        "disable": "FALSE",
        "objectName": "Text",
        "Label": "Text",
        "Tooltip": "Add a Label",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Pillar",
        "Label": "Pillar",
        "Tooltip": "Add Pillar",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Room",
        "Label": "Room",
        "Tooltip": "Add Room",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Space",
        "Label": "Space",
        "Tooltip": "Add Space",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Image",
        "Label": "Image",
        "Tooltip": "Add an Image",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Chart",
        "Label": "Chart",
        "Tooltip": "Add a Chart",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "DataTable",
        "Label": "Title Block",
        "Tooltip": "Add a Title Block",
        "separator": "",
        "draggable": "TRUE"
    }
]

const EditFloorLayout = (editFloorLayoutProps: IEditFloorLayout) => {

    const [actionImageProps, setActionImageProps] = useState<IMainMenu | null>(null)
    const [menuData, setMenuData] = useState<IMenuItem[]>();
    const [floorLayoutJson, setFloorLayoutJson] = useState<layoutConfig | null>();
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [showOkButtonOnly, setShowOkButtonOnly] = useState<boolean>(false);
    const [isSaveProcessing, setIsSaveProcessing] = useState<boolean>(false);
    const [isLayoutLoading, setIsLayoutLoading] = useState(true);
    const [selectedRack, setSelectedRack] = useState<{ EntID: string; EntityName: string } | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);
    const [layoutVersion, setLayoutVersion] = useState(0);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);

    const inMemoryUrlContext = useInMemoryUrlContext();
    const chartProfileContext = useChartProfileContext();
    const sessionContext = useSessionContext();
    const { sendPrompt } = useAgent();
    const commonVariableContext = useCommonVariableContext();
    const mainAppContext = useMainAppContext();


    const selectedNodeContext = useSelectedNodeContext();
    const explorerTreeContext = useExplorerTreeContext();
    const { isRefreshed, setIsRefreshed } = useExplorerTreeContext();
    const diagnosticLevel = getDiagnosticLevelData() ?? "0";

    const prevValuesRef = useRef({
        floorNodeId: undefined as string | undefined,
        featureId: undefined as string | number | undefined,
        allowEdit: undefined as boolean | undefined,
        isRefreshed: undefined as boolean | undefined,
    });
    const floorNodeRef = useRef<ITreeNode>(undefined);
    const sessionListRef = useRef(sessionContext.SessionList);
    const cachedTreeRef = useRef<ITreeNode[]>([]);

    // Keep latest session list for async save paths (avoids stale closures).
    useEffect(() => {
        sessionListRef.current = sessionContext.SessionList;
    }, [sessionContext.SessionList]);

    useEffect(() => {
        if (explorerTreeContext.originalTreeData.length) {
            cachedTreeRef.current = explorerTreeContext.originalTreeData
        }
    }, [explorerTreeContext.originalTreeData])


    const floorEntId = editFloorLayoutProps.selectedFloorNode?.NodeEntID;
    const placementProfile = editFloorLayoutProps.selectedPlacement;
    const sessionSiteId = sessionContext.SessionList.find(
        (item) => item.VariableName?.toLowerCase() === "siteid"
    )?.SessionValue;
    const sessionRoomId = sessionContext.SessionList.find(
        (item) => item.VariableName?.toLowerCase() === "roomid"
    )?.SessionValue;

    // Resolves border color for a floor device based on rack selection and availability.
    function FnGetFloorDeviceBorderColorPlacement(
        floordeviceEntName: string,
        floordeviceEntid: string,
        availableRacks: IAvailableRack[],
        selectedRack?: { EntID: string; EntityName: string }
    ): string {
        //  1. Selected Rack => RED
        if (
            selectedRack &&
            selectedRack.EntID.toLowerCase() === floordeviceEntid.toLowerCase()
            && selectedRack.EntityName.toLowerCase() === floordeviceEntName.toLowerCase()
        ) {
            return "red";
        }
        //  2. Available Rack => Blue
        const isAvailable = availableRacks?.some(
            (rack) =>
                rack.EntId.toLowerCase() === floordeviceEntid.toLowerCase() &&
                rack.EntityName.toLowerCase() === floordeviceEntName.toLowerCase()
        );
        if (isAvailable) {
            return "blue";
        }
        //  3. Default => no border
        return "";
    }

    // Syncs available rack list from props and bumps layout version for re-render.
    useEffect(() => {
        if (editFloorLayoutProps.availableRacks) {
            setLayoutVersion(v => v + 1);
        }
    }, [editFloorLayoutProps.availableRacks])

    // Initializes the vertical tool-strip menu for floor layout editing.
    // Resets tracked previous values when the component unmounts.
    useEffect(() => {
        if (floorLayoutMenus.length > 0) {
            setMenuData(floorLayoutMenus);
            let payload: IMainMenu = {
                uniqueName: "edit_floor_layout_menu",
                isVertical: true, // if true then action images should be displayed vertically
                w: "40px", // Width of the entire container
                h: "100%", // Height of the entire container
                bgColor: "var(--bgfeaturepane1)", // Background color of the container
                allowDND: true,
                featureData: floorLayoutMenus,
                menuSize: 'md',
                actionImageW: 40,
                actionImageH: 40,
            }
            setActionImageProps(payload)
        }
        return () => {
            prevValuesRef.current = {
                floorNodeId: undefined,
                featureId: undefined,
                allowEdit: undefined,
                isRefreshed: undefined
            };
        }
    }, [])

    // Hides the OK-only button when the confirmation dialog closes.
    useEffect(() => {
        if (isConfirmOpen === false) {
            setShowOkButtonOnly(false);
        }
    }, [isConfirmOpen])

    // Keeps a ref to the selected floor tree node for async layout loading.
    useEffect(() => {
        const node = editFloorLayoutProps.selectedFloorNode;
        if (!node?.NodeEntID) return;
        floorNodeRef.current = node;
    }, [editFloorLayoutProps.selectedFloorNode])

    // Bumps refresh token when explorer tree signals a data refresh.
    useEffect(() => {
        if (!isRefreshed) return;
        setRefreshToken(prev => prev + 1);
    }, [isRefreshed]);

    // Fetches floor layout data, builds JSON, and resolves API profiles for rendering.
    useEffect(() => {
        const abortController = new AbortController();
        const { signal } = abortController;
        const node = floorNodeRef.current;
        if (!node?.NodeEntID) {
            return () => abortController.abort();
        }
        try {
            editFloorLayoutProps.statusBarContext.setIsLoading(true);
            // Loads kebab-menu floor layout data and orchestrates template or existing layout resolution.
            const handleApiCallForFloorLayout = async (floorNode: ITreeNode) => {
                if (signal.aborted) return;
                await axiosInterceptor({
                    url: NODE.GetKebabMenuData,
                    data: {
                        entID: floorNode.NodeEntID,
                        entityName: floorNode.NodeEntityname,
                        kebabMenuTableName: "PG.FloorLayout"
                    },
                    signal,
                    setFetchData: async (getKebabMenuDataApiResponse: unknown, status?: string) => {
                        if (signal.aborted) return;
                        if (status === "200" && getKebabMenuDataApiResponse && typeof getKebabMenuDataApiResponse === "object" && 'propertyJson' in getKebabMenuDataApiResponse) {
                            // Wraps GetTableData fetch in a promise for sequential layout table lookups.
                            const awaitableFetchInterceptor = (params: Record<string, unknown>) => {
                                return new Promise<ILayoutTableRow[] | undefined>((resolve) => {
                                    if (signal.aborted) {
                                        resolve(undefined);
                                        return;
                                    }
                                    axiosInterceptor(
                                        {
                                            url: MISC.GetTableData,
                                            data: params.data,
                                            signal,
                                            setFetchData: (resp: unknown, status?: string) => {
                                                if (signal.aborted) {
                                                    resolve(undefined);
                                                    return;
                                                }
                                                if (status === "200" && resp && typeof resp === "object" && 'dataJson' in resp && resp.dataJson) {
                                                    const jsonData = FnParseJsonSafely(resp.dataJson as string);
                                                    if (jsonData && Array.isArray(jsonData) && jsonData.length) {
                                                        resolve(jsonData);
                                                    }
                                                    else {
                                                        resolve(undefined);
                                                    }
                                                    return;
                                                }
                                                resolve(undefined);
                                            }
                                        },
                                        editFloorLayoutProps.statusBarContext
                                    ).catch(() => resolve(undefined));
                                });
                            };
                            try {
                                const parsed = FnParseJsonSafely(getKebabMenuDataApiResponse.propertyJson as string);
                                const layoutArray = parsed?.["PG.FloorLayout"];
                                let floorLayoutJsonString = "";
                                if (Array.isArray(layoutArray) && layoutArray.length) {
                                    floorLayoutJsonString = layoutArray[0].FloorLayoutConfig;
                                }
                                if (!floorLayoutJsonString && floorNode.Name) {
                                    const locationLayouts = await awaitableFetchInterceptor(
                                        {
                                            data: { tableName: "PG.LocationLayout" }
                                        }
                                    );
                                    if (signal.aborted) return;
                                    const deviceLayouts = await awaitableFetchInterceptor(
                                        {
                                            data: { tableName: "PG.DeviceLayout" }
                                        }
                                    );
                                    if (signal.aborted) return;

                                    const newFloorLayoutTemplate = await FnGenerateFloorLayoutConfig(floorNode, editFloorLayoutProps.statusBarContext, locationLayouts, deviceLayouts, cachedTreeRef.current);
                                    if (signal.aborted) return;
                                    if (newFloorLayoutTemplate?.floorLayoutJson) {
                                        const clonedTemplate = FnDeepClone(newFloorLayoutTemplate?.floorLayoutJson);
                                        const latestSessionList = sessionListRef.current;
                                        const hasSiteAndRoom = latestSessionList.some(
                                            (item) => item.VariableName?.toLowerCase() === "siteid" && item.SessionValue
                                        ) && latestSessionList.some(
                                            (item) => item.VariableName?.toLowerCase() === "roomid" && item.SessionValue
                                        );
                                        if (!hasSiteAndRoom) {
                                            // Session location vars not ready yet; effect re-runs when SiteID/RoomID arrive.
                                            return;
                                        }
                                        const isSaved = await FnSaveFloorLayoutData(
                                            clonedTemplate,
                                            editFloorLayoutProps.statusBarContext,
                                            cachedTreeRef.current,
                                            newFloorLayoutTemplate.RecIDs
                                        );
                                        if (signal.aborted) return;
                                        if (isSaved) {
                                            floorNode.NodeEntID && selectedNodeContext.setDcNodeToRefresh({
                                                nodeToRefresh: floorNode,
                                                nodeToSelect: editFloorLayoutProps.selectedNode
                                            });
                                            setFloorLayoutJson(newFloorLayoutTemplate?.floorLayoutJson);
                                            setIsLayoutLoading(false);
                                        }
                                        else {
                                            setFloorLayoutJson(null);
                                            setIsLayoutLoading(false);
                                        }
                                    }
                                    else {
                                        setFloorLayoutJson(null);
                                        setIsLayoutLoading(false);
                                    }
                                }
                                else if (floorLayoutJsonString && prevValuesRef.current.isRefreshed) {
                                    try {
                                        if (Array.isArray(layoutArray) && layoutArray.length === 1) {
                                            const filtered = layoutArray[0];
                                            if (!filtered) return;
                                            let json = FnParseJsonSafely(layoutArray[0].FloorLayoutConfig) as layoutConfig;
                                            if (json) {
                                                // Fetches mounted devices for a rack via STATS API.
                                                const awaitableFetchInterceptorForMountedDevices = (params: Record<string, unknown>) => {
                                                    return new Promise<IMountedDeviceApiRow[] | undefined>((resolve) => {
                                                        if (signal.aborted) {
                                                            resolve(undefined);
                                                            return;
                                                        }
                                                        axiosInterceptor(
                                                            {
                                                                url: STATS.GetImountedDevice,
                                                                data: params,
                                                                signal,
                                                                setFetchData: (resp: unknown, status?: string) => {
                                                                    if (signal.aborted) {
                                                                        resolve(undefined);
                                                                        return;
                                                                    }
                                                                    if (status === "200" && resp && typeof resp === "object" && 'rackMountedDevicesJson' in resp && resp.rackMountedDevicesJson) {
                                                                        const jsonData = FnParseJsonSafely(resp.rackMountedDevicesJson as string);
                                                                        if (jsonData && Array.isArray(jsonData) && jsonData.length) {
                                                                            resolve(jsonData);
                                                                        }
                                                                        else { resolve(undefined); }
                                                                        return;
                                                                    }
                                                                    resolve(undefined);
                                                                }
                                                            },
                                                            editFloorLayoutProps.statusBarContext
                                                        ).catch(() => resolve(undefined));
                                                    });
                                                };
                                                // Fetches racks on the current floor via STATS API.
                                                const awaitableFetchInterceptorForRacks = (params: Record<string, unknown>) => {
                                                    return new Promise<IRackApiRow[] | undefined>((resolve) => {
                                                        if (signal.aborted) {
                                                            resolve(undefined);
                                                            return;
                                                        }
                                                        axiosInterceptor(
                                                            {
                                                                url: STATS.GetIfloorRack,
                                                                data: params,
                                                                signal,
                                                                setFetchData: (resp: unknown, status?: string) => {
                                                                    if (signal.aborted) {
                                                                        resolve(undefined);
                                                                        return;
                                                                    }
                                                                    if (status === "200" && resp && typeof resp === "object" && 'floorRacksJson' in resp && resp.floorRacksJson) {
                                                                        const jsonData = FnParseJsonSafely(resp.floorRacksJson as string);
                                                                        if (jsonData && Array.isArray(jsonData) && jsonData.length) {
                                                                            resolve(jsonData);
                                                                        }
                                                                        else { resolve(undefined); }
                                                                        return;
                                                                    }
                                                                    resolve(undefined);
                                                                }
                                                            },
                                                            editFloorLayoutProps.statusBarContext
                                                        ).catch(() => resolve(undefined));
                                                    });
                                                };
                                                const locationLayouts = await awaitableFetchInterceptor(
                                                    {
                                                        data: { tableName: "PG.LocationLayout" }
                                                    }
                                                );
                                                if (signal.aborted) return;
                                                const deviceLayouts = await awaitableFetchInterceptor(
                                                    {
                                                        data: { tableName: "PG.DeviceLayout" }
                                                    }
                                                );
                                                if (signal.aborted) return;
                                                let racksInFloor: IRackApiRow[] | undefined = [];
                                                if (!prevValuesRef.current.allowEdit && (prevValuesRef.current.featureId === FEnums.AssetPlacement
                                                    || prevValuesRef.current.featureId === FEnums.Transfer
                                                    || prevValuesRef.current.featureId === FEnums.Delete
                                                    || prevValuesRef.current.featureId === FEnums.Relocate
                                                    || prevValuesRef.current.featureId === FEnums.InboundAssetPlacement) && editFloorLayoutProps.selectedPlacement) {
                                                    racksInFloor = await awaitableFetchInterceptorForRacks(
                                                        {
                                                            floorID: floorNode.NodeEntID
                                                        }
                                                    );
                                                    if (signal.aborted) return;
                                                }
                                                const floorRacks: IFloorRack[] = [];
                                                const mountedDevices: IMountedDevice[] = [];
                                                // Walks the floor tree and merges location/device layout configs into the page JSON.
                                                const traverseFloorLayout = async (
                                                    layout: layoutConfig,
                                                    floorNodes: ITreeNode[]
                                                ) => {
                                                    if (!layout) return;

                                                    layout.locationArray = [];
                                                    layout.deviceArray = [];

                                                    const walk = async (
                                                        nodes: ITreeNode[],
                                                        parentNode?: ITreeNode
                                                    ) => {
                                                        for (const node of nodes) {
                                                            const nodeType = node.NodeType?.toLowerCase();

                                                            // ---------------- LOCATION ----------------
                                                            if (nodeType === "location" && node.Name) {
                                                                const locData = locationLayouts?.find(
                                                                    item => item.EntID === node.NodeEntID
                                                                );

                                                                let loc: Location | undefined;

                                                                if (locData) {
                                                                    if (locData.LocationLayoutConfig) {
                                                                        loc =
                                                                            typeof locData.LocationLayoutConfig === "string"
                                                                                ? FnParseJsonSafely(locData.LocationLayoutConfig)
                                                                                : locData.LocationLayoutConfig;
                                                                        if (loc) {
                                                                            loc.w = Number(locData.Width ?? loc.w);
                                                                            loc.h = Number(locData.Length ?? loc.h);
                                                                        }
                                                                    } else {
                                                                        const id = FnGenerateUniqueId();
                                                                        loc = getObjectTemplate('location', id) as Location;

                                                                        loc.name = node.Name;
                                                                        loc.entId = node.NodeEntID ?? "";
                                                                        loc.entityName = node.NodeEntityname ?? "";
                                                                        loc.parentId = parentNode?.NodeEntID ?? "";

                                                                        loc.x = Number(locData.LeftPos ?? 0);
                                                                        loc.y = Number(locData.TopPos ?? 0);
                                                                        loc.w = Number(locData.Width ?? loc.w);
                                                                        loc.h = Number(locData.Length ?? loc.h);

                                                                        loc.border = {
                                                                            bordercolor: locData.BorderColor ? locData.BorderColor as string : loc.border?.bordercolor ?? "",
                                                                            borderpx: locData.BorderWidth !== undefined &&
                                                                                locData.BorderWidth !== null
                                                                                ? Number(locData.BorderWidth)
                                                                                : loc.border?.borderpx ?? 0
                                                                        };
                                                                    }

                                                                    if (loc) {
                                                                        loc.deviceArray = [];
                                                                        layout.locationArray?.push(loc);
                                                                    }
                                                                }
                                                            }

                                                            // ---------------- FLOOR / LOCATION DEVICE ----------------
                                                            if (
                                                                nodeType &&
                                                                node.Type?.toLowerCase() === "floordevice" &&
                                                                node.Name &&
                                                                parentNode
                                                            ) {
                                                                const devData = deviceLayouts?.find(
                                                                    item => item.EntID === node.NodeEntID
                                                                );

                                                                let dev: Device | undefined;

                                                                if (devData) {
                                                                    if (devData.DeviceLayoutConfig) {
                                                                        dev =
                                                                            typeof devData.DeviceLayoutConfig === "string"
                                                                                ? FnParseJsonSafely(devData.DeviceLayoutConfig)
                                                                                : devData.DeviceLayoutConfig;
                                                                    } else {
                                                                        const id = FnGenerateUniqueId();
                                                                        dev = getObjectTemplate('device', id) as Device;

                                                                        dev.name = node.Name;
                                                                        dev.entityName = node.NodeEntityname ?? "";
                                                                        dev.entId = node.NodeEntID ?? "";
                                                                        dev.deviceType = nodeType;
                                                                        dev.parentId = parentNode.NodeEntID ?? "";

                                                                        if (parentNode?.NodeType?.toLowerCase() === "location") {
                                                                            dev.locationEntId = parentNode.NodeEntID ?? undefined;
                                                                            dev.locationEntityName = parentNode.NodeEntityname ?? undefined;
                                                                        }

                                                                        dev.x = Number(devData.LeftPos ?? 0);
                                                                        dev.y = Number(devData.TopPos ?? 0);
                                                                        dev.w = Number(devData.Width ?? dev.w);
                                                                        dev.h = Number(devData.Length ?? dev.h);

                                                                        dev.border = {
                                                                            bordercolor: devData.BorderColor ? devData.BorderColor as string : dev.border?.bordercolor ?? "",
                                                                            borderpx:
                                                                                devData.BorderWidth !== undefined &&
                                                                                    devData.BorderWidth !== null
                                                                                    ? Number(devData.BorderWidth)
                                                                                    : dev.border?.borderpx ?? 0
                                                                        };
                                                                    }

                                                                    if (dev) {
                                                                        if (
                                                                            dev.entityName?.toLowerCase() === "__rack" &&
                                                                            dev.entId &&
                                                                            racksInFloor?.length
                                                                        ) {
                                                                            const rackFound = racksInFloor.find(
                                                                                item => item.EntId === dev!.entId
                                                                            );

                                                                            if (rackFound) {
                                                                                floorRacks.push({
                                                                                    RackName: rackFound.RackName,
                                                                                    EntId: rackFound.EntId,
                                                                                    EntityName: rackFound.EntityName,
                                                                                    FreePowerAvailable:
                                                                                        rackFound.FreePowerAvailable,
                                                                                    FreeThermal: rackFound.FreeThermal,
                                                                                    totalRU: rackFound.totalRU,
                                                                                    FreeRU: rackFound.FreeRU,
                                                                                    FreePowerPort:
                                                                                        rackFound.FreePowerPort,
                                                                                    FreeNetworkPort:
                                                                                        rackFound.FreeNetworkPort,
                                                                                    FreeWeight: rackFound.TotalWeight
                                                                                });
                                                                            }
                                                                        }

                                                                        // ---------- DEVICE UNDER FLOOR ----------
                                                                        if (
                                                                            parentNode.NodeType?.toLowerCase() === "floor"
                                                                        ) {
                                                                            layout.deviceArray?.push(dev);
                                                                        }
                                                                        // ---------- DEVICE UNDER LOCATION ----------
                                                                        else if (
                                                                            parentNode.NodeType?.toLowerCase() ===
                                                                            "location"
                                                                        ) {
                                                                            const parentLocation =
                                                                                layout.locationArray?.find(
                                                                                    loc =>
                                                                                        loc.entId ===
                                                                                        parentNode.NodeEntID
                                                                                );

                                                                            if (parentLocation) {
                                                                                parentLocation.deviceArray ??= [];
                                                                                parentLocation.deviceArray.push(dev);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }

                                                            // ---------------- RECURSE ----------------
                                                            if (
                                                                node.children?.length &&
                                                                (nodeType === "floor" || nodeType === "location")
                                                            ) {
                                                                await walk(node.children, node);
                                                            }
                                                        }
                                                    };

                                                    await walk(floorNodes);
                                                };
                                                await traverseFloorLayout(json, [floorNode]);
                                                if (signal.aborted) return;
                                                if (!prevValuesRef.current.allowEdit) {
                                                    if ((prevValuesRef.current.featureId === FEnums.AssetPlacement
                                                        || prevValuesRef.current.featureId === FEnums.Transfer
                                                        || prevValuesRef.current.featureId === FEnums.Delete
                                                        || prevValuesRef.current.featureId === FEnums.Relocate
                                                        || prevValuesRef.current.featureId === FEnums.InboundAssetPlacement) && placementProfile) {
                                                        if (floorRacks.length) {
                                                            for (let index = 0; index < floorRacks.length; index++) {
                                                                const element = floorRacks[index];
                                                                const mountedDeviceList = await awaitableFetchInterceptorForMountedDevices({
                                                                    rackID: element.EntId
                                                                });
                                                                if (signal.aborted) return;
                                                                if (mountedDeviceList?.length) {
                                                                    for (let index = 0; index < mountedDeviceList.length; index++) {
                                                                        const element = mountedDeviceList[index];
                                                                        mountedDevices.push(
                                                                            {
                                                                                EntId: element.EntId,
                                                                                Name: element.Name,
                                                                                EntityName: element.EntityName,
                                                                                RackName: element.RackName,
                                                                                RackEntName: element.RackEntName,
                                                                                RackEntId: element.RackEntId,
                                                                                StartMountIndex: 15,
                                                                                RURequired: element.RURequired,
                                                                                PowerPort: element.PowerPort,
                                                                                NetworkPort: element.NetworkPort,
                                                                                Weight: element.Weight,
                                                                            }
                                                                        )
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        if (signal.aborted) return;
                                                        setIsLayoutLoading(false);
                                                    }
                                                    const clonnedJson = FnDeepClone(json);
                                                    // Resolves API profile URLs and applies them to the layout JSON.
                                                    try {
                                                        const profiles = await FnGetApiProfiles(mainAppContext, editFloorLayoutProps.statusBarContext);
                                                        if (signal.aborted) return;
                                                        if (inMemoryUrlContext) {
                                                            json = await FnResolveApisForFloorLayout(clonnedJson,
                                                                {
                                                                    InMemoryUrlContext: inMemoryUrlContext,
                                                                    statusBarContext: editFloorLayoutProps.statusBarContext,
                                                                    chartProfileContext: chartProfileContext,
                                                                    sessionContext: sessionContext,
                                                                    apiProfiles: profiles,
                                                                    isReturnCurrentURL: true,
                                                                    sendPrompt: sendPrompt
                                                                }
                                                            );
                                                        }
                                                        if (signal.aborted) return;
                                                        setFloorLayoutJson(json);
                                                        setIsLayoutLoading(false);
                                                    } catch (error) {
                                                        console.error('Entity record response error:', error);
                                                        if (!signal.aborted) {
                                                            editFloorLayoutProps.statusBarContext?.setFetchError(["Failed to process entity records."]);
                                                        }
                                                    }
                                                    finally {
                                                        if (!signal.aborted) {
                                                            setIsLayoutLoading(false);
                                                        }
                                                    }
                                                }
                                                else {
                                                    if (signal.aborted) return;
                                                    setFloorLayoutJson(json);
                                                    setIsLayoutLoading(false);
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        console.error('error in generate layout json  :', error);
                                        if (!signal.aborted) {
                                            setIsLayoutLoading(false);
                                        }
                                    }
                                }
                                else {

                                    // Highlights available-rack devices with a red border on the layout page.
                                    function updateDeviceArrayByEntId(
                                        pageObj: layoutConfig,
                                        secondArray: IAvailableRack[]
                                    ) {
                                        if (!pageObj) return pageObj;
                                        const entIdSet = new Set(
                                            secondArray.map(item => item.EntId?.toUpperCase())
                                        );
                                        // Applies red border styling to devices whose entId matches an available rack.
                                        const updateBorder = (device: Device) => {
                                            if (device.entId && entIdSet.has(device.entId?.toUpperCase())) {
                                                return {
                                                    ...device,
                                                    border: {
                                                        borderpx: 3,
                                                        bordercolor: "Red",
                                                    },
                                                };
                                            }
                                            return device;
                                        };
                                        return {
                                            ...pageObj,
                                            //  Update location devices
                                            locationArray: pageObj.locationArray?.map((location: Location) => ({
                                                ...location,
                                                deviceArray: location.deviceArray?.map(updateBorder),
                                            })),
                                            //  Update root devices
                                            deviceArray: pageObj.deviceArray?.map(updateBorder),
                                        };
                                    }
                                    try {
                                        const parsedJson = FnParseJsonSafely(floorLayoutJsonString);
                                        if (editFloorLayoutProps.allowEdit && parsedJson) {
                                            if (signal.aborted) return;

                                            // Hide devices in layout JSON that are not under selectedFloorNode children (explorer-visible).
                                            const visibleJson = FnHideLayoutDevicesNotInTree(
                                                parsedJson,
                                                editFloorLayoutProps.selectedFloorNode,
                                                editFloorLayoutProps.featureId
                                            );
                                            if (editFloorLayoutProps.AvailableRack?.length) {
                                                const updateJson = updateDeviceArrayByEntId(visibleJson, editFloorLayoutProps.AvailableRack);
                                                setFloorLayoutJson(updateJson);
                                                setIsLayoutLoading(false);
                                            } else {
                                                setFloorLayoutJson(visibleJson);
                                                setIsLayoutLoading(false);
                                            }
                                        }
                                        else {
                                            if (parsedJson && typeof parsedJson === "object" && inMemoryUrlContext) {
                                                const profiles = await FnGetApiProfiles(mainAppContext, editFloorLayoutProps.statusBarContext);
                                                if (signal.aborted) return;
                                                const json = await FnResolveApisForFloorLayout(parsedJson,
                                                    {
                                                        InMemoryUrlContext: inMemoryUrlContext,
                                                        statusBarContext: editFloorLayoutProps.statusBarContext,
                                                        chartProfileContext: chartProfileContext,
                                                        sessionContext: sessionContext,
                                                        apiProfiles: profiles,
                                                        isReturnCurrentURL: true,
                                                        sendPrompt: sendPrompt
                                                    }
                                                );
                                                if (signal.aborted) return;
                                                if (editFloorLayoutProps.featureId === FEnums.Relocate) {
                                                    setFloorLayoutJson(json);
                                                    setIsLayoutLoading(false);
                                                }
                                                else {

                                                    // Hide devices in layout JSON that are not under selectedFloorNode children (explorer-visible).
                                                    const visibleJson = FnHideLayoutDevicesNotInTree(
                                                        json,
                                                        editFloorLayoutProps.selectedFloorNode,
                                                        editFloorLayoutProps.featureId
                                                    );
                                                    if (editFloorLayoutProps.AvailableRack?.length) {
                                                        const updateJson = updateDeviceArrayByEntId(visibleJson, editFloorLayoutProps.AvailableRack);
                                                        setFloorLayoutJson(updateJson);
                                                        setIsLayoutLoading(false);
                                                    } else {
                                                        setFloorLayoutJson(visibleJson);
                                                        setIsLayoutLoading(false);
                                                    }
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        console.error('error in generate layout json :', error);
                                        if (!signal.aborted) {
                                            setIsLayoutLoading(false);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error("Error parsing propertyJson:", error);
                                if (!signal.aborted) {
                                    setIsLayoutLoading(false);
                                }
                            }
                            finally {
                                if (!signal.aborted) {
                                    setIsRefreshed(false);
                                }
                            }
                        }
                        else {
                            if (signal.aborted) return;
                            editFloorLayoutProps.handleShowUserMessage?.(`Floor layout data not found for: ${floorNodeRef.current?.Name ?? floorNode.Name}`)
                            setIsRefreshed(false);
                            setIsLayoutLoading(false);
                        }
                    }
                }, editFloorLayoutProps.statusBarContext)
            }
            void handleApiCallForFloorLayout(node).catch((error) => {
                if (signal.aborted) return;
                console.error('error in generate layout json :', error);
            });
        } catch (error) {
            console.error('error in generate layout json :', error);
        }
        finally {
            if (!signal.aborted) {
                setIsLayoutLoading(false)
                editFloorLayoutProps.statusBarContext.setIsLoading(false);
            }
        }

        return () => {
            abortController.abort();
        };
    }, [floorEntId, placementProfile, refreshToken, editFloorLayoutProps.AvailableRack, sessionContext.SessionList?.length, sessionSiteId, sessionRoomId, mainAppContext.apiProfileRecords?.length])

    // Detects floor/feature/refresh changes, resets layout state, and tears down in-memory URLs.
    useEffect(() => {
        const { selectedFloorNode, featureId, allowEdit } = editFloorLayoutProps;
        const prev = prevValuesRef.current;
        const floorNodeId = selectedFloorNode?.NodeEntID ?? undefined;
        const hasChanged =
            prev.floorNodeId !== floorNodeId ||
            prev.featureId !== featureId ||
            prev.allowEdit !== allowEdit ||
            (prev.isRefreshed !== isRefreshed && isRefreshed === true);
        if (!hasChanged) {
            return;
        }

        const sameFloor =
            prev.floorNodeId !== undefined &&
            prev.floorNodeId === floorNodeId;
        const featureOrEditChanged =
            prev.featureId !== featureId ||
            prev.allowEdit !== allowEdit;

        setIsLayoutLoading(true);
        // Cleanup
        setFloorLayoutJson(undefined);
        if (!allowEdit) {
            inMemoryUrlContext && inMemoryUrlContext.FnDestroyInMemoryUrls();
        }

        // Update previous values
        prevValuesRef.current = {
            floorNodeId,
            featureId,
            allowEdit,
            isRefreshed
        };

        // Same floor + feature/edit change does not change floorEntId, so the
        // fetch effect would not re-run and Loading would stick. Bump refresh.
        if (sameFloor && featureOrEditChanged) {
            setRefreshToken(token => token + 1);
        }
    }, [
        editFloorLayoutProps.selectedFloorNode?.NodeEntID,
        editFloorLayoutProps.featureId,
        editFloorLayoutProps.allowEdit,
        isRefreshed
    ]);

    // Serializes dragged menu action data into the drag transfer payload.
    const handleDrag = useCallback(
        (
            event: DragEvent<HTMLDivElement>,
            actionCode?: unknown
        ) => {
            event.dataTransfer.setData(
                "custom/type",
                JSON.stringify(actionCode)
            );

            event.dataTransfer.effectAllowed = "move";
        },
        []
    );

    // Shows audit confirmation dialog when a menu item triggers a "new" action.
    const handleMouse = useCallback(
        (
            event:
                | MouseEvent<HTMLDivElement>
                | KeyboardEvent<HTMLDivElement>
                | undefined,
            actionCode?: string
        ) => {
            if (
                event &&
                typeof actionCode === "string" &&
                actionCode.toLowerCase() === "new"
            ) {
                axiosInterceptor(
                    {
                        url: LOG.CreateMessage,
                        data: {
                            projectInitial: "Audit",
                            msgID: "151",
                            optionalMessage: `create ${actionCode}`
                        },
                        setFetchData: (
                            createMessageApiResponse: unknown
                        ) => {
                            if (
                                createMessageApiResponse &&
                                typeof createMessageApiResponse === "object" &&
                                "finalMessage" in createMessageApiResponse
                            ) {
                                setShowOkButtonOnly(false);
                                setConfirmMessage(
                                    createMessageApiResponse.finalMessage as string
                                );
                                setIsConfirmOpen(true);
                            }
                        }
                    },
                    editFloorLayoutProps.statusBarContext
                );
            }
        },
        [editFloorLayoutProps.statusBarContext]
    );


    // Closes the confirmation dialog on yes-button click.
    const handleConfirmYesClick = useCallback(() => {
        setIsConfirmOpen(false);
    }, []);

    // Builds a layout object template and attaches it to the drag event for drop onto canvas.
    const handleDragStart = useCallback(
        (
            event: DragEvent<HTMLDivElement>,
            actionCode?: IDragActionImage
        ) => {
            let objectToTransfer:
                | TextObject
                | ImageObject
                | DataTable
                | null = null;

            const id = FnGenerateUniqueId() as string;

            switch (actionCode?.actionCode) {
                case "Text":
                    objectToTransfer =
                        getObjectTemplate("text", id) as TextObject;
                    break;

                case "Pillar":
                    objectToTransfer =
                        getObjectTemplate("pillar", id) as ImageObject;
                    break;

                case "Room":
                    objectToTransfer =
                        getObjectTemplate("room", id) as ImageObject;
                    break;

                case "Space":
                    objectToTransfer =
                        getObjectTemplate("space", id) as ImageObject;
                    break;

                case "Image":
                    objectToTransfer =
                        getObjectTemplate("image", id) as ImageObject;
                    break;

                case "Chart":
                    objectToTransfer =
                        getObjectTemplate("chart", id) as ImageObject;
                    break;

                case "Title Block":
                    objectToTransfer =
                        getObjectTemplate("datatable", id) as DataTable;
                    break;

                default:
                    break;
            }

            event.dataTransfer.setData(
                "objectTemplate",
                JSON.stringify(objectToTransfer)
            );
        },
        []
    );
    // Collects location and device entity IDs from the floor tree for layout cleanup on save.
    const getNodeEntIdsByType = (node: ITreeNode): {
        locationIds: string[];
        deviceIds: string[];
    } => {
        const result = {
            locationIds: [] as string[],
            deviceIds: [] as string[],
        };

        // Recursively collects location and device entity IDs from a tree node.
        const traverse = (current: ITreeNode) => {
            if (!current) return;

            const nodeType = current.NodeType?.toLowerCase();
            const treeType = current.treetype?.toLowerCase();

            if (current.NodeEntID) {
                if (nodeType === "location") {
                    result.locationIds.push(current.NodeEntID);
                } else if (treeType === "device") {
                    result.deviceIds.push(current.NodeEntID);
                }
            }

            if (current.children && current.children.length > 0) {
                current.children.forEach(traverse);
            }
        };

        traverse(node);

        return result;
    };

    // Deletes existing location/device layouts then persists the updated floor layout JSON.
    const handleSaveFloorLayout = useCallback(
        async (data: layoutConfig) => {
            if (editFloorLayoutProps.selectedFloorNode) {
                const { locationIds, deviceIds } =
                    getNodeEntIdsByType(
                        editFloorLayoutProps.selectedFloorNode
                    );

                if (locationIds.length) {
                    await new Promise<boolean>((resolve) => {
                        axiosInterceptor(
                            {
                                url: EM.DeleteTableRecords,
                                data: {
                                    tableName: "PG.LocationLayout",
                                    entIDs: locationIds.join(
                                        DELIMITER.separator
                                    )
                                },
                                allowShowLoader: true,
                                setFetchData: (
                                    _resp: unknown,
                                    status?: string
                                ) => {
                                    resolve(status === "200");
                                }
                            },
                            editFloorLayoutProps.statusBarContext
                        );
                    });
                }

                if (deviceIds.length) {
                    await new Promise<boolean>((resolve) => {
                        axiosInterceptor(
                            {
                                url: EM.DeleteTableRecords,
                                data: {
                                    tableName: "PG.DeviceLayout",
                                    entIDs: deviceIds.join(
                                        DELIMITER.separator
                                    )
                                },
                                allowShowLoader: true,
                                setFetchData: (
                                    _resp: unknown,
                                    status?: string
                                ) => {
                                    resolve(status === "200");
                                }
                            },
                            editFloorLayoutProps.statusBarContext
                        );
                    });
                }
            }

            if (isSaveProcessing) {
                return;
            }

            setIsSaveProcessing(true);

            if (data) {
                const clonedData = FnDeepClone(data);

                try {
                    const isSaved =
                        await FnSaveFloorLayoutData(
                            clonedData,
                            editFloorLayoutProps.statusBarContext,
                            cachedTreeRef.current
                        );

                    if (!isSaved) {
                        editFloorLayoutProps.handleShowUserMessage?.(
                            "Oops! Something wrong in save floor layout."
                        );
                    } else {
                        editFloorLayoutProps.selectedFloorNode
                            ?.NodeEntID &&
                            selectedNodeContext.setDcNodeToRefresh({
                                nodeToRefresh:
                                    editFloorLayoutProps.selectedFloorNode,
                                nodeToSelect:
                                    editFloorLayoutProps.selectedNode
                            });
                    }
                } catch (error) {
                    console.error(
                        "error in save layout :",
                        error
                    );

                    editFloorLayoutProps.handleShowUserMessage?.(
                        "Something went wrong in save floor layout"
                    );
                } finally {
                    setIsSaveProcessing(false);
                }
            }
        },
        [
            editFloorLayoutProps.selectedFloorNode,
            editFloorLayoutProps.selectedNode,
            editFloorLayoutProps.statusBarContext,
            editFloorLayoutProps.handleShowUserMessage,
            isSaveProcessing,
            selectedNodeContext
        ]
    );

    // Logs page updates in development mode for debugging.
    const handlePageUpdate = useCallback(
        (page: layoutConfig): void => {
            if (import.meta.env.DEV) {
                console.log("page :", page);
            }
        },
        []
    );

    // Logs selected canvas object id changes in development mode for debugging.
    const handleSelectedIdChanged = useCallback(
        (id: string | null): void => {
            if (import.meta.env.DEV) {
                console.log("id :", id);
            }
        },
        []
    );

    const handleCallbackClick = useCallback(
        (entityName?: string, entId?: string) => {
            setLayoutVersion(v => v + 1);

            if (entityName && entId) {
                setSelectedRack({
                    EntityName: entityName,
                    EntID: entId
                });
            }

            editFloorLayoutProps.selectDcExplorer?.(
                undefined,
                undefined,
                entityName,
                entId
            );
        },
        [editFloorLayoutProps.selectDcExplorer]
    );

    const handleCallbackCtrlClick = useCallback(
        (entityName?: string, entId?: string) => {
            setLayoutVersion(v => v + 1);

            if (entityName && entId) {
                setSelectedRack({
                    EntityName: entityName,
                    EntID: entId
                });
            }

            editFloorLayoutProps.selectDcExplorer?.(
                undefined,
                undefined,
                entityName,
                entId
            );
        },
        [editFloorLayoutProps.selectDcExplorer]
    );

    const handleFloorDeviceColor = useCallback(
        (
            entityName?: string,
            entId?: string
        ): string => {
            if (
                entityName &&
                entId &&
                editFloorLayoutProps.availableRacks
            ) {
                return FnGetFloorDeviceBorderColorPlacement(
                    entityName,
                    entId,
                    editFloorLayoutProps.availableRacks,
                    selectedRack ?? undefined
                );
            }

            if (
                entId?.toLowerCase() ===
                editFloorLayoutProps.selectedNode?.NodeEntID?.toLowerCase()
            ) {
                return "red";
            }

            return "";
        },
        [
            editFloorLayoutProps.availableRacks,
            editFloorLayoutProps.selectedNode?.NodeEntID,
            selectedRack
        ]
    );

    const handleFloorLocationColor = useCallback(
        (
            _entityName?: string,
            entId?: string
        ): string => {
            if (
                entId?.toLowerCase() ===
                editFloorLayoutProps.selectedNode?.NodeEntID?.toLowerCase()
            ) {
                return "red";
            }

            return "";
        },
        [
            editFloorLayoutProps.selectedNode?.NodeEntID
        ]
    );

    // Bumps layout version whenever floor layout JSON changes to force KonvaEditor refresh.
    useEffect(() => {
        setLayoutVersion(v => v + 1);
    }, [floorLayoutJson])

    if (isLayoutLoading || floorLayoutJson === undefined) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading layout...</div>;
    }
    return (
        <>
            {commonVariableContext.diagnosticLevel === "4" ?
                <JsonViewer uniqueName={editFloorLayoutProps.uniqueName} jsonData={editFloorLayoutProps} />
                :
                <div key={editFloorLayoutProps.uniqueName} onClick={(e) => {
                    editFloorLayoutProps.handleMouse?.(e)
                }} className='nz-edit-floor-layout-container'>
                    <div className='nz-edit-floor-layout' >
                        {actionImageProps && menuData && editFloorLayoutProps.allowEdit &&
                            <MainMenu
                                {...actionImageProps}
                                featureData={menuData}
                                handleMouse={handleMouse}
                                handleDrag={handleDrag}
                                handleStartDrag={handleDragStart}
                                isVertical={true}
                                compact={true}
                                isIconVertical={true}
                            />
                        }
                        <div className="nz-edit-floor-layout-content">
                            {floorLayoutJson ?
                                <KonvaEditor
                                    initialPage={floorLayoutJson}
                                    debugLevel={diagnosticLevel ? Number(diagnosticLevel) : 0}
                                    key={editFloorLayoutProps.uniqueName + layoutVersion + (editFloorLayoutProps.selectedFloorNode?.NodeEntID ?? "")}
                                    mode={editFloorLayoutProps.allowEdit ? "editor" : "viewer"}
                                    onPageUpdate={handlePageUpdate}
                                    onSelectedIdChange={handleSelectedIdChanged}
                                    callbackSave={handleSaveFloorLayout}
                                    callbackClick={handleCallbackClick}
                                    callbackCtrlClick={handleCallbackCtrlClick}
                                    callbackFloorDeviceColor={handleFloorDeviceColor}
                                    callbackFloorLocationColor={handleFloorLocationColor}
                                />
                                :
                                <div className="nz-wh-100 nz-d-flex-hv-left" >
                                    <Label uniqueName={`${editFloorLayoutProps.uniqueName}-no-data-found`} label={"Layout data is not found."} />
                                </div>
                            }
                        </div>
                    </div>
                    <YesNoFormContainer
                        isOpen={isConfirmOpen}
                        uniqueName={'appqatask-confirm'}
                        message={confirmMessage}
                        showOkButton={showOkButtonOnly}
                        handleYesButtonClick={handleConfirmYesClick}
                        handleOkButtonClick={() => {
                            setIsConfirmOpen(false);
                        }}
                        handleNoButtonClick={() => {
                            setIsConfirmOpen(false);
                        }} />
                    {isReportDialogOpen && (
                        <GeneratePdf
                            uniqueName={`${editFloorLayoutProps.uniqueName}-floor-layout-report`}
                            isOpen={isReportDialogOpen}
                            reportJson={reportTemplateJson}
                            title="Floor Layout Report"
                            featureId={editFloorLayoutProps.featureId}
                            selectedNode={editFloorLayoutProps.selectedFloorNode}
                            onClose={() => {
                                setIsReportDialogOpen(false);
                                setReportTemplateJson(null);
                            }}
                        />
                    )}
                </div>
            }
        </>
    )
}

function RenderEditFloorLayoutContainer(container: HTMLElement, editFloorLayoutProps: IEditFloorLayout) {
    // Mounts EditFloorLayout into a DOM container with required context providers.
    const root = createRoot(container);
    root.render(<AppContextWrapper><InMemoryUrlProvider><EditFloorLayout {...editFloorLayoutProps} /></InMemoryUrlProvider></AppContextWrapper>);

    return {
        unmount: () => root.unmount()
    };
}
export { EditFloorLayout, RenderEditFloorLayoutContainer }
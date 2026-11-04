
import { useEffect, useRef, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { EventDataNode, Key } from 'rc-tree/lib/interface'
import * as XLSX from 'xlsx';
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks.ts'
import { useSessionContext } from '../../shared/context/hooks/SessionHooks.ts';
import { useCommonVariableContext } from '../../shared/context/hooks/CommonVariableHooks.ts'
import { useSelectedNodeContext } from '../../shared/context/hooks/SelectedNodeHooks.ts';
import { usePlacementContext } from '../../shared/context/hooks/PlacementHooks.ts';
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks.ts';
import { axiosInterceptor } from '../../shared/interceptors/Interceptor.ts';
import '../allcss/FeatureContainer.css'
import { AUDIT, BS, DEVICE, EM, INTEL, LOG, SESSION } from '../../shared/interceptors/EndPoints.ts'
import { ReuseDataForFeatures } from '../../shared/alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer.ts'
import { FEnums } from '../../constants/Feature.ts';
import { FnHandleAPIResponse } from '../../shared/allcommon/basic/FnHandleAPIResponse.ts';
import { FnCollectRecIDAndEntIDForDelete } from '../allcommon/FnCollectRecIDAndEntIDForDelete';
import { IFeatureContainer } from '../allinterface/IFeatureContainer'
import { ISelectedNodeInfo, ITreeNode } from '../../shared/allinterface/tree/ITreeControl.ts'
import { IInboundLocation } from '../../shared/allinterface/plan/IPlacementExplorer.ts'
import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu.ts'
import { IActionImageForSubMenu } from '../../shared/allinterface/basic/IActionImageList.ts'
import { ExplorerTreeContainer } from '../../shared/explorertreecontainer/ExplorerTreeContainer.tsx'
import { ExplorerContainer } from '../explorercontainer/ExplorerContainer'
import { RightMouseMenuTreeNode } from '../../constants/Feature.ts';
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx'
import { Label } from '../../shared/basic/label/Label.tsx'
import { DELIMITER } from '../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid.ts';
import { NodeDragEventParams } from 'rc-tree/lib/contextTypes';
import { DraggableConfig } from 'rc-tree/lib/Tree';
import { AppQA } from '../../constants/Feature.ts';
import { FnFindNearestNodeByType } from '../../shared/allcommon/FnFindNearestNodeByType.ts';
import { FnFindNodeAndParents } from '../../shared/allcommon/tablegrid/FnFindNodeAndParents.ts';
import { FnFocusRcTreeFromTreeClick } from '../../shared/allcommon/tree/FnFocusRcTree.ts';
import { useDragContext } from '../../shared/context/hooks/DragHooks.ts';
import { FnParseJsonSafely } from '../allcommon/FnParseJsonSafely.ts';
import { PlanTreeContainer } from '../../shared/plantreecontainer/PlanTreeContainer.tsx';
import { FnCreateForensiclog } from '../allcommon/FnCreateForensiclog.ts';
import { IFnCreateForensiclog } from '../allinterface/IFnCreateForensiclog.ts';
import { LogGroupName, LogName, LogSubGroupName } from '../alldefaultprops/DefaultPropsForensiclog.ts';
import { AppQaContainer } from './AppqaContainer.tsx';
import { IStatusBar } from '../../shared/context/allinterface/IStatusBar.ts';
import { getDateFormat } from '../../shared/context/contextandprovider/ExplorerTree.tsx';
import { ISessionVariable } from '../../shared/allinterface/basic/ISessionVariable.ts';
import { FnUpdateSession } from '../../shared/allcommon/FnUpdateSession.ts';
import { ISession } from '../../shared/context/allinterface/ISession.ts';

const MULTI_TREE_FEATURES = [
    FEnums.AuditSession.toString(),
    FEnums.ModelBusinessService.toString(),
    FEnums.AssetPlacement.toString(),
    FEnums.InboundAssetPlacement.toString(),
    FEnums.ManageBusinessService.toString(),
    FEnums.Relocate.toString()
];

// Helper to detect BSLink node
const isBSLinkNode = (node: ITreeNode): boolean => {
    const nodeType = node.NodeType?.toLowerCase();
    return (
        nodeType === "businessservicenodelink");
};

// Helper to check whether any links of a business service exist in tree data
const hasBusinessServiceLinks = (
    targetNode?: ITreeNode,
    treeData?: ITreeNode[] | unknown
): boolean => {
    if (!targetNode || !treeData) {
        return false;
    }
    if (isBSLinkNode(targetNode)) {
        return false;
    }
    const targetNodeEntId = targetNode.NodeEntID ? String(targetNode.NodeEntID).trim() : "";
    const targetEntId = targetNode.EntID ? String(targetNode.EntID).trim() : "";
    if (!targetNodeEntId && !targetEntId) {
        return false;
    }

    let foundLink = false;
    const traverse = (items: any) => {
        if (!items || foundLink) return;
        if (Array.isArray(items)) {
            for (const item of items) {
                if (foundLink) return;
                checkNode(item);
                if (item && typeof item === "object") {
                    if (Array.isArray(item.children)) {
                        traverse(item.children);
                    }
                    for (const key of Object.keys(item)) {
                        if (key !== "children" && Array.isArray(item[key])) {
                            traverse(item[key]);
                        }
                    }
                }
            }
        } else if (typeof items === "object") {
            for (const key of Object.keys(items)) {
                if (foundLink) return;
                const val = items[key];
                if (Array.isArray(val)) {
                    traverse(val);
                }
            }
        }
    };

    const checkNode = (node: any) => {
        if (!node || typeof node !== "object" || foundLink) return;
        if (node === targetNode || (targetNode.key && node.key === targetNode.key)) {
            return;
        }
        const isLink =
            node.NodeType?.toLowerCase() === "businessservicenodelink" ||
            isBSLinkNode(node as ITreeNode);
        const nodeEntId = node.NodeEntID !== undefined && node.NodeEntID !== null
            ? String(node.NodeEntID).trim()
            : "";
        if (isLink && nodeEntId) {
            if (
                (targetNodeEntId && nodeEntId === targetNodeEntId) ||
                (targetEntId && nodeEntId === targetEntId)
            ) {
                foundLink = true;
            }
        }
    };

    traverse(treeData);
    return foundLink;
};

const FeatureContainer = (featureContainerProps: IFeatureContainer) => {
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo>();
    const [originalTreeData, setOriginalTreeData] = useState<ITreeNode[]>([]);
    const [showOverlay, setShowOverlay] = useState<boolean>(false);
    const [originalTreeDataForInventory, setOriginalTreeDataForInventory] = useState<ITreeNode[]>([]);
    const [originalTreeDataWithoutFilter, setOriginalTreeDataWithoutFilter] = useState<ITreeNode[]>([]);
    const [hierarchyApiData, setHierarchyApiData] = useState<unknown>();
    const [explorerToRender, setExplorerToRender] = useState<"FEATURE" | "PLAN">();
    const [planTreeRefreshKey, setPlanTreeRefreshKey] = useState<number>(0);
    const [selectedFloorNode, setSelectedFloorNode] = useState<ITreeNode>();
    const [firstPaneTreeData, setFirstPaneTreeData] = useState<ITreeNode[]>();
    const firstPaneTreeDataRef = useRef<ITreeNode[] | undefined>(undefined);

    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [selectedRTMLabel, setSelectedRTMLabel] = useState<string>();
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<IMenuItem>();
    const [selectedRecordToDelete, setSelectedRecordToDelete] = useState<Record<string, any>>()
    const [lastSelectedNodeKey, setLastSelectedNodeKey] = useState<Key>();
    const [selectedFeatureName, setSelectedFeatureName] = useState<string>();
    const [selectedNodeForCustomization, setSelectedNodeForCustomization] = useState<ITreeNode>();
    const [isShowOkButton, setIsShowOkButton] = useState<boolean>();
    const [overlayPosition, setOverlayPosition] = useState<{ left: number; top: number } | null>(null);

    const allowAppQaToRender = Boolean(featureContainerProps.appqaId);
    const allowMultipleTree = MULTI_TREE_FEATURES.includes(
        featureContainerProps.featureId
    );

    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const commonVariableContext = useCommonVariableContext()
    const sessionContext = useSessionContext();
    const selectedNodeContext = useSelectedNodeContext();
    const placementContext = usePlacementContext();
    const { dragItem } = useDragContext();

    const siteId = sessionContext?.SessionList?.find(
        (item) => item.VariableName?.toLowerCase() === "siteid"
    )?.SessionValue;

    const dateFormat = getDateFormat();
    const previousDateFormatRef = useRef<string>(undefined);

    const previousFeatureIdRef = useRef<string | undefined>(undefined);
    const containerDivRef = useRef<HTMLDivElement | null>(null);
    const yesNoDialogContainerRef = useRef<HTMLDivElement | undefined>(undefined);
    const selectedNodeRef = useRef<ITreeNode>(undefined)
    const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const overlayTimerRef = useRef<number | null>(null);

    useEffect(() => {
        /**
         * Toggle an element's display property.
         */
        const toggleDisplay = (
            element: Element | null,
            visibleDisplay: string = "block"
        ): void => {
            if (!(element instanceof HTMLElement)) {
                return;
            }

            element.style.display =
                element.style.display === "none"
                    ? visibleDisplay
                    : "none";
        };

        /**
         * Toggle the main Explorer pane and its gutter.
         */
        const toggleExplorerPane = (): void => {
            // App QA containers have priority
            const explorerContainer =
                document.querySelector(
                    ".nz-app-qa-setting .nz-dc-explorer-container"
                ) ||
                document.querySelector(
                    ".nz-app-qa-entities .nz-dc-explorer-container"
                );

            if (explorerContainer) {
                toggleDisplay(explorerContainer);
                return;
            }

            const parent = containerDivRef.current;

            if (!parent) {
                return;
            }

            const pane = parent.querySelector(".p-splitter-panel");
            const gutter = parent.querySelector(".p-splitter-gutter");

            toggleDisplay(pane);
            toggleDisplay(gutter, "flex");
        };

        /**
         * Toggle the Floor Layout pane and its gutter.
         */
        const toggleFloorPane = (): void => {
            const parent = containerDivRef.current?.querySelector(
                ".nz-device-floor-layout-content"
            );

            if (!parent) {
                return;
            }

            const floorPane = parent.querySelector(".nz-floor-layout-pane");
            const gutter = parent.querySelector(".p-splitter-gutter");

            toggleDisplay(floorPane);
            toggleDisplay(gutter, "flex");
        };

        /**
         * Handles keyboard shortcuts.
         *
         * Ctrl + Alt + B → Toggle Explorer pane
         * Ctrl + Alt + F → Toggle Floor Layout pane
         */
        const handleKeyDown = (event: KeyboardEvent): void => {
            const key = event.key?.toLowerCase();

            if (!event.ctrlKey || !event.altKey) {
                return;
            }

            switch (key) {
                case "b":
                    event.preventDefault();
                    event.stopPropagation();
                    toggleExplorerPane();
                    break;

                case "f":
                    event.preventDefault();
                    event.stopPropagation();
                    toggleFloorPane();
                    break;

                default:
                    break;
            }
        };

        /**
         * Tracks the latest mouse position without triggering a re-render.
         */
        const handleMouseMove = (event: MouseEvent): void => {
            mousePositionRef.current = {
                x: event.clientX,
                y: event.clientY,
            };
        };

        // Capture phase allows shortcuts to work even when
        // focus is inside the tree or another child component.
        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            containerDivRef.current = null;

            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("mousemove", handleMouseMove);

            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
                overlayTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (previousDateFormatRef.current === dateFormat) {
            return;
        }

        previousDateFormatRef.current = dateFormat;

        const sessionData: ISessionVariable[] = [
            {
                VariableContext: "Workorder",
                VariableName: "DateFormat",
                SessionValue: dateFormat
            }
        ];

        FnUpdateSession(
            sessionData,
            sessionContext,
            statusBarContext
        );
    }, [dateFormat]);

    useEffect(() => {
        const basicRoleSession = sessionContext.SessionList.find(
            (item) => item.VariableName === "LoginUserBasicRoleName"
        );
        const newDiagnosticLevel = commonVariableContext.diagnosticLevel ?? "0";
        const newBasicRole = basicRoleSession?.SessionValue ?? "";
        // Only update if values have changed
        if (
            commonVariableContext.sessionVarsForTreeNode?.diagnosticLevel !== newDiagnosticLevel ||
            commonVariableContext.sessionVarsForTreeNode?.basicRole !== newBasicRole
        ) {
            commonVariableContext.setSessionVarsForTreeNode({
                diagnosticLevel: newDiagnosticLevel,
                basicRole: newBasicRole,
            });
        }
    }, [
        sessionContext.SessionList,
        commonVariableContext.diagnosticLevel,
        commonVariableContext.sessionVarsForTreeNode?.diagnosticLevel,
        commonVariableContext.sessionVarsForTreeNode?.basicRole
    ]);

    const handleNodeSelect = async (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[], treeData?: ITreeNode[]) => {
        if (!info || !info.node) {
            setSelectedNodeInfo(undefined);
            selectedNodeRef.current = undefined;
            selectedNodeContext.setSelectedNodeExplorer(undefined);
            placementContext.setLastSelectedInboundLocation(undefined);
            setSelectedKebabMenu(undefined);
            setSelectedNodeForCustomization(undefined);
            setSelectedFloorNode(undefined);
            return;
        }

        if (treeData) {
            firstPaneTreeDataRef.current = treeData;
            setFirstPaneTreeData(treeData);
        }

        const isPlanOrRelocate =
            explorerToRender === "PLAN" ||
            featureContainerProps.featureId === FEnums.Relocate;

        if (isPlanOrRelocate) {
            const isDevice =
                info.node.NodeType?.toLowerCase() === "device";
            const hasWOID =
                (info.node.WOID !== undefined &&
                    info.node.WOID !== null &&
                    (typeof info.node.WOID === "string" ? info.node.WOID.trim().length > 0 : Boolean(info.node.WOID))) ||
                (info.node._WorkorderProfile !== undefined &&
                    info.node._WorkorderProfile !== null &&
                    typeof info.node._WorkorderProfile === "string" &&
                    info.node._WorkorderProfile.trim().length > 0) ||
                (info.node.WorkorderProfile !== undefined &&
                    info.node.WorkorderProfile !== null &&
                    typeof info.node.WorkorderProfile === "string" &&
                    info.node.WorkorderProfile.trim().length > 0) ||
                Boolean(info.node.WOExists);

            if (!isDevice || hasWOID) {
                setSelectedNodeInfo(undefined);
                selectedNodeRef.current = undefined;
                selectedNodeContext.setSelectedNodeExplorer(undefined);
                placementContext.setLastSelectedInboundLocation(undefined);
                setSelectedKebabMenu(undefined);
                setSelectedNodeForCustomization(undefined);
                setSelectedFloorNode(undefined);
                return;
            }
        } else if (
            featureContainerProps.featureId === FEnums.AssetPlacement ||
            featureContainerProps.featureId === FEnums.InboundAssetPlacement
        ) {
            const isDevice =
                info.node.NodeType?.toLowerCase() === "device";

            if (!isDevice) {
                setSelectedNodeInfo(undefined);
                selectedNodeRef.current = undefined;
                selectedNodeContext.setSelectedNodeExplorer(undefined);
                placementContext.setLastSelectedInboundLocation(undefined);
                setSelectedKebabMenu(undefined);
                setSelectedNodeForCustomization(undefined);
                setSelectedFloorNode(undefined);
                return;
            }
        }

        // Find Floor node from the tree data of the first pane
        const currentTree = treeData ?? firstPaneTreeData;
        if (currentTree && info?.node) {
            let floorNode: ITreeNode | null = null;
            const targetKey = (info.node.key ?? info.node.NodeEntID ?? "").toString();
            if (targetKey) {
                const path = FnFindNodeAndParents(currentTree, targetKey);
                if (path && path.length > 0) {
                    floorNode = path.slice().reverse().find(n => (n.NodeType ?? '').toLowerCase() === 'floor') ?? null;
                }
            }
            if (!floorNode) {
                floorNode = FnFindNearestNodeByType(currentTree, info.node, "Floor", undefined, true);
            }
            setSelectedFloorNode(floorNode ?? undefined);
        } else {
            setSelectedFloorNode(undefined);
        }

        let jsonstring = [];
        if (featureContainerProps.featureId === FEnums.ModelBusinessService || featureContainerProps.featureId === FEnums.ManageBusinessService) {
            if (info.node.NodeType?.toLowerCase() === "device" && treeData) {
                const foundNode = FnFindNearestNodeByType(treeData, info.node, "BusinessServiceNode", true);
                if (foundNode) {
                    setSelectedNodeForCustomization(foundNode);
                }
                else {
                    setSelectedNodeForCustomization(undefined);
                }
            }
            else {
                setSelectedNodeForCustomization(undefined);
            }
        }
        else if (info.node.NodeType && info.node.NodeType?.toLowerCase() === "auditsessionnode" && (featureContainerProps.featureId === FEnums.AuditSession || featureContainerProps.featureId === FEnums.InventoryCollection || featureContainerProps.featureId === FEnums.InventoryReconciliation)) {
            const sidebarOpen = sessionContext.SessionList.find((item: ISession) => item.VariableName === "Sidebar");
            if (sidebarOpen?.SessionValue === "0") {
                jsonstring.push({ VariableContext: "Optional", VariableName: "Sidebar", SessionValue: "1" })
            }
        }
        if (jsonstring.length) {
            await axiosInterceptor({
                url: SESSION.UpdateSession,
                data: {
                    jsonSession: JSON.stringify(jsonstring)
                },
                setFetchData: (updateSessionApiResponse: unknown) => {
                    if (updateSessionApiResponse && typeof updateSessionApiResponse === "object" && 'jsonSessionOutput' in updateSessionApiResponse) {
                        const extractedData = FnHandleAPIResponse(updateSessionApiResponse.jsonSessionOutput, 'Dataset');
                        if (extractedData && Array.isArray(extractedData)) {
                            sessionContext.setSessionList(extractedData);
                        }
                    }
                }
            }, statusBarContext);
        }
        selectedNodeContext.setSelectedNodeExplorer(info.node);
        setSelectedNodeInfo(info);
        selectedNodeRef.current = info.node;
        if (info.node.key !== selectedNodeInfo?.node.key) {
            setSelectedKebabMenu(undefined);
        }
        if ((featureContainerProps.featureId === FEnums.AssetPlacement || (featureContainerProps.featureId === FEnums.InboundAssetPlacement && info.node.EQID)) && info.node.WOID) {
            axiosInterceptor(
                {
                    url: DEVICE.WorkorderDetails,
                    data: { woid: info.node.WOID },
                    setFetchData: (resp: unknown, status?: string) => {
                        if (status !== "200" || !resp || typeof resp !== "object") {
                            placementContext.setLastSelectedInboundLocation(undefined);
                            return;
                        }
                        try {
                            const responseData = resp as Record<string, unknown>;

                            const deviceJsonValue =
                                responseData.deviceJson ??
                                responseData.devicesJson;

                            const deviceJson =
                                typeof deviceJsonValue === "string"
                                    ? JSON.parse(deviceJsonValue)
                                    : deviceJsonValue ?? responseData;

                            const detailsData =
                                typeof (deviceJson as Record<string, unknown>)?.Data === "string"
                                    ? JSON.parse(
                                        (deviceJson as Record<string, unknown>).Data as string
                                    )
                                    : (deviceJson as Record<string, unknown>)?.Data;

                            const profiles: Record<string, unknown>[] = Array.isArray(detailsData)
                                ? detailsData
                                : detailsData
                                    ? [detailsData as Record<string, unknown>]
                                    : [];

                            if (profiles.length > 0) {
                                const profile = profiles[0];
                                const items: any[] = (profile?.WorkorderItems ?? profile?.workorderItems ?? profile?.workorderitems) as any[];

                                if (Array.isArray(items) && items.length > 0) {
                                    // Match item corresponding to the selected node, or use the first item
                                    const matchedItem = items.find((item: any) => {
                                        let parsedItemJson = item.ItemJson;
                                        if (typeof parsedItemJson === "string") {
                                            try {
                                                parsedItemJson = JSON.parse(parsedItemJson);
                                            } catch {
                                                parsedItemJson = null;
                                            }
                                        }
                                        return (
                                            item.EntID === info.node.NodeEntID ||
                                            parsedItemJson?.source?.EntId === info.node.NodeEntID
                                        );
                                    }) ?? items[0];

                                    let itemJson = matchedItem.ItemJson;
                                    if (typeof itemJson === "string") {
                                        try {
                                            itemJson = JSON.parse(itemJson);
                                        } catch {
                                            itemJson = null;
                                        }
                                    }

                                    const dest = itemJson?.dest;
                                    const rackEntId = dest?.EntId;
                                    const rackName = dest?.Rack;
                                    const ruPosList = typeof dest?.RuPos === "string" ? dest.RuPos.trim() : "";

                                    const inboundLocation: IInboundLocation = {
                                        Site: (profile.Site as string) ?? (dest?.Site as string) ?? "",
                                        Room: (profile.Room as string) ?? (dest?.Room as string) ?? "",
                                        Floor: (profile.Floor as string) ?? (dest?.Floor as string) ?? "",
                                        Location: (profile.Location as string) ?? (dest?.Location as string) ?? "",
                                        Rack: rackName || rackEntId || "",
                                        RUPos: ruPosList ?? null,
                                        WorkorderProfile: (profile._WorkorderProfile as string) ?? info.node._WorkorderProfile,
                                        EntID: (matchedItem.EntID as string) ?? info.node.NodeEntID,
                                        RecID: (matchedItem.RecID as string) ?? "",
                                        RackEntId: dest.RackEntId
                                    };

                                    placementContext.setLastSelectedInboundLocation(inboundLocation);
                                    return;
                                }
                            }
                            placementContext.setLastSelectedInboundLocation(undefined);
                        } catch (error) {
                            console.error(
                                "Error parsing WorkorderDetails response:",
                                error
                            );
                            placementContext.setLastSelectedInboundLocation(undefined);
                        }
                    }
                },
                statusBarContext
            );
        } else {
            placementContext.setLastSelectedInboundLocation(undefined);
        }
    }

    const fetchAssetsForBin = (featureId?: string) => {
        const currentFeatureId = featureId ?? featureContainerProps.featureId;
        axiosInterceptor({
            url: DEVICE.AssetsForBin,
            data: {},
            setFetchData: (apiResponse: unknown, status?: string) => {
                if (status === "200" && apiResponse && typeof apiResponse === "object" && 'deviceJson' in apiResponse) {
                    const parsedData = FnParseJsonSafely(apiResponse.deviceJson as string);
                    if (parsedData) {
                        let displaymMssage = true;
                        function filterBinsNewAndOther(
                            data: Record<string, any>,
                            displayAllBins: boolean,
                            allowIsInInboundLocationRecords?: boolean,
                            notIncludeBins?: string | string[]
                        ) {

                            if (!data || !Array.isArray(data["Spare Devices"])) return data;
                            const result = { ...data };
                            const excludedBins = Array.isArray(notIncludeBins)
                                ? notIncludeBins
                                : notIncludeBins
                                    ? [notIncludeBins]
                                    : [];
                            const shouldIncludeBin = (bin: any) => bin && !excludedBins.includes(bin.Name);
                            //  Helper for asset filtering
                            const filterAssets = (assets: any[]) => {
                                if (!Array.isArray(assets)) return [];

                                if (currentFeatureId === FEnums.AssetPlacement) {
                                    return assets.filter((a: any) => {
                                        if (!a) return false;
                                        // Must have Slots Needed > 0 (rack-mounted devices)
                                        const slots = Number(a.SlotsNeeded ?? a.DeviceSlotsNeeded ?? 0);
                                        if (isNaN(slots) || slots <= 0) return false;

                                        // Not a contained card/module
                                        if (a.ContainedByDeviceID) return false;

                                        return true;
                                    });
                                }
                                return assets
                            };
                            result["Spare Devices"] = data["Spare Devices"].map((store: any) => {
                                if (!store || !Array.isArray(store.Bins)) return store;
                                //  displayAllBins = true → no transformation
                                if (displayAllBins) {
                                    return {
                                        ...store,
                                        Bins: store.Bins.filter(shouldIncludeBin).map((bin: any) => {
                                            const assets = filterAssets(bin?.Assets);
                                            if (assets?.length > 0) {
                                                displaymMssage = false;
                                            }
                                            return {
                                                ...bin,
                                                HasChildren: assets.length > 0,
                                                Assets: assets.map((asset: any) => ({
                                                    ...asset,
                                                    HasChildren: 0,
                                                    rackMountable: Number(asset?.SlotsNeeded ?? asset?.DeviceSlotsNeeded ?? 0) > 0
                                                }))
                                            };
                                        })
                                    };
                                }
                                //  displayAllBins = false → filter + transform
                                const isMatchingBin = (bin: any) => {
                                    if (!bin || !shouldIncludeBin(bin)) return false;
                                    if (currentFeatureId === FEnums.AssetPlacement) {
                                        const binName = String(bin?.Name ?? "").trim().toLowerCase();
                                        return binName === "new" || binName === "other" || binName === "used" || binName === "used devices";
                                    } else if (currentFeatureId === FEnums.InboundAssetPlacement) {
                                        return notIncludeBins && !notIncludeBins.includes(bin?.Name)
                                    }
                                    return (bin?.Name === "New" || bin?.Name === "Used") && Array.isArray(bin?.Assets) && bin.Assets.length > 0;
                                };

                                return {
                                    ...store,
                                    Bins: store.Bins
                                        .filter(isMatchingBin)
                                        .map((bin: any) => {
                                            const assets = filterAssets(bin?.Assets);
                                            if (assets?.length > 0) {
                                                displaymMssage = false;
                                            }
                                            return {
                                                ...bin,
                                                HasChildren: assets.length > 0,
                                                Assets: assets.map((asset: any) => ({
                                                    ...asset,
                                                    HasChildren: 0,
                                                    rackMountable: Number(asset?.SlotsNeeded ?? asset?.DeviceSlotsNeeded ?? 0) > 0
                                                }))
                                            };
                                        })
                                };
                            });
                            return result;
                        }
                        const result = filterBinsNewAndOther(parsedData,
                            currentFeatureId === FEnums.AssetPlacement || currentFeatureId === FEnums.InboundAssetPlacement ? false : true,
                            currentFeatureId === FEnums.AssetPlacement ? undefined : true,
                            currentFeatureId === FEnums.InboundAssetPlacement ? ["New", "Used", "Disposable"] : undefined
                        );
                        if (displaymMssage) {
                            setConfirmMessage("There are no assets");
                            setIsConfirmOpen(true);
                            setIsShowOkButton(true);
                            setSelectedNodeInfo(undefined);
                            selectedNodeRef.current = undefined;
                        }
                        setHierarchyApiData(result);
                    }
                    else {
                        setConfirmMessage("There are no assets");
                        setIsConfirmOpen(true);
                        setIsShowOkButton(true);
                        setSelectedNodeInfo(undefined);
                        selectedNodeRef.current = undefined;
                    }
                }
                else {
                    setConfirmMessage("There are no assets");
                    setIsConfirmOpen(true);
                    setIsShowOkButton(true);
                    setSelectedNodeInfo(undefined);
                    selectedNodeRef.current = undefined;
                }
            }
        }, statusBarContext);
        setExplorerToRender("FEATURE");
    };

    useEffect(() => {
        if (featureContainerProps.featureId !== previousFeatureIdRef.current) {
            //  Immediately reset data
            const HOME_FEATURES = [
                FEnums.Dashboard.toString(),
                FEnums.SelectDataCenterSite.toString(),
                FEnums.PowerBI.toString()
            ]
            if (HOME_FEATURES.includes(featureContainerProps.featureId)) {
                selectedNodeContext.setSelectedNode(undefined)
                selectedNodeContext.setSelectedNodeExplorer(undefined)
            }
            setHierarchyApiData(undefined);
            setExplorerToRender(undefined);
            setLastSelectedNodeKey(undefined);
            commonVariableContext.setSidebarWidth(0);
            placementContext.setLastSelectedInboundLocation(undefined);
            setSelectedFloorNode(undefined);
            firstPaneTreeDataRef.current = undefined;
            setFirstPaneTreeData(undefined);
            const handleFeatureIdChange = async () => {
                if (featureContainerProps.featureId === FEnums.ModelBusinessService || featureContainerProps.featureId === FEnums.ManageBusinessService) {
                    axiosInterceptor({
                        url: BS.GetBs,
                        data: {},
                        setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                            if (status === "200" && getLocationHierarchyApiResponse && typeof getLocationHierarchyApiResponse === "object" && 'bsJson' in getLocationHierarchyApiResponse) {
                                const parsedData = FnParseJsonSafely(getLocationHierarchyApiResponse.bsJson as string);
                                if (parsedData && typeof parsedData.object) {
                                    setHierarchyApiData(parsedData);
                                }
                                else {
                                    setHierarchyApiData(undefined);
                                }
                            }
                            else {
                                setHierarchyApiData(undefined);
                            }
                        }
                    }, statusBarContext)
                    setExplorerToRender("FEATURE");
                }
                else if (featureContainerProps.featureId === FEnums.AuditSession
                ) {
                    axiosInterceptor({
                        url: AUDIT.GetAllAuditsessions,
                        data: {
                            auditFeatureType: featureContainerProps.featureId === FEnums.AuditSession ? 1 : 3,
                            openOnly: false
                        },
                        setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                            if (status === "200" && getLocationHierarchyApiResponse && typeof getLocationHierarchyApiResponse === "object" && 'data' in getLocationHierarchyApiResponse) {
                                const parsedData = FnParseJsonSafely(getLocationHierarchyApiResponse.data as string);
                                if (parsedData && typeof parsedData.object) {
                                    setHierarchyApiData(parsedData);
                                }
                            }
                            else {
                                setHierarchyApiData(undefined)
                            }
                        }
                    }, statusBarContext)
                    setExplorerToRender("FEATURE");
                } else if (featureContainerProps.featureId === FEnums.AssetPlacement
                    || featureContainerProps.featureId === FEnums.InboundAssetPlacement) {
                    fetchAssetsForBin();
                }
                else if (featureContainerProps.featureId === FEnums.Relocate) {
                    // filter with tag : Unused
                    setExplorerToRender("PLAN");
                    setHierarchyApiData([])
                }
                else {
                    if (featureContainerProps.featureId === FEnums.Discover) {
                        axiosInterceptor({
                            url: INTEL.SetDcmStatus,
                            callSilently: true,
                            setFetchData: () => { }
                        }, statusBarContext)
                    }
                    setExplorerToRender("FEATURE");
                    setHierarchyApiData(undefined);
                }
            }
            handleFeatureIdChange();
            previousFeatureIdRef.current = featureContainerProps.featureId;
        }
        return () => {
            if (featureContainerProps.featureId !== previousFeatureIdRef.current) {
                setExplorerToRender(undefined);
                setHierarchyApiData(undefined);
                setLastSelectedNodeKey(undefined);
                selectedNodeRef.current = undefined;
            }
        }
    }, [featureContainerProps.featureId, siteId]);

    useEffect(() => {
        if (!commonVariableContext.reloadTreeFor) {
            return;
        }

        setLastSelectedNodeKey(
            commonVariableContext.reloadTreeFor.entId
        );

        callApiToRefreshTree(
            commonVariableContext.reloadTreeFor.featureId
        );
    }, [commonVariableContext.reloadTreeFor]);

    const updateOriginalTreeDataset = async (updatedTreedata: ITreeNode[], expandedKeys: Key[], selectedKeys: Key[], userTreeData: ITreeNode[] | null) => {
        if (updatedTreedata.length === 0 && expandedKeys.length === 0 && selectedKeys.length === 0 && !userTreeData?.length) {
            setOriginalTreeData([]);
            setOriginalTreeDataForInventory([]);
            setOriginalTreeDataWithoutFilter([]);
        }
        else {
            if (featureContainerProps.featureId === FEnums.InventoryManagement || featureContainerProps.featureId === FEnums.InventoryConfiguration) {
                setOriginalTreeDataForInventory(updatedTreedata);
            }
            else if (featureContainerProps.featureId && ReuseDataForFeatures.includes(featureContainerProps.featureId)) {
                setOriginalTreeData(updatedTreedata);
            }
            else {
                setOriginalTreeDataWithoutFilter(updatedTreedata)
            }
        }
    }

    const handleKebabMenuSelect = (selectedItem: IActionImageForSubMenu, selectedNodeData: ISelectedNodeInfo) => {
        if (selectedItem && selectedItem.payload && typeof selectedItem.payload === "object") {
            if (selectedNodeRef.current && 'Label' in selectedItem.payload) {
                const kebabMenuPayload = selectedItem.payload as IMenuItem;
                setLastSelectedNodeKey(selectedNodeRef.current.key)
                const callApiToCreateMessage = (payload: unknown) => {
                    axiosInterceptor({
                        url: LOG.CreateMessage,
                        data: payload,
                        setFetchData: (
                            createMessageApiResponse: unknown,
                            status?: string
                        ) => {
                            if (status !== "200") {
                                setIsShowOkButton(true);
                                setConfirmMessage(
                                    "Failed to create confirmation message."
                                );
                                setIsConfirmOpen(true);
                                return;
                            }
                            if (
                                createMessageApiResponse &&
                                typeof createMessageApiResponse === "object" &&
                                'finalMessage' in createMessageApiResponse
                            ) {
                                setIsShowOkButton(false);
                                setConfirmMessage(
                                    createMessageApiResponse.finalMessage as string
                                );
                                setIsConfirmOpen(true);
                            }
                            else {
                                setIsShowOkButton(true);
                                setConfirmMessage(
                                    "Invalid response received from server."
                                );
                                setIsConfirmOpen(true);
                            }
                        }
                    }, statusBarContext);
                };
                if (selectedItem.payload.Label === RightMouseMenuTreeNode.Approve
                    || selectedItem.payload.Label === RightMouseMenuTreeNode.Unapprove
                    || selectedItem.payload.Label === RightMouseMenuTreeNode.Execute
                    || selectedItem.payload.Label === RightMouseMenuTreeNode.Reject
                    || selectedItem.payload.Label === RightMouseMenuTreeNode.Open
                    || selectedItem.payload.Label === RightMouseMenuTreeNode.CloseSession
                ) {
                    setSelectedRTMLabel(selectedItem.payload.Label);
                    if (selectedNodeRef.current.AuditSessionStatus == RightMouseMenuTreeNode.CloseSession.toString()
                        && selectedItem.payload.Label !== RightMouseMenuTreeNode.Open.toString()) {
                        const errorMsg = selectedItem.payload.Label === RightMouseMenuTreeNode.Approve.toString() ? "Approved" : selectedItem.payload.Label === RightMouseMenuTreeNode.Reject.toString() ? "Reject" : selectedItem.payload.Label === RightMouseMenuTreeNode.Open.toString() ? "Open" : selectedItem.payload.Label === RightMouseMenuTreeNode.Unapprove ? "Unapprove" : selectedItem.payload.Label === RightMouseMenuTreeNode.Execute ? "Execute" : "Close";
                        //Audit session is closed.
                        callApiToCreateMessage({
                            projectInitial: "Audit",
                            msgID: "154",
                            optionalMessage: errorMsg
                        });
                    }
                    else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Open && selectedNodeRef.current.CloseDate) {
                        callApiToCreateMessage({
                            projectInitial: "Audit",
                            msgID: "154",
                            optionalMessage: undefined,
                            customMessage: "Are you sure you want to Reopen?"
                        });
                    }
                    else {
                        let errorMsg = `${selectedItem.payload.Label} -> ${selectedNodeRef.current.Name}`;
                        // Are you sure you want to {#status}?
                        callApiToCreateMessage({
                            projectInitial: "Audit",
                            msgID: "151",
                            optionalMessage: errorMsg
                        });
                    }
                    setSelectedKebabMenu(undefined);
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Snapshot) {
                    setSelectedRTMLabel(selectedItem.payload.Label);
                    // Are you sure you want to {#status}?
                    let errorMsg = selectedNodeRef.current.NodeType?.toLowerCase() == "auditsessionnode" ? (selectedNodeInfo || selectedNodeData).node.Name ? `${selectedItem.payload.Label} -> ${(selectedNodeInfo || selectedNodeData).node.Name}` : `${selectedItem.payload.Label}` : `${selectedItem.payload.Label}`;
                    callApiToCreateMessage({
                        projectInitial: "Audit",
                        msgID: "151",
                        optionalMessage: errorMsg
                    })
                    setSelectedKebabMenu(undefined);
                }
                else if (selectedItem.payload && selectedItem.payload.Label === RightMouseMenuTreeNode.AddNewAuditSession) {
                    setSelectedKebabMenu({ ...kebabMenuPayload, _Feature: undefined });
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.PreviewAuditInventory) {
                    if (selectedNodeRef.current.TotalAuditedDevices) {
                        setSelectedKebabMenu({ ...kebabMenuPayload, _Feature: undefined });
                    }
                    else {
                        setIsShowOkButton(true)
                        setConfirmMessage("Inventory details are not found");
                        setIsConfirmOpen(true);
                    }
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Delete) {
                    if (selectedNodeRef.current.IsNZ) {
                        setIsShowOkButton(true);
                        setConfirmMessage("This record cannot be deleted because it is a required record for application to work.");
                        setIsConfirmOpen(true);
                        return
                    }
                    const currentTree = firstPaneTreeDataRef.current ?? firstPaneTreeData ?? hierarchyApiData;
                    if (
                        selectedNodeRef.current.NodeType?.toLowerCase() === "businessservicenode" &&
                        hasBusinessServiceLinks(selectedNodeRef.current, currentTree)
                    ) {
                        setIsShowOkButton(true);
                        setConfirmMessage("This business service is being used elsewhere and cannot be deleted. Delete all the links before deleting the business service.");
                        setIsConfirmOpen(true);
                        return;
                    }
                    setSelectedRTMLabel(selectedItem.payload.Label);
                    setLastSelectedNodeKey(undefined)
                    callApiToCreateMessage({
                        projectInitial: "Common",
                        msgID: "151"
                    });
                    setSelectedRecordToDelete(selectedItem.payload);
                    setSelectedKebabMenu(undefined);
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.AddNewBusinessService) {
                    setSelectedKebabMenu({ ...kebabMenuPayload, _Feature: undefined });
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.DeleteBusinessService) {
                    if (selectedNodeRef.current.IsNZ) {
                        setIsShowOkButton(true);
                        setConfirmMessage("This record cannot be deleted because it is a required record for application to work.");
                        setIsConfirmOpen(true);
                        return
                    }
                    const currentTree = firstPaneTreeDataRef.current ?? firstPaneTreeData ?? hierarchyApiData;
                    if (hasBusinessServiceLinks(selectedNodeRef.current, currentTree)) {
                        setIsShowOkButton(true);
                        setConfirmMessage("This business service is being used elsewhere and cannot be deleted. Delete all the links before deleting the business service.");
                        setIsConfirmOpen(true);
                        return;
                    }
                    setSelectedRTMLabel(selectedItem.payload.Label);
                    setLastSelectedNodeKey(undefined)
                    callApiToCreateMessage({
                        projectInitial: "Common",
                        msgID: "151"
                    });
                    setSelectedKebabMenu(undefined);
                }
                else if (
                    selectedItem.payload.Label === RightMouseMenuTreeNode.DeleteLink ||
                    selectedItem.payload.Label === "Delete Link"
                ) {
                    if (selectedNodeRef.current.IsNZ) {
                        setIsShowOkButton(true);
                        setConfirmMessage("This record cannot be deleted because it is a required record for application to work.");
                        setIsConfirmOpen(true);
                        return;
                    }
                    setSelectedRTMLabel(selectedItem.payload.Label);
                    setLastSelectedNodeKey(undefined);
                    callApiToCreateMessage({
                        projectInitial: "Common",
                        msgID: "151"
                    });
                    setSelectedKebabMenu(undefined);
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Refresh) {
                    handleReloadTree(featureContainerProps.featureId)
                    setSelectedRTMLabel(selectedItem.payload.Label)
                }
            }
            else if (selectedNodeData && featureContainerProps.featureId === FEnums.AssetPlacement) {
                if (selectedItem.payload.Label === RightMouseMenuTreeNode.Refresh) {
                    handleReloadTree(featureContainerProps.featureId)
                    setSelectedRTMLabel(selectedItem.payload.Label)
                }
            }
        }
    }

    const callApiToRefreshTree = (
        featureId?: string
    ) => {
        const currentFeatureId =
            featureId ?? featureContainerProps.featureId;
        if (currentFeatureId === FEnums.AuditSession) {
            axiosInterceptor({
                url: AUDIT.GetAllAuditsessions,
                data: {
                    auditFeatureType: 1,
                    openOnly: false
                },
                setFetchData: (
                    getLocationHierarchyApiResponse: unknown,
                    status?: string
                ) => {
                    try {
                        if (status !== "200") {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Failed to refresh audit sessions."
                            );
                            setIsConfirmOpen(true);
                            return;
                        }
                        if (
                            !getLocationHierarchyApiResponse ||
                            typeof getLocationHierarchyApiResponse !== "object" ||
                            !("data" in getLocationHierarchyApiResponse)
                        ) {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Invalid audit session response received."
                            );
                            setIsConfirmOpen(true);
                            return;
                        }
                        const parsedData = FnParseJsonSafely(
                            getLocationHierarchyApiResponse.data as string
                        );
                        if (
                            parsedData &&
                            typeof parsedData === "object"
                        ) {
                            setHierarchyApiData(parsedData);
                        }
                        else {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Audit session data is empty."
                            );
                            setIsConfirmOpen(true);
                        }
                    } catch (error) {
                        console.error(
                            "Failed to refresh audit session tree",
                            error
                        );
                        setIsShowOkButton(true);
                        setConfirmMessage(
                            "Failed to process audit session data."
                        );
                        setIsConfirmOpen(true);
                    }
                }
            }, statusBarContext);
            setExplorerToRender("FEATURE");
        }
        else if (
            currentFeatureId === FEnums.ModelBusinessService
        ) {
            axiosInterceptor({
                url: BS.GetBs,
                data: {},
                setFetchData: (
                    getLocationHierarchyApiResponse: unknown,
                    status?: string
                ) => {
                    try {
                        if (status !== "200") {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Failed to refresh business services."
                            );
                            setIsConfirmOpen(true);
                            return;
                        }
                        if (
                            !getLocationHierarchyApiResponse ||
                            typeof getLocationHierarchyApiResponse !== "object" ||
                            !("bsJson" in getLocationHierarchyApiResponse)
                        ) {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Invalid business service response received."
                            );
                            setIsConfirmOpen(true);
                            return;
                        }
                        const parsedData = FnParseJsonSafely(
                            getLocationHierarchyApiResponse.bsJson as string
                        );
                        if (
                            parsedData &&
                            typeof parsedData === "object"
                        ) {
                            setHierarchyApiData(parsedData);
                            commonVariableContext.setReloadTreeFor(
                                undefined
                            );
                        }
                        else {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Business service data is empty."
                            );
                            setIsConfirmOpen(true);
                        }
                    } catch (error) {
                        console.error(
                            "Failed to refresh business service tree",
                            error
                        );
                        setIsShowOkButton(true);
                        setConfirmMessage(
                            "Failed to process business service data."
                        );
                        setIsConfirmOpen(true);
                    }
                }
            }, statusBarContext);
        }
        else if (
            currentFeatureId === FEnums.AssetPlacement ||
            currentFeatureId === FEnums.InboundAssetPlacement
        ) {
            fetchAssetsForBin(currentFeatureId);
        }
    };

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

    const handleConfirmYesClick = () => {
        try {
            if (
                !selectedRTMLabel ||
                !selectedNodeInfo ||
                !selectedNodeInfo.node
            ) {
                setConfirmMessage("");
                setIsConfirmOpen(false);
                return;
            }
            const nodeData = selectedNodeInfo.node;
            if (
                selectedRTMLabel === RightMouseMenuTreeNode.Approve ||
                selectedRTMLabel === RightMouseMenuTreeNode.Unapprove ||
                selectedRTMLabel === RightMouseMenuTreeNode.Execute ||
                selectedRTMLabel === RightMouseMenuTreeNode.Reject ||
                selectedRTMLabel === RightMouseMenuTreeNode.Open ||
                selectedRTMLabel === RightMouseMenuTreeNode.CloseSession
            ) {
                const status =
                    selectedRTMLabel === RightMouseMenuTreeNode.Approve.toString()
                        ? "Approved"
                        : selectedRTMLabel === RightMouseMenuTreeNode.Reject.toString()
                            ? "Reject"
                            : selectedRTMLabel === RightMouseMenuTreeNode.Open.toString()
                                ? "Open"
                                : selectedRTMLabel === RightMouseMenuTreeNode.Unapprove.toString()
                                    ? "Unapproved"
                                    : selectedRTMLabel === RightMouseMenuTreeNode.Execute.toString()
                                        ? "Executed" : "Closed";
                axiosInterceptor({
                    url: AUDIT.UpdateAuditStatus,
                    data: {
                        auditID: nodeData.NodeEntID,
                        status
                    },
                    setFetchData: (
                        updateAuditStatusApiResponse: unknown,
                        responseStatus?: string
                    ) => {
                        try {
                            if (
                                responseStatus !== "200" ||
                                updateAuditStatusApiResponse === null
                            ) {
                                setIsShowOkButton(true);
                                setConfirmMessage(
                                    "Failed to update audit status."
                                );
                                setIsConfirmOpen(true);
                                return;
                            }
                            CreateLogForNode(
                                LogName.StatusChange,
                                LogSubGroupName.Audit,
                                {
                                    AuditName: nodeData.Name,
                                    StatusName: selectedRTMLabel
                                }
                            );
                            callApiToRefreshTree();
                        } catch (error) {
                            console.error(
                                "Failed to process audit status update",
                                error
                            );
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Failed to process audit status update."
                            );
                            setIsConfirmOpen(true);
                        }
                    }
                }, statusBarContext);
            }
            else if (
                selectedRTMLabel === RightMouseMenuTreeNode.Snapshot
            ) {
                const handleSnapshotResponse = (
                    snapshotInventoryForAuditApiResponse: unknown,
                    responseStatus?: string
                ) => {
                    try {
                        if (
                            responseStatus !== "200" ||
                            snapshotInventoryForAuditApiResponse === null
                        ) {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Failed to create inventory snapshot."
                            );
                            setIsConfirmOpen(true);
                            return;
                        }
                        CreateLogForNode(
                            LogName.Snapshot,
                            LogSubGroupName.Audit,
                            {
                                AuditName: nodeData.Name
                            }
                        );
                        callApiToRefreshTree();
                    } catch (error) {
                        console.error(
                            "Failed to process snapshot response",
                            error
                        );
                        setIsShowOkButton(true);
                        setConfirmMessage(
                            "Failed to process snapshot response."
                        );
                        setIsConfirmOpen(true);
                    }
                };
                if (
                    nodeData.NodeType?.toLowerCase() === "auditsessionnode" &&
                    nodeData.NodeEntID
                ) {
                    axiosInterceptor({
                        url: AUDIT.SnapshotInventoryForAudit,
                        data: {
                            auditID: nodeData.NodeEntID,
                            auditLocation: undefined
                        },
                        setFetchData: handleSnapshotResponse
                    }, statusBarContext);
                }
                else {
                    const sessionData =
                        statusBarContext.userSessionId;
                    axiosInterceptor({
                        url: AUDIT.SnapshotInventoryForAudit,
                        data: {
                            auditLocation: sessionData
                        },
                        setFetchData: handleSnapshotResponse
                    }, statusBarContext);
                }
            }
            else if (
                selectedRTMLabel === RightMouseMenuTreeNode.ExportAuditInventory
            ) {
                const entityData = nodeData;
                const requiredTableList = [
                    "PG.AuditInventory"
                ];
                const tableNames =
                    requiredTableList.join(
                        DELIMITER.separator
                    );
                axiosInterceptor({
                    url: EM.GetEntityRecordsForExport,
                    data: {
                        mode: "EXPORT",
                        entityName: entityData.EntityName,
                        tableNames,
                        excludeRecordId: false,
                        entIDs: entityData.EntID
                    },
                    setFetchData: (
                        getEntityRecordsForExportApiResponse: unknown,
                        responseStatus?: string
                    ) => {
                        try {
                            if (
                                responseStatus !== "200"
                            ) {
                                setIsShowOkButton(true);
                                setConfirmMessage(
                                    "Failed to export audit inventory."
                                );
                                setIsConfirmOpen(true);
                                return;
                            }
                            if (
                                !Array.isArray(
                                    getEntityRecordsForExportApiResponse
                                ) ||
                                !getEntityRecordsForExportApiResponse.length
                            ) {
                                setIsShowOkButton(true);
                                setConfirmMessage(
                                    "No export data found."
                                );
                                setIsConfirmOpen(true);
                                return;
                            }
                            const responseData =
                                getEntityRecordsForExportApiResponse;
                            const wb =
                                XLSX?.utils?.book_new();
                            if (!wb) {
                                setIsShowOkButton(true);
                                setConfirmMessage(
                                    "Failed to create export workbook."
                                );
                                setIsConfirmOpen(true);
                                return;
                            }
                            for (
                                let i = 0;
                                i < responseData.length;
                                i++
                            ) {
                                let sheet =
                                    XLSX.utils.json_to_sheet([{}]);
                                if (responseData[i].jsonData) {
                                    sheet =
                                        XLSX.utils.sheet_add_json(
                                            sheet,
                                            FnParseJsonSafely(
                                                responseData[i].jsonData
                                            ),
                                            {
                                                origin: "A1"
                                            }
                                        );
                                }
                                else {
                                    const blankRecord: Record<string, unknown> = {};
                                    const columnArray =
                                        FnParseJsonSafely(
                                            responseData[i].columnArray
                                        );
                                    for (
                                        let j = 0;
                                        j < columnArray.length;
                                        j++
                                    ) {
                                        blankRecord[
                                            columnArray[j].ColumnName
                                        ] = null;
                                    }
                                    sheet =
                                        XLSX.utils.sheet_add_json(
                                            sheet,
                                            [blankRecord],
                                            {
                                                origin: "A1"
                                            }
                                        );
                                }
                                XLSX.utils.book_append_sheet(
                                    wb,
                                    sheet,
                                    responseData[i].tableName
                                );
                            }
                            if (
                                wb.SheetNames.length > 0 &&
                                entityData.EntityName
                            ) {
                                XLSX.writeFile(
                                    wb,
                                    `${entityData.EntityName}.xlsx`,
                                    {
                                        bookType: "xlsx",
                                        type: "binary"
                                    }
                                );
                            }
                        } catch (error) {
                            console.error(
                                "Failed to export audit inventory",
                                error
                            );
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Failed to export audit inventory."
                            );
                            setIsConfirmOpen(true);
                        }
                    }
                }, statusBarContext);
            }
            else if (
                selectedRTMLabel === RightMouseMenuTreeNode.Delete
            ) {
                const currentTree = firstPaneTreeDataRef.current ?? firstPaneTreeData ?? hierarchyApiData;
                if (
                    nodeData.NodeType?.toLowerCase() === "businessservicenode" &&
                    hasBusinessServiceLinks(nodeData, currentTree)
                ) {
                    setIsShowOkButton(true);
                    setConfirmMessage(
                        "This business service is being used elsewhere and cannot be deleted. Delete all the links before deleting the business service."
                    );
                    setIsConfirmOpen(true);
                    return;
                }
                const handleDeleteResponse = (
                    deleteEntityRecordsApiResponse: unknown,
                    responseStatus?: string
                ) => {
                    try {
                        if (
                            responseStatus !== "200"
                        ) {
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Failed to delete record."
                            );
                            setIsConfirmOpen(true);
                            return;
                        }
                        if (
                            deleteEntityRecordsApiResponse === ""
                        ) {
                            callApiToRefreshTree();
                        }
                    } catch (error) {
                        console.error(
                            "Failed to process delete response",
                            error
                        );
                        setIsShowOkButton(true);
                        setConfirmMessage(
                            "Failed to process delete response."
                        );
                        setIsConfirmOpen(true);
                    }
                };
                if (
                    (
                        featureContainerProps.featureId ===
                        FEnums.ModelBusinessService ||
                        featureContainerProps.featureId ===
                        FEnums.ManageBusinessService
                    ) &&
                    isBSLinkNode(nodeData)
                ) {
                    const deleteData: Record<string, any> = {
                        tableName: "PG.BSLink",
                    };
                    if (nodeData.RecID) deleteData.recIDs = nodeData.RecID;
                    if (nodeData.EntID) deleteData.entIDs = nodeData.EntID;
                    axiosInterceptor({
                        url: EM.DeleteTableRecords,
                        data: deleteData,
                        setFetchData: handleDeleteResponse
                    }, statusBarContext);
                }
                else if (
                    (
                        featureContainerProps.featureId ===
                        FEnums.ModelBusinessService ||
                        featureContainerProps.featureId ===
                        FEnums.ManageBusinessService
                    ) &&
                    nodeData.RecID
                ) {
                    axiosInterceptor({
                        url: EM.DeleteTableRecords,
                        data: {
                            tableName: "PG.BSDevice",
                            recIDs: nodeData.RecID
                        },
                        setFetchData: handleDeleteResponse
                    }, statusBarContext);
                }
                else {
                    axiosInterceptor({
                        url: EM.DeleteEntityRecords,
                        data: {
                            entityName: nodeData.NodeEntityname,
                            entIDs: nodeData.NodeEntID
                        },
                        setFetchData: handleDeleteResponse
                    }, statusBarContext);
                }
            }
            else if (
                selectedRTMLabel ===
                RightMouseMenuTreeNode.DeleteBusinessService
            ) {
                const currentTree = firstPaneTreeDataRef.current ?? firstPaneTreeData ?? hierarchyApiData;
                if (hasBusinessServiceLinks(nodeData, currentTree)) {
                    setIsShowOkButton(true);
                    setConfirmMessage(
                        "This business service is being used elsewhere and cannot be deleted. Delete all the links before deleting the business service."
                    );
                    setIsConfirmOpen(true);
                    return;
                }
                const ids =
                    FnCollectRecIDAndEntIDForDelete([
                        nodeData
                    ]);
                axiosInterceptor({
                    url: EM.DeleteEntityRecords,
                    data: {
                        entityName: nodeData.NodeEntityname,
                        entIDs: ids.entIDs
                    },
                    setFetchData: (
                        deleteEntityRecordsApiResponse: unknown,
                        responseStatus?: string
                    ) => {
                        try {
                            if (
                                responseStatus !== "200"
                            ) {
                                setIsShowOkButton(true);
                                setConfirmMessage(
                                    "Failed to delete business service."
                                );
                                setIsConfirmOpen(true);
                                return;
                            }
                            if (
                                deleteEntityRecordsApiResponse === ""
                            ) {
                                callApiToRefreshTree();
                            }
                        } catch (error) {
                            console.error(
                                "Failed to process business service delete response",
                                error
                            );
                            setIsShowOkButton(true);
                            setConfirmMessage(
                                "Failed to process delete response."
                            );
                            setIsConfirmOpen(true);
                        }
                    }
                }, statusBarContext);
            }
            else if (
                selectedRTMLabel === RightMouseMenuTreeNode.DeleteLink ||
                selectedRTMLabel === "Delete Link"
            ) {
                const handleDeleteLinkResponse = (
                    deleteTableRecordsApiResponse: unknown,
                    responseStatus?: string
                ) => {
                    try {
                        if (responseStatus !== "200") {
                            setIsShowOkButton(true);
                            setConfirmMessage("Failed to delete link.");
                            setIsConfirmOpen(true);
                            return;
                        }
                        if (deleteTableRecordsApiResponse === "" || deleteTableRecordsApiResponse === null || deleteTableRecordsApiResponse !== undefined) {
                            callApiToRefreshTree();
                        }
                    } catch (error) {
                        console.error("Failed to process delete link response", error);
                        setIsShowOkButton(true);
                        setConfirmMessage("Failed to process delete response.");
                        setIsConfirmOpen(true);
                    }
                };

                const deleteData: Record<string, any> = {
                    tableName: "PG.BSLink",
                };
                if (nodeData.RecID) {
                    deleteData.recIDs = nodeData.RecID;
                }

                axiosInterceptor(
                    {
                        url: EM.DeleteTableRecords,
                        data: deleteData,
                        setFetchData: handleDeleteLinkResponse,
                    },
                    statusBarContext
                );
            }
        } catch (error) {
            console.error(
                "Failed to handle confirmation action",
                error
            );
            setIsShowOkButton(true);
            setConfirmMessage(
                "Something went wrong while processing request."
            );
            setIsConfirmOpen(true);
        }
        setConfirmMessage("");
        setIsConfirmOpen(false);
    };

    const handleReloadTree = (featureId: string, entID?: string | undefined) => {
        setLastSelectedNodeKey(entID);
        if (featureId === FEnums.AuditSession || featureId === FEnums.InventoryCollection
            || featureId === FEnums.InventoryReconciliation) {
            callApiToRefreshTree();
        }
        else if (featureId === FEnums.ModelBusinessService) {
            callApiToRefreshTree();
        }
        else if (featureId === FEnums.AssetPlacement || featureId === FEnums.InboundAssetPlacement) {
            fetchAssetsForBin(featureId);
        }
        else if (
            featureId === FEnums.Relocate ||
            featureId === FEnums.AssetPlacement ||
            featureId === FEnums.ReplacementProfile ||
            featureId === FEnums.Replace
        ) {
            setPlanTreeRefreshKey(prev => prev + 1);
        }
    }

    const handleNodeDropEvent = async (info: NodeDragEventParams<ITreeNode> & {
        dragNode: EventDataNode<ITreeNode>;
        dragNodesKeys: Key[];
        dropPosition: number;
        dropToGap: boolean;
    }) => {
        if (info.dragNode && info.node) {
            if (featureContainerProps.featureId === FEnums.ModelBusinessService) {
                async function addBsDataToApi(
                    rootNode: ITreeNode,
                    dropParentNode: ITreeNode,
                    statusBarContext: IStatusBar
                ): Promise<string> {
                    let firstInsertedEntID = "";
                    // Insert BS
                    const insertBS = async (
                        node: ITreeNode,
                        parentId: string
                    ): Promise<string> => {
                        let insertedId = "";
                        await axiosInterceptor(
                            {
                                url: EM.AddUpdateTableRecord,
                                data: {
                                    jsonString: JSON.stringify({
                                        _BS: [
                                            {
                                                IsNZ: "0",
                                                Secured: "0",
                                                NodeType: "BusinessServiceNode",
                                                GroupName: "Business Services",
                                                _BS: node.Name,
                                                EntID: "",
                                                NodeEntityName: node.NodeEntityname,
                                                ParentID: parentId
                                            }
                                        ]
                                    })
                                },
                                setFetchData: (resp: unknown, status?: string) => {
                                    if (status !== "200") {
                                        handleShowUserMessage("Failed to add Business Service.");
                                        return;
                                    }

                                    if (
                                        typeof resp !== "object" ||
                                        resp === null ||
                                        !("jsonStringOutput" in resp)
                                    ) {
                                        handleShowUserMessage("Failed to add Business Service.");
                                        return;
                                    }

                                    try {
                                        const parsed = FnParseJsonSafely(
                                            String(resp.jsonStringOutput)
                                        ) as {
                                            _BS?: { EntID?: string }[];
                                        };

                                        insertedId = parsed?._BS?.[0]?.EntID ?? "";

                                        if (!insertedId) {
                                            handleShowUserMessage("Failed to add Business Service.");
                                        }
                                    } catch {
                                        handleShowUserMessage("Failed to add Business Service.");
                                    }
                                }
                            },
                            statusBarContext
                        );
                        return insertedId;
                    };
                    // Insert Device
                    const insertDevice = async (
                        node: ITreeNode,
                        parentId: string
                    ): Promise<string> => {
                        let insertedId = "";
                        await axiosInterceptor(
                            {
                                url: EM.AddUpdateTableRecord,
                                data: {
                                    jsonString: JSON.stringify({
                                        "PG.BSDevice": [
                                            {
                                                NodeType: node.NodeType,
                                                NodeHealthStatus: 0,
                                                Name: node.Name,
                                                NodeEntID: node.NodeEntID,
                                                NodeEntityName:
                                                    node.NodeEntityname,
                                                EntID: parentId
                                            }
                                        ]
                                    })
                                },
                                setFetchData: (resp: unknown, status?: string) => {
                                    if (status !== "200") {
                                        handleShowUserMessage("Failed to add Device.");
                                        return;
                                    }

                                    if (
                                        typeof resp !== "object" ||
                                        resp === null ||
                                        !("jsonStringOutput" in resp)
                                    ) {
                                        handleShowUserMessage("Failed to add Device.");
                                        return;
                                    }

                                    try {
                                        const parsed = FnParseJsonSafely(
                                            String(resp.jsonStringOutput)
                                        ) as {
                                            "PG.BSDevice"?: { EntID?: string }[];
                                        };

                                        insertedId = parsed?.["PG.BSDevice"]?.[0]?.EntID ?? "";

                                        if (!insertedId) {
                                            handleShowUserMessage("Failed to add Device.");
                                        }
                                    } catch {
                                        handleShowUserMessage("Failed to add Device.");
                                    }
                                }
                            },
                            statusBarContext
                        );
                        return insertedId;
                    };

                    // Insert BSLink
                    const insertBSLink = async (
                        node: ITreeNode,
                        parentId: string
                    ): Promise<string> => {
                        let insertedId = "";
                        await axiosInterceptor(
                            {
                                url: EM.AddUpdateTableRecord,
                                data: {
                                    jsonString: JSON.stringify({
                                        "PG.BSLink": [
                                            {
                                                NodeType: node.NodeType || "BusinessServiceNodeLink",
                                                Name: node.Name,
                                                NodeEntityName: node.NodeEntityname || "BS",
                                                NodeEntID: node.NodeEntID ?? node.EntID,
                                                EntID: parentId,
                                                EntityName: "BS"
                                            }
                                        ]
                                    })
                                },
                                setFetchData: (resp: unknown, status?: string) => {
                                    if (status !== "200") {
                                        handleShowUserMessage("Failed to add Business Service link.");
                                        return;
                                    }

                                    if (
                                        typeof resp !== "object" ||
                                        resp === null ||
                                        !("jsonStringOutput" in resp)
                                    ) {
                                        handleShowUserMessage("Failed to add Business Service link.");
                                        return;
                                    }

                                    try {
                                        const parsed = FnParseJsonSafely(
                                            String(resp.jsonStringOutput)
                                        ) as {
                                            "PG.BSLink"?: { EntID?: string }[];
                                            BSLink?: { EntID?: string }[];
                                        };

                                        insertedId =
                                            parsed?.["PG.BSLink"]?.[0]?.EntID ??
                                            parsed?.BSLink?.[0]?.EntID ??
                                            "";

                                        if (!insertedId) {
                                            handleShowUserMessage("Failed to add Business Service link.");
                                        }
                                    } catch {
                                        handleShowUserMessage("Failed to add Business Service link.");
                                    }
                                }
                            },
                            statusBarContext
                        );
                        return insertedId;
                    };
                    // Recursive traversal
                    const traverse = async (
                        node: ITreeNode,
                        parentId: string
                    ): Promise<void> => {
                        if (!parentId) {
                            return;
                        }
                        let currentId = parentId;
                        if (
                            node.NodeType?.toLowerCase() ===
                            "businessservicenode"
                        ) {
                            currentId = await insertBS(
                                node,
                                parentId
                            );
                            // Stop this branch if insert failed
                            if (!currentId) {
                                return;
                            }
                        } else if (
                            node.NodeType?.toLowerCase() ===
                            "device"
                        ) {
                            await insertDevice(node, parentId);
                            return;
                        } else if (isBSLinkNode(node)) {
                            await insertBSLink(node, parentId);
                            return;
                        }
                        if (node.children?.length) {
                            for (const child of node.children) {
                                await traverse(child, currentId);
                            }
                        }
                    };
                    // Root device
                    if (
                        rootNode.NodeType?.toLowerCase() ===
                        "device"
                    ) {
                        await insertDevice(
                            rootNode,
                            dropParentNode.NodeEntID!
                        );
                        return dropParentNode.NodeEntID!;
                    }
                    // Root BSLink
                    if (isBSLinkNode(rootNode)) {
                        const linkId = await insertBSLink(
                            rootNode,
                            dropParentNode.NodeEntID ?? dropParentNode.EntID!
                        );
                        return linkId || dropParentNode.NodeEntID!;
                    }
                    // Root BS
                    firstInsertedEntID = await insertBS(
                        rootNode,
                        dropParentNode.NodeEntID!
                    );
                    // If first API failed, stop everything
                    if (!firstInsertedEntID) {
                        handleShowUserMessage(
                            "Failed to add Business Service."
                        );
                        return "";
                    }
                    // Process children
                    if (rootNode.children?.length) {
                        for (const child of rootNode.children) {
                            await traverse(
                                child,
                                firstInsertedEntID
                            );
                        }
                    }
                    return firstInsertedEntID;
                }
                const entityName = "BS";
                if (info.event.altKey === true && info.node) {
                    const bsDataToLink = {
                        "PG.BSLink": [
                            {
                                NodeType: "BusinessServiceNodeLink", // You can make this dynamic if needed
                                Name: `${info.dragNode.Name}.Link`,
                                NodeEntityName: info.dragNode.NodeEntityname,
                                NodeEntID: info.dragNode.EntID,
                                EntID: info.node.EntID,
                                EntityName: entityName
                            }
                        ]
                    }
                    axiosInterceptor({
                        url: EM.AddUpdateTableRecord,
                        data: {
                            jsonString: JSON.stringify(bsDataToLink)
                        },
                        setFetchData: (
                            updateTableRecordApiResponse: unknown,
                            status?: string
                        ) => {

                            if (status !== "200") {
                                handleShowUserMessage(
                                    "Failed to create Business Service link."
                                );
                                return;
                            }
                            if (
                                updateTableRecordApiResponse &&
                                typeof updateTableRecordApiResponse === "object" &&
                                "jsonStringOutput" in updateTableRecordApiResponse
                            ) {
                                const parsedData = FnParseJsonSafely(
                                    updateTableRecordApiResponse.jsonStringOutput as string,
                                    {
                                        key: "PG.BSLink",
                                        isKeySplit: false
                                    }
                                );
                                if (
                                    Array.isArray(parsedData) &&
                                    parsedData.length > 0
                                ) {
                                    const id = parsedData[0]?.EntID || "";
                                    if (!id) {
                                        handleShowUserMessage(
                                            "Failed to create Business Service link."
                                        );
                                        return;
                                    }
                                    setLastSelectedNodeKey(id);
                                    callApiToRefreshTree();
                                } else {
                                    handleShowUserMessage(
                                        "Failed to create Business Service link."
                                    );
                                }
                            }
                        }
                    }, statusBarContext);
                }
                else {
                    if (info.dragNode.NodeType?.toLowerCase() === "device") {
                        if (isBSLinkNode(info.node as ITreeNode)) {
                            return;
                        }
                        await axiosInterceptor({
                            url: EM.AddUpdateTableRecord,
                            data: {
                                jsonString: JSON.stringify({
                                    'PG.BSDevice': [{
                                        NodeType: info.dragNode.NodeType,
                                        NodeHealthStatus: 0,
                                        Name: info.dragNode.Name,
                                        NodeEntID: info.dragNode.NodeEntID,
                                        NodeEntityName: info.dragNode.NodeEntityname,
                                        EntID: (info.node as ITreeNode).NodeEntID
                                    }]
                                })
                            },
                            setFetchData: (addTableRecordApiResponse: unknown, status?: string) => {
                                if (status !== "200") {
                                    handleShowUserMessage(
                                        "Failed to add Device."
                                    );
                                    return;
                                }
                                if (
                                    addTableRecordApiResponse &&
                                    typeof addTableRecordApiResponse === "object" &&
                                    'jsonStringOutput' in addTableRecordApiResponse
                                ) {
                                    try {
                                        const parsedData = FnParseJsonSafely((addTableRecordApiResponse as any).jsonStringOutput);
                                        const entityArray = parsedData?.[`PG.BSDevice`];
                                        if (
                                            Array.isArray(entityArray) &&
                                            entityArray.length > 0
                                        ) {
                                            const lastAddedRecordID =
                                                entityArray[0]?.EntID || "";
                                            if (!lastAddedRecordID) {
                                                handleShowUserMessage(
                                                    "Failed to add Device."
                                                );
                                                return;
                                            }
                                            setLastSelectedNodeKey(
                                                lastAddedRecordID
                                            );
                                            callApiToRefreshTree();
                                        } else {
                                            handleShowUserMessage(
                                                "Failed to add Device."
                                            );
                                        }
                                    } catch (error) {
                                        console.error("Failed to parse JSON or extract EntID:", error);
                                        handleShowUserMessage(
                                            "Failed to add Device."
                                        );
                                    }
                                }
                            }
                        }, statusBarContext);
                    }
                    else {
                        const lastInsertedRecord = await addBsDataToApi(info.dragNode, info.node, statusBarContext)
                        if (lastInsertedRecord) {
                            setLastSelectedNodeKey(lastInsertedRecord);
                            callApiToRefreshTree();
                        }
                    }
                }
            }
        }
    }

    const isNodeDraggable: DraggableConfig = {
        nodeDraggable: (node) => {
            const typedNode = node as ITreeNode;
            return typedNode.NodeType !== 'BusinessServices';
        },
    }

    const getClassNameBasedOnFeatureId = (featureId: string) => {
        switch (featureId) {
            case AppQA.Report:
                return "nz-feature-report"
            case AppQA.Delegate:
                return "nz-feature-user"
            case AppQA.Task:
                return "nz-feature-task"
            case AppQA.Reminder:
                return "nz-feature-reminder"
            default:
                return `nz-feature-${featureId}`
        }
    }

    const handleClearCacheTreeData = (): void => {
        if (featureContainerProps.featureId === FEnums.InventoryManagement || featureContainerProps.featureId === FEnums.InventoryConfiguration) {
            setOriginalTreeData([]);
            setOriginalTreeDataWithoutFilter([]);
        }
        else if (featureContainerProps.featureId && ReuseDataForFeatures.includes(featureContainerProps.featureId)) {
            setOriginalTreeDataForInventory([]);
            setOriginalTreeDataWithoutFilter([]);
        }
        else {
            setOriginalTreeData([]);
            setOriginalTreeDataForInventory([]);
        }
    }

    const handleShowUserMessage = (messageText: string, container?: HTMLDivElement, isShowAsPrompt?: boolean) => {
        if (isShowAsPrompt) {
            // Show toast near the mouse pointer, clamped so it stays inside the viewport.
            const { x, y } = mousePositionRef.current;
            const offset = 12;
            const estimatedWidth = 180;
            const estimatedHeight = 48;
            setOverlayPosition({
                left: Math.min(Math.max(x + offset, offset), window.innerWidth - estimatedWidth),
                top: Math.min(Math.max(y + offset, offset), window.innerHeight - estimatedHeight)
            });
            setConfirmMessage(messageText);
            setShowOverlay(true);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
            }
            overlayTimerRef.current = window.setTimeout(() => {
                setShowOverlay(false);
                setOverlayPosition(null);
                overlayTimerRef.current = null;
            }, 2000);
        }
        else {
            setConfirmMessage(messageText);
            setIsConfirmOpen(true);
            setIsShowOkButton(true);
            yesNoDialogContainerRef.current = container;
        }
    }

    const handleShowMessage = (isShowOkButtonOnly: boolean, errorMessage: string): void => {
        setIsShowOkButton(isShowOkButtonOnly);
        setConfirmMessage(errorMessage);
        setIsConfirmOpen(true);
    }

    const canAcceptExternalDrop = (targetNode: ITreeNode): boolean => {
        if (featureContainerProps.featureId === FEnums.ModelBusinessService) {
            if (targetNode.NodeType?.toLowerCase() === "businessservices") {
                return false;
            }
            if (isBSLinkNode(targetNode)) {
                return false;
            }
            return true;
        }
        return false;
    };

    const handleExternalDrop = (
        event: React.DragEvent<HTMLSpanElement>,
        targetNode: ITreeNode
    ): void => {
        try {
            if (
                featureContainerProps.featureId !==
                FEnums.ModelBusinessService
            ) {
                return;
            }
            if (!dragItem?.node || !targetNode || isBSLinkNode(targetNode)) {
                return;
            }
            const entityName = targetNode.NodeEntityname;
            if (!entityName) {
                handleShowUserMessage("Entity name not found.");
                return;
            }
            const bsDataToAdd = {
                "PG.BSDevice": [
                    {
                        NodeType: "Device",
                        NodeHealthStatus: 0,
                        Name: dragItem.node.Name,
                        NodeEntID: dragItem.node.NodeEntID,
                        NodeEntityName: dragItem.node.NodeEntityname,
                        EntID: targetNode.NodeEntID
                    }
                ]
            };
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(bsDataToAdd)
                },
                setFetchData: (
                    addTableRecordApiResponse: unknown,
                    status?: string
                ) => {
                    try {
                        if (status !== "200") {
                            handleShowUserMessage(
                                "Failed to add device to business service."
                            );
                            return;
                        }
                        if (
                            !addTableRecordApiResponse ||
                            typeof addTableRecordApiResponse !== "object" ||
                            !("jsonStringOutput" in addTableRecordApiResponse)
                        ) {
                            handleShowUserMessage(
                                "Invalid response received from server."
                            );
                            return;
                        }
                        const parsedData = FnParseJsonSafely(
                            addTableRecordApiResponse.jsonStringOutput as string
                        );
                        if (
                            !parsedData ||
                            typeof parsedData !== "object"
                        ) {
                            handleShowUserMessage(
                                "Failed to process response data."
                            );
                            return;
                        }
                        const entityArray =
                            parsedData["PG.BSDevice"];
                        if (
                            !Array.isArray(entityArray) ||
                            !entityArray.length
                        ) {
                            handleShowUserMessage(
                                "No device data found after add operation."
                            );
                            return;
                        }
                        const id =
                            entityArray[0]?.EntID || "";
                        const featureId =
                            featureContainerProps.featureId;
                        if (!featureId || !id) {
                            handleShowUserMessage(
                                "Failed to refresh tree after add operation."
                            );
                            return;
                        }
                        setLastSelectedNodeKey(id);
                        callApiToRefreshTree(featureId);
                    } catch (error) {
                        console.error(
                            "Failed to process add table record response",
                            error
                        );
                        handleShowUserMessage(
                            "Failed to process response data."
                        );
                    }
                }
            }, statusBarContext);
        } catch (error) {
            console.error(
                "Failed to handle external drop",
                error
            );
            handleShowUserMessage(
                "Something went wrong while adding device."
            );
        }
    };

    useEffect(() => {
        if (featureContainerProps.selectedFeatureData?.Label !== "Help")
            setSelectedFeatureName(featureContainerProps.selectedFeatureData?.Label)
    }, [featureContainerProps.selectedFeatureData?.Label])

    function handleSelectedMenuItem(selectedMenuItem: IMenuItem): void {
        setSelectedFeatureName(selectedMenuItem.Label)
    }
    /*
        Main Feature Layout Render Logic:
       -content div will be hidden when Appqa is rendered
       -allowMultipleTree is set to true for below features : 
           -AuditSession
           -ModelBusinessService
           -FindPlacement
           -Delete
           -InboundAssetPlacement
           -ManageBusinessService
           -Relocate
       -if allowMultipleTree is false ExplorerContainer will render and that will have different logic  
    */
    return (
        <div ref={containerDivRef} key={featureContainerProps.uniqueName} id="FeatureContainer" className={`nz-feature-container ${getClassNameBasedOnFeatureId(featureContainerProps.featureId)}`}>
            <div style={{
                display: allowAppQaToRender ? 'none' : 'flex'
            }} className='nz-wh-100 nz-feature-content'>
                {allowMultipleTree ?
                    <div
                        className='nz-w-100 nz-h-100 nz-dual-tree-focus-host'
                        onMouseDown={(e) => {
                            // Only tree clicks (nodes or empty tree area) change focus.
                            // Layout / pane-3 clicks leave the current dimmed state as-is.
                            FnFocusRcTreeFromTreeClick(e.target);
                        }}
                    >
                        <Splitter tabIndex={-1} className='nz-w-100 nz-h-100 nz-feature-container-splitter'>
                            <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-feature-explorer-pane nz-exp-pane">
                                {featureContainerProps.allowShowHeader &&
                                    <div className='nz-sub-header  nz-d-flex-row nz-align-center nz-justify-between nz-feature-explorer-header'>
                                        <Label uniqueName={featureContainerProps.uniqueName + "header"} label={featureContainerProps.headerText ?? ""} fontWeight="bold" />
                                    </div>
                                }
                                {/* Explorer Renderer
                                Rendering Logic:
                               -FEATURE => Custom hierarchy tree like-AuditSession
                                           -ModelBusinessService
                                           -Asset Placement
                                           -ManageBusinessService
                               -PLAN    => Planning/transfer explorer for : 
                                           -Delete
                                           -Relocate
                            */}
                                {explorerToRender === "FEATURE" && hierarchyApiData && typeof hierarchyApiData === "object" ?
                                    <ExplorerTreeContainer
                                        uniqueName={`feature-explorer-tree`}
                                        featureId={featureContainerProps.featureId}
                                        defaultSelectedNodeKey={lastSelectedNodeKey}
                                        handleNodeSelect={handleNodeSelect}
                                        handleKebabMenuSelect={handleKebabMenuSelect}
                                        onDrop={handleNodeDropEvent}
                                        handleDragStart={({ node, event }) => {
                                            event.dataTransfer.setData("sourceTree", "feature-explorer-tree");
                                            const typedNode = node as ITreeNode;
                                            if (typedNode.NodeType !== 'BusinessServiceNode' && typedNode.NodeType !== 'Device') {
                                                event.preventDefault();
                                            }
                                        }}
                                        allowDrag={false}
                                        allowInternalDrag={featureContainerProps.featureId === FEnums.ManageBusinessService ? false : isNodeDraggable}
                                        allowDrop={featureContainerProps.featureId === FEnums.ModelBusinessService}
                                        allowSearchControl={featureContainerProps.featureId !== FEnums.ManageBusinessService && featureContainerProps.featureId !== FEnums.ModelBusinessService}
                                        apiData={hierarchyApiData}
                                        canAcceptExternalDrop={canAcceptExternalDrop}
                                        handleExternalDrop={handleExternalDrop}
                                        updateStatusBarData={featureContainerProps.updateStatusBarData}
                                        handleShowMessage={handleShowMessage}
                                        handleShowUserMessage={handleShowUserMessage} />
                                    :
                                    null
                                }
                                {explorerToRender === "PLAN" &&
                                    <PlanTreeContainer
                                        key={`${featureContainerProps.uniqueName}-plan-explorer-${planTreeRefreshKey}`}
                                        uniqueName={`${featureContainerProps.uniqueName}-plan-explorer`}
                                        featureId={featureContainerProps.featureId}
                                        tagName={"Transfer"}
                                        selectedNodeKey={selectedNodeInfo?.node?.NodeEntID || selectedNodeInfo?.node?.key?.toString()}
                                        handleNodeSelect={handleNodeSelect}
                                    />
                                }
                            </SplitterPanel>
                            <SplitterPanel tabIndex={-1} size={75} minSize={30} className={"nz-d-flex-column nz-align-center nz-feature-explorer-right-pane"}>
                                {hierarchyApiData ? selectedNodeInfo && selectedNodeInfo.node &&
                                    <div className='nz-sub-header'>
                                        {featureContainerProps.featureId === FEnums.AssetPlacement
                                            || featureContainerProps.featureId === FEnums.InboundAssetPlacement || featureContainerProps.featureId === FEnums.Transfer
                                            || featureContainerProps.featureId === FEnums.Delete || featureContainerProps.featureId === FEnums.Relocate ?
                                            "Select Floor"
                                            :
                                            <Label uniqueName={"header" + featureContainerProps.uniqueName} label={selectedNodeInfo.node.Name ?? ""} />
                                        }
                                    </div>
                                    :
                                    <></>
                                }
                                {/*
                                Right Panel Content will rendered here only when :
                                   -hierarchy data exists
                                   -a tree node is selected
                                else will render empty
                            */}
                                {hierarchyApiData && selectedNodeInfo && selectedNodeInfo.node ?
                                    <ExplorerContainer uniqueName={`${featureContainerProps.uniqueName}-explorer-container`}
                                        featureId={featureContainerProps.featureId} allowShowHeader={false}
                                        headerText=''
                                        featureData={mainAppContext.featureRecords}
                                        selectedNodeExplorer={selectedNodeInfo}
                                        selectedFloorNode={selectedFloorNode}
                                        firstPaneTreeData={firstPaneTreeData}
                                        selectedKebabMenu={selectedKebabMenu}
                                        clearCacheTreeData={handleClearCacheTreeData}
                                        selectedNodeForCustomization={selectedNodeForCustomization}
                                        handleReloadTree={handleReloadTree}
                                        handleShowUserMessage={handleShowUserMessage}
                                        updateStatusBarData={featureContainerProps.updateStatusBarData}
                                        subTreeFeatureId={featureContainerProps.featureId === FEnums.ModelBusinessService || featureContainerProps.featureId === FEnums.ManageBusinessService ? FEnums.Server : FEnums.Assets}
                                        selectedFeatureData={featureContainerProps.selectedFeatureData} />
                                    :
                                    (featureContainerProps.featureId === FEnums.Relocate || featureContainerProps.featureId === FEnums.AssetPlacement || featureContainerProps.featureId === FEnums.InboundAssetPlacement) ?
                                        <div className="nz-wh-100 nz-d-flex-hv-left">{featureContainerProps.featureId === FEnums.Relocate ? `Select device without workorder to view details` : `Select device to view details`}</div>
                                        :
                                        <></>
                                }
                            </SplitterPanel>
                        </Splitter>
                    </div>
                    :
                    <ExplorerContainer uniqueName={`${featureContainerProps.uniqueName}-explorer-container`}
                        featureId={featureContainerProps.featureId}
                        originalTreeData={featureContainerProps.featureId === FEnums.InventoryManagement || featureContainerProps.featureId === FEnums.InventoryConfiguration ? originalTreeDataForInventory : originalTreeData}
                        allowShowHeader={true}
                        featureData={mainAppContext.featureRecords}
                        headerText={featureContainerProps.headerText}
                        clearCacheTreeData={handleClearCacheTreeData}
                        selectedNodeForCustomization={selectedNodeForCustomization}
                        selectedFeatureData={featureContainerProps.selectedFeatureData}
                        updateOriginalTreeDataset={updateOriginalTreeDataset}
                        handleShowUserMessage={handleShowUserMessage}
                        updateStatusBarData={featureContainerProps.updateStatusBarData}
                        handleReloadTree={handleReloadTree}
                    />
                }
            </div>
            {/* Renders AppQA modules dynamically based on appqaId.
                Returns null if no matching AppQA module exists */}
            <AppQaContainer
                allowAppQaToRender={allowAppQaToRender}
                featureContainerProps={featureContainerProps}
                featureRecords={mainAppContext.featureRecords}
                selectedFeatureNameForHelp={mainAppContext.selectedFeatureForHelp?.featureName ?? "Help"}
                handleSelectedMenuItem={handleSelectedMenuItem}
                handleShowUserMessage={handleShowUserMessage}
            />
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'appqatask-confirm'}
                message={confirmMessage}
                showOkButton={isShowOkButton}
                container={yesNoDialogContainerRef.current}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }}
                handleOkButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }} />
            {showOverlay && <div className="nz-overlay-toast" id="nzOverlay"
                style={overlayPosition ? { left: overlayPosition.left, top: overlayPosition.top } : undefined}>
                <div className="nz-overlay-message">
                    {confirmMessage || "Saved"}
                </div>
            </div>}
        </div >
    )
}
export { FeatureContainer }

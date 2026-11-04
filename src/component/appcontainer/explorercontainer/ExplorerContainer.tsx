
import React, { JSX, useEffect, useRef, useState } from 'react'
import { OpenSidebar24x24 } from '@n20a/libicon'
import { Splitter, SplitterPanel, SplitterResizeEndEvent } from 'primereact/splitter'
import { Key } from 'rc-tree/lib/interface'
import { CheckInfo } from 'rc-tree/lib/Tree'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx';

import '../allcss/ExplorerContainer.css'

import { FeatureQARange, FEnums, RightMouseMenuTreeNode } from '../../constants/Feature';
import { FnFindNearestNodeByType } from '../../shared/allcommon/FnFindNearestNodeByType'
import { FnCopyToClipboard } from '../../shared/allcommon/basic/FnCopyToClipboard'
import { FnHandleAPIResponse } from '../../shared/allcommon/basic/FnHandleAPIResponse'
import { FnGetParentTreeNodeInfoUsingDiv } from '../../shared/allcommon/tree/FnGetParentTreeNodeInfoUsingDiv'
import { DELIMITER } from '../../shared/alldefaultprops/basic/DefaultPropsChekedListBoxControl'
import { FeaturesThatNeedToUpdateInSession, NormalDCExplorerFeatures, ReuseDataForFeatures } from '../../shared/alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer'
import { FnGetCssVariable } from '../allcommon/FnGetCssVariable'
import { FnGetParentHierarchy } from '../allcommon/FnGetParentHierarchy';
import { FnParseJsonSafely } from '../allcommon/FnParseJsonSafely';
import { useCommonVariableContext } from '../../shared/context/hooks/CommonVariableHooks'
import { useExplorerTreeContext } from '../../shared/context/hooks/ExplorerTreeHooks';
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks'
import { useSelectedNodeContext } from '../../shared/context/hooks/SelectedNodeHooks'
import { useSessionContext } from '../../shared/context/hooks/SessionHooks'
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks'
import { AUDIT, CLOUD, EM, EXPAPI, EXPLORER, LOG, SESSION, VIRTUAL } from '../../shared/interceptors/EndPoints'
import { axiosInterceptor, axiosInterceptorForPowerBi } from '../../shared/interceptors/Interceptor';

import { IFeatureItem } from '../../shared/context/allinterface/IMainApp'
import { IActionImageForSubMenu } from '../../shared/allinterface/basic/IActionImageList'
import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu'
import { ISelectedNodeInfo, ITreeNode } from '../../shared/allinterface/tree/ITreeControl'
import { IExplorerContainer } from '../allinterface/IExplorerContainer'

import { InventoryCollectionContainer } from '../../features/audit/InventoryCollectionContainer';
import { ImportAuditInventory } from '../../features/audit/ImportAuditInventory'
import { CablingToggleButton } from '../../features/cabling/cablinggrid/CablingToggleButton'
import { AllDataCenterTree } from '../../features/home/alldatacentertree/AllDataCenterTree'
import { ExportDeviceContainer } from '../../features/rackandstack/kebabmenu/exportdevice/ExportDeviceContainer'
import { ImportDeviceContainer } from '../../features/rackandstack/kebabmenu/importdevice/ImportDeviceContainer'
import { ExportCableContainer } from '../../features/store/kebabmenu/exportcable/ExportCableContainer'
import { ImportCableContainer } from '../../features/store/kebabmenu/importcable/ImportCableContainer'
import { CablingPortMap } from '../../features/store/kebabmenu/mapports/CablingPortMap'
import { ActionImage } from '../../shared/basic/actionimage/ActionImage'
import { Label } from '../../shared/basic/label/Label'
import { DcExplorerContainer } from '../../shared/dcexplorercontainer/DcExplorerContainer'
import { ExplorerTreeContainer } from '../../shared/explorertreecontainer/ExplorerTreeContainer'
import { PlanTreeContainer } from '../../shared/plantreecontainer/PlanTreeContainer';
import { RelocateTreeContainer } from '../../features/plan/relocatetreecontainer/RelocateTreeContainer';
import { AddDcObjectsContainer } from '../../shared/settingsform/adddcobjectscontainer/AddDcObjectsContainer';
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer'
import { LayoutContainer } from "../layoutcontainer/LayoutContainer"
import { SidebarContainer } from "../sidebarcontainer/SidebarContainer"
import { FnGetExpApiUrlBasedOnEndPoint } from '../allcommon/FnGetExpApiUrlBasedOnEndPoint'
import { FnExportCabling } from '../../features/allcommon/FnExportCabling'
import { ImportCabling } from '../../features/cabling/kebabmenu/ImportCabling'
import { ManageDeviceData } from '../../features/store/kebabmenu/ManageDeviceData'

const actionlog: IFeatureItem[] = [{
    MenuID: "126",
    _Feature: "1300",
    Label: "ActionLog",
    NodeType: "",
    SearchPrompt: null,
    Tooltip: "Diagnostic Log",
    SortOrder: 1,
    DefaultQA: false,
    FilterForm: "",
    Secured: true,
    IsNZ: true,
    EntID: "864EA206-B54F-42CC-86B8-F97BB9AF7BC2",
    RecID: "BFF0B086-9C02-4D3F-8659-FEB45AA47BC9",
    LastUpdated: "2025-05-22T15:48:44.690",
    EntityName: "Feature",
    FeatureTag: ''
}]

const ExplorerContainer = (explorerContainerProps: IExplorerContainer) => {
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo>();
    const [isShowSidebar, setIsShowSidebar] = useState<boolean>(false);
    const [originalTreeData, setOriginalTreeData] = useState<ITreeNode[]>([]);
    const [originalTreeDataForInventory, setOriginalTreeDataForInventory] = useState<ITreeNode[]>([]);
    const [featureQAData, setFeatureQAData] = useState<IFeatureItem[]>();
    const [controlHtmlToRender, setControlHtmlToRender] = useState<JSX.Element | null>(null);
    const [popupcontrolHtmlToRender] = useState<JSX.Element | null>(null);
    const [selectedNodeMenu, setSelectedNodeMenu] = useState<IMenuItem | null>(null);
    const [kebabMenuContainerHeaderText, setKebabMenuContainerHeaderText] = useState<string>();
    const [showFloorLayout, setShowFloorLayout] = useState<boolean>(false);
    const [showSidebarFullWidth, setShowSidebarFullWidth] = useState<boolean>(false);
    const [allowContainerHeader, setAllowContainerHeader] = useState(false);
    const [isSidebar, setIsSidebar] = useState<string | undefined>("sidebarOpen");
    const [defaultCheckedKeys, setDefaultCheckedKeys] = useState<Key[]>([]);
    const [checkedNode, setCheckedNode] = useState<ITreeNode>();
    const [selectedSubGroupItem, setSelectedSubGroupItem] = useState<IMenuItem>();
    const [manuallyNodeSelected, setManuallyNodeSelected] = useState<boolean>(false);
    const [hierarchyApiData, setHierarchyApiData] = useState<unknown>();
    const [explorerToRender, setExplorerToRender] = useState<"DC" | "FEATURE" | "PLAN" | "ALL_DC" | "EMPTY" | "NONE" | "RELOCATE">();
    const [activeView, setActiveView] = useState<"INVENTORY" | "DEFAULT">("DEFAULT");
    const [treeData, setTreeData] = useState<ITreeNode[]>();
    const [isSiteByTenant, setIsSiteByTenant] = useState<"AllSites" | "TenantsBySite" | "SitesByTenant">("AllSites");
    const [selectedKebabMenuExplorer, setSelectedKebabMenuExplorer] = useState<IMenuItem>();
    const [powerConfigureFeatureData, setPowerConfigureFeatureData] = useState<IFeatureItem[]>();
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<IMenuItem>();
    const [selectedFloorNode, setSelectedFloorNode] = useState<ITreeNode>();
    const [cablingHeaderBtn, setCablingHeaderBtn] = useState<boolean>(false);
    const [cablingButtonObject, setCablingButtonObject] = useState<{ fromPort: boolean, cable: boolean, toDevicePort: boolean } | undefined>({ fromPort: false, cable: false, toDevicePort: false })
    const [addToCableRtmSelect, setAddtoCableRtmSelect] = useState<IMenuItem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isShowOkButton, setIsShowOkButton] = useState(true);
    const [isSaveProcessing, setIsSaveProcessing] = useState(false);
    const [isShowSidebarIcon, setIsShowSidebarIcon] = useState<boolean>(true);
    const [planTreeRefreshKey, setPlanTreeRefreshKey] = useState<number>(0);

    const [searchParams] = useSearchParams();

    const mainAppContext = useMainAppContext();
    const commonVariableContext = useCommonVariableContext();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const selectedNodeContext = useSelectedNodeContext();
    const explorerTreeContext = useExplorerTreeContext();

    const isAllowNewAuditRef = useRef<boolean>(false);
    const originalTreeDataRef = useRef<ITreeNode[]>(explorerContainerProps.originalTreeData);
    const defaultCheckedKeyRef = useRef<Key[]>([]);
    const featureIdRef = useRef(explorerContainerProps.featureId);
    const eqid = searchParams?.get('eqid');
    const outerTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navigate = useNavigate();

    // Clears explorer tree refs when container unmounts.
    // Clears transient timeout handles on unmount.
    useEffect(() => {
        return () => {
            originalTreeDataRef.current = []
            defaultCheckedKeyRef.current = []
            if (outerTimeoutIdRef.current) clearTimeout(outerTimeoutIdRef.current);
            if (retryTimeoutIdRef.current) clearTimeout(retryTimeoutIdRef.current);
        }
    }, [])

    // Keeps latest feature id in ref for deferred callbacks.
    useEffect(() => {
        featureIdRef.current = explorerContainerProps.featureId;

        setDefaultCheckedKeys([])
        setSelectedFloorNode(undefined);
    }, [explorerContainerProps.featureId]);

    useEffect(() => {
        if (explorerContainerProps.selectedFloorNode) {
            setSelectedFloorNode(explorerContainerProps.selectedFloorNode);
        }
    }, [explorerContainerProps.selectedFloorNode]);

    // Controls sidebar visibility based on selected kebab action and node restrictions.
    useEffect(() => {
        const kebabLabel = explorerContainerProps.selectedKebabMenu?.Label;
        const nodeType = explorerContainerProps.selectedNodeExplorer?.node?.NodeType?.toLowerCase();
        const hasNodeEvent = explorerContainerProps.selectedNodeExplorer?.nativeEvent;
        const hideSidebarForFeature = [
            FEnums.ReviewPowerCabling.toString(),
            FEnums.PowerTrace.toString(),
            FEnums.PowerNavigate.toString(),
            FEnums.EditPowerCabling.toString(),
            FEnums.ReviewNetworkCabling.toString(),
            FEnums.NetworkTrace.toString(),
            FEnums.NetworkNavigate.toString(),
            FEnums.EditNetworkCabling.toString(),
            FEnums.Workorder.toString(),
            FEnums.Replace.toString(),
            FEnums.ReplacementProfile.toLowerCase()
        ].includes(explorerContainerProps.featureId);

        //  PRIORITY 1: PreviewAuditInventory
        if (kebabLabel === RightMouseMenuTreeNode.AddNewAuditSession) {
            const nodeType = selectedNodeInfo?.node?.NodeType?.toLowerCase();
            if (nodeType === "site" || nodeType === "room") {
                isAllowNewAuditRef.current = false;
                explorerContainerProps.handleShowUserMessage?.("Select valid Location to Add New Audit Session");
            }
            else {
                isAllowNewAuditRef.current = true;
                setIsShowSidebar(true);
                setIsSidebar('sidebarOpen');
                setSelectedKebabMenuExplorer(explorerContainerProps.selectedKebabMenu)
            }
            return;
        }
        if (kebabLabel === RightMouseMenuTreeNode.AddNewBusinessService) {
            setIsShowSidebar(true);
            setIsSidebar('sidebarOpen');
            setSelectedKebabMenuExplorer(explorerContainerProps.selectedKebabMenu)
            return;
        }
        setSelectedKebabMenuExplorer(undefined)
        if (kebabLabel === RightMouseMenuTreeNode.PreviewAuditInventory) {
            handleSidebarOpenClose("close")
            setActiveView("INVENTORY"); //  set here
            setAllowContainerHeader(true);
            return;
        }
        //  IMPORTANT: RESET activeView when NOT Preview
        setActiveView("DEFAULT"); //  THIS WAS MISSING
        //  PRIORITY 2: Feature restrictions
        if (
            hideSidebarForFeature
        ) {
            handleSidebarOpenClose("close")
            setIsShowSidebarIcon(true);
            return;
        }
        //  PRIORITY 3: AuditSessions restriction
        if (
            nodeType === "auditsessions" &&
            kebabLabel !== RightMouseMenuTreeNode.AddNewAuditSession
        ) {
            handleSidebarOpenClose("close")
            setIsShowSidebarIcon(false);
            return;
        }
        //  PRIORITY 4: Root nodes
        if (!explorerContainerProps.selectedNodeExplorer) {
            if (
                selectedNodeInfo?.node?.NodeType?.toLowerCase() === "alldatacenters" ||
                selectedNodeInfo?.node?.NodeType?.toLowerCase() === "auditsessions"
            ) {
                handleSidebarOpenClose("close")
                setIsShowSidebarIcon(false);
                return;
            }
        }
        //  DEFAULT behavior
        if (hasNodeEvent) {
            setIsShowSidebar(true);
        }
        if (explorerContainerProps.featureId === FEnums.AssetPlacement
            || explorerContainerProps.featureId === FEnums.InboundAssetPlacement) {
            handleSidebarOpenClose("close")
            setIsShowSidebarIcon(false);
            return;
        }
        else if (explorerContainerProps.featureId === FEnums.ReplacementProfile
            || explorerContainerProps.featureId === FEnums.Replace
        ) {
            handleSidebarOpenClose("close");
        }
        setIsSidebar('sidebarOpen');
        setIsShowSidebarIcon(true);
    }, [
        explorerContainerProps.selectedKebabMenu?.Label,
        explorerContainerProps.selectedNodeExplorer?.nativeEvent,
        explorerContainerProps.selectedNodeExplorer?.node?.NodeType,
        explorerContainerProps.featureId,
        selectedNodeInfo?.node?.NodeType
    ]);

    // Opens sidebar when node is selected directly from native tree events.
    useEffect(() => {
        setManuallyNodeSelected(false);
        if (explorerContainerProps.selectedNodeExplorer?.nativeEvent) {
            setIsShowSidebar(true);
        }
    }, [explorerContainerProps.selectedNodeExplorer?.nativeEvent,
    explorerContainerProps.selectedNodeExplorer?.node?.NodeType
    ])

    // Appends a session variable record.
    const setSessionValue = (
        jsonstring: Record<string, unknown>[],
        context: string,
        name: string,
        value: unknown
    ) => {
        jsonstring.push({
            VariableContext: context,
            VariableName: name,
            SessionValue: value ?? ""
        });
    };

    // Builds session update payload using selected node and its hierarchy.
    const updateSessionFromNode = async (
        treeData: ITreeNode[],
        selectedNode: ITreeNode,
        explorerContainerProps: IExplorerContainer,
        jsonstring: Record<string, unknown>[]
    ) => {
        //  1. Get full hierarchy (includes selected node)
        const hierarchy = FnGetParentHierarchy(treeData, selectedNode.key);
        //  2. Convert to map
        const hierarchyMap: Record<string, ITreeNode> = {};
        hierarchy.forEach((node) => {
            if (node.NodeType) {
                hierarchyMap[node.NodeType.toLowerCase()] = node;
            }
        });
        //  3. Handle Location hierarchy (Site → Room → Floor → Location)
        const locationTypes = ["site", "room", "floor", "location"];
        locationTypes.forEach((type) => {
            const node = hierarchyMap[type];
            setSessionValue(
                jsonstring,
                "Location",
                `${type.charAt(0).toUpperCase() + type.slice(1)}ID`,
                node?.NodeEntID
            );
            setSessionValue(
                jsonstring,
                "Location",
                `${type.charAt(0).toUpperCase() + type.slice(1)}Name`,
                node?.Name
            );
        });
        //  4. Special handling based on selected node
        const currentType = selectedNode.NodeType?.toLowerCase() ?? selectedNode.treetype?.toLowerCase();
        // 🔹 Floor Device (feature-specific)
        if (
            explorerContainerProps.featureId === FEnums.EditFloorLayout &&
            selectedNode.Type?.toLowerCase() === "floordevice"
        ) {
            setSessionValue(jsonstring, "FloorDevice", "FloorDeviceNodeID", selectedNode.NodeEntID);
            setSessionValue(jsonstring, "FloorDevice", "FloorDeviceNodeName", selectedNode.Name);
        }
        // 🔹 Mounted Device
        if (currentType === "mounteddevice") {
            setSessionValue(jsonstring, "MountedDevice", "MountedDeviceNodeID", selectedNode.NodeEntID);
            setSessionValue(jsonstring, "MountedDevice", "MountedDeviceNodeName", selectedNode.Name);
        }
        else {
            setSessionValue(jsonstring, "MountedDevice", "MountedDeviceNodeID", "");
            setSessionValue(jsonstring, "MountedDevice", "MountedDeviceNodeName", "");
        }
        // 🔹 Port / Slot / RU
        if (["port", "inoutplug", "slot", "ru", "pm"].includes(currentType)) {
            setSessionValue(jsonstring, "SelectedPortNode", "PortEntID", selectedNode.NodeEntID);
            setSessionValue(jsonstring, "SelectedPortNode", "PortContainedByEntityName", selectedNode.Name);
        }
        else {
            setSessionValue(jsonstring, "SelectedPortNode", "PortEntID", "");
            setSessionValue(jsonstring, "SelectedPortNode", "PortContainedByEntityName", "");
        }
    };

    // Sends session update payload and refreshes local session context.
    const updateSessionAsync = (jsonstring: Record<string, unknown>[]) => {
        return new Promise((resolve) => {
            axiosInterceptor({
                url: SESSION.UpdateSession,
                data: {
                    jsonSession: JSON.stringify(jsonstring)
                },
                setFetchData: (response: unknown, status?: string) => {
                    if (status !== "200") {
                        resolve(true);
                        return;
                    }
                    if (
                        response &&
                        typeof response === "object" &&
                        'jsonSessionOutput' in response
                    ) {
                        const extractedData = FnHandleAPIResponse(
                            response.jsonSessionOutput,
                            'Dataset'
                        );
                        if (Array.isArray(extractedData)) {
                            sessionContext.setSessionList(extractedData);
                        }
                    }
                    resolve(true);
                }
            }, statusBarContext);
        });
    };

    const updateInventorySessionFromNode = (
        treeData: ITreeNode[],
        selectedNode: ITreeNode,
        jsonstring: Record<string, unknown>[]
    ) => {
        // Get complete hierarchy
        const hierarchy = FnGetParentHierarchy(treeData, selectedNode.key);

        // Convert to lookup
        const hierarchyMap: Record<string, ITreeNode> = {};

        hierarchy.forEach(node => {
            if (node.NodeType) {
                hierarchyMap[node.NodeType.toLowerCase()] = node;
            }
        });

        const setInventorySession = (
            name: string,
            value: unknown
        ) => {
            setSessionValue(jsonstring, "Inventory", name, value);
        };

        // Site
        setInventorySession("SiteID", hierarchyMap.site?.NodeEntID);
        setInventorySession("SiteName", hierarchyMap.site?.Name);

        // Inventory
        setInventorySession("InventoryID", hierarchyMap.inventory?.NodeEntID);
        setInventorySession("InventoryName", hierarchyMap.inventory?.Name);

        // Store
        setInventorySession("StoreID", hierarchyMap.store?.NodeEntID);
        setInventorySession("StoreName", hierarchyMap.store?.Name);

        // Bin
        setInventorySession("BinID", hierarchyMap.bin?.NodeEntID);
        setInventorySession("BinName", hierarchyMap.bin?.Name);

        // Manufacturer
        setInventorySession(
            "MfgName",
            hierarchyMap.manufacturer?.Name ?? ""
        );

        // Equipment Type
        setInventorySession(
            "EqTypeName",
            hierarchyMap.eqtype?.Name ?? ""
        );
    };

    // Handles tree selection, session updates, and contextual layout/sidebar state.
    const handleNodeSelect = async (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[], newTreeData?: ITreeNode[], isSiteByTenant?: "AllSites" | "TenantsBySite" | "SitesByTenant", isShowSidebar?: boolean) => {
        if (import.meta.env.DEV)
            console.log("[handleNodeSelect] START", {
                selectedKeys,
                info,
                event: info.event,
                selected: info.selected,
                featureId: featureIdRef.current,
                explorerToRender,
                currentSelectedNodeKey: selectedNodeInfo?.node?.key,
                selectedNodeKey: info.node?.key,
            });

        if (eqid && info.event !== 'found-select' && featureIdRef.current === FEnums.Server) {
            if (import.meta.env.DEV)
                console.log("[handleNodeSelect] RETURN: Server feature + eqid condition", {
                    eqid,
                    event: info.event,
                    featureId: featureIdRef.current,
                });
            return;
        }

        setCablingHeaderBtn(false);
        setAddtoCableRtmSelect(null);
        setSelectedKebabMenu(undefined);

        if (!info.selected && featureIdRef.current !== FEnums.EditFloorLayout) {
            if (import.meta.env.DEV)
                console.log("[handleNodeSelect] RETURN: node is not selected", {
                    selected: info.selected,
                    featureId: featureIdRef.current,
                    event: info.event,
                    node: info.node,
                });

            setManuallyNodeSelected(true);
            return;
        }
        if (explorerToRender === "DC" && selectedNodeInfo?.node.key !== info.node.key) {
            if (import.meta.env.DEV)
                console.log("[handleNodeSelect] Session update block entered", {
                    explorerToRender,
                    previousSelectedNodeKey: selectedNodeInfo?.node?.key,
                    currentSelectedNodeKey: info.node?.key,
                    event: info.event,
                    selected: info.selected,
                    featureId: featureIdRef.current,
                });

            if (
                info.event === "select" ||
                info.event === "found-select" ||
                info.event === "auto-select-expand"
            ) {
                const selectedNodeEntID =
                    info.node.EntID ??
                    info.node.NodeEntID?.split("##")[0] ??
                    "";

                const jsonstring = [
                    {
                        VariableContext: "Node",
                        VariableName: "SelectedNodeID",
                        SessionValue: selectedNodeEntID
                    },
                    {
                        VariableContext: "Node",
                        VariableName: "SelectedNodeEntity",
                        SessionValue: info.node.NodeEntityname
                    },
                    {
                        VariableContext: "Node",
                        VariableName: "SelectedNodeName",
                        SessionValue: info.node.Name
                    },
                ];
                if (import.meta.env.DEV)
                    console.log("[handleNodeSelect] Session variables prepared", {
                        node: info.node,
                        selectedNodeEntID,
                        jsonstring,
                        featureId: featureIdRef.current,
                    });

                if (NormalDCExplorerFeatures.includes(featureIdRef.current)) {
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] Calling updateSessionFromNode - NormalDCExplorerFeatures"
                        );

                    await updateSessionFromNode(
                        newTreeData ?? originalTreeData,
                        info.node,
                        explorerContainerProps,
                        jsonstring
                    );
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] updateSessionFromNode completed - NormalDCExplorerFeatures"
                        );
                }
                else if (
                    featureIdRef.current === FEnums.InventoryManagement ||
                    featureIdRef.current === FEnums.InventoryConfiguration
                ) {
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] Calling updateInventorySessionFromNode",
                            {
                                featureId: featureIdRef.current,
                                node: info.node,
                                jsonstring,
                            }
                        );

                    updateInventorySessionFromNode(
                        newTreeData ?? originalTreeData,
                        info.node,
                        jsonstring
                    );
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] updateInventorySessionFromNode completed"
                        );
                }

                if (
                    FeaturesThatNeedToUpdateInSession.includes(featureIdRef.current) ||
                    featureIdRef.current === FEnums.AuditSession
                ) {
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] Calling updateSessionFromNode - FeaturesThatNeedToUpdateInSession/AuditSession",
                            {
                                featureId: featureIdRef.current,
                                isFeatureIncluded:
                                    FeaturesThatNeedToUpdateInSession.includes(
                                        featureIdRef.current
                                    ),
                                isAuditSession:
                                    featureIdRef.current === FEnums.AuditSession,
                                node: info.node,
                                jsonstring,
                            }
                        );

                    await updateSessionFromNode(
                        newTreeData ?? originalTreeData,
                        info.node,
                        explorerContainerProps,
                        jsonstring
                    );
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] updateSessionFromNode completed - FeaturesThatNeedToUpdateInSession/AuditSession"
                        );
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] Calling updateSessionAsync",
                            {
                                jsonstring,
                            }
                        );

                    await updateSessionAsync(jsonstring);
                    if (import.meta.env.DEV)
                        console.log(
                            "[handleNodeSelect] updateSessionAsync completed",
                            {
                                jsonstring,
                            }
                        );
                }
            } else {
                if (import.meta.env.DEV)
                    console.log(
                        "[handleNodeSelect] Session update SKIPPED: event does not match",
                        {
                            event: info.event,
                            expectedEvents: [
                                "select",
                                "found-select",
                                "auto-select-expand",
                            ],
                        }
                    );
            }
        } else {
            if (import.meta.env.DEV)
                console.log("[handleNodeSelect] Session update block SKIPPED", {
                    explorerToRender,
                    isDC: explorerToRender === "DC",
                    previousSelectedNodeKey: selectedNodeInfo?.node?.key,
                    currentSelectedNodeKey: info.node?.key,
                    sameNode:
                        selectedNodeInfo?.node?.key === info.node?.key,
                });

        }
        if (!explorerContainerProps.subTreeFeatureId) {
            selectedNodeContext.setSelectedNodeExplorer(info.node);
        }
        if (featureIdRef.current === FEnums.SelectDataCenterSite) {
            setTreeData(newTreeData);
            setIsSiteByTenant(isSiteByTenant || "AllSites");
            selectedNodeContext.setSelectedNode(info.node);
        } else if (featureIdRef.current === FEnums.EditPowerCabling || featureIdRef.current === FEnums.EditNetworkCabling || featureIdRef.current === FEnums.ReviewPowerCabling || featureIdRef.current === FEnums.ReviewNetworkCabling) {
            setCablingHeaderBtn(true)
            if ((featureIdRef.current === FEnums.EditPowerCabling && info.node.HasPowerPorts) || (featureIdRef.current === FEnums.EditNetworkCabling && info.node.HasNetworkPorts)) {
                if (info.selected) {
                    setSelectedNodeInfo(info)
                }
                if (!defaultCheckedKeys.length || info.event === "auto-select") {
                    setAddtoCableRtmSelect(null)
                    defaultCheckedKeyRef.current = [info.node.key]
                    setDefaultCheckedKeys([...[info.node.key]])
                    setCheckedNode(info.node)
                    selectedNodeContext.setCheckedNode(info.node)
                }
            } else {
                if ((featureIdRef.current === FEnums.ReviewPowerCabling || featureIdRef.current === FEnums.ReviewNetworkCabling) && (info?.node.HasPowerPorts || info?.node.HasNetworkPorts)) {
                    setCablingHeaderBtn(true)
                } else {
                    setCablingHeaderBtn(false)
                }
                setDefaultCheckedKeys([])
                setCheckedNode(undefined)
                selectedNodeContext.setCheckedNode(undefined)
                if (info.selected) {
                    setSelectedNodeInfo(info)
                }
            }
        } else if (featureIdRef.current === FEnums.AssetPlacement) {
            setKebabMenuContainerHeaderText("Select Floor")
        } else {
            selectedNodeContext.setSelectedNode(info.node);
            setSelectedNodeInfo(info);
        }
        if (isShowSidebar) {
            setIsShowSidebar(true);
        }
        if (info.event === "select") {
            setManuallyNodeSelected(true);
        }
        else {
            const sidebarVar = sessionContext.SessionList.find((sessionvar) => { return sessionvar.VariableName === "Sidebar" });
            if (sidebarVar && sidebarVar.SessionValue === "1") {
                setIsShowSidebar(true);
            }
        }

        if (!selectedKebabMenuExplorer) {
            const node = info?.node;
            const nodeType = node?.NodeType?.toLowerCase();
            if (
                node?.NodeEntID &&
                (
                    nodeType !== "site" &&
                    nodeType !== "room"
                )
            ) {
                if (newTreeData) {

                    let floorNode = FnFindNearestNodeByType(newTreeData ?? originalTreeDataRef.current, info.node, "Floor", undefined, true);
                    if (floorNode && floorNode.NodeType?.toLowerCase() === "floor") {
                        setSelectedFloorNode(floorNode);
                    }
                }
                setShowFloorLayout(true);
                setShowSidebarFullWidth(false);
            }
            if (info.selected) {
                setTreeData(newTreeData);
                setAddtoCableRtmSelect(null)
                setSelectedNodeInfo(info)
                setControlHtmlToRender(null);
                setKebabMenuContainerHeaderText(undefined);
                setSelectedNodeMenu(null);
            }
        }
        if (info.event === "auto-select") {
            const featureId = featureIdRef.current;
            const featureMap: Record<string, { type: "Power" | "Network"; action: string }> = {
                [FEnums.ReviewPowerCabling]: { type: "Power", action: "cabling" },
                [FEnums.PowerTrace]: { type: "Power", action: "trace" },
                [FEnums.PowerNavigate]: { type: "Power", action: "navigate connections" },
                [FEnums.ReviewNetworkCabling]: { type: "Network", action: "cabling" },
                [FEnums.NetworkTrace]: { type: "Network", action: "trace" },
                [FEnums.NetworkNavigate]: { type: "Network", action: "navigate connections" },
            };
            const config = featureMap[featureId];
            if (config) {
                const { type, action } = config;
                // Adjust based on your actual node structure
                const hasPorts = type === "Power"
                    ? info.node?.HasPowerPorts
                    : info.node?.HasNetworkPorts;
                if (!hasPorts) {
                    const message =
                        action === "cabling"
                            ? `Select a node with ${type} ports to view cabling`
                            : action === "trace"
                                ? `Select a node with ${type} ports to show trace`
                                : `Select a node with ${type} ports to navigate connections`;
                    explorerContainerProps.handleShowUserMessage?.(message);
                    return;
                }
            }
        }
    }

    // Computes whether right-pane header should be visible for current feature/node.
    useEffect(() => {
        const nodeType = selectedNodeInfo?.node.NodeType?.toLowerCase();
        const featureId = explorerContainerProps.featureId;
        const allowNodeTypesForContainerHeader = ["store", "bin", "manufacturer", "eqtype"];
        const deviceNodeTypes = [
            "device",
            "rack",
            "floordevice",
            "frontview",
            "rearview",
            "port",
            "slot",
            "mounteddevice",
        ];
        const cablingFeatures: string[] = [
            FEnums.EditPowerCabling,
            FEnums.EditNetworkCabling,
            FEnums.ReviewPowerCabling,
            FEnums.ReviewNetworkCabling,
            FEnums.NetworkTrace,
            FEnums.PowerTrace,
            FEnums.NetworkNavigate,
            FEnums.PowerNavigate,
        ];
        let allowContainerHeader = false;
        if (deviceNodeTypes.includes(nodeType ?? "")) {
            const checkCablingFeature = cablingFeatures.includes(featureId);
            let parentRackNode = null;
            if (
                nodeType === "mounteddevice" &&
                (featureId === FEnums.ReplacementProfile ||
                    featureId === FEnums.Replace)
                && selectedNodeInfo?.node
            ) {
                const parentNodes = FnGetParentTreeNodeInfoUsingDiv(
                    selectedNodeInfo?.node,
                    true
                );
                parentRackNode = parentNodes.find(
                    (node) => node.NodeType?.toLowerCase() === "rack"
                );
            }
            const allowHeaderInFeature =
                (featureId === FEnums.ReplacementProfile ||
                    featureId === FEnums.Replace) &&
                parentRackNode;
            allowContainerHeader =
                !!allowHeaderInFeature ||
                featureId === FEnums.EditFloorLayout ||
                (checkCablingFeature &&
                    (nodeType === "device" || nodeType === "mounteddevice"));
        }
        else if (
            featureId === FEnums.SelectDataCenterSite ||
            featureId === FEnums.AnalyticsAndCharts
        ) {
            allowContainerHeader = true;
        }
        else if (featureId === FEnums.Configure) {
            allowContainerHeader = true;
            setIsShowSidebarIcon(false);
        }
        else if (
            featureId === FEnums.InventoryCollection ||
            featureId === FEnums.InventoryReconciliation
        ) {
            allowContainerHeader = true;
        }
        else if (
            featureId === FEnums.Workorder ||
            featureId === FEnums.AssetPlacement ||
            featureId === FEnums.Relocate ||
            featureId === FEnums.InboundAssetPlacement ||
            featureId === FEnums.Relocate
        ) {
            allowContainerHeader = false;
        }
        else if (
            featureId === FEnums.Transfer ||
            featureId === FEnums.Delete
        ) {
            allowContainerHeader = false;
        }
        else if (
            nodeType &&
            allowNodeTypesForContainerHeader.includes(nodeType)
        ) {
            allowContainerHeader = true;
        }
        else if (
            (nodeType === "floor" || nodeType === "location") &&
            featureId === FEnums.EditFloorLayout
        ) {
            allowContainerHeader = true;
        }
        setAllowContainerHeader(allowContainerHeader);
    }, [selectedNodeInfo, explorerContainerProps.featureId]);

    // Loads tree source based on active feature only.
    // QA menu prep is in a separate effect so apRecords/diagnostic/featureData
    // updates do not re-trigger hierarchy API calls.
    useEffect(() => {
        const handleFeatureChange = async () => {
            selectedNodeContext.setCheckedNode(undefined);
            if (explorerContainerProps.featureId) {
                if (explorerContainerProps.featureId === FEnums.VirtualCompute) {
                    axiosInterceptor({
                        url: VIRTUAL.GetLocationHierarchy,
                        data: {},
                        setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                            if (status === "200" && getLocationHierarchyApiResponse && typeof getLocationHierarchyApiResponse === "object" && 'hierarchyJson' in getLocationHierarchyApiResponse) {
                                const parsedData = FnParseJsonSafely(getLocationHierarchyApiResponse.hierarchyJson as string);
                                if (parsedData && typeof parsedData.object) {
                                    setHierarchyApiData(parsedData);
                                }
                            }
                        }
                    }, statusBarContext)
                    setExplorerToRender("FEATURE");
                }
                else if (explorerContainerProps.featureId === FEnums.CloudCompute) {
                    axiosInterceptor({
                        url: CLOUD.GetLocationHierarchy,
                        data: {},
                        setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                            if (status === "200" && getLocationHierarchyApiResponse && typeof getLocationHierarchyApiResponse === "object" && 'hierarchyJson' in getLocationHierarchyApiResponse) {
                                const parsedData = FnParseJsonSafely(getLocationHierarchyApiResponse.hierarchyJson as string);
                                if (parsedData && typeof parsedData.object) {
                                    setHierarchyApiData(parsedData);
                                }
                            }
                        }
                    }, statusBarContext)
                    setExplorerToRender("FEATURE");
                }
                else if (explorerContainerProps.featureId === FEnums.InventoryCollection || explorerContainerProps.featureId === FEnums.InventoryReconciliation) {
                    axiosInterceptor({
                        url: AUDIT.GetAllAuditsessions,
                        data: {
                            auditFeatureType: explorerContainerProps.featureId === FEnums.InventoryCollection ? 2 : 3,
                            openOnly: false
                        },
                        setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                            if (status === "200" && getLocationHierarchyApiResponse && typeof getLocationHierarchyApiResponse === "object" && 'data' in getLocationHierarchyApiResponse) {
                                const parsedData = FnParseJsonSafely(getLocationHierarchyApiResponse.data as string);
                                if (parsedData && typeof parsedData.object) {
                                    setHierarchyApiData(parsedData);
                                }
                            }
                        }
                    }, statusBarContext)
                    setExplorerToRender("FEATURE");
                }
                else if (explorerContainerProps.featureId === FEnums.SelectDataCenterSite) {
                    setExplorerToRender("ALL_DC")
                    setHierarchyApiData(undefined);
                }
                else if (explorerContainerProps.featureId === FEnums.PowerBI) {
                    statusBarContext.setIsLoading(true);
                    const apiResponse = await axiosInterceptorForPowerBi(FnGetExpApiUrlBasedOnEndPoint(EXPAPI.PowerBIWorkspaces));
                    if (apiResponse.data && typeof apiResponse.data === "object" && "workspaces" in apiResponse.data) {
                        statusBarContext.setIsLoading(false);
                        const workspaces = apiResponse.data.workspaces
                        const convertDataset = async (arr: { name: string, id: string, type: string }[]) => {
                            let children: Array<{
                                Name: string;
                                EntID: string;
                                parentEntID: string;
                                NodeType: string;
                                Children: unknown[];
                                embedUrl: string;
                                embedToken: string;
                                workspaceId: string;
                                EntityName: string;
                                Description: string;
                            }> = []
                            if (arr.length === 1) {
                                statusBarContext.setIsLoading(true);
                                const reports = await axiosInterceptorForPowerBi(`${FnGetExpApiUrlBasedOnEndPoint(EXPAPI.PowerBIReport)}?workspaceId=${arr[0].id}`);
                                if (reports.data && typeof reports.data === "object" && "reports" in reports.data && Array.isArray(reports.data.reports)) {
                                    statusBarContext.setIsLoading(false);
                                    const reportsData: { reportId: string, reportName: string, workspaceId: string, embedUrl: string, embedToken: string }[] = reports.data.reports
                                    children = reportsData.map(item => ({
                                        Name: item.reportName,
                                        EntID: item.reportId,
                                        parentEntID: item.workspaceId,
                                        NodeType: "Report",
                                        Children: [],
                                        embedUrl: item.embedUrl,
                                        embedToken: item.embedToken,
                                        workspaceId: item.workspaceId,
                                        EntityName: "PowerBI",
                                        Description: "Report"
                                    }))
                                } else {
                                    statusBarContext.setIsLoading(false);
                                }
                            }
                            return {
                                Name: "PowerBIDatasets",
                                EntID: "1001",
                                NodeType: "Dataset",
                                Datasets: arr.map(item => ({
                                    Name: item.name,
                                    EntID: item.id,
                                    NodeType: item.type,
                                    Children: children, // you can update later if needed
                                    HasChildren: 1,
                                    workspaceId: item.id,
                                    EntityName: "Workspace",
                                    Description: "Workspace"
                                }))
                            };
                        }
                        const hierarchy = await convertDataset(workspaces as { name: string, id: string, type: string }[]);
                        setHierarchyApiData(hierarchy);
                    } else {
                        statusBarContext.setIsLoading(false);
                    }
                    setExplorerToRender("FEATURE");
                } else if (explorerContainerProps.featureId === FEnums.Transfer
                    || explorerContainerProps.featureId === FEnums.Delete
                    || explorerContainerProps.featureId === FEnums.ReplacementProfile
                    || explorerContainerProps.featureId === FEnums.Replace) {
                    setExplorerToRender("PLAN");
                }
                else if (explorerContainerProps.featureId === FEnums.Relocate) {
                    setExplorerToRender("RELOCATE");
                }
                else if (explorerContainerProps.featureId === FEnums.Dashboard
                    || explorerContainerProps.featureId === FEnums.Configure) {
                    if (explorerContainerProps.featureId === FEnums.Configure) {
                        // Flattens ExploreSettings tree into feature-item rows for configure menu.
                        function transformHelpTipData(input: unknown): IFeatureItem[] {
                            const result: IFeatureItem[] = [];
                            const settings = (input as { NetZoomSettings?: Array<{ EntID?: string; Group?: Array<{ Name?: string; NodeType?: string; Description?: string; SubGroup?: Array<{ Name?: string; NodeType?: string; Description?: string; DisplayControl?: string; SubGroupEntID?: string }> }> }> })?.NetZoomSettings ?? [];
                            settings.forEach((setting) => {
                                setting.Group?.forEach((group, groupIndex: number) => {
                                    const groupFeatureId = `${100 + groupIndex}`;
                                    result.push({
                                        MenuID: groupFeatureId,
                                        _Feature: groupFeatureId,
                                        Label: group?.Name ?? '',
                                        NodeType: group?.NodeType ?? '',
                                        Tooltip: group?.Description ?? '',
                                        SortOrder: 100 + groupIndex,
                                        DefaultQA: false,
                                        FilterForm: '',
                                        SearchPrompt: null,
                                        Secured: true,
                                        IsNZ: true,
                                        EntID: setting?.EntID ?? '',
                                        RecID: crypto.randomUUID(),
                                        LastUpdated: new Date().toISOString(),
                                        EntityName: 'Feature',
                                        PopupQa: false,
                                        FeatureTag: ''
                                    });
                                    group.SubGroup?.forEach((sub, subIndex: number) => {
                                        const subFeatureId = `${groupFeatureId}-${subIndex + 1}`;
                                        result.push({
                                            MenuID: groupFeatureId,
                                            _Feature: subFeatureId,
                                            Label: sub?.Name ?? '',
                                            NodeType: sub?.NodeType ?? '',
                                            Tooltip: sub?.Description ?? '',
                                            SortOrder: subIndex + 1,
                                            DefaultQA: false,
                                            FilterForm: sub?.DisplayControl ?? '',
                                            SearchPrompt: null,
                                            Secured: true,
                                            IsNZ: true,
                                            EntID: sub?.SubGroupEntID ?? '',
                                            RecID: crypto.randomUUID(),
                                            LastUpdated: new Date().toISOString(),
                                            EntityName: 'Feature',
                                            PopupQa: false,
                                            FeatureTag: ''
                                        });
                                    });
                                });
                            });
                            return result;
                        }
                        const payload = {
                            isMySetting: 2
                        }
                        await axiosInterceptor({
                            url: EXPLORER.ExploreSettings,
                            data: payload,
                            setFetchData: (exploreSettingApiResponse: unknown, status?: string) => {
                                if (status === "200" && exploreSettingApiResponse && typeof exploreSettingApiResponse === "object" && "hierarchyJson" in exploreSettingApiResponse) {
                                    const parsedata = FnParseJsonSafely(exploreSettingApiResponse.hierarchyJson as string)
                                    const featuredata = transformHelpTipData(parsedata)
                                    if (featuredata && featuredata.length > 0) {
                                        setPowerConfigureFeatureData(featuredata);
                                    }
                                }
                            }
                        }, statusBarContext)
                    }
                    setExplorerToRender("NONE")
                    setHierarchyApiData(undefined);
                }
                else {
                    setExplorerToRender("DC");
                    setHierarchyApiData(undefined);
                }
            }
        }
        handleFeatureChange();
        return () => {
            setFeatureQAData(undefined)
            setExplorerToRender(undefined);
            setHierarchyApiData(undefined);
            setSelectedSubGroupItem(undefined);
        }
    }, [explorerContainerProps.featureId]);

    // Prepares feature QA menu data without reloading tree hierarchy.
    useEffect(() => {
        if (!explorerContainerProps.featureId) {
            return;
        }
        let filtered_qa = explorerContainerProps.featureData.filter((item) => {
            if (item.MenuID == explorerContainerProps.featureId
                && (item._Feature as unknown as number) > FeatureQARange.MIN
                && (item._Feature as unknown as number) < FeatureQARange.MAX
            ) {
                return item
            }
        })
        if (filtered_qa) {
            filtered_qa = filtered_qa.sort(
                (a, b) => a.SortOrder - b.SortOrder
            );
            if (mainAppContext.apRecords) {
                if (commonVariableContext.diagnosticLevel && commonVariableContext.diagnosticLevel?.toString() !== "0") {
                    setFeatureQAData([...filtered_qa, ...actionlog]);
                } else {
                    setFeatureQAData(filtered_qa);
                }
            }
        }
    }, [explorerContainerProps.featureId, explorerContainerProps.featureData, commonVariableContext.diagnosticLevel, mainAppContext.apRecords]);


    // Opens sidebar and persists sidebar-open session flag.
    const handleClickInformation = async (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: Record<string, unknown>) => {
        if (isSaveProcessing) return; // Prevent multiple clicks
        setIsSaveProcessing(true);
        try {
            const handleUpdateSessionApiResponse = (updateSessionApiResponse: unknown) => {
                if (updateSessionApiResponse && typeof updateSessionApiResponse === "object" && 'jsonSessionOutput' in updateSessionApiResponse) {
                    const extractedData = FnHandleAPIResponse(updateSessionApiResponse.jsonSessionOutput, 'Dataset');
                    if (extractedData && Array.isArray(extractedData)) {
                        sessionContext.setSessionList(extractedData);
                    }
                }
            }
            const jsonstring = [
                { VariableContext: "Optional", VariableName: "Sidebar", SessionValue: 1 }
            ];
            axiosInterceptor({
                url: SESSION.UpdateSession,
                data: {
                    jsonSession: JSON.stringify(jsonstring)
                },
                setFetchData: handleUpdateSessionApiResponse
            }, statusBarContext);
            setIsShowSidebar(true);
            setIsSidebar('sidebarOpen');
        } catch (error) {
            console.error('error in save :', error);
        }
        finally {
            setIsSaveProcessing(false);
        }
    }

    // Keeps sidebar width aligned with right pane after splitter resize.
    const handleExplorerResizeEnd = (event: SplitterResizeEndEvent) => {
        if (event.sizes) {
            const rightPane = document.querySelector('.nz-layout-with-sidebar-pane') as HTMLElement | null;
            const sidebarDiv = document.querySelector('.nz-info-bar .MuiPaper-root') as HTMLElement | null;
            const sidebarContainer = document.querySelector('.nz-qa-sidebar-container') as HTMLElement | null;
            if (!rightPane || !sidebarContainer) {
                return;
            }
            if (sidebarDiv && sidebarContainer && isShowSidebar && sidebarDiv.offsetWidth > rightPane.offsetWidth) {
                sidebarDiv.style.setProperty("width", `${rightPane.offsetWidth}px`, "important");
                sidebarContainer.style.width = rightPane.offsetWidth + "px";
                commonVariableContext.setSidebarWidth(rightPane.offsetWidth);
            }
            if (showSidebarFullWidth) {
                // make sidebar full width of right pane if floor 
                if (rightPane) {
                    const width = (rightPane as HTMLElement).getBoundingClientRect().width;
                    const sidebarDiv = document.querySelector('.nz-qa-sidebar-container .MuiPaper-root') as HTMLElement | null;
                    sidebarContainer.style.width = width + "px";
                    if (sidebarDiv) {
                        sidebarDiv.style.width = width + "px";
                    }
                }
            }
        }
    }

    // Stores latest original tree datasets for feature-specific cache behavior.
    const updateOriginalTreeDataset = async (updatedTreedata: ITreeNode[], expandedKeys: Key[], selectedKeys: Key[], userTreeData: ITreeNode[] | null) => {
        if (explorerContainerProps.featureId === FEnums.InventoryManagement || explorerContainerProps.featureId === FEnums.InventoryConfiguration) {
            setOriginalTreeDataForInventory(updatedTreedata);
        }
        else if (explorerContainerProps.featureId && ReuseDataForFeatures.includes(explorerContainerProps.featureId)) {
            setOriginalTreeData(updatedTreedata);
            explorerTreeContext.setOriginalTreeData(updatedTreedata);
            originalTreeDataRef.current = updatedTreedata;
        }
        if (explorerContainerProps.updateOriginalTreeDataset) {
            explorerContainerProps.updateOriginalTreeDataset(updatedTreedata, expandedKeys, selectedKeys, userTreeData);
        }
    }

    // Handles kebab menu actions and renders feature-specific controls/popups.
    const handleKebabMenuSelect = async (selectedItem: IActionImageForSubMenu, selectedNodeData: ISelectedNodeInfo, currentTreeData?: ITreeNode[]) => {

        if (selectedItem && selectedItem.payload && typeof selectedItem.payload === "object") {
            if (selectedNodeData && selectedNodeData.node && 'Label' in selectedItem.payload) {

                if (
                    selectedItem.payload.Label === RightMouseMenuTreeNode.CopyHyperlink &&
                    currentTreeData
                ) {
                    const parentNodes = FnGetParentHierarchy(
                        currentTreeData,
                        selectedNodeData.node.key
                    );
                    const siteid = sessionContext.SessionList.find(
                        (item) => item.VariableName.toLowerCase() === "siteid"
                    );
                    const sitename = sessionContext.SessionList.find(
                        (item) => item.VariableName.toLowerCase() === "sitename"
                    );

                    if (siteid && siteid.SessionValue?.length) {

                        // Build hierarchy:
                        // NodeEntityName:Name/NodeEntityName:Name
                        const hierarchyPath = parentNodes
                            ?.filter((node) => node.NodeEntityname && node.Name)
                            .map((node) => `${node.NodeEntityname}:${node.Name}`)
                            .join("/");

                        const url =
                            `${window.location.href.split("?")[0]}` +
                            `?isnew=true` +
                            `&siteid=${siteid.SessionValue}` +
                            `&sitename=${sitename?.SessionValue || ""}` +
                            `&hierarchy=${encodeURIComponent(hierarchyPath ?? "")}`;

                        FnCopyToClipboard(url);
                        explorerContainerProps.handleShowUserMessage?.("Copied!", undefined, true)
                    }
                } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ExportDevices) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    handleSidebarOpenClose("close")
                    setAllowContainerHeader(true)
                    setKebabMenuContainerHeaderText(selectedItem.payload.Label)
                    setControlHtmlToRender(<ExportDeviceContainer uniqueName={selectedItem.payload.Label} featureId={explorerContainerProps.featureId} />)
                } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ExportNetworkCables || selectedItem.payload.Label === RightMouseMenuTreeNode.ExportPowerCables) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    handleSidebarOpenClose("close")
                    setAllowContainerHeader(true)
                    setKebabMenuContainerHeaderText(selectedItem.payload.Label)
                    setControlHtmlToRender(<ExportCableContainer uniqueName={selectedItem.payload.Label} featureId={explorerContainerProps.featureId} />)
                } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ImportNetworkCables || selectedItem.payload.Label === RightMouseMenuTreeNode.ImportPowerCables) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    handleSidebarOpenClose("close")
                    setAllowContainerHeader(true)
                    setKebabMenuContainerHeaderText(selectedItem.payload.Label)
                    setControlHtmlToRender(<ImportCableContainer uniqueName={selectedItem.payload.Label} featureId={explorerContainerProps.featureId} />)
                } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ExportNetworkCabling
                    || selectedItem.payload.Label === RightMouseMenuTreeNode.ExportPowerCabling) {
                    if (!selectedNodeData.node.NodeEntID) {
                        explorerContainerProps.handleShowUserMessage?.("Node details not found to execute command.")
                        return
                    }
                    const entid = selectedNodeData && ["device", "rack", "mounteddevice"].includes(selectedNodeData.node.NodeType?.toLowerCase() ?? selectedNodeData.node.treetype?.toLowerCase() ?? "") ? selectedNodeData?.node.NodeEntID : undefined

                    await FnExportCabling(statusBarContext, selectedItem.payload.Label,
                        selectedItem.payload.Label === RightMouseMenuTreeNode.ExportPowerCabling,
                        entid as string | undefined
                    )
                } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ImportNetworkCabling
                    || selectedItem.payload.Label === RightMouseMenuTreeNode.ImportPowerCabling) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    handleSidebarOpenClose("close")
                    setAllowContainerHeader(false)
                    setKebabMenuContainerHeaderText(selectedItem.payload.Label)
                    setControlHtmlToRender(<ImportCabling uniqueName={selectedItem.payload.Label}
                        featureId={explorerContainerProps.featureId}
                        headerText={selectedItem.payload.Label} />)
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ImportDevices || selectedItem.payload.Label === RightMouseMenuTreeNode.ImportDevicesToInventory || selectedItem.payload.Label === RightMouseMenuTreeNode.UpdateProperties) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    handleSidebarOpenClose("close")
                    setAllowContainerHeader(true)
                    setKebabMenuContainerHeaderText(selectedItem.payload.Label)
                    setControlHtmlToRender(<ImportDeviceContainer uniqueName={selectedItem.payload.Label} featureId={explorerContainerProps.featureId} entityName={selectedItem.payload.Label === RightMouseMenuTreeNode.ImportDevicesToInventory ? "inventoryimport" : undefined} />)
                } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.AddToCabling) {
                    if (defaultCheckedKeyRef.current && selectedNodeData && (defaultCheckedKeyRef.current[0] === selectedNodeData.node.key && selectedNodeData.node.NodeEntityname !== '__PatchPanel')) {
                        setIsConfirmOpen(true)
                        setConfirmMessage("This device is already in edit mode so you cannot add it to cable.")
                        return;
                    }
                    setCablingHeaderBtn(true)
                    setAddtoCableRtmSelect(selectedItem.payload as IMenuItem)
                    function scrollToBottomWithRetry(maxTries = 10, delay = 200) {
                        let attempts = 0;
                        let lastHeight = 0;
                        let retryTimeoutIdLocal: ReturnType<typeof setTimeout> | null = null;
                        const scrollAttempt = () => {
                            //  Target ONLY cabling-last-grid
                            const divElement = document.querySelector(
                                '[data-key*="cabling-last-grid"]'
                            ) as HTMLElement;
                            if (!divElement) return;
                            const currentHeight = divElement.scrollHeight;
                            divElement.scrollTo({
                                top: currentHeight,
                                behavior: 'smooth',
                            });
                            if (currentHeight !== lastHeight && attempts < maxTries) {
                                lastHeight = currentHeight;
                                attempts++;
                                retryTimeoutIdLocal = setTimeout(scrollAttempt, delay);
                            }
                        };
                        scrollAttempt();
                        return retryTimeoutIdLocal;
                    }
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    setKebabMenuContainerHeaderText(selectedItem.payload.Label)
                    outerTimeoutIdRef.current = setTimeout(() => {
                        retryTimeoutIdRef.current = scrollToBottomWithRetry(10, 400);
                    }, 2000);
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.AddBin) {
                    let parentNodes: ITreeNode[] = [];
                    if (selectedNodeData) {
                        parentNodes = FnGetParentTreeNodeInfoUsingDiv(selectedNodeData.node, true);
                        if (parentNodes && parentNodes.length > 0) {
                            parentNodes.push(selectedNodeData.node);
                        }
                    }
                    function handleRefreshForNewRecord(newAddedId: string, newAddedName: string, action?: 'close' | 'save' | 'back' | undefined): void {
                        explorerContainerProps?.handleReloadTree && explorerContainerProps.handleReloadTree(explorerContainerProps.featureId, newAddedId);
                    }
                    setControlHtmlToRender(<AddDcObjectsContainer uniqueName={explorerContainerProps.uniqueName + "add-ih-object-form"}
                        entityToAdd={"Bin"}
                        selectedNode={selectedNodeData.node}
                        pgTableToAdd="PG.Contact"
                        parentNodes={parentNodes}
                        treeData={treeData}
                        allowCustomHeader={false}
                        allowCloseButton={true}
                        featureId={explorerContainerProps.featureId}
                        handleRefreshForNewRecord={handleRefreshForNewRecord}
                    />)
                } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ManageDeviceData) {
                    handleSidebarOpenClose("close")
                    setAllowContainerHeader(false)
                    setKebabMenuContainerHeaderText(selectedItem.payload.Label)
                    setControlHtmlToRender(<ManageDeviceData uniqueName={explorerContainerProps.uniqueName + "manage-device-form"} selectedNodeInfo={selectedNodeData} />)
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.MapPorts) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    handleSidebarOpenClose("close")
                    setAllowContainerHeader(false)
                    setControlHtmlToRender(<CablingPortMap
                        rowData={[]}
                        uniqueName={'cabling-port-map'}
                        instanceName={'cabling'}
                        showGrid={true}
                        containerName={'cabling'}
                        isReadOnly={false}
                        selectedNodeInfo={selectedNodeData} />)
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Refresh) {
                    if (explorerContainerProps.featureId === FEnums.VirtualCompute || explorerContainerProps.featureId === FEnums.CloudCompute) {
                    }
                    else if (explorerContainerProps.featureId === FEnums.InventoryCollection) {
                        axiosInterceptor({
                            url: AUDIT.GetAllAuditsessions,
                            data: {
                                auditFeatureType: explorerContainerProps.featureId === FEnums.InventoryCollection ? 2 : 3,
                                openOnly: false
                            },
                            setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                                if (status === "200" && getLocationHierarchyApiResponse && typeof getLocationHierarchyApiResponse === "object" && 'data' in getLocationHierarchyApiResponse) {
                                    const parsedData = FnParseJsonSafely(getLocationHierarchyApiResponse.data as string);
                                    if (parsedData && typeof parsedData.object) {
                                        setHierarchyApiData(parsedData);
                                    }
                                }
                            }
                        }, statusBarContext)
                    }
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ExportAuditInventory && selectedNodeInfo?.node) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    // Are you sure you want to {#status}?
                    let errorMsg = `${selectedItem.payload.Label} inventory of ${selectedNodeInfo.node.Name}`;
                    axiosInterceptor({
                        url: LOG.CreateMessage,
                        data: {
                            projectInitial: "Audit",
                            msgID: "151",
                            optionalMessage: errorMsg
                        },
                        setFetchData: (createMessageApiResponse: unknown, status?: string) => {
                            if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                                setIsShowOkButton(false);
                                setIsConfirmOpen(true);
                            }
                        }
                    }, statusBarContext)
                    setSelectedKebabMenu(undefined);
                }
                else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ImportAuditInventory && selectedNodeInfo) {
                    setSelectedNodeMenu(selectedItem.payload as IMenuItem);
                    setControlHtmlToRender(<ImportAuditInventory uniqueName={`${explorerContainerProps.uniqueName}-import-audit-inventory`}
                        selectedNodeInfo={selectedNodeInfo} featureId={explorerContainerProps.featureId} headerText={selectedItem.payload.Label}
                        handleCloseDialog={(isReloadNeeded?: boolean) => {
                            setControlHtmlToRender(null)
                            if (isReloadNeeded) {
                                commonVariableContext.setIsReloadDataForGrid("audit_inventory");
                                setSelectedNodeInfo({ ...selectedNodeInfo });
                                handleReloadTree(explorerContainerProps.featureId, selectedNodeInfo?.node?.NodeEntID || undefined)
                            }
                            else {
                            }
                        }} />)
                    setSelectedKebabMenu(undefined);
                }
            }
        }
    }

    // Builds right-pane header text based on current feature and selected node.
    const getHeaderTextBasedOnNode = (selectedNode: ITreeNode) => {
        if (explorerContainerProps.featureId === FEnums.DCMConsole) {
            return 'Power and Thermal management';
        }
        else if (explorerContainerProps.featureId === FEnums.AnalyticsAndCharts) {
            return `Analytics and Charts  for: ${selectedNode.Name}`;
        }
        else if (explorerContainerProps.featureId === FEnums.InventoryCollection) {
            if (selectedNode.NodeType?.toLowerCase() === "auditsessionnode") {
                return `Inventory Collection for ${selectedNode.Name}: ${selectedNode._Device ?? selectedNode._Location ?? selectedNode._Floor}`
            }
            return 'Inventory Collection'
        }
        else if (explorerContainerProps.featureId === FEnums.AuditSession) {
            if (explorerContainerProps.selectedNodeExplorer?.node?.NodeType?.toLowerCase() === "auditsessionnode") {
                return `Inventory Collection for ${explorerContainerProps.selectedNodeExplorer?.node.Name}`
            }
            return 'Inventory Collection'
        }
        else if (explorerContainerProps.featureId === FEnums.InventoryReconciliation) {
            if (selectedNode.NodeType?.toLowerCase() === "auditsessionnode") {
                return `Inventory Reconciliation for ${selectedNode.Name}: ${selectedNode._Device ?? selectedNode._Location ?? selectedNode._Floor}`
            }
            return 'Inventory Reconciliation'
        }
        else if (explorerContainerProps.featureId === FEnums.SelectDataCenterSite) {
            return `Map for: ${selectedNode.NodeType ?? selectedNode.Name ?? "All Data Center"}`
        }
        else if (explorerContainerProps.featureId === FEnums.Workorder && selectedNode.NodeType?.toLowerCase() === "floor") {
            return `Workorders for: ${selectedNode.Name ?? "Floor"}`
        }
        else if (explorerContainerProps.featureId === FEnums.EditFloorLayout && (selectedNode.NodeType?.toLowerCase() === "floor"
            || selectedNode.NodeType?.toLowerCase() === "location" || selectedNode.Type?.toLowerCase() === "floordevice")) {
            if (explorerContainerProps.originalTreeData && (selectedNode.NodeType?.toLowerCase() === "location" || selectedNode.Type?.toLowerCase() === "floordevice")) {
                const nearestFloor = FnFindNearestNodeByType(explorerContainerProps.originalTreeData, selectedNode, "Floor");
                if (nearestFloor) {
                    return `Edit Floor layout of ${nearestFloor.Name}`
                }
            }
            else {
                return `Edit Floor layout of ${selectedNode.Name}`
            }
        }
        else {
            if (selectedNode.NodeType?.toLowerCase() === "floor") {
                return `Layout for ${selectedNode.Type}`;
            }
            else if (selectedNode.NodeType) {
                return `${selectedNode.NodeType}: ${selectedNode.Name}${selectedNode.EQID ? " (" + selectedNode.EQID + ")" : ""}`
            }
            else {
                return `${selectedNode.Type ?? selectedNode.treetype ?? "Node"}: ${selectedNode.Name}`
            }
        }
    }

    // Reloads explorer tree for audit features or delegates to parent reload handler.
    const handleReloadTree = (featureId: string, entID?: string | undefined) => {
        if (featureId === FEnums.InventoryReconciliation || featureId === FEnums.InventoryCollection) {
            axiosInterceptor({
                url: AUDIT.GetAllAuditsessions,
                data: {
                    auditFeatureType: featureId === FEnums.InventoryCollection ? 2 : 3,
                    openOnly: false
                },
                setFetchData: (getLocationHierarchyApiResponse: unknown, status?: string) => {
                    if (status === "200" && getLocationHierarchyApiResponse && typeof getLocationHierarchyApiResponse === "object" && 'data' in getLocationHierarchyApiResponse) {
                        const parsedData = FnParseJsonSafely(getLocationHierarchyApiResponse.data as string);
                        if (parsedData && typeof parsedData.object) {
                            setHierarchyApiData(parsedData);
                        }
                    }
                }
            }, statusBarContext)
        }
        else if (
            featureId === FEnums.Transfer ||
            featureId === FEnums.Delete ||
            featureId === FEnums.ReplacementProfile ||
            featureId === FEnums.Replace
        ) {
            setPlanTreeRefreshKey(prev => prev + 1);
            if (explorerContainerProps.handleReloadTree) {
                explorerContainerProps.handleReloadTree(featureId, entID);
            }
        }
        else if (explorerContainerProps.handleReloadTree) {
            explorerContainerProps.handleReloadTree(featureId, entID);
        }
    }

    // Syncs sidebar submenu state when sidebar menu icon is clicked.
    const handleMouseSidebar = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: IMenuItem) => {
        if (explorerContainerProps.selectedNodeExplorer) {
            setSelectedKebabMenuExplorer(payload)
        }
    }

    // Updates session and navigates to Assets explorer based on map/tree selection.
    const SelectDcExplorer = (site?: string, tenant?: string, entityName?: string, entId?: string, dateFormat?: string) => {
        function findTreeNodeByName(treeNodes: ITreeNode[], targetName: string): ITreeNode | null {
            for (const node of treeNodes) {
                const key = node.key?.toLowerCase()?.includes('##') ? node.key?.toLowerCase().split('##')[0] : node.key;
                if (key && key?.toLowerCase() === targetName?.toLowerCase()) {
                    return node;
                }
                if (node.children) {
                    const found = findTreeNodeByName(node.children, targetName);
                    if (found) return found;
                }
            }
            return null;
        }
        const handleUpdateSessionApiResponse = async (updateSessionApiResponse: unknown) => {
            if (updateSessionApiResponse && typeof updateSessionApiResponse === "object" && 'jsonSessionOutput' in updateSessionApiResponse) {
                const extractedData = FnHandleAPIResponse(updateSessionApiResponse.jsonSessionOutput, 'Dataset');
                if (extractedData && Array.isArray(extractedData)) {
                    sessionContext.setSessionList(extractedData);
                }
                const feature = explorerContainerProps.featureData.find((item) => { return item._Feature?.toString() === FEnums.Assets });
                if (feature) {
                    const updatedFeature = { ...feature, IsAppqa: false }
                    if (explorerContainerProps.updateOriginalTreeDataset) {
                        setOriginalTreeData([]);
                        setOriginalTreeDataForInventory([]);
                        explorerTreeContext.setFloorDeviceHierarchyRecords({});
                        explorerContainerProps.updateOriginalTreeDataset([], [], [], []);
                    }
                    navigate(`/feature/${feature._Feature}`, { replace: true, state: updatedFeature });
                }
            }
        }
        if (site && tenant && treeData) {
            const foundNodeSite = findTreeNodeByName(treeData, site);
            const foundNodeTenant = findTreeNodeByName(treeData, tenant);
            if (foundNodeSite && foundNodeTenant) {
                const jsonstring = [
                    { VariableContext: "Location", VariableName: "SiteID", SessionValue: foundNodeSite.NodeEntID },
                    { VariableContext: "Location", VariableName: "SiteName", SessionValue: foundNodeSite.Name },
                    { VariableContext: "Location", VariableName: "SiteDateFormat", SessionValue: dateFormat || "" },
                    { VariableContext: "Filter", VariableName: "TenantID", SessionValue: tenant },
                    { VariableContext: "Filter", VariableName: "TenantName", SessionValue: foundNodeTenant.Name },
                    { VariableContext: "Location", VariableName: "RoomID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "RoomName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationName", SessionValue: "" },
                ];
                axiosInterceptor({
                    url: SESSION.UpdateSession,
                    data: {
                        jsonSession: JSON.stringify(jsonstring)
                    },
                    setFetchData: handleUpdateSessionApiResponse
                }, statusBarContext);
            }
        }
        else if (site && treeData) {
            const foundNode = findTreeNodeByName(treeData, site);
            if (foundNode) {
                const jsonstring = [
                    { VariableContext: "Location", VariableName: "SiteID", SessionValue: foundNode.NodeEntID },
                    { VariableContext: "Location", VariableName: "SiteName", SessionValue: foundNode.Name },
                    { VariableContext: "Location", VariableName: "SiteDateFormat", SessionValue: dateFormat || "" },
                    { VariableContext: "Location", VariableName: "RoomID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "RoomName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationName", SessionValue: "" },
                ];
                axiosInterceptor({
                    url: SESSION.UpdateSession,
                    data: {
                        jsonSession: JSON.stringify(jsonstring)
                    },
                    setFetchData: handleUpdateSessionApiResponse
                }, statusBarContext);
            }
        }
        else if (tenant && treeData) {
            const foundNode = findTreeNodeByName(treeData, tenant);
            if (foundNode) {
                const jsonstring = [
                    { VariableContext: "Filter", VariableName: "TenantID", SessionValue: foundNode.NodeEntID },
                    { VariableContext: "Filter", VariableName: "TenantName", SessionValue: foundNode.Name },
                    { VariableContext: "Location", VariableName: "RoomID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "RoomName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationName", SessionValue: "" },
                ];
                axiosInterceptor({
                    url: SESSION.UpdateSession,
                    data: {
                        jsonSession: JSON.stringify(jsonstring)
                    },
                    setFetchData: handleUpdateSessionApiResponse
                }, statusBarContext);
            }
        }
        else if (entId) {
            selectedNodeContext.setSearchParaToSelect({
                entID: entId,
                entityName: entityName ?? ""
            })
        }
    }

    // Toggles cabling header button states and syncs hide-column context.
    function handleMouseCablingHeaderButton(from: boolean, cable: boolean, toDevice: boolean): void {
        const hideObj = {
            fromPort: Boolean(from),
            cable: Boolean(cable),
            toDevicePort: Boolean(toDevice)
        };
        setCablingButtonObject(hideObj);
        commonVariableContext.setCablingHideColumnObject({ ...hideObj });
    }

    // Handles node checkbox selection flow for cabling edit/review features.
    const handleNodeCheck = (checked: Key[] | { checked: Key[]; halfChecked: Key[] }, info: CheckInfo<ITreeNode>) => {
        if ((explorerContainerProps.featureId === FEnums.EditPowerCabling && info.node.HasPowerPorts) || (explorerContainerProps.featureId === FEnums.EditNetworkCabling && info.node.HasNetworkPorts)) {
            const str = getHeaderTextBasedOnNode(info.node)
            setKebabMenuContainerHeaderText(str)
            if (!defaultCheckedKeys.includes(info.node.key)) {
                setAddtoCableRtmSelect(null)
                setDefaultCheckedKeys([info.node.key])
                defaultCheckedKeyRef.current = [info.node.key]
                setCheckedNode(info.node)
                selectedNodeContext.setCheckedNode(info.node)
                setCablingHeaderBtn(true)
                const selectedNode: ISelectedNodeInfo = {
                    event: "select",
                    selected: true,
                    node: info.node,
                    selectedNodes: [info.node],
                    nativeEvent: info.nativeEvent
                }
                setSelectedNodeInfo(selectedNode)
            } else {
                setCablingHeaderBtn(false)
                defaultCheckedKeyRef.current = [info.node.key]
                setDefaultCheckedKeys([info.node.key])
            }
        } else {
            setDefaultCheckedKeys(checked as Key[])
            setCheckedNode(info.node)
        }
    }

    // Opens confirmation dialog with provided message text.
    const handleShowErrorDialog = (message: string, isOpen: boolean) => {
        setConfirmMessage(message);
        setIsConfirmOpen(true);
    }

    // Confirms export-audit workflow and downloads returned workbook content.
    const handleConfirmYesClick = () => {
        if (selectedNodeMenu && selectedNodeInfo && selectedNodeInfo.node) {
            if (selectedNodeMenu.Label === RightMouseMenuTreeNode.ExportAuditInventory) {
                let entityData = selectedNodeInfo.node;
                let requiredTableList = ["PG.AuditInventory"];
                let tableNames = requiredTableList.join(DELIMITER.separator);
                axiosInterceptor({
                    url: EM.GetEntityRecordsForExport,
                    data: {
                        mode: "EXPORT",
                        entityName: entityData.EntityName,
                        tableNames: tableNames,
                        excludeRecordId: false,
                        entIDs: entityData.EntID
                    },
                    setFetchData: (getEntityRecordsForExportApiResponse: unknown, status?: string) => {
                        if (status === "200" && getEntityRecordsForExportApiResponse && Array.isArray(getEntityRecordsForExportApiResponse) && getEntityRecordsForExportApiResponse.length > 0) {
                            let responseData = getEntityRecordsForExportApiResponse;
                            let wb = XLSX && XLSX?.utils?.book_new() // make Workbook of Excel
                            for (let i = 0; i < responseData.length; i++) {
                                let sheet = XLSX.utils.json_to_sheet([{}]);
                                if (responseData[i].jsonData) {
                                    sheet = XLSX?.utils?.sheet_add_json(sheet, FnParseJsonSafely(responseData[i].jsonData), {
                                        origin: "A1"
                                    });
                                }
                                else {
                                    const blankRecord: Record<string, unknown> = {};
                                    const columnArray = FnParseJsonSafely(responseData[i].columnArray) as Array<{ ColumnName: string }>;
                                    for (let j = 0; j < columnArray.length; j++) {
                                        blankRecord[columnArray[j].ColumnName] = null;
                                    }
                                    sheet = XLSX?.utils?.sheet_add_json(sheet, [blankRecord], {
                                        origin: "A1"
                                    });
                                }
                                if (wb) {
                                    XLSX?.utils?.book_append_sheet(wb, sheet, responseData[i].tableName);
                                }
                            }
                            // export Excel file
                            if (wb && wb.SheetNames.length > 0 && entityData.EntityName) {
                                XLSX.writeFile(wb, entityData.EntityName + ".xlsx", { bookType: 'xlsx', type: 'binary' });
                            }
                        }
                    }
                }, statusBarContext)
            }
        }
        setConfirmMessage("");
        setIsConfirmOpen(false);
        setIsShowOkButton(true)
    }

    // Opens or closes right sidebar panel.
    const handleSidebarOpenClose = (action: 'open' | 'close'): void => {
        if (action === 'close') {
            setIsShowSidebar(false);
            setIsSidebar(undefined);
        }
        else {
            setIsShowSidebar(true);
            setIsSidebar('sidebarOpen');
        }
    }

    // Clears cached original tree data based on active feature cache rules.
    const handleClearCacheTreeData = (): void => {
        if (explorerContainerProps.featureId === FEnums.InventoryManagement || explorerContainerProps.featureId === FEnums.InventoryConfiguration) {
            setOriginalTreeData([]);
            originalTreeDataRef.current = [];
        }
        else if (explorerContainerProps.featureId && ReuseDataForFeatures.includes(explorerContainerProps.featureId)) {
            setOriginalTreeDataForInventory([]);
        }
        else {
            setOriginalTreeData([]);
            originalTreeDataRef.current = [];
            setOriginalTreeDataForInventory([]);
        }
        explorerContainerProps.clearCacheTreeData?.();
    }
    return (
        <div key={explorerContainerProps.uniqueName} id="FeatureContainer" className="nz-explorer-container" >
            <div className="nz-feature-explorer-container">
                {explorerToRender !== "NONE" && activeView !== "INVENTORY" && <Splitter className='nz-w-100 nz-h-100' onResizeEnd={handleExplorerResizeEnd} tabIndex={-1}>
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className={`nz-d-flex-column nz-justify-center nz-explorer-pane${!explorerContainerProps.subTreeFeatureId ? " nz-dc-explorer-pane nz-exp-pane" : " nz-pane-1"}`}>
                        {explorerContainerProps.allowShowHeader &&
                            <div className='nz-sub-header  nz-d-flex-row nz-align-center nz-justify-between nz-explorer-header'>
                                <Label uniqueName={explorerContainerProps.uniqueName + "header"} label={explorerContainerProps.headerText ?? ""} fontWeight="bold" />
                            </div>}
                        {explorerToRender === "FEATURE" && hierarchyApiData && typeof hierarchyApiData === "object" ?
                            <ExplorerTreeContainer
                                uniqueName={`${explorerContainerProps.uniqueName}-feature-explorer`}
                                featureId={explorerContainerProps.featureId}
                                handleNodeSelect={handleNodeSelect}
                                handleKebabMenuSelect={handleKebabMenuSelect}
                                defaultSelectedNodeKey={selectedNodeInfo?.node.key ? selectedNodeInfo?.node.key : undefined}
                                updateStatusBarData={explorerContainerProps.updateStatusBarData}
                                allowSearchControl={explorerContainerProps.featureId !== FEnums.ManageBusinessService && explorerContainerProps.featureId !== FEnums.ModelBusinessService && explorerContainerProps.featureId !== FEnums.PowerBI}
                                apiData={hierarchyApiData} /> : null}
                        {explorerToRender === "DC" && (explorerContainerProps.featureId !== FEnums.DCMConsole && explorerContainerProps.featureId !== FEnums.Relocate) && <DcExplorerContainer
                            uniqueName={`${explorerContainerProps.uniqueName}-dc-explorer`}
                            featureId={explorerContainerProps.featureId}
                            subTreeFeatureId={explorerContainerProps.subTreeFeatureId}
                            selectedNodeExplorer={explorerContainerProps.selectedNodeExplorer}
                            isReloadTreeCache={explorerContainerProps.selectedFeatureData?.isReloadCache}
                            defaultCheckedKeys={defaultCheckedKeys}
                            originalTreeData={explorerContainerProps.originalTreeData ? explorerContainerProps.originalTreeData : explorerContainerProps.featureId === FEnums.InventoryManagement || explorerContainerProps.featureId === FEnums.InventoryConfiguration ? originalTreeDataForInventory : originalTreeData}
                            handleNodeSelect={handleNodeSelect}
                            handleNodeCheck={handleNodeCheck}
                            updateOriginalTreeDataset={updateOriginalTreeDataset}
                            handleKebabMenuSelect={handleKebabMenuSelect}
                            clearCacheTreeData={handleClearCacheTreeData}
                            updateStatusBarData={explorerContainerProps.updateStatusBarData}
                            handleShowUserMessage={explorerContainerProps.handleShowUserMessage}
                        />}
                        {explorerToRender === "PLAN" && <PlanTreeContainer
                            key={`${explorerContainerProps.uniqueName}-plan-explorer-${planTreeRefreshKey}-${explorerContainerProps.featureId}`}
                            uniqueName={`${explorerContainerProps.uniqueName}-plan-explorer`}
                            featureId={explorerContainerProps.featureId}
                            tagName={"Transfer"}
                            selectedNodeKey={selectedNodeInfo?.node?.NodeEntID || selectedNodeInfo?.node?.key?.toString()}
                            handleNodeSelect={handleNodeSelect}
                        />}
                        {(explorerToRender === "RELOCATE" || explorerContainerProps.featureId === FEnums.Relocate) && <RelocateTreeContainer
                            uniqueName={`${explorerContainerProps.uniqueName}-relocate-tree`}
                            featureId={explorerContainerProps.featureId}
                            selectedNodeExplorer={explorerContainerProps.selectedNodeExplorer}
                            selectedFloorNode={explorerContainerProps.selectedFloorNode ?? selectedFloorNode}
                            treeData={explorerContainerProps.firstPaneTreeData ?? (treeData?.length ? treeData : originalTreeData)}
                            handleNodeSelect={handleNodeSelect}
                            handleReloadTree={handleReloadTree}
                            handleShowUserMessage={explorerContainerProps.handleShowUserMessage}
                        />}
                        {commonVariableContext.isDcmConsoleLoaded && explorerToRender === "DC"
                            && (explorerContainerProps.featureId === FEnums.DCMConsole)
                            && <DcExplorerContainer
                                uniqueName={`${explorerContainerProps.uniqueName}-dc-explorer`}
                                featureId={explorerContainerProps.featureId}
                                subTreeFeatureId={explorerContainerProps.subTreeFeatureId}
                                selectedNodeExplorer={explorerContainerProps.selectedNodeExplorer}
                                isReloadTreeCache={explorerContainerProps.selectedFeatureData?.isReloadCache}
                                defaultCheckedKeys={defaultCheckedKeys}
                                originalTreeData={explorerContainerProps.originalTreeData ? explorerContainerProps.originalTreeData : originalTreeData}
                                handleNodeSelect={handleNodeSelect}
                                updateOriginalTreeDataset={updateOriginalTreeDataset}
                                clearCacheTreeData={handleClearCacheTreeData}
                                updateStatusBarData={explorerContainerProps.updateStatusBarData}
                                handleKebabMenuSelect={handleKebabMenuSelect}
                                handleShowUserMessage={explorerContainerProps.handleShowUserMessage}
                            />}
                        {explorerToRender === "ALL_DC" && <AllDataCenterTree uniqueName={`${explorerContainerProps.uniqueName}-datacenter-tree`} featureId={explorerContainerProps.featureId} featureData={explorerContainerProps.featureData} handleNodeSelect={handleNodeSelect}
                            updateStatusBarData={explorerContainerProps.updateStatusBarData}
                            selectDcExplorer={SelectDcExplorer}
                            handleClearNodeSelection={() => {
                                setSelectedNodeInfo(undefined)
                            }}
                            handleShowUserMessage={explorerContainerProps.handleShowUserMessage} />}
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={30} className={`nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane${!explorerContainerProps.subTreeFeatureId ? " nz-pane-1" : " nz-pane-2"}`}>
                        {allowContainerHeader && <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                            <div className="nz-d-flex-row nz-align-center nz-w-100">
                                {!showSidebarFullWidth &&
                                    <div className='nz-fq-container-header'>
                                        {(explorerContainerProps.featureId === FEnums.EditPowerCabling || explorerContainerProps.featureId === FEnums.EditNetworkCabling || explorerContainerProps.featureId === FEnums.ReviewPowerCabling || explorerContainerProps.featureId === FEnums.ReviewNetworkCabling) && cablingHeaderBtn && cablingButtonObject ?
                                            <CablingToggleButton uniqueName='cabling-button' headerText={`${kebabMenuContainerHeaderText ? kebabMenuContainerHeaderText : selectedNodeInfo?.node ? (explorerContainerProps.featureId === FEnums.EditPowerCabling || explorerContainerProps.featureId === FEnums.EditNetworkCabling) && checkedNode ? getHeaderTextBasedOnNode(checkedNode) : getHeaderTextBasedOnNode(selectedNodeInfo.node) : "Layout"} `} cablingButtonObject={cablingButtonObject} handleMouse={handleMouseCablingHeaderButton} />
                                            : <Label uniqueName={`${explorerContainerProps.uniqueName}-fqa-container`}
                                                label={`${kebabMenuContainerHeaderText ? kebabMenuContainerHeaderText : selectedNodeInfo?.node ? (explorerContainerProps.featureId === FEnums.EditPowerCabling || explorerContainerProps.featureId === FEnums.EditNetworkCabling) && checkedNode ? getHeaderTextBasedOnNode(checkedNode) : getHeaderTextBasedOnNode(selectedNodeInfo.node) : "Layout"} `}
                                            />}
                                    </div>
                                }
                            </div>
                            {featureQAData?.length && isShowSidebarIcon ? <ActionImage uniqueName={`${explorerContainerProps.uniqueName}-explorer-tree-info-ai`}
                                image={{
                                    uniqueName: `${explorerContainerProps.uniqueName}-explorer-tree-info-image`,
                                    source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                                        fill="none"
                                        strokeWidth={1} />,
                                    w: 'var(--image-size-2)',
                                    tooltip: "Click to view node details in sidebar",
                                    type: "svg"
                                }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'} handleMouse={handleClickInformation} /> : <></>
                            }
                        </div>}
                        {controlHtmlToRender ?
                            <div className='nz-node-menu-controls-container'>
                                {controlHtmlToRender}
                            </div>
                            : <LayoutContainer
                                key={selectedNodeInfo?.node?.refreshKey ?? ""}
                                featureRecords={explorerContainerProps.featureData}
                                selectedNodeInfo={selectedNodeInfo}
                                uniqueName={`${explorerContainerProps.uniqueName}-layout-container`}
                                showFloorLayout={!commonVariableContext.hideFloorLayout && showFloorLayout}
                                featureId={explorerContainerProps.featureId}
                                treeData={treeData?.length ? treeData
                                    : originalTreeData?.length ? originalTreeData
                                        : originalTreeDataForInventory}
                                isSiteByTenant={isSiteByTenant}
                                isSidebarOpen={isShowSidebar}
                                handleSidebarClose={() => {
                                    setIsShowSidebar(true)
                                }}
                                selectDcExplorer={SelectDcExplorer}
                                handleSidebarOpenClose={handleSidebarOpenClose}
                                updateStatusBarData={explorerContainerProps.updateStatusBarData}
                                selectedExplorerNodeInfo={manuallyNodeSelected && featureIdRef.current !== FEnums.Delete && featureIdRef.current !== FEnums.AssetPlacement && featureIdRef.current !== FEnums.Relocate ? undefined : explorerContainerProps.selectedNodeExplorer}
                                defaultCheckedKeys={defaultCheckedKeys}
                                checkedNode={checkedNode}
                                addToCableRtmSelect={addToCableRtmSelect}
                                selectedNodeForCustomization={explorerContainerProps.selectedNodeForCustomization}
                                selectedFloorNode={selectedFloorNode}
                                selectedKebabMenu={selectedKebabMenu}
                                isShowSidebarBtn={isShowSidebarIcon}
                                handleReloadTree={handleReloadTree}
                                handleShowUserMessage={explorerContainerProps.handleShowUserMessage}
                            />
                        }
                        {
                            popupcontrolHtmlToRender
                        }
                    </SplitterPanel>
                </Splitter>}
                {(explorerToRender === "NONE" || activeView === "INVENTORY") && <div className={`nz-layout-without-tree`}>
                    {allowContainerHeader && <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                        <Label uniqueName={explorerContainerProps.uniqueName + "header"} label={activeView === "INVENTORY" ? "Inventory" : explorerContainerProps.headerText ?? ""} fontWeight="bold" />
                        {featureQAData?.length && isShowSidebarIcon ? <ActionImage uniqueName={`${explorerContainerProps.uniqueName}-explorer-tree-info-ai`}
                            image={{
                                uniqueName: `${explorerContainerProps.uniqueName}-explorer-tree-info-image`,
                                source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                                    fill="none"
                                    strokeWidth={1} />,
                                w: 'var(--image-size-2)',
                                tooltip: "Click to view node details in sidebar",
                                type: "svg"
                            }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'} handleMouse={handleClickInformation} /> : <></>
                        }
                    </div>}
                    {activeView === "INVENTORY" && explorerContainerProps.selectedNodeExplorer?.node ? <InventoryCollectionContainer
                        uniqueName={"inventory-collection-container"}
                        featureId={explorerContainerProps.featureId}
                        selectedNode={explorerContainerProps.selectedNodeExplorer?.node}
                        tableToShow={"PG.AuditInventory"}
                        hideAddForm={true} treeData={[]}
                    /> : <LayoutContainer selectedSubGroupItemForMenu={selectedSubGroupItem}
                        key={selectedNodeInfo?.node?.refreshKey ?? ""}
                        selectDcExplorer={SelectDcExplorer} selectedNodeInfo={explorerContainerProps.selectedNodeExplorer ? explorerContainerProps.selectedNodeExplorer : undefined} uniqueName={`${explorerContainerProps.uniqueName}-layout-container`}
                        showFloorLayout={false} featureId={explorerContainerProps.featureId}
                        selectedFeatureItem={explorerContainerProps.selectedFeatureData}
                        updateStatusBarData={explorerContainerProps.updateStatusBarData}
                        isSidebarOpen={isShowSidebar}
                        isShowSidebarBtn={isShowSidebarIcon}
                        handleSidebarClose={() => {
                            setIsShowSidebar(true)
                        }}
                        headerText={explorerContainerProps.headerText}
                        selectedKebabMenu={selectedKebabMenu}
                        handleReloadTree={handleReloadTree}
                        handleShowUserMessage={explorerContainerProps.handleShowUserMessage}
                        featureRecords={explorerContainerProps.featureId === FEnums.Configure && powerConfigureFeatureData ? powerConfigureFeatureData : explorerContainerProps.featureData} />}
                </div>}
                {(explorerContainerProps.selectedNodeExplorer || selectedNodeInfo?.node) && isSidebar &&
                    featureQAData?.length ?
                    <SidebarContainer
                        uniqueName={`${explorerContainerProps.uniqueName}-sidebar`}
                        isShowSidebar={isShowSidebar}
                        featureQaList={featureQAData ?? []}
                        selectedNode={
                            explorerContainerProps.subTreeFeatureId
                                ? explorerContainerProps.selectedNodeExplorer
                                    && !manuallyNodeSelected && selectedKebabMenuExplorer?.Label !== RightMouseMenuTreeNode.AddNewAuditSession
                                    ? explorerContainerProps.selectedNodeExplorer.node
                                    : selectedNodeInfo?.node
                                : selectedNodeInfo?.node
                        }
                        featureId={explorerContainerProps.featureId}
                        selectedNodeExplorer={explorerContainerProps.selectedNodeExplorer ? explorerContainerProps.selectedNodeExplorer.node : undefined}
                        subTreeFeatureId={explorerContainerProps.subTreeFeatureId}
                        fullView={showSidebarFullWidth}
                        headerText={""}
                        selectedFeatureQa={selectedKebabMenuExplorer ?? null}
                        showPopupSidebar={false}
                        selectedMenuFeature={explorerContainerProps.selectedFeatureData}
                        treeData={treeData?.length ? treeData
                            : originalTreeData?.length ? originalTreeData
                                : originalTreeDataForInventory}
                        handleCloseSidebar={() => {
                            setIsSidebar('sidebarClose');
                            setIsShowSidebar(false);
                            if (explorerContainerProps.handleCloseSidebar) {
                                explorerContainerProps.handleCloseSidebar();
                            }
                        }}
                        handleReloadTree={handleReloadTree}
                        handleMouse={handleMouseSidebar}
                        handleShowErrorDialog={handleShowErrorDialog}
                    /> : <></>
                }
            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={explorerContainerProps.uniqueName + "confirmbox"}
                message={confirmMessage}
                showOkButton={isShowOkButton}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={function (): void {
                    setIsConfirmOpen(false)
                    setIsShowOkButton(true);
                }}
                handleOkButtonClick={
                    () => {
                        setIsConfirmOpen(false)
                    }
                } />
        </div >
    )
}
export { ExplorerContainer }

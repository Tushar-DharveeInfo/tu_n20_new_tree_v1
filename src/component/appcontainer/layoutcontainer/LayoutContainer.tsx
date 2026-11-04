
import { JSX, lazy, Suspense, useEffect, useRef, useState } from "react"
import isEqual from "lodash/isEqual"
import '../allcss/LayoutContainer.css'
import { ILayoutContainer } from "../allinterface/ILayoutContainer"
import { FEnums } from "../../constants/Feature.ts"
import { DcmConsole } from "../../features/power/DcmConsole.tsx"
import { DashboardChartsContainer } from "../../features/home/dashboardchartscontainer/DashboardChartsContainer.tsx"
import { GoogleMap } from "../../features/home/googlemap/GoogleMap.tsx"
import { AppqaSettingsProvider } from "../../shared/context/contextandprovider/AppqaSettingsVar.tsx"
import { EditFloorLayout } from "../../features/plan/editfloorlayout/EditFloorLayout.tsx"
import { useDcmConsoleContext } from "../../shared/context/hooks/DcmConsoleHooks.ts"
import { MountedDeviceViewContainer } from "../../shared/deviceview/mounteddeviceviewcontainer/MountedDeviceViewContainer.tsx"
import { RightMouseMenuTreeNode } from "../../constants/Feature.ts"
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl.ts"
import { Loader } from "../../shared/loader/Loader.tsx"
import { PlacementExplorer } from "../../features/plan/placementexplorer/PlacementExplorer.tsx"
import { EditDeviceReplacement } from "../../features/techrefresh/editdevicereplacement/EditDeviceReplacement.tsx"
import { CreateReplacementContainer } from "../../features/techrefresh/editdevicereplacement/CreateReplacementContainer.tsx"
import { useStatusBarContext } from "../../shared/context/hooks/StatusBarHooks.ts"
import { PowerBiReport } from "../../features/home/powerbireport/PowerBiReport.tsx"
import { IPowerBIReportProps } from "../../features/allinterface/home/IPowerBIReportProps.ts"
import { FnFindNearestNodeByType } from "../../shared/allcommon/FnFindNearestNodeByType.ts"
import { FnFindNodeAndParents } from "../../shared/allcommon/tablegrid/FnFindNodeAndParents.ts"
import DashboardChartContainerWithOverlay from "../../shared/charts/dashboardchartcontainerwithoverlay/DashboardChartContainerWithOverlay.tsx"
import { DiscoverDetailsContainer } from "../../features/power/DiscoverDetailsContainer.tsx"
import WorkOrderContainer from "../../features/rackandstack/workordercontainer/WorkOrderContainer.tsx"
import { StoreDataContainer } from "../../features/store/storedatacontainer/StoreDataContainer.tsx"
import { InventoryCollectionContainer } from "../../features/audit/InventoryCollectionContainer.tsx"
import { InboundAssetContainer } from "../../features/plan/inboundassetcontainer/InboundAssetContainer.tsx"
import { TransferContainer } from "../../features/plan/transfercontainer/TransferContainer.tsx"
import { DeleteContainer } from "../../features/plan/deletecontainer/DeleteContainer.tsx"
import { DeviceFloorLayoutContainer } from "../../features/dc/devicefloorlayoutcontainer/DeviceFloorLayoutContainer.tsx"
import ErrorBoundary from "../../shared/errorboundary/ErrorBoundary.tsx"
import CablingNavigation from '../../features/cabling/cablingnavigation/CablingNavigation.tsx'
import AppqaSettings from '../../appqa/appqasettings/AppqaSettings.tsx'
import BsDiagram from "../../features/it/BsDiagram.tsx"
import PowerTrace from '../../features/cabling/powertrace/PowerTrace.tsx'
import NetworkTrace from '../../features/cabling/networktrace/NetworkTrace.tsx'
import DeviceViewContainer from '../../shared/deviceview/deviceviewcontainer/DeviceViewContainer.tsx'
import FloorLayoutContainer from '../../features/dc/floorlayoutcontainer/FloorLayoutContainer.tsx'
import { InventoryReconciliationContainer } from "../../features/audit/InventoryReconciliationContainer.tsx"

// Only keep lazy loading for large components (>= 100KB)
const CablingGrid = lazy(() => import('../../features/cabling/cablinggrid/CablingGrid.tsx'));

// Re-export components that are used in other files with dynamic imports
export { PowerTrace, NetworkTrace, DeviceViewContainer, FloorLayoutContainer };
const LayoutContainer = (layoutProps: ILayoutContainer) => {
    const [controlHtmlToRender, setControlHtmlToRender] = useState<JSX.Element | null>(null);
    const [catchFromData, setCatchFromData] = useState<any>();
    const [catchTableData, setCatchTableData] = useState<any>();

    const checkedNodeRef = useRef<ITreeNode | null>(null);
    const selectedNodeRef = useRef<ITreeNode | null>(null);
    const isFeatureIDChanged = useRef<string | null>(null);

    const dcmConsoleContext = useDcmConsoleContext()
    const statusBarContext = useStatusBarContext();


    const handleViewClick = (entID: string) => {
        if (layoutProps.selectDcExplorer) {
            if (layoutProps.selectedNodeInfo && layoutProps.selectedNodeInfo.node && layoutProps.selectedNodeInfo.node.NodeEntID !== entID) {
                layoutProps.selectDcExplorer(undefined, undefined, undefined, entID)
            }
        }
    }

    useEffect(() => {
        return () => {
            checkedNodeRef.current = null;
            selectedNodeRef.current = null;
            isFeatureIDChanged.current = null;
        }
    }, [])

    useEffect(() => {
        if (layoutProps.selectedNodeInfo && layoutProps.selectedNodeInfo.node) {
            if (layoutProps.featureId === FEnums.Assets
                || layoutProps.featureId === FEnums.AssetAssignment
                || layoutProps.featureId === FEnums.AssetAssignmentPlan
                || layoutProps.featureId === FEnums.AssetConfiguration
                || layoutProps.featureId === FEnums.MoveAddChange
                || layoutProps.featureId === FEnums.ConfigureDevice
                || layoutProps.featureId === FEnums.EditFloorLayout
                || layoutProps.featureId === FEnums.Server
                || layoutProps.featureId === FEnums.Relocate
                || layoutProps.featureId === FEnums.AssetPlacement
                || layoutProps.featureId === FEnums.Transfer
                || layoutProps.featureId === FEnums.Delete
                || layoutProps.featureId === FEnums.Workorder
                || layoutProps.featureId === FEnums.InboundAssets
                || layoutProps.featureId === FEnums.InboundAssetPlacement
                || layoutProps.featureId === FEnums.ReplacementProfile
                || layoutProps.featureId === FEnums.Monitor
                || layoutProps.featureId === FEnums.Discover
                || layoutProps.featureId === FEnums.Replace

            ) {
                let nearestFloorNode: ITreeNode | null = layoutProps.selectedFloorNode ?? null;
                if (layoutProps.featureId === FEnums.AssetPlacement || layoutProps.featureId === FEnums.Relocate || layoutProps.featureId === FEnums.InboundAssetPlacement) {
                    if (!nearestFloorNode && layoutProps.treeData) {
                        nearestFloorNode = FnFindNearestNodeByType(layoutProps.treeData, layoutProps.selectedNodeInfo.node, "Floor");
                    }
                    if (!nearestFloorNode && layoutProps.treeData) {
                        const targetKey = (layoutProps.selectedNodeInfo.node.key ?? layoutProps.selectedNodeInfo.node.NodeEntID ?? "").toString();
                        if (targetKey) {
                            const path = FnFindNodeAndParents(layoutProps.treeData, targetKey);
                            if (path && path.length > 0) {
                                nearestFloorNode = path.slice().reverse().find(n => (n.NodeType ?? '').toLowerCase() === 'floor') ?? null;
                            }
                        }
                    }
                }
                if (layoutProps.featureId === FEnums.EditFloorLayout && (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "location"
                    || layoutProps.selectedNodeInfo.node.Type?.toLowerCase() === "floordevice")) {

                    if (layoutProps.selectedFloorNode) {


                        setControlHtmlToRender(<EditFloorLayout uniqueName={`${layoutProps.uniqueName}-edit-floor-layout`}
                            selectedFloorNode={layoutProps.selectedFloorNode}
                            featureId={layoutProps.featureId}
                            selectedNode={layoutProps.selectedNodeInfo.node}
                            mode={"canvas"}
                            handleMouse={(event: any, actionCode?: string, payload?: any) => {
                                layoutProps.handleSidebarOpenClose?.('close')
                            }}
                            selectDcExplorer={layoutProps.selectDcExplorer} allowEdit={true}
                            statusBarContext={statusBarContext}
                            handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                    }
                    else {
                        setControlHtmlToRender(null);
                    }
                }
                else if (layoutProps.featureId === FEnums.InboundAssets) {
                    setControlHtmlToRender(<InboundAssetContainer
                        uniqueName={`${layoutProps.uniqueName}-Manage-Placement`}
                        featureId={layoutProps.featureId} selectedNodeInfo={layoutProps.selectedNodeInfo} />)
                } else if (layoutProps.featureId === FEnums.ReplacementProfile) {

                    setControlHtmlToRender(<AppqaSettingsProvider><EditDeviceReplacement uniqueName={`${layoutProps.uniqueName}-edit-device-replacement`}
                        key={layoutProps.featureId}
                        featureId={layoutProps.featureId}
                        selectedNodeExplorer={layoutProps.selectedNodeInfo.node}
                        handleShowUserMessage={layoutProps.handleShowUserMessage}
                        handleSidebarClose={layoutProps.handleSidebarClose}
                        handleReloadTree={layoutProps.handleReloadTree}
                    /></AppqaSettingsProvider>)
                } else if (layoutProps.featureId === FEnums.Replace) {
                    if (layoutProps.selectedNodeInfo?.node && layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "device") {
                        setControlHtmlToRender(<AppqaSettingsProvider><CreateReplacementContainer uniqueName={`${layoutProps.uniqueName}-create-replacement-container`}
                            key={layoutProps.featureId}
                            featureId={layoutProps.featureId}
                            selectedNodeExplorer={layoutProps.selectedNodeInfo.node}
                            handleShowUserMessage={layoutProps.handleShowUserMessage}
                            handleSidebarClose={layoutProps.handleSidebarClose}
                            handleReloadTree={layoutProps.handleReloadTree}
                        /></AppqaSettingsProvider>)
                    }
                    else {
                        setControlHtmlToRender(<div className="nz-wh-100 nz-d-flex-hv-left">{`Select device to view details`}</div>)
                    }
                }
                else if (layoutProps.featureId === FEnums.Workorder) {
                    setControlHtmlToRender(<WorkOrderContainer uniqueName={"workorder-container"}
                        featureId={layoutProps.featureId}
                        selectedNode={layoutProps.selectedNodeInfo.node}
                        selectedFeature={layoutProps.selectedFeatureItem}
                        isShowSidebarBtn={false}
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                        handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                }
                else if (layoutProps.featureId === FEnums.Discover) {
                    setControlHtmlToRender(<DiscoverDetailsContainer
                        selectedNode={layoutProps.selectedNodeInfo.node}
                        isDashboard={false}
                        hideHeader={false}
                        title='Dashboardchart'
                        uniqueName={layoutProps.uniqueName}
                        featureId={layoutProps.featureId}
                        isSidebarOpen={layoutProps.isSidebarOpen}
                        purpose="Discover"
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                        outputFormat={"jsx"}
                        handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                }
                else if (layoutProps.featureId === FEnums.Monitor) {
                    setControlHtmlToRender(<DashboardChartContainerWithOverlay
                        selectedNode={layoutProps.selectedNodeInfo.node}
                        isDashboard={false}
                        hideHeader={false}
                        title='Dashboardchart'
                        uniqueName={layoutProps.uniqueName}
                        featureId={layoutProps.featureId}
                        isSidebarOpen={layoutProps.isSidebarOpen}
                        purpose="Monitor"
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                        outputFormat={"jsx"}
                        handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                }
                else if ((layoutProps.featureId === FEnums.AssetPlacement || layoutProps.featureId === FEnums.Relocate || layoutProps.featureId === FEnums.InboundAssetPlacement) && layoutProps.selectedExplorerNodeInfo && (nearestFloorNode || layoutProps.selectedFloorNode || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor")) {
                    const effectiveFloor = layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor"
                        ? layoutProps.selectedNodeInfo.node
                        : (layoutProps.selectedFloorNode ?? nearestFloorNode);
                    const floorNodeInfo = effectiveFloor ? { ...layoutProps.selectedNodeInfo, node: effectiveFloor } : layoutProps.selectedNodeInfo;
                    setControlHtmlToRender(<AppqaSettingsProvider><PlacementExplorer
                        uniqueName={`${layoutProps.uniqueName}-Manage-Placement`}
                        featureId={layoutProps.featureId}
                        selectedNodeInfo={floorNodeInfo}
                        treeData={layoutProps.treeData}
                        selectedNodeExplorer={layoutProps.selectedExplorerNodeInfo}
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                        handleReloadTree={layoutProps.handleReloadTree}
                        handleShowUserMessage={layoutProps.handleShowUserMessage}
                    /></AppqaSettingsProvider>)
                } else if (layoutProps.featureId === FEnums.Delete && layoutProps.selectedNodeInfo) {
                    if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "device" && !layoutProps.selectedNodeInfo.node.WOID) {
                        setControlHtmlToRender(
                            <DeleteContainer
                                uniqueName={`${layoutProps.uniqueName}-delete-container`}
                                featureId={layoutProps.featureId}
                                selectedNodeInfo={layoutProps.selectedNodeInfo}
                                selectedFloorNode={layoutProps.selectedFloorNode}
                                treeData={layoutProps.treeData}
                                showFloorLayout={layoutProps.showFloorLayout}
                                isSidebarOpen={layoutProps.isSidebarOpen}
                                isShowSidebarBtn={layoutProps.isShowSidebarBtn}
                                hideSidebarBtn={layoutProps.isShowSidebarBtn === false}
                                handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                handleSidebarClose={layoutProps.handleSidebarClose}
                                selectDcExplorer={layoutProps.selectDcExplorer}
                                handleShowUserMessage={layoutProps.handleShowUserMessage}
                                handleReloadTree={layoutProps.handleReloadTree}
                            />
                        )
                    }
                    else {
                        setControlHtmlToRender(<div className="nz-wh-100 nz-d-flex-hv-left">{`Select device without workorder to view details`}</div>)
                    }
                } else if (layoutProps.featureId === FEnums.Transfer && layoutProps.selectedNodeInfo) {
                    if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "device" && !layoutProps.selectedNodeInfo.node.WOID) {
                        setControlHtmlToRender(
                            <TransferContainer uniqueName={`${layoutProps.uniqueName}-Manage-Placement`}
                                featureId={layoutProps.featureId}
                                selectedNodeInfo={layoutProps.selectedNodeInfo}
                                treeData={layoutProps.treeData}
                                handleShowUserMessage={layoutProps.handleShowUserMessage}
                                handleReloadTree={layoutProps.handleReloadTree}
                            />
                        )
                    }
                    else {
                        setControlHtmlToRender(<div className="nz-wh-100 nz-d-flex-hv-left">{`Select device without workorder to view details`}</div>)
                    }
                }
                else {
                    if (layoutProps.showFloorLayout && layoutProps.selectedFloorNode && (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "location")) {
                        setControlHtmlToRender(
                            <ErrorBoundary>
                                <FloorLayoutContainer uniqueName={"floor-layour-container"}
                                    allowEdit={false}
                                    selectedFloorNode={layoutProps.selectedFloorNode}
                                    selectedNode={layoutProps.selectedNodeInfo.node}
                                    isFloorNode={layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" ? true : false}
                                    treeData={layoutProps.treeData}
                                    featureId={layoutProps.featureId}
                                    isSidebarOpen={layoutProps.isSidebarOpen}
                                    selectDcExplorer={layoutProps.selectDcExplorer}
                                    handleShowUserMessage={layoutProps.handleShowUserMessage}
                                    handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} />
                            </ErrorBoundary>
                        )
                    }
                    else if (layoutProps.showFloorLayout && layoutProps.selectedFloorNode && (layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice")) {
                        setControlHtmlToRender(
                            <DeviceFloorLayoutContainer
                                uniqueName={"device-floor-layour-container"}
                                selectedFloorNode={layoutProps.selectedFloorNode}
                                selectedNode={layoutProps.selectedNodeInfo.node}
                                treeData={layoutProps.treeData}
                                featureId={layoutProps.featureId}
                                isSidebarOpen={layoutProps.isSidebarOpen}
                                handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                selectDcExplorer={layoutProps.selectDcExplorer}
                                handleShowUserMessage={layoutProps.handleShowUserMessage} />
                        )
                    }
                    else if (layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device"
                        || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceslot"
                        || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "port"
                        || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceview") {
                        setControlHtmlToRender(
                            <ErrorBoundary>
                                <DeviceViewContainer viewType="device" uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId}
                                    selectedNode={layoutProps.selectedNodeInfo.node} treeData={layoutProps.treeData}
                                    handleViewClick={handleViewClick} isSidebarOpen={layoutProps.isSidebarOpen}
                                    handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} isShowSidebarBtn={layoutProps.isShowSidebarBtn} handleShowUserMessage={layoutProps.handleShowUserMessage} />
                            </ErrorBoundary>
                        )
                    } else if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") {
                        setControlHtmlToRender(<MountedDeviceViewContainer uniqueName={layoutProps.uniqueName}
                            featureId={layoutProps.featureId}
                            selectedNode={layoutProps.selectedNodeInfo.node}
                            treeData={layoutProps.treeData}
                            handleViewClick={handleViewClick}
                            isSidebarOpen={layoutProps.isSidebarOpen}
                            handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                            handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                    } else if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "site" || (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "room")) {

                        setControlHtmlToRender(<DashboardChartContainerWithOverlay selectedNode={layoutProps.selectedNodeInfo.node} isDashboard={false} hideHeader={false} title='Dashboardchart' uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId} isSidebarOpen={layoutProps.isSidebarOpen} handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} outputFormat={"jsx"} handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                    }
                    else {
                        setControlHtmlToRender(<div>{`Show data for : ${layoutProps.selectedNodeInfo.node.Name}`}</div>);
                    }
                }
            }
            else if (layoutProps.featureId === FEnums.ReviewPowerCabling
                || layoutProps.featureId === FEnums.PowerTrace
                || layoutProps.featureId === FEnums.PowerNavigate
                || layoutProps.featureId === FEnums.ReviewNetworkCabling
                || layoutProps.featureId === FEnums.NetworkTrace
                || layoutProps.featureId === FEnums.NetworkNavigate
                || layoutProps.featureId === FEnums.EditPowerCabling
                || layoutProps.featureId === FEnums.EditNetworkCabling) {
                if (layoutProps.showFloorLayout && layoutProps.selectedFloorNode && (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "location")) {
                    setControlHtmlToRender(
                        <ErrorBoundary>
                            <FloorLayoutContainer uniqueName={"floor-layour-container"}
                                featureId={layoutProps.featureId} allowEdit={false}
                                selectedNode={layoutProps.selectedNodeInfo.node}
                                selectDcExplorer={layoutProps.selectDcExplorer}
                                handleShowUserMessage={layoutProps.handleShowUserMessage}
                                isFloorNode={layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" ? true : false} selectedFloorNode={layoutProps.selectedFloorNode} treeData={layoutProps.treeData} isSidebarOpen={layoutProps.isSidebarOpen} handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} />
                        </ErrorBoundary>
                    )
                } else if ((layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device"
                    || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") &&
                    ((layoutProps.featureId === FEnums.EditNetworkCabling && layoutProps.selectedNodeInfo.node.HasNetworkPorts)
                        || (layoutProps.featureId === FEnums.EditPowerCabling && layoutProps.selectedNodeInfo.node.HasPowerPorts)
                        || (layoutProps.featureId === FEnums.ReviewPowerCabling && layoutProps.selectedNodeInfo.node.HasPowerPorts)
                        || (layoutProps.featureId === FEnums.ReviewNetworkCabling && layoutProps.selectedNodeInfo.node.HasNetworkPorts))) {
                    const isReadOnly = layoutProps.featureId === FEnums.EditPowerCabling
                        || layoutProps.featureId === FEnums.EditNetworkCabling ? false : true
                    const checkNodeChange = layoutProps.featureId === FEnums.EditNetworkCabling || layoutProps.featureId === FEnums.EditPowerCabling ? !isEqual(checkedNodeRef.current, layoutProps.checkedNode) : !isEqual(selectedNodeRef.current, layoutProps.selectedNodeInfo.node)
                    const checkFeatureIdChange = !isEqual(isFeatureIDChanged.current, layoutProps.featureId)
                    if (checkNodeChange || checkFeatureIdChange) {
                        setCatchFromData(null)
                        setCatchTableData(null)
                    }

                    const activeNodeId = (layoutProps.featureId === FEnums.EditNetworkCabling || layoutProps.featureId === FEnums.EditPowerCabling ? layoutProps.checkedNode?.NodeEntID : layoutProps.selectedNodeInfo.node?.NodeEntID) || 'cabling';
                    if (checkNodeChange || layoutProps.addToCableRtmSelect !== null || checkFeatureIdChange) {
                        setControlHtmlToRender(
                            <ErrorBoundary>
                                <Suspense fallback={<Loader />}>
                                    <CablingGrid
                                        key={`${layoutProps.featureId}-${activeNodeId}`}
                                        uniqueName={'cablingGrid'}
                                        treeData={layoutProps.treeData}
                                        selectedNodeMenu={layoutProps.addToCableRtmSelect ? layoutProps.addToCableRtmSelect :
                                            {
                                                Label: layoutProps.featureId === FEnums.EditPowerCabling ?
                                                    layoutProps.featureId === FEnums.EditPowerCabling ? RightMouseMenuTreeNode.EditPowerCabling : RightMouseMenuTreeNode.ReviewPowerCabling :
                                                    layoutProps.featureId === FEnums.EditNetworkCabling ? RightMouseMenuTreeNode.EditNetworkCabling : RightMouseMenuTreeNode.ReviewNetworkCabling,
                                            }}
                                        featureId={layoutProps.featureId}
                                        selectedNodeInfo={layoutProps.selectedNodeInfo}
                                        isReadOnly={isReadOnly}
                                        checkedNodes={layoutProps.featureId === FEnums.EditNetworkCabling || layoutProps.featureId === FEnums.EditPowerCabling ? layoutProps.checkedNode : layoutProps.selectedNodeInfo.node}
                                        catchFromData={catchFromData}
                                        catchTableData={catchTableData}
                                        handleCatchFromData={function (data: any): void {
                                            setCatchFromData(data)
                                        }}
                                        handleCatchTableData={function (data: any): void {
                                            setCatchTableData(data)
                                        }}
                                        updateStatusBarData={layoutProps.updateStatusBarData}
                                    />
                                </Suspense>
                            </ErrorBoundary>
                        )
                    }
                }
                else if ((layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device" || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceview" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice")
                    && ((layoutProps.featureId === FEnums.PowerNavigate && layoutProps.selectedNodeInfo.node.HasPowerPorts) || (layoutProps.featureId === FEnums.NetworkNavigate && layoutProps.selectedNodeInfo.node.HasNetworkPorts))) {
                    setControlHtmlToRender(
                        <ErrorBoundary>
                            <CablingNavigation key={`${layoutProps.featureId}-${layoutProps.selectedNodeInfo.node?.NodeEntID ?? "navigate"}`} uniqueName={layoutProps.uniqueName.toString() + 'cabling-navigation'} featureId={layoutProps.featureId} selectedNode={layoutProps.selectedNodeInfo} />
                        </ErrorBoundary>
                    )
                }
                else if (layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device" || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceview" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") {
                    if ((layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") && layoutProps.selectedNodeInfo.node.HasPowerPorts && layoutProps.featureId == FEnums.PowerTrace) {
                        setControlHtmlToRender(
                            <ErrorBoundary>
                                <PowerTrace
                                    key={`${layoutProps.featureId}-${layoutProps.selectedNodeInfo.node?.NodeEntID ?? "trace"}`}
                                    uniqueName={layoutProps.uniqueName}
                                    featureId={layoutProps.featureId}
                                    selectedNode={layoutProps.selectedNodeInfo}
                                    handleSelectDCExplorer={layoutProps.selectDcExplorer}
                                    handleShowUserMessage={layoutProps.handleShowUserMessage} />
                            </ErrorBoundary>)
                    }
                    else if ((layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") && layoutProps.selectedNodeInfo.node.HasNetworkPorts && layoutProps.featureId == FEnums.NetworkTrace) {
                        setControlHtmlToRender(
                            <ErrorBoundary>
                                <NetworkTrace
                                    key={`${layoutProps.featureId}-${layoutProps.selectedNodeInfo.node?.NodeEntID ?? "trace"}`}
                                    uniqueName={layoutProps.uniqueName}
                                    featureId={layoutProps.featureId}
                                    selectedNode={layoutProps.selectedNodeInfo}
                                    handleSelectDCExplorer={layoutProps.selectDcExplorer}
                                    handleShowUserMessage={layoutProps.handleShowUserMessage} />
                            </ErrorBoundary>)
                    }

                    else {

                        if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") {
                            setControlHtmlToRender(<MountedDeviceViewContainer
                                uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId}
                                selectedNode={layoutProps.selectedNodeInfo.node} treeData={layoutProps.treeData}
                                handleViewClick={handleViewClick}
                                isSidebarOpen={layoutProps.isSidebarOpen}
                                handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                        }
                        else {

                            setControlHtmlToRender(
                                <ErrorBoundary>
                                    <DeviceViewContainer
                                        viewType="device" uniqueName={layoutProps.uniqueName}
                                        featureId={layoutProps.featureId}
                                        selectedNode={layoutProps.selectedNodeInfo.node}
                                        handleViewClick={handleViewClick} isSidebarOpen={layoutProps.isSidebarOpen}
                                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                        isShowSidebarBtn={layoutProps.isShowSidebarBtn}
                                        handleShowUserMessage={layoutProps.handleShowUserMessage} />
                                </ErrorBoundary>
                            )
                        }
                    }
                }
                else if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "site" || (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "room")) {

                    setControlHtmlToRender(<DashboardChartContainerWithOverlay
                        selectedNode={layoutProps.selectedNodeInfo.node} isDashboard={false}
                        hideHeader={false} title='Dashboardchart' uniqueName={layoutProps.uniqueName}
                        featureId={layoutProps.featureId}
                        isSidebarOpen={layoutProps.isSidebarOpen}
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} outputFormat={"jsx"}
                        handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                }
                else {
                    setControlHtmlToRender(<div>{`Show data for : ${layoutProps.selectedNodeInfo.node.Name}`}</div>);
                }
            }
            else if (layoutProps.featureId === FEnums.InventoryManagement || layoutProps.featureId === FEnums.InventoryConfiguration) {
                if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "site" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "inventory") {

                    setControlHtmlToRender(<DashboardChartContainerWithOverlay
                        selectedNode={layoutProps.selectedNodeInfo.node} isDashboard={false}
                        hideHeader={false} title='Dashboardchart'
                        uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId}
                        isSidebarOpen={layoutProps.isSidebarOpen}
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                        outputFormat={"jsx"} handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                } else if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "store"
                    || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "bin"
                    || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "manufacturer"
                    || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "eqtype") {
                    let nearestFloorNode: ITreeNode | null = layoutProps.selectedNodeInfo.node;


                    if (layoutProps.treeData && (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "bin"
                        || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "manufacturer"
                        || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "eqtype")) {
                        nearestFloorNode = FnFindNearestNodeByType(layoutProps.treeData, layoutProps.selectedNodeInfo.node, "Floor");
                    }
                    if (nearestFloorNode) {

                        const storeRefreshKey = layoutProps.selectedNodeInfo.node.refreshKey ?? "initial";
                        setControlHtmlToRender(<StoreDataContainer
                            // key={`store-device-container-${layoutProps.selectedNodeInfo.node.NodeEntID}-${storeRefreshKey}`}
                            key={`store-device-container-${nearestFloorNode.NodeEntID}-${storeRefreshKey}`}
                            uniqueName={"store-device-container"}
                            featureId={layoutProps.featureId}
                            treeData={layoutProps.treeData}
                            selectedNode={layoutProps.selectedNodeInfo.node}
                            selectedFloorNode={nearestFloorNode}
                            handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                    }
                }
                else if (layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "device"
                    || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceslot"
                    || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "port"
                    || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceview") {
                    setControlHtmlToRender(
                        <ErrorBoundary>
                            <DeviceViewContainer viewType="device" uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId} selectedNode={layoutProps.selectedNodeInfo.node} treeData={layoutProps.treeData} handleViewClick={handleViewClick} isSidebarOpen={layoutProps.isSidebarOpen} handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} isShowSidebarBtn={layoutProps.isShowSidebarBtn}
                                handleShowUserMessage={layoutProps.handleShowUserMessage} />
                        </ErrorBoundary>

                    )
                } else if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") {
                    setControlHtmlToRender(<MountedDeviceViewContainer
                        uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId}
                        selectedNode={layoutProps.selectedNodeInfo.node}
                        treeData={layoutProps.treeData} handleViewClick={handleViewClick}
                        isSidebarOpen={layoutProps.isSidebarOpen}
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                        handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                }
                else {
                    setControlHtmlToRender(<div>{`Show data for : ${layoutProps.selectedNodeInfo.node.Name}`}</div>);
                }
            }
            else if (layoutProps.featureId === FEnums.CloudCompute) {
                setControlHtmlToRender(<div>Show resources in cloud</div>)
            } else if (layoutProps.featureId === FEnums.DCMConsole) {
                dcmConsoleContext.setDCMConsole(<div className={`nz-layout-container-dcm-console`}>
                    <DcmConsole
                        uniqueName={"dcm-console"}
                        selectedNode={layoutProps.selectedNodeInfo?.node}
                        isShowSidebarBtn={true}
                        handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                    />
                </div>)
            }
            else if (layoutProps.featureId === FEnums.PowerBI) {
                const reportObj: IPowerBIReportProps = {
                    embedUrl: layoutProps.selectedNodeInfo.node.embedUrl,
                    embedToken: layoutProps.selectedNodeInfo.node.embedToken,
                    reportId: layoutProps.selectedNodeInfo.node.NodeEntID ?? "",
                    reportName: layoutProps.selectedNodeInfo.node.Name ?? "",
                    workspaceId: layoutProps.selectedNodeInfo.node.workspaceId ?? ""
                }

                if (layoutProps.selectedNodeInfo.node.NodeType === "Report") {
                    setControlHtmlToRender(<PowerBiReport {...reportObj} />)
                }
            }
            else if (layoutProps.featureId === FEnums.VirtualCompute) {
                setControlHtmlToRender(<div>Show resources in virtual compute</div>)
            }
            else if (layoutProps.featureId === FEnums.ModelBusinessService || layoutProps.featureId === FEnums.ManageBusinessService) {
                if (layoutProps.selectedExplorerNodeInfo?.node) {

                    setControlHtmlToRender(
                        <ErrorBoundary>
                            <BsDiagram uniqueName={layoutProps.uniqueName} selectedNode={layoutProps.selectedNodeForCustomization ?? layoutProps.selectedExplorerNodeInfo.node} handleSelectDCExplorer={layoutProps.selectDcExplorer}
                                headerText={"Dependency Hierarchy"}
                                handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} />
                        </ErrorBoundary>)
                }
                else {

                    if (layoutProps.showFloorLayout && layoutProps.selectedFloorNode && (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "location")) {
                        setControlHtmlToRender(
                            <ErrorBoundary>
                                <FloorLayoutContainer uniqueName={"floor-layour-container"}
                                    featureId={layoutProps.featureId} allowEdit={false}
                                    isFloorNode={layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" ? true : false}
                                    selectedNode={layoutProps.selectedNodeInfo.node}
                                    selectedFloorNode={layoutProps.selectedFloorNode}
                                    treeData={layoutProps.treeData}
                                    isSidebarOpen={layoutProps.isSidebarOpen}
                                    selectDcExplorer={layoutProps.selectDcExplorer}
                                    handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                    handleShowUserMessage={layoutProps.handleShowUserMessage} />
                            </ErrorBoundary>
                        )
                    }
                    else if (layoutProps.selectedFloorNode && (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "rack" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "device" || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceview" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice")) {

                        setControlHtmlToRender(
                            <DeviceFloorLayoutContainer
                                uniqueName={"device-floor-layour-container"}
                                selectedFloorNode={layoutProps.selectedFloorNode}
                                selectedNode={layoutProps.selectedNodeInfo.node}
                                treeData={layoutProps.treeData}
                                featureId={layoutProps.featureId}
                                isSidebarOpen={layoutProps.isSidebarOpen}
                                handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                selectDcExplorer={layoutProps.selectDcExplorer}
                                handleShowUserMessage={layoutProps.handleShowUserMessage} />
                        )
                    } else if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "site" || (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "room")) {
                        setControlHtmlToRender(<DashboardChartContainerWithOverlay selectedNode={layoutProps.selectedNodeInfo.node} isDashboard={false} hideHeader={false} title='Dashboardchart' uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId} isSidebarOpen={layoutProps.isSidebarOpen} handleSidebarOpenClose={layoutProps.handleSidebarOpenClose} outputFormat={"jsx"} handleShowUserMessage={layoutProps.handleShowUserMessage} />)
                    }
                }
            }
            else if (layoutProps.featureId === FEnums.AnalyticsAndCharts) {

                setControlHtmlToRender(<DashboardChartsContainer uniqueName={`feature-${layoutProps.featureId}`} featureId={layoutProps.featureId} selectedNode={layoutProps.selectedNodeInfo?.node} headerText={""} handleShowUserMessage={layoutProps.handleShowUserMessage} />)
            }
            else if (layoutProps.featureId === FEnums.SelectDataCenterSite && layoutProps.treeData && layoutProps.selectedNodeInfo && layoutProps.selectedNodeInfo.node) {
                setControlHtmlToRender(<GoogleMap
                    selectedNodeInfo={layoutProps.selectedNodeInfo.node}
                    isSiteByTenant={layoutProps.isSiteByTenant ?? "AllSites"}
                    selectDcExplorer={layoutProps.selectDcExplorer}
                    statusBarContext={statusBarContext}
                    handleShowUserMessage={layoutProps.handleShowUserMessage} />)
            }
            else if (layoutProps.featureId === FEnums.AuditSession) {

                if (layoutProps.showFloorLayout && layoutProps.selectedFloorNode && (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "location")) {
                    setControlHtmlToRender(
                        <ErrorBoundary>
                            <FloorLayoutContainer uniqueName={"floor-layour-container"}
                                featureId={layoutProps.featureId} allowEdit={false}
                                isFloorNode={layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "floor" ? true : false}
                                selectedNode={layoutProps.selectedNodeInfo.node}
                                selectedFloorNode={layoutProps.selectedFloorNode}
                                treeData={layoutProps.treeData}
                                isSidebarOpen={layoutProps.isSidebarOpen}
                                selectDcExplorer={layoutProps.selectDcExplorer}
                                handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                handleShowUserMessage={layoutProps.handleShowUserMessage} />
                        </ErrorBoundary>
                    )
                }
                else if (layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "rack" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "device" || layoutProps.selectedNodeInfo.node.treetype?.toLowerCase() === "deviceview" || layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") {

                    setControlHtmlToRender(
                        <ErrorBoundary>
                            <DeviceViewContainer viewType={layoutProps.selectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice" ? "mounted" : "device"} uniqueName={layoutProps.uniqueName} featureId={layoutProps.featureId} selectedNode={layoutProps.selectedNodeInfo.node}
                                isHideMountDeviceInView={true}
                                isSidebarOpen={layoutProps.isSidebarOpen}
                                handleSidebarOpenClose={layoutProps.handleSidebarOpenClose}
                                isShowSidebarBtn={layoutProps.isShowSidebarBtn}
                                handleShowUserMessage={layoutProps.handleShowUserMessage} />
                        </ErrorBoundary>
                    )
                }
                else {
                    setControlHtmlToRender(<div>{`Show data for : ${layoutProps.selectedNodeInfo.node.Name}`}</div>);
                }
            }
            else if (layoutProps.featureId === FEnums.InventoryCollection && layoutProps.selectedNodeInfo?.node && layoutProps.treeData && layoutProps.selectedNodeInfo?.node.NodeEntityname === "AuditSession") {

                setControlHtmlToRender(<div className="nz-wh-100 nz-audit-inventory-collection-grid">

                    <InventoryCollectionContainer
                        uniqueName={"inventory-collection-container"}
                        featureId={layoutProps.featureId}
                        treeData={layoutProps.treeData}
                        selectedNode={layoutProps.selectedNodeInfo.node}
                        tableToShow={"PG.AuditInventory"}
                        updateStatusBarData={layoutProps.updateStatusBarData}
                        handleShowUserMessage={layoutProps.handleShowUserMessage}
                        handleReloadTree={layoutProps.handleReloadTree}
                    />
                </div>);

            }
            else if (layoutProps.featureId === FEnums.InventoryReconciliation && layoutProps.selectedNodeInfo?.node && layoutProps.treeData && layoutProps.selectedNodeInfo?.node.NodeEntityname === "AuditSession") {
                setControlHtmlToRender(<InventoryReconciliationContainer
                    uniqueName={"inventory-reconciliation-container"}
                    featureId={layoutProps.featureId}
                    selectedNode={layoutProps.selectedNodeInfo.node}
                    tableToShow={"PG.AuditInventory"}
                    treeData={layoutProps.treeData}
                    headerToShow={`Inventory Reconciliation for ${layoutProps.selectedNodeInfo.node.Name}: ${layoutProps.selectedNodeInfo.node._Device ?? layoutProps.selectedNodeInfo.node._Location ?? layoutProps.selectedNodeInfo.node._Floor}`}
                    updateStatusBarData={layoutProps.updateStatusBarData}
                    handleShowUserMessage={layoutProps.handleShowUserMessage}
                    handleReloadTree={layoutProps.handleReloadTree}
                />)
            }
            else {
                setControlHtmlToRender(<div>{`Show data for : ${layoutProps.selectedNodeInfo.node.Name}`}</div>);
            }

        } else if (layoutProps.featureId === FEnums.DCMConsole) {
            dcmConsoleContext.setDCMConsole(<div className={`nz-layout-container-dcm-console`}>
                <DcmConsole uniqueName={"dcm-console"} selectedNode={layoutProps.selectedNodeInfo?.node} />
            </div>)
        }
        else if (layoutProps.featureId === FEnums.Dashboard) {
            setControlHtmlToRender(<DashboardChartsContainer uniqueName={`feature-${layoutProps.featureId}`} featureId={layoutProps.featureId} headerText={layoutProps.headerText ?? ""} handleShowUserMessage={layoutProps.handleShowUserMessage} />)
        }
        else if (layoutProps.featureId === FEnums.Configure && layoutProps.selectedFeatureItem) {
            setControlHtmlToRender(<AppqaSettingsProvider>
                <ErrorBoundary>
                    <AppqaSettings uniqueName={'configure'}
                        key={layoutProps.selectedFeatureItem.key}
                        featureId={layoutProps.featureId} allowShowHeader={false} headerText={""} selectedAppQAData={layoutProps.selectedFeatureItem} />
                </ErrorBoundary>
            </AppqaSettingsProvider>)

        }
        else {
            setControlHtmlToRender(<div className="nz-no-data-found">{`No data found to show`}</div>);
        }
        if (layoutProps.checkedNode) {
            checkedNodeRef.current = layoutProps.checkedNode
        } else {
            checkedNodeRef.current = null
        }
        if (layoutProps.selectedNodeInfo && layoutProps.selectedNodeInfo.node) {
            selectedNodeRef.current = layoutProps.selectedNodeInfo.node
        }
        if (layoutProps.featureId) {
            isFeatureIDChanged.current = layoutProps.featureId
        }

    }, [layoutProps.selectedNodeInfo,
    layoutProps.selectedNodeInfo?.node?.refreshKey,
    layoutProps.selectedExplorerNodeInfo,
    layoutProps.featureId,
    layoutProps.showFloorLayout,
    layoutProps.headerText,
    layoutProps.selectedSubGroupItemForMenu,
    layoutProps.defaultCheckedKeys,
    layoutProps.checkedNode,
    layoutProps.addToCableRtmSelect,
    layoutProps.selectedNodeForCustomization,
    layoutProps.selectedFloorNode,
    layoutProps.selectedKebabMenu,
    layoutProps.isShowSidebarBtn,
    layoutProps.selectedFeatureItem
    ])
    return (
        <div id='LayoutContainer' className="nz-layout-container">
            {layoutProps.featureId === FEnums.DCMConsole ? dcmConsoleContext.dcmConsole : controlHtmlToRender}
        </div>
    )
}
export { LayoutContainer }

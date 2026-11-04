import { JSX, useEffect, useRef, useState } from "react";
import { IDeleteContainer } from "../../allinterface/plan/IDeleteContainer";
import "../../allcss/plan/DeleteContainer.css";
import { handleContainerKeyDown } from "../../../shared/allcommon/basic/FnHandleContainerKeyDown";
import { OverlayTab } from "../../../shared/basic/overlaytab/OverlayTab";
import { IWorkorderRecord, SelectWorkorder } from "@n20a/libform";
import { IFnCreateWorkOrderApiCall } from "../../../appcontainer/allinterface/IFnCreateWorkOrderApiCalls";
import {
    FnAutoExecuteWorkOrder,
    FnCallApiForUpdateDeviceWoProfile,
    FnCreateWorkOrderApiCalls,
    FnGetWorkOrderProfile
} from "../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls";
import { IDialogActionBtn } from "../../../shared/allinterface/basic/IYesNoFormContainer";
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { FnNavigateToWorkOrder } from "../../../shared/allcommon/FnNavigateToWorkOrder";
import { IWorkorderProfileResponse } from "../../../shared/allinterface/plan/IPlacementExplorer";
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks";
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks";
import { useMainAppContext } from "../../../shared/context/hooks/MainAppHooks";
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";
import { FnFindNearestNodeByType } from "../../../shared/allcommon/FnFindNearestNodeByType";
import ErrorBoundary from "../../../shared/errorboundary/ErrorBoundary";
import FloorLayoutContainer from "../../dc/floorlayoutcontainer/FloorLayoutContainer";
import DeviceViewContainer from "../../../shared/deviceview/deviceviewcontainer/DeviceViewContainer";
import { MountedDeviceViewContainer } from "../../../shared/deviceview/mounteddeviceviewcontainer/MountedDeviceViewContainer";
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage";
import { OpenSidebar24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import DashboardChartContainerWithOverlay from "../../../shared/charts/dashboardchartcontainerwithoverlay/DashboardChartContainerWithOverlay";

const tabs = [
    {
        label: "Work order",
        tooltip: "Create workorder to Delete"
    }
];

const DeleteContainer = (props: IDeleteContainer) => {
    const containerDivRef = useRef<HTMLDivElement | null>(null);
    const [selectedTabs, setSelectedTabs] = useState<string>("");
    const [showOkButton, setShowOkButton] = useState<boolean>(false);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
    const [customButtons, setCustomButtons] = useState<IDialogActionBtn[]>();
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [showSelectWorkorder, setShowSelectWorkorder] = useState<boolean>(false);
    const [workorderRecords, setWorkorderRecords] = useState<IWorkorderRecord[]>([]);
    const [createWorkOrderPayload, setCreateWorkOrderPayload] = useState<IFnCreateWorkOrderApiCall>();
    const [controlHtmlToRender, setControlHtmlToRender] = useState<JSX.Element | null>(null);

    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();

    const handleViewClick = (entID: string) => {
        if (props.selectDcExplorer) {
            if (props.selectedNodeInfo && props.selectedNodeInfo.node && props.selectedNodeInfo.node.NodeEntID !== entID) {
                props.selectDcExplorer(undefined, undefined, undefined, entID);
            }
        }
    };

    const handleSidebarToggle = () => {
        if (props.handleSidebarClose) {
            props.handleSidebarClose();
        } else if (props.handleSidebarOpenClose) {
            props.handleSidebarOpenClose(props.isSidebarOpen ? "close" : "open");
        }
    };

    // Render controls based on selected node, referencing LayoutContainer logic
    useEffect(() => {
        if (!props.selectedNodeInfo || !props.selectedNodeInfo.node) {
            setControlHtmlToRender(
                <div className="nz-message-layout">Select a node to display</div>
            );
            return;
        }

        const selectedNode = props.selectedNodeInfo.node;
        let nearestFloorNode: ITreeNode | null = null;
        if (props.treeData) {
            nearestFloorNode = FnFindNearestNodeByType(props.treeData, selectedNode, "Floor");
        }
        const effectiveFloorNode = props.selectedFloorNode ?? nearestFloorNode ?? undefined;

        const nodeType = selectedNode.NodeType?.toLowerCase();
        const treeType = selectedNode.treetype?.toLowerCase();

        if (props.showFloorLayout && effectiveFloorNode && (nodeType === "floor" || nodeType === "location")) {
            setControlHtmlToRender(
                <ErrorBoundary>
                    <FloorLayoutContainer
                        uniqueName={`${props.uniqueName}-floor-layout`}
                        allowEdit={false}
                        selectedFloorNode={effectiveFloorNode}
                        selectedNode={selectedNode}
                        isFloorNode={nodeType === "floor"}
                        treeData={props.treeData}
                        featureId={props.featureId}
                        hideHeader={true}
                        isSidebarOpen={props.isSidebarOpen}
                        selectDcExplorer={props.selectDcExplorer}
                        handleShowUserMessage={props.handleShowUserMessage}
                        handleSidebarOpenClose={props.handleSidebarOpenClose}
                    />
                </ErrorBoundary>
            );
        } else if (treeType === "device") {
            setControlHtmlToRender(
                <ErrorBoundary>
                    <DeviceViewContainer
                        viewType="device"
                        uniqueName={`${props.uniqueName}-device-view`}
                        featureId={props.featureId}
                        selectedNode={selectedNode}
                        treeData={props.treeData}
                        hideHeader={true}
                        handleViewClick={handleViewClick}
                        isSidebarOpen={props.isSidebarOpen}
                        handleSidebarOpenClose={props.handleSidebarOpenClose}
                        isShowSidebarBtn={props.isShowSidebarBtn}
                        handleShowUserMessage={props.handleShowUserMessage}
                    />
                </ErrorBoundary>
            );
        } else if (nodeType === "mounteddevice") {
            setControlHtmlToRender(
                <MountedDeviceViewContainer
                    uniqueName={`${props.uniqueName}-mounted-device-view`}
                    featureId={props.featureId}
                    selectedNode={selectedNode}
                    treeData={props.treeData}
                    hideHeader={true}
                    handleViewClick={handleViewClick}
                    isSidebarOpen={props.isSidebarOpen}
                    handleSidebarOpenClose={props.handleSidebarOpenClose}
                    handleShowUserMessage={props.handleShowUserMessage}
                />
            );
        } else if (nodeType === "site" || nodeType === "room") {
            setControlHtmlToRender(
                <DashboardChartContainerWithOverlay
                    selectedNode={selectedNode}
                    isDashboard={false}
                    hideHeader={true}
                    title="Dashboardchart"
                    uniqueName={`${props.uniqueName}-chart`}
                    featureId={props.featureId}
                    isSidebarOpen={props.isSidebarOpen}
                    handleSidebarOpenClose={props.handleSidebarOpenClose}
                    outputFormat={"jsx"}
                    handleShowUserMessage={props.handleShowUserMessage}
                />
            );
        } else {
            setControlHtmlToRender(
                <div className="nz-message-layout">{`Show data for : ${selectedNode.Name ?? ""}`}</div>
            );
        }
    }, [
        props.selectedNodeInfo,
        props.selectedFloorNode,
        props.showFloorLayout,
        props.treeData,
        props.isSidebarOpen,
        props.isShowSidebarBtn,
        props.featureId,
        props.uniqueName
    ]);

    // Overlay tab config for Generate Workorder
    const getTabsDetails = () => {
        return tabs.map((t, index) => ({
            uniqueName: `${props.uniqueName}-overlay-tab-${index}`,
            label: {
                uniqueName: `${props.uniqueName}-overlay-tab-${index}-label`,
                label: t.label,
                tooltip: t.tooltip
            },
            w: "auto",
            h: "calc(var(--node_height) - var(--spacing-1))",
            actionCode: t.label,
            handleMouse: function (): void { }
        }));
    };

    // Handler when tab is selected
    const handleSelectedTabs = async (tab: string[]) => {
        if (tab.length) {
            setSelectedTabs(tab[0]);
            if (tab[0] === "Generate Workorder" || tab[0] === "Work order" || tab[0] === "Work Order") {
                if (props.selectedNodeInfo?.node) {
                    const selectedNode = props.selectedNodeInfo.node;
                    const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext);
                    setWorkorderRecords(workOrderProfile);
                    setShowSelectWorkorder(true);

                    setCreateWorkOrderPayload({
                        treeData: props.treeData,
                        sourceNodeEntID: selectedNode.NodeEntID ?? "",
                        sourceNodeName: selectedNode.Name ?? "",
                        sourceNodeType: selectedNode.NodeType ?? "",
                        EntityName: "WorkorderProfile",
                        WorkorderType: "Delete",
                        action: "Delete",
                        SeqNo: 1,
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        _WorkOrderProfile: undefined,
                        ParentEntityName: selectedNode.NodeEntityname ?? "",
                        ParentID: selectedNode.NodeEntID ?? "",
                        sourceTreeData: props.treeData,
                        extraSouceObj: {
                            MountedDeviceEntID: selectedNode.MountedDeviceID,
                            MountedDeviceName: selectedNode.MountedDeviceID ? selectedNode.Name : "",
                            NodeEntID: selectedNode.NodeEntID ?? "",
                            NodeEntityname: selectedNode.NodeEntityname ?? "",
                            Name: selectedNode.Name ?? ""
                        }
                    });
                } else {
                    props.handleShowUserMessage?.("Please select a node to generate delete workorder.");
                }
            }
        } else {
            setSelectedTabs("");
        }
    };

    // Workorder selection and execution
    const handleSelectWorkorder = async (workorderId: string) => {
        try {
            const findWorkOrder = workorderRecords.find(x => x._Workorder === workorderId);
            if (createWorkOrderPayload) {
                const payload: IFnCreateWorkOrderApiCall = {
                    ...createWorkOrderPayload,
                    _WorkOrderProfile: findWorkOrder ? [findWorkOrder] : undefined
                };
                const result = await FnCreateWorkOrderApiCalls(payload);

                if (result) {
                    function getWorkorderProfileName(data: unknown): string | null {
                        if (!data || typeof data !== "object") return null;
                        const response = data as IWorkorderProfileResponse;
                        const firstProfile = response.workorderProfile?.[0];
                        if (!firstProfile || typeof firstProfile !== "object") return null;
                        return firstProfile._WorkorderProfile ?? null;
                    }

                    const woProfileName = getWorkorderProfileName(result);
                    if (createWorkOrderPayload.sourceNodeEntID && createWorkOrderPayload.sourceNodeName && woProfileName) {
                        FnCallApiForUpdateDeviceWoProfile(
                            createWorkOrderPayload.sourceNodeEntID,
                            woProfileName,
                            statusBarContext
                        );
                    }

                    setShowSelectWorkorder(false);
                    setWorkorderRecords([]);

                    if (mainAppContext.autoExecuteWorkorder) {
                        const actions: IDialogActionBtn[] = [
                            {
                                label: "No",
                                onClick: () => {
                                    setShowOkButton(false);
                                    setDeleteOpen(false);
                                    setConfirmMessage("");
                                    setCustomButtons(undefined);
                                    props.handleReloadTree?.(props.featureId, createWorkOrderPayload.sourceNodeEntID);
                                }
                            },
                            {
                                label: "Yes",
                                onClick: async () => {
                                    if (woProfileName) {
                                        await FnAutoExecuteWorkOrder(woProfileName, statusBarContext);
                                    }
                                    setShowOkButton(false);
                                    setDeleteOpen(false);
                                    setConfirmMessage("");
                                    setCustomButtons(undefined);
                                    props.handleReloadTree?.(props.featureId, createWorkOrderPayload.sourceNodeEntID);
                                },
                                autoFocus: true
                            },
                            {
                                label: "Workorders",
                                onClick: () => {
                                    if (woProfileName) {
                                        FnNavigateToWorkOrder(woProfileName, statusBarContext.userSessionId, sessionContext.SessionList);
                                    }
                                },
                                className: "highlight-btn"
                            }
                        ];
                        setCustomButtons(actions);
                        setConfirmMessage(`Workorder (${woProfileName}) is ${workorderId ? "append" : "created"} successfully.\nWould you like to auto execute workorder: ${woProfileName}? `);
                        setDeleteOpen(true);
                    } else {
                        setShowOkButton(true);
                        setConfirmMessage(`Workorder (${woProfileName}) is ${workorderId ? "append" : "created"} successfully.`);
                        setDeleteOpen(true);
                    }
                }
            }
        } catch (error) {
            console.error("error in handleSelectWorkorder", error);
        }
    };

    return (
        <div
            id="DeleteContainerDiv"
            ref={containerDivRef}
            className="nz-delete-container nz-delete-container-div"
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
        >
            <div className="nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header">
                <div className="nz-d-flex-row nz-align-center nz-w-100">
                    <OverlayTab
                        uniqueName={`${props.uniqueName}-overlay`}
                        tabs={getTabsDetails()}
                        allowUnSelect={true}
                        selectedTabName={selectedTabs}
                        tabAlignment={"horizontal"}
                        headerText={props.selectedNodeInfo?.node?.Name ? `Delete: ${props.selectedNodeInfo.node.Name}` : "Delete"}
                        useContainer={false}
                        handleSelectedTab={handleSelectedTabs}
                        ShowOnlyIcon={true}
                    />
                </div>
                {!props.hideSidebarBtn && !props.hideSideBarCloseBtn && (
                    <ActionImage
                        uniqueName={`${props.uniqueName}-explorer-tree-info-ai`}
                        image={{
                            uniqueName: `${props.uniqueName}-explorer-tree-info-image`,
                            source: (
                                <OpenSidebar24x24
                                    size={FnGetCssVariable("--image-size-2")}
                                    fill="none"
                                    strokeWidth={1}
                                />
                            ),
                            w: "var(--image-size-2)",
                            tooltip: "Click to view node details in sidebar",
                            type: "svg"
                        }}
                        w={"var(--node_height)"}
                        h={"var(--node_height)"}
                        actionCode={"information"}
                        handleMouse={handleSidebarToggle}
                    />
                )}
            </div>

            <div className="nz-delete-controls-container">
                {controlHtmlToRender}
            </div>

            <YesNoFormContainer
                isOpen={deleteOpen}
                uniqueName={props.uniqueName}
                message={confirmMessage}
                showOkButton={showOkButton}
                buttons={customButtons}
                handleNoButtonClick={() => {
                    setDeleteOpen(false);
                }}
                handleOkButtonClick={() => {
                    setDeleteOpen(false);
                    setShowOkButton(false);
                    props.handleReloadTree?.(props.featureId, createWorkOrderPayload?.sourceNodeEntID);
                }}
            />

            {showSelectWorkorder && (
                <div className="nz-dialog-overlay">
                    <div
                        className="nz-wo-dialog-container"
                        style={{ width: "100%", height: 500, overflow: "auto" }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <SelectWorkorder
                            workorderRecords={workorderRecords}
                            onSelect={handleSelectWorkorder}
                            onCancel={() => {
                                setShowSelectWorkorder(false);
                                setWorkorderRecords([]);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export { DeleteContainer };

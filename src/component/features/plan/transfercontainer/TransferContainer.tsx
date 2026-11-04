
import { useEffect, useState } from 'react'
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { EXPLORER } from '../../../shared/interceptors/EndPoints';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { IConvertedTreeResponse, IFeatureTree, ITreeForHierarchicalDataContainer } from '../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer';
import { ISelectedNodeInfo, ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { FnConvertHierarchicalDataToTree } from '../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree';
import { Key } from 'rc-tree/lib/interface';
import { ITransferContainer } from '../../allinterface/plan/ITransferContainer';
import '../../allcss/plan/TransferContainer.css'
import { TreeForHierarchicalDataContainer } from '../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer';
import { OverlayTab } from '../../../shared/basic/overlaytab/OverlayTab';
import { Label } from '../../../shared/basic/label/Label';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { IWorkorderRecord, SelectWorkorder } from '@n20a/libform';
import { IFnCreateWorkOrderApiCall } from '../../../appcontainer/allinterface/IFnCreateWorkOrderApiCalls';
import { FnAutoExecuteWorkOrder, FnCallApiForUpdateDeviceWoProfile, FnCreateWorkOrderApiCalls, FnGetWorkOrderProfile } from '../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls';
import { IDialogActionBtn } from '../../../shared/allinterface/basic/IYesNoFormContainer';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { FnNavigateToWorkOrder } from '../../../shared/allcommon/FnNavigateToWorkOrder';
import { IWorkorderProfileResponse } from '../../../shared/allinterface/plan/IPlacementExplorer';
import { FnFindNodeAndParents } from '../../../shared/allcommon/tablegrid/FnFindNodeAndParents';

const tabs = [
    {
        "label": "Work order",
        "tooltip": "Click to create a Transfer Workorder"
    },
]

const TransferContainer = (props: ITransferContainer) => {
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [dataCenterHierarchyApiData, setDataCenterHierarchyApiData] = useState<unknown>();
    const [treeForHierarchicalDataContainerProps, setTreeForHierarchicalDataContainerProps] = useState<ITreeForHierarchicalDataContainer>()
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [selectedTabs, setSelectedTabs] = useState<string>('');
    const [showOkButton, setShowOkButton] = useState<boolean>(false);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
    const [customButtons, setCustomButtons] = useState<IDialogActionBtn[]>();
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [showSelectWorkorder, setShowSelectWorkorder] = useState<boolean>(false);
    const [workorderRecords, setWorkorderRecords] = useState<IWorkorderRecord[]>([]);
    const [createWorkOrderPayload, setCreateWorkOrderPayload] = useState<IFnCreateWorkOrderApiCall>();

    const statusbarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();

    // Load datacenter hierarchy API and initialize tree container props.
    useEffect(() => {
        // Request hierarchy JSON and store parsed response for tree build.
        const handleGetDataCenterHierarchy = () => {
            let featureTreedataCenterHierarchyProps: IFeatureTree = {
                instanceName: "datacenter_hierarchy_treeview",
                hideKebabMenu: false,
                allowCheckbox: false,
                allowIcon: true,
                isAllowDrag: false,
                hideCopyIcon: false,
                reuseFromCache: false,
                isAllowDrop: false,
                allowInternalDrag: true,
                openAllNodes: false,
                allowCheckStrictly: false,
            };

            setTreeForHierarchicalDataContainerProps({
                uniqueName: `${props.uniqueName}-tree`, // Unique identifier
                apiData: null, // Flat API data
                featureId: props.featureId, // Feature ID
                featureTreeProps: featureTreedataCenterHierarchyProps, // Tree control properties
                allowGenerateTreeData: false, // indicates whether need to generate treedata from API data
                defaultExpandedKeys: [], // default expanded keys to set if already tree data generated
                defaultSelectedKeys: [], // default selected keys to set if already tree data generated
                defaultCheckedKeys: [], // default checked keys to set if already tree data generated
                defaultSelectedNodeInfo: undefined, // default selected node set if needed
                isSiteByTenant: false, // Enables tenant-specific hierarchy
                isFloorTree: false, // Indicates this is not a Floor Pane tree
                allowAPICallOnExpand: false, // Enables API calls on node expansion
                allowAdd: false, // Allows adding new nodes
                allowEdit: false, // Allows editing nodes
                allowDelete: false, // Allows deleting nodes
                disableAdd: true, // disable adding new nodes
                disableEdit: false, // disable editing nodes
                disableDelete: false, // disable deleting nodes
                allowMultiple: true, // Allows multiple selections
                className: "tree-container", // Custom CSS class
                selectedNodeExplorer: undefined, // Selected node data
            });
            // Parse hierarchy API response and update tree source data.
            const handleDataCenterHierarchyApiResponse = (dataCenterHierarchyApiResponse: unknown, status?: string) => {
                if (status === "200" &&
                    dataCenterHierarchyApiResponse &&
                    typeof dataCenterHierarchyApiResponse === "object" &&
                    "hierarchyJson" in dataCenterHierarchyApiResponse
                ) {
                    const response = dataCenterHierarchyApiResponse as {
                        hierarchyJson?: string;
                    };
                    if (typeof response.hierarchyJson === "string") {
                        try {
                            const parsedData = JSON.parse(response.hierarchyJson);
                            setDataCenterHierarchyApiData(parsedData);
                        } catch (error) {
                            // Ignore malformed hierarchy payload and keep previous state.
                            console.error("Invalid hierarchyJson response", error);
                        }
                    }
                }
            }
            axiosInterceptor({
                url: EXPLORER.DatacenterHierarchy,
                data: {},
                setFetchData: handleDataCenterHierarchyApiResponse
            }, statusbarContext)
        }
        handleGetDataCenterHierarchy();
    }, [])
    // Build tree nodes when hierarchy data and tree props are ready.
    useEffect(() => {
        if (treeForHierarchicalDataContainerProps && dataCenterHierarchyApiData) {
            FnConvertHierarchicalDataToTree(dataCenterHierarchyApiData, treeForHierarchicalDataContainerProps).then(
                (result: IConvertedTreeResponse | undefined) => {
                    if (result) {

                        setTreeData(result.treeData);
                        setDefaultExpandedKeys(result.expandedKeys);
                        if (result.selectedKey) {

                            setDefaultSelectedKeys([result.selectedKey]);
                            result.selectedNode &&
                                setDefaultSelectedNodeInfo({
                                    event: "select",
                                    selected: true,
                                    node: result.selectedNode,
                                    selectedNodes: [result.selectedNode],
                                });
                        }
                    }
                    else {
                        setTreeData([])
                    }
                }
            );
        }
    }, [treeForHierarchicalDataContainerProps, dataCenterHierarchyApiData]);

    // Sync selected and expanded keys when user picks a datacenter tree node.
    const handleDataCenterSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]): void => {
        setDefaultExpandedKeys(expandedKeys);
        setDefaultSelectedNodeInfo(info);
        setDefaultSelectedKeys([info.node.key]);
    }

    // handler to get tab details
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
            handleMouse: function (event: any, actionCode?: string): void {
                // add logic here if needed
            }
        }));
    };

    // Helper to check if the selected device is a floor device (not mounted in a rack/ru/slot)
    const isFloorDeviceNode = (selectedNode: ITreeNode): boolean => {
        if (!selectedNode) return false;

        // If explicitly flagged as mounted, it's not a floor device
        if (
            selectedNode.NodeType?.toLowerCase() === "mounteddevice" ||
            selectedNode.treetype?.toLowerCase() === "mounteddevice"
        ) {
            return false;
        }
        return true;
    };

    // handler for tab selection
    const handleSelectedTabs = async (tab: string[]) => {
        if (tab.length) {
            setSelectedTabs(tab[0]);
            if (tab[0] === "Work order" || tab[0] === "Work Order") {
                if (props.selectedNodeInfo?.node && defaultSelectedNodeInfo?.node) {
                    const isFloorDevice = isFloorDeviceNode(props.selectedNodeInfo.node);
                    const action = isFloorDevice ? "Move Floor Device to Floor" : "Move Device to Floor";
                    const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusbarContext);
                    setWorkorderRecords(workOrderProfile);
                    setShowSelectWorkorder(true);
                    setCreateWorkOrderPayload({
                        treeData: treeData,
                        sourceTreeData: props.treeData,
                        sourceNodeEntID: props.selectedNodeInfo.node.NodeEntID ?? "",
                        sourceNodeName: props.selectedNodeInfo.node.Name ?? "",
                        sourceNodeType: props.selectedNodeInfo.node.NodeType ?? "",
                        EntityName: "WorkorderProfile",
                        WorkorderType: "Transfer",
                        action: action,
                        isFloorDevice: isFloorDevice,
                        SeqNo: 1,
                        sessionContext: sessionContext,
                        statusBarContext: statusbarContext,
                        _WorkOrderProfile: undefined,
                        ParentEntityName: props.selectedNodeInfo.node.NodeEntityname ?? "",
                        ParentID: props.selectedNodeInfo.node.NodeEntID ?? "",
                        destNodeEntityname: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
                        destNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                        networkPort: props.selectedNodeInfo.node.HasNetworkPorts ?? 0,
                        powerPort: props.selectedNodeInfo.node.HasPowerPorts ?? 0,
                    });
                } else if (!props.selectedNodeInfo?.node) {
                    props.handleShowUserMessage?.("Please select a device to transfer.");
                }
            }
        } else {
            setSelectedTabs('');
        }
    };

    // Create workorder from selection and handle auto-execution
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
                    // Extract workorder profile name from create API response.
                    function getWorkorderProfileName(data: unknown): string | null {
                        if (!data || typeof data !== "object") return null;
                        const response = data as IWorkorderProfileResponse;
                        const firstProfile = response.workorderProfile?.[0];
                        if (!firstProfile || typeof firstProfile !== "object") return null;
                        return firstProfile._WorkorderProfile ?? null;
                    }

                    if (createWorkOrderPayload.sourceNodeEntID && createWorkOrderPayload.sourceNodeName) {
                        FnCallApiForUpdateDeviceWoProfile(
                            createWorkOrderPayload.sourceNodeEntID,
                            getWorkorderProfileName(result) ?? "",
                            statusbarContext
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
                                    // Call the API to auto execute the workorder
                                    await FnAutoExecuteWorkOrder(getWorkorderProfileName(result) ?? "", statusbarContext);
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
                                    const name = getWorkorderProfileName(result);
                                    if (name) {
                                        FnNavigateToWorkOrder(name, statusbarContext.userSessionId, sessionContext.SessionList);
                                    }
                                },
                                className: "highlight-btn"
                            }
                        ];
                        setCustomButtons(actions);
                        setConfirmMessage(`Workorder (${getWorkorderProfileName(result)}) is ${workorderId ? "append" : "created"} successfully. 
Would you like to auto execute workorder: ${getWorkorderProfileName(result)}? `);
                        setDeleteOpen(true);
                    } else {
                        setShowOkButton(true);
                        setConfirmMessage(`Workorder (${getWorkorderProfileName(result)}) is ${workorderId ? "append" : "created"} successfully.`);
                        setDeleteOpen(true);
                    }
                }
            }
        } catch (error) {
            console.error("error in handleSelectWorkorder", error);
        }
    };

    return (
        <div className='nz-transfer-container' tabIndex={1} onKeyDown={handleContainerKeyDown}>
            <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                <div className="nz-d-flex-row nz-align-center nz-w-100">
                    {defaultSelectedNodeInfo?.node?.NodeType?.toLowerCase() === "floor" ? (
                        <OverlayTab
                            uniqueName={`${props.uniqueName}-replacement-overlay`}
                            tabs={getTabsDetails()}
                            allowUnSelect={true}
                            selectedTabName={selectedTabs}
                            tabAlignment={"horizontal"}
                            headerText={`Data Centers`}
                            useContainer={false}
                            handleSelectedTab={handleSelectedTabs}
                            ShowOnlyIcon={true}
                        />
                    ) : (
                        <Label
                            uniqueName={`${props.uniqueName}-pane1-header`}
                            label={`Data Centers`}
                        />
                    )}
                </div>
            </div>
            {treeData && treeForHierarchicalDataContainerProps && (
                <TreeForHierarchicalDataContainer
                    {...treeForHierarchicalDataContainerProps}
                    apiData={treeData}
                    defaultExpandedKeys={defaultExpandedKeys}
                    defaultSelectedKeys={defaultSelectedKeys}
                    defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                    handleNodeSelect={handleDataCenterSelect}
                />
            )}
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
                        className="nz-wo-dialog-container "
                        style={{ width: '100%', height: 500, overflow: 'auto' }}
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
        </div >
    )
}
export { TransferContainer }
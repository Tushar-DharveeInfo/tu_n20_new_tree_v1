import { Suspense, useEffect, useRef, useState } from 'react'
import '../../allcss/plan/PlacementExplorer.css'
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor'
import { EM } from '../../../shared/interceptors/EndPoints'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks'
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer'
import { Label } from '../../../shared/basic/label/Label'
import { FloorLayoutContainer } from '../../../appcontainer/layoutcontainer/LayoutContainer'
import { Loader } from '../../../shared/loader/Loader'
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks'
import { IInboundLocation, IPlacementExplorer, IPlacementOverlayPayload, IWorkorderProfileResponse } from '../../../shared/allinterface/plan/IPlacementExplorer'
import { FnFindNodeAndParents } from '../../../shared/allcommon/tablegrid/FnFindNodeAndParents'
import { ITreeNode } from '../../../shared/allinterface/tree/ITreeControl'
import { IWorkorderRecord, SelectWorkorder } from '@n20a/libform'
import { IFnCreateWorkOrderApiCall } from '../../../appcontainer/allinterface/IFnCreateWorkOrderApiCalls'
import { FnAutoExecuteWorkOrder, FnCallApiForUpdateDeviceWoProfile, FnCreateWorkOrderApiCalls, FnGetWorkOrderProfile } from '../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls'
import { IPlacementDevice } from '../../../shared/allinterface/plan/IEditFloorLayout'
import { usePlacementContext } from '../../../shared/context/hooks/PlacementHooks'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks'
import { IDialogActionBtn } from '../../../shared/allinterface/basic/IYesNoFormContainer'
import { FnNavigateToWorkOrder } from '../../../shared/allcommon/FnNavigateToWorkOrder'
import ErrorBoundary from '../../../shared/errorboundary/ErrorBoundary'
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage'
import { OpenSidebar24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { FEnums } from '../../../constants/Feature'

const formatRUWithHash = (ruStr?: string): string => {
    if (!ruStr) return "";
    const firstPart = ruStr.split(",")[0].trim();
    const match = firstPart.match(/\d+/);
    if (match) {
        return `RU#${match[0]}`;
    }
    return firstPart.startsWith("RU#") ? firstPart : `RU#${firstPart.replace(/^RU\s*/i, "").trim()}`;
};

const findSlotEntIdFromTree = (treeData: ITreeNode[], rackEntId: string, ruStr: string): string | undefined => {
    const numMatch = ruStr.match(/\d+/);
    const ruNumber = numMatch ? parseInt(numMatch[0], 10) : undefined;
    const rackNodes = FnFindNodeAndParents(treeData, rackEntId);
    const rackNode = rackNodes && rackNodes.length > 0 ? rackNodes[rackNodes.length - 1] : undefined;
    if (!rackNode) return undefined;

    const target1 = `ru#${ruNumber}`;
    const target2 = `ru ${ruNumber}`;
    const target3 = `ru#0${ruNumber}`;

    const searchChildren = (nodes?: ITreeNode[]): string | undefined => {
        if (!nodes?.length) return undefined;
        for (const child of nodes) {
            const name = (child.Name || (typeof child.title === "string" ? child.title : "")).trim().toLowerCase();
            const idx = Number((child as any).SlotIndex ?? (child as any).SlotMountIndex ?? (child as any).MountPosition ?? (child as any).RU);
            if (
                name === target1 ||
                name === target2 ||
                name === target3 ||
                (ruNumber !== undefined && idx === ruNumber)
            ) {
                return (child.EntID || (child as any).EntId || child.key)?.toString();
            }
            const foundInChild = searchChildren(child.children);
            if (foundInChild) return foundInChild;
        }
        return undefined;
    };

    return searchChildren(rackNode.children);
};

const PlacementExplorer = (props: IPlacementExplorer) => {
    const [overlayButtonForDevice, setOverlayButtonForDevice] = useState<{ label: string, tooltip: string }[]>([]);
    const [selectedRU, setSelectedRU] = useState<string>("")
    const selectedRuPositionsRef = useRef<string>("")
    const [selectedSlotEntID, setSelectedSlotEntID] = useState<string>("")
    const [showOkButton, setShowOkButton] = useState<boolean>(false)
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [customButtons, setCustomButtons] = useState<IDialogActionBtn[]>();
    const [confirmMessage, setConfirmMessage] = useState("");
    const [showSelectWorkorder, setShowSelectWorkorder] = useState<boolean>(false);
    const [workorderRecords, setWorkorderRecords] = useState<IWorkorderRecord[]>([]);
    const [createWorkOrderPayload, setCreateWorkOrderPayload] = useState<IFnCreateWorkOrderApiCall>();
    const [payloadForPlacement, setPayloadForPlacement] = useState<IPlacementOverlayPayload>();
    const [selectedDataForPlacement, setSelectedDataForPlacement] = useState<IPlacementDevice>();
    const [floorLayoutRefreshKey, setFloorLayoutRefreshKey] = useState<number>(0);

    const handleReload = (entID?: string) => {
        if ((props.featureId === FEnums.AssetPlacement || props.featureId === FEnums.InboundAssetPlacement) && placementContext.lastSelectedInboundLocation?.RUPos) {
            setSelectedRU(formatRUWithHash(placementContext.lastSelectedInboundLocation.RUPos.toString()));
            selectedRuPositionsRef.current = placementContext.lastSelectedInboundLocation.RUPos.toString();
            setSelectedSlotEntID(placementContext.lastSelectedInboundLocation.EntID || "");
            setOverlayButtonForDevice([{ label: "Optout", tooltip: "Click to remove placement" }]);
        } else {
            setSelectedRU('');
            selectedRuPositionsRef.current = "";
            setSelectedSlotEntID('');
            setOverlayButtonForDevice([]);
        }
        setFloorLayoutRefreshKey(prev => prev + 1);
        props.handleReloadTree?.(props.featureId, entID);
    };

    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const placementContext = usePlacementContext();



    // Handle device opt-in flow or chained opt-out delete API calls.
    async function handleOverlayButtonForDeviceClick(buttonName: string, payload?: IPlacementOverlayPayload, selectedPlacement?: IPlacementDevice) {
        try {
            if (selectedPlacement && props.treeData && payload) {
                // Build parent node name map from rack entity ID for opt-in payload.
                const FnReturnNodeNameObject = async (
                    treeData: ITreeNode[],
                    id: string
                ): Promise<Record<string, string>> => {
                    const selectedRackparentNode = FnFindNodeAndParents(treeData, id);
                    const obj: Record<string, string> = {};
                    if (selectedRackparentNode) {
                        for (const ele of selectedRackparentNode) {
                            if (ele?.NodeType && ele?.Name) {
                                obj[ele.NodeType] = ele.Name;
                            }
                        }
                    }
                    return obj;
                };

                const selectedDCprents = await FnReturnNodeNameObject(props.treeData, payload.NodeEntID ?? "")
                if (buttonName === "Optin") {
                    const ruWithHash = formatRUWithHash(selectedRU);
                    if (payload && ruWithHash) {
                        const currentPath = payload.NodePath ?? "";
                        const parts = currentPath.split("->").map(p => p.trim()).filter(Boolean);
                        const lastPart = parts.length > 0 ? parts[parts.length - 1] : "";
                        const hasRuInLast = /^ru(#|\s|\d|$)/i.test(lastPart);
                        if (!hasRuInLast) {
                            payload.NodePath = currentPath
                                ? `${currentPath.replace(/->\s*$/, "").trim()}->${ruWithHash}`
                                : ruWithHash;
                        }
                    }

                    const payloadApi = {
                        ...selectedDCprents,
                        RUPos: ruWithHash || selectedRU,
                        EntID: selectedPlacement.EntId,
                        EntityName: selectedPlacement.EntityName
                    }
                    const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
                    setWorkorderRecords(workOrderProfile);
                    setShowSelectWorkorder(true);
                    setPayloadForPlacement(payloadApi);
                    setSelectedDataForPlacement(selectedPlacement)

                    const sourceEntId = selectedPlacement.EntId || props.selectedNodeExplorer?.node?.NodeEntID || props.selectedNodeExplorer?.node?.EntID || "";
                    const slotsNeeded = Number(props.selectedNodeExplorer?.node?.SlotsNeeded ?? selectedPlacement.RURequired) || 1;
                    const destSlotEntId = selectedSlotEntID || (props.treeData && payload?.NodeEntID && ruWithHash ? findSlotEntIdFromTree(props.treeData, payload.NodeEntID, ruWithHash) : undefined);

                    setCreateWorkOrderPayload({
                        treeData: props.treeData,
                        sourceNodeEntID: selectedPlacement.EntId,
                        sourceNodeName: selectedPlacement.Name,
                        EntityName: "WorkorderProfile",
                        WorkorderType: props.featureId === FEnums.Relocate ? "Relocate" : "Placement",
                        action: props.featureId === FEnums.Relocate ? "Move Device Slot to Slot" : "Move Device Floor to Slot",
                        SeqNo: 1,
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        _WorkOrderProfile: undefined,
                        ParentEntityName: payload.NodeEntityname,
                        ParentID: payload.NodeEntID,
                        RUPosition: ruWithHash || selectedRU,
                        destNodeEntityname: payload.NodeEntityname,
                        destNodeEntID: payload.NodeEntID,
                        destNodePath: payload.NodePath,
                        extraSouceObj: {
                            ...(props.selectedNodeExplorer?.node?.DevicePathObject ?? {}),
                            ...((props.featureId === FEnums.AssetPlacement || props.featureId === FEnums.InboundAssetPlacement) ? {
                                EntId: sourceEntId,
                                moduleDeviceID: sourceEntId,
                                slotsNeeded: slotsNeeded
                            } : {})
                        },
                        extraDestObj: {
                            ...(destSlotEntId ? { EntId: destSlotEntId, SlotID: destSlotEntId, RackEntId: payload?.NodeEntID } : {}),
                            ...(ruWithHash ? {
                                RU: ruWithHash
                            } : {}),
                            ...((props.featureId === FEnums.AssetPlacement || props.featureId === FEnums.InboundAssetPlacement) && selectedRuPositionsRef.current
                                ? { RuPos: selectedRuPositionsRef.current }
                                : {})
                        },
                        sourceNodePath: props.selectedNodeExplorer.node.NodePath ?? props.selectedNodeExplorer?.node?.DevicePath,
                        powerPort: props.selectedNodeExplorer?.node?.HasPowerPorts ?? 0,
                        networkPort: props.selectedNodeExplorer?.node?.HasNetworkPorts ?? 0
                    })
                } else {
                    axiosInterceptor({
                        url: EM.DeleteTableRecords,
                        data: {
                            entityName: "WorkorderProfile",
                            tableName: "PG.WorkorderItem",
                            entIDs: selectedPlacement.EntId,
                        },
                        allowShowLoader: true,
                        setFetchData: (_response: unknown, status?: string) => {
                            if (status !== "200") {
                                console.error("Failed to delete PG.WorkorderItem");
                                return;
                            }

                            //  2. Delete _WorkorderProfile
                            axiosInterceptor({
                                url: EM.DeleteTableRecords,
                                data: {
                                    entityName: "WorkorderProfile",
                                    tableName: "_WorkorderProfile",
                                    entIDs: selectedPlacement.EntId,
                                },
                                allowShowLoader: true,
                                setFetchData: (_response: unknown, status?: string) => {
                                    if (status !== "200") {
                                        console.error("Failed to delete _WorkorderProfile");
                                        return;
                                    }

                                    FnCallApiForUpdateDeviceWoProfile(
                                        selectedPlacement.EntId,
                                        "",
                                        statusBarContext,
                                    );
                                    placementContext.setLastSelectedInboundLocation(undefined);
                                    setOverlayButtonForDevice([]);
                                    setSelectedRU('');
                                    setShowOkButton(true);
                                    setConfirmMessage(`Successfully deleted placement workorder`);
                                    setDeleteOpen(true);
                                    handleReload(selectedPlacement.EntId);
                                }
                            }, statusBarContext);
                        }
                    }, statusBarContext);

                }
            }
        } catch (error) {
            console.error("error in delete optin/out", error);
        }
    }

    // Show opt-out button when placement context has an active inbound location for AssetPlacement only.
    useEffect(() => {
        if (props.featureId === FEnums.AssetPlacement) {
            if (placementContext.lastSelectedInboundLocation && placementContext.lastSelectedInboundLocation.RUPos) {
                setOverlayButtonForDevice([{ label: "Optout", tooltip: "Click to remove placement" }]);
                setSelectedRU(formatRUWithHash(placementContext.lastSelectedInboundLocation.RUPos.toString()));
                selectedRuPositionsRef.current = placementContext.lastSelectedInboundLocation.RUPos.toString();
                setSelectedSlotEntID(placementContext.lastSelectedInboundLocation.EntID || "");
            } else {
                setOverlayButtonForDevice([]);
                setSelectedRU('');
                selectedRuPositionsRef.current = "";
                setSelectedSlotEntID('');
            }
        }
    }, [placementContext.lastSelectedInboundLocation, props.featureId]);



    // Track selected RU and toggle opt-in/out overlay button state.
    function handleRuSelect(Ru: string, EntID?: string | boolean, clear?: boolean): void {

        const isClear = typeof EntID === "boolean" ? EntID : clear;
        const slotEntId = typeof EntID === "string" ? EntID : "";
        if (isClear || !Ru || !Ru.trim()) {
            if ((props.featureId === FEnums.AssetPlacement || props.featureId === FEnums.InboundAssetPlacement) && placementContext.lastSelectedInboundLocation && placementContext.lastSelectedInboundLocation.RUPos) {
                setSelectedRU(formatRUWithHash(placementContext.lastSelectedInboundLocation.RUPos.toString()));
                selectedRuPositionsRef.current = placementContext.lastSelectedInboundLocation.RUPos.toString();
                setSelectedSlotEntID(placementContext.lastSelectedInboundLocation.EntID || "");
                setOverlayButtonForDevice([{ label: "Optout", tooltip: "Click to remove placement" }]);
            } else {
                setSelectedRU("");
                selectedRuPositionsRef.current = "";
                setSelectedSlotEntID("");
                setOverlayButtonForDevice([]);
            }
            return;
        }
        selectedRuPositionsRef.current = Ru.trim();
        setSelectedRU(formatRUWithHash(Ru));
        setSelectedSlotEntID(slotEntId);
        if ((props.featureId === FEnums.AssetPlacement || props.featureId === FEnums.InboundAssetPlacement) && placementContext.lastSelectedInboundLocation && placementContext.lastSelectedInboundLocation.RUPos) {
            setOverlayButtonForDevice([{ label: "Optout", tooltip: "Click to remove placement" }]);
        } else {
            setOverlayButtonForDevice([{ label: "Optin", tooltip: "Click to accept placement" }]);
        }
    }

    // Create workorder from selection and complete placement opt-in.
    const handleSelectWorkorder = async (workorderId: string) => {
        try {
            const findWorkOrder = workorderRecords.find(x => x._Workorder === workorderId);
            if (createWorkOrderPayload) {
                const payload: IFnCreateWorkOrderApiCall = { ...createWorkOrderPayload, _WorkOrderProfile: findWorkOrder ? [findWorkOrder] : undefined }
                const result = await FnCreateWorkOrderApiCalls(payload)

                if (result) {
                    // Extract workorder profile name from create API response.
                    function getWorkorderProfileName(data: unknown): string | null {
                        // Workorder response shape differs by API path; narrow defensively.
                        if (!data || typeof data !== "object") return null;
                        const response = data as IWorkorderProfileResponse;
                        const firstProfile = response.workorderProfile?.[0];
                        if (!firstProfile || typeof firstProfile !== "object") return null;
                        return firstProfile._WorkorderProfile ?? null;
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
                                    handleReload(createWorkOrderPayload.sourceNodeEntID);
                                }
                            },
                            {
                                label: "Yes",
                                onClick: async () => {
                                    // Call the API to auto execute the workorder 
                                    await FnAutoExecuteWorkOrder(getWorkorderProfileName(result) ?? "", statusBarContext);
                                    setShowOkButton(false);
                                    setDeleteOpen(false);
                                    setConfirmMessage("");
                                    setCustomButtons(undefined);
                                    handleReload(createWorkOrderPayload.sourceNodeEntID);
                                },
                                autoFocus: true
                            },
                            {
                                label: "Workorders",
                                onClick: () => {
                                    handleReload(createWorkOrderPayload.sourceNodeEntID);
                                    const name = getWorkorderProfileName(result);
                                    if (name) {
                                        FnNavigateToWorkOrder(name, statusBarContext.userSessionId, sessionContext.SessionList);
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
                    if (result.workorder && selectedDataForPlacement && payloadForPlacement) {
                        let parsed: Record<string, unknown> | null = null;
                        if (
                            typeof result.workorder === "object" &&
                            result.workorder &&
                            "jsonStringOutput" in result.workorder &&
                            result.workorder.jsonStringOutput
                        ) {
                            try {
                                parsed = JSON.parse(result.workorder.jsonStringOutput as string) as Record<string, unknown>;
                            } catch (error) {
                                console.error("Invalid workorder response", error);
                                return;
                            }
                        }

                        const workorderItems = parsed && Array.isArray(parsed["PG.WorkorderItem"])
                            ? parsed["PG.WorkorderItem"] as Array<Record<string, unknown>>
                            : [];
                        if (!workorderItems.length) {
                            console.error("Invalid workorder response");
                            return;
                        }

                        const firstItem = workorderItems[0];
                        const payload = { ...payloadForPlacement }
                        payload.WorkorderProfile = typeof firstItem?._WorkorderProfile === "string" ? firstItem._WorkorderProfile : undefined;
                        if (payload.WorkorderProfile && createWorkOrderPayload.sourceNodeEntID && createWorkOrderPayload.sourceNodeName) {
                            await FnCallApiForUpdateDeviceWoProfile(
                                createWorkOrderPayload.sourceNodeEntID,
                                payload.WorkorderProfile,
                                statusBarContext
                            );
                        }
                        if ((props.featureId === FEnums.AssetPlacement || props.featureId === FEnums.InboundAssetPlacement) && createWorkOrderPayload.sourceNodeEntID) {
                            let itemJson: any = firstItem?.ItemJson;
                            if (typeof itemJson === "string") {
                                try {
                                    itemJson = JSON.parse(itemJson);
                                } catch (error) {
                                    console.error('error in parse json response:', error);
                                    itemJson = null;
                                }
                            }
                            const dest: any = itemJson?.dest;
                            const inboundRecord: IInboundLocation = {
                                Site: (dest?.Site as string) ?? (payload.Site as string) ?? "",
                                Room: (dest?.Room as string) ?? (payload.Room as string) ?? "",
                                Floor: (dest?.Floor as string) ?? (payload.Floor as string) ?? "",
                                Location: (dest?.Location as string) ?? (payload.Location as string) ?? "",
                                Rack: (dest?.Rack as string) ?? (dest?.EntId as string) ?? (payload.Rack as string) ?? "",
                                RUPos: (dest?.RuPos as string) ?? (selectedRU ? formatRUWithHash(selectedRU) : undefined),
                                RuPos: (typeof dest?.RuPos === "string" && dest.RuPos.trim())
                                    ? dest.RuPos
                                    : (selectedRuPositionsRef.current || undefined),
                                EntID: createWorkOrderPayload.sourceNodeEntID,
                                RecID: (firstItem?.RecID as string) ?? "",
                                WorkorderProfile: payload.WorkorderProfile,
                                RackEntId: (dest?.RackEntId as string) ?? undefined
                            };
                            placementContext.setLastSelectedInboundLocation(inboundRecord);
                            setOverlayButtonForDevice([{ label: "Optout", tooltip: "Click to remove placement" }]);
                            props.handleReloadTree?.(props.featureId, createWorkOrderPayload.sourceNodeEntID);
                        }
                        const saveButton: HTMLDivElement | null = document.querySelector('.nz-placement-list-from-container .nz-form-action-header .nz-form-header-action-save');
                        if (saveButton) {
                            saveButton.style.display = "none";
                        }
                        setPayloadForPlacement(undefined);
                        setShowSelectWorkorder(false);
                    }

                }
            }
        } catch (error) {
            console.error("error in handleSelectWorkorder", error);
        }
    }

    // Open sidebar to show selected node details.
    function handleClickInformation(event: any, actionCode?: string | undefined, payload?: any): void {
        props.handleSidebarOpenClose?.('open')
    }
    return (
        <div className='nz-placement-explorer-container'>
            <div className='nz-sub-header'>
                <div className='nz-sub-header-left'>
                    <Label label={props.featureId === FEnums.Relocate ? "Relocate" : "Find Placement"} uniqueName={`${props.uniqueName}-title`} />
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

            <div className='nz-placement-floor-container'>
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <FloorLayoutContainer
                            key={`${props.uniqueName}-floor-layout-${props.selectedNodeExplorer?.node?.NodeEntID ?? ""}-${floorLayoutRefreshKey}`}
                            uniqueName={"floor-layour-container"}
                            allowEdit={false}
                            isSidebarOpen={true}
                            hideSearchControl={true}
                            selectedFloorNode={props.selectedNodeInfo.node}
                            treeData={props.treeData}
                            featureId={props.featureId}
                            hideSidebarBtn={true}
                            selectedFeatureTreeNode={props.selectedNodeExplorer.node}
                            overlayButtonForDevice={overlayButtonForDevice}
                            handleOverlayButtonForDeviceClick={handleOverlayButtonForDeviceClick}
                            handleRUSelect={handleRuSelect}
                        />
                    </Suspense>
                </ErrorBoundary>
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
                    const entID = createWorkOrderPayload?.sourceNodeEntID ?? selectedDataForPlacement?.EntId ?? props.selectedNodeExplorer?.node?.NodeEntID;
                    handleReload(entID || undefined);
                    setCreateWorkOrderPayload(undefined);
                }}
            />
            {showSelectWorkorder &&
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
                                setShowSelectWorkorder(false)
                                setWorkorderRecords([])
                            }}
                        />
                    </div>
                </div>
            }

        </div>
    )
}
export { PlacementExplorer }
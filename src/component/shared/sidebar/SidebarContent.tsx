
import { useEffect, useRef, useState } from 'react'
import { useMainAppContext } from '../context/hooks/MainAppHooks'
import { useCommonVariableContext } from '../context/hooks/CommonVariableHooks'
import { useSessionContext } from '../context/hooks/SessionHooks'
import { useStatusBarContext } from '../context/hooks/StatusBarHooks'
import { AUDIT, EM, MISC } from '../interceptors/EndPoints'
import { axiosInterceptor } from '../interceptors/Interceptor'
import '../allcss/sidebar/SidebarContainer.css'
import { SidebarEnum } from '../../constants/Feature'
import { FEnums } from '../../constants/Feature'
import { DropableControlElementEnums } from '../../appcontainer/alldefaultprops/Enums'
import { FnGetParentTreeNodeInfoUsingDiv } from '../allcommon/tree/FnGetParentTreeNodeInfoUsingDiv'
import { ITreeNode } from '../allinterface/tree/ITreeControl'
import { IControl } from '../allinterface/settingsform/ISettingsLibForm'
import { IErrorData } from '../allinterface/IApiResponse'
import { FnMapTableToFormControl } from '../allcommon/settingsform/FnMapTableToFormControl'
import { ISidebarContent } from '../allinterface/sidebar/ISidebarContent'
import { SettingsContainer } from '../settingsform/settingscontainer/SettingsContainer'
import { DeviceModel } from './devicemodel/DeviceModel'
import { ForensicLog } from './forensiclog/ForensicLog'
import { DiagnosticLogContainer } from './diagnosticlogcontainer/DiagnosticLogContainer'
import { FqaNotes } from './notes/FqaNotes'
import { Key } from 'rc-tree/lib/interface'
import { PropertyFormContainer } from './propertyformcontainer/PropertyFormContainer'
import { useHelpTipContext } from '../context/hooks/HelptipHooks'
import { Assign } from './assign/Assign'
import { IFnCreateForensiclog } from '../../appcontainer/allinterface/IFnCreateForensiclog'
import { LogGroupName, LogName, LogSubGroupName } from '../../appcontainer/alldefaultprops/DefaultPropsForensiclog'
import { FnCreateForensiclog } from '../../appcontainer/allcommon/FnCreateForensiclog'
import { AlertLog } from './alertlog/AlertLog'
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely'


const SidebarContent = (sidebarProps: ISidebarContent) => {
    const [Label, setLabel] = useState<string>("");
    const [entityName, setEntityName] = useState<string>("");
    const [selectedNode, setSelectedNode] = useState<ITreeNode>();
    const [formControls, setFormControls] = useState<IControl[]>();
    const [actionlog, setActionlog] = useState<IErrorData[]>();
    const [auditFormKey, setAuditFormKey] = useState(() => `audit-form-0`);
    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

    const mainAppContext = useMainAppContext();
    const commonVariableContext = useCommonVariableContext();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const helpTipsContext = useHelpTipContext();

    const lastSelectedNodeKeyRef = useRef<Key>(undefined);

    // Maps EM table field definitions into SettingsContainer-compatible IControl[].
    const mapEmRecordsToFormControls = (
        tableName: string,
        entityName: string,
        displayGroupName: string
    ): IControl[] => {
        const emRecords = mainAppContext.emRecords?.filter((item) =>
            item.TableName?.toLowerCase() === tableName.toLowerCase()
            && (item.PropertyLabel as string | undefined)?.length
            && !item.ExcludeDataGridField
        ) ?? [];

        if (!emRecords.length) {
            return [];
        }

        return FnMapTableToFormControl(emRecords, entityName, displayGroupName)
            .sort((a, b) => (a.SortOrder > b.SortOrder ? 1 : -1));
    };

    // Initialize form controls and entity information based on selected sidebar action.
    useEffect(() => {
        if (sidebarProps.Label) {
            setLabel(sidebarProps.Label)
        }

        if (sidebarProps.Label === SidebarEnum.AddNewAuditSession) {
            setEntityName("AuditSession");
            const addNewAuditSessionControls = mapEmRecordsToFormControls(
                "_auditsession",
                "AuditSession",
                "Audit Session"
            );
            if (addNewAuditSessionControls.length > 0) {
                setFormControls(addNewAuditSessionControls);
            }
        }
        else if (sidebarProps.Label === SidebarEnum.AddNewBusinessService) {
            setEntityName("BS");
            const addNewBSControls = mapEmRecordsToFormControls(
                "_bs",
                "BS",
                "Business Service"
            );
            if (addNewBSControls.length > 0) {
                setFormControls(addNewBSControls);
            }
        }
    }, [sidebarProps.Label, sidebarProps.featureId, helpTipsContext.helpTipRecords, mainAppContext.emRecords])

    // Update selected node state and determine readonly mode when node selection changes.
    useEffect(() => {
        if (sidebarProps.selectedNode) {
            if (lastSelectedNodeKeyRef.current !== sidebarProps.selectedNode.key) {
                setActionlog([]);
            }
            const nodeType = sidebarProps.selectedNode.NodeType?.toLowerCase();
            if (nodeType && ["site", "room", "floor", "inventory", "store", "bin"].includes(nodeType)) {
                setIsReadOnly(true);
            }
            else if (sidebarProps.selectedNode.NodeType?.toLowerCase() === "businessservices" || sidebarProps.selectedNode.ParentNodeType?.toLowerCase()?.includes("in-use")) {
                setIsReadOnly(true);
            }
            else {
                setIsReadOnly(false)
            }
            setSelectedNode(sidebarProps.selectedNode)
            lastSelectedNodeKeyRef.current = sidebarProps.selectedNode.key;
        }
    }, [sidebarProps.selectedNode]);

    // Build drag node hierarchy for audit session creation when node selection changes.
    useEffect(() => {
        if (selectedNode && Label === SidebarEnum.AddNewAuditSession) {
            const ParentObj: any = FnGetParentTreeNodeInfoUsingDiv(selectedNode, true);
            if (ParentObj?.length > 0) {
                ParentObj.push(selectedNode);
                commonVariableContext.setDragNodeDetails(ParentObj);
            }
        }
    }, [selectedNode, Label, sidebarProps.treeData])

    // Populate audit form fields based on the currently dropped hierarchy nodes.
    useEffect(() => {
        if (commonVariableContext.dragNodeDetails.length) {
            const droppedNodes = commonVariableContext.dragNodeDetails;
            setFormControls(prevControls => {
                if (!prevControls) return prevControls;

                // detect what was dropped
                const hasFloor = droppedNodes.some(
                    (n: any) => n.NodeType?.toLowerCase() === "floor"
                );

                const hasLocation = droppedNodes.some(
                    (n: any) => n.NodeType?.toLowerCase() === "location"
                );

                return prevControls.map(control => {
                    let updatedValue = control.Value;

                    //  Clear dependent fields first
                    if (hasFloor) {
                        if (
                            control._AP === DropableControlElementEnums.DeviceName ||
                            control._AP === DropableControlElementEnums.LocationName
                        ) {
                            updatedValue = "";
                        }
                    }

                    if (hasLocation) {
                        if (control._AP === DropableControlElementEnums.DeviceName) {
                            updatedValue = "";
                        }
                    }

                    //  Apply dropped values
                    droppedNodes.forEach((item: any) => {
                        const nodeType = item.NodeType?.toLowerCase();
                        const type = item.Type?.toLowerCase();

                        if (nodeType === "site" && control._AP === DropableControlElementEnums.SiteName) {
                            updatedValue = item.Name;
                        }
                        else if (nodeType === "room" && control._AP === DropableControlElementEnums.RoomName) {
                            updatedValue = item.Name;
                        }
                        else if (nodeType === "floor" && control._AP === DropableControlElementEnums.FloorName) {
                            updatedValue = item.Name;
                        }
                        else if (nodeType === "location" && control._AP === DropableControlElementEnums.LocationName) {
                            updatedValue = item.Name;
                        }
                        else if (type === "floordevice" && control._AP === DropableControlElementEnums.DeviceName) {
                            updatedValue = item.Name;
                        }
                    });

                    return {
                        ...control,
                        Value: updatedValue
                    };
                });
            });

            setAuditFormKey(`audit-form-${selectedNode?.key}`);
        }
    }, [commonVariableContext.dragNodeDetails]);

    // Append action log entries and location details whenever new log data arrives.
    useEffect(() => {
        const newData = statusBarContext.actionLogData;
        if (!newData?.length) return;

        const existingLog: IErrorData[] = actionlog ?? [];

        const isInventory =
            sidebarProps.featureId === FEnums.InventoryManagement ||
            sidebarProps.featureId === FEnums.InventoryConfiguration;

        const locationData = sessionContext.FnGetLocationData(isInventory);

        // Find max id in O(n)
        let lastId = 0;
        for (const item of existingLog) {
            if (item.id != null && item.id > lastId) lastId = item.id;
        }

        // Sort incoming once (desc)
        const incoming = newData.slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

        const result: IErrorData[] = [];

        //  ADD location row (use latest incoming row as base)
        if (locationData && incoming.length > 0) {
            const base = incoming[0];

            result.push({
                ...base,
                errString:
                    typeof locationData === "string"
                        ? locationData
                        : JSON.stringify(locationData),
                id: ++lastId
            });
        }

        // Add incoming rows
        for (const item of incoming) {
            result.push({
                ...item,
                id: ++lastId
            });
        }

        // Append existing log
        for (const item of existingLog) {
            result.push(item);
        }

        setActionlog(result);
    }, [statusBarContext.actionLogData, sidebarProps.featureId]);

    // Save audit session or business service form data and refresh tree after successful creation.
    const handleSaveFormsForKebabMenuAction = (profileData: string, id?: string | undefined) => {
        if (sidebarProps.Label === SidebarEnum.AddNewBusinessService) {
            try {
                const parsedData = FnParseJsonSafely(profileData);
                if (parsedData && parsedData.length > 0 && sidebarProps.selectedNodeExplorer) {
                    parsedData[0].NodeEntityName = entityName;
                    parsedData[0].ParentID = sidebarProps.selectedNodeExplorer.EntID;

                    let jsonData = { [`_${entityName}`]: parsedData };
                    axiosInterceptor({
                        url: EM.AddTableRecord,
                        data: {
                            entityName: entityName,
                            jsonString: JSON.stringify(jsonData)
                        },
                        setFetchData: (addTableRecordApiResponse: unknown, status?: string) => {
                            if (status === "200" && addTableRecordApiResponse && typeof addTableRecordApiResponse === "object" && 'jsonStringOutput' in addTableRecordApiResponse) {
                                try {
                                    const parsedData = FnParseJsonSafely(addTableRecordApiResponse.jsonStringOutput as string);
                                    if (parsedData && typeof parsedData === "object" && entityName) {
                                        const entityArray = parsedData[`_${entityName}`]; // e.g., parsedData["_AuditSession"]
                                        if (Array.isArray(entityArray) && entityArray.length > 0) {
                                            const id = entityArray[0]?.EntID || "";
                                            if (sidebarProps.handleReloadTree) {
                                                sidebarProps.handleReloadTree(sidebarProps.featureId, id);
                                            }
                                            commonVariableContext.setDragNodeDetails([]);
                                        }
                                    }
                                } catch (error) {
                                    console.error("Failed to parse JSON or extract EntID:", error);
                                }
                                const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
                                if (saveButton) {
                                    saveButton.style.display = "none";
                                }
                            }
                        }
                    }, statusBarContext);
                }
            } catch (err) {
                console.error("Error in AddNewBusinessService:", err);
            }
        }
        else {
            // Create entity payload and submit add/update request for audit records
            const callApiToAddEntityRecords = (auditId: string | undefined) => {
                // Process add/update entity response and perform post-save actions.
                const handleAddEntityRecordResponse = (addEntityRecordResponse: unknown, status?: string) => {
                    if (
                        status === "200" &&
                        addEntityRecordResponse &&
                        typeof addEntityRecordResponse === "object" &&
                        'jsonStringOutput' in addEntityRecordResponse
                    ) {
                        try {
                            const parsedData = FnParseJsonSafely(addEntityRecordResponse.jsonStringOutput as string);
                            const entityArray = parsedData[`_${entityName}`]; // e.g., parsedData["_AuditSession"]
                            const payload: IFnCreateForensiclog = {
                                logType: 'UserAction',
                                GroupName: LogGroupName.ForensicLogTemplate,
                                _Forensiclog: LogSubGroupName.Audit,
                                SubGroupName: LogSubGroupName.Audit,
                                LogName: LogName.Add,
                                actionObject: {
                                    AuditName: entityArray[0][`_${entityName}`]
                                },
                                sessionContext: sessionContext,
                                statusBarContext: statusBarContext,
                                RefTableItems: mainAppContext.refTableRecords
                            }
                            FnCreateForensiclog(payload)
                            if (parsedData && typeof parsedData === "object" && entityName) {
                                const entityArray = parsedData[`_${entityName}`]; // e.g., parsedData["_AuditSession"]

                                if (Array.isArray(entityArray) && entityArray.length > 0) {
                                    const id = entityArray[0]?.EntID || "";
                                    axiosInterceptor({
                                        url: AUDIT.GetAuditDeviceCount,
                                        data: {
                                            auditID: id
                                        },
                                        setFetchData: (getAuditDeviceCountApiResponse: unknown, status?: string) => {
                                            if (status === "200" && getAuditDeviceCountApiResponse !== undefined) {


                                                if (sidebarProps.handleReloadTree) {
                                                    sidebarProps.handleReloadTree(sidebarProps.featureId, id);
                                                }
                                                commonVariableContext.setDragNodeDetails([]);
                                            }
                                        }
                                    }, statusBarContext)

                                }
                            }
                        } catch (error) {
                            console.error("Failed to parse JSON or extract EntID:", error);
                        }
                    }
                    const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
                    if (saveButton) {
                        saveButton.style.display = "none";
                    }
                }
                const parsedData = FnParseJsonSafely(profileData);
                commonVariableContext.dragNodeDetails.forEach((item) => {
                    const nodeType = item.NodeType?.toLowerCase();
                    const type = item.Type?.toLowerCase();
                    if (nodeType === "site") {
                        parsedData[0].SiteID = item.NodeEntID;

                    } else if (nodeType === "room") {
                        parsedData[0].RoomID = item.NodeEntID;

                    } else if (nodeType === "floor") {
                        parsedData[0].FloorID = item.NodeEntID;

                    } else if (nodeType === "location") {
                        parsedData[0].LocationID = item.NodeEntID;

                    } else if (type === "floordevice") {
                        parsedData[0].DeviceID = item.NodeEntID;
                    }
                });
                if (auditId)
                    parsedData[0].AuditID = auditId;
                let jsonData = { [`_${entityName}`]: parsedData };
                axiosInterceptor({
                    url: EM.AddUpdateTableRecord,
                    data: {
                        jsonString: JSON.stringify(jsonData)
                    },
                    setFetchData: handleAddEntityRecordResponse
                }, statusBarContext);
            }
            if (sidebarProps.Label === SidebarEnum.AddNewAuditSession) {
                let deviceId: string | undefined = undefined;
                let locationId: string | undefined = undefined;
                let floorId: string | undefined = undefined;

                if (commonVariableContext.dragNodeDetails.length) {
                    for (let index = 0; index < commonVariableContext.dragNodeDetails.length; index++) {
                        const element = commonVariableContext.dragNodeDetails[index];
                        if (element.Type?.toLowerCase() === "floordevice") {
                            deviceId = element.NodeEntID ?? undefined;
                        }
                        else if (element.NodeType?.toLowerCase() === "location") {
                            locationId = element.NodeEntID ?? undefined;
                        }
                        else if (element.NodeType?.toLowerCase() === "floor") {
                            floorId = element.NodeEntID ?? undefined;
                        }
                    }
                }
                axiosInterceptor({
                    url: AUDIT.NewAuditSessionOrInventoryAllowed,
                    data: {
                        auditLocation:
                            deviceId ??
                            locationId ??
                            floorId ??
                            sidebarProps.selectedNode.NodeEntID,
                        feature: "Audit"
                    },
                    setFetchData: (handleCheckAllowAuditSession: unknown, status?: string, errData?: IErrorData[]) => {
                        if (status === "200" && handleCheckAllowAuditSession && typeof handleCheckAllowAuditSession === "object"
                            && 'allow' in handleCheckAllowAuditSession && handleCheckAllowAuditSession.allow) {
                            axiosInterceptor(
                                {
                                    url: MISC.ComputeCustomId,
                                    data: {
                                        instanceName: "AuditID"
                                    },
                                    allowShowLoader: true,
                                    setFetchData: (response: unknown, status?: string, errData?: IErrorData[]) => {
                                        if (status === "200" && response && typeof response === "object" && 'customID' in response && response?.customID) {
                                            // call api if audit id is found
                                            callApiToAddEntityRecords(response.customID as string);
                                        } else {
                                            const actualErrors = errData?.filter(err =>
                                                err.errString &&
                                                !err.errString.startsWith("Entering SP_:") &&
                                                !err.errString.startsWith("Exiting SP_:")
                                            );

                                            // If only debug messages remain, treat as success
                                            if (actualErrors && actualErrors.length === 0 && errData && errData.length > 0) {
                                                let errorMessage = "Something went wrong in create AuditID";
                                                if (errData?.length) {
                                                    const error = errData.find((item) => item.errCode > 0)
                                                    if (error) {
                                                        errorMessage = error.errString;
                                                    }
                                                }
                                                if (sidebarProps.handleShowErrorDialog) {
                                                    sidebarProps.handleShowErrorDialog(errorMessage, true)
                                                }
                                            } else {
                                                const message =
                                                    actualErrors?.[0]?.errString || errData?.[0]?.errString || `API Error ${status}`;
                                                if (sidebarProps.handleShowErrorDialog) {
                                                    sidebarProps.handleShowErrorDialog(message, true)
                                                }
                                            }
                                        }
                                    }
                                },
                                statusBarContext
                            );

                        }
                        else {
                            let errorMessage = "Audit session creation is not permitted for the selected location.";
                            if (errData?.length) {
                                const error = errData.find((item) => item.errCode > 0)
                                if (error) {
                                    errorMessage = error.errString;
                                }
                            }
                            if (sidebarProps.handleShowErrorDialog) {
                                sidebarProps.handleShowErrorDialog(errorMessage, true)
                            }
                        }
                    }
                }, statusBarContext);
            }
            else {
                callApiToAddEntityRecords(undefined);
            }
        }
    }

    const renderPropertyContainer = () => {
        const shouldShowPropertyContainer =
            selectedNode &&
            sidebarProps.isPropertyFound &&
            (Label === SidebarEnum.Property || Label === SidebarEnum.Profile) &&
            !selectedNode.NodeType?.toLowerCase().includes("helptip");

        if (!shouldShowPropertyContainer) {
            return null;
        }

        return (
            <div
                style={{
                    height: "100%",
                    width: "100%"
                }}
            >
                <PropertyFormContainer
                    uniqueName={`property-container-${sidebarProps.Label}`}
                    treeData={sidebarProps.treeData ?? undefined}
                    featureId={sidebarProps.featureId}
                    subTreeFeatureId={sidebarProps.subTreeFeatureId}
                    selectedNode={selectedNode}
                    isReadOnly={mainAppContext.siteProperties?.Locked || isReadOnly}
                    isAllowCustomAction={false}
                    allowLog={true}
                    selectedNodeMenu={sidebarProps.selectedNodeMenu}
                    handleValueChange={sidebarProps.apValueChange}
                    handleRefreshUpdatedRecord={(
                        newAddedId: string,
                        newAddedName: string,
                        action?: "save" | "back"
                    ) => {
                        if (
                            newAddedId &&
                            action === "save" &&
                            !sidebarProps.subTreeFeatureId
                        ) {
                            commonVariableContext.setReloadTreeFor({
                                featureId: sidebarProps.featureId,
                                entId: newAddedId
                            });
                        } else {
                            sidebarProps.handleReloadTree?.(
                                sidebarProps.featureId,
                                newAddedId
                            );
                        }
                    }}
                />
            </div>
        );
    };

    // Render sidebar content based on selected sidebar tab.
    const renderSidebarContent = () => {
        switch (Label) {
            case SidebarEnum.Alerts:
                return (
                    <AlertLog
                        uniqueName="appqa-alerts"
                        selectedNode={selectedNode}
                    />
                );

            case SidebarEnum.Log:
                return (
                    <ForensicLog
                        featureId={sidebarProps.featureId}
                        isSetting={true}
                        loginType="node"
                        selectedNode={selectedNode}
                        uniqueName={`${Label}-forensic-log`}
                    />
                );

            case SidebarEnum.Notes:
                return (
                    <FqaNotes
                        uniqueName="Notes"
                        hideSearchControl={false}
                        selectedNode={sidebarProps.selectedNode}
                    />
                );

            case SidebarEnum.ActionLog:
                return actionlog ? (
                    <DiagnosticLogContainer
                        uniqueName={`${Label}-fqa-actionlog`}
                        showGrid={true}
                        featureId={sidebarProps.featureId}
                        selectedNode={sidebarProps.selectedNode}
                        actionData={actionlog}
                    />
                ) : null;

            case SidebarEnum.Assign:
                return sidebarProps.treeData ? (
                    <Assign
                        uniqueName={`${sidebarProps.uniqueName}-Assign`}
                        featureId={sidebarProps.featureId}
                        selectedNode={sidebarProps.selectedNode}
                        treeData={sidebarProps.treeData}
                        assignmentType='tag'
                    />
                ) : null;

            case SidebarEnum.Device:
                return (
                    <DeviceModel
                        featureId={sidebarProps.featureId}
                        uniqueName="Device-Model"
                        selectedFeatuerQa=""
                        selectedNode={sidebarProps.selectedNode}
                        treeData={sidebarProps.treeData}
                    />
                );

            case SidebarEnum.AddNewAuditSession:
            case SidebarEnum.AddNewBusinessService:
                return formControls?.length ? (
                    <SettingsContainer
                        key={auditFormKey}
                        uniqueName={`${sidebarProps.uniqueName}-add-form`}
                        headerText={Label}
                        formControls={formControls}
                        allowActionList={false}
                        allowShowHeader={false}
                        allowAdd={true}
                        allowDelete={true}
                        isAutoSave={false}
                        featureId={sidebarProps.featureId}
                        profileString=""
                        showEditButton={false}
                        handleSaveAction={handleSaveFormsForKebabMenuAction}
                    />
                ) : null;

            default:
                return null;
        }
    };


    return (
        <div className="nz-sidebar-container">
            {renderPropertyContainer()}
            {renderSidebarContent()}
        </div>
    );

}

export { SidebarContent }

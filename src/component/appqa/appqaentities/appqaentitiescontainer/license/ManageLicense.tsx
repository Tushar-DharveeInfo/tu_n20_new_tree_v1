
import { useEffect, useMemo, useRef, useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import '../../../allcss/appqaentitiescontainer/license/ManageLicense.css'
import { IManageLicense } from "../../../allinterface/iappqaentitiescontainer/license/IManageLicense";
import { IControl } from "../../../../shared/allinterface/settingsform/ISettingsLibForm";
import { IActionLabelItem } from "../../../../shared/allinterface/basic/IActionLabelItem";
import { useMainAppContext } from "../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../shared/context/hooks/SessionHooks";
import { useStatusBarContext } from "../../../../shared/context/hooks/StatusBarHooks";
import { IEmItem } from "../../../../shared/context/allinterface/IMainApp";
import { FnMapTableToFormControl } from "../../../../shared/allcommon/settingsform/FnMapTableToFormControl";
import { FnFetchMiscTableData } from "../../../allcommon/FnFetchMiscTableData";
import { FnParseJsonSafely } from "../../../../appcontainer/allcommon/FnParseJsonSafely";
import { axiosInterceptor } from "../../../../shared/interceptors/Interceptor";
import { EM, LOG, SESSION } from "../../../../shared/interceptors/EndPoints";
import { IFnCreateForensiclog } from "../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { FnCreateForensiclog } from "../../../../appcontainer/allcommon/FnCreateForensiclog";
import { FnRemovePrefixFromJsonKeys } from "../../../allcommon/FnRemovePrefixFromJsonKeys";
import { EntityCardInstanceList } from "../cloudprovider/managepartners/entitycardinstancelist/EntityCardInstanceList";
import { SettingsLibForm } from "../../../../shared/settingsform/settingslibform/SettingsLibForm";
import { getMuForSite } from "../../../../shared/context/contextandprovider/ExplorerTree";
import { YesNoFormContainer } from "../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { EntityNameEnums } from "../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from "../../../../shared/allcommon/basic/FnHandleContainerKeyDown";

type ApiResponse = {
    jsonStringOutput?: string;
};
const ManageLicense = (manageRoleProps: IManageLicense) => {
    const { uniqueName, entityName } = manageRoleProps
    const [formControls, setFormControls] = useState<IControl[]>([]);
    const [entityRecords, setEntityRecords] = useState<Record<string, any>[]>();
    const [isEntityListLoading, setIsEntityListLoading] = useState<boolean>(true);
    const [hasRequestedEntity, setHasRequestedEntity] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<IActionLabelItem | null>(null);
    const [isAddMode, setIsAddMode] = useState<boolean>(false);
    const [isShowConfirmDialog, setIsShowConfirmDialog] = useState<boolean>(false);
    const [isShowOk, setIsShowOk] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const statusbarContext = useStatusBarContext();

    const lastAddedEntId = useRef<string | undefined>(undefined);

    const formControlForEntity = useMemo(() => {
        const records = mainAppContext.emRecords;
        if (!records?.length) {
            return null;
        }
        const entityControls: IEmItem[] = [];
        for (const item of records) {
            const table = item.TableName?.toLowerCase();
            if (
                table === `_${entityName}`.toLowerCase()
                && item.DisplayControl?.length
                && item.PropertyLabel
            ) {
                entityControls.push(item);
            }
        }
        const mainControls = FnMapTableToFormControl(
            entityControls,
            entityName,
            `${entityName} Details`
        );

        return {
            entityControls: mainControls,
            merged: [...mainControls]
        };
    }, [
        mainAppContext.emRecords,
        entityName
    ]);

    const loadAllData = async () => {
        setIsEntityListLoading(true);
        const [entities] = await Promise.all([
            FnFetchMiscTableData(`_${entityName}`, statusbarContext)
        ]);
        setEntityRecords(entities ?? []);
        setHasRequestedEntity(true);
        setIsEntityListLoading(false);
    };

    useEffect(() => {
        if (!formControlForEntity?.merged?.length) {
            return;
        }
        setFormControls([...formControlForEntity.merged]);
        setHasRequestedEntity(false);
        loadAllData();
    }, [formControlForEntity]);

    const actionListItems = useMemo((): IActionLabelItem[] => {
        if (!entityRecords?.length) {
            return [];
        }
        const items: IActionLabelItem[] = [];
        for (const entity of entityRecords) {
            if (!entity?.EntID) {
                continue;
            }
            const label =
                entity[`_${entityName}`]
                || entity.Name
                || entity.Title
                || "Unnamed";
            items.push({
                actionCode: entity.RecID,
                id: entity.EntID,
                label,
                tooltip: label,
                IsNZ: entity.IsNZ,
                profileString: JSON.stringify([entity])
            });
        }
        items.sort((a, b) => a.label.localeCompare(b.label));
        return items;
    }, [entityRecords, entityName]);

    useEffect(() => {
        if (!hasRequestedEntity || isEntityListLoading) {
            return;
        }
        if (!actionListItems.length) {
            setSelectedItem(null);
            return;
        }
        const selectedFromLastAdded = lastAddedEntId.current
            ? actionListItems.find((item) => {
                return item.id === lastAddedEntId.current
            })
            : undefined;
        setSelectedItem(prev => {
            if (selectedFromLastAdded) {
                return selectedFromLastAdded;
            }

            return (
                actionListItems.find(
                    item => item.actionCode === prev?.actionCode
                ) ?? actionListItems[0]
            );
        });
    }, [actionListItems, hasRequestedEntity, isEntityListLoading]);

    useEffect(() => {
        const getFilteredControls = (
            controls: IControl[],
            profileData: Record<string, any>
        ): IControl[] => {

            const rackCount = Number(profileData?.RackCount ?? 0);

            return controls.filter(control => {
                if (rackCount > 0) {
                    // Show RackCount, hide UserCount
                    return control._AP !== "UserCount";
                }

                // Show UserCount, hide RackCount
                return control._AP !== "RackCount";
            });
        };
        if (!selectedItem?.profileString || !formControlForEntity?.merged?.length) {
            return;
        }

        const parsedProfile = FnParseJsonSafely(
            selectedItem.profileString
        );

        if (!Array.isArray(parsedProfile) || !parsedProfile.length) {
            return;
        }

        const profileData = parsedProfile[0];

        setFormControls(
            getFilteredControls(
                formControlForEntity.merged,
                profileData
            )
        );

    }, [selectedItem, formControlForEntity]);

    const buildTablePayload = (
        controls: IControl[],
        data: Record<string, any>
    ): Record<string, any> => {

        const apiToControlMap: Record<string, string> = {
            productName: "ProductName",
            dateStart: "StartDate",
            dateEnd: "EndDate",
            count: "UserCount",
            subscription: "_NZLicenseKey"
        };

        const payload: Record<string, any> = {};

        for (const [apiKey, controlKey] of Object.entries(apiToControlMap)) {

            const controlExists = controls.some(
                control => control._AP === controlKey
            );

            if (controlExists && data[apiKey] !== undefined) {
                payload[controlKey] = data[apiKey];
            }
        }

        return payload;
    };

    const handleSaveForm = async (profileData: string, id?: string) => {
        try {
            if (!formControlForEntity || !profileData) {
                return;
            }
            const parsedRows = FnParseJsonSafely(profileData);
            const rows = Array.isArray(parsedRows) ? parsedRows : [];
            if (!rows.length || typeof rows[0] !== "object") {
                manageRoleProps.handleShowUserMessage?.("Invalid form data.");
                return;
            }
            const entityData = rows[0] as Record<string, any>;
            const existingEntity = entityRecords?.find((item) => item.RecID === id);
            const isEditMode = !!existingEntity;
            let entityPayload: Record<string, any>;
            if (isEditMode) {
                entityPayload = { ...existingEntity };
                for (const control of formControlForEntity.entityControls) {
                    if (control?._AP) {
                        entityPayload[control._AP] = entityData?.[control._AP];
                    }
                }
                return;
            }
            const subscription = entityData[`_${EntityNameEnums.NZLicenseKey}`];
            if (!subscription) {
                manageRoleProps.handleShowUserMessage?.("License key is required.");
                return;
            }
            axiosInterceptor(
                {
                    url: SESSION.ValidateLicense,
                    data: {
                        subscription,
                    },
                    setFetchData: (_respValidate: unknown, status?: string) => {
                        try {
                            if (
                                status !== "200" ||
                                !_respValidate ||
                                typeof _respValidate !== "object"
                            ) {
                                manageRoleProps.handleShowUserMessage?.(
                                    "License key is not valid."
                                );
                                return;
                            }
                            entityPayload = buildTablePayload(
                                formControlForEntity.entityControls,
                                _respValidate as Record<string, any>
                            );
                            const productName = entityPayload?.ProductName;
                            if (
                                typeof productName === "string" &&
                                productName.toLowerCase().includes("visio")
                            ) {
                                manageRoleProps.handleShowUserMessage?.(
                                    "Visio Stencils license is not allowed to add."
                                );
                                return;
                            }
                            entityPayload.EntityName = entityName;
                            axiosInterceptor(
                                {
                                    url: EM.AddUpdateTableRecord,
                                    data: {
                                        jsonString: JSON.stringify({
                                            [`_${entityName}`]: [entityPayload],
                                        }),
                                    },
                                    allowShowLoader: true,
                                    setFetchData: async (res: unknown, status?: string) => {
                                        try {
                                            if (status !== "200" || !res || typeof res !== "object") {
                                                return;
                                            }
                                            const apiRes = res as ApiResponse;
                                            if (!apiRes.jsonStringOutput) {
                                                return;
                                            }
                                            const parsed = FnParseJsonSafely(
                                                apiRes.jsonStringOutput
                                            ) as Record<string, unknown>;
                                            if (!parsed || typeof parsed !== "object") {
                                                return;
                                            }
                                            const entityArray = parsed[`_${entityName}`] as {
                                                EntID?: string;
                                            }[];
                                            const entId = entityArray?.[0]?.EntID;
                                            if (!entId) {
                                                return;
                                            }
                                            lastAddedEntId.current = entId;
                                            const payload: IFnCreateForensiclog = {
                                                logType: "UserAction",
                                                GroupName: LogGroupName.ForensicLogTemplate,
                                                _Forensiclog: LogSubGroupName.Entity,
                                                SubGroupName: LogSubGroupName.Entity,
                                                LogName: isEditMode
                                                    ? LogName.UpdateEntity
                                                    : LogName.AddEntity,
                                                actionObject: {
                                                    Name: entityPayload[`_${entityName}`],
                                                    FeatureName: entityName,
                                                },
                                                sessionContext,
                                                statusBarContext: statusbarContext,
                                                RefTableItems: mainAppContext.refTableRecords,
                                            };
                                            FnCreateForensiclog(payload);
                                            await loadAllData();
                                        } catch (error) {
                                            console.error("Failed to save license.", error);
                                            manageRoleProps.handleShowUserMessage?.(
                                                "Failed to save license."
                                            );
                                        }
                                    },
                                },
                                statusbarContext
                            );
                        } catch (error) {
                            console.error("License validation failed.", error);
                            manageRoleProps.handleShowUserMessage?.(
                                "License validation failed."
                            );
                        }
                    },
                },
                statusbarContext
            );
        } catch (error) {
            console.error("handleSaveForm failed.", error);
            manageRoleProps.handleShowUserMessage?.("Unexpected error while saving.");
        }
    };


    const handleSelectListItem = (
        event: React.MouseEvent<HTMLDivElement>
            | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => {
        setIsAddMode(false);
        if (!actionCode) {
            manageRoleProps.handleShowUserMessage?.("actionCode not found");
            return;
        }
        const record = actionListItems.find(
            (item) => item.actionCode === actionCode
        );
        if (!record) {
            manageRoleProps.handleShowUserMessage?.(
                `Record not found for actionCode : ${actionCode}`
            );
            return;
        }
        setSelectedItem(record);
    };

    const handleActionButtonClick = (
        event: any,
        actionCode?: string
    ) => {
        if (actionCode === "add") {
            setSelectedItem(null);
            setIsAddMode(true);
            return;
        }
        if (
            actionCode === "delete"
            && selectedItem
        ) {
            axiosInterceptor({
                url: LOG.CreateMessage,
                data: {
                    projectInitial: "Common",
                    msgID: "151"
                },
                setFetchData: (
                    response: unknown,
                    status?: string
                ) => {
                    if (
                        status === "200"
                        && response
                        && typeof response === "object"
                        && "finalMessage" in response
                    ) {
                        setIsShowOk(false);
                        setConfirmMessage(
                            response.finalMessage as string
                        );
                        setIsShowConfirmDialog(true);
                    }
                }
            }, statusbarContext);
        }
    };

    const handleYesButtonClick = () => {
        lastAddedEntId.current = undefined;
        const cleanedProfile = selectedItem?.profileString ? FnRemovePrefixFromJsonKeys(selectedItem.profileString) : undefined;
        const profileData = cleanedProfile ? FnParseJsonSafely(cleanedProfile) : [];
        if (
            !profileData?.length
            || !profileData?.[0]?.RecID
        ) {
            setIsShowConfirmDialog(false);
            return;
        }
        axiosInterceptor({
            url: EM.DeleteTableRecords,
            data: {
                tableName: `_${entityName}`,
                recIDs: selectedItem?.actionCode,
                entIDs: profileData[0].EntID
            },
            setFetchData: async (
                deleteResponse: unknown,
                status?: string
            ) => {
                if (
                    deleteResponse === ""
                    && status === "200"
                ) {
                    const payload: IFnCreateForensiclog = {
                        logType: "UserAction",
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Entity,
                        SubGroupName: LogSubGroupName.Entity,
                        LogName: LogName.DeleteEntity,
                        actionObject: {
                            Name: selectedItem?.label,
                            FeatureName: entityName
                        },
                        sessionContext,
                        statusBarContext: statusbarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    };
                    FnCreateForensiclog(payload);
                    await loadAllData();
                }
            }
        }, statusbarContext);
        setIsShowConfirmDialog(false);
    };

    return (
        <div
            key={uniqueName}
            className="nz-wh-100 nz-users-container"
        >
            <Splitter tabIndex={-1} className="nz-w-100 nz-h-100">
                <SplitterPanel
                    tabIndex={-1}
                    size={25}
                    minSize={20}
                    className="nz-wh-100 nz-user-list-container nz-pane-1"
                >
                    <div className="nz-wh-100 nz-user-list-content">
                        <EntityCardInstanceList
                            uniqueName={`${uniqueName}-alist`}
                            entityName={entityName}
                            actionLabelItems={actionListItems}
                            isAddMode={isAddMode}
                            selectedItem={selectedItem || undefined}
                            handleSelectListItem={handleSelectListItem}
                            handleActionButtonClick={handleActionButtonClick}
                            allowAdd={true}
                            disableAdd={!selectedItem}
                            allowDelete={true}
                            showEditButton={false}
                            disableDelete={!selectedItem || selectedItem.IsNZ}
                            hasRequestedData={hasRequestedEntity && !isEntityListLoading}
                            isLoading={isEntityListLoading || !hasRequestedEntity}
                        />
                    </div>
                </SplitterPanel>
                <SplitterPanel
                    tabIndex={-1}
                    size={75}
                    minSize={10}
                    className="nz-wh-100 nz-d-flex-column nz-align-center"
                >
                    <div className="nz-wh-100 nz-form-controls-container" onKeyDownCapture={handleFormControlsKeyDown}
                        onKeyDown={handleFormControlsBubbleKeyDown}>
                        {!!formControls?.length && (
                            <SettingsLibForm
                                uniqueName={`${uniqueName}-fc`}
                                controls={formControls}
                                profileString={selectedItem?.profileString}
                                allowShowHeader={false}

                                headerText={
                                    selectedItem
                                        ? `View ${selectedItem?.label}`
                                        : `Add ${entityName}`
                                }
                                handleSaveForm={handleSaveForm}
                                isAutoSave={false}
                                measurementUnit={getMuForSite()}
                                container={entityName}
                                allowTestIcon={false}
                                id={
                                    selectedItem?.actionCode
                                }
                                isDisableForm={selectedItem?.actionCode ? true : false}
                            />
                        )}
                    </div>
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer
                uniqueName={`${uniqueName}-confirm`}
                isOpen={isShowConfirmDialog}
                message={confirmMessage}
                handleYesButtonClick={handleYesButtonClick}
                handleNoButtonClick={() => {
                    setIsShowConfirmDialog(false);
                }}
                showOkButton={isShowOk}
                handleOkButtonClick={() => {
                    setIsShowConfirmDialog(false);
                }}
            />
        </div>
    );
};
export { ManageLicense };
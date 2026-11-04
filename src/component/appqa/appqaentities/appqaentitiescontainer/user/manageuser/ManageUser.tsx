
import { useEffect, useMemo, useRef, useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import "../../../../allcss/appqaentitiescontainer/user/ManageUser.css";
import { IControl } from "../../../../../shared/allinterface/settingsform/ISettingsLibForm";
import { IActionLabelItem } from "../../../../../shared/allinterface/basic/IActionLabelItem";
import { useMainAppContext } from "../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../shared/context/hooks/SessionHooks";
import { useStatusBarContext } from "../../../../../shared/context/hooks/StatusBarHooks";
import { DisplayControlEnums } from "../../../../../shared/alldefaultprops/basic/DefaultPropsFormContainer";
import { FnMapTableToFormControl } from "../../../../../shared/allcommon/settingsform/FnMapTableToFormControl";
import { FnFetchMiscTableData } from "../../../../allcommon/FnFetchMiscTableData";
import { FnParseJsonSafely } from "../../../../../appcontainer/allcommon/FnParseJsonSafely";
import { axiosInterceptor } from "../../../../../shared/interceptors/Interceptor";
import { AUTH, EM, LOG } from "../../../../../shared/interceptors/EndPoints";
import { IFnCreateForensiclog } from "../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { FnCreateForensiclog } from "../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { FnConvertTimeToDateTime } from "../../../../../shared/allcommon/basic/FnConvertTimeToDateTime";
import { IManageUser } from "../../../../allinterface/iappqaentitiescontainer/user/IManageUser";
import { EntityCardInstanceList } from "../../cloudprovider/managepartners/entitycardinstancelist/EntityCardInstanceList";
import { SettingsLibForm } from "../../../../../shared/settingsform/settingslibform/SettingsLibForm";
import { getMuForSite } from "../../../../../shared/context/contextandprovider/ExplorerTree";
import { YesNoFormContainer } from "../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { IEmItem } from "../../../../../shared/context/allinterface/IMainApp";
import { FnMergeTableDataWithPrifixKeys } from "../../../../allcommon/FnMergeTableDataWithPrifixKeys";
import { FnRemovePrefixFromJsonKeys } from "../../../../allcommon/FnRemovePrefixFromJsonKeys";
import { FnSyncNzUserBeforeSave } from "../../../../allcommon/FnSyncNzUserBeforeSave";
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from "../../../../../shared/allcommon/basic/FnHandleContainerKeyDown";
import { FnHideShowSaveIconForForm } from "../../../../../shared/allcommon/basic/FnHideShowSaveIconForForm";
import { IErrorData } from "../../../../../shared/allinterface/IApiResponse";

type ApiResponse = {
    jsonStringOutput?: string;
};

// Returns true when an Enabled field value represents an enabled user.
const isRecordEnabled = (value: unknown): boolean => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value === 1;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true";
    }
    return false;
};

const ManageUser = (manageRoleProps: IManageUser) => {
    const { uniqueName, entityName, pgTableName, pgTableLabel } = manageRoleProps
    const [formControls, setFormControls] = useState<IControl[]>([]);
    const [entityRecords, setEntityRecords] = useState<Record<string, any>[]>();
    const [pgTableRecords, setPgTableRecords] = useState<Record<string, any>[]>([]);
    const [isEntityListLoading, setIsEntityListLoading] = useState<boolean>(true);
    const [hasRequestedEntity, setHasRequestedEntity] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<IActionLabelItem | null>(null);
    const [isAddMode, setIsAddMode] = useState<boolean>(false);
    const [isShowConfirmDialog, setIsShowConfirmDialog] = useState<boolean>(false);
    const [isShowOk, setIsShowOk] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [formKey, setFormKey] = useState<number>(0);

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
        const pgControls: IEmItem[] = [];
        for (const item of records) {
            const table = item.TableName?.toLowerCase();
            if (
                table === `_${entityName}`.toLowerCase()
                && item.DisplayControl?.length
                && item.DisplayControl !== DisplayControlEnums.TextControl
            ) {
                entityControls.push(item);
            }
            else if (
                pgTableName
                && table === pgTableName.toLowerCase()
                && item.DisplayControl?.length
                && item.DisplayControl !== DisplayControlEnums.TextControl
                && item.DisplayControl !== DisplayControlEnums.DateControl
            ) {
                pgControls.push({ ...item });
            }
        }
        const mainControls = FnMapTableToFormControl(
            entityControls,
            entityName,
            `${entityName} Details`
        );
        const additionalControls = pgTableName
            ? FnMapTableToFormControl(
                pgControls,
                entityName,
                pgTableLabel ?? "Additional Details"
            )
            : [];
        return {
            entityControls: mainControls,
            pgControls: additionalControls,
            merged: [...mainControls, ...additionalControls]
        };
    }, [
        mainAppContext.emRecords,
        entityName,
        pgTableLabel,
        pgTableName
    ]);

    const loadAllData = async () => {
        setIsEntityListLoading(true);
        const [entities, pgData] = await Promise.all([
            FnFetchMiscTableData(`_${entityName}`, statusbarContext),
            pgTableName ? FnFetchMiscTableData(pgTableName, statusbarContext) : undefined
        ]);
        setEntityRecords(entities ?? []);
        setPgTableRecords(pgData ?? []);
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
            const pgRecord = pgTableRecords?.find(
                (item) => item.EntID === entity.EntID
            );
            const mergedRecord = FnMergeTableDataWithPrifixKeys(
                entity,
                pgRecord,
                `${entityName} Details`,
                pgTableLabel ?? "Additional Details"
            );
            const label =
                entity["Shortname"]
                || entity.Name
                || entity.Title
                || "Unnamed";
            items.push({
                actionCode: entity.RecID,
                id: entity.EntID,
                label,
                tooltip: label,
                IsNZ: entity.IsNZ,
                profileString: JSON.stringify([mergedRecord])
            });
        }
        items.sort((a, b) => a.label.localeCompare(b.label));
        return items;
    }, [entityRecords, pgTableRecords, entityName, pgTableLabel]);

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
        if (!selectedItem?.profileString || !formControls?.length) {
            return;
        }
        const parsedProfile = FnParseJsonSafely(
            selectedItem.profileString
        );
        if (!Array.isArray(parsedProfile) || !parsedProfile.length) {
            return;
        }
        const data = parsedProfile[0];
        const getPrefix = (tableName: string) =>
            tableName.replace(/[^a-zA-Z0-9]/g, "");

        const missingFields = formControls
            .filter(control => control.IsRequired)
            .filter(control => {
                const prefix =
                    control.DisplayGroupControl === `${entityName} Details`
                        ? getPrefix(`${entityName} Details`)
                        : getPrefix(pgTableLabel ?? "Additional Details");

                const value = data?.[`${prefix}_${control.Name}`];

                return (
                    value === undefined ||
                    value === null ||
                    value === "" ||
                    (Array.isArray(value) && value.length === 0)
                );
            });
        if (missingFields.length) {
            setIsShowOk(true);
            setConfirmMessage(
                "Some required information is missing. Please update the form."
            );
            setIsShowConfirmDialog(true);
        }
    }, [
        selectedItem,
        formControls
    ]);

    const buildTablePayload = (
        controls: IControl[],
        data: Record<string, any>
    ) => {
        const payload: Record<string, any> = {};
        for (const control of controls) {
            if (!control._AP) {
                continue;
            }
            payload[control._AP] = data?.[control._AP];
        }
        return payload;
    };

    const handleSaveForm = async (
        profileData: string,
        id?: string
    ) => {
        if (!formControlForEntity || !profileData) {
            return;
        }
        const parsedRows = FnParseJsonSafely(profileData);
        let entityData: Record<string, any> = {};
        let pgData: Record<string, any> = {};

        if (pgTableName) {

            const sections = parsedRows?.TableSections
                ? Object.values(parsedRows.TableSections)
                : [];

            entityData = sections?.[0] as Record<string, any>;

            pgData = sections?.[1] as Record<string, any>;

        }
        else {

            const rows = Array.isArray(parsedRows)
                ? parsedRows
                : [];

            entityData = rows?.[0] as Record<string, any>;
        }
        const existingEntity = entityRecords?.find(
            (item) => item.RecID === id
        );
        const isEditMode = !!existingEntity;
        let entityPayload: Record<string, any>;
        let pgPayload: Record<string, any>;
        const existingPgRecord = isEditMode
            ? pgTableRecords?.find((item) => item.EntID === existingEntity.EntID)
            : undefined;
        if (isEditMode) {
            entityPayload = { ...existingEntity };
            for (const control of formControlForEntity.entityControls) {
                entityPayload[control._AP] = entityData?.[control._AP];
            }
            pgPayload = existingPgRecord
                ? { ...existingPgRecord }
                : {};
            if (pgTableName) {
                for (const control of formControlForEntity.pgControls) {
                    pgPayload[control._AP] = pgData?.[control._AP];
                }
            }
            pgPayload.EntID = existingEntity.EntID;
        }
        else {
            entityPayload = buildTablePayload(
                formControlForEntity.entityControls,
                entityData
            );
            pgPayload = pgTableName
                ? buildTablePayload(
                    formControlForEntity.pgControls,
                    pgData
                )
                : {};
        }
        entityPayload.EntityName = entityName;
        pgPayload.EntityName = entityName;

        const entID = existingEntity?.EntID ?? selectedItem?.id ?? entityPayload.EntID;
        if (isRecordEnabled(entityPayload.Enabled) && entID) {
            const isAuthorized = await checkUserAuthorization(String(entID));
            if (!isAuthorized) {
                handleShowMessage("This user cannot be enabled because you are not authorized.", true);
                return
            }
        }
        if (
            pgPayload?.StartTime
            || pgPayload?.EndTime
        ) {
            pgPayload.StartTime = FnConvertTimeToDateTime(
                pgPayload?.StartTime
            );
            pgPayload.EndTime = FnConvertTimeToDateTime(
                pgPayload?.EndTime
            );
        }

        const canContinueSave = await FnSyncNzUserBeforeSave({
            isEditMode,
            existingEntity,
            entityPayload,
            handleShowUserMessage: manageRoleProps.handleShowUserMessage
        });
        if (!canContinueSave) {
            return;
        }
        axiosInterceptor({
            url: EM.AddUpdateTableRecord,
            data: {
                jsonString: JSON.stringify({
                    [`_${entityName}`]: [entityPayload]
                })
            },
            allowShowLoader: true,
            setFetchData: async (
                res: unknown,
                status?: string,
                errData?: IErrorData[]
            ) => {
                if (
                    status !== "200"
                    || !res
                    || typeof res !== "object"
                ) {
                    const error = errData?.find((item) => item.errCode > 0);
                    manageRoleProps.handleShowUserMessage?.(error?.errString ?? "Something wrong in add/update user");
                    return;
                }
                const apiRes = res as ApiResponse;
                if (!apiRes.jsonStringOutput) {
                    return;
                }
                const parsed = FnParseJsonSafely(
                    apiRes.jsonStringOutput
                ) as Record<string, unknown>;
                const entityArray = parsed?.[`_${entityName}`] as {
                    EntID?: string;
                }[];
                const entId = entityArray?.[0]?.EntID;
                if (!entId) {
                    return;
                }
                lastAddedEntId.current = entId;
                if (!pgTableName) {

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
                            FeatureName: entityName
                        },
                        sessionContext,
                        statusBarContext: statusbarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    };

                    FnCreateForensiclog(payload);
                    FnHideShowSaveIconForForm("hide");
                    handleShowMessage(
                        isAddMode
                            ? "User added successfully."
                            : "User updated successfully."
                        , true);
                    setIsAddMode(false);
                    setFormKey(prev => prev + 1);
                    await loadAllData();

                    return;
                }
                pgPayload.EntID = entId;
                axiosInterceptor({
                    url: EM.AddUpdateTableRecord,
                    data: {
                        jsonString: JSON.stringify({
                            [pgTableName]: [pgPayload]
                        })
                    },
                    allowShowLoader: true,
                    setFetchData: async (apiResp: unknown, status?: string) => {
                        if (status !== "200") {
                            handleShowMessage(
                                pgPayload.RecID
                                    ? "Failed to update Contact details."
                                    : "Failed to add Contact details."
                                , true);
                            return
                        }
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
                                FeatureName: entityName
                            },
                            sessionContext,
                            statusBarContext: statusbarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        };
                        FnCreateForensiclog(payload);
                        FnHideShowSaveIconForForm("hide");
                        handleShowMessage(
                            isAddMode
                                ? "User added successfully."
                                : "User updated successfully."
                            , true);
                        setIsAddMode(false);
                        setFormKey(prev => prev + 1);
                        await loadAllData();
                    }
                }, statusbarContext);
            }
        }, statusbarContext);
    };

    const handleSelectListItem = (
        event: React.MouseEvent<HTMLDivElement>
            | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => {
        setIsAddMode(false);
        FnHideShowSaveIconForForm("hide");
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
        setFormKey(prev => prev + 1);
    };

    const handleActionButtonClick = (
        event: any,
        actionCode?: string
    ) => {
        if (actionCode === "add") {
            setSelectedItem(null);
            setIsAddMode(true);
            setFormKey(prev => prev + 1);
            FnHideShowSaveIconForForm("hide");
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

    const handleShowMessage = (message: string, isShowOkOnly?: boolean) => {
        setConfirmMessage(message);
        setIsShowOk(!!isShowOkOnly);
        setIsShowConfirmDialog(true);
    };
    const checkUserAuthorization = (entID: string): Promise<boolean> => (
        new Promise((resolve) => {
            axiosInterceptor(
                {
                    url: AUTH.IsAuthorized,
                    data: {
                        entityName: "User",
                        entID,
                    },
                    allowShowLoader: true,
                    setFetchData: (response: unknown, status?: string) => {
                        if (status !== "200") {
                            resolve(false);
                            return;
                        }
                        if (response && typeof response === "object") {
                            const authResponse = response as Record<string, unknown>;
                            const isAuthorized = authResponse.isAuthorized ?? authResponse.IsAuthorized;
                            resolve(
                                isAuthorized === true
                                || isAuthorized === 1
                                || isAuthorized === "1"
                                || isAuthorized === "true"
                            );
                            return;
                        }
                        resolve(false);
                    },
                },
                statusbarContext
            ).catch((error) => {
                console.error("Failed to check user enable authorization", error);
                resolve(false);
            });
        })
    );

    return (
        <div
            key={uniqueName}
            className="nz-wh-100 nz-users-container"
        >
            <Splitter tabIndex={-1} className="nz-w-100 nz-h-100">
                <SplitterPanel
                    size={25}
                    tabIndex={-1}
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
                    <div className="nz-wh-100 nz-form-controls-container"
                        onKeyDownCapture={handleFormControlsKeyDown}
                        onKeyDown={handleFormControlsBubbleKeyDown}>
                        {!!formControls?.length && (
                            <SettingsLibForm
                                key={`${uniqueName}-${isAddMode ? 'add' : (selectedItem?.actionCode ?? 'none')}-${formKey}`}
                                uniqueName={`${uniqueName}-fc`}
                                controls={formControls}
                                profileString={selectedItem?.profileString}
                                allowShowHeader={true}
                                headerText={
                                    selectedItem
                                        ? `Edit ${selectedItem?.label}`
                                        : `Add ${entityName}`
                                }
                                handleSaveForm={handleSaveForm}
                                isAutoSave={false}
                                measurementUnit={getMuForSite()}
                                container={entityName}
                                allowTestIcon={false}
                                isAddressFormRequired={true}
                                id={
                                    selectedItem?.actionCode
                                }
                                isDisableForm={false}
                                handleShowMessage={handleShowMessage}
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
export { ManageUser };
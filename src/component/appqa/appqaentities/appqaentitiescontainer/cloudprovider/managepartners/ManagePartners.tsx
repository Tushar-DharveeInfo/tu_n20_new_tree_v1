
import { useEffect, useMemo, useRef, useState } from "react"
import { IFormData } from "@n20a/libform"
import { Splitter, SplitterPanel } from "primereact/splitter"
import '../../../../allcss/appqaentitiescontainer/cloudprovider/ManagePartners.css'
import { IManagePartners } from "../../../../allinterface/iappqaentitiescontainer/cloudprovider/IManagePartners"
import { IControl } from "../../../../../shared/allinterface/settingsform/ISettingsLibForm"
import { IActionLabelItem } from "../../../../../shared/allinterface/basic/IActionLabelItem"
import { useMainAppContext } from "../../../../../shared/context/hooks/MainAppHooks"
import { useSessionContext } from "../../../../../shared/context/hooks/SessionHooks"
import { EntityNameEnums } from "../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer"
import { DisplayControlEnums } from "../../../../../shared/alldefaultprops/basic/DefaultPropsFormContainer"
import { FnMapTableToFormControl } from "../../../../../shared/allcommon/settingsform/FnMapTableToFormControl"
import { FnFetchMiscTableData } from "../../../../allcommon/FnFetchMiscTableData"
import { FnParseJsonSafely } from "../../../../../appcontainer/allcommon/FnParseJsonSafely"
import { axiosInterceptor } from "../../../../../shared/interceptors/Interceptor"
import { EM, LOG } from "../../../../../shared/interceptors/EndPoints"
import { IFnCreateForensiclog } from "../../../../../appcontainer/allinterface/IFnCreateForensiclog"
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog"
import { FnCreateForensiclog } from "../../../../../appcontainer/allcommon/FnCreateForensiclog"
import { FnConvertTimeToDateTime } from "../../../../../shared/allcommon/basic/FnConvertTimeToDateTime"
import { EntityCardInstanceList } from "./entitycardinstancelist/EntityCardInstanceList"
import { SettingsLibForm } from "../../../../../shared/settingsform/settingslibform/SettingsLibForm"
import { getMuForSite } from "../../../../../shared/context/contextandprovider/ExplorerTree"
import { YesNoFormContainer } from "../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer"
import { FnMergeTableDataWithPrifixKeys } from "../../../../allcommon/FnMergeTableDataWithPrifixKeys"
import { FnRemovePrefixFromJsonKeys } from "../../../../allcommon/FnRemovePrefixFromJsonKeys"
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from "../../../../../shared/allcommon/basic/FnHandleContainerKeyDown"
import { FnHideShowSaveIconForForm } from "../../../../../shared/allcommon/basic/FnHideShowSaveIconForForm"
import { FnIsTruthyFlag } from "../../../../../shared/allcommon/basic/FnIsTruthyFlag"

const applyDateTimeFields = (
    mergedPgRow: Record<string, unknown>
): void => {
    const convertTime = (
        value: unknown
    ): string | undefined => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return undefined;
        }

        const timeValue = String(value).trim();

        if (!timeValue) {
            return undefined;
        }

        // Already a datetime value
        // e.g. 2026-07-06T00:00:00
        if (/^\d{4}-\d{2}-\d{2}T/.test(timeValue)) {
            return timeValue;
        }

        // Only convert actual time values
        // e.g. 10:30, 10:30:00
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeValue)) {
            return FnConvertTimeToDateTime(timeValue) ?? undefined;
        }

        // Invalid value
        return undefined;
    };

    mergedPgRow["StartTime"] = convertTime(
        mergedPgRow["StartTime"]
    );

    mergedPgRow["EndTime"] = convertTime(
        mergedPgRow["EndTime"]
    );
};

const ManagePartners = ({ uniqueName, statusbarContext, entityName, relationship, selectedSubGroup }: IManagePartners) => {

    const [formControls, setFormControls] = useState<IControl[]>();
    const [partnerList, setPartnerList] = useState<Record<string, any>[]>();
    const [contactsForPartners, setContactsForPartners] = useState<Record<string, any>[]>();
    const [isPartnerListLoading, setIsPartnerListLoading] = useState<boolean>(true);
    const [hasRequestedPartners, setHasRequestedPartners] = useState<boolean>(false);
    const [isAddMode, setIsAddMode] = useState<boolean>(false);
    const [isShowConfirmDialog, setIsShowConfirmDialog] = useState<boolean>(false);
    const [isShowOk, setIsShowOk] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<IActionLabelItem | null>(null);

    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();

    const lastAddedEntId = useRef<string>(undefined);

    const formControlForPartner = useMemo(() => {
        const records = mainAppContext.emRecords;
        if (!records?.length) return null;
        const partner: any[] = [];
        const contact: any[] = [];
        for (const item of records) {
            const table = item.TableName?.toLowerCase();
            if (table === "_partner" && (item.PropertyLabel as string | undefined)?.length) {
                let updatedItem = { ...item }; //  clone
                if (item.PName.toLowerCase() === "groupname") {
                    updatedItem.DefaultValue = relationship;
                    updatedItem.PropertyLabel = "Group Name";
                }
                else if (relationship === "Tag" && item.PName.toLowerCase() === "_partner") {
                    updatedItem.PropertyLabel = "Tag";
                }
                else if (relationship === "Team" && item.PName.toLowerCase() === "_partner") {
                    updatedItem.PropertyLabel = "Team";
                }
                partner.push(updatedItem);
            }
            else if (
                relationship !== "Tag" &&
                relationship !== "Team" &&
                table === "pg.contact" &&
                item.DisplayControl?.length &&
                item.DisplayControl !== DisplayControlEnums.TextControl &&
                item.DisplayControl !== DisplayControlEnums.DateControl
            ) {
                contact.push({ ...item }); //  clone here too
            }
        }

        const partnerControls = FnMapTableToFormControl(partner, entityName, "Partner Details");
        const contactControls = FnMapTableToFormControl(contact, entityName, "Contact Details");

        return {
            partnerControls,
            contactControls,
            merged: [...partnerControls, ...contactControls]
        };

    }, [mainAppContext.emRecords, relationship]);

    // React only updates state when data really changes
    useEffect(() => {
        if (!formControlForPartner?.merged?.length) return;

        setFormControls(formControlForPartner.merged);

        const loadLists = async () => {
            setIsPartnerListLoading(true);
            setHasRequestedPartners(false);
            const [partners, contacts] = await Promise.all([
                FnFetchMiscTableData("_Partner", statusbarContext),
                FnFetchMiscTableData("PG.Contact", statusbarContext)
            ]);

            setPartnerList(partners ?? []);
            setContactsForPartners(contacts ?? []);
            setHasRequestedPartners(true);
            setIsPartnerListLoading(false);
        };

        loadLists();

    }, [formControlForPartner]);

    const actionListItems = useMemo((): IActionLabelItem[] => {
        if (!partnerList?.length) {
            return [];
        }
        const actionItems: IActionLabelItem[] = [];
        const filteredPartners = relationship
            ? partnerList.filter((p) => p?.GroupName === relationship)
            : partnerList;
        for (let i = 0; i < filteredPartners.length; i++) {
            const partner = filteredPartners[i];

            if (!partner.EntID) continue;

            const contact = contactsForPartners?.find(
                (c) => c.EntID === partner.EntID
            );

            const mergedRecord = FnMergeTableDataWithPrifixKeys(
                partner,
                contact,
                `Partner Details`,
                "Contact Details"
            );
            actionItems.push({
                actionCode: partner.RecID,
                id: partner.EntID,
                label: partner._Partner,
                tooltip: partner.Relationship,
                IsNZ: partner.IsNZ,
                profileString: JSON.stringify([mergedRecord])
            });
        }
        actionItems.sort((a, b) => a.label.localeCompare(b.label));
        return actionItems;
    }, [partnerList, contactsForPartners, relationship]);

    useEffect(() => {
        if (!hasRequestedPartners || isPartnerListLoading) {
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
        setSelectedItem((prev) => {
            if (selectedFromLastAdded) {
                return selectedFromLastAdded;
            }
            if (
                prev
                && actionListItems.some(
                    (item) => item.actionCode === prev.actionCode
                )
            ) {
                return prev;
            }
            return actionListItems[0];
        });
    }, [actionListItems, hasRequestedPartners, isPartnerListLoading]);

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

        if (Array.isArray(parsedProfile) && parsedProfile.length > 0) {
            const data = parsedProfile[0];


            const getPrefix = (tableName: string) =>
                tableName.replace(/[^a-zA-Z0-9]/g, "");

            const missingFields = formControls
                .filter(control => control.IsRequired)
                .filter(control => {
                    const prefix =
                        control.DisplayGroupControl === `Partner Details`
                            ? getPrefix(`Partner Details`)
                            : getPrefix("Contact Details");

                    const value = data?.[`${prefix}_${control.Name}`];

                    return (
                        value === undefined ||
                        value === null ||
                        value === "" ||
                        (Array.isArray(value) && value.length === 0)
                    );
                });

            if (missingFields?.length) {
                setIsShowOk(true);
                setConfirmMessage("Some required information is missing. Please update the form.");
                setIsShowConfirmDialog(true);
            }
        }
    }, [selectedItem, formControls]);

    const buildTablePayload = (
        controls: IControl[],
        data: Record<string, any>
    ) => {
        const payload: Record<string, any> = {};

        for (const c of controls) {
            if (!c._AP) continue;
            payload[c._AP] = data[c._AP];
        }

        return payload;
    }

    const callApiToRefreshData = () => {
        const loadLists = async () => {
            setIsPartnerListLoading(true);
            const [partners, contacts] = await Promise.all([
                FnFetchMiscTableData("_Partner", statusbarContext),
                FnFetchMiscTableData("PG.Contact", statusbarContext)
            ]);

            setPartnerList(partners ?? []);
            setContactsForPartners(contacts ?? []);
            setHasRequestedPartners(true);
            setIsPartnerListLoading(false);
        };
        loadLists();
    }


    type ApiResponse = {
        jsonStringOutput?: string;
    };

    const handleShowMessage = (message: string, isShowOkOnly?: boolean) => {
        setConfirmMessage(message);
        setIsShowOk(!!isShowOkOnly);
        setIsShowConfirmDialog(true);
    };

    const handleSaveForm = async (profileData: string, id?: string) => {

        if (!formControlForPartner || !profileData) return;

        const parsedRows: IFormData = FnParseJsonSafely(profileData);
        if (!parsedRows) {
            return;
        }
        if (relationship === "Tag" || relationship === "Team") {
            const partner = partnerList?.find((item) => item.RecID === id);
            const partnerData = ((parsedRows as unknown) as Record<string, any>[]);
            if (!partnerData?.length) return;
            const isEditMode = !!partner?.EntID;

            let finalPayload;
            if (isEditMode) {
                //  UPDATE → use existing partner object
                finalPayload = { ...partner };
                for (let i = 0; i < formControlForPartner.partnerControls.length; i++) {
                    const element = formControlForPartner.partnerControls[i];
                    finalPayload[element._AP] = partnerData[0][element._AP];
                }

            } else {
                //  INSERT → use fresh payload builder
                finalPayload = buildTablePayload(
                    formControlForPartner.partnerControls,
                    partnerData[0]
                );
            }

            // common fields
            finalPayload.EntityName = entityName;

            // Save Partner
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({ _Partner: [finalPayload] })
                },
                allowShowLoader: true,
                setFetchData: async (res: unknown, status?: string) => {
                    if (status !== "200" || !res || typeof res !== "object") {
                        return;
                    }

                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Entity,
                        SubGroupName: LogSubGroupName.Entity,
                        LogName: id ? LogName.UpdateEntity : LogName.AddEntity,
                        actionObject: {
                            Name: finalPayload[`_${entityName}`],
                            FeatureName: selectedSubGroup,
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusbarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload)
                    const apiRes = res as ApiResponse;
                    if (!apiRes.jsonStringOutput) {
                        return;
                    }

                    const parsed: Record<string, unknown> = FnParseJsonSafely(apiRes.jsonStringOutput) as Record<string, unknown>;
                    const entityKey = `_${entityName}`;
                    const entityArray = parsed[entityKey] as { EntID?: string }[] | undefined;
                    const entId = entityArray?.[0]?.EntID;
                    lastAddedEntId.current = entId;
                    if (!entId) {
                        return;
                    }
                    FnHideShowSaveIconForForm("hide");
                    handleShowMessage(
                        isAddMode
                            ? `${relationship} added successfully.`
                            : `${relationship} updated successfully.`
                        , true);
                    // link contact to partner
                    callApiToRefreshData();
                }
            }, statusbarContext);
            return
        }

        if (!parsedRows.TableSections || Object.keys(parsedRows.TableSections).length === 0) return;

        if (id) {
            if (partnerList?.length) {
                const partner = partnerList.find((item) => item.RecID === id);
                const partnerData = Object.values(parsedRows.TableSections)[0];
                const contactData = Object.values(parsedRows.TableSections)[1];
                if (partner?.EntID && partnerData) {
                    for (let index = 0; index < formControlForPartner.partnerControls.length; index++) {
                        const element = formControlForPartner.partnerControls[index];
                        partner[element._AP] = partnerData[element._AP];
                    }
                    let contact = contactsForPartners?.length ? contactsForPartners.find((item) => item.EntID === partner.EntID) : undefined;

                    if (contact && contactData) {
                        for (let index = 0; index < formControlForPartner.contactControls.length; index++) {
                            const element = formControlForPartner.contactControls[index];
                            contact[element._AP] = contactData[element._AP];
                        }
                    } else {
                        contact = {};
                        for (let index = 0; index < formControlForPartner.contactControls.length; index++) {
                            const element = formControlForPartner.contactControls[index];
                            contact[element._AP] = contactData[element._AP];
                        }
                        contact["EntID"] = partner?.EntID;
                        contact["EntityName"] = partner?.EntityName;
                    }

                    lastAddedEntId.current = partner?.EntID;
                    applyDateTimeFields(contact);


                    axiosInterceptor({
                        url: EM.AddUpdateMultipleTableRecords,
                        data: {
                            jsonString: JSON.stringify({
                                _Partner: [partner],
                                "PG.Contact": [contact]
                            })
                        },
                        allowShowLoader: true,
                        setFetchData: (res: unknown, status?: string) => {
                            if (status !== "200" || !res || typeof res !== "object") {
                                return;
                            }

                            const payload: IFnCreateForensiclog = {
                                logType: 'UserAction',
                                GroupName: LogGroupName.ForensicLogTemplate,
                                _Forensiclog: LogSubGroupName.Entity,
                                SubGroupName: LogSubGroupName.Entity,
                                LogName: id ? LogName.UpdateEntity : LogName.AddEntity,
                                actionObject: {
                                    Name: partner[`_${entityName}`],
                                    FeatureName: selectedSubGroup,
                                },
                                sessionContext: sessionContext,
                                statusBarContext: statusbarContext,
                                RefTableItems: mainAppContext.refTableRecords
                            }
                            FnCreateForensiclog(payload)
                            const apiRes = res as ApiResponse;
                            if (!apiRes.jsonStringOutput) {
                                return;
                            }
                            FnHideShowSaveIconForForm("hide");
                            handleShowMessage(`${relationship} updated successfully.`, true);
                            callApiToRefreshData();
                        }
                    }, statusbarContext);

                }
            }
        }
        else {

            const partnerPayload = buildTablePayload(formControlForPartner.partnerControls, Object.values(parsedRows.TableSections)[0]);
            const contactPayload = buildTablePayload(formControlForPartner.contactControls, Object.values(parsedRows.TableSections)[1]);

            partnerPayload.EntityName = entityName;
            contactPayload.EntityName = entityName;

            // Save Partner
            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({ _Partner: [partnerPayload] })
                },
                allowShowLoader: true,
                setFetchData: async (res: unknown, status?: string) => {
                    if (status !== "200" || !res || typeof res !== "object") {
                        return;
                    }

                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Entity,
                        SubGroupName: LogSubGroupName.Entity,
                        LogName: id ? LogName.UpdateEntity : LogName.AddEntity,
                        actionObject: {
                            Name: partnerPayload[`_${entityName}`],
                            FeatureName: selectedSubGroup,
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusbarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload)
                    const apiRes = res as ApiResponse;
                    if (!apiRes.jsonStringOutput) {
                        return;
                    }

                    const parsed: Record<string, unknown> = FnParseJsonSafely(apiRes.jsonStringOutput) as Record<string, unknown>;

                    const entityKey = `_${entityName}`;
                    const entityArray = parsed[entityKey] as { EntID?: string }[] | undefined;
                    const entId = entityArray?.[0]?.EntID;
                    lastAddedEntId.current = entId;
                    if (!entId) {
                        return;
                    }

                    // link contact to partner
                    contactPayload.EntID = entId;

                    applyDateTimeFields(contactPayload);

                    //  Save Contact
                    axiosInterceptor({
                        url: EM.AddUpdateTableRecord,
                        data: {
                            jsonString: JSON.stringify({ "PG.Contact": [contactPayload] })
                        },
                        allowShowLoader: true,
                        setFetchData: () => {
                            FnHideShowSaveIconForForm("hide");
                            handleShowMessage(
                                isAddMode
                                    ? `${relationship} added successfully.`
                                    : `${relationship} updated successfully.`
                                , true);
                            callApiToRefreshData();
                        }
                    }, statusbarContext);
                }
            }, statusbarContext);
        }
    };


    const handleSelectListItem = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string | undefined): void => {
        setIsAddMode(false);
        if (actionCode) {
            const filteredRecord = actionListItems.find((item) => { return item.actionCode === actionCode });
            if (filteredRecord) {
                setSelectedItem(filteredRecord);
            }
            else {
                setConfirmMessage("Record not found for actionCode : " + actionCode);
                setIsShowOk(true);
                setIsShowConfirmDialog(true);
            }
        }
        else {
            setConfirmMessage("actionCode not found");
            setIsShowOk(true);
            setIsShowConfirmDialog(true);
        }
    }

    const handleActionButtonClick = (event: any, actionCode?: string | undefined, payload?: any) => {
        if (actionCode === "add") {
            setSelectedItem(null);
            setIsAddMode(true);
        }
        else if (actionCode === "delete" && selectedItem) {
            const handleCreateMessageApiResponse = (createMessageApiResponse: unknown, status?: string) => {
                if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                    setIsShowOk(false);
                    setConfirmMessage(createMessageApiResponse.finalMessage as string);
                    setIsShowConfirmDialog(true);
                }
            }
            axiosInterceptor({
                url: LOG.CreateMessage,
                data: {
                    projectInitial: "Common",
                    msgID: "151"
                },
                setFetchData: handleCreateMessageApiResponse
            }, statusbarContext)
        }
    }

    const handleYesButtonClick = () => {
        lastAddedEntId.current = undefined;
        const handleApiCallDeleteTableRecords = (deleteResponse: unknown, status?: string) => {
            if (deleteResponse === "" && status === "200") {
                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Entity,
                    SubGroupName: LogSubGroupName.Entity,
                    LogName: LogName.DeleteEntity,
                    actionObject: {
                        Name: selectedItem?.label,
                        FeatureName: selectedSubGroup,
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusbarContext,
                    RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)
                callApiToRefreshData();
            }
        }
        const cleanedProfile = selectedItem?.profileString ? FnRemovePrefixFromJsonKeys(selectedItem.profileString) : undefined;
        const profileString = cleanedProfile ? FnParseJsonSafely(cleanedProfile) : [];
        if (profileString.length && profileString[0].RecID && profileString[0].EntID) {
            axiosInterceptor({
                url: EM.DeleteTableRecords,
                data: {
                    tableName: `_${EntityNameEnums.Partner}`,
                    recIDs: selectedItem?.actionCode,
                    entIDs: profileString[0].EntID
                },
                setFetchData: handleApiCallDeleteTableRecords
            }, statusbarContext);
        }
        setIsShowConfirmDialog(false);
    }

    const handleNoButtonClick = () => {
        setIsShowConfirmDialog(false);
    }

    return (
        <div key={uniqueName} className="nz-wh-100 nz-partners-container">
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-wh-100 nz-partner-list-container nz-pane-1">
                    <div className='nz-wh-100 nz-partner-list-content'>
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
                            disableAdd={selectedItem === null || false}
                            disableDelete={!selectedItem || selectedItem.IsNZ}
                            hasRequestedData={hasRequestedPartners && !isPartnerListLoading}
                            isLoading={isPartnerListLoading || !hasRequestedPartners}
                        />
                    </div></SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-wh-100 nz-d-flex-column nz-align-center">
                    <div className='nz-wh-100 nz-form-controls-container' onKeyDownCapture={handleFormControlsKeyDown}
                        onKeyDown={handleFormControlsBubbleKeyDown}>
                        {formControls?.length && <SettingsLibForm
                            uniqueName={`${uniqueName}-fc`}
                            controls={formControls}
                            profileString={selectedItem?.profileString}
                            allowShowHeader={relationship === "Tag" || relationship === "Team" ? false : true}
                            headerText={selectedItem ? `Edit ${selectedItem?.label}` : `Add ${relationship}`}
                            handleSaveForm={handleSaveForm}
                            isAutoSave={false}
                            measurementUnit={getMuForSite()}
                            container={"Partner"}
                            allowTestIcon={false}
                            isAddressFormRequired={relationship === "Tag" || relationship === "Team" ? false : true}
                            id={selectedItem?.RecID || selectedItem?.actionCode}
                            isDisableForm={relationship === "Tag" && FnIsTruthyFlag(selectedItem?.IsNZ)} />}
                    </div>
                </SplitterPanel>
            </Splitter>

            <YesNoFormContainer uniqueName={`${uniqueName}-confirm`}
                isOpen={isShowConfirmDialog}
                message={confirmMessage}
                handleYesButtonClick={handleYesButtonClick}
                handleNoButtonClick={handleNoButtonClick}
                showOkButton={isShowOk}
                handleOkButtonClick={() => {
                    setIsShowConfirmDialog(false);
                }} />
        </div>
    )
}

export { ManagePartners }
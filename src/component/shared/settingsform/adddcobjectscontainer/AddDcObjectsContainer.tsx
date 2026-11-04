
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { FormElementsRenderer, IFormData, IFormElements } from "@n20a/libform";
import type { IAddress } from '@n20a/libcountry'
import { Back24x24, Close24x24, Save24x24 } from "@n20a/libicon";

// Defers the ~9 MB country-state-city dataset until the address form is actually shown.
const AddressForm = lazy(() => import('@n20a/libcountry').then(m => ({ default: m.AddressForm })));
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { useMainAppContext } from "../../context/hooks/MainAppHooks";
import { useStatusBarContext } from "../../context/hooks/StatusBarHooks";
import '../../allcss/settingsform/AddDcObjectsContainer.css'
import { EM, SESSION } from "../../interceptors/EndPoints";
import { getMuForSite } from "../../context/contextandprovider/ExplorerTree";
import { getDiagnosticLevelData } from "../../context/contextandprovider/CommonVariable";
import { EntityNameEnums } from "../../alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { LogGroupName, LogName, LogSubGroupName } from "../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useSessionContext } from "../../context/hooks/SessionHooks";
import { FnReturnNodeNameObject } from "../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnCreateForensiclog } from "../../../appcontainer/allcommon/FnCreateForensiclog";
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { FnBuildFormElementsFromDataset } from "../../allcommon/sidebar/FnBuildFormElementsFromDataset";
import { FnConvertTimeToDateTime } from "../../allcommon/basic/FnConvertTimeToDateTime";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { IImage } from "../../allinterface/basic/IImage";
import { IAddDcObjectsContainer } from "../../allinterface/settingsform/IAddDcObjectsContainer"
import { IPropertyColumn } from "../../allinterface/sidebar/IPropertyFormContainer";
import { IErrorData } from "../../allinterface/IApiResponse";
import { IFnCreateForensiclog } from "../../../appcontainer/allinterface/IFnCreateForensiclog";
import { DirtyFlagImage } from "../../basic/dirtyflagimage/DirtyFlagImage";
import { Label } from "../../basic/label/Label";
import { ActionImage } from "../../basic/actionimage/ActionImage";
import { YesNoFormContainer } from "../../basic/yesnoformcontainer/YesNoFormContainer";
import { addressFieldNames } from "../../../constants/Misc";

type IPgColumnDef = {
    PName: string;
    RequiredToAddRecord?: boolean;
    RequiredToUpdateRecord?: boolean;
    [key: string]: unknown;
};

const AddDcObjectsContainer = ({ uniqueName, entityToAdd, selectedNode, treeData, pgTableToAdd, allowLog, parentNodes, allowBackButton, allowCustomHeader, allowCloseButton, handleRefreshForNewRecord }: IAddDcObjectsContainer) => {
    const [entityTables, setEntityTables] = useState<Record<string, any>[]>([]);
    const [formElements, setFormElements] = useState<IFormElements>();
    const [pgClassRecord, setPgClassRecord] = useState<Record<string, any>>();
    const [updatedProperties, setUpdatedProperties] = useState<Record<string, unknown>>();
    const [pgRecord, setPgRecord] = useState<Record<string, any>>();
    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState<boolean>();
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>();
    const [updatedRecord, setUpdatedRecord] = useState<Record<string, any>>();
    const [updatedAddress, setUpdatedAddress] = useState<IAddress>();
    const [isAddressFormShow, setIsAddressFormShow] = useState<boolean>(false);
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext()

    useEffect(() => {
        axiosInterceptor(
            {
                url: EM.GetTableVsProperty,
                allowShowLoader: true,
                data: {
                    entityName: entityToAdd,
                    tableNames: "",
                },
                setFetchData: (apiResponse: unknown, status?: string) => {
                    setEntityTables(
                        status === "200" && Array.isArray(apiResponse)
                            ? apiResponse
                            : []
                    );
                },
            },
            statusBarContext
        );
    }, [entityToAdd])

    const userBasicRole = useMemo(() => {
        return sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "loginuserbasicrolename")?.SessionValue
    }, [sessionContext.SessionList])

    useEffect(() => {
        if (!entityTables.length) return;
        let pgClassTable = entityTables.find(t => t.entityPgClass);

        if (!pgClassTable?.properties) {
            setLoading(false);
            return;
        }

        const pgTable =
            pgTableToAdd ?
                entityTables.find(
                    t =>
                        t.tableName?.toLowerCase() === pgTableToAdd.toLowerCase()
                ) : undefined;

        const loadForm = async () => {
            try {
                const columns = FnParseJsonSafely(pgClassTable.properties) as IPropertyColumn[];

                const pgColumns =
                    pgTable?.properties
                        ? (FnParseJsonSafely(pgTable.properties) as IPropertyColumn[])
                        : [];
                const addressControls = pgColumns.filter(control =>
                    addressFieldNames.has(control.PName?.toLowerCase() ?? "")
                );

                // Remove address controls from normal controls
                const pgControlsForForm = pgColumns.filter(control =>
                    !addressFieldNames.has(control.PName?.toLowerCase() ?? "")
                );


                if (addressControls.length) {

                    const getDefaultValue = (fieldName: string): string => {
                        const control = addressControls.find(
                            item =>
                                item.PName?.toLowerCase() ===
                                fieldName.toLowerCase()
                        );

                        return String(control?.DefaultValue ?? "");
                    };
                    let addressValue: IAddress;

                    const gps = getDefaultValue("GPS");

                    const [latitude = "", longitude = ""] = gps
                        .split(",")
                        .map(value => value.trim());

                    addressValue = {
                        Address1: getDefaultValue("Address1"),
                        Address2: getDefaultValue("Address2"),
                        City: getDefaultValue("City"),
                        State: getDefaultValue("State"),
                        Country: getDefaultValue("Country"),
                        Zip: getDefaultValue("Zip"),
                        CountryCode: getDefaultValue("CountryCode"),
                        Latitude: latitude,
                        Longitude: longitude,
                        TimezoneOffset: getDefaultValue("TimezoneOffset")
                    };
                    setUpdatedAddress(addressValue);
                    setIsAddressFormShow(true);
                }
                setPgClassRecord(pgClassTable);
                setPgRecord(pgTable);
                const myFormElements = FnBuildFormElementsFromDataset(
                    addressControls.length ? "" : "Add " + entityToAdd,
                    {
                        [pgClassTable.tableName]: {
                            label: pgClassTable.tableLabel || pgClassTable.tableName,
                            columns: columns
                        },
                        ...(pgTable?.tableName
                            ? {
                                [pgTable.tableName]: {
                                    label: pgTable.tableLabel || pgTable.tableName,
                                    columns: pgControlsForForm
                                }
                            }
                            : {})
                    },
                    {
                        [pgClassTable.tableName]: updatedRecord ? [updatedRecord] : [],
                        ...(pgTable?.tableName
                            ? {
                                [pgTable.tableName]: []
                            }
                            : {})
                    },
                    statusBarContext,
                    mainAppContext.refTableRecords,
                    getMuForSite(),
                    getDiagnosticLevelData(),
                    false,
                    undefined,
                    entityToAdd,
                    selectedNode,
                    parentNodes,
                    undefined,
                    true,
                    userBasicRole ?? undefined
                );
                setFormElements(myFormElements);
            } catch (e) {
                console.error("Failed to load form", e);
            } finally {
                setLoading(false);
            }
        };

        loadForm();

    }, [entityTables, selectedNode, pgTableToAdd, parentNodes, updatedRecord, userBasicRole])

    const handleSaveForm = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        if (!updatedProperties || !pgClassRecord?.properties) return;
        const pgClassData: Record<string, any> = {};
        const pgData: Record<string, any> = {};

        try {
            const pgClassColumns = FnParseJsonSafely(pgClassRecord.properties) as { PName: string }[];

            const pgColumns =
                pgRecord?.properties
                    ? (FnParseJsonSafely(pgRecord.properties) as { PName: string;[key: string]: string | boolean | number | unknown }[])
                    : [];
            const updatedKeys = Object.keys(updatedProperties);
            pgClassColumns.forEach((col) => {
                const classKeyPrefix = `${pgClassRecord.tableName}_${col.PName}_`;
                const classKey = updatedKeys.find(k => k.startsWith(classKeyPrefix));

                if (classKey) {
                    let value = updatedProperties[classKey];

                    if (col.PName?.toLowerCase() === "parentid") {
                        value = selectedNode?.NodeEntID;
                    }

                    // If Measurement is Europe, set DateFormat accordingly
                    if (col.PName?.toLowerCase() === "measurement") {
                        pgClassData["DateFormat"] =
                            value?.toString().toLowerCase() === "europe"
                                ? "dd/MM/yyyy"
                                : "MM/dd/yyyy";
                    }

                    pgClassData[col.PName] = value !== "" ? value : undefined;
                }
            });

            const oldPgClassRow = {};
            pgClassData["LastUpdated"] = undefined;

            const mergedPgClassRow = {
                ...oldPgClassRow,   // old values
                ...pgClassData      // new values override
            };



            const payload = {
                [pgClassRecord.tableName]: [mergedPgClassRow]
            }

            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payload)
                },
                allowShowLoader: true,
                setFetchData: (_resp: unknown, status?: string) => {
                    if (status === "200" && _resp &&
                        typeof _resp === "object" &&
                        "jsonStringOutput" in _resp) {

                        try {
                            const parsedData = FnParseJsonSafely(_resp.jsonStringOutput as string);
                            if (parsedData && typeof parsedData === "object" && parsedData[pgClassRecord.tableName] && Array.isArray(parsedData[pgClassRecord.tableName]) && parsedData[pgClassRecord.tableName].length) {
                                const newAddedEntID = parsedData[pgClassRecord.tableName][0].EntID;
                                const newAddedName = parsedData[pgClassRecord.tableName][0][pgClassRecord.tableName];


                                if (pgRecord?.tableName && newAddedEntID) {
                                    const hasMissingRequiredPgField = pgColumns.some(col => {
                                        if (
                                            !(
                                                col.RequiredToAddRecord ||
                                                col.RequiredToUpdateRecord
                                            )
                                        ) {
                                            return false;
                                        }

                                        const pgKeyPrefix =
                                            `${pgRecord!.tableName}_${col.PName}_`;

                                        const pgKey = updatedKeys.find(k =>
                                            k.startsWith(pgKeyPrefix)
                                        );

                                        // First check updatedProperties
                                        let value = pgKey
                                            ? updatedProperties[pgKey]
                                            : undefined;

                                        // If not available, check updatedAddress
                                        if (
                                            isAddressFormShow &&
                                            (value === undefined || value === "") &&
                                            updatedAddress
                                        ) {
                                            value =
                                                updatedAddress[
                                                col.PName as keyof IAddress
                                                ];
                                        }

                                        return (
                                            value === undefined ||
                                            value === null ||
                                            value === ""
                                        );
                                    });

                                    if (hasMissingRequiredPgField) {
                                        // Call callback to refresh
                                        handleRefreshForNewRecord?.(
                                            newAddedEntID,
                                            newAddedName
                                        );

                                        return;
                                    }


                                    // Build pgData
                                    pgColumns.forEach(col => {
                                        const pgKeyPrefix =
                                            `${pgRecord!.tableName}_${col.PName}_`;

                                        const pgKey = updatedKeys.find(k =>
                                            k.startsWith(pgKeyPrefix)
                                        );

                                        // First get from updatedProperties
                                        let value = pgKey
                                            ? updatedProperties[pgKey]
                                            : undefined;

                                        // If not available, get from updatedAddress
                                        if (
                                            isAddressFormShow &&
                                            (value === undefined || value === "") &&
                                            updatedAddress
                                        ) {
                                            if (col.PName === "GPS") {
                                                const { Latitude, Longitude } = updatedAddress;

                                                value =
                                                    Latitude && Longitude
                                                        ? `${Latitude},${Longitude}`
                                                        : undefined;
                                            } else {
                                                value =
                                                    updatedAddress[
                                                    col.PName as keyof IAddress
                                                    ];
                                            }
                                        }

                                        // Add value if found in either source
                                        if (value !== undefined) {
                                            pgData[col.PName] =
                                                value !== "" ? value : undefined;
                                        }
                                    });
                                    let mergedPgRow: Record<string, any> | undefined;

                                    if (pgRecord?.tableName) {
                                        const oldPgRow = {};
                                        pgData["LastUpdated"] = undefined;
                                        mergedPgRow = {
                                            ...oldPgRow,
                                            ...pgData
                                        };
                                    }
                                    if (mergedPgRow) {
                                        mergedPgRow["EntID"] = newAddedEntID;

                                    }
                                    const payload = {
                                        [pgRecord.tableName]: [mergedPgRow]
                                    }
                                    axiosInterceptor({
                                        url: EM.AddUpdateTableRecord,
                                        data: {
                                            jsonString: JSON.stringify(payload)
                                        },
                                        allowShowLoader: true,
                                        setFetchData: (_respSub: unknown, status?: string) => {
                                            if (status === "200" && _respSub !== undefined) {
                                                //call callback to refresh 
                                                handleRefreshForNewRecord?.(newAddedEntID, newAddedName)
                                            }
                                            else {
                                                handleRefreshForNewRecord?.(newAddedEntID, newAddedName)
                                            }
                                        }
                                    }, statusBarContext);
                                }
                                else {
                                    handleRefreshForNewRecord?.(newAddedEntID, newAddedName)
                                    return;
                                }
                            }
                        } catch (error) {
                            console.error('error :', error);

                        }
                    }
                }
            }, statusBarContext);
        } catch (error) {
            console.error("Failed to map properties", error);
        }
    }

    const areAllRequiredFieldsFilled = (
        values: Record<string, unknown>,
        formElement: IFormElements
    ): boolean => {
        const requiredFields = Object.values(
            formElement?.TableSections ?? {}
        )
            .flat()
            .filter(control => control.required && !control.disabled);

        return requiredFields.every(control => {
            // Exact key match
            let key = Object.prototype.hasOwnProperty.call(
                values,
                control.key
            )
                ? control.key
                : undefined;

            // Dynamic key match
            if (!key) {
                key = Object.keys(values).find(valueKey =>
                    valueKey.startsWith(control.key)
                );
            }

            if (!key) return false;

            const value = values[key];

            // null / undefined
            if (value === null || value === undefined) {
                return false;
            }

            // Empty string
            if (
                typeof value === "string" &&
                value.trim() === ""
            ) {
                return false;
            }

            return true;
        });
    };

    const isAddressValueFilled = (value: unknown): boolean => {
        if (value === null || value === undefined) {
            return false;
        }
        if (typeof value === "string" && value.trim() === "") {
            return false;
        }
        return true;
    };

    const getAddressFieldValue = (
        address: IAddress,
        pName: string
    ): unknown => {
        if (pName === "GPS") {
            const { Latitude, Longitude } = address;
            return Latitude && Longitude
                ? `${Latitude},${Longitude}`
                : undefined;
        }
        return address[pName as keyof IAddress];
    };

    const areAddressRequiredFieldsFilled = (
        address: IAddress | undefined
    ): boolean => {
        if (!address) {
            return false;
        }

        // Country is mandatory when address section is shown.
        if (!isAddressValueFilled(address.Country)) {
            return false;
        }

        if (!pgRecord?.properties) {
            return true;
        }

        const pgColumns = FnParseJsonSafely(pgRecord.properties) as IPgColumnDef[];
        return pgColumns.every((col) => {
            const pName = col.PName ?? "";
            if (!addressFieldNames.has(pName.toLowerCase())) {
                return true;
            }
            if (!col.RequiredToAddRecord && !col.RequiredToUpdateRecord) {
                return true;
            }
            return isAddressValueFilled(getAddressFieldValue(address, pName));
        });
    };

    const canEnableSave = (
        values: Record<string, unknown> | undefined,
        address: IAddress | undefined
    ): boolean => {
        if (formElements && values && !areAllRequiredFieldsFilled(values, formElements)) {
            return false;
        }

        if (isAddressFormShow) {
            return areAddressRequiredFieldsFilled(address);
        }

        return !!values && !!formElements;
    };

    const handleValueChange = (
        values: Record<string, unknown>
    ): void => {
        setUpdatedProperties(values);
        setIsDirty(canEnableSave(values, updatedAddress));
    };

    const handleSavePropertyForm = async (formData: IFormData) => {
        if (!formData?.TableSections || !Object.keys(formData?.TableSections).length || !pgClassRecord?.properties) return;


        const pgClassData: Record<string, any> = {};
        const pgData: Record<string, any> = {};

        try {
            const pgClassColumns = FnParseJsonSafely(pgClassRecord.properties) as { PName: string }[];

            const pgColumns =
                pgRecord?.properties
                    ? (FnParseJsonSafely(pgRecord.properties) as {
                        PName: string;[key: string]: string | boolean | number | unknown
                    }[])
                    : [];
            const pgClassUpdatedData = formData?.TableSections[pgClassRecord.tableLabel];
            if (!pgClassUpdatedData || typeof pgClassUpdatedData !== "object") return
            pgClassColumns.forEach((col) => {

                if (col.PName) {
                    let value: string | boolean | number | any = pgClassUpdatedData[col.PName];


                    if (col.PName?.toLowerCase() === "parentid") {
                        value = selectedNode?.NodeEntID;
                    }
                    pgClassData[col.PName] = value !== "" ? value : undefined;
                }
            });
            if (entityToAdd === EntityNameEnums.Bin && !pgClassData["ParentID"]) {
                pgClassData["ParentID"] = selectedNode?.NodeEntID
            }
            const oldPgClassRow: Record<string, any> = {};
            pgClassData["LastUpdated"] = undefined;
            const mergedPgClassRow = {
                ...oldPgClassRow,   // old values
                ...pgClassData      // new values override
            };
            if (entityToAdd === EntityNameEnums.NZLicenseKey) {
                const licenseKey = mergedPgClassRow[`_${EntityNameEnums.NZLicenseKey}`];

                if (licenseKey) {
                    if (licenseKey.length !== 24) {
                        setConfirmMessage("License Key must be 24 characters long");
                        setIsConfirmOpen(true);
                        return;
                    }
                    try {

                        const response = await new Promise((resolve, reject) => {

                            axiosInterceptor({
                                url: SESSION.ValidateLicense,
                                data: {
                                    subscription: licenseKey
                                },
                                allowShowLoader: true,
                                setFetchData: (_resp: unknown, status?: string, errData?: IErrorData[]) => {

                                    if (status === "200") {
                                        resolve(_resp);
                                    } else {
                                        reject(errData);
                                    }

                                }
                            }, statusBarContext);

                        });
                        if (response && typeof response === "object") {

                            const subscriptionDetails = response as Record<string, any>;

                            pgClassColumns.forEach(col => {

                                if (!col?.PName) return;

                                const columnName = col.PName;

                                // try to find matching key from API response
                                const apiKey = Object.keys(subscriptionDetails).find(
                                    k => k.toLowerCase() === columnName.replace(/^_/, "").toLowerCase()
                                );


                                if (columnName == "StartDate" && subscriptionDetails.dateStart) {
                                    mergedPgClassRow[columnName] = FnConvertDateToUtcOrUtcToDate(subscriptionDetails.dateStart as string, false, false);
                                } else if (columnName == "EndDate" && subscriptionDetails.dateEnd) {
                                    mergedPgClassRow[columnName] = FnConvertDateToUtcOrUtcToDate(subscriptionDetails.dateEnd as string, false, false);
                                } else if (columnName == "UserCount" && subscriptionDetails.count) {
                                    mergedPgClassRow[columnName] = subscriptionDetails.count;
                                }
                                else if (apiKey) {
                                    mergedPgClassRow[columnName] = subscriptionDetails[apiKey] ?? undefined;
                                }

                            });

                        }

                    } catch (err) {

                        const errors = err as IErrorData[];

                        if (errors?.length) {
                            const errorRecord = errors.find((item) => item.errCode > 0);
                            if (errorRecord) {
                                setConfirmMessage(errorRecord.errString);
                                setIsConfirmOpen(true);
                                return;
                            }
                        }
                        setConfirmMessage("Invalid License Key.");
                        setIsConfirmOpen(true);
                        return;
                    }
                }
            }
            const payload = {
                [pgClassRecord.tableName]: [mergedPgClassRow]
            }

            axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payload)
                },
                allowShowLoader: true,
                setFetchData: async (_resp: unknown, status?: string) => {
                    if (status === "200" && _resp &&
                        typeof _resp === "object" &&
                        "jsonStringOutput" in _resp) {

                        try {
                            const parsedData = FnParseJsonSafely(_resp.jsonStringOutput as string);
                            if (parsedData && typeof parsedData === "object" && parsedData[pgClassRecord.tableName] && Array.isArray(parsedData[pgClassRecord.tableName]) && parsedData[pgClassRecord.tableName].length) {
                                const newAddedEntID = parsedData[pgClassRecord.tableName][0].EntID;
                                const newAddedName = parsedData[pgClassRecord.tableName][0][pgClassRecord.tableName];
                                if (allowLog) {

                                    if (pgClassRecord.tableName === "_User" || pgClassRecord.tableName === "_Role" || pgClassRecord.tableName === "_LicenseKey"
                                        || pgClassRecord.tableName === "_Team") {
                                        //log to create users , role 
                                        let logName: string;
                                        if (pgClassRecord.tableName === "_User") {
                                            logName = LogName.AddUser
                                        } else if (pgClassRecord.tableName === "_Role") {
                                            logName = LogName.AddRole
                                        } else if (pgClassRecord.tableName === "_LicenseKey") {
                                            logName = LogName.AddLicense
                                        } else if (pgClassRecord.tableName === "_Team") {
                                            logName = LogName.AddTeam
                                        } else {
                                            logName = ""
                                        }
                                        if (logName) {
                                            const payload: IFnCreateForensiclog = {
                                                logType: 'UserAction',
                                                GroupName: LogGroupName.ForensicLogTemplate,
                                                _Forensiclog: LogSubGroupName.Auth,
                                                SubGroupName: LogSubGroupName.Auth,
                                                LogName: logName,
                                                actionObject: {
                                                    newUserName: newAddedName,
                                                    roleName: newAddedName
                                                },
                                                sessionContext: sessionContext,
                                                statusBarContext: statusBarContext,
                                                RefTableItems: mainAppContext.refTableRecords
                                            }
                                            FnCreateForensiclog(payload)
                                        }
                                    }
                                } else {

                                    if (pgClassRecord.tableName === "_Site" || pgClassRecord.tableName === "_Room" || pgClassRecord.tableName === "_Floor" || pgClassRecord.tableName === "_Bin") {
                                        const data = treeData && await FnReturnNodeNameObject(treeData, pgClassRecord.tableName === "_Bin" ? selectedNode?.NodeEntID : newAddedEntID)
                                        const payload: IFnCreateForensiclog = {
                                            logType: 'UserAction',
                                            GroupName: LogGroupName.ForensicLogTemplate,
                                            _Forensiclog: pgClassRecord.tableName === "_Bin" ? LogSubGroupName.InventoryStoreandBins : LogSubGroupName.DataCenterHierarchy,
                                            SubGroupName: pgClassRecord.tableName === "_Bin" ? LogSubGroupName.InventoryStoreandBins : LogSubGroupName.DataCenterHierarchy,
                                            LogName: LogName.AddEntity,
                                            actionObject: {
                                                Site: data?.Site,
                                                Room: data?.Room,
                                                Floor: data?.Floor,
                                                Inventory: data?.Inventory,
                                                Store: data?.Store,
                                                Bin: mergedPgClassRow[pgClassRecord.tableName]
                                            },
                                            sessionContext: sessionContext,
                                            statusBarContext: statusBarContext,
                                            RefTableItems: mainAppContext.refTableRecords
                                        }
                                        FnCreateForensiclog(payload)
                                    }
                                }
                                if (pgRecord?.tableName && newAddedEntID && pgRecord?.tableLabel) {
                                    const pgTableUpdatedData = formData?.TableSections[pgRecord.tableLabel];
                                    const hasMissingRequiredPgField = pgColumns.some(col => {
                                        if (!(col.RequiredToAddRecord || col.RequiredToUpdateRecord)) return false;

                                        const value = col.PName && pgTableUpdatedData
                                            ? pgTableUpdatedData[col.PName]
                                            : undefined;

                                        return value === undefined || value === "";
                                    });
                                    if (hasMissingRequiredPgField) {
                                        //call callback to refresh
                                        handleRefreshForNewRecord?.(newAddedEntID, newAddedName, 'save')
                                        return;
                                    }
                                    pgColumns.forEach((col) => {


                                        if (col.PName) {
                                            let value: string | number | boolean | any = pgTableUpdatedData[col.PName];


                                            pgData[col.PName] = value !== "" ? value : undefined;
                                        }
                                    });
                                    let mergedPgRow: Record<string, any> | undefined;

                                    if (pgRecord?.tableName) {
                                        const oldPgRow = {};
                                        pgData["LastUpdated"] = undefined;
                                        mergedPgRow = {
                                            ...oldPgRow,
                                            ...pgData
                                        };
                                    }
                                    if (mergedPgRow) {
                                        mergedPgRow["EntID"] = newAddedEntID;

                                    }

                                    if (mergedPgRow?.["StartTime"] || mergedPgRow?.["EndTime"]) {
                                        mergedPgRow["StartTime"] = FnConvertTimeToDateTime(mergedPgRow?.["StartTime"]);
                                        mergedPgRow["EndTime"] = FnConvertTimeToDateTime(mergedPgRow?.["EndTime"]);

                                    }
                                    const payload = {
                                        [pgRecord.tableName]: [mergedPgRow]
                                    }
                                    axiosInterceptor({
                                        url: EM.AddUpdateTableRecord,
                                        data: {
                                            jsonString: JSON.stringify(payload)
                                        },
                                        allowShowLoader: true,
                                        setFetchData: (_respSub: unknown, status?: string) => {
                                            if (status === "200" && _respSub !== undefined) {
                                                //call callback to refresh 
                                                handleRefreshForNewRecord?.(newAddedEntID, newAddedName, 'save')
                                            }
                                            else {
                                                handleRefreshForNewRecord?.(newAddedEntID, newAddedName, 'save')
                                            }
                                        }
                                    }, statusBarContext);
                                }
                                else {
                                    handleRefreshForNewRecord?.(newAddedEntID, newAddedName, 'save')
                                    return;
                                }
                            }
                        } catch (error) {
                            console.error('error :', error);

                        }
                    }
                    else {
                        if (entityToAdd === EntityNameEnums.NZLicenseKey) {
                            setUpdatedRecord(mergedPgClassRow)
                        }
                    }
                }
            }, statusBarContext);
        } catch (error) {
            console.error("Failed to map properties", error);
        }
    }
    const handleClickX = () => {
        handleRefreshForNewRecord?.("", "", 'close')
    }

    const handleValueChangeAddress = (address: IAddress) => {
        // Check whether address actually changed
        const isAddressChanged =
            JSON.stringify(updatedAddress) !== JSON.stringify(address);

        // No address change → don't update save button
        if (!isAddressChanged) return;

        setUpdatedAddress(address);
        setIsDirty(canEnableSave(updatedProperties, address));
    };
    const renderedFormElements = useMemo(() => {
        if (!formElements) return undefined;

        return {
            ...formElements,
            onSave: isAddressFormShow ? undefined : handleSavePropertyForm,
            onX: allowCloseButton && !isAddressFormShow ? handleClickX : undefined
        };
    }, [formElements, isAddressFormShow]);
    const saveImageData: IImage = {
        source: <Save24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Save changes",
        uniqueName: 'user-profile-isave',
        type: 'svg'
    }
    const backImageData: IImage = {
        source: <Back24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Click to go back",
        uniqueName: 'user-profile-iback',
        type: 'svg'
    }
    const closeImageData: IImage = {
        source: <Close24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Click to Close",
        uniqueName: 'user-profile-iback',
        type: 'svg'
    }
    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading properties...</div>;
    }

    if ((!formElements || !Object.keys(formElements.TableSections).length)) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No properties found</div>;
    }

    return (
        <div className="nz-add-dc-objects-container" key={uniqueName}>
            {allowCustomHeader || isAddressFormShow ? <div className='nz-sub-header nz-prop-form-container-action'>
                <Label uniqueName={uniqueName + 'header'} label={"Add " + entityToAdd} />
                <div className='nz-header-action'>
                    {allowBackButton ? <ActionImage
                        uniqueName={''}
                        image={backImageData} w={'var(--node_height)'} h={'var(--node_height)'}
                        actionCode={'back'} handleMouse={function (event: any, actionCode?: string, payload?: any): void {
                            handleRefreshForNewRecord?.("", "", 'back')
                        }} /> : <></>}
                    {isDirty && <div className={'nz-save-button'}>
                        <DirtyFlagImage uniqueName={uniqueName + 'save-icon'}
                            isDirty={isDirty}
                            bgColor={"#FFFF99"}
                            image={saveImageData} w={'var(--node_height)'} h={'var(--node_height)'}
                            handleMouse={handleSaveForm} />

                    </div>}
                    {allowCloseButton ? <ActionImage
                        uniqueName={''}
                        image={closeImageData} w={'var(--node_height)'} h={'var(--node_height)'}
                        actionCode={'back'} handleMouse={function (event: any, actionCode?: string, payload?: any): void {
                            handleClickX()
                        }} /> : <></>}
                </div>
            </div> : <></>}
            <div className='nz-add-dc-objects-content'>


                {renderedFormElements ? <FormElementsRenderer onValuesChange={handleValueChange}
                    formElements={renderedFormElements} embedded={isAddressFormShow ? true : false} /> : <></>}

                {updatedAddress && isAddressFormShow ? <div style={{ margin: "6px 0px" }}>
                    <Suspense fallback={null}>
                        <AddressForm
                            key={"address-form"}
                            initialAddress={updatedAddress}
                            onChange={handleValueChangeAddress}
                        />
                    </Suspense>
                </div> : <></>}
            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'auth-confirm'}
                message={confirmMessage ?? ""}
                showOkButton={true}
                handleOkButtonClick={() => {
                    setIsConfirmOpen(false)
                }} />
        </div>
    )
}

export { AddDcObjectsContainer }    

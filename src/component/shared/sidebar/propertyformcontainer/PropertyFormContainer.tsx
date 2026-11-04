
import { FormElementsRenderer, IFormData, IFormElements } from '@n20a/libform'
import '@n20a/libform/style.css'
import '../../allcss/sidebar/PropertyFormContainer.css'
import { IPropertyColumn, IPropertyFormContainer } from '../../allinterface/sidebar/IPropertyFormContainer'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { axiosInterceptor } from '../../interceptors/Interceptor'
import { EM, NODE } from '../../interceptors/EndPoints'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks'
import { FnNodeGetKebabMenuData } from '../../allcommon/settingsform/FnNodeGetKebabMenuData'
import { FnBuildFormElementsFromDataset } from '../../allcommon/sidebar/FnBuildFormElementsFromDataset'
import { useMainAppContext } from '../../context/hooks/MainAppHooks'
import { Label } from '../../basic/label/Label'
import { IImage } from '../../allinterface/basic/IImage'
import { Back24x24, Save24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { DirtyFlagImage } from '../../basic/dirtyflagimage/DirtyFlagImage'
import { getMuForSite } from '../../context/contextandprovider/ExplorerTree'
import { getDiagnosticLevelData } from '../../context/contextandprovider/CommonVariable'
import { FeaturesThatAllowsPropertyChange, HomeMenus } from '../../../appcontainer/alldefaultprops/Enums'
import { OneToManyFormContainer } from '../onetomanyformcontainer/OneToManyFormContainer'
import { ActionImage } from '../../basic/actionimage/ActionImage'
import { FnConvertTimeToDateTime } from '../../allcommon/basic/FnConvertTimeToDateTime'
import { useSelectedNodeContext } from '../../context/hooks/SelectedNodeHooks'
import { ISelectedNodeProperty } from '../../context/allinterface/ISelectedNode'
import { IFnCreateForensiclog } from '../../../appcontainer/allinterface/IFnCreateForensiclog'
import { FnCreateForensiclog } from '../../../appcontainer/allcommon/FnCreateForensiclog'
import { useSessionContext } from '../../context/hooks/SessionHooks'
import { LogGroupName, LogName, LogSubGroupName } from '../../../appcontainer/alldefaultprops/DefaultPropsForensiclog'
import { FnReturnNodeNameObject } from '../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls'
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely'
import { FnCheckPermissionToEditName, IFeaturePermission } from '../../allcommon/FnCheckPermissionToEditName'
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown'
import { addressFieldNames } from '../../../constants/Misc'
import { AppQA, EntitiesSubGroups, FEnums } from '../../../constants/Feature'
import type { IAddress } from '@n20a/libcountry'

// Defers the ~9 MB country-state-city dataset until the address form is actually shown.
const AddressForm = lazy(() => import('@n20a/libcountry').then(m => ({ default: m.AddressForm })));

type IEntityTable = Record<string, unknown>;
type IPropertyRow = Record<string, unknown>;
type IKebabMenuData = Record<string, IPropertyRow[]>;
type IPgColumnDef = { PName: string; RequiredToAddRecord?: boolean; RequiredToUpdateRecord?: boolean;[key: string]: unknown };

const SESSION_EDIT_PERMISSION_VARS = ["AppQAName", "AppQAMenuName", "AppQAFeatureName", "FeatureName"] as const;
type ISessionEditPermissionVar = (typeof SESSION_EDIT_PERMISSION_VARS)[number];

// Parses the session edit permission key built from SESSION_EDIT_PERMISSION_VARS.
const parseSessionEditPermissionKey = (key: string): Record<ISessionEditPermissionVar, string> => {
    const values: Record<ISessionEditPermissionVar, string> = {
        AppQAName: "",
        AppQAMenuName: "",
        AppQAFeatureName: "",
        FeatureName: "",
    };
    key.split("|").forEach((part) => {
        const colonIndex = part.indexOf(":");
        if (colonIndex === -1) return;
        const variableName = part.slice(0, colonIndex);
        if (SESSION_EDIT_PERMISSION_VARS.includes(variableName as ISessionEditPermissionVar)) {
            values[variableName as ISessionEditPermissionVar] = part.slice(colonIndex + 1);
        }
    });
    return values;
};

// Parses property column definitions from a JSON properties string.
const parsePropertyColumns = (properties: string): IPropertyColumn[] =>
    FnParseJsonSafely<IPropertyColumn[], IPropertyColumn[]>(properties, { fallback: [] });

// Parses pg column definitions including required-field flags from a JSON string.
const parsePgColumnDefs = (properties: string): IPgColumnDef[] =>
    FnParseJsonSafely<IPgColumnDef[], IPgColumnDef[]>(properties, { fallback: [] });

// Converts StartTime/EndTime fields on a row to datetime format when present.
const applyDateTimeFields = (
    mergedPgRow: IPropertyRow
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

const PropertyFormContainer = (propertyFormContainerProps: IPropertyFormContainer) => {
    const [entityTables, setEntityTables] = useState<IEntityTable[]>([]);
    const [formElements, setFormElements] = useState<IFormElements>();
    const [pgClassRecord, setPgClassRecord] = useState<IEntityTable>();
    const [pgRecord, setPgRecord] = useState<IEntityTable>();
    const [kebabMenuData, setKebabMenuData] = useState<IKebabMenuData>();
    const [oneToManyTableData, setOneToManyTableData] = useState<IPropertyRow[]>();
    const [isOneToManyPgTable, setIsOneToManyPgTable] = useState<boolean>(false);
    const [isShowMainHeader, setIsShowMainHeader] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [updatedProperties, setUpdatedProperties] = useState<Record<string, unknown>>();
    const [updatedAddress, setUpdatedAddress] = useState<IAddress>();
    const [isAddressFormShow, setIsAddressFormShow] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const selectedNodeContext = useSelectedNodeContext();
    const sessionContext = useSessionContext();
    const { NodeEntityname } = propertyFormContainerProps.selectedNode;
    const {
        selectedNode,
        selectedNodeMenu,
        featureId,
        pgTableToShow,
        showPgTableOneToOne,
        allowBackButton,
        handleRefreshUpdatedRecord
    } = propertyFormContainerProps;
    const isShowPgTableFirst = !!selectedNodeMenu;
    const requestIdRef = useRef(0);
    const [entityTablesEntityName, setEntityTablesEntityName] = useState<string>();

    // Clears property form state so a previous node does not keep showing.
    const clearPropertyFormState = () => {
        setFormElements(undefined);
        setPgClassRecord(undefined);
        setPgRecord(undefined);
        setKebabMenuData(undefined);
        setOneToManyTableData(undefined);
        setIsOneToManyPgTable(false);
        setIsAddressFormShow(false);
        setUpdatedAddress(undefined);
        setUpdatedProperties(undefined);
        setIsDirty(false);
    };

    // Fetches entity table definitions for the selected node entity.
    useEffect(() => {
        if (!NodeEntityname) {
            setEntityTables([]);
            setEntityTablesEntityName(undefined);
            clearPropertyFormState();
            setLoading(false);
            return;
        }

        let cancelled = false;
        setEntityTables([]);
        setEntityTablesEntityName(undefined);
        clearPropertyFormState();
        setLoading(true);
        requestIdRef.current++;

        axiosInterceptor(
            {
                url: EM.GetTableVsProperty,
                allowShowLoader: true,
                data: {
                    entityName: NodeEntityname,
                    tableNames: "",
                },
                setFetchData: (apiResponse: unknown, status?: string) => {
                    if (cancelled) return;
                    setEntityTables(
                        status === "200" && Array.isArray(apiResponse)
                            ? apiResponse as IEntityTable[]
                            : []
                    );
                    setEntityTablesEntityName(NodeEntityname);
                },
            },
            statusBarContext
        ).catch((error) => {
            if (!cancelled) {
                console.error('Failed to fetch entity tables:', error);
            }
        });

        return () => {
            cancelled = true;
            requestIdRef.current++;
        };
    }, [NodeEntityname]);

    // Toggles the main header based on custom action allowance.
    useEffect(() => {
        if (propertyFormContainerProps.isAllowCustomAction) {
            setIsShowMainHeader(true);
        } else {
            setIsShowMainHeader(false);
        }
    }, [propertyFormContainerProps.isAllowCustomAction]);

    // Derives stable selected-node identifiers used for kebab menu and form loading.
    const selectedNodeKey = useMemo(() => ({
        entId: selectedNode?.NodeEntID?.includes("00000000") ? selectedNode.EntID : selectedNode?.NodeEntID,
        type: selectedNode?.treetype,
        nodeType: selectedNode?.NodeType,
        mountedId: selectedNode?.MountedDeviceID ?? selectedNode.ContainedByDeviceID,
        parentEntId: selectedNode?.parentEntID,
        entityName: selectedNode?.NodeEntityname,
        dateApproved: selectedNode?.DateApproved,
        AuditSessionStatus: selectedNode?.AuditSessionStatus,
        AuditSessionProgress: selectedNode?.AuditSessionProgress,
        TotalAuditedDevices: selectedNode?.TotalAuditedDevices,
        containedByDeviceId: selectedNode.ContainedByDeviceID
    }), [
        selectedNode?.EntID,
        selectedNode?.NodeEntID,
        selectedNode?.treetype,
        selectedNode?.MountedDeviceID,
        selectedNode?.parentEntID,
        selectedNode?.NodeEntityname,
        selectedNode?.DateApproved,
        selectedNode?.NodeType,
        selectedNode?.AuditSessionStatus,
        selectedNode?.AuditSessionProgress,
        selectedNode?.TotalAuditedDevices

    ]);

    const userBasicRole = useMemo(() => {
        return sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "loginuserbasicrolename")?.SessionValue
    }, [sessionContext.SessionList])

    // Resolves the pg class table from entity tables based on node type.
    const pgClassTable = useMemo(() => {
        if (!entityTables.length) return undefined;
        if (selectedNodeKey.type?.toLowerCase() === "deviceslot") {
            return entityTables.find(
                t => String(t.tableName ?? "").toLowerCase() === "pg.deviceslot"
            );
        }
        else if (selectedNodeKey.type?.toLowerCase() == "devicepowerport"
            || selectedNodeKey.type?.toLowerCase() == "devicenetworkport") {

            return entityTables.find(
                t => String(t.tableName ?? "").toLowerCase() === `pg.${selectedNodeKey.type?.toLowerCase()}`
            );
        }
        return entityTables.find(t => t.entityPgClass);
    }, [entityTables, selectedNodeKey.type]);

    // Resolves the pg table from menu selection or explicit pgTableToShow prop.
    const pgTable = useMemo(() => {
        if (selectedNodeMenu?.Name) {
            return entityTables.find(
                t => String(t.tableName ?? "").toLowerCase() === selectedNodeMenu.Name.toLowerCase()
            );
        }
        if (pgTableToShow) {
            return entityTables.find(
                t => String(t.tableName ?? "").toLowerCase() === pgTableToShow.toLowerCase()
            );
        }
        return undefined;
    }, [entityTables, selectedNodeMenu?.Name, pgTableToShow]);

    //Check whether Audit approval pending
    const isAuditPendingApproval = useMemo(() => {
        return (
            selectedNodeKey.nodeType?.toLowerCase() === "auditsessionnode" &&
            !selectedNodeKey.dateApproved
        );
    }, [selectedNodeKey.nodeType, selectedNodeKey.dateApproved]);

    // Determines whether the property form should be read-only for this context.
    const isReadOnly = useMemo(() => {
        const DevicePropertyEditableNodeTypes = [
            "device",
            "cable",
            "rack",
            "frontview",
            "rearview",
            "ru",
            "slot",
            "port",
            "inoutplug",
            "pm",
            "bin",
            "mounteddevice"
        ];
        const normalizedFeatureId = featureId?.toString();
        const normalizedNodeType =
            selectedNodeKey?.nodeType?.toLowerCase();

        // 1. Explicit read-only from parent/container
        if (propertyFormContainerProps.isReadOnly) {
            return true;
        }

        // 2. Home menus are always read-only
        if (HomeMenus.includes(normalizedFeatureId)) {
            return true;
        }

        // 3. Approved audit session is read-only
        if (
            selectedNodeKey?.dateApproved &&
            normalizedNodeType === "auditsessionnode"
        ) {
            return true;
        }

        // 4. Edit Floor Layout
        // Only Location nodes can be edited
        if (normalizedFeatureId === FEnums.EditFloorLayout.toString()) {
            return normalizedNodeType !== "location";
        }


        // 5. Move/Add/Change and Configure Device
        // Device and allowed child nodes can be edited
        if (
            normalizedFeatureId === FEnums.MoveAddChange.toString() ||
            normalizedFeatureId === FEnums.ConfigureDevice.toString() ||
            normalizedFeatureId === FEnums.InventoryManagement.toString() ||
            normalizedFeatureId === FEnums.InventoryConfiguration.toString()
        ) {
            return !DevicePropertyEditableNodeTypes.includes(
                normalizedNodeType ?? ""
            );
        }

        // 6. Other features that support property changes
        if (FeaturesThatAllowsPropertyChange.includes(normalizedFeatureId)) {
            return false;
        }

        // 7. Everything else is read-only
        return true;
    }, [
        featureId,
        selectedNodeKey?.nodeType,
        selectedNodeKey?.dateApproved,
        propertyFormContainerProps.isReadOnly
    ]);

    // Session values used for edit-name permission; keyed so useMemo reacts to value changes.
    const sessionEditPermissionKey = SESSION_EDIT_PERMISSION_VARS
        .map((variableName) => {
            const item = sessionContext.SessionList.find((row) => row.VariableName === variableName);
            return `${variableName}:${item?.SessionValue ?? ""}`;
        })
        .join("|");

    // Check session and whether edit is allowed for name fields starting with _.
    const isEditAllowedForFeature = useMemo(() => {
        const permissionValues = parseSessionEditPermissionKey(sessionEditPermissionKey);
        const hasPermissionData = SESSION_EDIT_PERMISSION_VARS.some(
            (variableName) => permissionValues[variableName].length > 0
        );
        if (!hasPermissionData) return false;

        const session: IFeaturePermission = {
            AppQAName: permissionValues.AppQAName,
            AppQAMenuName: permissionValues.AppQAMenuName,
            AppQAFeatureName: permissionValues.AppQAFeatureName,
        };
        const featureName = permissionValues.FeatureName;
        if (!session.AppQAName && featureName) {
            return FnCheckPermissionToEditName(featureName, true);
        }
        return FnCheckPermissionToEditName(session);
    }, [sessionEditPermissionKey]);

    // Loads kebab menu data and builds form elements for the active pg tables.
    const loadForm = async () => {
        if (!pgClassTable?.properties || !selectedNodeKey.entityName) {
            clearPropertyFormState();
            setLoading(false);
            return;
        }
        const requestId = ++requestIdRef.current;
        setLoading(true);
        try {
            const columns = parsePropertyColumns(String(pgClassTable.properties));
            const pgColumns = pgTable?.properties
                ? parsePropertyColumns(String(pgTable.properties))
                : [];

            const addressControls = pgColumns.filter(control =>
                addressFieldNames.has(control.PName?.toLowerCase() ?? "")
            );

            // Remove address controls from normal controls
            const pgControlsForForm = pgColumns.filter(control =>
                !addressFieldNames.has(control.PName?.toLowerCase() ?? "")
            );

            const isOneToMany = pgTable?.isOneToManyRelation ? true : false;
            const nodeEntID = selectedNodeKey.mountedId ?? selectedNodeKey.entId;
            const kebabMenuPayload: Record<string, unknown> = {
                entID: nodeEntID?.includes("##")
                    ? nodeEntID.split("##")[0]
                    : nodeEntID,
                entityName: selectedNodeKey.entityName,
                kebabMenuTableName:
                    String(pgClassTable.tableName) +
                    (pgTable?.tableName ? `;${pgTable.tableName}` : "")
            };
            if (isAuditPendingApproval) {
                columns.map((item) => {
                    if (!["desc250", "_auditsession", "containedbydeviceonly"].includes(item.PName.toLowerCase())) {
                        item.Disabled = true
                    }
                })
            }
            if (
                selectedNodeKey.type?.toLowerCase() === "deviceview" &&
                !selectedNodeKey.mountedId
            ) {
                kebabMenuPayload.entID = selectedNodeKey.parentEntId;
            } else if (selectedNodeKey.type?.toLowerCase() == "devicepowerport"
                || selectedNodeKey.type?.toLowerCase() == "devicenetworkport") {
                kebabMenuPayload.entID = selectedNodeKey.containedByDeviceId
                kebabMenuPayload.nodeID = selectedNodeKey.entId;
                kebabMenuPayload.nodeType = selectedNodeKey.type == "DevicePowerPort" ? "PowerPort" : selectedNodeKey.type == "DeviceNetworkPort" ? "NetworkPort" : selectedNodeKey.type;
            } else if (selectedNodeKey.type?.toLowerCase() == "deviceslot") {
                kebabMenuPayload.entID = selectedNodeKey.containedByDeviceId
                kebabMenuPayload.nodeID = selectedNodeKey.entId;
                kebabMenuPayload.nodeType = "Slot";
            }
            const kebabData = await FnNodeGetKebabMenuData(
                kebabMenuPayload,
                statusBarContext
            ) as IKebabMenuData;
            if (requestId !== requestIdRef.current) return;
            if (pgClassTable.isOneToManyRelation) {
                setIsOneToManyPgTable(true);
                setOneToManyTableData(kebabData[String(pgClassTable.tableName)] ?? []);
                setIsShowMainHeader(false);
                setFormElements(undefined);
                setPgClassRecord(undefined);
                setPgRecord(pgClassTable);
                return;
            } else if (!propertyFormContainerProps.showPgTableOneToOne && isOneToMany && pgTable?.tableName && Object.keys(kebabData)?.length > 1) {
                const oneToManyTable = kebabData[String(pgTable.tableName)];
                setIsOneToManyPgTable(true);
                setOneToManyTableData(oneToManyTable ?? []);
            } else {
                if (typeof kebabData === "object" && Object.values(kebabData)?.length) {
                    const record = Object.values(kebabData as Record<string, ISelectedNodeProperty[]>)?.[0]?.[0];
                    selectedNodeContext.setSelectedNodeProperty(record as ISelectedNodeProperty);
                }
                setIsOneToManyPgTable(false);
                setOneToManyTableData(undefined);
            }
            if (addressControls.length) {
                const getProfileValue = (fieldName: string): string => {
                    if (!pgTable) return "";
                    const tableData =
                        kebabData[String(pgTable.tableName)];

                    if (!tableData) return "";

                    // Handle both formats:
                    // 1. [{ Address1: "...", GPS: "..." }]
                    // 2. { Address1: "...", GPS: "..." }
                    const parsedAddressData = Array.isArray(tableData)
                        ? tableData[0]
                        : tableData;

                    if (!parsedAddressData) return "";

                    // Exact key first
                    if (parsedAddressData[fieldName] != null) {
                        return String(parsedAddressData[fieldName]);
                    }

                    // Find dynamic/prefixed key
                    // e.g. ContactDetails_Address1
                    const matchedKey = Object.keys(parsedAddressData).find(
                        key =>
                            key.toLowerCase().endsWith(
                                `_${fieldName.toLowerCase()}`
                            )
                    );

                    return matchedKey
                        ? String(parsedAddressData[matchedKey] ?? "")
                        : "";
                };
                let addressValue: IAddress;

                const gps = getProfileValue("GPS");

                const [latitude = "", longitude = ""] = gps
                    .split(",")
                    .map(value => value.trim());

                addressValue = {
                    Address1: getProfileValue("Address1"),
                    Address2: getProfileValue("Address2"),
                    City: getProfileValue("City"),
                    State: getProfileValue("State"),
                    Country: getProfileValue("Country"),
                    Zip: getProfileValue("Zip"),
                    CountryCode: getProfileValue("CountryCode"),
                    Latitude: latitude,
                    Longitude: longitude,
                    TimezoneOffset: getProfileValue("TimezoneOffset")
                };
                setUpdatedAddress(addressValue);
                setIsAddressFormShow(true);
            }
            setPgClassRecord(pgClassTable);
            setPgRecord(pgTable);
            setKebabMenuData(kebabData);

            const form = FnBuildFormElementsFromDataset(
                isShowMainHeader || addressControls.length ? "" : "Properties",
                {
                    [String(pgClassTable.tableName)]: {
                        label: String(pgClassTable.tableLabel || pgClassTable.tableName),
                        columns
                    },
                    ...(pgTable?.tableName && (!pgTable.isOneToManyRelation || showPgTableOneToOne)
                        ? {
                            [String(pgTable.tableName)]: {
                                label: String(pgTable.tableLabel || pgTable.tableName),
                                columns: pgControlsForForm
                            }
                        }
                        : {})
                },
                kebabData,
                statusBarContext,
                mainAppContext.refTableRecords,
                getMuForSite(),
                getDiagnosticLevelData(),
                isReadOnly,
                isShowPgTableFirst ? String(pgTable?.tableName) : undefined,
                selectedNodeKey.entityName ?? undefined,
                undefined,
                undefined,
                undefined,
                isEditAllowedForFeature,
                userBasicRole ?? undefined
            );
            setFormElements(form);
        } catch (e) {
            console.error("Failed to load form", e);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    // Triggers form load when entity tables and pg class table are available for the current entity.
    useEffect(() => {
        if (entityTablesEntityName !== NodeEntityname) return;

        if (!entityTables.length || !pgClassTable) {
            clearPropertyFormState();
            setLoading(false);
            return;
        }
        setUpdatedAddress(undefined);
        setIsAddressFormShow(false);
        const abortController = new AbortController();

        const runLoadForm = async (): Promise<void> => {
            if (abortController.signal.aborted) return;
            await loadForm();
        };

        void runLoadForm();

        return () => {
            abortController.abort();
            requestIdRef.current++;
        };
    }, [entityTables, entityTablesEntityName, NodeEntityname, selectedNodeKey.entId,
        selectedNodeKey.AuditSessionProgress,
        selectedNodeKey.AuditSessionStatus,
        selectedNodeKey.TotalAuditedDevices, pgClassTable, pgTable, featureId, isEditAllowedForFeature]);

    // Builds pg class data from updated property keys for a given table name.
    const buildPgClassDataFromKeys = (
        pgClassColumns: { PName: string }[],
        tableName: string,
        values: Record<string, unknown>
    ): IPropertyRow => {
        const pgClassData: IPropertyRow = {};
        const updatedKeys = Object.keys(values);

        pgClassColumns.forEach((col) => {
            const classKeyPrefix = `${tableName}_${col.PName}_`;
            const classKey = updatedKeys.find(k => k.startsWith(classKeyPrefix));

            if (classKey) {
                const value = values[classKey];

                if (col.PName.toLowerCase() === "measurement") {
                    pgClassData["DateFormat"] =
                        value?.toString().toLowerCase() === "europe"
                            ? "dd/MM/yyyy"
                            : "MM/dd/yyyy";
                }

                pgClassData[col.PName] = value !== "" ? value : undefined;
            }
        });

        return pgClassData;
    };

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

    const isPgAddressValueFilled = (value: unknown): boolean => {
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

    /** When address form is visible, required PG address columns (and Country) must be filled. */
    const areAddressRequiredFieldsFilled = (
        address: IAddress | undefined,
        pgProperties?: string
    ): boolean => {
        if (!address) {
            return false;
        }

        if (!isPgAddressValueFilled(address.Country)) {
            return false;
        }

        if (!pgProperties) {
            return true;
        }

        const pgColumns = parsePgColumnDefs(pgProperties);
        return pgColumns.every(col => {
            const pName = col.PName ?? "";
            const pNameLower = pName.toLowerCase();
            if (!addressFieldNames.has(pNameLower)) {
                return true;
            }
            if (!col.RequiredToAddRecord && !col.RequiredToUpdateRecord) {
                return true;
            }
            return isPgAddressValueFilled(
                getAddressFieldValue(address, pName)
            );
        });
    };

    const canEnablePropertySave = (
        values: Record<string, unknown> | undefined,
        address: IAddress | undefined,
        addressFormShown: boolean,
        pgProperties?: string
    ): boolean => {
        if (formElements && values) {
            if (!areAllRequiredFieldsFilled(values, formElements)) {
                return false;
            }
        }

        if (addressFormShown) {
            return areAddressRequiredFieldsFilled(address, pgProperties);
        }

        return true;
    };

    // Tracks dirty state and forwards merged pg class changes to the parent callback.
    const handleValueChange = (values: Record<string, unknown>) => {
        const measurementKey = Object.keys(values).find(key =>
            key.toLowerCase().includes("_measurement_")
        );

        if (measurementKey) {
            const dateFormat =
                values[measurementKey]?.toString().toLowerCase() === "europe"
                    ? "dd/MM/yyyy"
                    : "MM/dd/yyyy";

            // Update values so it gets saved
            const dateFormatKey = Object.keys(values).find(key =>
                key.toLowerCase().includes("_dateformat_")
            );

            if (dateFormatKey) {
                values[dateFormatKey] = dateFormat;
            }

            // Update only the DateFormat control
            setFormElements(prev => {
                if (!prev) return prev;

                return {
                    ...prev,
                    TableSections: Object.fromEntries(
                        Object.entries(prev.TableSections).map(([sectionName, controls]) => [
                            sectionName,
                            controls.map(control =>
                                control.key.toLowerCase().includes("_dateformat_")
                                    ? {
                                        ...control,
                                        defaultValue: dateFormat,
                                        value: dateFormat // if supported by your library
                                    }
                                    : control
                            )
                        ])
                    )
                };
            });
        }

        if (propertyFormContainerProps.handlePropertyChange) {
            if (!pgClassRecord?.properties) return;

            try {
                const pgClassColumns = parsePgColumnDefs(String(pgClassRecord.properties));

                const pgClassData = buildPgClassDataFromKeys(
                    pgClassColumns,
                    String(pgClassRecord.tableName),
                    values
                );

                const oldPgClassRow =
                    kebabMenuData?.[String(pgClassRecord.tableName)]?.[0] ?? {};

                pgClassData["LastUpdated"] = undefined;

                const mergedPgClassRow = {
                    ...oldPgClassRow,
                    ...pgClassData
                };

                propertyFormContainerProps.handlePropertyChange(mergedPgClassRow);
            } catch (error) {
                console.error("Failed to map property change:", error);
            }
        }

        setUpdatedProperties({ ...values });

        setIsDirty(
            canEnablePropertySave(
                values,
                updatedAddress,
                isAddressFormShow,
                pgRecord?.properties ? String(pgRecord.properties) : undefined
            )
        );
    };

    const savePgTable = (
        newAddedEntID: string,
        newAddedName?: string
    ) => {
        if (
            !pgRecord?.tableName ||
            !updatedAddress
        ) {
            return;
        }

        const pgTableName = String(pgRecord.tableName);

        const pgColumns = pgRecord.properties
            ? parsePgColumnDefs(String(pgRecord.properties))
            : [];

        // Existing PG record
        const oldPgRow: IPropertyRow =
            kebabMenuData?.[pgTableName]?.[0] ?? {};

        // Copy existing record
        const mergedPgRow: IPropertyRow = {
            ...oldPgRow
        };

        // Update ONLY address fields
        pgColumns.forEach(col => {
            let value: unknown;

            // GPS needs to be created from Latitude + Longitude
            if (col.PName === "GPS") {
                const {
                    Latitude,
                    Longitude
                } = updatedAddress;

                value =
                    Latitude && Longitude
                        ? `${Latitude},${Longitude}`
                        : undefined;
            } else {
                // Address1, Address2, City, State,
                // Country, Zip, CountryCode, etc.
                value =
                    updatedAddress[
                    col.PName as keyof IAddress
                    ];
            }

            // Only update fields available in updatedAddress
            if (value !== undefined) {
                mergedPgRow[col.PName] =
                    value !== ""
                        ? value
                        : undefined;
            }
        });

        // Keep/update EntID
        mergedPgRow["EntID"] = newAddedEntID;

        // Force LastUpdated update
        mergedPgRow["LastUpdated"] = undefined;

        applyDateTimeFields(mergedPgRow);

        const pgPayload = {
            [pgTableName]: [mergedPgRow]
        };

        axiosInterceptor(
            {
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(pgPayload)
                },
                allowShowLoader: true,
                setFetchData: (
                    _pgResp: unknown,
                    pgStatus?: string
                ) => {
                    if (pgStatus === "200") {
                        setIsDirty(false);
                        handleRefreshUpdatedRecord?.(
                            newAddedEntID,
                            newAddedName ?? "",
                            "save"
                        );
                    }
                }
            },
            statusBarContext
        ).catch(error => {
            console.error(
                "Failed to save pg table record:",
                error
            );
        });
    };

    const checkIsRenameTarget = (
        classTableName: string,
        oldPgClassRow: IPropertyRow,
        mergedPgClassRow: IPropertyRow
    ): boolean => {
        const normalizedFeatureId = featureId?.toString().toLowerCase();
        const subFeatureId = propertyFormContainerProps.subTreeFeatureId?.toLowerCase();
        const isEditFloorLayout =
            normalizedFeatureId === FEnums.EditFloorLayout
        const isRackAndStack =
            normalizedFeatureId === FEnums.MoveAddChange ||
            normalizedFeatureId === FEnums.ConfigureDevice ||
            normalizedFeatureId === FEnums.Workorder;
        const isDataCenterHierarchy =
            (subFeatureId === EntitiesSubGroups.DataCenterHierarchy.toLowerCase() ||
                subFeatureId === EntitiesSubGroups.InventoryStoreAndBins.toLowerCase()) &&
            ["_site", "_room", "_floor", "_bin"].includes(classTableName.toLowerCase());

        const isTargetScope =
            (isEditFloorLayout && classTableName === "_Location") ||
            (isRackAndStack && classTableName === "_Device") ||
            isDataCenterHierarchy;

        if (!isTargetScope) return false;

        const oldName = oldPgClassRow?.[classTableName] ?? propertyFormContainerProps.selectedNode?.Name;
        const newName = mergedPgClassRow?.[classTableName];
        return Boolean(newName && oldName && String(newName).trim() !== String(oldName).trim());
    };

    const updateNodePathIfNeeded = async (entID: string, isRenameTarget: boolean) => {
        const targetEntID = entID || (propertyFormContainerProps.selectedNode?.NodeEntID as string) || "";
        if (!isRenameTarget || !targetEntID) return;
        try {
            await new Promise<void>((resolve) => {
                axiosInterceptor({
                    url: NODE.UpdateNodePathForHierarchy,
                    data: { entID: targetEntID },
                    allowShowLoader: true,
                    setFetchData: () => {
                        resolve();
                    }
                }, statusBarContext).catch((error) => {
                    console.error("Failed to update node path for hierarchy:", error);
                    resolve();
                });
            });
        } catch (e) {
            console.error("Error updating node path for hierarchy:", e);
        }
    };

    // Saves dirty-flag property changes via add/update API with optional pg table follow-up.
    const handleSaveProperties = (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        /**
     * No property changes, but address has changed.
     * Save only PG table.
     */
        if (
            !updatedProperties &&
            isAddressFormShow &&
            updatedAddress
        ) {
            const oldPgClassRow =
                kebabMenuData?.[
                String(pgClassRecord?.tableName)
                ]?.[0];

            const existingEntID =
                oldPgClassRow?.EntID as string;

            const existingName =
                oldPgClassRow?.[
                String(pgClassRecord?.tableName)
                ] as string;

            if (existingEntID) {
                savePgTable(
                    existingEntID,
                    existingName
                );
            }

            return;
        }
        if (!updatedProperties || !pgClassRecord?.properties) return;
        const pgData: IPropertyRow = {};
        try {
            const pgClassColumns = parsePgColumnDefs(String(pgClassRecord.properties));
            const pgColumns = pgRecord?.properties
                ? parsePgColumnDefs(String(pgRecord.properties))
                : [];
            const updatedKeys = Object.keys(updatedProperties);
            const pgClassData = buildPgClassDataFromKeys(
                pgClassColumns,
                String(pgClassRecord.tableName),
                updatedProperties
            );
            const oldPgClassRow = kebabMenuData?.[String(pgClassRecord.tableName)]?.[0] ?? {};
            pgClassData["LastUpdated"] = undefined;
            const mergedPgClassRow = {
                ...oldPgClassRow,
                ...pgClassData
            };
            const classTableName = String(pgClassRecord.tableName);
            const isRenameTarget = checkIsRenameTarget(
                classTableName,
                oldPgClassRow,
                mergedPgClassRow
            );
            const payload = {
                [classTableName]: [mergedPgClassRow]
            };
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
                            const parsedData = FnParseJsonSafely<Record<string, IPropertyRow[]>, Record<string, IPropertyRow[]>>(
                                _resp.jsonStringOutput as string,
                                { fallback: {} }
                            );
                            const classTableName = String(pgClassRecord.tableName);
                            const classTableRows = parsedData[classTableName];
                            if (classTableRows && Array.isArray(classTableRows) && classTableRows.length) {
                                const newAddedEntID = classTableRows[0].EntID as string;
                                const newAddedName = classTableRows[0][classTableName] as string;
                                if (propertyFormContainerProps.allowLog) {
                                    if (classTableName === "_User") {
                                        const forensicPayload: IFnCreateForensiclog = {
                                            logType: 'UserAction',
                                            GroupName: LogGroupName.ForensicLogTemplate,
                                            _Forensiclog: LogSubGroupName.Auth,
                                            SubGroupName: LogSubGroupName.Auth,
                                            LogName: LogName.UpdateUser,
                                            actionObject: {
                                                selectedUserName: newAddedName
                                            },
                                            sessionContext: sessionContext,
                                            statusBarContext: statusBarContext,
                                            RefTableItems: mainAppContext.refTableRecords
                                        };
                                        FnCreateForensiclog(forensicPayload);
                                    }
                                }
                                if (pgRecord?.tableName && newAddedEntID) {
                                    const pgTableName = String(pgRecord.tableName);
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
                                        setIsDirty(false);
                                        await updateNodePathIfNeeded(newAddedEntID, isRenameTarget);
                                        // Call callback to refresh
                                        handleRefreshUpdatedRecord?.(
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


                                    let mergedPgRow: IPropertyRow | undefined;
                                    if (pgRecord?.tableName) {
                                        const oldPgRow = kebabMenuData?.[pgTableName]?.[0] ?? {};
                                        pgData["LastUpdated"] = undefined;
                                        mergedPgRow = {
                                            ...oldPgRow,
                                            ...pgData
                                        };
                                    }
                                    if (mergedPgRow) {
                                        mergedPgRow["EntID"] = newAddedEntID;
                                    }
                                    if (mergedPgRow) {
                                        applyDateTimeFields(mergedPgRow);
                                    }
                                    const pgPayload = {
                                        [pgTableName]: [mergedPgRow]
                                    };
                                    axiosInterceptor({
                                        url: EM.AddUpdateTableRecord,
                                        data: {
                                            jsonString: JSON.stringify(pgPayload)
                                        },
                                        allowShowLoader: true,
                                        setFetchData: async (_pgResp: unknown, pgStatus?: string) => {
                                            if (pgStatus === "200") {
                                                setIsDirty(false);
                                                await updateNodePathIfNeeded(newAddedEntID, isRenameTarget);
                                                handleRefreshUpdatedRecord?.(
                                                    newAddedEntID,
                                                    newAddedName,
                                                    "save"
                                                );
                                            }
                                        }
                                    }, statusBarContext).catch((error) => {
                                        console.error('Failed to save pg table record:', error);
                                    });
                                } else {
                                    setIsDirty(false);
                                    await updateNodePathIfNeeded(newAddedEntID, isRenameTarget);
                                    handleRefreshUpdatedRecord?.(newAddedEntID, newAddedName, 'save');
                                    return;
                                }
                            }
                        } catch (error) {
                            console.error('Failed to process save properties response:', error);
                        }
                    }
                }
            }, statusBarContext).catch((error) => {
                console.error('Failed to save properties:', error);
            });
        } catch (error) {
            console.error("Failed to map properties", error);
        }
    };

    // Saves property form data via add/update API with forensic logging and pg table follow-up.
    const handleSavePropertyForm = (formData: IFormData) => {
        if (!formData?.TableSections || !Object.keys(formData?.TableSections).length || !pgClassRecord?.properties) return;
        const pgClassData: IPropertyRow = {};
        const pgData: IPropertyRow = {};
        try {
            const pgClassColumns = parsePropertyColumns(String(pgClassRecord.properties));
            const pgColumns = pgRecord?.properties
                ? parsePgColumnDefs(String(pgRecord.properties))
                : [];
            const pgClassUpdatedData = formData?.TableSections[String(pgClassRecord.tableLabel)];
            if (!pgClassUpdatedData || typeof pgClassUpdatedData !== "object") return;
            pgClassColumns.forEach((col) => {
                if (col.PName) {
                    const value = pgClassUpdatedData[col.PName];
                    pgClassData[col.PName] = value !== "" ? value : undefined;
                }
            });
            const oldPgClassRow = kebabMenuData?.[String(pgClassRecord.tableName)]?.[0] ?? {};
            pgClassData["LastUpdated"] = undefined;
            const mergedPgClassRow = {
                ...oldPgClassRow,
                ...pgClassData
            };
            const classTableName = String(pgClassRecord.tableName);
            const isRenameTarget = checkIsRenameTarget(
                classTableName,
                oldPgClassRow,
                mergedPgClassRow
            );
            const payload = {
                [classTableName]: [mergedPgClassRow]
            };
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
                            const parsedData = FnParseJsonSafely<Record<string, IPropertyRow[]>, Record<string, IPropertyRow[]>>(
                                _resp.jsonStringOutput as string,
                                { fallback: {} }
                            );
                            const classTableName = String(pgClassRecord.tableName);
                            const classTableRows = parsedData[classTableName];
                            if (classTableRows && Array.isArray(classTableRows) && classTableRows.length) {
                                const newAddedEntID = classTableRows[0].EntID as string;
                                const newAddedName = classTableRows[0][classTableName] as string;
                                if (propertyFormContainerProps.allowLog) {
                                    if (classTableName.toLowerCase() === "_device") {
                                        const deviceName = selectedNode?.Name || "";
                                        pgClassColumns.forEach((col) => {
                                            if (!col.PName || col.PName.toLowerCase() === "lastupdated" || col.PName.toLowerCase() === "entid") return;
                                            if (pgClassUpdatedData && !(col.PName in pgClassUpdatedData)) return;
                                            const oldValue = oldPgClassRow[col.PName];
                                            const newValue = pgClassUpdatedData ? pgClassUpdatedData[col.PName] : pgClassData[col.PName];
                                            const oldStr = oldValue !== undefined && oldValue !== null ? String(oldValue).trim() : "";
                                            const newStr = newValue !== undefined && newValue !== null ? String(newValue).trim() : "";
                                            if (oldStr !== newStr) {
                                                const forensicPayload: IFnCreateForensiclog = {
                                                    logType: 'UserAction',
                                                    GroupName: LogGroupName.ForensicLogTemplate,
                                                    _Forensiclog: LogSubGroupName.Device,
                                                    SubGroupName: LogSubGroupName.Device,
                                                    LogName: LogName.UpdateValue,
                                                    actionObject: {
                                                        PropName: (col.PropertyLabel && String(col.PropertyLabel).trim()) || col.PName,
                                                        PropValue: newStr,
                                                        deviceName: deviceName,
                                                    },
                                                    sessionContext: sessionContext,
                                                    statusBarContext: statusBarContext,
                                                    RefTableItems: mainAppContext.refTableRecords
                                                };
                                                FnCreateForensiclog(forensicPayload);
                                            }
                                        });
                                    } else if (classTableName.toLowerCase() === "_user"
                                        || classTableName.toLowerCase() === "_role"
                                        || classTableName.toLowerCase() === "nzlicensekey"
                                        || classTableName.toLowerCase() === "_team") {
                                        let logName: string;
                                        if (classTableName.toLowerCase() === "_user") {
                                            logName = LogName.UpdateUser;
                                        } else if (classTableName.toLowerCase() === "_role") {
                                            logName = LogName.UpdateRole;
                                        } else if (classTableName.toLowerCase() === "nzlicensekey") {
                                            logName = LogName.UpdateLicense;
                                        } else if (classTableName.toLowerCase() === "_team") {
                                            logName = LogName.UpdateTeam;
                                        } else {
                                            logName = "";
                                        }
                                        const forensicPayload: IFnCreateForensiclog = {
                                            logType: 'UserAction',
                                            GroupName: LogGroupName.ForensicLogTemplate,
                                            _Forensiclog: LogSubGroupName.Auth,
                                            SubGroupName: LogSubGroupName.Auth,
                                            LogName: logName,
                                            actionObject: {
                                                selectedUserName: newAddedName,
                                                selectedRoleName: newAddedName,
                                                selectedLicensekey: newAddedName,
                                                selectedTeamkey: newAddedName,
                                            },
                                            sessionContext: sessionContext,
                                            statusBarContext: statusBarContext,
                                            RefTableItems: mainAppContext.refTableRecords
                                        };
                                        FnCreateForensiclog(forensicPayload);
                                    }
                                } else {
                                    const data = propertyFormContainerProps.treeData && await FnReturnNodeNameObject(
                                        propertyFormContainerProps.treeData,
                                        (classTableName.toLowerCase() === "_bin" ? selectedNode?.NodeEntID ?? "" : newAddedEntID)
                                    );
                                    if (classTableName.toLowerCase() === "_site" || classTableName.toLowerCase() === "_room" || classTableName.toLowerCase() === "_floor" || classTableName.toLowerCase() === "_bin") {
                                        const forensicPayload: IFnCreateForensiclog = {
                                            logType: 'UserAction',
                                            GroupName: LogGroupName.ForensicLogTemplate,
                                            _Forensiclog: classTableName.toLowerCase() === "_bin" ? LogSubGroupName.InventoryStoreandBins : LogSubGroupName.DataCenterHierarchy,
                                            SubGroupName: classTableName.toLowerCase() === "_bin" ? LogSubGroupName.InventoryStoreandBins : LogSubGroupName.DataCenterHierarchy,
                                            LogName: LogName.UpdateEntity,
                                            actionObject: {
                                                Site: data?.Site,
                                                Room: data?.Room,
                                                Floor: data?.Floor,
                                                Inventory: data?.Inventory,
                                                Store: data?.Store,
                                                Bin: mergedPgClassRow[classTableName]
                                            },
                                            sessionContext: sessionContext,
                                            statusBarContext: statusBarContext,
                                            RefTableItems: mainAppContext.refTableRecords
                                        };
                                        FnCreateForensiclog(forensicPayload);
                                    }
                                }
                                if (pgRecord?.tableName && newAddedEntID && pgRecord?.tableLabel) {
                                    const pgTableName = String(pgRecord.tableName);
                                    const pgTableUpdatedData = formData?.TableSections[String(pgRecord.tableLabel)];
                                    const hasMissingRequiredPgField = pgColumns.some(col => {
                                        if (!(col.RequiredToAddRecord || col.RequiredToUpdateRecord)) return false;
                                        const value = col.PName && pgTableUpdatedData
                                            ? pgTableUpdatedData[col.PName]
                                            : undefined;
                                        return value === undefined || value === "";
                                    });
                                    if (hasMissingRequiredPgField) {
                                        setIsDirty(false);
                                        await updateNodePathIfNeeded(newAddedEntID, isRenameTarget);
                                        handleRefreshUpdatedRecord?.(newAddedEntID, newAddedName, 'save');
                                        return;
                                    }
                                    pgColumns.forEach((col) => {
                                        if (col.PName && pgTableUpdatedData) {
                                            const value = pgTableUpdatedData[col.PName];
                                            pgData[col.PName] = value;
                                        }
                                    });
                                    let mergedPgRow: IPropertyRow | undefined;
                                    const oldPgRow = kebabMenuData?.[pgTableName]?.[0] ?? {};
                                    if (pgRecord?.tableName) {
                                        pgData["LastUpdated"] = undefined;
                                        mergedPgRow = {
                                            ...oldPgRow,
                                            ...pgData
                                        };
                                    }
                                    if (mergedPgRow) {
                                        mergedPgRow["EntID"] = newAddedEntID;
                                    }
                                    if (mergedPgRow) {
                                        applyDateTimeFields(mergedPgRow);
                                    }
                                    const pgPayload = {
                                        [pgTableName]: [mergedPgRow]
                                    };
                                    axiosInterceptor({
                                        url: EM.AddUpdateTableRecord,
                                        data: {
                                            jsonString: JSON.stringify(pgPayload)
                                        },
                                        allowShowLoader: true,
                                        setFetchData: async (_pgResp: unknown, pgStatus?: string) => {
                                            if (pgStatus === "200") {
                                                setIsDirty(false);
                                                await updateNodePathIfNeeded(newAddedEntID, isRenameTarget);
                                                handleRefreshUpdatedRecord?.(newAddedEntID, newAddedName, 'save');
                                            }
                                        }
                                    }, statusBarContext).catch((error) => {
                                        console.error('Failed to save pg table record:', error);
                                    });
                                } else {
                                    setIsDirty(false);
                                    await updateNodePathIfNeeded(newAddedEntID, isRenameTarget);
                                    handleRefreshUpdatedRecord?.(newAddedEntID, newAddedName, 'save');
                                    return;
                                }
                            }
                        } catch (error) {
                            console.error('Failed to process save property form response:', error);
                        }
                    }
                }
            }, statusBarContext).catch((error) => {
                console.error('Failed to save property form:', error);
            });
        } catch (error) {
            console.error("Failed to map properties", error);
        }
    };

    // Navigates back via the parent refresh callback when the close button is clicked.
    const handleClickX = () => {
        propertyFormContainerProps.handleRefreshUpdatedRecord?.("", "", 'back');
    };

    // Handles back button click by invoking the parent refresh callback.
    const handleBackClick = (
        _event?: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        _actionCode?: string,
        _payload?: unknown
    ): void => {
        handleRefreshUpdatedRecord?.("", "", 'back');
    };
    const handleValueChangeAddress = (address: IAddress) => {
        // Check whether address actually changed
        const isAddressChanged = updatedAddress &&
            JSON.stringify(updatedAddress) !== JSON.stringify(address);

        // No address change → don't update save button
        if (!isAddressChanged) return;

        setUpdatedAddress(address);

        setIsDirty(
            canEnablePropertySave(
                updatedProperties,
                address,
                isAddressFormShow,
                pgRecord?.properties ? String(pgRecord.properties) : undefined
            )
        );
    };

    // Injects save and close handlers into form elements for the renderer.
    const renderedFormElements = useMemo(() => {
        if (!formElements) return undefined;
        return {
            ...formElements,
            onSave: propertyFormContainerProps.handlePropertyChange || propertyFormContainerProps.isReadOnly || isAddressFormShow ? undefined : handleSavePropertyForm,
            onX: propertyFormContainerProps.allowCloseButton ? handleClickX : undefined
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
    };
    const backImageData: IImage = {
        source: <Back24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Click to go back",
        uniqueName: 'user-profile-iback',
        type: 'svg'
    };

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading properties...</div>;
    }

    if (!isOneToManyPgTable && (!formElements || !Object.keys(formElements.TableSections).length)) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No properties found</div>;
    }

    return (
        <div key={propertyFormContainerProps.uniqueName} className='nz-wh-100 nz-d-flex-column nz-prop-form-container'>
            {isShowMainHeader || isAddressFormShow ? <div className='nz-sub-header nz-prop-form-container-action'>
                <Label uniqueName={propertyFormContainerProps.uniqueName + 'header'} label={"Properties"} />
                <div className='nz-header-action'>
                    {allowBackButton ? <ActionImage
                        uniqueName={propertyFormContainerProps.uniqueName + 'back-icon'}
                        image={backImageData} w={'var(--node_height)'} h={'var(--node_height)'}
                        actionCode={'back'} handleMouse={handleBackClick} /> : <></>}
                    {isDirty && <div className={'nz-save-button'}>
                        <DirtyFlagImage uniqueName={propertyFormContainerProps.uniqueName + 'save-icon'}
                            isDirty={isDirty}
                            bgColor={"#FFFF99"}
                            image={saveImageData} w={'var(--node_height)'} h={'var(--node_height)'}
                            handleMouse={handleSaveProperties} />
                    </div>}
                </div>
            </div> : <></>}
            <div className={'nz-prop-form-content' + (isOneToManyPgTable || isAddressFormShow ? " nz-prop-form-with-onetomany-grid" : "")} onKeyDownCapture={handleFormControlsKeyDown}
                onKeyDown={handleFormControlsBubbleKeyDown}>
                {renderedFormElements ? <FormElementsRenderer
                    formElements={renderedFormElements}
                    onValuesChange={handleValueChange}
                    embedded={isAddressFormShow ? true : false}
                /> : <></>}
                {isOneToManyPgTable && pgRecord ? <OneToManyFormContainer
                    key={`${propertyFormContainerProps.selectedNode?.NodeEntID ?? 'node'}-${pgRecord.tableName ?? 'table'}`}
                    uniqueName={propertyFormContainerProps.uniqueName + 'one-to-many-container'}
                    tableDefinition={pgRecord}
                    selectedNode={propertyFormContainerProps.selectedNode}
                    isReadOnly={true}
                    isAllowCustomHeader={true}
                    hideAddForm={true}
                    tableData={oneToManyTableData} /> : <></>}

                {updatedAddress && isAddressFormShow ? <div style={{ margin: "6px 0px" }}>
                    <Suspense fallback={null}>
                        <AddressForm
                            key={"address-form"}
                            initialAddress={updatedAddress}
                            disabled={propertyFormContainerProps.isReadOnly}
                            onChange={handleValueChangeAddress}
                        />
                    </Suspense>
                </div> : <></>}
            </div>
        </div>
    );
};

export { PropertyFormContainer };

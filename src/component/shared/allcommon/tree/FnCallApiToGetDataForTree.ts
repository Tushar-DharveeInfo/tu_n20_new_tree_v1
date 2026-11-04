import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FEnums } from "../../../constants/Feature";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { ISession } from "../../context/allinterface/ISession";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { EXPLORER } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { FnDeepClone } from "../basic/FnDeepClone";
import { FnGetSessionVariables } from "../basic/FnGetSessionVariables";
import { FnAddSubNode } from "./FnAddSubNode";
import { FnConvertFlatDataToHierarchyData } from "./FnConvertFlatDataToHierarchyData";
import { FnFilterTreeById } from "./FnFilterTreeById";
import type React from "react";
import { IAllSitesHierarchy, IHierarchyFlatData } from "../../context/allinterface/IMainApp";
import { FnFilterSiteHierarchyFromAllSites, getSiteIdFromSessionList } from "./FnFilterSiteHierarchyFromAllSites";


/**
 * Extracts base entity ID (strips compound suffix like ##tenant).
 */
const getBaseId = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = String(val).trim();
    if (!s) return "";
    return s.split("##")[0].trim().toLowerCase();
};

/**
 * Extracts flat record rows from an API response (handles Array or Object with Table Arrays).
 */
const extractRowsFromApiData = (apiData: unknown): Record<string, unknown>[] => {
    if (!apiData || typeof apiData !== "object") return [];
    if (Array.isArray(apiData)) {
        return apiData.filter(
            (item): item is Record<string, unknown> =>
                item !== null && typeof item === "object"
        );
    }
    const rows: Record<string, unknown>[] = [];
    for (const val of Object.values(apiData as Record<string, unknown>)) {
        if (Array.isArray(val)) {
            for (const item of val) {
                if (item !== null && typeof item === "object") {
                    rows.push(item as Record<string, unknown>);
                }
            }
        }
    }
    if (!rows.length) {
        const obj = apiData as Record<string, unknown>;
        if ("SiteEntID" in obj || "FloorEntID" in obj || "RoomEntID" in obj) {
            rows.push(obj);
        }
    }
    return rows;
};

/**
 * Updates a single row with matching Site, Room, or Floor properties.
 * Preserves compound IDs and only allocates a new object if values actually changed.
 */
const updateRowProperties = (
    row: Record<string, unknown>,
    sitePropsMap: Map<string, Record<string, unknown>>,
    roomPropsMap: Map<string, Record<string, unknown>>,
    floorPropsMap: Map<string, Record<string, unknown>>
): { updatedRow: Record<string, unknown>; changed: boolean } => {
    const rawSiteId =
        row.SiteEntID ??
        row.SiteID ??
        (String(row.NodeType).toLowerCase() === "site"
            ? (row.EntID ?? row.NodeEntID)
            : undefined);
    const rawRoomId =
        row.RoomEntID ??
        row.RoomID ??
        (String(row.NodeType).toLowerCase() === "room"
            ? (row.EntID ?? row.NodeEntID)
            : undefined);
    const rawFloorId =
        row.FloorEntID ??
        row.FloorID ??
        (String(row.NodeType).toLowerCase() === "floor"
            ? (row.EntID ?? row.NodeEntID)
            : undefined);

    const siteId = getBaseId(rawSiteId);
    const roomId = getBaseId(rawRoomId);
    const floorId = getBaseId(rawFloorId);

    const siteProps = siteId ? sitePropsMap.get(siteId) : undefined;
    const roomProps = roomId ? roomPropsMap.get(roomId) : undefined;
    const floorProps = floorId ? floorPropsMap.get(floorId) : undefined;

    if (!siteProps && !roomProps && !floorProps) {
        return { updatedRow: row, changed: false };
    }

    let changed = false;
    let newRow = row;

    const applyProps = (props: Record<string, unknown>) => {
        for (const [key, val] of Object.entries(props)) {
            if (val === undefined) continue;
            // Preserve compound IDs if existing value has ## and new val does not
            if (
                key.toLowerCase().endsWith("id") ||
                key.toLowerCase().endsWith("entid")
            ) {
                const existingVal = String(newRow[key] ?? "");
                const newVal = String(val ?? "");
                if (existingVal.includes("##") && !newVal.includes("##")) {
                    continue;
                }
            }
            if (newRow[key] !== val) {
                if (!changed) {
                    newRow = { ...newRow };
                    changed = true;
                }
                newRow[key] = val;
            }
        }
    };

    if (siteProps) applyProps(siteProps);
    if (roomProps) applyProps(roomProps);
    if (floorProps) applyProps(floorProps);

    return { updatedRow: newRow, changed };
};

/**
 * Updates an array of hierarchy rows. Returns original array reference if nothing changed.
 */
const updateFlatHierarchyRows = (
    rows: unknown[],
    sitePropsMap: Map<string, Record<string, unknown>>,
    roomPropsMap: Map<string, Record<string, unknown>>,
    floorPropsMap: Map<string, Record<string, unknown>>
): { updatedRows: unknown[]; changed: boolean } => {
    let anyChanged = false;
    const newRows = rows.map((item) => {
        if (!item || typeof item !== "object") return item;
        const { updatedRow, changed } = updateRowProperties(
            item as Record<string, unknown>,
            sitePropsMap,
            roomPropsMap,
            floorPropsMap
        );
        if (changed) {
            anyChanged = true;
            return updatedRow;
        }
        return item;
    });

    return {
        updatedRows: anyChanged ? newRows : rows,
        changed: anyChanged
    };
};

/**
 * Updates IHierarchyFlatData (array of rows or table-keyed object of arrays).
 */
const updateHierarchyData = (
    data: IHierarchyFlatData | undefined,
    sitePropsMap: Map<string, Record<string, unknown>>,
    roomPropsMap: Map<string, Record<string, unknown>>,
    floorPropsMap: Map<string, Record<string, unknown>>
): { updatedData: IHierarchyFlatData | undefined; changed: boolean } => {
    if (!data) return { updatedData: data, changed: false };

    if (Array.isArray(data)) {
        const { updatedRows, changed } = updateFlatHierarchyRows(
            data,
            sitePropsMap,
            roomPropsMap,
            floorPropsMap
        );
        return { updatedData: updatedRows as IHierarchyFlatData, changed };
    }

    if (typeof data === "object") {
        let anyChanged = false;
        const newObj: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                const { updatedRows, changed } = updateFlatHierarchyRows(
                    value,
                    sitePropsMap,
                    roomPropsMap,
                    floorPropsMap
                );
                newObj[key] = updatedRows;
                if (changed) anyChanged = true;
            } else {
                newObj[key] = value;
            }
        }

        return {
            updatedData: anyChanged ? (newObj as IHierarchyFlatData) : data,
            changed: anyChanged
        };
    }

    return { updatedData: data, changed: false };
};

/**
 * Checks whether the API data contains any Site, Room, or Floor node properties.
 * If none are present, updating the cache is skipped entirely to avoid traversing and looping.
 */
const hasSiteRoomFloorProperties = (data: unknown): boolean => {
    if (!data || typeof data !== "object") return false;

    if (!Array.isArray(data)) {
        const topKeys = Object.keys(data);
        if (topKeys.some((key) => /site|room|floor/i.test(key))) {
            return true;
        }
        for (const val of Object.values(data)) {
            if (Array.isArray(val) && val.length > 0) {
                const firstRow = val[0];
                if (firstRow && typeof firstRow === "object") {
                    if (Object.keys(firstRow).some((k) => /^(site|room|floor)/i.test(k))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    if (data.length > 0) {
        const firstRow = data[0];
        if (firstRow && typeof firstRow === "object") {
            return Object.keys(firstRow).some((k) => /^(site|room|floor)/i.test(k));
        }
    }

    return false;
};

/**
 * Updates allSitesHierarchyRecords (DCHierarchy and StoreHierarchy) with Site, Room, and Floor
 * properties extracted from API responses. Location, Device, Rack, etc. are ignored.
 */
const updateAllSitesHierarchyCache = (
    allSitesHierarchyRecords: IAllSitesHierarchy,
    apiData: unknown,
    setAllSitesHierarchyRecords: React.Dispatch<React.SetStateAction<IAllSitesHierarchy | undefined>> | ((records: IAllSitesHierarchy | undefined) => void)
): void => {
    const rows = extractRowsFromApiData(apiData);
    if (!rows.length) return;

    const sitePropsMap = new Map<string, Record<string, unknown>>();
    const roomPropsMap = new Map<string, Record<string, unknown>>();
    const floorPropsMap = new Map<string, Record<string, unknown>>();

    for (const row of rows) {
        const rawSiteId =
            row.SiteEntID ??
            row.SiteID ??
            (String(row.NodeType).toLowerCase() === "site"
                ? (row.EntID ?? row.NodeEntID)
                : undefined);
        const rawRoomId =
            row.RoomEntID ??
            row.RoomID ??
            (String(row.NodeType).toLowerCase() === "room"
                ? (row.EntID ?? row.NodeEntID)
                : undefined);
        const rawFloorId =
            row.FloorEntID ??
            row.FloorID ??
            (String(row.NodeType).toLowerCase() === "floor"
                ? (row.EntID ?? row.NodeEntID)
                : undefined);

        const siteId = getBaseId(rawSiteId);
        const roomId = getBaseId(rawRoomId);
        const floorId = getBaseId(rawFloorId);

        const siteProps: Record<string, unknown> = {};
        const roomProps: Record<string, unknown> = {};
        const floorProps: Record<string, unknown> = {};

        for (const [key, val] of Object.entries(row)) {
            if (/^site/i.test(key) || key.toLowerCase() === "measurement") {
                siteProps[key] = val;
            } else if (/^room/i.test(key)) {
                roomProps[key] = val;
            } else if (/^floor/i.test(key)) {
                floorProps[key] = val;
            }
        }

        if (siteId && Object.keys(siteProps).length > 0) {
            const existing = sitePropsMap.get(siteId) || {};
            for (const [k, v] of Object.entries(siteProps)) {
                if (v !== undefined && v !== null && v !== "") {
                    existing[k] = v;
                } else if (existing[k] === undefined && v !== undefined) {
                    existing[k] = v;
                }
            }
            sitePropsMap.set(siteId, existing);
        }

        if (roomId && Object.keys(roomProps).length > 0) {
            const existing = roomPropsMap.get(roomId) || {};
            for (const [k, v] of Object.entries(roomProps)) {
                if (v !== undefined && v !== null && v !== "") {
                    existing[k] = v;
                } else if (existing[k] === undefined && v !== undefined) {
                    existing[k] = v;
                }
            }
            roomPropsMap.set(roomId, existing);
        }

        if (floorId && Object.keys(floorProps).length > 0) {
            const existing = floorPropsMap.get(floorId) || {};
            for (const [k, v] of Object.entries(floorProps)) {
                if (v !== undefined && v !== null && v !== "") {
                    existing[k] = v;
                } else if (existing[k] === undefined && v !== undefined) {
                    existing[k] = v;
                }
            }
            floorPropsMap.set(floorId, existing);
        }
    }

    if (
        sitePropsMap.size === 0 &&
        roomPropsMap.size === 0 &&
        floorPropsMap.size === 0
    ) {
        return;
    }

    let anyChanged = false;
    let newDCHierarchy = allSitesHierarchyRecords.DCHierarchy;
    let newStoreHierarchy = allSitesHierarchyRecords.StoreHierarchy;

    if (allSitesHierarchyRecords.DCHierarchy) {
        const dcResult = updateHierarchyData(
            allSitesHierarchyRecords.DCHierarchy,
            sitePropsMap,
            roomPropsMap,
            floorPropsMap
        );
        if (dcResult.changed) {
            newDCHierarchy = dcResult.updatedData;
            anyChanged = true;
        }
    }

    if (allSitesHierarchyRecords.StoreHierarchy) {
        const storeResult = updateHierarchyData(
            allSitesHierarchyRecords.StoreHierarchy,
            sitePropsMap,
            roomPropsMap,
            floorPropsMap
        );
        if (storeResult.changed) {
            newStoreHierarchy = storeResult.updatedData;
            anyChanged = true;
        }
    }

    if (anyChanged) {
        allSitesHierarchyRecords.DCHierarchy = newDCHierarchy;
        allSitesHierarchyRecords.StoreHierarchy = newStoreHierarchy;
        setAllSitesHierarchyRecords({
            ...allSitesHierarchyRecords,
            DCHierarchy: newDCHierarchy,
            StoreHierarchy: newStoreHierarchy
        });
    }
};

const FnCallApiToGetDataForTree = async (originalTreeData: ITreeNode[], selectedNode: ITreeNode, featureId: string, statusBarContext: IStatusBar, sessionData?: ISession[], isRefresh?: boolean, idToRefresh?: string, applyFilter: boolean = true, allSitesHierarchyRecords?: IAllSitesHierarchy, setAllSitesHierarchyRecords?: React.Dispatch<React.SetStateAction<IAllSitesHierarchy | undefined>> | ((records: IAllSitesHierarchy | undefined) => void)) => {
    let roomToFilter: string | null = null;
    let partnerToFilter: string | null = null;
    let updatedOriginalData = FnDeepClone(originalTreeData);
    let filteredFormatted: ITreeNode[] | null = null;
    let isSiteOrFloor: boolean = false;
    if (applyFilter && sessionData?.length) {
        const locationData: ISession[] | null = FnGetSessionVariables(["Filter"], "ID", sessionData);
        const tenantID =
            locationData?.find((item) => item.VariableName === "TenantID")?.SessionValue || null;
        const tagID =
            locationData?.find((item) => item.VariableName === "TagID")?.SessionValue || null;
        const vendorID =
            locationData?.find((item) => item.VariableName === "VendorID")?.SessionValue || null;
        const teamID =
            locationData?.find((item) => item.VariableName === "TeamID")?.SessionValue || null;
        roomToFilter =
            locationData?.find((item) => item.VariableName === "FilterRoomID")?.SessionValue || null;
        if (tenantID || tagID || vendorID || teamID) {
            partnerToFilter = tenantID ?? tagID ?? vendorID ?? teamID ?? "";
        }
    }
    const isInv = ([FEnums.InventoryManagement, FEnums.InventoryConfiguration] as string[]).includes(featureId);
    const nodeType = selectedNode.NodeType?.toLowerCase();
    const treeType = selectedNode.treetype.toLowerCase();
    let apiData: any = undefined;
    if (!nodeType) {
        return { originalTreeData: updatedOriginalData, formattedTree: filteredFormatted };
    }
    if (["floor", "store"].includes(nodeType)) {
        let exploreType = 2;

        if (featureId === FEnums.AssetConfiguration) {
            exploreType = 2;
        } else if (featureId === FEnums.ConfigureDevice) {
            exploreType = 3;
        } else if (
            featureId === FEnums.InventoryManagement ||
            featureId === FEnums.InventoryConfiguration
        ) {
            exploreType = 1;
        }
        isSiteOrFloor = true
        apiData = await new Promise<any>(async (resolve) => {
            const handleFloorDevicesConfigurationHierarchyApiResponse = (
                floorDevicesConfigurationHierarchyApiResponse: unknown
            ) => {
                if (
                    floorDevicesConfigurationHierarchyApiResponse &&
                    typeof floorDevicesConfigurationHierarchyApiResponse === "object" &&
                    "hierarchyJson" in floorDevicesConfigurationHierarchyApiResponse
                ) {
                    resolve(
                        FnParseJsonSafely(
                            floorDevicesConfigurationHierarchyApiResponse.hierarchyJson as string
                        )
                    );
                } else {
                    resolve(null);
                }
            };
            await axiosInterceptor(
                {
                    url: EXPLORER.FloorDevicesConfigurationHierarchyReduced,
                    data: {
                        floorID: selectedNode.NodeEntID,
                        exploreType,
                        isRefresh: isRefresh ?? false
                    },
                    allowShowLoader: true,
                    setFetchData: handleFloorDevicesConfigurationHierarchyApiResponse
                },
                statusBarContext
            );
        });
    }
    else if (
        ["deviceslot", "device", "mounteddevice", "rack", "ru", "slot", "port", "inoutplug", "pm"].includes(treeType) ||
        ["deviceslot", "device", "mounteddevice", "rack", "ru", "slot", "port", "inoutplug", "pm"].includes(nodeType ?? "")
    ) {
        let exploreType = 2;
        if (featureId === FEnums.AssetConfiguration) {
            exploreType = 2;
        } else if (featureId === FEnums.ConfigureDevice) {
            exploreType = 3;
        } else if (
            featureId === FEnums.InventoryManagement ||
            featureId === FEnums.InventoryConfiguration
        ) {
            exploreType = 1;
        }

        apiData = await new Promise<any>(async (resolve) => {
            const handleMountedDeviceConfigurationHierarchyApiResponse = (
                mountedDeviceConfigurationHierarchyApiResponse: unknown
            ) => {
                if (
                    mountedDeviceConfigurationHierarchyApiResponse &&
                    typeof mountedDeviceConfigurationHierarchyApiResponse === "object" &&
                    "deviceJson" in mountedDeviceConfigurationHierarchyApiResponse
                ) {
                    resolve(
                        FnParseJsonSafely(
                            mountedDeviceConfigurationHierarchyApiResponse.deviceJson as string
                        )
                    );
                } else {
                    resolve(null);
                }
            };

            await axiosInterceptor(
                {
                    url: EXPLORER.MountedDeviceConfigurationHierarchyNew,
                    data: {
                        deviceID: selectedNode.MountedDeviceEntID?.length ? selectedNode.MountedDeviceEntID : selectedNode.NodeEntID,
                        isSearch: false,
                        keyword: "",
                        searchAllWord: false,
                        exploreType
                    },
                    allowShowLoader: true,
                    setFetchData: handleMountedDeviceConfigurationHierarchyApiResponse
                },
                statusBarContext
            );
        });
    }
    else if (nodeType === "site") {
        const targetSiteId = selectedNode.NodeEntID || getSiteIdFromSessionList(sessionData);
        const filteredAllSitesData = !isRefresh
            ? FnFilterSiteHierarchyFromAllSites(
                allSitesHierarchyRecords,
                targetSiteId,
                isInv
            )
            : null;

        if (filteredAllSitesData) {
            apiData = filteredAllSitesData;
        } else {
            isSiteOrFloor = true;
            let payload: object = {
                isSearch: false,
                keyword: "",
                exploreType: isInv ? 1 : 2,
                isRefresh: isRefresh ?? false
            };

            apiData = await new Promise<any>(async (resolve) => {
                const handleSiteHierarchyApiResponse = (siteHierarchyResponse: unknown) => {
                    if (
                        siteHierarchyResponse &&
                        typeof siteHierarchyResponse === "object" &&
                        "hierarchyJson" in siteHierarchyResponse
                    ) {
                        resolve(
                            FnParseJsonSafely(
                                siteHierarchyResponse.hierarchyJson as string
                            )
                        );
                    } else {
                        resolve(null);
                    }
                };

                await axiosInterceptor(
                    {
                        url: EXPLORER.SiteHierarchy,
                        data: payload,
                        allowShowLoader: true,
                        setFetchData: handleSiteHierarchyApiResponse
                    },
                    statusBarContext
                );
            });
        }
    }
    if (apiData) {
        if (
            isSiteOrFloor &&
            allSitesHierarchyRecords &&
            setAllSitesHierarchyRecords &&
            hasSiteRoomFloorProperties(apiData)
        ) {
            updateAllSitesHierarchyCache(allSitesHierarchyRecords, apiData, setAllSitesHierarchyRecords);
        }

        const formattedData = await FnConvertFlatDataToHierarchyData(
            apiData,
            isRefresh ? idToRefresh : selectedNode.NodeEntID,
            featureId,
            undefined,
            undefined,
            true
        );

        if (formattedData !== null) {
            if (selectedNode.MountedDeviceEntID && formattedData.length) {
                formattedData[0].MountedDeviceID = selectedNode.MountedDeviceEntID;
            }
            if (!isRefresh) {
                updatedOriginalData = await FnAddSubNode(
                    updatedOriginalData,
                    selectedNode.key,
                    formattedData,
                    undefined,
                    featureId,
                    false,
                    selectedNode.stepNo
                );

            }
            filteredFormatted = formattedData;
            if (applyFilter && partnerToFilter) {
                if (formattedData.length) {
                    const formattedFiltered = FnFilterTreeById(formattedData, partnerToFilter);
                    if (formattedFiltered.length) {
                        filteredFormatted = formattedFiltered;
                    }
                }
            }
        }
    }
    return { originalTreeData: updatedOriginalData, formattedTree: filteredFormatted, filterApplied: (partnerToFilter || roomToFilter) ? true : false, apiData }
}

export { FnCallApiToGetDataForTree }
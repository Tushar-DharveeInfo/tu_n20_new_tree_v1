import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { DELIMITER } from "../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { AUTH, EM, MISC } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { IValidWorksheetList } from "../allinterface/iappqaentitiescontainer/netzoom/IImportEntitiesWorkSheet";

type ILayoutRecord = Record<string, unknown>;

const awaitableFetchInterceptorToGetTables = (
    params: { data: Record<string, unknown> },
    statusBarContext: IStatusBar
) => {
    return new Promise<ILayoutRecord[] | undefined>((resolve) => {
        axiosInterceptor(
            {
                url: MISC.GetTableData,
                data: params.data,
                setFetchData: (resp: unknown, status?: string) => {
                    if (status === "200" && resp && typeof resp === "object" && "dataJson" in resp && resp.dataJson) {
                        try {
                            const jsonData = JSON.parse(resp.dataJson as string);
                            if (jsonData && Array.isArray(jsonData) && jsonData.length) {
                                resolve(jsonData as ILayoutRecord[]);
                            } else {
                                resolve(undefined);
                            }
                            return;
                        } catch (err) {
                            console.error("JSON parse error:", err);
                        }
                    }
                    resolve(undefined);
                },
            },
            statusBarContext
        );
    });
};

const toNumber = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

// Same out-of-bounds rule as FnGenerateFloorLayoutConfig.
const isOutsideBounds = (
    leftPos: number,
    topPos: number,
    width: number,
    length: number,
    parentWidth: number,
    parentLength: number
): boolean =>
    leftPos < 0 ||
    topPos < 0 ||
    leftPos + width > parentWidth ||
    topPos + length > parentLength;

const parseLayoutConfig = (value: unknown): Record<string, unknown> | null => {
    if (typeof value === "string") {
        const parsed = FnParseJsonSafely<Record<string, unknown>>(value);
        return parsed && typeof parsed === "object" ? parsed : null;
    }

    if (value && typeof value === "object") {
        return value as Record<string, unknown>;
    }

    return null;
};

const getFloorDimensions = (floorLayout: ILayoutRecord): { width: number; length: number } | null => {
    const width = toNumber(floorLayout.Width, NaN);
    const length = toNumber(floorLayout.Length, NaN);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(length) && length > 0) {
        return { width, length };
    }

    const config = parseLayoutConfig(floorLayout.FloorLayoutConfig);
    const configWidth = toNumber(config?.w, NaN);
    const configLength = toNumber(config?.h, NaN);
    if (Number.isFinite(configWidth) && configWidth > 0 && Number.isFinite(configLength) && configLength > 0) {
        return { width: configWidth, length: configLength };
    }

    return null;
};

// Prefer LocationLayoutConfig (x/y/w/h); fall back to LeftPos/TopPos/Width/Length columns.
const getLocationLayoutBounds = (
    locationLayout: ILayoutRecord
): { leftPos: number; topPos: number; width: number; length: number } => {
    const config = parseLayoutConfig(locationLayout.LocationLayoutConfig);

    if (config && typeof config === "object") {
        return {
            leftPos: toNumber(config.x ?? locationLayout.LeftPos),
            topPos: toNumber(config.y ?? locationLayout.TopPos),
            width: toNumber(config.w ?? locationLayout.Width),
            length: toNumber(config.h ?? locationLayout.Length),
        };
    }

    return {
        leftPos: toNumber(locationLayout.LeftPos),
        topPos: toNumber(locationLayout.TopPos),
        width: toNumber(locationLayout.Width),
        length: toNumber(locationLayout.Length),
    };
};

// Prefer DeviceLayoutConfig (x/y/w/h); fall back to LeftPos/TopPos/Width/Length columns.
const getDeviceLayoutBounds = (
    deviceLayout: ILayoutRecord
): { leftPos: number; topPos: number; width: number; length: number } => {
    const config = parseLayoutConfig(deviceLayout.DeviceLayoutConfig);

    if (config && typeof config === "object") {
        return {
            leftPos: toNumber(config.x ?? deviceLayout.LeftPos),
            topPos: toNumber(config.y ?? deviceLayout.TopPos),
            width: toNumber(config.w ?? deviceLayout.Width),
            length: toNumber(config.h ?? deviceLayout.Length),
        };
    }

    return {
        leftPos: toNumber(deviceLayout.LeftPos),
        topPos: toNumber(deviceLayout.TopPos),
        width: toNumber(deviceLayout.Width),
        length: toNumber(deviceLayout.Length),
    };
};

const deleteLayoutRecords = (
    tableName: string,
    entIds: string[],
    statusBarContext: IStatusBar
): Promise<boolean> =>
    new Promise((resolve) => {
        if (!entIds.length) {
            resolve(true);
            return;
        }

        axiosInterceptor(
            {
                url: EM.DeleteTableRecords,
                data: {
                    tableName,
                    entIDs: entIds.join(DELIMITER.separator),
                },
                allowShowLoader: true,
                setFetchData: (_resp: unknown, status?: string) => {
                    resolve(status === "200");
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error(`Failed to delete out-of-bounds ${tableName} records:`, error);
            resolve(false);
        });
    });

const FnPortImport = async (selectedSheet: IValidWorksheetList[], statusBarContext: IStatusBar) => {
    try {
        for (let index = 0; index < selectedSheet.length; index++) {
            const element = selectedSheet[index];
            const sheetName = element.sheetName.toLowerCase();
            const importedRowData = element.rowData;
            if (sheetName === "_user") {
                axiosInterceptor(
                    {
                        url: AUTH.EnableDisableUser,
                        data: {},
                        allowShowLoader: true,
                        setFetchData: (_response: unknown, _status?: string) => {
                            return;
                        },
                    },
                    statusBarContext
                );
            } else if (sheetName === "pg.locationlayout") {
                if (!importedRowData.length) {
                    continue;
                }
                const floorLayouts = await awaitableFetchInterceptorToGetTables(
                    {
                        data: { tableName: "PG.FloorLayout" },
                    },
                    statusBarContext
                );
                const locationLayouts = await awaitableFetchInterceptorToGetTables(
                    {
                        data: { tableName: "PG.LocationLayout" },
                    },
                    statusBarContext
                );
                const locationData = await awaitableFetchInterceptorToGetTables(
                    {
                        data: { tableName: "_Location" },
                    },
                    statusBarContext
                );

                if (floorLayouts?.length && locationData?.length && locationLayouts?.length) {
                    const entIdsToDelete: string[] = [];

                    for (let floorIndex = 0; floorIndex < floorLayouts.length; floorIndex++) {
                        const floorLayout = floorLayouts[floorIndex];
                        const floorDimensions = getFloorDimensions(floorLayout);
                        if (!floorDimensions) {
                            continue;
                        }

                        // Locations that belong to this floor (FloorLayout.EntID = Floor EntID).
                        const filteredItem = locationData.filter(
                            (item) => String(item.FloorID ?? "") === String(floorLayout.EntID ?? "")
                        );
                        if (filteredItem.length) {
                            for (let subIndex = 0; subIndex < filteredItem.length; subIndex++) {
                                const subElement = filteredItem[subIndex];
                                const locationLayout = locationLayouts.find(
                                    (item) => String(item.EntID ?? "") === String(subElement.EntID ?? "")
                                );
                                if (locationLayout) {
                                    const { leftPos, topPos, width, length } =
                                        getLocationLayoutBounds(locationLayout);
                                    const locationEntId = String(locationLayout.EntID ?? "");

                                    if (
                                        locationEntId &&
                                        isOutsideBounds(
                                            leftPos,
                                            topPos,
                                            width,
                                            length,
                                            floorDimensions.width,
                                            floorDimensions.length
                                        )
                                    ) {
                                        if (!entIdsToDelete.includes(locationEntId)) {
                                            entIdsToDelete.push(locationEntId);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (entIdsToDelete.length) {
                        await deleteLayoutRecords("PG.LocationLayout", entIdsToDelete, statusBarContext);
                    }
                }
            } else if (sheetName === "pg.devicelayout") {
                if (!importedRowData.length) {
                    continue;
                }
                const floorLayouts = await awaitableFetchInterceptorToGetTables(
                    {
                        data: { tableName: "PG.FloorLayout" },
                    },
                    statusBarContext
                );
                const deviceLayouts = await awaitableFetchInterceptorToGetTables(
                    {
                        data: { tableName: "PG.DeviceLayout" },
                    },
                    statusBarContext
                );
                const locationLayouts = await awaitableFetchInterceptorToGetTables(
                    {
                        data: { tableName: "PG.LocationLayout" },
                    },
                    statusBarContext
                );
                const deviceData = await awaitableFetchInterceptorToGetTables(
                    {
                        data: { tableName: "_Device" },
                    },
                    statusBarContext
                );

                if (deviceLayouts?.length && deviceData?.length) {
                    const entIdsToDelete: string[] = [];

                    for (let deviceIndex = 0; deviceIndex < deviceLayouts.length; deviceIndex++) {
                        const deviceLayout = deviceLayouts[deviceIndex];
                        const deviceEntId = String(deviceLayout.EntID ?? "");
                        if (!deviceEntId) {
                            continue;
                        }

                        const device = deviceData.find(
                            (item) => String(item.EntID ?? "") === deviceEntId
                        );
                        if (!device) {
                            continue;
                        }

                        const { leftPos, topPos, width, length } = getDeviceLayoutBounds(deviceLayout);
                        const locationId = String(device.LocationID ?? "");
                        const floorId = String(device.FloorID ?? "");

                        let parentWidth: number | null = null;
                        let parentLength: number | null = null;

                        // Device under location → check against LocationLayout size.
                        if (locationId) {
                            const locationLayout = locationLayouts?.find(
                                (item) => String(item.EntID ?? "") === locationId
                            );
                            if (!locationLayout) {
                                continue;
                            }
                            const locationBounds = getLocationLayoutBounds(locationLayout);
                            parentWidth = locationBounds.width;
                            parentLength = locationBounds.length;
                        }
                        // Device under floor → check against FloorLayout size.
                        else if (floorId) {
                            const floorLayout = floorLayouts?.find(
                                (item) => String(item.EntID ?? "") === floorId
                            );
                            if (!floorLayout) {
                                continue;
                            }
                            const floorDimensions = getFloorDimensions(floorLayout);
                            if (!floorDimensions) {
                                continue;
                            }
                            parentWidth = floorDimensions.width;
                            parentLength = floorDimensions.length;
                        } else {
                            continue;
                        }

                        if (
                            parentWidth != null &&
                            parentLength != null &&
                            isOutsideBounds(
                                leftPos,
                                topPos,
                                width,
                                length,
                                parentWidth,
                                parentLength
                            )
                        ) {
                            if (!entIdsToDelete.includes(deviceEntId)) {
                                entIdsToDelete.push(deviceEntId);
                            }
                        }
                    }

                    if (entIdsToDelete.length) {
                        await deleteLayoutRecords("PG.DeviceLayout", entIdsToDelete, statusBarContext);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error in FnPortImport:", error);
    }
};
export { FnPortImport };

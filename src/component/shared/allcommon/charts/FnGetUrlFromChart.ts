import { CHART, EM } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { FnGetUrlOfPublicFile } from "./FnGetUrlOfPublicFile";
import { FnHandleAPIResponse } from "../basic/FnHandleAPIResponse";
import { IChartProfile } from "../../context/allinterface/IChartProfile";
import { ISessionContextProps } from "../../context/allinterface/ISession";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { FnUpdatePayloadFromSessionAndNodeProperty } from "./FnUpdatePayloadFromSessionAndNodeProperty";
import { GenerateChartFromData } from "../../charts/generatechartfromdata/GenerateChartFromData";
import { FnGetBaseUrlFromKey } from "./FnGetBaseUrlFromKey";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";

const parseChartOptions = (chartOptions: unknown): any => {
    if (!chartOptions) return null;
    if (typeof chartOptions === "string") {
        try {
            return JSON.parse(chartOptions);
        } catch {
            return null;
        }
    }
    if (typeof chartOptions === "object") {
        return chartOptions;
    }
    return null;
};

// Checks if static API data is found inside ChartOptions -> data or ChartOptions -> series -> data
const hasStaticChartData = (chartOptions: unknown): boolean => {
    const parsed = parseChartOptions(chartOptions);
    if (!parsed || typeof parsed !== "object") {
        return false;
    }
    const directData = parsed.data;
    if (Array.isArray(directData) && directData.length > 0) {
        return true;
    }
    return false;
};

// Extracts static API data rows from ChartOptions -> data
const getStaticChartData = (chartOptions: unknown): unknown[] | null => {
    const parsed = parseChartOptions(chartOptions);
    if (!parsed || typeof parsed !== "object") {
        return null;
    }
    const directData = parsed.data;
    if (Array.isArray(directData) && directData.length > 0) {
        return directData;
    }
    return null;
};

const normalizeChartName = (value: string): string => {
    const base = value.toLowerCase().split(/[\\/]/).pop() ?? "";
    return base.replace(/[^a-z0-9]+/g, "").replace(/^get/, "");
};

const resolveChartDataPayload = (response: unknown): any => {
    if (!response) return null;
    if (typeof response === "string") return FnParseJsonSafely(response);
    if (typeof response !== "object") return null;
    const payload = response as Record<string, unknown>;
    if (typeof payload.chartJson === "string") return FnParseJsonSafely(payload.chartJson);
    if (payload.chartJson && typeof payload.chartJson === "object") return payload.chartJson;
    return payload;
};

const extractApiChartRows = (chartData: unknown): unknown[] => {
    if (!chartData) return [];
    if (Array.isArray(chartData)) return chartData;
    if (typeof chartData !== "object") return [];
    const record = chartData as Record<string, unknown>;
    if (Array.isArray(record.Data)) return record.Data;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.result)) return record.result;
    if (Array.isArray(record.Result)) return record.Result;
    if (Array.isArray(record.rows)) return record.rows;
    if (Array.isArray(record.Rows)) return record.Rows;
    if (record.ChartData && typeof record.ChartData === "object") {
        const nested = record.ChartData as Record<string, unknown>;
        if (Array.isArray(nested.Data)) return nested.Data;
        if (Array.isArray(nested.data)) return nested.data;
        if (Array.isArray(record.ChartData)) return record.ChartData as unknown[];
    }
    return [];
};

const fetchChartDataFromChartApi = async (
    chartName: string,
    chartProfile: any,
    statusBarContext: IStatusBar
): Promise<unknown[] | undefined> => {
    try {
        const response = await new Promise<unknown>((resolve) => {
            axiosInterceptor(
                {
                    url: CHART.GetData,
                    data: { chartNames: chartName },
                    allowShowLoader: false,
                    setFetchData: (apiResponse: unknown, status?: string) => {
                        if (status === '200') {
                            resolve(apiResponse);
                        } else {
                            resolve(null);
                        }
                    }
                },
                statusBarContext
            ).catch(() => resolve(null));
        });

        if (!response) return undefined;

        const parsed = resolveChartDataPayload(response);
        if (parsed?.ChartDataSet && Array.isArray(parsed.ChartDataSet) && parsed.ChartDataSet.length > 0) {
            const candidates = [
                chartName,
                chartProfile?._ChartProfile,
                chartProfile?.ChartDatasetAPI,
                chartProfile?.Name,
                chartProfile?.CPName,
            ]
                .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
                .map((v) => normalizeChartName(v));

            const matchedSet = parsed.ChartDataSet.find((item: any) => {
                const identifier = item?.CPName ?? item?._ChartProfile ?? item?.Name;
                if (!identifier) return false;
                const norm = normalizeChartName(String(identifier));
                return candidates.includes(norm);
            }) ?? parsed.ChartDataSet[0];

            if (matchedSet) {
                const rows = extractApiChartRows(matchedSet.ChartData ?? matchedSet);
                if (rows.length > 0) return rows;
            }
        } else if (parsed) {
            const directRows = extractApiChartRows(parsed);
            if (directRows.length > 0) return directRows;
        }
        return undefined;
    } catch (e) {
        console.error("Error fetching chart data via CHART.GetData:", e);
        return undefined;
    }
};

const FnGetUrlFromChart = async (props: {
    ApiName: string;
    chartProfileContext: IChartProfile;
    statusBarContext: IStatusBar;
    sessionContext: ISessionContextProps;
    apiProfiles?: unknown[];
    chartData?: unknown;
}) => {
    try {
        let chartURL = '';

        const callApiToGetValue = async (
            apiName: string,
            statusBarContext: IStatusBar,
            apiProfiles?: unknown[],
            apiFor?: string
        ) => {
            try {
                if (!apiProfiles) return "";

                function isApiProfile(item: any): item is {
                    BaseURL?: string;
                    Method?: string;
                    Payload?: any;
                    AddEdit?: string;
                    _ApiProfile?: string;
                } {
                    return item && typeof item === "object";
                }

                const filtered = (apiProfiles as any[]).find(
                    (item: any) => item._ApiProfile?.toLowerCase() === apiName?.toLowerCase()
                );

                if (!isApiProfile(filtered)) return "";
                if (!filtered || typeof filtered !== "object") return "";

                let payloadToPass: Record<string, any> = {};
                let baseUrlKey: string | null = filtered.BaseURL ?? null;
                let method: string | null = filtered.Method ?? null;
                let isAddEdit: boolean = (filtered.AddEdit as string) === "1";

                if ("Payload" in filtered && filtered.Payload) {
                    payloadToPass =
                        typeof filtered.Payload === "string"
                            ? JSON.parse(filtered.Payload)
                            : filtered.Payload;
                }

                if (!baseUrlKey || !method || isAddEdit) return "";

                if (payloadToPass && Object.keys(payloadToPass).length) {
                    payloadToPass = FnUpdatePayloadFromSessionAndNodeProperty(
                        payloadToPass,
                        props.sessionContext.SessionList
                    );
                    payloadToPass.sessionId = statusBarContext.userSessionId;
                }

                const baseUrl = FnGetBaseUrlFromKey(baseUrlKey);
                const sanitizedBaseUrl = baseUrl.replace(/\/+$/, "");
                const sanitizedMethod = method?.toLowerCase().trim().replace(/^\/+/, "");

                const resultFromApi: unknown = await new Promise((resolve, reject) => {
                    try {
                        axiosInterceptor(
                            {
                                url: `/${sanitizedMethod}`,
                                customBaseUrl: sanitizedBaseUrl,
                                data: payloadToPass,
                                setFetchData: async (apiResponse: unknown, status?: string) => {
                                    try {
                                        if (status !== "200") {
                                            resolve("");
                                            return;
                                        }

                                        if (typeof apiResponse === "object") {
                                            if (apiFor?.toLowerCase() === "imageapi") {
                                                const img = await FnGetUrlOfPublicFile("icons/favicon.svg");
                                                resolve(img);
                                            } else if (apiFor?.toLowerCase() === "chart") {
                                                const val = Object.values(apiResponse as object)[0];
                                                if (typeof val === "string") {
                                                    try {
                                                        const parsed = JSON.parse(val);
                                                        resolve(parsed?.Data ?? val);
                                                    } catch {
                                                        resolve(val);
                                                    }
                                                } else {
                                                    resolve(val);
                                                }
                                            } else {
                                                resolve(JSON.stringify(apiResponse));
                                            }
                                        } else {
                                            const parsedData = FnHandleAPIResponse(apiResponse, "Dataset");
                                            resolve(parsedData ?? apiResponse);
                                        }
                                    } catch (err) {
                                        console.error("Error parsing API response:", err);
                                        resolve("");
                                    }
                                }
                            },
                            statusBarContext
                        );
                    } catch (error) {
                        statusBarContext.setIsLoading(false);
                        reject(error);
                    }
                });

                return resultFromApi;
            } catch (err) {
                statusBarContext.setIsLoading(false);
                console.error("Error in callApiToGetValue:", err);
                return "";
            }
        };

        const apiCallForChartProfile = async (
            chartProfileContext: IChartProfile,
            statusBarContext: IStatusBar
        ): Promise<any[]> => {
            if (chartProfileContext?.ChartProfiles && chartProfileContext.ChartProfiles.length > 0) {
                return chartProfileContext.ChartProfiles;
            }

            const data = await new Promise<any[]>((resolve) => {
                axiosInterceptor(
                    {
                        url: EM.GetEntityRecords,
                        data: {
                            entityName: "ChartProfile",
                            entIDs: "",
                            tableName: `_ChartProfile`,
                            filterJsonString: null,
                            andor: "OR",
                            startRec: 0,
                            endRec: 0,
                        },
                        setFetchData: async (getEntityRecordsApiResponse: unknown) => {
                            try {
                                if (getEntityRecordsApiResponse) {
                                    const parsedData = FnHandleAPIResponse(
                                        getEntityRecordsApiResponse,
                                        "Dataset"
                                    );
                                    let rawProfiles: unknown =
                                        (parsedData as Record<string, unknown>)?.[`_ChartProfile`] ??
                                        (parsedData as Record<string, unknown>)?.[`ChartProfile`] ??
                                        (Array.isArray(parsedData) ? parsedData : undefined);

                                    if (!Array.isArray(rawProfiles)) {
                                        const directObj = typeof getEntityRecordsApiResponse === "string"
                                            ? FnParseJsonSafely(getEntityRecordsApiResponse)
                                            : getEntityRecordsApiResponse;
                                        if (directObj && typeof directObj === "object") {
                                            rawProfiles =
                                                (directObj as Record<string, unknown>)?.[`_ChartProfile`] ??
                                                (directObj as Record<string, unknown>)?.[`ChartProfile`];
                                        }
                                    }

                                    if (Array.isArray(rawProfiles)) {
                                        chartProfileContext?.setChartProfiles?.(
                                            rawProfiles as any[]
                                        );
                                        resolve(rawProfiles as any[]);
                                        return;
                                    }
                                }
                                resolve([]);
                            } catch (err) {
                                console.error("Error parsing _ChartProfile:", err);
                                resolve([]);
                            }
                        },
                    },
                    statusBarContext
                ).catch(() => resolve([]));
            });

            return data;
        };

        function buildChartConfig(chartProfile: any) {
            // If already fully configured series with data (from dashboard), use directly
            if (
                Array.isArray(chartProfile.series) &&
                chartProfile.series.length > 0 &&
                chartProfile.series[0]?.data &&
                Array.isArray(chartProfile.series[0].data)
            ) {
                const chartType = chartProfile.ChartType?.toLowerCase() || (chartProfile.series[0]?.type as string) || "bar";
                const chartRows = chartProfile.data ?? chartProfile.ChartData ?? chartProfile.series[0].data;
                const safeSeries = chartProfile.series.map((s: any) => ({
                    ...s,
                    type: s.type || chartType,
                    data: (Array.isArray(s.data) && s.data.length > 0) ? s.data : chartRows,
                }));
                return {
                    ...chartProfile,
                    ChartType: chartType,
                    series: safeSeries,
                    data: chartRows,
                    ChartData: chartRows,
                    title: chartProfile.title ?? chartProfile._ChartProfile,
                    subtitle: chartProfile.subtitle ?? chartProfile.Description,
                };
            }

            // Parse series config from ChartOptions (string → JSON)
            const seriesOptions: any = parseChartOptions(chartProfile.ChartOptions) || {};

            const rawRows = chartProfile.ChartData ?? chartProfile.data ?? getStaticChartData(chartProfile.ChartOptions);
            const chartRows = Array.isArray(rawRows)
                ? rawRows
                : (rawRows && typeof rawRows === "object" ? [rawRows] : []);

            let seriesList = Array.isArray(seriesOptions.series) ? seriesOptions.series : [];

            if (seriesList.length === 0 && chartRows.length > 0) {
                // Auto-detect numeric and category keys from first row if series is not defined in options
                const firstRow = chartRows[0];
                if (firstRow && typeof firstRow === "object") {
                    const keys = Object.keys(firstRow);
                    const numKey = keys.find((k) => typeof firstRow[k] === "number" || (!isNaN(Number(firstRow[k])) && firstRow[k] !== ""));
                    const catKey = keys.find((k) => k !== numKey) ?? keys[0];
                    if (catKey && numKey) {
                        seriesList = [{
                            type: chartProfile.ChartType?.toLowerCase() || "bar",
                            xKey: catKey,
                            yKey: numKey,
                            xName: catKey,
                            yName: numKey,
                        }];
                    }
                }
            }

            const chartType = chartProfile.ChartType?.toLowerCase() || (seriesList[0]?.type as string) || "bar";
            const series = seriesList.map((s: any) => ({
                ...s,
                type: s.type || chartType,
                data: (Array.isArray(s.data) && s.data.length > 0) ? s.data : chartRows,
            }));

            return {
                IsNZ: chartProfile.IsNZ ? 1 : 0,
                EntityName: "Dashboard",
                GroupName: chartProfile.GroupName,
                Description: chartProfile.Description,
                ChartType: chartType,
                SortOrder: chartProfile.SortOrder,
                Enabled: chartProfile.Enabled ? 1 : 0,
                noLabel: false,
                series: series,
                data: chartRows,
                ChartData: chartRows,
                title: seriesOptions.title ?? chartProfile.title ?? chartProfile._ChartProfile,
                subtitle: seriesOptions.subtitle ?? chartProfile.subtitle ?? chartProfile.Description,
            };
        }

        const selectedChart = props.chartData && typeof props.chartData === "object"
            ? (props.chartData as Record<string, any>)
            : null;

        const chartProfiles = await apiCallForChartProfile(props.chartProfileContext, props.statusBarContext);
        const reportRecords = chartProfiles || [];
        let chartDataSet: any = null;

        const targetName = props.ApiName?.trim().toLowerCase();
        const normalizedTarget = normalizeChartName(props.ApiName ?? "");

        if (targetName) {
            chartDataSet = reportRecords.find((item: any) => {
                if (!item) return false;
                const chartDatasetApi = item.ChartDatasetAPI?.trim().toLowerCase();
                const chartProfile = item._ChartProfile?.trim().toLowerCase();
                const name = item.Name?.trim().toLowerCase();
                const cpName = item.CPName?.trim().toLowerCase();
                const description = item.Description?.trim().toLowerCase();
                const parsedOpts = parseChartOptions(item.ChartOptions);
                const optionsTitle = typeof parsedOpts?.title === "string"
                    ? parsedOpts.title.trim().toLowerCase()
                    : typeof parsedOpts?.title?.text === "string"
                    ? parsedOpts.title.text.trim().toLowerCase()
                    : "";

                if (
                    chartProfile === targetName ||
                    chartDatasetApi === targetName ||
                    name === targetName ||
                    cpName === targetName ||
                    optionsTitle === targetName ||
                    description === targetName
                ) {
                    return true;
                }

                if (normalizedTarget) {
                    if (chartProfile && normalizeChartName(chartProfile) === normalizedTarget) return true;
                    if (chartDatasetApi && normalizeChartName(chartDatasetApi) === normalizedTarget) return true;
                    if (name && normalizeChartName(name) === normalizedTarget) return true;
                    if (cpName && normalizeChartName(cpName) === normalizedTarget) return true;
                    if (optionsTitle && normalizeChartName(optionsTitle) === normalizedTarget) return true;
                }

                return false;
            });

            if (!chartDataSet) {
                chartDataSet = reportRecords.find((item: any) => {
                    if (!item) return false;
                    const chartProfile = item._ChartProfile?.trim().toLowerCase();
                    const chartDatasetApi = item.ChartDatasetAPI?.trim().toLowerCase();
                    const name = item.Name?.trim().toLowerCase();
                    return (
                        (chartProfile && (targetName.includes(chartProfile) || chartProfile.includes(targetName))) ||
                        (name && (targetName.includes(name) || name.includes(targetName))) ||
                        (chartDatasetApi && (targetName.includes(chartDatasetApi) || chartDatasetApi.includes(targetName)))
                    );
                });
            }
        }

        // If not found in profiles, use the passed selected chart data from print button
        if (!chartDataSet && selectedChart) {
            chartDataSet = { ...selectedChart };
        }

        if (!chartDataSet && !selectedChart) {
            return "";
        }

        // Merge chart profile details with selected chart data passed from dashboard print button
        const chartProfileRecord: any = {
            ...(chartDataSet ?? {}),
            ...(selectedChart ?? {}),
        };
        if (chartDataSet) {
            chartProfileRecord._ChartProfile = chartDataSet._ChartProfile ?? chartProfileRecord._ChartProfile;
            chartProfileRecord.ChartDatasetAPI = chartDataSet.ChartDatasetAPI ?? chartProfileRecord.ChartDatasetAPI;
            chartProfileRecord.ChartOptions = chartDataSet.ChartOptions ?? chartProfileRecord.ChartOptions;
            chartProfileRecord.ChartType = selectedChart?.ChartType ?? chartDataSet.ChartType ?? chartProfileRecord.ChartType;
        }

        // Check if static data key is found inside ChartOptions -> data
        const chartOptionsToCheck = chartProfileRecord.ChartOptions ?? selectedChart?.ChartOptions;
        const hasStaticData = hasStaticChartData(chartOptionsToCheck);
        const staticData = getStaticChartData(chartOptionsToCheck);
        const hasPassedChartData = Boolean(
            (Array.isArray(selectedChart?.series) && selectedChart.series.length > 0 && Array.isArray(selectedChart.series[0]?.data) && selectedChart.series[0].data.length > 0) ||
            (Array.isArray(selectedChart?.data) && selectedChart.data.length > 0) ||
            (Array.isArray(selectedChart?.ChartData) && selectedChart.ChartData.length > 0)
        );
        const hasDatasetApi = Boolean(chartProfileRecord.ChartDatasetAPI && String(chartProfileRecord.ChartDatasetAPI).trim());

        if (hasStaticData && staticData && staticData.length > 0) {
            // 1. Static data found in ChartOptions -> data: DO NOT CALL API!
            chartProfileRecord.ChartData = staticData;
            chartProfileRecord.data = staticData;
        } else if (hasPassedChartData) {
            // 2. Selected chart already has loaded data from dashboard: DO NOT CALL API!
            chartProfileRecord.series = selectedChart?.series ?? chartProfileRecord.series;
            chartProfileRecord.ChartData = selectedChart?.data ?? selectedChart?.ChartData ?? selectedChart?.series?.[0]?.data ?? [];
            chartProfileRecord.data = chartProfileRecord.ChartData;
        } else if (!hasDatasetApi) {
            // 3. No chart dataset API found: DO NOT CALL API! Use static/existing keys
            chartProfileRecord.ChartData = staticData
                ?? selectedChart?.data
                ?? selectedChart?.ChartData
                ?? chartProfileRecord.ChartData
                ?? chartProfileRecord.data
                ?? [];
            chartProfileRecord.data = chartProfileRecord.ChartData;
        } else {
            // 4. No static data, no passed chart data, but dataset API exists: call API
            const chartName = chartProfileRecord._ChartProfile || props.ApiName;
            let chartRows = await fetchChartDataFromChartApi(
                chartName,
                chartProfileRecord,
                props.statusBarContext
            );

            if ((!chartRows || chartRows.length === 0) && chartProfileRecord.ChartDatasetAPI && chartProfileRecord.ChartDatasetAPI !== chartName) {
                chartRows = await fetchChartDataFromChartApi(
                    chartProfileRecord.ChartDatasetAPI,
                    chartProfileRecord,
                    props.statusBarContext
                );
            }

            if (chartRows && chartRows.length > 0) {
                chartProfileRecord.ChartData = chartRows;
                chartProfileRecord.data = chartRows;
            } else if (chartProfileRecord.ChartDatasetAPI) {
                const apiData = await callApiToGetValue(
                    chartProfileRecord.ChartDatasetAPI,
                    props.statusBarContext,
                    props.apiProfiles,
                    "chart"
                );
                chartProfileRecord.ChartData = apiData;
                chartProfileRecord.data = apiData;
            }
        }

        const convertFinalChartData = buildChartConfig(chartProfileRecord);
        const url = await GenerateChartFromData(convertFinalChartData, convertFinalChartData.ChartType);
        chartURL = url;

        return chartURL;
    } catch (err) {
        console.error("Error in FnGetUrlFromChart:", err);
        return "";
    }
};

export { FnGetUrlFromChart, hasStaticChartData, getStaticChartData, parseChartOptions };
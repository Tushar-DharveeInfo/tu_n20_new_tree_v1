import { EntityNameEnums } from "../../alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnHandleAPIResponse } from "../basic/FnHandleAPIResponse";
import { IReportProfileItem } from "../../context/allinterface/IReport";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { ALERT, FS, NODE } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { TChartRecord } from "../../allinterface/charts/IDashboardChart";
import { ISessionVariable } from "../../allinterface/basic/ISessionVariable";
import { ISelectedNodeProperty } from "../../context/allinterface/ISelectedNode";

type TReportTemplateJson = Record<string, unknown>;

type TFnGetReportByNameResult = {
    report: IReportProfileItem | null;
    template: TReportTemplateJson | null;
};

/** Normalizes report group/name values for case-insensitive comparison. */
const normalizeReportKey = (value: unknown): string =>
    String(value ?? "").trim().toLowerCase();

/** Maps a raw report profile API record to IReportProfileItem. */
const mapToReportProfileItem = (data: Record<string, unknown>): IReportProfileItem => ({
    _ReportProfile: String(data.Name ?? ""),
    Description: String(data.Description ?? ""),
    EntityNames: String(data.EntityNames ?? ""),
    ...Object.fromEntries(
        Object.entries(data).filter(
            ([key]) => !["_ReportProfile", "Description", "EntityNames"].includes(key)
        )
    ),
});

/** Finds a report profile record by group name and report name. */
const findReportProfileByGroupAndName = (
    reportRecords: Record<string, unknown>[],
    groupName: string,
    name: string
): IReportProfileItem | null => {
    const normalizedGroupName = normalizeReportKey(groupName);
    const normalizedName = normalizeReportKey(name);

    const matchedRecord = reportRecords.find((record) => {
        const recordGroupName = normalizeReportKey(record.GroupName);
        const recordName = normalizeReportKey(record.Name ?? record._ReportProfile);
        return recordGroupName === normalizedGroupName && recordName === normalizedName;
    });

    return matchedRecord ? mapToReportProfileItem(matchedRecord) : null;
};

/** Fetches all report profile records from the alert profiles API. */
const fetchReportProfiles = (
    statusBarContext: IStatusBar
): Promise<Record<string, unknown>[]> =>
    new Promise((resolve) => {
        axiosInterceptor(
            {
                url: ALERT.GetAlertProfiles,
                data: {
                    entityName: EntityNameEnums.ReportProfile,
                },
                allowShowLoader: true,
                setFetchData: (handleReportProfiles: unknown, status?: string) => {
                    if (
                        status === "200" &&
                        handleReportProfiles &&
                        typeof handleReportProfiles === "object" &&
                        "alertJson" in handleReportProfiles
                    ) {
                        const reportRecords = FnHandleAPIResponse(
                            handleReportProfiles.alertJson,
                            "Dataset"
                        );
                        resolve(Array.isArray(reportRecords) ? reportRecords : []);
                        return;
                    }
                    resolve([]);
                },
            },
            statusBarContext
        );
    });

/** Decodes a base64-encoded report template blob into a JSON object. */
const decodeReportTemplateBlob = (base64: string): Record<string, unknown> | null => {
    try {
        if (!base64?.length) {
            return null;
        }

        const jsonString = atob(base64);
        const parsed = FnParseJsonSafely<Record<string, unknown>, null>(jsonString, { fallback: null });
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
};

/** Loads and decodes the report template JSON file for a report profile. */
const fetchReportTemplateJson = async (
    report: IReportProfileItem,
    statusBarContext: IStatusBar
): Promise<TReportTemplateJson | null> => {
    const kebabMenuResponse = await new Promise<unknown>((resolve) => {
        axiosInterceptor(
            {
                url: NODE.GetKebabMenuData,
                data: {
                    entID: report.EntID,
                    entityName: report.EntityName,
                    kebabMenuTableName: "PG.FileProfile",
                },
                setFetchData: (response: unknown, status?: string) => {
                    resolve(status === "200" ? response : null);
                },
            },
            statusBarContext
        );
    });

    if (
        !kebabMenuResponse ||
        typeof kebabMenuResponse !== "object" ||
        !("propertyJson" in kebabMenuResponse)
    ) {
        return null;
    }

    const parsedKebabData = FnParseJsonSafely<Record<string, unknown>, null>(
        (kebabMenuResponse as Record<string, unknown>).propertyJson as string,
        { fallback: null }
    );
    const fileProfileRecords = parsedKebabData?.["PG.FileProfile"];
    if (!Array.isArray(fileProfileRecords) || !fileProfileRecords.length) {
        return null;
    }

    const fileData = fileProfileRecords[0] as Record<string, unknown>;
    const fileStreamResponse = await new Promise<unknown>((resolve) => {
        axiosInterceptor(
            {
                url: FS.GetFileStream,
                data: {
                    entID: fileData.EntID,
                    entityName: fileData.EntityName,
                    fileCategory: fileData.FileCategory,
                    fileName: fileData.DocName,
                    fileExtension: fileData.FileExtension,
                    fileUID: fileData.FileUID,
                },
                setFetchData: (response: unknown, status?: string) => {
                    resolve(status === "200" ? response : null);
                },
            },
            statusBarContext
        );
    });

    if (
        !fileStreamResponse ||
        typeof fileStreamResponse !== "object" ||
        !("fileBlob" in fileStreamResponse) ||
        !(fileStreamResponse as Record<string, unknown>).fileBlob
    ) {
        return null;
    }

    return decodeReportTemplateBlob(
        String((fileStreamResponse as Record<string, unknown>).fileBlob)
    );
};


/**
 * Returns a report profile and its template JSON by group name and report name.
 * Defaults groupName to "Default" when not provided.
 */
const FnGetReportBasedOnName = async (
    name: string,
    statusBarContext: IStatusBar,
    groupName?: string
): Promise<TFnGetReportByNameResult> => {
    const reportRecords = await fetchReportProfiles(statusBarContext);
    const resolvedGroupName = groupName?.trim() || "Default";
    const report = findReportProfileByGroupAndName(reportRecords, resolvedGroupName, name);

    if (!report) {
        statusBarContext?.setUserActionData?.(
            `Report not found for GroupName "${resolvedGroupName}" and Name "${name}".`
        );
        return { report: null, template: null };
    }

    const template = await fetchReportTemplateJson(report, statusBarContext);
    if (!template) {
        statusBarContext?.setUserActionData?.(
            `Template file not found for report "${report._ReportProfile}".`
        );
    }

    return { report, template };
};

const CHART_IMAGE_NAME = "Chart";
const DEVICE_VIEW_IMAGE_NAME = "DeviceView";

/** Helper to strip escaped and raw newlines from a JSON string. */
const cleanJsonString = (jsonString: string): string =>
    jsonString.replace(/\\n/g, "").replace(/\r?\n/g, "").trim();

/** Checks whether an image node is the company logo (NetZoom logo) which should never be overwritten. */
const isLogoOrCompanyImage = (image: Record<string, unknown>): boolean => {
    if (!image || typeof image !== "object") return false;
    const name = normalizeReportKey(image.name);
    const url = normalizeReportKey(image.url ?? image.src ?? image.image);
    if (name.includes("logo") || name.includes("netzoom") || url.includes("logo") || url.includes("netzoom")) {
        return true;
    }
    if (typeof image.api === "string") {
        const lower = image.api.toLowerCase();
        if (lower.includes("logo") || lower.includes("netzoom") || lower.includes('"file"')) {
            return true;
        }
    } else if (image.api && typeof image.api === "object") {
        const apiObj = image.api as Record<string, unknown>;
        if (String(apiObj.source ?? "").toLowerCase() === "file") return true;
        const payloadName = String((apiObj.payload as any)?.name ?? "").toLowerCase();
        if (payloadName.includes("logo") || payloadName.includes("netzoom")) return true;
    }
    return false;
};

/** Checks whether a template image node is the chart placeholder. */
const isChartImage = (image: Record<string, unknown>): boolean => {
    if (!image || typeof image !== "object") {
        return false;
    }

    if (isLogoOrCompanyImage(image)) {
        return false;
    }

    const normalizedName = normalizeReportKey(image.name);
    if (normalizedName === normalizeReportKey(CHART_IMAGE_NAME) || normalizedName.includes("chart")) {
        return true;
    }

    if (image.api && typeof image.api === "object") {
        const apiObj = image.api as Record<string, unknown>;
        return String(apiObj.source ?? "").trim().toLowerCase() === "chart";
    }

    if (typeof image.api !== "string" || !image.api.trim()) {
        return false;
    }

    const apiString = cleanJsonString(image.api);
    const parsedApi = FnParseJsonSafely<Record<string, unknown>, null>(apiString, {
        fallback: null,
    });

    return String(parsedApi?.source ?? "").trim().toLowerCase() === "chart";
};

/** Checks whether a template image node is the device view placeholder. */
const isDeviceViewImage = (image: Record<string, unknown>): boolean => {
    if (normalizeReportKey(image.name) === normalizeReportKey(DEVICE_VIEW_IMAGE_NAME)) {
        return true;
    }

    if (typeof image.api !== "string" || !image.api.trim()) {
        return false;
    }

    const parsedApi = FnParseJsonSafely<Record<string, unknown>, null>(image.api, {
        fallback: null,
    });

    return parsedApi?.source === "DeviceView";
};

/** Normalizes Front/Rear to the payload value expected by DeviceView APIs. */
const normalizeDeviceViewSide = (diplayDeviceView: "Front" | "Rear"): "front" | "rear" =>
    diplayDeviceView.toLowerCase() as "front" | "rear";

/** Updates api.payload.name on the chart image so the report resolves the correct chart. */
const updateChartImageApiName = (
    image: Record<string, unknown>,
    chartTitle: string,
    chartData?: unknown,
    force = false
): Record<string, unknown> => {
    if (isLogoOrCompanyImage(image)) {
        return image;
    }

    if (!force && !isChartImage(image)) {
        return image;
    }

    let parsedApi: Record<string, unknown> | null = null;
    if (typeof image.api === "string" && image.api.trim()) {
        const apiString = cleanJsonString(image.api);
        parsedApi = FnParseJsonSafely<Record<string, unknown>, null>(apiString, {
            fallback: null,
        });
    } else if (image.api && typeof image.api === "object") {
        parsedApi = { ...(image.api as Record<string, unknown>) };
    }

    const imageId = String(image.id ?? image.uniqueName ?? image.name ?? chartTitle);

    if (!parsedApi) {
        if (force) {
            return {
                ...image,
                id: imageId,
                name: chartTitle,
                chartData: chartData ?? (image as any).chartData,
                api: JSON.stringify({
                    source: "Chart",
                    payload: {
                        id: imageId,
                        name: chartTitle,
                        chartData: chartData,
                    },
                }),
            };
        }
        return image;
    }

    const existingPayload =
        parsedApi.payload && typeof parsedApi.payload === "object"
            ? (parsedApi.payload as Record<string, unknown>)
            : {};

    const updatedApi = {
        ...parsedApi,
        source: "Chart",
        payload: {
            ...existingPayload,
            id: imageId,
            name: chartTitle,
            chartData: chartData ?? existingPayload.chartData,
        },
    };

    return {
        ...image,
        id: imageId,
        name: chartTitle,
        chartData: chartData ?? (image as any).chartData,
        api: typeof image.api === "object" && image.api !== null ? updatedApi : JSON.stringify(updatedApi),
    };
};

/** Updates api.payload.diplayDeviceView on the device view image. */
const updateDeviceViewImageApi = (
    image: Record<string, unknown>,
    diplayDeviceView: "Front" | "Rear"
): Record<string, unknown> => {
    if (!isDeviceViewImage(image) || typeof image.api !== "string" || !image.api.trim()) {
        return image;
    }

    const parsedApi = FnParseJsonSafely<Record<string, unknown>, null>(image.api, {
        fallback: null,
    });
    if (!parsedApi) {
        return image;
    }

    const existingPayload =
        parsedApi.payload && typeof parsedApi.payload === "object"
            ? (parsedApi.payload as Record<string, unknown>)
            : {};

    return {
        ...image,
        api: JSON.stringify({
            ...parsedApi,
            payload: {
                ...existingPayload,
                diplayDeviceView: normalizeDeviceViewSide(diplayDeviceView),
            },
        }),
    };
};

/** Walks the report template and applies the chart title to every chart image node. */
const updateTemplateForChartTitle = (
    node: unknown,
    chartTitle: string,
    chartData?: unknown,
    parentKey?: string
): TReportTemplateJson => {
    if (!node || typeof node !== "object") {
        return (node ?? {}) as TReportTemplateJson;
    }
    if (Array.isArray(node)) {
        return node.map((item) => updateTemplateForChartTitle(item, chartTitle, chartData, parentKey)) as unknown as TReportTemplateJson;
    }

    let record = { ...(node as Record<string, unknown>) };

    const isHeaderSection =
        parentKey === "header" ||
        String(record.type ?? record.name ?? record.NodeType ?? "").toLowerCase().includes("header");

    if (Array.isArray(record.imageArray)) {
        record.imageArray = record.imageArray.map((image) => {
            if (!image || typeof image !== "object") return image;
            const imgObj = image as Record<string, unknown>;
            if (isLogoOrCompanyImage(imgObj) || isHeaderSection) {
                return imgObj;
            }
            if (isChartImage(imgObj)) {
                return updateChartImageApiName(imgObj, chartTitle, chartData, true);
            }
            return imgObj;
        });
    }

    if (!isHeaderSection && isChartImage(record) && !isLogoOrCompanyImage(record)) {
        record = updateChartImageApiName(record, chartTitle, chartData, true);
    }

    for (const [key, value] of Object.entries(record)) {
        if (key === "imageArray" || !value || typeof value !== "object") {
            continue;
        }
        record[key] = updateTemplateForChartTitle(value, chartTitle, chartData, key);
    }

    return record as TReportTemplateJson;
};

/** Walks the report template and applies diplayDeviceView to every device view image node. */
const updateTemplateForDeviceView = (
    node: unknown,
    diplayDeviceView: "Front" | "Rear"
): TReportTemplateJson => {
    if (!node || typeof node !== "object") {
        return (node ?? {}) as TReportTemplateJson;
    }

    if (Array.isArray(node)) {
        return node.map((item) =>
            updateTemplateForDeviceView(item, diplayDeviceView)
        ) as unknown as TReportTemplateJson;
    }

    const record = { ...(node as Record<string, unknown>) };

    if (Array.isArray(record.imageArray)) {
        record.imageArray = record.imageArray.map((image) =>
            updateDeviceViewImageApi(image as Record<string, unknown>, diplayDeviceView)
        );
    }

    for (const [key, value] of Object.entries(record)) {
        if (key === "imageArray" || !value || typeof value !== "object") {
            continue;
        }
        record[key] = updateTemplateForDeviceView(value, diplayDeviceView);
    }

    return record as TReportTemplateJson;
};

/** Walks the report template JSON and replaces `<_title>` in any `label` / `Label` property with `titleToReplace`. */
const replaceTitleInTemplate = (
    node: unknown,
    titleToReplace: string
): TReportTemplateJson => {
    if (!node || typeof node !== "object") {
        return node as TReportTemplateJson;
    }

    if (Array.isArray(node)) {
        return node.map((item) =>
            replaceTitleInTemplate(item, titleToReplace)
        ) as unknown as TReportTemplateJson;
    }

    const record = { ...(node as Record<string, unknown>) };

    for (const [key, value] of Object.entries(record)) {
        if (
            key.toLowerCase() === "label" &&
            typeof value === "string" &&
            /<_title>/i.test(value)
        ) {
            record[key] = value.replace(/<_title>/gi, () => titleToReplace);
        } else if (value && typeof value === "object") {
            record[key] = replaceTitleInTemplate(value, titleToReplace);
        }
    }

    return record as TReportTemplateJson;
};

/**
 * Builds a chart report from the dashboard chart data.
 * Loads the "Chart" report template, finds the chart image in imageArray,
 * and sets api.payload.name to the chart title so the report renders the correct chart.
 */
const CreateReportForChart = async (
    chartData: TChartRecord,
    statusBarContext: IStatusBar,
    titleToReplace?: string
): Promise<TFnGetReportByNameResult> => {
    try {

        statusBarContext.setIsLoading(true);
        const { report, template } = await FnGetReportBasedOnName("Chart", statusBarContext);

        if (!report || !template) {
            return { report, template: null };
        }

        const chartTitle =
            String(chartData?._ChartProfile ?? "").trim() ||
            (typeof chartData?.title === "string" ? chartData.title.trim() : "") ||
            (chartData?.title && typeof chartData.title === "object"
                ? String((chartData.title as { text?: unknown }).text ?? "").trim()
                : "") ||
            String(chartData?.Name ?? "").trim() ||
            String(chartData?.CPName ?? "").trim() ||
            String(chartData?.Description ?? "").trim();

        if (!chartTitle) {
            statusBarContext?.setUserActionData?.("Chart profile title is required to create report.");
            return { report, template: null };
        }
        let updatedTemplate = updateTemplateForChartTitle(template, chartTitle, chartData);
        const effectiveTitle = typeof titleToReplace === "string" ? titleToReplace : chartTitle;
        if (typeof effectiveTitle === "string") {
            updatedTemplate = replaceTitleInTemplate(updatedTemplate, effectiveTitle);
        }
        return {
            report,
            template: updatedTemplate,
        };
    } catch (err) {
        statusBarContext.setIsLoading(false)
        console.error(err);
        return { report: null, template: null };
    } finally {
        statusBarContext.setIsLoading(false)
    }
};

/**
 * Builds a device view report from the selected front/rear view.
 * Loads the device view report template and sets api.payload.diplayDeviceView.
 */
const CreateReportForDeviceView = async (
    templateName: string,
    diplayDeviceView: "Front" | "Rear",
    statusBarContext: IStatusBar
): Promise<TFnGetReportByNameResult> => {
    try {
        statusBarContext.setIsLoading(true);
        const { report, template } = await FnGetReportBasedOnName(templateName, statusBarContext);

        if (!report || !template) {
            return { report, template: null };
        }

        const updatedTemplate = updateTemplateForDeviceView(template, diplayDeviceView);
        return {
            report,
            template: updatedTemplate,
        };
    } catch (err) {
        statusBarContext.setIsLoading(false);
        console.error(err);
        return { report: null, template: null };
    } finally {
        statusBarContext.setIsLoading(false);
    }
};
/**
 * Loads the "GoogleMap" report template and returns it as-is.
 * No API payload updates are applied.
 */
const findTemplateWithoutUpdatePayload = async (
    type: string,
    statusBarContext: IStatusBar
): Promise<TFnGetReportByNameResult> => {
    try {
        statusBarContext.setIsLoading(true);
        const { report, template } = await FnGetReportBasedOnName(type, statusBarContext);

        if (!report || !template) {
            return { report, template: null };
        }

        return { report, template };
    } catch (err) {
        statusBarContext.setIsLoading(false);
        console.error(err);
        return { report: null, template: null };
    } finally {
        statusBarContext.setIsLoading(false);
    }
};

/** Resolves placeholder values like <SelectedWorkorder> from session list and node properties. */
const resolvePayloadPlaceholders = (
    payload: Record<string, unknown>,
    sessionList?: ISessionVariable[],
    selectedNodeProps?: ISelectedNodeProperty
): Record<string, unknown> => {
    const convertToCorrectType = (value: unknown): unknown => {
        if (typeof value !== "string") return value;
        const trimmed = value.trim().toLowerCase();
        if (trimmed === "true") return true;
        if (trimmed === "false") return false;
        if (trimmed === "") return "";
        if (!isNaN(Number(trimmed))) return Number(trimmed);
        return value;
    };

    const resolvePlaceholder = (val: string): unknown => {
        const isPlaceholder = /^<[^<>?]+(\?)?>$/.test(val);
        if (!isPlaceholder) return convertToCorrectType(val);

        const isOptional = val.includes("?>");
        const key = val.replace(/^<|[\?>]*>$/g, "").trim().toLowerCase();

        const sessionItem = sessionList?.find(
            (item) => (item.VariableName ?? "").toLowerCase() === key
        );
        let resolved: unknown = sessionItem?.SessionValue;

        if (resolved === undefined && selectedNodeProps) {
            const foundKey = Object.keys(selectedNodeProps).find(
                (k) => k.toLowerCase() === key
            );
            if (foundKey) {
                resolved = (selectedNodeProps as Record<string, unknown>)[foundKey];
            }
        }

        if (resolved !== undefined) return convertToCorrectType(resolved);
        return isOptional ? undefined : "";
    };

    const processValue = (val: unknown): unknown => {
        if (Array.isArray(val)) {
            return val
                .map((item) => processValue(item))
                .filter((item) => item !== undefined);
        } else if (val && typeof val === "object") {
            const result: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
                const processed = processValue(v);
                if (processed !== undefined) {
                    result[k] = processed;
                }
            }
            return result;
        } else if (typeof val === "string") {
            return resolvePlaceholder(val);
        }
        return convertToCorrectType(val);
    };

    const updated: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(payload)) {
        if (key === "sessionId") continue;
        const processed = processValue(val);
        if (processed !== undefined) {
            updated[key] = processed;
        }
    }
    return updated;
};

/** Executes an API call using axiosInterceptor and returns the raw response. */
const executeReportApi = (
    apiUrl: string,
    payload: Record<string, unknown>,
    statusBarContext: IStatusBar
): Promise<unknown> =>
    new Promise((resolve) => {
        axiosInterceptor(
            {
                url: apiUrl,
                data: payload,
                allowShowLoader: true,
                setFetchData: (response: unknown, status?: string) => {
                    if (status === "200") {
                        resolve(response);
                    } else {
                        resolve(null);
                    }
                },
            },
            statusBarContext
        ).catch(() => resolve(null));
    });

/** Extracts record array from various API response formats. */
const extractDatasetFromApiResponse = (response: unknown): unknown[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;

    if (typeof response === "string") {
        const parsed = FnParseJsonSafely<unknown, null>(response, { fallback: null });
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") {
            return extractDatasetFromApiResponse(parsed);
        }
        return [];
    }

    if (typeof response === "object") {
        const record = response as Record<string, unknown>;

        for (const key of ["deviceJson", "devicesJson", "alertJson", "propertyJson", "askJson"]) {
            if (typeof record[key] === "string") {
                const innerParsed = FnParseJsonSafely<unknown, null>(record[key] as string, { fallback: null });
                if (innerParsed) {
                    const extracted = extractDatasetFromApiResponse(innerParsed);
                    if (extracted.length) return extracted;
                }
            } else if (record[key] && typeof record[key] === "object") {
                const extracted = extractDatasetFromApiResponse(record[key]);
                if (extracted.length) return extracted;
            }
        }

        if (Array.isArray(record.Dataset)) return record.Dataset;
        if (Array.isArray(record.Data)) return record.Data;
        if (Array.isArray(record.data)) return record.data;
        if (Array.isArray(record.items)) return record.items;
        if (Array.isArray(record.records)) return record.records;

        const handled = FnHandleAPIResponse(response, "Dataset");
        if (Array.isArray(handled) && handled.length) return handled;
        if (handled && typeof handled === "object") {
            const firstArr = Object.values(handled as Record<string, unknown>).find(Array.isArray);
            if (firstArr) return firstArr as unknown[];
        }

        const anyArr = Object.values(record).find(Array.isArray);
        if (anyArr) return anyArr as unknown[];
    }

    return [];
};

/** Resolves the api property on a node, resolves payload, calls the API and attaches tableData. */
const resolveAndCallApiForNode = async (
    node: Record<string, unknown>,
    sessionList: ISessionVariable[] | undefined,
    selectedNodeProps: ISelectedNodeProperty | undefined,
    statusBarContext: IStatusBar
): Promise<Record<string, unknown>> => {
    if (!node || typeof node !== "object") return node;

    const updatedNode = { ...node };

    if (typeof updatedNode.api === "string" && updatedNode.api.trim()) {
        const parsedApi = FnParseJsonSafely<Record<string, unknown>, null>(
            updatedNode.api,
            { fallback: null }
        );

        let apiUrl = "";
        let rawPayload: Record<string, unknown> = {};

        if (parsedApi && typeof parsedApi === "object") {
            apiUrl = String(parsedApi.url ?? parsedApi.name ?? "");
            if (parsedApi.payload && typeof parsedApi.payload === "object") {
                rawPayload = parsedApi.payload as Record<string, unknown>;
            } else if (parsedApi.data && typeof parsedApi.data === "object") {
                rawPayload = parsedApi.data as Record<string, unknown>;
            }
        } else {
            apiUrl = updatedNode.api.trim();
        }

        if (apiUrl) {
            const formattedUrl = apiUrl.startsWith("http") || apiUrl.startsWith("/")
                ? apiUrl
                : `/${apiUrl}`;

            const resolvedPayload = resolvePayloadPlaceholders(
                rawPayload,
                sessionList,
                selectedNodeProps
            );

            if (parsedApi) {
                updatedNode.api = JSON.stringify({
                    ...parsedApi,
                    payload: resolvedPayload,
                });
            }

            const apiResponse = await executeReportApi(
                formattedUrl,
                resolvedPayload,
                statusBarContext
            );

            if (apiResponse) {
                const dataset = extractDatasetFromApiResponse(apiResponse);
                if (dataset.length > 0) {
                    updatedNode.tableData = dataset;
                    updatedNode.embeddedContent = JSON.stringify(dataset);
                    updatedNode.format = "json";
                }
            }
        }
    }

    return updatedNode;
};

/** Recursively traverses template JSON, finds nodes with api, resolves payloads and executes APIs. */
const processTemplateApis = async (
    node: unknown,
    sessionList: ISessionVariable[] | undefined,
    selectedNodeProps: ISelectedNodeProperty | undefined,
    statusBarContext: IStatusBar
): Promise<unknown> => {
    if (!node || typeof node !== "object") {
        return node;
    }

    if (Array.isArray(node)) {
        const processed = [];
        for (const item of node) {
            processed.push(
                await processTemplateApis(
                    item,
                    sessionList,
                    selectedNodeProps,
                    statusBarContext
                )
            );
        }
        return processed;
    }

    let record = { ...(node as Record<string, unknown>) };

    if ("api" in record && record.api) {
        record = await resolveAndCallApiForNode(
            record,
            sessionList,
            selectedNodeProps,
            statusBarContext
        );
    }

    for (const [key, value] of Object.entries(record)) {
        if (value && typeof value === "object") {
            record[key] = await processTemplateApis(
                value,
                sessionList,
                selectedNodeProps,
                statusBarContext
            );
        }
    }

    return record;
};

/** Entry point for printing a dashboard chart using the chart report template. */
const FnCreateReportForPrint = async (
    soruceType:
        | "Chart"
        | "DeviceView"
        | "FloorLayout"
        | "GoogleMap"
        | "NetworkTrace"
        | "PowerTrace"
        | "BsDiagram"
        | "RowOfRacks"
        | "Workorder",
    statusBarContext: IStatusBar,
    chartData?: TChartRecord,
    diplayDeviceView?: "Front" | "Rear",
    titleToReplace?: string
) => {
    if (soruceType === "Chart" && chartData) {
        return await CreateReportForChart(chartData, statusBarContext, titleToReplace);
    } else if (soruceType === "DeviceView" && diplayDeviceView) {
        return await CreateReportForDeviceView(soruceType, diplayDeviceView, statusBarContext);
    } else if (
        soruceType === "FloorLayout" ||
        soruceType === "GoogleMap" ||
        soruceType === "NetworkTrace" ||
        soruceType === "PowerTrace" ||
        soruceType === "BsDiagram" ||
        soruceType === "RowOfRacks" ||
        soruceType === "Workorder"
    ) {
        return await findTemplateWithoutUpdatePayload(soruceType, statusBarContext);
    } else {
        return { report: null, template: null };
    }
};

export {
    CreateReportForChart,
    CreateReportForDeviceView,
    FnCreateReportForPrint,
    FnGetReportBasedOnName,
};

import type { AgentType } from "@n20a/libmcpclient";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnInMemoryUrlForAPI } from "../charts/FnInMemoryUrlForAPI";
import type { IChatResponse } from "../../allinterface/IAIContainer";
import type { ITreeNode } from "../../allinterface/tree/ITreeControl";
import type { IChartProfile } from "../../context/allinterface/IChartProfile";
import type { IInMemoryUrl, IMemoryUrlItem } from "../../context/allinterface/IInMemoryUrl";
import type { ISessionContextProps } from "../../context/allinterface/ISession";
import type { IStatusBar } from "../../context/allinterface/IStatusBar";
import type { TReportLayoutJson } from "../../allinterface/IGeneratePdf";
import { ISelectedNode } from "../../context/allinterface/ISelectedNode";

type TApiConfigEntry = { key: string; value: string };
type TSendPrompt = (
    agentType: AgentType,
    prompt: string,
    apiKey: string,
    context?: string
) => Promise<IChatResponse>;

/* FnInMemoryUrlForAPI. */
type TInMemoryUrlApiConfig = {
    source:
    | "Chart"
    | "DeviceView"
    | "File"
    | "AI"
    | "3DView"
    | "NetworkTrace"
    | "PowerTrace"
    | "GoogleMap"
    | "Icon"
    | "ImageApi"
    | "FloorLayout"
    | "JsonApi"
    | "BsDiagram"
    | "RowOfRacks";
    url?: string;
    payload: {
        name: string;
        apiPayload: any;
        prompt?: string;
        apiKey?: string;
        selectedNode?: ITreeNode | string;
        NodeEntID?: string;
        isSiteByTenant?: boolean;
        diplayDeviceView?: "front" | "rear";
        id: string;
    };
};

interface IFnResolvedMemoryUrlsofReportParams {
    reportJson: TReportLayoutJson;
    apiProfiles: unknown[];
    inMemoryUrlContext: IInMemoryUrl | undefined;
    statusBarContext: IStatusBar;
    chartProfileContext: IChartProfile;
    sessionContext: ISessionContextProps;
    sendPrompt?: TSendPrompt;
    selectedNode?: ITreeNode;
    featureId?: string;
    selectedNodeContext?: ISelectedNode
}

/** Recursively collects API config strings from report layout JSON. */
const extractApiValues = (obj: unknown): TApiConfigEntry[] => {
    const result: TApiConfigEntry[] = [];

    const recurse = (value: unknown): void => {
        if (Array.isArray(value)) {
            value.forEach(recurse);
            return;
        }

        if (typeof value !== "object" || value === null) {
            return;
        }

        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            if (
                key.toLowerCase().includes("api") &&
                typeof val === "string" &&
                val !== ""
            ) {
                const parentObj = value as Record<string, unknown>;
                const parsedVal = FnParseJsonSafely<Record<string, any>, null>(val, { fallback: null });
                const entryKey = (parentObj?.id as string)
                    ?? (parentObj?.name as string)
                    ?? (parsedVal?.payload?.id as string)
                    ?? (parsedVal?.payload?.name as string)
                    ?? key;

                result.push({
                    key: String(entryKey),
                    value: val,
                });
            }
            recurse(val);
        }
    };

    recurse(obj);
    return result;
};

/** Finds in-memory Urls for a layout node by its API id key. */
const getMemoryUrlById = (
    id: string,
    memoryUrlLookup: { key: string; memoryUrl: string }[]
): string | null => {
    if (!id || typeof id !== "string") return null;
    const trimmed = id.trim().toLowerCase();
    const found = memoryUrlLookup.find((item) =>
        String(item.key).trim().toLowerCase() === trimmed
    );
    return found ? found.memoryUrl : null;
};

const isLogoOrCompanyImage = (image: Record<string, unknown>): boolean => {
    if (!image || typeof image !== "object") return false;
    const name = String(image.name ?? "").toLowerCase();
    const url = String(image.url ?? image.src ?? image.image ?? "").toLowerCase();
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

const isChartImageNode = (img: Record<string, unknown>): boolean => {
    if (isLogoOrCompanyImage(img)) return false;
    const name = String(img.name ?? "").toLowerCase();
    if (name === "chart" || name.includes("chart")) return true;
    if (img.api) {
        const apiStr = typeof img.api === "string" ? img.api : JSON.stringify(img.api);
        return apiStr.toLowerCase().includes('"source":"chart"');
    }
    return false;
};

/** Injects resolved in-memory URLs into layout image/table/markdown arrays. */
const injectMemoryUrlsAndReturn = (
    node: Record<string, unknown>,
    memoryUrlLookup: { key: string; memoryUrl: string }[]
): Record<string, unknown> => {
    if (!node || typeof node !== "object") {
        return node;
    }

    const updatedNode = { ...node };

    if (Array.isArray(updatedNode.imageArray)) {
        updatedNode.imageArray = updatedNode.imageArray.map((img) => {
            const image = img as Record<string, unknown>;
            if (isLogoOrCompanyImage(image)) {
                return image;
            }

            const parsedApi = typeof image.api === "string"
                ? FnParseJsonSafely<Record<string, any>, null>(image.api, { fallback: null })
                : (image.api && typeof image.api === "object" ? image.api as Record<string, any> : null);

            let memoryUrl =
                (image?.id ? getMemoryUrlById(String(image.id), memoryUrlLookup) : null) ??
                (image?.name ? getMemoryUrlById(String(image.name), memoryUrlLookup) : null) ??
                (image?.uniqueName ? getMemoryUrlById(String(image.uniqueName), memoryUrlLookup) : null) ??
                (parsedApi?.payload?.id ? getMemoryUrlById(String(parsedApi.payload.id), memoryUrlLookup) : null) ??
                (parsedApi?.payload?.name ? getMemoryUrlById(String(parsedApi.payload.name), memoryUrlLookup) : null);

            // Fallback for chart image: if lookup by id/name didn't find anything, match any non-logo chart memory url
            if (!memoryUrl && (isChartImageNode(image) || String(parsedApi?.source).toLowerCase() === "chart")) {
                const chartEntry = memoryUrlLookup.find((item) =>
                    item.memoryUrl && !item.memoryUrl.includes("favicon") && !item.memoryUrl.includes("NetZoom.png")
                );
                if (chartEntry) {
                    memoryUrl = chartEntry.memoryUrl;
                }
            }

            return memoryUrl
                ? { ...image, inmemoryUrl: memoryUrl, format: "png" }
                : image;
        });
    }

    if (Array.isArray(updatedNode.datatableArray)) {
        updatedNode.datatableArray = updatedNode.datatableArray.map((dt) => {
            const table = dt as Record<string, unknown>;
            const memoryUrl = table?.id
                ? getMemoryUrlById(String(table.id), memoryUrlLookup)
                : null;
            return memoryUrl
                ? { ...table, inmemoryUrl: memoryUrl, format: "png" }
                : table;
        });
    }

    if (Array.isArray(updatedNode.markdownArray)) {
        updatedNode.markdownArray = updatedNode.markdownArray.map((md) => {
            const markdown = md as Record<string, unknown>;
            const memoryUrl = markdown?.id
                ? getMemoryUrlById(String(markdown.id), memoryUrlLookup)
                : null;
            return memoryUrl
                ? { ...markdown, inmemoryUrl: memoryUrl, format: "png" }
                : markdown;
        });
    }

    if (Array.isArray(updatedNode.locationArray)) {
        updatedNode.locationArray = updatedNode.locationArray.map((loc) =>
            injectMemoryUrlsAndReturn(loc as Record<string, unknown>, memoryUrlLookup)
        );
    }

    return updatedNode;
};

/** Resolves each layout API config into in-memory blob URLs via FnInMemoryUrlForAPI. */
const makeApiCallsForMemoryURL = async (
    apis: TApiConfigEntry[],
    params: IFnResolvedMemoryUrlsofReportParams
): Promise<IMemoryUrlItem[]> => {
    let urlsObj: IMemoryUrlItem[] = [];

    for (const element of apis) {
        if (!element?.value) {
            continue;
        }

        const parsed = FnParseJsonSafely<TInMemoryUrlApiConfig, null>(
            element.value,
            { fallback: null }
        );
        if (!parsed?.source || !parsed.payload) {
            continue;
        }

        const data: TInMemoryUrlApiConfig = {
            ...parsed,
            payload: {
                ...parsed.payload,
                id: element.key,
            },
        };

        urlsObj = (await FnInMemoryUrlForAPI(
            data,
            params.inMemoryUrlContext,
            params.statusBarContext,
            params.chartProfileContext,
            params.sessionContext,
            params.apiProfiles,
            false,
            params.sendPrompt,
            params.selectedNode,
            params.featureId,
            params.selectedNodeContext
        )) as IMemoryUrlItem[];
    }

    return urlsObj;
};

/**
 * Takes report layout JSON, resolves every API entry into an in-memory URL
 * via FnInMemoryUrlForAPI (using the provided ApiProfile list), injects those
 * URLs back into the layout, and returns the full updated JSON.
 */
const FnResolvedMemoryUrlsofReport = async (
    params: IFnResolvedMemoryUrlsofReportParams
): Promise<TReportLayoutJson> => {
    const reportJson = params.reportJson;
    if (!reportJson || typeof reportJson !== "object") {
        return reportJson;
    }

    try {
        const apis = extractApiValues(reportJson);
        if (!apis.length) {
            return reportJson;
        }

        const inmemoryUrls = await makeApiCallsForMemoryURL(apis, params);
        return injectMemoryUrlsAndReturn(reportJson, inmemoryUrls);
    } catch (error) {
        console.error("FnResolvedMemoryUrlsofReport error:", error);
        return reportJson;
    }
};

export { FnResolvedMemoryUrlsofReport, extractApiValues, injectMemoryUrlsAndReturn };
export type { IFnResolvedMemoryUrlsofReportParams };

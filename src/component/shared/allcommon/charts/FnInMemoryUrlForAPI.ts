// -------------------------------------------------------------
// 1️ File payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "File",
//     payload: {
//         name: "icons/logo.png",
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);

// -------------------------------------------------------------
// 2 Chart payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "Chart",
//     payload: {
//         name: "chart get_assets_by_manufacturer",
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext, staticProfile);

// -------------------------------------------------------------
// 3 DeviceView payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "DeviceView",
//     payload: {
//         name: "get_svgdata",
//         selectedNode: selectedNode,
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);

// -------------------------------------------------------------
// 4 AI payload
// -------------------------------------------------------------

// await FnInMemoryUrlForAPI({
//     source: "AI",
//     payload: {
// "name": "gemini",
//         "prompt": "List All Generic NetZoom Rackmountable modules for 19 Inch CRT",
//             "apiKey": "AIzaSyBc4QVdcWcEHCiu8vS6RXv0aqzzua9deS0"
// }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);

// -------------------------------------------------------------
// 5 3DView payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "3DView",
//     payload: {
//         name: "get_svgdataNew",
//         selectedNode: selectedNode,
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);


// -------------------------------------------------------------
// 6 PowerTrace payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "PowerTrace",
//     payload: {
//         name: CABLING.GetPowerTraceData,
//         NodeEntID: selectedNode.NodeEntID ?? "",
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);

// -------------------------------------------------------------
// 7 NetworkTrace payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "NetworkTrace",
//     payload: {
//         name: CABLING.GetNetworkTraceData,
//         NodeEntID: "CC3AD424-8479-4867-925A-47F198AB3038",
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);


// -------------------------------------------------------------
// 8 Icon payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "Icon",
//     payload: {
//         name: "Location24x24",
//         apiPayload: null,
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);


// -------------------------------------------------------------
// 9 GoogleMap payload
// -------------------------------------------------------------
//  await FnInMemoryUrlForAPI({
//                 source: "GoogleMap",
//                 payload: {
//                     name: "Test Google map",
//                     apiPayload: "",
//                     selectedNode: selectedNodeForGoogleMap,
//                     isSiteByTenant: false,

//                 }
//             }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);
// -------------------------------------------------------------
// 10 ImageApi payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "ImageApi",
//     payload: {
//         name: "https://dummyimage.com/300x200/000/fff",
//         apiPayload: "",
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);


// -------------------------------------------------------------
// 10 FloorLayout payload
// -------------------------------------------------------------

// await FnInMemoryUrlForAPI({
//     source: "FloorLayout",
//     payload: {
//         name: "",
//         apiPayload: "",
//         selectedNode: floorLayouSelectedNode,
//         featureId: "123"
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);

// -------------------------------------------------------------
// 11 JsonApi payload
// -------------------------------------------------------------
// let url = await FnInMemoryUrlForAPI({
//     source: "JsonApi",
//     payload: {
//         name: NODE.GetKebabMenuData,
//         apiPayload: {
//             "entID": "85B8AE6B-382A-4FCC-8289-36FE2AC263AB",
//             "entityName": "Floor",
//             "kebabMenuTableName": "_Floor",
//         }
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext, [], true);
//
// if (url as string) {
//     const json = await FnInMemoryUrlToJson(url as string) // here is json data that convert into memory url
//
// }

// -------------------------------------------------------------
// 12 BsDiagram payload
// -------------------------------------------------------------
// await FnInMemoryUrlForAPI({
//     source: "BsDiagram",
//     payload: {
//         name: "BsDiagram",
//         selectedNode: #selectedNode#,
// },
//     }
// }, InMemoryUrlContext, statusBarContext, chartProfileContext, sessionContext);


import { axiosInterceptor } from "../../interceptors/Interceptor";
import { FnGetUrlOfPublicFile } from "./FnGetUrlOfPublicFile";
import { ISession, ISessionContextProps } from "../../context/allinterface/ISession";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { IChartProfile } from "../../context/allinterface/IChartProfile";
import { FnGetUrlFromChart } from "./FnGetUrlFromChart";
import { FnGetUrlFromDeviceView } from "./FnGetUrlFromDeviceView";
import { IInMemoryUrl, IMemoryUrlItem } from "../../context/allinterface/IInMemoryUrl";
import { FnCreateSvgMemoryUrlFromMarkdown } from "./FnCreateSvgMemoryUrlFromMarkdown";
import { IChatResponse } from "../../allinterface/IAIContainer";
import { GenerateNetworkTraceFromData } from "../../charts/generatenetworktracefromdata/GenerateNetworkTraceFromData";
import { GeneratePowerTraceFromData } from "../../charts/generatepowertracefromdata/GeneratePowerTraceFromData";
import { GenerateGoogleMapFromData } from "../../charts/generategooglemapfromdata/GenerateGoogleMapFromData";
import { FnGetUrlOfImageBasedOnName } from "./FnGetUrlOfImageBasedOnName";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { GenerateFloorLayoutFromData } from "../../charts/generatefloorlayoutfromdata/GenerateFloorLayoutFromData";
import { GenerateBsDiagramFromData } from "../../charts/generatebsdiagramfromdata/GenerateBsDiagramFromData";
import { GenerateRowOfRacksFromData } from "../../charts/generaterowofracksfromdata/GenerateRowOfRacksFromData";
import { FnJsonToInMemoryUrl } from "./FnJsonToInMemoryUrl";
import { AgentType } from "@n20a/libmcpclient";
import { FnGetSessionVariableFromStorage } from "../basic/FnGetSessionVariableFromStorage";
import { FEnums } from "../../../constants/Feature";
import { FnCreateFailedMemoryUrl } from "./FnCreateFailedMemoryUrl";
import { FnGetEnvVariableByKey } from "../../../appcontainer/allcommon/FnGetEnvVariableByKey";
import { envVarEnums } from "../../../appcontainer/alldefaultprops/DefaultPropsAppContainer";
import { IPayloadObject, PayloadValue } from "../../allinterface/IAppqaSettingsContainer";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { ISelectedNode } from "../../context/allinterface/ISelectedNode";

const getApiUrl = (apiName?: string): string => {
    if (!apiName) {
        return "";
    }

    const trimmedApiName = apiName.trim();

    const baseUrl: string | null = FnGetEnvVariableByKey(
        envVarEnums.N20_API_URL
    );

    if (baseUrl) {
        const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

        // Remove base URL if apiName contains it
        if (trimmedApiName.startsWith(normalizedBaseUrl)) {
            return `/${trimmedApiName
                .substring(normalizedBaseUrl.length)
                .replace(/^\/+/, "")}`;
        }
    }

    // Ensure relative URL always starts with /
    return `/${trimmedApiName.replace(/^\/+/, "")}`;
};

type source = 'Chart' | "DeviceView" | "File" | "AI" | "3DView" | "NetworkTrace" | "PowerTrace" | "GoogleMap" | "Icon" | "ImageApi" | "FloorLayout" | "JsonApi" | "BsDiagram" | "RowOfRacks"
const FnInMemoryUrlForAPI = async (
    api: {
        source: source,
        url?: string,
        payload: {
            name: string,
            apiPayload: any,
            prompt?: string, apiKey?: string,
            selectedNode?: ITreeNode | string,
            NodeEntID?: string,
            isSiteByTenant?: boolean,
            diplayDeviceView?: "front" | "rear" | string,
            id: string;
        }
    },
    InMemoryUrlContext: IInMemoryUrl | undefined,
    statusBarContext: IStatusBar,
    chartProfileContext: IChartProfile,
    sessionContext: ISessionContextProps,
    apiProfiles?: unknown[],
    isReturnCurrentURL?: boolean,
    sendPrompt?: (
        agentType: AgentType,
        prompt: string,
        apiKey: string,
        context?: string
    ) => Promise<IChatResponse>,
    selectedNodeStore?: ITreeNode,
    featureId?: string,
    selectedNodeContext?: ISelectedNode
) => {
    try {

        let apiObject: any = api;
        statusBarContext.setIsLoading(true);
        if (apiObject.payload) {
            apiObject.payload = FnReplacePayloadValueWithSessionOrNodeData(apiObject.source, apiObject.payload, sessionContext, selectedNodeStore, selectedNodeContext)
        }
        const callApiToGetTracApiResponse = async (
            apiName: string,
            deviceID: string,
            statusBarContext: IStatusBar
        ): Promise<any | undefined> => {
            const apiUrl = getApiUrl(apiName);

            return new Promise(async (resolve, reject) => {
                try {
                    await axiosInterceptor(
                        {
                            url: apiUrl,
                            data: { deviceID },
                            setFetchData: (apiResponse: unknown) => {
                                try {
                                    if (apiResponse &&
                                        typeof apiResponse === "object" &&
                                        "traceJson" in apiResponse) {

                                        const jsonStr = (apiResponse as any).traceJson;
                                        const parsed = JSON.parse(jsonStr);

                                        resolve(parsed);
                                    } else {
                                        resolve(undefined);
                                    }
                                } catch (err) {
                                    console.error("Error parsing traceJson:", err);
                                    reject(err);
                                }
                            }
                        },
                        statusBarContext
                    );
                } catch (err) {
                    reject(err);
                }
            });
        };

        // FINAL RETURN VARIABLE
        let finalResult: IMemoryUrlItem[] = InMemoryUrlContext?.InMemoryUrlRecords ?? [];
        let currentUrl: string = "";


        // --------------------------------------------------------------------
        // 1. CHART SOURCE
        // --------------------------------------------------------------------
        try {
            if (apiObject.source === "Chart") {



                const newUrls = await FnGetUrlFromChart({
                    ApiName: apiObject.payload.name,
                    chartProfileContext,
                    statusBarContext,
                    sessionContext,
                    apiProfiles,
                    chartData: apiObject.payload.chartData,
                });

                if (Array.isArray(newUrls) && newUrls.length > 0) {
                    const validUrls = newUrls.filter((url): url is string => Boolean(url));
                    if (validUrls.length > 0) {
                        currentUrl = validUrls[0];
                        validUrls.forEach((url) => {
                            finalResult.push({
                                key: `${apiObject.payload.id ?? apiObject.payload.name}`,
                                memoryUrl: url
                            });
                            if (apiObject.payload.name && apiObject.payload.id !== apiObject.payload.name) {
                                finalResult.push({
                                    key: `${apiObject.payload.name}`,
                                    memoryUrl: url
                                });
                            }
                        });
                    } else {
                        currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                        finalResult.push({
                            key: apiObject.payload.id ?? apiObject.payload.name,
                            memoryUrl: currentUrl
                        });
                        if (apiObject.payload.name && apiObject.payload.id !== apiObject.payload.name) {
                            finalResult.push({
                                key: `${apiObject.payload.name}`,
                                memoryUrl: currentUrl
                            });
                        }
                    }
                } else if (typeof newUrls === "string" && newUrls) {
                    currentUrl = newUrls;
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                    if (apiObject.payload.name && apiObject.payload.id !== apiObject.payload.name) {
                        finalResult.push({
                            key: `${apiObject.payload.name}`,
                            memoryUrl: currentUrl
                        });
                    }
                } else {
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                    if (apiObject.payload.name && apiObject.payload.id !== apiObject.payload.name) {
                        finalResult.push({
                            key: `${apiObject.payload.name}`,
                            memoryUrl: currentUrl
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Chart processing error:", err);
            throw err;

        }

        // --------------------------------------------------------------------
        // 2. DEVICE VIEW SOURCE
        // --------------------------------------------------------------------
        try {
            if (apiObject.source === "DeviceView") {
                const newUrls = await FnGetUrlFromDeviceView({
                    selectedNode: apiObject.payload.selectedNode,
                    isThreeDView: false,
                    isMultiple: false,
                    ApiName: apiObject.payload.name,
                    diplayDeviceView: apiObject.payload.diplayDeviceView,
                    statusBarContext,

                });

                if (Array.isArray(newUrls) && newUrls.length > 0) {
                    const validUrls = newUrls.filter((url): url is string => Boolean(url));
                    if (validUrls.length > 0) {
                        currentUrl = validUrls[0];
                        validUrls.forEach((url) => {
                            finalResult.push({
                                key: `${apiObject.payload.id ?? apiObject.payload.name}`,
                                memoryUrl: url
                            });
                        });
                    } else {
                        currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                        finalResult.push({
                            key: apiObject.payload.id ?? apiObject.payload.name,
                            memoryUrl: currentUrl
                        });
                    }
                } else if (typeof newUrls === "string" && newUrls) {
                    currentUrl = newUrls;
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("DeviceView processing error:", err);
            throw err;
        }

        // --------------------------------------------------------------------
        // 3. FILE SOURCE
        // --------------------------------------------------------------------
        try {
            if (apiObject.source === "File") {
                const newUrl = await FnGetUrlOfPublicFile(apiObject.payload.name);
                currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                finalResult.push({
                    key: apiObject.payload.id ?? apiObject.payload.name,
                    memoryUrl: currentUrl
                });
            }
        } catch (err) {
            console.error("File handling error:", err);
            throw err;
        }

        // --------------------------------------------------------------------
        // 4. AI SOURCE
        // --------------------------------------------------------------------
        try {
            if (apiObject.source === "AI" && apiObject.payload.prompt && apiObject.payload.apiKey) {
                const newUrl = await FnCreateSvgMemoryUrlFromMarkdown(
                    apiObject.payload.prompt,
                    apiObject.payload.apiKey,
                    apiObject.payload.name as AgentType ?? "gemini",
                    sendPrompt
                );
                currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                finalResult.push({
                    key: apiObject.payload.id ?? apiObject.payload.name,
                    memoryUrl: currentUrl
                });
            }
        } catch (err) {
            console.error("AI processing error:", err);
            throw err;
        }

        // -------------------------------------------------------------
        // 5. 3DView Source
        // -------------------------------------------------------------

        try {
            if (apiObject.source === "3DView") {
                const newUrls = await FnGetUrlFromDeviceView({
                    selectedNode: apiObject.payload.selectedNode,
                    isThreeDView: true,
                    isMultiple: false,
                    ApiName: apiObject.payload.name,
                    diplayDeviceView: apiObject.payload.diplayDeviceView,
                    statusBarContext
                });


                if (Array.isArray(newUrls) && newUrls.length > 0) {
                    const validUrls = newUrls.filter((url): url is string => Boolean(url));
                    if (validUrls.length > 0) {
                        currentUrl = validUrls[0];
                        validUrls.forEach((url) => {
                            finalResult.push({
                                key: `${apiObject.payload.id ?? apiObject.payload.name}`,
                                memoryUrl: url
                            });
                        });
                    } else {
                        currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                        finalResult.push({
                            key: apiObject.payload.id ?? apiObject.payload.name,
                            memoryUrl: currentUrl
                        });
                    }
                } else if (typeof newUrls === "string" && newUrls) {
                    currentUrl = newUrls;
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("3D DeviceView processing error:", err);
            throw err;
        }
        // -------------------------------------------------------------
        // 6. Network trace Source
        // -------------------------------------------------------------

        try {
            if (apiObject.source === "NetworkTrace") {
                const nodeEntID =
                    apiObject.payload.NodeEntID ||
                    (typeof selectedNodeStore?.NodeEntID === "string"
                        ? selectedNodeStore.NodeEntID
                        : undefined);

                if (nodeEntID) {
                    const apiData = await callApiToGetTracApiResponse(
                        apiObject.payload.name ?? "/cabling/get_network_trace_data",
                        nodeEntID,
                        statusBarContext
                    );
                    const newUrl: string = await GenerateNetworkTraceFromData({
                        uniqueName: apiObject.payload.name ?? "/cabling/get_network_trace_data",
                        ApiData: apiData,
                        featureId: featureId ?? apiObject.payload.featureId ?? "",
                        hideHelpTip: true,
                    });
                    currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    console.error("NetworkTrace processing error:", "NodeEntID not found");
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("NetworkTrace processing error:", err);
            throw err;
        }

        // -------------------------------------------------------------
        // 7. Power trace Source
        // -------------------------------------------------------------

        try {
            if (apiObject.source === "PowerTrace") {
                const nodeEntID =
                    apiObject.payload.NodeEntID ||
                    (typeof selectedNodeStore?.NodeEntID === "string"
                        ? selectedNodeStore.NodeEntID
                        : undefined);

                if (nodeEntID) {
                    const apiData = await callApiToGetTracApiResponse(
                        apiObject.payload.name ?? "/cabling/get_power_trace_data",
                        nodeEntID,
                        statusBarContext
                    );
                    const newUrl: string = await GeneratePowerTraceFromData({
                        uniqueName: apiObject.payload.name ?? "/cabling/get_power_trace_data",
                        ApiData: apiData,
                        featureId: featureId ?? apiObject.payload.featureId ?? "",
                        hideHelpTip: true,
                    });
                    currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    console.error("PowerTrace processing error:", "NodeEntID not found");
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("PowerTrace processing error:", err);
            throw err;
        }
        // -------------------------------------------------------------
        // 8. googleMap Source
        // -------------------------------------------------------------
        try {
            if (apiObject.source === "GoogleMap") {
                if (apiObject.payload.selectedNode) {
                    const newUrl: string = await GenerateGoogleMapFromData({
                        selectedNodeInfo: apiObject.payload.selectedNode,
                        isSiteByTenant: apiObject.payload.isSiteByTenant ?? false,
                        statusBarContext: statusBarContext
                    })
                    currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("GoogleMap processing error:", err);
            throw err;
        }
        // --------------------------------------------------------------------
        // 9. ICON SOURCE
        // --------------------------------------------------------------------
        try {
            if (apiObject.source === "Icon") {
                const newUrl = await FnGetUrlOfImageBasedOnName(apiObject.payload.name);
                currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                finalResult.push({
                    key: apiObject.payload.id ?? apiObject.payload.name,
                    memoryUrl: currentUrl
                });
            }
        } catch (err) {
            console.error("File handling error:", err);
            throw err;
        }

        // --------------------------------------------------------------------
        // 10. ImageApi SOURCE
        // --------------------------------------------------------------------
        try {
            if (apiObject.source === "ImageApi") {

                // Promise-wrapped version (await now works correctly)
                const fetchImageAsBlobUrl = (imageUrl: string): Promise<string> => {
                    return new Promise(async (resolve, reject) => {
                        try {
                            const response = await fetch(imageUrl);

                            if (!response.ok) {
                                reject(new Error("Failed to fetch image"));
                                return;
                            }

                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob); // in-memory URL
                            resolve(url);
                        } catch (err) {
                            reject(err);
                        }
                    });
                };

                // REAL await (waits until blob URL created)

                const newUrl = await fetchImageAsBlobUrl(apiObject.url ? apiObject.url : apiObject.payload.name);
                currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                finalResult.push({
                    key: apiObject.payload.id ?? apiObject.payload.name,
                    memoryUrl: currentUrl
                });
            }

        } catch (err) {
            console.error("ImageApi handling error:", err);
            throw err;
        }

        // -------------------------------------------------------------
        // 11. FloorLayout Source
        // -------------------------------------------------------------
        try {
            if (apiObject.source === "FloorLayout") {
                if (apiObject.payload.selectedNode) {
                    const newUrl: string = await GenerateFloorLayoutFromData({
                        mode: "canvas",
                        featureId: FEnums.Assets,
                        selectedFloorNode: apiObject.payload.selectedNode,
                        allowEdit: false,
                        uniqueName: "floor-layour-container-edit-floor-layout",
                        statusBarContext: statusBarContext
                    })

                    currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    console.error("FloorLayout processing error:", "selectedNode not found");
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("FloorLayout processing error:", err);
            throw err;
        }

        // -------------------------------------------------------------
        // 11. FloorLayout Source
        // -------------------------------------------------------------
        try {
            if (apiObject.source === "JsonApi") {
                if (apiObject.payload.name || apiObject.url) {
                    function makeApiCall(url: string, apiPayload: any, statusBarContext: any) {
                        return new Promise((resolve, reject) => {
                            try {
                                axiosInterceptor(
                                    {
                                        url,
                                        data: apiPayload,
                                        setFetchData: async (apiResponse: unknown, status?: string) => {
                                            try {

                                                if (status === "200") {

                                                    // STEP 1: Check if apiResponse is a string
                                                    if (typeof apiResponse === "string") {
                                                        return resolve(JSON.parse(apiResponse));
                                                    }

                                                    // STEP 2: Check if it's an object
                                                    if (typeof apiResponse === "object" && apiResponse !== null) {
                                                        const firstValue = Object.values(apiResponse)[0];

                                                        if (typeof firstValue === "string") {
                                                            return resolve(JSON.parse(firstValue));
                                                        }

                                                        return resolve(firstValue);
                                                    }

                                                    // STEP 3: Any other type is invalid
                                                    reject(new Error("Invalid API response type"));
                                                } else {
                                                    reject(new Error("API failed with status: " + status));
                                                }
                                            } catch (err) {
                                                reject(err);
                                                throw err;
                                            }
                                        }
                                    },
                                    statusBarContext
                                );
                            } catch (outerError) {
                                reject(outerError);
                                throw outerError
                            }
                        });
                    }
                    const apiUrl = getApiUrl(apiObject.url ? apiObject.url : apiObject.payload.name)

                    const response = await makeApiCall(apiUrl, apiObject.payload, statusBarContext);
                    let url = FnJsonToInMemoryUrl(response)

                    currentUrl = url || FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    throw `MakeApiCallsForMemoryURL failed:API name not found`
                }
            }
        } catch (err) {
            console.error("JsonApi processing error:", err);
            throw err;
        }


        // -------------------------------------------------------------
        // 12. BsDiagram Source
        // -------------------------------------------------------------

        try {
            if (apiObject.source === "BsDiagram") {
                const selectedNode =
                    apiObject.payload.selectedNode ??
                    (selectedNodeStore
                        ? {
                            ...selectedNodeStore,
                            EntID: selectedNodeStore.EntID ?? selectedNodeStore.NodeEntID,
                        }
                        : undefined);

                if (selectedNode) {
                    const newUrl = await GenerateBsDiagramFromData({
                        uniqueName: apiObject.payload.name,
                        selectedNode,
                    });
                    currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    console.error("BsDiagram processing error:", "selectedNode not found");
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("BsDiagram processing error:", err);
            throw err
        }
        // -------------------------------------------------------------
        // 12. RowOfRacks Source
        // -------------------------------------------------------------

        try {
            if (apiObject.source === "RowOfRacks") {
                const selectedNode = apiObject.payload.selectedNode ?? selectedNodeStore;
                if (selectedNode) {
                    const newUrl = await GenerateRowOfRacksFromData({
                        uniqueName: apiObject.payload.name,
                        featureId: featureId ?? apiObject.payload.featureId ?? "",
                        selectedNode,
                    });
                    currentUrl = newUrl || FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                } else {
                    console.error("RowOfRacks processing error:", "selectedNode not found");
                    currentUrl = FnCreateFailedMemoryUrl(apiObject.source);
                    finalResult.push({
                        key: apiObject.payload.id ?? apiObject.payload.name,
                        memoryUrl: currentUrl
                    });
                }
            }
        } catch (err) {
            console.error("RowOfRacks processing error:", err);
            throw err
        }
        // --------------------------------------------------------------------
        // UPDATE CONTEXT SAFELY
        // --------------------------------------------------------------------
        InMemoryUrlContext?.setInMemoryUrlRecords([...finalResult]);
        statusBarContext.setIsLoading(false);
        return isReturnCurrentURL ? currentUrl : finalResult;
    } catch (err) {
        statusBarContext.setIsLoading(false);
        console.error("FnInMemoryUrlForAPI fatal error:", err);
        throw err;
    } finally {
        statusBarContext.setIsLoading(false);
    }
};

const updatePayloadFromSessionAndNodeProperty = (
    payload: IPayloadObject,
    sessionList: ISession[],
    selectedNodeContext?: ISelectedNode
): IPayloadObject => {

    const updatedPayload: IPayloadObject = {};

    try {

        const convertToCorrectType = (value: PayloadValue): PayloadValue => {

            if (typeof value !== "string") {
                return value;
            }

            const trimmed = value.trim().toLowerCase();

            if (trimmed === "true") {
                return true;
            }

            if (trimmed === "false") {
                return false;
            }

            if (trimmed === "") {
                return "";
            }

            // Handle numeric string
            if (!Number.isNaN(Number(trimmed)) && trimmed !== "") {
                return Number(trimmed);
            }

            return value;
        };

        const resolvePlaceholder = (val: string): PayloadValue => {

            try {

                const isPlaceholder = /^<[^<>?]+(\?)?>$/.test(val);

                if (!isPlaceholder) {
                    return convertToCorrectType(val);
                }

                const isOptional = val.includes("?>");

                const key = val.replace(/^<|[\?>]*>$/g, "");

                const sessionItem = sessionList?.find(
                    (item) => item.VariableName === key
                );

                const sessionValue = sessionItem?.SessionValue;

                const nodeValue =
                    selectedNodeContext?.selectedNodeProperty?.[
                    key as keyof typeof selectedNodeContext.selectedNodeProperty
                    ];

                const nodePropertyValue =
                    selectedNodeContext?.selectedNodeAllProperties?.[
                    key as keyof typeof selectedNodeContext.selectedNodeAllProperties
                    ];

                const resolved =
                    sessionValue ??
                    nodeValue ??
                    nodePropertyValue;

                if (resolved !== undefined) {
                    return convertToCorrectType(resolved as PayloadValue);
                }

                return isOptional ? undefined : "";

            } catch (error) {

                console.error(
                    "Error resolving placeholder:",
                    val,
                    error
                );

                return undefined;
            }
        };

        const processValue = (
            value: PayloadValue
        ): PayloadValue => {

            try {

                if (Array.isArray(value)) {

                    return value
                        .map((item) => processValue(item))
                        .filter(
                            (item): item is Exclude<PayloadValue, undefined> =>
                                item !== undefined
                        );
                }

                if (
                    value !== null &&
                    typeof value === "object"
                ) {

                    const result: IPayloadObject = {};

                    Object.keys(value).forEach((key) => {

                        const processed = processValue(
                            value[key]
                        );

                        if (processed !== undefined) {
                            result[key] = processed;
                        }
                    });

                    return result;
                }

                if (typeof value === "string") {
                    return resolvePlaceholder(value);
                }

                return convertToCorrectType(value);

            } catch (error) {

                console.error(
                    "Error processing payload value:",
                    value,
                    error
                );

                return undefined;
            }
        };

        Object.keys(payload).forEach((key) => {

            try {

                const normalizedKey = key.endsWith("?")
                    ? key.slice(0, -1)
                    : key;

                if (normalizedKey === "sessionId") {
                    return;
                }

                const processed = processValue(payload[key]);

                if (processed !== undefined) {
                    updatedPayload[normalizedKey] = processed;
                }

            } catch (error) {

                console.error(
                    `Error processing key: ${key}`,
                    error
                );
            }
        });

    } catch (error) {

        console.error(
            "Error in updatePayloadFromSessionAndNodeProperty:",
            error
        );
    }

    return updatedPayload;
};

const FnReplacePayloadValueWithSessionOrNodeData = (source: string, payload: Record<string, any>, sessionContext: ISessionContextProps, selectedNodeStore?: ITreeNode, selectedNodeContext?: ISelectedNode): any => {
    let apiPayload = payload
    if (source === "JsonApi") {
        const resolvePayload = updatePayloadFromSessionAndNodeProperty(payload, sessionContext.SessionList, selectedNodeContext)
        apiPayload = resolvePayload;
    }
    else if (selectedNodeStore && source == "GoogleMap") {
        if (apiPayload.selectedNode) {
            apiPayload.selectedNode = selectedNodeStore
        } else if (apiPayload.NodeEntID) {
            apiPayload.NodeEntID = selectedNodeStore.NodeEntID
        }
    } else {
        if (apiPayload.NodeEntID || apiPayload.entID || apiPayload.EntID) {
            const nodeIDData = FnGetSessionVariableFromStorage('Node', "SelectedNodeID", sessionContext.SessionList)
            if (nodeIDData) {
                if (apiPayload.NodeEntID) {
                    apiPayload.NodeEntID = nodeIDData[0].SessionValue ? nodeIDData[0].SessionValue : selectedNodeStore?.NodeEntID
                } else if (apiPayload.entID) {
                    apiPayload.entID = nodeIDData[0].SessionValue ? nodeIDData[0].SessionValue : selectedNodeStore?.NodeEntID
                } else if (apiPayload.EntID) {
                    apiPayload.EntID = nodeIDData[0].SessionValue ? nodeIDData[0].SessionValue : selectedNodeStore?.NodeEntID
                }
            }
        }
        if (selectedNodeStore) {
            if (apiPayload.selectedNode) {
                apiPayload.selectedNode = selectedNodeStore
            } else if (apiPayload.NodeEntID) {
                apiPayload.NodeEntID = selectedNodeStore.NodeEntID
            }
        } else {
            if (apiPayload.selectedNode && apiPayload.selectedNode.toLowerCase().includes('selectednode')) {
                const nodeIDData = FnGetSessionVariableFromStorage('Node', "SelectedNodeID", sessionContext.SessionList)
                const nodeEntityData = FnGetSessionVariableFromStorage('Node', "SelectedNodeEntity", sessionContext.SessionList)
                const nodeNameData = FnGetSessionVariableFromStorage('Node', "SelectedNodeName", sessionContext.SessionList)
                if (nodeIDData && nodeEntityData && nodeNameData) {
                    if (apiPayload.selectedNode) {
                        apiPayload.selectedNode = {
                            "NodeEntID": nodeIDData[0].SessionValue,
                            "NodeEntityname": nodeEntityData[0].SessionValue,
                            "Name": nodeNameData[0].SessionValue
                        }
                    } else if (apiPayload.NodeEntID) {
                        apiPayload.NodeEntID = nodeIDData[0].SessionValue
                    }
                }
            }
            else if (apiPayload.selectedNode && apiPayload.selectedNode.toLowerCase().includes('floornode')) {
                const nodeIDData = FnGetSessionVariableFromStorage('Location', "FloorID", sessionContext.SessionList)
                const nodeEntityData = "floor"
                const nodeNameData = FnGetSessionVariableFromStorage('Location', "FloorName", sessionContext.SessionList)
                if (nodeIDData && nodeEntityData && nodeNameData) {
                    if (apiPayload.selectedNode) {
                        apiPayload.selectedNode = {
                            "NodeEntID": nodeIDData[0].SessionValue,
                            "NodeEntityname": nodeEntityData,
                            "Name": nodeNameData[0].SessionValue
                        }
                    } else if (apiPayload.NodeEntID) {
                        apiPayload.NodeEntID = nodeIDData[0].SessionValue
                    }
                }
            } else if (apiPayload.selectedNode && apiPayload.selectedNode.toLowerCase().includes('devicenode')) {
                const nodeIDData = FnGetSessionVariableFromStorage('Node', "SelectedNodeID", sessionContext.SessionList)
                const nodeEntityData = FnGetSessionVariableFromStorage('Node', "SelectedNodeEntity", sessionContext.SessionList)
                const nodeNameData = FnGetSessionVariableFromStorage('Node', "SelectedNodeName", sessionContext.SessionList)
                if (nodeIDData && nodeEntityData && nodeNameData) {
                    if (apiPayload.selectedNode) {
                        apiPayload.selectedNode = {
                            "NodeEntID": nodeIDData[0].SessionValue,
                            "NodeEntityname": nodeEntityData,
                            "Name": nodeNameData[0].SessionValue
                        }
                    } else if (apiPayload.NodeEntID) {
                        apiPayload.NodeEntID = nodeIDData[0].SessionValue
                    }
                }
            }
        }

    }

    return apiPayload
}

export { FnInMemoryUrlForAPI, FnReplacePayloadValueWithSessionOrNodeData }
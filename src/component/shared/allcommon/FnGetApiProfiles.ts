import { EntityNameEnums } from "../alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { IMainApp } from "../context/allinterface/IMainApp";
import { IStatusBar } from "../context/allinterface/IStatusBar";
import { EM } from "../interceptors/EndPoints";
import { axiosInterceptor, axiosInterceptorWithoutUI } from "../interceptors/Interceptor";
import { FnHandleAPIResponse } from "./basic/FnHandleAPIResponse";

export interface IFnGetApiProfilesOptions {
    mainAppContext?: IMainApp | null;
    statusBarContext?: IStatusBar | null;
    allowShowLoader?: boolean;
    onSuccess?: (profiles: Record<string, any>[]) => void;
}

/**
 * Fetches ApiProfile entity records or retrieves them from mainAppContext cache.
 * Can be called with an options object or positional parameters.
 *
 * @param optionsOrMainAppContext - IFnGetApiProfilesOptions object or IMainApp instance
 * @param statusBarContextParam - Optional statusBarContext if positional arguments are used
 * @param allowShowLoaderParam - Whether to show loader during the API call (default true)
 * @returns Array of ApiProfile records
 */
const FnGetApiProfiles = async (
    optionsOrMainAppContext?: IFnGetApiProfilesOptions | IMainApp | null,
    statusBarContextParam?: IStatusBar | null,
    allowShowLoaderParam: boolean = true
): Promise<Record<string, any>[]> => {
    let mainAppContext: IMainApp | null | undefined;
    let statusBarContext: IStatusBar | null | undefined;
    let allowShowLoader = true;
    let onSuccess: ((profiles: Record<string, any>[]) => void) | undefined;

    if (
        optionsOrMainAppContext &&
        typeof optionsOrMainAppContext === "object" &&
        ("mainAppContext" in optionsOrMainAppContext ||
            "statusBarContext" in optionsOrMainAppContext ||
            "allowShowLoader" in optionsOrMainAppContext ||
            "onSuccess" in optionsOrMainAppContext)
    ) {
        const opts = optionsOrMainAppContext as IFnGetApiProfilesOptions;
        mainAppContext = opts.mainAppContext;
        statusBarContext = opts.statusBarContext;
        allowShowLoader = opts.allowShowLoader ?? true;
        onSuccess = opts.onSuccess;
    } else {
        mainAppContext = optionsOrMainAppContext as IMainApp | null | undefined;
        statusBarContext = statusBarContextParam;
        allowShowLoader = allowShowLoaderParam;
    }

    if (
        mainAppContext?.apiProfileRecords &&
        Array.isArray(mainAppContext.apiProfileRecords) &&
        mainAppContext.apiProfileRecords.length > 0
    ) {
        onSuccess?.(mainAppContext.apiProfileRecords);
        return mainAppContext.apiProfileRecords;
    }

    return new Promise((resolve) => {
        const handleGetEntityRecordsApiResponse = (
            getEntityRecordsApiResponse: unknown,
            status?: string
        ) => {
            try {
                if (
                    status === "200" &&
                    typeof getEntityRecordsApiResponse !== "string"
                ) {
                    statusBarContext?.setUserActionData?.(
                        "Invalid API profile response format."
                    );
                    resolve([]);
                    return;
                }

                const parsedEntity = FnHandleAPIResponse(
                    getEntityRecordsApiResponse,
                    "Dataset"
                );

                const profiles =
                    parsedEntity?.[`_${EntityNameEnums.ApiProfile}`];

                if (!Array.isArray(profiles) || profiles.length === 0) {
                    statusBarContext?.setUserActionData?.(
                        "No API profiles found."
                    );
                    resolve([]);
                    return;
                }

                mainAppContext?.setApiProfileRecords?.(profiles);
                onSuccess?.(profiles);
                resolve(profiles);
            } catch (error) {
                console.error("Entity record response error:", error);
                statusBarContext?.setFetchError?.([
                    "Failed to process entity records.",
                ]);
                resolve([]);
            }
        };

        const fetchPayload = {
            entityName: "ApiProfile",
            entIDs: "",
            tableName: "_ApiProfile",
            filterJsonString: null,
            andor: "OR",
            startRec: 0,
            endRec: 0,
        };

        if (statusBarContext) {
            axiosInterceptor(
                {
                    url: EM.GetEntityRecords,
                    data: fetchPayload,
                    allowShowLoader,
                    setFetchData: handleGetEntityRecordsApiResponse,
                },
                statusBarContext
            ).catch((error) => {
                console.error("Entity record response error:", error);
                statusBarContext.setFetchError?.([
                    "Failed to process entity records.",
                ]);
                resolve([]);
            });
        } else {
            axiosInterceptorWithoutUI({
                FetchProps: {
                    url: EM.GetEntityRecords,
                    data: fetchPayload,
                    allowShowLoader: false,
                    setFetchData: handleGetEntityRecordsApiResponse,
                },
                setFetchDataError: () => {},
                setFetchError: () => {},
            }).catch((error) => {
                console.error("Entity record response error:", error);
                resolve([]);
            });
        }
    });
};

export { FnGetApiProfiles };

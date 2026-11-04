
import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, useSearchParams } from 'react-router-dom';

import { ThemeProvider } from 'styled-components';
import { DefaultTheme } from 'styled-components';

// Constants for session data keys
const SESSION_DATA_KEYS = {
    AP_JSON: 'APJson',
    FEATURES_JSON: 'FeaturesJson',
    EM_PG_JSON: 'EmPgJson',
    ALL_SITES_HIERARCHY_JSON: 'AllSitesHierarchyJson',
    AP_PROFILE_JSON: 'approfilejson',
    ALERT_PROFILE_JSON: 'alertprofilejson',
    ALERT_JSON: 'alertjson',
    NZ_PG_REF_JSON: 'nzpgrefjson',
    FLOOR_DEVICES_JSON: 'floordevicesjson',
    LOGIN_USER_JSON: 'LoginUserJson',
    IMP_USER_JSON: 'ImpersonatedUserJson'
} as const;

const SESSION_VARIABLE_NAMES = {
    SITE_ID: 'siteid',
    LOGIN_USER_NAME: 'LoginUserName',
    IMPERSONATED_USER_NAME: 'ImpersonatedUserName',
    LOGIN_USER_EMAIL: `LoginUserEmail`,
    LOGIN_USER_ID: `LoginUserID`,
    IMPERSONATED_USER_ID: 'ImpersonatedUserID'
} as const;

//  AG Grid
import { ModuleRegistry as GridModuleRegistry, AllCommunityModule as GridAllCommunityModule } from 'ag-grid-community';
//  AG Charts
import { ModuleRegistry as ChartsModuleRegistry, AllCommunityModule as ChartsAllCommunityModule } from 'ag-charts-community';

import './allcss/NzApp.css'
import themes from './theme/theme-provider.json'
import { useSessionContext } from './shared/context/hooks/SessionHooks';
import { useCommonVariableContext } from './shared/context/hooks/CommonVariableHooks';
import { useStatusBarContext } from './shared/context/hooks/StatusBarHooks';
import { useMainAppContext } from './shared/context/hooks/MainAppHooks';
import { useChartProfileContext } from './shared/context/hooks/ChartProfileHooks';
import { useExplorerTreeContext } from './shared/context/hooks/ExplorerTreeHooks';
import { AppContextWrapper } from './shared/context/AppContextWrapper';
import { axiosInterceptor, axiosInterceptorForPostResponse, axiosInterceptorWithoutUI } from './shared/interceptors/Interceptor';
import { NodeHeight, SubMenuHeight } from '../component/appcontainer/alldefaultprops/DefaultPropsAppContainer';
import { AUTH, EM, NODE, SESSION } from './shared/interceptors/EndPoints';
import { GlobalStyles } from './theme/GlobalStyles';
import { SettingSubgroups, SettingGroups } from './constants/Feature';
import { EntityNameEnums, SettingApNames } from './shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { FnHandleAPIResponse } from './shared/allcommon/basic/FnHandleAPIResponse';
import { FnSignOut } from './shared/allcommon/basic/FnSignOut';
import { FnGetApplicationParameter } from './shared/allcommon/basic/FnGetApplicationParameter';
import { INzApp } from './allinterface/INzApp';
import { IAllSitesHierarchy, IApItem, IFeatureItem, IUserAuthSession, IUserData } from './shared/context/allinterface/IMainApp';
import { IDeploymentEnv, IDeploymentEnvResponse } from './shared/allinterface/IApiResponse';
import { ISession } from './shared/context/allinterface/ISession';
import { AppContainer } from '../component/appcontainer/AppContainer'
import { WhatsNewContainer } from './appcontainer/whatsnewcontainer/WhatsNewContainer'
import {
    FnGetWhatsNewApRecord,
    FnShouldShowWhatsNew,
    FnCheckWhatsNewPdfAvailable,
    FnUpdateWhatsNewStartDate,
    FnUpdateWhatsNewEndDate
} from './appcontainer/allcommon/FnCheckWhatsNew'
import { FnSetSessionStorageItem } from './appcontainer/allcommon/FnSetSessionStorageItem';
import { FnParseJsonSafely } from './appcontainer/allcommon/FnParseJsonSafely';
import { IFetchInterceptorErrorData } from './shared/interceptors/FetchInterceptorCore';

//  Register modules ONCE (always keep these registration/code calls after import)
GridModuleRegistry.registerModules([GridAllCommunityModule]);
ChartsModuleRegistry.registerModules([ChartsAllCommunityModule]);

const getAuthSessionRawRecord = (raw: unknown): Record<string, unknown> | null => {
    if (!raw) {
        return null;
    }

    const parsedRaw = typeof raw === "string"
        ? FnParseJsonSafely<unknown>(raw)
        : raw;

    if (
        parsedRaw &&
        typeof parsedRaw === "object" &&
        !Array.isArray(parsedRaw)
    ) {
        return parsedRaw as Record<string, unknown>;
    }

    return null;
};

function pickAuthSessionValue<T>(
    rawRecord: Record<string, unknown> | null,
    key: string,
    fallback: T
): T {
    if (!rawRecord || !(key in rawRecord)) {
        return fallback;
    }

    const rawValue = rawRecord[key];
    if (rawValue === undefined || rawValue === "") {
        return fallback;
    }

    return rawValue as T;
}

const mapAuthSessionToUserAuthSession = (authSession: IUserData): IUserAuthSession => {
    const rawRecord = getAuthSessionRawRecord(authSession.raw);
    const sessionRecord = authSession as IUserData & Record<string, unknown>;
    const sessionPhoneNumber = typeof sessionRecord.phoneNumber === "string" || sessionRecord.phoneNumber === null
        ? sessionRecord.phoneNumber
        : null;

    return {
        id: pickAuthSessionValue(rawRecord, "id", authSession.id),
        username: pickAuthSessionValue(rawRecord, "username", authSession.username),
        displayName: pickAuthSessionValue(rawRecord, "displayName", authSession.displayName),
        email: pickAuthSessionValue(rawRecord, "email", authSession.email),
        phoneNumber: pickAuthSessionValue(rawRecord, "phoneNumber", sessionPhoneNumber) ?? undefined,
        authType: pickAuthSessionValue(rawRecord, "authType", String(authSession.authType)),
        tenantNickname: pickAuthSessionValue(rawRecord, "tenantNickname", authSession.tenantNickname) ?? undefined,
        bid: pickAuthSessionValue(rawRecord, "bid", authSession.bid),
        cid: pickAuthSessionValue(rawRecord, "cid", authSession.cid),
    };
};

function NzLoadContextAndVariables({ uniqueName, sessionId, userAuthSession, sessionVariables, apiBaseUrl, isNewSession, onError, onSuccess }: INzApp) {
    // Initialize with default theme instead of null to avoid extra render
    const [searchParams] = useSearchParams();
    const siteToSearchId = searchParams.get("siteid");
    const siteNameToSearch = searchParams.get("sitename");

    const [selectedTheme, setSelectedTheme] = useState<DefaultTheme>(themes.data.light);
    const [isSessionCreated, setIsSessionCreated] = useState(false);
    const [isDeploymentVarsLoaded, setIsDeploymentVarsLoaded] = useState(false);
    const [isEvaluatingWhatsNew, setIsEvaluatingWhatsNew] = useState<boolean>(true);
    const [isWhatsNewOpen, setIsWhatsNewOpen] = useState<boolean>(false);
    const [whatsNewPdfUrl, setWhatsNewPdfUrl] = useState<string>('');
    const hasEvaluatedWhatsNewRef = useRef<boolean>(false);

    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();
    const CommonVariableContext = useCommonVariableContext();
    const statusBarContext = useStatusBarContext();
    const chartProfileContext = useChartProfileContext();
    const explorerTreeContext = useExplorerTreeContext();

    // Use constants instead of arbitrary strings for session variable names
    const siteId = (
        sessionContext?.SessionList?.length
            ? sessionContext.SessionList
            : sessionVariables
    )?.find(
        (item: Record<string, any>) => item.VariableName?.toLowerCase() === SESSION_VARIABLE_NAMES.SITE_ID
    )?.SessionValue;

    const prevSiteIdRef = useRef<string | null>(null);


    const reportFatalError = useCallback(
        (message: string, err?: unknown) => {
            console.error("NzApp fatal error:", message, err);
            void FnSignOut({
                sessionId,
                apiBaseUrl,
                closeSession: true,
                clearStorage: true,
                broadcast: true
            });
            onError?.(message);
        },
        [onError, sessionId, apiBaseUrl]
    );

    useEffect(() => {
        // Save themes in local storage
        setSelectedTheme(themes.data.light);
    }, [])

    // Set the session before deployment requests run. The status-bar setter also
    // synchronizes the value read directly by the interceptor.
    useEffect(() => {
        if (sessionId) {
            statusBarContext.setUserSessionId(sessionId);
        }
    }, [sessionId]);

    useEffect(() => {
        // Wait for the context update so deployment loading is sequenced after
        // setUserSessionId instead of relying on React state timing.
        if (!statusBarContext.userSessionId.length) {
            return;
        }

        /*
        The API (expapi) is the authoritative source for deployment configuration. window.APP_CONFIG 
        is only a local fallback (e.g., for keys the API doesn't know about, like DEPLOYMENT_EXPSERVER_API_URL itself 
        which is needed just to reach the API).
        So the rule is: API values win, local config only fills gaps. 
        */
        // Load Env variables from expapi

        const isDeploymentEnvResponse = (
            response: unknown
        ): response is IDeploymentEnvResponse => {
            return (
                typeof response === "object" &&
                response !== null &&
                "valid" in response &&
                "env" in response &&
                Array.isArray((response as { env: unknown }).env)
            );
        };

        const loadDeploymentVars = async () => {
            try {
                const appConfig: IDeploymentEnv[] = Object.entries(window.APP_CONFIG ?? {}).map(
                    ([key, value]) => ({
                        key,
                        value: String(value)
                    })
                );

                const expApiUrl = appConfig.find(
                    item =>
                        item.key.toLowerCase() ===
                        "deployment_expserver_api_url"
                );

                const apiResponse = await axiosInterceptorForPostResponse(
                    `${expApiUrl?.value ?? "/expapi"}/deployment/env`,
                    {
                        prefixString: "DEPLOYMENT_"
                    }
                );

                if (apiResponse.status !== 200) {
                    throw new Error(`Server returned status ${apiResponse.status}`);
                }

                if (!isDeploymentEnvResponse(apiResponse.response)) {
                    throw new Error("Invalid environment response.");
                }

                const { valid, env } = apiResponse.response;

                if (!valid) {
                    throw new Error("Invalid environment response.");
                }

                if (env.length === 0) {
                    throw new Error("Environment configuration not found.");
                }

                const mergedEnv = [
                    ...env,
                    ...appConfig.filter(
                        appItem =>
                            !env.some(apiItem => apiItem.key === appItem.key)
                    )
                ];

                mainAppContext.setDeploymentVars(mergedEnv);
                setIsDeploymentVarsLoaded(true);
            } catch (error) {
                reportFatalError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load environment configuration."
                );

                setIsDeploymentVarsLoaded(false);
                setIsSessionCreated(false);
            }
        };

        void loadDeploymentVars();
    }, [statusBarContext.userSessionId]);

    useEffect(() => {
        if (!isDeploymentVarsLoaded) return;
        const controller = new AbortController();
        const isMountedRef = { current: true };
        if (userAuthSession) {
            mainAppContext.setUserAuthSession(mapAuthSessionToUserAuthSession(userAuthSession));
        }
        if (sessionId && sessionVariables.length) {
            initializeSessionData(sessionVariables, sessionId, controller.signal, isMountedRef)
        }
        const root = document.documentElement;
        root.style.setProperty("--node_height", NodeHeight);
        root.style.setProperty("--submenu_height", SubMenuHeight);

        return () => {
            isMountedRef.current = false;
            controller.abort();
        };
    }, [sessionId, sessionVariables.length, isDeploymentVarsLoaded, userAuthSession])

    useEffect(() => {
        if (!siteId || prevSiteIdRef.current === siteId || !isSessionCreated) return;

        prevSiteIdRef.current = siteId;
        const controller = new AbortController();
        let isMounted = true;

        axiosInterceptorWithoutUI({
            FetchProps: {
                url: NODE.GetKebabMenuData,
                data: {
                    "entID": siteId,
                    "entityName": "Site",
                    "kebabMenuTableName": "_Site",
                },
                customBaseUrl: apiBaseUrl,
                setFetchData: async (response: unknown, status?: string) => {
                    if (!isMounted) return;

                    if (
                        status !== "200" ||
                        !response ||
                        typeof response !== "object" ||
                        !("propertyJson" in response)
                    ) return;

                    try {
                        const parsed = FnParseJsonSafely(response.propertyJson as string);

                        const tableData = parsed["_Site"];

                        if (Array.isArray(tableData) && tableData.length) {
                            const siteData = tableData[0]; //  get first object

                            //  Save full object to context
                            if (isMounted) {
                                mainAppContext.setSiteProperties(siteData);
                            }
                        }

                    } catch (err) {
                        console.error("Failed to parse user profile data", err);
                    }
                }
            }, setFetchDataError: (err: IFetchInterceptorErrorData[] | null) => {
                if (isMounted && err?.length) {
                    reportFatalError(err.map(e => e.errString).join("\n"));
                }
            }, setFetchError: (err) => {
                if (isMounted && err) {
                    if (Array.isArray(err) && err.length)
                        reportFatalError(err[0])
                    else if (typeof err === "string")
                        reportFatalError(err)
                };
            },
            signal: controller.signal
        })

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [siteId, isSessionCreated]);

    // Replace any with proper type (keeping unknown per IAppContainer interface)
    const handleThemeChange = useCallback(
        (theme: unknown) => {

            // Type guard to ensure theme has required properties
            if (typeof theme !== 'object' || theme === null || !('name' in theme)) {
                console.error('Invalid theme object');
                return;
            }

            const typedTheme = theme as DefaultTheme & { name: string };
            FnSetSessionStorageItem("selected_theme", typedTheme.name)
            setSelectedTheme(typedTheme);

            if (mainAppContext.impUserProfileRecord || mainAppContext.userProfileRecord) {
                const userRecord = mainAppContext.impUserProfileRecord ? { ...mainAppContext.impUserProfileRecord } : { ...mainAppContext.userProfileRecord }
                userRecord.DisplayTheme = typedTheme.name
                axiosInterceptor(
                    {
                        url: EM.AddUpdateTableRecord,
                        customBaseUrl: apiBaseUrl,
                        allowShowLoader: true,
                        data: {
                            jsonString: JSON.stringify({
                                [`_${EntityNameEnums.User}`]: userRecord
                            })
                        },
                        setFetchData: async (_resp: unknown, status?: string) => {
                            if (status !== "200") {
                                return;
                            }

                            if (mainAppContext.impUserProfileRecord) {
                                mainAppContext.setImpUserProfileRecord({
                                    ...mainAppContext.impUserProfileRecord,
                                    DisplayTheme: typedTheme.name
                                });
                            } else if (mainAppContext.userProfileRecord) {
                                mainAppContext.setUserProfileRecord({
                                    ...mainAppContext.userProfileRecord,
                                    DisplayTheme: typedTheme.name
                                });
                            }
                        }
                    },
                    statusBarContext
                );
            }
        },
        [mainAppContext.userProfileRecord, mainAppContext.impUserProfileRecord, apiBaseUrl]
    );

    // Added proper types and return type
    async function applyCommonSettings(
        sessionVars: ISession[],
        apTableData: IApItem[],
        isMountedRef: { current: boolean }
    ): Promise<void> {
        if (!isMountedRef.current) return;
        const loginUser = sessionVars.find(
            (i) => i.VariableName === SESSION_VARIABLE_NAMES.LOGIN_USER_NAME
        );
        const getConfigValue = (
            name: string,
            isApplyUserValue: boolean = false,
            applyCanChange: number | null = null,
            userName: string = ""
        ) =>
            FnGetApplicationParameter(
                SettingGroups.AdminConfiguration,
                SettingSubgroups.Configure,
                apTableData,
                undefined,
                name,
                isApplyUserValue,
                applyCanChange,
                userName
            );

        const Measurement = getConfigValue(
            SettingApNames.Measurement
        );

        const DisplayTheme = getConfigValue(
            SettingApNames.DisplayTheme,
            true,
            null,
            loginUser?.SessionValue as string
        );

        const DiagnosticLevel = getConfigValue(
            SettingApNames.DiagnosticLevel
        );

        const hideFloorLayout = getConfigValue(
            SettingApNames.HideFloorLayout
        );

        if (!isMountedRef.current) return;

        if (DisplayTheme?.length) {
            const theme =
                DisplayTheme[0].Value?.toLowerCase() === "system"
                    ? window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light"
                    : DisplayTheme[0].Value?.toLowerCase() ?? "light";

            setSelectedTheme(themes.data[theme as keyof typeof themes.data]);
            FnSetSessionStorageItem("selected_theme", theme)
        }
        if (Measurement?.length) {
            CommonVariableContext.setMeasurement(
                Measurement[0].Value ?? Measurement[0].DefaultAPValue
            );
        }

        if (DiagnosticLevel?.length) {
            CommonVariableContext.setDiagnosticLevel(
                DiagnosticLevel[0].Value ?? DiagnosticLevel[0].DefaultAPValue
            );
        }

        if (hideFloorLayout?.length) {
            CommonVariableContext.setHideFloorLayout(
                hideFloorLayout[0].Value === "1"
            );
        }
    }

    const validateSiteToSearch = useCallback(
        async (): Promise<boolean> => {

            // Nothing to process
            if (!siteToSearchId) {
                return true;
            }

            try {
                // STEP 1: Wait for authorization
                const isAuthorized = await new Promise<boolean>(
                    (resolve, reject) => {
                        axiosInterceptor(
                            {
                                url: AUTH.IsAuthorized,
                                data: {
                                    entityName: EntityNameEnums.Site,
                                    entID: siteToSearchId
                                },
                                setFetchData: (
                                    authResp: unknown,
                                    status?: string
                                ) => {
                                    if (
                                        status !== "200" ||
                                        !authResp ||
                                        typeof authResp !== "object" ||
                                        !("isAuthorized" in authResp)
                                    ) {
                                        resolve(false);
                                        return;
                                    }

                                    resolve(
                                        Boolean(authResp.isAuthorized)
                                    );
                                }
                            },
                            statusBarContext
                        ).catch(reject);
                    }
                );

                // Stop here if authorization failed
                if (!isAuthorized) {
                    reportFatalError(
                        "You are not authorized to access the selected site."
                    );

                    return false;
                }

                // STEP 2: Wait for UpdateSession
                const updatedSession =
                    await new Promise<ISession[] | null>(
                        (resolve, reject) => {
                            axiosInterceptor(
                                {
                                    url: SESSION.UpdateSession,
                                    data: {
                                        jsonSession: JSON.stringify([
                                            {
                                                VariableContext: "Location",
                                                VariableName: "SiteID",
                                                SessionValue: siteToSearchId
                                            },
                                            {
                                                VariableContext: "Location",
                                                VariableName: "SiteName",
                                                SessionValue: siteNameToSearch ?? ""
                                            }
                                        ])
                                    },
                                    setFetchData: (
                                        updateSessionApiResponse: unknown,
                                        updateStatus?: string
                                    ) => {
                                        if (
                                            updateStatus !== "200" ||
                                            !updateSessionApiResponse ||
                                            typeof updateSessionApiResponse !==
                                            "object" ||
                                            !(
                                                "jsonSessionOutput" in
                                                updateSessionApiResponse
                                            )
                                        ) {
                                            resolve(null);
                                            return;
                                        }

                                        const extractedData =
                                            FnHandleAPIResponse(
                                                updateSessionApiResponse
                                                    .jsonSessionOutput,
                                                "Dataset"
                                            );

                                        if (
                                            !extractedData ||
                                            !Array.isArray(extractedData)
                                        ) {
                                            resolve(null);
                                            return;
                                        }

                                        resolve(
                                            extractedData as ISession[]
                                        );
                                    }
                                },
                                statusBarContext
                            ).catch(reject);
                        }
                    );

                // Stop if UpdateSession failed
                if (!updatedSession) {
                    reportFatalError(
                        "Unable to update site session."
                    );

                    return false;
                }

                // STEP 3: Update React session state
                sessionContext.setSessionList(
                    updatedSession
                );

                // STEP 4: Allow further processing/rendering

                return true;
            } catch (error) {
                console.error(
                    "Failed to process URL session:",
                    error
                );

                reportFatalError(
                    "Unable to process site session."
                );

                return false;
            }
        },
        [
            searchParams,
            statusBarContext,
            sessionContext.setSessionList
        ]
    );

    //Added proper types and return type
    async function initializeSessionData(
        sessionVarResponse: ISession[],
        newSessionId: string | null,
        signal: AbortSignal,
        isMountedRef: { current: boolean }
    ): Promise<void> {
        if (!sessionVarResponse.length || !newSessionId) return;

        const safeParseDataset = (val: any, type: string) => {
            return typeof val === "string"
                ? FnHandleAPIResponse(val, type)
                : FnHandleAPIResponse(JSON.stringify(val), type);
        };

        let apTableData: IApItem[] | null = null;
        let featureTableData: IFeatureItem[] | null = null;

        // Extract validation functions to reduce nesting
        const validateRequiredField = (_fieldName: string, data: any, errorMsg: string): boolean => {
            if (!data) {
                reportFatalError(errorMsg);
                return false;
            }
            return true;
        };

        await validateSiteToSearch();

        const handleInitSessionResponse = (
            data: Record<string, any>
        ): boolean => {
            if (!isMountedRef.current) return false;

            const accumulatedContextData: Record<string, any> = {};

            try {

                // APJson (Required)
                // Use constants for key names
                if (!validateRequiredField('APJson', data[SESSION_DATA_KEYS.AP_JSON], "AP data not found")) {
                    return false;
                }
                const apResult = safeParseDataset(
                    data[SESSION_DATA_KEYS.AP_JSON],
                    "Dataset"
                );

                //Add runtime validation before type assertion
                if (!Array.isArray(apResult) || !apResult.length) {
                    reportFatalError("AP table is empty");
                    return false;
                }

                accumulatedContextData.APJson = apResult;
                apTableData = apResult as IApItem[];

                // FeaturesJson (Required)
                if (!validateRequiredField('FeaturesJson', data[SESSION_DATA_KEYS.FEATURES_JSON]?.Features, "Features data not found")) {
                    return false;
                }

                if (
                    !Array.isArray(data[SESSION_DATA_KEYS.FEATURES_JSON].Features) ||
                    !data[SESSION_DATA_KEYS.FEATURES_JSON].Features.length
                ) {
                    reportFatalError("Features table is empty");
                    return false;
                }

                accumulatedContextData.FeaturesJson =
                    data[SESSION_DATA_KEYS.FEATURES_JSON].Features;

                featureTableData =
                    data[SESSION_DATA_KEYS.FEATURES_JSON].Features;

                // EmPgJson (Required)
                if (!validateRequiredField('EmPgJson', data[SESSION_DATA_KEYS.EM_PG_JSON]?.["NZ.Em.Pg"], "EmPgJson data not found")) {
                    return false;
                }

                if (
                    !Array.isArray(data[SESSION_DATA_KEYS.EM_PG_JSON]["NZ.Em.Pg"]) ||
                    !data[SESSION_DATA_KEYS.EM_PG_JSON]["NZ.Em.Pg"].length
                ) {
                    reportFatalError("EmPgJson table is empty");
                    return false;
                }

                accumulatedContextData.EmPgJson =
                    data[SESSION_DATA_KEYS.EM_PG_JSON]["NZ.Em.Pg"];

                // AllSitesHierarchyJson (Required)
                const allSitesHierarchyRaw = data[SESSION_DATA_KEYS.ALL_SITES_HIERARCHY_JSON] ?? data['AllSitesHierarchyJson'] ?? data['allsiteshierarchyjson'];

                if (!validateRequiredField('AllSitesHierarchyJson', allSitesHierarchyRaw, "AllSitesHierarchy data not found")) {
                    return false;
                }

                const parsedAllSitesHierarchy = typeof allSitesHierarchyRaw === 'string'
                    ? FnParseJsonSafely<IAllSitesHierarchy>(allSitesHierarchyRaw)
                    : allSitesHierarchyRaw;

                if (!validateRequiredField('AllSitesHierarchyJson', parsedAllSitesHierarchy, "AllSitesHierarchy data not found")) {
                    return false;
                }

                accumulatedContextData.AllSitesHierarchyJson = parsedAllSitesHierarchy;

                // LoginUserJson (Required)
                if (!validateRequiredField('LoginUserJson', data[SESSION_DATA_KEYS.LOGIN_USER_JSON], "User data not found")) {
                    return false;
                }

                accumulatedContextData.LoginUserJson =
                    data[SESSION_DATA_KEYS.LOGIN_USER_JSON];

                const userProfileRecord = FnHandleAPIResponse(accumulatedContextData.LoginUserJson, "Dataset")

                if (typeof userProfileRecord === "object" && "_User" in userProfileRecord && Array.isArray(userProfileRecord["_User"]) && userProfileRecord["_User"].length) {
                    mainAppContext.setUserProfileRecord(userProfileRecord["_User"][0])
                } else {
                    reportFatalError("User profile data not found.");
                    return false;
                }
                // Check if component is still mounted before setting context
                if (!isMountedRef.current) return false;

                // Load required context first; transfer data from accumulatedContextData
                mainAppContext.setApRecords(
                    accumulatedContextData.APJson
                );

                mainAppContext.setFeatureRecords(
                    accumulatedContextData.FeaturesJson
                );

                mainAppContext.setAllFeatureRecords(
                    accumulatedContextData.FeaturesJson
                );

                mainAppContext.setEmRecords(
                    accumulatedContextData.EmPgJson
                );


                mainAppContext.setAllSitesHierarchyRecords(
                    accumulatedContextData.AllSitesHierarchyJson
                );

                // Optional tables processing starts here
                for (const key in data) {
                    // Check if component is still mounted
                    if (!isMountedRef.current) return false;

                    try {

                        const keyToFind = key.toLowerCase();

                        //  Use constants instead of magic strings
                        if (keyToFind === SESSION_DATA_KEYS.AP_PROFILE_JSON) {

                            const parsedData = safeParseDataset(
                                data[key],
                                "Dataset"
                            );

                            if (
                                typeof parsedData === "object" &&
                                parsedData["PG.APProfile"]
                            ) {

                                mainAppContext.setApProfileRecords(
                                    parsedData["PG.APProfile"]
                                );
                            }
                        }

                        else if (keyToFind === SESSION_DATA_KEYS.ALERT_PROFILE_JSON) {

                            const parsedData = safeParseDataset(
                                data[key],
                                "Dataset"
                            );

                            if (
                                typeof parsedData === "object" &&
                                parsedData["_AlertProfile"]
                            ) {

                                mainAppContext.setAlertProfileRecords(
                                    parsedData["_AlertProfile"]
                                );
                            }
                        }
                        else if (keyToFind === SESSION_DATA_KEYS.ALERT_JSON) {
                            try {
                                const parsed = typeof data[key] === "string"
                                    ? JSON.parse(data[key])
                                    : data[key];

                                if (parsed && Array.isArray(parsed) && parsed.length) {
                                    mainAppContext.setAlertRecords(parsed);
                                }
                            } catch (error) {
                                console.error('Error parsing AlertJson:', error);
                            }
                        }
                        else if (keyToFind === SESSION_DATA_KEYS.NZ_PG_REF_JSON) {

                            const parsedData = safeParseDataset(
                                data[key],
                                "Data"
                            );

                            if (Array.isArray(parsedData)) {

                                mainAppContext.setRefTableRecords(
                                    parsedData
                                );
                            }
                        }
                        else if (keyToFind === SESSION_DATA_KEYS.FLOOR_DEVICES_JSON) {

                            if (
                                data[key] &&
                                typeof data[key] === "object"
                            ) {

                                explorerTreeContext.setFloorDeviceHierarchyRecords(
                                    data[key]
                                );
                            }
                        }
                        else if (keyToFind === SESSION_DATA_KEYS.IMP_USER_JSON) {

                            if (
                                data[key] &&
                                typeof data[key] === "object"
                            ) {
                                const impUserProfileRecord = FnHandleAPIResponse(data[key], "Dataset")

                                if (typeof impUserProfileRecord === "object" && "_User" in impUserProfileRecord && Array.isArray(impUserProfileRecord["_User"]) && impUserProfileRecord["_User"].length) {
                                    mainAppContext.setImpUserProfileRecord(impUserProfileRecord["_User"][0])
                                }

                            }
                        }

                    } catch (error) {
                        // Don't fail for optional data processing errors
                        console.warn(`Failed to process optional data ${key}:`, error);
                        // Continue processing other keys instead of returning false
                    }
                }

                return true;

            } catch (error) {

                reportFatalError(
                    "Failed to initialize session",
                    error
                );

                return false;
            }
        };

        axiosInterceptorWithoutUI({
            FetchProps: {
                url: SESSION.InitSession,
                data: {},
                customBaseUrl: apiBaseUrl,
                setFetchData: async (handleApiResponse: unknown, status?: string) => {
                    if (!isMountedRef.current) return;

                    if (status === "200" && handleApiResponse && typeof handleApiResponse === "object" && 'initDataJson' in handleApiResponse) {

                        try {
                            //Add validation before
                            if (typeof handleApiResponse.initDataJson !== 'string') {
                                reportFatalError("Invalid session data format: initDataJson must be a string");
                                return;
                            }

                            const parsed = FnParseJsonSafely(handleApiResponse.initDataJson);

                            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                                const isValidSessionData =
                                    handleInitSessionResponse(parsed);

                                if (!isValidSessionData) {
                                    return;
                                }
                            }

                            if (apTableData) {
                                await applyCommonSettings(sessionVarResponse, apTableData, isMountedRef);
                            }

                            // Add error message for missing required data
                            if (!featureTableData) {
                                reportFatalError("Feature data is required but missing after session initialization");
                                return;
                            }

                            if (isMountedRef.current) {
                                sessionContext.setSessionList(sessionVarResponse);
                                setIsSessionCreated(true);

                                // Add try-catch for onSuccess callback
                                try {
                                    onSuccess();
                                } catch (error) {
                                    console.error("Error in onSuccess callback:", error);
                                }
                            }
                        } catch (error) {
                            reportFatalError("Failed to initialize session", error);

                        }

                    } else if (status !== "200") {
                        reportFatalError(`Session initialization failed: server returned status ${status ?? "unknown"}`);
                    } else {
                        reportFatalError("Session initialization data missing or invalid");
                    }
                }
            }, setFetchDataError: (err: IFetchInterceptorErrorData[] | null) => {
                if (isMountedRef.current && Array.isArray(err) && err.length > 0) {
                    const errorMessage = err
                        .filter((item) => item.errCode > 0)
                        .map((item) => item.errString ?? "")
                        .filter(Boolean)
                        .join("\n");

                    if (errorMessage) {
                        reportFatalError(errorMessage);
                    }
                }
            }, setFetchError: (err) => {
                if (isMountedRef.current && err) {
                    if (Array.isArray(err) && err.length)
                        reportFatalError(err[0])
                    else if (typeof err === "string")
                        reportFatalError(err)
                };
            },
            signal: signal
        })
    }

    useEffect(() => {
        if (!isSessionCreated || !isDeploymentVarsLoaded) {
            hasEvaluatedWhatsNewRef.current = false;
            return;
        }
        if (hasEvaluatedWhatsNewRef.current) return;
        if (!mainAppContext.apRecords || mainAppContext.apRecords.length === 0) {
            setIsEvaluatingWhatsNew(false);
            return;
        }

        hasEvaluatedWhatsNewRef.current = true;

        const evaluateWhatsNew = async () => {
            const apRecord = FnGetWhatsNewApRecord(mainAppContext.apRecords);
            const shouldShow = FnShouldShowWhatsNew(apRecord);

            if (shouldShow) {
                const { available, url } = await FnCheckWhatsNewPdfAvailable(mainAppContext.isInternetAvailable);
                if (available) {
                    setWhatsNewPdfUrl(url);
                    setIsWhatsNewOpen(true);
                    setIsEvaluatingWhatsNew(false);
                    await FnUpdateWhatsNewStartDate(apRecord, statusBarContext);
                    return;
                }
            }

            setIsEvaluatingWhatsNew(false);
            setIsWhatsNewOpen(false);
        };

        void evaluateWhatsNew();
    }, [isSessionCreated, isDeploymentVarsLoaded, mainAppContext.apRecords]);

    const handleCloseWhatsNew = () => {
        setIsWhatsNewOpen(false);
    };

    const handleDontShowAgainWhatsNew = async () => {
        const apRecord = FnGetWhatsNewApRecord(mainAppContext.apRecords);
        await FnUpdateWhatsNewEndDate(apRecord, statusBarContext);
        setIsWhatsNewOpen(false);
    };

    return (
        <ThemeProvider theme={selectedTheme}>
            <GlobalStyles />

            {isSessionCreated && isDeploymentVarsLoaded && (
                isWhatsNewOpen ? (
                    <div className="nz-app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
                        <WhatsNewContainer
                            uniqueName="app-whats-new-container"
                            pdfUrl={whatsNewPdfUrl}
                            onClose={handleCloseWhatsNew}
                            onDontShowAgain={handleDontShowAgainWhatsNew}
                        />
                    </div>
                ) : isEvaluatingWhatsNew ? null : (
                    <AppContainer
                        isNewSession={isNewSession}
                        uniqueName={uniqueName}
                        handleThemeChange={handleThemeChange}
                    />
                )
            )}
        </ThemeProvider>
    );
}

// Combined NzApp component with context and routing wrapper
function NzApp(props: INzApp) {
    return (
        <AppContextWrapper>
            <Router>
                <NzLoadContextAndVariables {...props} />
            </Router>
        </AppContextWrapper>
    );
}

export default NzApp

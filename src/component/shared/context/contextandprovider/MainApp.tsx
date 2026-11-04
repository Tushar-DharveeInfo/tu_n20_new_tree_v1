import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { IAlertProfileItem, IAllSitesHierarchy, IApItem, IApProfileItem, IEmItem, IFeatureForHelp, IFeatureItem, IMainApp, IRefItem, ISiteProperties, IUserAuthSession, IUserProfileRecord } from "../allinterface/IMainApp";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { AP, EM, FEATURE } from "../../interceptors/EndPoints";
import { IStatusBar } from "../allinterface/IStatusBar";
import { ISession } from "../allinterface/ISession";
import { FnHandleAPIResponse } from "../../allcommon/basic/FnHandleAPIResponse";
import { FnIsInternetAvailable } from "../../../appcontainer/allcommon/FnIsInternetAvailable";

let featuresData: IFeatureItem[] | null = null;
let deploymentVarData: Record<string, any>[] | null = null;
let configureRecords: IApItem[] | null = null;
const getfeaturesData = (): IFeatureItem[] | null => featuresData;
const getDeploymentVars = (): Record<string, any>[] | null => deploymentVarData;
const getConfigureValueFromAp = (name: string) => {
    if (!configureRecords?.length) return null;
    return configureRecords.find((item) => item.Name.toLowerCase() === name.toLowerCase());
}
const MainAppContext = createContext<IMainApp | undefined>(undefined);

function MainAppProvider({ children }: IAppContextWrapper) {
    const [apRecords, setApRecords] = useState<IApItem[]>([]);
    const [featureRecords, setFeatureRecords] = useState<IFeatureItem[]>([]);
    const [emRecords, setEmRecords] = useState<IEmItem[]>([]);
    const [apProfileRecords, setApProfileRecords] = useState<IApProfileItem[]>([]);
    const [alertProfileRecords, setAlertProfileRecords] = useState<IAlertProfileItem[]>([]);
    const [alertRecords, setAlertRecords] = useState<Record<string, any>[]>([]);
    const [refTableRecords, setRefTableRecords] = useState<IRefItem[]>([]);
    const [apiProfileRecords, setApiProfileRecords] = useState<Record<string, any>[]>([]);
    const [isInternetAvailable, setIsInternetAvailable] = useState<boolean>(true);
    const [deploymentVars, setDeploymentVars] = useState<Record<string, any>[]>([]);
    const [siteProperties, setSiteProperties] = useState<ISiteProperties>();
    const [allFeatureRecords, setAllFeatureRecords] = useState<IFeatureItem[]>([]);
    const [dciRecords, setDciRecords] = useState<Record<string, any>[] | undefined>();
    const [autoExecuteWorkorder, setAutoExecuteWorkorder] = useState<boolean>(false);
    const [selectedFeatureForHelp, setSelectedFeatureForHelp] = useState<IFeatureForHelp>()
    const [userProfileRecord, setUserProfileRecord] = useState<IUserProfileRecord>()
    const [impUserProfileRecord, setImpUserProfileRecord] = useState<IUserProfileRecord>()
    const [userAuthSession, setUserAuthSession] = useState<IUserAuthSession>();
    const [allSitesHierarchyRecords, setAllSitesHierarchyRecords] = useState<IAllSitesHierarchy | undefined>();

    useEffect(() => {
        try {
            featuresData = featureRecords;
        } catch (error) {
            console.error("Error updating features data:", error);
        }
    }, [featureRecords]);

    useEffect(() => {
        try {
            deploymentVarData = deploymentVars;
        } catch (error) {
            console.error("Error updating deployment vars:", error);
        }
    }, [deploymentVars]);

    useEffect(() => {
        try {
            if (!allFeatureRecords.length) return;

            let filtered = [...allFeatureRecords];

            if (!isInternetAvailable) {
                filtered = filtered.filter(item => !item.Internet);
            }

            if (siteProperties?.Locked) {
                filtered = filtered.filter(item => !item.Lock);
            }

            setFeatureRecords(filtered);
        } catch (error) {
            console.error("Error filtering feature records:", error);
        }
    }, [isInternetAvailable, siteProperties?.Locked, allFeatureRecords]);

    const checkIsInternetAvailable = useCallback(async (): Promise<boolean> => {
        try {
            const value = await FnIsInternetAvailable();
            setIsInternetAvailable(value);
            return value;
        } catch (error) {
            console.error("Error checking internet availability:", error);
            setIsInternetAvailable(false);
            return false;
        }
    }, []);

    useEffect(() => {
        const checkInternet = async () => {
            try {
                if (apRecords.length) {
                    const isDisableInternet = apRecords.find((item) => item?.Name?.toLowerCase() === "disableinternet");
                    if (isDisableInternet?.Value?.toString() === "1") {
                        setIsInternetAvailable(false);
                    } else {
                        const value = await FnIsInternetAvailable();
                        setIsInternetAvailable(value);
                    }
                    configureRecords = apRecords.filter((item) => item.SubGroupName.toLowerCase() === "configure");
                }
            } catch (error) {
                console.error("Error in internet availability check:", error);
                setIsInternetAvailable(false);
            }
        };

        checkInternet();
    }, [apRecords]);

    const fetchFeatures = useCallback(async (statusBarContext: IStatusBar, sessionVars: ISession[]) => {
        const handleFeatureApiData = async (featureDataResponse: unknown, status?: string) => {
            if (status === "200" && featureDataResponse && typeof featureDataResponse === "object" && 'jsonString' in featureDataResponse) {
                try {
                    const parsedData = JSON.parse(featureDataResponse.jsonString as string);
                    if (sessionVars && parsedData.Features && parsedData.Features.length) {
                        const impersonatedUserName = (sessionVars as ISession[]).find((item) => { return item.VariableName === "ImpersonatedUserName" });
                        for (let index = 0; index < parsedData.Features.length; index++) {
                            const element = parsedData.Features[index];
                            if (element && element.Label && element.Label?.toLowerCase() === "user") {
                                element.Tooltip = impersonatedUserName && impersonatedUserName.SessionValue ? `Impersonating user ${impersonatedUserName.SessionValue}` : element.Tooltip;
                            }
                        }
                        setAllFeatureRecords(parsedData.Features);
                        setFeatureRecords(parsedData.Features);
                    }
                } catch (error) {
                    console.error("Error parsing feature data:", error);
                    setAllFeatureRecords([]);
                    setFeatureRecords([]);
                }
            }
        };

        if (statusBarContext) {
            try {
                await axiosInterceptor({
                    url: FEATURE.GetFeatures,
                    data: {},
                    setFetchData: handleFeatureApiData
                }, statusBarContext);
            } catch (error) {
                console.error("Error fetching features:", error);
            }
        }
    }, []);

    const fetchApRecords = useCallback(async (statusBarContext?: IStatusBar) => {
        const handleApProfileData = async (apProfileResponse: unknown, status?: string) => {
            if (status === "200" && apProfileResponse && typeof apProfileResponse === "object" && 'jsonString' in apProfileResponse) {
                try {
                    const parsedData = FnHandleAPIResponse(apProfileResponse.jsonString, "Dataset");

                    if (Array.isArray(parsedData) && parsedData.length) {
                        setApRecords(parsedData);
                    }
                } catch (error) {
                    console.error("Error processing AP records:", error);
                    setApRecords([]);
                }
            }
        };

        if (statusBarContext) {
            try {
                await axiosInterceptor({
                    url: AP.GetAllCol,
                    data: {
                        applyUserValue: true
                    },
                    setFetchData: handleApProfileData
                }, statusBarContext);
            } catch (error) {
                console.error("Error fetching AP records:", error);
            }
        }
    }, []);

    const fetchApProfileRecords = useCallback(async (statusBarContext?: IStatusBar) => {
        const handleApProfileData = async (apProfileResponse: any) => {
            try {
                const parsedData = FnHandleAPIResponse(apProfileResponse, "Dataset");

                if (typeof parsedData === "object" && parsedData["PG.APProfile"]) {
                    setApProfileRecords(parsedData["PG.APProfile"]);
                }
            } catch (error) {
                console.error("Error processing AP profile records:", error);
                setApProfileRecords([]);
            }
        };

        if (statusBarContext) {
            try {
                await axiosInterceptor({
                    url: EM.GetEntityRecords,
                    data: {
                        entityName: "AP",
                        tableName: "PG.APProfile",
                        entIDs: ""
                    },
                    setFetchData: handleApProfileData
                }, statusBarContext);
            } catch (error) {
                console.error("Error fetching AP profile records:", error);
            }
        }
    }, []);

    const fetchAlertProfileRecords = useCallback((statusBarContext: IStatusBar) => {
        try {
            axiosInterceptor({
                url: EM.GetEntityRecords,
                data: {
                    "entityName": "AlertProfile",
                    "tableName": "_AlertProfile",
                },
                setFetchData: (handleApiResponse: unknown, status?: string) => {
                    try {
                        if (status === "200" && handleApiResponse) {
                            const alertProfiles = FnHandleAPIResponse(handleApiResponse, "Dataset");
                            if (alertProfiles && typeof alertProfiles === "object"
                                && alertProfiles._AlertProfile && Array.isArray(alertProfiles._AlertProfile)) {
                                setAlertProfileRecords(alertProfiles._AlertProfile);
                            }
                        }
                    } catch (error) {
                        console.error("Error processing alert profile records:", error);
                        setAlertProfileRecords([]);
                    }
                }
            }, statusBarContext);
        } catch (error) {
            console.error("Error fetching alert profile records:", error);
        }
    }, []);

    const providers = useMemo(
        () => ({
            apRecords,
            setApRecords,
            featureRecords,
            setFeatureRecords,
            allFeatureRecords,
            setAllFeatureRecords,
            emRecords,
            setEmRecords,
            apProfileRecords,
            setApProfileRecords,
            alertProfileRecords,
            setAlertProfileRecords,
            alertRecords,
            setAlertRecords,
            refTableRecords,
            setRefTableRecords,
            apiProfileRecords,
            setApiProfileRecords,
            allSitesHierarchyRecords,
            setAllSitesHierarchyRecords,
            isInternetAvailable,
            setIsInternetAvailable,
            userProfileRecord,
            setUserProfileRecord,
            impUserProfileRecord,
            setImpUserProfileRecord,
            siteProperties,
            setSiteProperties,
            deploymentVars,
            dciRecords,
            autoExecuteWorkorder,
            setAutoExecuteWorkorder,
            selectedFeatureForHelp,
            setSelectedFeatureForHelp,
            setDciRecords,
            setDeploymentVars,
            userAuthSession,
            setUserAuthSession,
            fetchFeatures,
            fetchApRecords,
            fetchApProfileRecords,
            fetchAlertProfileRecords,
            checkIsInternetAvailable
        }),
        [
            apRecords,
            featureRecords,
            emRecords,
            apProfileRecords,
            alertProfileRecords,
            alertRecords,
            refTableRecords,
            apiProfileRecords,
            isInternetAvailable,
            deploymentVars,
            siteProperties,
            allFeatureRecords,
            dciRecords,
            autoExecuteWorkorder,
            allSitesHierarchyRecords,
            selectedFeatureForHelp,
            userProfileRecord,
            impUserProfileRecord,
            fetchFeatures,
            fetchApRecords,
            fetchApProfileRecords,
            fetchAlertProfileRecords,
            checkIsInternetAvailable,
            userAuthSession
        ]
    );

    return (
        <MainAppContext.Provider value={providers}>
            {children}
        </MainAppContext.Provider>
    );
}

export { MainAppContext, MainAppProvider, getfeaturesData, getDeploymentVars, getConfigureValueFromAp };

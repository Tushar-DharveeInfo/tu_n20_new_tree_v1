
import { createContext, useMemo, useState, useCallback } from "react";
import { IAlertProfile, IAlertProfileItem } from "../allinterface/IAlertProfile";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { IStatusBar } from "../allinterface/IStatusBar";
import { EM } from "../../interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../allcommon/basic/FnHandleAPIResponse";


const AlertProfileContext = createContext<IAlertProfile | undefined>(undefined);

function AlertProfileProvider({ children }: IAppContextWrapper) {

    const [alertProfiles, setAlertProfiles] = useState<IAlertProfileItem[]>([]);

    const fetchAlertProfile = useCallback((statusBarContext: IStatusBar) => {
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
                                setAlertProfiles(alertProfiles._AlertProfile);
                            }
                        }
                    } catch (error) {
                        console.error("Error processing alert profile response:", error);
                        setAlertProfiles([]);
                    }
                }
            }, statusBarContext);
        } catch (error) {
            console.error("Error fetching alert profiles:", error);
            setAlertProfiles([]);
        }
    }, []);

    const providers: IAlertProfile = useMemo(() => ({
        alertProfiles,
        setAlertProfiles,
        fetchAlertProfile
    }), [alertProfiles, fetchAlertProfile]);

    return (
        <AlertProfileContext.Provider value={providers} >
            {children}
        </AlertProfileContext.Provider>
    );
}

export { AlertProfileContext };
export { AlertProfileProvider };

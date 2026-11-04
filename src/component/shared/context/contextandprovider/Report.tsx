
import { useState, createContext, useMemo, useCallback } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { EM } from "../../interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../allcommon/basic/FnHandleAPIResponse";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { IStatusBar } from "../allinterface/IStatusBar";
import { IReport, IReportProfileItem } from "../allinterface/IReport";

const ReportContext = createContext<IReport | undefined>(undefined);

function ReportProvider({ children }: IAppContextWrapper) {
    const [reportProfiles, setReportProfiles] = useState<IReportProfileItem[]>([]);

    const fetchReportProfile = useCallback(async (reCall?: boolean, statusBarContext?: IStatusBar) => {
        const handleApProfileData = async (apProfileResponse: any) => {
            try {
                const parsedData = FnHandleAPIResponse(apProfileResponse, "Dataset");
                if (typeof parsedData === "object" && parsedData["_AP"]) {
                    setReportProfiles(parsedData["_AP"]);
                }
            } catch (error) {
                console.error("Error processing report profile data:", error);
                setReportProfiles([]);
            }
        };

        // Trigger fetch regardless of existing records if reCall is true
        if (statusBarContext && (reCall || (!reportProfiles || reportProfiles.length === 0))) {
            try {
                await axiosInterceptor({
                    url: EM.GetEntityRecords,
                    data: {
                        entityName: "ReportProfile",
                        tableName: "_ReportProfile",
                        entIDs: ""
                    },
                    setFetchData: handleApProfileData
                }, statusBarContext);
            } catch (error) {
                console.error("Error fetching report profile:", error);
                setReportProfiles([]);
            }
        }
    }, [reportProfiles]);


    const contextValue: IReport = useMemo(() => ({
        reportProfiles,
        setReportProfiles,
        fetchReportProfile
    }), [reportProfiles, fetchReportProfile]);

    return (
        <ReportContext.Provider value={contextValue} >
            {children}
        </ReportContext.Provider>
    );
}

export { ReportContext };
export { ReportProvider };

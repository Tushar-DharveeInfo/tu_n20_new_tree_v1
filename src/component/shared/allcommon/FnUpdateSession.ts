
import { ISessionVariable } from "../allinterface/basic/ISessionVariable";
import { ISessionContextProps } from "../context/allinterface/ISession";
import { IStatusBar } from "../context/allinterface/IStatusBar";
import { SESSION } from "../interceptors/EndPoints";
import { axiosInterceptor } from "../interceptors/Interceptor";
import { FnHandleAPIResponse } from "./basic/FnHandleAPIResponse";

const FnUpdateSession = async (
    sessionData: ISessionVariable[],
    sessionContext: ISessionContextProps,
    statusBarContext: IStatusBar
): Promise<void> => {
    try {
        if (!sessionData?.length) {
            return;
        }

        const handleApiForSessionUpdate = (
            sessionUpdateApiResponse: unknown
        ) => {
            if (
                sessionUpdateApiResponse &&
                typeof sessionUpdateApiResponse === "object" &&
                "jsonSessionOutput" in sessionUpdateApiResponse
            ) {
                const parsedData = FnHandleAPIResponse(
                    sessionUpdateApiResponse.jsonSessionOutput,
                    "Dataset"
                );

                if (parsedData?.length > 0) {
                    sessionContext.setSessionList(parsedData);
                }
            }
        };

        await axiosInterceptor(
            {
                url: SESSION.UpdateSession,
                data: {
                    jsonSession: JSON.stringify(sessionData)
                },
                setFetchData: handleApiForSessionUpdate
            },
            statusBarContext
        );
    } catch (error) {
        console.error(
            "Error in function(FnUpdateSession): ",
            error
        );
    }
};

export { FnUpdateSession };
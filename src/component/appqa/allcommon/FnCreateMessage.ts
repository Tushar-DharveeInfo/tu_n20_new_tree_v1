
import { LOG } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";

const FnCreateMessage = async (
    projectInitial: string,
    msgID: string,
    optionalMessage: string = "",
    statusBarContext: IStatusBar,
    customMessage?: string,
    errorMessage?: string
): Promise<string | undefined> => {

    const payloadForCreateMessage = {
        projectInitial,
        msgID,
        optionalMessage,
        customMessage,
        errorMessage
    };

    return new Promise((resolve) => {
        axiosInterceptor(
            {
                url: LOG.CreateMessage,
                data: payloadForCreateMessage,
                setFetchData: (resp: any) => {
                    if (resp?.finalMessage) {
                        resolve(resp.finalMessage);
                    } else {
                        resolve(undefined);
                    }
                }
            },
            statusBarContext
        ).catch(() => {
            resolve(undefined);
        });
    });
};
export { FnCreateMessage }
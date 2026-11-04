
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { IFetchProps } from "../allinterface/IStatusBarContainer";

type FetchResult = {
    status?: string;
    data: unknown;
};

const FnCallApiToFetchWithResult = (
    args: IFetchProps,
    statusBarContext: IStatusBar
): Promise<FetchResult> => {
    return new Promise((resolve) => {
        axiosInterceptor(
            {
                ...args,
                setFetchData: (data: unknown, status?: string) => {
                    resolve({ data, status });
                },
            },
            statusBarContext
        );
    });
};

export { FnCallApiToFetchWithResult }

import { MISC, NODE } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { IStatusBar } from "../../context/allinterface/IStatusBar";

type TableRecord = Record<string, unknown>;

const FnNodeGetKebabMenuData = (
    apiPayload: Record<string, any>,
    statusbarContext: IStatusBar
): Promise<TableRecord | undefined> => {
    return new Promise((resolve) => {
        axiosInterceptor(
            {
                url: NODE.GetKebabMenuData,
                data: apiPayload,
                setFetchData: (resp: unknown, status?: string) => {
                    if (
                        status === "200" &&
                        resp &&
                        typeof resp === "object" &&
                        "propertyJson" in resp &&
                        resp.propertyJson
                    ) {
                        try {
                            const parsed = JSON.parse(resp.propertyJson as string);
                            if (parsed && typeof parsed === "object") {
                                resolve(parsed);
                                return;
                            }
                        } catch {
                            // swallow error
                        }
                    }
                    resolve(undefined);
                }
            },
            statusbarContext
        );
    });
}
export { FnNodeGetKebabMenuData }
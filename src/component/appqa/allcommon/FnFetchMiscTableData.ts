
import { MISC } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";

type TableRecord = Record<string, unknown>;

const FnFetchMiscTableData = async (
    tableName: string,
    statusbarContext: IStatusBar
): Promise<TableRecord[] | undefined> => {
    try {
        if (!tableName || typeof tableName !== "string" || !tableName.length) {
            return undefined;
        }

        return await new Promise((resolve) => {
            try {
                axiosInterceptor(
                    {
                        url: MISC.GetTableData,
                        data: { tableName },
                        setFetchData: (
                            resp: unknown,
                            status?: string
                        ) => {
                            try {
                                if (
                                    status === "200" &&
                                    resp &&
                                    typeof resp === "object" &&
                                    "dataJson" in resp &&
                                    typeof resp.dataJson === "string"
                                ) {
                                    const parsed = JSON.parse(
                                        resp.dataJson
                                    );

                                    if (Array.isArray(parsed)) {
                                        resolve(parsed);

                                        return;
                                    }
                                }

                                resolve(undefined);
                            } catch (parseError) {
                                console.error(
                                    "Error in parse :",
                                    parseError
                                );

                                resolve(undefined);
                            }
                        }
                    },
                    statusbarContext
                );
            } catch (fetchError) {
                console.error(
                    "Error in fetch:",
                    fetchError
                );

                resolve(undefined);
            }
        });
    } catch (error) {
        console.error(
            "Unexpected error thrown:",
            error
        );

        return undefined;
    }
};

export { FnFetchMiscTableData };
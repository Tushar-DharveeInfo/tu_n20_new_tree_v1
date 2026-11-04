import { DELIMITER } from "../alldefaultprops/basic/DefaultPropsChekedListBoxControl";
import { IStatusBar } from "../context/allinterface/IStatusBar";
import { EM } from "../interceptors/EndPoints";
import { axiosInterceptor } from "../interceptors/Interceptor";

const FnDeleteTableRecords = (
    tableName: string,
    statusBarContext: IStatusBar,
    entIds: string[],
    recIds?: string[],
): Promise<boolean> =>
    new Promise((resolve) => {
        if (!entIds.length) {
            resolve(true);
            return;
        }

        axiosInterceptor(
            {
                url: EM.DeleteTableRecords,
                data: {
                    tableName,
                    entIDs: entIds.join(DELIMITER.separator),
                    recIDs: recIds?.join(DELIMITER.separator)
                },
                allowShowLoader: true,
                setFetchData: (_resp: unknown, status?: string) => {
                    resolve(status === "200");
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error(`Failed to delete out-of-bounds ${tableName} records:`, error);
            resolve(false);
        });
    });

export { FnDeleteTableRecords }

import { EM } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { FnNodeGetKebabMenuData } from "../../shared/allcommon/settingsform/FnNodeGetKebabMenuData";

type IEntityTable = Record<string, unknown>;
const FnGetKebabMenuDataByEntity = async (
    entityName: string,
    nodeType: string | undefined,

    nodeEntID: string,
    statusBarContext: IStatusBar
): Promise<Record<string, unknown> | undefined> => {

    const entityTables = await new Promise<IEntityTable[]>((resolve) => {
        axiosInterceptor(
            {
                url: EM.GetTableVsProperty,
                allowShowLoader: true,
                data: {
                    entityName,
                    tableNames: ""
                },
                setFetchData: (apiResponse: unknown, status?: string) => {
                    if (status === "200" && Array.isArray(apiResponse)) {
                        resolve(apiResponse as IEntityTable[]);
                    } else {
                        resolve([]);
                    }
                }
            },
            statusBarContext
        );
    });

    const pgClassTable =
        nodeType?.toLowerCase() === "deviceslot"
            ? entityTables.find(
                t =>
                    String(t.tableName ?? "").toLowerCase() ===
                    "pg.deviceslot"
            )
            : entityTables.find(t => t.entityPgClass);

    if (!pgClassTable) {
        return undefined;
    }

    const pgTable = entityTables.find(
        t => String(t.tableName ?? "").toLowerCase() === "pg"
    );

    const kebabMenuPayload: Record<string, unknown> = {
        entID: nodeEntID.includes("##")
            ? nodeEntID.split("##")[0]
            : nodeEntID,
        entityName,
        kebabMenuTableName:
            String(pgClassTable.tableName) +
            (pgTable?.tableName ? `;${pgTable.tableName}` : ""),
    };

    return await FnNodeGetKebabMenuData(kebabMenuPayload, statusBarContext);
};

export { FnGetKebabMenuDataByEntity };
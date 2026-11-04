import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnDeepClone } from "./FnDeepClone";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { ISession } from "../../context/allinterface/ISession";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { MISC } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { ILayoutTableRow } from "../../allinterface/plan/IEditFloorLayout";
import { FnGenerateFloorLayoutConfig } from "../../../features/allcommon/FnGenerateFloorLayoutConfig";
import { FnSaveFloorLayoutData } from "../../../features/allcommon/FnSaveFloorLayoutData";

const awaitableFetchInterceptor = (
    params: Record<string, unknown>,
    statusbarContext: IStatusBar
): Promise<ILayoutTableRow[] | undefined> => {
    return new Promise((resolve) => {
        axiosInterceptor(
            {
                url: MISC.GetTableData,
                data: params.data,
                setFetchData: (resp: unknown, status?: string) => {
                    if (
                        status === "200" &&
                        resp &&
                        typeof resp === "object" &&
                        "dataJson" in resp
                    ) {
                        const jsonData = FnParseJsonSafely(
                            resp.dataJson as string
                        );

                        resolve(
                            Array.isArray(jsonData) && jsonData.length > 0
                                ? (jsonData as ILayoutTableRow[])
                                : undefined
                        );
                        return;
                    }

                    resolve(undefined);
                },
            },
            statusbarContext
        );
    });
};

const FnRecreateFloorLayout = async (
    floorNode: ITreeNode,
    statusbarContext: IStatusBar,
    cachedTreeData: ITreeNode[]
): Promise<boolean> => {
    try {


        const locationLayouts = await awaitableFetchInterceptor(
            {
                data: { tableName: "PG.LocationLayout" },
            },
            statusbarContext
        );

        const deviceLayouts = await awaitableFetchInterceptor(
            {
                data: { tableName: "PG.DeviceLayout" },
            },
            statusbarContext
        );

        const newFloorLayoutTemplate = await FnGenerateFloorLayoutConfig(
            floorNode,
            statusbarContext,
            locationLayouts,
            deviceLayouts
        );

        if (!newFloorLayoutTemplate?.floorLayoutJson) {
            return false;
        }

        const clonedTemplate = FnDeepClone(
            newFloorLayoutTemplate.floorLayoutJson
        );

        return await FnSaveFloorLayoutData(
            clonedTemplate,
            statusbarContext,
            cachedTreeData,
            newFloorLayoutTemplate.RecIDs
        );
    } catch (error) {
        console.error('Error in recreate floor layout :', error);
        return false;
    }
};

export { FnRecreateFloorLayout };
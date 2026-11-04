import { Device, getObjectTemplate, layoutConfig, Location } from "@n20a/liblayout";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { FnGenerateUniqueId } from "../../shared/allcommon/basic/FnGenerateUniqueId";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { EM } from "../../shared/interceptors/EndPoints";
import { FnGetNodeDetailsBasedOnKey } from "../../shared/allcommon/tree/FnGetNodeDetailsBasedOnKey";
import { defaultFloorLayout } from "../alldefaultprops/EditFloorLayoutDefaultProps";

const awaitableFetchInterceptor = (params: any, statusBarContext: any) => {
    return new Promise<Record<string, any> | undefined>((resolve) => {
        try {
            if (!params || typeof params !== "object") {
                resolve(undefined);
                return;
            }

            axiosInterceptor(
                {
                    url: EM.GetAllTablesRecord,
                    data: params.data,
                    setFetchData: (resp: unknown, status?: string) => {
                        try {
                            if (
                                status === "200" &&
                                resp &&
                                typeof resp === "object" &&
                                "jsonStringOutput" in resp &&
                                (resp as any).jsonStringOutput
                            ) {
                                try {
                                    const jsonData = JSON.parse(
                                        (resp as any).jsonStringOutput as string
                                    );

                                    if (!Array.isArray(jsonData?.AllTables)) {
                                        resolve(undefined);
                                        return;
                                    }

                                    const result: Record<string, any> = {};

                                    jsonData.AllTables.forEach((table: any) => {
                                        if (!table || typeof table !== "object") return;
                                        if (!Array.isArray(table?.TableData)) return;

                                        table.TableData.forEach((item: any) => {
                                            if (!item || typeof item !== "object") return;
                                            if (item?.Name === undefined) return;

                                            const value = item.Value;

                                            const isValidValue =
                                                value !== null &&
                                                value !== undefined &&
                                                value !== "";

                                            if (
                                                isValidValue ||
                                                result[item.Name] === undefined
                                            ) {
                                                result[item.Name] = value;
                                            }
                                        });
                                    });

                                    resolve(result);
                                    return;

                                } catch (err) {
                                    console.error("JSON parse error:", err);
                                }
                            }

                            resolve(undefined);

                        } catch (innerError) {
                            console.error("setFetchData error:", innerError);
                            resolve(undefined);
                        }
                    }
                },
                statusBarContext
            );

        } catch (error) {
            console.error("awaitableFetchInterceptor error:", error);
            resolve(undefined);
        }
    });
};

const FnGenerateFloorLayoutConfig = async (selectedFloorNode: ITreeNode
    , statusBarContext: IStatusBar
    , locationLayouts?: Record<string, any>[]
    , deviceLayouts?: Record<string, any>[]
    , cachedTreeData?: ITreeNode[]): Promise<{ floorLayoutJson: layoutConfig; RecIDs: string[] } | null> => {
    try {
        let floorNode = selectedFloorNode;
        if (cachedTreeData?.length && selectedFloorNode.key) {
            const foundFromCache = FnGetNodeDetailsBasedOnKey(cachedTreeData, selectedFloorNode.key)
            if (foundFromCache?.node) {
                floorNode = foundFromCache?.node
            }
        }
        let floorLayoutJson: layoutConfig = await defaultFloorLayout(floorNode.Name ?? "FloorLayout");
        const RecIDs: string[] = [];
        const roomNodeData = floorNode.parentEntID ? await awaitableFetchInterceptor(
            {
                data: {
                    tableNames: "_Room",
                    entID: floorNode.parentEntID
                }
            },
            statusBarContext
        ) : undefined;
        if (!roomNodeData?.Width || !roomNodeData?.Length)
            return null;
        floorLayoutJson.entityName = floorNode.NodeEntityname ?? "";
        floorLayoutJson.entId = floorNode.NodeEntID ?? "";
        floorLayoutJson.floorType = floorNode.Type ?? "RaisedFloor";
        floorLayoutJson.w = roomNodeData?.Width ? Number(roomNodeData?.Width) : floorLayoutJson.w;
        floorLayoutJson.h = roomNodeData?.Length ? Number(roomNodeData?.Length) : floorLayoutJson.h;
        floorLayoutJson.RulerSize = 10;
        floorLayoutJson.backdropColor = "gray";
        floorLayoutJson.backdropImage = {
            backdropImage: "",
            offsetX: 10,
            offsetY: 20
        }
        floorLayoutJson.locationArray = [];
        floorLayoutJson.deviceArray = [];

        const walk = async (nodes: ITreeNode[], parentNode?: ITreeNode) => {
            for (const node of nodes) {
                const nodeType = node.NodeType?.toLowerCase();
                // ---------------- LOCATION ----------------
                if (nodeType === "location" && node.Name) {
                    let locData: Record<string, any> | undefined = locationLayouts?.find(
                        item => item.EntID === node.NodeEntID
                    );
                    let x: number | undefined = Number(locData?.LeftPos);
                    let y: number | undefined = Number(locData?.TopPos);

                    if (x >= 0 && y >= 0) {
                        const id = FnGenerateUniqueId();
                        const loc = getObjectTemplate('location', id) as Location;
                        loc.name = node.Name;
                        loc.entId = node.NodeEntID ?? "";
                        loc.id = locData?.RecID ?? loc.id;
                        if (locData?.RecID) {
                            RecIDs.push(locData.RecID);
                        }
                        loc.entityName = node.NodeEntityname ?? "";
                        loc.w = locData?.Width ? Number(locData.Width) : loc.w;
                        loc.h = locData?.Length ? Number(locData.Length) : loc.h;
                        loc.border = {
                            bordercolor: locData?.BorderColor ?? loc.border?.bordercolor,
                            borderpx: Number(locData?.BorderWidth ?? loc.border?.borderpx ?? 0)
                        };
                        loc.x = x;
                        loc.y = y;
                        loc.parentId = parentNode?.NodeEntID ?? "";
                        if (
                            loc.x < 0 ||
                            loc.y < 0 ||
                            loc.x + loc.w > floorLayoutJson.w ||
                            loc.y + loc.h > floorLayoutJson.h
                        ) {
                            continue;
                        }
                        floorLayoutJson.locationArray?.push(loc);
                    }
                }
                // ---------------- FLOOR DEVICE or LOCATION DEVICE ----------------
                if (nodeType && node.Type?.toLowerCase() === "floordevice" && node.Name && parentNode) {
                    let devData: Record<string, any> | undefined = deviceLayouts?.find(
                        item => item.EntID === node.NodeEntID
                    );

                    let x: number | undefined = Number(devData?.LeftPos);
                    let y: number | undefined = Number(devData?.TopPos);

                    if (x >= 0 && y >= 0) {
                        const id = FnGenerateUniqueId();
                        const dev = getObjectTemplate('device', id) as Device;
                        dev.name = node.Name;
                        dev.entityName = node.NodeEntityname ?? "";
                        dev.entId = node.NodeEntID ?? "";
                        dev.deviceType = nodeType;
                        if (devData?.RecID)
                            RecIDs.push(devData?.RecID);
                        dev.id = devData?.RecID ?? dev.id;
                        dev.w = devData?.Width ? Number(devData.Width) : dev.w;
                        dev.h = devData?.Length ? Number(devData.Length) : dev.h;
                        dev.border = {
                            bordercolor: devData?.BorderColor ?? dev.border?.bordercolor,
                            borderpx: Number(devData?.BorderWidth ?? dev.border?.borderpx ?? 0)
                        };
                        dev.x = x;
                        dev.y = y;
                        dev.parentId = parentNode.NodeEntID ?? "";
                        if (parentNode.NodeType?.toLowerCase() === "location") {
                            dev.locationEntId = parentNode.NodeEntID ?? undefined;
                            dev.locationEntityName = parentNode.NodeEntityname ?? undefined;
                        }

                        let canPlotDevice = true;

                        if (parentNode.NodeType?.toLowerCase() === "floor") {
                            canPlotDevice =
                                dev.x >= 0 &&
                                dev.y >= 0 &&
                                dev.x + dev.w <= floorLayoutJson.w &&
                                dev.y + dev.h <= floorLayoutJson.h;
                        }
                        else if (parentNode.NodeType?.toLowerCase() === "location") {
                            const parentLocation = floorLayoutJson.locationArray?.find(
                                loc => loc.entId === parentNode.NodeEntID
                            );

                            canPlotDevice = !!parentLocation &&
                                dev.x >= 0 &&
                                dev.y >= 0 &&
                                dev.x + dev.w <= parentLocation.w &&
                                dev.y + dev.h <= parentLocation.h;
                        }

                        if (!canPlotDevice) {
                            continue;
                        }
                        // ---------- DEVICE UNDER FLOOR ----------
                        if (parentNode.NodeType?.toLowerCase() === "floor") {
                            floorLayoutJson.deviceArray?.push(dev);
                        }
                        // ---------- DEVICE UNDER LOCATION ----------
                        else if (parentNode.NodeType?.toLowerCase() === "location") {
                            const parentLocation = floorLayoutJson.locationArray?.find(
                                loc => loc.entId === parentNode.NodeEntID
                            );
                            if (parentLocation) {
                                parentLocation.deviceArray ??= [];
                                parentLocation.deviceArray.push(dev);
                            }
                        }
                    }
                }
                // Recurse children
                if (node.children?.length && (nodeType === "floor" || nodeType === "location")) {
                    await walk(node.children, node);
                }
            }
        };
        await walk([floorNode]);
        return { floorLayoutJson, RecIDs };
    } catch (error) {
        console.error("Error FnGenerateFloorLayoutConfig", error);
        return null;
    }
}

export { FnGenerateFloorLayoutConfig }
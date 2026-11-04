import { Device, Location, layoutConfig } from "@n20a/liblayout";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { EM } from "../../shared/interceptors/EndPoints";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { FnFindNodeAndParents } from "../../shared/allcommon/tablegrid/FnFindNodeAndParents";

interface IEntityIds {
    SiteID?: string;
    RoomID?: string;
    FloorID?: string;
    LocationID?: string;
    DeviceID?: string;
    _Site?: string;
    _Room?: string;
    _Floor?: string;
    _Location?: string;
}

const FnGetEntityIds = (
    treeData: ITreeNode[],
    entId: string
): IEntityIds => {
    const parentNodes = FnFindNodeAndParents(treeData, entId);
    if (!parentNodes?.length) {
        return {
            SiteID: undefined,
            RoomID: undefined,
            FloorID: undefined,
            LocationID: undefined,
            DeviceID: undefined,
            _Site: undefined,
            _Room: undefined,
            _Floor: undefined,
            _Location: undefined
        }
    }
    const result: IEntityIds = {};

    for (const node of parentNodes) {
        const nodeType = node.NodeType?.toLowerCase();
        const id = node.NodeEntID || node.EntID || node.key;
        const name = node.Name ?? (typeof node.title === "string" ? node.title : undefined);

        switch (nodeType) {
            case "site":
                result.SiteID = id;
                result._Site = name;
                break;

            case "room":
                result.RoomID = id;
                result._Room = name;
                break;

            case "floor":
                result.FloorID = id;
                result._Floor = name;
                break;

            case "location":
                result.LocationID = id;
                result._Location = name;
                break;

            default:
                result.DeviceID = id;
                break;
        }
    }

    return result;
};




const FnSaveFloorLayoutData = async (layoutJson: layoutConfig, statusBarContext: IStatusBar, cachedTreeData: ITreeNode[], recIDs?: string[]): Promise<boolean> => {
    try {
        const traverseLayout = (layoutData: layoutConfig) => {
            const devices: Device[] = [];
            const locations: Location[] = [];

            const traverse = (node: layoutConfig) => {

                // 1. Collect and clear devices at root
                if (node.deviceArray?.length) {
                    devices.push(...node.deviceArray);
                }

                // 2. Collect and clear locations
                if (node.locationArray?.length) {
                    for (const loc of node.locationArray) {

                        // collect location
                        locations.push(loc);

                        // collect and clear location-level devices
                        if (loc.deviceArray?.length) {
                            devices.push(...loc.deviceArray);
                        }
                    }

                }
            };

            traverse(layoutData);

            return {
                devices,
                locations,
                updatedLayout: layoutData
            };
        };


        const { devices, locations, updatedLayout } = traverseLayout(layoutJson);

        const deviceLayoutRecord: Record<string, any>[] = [];
        for (let index = 0; index < devices.length; index++) {
            const element = devices[index];
            let RecID: string | undefined = undefined;
            if (recIDs?.includes(element.id)) {
                RecID = element.id;
            }
            let parentNodes = null
            if (element.entId) {
                parentNodes = FnGetEntityIds(cachedTreeData, element.entId)
            }
            if (!parentNodes) {
                continue
            }
            deviceLayoutRecord.push({
                Width: element.w,
                Length: element.h,
                BorderWidth: element.border?.borderpx,
                DeviceLayoutConfig: element,
                BorderColor: element.border?.bordercolor,
                Style: element.border?.borderstyle,
                LeftPos: element.x,
                TopPos: element.y,
                EntID: element.entId,
                RecID: RecID,
                SiteID: parentNodes.SiteID,
                RoomID: parentNodes.RoomID,
                FloorID: parentNodes.FloorID,
                LocationID: parentNodes.LocationID,
                DeviceID: element.entId,
                EntityName: element.entityName,
                _Site: parentNodes._Site,
                _Room: parentNodes._Room,
                _Floor: parentNodes._Floor,
                _Location: parentNodes._Location
            })
        }
        const locationLayoutRecords: Record<string, any>[] = [];
        for (let index = 0; index < locations.length; index++) {
            const element = locations[index];
            let RecID: string | undefined = undefined;
            if (recIDs?.includes(element.id)) {
                RecID = element.id;
            }
            let parentNodes = null
            if (element.entId) {
                parentNodes = FnGetEntityIds(cachedTreeData, element.entId)
            }
            if (!parentNodes) {
                continue
            }
            locationLayoutRecords.push({
                Width: element.w,
                Length: element.h,
                BorderWidth: element.border?.borderpx,
                LocationLayoutConfig: element,
                BorderColor: element.border?.bordercolor,
                Style: element.border?.borderstyle,
                LeftPos: element.x,
                TopPos: element.y,
                EntID: element.entId,
                RecID: RecID,
                SiteID: parentNodes.SiteID,
                RoomID: parentNodes.RoomID,
                FloorID: parentNodes.FloorID,
                LocationID: element.entId,
                EntityName: element.entityName,
                _Site: parentNodes._Site,
                _Room: parentNodes._Room,
                _Floor: parentNodes._Floor,
                _Location: parentNodes._Location ?? element.name
            })
        }
        let parentNodes = null
        if (updatedLayout.entId) {
            parentNodes = FnGetEntityIds(cachedTreeData, updatedLayout.entId)
        }
        if (!parentNodes) {
            return false
        }
        const floorLayoutRecord: Record<string, any>[] = [
            {
                FloorLayoutConfig: updatedLayout,
                BackdropImage: updatedLayout.backdropImage?.backdropImage,
                BackdropImageOriginX: updatedLayout.backdropImage?.offsetX,
                BackdropImageOriginY: updatedLayout.backdropImage?.offsetY,
                xAxisLabels: updatedLayout.xAxisLabels,
                yAxisLabels: updatedLayout.yAxisLabels,
                Width: updatedLayout.w,
                Length: updatedLayout.h,
                Height: updatedLayout.h,
                Lock: updatedLayout.isLocked,
                EntID: updatedLayout.entId,
                EntityName: updatedLayout.entityName,
                SiteID: parentNodes.SiteID,
                RoomID: parentNodes.RoomID,
                FloorID: updatedLayout.entId,
                _Site: parentNodes._Site,
                _Room: parentNodes._Room,
                _Floor: parentNodes._Floor ?? updatedLayout.name,
                _Location: parentNodes._Location
            }
        ];


        const apiResult = await new Promise<boolean>((resolve) => {
            axiosInterceptor({
                url: EM.AddUpdateMultipleTableRecords,
                data: {
                    jsonString: JSON.stringify({
                        "PG.DeviceLayout": deviceLayoutRecord,
                        "PG.LocationLayout": locationLayoutRecords,
                        "PG.FloorLayout": floorLayoutRecord
                    })
                },
                allowShowLoader: true,
                setFetchData: (_resp: unknown, status?: string) => {
                    if (status === "200") {
                        resolve(true);   // SUCCESS
                    } else {
                        resolve(false);  // FAIL
                    }
                }
            }, statusBarContext);
        });
        return apiResult;
    } catch (error) {
        console.error("FnSaveFloorLayoutData error:", error);
        return false;
    }
}

export { FnSaveFloorLayoutData }

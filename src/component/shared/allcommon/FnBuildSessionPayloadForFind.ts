
import { ISession } from "../context/allinterface/ISession";

const FnBuildSessionPayloadForFind = (data: Record<string, any>[]): ISession[] => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const item = data[0]; // assuming single object (as in your example)

    const mappings: { key: string; variableName: string }[] = [
        { key: "_Site", variableName: "SiteName" },
        { key: "_Room", variableName: "RoomName" },
        { key: "_Floor", variableName: "FloorName" },
        { key: "_Location", variableName: "LocationName" },
        { key: "TenantName", variableName: "TenantName" },
        { key: "TagName", variableName: "TagName" },

        { key: "SiteID", variableName: "SiteID" },
        { key: "RoomID", variableName: "RoomID" },
        { key: "FloorID", variableName: "FloorID" },
        { key: "LocationID", variableName: "LocationID" },
        { key: "TenantID", variableName: "TenantID" },
        { key: "TagID", variableName: "TagID" }
    ];

    return mappings.map(({ key, variableName }) => ({
        VariableContext: ["TenantName", "TagName"].includes(key) ? "Filter" : "Location", // you can change if needed
        VariableName: variableName,
        SessionValue: item[key] ?? null
    }));
};

const FnBuildUrlForFind = (data: Record<string, any>[]): string => {
    if (!Array.isArray(data) || data.length === 0) return "";

    const item = data[0];

    const hierarchyParts = [
        item._Site && `Site:${item._Site}`,
        item._Room && `Room:${item._Room}`,
        item._Floor && `Floor:${item._Floor}`,
        item._Location && `Location:${item._Location}`,
        item.ParentDeviceName && `ParentDevice:${item.ParentDeviceName}`,
        item.ParentView && `ParentView:${item.ParentView}`,
        item.RUPosition && `RUPosition:${item.RUPosition}`,
        item._Device && `${item.EntityName ?? "_Device"}:${item._Device}`,
        item.EntID && `EntID:${item.EntID}`
    ].filter(Boolean);

    const hierarchyPath = hierarchyParts.join("/");

    const url =
        `&siteid=${encodeURIComponent(item.SiteID ?? "")}` +
        `&sitename=${encodeURIComponent(item._Site || "")}` +
        `&hierarchy=${encodeURIComponent(hierarchyPath)}`;

    return url;
};
interface IFindHierarchyItem {
    EntID: string;
    EntityName: string;
    ParentNameDeviceID: string | null;
}

const FnBuildUrlForFindHierarchy = (
    data: IFindHierarchyItem[],
    siteName: string
): string => {
    if (!Array.isArray(data) || data.length === 0) return "";

    // Get Site ID
    const siteId =
        data.find(x => x.EntityName.toLowerCase() === "site")?.EntID ?? "";

    // Build hierarchy in the same order as the array
    const hierarchyPath = data
        .map(item => {
            const entityName = item.EntityName;

            return `${entityName}:${item.EntID}`;
        })
        .join("/");

    return (
        `&siteid=${encodeURIComponent(siteId)}` +
        `&sitename=${encodeURIComponent(siteName)}` +
        `&hierarchy=${encodeURIComponent(hierarchyPath)}`
    );
};
export { FnBuildSessionPayloadForFind, FnBuildUrlForFind, FnBuildUrlForFindHierarchy }
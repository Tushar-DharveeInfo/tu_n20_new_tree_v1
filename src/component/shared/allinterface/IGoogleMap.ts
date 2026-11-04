
import { IStatusBar } from "../context/allinterface/IStatusBar";
import { ITreeNode } from "./tree/ITreeControl";

interface ISelectSite {
    SiteEntityName: string;
    SiteEntId: string;
    TenantEntityName?: string;
    TenantEntId?: string;
}

interface IAllTenantSiteRecord {
    SiteEntID?: string;
    SiteName?: string;
    SiteEntityName?: string;
    SiteAddress?: string;
    SiteGPS?: string;
    SiteDescription?: string;
    SiteStats?: string | Record<string, unknown>;
    SiteContact?: string | Record<string, unknown>;
    SiteDateFormat?: string;
}

interface IAllTenantTenantRecord {
    TenantEntID?: string;
    TenantName?: string;
    TenantEntityName?: string;
    TenantDescription?: string;
    TenantAddress?: string;
    TenantGPS?: string;
    TenantContact?: string | Record<string, unknown>;
}

interface IAllTenantRecords {
    AllSites?: IAllTenantSiteRecord[];
    AllTenants?: IAllTenantTenantRecord[];
    SitesVsTenants?: unknown[];
}

interface IDciNodeApiRow {
    EntID?: string;
    _DCI?: string;
    FromToFlag?: string;
    _Site?: string;
    _Room?: string;
    _Floor?: string;
    _Location?: string;
    _Device?: string;
    PortName?: string;
}

interface IDciPathSegmentApiRow {
    EntID?: string;
    _DCI?: string;
    Name?: string;
    Desc250?: string;
    CableType?: string;
    CableWidth?: string;
    CableColor?: string;
    SegmentAttribute?: string;
    SegmentDeployment?: string;
    SegmentGPSWayPoints?: string;
}

interface IDciWaypointApiItem {
    Waypoint?: string;
}

interface IDciVsSegmentGPSWayPoints {
    key: string;
    _DCI: string;
    Name: string;
    Desc250: string;
    CableType?: string;
    CableWidth?: string;
    CableColor?: string;
    SegmentAttribute?: string;
    SegmentDeployment?: string;
    SegmentGPSWayPoints: {
        lat: number;
        lng: number;
    }[];
}

interface IGoogleMap {
    selectedNodeInfo: ITreeNode; //select node of tree 
    isSiteByTenant: "AllSites" | "TenantsBySite" | "SitesByTenant"; // it will be used for tenant or site
    selectDcExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string, dateFormat?: string) => void;
    statusBarContext: IStatusBar
    onRendered?: () => void
    handleShowUserMessage?: (messageText: string) => void;
}
interface IServerEnvItem {
    key: string;
    value: string;
}

export type {
    IGoogleMap,
    ISelectSite,
    IAllTenantRecords,
    IAllTenantSiteRecord,
    IAllTenantTenantRecord,
    IDciNodeApiRow,
    IDciPathSegmentApiRow,
    IDciWaypointApiItem,
    IDciVsSegmentGPSWayPoints,
    IServerEnvItem
}
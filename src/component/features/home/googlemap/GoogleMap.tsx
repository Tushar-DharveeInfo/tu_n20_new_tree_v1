
import { useEffect, useRef, useState } from "react";
import { FnProcessStringToCompare } from "../../../shared/allcommon/basic/FnProcessStringToCompare";
import {
    IAllTenantRecords,
    IAllTenantSiteRecord,
    IAllTenantTenantRecord,
    IDciNodeApiRow,
    IDciPathSegmentApiRow,
    IDciVsSegmentGPSWayPoints,
    IDciWaypointApiItem,
    IGoogleMap,
    ISelectSite,
    IServerEnvItem
} from "../../../shared/allinterface/IGoogleMap";
import '@n20a/libgmap/index.css';
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";
import { geocode, IDci, IMapProfile, initializeGoogleMapsService, isGoogleMapsServiceInitialized, IStats, SiteConnectivity, SiteVsTenants } from '@n20a/libgmap'
import {
    IPoiMarkerItem, ISiteConnectivityProps, ISiteVsTenantsProps
} from '@n20a/libgmap'
import { axiosInterceptor, axiosInterceptorForPostResponse } from "../../../shared/interceptors/Interceptor";
import { EM, EXPAPI } from "../../../shared/interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../../shared/allcommon/basic/FnHandleAPIResponse";
import { handleContainerKeyDown } from "../../../shared/allcommon/basic/FnHandleContainerKeyDown";
import { createRoot } from "react-dom/client";
import { useExplorerTreeContext } from "../../../shared/context/hooks/ExplorerTreeHooks";
import { ExplorerTreeProvider, getDateFormat } from "../../../shared/context/contextandprovider/ExplorerTree";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnGetExpApiUrlBasedOnEndPoint } from "../../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint";
import { GeneratePdf } from "../../../shared/generatepdf/GeneratePdf";
import { TReportLayoutJson } from "../../../shared/allinterface/IGeneratePdf";

function getDatasetTableRows<T>(response: unknown, tableName: string): T[] {
    if (!response) return [];
    const parsedEntity = FnHandleAPIResponse(response, "Dataset") as Record<string, unknown> | null | undefined;
    const rows = parsedEntity?.[tableName];
    return Array.isArray(rows) ? rows as T[] : [];
}

function toMapTreeNodeFromSite(site: IAllTenantSiteRecord): ITreeNode {
    const name = site.SiteName ?? null;
    const nodeEntId = site.SiteEntID ?? null;
    return {
        key: nodeEntId ?? name ?? "",
        NodeEntID: nodeEntId,
        Name: name,
        NodeEntityname: site.SiteEntityName ?? null,
        NodeType: "Site",
        Description: site.SiteDescription ?? null,
        Address: site.SiteAddress,
        GPS: site.SiteGPS,
        Stats: site.SiteStats,
        Contact: site.SiteContact,
        stepNo: 0,
        parentEntID: null,
        NodeState: null,
        title: name ?? "",
        children: [],
        treetype: "Site",
        Type: null,
        icon: null,
        HasChildren: 0,
    };
}

function toMapTreeNodeFromTenant(tenant: IAllTenantTenantRecord): ITreeNode {
    const name = tenant.TenantName ?? null;
    const nodeEntId = tenant.TenantEntID ?? null;
    return {
        key: nodeEntId ?? name ?? "",
        NodeEntID: nodeEntId,
        Name: name,
        NodeEntityname: tenant.TenantEntityName ?? null,
        NodeType: "Tenant",
        Description: tenant.TenantDescription ?? null,
        Address: tenant.TenantAddress,
        GPS: tenant.TenantGPS,
        Contact: tenant.TenantContact,
        stepNo: 0,
        parentEntID: null,
        NodeState: null,
        title: name ?? "",
        children: [],
        treetype: "Tenant",
        Type: null,
        icon: null,
        HasChildren: 0,
    };
}

function GoogleMap(googleMapProps: IGoogleMap) {
    const [siteConnectivity, setSiteConnectivity] = useState<ISiteConnectivityProps>();
    const [siteVsTenant, setSiteVsTenant] = useState<ISiteVsTenantsProps>();
    const [isMapProfileFound, setIsMapProfileFound] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);
    const explorerTreeContext = useExplorerTreeContext();
    const mapProfileRef = useRef<IMapProfile>(undefined);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const isMountedRef = useRef(true);

    const prefixString = "GOOGLEMAP__";

    // Build and update map data whenever the selected node or map configuration changes.
    useEffect(() => {
        let cancelled = false;
        const { selectedNodeInfo, isSiteByTenant } = googleMapProps;
        if (!selectedNodeInfo || !isMapProfileFound || !mapProfileRef.current) return;
        const createMapData = async () => {
            if (cancelled) return;
            setIsProcessing(true);
            setIsCompleted(false);
            try {
                const mapStats = (stats: unknown): IStats => {
                    if (!stats || typeof stats !== "object") {
                        return {};
                    }

                    const data = stats as Record<string, unknown>;

                    return {
                        alerts: Number(data.StatsAlert ?? 0),
                        racks: Number(data.StatsRack ?? 0),
                        server: Number(data.StatsServer ?? 0),
                        power:
                            data.StatsPDU !== undefined
                                ? String(data.StatsPDU)
                                : undefined
                    };
                };
                let parentNodeList: ITreeNode[] = [];
                const nodeType = selectedNodeInfo.NodeType ?? "";

                const isAllDC = FnProcessStringToCompare(nodeType, "AllDataCenters");
                const isSite = FnProcessStringToCompare(nodeType, "Site");
                const isTenant = FnProcessStringToCompare(nodeType, "Tenant");

                let componentToShow: "siteconnectivity" | "sitevstenant" | undefined;
                let isSingleNode = false;
                let commonEntID: string | null = null;
                let commonEntityName: string | null = null;

                if (isAllDC) {
                    const allTenantRecords = explorerTreeContext.allTenantRecords as IAllTenantRecords;
                    if (!allTenantRecords) return;

                    if (isSiteByTenant === "AllSites" || isSiteByTenant === "SitesByTenant") {
                        parentNodeList = (allTenantRecords.AllSites || []).map(toMapTreeNodeFromSite);
                        componentToShow = "siteconnectivity";
                    }

                    else if (isSiteByTenant === "TenantsBySite") {
                        parentNodeList = (allTenantRecords.AllTenants || []).map(toMapTreeNodeFromTenant);
                        componentToShow = "siteconnectivity"; // same map type
                    }
                } else if (isSite) {
                    if (isSiteByTenant === "AllSites") {
                        parentNodeList = [selectedNodeInfo];
                        componentToShow = "siteconnectivity";
                        isSingleNode = true;
                    }
                    else if (isSiteByTenant === "SitesByTenant") {
                        parentNodeList = [selectedNodeInfo];
                        componentToShow = "siteconnectivity";
                        isSingleNode = true;
                    } else {
                        parentNodeList = [selectedNodeInfo, ...(selectedNodeInfo.children ?? [])];
                        componentToShow = "sitevstenant";
                        commonEntID = selectedNodeInfo.NodeEntID ?? null;
                        commonEntityName = selectedNodeInfo.NodeEntityname ?? null;
                    }
                } else if (isTenant) {
                    if (isSiteByTenant === "SitesByTenant") {
                        parentNodeList = [selectedNodeInfo, ...(selectedNodeInfo.children ?? [])];
                        componentToShow = "sitevstenant";
                        commonEntID = selectedNodeInfo.NodeEntID ?? null;
                        commonEntityName = selectedNodeInfo.NodeEntityname ?? null;
                    } else {
                        parentNodeList = [selectedNodeInfo];
                        isSingleNode = true;
                        componentToShow = "siteconnectivity";
                    }
                }
                if (parentNodeList.length > 0 && mapProfileRef.current) {
                    const rowLocations: IPoiMarkerItem[] = [];
                    for (let index = 0; index < parentNodeList.length; index++) {
                        const element = parentNodeList[index];
                        if (!element.GPS) {
                            try {
                                if (!element.GPS && element.Address) {
                                    element.GPS = await geocode(element.Address);
                                }
                            }
                            catch (error) {
                                console.error("Geocode failed", error);
                            }
                        }
                        const rawStats =
                            element.Stats && typeof element.Stats === "string"
                                ? FnParseJsonSafely(element.Stats)
                                : element.Stats;

                        const mappedStats = mapStats(rawStats)
                        if (element.NodeEntID && (element.GPS || element.Address)) {
                            const entID = element.NodeEntID.includes("##")
                                ? element.NodeEntID.split("##")[0]
                                : element.NodeEntID;

                            const nodeTypeLower = element.NodeType?.toLowerCase();
                            const contactData =
                                typeof element.Contact === "string"
                                    ? FnParseJsonSafely(element.Contact)
                                    : element.Contact;

                            const contact =
                                contactData &&
                                    typeof contactData === "object"
                                    ? contactData as Record<string, unknown>
                                    : undefined;
                            const location =
                                typeof element.GPS === "string"
                                    ? FnParseJsonSafely(element.GPS)
                                    : element.GPS;

                            if (
                                !location ||
                                typeof location !== "object"
                            ) {
                                continue;
                            }
                            const row: IPoiMarkerItem = {
                                key: element.Name ?? "",
                                location: location,
                                name: element.Name ?? "",
                                SiteEntId: nodeTypeLower === "site" ? entID ?? "" : "",
                                SiteEntityName:
                                    nodeTypeLower === "site"
                                        ? element.NodeEntityname ?? "Site"
                                        : "",
                                address: element.Address ?? "",
                                contact: contact
                                    ? {
                                        name: String(contact.Name ?? ""),
                                        email: String(contact.Email ?? ""),
                                        phone: String(contact.Phone ?? "")
                                    }
                                    : undefined
                                ,
                                alertStatus: 0,
                                desc: element.Description ?? "",
                                selected: false,
                                updated: false,
                                stats: mappedStats,
                                TenantEntId: nodeTypeLower === "tenant" ? entID ?? "" : "",
                                TenantEntityName:
                                    nodeTypeLower === "tenant"
                                        ? element.NodeEntityname ?? "Tenant"
                                        : "",
                            };

                            // assign common entity if applicable
                            if (componentToShow === "sitevstenant" && index !== 0 && commonEntID && commonEntityName) {
                                if (isSiteByTenant === "SitesByTenant") {
                                    row.TenantEntId = commonEntID;
                                    row.TenantEntityName = commonEntityName;
                                } else {
                                    row.SiteEntId = commonEntID;
                                    row.SiteEntityName = commonEntityName;
                                }
                            }

                            rowLocations.push(row);
                        }
                    }
                    mapProfileRef.current.topology = !isSingleNode;

                    if (!rowLocations.length) {
                        googleMapProps.handleShowUserMessage?.(`Map data not found for ${selectedNodeInfo.Name ?? "selected node"}`)
                        setSiteConnectivity(undefined);
                        setSiteVsTenant(undefined);
                        return
                    }
                    if (componentToShow === "siteconnectivity") {
                        const dciNodes: IDci[] = [];

                        if (isSiteByTenant === "AllSites") {

                            const results = await Promise.allSettled([

                                new Promise<unknown>((resolve) => {
                                    axiosInterceptor({
                                        url: EM.GetEntityRecords,
                                        data: {
                                            entityName: "DCI",
                                            entIDs: "",
                                            tableName: "PG.DCINode",
                                        },
                                        setFetchData: (resp: unknown, status?: string) => {
                                            if (status === "200") {
                                                resolve(resp);
                                            } else {
                                                resolve(undefined);
                                            }
                                        }
                                    }, googleMapProps.statusBarContext);
                                }),

                                new Promise<unknown>((resolve) => {
                                    axiosInterceptor({
                                        url: EM.GetEntityRecords,
                                        data: {
                                            entityName: "DCI",
                                            entIDs: "",
                                            tableName: "PG.DCIPathSegment",
                                        },
                                        setFetchData: (resp: unknown, status?: string) => {
                                            if (status === "200") {
                                                resolve(resp);
                                            } else {
                                                resolve(undefined);
                                            }
                                        }
                                    }, googleMapProps.statusBarContext);
                                })
                            ]);

                            // DCI NODE parsing
                            const formattedDciNodes: IDci[] = [];
                            let formattedPathSegments: IDciVsSegmentGPSWayPoints[] = [];

                            const dciNodeResponse =
                                results[0].status === "fulfilled"
                                    ? results[0].value
                                    : undefined;

                            const dciPathResponse =
                                results[1].status === "fulfilled"
                                    ? results[1].value
                                    : undefined;
                            // Prepare DCI Nodes
                            if (dciNodeResponse) {
                                const dciNodeData = getDatasetTableRows<IDciNodeApiRow>(
                                    dciNodeResponse,
                                    "PG.DCINode"
                                );

                                formattedDciNodes.push(
                                    ...dciNodeData.map((element): IDci => ({
                                        key: element.EntID ?? "",
                                        DCI: element._DCI ?? "",
                                        FromToFlag: `${element.FromToFlag}Site`,
                                        Site: element._Site ?? "",
                                        Room: element._Room ?? "",
                                        Floor: element._Floor ?? "",
                                        Location: element._Location ?? "",
                                        Device: element._Device ?? "",
                                        PortName: element.PortName ?? ""
                                    }))
                                );
                            }

                            // Prepare Path Segments
                            if (dciPathResponse) {
                                const dciPathSegments = getDatasetTableRows<IDciPathSegmentApiRow>(
                                    dciPathResponse,
                                    "PG.DCIPathSegment"
                                );

                                formattedPathSegments = dciPathSegments.map((segment) => {
                                    let formattedWayPoints: { lat: number; lng: number }[] = [];

                                    try {
                                        const parsedWaypoints = FnParseJsonSafely(
                                            segment?.SegmentGPSWayPoints ?? "[]"
                                        );

                                        if (Array.isArray(parsedWaypoints)) {
                                            formattedWayPoints = parsedWaypoints
                                                .map((item: IDciWaypointApiItem) => {
                                                    const waypoint =
                                                        typeof item?.Waypoint === "string"
                                                            ? item.Waypoint.trim()
                                                            : "";
                                                    const [lat, lng] =
                                                        waypoint.split(/\s+/).map(Number);

                                                    if (
                                                        Number.isNaN(lat) ||
                                                        Number.isNaN(lng)
                                                    ) {
                                                        return null;
                                                    }

                                                    return { lat, lng };
                                                })
                                                .filter(
                                                    (
                                                        point
                                                    ): point is { lat: number; lng: number } =>
                                                        point !== null
                                                );
                                        }
                                    } catch (error) {
                                        console.error(
                                            "Error parsing SegmentGPSWayPoints",
                                            error,
                                            segment?.SegmentGPSWayPoints
                                        );
                                    }

                                    return {
                                        key: segment?.EntID ?? crypto.randomUUID(),
                                        _DCI: segment?._DCI ?? "",
                                        Name: segment?.Name ?? "",
                                        Desc250: segment?.Desc250 ?? "",
                                        CableType: segment?.CableType,
                                        CableWidth: segment?.CableWidth,
                                        CableColor: segment?.CableColor,
                                        SegmentAttribute: segment?.SegmentAttribute,
                                        SegmentDeployment: segment?.SegmentDeployment,
                                        SegmentGPSWayPoints: formattedWayPoints
                                    };
                                });
                            }

                            // Wait until both arrays are ready
                            if (!isMountedRef.current) return;

                            setSiteConnectivity({
                                rawmapprofile: mapProfileRef.current,
                                DciArray: formattedDciNodes,
                                DciVsSegmentGPSWayPoints: formattedPathSegments,
                                rawlocations: rowLocations,
                                showTipsPanel: true,
                            });
                            setSiteVsTenant(undefined);

                        }
                        else {

                            if (!isMountedRef.current) return;
                            setSiteConnectivity({
                                rawmapprofile: mapProfileRef.current,
                                DciArray: dciNodes,
                                rawlocations: rowLocations,
                                showTipsPanel: true,
                            });
                            setSiteVsTenant(undefined);
                        }
                    } else if (componentToShow === "sitevstenant") {
                        if (!isMountedRef.current) return;
                        setSiteVsTenant({
                            rawmapprofile: mapProfileRef.current,
                            rawlocations: rowLocations,
                            showTipsPanel: true,
                            sitevstenant: isSiteByTenant === "SitesByTenant" ? false : true
                        });
                        setSiteConnectivity(undefined);
                    }
                }
                else {
                    setSiteConnectivity(undefined);
                    setSiteVsTenant(undefined);
                }
            } catch (error) {
                console.error('error :', error);
            }
            finally {
                if (!isMountedRef.current || cancelled) return;
                setIsProcessing(false);
                setIsCompleted(true);
            }
        }
        createMapData();
        return () => {
            cancelled = true;
        };
    }, [googleMapProps.selectedNodeInfo, googleMapProps.isSiteByTenant, isMapProfileFound]);

    // Notify the explorer to navigate to the selected site or tenant.
    function handleOnSelectSite(selectedSite: ISelectSite): void {

        if (
            googleMapProps.selectDcExplorer &&
            (selectedSite.SiteEntId || selectedSite.TenantEntId)
        ) {
            let dateFormat: string | undefined;
            if (selectedSite.SiteEntId) {
                const allSites: IAllTenantSiteRecord[] = (explorerTreeContext.allTenantRecords as IAllTenantRecords)?.AllSites || [];
                const matchedSite = allSites.find(
                    (item) => item.SiteEntID === selectedSite.SiteEntId || item.SiteName === selectedSite.SiteEntId
                );
                if (matchedSite) {
                    const siteMeasurement = (matchedSite as Record<string, unknown>).Measurement || (matchedSite as Record<string, unknown>).measurement;
                    dateFormat = matchedSite.SiteDateFormat || (matchedSite as Record<string, unknown>).DateFormat as string || (
                        siteMeasurement && FnProcessStringToCompare(String(siteMeasurement), "europe")
                            ? "dd/MM/yyyy"
                            : siteMeasurement
                                ? "MM/dd/yyyy"
                                : getDateFormat()
                    );
                } else {
                    dateFormat = getDateFormat();
                }
            }

            googleMapProps.selectDcExplorer(
                selectedSite.SiteEntId,
                selectedSite.TenantEntId,
                selectedSite.SiteEntityName,
                selectedSite.SiteEntId,
                dateFormat
            );
        }
    }

    // Track component mount status and load the Google Maps profile/API configuration.
    useEffect(() => {
        isMountedRef.current = true;

        axiosInterceptorForPostResponse(
            FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv),
            {
                prefixString: prefixString,
            }
        )
            .then(async (apiResponse: unknown) => {
                if (
                    apiResponse &&
                    typeof apiResponse === "object" &&
                    "response" in apiResponse
                ) {
                    const payload = apiResponse.response;

                    if (
                        payload &&
                        typeof payload === "object" &&
                        "success" in payload &&
                        payload.success &&
                        "data" in payload &&
                        typeof payload.data === "object" &&
                        payload.data
                    ) {
                        const mapData = (
                            payload.data as IServerEnvItem[]
                        ).reduce<Record<string, string>>((acc, item) => {
                            acc[item.key] = item.value;
                            return acc;
                        }, {});

                        if (!mapData) {
                            mapProfileRef.current = undefined;

                            if (isMountedRef.current) {
                                setIsMapProfileFound(false);
                                setIsProcessing(false);
                                setIsCompleted(true);
                            }

                            return;
                        }

                        mapProfileRef.current = {
                            fallbackid: mapData["GOOGLEMAP__FALLBACK_ID"],
                            fallback: mapData["GOOGLEMAP__FALLBACK"],
                            apiKey: mapData["GOOGLEMAP__API_KEY"],
                            mapid: mapData["GOOGLEMAP__MAP_ID"],
                            center: {
                                lat: 40.7128,
                                lng: -74.006,
                            },
                            topology: false,
                            zoom: 4,
                        };

                        if (
                            !isGoogleMapsServiceInitialized() &&
                            mapData["GOOGLEMAP__API_KEY"]
                        ) {
                            try {
                                await initializeGoogleMapsService(
                                    mapData["GOOGLEMAP__API_KEY"]
                                );
                            } catch (error) {
                                console.error(error);

                                mapProfileRef.current = undefined;

                                if (isMountedRef.current) {
                                    setIsMapProfileFound(false);
                                    setIsProcessing(false);
                                    setIsCompleted(true);
                                }

                                return;
                            }
                        }

                        if (isMountedRef.current) {
                            setIsMapProfileFound(true);
                        }
                    } else {
                        mapProfileRef.current = undefined;

                        if (isMountedRef.current) {
                            setIsMapProfileFound(false);
                            setIsProcessing(false);
                            setIsCompleted(true);
                        }
                    }
                } else {
                    mapProfileRef.current = undefined;

                    if (isMountedRef.current) {
                        setIsMapProfileFound(false);
                        setIsProcessing(false);
                        setIsCompleted(true);
                    }
                }
            })
            .catch((error) => {
                console.error(error);

                mapProfileRef.current = undefined;

                if (isMountedRef.current) {
                    setIsMapProfileFound(false);
                    setIsProcessing(false);
                    setIsCompleted(true);
                }
            });

        return () => {
            isMountedRef.current = false;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Trigger the rendered callback after the map finishes (or empty state is ready).
    useEffect(() => {
        if (!isCompleted || isProcessing) {
            return;
        }

        if (mapContainerRef.current) {
            mapContainerRef.current.getBoundingClientRect();
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Allow extra time for Google Maps tiles when map data is present.
        const delay = (siteConnectivity || siteVsTenant) ? 5000 : 500;
        timeoutRef.current = setTimeout(() => {
            googleMapProps.onRendered?.();
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isCompleted, isProcessing, siteConnectivity, siteVsTenant])


    // Render the map container and display loading, map, or empty states as appropriate.
    return (
        <div
            ref={mapContainerRef}
            className="nz-home-map-iframe"
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
        >
            {/* Display a loading message while map data is being processed. */}
            {isProcessing && (
                <div className="nz-wh-100 nz-d-flex-hv-left">
                    Loading map data…
                </div>
            )}

            {/* Render the site connectivity map when connectivity data is available. */}
            {!isProcessing && siteConnectivity && (
                <SiteConnectivity
                    {...siteConnectivity}
                    onSelectSite={handleOnSelectSite}
                />
            )}

            {/* Render the site vs tenant topology map when relationship data is available. */}
            {!isProcessing && siteVsTenant && (
                <SiteVsTenants
                    {...siteVsTenant}
                    onSelectSite={handleOnSelectSite}
                />
            )}

            {/* Display a fallback message when no map data is available. */}
            {!isProcessing &&
                isCompleted &&
                !siteConnectivity &&
                !siteVsTenant && (
                    <div className="nz-wh-100 nz-d-flex-hv-left">
                        No map data available for the selected node.
                    </div>
                )}

            {isReportDialogOpen && (
                <GeneratePdf
                    uniqueName="googlemap-report"
                    isOpen={isReportDialogOpen}
                    reportJson={reportTemplateJson}
                    title="Google Map Report"
                    selectedNode={googleMapProps.selectedNodeInfo}
                    onClose={() => {
                        setIsReportDialogOpen(false);
                        setReportTemplateJson(null);
                    }}
                />
            )}
        </div>
    );

}

// Create and manage a standalone React root for the Google Map component.
function RenderGoogleMapContainer(container: HTMLElement, googleMapProps: IGoogleMap) {
    const root = createRoot(container);
    // Offscreen createRoot is outside the app tree — must provide ExplorerTreeContext
    // or useExplorerTreeContext() throws and .nz-home-map-iframe never mounts.
    root.render(
        <ExplorerTreeProvider>
            <GoogleMap {...googleMapProps} />
        </ExplorerTreeProvider>
    );

    // Clean up the React root when the map container is disposed.
    return {
        unmount: () => root.unmount()
    };
}

export { GoogleMap, RenderGoogleMapContainer };

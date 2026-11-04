
import { useCallback, useEffect, useRef, useState } from "react"
import { Splitter, SplitterPanel } from "primereact/splitter"
import '../../allcss/techrefresh/EditDeviceReplacement.css'
import { ICreateReplacementContainer, IPortDataItem, IPropertyDefinition } from "../../allinterface/techrefresh/IEditDeviceReplacement"
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor"
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks"
import { ALERT, CABLING, DEVICE, EM } from "../../../shared/interceptors/EndPoints"
import { FnHandleAPIResponse } from "../../../shared/allcommon/basic/FnHandleAPIResponse"
import { ColDef } from "ag-grid-community"
import { DevicePortGrid } from "./DevicePortGrid"
import { getDiagnosticLevelData } from "../../../shared/context/contextandprovider/CommonVariable"
import { hideGridData } from "../../../shared/alldefaultprops/tablegrid/DefaultPropsBasicGrid"
import { Label } from "../../../shared/basic/label/Label"
import { DELIMITER } from "../../../shared/alldefaultprops/basic/DefaultPropsChekedListBoxControl"
import { BasicGrid } from "../../../shared/tablegrid/BasicGrid"
import { IPlacementDevice } from "../../../shared/allinterface/plan/IEditFloorLayout"
import { ValueRenderer } from "./ValueRenderer"
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks"
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl"
import { DcTreeContainer } from "./DcTreeContainer"
import { FnCallApiForUpdateDeviceWoProfile, FnCreateWorkOrderApiCalls, FnFindMessageAndReplaceVariables, FnGetWorkOrderProfile, callAPIForGetWorkorderName } from "../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls"
import { OverlayTab } from "../../../shared/basic/overlaytab/OverlayTab"
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable"
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage"
import { OpenSidebar24x24 } from "@n20a/libicon"
import { FEnums } from "../../../constants/Feature"
import { IBasicGridColDef } from "../../../shared/allinterface/tablegrid/IBasicGrid"
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely"


type GridValue = string | number | boolean | null | undefined;
type BasicPropItem = { Name: string; Value: GridValue; PropertyLabel: string };
type UnknownRecord = Record<string, unknown>;
type ParsedWorkorderItem = {
    ItemJson?: string | UnknownRecord;
    _WorkorderProfile?: string;
    _workorderProfile?: string;
};

const CreateReplacementContainer = (editDeviceReplacementProps: ICreateReplacementContainer) => {
    const [columnDefsPowerPort, setColumnDefsPowerPort] = useState<ColDef[]>();
    const [columnDefsNetworkPort, setColumnDefsNetworkPort] = useState<ColDef[]>();
    const [leftDeviceBasicProps, setLeftDeviceBasicProps] = useState<BasicPropItem[]>([]);
    const [leftPowerPortData, setLeftPowerPortData] = useState<IPortDataItem[]>([]);
    const [leftNetworkPortData, setLeftNetworkPortData] = useState<IPortDataItem[]>([]);
    const [rightDeviceBasicProps, setRightDeviceBasicProps] = useState<BasicPropItem[]>([]);

    const [leftDevicePath, setLeftDevicePath] = useState<string>();
    const [isTransferPortLabel, setIsTransferPortLabel] = useState<boolean>(false);

    const [rightPowerPortData, setRightPowerPortData] = useState<IPortDataItem[]>([]);
    const [rightNetworkPortData, setRightNetworkPortData] = useState<IPortDataItem[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<IPlacementDevice>();
    const [rightDevicePath, setRightDevicePath] = useState<string>();
    const [defaultSelectedNode, setDefaultSelectedNode] = useState<ITreeNode>();
    const [targetTreeEqid, setTargetTreeEqid] = useState<string>("");
    const [isWorkorderDeviceMatched, setIsWorkorderDeviceMatched] = useState<boolean>(false);
    const [createdReplaceWoid, setCreatedReplaceWoid] = useState<string>("");
    const [hasReplacementProfile, setHasReplacementProfile] = useState<boolean | undefined>(undefined);
    const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
    const [isTargetEqidLoading, setIsTargetEqidLoading] = useState<boolean>(false);
    const [treeRefreshKey, setTreeRefreshKey] = useState<number>(0);
    const sessionContext = useSessionContext();
    const statusbarContext = useStatusBarContext();

    const rightDeviceBasicPropsRef = useRef<BasicPropItem[]>([]);
    rightDeviceBasicPropsRef.current = rightDeviceBasicProps;
    const workorderCacheRef = useRef<Map<string, { profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }>>(new Map());
    const workorderInFlightRef = useRef<Map<string, Promise<{ profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }>>>(new Map());
    const activeWorkorderNodeEntIdRef = useRef<string>("");
    const activeWorkorderWoidRef = useRef<string>("");
    const prevTargetNodeEntIdRef = useRef<string>("");
    const prevTargetTemplateWoidRef = useRef<string>("");
    const columnDefsForDeviceProps: IBasicGridColDef[] = [
        { field: "id", hide: true },

        {
            field: "PropertyLabel",
            headerName: "Name",
            cellClass: "nz-name-cell nz-read-only-property-cell",
            suppressMovable: true,
            resizable: true,
            editable: false

        },

        {
            field: "Value",
            headerName: "Value",
            flex: 1,
            cellDataType: "text",
            resizable: false,
            cellClass: "text-control-cellvalue-cell nz-read-only-property-cell",
            suppressMovable: true,
            minWidth: 100,
            editable: false,
            cellRendererSelector: () => ({
                component: ValueRenderer,
            }),
        },
    ];


    const restoredMappingTokenRef = useRef<string>("");
    const restoreInProgressRef = useRef<boolean>(false);
    const prevSelectedNodeEntIdRef = useRef<string | undefined>(undefined);

    interface IMatchedProfileInfo {
        woid: string;
        desc250: string;
        entId: string;
        profileRecord: UnknownRecord;
    }

    const [matchedProfileInfo, setMatchedProfileInfo] = useState<IMatchedProfileInfo | null>(null);
    const alertProfilesCacheRef = useRef<UnknownRecord[] | null>(null);

    useEffect(() => {
        return () => {
            restoredMappingTokenRef.current = "";
            restoreInProgressRef.current = false;
        }
    }, [])

    const normalize = (value: unknown) =>
        value?.toString().toLowerCase().replace(/[^a-z0-9#]+/g, "").trim() ?? "";

    const normalizeWoidValue = (value: unknown): string => {
        const woid = String(value ?? "").trim();
        if (!woid || woid.toLowerCase() === "null" || woid.toLowerCase() === "undefined") {
            return "";
        }
        return woid;
    };

    /** Device replacement workorder id (WOID on explorer node). */
    const getExplorerDeviceWoid = useCallback((): string => {
        const node = editDeviceReplacementProps.selectedNodeExplorer as any;
        let woid = normalizeWoidValue(node?.WOID ?? node?.woid);
        if (!woid) {
            woid = normalizeWoidValue(
                rightDeviceBasicPropsRef.current.find((item) => item.Name?.toLowerCase() === "woid")?.Value
            );
        }
        return woid;
    }, [
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.WOID,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.woid,
    ]);

    /** Replacement template workorder id only (ReplacementTemplateWOID). */
    const getReplacementTemplateWoidOnly = useCallback((): string => {
        const node = editDeviceReplacementProps.selectedNodeExplorer as any;
        let woid = normalizeWoidValue(
            node?.ReplacementTemplateWOID ??
            node?.ReplacementTemplate
        );
        if (!woid) {
            woid = normalizeWoidValue(
                rightDeviceBasicPropsRef.current.find(
                    (item: BasicPropItem) =>
                        item.Name?.toLowerCase() === "replacementtemplatewoid" ||
                        item.Name?.toLowerCase() === "replacementtemplate" ||
                        item.Name?.toLowerCase() === "replacementprofile"
                )?.Value
            );
        }
        return woid;
    }, [
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        editDeviceReplacementProps.selectedNodeExplorer?.ReplacementTemplateWOID
    ]);

    const getWorkorderDetailsWoid = useCallback((): string => {
        return getExplorerDeviceWoid() || getReplacementTemplateWoidOnly();
    }, [getExplorerDeviceWoid, getReplacementTemplateWoidOnly]);

    const templateProfileTargetEqidRef = useRef<string>("");

    const fetchWorkorderDetails = useCallback(
        async (
            woid: string,
            forceFresh: boolean = false
        ): Promise<{ profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }> => {
            const trimmed = (woid || "").trim();
            if (!trimmed) {
                return { profiles: [], items: [] };
            }
            const cacheKey = trimmed.toLowerCase();

            if (workorderInFlightRef.current.has(cacheKey)) {
                return workorderInFlightRef.current.get(cacheKey)!;
            }

            const currentNodeEntId = (editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? "").toString().trim();

            const isNodeChanged = activeWorkorderNodeEntIdRef.current !== currentNodeEntId;
            const isWoidChanged = activeWorkorderWoidRef.current !== cacheKey;

            if (forceFresh || isNodeChanged || isWoidChanged) {
                activeWorkorderNodeEntIdRef.current = currentNodeEntId;
                activeWorkorderWoidRef.current = cacheKey;
                workorderCacheRef.current.delete(cacheKey);
            } else if (workorderCacheRef.current.has(cacheKey)) {
                return workorderCacheRef.current.get(cacheKey)!;
            }

            const fetchPromise = new Promise<{ profiles: UnknownRecord[]; items: ParsedWorkorderItem[] }>((resolve) => {
                axiosInterceptor({
                    url: DEVICE.WorkorderDetails,
                    data: { woid: trimmed },
                    setFetchData: (resp: unknown, status?: string) => {
                        if (status !== "200" || !resp || typeof resp !== "object") {
                            resolve({ profiles: [], items: [] });
                            return;
                        }

                        try {
                            const responseData = resp as Record<string, unknown>;
                            const deviceJsonValue = responseData.deviceJson ?? responseData.devicesJson;
                            const deviceJson = typeof deviceJsonValue === "string" ? JSON.parse(deviceJsonValue) : (deviceJsonValue ?? responseData);
                            const detailsData = typeof (deviceJson as any)?.Data === "string" ? JSON.parse((deviceJson as any).Data) : ((deviceJson as any)?.Data ?? (responseData as any)?.Data ?? deviceJson);

                            let profileRows: UnknownRecord[] = [];
                            const candidateProfiles =
                                (detailsData as any)?._WorkorderProfile ??
                                (detailsData as any)?.WorkorderProfile ??
                                (detailsData as any)?.workorderProfile ??
                                (deviceJson as any)?._WorkorderProfile ??
                                (deviceJson as any)?.WorkorderProfile ??
                                (deviceJson as any)?.workorderProfile ??
                                (responseData as any)?._WorkorderProfile ??
                                (responseData as any)?.WorkorderProfile ??
                                (responseData as any)?.workorderProfile;

                            if (Array.isArray(candidateProfiles)) {
                                profileRows = candidateProfiles;
                            } else if (candidateProfiles && typeof candidateProfiles === "object") {
                                profileRows = [candidateProfiles];
                            } else if (Array.isArray(detailsData)) {
                                profileRows = detailsData;
                            } else if (detailsData && typeof detailsData === "object") {
                                profileRows = [detailsData];
                            }

                            let itemRows = profileRows.flatMap((profile: UnknownRecord) => {
                                const items =
                                    (profile as any)?.["PG.WorkorderItem"] ??
                                    profile?.workorderitems ??
                                    profile?.workorderItems ??
                                    profile?.WorkorderItems ??
                                    profile?.items ??
                                    profile?.Items;
                                return Array.isArray(items) ? items : [];
                            });

                            if (!itemRows.length) {
                                const directItems =
                                    (detailsData as any)?.["PG.WorkorderItem"] ??
                                    (deviceJson as any)?.["PG.WorkorderItem"] ??
                                    (responseData as any)?.["PG.WorkorderItem"] ??
                                    (deviceJson as any)?.WorkorderItems ??
                                    (deviceJson as any)?.workorderitems ??
                                    (deviceJson as any)?.Items ??
                                    (deviceJson as any)?.items ??
                                    (responseData as any)?.WorkorderItems ??
                                    (responseData as any)?.Items;
                                if (Array.isArray(directItems)) {
                                    itemRows = directItems;
                                }
                            }

                            resolve({
                                profiles: profileRows,
                                items: itemRows
                            });
                        } catch (error) {
                            console.error('Error in handle api response :', error);
                            resolve({ profiles: [], items: [] });
                        }
                    }
                }, statusbarContext);
            });

            workorderInFlightRef.current.set(cacheKey, fetchPromise);

            try {
                const result = await fetchPromise;
                workorderCacheRef.current.set(cacheKey, result);
                return result;
            } finally {
                workorderInFlightRef.current.delete(cacheKey);
            }
        },
        [statusbarContext, editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID]
    );

    const getEqid = (props: BasicPropItem[]) =>
        props.find((item) => item.Name?.toString().toLowerCase() === "eqid")?.Value?.toString().trim() ?? "";

    const getNodeEqid = (node?: ITreeNode | null): string => {
        if (!node) return "";
        if (node.EQID) return String(node.EQID).trim();
        if ((node as any).eqid) return String((node as any).eqid).trim();
        if (node.NodeDetail) {
            try {
                const detail = typeof node.NodeDetail === "string" ? JSON.parse(node.NodeDetail) : node.NodeDetail;
                if (detail?.EQID) return String(detail.EQID).trim();
                if (detail?.eqid) return String(detail.eqid).trim();
            } catch (error) {
                console.error('error in parse json string :', error);

            }
        }
        return "";
    };

    const selectedNodeEqid =
        editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
        || getNodeEqid(editDeviceReplacementProps.selectedNodeExplorer as any)
        || getEqid(rightDeviceBasicProps)
        || selectedDevice?.EQID?.toString().trim()
        || "";
    const defaultNodeEqid =
        getNodeEqid(defaultSelectedNode)
        || getEqid(leftDeviceBasicProps)
        || (defaultSelectedNode as any)?.eqid?.toString().trim()
        || "";

    const sessionContextRef = useRef(sessionContext);
    sessionContextRef.current = sessionContext;
    const statusbarContextRef = useRef(statusbarContext);
    statusbarContextRef.current = statusbarContext;

    const fetchAlertProfiles = useCallback(async (): Promise<UnknownRecord[]> => {
        if (alertProfilesCacheRef.current && alertProfilesCacheRef.current.length > 0) {
            return alertProfilesCacheRef.current;
        }
        return new Promise<UnknownRecord[]>((resolve) => {
            axiosInterceptor({
                url: ALERT.GetAlertProfiles,
                data: {
                    entityName: "WorkorderProfile",
                },
                setFetchData: async (handleApiResp: unknown, status?: string) => {
                    if (status === "200" && handleApiResp && typeof handleApiResp === "object" && 'alertJson' in handleApiResp) {
                        try {
                            const data = FnHandleAPIResponse((handleApiResp as any).alertJson, "Dataset");
                            const profiles = Array.isArray(data) ? data : [];
                            if (profiles.length > 0) {
                                alertProfilesCacheRef.current = profiles;
                                resolve(profiles);
                                return;
                            }
                        } catch { }
                    }
                    try {
                        const fallback = await FnGetWorkOrderProfile(sessionContextRef.current, statusbarContextRef.current);
                        const profiles = Array.isArray(fallback) ? (fallback as UnknownRecord[]) : [];
                        alertProfilesCacheRef.current = profiles;
                        resolve(profiles);
                    } catch {
                        resolve([]);
                    }
                }
            }, statusbarContextRef.current);
        });
    }, []);

    const isDescMatchBothEqids = useCallback((desc: string, eqid1: string, eqid2: string): boolean => {
        if (!desc || !eqid1 || !eqid2) return false;
        const descLower = desc.toLowerCase().trim();
        const e1 = eqid1.toLowerCase().trim();
        const e2 = eqid2.toLowerCase().trim();

        if (e1 === e2) {
            const firstIdx = descLower.indexOf(e1);
            if (firstIdx !== -1) {
                const secondIdx = descLower.indexOf(e1, firstIdx + e1.length);
                if (secondIdx !== -1) return true;
            }
            const normDesc = normalize(descLower);
            const normE1 = normalize(e1);
            const normFirstIdx = normDesc.indexOf(normE1);
            if (normFirstIdx !== -1) {
                const normSecondIdx = normDesc.indexOf(normE1, normFirstIdx + normE1.length);
                if (normSecondIdx !== -1) return true;
            }
            return false;
        }

        if (descLower.includes(e1) && descLower.includes(e2)) {
            return true;
        }

        const normDesc = normalize(descLower);
        const normE1 = normalize(e1);
        const normE2 = normalize(e2);
        if (normE1 && normE2 && normDesc.includes(normE1) && normDesc.includes(normE2)) {
            return true;
        }

        return false;
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const findMatchingProfile = async () => {
            if (!selectedNodeEqid || !defaultNodeEqid) {
                setMatchedProfileInfo(null);
                return;
            }

            try {
                const allProfiles = await fetchAlertProfiles();
                if (isCancelled) return;

                const matchingProfiles = allProfiles.filter((p: UnknownRecord) => {
                    const desc = String(p?.DESC250 ?? p?.Desc250 ?? p?.desc250 ?? p?.Description ?? "").trim();
                    return isDescMatchBothEqids(desc, selectedNodeEqid, defaultNodeEqid);
                });

                const matched = matchingProfiles.find((p: UnknownRecord) => {
                    const type = String(p?.WorkorderType ?? p?.workorderType ?? "").toLowerCase();
                    return type === "replacement" || type === "replacementprofile";
                }) || matchingProfiles[0];

                if (matched) {
                    const woid = String(matched._WorkorderProfile ?? matched.WorkorderProfile ?? matched._Workorder ?? matched.Name ?? "").trim();
                    const desc250 = String(matched.DESC250 ?? matched.Desc250 ?? matched.desc250 ?? matched.Description ?? "").trim();
                    const entId = String(matched.EntID ?? matched.ProfileEntID ?? "").trim();
                    setMatchedProfileInfo({
                        woid,
                        desc250,
                        entId,
                        profileRecord: matched
                    });
                } else {
                    setMatchedProfileInfo(null);
                }
            } catch (err) {
                console.error("Error finding matching profile by EQIDs:", err);
                if (!isCancelled) {
                    setMatchedProfileInfo(null);
                }
            }
        };

        findMatchingProfile();

        return () => {
            isCancelled = true;
        };
    }, [selectedNodeEqid, defaultNodeEqid, fetchAlertProfiles, isDescMatchBothEqids]);

    const extractTargetEqidsForSource = useCallback((profiles: UnknownRecord[], sourceEqid: string): string[] => {
        if (!sourceEqid || !profiles?.length) return [];
        const normSource = normalize(sourceEqid);
        if (!normSource) return [];
        const targetEqids = new Set<string>();

        for (const p of profiles) {
            const desc = String(p?.DESC250 ?? p?.Desc250 ?? p?.desc250 ?? p?.Description ?? "").trim();
            if (!desc) continue;

            let content = desc;
            if (/^replace[_\s]+/i.test(content)) {
                content = content.replace(/^replace[_\s]+/i, "");
            }

            const parts = content.split("_").map((s) => s.trim()).filter(Boolean);
            if (parts.length === 2) {
                const [p1, p2] = parts;
                const normP1 = normalize(p1);
                const normP2 = normalize(p2);
                if (normP1 === normSource && p2) {
                    targetEqids.add(p2);
                } else if (normP2 === normSource && p1) {
                    targetEqids.add(p1);
                }
            } else if (parts.length > 2) {
                const normFirst = normalize(parts[0]);
                const normLast = normalize(parts[parts.length - 1]);
                if (normFirst === normSource) {
                    targetEqids.add(parts.slice(1).join("_"));
                } else if (normLast === normSource) {
                    targetEqids.add(parts.slice(0, -1).join("_"));
                }
            } else {
                const regex = new RegExp(`replace[_\s]+${normSource}[_\s]+([a-zA-Z0-9#\-]+)`, "i");
                const match = desc.match(regex);
                if (match && match[1]) {
                    targetEqids.add(match[1].trim());
                }
            }
        }
        return Array.from(targetEqids);
    }, []);

    const prevSelectedNodeEqidRef = useRef<string>("");

    useEffect(() => {
        let isCancelled = false;
        if (!selectedNodeEqid) {
            prevSelectedNodeEqidRef.current = "";
            setHasReplacementProfile(undefined);
            setIsProfileLoading(false);
            return;
        }

        if (prevSelectedNodeEqidRef.current === selectedNodeEqid) {
            return;
        }

        prevSelectedNodeEqidRef.current = selectedNodeEqid;
        setIsProfileLoading(true);
        fetchAlertProfiles()
            .then((profiles) => {
                if (isCancelled) return;
                const targets = extractTargetEqidsForSource(profiles, selectedNodeEqid);
                setHasReplacementProfile(targets.length > 0);
                setIsProfileLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching alert profiles for tree target EQIDs:", err);
                if (!isCancelled) {
                    setHasReplacementProfile(false);
                    setIsProfileLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [selectedNodeEqid, fetchAlertProfiles, extractTargetEqidsForSource]);

    // ── Clear X marks whenever the selected device changes ──
    // This runs independently of the workorder-restore effect so it is never
    // blocked by token guards, restoreInProgress, or missing EQIDs.
    useEffect(() => {
        const clearRowMark = (row: IPortDataItem): IPortDataItem => {
            const cleaned = { ...row } as Record<string, unknown>;
            delete cleaned.dragInPortType;
            cleaned.tooltip = "";
            cleaned.transferportlabel = false;
            cleaned.connectedportEntityName = "";
            cleaned.connectedportEntId = "";
            return cleaned as IPortDataItem;
        };

        setLeftPowerPortData((prev) => prev.map(clearRowMark));
        setRightPowerPortData((prev) => prev.map(clearRowMark));
        setLeftNetworkPortData((prev) => prev.map(clearRowMark));
        setRightNetworkPortData((prev) => prev.map(clearRowMark));

        restoredMappingTokenRef.current = "";
    }, [
        defaultSelectedNode?.NodeEntID,
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID
    ]);

    useEffect(() => {
        if (editDeviceReplacementProps.featureId === FEnums.Replace || editDeviceReplacementProps.featureId === FEnums.ReplacementProfile) {
            const normalize = (value: unknown) =>
                value?.toString().toLowerCase().replace(/[^a-z0-9#]+/g, "").trim() ?? "";
            const getString = (value: unknown) => value?.toString().trim() ?? "";

            interface IParsedEndpoint {
                raw: string;
                deviceName: string;
                portName: string;
                segments: string[];
            }

            interface IDeviceTargetInfo {
                eqid: string;
                name: string;
                entityName: string;
                props: BasicPropItem[];
            }

            const parseEndpoint = (value: unknown): IParsedEndpoint => {
                if (value && typeof value === "object") {
                    const obj = value as Record<string, unknown>;
                    const name = getString(obj.Name ?? obj.DeviceName ?? obj._Device ?? obj.Device ?? obj.PortName ?? obj.CompositePortName);
                    const path = getString(obj.Path ?? obj.CompositeName ?? obj.CompositePortName ?? obj.sourcePath ?? obj.destPath);
                    const rawStr = path || name || "";
                    if (rawStr && rawStr.includes("->")) {
                        const segments = rawStr.split("->").map((s) => s.trim()).filter(Boolean);
                        const portName = segments[segments.length - 1] ?? "";
                        const deviceName = getString(obj.DeviceName ?? obj._Device) || (segments.length >= 2 ? segments[segments.length - 2] : "");
                        return {
                            raw: rawStr,
                            deviceName,
                            portName,
                            segments
                        };
                    }
                    if (rawStr && rawStr.includes(".")) {
                        const segments = rawStr.split(".").map((s) => s.trim()).filter(Boolean);
                        const portName = segments[segments.length - 1] ?? "";
                        const firstSegment = segments[0] ?? "";
                        const deviceName = firstSegment.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                        return { raw: rawStr, deviceName, portName, segments };
                    }
                    return {
                        raw: rawStr,
                        deviceName: getString(obj.DeviceName ?? obj._Device),
                        portName: name || rawStr,
                        segments: [name || rawStr].filter(Boolean)
                    };
                }

                const raw = getString(value);
                if (!raw) {
                    return { raw: "", deviceName: "", portName: "", segments: [] };
                }

                if (raw.includes("->")) {
                    const segments = raw.split("->").map((s) => s.trim()).filter(Boolean);
                    const portName = segments[segments.length - 1] ?? "";
                    const deviceName = segments.length >= 2 ? segments[segments.length - 2] : "";
                    return { raw, deviceName, portName, segments };
                }

                if (raw.includes(".")) {
                    const segments = raw.split(".").map((s) => s.trim()).filter(Boolean);
                    const portName = segments[segments.length - 1] ?? "";
                    const firstSegment = segments[0] ?? "";
                    const deviceName = firstSegment.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                    return { raw, deviceName, portName, segments };
                }

                return { raw, deviceName: "", portName: raw.trim(), segments: [raw.trim()] };
            };

            const getEqid = (props: BasicPropItem[]) =>
                props.find((item) => item.Name?.toString().toLowerCase() === "eqid")?.Value?.toString().trim() ?? "";

            const selectedNodeEqid =
                editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
                || getEqid(rightDeviceBasicProps)
                || selectedDevice?.EQID?.toString().trim()
                || "";
            const defaultNodeEqid =
                getEqid(leftDeviceBasicProps)
                || defaultSelectedNode?.EQID?.toString().trim()
                || (defaultSelectedNode as any)?.eqid?.toString().trim()
                || "";

            const clearRowMark = (row: IPortDataItem): IPortDataItem => {
                const cleaned = { ...row } as Record<string, unknown>;
                delete cleaned.dragInPortType;
                cleaned.tooltip = "";
                cleaned.transferportlabel = false;
                cleaned.connectedportEntityName = "";
                cleaned.connectedportEntId = "";
                return cleaned as IPortDataItem;
            };

            const clearAllGrids = () => {
                setLeftPowerPortData((prev) => prev.map(clearRowMark));
                setRightPowerPortData((prev) => prev.map(clearRowMark));
                setLeftNetworkPortData((prev) => prev.map(clearRowMark));
                setRightNetworkPortData((prev) => prev.map(clearRowMark));
            };

            if (!selectedNodeEqid || !defaultNodeEqid) {
                clearAllGrids();
                return;
            }
            if (!rightPowerPortData.length && !rightNetworkPortData.length) return;
            if (!leftPowerPortData.length && !leftNetworkPortData.length) return;
            if (restoreInProgressRef.current) return;

            const targetRight: IDeviceTargetInfo = {
                eqid: selectedNodeEqid,
                name: editDeviceReplacementProps.selectedNodeExplorer?.Name || selectedDevice?._Device || selectedDevice?.Name || "",
                entityName: editDeviceReplacementProps.selectedNodeExplorer?.NodeEntityname || "",
                props: rightDeviceBasicProps
            };

            const targetLeft: IDeviceTargetInfo = {
                eqid: defaultNodeEqid,
                name: defaultSelectedNode?.Name || "",
                entityName: defaultSelectedNode?.NodeEntityname || "",
                props: leftDeviceBasicProps
            };

            const matchesDevice = (candidate: string, target: IDeviceTargetInfo): boolean => {
                if (!candidate || !target) return false;

                const cleanedCandidate = candidate.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                const candNorm = normalize(cleanedCandidate);
                if (!candNorm) return false;

                const identifiers: string[] = [];

                if (target.eqid) {
                    identifiers.push(normalize(target.eqid));
                }
                if (target.name) {
                    const cleanedName = target.name.replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                    identifiers.push(normalize(cleanedName));
                    identifiers.push(normalize(target.name));
                }
                if (target.entityName) {
                    identifiers.push(normalize(target.entityName));
                }

                if (Array.isArray(target.props)) {
                    for (const p of target.props) {
                        const pName = (p.Name ?? "").toString().toLowerCase().trim();
                        if (["_device", "device", "model", "eqid", "name", "devicename"].includes(pName)) {
                            if (p.Value) {
                                const cleanedVal = p.Value.toString().replace(/\s*\([a-zA-Z0-9_\-\s]+\)$/, "").trim();
                                identifiers.push(normalize(cleanedVal));
                            }
                        }
                    }
                }

                const validIdentifiers = identifiers.filter(Boolean);
                if (!validIdentifiers.length) return false;

                return validIdentifiers.some((id) => {
                    if (!id) return false;
                    if (candNorm === id) return true;
                    if (candNorm.length >= 3 && id.length >= 3) {
                        if (candNorm.startsWith(id) || id.startsWith(candNorm)) return true;
                    }
                    return false;
                });
            };

            const matchPortRow = (row: IPortDataItem, endpoint: IParsedEndpoint, targetDevice: IDeviceTargetInfo): boolean => {
                if (!row || !endpoint) return false;

                if (endpoint.deviceName && endpoint.deviceName !== endpoint.portName) {
                    if (!matchesDevice(endpoint.deviceName, targetDevice)) {
                        return false;
                    }
                }

                const rowNameNorm = normalize(row.Name);
                const rowCompNorm = normalize(row.CompositeName);
                const endPortNorm = normalize(endpoint.portName);
                const endRawNorm = normalize(endpoint.raw);

                const portMatches =
                    (rowCompNorm && (rowCompNorm === endRawNorm || rowCompNorm === endPortNorm)) ||
                    (rowNameNorm && endPortNorm && rowNameNorm === endPortNorm) ||
                    (rowNameNorm && endRawNorm && rowNameNorm === endRawNorm) ||
                    (rowCompNorm && endPortNorm && rowCompNorm.endsWith(endPortNorm)) ||
                    (endRawNorm && rowNameNorm && endRawNorm.endsWith(rowNameNorm)) ||
                    (endPortNorm && rowCompNorm && endPortNorm.endsWith(rowCompNorm));

                return Boolean(portMatches);
            };

            const getMappingPortType = (
                mapping: { source: string; dest: string },
                lp: IPortDataItem[],
                ln: IPortDataItem[],
                rp: IPortDataItem[],
                rn: IPortDataItem[]
            ): "power" | "network" | "" => {
                const destEp = parseEndpoint(mapping.dest);
                const srcEp = parseEndpoint(mapping.source);

                const matchesAny = (rows: IPortDataItem[], ep: IParsedEndpoint, target: IDeviceTargetInfo) =>
                    rows.some((r) => matchPortRow(r, ep, target));

                const isPower =
                    matchesAny(lp, srcEp, targetLeft) ||
                    matchesAny(rp, destEp, targetRight) ||
                    matchesAny(lp, destEp, targetLeft) ||
                    matchesAny(rp, srcEp, targetRight);

                const isNetwork =
                    matchesAny(ln, srcEp, targetLeft) ||
                    matchesAny(rn, destEp, targetRight) ||
                    matchesAny(ln, destEp, targetLeft) ||
                    matchesAny(rn, srcEp, targetRight);

                if (isPower && !isNetwork) return "power";
                if (isNetwork && !isPower) return "network";

                const text = `${mapping.source} ${mapping.dest}`.toLowerCase();
                const hasPowerText = /power|plug|outlet|inlet|grounding/.test(text);
                const hasNetworkText = /network|ethernet|serial|rs232|rs485|analog|digital|gpio|rj45|rj-45|usb|fiber|sfp|qsfp|console|mgmt|lan|wan/.test(text);

                if (hasPowerText && !hasNetworkText) return "power";
                if (hasNetworkText && !hasPowerText) return "network";
                return "";
            };

            const templateWoid = getWorkorderDetailsWoid() || matchedProfileInfo?.woid || "";
            const token = `${selectedNodeEqid}|${defaultNodeEqid}|${defaultSelectedNode?.NodeEntID ?? ""}|${templateWoid}|LP:${leftPowerPortData.length}|LN:${leftNetworkPortData.length}|RP:${rightPowerPortData.length}|RN:${rightNetworkPortData.length}`;
            if (restoredMappingTokenRef.current === token) return;
            restoredMappingTokenRef.current = token;
            restoreInProgressRef.current = true;

            const applyRestoredMappings = async () => {
                const clearRowMark = (row: IPortDataItem): IPortDataItem => {
                    const cleaned = { ...row } as Record<string, unknown>;
                    delete cleaned.dragInPortType;
                    cleaned.tooltip = "";
                    cleaned.transferportlabel = false;
                    cleaned.connectedportEntityName = "";
                    cleaned.connectedportEntId = "";
                    return cleaned as IPortDataItem;
                };

                const clearAllGrids = () => {
                    setLeftPowerPortData((prev) => prev.map(clearRowMark));
                    setRightPowerPortData((prev) => prev.map(clearRowMark));
                    setLeftNetworkPortData((prev) => prev.map(clearRowMark));
                    setRightNetworkPortData((prev) => prev.map(clearRowMark));
                };

                const cleanLeftPower = leftPowerPortData;
                const cleanRightPower = rightPowerPortData;
                const cleanLeftNetwork = leftNetworkPortData;
                const cleanRightNetwork = rightNetworkPortData;

                if (!templateWoid) {
                    clearAllGrids();
                    return;
                }

                const workorderDetails = await fetchWorkorderDetails(templateWoid);
                const profiles = workorderDetails.profiles;
                if (!Array.isArray(profiles) || !profiles.length || !workorderDetails.items.length) {
                    clearAllGrids();
                    return;
                }

                const isProfileMatch = (pName: string, items?: ParsedWorkorderItem[], pDesc?: string) => {
                    const pNorm = normalize(pName);
                    const descNorm = normalize(pDesc ?? "");
                    const selEq = normalize(selectedNodeEqid);
                    const defEq = normalize(defaultNodeEqid);
                    const selNameNorm = normalize(targetRight.name);
                    const defNameNorm = normalize(targetLeft.name);

                    const c1 = normalize(`replace_${selEq}_${defEq}`);
                    const c2 = normalize(`replace_${defEq}_${selEq}`);
                    if (pNorm === c1 || pNorm === c2 || descNorm === c1 || descNorm === c2) return true;

                    if (selEq && defEq && ((pNorm.includes(selEq) && pNorm.includes(defEq)) || (descNorm.includes(selEq) && descNorm.includes(defEq)))) return true;

                    if (selNameNorm && defNameNorm && ((pNorm.includes(selNameNorm) && pNorm.includes(defNameNorm)) || (descNorm.includes(selNameNorm) && descNorm.includes(defNameNorm)))) return true;

                    if (selEq && defNameNorm && ((pNorm.includes(selEq) && pNorm.includes(defNameNorm)) || (descNorm.includes(selEq) && descNorm.includes(defNameNorm)))) return true;
                    if (defEq && selNameNorm && ((pNorm.includes(defEq) && pNorm.includes(selNameNorm)) || (descNorm.includes(defEq) && descNorm.includes(selNameNorm)))) return true;

                    if (items && items.length) {
                        const hasRightMatch = items.some((it) => {
                            try {
                                const parsed = typeof it.ItemJson === "string" ? JSON.parse(it.ItemJson) : it.ItemJson;
                                if (!parsed) return false;
                                if (parsed.dest && typeof parsed.dest === "object" && matchesDevice(getString((parsed.dest as any).Name || (parsed.dest as any).Path || (parsed.dest as any)._Device), targetRight)) return true;
                                if (parsed.fromDevice && matchesDevice(getString(parsed.fromDevice.Name || parsed.fromDevice.Path || parsed.fromDevice._Device), targetRight)) return true;
                                if (parsed.toDevice && matchesDevice(getString(parsed.toDevice.Name || parsed.toDevice.Path || parsed.toDevice._Device), targetRight)) return true;
                                const src = parseEndpoint(parsed.source);
                                const dst = parseEndpoint(parsed.dest);
                                return (
                                    (src.deviceName && matchesDevice(src.deviceName, targetRight)) ||
                                    (dst.deviceName && matchesDevice(dst.deviceName, targetRight))
                                );
                            } catch {
                                return false;
                            }
                        });

                        const hasLeftMatch = items.some((it) => {
                            try {
                                const parsed = typeof it.ItemJson === "string" ? JSON.parse(it.ItemJson) : it.ItemJson;
                                if (!parsed) return false;
                                if (parsed.source && typeof parsed.source === "object" && matchesDevice(getString((parsed.source as any).Name || (parsed.source as any).Path || (parsed.source as any)._Device), targetLeft)) return true;
                                if (parsed.toDevice && matchesDevice(getString(parsed.toDevice.Name || parsed.toDevice.Path || parsed.toDevice._Device), targetLeft)) return true;
                                if (parsed.fromDevice && matchesDevice(getString(parsed.fromDevice.Name || parsed.fromDevice.Path || parsed.fromDevice._Device), targetLeft)) return true;
                                const src = parseEndpoint(parsed.source);
                                const dst = parseEndpoint(parsed.dest);
                                return (
                                    (src.deviceName && matchesDevice(src.deviceName, targetLeft)) ||
                                    (dst.deviceName && matchesDevice(dst.deviceName, targetLeft))
                                );
                            } catch {
                                return false;
                            }
                        });

                        if (hasRightMatch && hasLeftMatch) return true;
                    }

                    return false;
                };

                const matchedProfile =
                    profiles.find((item) => {
                        const pName = getString(item?._WorkorderProfile ?? item?._workorderProfile ?? item?._Workorder ?? item?._workorder);
                        return pName.toLowerCase() === templateWoid.toLowerCase();
                    })
                    || profiles.find((item) => {
                        const profileName = getString(item?._WorkorderProfile ?? item?._workorderProfile ?? item?._workorderprofile);
                        const profileDesc = getString(item?.DESC250 ?? item?.Desc250 ?? item?.desc250);
                        return isProfileMatch(profileName, workorderDetails.items, profileDesc);
                    })
                    || profiles[0];

                if (!matchedProfile) {
                    clearAllGrids();
                    return;
                }

                const matchedProfileName = getString(matchedProfile?._WorkorderProfile ?? matchedProfile?._workorderProfile ?? matchedProfile?._workorderprofile).toLowerCase();
                const matchedProfileDesc = getString(matchedProfile?.DESC250 ?? matchedProfile?.Desc250 ?? matchedProfile?.desc250).toLowerCase();
                const allItems = workorderDetails.items;
                if (!allItems.length) {
                    clearAllGrids();
                    return;
                }

                const profileItems = allItems.filter((item) => {
                    let parsedItem: UnknownRecord | undefined;
                    try {
                        parsedItem = typeof item?.ItemJson === "string" ? JSON.parse(item.ItemJson) : item?.ItemJson;
                    } catch (error) {
                        console.error('Error in parse json string :', error);
                        parsedItem = undefined;
                    }
                    const itemProfile = getString(
                        item?._WorkorderProfile ??
                        item?._workorderProfile ??
                        (parsedItem as any)?.ReplacementProfile ??
                        (parsedItem as any)?.Workordername
                    ).toLowerCase();
                    return !matchedProfileName || !itemProfile || itemProfile === matchedProfileName || (matchedProfileDesc && itemProfile === matchedProfileDesc) || isProfileMatch(itemProfile, allItems);
                });
                const itemsToUse = profileItems.length > 0 ? profileItems : allItems;

                const mappings: Array<{ source: string; dest: string }> = [];
                itemsToUse.forEach((item) => {
                    try {
                        const parsed = typeof item.ItemJson === "string" ? JSON.parse(item.ItemJson) : item.ItemJson;
                        if (!parsed) return;
                        const action = getString(parsed.action).toLowerCase();
                        if (action && !["replacement", "replace device", "replace", "replacementprofile"].includes(action)) return;

                        if (parsed.transferlabel !== undefined) {
                            setIsTransferPortLabel(parsed.transferlabel === "True" || parsed.transferlabel === true);
                        }

                        if (Array.isArray(parsed.portmapping) && parsed.portmapping.length > 0) {
                            parsed.portmapping.forEach((pm: any) => {
                                if (pm) {
                                    const s = typeof pm.source === "string" ? pm.source : getString(pm.source);
                                    const d = typeof pm.dest === "string" ? pm.dest : getString(pm.dest);
                                    if (s || d) {
                                        mappings.push({ source: s, dest: d });
                                    }
                                }
                            });
                        } else {
                            const sourceRaw = parsed.source;
                            const destRaw = parsed.dest;
                            const getCompositeName = (value: unknown) => {
                                if (typeof value === "string") {
                                    return value;
                                }
                                if (value && typeof value === "object") {
                                    const portValue = value as UnknownRecord;
                                    return getString(
                                        portValue.CompositePortName
                                        ?? portValue.CompositeName
                                        ?? portValue.Name
                                        ?? portValue.PortName
                                    );
                                }
                                return "";
                            };
                            const s = getCompositeName(sourceRaw) || getString(parsed.sourcePath);
                            const d = getCompositeName(destRaw) || getString(parsed.destPath);
                            if (s || d) {
                                mappings.push({ source: s, dest: d });
                            }
                        }
                    } catch (error) {
                        console.error('Error in handle profile items  :', error);
                    }
                });
                if (!mappings.length) {
                    clearAllGrids();
                    return;
                }

                const applyByType = (
                    leftRows: IPortDataItem[],
                    rightRows: IPortDataItem[],
                    portType: "power" | "network"
                ) => {
                    const getEntId = (row: IPortDataItem) => String(row?.EntID ?? "");

                    const clearMark = (row: IPortDataItem): IPortDataItem => {
                        const cleaned = { ...row } as Record<string, unknown>;
                        delete cleaned.dragInPortType;
                        cleaned.tooltip = "";
                        cleaned.transferportlabel = false;
                        cleaned.connectedportEntityName = "";
                        cleaned.connectedportEntId = "";
                        return cleaned as IPortDataItem;
                    };
                    const cleanedLeft = leftRows.map(clearMark);
                    const cleanedRight = rightRows.map(clearMark);
                    const hadMarks =
                        leftRows.some((r) => r.tooltip || r.dragInPortType || r.transferportlabel) ||
                        rightRows.some((r) => r.tooltip || r.dragInPortType || r.transferportlabel);

                    const usedLeft = new Set<string>();
                    const usedRight = new Set<string>();

                    const mappingsForThisType = mappings.filter((m) => {
                        const mappingPortType = getMappingPortType(m, leftPowerPortData, leftNetworkPortData, rightPowerPortData, rightNetworkPortData);
                        if (mappingPortType && mappingPortType !== portType) return false;
                        return true;
                    });

                    const pairs = mappingsForThisType
                        .map((m) => {
                            const destEp = parseEndpoint(m.dest);
                            const srcEp = parseEndpoint(m.source);

                            let left = cleanedLeft.find(
                                (row) => !usedLeft.has(getEntId(row)) && matchPortRow(row, srcEp, targetLeft)
                            );
                            let right = cleanedRight.find(
                                (row) => !usedRight.has(getEntId(row)) && matchPortRow(row, destEp, targetRight)
                            );

                            if (!left || !right) {
                                const reversedLeft = cleanedLeft.find(
                                    (row) => !usedLeft.has(getEntId(row)) && matchPortRow(row, destEp, targetLeft)
                                );
                                const reversedRight = cleanedRight.find(
                                    (row) => !usedRight.has(getEntId(row)) && matchPortRow(row, srcEp, targetRight)
                                );
                                if (reversedLeft && reversedRight) {
                                    left = reversedLeft;
                                    right = reversedRight;
                                }
                            }

                            if (!left || !right) return null;

                            const rightEntId = getEntId(right);
                            const leftEntId = getEntId(left);
                            if (!rightEntId || !leftEntId) return null;

                            usedLeft.add(leftEntId);
                            usedRight.add(rightEntId);
                            return {
                                leftEntId,
                                rightEntId,
                                rightName: right.CompositeName?.toString() ?? right.Name?.toString() ?? "",
                                leftName: left.CompositeName?.toString() ?? left.Name?.toString() ?? ""
                            };
                        })
                        .filter((p): p is { leftEntId: string; rightEntId: string; rightName: string; leftName: string } => !!p);

                    if (!pairs.length) {
                        return { leftRows: cleanedLeft, rightRows: cleanedRight, changed: hadMarks };
                    }

                    const leftIdSet = new Set(pairs.map((p) => p.leftEntId));
                    const rightIdSet = new Set(pairs.map((p) => p.rightEntId));
                    const rightNameByLeft = new Map(pairs.map((p) => [p.leftEntId, p.rightName]));
                    const leftNameByRight = new Map(pairs.map((p) => [p.rightEntId, p.leftName]));

                    const lPath = defaultSelectedNode?.NodePath || leftDevicePath || defaultSelectedNode?.Name || "Inventory Device";
                    const rPath = editDeviceReplacementProps.selectedNodeExplorer?.NodePath || rightDevicePath || selectedDevice?._Device || "Replaced Device";

                    const updatedLeft = cleanedLeft.map((row) => {
                        const rowId = getEntId(row);
                        if (!leftIdSet.has(rowId)) return row;
                        const targetName = rightNameByLeft.get(rowId) ?? "";
                        return {
                            ...row,
                            tooltip: `From: ${lPath}->${row.Name}, To: ${rPath}->${targetName}`,
                            dragInPortType: portType,
                            transferportlabel: true,
                            connectedportEntityName: row.EntityName,
                            connectedportEntId: row.EntID
                        };
                    });

                    const updatedRight = cleanedRight.map((row) => {
                        const rowId = getEntId(row);
                        if (!rightIdSet.has(rowId)) return row;
                        const pair = pairs.find((p) => p.rightEntId === rowId);
                        const sourceRow = pair ? cleanedLeft.find((l) => getEntId(l) === pair.leftEntId) : undefined;
                        const sourcePortName = leftNameByRight.get(rowId) ?? sourceRow?.Name ?? "";
                        return {
                            ...row,
                            tooltip: `From: ${lPath}->${sourcePortName}, To: ${rPath}->${row.Name}`,
                            dragInPortType: portType,
                            transferportlabel: true,
                            connectedportEntityName: sourceRow?.EntityName ?? "",
                            connectedportEntId: sourceRow?.EntID ?? ""
                        };
                    });

                    return { leftRows: updatedLeft, rightRows: updatedRight, changed: true };
                };

                const power = applyByType(cleanLeftPower, cleanRightPower, "power");
                const network = applyByType(cleanLeftNetwork, cleanRightNetwork, "network");

                if (power.changed) {
                    setLeftPowerPortData(power.leftRows);
                    setRightPowerPortData(power.rightRows);
                }
                if (network.changed) {
                    setLeftNetworkPortData(network.leftRows);
                    setRightNetworkPortData(network.rightRows);
                }
            };

            applyRestoredMappings()
                .catch((err) => {
                    console.error("Error applying restored mappings:", err);
                })
                .finally(() => {
                    restoreInProgressRef.current = false;
                });
        }
    }, [
        editDeviceReplacementProps.featureId,
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        editDeviceReplacementProps.selectedNodeExplorer?.EQID,
        defaultSelectedNode?.NodeEntID,
        defaultSelectedNode?.EQID,
        leftPowerPortData.length,
        leftNetworkPortData.length,
        rightPowerPortData.length,
        rightNetworkPortData.length,
        getWorkorderDetailsWoid,
        fetchWorkorderDetails,
        matchedProfileInfo?.woid
    ]);

    const updateTemplateDeviceMatch = useCallback((selectedEqid: string) => {
        const templateWoid = getReplacementTemplateWoidOnly();
        const deviceWoid = getExplorerDeviceWoid();
        if (!templateWoid || deviceWoid) {
            setIsWorkorderDeviceMatched(false);
            return;
        }
        const targetEq = templateProfileTargetEqidRef.current.trim();
        const selectedEq = selectedEqid.trim();
        setIsWorkorderDeviceMatched(
            Boolean(targetEq && selectedEq && normalize(selectedEq) === normalize(targetEq))
        );
    }, [getReplacementTemplateWoidOnly, getExplorerDeviceWoid]);

    // Resolve inventory tree EQID from workorder details (WOID → items; template → DESC250)
    useEffect(() => {
        const deviceWoid = getExplorerDeviceWoid();
        const replacementTemplateWoid = getReplacementTemplateWoidOnly();
        const woidForApi = deviceWoid || replacementTemplateWoid;
        const currentNodeEntId = (editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? "").toString().trim();

        if (!woidForApi) {
            setTargetTreeEqid((prev) => (prev ? "" : prev));
            templateProfileTargetEqidRef.current = "";
            prevTargetNodeEntIdRef.current = currentNodeEntId;
            prevTargetTemplateWoidRef.current = "";
            setIsWorkorderDeviceMatched(false);
            setIsTargetEqidLoading(false);
            return;
        }

        const isNodeChanged = prevTargetNodeEntIdRef.current !== currentNodeEntId;
        const isWoidChanged = prevTargetTemplateWoidRef.current !== woidForApi;
        if (!isNodeChanged && !isWoidChanged && targetTreeEqid) {
            return;
        }
        if (isNodeChanged || isWoidChanged) {
            setTargetTreeEqid("");
            templateProfileTargetEqidRef.current = "";
            setIsTargetEqidLoading(true);
        }
        prevTargetNodeEntIdRef.current = currentNodeEntId;
        prevTargetTemplateWoidRef.current = woidForApi;

        if (deviceWoid) {
            templateProfileTargetEqidRef.current = "";
            setIsWorkorderDeviceMatched(false);
        }

        const pane1Eqid =
            editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
            || (editDeviceReplacementProps.selectedNodeExplorer as any)?.eqid?.toString().trim()
            || rightDeviceBasicPropsRef.current.find((item) => item.Name?.toLowerCase() === "eqid")?.Value?.toString().trim()
            || selectedDevice?.EQID?.toString().trim()
            || "";

        const resolveTargetEqidFromDesc = (desc: string): string => {
            if (!desc) return "";
            const trimmed = desc.trim();

            const normPane1 = (pane1Eqid || "").trim().toLowerCase();

            const replacePrefixMatch = trimmed.match(/^replace_(.+)$/i);
            const content = replacePrefixMatch ? replacePrefixMatch[1].trim() : trimmed;

            if (normPane1) {
                if (content.toLowerCase().startsWith(normPane1 + "_")) {
                    return content.slice(normPane1.length + 1).trim();
                }
                if (content.toLowerCase().endsWith("_" + normPane1)) {
                    return content.slice(0, content.length - normPane1.length - 1).trim();
                }
            }

            const parts = content.split("_");
            if (parts.length === 2) {
                const [p1, p2] = parts;
                if (normPane1) {
                    if (p1.toLowerCase() === normPane1) return p2.trim();
                    if (p2.toLowerCase() === normPane1) return p1.trim();
                }
                return p2.trim();
            } else if (parts.length > 2 && normPane1) {
                const idx = parts.findIndex(p => p.toLowerCase() === normPane1);
                if (idx === 0) {
                    return parts.slice(1).join("_").trim();
                } else if (idx === parts.length - 1) {
                    return parts.slice(0, -1).join("_").trim();
                }
            }

            const match = trimmed.match(/replace_([a-zA-Z0-9#\-]+)_([a-zA-Z0-9#\-]+)/i);
            if (match) {
                const eq1 = match[1];
                const eq2 = match[2];
                if (normPane1) {
                    if (eq1.toLowerCase() === normPane1) return eq2.trim();
                    if (eq2.toLowerCase() === normPane1) return eq1.trim();
                }
                return eq2.trim();
            }

            return "";
        };

        let isCancelled = false;

        const extractTargetFromWorkorderItems = (items: ParsedWorkorderItem[]): string => {
            if (!items?.length) return "";
            const normPane1 = (pane1Eqid || "").trim().toLowerCase();
            const normPane1EntId = (currentNodeEntId || "").trim().toLowerCase();

            for (const it of items) {
                try {
                    const parsed = typeof it.ItemJson === "string" ? JSON.parse(it.ItemJson) : it.ItemJson;
                    if (!parsed) continue;
                    const src = parsed.source || parsed.fromDevice;
                    const dst = parsed.dest || parsed.toDevice;
                    const srcEq = String(src?.EQID || parsed.FromEQID || "").trim();
                    const dstEq = String(dst?.EQID || parsed.ToEQID || "").trim();
                    const srcEnt = String(src?.EntId || src?.DeviceID || "").trim().toLowerCase();
                    const dstEnt = String(dst?.EntId || dst?.DeviceID || "").trim().toLowerCase();
                    const srcPath = String(src?.Path || "").toLowerCase();
                    const dstPath = String(dst?.Path || "").toLowerCase();

                    if ((dstEnt && dstEnt === normPane1EntId) || (dstEq && normPane1 && dstEq.toLowerCase() === normPane1)) {
                        if (srcEq) return srcEq;
                    }
                    if ((srcEnt && srcEnt === normPane1EntId) || (srcEq && normPane1 && srcEq.toLowerCase() === normPane1)) {
                        if (dstEq) return dstEq;
                    }
                    if (srcPath.includes("inventory") && srcEq) return srcEq;
                    if (dstPath.includes("inventory") && dstEq) return dstEq;
                    const msg = String(parsed.message || "");
                    const msgMatch = msg.match(/with\s+([a-zA-Z0-9#\-_]+)\s+(?:at|by)/i);
                    if (msgMatch?.[1]) return msgMatch[1].trim();
                    if (srcEq && (!normPane1 || srcEq.toLowerCase() !== normPane1)) return srcEq;
                    if (dstEq && (!normPane1 || dstEq.toLowerCase() !== normPane1)) return dstEq;
                } catch { }
            }
            return "";
        };

        const extractTargetFromProfileDesc = (profiles: UnknownRecord[]): string => {
            let foundDesc = "";
            if (profiles.length > 0) {
                for (const p of profiles as any[]) {
                    const desc = String(p?.Desc250 ?? p?.DESC250 ?? p?.desc250 ?? p?.Description ?? p?.description ?? "").trim();
                    if (desc) {
                        foundDesc = desc;
                        break;
                    }
                }
            }
            if (foundDesc) {
                return resolveTargetEqidFromDesc(foundDesc);
            }
            return resolveTargetEqidFromDesc(replacementTemplateWoid);
        };

        const findDescAndTargetEqid = async () => {
            try {
                const workorderDetails = await fetchWorkorderDetails(woidForApi, isNodeChanged || isWoidChanged);

                if (isCancelled) return;

                let targetFound = "";
                if (deviceWoid) {
                    targetFound = extractTargetFromWorkorderItems(workorderDetails.items);
                } else {
                    targetFound = extractTargetFromProfileDesc(workorderDetails.profiles);
                    if (!targetFound && workorderDetails.items?.length) {
                        targetFound = extractTargetFromWorkorderItems(workorderDetails.items);
                    }
                }

                if (targetFound) {
                    if (!deviceWoid) {
                        templateProfileTargetEqidRef.current = targetFound;
                    }
                    setTargetTreeEqid((prev) => (prev === targetFound ? prev : targetFound));
                } else {
                    templateProfileTargetEqidRef.current = "";
                    setIsWorkorderDeviceMatched(false);
                }
            } catch (err) {
                console.error("Error finding target EQID from workorder profile:", err);
                templateProfileTargetEqidRef.current = "";
                setIsWorkorderDeviceMatched(false);
            } finally {
                if (!isCancelled) {
                    setIsTargetEqidLoading(false);
                }
            }
        };

        findDescAndTargetEqid();

        return () => {
            isCancelled = true;
        };
    }, [
        getExplorerDeviceWoid,
        getReplacementTemplateWoidOnly,
        fetchWorkorderDetails,
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        editDeviceReplacementProps.selectedNodeExplorer?.EQID,
    ]);

    useEffect(() => {
        updateTemplateDeviceMatch(
            defaultNodeEqid
            || getNodeEqid(defaultSelectedNode)
            || getEqid(leftDeviceBasicProps)
        );
    }, [
        targetTreeEqid,
        defaultSelectedNode?.NodeEntID,
        defaultSelectedNode?.EQID,
        defaultNodeEqid,
        leftDeviceBasicProps,
        updateTemplateDeviceMatch,
    ]);

    const buildAgGridColumns = (
        data: IPropertyDefinition[],
        _portType?: 'power' | 'network'
    ): ColDef[] => {
        const indexColumn: ColDef[] = [
            {
                headerName: "",
                field: "index",
                width: 50,
                valueGetter: "node.rowIndex + 1",
                suppressMovable: true,
                resizable: false,
                sortable: false,
                cellClass: 'nz-index-cell'
            }
        ];

        const columnsForPort = ["Name", "CompositeName", "Gender", "PortUse", "PortType"]
        let columns: ColDef[] = [];
        const sortedColumns = data
            .sort((a, b) => a.SortOrder - b.SortOrder)
            .filter((item) => columnsForPort.includes(item.PName));
        for (let index = 0; index < sortedColumns.length; index++) {
            const element = sortedColumns[index];

            columns.push({
                field: element.PName,
                headerName: element.PropertyLabel || element.PName,
                editable: false,
                sortable: false,
                filter: false,
                resizable: index === (sortedColumns.length - 1) ? false : true,
                tooltipField: "tooltip",
                minWidth: 100,
                flex: index === (sortedColumns.length - 1) ? 1 : 0
            });
        }

        let diagnosticLevelData = getDiagnosticLevelData()
        if (Number(diagnosticLevelData) === 0) {
            columns = columns.filter((item) => item.field && !hideGridData.includes(item.field))
        }
        return [...indexColumn, ...columns];
    };


    useEffect(() => {
        const currentNodeEntId = editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID;
        const isDifferentNode = prevSelectedNodeEntIdRef.current !== currentNodeEntId;
        prevSelectedNodeEntIdRef.current = currentNodeEntId || "";

        if (isDifferentNode) {
            setDefaultSelectedNode(undefined);
            setMatchedProfileInfo(null);
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDeviceBasicProps([]);
            setLeftDevicePath(undefined);
            restoredMappingTokenRef.current = "";
            templateProfileTargetEqidRef.current = "";
            setIsWorkorderDeviceMatched(false);
            setCreatedReplaceWoid("");
        }

        if (editDeviceReplacementProps.selectedNodeExplorer && editDeviceReplacementProps.selectedNodeExplorer.NodeEntID &&
            editDeviceReplacementProps.selectedNodeExplorer.NodeType == "Device") {
            const handleClickIgnoreConflict = (deviceData: IPlacementDevice) => {

                if (!deviceData.EntityName) {
                    editDeviceReplacementProps.handleShowUserMessage?.("Device EntityName is not found");
                    return
                }
                let payload = {
                    entityName: deviceData.EntityName
                }
                axiosInterceptor({
                    url: EM.GetTableVsProperty,
                    data: payload,
                    setFetchData: (getTablevsPropertyApiResp: unknown, status?: string) => {
                        if (status === "200" && getTablevsPropertyApiResp) {
                            if (Array.isArray(getTablevsPropertyApiResp) && getTablevsPropertyApiResp.length) {

                                let oneToOneTables: string[] = [];
                                let columnList: UnknownRecord[] = [];
                                for (let index = 0; index < getTablevsPropertyApiResp.length; index++) {
                                    const element = getTablevsPropertyApiResp[index];
                                    if (!element.isOneToManyRelation) {
                                        oneToOneTables.push(element.tableName);
                                        if (element.properties) {
                                            const parsedArray = FnParseJsonSafely(element.properties)
                                            columnList = [...columnList, ...parsedArray];
                                        }
                                    }

                                }
                                if (oneToOneTables.length > 0) {
                                    axiosInterceptor({
                                        url: EM.GetAllTablesRecord,
                                        data: {
                                            entID: deviceData.DeviceID,
                                            tableNames: oneToOneTables.join(DELIMITER.separator),
                                        },
                                        setFetchData: (response: unknown) => {
                                            if (response && typeof response === "object" && 'jsonStringOutput' in response) {
                                                if (response.jsonStringOutput) {

                                                    const jsonData = FnParseJsonSafely(response.jsonStringOutput as string);
                                                    const result: BasicPropItem[] = [];
                                                    const deviceProps = [
                                                        "_Device", "_WorkorderProfile", "WorkorderProfile",
                                                        "RURequired", "Power", "Thermal", "Power port", "Network port",
                                                        "Weight", "EQID", "Path", "Manufacturer", "MfgEqType", "MfgProdLine"
                                                    ];

                                                    if (!Array.isArray(jsonData?.AllTables)) {
                                                        return;
                                                    }

                                                    const addedProps = new Set<string>();

                                                    jsonData.AllTables.forEach((table: UnknownRecord) => {
                                                        if (!Array.isArray(table?.TableData)) return;

                                                        table.TableData.forEach((item: UnknownRecord) => {
                                                            const itemName = String(item?.Name ?? "").toLowerCase();

                                                            if (!deviceProps.some(p => p.toLowerCase() === itemName)) return;

                                                            //  Prevent duplicates
                                                            if (addedProps.has(itemName)) return;

                                                            addedProps.add(itemName);

                                                            if (item.Name === "Path") {
                                                                setRightDevicePath(item.Value as string | undefined);
                                                            }

                                                            const column = columnList.find(
                                                                (column) => column.PName === item.Name
                                                            );

                                                            result.push({
                                                                Name: item.Name as string,
                                                                Value: item.Value as string,
                                                                PropertyLabel: (column?.PropertyLabel ?? item.Name) as string
                                                            });
                                                        });
                                                    });


                                                    setRightDeviceBasicProps(result);
                                                }
                                            }
                                        }
                                    }, statusbarContext);

                                }
                                const powerPortTableRecord = getTablevsPropertyApiResp.find((item) => item.tableName === "PG.DevicePowerPort");
                                const networkPortTableRecord = getTablevsPropertyApiResp.find((item) => item.tableName === "PG.DeviceNetworkPort");
                                if (powerPortTableRecord && powerPortTableRecord.properties && typeof powerPortTableRecord.properties === "string") {
                                    const parsed = FnParseJsonSafely(powerPortTableRecord.properties);
                                    setColumnDefsPowerPort(buildAgGridColumns(parsed, 'power'));

                                }
                                if (networkPortTableRecord && networkPortTableRecord.properties && typeof networkPortTableRecord.properties === "string") {
                                    const parsed = FnParseJsonSafely(networkPortTableRecord.properties);
                                    setColumnDefsNetworkPort(buildAgGridColumns(parsed, 'network'));
                                }
                            }
                        }
                    }
                }, statusbarContext)
                axiosInterceptor({
                    url: CABLING.GetDevicePort,
                    data: {
                        deviceEntID: deviceData.DeviceID,
                        isPower: true
                    },
                    setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                        if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object" && 'portsJson' in getConnectivityApiResponse) {

                            try {
                                const parsed = JSON.parse(getConnectivityApiResponse.portsJson as string);
                                if (parsed && typeof parsed === "object" && 'Ports' in parsed && Array.isArray(parsed.Ports)) {
                                    const powerPorts: IPortDataItem[] = [];
                                    for (let index = 0; index < parsed.Ports.length; index++) {
                                        const element = parsed.Ports[index];
                                        powerPorts.push({
                                            Name: element.DevicePortName,
                                            CompositeName: element.CompositePortName,
                                            Gender: element.PortGender,
                                            PortUse: element.DevicePortUse,
                                            PortType: element.DevicePortType,
                                            EntID: element.DevicePortID
                                        });
                                    }
                                    setRightPowerPortData(powerPorts);
                                }
                            } catch (error) {
                                console.error('error :', error);

                            }
                        }
                    }
                }, statusbarContext)
                axiosInterceptor({
                    url: CABLING.GetDevicePort,
                    data: {
                        deviceEntID: deviceData.DeviceID,
                        isPower: false
                    },
                    setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                        if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object" && 'portsJson' in getConnectivityApiResponse) {
                            try {
                                const parsed = JSON.parse(getConnectivityApiResponse.portsJson as string);
                                if (parsed && typeof parsed === "object" && 'Ports' in parsed && Array.isArray(parsed.Ports)) {
                                    const powerPorts: IPortDataItem[] = [];
                                    for (let index = 0; index < parsed.Ports.length; index++) {
                                        const element = parsed.Ports[index];
                                        powerPorts.push({
                                            Name: element.DevicePortName,
                                            CompositeName: element.CompositePortName,
                                            Gender: element.PortGender,
                                            PortUse: element.DevicePortUse,
                                            PortType: element.DevicePortType,
                                            EntID: element.DevicePortID
                                        });
                                    }
                                    setRightNetworkPortData(powerPorts);
                                }
                            } catch (error) {
                                console.error('Error in handle api response :', error);

                            }
                        }
                    }
                }, statusbarContext)
            }
            const deviceDetails: IPlacementDevice = {
                Name: editDeviceReplacementProps.selectedNodeExplorer.Name ?? "",
                _Device: editDeviceReplacementProps.selectedNodeExplorer.Name ?? "",
                EntityName: editDeviceReplacementProps.selectedNodeExplorer.NodeEntityname ?? "",
                EntId: editDeviceReplacementProps.selectedNodeExplorer.NodeEntID ?? "",
                RURequired: editDeviceReplacementProps.selectedNodeExplorer.SlotsNeeded,
                power: editDeviceReplacementProps.selectedNodeExplorer.Power ?? 0,
                thermal: editDeviceReplacementProps.selectedNodeExplorer.Thermal ?? 0,
                powerport: editDeviceReplacementProps.selectedNodeExplorer.HasNetworkPorts ?? 0,
                networkport: editDeviceReplacementProps.selectedNodeExplorer.HasNetworkPorts ?? 0,
                Weight: editDeviceReplacementProps.selectedNodeExplorer.Weight ?? 0,
                DeviceID: editDeviceReplacementProps.selectedNodeExplorer.NodeEntID ?? "",
                StartMountIndex: 0
            }
            handleClickIgnoreConflict(deviceDetails);
            setSelectedDevice(deviceDetails);
            const explorerDeviceWo = normalizeWoidValue(
                (editDeviceReplacementProps.selectedNodeExplorer as any)?.WOID
                ?? (editDeviceReplacementProps.selectedNodeExplorer as any)?.woid
            );
            if (explorerDeviceWo) {
                setCreatedReplaceWoid("");
            }
            restoredMappingTokenRef.current = "";
        } else {
            setSelectedDevice(undefined);
            setRightNetworkPortData([]);
            setRightPowerPortData([]);
            setColumnDefsPowerPort([]);
            setRightDeviceBasicProps([]);
            setColumnDefsNetworkPort([]);
            setCreatedReplaceWoid("");
            setIsWorkorderDeviceMatched(false);
            restoredMappingTokenRef.current = "";
        }
    }, [
        editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.WOID,
        (editDeviceReplacementProps.selectedNodeExplorer as any)?.woid,
        editDeviceReplacementProps.selectedNodeExplorer
    ])



    const handleNodeSelect = (selectedNode?: ITreeNode, _treeNodes?: ITreeNode[], isTargetNotFound?: boolean): void => {
        restoredMappingTokenRef.current = "";

        const isDeviceNode = Boolean(
            selectedNode &&
            selectedNode.NodeEntID &&
            selectedNode.NodeEntityname &&
            selectedNode.NodeEntityname.toLowerCase() !== "__rack" &&
            selectedNode.NodeType?.toLowerCase() !== "bin" &&
            (Number(selectedNode.SlotsNeeded) > 0 || Boolean(selectedNode.EQID) || Boolean((selectedNode as any).eqid))
        );

        if (isDeviceNode && selectedNode && selectedNode.NodeEntID && selectedNode.NodeEntityname) {
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDeviceBasicProps([]);

            setRightPowerPortData((prev) =>
                prev.map((r) => ({
                    ...r,
                    tooltip: "",
                    connectedportEntId: "",
                    connectedportEntityName: "",
                    transferportlabel: false
                }))
            );
            setRightNetworkPortData((prev) =>
                prev.map((r) => ({
                    ...r,
                    tooltip: "",
                    connectedportEntId: "",
                    connectedportEntityName: "",
                    transferportlabel: false
                }))
            );

            let payload = {
                entityName: selectedNode.NodeEntityname
            }

            axiosInterceptor({
                url: EM.GetTableVsProperty,
                data: payload,
                setFetchData: (getTablevsPropertyApiResp: unknown, status?: string) => {
                    if (status === "200" && getTablevsPropertyApiResp) {
                        if (Array.isArray(getTablevsPropertyApiResp) && getTablevsPropertyApiResp.length) {

                            let oneToOneTables: string[] = [];
                            let columnList: UnknownRecord[] = [];
                            for (let index = 0; index < getTablevsPropertyApiResp.length; index++) {
                                const element = getTablevsPropertyApiResp[index];
                                if (!element.isOneToManyRelation) {
                                    oneToOneTables.push(element.tableName);
                                    if (element.properties) {
                                        const parsedArray = FnParseJsonSafely(element.properties)
                                        columnList = [...columnList, ...parsedArray];
                                    }
                                }

                            }

                            if (oneToOneTables.length > 0) {
                                axiosInterceptor({
                                    url: EM.GetAllTablesRecord,
                                    data: {
                                        entID: selectedNode.NodeEntID,
                                        tableNames: oneToOneTables.join(DELIMITER.separator),
                                    },
                                    setFetchData: (response: unknown) => {
                                        try {
                                            if (response && typeof response === "object" && 'jsonStringOutput' in response) {
                                                if (response.jsonStringOutput) {
                                                    const jsonData = JSON.parse(response.jsonStringOutput as string);
                                                    const result: BasicPropItem[] = [];
                                                    const deviceProps = [
                                                        "_Device", "Manufacturer", "MfgEqType", "MfgProdLine",
                                                        "RURequired", "Power", "Thermal", "Power port", "Network port",
                                                        "Weight", "EQID", "Path"
                                                    ];

                                                    if (!Array.isArray(jsonData?.AllTables)) {
                                                        return;
                                                    }

                                                    const addedProps = new Set<string>();

                                                    jsonData.AllTables.forEach((table: UnknownRecord) => {
                                                        if (!Array.isArray(table?.TableData)) return;

                                                        table.TableData.forEach((item: UnknownRecord) => {
                                                            const itemName = String(item?.Name ?? "");
                                                            if (!deviceProps.some(p => p.toLowerCase() === itemName.toLowerCase())) return;

                                                            if (addedProps.has(itemName.toLowerCase())) return;

                                                            addedProps.add(itemName.toLowerCase());

                                                            if (itemName.toLowerCase() === "path") {
                                                                setLeftDevicePath(item.Value as string);
                                                            }

                                                            const column = columnList.find(
                                                                (column) => (column.PName as string)?.toLowerCase() === itemName.toLowerCase()
                                                            );

                                                            result.push({
                                                                Name: item.Name as string,
                                                                Value: item.Value as string,
                                                                PropertyLabel: column?.PropertyLabel as string ?? item.Name as string
                                                            });
                                                        });
                                                    });
                                                    const fetchedEqid = result.find((item) => item.Name?.toLowerCase() === "eqid")?.Value?.toString().trim() ?? "";
                                                    if (fetchedEqid && selectedNode && !selectedNode.EQID) {
                                                        (selectedNode as any).EQID = fetchedEqid;
                                                    }
                                                    setLeftDeviceBasicProps(result);
                                                    updateTemplateDeviceMatch(
                                                        fetchedEqid
                                                        || getNodeEqid(selectedNode)
                                                        || (selectedNode as any)?.eqid?.toString().trim()
                                                        || ""
                                                    );
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Error parsing device basic props:', error);
                                        }
                                    }
                                }, statusbarContext);

                            }

                        }
                    }
                }
            }, statusbarContext)

            axiosInterceptor({
                url: CABLING.GetDevicePort,
                data: {
                    deviceEntID: selectedNode.NodeEntID,
                    isPower: true
                },
                setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                    let powerPorts: IPortDataItem[] = [];
                    if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object") {
                        try {
                            const rawPortsJson = (getConnectivityApiResponse as Record<string, unknown>).portsJson;
                            const parsed = typeof rawPortsJson === "string" ? FnParseJsonSafely(rawPortsJson) : rawPortsJson;
                            const portsArray = (parsed as any)?.Ports ?? (getConnectivityApiResponse as any)?.Ports;
                            if (Array.isArray(portsArray) && portsArray.length > 0) {
                                for (let index = 0; index < portsArray.length; index++) {
                                    const element = portsArray[index];
                                    powerPorts.push({
                                        Name: element.DevicePortName,
                                        CompositeName: element.CompositePortName,
                                        Gender: element.PortGender,
                                        PortUse: element.DevicePortUse,
                                        PortType: element.DevicePortType,
                                        EntID: element.DevicePortID
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing left power ports:', error);
                        }
                    }
                    setLeftPowerPortData(powerPorts);
                }
            }, statusbarContext)
            axiosInterceptor({
                url: CABLING.GetDevicePort,
                data: {
                    deviceEntID: selectedNode.NodeEntID,
                    isPower: false
                },
                setFetchData: (getConnectivityApiResponse: unknown, status?: string) => {
                    let networkPorts: IPortDataItem[] = [];
                    if (status === "200" && getConnectivityApiResponse && typeof getConnectivityApiResponse === "object") {
                        try {
                            const rawPortsJson = (getConnectivityApiResponse as Record<string, unknown>).portsJson;
                            const parsed = typeof rawPortsJson === "string" ? FnParseJsonSafely(rawPortsJson) : rawPortsJson;
                            const portsArray = (parsed as any)?.Ports ?? (getConnectivityApiResponse as any)?.Ports;
                            if (Array.isArray(portsArray) && portsArray.length > 0) {
                                for (let index = 0; index < portsArray.length; index++) {
                                    const element = portsArray[index];
                                    networkPorts.push({
                                        Name: element.DevicePortName,
                                        CompositeName: element.CompositePortName,
                                        Gender: element.PortGender,
                                        PortUse: element.DevicePortUse,
                                        PortType: element.DevicePortType,
                                        EntID: element.DevicePortID
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing left network ports:', error);
                        }
                    }
                    setLeftNetworkPortData(networkPorts);
                }
            }, statusbarContext)
            setDefaultSelectedNode(selectedNode);
            updateTemplateDeviceMatch(
                getNodeEqid(selectedNode)
                || (selectedNode as any)?.eqid?.toString().trim()
                || ""
            );
        } else {
            setDefaultSelectedNode(undefined);
            setMatchedProfileInfo(null);
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDeviceBasicProps([]);
            setLeftDevicePath(undefined);
            setIsWorkorderDeviceMatched(false);
        }
    };

    const handleOptin = async () => {
        const existingDeviceWoid = getExplorerDeviceWoid() || createdReplaceWoid;
        if (existingDeviceWoid) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                `To update your replacement profile first delete its workorder (${existingDeviceWoid}) and try again`
            );
            return;
        }

        const eqid =
            rightDeviceBasicProps.find(
                (item: BasicPropItem) => item.Name?.toLowerCase() === "eqid"
            )?.Value?.toString().trim()
            || editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
            || selectedDevice?.EQID?.toString().trim()
            || "";
        const eqidLeft =
            leftDeviceBasicProps.find(
                (item: BasicPropItem) => item.Name?.toLowerCase() === "eqid"
            )?.Value?.toString().trim()
            || defaultSelectedNode?.EQID?.toString().trim()
            || (defaultSelectedNode as any)?.eqid?.toString().trim()
            || "";

        if (!eqid) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                "Device details not found to create workorder"
            );
            return;
        }

        if (!defaultSelectedNode || !defaultSelectedNode.NodeEntID) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                "Please select a replacement device from inventory"
            );
            return;
        }

        let generatedWoid = "";
        try {
            generatedWoid = (await callAPIForGetWorkorderName(statusbarContext)) as string;
        } catch (error) {
            console.error("Error generating WOID via MISC.ComputeCustomId:", error);
        }

        if (!generatedWoid) {
            editDeviceReplacementProps.handleShowUserMessage?.(
                "Failed to generate Workorder ID"
            );
            return;
        }

        const sourceEntId = String(
            defaultSelectedNode?.NodeEntID
            ?? (defaultSelectedNode as any)?.EntID
            ?? (defaultSelectedNode as any)?.EntId
            ?? ""
        );
        const sourceEntityName = String(
            defaultSelectedNode?.NodeEntityname
            ?? (defaultSelectedNode as any)?.EntityName
            ?? "Device"
        );
        const sourceDevice = String(
            defaultSelectedNode?.Name
            ?? (defaultSelectedNode as any)?._Device
            ?? ""
        );
        const sourceEqid = String(
            eqidLeft
            || defaultSelectedNode?.EQID?.toString().trim()
            || (defaultSelectedNode as any)?.eqid?.toString().trim()
            || ""
        );
        const sourcePath = String(
            leftDevicePath
            || defaultSelectedNode?.NodePath
            || (defaultSelectedNode as any)?.nodePath
            || (defaultSelectedNode as any)?.node?.NodePath
            || (defaultSelectedNode as any)?.Path
            || sourceDevice
            || ""
        );

        const destEntId = String(
            editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID
            ?? selectedDevice?.EntId
            ?? ""
        );
        const destEntityName = String(
            editDeviceReplacementProps.selectedNodeExplorer?.NodeEntityname
            ?? selectedDevice?.EntityName
            ?? "Device"
        );
        const destDevice = String(
            editDeviceReplacementProps.selectedNodeExplorer?.Name
            ?? selectedDevice?._Device
            ?? selectedDevice?.Name
            ?? ""
        );
        const destEqid = String(
            eqid
            || editDeviceReplacementProps.selectedNodeExplorer?.EQID?.toString().trim()
            || selectedDevice?.EQID?.toString().trim()
            || ""
        );
        const destPath = String(
            rightDevicePath
            || editDeviceReplacementProps.selectedNodeExplorer?.NodePath
            || (editDeviceReplacementProps.selectedNodeExplorer as any)?.nodePath
            || (editDeviceReplacementProps.selectedNodeExplorer as any)?.node?.NodePath
            || (editDeviceReplacementProps.selectedNodeExplorer as any)?.Path
            || (selectedDevice as any)?.Path
            || destDevice
            || ""
        );

        const getPortName = (port: any): string => {
            return String(
                port?.Name
                || port?.DevicePortName
                || port?.PortName
                || (port?.CompositeName ? String(port.CompositeName).split('.').pop() : "")
                || ""
            ).trim();
        };

        const getPortView = (port: any): string => {
            const rawView = String(port?.ViewName || port?.View || port?.DevicePortView || "").trim();
            if (rawView.toLowerCase().includes("rear") || String(port?.CompositeName || "").includes("(R)")) {
                return "Rear";
            }
            return "Front";
        };

        const portmappings: Array<{ source: string; sourceview: string; dest: string; destview: string }> = [];

        if (rightPowerPortData.length) {
            for (let index = 0; index < rightPowerPortData.length; index++) {
                const element = rightPowerPortData[index];
                if (element.connectedportEntId) {
                    const filterSelecteditem = leftPowerPortData.find((item) =>
                        String(item.EntID) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.EntID)
                    );
                    if (filterSelecteditem) {
                        portmappings.push({
                            source: getPortName(filterSelecteditem),
                            sourceview: getPortView(filterSelecteditem),
                            dest: getPortName(element),
                            destview: getPortView(element)
                        });
                    }
                }
            }
        }

        if (rightNetworkPortData.length) {
            for (let index = 0; index < rightNetworkPortData.length; index++) {
                const element = rightNetworkPortData[index];
                if (element.connectedportEntId) {
                    const filterSelecteditem = leftNetworkPortData.find((item) =>
                        String(item.EntID) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.connectedportEntId) ||
                        String(item.connectedportEntId) === String(element.EntID)
                    );
                    if (filterSelecteditem) {
                        portmappings.push({
                            source: getPortName(filterSelecteditem),
                            sourceview: getPortView(filterSelecteditem),
                            dest: getPortName(element),
                            destview: getPortView(element)
                        });
                    }
                }
            }
        }

        const finalDestPath = destPath || destDevice;
        const finalSourcePath = sourcePath || sourceDevice;
        const finalDestName = destDevice || editDeviceReplacementProps.selectedNodeExplorer?.Name || "";

        const payload = {
            desteqid: destEqid,
            sourceeqid: sourceEqid,
            destpath: finalDestPath,
            sourcepath: finalSourcePath,
            destname: finalDestName
        };
        const messageObj = FnFindMessageAndReplaceVariables(payload, "Replace");
        let msg = "";
        const replaceDevice = messageObj?.["Replace Device"];
        if (replaceDevice && typeof replaceDevice === "object") {
            const m = (replaceDevice as UnknownRecord).message;
            if (typeof m === "string") msg = m;
        }
        if (!msg) {
            msg = `Replace device model ${destEqid} with ${sourceEqid} by replacing ${finalDestPath} with ${finalSourcePath} and return ${finalDestName} to Used bin`;
        }

        const replacementProfileWoid = getReplacementTemplateWoidOnly() || matchedProfileInfo?.woid || "";

        const itemJsonObj = {
            source: {
                EntId: sourceEntId,
                EntityName: sourceEntityName,
                _Device: sourceDevice,
                EQID: sourceEqid,
                Path: sourcePath
            },
            dest: {
                EntId: destEntId,
                EntityName: destEntityName,
                _Device: destDevice,
                EQID: destEqid,
                Path: destPath
            },
            action: "Replace",
            ReplacementProfile: replacementProfileWoid,
            Workordername: generatedWoid,
            message: msg,
            portmapping: portmappings,
            transferlabel: isTransferPortLabel ? "True" : "False"
        };

        const woItems: UnknownRecord[] = [
            {
                ItemJson: JSON.stringify(itemJsonObj),
                SeqNo: 1
            }
        ];

        const result = await FnCreateWorkOrderApiCalls({
            action: "Replacement",
            WorkorderType: "Replacement",
            ParentEntityName: defaultSelectedNode?.NodeEntityname ?? "",
            ParentID: defaultSelectedNode?.NodeEntID ?? "",
            statusBarContext: statusbarContext,
            sessionContext: sessionContext,
            workOrderProfileName: generatedWoid,
            DESC250: "",
            workOrderItems: woItems
        });

        if (result) {
            alertProfilesCacheRef.current = null;
            const finalWoid =
                (result as any)?.workorderProfile?.[0]?._WorkorderProfile
                || (result as any)?.workorderProfile?.[0]?._Workorder
                || (result as any)?.woid
                || generatedWoid;

            setCreatedReplaceWoid(finalWoid);

            editDeviceReplacementProps.handleShowUserMessage?.(
                `Replacement profile (${finalWoid}) created successfully`
            );

            if (destEntId) {
                try {
                    await FnCallApiForUpdateDeviceWoProfile(
                        destEntId,
                        finalWoid,
                        statusbarContext,
                        editDeviceReplacementProps.featureId
                    );
                } catch (err) {
                    console.error("Error updating device workorder profile:", err);
                }
            }

            if (sourceEntId && sourceEntId !== destEntId) {
                try {
                    await FnCallApiForUpdateDeviceWoProfile(
                        sourceEntId,
                        finalWoid,
                        statusbarContext,
                        editDeviceReplacementProps.featureId
                    );
                } catch (err) {
                    console.error("Error updating source device workorder profile:", err);
                }
            }

            setTreeRefreshKey((prev) => prev + 1);
            editDeviceReplacementProps.handleReloadTree?.(
                editDeviceReplacementProps.featureId,
                destEntId
            );
        }
    };

    const handleOptout = async (): Promise<void> => {
        const woidToDelete = getExplorerDeviceWoid() || createdReplaceWoid || "";
        const deviceEntId = editDeviceReplacementProps.selectedNodeExplorer?.NodeEntID ?? "";
        const deviceName = editDeviceReplacementProps.selectedNodeExplorer?.Name ?? "";

        if (!woidToDelete && !deviceEntId) {
            editDeviceReplacementProps.handleShowUserMessage?.("No workorder found to delete");
            return;
        }

        statusbarContext.setIsLoading(true);

        try {
            let profileEntId = "";
            let finalWoid = woidToDelete;
            let workorderItems: ParsedWorkorderItem[] = [];

            if (woidToDelete) {
                try {
                    const details = await fetchWorkorderDetails(woidToDelete, true);
                    workorderItems = details.items || [];
                    if (details.profiles && details.profiles.length > 0) {
                        for (const p of details.profiles as any[]) {
                            const ent = p?.EntID ?? p?._WorkorderProfileEntID ?? p?.ProfileEntID;
                            if (ent) {
                                profileEntId = String(ent);
                                break;
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error reading WorkorderProfile from fetchWorkorderDetails:", err);
                }
            }

            if (!profileEntId) {
                let allProfiles: UnknownRecord[] = [];
                try {
                    allProfiles = await new Promise<UnknownRecord[]>((resolve) => {
                        axiosInterceptor({
                            url: ALERT.GetAlertProfiles,
                            data: {
                                entityName: "WorkorderProfile",
                            },
                            setFetchData: (handleApiResp: unknown, status?: string) => {
                                if (status === "200" && handleApiResp && typeof handleApiResp === "object" && 'alertJson' in handleApiResp) {
                                    try {
                                        const data = FnHandleAPIResponse((handleApiResp as any).alertJson, "Dataset");
                                        resolve(Array.isArray(data) ? data : []);
                                    } catch {
                                        resolve([]);
                                    }
                                } else {
                                    resolve([]);
                                }
                            }
                        }, statusbarContext);
                    });
                } catch {
                    allProfiles = [];
                }

                if (!allProfiles.length) {
                    try {
                        allProfiles = (await FnGetWorkOrderProfile(sessionContext, statusbarContext)) as UnknownRecord[];
                    } catch {
                        allProfiles = [];
                    }
                }

                const woidNorm = (woidToDelete || "").trim().toLowerCase();
                const matchedProfile = allProfiles.find((item: UnknownRecord) => {
                    const pName = String(item._WorkorderProfile ?? item.WorkorderProfile ?? item._Workorder ?? item.Name ?? "").trim().toLowerCase();
                    if (woidNorm && pName === woidNorm) return true;
                    if (deviceEntId && (String(item.ParentID) === String(deviceEntId) || String(item.DeviceID) === String(deviceEntId))) return true;
                    return false;
                });

                if (matchedProfile && (matchedProfile as any).EntID) {
                    profileEntId = String((matchedProfile as any).EntID);
                    if (!finalWoid) {
                        finalWoid = String(matchedProfile._WorkorderProfile ?? matchedProfile.WorkorderProfile ?? matchedProfile._Workorder ?? "");
                    }
                }
            }

            if (!profileEntId) {
                editDeviceReplacementProps.handleShowUserMessage?.(
                    finalWoid ? `Workorder(${finalWoid}) profile record not found to delete` : "Workorder profile record not found to delete"
                );
                return;
            }

            await new Promise<void>((resolve, reject) => {
                axiosInterceptor({
                    url: EM.DeleteTableRecords,
                    data: {
                        entityName: "WorkorderProfile",
                        tableName: "PG.WorkorderItem",
                        entIDs: profileEntId,
                    },
                    allowShowLoader: true,
                    setFetchData: (_response: unknown, status?: string) => {
                        if (status === "200") resolve();
                        else reject(new Error("Failed to delete workorder items"));
                    }
                }, statusbarContext);
            });

            await new Promise<void>((resolve, reject) => {
                axiosInterceptor({
                    url: EM.DeleteTableRecords,
                    data: {
                        entityName: "WorkorderProfile",
                        tableName: "_WorkorderProfile",
                        entIDs: profileEntId,
                    },
                    allowShowLoader: true,
                    setFetchData: (_response: unknown, status?: string) => {
                        if (status === "200") resolve();
                        else reject(new Error("Failed to delete workorder profile"));
                    }
                }, statusbarContext);
            });

            if (finalWoid) {
                await new Promise<void>((resolve) => {
                    axiosInterceptor({
                        url: DEVICE.ClearWoid,
                        data: {
                            woid: finalWoid
                        },
                        setFetchData: (_: unknown) => resolve()
                    }, statusbarContext);
                });
            }

            if (deviceEntId) {
                try {
                    await FnCallApiForUpdateDeviceWoProfile(
                        deviceEntId,
                        "",
                        statusbarContext,
                        editDeviceReplacementProps.featureId
                    );
                } catch (err) {
                    console.error("Error clearing device workorder profile:", err);
                }
            }

            let sourceDeviceId = defaultSelectedNode?.NodeEntID ?? "";
            let sourceDeviceName = defaultSelectedNode?.Name ?? "";
            if ((!sourceDeviceId || sourceDeviceId === deviceEntId) && workorderItems.length > 0) {
                for (const it of workorderItems) {
                    try {
                        const parsed = typeof it.ItemJson === "string" ? JSON.parse(it.ItemJson) : it.ItemJson;
                        const sEnt = parsed?.source?.EntId || parsed?.fromDevice?.EntId;
                        const dEnt = parsed?.dest?.EntId || parsed?.toDevice?.EntId;
                        const sName = parsed?.source?._Device || parsed?.source?.Name || parsed?.fromDevice?.Name || "";
                        const dName = parsed?.dest?._Device || parsed?.dest?.Name || parsed?.toDevice?.Name || "";

                        if (sEnt && String(sEnt) !== String(deviceEntId)) {
                            sourceDeviceId = String(sEnt);
                            sourceDeviceName = String(sName);
                            break;
                        } else if (dEnt && String(dEnt) !== String(deviceEntId)) {
                            sourceDeviceId = String(dEnt);
                            sourceDeviceName = String(dName);
                            break;
                        }
                    } catch { }
                }
            }

            if (sourceDeviceId && sourceDeviceId !== deviceEntId) {
                try {
                    await FnCallApiForUpdateDeviceWoProfile(
                        sourceDeviceId,
                        "",
                        statusbarContext,
                        editDeviceReplacementProps.featureId
                    );
                } catch (err) {
                    console.error("Error clearing source device workorder profile:", err);
                }
            }

            workorderCacheRef.current.clear();
            workorderInFlightRef.current.clear();
            setCreatedReplaceWoid("");
            setTargetTreeEqid("");
            templateProfileTargetEqidRef.current = "";
            setIsWorkorderDeviceMatched(false);
            setDefaultSelectedNode(undefined);
            setMatchedProfileInfo(null);
            alertProfilesCacheRef.current = null;
            setLeftPowerPortData([]);
            setLeftNetworkPortData([]);
            setLeftDeviceBasicProps([]);
            setLeftDevicePath(undefined);
            restoredMappingTokenRef.current = "";

            editDeviceReplacementProps.handleShowUserMessage?.(
                finalWoid
                    ? `Successfully deleted replacement workorder (${finalWoid})`
                    : "Successfully deleted replacement workorder"
            );
            setTreeRefreshKey((prev) => prev + 1);
            editDeviceReplacementProps.handleReloadTree?.(
                editDeviceReplacementProps.featureId,
                deviceEntId
            );
        } catch (error) {
            console.error("Error during optout:", error);
            const msg = error instanceof Error ? error.message : "Failed to delete replacement workorder";
            editDeviceReplacementProps.handleShowUserMessage?.(msg);
        } finally {
            statusbarContext.setIsLoading(false);
        }
    };

    function handleSelectedTabs(tab: string[]): void {
        if (tab.includes("OptOut") || tab.includes("Optout")) {
            handleOptout();
        } else if (tab.includes("OptIn") || tab.includes("Optin")) {
            handleOptin();
        }
    }

    function handleClose(_event: unknown, _actionCode?: string | undefined, _payload?: unknown): void {
        editDeviceReplacementProps.handleSidebarClose?.();
    }

    const explorerDeviceWoid = getExplorerDeviceWoid() || createdReplaceWoid;
    const replacementTemplateWoid = getReplacementTemplateWoidOnly();
    const isDeviceNodeSelected = Boolean(defaultSelectedNode && defaultSelectedNode.NodeEntID);

    const overlayTabs = explorerDeviceWoid
        ? [
            {
                uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optout`,
                label: {
                    uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optout-label`,
                    label: "OptOut",
                    tooltip: "OptOut"
                },
                w: "auto",
                h: "calc(var(--node_height) - var(--spacing-1))",
                actionCode: "OptOut",
                handleMouse: function (): void {
                    handleOptout();
                }
            }
        ]
        : (replacementTemplateWoid && isDeviceNodeSelected && isWorkorderDeviceMatched) || (Boolean(matchedProfileInfo) && isDeviceNodeSelected)
            ? [
                {
                    uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optin`,
                    label: {
                        uniqueName: `${editDeviceReplacementProps.uniqueName}-overlay-tab-optin-label`,
                        label: "OptIn",
                        tooltip: "OptIn"
                    },
                    w: "auto",
                    h: "calc(var(--node_height) - var(--spacing-1))",
                    actionCode: "OptIn",
                    handleMouse: function (): void {
                        handleOptin();
                    }
                }
            ]
            : [];

    return (
        <div key={editDeviceReplacementProps.uniqueName} className="nz-wh-100 nz-edit-device-replacement-container">
            <div className='nz-sub-header'>
                {overlayTabs.length > 0 ? (
                    <OverlayTab
                        uniqueName={`${editDeviceReplacementProps.uniqueName}-tabs-overlay`}
                        tabs={overlayTabs}
                        ShowOnlyIcon={true}
                        allowUnSelect={true}
                        selectedTabName={""}
                        tabAlignment={"horizontal"}
                        headerText={`Replace Device`}
                        useContainer={false}
                        handleSelectedTab={handleSelectedTabs}
                    />
                ) : (
                    <Label label={"Replace Device"} uniqueName={`${editDeviceReplacementProps.uniqueName}-title`} />
                )}
                <ActionImage uniqueName={`${editDeviceReplacementProps.uniqueName}-explorer-tree-info-ai`}
                    image={{
                        uniqueName: `${editDeviceReplacementProps.uniqueName}-explorer-tree-info-image`,
                        source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                            fill="none"
                            strokeWidth={1} />,
                        w: 'var(--image-size-2)',
                        tooltip: "Click to view node details in sidebar",
                        type: "svg"

                    }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'} handleMouse={handleClose} />

            </div>
            <Splitter tabIndex={-1} className="nz-wh-100 nz-edit-device-replacement-content">
                {/* 1 Replace With (previous RIGHT pane) */}
                <SplitterPanel tabIndex={-1} size={30} minSize={20} className="nz-wh-100 nz-d-flex-column nz-edit-device-replacement-pane2 nz-pane-2">
                    <div className="nz-replacement-container">
                        {
                            selectedDevice ? <div className="nz-wh-100 nz-replacement-container">
                                <div className='nz-w-100 nz-sub-header nz-alert-delivery-main-header'>
                                    <Label uniqueName={`${editDeviceReplacementProps.uniqueName}-edit-replacement-pane2`}
                                        label={`Device Replacement : (${selectedDevice?._Device})`} />

                                </div>
                                <div className="nz-h-auto">
                                    <BasicGrid
                                        uniqueName={`${editDeviceReplacementProps.uniqueName}-device-props2`}
                                        instanceName={"deviceprops2"}
                                        showGrid={true}
                                        allowColumnResize={true}
                                        allowAutoSizeColumn={true}
                                        columnDefs={columnDefsForDeviceProps}
                                        rowData={rightDeviceBasicProps}
                                        containerName={"deviceprops2"} />
                                </div>
                                {rightPowerPortData.length && columnDefsPowerPort ? <div
                                    className="nz-h-auto nz-readonly-port-grid"
                                > <DevicePortGrid
                                        uniqueName={`${editDeviceReplacementProps.uniqueName}-right-power-port`}
                                        portType={"power"}
                                        instanceName={"pane2powerport"}
                                        featureId={editDeviceReplacementProps.featureId}
                                        columnDefs={columnDefsPowerPort}
                                        allowHeader={true}
                                        headerText={`Power Ports (${selectedDevice?._Device})`}
                                        rowData={rightPowerPortData} /></div> : <></>}
                                {rightNetworkPortData.length && columnDefsNetworkPort ? <div
                                    className="nz-h-auto nz-readonly-port-grid"
                                ><DevicePortGrid
                                        uniqueName={`${editDeviceReplacementProps.uniqueName}-right-network-port`}
                                        portType={"network"}
                                        instanceName={"pane2networkport"}
                                        featureId={editDeviceReplacementProps.featureId}
                                        columnDefs={columnDefsNetworkPort}
                                        allowHeader={true}
                                        headerText={`Network Ports (${selectedDevice?._Device})`}
                                        rowData={rightNetworkPortData} /></div> : <></>}
                            </div> :
                                <div className="nz-error-message" >
                                    <Label uniqueName={`${editDeviceReplacementProps.uniqueName}-no-selected`} label={"Please Select Device to Replace"} />
                                </div>}
                    </div>
                </SplitterPanel>

                {/* 2 DCExplorer (NEW / EMPTY for now) */}
                <SplitterPanel tabIndex={-1} size={25} minSize={15} className="nz-wh-100 nz-d-flex-column nz-pane-3">
                    <div className="nz-dc-explorer-container">


                        <div className='nz-sub-header'>
                            <Label label={"Matching devices in Inventory"} uniqueName={`${editDeviceReplacementProps.uniqueName}-title`} />
                        </div>
                        <div>

                            <DcTreeContainer
                                uniqueName={"dcexplorer"}
                                selectedDevice={selectedDevice}
                                targetEqid={targetTreeEqid}
                                featureId={editDeviceReplacementProps.featureId}
                                handleNodeSelect={handleNodeSelect}
                                hasReplacementProfile={hasReplacementProfile}
                                isProfileLoading={Boolean(isProfileLoading || isTargetEqidLoading)}
                                treeRefreshKey={treeRefreshKey} />
                        </div>
                    </div>
                </SplitterPanel>

                {/* 3 Replace (previous LEFT pane) */}
                <SplitterPanel size={25} minSize={20} className="nz-wh-100 nz-d-flex-column nz-edit-device-replacement-pane4 nz-pane-4">
                    {leftDeviceBasicProps?.length && hasReplacementProfile ? <div className="nz-replace-container">
                        <div className='nz-sub-header'>
                            <Label label={matchedProfileInfo?.desc250 ? `Replace using Profile ${matchedProfileInfo.desc250}` : "Replace with"} uniqueName={`${editDeviceReplacementProps.uniqueName}-title`} />
                        </div>
                        <div className="nz-wh-100 nz-replacement-container">

                            <div className="nz-h-auto">
                                <BasicGrid
                                    uniqueName={`${editDeviceReplacementProps.uniqueName}-device-props1`}
                                    instanceName={"deviceprops"}
                                    showGrid={true}
                                    columnDefs={columnDefsForDeviceProps}
                                    rowData={leftDeviceBasicProps}
                                    allowAutoSizeColumn={true}
                                    allowColumnResize={true}
                                    containerName={"deviceprops"}
                                />
                            </div>
                            {leftPowerPortData.length && columnDefsPowerPort ? <div
                                className="nz-h-auto nz-readonly-port-grid"
                            > <DevicePortGrid
                                    uniqueName={`${editDeviceReplacementProps.uniqueName}-left-power-port`}
                                    portType={"power"}
                                    instanceName={"pane4powerport"}
                                    featureId={editDeviceReplacementProps.featureId}
                                    columnDefs={columnDefsPowerPort}
                                    allowHeader={true}
                                    headerText={`Power Ports (${defaultSelectedNode?.Name})`}
                                    rowData={leftPowerPortData} /></div> : <></>}
                            {leftNetworkPortData.length && columnDefsNetworkPort ? <div
                                className="nz-h-auto nz-readonly-port-grid"
                            ><DevicePortGrid
                                    uniqueName={`${editDeviceReplacementProps.uniqueName}-left-network-port`}
                                    portType={"network"}
                                    instanceName={"pane4networkport"}
                                    featureId={editDeviceReplacementProps.featureId}
                                    columnDefs={columnDefsNetworkPort}
                                    allowHeader={true}
                                    headerText={`Network Ports (${defaultSelectedNode?.Name})`}
                                    rowData={leftNetworkPortData} /></div> : <></>}
                        </div>
                    </div> : <div className="nz-error-message" > <Label uniqueName={`${editDeviceReplacementProps.uniqueName}-no-selected`} label={"No Device Selected, Please Select Device"} /></div>}
                </SplitterPanel>

            </Splitter>

        </div>
    )
}

export { CreateReplacementContainer }
export default CreateReplacementContainer

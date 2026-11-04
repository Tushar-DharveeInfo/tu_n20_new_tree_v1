import { useEffect, useRef, useState } from "react";
import { Key } from "rc-tree/lib/interface";
import { useStatusBarContext } from "../../../../../shared/context/hooks/StatusBarHooks";
import { axiosInterceptor, axiosInterceptorForPostResponse } from "../../../../../shared/interceptors/Interceptor";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { geocode, IWaypointEditorProps, IPoiMarkerItem, WaypointEditor, IMapProfile, initializeGoogleMapsService, isGoogleMapsServiceInitialized } from '@n20a/libgmap';
import "../../../../allcss/appqasettingscontainer/datacenterinterconnect/DataCenterInterconnect.css";
import '@n20a/libgmap/scoped.css';
import { DCI, EM, EXPAPI, LOG } from "../../../../../shared/interceptors/EndPoints";
import { RtmLabelForDCI } from "../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { FnConvertHierarchicalDataToTree } from "../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { ITreeForHierarchicalDataContainer } from "../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { TreeForHierarchicalDataContainer } from "../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { ISelectedNodeInfo, ITreeNode } from "../../../../../shared/allinterface/tree/ITreeControl";
import { IDataCenterInterconnect } from "../../../../allinterface/iappqasettingscontainer/datacenterinterconnect/IDataCenterInterconnect";
import { DciContainer } from "./dcicontainer/DciContainer";
import { RightMouseMenuGrid } from "../../../../../constants/Feature";
import { FnHandleAPIResponse } from "../../../../../shared/allcommon/settingsform/FnHandleAPIResponse";
import { IActionImage } from "../../../../../shared/allinterface/basic/IActionImage";
import { AddDCI24x24, EditWaypoints24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../appcontainer/allcommon/FnGetCssVariable";
import { YesNoFormContainer } from "../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { IActionImageForSubMenu } from "../../../../../shared/allinterface/basic/IActionImageList";
import { FnParseJsonSafely } from "../../../../../appcontainer/allcommon/FnParseJsonSafely";
import { IConvertedTreeResponse } from "../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { FnGetExpApiUrlBasedOnEndPoint } from "../../../../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint";
import { IServerEnvItem } from "../../../../../shared/allinterface/IGoogleMap";

const DataCenterInterconnect = (dciProps: IDataCenterInterconnect) => {
    const [selectedNode, setSelectedNode] = useState<ITreeNode | null>(null)
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<IActionImageForSubMenu | null>(null)
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [isShowOkButton, setIsShowOkButton] = useState<boolean>(false);
    const [waypointMarker, setWaypointMarker] = useState<IWaypointEditorProps>();

    const mapProfileRef = useRef<IMapProfile>(undefined);
    const focusedRef = useRef<HTMLDivElement | null>(null);
    const selectedDciEntIDRef = useRef<any>(null)

    const statusBarContext = useStatusBarContext();

    const prefixString = "GOOGLEMAP__"

    const dciTreeContainerProps: ITreeForHierarchicalDataContainer = {
        uniqueName: dciProps.uniqueName,
        featureId: dciProps.selectedFeatureItem._Feature?.toString() ?? "",
        featureTreeProps: {
            instanceName: "dci_left_tree",
            hideKebabMenu: false,
            allowCheckbox: false,
            allowIcon: false,
            isAllowDrag: false,
            hideCopyIcon: false,
            reuseFromCache: false,
            isAllowDrop: false,
            allowInternalDrag: true,
            openAllNodes: false
        },
        allowGenerateTreeData: false,
        defaultExpandedKeys: [],
        defaultCheckedKeys: [],
        isSiteByTenant: false,
        isFloorTree: false,
        allowAPICallOnExpand: false,
        allowAdd: true,
        allowEdit: false,
        allowDelete: true,
        allowMultiple: false,
        className: "tree-container",
        selectedNodeExplorer: undefined,
        allowGenerateUID: true,
        apiData: undefined
    }

    const customIcons: IActionImage[] = [{
        uniqueName: `${dciProps.uniqueName}-ai-clone`,
        image: {
            uniqueName: `${dciProps.uniqueName}-i-clone`,
            source: <EditWaypoints24x24
                size={FnGetCssVariable('--image-size-2')}
                fill='none'
                strokeWidth={1} />,
            w: 'var(--image-size-2)',
            tooltip: 'Edit Waypoints'
        },
        w: 'var(--node_height)',
        disabled: false,
        actionCode: 'editwaypoint',
        handleMouse: function (): void { }
    }];

    const handleApiCallLoadDCITree = (RecID: string | undefined) => {
        const handleApiResponseUpdateTableRecord = (response: unknown, status?: string) => {
            if (status === "200" && response && typeof response === "object" && 'dciJson' in response && response.dciJson) {
                const apiData = FnParseJsonSafely(response.dciJson as string)
                FnConvertHierarchicalDataToTree(apiData, dciTreeContainerProps, RecID).then(
                    (result: IConvertedTreeResponse | undefined) => {
                        if (result) {

                            setTreeData(result.treeData);
                            setExpandedKeys(result.expandedKeys);
                            if (result.selectedKey && result.selectedNode) {

                                setSelectedKeys([result.selectedKey]);
                                result.selectedNode && setDefaultSelectedNodeInfo({
                                    event: 'select',
                                    selected: true,
                                    node: result.selectedNode,
                                    selectedNodes: [result.selectedNode]
                                });
                                setSelectedNode(result.selectedNode)
                                selectedDciEntIDRef.current = result.selectedNode.NodeEntID ? result.selectedNode.NodeEntID : result.selectedNode.key
                            }
                        }
                        else {
                            setTreeData([]);
                        }
                    }
                );
            }
        }
        axiosInterceptor({
            url: DCI.DciHierarchy,
            data: {},
            setFetchData: handleApiResponseUpdateTableRecord
        }, statusBarContext)
    }

    useEffect(() => {
        handleApiCallLoadDCITree(undefined);

        const loadGoogleMapConfig = async () => {
            try {
                const apiResponse = await axiosInterceptorForPostResponse(
                    FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv),
                    { prefixString }
                );

                const payload =
                    apiResponse &&
                        typeof apiResponse === "object" &&
                        "response" in apiResponse
                        ? apiResponse.response
                        : null;

                if (
                    payload &&
                    typeof payload === "object" &&
                    "success" in payload &&
                    payload.success &&
                    "data" in payload &&
                    payload.data &&
                    typeof payload.data === "object"
                ) {
                    const mapData = (payload.data as IServerEnvItem[]).reduce<
                        Record<string, string>
                    >((acc, item) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});

                    if (!mapData) {
                        mapProfileRef.current = undefined;
                        return;
                    }
                    mapProfileRef.current = {
                        fallbackid: mapData["GOOGLEMAP__FALLBACK_ID"],
                        fallback: mapData["GOOGLEMAP__FALLBACK"],
                        apiKey: mapData["GOOGLEMAP__API_KEY"],
                        mapid: mapData["GOOGLEMAP__MAP_ID"],
                        center: { lat: 40.7128, lng: -74.006 },
                        topology: false,
                        zoom: 4,
                    };
                } else {
                    mapProfileRef.current = undefined;
                }
            } catch (error) {
                console.error("Failed to load Google Map configuration:", error);
                mapProfileRef.current = undefined;
            }
        };

        void loadGoogleMapConfig();
    }, []);

    function handleReloadDCITree(RecID: string) {
        handleApiCallLoadDCITree(RecID)
    }

    const getDciNode = (): ITreeNode | null => {
        if (!selectedNode) return null;
        if (selectedNode.NodeType?.toLowerCase() === "dcinode") {
            return selectedNode;
        }
        if (selectedNode.NodeType?.toLowerCase() === "dcisegmentnode") {
            const findParent = (nodes: ITreeNode[]): ITreeNode | null => {
                for (const node of nodes) {
                    if (selectedNode.parentEntID && node.NodeEntID === selectedNode.parentEntID) {
                        return node;
                    }
                    const found = findParent(node.children || []);
                    if (found) return found;
                }
                return null;
            };
            return findParent(treeData);
        }
        return null;
    };

    const getSelectedSegmentNode = (dciNode?: ITreeNode | null): ITreeNode | null => {
        if (selectedNode?.NodeType?.toLowerCase() === "dcisegmentnode") {
            return selectedNode;
        }
        const resolvedDci = dciNode ?? getDciNode();
        return resolvedDci?.children?.[0] ?? null;
    };

    const handleSetWaypoint = (waypoints: IPoiMarkerItem[]) => {
        if (waypoints.length) {
            const waypointRecords = waypoints.filter((item) => item.SiteEntityName?.toLowerCase() === "waypoint");
            if (waypointRecords && Array.isArray(waypointRecords) && waypointRecords.length) {
                const waypointData: { Waypoint: string }[] = [];
                for (let index = 0; index < waypointRecords.length; index++) {
                    const element = waypointRecords[index];
                    if (element.location) {
                        waypointData.push({
                            Waypoint: `${element.location.lat} ${element.location.lng}`
                        });
                    }
                }
                const dciNode = getDciNode();
                const segmentNode = getSelectedSegmentNode(dciNode);
                let payload: Record<string, any> = {};
                if (segmentNode) {
                    payload = {
                        "PG.DCIPathSegment": [{
                            "_DCI": dciNode?.Name ?? "DCI",
                            "CableType": segmentNode.CableType ?? "Fiber",
                            "Name": segmentNode.Name ?? 'Segment',
                            "SegmentGPSWayPoints": waypointData,
                            "EntID": dciNode?.NodeEntID,
                            "RecID": segmentNode.RecID,
                            "EntityName": "DCI"
                        }]
                    };
                }
                else {
                    payload = {
                        "PG.DCIPathSegment": [{
                            "_DCI": dciNode?.Name ?? "DCI",
                            "CableType": "Fiber",
                            "Name": 'Segment',
                            "SegmentGPSWayPoints": waypointData,
                            "EntID": dciNode?.NodeEntID,
                            "EntityName": "DCI"
                        }]
                    };
                }
                axiosInterceptor({
                    url: EM.AddUpdateTableRecord,
                    data: {
                        jsonString: JSON.stringify(payload)
                    },
                    setFetchData: (handleApiResponse: unknown, status?: string) => {
                        if (status === "200" && handleApiResponse && typeof handleApiResponse === "object" && 'jsonStringOutput' in handleApiResponse) {
                            let data = FnParseJsonSafely(handleApiResponse.jsonStringOutput as string)
                            if (data) {
                                data = Object.values(data)[0]
                                if (data[0].RecID) {
                                    handleReloadDCITree(data[0].RecID ?? "")
                                    setWaypointMarker(undefined);
                                }
                            }
                        }
                    }
                }, statusBarContext)
            }
        }
    }

    const getSelectedDciName = () => {
        const dciNode = getDciNode();
        if (dciNode?.Name) {
            return dciNode.Name;
        }
        return typeof dciNode?.title === "string" ? dciNode.title : dciNode?.NodeEntID ?? "selected DCI";
    }

    const buildContactAddress = (contact: Record<string, any>) => {
        const addressParts = [
            contact?.["Address1"],
            contact?.["Address2"],
            contact?.["City"],
            contact?.["State"],
            contact?.["Country"],
            contact?.["Zip"]
        ];
        return addressParts
            .filter((part) => part !== undefined && part !== null && String(part).trim() !== "")
            .join(" ");
    }

    const showMissingGpsMessage = (siteLabels: string[]) => {
        const siteMessage = siteLabels.join(" and ");
        dciProps.handleShowUserMessage?.(`GPS information is not available for DCI: "${getSelectedDciName()}". Unable to find GPS for ${siteMessage}.`);
    }

    const ensureGoogleMapsGeocoder = async () => {
        const apiResponse = await axiosInterceptorForPostResponse(FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv), {
            prefixString: prefixString
        });
        if (apiResponse && typeof apiResponse === "object" && 'response' in apiResponse) {
            const payload = apiResponse.response; // this is your parsed JSON or text
            if (payload && typeof payload === "object" && 'success' in payload && payload.success
                && 'data' in payload && typeof payload.data === "object" && payload.data
            ) {
                const mapData = (payload.data as IServerEnvItem[]).reduce<
                    Record<string, string>
                >((acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                }, {});

                if (!mapData) {
                    return;
                }
                const apiKey = mapData["GOOGLEMAP__API_KEY"];
                if (!isGoogleMapsServiceInitialized() && apiKey) {
                    await initializeGoogleMapsService(apiKey);
                }
                return true;
            }
        }
        return isGoogleMapsServiceInitialized();
    }

    const updateContactGps = (contact: Record<string, any>) => {
        const payload = {
            "PG.Contact": [contact]
        };
        // API call needed here to persist generated GPS back to PG.Contact for this From/To site record.
        axiosInterceptor({
            url: EM.AddUpdateTableRecord,
            data: {
                jsonString: JSON.stringify(payload)
            },
            allowShowLoader: true,
            setFetchData: () => { }
        }, statusBarContext);
    }

    const resolveContactGps = async (contact: Record<string, any> | undefined, siteName: string, siteRole: "From Site" | "To Site") => {
        if (!contact) {
            return undefined;
        }
        if (contact.GPS?.length) {
            return contact;
        }
        const address = buildContactAddress(contact);
        if (!address.length || !(await ensureGoogleMapsGeocoder())) {
            return undefined;
        }
        const gps = await geocode(address);
        if (!gps) {
            return undefined;
        }
        const updatedContact: Record<string, any> = {
            ...contact,
            GPS: gps.lat + "," + gps.lng
        };
        updateContactGps(updatedContact);
        return updatedContact;
    }

    const openEditWaypoint = () => {

        const dciNode = getDciNode();
        if (dciNode?.DCIFromSiteNode && dciNode.DCIToSiteNode) {
            const fromSite = dciNode.DCIFromSiteNode["SiteName"];
            const toSite = dciNode.DCIToSiteNode["SiteName"];
            if (fromSite && toSite && mapProfileRef.current) {
                axiosInterceptor({
                    url: EM.GetEntityRecords,
                    data: {
                        "entityName": "Site",
                        "tableName": "_Site",
                    },
                    setFetchData: (handleApiResp: unknown, status?: string) => {
                        if (status === "200" && handleApiResp) {
                            const parsedData = FnHandleAPIResponse(handleApiResp, "Dataset");
                            if (parsedData && typeof parsedData === "object" && parsedData["_Site"] && Array.isArray(parsedData["_Site"])) {
                                const fromSiteRecord = parsedData["_Site"].find((item) => item._Site === fromSite);
                                const toSiteRecord = parsedData["_Site"].find((item) => item._Site === toSite);
                                if (toSiteRecord && fromSiteRecord && toSiteRecord.EntID && fromSiteRecord.EntID) {
                                    axiosInterceptor({
                                        url: EM.GetEntityRecords,
                                        data: {
                                            "entityName": "Site",
                                            "tableName": "PG.Contact",
                                            "entIDs": `${fromSiteRecord.EntID};${toSiteRecord.EntID}`
                                        },
                                        setFetchData: async (handleApiResp: unknown, status?: string) => {
                                            if (status === "200" && handleApiResp) {
                                                const parsedData = FnHandleAPIResponse(handleApiResp, "Dataset");
                                                if (parsedData && typeof parsedData === "object" && parsedData["PG.Contact"] && Array.isArray(parsedData["PG.Contact"])) {
                                                    const fromContact = await resolveContactGps(
                                                        parsedData["PG.Contact"].find((item) => item.EntID === fromSiteRecord.EntID),
                                                        fromSite,
                                                        "From Site"
                                                    );
                                                    const toContact = await resolveContactGps(
                                                        parsedData["PG.Contact"].find((item) => item.EntID === toSiteRecord.EntID),
                                                        toSite,
                                                        "To Site"
                                                    );
                                                    if (fromContact?.GPS?.length && toContact?.GPS?.length) {
                                                        const fromSiteGPS = typeof fromContact.GPS === "string" ? fromContact.GPS.split(',') : ["43.082664", "-79.059389"];
                                                        const toSiteGPS = typeof toContact.GPS === "string" ? toContact.GPS.split(',') : ["43.082664", "-79.059389"];
                                                        const siteMarker: IPoiMarkerItem[] = [{
                                                            key: fromSiteRecord.EntID,
                                                            SiteEntityName: fromSiteRecord.NodeEntityname ?? "Site",
                                                            SiteEntId: fromSiteRecord.EntID,
                                                            name: fromSiteRecord._Site,
                                                            location: {
                                                                lat: +fromSiteGPS[0],
                                                                lng: +fromSiteGPS[1]
                                                            },
                                                            address: `${fromContact.Address1}${fromContact.Address2 ? ', ' + fromContact.Address2 : ''}, ${fromContact.City}, ${fromContact.State} ${fromContact.Zip} ${fromContact.Country}`,
                                                            contact: {
                                                                name: fromContact.ContactName,
                                                                email: fromContact.Email,
                                                                phone: fromContact.Phone
                                                            }
                                                        }];
                                                        const segmentNode = getSelectedSegmentNode(dciNode);
                                                        const segmentWaypoints = segmentNode?.SegmentGPSWayPoints;
                                                        if (segmentWaypoints?.length && typeof segmentWaypoints === "string") {
                                                            try {
                                                                const parsed = FnParseJsonSafely(segmentWaypoints);
                                                                if (parsed && Array.isArray(parsed) && parsed.length) {
                                                                    for (let index = 0; index < parsed.length; index++) {
                                                                        const element = parsed[index];
                                                                        if (element.Waypoint && element.Waypoint.split(' ')?.length > 1) {
                                                                            const waypoint = element.Waypoint.split(' ');
                                                                            siteMarker.push({
                                                                                key: `${fromSiteRecord.EntID}-${index}`,
                                                                                SiteEntityName: "waypoint",
                                                                                SiteEntId: "0",
                                                                                name: `waypoint-1`,
                                                                                location: {
                                                                                    lat: +waypoint[0],
                                                                                    lng: +waypoint[1]
                                                                                },
                                                                                address: `${fromContact.Address1}${fromContact.Address2 ? ', ' + fromContact.Address2 : ''}, ${fromContact.City}, ${fromContact.State} ${fromContact.Zip} ${fromContact.Country}`,
                                                                                contact: {
                                                                                    name: fromContact.ContactName,
                                                                                    email: fromContact.Email,
                                                                                    phone: fromContact.Phone
                                                                                }
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                            } catch (error) {
                                                                console.error('error :', error);
                                                            }
                                                        }
                                                        siteMarker.push({
                                                            key: toSiteRecord.EntID,
                                                            SiteEntityName: toSiteRecord.NodeEntityname ?? "Site",
                                                            SiteEntId: toSiteRecord.EntID,
                                                            name: toSiteRecord._Site,
                                                            location: {
                                                                lat: +toSiteGPS[0],
                                                                lng: +toSiteGPS[1]
                                                            },
                                                            address: `${toContact.Address1}${toContact.Address2 ? ', ' + toContact.Address2 : ''}, ${toContact.City}, ${toContact.State} ${toContact.Zip} ${toContact.Country}`,
                                                            contact: {
                                                                name: toContact.ContactName,
                                                                email: toContact.Email,
                                                                phone: toContact.Phone
                                                            }
                                                        });
                                                        if (mapProfileRef.current) {
                                                            setWaypointMarker({
                                                                rawmapprofile: mapProfileRef.current,
                                                                showTipsPanel: true,
                                                                WaypointArray: siteMarker,
                                                                setWaypointArray: handleSetWaypoint
                                                            })
                                                        }
                                                    }
                                                    else {
                                                        const missingSites: string[] = [];
                                                        if (!fromContact?.GPS?.length) {
                                                            missingSites.push(`From Site "${fromSite}"`);
                                                        }
                                                        if (!toContact?.GPS?.length) {
                                                            missingSites.push(`To Site "${toSite}"`);
                                                        }
                                                        showMissingGpsMessage(missingSites);
                                                    }
                                                }
                                            }
                                        }
                                    }, statusBarContext)
                                }
                            }
                        }
                    }
                }, statusBarContext)
            }
        }
    }

    const handleSelectNodeMenu = (selectedItem: IActionImageForSubMenu) => {
        if (selectedItem.uniqueName === RtmLabelForDCI.DeleteDciSegment) {
            if (defaultSelectedNodeInfo?.node.IsNZ) {
                dciProps.handleShowUserMessage?.("This record cannot be deleted because it is a required record for application to work.");
                return
            }
            createMessage("Common", "151", "", "", "")
        } else if (selectedItem.uniqueName === RightMouseMenuGrid.Refresh) {
            handleReloadDCITree(selectedNode?.RecID ?? "")
        }
        else if (selectedItem.uniqueName === RightMouseMenuGrid.EditWaypoints && selectedNode && (selectedNode.NodeType?.toLowerCase() === "dcinode" || selectedNode.NodeType?.toLowerCase() === "dcisegmentnode")) {
            openEditWaypoint();
        }
        else {
            setWaypointMarker(undefined);
            setSelectedKebabMenu({
                uniqueName: RtmLabelForDCI.AddDCI,
                actionCode: "Add",
                image: {
                    uniqueName: `${RtmLabelForDCI.AddDCI}-image`,
                    source: <AddDCI24x24 />,
                    w: '24px'
                },
                handleMouse: () => { },
                w: '24px'
            })
        }
    }

    const createMessage = async (projectInitial: string, msgID: string, optionalMessage: string, customMessage: string, errorMessage: string) => {
        let payload = {
            projectInitial: projectInitial,
            msgID: msgID,
            optionalMessage: optionalMessage,
            customMessage: customMessage,
            errorMessage: errorMessage
        }
        axiosInterceptor({
            url: LOG.CreateMessage,
            data: payload,
            setFetchData: (resp: unknown, status?: string) => {
                if (status === "200" && resp && typeof resp === "object" && 'finalMessage' in resp) {
                    setIsShowOkButton(false);
                    setConfirmMessage(resp.finalMessage as string);
                    setIsConfirmOpen(true);
                } else {
                    setIsConfirmOpen(false)
                    setConfirmMessage("")
                }
            }
        }, statusBarContext)
    }

    const handleConfirmYesClick = () => {
        if (selectedKebabMenu && selectedKebabMenu.uniqueName === RtmLabelForDCI.DeleteDciSegment) {
            const payload = {
                entIDs: selectedNode?.NodeEntID,
                recIDs: selectedNode?.RecID,
                tableName: "PG.DCIPathSegment"
            }
            axiosInterceptor({
                url: EM.DeleteTableRecords,
                data: payload,
                setFetchData: () => {
                    setConfirmMessage("")
                    setIsConfirmOpen(false)
                    handleApiCallLoadDCITree(undefined)
                }
            }, statusBarContext)
        } else {
            if (selectedNode?.NodeEntityname === "DCI") {
                const payload = {
                    entIDs: selectedNode?.NodeEntID,
                    entityName: selectedNode?.NodeEntityname,
                }
                axiosInterceptor({
                    url: EM.DeleteEntityRecords,
                    data: payload,
                    setFetchData: () => {
                        setConfirmMessage("")
                        setIsConfirmOpen(false)
                        setSelectedNode(null);
                        selectedDciEntIDRef.current = undefined;
                        handleApiCallLoadDCITree(undefined)
                    }
                }, statusBarContext)
            }
        }
    }

    const handleAIClick = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => {
        if (actionCode === "delete") {
            createMessage("Common", "151", "", "", "")
        } else if (actionCode === "add") {
            setWaypointMarker(undefined);
            setSelectedKebabMenu({
                uniqueName: RtmLabelForDCI.AddDCI,
                actionCode: "Add",
                image: {
                    uniqueName: `${RtmLabelForDCI.AddDCI}-image`,
                    source: <AddDCI24x24 />,
                    w: '24px'
                },
                handleMouse: () => { },
                w: '24px'
            })
        }
        else if (actionCode === "editwaypoint") {
            openEditWaypoint();
        }
    }

    useEffect(() => {
        if (selectedNode?.NodeEntID) {
            selectedDciEntIDRef.current = selectedNode?.NodeEntID
        }
    }, [selectedNode])

    return (
        <div className="nz-dci-container" key={dciProps.uniqueName} ref={focusedRef}>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100' >
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-pane-1" >
                    <div className="nz-dci-tree-container">
                        <div className="nz-sub-header">
                            <div className="nz-qa-bar-title">Data Center Interconnect</div>
                        </div>
                        {treeData && selectedKeys && (
                            <TreeForHierarchicalDataContainer
                                {...dciTreeContainerProps}
                                apiData={treeData}
                                autoFocus={true}
                                defaultSelectedKeys={selectedKeys}
                                defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                                defaultExpandedKeys={expandedKeys}
                                handleAIClick={(event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => {
                                    handleAIClick(event, actionCode)
                                }}
                                disableAdd={defaultSelectedNodeInfo && defaultSelectedNodeInfo.node.NodeType === "DCISegmentNode" ? true : false}
                                disableDelete={defaultSelectedNodeInfo && defaultSelectedNodeInfo.node.NodeType?.toLowerCase() !== "dcinode" ? true : false}
                                handleNodeSelect={(
                                    selectedKeys: Key[],
                                    info: ISelectedNodeInfo,
                                    expandedKeys: Key[]
                                ) => {
                                    if (info.node.key === defaultSelectedNodeInfo?.node.key) return;
                                    if (info && info.node) {
                                        setSelectedKeys([info.node.key]);
                                        setExpandedKeys(expandedKeys);
                                        setDefaultSelectedNodeInfo(info)
                                        setSelectedNode(info.node)
                                        setSelectedKebabMenu(null)
                                        setWaypointMarker(undefined);
                                    }
                                }}
                                handleKebabMenuSelect={(selectedItem: IActionImageForSubMenu) => {

                                    setSelectedKebabMenu({
                                        ...selectedItem,
                                        payload: {
                                            ...selectedItem.payload,
                                            uniqueName: selectedItem.payload?.Label
                                        }
                                    });

                                    handleSelectNodeMenu({
                                        ...selectedItem,
                                        payload: {
                                            ...selectedItem.payload,
                                            uniqueName: selectedItem.payload?.Label
                                        }
                                    });
                                }}
                                customIcons={selectedNode?.NodeType?.toLowerCase() === "dcinode" || selectedNode?.NodeType?.toLowerCase() === "dcisegmentnode" ? customIcons : undefined}
                            />
                        )}
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-pane-form">
                    <div className="nz-dci-grid-container">
                        {waypointMarker ? <WaypointEditor {...waypointMarker} /> :
                            selectedNode?.NodeType?.toLowerCase() === "helptip" && !selectedKebabMenu ? <div className="nz-wh-100 nz-d-flex-hv-left">Select or Create DCI to view properties...</div> :
                                selectedDciEntIDRef.current ? <DciContainer uniqueName={dciProps.uniqueName} selectedNode={selectedNode} selectedNodeEntID={selectedNode?.NodeEntID ?? ""} selectedKebabMenu={selectedKebabMenu ?? undefined} featureId={dciProps.featureId} handleReloadDCITree={handleReloadDCITree} /> : <></>}
                    </div>
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'DCI-confirm'}
                message={confirmMessage}
                showOkButton={isShowOkButton}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={function (): void {
                    setIsConfirmOpen(false)
                    setConfirmMessage('')
                }}
                handleOkButtonClick={() => {
                    setIsConfirmOpen(false)
                    setConfirmMessage('')
                }} />
        </div>
    );
};
export { DataCenterInterconnect }

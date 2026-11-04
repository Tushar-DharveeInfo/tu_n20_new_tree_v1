import { useEffect, useRef, useState } from "react";
import { Key } from "rc-tree/lib/interface";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { useMainAppContext } from "../../../../shared/context/hooks/MainAppHooks";
import { useStatusBarContext } from "../../../../shared/context/hooks/StatusBarHooks";
import { axiosInterceptor } from "../../../../shared/interceptors/Interceptor";
import "../../../allcss/appqaentitiescontainer/site/DataCenterHierarchy.css";
import { DC, EM, EXPLORER, LOG } from "../../../../shared/interceptors/EndPoints";
import { RtmLabelForDataCenterHirerarchy } from "../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { FnGetParentTreeNodeInfoUsingDiv } from "../../../../shared/allcommon/tree/FnGetParentTreeNodeInfoUsingDiv";
import { FnConvertHierarchicalDataToTree } from "../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { FnSearchKeywordInLocalTree } from '../../../../shared/allcommon/settingsform/FnSearchKeywordInLocalTree';
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
import { IDataCenterHierarchy } from "../../../allinterface/iappqaentitiescontainer/site/IDataCenterHierarchy";
import { IConvertedTreeResponse, IFeatureTree, ITreeForHierarchicalDataContainer } from "../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { IActionImageForSubMenu } from "../../../../shared/allinterface/basic/IActionImageList";
import { IApItem, IFeatureItem } from "../../../../shared/context/allinterface/IMainApp";
import { IControl } from "../../../../shared/allinterface/settingsform/ISettingsLibForm";
import { TreeForHierarchicalDataContainer } from '../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer'
import { SearchControl } from "../../../../shared/searchfilter/searchcontrol/SearchControl";
import { PropertyFormContainer } from "../../../../shared/sidebar/propertyformcontainer/PropertyFormContainer";
import { AddDcObjectsContainer } from "../../../../shared/settingsform/adddcobjectscontainer/AddDcObjectsContainer";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { IFnCreateForensiclog } from "../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { FnCreateForensiclog } from "../../../../appcontainer/allcommon/FnCreateForensiclog";
import { useSessionContext } from "../../../../shared/context/hooks/SessionHooks";
import { FnReturnNodeNameObject } from "../../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls";
import { YesNoFormContainer } from "../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { FnParseJsonSafely } from "../../../../appcontainer/allcommon/FnParseJsonSafely";

const DataCenterHierarchy = (dataCenterHierarchyProps: IDataCenterHierarchy) => {
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [SearchText, setSearchText] = useState<string>("");
    const [SearchHistory, setSearchHistory] = useState<string[]>([]);
    const [formControls, setFormControls] = useState<IControl[] | null>()
    const [parentNodes, setParentNodes] = useState<ITreeNode[]>();
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<IFeatureItem | null>(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
    const [isShowOkButton, setIsShowOkButton] = useState<boolean>(false);
    const [dataCenterHierarchyApiData, setDataCenterHierarchyApiData] = useState<unknown>();
    const [treeForHierarchicalDataContainerProps, setTreeForHierarchicalDataContainerProps] = useState<ITreeForHierarchicalDataContainer>()
    const [entityName, setEntityName] = useState<string>();
    const lastModifiedNodeEntIDRef = useRef<string>(undefined);
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const siteId = sessionContext?.SessionList?.find(
        (item) => item.VariableName?.toLowerCase() === "siteid"
    )?.SessionValue;

    useEffect(() => {
        if (dataCenterHierarchyProps.selectedFeatureItem) {
            let featureTreedataCenterHierarchyProps: IFeatureTree = {
                instanceName: "datacenter_hierarchy_treeview",
                hideKebabMenu: false,
                allowCheckbox: false,
                allowIcon: true,
                isAllowDrag: false,
                hideCopyIcon: false,
                reuseFromCache: false,
                isAllowDrop: false,
                allowInternalDrag: true,
                openAllNodes: false,
                allowCheckStrictly: false,
            };
            setTreeForHierarchicalDataContainerProps({
                uniqueName: `${dataCenterHierarchyProps.uniqueName}-tree`, // Unique identifier
                apiData: null, // Flat API data
                featureId: dataCenterHierarchyProps.selectedFeatureItem._Feature ? dataCenterHierarchyProps.selectedFeatureItem._Feature.toString() : "", // Feature ID
                featureTreeProps: featureTreedataCenterHierarchyProps, // Tree control properties
                allowGenerateTreeData: false, // indicates whether need to generate treedata from API data
                defaultExpandedKeys: [], // default expanded keys to set if already tree data generated
                defaultSelectedKeys: [], // default selected keys to set if already tree data generated
                defaultCheckedKeys: [], // default checked keys to set if already tree data generated
                defaultSelectedNodeInfo: undefined, // default selected node set if needed
                isSiteByTenant: false, // Enables tenant-specific hierarchy
                isFloorTree: false, // Indicates this is not a Floor Pane tree
                allowAPICallOnExpand: false, // Enables API calls on node expansion
                allowAdd: false, // Allows adding new nodes
                allowEdit: false, // Allows editing nodes
                allowDelete: false, // Allows deleting nodes
                disableAdd: true, // disable adding new nodes
                disableEdit: false, // disable editing nodes
                disableDelete: false, // disable deleting nodes
                allowMultiple: true, // Allows multiple selections
                className: "tree-container", // Custom CSS class
                selectedNodeExplorer: undefined, // Selected node data
            });
            const handleDataCenterHierarchyApiResponse = (dataCenterHierarchyApiResponse: unknown, status?: string) => {
                if (status === "200" && dataCenterHierarchyApiResponse
                    && typeof dataCenterHierarchyApiResponse === "object" &&
                    'hierarchyJson' in dataCenterHierarchyApiResponse && dataCenterHierarchyApiResponse.hierarchyJson) {
                    const parsedData = FnParseJsonSafely(dataCenterHierarchyApiResponse.hierarchyJson as string);
                    if (parsedData && typeof parsedData === "object") {
                        setDataCenterHierarchyApiData(parsedData);
                    }
                    else {
                        dataCenterHierarchyProps.handleShowUserMessage?.("No data found to show for Datacenter Hierarchy")
                        setDataCenterHierarchyApiData(undefined);
                    }
                }
            }
            axiosInterceptor({
                url: EXPLORER.DatacenterHierarchy,
                data: {},
                setFetchData: handleDataCenterHierarchyApiResponse
            }, statusBarContext)
        }
    }, [dataCenterHierarchyProps.selectedFeatureItem]);

    useEffect(() => {
        if (treeForHierarchicalDataContainerProps && dataCenterHierarchyApiData) {
            FnConvertHierarchicalDataToTree(dataCenterHierarchyApiData, treeForHierarchicalDataContainerProps, (lastModifiedNodeEntIDRef.current ?? siteId) as string).then(
                (result: IConvertedTreeResponse | undefined) => {
                    if (result && result.treeData && Array.isArray(result.treeData) && result.treeData.length) {
                        setTreeData(result.treeData);
                        setDefaultExpandedKeys(result.expandedKeys ?? []);
                        if (result.selectedKey) {
                            lastModifiedNodeEntIDRef.current = result.selectedKey ? result.selectedKey.toString() : undefined;
                            setDefaultSelectedKeys([result.selectedKey]);
                        }
                        if (result.selectedNode) {
                            result.selectedNode &&
                                setDefaultSelectedNodeInfo({
                                    event: "select",
                                    selected: true,
                                    node: result.selectedNode,
                                    selectedNodes: [result.selectedNode],
                                });
                        }
                    }
                }
            );
        }
        else {
            setTreeData([]);
        }
    }, [treeForHierarchicalDataContainerProps, dataCenterHierarchyApiData]);

    const handleSearchDeviceEntities = (isNext: boolean = false, isRegex: boolean = false) => {
        if (SearchText.length > 0 && treeData) {
            const historyToExclude = isNext ? SearchHistory : [];
            //Search in user tree data.
            let foundedNode = FnSearchKeywordInLocalTree(
                SearchText,
                treeData,
                historyToExclude,
                [],
                isRegex
            );

            if (foundedNode && foundedNode.foundNode) {
                let parentNodeKeys = foundedNode.parentNodes.map(
                    (item: ITreeNode) => item.key
                );
                setDefaultExpandedKeys([...parentNodeKeys, ...defaultExpandedKeys]);
                setDefaultSelectedKeys([foundedNode.foundNode.key]);
                setDefaultSelectedNodeInfo({
                    event: "select",
                    selected: true,
                    node: foundedNode.foundNode,
                    selectedNodes: [foundedNode.foundNode],
                });
                setSearchHistory(prev => isNext ? [...prev, foundedNode.foundNode!.key] : [foundedNode.foundNode!.key]);
            } else {
                if (!isNext) {
                    setSearchHistory([]);
                }
                const message = isNext ? "No next node found" : "No matching node found";
                if (dataCenterHierarchyProps.handleShowUserMessage) {
                    dataCenterHierarchyProps.handleShowUserMessage(message);
                } else {
                    setConfirmDialogOpen(true);
                    setIsShowOkButton(true);
                    setConfirmMessage(message);
                }
            }
        }
    };

    const handleRefreshDchTreeData = () => {
        const handleDataCenterHierarchyApiResponse = (dataCenterHierarchyApiResponse: unknown, status?: string) => {
            if (status === "200" && dataCenterHierarchyApiResponse && typeof dataCenterHierarchyApiResponse === "object" && 'hierarchyJson' in dataCenterHierarchyApiResponse) {
                const parsedData = FnParseJsonSafely(dataCenterHierarchyApiResponse.hierarchyJson as string, {
                    fallback: null
                });
                setDefaultSelectedKeys([]);
                setDefaultExpandedKeys([]);
                setTreeData([]);
                if (parsedData && typeof parsedData === "object") {
                    setDataCenterHierarchyApiData({ ...parsedData });
                }
                else {
                    setDataCenterHierarchyApiData(undefined)
                    dataCenterHierarchyProps.handleShowUserMessage?.("No data found from API to refresh")
                }
            }
        }
        axiosInterceptor({
            url: EXPLORER.DatacenterHierarchy,
            data: {},
            setFetchData: handleDataCenterHierarchyApiResponse
        }, statusBarContext);
    }

    const handleKebabMenuSelect = async (
        selectedItem: IActionImageForSubMenu
    ): Promise<void> => {
        const selectedActionData = selectedItem.payload;
        setSelectedKebabMenu(selectedItem.payload as IFeatureItem);
        const mapFormControlToInterface = (
            controls: IApItem[]
        ): void => {
            const array: IControl[] = [];
            let parentNodes: ITreeNode[] = [];
            if (defaultSelectedNodeInfo) {
                parentNodes = FnGetParentTreeNodeInfoUsingDiv(
                    defaultSelectedNodeInfo.node,
                    true
                );
                if (parentNodes && parentNodes.length > 0) {
                    parentNodes.push(defaultSelectedNodeInfo.node);
                }
            }
            setParentNodes(parentNodes);
            controls.forEach((element: IApItem) => {
                if (
                    element.Name.toLowerCase() === "parententityname" &&
                    element.DisplayControl.toLowerCase() === "textcontrol"
                ) {
                    element.Value =
                        defaultSelectedNodeInfo?.node.EntityName;
                    element.DefaultAPValue =
                        defaultSelectedNodeInfo?.node.EntityName;
                } else if (
                    element.Name.toLowerCase() === "_site" &&
                    element.DisplayControl.toLowerCase() === "textcontrol"
                ) {
                    const site = parentNodes.filter((node) => {
                        return node?.NodeType === "Site";
                    });
                    if (site.length > 0) {
                        element.Value = site[0]?.Name || "";
                        element.DefaultAPValue =
                            site[0]?.Name || "";
                    }
                } else if (
                    element.Name.toLowerCase() === "_room" &&
                    element.DisplayControl.toLowerCase() === "textcontrol"
                ) {
                    const room = parentNodes.filter((node) => {
                        return node?.NodeType === "Room";
                    });
                    if (room.length > 0) {
                        element.Value = room[0]?.Name || "";
                        element.DefaultAPValue =
                            room[0]?.Name || "";
                    }
                }
                array.push({
                    RecID: element.RecID,
                    CanChange: element.CanChange,
                    GroupName: element.GroupName,
                    DefaultAPValue: element.DefaultAPValue,
                    GroupNameDesc: element.GroupNameDesc,
                    SubGroupName: element.SubGroupName,
                    SubGroupNameDesc: element.SubGroupNameDesc,
                    ChangeEvent: element.ChangeEvent,
                    EntID: element.EntID,
                    EntityName: element.EntityName,
                    PropertyLabel: element.PropertyLabel,
                    _AP: element.Name,
                    Name: element.Name,
                    NameDesc: element.NameDesc,
                    Value: element.Value
                        ? element.Value
                        : element.IsRequired
                            ? element.DefaultAPValue
                            : "",
                    ValueDesc: element.ValueDesc,
                    MaxInstances: element.MaxInstances,
                    IsNZ: element.IsNZ,
                    IsRequired: element.IsRequired,
                    LastUpdated: element.LastUpdated,
                    SortOrder: element.SortOrder,
                    DisplayControl: element.DisplayControl,
                    InputMask: element.InputMask,
                    RegEx: element.RegEx,
                    DisplayGroupControl: element.DisplayGroupControl,
                    IsSaved: false,
                    OldValue: element.Value,
                    IsReadOnly:
                        element.DisplayControl.toLowerCase() === "textcontrol"
                            ? true
                            : false,
                    SubGroupEntID: "",
                    Secured: false,
                    disabled: false
                });
            });
            array.sort((a, b) =>
                a.SortOrder > b.SortOrder ? 1 : -1
            );
            setFormControls(array);
        };
        try {
            if (
                selectedActionData?.Label ===
                RtmLabelForDataCenterHirerarchy.Refresh &&
                defaultSelectedNodeInfo
            ) {
                lastModifiedNodeEntIDRef.current =
                    defaultSelectedNodeInfo.node.NodeEntID || undefined;
                handleRefreshDchTreeData();
            } else if (
                selectedActionData?.Label ===
                RtmLabelForDataCenterHirerarchy.AddRoom
            ) {
                const addRoomControls =
                    mainAppContext.apRecords?.filter((item) => {
                        return item.GroupName
                            ?.toLowerCase()
                            .includes(
                                RtmLabelForDataCenterHirerarchy.AddRoom
                                    ?.toLowerCase()
                                    .replace(" ", "")
                            );
                    });
                if (addRoomControls && addRoomControls.length > 0) {
                    setEntityName("Room");
                    mapFormControlToInterface(addRoomControls);
                }
            } else if (
                selectedActionData?.Label ===
                RtmLabelForDataCenterHirerarchy.AddNewDataCenterSite
            ) {
                const addSiteControls =
                    mainAppContext.apRecords?.filter((item) => {
                        return item.GroupName
                            ?.toLowerCase()
                            .includes("addsite");
                    });
                if (addSiteControls && addSiteControls.length > 0) {
                    setEntityName("Site");
                    mapFormControlToInterface(addSiteControls);
                }
            } else if (
                selectedActionData?.Label ===
                RtmLabelForDataCenterHirerarchy.AddFloor
            ) {
                const addFloorControls =
                    mainAppContext.apRecords?.filter((item) => {
                        return item.GroupName
                            ?.toLowerCase()
                            .includes(
                                RtmLabelForDataCenterHirerarchy.AddFloor
                                    ?.toLowerCase()
                                    .replace(" ", "")
                            );
                    });
                if (addFloorControls && addFloorControls.length > 0) {
                    setEntityName("Floor");
                    mapFormControlToInterface(addFloorControls);
                }
            } else if (
                (
                    selectedActionData?.Label ===
                    RtmLabelForDataCenterHirerarchy.EmptyDataCenterSite ||
                    selectedActionData?.Label ===
                    RtmLabelForDataCenterHirerarchy.EmptyRoom ||
                    selectedActionData?.Label ===
                    RtmLabelForDataCenterHirerarchy.EmptyFloor
                ) &&
                defaultSelectedNodeInfo &&
                defaultSelectedNodeInfo.node
            ) {
                setFormControls(null);
                lastModifiedNodeEntIDRef.current =
                    defaultSelectedNodeInfo.node.NodeEntID || undefined;
                const handleCreateMessageApiResponse = (
                    createMessageApiResponse: unknown
                ): void => {
                    if (
                        createMessageApiResponse &&
                        typeof createMessageApiResponse === "object" &&
                        "finalMessage" in createMessageApiResponse
                    ) {
                        setIsShowOkButton(false);
                        setConfirmDialogOpen(true);
                        setConfirmMessage(
                            String(createMessageApiResponse.finalMessage)
                        );
                    }
                };
                axiosInterceptor({
                    url: LOG.CreateMessage,
                    data: {
                        projectInitial: "Audit",
                        msgID: "151",
                        optionalMessage: selectedActionData?.Label,
                        customMessage: "",
                        errorMessage: ""
                    },
                    setFetchData: handleCreateMessageApiResponse
                }, statusBarContext);
            } else if (
                (
                    selectedActionData?.Label ===
                    RtmLabelForDataCenterHirerarchy.DeleteDataCenterSite ||
                    selectedActionData?.Label ===
                    RtmLabelForDataCenterHirerarchy.DeleteRoom ||
                    selectedActionData?.Label ===
                    RtmLabelForDataCenterHirerarchy.DeleteFloor
                ) &&
                defaultSelectedNodeInfo &&
                defaultSelectedNodeInfo.node
            ) {
                if (defaultSelectedNodeInfo.node.IsNZ) {
                    dataCenterHierarchyProps.handleShowUserMessage?.(
                        "This record cannot be deleted because it is a required record for application to work."
                    );
                    return;
                }
                lastModifiedNodeEntIDRef.current = undefined;
                setFormControls(null);
                const msgId = selectedActionData?.Label ===
                    RtmLabelForDataCenterHirerarchy.DeleteRoom ? "158" : selectedActionData?.Label ===
                        RtmLabelForDataCenterHirerarchy.DeleteFloor ? "157" : "155"
                const handleCreateMessageApiResponse = (
                    createMessageApiResponse: unknown
                ): void => {
                    if (
                        createMessageApiResponse &&
                        typeof createMessageApiResponse === "object" &&
                        "finalMessage" in createMessageApiResponse
                    ) {
                        setIsShowOkButton(false);
                        setConfirmDialogOpen(true);
                        setConfirmMessage(
                            String(createMessageApiResponse.finalMessage)
                        );
                    }
                };
                axiosInterceptor({
                    url: LOG.CreateMessage,
                    data: {
                        projectInitial: "Common",
                        msgID: msgId,
                        optionalMessage:
                            defaultSelectedNodeInfo.node.Name,
                        customMessage: "",
                        errorMessage: ""
                    },
                    setFetchData: handleCreateMessageApiResponse
                }, statusBarContext);
            } else {
                setFormControls(null);
            }
        } catch (error) {
            console.error(
                "Error in handleKebabMenuSelect:",
                error
            );
        }
    };

    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        if (defaultSelectedNodeInfo?.node.key !== info.node.key) {
            setFormControls(null)
            setSelectedKebabMenu(null);
        }
        setDefaultExpandedKeys(expandedKeys);
        setDefaultSelectedKeys([info.node.key]);
        setDefaultSelectedNodeInfo(info)
    }

    const handleConfirmDeleteYes = async () => {
        const deleteDcRecords = async (payLoad: Record<string, any>, url: string, selectedNode: ITreeNode) => {
            const handleDeleteDcApiResponse = async (_resp: unknown, status?: string) => {
                if (_resp !== undefined && status === "200") {
                    const data = treeData && await FnReturnNodeNameObject(treeData, selectedNode.NodeEntID ?? "")
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.DataCenterHierarchy,
                        SubGroupName: LogSubGroupName.DataCenterHierarchy,
                        LogName: LogName.DeleteEntity,
                        actionObject: {
                            Site: data?.Site,
                            Room: data?.Room,
                            Floor: data?.Floor
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload);
                    setConfirmMessage("You need to reload the application to view effect");
                    setIsShowOkButton(true);
                    setConfirmDialogOpen(true);
                    handleRefreshDchTreeData();
                }
            }
            axiosInterceptor({
                url: url,
                data: payLoad,
                setFetchData: handleDeleteDcApiResponse
            }, statusBarContext);
        }
        const apiCallForDeleteSiteDataCenter = async (selectedNode: ITreeNode, label: string) => {
            if (selectedNode.NodeEntID) {
                const payLoad = {
                    siteId: selectedNode.NodeEntID
                }
                await deleteDcRecords(payLoad, DC.DeleteSite, selectedNode);
            }
        }
        const apiCallForDeleteRoom = async (selectedNode: ITreeNode, label: string, isRefresh: boolean = true) => {
            if (selectedNode.NodeEntID) {
                const payLoad = {
                    roomId: selectedNode.NodeEntID
                }
                await deleteDcRecords(payLoad, DC.DeleteRoom, selectedNode);
            }
        }
        const apiCallForDeleteFloor = async (selectedNode: ITreeNode, label: string, isRefresh: boolean = true) => {
            if (selectedNode.NodeEntID) {
                const payLoad = {
                    floorId: selectedNode.NodeEntID
                }
                await deleteDcRecords(payLoad, DC.DeleteFloor, selectedNode);
            }
        }
        const apiCallForEmptySite = async (selectedNode: ITreeNode, label: string) => {
            if (selectedNode.HasChildren != 0 && selectedNode.children.length > 0) {
                for (let index = 0; index < selectedNode.children.length; index++) {
                    const element = selectedNode.children[index];
                    await apiCallEmptyRoom(element, label, false)
                }
            }
            const handleEmptySiteApiResponse = (emptySiteApiResponse: unknown, status?: string) => {
                if (status === "200" && emptySiteApiResponse !== undefined) {
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.DataCenterHierarchy,
                        SubGroupName: LogSubGroupName.DataCenterHierarchy,
                        LogName: LogName.EmptyEntity,
                        actionObject: {
                            Site: selectedNode?.Name,
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload);
                    handleRefreshDchTreeData();
                }
            }
            axiosInterceptor({
                url: DC.EmptySite,
                data: {
                    siteId: selectedNode.NodeEntID
                },
                setFetchData: handleEmptySiteApiResponse
            }, statusBarContext);
        }
        const apiCallEmptyRoom = async (selectedNode: ITreeNode, label: string, isRefresh: boolean = true) => {
            if (selectedNode.HasChildren != 0 && selectedNode.children.length > 0) {
                for (let index = 0; index < selectedNode.children.length; index++) {
                    const element = selectedNode.children[index];
                    await apiCallEmptyFloor(element, label, false);
                }
            }
            const handleEmptyRoomApiResponse = async (emptyRoomApiResponse: unknown, status?: string) => {
                if (status === "200" && emptyRoomApiResponse !== undefined && isRefresh) {
                    const data = treeData && await FnReturnNodeNameObject(treeData, selectedNode.NodeEntID ?? "")
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.DataCenterHierarchy,
                        SubGroupName: LogSubGroupName.DataCenterHierarchy,
                        LogName: LogName.EmptyEntity,
                        actionObject: {
                            Site: data?.Site,
                            Room: data?.Room,
                            Floor: data?.Floor
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload);
                    handleRefreshDchTreeData();
                }
            }
            axiosInterceptor({
                url: DC.EmptyRoom,
                data: {
                    roomId: selectedNode.NodeEntID
                },
                setFetchData: handleEmptyRoomApiResponse
            }, statusBarContext);
        }
        const apiCallEmptyFloor = async (selectedNode: ITreeNode, label: string, isRefresh: boolean = true) => {
            if (selectedNode.HasChildren == 0) {
                const handleEmptyFloorApiResponse = async (emptyFloorApiResponse: unknown, status?: string) => {
                    if (status === "200" && emptyFloorApiResponse !== undefined && isRefresh) {
                        const data = treeData && await FnReturnNodeNameObject(treeData, selectedNode.NodeEntID ?? "")
                        const payload: IFnCreateForensiclog = {
                            logType: 'UserAction',
                            GroupName: LogGroupName.ForensicLogTemplate,
                            _Forensiclog: LogSubGroupName.DataCenterHierarchy,
                            SubGroupName: LogSubGroupName.DataCenterHierarchy,
                            LogName: LogName.EmptyEntity,
                            actionObject: {
                                Site: data?.Site,
                                Room: data?.Room,
                                Floor: data?.Floor
                            },
                            sessionContext: sessionContext,
                            statusBarContext: statusBarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        }
                        FnCreateForensiclog(payload); handleRefreshDchTreeData();
                    }
                }
                axiosInterceptor({
                    url: DC.EmptyFloor,
                    data: {
                        floorId: selectedNode.NodeEntID
                    },
                    setFetchData: handleEmptyFloorApiResponse
                }, statusBarContext);
            }
        }
        if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.DeleteDataCenterSite.toString() && defaultSelectedNodeInfo) {
            await apiCallForDeleteSiteDataCenter(defaultSelectedNodeInfo.node, selectedKebabMenu.Label)
        } else if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.DeleteFloor.toString() && defaultSelectedNodeInfo) {
            await apiCallForDeleteFloor(defaultSelectedNodeInfo.node, selectedKebabMenu.Label)
        } else if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.DeleteRoom.toString() && defaultSelectedNodeInfo) {
            await apiCallForDeleteRoom(defaultSelectedNodeInfo.node, selectedKebabMenu.Label)
        } else if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.EmptyDataCenterSite.toString() && defaultSelectedNodeInfo) {
            await apiCallForEmptySite(defaultSelectedNodeInfo.node, selectedKebabMenu.Label);
        } else if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.EmptyRoom.toString() && defaultSelectedNodeInfo) {
            await apiCallEmptyRoom(defaultSelectedNodeInfo.node, selectedKebabMenu.Label);
        }
        else if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.EmptyFloor.toString() && defaultSelectedNodeInfo) {
            await apiCallEmptyFloor(defaultSelectedNodeInfo.node, selectedKebabMenu.Label);
        }
        setConfirmDialogOpen(false);
    }

    const handleRefreshForNewRecord = (newAddedId: string, newAddedName: string, action?: 'save' | 'back' | 'close'): void => {
        if (action === 'close') {
            setFormControls(null);
            return;
        }
        setConfirmMessage("To complete this change, close your browser session and relaunch the application.");
        setIsShowOkButton(true);
        setConfirmDialogOpen(true);
        if (entityName?.toLowerCase() === "site") {
            const handleCreateDefaultSiteHierarchyApiResponse = (createDefaultSiteHierarchyApiResponse: unknown, status?: string) => {
                if (status === "200" && createDefaultSiteHierarchyApiResponse !== undefined) {
                    lastModifiedNodeEntIDRef.current = newAddedId;
                    setFormControls(null);
                    handleRefreshDchTreeData();
                }
            }
            axiosInterceptor({
                url: EM.CreateDefaultSiteHierarchy,
                data: {
                    siteID: newAddedId,
                    siteName: newAddedName
                },
                setFetchData: handleCreateDefaultSiteHierarchyApiResponse
            }, statusBarContext);
        }
        else {
            lastModifiedNodeEntIDRef.current = newAddedId;
            setFormControls(null);
            handleRefreshDchTreeData();
        }
    }

    const handleRefreshUpdatedRecord = (newAddedId: string, newAddedName: string, action?: "save" | "back" | undefined): void => {

        if (defaultSelectedNodeInfo?.node.NodeType?.toLowerCase() === "room" && defaultSelectedNodeInfo?.node.children.length) {
            const childNodeEntIDs = defaultSelectedNodeInfo?.node.children
                ?.map(child => child.NodeEntID)
                .filter(Boolean)
                .join(";");

            const handleDeleteDcApiResponse = async (_resp: unknown, status?: string) => {
                if (_resp !== undefined && status === "200") {
                    lastModifiedNodeEntIDRef.current = newAddedId;
                    handleRefreshDchTreeData();
                }
            }
            axiosInterceptor({
                url: EM.DeleteTableRecords,
                data: {
                    tableName: "PG.FloorLayout",
                    entIDs: childNodeEntIDs
                },
                setFetchData: handleDeleteDcApiResponse
            }, statusBarContext);
        }
        dataCenterHierarchyProps.handleShowUserMessage?.("To complete this change, close your browser session and relaunch the application.");
    }

    return (
        <div className="nz-data-center-hierarchy" key={dataCenterHierarchyProps.uniqueName}>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">
                    <div className="nz-data-center-hierarchy-left">
                        {treeData && treeData.length > 0 ? (
                            <div className="nz-data-center-tree-search">
                                <SearchControl
                                    uniqueName={`tree-search`}
                                    isShowFilterControl={false}
                                    lensDirty={SearchText.length > 0}
                                    filterDirty={false}
                                    searchValueChange={(value: string) => {
                                        setSearchText(value);
                                        setSearchHistory([]);
                                    }}
                                    handleLensMouse={() => {
                                        const isNext = SearchHistory.length > 0;
                                        handleSearchDeviceEntities(isNext, true);
                                    }}
                                    hideRightMouseMenu={true}
                                    searchInputValue={SearchText}
                                    handleFilterMouse={() => {
                                        console.error("Filter is not implemented here")
                                    }} />
                                <div className="nz-data-center-tree-div">
                                    {treeForHierarchicalDataContainerProps && (
                                        <TreeForHierarchicalDataContainer
                                            {...treeForHierarchicalDataContainerProps}
                                            apiData={treeData}
                                            autoFocus={true}
                                            defaultExpandedKeys={defaultExpandedKeys}
                                            defaultSelectedKeys={defaultSelectedKeys}
                                            defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                                            handleNodeSelect={handleNodeSelect} // Node select callback
                                            handleKebabMenuSelect={handleKebabMenuSelect} // Kebabmenu select callback
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>
                        )}
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-pane-form">
                    <div className="nz-data-center-hierarchy-right">
                        {defaultSelectedNodeInfo?.node && defaultSelectedNodeInfo.node.NodeType?.toLowerCase() !== "helptip" && !formControls ?
                            <PropertyFormContainer
                                uniqueName={dataCenterHierarchyProps.uniqueName + "property-form"}
                                featureId={dataCenterHierarchyProps.featureId}
                                selectedNode={defaultSelectedNodeInfo.node}
                                selectedNodeMenu={undefined}
                                subTreeFeatureId={dataCenterHierarchyProps.selectedFeatureItem.Label ?? ""}
                                treeData={treeData}
                                pgTableToShow={"PG.Contact"}
                                isReadOnly={false}
                                handleRefreshUpdatedRecord={handleRefreshUpdatedRecord}
                            />
                            :
                            <></>
                        }
                        {entityName && selectedKebabMenu ?
                            <AddDcObjectsContainer uniqueName={dataCenterHierarchyProps.uniqueName + "add-dc-object-form"}
                                entityToAdd={entityName}
                                selectedNode={defaultSelectedNodeInfo?.node}
                                pgTableToAdd="PG.Contact"
                                treeData={treeData}
                                parentNodes={parentNodes}
                                allowCustomHeader={false}
                                allowCloseButton={true}
                                featureId={dataCenterHierarchyProps.featureId}
                                handleRefreshForNewRecord={handleRefreshForNewRecord} />
                            :
                            <></>
                        }
                    </div>
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer isOpen={confirmDialogOpen} uniqueName={`${dataCenterHierarchyProps}-delete-dc-confirm`}
                message={confirmMessage}
                showOkButton={isShowOkButton}
                handleOkButtonClick={() => {
                    setConfirmDialogOpen(false);
                }}
                handleYesButtonClick={handleConfirmDeleteYes} handleNoButtonClick={() => {
                    setConfirmDialogOpen(false);
                }} />
        </div>
    );
};
export { DataCenterHierarchy }
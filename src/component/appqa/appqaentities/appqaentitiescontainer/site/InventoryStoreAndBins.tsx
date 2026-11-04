
import { useEffect, useMemo, useRef, useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { Key } from "rc-tree/lib/interface";
import { useStatusBarContext } from "../../../../shared/context/hooks/StatusBarHooks";
import { useMainAppContext } from "../../../../shared/context/hooks/MainAppHooks";
import { axiosInterceptor } from "../../../../shared/interceptors/Interceptor";
import "../../../allcss/appqaentitiescontainer/site/InventoryStoreAndBins.css";
import { DC, EXPLORER, LOG } from "../../../../shared/interceptors/EndPoints";
import { RtmLabelForDataCenterHirerarchy } from "../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { FnConvertHierarchicalDataToTree } from "../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { FnSearchKeywordInLocalTree } from "../../../../shared/allcommon/settingsform/FnSearchKeywordInLocalTree";
import { FnGetParentTreeNodeInfoUsingDiv } from "../../../../shared/allcommon/tree/FnGetParentTreeNodeInfoUsingDiv";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
import { IConvertedTreeResponse, IFeatureTree, ITreeForHierarchicalDataContainer } from "../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { IApItem, IFeatureItem } from "../../../../shared/context/allinterface/IMainApp";
import { IControl } from "../../../../shared/allinterface/settingsform/ISettingsLibForm";
import { IActionImageForSubMenu } from "../../../../shared/allinterface/basic/IActionImageList";
import { IInventoryStoreAndBins } from "../../../allinterface/iappqaentitiescontainer/site/IInventoryStoreAndBins";
import { SearchControl } from "../../../../shared/searchfilter/searchcontrol/SearchControl";
import { TreeForHierarchicalDataContainer } from "../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { PropertyFormContainer } from "../../../../shared/sidebar/propertyformcontainer/PropertyFormContainer";
import { AddDcObjectsContainer } from "../../../../shared/settingsform/adddcobjectscontainer/AddDcObjectsContainer";
import { FnReturnNodeNameObject } from "../../../../appcontainer/allcommon/FnCreateWorkOrderApiCalls";
import { IFnCreateForensiclog } from "../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useSessionContext } from "../../../../shared/context/hooks/SessionHooks";
import { FnCreateForensiclog } from "../../../../appcontainer/allcommon/FnCreateForensiclog";
import { YesNoFormContainer } from "../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { FnParseJsonSafely } from "../../../../appcontainer/allcommon/FnParseJsonSafely";


const InventoryStoreAndBins = (inventoryStoreAndBinsProps: IInventoryStoreAndBins) => {
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [SearchText, setSearchText] = useState<string>("");
    const [SearchHistory, setSearchHistory] = useState<string[]>([]);
    const [formControls, setFormControls] = useState<IControl[] | null>(null)
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<IFeatureItem | null>(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
    const [isShowOkButton, setIsShowOkButton] = useState<boolean>(false);
    const [parentNodes, setParentNodes] = useState<ITreeNode[]>();
    const [inventoryHierarchyApiData, setInventoryHierarchyApiData] = useState<unknown>();
    const [treeForHierarchicalDataContainerProps, setTreeForHierarchicalDataContainerProps] = useState<ITreeForHierarchicalDataContainer>()
    const [entityName, setEntityName] = useState<string>();

    const lastModifiedNodeEntIDRef = useRef<string>(undefined);
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const siteId = sessionContext?.SessionList?.find(
        (item) => item.VariableName?.toLowerCase() === "siteid"
    )?.SessionValue;

    useEffect(() => {
        if (inventoryStoreAndBinsProps.selectedFeatureItem) {
            let featureTreeInventoryHierarchyProps: IFeatureTree = {
                instanceName: "inventory_hierarchy_treeview",
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
                uniqueName: `${inventoryStoreAndBinsProps.uniqueName}-tree`, // Unique identifier
                apiData: null, // Flat API data
                featureId: inventoryStoreAndBinsProps.selectedFeatureItem._Feature ? inventoryStoreAndBinsProps.selectedFeatureItem._Feature.toString() : "", // Feature ID
                featureTreeProps: featureTreeInventoryHierarchyProps, // Tree control properties
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
            const handleInventoryHierarchyApiResponse = (inventoryHierarchyApiResponse: unknown, status?: string) => {
                if (status === "200" && inventoryHierarchyApiResponse &&
                    typeof inventoryHierarchyApiResponse === "object" && 'hierarchyJson' in inventoryHierarchyApiResponse && inventoryHierarchyApiResponse.hierarchyJson) {
                    const parsedData = FnParseJsonSafely(inventoryHierarchyApiResponse.hierarchyJson as string);
                    if (parsedData && typeof parsedData === "object") {
                        setInventoryHierarchyApiData(parsedData);
                    }
                    else {
                        inventoryStoreAndBinsProps.handleShowUserMessage?.("No data found to show Inventory Store and Bins")
                        setInventoryHierarchyApiData(undefined)
                    }
                }
            }
            axiosInterceptor({
                url: EXPLORER.InventoryHierarchy,
                data: {},
                setFetchData: handleInventoryHierarchyApiResponse
            }, statusBarContext)
        }
    }, [inventoryStoreAndBinsProps.selectedFeatureItem]);

    useEffect(() => {
        if (treeForHierarchicalDataContainerProps?.featureTreeProps && inventoryHierarchyApiData) {
            FnConvertHierarchicalDataToTree(inventoryHierarchyApiData, treeForHierarchicalDataContainerProps, (lastModifiedNodeEntIDRef.current ?? siteId) as string).then(
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
    }, [treeForHierarchicalDataContainerProps, inventoryHierarchyApiData]);

    const handleRefreshIhTreeData = () => {

        const handleInventoryHierarchyApiResponse = (inventoryHierarchyApiResponse: unknown, status?: string) => {
            if (status === "200" && inventoryHierarchyApiResponse &&
                typeof inventoryHierarchyApiResponse === "object" && 'hierarchyJson' in inventoryHierarchyApiResponse && inventoryHierarchyApiResponse.hierarchyJson) {
                const parsedData = FnParseJsonSafely(inventoryHierarchyApiResponse.hierarchyJson as string);
                if (parsedData) {

                    setDefaultSelectedKeys([]);
                    setDefaultExpandedKeys([]);
                    setTreeData([]);
                    setInventoryHierarchyApiData({ ...parsedData });
                }
                else {
                    inventoryStoreAndBinsProps.handleShowUserMessage?.("No data found to refresh for Inventory Store and Bins")
                    setInventoryHierarchyApiData(undefined)
                }
            }
        }
        axiosInterceptor({
            url: EXPLORER.InventoryHierarchy,
            data: {},
            setFetchData: handleInventoryHierarchyApiResponse
        }, statusBarContext);
    }

    const handleSearchDeviceEntities = async (isNext: boolean = false, isRegex: boolean = false) => {
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
                const parentNodeKeys = foundedNode.parentNodes.map(
                    (item: ITreeNode) => item.key
                );
                setDefaultExpandedKeys([...parentNodeKeys, ...defaultExpandedKeys]);
                setDefaultSelectedKeys([foundedNode.foundNode.key]);
                setSearchHistory(prev => isNext ? [...prev, foundedNode.foundNode!.key] : [foundedNode.foundNode!.key]);
                setDefaultSelectedNodeInfo({
                    event: "select",
                    selected: true,
                    node: foundedNode.foundNode,
                    selectedNodes: [foundedNode.foundNode],
                });
            } else {
                if (!isNext) {
                    setSearchHistory([]);
                }
                const message = isNext ? "No next node found" : "No matching node found";
                if (inventoryStoreAndBinsProps.handleShowUserMessage) {
                    inventoryStoreAndBinsProps.handleShowUserMessage(message);
                } else {
                    setConfirmDialogOpen(true);
                    setIsShowOkButton(true);
                    setConfirmMessage(message);
                }
            }
        }
    };

    const handleKebabMenuSelect = async (selectedItem: IActionImageForSubMenu) => {

        const selectedActionData = selectedItem.payload;
        setSelectedKebabMenu(selectedItem.payload as IFeatureItem);
        const mapFormControlToInterface = (controls: IApItem[]) => {
            var array: IControl[] = [];
            let parentNodes: ITreeNode[] = [];
            if (defaultSelectedNodeInfo) {

                parentNodes = FnGetParentTreeNodeInfoUsingDiv(defaultSelectedNodeInfo.node, true);
                if (parentNodes && parentNodes.length > 0) {
                    parentNodes.push(defaultSelectedNodeInfo.node);
                }
                setParentNodes(parentNodes);
            }
            controls.forEach((element) => {
                if (element.Name.toLowerCase() == "parententityname" && element.DisplayControl.toLowerCase() === "textcontrol") {
                    element.Value = defaultSelectedNodeInfo?.node.EntityName;
                    element.DefaultAPValue = defaultSelectedNodeInfo?.node.EntityName;
                } else if (element.Name.toLowerCase() == "_site" && element.DisplayControl.toLowerCase() === "textcontrol") {
                    let site = parentNodes.filter((node) => {
                        return node?.NodeType?.toLowerCase() === "site"
                    })
                    if (site.length > 0) {
                        element.Value = site[0].Name || "";
                        element.DefaultAPValue = site[0].Name || "";

                    }
                } else if (element.Name.toLowerCase() == "_inventory" && element.DisplayControl.toLowerCase() === "textcontrol") {
                    let Inventory = parentNodes.filter((node) => {
                        return node?.NodeType === "Inventory"
                    })
                    if (Inventory.length > 0) {
                        element.Value = Inventory[0].Name || "";
                        element.DefaultAPValue = Inventory[0].Name || "";

                    }
                } else if (element.Name.toLowerCase() == "_store" && element.DisplayControl.toLowerCase() === "textcontrol") {
                    element.Value = defaultSelectedNodeInfo?.node.Name || "";
                    element.DefaultAPValue = defaultSelectedNodeInfo?.node.Name || "";
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
                    Value: element.Value ? element.Value : element.IsRequired ? element.DefaultAPValue : "",
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
                    IsReadOnly: element.DisplayControl.toLowerCase() === "textcontrol" ? true : false,
                    SubGroupEntID: "",
                    Secured: false,
                    disabled: false
                });

            });
            array.sort((a, b) => a.SortOrder > b.SortOrder ? 1 : -1)
            setFormControls(array)
        }
        if (selectedActionData?.Label === RtmLabelForDataCenterHirerarchy.Refresh && defaultSelectedNodeInfo) {
            lastModifiedNodeEntIDRef.current = defaultSelectedNodeInfo.node.NodeEntID || undefined;
            handleRefreshIhTreeData();
        }
        else if (selectedActionData?.Label === RtmLabelForDataCenterHirerarchy.AddBin) {
            const addBinControls = mainAppContext.apRecords?.filter((item) => { return item.GroupName?.toLowerCase().includes(RtmLabelForDataCenterHirerarchy.AddBin?.toLowerCase().replace(' ', '')) });
            if (addBinControls && addBinControls.length > 0) {
                setEntityName("Bin");
                mapFormControlToInterface(addBinControls);
            }
        } else if ((selectedActionData?.Label === RtmLabelForDataCenterHirerarchy.EmptyBin
            || selectedActionData?.Label === RtmLabelForDataCenterHirerarchy.EmptyStore)
            && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node
        ) {
            lastModifiedNodeEntIDRef.current = defaultSelectedNodeInfo.node.NodeEntID || undefined;
            setFormControls(null)
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
                    setConfirmMessage(createMessageApiResponse.finalMessage as string);
                }
            }
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
            }, statusBarContext)
        }
        else if (selectedActionData?.Label === RtmLabelForDataCenterHirerarchy.DeleteBin && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
            if (defaultSelectedNodeInfo.node.IsNZ) {
                setIsShowOkButton(true);
                setConfirmMessage("This record cannot be deleted because it is a required record for application to work.");
                setConfirmDialogOpen(true);
                return
            }
            setFormControls(null);
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
                    setConfirmMessage(createMessageApiResponse.finalMessage as string);
                }
            }
            axiosInterceptor({
                url: LOG.CreateMessage,
                data: {
                    projectInitial: "Common",
                    msgID: "155",
                    optionalMessage: defaultSelectedNodeInfo.node.Name,
                    customMessage: "",
                    errorMessage: ""
                },
                setFetchData: handleCreateMessageApiResponse
            }, statusBarContext)
        }
        else {
            setFormControls(null)
        }
    }

    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        if (defaultSelectedNodeInfo?.node.key !== info.node.key) {
            setFormControls(null);
            setSelectedKebabMenu(null);

        }
        setDefaultExpandedKeys([...expandedKeys]);
        setDefaultSelectedKeys([info.node.key]);
        setDefaultSelectedNodeInfo(info);
        if (info.node.NodeType === "Helptip") {
            setDefaultSelectedNodeInfo(null)
        }
    }


    const handleConfirmDeleteYes = async () => {
        const deleteDcRecords = async (payLoad: Record<string, any>, url: string) => {
            const handleDeleteDcApiResponse = async (_resp: unknown, status?: string) => {
                if (_resp !== undefined && status === "200") {
                    const data = treeData && await FnReturnNodeNameObject(treeData, defaultSelectedNodeInfo?.node?.NodeEntID ?? "")
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.InventoryStoreandBins,
                        SubGroupName: LogSubGroupName.InventoryStoreandBins,
                        LogName: LogName.DeleteEntity,
                        actionObject: {
                            Site: data?.Site,
                            Inventory: data?.Inventory,
                            Store: data?.Store,
                            Bin: defaultSelectedNodeInfo?.node.Name
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload);
                    handleRefreshIhTreeData();
                    setConfirmMessage("You need to reload the application to view effect");
                    setIsShowOkButton(true);
                    setConfirmDialogOpen(true);
                }
            }
            axiosInterceptor({
                url: url,
                data: payLoad,
                setFetchData: handleDeleteDcApiResponse
            }, statusBarContext);
        }
        const apiCallForEmptyBin = async (selectedNode: ITreeNode, label: string, isRefresh: boolean = true) => {
            const handleEmptySiteApiResponse = async (emptySiteApiResponse: unknown, status?: string) => {
                if (status === "200" && emptySiteApiResponse !== undefined && isRefresh) {
                    const data = treeData && await FnReturnNodeNameObject(treeData, defaultSelectedNodeInfo?.node?.NodeEntID ?? "")
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.InventoryStoreandBins,
                        SubGroupName: LogSubGroupName.InventoryStoreandBins,
                        LogName: LogName.EmptyEntity,
                        actionObject: {
                            Site: data?.Site,
                            Inventory: data?.Inventory,
                            Store: data?.Store,
                            Bin: defaultSelectedNodeInfo?.node.Name
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload);
                    handleRefreshIhTreeData();
                }
            }
            axiosInterceptor({
                url: DC.EmptyBin,
                data: {
                    binId: selectedNode.NodeEntID
                },
                setFetchData: handleEmptySiteApiResponse
            }, statusBarContext);
        }
        const apiCallForEmptyStore = async (selectedNode: ITreeNode, label: string) => {
            if (selectedNode.HasChildren != 0 && selectedNode.children.length > 0) {
                for (let index = 0; index < selectedNode.children.length; index++) {
                    const element = selectedNode.children[index];
                    const data = treeData && await FnReturnNodeNameObject(treeData, defaultSelectedNodeInfo?.node?.NodeEntID ?? "")
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.InventoryStoreandBins,
                        SubGroupName: LogSubGroupName.InventoryStoreandBins,
                        LogName: LogName.DeleteEntity,
                        actionObject: {
                            Site: data?.Site,
                            Inventory: data?.Inventory,
                            Store: defaultSelectedNodeInfo?.node.Name,
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload);
                    await apiCallForEmptyBin(element, label, false)
                }
            }
            const handleEmptyStoreApiResponse = (emptyStoreApiResponse: unknown, status?: string) => {
                if (status === "200" && emptyStoreApiResponse !== undefined) {
                    handleRefreshIhTreeData();
                }
            }
            axiosInterceptor({
                url: DC.EmptyStore,
                data: {
                    storeId: selectedNode.NodeEntID
                },
                setFetchData: handleEmptyStoreApiResponse
            }, statusBarContext);
        }
        if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.DeleteBin.toString() && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
            if (defaultSelectedNodeInfo.node.NodeEntID) {

                const payLoad = {
                    binId: defaultSelectedNodeInfo.node.NodeEntID
                }
                await deleteDcRecords(payLoad, DC.DeleteBin);

            }

        }
        else if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.EmptyStore.toString() && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
            await apiCallForEmptyStore(defaultSelectedNodeInfo.node, selectedKebabMenu.Label);
        }
        else if (selectedKebabMenu && selectedKebabMenu.Label == RtmLabelForDataCenterHirerarchy.EmptyBin.toString() && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
            await apiCallForEmptyBin(defaultSelectedNodeInfo.node, selectedKebabMenu.Label);
        }
        setConfirmDialogOpen(false);
    }

    const handleRefreshForNewRecord = (newAddedId: string, newAddedName: string, action?: 'save' | 'back' | 'close'): void => {
        if (action === 'close') {
            setFormControls(null);
            return;
        }
        inventoryStoreAndBinsProps.handleShowUserMessage?.("To complete this change, close your browser session and relaunch the application.");
        lastModifiedNodeEntIDRef.current = newAddedId;
        setFormControls(null);
        handleRefreshIhTreeData();
    }

    const handleRefreshUpdatedRecord = (newAddedId: string, newAddedName: string, action?: "save" | "back" | undefined): void => {
        inventoryStoreAndBinsProps.handleShowUserMessage?.("To complete this change, close your browser session and relaunch the application.");
    }

    const isNodeReadOnly = useMemo(() => {
        if (!defaultSelectedNodeInfo?.node) return false;
        const node = defaultSelectedNodeInfo.node;
        const treeType = (node.treetype || node.NodeType || node.NodeEntityname || "").toLowerCase().trim();

        if (treeType === "inventory" || treeType === "store") {
            return true;
        }

        if (treeType === "bin") {
            const name = (node.Name || "").toLowerCase().trim();
            const readOnlyBinNames = ["new", "other", "disposable", "used", "network cables", "power cables"];
            if (readOnlyBinNames.includes(name)) {
                return true;
            }
        }

        return false;
    }, [defaultSelectedNodeInfo]);

    return (
        <div className="nz-inventory-hierarchy" key={inventoryStoreAndBinsProps.uniqueName}>
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
                                    searchInputValue={SearchText} handleFilterMouse={function (): void {
                                    }} />
                                <div className="nz-data-center-tree-div">
                                    {defaultExpandedKeys && treeForHierarchicalDataContainerProps && (
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
                        {defaultSelectedNodeInfo && !formControls ?
                            <PropertyFormContainer
                                uniqueName={inventoryStoreAndBinsProps.uniqueName + "property-form"}
                                featureId={inventoryStoreAndBinsProps.featureId}
                                selectedNode={defaultSelectedNodeInfo.node}
                                selectedNodeMenu={undefined}
                                subTreeFeatureId={inventoryStoreAndBinsProps.selectedFeatureItem.Label ?? ""}
                                treeData={treeData}
                                pgTableToShow={"PG.Contact"}
                                isReadOnly={isNodeReadOnly}
                                handleRefreshUpdatedRecord={handleRefreshUpdatedRecord}
                            />
                            :
                            <></>
                        }

                        {entityName ?
                            <AddDcObjectsContainer uniqueName={inventoryStoreAndBinsProps.uniqueName + "add-ih-object-form"}
                                entityToAdd={entityName}
                                selectedNode={defaultSelectedNodeInfo?.node}
                                pgTableToAdd="PG.Contact"
                                treeData={treeData}
                                parentNodes={parentNodes}
                                allowCustomHeader={false}
                                allowCloseButton={true}
                                featureId={inventoryStoreAndBinsProps.featureId}
                                handleRefreshForNewRecord={handleRefreshForNewRecord} />
                            :
                            <></>
                        }
                    </div>
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer isOpen={confirmDialogOpen} uniqueName={`${inventoryStoreAndBinsProps.uniqueName}-delete-dc-confirm`}
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
export { InventoryStoreAndBins }
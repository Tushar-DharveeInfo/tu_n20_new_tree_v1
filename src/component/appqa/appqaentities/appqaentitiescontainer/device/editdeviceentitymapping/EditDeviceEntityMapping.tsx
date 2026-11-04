
import { useEffect, useRef, useState } from 'react'
import { CheckInfo } from 'rc-tree/lib/Tree'
import { Key } from 'rc-tree/lib/interface'
import { useStatusBarContext } from '../../../../../shared/context/hooks/StatusBarHooks'
import { axiosInterceptor } from '../../../../../shared/interceptors/Interceptor'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import '../../../../allcss/appqaentitiescontainer/device/EditDeviceEntityMapping.css'
import { EM, HWENTITY, NZENTITY } from '../../../../../shared/interceptors/EndPoints'
import { FnConvertHierarchicalDataToTree } from '../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree'
import { FnUpdateTreeNodeBasedOnKeyForHierarchicalData } from '../../../../../shared/allcommon/tree/FnUpdateTreeNodeBasedOnKeyForHierarchicalData'
import { FnGetNodeDetailsBasedOnKey } from '../../../../../shared/allcommon/tree/FnGetNodeDetailsBasedOnKey'
import { FnGetCheckedNodesForDeviceOrCableEntities } from '../../../../allcommon/FnGetCheckedNodesForDeviceOrCableEntities'
import { FnSearchKeywordInLocalTree } from '../../../../../shared/allcommon/settingsform/FnSearchKeywordInLocalTree'
import { FnProcessStringToCompare } from '../../../../../shared/allcommon/basic/FnProcessStringToCompare'
import { FnAddSubNode } from '../../../../../shared/allcommon/tree/FnAddSubNode'
import { IEditDeviceEntityMapping } from '../../../../allinterface/iappqaentitiescontainer/device/IEditDeviceEntityMapping'
import { IControl } from '../../../../../shared/allinterface/settingsform/ISettingsLibForm'
import { ITreeNode, ISelectedNodeInfo, IExpandedNodeInfo } from '../../../../../shared/allinterface/tree/ITreeControl'
import { IConvertedTreeResponse, IFeatureTree, ITreeForHierarchicalDataContainer } from '../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer'
import { Label } from '../../../../../shared/basic/label/Label'
import { SearchControl } from '../../../../../shared/searchfilter/searchcontrol/SearchControl'
import { DialogGridContainer } from './dialoggridcontainer/DialogGridContainer'
import { DisplayControlEnums } from '../../../../../shared/alldefaultprops/basic/DefaultPropsFormContainer'
import { TreeForHierarchicalDataContainer } from '../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer'
import { IView } from '../../../../../shared/allinterface/deviceview/IView'
import { FnFindNearestNodeByType } from '../../../../../shared/allcommon/FnFindNearestNodeByType'
import { PropertyTab } from '../../../../../shared/sidebar/devicemodel/PropertyTab'
import { DeviceModelFEnums } from '../../../../../shared/alldefaultprops/sidebar/DeviceModelEnums'
import { FnGetLibJson } from '../../../../../shared/allcommon/sidebar/FnGetLibJson'
import { FnGetEnvVariableByKey } from '../../../../../appcontainer/allcommon/FnGetEnvVariableByKey'
import { envVarEnums } from '../../../../../appcontainer/alldefaultprops/DefaultPropsAppContainer'
import { FnProcessMfgAcronym } from '../../../../../shared/allcommon/sidebar/FnProcessMfgAcronym'
import { FnConvertFlatDataToHierarchyData } from '../../../../../shared/allcommon/tree/FnConvertFlatDataToHierarchyData'
import { transformDeviceData } from '../../../../../shared/allcommon/sidebar/FnExtractKeyObjects'
import { FnGetKeyFromEntId } from '../../../../../shared/allcommon/settingsform/FnGetKeyFromEntId'
import { FnGenerateUID } from '../../../../../shared/allcommon/settingsform/FnGenerateUID'
import { useEditEntitiesContext } from '../../../../../shared/context/hooks/EditEntitiesHook'
import { ActionImage } from '../../../../../shared/basic/actionimage/ActionImage'
import { FnGetCssVariable } from '../../../../../appcontainer/allcommon/FnGetCssVariable'
import { Refresh24x24 } from '@n20a/libicon'
import { IImage } from '../../../../../shared/allinterface/basic/IImage'
import { OverlayTab } from '../../../../../shared/basic/overlaytab/OverlayTab'
import { FnGetCheckedNodesForNetZoomEntites } from '../../../../allcommon/FnGetCheckedNodesForNetZoomEntites'
import { BasicGrid } from '../../../../../shared/tablegrid/BasicGrid'
import { IBasicGridColDef } from '../../../../../shared/allinterface/tablegrid/IBasicGrid'
import { FnHandleAPIResponse } from '../../../../../shared/allcommon/settingsform/FnHandleAPIResponse'
import { FnGetColumnDefinitionsFromRow } from '../../../../allcommon/FnGetColumnDefinitionsFromRow'
import { D3Tree, IContainerSize, ID3Tree } from '@n20a/libd3tree'
import { YesNoFormContainer } from '../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer'
import { FnParseJsonSafely } from '../../../../../appcontainer/allcommon/FnParseJsonSafely'
import { Helptip } from '../../../../../shared/Help'

const EditDeviceEntityMapping = (editDeviceEntityMappingProps: IEditDeviceEntityMapping) => {
    const isFetchingRef = useRef(false);
    const selectedEntityKeyRef = useRef<Key | null>(null);
    const selectedModelKeyRef = useRef<Key | null>(null);
    const [treeDataDeviceEntities, setTreeDataDeviceEntities] = useState<ITreeNode[]>([]);
    const [treeContainerProps, setTreeContainerProps] = useState<ITreeForHierarchicalDataContainer>();
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [deviceSearchText, setDeviceSearchText] = useState<string>("");
    const [deviceSearchHistory, setDeviceSearchHistory] = useState<string[]>([]);
    const [mfgeqTypevsMfg, setMfgeqTypevsMfg] = useState<Record<string, any>>();
    const [selectedTabViewName, setSelectedTabViewName] = useState<string>("F")
    const [treeDataForModel, setTreeDataForModel] = useState<ITreeNode[]>([]);
    const [displayMode, setDisplayMode] = useState<"Property" | "Models" | "Preview">("Models");
    const [treeContainerPropsModelByType, setTreeContainerPropsModelByType] = useState<ITreeForHierarchicalDataContainer>();
    const [defaultSelectedKeysForModel, setDefaultSelectedKeysForModel] = useState<Key[]>([]);
    const [defaultExpandedKeysForModel, setDefaultExpandedKeysForModel] = useState<Key[]>([]);
    const [defaultStrictlyCheckedKeysForModel, setDefaultStrictlyCheckedKeysForModel] = useState<{
        checked: Key[];
        halfChecked: Key[];
    }>();
    const [defaultCheckedNodesModel, setDefaultCheckedNodesModel] = useState<ITreeNode[]>([]);
    // dialog control variables 
    const [isShowDialog, setIsShowDialog] = useState<boolean>(false);

    const [defaultSelectedNodeInfoModel, setDefaultSelectedNodeInfoModel] = useState<ISelectedNodeInfo | null>(null);
    const [entityTreeApiData, setEntityTreeApiData] = useState<unknown>();
    // confirm dialog variables 
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
    const [jsonFileHWEntites, setJsonFileHWEntites] = useState<Record<string, any>[]>();
    const [propertyTabData, setPropertyTabData] = useState<Record<string, any>[]>([])
    const [views, setView] = useState<IView[]>([])
    // start tables Tree variables
    const [treeDataForTables, setTreeDataForTables] = useState<ITreeNode[]>([]);
    const [treeContainerPropsForTables, setTreeContainerPropsForTables] = useState<ITreeForHierarchicalDataContainer>();
    const [defaultSelectedKeysForTables, setDefaultSelectedKeysForTables] = useState<Key[]>([]);
    const [defaultExpandedKeysForTables, setDefaultExpandedKeysForTables] = useState<Key[]>([]);
    const [defaultCheckedKeysForTables, setDefaultCheckedKeysForTables] = useState<Key[]>([]);
    const [defaultCheckedNodesForTables, setDefaultCheckedNodesForTables] = useState<ITreeNode[]>([]);
    const [showOkButtonOnly, setShowOkButtonOnly] = useState(false);
    const [defaultSelectedNodeInfoForTables, setDefaultSelectedNodeInfoForTables] = useState<ISelectedNodeInfo | null>(null);
    // Grid API and column data 
    const [apiDataForGrid, setApiDataForGrid] = useState<Record<string, any>[]>([]);
    const [columnDefsForGrid, setColumnDefsForGrid] = useState<IBasicGridColDef[]>([]);
    // end tables Tree variables

    //Start Preview variables
    const [containerDimensions, setContainerDimensions] = useState<IContainerSize>({ width: 1200, height: 800 });
    const [loading, setLoading] = useState<boolean>(true);
    const [jsonData, setJsonData] = useState<ID3Tree>();
    //End Preview variables

    const editDeviceEntitiesContext = useEditEntitiesContext()

    const statusBarContext = useStatusBarContext();
    const baseURL = FnGetEnvVariableByKey(envVarEnums.BASE_URL_LIB);

    const FnShowRemoteLibraryNotFound = () => {
        setShowConfirm(true)
        setShowOkButtonOnly(true)
        setConfirmMessage('Remote Device Library is not available!')
    }
    const handleNameChange = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        const featureTreeProps: IFeatureTree = {
            instanceName: "entity_treeview",
            allowCheckbox: false,
            allowIcon: false,
            hideCopyIcon: false,
            hideKebabMenu: true
        }
        const treeProps: ITreeForHierarchicalDataContainer = {
            uniqueName: `${editDeviceEntityMappingProps.uniqueName}-create-entities-tree`,
            apiData: undefined,
            featureId: editDeviceEntityMappingProps.featureId,
            featureTreeProps: featureTreeProps,
            allowGenerateTreeData: false
        }
        setTreeContainerProps(treeProps);

        // Pre-fetch remote library in parallel if not already cached in context
        const needsRemoteLib = !editDeviceEntitiesContext.hwEntityvsEqid || editDeviceEntitiesContext.hwEntityvsEqid.length === 0;
        const libPromise = needsRemoteLib
            ? (async () => {
                const startLibApi = performance.now();
                try {
                    const data = await FnGetLibJson(
                        "hwentityvseqid",
                        `${baseURL}/api/files/download/single`
                    );
                    const libApiDuration = performance.now() - startLibApi;
                    console.log(`[ _nk_device ] Device Entities - API Call (hwentityvseqid): ${libApiDuration.toFixed(2)} ms`);
                    return data;
                } catch (error) {
                    FnShowRemoteLibraryNotFound();
                    console.error("hwentityvseqid Error:", error);
                    return null;
                }
            })()
            : Promise.resolve(null);

        const startGetEntitiesApi = performance.now();
        const handleGetEntitiesApiResponse = async (getEntitiesApiResponse: unknown, status?: string) => {
            try {
                const apiDuration = performance.now() - startGetEntitiesApi;
                console.log(`[ _nk_device ] Device Entities - API Call (GetMfgEqtype): ${apiDuration.toFixed(2)} ms`);

                if (status === "200" && getEntitiesApiResponse && typeof getEntitiesApiResponse === "object" && 'hierarchyJson' in getEntitiesApiResponse) {
                    const buildEntityMap = (data: Record<string, any>[]) => {
                        const map: { EntityName: string; EntityShortName: string, Name: string, HwEntityName: string, Type: string }[] = [];
                        const seen = new Set<string>();

                        for (const item of data) {
                            if (!item?.EntityName) continue;

                            if (!seen.has(item.EntityName)) {
                                seen.add(item.EntityName);

                                map.push({
                                    HwEntityName: item.EntityName,
                                    Name: item.EntityName,
                                    Type: "Group",
                                    EntityName: "HWEntity",
                                    EntityShortName: item.EntityShortName
                                });
                            }
                        }

                        return map;
                    };
                    const addEntitiesToDataset = (data: Record<string, any>, entities: Record<string, any>[]) => {
                        if (
                            !data?.["HWEntity"]?.length ||
                            !Array.isArray(entities)
                        ) {
                            return data;
                        }

                        const deviceTypeObj: Record<string, any> = data["HWEntity"][0];
                        const existingDataset = deviceTypeObj.Dataset ?? [];

                        deviceTypeObj.Name = "Device Entities";

                        const map = new Map<string, any>();

                        // 1 Add existing records first
                        existingDataset.forEach((item: Record<string, any>) => {
                            if (item?.EntityName) {
                                map.set(item.EntityName?.replace("__", ""), item);
                            }
                        });

                        // 2 Merge new records (do not overwrite existing props)
                        entities.forEach(item => {
                            const cleanName = item.HwEntityName?.replace("__", "");
                            const existing = map.get(cleanName);
                            map.set(cleanName, {
                                ...existing,
                                EntID: null,
                                EntityName: cleanName,
                                Name: cleanName,
                                Description: "",
                                EntityShortName: item.EntityShortName,
                                Type: "Group",
                                Icon: null,
                                ShowKebab: false,
                                Selected: true,
                            });
                        });

                        // 3 Convert back to array + sort
                        deviceTypeObj.Dataset = Array.from(map.values()).sort((a, b) =>
                            a.Name?.localeCompare(b.Name ?? "", undefined, { sensitivity: "base" })
                        );

                        return data;
                    };

                    let hwentityvseqid: Record<string, any>[] = [];
                    const parsedData = FnParseJsonSafely((getEntitiesApiResponse as { hierarchyJson: string }).hierarchyJson);
                    const deviceTypeObj: Record<string, any> = parsedData && parsedData["HWEntity"][0];
                    const existingDataset: Record<string, any>[] = deviceTypeObj?.Dataset ?? [];

                    if (needsRemoteLib) {
                        const hwentityvseqidData = await libPromise;
                        hwentityvseqid = [...existingDataset];
                        if (Array.isArray(hwentityvseqidData)) {
                            hwentityvseqid.push(...hwentityvseqidData);
                        }
                        editDeviceEntitiesContext.setHwEntityvsEqid(hwentityvseqid);
                    } else {
                        hwentityvseqid = editDeviceEntitiesContext.hwEntityvsEqid ?? [];
                    }

                    setJsonFileHWEntites(hwentityvseqid);
                    const entitesData = buildEntityMap(hwentityvseqid);
                    const data = addEntitiesToDataset(parsedData, entitesData);
                    setEntityTreeApiData(data);
                }
            } finally {
                isFetchingRef.current = false;
                statusBarContext.setIsLoading(false);
            }
        };

        axiosInterceptor({
            url: HWENTITY.GetMfgEqtype,
            data: {
                entityType: "Device",
                isRefresh: editDeviceEntityMappingProps.isRefresh ?? false
            },
            allowShowLoader: true,
            setFetchData: handleGetEntitiesApiResponse
        }, statusBarContext);
    }

    useEffect(() => {
        // call API to get data for device entities
        handleNameChange();

    }, [editDeviceEntityMappingProps.uniqueName, editDeviceEntityMappingProps.featureId])

    useEffect(() => {
        const handleEntityApiDataChange = async () => {
            if (entityTreeApiData && treeContainerProps) {
                const convertResult: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(entityTreeApiData, treeContainerProps)
                if (convertResult) {

                    setTreeDataDeviceEntities(convertResult.treeData);
                    setDefaultExpandedKeys(convertResult.expandedKeys);
                    if (convertResult.selectedKey)
                        setDefaultSelectedKeys([convertResult.selectedKey]);
                    convertResult.selectedNode && setDefaultSelectedNodeInfo({
                        event: 'select',
                        selected: true,
                        node: convertResult.selectedNode,
                        selectedNodes: [convertResult.selectedNode]
                    });
                }
                else {
                    setTreeDataDeviceEntities([])
                }
            }
        }
        handleEntityApiDataChange();
    }, [entityTreeApiData, treeContainerProps])

    const handleSearchEditDeviceEntityMapping = async (isNext: boolean = false, isRegex: boolean = false) => {
        if (deviceSearchText.length > 0 && treeDataDeviceEntities) {
            const historyToExclude = isNext ? deviceSearchHistory : [];
            //Search in user tree data.
            let foundedNode = FnSearchKeywordInLocalTree(
                deviceSearchText,
                treeDataDeviceEntities,
                historyToExclude,
                [],
                isRegex
            );

            if (foundedNode && foundedNode.foundNode) {
                const parentNodeKeys = foundedNode?.parentNodes?.map((item: ITreeNode) => item.key);
                setDefaultExpandedKeys([...parentNodeKeys, ...defaultExpandedKeys]);
                setDefaultSelectedKeys([foundedNode.foundNode.key]);
                setDeviceSearchHistory(prev => isNext ? [...prev, foundedNode.foundNode!.key] : [foundedNode.foundNode!.key]);
                setDefaultSelectedNodeInfo(null);
                setTreeContainerPropsModelByType(undefined);
                setDefaultExpandedKeysForModel([]);
                setDefaultStrictlyCheckedKeysForModel({
                    checked: [],
                    halfChecked: []
                });
                setDefaultSelectedNodeInfo({
                    event: "auto-select",
                    node: foundedNode.foundNode,
                    selected: true,
                    selectedNodes: []
                });
            } else {
                if (!isNext) {
                    setDeviceSearchHistory([]);
                }
                const message = isNext ? "No next node found" : "No matching node found";
                setShowConfirm(true);
                setShowOkButtonOnly(true);
                setConfirmMessage(message);
            }
        }
    }

    const handleNodeSelectDeviceTree = (_selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        selectedEntityKeyRef.current = info.node.key;
        selectedModelKeyRef.current = null;
        setDefaultSelectedNodeInfo(null);
        setTreeContainerPropsModelByType(undefined);
        setDefaultExpandedKeysForModel([]);
        setDefaultStrictlyCheckedKeysForModel({
            checked: [],
            halfChecked: []
        });
        setDefaultSelectedNodeInfo(info);
        setDefaultSelectedKeys([info.node.key]);
        setDefaultExpandedKeys(expandedKeys);
    }

    useEffect(() => {
        if (defaultSelectedNodeInfo?.node && FnProcessStringToCompare(defaultSelectedNodeInfo?.node.treetype, "Dataset")) {
            const handleDeviceNodeSelectionChange = async () => {
                const featureTreePropsModel: IFeatureTree = {
                    instanceName: "model_by_type_treeview",
                    allowCheckbox: true,
                    allowIcon: false,
                    hideCopyIcon: false,
                    hideKebabMenu: false,
                    allowCheckStrictly: true,
                    allowVirtual: true
                }
                const treePropsModel: ITreeForHierarchicalDataContainer = {
                    uniqueName: `${editDeviceEntityMappingProps.uniqueName}-model-by-type-tree`,
                    apiData: undefined,
                    featureId: editDeviceEntityMappingProps.featureId,
                    featureTreeProps: featureTreePropsModel,
                    allowGenerateTreeData: false
                }

                const makeEntityTree = async (ApiData: Record<string, any>[]) => {
                    const makeApiDataBasedOnCatch = (apiData: Record<string, any>[]) => {
                        const sortBySelectionAndName = (data: Record<string, any>[]) => {
                            return [...data].sort((a, b) => {
                                const aSelected = a.Selected || a.Checked;
                                const bSelected = b.Selected || b.Checked;

                                // 1️ selected/checked first
                                if (aSelected !== bSelected) {
                                    return aSelected ? -1 : 1;
                                }

                                // 2️ alphabetical order by Name
                                return a.Name.localeCompare(b.Name);
                            });
                        };
                        if (!Array.isArray(apiData)) return { HwEntity: [] };
                        const EntID = FnGenerateUID()
                        const selectedName =
                            defaultSelectedNodeInfo?.node?.NodeEntityname?.toLowerCase() ?? "";

                        const list = new Set<string>();
                        const seenNames = new Map<string, Record<string, any>>();

                        apiData.forEach((item: Record<string, any>) => {
                            const name = item.MfgEqType ? item.MfgEqType : item.Name;
                            if (list.has(name)) return;

                            const entityName = item.EntityName?.toLowerCase?.() ?? "";
                            const isSelected = selectedName ? entityName.includes(selectedName) : false;

                            const record = {
                                ...item,
                                Name: name,
                                HasChildren: 1,
                                HwEntityName: item.HwEntityName
                                    ? item.HwEntityName.replace("__", "")
                                    : item.EntityName?.replace("__", ""),
                                NodeType: "DeviceType",
                                EntID: item.MfgEqType
                                    ? item.MfgEqType
                                    : `${item.Name}_${item.EntityShortName}`,
                                parentEntID: EntID,
                                isLeaf: false,
                                Selected: isSelected,
                                Checked: isSelected,
                            };

                            seenNames.set(name, record);

                            if (isSelected) {
                                list.add(name);
                            }
                        });
                        const uniqueDataset = sortBySelectionAndName(Array.from(seenNames.values()));

                        return {
                            HwEntity: [
                                {
                                    Name: "Device Type",
                                    Description: "Device Type",
                                    NodeType: "HwEntity",
                                    EntID: EntID,
                                    Dataset: uniqueDataset,
                                },
                            ],
                        };
                    };

                    const updateData = makeApiDataBasedOnCatch(ApiData);
                    const convertResult: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(updateData, treePropsModel);
                    if (convertResult) {

                        const checkedResult = FnGetCheckedNodesForDeviceOrCableEntities(convertResult.treeData, true);

                        setTreeContainerPropsModelByType(treePropsModel);
                        setDefaultExpandedKeysForModel(convertResult.expandedKeys);

                        const isNewEntity = selectedEntityKeyRef.current !== defaultSelectedNodeInfo?.node?.key;
                        if (isNewEntity) {
                            selectedEntityKeyRef.current = defaultSelectedNodeInfo?.node?.key || null;
                            selectedModelKeyRef.current = convertResult.selectedKey || null;

                            if (convertResult.selectedKey)
                                setDefaultSelectedKeysForModel([convertResult.selectedKey]);
                            if (convertResult.selectedNode)
                                setDefaultSelectedNodeInfoModel({
                                    event: 'select',
                                    selected: true,
                                    node: convertResult.selectedNode,
                                    selectedNodes: [convertResult.selectedNode]
                                });
                        } else {
                            const preservedKey = selectedModelKeyRef.current;
                            if (preservedKey) {
                                setDefaultSelectedKeysForModel([preservedKey]);
                                const targetTree = checkedResult.checkedKeys ? checkedResult.updatedTree : convertResult.treeData;
                                const found = FnGetNodeDetailsBasedOnKey(targetTree, preservedKey);
                                if (found?.node) {
                                    setDefaultSelectedNodeInfoModel({
                                        event: 'select',
                                        selected: true,
                                        node: found.node,
                                        selectedNodes: [found.node]
                                    });
                                }
                                await FnUpdateTreeNodeBasedOnKeyForHierarchicalData(
                                    targetTree,
                                    preservedKey,
                                    treePropsModel.featureTreeProps.hideCopyIcon === false,
                                    treePropsModel.featureTreeProps.hideKebabMenu === false,
                                    treePropsModel,
                                    undefined,
                                    handleKebabMenuSelectForModel
                                );
                            }
                        }

                        if (checkedResult.checkedKeys) {
                            setDefaultStrictlyCheckedKeysForModel({
                                checked: checkedResult.checkedKeys,
                                halfChecked: checkedResult.halfCheckedKeys
                            });
                            setDefaultCheckedNodesModel(checkedResult.checkedNodes);
                            setTreeDataForModel(checkedResult.updatedTree);
                        }
                        else {
                            setTreeDataForModel(convertResult.treeData);
                        }
                    }
                    else {
                        setTreeDataForModel([])
                    }
                }
                if (jsonFileHWEntites) {
                    makeEntityTree(jsonFileHWEntites)
                }
            }
            handleDeviceNodeSelectionChange();
            // CALL api to get modelByType to get data

        }
    }, [defaultSelectedNodeInfo?.node, editDeviceEntityMappingProps.uniqueName, editDeviceEntityMappingProps.featureId, jsonFileHWEntites])

    const handleNodeSelectModel = async (_selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        selectedModelKeyRef.current = info.node.key;
        setDefaultSelectedKeysForModel([info.node.key]);
        setDefaultSelectedNodeInfoModel(info);
        setDefaultExpandedKeysForModel(expandedKeys);
        const checkIDs = {
            checked: Array.from(
                new Set([...defaultStrictlyCheckedKeysForModel?.checked ?? [], info.node.key])
            ),
            halfChecked: [...defaultStrictlyCheckedKeysForModel?.halfChecked ?? []]
        };
        setDefaultStrictlyCheckedKeysForModel(checkIDs)
        let eqid = info.node.EQID
        if (info.node.NodeType === "DeviceType") {
            if (info.node.NodeEntityname !== defaultSelectedNodeInfo?.node.NodeEntityname) {
                await makeApiCallForAddEntity(defaultSelectedNodeInfo?.node.NodeEntityname ?? "", defaultSelectedNodeInfo?.node.EntityShortName ?? "", info.node.Name ?? "", info.node.Name ?? "", info.node.NodeEntityname ?? "")
            }
        }
        if (propertyTabData.length === 0) {
            if (info.node.treetype === "Views") {
                const foundNode = FnFindNearestNodeByType(treeDataForModel, info.node, "ProductNumber")
                if (foundNode?.EQID) {
                    eqid = foundNode?.EQID
                }
            }
            if (eqid) {
                handleShowPropertyTab(info, treeDataForModel)
            } else {
                setPropertyTabData([])
            }
        } else {
            if (info.node.treetype === "View") {
                setSelectedTabViewName(info.node.Name as string)
            } else {
                setSelectedTabViewName("F")
            }
        }
    }

    const handleNodeCheckForModel = async (checked: Key[] | { checked: Key[]; halfChecked: Key[] }, info: CheckInfo<ITreeNode>) => {
        if (!info.checked) {
            if (info.node.key === defaultSelectedNodeInfo?.node.key) {
                return;
            }
        }

        if (info.checked === false) {
            if (info.checkedNodes.length === 0 && defaultSelectedNodeInfo) {
                setShowConfirm(true);
                setConfirmMessage(`All unassigned MfgEqType will be automatically assigned to Entityname: Other and any unassigned EQID will return to their default Entityname.
                                        You are about to delete last assignment to the selected Entity. An Entity name with no assignment are automatically deleted. 
                                        Are you sure you wish to delete Device Entity: ${defaultSelectedNodeInfo?.node?.Name}`);
            }
            else {
                makeApiCallForAddEntity("OtherDevice", "Other", info.node.Name ?? "", info.node.Name ?? "", info.node.NodeEntityname ?? "")
                setDefaultStrictlyCheckedKeysForModel(checked as { checked: Key[]; halfChecked: Key[] });
                setDefaultCheckedNodesModel(info.checkedNodes);
            }
        }
        else {
            setDefaultStrictlyCheckedKeysForModel(checked as { checked: Key[]; halfChecked: Key[] });
            setDefaultCheckedNodesModel(info.checkedNodes);
            await makeApiCallForAddEntity(defaultSelectedNodeInfo?.node.NodeEntityname ?? "", defaultSelectedNodeInfo?.node.EntityShortName ?? "", info.node.Name ?? "", info.node.Name ?? "", info.node.NodeEntityname ?? "")
        }
    }

    const callApiToRefreshEntityTree = () => {
        isFetchingRef.current = false;
        editDeviceEntitiesContext.setHwEntityvsEqid([]);
        handleNameChange();
    }

    const handleConfirmYes = async () => {
        const data = await makeApiCallForAddEntity("OtherDevice", "Other", defaultSelectedNodeInfoModel?.node.Name ?? "", defaultSelectedNodeInfo?.node.Name ?? "", defaultSelectedNodeInfoModel?.node.NodeEntityname ?? "")
        if (data) {
            setDefaultCheckedNodesModel([]);
            setDefaultStrictlyCheckedKeysForModel({
                checked: [],
                halfChecked: []
            });
        }
        setShowConfirm(false);
        setConfirmMessage(null);
    }

    const handleConfirmNo = () => {
        setShowConfirm(false);
        setConfirmMessage(null);
        if (defaultStrictlyCheckedKeysForModel) {
            setDefaultCheckedNodesModel(defaultCheckedNodesModel);
            setDefaultStrictlyCheckedKeysForModel(defaultStrictlyCheckedKeysForModel);
        }
    }

    const formatDataForFlatTree = async (data: Record<string, any>[], Node: ITreeNode) => {
        let formattedData: Record<string, any>[] = [];
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            let nodeObj = { ...element }
            const unicMfgEQType = data.filter((item: Record<string, any>) => item.mty === element.mty);

            if (data.length === 1 && unicMfgEQType.length === 1) {
                try {
                    const eqidsSortName = FnProcessMfgAcronym(element.id)
                    let detailsObj: Record<string, any>[] | undefined;
                    const fetchedDetails = await FnGetLibJson('details/' + eqidsSortName + '/' + element.id, `${baseURL}/api/files/download/single`);
                    if (Array.isArray(fetchedDetails) && fetchedDetails.length > 0) {
                        detailsObj = fetchedDetails;
                        const detail = detailsObj[0];
                        nodeObj = { ...nodeObj, Views: detail.Views, details: JSON.stringify(detailsObj) };
                    }
                } catch (e) {
                    FnShowRemoteLibraryNotFound()
                    console.error("Error in FnGetLibJson", e)
                }
            }
            if (nodeObj) {
                if (nodeObj.Views && (data.length === 1 && unicMfgEQType.length === 1)) {
                    const parsedData = typeof nodeObj.Views === "string" ? FnParseJsonSafely(nodeObj.Views) : nodeObj.Views;
                    if (Array.isArray(parsedData) && parsedData.length) {
                        for (let index = 0; index < parsedData.length; index++) {
                            const viewElement = parsedData[index];
                            const obj = {

                                ProductEntID: nodeObj.id,
                                ProductEQID: nodeObj.id,
                                ProductEQType: nodeObj.ty,
                                ProductName: nodeObj.pno,
                                ProductDescription: nodeObj.md,
                                ProductAttrib: nodeObj.Attrib,
                                ProductParentID: Node.NodeEntID,
                                ProductDetailsJson: nodeObj.details,
                                ProductHasChildren: viewElement.ViewShortName ? true : false,
                                ProductDeviceEntId: nodeObj.entid,
                                ProductContainer: "hwentity",
                                ViewName: viewElement.ViewShortName === "F" ? "Front" : "Rear",
                                ViewEntID: viewElement.ShapeID,
                                ViewNodeType: viewElement.ViewShortName,
                                ViewParentID: nodeObj.id,
                                ViewEQID: nodeObj.id,
                                ViewParentEQID: nodeObj.id,
                                ViewEQType: nodeObj.ty,
                                ViewDetailsJson: nodeObj.details,
                                ViewDeviceViewEntId: nodeObj.EntID
                            }
                            formattedData.push(obj)
                        }
                    }
                } else {
                    let obj = {
                        ProductEntID: nodeObj.id,
                        ProductEQID: nodeObj.id,
                        ProductContainer: "hwentity",
                        ProductEQType: nodeObj.ty,
                        ProductName: nodeObj.pno,
                        ProductDescription: nodeObj.md,
                        ProductAttrib: nodeObj.Attrib,
                        ProductDetailsJson: nodeObj.details,
                        ProductParentID: Node.NodeEntID,
                        ProductNodeType: "Product",
                        ProductHasChildren: true,
                        ProductDeviceEntId: nodeObj.entid,

                    }
                    formattedData.push(obj)
                }
            }
        }
        return formattedData
    }

    function createViewsForShape(data: Record<string, any>[], selectedEqid: string): IView[] {
        return data
            .filter(item => item.ViewShortName)
            .sort((a, b) => a.ViewShortName.localeCompare(b.ViewShortName))
            .map(item => ({
                svg: (item.bSVG ?? item.SVGFile ?? '').trim(),
                viewTitle: selectedEqid,
                uniqueName: `svg_${item.ShapeID}_${item.ViewShortName}`,
                tab: {
                    label: item.ViewShortName === "F" || item.ViewShortName === "Front" ? "Front" : "Rear",
                    tooltip: item.ViewShortName === "F" || item.ViewShortName === "Front" ? "Front" : "Rear",
                },
            }));
    }
    const handleShowPropertyTab = async (info: ISelectedNodeInfo, updatedTreeData?: ITreeNode[]) => {
        if (info.node.DetailsJson || info.node.NodeType === "Product" || (!info.node.DetailsJson && info.node.treetype === "View")) {
            let details = info.node.DetailsJson && typeof info.node.DetailsJson === "string" ? FnParseJsonSafely(info.node.DetailsJson) : null
            if (!info.node.DetailsJson) {
                try {
                    const eqidsSortName = FnProcessMfgAcronym(info.node.EQID as string)
                    details = await FnGetLibJson('details/' + eqidsSortName + '/' + info.node.EQID, `${baseURL}/api/files/download/single`)
                } catch (e) {
                    FnShowRemoteLibraryNotFound()
                    console.error("Error in FnGetLibJson", e)
                }

            }
            if (details.Details) {
                details = details.Details
            }
            if (details.length) {

                if (details[0].Properties) {
                    let property = typeof details[0].Properties === "string" ? FnParseJsonSafely(details[0].Properties as string) : details[0].Properties
                    if (property.length) {
                        let data = transformDeviceData(typeof property[0].PropertyJSON === "string" ? FnParseJsonSafely(property[0].PropertyJSON as string) : property[0].PropertyJSON)
                        setPropertyTabData(data)
                    }
                } else {
                    setPropertyTabData([])
                }

                if (details[0].Views) {
                    let Views = typeof details[0].Views === "string" ? FnParseJsonSafely(details[0].Views as string) : details[0].Views
                    let name = info.node.Name
                    if (info.node.treetype === "View" && updatedTreeData && info.node.parentEntID) {
                        const parentNode = FnGetKeyFromEntId(updatedTreeData, info.node.parentEntID, true)
                        if (parentNode.node && parentNode.node.node.Name) {
                            name = parentNode.node.node.Name as string
                        }
                    }
                    if (Views.length) {
                        try {
                            let viewTabs: IView[] = []
                            const eqidsSortName = FnProcessMfgAcronym(Views[0].EQID as string)
                            const shapes = await FnGetLibJson('shapes/' + eqidsSortName + '/' + Views[0].EQID, `${baseURL}/api/files/download/single`)

                            if (Array.isArray(shapes)) {
                                const viewObj = createViewsForShape(shapes, name as string)

                                viewTabs = viewObj
                                if (info.node.treetype === "View") {
                                    setSelectedTabViewName(info.node.Name as string)
                                } else {
                                    setSelectedTabViewName("F")
                                }
                                setView([...viewTabs])
                            }
                        } catch (e) {
                            FnShowRemoteLibraryNotFound()
                            console.error("Error in FnGetLibJson", e)
                        }

                    }
                } else {
                    setView([])
                }
            }
        }
    }

    const handleNodeExpandForModel = async (_expandedNodeKeys: Key[], info: IExpandedNodeInfo) => {
        if (info && info.node) {
            if (info.node.NodeType === "DeviceType") {
                const handleGetFilteredDevicesByMfgeqtype = async (mfgTypes: Record<string, any>) => {
                    statusBarContext.setIsLoading(true);
                    const filterSelectedNode = mfgTypes.MfgEqTypevsMfg && mfgTypes.MfgEqTypevsMfg.filter((item: Record<string, any>) => item.mty === info.node.Name)?.filter(
                        (item: Record<string, any>, index: number, self: Record<string, any>[]) =>
                            index === self.findIndex(i => i.mfg === item.mfg)
                    );
                    if (filterSelectedNode.length) {
                        const makeTreeApiData = []
                        for (let index = 0; index < filterSelectedNode.length; index++) {
                            const element = filterSelectedNode[index];
                            makeTreeApiData.push({
                                ...element,
                                Name: element.mfg,
                                NodeType: "Mfg",
                                HasChildren: 1,
                                isLeaf: false,
                                parentEntID: info.node.NodeEntID,
                                EntID: info.node.key + element.mfg,
                                // container: "hwentity"
                            })
                        }
                        if (treeContainerPropsModelByType) {
                            const convertedData: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree({ "Mfg": makeTreeApiData }, treeContainerPropsModelByType, undefined, {
                                enabled: true,
                                sortBy: "Name"
                            }, info.node.NodeEntID ?? "");

                            if (convertedData && convertedData.treeData && convertedData.treeData.length > 0) {

                                const updatedTree = await FnAddSubNode(treeDataForModel, info.node.key, convertedData.treeData.length > 1 ? convertedData.treeData : convertedData.treeData[0].children, treeContainerPropsModelByType.featureTreeProps, editDeviceEntityMappingProps.featureId, false, info.node.stepNo);
                                if (defaultExpandedKeysForModel) {
                                    defaultExpandedKeysForModel.push(info.node.key);
                                    setDefaultExpandedKeysForModel(defaultExpandedKeysForModel);
                                    setDefaultSelectedKeysForModel([convertedData.treeData.length > 1 ? convertedData.treeData[0].key : convertedData.treeData[0].children[0].key])
                                    setDefaultSelectedNodeInfo({
                                        event: "select",
                                        node: convertedData.treeData.length > 1 ? convertedData.treeData[0] : convertedData.treeData[0].children[0],
                                        selected: true,
                                        selectedNodes: []
                                    })
                                }
                                setTreeDataForModel([...updatedTree]);
                                statusBarContext.setIsLoading(false);
                            }
                            else {
                                setTreeDataForModel([])
                            }
                        }
                    }
                }
                if (mfgeqTypevsMfg) {
                    handleGetFilteredDevicesByMfgeqtype(mfgeqTypevsMfg)
                } else {
                    try {
                        statusBarContext.setIsLoading(true);
                        const mfgeqtypevsmfg = await FnGetLibJson('mfgeqtypevsmfg', `${baseURL}/api/files/download/single`)
                        if (mfgeqtypevsmfg && typeof mfgeqtypevsmfg === 'object') {
                            setMfgeqTypevsMfg(mfgeqtypevsmfg as Record<string, any>)
                            handleGetFilteredDevicesByMfgeqtype(mfgeqtypevsmfg as Record<string, any>)
                            statusBarContext.setIsLoading(false);
                        }
                    } catch (e) {
                        FnShowRemoteLibraryNotFound()
                        console.error("Error in FnGetLibJson", e)
                    }

                }
            } else if (info.node.NodeType === "Mfg") {
                try {
                    statusBarContext.setIsLoading(true);
                    const mfgeqtypevsmfg = await FnGetLibJson(`search/${info.node.ma}`, `${baseURL}/api/files/download/single`)
                    if (mfgeqTypevsMfg && mfgeqtypevsmfg && typeof mfgeqtypevsmfg === 'object' && 'Search' in mfgeqtypevsmfg && Array.isArray((mfgeqtypevsmfg as { Search: Record<string, any>[] }).Search)) {
                        let filteredSearch: Record<string, any>[] = [];
                        const deviceType = FnFindNearestNodeByType(treeDataForModel, info.node, "DeviceType")
                        filteredSearch = (mfgeqtypevsmfg as { Search: Record<string, any>[] }).Search.filter((item: Record<string, any>) => item.mty === deviceType?.Name);
                        const apiData = await formatDataForFlatTree(filteredSearch, info.node)
                        const hierarchyData = await FnConvertFlatDataToHierarchyData({ "deviceModel": apiData }, info.node.NodeEntID, editDeviceEntityMappingProps.featureId, "AllSites", "DeviceModel")

                        if (hierarchyData && treeContainerPropsModelByType) {
                            const updatedTree = await FnAddSubNode(treeDataForModel, info.node.key, hierarchyData, treeContainerPropsModelByType.featureTreeProps, editDeviceEntityMappingProps.featureId, false, info.node.stepNo);
                            if (defaultExpandedKeysForModel) {
                                const expandedKeys = [...defaultExpandedKeysForModel, info.node.key];
                                if ((hierarchyData.length === 1 && hierarchyData[0].children) || info.node.children.length === 1) {
                                    if (hierarchyData[0].children) {
                                        expandedKeys.push(hierarchyData[0].key);
                                    } else {
                                        expandedKeys.push(info.node.children[0].key);
                                    }
                                }
                                setDefaultExpandedKeysForModel([...expandedKeys]);
                                setDefaultSelectedKeysForModel([hierarchyData.length > 1 ? hierarchyData[0].key : hierarchyData[0].children[0].key])
                                setDefaultSelectedNodeInfoModel({
                                    event: "select",
                                    node: hierarchyData.length > 1 ? hierarchyData[0] : hierarchyData[0].children[0],
                                    selected: true,
                                    selectedNodes: []
                                })
                                if (hierarchyData && hierarchyData.length) {

                                    const selectedNodeInfo: ISelectedNodeInfo = {
                                        event: "auto-select",
                                        selected: true,
                                        node: hierarchyData.length > 1 ? hierarchyData[0] : hierarchyData[0].children[0],
                                        selectedNodes: [hierarchyData.length > 1 ? hierarchyData[0] : hierarchyData[0].children[0]],
                                    }

                                    handleShowPropertyTab(selectedNodeInfo, updatedTree)
                                }
                            }
                            setTreeDataForModel([...updatedTree]);
                            statusBarContext.setIsLoading(false);
                        }
                    }
                } catch (e) {
                    FnShowRemoteLibraryNotFound()
                    console.error("Error in FnGetLibJson", e)
                }

            } else if (info.node.NodeType === "Product" || (info.node.treetype === "Eqtype" && info.node.children.length === 1)) {
                try {
                    statusBarContext.setIsLoading(true);
                    defaultExpandedKeysForModel.push(info.node.key);
                    setDefaultExpandedKeysForModel(defaultExpandedKeysForModel);
                    const key = info.node.treetype === "Eqtype" && info.node.children.length === 1 ? info.node.children[0].key : info.node.key
                    const EqId = info.node.EQID !== "" ? info.node.EQID : info.node.children && info.node.children[0].EQID
                    const eqidsSortName = FnProcessMfgAcronym(EqId as string)
                    const rawDetails = await FnGetLibJson('details/' + eqidsSortName + '/' + EqId, `${baseURL}/api/files/download/single`)
                    if (rawDetails) {
                        let nodeObj: Record<string, any> = {}
                        let detailsList: Record<string, any>[] | undefined = undefined;
                        if (typeof rawDetails === 'object' && rawDetails !== null && 'Details' in rawDetails && Array.isArray((rawDetails as { Details: Record<string, any>[] }).Details)) {
                            detailsList = (rawDetails as { Details: Record<string, any>[] }).Details;
                        } else if (Array.isArray(rawDetails)) {
                            detailsList = rawDetails;
                        }
                        if (detailsList && detailsList.length > 0) {
                            nodeObj = { Views: detailsList[0].Views, details: JSON.stringify(detailsList) }
                        }
                        let formattedData = []
                        if (nodeObj && nodeObj.Views) {
                            const parsedData = typeof nodeObj.Views === "string" ? FnParseJsonSafely(nodeObj.Views) : nodeObj.Views
                            if (Array.isArray(parsedData) && parsedData.length) {
                                for (let index = 0; index < parsedData.length; index++) {
                                    const viewElement = parsedData[index];
                                    const obj = {
                                        ViewName: viewElement.ViewShortName === "F" ? "Front" : "Rear",
                                        ViewEQID: EqId ?? "",
                                        ViewParentEQID: info.node.key,
                                        ViewEntID: viewElement.ShapeID,
                                        ViewNodeType: viewElement.ViewShortName,
                                        ViewDeviceViewEntId: nodeObj.EntID,
                                        ViewDetailsJson: nodeObj.details
                                    }
                                    formattedData.push(obj)
                                }
                            }
                            let hierarchyData = await FnConvertFlatDataToHierarchyData({ "deviceModel": formattedData }, null, editDeviceEntityMappingProps.featureId)
                            if (hierarchyData && treeContainerPropsModelByType) {
                                const updatedTree = await FnAddSubNode(treeDataForModel, key, (hierarchyData.length > 1 || hierarchyData[0]?.children.length == 0) ? hierarchyData : hierarchyData[0].children as ITreeNode[], treeContainerPropsModelByType.featureTreeProps, editDeviceEntityMappingProps.featureId, false, info.node.stepNo);
                                if (defaultExpandedKeysForModel) {

                                    const expandedKeys = [...defaultExpandedKeysForModel, info.node.key];
                                    if (info.node.treetype === "Eqtype" || info.node.children.length === 1) {
                                        expandedKeys.push(info.node.children[0].key);
                                    }
                                    if (hierarchyData[0].children.length == 0) {
                                        expandedKeys.push(hierarchyData[0].key);
                                    }
                                    setDefaultExpandedKeysForModel(expandedKeys);
                                    setDefaultSelectedKeysForModel([(hierarchyData.length > 1 || hierarchyData[0].children.length == 0) ? hierarchyData[0].key : (hierarchyData[0].children && hierarchyData[0].children[0]?.key)])
                                    setDefaultSelectedNodeInfoModel({
                                        event: "select",
                                        node: (hierarchyData.length > 1 || hierarchyData[0].children.length == 0) ? hierarchyData[0] : hierarchyData[0]?.children && hierarchyData[0].children[0],
                                        selected: true,
                                        selectedNodes: []
                                    })
                                    setTreeDataForModel([...updatedTree]);
                                }
                                for (let index = 0; index < hierarchyData.length; index++) {
                                    const element = hierarchyData[index];
                                    if (element) {
                                        element.parentEntID = EqId as string
                                    }
                                }
                                if (hierarchyData && hierarchyData.length) {

                                    const selectedNodeInfo: ISelectedNodeInfo = {
                                        event: "auto-select",
                                        selected: true,
                                        node: hierarchyData.length ? hierarchyData[0] : info.node,
                                        selectedNodes: [hierarchyData.length ? hierarchyData[0] : info.node],
                                    }
                                    handleShowPropertyTab(selectedNodeInfo, updatedTree)
                                }

                                statusBarContext.setIsLoading(false);
                            }
                        }
                    }
                } catch (e) {
                    FnShowRemoteLibraryNotFound()
                    console.error("Error in FnGetLibJson", e)
                }
            }
        } else {
            defaultExpandedKeysForModel.push(info.node.key);
            setDefaultExpandedKeysForModel(defaultExpandedKeysForModel);
        }
        statusBarContext.setIsLoading(false);
    }

    const rowData: IControl[] = [
        {
            AutoID: 0,
            CanChange: 1,
            IsRequired: 0,
            GroupName: "",
            GroupNameDesc: "",
            SubGroupEntID: "",
            SubGroupName: "",
            SubGroupNameDesc: "",
            _AP: "EntityName",
            PropertyLabel: "Entity Name",
            NameDesc: "Entity Name",
            DefaultAPValue: "",
            Value: "",
            ValueDesc: "",
            SortOrder: 1,
            MaxInstances: 0,
            InputMask: "refEntityNames",
            RegEx: "",
            DisplayGroupControl: "",
            DisplayControl: DisplayControlEnums.EditComboControl,
            ChangeEvent: "",
            Secured: false,
            IsNZ: true,
            EntID: "",
            RecID: "",
            LastUpdated: "",
            EntityName: "",
            Name: "EntityName",
            disabled: false,
            isNewLine: false,
            IsSaved: false,
            OldValue: "",
            IsReadOnly: false
        },
        {
            AutoID: 0,
            CanChange: 1,
            IsRequired: 0,
            GroupName: "",
            GroupNameDesc: "",
            SubGroupEntID: "",
            SubGroupName: "",
            SubGroupNameDesc: "",
            _AP: "EntityShortName",
            PropertyLabel: "Entity Short Name",
            NameDesc: "Entity Short Name",
            DefaultAPValue: "",
            Value: "",
            ValueDesc: "",
            SortOrder: 1,
            MaxInstances: 0,
            InputMask: "refEntityShortNames",
            RegEx: "",
            DisplayGroupControl: "",
            DisplayControl: DisplayControlEnums.EditComboControl,
            ChangeEvent: "",
            Secured: false,
            IsNZ: true,
            EntID: "",
            RecID: "",
            LastUpdated: "",
            EntityName: "",
            Name: "EntityShortName",
            disabled: false,
            isNewLine: true,
            IsSaved: false,
            OldValue: "",
            IsReadOnly: false
        }
    ];

    const handleKebabMenuSelectForModel = (_selectedItem: Record<string, any>) => {
        setIsShowDialog(true);
    }

    const makeApiCallForAddEntity = (
        EntityName: string,
        EntityShortName: string,
        mfgEqTypeData: string,
        updateNodeName: string,
        updateNodeEntityname: string,
        eqid?: string
    ): Promise<Record<string, any> | string> => {
        if (!EntityName) {
            return Promise.reject("EntityName is required");
        }
        return new Promise((resolve, reject) => {
            const handleAddEntityApiResponse = (addEntityApiResponse: unknown, status?: string) => {
                if (status === "200" && addEntityApiResponse !== undefined) {
                    statusBarContext.setIsLoading(true);

                    const updateHwEntities = (
                        jsonFileHWEntites: Record<string, any>[],
                        updateNodeName: string,
                        EntityName: string,
                        EntityShortName: string
                    ) => {

                        return jsonFileHWEntites.map(item => {
                            if (
                                (item.MfgEqType === updateNodeName || item.Name === updateNodeName) &&
                                item.EntityName === updateNodeEntityname
                            ) {
                                return {
                                    ...item,
                                    EntityName,
                                    EntityShortName,
                                };
                            }
                            return item;
                        });
                    };
                    if (jsonFileHWEntites) {
                        const updatedData = updateHwEntities(jsonFileHWEntites, updateNodeName, EntityName, EntityShortName)
                        setJsonFileHWEntites(updatedData);

                        editDeviceEntitiesContext.setHwEntityvsEqid(updatedData)

                    }

                    statusBarContext.setIsLoading(false);
                    resolve(status); //  send response back
                } else {
                    reject("Add Entity API returned undefined response");
                }
            };

            axiosInterceptor(
                {
                    url: HWENTITY.AddMfgEqType,
                    data: {

                        "entityType": "Device",
                        "entityName": EntityName,
                        "entityShortName": EntityShortName,
                        "mfgEqType": mfgEqTypeData,
                        "eqid": eqid

                    },
                    allowShowLoader: true,
                    setFetchData: handleAddEntityApiResponse,
                },
                statusBarContext
            );
        });
    };

    const handleDialogAction = async (_event: Record<string, any>, _actionCode?: string | undefined) => {
        setIsShowDialog(false);
    }


    /* dialog contaner end */
    const resetImageData: IImage = {
        source: <Refresh24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Refesh",
        uniqueName: 'user-profile-ireset',
        type: 'svg'
    }
    let tabsObj = [
        {
            "label": "Models",
            "tooltip": "assign/unassign Device Types"
        },
        {
            "label": "Property",
            "tooltip": "Assign/unassign property tables"
        },
        {
            "label": "Preview",
            "tooltip": "Preview Entity Data Structure"
        }
    ]

    // start Tabes Tree Events
    useEffect(() => {
        if (defaultSelectedNodeInfo?.node && (displayMode === "Property" || displayMode === "Preview")) {
            if (displayMode === "Property") {
                const handleDeviceNodeSelectionChange = async () => {
                    const featureTreePropsForTables: IFeatureTree = {
                        instanceName: "nz_entity_tables_treeview",
                        allowCheckbox: true,
                        allowIcon: false,
                        hideCopyIcon: false,
                        hideKebabMenu: true,
                        allowCheckStrictly: false
                    }
                    const treePropsForTables: ITreeForHierarchicalDataContainer = {
                        uniqueName: `${editDeviceEntityMappingProps.uniqueName}-tables-tree`,
                        apiData: undefined,
                        featureId: editDeviceEntityMappingProps.featureId,
                        featureTreeProps: featureTreePropsForTables,
                        allowGenerateTreeData: false
                    }

                    const handleGetPgTablesApiResponse = async (getPgTablesApiResponse: unknown, status?: string) => {
                        if (status === "200" && typeof getPgTablesApiResponse === "object" && getPgTablesApiResponse != null && 'jsonString' in getPgTablesApiResponse) {
                            const parsedData = FnParseJsonSafely(getPgTablesApiResponse.jsonString as string);

                            function removeUnderscoreEntries(data: Record<string, any>) {
                                return {
                                    Tables: (data.Tables as Record<string, any>[]).map((table: Record<string, any>) => ({
                                        Name: table.Name,
                                        Description: table.Description,
                                        NodeType: table.NodeType,
                                        Dataset: (table.Dataset as Record<string, any>[]).filter(
                                            (item: Record<string, any>) => !item.Name.startsWith('_')
                                        )
                                    }))
                                };
                            }

                            const filterPgtables = removeUnderscoreEntries(parsedData);
                            const convertResult: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(filterPgtables, treePropsForTables);
                            if (convertResult) {

                                const checkedResult = FnGetCheckedNodesForNetZoomEntites(convertResult.treeData);
                                setTreeContainerPropsForTables(treePropsForTables);
                                setDefaultExpandedKeysForTables(convertResult.expandedKeys);
                                if (convertResult.selectedKey)
                                    setDefaultSelectedKeysForTables([convertResult.selectedKey]);
                                if (checkedResult.checkedKeys) {
                                    setDefaultCheckedKeysForTables(checkedResult.checkedKeys);
                                    setDefaultCheckedNodesForTables(checkedResult.checkedNodes);
                                    setTreeDataForTables(checkedResult.updatedTree);
                                }
                                else {
                                    setTreeDataForTables(convertResult.treeData);
                                }
                                convertResult.selectedNode && setDefaultSelectedNodeInfoForTables({
                                    event: 'select',
                                    selected: true,
                                    node: convertResult.selectedNode,
                                    selectedNodes: [convertResult.selectedNode]
                                });
                            }
                            else {
                                setTreeDataForTables([])
                            }
                        }
                    }
                    axiosInterceptor({
                        url: NZENTITY.GetPgTables,
                        data: {
                            entityName: defaultSelectedNodeInfo.node.Name ? "__" + defaultSelectedNodeInfo.node.Name : ""
                        },
                        setFetchData: handleGetPgTablesApiResponse
                    }, statusBarContext)

                }
                handleDeviceNodeSelectionChange();
                // CALL api to get netZoomTables to get data

            } else {
                setLoading(true);
                axiosInterceptor({
                    url: EM.GetEntityDiagramData,
                    data: {
                        entityName: (defaultSelectedNodeInfo && defaultSelectedNodeInfo.node.NodeEntityname) ? "__" + defaultSelectedNodeInfo.node.NodeEntityname : ""
                    },
                    setFetchData: (response: unknown, status?: string) => {
                        if (status === "200" && response && typeof response === "object" && 'entityJson' in response) {
                            setLoading(false);
                            setJsonData(FnParseJsonSafely(response.entityJson as string))
                        } else {
                            setLoading(false);
                            setJsonData(undefined);
                        }
                    }
                }, statusBarContext)
            }

        }
    }, [defaultSelectedNodeInfo?.node, displayMode, editDeviceEntityMappingProps.uniqueName, editDeviceEntityMappingProps.featureId])

    useEffect(() => {
        if (defaultSelectedNodeInfoForTables?.node && displayMode === "Property" && FnProcessStringToCompare(defaultSelectedNodeInfoForTables?.node.treetype, "Dataset")) {
            const handleSelectedNodeChangeForTable = async () => {
                const handleGetPgPropertiesApiResponse = (getPgPropertiesApiResponse: unknown, status?: string) => {
                    if (status === "200" && getPgPropertiesApiResponse && typeof getPgPropertiesApiResponse === "object" && 'jsonString' in getPgPropertiesApiResponse) {
                        const parsedData = FnHandleAPIResponse(getPgPropertiesApiResponse.jsonString, "Dataset");
                        if (parsedData && parsedData.length > 0) {
                            setApiDataForGrid(parsedData);
                            const columnDefs = FnGetColumnDefinitionsFromRow(parsedData);
                            if (columnDefs.length > 0) {
                                setColumnDefsForGrid(columnDefs);
                            }
                        }
                        else {
                            setColumnDefsForGrid([]);
                            setApiDataForGrid([]);
                        }
                    } else {
                        setColumnDefsForGrid([]);
                        setApiDataForGrid([]);
                    }
                }
                axiosInterceptor({
                    url: NZENTITY.GetPgProperties,
                    data: {
                        tableName: defaultSelectedNodeInfoForTables.node.Name ?? ""
                    },
                    setFetchData: handleGetPgPropertiesApiResponse
                }, statusBarContext)

            }
            handleSelectedNodeChangeForTable();
        }
        else {
            setColumnDefsForGrid([]);
            setApiDataForGrid([]);
        }
    }, [defaultSelectedNodeInfoForTables?.node, displayMode])

    useEffect(() => {
        const layoutContainer = document.getElementById("nz-create-device-entities-details-pane");
        if (!layoutContainer) return;

        let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

        const resizeObserver = new ResizeObserver(() => {
            // Clear previous pending updates
            if (resizeTimeout) clearTimeout(resizeTimeout);

            // Wait 200ms after the last resize event
            resizeTimeout = setTimeout(() => {
                setContainerDimensions({
                    width: layoutContainer.clientWidth,
                    height: layoutContainer.offsetHeight
                });
            }, 200); // adjust delay as needed (150–300ms is typical)
        });

        resizeObserver.observe(layoutContainer);

        return () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
        };
    }, []);
    const handleSelectedTabs = (tab: string[]) => {
        if (tab.length) {
            setDisplayMode(tab[0] as "Property" | "Models" | "Preview")

        }
    }
    const handleNodeSelectForTables = (_selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        setDefaultSelectedKeysForTables([info.node.key]);
        setDefaultSelectedNodeInfoForTables(info);
        setDefaultExpandedKeysForTables(expandedKeys);
    }
    const handleNodeCheckForTables = (checked: Key[] | { checked: Key[]; halfChecked: Key[] }, info: CheckInfo<ITreeNode>) => {

        setDefaultCheckedKeysForTables(checked as Key[]);
        let defaultCheckedNodes = defaultCheckedNodesForTables;
        if (info.checked) {
            defaultCheckedNodes.push(info.node)
            setDefaultCheckedNodesForTables(defaultCheckedNodes);
        } else {
            defaultCheckedNodes = defaultCheckedNodesForTables.filter((element) => { return element.key !== info.node.key });
            setDefaultCheckedNodesForTables(defaultCheckedNodes);
        }

        const handleAssignPgTablesToEntityApiResponse = (assignPgTablesToEntityApiResponse: unknown, status?: string) => {
            if (status === "200" && assignPgTablesToEntityApiResponse !== null) {

            }
        }

        let pgTables: string[] = [];
        defaultCheckedNodes.forEach((element: ITreeNode) => {
            pgTables.push(element.Name ?? "");
        });

        axiosInterceptor({
            url: NZENTITY.AssignPgTablesToEntity,
            data: {
                entityType: "Device",
                entityName: defaultSelectedNodeInfo?.node.Name ? "__" + defaultSelectedNodeInfo?.node.Name : "",
                pgTablesJson: JSON.stringify(pgTables)
            },
            setFetchData: handleAssignPgTablesToEntityApiResponse
        }, statusBarContext);
    }

    // end Tabes Tree Events
    const handleSaveForm = async (
        profileData: string,
        _id?: string
    ): Promise<void> => {
        try {
            const parsedData:
                Record<string, any>[] =
                FnParseJsonSafely(profileData || "[]");

            const entityData =
                parsedData?.[0];

            if (entityData?.EntityName) {

                let mfgEqTypeData =
                    defaultSelectedNodeInfoModel
                        ?.node?.Name ?? "";

                const eqid =
                    defaultSelectedNodeInfoModel?.node
                        ?.NodeType === "Product"
                        ? defaultSelectedNodeInfoModel
                            ?.node?.EQID
                        : "";

                if (
                    defaultSelectedNodeInfoModel?.node
                        ?.NodeType === "Product"
                ) {

                    const deviceType =
                        FnFindNearestNodeByType(
                            treeDataForModel,
                            defaultSelectedNodeInfoModel.node,
                            "DeviceType"
                        );

                    if (deviceType) {
                        mfgEqTypeData =
                            deviceType.Name ?? "";
                    }
                }

                const status =
                    await makeApiCallForAddEntity(
                        entityData.EntityName,
                        entityData.EntityShortName ?? "",
                        mfgEqTypeData,
                        defaultSelectedNodeInfoModel
                            ?.node?.Name ?? "",
                        defaultSelectedNodeInfoModel
                            ?.node?.NodeEntityname ?? "",
                        String(eqid || "")
                    );

                // UI refresh logic
                if (status === "200") {
                    setTreeDataDeviceEntities([]);
                    setDefaultExpandedKeys([]);
                    setDefaultSelectedKeys([]);
                    callApiToRefreshEntityTree();
                }
            }

        } catch (error) {

            console.error(
                "handleSaveForm Error:",
                error
            );

        } finally {

            setIsShowDialog(false);
        }
    };

    function handleCtrlLinkClick(nodeData: { EntId?: string | undefined; EntityName?: string | undefined }): void {
        if (import.meta.env.DEV)
            console.log('nodeData :', nodeData);

    }

    return (
        <div className='nz-device-entites-container'>
            <div className='nz-sub-header'>
                <OverlayTab
                    uniqueName={`${editDeviceEntityMappingProps.uniqueName}-replacement-overlay`}
                    tabs={tabsObj && tabsObj.map((t, index) => ({
                        uniqueName: `${editDeviceEntityMappingProps.uniqueName}-overlay-tab-${index}`,
                        label: {
                            uniqueName: `${editDeviceEntityMappingProps.uniqueName}-overlay-tab-${index}-label`,
                            label: t.label,
                            tooltip: t.tooltip
                        },
                        w: "auto",
                        h: "calc(var(--node_height) - var(--spacing-1))",
                        actionCode: t.label,
                        handleMouse: function (_event: Record<string, any>, _actionCode?: string): void {
                        }
                    }))}
                    allowUnSelect={true}
                    selectedTabName={displayMode}
                    tabAlignment={"horizontal"}
                    headerText={`${editDeviceEntityMappingProps.selectedFeatureItem && editDeviceEntityMappingProps.selectedFeatureItem.Label}` || ""}
                    useContainer={false}
                    handleSelectedTab={handleSelectedTabs}

                />
                {displayMode === "Models" && <ActionImage uniqueName={'user-profile-aireset'}
                    image={resetImageData} w={'var(--node_height)'} h={'var(--node_height)'} handleMouse={() => {
                    }} actionCode={''} />}
            </div>
            {editDeviceEntityMappingProps.helptipString && <Helptip uniqueName={`${editDeviceEntityMappingProps.uniqueName}-helptip`}
                mdString={editDeviceEntityMappingProps.helptipString} />}
            <div className='nz-device-entites'>
                <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">

                        <div className='nz-create-entites-pane'>
                            {treeDataDeviceEntities && treeDataDeviceEntities.length > 0 ? (
                                <>
                                    <SearchControl
                                        uniqueName={`${editDeviceEntityMappingProps}-search`}
                                        isShowFilterControl={false}
                                        lensDirty={deviceSearchText.length > 0}
                                        filterDirty={false}
                                        searchInputValue={deviceSearchText}
                                        searchValueChange={(value: string) => {

                                            setDeviceSearchText(value)
                                            setDeviceSearchHistory([])
                                        }}
                                        handleFilterMouse={() => {
                                        }}
                                        handleLensMouse={() => {
                                            const isNext = deviceSearchHistory.length > 0;
                                            handleSearchEditDeviceEntityMapping(isNext)
                                        }}
                                        hideRightMouseMenu={true} />
                                    {treeContainerProps && <TreeForHierarchicalDataContainer
                                        {...treeContainerProps}
                                        key={'nz-device-entities-tree'}
                                        className='nz-device-entities-tree'
                                        apiData={treeDataDeviceEntities}
                                        defaultExpandedKeys={defaultExpandedKeys}
                                        defaultSelectedKeys={defaultSelectedKeys}
                                        defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                                        handleNodeSelect={handleNodeSelectDeviceTree}
                                    />}
                                </>
                            ) : (
                                <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>
                            )}
                        </div>
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-pane-2 " id="nz-create-device-entities-details-pane">

                        {displayMode === "Models" || displayMode === "Property" ? <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                            <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center ">
                                {displayMode === "Models" &&
                                    <div className='nz-model-by-type-pane'>
                                        <div className='nz-sub-header'>
                                            <Label uniqueName={`${editDeviceEntityMappingProps.uniqueName}-model-by-type-header`} label={"Model by Type"}
                                            />
                                        </div>
                                        {treeContainerPropsModelByType && treeDataForModel && defaultSelectedNodeInfo?.node && <TreeForHierarchicalDataContainer
                                            {...treeContainerPropsModelByType}
                                            key={'nz-model-by-type-tree'}
                                            className='nz-model-by-type-tree'
                                            apiData={treeDataForModel}
                                            defaultExpandedKeys={defaultExpandedKeysForModel}
                                            allowAPICallOnExpand={true}
                                            defaultSelectedKeys={defaultSelectedKeysForModel}
                                            defaultSelectedNodeInfo={defaultSelectedNodeInfoModel || undefined}
                                            defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeysForModel}
                                            handleNodeSelect={handleNodeSelectModel}
                                            handleKebabMenuSelect={handleKebabMenuSelectForModel}
                                            handleNodeCheck={handleNodeCheckForModel}
                                            handleNodeExpand={handleNodeExpandForModel}
                                        />}

                                    </div>
                                }
                                {
                                    displayMode === "Property" &&
                                    <div className='nz-tables-pane'>
                                        <div className='nz-sub-header'>
                                            <Label uniqueName={`${editDeviceEntityMappingProps.uniqueName}-tables-header`} label={`Tables of ${defaultSelectedNodeInfo?.node.Name}`}
                                            />
                                        </div>
                                        {treeContainerPropsForTables && treeDataForTables && defaultSelectedNodeInfo?.node && <TreeForHierarchicalDataContainer
                                            {...treeContainerPropsForTables}
                                            key={'nz-tables-tree'}
                                            className='nz-tables-tree'
                                            apiData={treeDataForTables}
                                            defaultExpandedKeys={defaultExpandedKeysForTables}
                                            defaultSelectedKeys={defaultSelectedKeysForTables}
                                            defaultSelectedNodeInfo={defaultSelectedNodeInfoForTables || undefined}
                                            defaultCheckedKeys={defaultCheckedKeysForTables}
                                            handleNodeSelect={handleNodeSelectForTables}
                                            handleNodeCheck={handleNodeCheckForTables}
                                        />}

                                    </div>
                                }
                            </SplitterPanel>
                            <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-pane-3">
                                {displayMode === "Models" &&
                                    <div className='nz-product-details-pane'>
                                        <div className='nz-sub-header'>
                                            <Label uniqueName={`${editDeviceEntityMappingProps.uniqueName}-product-detail-header`} label={"Product Detail"}
                                            />
                                        </div>
                                        {propertyTabData.length === 0 && <div className='nz-wh-100 nz-d-flex-hv-left'> <Label uniqueName={`${editDeviceEntityMappingProps}-product-detail-msg`} label={'Select Product Number'} /></div>}
                                        {propertyTabData && selectedTabViewName
                                            && defaultSelectedNodeInfoModel

                                            && (defaultSelectedNodeInfoModel?.node.treetype === "Product" || defaultSelectedNodeInfoModel?.node.treetype === "View")
                                            && <PropertyTab
                                                uniqueName={`${editDeviceEntityMappingProps.uniqueName}-Property-tab`}
                                                propertyData={propertyTabData}
                                                featureId={editDeviceEntityMappingProps.featureId}
                                                views={views}
                                                selectedRadio={DeviceModelFEnums.NetZoomDeviceLibrary}
                                                selectedTabName={selectedTabViewName === "F" || selectedTabViewName === "Front" ? 'Front' : "Rear"}
                                            />

                                        }
                                    </div>
                                }
                                {displayMode === "Property" && <div className='nz-table-properties-pane'>
                                    <div className='nz-sub-header'>
                                        <Label uniqueName={`${editDeviceEntityMappingProps.uniqueName}-table-properties-header`} label={"Properties"}
                                        />
                                    </div>
                                    {defaultSelectedNodeInfoForTables?.node && columnDefsForGrid && <BasicGrid
                                        featureId={editDeviceEntityMappingProps.featureId}
                                        uniqueName={`${editDeviceEntityMappingProps.uniqueName}-grid-container`}
                                        instanceName={'populate_nz_entity_tables'}
                                        showGrid={true}
                                        hideRowKebabMenu={true}
                                        allowColumnResize={true}
                                        allowColumnFilter={true}
                                        rowData={apiDataForGrid}
                                        columnDefs={columnDefsForGrid}
                                        allowPagination={true}
                                        dynamicPagination={true}
                                        paginationAutoPageSize={true}
                                        isExportOnCopy={true}
                                        exportFileName={defaultSelectedNodeInfoForTables?.node.Name || "TableProperties"}
                                        featureData={undefined}
                                        containerName={''}
                                    />}
                                </div>}
                            </SplitterPanel>
                        </Splitter> : <div className='nz-w-100 nz-h-100'>
                            {loading ? (
                                <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>
                            ) : (
                                jsonData ? (
                                    <D3Tree
                                        key={`${containerDimensions.width}-${containerDimensions.height}`}
                                        containerDimensions={containerDimensions}
                                        treeData={jsonData}
                                        orientation="vertical"
                                        useIcons={true}
                                        handleCtrlLinkClick={handleCtrlLinkClick}
                                    />

                                ) : <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>
                            )}
                        </div>}

                    </SplitterPanel>
                </Splitter>
                {isShowDialog && rowData && <DialogGridContainer
                    uniqueName={editDeviceEntityMappingProps.uniqueName}
                    showDialog={isShowDialog}
                    headerText={'Create New Entity'}
                    className='nz-entity-dialog-grid'
                    containerClass="nz-model-by-type-pane"
                    rowData={rowData}
                    handleSaveForm={handleSaveForm}
                    handleDialogAction={handleDialogAction}
                />}

            </div>
            <YesNoFormContainer
                isOpen={showConfirm}
                showOkButton={showOkButtonOnly}
                uniqueName={`${editDeviceEntityMappingProps.uniqueName}-confirm-yes-no`}
                message={confirmMessage || ""}
                handleYesButtonClick={handleConfirmYes}
                handleNoButtonClick={handleConfirmNo}
                handleOkButtonClick={() => {
                    setShowConfirm(false);
                    setConfirmMessage(null);
                    setShowOkButtonOnly(false);
                }}
            />
        </div>
    )
}
export { EditDeviceEntityMapping }
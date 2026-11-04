
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { IDeviceModel } from '../../allinterface/sidebar/IDeviceModel';
import { Key } from 'rc-tree/lib/interface';
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks';
import { useMainAppContext } from '../../context/hooks/MainAppHooks';
import '../../allcss/sidebar/DeviceModel.css'
import { FEnums } from '../../../constants/Feature';
import { deviceModelTabs } from '../../../appcontainer/alldefaultprops/Enums';
import { IFeatureTree, ITreeForHierarchicalDataContainer } from '../../allinterface/tree/ITreeForHierarchicalDataContainer';
import { IExpandedNodeInfo, ISelectedNodeInfo } from '../../allinterface/tree/ITreeControl';
import { ITreeNode } from '../../allinterface/tree/ITreeControl';
import { ResultTab } from './ResultTab';
import { RelatedTab } from './RelatedTab';
import { SearchTab } from './SearchTab';
import { ActionLabelTabs } from '../../basic/actionlabeltabs/ActionLabelTabs';
import { OverlayTab } from '../../basic/overlaytab/OverlayTab';
import { PropertyTab } from './PropertyTab';
import { formControls } from '../../../../sampledata/formControlsJsonDeviceModel'
import { envVarEnums } from '../../../appcontainer/alldefaultprops/DefaultPropsAppContainer';
import { DEVICEMODEL } from '../../interceptors/EndPoints';
import { FnConvertFlatDataToHierarchyData } from '../../allcommon/tree/FnConvertFlatDataToHierarchyData';
import { FnGetAutoExpandNodeKeys } from '../../allcommon/tree/FnGetAutoExpandNodeKeys';
import { FnUpdateNodeWithTitleAndIcon } from '../../allcommon/tree/FnUpdateNodeWithTitleAndIcon';
import { IView } from '../../allinterface/deviceview/IView';
import { IActionLabelTabs } from '../../allinterface/basic/IActionLabelTabs';
import {
	IDeviceEqTypeRecord,
	IDeviceFormFieldValue,
	IDeviceModelProfileString,
	IDeviceSearchOption,
	IDeviceViewRecord,
	IDeviceWildSearchItem,
	IFilterMfgEntry,
	IFlatTreeFormattedRow,
	IFileObject,
	IJsonDataMap,
	ILibRelatedData,
	IMatchScoreTreeGroup,
	IMfgAcronymItem,
	IPropertyTabData,
	IRelatedManufacturerRecord,
	IShapeRecord,
	JsonRecord,
} from '../../allinterface/sidebar/IDeviceModel';
import { FnCableModel, FnDeviceModel } from '../../menu/nodemenu/MenuFunction';
import { DeviceModelFEnums, Lib } from '../../alldefaultprops/sidebar/DeviceModelEnums';
import { FnGetLibJson } from '../../allcommon/sidebar/FnGetLibJson';
import { FnFindRelatedManufacturer, FnGetSearchResults, FnGetSearchResultsByEqType, transformDeviceData } from '../../allcommon/sidebar/FnExtractKeyObjects';
import { FnAddSubNode } from '../../allcommon/tree/FnAddSubNode';
import { FnGetKeyFromEntId } from '../../allcommon/settingsform/FnGetKeyFromEntId';
import { FnProcessMfgAcronym } from '../../allcommon/sidebar/FnProcessMfgAcronym';
import { FnGetEnvVariableByKey } from '../../../appcontainer/allcommon/FnGetEnvVariableByKey';
import { wildSearch } from '@n20a/libmiscfn';
import { YesNoFormContainer } from '../../basic/yesnoformcontainer/YesNoFormContainer';
import '@n20a/libform/style.css'
import { NodeDragEventParams } from 'rc-tree/lib/contextTypes';
import { useDragContext } from '../../context/hooks/DragHooks';
import { IInventoryDeviceDetails } from '../../context/allinterface/IDrag';
import { Label } from '../../basic/label/Label';
import { IStatusBar } from '../../context/allinterface/IStatusBar';
import { axiosInterceptor, axiosInterceptorForHead } from '../../interceptors/Interceptor';
import { FnCreateForensiclog } from '../../../appcontainer/allcommon/FnCreateForensiclog';
import { IFnCreateForensiclog } from '../../../appcontainer/allinterface/IFnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { useSessionContext } from '../../context/hooks/SessionHooks';
import { FnFindNodeAndParents } from '../../allcommon/tablegrid/FnFindNodeAndParents';

/* True when DeviceModel is searching the local NetZoom device or cable library. */
const isLocalLibRadio = (radio: string): boolean =>
	radio === DeviceModelFEnums.NetZoomDeviceLibrary ||
	radio === DeviceModelFEnums.NetZoomCableLibrary;

/* True when cable models should be shown (cable library radio). */
const isCableLibRadio = (radio: string): boolean =>
	radio === DeviceModelFEnums.NetZoomCableLibrary;

/* Filter by EQType = cable OR MfgEQType = (Cable or Power Cable) */
const isCableRecord = (item: unknown): boolean => {
	if (!item || typeof item !== 'object') return false;
	const rec = item as Record<string, unknown>;
	const eqType = String(rec.ty ?? rec.EQType ?? rec.eqtype ?? '').trim().toLowerCase();
	const mfgEqType = String(rec.mty ?? rec.MfgEQType ?? rec.mfgeqtype ?? '').trim().toLowerCase();
	return eqType === 'cable' || mfgEqType === 'cable' || mfgEqType === 'power cable';
};

/* Cable mode: Cable Library radio, or explorer cable node. */
const isCableDeviceModelMode = (
	radio: string,
	selectedNode?: ITreeNode | null,
	showOnlyLibraryRadio?: boolean
): boolean =>
	isCableLibRadio(radio) ||
	(!!selectedNode && FnCableModel(selectedNode));


const NetZoomDeviceLibAttribute = [
	{ "isAttribute": "All" },
	{ "isAttribute": "Racks/Cabinets" },
	{ "isAttribute": "Rackmountable" },
	{ "isAttribute": "Cards/Modules" },
	{ "isAttribute": "Chassis" }];

const leftSideTabs: IActionLabelTabs = {
	labels: [
		{
			label: 'Result',
			tooltip: 'Result tab'
		}
	],
	handleMouse: () => {
	},
	allowStatusIcon: false
};
const relatedTabsInfo = {
	label: 'Related',
	tooltip: 'Related tab'
}

const onlySearchTab: IActionLabelTabs = {
	labels: [
		{
			label: 'Search',
			tooltip: 'Search tab'
		}

	],
	handleMouse: () => {
	},
	allowStatusIcon: false
};
const RightSideTabs: IActionLabelTabs = {
	labels: [
		{
			label: 'Search',
			tooltip: 'Search tab'
		},
		{
			label: 'Property',
			tooltip: 'Property tab'
		}

	],
	handleMouse: () => {
	},
	allowStatusIcon: false
};
/* Returns true when value is a plain object (not null or array). */
const isRecord = (value: unknown): value is JsonRecord =>
	value !== null && typeof value === 'object' && !Array.isArray(value);

/* Parses a JSON string; returns null on failure. */
const parseJsonString = (value: string): unknown => {
	try {
		return JSON.parse(value);
	} catch (error) {
		console.error('DeviceModel: failed to parse JSON string', error);
		return null;
	}
};

/* Parses deviceJson from a GetDeviceDetails API response into an array. */
const parseDeviceJsonArray = (response: unknown): JsonRecord[] | null => {
	if (!isRecord(response) || typeof response.deviceJson !== 'string') {
		return null;
	}
	const parsed = parseJsonString(response.deviceJson);
	return Array.isArray(parsed) ? parsed as JsonRecord[] : null;
};

/* Parses mfgJson from a GetMfgNew API response into manufacturer items. */
const parseMfgJsonArray = (response: unknown): IMfgAcronymItem[] | null => {
	if (!isRecord(response) || typeof response.mfgJson !== 'string') {
		return null;
	}
	const parsed = parseJsonString(response.mfgJson);
	return Array.isArray(parsed) ? parsed as IMfgAcronymItem[] : null;
};


/* Wraps axiosInterceptor in a Promise for async/await usage. */
const fetchInterceptorData = (
	url: string,
	data: JsonRecord,
	statusBarContext: IStatusBar,
	allowShowLoader = true
): Promise<unknown> =>
	new Promise((resolve) => {
		axiosInterceptor(
			{
				url,
				data,
				allowShowLoader,
				setFetchData: (response: unknown) => resolve(response),
			},
			statusBarContext
		);
	});

/* Coerces an unknown value to a device search option object. */
const toDeviceSearchOption = (value: unknown): IDeviceSearchOption | null =>
	isRecord(value) ? value as IDeviceSearchOption : null;

/* Reads manufacturer name from profile, treating "All" as empty. */
const getProfileManufacturerValue = (
	profile: IDeviceModelProfileString
): string => {
	const manufacturer = profile.Manufacturer;
	if (typeof manufacturer === 'string') {
		return manufacturer === 'All' ? '' : manufacturer;
	}
	const option = toDeviceSearchOption(manufacturer);
	if (!option) {
		return '';
	}
	const optionValue = option.value ?? option.mfg;
	return optionValue === 'All' ? '' : (optionValue ?? '');
};

/* Returns true if there is an active search keyword or non-empty combo filter. */
const hasSearchCriteria = (
	profile?: IDeviceModelProfileString,
	keyword?: string
): boolean => {
	if (keyword && keyword.trim().length > 0) return true;
	if (!profile) return false;
	const mfg = getProfileManufacturerValue(profile);
	const eqtype = profile["Equipment Type"];
	const prod = profile["Product Number"];
	const attr = profile["Filter By Attribute"];
	if (mfg && mfg !== "All") return true;
	if (eqtype && eqtype !== "All") return true;
	if (prod && prod !== "All") return true;
	if (attr && attr !== "All") return true;
	return false;
};

/* Validates and parses the lib related-manufacturers JSON response. */
const parseLibRelatedData = (value: unknown): ILibRelatedData | null => {
	if (!isRecord(value) || !Array.isArray(value.Related)) {
		return null;
	}
	return { Related: value.Related as IRelatedManufacturerRecord[] };
};

/* Returns Related records only from a freshly fetched lib response (not cached array). */
const getRelatedRecordsFromCache = (
	data: ILibRelatedData | IRelatedManufacturerRecord[] | null
): IRelatedManufacturerRecord[] | undefined => {
	if (!data || Array.isArray(data)) {
		return undefined;
	}
	return data.Related;
};

/* Extracts manufacturer name from a form field value or selected option. */
const getMfgNameFromFormValue = (
	formValue: IDeviceFormFieldValue,
	selectedOption?: IDeviceSearchOption
): string =>
	(typeof formValue !== 'string' ? formValue.mfg : undefined) ?? selectedOption?.mfg ?? '';

const DeviceModel = (props: IDeviceModel) => {

	const BASE_URL_DEVICE_MODEL = FnGetEnvVariableByKey(envVarEnums.BASE_URL_LIB);
	const [isDeviceURLAvailable, setIsDeviceURLAvailable] = useState<boolean>(false);
	const [isDeviceUrlValidated, setIsDeviceUrlValidated] = useState<boolean>(false);
	const [leftSideSelectedTab, setLeftSideSelectedTab] = useState<string>('')
	const [rightSideSelectedTab, setRightSideSelectedTab] = useState<string>('Search')
	const [leftSideTabsObj, setLeftSideTabsObj] = useState<IActionLabelTabs>(leftSideTabs)
	const [wildsearchData, setWildsearchData] = useState<IDeviceWildSearchItem[] | null>(null)
	const [reletedMfg, setReletedMfg] = useState<IRelatedManufacturerRecord[] | null>(null)

	const [disableFromWhileSearching, SetDisableFromWhileSearching] = useState<boolean>(false)
	// search tabs state start
	const [selectedRadio, setSelectedRadio] = useState<string>(() => {
		if (props.externalSearch?.Source) {
			return props.externalSearch.Source;
		}
		if (props.selectedNode && FnCableModel(props.selectedNode)) {
			return DeviceModelFEnums.NetZoomCableLibrary;
		}
		return DeviceModelFEnums.NetZoomDeviceLibrary;
	});
	const [searchText, setSearchText] = useState<string>('')
	const searchTextRef = useRef<string>('')
	searchTextRef.current = searchText
	const optionDataRef = useRef<IDeviceSearchOption[]>([])
	const [profileString, setProfileString] = useState<IDeviceModelProfileString>({})
	const profileStringRef = useRef<IDeviceModelProfileString>({})
	profileStringRef.current = profileString
	const [views, setView] = useState<IView[]>([])
	const [selectedTabViewName, setSelectedTabViewName] = useState<string>("")
	const [EQIDRelation, setEQIDRelation] = useState<JsonRecord[] | null>(null)
	// search tabs state end 
	// property tab state start
	const [propertyTabData, setPropertyTabData] = useState<IPropertyTabData>([])
	// property tab state end
	//Result Tab State start 
	const [treeDataResult, setTreeDataResult] = useState<ITreeNode[]>([]);
	const [defaultExpandedKeysResult, setDefaultExpandedKeysResult] = useState<Key[]>([]);
	const [defaultSelectedKeysResult, setDefaultSelectedKeysResult] = useState<Key[]>([]);
	const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
	const [filterMfg, setFilterMfg] = useState<IFilterMfgEntry[] | null>(null)
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [isLensDirty, setIsLensDirty] = useState<boolean>(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");
	const [showOkButtonOnly, setShowOkButtonOnly] = useState(false);
	const [showMessage, setShowMessage] = useState(false);

	const statusBarContext = useStatusBarContext()
	const sessionContext = useSessionContext();
	const mainAppContext = useMainAppContext();

	const { setDragItem, reloadTreeFor, setInventoryDeviceDetails } = useDragContext()
	const inventoryDeviceDetailsRef = useRef<IInventoryDeviceDetails | undefined>(undefined);
	const allowDrag = props.allowDrag ? true : mainAppContext.siteProperties?.Managed ?
		(props.featureId === FEnums.InventoryManagement || props.featureId === FEnums.InventoryConfiguration) : true;

	const eqTypeApiDataRef = useRef<IDeviceEqTypeRecord[] | null>(null)
	let featureTreeProps: IFeatureTree = {
		instanceName: "nz-device-model-tree",
		hideKebabMenu: true,
		allowCheckbox: false,
		allowIcon: true,
		isAllowDrag: false,
		hideCopyIcon: false,
		reuseFromCache: false,
		isAllowDrop: false,
		allowInternalDrag: isLocalLibRadio(selectedRadio) ? allowDrag : true,
		openAllNodes: false,
		allowCheckStrictly: false,
	};

	useEffect(() => {
		const validateDeviceUrl = async () => {
			setIsDeviceUrlValidated(false);
			if (
				!mainAppContext.isInternetAvailable ||
				!BASE_URL_DEVICE_MODEL?.trim()
			) {
				setIsDeviceURLAvailable(false);
				setIsDeviceUrlValidated(true);
				return;
			}
			try {
				await axiosInterceptorForHead({
					url: BASE_URL_DEVICE_MODEL,
					onHeadersReceived: (
						_headers: Record<string, string> | null,
						isReachable: boolean,
						error: string | unknown
					) => {
						setIsDeviceURLAvailable(isReachable);
						setIsDeviceUrlValidated(true);
						if (!isReachable) {
							console.error(
								"Remote Device Model Library is not available.",
								error
							);
							const payloadLog: IFnCreateForensiclog = {
								GroupName: LogGroupName.ForensicLogTemplate,
								SubGroupName: LogSubGroupName.DeviceModel,
								LogName: LogName.RemoteURL,
								logType: 'UserAction',
								_Forensiclog: LogSubGroupName.DeviceModel,
								sessionContext: sessionContext,
								statusBarContext: statusBarContext,
								RefTableItems: mainAppContext.refTableRecords
							}
							FnCreateForensiclog(payloadLog)
						}
					}
				});

			} catch (error) {
				console.error(
					"Failed to validate Device Model URL.",
					error
				);
				setIsDeviceURLAvailable(false);
				setIsDeviceUrlValidated(true);
			}
		};

		void validateDeviceUrl();

	}, [
		BASE_URL_DEVICE_MODEL,
		mainAppContext.isInternetAvailable
	]);

	/* Cable Library when explorer cable bin (hides radios in SearchTab). */
	useEffect(() => {
		if (props.externalSearch?.Source) return;
		if (!props.selectedNode) return;
		if (FnCableModel(props.selectedNode)) {
			setSelectedRadio(DeviceModelFEnums.NetZoomCableLibrary);
		} else if (FnDeviceModel(props.selectedNode)) {
			setSelectedRadio(DeviceModelFEnums.NetZoomDeviceLibrary);
		}
	}, [
		props.externalSearch?.Source,
		props.selectedNode?.key,
		props.selectedNode?.Name,
		props.selectedNode?.NodeType,
		props.selectedNode?.Type,
	]);

	const libraryDocumentSource = useMemo(() => {
		if (!isLocalLibRadio(selectedRadio)) {
			return undefined;
		}

		if (
			!mainAppContext.isInternetAvailable ||
			!BASE_URL_DEVICE_MODEL?.trim() ||
			!isDeviceURLAvailable
		) {
			if (!isDeviceUrlValidated && mainAppContext.isInternetAvailable && BASE_URL_DEVICE_MODEL?.trim()) {
				return {
					label: 'Loading...',
					tooltip: 'Validating remote device library availability.',
				};
			}

			return {
				label: 'Local',
				tooltip: 'Library documents are loaded from the local privatelib folder.',
			};
		}

		return undefined;
	}, [
		selectedRadio,
		isDeviceURLAvailable,
		isDeviceUrlValidated,
		mainAppContext.isInternetAvailable,
		BASE_URL_DEVICE_MODEL,
	]);

	/* Returns true when internal tree drag is allowed for view/product nodes. */
	const canAllowTreeDrag = (sourceNode: ITreeNode) =>
		!!featureTreeProps.allowInternalDrag &&
		["view", "product"].includes(sourceNode.treetype?.toLowerCase());

	const treeProps: ITreeForHierarchicalDataContainer = {
		uniqueName: "ResultTree", // Unique identifier
		featureId: props.featureId, // Feature ID
		featureTreeProps: featureTreeProps, // Tree control properties
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
		selectedNodeExplorer: undefined,
		apiData: undefined
	};
	// Result tabs state end

	// related tabs tree state start
	const [treeDataRelated, setTreeDataRelated] = useState<ITreeNode[]>([]);
	const [defaultExpandedKeysRelated, setDefaultExpandedKeysRelated] = useState<Key[]>([]);
	const [defaultSelectedKeysRelated, setDefaultSelectedKeysRelated] = useState<Key[]>([]);

	// related tabs code start
	/* Builds the Related tab tree from EQID relations. */
	const makeRelatedTree = async () => {
		try {
			if (!EQIDRelation || !Array.isArray(EQIDRelation) || EQIDRelation.length === 0) {
				setTreeDataRelated([]);
				return;
			}

			const eqidList: string[] = EQIDRelation
				.map((item: any) => typeof item === 'string' ? item : item?.EQIDRelation)
				.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

			if (eqidList.length === 0) {
				setTreeDataRelated([]);
				return;
			}

			const uniquePrefixes = [...new Set(
				eqidList
					.map(eqid => FnProcessMfgAcronym(eqid)?.trim())
					.filter((prefix): prefix is string => Boolean(prefix))
			)];

			let allSearchData: IDeviceEqTypeRecord[] = [];

			if (isLocalLibRadio(selectedRadio)) {
				if (isDeviceURLAvailable) {
					const searchFiles = uniquePrefixes.map(p => `search/${p}.json`);
					try {
						const resultTree = await FnGetLibJson(
							searchFiles,
							`${BASE_URL_DEVICE_MODEL}/api/files/download/multiple`,
							undefined,
							true
						);
						if (resultTree && typeof resultTree === "object" && "files" in resultTree && resultTree?.files) {
							const jsonObjOfFile = convertFilesToJsonMap(resultTree.files as IFileObject[]);
							allSearchData = getCombinedSearchArray(jsonObjOfFile);
						}
					} catch (error) {
						console.error('DeviceModel: failed to fetch remote lib search files for related tree', error);
					}
				}

				if (allSearchData.length === 0) {
					try {
						const filePromises = uniquePrefixes.map(async (p) => {
							try {
								const fileData = await FnGetLibJson(`search/${p}`) as { Search?: IDeviceEqTypeRecord[] };
								return fileData?.Search ?? [];
							} catch (err) {
								console.error(`DeviceModel: failed to load local search/${p}`, err);
								return [];
							}
						});
						const searchArrays = await Promise.all(filePromises);
						allSearchData = searchArrays.flat();
					} catch (error) {
						console.error('DeviceModel: failed to fetch local lib search files for related tree', error);
					}
				}
			} else {
				for (const mfgAcronym of uniquePrefixes) {
					try {
						const eqRep = await fetchInterceptorData(
							DEVICEMODEL.GetDeviceDetailsForMfg,
							{
								allSites: selectedRadio === DeviceModelFEnums.AllSites,
								isInventory: selectedRadio === DeviceModelFEnums.Inventory,
								mfgAcronym
							},
							statusBarContext
						);
						const searchItems = parseDeviceJsonArray(eqRep) as IDeviceEqTypeRecord[] | null;
						if (searchItems && Array.isArray(searchItems)) {
							allSearchData.push(...searchItems);
						}
					} catch (err) {
						console.error('DeviceModel: failed to fetch device details for mfg in related tree', err);
					}
				}
			}

			if (eqTypeApiDataRef.current && Array.isArray(eqTypeApiDataRef.current)) {
				const existingIds = new Set(allSearchData.map(item => item.id));
				for (const item of eqTypeApiDataRef.current) {
					if (item.id && !existingIds.has(item.id)) {
						allSearchData.push(item);
					}
				}
			}

			const filterData = FnGetSearchResultsByEqType(
				allSearchData,
				EQIDRelation
			);

			if (filterData && filterData.length > 0) {
				const apiData = await formatDataForFlatTree(filterData);
				const hierarchyData = await FnConvertFlatDataToHierarchyData({ "deviceModel": apiData }, null, props.featureId, "AllSites", "DeviceModel");
				if (hierarchyData) {
					const updatedTreeData = FnUpdateNodeWithTitleAndIcon(hierarchyData, treeProps.featureTreeProps, props.featureId);
					if (updatedTreeData.length > 1) {
						const selectednode = updatedTreeData[0];
						const selectedNodeInfo: ISelectedNodeInfo = {
							event: "auto-select",
							selected: true,
							node: selectednode,
							selectedNodes: [selectednode],
						};
						setDefaultSelectedNodeInfo(selectedNodeInfo);
						handleShowPropertyTab(selectedNodeInfo, "related", updatedTreeData);
						setDefaultExpandedKeysRelated([]);
						setDefaultSelectedKeysRelated([selectednode.key]);
					} else {
						const expandedKeysData = await FnGetAutoExpandNodeKeys(updatedTreeData);
						if (expandedKeysData && expandedKeysData.nodeToSelect) {
							const autoSelectedNode = (expandedKeysData.nodeToSelect as ITreeNode);
							const selectedNodeInfo: ISelectedNodeInfo = {
								event: "auto-select",
								selected: true,
								node: expandedKeysData.nodeToSelect,
								selectedNodes: [expandedKeysData.nodeToSelect],
							};
							handleShowPropertyTab(selectedNodeInfo, "related", updatedTreeData);

							setDefaultSelectedKeysRelated([autoSelectedNode.key]);
							setDefaultExpandedKeysRelated(expandedKeysData.keysToExpand);
						}
					}
					setTreeDataRelated(updatedTreeData);
				}
			} else {
				setTreeDataRelated([]);
			}

		} catch (error) {
			console.error('DeviceModel: makeRelatedTree failed', error);
			setTreeDataRelated([]);
		}
	}

	//related tabs code end
	/* Loads property data, views, and related-tab info for the selected tree node. */
	const handleShowPropertyTab = async (info: ISelectedNodeInfo, selectedTabName: string, updatedTreeData?: ITreeNode[]) => {
		try {
			if (info.node.DetailsJson || info.node.NodeType === "Product" || (!info.node.DetailsJson && info.node.treetype === "View")) {
				setRightSideSelectedTab("Property")
				let details: JsonRecord[] | JsonRecord | null = null
				if (info.node.DetailsJson) {
					try {
						details = parseJsonString(info.node.DetailsJson as string) as JsonRecord[] | JsonRecord | null
					} catch (error) {
						setDeleteOpen(true)
						setShowOkButtonOnly(true)
						setConfirmMessage('Remote Device Library is not available!')
						console.error('DeviceModel: failed to parse DetailsJson', error)
						details = null
					}
				}

				if (!info.node.DetailsJson) {
					const eqidsSortName = FnProcessMfgAcronym(info.node.EQID as string)
					if (isLocalLibRadio(selectedRadio)) {
						try {
							details = await FnGetLibJson('details/' + eqidsSortName + '/' + info.node.EQID, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as JsonRecord[] | JsonRecord | null
						} catch (error) {

							console.error('DeviceModel: failed to fetch lib device details', error);
							details = null;
						}

					} else {
						try {
							const deviceDetailsRep = await fetchInterceptorData(
								DEVICEMODEL.GetDeviceDetails,
								{
									allSites: selectedRadio === DeviceModelFEnums.AllSites,
									isInventory: selectedRadio === DeviceModelFEnums.Inventory,
									deviceID: info.node.DeviceEntId
								},
								statusBarContext
							);
							if (isRecord(deviceDetailsRep) && typeof deviceDetailsRep.deviceJson === 'string') {
								details = parseJsonString(deviceDetailsRep.deviceJson) as JsonRecord[] | JsonRecord | null
							} else {
								setPropertyTabData([])
								setView([])
								details = null
								setRightSideSelectedTab("Search")
							}
						} catch (error) {
							console.error('DeviceModel: failed to fetch device details', error)
							details = null
						}
					}
				}
				if (details && isRecord(details) && details.Details) {
					details = details.Details as JsonRecord[] | JsonRecord
				}
				if (Array.isArray(details) && details.length) {

					if (details[0].Properties) {
						let property: unknown = typeof details[0].Properties === "string" ? parseJsonString(details[0].Properties as string) : details[0].Properties
						if (Array.isArray(property) && property.length) {
							const propertyJson = typeof property[0].PropertyJSON === "string" ? parseJsonString(property[0].PropertyJSON as string) : property[0].PropertyJSON
							let data = transformDeviceData(propertyJson)
							setPropertyTabData(data)

						}
					} else {
						setPropertyTabData([])
					}
					if (details && details.length > 0 && details[0]?.EQIDRelation) {
						const relatedTabApiData = typeof details[0].EQIDRelation === "string" ? parseJsonString(details[0].EQIDRelation as string) : details[0].EQIDRelation
						setEQIDRelation(relatedTabApiData as JsonRecord[] | null)
						if (relatedTabApiData && Array.isArray(relatedTabApiData) && relatedTabApiData.length > 0 && selectedTabName !== 'related') {
							const labelData = [...leftSideTabsObj.labels];

							// Check if a tab with the same label already exists
							const alreadyExists = labelData.some(tab => tab.label === relatedTabsInfo.label);

							if (!alreadyExists) {
								labelData.push(relatedTabsInfo);
								setLeftSideTabsObj({ ...leftSideTabsObj, labels: labelData });
							}
						}
					}

					if (details[0].Views) {

						let Views: IDeviceViewRecord[] = typeof details[0].Views === "string" ? parseJsonString(details[0].Views as string) as IDeviceViewRecord[] : details[0].Views as IDeviceViewRecord[]
						let name = info.node.Name
						if (info.node.treetype === "View" && updatedTreeData && info.node.parentEntID) {
							const parentNode = FnGetKeyFromEntId(updatedTreeData, info.node.parentEntID, true)
							if (parentNode.node && parentNode.node.node.Name) {
								name = parentNode.node.node.Name as string
							}
						}
						if (Views.length) {

							let viewTabs: IView[] = []
							let shapes: IShapeRecord[] | undefined;
							if (isLocalLibRadio(selectedRadio)) {
								try {
									const eqidsSortName = FnProcessMfgAcronym(Views[0].EQID as string)
									shapes = await FnGetLibJson('shapes/' + eqidsSortName + '/' + Views[0].EQID, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as IShapeRecord[] | undefined;
								} catch (error) {
									console.error('DeviceModel: failed to fetch lib shapes', error);
									shapes = [];
								}

							} else {

								/* Parses GetDeviceModelSvg response into a shape record for one view. */
								function parseDevicePreview(data: unknown, viewName: string): IShapeRecord[] {
									if (!isRecord(data) || typeof data.devicePreviewJson !== 'string') return [];

									let parsed: JsonRecord | null = null;
									try {
										const rawParsed = parseJsonString(data.devicePreviewJson);
										parsed = isRecord(rawParsed) ? rawParsed : null;
									} catch (error) {
										console.error('DeviceModel: failed to parse device preview', error);
										return [];
									}

									const parentList = parsed?.Parent;
									const parent = Array.isArray(parentList) ? parentList[0] : undefined;
									if (!parent || !isRecord(parent)) return [];
									let svg = parent.SVGFile as string;
									if (selectedRadio === DeviceModelFEnums.CurrentSite || selectedRadio === DeviceModelFEnums.AllSites || isLocalLibRadio(selectedRadio)) {
										svg = window.atob(parent.SVGFile as string)
									}
									const output: IShapeRecord = {
										ShapeID: typeof parent.ShapeID === 'string' || typeof parent.ShapeID === 'number'
											? parent.ShapeID
											: null,
										Scale: typeof parent.Scale === 'string' || typeof parent.Scale === 'number'
											? parent.Scale
											: null,
										ViewShortName: viewName,
										bSVG: svg ?? undefined,
										LastUpdated: typeof parent.LastUpdated === 'string' ? parent.LastUpdated : ""
									};

									return [output];
								}
								const shapesData: IShapeRecord[] = [];
								for (const view of Views) {
									try {
										const deviceDetailsRep = await fetchInterceptorData(
											DEVICEMODEL.GetDeviceModelSvg,
											{ deviceViewEntID: view.EntID },
											statusBarContext
										);
										const parsed = parseDevicePreview(deviceDetailsRep, view.ViewShortName ?? "");

										if (parsed.length > 0) {
											shapesData.push(parsed[0]); // because parseDevicePreview returns array
										}
									} catch (error) {
										console.error('DeviceModel: failed to fetch shape', error);
									}
								}

								shapes = shapesData
							}

							const viewObj = createViewsForShape(shapes ?? [], name as string)

							viewTabs = viewObj
							if (info.node.treetype === "View") {
								setSelectedTabViewName(info.node.Name as string)
							} else {
								setSelectedTabViewName("F")
							}
							setView([...viewTabs])
						}
					} else {
						setView([])
					}

					// Extract inventory device details and set to context
					try {
						const detailItem = details[0];
						let viewsList: IDeviceViewRecord[] = [];
						if (detailItem.Views) {
							viewsList = typeof detailItem.Views === "string"
								? (parseJsonString(detailItem.Views as string) as IDeviceViewRecord[])
								: (detailItem.Views as IDeviceViewRecord[]);
						}
						const frontView = viewsList?.find(v => v.ViewShortName === "F");
						const rearView = viewsList?.find(v => v.ViewShortName === "R");

						const currentTree = updatedTreeData ?? (selectedTabName === "result" ? treeDataResult : treeDataRelated);
						let resolvedDeviceName = info.node.Name;
						if (info.node.treetype === "View" && currentTree && info.node.parentEntID) {
							const parentNode = FnGetKeyFromEntId(currentTree, info.node.parentEntID, true);
							if (parentNode?.node?.node?.Name) {
								resolvedDeviceName = parentNode.node.node.Name as string;
							}
						}

						let sourcePath = "";
						if (currentTree && info.node.key) {
							const parents = FnFindNodeAndParents(currentTree, info.node.key);
							if (parents && parents.length) {
								sourcePath = parents
									.filter(p => p.Name && p.NodeType !== "F" && p.NodeType !== "R" && p.treetype !== "View")
									.map(p => p.Name?.trim())
									.join("->");
							}
						}

						const isGuid = (val?: string | null): boolean => {
							if (!val || typeof val !== "string") return false;
							return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
						};

						let moduleDeviceId: string | undefined = undefined;
						if (isGuid(info.node.DeviceEntId)) {
							moduleDeviceId = info.node.DeviceEntId;
						}

						if (!moduleDeviceId && info.node.treetype === "View" && currentTree && info.node.parentEntID) {
							if (isGuid(info.node.parentEntID)) {
								moduleDeviceId = info.node.parentEntID;
							} else {
								const parentNode = FnGetKeyFromEntId(currentTree, info.node.parentEntID, true);
								if (isGuid(parentNode?.node?.node?.DeviceEntId)) {
									moduleDeviceId = parentNode.node?.node.DeviceEntId as string;
								} else if (isGuid(parentNode?.node?.node?.NodeEntID)) {
									moduleDeviceId = parentNode.node?.node.NodeEntID as string;
								}
							}
						}

						if (!moduleDeviceId && isGuid(info.node.NodeEntID)) {
							moduleDeviceId = info.node.NodeEntID ?? undefined;
						}

						const extractedDetails: IInventoryDeviceDetails = {
							EQID: String(detailItem.EQID || info.node.EQID || ""),
							deviceName: typeof resolvedDeviceName === "string" ? resolvedDeviceName : String(resolvedDeviceName ?? ""),
							moduleDeviceID: moduleDeviceId,
							moduleViewID1: frontView?.EntID ?? null,
							moduleViewID2: rearView?.EntID ?? null,
							slotsNeeded: Number(detailItem.SlotsNeeded ?? 0),
							sourcePath: sourcePath,
							networkPort: Array.isArray(detailItem.NetworkPorts) ? detailItem.NetworkPorts.length : 0,
							powerPort: Array.isArray(detailItem.PowerPorts) ? detailItem.PowerPorts.length : 0,
							rawDetails: detailItem as Record<string, any>
						};

						setInventoryDeviceDetails?.(extractedDetails);
						inventoryDeviceDetailsRef.current = extractedDetails;
					} catch (err) {
						console.error("DeviceModel: failed to extract inventory device details", err);
					}
				}
			}
		} catch (error) {
			console.error('DeviceModel: handleShowPropertyTab failed', error)
		}
	}

	/* Maps shape records into Front/Rear view tabs for the Property panel. */
	function createViewsForShape(data: IShapeRecord[], selectedEqid: string): IView[] {
		return data
			.filter((item): item is IShapeRecord & { ViewShortName: string } =>
				typeof item.ViewShortName === 'string' && item.ViewShortName.length > 0
			)
			.sort((a, b) => a.ViewShortName.localeCompare(b.ViewShortName))
			.map(item => ({
				svg: item.bSVG?.trim() ?? "",
				viewTitle: selectedEqid,
				uniqueName: `svg_${item.ShapeID}_${item.ViewShortName}`,
				tab: {
					label: item.ViewShortName === "F" || item.ViewShortName === "Front" ? "Front" : "Rear",
					tooltip: item.ViewShortName === "F" || item.ViewShortName === "Front" ? "Front" : "Rear",
				},
			}));
	}

	/* Handles tree node selection on Result or Related tabs. */
	const handleNodeSelectTree = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[], selectedTabName: string) => {

		if (defaultSelectedKeysResult?.length && defaultSelectedKeysResult[0] === info.node.key) return;
		else if (defaultSelectedKeysRelated?.length && defaultSelectedKeysRelated[0] === info.node.key) return;
		if (selectedTabName === "related") {
			setDefaultExpandedKeysRelated(expandedKeys);
			setDefaultSelectedKeysRelated([info.node.key]);
		} else {
			setDefaultExpandedKeysResult(expandedKeys);
			setDefaultSelectedKeysResult([info.node.key]);
			setEQIDRelation(null)
			setLeftSideTabsObj(leftSideTabs)
		}
		setDefaultSelectedNodeInfo(info);
		if (info.node.EQID && info.node.treetype === "View") {
			setView([])
		}
		if (info.node.NodeEntID && (info.node.treetype === "Product" || info.node.treetype === "ProductNumber" || info.node.treetype === "View")) {
			let treedata =
				selectedTabName === "result"
					? treeDataResult
					: treeDataRelated
			handleShowPropertyTab(info, selectedTabName, treedata)
		} else {
			setRightSideSelectedTab(deviceModelTabs.Search)
			setPropertyTabData([])
			setView([])
		}
	}

	// resust tabs code end 

	// below code for default selection value of tabs
	useEffect(() => {
		if (!leftSideSelectedTab) {
			setLeftSideSelectedTab(leftSideTabs.labels[0].label)
		}
		if (!rightSideSelectedTab) {
			setRightSideSelectedTab(RightSideTabs.labels[0].label)
		}
	}, [leftSideSelectedTab, rightSideSelectedTab])

	useEffect(() => {
		if (reloadTreeFor?.nodeToRemove) {
			const safe = (val?: string) => val?.trim().toLowerCase() || "";
			let keyToRemove =
				safe(reloadTreeFor?.nodeToRemove.treetype) === "product"
					? reloadTreeFor?.nodeToRemove.key
					: reloadTreeFor?.nodeToRemove.parentEntID ?? reloadTreeFor?.nodeToRemove.key;
			const updateTree = (
				tree: ITreeNode[],
				setTree: React.Dispatch<React.SetStateAction<ITreeNode[]>>,
				setKeys: React.Dispatch<React.SetStateAction<Key[]>>
			) => {
				const { tree: updatedTree, selectedParent } =
					FnRemoveNodeFromTree(tree, keyToRemove);

				if (selectedParent?.key) {
					setKeys([selectedParent.key]);

					setDefaultSelectedNodeInfo({
						event: "select",
						node: selectedParent,
						selected: true,
						selectedNodes: [],
					});
				}

				setTree(updatedTree);
			};

			if (leftSideSelectedTab === deviceModelTabs.Result) {
				updateTree(
					treeDataResult,
					setTreeDataResult,
					setDefaultSelectedKeysResult
				);
			} else {
				updateTree(
					treeDataRelated,
					setTreeDataRelated,
					setDefaultSelectedKeysRelated
				);
			}
		}
	}, [reloadTreeFor?.nodeToRemove.key])


	const lastExecutedSearchRef = useRef<string>('');

	/* Synchronize search source when externalSearch.Source changes. */
	const externalSource = props.externalSearch?.Source;
	useEffect(() => {
		if (externalSource && externalSource !== selectedRadio) {
			handleValueChange(externalSource, "Source", false);
		}
	}, [externalSource]);

	/* Handles external search: selects Manufacturer, Equipment Type, Product Number dropdowns and executes wild search. */
	const externalMfg = props.externalSearch?.mfg?.trim();
	const externalEqType = props.externalSearch?.eqtype?.trim();
	const externalProdNo = props.externalSearch?.productnumber?.trim();
	const externalEqId = props.externalSearch?.eqid?.trim();
	const externalKeywords = props.externalSearch?.Keywords?.trim();
	const externalAndOrFlag = props.externalSearch?.AndOrFlag;

	useEffect(() => {
		if (!externalMfg && !externalEqType && !externalProdNo && !externalEqId && !externalKeywords) {
			return;
		}

		const targetRadio = externalSource || selectedRadio;
		if (!isCableDeviceModelMode(targetRadio, props.selectedNode, props.ShowOnlyLibraryRedio) && !isDeviceUrlValidated) {
			return;
		}

		const andOrValue =
			externalAndOrFlag === undefined
				? ""
				: externalAndOrFlag
					? "OR"
					: "AND";

		const searchKey = `${targetRadio}::${externalMfg ?? ''}::${externalEqType ?? ''}::${externalProdNo ?? ''}::${externalEqId ?? ''}::${externalKeywords ?? ''}::${andOrValue}`;

		if (lastExecutedSearchRef.current === searchKey) {
			return;
		}
		lastExecutedSearchRef.current = searchKey;

		const timer = setTimeout(async () => {
			try {
				if (externalSource && externalSource !== selectedRadio) {
					handleValueChange(externalSource, "Source", false);
				}

				// Ensure manufacturers are loaded
				if (optionDataRef.current.length === 0 || !optionDataRef.current.some(item => Boolean(item.mfg && item.mfg !== 'All'))) {
					await GetManufacturers("");
				}

				// Select Manufacturer dropdown if provided (find by startsWith in mfg combo)
				if (externalMfg) {
					const targetMfgLower = externalMfg.toLowerCase();
					const matchedMfg = optionDataRef.current.find(
						(item) =>
							item.mfg &&
							item.mfg !== 'All' &&
							item.mfg.trim().toLowerCase().startsWith(targetMfgLower)
					) || optionDataRef.current.find(
						(item) =>
							item.mfg &&
							item.mfg !== 'All' &&
							targetMfgLower.startsWith(item.mfg.trim().toLowerCase())
					) || optionDataRef.current.find(
						(item) =>
							item.mfg &&
							item.mfg !== 'All' &&
							item.mfg.trim().toLowerCase() === targetMfgLower
					);
					const mfgVal = matchedMfg?.mfg ?? externalMfg;
					const mfgOption: IDeviceSearchOption = matchedMfg
						? { label: matchedMfg.mfg, ...matchedMfg, value: matchedMfg.mfg }
						: { label: mfgVal, mfg: mfgVal, value: mfgVal };

					profileStringRef.current = { Manufacturer: mfgOption };
					setProfileString({ Manufacturer: mfgOption });
					await handleValueChangeForForm(mfgOption, "Manufacturer", false);
				}

				// Select Equipment Type dropdown if provided
				if (externalEqType && eqTypeApiDataRef.current && eqTypeApiDataRef.current.length > 0) {
					const targetEqTypeLower = externalEqType.toLowerCase();
					const matchedEqType = eqTypeApiDataRef.current.find(
						(item) =>
							item.mty &&
							item.mty !== 'All' &&
							item.mty.trim().toLowerCase().startsWith(targetEqTypeLower)
					) || eqTypeApiDataRef.current.find(
						(item) =>
							item.mty &&
							item.mty !== 'All' &&
							targetEqTypeLower.startsWith(item.mty.trim().toLowerCase())
					);
					if (matchedEqType?.mty) {
						const eqTypeValue = matchedEqType.mty;

						profileStringRef.current = {
							...profileStringRef.current,
							["Equipment Type"]: eqTypeValue
						};
						setProfileString(prev => ({
							...prev,
							["Equipment Type"]: eqTypeValue
						}));
						await handleValueChangeForForm(eqTypeValue, "Equipment Type", false);
					}
				}

				// Select Product Number dropdown if provided
				if (eqTypeApiDataRef.current && eqTypeApiDataRef.current.length > 0) {
					const targetProdNoLower = externalProdNo?.toLowerCase();
					let matchedProdNo = targetProdNoLower
						? (eqTypeApiDataRef.current.find(
							(item) =>
								item.pno &&
								item.pno !== 'All' &&
								item.pno.trim().toLowerCase() === targetProdNoLower.toLowerCase()
						) || eqTypeApiDataRef.current.find(
							(item) =>
								item.pno &&
								item.pno !== 'All' &&
								targetProdNoLower === item.pno.trim().toLowerCase()
						))
						: undefined;

					if (!matchedProdNo && externalEqId) {
						const targetEqIdLower = externalEqId.toLowerCase();
						matchedProdNo = eqTypeApiDataRef.current.find(
							(item) =>
								item.id &&
								item.id.trim().toLowerCase() === targetEqIdLower.toLowerCase()
						) || eqTypeApiDataRef.current.find(
							(item) =>
								item.id &&
								targetEqIdLower === item.id.trim().toLowerCase()
						);
					}

					if (matchedProdNo?.pno) {

						const prodValue = matchedProdNo.pno;
						profileStringRef.current = {
							...profileStringRef.current,
							["Product Number"]: prodValue
						};
						setProfileString(prev => ({
							...prev,
							["Product Number"]: prodValue
						}));
						await handleValueChangeForForm(prodValue, "Product Number", false);
					}
				}

				// Execute wildsearch and display search result in tree
				const wildKeyword = (
					externalKeywords ||
					externalProdNo ||
					externalEqId ||
					externalMfg ||
					""
				).trim();

				setTreeDataResult([]);
				setTreeDataRelated([]);
				setPropertyTabData([]);
				setRightSideSelectedTab("Search");
				setSearchText(wildKeyword);

				await handleLensMouse(andOrValue, wildKeyword);
			} catch (error) {
				console.error("DeviceModel: externalSearch execution failed", error);
			}
		}, 300);

		return () => {
			clearTimeout(timer);
		};
	}, [
		externalMfg,
		externalEqType,
		externalProdNo,
		externalEqId,
		externalKeywords,
		externalAndOrFlag,
		externalSource,
		selectedRadio,
		isDeviceUrlValidated
	]);

	// below code for search tabs Start
	/* Updates search source radio selection and resets profile when source changes. */
	const handleValueChange = (value: string, name: string, isDefault?: boolean | undefined) => {
		if (!isDefault) {
			optionDataRef.current = []
			SetDisableFromWhileSearching(true)
			setWildsearchData(null)
			setProfileString({})
			profileStringRef.current = {}
			setSelectedRadio(value ?? DeviceModelFEnums.NetZoomDeviceLibrary)
			if (!isLocalLibRadio(value ?? "") || isCableLibRadio(value ?? "")) {
				setFilterMfg(null)
			}
			const currentSearchText = searchTextRef.current || searchText
			if (currentSearchText && currentSearchText.trim().length > 0) {
				setIsLensDirty((prev) => (prev ? prev : true))
			}
		}
	}
	/* Converts device search records into flat rows for hierarchy tree building. */
	const formatDataForFlatTree = async (data: IDeviceEqTypeRecord[]): Promise<IFlatTreeFormattedRow[]> => {
		let formattedData: IFlatTreeFormattedRow[] = [];
		const isForInventory = selectedRadio === DeviceModelFEnums.Inventory;
		try {
			for (let index = 0; index < data.length; index++) {
				const element = data[index];
				let nodeObj: IDeviceEqTypeRecord = { ...element }
				const unicMfgEQType = data.filter((item) => item.mty === element.mty);

				if (data.length === 1 && unicMfgEQType.length === 1) {

					const eqidsSortName = element.id && FnProcessMfgAcronym(element.id)
					let detailsObj;
					if (isLocalLibRadio(selectedRadio)) {
						try {
							detailsObj = await FnGetLibJson('details/' + eqidsSortName + '/' + element.id, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined)
							setPropertyTabData(detailsObj as IPropertyTabData)
						} catch (error) {
							console.error('DeviceModel: failed to fetch lib details for flat tree', error);
							detailsObj = null;
						}

					} else {
						try {
							const deviceDetailsRep = await fetchInterceptorData(
								DEVICEMODEL.GetDeviceDetails,
								{
									allSites: selectedRadio === DeviceModelFEnums.AllSites,
									isInventory: selectedRadio === DeviceModelFEnums.Inventory,
									deviceID: element.entid
								},
								statusBarContext
							);
							if (isRecord(deviceDetailsRep) && typeof deviceDetailsRep.deviceJson === 'string') {
								detailsObj = parseJsonString(deviceDetailsRep.deviceJson) as JsonRecord[] | null;
							}
						} catch (error) {
							console.error('DeviceModel: failed to fetch device details for flat tree', error);
							detailsObj = null;
						}
					}

					if (detailsObj && Array.isArray(detailsObj) && detailsObj.length) {
						const detail = detailsObj[0];
						nodeObj = { ...nodeObj, Views: detail.Views, details: JSON.stringify(detailsObj) }
					}
				}
				if (nodeObj) {
					if (nodeObj.Views && (data.length === 1 && unicMfgEQType.length === 1)) {
						const parsedData = typeof nodeObj.Views === "string" ? parseJsonString(nodeObj.Views) : nodeObj.Views;
						if (Array.isArray(parsedData) && parsedData.length) {
							const sortedViews = [...parsedData].sort((a: any, b: any) => {
								const nameA = (a.ViewShortName === "F" || a.ViewShortName === "Front") ? "Front" : (a.ViewShortName === "R" || a.ViewShortName === "Rear") ? "Rear" : (a.ViewName ?? a.ViewShortName ?? "");
								const nameB = (b.ViewShortName === "F" || b.ViewShortName === "Front") ? "Front" : (b.ViewShortName === "R" || b.ViewShortName === "Rear") ? "Rear" : (b.ViewName ?? b.ViewShortName ?? "");
								return nameA.localeCompare(nameB);
							});
							for (let index = 0; index < sortedViews.length; index++) {
								const viewElement = sortedViews[index];
								const obj = {
									ManufacturerName: nodeObj.mfg,
									ManufacturerNodeType: "Manufacturer",
									ManufacturerEntID: `${nodeObj.mfg}`,
									ManufacturerHasChildren: nodeObj.mty ? true : false,
									EqtypeName: nodeObj.mty,
									EqtypeNodeType: nodeObj.ty,
									EqtypeEntID: `${nodeObj.mfg}##${nodeObj.mty}`,
									EqtypeParentID: `${nodeObj.mfg}`,
									EqtypeHasChildren: nodeObj.pno ? true : false,
									EqtypeEQType: nodeObj.ty,
									EqtypeDeviceEntId: nodeObj.entid,
									ProductEntID: isForInventory ? nodeObj.entid : nodeObj.id,
									ProductEQID: nodeObj.id,
									ProductEQType: nodeObj.ty,
									ProductName: nodeObj.pno,
									ProductDescription: nodeObj.md,
									ProductAttrib: nodeObj.Attrib,
									ProductParentID: `${nodeObj.mfg}##${nodeObj.mty}`,
									ProductDetailsJson: nodeObj.details,
									ProductHasChildren: viewElement.ViewShortName ? true : false,
									ProductDeviceEntId: nodeObj.entid,
									ViewName: (viewElement.ViewShortName === "F" || viewElement.ViewShortName === "Front") ? "Front" : "Rear",
									ViewEntID: viewElement.ShapeID,
									ViewViewEntID: viewElement.EntID,
									ViewNodeType: viewElement.ViewShortName,
									ViewParentID: isForInventory ? nodeObj.entid : nodeObj.id,
									ViewEQID: nodeObj.id,
									ViewParentEQID: nodeObj.id,
									ViewEQType: nodeObj.ty,
									ViewDetailsJson: nodeObj.details,
									ViewDeviceViewEntId: nodeObj.EntID ? nodeObj.EntID : viewElement.EntID,
									ViewDeviceEntId: isForInventory ? nodeObj.entid : (nodeObj.entid || "")
								}
								formattedData.push(obj)
							}
						}
					} else {
						let obj = {
							ManufacturerName: nodeObj.mfg,
							ManufacturerNodeType: "Manufacturer",
							ManufacturerEntID: `${nodeObj.mfg}`,
							ManufacturerHasChildren: nodeObj.mty ? true : false,
							EqtypeName: nodeObj.mty,
							EqtypeNodeType: nodeObj.ty,
							EqtypeEntID: `${nodeObj.mfg}##${nodeObj.mty}`,
							EqtypeParentID: `${nodeObj.mfg}`,
							EqtypeHasChildren: nodeObj.pno ? true : false,
							EqtypeDeviceEntId: nodeObj.entid,
							ProductEntID: isForInventory ? nodeObj.entid : nodeObj.id,
							ProductEQID: nodeObj.id,
							ProductEQType: nodeObj.ty,
							ProductName: nodeObj.pno,
							ProductDescription: nodeObj.md,
							ProductAttrib: nodeObj.Attrib,
							ProductDetailsJson: nodeObj.details,
							ProductParentID: `${nodeObj.mfg}##${nodeObj.mty}`,
							ProductNodeType: "Product",
							ProductHasChildren: true,
							ProductDeviceEntId: nodeObj.entid,

						}
						formattedData.push(obj)
					}
				}
			}

		} catch (error) {
			console.error('DeviceModel: formatDataForFlatTree failed', error);
		}

		return formattedData
	}
	// 	sort z to a on rank field
	// get top 50 records
	// find distinct ranks
	// 	for each rank to fatch matching records 
	// sort them by mfg
	// append to final list
	/* Returns top 50 wild-search matches and their distinct match scores. */
	function getHighestMatchScoreRecords(
		dataArray: IDeviceWildSearchItem[]
	): {
		top50: IDeviceWildSearchItem[];
		distinctMatchScores: number[];
	} {
		if (!Array.isArray(dataArray) || dataArray.length === 0) {
			return { top50: [], distinctMatchScores: [] };
		}

		// Step 1: sort by matchScore (n ->  1)
		const sorted = [...dataArray].sort(
			(a, b) => b.matchScore - a.matchScore
		);

		// Step 2: take first 50 records (matchScore >= 3)
		const top50 = sorted
			.slice(0, 50)
			.map(item => {
				// Step 6: get prefix from id
				const prefixMatch = item.id?.slice(0, -3) ?? "";
				return {
					...item,
					mfgprefix: prefixMatch.toUpperCase(),
				};
			});

		// Step 3 & 4: get distinct matchScore list
		const distinctMatchScores = [
			...new Set(top50.map((item) => item.matchScore)),
		];

		return { top50, distinctMatchScores };
	}
	/* Decodes base64 lib search files into a map keyed by file name. */
	function convertFilesToJsonMap(files: IFileObject[]): IJsonDataMap {
		if (!Array.isArray(files) || files.length === 0) {
			return {};
		}

		const result: IJsonDataMap = {};

		for (const file of files) {
			try {
				const fileName = file.filePath.split("/").pop()?.replace(".json", "") ?? "unknown";
				const decodedContent = atob(file.content); // decode base64
				const jsonData = JSON.parse(decodedContent);
				result[fileName] = jsonData;
			} catch (error) {
				console.error(`Error decoding or parsing file: ${file.filePath}`, error);
			}
		}

		return result;
	}
	/* Merges Search arrays from all lib JSON files into one list. */
	function getCombinedSearchArray(jsonMap: IJsonDataMap): IDeviceEqTypeRecord[] {
		const combined: IDeviceEqTypeRecord[] = [];

		for (const key in jsonMap) {
			if (jsonMap[key]?.Search && Array.isArray(jsonMap[key].Search)) {
				combined.push(...jsonMap[key].Search!);
			}
		}

		return combined;
	}
	/* Filters search data and builds the Result tab hierarchy tree. */
	const makeResultTree = async (ApiData: IDeviceEqTypeRecord[] | null, eqtype: string, prod: string, filterMfgData: IFilterMfgEntry[] | null, disableSort?: boolean) => {
		try {
			let filterData: IDeviceEqTypeRecord[] = []
			filterData = ApiData
				? FnGetSearchResults(
					ApiData,
					filterMfgData ?? undefined,
					eqtype === 'All' ? '' : eqtype,
					prod === 'All' ? '' : prod,
					disableSort
				)
				: []
			if (filterData && filterData.length > 0) {
				if (filterData.length > 50) {
					setShowMessage(true);
				}
				const dataToRender = filterData.length > 50 ? filterData.slice(0, 50) : filterData;

				const apiData = await formatDataForFlatTree(dataToRender)
				const hierarchyData = await FnConvertFlatDataToHierarchyData({ "deviceModel": apiData }, null, props.featureId, "AllSites", "DeviceModel", disableSort)
				if (hierarchyData && hierarchyData.length > 0) {
					const updatedTreeData = FnUpdateNodeWithTitleAndIcon(hierarchyData, treeProps.featureTreeProps, props.featureId)

					if (updatedTreeData.length > 1) {
						const selectednode = updatedTreeData[0]
						const selectedNodeInfo: ISelectedNodeInfo = {
							event: "auto-select",
							selected: true,
							node: selectednode,
							selectedNodes: [selectednode],
						}
						setDefaultSelectedNodeInfo(selectedNodeInfo)
						handleShowPropertyTab(selectedNodeInfo, "result", updatedTreeData)
						setDefaultExpandedKeysResult([])
						setDefaultSelectedKeysResult([selectednode.key])
					} else {
						const expandedKeysData = await FnGetAutoExpandNodeKeys(updatedTreeData)
						if (expandedKeysData && expandedKeysData.nodeToSelect && expandedKeysData.nodeToSelect) {
							const autoSelectedNode = (expandedKeysData.nodeToSelect as ITreeNode);
							const selectedNodeInfo: ISelectedNodeInfo = {
								event: "auto-select",
								selected: true,
								node: expandedKeysData.nodeToSelect,
								selectedNodes: [expandedKeysData.nodeToSelect],
							}

							setDefaultSelectedNodeInfo(selectedNodeInfo)
							handleShowPropertyTab(selectedNodeInfo, "result", updatedTreeData)

							setDefaultSelectedKeysResult([autoSelectedNode.key])
							setDefaultExpandedKeysResult(expandedKeysData.keysToExpand)
						}
					}

					setTreeDataResult(updatedTreeData)
				} else {
					setShowMessage(false)
					setTreeDataResult([])
				}
			} else {
				setShowMessage(false)
				setTreeDataResult([])
			}

			setLeftSideTabsObj(leftSideTabs)
		} catch (error) {
			console.error('DeviceModel: makeResultTree failed', error)
			setLeftSideTabsObj(leftSideTabs)
		}
	}
	/* Runs keyword or filtered search and populates the Result tab tree. */
	const handleLensMouse = async (selectedRtmValue: string, searchKeywords?: string) => {
		try {

			setEQIDRelation(null)
			setLeftSideTabsObj(leftSideTabs)
			setLeftSideSelectedTab("Result")
			setRightSideSelectedTab("Search")
			const currentProfile = (profileStringRef.current && Object.keys(profileStringRef.current).length > 0)
				? profileStringRef.current
				: profileString
			const mfg = getProfileManufacturerValue(currentProfile)
			const eqtypeFromProfile = currentProfile["Equipment Type"]
				? currentProfile["Equipment Type"] === "All"
					? ""
					: currentProfile["Equipment Type"]
				: ""
			const eqtype = eqtypeFromProfile
			const prod = currentProfile["Product Number"] ? (currentProfile["Product Number"] === "All" ? "" : currentProfile["Product Number"]) : ""
			const keywordsToSearch = (searchKeywords ?? searchText)?.trim() ?? ""
			if (keywordsToSearch) {
				setShowMessage(false)
				SetDisableFromWhileSearching(true)
				setFilterMfg(null)
				statusBarContext.setIsLoading(true)
				let searchData: Record<string, any>[] | null = wildsearchData;
				if (!wildsearchData) {
					if (isLocalLibRadio(selectedRadio)) {
						try {
							const wildsearchDataSet = await FnGetLibJson('wildsearch', isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined)
							if (wildsearchDataSet && typeof wildsearchDataSet === "object" && "WildSearch" in wildsearchDataSet) {
								setWildsearchData(wildsearchDataSet.WildSearch as IDeviceWildSearchItem[])
								searchData = wildsearchDataSet?.WildSearch as IDeviceWildSearchItem[]
							}
						} catch (error) {
							console.error('DeviceModel: failed to fetch wildsearch lib data', error);
							searchData = null;
						}
					} else {
						try {
							const deviceDetailsRep = await fetchInterceptorData(
								DEVICEMODEL.GetSearchData,
								{
									allSites: selectedRadio === DeviceModelFEnums.AllSites,
									isInventory: selectedRadio === DeviceModelFEnums.Inventory,
								},
								statusBarContext
							);
							searchData = parseDeviceJsonArray(deviceDetailsRep) as IDeviceWildSearchItem[] | null;
						} catch (error) {
							console.error('DeviceModel: failed to fetch search data', error);
							searchData = null;
						}
					}

				}
				const searchTextArray = []
				if (mfg) {
					searchTextArray.push(mfg)
				}
				if (eqtype) {
					searchTextArray.push(eqtype)
				}
				if (prod) {
					searchTextArray.push(prod)
				}
				searchTextArray.push(...keywordsToSearch.toLocaleLowerCase().replace(/_/g, ' ').split(/\s+/).filter(Boolean))
				let searchResult = searchData ? wildSearch(searchData, searchTextArray as string[], selectedRtmValue === "AND" ? true : false) : []

				// Cable mode: drop typed non-cable rows; wildsearch often has no mty — keep those
				if (isCableDeviceModelMode(selectedRadio, props.selectedNode, props.ShowOnlyLibraryRedio) && Array.isArray(searchResult)) {
					searchResult = searchResult.filter((item) => {
						const rec = item as Record<string, unknown>;
						const ty = rec.ty ?? rec.EQType ?? rec.eqtype;
						const mty = rec.mty ?? rec.MfgEQType ?? rec.mfgeqtype;
						if ((ty == null || ty === '') && (mty == null || mty === '')) {
							return true;
						}
						return isCableRecord(item);
					});
				}

				if (searchResult.length > 50) {
					setShowMessage(true)
				} else {
					setShowMessage(false)
				}
				if (searchResult.length) {
					setIsLensDirty(true)
					const highestMatchScoreRecords = getHighestMatchScoreRecords(searchResult)

					if (highestMatchScoreRecords.distinctMatchScores) {
						const treeDataObject: IMatchScoreTreeGroup[] = []
						const preFixmatch: string[][] = []
						const uniquePrefixes: string[][] = [];
						const groupedData: Record<number, IDeviceWildSearchItem[]> = {};

						for (const score of highestMatchScoreRecords.distinctMatchScores) {
							const filterData = highestMatchScoreRecords.top50.filter(
								item => item.matchScore === score
							);

							groupedData[score] = filterData;

							const prefixes = [...new Set(
								filterData
									.map(item => item.mfgprefix?.trim())
									.filter((prefix): prefix is string => Boolean(prefix))
							)];

							uniquePrefixes.push(prefixes);
						}

						if (uniquePrefixes.length !== 0) {
							preFixmatch.push(...uniquePrefixes);

							if (isLocalLibRadio(selectedRadio)) {
								const flatPrefixes = uniquePrefixes.flat();
								const searchFiles = [...new Set(flatPrefixes)].map(p => `search/${p}.json`);

								try {
									const resultTree = await FnGetLibJson(
										searchFiles,
										isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/multiple` : undefined,
										undefined,
										true
									);
									if (resultTree && typeof resultTree === "object" && "files" in resultTree && resultTree?.files) {
										const JsonObjOfFile = convertFilesToJsonMap(resultTree.files as IFileObject[]);
										const fileDataTreeApiData = getCombinedSearchArray(JsonObjOfFile);

										const dataMap = new Map(
											fileDataTreeApiData.map((item) => [item.id, item])
										);

										for (const score of highestMatchScoreRecords.distinctMatchScores) {
											const filterData = groupedData[score];

											const filterDataTree: IDeviceEqTypeRecord[] = [];

											for (const element of filterData) {
												const found = dataMap.get(element.id);
												if (found) {
													filterDataTree.push(found);
												}
											}

											treeDataObject.push({ matchScore: score, apiData: filterDataTree });
										}
									}
								} catch (error) {

									console.error('DeviceModel: failed to fetch lib search files', error);
								}
							} else {
								makeResultTree(highestMatchScoreRecords.top50 as unknown as IDeviceEqTypeRecord[], eqtype, prod, [], true);
								statusBarContext.setIsLoading(false);
								SetDisableFromWhileSearching(false);
							}
						}
						if (preFixmatch.length === 0) {
							if (highestMatchScoreRecords.top50.length > 0) {
								makeResultTree(highestMatchScoreRecords.top50 as unknown as IDeviceEqTypeRecord[], eqtype, prod, [], true)
							} else if (eqTypeApiDataRef.current && eqTypeApiDataRef.current.length > 0 && (mfg || eqtype || prod)) {
								makeResultTree(eqTypeApiDataRef.current, eqtype, prod, mfg ? [{ Manufacturer: mfg }] : filterMfg)
							} else {
								setConfirmMessage("No search result found !");
								setShowOkButtonOnly(true);
								setDeleteOpen(true);
							}
							setIsLensDirty(false);
							statusBarContext.setIsLoading(false)
							SetDisableFromWhileSearching(false)

						} else {

							if (isLocalLibRadio(selectedRadio)) {
								const finalTreeDataObject: IDeviceEqTypeRecord[] = [];

								for (let index = 0; index < treeDataObject.length; index++) {
									const element = treeDataObject[index];

									const updatedApiData = element.apiData.map((item) => ({
										...item,
										matchScore: element.matchScore,
									}));

									finalTreeDataObject.push(...updatedApiData);
								}
								if (finalTreeDataObject.length > 0) {
									makeResultTree(finalTreeDataObject, eqtype, prod, [], true)
								} else if (highestMatchScoreRecords.top50.length > 0) {
									makeResultTree(highestMatchScoreRecords.top50 as unknown as IDeviceEqTypeRecord[], eqtype, prod, [], true)
								} else if (eqTypeApiDataRef.current && eqTypeApiDataRef.current.length > 0 && (mfg || eqtype || prod)) {
									makeResultTree(eqTypeApiDataRef.current, eqtype, prod, mfg ? [{ Manufacturer: mfg }] : filterMfg)
								} else {
									makeResultTree(finalTreeDataObject, eqtype, prod, [], true)
								}
								statusBarContext.setIsLoading(false)
								SetDisableFromWhileSearching(false)
							}
						}
					}


				} else {
					if (eqTypeApiDataRef.current && eqTypeApiDataRef.current.length > 0 && (mfg || eqtype || prod)) {
						makeResultTree(eqTypeApiDataRef.current, eqtype, prod, mfg ? [{ Manufacturer: mfg }] : filterMfg)
					} else {
						setConfirmMessage("No search result found !");
						setShowOkButtonOnly(true);
						setDeleteOpen(true);
					}
					statusBarContext.setIsLoading(false)
					setIsLensDirty(false);
					SetDisableFromWhileSearching(false)
				}

			} else {
				makeResultTree(eqTypeApiDataRef.current, eqtype, prod, filterMfg)
				setIsLensDirty(false)
				SetDisableFromWhileSearching(false)
			}


		} catch (error) {
			console.error('DeviceModel: handleLensMouse failed', error)
			statusBarContext.setIsLoading(false)
			SetDisableFromWhileSearching(false)
		}
	}

	/* Handles manufacturer, equipment type, and product number filter changes. */
	const handleValueChangeForForm = async (value: IDeviceFormFieldValue, name: string | undefined, isDefault?: boolean | undefined) => {
		try {
			if (!isDefault) {
				setShowMessage(false)

				let profileData = { ...(profileStringRef.current || profileString) }
				const isMfgAll = !value || value === "All" || (typeof value !== "string" && value.value === "All");
				if (name === "Manufacturer" && !isMfgAll) {
					profileData = {}
				} else if (name === "Manufacturer" && isMfgAll) {
					profileData = {}
					setProfileString({})
					profileStringRef.current = {}
					setFilterMfg(null)
					eqTypeApiDataRef.current = null
					const baseMfgAndAttr = optionDataRef.current
						.filter((item) => !!item.isAttribute || (item.mfg != null && item.mfg !== ''))
						.map((item) => (item.isAttribute ? item : { ...item, mty: undefined, pno: undefined }));
					optionDataRef.current = [
						{ label: "All", mfg: "All", mty: "All", pno: "All", value: "All" },
						...baseMfgAndAttr.filter((item) => item.mfg !== "All")
					];
				}
				if (name) {
					profileData[name] = value
					setProfileString(profileData)

					profileStringRef.current = profileData
				}

				if (name === "Manufacturer" && value && !isMfgAll) {

					// Keep manufacturer + attribute rows only; drop prior eqtype/product options
					// (product rows have pno but no mty, so filtering !mty alone left stale pnos)
					let removeEqType = optionDataRef.current
						.filter((item) => !!item.isAttribute || (item.mfg != null && item.mfg !== ''))
						.map((item) => (item.isAttribute ? item : { ...item, mty: undefined, pno: undefined }));
					let selectedMfgOption = typeof value === 'string'
						? optionDataRef.current.find((item) => item.mfg === value)
						: optionDataRef.current.find((item) => item.mfg === value.mfg);
					let mfgArray: IFilterMfgEntry[] = []

					if (isLocalLibRadio(selectedRadio)) {
						let relatedJson: ILibRelatedData | IRelatedManufacturerRecord[] | null = reletedMfg
						if (!reletedMfg) {
							try {
								const fetchedRelated = await FnGetLibJson(Lib.related, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined)
								relatedJson = parseLibRelatedData(fetchedRelated)
								if (relatedJson?.Related) {
									setReletedMfg(relatedJson.Related)
								}
							} catch (error) {

								console.error('DeviceModel: failed to fetch related manufacturers', error);
							}
						}
						const relatedRecords = getRelatedRecordsFromCache(relatedJson)
						const mfgName = getMfgNameFromFormValue(value, selectedMfgOption)
						if (relatedRecords) {
							setReletedMfg(relatedRecords)
							const relatedManufacturer = FnFindRelatedManufacturer(relatedRecords, mfgName) as IFilterMfgEntry[]
							if (relatedManufacturer.length) {
								mfgArray = [...relatedManufacturer, { Manufacturer: mfgName }]
							} else {
								mfgArray = [{ Manufacturer: mfgName }]
							}

						} else {
							mfgArray = [{ Manufacturer: mfgName }]
						}
						setFilterMfg(mfgArray)
					}
					// find eqid with releted menufacturer and seleted menufacturer
					let equipmentType: { Search: IDeviceEqTypeRecord[] } = { Search: [] }
					let eqids: IDeviceEqTypeRecord[] = []
					const mfgAcronym = (typeof value !== 'string' ? value.ma : undefined) ?? selectedMfgOption?.ma ?? '';

					if (isLocalLibRadio(selectedRadio)) {
						try {
							equipmentType = await FnGetLibJson(`search/${mfgAcronym}`, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as { Search: IDeviceEqTypeRecord[] } ?? { Search: [] }
						} catch (error) {

							console.error('DeviceModel: failed to fetch lib equipment type', error);
							equipmentType = { Search: [] };
						}
					} else if (mfgAcronym.length) {
						try {
							const eqRep = await fetchInterceptorData(
								DEVICEMODEL.GetDeviceDetailsForMfg,
								{
									allSites: selectedRadio === DeviceModelFEnums.AllSites,
									isInventory: selectedRadio === DeviceModelFEnums.Inventory,
									mfgAcronym
								},
								statusBarContext
							);
							equipmentType.Search = parseDeviceJsonArray(eqRep) ?? []
						} catch (error) {
							console.error('DeviceModel: failed to fetch equipment type', error);
							equipmentType.Search = []
						}
					}

					if (equipmentType && equipmentType.Search) {
						eqids = isCableDeviceModelMode(selectedRadio, props.selectedNode, props.ShowOnlyLibraryRedio)
							? equipmentType.Search.filter((item) => isCableRecord(item))
							: equipmentType.Search

						eqTypeApiDataRef.current = eqids
						setIsLensDirty(true)
					}

					const mtyAll = [{ mty: "All" }]
					eqids = eqids
						.sort((a, b) => (a.mty ?? '').localeCompare(b.mty ?? ''))
						.filter((item, index, self) => index === self.findIndex((t) => t.mty === item.mty));
					if (eqids.length === 1) {

						let productNumber = eqTypeApiDataRef.current && eqTypeApiDataRef.current.filter((item) => item.mty === eqids[0].mty)
						productNumber = productNumber && productNumber.sort((a, b) => (a.pno ?? '').localeCompare(b.pno ?? '')).filter(
							(item, index, self) =>
								index === self.findIndex((t) => t.pno === item.pno)
						);
						if (productNumber && productNumber.length === 1) {
							profileData["Product Number"] = productNumber[0].pno;
						} else {
							profileData["Product Number"] = "All"
						}
						let productNumberFiltered = []
						if (productNumber) {
							for (let index = 0; index < productNumber.length; index++) {
								const element = productNumber[index];
								productNumberFiltered.push({ label: element.pno, pno: element.pno, value: element.pno })
							}
						}
						let eqtypeFilter = []
						if (productNumber) {
							for (let index = 0; index < productNumber.length; index++) {
								const element = productNumber[index];
								eqtypeFilter.push({ label: element.mty, mty: element.mty, value: element.mty })
							}
						}
						profileData["Equipment Type"] = eqids[0].mty

						const optionsDataObj = [...mtyAll, ...removeEqType, ...eqtypeFilter, ...productNumberFiltered]
						optionDataRef.current = optionsDataObj
					} else {

						const eqTypeAll = [{ mty: "All", pno: "All" }]
						profileData["Equipment Type"] = "All";
						profileData["Product Number"] = "All";
						let equipmentTypeFiltered = []
						for (let index = 0; index < eqids.length; index++) {
							const element = eqids[index];
							equipmentTypeFiltered.push({ label: element.mty, mty: element.mty, value: element.mty })
						}
						const optionsDataObj = [...eqTypeAll, ...removeEqType, ...equipmentTypeFiltered]
						optionDataRef.current = optionsDataObj
					}
				}
				else if (name === "Equipment Type" && value) {

					let removeProduct = optionDataRef.current.filter((item) => !item.pno)
					const eqTypeValue = typeof value === 'string' ? value : (value.mty ?? value.value ?? '');
					let productNumber = eqTypeApiDataRef.current
						? (eqTypeValue === "All" || eqTypeValue === ""
							? eqTypeApiDataRef.current
							: eqTypeApiDataRef.current.filter((item) => item.mty === eqTypeValue))
						: null;
					productNumber = productNumber && productNumber.sort((a, b) => (a.pno ?? '').localeCompare(b.pno ?? '')).filter(
						(item, index, self) =>
							index === self.findIndex((t) => t.pno === item.pno)
					);
					if (productNumber) {
						if (productNumber.length === 1) {
							profileData["Product Number"] = productNumber[0].pno;
						} else {
							profileData["Product Number"] = "All"
						}
						const productAll = [{ pno: "All" }]
						let productNumberFiltered = []
						for (let index = 0; index < productNumber.length; index++) {
							const element = productNumber[index];
							productNumberFiltered.push({ label: element.pno, pno: element.pno, value: element.pno })
						}
						const optionsDataObj = [...productAll, ...removeProduct, ...productNumberFiltered]
						optionDataRef.current = optionsDataObj
						setIsLensDirty(true)
					}
				} else if (name === "Product Number" && value) {
					setIsLensDirty(true)
				} else if (name === "Filter By Attribute") {
					// Keep search enabled when a manufacturer is already selected
					if (getProfileManufacturerValue(profileData) || getProfileManufacturerValue(profileString)) {
						setIsLensDirty(true)
					}
				}
				setProfileString({ ...profileData })

				profileStringRef.current = { ...profileData }
				const currentSearchText = searchTextRef.current || searchText
				const shouldBeDirty = hasSearchCriteria(profileData, currentSearchText)
				setIsLensDirty((prev) => (prev === shouldBeDirty ? prev : shouldBeDirty))
			}
		} catch (error) {
			console.error('DeviceModel: handleValueChangeForForm failed', error)
		}
	}
	// search tabs code end


	/* Switches left-side Result/Related tabs and loads related tree when needed. */
	const handleMouseEventForLeftSideTabs = (actionCode: string) => {
		if (actionCode === "Related") {
			makeRelatedTree()
		} else {
			setTreeDataRelated([]);
			setDefaultExpandedKeysRelated([]);
			setDefaultSelectedKeysRelated([]);
		}
		setLeftSideSelectedTab(actionCode)
	}
	/* Switches right-side Search/Property tabs. */
	const handleMouseEventForRightSideTabs = (actionCode: string) => {
		setRightSideSelectedTab(actionCode)
	}


	/* Loads manufacturer dropdown options for the selected search source. */
	const GetManufacturers = async (keyword: string) => {
		optionDataRef.current = []
		SetDisableFromWhileSearching(true)
		let searchText: { MfgAcronym: IMfgAcronymItem[] } = { MfgAcronym: [] };
		try {

			if (isCableDeviceModelMode(selectedRadio, props.selectedNode, props.ShowOnlyLibraryRedio)) {
				// Local only — avoid /api/files/download/single (and re-fetch when URL availability flips)
				const cableMfgRep = await FnGetLibJson(Lib.cablemfgacronym) as {
					CableMfgAcronym?: IMfgAcronymItem[];
				} | undefined;
				searchText.MfgAcronym = cableMfgRep?.CableMfgAcronym ?? [];

			} else if (DeviceModelFEnums.NetZoomDeviceLibrary === selectedRadio) {
				searchText = await FnGetLibJson(Lib.mfgacronym, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as { MfgAcronym: IMfgAcronymItem[] }
			} else {
				const mfgRep = await fetchInterceptorData(
					DEVICEMODEL.GetMfgNew,
					{
						allSites: selectedRadio === DeviceModelFEnums.AllSites,
						isInventory: selectedRadio === DeviceModelFEnums.Inventory
					},
					statusBarContext
				);
				searchText.MfgAcronym = parseMfgJsonArray(mfgRep) ?? []
			}
		} catch (error) {


			console.error('DeviceModel: failed to fetch manufacturers', error);
			searchText.MfgAcronym = []
		}
		try {
			if (searchText && searchText.MfgAcronym) {
				let Manufacturer = searchText.MfgAcronym.filter(
					(item, index, self) =>
						index === self.findIndex((t) => t.mfg === item.mfg)
				);
				const attributeOptions = isCableDeviceModelMode(selectedRadio, props.selectedNode, props.ShowOnlyLibraryRedio) ? [] : NetZoomDeviceLibAttribute;

				if (Manufacturer.length === 1) {
					const String = { label: Manufacturer[0].mfg, ...Manufacturer[0], value: Manufacturer[0].mfg }
					profileString["Manufacturer"] = String
					setProfileString(profileString)
					optionDataRef.current = [...Manufacturer, ...attributeOptions]
					handleValueChangeForForm(String, "Manufacturer", false)
				} else {
					const AllObject = [{
						mfg: "All",
						mty: "All",
						pno: "All",
					}]
					if (keyword && keyword !== "") {
						const filteredManufacturer = Manufacturer.filter((item) => item.mfg?.toLowerCase().includes(keyword?.toLowerCase()))
						if (filteredManufacturer.length === 1) {
							const String = { label: filteredManufacturer[0].mfg, ...filteredManufacturer[0], value: filteredManufacturer[0].mfg }
							profileString["Manufacturer"] = String
							setProfileString(profileString)
							optionDataRef.current = [...filteredManufacturer, ...attributeOptions]
							handleValueChangeForForm(String, "Manufacturer", false)
						} else {
							const orderMfg = filteredManufacturer.sort((a, b) => (a.mfg ?? '').localeCompare(b.mfg ?? ''));
							if (filteredManufacturer.length === 0) {
								setErrorMessage("No Manufacturer found for the given keyword. Please try again with a different keyword.")
							}
							optionDataRef.current = [...AllObject, ...orderMfg, ...attributeOptions]
							setProfileString({ ...profileString })
						}
					} else {
						const orderMfg = Manufacturer.sort((a, b) => (a.mfg ?? '').localeCompare(b.mfg ?? ''));
						optionDataRef.current = [...AllObject, ...orderMfg, ...attributeOptions]
						setProfileString({ ...profileString })
					}

				}
			}
		} finally {
			SetDisableFromWhileSearching(false)
		}

	}
	/* Cable MFG is local — load once per radio/mode, ignore remote URL validation. */
	useEffect(() => {
		if (!selectedRadio) return;
		if (!isCableDeviceModelMode(selectedRadio, props.selectedNode, props.ShowOnlyLibraryRedio)) return;
		void GetManufacturers("");
	}, [selectedRadio, props.ShowOnlyLibraryRedio, props.selectedNode?.key]);

	/* Device/site MFG: wait for HEAD check so we don't fetch local then remote. */
	useEffect(() => {
		if (!selectedRadio) return;
		if (isCableDeviceModelMode(selectedRadio, props.selectedNode, props.ShowOnlyLibraryRedio)) return;
		if (!isDeviceUrlValidated) return;
		void GetManufacturers("");
	}, [selectedRadio, isDeviceURLAvailable, isDeviceUrlValidated])

	type RemoveNodeResult = {
		tree: ITreeNode[];
		selectedParent?: ITreeNode;
	};

	/* Removes a node from the tree and returns the updated tree with parent to select. */
	const FnRemoveNodeFromTree = (
		tree: ITreeNode[],
		removeKey: Key
	): RemoveNodeResult => {

		let selectedParent: ITreeNode | undefined;

		const process = (
			nodes: ITreeNode[]
		): { nodes: ITreeNode[]; removed: boolean } => {

			const result: ITreeNode[] = [];
			let removedHere = false;

			for (const node of nodes) {

				//  remove only the target node
				if (node.key === removeKey) {
					removedHere = true;
					continue;
				}

				let newNode = node;

				if (node.children?.length) {
					const childResult = process(node.children);

					if (childResult.removed) {
						newNode = {
							...node,
							children: childResult.nodes,
							isLeaf: childResult.nodes.length === 0
						};

						//  select ONLY immediate parent
						if (!selectedParent) {
							selectedParent = newNode;
						}

						removedHere = true;
					}
				}

				result.push(newNode);
			}

			return { nodes: result, removed: removedHere };
		};

		const result = process(tree);

		return {
			tree: result.nodes,
			selectedParent
		};
	};
	/* Expands a product node and lazy-loads Front/Rear view children. */
	const handleNodeExpand = async (expandedNodeKeys: Key[], info: IExpandedNodeInfo, selectedTabName: string) => {
		try {
			if (info && ((info.node.treetype === "Product" && info.node.EQID) || (info.node.children.length === 1 && info.node.treetype === "Eqtype"))) {
				const EqId = info.node.EQID !== "" ? info.node.EQID : info.node.children && info.node.children[0].EQID
				const NodeInfo = info.node.treetype === "Eqtype" ? info.node.children[0] : info.node
				const eqidsSortName = FnProcessMfgAcronym(EqId as string)
				let detailsObj;
				if (isLocalLibRadio(selectedRadio)) {
					try {
						detailsObj = await FnGetLibJson('details/' + eqidsSortName + '/' + EqId, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined)
						setPropertyTabData(detailsObj as any)
					} catch (error) {

						console.error('DeviceModel: failed to fetch lib details on expand', error);
						detailsObj = null;
					}

				} else {
					try {
						const deviceDetailsRep = await fetchInterceptorData(
							DEVICEMODEL.GetDeviceDetails,
							{
								allSites: selectedRadio === DeviceModelFEnums.AllSites,
								isInventory: selectedRadio === DeviceModelFEnums.Inventory,
								deviceID: info.node.DeviceEntId
							},
							statusBarContext
						);
						if (isRecord(deviceDetailsRep) && typeof deviceDetailsRep.deviceJson === 'string') {
							detailsObj = parseJsonString(deviceDetailsRep.deviceJson);
						}
					} catch (error) {
						console.error('DeviceModel: failed to fetch device details on expand', error);
						detailsObj = null;
					}
				}

				if (detailsObj) {

					let nodeObj: { Views?: string | IDeviceViewRecord[]; details?: string; EntID?: string } = {}
					if (isRecord(detailsObj) && detailsObj.Details) {
						detailsObj = detailsObj.Details;
					}
					if (Array.isArray(detailsObj) && detailsObj.length) {
						nodeObj = { Views: detailsObj[0].Views as string | IDeviceViewRecord[] | undefined, details: JSON.stringify(detailsObj) }
					}
					let formattedData: IFlatTreeFormattedRow[] = []
					if (nodeObj && nodeObj.Views) {
						const parsedData = typeof nodeObj.Views === "string" ? parseJsonString(nodeObj.Views) : nodeObj.Views
						if (Array.isArray(parsedData) && parsedData.length) {
							const sortedViews = [...parsedData].sort((a: any, b: any) => {
								const nameA = (a.ViewShortName === "F" || a.ViewShortName === "Front") ? "Front" : (a.ViewShortName === "R" || a.ViewShortName === "Rear") ? "Rear" : (a.ViewName ?? a.ViewShortName ?? "");
								const nameB = (b.ViewShortName === "F" || b.ViewShortName === "Front") ? "Front" : (b.ViewShortName === "R" || b.ViewShortName === "Rear") ? "Rear" : (b.ViewName ?? b.ViewShortName ?? "");
								return nameA.localeCompare(nameB);
							});
							for (let index = 0; index < sortedViews.length; index++) {
								const viewElement = sortedViews[index];
								const obj: IFlatTreeFormattedRow = {
									ViewName: (viewElement.ViewShortName === "F" || viewElement.ViewShortName === "Front") ? "Front" : "Rear",
									ViewEQID: EqId as string ?? "",
									ViewParentEQID: EqId as string ?? "",
									ViewEntID: viewElement.ShapeID,
									ViewNodeType: viewElement.ViewShortName,
									ViewDeviceViewEntId: nodeObj.EntID ? nodeObj.EntID : viewElement.EntID,
									ViewDetailsJson: nodeObj.details,
									ViewParentID: info.node.NodeEntID ?? undefined,
								}
								formattedData.push(obj)
							}
						}
						let hierarchyData = await FnConvertFlatDataToHierarchyData({ "deviceModel": formattedData }, info.node.NodeEntID, props.featureId)
						if (hierarchyData && EqId) {
							if (hierarchyData && hierarchyData.length) {
								const selectedNodeInfo: ISelectedNodeInfo = {
									event: "auto-select",
									selected: true,
									node: hierarchyData[0],
									selectedNodes: [hierarchyData[0]],
								}
								let treedata =
									selectedTabName === "result"
										? treeDataResult
										: treeDataRelated
								handleShowPropertyTab(selectedNodeInfo, selectedTabName, treedata)
								handleNodeSelectTree([hierarchyData[0].key], selectedNodeInfo, expandedNodeKeys, selectedTabName)
							}

							const treeData = selectedTabName === "result" ? treeDataResult : treeDataRelated;
							const updatedTreeData = await FnAddSubNode(treeData, NodeInfo.key, hierarchyData, treeProps.featureTreeProps, props.featureId, false, NodeInfo.stepNo)
							if (selectedTabName === "result") {
								setTreeDataResult(updatedTreeData)
								setDefaultExpandedKeysResult([...expandedNodeKeys, NodeInfo.key]);
								setDefaultSelectedKeysResult([hierarchyData[0].key])
							} else {
								setTreeDataRelated(updatedTreeData)
								setDefaultExpandedKeysRelated([...expandedNodeKeys, NodeInfo.key]);
								setDefaultSelectedKeysRelated([hierarchyData[0].key])
							}
						}
					}

				}
			} else {
				const nodeInfo = info.node.children.length ? info.node.children[0] : info.node
				const selectedNodeInfo: ISelectedNodeInfo = {
					event: "auto-select",
					selected: true,
					node: nodeInfo,
					selectedNodes: [nodeInfo],
				}
				handleNodeSelectTree([nodeInfo.key], selectedNodeInfo, expandedNodeKeys, selectedTabName)
			}
		} catch (error) {
			console.error('DeviceModel: handleNodeExpand failed', error)
		}
	}

	/* Placeholder for confirm-dialog yes action (no-op). */
	function handleConfirmYesClick(): void {
	}

	/* Closes the no-results confirm dialog. */
	function handleConfirmDialogClose(): void {
		setDeleteOpen(false);
	}

	/* Starts drag from Result/Related tree or sets inbound asset transfer data. */
	const handleDragStart = (info: NodeDragEventParams<ITreeNode>) => {
		if (info.event && props.featureId === FEnums.InboundAssets) {
			if (info.event.dataTransfer) {
				const data = {
					eqid: info.node.EQID,
					id: 'EQID',
				}
				info.event.dataTransfer.setData("application/json", JSON.stringify(data));

				return;
			}

		}
		setDragItem(
			{
				source: "devicemodel",
				node: info.node,
				subSource: selectedRadio ?? DeviceModelFEnums.NetZoomDeviceLibrary,
				sourceTreeData: leftSideSelectedTab.toLowerCase() === "result" ? treeDataResult : treeDataRelated,
				MorePropertyData: propertyTabData,
				inventoryDeviceDetails: inventoryDeviceDetailsRef.current
			}
		)
	}

	return (
		<div className='nz-device-model' key={props.uniqueName} >
			<Splitter className='nz-device-model-splitter' >
				<SplitterPanel minSize={10}>
					<div className='nz-result-pane-container'>
						{leftSideTabsObj && treeDataResult.length > 0 && <ActionLabelTabs {...leftSideTabsObj} selectedTabName={leftSideSelectedTab} handleMouse={handleMouseEventForLeftSideTabs} />}
						<div className={`nz-tabs-output-container`}>
							{disableFromWhileSearching ?
								<div className='nz-result-pane-loading'>
									<Label uniqueName={'Loading'} label={'Loading...'} />
								</div>
								:
								<>
									<div className={`nz-search-tab ${leftSideSelectedTab === deviceModelTabs.Result ? "nz-display-block" : "nz-display-none"}`}>
										{treeDataResult && <ResultTab
											uniqueName={`${props.uniqueName}-result-tab`}
											treeData={treeDataResult}
											defaultExpandedKeys={defaultExpandedKeysResult}
											defaultSelectedKeys={defaultSelectedKeysResult}
											treeProps={treeProps}
											handleNodeSelect={(selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
												handleNodeSelectTree(selectedKeys, info, expandedKeys, "result")
											}}
											handleNodeExpand={(expandedNodeKeys: Key[], info: IExpandedNodeInfo) => {
												handleNodeExpand(expandedNodeKeys, info, "result")
											}}
											canAllowDragDrop={canAllowTreeDrag}
											handleDragStart={handleDragStart}
										/>}

									</div>
									<div className={`nz-Property-tab ${leftSideSelectedTab === deviceModelTabs.Related ? "nz-display-block" : "nz-display-none"}`}>
										{treeDataRelated && <RelatedTab
											uniqueName={`${props.uniqueName}-related-tab`}
											treeData={treeDataRelated}
											defaultExpandedKeys={defaultExpandedKeysRelated}
											defaultSelectedKeys={defaultSelectedKeysRelated}
											treeProps={treeProps}
											handleNodeSelect={(selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
												handleNodeSelectTree(selectedKeys, info, expandedKeys, "related")
											}}
											handleNodeExpand={(expandedNodeKeys: Key[], info: IExpandedNodeInfo) => {
												handleNodeExpand(expandedNodeKeys, info, "related")
											}}
											canAllowDragDrop={canAllowTreeDrag}
											handleDragStart={handleDragStart}
										/>}
									</div>
									{showMessage && <div className="nz-info-result-tab">
										More than 50 records found. Please narrow your search.
									</div>}
								</>}
						</div>
					</div>
				</SplitterPanel>
				<SplitterPanel size={50} minSize={50} className='nz-right-side-pane' >
					<div className='nz-right-side-container'>
						{propertyTabData.length > 0 ?
							<ActionLabelTabs {...RightSideTabs} selectedTabName={rightSideSelectedTab} handleMouse={handleMouseEventForRightSideTabs} />
							: <ActionLabelTabs {...onlySearchTab} selectedTabName={rightSideSelectedTab} handleMouse={handleMouseEventForRightSideTabs} />}
						{libraryDocumentSource && <div className='nz-device-model-overlay-pane' title={libraryDocumentSource.tooltip}>
							<OverlayTab
								uniqueName={`${props.uniqueName}-device-model-source-overlay`}
								tabs={[]}
								selectedTabName=''
								tabAlignment='horizontal'
								headerText={libraryDocumentSource.label}
								hideDrager={true}
							/>
						</div>}
						<div className={`nz-tabs-output-container`}>
							<div className={`nz-search-tab ${rightSideSelectedTab === deviceModelTabs.Search ? "nz-display-block" : "nz-display-none"}`}>
								{profileString && optionDataRef.current && props.selectedNode && <SearchTab
									uniqueName="searchTab"
									optionData={optionDataRef.current}
									formControls={formControls}
									profileString={profileString}
									searchTypeValue={selectedRadio}
									errorMessage={errorMessage}
									selectedNode={props.selectedNode}
									featureId={props.featureId}
									treeData={props.treeData}
									isLensDirty={isLensDirty}
									ShowOnlyLibraryRedio={props.ShowOnlyLibraryRedio}
									isDisableForm={disableFromWhileSearching}
									handleValueChangeRadio={handleValueChange}
									handleLensMouse={handleLensMouse}
									searchValueChange={(value: string) => {

										setShowMessage(false)
										setErrorMessage('')
										setRightSideSelectedTab(deviceModelTabs.Search)
										searchTextRef.current = value
										setSearchText(value)
										const activeProfile = profileStringRef.current || profileString
										const shouldBeDirty = hasSearchCriteria(activeProfile, value)
										setIsLensDirty((prev) => (prev === shouldBeDirty ? prev : shouldBeDirty))
									}}
									handleValueChangeForForm={handleValueChangeForForm}
									searchText={searchText} />}
							</div>
							<div className={`nz-Property-tab ${rightSideSelectedTab === deviceModelTabs.Property ? "nz-display-block" : "nz-display-none"}`}>
								{propertyTabData && selectedTabViewName && defaultSelectedNodeInfo && (defaultSelectedNodeInfo?.node.treetype === "Product" || defaultSelectedNodeInfo?.node.treetype === "View")
									&& <PropertyTab
										uniqueName={`${props.uniqueName}-Property-tab`}
										propertyData={propertyTabData}
										featureId={FEnums.ConfigureDevice}
										views={views}
										selectedRadio={selectedRadio}
										selectedTabName={selectedTabViewName === "F" || selectedTabViewName === "Front" ? 'Front' : "Rear"}
									/>

								}
							</div>
						</div>
					</div>

				</SplitterPanel>
			</Splitter>
			<YesNoFormContainer
				isOpen={deleteOpen}
				uniqueName={props.uniqueName}
				message={confirmMessage}
				showOkButton={showOkButtonOnly}
				handleYesButtonClick={handleConfirmYesClick}
				handleNoButtonClick={handleConfirmDialogClose}
				handleOkButtonClick={() => {
					setConfirmMessage("");
					setDeleteOpen(false);
				}}
			/>
		</div >
	)
}

export { DeviceModel }



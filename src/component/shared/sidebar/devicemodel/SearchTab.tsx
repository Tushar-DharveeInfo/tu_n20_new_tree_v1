
import { useEffect, useMemo, useRef, useState } from 'react'
import '../../allcss/sidebar/SearchTab.css'
import { SearchControl } from '../../searchfilter/searchcontrol/SearchControl'
import {
	ISearchComboOption,
	ISearchOptionFieldKey,
	ISearchTab,
} from '../../allinterface/sidebar/ISearchTab'
import { IDeviceModelProfileString, IDeviceSearchOption } from '../../allinterface/sidebar/IDeviceModel'
import { DeviceModelFEnums } from '../../alldefaultprops/sidebar/DeviceModelEnums'
import { FEnums } from '../../../constants/Feature'
import { debounce } from 'lodash'
import { CascadingComboForm, IChangeMeta, ICombo, IOptionItem, RadioButtonGroupControl } from '@n20a/libform'
import { FnGenerateUID } from '../../allcommon/settingsform/FnGenerateUID'
import { ISearchControl } from '../../allinterface/searchfilter/ISearchControl'
import { FnCableModel } from '../../menu/nodemenu/MenuFunction'

/* Default SearchControl props before parent handlers are attached. */
export const searchProps: Pick<
	ISearchControl,
	'uniqueName' | 'isShowFilterControl' | 'lensDirty' | 'filterDirty' | 'searchInputValue'
> & { hiderightmousemenu: boolean } = {
	uniqueName: 'filtericon',
	isShowFilterControl: false,
	lensDirty: false,
	filterDirty: false,
	searchInputValue: '',
	hiderightmousemenu: false,
}

/* Deduplicates option rows by mfg, mty, pno, attribute, or full object key. */
const getUniqueOptionArray = (data: IDeviceSearchOption[]): IDeviceSearchOption[] => {
	const seen = new Set<string>();

	return data.filter((item) => {
		const key = item.mfg
			? `mfg:${item.mfg}`
			: item.mty
				? `mty:${item.mty}`
				: item.pno
					? `pno:${item.pno}`
					: item.isAttribute
						? `attr:${item.isAttribute}`
						: JSON.stringify(item);

		if (seen.has(key)) {
			return false;
		}

		seen.add(key);
		return true;
	});
};

/* Builds cascading combo Option list for a given optionData field key. */
const buildComboOptions = (
	data: IDeviceSearchOption[],
	key: ISearchOptionFieldKey
): ISearchComboOption[] => {
	const options: ISearchComboOption[] = [];
	const seen = new Set<string>();
	const filteredData = data.filter((item) => item[key]);

	for (let index = 0; index < filteredData.length; index++) {
		const element = filteredData[index];
		const optionValue = element[key];
		if (optionValue !== undefined && optionValue !== null) {
			const strVal = String(optionValue).trim();
			if (strVal && !seen.has(strVal.toLowerCase())) {
				seen.add(strVal.toLowerCase());
				options.push({ Option: strVal });
			}
		}
	}

	// Ensure 'All' is at the top if present
	const allIndex = options.findIndex((opt) => opt.Option.toLowerCase() === 'all');
	if (allIndex > 0) {
		const [allOption] = options.splice(allIndex, 1);
		options.unshift(allOption);
	}

	return options;
};

/* Static attribute filter options for the Filter By Attribute combo. */
const attributeFilterOptions: ISearchComboOption[] = [
	{ Option: 'All' },
	{ Option: 'Racks/Cabinets' },
	{ Option: 'Rackmountable' },
	{ Option: 'Cards/Modules' },
	{ Option: 'Chassis' },
];

/* String key/value map accepted by CascadingComboForm initialValues. */
type ICascadingComboInitialValues = Record<string, string | null>;

/* Converts device profile to string values expected by CascadingComboForm. */
const toComboInitialValues = (
	profile?: IDeviceModelProfileString
): ICascadingComboInitialValues | undefined => {
	if (!profile) {
		return undefined;
	}

	const result: ICascadingComboInitialValues = {};

	for (const [key, rawValue] of Object.entries(profile)) {
		if (rawValue === undefined || rawValue === null) {
			result[key] = null;
		} else if (typeof rawValue === 'string') {
			result[key] = rawValue;
		} else if (typeof rawValue === 'object') {
			const option = rawValue as IDeviceSearchOption;
			const comboValue = option.value ?? option.mfg ?? option.label;
			result[key] = comboValue != null ? String(comboValue) : null;
		} else {
			result[key] = String(rawValue);
		}
	}

	return result;
};

/* DeviceModel search tab: source radio, keyword search, and cascading filters. */
export const SearchTab = (searchTabProps: ISearchTab) => {
	const [searchControlProps, setSearchControlProps] = useState(searchProps);
	const [searchText, setSearchText] = useState<string>('');
	const searchTextRef = useRef<string>(searchTabProps.searchText ?? '');
	const [optionConfig, setOptionConfig] = useState<ICombo[]>();
	const [optionData, setOptionData] = useState<IDeviceSearchOption[]>([]);
	const [radioFromControls, setRadioFromControls] = useState<IOptionItem[] | null>(null);
	const [hideRadioBtn, setHideRadioBtn] = useState<boolean>(
		!!searchTabProps.ShowOnlyLibraryRedio ||
		searchTabProps.searchTypeValue === DeviceModelFEnums.NetZoomCableLibrary ||
		(!!searchTabProps.selectedNode && FnCableModel(searchTabProps.selectedNode))
	);
	const [selectedRadio, setSelectedRadio] = useState<string>(
		searchTabProps.searchTypeValue ||
		(searchTabProps.selectedNode && FnCableModel(searchTabProps.selectedNode)
			? DeviceModelFEnums.NetZoomCableLibrary
			: DeviceModelFEnums.NetZoomDeviceLibrary)
	);

	/* Sync keyword text when parent searchText changes. */
	useEffect(() => {
		if (searchTabProps.searchText !== undefined) {
			setSearchText(searchTabProps.searchText);
			searchTextRef.current = searchTabProps.searchText;
		}
	}, [searchTabProps.searchText]);

	/* Deduplicate and store manufacturer/equipment/product option rows. */
	useEffect(() => {
		try {
			if (searchTabProps.optionData) {
				setOptionData(getUniqueOptionArray(searchTabProps.optionData));
			}
		} catch (error) {
			console.error('SearchTab: failed to process option data', error);
			setOptionData([]);
		}
	}, [searchTabProps.optionData]);

	/* Build CascadingComboForm config when optionData changes. */
	useEffect(() => {
		try {
			const handleFormChange = searchTabProps.handleValueChangeForForm;
			const myConfig: ICombo[] = [
				{
					id: 'Manufacturer',
					label: 'Manufacturer',
					disable: searchTabProps.isDisableForm ?? false,
					populateOptions: () => buildComboOptions(optionData, 'mfg'),
					onChange: (value) => {
						handleFormChange?.(value ?? '', 'Manufacturer', false);
						if (searchTextRef.current && searchTextRef.current.trim().length > 0) {
							setSearchControlProps((prev) => (prev.lensDirty ? prev : { ...prev, lensDirty: true }));
						}
					},
				},
				{
					id: 'Equipment Type',
					label: 'Equipment Type',
					disable: searchTabProps.isDisableForm ?? false,
					populateOptions: () => buildComboOptions(optionData, 'mty'),
					onChange: (value) => {
						handleFormChange?.(value ?? '', 'Equipment Type', false);
						if (searchTextRef.current && searchTextRef.current.trim().length > 0) {
							setSearchControlProps((prev) => (prev.lensDirty ? prev : { ...prev, lensDirty: true }));
						}
					},
				},
				{
					id: 'Product Number',
					label: 'Product Number',
					disable: searchTabProps.isDisableForm ?? false,
					populateOptions: () => buildComboOptions(optionData, 'pno'),
					onChange: (value) => {
						handleFormChange?.(value ?? '', 'Product Number', false);
						if (searchTextRef.current && searchTextRef.current.trim().length > 0) {
							setSearchControlProps((prev) => (prev.lensDirty ? prev : { ...prev, lensDirty: true }));
						}
					},
				},
				{
					id: 'Filter By Attribute',
					label: 'Filter By Attribute',
					disable: searchTabProps.isDisableForm ?? false,
					populateOptions: () => attributeFilterOptions,
					onChange: (value) => {
						handleFormChange?.(value ?? '', 'Filter By Attribute', false);
						if (searchTextRef.current && searchTextRef.current.trim().length > 0) {
							setSearchControlProps((prev) => (prev.lensDirty ? prev : { ...prev, lensDirty: true }));
						}
					},
				},
			];
			setOptionConfig(myConfig);
		} catch (error) {
			console.error('SearchTab: failed to build combo config', error);
			setOptionConfig(undefined);
		}
	}, [optionData]);

	/* Radio options for search source selection. */
	const sampleDataForRadio: IOptionItem[] = [
		{ label: DeviceModelFEnums.NetZoomDeviceLibrary, value: DeviceModelFEnums.NetZoomDeviceLibrary },
		{ label: DeviceModelFEnums.Inventory, value: DeviceModelFEnums.Inventory },
		{ label: DeviceModelFEnums.CurrentSite, value: DeviceModelFEnums.CurrentSite },
		{ label: DeviceModelFEnums.AllSites, value: DeviceModelFEnums.AllSites },
	];

	/* Set available source radios based on feature and selected node type. */
	useEffect(() => {
		try {
			const isCableMode =
				(!!searchTabProps.selectedNode && FnCableModel(searchTabProps.selectedNode)) ||
				searchTabProps.searchTypeValue === DeviceModelFEnums.NetZoomCableLibrary ||
				searchTabProps.selectedNode?.Type?.toLowerCase() === 'all cables';

			if (isCableMode) {
				// Cable mode: Cable Library only (hide radios)
				setSelectedRadio(DeviceModelFEnums.NetZoomCableLibrary);
				setHideRadioBtn(true);
				setRadioFromControls([{ label: DeviceModelFEnums.NetZoomCableLibrary, value: DeviceModelFEnums.NetZoomCableLibrary }]);
				if (searchTabProps.searchTypeValue !== DeviceModelFEnums.NetZoomCableLibrary) {
					searchTabProps.handleValueChangeRadio(DeviceModelFEnums.NetZoomCableLibrary, '', false);
				}
			} else if (searchTabProps.ShowOnlyLibraryRedio) {
				// ShowOnlyLibraryRedio for device: NetZoom Device Library only (hide radios)
				setSelectedRadio(DeviceModelFEnums.NetZoomDeviceLibrary);
				setHideRadioBtn(true);
				setRadioFromControls([{ label: DeviceModelFEnums.NetZoomDeviceLibrary, value: DeviceModelFEnums.NetZoomDeviceLibrary }]);
				if (searchTabProps.searchTypeValue !== DeviceModelFEnums.NetZoomDeviceLibrary) {
					searchTabProps.handleValueChangeRadio(DeviceModelFEnums.NetZoomDeviceLibrary, '', false);
				}
			} else if (
				(searchTabProps.featureId === FEnums.InventoryManagement ||
					searchTabProps.featureId === FEnums.InventoryConfiguration) &&
				searchTabProps.selectedNode
			) {
				setHideRadioBtn(false);
				setRadioFromControls(sampleDataForRadio);
			} else {
				setHideRadioBtn(false);
				setRadioFromControls(sampleDataForRadio);
			}
		} catch (error) {
			console.error('SearchTab: failed to set radio controls', error);
			setRadioFromControls(sampleDataForRadio);
		}
	}, [searchTabProps.selectedNode, searchTabProps.treeData, searchTabProps.searchTypeValue, searchTabProps.ShowOnlyLibraryRedio, searchTabProps.featureId]);

	/* Debounced keyword search callback to parent. */
	const debouncedSearch = useMemo(
		() =>
			debounce((value: string) => {
				searchTabProps.searchValueChange(value);
			}, 500),
		[searchTabProps.searchValueChange]
	);

	/* Cancel pending debounced search on unmount. */
	useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, [debouncedSearch]);

	/* Updates local search text, lens dirty state, and debounces parent notification. */
	const searchValueChange = (value: string) => {
		setSearchText(value);
		searchTextRef.current = value;
		const isDirty = Boolean(value?.trim());
		setSearchControlProps((prev) => (prev.lensDirty === isDirty ? prev : { ...prev, lensDirty: isDirty }));
		debouncedSearch(value);
	};

	/* Sync lens dirty icon when parent isLensDirty changes. */
	useEffect(() => {
		const isDirty = Boolean(searchTabProps.isLensDirty);
		setSearchControlProps((prev) => (prev.lensDirty === isDirty ? prev : { ...prev, lensDirty: isDirty }));
	}, [searchTabProps.isLensDirty]);

	/* Handles search source radio selection. */
	function handleValueRadio(value: unknown, meta: IChangeMeta): void {
		const radioValue = typeof value === 'string' ? value : String(value ?? '');
		searchTabProps.handleValueChangeRadio(radioValue, '', false);
		setSelectedRadio(radioValue);
		if (searchTextRef.current?.trim()) {
			setSearchControlProps((prev) => (prev.lensDirty ? prev : { ...prev, lensDirty: true }));
		}
	}

	/* Profile as string map for CascadingComboForm (manufacturer objects are flattened). */
	const comboInitialValues = useMemo(
		(): ICascadingComboInitialValues | undefined =>
			toComboInitialValues(searchTabProps.profileString),
		[searchTabProps.profileString]
	);

	return (
		<div className='nz-searchtab-container'>
			<div className='nz-searchtab-radio'>
				{!hideRadioBtn && radioFromControls && (
					<RadioButtonGroupControl
						options={radioFromControls}
						value={selectedRadio}
						onChange={handleValueRadio}
					/>
				)}
			</div>
			<div className='nz-search-control'>
				{searchControlProps && (
					<SearchControl
						{...searchControlProps}
						hideRightMouseMenu={false}
						isDisableSearch={searchTabProps.isDisableForm ?? false}
						searchInputValue={searchText}
						handleFilterMouse={() => undefined}
						handleLensMouse={(value) => {
							searchTabProps.handleLensMouse(value);
						}}
						searchValueChange={searchValueChange}
					/>
				)}
			</div>
			{searchTabProps.errorMessage && (
				<div className="nz-import-error-msg">
					{searchTabProps.errorMessage}
				</div>
			)}
			<div className='nz-form-list-container'>
				{optionConfig && (
					<CascadingComboForm
						key={searchTabProps.profileString ? FnGenerateUID() : searchProps.uniqueName}
						initialValues={comboInitialValues}
						cascadingComboArray={optionConfig}
						buttons={[]}
						autoSubmit={true}
					/>
				)}
			</div>
		</div>
	);
};

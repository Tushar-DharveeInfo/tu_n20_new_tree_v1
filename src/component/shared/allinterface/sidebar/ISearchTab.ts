import { ITreeNode } from "../tree/ITreeControl";
import { IControl } from "../settingsform/ISettingsLibForm";
import { IDeviceModelProfileString, IDeviceSearchOption } from "./IDeviceModel";

/** Cascading combo option row built from manufacturer/equipment/product data. */
interface ISearchComboOption {
    Option: string;
}

/** Keys used when building cascading combo options from optionData. */
type ISearchOptionFieldKey = "mfg" | "mty" | "pno";

/** Props for the DeviceModel Search tab (radio, keyword search, cascading filters). */
interface ISearchTab {
    uniqueName: string;
    /** Keyword search box value from parent. */
    searchText: string | undefined;
    /** Selected search source radio value. */
    searchTypeValue: string;
    /** Legacy form control definitions (CascadingComboForm uses optionConfig instead). */
    formControls: IControl[];
    /** Current filter profile passed to CascadingComboForm. */
    profileString?: IDeviceModelProfileString;
    featureId?: string;
    /** Manufacturer, equipment type, product, and attribute dropdown options. */
    optionData?: IDeviceSearchOption[];
    /** Error message shown below the search control. */
    errorMessage?: string;
    selectedNode?: ITreeNode;
    treeData?: ITreeNode[] | null;
    /** True when search results are pending or stale. */
    isLensDirty?: boolean;
    isDisableForm?: boolean;
    selectedRedioValue?: string;
    /** When true, only the NetZoom Device Library radio is shown. */
    ShowOnlyLibraryRedio?: boolean;
    handleValueChangeRadio: (value: string, name: string, isDefault?: boolean) => void;
    handleLensMouse: (selectedRtmValue: string) => void;
    searchValueChange: (value: string) => void;
    handleValueChangeForForm: (value: string, name: string | undefined, isDefault?: boolean | undefined) => void;
}

export type {
    ISearchTab,
    ISearchComboOption,
    ISearchOptionFieldKey,
};

import { IActionLabelItem } from "../basic/IActionLabelItem";
import { IControl } from "./ISettingsLibForm";

interface ISettingsContainer {
    uniqueName: string; // Unique identifier for the form container
    formControls: IControl[]; // Array of form control configurations
    allowActionList: boolean;//Whether to show the action list or not
    allowShowHeader: boolean; // indicates whether to show header of form or not 
    allowFilter?: boolean;
    group?: string; // groupName Of selected subGroup name
    subGroup?: string; // subgroup name from selected node
    isDisableForm?: boolean;// Whether to disable or not 
    headerText?: string; // if provided it will show custom header text else it will show the header based on id
    actionLabelItems?: IActionLabelItem[]; // List of action labels for the action list control
    selectedActionLabelItem?: IActionLabelItem; // List of action labels for the action list control
    allowAdd?: boolean; // Flag to allow adding items in the action list
    allowTestApi?: boolean; // Flag to allow testapi  items in the action list
    allowPreflight?: boolean; // Flag to allow preflight items in the action list
    allowDelete?: boolean; // Flag to allow deleting items in the action list
    showEditButton?: boolean; // Flag to show the edit button in the action list
    profileString?: string; // Serialized profile data for initializing form controls
    isAutoSave?: boolean; // Enables auto-save functionality
    featureId?: string; // Feature ID for tracking or identification purposes
    subFeatureId?: string; // Sub Feature ID for tracking or identification purposes
    id?: string;// ID for edit profile 
    optionalFromControls?: IControl[];// Optional payload to be passed
    testApiJson?: Record<string, any>;
    allowHelp?: boolean;
    minDate?: Date;
    measurementUnit?: string;
    allowRecordLabel?: boolean;
    isAddressFormRequired?: boolean;
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean | undefined) => Promise<boolean> | void;//if isAutoSave is true then it will be used to get updated data
    handleSaveAction?: (profileData: string, id?: string | undefined, isSilent?: boolean) => void;// This will be called if allowActionList===false 
    handleActionImageClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void;// To handle button click 
    handleAddClick?: (event: React.MouseEvent<any>, actionCode?: string, payload?: any) => void;// To handle button click 
}

export type { ISettingsContainer }
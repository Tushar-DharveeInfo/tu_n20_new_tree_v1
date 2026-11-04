
import { IActionLabelItem } from "../basic/IActionLabelItem";

interface ISettingsInstanceList {
    uniqueName: string; // A unique name for identifying the action list
    actionLabelItems: IActionLabelItem[]; // Array of action labels for the action list
    handleSelectListItem: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void; // Function to handle list item selection
    handleActionButtonClick: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void; // Function to handle Add, Edit, and Delete button clicks
    isAddMode: boolean;
    allowFilter?: boolean;
    selectedItem?: IActionLabelItem;//This will be used to set the item selected
    allowAdd?: boolean; // Optional flag to enable the Add button
    allowTestApi?: boolean; // Optional flag to enable the TestApi button
    allowPreflight?: boolean; // Optional flag to enable the Preflight button
    showEditButton?: boolean; // Optional flag to enable the Edit button
    allowDelete?: boolean; // Optional flag to enable the Delete button
    disableAdd?: boolean;//to disable action image 
    disableEdit?: boolean;//to disable action image 
    disableDelete?: boolean;//to disable action image 
    disableTestApi?: boolean;//to disable test api 
    iconSource?: string;//if provided it will show the icon 
    allowRecordLabel?: boolean;
}

export type { ISettingsInstanceList }

import { IActionLabel } from '../basic/IActionLabel'

interface IBaseSettingsInstanceList {
    uniqueName: string; // A unique name used for generating unique keys and identifiers
    actionLabels: IActionLabel[]; // Array of action labels with associated actions
    isAddMode: boolean;
    allowAdd: boolean; // Optional flag to show the Add button
    showEditButton: boolean; // Optional flag to show the Edit button
    allowDelete: boolean; // Optional flag to show the Delete button
    allowTestApi: boolean;//to allow test api icon for NetZoom Api
    allowPreflight: boolean;//to allow test all api call for NetZoom Api
    disableAdd: boolean;//to disable action image 
    disableEdit: boolean;//to disable action image 
    disableDelete: boolean;//to disable action image 
    disableTestApi: boolean;//to disable action image
    recordLabel?: string;
    handleSelectListItem: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void; // Callback function for handling label strip actions
    handleMouseClick: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void; // Callback function for handling add, edit, and delete actions
}

export type { IBaseSettingsInstanceList }
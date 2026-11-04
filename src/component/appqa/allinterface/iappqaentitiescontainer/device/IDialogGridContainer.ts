import { IControl } from "../../../../shared/allinterface/settingsform/ISettingsLibForm";

interface IDialogGridContainer {
    uniqueName: string; // Unique identifier for the dialog and its child components
    showDialog: boolean; // Controls whether the dialog is open or closed
    headerText: string; // Text for the dialog header
    handleDialogAction: (event: any, actionCode?: string | undefined) => void;// handle save event for the dialog grid
    rowData?: IControl[]; // Data rows for the grid
    className?: string; // Custom class name for the grid or dialog
    containerClass?: string; // container class for set width and height
    handleSaveForm?: (profileData: string, id?: string) => void;
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean) => void; // Callback for value changes in the grid
    handleSelectionChange?: (event: any, props: any, rowData: any) => void; // if needed need to handle event
    handleMouseEvent?: (event: any, gridRef: any) => void; // Handle mouse event if needed
}

export type { IDialogGridContainer }

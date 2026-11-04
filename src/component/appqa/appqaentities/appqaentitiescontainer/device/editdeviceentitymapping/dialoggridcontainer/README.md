# Dialog Grid Container component for use  in Create Device Entities or Create Cable Entities as popup

## How to use this component : 
- To use this component user need to pass required props and set layout

## Developer: NK

## Packages used for the component 

# component:dialoggridcontainer
# types and interfaces

interface IDialogGridContainer {
    uniqueName: string; // Unique identifier for the dialog and its child components
    showDialog: boolean; // Controls whether the dialog is open or closed
    headerText: string; // Text for the dialog header
    handleDialogAction: (event: any, actionCode?: string | undefined) => void;// handle save event for the dialog grid
    columnDefs?: IBasicGridColDef[]; // Column definitions for the grid (structure depends on the grid library)
    rowData?: any[]; // Data rows for the grid
    gridRef?: React.RefObject<any>; // Reference to the grid instance
    className?: string; // Custom class name for the grid or dialog
    containerClass?: string; // container class for set width and height
    handleValueChange?: (value: any, EntID: string, event: any, selectedData: any, instanceName?: string) => void; // Callback for value changes in the grid
    handleSelectionChange?: (event: any, props: any, rowData: any) => void; // if needed need to handle event
    handleMouseEvent?: (event: any, gridRef: any) => void; // Handle mouse event if needed
}

interface IBasicGridColDef extends ColDef {
    DisplayControl?: string; // display control like input,select,textarea etc.
    IsRequired?: boolean; // required field
    IsReadOnly?: boolean;  // read only field
    id?: string;
}
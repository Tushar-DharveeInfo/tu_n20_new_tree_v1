# Simple Grid component with static data with AppQaTask

# How to use this component 
- we use in task App qa

# Developer: TU

# Packages used for the component 

npm i ag-grid-react
npm i ag-grid-community
npm i @mui/material
npm i @emotion/react
npm i @emotion/styled

# component:appqatask
# types and interfaces 

interface nodemenu {
    showIcon:boolean;
    uniqueName: string;// unique name of component
    container: string; // name of container
    handleSelect:(value:any) => void
    selectedNode?: any; // selected node data
    menuData?: any; // for static data (feature table data),
    searchedDeviceData?:any // search data for gemini info,
    selectedRow?:any // selected row of grid data.
    featureId?:string // feature id 
}

interface ILabel {
    uniqueName: string; //uniqueName for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}

 interface IImage {
    uniqueName: string; //uniqueName for the control and required
    source: Exclude<string, "">;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}

 interface IBasicGridColDef extends ColDef {
    DisplayControl?: string; // display control like input,select,textarea etc.
    IsRequired?: boolean; // required field
    IsReadOnly?: boolean; // read only field
}

 interface IBasicGrid {
    uniqueName:string; //unique name
    instanceName: string; // grid instance name
    showGrid: boolean; // hide show grid base
    rowData?: any;  // grid row data
    columnDefs?: IBasicGridColDef[] ; // grid column data
    totalRecords?: Number; // display in pagination total records
    className?: string; // grid class name
    gridRef?: any; // grid reference 
    featureId?:string;//feature id
    allowPagination?: boolean; // to show or hide pagination
    rowClassRules?: any | null; //dynamically applies CSS classes to rows based on data or custom conditions.
    suppressPaginationPanel?: boolean; //  property in AG Grid that hides the pagination controls
    paginationPageSize?: number; //sets the number of rows displayed per page when pagination is enabled.
    gridOptions?: GridOptions; // grid options
    paginationAutoPageSize?: boolean; //automatically adjusts the number of rows per page based on the grid's height
    rowSelection?: 'single' | 'multiple'; // sets the type of row selection
    hideCopyIcon?: boolean; // hide or shows copy icon
    gridParentStyle?: any; //apply style in parent div
    id?: string | ""; // grid id
    isReadOnly?: boolean; // sets readonly grid.
    containerName?: string; // grid container name
    gridName?: string;// grid name
    index?: number; // grid index
    allowColumnResize?: boolean; // allow column resize (if you pass false then it will allow resize all column accept id and last column)
    allowSort?: boolean; // allow sorting
    allowEdit?: boolean; //allow edit
    allowDeleteButton?: boolean; //allow delete
    allowEditButton?: boolean; //allow edit
    allowDrag?: boolean; //  allow drag and drop
    checkboxSelection?: boolean; // allow checkbox selection in header
    hideKebabMenu?: boolean; // allow to show kebab menu
    allowFilter?: boolean; // allow filter on row header
    descRowNumber?: boolean; // show row number in descending order in id column
    rowNumber?: boolean; // show id column
    deleteRecord?: any; // allow delete record on row
    allowRWD?: any; // allow read,write and delete
    gridTitle?: string; // show grid title
    dynamicPagination?: boolean; // allow dynamic pagination
    entityName?: string; // entity name of grid
    jsonPropertyGrid?: boolean; // apply style for one to many grid
    actionColumn?: boolean | false; // allow action  column
    isExportOnCopy?: boolean; // show export/download icon on grid header
    exportFileName?: string; // export/download file name 
    hideRowKebabMenu?: boolean; // hide or show row kebab menu
    allowCheckBoxOnRow?: boolean; // allow checkbox on row
    allowAutoSizeColumn?: boolean; // allow auto size column
    autoHeightRow?: boolean; // allow auto height row (ex. FQA notes)
    tableName?: string; // table name
    propertyData?: any; // property data for property grid
    hideCopyRowIcon?: boolean; // show hide copy icon on row  
    tableLabel?: string; // to display on header of table label
    showPropertyHeader?: boolean; //  show header on for property panel
    apiPayloadForPangination?: (value: any) => void; // api payload for pagination
    handleMouseEvent?: (event: any, gridRef: any) => void; // grid cell clicked function
    handleMouseForEdit?: (value?: any) => void //edit button click
    handleMouseForDelete?: (value?: any) => void //delete button click
    onCellClicked?:(event:any,gridRef:any)=>void // when cell click 
} 

interface IBaseRightMouseMenu {
    showIcon:boolean;
    uniqueName: string;// unique name of component
    imageObject: IActionImage; //image object with source, width and height
    menuData?: any; // for static data,
    handleClick:(event: any, actionCode?: any) => void;
    handleSelect:(value:any) => void;
}


 interface IActionImageForList extends IActionImage {
    separator?: boolean; // Whether to show separator or not (it will added Hr in between action images)
    menuData?: any;
}
 interface IActionImageList {
    uniqueName: string; //uniqueName for the control and required
    actionImages: IActionImageForList[];
    isVertical: boolean;//Whether strip will show vertically or not
    w: number | string;//Width of strip
    h: number | string;//Height of strip 
    bgColor?: string;//Background color of the strip 
    tooltip?: string;//Tooltip of the strip
    border?: string;//border to show it required
    spacing?: string;//if provided it will apply padding between contianer and action images 
    handleSelect?: (value: any) => void // This function will be called when an action image is selected
    handleMouseLeave?: () => void //mouse move out of strip
}



 interface IActionImage {
    uniqueName: string;//Unique identifier and required
    image: IImage;
    w: number | string; //Width
    actionCode: string;//it will be used to identify the action source
    handleMouse: (event: any, actionCode?: string, payload?: any) => void;
    h?: number | string;//if not provided it will take h=w
    label?: ILabel;
    labelAlign?: "bottom" | "top";//if not provided it will take bottom
    labeltooltip?: string;
    border?: "none" | string; //If set border will show default none
    selected?: boolean;// it will be used to set selected 
    disabled?: boolean;// it will be used to set the action image disabled
    payload?: any // api data to be sent
}


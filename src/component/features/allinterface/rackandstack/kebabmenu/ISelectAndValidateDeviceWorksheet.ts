import { Key } from "rc-tree/lib/interface";
import * as XLSX from "xlsx";
import { IBasicGridColDef } from "../../../../shared/allinterface/tablegrid/IBasicGrid";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
import { IListItem } from "../../../../shared/allinterface/basic/ICheckedListPanel";

type TWorksheetRow = Record<string, string | number | boolean>;
type TWorksheetColumn = IBasicGridColDef & { field: string };
type TWorksheetSheet = {
    sheetName: string;
    column: TWorksheetColumn[];
    rowData: TWorksheetRow[];
    checkboxSelected: boolean;
    isError: number;
};
type TEmptyWorkbook = Record<string, never>;
type TWorkbookState = XLSX.WorkBook | TEmptyWorkbook;
type TEmptySheet = Record<string, never>;
type TSelectedSheetState = TWorksheetSheet | TEmptySheet;

interface IEntityFieldListItem {
    pName?: string;
    tableName?: string;
    requiredToAddRecord?: boolean;
    requiredToUpdateRecord?: boolean;
}

interface IImportEntitySheetResponse {
    jsonStringOutput?: string | null;
    stepsCompleted?: string | null;
}

interface IValidateInputResponse {
    missing?: boolean;
    eqidList?: string | string[];
    shapeIDList?: string | string[];
}

interface ISelectAndValidateDeviceWorksheet {
    uniqueName: string
    headerText: string //for show header
    treeData: ITreeNode[]; // treedata for export
    updateOnly: boolean; // updateOnly
    halfCheckedNodeKeys: Key[]; // half check key of nodes
    checkedNodeKeys: Key[]; // checked key of export tree
    featureId: string; // featureId for condition
    selectedNodeInfo?: ISelectedNodeInfo; // select node data
    explorerTreeData?: ITreeNode[]; // exprorer tree data
    entityName?: string;
    handleClearSelection?: () => void
    handleClickisAuthorized?: (event: unknown, actionCode?: string, payload?: IListItem) => void; //Callback function to handle Item select
}

export type {
    ISelectAndValidateDeviceWorksheet,
    TWorksheetSheet,
    TWorksheetColumn,
    TWorkbookState,
    TWorksheetRow,
    TSelectedSheetState,
    TEmptyWorkbook,
    TEmptySheet,
    IEntityFieldListItem,
    IImportEntitySheetResponse,
    IValidateInputResponse,
}

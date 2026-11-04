import { Key } from "rc-tree/lib/interface";
import * as XLSX from "xlsx";
import { IBasicGridColDef } from "../../../../shared/allinterface/tablegrid/IBasicGrid";


type TWorksheetRow = Record<string, string | number | boolean>;
type TWorksheetColumn = IBasicGridColDef & { field: string };
type TWorksheetSheet = {
    sheetName: string;
    column: TWorksheetColumn[];
    rowData: TWorksheetRow[];
    checkboxSelected: boolean;
    isError: number;
};
type TWorkbookState = XLSX.WorkBook | null;


interface ISelectAndValidateCableWorksheet {
    uniqueName: string
    headerText: string //for show header
    treeData: any; // treedata for export
    updateOnly: boolean; // updateOnly
    halfCheckedNodeKeys: Key[]; // half check key of nodes
    checkedNodeKeys: Key[]; // checked key of export tree
    featureId: string; // featureId for condition
    selectedNodeInfo?: any; // select node data
    explorerTreeData?: any; // exprorer tree data
    handleClearSelection?: () => void //Callback function to clear selection
}

export type { ISelectAndValidateCableWorksheet, TWorksheetSheet, TWorksheetColumn, TWorkbookState, TWorksheetRow }
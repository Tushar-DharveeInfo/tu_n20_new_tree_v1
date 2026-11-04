import { Key } from "rc-tree/lib/interface";
import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
interface IValidWorksheetList {
    sheetName: string;
    column: Record<string, string | number | boolean>[];       // you can refine this if you know structure
    rowData: Record<string, string | number | boolean>[];      // same here
    checkboxSelected: boolean;
    isError: boolean | number;
    ErrorType?: string | number | boolean
}
interface IImportEntitiesWorkSheet {
    uniqueName: string
    headerText: string //for show header
    treeData: ITreeNode[]; // treedata for export
    updateOnly: boolean; // updateOnly
    halfCheckedNodeKeys: Key[]; // half check key of nodes
    checkedNodeKeys: Key[]; // checked key of export tree
    featureId: string; // featureId for condition
    selectedNodeInfo?: ISelectedNodeInfo; // select node data
    selectedFeatureItem?: IMenuItem
    handleClickisAuthorized?: (event: any, actionCode?: string, payload?: any) => void;//Callback function to handle Item select
    handleClearSelection?: () => void; //Callback function to clear selection
}
export type { IImportEntitiesWorkSheet, IValidWorksheetList }
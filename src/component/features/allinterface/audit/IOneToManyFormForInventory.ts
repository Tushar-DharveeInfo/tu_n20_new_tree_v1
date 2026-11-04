
import { ChangedValueMap, IFormElements } from "@n20a/libform";
import { IActionImageForSubMenu } from "../../../shared/allinterface/basic/IActionImageList";
import { ICellRendererParams } from "ag-grid-community";
import { IBasicGridColDef } from "../../../shared/allinterface/tablegrid/IBasicGrid";

interface IOneToManyFormForInventory {
    uniqueName: string;
    featureId: string;
    hideAddForm: boolean;
    gridData: Record<string, any>[];
    gridColumns: IBasicGridColDef[];
    containerName: string;
    renderedFormElements?: IFormElements;
    allowEdit?: boolean;
    allowDelete?: boolean;
    allowColumnFilter?: boolean;
    handleNodeMenuOnClick?: (value: IActionImageForSubMenu, selectedRow: any, instanceName: string) => void // node menu click
    handleControlValueChange?: (changedValue: ChangedValueMap) => boolean;
    handleDeleteRecord?: (value?: ICellRendererParams<any, any, any> | undefined) => void;
    handleValueChange?: (values: Record<string, unknown>) => void;
    handleEditRecord?: (value?: ICellRendererParams) => void;
}

export type { IOneToManyFormForInventory }
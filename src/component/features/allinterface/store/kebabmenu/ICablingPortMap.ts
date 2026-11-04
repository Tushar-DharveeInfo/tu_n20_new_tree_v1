import { ISelectedNodeInfo } from "../../../../shared/allinterface/tree/ITreeControl";
import { IBasicGrid, IBasicGridColDef } from "../../../../shared/allinterface/tablegrid/IBasicGrid";

export interface ICablingPortMap extends IBasicGrid {
    columnDefs?: IBasicGridColDef[]; // column defs for grid
    rowData: any[]; // rowdata for grid
    hidePaneTitles?: any // pane title array
    allowHidePane?: boolean; // allow to hide show pane
    paneName?: string;//pane name
    allowShowPane?: boolean// show pane base on flag
    isReadOnly?: boolean; // read only
    featureId?: string; // feature id
    rt_mouse_action_tree?: any//selected right mouse menu on grid.
    selectedNodeInfo: ISelectedNodeInfo//selected node

    handleCloseOpenPane?: (paneName?: string, status?: string, headerTitle?: string) => void
}
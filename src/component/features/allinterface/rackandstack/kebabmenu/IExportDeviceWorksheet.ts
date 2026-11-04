import { Key } from "rc-tree/lib/interface";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
import { IBasicGridColDef } from "../../../../shared/allinterface/tablegrid/IBasicGrid";

interface IExportDeviceWorksheet {
    uniqueName: string;
    treeData: ITreeNode[];
    excludeRecID: boolean;
    halfCheckedNodeKeys: Key[] | undefined;
    selectedNodeInfo: ISelectedNodeInfo;
    checkedNodeKeys: Key[] | undefined;
    featureId: string;
}

interface IExportDeviceColumnArrayItem {
    ColumnName: string;
    Description?: string;
    IsRequired?: boolean;
    IsDistinct?: boolean;
}

interface IExportDeviceEntityRecordsExportItem {
    tableName: string;
    jsonData: string;
    columnArray: string;
}

interface IExportDeviceGridColumnDef extends IBasicGridColDef {
    autoSize?: boolean;
}

interface IExportDeviceSelectedSheetState {
    tableName?: string | null;
    TableLabel?: string;
    column?: IExportDeviceGridColumnDef[];
    rowData?: Record<string, unknown>[];
}

interface IExportDeviceFileProfileRecord {
    FileCategory?: string;
    FileUID?: string;
    FileExtension?: string;
    DocName?: string;
}

interface IExportDeviceFileStreamResponse {
    fileBlob?: string;
}

export type {
    IExportDeviceWorksheet,
    IExportDeviceColumnArrayItem,
    IExportDeviceEntityRecordsExportItem,
    IExportDeviceGridColumnDef,
    IExportDeviceSelectedSheetState,
    IExportDeviceFileProfileRecord,
    IExportDeviceFileStreamResponse,
};

import { Key } from "rc-tree/lib/interface";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
import { IBasicGridColDef } from "../../../../shared/allinterface/tablegrid/IBasicGrid";

interface IExportCableWorksheet {
    treeData: ITreeNode[];
    excludeRecID: boolean;
    halfCheckedNodeKeys: Key[] | undefined;
    selectedNodeInfo: ISelectedNodeInfo;
    checkedNodeKeys: Key[] | undefined;
    featureId: string;
}

interface IExportCableColumnArrayItem {
    ColumnName: string;
    Description?: string;
    IsRequired?: boolean;
    IsDistinct?: boolean;
}

interface IExportCableEntityRecordsExportItem {
    tableName: string;
    jsonData: string;
    columnArray: string;
}

interface IExportCableGridColumnDef extends IBasicGridColDef {
    autoSize?: boolean;
}

interface IExportCableSelectedSheetState {
    tableName?: string | null;
    TableLabel?: string;
    column?: IExportCableGridColumnDef[];
    rowData?: Record<string, unknown>[];
}

interface IExportCableFileProfileRecord {
    FileCategory?: string;
    FileUID?: string;
    FileExtension?: string;
    DocName?: string;
}

interface IExportCableFileStreamResponse {
    fileBlob?: string;
}

export type {
    IExportCableWorksheet,
    IExportCableColumnArrayItem,
    IExportCableEntityRecordsExportItem,
    IExportCableGridColumnDef,
    IExportCableSelectedSheetState,
    IExportCableFileProfileRecord,
    IExportCableFileStreamResponse,
};


import { ChangedValueMap } from "@n20a/libform";
import { ITreeNode } from "../tree/ITreeControl";
import { IActionImageForSubMenu } from "../basic/IActionImageList";

interface IOneToManyFormContainer {
    uniqueName: string;
    tableDefinition: Record<string, any>;
    selectedNode?: ITreeNode;
    tableData?: Record<string, any>[];
    isAllowCustomHeader?: boolean;
    updatedProfile?: Record<string, any>;
    containerName?: string;
    featureId?: string;
    hideAddForm?: boolean;
    isReadOnly?: boolean;
    handleNodeMenuOnClick?: (value: IActionImageForSubMenu, selectedRow: any, instanceName: string) => void // node menu click
    handleControlValueChange?: (changedValue: ChangedValueMap) => boolean;
    handleSaveOneToManyRecords?: (updatedRecords: Record<string, any>, tableName?: string) => Promise<Record<string, any>[]> | void;
}

export type { IOneToManyFormContainer }
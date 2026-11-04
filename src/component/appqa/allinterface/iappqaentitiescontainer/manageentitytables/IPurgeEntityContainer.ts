
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";

interface IPurgeEntityContainer {
    uniqueName: string; // A unique name used for generating unique keys and identifiers
    checkedKeys: {
        checked: Key[];
        halfChecked: Key[];
    } | undefined,
    defulatSelectedKey: Key | undefined;
    treeData: ITreeNode[];
    featureId: string;
    handleClearSelection?: () => void
}

export type { IPurgeEntityContainer }
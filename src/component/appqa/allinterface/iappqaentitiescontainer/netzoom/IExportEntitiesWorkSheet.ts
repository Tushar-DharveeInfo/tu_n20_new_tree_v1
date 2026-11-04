import { Key } from "rc-tree/lib/interface";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";


interface IExportEntitiesWorkSheet {
    uniqueName: string;
    excludeRecID: boolean; // excludeRecid
    halfCheckedNodeKeys: Key[]; // half check key of nodes
    selectedNodeInfo: ISelectedNodeInfo; // select node data
    checkedNodeKeys: Key[]; // checked key of export tree
    featureId: string; // featureId for condition
    treeData?: ITreeNode[]; // treedata for export
}

export type { IExportEntitiesWorkSheet }
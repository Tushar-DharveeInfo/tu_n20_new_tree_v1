import { ISelectGroupItem } from "@n20a/libform";
import { ITreeNode } from "../tree/ITreeControl";

interface IAssign {
    uniqueName: string; // A unique identifier for the dc property
    featureId: string;
    selectedNode: ITreeNode;
    treeData: ITreeNode[];
    assignmentType: 'tag' | 'team' | 'tenant' | 'vendor';
    isReadOnly?: boolean;
}

type AssignmentItem = ISelectGroupItem & {
    groupName: string;
    partnerEntID: string;
    partnerEntityName: string;
    recID?: string;
}


export type { IAssign, AssignmentItem }
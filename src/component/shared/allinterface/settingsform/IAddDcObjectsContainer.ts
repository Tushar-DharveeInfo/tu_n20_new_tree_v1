
import { ITreeNode } from "../tree/ITreeControl";

interface IAddDcObjectsContainer {
    uniqueName: string;
    entityToAdd: string;
    selectedNode?: ITreeNode;
    pgTableToAdd?: string;
    parentNodes?: ITreeNode[];
    allowBackButton?: boolean;
    allowCloseButton?: boolean;
    allowCustomHeader?: boolean;
    allowLog?: boolean;
    treeData?: ITreeNode[];
    featureId?: string;
    handleRefreshForNewRecord?: (newAddedId: string, newAddedName: string, action?: 'save' | 'back' | 'close') => void;
}

export type { IAddDcObjectsContainer }
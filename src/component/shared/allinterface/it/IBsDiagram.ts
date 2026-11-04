
import { ITreeNode } from "../tree/ITreeControl";

interface IBsDiagram {
    uniqueName: string;
    selectedNode: ITreeNode;
    headerText?: string;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
    onRendered?: () => void;
}


export type { IBsDiagram }
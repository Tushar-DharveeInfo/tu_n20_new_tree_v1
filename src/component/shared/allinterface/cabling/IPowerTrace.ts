
import { ISelectedNodeInfo } from "../tree/ITreeControl";

interface IPowerTrace {
    featureId: string;
    uniqueName: string;
    hideHelpTip?: boolean
    selectedNode?: ISelectedNodeInfo
    ApiData?: any;
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
    onRendered?: () => void;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IPowerTrace }

import { ISelectedNodeInfo } from "../tree/ITreeControl";

interface INetworkTrace {
    uniqueName: string;
    featureId: string;
    hideHelpTip?: boolean;
    selectedNode?: ISelectedNodeInfo;
    ApiData?: any;
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
    onRendered?: () => void;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { INetworkTrace }

import { ISelectedNodeInfo, ITreeNode } from "../tree/ITreeControl"

interface IPlacementExplorer {
    uniqueName: string
    selectedNodeInfo: ISelectedNodeInfo;
    featureId: string;
    hideSidebarBtn?: boolean;
    selectedNodeExplorer: ISelectedNodeInfo
    treeData?: ITreeNode[]
    handleShowUserMessage?: (messageText: string) => void;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
}
interface IPlacementOverlayPayload {
    NodeEntID?: string;
    NodeEntityname?: string;
    WorkorderProfile?: string;
    NodePath?: string;
    [key: string]: string | undefined;
}

interface IWorkorderProfileResponse {
    workorderProfile?: Array<{ _WorkorderProfile?: string }>;
}
interface IInboundLocation {
    Site: string;
    Room: string;
    Floor: string;
    Location: string;
    Rack: string;
    Mounttype?: string | null;
    RUPos?: number | string | null;
    /** Every RU occupied by this placement, e.g. "RU 3, RU 4, RU 5". */
    RuPos?: string;
    WorkorderProfile?: string | null;
    EntID: string;   // GUID
    RecID: string;   // GUID
    RackEntId?: string;

}

type IinboundLocation = IInboundLocation;

export type { IPlacementExplorer, IInboundLocation, IinboundLocation, IPlacementOverlayPayload, IWorkorderProfileResponse }
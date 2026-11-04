import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IDcmClient {
    action: string;
    user: string;
    psw: string;
    account?: number;
    domain?: string;
    iFrameSrc: string;

    site?: string;
    room?: string;
    location?: string;
    rack?: string;
    entid?: string;//device entid
    dcmid?: string;
}
interface IDcmConsole {
    uniqueName: string;
    selectedNode?: ITreeNode;
    treeData?: ITreeNode[];
    tabIndex?: string
    isShowSidebarBtn?: boolean;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
}
export type { IDcmConsole, IDcmClient }
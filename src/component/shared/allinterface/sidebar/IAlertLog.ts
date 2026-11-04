
import { ITreeNode } from "../tree/ITreeControl";

interface IAlertLog {
    uniqueName: string;
    headerText?: string;
    selectedNode?: ITreeNode;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IAlertLog }
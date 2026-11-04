import { ITreeNode } from "../tree/ITreeControl";

interface IRowOfRacksContainer {
    uniqueName: string;
    featureId: string;
    selectedNode: ITreeNode;
    handleShowUserMessage?: (messageText: string) => void;
    onRendered?: () => void;
}

export type { IRowOfRacksContainer }
import { ITreeNode } from "./tree/ITreeControl";

type TReportLayoutJson = Record<string, unknown>;

interface IGeneratePdf {
    uniqueName: string;
    isOpen: boolean;
    container?: HTMLElement;
    featureId?: string;
    selectedNode?: ITreeNode;
    reportJson?: TReportLayoutJson | null;
    onClose: () => void;
    title?: string;
}

export type { IGeneratePdf, TReportLayoutJson };


import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";

interface IDashboardChartsContainer {
    uniqueName: string; // Unique name for the container instance
    featureId: string; // Unique identifier for the feature being represented
    headerText: string;
    showPopupQa?: boolean;
    selectedNode?: ITreeNode;
    purpose?: string;
    handleShowUserMessage?: (messageText: string) => void;

}

export type { IDashboardChartsContainer }
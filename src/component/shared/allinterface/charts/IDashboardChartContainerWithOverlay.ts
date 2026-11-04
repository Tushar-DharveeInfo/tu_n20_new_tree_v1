import { ITreeNode } from "../tree/ITreeControl";

interface IDashboardChartContainerWithOverlay {
    uniqueName: string
    featureId: string;
    selectedNode: ITreeNode;
    hideHeader?: boolean
    title?: string;
    displayPerRow?: number
    outputFormat: "data" | "jsx" | 'png' | 'svg'
    isDashboard?: boolean // by default true, if it is false then it will not consider as dashboard chart
    parentClassName?: string
    purpose?: string
    SaveAsDataset?: (data: any) => void // this function return data set of chart
    handleChartImage?: (data: any) => void // this function return svg and png data of chart
    handleFinishApiCall?: () => void // this function return true when api call finish
    isSidebarOpen?: boolean;
    hideSideBarCloseBtn?: boolean
    handleViewClick?: (entID: string) => void
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
    handleShowUserMessage?: (messageText: string) => void;
}
type IDashbordChartContainerWithOvelay = IDashboardChartContainerWithOverlay;
export type { IDashboardChartContainerWithOverlay, IDashbordChartContainerWithOvelay }
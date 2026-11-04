import { IChartProfileItem } from "../../context/allinterface/IChartProfile";
import { ITreeNode } from "../tree/ITreeControl";
interface IChartOptions {
    data?: unknown[];
    series?: Record<string, unknown>[];
    splitBy?: string;
    title?: unknown;
    subtitle?: unknown;
    legend?: Record<string, unknown>;
    titleFontSize?: number;
    subtitleFontSize?: number;
    legendFontSize?: number;
    labelFontSize?: number;
    labelColor?: string;
    axisLabelFontSize?: number;
    axisTitleFontSize?: number;
    beginAtZero?: boolean;
}

interface IChartDataSetItem {
    CPName?: string;
    ChartData?: { Data?: unknown[] };
}

interface IChartDataPayload {
    ChartDataSet?: IChartDataSetItem[];
}

type TChartRecord = Record<string, unknown>;
/** Chart profile row after API data is merged onto the profile record. */
type TChartProfileRow = IChartProfileItem & {
    ChartData?: unknown;
    Name?: string;
    CPName?: string;
};
type TSeriesRecord = Record<string, unknown>;

interface IDashboardChart {
    uniqueName: string
    featureId: string;
    outputFormat: "data" | "jsx" | 'png' | 'svg'
    hideHeader?: boolean
    displayPerRow?: number
    title?: string;
    isDashboard?: boolean // by default true, if it is false then it will not consider as dashboard chart
    selectedNode?: ITreeNode;
    parentClassName?: string
    purpose?: string;
    SaveAsDataset?: (data: any) => void // this function return data set of chart
    handleChartImage?: (data: any) => void // this function return svg and png data of chart
    handleFinishApiCall?: () => void // this function return true when api call finish
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IDashboardChart, IChartOptions, IChartDataSetItem, IChartDataPayload, TChartRecord, TChartProfileRow, TSeriesRecord }
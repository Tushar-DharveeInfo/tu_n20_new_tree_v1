


interface IChartProfileItem {
    Enabled: boolean;
    GroupName: string;
    _ChartProfile: string;
    Description: string;
    Purpose: string;
    SortOrder: number | null;
    ChartOptions: string;   // JSON string, not parsed yet
    ChartType: string;
    ChartDatasetAPI: string;
    EntityNames: string | null;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    EntityName: string;
}

interface IChartProfile {
    ChartProfiles: IChartProfileItem[];
    setChartProfiles: (ChartProfiles: IChartProfileItem[]) => void;
}

export type { IChartProfileItem, IChartProfile }
import { IStatusBar } from "./IStatusBar";

interface IReportProfileItem {
    _ReportProfile: string;
    Description: string;
    EntityNames: string;
    [key: string]: string | number | boolean | any
}
interface IReport {
    reportProfiles: IReportProfileItem[];
    setReportProfiles: (reportProfiles: IReportProfileItem[]) => void;
    fetchReportProfile: (reCall?: boolean, statusBarContext?: IStatusBar) => void
}

export type { IReport, IReportProfileItem }
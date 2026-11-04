
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";

interface IBackgroundTasks {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    featureData: IMenuItem[];
    handleOpenTaskCount?: (openTasks: number) => void;
    savedFilter?: string;
    handleFilterChange?: (filter: string) => void;
}
interface IBackgroundTasksContainer {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    featureData: IMenuItem[];
    interval: number;
    handleOpenTaskCount?: (openTasks: number) => void;
    savedFilter?: string;
    handleFilterChange?: (filter: string) => void;
}
interface IOpenSessions {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    featureData: IMenuItem[];
    handleOpenSessionCount?: (openSessions: number) => void;
    savedFilter?: string;
    handleFilterChange?: (filter: string) => void;
}
interface IWindowsServices {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    featureData: IMenuItem[];
    handleWindowsServiceCount?: (windowsServices: number) => void;
    savedFilter?: string;
    handleFilterChange?: (filter: string) => void;
}
interface ISqlJobs {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    featureData: IMenuItem[];
    handleSqlJobCount?: (sqlJobs: number) => void;
    savedFilter?: string;
    handleFilterChange?: (filter: string) => void;
}
interface IAppqaTask {
    uniqueName: string;//unique identifier for the control
    allowShowHeader: boolean;// whether allow show header
    headerText: string;// Header to show
    featureData: IMenuItem[];
    featureId: string;
    selectedAppQAData?: IMenuItem;

    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
}

export type { IAppqaTask, IBackgroundTasks, IOpenSessions, IWindowsServices, ISqlJobs, IBackgroundTasksContainer }
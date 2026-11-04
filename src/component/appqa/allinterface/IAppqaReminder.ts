
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";

interface IAppqaReminder {
    uniqueName: string;//unique identifier for the control
    allowShowHeader: boolean;// whether allow show header
    headerText: string;// Header to show
    featureData: IMenuItem[];// feature data
    featureId: string;
    selectedAppQAData: any;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IAppqaReminder }
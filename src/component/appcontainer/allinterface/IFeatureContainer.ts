import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";

interface IFeatureContainer {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    allowShowHeader: boolean;
    appqaId?: string;
    headerText?: string;
    selectedFeatureData?: IMenuItem;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
}
export type { IFeatureContainer }
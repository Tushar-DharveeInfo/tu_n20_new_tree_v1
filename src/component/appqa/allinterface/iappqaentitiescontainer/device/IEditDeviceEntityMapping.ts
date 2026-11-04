import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";

interface IEditDeviceEntityMapping {
    uniqueName: string; // Unique identifier for the TreeControl component
    featureId: string;// featureId that will be handled 
    group: string;
    subGroup: string;
    isRefresh?: boolean;
    helptipString?: string;
    selectedFeatureItem?: IMenuItem
}
export type { IEditDeviceEntityMapping }

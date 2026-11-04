import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";

interface IEditNetZoomEntityMapping {
    uniqueName: string; // Unique identifier for the TreeControl component
    featureId: string;// featureId that will be handled  
    group: string;
    subGroup: string;
    helptipString?: string;
    selectedFeatureItem?: IMenuItem
}

export type { IEditNetZoomEntityMapping }
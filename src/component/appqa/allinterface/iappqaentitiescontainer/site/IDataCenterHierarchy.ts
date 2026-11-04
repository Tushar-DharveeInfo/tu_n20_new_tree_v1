
import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";

// This interface will be used in the data Center Hierarchy Tree component
interface IDataCenterHierarchy {
    uniqueName: string; //uniqueName for the control and required
    selectedFeatureItem: IMenuItem;// selected feature item from settings menu
    featureId: string; //selected feature id
    handleShowUserMessage?: (messageText: string) => void;
}
export type { IDataCenterHierarchy };

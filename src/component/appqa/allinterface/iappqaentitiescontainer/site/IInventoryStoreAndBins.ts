
import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";

// This interface will be used in the data Center Hierarchy Tree component
interface IInventoryStoreAndBins {
  uniqueName: string; //uniqueName for the control and required
  selectedFeatureItem: IMenuItem// selected explorer node to get right mouse menus
  featureId: string; //selected feature id
  handleShowUserMessage?: (messageText: string) => void;
}
export type { IInventoryStoreAndBins }

import { IMenuItem } from "../../../shared/allinterface/menu/IMainMenu";

interface IAppqaEntitiesContainer {
    uniqueName: string;// unique identifier for the controls
    selectedFeatureItem: IMenuItem;// selected node from exporer pane
    featureId: string;// selected feature id
}

export type { IAppqaEntitiesContainer }
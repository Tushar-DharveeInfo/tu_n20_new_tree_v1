import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";

interface IDataCenterInterconnect {
    uniqueName: string// unique identifier for the control
    featureId: string// feature id
    selectedFeatureItem: IMenuItem;// selected feature item from settings menu
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IDataCenterInterconnect }
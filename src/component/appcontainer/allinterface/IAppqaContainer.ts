
import { IFeatureItem } from "../../shared/context/allinterface/IMainApp";
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";
import { IFeatureContainer } from "./IFeatureContainer";

interface IAppqaContainer {
    allowAppQaToRender: boolean;
    featureContainerProps: IFeatureContainer;
    featureRecords: IFeatureItem[];
    selectedFeatureNameForHelp?: string;
    handleSelectedMenuItem: (selectedMenuItem: IMenuItem) => void;
    handleShowUserMessage: (messageText: string, container?: HTMLDivElement) => void;
}


export type { IAppqaContainer }
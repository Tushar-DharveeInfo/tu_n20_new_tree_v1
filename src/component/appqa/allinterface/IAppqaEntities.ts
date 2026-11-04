
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";

interface IAppqaEntities {
    uniqueName: string;// unique identifier for the control
    allowShowHeader: boolean;// if tru header will show 
    headerText: string;// header will text to be shown
    selectedAppQAData: IMenuItem;
    featureId: string;
    selectedMenuData?: IMenuItem;
    handleSelectedMenuItem?: (selectedMenuItem: IMenuItem) => void
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IAppqaEntities }
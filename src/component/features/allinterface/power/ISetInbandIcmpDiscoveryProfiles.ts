
import { IActionLabelItem } from "../../../shared/allinterface/basic/IActionLabelItem";
import { IControl } from "../../../shared/allinterface/settingsform/ISettingsLibForm";
import { IMenuItem } from "../../../shared/allinterface/menu/IMainMenu";

interface ISetInbandIcmpDiscoveryProfiles {
    uniqueName: string;// unique identifier for the control 
    group: string; // groupName Of selected subGroup name
    subGroup: string; // subgroup name from selected node
    selectedFeatureItem: IMenuItem;// selected node properties 
    featureId: string;// selected feature id if required
    formControls: IControl[];// form controls to render form
    profileItems: IActionLabelItem[]; // profile Items if available else pass empty array
    allowActionList: boolean;// allow action list to show or not 
    selectedProfileItem?: IActionLabelItem;
    allowAdd?: boolean;// allow add button or not
    allowDelete?: boolean;// allow delete or not
    isAutoSave?: boolean;// whether to allow auto save 
    profileString?: string;// profile string in case of edit mode if action list pane is not show
    id?: string;// if in edit mode without action list pane 
    entityName?: string;// entity name if needed
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean | undefined) => void;//if isAutoSave is true then it will be used to get updated data
    handleSaveAction?: (profileData: string, id?: string | undefined) => void;// This will be called if allowActionList===false 
    handleActionImageClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void;// To handle button click 
}
export type { ISetInbandIcmpDiscoveryProfiles }
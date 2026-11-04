import { IActionLabelItem } from "../../allinterface/basic/IActionLabelItem";
import { IControl } from "../../allinterface/settingsform/ISettingsLibForm";

export interface IAppqaSettingsVar {
    selectedProfileItem: IActionLabelItem | null;
    setSelectedProfileItem: (item: IActionLabelItem | null) => void;
    formControls: IControl[];
    setFormControls: (formControls: IControl[]) => void;
    jsonStringForViewer?: string;
    setJsonStringForViewer: (jsonStringForViewer?: string) => void;
    isFormValid?: boolean;
    setIsFormValid: (isFormValid?: boolean) => void;
}

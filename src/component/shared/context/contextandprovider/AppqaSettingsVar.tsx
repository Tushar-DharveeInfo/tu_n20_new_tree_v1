
import { createContext, useMemo, useState } from "react";
import { IActionLabelItem } from "../../allinterface/basic/IActionLabelItem";
import { IAppqaSettingsVar } from "../allinterface/IAppqaSettingsVar";
import { IControl } from "../../allinterface/settingsform/ISettingsLibForm";

// Create a context with default values
const AppqaSettingsVarContext = createContext<IAppqaSettingsVar | undefined>(undefined);

function AppqaSettingsProvider(props: { children: React.ReactNode }) {
    const [selectedProfileItem, setSelectedProfileItem] = useState<IActionLabelItem | null>(null);
    const [formControls, setFormControls] = useState<IControl[]>([]);
    const [jsonStringForViewer, setJsonStringForViewer] = useState<string>();
    const [isFormValid, setIsFormValid] = useState<boolean>();
    const providers: IAppqaSettingsVar = useMemo(() => ({
        selectedProfileItem,
        setSelectedProfileItem,
        formControls,
        setFormControls,
        jsonStringForViewer,
        setJsonStringForViewer,
        isFormValid,
        setIsFormValid
    }), [selectedProfileItem, formControls, jsonStringForViewer, isFormValid]);

    return (
        <AppqaSettingsVarContext.Provider value={providers}>
            {props.children}
        </AppqaSettingsVarContext.Provider>
    );
}

export { AppqaSettingsVarContext, AppqaSettingsProvider };

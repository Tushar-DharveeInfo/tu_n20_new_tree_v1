
import { useContext } from "react";
import { AppqaSettingsVarContext } from "../contextandprovider/AppqaSettingsVar";

const useAppqaSettingsVarContext = () => useContext(AppqaSettingsVarContext);

export { useAppqaSettingsVarContext }
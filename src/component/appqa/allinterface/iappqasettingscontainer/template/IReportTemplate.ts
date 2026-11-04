
import { IControl } from "../../../../shared/allinterface/settingsform/ISettingsLibForm"

interface IReportTemplate {
    uniqueName: string; // Unique identifier for the form container
    selectedGroup: string;// group name from seelcted node in settings tree
    selectedSubGroup: string;// subgroup name from seelcted node in settings tree
    featureId: string;// feature id for conditions 
    formControls: IControl[];// form controls
    apiData: unknown;// api data to render tree
}
export type { IReportTemplate }
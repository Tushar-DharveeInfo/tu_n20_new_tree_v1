
import { Key } from "rc-tree/lib/interface";
import { CheckInfo } from "rc-tree/lib/Tree";
import { IControl } from "../settingsform/ISettingsLibForm";
import { ITreeNode } from "../tree/ITreeControl";

interface IFilterFormContainer {
    uniqueName: string; // A unique identifier for the FilterFormContainer
    allowHeader: boolean; // Whether to display the header
    controls: IControl[]; // Array of form controls to render
    allowFilterTree: boolean; // Whether to display Filter tree 
    featureId?: string;
    headerText?: string; // Text for the header label
    customValue?: string;// for custom filter when controls is not passed
    isFilterChange?: boolean;
    iconToShow?: "filter" | "select";
    controlValues?: IDCFilterControlValues | unknown;
    handleActionImageClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void;
    handleFilterFormChange?: (value: string, name: string, id?: string) => void;
    handleNodeCheck?: (checked: { checked: Key[]; halfChecked: Key[] }, info: CheckInfo<ITreeNode>) => void; // callback for the node check in tree
}
interface IDCFilterControlValues {
    tenant?: string;
    team?: string;
    tag?: string;
    vendor?: string;
    tenantID?: string;
    teamID?: string;
    tagID?: string;
    vendorID?: string;
}
export type { IFilterFormContainer, IDCFilterControlValues }
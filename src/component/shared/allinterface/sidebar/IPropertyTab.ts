import { IView } from "../../deviceview/allinterface/IView";

/** Raw property field parsed from a Properties JSON string. */
interface IRawPropertyField {
    PName: string;
    PropertyValue: string | number;
    PropertyDescription: string;
    PropertyLabel: string;
}

/** Row displayed in a property grid section. */
interface IPropertyTableRow {
    Name: string;
    Value: string | number;
    Description: string;
    PropertyLabel: string;
    DisplayControl: string;
    Desc?: string;
}

/** Property table section (group) from transformDeviceData or API. */
interface IPropertyGroup {
    TableName?: string;
    TableLabel?: string;
    Description?: string;
    Properties?: string;
    tableData?: IPropertyTableRow[];
}

/** Property payload: group array; may include pre-built DescriptionObj sections. */
type IPropertyTabInput = IPropertyGroup[] & { DescriptionObj?: IPropertyGroup[] };

/** Props for the DeviceModel Property tab (grid + device view). */
interface IPropertyTab {
    uniqueName: string;
    /** Device property groups from API or transformDeviceData. */
    propertyData: IPropertyTabInput;
    featureId: string;
    selectedRadio?: string;
    views?: IView[];
    selectedTabName?: string;
}

export type {
    IPropertyTab,
    IRawPropertyField,
    IPropertyTableRow,
    IPropertyGroup,
    IPropertyTabInput,
};

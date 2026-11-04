import { IControl } from "../../allinterface/settingsform/ISettingsLibForm";
import { IEmItem } from "../../context/allinterface/IMainApp";


type EmItemTyped = {
    RecID: string;
    EntID: string;
    IsNZ: boolean;

    TableName: string;
    PName: string;
    PropertyLabel: string;
    Description: string;
    DataType: string;
    MaxLength: number;
    AvgLength: number;
    SortOrder: number;

    RequiredToAddRecord: boolean;
    RequiredToUpdateRecord: boolean;
    RO: boolean;
    ImportOnly: boolean;
    NullNotAllowed: boolean;

    DefaultValue: string;
    InputMask: string | null;
    RegEx: string | null;
    DisplayControl: string;
    ChangeEvent: string;
    LastUpdated: string;
};


const FnMapTableToFormControl = (
    tableFields: IEmItem[],
    entityName: string,
    displayGroupName: string
): IControl[] => {

    return tableFields.map((raw) => {
        const item = raw as unknown as EmItemTyped;
        const isRequired =
            item.RequiredToAddRecord ||
                item.RequiredToUpdateRecord ||
                item.NullNotAllowed
                ? 1
                : 0;

        const isReadOnly =
            item.RO ||
            item.ImportOnly ||
            item.DisplayControl === "TextControl";

        const value = item.DefaultValue ?? "";

        return {
            RecID: item.RecID,
            EntID: item.EntID,
            EntityName: entityName,
            Name: item.PName,
            _AP: item.PName,

            PropertyLabel: item.PropertyLabel || item.PName,
            NameDesc: item.Description || "",

            GroupName: entityName,
            GroupNameDesc: entityName,
            SubGroupName: "",
            SubGroupNameDesc: "",
            SubGroupEntID: "",

            DefaultAPValue: value,
            Value: value,
            OldValue: value,
            ValueDesc: "",

            InputMask: item.InputMask,
            RegEx: item.RegEx,
            MaxInstances: 1,

            IsRequired: isRequired,
            CanChange: isReadOnly ? 0 : 1,

            DisplayControl: item.DisplayControl,
            DisplayGroupControl: displayGroupName,
            SortOrder: item.SortOrder ?? 0,

            IsReadOnly: isReadOnly,
            disabled: false,
            Secured: false,
            IsNZ: item.IsNZ,
            IsSaved: false,
            NullNotAllowed: item.NullNotAllowed ?? isRequired,
            ChangeEvent: item.ChangeEvent ?? "",
            LastUpdated: item.LastUpdated,
        };
    });
};

export { FnMapTableToFormControl }
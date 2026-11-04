
interface IOptionItem {
    uniqueName: string;
    label: string;
    disabled?: boolean;
    disableCheck?: boolean;
    [key: string]: string | number | boolean | unknown
}
interface IOptionsFilter {
    showIcon: boolean;
    uniqueName: string;// unique name of component
    container: string;
    options: IOptionItem[];
    allowMultiSelect?: boolean;
    allowHeader?: boolean;
    showSelectColumnIcon?: boolean;
    disableCheck?: boolean;
    disableUncheck?: boolean;
    handleSelect: (value: any, updateData?: IOptionItem[]) => void;
}
export type { IOptionsFilter, IOptionItem }

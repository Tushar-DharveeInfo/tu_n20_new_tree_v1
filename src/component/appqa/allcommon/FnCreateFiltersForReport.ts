
import { IOptionItem } from "../../shared/allinterface/basic/IOptionsFilter";

const FnCreateFiltersForReport = (): IOptionItem[] => [
    { uniqueName: "All", label: "All", value: "0", tooltip: "All" },
    { uniqueName: "Selected Node", label: "Selected Node", value: "0", tooltip: "Selected Node" },
    { uniqueName: "Selected Feature", label: "Selected Feature", value: "0", tooltip: "Selected Feature" }
].map(item => ({
    ...item,
    isRenderAsForm: true,
    isDefault: false,
    disabled: false
}));

const FnActivateOptionForReport = (options: IOptionItem[], name: string) =>
    options.map(opt =>
        opt.uniqueName === name ? { ...opt, value: "1" } : { ...opt, value: "0" }
    );

export { FnCreateFiltersForReport, FnActivateOptionForReport }

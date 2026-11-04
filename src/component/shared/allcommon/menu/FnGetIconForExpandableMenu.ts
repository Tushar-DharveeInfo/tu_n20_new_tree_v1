
import { FnResolveIcons, N } from "./FnResolveIcons";

const expandableAliases = {
    rackandstack24x24: "rackandstack24x24",
    workorder24x24: "workorder24x24",
    settings24x24: "setting24x24",
    changemanagement24x24: "change24x24",
    selectdatacentersite24x24: "alldatacenters24x24",
    rowofracks24x24: "rowofracks24x24",
    applicationsettings24x24: "setting24x24"
};

const FnGetIconForExpandableMenu = FnResolveIcons({
    defaultIcon: N,
    aliases: expandableAliases
});

export { FnGetIconForExpandableMenu }
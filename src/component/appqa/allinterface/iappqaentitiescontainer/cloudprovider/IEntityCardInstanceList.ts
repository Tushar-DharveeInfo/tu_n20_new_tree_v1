import { IDynamicCard } from "../../../../shared/allinterface/basic/IDynamicCard";
import { IImage } from "../../../../shared/allinterface/basic/IImage";
import { IActionLabelItem } from "../../../../shared/allinterface/basic/IActionLabelItem";

interface IEntityCardInstanceList {
    uniqueName: string;
    actionLabelItems: IActionLabelItem[];
    handleSelectListItem: (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => void;
    handleActionButtonClick: (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string,
        payload?: unknown
    ) => void;
    isAddMode?: boolean;
    selectedItem?: IActionLabelItem;
    allowAdd?: boolean;
    allowDelete?: boolean;
    showEditButton?: boolean;
    allowEdit?: boolean;
    disableAdd?: boolean;
    disableDelete?: boolean;
    disableEdit?: boolean;
    tabIndex?: string | number;
    /** Used to pick the default card icon (User, Team, Tenant, etc.). */
    entityName?: string;
    /** Override icon per list item; takes precedence over entityName mapping. */
    getContentImage?: (
        item: IActionLabelItem,
        record: Record<string, unknown>,
        index: number
    ) => IImage | undefined;
    showContentImage?: boolean;
    /** Applied to each DynamicCard (except Content/data/onClick which are built from list items). */
    dynamicCardProps?: Partial<Omit<IDynamicCard, "uniqueName" | "Content" | "data" | "onClick">>;
    hasRequestedData?: boolean;
    isLoading?: boolean;
}

export type { IEntityCardInstanceList };

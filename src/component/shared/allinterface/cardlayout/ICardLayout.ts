import { ReactNode, KeyboardEvent, MouseEvent } from "react";
import { IImage } from "../basic/IImage";
import { IActionImageForSubMenu } from "../basic/IActionImageList";
import { IMenuItem } from "../menu/IMainMenu";

/* Single name/value row rendered inside CardLayout. */
interface ICardLayoutField {
    Name: string;
    Value: string;
    /* Optional custom value renderer (e.g. icon) — takes precedence over Value text. */
    ValueContent?: ReactNode;
    /* Header row slot: 1 = primary (bold, value only); 2+ = "Name: Value" format. */
    Header?: number | boolean;
    /* Optional group key — fields with same Group render in one response-detail row. */
    Group?: string;
    /* Row layout: inline = left gap; space-between = spread across row. */
    Row?: 'space-between' | 'inline';
    /* it will disable the checkbox */
    disabledCheckbox?: boolean;
}

/* Props for CardLayout — wraps DynamicCard with dynamic name/value content. */
interface ICardLayout {
    uniqueName: string;
    /* Row data passed through to DynamicCard. */
    data: unknown;
    /* Name/value rows to render inside the card. */
    fields: ICardLayoutField[];
    /* Show checkbox in the header row next to the header value. */
    showCheckboxInHeader?: boolean;
    checkboxName?: string;
    checkboxValue?: boolean;
    onCheckboxChange?: (checked: boolean) => void;
    featureId?: string;
    ContentImage?: IImage;
    className?: string;
    hideRightMouseMenu?: boolean;
    tabIndex?: number;
    keyboardNavigationOrientation?: 'vertical' | 'horizontal';
    isSelected?: boolean;
    onClick?: (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, data: unknown) => void;
    containerName?: string;
    featureData?: IMenuItem[];
    allowEditButton?: boolean;
    allowDeleteButton?: boolean;
    isEditDisabled?: boolean;
    isDeleteDisabled?: boolean;
    handleMouseForEdit?: (data: unknown) => void;
    handleMouseForDelete?: (data: unknown) => void;
    handleNodeMenuOnClick?: (
        menu: IActionImageForSubMenu,
        selectedRow: unknown,
        containerName: string
    ) => void;
    /** Optional form or custom content rendered below card text fields. */
    renderForm?: ReactNode;
}

export type { ICardLayout, ICardLayoutField };

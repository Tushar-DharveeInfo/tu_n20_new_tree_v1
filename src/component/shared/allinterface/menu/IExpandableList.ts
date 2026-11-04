
import { IMenuItem } from "./IMainMenu";

interface IExpandableList {
    uniqueName: string; //uniqueName for the control and required
    menuData: IMenuItem[]; // menu data of list 
    handleMouseEvent: (event: React.MouseEvent<HTMLDivElement, MouseEvent> | undefined, actionCode: string, selectedMenu: any) => void // handle mouse event for selected menu
    handleMouseLeave: () => void
    selectedFeature?: IMenuItem;//selected feature item
    allowDND?: boolean; // Allow Drag and drop
    hideIcon?: boolean;
    isMenuWithAbsolute?: boolean;
    handleDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleStartDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleEndDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    hideSearchControl?: boolean
}
export type { IExpandableList }
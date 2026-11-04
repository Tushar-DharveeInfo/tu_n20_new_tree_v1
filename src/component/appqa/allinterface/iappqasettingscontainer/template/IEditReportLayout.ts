
import { ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";

interface IEditReportLayout {
    uniqueName: string;
    featureId: string;
    allowEdit: boolean;// whether to allow edit or not 
    subGroupName: string;
    selectedNode: ITreeNode;
    template: "template" | "new";
    mode: "canvas" | "tree";
    isLandScaped?: boolean;
    templateName?: string;
    reportLayoutTemplate?: string;
    handleMouse?: (event: any, actionCode?: string, payload?: any) => void;
    handleMouseDouble?: (event: any, actionCode?: string, payload?: any) => void;
    handleReloadTree?: () => void;
}
interface IBorder {
    borderpx: number;
    bordercolor: string;
    borderstyle?: string;
}
interface IRect {
    update?: boolean;
    parentId?: string;
    id: string;
    type: string;
    name: string;
    description?: string;
    x?: number;
    y?: number;
    w: number;
    h: number;
    rotation?: number;
    background?: 'transparent';
    fillcolor?: string;
    border?: IBorder;
    opacity?: number;
    zIndex?: number;
    ishidden?: boolean;
    isLocked?: boolean;
    isSelected?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    isRotatable?: boolean;
    isCloneable?: boolean;
    isDeletable?: boolean;
    icon?: string;
    errorCode?: string;
    errorMessage?: string;
    align?: 'left' | 'center' | 'right';
    Click?: (entityName?: string, entId?: string) => void;
    ctrlClick?: (entityName?: string, entId?: string) => void;
}



interface ICol {
    id: string; // unique identifier for the column
    colName: string; // name of the column
    colWidth: number; // width of the column in pixels
    colWrap: boolean; // whether the column text should wrap or not
    fontName: string,
    fontSize: number,
    fontStyle: string,
    fontColor: string,
    textAlign: string,
    borderpx?: number; // border width in pixels
    borderstyle?: string; // border style, e.g. solid, dashed, dotted
    bordercolor?: string; // border color, e.g. #000000, rgb(0,0,0), rgba(0,0,0,1)
    custom?: string;// default "" 
}

export type { IEditReportLayout, ICol, IRect }
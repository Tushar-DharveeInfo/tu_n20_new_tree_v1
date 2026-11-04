# Simple actionlabeltabs component

# How to use this component 
- User need to use this component in tabs view 

# Developer: TU

# component:actionlabltabs
# types and interfaces 

export interface IActionLabel {
    uniqueName: string; //Unique name for the control and required
    label: ILabel;
    w: number | string; //Width
    actionCode: string;
    handleMouse: (event: any, actionCode?: string) => void;
    h?: number | string;//if not provided it will take h=w
    align?: "center" | "left" | "right";//Label alignment. Default "center"
    border?: string;
    selected?: boolean;//if true it will be highlighted as selected
}

export interface IActionLabelStrip {
    uniqueName: string; //Unique name for the control and required
    actionLabels: IActionLabel[];
    isVertical: boolean;//Default false and will show Horizontally
    w: number | string;//provide width based on isVertical property
    h: number | string;//provide height based on isVertical property
    bgColor?: string;
    border?: string;
    spacing?:string;
    handleMouse?: (event: any, actionCode?: string) => void;
}

interface labelArray {
  label:string;
  tooltip:string;
  isSuccess?:boolean;
}
export interface IActionLabelTabs {
    labels: labelArray[];
    handleMouse:(actionCode:string)=>void // hendle mouse event for selected tabs
    selectedTabName?:string; // selected tab Name 
  }
  
// This interface will be used in the Label component
export interface ILabel {
    uniqueName: string; //uniqueName for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}

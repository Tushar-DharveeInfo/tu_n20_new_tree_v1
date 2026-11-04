
import React from "react";

interface IResponsiveDeviceView {
    uniqueName: string;//uniqueName for the control and required
    imageSource: string; // image data
    label: string; // display bottom  label
    outputFormat: "JSX" | "SVG" | "PNG"; // output format of the view
    selectedTabName: string;
    tabName: string
    className?: string; // dynamic class name of preview device
    allowZoom?: boolean; // if passed true then allow zoom image else only display image zoom not works.
    selectedNode?: any
    selectedDeviceViewId?: string// selected device view id 
    SaveAsImage?: (dataURL?: string) => void     //hide icon if not provided    
    handleMouse?: (event: React.MouseEvent, actionCode?: string) => void
    handleMouseDoubleClick?: (event: React.MouseEvent, actionCode?: string) => void;//selected action code 
}

export type { IResponsiveDeviceView }

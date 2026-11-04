
import React from "react";
import { IImage } from "../basic/IImage";

interface IDevicePreview {
    uniqueName: string;//uniqueName for the control and required
    image: IImage; // image data
    label: string; // display bottom  label
    className?: string; // dynamic class name of preview device
    allowZoom?: boolean; // if passed true then allow zoom image else only display image zoom not works.
    handleMouse?: (event: React.MouseEvent, actionCode?: string) => void

}

export type { IDevicePreview }

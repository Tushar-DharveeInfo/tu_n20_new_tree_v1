
import React from "react";
import { IView } from "./IView";
import { ITreeNode } from "../tree/ITreeControl";
import { ParentJSON } from "@n20a/libbox3d";
import { IRenderMountedRackProps } from "./IMountedRack";
import { IAvailableRack } from "../plan/IEditFloorLayout";
import { IImage } from "../basic/IImage";

interface IViewImageItem {
    uniqueName: string;
    label: string;
    tabName: string;
    image: IImage;
    className?: string;
}

interface IViewContainer {
    uniqueName: string;//uniqueName for the control and required
    entID: string;//entID for the control
    views: IView[] // views array to show svg and title
    viewType: "device" | "mounted";
    viewLabel: string | undefined;
    SvgParentJSONForThreeD: ParentJSON | undefined;
    featureId: string;
    title?: string// title of the control;
    selectedTabName?: string;//selected Tab name;
    responsive?: boolean;// if passed true then device view will be responsive
    disableZoom?: boolean,//disable zoom in and zoom out
    deviceProps?: any // Basic props of device                  
    capacityProps?: any;//PowerThermal props of device
    tabIndex?: string
    statusProps?: any;//Status props of device 
    selectedNode?: ITreeNode
    selectedDeviceViewId?: string//  entid selected device
    isEncrypted?: boolean;
    hideSignalTabHeader?: boolean,
    hideChartAndAsk?: boolean,
    hideChart?: boolean,
    AvailableSvgViews?: any;
    hideTreeDView?: boolean;
    MountedRackProps?: IRenderMountedRackProps;
    ReckPositions?: IAvailableRack[]
    handleSelectedTabChanges?: (selectedTabName: string, selectedTabData: any) => void;
    handleMouseDoubleClick?: (event: React.MouseEvent, actionCode?: string) => void;//selected action code 
    handleMouse?: (event: React.MouseEvent | null, actionCode?: string) => void;//selected action code 
}



export type { IViewContainer, IViewImageItem }

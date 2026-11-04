
interface IOverlayActionProps {
    isVertical: boolean;           // Display action images vertically or horizontally
    w: string;                     // Width of the entire container
    h?: string;                     // Height of the entire container
    bgColor: string;               // Background color
    border: string;                 // Border style
    menuSize: 'sm' | 'md' | 'lg';  // Menu size
    actionImageW: number;          // Action image width in pixels
    actionImageH: number;          // Action image height in pixels
    imageW: string;                 // Individual image width (CSS value)
    spacing: string;               // Spacing between action images (CSS shorthand)
    isIconVertical: boolean;       // Stack icon and label vertically
    hideLabel: boolean;            // Hide labels
    imageH?: string;                 // Individual image width (CSS value)
}

interface IOverlayIconStrip {
    uniqueName: string;//Unique identifier and required
    children?: React.ReactNode; // Content to overlay
    OverlayActionProps: IOverlayActionProps; // Properties for action images
    OverlayActions: any;
    OverlayItemlistAlignNormal?: boolean; // Align items normally
    KebabMenuActions?: any;
    allowToolbarOnly?: boolean;
    handleSelect: (event: MouseEvent | undefined, actionCode?: string | undefined, payload?: any) => void;
}

export type { IOverlayIconStrip }
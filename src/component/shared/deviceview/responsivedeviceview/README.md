# Responsive device view.

## How to use this component : 
-To use the component create svg deviceview using sara's javascript code.

## Developer: TU

## Packages used for the component 
> 
> npm i react-zoom-pan-pinch


# component:ResponsiveDeviceView
# types and interfaces

 interface IResponsiveDeviceView {
    uniqueName: string;//uniqueName for the control and required
    image: IImage; // image data
    label: string; // display bottom  label
    className?: string; // dynamic class name of preview device
    allowZoom?: boolean; // if passed true then allow zoom image else only display image zoom not works.
    selectedNode?:any
    selectedDeviceViewId?:string// selected device view id 
    handleMouse?:(event: React.MouseEvent, actionCode?: string)=>void
    handleMouseDoubleClick?: (event:React.MouseEvent,actionCode?:string)=>void;//selected action code 
}

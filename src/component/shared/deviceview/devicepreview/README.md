# Simple device preview

## How to use this component : 
-To use the component user need to use device preview.

## Developer: TU

## Packages used for the component 
> 
> npm i react-zoom-pan-pinch


# component:devicepreview
# types and interfaces
  interface IDevicePreview {
    uniqueName: string;//uniqueName for the control and required
    image: IImage; // image data
    label: string; // display bottom  label
    className?: string; // dynamic class name of preview device
    allowZoom?: boolean; // if passed true then allow zoom image else only display image zoom not works.
    handleMouse?:(event: React.MouseEvent, actionCode?: string)=>void

}

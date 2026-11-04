# Export Entities Container that is container for select entity container and export entity worksheet

## How to use this component 
- User need to use this component to create Export entites component.

## Developer: TU

## Packages used for the component 
npm i file-saver
npm i --save-dev @types/file-saver

# component:exportentitiescontainer
# types and interfaces

 interface IExportNetZoomEntityMapping {
    uniqueName: string; //uniqueName for the control and required
    featureId: string;
}
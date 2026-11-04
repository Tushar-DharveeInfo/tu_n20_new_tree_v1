# Simple FloorLayoutContainer comport

# How to use this component
- User need to integrate this component in the container and align as required

# Developer: TU

# Packages used for the component 


# component:FloorLayoutContainer
# types and interfaces


interface IFloorLayoutContainer {
    uniqueName: string;//Unique identifier and required
    handleMouse?: (event: any, actionCode?: string, payload?: any) => void;
    handleMouseDouble?: (event: any, actionCode?: string, payload?: any) => void;  
}

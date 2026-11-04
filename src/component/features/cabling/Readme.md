## Review Power Cabling
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if Node is Device then DeviceViewContainer
    - if node is Device or MountedDevice then CablingGrid and HasPowerPort is rendered in read only mode 

## Edit Power Cabling
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if NodeType is Rack DeviceViewContainer
    - if Node is Device or MountedDevice and HasPowerPort then render CablingGrid that is available in this folder

## Power Trace
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if NodeType is Rack DeviceViewContainer
    - if Node is Device or MountedDevice and HasPowerPort then render PowerTrace that is available in this folder

## Power Navigate
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if NodeType is Rack DeviceViewContainer
    - if Node is Device or MountedDevice and HasPowerPort then render CablingNavigation that is available in this folder

## Review Network Cabling
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if Node is Device then DeviceViewContainer
    - if node is Device or MountedDevice then CablingGrid and HasNetworkPort is rendered in read only mode 

## Edit Network Cabling
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if NodeType is Rack DeviceViewContainer
    - if Node is Device or MountedDevice and HasNetworkPort then render CablingGrid that is available in this folder

## Network Trace
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if NodeType is Rack DeviceViewContainer
    - if Node is Device or MountedDevice and HasNetworkPort then render NetworkTrace that is available in this folder

## Network Navigate
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if NodeType is Rack DeviceViewContainer
    - if Node is Device or MountedDevice and HasNetworkPort then render CablingNavigation that is available in this folder
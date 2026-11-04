## Physical Compute
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location then FloorLayoutContainer that is available in this folder
    - if Node is Device or MountedDevice then DeviceFloorLayoutContainer that is available in this folder
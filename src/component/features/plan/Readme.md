## Edit Floor Layout
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer commonly 
2) Second pane is rendered based on node selection from FeatureContainer>ExplorerContainer>LayoutContainer : 
    - if NodeType is Site or Room then DashboardChartContainerWithOvelay is rendered
    - if NodeType is Floor or Location or Device then EditFloorLayout that is available in this folder

## Asset Placement
1) First pane is rendered using FeatureContainer>ExplorerTreeContainer commonly 
2) Second pane is rendered  using FeatureContainer>ExplorerContainer>DCExplorerContainer
3) Third pane will show data bsed on node selection from First and Second pane tree : 
    - if selected node in First pane has SlotsNeeded > 0 then  PlacementExplorer is rendered that is available in this folder.

## Relocate
1) First pane is rendered using FeatureContainer>PlanTreeContainer commonly 
2) Second pane is rendered  using FeatureContainer>ExplorerContainer>DCExplorerContainer
3) Third pane will show data bsed on node selection from First and Second pane tree : 
    - if selected node in First pane has SlotsNeeded > 0 then  PlacementExplorer is rendered that is available in this folder.

## Transfer
1) First pane is rendered using FeatureContainer>DCExplorerContainer commonly 
2) Second pane is rendered  using FeatureContainer>ExplorerContainer>LayoutContainer>TransferContainer that is available in this folder 

## Delete
1) First pane is rendered using FeatureContainer>PlanTreeContainer commonly 
2) Second pane is rendered  using FeatureContainer>ExplorerContainer>DCExplorerContainer
3) Third pane will show data bsed on node selection from First and Second pane tree : 
    - if selected node in First pane has SlotsNeeded > 0 then  PlacementExplorer is rendered that is available in this folder.

## Inbound Asset Placement
1) First pane is rendered using FeatureContainer>ExplorerTreeContainer commonly 
2) Second pane is rendered  using FeatureContainer>ExplorerContainer>DCExplorerContainer
3) Third pane will show data bsed on node selection from First and Second pane tree : 
    - if selected node is asset device then  PlacementExplorer is rendered that is available in this folder.

## Inbound Assets
1) First pane is rendered using FeatureContainer>ExplorerContainer>DCExplorerContainer
2) Second pane is renderd from FeatureContainer>ExplorerContainer>LayoutContainer>InboundAssetContainer that is available in this folder


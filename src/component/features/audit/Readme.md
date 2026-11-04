
## Audit Session: 
* all UI is handled commonly: 
1) First pane tree for Audit Session is rendered from FeatureContainer>ExplorerTreeContainer 
2) Second pane tree of DC explorere will be rendered from ExplorerContainer>DCExplorerContainer 
3) Third pane will be rendered from LayoutContainer based on selected node from DC or Audit Tree whichever is manually selected 

## Inventory Collection: 
1) First pane tree for Audit Session is rendered from ExplorerContainer>ExplorerTreeContainer 
2) Second pane will be rendered from LayoutContainer>InventoryCollectionContainer that is stored in Feature>Audit folder for selected audit session 

## Inventory Reconciliation: 
1) First pane tree for Audit Session is rendered from ExplorerContainer>ExplorerTreeContainer 
2) Second pane will be rendered from LayoutContainer>InventoryReconciliationContainer that is stored in Feature> folder for selected audit session 
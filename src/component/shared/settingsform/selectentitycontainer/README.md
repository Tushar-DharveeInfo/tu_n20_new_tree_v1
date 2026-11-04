# Select Entity Container that is developed for ImportExport and is rendering tree with checkbox

## How to use this component 
- User need to pass required props and adjust the layout

## Developer: TU

## Packages used for the component 


# component:selectentitycontainer
# types and interfaces

interface ISelectEntityContainer {
  uniqueName: "import-tree" | 'export-tree' | string; //uniqueName for the control and required
  handleCheckNode: (
    checked:
      | {
        checked: Key[];
        halfChecked: Key[];
      }
      | Key[],
    info: CheckInfo<ITreeNode>,
    treeData: ITreeNode[]
  ) => void; // this function returns check tree data
  handleNodeSelect: (selectedKeys: Key[], info: ISelectedNodeInfo) => void; // Event handler for selecting nodes
  handleValueChangeForExcludeRecID?: (value: string) => void;
}
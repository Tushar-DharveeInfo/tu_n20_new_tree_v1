
import { IResultTab } from "../../allinterface/sidebar/IResultTab";
import { TreeForHierarchicalDataContainer } from "../../tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";

const ResultTab = (props: IResultTab) => {
  return (
    <>
      {props.treeData && (
        <TreeForHierarchicalDataContainer
          {...props.treeProps}
          apiData={props.treeData}
          allowMultiple={true}
          allowGenerateTreeData={false}
          allowAPICallOnExpand={true}
          defaultExpandedKeys={props.defaultExpandedKeys}
          defaultSelectedKeys={props.defaultSelectedKeys}
          defaultSelectedNodeInfo={undefined}
          handleNodeSelect={props.handleNodeSelect} // Node select callback   
          handleNodeExpand={props.handleNodeExpand}
          handleNodeClick={(event, node) => { props.handleNodeClick && props.handleNodeClick(event, node, props.treeData) }}
          handleDragEnd={props.handleDragEnd}
          handleDragStart={props.handleDragStart}
          canAllowDragDrop={props.canAllowDragDrop}
        />
      )}

    </>
  )
}
export { ResultTab }
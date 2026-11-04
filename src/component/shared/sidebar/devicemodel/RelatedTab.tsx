
import { IRelatedTab } from "../../allinterface/sidebar/IRelatedTab";
import { TreeForHierarchicalDataContainer } from "../../tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";

const RelatedTab = (props: IRelatedTab) => {
  return (
    <>
      {props.treeData && (
        <TreeForHierarchicalDataContainer
          {...props.treeProps}
          allowGenerateTreeData={false}
          apiData={props.treeData}
          allowAPICallOnExpand={true}
          defaultExpandedKeys={props.defaultExpandedKeys}
          defaultSelectedKeys={props.defaultSelectedKeys}
          defaultSelectedNodeInfo={undefined}
          handleNodeSelect={props.handleNodeSelect} // Node select callback   
          handleNodeExpand={props.handleNodeExpand}
          handleNodeClick={props.handleNodeClick}
        />
      )}
    </>
  )
}
export { RelatedTab }
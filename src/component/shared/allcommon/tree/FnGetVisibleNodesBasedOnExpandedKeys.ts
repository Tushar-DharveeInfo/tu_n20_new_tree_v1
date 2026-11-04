
import { FnCheckAllowCheckbox } from "./FnCheckAllowCheckbox";
import { IFeatureTree, IFilterResults } from "../../allinterface/tree/ITreeForFlatDataContainer";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { TreeNodeIcon } from "../../tree/treenodeicon/TreeNodeIcon";
import { TreeNodeTitle } from "../../tree/treenodetitle/TreeNodeTitle";
import { FnFindChildrenBasedOnKey } from "./FnFindChildrenBasedOnKey";
import { FnDeepClone } from "../basic/FnDeepClone";
import { FeaturesThatShareExplorer } from "../../../appcontainer/alldefaultprops/DefaultPropsWorkContainer";
import { FEnums } from "../../../constants/Feature";
import { FnGetIsLeafForRack } from "./FnGetIsLeafForRack";

// This Fnction is returning the visible treenodes based on expanded key initially 
async function FnGetVisibleNodesBasedOnExpandedKeys(treeData: ITreeNode[], expandedKeys: string[], treeDataPorps: IFeatureTree, featureId: string, selectedNode?: ITreeNode, originalTreeData?: ITreeNode[]): Promise<IFilterResults> {
    let visibleNodes: ITreeNode[] = [];
    let selectedNodeInfo: ITreeNode | null = null;
    let isFound: boolean = false;
    const isConfigurationFeature =
        featureId === FEnums.AssetConfiguration ||
        featureId === FEnums.ConfigureDevice ||
        featureId === FEnums.InventoryConfiguration;
    const isAuditSession = featureId === FEnums.AuditSession;
    try {
        if (expandedKeys.length === 0) {
            // Return root nodes with children removed
            visibleNodes = treeData.map(node => ({ ...node, children: [] }));
            return { visibleTree: visibleNodes, selectedNodeInfo: null };
        }

        const clonedTreeData = FnDeepClone(originalTreeData ?? treeData);
        const findVisibleNodes = async (data: ITreeNode[], parentNode: ITreeNode | null, nodeIndex: number = 0) => {
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                element.stepNo = nodeIndex + 1;
                element.NaturalSortorder = index;
                element.title = TreeNodeTitle(element, treeDataPorps, featureId);
                element.checkable = FnCheckAllowCheckbox(element, featureId);
                const nodetype = element.NodeType?.toLowerCase() ?? element.treetype.toLowerCase();
                if (treeDataPorps.allowIcon) {
                    element.icon = TreeNodeIcon(element, treeDataPorps.instanceName ?? "");
                }
                // Check if the current element is expanded
                if (expandedKeys.includes(element.key)) {

                    const result = FnFindChildrenBasedOnKey(clonedTreeData, element.key, featureId);

                    // Handle leaf case properly
                    if (!result || result.length === 0) {
                        element.isLeaf = true;
                        if (import.meta.env.PROD)
                            console.log('setleaf true:', element);
                        element.children = [];
                        selectedNodeInfo = element;
                    } else {
                        element.HasChildren = 1;
                        element.isLeaf = isAuditSession ? element.isLeaf : false;
                        element.children = result;
                    }

                    const newNode = { ...element, children: [] };

                    if (parentNode) parentNode.children.push(newNode);
                    else visibleNodes.push(newNode);
                    // Only proceed recursively if this node actually has children
                    if (element.children.length > 0) {

                        const isLastExpandedKey = expandedKeys[expandedKeys.length - 1] === element.key;
                        if (isLastExpandedKey) {
                            if (selectedNode) {
                                const foundNode = element.children.find((item) => item.NodeEntID === selectedNode.NodeEntID);
                                selectedNodeInfo = foundNode || element.children[0];
                            } else {
                                selectedNodeInfo = element.children[0];
                            }
                        }

                        await findVisibleNodes(element.children, newNode, nodeIndex + 1);
                    }
                } else {
                    let isChildrenFound = false;
                    // Check if this node should be included due to expanded children
                    if (FeaturesThatShareExplorer.includes(featureId) && selectedNode && (selectedNode?.key === element.key && selectedNode.NodeType?.toLowerCase() !== "floor")) {

                        const result = FnFindChildrenBasedOnKey(clonedTreeData, element.key, featureId);
                        if (!result?.length) {
                            element.isLeaf = element.isLeaf === true ? true : FnGetIsLeafForRack(element, featureId);
                            if (import.meta.env.PROD)
                                console.log('setleaf true:', element);
                        }
                        else {
                            const removedChildren = result.map((node: ITreeNode) => ({ ...node, children: [] }));
                            element.children = removedChildren;
                        }
                        isFound = true;
                    }
                    else {
                        const result = FnFindChildrenBasedOnKey(clonedTreeData, element.key, featureId);
                        if (result?.length) {
                            isChildrenFound = true;
                        }
                        else
                            isChildrenFound = false;
                    }
                    const filteredChildren = element.children ? [] : null;

                    if (filteredChildren) {

                        let filteredNode = {
                            ...element,
                            children: filteredChildren
                        };

                        if (nodetype === "rack") {
                            filteredNode = {
                                ...filteredNode,
                                isLeaf: element.isLeaf === true ? true : FnGetIsLeafForRack(element, featureId)
                            };
                        } else if (
                            !isConfigurationFeature &&
                            !isChildrenFound &&
                            !["site", "room", "floor", "store"].includes(nodetype)
                        ) {
                            filteredNode = {
                                ...filteredNode,
                                isLeaf: true,
                                HasChildren: element.children?.length ?? 0
                            };
                        } else {
                            if (isConfigurationFeature && ["floor", "store", "device"].includes(nodetype)) {
                                if (element.HasChildren) {
                                    filteredNode = {
                                        ...filteredNode,
                                        isLeaf: false
                                    };
                                }
                            }
                        }

                        if (parentNode) {
                            parentNode.children.push(filteredNode);
                        } else {
                            visibleNodes.push(filteredNode);
                        }
                    }
                }
            }
        };
        await findVisibleNodes(treeData, null);
    } catch (error) {
        console.error(
            "Error in function(FnGetVisibleNodesBasedOnExpandedKeys): ",
            error
        );
    }
    return { visibleTree: visibleNodes, selectedNodeInfo: !isFound ? selectedNodeInfo : null };
}

export { FnGetVisibleNodesBasedOnExpandedKeys }
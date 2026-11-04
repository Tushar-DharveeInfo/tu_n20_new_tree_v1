
import { FnCheckAllowCheckbox } from "./FnCheckAllowCheckbox";
import { IFeatureTree } from "../../allinterface/tree/ITreeForFlatDataContainer";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { TreeNodeIcon } from "../../tree/treenodeicon/TreeNodeIcon";
import { TreeNodeTitle } from "../../tree/treenodetitle/TreeNodeTitle";
import { IActionImageForSubMenu } from "../../allinterface/basic/IActionImageList";

// This function updates node with Title and icon 
function FnUpdateNodeWithTitleAndIcon(treeData: ITreeNode[], treeDataProps: IFeatureTree, featureId: string, handleKebabMenuSelect?: (selectedItem: IActionImageForSubMenu) => void): ITreeNode[] {
    try {

        const updateNodes = (data: ITreeNode[]): void => {
            for (let index = 0; index < data.length; index++) {
                const node = data[index];


                // Update the title and icon
                node.NaturalSortorder = index;
                node.title = TreeNodeTitle(node, treeDataProps, featureId, false, undefined, undefined, handleKebabMenuSelect);
                node.checkable = FnCheckAllowCheckbox(node, featureId, treeDataProps.instanceName);
                if (treeDataProps.allowIcon) {
                    node.icon = TreeNodeIcon(node, treeDataProps.instanceName ?? "");
                }

                // Recursively update the children
                if (node.children && node.children.length > 0) {
                    updateNodes(node.children);
                }
            };
        };

        // Call the update function on the root nodes
        updateNodes(treeData);
    } catch (error) {
        console.error(
            "Error in function(FnUpdateNodeWithTitleAndIcon): ",
            error
        );
    }
    // Return the updated tree data
    return treeData;
}

export { FnUpdateNodeWithTitleAndIcon }
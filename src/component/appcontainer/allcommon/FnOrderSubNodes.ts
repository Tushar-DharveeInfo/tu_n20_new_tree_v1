
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { RightMouseMenuTreeNode } from "../../constants/Feature";

const FnOrderSubNodes = (
    treeData: ITreeNode[],
    selectedNodeKey: Key,
    sortType: string,
    parentNode: ITreeNode | null = null
): { updatedTree: ITreeNode[]; selectedNode?: ITreeNode } => {
    let selectedNode: ITreeNode | undefined;

    const orderSubnodes = (nodes: ITreeNode[], parent: ITreeNode | null = null) => {
        nodes.forEach((item) => {
            if (item.key === selectedNodeKey) {
                selectedNode = item;
                if (item.children && item.children.length > 0) {
                    if (sortType === RightMouseMenuTreeNode.OrderSubnodes.toString()) {
                        item.DisplayOrder = 1;
                        item.children.sort((a, b) =>
                            (a.Name ?? "").localeCompare(b.Name ?? "")
                        );
                    } else {
                        item.DisplayOrder = 0;

                        if (
                            item.NodeEntityname === "__Rack" ||
                            (item.PGClassName === "_Device" && item.NodeEntityname === "__Rack") ||
                            item.children.some(
                                (c) =>
                                    c.MountPosition !== undefined &&
                                    c.MountPosition !== null &&
                                    c.MountPosition !== -1
                            )
                        ) {
                            item.children.sort(
                                (a, b) => (b.MountPosition ?? 0) - (a.MountPosition ?? 0)
                            );
                        } else {
                            item.children.sort(
                                (a, b) => (a.NaturalSortorder ?? 0) - (b.NaturalSortorder ?? 0)
                            );
                        }
                    }
                }
            } else if (item.children) {
                orderSubnodes(item.children, item);
            }
        });
    };

    orderSubnodes(treeData, parentNode);

    return { updatedTree: treeData, selectedNode };
};


export { FnOrderSubNodes }
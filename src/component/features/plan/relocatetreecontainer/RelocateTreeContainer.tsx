import { useEffect, useState } from 'react';
import { Key } from 'rc-tree/lib/interface';
import { ISelectedNodeInfo, ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';
import { IRelocateTreeContainer } from '../../allinterface/plan/IRelocateTreeContainer';
import { TreeControl } from '../../../shared/tree/treecontrol/TreeControl';
import { FnFindNodeAndParents } from '../../../shared/allcommon/tablegrid/FnFindNodeAndParents';
import { FnFindNearestNodeByType } from '../../../shared/allcommon/FnFindNearestNodeByType';
import { FnDeepClone } from '../../../shared/allcommon/basic/FnDeepClone';
import { FnUpdateNodeWithTitleAndIcon } from '../../../shared/allcommon/tree/FnUpdateNodeWithTitleAndIcon';
import { FnConvertFlatDataToHierarchyData } from '../../../shared/allcommon/tree/FnConvertFlatDataToHierarchyData';
import { FnCallApiToGetDataForTreeForFloor } from '../../../shared/allcommon/tree/FnCallApiToGetDataForTreeForFloor';
import { useExplorerTreeContext } from '../../../shared/context/hooks/ExplorerTreeHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { FnFilterSiteHierarchyFromAllSites, getSiteIdFromSessionList } from '../../../shared/allcommon/tree/FnFilterSiteHierarchyFromAllSites';
import { Loader } from '../../../shared/loader/Loader';
import { Label } from '../../../shared/basic/label/Label';
import '../../allcss/plan/TransferContainer.css';

/**
 * Filter down the floor subtree so that only Racks directly under the Floor
 * or under Locations are kept.
 */
function filterRacksAndLocations(nodes: ITreeNode[]): ITreeNode[] {
    const result: ITreeNode[] = [];
    for (const node of nodes) {
        const nodeType = (node.NodeType ?? '').toLowerCase();
        const treeType = (node.treetype ?? '').toLowerCase();
        const entityName = (node.NodeEntityname ?? '').toLowerCase();
        const customType = (node.Type ?? '').toLowerCase();

        const isRack =
            nodeType === 'rack' ||
            treeType === 'rack' ||
            entityName === '__rack' ||
            entityName === 'rack' ||
            customType === 'rack';

        const isLocation =
            nodeType === 'location' ||
            treeType === 'location' ||
            entityName === '__location' ||
            entityName === 'location' ||
            customType === 'location';

        if (isRack) {
            // Include rack node without deeper children (slots/devices)
            result.push({
                ...node,
                children: [],
                isLeaf: true,
                HasChildren: 0
            });
        } else if (isLocation) {
            // For location, recursively filter children to only Racks and Locations
            const filteredChildren = node.children?.length
                ? filterRacksAndLocations(node.children)
                : [];

            if (filteredChildren.length > 0) {
                result.push({
                    ...node,
                    children: filteredChildren,
                    isLeaf: false,
                    HasChildren: 1
                });
            }
        }
    }
    return result;
}

/**
 * Builds the isolated up-and-down hierarchy for the target floor:
 * keeps only the parent chain leading to the floor (no sibling rooms/floors),
 * and sets the floor's children to the filtered racks and locations.
 */
function buildIsolatedFloorHierarchy(
    fullTree: ITreeNode[],
    floorEntID: string,
    floorChildren: ITreeNode[],
    fallbackPath?: ITreeNode[]
): ITreeNode[] {
    let path = FnFindNodeAndParents(fullTree, floorEntID);
    if (!path || path.length === 0) {
        path = fallbackPath && fallbackPath.length > 0 ? fallbackPath : [];
    }
    if (!path || path.length === 0) {
        return [];
    }

    // Filter children of the floor node (only Racks and Locations)
    const filteredFloorChildren = filterRacksAndLocations(floorChildren);

    if (filteredFloorChildren.length === 0) {
        return [];
    }

    // Build hierarchy from the floor up to root
    const floorIndex = path.length - 1;
    const floorNode = path[floorIndex];

    let currentLevelNode: ITreeNode = {
        ...floorNode,
        children: filteredFloorChildren,
        isLeaf: false,
        HasChildren: 1
    };

    // Wrap with ancestors up to root
    for (let i = floorIndex - 1; i >= 0; i--) {
        const ancestor = path[i];
        currentLevelNode = {
            ...ancestor,
            children: [currentLevelNode],
            isLeaf: false,
            HasChildren: 1
        };
    }

    return [currentLevelNode];
}

const RelocateTreeContainer = (props: IRelocateTreeContainer) => {
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | undefined>();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const explorerTreeContext = useExplorerTreeContext();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();

    useEffect(() => {
        let isCancelled = false;

        const processRelocateTree = async () => {
            // 1. Resolve target floor node
            let targetFloorNode: ITreeNode | null = props.selectedFloorNode ?? null;

            if (!targetFloorNode && props.selectedNodeExplorer?.node) {
                const selNode = props.selectedNodeExplorer.node;
                if ((selNode.NodeType ?? '').toLowerCase() === 'floor') {
                    targetFloorNode = selNode;
                } else if (props.treeData) {
                    const targetKey = (selNode.key ?? selNode.NodeEntID ?? "").toString();
                    if (targetKey) {
                        const pathInPropsTree = FnFindNodeAndParents(props.treeData, targetKey);
                        if (pathInPropsTree && pathInPropsTree.length > 0) {
                            targetFloorNode = pathInPropsTree.slice().reverse().find(n => (n.NodeType ?? '').toLowerCase() === 'floor') ?? null;
                        }
                    }
                    if (!targetFloorNode) {
                        targetFloorNode = FnFindNearestNodeByType(props.treeData, selNode, 'Floor', undefined, true);
                    }
                }
            }

            let targetFloorId: string | null = targetFloorNode
                ? (targetFloorNode.NodeEntID ?? targetFloorNode.key ?? null)?.toString() ?? null
                : null;

            // Fallback: search props.treeData path for any Floor ancestor
            if (!targetFloorId && props.treeData && props.selectedNodeExplorer?.node) {
                const selNode = props.selectedNodeExplorer.node;
                const targetKey = (selNode.NodeEntID ?? selNode.key ?? "").toString();
                if (targetKey) {
                    const pathInPropsTree = FnFindNodeAndParents(props.treeData, targetKey);
                    if (pathInPropsTree && pathInPropsTree.length > 0) {
                        const floorInPath = pathInPropsTree.slice().reverse().find(n => (n.NodeType ?? '').toLowerCase() === 'floor');
                        if (floorInPath) {
                            targetFloorNode = floorInPath;
                            targetFloorId = (floorInPath.NodeEntID ?? floorInPath.key ?? null)?.toString() ?? null;
                        }
                    }
                }
            }

            // Fallback: check FloorEntID or parentEntID on selectedNodeExplorer.node
            if (!targetFloorId && props.selectedNodeExplorer?.node) {
                const selNode = props.selectedNodeExplorer.node as any;
                targetFloorId = (selNode.FloorEntID ?? selNode.parentEntID ?? null)?.toString() ?? null;
            }

            if (!targetFloorId && !targetFloorNode) {
                if (!isCancelled) {
                    setTreeData([]);
                }
                return;
            }

            // 2. Resolve base hierarchy tree from explorerTreeContext.originalTreeData or allSitesHierarchyRecords
            let baseHierarchyTree: ITreeNode[] | null = null;

            if (explorerTreeContext.originalTreeData && explorerTreeContext.originalTreeData.length > 0) {
                baseHierarchyTree = explorerTreeContext.originalTreeData;
            } else {
                const currentSiteId = getSiteIdFromSessionList(sessionContext.SessionList);
                const filteredRecords = FnFilterSiteHierarchyFromAllSites(
                    mainAppContext.allSitesHierarchyRecords,
                    currentSiteId,
                    false
                );

                if (filteredRecords && Object.keys(filteredRecords).length > 0) {
                    baseHierarchyTree = await FnConvertFlatDataToHierarchyData(
                        filteredRecords,
                        null,
                        props.featureId
                    );
                } else {
                    const message = 'Site hierarchy data not found.';
                    if (props.handleShowUserMessage) {
                        props.handleShowUserMessage(message);
                    } else if (statusBarContext?.setUserActionData) {
                        statusBarContext.setUserActionData(message);
                    }
                }
            }

            if (!baseHierarchyTree || baseHierarchyTree.length === 0) {
                if (!isCancelled) {
                    setTreeData([]);
                }
                return;
            }

            // 3. Locate target floor node in the resolved base hierarchy
            let floorNode: ITreeNode | null = null;
            let chain: ITreeNode[] | null = null;

            if (targetFloorId) {
                chain = FnFindNodeAndParents(baseHierarchyTree, targetFloorId);
                if (chain && chain.length > 0) {
                    for (let i = chain.length - 1; i >= 0; i--) {
                        if ((chain[i].NodeType ?? '').toLowerCase() === 'floor') {
                            floorNode = chain[i];
                            break;
                        }
                    }
                }
            }

            // Fallback: match by key or NodeEntID on targetFloorNode
            if (!floorNode && targetFloorNode) {
                const searchKey = (targetFloorNode.key ?? targetFloorNode.NodeEntID ?? "").toString();
                if (searchKey) {
                    chain = FnFindNodeAndParents(baseHierarchyTree, searchKey);
                    if (chain && chain.length > 0) {
                        floorNode = chain[chain.length - 1];
                    }
                }
            }

            // Fallback: match by Name and NodeType === 'Floor'
            if (!floorNode && targetFloorNode?.Name) {
                const targetNameLower = targetFloorNode.Name.toLowerCase();
                const findFloorByName = (nodes: ITreeNode[]): ITreeNode | null => {
                    for (const n of nodes) {
                        if ((n.NodeType ?? '').toLowerCase() === 'floor' && n.Name?.toLowerCase() === targetNameLower) {
                            return n;
                        }
                        if (n.children?.length) {
                            const found = findFloorByName(n.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                const matched = findFloorByName(baseHierarchyTree);
                if (matched) {
                    floorNode = matched;
                    chain = FnFindNodeAndParents(baseHierarchyTree, (matched.NodeEntID ?? matched.key).toString());
                }
            }

            // Fallback: if floor node could not be matched in baseHierarchyTree, use targetFloorNode and props.treeData
            if (!floorNode && targetFloorNode) {
                floorNode = targetFloorNode;
                if (props.treeData && targetFloorId) {
                    chain = FnFindNodeAndParents(props.treeData, targetFloorId);
                }
                if (!chain || chain.length === 0) {
                    chain = [floorNode];
                }
            }

            if (!floorNode) {
                if (!isCancelled) {
                    setTreeData([]);
                }
                return;
            }

            const floorEntID = (floorNode.NodeEntID ?? floorNode.key)?.toString() ?? "";
            let floorChildren = floorNode.children ?? [];

            // 4. If floor node does not have children, call API to get floor node data
            if (!floorChildren || floorChildren.length === 0) {
                if (!isCancelled) {
                    setIsLoading(true);
                }
                try {
                    const clonedTree = FnDeepClone(baseHierarchyTree);
                    const floorNodeForApi: ITreeNode = {
                        ...floorNode,
                        NodeEntID: floorEntID,
                        NodeType: 'Floor'
                    };
                    const apiResult = await FnCallApiToGetDataForTreeForFloor(
                        clonedTree,
                        floorNodeForApi,
                        props.featureId,
                        statusBarContext,
                        sessionContext,
                        sessionContext.SessionList,
                        chain ?? [floorNode]
                    );

                    if (apiResult.formattedTree && apiResult.formattedTree.length > 0) {
                        floorChildren = apiResult.formattedTree;
                    } else if (apiResult.originalTreeData) {
                        const updatedChain = FnFindNodeAndParents(apiResult.originalTreeData, floorEntID);
                        if (updatedChain && updatedChain.length > 0) {
                            const updatedFloor = updatedChain[updatedChain.length - 1];
                            if (updatedFloor.children && updatedFloor.children.length > 0) {
                                floorChildren = updatedFloor.children;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch floor children for RelocateTreeContainer:', error);
                } finally {
                    if (!isCancelled) {
                        setIsLoading(false);
                    }
                }
            }

            // Fallback: if floorChildren is still empty, check if props.treeData has the floor's children
            if ((!floorChildren || floorChildren.length === 0) && props.treeData && floorEntID) {
                const floorInSource = FnFindNodeAndParents(props.treeData, floorEntID);
                if (floorInSource && floorInSource.length > 0) {
                    const srcFloor = floorInSource[floorInSource.length - 1];
                    if (srcFloor.children && srcFloor.children.length > 0) {
                        floorChildren = srcFloor.children;
                    }
                }
            }

            // 5. Build isolated up-and-down hierarchy for this floor, keeping only Racks under floor/locations
            const isolatedHierarchy = buildIsolatedFloorHierarchy(
                baseHierarchyTree,
                floorEntID,
                floorChildren,
                chain ?? undefined
            );

            if (!isolatedHierarchy || isolatedHierarchy.length === 0) {
                if (!isCancelled) {
                    setTreeData([]);
                }
                return;
            }

            // 6. Decorate tree nodes with Title and Icon
            const treeProps = {
                instanceName: 'datacenter_hierarchy_treeview',
                allowIcon: true,
                hideKebabMenu: true,
                hideCopyIcon: true
            };
            const updatedTree = FnUpdateNodeWithTitleAndIcon(
                isolatedHierarchy,
                treeProps,
                props.featureId
            );

            // 7. Calculate expanded keys (ancestor path down to floor and locations)
            const keysToExpand: Key[] = [];
            const collectExpandKeys = (node: ITreeNode) => {
                keysToExpand.push(node.key);
                if (node.children?.length) {
                    for (const child of node.children) {
                        const childType = (child.NodeType ?? '').toLowerCase();
                        if (childType !== 'rack') {
                            collectExpandKeys(child);
                        }
                    }
                }
            };
            if (updatedTree.length > 0) {
                collectExpandKeys(updatedTree[0]);
            }

            // Find floor node in updatedTree to select and expand by default
            const findFloorInTree = (nodes: ITreeNode[]): ITreeNode | null => {
                for (const node of nodes) {
                    if ((node.NodeType ?? '').toLowerCase() === 'floor') {
                        return node;
                    }
                    if (node.children?.length) {
                        const found = findFloorInTree(node.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const targetFloorInTree = findFloorInTree(updatedTree);

            if (targetFloorInTree) {
                if (!keysToExpand.includes(targetFloorInTree.key)) {
                    keysToExpand.push(targetFloorInTree.key);
                }
            }

            if (isCancelled) return;

            setTreeData(updatedTree);
            setDefaultExpandedKeys(keysToExpand);

            if (targetFloorInTree) {
                const floorKey = targetFloorInTree.key;
                const selectedInfo: ISelectedNodeInfo = {
                    event: "auto-select",
                    selected: true,
                    node: targetFloorInTree,
                    selectedNodes: [targetFloorInTree]
                };
                setDefaultSelectedKeys([floorKey]);
                setDefaultSelectedNodeInfo(selectedInfo);
                props.handleNodeSelect?.([floorKey], selectedInfo, keysToExpand, updatedTree);
            }
        };

        processRelocateTree();

        return () => {
            isCancelled = true;
        };
    }, [
        explorerTreeContext.originalTreeData,
        props.selectedFloorNode,
        props.selectedNodeExplorer,
        props.treeData,
        props.featureId
    ]);

    const handleInternalNodeSelect = (
        selectedKeys: Key[],
        info: ISelectedNodeInfo,
        expandedKeys?: Key[]
    ) => {
        setDefaultSelectedKeys(selectedKeys);
        setDefaultSelectedNodeInfo(info);
        if (expandedKeys) {
            setDefaultExpandedKeys(expandedKeys);
        }
        props.handleNodeSelect?.(selectedKeys, info, expandedKeys ?? defaultExpandedKeys, treeData);
    };

    return (
        <div className="nz-wh-100 nz-d-flex-column nz-overflow-hidden">
            <div className="nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header">
                <div className="nz-d-flex-row nz-align-center nz-w-100">
                    <Label
                        uniqueName={`${props.uniqueName}-header`}
                        label="Data Centers"
                    />
                </div>
            </div>
            <div className="nz-w-100 nz-h-100 nz-overflow-auto">
                {isLoading ? (
                    <div className="nz-wh-100 nz-d-flex-hv-left">
                        <Loader />
                    </div>
                ) : treeData && treeData.length > 0 ? (
                    <TreeControl
                        uniqueName={`${props.uniqueName}-tree-control`}
                        treeData={treeData}
                        defaultExpandedKeys={defaultExpandedKeys}
                        defaultSelectedKeys={defaultSelectedKeys}
                        defaultCheckedKeys={[]}
                        defaultSelectedNodeInfo={defaultSelectedNodeInfo}
                        allowAPICallOnExpand={false}
                        allowCheckbox={false}
                        allowDefaultExpandAll={false}
                        allowIcon={true}
                        allowInternalDrag={false}
                        allowMultiple={false}
                        featureId={props.featureId}
                        handleNodeExpand={(keys) => setDefaultExpandedKeys(keys)}
                        handleNodeSelect={handleInternalNodeSelect}
                    />
                ) : (
                    <div className="nz-wh-100 nz-d-flex-hv-left">
                        No racks available for the selected floor.
                    </div>
                )}
            </div>
        </div>
    );
};

export { RelocateTreeContainer };

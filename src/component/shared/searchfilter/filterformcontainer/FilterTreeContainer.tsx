
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Key } from 'rc-tree/lib/interface'
import { CheckInfo } from 'rc-tree/lib/Tree';
import '../../allcss/searchfilter/FilterTreeContainer.css'
import { FEnums } from '../../../constants/Feature';
import { FnConvertFlatDataToHierarchyData } from '../../allcommon/tree/FnConvertFlatDataToHierarchyData';
import { FnUpdateNodeWithTitleAndIcon } from '../../allcommon/tree/FnUpdateNodeWithTitleAndIcon';
import { FnFindParentNode } from '../../allcommon/tree/FnFindParentNode';
import { IFeatureTree } from '../../allinterface/tree/ITreeForHierarchicalDataContainer';
import { ITreeNode } from '../../allinterface/tree/ITreeControl';
import { IFilterTreeContainer } from '../../allinterface/searchfilter/IFilterTreeContainer';
import { ISelectedNodeInfo } from '../../allinterface/tree/ITreeControl';
import { TreeForHierarchicalDataContainer } from '../../tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer'
import { useMainAppContext } from '../../context/hooks/MainAppHooks';

const FilterTreeContainer = (filterTreeProps: IFilterTreeContainer) => {
    const { featureId: paramFeatureId } = useParams<{ featureId?: string }>();
    const currentFeatureId = filterTreeProps.featureId || paramFeatureId;
    const isInventoryFeature =
        currentFeatureId === FEnums.InventoryManagement ||
        currentFeatureId === FEnums.InventoryConfiguration ||
        String(currentFeatureId) === FEnums.InventoryManagement.toString() ||
        String(currentFeatureId) === FEnums.InventoryConfiguration.toString();

    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<{ checked: Key[]; halfChecked: Key[]; }>();
    const mainAppContext = useMainAppContext();
    const onTreeLoadingChangeRef = useRef(filterTreeProps.onTreeLoadingChange);
    const buildGenerationRef = useRef(0);

    useEffect(() => {
        onTreeLoadingChangeRef.current = filterTreeProps.onTreeLoadingChange;
    }, [filterTreeProps.onTreeLoadingChange]);

    const featureTreeProps: IFeatureTree = useMemo(() => ({
        instanceName: "filter_tree_container",
        hideCopyIcon: true,
        hideKebabMenu: true,
        allowCheckbox: true,
        allowIcon: true,
        multiRootNode: true,
        allowCheckStrictly: true,
        allowCustomCheck: true,
        disableSelection: true
    }), []);

    useEffect(() => {
        let isActive = true;
        const buildGeneration = ++buildGenerationRef.current;
        onTreeLoadingChangeRef.current?.(true);

        const loadFilterTree = async () => {
            try {
                const allSitesHierarchy = mainAppContext.allSitesHierarchyRecords;
                const rawHierarchy = isInventoryFeature
                    ? (allSitesHierarchy?.StoreHierarchy || allSitesHierarchy?.DCHierarchy)
                    : allSitesHierarchy?.DCHierarchy;

                if (!rawHierarchy) {
                    if (isActive && buildGeneration === buildGenerationRef.current) {
                        setTreeData([]);
                        onTreeLoadingChangeRef.current?.(false);
                    }
                    return;
                }

                const flatPayload = Array.isArray(rawHierarchy)
                    ? { hierarchy: rawHierarchy }
                    : rawHierarchy;

                const hierarchyData = await FnConvertFlatDataToHierarchyData(
                    flatPayload,
                    null,
                    currentFeatureId || FEnums.Assets
                );

                if (!isActive || buildGeneration !== buildGenerationRef.current) return;

                if (hierarchyData?.length) {
                    let processedTreeData: ITreeNode[] = [];

                    if (isInventoryFeature) {
                        // Inventory features: only show Site nodes
                        processedTreeData = hierarchyData
                            .filter((node) => !node.treetype || node.treetype?.toLowerCase() === "site")
                            .map((node) => ({
                                ...node,
                                children: [],
                                isLeaf: true,
                                HasChildren: 0,
                                checkable: true
                            }))
                            .sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""));
                    } else {
                        // Other features: show Site and Room nodes
                        processedTreeData = hierarchyData
                            .filter((node) => !node.treetype || node.treetype?.toLowerCase() === "site")
                            .map((siteNode) => {
                                const roomChildren = (siteNode.children || [])
                                    .filter((child) => child.treetype?.toLowerCase() === "room" || child.NodeType?.toLowerCase() === "room")
                                    .map((room) => ({
                                        ...room,
                                        children: [],
                                        isLeaf: true,
                                        HasChildren: 0,
                                        checkable: true
                                    }))
                                    .sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""));

                                return {
                                    ...siteNode,
                                    children: roomChildren,
                                    isLeaf: roomChildren.length === 0,
                                    HasChildren: roomChildren.length,
                                    checkable: true
                                };
                            })
                            .sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""));
                    }

                    const updatedTree = FnUpdateNodeWithTitleAndIcon(
                        processedTreeData,
                        featureTreeProps,
                        currentFeatureId || FEnums.Assets
                    );

                    const ensureCheckable = (nodes: ITreeNode[]) => {
                        for (const n of nodes) {
                            n.checkable = true;
                            if (n.children && n.children.length > 0) {
                                ensureCheckable(n.children);
                            }
                        }
                    };
                    ensureCheckable(updatedTree);

                    setTreeData(updatedTree);
                    const defaultExpanded = isInventoryFeature
                        ? []
                        : (filterTreeProps.defaultSiteEntID
                            ? [filterTreeProps.defaultSiteEntID]
                            : (updatedTree.length > 0 ? [updatedTree[0].key] : []));
                    setDefaultExpandedKeys(defaultExpanded);
                } else {
                    setTreeData([]);
                }
            } catch (error) {
                console.error("Failed to build filter tree data from allSitesHierarchyRecords", error);
                if (isActive && buildGeneration === buildGenerationRef.current) {
                    setTreeData([]);
                }
            } finally {
                if (isActive && buildGeneration === buildGenerationRef.current) {
                    onTreeLoadingChangeRef.current?.(false);
                }
            }
        };

        loadFilterTree();

        return () => {
            isActive = false;
        };
    }, [mainAppContext.allSitesHierarchyRecords, currentFeatureId, isInventoryFeature, featureTreeProps, filterTreeProps.defaultSiteEntID]);

    // Apply default site/room checks without rebuilding the tree (avoids remount races).
    useEffect(() => {
        if (!treeData.length) {
            return;
        }

        if (!isInventoryFeature && filterTreeProps.defaultRoomEntID && filterTreeProps.defaultSiteEntID) {
            setDefaultStrictlyCheckedKeys({
                checked: [filterTreeProps.defaultSiteEntID, filterTreeProps.defaultRoomEntID],
                halfChecked: []
            });
        } else if (filterTreeProps.defaultSiteEntID) {
            setDefaultStrictlyCheckedKeys({
                checked: [filterTreeProps.defaultSiteEntID],
                halfChecked: []
            });
        } else {
            setDefaultStrictlyCheckedKeys({
                checked: [treeData[0].key],
                halfChecked: []
            });
        }
    }, [
        treeData,
        filterTreeProps.defaultRoomEntID,
        filterTreeProps.defaultSiteEntID,
        isInventoryFeature
    ]);

    const handleNodeCheck = (checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => {
        const rawChecked = Array.isArray(checked) ? { checked, halfChecked: [] } : checked;
        let newChecked: { checked: Key[]; halfChecked: Key[]; } = {
            checked: [...(rawChecked.checked || [])],
            halfChecked: [...(rawChecked.halfChecked || [])]
        };
        const clearCheckedKeys = () => {
            treeData.forEach((item) => {
                newChecked.checked = newChecked.checked.filter((key) => key !== item.key);
                item.children?.forEach((subItem) => {
                    newChecked.checked = newChecked.checked.filter((key) => key !== subItem.key);
                });
            });
        };
        const processParentNode = (parentNode: ITreeNode | null) => {
            if (!parentNode) return;
            clearCheckedKeys();
            parentNode.children?.forEach((item) => {
                newChecked.checked = newChecked.checked.filter((key) => key !== item.key);
            });
            newChecked.checked.push(parentNode.key);
        };
        if (info.checked) {
            info.checkedNodes = [];
            if (!isInventoryFeature && info.node.treetype?.toLowerCase() === "room") {
                const parentNode = FnFindParentNode(treeData, info.node.key);
                processParentNode(parentNode);
                parentNode && info.checkedNodes.push(parentNode);
            } else {
                clearCheckedKeys();
            }
            newChecked.checked.push(info.node.key);
            info.checkedNodes.push(info.node);
            setDefaultStrictlyCheckedKeys(newChecked);
            filterTreeProps.handleNodeCheck && filterTreeProps.handleNodeCheck(newChecked, info);
        } else {
            if (!isInventoryFeature && info.node.treetype?.toLowerCase() === "room") {
                newChecked.checked = newChecked.checked.filter(
                    (key) => key !== info.node.key
                );
                setDefaultStrictlyCheckedKeys(newChecked);
                filterTreeProps.handleNodeCheck &&
                    filterTreeProps.handleNodeCheck(newChecked, info);
                return;
            }
            //  block uncheck for other node types
            return;
        }
    };

    const handleNodeSelect = (_selectedKeys: Key[], _info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        setDefaultExpandedKeys(expandedKeys);
    }

    return (
        <div className='nz-filter-tree-container'>
            {treeData.length > 0 ? <TreeForHierarchicalDataContainer
                uniqueName={`${filterTreeProps.uniqueName}-tcfh`}
                apiData={treeData}
                featureId={currentFeatureId || FEnums.Assets}
                featureTreeProps={featureTreeProps}
                allowGenerateTreeData={false}
                defaultExpandedKeys={defaultExpandedKeys}
                defaultSelectedKeys={[]}
                defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
                handleNodeCheck={handleNodeCheck}
                handleNodeSelect={handleNodeSelect}
            /> : null}
        </div>
    )
}
export { FilterTreeContainer }

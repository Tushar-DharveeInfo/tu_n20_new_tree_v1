import { Splitter, SplitterPanel } from "primereact/splitter";
import { Key } from "rc-tree/lib/interface";
import { useState } from "react";
import '../../../../allcss/appqaentitiescontainer/manageentitytables/PurgeEntityDataTable.css'
import { SelectEntityContainer } from "../../../../../shared/settingsform/selectentitycontainer/SelectEntityContainer";
import { ISelectedNodeInfo, ITreeNode } from "../../../../../shared/allinterface/tree/ITreeControl";
import { PurgeEntityContainer } from "./purgeentitycontainer/PurgeEntityContainer";
import { CheckInfo } from "rc-tree/lib/Tree";
import { IPurgeEntityDataTable } from "../../../../allinterface/iappqaentitiescontainer/manageentitytables/IPurgeEntityDataTable";
import { FnFindParentNode } from "../../../../../shared/allcommon/tree/FnFindParentNode";


let key: Key | "" = "";
let node: { node: ITreeNode } | null = null;
const FnGetKeyFromEntId = (
    treeData: ITreeNode[],
    entId: string | Key | null,
    checkedKeys: Key[] = [],
    isClear: boolean = false
) => {
    if (isClear) {
        key = "";
        node = null;
    }

    if (entId === null && key === "") {
        key = treeData[0]?.key;
        node = { node: treeData[0] };
    } else {
        for (let item of treeData) {
            const match = item.NodeEntID === entId || item.Name === entId;
            const isChecked = checkedKeys.length === 0 || checkedKeys.includes(item.key);

            if (match && isChecked) {
                key = item.key;
                node = { node: item };
                return { key, node };
            }

            if (item.children && node === null) {
                FnGetKeyFromEntId(item.children, entId, checkedKeys);
            }

            if (node !== null) break; // Stop further traversal once found
        }
    }

    return { key, node };
};

const FnGetAllChildKeys = (node: ITreeNode): Key[] => {
    const keys: Key[] = [];
    if (!node.children || node.children.length === 0) {
        return keys;
    }

    node.children.forEach((child) => {
        keys.push(child.key);
        keys.push(...FnGetAllChildKeys(child));
    });

    return keys;
};

const FnGetSelectionScopeNode = (treeData: ITreeNode[], currentNode: ITreeNode): ITreeNode => {
    // If a parent is clicked, keep scope on that parent branch.
    if (currentNode.children && currentNode.children.length > 0) {
        return currentNode;
    }

    // If a child is clicked, keep scope on the immediate parent branch.
    const parentNode = FnFindParentNode(treeData, currentNode.key);
    return parentNode ?? currentNode;
};

const PurgeEntityDataTable = (props: IPurgeEntityDataTable) => {
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<{ checked: Key[]; halfChecked: Key[] }>();
    const [defulatSelectedKey, setDefaultSelectedKey] = useState<Key>()
    const [treeData, setTreeData] = useState<ITreeNode[] | null>(null)
    const [isRefeshTree, setIsRefeshTree] = useState(false)


    function handleCheckNode(checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>, treeData: ITreeNode[]): void {
        const incomingCheckedKeys = Array.isArray(checked) ? checked : checked.checked;
        const incomingHalfCheckedKeys = Array.isArray(checked) ? [] : checked.halfChecked;
        // Prefer local state so we only apply this click delta, not full incoming tree auto-selection.
        let currentCheckedKeys = defaultStrictlyCheckedKeys?.checked ?? incomingCheckedKeys;
        let currentHalfCheckedKeys = defaultStrictlyCheckedKeys?.halfChecked ?? incomingHalfCheckedKeys;

        if (info.node) {
            // Keep only keys inside the active parent branch; remove previous parent branch selection.
            const selectionScopeNode = FnGetSelectionScopeNode(treeData, info.node);
            const allowedKeys = new Set<Key>([selectionScopeNode.key, ...FnGetAllChildKeys(selectionScopeNode)]);
            currentCheckedKeys = currentCheckedKeys.filter((itemKey) => allowedKeys.has(itemKey));
            currentHalfCheckedKeys = currentHalfCheckedKeys.filter((itemKey) => allowedKeys.has(itemKey));
        }

        const checkedSet = new Set<Key>(currentCheckedKeys);
        const halfCheckedSet = new Set<Key>(currentHalfCheckedKeys);

        const reconcileParentState = (parentNode: ITreeNode): void => {
            // Parent is checked only when all direct children are checked.
            const childKeys = parentNode.children?.map((child) => child.key) ?? [];
            const hasSelectedChild = childKeys.some((childKey) => checkedSet.has(childKey) || halfCheckedSet.has(childKey));
            const isAllChildChecked = childKeys.length > 0 && childKeys.every((childKey) => checkedSet.has(childKey));

            if (isAllChildChecked) {
                checkedSet.add(parentNode.key);
                halfCheckedSet.delete(parentNode.key);
                return;
            }

            checkedSet.delete(parentNode.key);
            if (hasSelectedChild) {
                halfCheckedSet.add(parentNode.key);
            } else {
                halfCheckedSet.delete(parentNode.key);
            }
        };

        if (!info.node) {
            setDefaultStrictlyCheckedKeys({ checked: [...checkedSet], halfChecked: [...halfCheckedSet] });
            setTreeData(treeData);
            return;
        }

        const selectedNode = info.node;
        const selectedNodeDescendants = FnGetAllChildKeys(selectedNode);

        if (info.checked) {
            // Toggle on clicked node; do not auto-check sibling nodes.
            checkedSet.add(selectedNode.key);
            halfCheckedSet.delete(selectedNode.key);
            if (selectedNode.children.length > 0) {
                // Keep descendants half-checked when parent is directly checked.
                selectedNodeDescendants.forEach((descendantKey) => {
                    checkedSet.delete(descendantKey);
                    halfCheckedSet.add(descendantKey);
                });
            }
        } else {
            // Toggle off clicked node and clear all descendant states.
            checkedSet.delete(selectedNode.key);
            halfCheckedSet.delete(selectedNode.key);
            selectedNodeDescendants.forEach((descendantKey) => {
                checkedSet.delete(descendantKey);
                halfCheckedSet.delete(descendantKey);
            });
        }

        // Recalculate each ancestor so checked/halfChecked reflects current child states.
        let currentParent = FnFindParentNode(treeData, selectedNode.key);
        while (currentParent) {
            reconcileParentState(currentParent);
            currentParent = FnFindParentNode(treeData, currentParent.key);
        }

        setDefaultStrictlyCheckedKeys({ checked: [...checkedSet], halfChecked: [...halfCheckedSet] });
        setTreeData(treeData);
    }

    return (
        <div className='nz-purge-entites' key={props.uniqueName}>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane nz-pane-1">
                    <div className='nz-first-import-div'>
                        <SelectEntityContainer
                            uniqueName="export-tree"
                            handleCheckNode={handleCheckNode}
                            defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
                            handleNodeSelect={(selectedKeys: Key[], info: ISelectedNodeInfo, treeData: ITreeNode[] | undefined) => {
                                if (info.node)
                                    setDefaultSelectedKey(info.node.key as Key);
                                if (treeData) {
                                    setTreeData(treeData);
                                }
                            }}
                            isRefeshTree={isRefeshTree}
                            isShowUpdateOnly={false}
                            removeRefeshVariable={() => {
                                setIsRefeshTree(false)
                            }}
                            isShowExcludeRecID={false}
                            hideSelectAll={true} featureId={""} />
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane nz-pane-2">
                    {(defulatSelectedKey || defaultStrictlyCheckedKeys) && treeData && <PurgeEntityContainer
                        checkedKeys={defaultStrictlyCheckedKeys}
                        treeData={treeData}
                        uniqueName='purge-container'
                        featureId={props.featureId}
                        defulatSelectedKey={defulatSelectedKey}
                        handleClearSelection={() => {
                            setDefaultStrictlyCheckedKeys({ checked: [], halfChecked: [] });
                            setIsRefeshTree(true)
                        }}
                    />}
                </SplitterPanel>
            </Splitter>
        </div>
    )
}
export { PurgeEntityDataTable }
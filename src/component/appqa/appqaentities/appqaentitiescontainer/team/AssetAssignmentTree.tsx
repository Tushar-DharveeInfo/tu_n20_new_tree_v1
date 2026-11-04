import React, { useCallback, useRef } from 'react';
import { Key } from 'rc-tree/lib/interface';
import { DcExplorerContainer } from '../../../../shared/dcexplorercontainer/DcExplorerContainer';
import { FEnums } from '../../../../constants/Feature';
import { ISelectedNodeInfo, ITreeNode } from '../../../../shared/allinterface/tree/ITreeControl';
import { useExplorerTreeContext } from '../../../../shared/context/hooks/ExplorerTreeHooks';

interface IAssetAssignmentTreeProps {
    uniqueName: string;
    featureId?: string;
    applyFilter?: boolean;
    onNodeSelect: (selectedNode: ITreeNode, treeData?: ITreeNode[]) => void;
}

const AssetAssignmentTree = (props: IAssetAssignmentTreeProps) => {
    const explorerTreeContext = useExplorerTreeContext();
    const treeDataRef = useRef<ITreeNode[]>(explorerTreeContext.originalTreeData ?? []);

    const handleNodeSelect = useCallback((
        _selectedKeys?: Key[],
        selectedNodeInfo?: ISelectedNodeInfo,
        _expandKeys?: Key[],
        originalTreeData?: ITreeNode[]
    ) => {
        if (originalTreeData?.length) {
            treeDataRef.current = originalTreeData;
            explorerTreeContext.setOriginalTreeData(originalTreeData);
        }
        if (selectedNodeInfo?.node) {
            props.onNodeSelect(selectedNodeInfo.node, treeDataRef.current.length ? treeDataRef.current : explorerTreeContext.originalTreeData);
        }
    }, [props.onNodeSelect, explorerTreeContext]);

    const updateOriginalTreeDataset = useCallback((updatedTreeData: ITreeNode[]) => {
        if (updatedTreeData?.length) {
            treeDataRef.current = updatedTreeData;
            explorerTreeContext.setOriginalTreeData(updatedTreeData);
        }
    }, [explorerTreeContext]);

    return (
        <div className="nz-asset-assignment-tree-wrapper">
            <DcExplorerContainer
                uniqueName={`${props.uniqueName}-dce`}
                featureId={props.featureId ?? FEnums.AssetAssignment}
                originalTreeData={explorerTreeContext.originalTreeData}
                hideKebabMenu={true}
                hideFilterControl={true}
                hideFloorLayout={true}
                applyFilter={props.applyFilter ?? false}
                handleNodeSelect={handleNodeSelect}
                updateOriginalTreeDataset={updateOriginalTreeDataset}
            />
        </div>
    );
};

export { AssetAssignmentTree };
export type { IAssetAssignmentTreeProps };


import { useCallback, useState } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import '../../../allcss/appqaentitiescontainer/team/AssetAssignment.css';
import { AssetAssignmentTree } from './AssetAssignmentTree';
import { Assign } from '../../../../shared/sidebar/assign/Assign';
import { ITreeNode } from '../../../../shared/allinterface/tree/ITreeControl';
import { FEnums } from '../../../../constants/Feature';
import { IAssetAssignment } from '../../../allinterface/iappqaentitiescontainer/team/IAssetAssignment';
import { DeviceViewContainer } from '../../../../appcontainer/layoutcontainer/LayoutContainer';

const isDeviceNode = (node?: ITreeNode | null): boolean => {
    if (!node) return false;
    const treeType = node.treetype?.toLowerCase() ?? '';
    const nodeType = node.NodeType?.toLowerCase() ?? '';
    return (
        treeType === 'device' ||
        treeType === 'deviceslot' ||
        treeType === 'deviceview' ||
        nodeType === 'device' ||
        nodeType === 'mounteddevice' ||
        Boolean(node.MountedDeviceEntID)
    );
};

const AssetAssignment = (props: IAssetAssignment) => {

    const uniqueName = props.uniqueName ?? 'asset-assignment';
    const featureId = FEnums.AssetAssignment;
    const [selectedNode, setSelectedNode] = useState<ITreeNode | null>(null);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);

    const handleNodeSelect = useCallback((node: ITreeNode, currentTreeData?: ITreeNode[]) => {
        setSelectedNode(node);
        if (currentTreeData?.length) {
            setTreeData(currentTreeData);
        }
    }, []);

    return (
        <div className="nz-asset-assignment" key={uniqueName}>
            <div className="nz-asset-assignment-container">
                <Splitter tabIndex={-1} className="nz-w-100 nz-h-100 nz-asset-assignment-splitter">
                    {/* First Pane: Asset Hierarchy Tree */}
                    <SplitterPanel tabIndex={-1} size={25} minSize={15} className="nz-asset-assignment-tree-pane nz-pane-1">
                        <AssetAssignmentTree
                            uniqueName={`${uniqueName}-tree`}
                            featureId={featureId}
                            onNodeSelect={handleNodeSelect}
                            applyFilter={false}
                        />
                    </SplitterPanel>

                    {/* Second Pane: Device View if device node is selected */}
                    <SplitterPanel tabIndex={-1} size={50} minSize={20} className="nz-asset-assignment-device-pane nz-pane-2">
                        <div className="nz-asset-assignment-device-wrapper">
                            {isDeviceNode(selectedNode) && selectedNode ? (
                                <DeviceViewContainer
                                    key={`device-view-${selectedNode.NodeEntID || selectedNode.key}`}
                                    viewType={selectedNode.NodeType?.toLowerCase() === 'mounteddevice' ? 'mounted' : 'device'}
                                    uniqueName={`${uniqueName}-device-view`}
                                    featureId={featureId}
                                    selectedNode={selectedNode}
                                    treeData={treeData}
                                />
                            ) : (
                                <div className="nz-asset-assignment-placeholder">
                                    Select a device node from the tree to view device details
                                </div>
                            )}
                        </div>
                    </SplitterPanel>

                    {/* Third Pane: Assignment Panel */}
                    <SplitterPanel tabIndex={-1} size={25} minSize={15} className="nz-asset-assignment-assign-pane nz-pane-3">
                        <div className="nz-asset-assignment-assign-wrapper">
                            {isDeviceNode(selectedNode) && selectedNode ? (
                                <Assign
                                    key={`assign-${selectedNode.NodeEntID || selectedNode.key}-${props.assignmentType}`}
                                    uniqueName={`${uniqueName}-assign`}
                                    featureId={featureId}
                                    selectedNode={selectedNode}
                                    treeData={treeData}
                                    assignmentType={props.assignmentType}
                                    isReadOnly={props.isReadOnly}
                                />
                            ) : (
                                <div className="nz-asset-assignment-placeholder">
                                    Select a device node to view assignments
                                </div>
                            )}
                        </div>
                    </SplitterPanel>
                </Splitter>
            </div>
        </div>
    );
};

export { AssetAssignment };
export type { IAssetAssignment };

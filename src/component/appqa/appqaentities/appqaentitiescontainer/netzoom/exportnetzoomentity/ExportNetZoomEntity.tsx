
import { Key, useState } from "react";
import "../../../../allcss/appqaentitiescontainer/netzoom/ExportNetZoomEntity.css";
import { ISelectedNodeInfo, ITreeNode } from "../../../../../shared/allinterface/tree/ITreeControl";
import { SelectEntityContainer } from "../../../../../shared/settingsform/selectentitycontainer/SelectEntityContainer";
import { ExportEntitiesWorkSheet } from "./ExportEntitiesWorkSheet";
import { IExportNetZoomEntity } from "../../../../allinterface/iappqaentitiescontainer/netzoom/IExportNetZoomEntity";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { CheckInfo } from "rc-tree/lib/Tree";

const ExportNetZoomEntity = (containerProps: IExportNetZoomEntity) => {
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<{ checked: Key[]; halfChecked: Key[]; }>({
        checked: [],
        halfChecked: []
    });
    const [excludeRecID, setExcludeRecID] = useState<boolean>(false);
    const [treeData, setTreeData] = useState<ITreeNode[]>();

    return (
        <div key={containerProps.uniqueName} className="nz-export-entities">
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane nz-pane-1">
                    <div className="nz-export-left-div">
                        {defaultStrictlyCheckedKeys && <SelectEntityContainer
                            uniqueName={`export-tree`}
                            defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
                            handleCheckNode={(
                                checked: {
                                    checked: Key[];
                                    halfChecked: Key[];
                                }
                                    | Key[],
                                info: CheckInfo<ITreeNode>,
                                treeData: ITreeNode[]
                            ) => {
                                setDefaultStrictlyCheckedKeys(checked as {
                                    checked: Key[];
                                    halfChecked: Key[];
                                });
                                setTreeData(treeData);

                            }}
                            handleNodeSelect={(selectedKeys: Key[], info: ISelectedNodeInfo) => {
                                setSelectedNodeInfo(info);
                            }}
                            handleValueChangeForExcludeRecID={(value: string) => {
                                let isDefault = value === "1" ? true : false;
                                setExcludeRecID(isDefault);
                            }}
                            hideSelectAll={true}
                            isShowUpdateOnly={false}
                            isShowExcludeRecID={true}
                            featureName={"Export Entities"}
                            featureId={containerProps.featureId} />}
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane nz-pane-2">
                    <div className="nz-export-right-div">
                        {selectedNodeInfo && (
                            <ExportEntitiesWorkSheet
                                uniqueName={containerProps.uniqueName}
                                treeData={treeData}
                                excludeRecID={excludeRecID}
                                halfCheckedNodeKeys={
                                    defaultStrictlyCheckedKeys?.halfChecked || []
                                }
                                selectedNodeInfo={selectedNodeInfo}
                                checkedNodeKeys={defaultStrictlyCheckedKeys?.checked || []}
                                featureId={containerProps.featureId}
                            />
                        )}
                    </div>
                </SplitterPanel>
            </Splitter>
        </div>
    );
};
export { ExportNetZoomEntity }
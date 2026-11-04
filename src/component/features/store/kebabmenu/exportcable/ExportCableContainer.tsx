
import { Key } from "rc-tree/lib/interface";
import { CheckInfo } from "rc-tree/lib/Tree";
import { useState } from "react";
import "../../../allcss/store/kebabmenu/ExportCableContainer.css";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
import { ExportCableWorksheet } from "./ExportCableWorksheet";
import { IExportCableContainer } from "../../../allinterface/store/kebabmenu/IExportCableContainer";
import { SelectEntityContainer } from "../../../../shared/settingsform/selectentitycontainer/SelectEntityContainer";
import { Splitter, SplitterPanel } from "primereact/splitter";

type ICheckedTreeKeys = {
    checked: Key[];
    halfChecked: Key[];
};

const ExportCableContainer = (props: IExportCableContainer) => {
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<ICheckedTreeKeys>();
    const [excludeRecID, setExcludeRecID] = useState<boolean>(false);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [treeData, setTreeData] = useState<ITreeNode[]>();

    const handleCheckNode = (
        checked: ICheckedTreeKeys | Key[],
        _info: CheckInfo<ITreeNode>,
        nextTreeData: ITreeNode[]
    ) => {
        setDefaultStrictlyCheckedKeys(
            Array.isArray(checked) ? { checked, halfChecked: [] } : checked
        );
        setTreeData(nextTreeData);
    };

    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo) => {
        setSelectedKeys([info.node.key]);
        setSelectedNodeInfo(info);
    };

    const handleValueChangeForExcludeRecID = (value: string) => {
        setExcludeRecID(value === "1");
    };

    return (
        <div className="nz-export-entities" key={props.uniqueName}>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane">
                    <div className="nz-export-left-div">
                        <SelectEntityContainer
                            uniqueName={props.uniqueName}
                            handleCheckNode={handleCheckNode}
                            handleNodeSelect={handleNodeSelect}
                            handleValueChangeForExcludeRecID={handleValueChangeForExcludeRecID}
                            isShowUpdateOnly={false}
                            isShowExcludeRecID={true}
                            featureId={props.featureId}
                            entityName="Cable"
                        />
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane">
                    <div className="nz-export-right-div">
                        {treeData && selectedNodeInfo && selectedKeys && (
                            <ExportCableWorksheet
                                treeData={treeData}
                                excludeRecID={excludeRecID}
                                halfCheckedNodeKeys={
                                    defaultStrictlyCheckedKeys?.halfChecked || undefined
                                }
                                selectedNodeInfo={selectedNodeInfo}
                                checkedNodeKeys={defaultStrictlyCheckedKeys?.checked || undefined}
                                featureId={props.featureId}
                            />
                        )}
                    </div>
                </SplitterPanel>
            </Splitter>
        </div >
    );
};
export { ExportCableContainer }
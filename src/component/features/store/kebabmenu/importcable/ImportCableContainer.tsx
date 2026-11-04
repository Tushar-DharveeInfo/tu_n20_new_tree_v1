import React, { useState } from 'react'
import '../../../allcss/store/kebabmenu/ImportCableContainer.css'
import { Key } from 'rc-tree/lib/interface';
import { CheckInfo } from 'rc-tree/lib/Tree';
import { ISelectedNodeInfo, ITreeNode } from '../../../../shared/allinterface/tree/ITreeControl';
import { SelectAndValidateCableWorksheet } from './SelectAndValidateCableWorksheet';
import { IImportCableContainer } from '../../../allinterface/store/kebabmenu/IImportCableContainer';
import { SelectEntityContainer } from '../../../../shared/settingsform/selectentitycontainer/SelectEntityContainer';
import { Splitter, SplitterPanel } from 'primereact/splitter';

type ICheckedTreeKeys = { checked: Key[]; halfChecked: Key[] };

const ImportCableContainer = (props: IImportCableContainer) => {
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<ICheckedTreeKeys>();
    const [treeData, setTreeData] = useState<ITreeNode[] | null>(null)
    const [updateOnly, setUploadOnly] = useState(false)
    const [isRefeshTree, setIsRefeshTree] = useState(false)

    return (
        <div className='nz-import-entites' key={props.uniqueName}>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane">
                    <div className='nz-first-import-div'>
                        <SelectEntityContainer
                            uniqueName="nz-cable-tree"
                            handleCheckNode={(checked: ICheckedTreeKeys | Key[], _info: CheckInfo<ITreeNode>, nextTreeData: ITreeNode[]) => {
                                setDefaultStrictlyCheckedKeys(Array.isArray(checked) ? { checked, halfChecked: [] } : checked);
                                setTreeData(nextTreeData);
                            }}
                            handleNodeSelect={(selectedKeys: Key[], info: ISelectedNodeInfo) => {
                            }}
                            isShowUpdateOnly={true}
                            isRefeshTree={isRefeshTree}
                            isShowExcludeRecID={false}
                            entityName={"Cable"}
                            featureId={props.featureId}
                            handleCheckboxChange={(name: string, value: string) => {
                                if (name === "Update Only") {
                                    setUploadOnly(value === "1" ? true : false);
                                }
                            }}
                            removeRefeshVariable={() => {
                                setIsRefeshTree(false)
                            }}
                        />
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane">
                    <div className='nz-grid-import-div'>
                        {treeData &&
                            (
                                (defaultStrictlyCheckedKeys?.checked && defaultStrictlyCheckedKeys?.checked.length > 0)
                                || (defaultStrictlyCheckedKeys?.halfChecked && defaultStrictlyCheckedKeys?.halfChecked.length > 0))
                            &&

                            <SelectAndValidateCableWorksheet
                                uniqueName={props.uniqueName}
                                headerText="Import Cables"
                                checkedNodeKeys={defaultStrictlyCheckedKeys.checked}
                                halfCheckedNodeKeys={defaultStrictlyCheckedKeys.halfChecked}
                                treeData={treeData}
                                updateOnly={updateOnly}
                                featureId={props.featureId}
                                handleClearSelection={() => {
                                    setDefaultStrictlyCheckedKeys(undefined);
                                    setIsRefeshTree(true)
                                }}
                            />
                        }
                    </div>
                </SplitterPanel>
            </Splitter>
        </div>
    )
}
export { ImportCableContainer } 
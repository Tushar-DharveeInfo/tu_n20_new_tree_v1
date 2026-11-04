import React, { useState } from 'react'
import { SelectEntityContainer } from '../../../../shared/settingsform/selectentitycontainer/SelectEntityContainer';
import '../../../allcss/rackandstack/kebabmenu/ImportDeviceContainer.css'
import { Key } from 'rc-tree/lib/interface';
import { CheckInfo } from 'rc-tree/lib/Tree';
import { ISelectedNodeInfo, ITreeNode } from '../../../../shared/allinterface/tree/ITreeControl';
import { IListItem } from '../../../../shared/allinterface/basic/ICheckedListPanel';
import { SelectAndValidateDeviceWorksheet } from './SelectAndValidateDeviceWorksheet';
import { ICheckedTreeKeys, IImportDeviceContainer } from '../../../allinterface/rackandstack/kebabmenu/IImportDeviceContainer';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { YesNoFormContainer } from '../../../../shared/basic/yesnoformcontainer/YesNoFormContainer';

let key: Key | "" = "";
let node: { node: ITreeNode } | null = null;

// Find tree node key by entity ID or name within checked keys.
const FnGetKeyFromEntId = (
    treeData: ITreeNode[],
    entId: string | Key | null,
    checkedKeys: Key[] = [],
    isClear: boolean = false
): { key: Key | ""; node: { node: ITreeNode } | null } => {
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

const ImportDeviceContainer = (props: IImportDeviceContainer) => {
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<ICheckedTreeKeys>();
    const [treeData, setTreeData] = useState<ITreeNode[] | null>(null)
    const [updateOnly, setUploadOnly] = useState(false)
    const [isRefeshTree, setIsRefeshTree] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    // Uncheck authorized sheet from list and block _Device removal.
    function handleClickisAuthorized(_event: unknown, _actionCode?: string, payload?: IListItem): void {
        const uniqueIds: Key[] = [...new Set([...defaultStrictlyCheckedKeys?.checked ? defaultStrictlyCheckedKeys?.checked : [], ...defaultStrictlyCheckedKeys?.halfChecked ? defaultStrictlyCheckedKeys?.halfChecked : []])];
        const data = FnGetKeyFromEntId(treeData ?? [], payload?.label ?? null, uniqueIds, true)
        if (payload?.label === "_Device") {
            setIsConfirmOpen(true)
            setConfirmMessage("You Do not allow to remove _Device")
            return
        }
        if (data.key !== null && defaultStrictlyCheckedKeys) {
            if (defaultStrictlyCheckedKeys.checked.includes(data.key)) {
                const filteredKeys: Key[] = defaultStrictlyCheckedKeys.checked.filter(k => k !== data.key)
                setDefaultStrictlyCheckedKeys({ checked: filteredKeys, halfChecked: defaultStrictlyCheckedKeys.halfChecked })
            }
            else if (defaultStrictlyCheckedKeys.halfChecked.includes(data.key)) {
                const filteredKeys: Key[] = defaultStrictlyCheckedKeys.halfChecked.filter(k => k !== data.key)
                setDefaultStrictlyCheckedKeys({ checked: defaultStrictlyCheckedKeys.checked, halfChecked: filteredKeys })
            }
        }
    }

    return (
        <div className='nz-import-device' key={props.uniqueName}>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane">
                    <div className='nz-first-import-div'>
                        <SelectEntityContainer
                            uniqueName={props.uniqueName}
                            handleCheckNode={(checked: ICheckedTreeKeys | Key[], _info: CheckInfo<ITreeNode>, nextTreeData: ITreeNode[]) => {
                                setIsRefeshTree(false)
                                setDefaultStrictlyCheckedKeys(Array.isArray(checked) ? { checked, halfChecked: [] } : checked);
                                setTreeData(nextTreeData);
                            }}
                            handleNodeSelect={(_selectedKeys: Key[], _info: ISelectedNodeInfo) => {
                            }}
                            defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
                            isRefeshTree={isRefeshTree}
                            isShowUpdateOnly={true}
                            isShowExcludeRecID={false}
                            entityName={"Device"}
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
                            <SelectAndValidateDeviceWorksheet
                                uniqueName={props.uniqueName}
                                headerText="Import Devices"
                                checkedNodeKeys={defaultStrictlyCheckedKeys.checked}
                                halfCheckedNodeKeys={defaultStrictlyCheckedKeys.halfChecked}
                                treeData={treeData}
                                updateOnly={updateOnly}
                                featureId={props.featureId}
                                entityName={props.entityName}
                                handleClickisAuthorized={handleClickisAuthorized}
                                handleClearSelection={() => {
                                    setDefaultStrictlyCheckedKeys({ checked: [], halfChecked: [] });
                                    setIsRefeshTree(true)
                                }}
                            />}
                    </div>
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={props.uniqueName + "confirmbox"}
                message={confirmMessage}
                showOkButton={true}
                handleOkButtonClick={
                    () => {
                        setIsConfirmOpen(false)
                    }
                } />
        </div>
    )
}
export { ImportDeviceContainer }

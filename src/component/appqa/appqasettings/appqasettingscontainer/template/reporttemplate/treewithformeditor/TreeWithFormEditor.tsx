
import { useEffect, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Key } from 'rc-tree/lib/interface';
import { CheckInfo } from 'rc-tree/lib/Tree';
import '../../../../../allcss/appqasettingscontainer/template/TreeWithFormEditor.css'
import { IControl } from '../../../../../../shared/allinterface/settingsform/ISettingsLibForm';
import { ITreeWithFormEditor } from '../../../../../allinterface/iappqasettingscontainer/template/ITreeWithFormEditor';
import { ISelectedNodeInfo, ITreeNode } from '../../../../../../shared/allinterface/tree/ITreeControl';
import { Label } from '../../../../../../shared/basic/label/Label';
import { TreeForHierarchicalDataContainer } from '../../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer';
import { SettingsLibForm } from '../../../../../../shared/settingsform/settingslibform/SettingsLibForm';
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from '../../../../../../shared/allcommon/basic/FnHandleContainerKeyDown';

const TreeWithFormEditor = (treeWithFormEditorProps: ITreeWithFormEditor) => {
    const [controls, setControls] = useState<IControl[]>([]);
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [checkedKeys, setCheckedKeys] = useState<Key[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
    const [strictlyCheckedKeys, setStrictlyCheckedKeys] = useState<{
        checked: Key[];
        halfChecked: Key[];
    }>({
        checked: [],
        halfChecked: []
    });

    const { formControls, treeData, featureTreeProps, defaultCheckedKeys, defaultExpandedKeys, defaultSelectedKeys, defaultSelectedNodeInfo, defaultStrictlyCheckedKeys } = treeWithFormEditorProps;
    useEffect(() => {
        if (defaultCheckedKeys && defaultCheckedKeys?.length > 0)
            setCheckedKeys(defaultCheckedKeys);
        else
            setCheckedKeys([]);
        if (defaultExpandedKeys && defaultExpandedKeys.length > 0)
            setExpandedKeys(defaultExpandedKeys);
        else
            setExpandedKeys([]);
        if (defaultSelectedKeys && defaultSelectedKeys.length > 0)
            setSelectedKeys(defaultSelectedKeys);
        else
            setSelectedKeys([]);
        if (defaultSelectedNodeInfo)
            setSelectedNodeInfo(defaultSelectedNodeInfo);
        else
            setSelectedNodeInfo(null);
        if (defaultStrictlyCheckedKeys)
            setStrictlyCheckedKeys(defaultStrictlyCheckedKeys);
        else
            setStrictlyCheckedKeys({
                checked: [],
                halfChecked: []
            });
        if (formControls.length > 0)
            setControls(formControls);
        else
            setControls([]);
    }, [formControls, defaultCheckedKeys, defaultExpandedKeys, defaultSelectedKeys, defaultSelectedNodeInfo, defaultStrictlyCheckedKeys])


    const handleSaveForm = (profileData: string, id?: string | undefined) => {
        if (treeWithFormEditorProps.handleSaveAction) {
            treeWithFormEditorProps.handleSaveAction(profileData, id);
        }
        else {
            if (id) {

                // call api to update profile record
                alert("Call API to update record : " + profileData);
            }
            else {
                //call api to add profile record
                alert("Call API to add : " + profileData);
            }
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleAIClick = (event: any, actionCode?: string | undefined) => {
        if (treeWithFormEditorProps.handleAIClick) {
            treeWithFormEditorProps.handleAIClick(event, actionCode);
        }
        else {
            alert(`Handle action image click for : ${actionCode}`);
        }
    }

    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        if (treeWithFormEditorProps.handleNodeSelect) {
            treeWithFormEditorProps.handleNodeSelect(selectedKeys, info, expandedKeys);
        }
        if (expandedKeys) {
            setExpandedKeys(expandedKeys);
        }
        setSelectedKeys([info.node.key]);
        setSelectedNodeInfo(info);
    }

    const handleNodeCheck = (checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => {
        if (treeWithFormEditorProps.handleNodeCheck) {
            treeWithFormEditorProps.handleNodeCheck(checked, info);
        }
        else {
            if (featureTreeProps.allowCheckStrictly) {
                setStrictlyCheckedKeys(checked as { checked: Key[]; halfChecked: Key[]; });
            }
            else {
                setCheckedKeys(checked as Key[]);
            }
        }
    }


    const effectiveId = treeWithFormEditorProps.id !== undefined
        ? treeWithFormEditorProps.id
        : (selectedNodeInfo?.node?.NodeEntID || selectedNodeInfo?.node?.EntID || selectedNodeInfo?.node?.RecID || "");

    return (
        <div key={`${treeWithFormEditorProps.uniqueName}-tree-form`} className='nz-tree-with-form-editor'>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">

                    <div className='nz-twfe-tree-container'>
                        {treeWithFormEditorProps.headerTextForTree && <div className='nz-sub-header'>
                            <Label uniqueName={`${treeWithFormEditorProps.uniqueName}-tree-header`} label={treeWithFormEditorProps.headerTextForTree}
                            />
                        </div>}
                        {featureTreeProps && treeData.length > 0 && <TreeForHierarchicalDataContainer
                            uniqueName={`${treeWithFormEditorProps.uniqueName}-tree-pane`}
                            apiData={treeData}
                            featureId={treeWithFormEditorProps.featureId || ""}
                            featureTreeProps={featureTreeProps}
                            allowGenerateTreeData={false}
                            allowAPICallOnExpand={false}
                            defaultCheckedKeys={checkedKeys}
                            defaultExpandedKeys={expandedKeys}
                            defaultSelectedKeys={selectedKeys}
                            defaultStrictlyCheckedKeys={strictlyCheckedKeys}
                            defaultSelectedNodeInfo={selectedNodeInfo || undefined}
                            allowAdd={treeWithFormEditorProps.allowAdd}
                            allowEdit={treeWithFormEditorProps.showEditButton}
                            allowDelete={treeWithFormEditorProps.allowDelete}
                            disableAdd={treeWithFormEditorProps.disableAdd}
                            disableEdit={treeWithFormEditorProps.disableEdit}
                            disableDelete={treeWithFormEditorProps.disableDelete}
                            customIcons={treeWithFormEditorProps.customIcons}
                            handleAIClick={handleAIClick}
                            handleNodeSelect={handleNodeSelect}
                            handleNodeCheck={handleNodeCheck}
                            handleKebabMenuSelect={treeWithFormEditorProps.handleKebabMenuSelect}

                        />}
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-pane-form">
                    <div
                        className='nz-twfe-right-pane-container nz-form-controls-container'
                        onKeyDownCapture={handleFormControlsKeyDown}
                        onKeyDown={handleFormControlsBubbleKeyDown}
                    >

                        {controls.length > 0 && !treeWithFormEditorProps.componentToRender ? <SettingsLibForm
                            key={`${treeWithFormEditorProps.uniqueName}-${effectiveId}-${selectedNodeInfo?.node.key ?? ""}`}
                            uniqueName={treeWithFormEditorProps.uniqueName + (selectedNodeInfo?.node.key ?? "")}
                            controls={controls}
                            isDisableForm={treeWithFormEditorProps.isDisableForm}
                            profileString={treeWithFormEditorProps.profileString || ""}
                            allowShowHeader={treeWithFormEditorProps.allowShowHeader}
                            headerText={treeWithFormEditorProps.headerText || selectedNodeInfo?.node?.Name || undefined}
                            handleSaveForm={handleSaveForm}
                            isAutoSave={treeWithFormEditorProps.isAutoSave || false}
                            featureId={treeWithFormEditorProps.featureId}
                            id={effectiveId}
                            container={treeWithFormEditorProps.headerTextForTree || treeWithFormEditorProps.entityName}
                        /> : !treeWithFormEditorProps.componentToRender && <div className="nz-wh-100 nz-d-flex-hv-left">Select {treeWithFormEditorProps.entityName ?? "valid node"} to view/edit</div>}
                        {treeWithFormEditorProps.componentToRender}
                    </div>
                </SplitterPanel>
            </Splitter>
        </div>
    )
}
export { TreeWithFormEditor }
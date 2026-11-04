
import { useState } from 'react'
import { Key } from 'rc-tree/lib/interface';
import '../../../../allcss/appqaentitiescontainer/netzoom/ImportNetZoomEntity.css'
import { ISelectedNodeInfo, ITreeNode } from '../../../../../shared/allinterface/tree/ITreeControl';
import { ImportEntitiesWorkSheet } from './ImportEntitiesWorkSheet';
import { SelectEntityContainer } from '../../../../../shared/settingsform/selectentitycontainer/SelectEntityContainer';
import { IImportNetZoomEntity } from '../../../../allinterface/iappqaentitiescontainer/netzoom/IImportNetZoomEntity';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { CheckInfo } from 'rc-tree/lib/Tree';


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
const ImportNetZoomEntity = (props: IImportNetZoomEntity) => {
	const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<{ checked: Key[]; halfChecked: Key[] }>();
	const [treeData, setTreeData] = useState<ITreeNode[] | null>(null)
	const [updateOnly, setUploadOnly] = useState(false)
	const [isRefeshTree, setIsRefeshTree] = useState(false)


	function handleClickisAuthorized(event: Record<string, any>, actionCode?: string | undefined, payload?: Record<string, any>): void {
		const uniqueIds: Key[] = [...new Set([...defaultStrictlyCheckedKeys?.checked ? defaultStrictlyCheckedKeys?.checked : [], ...defaultStrictlyCheckedKeys?.halfChecked ? defaultStrictlyCheckedKeys?.halfChecked : []])];

		let data = FnGetKeyFromEntId(treeData ?? [], payload?.label, uniqueIds, true)

		if (data.key !== null) {
			if (defaultStrictlyCheckedKeys?.checked.includes(data.key)) {
				const filteredKeys: Key[] = defaultStrictlyCheckedKeys.checked.filter(k => k !== data.key)
				setDefaultStrictlyCheckedKeys({ checked: filteredKeys, halfChecked: defaultStrictlyCheckedKeys.halfChecked })
			}
			else if (defaultStrictlyCheckedKeys?.halfChecked.includes(data.key)) {
				const filteredKeys: Key[] = defaultStrictlyCheckedKeys.halfChecked.filter(k => k !== data.key)
				setDefaultStrictlyCheckedKeys({ checked: defaultStrictlyCheckedKeys.checked, halfChecked: filteredKeys })
			}
		}
	}


	return (
		<div className='nz-import-entites'>
			<Splitter className='nz-w-100 nz-h-100'>
				<SplitterPanel size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane nz-pane-1">
					<div className='nz-first-import-div'>
						<SelectEntityContainer
							uniqueName="import-tree"
							handleCheckNode={(
								checked: {
									checked: Key[];
									halfChecked: Key[];
								}
									| Key[],
								info: CheckInfo<ITreeNode>,
								treeData: ITreeNode[]
							) => {
								setIsRefeshTree(false)
								setDefaultStrictlyCheckedKeys(checked as {
									checked: Key[];
									halfChecked: Key[];
								});
								setTreeData(treeData);
							}}
							defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
							handleNodeSelect={(selectedKeys: Key[], info: ISelectedNodeInfo) => {
							}}
							isShowUpdateOnly={true}
							isShowExcludeRecID={false}
							isRefeshTree={isRefeshTree}
							featureName={"Import Entities"}
							handleCheckboxChange={(name: string, value: string) => {
								if (name === "Update Only") {
									setUploadOnly(value === "1" ? true : false);
								}
							}}
							removeRefeshVariable={() => {
								setIsRefeshTree(false)
							}}
							featureId={props.featureId}
						/>
					</div>
				</SplitterPanel>
				<SplitterPanel size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane nz-pane-2">
					<div className='nz-grid-import-div'>
						{treeData &&
							(
								(defaultStrictlyCheckedKeys?.checked && defaultStrictlyCheckedKeys?.checked.length > 0)
								|| (defaultStrictlyCheckedKeys?.halfChecked && defaultStrictlyCheckedKeys?.halfChecked.length > 0))
							&&
							<ImportEntitiesWorkSheet
								uniqueName={props.uniqueName}
								headerText="Import"
								checkedNodeKeys={defaultStrictlyCheckedKeys.checked}
								halfCheckedNodeKeys={defaultStrictlyCheckedKeys.halfChecked}
								treeData={treeData}
								updateOnly={updateOnly}
								selectedFeatureItem={props.selectedFeatureItem}
								featureId={props.featureId}
								handleClickisAuthorized={handleClickisAuthorized}
								handleClearSelection={() => {
									setDefaultStrictlyCheckedKeys({ checked: [], halfChecked: [] });
									setIsRefeshTree(true)
								}}
							/>}
					</div>
				</SplitterPanel>
			</Splitter>
		</div>
	)
}
export { ImportNetZoomEntity }
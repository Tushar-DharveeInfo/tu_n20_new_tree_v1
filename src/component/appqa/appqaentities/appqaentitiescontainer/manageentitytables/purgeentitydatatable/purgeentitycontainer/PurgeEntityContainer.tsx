import { useEffect, useState } from 'react'
import { ActionImage } from '../../../../../../shared/basic/actionimage/ActionImage';
import { Label } from '../../../../../../shared/basic/label/Label';
import { CheckedListPanel } from '../../../../../../shared/basic/checkedlistpanel/CheckedListPanel';
import { IListItem } from '../../../../../../shared/allinterface/basic/ICheckedListPanel';
import { ITreeNode } from '../../../../../../shared/allinterface/tree/ITreeControl';
import { Key } from 'rc-tree/lib/interface';
import '../../../../../allcss/appqaentitiescontainer/manageentitytables/PurgeEntityContainer.css'
import { EM, PURGE } from '../../../../../../shared/interceptors/EndPoints';
import { axiosInterceptor } from '../../../../../../shared/interceptors/Interceptor';
import { useStatusBarContext } from '../../../../../../shared/context/hooks/StatusBarHooks';
import { PurgeEntity24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../../../../appcontainer/allcommon/FnGetCssVariable';
import { FnIsValidDateInput } from '../../../../../../appcontainer/allcommon/FnIsValidDateInput';
import { FnConvertDateToUtcOrUtcToDate } from '../../../../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';

import { DELIMITER } from '../../../../../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid';
import { IPurgeEntityContainer } from '../../../../../allinterface/iappqaentitiescontainer/manageentitytables/IPurgeEntityContainer';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { YesNoFormContainer } from '../../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { FnParseJsonSafely } from '../../../../../../appcontainer/allcommon/FnParseJsonSafely';
import { BasicGrid } from '../../../../../../shared/tablegrid/BasicGrid';

function FnFindUniquePathNodes(
    treeData: ITreeNode[],
    keysObj: {
        checked: Key[];
        halfChecked: Key[];
    },
    selectedKey?: Key | undefined
): Record<string, any>[] {
    const uniqueKeys = new Set<Key>([...keysObj.checked, ...keysObj.halfChecked]);
    if (selectedKey) {
        uniqueKeys.add(selectedKey);
    }
    const collectedNodes = new Map<string, Record<string, any>>();
    function dfs(
        nodes: ITreeNode[],
        targetKey: string,
        trail: ITreeNode[]
    ): boolean {
        for (const node of nodes) {
            const currentTrail = [...trail, node];
            if (node.key === targetKey) {
                currentTrail.forEach(n => {
                    if (!collectedNodes.has(n.key)) {
                        collectedNodes.set(n.key, {
                            Name: n.Name ?? "",
                            EntID: n.EntID,
                            TableLabel: n.TableLabel ?? "",
                            EntityName: n.NodeEntityname ?? ""
                        });
                    }
                });
                return true;
            }

            if (node.children?.length) {
                const found = dfs(node.children, targetKey, currentTrail);
                if (found) return true;
            }
        }
        return false;
    }

    for (const key of uniqueKeys) {
        dfs(treeData, key as string, []);
    }

    return Array.from(collectedNodes.values());
}

const PurgeEntityContainer = (props: IPurgeEntityContainer) => {
    const [validList, setValidList] = useState<IListItem[]>([])
    const [selectedSheet, setSelectedSheet] = useState<Record<string, any>>({});
    const statusBarContext = useStatusBarContext();
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [showOkButton, setShowOkButton] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const checkListData = {
        uniqueName: "sampleListPanel1",
        allowCheckbox: false,
        allowRightIcon: true,
        allowMulticheck: false,
        allowCustomCheckLogic: false,
        allowHeader: true,
        headerText: "Team",
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
    };

    useEffect(() => {
        if (props.treeData && (props.checkedKeys || props.defulatSelectedKey)) {

            let data = FnFindUniquePathNodes(props.treeData, props.checkedKeys ?? {
                checked: [],
                halfChecked: []
            }, props.defulatSelectedKey ? props.defulatSelectedKey : undefined)
            data = data.filter((item) => item.EntID)
            let validateArr: IListItem[] = []
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                const obj: IListItem = {
                    label: element.Name,
                    id: index.toString(),
                    selected: index === 0,
                    ...element
                }
                validateArr.push(obj)
            }
            setValidList(validateArr)

        }
    }, [props.treeData, props.checkedKeys, props.defulatSelectedKey])

    useEffect(() => {
        if (validList.length > 0) {
            LoadSelectedSheet(0)
        }
    }, [validList])

    const LoadSelectedSheet = (sheetIndex: number) => {
        const selectedData = validList.filter((item: Record<string, any>) => item.id.toString() === sheetIndex.toString())
        if (selectedData.length > 0) {
            const selectedSheetData: Record<string, any> = {}
            selectedSheetData.tableName = selectedData[0].label;
            selectedSheetData.TableLabel = selectedData[0].TableLabel;
            const handleApiGetEntityRecordsForExport = (response: unknown, status?: string) => {
                if (status === "200" && Array.isArray(response)) {
                    const outputSheetData = response as Record<string, any>[];
                    if (outputSheetData.length > 0) {
                        const rowData = FnParseJsonSafely(outputSheetData[0].jsonData as string);
                        const columnArrayData = FnParseJsonSafely(outputSheetData[0].columnArray as string) as Record<string, any>[];

                        const columnArr: Record<string, any>[] = [];

                        columnArrayData?.forEach((element: Record<string, any>, index: number) => {
                            const obj: Record<string, any> = {
                                field: element.ColumnName,
                                resizable: columnArrayData.length === index + 1 ? false : true,
                                headerName: element.ColumnName,
                                minWidth: 120,
                                autoSize: false,
                            };
                            if (columnArrayData.length === index + 1) {
                                obj.flex = 1;
                            }
                            if (element.ColumnName?.toLowerCase() === "lastupdated" || element.ColumnName?.toLowerCase().includes('date')) {
                                obj.cellRenderer = (params: Record<string, any>) => {
                                    return <span>{params.value && FnIsValidDateInput(params.value) ? FnConvertDateToUtcOrUtcToDate(params.value, false, true) : params.value}</span>;
                                }
                            };
                            columnArr.push(obj);
                        });

                        selectedSheetData.column = columnArr;
                        selectedSheetData.rowData = rowData;
                    } else {
                        selectedSheetData.column = [];
                        selectedSheetData.rowData = [];
                    }
                    setSelectedSheet({ ...selectedSheetData });
                }
            }

            const payload = {
                "mode": "GRID",
                "entityName": selectedData[0].EntityName,
                "tableNames": selectedData[0].label,
                "excludeRecordId": false,
                "entIDs": "",
            }
            axiosInterceptor({
                url: EM.GetEntityRecordsForExport,
                data: payload,
                setFetchData: handleApiGetEntityRecordsForExport
            }, statusBarContext)
        }

    }

    const handlePurge = () => {
        setConfirmMessage("You must backup database before using this command because Data in selected table(s) will be permanently deleted. Are you sure to purge?")
        setShowOkButton(false)
        setIsConfirmOpen(true)
    }

    const handleConfirmPurge = () => {
        let entityName = ''
        let tableNames = []
        for (let index = 0; index < validList.length; index++) {
            const element = validList[index];
            entityName = element.EntityName
            tableNames.push(element.label)
        }

        const payload = {
            entityName: entityName,
            tableNames: tableNames.join(DELIMITER.separator),
        }


        axiosInterceptor({
            url: PURGE.PurgeTables,
            data: payload,
            setFetchData: (response: unknown, status?: string) => {
                if (status === "200") {
                    setConfirmMessage("Purge entity successfully");
                    setShowOkButton(true)
                    setIsConfirmOpen(true)
                } else if (status) {
                    setConfirmMessage("Purge entity failed. Please try again.");
                    setShowOkButton(true)
                    setIsConfirmOpen(true)
                }
            }
        }, statusBarContext)
    }

    return (
        <div className='nz-purge-entity-container'>
            <div className='nz-sub-header'>
                <Label uniqueName={`${props.uniqueName}-file`} label={`Purge Entity`} fontWeight="bold" />
                {selectedSheet && selectedSheet.TableLabel && (
                    <ActionImage
                        image={{
                            uniqueName: "purge",
                            source: <PurgeEntity24x24
                                size={FnGetCssVariable('--image-size-2')}
                                fill='none'
                                strokeWidth={1} />,
                            type: "svg",
                            w: "var(--image-size-2)",
                            h: "var(--image-size-2)",
                            tooltip: "Click to purge entity",
                        }}
                        w='var(--node_height)'
                        h='var(--node_height)'
                        uniqueName="purge"
                        actionCode="purge click"
                        handleMouse={handlePurge}
                    />
                )}
            </div>
            <div className={`nz-import-grid-list`}>
                {validList.length === 0 ? <div className="nz-no-data-found">
                    <Label uniqueName={`${props.uniqueName}-file`}
                        label={"Select file to preview data before Purge"}
                        fontWeight='bold'
                        fontSize="18px"
                    />
                </div> : <>
                    <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                        <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane">
                            <div className="nz-import-left-side">
                                {validList && <CheckedListPanel
                                    {...checkListData}
                                    headerText={`Tables (${validList.length})`}
                                    listItems={validList}

                                    handleItemSelect={(item: IListItem, listItems: IListItem[]) => {
                                        LoadSelectedSheet(Number(item.id))
                                    }}
                                />}
                            </div>
                        </SplitterPanel>
                        <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane">
                            <div className="nz-import-right-side">
                                <div className='nz-sub-header'>
                                    {selectedSheet && selectedSheet.TableLabel && (
                                        <Label
                                            uniqueName={`Entities-header`}
                                            label={`Sample records (max. 100) in ${selectedSheet.TableLabel} [${selectedSheet.tableName}]`}
                                        />
                                    )}
                                </div>
                                <div className="nz-import-grid">
                                    <div className='ng-import-dataGridDiv'>
                                        {selectedSheet.rowData?.length > 0 ? (
                                            <BasicGrid
                                                showGrid={true}
                                                uniqueName="export-grid"
                                                allowAutoSizeColumn={true}
                                                instanceName="export_table"
                                                featureId={props.featureId}
                                                isExportOnCopy={true}
                                                allowColumnResize={true}
                                                allowColumnFilter={true}
                                                exportFileName={
                                                    selectedSheet.TableLabel ? selectedSheet.TableLabel : "ExportData"
                                                }
                                                rowData={selectedSheet.rowData}
                                                isReadOnly={true}
                                                containerName="export_table"
                                                columnDefs={selectedSheet.column}
                                                allowPagination={true}
                                                dynamicPagination={true}
                                                paginationAutoPageSize={true}
                                            ></BasicGrid>
                                        ) : <div className="nz-no-data-to-show nz-wh-100 nz-d-flex-hv-left">
                                            <Label uniqueName={"No-data-found"} label={"No records to show !"} />
                                        </div>}
                                    </div>

                                </div>
                            </div>
                        </SplitterPanel>
                    </Splitter>

                </>}
            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={props.uniqueName + "confirmbox"}
                message={confirmMessage}
                showOkButton={showOkButton}
                handleYesButtonClick={function (): void {
                    handleConfirmPurge()
                }}
                handleNoButtonClick={function (): void {
                    setIsConfirmOpen(false)
                }}
                handleOkButtonClick={() => {
                    setIsConfirmOpen(false)
                    props.handleClearSelection && props.handleClearSelection()
                }}
            />
        </div>
    )
}

export { PurgeEntityContainer }
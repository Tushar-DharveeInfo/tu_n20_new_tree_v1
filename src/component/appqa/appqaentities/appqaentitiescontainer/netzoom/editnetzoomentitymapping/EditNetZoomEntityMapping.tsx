
import { useEffect, useState } from 'react'
import { CheckInfo } from 'rc-tree/lib/Tree'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Key } from 'rc-tree/lib/interface'
import { useStatusBarContext } from '../../../../../shared/context/hooks/StatusBarHooks'
import { axiosInterceptor } from '../../../../../shared/interceptors/Interceptor'
import '../../../../allcss/appqaentitiescontainer/netzoom/EditNetZoomEntityMapping.css'
import { EM, NZENTITY } from '../../../../../shared/interceptors/EndPoints'
import { FnHandleAPIResponse } from '../../../../../shared/allcommon/settingsform/FnHandleAPIResponse'
import { FnConvertHierarchicalDataToTree } from '../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree'
import { FnGetCheckedNodesForNetZoomEntites } from '../../../../allcommon/FnGetCheckedNodesForNetZoomEntites'
import { FnGetColumnDefinitionsFromRow } from '../../../../allcommon/FnGetColumnDefinitionsFromRow'
import { FnProcessStringToCompare } from '../../../../../shared/allcommon/basic/FnProcessStringToCompare'
import { IEditNetZoomEntityMapping } from '../../../../allinterface/iappqaentitiescontainer/netzoom/IEditNetZoomEntityMapping'
import { IConvertedTreeResponse, IFeatureTree, ITreeForHierarchicalDataContainer } from '../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer'
import { IBasicGridColDef } from '../../../../../shared/allinterface/tablegrid/IBasicGrid'
import { ITreeNode, ISelectedNodeInfo } from '../../../../../shared/allinterface/tree/ITreeControl';
import { Label } from '../../../../../shared/basic/label/Label'
import { BasicGrid } from '../../../../../shared/tablegrid/BasicGrid'
import { TreeForHierarchicalDataContainer } from '../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer'
import { OverlayTab } from '../../../../../shared/basic/overlaytab/OverlayTab'
import { IContainerSize } from '@n20a/libmiscfn'
import { D3Tree, ID3Tree } from '@n20a/libd3tree'
import { FnParseJsonSafely } from '../../../../../appcontainer/allcommon/FnParseJsonSafely'
import { Helptip } from '../../../../../shared/Help'


const EditNetZoomEntityMapping = (editNetZoomEntityMappingProps: IEditNetZoomEntityMapping) => {
    const [treeDataDeviceEntities, setTreeDataDeviceEntities] = useState<ITreeNode[]>([]);
    const [treeContainerProps, setTreeContainerProps] = useState<ITreeForHierarchicalDataContainer>();
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);

    // variables for tables 
    const [treeDataForTables, setTreeDataForTables] = useState<ITreeNode[]>([]);
    const [treeContainerPropsForTables, setTreeContainerPropsForTables] = useState<ITreeForHierarchicalDataContainer>();
    const [defaultSelectedKeysForTables, setDefaultSelectedKeysForTables] = useState<Key[]>([]);
    const [defaultExpandedKeysForTables, setDefaultExpandedKeysForTables] = useState<Key[]>([]);
    const [defaultCheckedKeysForTables, setDefaultCheckedKeysForTables] = useState<Key[]>([]);
    const [defaultCheckedNodesForTables, setDefaultCheckedNodesForTables] = useState<ITreeNode[]>([]);
    const [defaultSelectedNodeInfoForTables, setDefaultSelectedNodeInfoForTables] = useState<ISelectedNodeInfo | null>(null);

    // Grid API and column data 
    const [apiDataForGrid, setApiDataForGrid] = useState<Record<string, any>[]>([]);
    const [columnDefsForGrid, setColumnDefsForGrid] = useState<IBasicGridColDef[]>([]);
    const [displayMode, setDisplayMode] = useState<"Property" | "Preview">("Property");

    //Start Preview variables
    const [containerDimensions, setContainerDimensions] = useState<IContainerSize>({ width: 1200, height: 800 });
    const [loading, setLoading] = useState<boolean>(true);
    const [jsonData, setJsonData] = useState<ID3Tree>();

    //End Preview variables
    const statusBarContext = useStatusBarContext();

    useEffect(() => {
        // call API to get data for device entities
        const handleNameChange = async () => {
            const featureTreeProps: IFeatureTree = {
                instanceName: "nz_entity_treeview",
                allowCheckbox: false,
                allowIcon: false,
                hideCopyIcon: true,
                hideKebabMenu: true
            }
            const treeProps: ITreeForHierarchicalDataContainer = {
                uniqueName: `${editNetZoomEntityMappingProps.uniqueName}-create-entities-tree`,
                apiData: undefined,
                featureId: editNetZoomEntityMappingProps.featureId,
                featureTreeProps: featureTreeProps,
                allowGenerateTreeData: false
            }
            setTreeContainerProps(treeProps);
            const handleGetAllEntitiesApiResponse = async (getAllEntitiesApiResponse: unknown, status?: string) => {
                if (status === "200" && typeof getAllEntitiesApiResponse === "object" && getAllEntitiesApiResponse != null && 'entityJson' in getAllEntitiesApiResponse) {
                    const parsedData = FnParseJsonSafely(getAllEntitiesApiResponse.entityJson as string);
                    const convertResult: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(parsedData, treeProps)
                    if (convertResult) {

                        setTreeDataDeviceEntities(convertResult.treeData);
                        setDefaultExpandedKeys(convertResult.expandedKeys);
                        if (convertResult.selectedKey)
                            setDefaultSelectedKeys([convertResult.selectedKey]);
                        convertResult.selectedNode && setDefaultSelectedNodeInfo({
                            event: 'select',
                            selected: true,
                            node: convertResult.selectedNode,
                            selectedNodes: [convertResult.selectedNode]
                        });
                    }
                    else {
                        setTreeDataDeviceEntities([])
                    }
                }
            }
            axiosInterceptor({
                url: EM.GetAllEntities,
                data: {
                    entityType: "netzoom"
                },
                setFetchData: handleGetAllEntitiesApiResponse
            }, statusBarContext)

        }
        handleNameChange();
    }, [editNetZoomEntityMappingProps.uniqueName, editNetZoomEntityMappingProps.featureId])


    const handleNodeSelectDeviceTree = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        setDefaultSelectedNodeInfo(null);
        setTreeContainerPropsForTables(undefined);
        setDefaultExpandedKeysForTables([]);
        setDefaultCheckedKeysForTables([]);

        setDefaultSelectedNodeInfo(info);
        setDefaultSelectedKeys([info.node.key]);
        setDefaultExpandedKeys(expandedKeys);
    }

    useEffect(() => {
        if (defaultSelectedNodeInfo?.node) {
            if (displayMode === "Property") {
                const handleDeviceNodeSelectionChange = async () => {
                    const featureTreePropsForTables: IFeatureTree = {
                        instanceName: "nz_entity_tables_treeview",
                        allowCheckbox: true,
                        allowIcon: false,
                        hideCopyIcon: false,
                        hideKebabMenu: true,
                        allowCheckStrictly: false
                    }
                    const treePropsForTables: ITreeForHierarchicalDataContainer = {
                        uniqueName: `${editNetZoomEntityMappingProps.uniqueName}-tables-tree`,
                        apiData: undefined,
                        featureId: editNetZoomEntityMappingProps.featureId,
                        featureTreeProps: featureTreePropsForTables,
                        allowGenerateTreeData: false
                    }

                    const handleGetPgTablesApiResponse = async (getPgTablesApiResponse: unknown, status?: string) => {
                        if (status === "200" && typeof getPgTablesApiResponse === "object" && getPgTablesApiResponse != null && 'jsonString' in getPgTablesApiResponse) {
                            const parsedData = FnParseJsonSafely(getPgTablesApiResponse.jsonString as string);

                            function removeUnderscoreEntries(data: Record<string, any>) {
                                return {
                                    Tables: (data.Tables as Record<string, any>[]).map((table: Record<string, any>) => ({
                                        Name: table.Name,
                                        Description: table.Description,
                                        NodeType: table.NodeType,
                                        Dataset: (table.Dataset as Record<string, any>[]).filter(
                                            (item: Record<string, any>) => !item.Name.startsWith('_')
                                        )
                                    }))
                                };
                            }

                            const filterPgtables = removeUnderscoreEntries(parsedData);
                            const convertResult: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(filterPgtables, treePropsForTables);
                            if (convertResult) {

                                const checkedResult = FnGetCheckedNodesForNetZoomEntites(convertResult.treeData);
                                setTreeContainerPropsForTables(treePropsForTables);
                                setDefaultExpandedKeysForTables(convertResult.expandedKeys);
                                if (convertResult.selectedKey)
                                    setDefaultSelectedKeysForTables([convertResult.selectedKey]);
                                if (checkedResult.checkedKeys) {
                                    setDefaultCheckedKeysForTables(checkedResult.checkedKeys);
                                    setDefaultCheckedNodesForTables(checkedResult.checkedNodes);
                                    setTreeDataForTables(checkedResult.updatedTree);
                                }
                                else {
                                    setTreeDataForTables(convertResult.treeData);
                                }
                                convertResult.selectedNode && setDefaultSelectedNodeInfoForTables({
                                    event: 'select',
                                    selected: true,
                                    node: convertResult.selectedNode,
                                    selectedNodes: [convertResult.selectedNode]
                                });
                            }
                            else {
                                setTreeDataForTables([]);
                            }
                        }
                    }
                    axiosInterceptor({
                        url: NZENTITY.GetPgTables,
                        data: {
                            entityName: defaultSelectedNodeInfo.node.Name ?? ""
                        },
                        setFetchData: handleGetPgTablesApiResponse
                    }, statusBarContext)

                }
                handleDeviceNodeSelectionChange();
            } else {
                setLoading(true);
                axiosInterceptor({
                    url: EM.GetEntityDiagramData,
                    data: {
                        entityName: (defaultSelectedNodeInfo && defaultSelectedNodeInfo.node.Name) ? "__" + defaultSelectedNodeInfo.node.Name : ""
                    },
                    setFetchData: (response: unknown, status?: string) => {
                        if (status === "200" && response && typeof response === "object" && 'entityJson' in response) {
                            setLoading(false);
                            setJsonData(FnParseJsonSafely(response.entityJson as string))
                        } else {
                            setLoading(false);
                            setJsonData(undefined);
                        }
                    }
                }, statusBarContext)
            }
            // CALL api to get netZoomTables to get data

        }
    }, [defaultSelectedNodeInfo?.node, editNetZoomEntityMappingProps.uniqueName, editNetZoomEntityMappingProps.featureId, displayMode])

    const handleNodeSelectForTables = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        setDefaultSelectedKeysForTables([info.node.key]);
        setDefaultSelectedNodeInfoForTables(info);
        setDefaultExpandedKeysForTables(expandedKeys);
    }

    const handleNodeCheckForTables = (checked: Key[] | { checked: Key[]; halfChecked: Key[] }, info: CheckInfo<ITreeNode>) => {

        setDefaultCheckedKeysForTables(checked as Key[]);
        let defaultCheckedNodes = defaultCheckedNodesForTables;
        if (info.checked) {
            defaultCheckedNodes.push(info.node)
            setDefaultCheckedNodesForTables(defaultCheckedNodes);
        } else {
            defaultCheckedNodes = defaultCheckedNodesForTables.filter((element) => { return element.key !== info.node.key });
            setDefaultCheckedNodesForTables(defaultCheckedNodes);
        }

        const handleAssignPgTablesToEntityApiResponse = (assignPgTablesToEntityApiResponse: unknown, status?: string) => {
            if (status === "200" && assignPgTablesToEntityApiResponse !== null) {

            }
        }

        let pgTables: string[] = [];
        defaultCheckedNodes.forEach((element: ITreeNode) => {
            pgTables.push(element.Name ?? "");
        });

        axiosInterceptor({
            url: NZENTITY.AssignPgTablesToEntity,
            data: {
                entityType: "Netzoom",
                entityName: defaultSelectedNodeInfo?.node.Name ?? "",
                pgTablesJson: JSON.stringify(pgTables)
            },
            setFetchData: handleAssignPgTablesToEntityApiResponse
        }, statusBarContext);
    }

    useEffect(() => {
        if (defaultSelectedNodeInfoForTables?.node && FnProcessStringToCompare(defaultSelectedNodeInfoForTables?.node.treetype, "Dataset")) {
            const handleSelectedNodeChangeForTable = async () => {
                const handleGetPgPropertiesApiResponse = (getPgPropertiesApiResponse: unknown, status?: string) => {
                    if (status === "200" && getPgPropertiesApiResponse && typeof getPgPropertiesApiResponse === "object" && 'jsonString' in getPgPropertiesApiResponse) {
                        const parsedData = FnHandleAPIResponse(getPgPropertiesApiResponse.jsonString, "Dataset");
                        if (parsedData && parsedData.length > 0) {
                            setApiDataForGrid(parsedData);
                            const columnDefs = FnGetColumnDefinitionsFromRow(parsedData);
                            if (columnDefs.length > 0) {
                                setColumnDefsForGrid(columnDefs);
                            }
                        }
                        else {
                            setColumnDefsForGrid([]);
                            setApiDataForGrid([]);
                        }
                    } else {
                        setColumnDefsForGrid([]);
                        setApiDataForGrid([]);
                    }
                }
                axiosInterceptor({
                    url: NZENTITY.GetPgProperties,
                    data: {
                        tableName: defaultSelectedNodeInfoForTables.node.Name ?? ""
                    },
                    setFetchData: handleGetPgPropertiesApiResponse
                }, statusBarContext)

            }
            handleSelectedNodeChangeForTable();
        }
        else {
            setColumnDefsForGrid([]);
            setApiDataForGrid([]);
        }
    }, [defaultSelectedNodeInfoForTables?.node])

    let tabsObj = [
        {
            "label": "Property",
            "tooltip": "Assign/unassign property tables"
        },
        {
            "label": "Preview",
            "tooltip": "Preview Entity Data Structure"
        }
    ]

    const handleSelectedTabs = (tab: string[]) => {
        if (tab.length) {
            setDisplayMode(tab[0] as "Property" | "Preview")

        }
    }
    function handleCtrlLinkClick(nodeData: { EntId?: string | undefined; EntityName?: string | undefined; }): void {
    }
    return (
        <div className='nz-netzoom-entites-main-container'>
            <div className='nz-sub-header'>
                <OverlayTab
                    uniqueName={`${editNetZoomEntityMappingProps.uniqueName}-replacement-overlay`}
                    tabs={tabsObj && tabsObj.map((t, index) => ({
                        uniqueName: `${editNetZoomEntityMappingProps.uniqueName}-overlay-tab-${index}`,
                        label: {
                            uniqueName: `${editNetZoomEntityMappingProps.uniqueName}-overlay-tab-${index}-label`,
                            label: t.label,
                            tooltip: t.tooltip
                        },
                        w: "auto",
                        h: "calc(var(--node_height) - var(--spacing-1))",
                        actionCode: t.label,
                        handleMouse: function (event: Record<string, any>, actionCode?: string): void {
                        }
                    }))}
                    allowUnSelect={true}
                    selectedTabName={displayMode}
                    tabAlignment={"horizontal"}
                    headerText={`${editNetZoomEntityMappingProps.selectedFeatureItem && editNetZoomEntityMappingProps.selectedFeatureItem.Label}` || ""}
                    useContainer={false}
                    handleSelectedTab={handleSelectedTabs}

                />
            </div>
            {editNetZoomEntityMappingProps.helptipString && <Helptip uniqueName={`${editNetZoomEntityMappingProps.uniqueName}-helptip`}
                mdString={editNetZoomEntityMappingProps.helptipString} />}
            <div className='nz-netzoom-entites-container'>
                <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center ">

                        <div className='nz-create-entites-pane'>
                            <div className='nz-sub-header'>
                                <Label uniqueName={`${editNetZoomEntityMappingProps.uniqueName}-entities-header`} label={editNetZoomEntityMappingProps.subGroup}
                                />
                            </div>

                            {treeContainerProps && treeDataDeviceEntities && <TreeForHierarchicalDataContainer
                                {...treeContainerProps}
                                key={'nz-netzoom-entities-tree'}
                                className='nz-netzoom-entities-tree'
                                apiData={treeDataDeviceEntities}
                                defaultExpandedKeys={defaultExpandedKeys}
                                defaultSelectedKeys={defaultSelectedKeys}
                                defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                                handleNodeSelect={handleNodeSelectDeviceTree}

                            />}
                        </div>
                    </SplitterPanel>
                    {displayMode === "Property" ? <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center">
                        <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                            <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center ">

                                <div className='nz-tables-pane'>
                                    <div className='nz-sub-header'>
                                        <Label uniqueName={`${editNetZoomEntityMappingProps.uniqueName}-tables-header`} label={`Tables of ${defaultSelectedNodeInfo?.node.Name}`}
                                        />
                                    </div>
                                    {treeContainerPropsForTables && treeDataForTables && defaultSelectedNodeInfo?.node && <TreeForHierarchicalDataContainer
                                        {...treeContainerPropsForTables}
                                        key={'nz-tables-tree'}
                                        className='nz-tables-tree'
                                        apiData={treeDataForTables}
                                        defaultExpandedKeys={defaultExpandedKeysForTables}
                                        defaultSelectedKeys={defaultSelectedKeysForTables}
                                        defaultSelectedNodeInfo={defaultSelectedNodeInfoForTables || undefined}
                                        defaultCheckedKeys={defaultCheckedKeysForTables}
                                        handleNodeSelect={handleNodeSelectForTables}
                                        handleNodeCheck={handleNodeCheckForTables}
                                    />}

                                </div>
                            </SplitterPanel>
                            <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center">

                                <div className='nz-table-properties-pane'>
                                    <div className='nz-sub-header'>
                                        <Label uniqueName={`${editNetZoomEntityMappingProps.uniqueName}-table-properties-header`} label={"Properties"}
                                        />
                                    </div>
                                    {defaultSelectedNodeInfoForTables?.node && columnDefsForGrid && <BasicGrid
                                        featureId={editNetZoomEntityMappingProps.featureId}
                                        uniqueName={`${editNetZoomEntityMappingProps.uniqueName}-grid-container`}
                                        instanceName={'populate_nz_entity_tables'}
                                        showGrid={true}
                                        hideRowKebabMenu={true}
                                        allowColumnResize={true}
                                        allowColumnFilter={true}
                                        rowData={apiDataForGrid}
                                        columnDefs={columnDefsForGrid}
                                        allowPagination={true}
                                        dynamicPagination={true}
                                        paginationAutoPageSize={true}
                                        isExportOnCopy={true}
                                        exportFileName={defaultSelectedNodeInfoForTables?.node.Name || "TableProperties"}
                                        featureData={undefined}
                                        containerName={''}
                                    />}
                                </div>
                            </SplitterPanel>
                        </Splitter>
                    </SplitterPanel> :
                        <div className='nz-w-100 nz-h-100'>
                            {loading ? (
                                <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>
                            ) : (
                                jsonData ? (
                                    <D3Tree
                                        key={`${containerDimensions.width}-${containerDimensions.height}`}
                                        containerDimensions={containerDimensions}
                                        treeData={jsonData}
                                        orientation="vertical"
                                        useIcons={true}
                                        handleCtrlLinkClick={handleCtrlLinkClick}
                                    />

                                ) : <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>
                            )}
                        </div>}
                </Splitter>
            </div>
        </div>
    )
}

export { EditNetZoomEntityMapping }
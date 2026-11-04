
import { useEffect, useRef, useState } from 'react'
import { Key } from 'rc-tree/lib/interface';
import { useStatusBarContext } from '../../../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../../../shared/interceptors/Interceptor';
import '../../../../allcss/appqasettingscontainer/template/ChartTemplate.css'
import { EM, LOG } from '../../../../../shared/interceptors/EndPoints';
import { SettingSubgroups } from '../../../../../constants/Feature';
import { EntityNameEnums, RootNode } from '../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { FnTransformDataToHierarchy } from '../../../../allcommon/FnTransformDataToHierarchy';
import { FnConvertHierarchicalDataToTree } from '../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree';
import { FnHandleAPIResponse } from '../../../../../shared/allcommon/settingsform/FnHandleAPIResponse';
import { IControl } from '../../../../../shared/allinterface/settingsform/ISettingsLibForm';
import { IChartTemplate } from '../../../../allinterface/iappqasettingscontainer/template/IChartTemplate';
import { IConvertedTreeResponse, IFeatureTree, ITreeForHierarchicalDataContainer } from '../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer';
import { ITreeNode, ISelectedNodeInfo } from '../../../../../shared/allinterface/tree/ITreeControl';
import { TreeWithFormEditor } from '../reporttemplate/treewithformeditor/TreeWithFormEditor';
import { YesNoFormContainer } from '../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { useChartProfileContext } from '../../../../../shared/context/hooks/ChartProfileHooks';
import { IFnCreateForensiclog } from '../../../../../appcontainer/allinterface/IFnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { FnCreateForensiclog } from '../../../../../appcontainer/allcommon/FnCreateForensiclog';
import { useSessionContext } from '../../../../../shared/context/hooks/SessionHooks';
import { useMainAppContext } from '../../../../../shared/context/hooks/MainAppHooks';
import { FnParseJsonSafely } from '../../../../../appcontainer/allcommon/FnParseJsonSafely';

const ChartTemplate = (chartTemplateProps: IChartTemplate) => {
    const [controlData, setControlData] = useState<IControl[]>([]);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [profileString, setProfileString] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [disableDelete, setDisableDelete] = useState<boolean>(true);
    const [isAddMode, setIsAddMode] = useState<boolean>(false);
    const [allowRenderForm, setAllowRenderForm] = useState<boolean>(false);
    const [apiDataForTree, setApiDataForTree] = useState<unknown>();
    const [entityName, setEntityName] = useState<string>("");
    const [treeContainerProps, setTreeContainerProps] = useState<ITreeForHierarchicalDataContainer>()

    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const chartProfileContext = useChartProfileContext()

    const lastModifiedNodeEntIDRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const handleNameChange = async () => {
            const fProps: IFeatureTree = {
                instanceName: "template_treeview",
                allowCheckbox: false,
                allowIcon: false,
                hideCopyIcon: false,
                hideKebabMenu: true
            };

            // call api to get controls and get data for tree
            setControlData(chartTemplateProps.formControls);
            const treeProps: ITreeForHierarchicalDataContainer = {
                uniqueName: `${chartTemplateProps.uniqueName}-create-entities-tree`,
                apiData: undefined,
                featureId: chartTemplateProps.featureId,
                featureTreeProps: fProps,
                allowGenerateTreeData: false
            }
            setTreeContainerProps(treeProps);
            let entityName: string | null = null;
            if (chartTemplateProps.selectedSubGroup === SettingSubgroups.ChartTemplate) {
                entityName = EntityNameEnums.ChartProfile;
                setEntityName(entityName);
            }
            const rootNode = RootNode;
            rootNode.Name = chartTemplateProps.selectedSubGroup;
            rootNode.Description = chartTemplateProps.selectedSubGroup;
            if (chartTemplateProps.apiData && Object.keys(chartTemplateProps.apiData)?.length > 0) {
                setApiDataForTree(chartTemplateProps.apiData);
            }
        }
        handleNameChange();
    }, [chartTemplateProps.selectedSubGroup, chartTemplateProps.uniqueName, chartTemplateProps.featureId
        , chartTemplateProps.formControls, chartTemplateProps.apiData])

    useEffect(() => {
        const handleApiDataChange = async () => {
            if (apiDataForTree && treeContainerProps) {
                const records = (apiDataForTree as any)[Object.keys(apiDataForTree)[0]];
                if (records) {
                    const rootNode = RootNode;
                    rootNode.Name = chartTemplateProps.selectedSubGroup;
                    rootNode.Description = chartTemplateProps.selectedSubGroup;
                    const result = await FnTransformDataToHierarchy(records, ['GroupName'], `_${entityName}`, "EntID", rootNode.EntID, true);

                    if (result) {

                        (rootNode.children as any) = result;
                        const convertedData: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree({ "data": [rootNode] }, treeContainerProps, lastModifiedNodeEntIDRef.current);
                        if (convertedData) {
                            setTreeData(convertedData.treeData);
                            setDefaultExpandedKeys(convertedData.expandedKeys);
                            if (convertedData.selectedKey)
                                setDefaultSelectedKeys([convertedData.selectedKey]);
                            if (convertedData.selectedNode && convertedData.selectedNode.NodeEntityname === EntityNameEnums.ChartProfile) {
                                const nodeData = { ...convertedData.selectedNode };
                                nodeData.title = "";
                                nodeData.icon = null;
                                setProfileString(JSON.stringify([nodeData]));
                                setAllowRenderForm(true);
                                setDisableDelete(false);
                                setIsAddMode(false);
                            }
                            else {
                                setAllowRenderForm(false);
                                setDisableDelete(true);
                            }
                            setControlData([...controlData])
                            if (convertedData.selectedNode) setDefaultSelectedNodeInfo({
                                event: 'select',
                                selected: true,
                                node: convertedData.selectedNode,
                                selectedNodes: [convertedData.selectedNode]
                            });
                        }
                    }
                }
            }
        }
        handleApiDataChange();
    }, [apiDataForTree, treeContainerProps]);

    const handleAIClick = (event: any, actionCode?: string | undefined) => {
        if (actionCode === "add") {
            setDefaultSelectedNodeInfo(null);
            setDefaultSelectedKeys([]);
            setProfileString("");
            setDisableDelete(true);
            setAllowRenderForm(true);
            setControlData([...controlData]);
            setIsAddMode(true);
        }
        else if (actionCode === "delete") {
            const handleCreateMessageApiResponse = (createMessageApiResponse: unknown, status?: string) => {
                if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                    setConfirmMessage(createMessageApiResponse.finalMessage as string);
                    setIsConfirmOpen(true);
                }
            }
            axiosInterceptor({
                url: LOG.CreateMessage,
                data: {
                    projectInitial: "Common",
                    msgID: "151"
                },
                setFetchData: handleCreateMessageApiResponse
            }, statusBarContext)

        }
    }

    const callApiForRefreshTreeData = (entityName: string, tableName: string) => {
        const handleGetEntityRecordsApiResponse = (getEntityRecordsApiResponse: unknown, status?: string) => {
            if (status === "200" && getEntityRecordsApiResponse && typeof getEntityRecordsApiResponse === "string") {
                const parsedData = FnHandleAPIResponse(getEntityRecordsApiResponse, "Dataset");
                setDefaultExpandedKeys([]);
                setDefaultSelectedKeys([]);
                setDefaultSelectedNodeInfo(null);
                setTreeData([]);
                setApiDataForTree(parsedData);
                chartProfileContext.setChartProfiles(parsedData);
            }
        }
        axiosInterceptor({
            url: EM.GetEntityRecords,
            data: {
                "entityName": entityName,
                "entIDs": "",
                "tableName": tableName,
                "filterJsonString": null,
                "andor": "OR",
                "startRec": 0,
                "endRec": 0
            },
            setFetchData: handleGetEntityRecordsApiResponse
        }, statusBarContext)
    }

    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        if (info && info.node && info.node.NodeEntityname === EntityNameEnums.ChartProfile) {
            const nodeData = { ...info.node };
            nodeData.title = "";
            nodeData.icon = null;
            setProfileString(JSON.stringify([nodeData]));
            setAllowRenderForm(true);
            setControlData([...controlData]);
            setDisableDelete(false);
        }
        else {
            setDisableDelete(true);
            setAllowRenderForm(false);
        }
        setIsAddMode(false);
        setDefaultSelectedNodeInfo(info);
        setDefaultSelectedKeys([info.node.key]);
        setDefaultExpandedKeys(expandedKeys);
    }

    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        let entityTable = `_${entityName}`;
        const handleAddEditEntityRecordResponse = (addEntityRecordResponse: unknown, status?: string) => {
            if (status === "200" && addEntityRecordResponse && typeof addEntityRecordResponse === "object" && 'jsonStringOutput' in addEntityRecordResponse) {
                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Entity,
                    SubGroupName: LogSubGroupName.Entity,
                    LogName: id ? LogName.UpdateEntity : LogName.AddEntity,
                    actionObject: {
                        Name: profileJson[entityTable],
                        FeatureName: chartTemplateProps.selectedSubGroup,
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)
                let parsedData = FnParseJsonSafely(addEntityRecordResponse.jsonStringOutput as string);
                if (parsedData && parsedData[entityTable].length > 0) {
                    lastModifiedNodeEntIDRef.current = parsedData[entityTable][0].RecID;
                }

                callApiForRefreshTreeData(entityName, entityTable);
                const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
                if (saveButton) {
                    saveButton.style.display = "none";
                }
            }
        }

        const parsedData = profileData && typeof profileData === "string" && FnParseJsonSafely(profileData);
        const profileJson: any = {};
        for (let index = 0; index < controlData.length; index++) {
            const element = controlData[index];
            profileJson[element._AP] = parsedData[0][element._AP]
        }
        if (id) {

            profileJson["RecID"] = parsedData[0].RecID;
            profileJson["EntID"] = parsedData[0].NodeEntID;

        }
        profileJson["EntityName"] = entityName;
        let jsonData = { [entityTable]: [profileJson] };
        axiosInterceptor({
            url: EM.AddUpdateTableRecord,
            data: {
                jsonString: JSON.stringify(jsonData)
            },
            setFetchData: handleAddEditEntityRecordResponse
        }, statusBarContext);

        const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
        if (saveButton) {
            saveButton.style.display = "none";
        }
    }

    const handleClickYesForConfirm = () => {
        setIsConfirmOpen(false);
        const handleDeleteEntityRecordsApiResponse = (deleteEntityRecordsApiResponse: unknown, status?: string) => {
            if (status === "200" && deleteEntityRecordsApiResponse !== undefined) {
                lastModifiedNodeEntIDRef.current = undefined;
                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Entity,
                    SubGroupName: LogSubGroupName.Entity,
                    LogName: LogName.DeleteEntity,
                    actionObject: {
                        Name: defaultSelectedNodeInfo?.node.Name,
                        FeatureName: chartTemplateProps.selectedSubGroup,
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)
                callApiForRefreshTreeData(entityName, `_${entityName}`);
            }
        }
        if (defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
            axiosInterceptor({
                url: EM.DeleteEntityRecords,
                data: {
                    entityName: entityName,
                    entIDs: defaultSelectedNodeInfo.node.NodeEntID
                },
                setFetchData: handleDeleteEntityRecordsApiResponse
            }, statusBarContext);
        }
    }

    return (
        <div key={chartTemplateProps.uniqueName} className='nz-template-container'>
            {controlData && treeData && treeContainerProps && <TreeWithFormEditor
                uniqueName={`${chartTemplateProps.uniqueName}-chart_template`}
                formControls={allowRenderForm ? controlData : []}
                treeData={treeData}
                defaultSelectedKeys={defaultSelectedKeys}
                defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                defaultExpandedKeys={defaultExpandedKeys}
                featureTreeProps={treeContainerProps.featureTreeProps}
                allowShowHeader={false}
                headerText={isAddMode === false ? `Edit ${chartTemplateProps.selectedSubGroup}` : `Add  ${chartTemplateProps.selectedSubGroup}`}
                profileString={profileString}
                id={defaultSelectedNodeInfo?.node?.RecID || ""}
                headerTextForTree={chartTemplateProps.selectedSubGroup}
                allowAdd={true}
                allowDelete={true}
                entityName={entityName}
                disableAdd={isAddMode === true}
                disableDelete={disableDelete}
                handleAIClick={handleAIClick}
                handleNodeSelect={handleNodeSelect}
                handleSaveAction={handleSaveAction} isDisableForm={false} />}
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={`${chartTemplateProps.uniqueName}-confirm-dialog`}
                message={confirmMessage}
                handleYesButtonClick={handleClickYesForConfirm}
                handleNoButtonClick={() => {
                    setIsConfirmOpen(false);
                }} />
        </div>
    )
}
export { ChartTemplate }

import { FnGetApiProfiles } from "../../../../../shared/allcommon/FnGetApiProfiles";

import { JSX, useEffect, useRef, useState } from 'react'
import { Key } from 'rc-tree/lib/interface';
import { useSessionContext } from '../../../../../shared/context/hooks/SessionHooks';
import { useStatusBarContext } from '../../../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../../../shared/interceptors/Interceptor';
import '../../../../allcss/appqasettingscontainer/template/ReportTemplate.css';
import { EM, FS, LOG } from '../../../../../shared/interceptors/EndPoints';
import { SettingSubgroups } from '../../../../../constants/Feature';
import { EntityNameEnums, RootNode, FileGroupNameEnums } from '../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { Copy24x24, Edit24x24, Export24x24, Import24x24, Report24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../../../appcontainer/allcommon/FnGetCssVariable';
import { FnTransformDataToHierarchy } from '../../../../allcommon/FnTransformDataToHierarchy';
import { FnConvertHierarchicalDataToTree } from '../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree';
import { FnHandleAPIResponse } from '../../../../../shared/allcommon/settingsform/FnHandleAPIResponse';
import { IControl } from '../../../../../shared/allinterface/settingsform/ISettingsLibForm';
import { IReportTemplate } from '../../../../allinterface/iappqasettingscontainer/template/IReportTemplate';
import { IActionImage } from '../../../../../shared/allinterface/basic/IActionImage';
import { IConvertedTreeResponse, IFeatureTree, ITreeForHierarchicalDataContainer } from '../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer';
import { ITreeNode, ISelectedNodeInfo } from '../../../../../shared/allinterface/tree/ITreeControl';
import { TreeWithFormEditor } from './treewithformeditor/TreeWithFormEditor';
import { YesNoFormContainer } from '../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { EditReportLayout } from './editreportlayout/EditReportLayout';
import { useCommonVariableContext } from '../../../../../shared/context/hooks/CommonVariableHooks';
import { JsonViewer } from '../../../../../shared/jsonviewer/JsonViewer';
import { useReportContext } from '../../../../../shared/context/hooks/ReportHooks';
import { FnGenerateUniqueId } from '../../../../../shared/allcommon/basic/FnGenerateUniqueId';
import { InMemoryUrlProvider } from '../../../../../shared/context/contextandprovider/InMemoryUrl';
import { IMemoryUrlItem } from '../../../../../shared/context/allinterface/IInMemoryUrl';
import { FnInMemoryUrlForAPI } from '../../../../../shared/allcommon/charts/FnInMemoryUrlForAPI';
import { useInMemoryUrlContext } from '../../../../../shared/context/hooks/InMemoryUrlHooks';
import { useChartProfileContext } from '../../../../../shared/context/hooks/ChartProfileHooks';
import { useAgent } from '@n20a/libmcpclient';
import { useMainAppContext } from '../../../../../shared/context/hooks/MainAppHooks';
import { useSelectedNodeContext } from '../../../../../shared/context/hooks/SelectedNodeHooks';
import { FnCreateForensiclog } from '../../../../../appcontainer/allcommon/FnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { IFnCreateForensiclog } from '../../../../../appcontainer/allinterface/IFnCreateForensiclog';
import { FnParseJsonSafely } from '../../../../../appcontainer/allcommon/FnParseJsonSafely';
import { FnDownloadAllReportTemplates } from '../../../../allcommon/FnDownloadAllReportTemplates';
import { FnImportAllReportTemplates } from '../../../../allcommon/FnImportAllReportTemplates';
import {
    applyDefaultReportLayoutIfNeeded,
    decodeReportTemplateBlob,
    getEntityDatasetRecords,
    getLoginShortNameFromSession,
    getReportProfileTemplateFileNameFromNode,
    hasUploadedReportTemplateFile,
    isProtectedDefaultTemplate,
    isReportProfileNode,
    parseNodeDetailRecord,
    prepareReportProfileNodeForForm,
    resolveReportProfileTemplateFileName,
    DEFAULT_REPORT_TEMPLATE_EXTENSION
} from '../../../../allcommon/FnReportTemplateHelpers';
import { FnUpdateTreeNode } from '../../../../allcommon/FnUpdateTreeNode';
import { ISelectedNodeProperty } from '../../../../../shared/context/allinterface/ISelectedNode';
import { FnGetKebabMenuDataByEntity } from '../../../../allcommon/FnGetKebabMenuDataByEntity';
import { FnGetWorkorderProfile } from '../../../../allcommon/FnGetWorkorderProfile';

type IReportHierarchyRow = Record<string, unknown>;
type IReportProfileFormRow = Record<string, unknown>;
const EMPTY_REPORT_PROFILE_ROWS: IReportProfileFormRow[] = [];

const getFileExtensionFromFileName = (fileName?: string | null): string => {
    const normalizedFileName = fileName?.trim();
    if (!normalizedFileName?.includes(".")) {
        return `.${DEFAULT_REPORT_TEMPLATE_EXTENSION}`;
    }

    const extension = normalizedFileName.slice(normalizedFileName.lastIndexOf(".")).toLowerCase();
    return extension.startsWith(".") ? extension : `.${extension}`;
};

const getReportProfileNodeRecord = (
    node: ITreeNode
): Record<string, unknown> => parseNodeDetailRecord(node.NodeDetail) ?? { ...node };

const getReportProfileSelectionId = (node?: ITreeNode | null): string | undefined =>
    node?.NodeEntID || (node?.key != null ? String(node.key) : undefined);

const isTemplateLoadedForNode = (
    node: ITreeNode | undefined | null,
    loadedNodeId: string | undefined
): boolean => {
    const selectedNodeId = getReportProfileSelectionId(node);
    return Boolean(selectedNodeId && loadedNodeId && selectedNodeId === loadedNodeId);
};

const collectReportProfileNodeEntIDs = (nodes?: ITreeNode[]): Set<string> => {
    const entIDs = new Set<string>();
    const visitNodes = (nodeList?: ITreeNode[]) => {
        nodeList?.forEach((node) => {
            if (isReportProfileNode(node) && node.NodeEntID) {
                entIDs.add(String(node.NodeEntID));
            }
            visitNodes(node.children);
        });
    };
    visitNodes(nodes);
    return entIDs;
};

const getReportProfileRecordsForEntIDs = (
    apiData: unknown,
    entityName: string,
    entIDs: Set<string>
): Record<string, unknown>[] => {
    if (!apiData || typeof apiData !== "object") {
        return [];
    }

    const entityTable = `_${entityName}`;
    const records = (apiData as Record<string, unknown>)[entityTable];
    if (!Array.isArray(records)) {
        return [];
    }

    return records.filter((record) => entIDs.has(String((record as Record<string, unknown>).EntID)));
};

const isGroupNode = (node?: ITreeNode | null): boolean =>
    Boolean(node && !isReportProfileNode(node) && node.NodeType?.toLowerCase() !== "helptip");

const normalizeReportProfileName = (profileName?: unknown): string =>
    String(profileName ?? "").trim().toLowerCase();

const getSelectedGroupName = (node?: ITreeNode | null): string =>
    isGroupNode(node) ? String(node?.Name ?? "").trim() : "";

const applyGroupNameDefaultToControls = (
    controls: IControl[],
    groupName: string
): IControl[] => {
    if (!groupName) {
        return controls;
    }

    return controls.map((control) =>
        control.Name === "GroupName"
            ? { ...control, DefaultAPValue: groupName }
            : control
    );
};

const buildAddModeProfileString = (groupName: string): string =>
    groupName ? JSON.stringify([{ GroupName: groupName }]) : "";

const ReportTemplate = (reportTemplateProps: IReportTemplate) => {
    const [controlData, setControlData] = useState<IControl[]>([]);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [profileString, setProfileString] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [disableDelete, setDisableDelete] = useState<boolean>(true);
    const [allowCustomIcon, setAllowCustomIcon] = useState<boolean>(false);
    const [isAddMode, setIsAddMode] = useState<boolean>(false);
    const [allowRenderForm, setAllowRenderForm] = useState<boolean>(false);
    const [apiDataForTree, setApiDataForTree] = useState<unknown>();
    const [entityName, setEntityName] = useState<string>("");
    const [treeContainerProps, setTreeContainerProps] = useState<ITreeForHierarchicalDataContainer>()
    const [controlHtmlToRender, setControlHtmlToRender] = useState<JSX.Element | null>(null);
    const [reportLayoutTemplate, setReportLayoutTemplate] = useState<string>();
    const [previewEditIcons, setPreviewEditIcons] = useState<IActionImage[]>()
    const [isPreviewEditDisabled, setIsPreviewEditDisabled] = useState<boolean>();
    const [isShowOkButton, setIsShowOkButton] = useState<boolean>(false);

    const lastModifiedNodeEntIDRef = useRef<string | undefined>(undefined);
    const templateLoadRequestIdRef = useRef(0);
    const loadedTemplateNodeIdRef = useRef<string | undefined>(undefined);
    const pendingSavedTemplateByNodeIdRef = useRef<Map<string, string>>(new Map());

    const storePendingSavedTemplate = (entId: string, formRow: Record<string, unknown>) => {
        const fileBlob = formRow.FPFileContent;
        if (!fileBlob || typeof fileBlob !== "string") {
            return;
        }

        const decodedTemplate = decodeReportTemplateBlob(fileBlob);
        if (decodedTemplate) {
            pendingSavedTemplateByNodeIdRef.current.set(entId, JSON.stringify(decodedTemplate));
        }
    };

    const enrichReportProfileTreeNode = (
        node: ITreeNode,
        records: IReportHierarchyRow[]
    ): ITreeNode => {
        const nodeId = node.NodeEntID ?? node.EntID;
        const matchingRecord = records.find(
            (record) => String(record.EntID) === String(nodeId) || String(record.NodeEntID) === String(nodeId)
        );
        if (!matchingRecord || typeof matchingRecord !== "object") {
            return {
                ...node,
                EntID: node.EntID ?? node.NodeEntID,
            };
        }

        return {
            ...matchingRecord,
            ...node,
            EntID: matchingRecord.EntID ?? node.NodeEntID ?? node.EntID,
            NodeEntID: node.NodeEntID ?? (matchingRecord.EntID as string),
            TemplateFileName: node.TemplateFileName || matchingRecord.TemplateFileName,
            FileUID: node.FileUID || matchingRecord.FileUID,
            _ReportProfile: node._ReportProfile || matchingRecord._ReportProfile || node.Name,
        };
    };

    const clearLoadedTemplateState = () => {
        setReportLayoutTemplate(undefined);
        setIsPreviewEditDisabled(true);
        loadedTemplateNodeIdRef.current = undefined;
    };

    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();
    const reportContext = useReportContext();
    const commonVariableContext = useCommonVariableContext();
    const InMemoryUrlContext = useInMemoryUrlContext();
    const mainAppContext = useMainAppContext();
    const chartProfileContext = useChartProfileContext();
    const { sendPrompt } = useAgent();
    const selectedNodeContext = useSelectedNodeContext();

    const workOrder = sessionContext?.SessionList?.find(
        (item) => item.VariableName?.toLowerCase() === "selectedworkorder"
    )?.SessionValue;

    const openOkConfirm = (message: string) => {
        setConfirmMessage(message);
        setIsShowOkButton(true);
        setIsConfirmOpen(true);
    };

    const getScopedApiDataForBulkAction = (nodes: ITreeNode[]): unknown => {
        if (!isGroupNode(defaultSelectedNodeInfo?.node)) {
            return apiDataForTree;
        }

        const scopedEntIDs = collectReportProfileNodeEntIDs(nodes);
        const scopedRecords = getReportProfileRecordsForEntIDs(apiDataForTree, entityName, scopedEntIDs);
        return {
            ...(apiDataForTree && typeof apiDataForTree === "object" ? apiDataForTree as Record<string, unknown> : {}),
            [`_${entityName}`]: scopedRecords,
        };
    };

    const getBulkActionTreeData = (): ITreeNode[] => {
        const selectedNode = defaultSelectedNodeInfo?.node;
        if (selectedNode && isGroupNode(selectedNode)) {
            return [selectedNode];
        }

        return treeData;
    };

    const getReportProfileRecords = (): Record<string, unknown>[] => {
        if (!apiDataForTree || typeof apiDataForTree !== "object" || !entityName) {
            return [];
        }

        const records = (apiDataForTree as Record<string, unknown>)[`_${entityName}`];
        return Array.isArray(records) ? records as Record<string, unknown>[] : [];
    };

    const getExistingReportProfileNames = (): string[] =>
        getReportProfileRecords()
            .map((record) => String(record._ReportProfile ?? "").trim())
            .filter(Boolean);

    const isDuplicateReportProfileName = (
        profileName: unknown,
        currentProfileIDs: (string | undefined | null)[]
    ): boolean => {
        const normalizedProfileName = normalizeReportProfileName(profileName);
        if (!normalizedProfileName) {
            return false;
        }

        const currentIDs = new Set(currentProfileIDs.filter(Boolean).map(String));
        return getReportProfileRecords().some((record) => {
            const recordName = normalizeReportProfileName(record._ReportProfile);
            if (recordName !== normalizedProfileName) {
                return false;
            }

            const recordIDs = [record.EntID, record.NodeEntID, record.RecID]
                .filter(Boolean)
                .map(String);
            return !recordIDs.some((recordID) => currentIDs.has(recordID));
        });
    };

    const hideSettingsSaveButton = () => {
        const saveButton: HTMLDivElement | null = document.querySelector(
            '.nz-form-action-header .nz-form-header-action-save'
        );
        if (saveButton) {
            saveButton.style.display = 'none';
        }
    };

    useEffect(() => {
        const handleNameChange = () => {
            try {
                const fProps: IFeatureTree = {
                    instanceName: "template_treeview",
                    allowCheckbox: false,
                    allowIcon: false,
                    hideCopyIcon: false,
                    hideKebabMenu: true
                };
                setControlData(reportTemplateProps.formControls);
                const treeProps: ITreeForHierarchicalDataContainer = {
                    uniqueName: `${reportTemplateProps.uniqueName}-create-entities-tree`,
                    apiData: undefined,
                    featureId: reportTemplateProps.featureId,
                    featureTreeProps: fProps,
                    allowGenerateTreeData: false
                };
                setTreeContainerProps(treeProps);

                if (reportTemplateProps.selectedSubGroup === SettingSubgroups.ReportTemplate) {
                    setEntityName(EntityNameEnums.ReportProfile);
                }

                if (reportTemplateProps.apiData && Object.keys(reportTemplateProps.apiData)?.length > 0) {
                    setApiDataForTree(reportTemplateProps.apiData);
                }
            } catch (error) {
                console.error('Failed to initialize report template settings:', error);
            }
        };
        handleNameChange();
    }, [reportTemplateProps.selectedSubGroup, reportTemplateProps.uniqueName, reportTemplateProps.featureId
        , reportTemplateProps.formControls, reportTemplateProps.apiData
    ])

    useEffect(() => {
        const handleApiDataChange = async () => {
            if (!apiDataForTree || !treeContainerProps || !entityName) {
                return;
            }

            try {
                const records = getEntityDatasetRecords(apiDataForTree) as IReportHierarchyRow[] | null;
                if (!records) {
                    return;
                }

                const rootNode = {
                    ...RootNode,
                    Name: reportTemplateProps.selectedSubGroup,
                    Description: reportTemplateProps.selectedSubGroup,
                };
                const result = await FnTransformDataToHierarchy<IReportHierarchyRow>(
                    records,
                    ['GroupName'],
                    `_${entityName}` as keyof IReportHierarchyRow,
                    'EntID' as keyof IReportHierarchyRow,
                    rootNode.EntID,
                    true
                );

                if (!result) {
                    return;
                }

                const rootNodeWithChildren = {
                    ...rootNode,
                    children: result,
                };
                const convertedData: IConvertedTreeResponse | undefined = await FnConvertHierarchicalDataToTree(
                    { data: [rootNodeWithChildren] },
                    treeContainerProps,
                    lastModifiedNodeEntIDRef.current,
                );

                if (!convertedData) {
                    return;
                }

                setTreeData(convertedData.treeData);
                setDefaultExpandedKeys(convertedData.expandedKeys);
                if (convertedData.selectedKey) {
                    setDefaultSelectedKeys([convertedData.selectedKey]);
                }

                if (isReportProfileNode(convertedData.selectedNode)) {
                    const enrichedNode = enrichReportProfileTreeNode(
                        convertedData.selectedNode as ITreeNode,
                        records
                    );
                    const nodeData = prepareReportProfileNodeForForm(enrichedNode);
                    setProfileString(JSON.stringify([nodeData]));
                    setAllowRenderForm(true);
                    setDisableDelete(false);
                    setAllowCustomIcon(true);
                    setIsAddMode(false);
                    setDefaultSelectedNodeInfo({
                        event: 'select',
                        selected: true,
                        node: enrichedNode,
                        selectedNodes: [enrichedNode]
                    });
                } else {
                    setAllowRenderForm(false);
                    setDisableDelete(true);
                    setAllowCustomIcon(true);
                    if (convertedData.selectedNode) {
                        setDefaultSelectedNodeInfo({
                            event: 'select',
                            selected: true,
                            node: convertedData.selectedNode,
                            selectedNodes: [convertedData.selectedNode]
                        });
                    }
                }

                setControlData((prevControlData) => [...prevControlData]);
            } catch (error) {
                console.error('Failed to build report template tree:', error);
            }
        };
        void handleApiDataChange();
    }, [apiDataForTree, treeContainerProps, entityName, reportTemplateProps.selectedSubGroup])


    const handleAIClick = async (_event: unknown, actionCode?: string | undefined) => {
        if (actionCode === "add") {
            if (!treeData.length) {
                openOkConfirm("Report template tree is not ready yet.");
                return;
            }

            const selectedGroupNode = defaultSelectedNodeInfo?.node;
            const isSelectedGroupNode = isGroupNode(selectedGroupNode);
            const selectedGroupName = getSelectedGroupName(selectedGroupNode);
            const controlsForAdd = selectedGroupName
                ? applyGroupNameDefaultToControls(reportTemplateProps.formControls, selectedGroupName)
                : reportTemplateProps.formControls;

            if (!isSelectedGroupNode) {
                setDefaultSelectedNodeInfo(null);
                setDefaultSelectedKeys([treeData[0].key]);
            }
            setProfileString(buildAddModeProfileString(selectedGroupName));
            setDisableDelete(true);
            setAllowRenderForm(true);
            setControlData(controlsForAdd);
            clearLoadedTemplateState();
            setControlHtmlToRender(null);
            setIsAddMode(true);
        }
        else if (actionCode === "delete") {
            if (isProtectedDefaultTemplate(defaultSelectedNodeInfo?.node?.Name)) {
                openOkConfirm("Delete action is not allowed for this template");
                return;
            }
            const handleCreateMessageApiResponse = (createMessageApiResponse: unknown, status?: string) => {
                if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                    setIsShowOkButton(false);
                    setConfirmMessage(createMessageApiResponse.finalMessage as string);
                    setIsConfirmOpen(true);
                }
            };
            try {
                await axiosInterceptor({
                    url: LOG.CreateMessage,
                    data: {
                        projectInitial: "Common",
                        msgID: "151"
                    },
                    setFetchData: handleCreateMessageApiResponse
                }, statusBarContext);
            } catch (error) {
                console.error('Failed to load delete confirmation message:', error);
                openOkConfirm("Failed to start delete action.");
            }

        }
        else if (actionCode === "preview" && defaultSelectedNodeInfo?.node) {
            const selectedNodeId = getReportProfileSelectionId(defaultSelectedNodeInfo.node);
            if (
                !reportLayoutTemplate ||
                !isTemplateLoadedForNode(defaultSelectedNodeInfo.node, loadedTemplateNodeIdRef.current)
            ) {
                return;
            }

            function extractApiValues(
                obj: unknown,
                isReturnJsonApiData: boolean
            ): { key: string; value: string }[] {

                const result: { key: string; value: string }[] = [];

                function recurse(value: unknown): void {
                    if (Array.isArray(value)) {
                        value.forEach(recurse);
                    }
                    else if (typeof value === "object" && value !== null) {
                        const entries = Object.entries(value as Record<string, unknown>);

                        for (const [key, val] of entries) {

                            if (
                                key.toLowerCase().includes("api") &&
                                typeof val === "string" &&
                                val !== ""
                            ) {
                                result.push({
                                    key: (value as any)?.id ?? key,
                                    value: val
                                });
                            }

                            recurse(val);
                        }
                    }
                }

                recurse(obj);

                //  filtering WITHOUT changing output
                if (isReturnJsonApiData) {
                    return result.filter(item => {
                        try {
                            const parsed = FnParseJsonSafely(item.value);
                            return parsed?.source === "JsonApi";
                        } catch {
                            return false;
                        }
                    });
                }

                return result;
            }
            const MakeApiCallsForMemoryURL = async (
                Apis: { key: string; value: string }[],
                apiProfiles?: unknown[],
            ) => {
                try {
                    let urlsObj: IMemoryUrlItem[] = [];

                    for (let index = 0; index < Apis.length; index++) {
                        const element = Apis[index];

                        if (!element?.value) continue;

                        const data = FnParseJsonSafely(element.value);

                        if (!data?.source) continue;

                        //  attach id inside payload (not source)
                        data.payload = {
                            ...data.payload,
                            id: element.key
                        };

                        urlsObj = await FnInMemoryUrlForAPI(
                            data,
                            InMemoryUrlContext,
                            statusBarContext,
                            chartProfileContext,
                            sessionContext,
                            apiProfiles,
                            false,
                            sendPrompt,
                            selectedNodeContext.selectedNode
                        ) as IMemoryUrlItem[]

                    }

                    return urlsObj;
                } catch (error) {
                    console.error("MakeApiCallsForMemoryURL error:", error);
                    return [];
                }
            };
            function getMemoryUrlById(
                id: string,
                memoryUrlLookup: { key: string; memoryUrl: string }[]
            ): string | null {
                const found = memoryUrlLookup.find(item => item.key === id);
                return found ? found.memoryUrl : null;
            }
            function injectMemoryUrlsAndReturn(
                node: any,
                memoryUrlLookup: { key: string; memoryUrl: string }[]
            ): any {
                if (!node || typeof node !== "object") return node;

                // Shallow clone
                const updatedNode = { ...node };

                //  imageArray
                if (Array.isArray(updatedNode.imageArray)) {
                    updatedNode.imageArray = updatedNode.imageArray.map((img: any) => {
                        const memoryUrl = img?.id
                            ? getMemoryUrlById(img.id, memoryUrlLookup)
                            : null;

                        return memoryUrl
                            ? { ...img, inmemoryUrl: memoryUrl, format: "png" }
                            : img;
                    });
                }

                //  datatableArray
                if (Array.isArray(updatedNode.datatableArray)) {
                    updatedNode.datatableArray = updatedNode.datatableArray.map((dt: any) => {
                        const memoryUrl = dt?.id
                            ? getMemoryUrlById(dt.id, memoryUrlLookup)
                            : null;

                        return memoryUrl
                            ? { ...dt, inmemoryUrl: memoryUrl, format: "png" }
                            : dt;
                    });
                }
                //  markdownArray
                if (Array.isArray(updatedNode.markdownArray)) {
                    updatedNode.markdownArray = updatedNode.markdownArray.map((dt: any) => {
                        const memoryUrl = dt?.id
                            ? getMemoryUrlById(dt.id, memoryUrlLookup)
                            : null;

                        return memoryUrl
                            ? { ...dt, inmemoryUrl: memoryUrl, format: "png" }
                            : dt;
                    });
                }

                //  recurse through locationArray
                if (Array.isArray(updatedNode.locationArray)) {
                    updatedNode.locationArray = updatedNode.locationArray.map((loc: any) =>
                        injectMemoryUrlsAndReturn(loc, memoryUrlLookup)
                    );
                }



                return updatedNode;
            }
            statusBarContext.setIsLoading(true);
            try {
                const renderPreviewLayout = (template: string) => (
                    <InMemoryUrlProvider>
                        <EditReportLayout
                            key={`preview-${selectedNodeId}`}
                            uniqueName={`${reportTemplateProps.uniqueName}-preview`}
                            featureId={reportTemplateProps.featureId}
                            allowEdit={false}
                            selectedNode={defaultSelectedNodeInfo?.node}
                            subGroupName="Preview Report Template"
                            reportLayoutTemplate={template}
                            template={template ? 'template' : 'new'}
                            mode="tree"
                        />
                    </InMemoryUrlProvider>
                );

                if (!reportLayoutTemplate) {
                    return;
                }

                const apis = extractApiValues(FnParseJsonSafely(reportLayoutTemplate), false);
                if (!apis.length) {
                    setControlHtmlToRender(renderPreviewLayout(reportLayoutTemplate));
                    return;
                }

                const profiles = await FnGetApiProfiles(mainAppContext, statusBarContext);
                const inmemoryUrls = await MakeApiCallsForMemoryURL(apis, profiles);
                if (!inmemoryUrls?.length) {
                    setControlHtmlToRender(renderPreviewLayout(reportLayoutTemplate));
                    return;
                }

                const updatedJson = injectMemoryUrlsAndReturn(FnParseJsonSafely(reportLayoutTemplate), inmemoryUrls);
                if (typeof updatedJson !== "object" || updatedJson === null) {
                    setControlHtmlToRender(renderPreviewLayout(reportLayoutTemplate));
                    return;
                }

                const safeNode: Record<string, unknown> = { ...updatedJson };
                if ((safeNode.NodeType as string)?.toLowerCase() === "layout") {
                    if (Array.isArray(safeNode.header)) {
                        safeNode.header = Object.assign({}, ...safeNode.header);
                    }
                    if (Array.isArray(safeNode.footer)) {
                        safeNode.footer = Object.assign({}, ...safeNode.footer);
                    }
                    if (Array.isArray(safeNode.page)) {
                        safeNode.page = Object.assign({}, ...safeNode.page);
                    }
                }

                setControlHtmlToRender(renderPreviewLayout(JSON.stringify(safeNode)));
            } catch (error) {
                console.error('Failed to preview report template:', error);
                openOkConfirm("Failed to preview report template.");
            } finally {
                statusBarContext.setIsLoading(false);
            }

        }
        else if (actionCode === "editlayout" && defaultSelectedNodeInfo?.node) {
            if (defaultSelectedNodeInfo.node && defaultSelectedNodeInfo.node.Enabled) {
                await callApiToUpdateForEnable(defaultSelectedNodeInfo.node, false);
            }
            const selectedNodeId = getReportProfileSelectionId(defaultSelectedNodeInfo.node);
            if (
                !reportLayoutTemplate ||
                !isTemplateLoadedForNode(defaultSelectedNodeInfo.node, loadedTemplateNodeIdRef.current)
            ) {
                return;
            }

            setControlHtmlToRender(commonVariableContext.diagnosticLevel === "4" ? <JsonViewer uniqueName={`${reportTemplateProps.uniqueName}-edit`} jsonData={{
                featureId: reportTemplateProps.featureId, allowEdit: true,
                selectedNode: defaultSelectedNodeInfo?.node, subGroupName: `Edit Report Template`,
                reportLayoutTemplate: reportLayoutTemplate, template: reportLayoutTemplate ? 'template' : 'new',
                mode: 'tree',
                templateName: defaultSelectedNodeInfo?.node.Name ?? "New Report Layout",
                handleReloadTree: () => {
                    callApiForRefreshTreeData(entityName, `_${entityName}`)
                    clearLoadedTemplateState();
                }
            }} /> :
                <InMemoryUrlProvider>
                    <EditReportLayout
                        key={`edit-${selectedNodeId}`}
                        uniqueName={`${reportTemplateProps.uniqueName}-edit`} featureId={reportTemplateProps.featureId} allowEdit={defaultSelectedNodeInfo?.node?.IsTemplate ? false : true} selectedNode={defaultSelectedNodeInfo?.node} subGroupName={`Edit Report Template`} reportLayoutTemplate={reportLayoutTemplate} template={reportLayoutTemplate ? 'template' : 'new'} mode={'canvas'}
                        templateName={defaultSelectedNodeInfo?.node.Name ?? "New Report Layout"} handleReloadTree={() => {
                            lastModifiedNodeEntIDRef.current = defaultSelectedNodeInfo?.node.key
                            callApiForRefreshTreeData(entityName, `_${entityName}`)
                            clearLoadedTemplateState();
                        }}
                        isLandScaped={false}
                    /></InMemoryUrlProvider>
            )
        }
        else if (actionCode === "clonelayout" && defaultSelectedNodeInfo?.node && defaultSelectedNodeInfo?.node.NodeDetail) {
            try {
                await axiosInterceptor(
                    {
                        url: FS.GetFileStream,
                        data: {
                            entID: defaultSelectedNodeInfo.node.NodeEntID,
                            entityName: EntityNameEnums.ReportProfile,
                            fileCategory: "Text",
                            fileName: defaultSelectedNodeInfo.node.TemplateFileName,
                            fileExtension: getFileExtensionFromFileName(defaultSelectedNodeInfo.node.TemplateFileName),
                            fileUID: defaultSelectedNodeInfo.node.FileUID,
                        },
                        allowShowLoader: true,
                        setFetchData: async (getFileStreamApiResponse: unknown, status?: string) => {
                            if (
                                status !== "200" ||
                                !getFileStreamApiResponse ||
                                typeof getFileStreamApiResponse !== "object" ||
                                !("fileBlob" in getFileStreamApiResponse) ||
                                !(getFileStreamApiResponse.fileBlob as string)?.length
                            ) {
                                console.error("Failed to load report template file for clone.");
                                openOkConfirm("Failed to clone report template.");
                                return;
                            }

                            try {
                                const base64 = getFileStreamApiResponse.fileBlob as string;
                                const currentNode = parseNodeDetailRecord(defaultSelectedNodeInfo.node.NodeDetail);
                                if (!currentNode) {
                                    openOkConfirm("Failed to clone report template.");
                                    return;
                                }
                                currentNode.EntID = "";
                                currentNode.RecID = "";
                                currentNode.IsTemplate = 0;
                                currentNode._ReportProfile = `${String(currentNode._ReportProfile ?? "")}~${FnGenerateUniqueId()}`;
                                currentNode.LastUpdated = undefined;
                                const payload = { _ReportProfile: [currentNode] };
                                const userName = getLoginShortNameFromSession(sessionContext.SessionList);
                                const templateFileName = String(currentNode.TemplateFileName ?? defaultSelectedNodeInfo.node.TemplateFileName ?? "");

                                await axiosInterceptor(
                                    {
                                        url: EM.AddUpdateTableRecord,
                                        data: { jsonString: JSON.stringify(payload) },
                                        allowShowLoader: true,
                                        setFetchData: async (updateTableRecordApiResponse: unknown, updateStatus?: string) => {
                                            if (
                                                updateStatus !== "200" ||
                                                !updateTableRecordApiResponse ||
                                                typeof updateTableRecordApiResponse !== "object" ||
                                                !('jsonStringOutput' in updateTableRecordApiResponse)
                                            ) {
                                                openOkConfirm("Failed to clone report template.");
                                                return;
                                            }

                                            const jsonParsed = FnParseJsonSafely(updateTableRecordApiResponse.jsonStringOutput as string);
                                            const entityTable = `_${entityName}`;
                                            lastModifiedNodeEntIDRef.current = jsonParsed[entityTable][0].EntID
                                            if (jsonParsed?.[entityTable]?.length && jsonParsed[entityTable][0].EntID) {
                                                await axiosInterceptor({
                                                    url: FS.UploadFileStream,
                                                    data: {
                                                        fileCategory: "Text",
                                                        fileExtension: getFileExtensionFromFileName(templateFileName),
                                                        fileBlob: base64,
                                                        fileName: templateFileName,
                                                        prefix: FileGroupNameEnums.Report,
                                                        userName,
                                                        entityname: entityName,
                                                        entID: jsonParsed[entityTable][0].EntID
                                                    },
                                                    allowShowLoader: true,
                                                    setFetchData: (handleFileUploadStreamApiResp: unknown, uploadStatus?: string) => {
                                                        if (uploadStatus === "200" && handleFileUploadStreamApiResp) {
                                                            callApiForRefreshTreeData(entityName, entityTable);
                                                        } else {
                                                            openOkConfirm("Failed to upload cloned report template.");
                                                        }
                                                    }
                                                }, statusBarContext);
                                                return;
                                            }

                                            callApiForRefreshTreeData(entityName, entityTable);
                                            openOkConfirm("FileTemplate Not Found");
                                        },
                                    },
                                    statusBarContext
                                );
                            } catch (error) {
                                console.error("Failed to clone report template:", error);
                                openOkConfirm("Failed to clone report template.");
                            }
                        },
                    },
                    statusBarContext
                );
            } catch (error) {
                console.error('Clone report template failed:', error);
                openOkConfirm("Failed to clone report template.");
            }
        }
        else if (
            actionCode === "exportlayout" &&
            reportLayoutTemplate &&
            defaultSelectedNodeInfo?.node &&
            defaultSelectedNodeInfo?.node.NodeDetail &&
            isTemplateLoadedForNode(defaultSelectedNodeInfo.node, loadedTemplateNodeIdRef.current)
        ) {
            try {
                if (!window.showSaveFilePicker) {
                    openOkConfirm("File save is not supported in this browser.");
                    return;
                }

                const parsed = FnParseJsonSafely(reportLayoutTemplate);
                if (!parsed || typeof parsed !== "object") {
                    openOkConfirm("Report template content is invalid.");
                    return;
                }

                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'reportTemplate.json',
                    types: [
                        {
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] },
                        },
                    ],
                });
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(parsed, null, 2));
                await writable.close();

                openOkConfirm("File saved successfully!");
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Save failed:', err);
                openOkConfirm("Failed to save file.");
            }

        }
        else if (actionCode === "downloadall") {
            const bulkActionTreeData = getBulkActionTreeData();
            statusBarContext.setLoadingLabel("Downloading...");
            try {
                const result = await FnDownloadAllReportTemplates(
                    bulkActionTreeData,
                    getScopedApiDataForBulkAction(bulkActionTreeData),
                    entityName,
                    statusBarContext
                );
                if (result.cancelled || !result.message) {
                    return;
                }
                openOkConfirm(result.message);
            } catch (error) {
                console.error('Download all report templates failed:', error);
                openOkConfirm('Failed to download report templates.');
            } finally {
                statusBarContext.setIsLoading(false);
                statusBarContext.setLoadingLabel(undefined);
            }
        }
        else if (actionCode === "import") {
            const selectedGroupName = isGroupNode(defaultSelectedNodeInfo?.node)
                ? String(defaultSelectedNodeInfo?.node?.Name ?? "").trim()
                : "";
            statusBarContext.setLoadingLabel("Uploading...");
            try {
                const result = await FnImportAllReportTemplates(
                    entityName,
                    statusBarContext,
                    sessionContext.SessionList,
                    selectedGroupName
                        ? {
                            recordFilter: (record) => {
                                const rowGroupName = String(record.GroupName ?? "").trim();
                                return !rowGroupName || rowGroupName === selectedGroupName;
                            },
                            recordTransform: (record) => ({
                                ...record,
                                GroupName: String(record.GroupName ?? "").trim() || selectedGroupName,
                            }),
                            emptyFilterMessage: `No report profile records found for group "${selectedGroupName}".`,
                            existingProfileNames: getExistingReportProfileNames(),
                        }
                        : { existingProfileNames: getExistingReportProfileNames() }
                );
                if (result.cancelled || !result.message) {
                    return;
                }
                openOkConfirm(result.message);
                if (result.importedCount > 0) {
                    callApiForRefreshTreeData(entityName, `_${entityName}`);
                }
            } catch (error) {
                console.error('Import report templates failed:', error);
                openOkConfirm('Failed to import report templates.');
            } finally {
                statusBarContext.setIsLoading(false);
                statusBarContext.setLoadingLabel(undefined);
            }
        }
    }

    const callApiForRefreshTreeData = (entityNameToRefresh: string, tableName: string, newAddedRecordId?: string) => {
        const handleGetEntityRecordsApiResponse = (getEntityRecordsApiResponse: unknown, status?: string) => {
            try {
                if (status !== "200" || typeof getEntityRecordsApiResponse !== "string") {
                    return;
                }

                const parsedData = FnHandleAPIResponse(getEntityRecordsApiResponse, "Dataset");
                setDefaultExpandedKeys([]);
                setDefaultSelectedKeys([]);
                setDefaultSelectedNodeInfo(null);
                setControlHtmlToRender(null);
                setTreeData([]);
                setApiDataForTree(parsedData);
                const reportRecords = parsedData[`_${EntityNameEnums.ReportProfile}`];
                reportContext.setReportProfiles(reportRecords);
            } catch (error) {
                console.error('Failed to refresh report template tree:', error);
            }
        };

        void axiosInterceptor({
            url: EM.GetEntityRecords,
            data: {
                entityName: entityNameToRefresh,
                entIDs: "",
                tableName,
                filterJsonString: null,
                andor: "OR",
                startRec: 0,
                endRec: 0
            },
            allowShowLoader: true,
            setFetchData: handleGetEntityRecordsApiResponse
        }, statusBarContext).catch((error) => {
            console.error('Report template refresh request failed:', error);
        });
    }

    const handleNodeSelect = async (_selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
        if (defaultSelectedNodeInfo?.node.key !== info.node.key) {
            clearLoadedTemplateState();
        }

        if (isReportProfileNode(info?.node)) {
            const records = getReportProfileRecords();
            const enrichedNode = enrichReportProfileTreeNode(
                info.node,
                records as IReportHierarchyRow[]
            );
            const nodeData = prepareReportProfileNodeForForm(enrichedNode);
            setControlHtmlToRender(null);
            setProfileString(JSON.stringify([nodeData]));
            setAllowRenderForm(true);
            setControlData([...reportTemplateProps.formControls]);
            setDisableDelete(false);
            setAllowCustomIcon(true);
            setIsAddMode(false);
            const enrichedInfo: ISelectedNodeInfo = {
                ...info,
                node: enrichedNode,
                selectedNodes: info.selectedNodes?.map((n) => n.key === enrichedNode.key ? enrichedNode : n) ?? [enrichedNode],
            };
            setDefaultSelectedNodeInfo(enrichedInfo);
            setDefaultSelectedKeys([info.node.key]);
            setDefaultExpandedKeys(expandedKeys);

            const currentNode =
                selectedNodeContext.selectedNodeExplorer ??
                selectedNodeContext.selectedNode;

            if (
                currentNode &&
                selectedNodeContext.selectedNodeProperty?.EntID !== currentNode.NodeEntID
            ) {
                if (currentNode.NodeEntityname && currentNode.NodeEntID) {
                    const kebabData = await FnGetKebabMenuDataByEntity(
                        currentNode.NodeEntityname,
                        currentNode.NodeType?.toLowerCase(),
                        currentNode.NodeEntID,
                        statusBarContext
                    );

                    if (typeof kebabData === "object" && Object.values(kebabData).length) {
                        const record = Object.values(
                            kebabData as Record<string, ISelectedNodeProperty[]>
                        )?.[0]?.[0];

                        selectedNodeContext.setSelectedNodeProperty(
                            record as ISelectedNodeProperty
                        );
                    }
                }
            }
            if (workOrder?.length) {
                try {
                    const workorderRecord = await FnGetWorkorderProfile(
                        workOrder,
                        statusBarContext
                    );

                    if (workorderRecord) {
                        selectedNodeContext.setSelectedWorkorderRecord(workorderRecord);
                    }
                } catch (error) {
                    console.error('error in get workorder details :', error);

                }
            }
        }
        else {
            setControlHtmlToRender(null);
            setAllowRenderForm(false);
            setDisableDelete(true);
            setAllowCustomIcon(true);
            setControlData([...reportTemplateProps.formControls]);
            setIsAddMode(false);
            setDefaultSelectedNodeInfo(info);
            setDefaultSelectedKeys([info.node.key]);
            setDefaultExpandedKeys(expandedKeys);
        }
    };


    const callApiToUpdateForEnable = async (
        node: ITreeNode,
        isFileTemplteNotFound: boolean,
        signal?: AbortSignal
    ) => {
        try {
            if (signal?.aborted) {
                return;
            }
            const currentNode = getReportProfileNodeRecord(node);
            currentNode.Enabled = "0";
            currentNode.title = "";
            currentNode.icon = null;
            currentNode.NodeDetail = "";

            const payload = { _ReportProfile: [currentNode] };

            if (node.Enabled) {
                await axiosInterceptor(
                    {
                        url: EM.UpdateTableRecord,
                        data: { jsonString: JSON.stringify(payload) },
                        allowShowLoader: true,
                        signal,
                        setFetchData: (updateTableRecordApiResponse: unknown, status?: string) => {
                            if (signal?.aborted) {
                                return;
                            }
                            if (updateTableRecordApiResponse && status === "200") {
                                if (isFileTemplteNotFound) {
                                    lastModifiedNodeEntIDRef.current = node.NodeEntID as string;
                                    callApiForRefreshTreeData(entityName, `_${entityName}`);
                                    openOkConfirm("FileTemplate Not Found");
                                } else {
                                    reportContext.setReportProfiles([]);
                                    const updateTreeData = FnUpdateTreeNode(treeData, node.key, { ...node, Enabled: false })
                                    setTreeData(updateTreeData);
                                }
                            }
                        },
                    },
                    statusBarContext
                );
            }
        } catch (error) {
            if (signal?.aborted) {
                return;
            }
            console.error('Failed to disable invalid report template:', error);
        }
    };
    useEffect(() => {
        if (!isReportProfileNode(defaultSelectedNodeInfo?.node)) {
            setPreviewEditIcons(undefined);
            setIsPreviewEditDisabled(undefined);
            loadedTemplateNodeIdRef.current = undefined;
            return;
        }

        const abortController = new AbortController();
        const { signal } = abortController;
        const selectedNodeId = getReportProfileSelectionId(defaultSelectedNodeInfo?.node);
        const requestId = ++templateLoadRequestIdRef.current;

        setReportLayoutTemplate(undefined);
        setIsPreviewEditDisabled(true);
        loadedTemplateNodeIdRef.current = undefined;

        hideSettingsSaveButton();

        const isCurrentSelection = () =>
            !signal.aborted &&
            requestId === templateLoadRequestIdRef.current &&
            selectedNodeId === getReportProfileSelectionId(defaultSelectedNodeInfo?.node);

        const applyLoadedTemplate = (templateJson: string) => {
            if (!isCurrentSelection() || !selectedNodeId) {
                return;
            }

            loadedTemplateNodeIdRef.current = selectedNodeId;
            setReportLayoutTemplate(templateJson);
            setIsPreviewEditDisabled(false);
            setAllowCustomIcon(true);
            setControlHtmlToRender(null);
        };

        const clearLoadedTemplate = () => {
            if (!isCurrentSelection()) {
                return;
            }

            setReportLayoutTemplate(undefined);
            setIsPreviewEditDisabled(true);
            loadedTemplateNodeIdRef.current = undefined;
        };

        const processReportProfile = async () => {
            const node = defaultSelectedNodeInfo?.node;
            if (!node) {
                return;
            }

            const nodeEntId = node.NodeEntID ? String(node.NodeEntID) : undefined;
            if (nodeEntId) {
                const pendingTemplate = pendingSavedTemplateByNodeIdRef.current.get(nodeEntId);
                if (pendingTemplate) {
                    pendingSavedTemplateByNodeIdRef.current.delete(nodeEntId);
                    applyLoadedTemplate(pendingTemplate);
                    return;
                }
            }

            const templateFileName = getReportProfileTemplateFileNameFromNode(node);

            const deleteInvalidFileStream = async (fileUID: string, templateFileName?: string | null) => {
                await axiosInterceptor(
                    {
                        url: FS.DeleteFileStream,
                        data: {
                            fileCategory: "Text",
                            fileExtension: getFileExtensionFromFileName(templateFileName),
                            fileUID,
                        },
                        allowShowLoader: true,
                        signal,
                        setFetchData: () => { },
                    },
                    statusBarContext
                );
            };

            statusBarContext.setIsLoading(true);
            const stopLoader = () => {
                if (isCurrentSelection()) {
                    statusBarContext.setIsLoading(false);
                }
            };

            try {
                if (signal.aborted) {
                    return;
                }
                if (!templateFileName) {
                    await callApiToUpdateForEnable(node, true, signal);
                    clearLoadedTemplate();
                    return;
                }

                await axiosInterceptor(
                    {
                        url: EM.GetEntityRecords,
                        data: {
                            entityName: EntityNameEnums.ReportProfile,
                            tableName: "PG.FileProfile",
                            entIDs: node.NodeEntID,
                        },
                        signal,
                        setFetchData: async (getEntityRecordsApiResponse: unknown, status?: string) => {
                            if (signal.aborted) {
                                return;
                            }
                            // Keep loader visible for nested file/json checks after this API returns.
                            statusBarContext.setIsLoading(true);
                            let startedFileStream = false;
                            try {
                                if (status !== "200" || typeof getEntityRecordsApiResponse !== "string") {
                                    await callApiToUpdateForEnable(node, true, signal);
                                    clearLoadedTemplate();
                                    return;
                                }

                                const extractedData = FnHandleAPIResponse(getEntityRecordsApiResponse, "Dataset");
                                const fileRecord = extractedData?.["PG.FileProfile"]?.[0];

                                if (!fileRecord?.FileUID) {
                                    await callApiToUpdateForEnable(node, true, signal);
                                    clearLoadedTemplate();
                                    return;
                                }

                                const fileUID = fileRecord.FileUID;
                                startedFileStream = true;

                                await axiosInterceptor(
                                    {
                                        url: FS.GetFileStream,
                                        data: {
                                            entID: node.NodeEntID,
                                            entityName: fileRecord.EntityName ?? EntityNameEnums.ReportProfile,
                                            fileCategory: fileRecord.FileCategory ?? "Text",
                                            fileName: fileRecord.DocName ?? templateFileName,
                                            fileExtension: fileRecord.FileExtension ?? getFileExtensionFromFileName(fileRecord.DocName ?? templateFileName),
                                            fileUID,
                                        },
                                        signal,
                                        setFetchData: async (getFileStreamApiResponse: unknown, fileStreamStatus?: string) => {
                                            if (signal.aborted) {
                                                return;
                                            }
                                            statusBarContext.setIsLoading(true);
                                            try {
                                                if (
                                                    fileStreamStatus === "200" &&
                                                    getFileStreamApiResponse &&
                                                    typeof getFileStreamApiResponse === "object" &&
                                                    "fileBlob" in getFileStreamApiResponse &&
                                                    (getFileStreamApiResponse.fileBlob as string)?.length
                                                ) {
                                                    const json = decodeReportTemplateBlob(getFileStreamApiResponse.fileBlob as string);
                                                    if (json) {
                                                        applyLoadedTemplate(JSON.stringify(json));
                                                        return;
                                                    }

                                                    await deleteInvalidFileStream(fileUID, fileRecord.DocName ?? templateFileName);
                                                } else {
                                                    console.error("Failed to process entity records");
                                                    await deleteInvalidFileStream(fileUID, fileRecord.DocName ?? templateFileName);
                                                }

                                                await callApiToUpdateForEnable(node, true, signal);
                                                clearLoadedTemplate();
                                            } finally {
                                                stopLoader();
                                            }
                                        },
                                    },
                                    statusBarContext
                                );
                            } catch (error) {
                                if (signal.aborted) {
                                    return;
                                }
                                console.error("Failed to process entity records", error);
                                clearLoadedTemplate();
                                await callApiToUpdateForEnable(node, true, signal);
                            } finally {
                                if (!startedFileStream) {
                                    stopLoader();
                                }
                            }
                        },
                    },
                    statusBarContext
                );
            } catch (error) {
                if (signal.aborted) {
                    return;
                }
                console.error('Failed to load report template profile:', error);
                clearLoadedTemplate();
                stopLoader();
            } finally {
                // Covers early exits (e.g. missing template file name) where nested callbacks do not run.
                if (!templateFileName) {
                    stopLoader();
                }
            }
        };

        void processReportProfile();

        return () => {
            abortController.abort();
            templateLoadRequestIdRef.current++;
            statusBarContext.setIsLoading(false);
        };
    }, [
        defaultSelectedNodeInfo?.node?.NodeEntID,
        defaultSelectedNodeInfo?.node?.key,
        defaultSelectedNodeInfo?.node?.TemplateFileName,
        entityName,
    ]);

    const handleSaveAction = async (profileData: string, id?: string | undefined, isConfirmed?: boolean) => {
        const entityTable = `_${entityName}`;
        // Add mode can still have a selected group node RecID; that must not be treated as update.
        const isNewRecord = isAddMode || !id;
        const parsedData = FnParseJsonSafely<IReportProfileFormRow[], IReportProfileFormRow[]>(
            profileData,
            { fallback: EMPTY_REPORT_PROFILE_ROWS }
        );
        if (!Array.isArray(parsedData) || !parsedData.length) {
            return;
        }

        if (isDuplicateReportProfileName(parsedData[0]._ReportProfile, [
            isNewRecord ? undefined : id,
            String(parsedData[0].EntID ?? ""),
            String(parsedData[0].NodeEntID ?? ""),
            isNewRecord ? undefined : defaultSelectedNodeInfo?.node?.NodeEntID,
            isNewRecord ? undefined : defaultSelectedNodeInfo?.node?.RecID,
        ])) {
            openOkConfirm("Report profile name already exists. Please correct the profile name.");
            return;
        }
        if (parsedData[0].EntityNames === "[]") {
            parsedData[0].EntityNames = "";
        }

        const callApiToUploadFile = async (entId: string) => {
            const refreshTreeAfterSave = () => {
                storePendingSavedTemplate(entId, parsedData[0]);
                callApiForRefreshTreeData(entityName, entityTable);
            };

            const deleteSavedReportProfile = async () => {
                if (!isNewRecord) {
                    return;
                }

                await axiosInterceptor({
                    url: EM.DeleteEntityRecords,
                    data: {
                        entityName,
                        entIDs: entId
                    },
                    setFetchData: (_deleteEntityRecordsApiResponse: unknown, deleteStatus?: string) => {
                        if (deleteStatus === "200") {
                            lastModifiedNodeEntIDRef.current = undefined;
                            pendingSavedTemplateByNodeIdRef.current.delete(entId);
                            callApiForRefreshTreeData(entityName, entityTable);
                        }
                    }
                }, statusBarContext);
            };

            const handleUploadFileStreamResponse = async (uploadFileStreamResponse: unknown, status?: string) => {
                if (parsedData.length > 0 && hasUploadedReportTemplateFile(parsedData[0])) {
                    if (status === "200") {
                        if (uploadFileStreamResponse && typeof uploadFileStreamResponse === "object"
                            && 'fileUID' in uploadFileStreamResponse) {
                            if (!isNewRecord) {
                                callApiToSaveEntityRecord("update");
                            }
                        }
                        refreshTreeAfterSave();
                    }
                    else {
                        await deleteSavedReportProfile();
                        openOkConfirm("Failed to save report template file.");
                    }
                }
                else {
                    refreshTreeAfterSave();
                }

            };

            try {
                const userUploadedFile = hasUploadedReportTemplateFile(parsedData[0]);
                const userName = getLoginShortNameFromSession(sessionContext.SessionList);
                await applyDefaultReportLayoutIfNeeded(parsedData[0], isNewRecord);
                storePendingSavedTemplate(entId, parsedData[0]);

                const templateFileName = resolveReportProfileTemplateFileName(parsedData[0], isNewRecord);
                const uploadFileName = String(
                    parsedData[0].FPFileName
                    || parsedData[0].SelectFileName
                    || templateFileName
                    || parsedData[0]._ReportProfile
                    || ""
                );
                const fileExtension = userUploadedFile
                    ? getFileExtensionFromFileName(uploadFileName)
                    : `.${DEFAULT_REPORT_TEMPLATE_EXTENSION}`;

                if (!hasUploadedReportTemplateFile(parsedData[0])) {
                    await deleteSavedReportProfile();
                    openOkConfirm("Failed to create default report template file.");
                    return;
                }

                await axiosInterceptor({
                    url: FS.UploadFileStream,
                    data: {
                        fileCategory: "Text",
                        fileExtension,
                        fileBlob: parsedData[0].FPFileContent,
                        fileName: uploadFileName,
                        prefix: FileGroupNameEnums.Report,
                        userName,
                        entityname: entityName,
                        entID: entId
                    },
                    allowShowLoader: true,
                    setFetchData: handleUploadFileStreamResponse
                }, statusBarContext);
            } catch (error) {
                console.error('Failed to upload report template file:', error);
                await deleteSavedReportProfile();
                openOkConfirm('Failed to save report template file.');
            }
        };

        const callApiToSaveEntityRecord = (action: "add" | "update") => {
            const handleAddEditEntityRecordResponse = (addEntityRecordResponse: unknown, status?: string) => {
                if (status === "200") {
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Entity,
                        SubGroupName: LogSubGroupName.Entity,
                        LogName: isNewRecord ? LogName.AddEntity : LogName.UpdateEntity,
                        actionObject: {
                            Name: profileJson[entityTable],
                            FeatureName: reportTemplateProps.selectedSubGroup,
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    };
                    FnCreateForensiclog(payload);

                    if (addEntityRecordResponse && typeof addEntityRecordResponse === "object" && 'jsonStringOutput' in addEntityRecordResponse) {
                        const savedData = FnParseJsonSafely(addEntityRecordResponse.jsonStringOutput as string);
                        if (savedData?.[entityTable]?.length > 0) {
                            const savedRow = savedData[entityTable][0];
                            const entId = savedRow.EntID;
                            if (entId && isNewRecord) {
                                setIsAddMode(false);
                                void callApiToUploadFile(entId);
                            }
                            lastModifiedNodeEntIDRef.current = savedRow.EntID ?? savedRow.RecID;
                            if (action === "update") {
                                callApiForRefreshTreeData(entityName, entityTable);
                            }
                        }
                    }
                    hideSettingsSaveButton();
                }
            };
            const profileJson: Record<string, unknown> = {};
            for (let index = 0; index < controlData.length; index++) {
                const element = controlData[index];
                profileJson[element._AP] = parsedData[0][element._AP];
            }
            if (!isNewRecord) {
                profileJson["RecID"] = parsedData[0].RecID ?? id;
                profileJson["EntID"] = parsedData[0].NodeEntID ?? parsedData[0].EntID ?? id;
            }

            const templateFileName = resolveReportProfileTemplateFileName(parsedData[0], isNewRecord);
            if (templateFileName) {
                profileJson["TemplateFileName"] = templateFileName;
                parsedData[0].TemplateFileName = templateFileName;
            }

            const jsonData = { [entityTable]: [profileJson] };
            void axiosInterceptor({
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(jsonData)
                },
                allowShowLoader: true,
                setFetchData: handleAddEditEntityRecordResponse
            }, statusBarContext);
        };

        try {
            if (!isNewRecord) {
                const selectedNode = defaultSelectedNodeInfo?.node;
                const updateEntId = String(
                    parsedData[0].NodeEntID
                    || selectedNode?.NodeEntID
                    || ""
                ).trim();
                const shouldReplaceFile =
                    hasUploadedReportTemplateFile(parsedData[0]) || Boolean(isConfirmed);

                if (shouldReplaceFile && updateEntId) {
                    // Ensure NodeEntID is present for upload/save paths.
                    parsedData[0].NodeEntID = updateEntId;

                    const nodeDetail = parseNodeDetailRecord(selectedNode?.NodeDetail);
                    let existingFileUID = String(
                        selectedNode?.FileUID
                        || nodeDetail?.FileUID
                        || parsedData[0].FileUID
                        || ""
                    ).trim();
                    let existingFileExtension = getFileExtensionFromFileName(
                        selectedNode?.TemplateFileName
                        || String(nodeDetail?.TemplateFileName ?? "")
                        || parsedData[0].TemplateFileName
                        || parsedData[0].FPFileName
                        || parsedData[0].SelectFileName
                    );

                    // Node.FileUID is intermittently missing after tree refresh — resolve from FileProfile.
                    if (!existingFileUID) {
                        const fileProfileRecord = await new Promise<Record<string, unknown> | null>((resolve) => {
                            void axiosInterceptor(
                                {
                                    url: EM.GetEntityRecords,
                                    data: {
                                        entityName: EntityNameEnums.ReportProfile,
                                        tableName: "PG.FileProfile",
                                        entIDs: updateEntId,
                                    },
                                    allowShowLoader: false,
                                    setFetchData: (getEntityRecordsApiResponse: unknown, status?: string) => {
                                        try {
                                            if (status === "200" && typeof getEntityRecordsApiResponse === "string") {
                                                const extractedData = FnHandleAPIResponse(getEntityRecordsApiResponse, "Dataset");
                                                resolve(extractedData?.["PG.FileProfile"]?.[0] ?? null);
                                                return;
                                            }
                                        } catch (error) {
                                            console.error("Failed to resolve report template FileUID:", error);
                                        }
                                        resolve(null);
                                    },
                                },
                                statusBarContext
                            ).catch((error) => {
                                console.error("Failed to fetch report template FileProfile:", error);
                                resolve(null);
                            });
                        });

                        if (fileProfileRecord) {
                            existingFileUID = String(fileProfileRecord.FileUID ?? "").trim();
                            if (fileProfileRecord.FileExtension) {
                                const extension = String(fileProfileRecord.FileExtension);
                                existingFileExtension = extension.startsWith(".")
                                    ? extension
                                    : `.${extension}`;
                            } else if (fileProfileRecord.DocName) {
                                existingFileExtension = getFileExtensionFromFileName(
                                    String(fileProfileRecord.DocName)
                                );
                            }
                        }
                    }

                    if (existingFileUID) {
                        try {
                            await axiosInterceptor(
                                {
                                    url: FS.DeleteFileStream,
                                    data: {
                                        fileCategory: "Text",
                                        fileExtension: existingFileExtension,
                                        fileUID: existingFileUID,
                                    },
                                    // Always continue to upload even if response body is empty.
                                    setFetchData: () => { },
                                },
                                statusBarContext
                            );
                        } catch (error) {
                            // Still upload the replacement file if delete fails (e.g. already removed).
                            console.error("Failed to delete existing report template file stream:", error);
                        }
                    }

                    await callApiToUploadFile(updateEntId);
                } else {
                    callApiToSaveEntityRecord("update");
                }
            }
            else {
                callApiToSaveEntityRecord("add");
            }
        } catch (error) {
            console.error('Failed to save report template:', error);
            openOkConfirm('Failed to save report template.');
        }
    }

    const handleClickYesForConfirm = async () => {
        setIsConfirmOpen(false);
        try {
            if (defaultSelectedNodeInfo?.node?.FileUID) {
                await axiosInterceptor(
                    {
                        url: FS.DeleteFileStream,
                        data: {
                            fileCategory: "Text",
                            fileExtension: getFileExtensionFromFileName(defaultSelectedNodeInfo.node.TemplateFileName),
                            fileUID: defaultSelectedNodeInfo.node.FileUID,
                        },
                        setFetchData: () => { },
                    },
                    statusBarContext
                );
            }

            const handleDeleteEntityRecordsApiResponse = (deleteEntityRecordsApiResponse: unknown, status?: string) => {
                if (status === "200" && deleteEntityRecordsApiResponse !== undefined) {
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Entity,
                        SubGroupName: LogSubGroupName.Entity,
                        LogName: LogName.DeleteEntity,
                        actionObject: {
                            Name: defaultSelectedNodeInfo?.node.Name,
                            FeatureName: reportTemplateProps.selectedSubGroup,
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    };
                    FnCreateForensiclog(payload);
                    lastModifiedNodeEntIDRef.current = undefined;
                    callApiForRefreshTreeData(entityName, `_${entityName}`);
                }
            };

            if (defaultSelectedNodeInfo?.node) {
                await axiosInterceptor({
                    url: EM.DeleteEntityRecords,
                    data: {
                        entityName,
                        entIDs: defaultSelectedNodeInfo.node.NodeEntID
                    },
                    setFetchData: handleDeleteEntityRecordsApiResponse
                }, statusBarContext);
            }
        } catch (error) {
            console.error('Failed to delete report template:', error);
            openOkConfirm('Failed to delete report template.');
        }
    }

    useEffect(() => {
        const isSelectedGroupNode = isGroupNode(defaultSelectedNodeInfo?.node);
        const isTemplate = defaultSelectedNodeInfo?.node.IsTemplate ? true : false;
        const customIcons: IActionImage[] = !isReportProfileNode(defaultSelectedNodeInfo?.node) ? [{
            uniqueName: `${reportTemplateProps.uniqueName}-ai-export`,
            image: {
                uniqueName: `${reportTemplateProps.uniqueName}-i-export`,
                source: <Export24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill='none'
                    strokeWidth={1} />,
                w: 'var(--image-size-2)',
                tooltip: isSelectedGroupNode ? 'Download group templates' : 'Download all templates'
            },
            w: 'var(--node_height)',
            disabled: isAddMode ? true : false,
            actionCode: 'downloadall',
            handleMouse: function (): void { }
        }, {
            uniqueName: `${reportTemplateProps.uniqueName}-ai-import`,
            image: {
                uniqueName: `${reportTemplateProps.uniqueName}-i-import`,
                source: <Import24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill='none'
                    strokeWidth={1} />,
                w: 'var(--image-size-2)',
                tooltip: isSelectedGroupNode ? 'Upload group templates' : 'Upload all templates'
            },
            w: 'var(--node_height)',
            disabled: isAddMode ? true : false,
            actionCode: 'import',
            handleMouse: function (): void { }
        }] : [{
            uniqueName: `${reportTemplateProps.uniqueName}-ai-clone`,
            image: {
                uniqueName: `${reportTemplateProps.uniqueName}-i-clone`,
                source: <Copy24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill='none'
                    strokeWidth={1} />,
                w: 'var(--image-size-2)',
                tooltip: 'Clone Selected Report Template'
            },
            w: 'var(--node_height)',
            disabled: isAddMode ? true : false,
            actionCode: 'clonelayout',
            handleMouse: function (): void { }
        }, {
            uniqueName: `${reportTemplateProps.uniqueName}-ai-export`,
            image: {
                uniqueName: `${reportTemplateProps.uniqueName}-i-export`,
                source: <Export24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill='none'
                    strokeWidth={1} />,
                w: 'var(--image-size-2)',
                tooltip: 'Export Selected Report Template'
            },
            w: 'var(--node_height)',
            disabled: isAddMode ? true : isPreviewEditDisabled,
            actionCode: 'exportlayout',
            handleMouse: function (): void { }
        }, {
            uniqueName: `${reportTemplateProps.uniqueName}-ai-preview`,
            image: {
                uniqueName: `${reportTemplateProps.uniqueName}-i-preview`,
                source: <Report24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill='none'
                    strokeWidth={1} />,
                w: 'var(--image-size-2)',
                tooltip: 'Preview Selected Report Template',
            },
            w: 'var(--node_height)',
            disabled: isAddMode ? true : isPreviewEditDisabled,
            actionCode: 'preview',
            handleMouse: function (): void { }
        }, {
            uniqueName: `${reportTemplateProps.uniqueName}-ai-edit`,
            image: {
                uniqueName: `${reportTemplateProps.uniqueName}-i-edit`,
                source: <Edit24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill='none'
                    strokeWidth={1} />,
                w: 'var(--image-size-2)',
                tooltip: 'Edit Selected Report Template'
            },
            w: 'var(--node_height)',
            disabled: isAddMode || isTemplate ? true : isPreviewEditDisabled,
            actionCode: 'editlayout',
            handleMouse: function (): void { }
        }];
        setPreviewEditIcons(customIcons);
    }, [isPreviewEditDisabled, reportTemplateProps.uniqueName, defaultSelectedNodeInfo, isAddMode]);

    return (
        <div key={reportTemplateProps.uniqueName} className='nz-template-container'>
            {controlData && treeData && treeContainerProps && <TreeWithFormEditor
                uniqueName={`${reportTemplateProps.uniqueName}-report_template`}
                formControls={allowRenderForm ? controlData : []}
                treeData={treeData}
                defaultSelectedKeys={defaultSelectedKeys}
                defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                defaultExpandedKeys={defaultExpandedKeys}
                featureTreeProps={treeContainerProps.featureTreeProps}
                allowShowHeader={false}
                entityName={entityName}
                headerText={isAddMode === false ? `${defaultSelectedNodeInfo?.node.IsTemplate ? "View" : "Edit"} ${reportTemplateProps.selectedSubGroup}` : `Add ${reportTemplateProps.selectedSubGroup}`}
                profileString={profileString}
                id={isAddMode ? "" : (defaultSelectedNodeInfo?.node?.RecID || defaultSelectedNodeInfo?.node?.NodeEntID || defaultSelectedNodeInfo?.node?.EntID || "")}
                headerTextForTree={reportTemplateProps.selectedSubGroup}
                allowAdd={true}
                allowDelete={true}
                customIcons={allowCustomIcon ? previewEditIcons : undefined}
                componentToRender={controlHtmlToRender ?? undefined}
                disableAdd={isAddMode === true}
                disableDelete={defaultSelectedNodeInfo?.node.IsTemplate ? true : disableDelete}
                handleAIClick={handleAIClick}
                handleNodeSelect={handleNodeSelect}
                handleSaveAction={handleSaveAction}
                isDisableForm={defaultSelectedNodeInfo?.node.IsTemplate ? true : false}

            />}
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={`${reportTemplateProps.uniqueName}-confirm-dialog`}
                message={confirmMessage}
                showOkButton={isShowOkButton}
                handleYesButtonClick={handleClickYesForConfirm}
                handleNoButtonClick={() => {
                    setIsConfirmOpen(false);
                }}
                handleOkButtonClick={() => {
                    setIsConfirmOpen(false);
                }} />
        </div>
    )
}
export { ReportTemplate }

import { FnGetApiProfiles } from "../../../../../../shared/allcommon/FnGetApiProfiles";

import { DragEvent, useEffect, useRef, useState } from "react"
import { DataTable, ImageObject, KonvaEditor, layoutConfig, TextObject } from '@n20a/libreport'
import '../../../../../allcss/appqasettingscontainer/template/EditReportLayout.css'
import '@n20a/libreport/style.css'
import { defaultChart, defaultDataTable, defaultImage, defaultMarkdown, defaultSpace, defaultText } from "../../../../../alldefaultprops/EditReportLayoutDefaultProps"
import { IEditReportLayout } from "../../../../../allinterface/iappqasettingscontainer/template/IEditReportLayout"
import { IMainMenu } from "../../../../../../shared/allinterface/menu/IMainMenu"
import { axiosInterceptor } from "../../../../../../shared/interceptors/Interceptor"
import { EM, FS } from "../../../../../../shared/interceptors/EndPoints"
import { useStatusBarContext } from "../../../../../../shared/context/hooks/StatusBarHooks"
import { Label } from "../../../../../../shared/basic/label/Label"
import { useSessionContext } from "../../../../../../shared/context/hooks/SessionHooks"
import { MainMenu } from "../../../../../../shared/menu/mainmenu/MainMenu"
import { getDiagnosticLevelData } from "../../../../../../shared/context/contextandprovider/CommonVariable"
import { useSelectedNodeContext } from "../../../../../../shared/context/hooks/SelectedNodeHooks"
import { FnGenerateUniqueId } from "../../../../../../shared/allcommon/basic/FnGenerateUniqueId"
import { useMainAppContext } from "../../../../../../shared/context/hooks/MainAppHooks"
import { FnParseJsonSafely } from "../../../../../../appcontainer/allcommon/FnParseJsonSafely"
import { DEFAULT_REPORT_TEMPLATE_EXTENSION } from "../../../../../allcommon/FnReportTemplateHelpers"
import { EntityNameEnums } from "../../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer"
import { FnHandleAPIResponse } from "../../../../../../shared/allcommon/settingsform/FnHandleAPIResponse"
import { FnGetEnvVariableByKey } from "../../../../../../appcontainer/allcommon/FnGetEnvVariableByKey"
import { envVarEnums } from "../../../../../../appcontainer/alldefaultprops/DefaultPropsAppContainer"
import { IPayloadObject, PayloadValue } from "../../../../../../shared/allinterface/IAppqaSettingsContainer"

type IFileProfileRecord = {
    FileUID?: string;
    EntityName?: string;
    FileCategory?: string;
    DocName?: string;
    FileExtension?: string;
};

const getFileExtensionFromFileName = (fileName?: string | null): string => {
    const normalizedFileName = fileName?.trim();
    if (!normalizedFileName?.includes(".")) {
        return `.${DEFAULT_REPORT_TEMPLATE_EXTENSION}`;
    }
    const extension = normalizedFileName.slice(normalizedFileName.lastIndexOf(".")).toLowerCase();
    return extension.startsWith(".") ? extension : `.${extension}`;
};

const reportLayoutMenus = [
    {
        "disable": "FALSE",
        "objectName": "Text",
        "Label": "Text",
        "Tooltip": "Add a Label or a Paragraph",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Image",
        "Label": "Image",
        "Tooltip": "Add an Image",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Chart",
        "Label": "Chart",
        "Tooltip": "Add a Chart",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "Markdown",
        "Label": "Markdown",
        "Tooltip": "Add Markdown",
        "separator": "",
        "draggable": "TRUE"
    },
    {
        "disable": "FALSE",
        "objectName": "DataTable",
        "Label": "DataTable",
        "Tooltip": "Add a DataTable",
        "separator": "",
        "draggable": "TRUE"
    },
]

const EditReportLayout = (reportLayoutContainerProps: IEditReportLayout) => {
    const [actionImageProps, setActionImageProps] = useState<IMainMenu | null>(null)
    const [isSaveProcessing, setIsSaveProcessing] = useState<boolean>(false);
    const [reportLayoutJson, setReportLayoutJson] = useState<layoutConfig>();
    const [selectedFileUID, setSelectedFileUID] = useState<string>("");
    const [key, setKey] = useState<string>(); // State to force re-render
    const updatedTemplateDataRef = useRef<unknown>(undefined);
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const selectedNodeContext = useSelectedNodeContext();
    const mainAppContext = useMainAppContext();
    const [apiProfileRecords, setApiProfileRecords] = useState<Record<string, any>[]>(mainAppContext?.apiProfileRecords ?? []);
    const diagnosticLevel = getDiagnosticLevelData() ?? "0";

    const fetchCurrentFileProfileRecord = (selectedNode: IEditReportLayout["selectedNode"]): Promise<IFileProfileRecord | null> =>
        new Promise((resolve) => {
            if (!selectedNode?.NodeEntID) {
                resolve(null);
                return;
            }

            void axiosInterceptor(
                {
                    url: EM.GetEntityRecords,
                    data: {
                        entityName: EntityNameEnums.ReportProfile,
                        tableName: "PG.FileProfile",
                        entIDs: selectedNode.NodeEntID,
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
                            console.error("Failed to parse report template file profile:", error);
                        }
                        resolve(null);
                    },
                },
                statusBarContext
            ).catch((error) => {
                console.error("Failed to fetch report template file profile:", error);
                resolve(null);
            });
        });

    const deleteCurrentFileStream = async (
        selectedNode: IEditReportLayout["selectedNode"],
        templateFileName: string,
        fallbackFileUID?: string
    ): Promise<string> => {
        const currentFileProfileRecord = await fetchCurrentFileProfileRecord(selectedNode);
        const fileUID = String(
            currentFileProfileRecord?.FileUID
            || fallbackFileUID
            || selectedNode?.FileUID
            || ""
        ).trim();

        if (!fileUID) {
            return "";
        }

        await axiosInterceptor(
            {
                url: FS.DeleteFileStream,
                data: {
                    fileCategory: currentFileProfileRecord?.FileCategory ?? "Text",
                    fileExtension: currentFileProfileRecord?.FileExtension
                        ?? getFileExtensionFromFileName(currentFileProfileRecord?.DocName ?? templateFileName),
                    fileUID,
                },
                allowShowLoader: true,
                setFetchData: () => { },
            },
            statusBarContext
        );

        return fileUID;
    };

    const uploadLayoutFileStream = async (
        selectedNode: IEditReportLayout["selectedNode"],
        templateFileName: string,
        fileExtension: string,
        fileBlob: string,
        userName: string
    ): Promise<unknown> =>
        new Promise((resolve) => {
            void axiosInterceptor(
                {
                    url: FS.UploadFileStream,
                    data: {
                        fileCategory: "Text",
                        fileExtension,
                        fileBlob,
                        fileName: templateFileName,
                        prefix: "Floor",
                        userName,
                        entID: selectedNode.NodeEntID,
                        entityName: selectedNode.NodeEntityname,
                    },
                    allowShowLoader: true,
                    setFetchData: (res: unknown) => resolve(res),
                },
                statusBarContext
            ).catch((error) => {
                console.error("Failed to upload report template layout:", error);
                resolve(null);
            });
        });

    const updateSelectedFileUIDFromUploadResponse = (uploadFileStreamResponse: unknown) => {
        if (
            uploadFileStreamResponse &&
            typeof uploadFileStreamResponse === "object" &&
            "fileUID" in uploadFileStreamResponse
        ) {
            setSelectedFileUID(String(uploadFileStreamResponse.fileUID ?? ""));
        }
    };

    useEffect(() => {
        if (reportLayoutMenus.length > 0) {
            let payload: IMainMenu = {
                uniqueName: "edit_report_layout_menu",
                isVertical: true, // if true then action images should be displayed vertically
                w: "40px", // Width of the entire container
                h: "100%", // Height of the entire container
                bgColor: "var(--secondary)", // Background color of the container
                allowDND: true,
                featureData: reportLayoutMenus,
                menuSize: 'md',
                actionImageW: 40,
                actionImageH: 40,
            }
            setActionImageProps(payload)
        }
    }, [reportLayoutMenus])

    useEffect(() => {
        if (reportLayoutContainerProps.reportLayoutTemplate) {
            try {
                function clearInmemoryUrl<T>(input: T): T {
                    // Handle arrays
                    if (Array.isArray(input)) {
                        return input.map(item => clearInmemoryUrl(item)) as unknown as T;
                    }
                    // Handle objects
                    if (input !== null && typeof input === "object") {
                        const result: Record<string, unknown> = {};
                        Object.keys(input).forEach((key) => {
                            if (key === "inmemoryUrl") {
                                result[key] = "";
                            } else {
                                result[key] = clearInmemoryUrl(
                                    (input as Record<string, unknown>)[key]
                                );
                            }
                        });
                        return result as T;
                    }
                    // Return primitive values as-is
                    return input;
                }
                let parsedJson = FnParseJsonSafely(reportLayoutContainerProps.reportLayoutTemplate);
                parsedJson = reportLayoutContainerProps.allowEdit ? clearInmemoryUrl(parsedJson) : parsedJson;
                setReportLayoutJson(parsedJson);
                setKey(FnGenerateUniqueId())
            } catch (error) {
                console.error('error :', error);
            }
        }
    }, [reportLayoutContainerProps.reportLayoutTemplate, reportLayoutContainerProps.allowEdit])

    // Convert Blob to base64 string
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onloadend = () => {
                const base64data = (reader.result as string).split(',')[1]; // Remove data:...base64, prefix
                resolve(base64data);
            };
            reader.readAsDataURL(blob);
        });
    };

    useEffect(() => {
        const cleanup = async () => {
            if (
                reportLayoutContainerProps.selectedNode &&
                updatedTemplateDataRef.current
            ) {
                const confirmLeave = window.confirm("Save changes before leaving?");
                if (!confirmLeave) return;
                const selectedNode = reportLayoutContainerProps.selectedNode;
                const templateFileName = selectedNode.TemplateFileName ?? "";
                const fileExtension = getFileExtensionFromFileName(templateFileName);
                const jsonString = JSON.stringify(updatedTemplateDataRef.current);
                const jsonBlob = new Blob([jsonString], { type: "application/json" });
                const userNameEntry = sessionContext.SessionList?.find(
                    (item) => item.VariableName === "LoginShortName"
                );
                const userName = userNameEntry?.SessionValue;
                if (!userName) return;
                const base64String = await blobToBase64(jsonBlob);
                await deleteCurrentFileStream(selectedNode, templateFileName, selectedFileUID);
                const uploadFileStreamResponse = await uploadLayoutFileStream(
                    selectedNode,
                    templateFileName,
                    fileExtension,
                    base64String,
                    userName
                );
                updateSelectedFileUIDFromUploadResponse(uploadFileStreamResponse);
                reportLayoutContainerProps.handleReloadTree?.();
            }
        };
        return () => {
            void cleanup();
        };
    }, []);

    useEffect(() => {
        if (reportLayoutContainerProps.selectedNode) {
            setSelectedFileUID(reportLayoutContainerProps.selectedNode.FileUID || "");
        }
    }, [reportLayoutContainerProps.selectedNode])

    const handleDrag = (event: React.DragEvent<any>, actionCode?: any) => {
        event.dataTransfer.setData("custom/type", JSON.stringify(actionCode));
        event.dataTransfer.effectAllowed = "move";
    };

    const handleEndDrag = async (event: any, actionCode?: any) => {
        let clientX: number = event.clientX;
        let clientY: number = event.clientY;
        let DropDiv: HTMLElement | null = document.elementFromPoint(clientX, clientY) as HTMLElement;
        let closestNode = DropDiv.closest('.rc-tree-treenode');
        if (!closestNode) {

            if (!DropDiv) return;
            let attrib = DropDiv.getAttribute("allow-drop");
            if (attrib) {
                alert('End drag: ' + JSON.stringify(actionCode));
            }
        }
    };

    const handleSaveLayout = async (data: layoutConfig) => {
        if (isSaveProcessing) return; // Prevent multiple clicks
        setIsSaveProcessing(true);
        try {
            statusBarContext.setIsLoading(true);
            const selectedNode = reportLayoutContainerProps.selectedNode;
            const templateFileName = selectedNode.TemplateFileName ?? "";
            const fileExtension = getFileExtensionFromFileName(templateFileName);
            const jsonString = JSON.stringify(data);
            const jsonBlob = new Blob([jsonString], { type: "application/json" });
            const userNameEntry = sessionContext.SessionList?.find((item) => item.VariableName === "LoginShortName");
            const userName = userNameEntry?.SessionValue;
            if (!userName) return;
            const base64String = await blobToBase64(jsonBlob);
            await deleteCurrentFileStream(selectedNode, templateFileName, selectedFileUID);
            const uploadFileStreamResponse = await uploadLayoutFileStream(
                selectedNode,
                templateFileName,
                fileExtension,
                base64String,
                userName
            );
            updateSelectedFileUIDFromUploadResponse(uploadFileStreamResponse);
            updatedTemplateDataRef.current = undefined;
            reportLayoutContainerProps.handleReloadTree?.();
        } catch (error) {
            console.error('error :', error);
        }
        finally {
            setIsSaveProcessing(false);
            statusBarContext.setIsLoading(false);
        }
    }

    function handlePageUpdate(page: layoutConfig): void {
        if (import.meta.env.DEV)
            console.log('handlePageUpdate page :', page);
    }

    function handleSelectedIdChange(id: string | null): void {
        if (import.meta.env.DEV)
            console.log('handleSelectedIdChange id :', id);
    }

    const handleDragStart = (event: DragEvent<HTMLDivElement>, actionCode?: any) => {
        let objectToTransfer: TextObject | DataTable | ImageObject | null = null;
        switch (actionCode.actionCode) {
            case "Text":
                objectToTransfer = defaultText('text', "Text", 0, 0);
                break;
            case "Space":
                objectToTransfer = defaultSpace('image', "Space", 0, 0);
                break;
            case "Markdown":
                objectToTransfer = defaultMarkdown('markdown', "Markdown", 0, 0);
                break;
            case "Image":
                objectToTransfer = defaultImage('image', "Image", 0, 0);
                break;
            case "Chart":
                objectToTransfer = defaultChart('image', "Chart", 0, 0);
                break;
            case "DataTable":
                objectToTransfer = defaultDataTable('datatable', "DataTable", 0, 0);
                break;
            default:
                break;
        }
        event.dataTransfer.setData("objectTemplate", JSON.stringify(objectToTransfer));
    }

    const handleGetSessionVariables = (): Record<string, any> => {
        const sessionObj: Record<string, string | null> = {};
        sessionContext.SessionList.forEach((s) => {
            if (s.VariableContext && s.VariableName && s.AllowInReport) {
                const key = `${s.VariableName}`;
                sessionObj[key] = s.SessionValue ?? null;
            }
        });
        const configObj: Record<string, string | null> = {};
        const filteredAp = mainAppContext.apRecords.filter((item) => item.SubGroupName.toLowerCase() === "configure");
        if (filteredAp.length) {
            for (let index = 0; index < filteredAp.length; index++) {
                const element = filteredAp[index];
                configObj[`${element.Name}`] = element.Value;
            }
        }
        const selectedNodeObj: Record<string, any> = {};
        if (selectedNodeContext.selectedNodeProperty) {
            Object.keys(selectedNodeContext.selectedNodeProperty).forEach((key) => {
                const value = selectedNodeContext.selectedNodeProperty?.[key];
                if (value !== undefined && typeof value !== "object") {
                    selectedNodeObj[key] = value;
                }
            });
        }
        const finalObj = {
            session: sessionObj,
            selectednode: selectedNodeObj,
            configure: configObj,
            workorder: selectedNodeContext.selectedWorkorderRecord,
            sessionid: statusBarContext.userSessionId,
            deployment: {
                N20_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.N20_API_URL
                ),
                DCMLISTENER_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.DCMLISTENER_API_URL
                ),
                EXPSERVER_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.EXPSERVER_API_URL
                ),
                NZINTHUB_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.NZINTHUB_API_URL
                )
            }
        };
        return finalObj
    }

    const updatePayloadFromSessionAndNodeProperty = (
        payload: IPayloadObject
    ): IPayloadObject => {

        const updatedPayload: IPayloadObject = {};

        try {

            const convertToCorrectType = (value: PayloadValue): PayloadValue => {

                if (typeof value !== "string") {
                    return value;
                }

                const trimmed = value.trim().toLowerCase();

                if (trimmed === "true") {
                    return true;
                }

                if (trimmed === "false") {
                    return false;
                }

                if (trimmed === "") {
                    return "";
                }

                // Handle numeric string
                if (!Number.isNaN(Number(trimmed)) && trimmed !== "") {
                    return Number(trimmed);
                }

                return value;
            };

            const resolvePlaceholder = (val: string): PayloadValue => {

                try {

                    const isPlaceholder = /^<[^<>?]+(\?)?>$/.test(val);

                    if (!isPlaceholder) {
                        return convertToCorrectType(val);
                    }

                    const isOptional = val.includes("?>");

                    const key = val.replace(/^<|[\?>]*>$/g, "");

                    const sessionItem = sessionContext.SessionList?.find(
                        (item) => item.VariableName === key
                    );

                    const sessionValue = sessionItem?.SessionValue;

                    const nodeValue =
                        selectedNodeContext.selectedNodeProperty?.[
                        key as keyof typeof selectedNodeContext.selectedNodeProperty
                        ];

                    const nodePropertyValue =
                        selectedNodeContext.selectedNodeAllProperties?.[
                        key as keyof typeof selectedNodeContext.selectedNodeAllProperties
                        ];

                    const resolved =
                        sessionValue ??
                        nodeValue ??
                        nodePropertyValue;

                    if (resolved !== undefined) {
                        return convertToCorrectType(resolved as PayloadValue);
                    }

                    return isOptional ? undefined : "";

                } catch (error) {

                    console.error(
                        "Error resolving placeholder:",
                        val,
                        error
                    );

                    return undefined;
                }
            };

            const processValue = (
                value: PayloadValue
            ): PayloadValue => {

                try {

                    if (Array.isArray(value)) {

                        return value
                            .map((item) => processValue(item))
                            .filter(
                                (item): item is Exclude<PayloadValue, undefined> =>
                                    item !== undefined
                            );
                    }

                    if (
                        value !== null &&
                        typeof value === "object"
                    ) {

                        const result: IPayloadObject = {};

                        Object.keys(value).forEach((key) => {

                            const processed = processValue(
                                value[key]
                            );

                            if (processed !== undefined) {
                                result[key] = processed;
                            }
                        });

                        return result;
                    }

                    if (typeof value === "string") {
                        return resolvePlaceholder(value);
                    }

                    return convertToCorrectType(value);

                } catch (error) {

                    console.error(
                        "Error processing payload value:",
                        value,
                        error
                    );

                    return undefined;
                }
            };

            Object.keys(payload).forEach((key) => {

                try {

                    const normalizedKey = key.endsWith("?")
                        ? key.slice(0, -1)
                        : key;

                    if (normalizedKey === "sessionId") {
                        return;
                    }

                    const processed = processValue(payload[key]);

                    if (processed !== undefined) {
                        updatedPayload[normalizedKey] = processed;
                    }

                } catch (error) {

                    console.error(
                        `Error processing key: ${key}`,
                        error
                    );
                }
            });

        } catch (error) {

            console.error(
                "Error in updatePayloadFromSessionAndNodeProperty:",
                error
            );
        }

        return updatedPayload;
    };

    function resolvePayload(payload: string): string {
        const resolvePayload = updatePayloadFromSessionAndNodeProperty(FnParseJsonSafely(payload))
        return JSON.stringify(resolvePayload);
    }

    const fetchApiProfiles = () => {
        void FnGetApiProfiles({
            mainAppContext,
            statusBarContext,
            onSuccess: setApiProfileRecords,
        });
    };

    useEffect(() => {
        if (!mainAppContext?.apiProfileRecords || !Array.isArray(mainAppContext.apiProfileRecords) || mainAppContext.apiProfileRecords.length === 0) {
            fetchApiProfiles();
        }
    }, []);

    useEffect(() => {
        if (mainAppContext?.apiProfileRecords?.length) {
            setApiProfileRecords(mainAppContext.apiProfileRecords);
        }
    }, [mainAppContext?.apiProfileRecords]);

    const handleGetApiList = (): { api: string; desc: string, payload: any }[] => {
        const apiRecords = (mainAppContext.apiProfileRecords && mainAppContext.apiProfileRecords.length > 0)
            ? mainAppContext.apiProfileRecords
            : apiProfileRecords;

        if (!Array.isArray(apiRecords) || apiRecords.length === 0) {
            fetchApiProfiles();
            return [];
        }

        const seen = new Set<string>();
        const result: {
            api: string;
            desc: string;
            payload: any;
        }[] = [];

        for (const record of apiRecords) {
            const api = String(
                record?.Method ?? record?._ApiProfile ?? ""
            ).trim();

            if (!api || seen.has(api) || !record?.Public) {
                continue;
            }

            seen.add(api);

            const desc = String(
                record?.Description ?? record?.APIPurpose ?? ""
            );

            const payload = FnParseJsonSafely(record?.Payload);

            result.push({
                api,
                desc,
                payload
            });
        }

        return result;
    };

    return (
        <div key={reportLayoutContainerProps.uniqueName} className='nz-edit-report-layout-container'>
            <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                <div className="nz-d-flex-row nz-align-center nz-w-100">
                    <div className="nz-header-edit-report-with-icon">
                        <Label uniqueName={`${reportLayoutContainerProps.uniqueName}-fqa-container`}
                            label={`${reportLayoutContainerProps.allowEdit ? `Editing ${reportLayoutContainerProps.isLandScaped ? "Landscape" : "Portrait"} Report Layout: ${reportLayoutContainerProps.templateName}` : "Preview Report Layout"} `}
                        />
                    </div>
                </div>
            </div>
            <div className='nz-edit-report-layout' >
                {actionImageProps && reportLayoutContainerProps.allowEdit && <MainMenu
                    {...actionImageProps}
                    handleDrag={handleDrag}
                    handleEndDrag={handleEndDrag}
                    handleStartDrag={handleDragStart}
                    isVertical={true}
                    compact={true}
                    isIconVertical={true}
                />}
                <div className="nz-edit-report-layout-content">
                    {reportLayoutJson ? <KonvaEditor
                        initialPage={reportLayoutJson}
                        key={key}
                        callbackSave={handleSaveLayout}
                        debugLevel={diagnosticLevel ? Number(diagnosticLevel) : 0}
                        mode={reportLayoutContainerProps.allowEdit ? "editor" : "viewer"}
                        onPageUpdate={handlePageUpdate}
                        getSessionVars={handleGetSessionVariables}
                        onSelectedIdChange={handleSelectedIdChange}
                        getApis={handleGetApiList}
                        resolvePayload={resolvePayload}
                    /> : <></>}
                </div>
            </div>
        </div>
    )
}
export { EditReportLayout }

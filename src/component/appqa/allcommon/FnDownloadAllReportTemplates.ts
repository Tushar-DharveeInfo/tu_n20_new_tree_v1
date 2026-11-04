import * as XLSX from 'xlsx';
import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { EM, FS } from "../../shared/interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../shared/allcommon/settingsform/FnHandleAPIResponse";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { EntityNameEnums } from "../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";

type IFileProfileRecord = {
    FileUID?: string;
    EntityName?: string;
    FileCategory?: string;
    DocName?: string;
    FileExtension?: string;
};

type IFnDownloadAllReportTemplatesResult = {
    cancelled?: boolean;
    message: string;
    downloadedCount: number;
    failedCount: number;
};

// Collects all ReportProfile nodes from the hierarchical tree.
const collectReportProfileNodes = (nodes: ITreeNode[] | undefined): ITreeNode[] => {
    if (!nodes?.length) {
        return [];
    }

    const reportProfileNodes: ITreeNode[] = [];
    const visitNodes = (nodeList: ITreeNode[]) => {
        nodeList.forEach((node) => {
            if (node.NodeEntityname === EntityNameEnums.ReportProfile) {
                reportProfileNodes.push(node);
            }
            if (node.children?.length) {
                visitNodes(node.children);
            }
        });
    };
    visitNodes(nodes);
    return reportProfileNodes;
};

const sanitizeFileNamePart = (value: string): string =>
    value.replace(/[\\/:*?"<>|]/g, '_').trim();

// Builds download file name using report profile / template name.
const buildReportTemplateFileName = (reportProfileName: string): string => {
    const safeReportProfileName = sanitizeFileNamePart(reportProfileName) || 'file';
    if (safeReportProfileName.toLowerCase().endsWith('.json')) {
        return safeReportProfileName;
    }
    return `${safeReportProfileName}.json`;
};

const getReportProfileNameForRecord = (record: Record<string, unknown>): string =>
    String(record._ReportProfile ?? '').trim();

const syncTemplateFileNameWithDownloadFileName = (
    records: Record<string, unknown>[]
): Record<string, unknown>[] =>
    records.map((record) => {
        const reportProfileName = getReportProfileNameForRecord(record);
        if (!reportProfileName) {
            return record;
        }

        return {
            ...record,
            TemplateFileName: buildReportTemplateFileName(reportProfileName),
        };
    });

const getReportProfileNameForNode = (
    node: ITreeNode,
    reportProfileRecords: Record<string, unknown>[]
): string => {
    const matchedRecord = reportProfileRecords.find(
        (record) => String(record.EntID) === String(node.NodeEntID)
    );
    const reportProfileName = String(
        matchedRecord?._ReportProfile
        ?? node._ReportProfile
        ?? node.Name
        ?? ''
    ).trim();

    return reportProfileName;
};

const getReportProfileRecordsFromApiData = (
    apiDataForTree: unknown,
    entityName: string
): Record<string, unknown>[] => {
    if (!apiDataForTree || typeof apiDataForTree !== 'object') {
        return [];
    }

    const entityTable = `_${entityName}`;
    const records = (apiDataForTree as Record<string, unknown>)[entityTable];
    return Array.isArray(records) ? records as Record<string, unknown>[] : [];
};

const isValidReportTemplateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) {
        return false;
    }

    const parsed = FnParseJsonSafely(jsonString);
    return parsed !== null && typeof parsed === 'object';
};

const fetchFileProfileRecord = (
    node: ITreeNode,
    statusBarContext: IStatusBar
): Promise<IFileProfileRecord | null> =>
    new Promise((resolve, reject) => {
        if (!node.NodeEntID) {
            resolve(null);
            return;
        }

        void axiosInterceptor(
            {
                url: EM.GetEntityRecords,
                data: {
                    entityName: EntityNameEnums.ReportProfile,
                    tableName: 'PG.FileProfile',
                    entIDs: node.NodeEntID,
                },
                allowShowLoader: false,
                setFetchData: (getEntityRecordsApiResponse: unknown, status?: string) => {
                    try {
                        if (status === '200' && typeof getEntityRecordsApiResponse === 'string') {
                            const extractedData = FnHandleAPIResponse(getEntityRecordsApiResponse, 'Dataset');
                            resolve(extractedData?.['PG.FileProfile']?.[0] ?? null);
                            return;
                        }
                        resolve(null);
                    } catch (error) {
                        console.error('Failed to read file profile record:', node.Name, error);
                        resolve(null);
                    }
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error('File profile API request failed:', node.Name, error);
            reject(error);
        });
    });

const fetchReportTemplateJson = (
    node: ITreeNode,
    fileRecord: IFileProfileRecord,
    statusBarContext: IStatusBar
): Promise<string | null> =>
    new Promise((resolve, reject) => {
        if (!node.NodeEntID || !fileRecord.FileUID) {
            resolve(null);
            return;
        }

        void axiosInterceptor(
            {
                url: FS.GetFileStream,
                data: {
                    entID: node.NodeEntID,
                    entityName: fileRecord.EntityName ?? EntityNameEnums.ReportProfile,
                    fileCategory: fileRecord.FileCategory ?? 'Text',
                    fileName: fileRecord.DocName ?? node.TemplateFileName,
                    fileExtension: fileRecord.FileExtension ?? '.txt',
                    fileUID: fileRecord.FileUID,
                },
                allowShowLoader: false,
                setFetchData: (getFileStreamApiResponse: unknown, status?: string) => {
                    try {
                        if (
                            status === '200' &&
                            getFileStreamApiResponse &&
                            typeof getFileStreamApiResponse === 'object' &&
                            'fileBlob' in getFileStreamApiResponse &&
                            (getFileStreamApiResponse.fileBlob as string)?.length
                        ) {
                            const jsonString = atob(getFileStreamApiResponse.fileBlob as string);
                            resolve(isValidReportTemplateJson(jsonString) ? jsonString : null);
                            return;
                        }
                        resolve(null);
                    } catch (error) {
                        console.error('Failed to decode report template file:', node.Name, error);
                        resolve(null);
                    }
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error('Report template file API request failed:', node.Name, error);
            reject(error);
        });
    });

const writeJsonFileToDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
    fileName: string,
    jsonString: string
): Promise<void> => {
    if (!isValidReportTemplateJson(jsonString)) {
        throw new Error('Invalid report template JSON content.');
    }

    const parsed = FnParseJsonSafely(jsonString);
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(parsed, null, 2));
    await writable.close();
};

const EXCEL_EXCLUDED_COLUMNS = ['EntID', 'RecID', 'SelectFileName'];

const omitExcelExcludedColumns = (
    records: Record<string, unknown>[]
): Record<string, unknown>[] =>
    records.map((record) => {
        const filteredRecord = { ...record };
        EXCEL_EXCLUDED_COLUMNS.forEach((columnName) => {
            delete filteredRecord[columnName];
        });
        return filteredRecord;
    });

const writeReportProfilesExcelToDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
    sheetName: string,
    records: Record<string, unknown>[]
): Promise<void> => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(omitExcelExcludedColumns(records));
    const safeSheetName = sheetName.replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

    const workbookBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([workbookBytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const excelFileName = `${safeSheetName}.xlsx`;
    const fileHandle = await directoryHandle.getFileHandle(excelFileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
};

const getFolderPickerErrorMessage = (err: unknown): string => {
    if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
            return 'Permission denied to access the selected folder.';
        }
        if (err.name === 'SecurityError') {
            return 'Folder access is blocked by browser security settings.';
        }
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    return 'Failed to download report templates.';
};

// Prompts for folder, exports report profiles excel, and downloads template JSON files by report profile name.
const FnDownloadAllReportTemplates = async (
    treeData: ITreeNode[],
    apiDataForTree: unknown,
    entityName: string,
    statusBarContext: IStatusBar
): Promise<IFnDownloadAllReportTemplatesResult> => {
    if (!window.showDirectoryPicker) {
        return {
            message: 'Folder selection is not supported in this browser.',
            downloadedCount: 0,
            failedCount: 0,
        };
    }

    let directoryHandle: FileSystemDirectoryHandle;
    try {
        directoryHandle = await window.showDirectoryPicker();
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            return {
                cancelled: true,
                message: '',
                downloadedCount: 0,
                failedCount: 0,
            };
        }

        console.error('Download all report templates failed:', err);
        return {
            message: getFolderPickerErrorMessage(err),
            downloadedCount: 0,
            failedCount: 0,
        };
    }

    const reportProfileNodes = collectReportProfileNodes(treeData);
    const reportProfileRecords = getReportProfileRecordsFromApiData(apiDataForTree, entityName);
    const entitySheetName = `_${entityName}`;

    if (!reportProfileNodes.length && !reportProfileRecords.length) {
        return {
            message: 'No report templates found to download.',
            downloadedCount: 0,
            failedCount: 0,
        };
    }

    statusBarContext.setIsLoading(true);
    let downloadedCount = 0;
    let failedCount = 0;
    let excelWritten = false;

    try {
        if (reportProfileRecords.length) {
            try {
                const excelRecords = syncTemplateFileNameWithDownloadFileName(reportProfileRecords);
                await writeReportProfilesExcelToDirectory(directoryHandle, entitySheetName, excelRecords);
                excelWritten = true;
            } catch (error) {
                console.error('Failed to write report profiles excel:', error);
            }
        }

        for (const node of reportProfileNodes) {
            if (!node.TemplateFileName || !node.NodeEntID) {
                failedCount += 1;
                continue;
            }

            try {
                const fileRecord = await fetchFileProfileRecord(node, statusBarContext);
                if (!fileRecord?.FileUID) {
                    failedCount += 1;
                    continue;
                }

                const jsonString = await fetchReportTemplateJson(node, fileRecord, statusBarContext);
                if (!jsonString) {
                    failedCount += 1;
                    continue;
                }

                const reportProfileName = getReportProfileNameForNode(node, reportProfileRecords);
                if (!reportProfileName) {
                    failedCount += 1;
                    continue;
                }

                const fileName = buildReportTemplateFileName(reportProfileName);
                await writeJsonFileToDirectory(directoryHandle, fileName, jsonString);
                downloadedCount += 1;
            } catch (error) {
                console.error('Failed to download report template:', node.Name, error);
                failedCount += 1;
            }
        }
    } catch (error) {
        console.error('Download all report templates failed:', error);
        return {
            message: getFolderPickerErrorMessage(error),
            downloadedCount,
            failedCount,
        };
    } finally {
        statusBarContext.setIsLoading(false);
    }

    if (excelWritten || downloadedCount > 0) {
        const excelMessage = excelWritten ? `Report profile excel (${entitySheetName}.xlsx) saved.` : '';
        const jsonMessage = downloadedCount > 0
            ? failedCount > 0
                ? `Downloaded ${downloadedCount} template file(s). Failed to download ${failedCount}.`
                : `Downloaded ${downloadedCount} template file(s) successfully.`
            : failedCount > 0
                ? `Failed to download ${failedCount} template file(s).`
                : '';

        return {
            message: [excelMessage, jsonMessage].filter(Boolean).join(' '),
            downloadedCount,
            failedCount,
        };
    }

    return {
        message: 'Failed to download report templates.',
        downloadedCount,
        failedCount,
    };
};

export { FnDownloadAllReportTemplates };
export type { IFnDownloadAllReportTemplatesResult };

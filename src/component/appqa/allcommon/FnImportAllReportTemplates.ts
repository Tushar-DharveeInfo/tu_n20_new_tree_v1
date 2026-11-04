import * as XLSX from 'xlsx';
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely';
import { axiosInterceptor } from '../../shared/interceptors/Interceptor';
import { EM, FS } from '../../shared/interceptors/EndPoints';
import { IStatusBar } from '../../shared/context/allinterface/IStatusBar';
import { ISession } from '../../shared/context/allinterface/ISession';
import { FileGroupNameEnums } from '../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import {
    applyDefaultReportLayoutIfNeeded,
    DEFAULT_REPORT_TEMPLATE_EXTENSION,
    getLoginShortNameFromSession,
    hasUploadedReportTemplateFile,
    resolveReportProfileTemplateFileName,
} from './FnReportTemplateHelpers';

type IFnImportAllReportTemplatesResult = {
    cancelled?: boolean;
    message: string;
    importedCount: number;
    failedCount: number;
    uploadFailedCount: number;
};

type IFnImportAllReportTemplatesOptions = {
    recordFilter?: (record: Record<string, unknown>) => boolean;
    recordTransform?: (record: Record<string, unknown>) => Record<string, unknown>;
    emptyFilterMessage?: string;
    existingProfileNames?: string[];
};

const DEFAULT_REPORT_FILE_EXTENSION = `.${DEFAULT_REPORT_TEMPLATE_EXTENSION}`;

const getFileExtensionFromFileName = (fileName?: string | null): string => {
    const normalizedFileName = fileName?.trim();
    if (!normalizedFileName?.includes('.')) {
        return DEFAULT_REPORT_FILE_EXTENSION;
    }

    const extension = normalizedFileName.slice(normalizedFileName.lastIndexOf('.')).toLowerCase();
    return extension.startsWith('.') ? extension : `.${extension}`;
};

const isValidReportTemplateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) {
        return false;
    }

    const parsed = FnParseJsonSafely(jsonString);
    return parsed !== null && typeof parsed === 'object';
};

const hasTemplateFileName = (row: Record<string, unknown>): boolean =>
    Boolean(String(row.TemplateFileName ?? '').trim() || String(row.FileUID ?? '').trim());

const prepareImportRecord = (row: Record<string, unknown>): Record<string, unknown> => {
    const record = { ...row };
    delete record.EntID;
    delete record.RecID;
    delete record.LastUpdated;
    return record;
};

const readFilesFromFileList = (fileList: FileList | null): Map<string, File> => {
    const filesByName = new Map<string, File>();
    Array.from(fileList ?? []).forEach((file) => {
        filesByName.set(file.name.toLowerCase(), file);
    });
    return filesByName;
};

const readJsonFilesFromDirectoryHandle = async (
    directoryHandle: FileSystemDirectoryHandle
): Promise<Map<string, File>> => {
    const filesByName = new Map<string, File>();

    const visitDirectory = async (handle: FileSystemDirectoryHandle): Promise<void> => {
        for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                if (file.name.toLowerCase().endsWith('.json')) {
                    filesByName.set(file.name.toLowerCase(), file);
                }
            } else if (entry.kind === 'directory') {
                await visitDirectory(entry);
            }
        }
    };

    await visitDirectory(directoryHandle);
    return filesByName;
};

const selectTemplateFolderFiles = async (): Promise<{
    templateFilesByName: Map<string, File>;
    folderSelectionCancelled: boolean;
    errorMessage?: string;
}> => {
    if (typeof window.showDirectoryPicker === 'function') {
        try {
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'read',
            });
            const templateFilesByName = await readJsonFilesFromDirectoryHandle(directoryHandle);
            return {
                templateFilesByName,
                folderSelectionCancelled: false,
            };
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                return {
                    templateFilesByName: new Map(),
                    folderSelectionCancelled: true,
                };
            }

            console.error('Folder selection failed:', err);
            return {
                templateFilesByName: new Map(),
                folderSelectionCancelled: true,
                errorMessage: 'Failed to open folder selection dialog.',
            };
        }
    }

    // Fallback for browsers without showDirectoryPicker.
    return new Promise((resolve) => {
        const folderInput = document.createElement('input');
        const directoryInput = folderInput as HTMLInputElement & {
            webkitdirectory?: boolean;
            directory?: boolean;
        };
        directoryInput.type = 'file';
        directoryInput.multiple = true;
        directoryInput.webkitdirectory = true;
        directoryInput.directory = true;
        // Do not set accept with webkitdirectory — it can block the dialog in Chromium.

        let settled = false;
        const finish = (
            templateFilesByName: Map<string, File>,
            folderSelectionCancelled: boolean
        ) => {
            if (settled) {
                return;
            }
            settled = true;
            directoryInput.remove();
            resolve({ templateFilesByName, folderSelectionCancelled });
        };

        directoryInput.addEventListener('cancel', () => finish(new Map(), true), { once: true });
        directoryInput.onchange = () => {
            finish(readFilesFromFileList(directoryInput.files), false);
        };

        directoryInput.style.display = 'none';
        document.body.appendChild(directoryInput);
        directoryInput.click();
    });
};

const selectExcelFile = (): Promise<File | null> =>
    new Promise((resolve) => {
        const excelInput = document.createElement('input');
        excelInput.type = 'file';
        excelInput.accept = '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

        let settled = false;
        const finish = (file: File | null) => {
            if (settled) {
                return;
            }
            settled = true;
            excelInput.remove();
            resolve(file);
        };

        excelInput.addEventListener('cancel', () => finish(null), { once: true });
        excelInput.onchange = () => {
            finish(excelInput.files?.[0] ?? null);
        };

        excelInput.style.display = 'none';
        document.body.appendChild(excelInput);
        excelInput.click();
    });

const readExcelReportProfileRecords = async (
    file: File,
    entityName: string
): Promise<Record<string, unknown>[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const entitySheetName = `_${entityName}`;
    const worksheet =
        workbook.Sheets[entitySheetName] ??
        workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
        return [];
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
    return rows.filter((row) => Object.keys(row).length > 0);
};

const normalizeProfileName = (profileName?: unknown): string => String(profileName ?? '').trim().toLowerCase();

const getDuplicateProfileNames = (
    records: Record<string, unknown>[],
    existingProfileNames?: string[]
): string[] => {
    const existingNames = new Set(
        (existingProfileNames ?? []).map(normalizeProfileName).filter(Boolean)
    );
    const seenImportNames = new Set<string>();
    const duplicates = new Set<string>();

    records.forEach((record) => {
        const profileName = String(record._ReportProfile ?? '').trim();
        const normalizedProfileName = normalizeProfileName(profileName);
        if (!normalizedProfileName) {
            return;
        }

        if (existingNames.has(normalizedProfileName) || seenImportNames.has(normalizedProfileName)) {
            duplicates.add(profileName);
            return;
        }

        seenImportNames.add(normalizedProfileName);
    });

    return Array.from(duplicates);
};

const findTemplateFileInFolder = (
    templateFileName: string | undefined,
    filesByName: Map<string, File>,
    fileUID?: string,
    reportProfileName?: string
): File | undefined => {
    const candidates: string[] = [];

    if (reportProfileName) {
        candidates.push(reportProfileName);
        if (!reportProfileName.toLowerCase().endsWith('.json')) {
            candidates.push(`${reportProfileName}.json`);
        }
    }

    if (fileUID) {
        candidates.push(`${fileUID}.json`);
    }

    if (templateFileName?.trim()) {
        const name = templateFileName.trim();
        candidates.push(name);
        if (!name.toLowerCase().endsWith('.json')) {
            candidates.push(`${name}.json`);
        }

        const dotIndex = name.lastIndexOf('.');
        const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
        candidates.push(`${baseName}.json`);
    }

    for (const candidate of candidates) {
        const file = filesByName.get(candidate.toLowerCase());
        if (file) {
            return file;
        }
    }

    return undefined;
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                reject(new Error('Failed to read template file.'));
                return;
            }
            resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('Failed to read template file.'));
        reader.readAsDataURL(file);
    });

const readTemplateFileAsBase64 = async (file: File): Promise<string | null> => {
    try {
        const text = await file.text();
        if (!isValidReportTemplateJson(text)) {
            return null;
        }

        return await fileToBase64(file);
    } catch (error) {
        console.error('Failed to read template file:', file.name, error);
        return null;
    }
};

const saveReportProfileRecord = (
    record: Record<string, unknown>,
    entityTable: string,
    statusBarContext: IStatusBar
): Promise<Record<string, unknown> | null> =>
    new Promise((resolve) => {
        void axiosInterceptor(
            {
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({ [entityTable]: [record] }),
                },
                allowShowLoader: false,
                setFetchData: (response: unknown, status?: string) => {
                    if (
                        status === '200' &&
                        response &&
                        typeof response === 'object' &&
                        'jsonStringOutput' in response
                    ) {
                        const savedData = FnParseJsonSafely(response.jsonStringOutput as string);
                        const savedRow = savedData?.[entityTable]?.[0];
                        resolve(savedRow && typeof savedRow === 'object' ? savedRow : null);
                        return;
                    }
                    resolve(null);
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error('Failed to save imported report profile:', error);
            resolve(null);
        });
    });

const deleteReportProfileRecord = (
    entId: string,
    entityName: string,
    statusBarContext: IStatusBar
): Promise<boolean> =>
    new Promise((resolve) => {
        void axiosInterceptor(
            {
                url: EM.DeleteEntityRecords,
                data: {
                    entityName,
                    entIDs: entId,
                },
                allowShowLoader: false,
                setFetchData: (_response: unknown, status?: string) => {
                    resolve(status === '200');
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error('Failed to delete imported report profile after upload failure:', error);
            resolve(false);
        });
    });

const uploadReportTemplateFile = async (
    row: Record<string, unknown>,
    entId: string,
    entityName: string,
    userName: string,
    statusBarContext: IStatusBar
): Promise<boolean> => {
    const uploadRow = { ...row };
    await applyDefaultReportLayoutIfNeeded(uploadRow, true);

    const userUploadedFile = hasUploadedReportTemplateFile(uploadRow);
    const templateFileName = resolveReportProfileTemplateFileName(uploadRow, true);
    const uploadFileName = String(
        uploadRow.FPFileName
        || uploadRow.SelectFileName
        || templateFileName
        || uploadRow._ReportProfile
        || ''
    );
    const fileExtension = userUploadedFile
        ? getFileExtensionFromFileName(uploadFileName)
        : DEFAULT_REPORT_FILE_EXTENSION;

    return new Promise((resolve) => {
        void axiosInterceptor(
            {
                url: FS.UploadFileStream,
                data: {
                    fileCategory: 'Text',
                    fileExtension,
                    fileBlob: uploadRow.FPFileContent,
                    fileName: uploadFileName,
                    prefix: FileGroupNameEnums.Report,
                    userName,
                    entityname: entityName,
                    entID: entId,
                },
                allowShowLoader: false,
                setFetchData: (_response: unknown, status?: string) => {
                    resolve(status === '200');
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error('Failed to upload imported report template file:', error);
            resolve(false);
        });
    });
};

// Prompts for template folder (while Import click gesture is active), then excel.
// Nested file-input clicks are blocked by Chromium, so folder uses showDirectoryPicker.
const FnImportAllReportTemplates = async (
    entityName: string,
    statusBarContext: IStatusBar,
    sessionList?: ISession[],
    options?: IFnImportAllReportTemplatesOptions
): Promise<IFnImportAllReportTemplatesResult> => {
    // Folder first — must run before other awaits so the Import button user gesture is valid.
    const {
        templateFilesByName,
        folderSelectionCancelled,
        errorMessage,
    } = await selectTemplateFolderFiles();

    if (folderSelectionCancelled) {
        return {
            cancelled: true,
            message: errorMessage ?? '',
            importedCount: 0,
            failedCount: 0,
            uploadFailedCount: 0,
        };
    }

    const excelFile = await selectExcelFile();
    if (!excelFile) {
        return {
            cancelled: true,
            message: '',
            importedCount: 0,
            failedCount: 0,
            uploadFailedCount: 0,
        };
    }

    let records: Record<string, unknown>[];
    try {
        records = await readExcelReportProfileRecords(excelFile, entityName);
    } catch (error) {
        console.error('Failed to read report template excel:', error);
        return {
            message: 'Failed to read the selected Excel file.',
            importedCount: 0,
            failedCount: 0,
            uploadFailedCount: 0,
        };
    }

    if (options?.recordFilter) {
        records = records.filter(options.recordFilter);
    }

    if (options?.recordTransform) {
        records = records.map(options.recordTransform);
    }

    if (!records.length) {
        return {
            message: options?.emptyFilterMessage ?? 'No report profile records found in the selected Excel file.',
            importedCount: 0,
            failedCount: 0,
            uploadFailedCount: 0,
        };
    }

    const needsTemplateFolder = records.some(hasTemplateFileName);

    if (needsTemplateFolder && !templateFilesByName.size) {
        return {
            cancelled: true,
            message: 'No template JSON files were found in the selected folder.',
            importedCount: 0,
            failedCount: 0,
            uploadFailedCount: 0,
        };
    }

    const duplicateProfileNames = getDuplicateProfileNames(records, options?.existingProfileNames);
    if (duplicateProfileNames.length) {
        return {
            message: `Report profile name already exists or is duplicated in the import file: ${duplicateProfileNames.join(', ')}. Please correct the file and import again.`,
            importedCount: 0,
            failedCount: duplicateProfileNames.length,
            uploadFailedCount: 0,
        };
    }

    const entityTable = `_${entityName}`;
    const userName = getLoginShortNameFromSession(sessionList);
    let importedCount = 0;
    let failedCount = 0;
    let uploadFailedCount = 0;

    statusBarContext.setIsLoading(true);
    try {
        for (const importSourceRow of records) {
            const importRecord = prepareImportRecord(importSourceRow);
            const templateFileName = String(importSourceRow.TemplateFileName ?? '').trim();
            const fileUID = String(importSourceRow.FileUID ?? '').trim();
            const reportProfileName = String(importSourceRow._ReportProfile ?? '').trim();

            if ((templateFileName || reportProfileName) && templateFilesByName.size) {
                const templateFile = findTemplateFileInFolder(
                    templateFileName,
                    templateFilesByName,
                    fileUID || undefined,
                    reportProfileName || undefined
                );
                if (templateFile) {
                    const fileBase64 = await readTemplateFileAsBase64(templateFile);
                    if (fileBase64) {
                        importRecord.FPFileContent = fileBase64;
                        importRecord.TemplateFileName = templateFileName;
                        importRecord.FPFileName = templateFile.name;
                    }
                }
            }

            const savedRow = await saveReportProfileRecord(importRecord, entityTable, statusBarContext);
            if (!savedRow?.EntID) {
                failedCount += 1;
                continue;
            }

            const uploadRow: Record<string, unknown> = {
                ...importRecord,
                ...savedRow,
                TemplateFileName: templateFileName || savedRow.TemplateFileName,
            };

            const uploaded = await uploadReportTemplateFile(
                uploadRow,
                String(savedRow.EntID),
                entityName,
                userName,
                statusBarContext
            );

            if (!uploaded) {
                uploadFailedCount += 1;
                failedCount += 1;
                await deleteReportProfileRecord(String(savedRow.EntID), entityName, statusBarContext);
                continue;
            }

            importedCount += 1;
        }
    } finally {
        statusBarContext.setIsLoading(false);
    }

    const messageParts = [
        `Imported ${importedCount} report profile record(s).`,
    ];
    if (failedCount > 0) {
        messageParts.push(`${failedCount} record(s) failed to save.`);
    }
    if (uploadFailedCount > 0) {
        messageParts.push(`${uploadFailedCount} template file upload(s) failed.`);
    }

    return {
        message: messageParts.join(' '),
        importedCount,
        failedCount,
        uploadFailedCount,
    };
};

export { FnImportAllReportTemplates };
export type { IFnImportAllReportTemplatesOptions, IFnImportAllReportTemplatesResult };

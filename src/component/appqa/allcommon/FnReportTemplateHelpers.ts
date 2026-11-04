import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { getReportLayoutTemplate } from "@n20a/libreport";
import { ISession } from "../../shared/context/allinterface/ISession";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { EntityNameEnums } from "../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";

const PROTECTED_TEMPLATE_NAMES = ["defaultportrait", "defaultlandscape"];
const DEFAULT_REPORT_TEMPLATE_EXTENSION = "txt";

const isProtectedDefaultTemplate = (templateName?: string | null): boolean => {
    if (!templateName) {
        return false;
    }

    const lowerName = templateName.toLowerCase();
    return PROTECTED_TEMPLATE_NAMES.some((name) => lowerName.includes(name));
};

const getLoginShortNameFromSession = (sessionList?: ISession[]): string =>
    sessionList?.find((item) => item.VariableName === "LoginShortName")?.SessionValue ?? "";

const isReportProfileNode = (node?: ITreeNode | null): boolean =>
    node?.NodeEntityname === EntityNameEnums.ReportProfile;

const parseNodeDetailRecord = (nodeDetail: unknown): Record<string, unknown> | null => {
    if (typeof nodeDetail !== "string" || !nodeDetail.trim()) {
        return null;
    }

    const parsed = FnParseJsonSafely<Record<string, unknown>, null>(nodeDetail, { fallback: null });
    return parsed && typeof parsed === "object" ? parsed : null;
};

const decodeReportTemplateBlob = (base64: string): Record<string, unknown> | null => {
    try {
        if (!base64?.length) {
            return null;
        }

        const jsonString = atob(base64);
        const parsed = FnParseJsonSafely<Record<string, unknown>, null>(jsonString, { fallback: null });
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
};

const getEntityDatasetRecords = (apiData: unknown): unknown[] | null => {
    if (!apiData || typeof apiData !== "object") {
        return null;
    }

    const datasetKeys = Object.keys(apiData as Record<string, unknown>);
    if (!datasetKeys.length) {
        return null;
    }

    const records = (apiData as Record<string, unknown>)[datasetKeys[0]];
    return Array.isArray(records) ? records : null;
};

const getReportProfileTemplateFileNameFromNode = (node: ITreeNode): string => {
    if (node.TemplateFileName) {
        return String(node.TemplateFileName).trim();
    }

    const detail = parseNodeDetailRecord(node.NodeDetail);
    if (detail?.TemplateFileName) {
        return String(detail.TemplateFileName).trim();
    }

    const reportProfileName = String(detail?._ReportProfile ?? node._ReportProfile ?? "").trim();
    if (reportProfileName) {
        const extension = String(
            detail?.FPFileExtension ?? node.FPFileExtension ?? DEFAULT_REPORT_TEMPLATE_EXTENSION
        ).replace(/^\./, "");
        return `${reportProfileName}.${extension}`;
    }

    return "";
};

const prepareReportProfileNodeForForm = (node: ITreeNode): ITreeNode => ({
    ...node,
    title: "",
    icon: null,
});

const hasUploadedReportTemplateFile = (row: Record<string, unknown>): boolean => {
    const content = row.FPFileContent;
    if (typeof content === "string") {
        return content.trim().length > 0;
    }
    return Boolean(content);
};

const resolveReportProfileTemplateFileName = (
    row: Record<string, unknown>,
    isNewRecord: boolean
): string => {
    if (row.SelectFileName) {
        return String(row.SelectFileName);
    }
    if (row.TemplateFileName) {
        return String(row.TemplateFileName);
    }
    if (row.FPFileName) {
        return String(row.FPFileName);
    }
    if (isNewRecord) {
        const profileName = String(row._ReportProfile ?? "ReportTemplate").trim();
        const extension = String(row.FPFileExtension ?? DEFAULT_REPORT_TEMPLATE_EXTENSION).replace(/^\./, "");
        return `${profileName}.${extension}`;
    }
    return "";
};

const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Failed to read file content."));
                return;
            }
            resolve(result.split(",")[1]);
        };
        reader.onerror = () => reject(new Error("Failed to read file content."));
        reader.readAsDataURL(blob);
    });

const createDefaultReportLayoutBase64 = async (): Promise<string> => {
    const layout = getReportLayoutTemplate(false);
    const blob = new Blob([JSON.stringify(layout)], { type: "application/json" });
    return blobToBase64(blob);
};

const applyDefaultReportLayoutIfNeeded = async (
    row: Record<string, unknown>,
    isNewRecord: boolean
): Promise<void> => {
    if (hasUploadedReportTemplateFile(row)) {
        return;
    }

    row.FPFileContent = await createDefaultReportLayoutBase64();
    row.FPFileExtension = row.FPFileExtension ?? DEFAULT_REPORT_TEMPLATE_EXTENSION;

    const templateFileName = resolveReportProfileTemplateFileName(row, isNewRecord);
    if (templateFileName) {
        row.TemplateFileName = templateFileName;
        row.FPFileName = row.FPFileName ?? templateFileName;
    }
};

export {
    applyDefaultReportLayoutIfNeeded,
    createDefaultReportLayoutBase64,
    decodeReportTemplateBlob,
    DEFAULT_REPORT_TEMPLATE_EXTENSION,
    getEntityDatasetRecords,
    getLoginShortNameFromSession,
    getReportProfileTemplateFileNameFromNode,
    hasUploadedReportTemplateFile,
    isProtectedDefaultTemplate,
    isReportProfileNode,
    parseNodeDetailRecord,
    prepareReportProfileNodeForForm,
    resolveReportProfileTemplateFileName,
};

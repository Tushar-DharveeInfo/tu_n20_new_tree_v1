import type { AlertSeverity, IConfirmationStatus, IDeliveryLogRecord } from "@n20a/libalerts";
import type {
    IAlertDeliveryLogsResponse,
} from "../../../../allinterface/iappqasettingscontainer/subscribe/IDeliveryStatus";
import { FnParseJsonSafely } from "../../../../../appcontainer/allcommon/FnParseJsonSafely";

// Parses a date-like API value into Date when valid.
const toOptionalDate = (value: unknown): Date | undefined => {
    if (value == null || value === "") {
        return undefined;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

// Reads a non-empty string from a field when present.
const readOptionalString = (value: unknown): string | undefined => {
    if (value == null || value === "") {
        return undefined;
    }
    return String(value);
};

// Maps ConfirmationStatus from object ({ code, Status|status }) or plain code.
const toConfirmationStatus = (value: unknown): IConfirmationStatus | undefined => {
    if (value == null || value === "") {
        return undefined;
    }
    if (typeof value === "object" && !Array.isArray(value) && "code" in value) {
        const statusValue = value as {
            code?: unknown;
            status?: unknown;
            Status?: unknown;
        };
        if (statusValue.code == null) {
            return undefined;
        }
        const statusText = statusValue.status ?? statusValue.Status;
        return {
            code: String(statusValue.code),
            status: statusText != null ? String(statusText) : undefined,
        };
    }
    return { code: String(value) };
};

// Parses Dataset.DeliveryProfile without throwing on invalid JSON/shape.
const parseDeliveryProfile = (value: unknown): Record<string, unknown> => {
    try {
        if (value == null || value === "") {
            return {};
        }
        if (typeof value === "object" && !Array.isArray(value)) {
            return value as Record<string, unknown>;
        }
        if (typeof value === "string" && value.trim()) {
            const parsed = FnParseJsonSafely(value);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
            }
        }
    } catch (error) {
        console.error("Failed to parse DeliveryProfile:", error);
    }
    return {};
};

// Maps one Dataset row (+ nested DeliveryProfile JSON) onto IDeliveryLogRecord.
const mapDatasetRowToDeliveryLogRecord = (
    row: Record<string, unknown>
): IDeliveryLogRecord | null => {
    try {
        const profile = parseDeliveryProfile(row.DeliveryProfile);

        const record: IDeliveryLogRecord = {
            EntityName: readOptionalString(row.EntityName) ?? "",
            EntId:
                readOptionalString(row.EntID) ??
                readOptionalString(row.EntId) ??
                "",
            RecipientName:
                readOptionalString(row.RecipientName) ??
                readOptionalString(profile.RecipientName) ??
                "",
        };

        const recipientEmail =
            readOptionalString(profile.RecipientEmail) ??
            readOptionalString(row.RecipientEmail);
        if (recipientEmail != null) {
            record.RecipientEmail = recipientEmail;
        }

        const recipientPhone =
            readOptionalString(profile.RecipientPhone) ??
            readOptionalString(row.RecipientPhone);
        if (recipientPhone != null) {
            record.RecipientPhone = recipientPhone;
        }

        const attemptRaw = profile.AttemptCount ?? row.AttemptCount;
        if (attemptRaw != null && attemptRaw !== "") {
            const attemptCount = Number(attemptRaw);
            if (Number.isFinite(attemptCount)) {
                record.AttemptCount = attemptCount;
            }
        }

        const alertSeverity =
            readOptionalString(profile.AlertSeverity) ??
            readOptionalString(row.AlertSeverity);
        if (
            alertSeverity === "Critical" ||
            alertSeverity === "Warning" ||
            alertSeverity === "Normal"
        ) {
            record.AlertSeverity = alertSeverity as AlertSeverity;
        }

        const isForwarded = profile.IsForwarded ?? row.IsForwarded;
        if (isForwarded != null) {
            record.IsForwarded = Boolean(isForwarded);
        }

        const deliveredOnline = toOptionalDate(
            profile.IsDeliveredOnline ?? row.IsDeliveredOnline
        );
        if (deliveredOnline) {
            record.IsDeliveredOnline = deliveredOnline;
        }

        const deliveredEmail = toOptionalDate(
            profile.IsDeliveredUsingEmail ?? row.IsDeliveredUsingEmail
        );
        if (deliveredEmail) {
            record.IsDeliveredUsingEmail = deliveredEmail;
        }

        const deliveredSms = toOptionalDate(
            profile.IsDeliveredUsingSMS ?? row.IsDeliveredUsingSMS
        );
        if (deliveredSms) {
            record.IsDeliveredUsingSMS = deliveredSms;
        }

        const confirmationStatus = toConfirmationStatus(
            profile.ConfirmationStatus ?? row.ConfirmationStatus
        );
        if (confirmationStatus) {
            record.ConfirmationStatus = confirmationStatus;
        }

        const attachedFiles =
            readOptionalString(profile.AttachedFiles) ??
            readOptionalString(row.AttachedFiles);
        if (attachedFiles != null) {
            record.AttachedFiles = attachedFiles;
        }

        return record;
    } catch (error) {
        console.error("Failed to map delivery log row:", error, row);
        return null;
    }
};

// Parses alertJson and maps Dataset rows to IDeliveryLogRecord[].
const FnParseAlertDeliveryLogs = (alertJson: unknown): IDeliveryLogRecord[] => {
    try {
        if (typeof alertJson !== "string" || !alertJson.trim()) {
            return [];
        }

        const parsed = FnParseJsonSafely(alertJson);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return [];
        }

        const response = parsed as IAlertDeliveryLogsResponse;
        const alertNode = response.Alerts?.[0];
        if (!alertNode) {
            return [];
        }

        const dataset = alertNode.Dataset;
        if (!Array.isArray(dataset) || !dataset.length) {
            return [];
        }

        return dataset.reduce<IDeliveryLogRecord[]>((records, row) => {
            if (!row || typeof row !== "object" || Array.isArray(row)) {
                return records;
            }
            const mapped = mapDatasetRowToDeliveryLogRecord(
                row as Record<string, unknown>
            );
            if (mapped) {
                records.push(mapped);
            }
            return records;
        }, []);
    } catch (error) {
        console.error("Failed to parse alert delivery logs:", error);
        return [];
    }
};

export { FnParseAlertDeliveryLogs };

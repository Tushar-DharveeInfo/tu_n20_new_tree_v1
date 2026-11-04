import { IErrorData } from "../../shared/allinterface/IApiResponse";
import { EM } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { FnGetSessionVariableFromStorage } from "../../shared/allcommon/basic/FnGetSessionVariableFromStorage";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { ISession } from "../../shared/context/allinterface/ISession";
import { IFnCreateForensiclog } from "../allinterface/IFnCreateForensiclog"

function splitForensicPayload(payload: any) {
    const MAX_LENGTH = 1020;

    const logs = payload?._ForensicLog;

    if (!Array.isArray(logs) || logs.length === 0) {
        return payload;
    }

    const originalLog = logs[0]; // assuming single object like your example
    const logString = originalLog?.LogString;

    // If small → return same payload
    if (!logString || logString.length <= MAX_LENGTH) {
        return payload;
    }

    const newLogs = [];
    let start = 0;

    while (start < logString.length) {
        let chunk = logString.substring(start, start + MAX_LENGTH);

        // Add ... if more content exists
        if (start + MAX_LENGTH < logString.length) {
            chunk += "...";
        }

        newLogs.push({
            ...originalLog,
            LogString: chunk
        });

        start += MAX_LENGTH;
    }

    return {
        ...payload,
        _ForensicLog: newLogs
    };
}
const callAddUpdateAPI = (payload: Record<string, any>, statusBarContext: IStatusBar, allowShowLoader: boolean = true) => {

    const data = splitForensicPayload(payload);
    const hasMultipleRecords = Object.values(data).some((value) => Array.isArray(value) && value.length > 1);

    return new Promise((resolve, reject) => {
        axiosInterceptor(
            {
                url: hasMultipleRecords ? EM.AddUpdateMultipleTableRecords : EM.AddTableRecord,
                data: {
                    jsonString: JSON.stringify(data)
                },
                allowShowLoader: allowShowLoader,
                setFetchData: (response: unknown, status?: string, errData?: IErrorData[]) => {
                    if (status === "200" && response) {
                        resolve(response);
                    } else {
                        // Filter out debug messages from stored procedures
                        const actualErrors = errData?.filter(err =>
                            err.errString &&
                            !err.errString.startsWith("Entering SP_:") &&
                            !err.errString.startsWith("Exiting SP_:")
                        );

                        // If only debug messages remain, treat as success
                        if (actualErrors && actualErrors.length === 0 && errData && errData.length > 0) {
                            resolve(response);
                        } else {
                            const message =
                                actualErrors?.[0]?.errString || errData?.[0]?.errString || `API Error ${status}`;
                            reject(new Error(message));
                        }
                    }
                }
            },
            statusBarContext
        );
    });
};

const getSessionValue = (
    sessionList: ISession[],
    variableContext: string,
    variableName: string
): string => {
    const sessionValueByContext = FnGetSessionVariableFromStorage(variableContext, variableName, sessionList);
    const sessionValue = sessionValueByContext?.[0]?.SessionValue
        || sessionList?.find((item) => item.VariableName?.toLowerCase() === variableName.toLowerCase())?.SessionValue;

    return sessionValue || "";
};

const FnCreateForensiclog = (props: IFnCreateForensiclog) => {
    try {
        const siteName = props.site || getSessionValue(props.sessionContext.SessionList, 'Location', "SiteName");
        const tenantName = props.tenant || getSessionValue(props.sessionContext.SessionList, 'Filter', "TenantName");
        const loginUserName = props.userName || getSessionValue(props.sessionContext.SessionList, 'RequestedBy', "LoginShortName");
        const impersonatedUserName = getSessionValue(props.sessionContext.SessionList, 'Impersonation', "ImpersonatedUserName")?.trim();
        const userName = impersonatedUserName
            ? (loginUserName ? `${loginUserName} (${impersonatedUserName})` : `(${impersonatedUserName})`)
            : loginUserName;
        if (!siteName || !userName) {
            console.error(`Missing site and user session data`)
        }
        // find message template from ref table 
        let msgTemplate = '';
        if (props.GroupName && props.SubGroupName && props.RefTableItems.length) {
            const filteredItems = props.RefTableItems.find((item: any) =>
                item.GroupName === props.GroupName
                && item.SubGroupName === props.SubGroupName
                && item.Name === props.LogName);
            if (filteredItems) {
                msgTemplate = filteredItems.RefValue;
            } else {
                console.error(`No message template found for ${props.GroupName} and ${props.SubGroupName}`)
            }
        }
        const actionObject = props.actionObject ? { ...props.actionObject, UserName: userName } : { UserName: userName }
        // create message based on passed message name and action object
        const message = props.LogString ? props.LogString :
            msgTemplate ? getMessageTemplateForForensicAndReplaceVariables(msgTemplate, actionObject) : "";
        if (message.length) {
            const sessionid = props.statusBarContext.userSessionId;
            const payload = {
                logType: props.logType,
                _Forensiclog: props._Forensiclog,
                LogString: message,
                LogOwnerEntID: props.LogOwnerEntID,
                LogOwnerEntityName: props.LogOwnerEntityName ?? props.LogOwnerEntitiyName,
                LogOwnerEntitiyName: props.LogOwnerEntityName ?? props.LogOwnerEntitiyName,
                UserSessionID: sessionid,
                SiteName: siteName,
                UserName: userName,
                TenantName: tenantName
            }
            // Add Record in _ForensicLog table 
            const data = callAddUpdateAPI({ "_ForensicLog": [payload] }, props.statusBarContext, props.allowShowLoader ?? true);
            return data;
        } else {
            console.error("Message not found.")
            return;
        }

    } catch (error) {
        console.error("Error in FnCreateForensiclog:", error);
        throw error;
    }
}

const getMessageTemplateForForensicAndReplaceVariables = (
    msgTemplate: string,
    data: Record<string, any>
): string => {
    const dataByLowerCaseKey = Object.keys(data).reduce<Record<string, any>>((acc, key) => {
        acc[key.toLowerCase()] = data[key];
        return acc;
    }, {});

    const replaceVariable = (_match: string, key: string): string => {
        const value = dataByLowerCaseKey[key.trim().toLowerCase()];
        return value === undefined || value === null ? "" : String(value);
    };

    const hasValue = (key: string): boolean => {
        const value = dataByLowerCaseKey[key.trim().toLowerCase()];
        return value !== undefined && value !== null && String(value) !== "";
    };

    const replaceOptionalSection = (_match: string, content: string): string => {
        const keys = Array.from(content.matchAll(/<([^>]+)>|\$\{([^}]+)\}/g), (match) => match[1] || match[2]);

        if (!keys.length || keys.some((key) => !hasValue(key))) {
            return "";
        }

        return content
            .replace(/<([^>]+)>/g, replaceVariable)
            .replace(/\$\{([^}]+)\}/g, replaceVariable);
    };

    return msgTemplate
        // Handle optional sections like [, Room: <room>]
        .replace(/\[([^\[\]]+)\]/g, replaceOptionalSection)

        // Handle <key>
        .replace(/<([^>]+)>/g, replaceVariable)

        // Handle ${key}
        .replace(/\$\{([^}]+)\}/g, replaceVariable);
};
export { getMessageTemplateForForensicAndReplaceVariables, FnCreateForensiclog }

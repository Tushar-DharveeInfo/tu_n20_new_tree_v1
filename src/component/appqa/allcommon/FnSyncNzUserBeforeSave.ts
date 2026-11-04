
import { axiosInterceptorForPostResponse } from "../../shared/interceptors/Interceptor";
import { EXPAPI } from "../../shared/interceptors/EndPoints";
import { FnGetExpApiUrlBasedOnEndPoint } from "../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint";
import { FnGetEnvVariableByKey } from "../../appcontainer/allcommon/FnGetEnvVariableByKey";
import { envVarEnums } from "../../appcontainer/alldefaultprops/DefaultPropsAppContainer";

type INzUserPostResponse = {
    status?: number;
    response?: unknown;
};

type IFnSyncNzUserBeforeSave = {
    isEditMode: boolean;
    existingEntity?: Record<string, unknown>;
    entityPayload: Record<string, unknown>;
    handleShowUserMessage?: (message: string) => void;
};

const USER_EMAIL_KEY = "Email";
const USER_DISPLAY_NAME_KEY = "_User";

// Reads the first non-empty string value from a record.
const getRecordString = (
    record: Record<string, unknown> | undefined,
    keyToFind: string
): string => {
    if (!record) {
        return "";
    }
    const value = record[keyToFind];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
    }
    return "";
};

// True when Enabled flag is on.
const isRecordEnabled = (value: unknown): boolean =>
    value === true || value === 1 || value === "1" || value === "true";

// Waits before retrying add after delete.
const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

// Calls expapi nzuser endpoint.
const postNzUserApi = async (
    endpoint: string,
    body: Record<string, string>
): Promise<INzUserPostResponse> => {
    return axiosInterceptorForPostResponse(
        FnGetExpApiUrlBasedOnEndPoint(endpoint),
        body
    ) as Promise<INzUserPostResponse>;
};

// True when validateNzUser response says the user is valid.
const isNzUserValid = (apiResponse: INzUserPostResponse | undefined): boolean => {
    if (!apiResponse || apiResponse.status !== 200) {
        return false;
    }
    const payload = apiResponse.response;
    if (!payload || typeof payload !== "object") {
        return false;
    }
    if ("success" in payload && Boolean((payload as { success?: boolean }).success)) {
        return true;
    }
    return false;
};

// True when add/delete nzuser API call succeeded.
const isNzUserApiSuccess = (apiResponse: INzUserPostResponse | undefined): boolean => {
    if (!apiResponse || apiResponse.status !== 200) {
        return false;
    }
    const payload = apiResponse.response;
    if (payload && typeof payload === "object" && "success" in payload) {
        return Boolean((payload as { success?: boolean }).success);
    }
    return true;
};

// Syncs nzuser via expapi when auth type is fb and user is enabled or email changed.
const FnSyncNzUserBeforeSave = async (options: IFnSyncNzUserBeforeSave): Promise<boolean> => {
    const authType = FnGetEnvVariableByKey(envVarEnums.AUTH_TYPE)?.toLowerCase();
    if (authType !== "fb") {
        return true;
    }
    const {
        isEditMode,
        existingEntity,
        entityPayload,
        handleShowUserMessage
    } = options;
    const wasEnabled = isEditMode && existingEntity
        ? isRecordEnabled(existingEntity.Enabled)
        : false;
    const isNowEnabled = isRecordEnabled(entityPayload.Enabled);
    const isEnabling = isNowEnabled && !wasEnabled;
    const oldEmail = getRecordString(existingEntity, USER_EMAIL_KEY);
    const newEmail = getRecordString(entityPayload, USER_EMAIL_KEY);
    const isEmailChanged = isEditMode
        && !!oldEmail
        && !!newEmail
        && oldEmail.toLowerCase() !== newEmail.toLowerCase();
    if (!isEnabling && !isEmailChanged) {
        return true;
    }
    if (!newEmail) {
        handleShowUserMessage?.("Email is required for Firebase user sync.");
        return false;
    }
    const validateResponse = await postNzUserApi(EXPAPI.ValidateNzUser, { email: newEmail });
    if (!isNzUserValid(validateResponse)) {
        handleShowUserMessage?.("Firebase user validation failed.");
        return false;
    }
    const displayName = getRecordString(entityPayload, USER_DISPLAY_NAME_KEY);
    if (isEmailChanged) {
        const deleteResponse = await postNzUserApi(EXPAPI.DeleteNzUser, { email: oldEmail });
        if (!isNzUserApiSuccess(deleteResponse)) {
            handleShowUserMessage?.("Failed to remove existing Firebase user.");
            return false;
        }
        await sleep(2000);
    }
    if (isEnabling || isEmailChanged) {
        const addResponse = await postNzUserApi(EXPAPI.AddNzUser, {
            email: newEmail,
            password: newEmail,
            displayName: displayName || newEmail
        });
        if (!isNzUserApiSuccess(addResponse)) {
            handleShowUserMessage?.("Failed to add Firebase user.");
            return false;
        }
    }
    return true;
};

export { FnSyncNzUserBeforeSave };
export type { IFnSyncNzUserBeforeSave };

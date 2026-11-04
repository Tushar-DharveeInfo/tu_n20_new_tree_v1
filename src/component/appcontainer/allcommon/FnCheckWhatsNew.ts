import { IApItem } from '../../shared/context/allinterface/IMainApp';
import { IStatusBar } from '../../shared/context/allinterface/IStatusBar';
import { IWhatsNewConfig } from '../allinterface/IWhatsNewContainer';
import { axiosInterceptor, axiosInterceptorForHead } from '../../shared/interceptors/Interceptor';
import { AP } from '../../shared/interceptors/EndPoints';

export const WHATSNEW_REMOTE_PDF_URL = "https://storage.googleapis.com/n20-bucket-01-public/n20a/whatsnew/whatsnew.pdf";
export const WHATSNEW_LOCAL_PDF_URL = "/privatedocs/whatsnew.pdf";

/**
 * Finds the WhatsNew AP record from apRecords.
 * Checks for _AP: 'Whatsnew' or Name: 'Whatsnew'.
 */
export const FnGetWhatsNewApRecord = (apRecords: IApItem[] | undefined): IApItem | undefined => {
    if (!Array.isArray(apRecords) || !apRecords.length) {
        return undefined;
    }
    return apRecords.find((item) => {
        const ap = item?._AP?.trim().toLowerCase();
        const name = item?.Name?.trim().toLowerCase();
        return ap === 'whatsnew' || name === 'whatsnew';
    });
};

/**
 * Safely parses the WhatsNew AP value string into an object.
 */
export const FnParseWhatsNewValue = (val: unknown): IWhatsNewConfig | null => {
    if (!val) return null;
    if (typeof val === 'object') {
        return val as IWhatsNewConfig;
    }
    if (typeof val === 'string') {
        try {
            return JSON.parse(val) as IWhatsNewConfig;
        } catch {
            return null;
        }
    }
    return null;
};

/**
 * Checks whether WhatsNew should be displayed on launch according to rules:
 * (startDate < current date < endDate) || ap for it is not defined || (startDate is undefined)
 */
export const FnShouldShowWhatsNew = (
    apRecord: IApItem | undefined,
    currentDate: Date = new Date()
): boolean => {
    // 1. ap for it is not defined
    if (!apRecord) {
        return true;
    }

    const config = FnParseWhatsNewValue(apRecord.Value);
    // If config/value is not defined or empty, startDate is undefined
    if (!config) {
        return true;
    }

    const startDateRaw = config.startDate ?? config.startdate ?? config.StartDate;
    const endDateRaw = config.endDate ?? config.enddate ?? config.EndDate;

    // 2. startDate is undefined
    if (startDateRaw === undefined || startDateRaw === null || startDateRaw === '') {
        return true;
    }

    const startDate = new Date(startDateRaw);
    if (isNaN(startDate.getTime())) {
        return true;
    }

    // 3. (startDate < current date < endDate)
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    // If endDate is provided, check: startDate < current date < endDate
    if (endDateRaw !== undefined && endDateRaw !== null && endDateRaw !== '') {
        const endDate = new Date(endDateRaw);
        if (!isNaN(endDate.getTime())) {
            const endDateStr = endDate.toISOString().split('T')[0];
            return (startDateStr < currentDateStr) && (currentDateStr < endDateStr);
        }
    }

    // If endDate is not defined, check if startDate < current date
    return startDateStr < currentDateStr;
};

/**
 * Resolves whatsnew.pdf URL using the same logic as Help:
 * If internet is available, checks remote URL with axiosInterceptorForHead once.
 * If reachable, uses remote bucket URL; otherwise uses local PDF URL (/privatedocs/whatsnew.pdf).
 */
export const FnCheckWhatsNewPdfAvailable = async (
    isInternetAvailable: boolean = true
): Promise<{ available: boolean; url: string }> => {
    if (isInternetAvailable) {
        try {
            const isRemoteReachable = await new Promise<boolean>((resolve) => {
                axiosInterceptorForHead({
                    url: WHATSNEW_REMOTE_PDF_URL,
                    onHeadersReceived: (_headers, isReachable) => {
                        resolve(Boolean(isReachable));
                    }
                });
            });

            if (isRemoteReachable) {
                return { available: true, url: WHATSNEW_REMOTE_PDF_URL };
            }
        } catch {
            // remote not reachable, fall back to local
        }
    }

    // Same fallback as Help: uses localPdfUrl
    return { available: true, url: WHATSNEW_LOCAL_PDF_URL };
};

/**
 * Updates startDate = current date in AP parameter once.
 */
export const FnUpdateWhatsNewStartDate = async (
    apRecord: IApItem | undefined,
    statusBarContext?: IStatusBar,
    currentDate: Date = new Date()
): Promise<void> => {
    if (!apRecord?.EntID) return;

    const existingConfig = FnParseWhatsNewValue(apRecord.Value) || {};
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const newConfig = {
        ...existingConfig,
        startDate: currentDateStr
    };
    const updatedValue = JSON.stringify(newConfig);
    apRecord.Value = updatedValue;

    if (statusBarContext) {
        try {
            await axiosInterceptor({
                url: AP.SetNameValue,
                data: {
                    entID: apRecord.EntID,
                    value: updatedValue,
                    isMySetting: 0
                },
                allowShowLoader: false,
                callSilently: true,
                setFetchData: () => { }
            }, statusBarContext);
        } catch (err) {
            console.error("Failed to update WhatsNew startDate in AP:", err);
        }
    }
};

/**
 * Updates endDate = current date in AP parameter (when Donot show again is checked).
 */
export const FnUpdateWhatsNewEndDate = async (
    apRecord: IApItem | undefined,
    statusBarContext?: IStatusBar,
    currentDate: Date = new Date()
): Promise<void> => {
    if (!apRecord?.EntID) return;

    const existingConfig = FnParseWhatsNewValue(apRecord.Value) || {};
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const newConfig = {
        ...existingConfig,
        startDate: existingConfig.startDate ?? existingConfig.startdate ?? currentDateStr,
        endDate: currentDateStr
    };
    const updatedValue = JSON.stringify(newConfig);
    apRecord.Value = updatedValue;

    if (statusBarContext) {
        try {
            await axiosInterceptor({
                url: AP.SetNameValue,
                data: {
                    entID: apRecord.EntID,
                    value: updatedValue,
                    isMySetting: 0
                },
                allowShowLoader: false,
                callSilently: true,
                setFetchData: () => { }
            }, statusBarContext);
        } catch (err) {
            console.error("Failed to update WhatsNew endDate in AP:", err);
        }
    }
};

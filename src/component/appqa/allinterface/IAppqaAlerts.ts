
interface IAppqaAlertCascadeValues {
    SiteName: string;
    TenantName: string;
}

interface IAppqaAlertFilterValues extends IAppqaAlertCascadeValues {
    AssignedTo: string;
    Severity: string;
    Status: string;
    StartDate: string;
    EndDate: string;
    Keywords: string;
    AndOR: string;
}

interface IAppqaAlertSiteTenantCascade {
    uniqueName?: string;
    loginType?: string;
    profileSiteName?: string;
    /* Restores last applied site when filter reopens (skips session defaults). */
    initialSiteName?: string;
    initialTenantName?: string;
    onValuesChange: (
        values: IAppqaAlertCascadeValues,
        options?: { isDefault?: boolean }
    ) => void;
}

interface IAppqaAlertFilterForm {
    uniqueName?: string;
    loginType?: string;
    profileSiteName?: string;
    hasUserAppliedFilter?: boolean;
    initialFilterValues: IAppqaAlertFilterValues;
    /*Wired from SearchControlWithFilter renderCascadeFilter context. */
    onCascadeValuesChange?: (
        values: object,
        options?: { isDefault?: boolean }
    ) => void;
    onFilterChange: (
        values: IAppqaAlertFilterValues,
        options?: { isDefault?: boolean }
    ) => void;
}

interface IAppqaAlerts {
    uniqueName: string;
    headerText?: string;
    handleShowUserMessage?: (messageText: string) => void;
}

interface IAppqaAlertFilteredLogsPayload {
    sessionId: string;
    filterJsonString: string;
    startPage: number;
    recordCount: number;
}

export type {
    IAppqaAlerts,
    IAppqaAlertCascadeValues,
    IAppqaAlertFilterForm,
    IAppqaAlertFilterValues,
    IAppqaAlertFilteredLogsPayload,
    IAppqaAlertSiteTenantCascade,
};
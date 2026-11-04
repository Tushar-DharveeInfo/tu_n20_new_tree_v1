export interface IWhatsNewConfig {
    startDate?: string;
    endDate?: string;
    startdate?: string;
    enddate?: string;
    StartDate?: string;
    EndDate?: string;
    [key: string]: unknown;
}

export interface IWhatsNewContainer {
    uniqueName?: string;
    headerText?: string;
    pdfUrl: string;
    onClose: () => void;
    onDontShowAgain: () => Promise<void> | void;
}


interface IAppqaReport {
    uniqueName: string;
    featureId: string;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IAppqaReport }

interface IManageLicense {
    uniqueName: string;
    entityName: string;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IManageLicense }
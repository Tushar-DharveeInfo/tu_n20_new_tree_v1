
interface IManageRole {
    uniqueName: string;
    featureId: string;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IManageRole }
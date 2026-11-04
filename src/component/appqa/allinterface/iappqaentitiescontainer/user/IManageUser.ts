
interface IManageUser {
    uniqueName: string;
    entityName: string;
    pgTableName?: string;
    pgTableLabel?: string;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IManageUser }

interface IAppqaNotify {
    uniqueName: string;

    headerText: string;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IAppqaNotify }
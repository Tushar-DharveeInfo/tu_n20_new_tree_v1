import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";

interface IAssetAssignment {
    uniqueName?: string;
    assignmentType: 'tag' | 'team' | 'tenant' | 'vendor';
    isReadOnly?: boolean;
    selectedFeatureItem?: IMenuItem;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IAssetAssignment };

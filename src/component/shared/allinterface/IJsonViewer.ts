interface IJsonViewer {
    uniqueName: string;
    jsonData: { [key: string]: any };
    showAsDiv?: boolean;
    width?: string;
    height?: string;
    handleSelectDCExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string) => void;
}

export type { IJsonViewer }
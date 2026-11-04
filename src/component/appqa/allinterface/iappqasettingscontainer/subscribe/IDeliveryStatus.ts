
interface IDeliveryStatus {
    uniqueName: string;
}

/** Column metadata from GetAlertDeliveryLogs alertJson. */
interface IAlertDeliveryColumn {
    PName: string;
    PropertyLabel?: string;
    Description?: string;
    AvgLength?: number | null;
}

/** One Alerts[] entry wrapping ColumnList + Dataset. */
interface IAlertDeliveryNode {
    Name?: string;
    Description?: string;
    NodeType?: string;
    ColumnList?: IAlertDeliveryColumn[];
    Dataset?: Record<string, unknown>[] | null;
}

/** Parsed alertJson root: { Alerts: [...] }. */
interface IAlertDeliveryLogsResponse {
    Alerts?: IAlertDeliveryNode[];
}

export type {
    IDeliveryStatus,
    IAlertDeliveryColumn,
    IAlertDeliveryNode,
    IAlertDeliveryLogsResponse,
};

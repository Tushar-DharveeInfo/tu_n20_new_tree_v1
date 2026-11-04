interface ITenantProps {
    uniqueName?: string;
    selectedTenantId?: string;
    handleSelectedCard?: (tenant: ITenantRecord) => void;
}

interface ITenantRecord {
    EntID?: string;
    RecID?: string;
    _Tenant?: string;
    Tenant?: string;
    _Partner?: string;
    Partner?: string;
    Name?: string;
    Description?: string;
    Desc250?: string;
    [key: string]: unknown;
}

export type { ITenantProps, ITenantRecord };


interface IRoleProps {
    uniqueName?: string;
    selectedRoleId?: string;
    handleSelectedCard?: (role: IRoleRecord) => void;
}

interface IRoleRecord {
    EntID?: string;
    RecID?: string;
    _Role?: string;
    Role?: string;
    Name?: string;
    Description?: string;
    Desc250?: string;
    [key: string]: unknown;
}

export type { IRoleProps, IRoleRecord };

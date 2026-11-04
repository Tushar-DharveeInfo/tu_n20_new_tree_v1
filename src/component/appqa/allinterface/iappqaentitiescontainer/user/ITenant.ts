
import { IUserContactEntity } from "./IUser";

interface ITenantProps {
    uniqueName?: string;
    selectedUser: IUserContactEntity | null;
}

interface ITenantRecord {
    EntID?: string;
    RecID?: string;
    _Tenant?: string;
    Tenant?: string;
    _Partner?: string;
    Partner?: string;
    Name?: string;
    CompanyName?: string;
    Description?: string;
    Desc250?: string;
    Selected?: boolean | string | number;
    selected?: boolean | string | number;
    AuthEntity?: string;
    [key: string]: unknown;
}
export type { ITenantProps, ITenantRecord };
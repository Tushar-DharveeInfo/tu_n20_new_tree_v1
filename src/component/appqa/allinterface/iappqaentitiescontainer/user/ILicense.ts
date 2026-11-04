
import { IUserContactEntity } from "./IUser";

interface ILicenseProps {
    uniqueName?: string;
    selectedUser: IUserContactEntity | null;
    selectedRole: string | null;
}

interface ILicenseRecord {
    EntID?: string;
    RecID?: string;
    _NZLicenseKey?: string;
    NZLicenseKey?: string;
    License?: string;
    LicenseKey?: string;
    Name?: string;
    Description?: string;
    Desc250?: string;
    Selected?: boolean | string | number;
    selected?: boolean | string | number;
    AuthEntity?: string;
    [key: string]: unknown;
}

export type { ILicenseProps, ILicenseRecord };
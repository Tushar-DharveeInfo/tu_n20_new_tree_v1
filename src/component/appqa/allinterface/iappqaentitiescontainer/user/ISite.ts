
import { IUserContactEntity } from "./IUser";

interface ISiteProps {
    uniqueName?: string;
    selectedUser: IUserContactEntity | null;
}

interface ISiteRecord {
    EntID?: string;
    RecID?: string;
    _Site?: string;
    Site?: string;
    Name?: string;
    Description?: string;
    Address?: string;
    City?: string;
    State?: string;
    Country?: string;
    Zip?: string;
    Selected?: boolean | string | number;
    [key: string]: unknown;
}

export type { ISiteProps, ISiteRecord };
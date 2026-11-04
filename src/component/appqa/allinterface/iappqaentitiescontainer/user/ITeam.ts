
import { IUserContactEntity } from "./IUser";

interface ITeamProps {
    uniqueName?: string;
    selectedUser: IUserContactEntity | null;
}

interface ITeamRecord {
    EntID?: string;
    RecID?: string;
    _Team?: string;
    Team?: string;
    _Partner?: string;
    Partner?: string;
    Name?: string;
    Description?: string;
    Desc250?: string;
    Selected?: boolean | string | number;
    selected?: boolean | string | number;
    AuthEntity?: string;
    [key: string]: unknown;
}
export type { ITeamProps, ITeamRecord }
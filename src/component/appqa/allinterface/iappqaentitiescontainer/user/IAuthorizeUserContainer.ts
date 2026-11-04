import { IUserContactEntity } from "./IUser";

interface IAuthorizeUserContainer {
    uniqueName?: string;
    selectedUser: IUserContactEntity | null;
    featureId?: string;
    allowCollapse?: boolean
    handleRefreshUsersData?: (role: string, basicRole: string) => void
}
export type { IAuthorizeUserContainer }
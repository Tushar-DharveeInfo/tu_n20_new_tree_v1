
import { Key } from "rc-tree/lib/interface";
import { IUserContactEntity } from "./IUser";
import { ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";

interface IRoleProps {
    uniqueName?: string;
    selectedUser: IUserContactEntity | null;
    featureId?: string;
    handleRefreshUsersData?: (role: string, info?: ITreeNode) => void
    handleCheckedRoles?: (keys: Key[], GroupNames: string) => void
}

interface IRoleAuthPayloadItem {
    EntID: string;
    Selected: boolean;
    AuthEntityName: string;

}

export type { IRoleProps, IRoleAuthPayloadItem };

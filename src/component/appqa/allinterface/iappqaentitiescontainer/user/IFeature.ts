import { IUserContactEntity } from "./IUser";
import { ITeamRecord } from "../team/ITeam";
import { IRoleRecord } from "../role/IRole";

interface IFeatureProps {
    selectedCard: IUserContactEntity | ITeamRecord | IRoleRecord;
    ownerEntityName: string
    entityName: string
    uniqueName?: string;
    featureId?: string;
    isCollapsed?: boolean;
    onContentReady?: () => void;
}

interface IFeatureAuthPayloadItem {
    EntID: string;
    Selected: boolean;
    AuthEntity: string;
}

export type { IFeatureProps, IFeatureAuthPayloadItem };

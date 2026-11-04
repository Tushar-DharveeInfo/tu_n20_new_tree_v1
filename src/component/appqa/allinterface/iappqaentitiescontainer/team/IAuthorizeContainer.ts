
import { ITeamRecord } from "./ITeam";
import { IRoleRecord } from "../role/IRole";

interface IAuthorizeContainer {
    selectedCard: ITeamRecord | IRoleRecord | null;
    ownerEntityName: string;
    entityName: string;
    uniqueName?: string;
    featureId?: string;
    allowCollapse?: boolean;
    sectionToHide?: 'feature' | 'entities'
}

export type { IAuthorizeContainer };

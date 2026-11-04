import { IUserContactEntity } from "./IUser";
import { ITeamRecord } from "../team/ITeam";

interface IEntitiesProps {
    uniqueName?: string;
    selectedCard: IUserContactEntity | ITeamRecord | null;
    ownerEntityName: string;
    featureId?: string;
    isCollapsed?: boolean;
    isSidebarOpen?: boolean;
    handleCloseSidebar?: () => void;
    handleShowSidebarOpenBtn?: (hide: boolean) => void;
    onContentReady?: () => void;
}

export type { IEntitiesProps };

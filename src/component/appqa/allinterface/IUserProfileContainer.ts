
import { ISession } from "../../shared/context/allinterface/ISession";

interface IUserProfileContainer {
    uniqueName: string;
    sessionList: ISession[];
    featureId: string;
}

export type { IUserProfileContainer }
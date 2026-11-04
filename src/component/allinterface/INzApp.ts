import { AuthSession } from "@n20a/libauth";
import { ISession } from "../shared/context/allinterface/ISession";
import { IUserData } from "../shared/context/allinterface/IMainApp";


interface IDeploymentVar {
    [key: string]: string | number | boolean | null;
}

interface INzApp {
    uniqueName: string;
    sessionId: string;
    sessionVariables: ISession[];
    deploymentVars: IDeploymentVar[];
    apiBaseUrl: string;
    isNewSession: boolean
    userAuthSession?: IUserData;
    onSuccess: () => void;
    onError: (error: string) => void;
}

export type { INzApp, IDeploymentVar }

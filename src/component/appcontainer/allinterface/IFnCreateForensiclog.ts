import { IRefItem } from "../../shared/context/allinterface/IMainApp";
import { ISessionContextProps } from "../../shared/context/allinterface/ISession";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";

interface IFnCreateForensiclog {
    logType: string;
    _Forensiclog: string;
    sessionContext: ISessionContextProps;
    statusBarContext: IStatusBar;
    RefTableItems: IRefItem[];
    site?: string;
    tenant?: string;
    userName?: string;
    GroupName?: string;
    SubGroupName?: string;
    LogName?: string;
    messageName?: string;
    LogString?: string;
    LogOwnerEntID?: string;
    LogOwnerEntityName?: string;
    LogOwnerEntityName?: string;
    LogOwnerEntitiyName?: string;
    actionObject?: Record<string, any>;
    allowShowLoader?: boolean;
}
export type { IFnCreateForensiclog };
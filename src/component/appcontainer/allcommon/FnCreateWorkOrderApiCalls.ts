import { IWorkorderRecord } from "@n20a/libform";
import { ALERT, DEVICE, EM, MISC } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { FnGetSessionVariableFromStorage } from "../../shared/allcommon/basic/FnGetSessionVariableFromStorage";
import { FnHandleAPIResponse } from "../../shared/allcommon/basic/FnHandleAPIResponse";
import { ISessionContextProps } from "../../shared/context/allinterface/ISession";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { EntityNameEnums } from "../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { FnFindNodeAndParents } from "../../shared/allcommon/tablegrid/FnFindNodeAndParents";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { IFnCreateWorkOrderApiCall } from "../allinterface/IFnCreateWorkOrderApiCalls";
import { IErrorData } from "../../shared/allinterface/IApiResponse";
import { FnParseJsonSafely } from "./FnParseJsonSafely";
import { FEnums } from "../../constants/Feature";

const callAddUpdateAPI = (payload: Record<string, any>, statusBarContext: IStatusBar, isMutiple?: boolean) => {
    return new Promise((resolve, reject) => {
        axiosInterceptor(
            {
                url: isMutiple ? EM.AddUpdateMultipleTableRecords : EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payload)
                },
                allowShowLoader: true,
                setFetchData: (response: unknown, status?: string, errData?: IErrorData[]) => {
                    if (status === "200" && response) {
                        resolve(response);
                    } else {
                        const message =
                            errData?.[0]?.errString || `API Error ${status}`;
                        reject(new Error(message));
                    }
                }
            },
            statusBarContext
        );
    });
};

const fetchWorkOrderMaxSeq = (
    workorderName: string,
    statusBarContext: IStatusBar
): Promise<number> => {
    return new Promise((resolve) => {
        axiosInterceptor(
            {
                url: DEVICE.WorkorderDetails,
                data: { woid: workorderName },
                callSilently: true,
                setFetchData: (resp: unknown, status?: string) => {
                    if (status !== "200" || !resp || typeof resp !== "object") {
                        resolve(0);
                        return;
                    }
                    try {
                        const responseData = resp as Record<string, unknown>;
                        const deviceJsonValue =
                            responseData.deviceJson ??
                            responseData.devicesJson;

                        const deviceJson =
                            typeof deviceJsonValue === "string"
                                ? JSON.parse(deviceJsonValue)
                                : deviceJsonValue ?? responseData;

                        const detailsData =
                            typeof (deviceJson as Record<string, unknown>)?.Data === "string"
                                ? JSON.parse((deviceJson as Record<string, unknown>).Data as string)
                                : (deviceJson as Record<string, unknown>)?.Data;

                        const profiles: Record<string, unknown>[] = Array.isArray(detailsData)
                            ? detailsData
                            : detailsData
                                ? [detailsData as Record<string, unknown>]
                                : [];

                        let maxSeq = 0;
                        if (profiles.length > 0) {
                            const profile = profiles[0];
                            const items: any[] = (profile?.WorkorderItems ?? profile?.workorderItems ?? profile?.workorderitems) as any[];
                            if (Array.isArray(items) && items.length > 0) {
                                for (const it of items) {
                                    const seq = Number(it?.SeqNo ?? 0);
                                    if (!isNaN(seq) && seq > maxSeq) {
                                        maxSeq = seq;
                                    }
                                }
                            }
                        }
                        resolve(maxSeq);
                    } catch {
                        resolve(0);
                    }
                }
            },
            statusBarContext
        );
    });
};
const FnCallApiForUpdateDeviceWoProfile = (
    NodeEntID: string,
    woProfileName: string,
    statusBarContext: IStatusBar,
    featureId?: string
): Promise<unknown> => {

    return new Promise((resolve, reject) => {
        const isReplacementProfile = featureId === FEnums.ReplacementProfile;

        const payloadToUpdate = {
            _Device: [{
                EntID: NodeEntID,
                ...(isReplacementProfile
                    ? { ReplacementTemplate: woProfileName }
                    : { _WorkorderProfile: woProfileName })
            }]
        };

        axiosInterceptor(
            {
                url: EM.UpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payloadToUpdate)
                },
                allowShowLoader: true,
                setFetchData: async (response: unknown, status) => {
                    if (status === '200') {
                        resolve(response);
                    } else {
                        reject(response);
                    }
                }
            },
            statusBarContext
        );
    });
};
export const callAPIForGetWorkorderName = (statusBarContext: IStatusBar) => {
    return new Promise((resolve, reject) => {
        axiosInterceptor(
            {
                url: MISC.ComputeCustomId,
                data: {
                    instanceName: "WOID"
                },
                allowShowLoader: true,
                setFetchData: (response: unknown, status?: string, errData?: IErrorData[]) => {
                    if (status === "200" && response && typeof response === "object" && 'customID' in response) {
                        //  return only customID
                        resolve(response?.customID);
                    } else {
                        const actualErrors = errData?.filter(err =>
                            err.errString &&
                            !err.errString.startsWith("Entering SP_:") &&
                            !err.errString.startsWith("Exiting SP_:")
                        );

                        // If only debug messages remain, treat as success
                        if (actualErrors && actualErrors.length === 0 && errData && errData.length > 0) {
                            resolve(response);
                        } else {
                            const message =
                                actualErrors?.[0]?.errString || errData?.[0]?.errString || `API Error ${status}`;
                            reject(new Error(message));
                        }
                    }
                }
            },
            statusBarContext
        );
    });
};

const FnReturnNodeNameObject = async (
    treeData: ITreeNode[],
    id: string
): Promise<Record<string, string>> => {

    const selectedRackparentNode = FnFindNodeAndParents(treeData, id);

    const obj: Record<string, string> = {};

    if (selectedRackparentNode) {
        for (const ele of selectedRackparentNode) {
            if (ele?.NodeType && ele?.Name) {
                obj[ele.NodeType] = ele.Name;
            }
        }
    }

    return obj;
};

type IWorkorderAction = Record<string, string | number>;

type IWorkorderTemplateCollection = Record<string, IWorkorderAction[]>;

const messageTemplates: IWorkorderTemplateCollection = {
    "Move Device": [
        { "Poweroff": "Power off <deviceName>", "sortOrder": 1 },
        { "Unplug": "Unplug <deviceName>", "sortOrder": 2 },
        { "Uncable": "Remove network cables from <deviceName>", "sortOrder": 3 },
        { "Clean": "Clean <deviceName>", "sortOrder": 4 },
        { "Move Floor Device": "Move <deviceName> to <destPath>", "sortOrder": 5 },
    ],
    "Move Device Floor to Slot": [
        { "Poweroff": "Power off <deviceName>", "sortOrder": 1 },
        { "Unplug": "Unplug <deviceName>", "sortOrder": 2 },
        { "Uncable": "Remove network cables from <deviceName>", "sortOrder": 3 },
        { "Clean": "Clean <deviceName>", "sortOrder": 4 },
        { "Rack": "Move device <deviceName> from <sourcePath> and mount it in <destPath>", "sortOrder": 5 },
        { "Cable": "Reattach network cables for <deviceName>", "sortOrder": 6 },
        { "Plug-in": "Attach <deviceName> to its power source", "sortOrder": 7 },
        {
            "Poweron": "Restart <deviceName>", "sortOrder": 8
        }
    ],
    "Move Device to Floor": [
        { "Poweroff": "Power off <deviceName>", "sortOrder": 1 },
        { "Unplug": "Unplug <deviceName>", "sortOrder": 2 },
        { "Uncable": "Remove network cables from <deviceName>", "sortOrder": 3 },
        { "Clean": "Clean <deviceName>", "sortOrder": 4 },
        { "Unmount": "Remove <deviceName> from <sourcePath> and place it on the floor", "sortOrder": 5 },
        { "Move Floor Device": "Move <deviceName> from <sourcePath> to <destPath>", "sortOrder": 6 },
        { "Cable": "Reattach network cables for <deviceName>", "sortOrder": 7 },
        { "Plug-in": "Attach <deviceName> to its power source", "sortOrder": 8 },
        { "Poweron": "Restart <deviceName>", "sortOrder": 9 }
    ],
    "Move Floor Device to Floor": [
        { "Poweroff": "Power off <deviceName>", "sortOrder": 1 },
        { "Unplug": "Unplug <deviceName>", "sortOrder": 2 },
        { "Uncable": "Remove network cables from <deviceName>", "sortOrder": 3 },
        { "Clean": "Clean <deviceName>", "sortOrder": 4 },
        { "Move Floor Device": "Move <deviceName> from <sourcePath> to <destPath>", "sortOrder": 5 },
        { "Cable": "Reattach network cables for <deviceName>", "sortOrder": 6 },
        { "Plug-in": "Attach <deviceName> to its power source", "sortOrder": 7 },
        { "Poweron": "Restart <deviceName>", "sortOrder": 8 }
    ],
    "Move Device Slot to Slot": [
        { "Poweroff": "Power off <deviceName>", "sortOrder": 1 },
        { "Unplug": "Unplug <deviceName>", "sortOrder": 2 },
        { "Uncable": "Remove network cables from <deviceName>", "sortOrder": 3 },
        { "Clean": "Clean <deviceName>", "sortOrder": 4 },
        { "Move Mounted": "Move <deviceName> from <sourcePath> to <destPath>", "sortOrder": 5 },
        { "Cable": "Reattach network cables for <deviceName>", "sortOrder": 6 },
        { "Plug-in": "Attach <deviceName> to its power source", "sortOrder": 7 },
        { "Poweron": "Restart <deviceName>", "sortOrder": 8 }
    ],
    "Move Up": [
        { "Poweroff": "Power off <deviceName>", "sortOrder": 1 },
        { "Unplug": "Unplug <deviceName>", "sortOrder": 2 },
        { "Uncable": "Remove network cables from <deviceName>", "sortOrder": 3 },
        { "Clean": "Clean <deviceName>", "sortOrder": 4 },
        { "Move Mounted": "Move <deviceName> up one rack unit from <sourcePath> to <destPath>", "sortOrder": 5 },
        { "Cable": "Reattach network cables for <deviceName>", "sortOrder": 6 },
        { "Plug-in": "Attach <deviceName> to its power source", "sortOrder": 7 },
        { "Poweron": "Restart <deviceName>", "sortOrder": 8 }
    ],
    "Move Down": [
        { "Poweroff": "Power off <deviceName>", "sortOrder": 1 },
        { "Unplug": "Unplug <deviceName>", "sortOrder": 2 },
        { "Uncable": "Remove network cables from <deviceName>", "sortOrder": 3 },
        { "Clean": "Clean <deviceName>", "sortOrder": 4 },
        { "Move Mounted": "Move <deviceName> down one rack unit from <sourcePath> to <destPath>", "sortOrder": 5 },
        { "Cable": "Reattach network cables for <deviceName>", "sortOrder": 6 },
        { "Plug-in": "Attach <deviceName> to its power source", "sortOrder": 7 },
        { "Poweron": "Restart <deviceName>", "sortOrder": 8 }
    ],
    "Add Device": [
        { "Add": "Add <EntName> (<EQID>) from NetZoom Device Library to <destPath>", "sortOrder": 1 }
    ],
    "Add Mounted Device": [
        { "Add Mounted": "Add <EntName> (<EQID>)}, view: <mountedShortView> from NetZoom Device Library to <destPath>", "sortOrder": 1 }
    ],
    "Delete": [
        { "Unplug": "Unplug <sourcePath>", "sortOrder": 1 },
        { "Uncable": "Remove network cables from <sourcePath>", "sortOrder": 2 },
        { "Clean": "Clean <sourcePath>", "sortOrder": 3 },
        { "Delete Device": "Move device from <sourcePath> to Unused bin", "sortOrder": 4 }
    ],
    "Delete From Disposable": [
        { "Dispose": "Permanently dispose of device <deviceName> from <sourcePath>", "sortOrder": 1 }
    ],
    "Empty Device": [
        { "Unplug": "Unplug all mounted devices in <sourcePath> ", "sortOrder": 1 },
        { "Uncable": "Remove network cables all mounted devices in <sourcePath>", "sortOrder": 2 },
        { "Clean": "Clean all mounted devices in <sourcePath>", "sortOrder": 3 },
        { "Empty": "Remove all mounted devices in <sourcePath> and place them in the Used bin", "sortOrder": 4 }
    ],
    "Change Port": [
        { "Change Port Status": "Change status of port <PortName> to <portStatus>", "sortOrder": 1 }
    ],
    "Change Slot": [
        { "Change Slot Status": "Change status of slot <sourcePath> to <slotStatus>", "sortOrder": 1 }
    ],
    "Block All": [
        { "Block All Slots": "Change status of all unused slots in <sourcePath> to <slotStatus>", "sortOrder": 1 }
    ],
    "Unblock All": [
        { "Unblock All Slots": "Change status of all unused slots in <sourcePath> to <slotStatus>", "sortOrder": 1 }
    ],
    "Disconnect Selected Port": [
        { "Delete Connection": "Remove cable from <portPath>", "sortOrder": 1 }
    ],
    "Change AuditInventory Status": [
        { "Change AuditInventory Status": "Change Status for <AuditName> to be <AuditStatus>", "sortOrder": 1 }
    ],
    "Replacement": [
        { "Replace Device": "Replace device model <FromEQID> with <ToEQID> at <sourcePath>", "sortOrder": 1 }
    ],
    "Replace": [
        { "Replace Device": "Replace device model <desteqid> with <sourceeqid> by replacing <destpath> with <sourcepath> and return <destname> to Used bin", "sortOrder": 1 }
    ],
    "Delete Audit Inventory": [
        {
            "Delete Audit Inventory": "Delete Audit Inventory <AuditName>.", "sortOrder": 1
        }
    ],

};
async function FnApproveWorkorderApiCall(
    workOrderToUpdate: Record<string, any>,
    sessionContext: ISessionContextProps,
    statusbarContext: IStatusBar
): Promise<boolean> {

    return new Promise((resolve) => {

        const userName =
            sessionContext.SessionList.find(
                (item) => item.VariableName.toLowerCase() === "loginshortname"
            )?.SessionValue ?? "";

        if (workOrderToUpdate && userName) {
            workOrderToUpdate.ApprovedBy = userName;
            workOrderToUpdate.DateApproved = new Date().toISOString();
        }

        axiosInterceptor(
            {
                url: EM.AddUpdateTableRecord,
                data: {
                    jsonString: JSON.stringify({
                        [`_${EntityNameEnums.WorkorderProfile}`]: [workOrderToUpdate]
                    })
                },
                setFetchData: async (resp: any, status?: string) => {

                    if (status !== "200") {
                        resolve(false);
                        return;
                    }

                    try {
                        JSON.parse(resp.jsonStringOutput);

                        resolve(true);

                    } catch (e) {
                        console.error("update workorderprofile failed", e);

                        resolve(false);
                    }
                }
            },
            statusbarContext
        );
    });
}
function FnFindMessageAndReplaceVariables(
    data: Record<string, any>,
    action: string
): IWorkorderAction {

    const template = messageTemplates[action];

    if (!template) {
        console.warn("Invalid action:", action);
        return {};
    }

    const replaceVars = (str: string): string => {
        return str.replace(/<([^>]+)>/g, (_, key) => {
            const trimmedKey = key.trim();
            const lowerKey = trimmedKey.toLowerCase();
            const foundEntry = Object.entries(data).find(([k]) => k.toLowerCase() === lowerKey);
            const value = data[trimmedKey] ?? foundEntry?.[1];

            if (value === undefined || value === null) {
                console.warn(`Missing value for key: ${key}`);
                return `<${key}>`;
            }

            return String(value);
        });
    };

    if (Array.isArray(template)) {

        const normalized = template.map(item => {
            const { sortOrder = 999, ...rest } = item;
            const [key, value] = Object.entries(rest)[0];

            return {
                key,
                value,
                sortOrder
            };
        });

        normalized.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

        const result: Record<string, any> = {};

        normalized.forEach((step: any) => {
            result[step.key] = {
                message: replaceVars(step.value),
                sortOrder: step.sortOrder
            };
        });

        return result;
    }

    return {};
}
function convertObjectToPath(data: Record<string, any>): string {
    return Object.values(data)
        .filter(value => value !== undefined && value !== null && value !== "")
        .map(value => String(value))
        .join("->");
}
const filterMessageBsaedOnPort = (
    messageObj: IWorkorderAction,
    powerPort: number,
    networkPort: number
): IWorkorderAction => {

    const result: IWorkorderAction = {};

    for (const key in messageObj) {

        const isPowerAction =
            key === "Poweroff" ||
            key === "Unplug" ||
            key === "Plug-in" ||
            key === "Poweron";

        const isNetworkAction =
            key === "Uncable" ||
            key === "Cable";

        const step = messageObj[key];

        // BOTH present → allow everything
        if (powerPort > 0 && networkPort > 0) {
            result[key] = step;
            continue;
        }

        // Only power
        if (powerPort > 0 && networkPort === 0) {
            if (isPowerAction || (!isPowerAction && !isNetworkAction)) {
                result[key] = step;
            }
            continue;
        }

        // Only network
        if (networkPort > 0 && powerPort === 0) {
            if (isNetworkAction || (!isPowerAction && !isNetworkAction)) {
                result[key] = step;
            }
            continue;
        }

        // No ports
        if (powerPort === 0 && networkPort === 0) {
            if (!isPowerAction && !isNetworkAction) {
                result[key] = step;
            }
        }
    }

    return result;
};
function FnGetMessageBasedOnNode(
    messageObj: Record<string, string>,
    powerPort: number,
    networkPort: number
): Record<string, any> {
    if (powerPort || networkPort) {
        return filterMessageBsaedOnPort(messageObj, powerPort, networkPort);
    }
    else {
        return messageObj
    }
}
const FnCreateWorkOrderApiCalls = async (
    props: IFnCreateWorkOrderApiCall
) => {
    const {
        treeData,
        sourceNodeEntID,
        sourceNodeName,
        EntityName = "WorkorderProfile",
        WorkorderType,
        action,
        sessionContext,
        statusBarContext,
        _WorkOrderProfile,
        ParentEntityName,
        ParentID,
        RUPosition,
        destNodeEntityname,
        destNodeEntID,
        destNodeObj,
        destNodePath,
        EQID,
        mountedShortView,
        SlotStatus,
        PortStatus,
        AuditStatus,
        sourceTreeData,
        AuditName,
        sourceNodeObj,
        workOrderProfileName,
        workOrderItems,
        PortName,
        PortID,
        extraSouceObj,
        extraDestObj,
        networkPort,
        powerPort,
        SiteID,
        RoomID,
        FloorID,
        DESC250,
        sourceNodePath
    } = props;
    try {

        let responseProfile;
        let WorkorderProfile;
        if (_WorkOrderProfile && (_WorkOrderProfile.DateApproved === null || !_WorkOrderProfile.DateApproved)) {
            responseProfile = _WorkOrderProfile;

        } else {

            WorkorderProfile = workOrderProfileName ? workOrderProfileName : await callAPIForGetWorkorderName(statusBarContext);

            const siteName = FnGetSessionVariableFromStorage('Location', "SiteName", sessionContext.SessionList);
            const siteID = FnGetSessionVariableFromStorage('Location', "SiteID", sessionContext.SessionList);
            const roomName = FnGetSessionVariableFromStorage('Location', "RoomName", sessionContext.SessionList);
            const roomID = FnGetSessionVariableFromStorage('Location', "RoomID", sessionContext.SessionList);
            const floorName = FnGetSessionVariableFromStorage('Location', "FloorName", sessionContext.SessionList);
            const floorID = FnGetSessionVariableFromStorage('Location', "FloorID", sessionContext.SessionList);
            const userName = FnGetSessionVariableFromStorage('RequestedBy', "LoginShortName", sessionContext.SessionList);

            const sessionSiteName = siteName?.[0]?.SessionValue ?? "";
            const sessionSiteID = siteID?.[0]?.SessionValue ?? "";
            const sessionRoomName = roomName?.[0]?.SessionValue ?? "";
            const sessionRoomID = roomID?.[0]?.SessionValue ?? "";
            const sessionFloorName = floorName?.[0]?.SessionValue ?? "";
            const sessionFloorID = floorID?.[0]?.SessionValue ?? "";
            const sessionUserName = userName?.[0]?.SessionValue ?? "";

            // Validate required session data
            if (
                !sessionSiteName ||
                !sessionRoomName ||
                !sessionFloorName ||
                !sessionUserName ||
                !(SiteID ?? sessionSiteID) ||
                !(RoomID ?? sessionRoomID) ||
                !(FloorID ?? sessionFloorID)
            ) {
                throw new Error("Missing site/room/floor/user session data");
            }

            const isNotApplyUnderscore = ['auditsession']
            const DataEntityName = ParentEntityName
                ? ParentEntityName?.includes('_') ? ParentEntityName :
                    isNotApplyUnderscore.includes(ParentEntityName.toLowerCase()) ? ParentEntityName : `__${ParentEntityName}` : null

            //  1. Create WorkorderProfile
            const descValue = (DESC250 ?? "").trim();
            let payloadWorkOrderProfile: {
                EntityName: any;
                _Site: string;
                SiteID: string;
                _Room: string;
                RoomID: string;
                _Floor: string;
                FloorID: string;
                _WorkorderProfile: any;
                WorkorderType: string;
                CreatedBy: string;
                AssignedBy: string;
                ParentID: any;
                ParentEntityName: any;
                EntID?: string; //  optional
                DESC250?: string;
            } = {
                EntityName,
                _Site: sessionSiteName ?? "",
                SiteID: SiteID ?? sessionSiteID ?? "",
                RoomID: RoomID ?? sessionRoomID ?? "",
                _Room: sessionRoomName ?? "",
                _Floor: sessionFloorName ?? "",
                FloorID: FloorID ?? sessionFloorID ?? "",
                _WorkorderProfile: WorkorderProfile,
                WorkorderType,
                CreatedBy: sessionUserName ?? "",
                AssignedBy: "",
                ParentID,
                ParentEntityName: DataEntityName,
                ...(descValue ? { DESC250: descValue } : {}),
            };
            if (WorkorderType === "Placement" && sourceNodeEntID) {
                payloadWorkOrderProfile.EntID = sourceNodeEntID;
            } else if (extraSouceObj && extraSouceObj.placementEntID) {
                payloadWorkOrderProfile.EntID = extraSouceObj.placementEntID
            }
            const data = await callAddUpdateAPI(
                { "_WorkorderProfile": [payloadWorkOrderProfile] },
                statusBarContext
            );

            const responseProfileObj =
                data &&
                    typeof data === "object" &&
                    "jsonStringOutput" in data &&
                    data.jsonStringOutput
                    ? FnParseJsonSafely(data.jsonStringOutput as string)
                    : null;

            responseProfile = responseProfileObj?._WorkorderProfile
            if (!data) {
                throw new Error("Failed to create WorkorderProfile");
            }
        }



        const workOrderArr = responseProfile;

        if (!Array.isArray(workOrderArr) || !workOrderArr.length) {
            throw new Error("Invalid WorkorderProfile response");
        }

        const isAppend = Boolean(_WorkOrderProfile);
        const firstWorkOrder = workOrderArr[0];
        const entId = firstWorkOrder?.EntID;
        const entityName = firstWorkOrder?.EntityName;
        if (!entId || !entityName) {
            throw new Error("Missing EntID or EntityName");
        }

        const workordername = firstWorkOrder._WorkorderProfile ? firstWorkOrder._WorkorderProfile : firstWorkOrder._Workorder;

        let current_sequence_max = 0;
        if (isAppend) {
            const profileObj = Array.isArray(_WorkOrderProfile) ? _WorkOrderProfile[0] : _WorkOrderProfile;
            const existingItems: any[] =
                profileObj?.WorkorderItems ??
                profileObj?.workorderItems ??
                profileObj?.workorderitems;

            if (Array.isArray(existingItems) && existingItems.length > 0) {
                for (const item of existingItems) {
                    const seq = Number(item?.SeqNo ?? 0);
                    if (!isNaN(seq) && seq > current_sequence_max) {
                        current_sequence_max = seq;
                    }
                }
            }

            if (current_sequence_max === 0 && workordername) {
                try {
                    const fetchedMaxSeq = await fetchWorkOrderMaxSeq(workordername, statusBarContext);
                    if (fetchedMaxSeq > current_sequence_max) {
                        current_sequence_max = fetchedMaxSeq;
                    }
                } catch (err) {
                    console.error("Error fetching workorder max sequence:", err);
                }
            }

            if (current_sequence_max === 0 && profileObj?.HasChildren) {
                const hasChildrenCount = Number(profileObj.HasChildren);
                if (!isNaN(hasChildrenCount) && hasChildrenCount > 0) {
                    current_sequence_max = hasChildrenCount;
                }
            }
        }

        // if passed multiple workorder items 
        if (workOrderItems && workOrderItems.length) {
            const payload: Record<string, any>[] = []
            for (let index = 0; index < workOrderItems.length; index++) {
                const element = { ...workOrderItems[index] };
                element._WorkorderProfile = workordername;
                element.EntityName = entityName;
                element.EntID = entId;
                if (isAppend) {
                    element.SeqNo = current_sequence_max + index + 1;
                }
                if (element.ItemJson && typeof element.ItemJson === "string") {
                    try {
                        const parsed = JSON.parse(element.ItemJson);
                        if (!parsed.Workordername || parsed.Workordername !== workordername) {
                            parsed.Workordername = workordername;
                            element.ItemJson = JSON.stringify(parsed);
                        }
                    } catch {
                        // ignore JSON parse errors
                    }
                }
                payload.push(element);
            }

            const responseWorkOrder = await callAddUpdateAPI(
                { "PG.WorkorderItem": payload },
                statusBarContext,
                true
            );

            // STRICT CHECK: both must succeed
            if (!responseWorkOrder) {
                throw new Error("Failed to create Workorder");
            }

            //  Only return if BOTH succeeded
            return {
                workorderProfile: responseProfile,
                workorder: responseWorkOrder
            };

        } else {
            // signle workorder based on passed data
            const firstWorkOrder = workOrderArr[0];
            const entId = firstWorkOrder?.EntID;
            const entityName = firstWorkOrder?.EntityName;
            const workordername = firstWorkOrder._WorkorderProfile ? firstWorkOrder._WorkorderProfile : firstWorkOrder._Workorder;
            if (!entId || !entityName) {
                throw new Error("Missing EntID or EntityName");
            }

            //  Prepare source/destination
            let destParentsNodes;
            let sourceParentsNodes;
            if (destNodeEntID && treeData) {
                destParentsNodes = destNodeObj ?? await FnReturnNodeNameObject(treeData, destNodeEntID);
            }
            let destPath = destNodePath ? destNodePath : convertObjectToPath(destParentsNodes || {});
            if (destPath) {
                destPath = destPath.replace(/^sites\s*->\s*/i, "");
            }
            if (!sourceNodePath && (sourceTreeData?.length || treeData?.length && sourceNodeEntID)) {
                const data = sourceTreeData ? sourceTreeData : treeData
                if (data && sourceNodeEntID) {
                    sourceParentsNodes = await FnReturnNodeNameObject(data, sourceNodeEntID);
                }

            }

            if ((action === "Move Device to Floor" || action === "Move Floor Device to Floor") && sourceParentsNodes && sourceParentsNodes.RU) {
                delete sourceParentsNodes.RU
            }

            let sourcePath = sourceNodePath ? sourceNodePath : sourceParentsNodes && convertObjectToPath(sourceParentsNodes || {});
            const makeObjectForMessage = {
                deviceName: sourceNodeName,
                sourcePath: sourceNodeObj ? sourceNodeObj : sourcePath,
                destPath,
                portPath: sourcePath,
                EntName: sourceNodeName,
                EQID: EQID,
                mountedShortView,
                slotStatus: SlotStatus,
                portStatus: PortStatus,
                AuditStatus: AuditStatus,
                AuditName,
                PortName
            }

            let message: Record<string, any> = FnFindMessageAndReplaceVariables(makeObjectForMessage, action)

            if (typeof message === "object") {
                if (Object.keys(message).length) {
                    message = FnGetMessageBasedOnNode(message as Record<string, string>, powerPort ?? 0, networkPort ?? 0);

                }
            }

            const isFloor = props.isFloorDevice ?? (
                sourceParentsNodes &&
                !sourceParentsNodes.RU &&
                !sourceParentsNodes.Rack &&
                !sourceParentsNodes.Slot &&
                !sourceParentsNodes.DeviceSlot &&
                Boolean(sourceParentsNodes.Floor || sourceParentsNodes.Location)
            );

            if (isFloor && message && typeof message === "object" && message["Unmount"]) {
                delete message["Unmount"];
            }

            const dest = {
                ...destParentsNodes,
                EntityName: destNodeEntityname,
                EntId: destNodeEntID,
                RUPosition,
                ...extraDestObj
            };

            const source = {
                ...sourceParentsNodes,
                // device: sourceNodeName,
                EntId: sourceNodeEntID,
                slotStatus: SlotStatus,
                portStatus: PortStatus,
                AuditStatus: AuditStatus,
                PortName,
                PortID,
                ...extraSouceObj
            };

            //  2. Create Workorder
            let mutipleRecords = false
            const payloadWorkOrderItems: Record<string, any>[] = [];

            if (typeof message === "object" && message !== null) {

                //  STEP 1: Convert to array
                const entries = Object.entries(message);

                mutipleRecords = true;

                if (entries.length) {

                    //  STEP 2: Sort by sortOrder
                    const sortedEntries = entries.sort(
                        ([, a]: any, [, b]: any) => a.sortOrder - b.sortOrder
                    );

                    //  STEP 3: Loop in sorted order
                    sortedEntries.forEach(([key, value]: any, index) => {

                        payloadWorkOrderItems.push({
                            ItemJson: JSON.stringify({
                                dest: destNodeEntID ? dest : "",
                                source: sourceNodeObj ? sourceNodeObj : source,
                                action: key,
                                Workordername: workordername,
                                message: value.message
                            }),
                            _WorkorderProfile: workordername,
                            EntityName: entityName,
                            EntID: entId,
                            SeqNo: current_sequence_max + index + 1
                        });

                    });
                }
            }
            if (payloadWorkOrderItems.length === 0) {
                throw new Error("Failed to create Workorder items");
            }
            const responseWorkOrder = await callAddUpdateAPI(
                { "PG.WorkorderItem": payloadWorkOrderItems },
                statusBarContext,
                mutipleRecords
            );

            // STRICT CHECK: both must succeed
            if (!responseWorkOrder) {
                throw new Error("Failed to create Workorder");
            }

            //  Only return if BOTH succeeded
            return {
                workorderProfile: responseProfile,
                workorder: responseWorkOrder
            };
        }

    } catch (error) {
        console.error(error);
        throw new Error(`Error in FnCreateWorkOrderApiCalls: ${error}`);
    }
};
const FnAutoExecuteWorkOrder = async (woid: string, statusBarContext: IStatusBar): Promise<any> => {
    return new Promise((resolve, reject) => {
        axiosInterceptor(
            {
                url: DEVICE.ExecuteWorkorder,
                data: {
                    woid: woid
                },
                allowShowLoader: true,
                setFetchData: (response: unknown, status?: string, errData?: IErrorData[]) => {
                    // Check application-level error first
                    const errorData = errData?.find(
                        (error) => error?.errCode > 0
                    );

                    if (errorData) {
                        reject(new Error(errorData.errString));
                        return;
                    }

                    // Success
                    if (status === "200" && response) {
                        resolve(response);
                        return;
                    }

                    // HTTP/API error
                    const message =
                        errData?.[0]?.errString || `API Error ${status}`;

                    reject(new Error(message));
                }
            },
            statusBarContext
        );
    });
}
const FnGetWorkOrderProfile = (sessionContext: ISessionContextProps, statusBarContext: IStatusBar): Promise<any> => {
    const mapWorkOrderData = (data: any[]): IWorkorderRecord[] => {
        return data.map((item): IWorkorderRecord => ({
            _Site: item._Site || "",
            _Room: item._Room || "",
            _Floor: item._Floor || "",

            //  important mapping
            _Workorder: item._WorkorderProfile || "",

            Desc250: item.Desc250 || "",
            WorkorderType: item.WorkorderType || "",

            DateCreated: item.DateCreated ? new Date(item.DateCreated) : undefined,
            CreatedBy: item.CreatedBy || "",

            DateApproved: item.DateApproved ? new Date(item.DateApproved) : undefined,
            ApprovedBy: item.ApprovedBy || "",

            DateExecuted: item.DateExecuted ? new Date(item.DateExecuted) : undefined,
            ExecutedBy: item.ExecutedBy || "",

            DateAssigned: item.DateAssigned ? new Date(item.DateAssigned) : undefined,
            AssignedBy: item.AssignedBy || "",
            AssignedTo: item.AssignedTo || "",

            //  new field
            Instructions: item.Instructions || "",
            _WorkorderProfile: item._WorkorderProfile || "",
            ...item
        }));
    };

    const siteName = FnGetSessionVariableFromStorage('Location', "SiteName", sessionContext.SessionList);
    if (siteName?.length === 0) {
        throw new Error("Missing site session data");
    } else {
        return new Promise((resolve, reject) => {
            axiosInterceptor(
                {
                    url: ALERT.GetAlertProfiles,
                    data: {
                        entityName: EntityNameEnums.WorkorderProfile,
                    },
                    setFetchData: (handleApiResp: unknown, status?: string) => {

                        try {
                            if (
                                status === "200" &&
                                handleApiResp &&
                                typeof handleApiResp === "object" &&
                                'alertJson' in handleApiResp
                            ) {
                                const data = FnHandleAPIResponse(
                                    (handleApiResp as any).alertJson,
                                    "Dataset"
                                );
                                if (siteName && data?.length) {
                                    const filterData = data.filter((item: any) => item._Site === siteName[0].SessionValue)
                                    resolve(mapWorkOrderData(filterData));
                                } else {
                                    resolve([]);
                                }
                            } else {
                                reject(new Error("Invalid API response"));
                            }
                        } catch (error) {
                            console.error("Error processing response:", error);
                            reject(error); //  proper error return
                        }
                    }
                },
                statusBarContext
            );
        });
    }

};
export { FnCreateWorkOrderApiCalls, FnGetWorkOrderProfile, FnFindMessageAndReplaceVariables, FnAutoExecuteWorkOrder, FnCallApiForUpdateDeviceWoProfile, FnApproveWorkorderApiCall, FnReturnNodeNameObject }

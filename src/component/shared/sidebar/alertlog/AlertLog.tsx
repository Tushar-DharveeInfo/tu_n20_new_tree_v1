
import { useEffect, useState } from "react";
import { handleNestedZoneContainerKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown';
import { Alertlog, IAlertLogRecord } from "@n20a/libalerts";
import '@n20a/libalerts/style.css'
import { useSessionContext } from "../../context/hooks/SessionHooks";
import { useStatusBarContext } from "../../context/hooks/StatusBarHooks";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { ALERT, EM } from "../../interceptors/EndPoints";
import { IAlertLog } from "../../allinterface/sidebar/IAlertLog";
import { Label } from "../../basic/label/Label";

const hasHtmlMarkup = (value: unknown): boolean => {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }
    return /<[^>]+>/.test(value);
};
const mapToAlertLogRecord = (data: Record<string, any>): IAlertLogRecord => {
    return {
        AlertSeverity: data.AlertSeverity,
        IsClosed: data.IsClosed,
        _AlertQueue: data.AlertQueueName,
        AssignedTo: data.AssignedTo,
        AttemptCount: data.AttemptCount,
        LastDelivered: data.LastDelivered,
        AlertProfileName: data.AlertProfileName,
        HTML: typeof data.HTML === "string" && hasHtmlMarkup(data.HTML)
            ? data.HTML
            : "",
        EntityName: data.EntityName,
        EntId: data.EntID,
        AlertEntityName: data.AlertEntityName,
        AlertEntID: data.AlertEntID,
        FileUID: data.FileUID,
        FileType: data.FileType,
        UsersToNotifyJson: data.UsersToNotifyJson,
        AlertID: data.AlertID ?? ""
    };
};

const AlertLog = (alertLogProps: IAlertLog) => {
    const [alertRecords, setAlertRecords] = useState<IAlertLogRecord[]>([]);
    const [originalAlertData, setOriginalAlertData] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();

    useEffect(() => {
        axiosInterceptor({
            url: ALERT.GetAlertsToProcess,
            data: {
                fromSystem: alertLogProps.selectedNode?.NodeEntID ? 0 : 2,
            },
            setFetchData: (handleApiResp: unknown, status?: string) => {
                if (status === "200" && handleApiResp && typeof handleApiResp === "object"
                    && 'alertJson' in handleApiResp && handleApiResp.alertJson) {

                    try {
                        const parsed = JSON.parse(handleApiResp.alertJson as string);
                        if (parsed && Array.isArray(parsed) && parsed.length) {
                            setOriginalAlertData([...parsed]);
                            const alertLogs: IAlertLogRecord[] = parsed.map(mapToAlertLogRecord);
                            if (alertLogProps.selectedNode?.NodeEntID) {
                                const filtered = alertLogs.filter((item) => item.AlertEntID === alertLogProps.selectedNode?.NodeEntID);
                                if (filtered.length) {
                                    setAlertRecords(filtered)
                                }
                            }
                            else {
                                setAlertRecords(alertLogs)
                            }
                        }
                        else {
                            setAlertRecords([])
                        }
                    } catch (error) {
                        console.error('Error in handle api response :', error);

                    }
                    finally {
                        setLoading(false)
                    }
                }
                else {
                    setLoading(false)
                }
            }
        }, statusBarContext)
    }, [alertLogProps.selectedNode?.NodeEntID])

    const handleOnRefreshStatus = async (
    ): Promise<void> => {
        axiosInterceptor({
            url: ALERT.GetAlertsToProcess,
            data: {
                fromSystem: alertLogProps.selectedNode?.NodeEntID ? 0 : 2,
            },
            setFetchData: (handleApiResp: unknown, status?: string) => {
                if (status === "200" && handleApiResp && typeof handleApiResp === "object"
                    && 'alertJson' in handleApiResp && handleApiResp.alertJson) {
                    try {
                        const parsed = JSON.parse(handleApiResp.alertJson as string);
                        if (parsed && Array.isArray(parsed) && parsed.length) {
                            const alertLogs: IAlertLogRecord[] = parsed.map(mapToAlertLogRecord);
                            if (alertLogProps.selectedNode?.NodeEntID) {
                                const filtered = alertLogs.filter((item) => item.AlertEntID === alertLogProps.selectedNode?.NodeEntID);
                                if (filtered.length) {
                                    setAlertRecords(filtered)
                                }
                            }
                            else {
                                setAlertRecords(alertLogs)
                            }
                        }
                        else {
                            setAlertRecords([])
                        }
                    } catch (error) {
                        console.error('Error in handle api response :', error);

                    }
                    finally {
                        setLoading(false)
                    }
                }
            }
        }, statusBarContext)
    };

    const handleAssignToMe = async (
        entityName: string,
        entId: string,
        code: string
    ): Promise<void> => {
        try {
            const loginuser = Array.isArray(sessionContext?.SessionList)
                ? sessionContext.SessionList.find(
                    (item) => item?.VariableName === "LoginShortName"
                )
                : undefined;

            const alertToUpdate = Array.isArray(originalAlertData)
                ? originalAlertData.find((item) => item?.EntID === entId)
                : undefined;

            if (alertToUpdate && loginuser?.SessionValue) {

                try {
                    alertToUpdate.AssignedTo = loginuser?.SessionValue ?? "";
                } catch (err) {
                    console.error("Assign update error:", err);
                }

                const payload = {
                    ["_AlertQueue"]: [
                        {
                            AlertProfileName: alertToUpdate?.AlertProfileName,
                            MessageSource: alertToUpdate?.MessageSource,
                            AlertProfileID: alertToUpdate?.AlertProfileID,
                            EscalationLevel: alertToUpdate?.EscalationLevel,
                            AttemptCount: alertToUpdate?.AttemptCount,
                            AlertSeverity: alertToUpdate?.AlertSeverity,
                            AssignedTo: alertToUpdate?.AssignedTo,
                            _AlertQueue: alertToUpdate?.AlertQueueName,
                            HTML: alertToUpdate?.HTML,
                            EntityName: entityName,
                            EntID: alertToUpdate?.EntID,
                            RecID: alertToUpdate?.RecID
                        }
                    ]
                };
                axiosInterceptor(
                    {
                        url: EM.AddUpdateTableRecord,
                        data: {
                            jsonString: JSON.stringify(payload)
                        },
                        allowShowLoader: true,
                        setFetchData: () => { }
                    },
                    statusBarContext
                );
            }

        } catch (error) {
            console.error("handleAssignToMe error:", error);
        }
    };

    const handleStatusChange = async (
        entityName: string,
        entId: string,
        code: string
    ): Promise<void> => {
        try {
            const alertToUpdate = Array.isArray(originalAlertData)
                ? originalAlertData.find((item) => item?.EntID === entId)
                : undefined;

            if (alertToUpdate) {
                try {
                    if (code?.toLowerCase() === "close") {
                        alertToUpdate.IsClosed = true;
                    } else {
                        alertToUpdate.IsClosed = false;
                    }
                } catch (err) {
                    console.error("Status update error:", err);
                }

                const payload = {
                    ["_AlertQueue"]: [
                        {
                            AlertProfileName: alertToUpdate?.AlertProfileName,
                            MessageSource: alertToUpdate?.MessageSource,
                            AlertProfileID: alertToUpdate?.AlertProfileID,
                            EscalationLevel: alertToUpdate?.EscalationLevel,
                            AttemptCount: alertToUpdate?.AttemptCount,
                            AlertSeverity: alertToUpdate?.AlertSeverity,
                            AssignedTo: alertToUpdate?.AssignedTo,
                            _AlertQueue: alertToUpdate?.AlertQueueName,
                            IsClosed: alertToUpdate?.IsClosed,
                            HTML: alertToUpdate?.HTML,
                            EntityName: entityName,
                            EntID: alertToUpdate?.EntID,
                            RecID: alertToUpdate?.RecID
                        }
                    ]
                };

                axiosInterceptor(
                    {
                        url: EM.AddUpdateTableRecord,
                        data: {
                            jsonString: JSON.stringify(payload)
                        },
                        allowShowLoader: true,
                        setFetchData: () => { }
                    },
                    statusBarContext
                );

            }
        } catch (error) {
            console.error("handleStatusChange error:", error);
        }
    };

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading alert logs...</div>;
    }

    if (alertRecords.length === 0) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No alert logs found</div>;
    }

    return (
        <div className='nz-wh-100 nz-d-flex-column nz-overflow-hidden' tabIndex={1} onKeyDown={handleNestedZoneContainerKeyDown} key={alertLogProps.uniqueName}>
            <div className='nz-sub-header'>
                <Label uniqueName={`${alertLogProps.uniqueName}-task-header`} label={`${alertLogProps.headerText}`} />
            </div>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                <Alertlog alertRecords={alertRecords} onRefreshStatus={handleOnRefreshStatus}
                    onAssignToMe={handleAssignToMe} onStatusChange={handleStatusChange} />
            </div>
        </div>
    )
}

export { AlertLog }    
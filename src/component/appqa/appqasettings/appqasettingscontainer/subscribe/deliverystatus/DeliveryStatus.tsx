
import { useEffect, useState } from "react";
import { handleContainerKeyDown } from "../../../../../shared/allcommon/basic/FnHandleContainerKeyDown";
import { Deliverylog, IDeliveryLogRecord } from "@n20a/libalerts";
import { ALERT } from "../../../../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../../../../shared/interceptors/Interceptor";
import { useStatusBarContext } from "../../../../../shared/context/hooks/StatusBarHooks";
import "../../../../allcss/appqasettingscontainer/subscribe/DeliveryStatus.css";
import "@n20a/libalerts/style.css";
import {
    IDeliveryStatus,
} from "../../../../allinterface/iappqasettingscontainer/subscribe/IDeliveryStatus";
import { FnParseAlertDeliveryLogs } from "./FnParseAlertDeliveryLogs";

const DeliveryStatus = (deliveryProps: IDeliveryStatus) => {
    const [deliveryRecords, setDeliveryRecords] = useState<IDeliveryLogRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const statusBarContext = useStatusBarContext();

    // Loads delivery logs, maps ColumnList/Dataset onto IDeliveryLogRecord[].
    const loadDeliveryLogs = () => {
        axiosInterceptor(
            {
                url: ALERT.GetAlertDeliveryLogs,
                data: {},
                allowShowLoader: true,
                setFetchData: (handleApiResp: unknown, status?: string) => {
                    try {
                        if (
                            status === "200" &&
                            handleApiResp &&
                            typeof handleApiResp === "object" &&
                            "alertJson" in handleApiResp &&
                            handleApiResp.alertJson
                        ) {
                            const mappedRecords = FnParseAlertDeliveryLogs(
                                handleApiResp.alertJson
                            );
                            setDeliveryRecords(mappedRecords);
                        } else {
                            setDeliveryRecords([]);
                        }
                    } catch (error) {
                        console.error("Error handling GetAlertDeliveryLogs response:", error);
                        setDeliveryRecords([]);
                    } finally {
                        setLoading(false);
                    }
                },
            },
            statusBarContext
        ).catch((error) => {
            console.error("Error loading GetAlertDeliveryLogs:", error);
            setDeliveryRecords([]);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadDeliveryLogs();
    }, []);

    // Refresh delivery logs from the Deliverylog action callback.
    const handleOnRefreshStatus = async (
        _entityName: string,
        _entId: string,
        _code: string
    ): Promise<void> => {
        setLoading(true);
        loadDeliveryLogs();
    };

    if (loading) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">Loading delivery logs...</div>
        );
    }

    if (deliveryRecords.length === 0) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">No delivery logs found</div>
        );
    }

    return (
        <div
            className="nz-wh-100 nz-delivery-log-container"
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
            key={deliveryProps.uniqueName}
        >
            <Deliverylog
                deliveryRecords={deliveryRecords}
                onRefreshStatus={handleOnRefreshStatus}
            />
        </div>
    );
};
export { DeliveryStatus };

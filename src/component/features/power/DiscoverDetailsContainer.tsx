import { useEffect, useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { IDashboardChartContainerWithOverlay } from "../../shared/allinterface/charts/IDashboardChartContainerWithOverlay";
import DashboardChartContainerWithOverlay from "../../shared/charts/dashboardchartcontainerwithoverlay/DashboardChartContainerWithOverlay";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { useSelectedNodeContext } from "../../shared/context/hooks/SelectedNodeHooks";
import { useStatusBarContext } from "../../shared/context/hooks/StatusBarHooks";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { EM } from "../../shared/interceptors/EndPoints";
import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { IntelRawDataGrid } from "./IntelRawDataGrid";

export type IDiscoverDetailsContainer = IDashboardChartContainerWithOverlay;

/**
 * Checks whether the specified node represents a device or mounted device.
 */
const isDeviceOrMountedDevice = (node?: ITreeNode | null): boolean => {
    if (!node) return false;
    const nodeType = (node.NodeType || '').trim().toLowerCase();
    if (nodeType === 'device' || nodeType === 'mounteddevice') return true;

    const type = (node.Type || '').trim().toLowerCase();
    if (type === 'device' || type === 'mounteddevice') return true;

    const entityName = (node.NodeEntityname || '').trim().toLowerCase().replace(/^__?/, '');
    if (entityName === 'device' || entityName === 'mounteddevice') return true;

    return false;
};

const DiscoverDetailsContainer = (props: IDiscoverDetailsContainer) => {
    const selectedNodeContext = useSelectedNodeContext();
    const statusBarContext = useStatusBarContext();

    const currentNode: ITreeNode | undefined = props.selectedNode || selectedNodeContext?.selectedNode;
    const isDevice = isDeviceOrMountedDevice(currentNode);

    const [rawData, setRawData] = useState<unknown>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!isDevice || !currentNode) {
            setRawData(null);
            setIsLoading(false);
            return;
        }

        const entId =
            currentNode.NodeEntID ||
            currentNode.MountedDeviceEntID ||
            (currentNode.key ? String(currentNode.key) : "") ||
            "3fa85f64-5717-4562-b3fc-2c963f66afa6";

        setIsLoading(true);
        axiosInterceptor(
            {
                url: EM.GetTableRecord,
                data: {
                    tableName: "PG.IntelRawData",
                    entID: entId
                },
                allowShowLoader: false,
                setFetchData: (response: unknown, status?: string) => {
                    setIsLoading(false);
                    if (status === "200" && response) {
                        let parsed: unknown = response;
                        if (typeof response === "object" && response !== null) {
                            const resObj = response as Record<string, unknown>;
                            if (typeof resObj.jsonStringOutput === "string") {
                                const unwrapped = FnParseJsonSafely(resObj.jsonStringOutput);
                                if (unwrapped) parsed = unwrapped;
                            } else if (typeof resObj.dataJson === "string") {
                                const unwrapped = FnParseJsonSafely(resObj.dataJson);
                                if (unwrapped) parsed = unwrapped;
                            }
                        }
                        setRawData(parsed);
                    } else {
                        setRawData(null);
                    }
                }
            },
            statusBarContext
        );
    }, [
        isDevice,
        currentNode?.NodeEntID,
        currentNode?.MountedDeviceEntID,
        currentNode?.key
    ]);

    if (!isDevice) {
        return <DashboardChartContainerWithOverlay {...props} />;
    }

    return (
        <div className="nz-discover-details-container nz-wh-100" style={{ height: "100%", width: "100%" }}>
            <Splitter tabIndex={-1} className="nz-wh-100">
                <SplitterPanel tabIndex={-1} size={50} minSize={25} className="nz-wh-100">
                    <DashboardChartContainerWithOverlay {...props} hideSideBarCloseBtn={true} />
                </SplitterPanel>
                <SplitterPanel
                    tabIndex={-1}
                    size={50}
                    minSize={25}
                    className="nz-wh-100 nz-d-flex-column"
                    style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}
                >
                    <IntelRawDataGrid
                        uniqueName={`${props.uniqueName}-intel-raw-data`}
                        rawData={rawData}
                        selectedNode={currentNode}
                        isLoading={isLoading}
                        featureId={props.featureId}
                        handleSidebarOpenClose={props.handleSidebarOpenClose}
                        hideSideBarCloseBtn={props.hideSideBarCloseBtn}
                    />
                </SplitterPanel>
            </Splitter>
        </div>
    );
};

export { DiscoverDetailsContainer };
export default DiscoverDetailsContainer;

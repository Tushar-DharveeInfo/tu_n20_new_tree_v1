
import { useCallback, useEffect, useState } from 'react'
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { NetworkDiagram } from "@n20a/libd3tree"
import type { IContainerSize, INodeData } from '@n20a/libd3tree'
import '../../allcss/cabling/NetworkTrace.css';
import '@n20a/libd3tree/scoped.css';
import { CABLING } from '../../../shared/interceptors/EndPoints';
import { INetworkTrace } from '../../../shared/allinterface/cabling/INetworkTrace';
import { createRoot } from 'react-dom/client';
import { StatusBarProvider } from '../../../shared/context/contextandprovider/StatusBar';
import { HelpTipProvider } from '../../../shared/context/contextandprovider/Helptip';
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks';
import { Helptip } from '../../../shared/Help';
import { FnCreateReportForPrint } from '../../../shared/allcommon/generatepdf/FnCreateReportForPrint';
import { GeneratePdf } from '../../../shared/generatepdf/GeneratePdf';
import { TReportLayoutJson } from '../../../shared/allinterface/IGeneratePdf';

const NetworkTrace = (networkTraceProps: INetworkTrace) => {
    const [jsonData, setJsonData] = useState<INodeData>();
    const [loading, setLoading] = useState<boolean>(true);
    const [containerDimensions, setContainerDimensions] = useState<IContainerSize>({ width: 1200, height: 800 });
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);

    const statusBarContext = useStatusBarContext();
    const helpTipsContext = useHelpTipContext();

    useEffect(() => {
        const layoutContainer = document.getElementById("LayoutContainer");
        if (!layoutContainer) return;

        let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

        const resizeObserver = new ResizeObserver(() => {
            // Clear previous pending updates
            if (resizeTimeout) clearTimeout(resizeTimeout);

            // Wait 200ms after the last resize event
            resizeTimeout = setTimeout(() => {
                setContainerDimensions({
                    width: layoutContainer.clientWidth,
                    height: layoutContainer.offsetHeight
                });
            }, 200); // adjust delay as needed (150–300ms is typical)
        });

        resizeObserver.observe(layoutContainer);

        return () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (networkTraceProps.selectedNode && networkTraceProps.selectedNode.node && networkTraceProps.selectedNode.node.NodeEntityname && !networkTraceProps.ApiData) {
            setLoading(true);
            axiosInterceptor({
                url: CABLING.GetNetworkTraceData,
                data: {
                    deviceID: networkTraceProps.selectedNode.node.NodeEntID
                },
                allowShowLoader: true,
                setFetchData: async (getNetworkTraceDataApiResponse: unknown, status?: string) => {
                    if (status === "200" && getNetworkTraceDataApiResponse && typeof getNetworkTraceDataApiResponse === "object" && 'traceJson' in getNetworkTraceDataApiResponse) {
                        try {
                            const parsed = JSON.parse(getNetworkTraceDataApiResponse.traceJson as string);
                            if (typeof parsed === "object") {
                                setJsonData(parsed);
                            }
                        } catch (error) {
                            console.error('error in parse api response  :', error);
                            setJsonData(undefined)
                        }
                    }
                    else {
                        setJsonData(undefined)
                    }
                    setLoading(false);
                }
            }, statusBarContext);
        } else if (networkTraceProps.ApiData) {
            setJsonData(networkTraceProps.ApiData)
            setLoading(false);
        }
    }, [networkTraceProps.selectedNode, networkTraceProps.ApiData])

    function handleCtrlLinkClick(nodeData: { EntId?: string | undefined; EntityName?: string | undefined; }): void {
        if (networkTraceProps.handleSelectDCExplorer) {
            networkTraceProps.handleSelectDCExplorer(undefined, undefined, nodeData.EntityName, nodeData.EntId)
        }
    }

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (networkTraceProps.onRendered && jsonData) {
            timeout = setTimeout(() => {
                networkTraceProps.onRendered && networkTraceProps.onRendered();
            }, 1000)
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [jsonData])

    const getTipByFeatureId = (featureId: string, featureName?: string): string | undefined => {
        const target = helpTipsContext.helpTipRecords.find(item => item.featureid.startsWith(`${featureId}_`));
        return target?.tip ? target?.tip : `Helptip missing for ${featureName ?? featureId} report to SC….`;
    }


    return (
        <div key={networkTraceProps.uniqueName} style={{ overflow: 'hidden' }} className='nz-wh-100 nz-network-trace' tabIndex={1} onKeyDown={handleContainerKeyDown}>
            {!networkTraceProps.hideHelpTip && <Helptip uniqueName={`${networkTraceProps.uniqueName}-helptip`} mdString={getTipByFeatureId(networkTraceProps.featureId, "Cabling")} hideCloseBtn={true} />}
            {loading ? (
                <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>
            ) : (
                jsonData ? (
                    <NetworkDiagram
                        key={`${containerDimensions.width}-${containerDimensions.height}`}
                        containerDimensions={containerDimensions}
                        networkData={jsonData}
                        useIcons={true}
                        handleCtrlLinkClick={handleCtrlLinkClick}
                    />

                ) : <div className="nz-wh-100 nz-d-flex-hv-left">Network trace details not found for: {networkTraceProps.selectedNode?.node.Name ?? "selected node"}</div>
            )}
            {isReportDialogOpen && (
                <GeneratePdf
                    uniqueName={`${networkTraceProps.uniqueName}-network-trace-report`}
                    isOpen={isReportDialogOpen}
                    reportJson={reportTemplateJson}
                    title="Network Trace Report"
                    featureId={networkTraceProps.featureId}
                    selectedNode={networkTraceProps.selectedNode?.node}
                    onClose={() => {
                        setIsReportDialogOpen(false);
                        setReportTemplateJson(null);
                    }}
                />
            )}
        </div>
    )
}
// below componet is used to create Memory url.
function RenderNetoworkTraceContainer(container: HTMLElement, props: INetworkTrace) {
    const root = createRoot(container);
    // Offscreen createRoot is outside the app tree — must provide StatusBar + HelpTip
    // or context hooks throw and .nz-network-trace never mounts.
    root.render(
        <StatusBarProvider>
            <HelpTipProvider>
                <NetworkTrace {...props} hideHelpTip />
            </HelpTipProvider>
        </StatusBarProvider>
    );
    return {
        unmount: () => root.unmount()
    };
}
export { RenderNetoworkTraceContainer };
export default NetworkTrace

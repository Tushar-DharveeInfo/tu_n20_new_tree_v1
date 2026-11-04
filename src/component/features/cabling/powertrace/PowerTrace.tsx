
import { useCallback, useEffect, useState } from 'react'
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { D3Tree } from "@n20a/libd3tree"
import type { IContainerSize, ID3Tree } from '@n20a/libd3tree'
import '../../allcss/cabling/PowerTrace.css';
import '@n20a/libd3tree/scoped.css';
import { CABLING } from '../../../shared/interceptors/EndPoints';
import { IPowerTrace } from '../../../shared/allinterface/cabling/IPowerTrace'
import { createRoot } from 'react-dom/client';
import { StatusBarProvider } from '../../../shared/context/contextandprovider/StatusBar';
import { HelpTipProvider } from '../../../shared/context/contextandprovider/Helptip';
import { Helptip } from '../../../shared/Help';
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks';
import { FnCreateReportForPrint } from '../../../shared/allcommon/generatepdf/FnCreateReportForPrint';
import { GeneratePdf } from '../../../shared/generatepdf/GeneratePdf';
import { TReportLayoutJson } from '../../../shared/allinterface/IGeneratePdf';

const PowerTrace = (powerTraceProps: IPowerTrace) => {
    const [jsonData, setJsonData] = useState<ID3Tree>();
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
        if (powerTraceProps.selectedNode && powerTraceProps.selectedNode.node && powerTraceProps.selectedNode.node.NodeEntityname && !powerTraceProps.ApiData) {
            setLoading(true); // Start loading
            axiosInterceptor({
                url: CABLING.GetPowerTraceData,
                data: {
                    deviceID: powerTraceProps.selectedNode.node.NodeEntID
                },
                setFetchData: async (getPowerTraceDataApiResponse: unknown) => {
                    if (getPowerTraceDataApiResponse && typeof getPowerTraceDataApiResponse === "object" && 'traceJson' in getPowerTraceDataApiResponse) {
                        try {
                            const parsed = JSON.parse(getPowerTraceDataApiResponse.traceJson as string);
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
        } else if (powerTraceProps.ApiData) {
            setJsonData(powerTraceProps.ApiData);
            setLoading(false);
        }
    }, [powerTraceProps.selectedNode, powerTraceProps.ApiData])



    function handleCtrlLinkClick(nodeData: { EntId?: string | undefined; EntityName?: string | undefined; }): void {

        if (powerTraceProps.handleSelectDCExplorer) {
            powerTraceProps.handleSelectDCExplorer(undefined, undefined, nodeData.EntityName, nodeData.EntId)
        }
    }
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (powerTraceProps.onRendered && jsonData) {
            timeout = setTimeout(() => {
                powerTraceProps.onRendered && powerTraceProps.onRendered();
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
        <div key={powerTraceProps.uniqueName} className='nz-wh-100 nz-power-trace' tabIndex={1} onKeyDown={handleContainerKeyDown} style={{ overflow: 'hidden' }}>
            {!powerTraceProps.hideHelpTip && <Helptip uniqueName={`${powerTraceProps.uniqueName}-helptip`} mdString={getTipByFeatureId(powerTraceProps.featureId, "Cabling")} hideCloseBtn={true} />}
            {loading ? (
                <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>
            ) : (
                jsonData ? (
                    <D3Tree
                        key={`${containerDimensions.width}-${containerDimensions.height}`}
                        containerDimensions={containerDimensions}
                        treeData={jsonData}
                        orientation="vertical"
                        useIcons={true}
                        handleCtrlLinkClick={handleCtrlLinkClick}
                    />

                ) : <div className="nz-wh-100 nz-d-flex-hv-left">Power trace details not found for: {powerTraceProps.selectedNode?.node.Name ?? "selected node"}</div>
            )}
            {isReportDialogOpen && (
                <GeneratePdf
                    uniqueName={`${powerTraceProps.uniqueName}-power-trace-report`}
                    isOpen={isReportDialogOpen}
                    reportJson={reportTemplateJson}
                    featureId={powerTraceProps.featureId}
                    title="Power Trace Report"
                    selectedNode={powerTraceProps.selectedNode?.node}
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
function RenderPowerTraceContainer(container: HTMLElement, props: IPowerTrace) {
    const root = createRoot(container);
    // Offscreen createRoot is outside the app tree — must provide StatusBar + HelpTip
    // or context hooks throw and .nz-power-trace never mounts.
    root.render(
        <StatusBarProvider>
            <HelpTipProvider>
                <PowerTrace {...props} hideHelpTip />
            </HelpTipProvider>
        </StatusBarProvider>
    );
    return {
        unmount: () => root.unmount()
    };
}
export { RenderPowerTraceContainer };
export default PowerTrace

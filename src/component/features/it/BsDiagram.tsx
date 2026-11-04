
import { useCallback, useEffect, useState, useRef } from 'react'
import { D3Tree } from "@n20a/libd3tree"
import type { IContainerSize, ID3Tree } from '@n20a/libd3tree'
import '../allcss/it/BsDiagram.css'
import '@n20a/libd3tree/scoped.css';
import { IBsDiagram } from '../../shared/allinterface/it/IBsDiagram';
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks';
import { handleContainerKeyDown } from '../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { axiosInterceptor } from '../../shared/interceptors/Interceptor';
import { BS } from '../../shared/interceptors/EndPoints';
import { Label } from '../../shared/basic/label/Label';
import { ActionImage } from '../../shared/basic/actionimage/ActionImage';
import { OpenSidebar24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../appcontainer/allcommon/FnGetCssVariable';
import { createRoot } from 'react-dom/client';
import { StatusBarProvider } from '../../shared/context/contextandprovider/StatusBar';
import { FnCreateReportForPrint } from '../../shared/allcommon/generatepdf/FnCreateReportForPrint';
import { GeneratePdf } from '../../shared/generatepdf/GeneratePdf';
import { TReportLayoutJson } from '../../shared/allinterface/IGeneratePdf';

interface BsDiagramApiResponse {
    bsJson?: string;
}

interface D3NodeData {
    EntId?: string;
    EntityName?: string;
}

const BsDiagram = (bsDiagramProps: IBsDiagram) => {
    const [jsonData, setJsonData] = useState<ID3Tree>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [containerDimensions, setContainerDimensions] = useState<IContainerSize>({ width: 1200, height: 800 });
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);
    const statusBarContext = useStatusBarContext();
    const isMountedRef = useRef(true);
    const bsEntID = bsDiagramProps.selectedNode?.EntID ?? bsDiagramProps.selectedNode?.NodeEntID;

    useEffect(() => {
        const layoutContainer = document.getElementById("LayoutContainer");

        if (!layoutContainer) {
            return () => {
                isMountedRef.current = false;
            };
        }

        let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

        const resizeObserver = new ResizeObserver(() => {
            // Clear previous pending updates
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            // Wait 200ms after the last resize event
            resizeTimeout = setTimeout(() => {
                if (isMountedRef.current) {
                    setContainerDimensions({
                        width: layoutContainer.clientWidth,
                        height: layoutContainer.offsetHeight,
                    });
                }
            }, 200);
        });

        resizeObserver.observe(layoutContainer);

        return () => {
            isMountedRef.current = false;

            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (bsDiagramProps.selectedNode
            && bsDiagramProps.selectedNode.NodeEntityname
            && bsEntID) {
            setLoading(true);
            setError(null);

            // Safety timeout to clear loading state if fetch fails to call setFetchData
            const safetyTimeout = setTimeout(() => {
                if (isMountedRef.current) {
                    setLoading(false);
                    setError('Request timeout - please try again');
                }
            }, 65000); // Slightly longer than axiosInterceptor's 60s timeout

            axiosInterceptor({
                url: BS.GetBsDiagramData,
                data: {
                    bsEntID
                },
                setFetchData: async (getBsDiagramDataApiResponse: unknown) => {
                    clearTimeout(safetyTimeout);

                    try {
                        const response = getBsDiagramDataApiResponse as BsDiagramApiResponse;

                        if (response && response.bsJson) {
                            const parsed = JSON.parse(response.bsJson);
                            if (typeof parsed === "object" && isMountedRef.current) {
                                setJsonData(parsed);
                            } else if (isMountedRef.current) {
                                setError('Invalid diagram data format');
                                setJsonData(undefined);
                            }
                        } else if (isMountedRef.current) {
                            setError('No diagram data received');
                            setJsonData(undefined);
                        }
                    } catch (error) {
                        console.error('Error parsing diagram data:', error);
                        if (isMountedRef.current) {
                            setError('Failed to load diagram data');
                            setJsonData(undefined);
                        }
                    } finally {
                        if (isMountedRef.current) {
                            setLoading(false);
                        }
                    }
                }
            }, statusBarContext).catch((error) => {
                // Handle axiosInterceptor errors that don't call setFetchData
                clearTimeout(safetyTimeout);
                console.error('Fetch interceptor error:', error);
                if (isMountedRef.current) {
                    setError(error.message || 'Failed to load diagram');
                    setLoading(false);
                }
            });

            return () => {
                clearTimeout(safetyTimeout);
            };
        }

        setLoading(false);
        setJsonData(undefined);
        // statusBarContext intentionally omitted - it's from context and should be stable
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bsEntID, bsDiagramProps.selectedNode?.NodeEntityname])

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (bsDiagramProps.onRendered && jsonData) {
            timeout = setTimeout(() => {
                bsDiagramProps.onRendered?.();
            }, 1000);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [bsDiagramProps.onRendered, jsonData]);

    function handleCtrlLinkClick(nodeData: D3NodeData): void {
        if (bsDiagramProps.handleSelectDCExplorer) {
            bsDiagramProps.handleSelectDCExplorer(undefined, undefined, nodeData.EntityName, nodeData.EntId);
        }
    }


    return (
        <div
            key={bsDiagramProps.uniqueName}
            className='nz-wh-100'
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
        >
            {bsDiagramProps.headerText && <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                <div className="nz-d-flex-row nz-align-center nz-w-100">
                    <div className='nz-sub-header'>
                        <Label label={bsDiagramProps.headerText} uniqueName={`${bsDiagramProps.uniqueName}-title`} />
                    </div>
                </div>
                {bsDiagramProps.handleSidebarOpenClose && <ActionImage uniqueName={`${bsDiagramProps.uniqueName}-explorer-tree-info-ai`}
                    image={{
                        uniqueName: `${bsDiagramProps.uniqueName}-explorer-tree-info-image`,
                        source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                            fill="none"
                            strokeWidth={1} />,
                        w: 'var(--image-size-2)',
                        tooltip: "Click to view node details in sidebar",
                        type: "svg"

                    }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'}
                    handleMouse={() => {
                        bsDiagramProps.handleSidebarOpenClose?.('open')
                    }} />
                }

            </div>}
            {loading ? (
                <div className="nz-wh-100 nz-d-flex-hv-left" role="status" aria-live="polite">
                    Loading diagram...
                </div>
            ) : error ? (
                <div className="nz-wh-100 nz-d-flex-hv-left" role="alert" aria-live="assertive">
                    {error}
                </div>
            ) : jsonData ? (
                <D3Tree
                    containerDimensions={containerDimensions}
                    treeData={jsonData}
                    orientation="vertical"
                    useIcons={true}
                    handleCtrlLinkClick={handleCtrlLinkClick}
                />
            ) : (
                <div className="nz-wh-100 nz-d-flex-hv-left">
                    Diagram not found for: {bsDiagramProps.selectedNode?.Name}
                </div>
            )}
            {isReportDialogOpen && (
                <GeneratePdf
                    uniqueName={`${bsDiagramProps.uniqueName}-bs-diagram-report`}
                    isOpen={isReportDialogOpen}
                    reportJson={reportTemplateJson}
                    title="BS Diagram Report"
                    selectedNode={bsDiagramProps.selectedNode}
                    onClose={() => {
                        setIsReportDialogOpen(false);
                        setReportTemplateJson(null);
                    }}
                />
            )}
        </div>
    )
}
function RenderBsDiagramContainer(container: HTMLElement, props: IBsDiagram) {
    const root = createRoot(container);
    root.render(
        <StatusBarProvider>
            <BsDiagram {...props} />
        </StatusBarProvider>
    );
    return {
        unmount: () => root.unmount()
    };
}

export { RenderBsDiagramContainer };
export default BsDiagram

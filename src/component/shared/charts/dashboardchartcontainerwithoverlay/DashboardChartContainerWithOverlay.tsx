import { useEffect, useState } from "react"
import { handleContainerKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown';
import '../../allcss/charts/DashboardChartContainerWithOverlay.css'
import { axiosInterceptor } from "../../interceptors/Interceptor"
import { EM } from "../../interceptors/EndPoints"
import { useStatusBarContext } from "../../context/hooks/StatusBarHooks"
import { Close24x24 } from "@n20a/libicon"
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable"
import { Splitter, SplitterPanel } from "primereact/splitter"
import { DashboardChart } from "../../../features/home/dashboardchartscontainer/DashboardChart"
import { ActionImage } from "../../basic/actionimage/ActionImage"
import { OverlayTab } from "../../basic/overlaytab/OverlayTab"
import { OpenSidebar24x24 } from "@n20a/libicon"
import { AIContainer } from "../../aicontainer/AIContainer"
import { useSessionContext } from "../../context/hooks/SessionHooks"
import { useSelectedNodeContext } from "../../context/hooks/SelectedNodeHooks"
import { DELIMITER } from "../../alldefaultprops/basic/DefaultPropsChekedListBoxControl"
import { IDashboardChartContainerWithOverlay } from "../../allinterface/charts/IDashboardChartContainerWithOverlay"
import { Label } from "../../basic/label/Label"
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely"

const DashboardChartContainerWithOverlay = (props: IDashboardChartContainerWithOverlay) => {
    const [showChart, setShowChart] = useState<boolean>(false);
    const [displayMode, setDisplayMode] = useState<"Chart" | "Ask">("Chart");
    const statusBarContext = useStatusBarContext();
    const [selectedNodeAllProperties, setSelectedNodeAllProperties] = useState<object>();
    const [isAskLoading, setIsAskLoading] = useState<boolean>(false);

    const sessionContext = useSessionContext();
    const SelectedNodeContext = useSelectedNodeContext();

    // Stable keys avoid re-fetch when selectedNode object reference changes.
    const selectedNodeEntId = props.selectedNode?.NodeEntID;
    const selectedNodeEntityName = props.selectedNode?.NodeEntityname;

    // Fetch Ask properties only after user opens Ask tab.
    useEffect(() => {
        if (!(displayMode === "Ask" && showChart)) {
            return;
        }
        if (!selectedNodeEntId || !selectedNodeEntityName) {
            setSelectedNodeAllProperties({});
            setIsAskLoading(false);
            return;
        }

        const abortController = new AbortController();
        setIsAskLoading(true);
        setSelectedNodeAllProperties(undefined);

        const handleApiCallForAskInfo = async () => {
            axiosInterceptor({
                url: EM.GetTableVsProperty,
                data: {
                    entityName: selectedNodeEntityName
                },
                signal: abortController.signal,
                setFetchData: (getTableVsPropertyApiResponse: unknown, status?: string) => {
                    if (abortController.signal.aborted) {
                        return;
                    }
                    if (getTableVsPropertyApiResponse && status === "200" && Array.isArray(getTableVsPropertyApiResponse) && getTableVsPropertyApiResponse.length > 0) {
                        let oneToOneTables: string[] = [];
                        for (let index = 0; index < getTableVsPropertyApiResponse.length; index++) {
                            const element = getTableVsPropertyApiResponse[index];
                            if (!element.isOneToManyRelation)
                                oneToOneTables.push(element.tableName)
                        }
                        if (oneToOneTables.length > 0 && selectedNodeEntId) {
                            axiosInterceptor({
                                url: EM.GetAllTablesRecord,
                                data: {
                                    entID: selectedNodeEntId,
                                    tableNames: oneToOneTables.join(DELIMITER.separator),
                                },
                                signal: abortController.signal,
                                setFetchData: (response: unknown, status?: string) => {
                                    if (abortController.signal.aborted) {
                                        return;
                                    }
                                    if (status === "200" && response && typeof response === "object" && 'jsonStringOutput' in response) {
                                        if (response.jsonStringOutput) {
                                            const jsonData = FnParseJsonSafely(response.jsonStringOutput as string);
                                            const result: Record<string, string | number | boolean | undefined> = {};
                                            if (!Array.isArray(jsonData?.AllTables)) {
                                                setIsAskLoading(false);
                                                return;
                                            }
                                            jsonData.AllTables.forEach((table: any) => {
                                                if (!Array.isArray(table?.TableData)) return;
                                                table.TableData.forEach((item: any) => {
                                                    if (item?.Name !== undefined) {
                                                        result[item.Name] = item.Value;
                                                    }
                                                });
                                            });
                                            SelectedNodeContext.setSelectedNodeAllProperties(result);
                                            setSelectedNodeAllProperties(result)
                                        }
                                        else {
                                            setSelectedNodeAllProperties({})
                                        }
                                    }
                                    else {
                                        setSelectedNodeAllProperties({})
                                    }
                                    setIsAskLoading(false);
                                }
                            }, statusBarContext);
                        }
                        else {
                            setSelectedNodeAllProperties({})
                            setIsAskLoading(false);
                        }
                    }
                    else {
                        setSelectedNodeAllProperties({})
                        setIsAskLoading(false);
                    }
                }
            }, statusBarContext)
        }
        handleApiCallForAskInfo();
        return () => {
            abortController.abort();
            setSelectedNodeAllProperties(undefined)
            setIsAskLoading(false);
        }
    }, [displayMode, showChart, selectedNodeEntId, selectedNodeEntityName])

    const handleDisplayChart = (NodeType: string, display: boolean) => {
        const className = ".nz-chart-and-ai-container";
        const chartDiv = document.querySelector(
            `${className} .p-splitter-gutter`
        ) as HTMLElement;
        const chartPane = document.querySelector(
            `${className} .nz-chart-with-sub-header-pane`
        ) as HTMLElement;
        if (chartPane && chartDiv) {
            const baseClass = "nz-char-and-ask-preview";
            if (display) {
                chartPane.classList.add(baseClass, "nz-chart-hidden");
                chartDiv.classList.add(baseClass, "nz-chart-hidden");
            } else {
                chartPane.classList.remove(baseClass, "nz-chart-hidden");
                chartDiv.classList.remove(baseClass, "nz-chart-hidden");
            }
        }
    };

    useEffect(() => {
        setShowChart(false)
        if (props.selectedNode.NodeType) {
            handleDisplayChart(props.selectedNode.NodeType, true)
        }
    }, [props.selectedNode, props.featureId])

    function handleClickInformation(event: any, actionCode?: string | undefined, payload?: any): void {
        props.handleSidebarOpenClose?.('open')
    }

    let tabsObj = [
        {
            "label": "Ask",
            "tooltip": "Click to Ask"
        }
    ]

    const handleSelectedTabs = (tab: string[]) => {
        if (tab.length) {
            if (tab[0] === "Chart") {
                setDisplayMode("Chart")
                setShowChart(true)
                if (props.selectedNode && props.selectedNode.NodeType) {
                    handleDisplayChart(props.selectedNode.NodeType, false)
                }
            } else if (tab[0] === "Ask") {
                setDisplayMode("Ask")
                setShowChart(true)
                if (props.selectedNode && props.selectedNode.NodeType) {
                    handleDisplayChart(props.selectedNode.NodeType, false)
                }
            }
        } else {
            setShowChart(false)
            if (props.selectedNode && props.selectedNode.NodeType)
                handleDisplayChart(props.selectedNode.NodeType, true)
        }
    }

    return (
        <div className={`nz-chart-and-ai-container`} tabIndex={1} onKeyDown={handleContainerKeyDown}>
            {!props.hideHeader && (
                <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                    <div className="nz-d-flex-row nz-align-center nz-w-100">
                        {(props.selectedNode.NodeType === "Device") ? <OverlayTab
                            uniqueName={`${props.uniqueName}-replacement-overlay`}
                            ShowOnlyIcon={true}
                            tabs={tabsObj && tabsObj.map((t, index) => ({
                                uniqueName: `${props.uniqueName}-overlay-tab-${index}`,
                                label: {
                                    uniqueName: `${props.uniqueName}-overlay-tab-${index}-label`,
                                    label: t.label,
                                    tooltip: t.tooltip
                                },
                                w: "auto",
                                h: "calc(var(--node_height) - var(--spacing-1))",
                                actionCode: t.label,
                                handleMouse: function (event: any, actionCode?: string): void {
                                }
                            }))}
                            allowUnSelect={true}
                            selectedTabName={""}
                            tabAlignment={"horizontal"}
                            headerText={`${props.selectedNode.NodeType}: ${props.selectedNode.Name}${props.selectedNode.EQID ? " (" + props.selectedNode.EQID + ")" : ""}`}
                            useContainer={false}
                            handleSelectedTab={handleSelectedTabs}
                        /> : <Label uniqueName={`${props.uniqueName}-subgroup-header`} label={`${props.selectedNode.NodeType}: ${props.selectedNode.Name}${props.selectedNode.EQID ? " (" + props.selectedNode.EQID + ")" : ""}`} />}
                    </div>
                    {!props.hideSideBarCloseBtn && <ActionImage uniqueName={`${props.uniqueName}-explorer-tree-info-ai`}
                        image={{
                            uniqueName: `${props.uniqueName}-explorer-tree-info-image`,
                            source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                                fill="none"
                                strokeWidth={1} />,
                            w: 'var(--image-size-2)',
                            tooltip: "Click to view node details in sidebar",
                            type: "svg"
                        }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'} handleMouse={handleClickInformation} />
                    }
                </div>
            )}
            <Splitter tabIndex={-1} className='nz-w-100 nz-chart-and-ai-splitter' >
                <SplitterPanel tabIndex={-1} size={50} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-left-pane" >
                    <div className="nz-chart-ovelay-container">
                        {props.selectedNode && <DashboardChart
                            selectedNode={props.selectedNode} isDashboard={false}
                            purpose={props.purpose}
                            hideHeader={true} title='Dashboardchart' uniqueName={props.uniqueName} featureId={props.featureId} outputFormat={"jsx"} />}
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={50} minSize={10} className={`nz-d-flex-column nz-align-center nz-right-pane nz-chart-with-sub-header-pane ${props.selectedNode.NodeType === "Mountedchart-and-ask" ? 'nz-chart-mounted-chart-and-ask' : 'nz-chart-chart-and-ask-preview'} nz-chart-hidden`}>
                    <div className="nz-chart-and-ask-chart-container-div">
                        <div className="nz-sub-header">
                            {`${displayMode} for ${props.selectedNode.Name}`}
                            <ActionImage
                                image={{
                                    uniqueName: "cancel",
                                    source: <Close24x24
                                        size={FnGetCssVariable('--image-size-2')}
                                        fill='none'
                                        strokeWidth={1} />,
                                    type: "svg",
                                    w: "var(--image-size-2)",
                                    h: "var(--image-size-2)",
                                    tooltip: "Close Ask"
                                }}
                                uniqueName='cancelIcon'
                                actionCode='cancel'
                                w='var(--node_height)'
                                handleMouse={() => {
                                    setShowChart(false)
                                    if (props.selectedNode.NodeType)
                                        handleDisplayChart(props.selectedNode.NodeType, true)
                                }}
                            />
                        </div>
                        {displayMode === "Chart" && showChart && <DashboardChart
                            hideHeader={true}
                            title='Dashboardchart'
                            uniqueName={props.uniqueName}
                            featureId={props.featureId}
                            outputFormat={"jsx"}
                            displayPerRow={1}
                            isDashboard={false}
                            selectedNode={props.selectedNode}
                            parentClassName={props.selectedNode.NodeType === "Mountedchart-and-ask" ? 'nz-chart-mounted-chart-and-ask' : 'nz-chart-chart-and-ask-preview'}
                        />}
                        {displayMode === "Ask" && showChart && props.selectedNode && (
                            <div className='nz-site-ask-componet'>
                                {isAskLoading || !selectedNodeAllProperties ? (
                                    <div className="nz-w-100 nz-h-100 nz-d-flex-hv-left">Waiting...</div>
                                ) : (
                                    <AIContainer uniqueName={`${props.uniqueName}-fqa-info`}
                                        selectedNode={props.selectedNode}
                                        sessionVars={sessionContext.SessionList}
                                        featureId={props.featureId}
                                        selectedAllProperties={selectedNodeAllProperties} />
                                )}
                            </div>
                        )}
                    </div>
                </SplitterPanel>
            </Splitter>
        </div>
    )
}
export default DashboardChartContainerWithOverlay

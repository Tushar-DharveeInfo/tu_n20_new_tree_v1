
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../../allcss/deviceview/ViewContainer.css'
import { IViewContainer, IViewImageItem } from '../../allinterface/deviceview/IViewContainer';
import { IView } from '../../allinterface/deviceview/IView';
import { DevicePreview } from '../devicepreview/DevicePreview';
import { ITab } from '../../allinterface/deviceview/ITab';
import { ResponsiveDeviceView } from '../responsivedeviceview/ResponsiveDeviceView';
import { ThreeDView } from '../threedview/ThreeDView';
import { OverlayTab } from '../../basic/overlaytab/OverlayTab';
import { MountedRack } from '../mountedrack/MountedRack';
import { DashboardChart } from '../../../features/home/dashboardchartscontainer/DashboardChart';
import { DELIMITER } from '../../alldefaultprops/tablegrid/DefaultPropsOneToManyGrid';
import { axiosInterceptor } from '../../interceptors/Interceptor';
import { EM } from '../../interceptors/EndPoints';
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks';
import { AIContainer } from '../../aicontainer/AIContainer';
import { useSessionContext } from '../../context/hooks/SessionHooks';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { FEnums } from '../../../constants/Feature';
import { FnCreateReportForPrint } from '../../allcommon/generatepdf/FnCreateReportForPrint';
import { GeneratePdf } from '../../generatepdf/GeneratePdf';
import { TReportLayoutJson } from '../../allinterface/IGeneratePdf';

const CHART_TABS: ITab[] = [
	{
		label: "Chart",
		tooltip: "Click to view Chart"
	}
];

const PRINT_TABS: ITab[] = [
	{
		label: "Print",
		tooltip: "Click to Print",
	}
];

const CHART_AND_ASK_TABS: ITab[] = [
	...CHART_TABS,
	{
		label: "Ask",
		tooltip: "Click to Ask"
	}
];

const createVirtualViewItem = (label: string): IViewImageItem => ({
	uniqueName: label,
	label,
	tabName: label,
	image: {
		uniqueName: label,
		source: label,
		h: "100%",
		w: "100%",
		type: "svg"
	},
	className: label
});

const createSvgViewItem = (view: IView, svg: string, fallbackUniqueName: string): IViewImageItem => {
	const uniqueName = view?.uniqueName ? view.uniqueName : fallbackUniqueName;

	return {
		uniqueName,
		label: view.viewTitle,
		tabName: view.tab.label,
		image: {
			uniqueName,
			source: svg,
			h: "100%",
			w: "100%",
			type: "svg"
		},
		className: view.customClassName
	};
};

const getSelectedDataKey = (selectedTabData: Array<ITab | IView | IViewImageItem> | IViewImageItem[] | undefined) => {
	if (!selectedTabData) return '';

	return selectedTabData.map((item) => {
		if ('image' in item) {
			return `${item.tabName}|${item.uniqueName}|${item.image.source}`;
		}

		if ('tab' in item) {
			return `${item.tab.label}|${item.uniqueName}|${item.svg}`;
		}

		return item.label;
	}).join('|');
}

const resolveDeviceViewSide = (tabName?: string): "Front" | "Rear" | null => {
	const normalized = String(tabName ?? "").trim().toLowerCase();
	if (normalized.includes("rear")) {
		return "Rear";
	}
	if (normalized.includes("front")) {
		return "Front";
	}
	return null;
};

const ViewContainer = (props: IViewContainer) => {
	const [selectedTabName, setSelectedTabName] = useState<string>('')
	const [selectedNodeAllProperties, setSelectedNodeAllProperties] = useState<object>();
	const [isAskLoading, setIsAskLoading] = useState(false);
	const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
	const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);
	const handleSelectedTabChangesRef = useRef(props.handleSelectedTabChanges);
	const lastNotifiedTabRef = useRef('');
	const lastSelectedNodeKeyRef = useRef<string | null>(null);
	const sessionContext = useSessionContext();
	const statusBarContext = useStatusBarContext();

	useEffect(() => {
		handleSelectedTabChangesRef.current = props.handleSelectedTabChanges;
	}, [props.handleSelectedTabChanges])
	const isCabling = [
		FEnums.ReviewPowerCabling.toString(),
		FEnums.PowerTrace.toString(),
		FEnums.PowerNavigate.toString(),
		FEnums.EditPowerCabling.toString(),
		FEnums.ReviewNetworkCabling.toString(),
		FEnums.NetworkTrace.toString(),
		FEnums.NetworkNavigate.toString(),
		FEnums.EditNetworkCabling.toString(),
	].includes(props.featureId);

	const {
		tabsObj,
		SvgImageObj,
		defaultSelectedTab,
		defultSelectedData
	} = useMemo(() => {
		// No view data means there is nothing to render or select.
		if (!props.views) {
			return {
				tabsObj: undefined,
				SvgImageObj: undefined,
				defaultSelectedTab: '',
				defultSelectedData: [] as Array<ITab | IView>
			};
		}

		const tabs: ITab[] = []
		const deviceView: IViewImageItem[] = []
		let defaultSelectedTab = ''
		const defultSelectedData: Array<ITab | IView> = []
		const hasMultipleViews = props.views.length > 1;

		for (let index = 0; index < props.views.length; index++) {

			const element = props.views[index];
			const isFirstView = index === 0;
			let svg = element?.svg ? element.svg : ''

			if (props.isEncrypted) {
				svg = element.svg ? window && window.atob(element.svg) : ''
			}

			// Add the 3D tab before the first real SVG view when multiple views exist.
			if (isFirstView && !props.hideTreeDView && hasMultipleViews) {
				const threeDTab: ITab = {
					label: "3D",
					tooltip: "Click to view 3d view",
				}
				deviceView.push(createVirtualViewItem("3D"))
				tabs.push(threeDTab)
				defaultSelectedTab = "3D"
				defultSelectedData.push(threeDTab)
			} else if (isFirstView) {
				defaultSelectedTab = element.tab.label
				defultSelectedData.push(element)
			}

			// Rack is also a view, so it gets a tab and image item but no SVG payload.
			if (isFirstView && props.MountedRackProps) {
				const RackTab: ITab = {
					label: "Rack",
					tooltip: "Click to view  Rack",
				}

				deviceView.push(createVirtualViewItem("Rack"))
				defaultSelectedTab = RackTab.label
				defultSelectedData.push(RackTab)
				tabs.push(RackTab)
			}

			// Add the actual SVG view from the API/config.
			deviceView.push(createSvgViewItem(element, svg, props.uniqueName))
			tabs.push(element.tab)
		}

		// Device nodes support both Chart and Ask; other node types only show Chart.
		if (!props.hideChartAndAsk) {
			let analyticsTabs =
				props.selectedNode?.treetype === "Device"
					? CHART_AND_ASK_TABS
					: CHART_TABS;

			if (props.selectedNode?.NodeEntityname?.toLowerCase().includes("cable") || isCabling || props.hideChart) {
				analyticsTabs = analyticsTabs.filter(
					(tab) => tab.label.toLowerCase() !== "chart"
				);
			}

			tabs.push(...analyticsTabs, ...PRINT_TABS);
		}

		// Keep single-tab headers hidden only when the caller explicitly asks for that behavior.
		const shouldShowTabs = tabs.length > 1 || !props.hideSignalTabHeader;
		const nextTabsObj = shouldShowTabs ? tabs : undefined;

		return {
			tabsObj: nextTabsObj,
			SvgImageObj: deviceView,
			defaultSelectedTab,
			defultSelectedData
		};
	}, [props.MountedRackProps, props.hideChart, props.hideChartAndAsk, props.hideSignalTabHeader, props.hideTreeDView, props.isEncrypted, props.selectedNode?.treetype, props.uniqueName, props.views])

	useEffect(() => {
		if (!props.views) return;

		const currentNodeKey = props.selectedNode
			? String(props.selectedNode.NodeEntID || props.selectedNode.key || (props.selectedNode as any)?.entID || props.selectedNode.Name || '')
			: '';
		const isInitialMount = lastSelectedNodeKeyRef.current === null;
		const nodeChanged = !isInitialMount && lastSelectedNodeKeyRef.current !== currentNodeKey;
		lastSelectedNodeKeyRef.current = currentNodeKey;

		const is3dTabSelected = (name?: string) => {
			const n = name?.toLowerCase();
			return n === '3d' || n === '3d view';
		};
		const isChartTabSelected = (name?: string) => name?.toLowerCase() === 'chart';
		const isInvalidTab = (name?: string) => {
			if (!name) return true;
			const is3d = is3dTabSelected(name);
			const isChart = isChartTabSelected(name);
			return Boolean(
				(props.hideTreeDView && is3d) ||
				((props.hideChart || props.hideChartAndAsk) && isChart)
			);
		};

		// 1. Controlled mode: caller passed non-empty selectedTabName
		if (props.selectedTabName && props.selectedTabName.trim() !== '') {
			const effectiveSelectedTab = !isInvalidTab(props.selectedTabName)
				? props.selectedTabName
				: defaultSelectedTab;

			if (props.viewType === 'mounted') {
				const data = SvgImageObj && SvgImageObj.length > 1
					? SvgImageObj.filter((item) => item.tabName === effectiveSelectedTab)
					: SvgImageObj;
				const notifyKey = `${effectiveSelectedTab}|${getSelectedDataKey(data)}`;
				if (lastNotifiedTabRef.current !== notifyKey) {
					lastNotifiedTabRef.current = notifyKey;
					handleSelectedTabChangesRef.current?.(effectiveSelectedTab, data);
				}
			}
			setSelectedTabName((currentTabName) =>
				currentTabName === effectiveSelectedTab ? currentTabName : (effectiveSelectedTab ?? '')
			);
			return;
		}

		// 2. Uncontrolled mode: tab is managed locally in ViewContainer
		setSelectedTabName((currentTabName) => {
			let nextTab = currentTabName;

			if (nodeChanged || !nextTab) {
				nextTab = defaultSelectedTab;
			} else if (isInvalidTab(nextTab)) {
				nextTab = defaultSelectedTab;
			} else if (tabsObj && tabsObj.length > 0 && !tabsObj.some((t) => t.label.toLowerCase() === nextTab.toLowerCase())) {
				nextTab = defaultSelectedTab;
			}

			if (props.viewType === 'mounted') {
				const data = SvgImageObj && SvgImageObj.length > 1
					? SvgImageObj.filter((item) => item.tabName === nextTab)
					: SvgImageObj;
				const notifyKey = `${nextTab}|${getSelectedDataKey(data)}`;
				if (lastNotifiedTabRef.current !== notifyKey) {
					lastNotifiedTabRef.current = notifyKey;
					handleSelectedTabChangesRef.current?.(nextTab, data);
				}
			}

			return nextTab;
		});

	}, [SvgImageObj, defaultSelectedTab, defultSelectedData, props.hideChart, props.hideChartAndAsk, props.hideTreeDView, props.selectedNode, props.selectedTabName, props.viewType, props.views, tabsObj])

	const getDeviceViewSideForPrint = useCallback((): "Front" | "Rear" => {
		const fromSelected = resolveDeviceViewSide(selectedTabName);
		if (fromSelected) {
			return fromSelected;
		}

		for (const view of props.views ?? []) {
			const side = resolveDeviceViewSide(view.tab.label);
			if (side) {
				return side;
			}
		}

		return "Front";
	}, [props.views, selectedTabName]);

	const handlePrintReport = useCallback(async () => {
		statusBarContext.setIsLoading(true)
		const diplayDeviceView = getDeviceViewSideForPrint();
		const result = await FnCreateReportForPrint(
			"DeviceView",
			statusBarContext,
			undefined,
			diplayDeviceView
		);

		if (result?.template) {
			setReportTemplateJson(result.template);
			setIsReportDialogOpen(true);
			statusBarContext.setIsLoading(false)
			return;
		}
		statusBarContext.setIsLoading(false)
		statusBarContext?.setUserActionData?.("Device view report template not found.");
	}, [getDeviceViewSideForPrint, statusBarContext]);

	const handleMouse = useCallback((actionCode: string[]) => {
		if (actionCode && actionCode[0].toLowerCase() === "print") {
			void handlePrintReport();
			return;
		}
		setSelectedTabName(actionCode[0])

		if (props.viewType === 'mounted') {
			const selectedTabObj = SvgImageObj?.filter((item) => item.tabName === actionCode[0])
			handleSelectedTabChangesRef.current?.(actionCode[0], selectedTabObj)
		}
	}, [SvgImageObj, handlePrintReport, props.viewType])

	const handleApiCallForDeviceInfo = useCallback(async () => {
		if (props.selectedNode && props.selectedNode.NodeEntID && props.selectedNode.NodeEntityname) {
			setIsAskLoading(true);
			axiosInterceptor({
				url: EM.GetTableVsProperty,
				data: {
					entityName: props.selectedNode.NodeEntityname
				},
				allowShowLoader: true,
				setFetchData: (getTableVsPropertyApiResponse: unknown, status?: string) => {
					if (getTableVsPropertyApiResponse && status === "200" && Array.isArray(getTableVsPropertyApiResponse) && getTableVsPropertyApiResponse.length > 0) {
						let oneToOneTables: string[] = [];
						for (let index = 0; index < getTableVsPropertyApiResponse.length; index++) {
							const element = getTableVsPropertyApiResponse[index];
							if (!element.isOneToManyRelation)
								oneToOneTables.push(element.tableName)
						}

						if (oneToOneTables.length > 0 && props.selectedNode && props.selectedNode.NodeEntID) {
							axiosInterceptor({
								url: EM.GetAllTablesRecord,
								data: {
									entID: props.selectedNode.NodeEntID,
									tableNames: oneToOneTables.join(DELIMITER.separator),
								},
								allowShowLoader: true,
								setFetchData: (response: unknown, status?: string) => {

									if (status === "200" && response && typeof response === "object" && 'jsonStringOutput' in response) {
										if (response.jsonStringOutput) {
											const jsonData = FnParseJsonSafely(response.jsonStringOutput as string);
											const result: Record<string, any> = {};

											if (!Array.isArray(jsonData?.AllTables)) {
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
		} else {
			setSelectedNodeAllProperties({})
			setIsAskLoading(false);
		}
	}, [props.selectedNode])

	useEffect(() => {
		if (selectedTabName === "Ask") {
			handleApiCallForDeviceInfo();
		}
	}, [handleApiCallForDeviceInfo, selectedTabName])
	const isChartSelected = selectedTabName?.trim().toLowerCase() === "chart";
	const isAskSelected = selectedTabName?.trim().toLowerCase() === "ask";
	const isRackSelected = selectedTabName?.trim().toLowerCase() === "rack";
	const isThreeDSelected = selectedTabName?.trim().toLowerCase() === "3d" || selectedTabName?.trim().toLowerCase() === "3d view";
	const isStandaloneTab = isRackSelected || isChartSelected || isAskSelected;
	const visibleSvgImageObj = SvgImageObj?.filter((item) => item.tabName?.toLowerCase() !== "rack");
	const shouldRenderSvgViews = visibleSvgImageObj && visibleSvgImageObj.length > 0
		&& (selectedTabName || visibleSvgImageObj.length === 1)
		&& !isStandaloneTab
		&& (!isThreeDSelected || Boolean(props.SvgParentJSONForThreeD));
	const shouldRenderRack = isRackSelected && Boolean(props.MountedRackProps);
	const shouldRenderChart = isChartSelected && Boolean(props.selectedNode);
	const shouldRenderAsk = isAskSelected && Boolean(props.selectedNode);
	return (
		<div className='nz-two-d-view-container'>
			{props.title && <div className='nz-sub-header '>
				{tabsObj && tabsObj?.length > 1 ? <OverlayTab
					uniqueName={`${props.uniqueName}-replacement-overlay`}
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
						handleMouse: function (): void {
						}
					}))}
					ShowOnlyIcon={true}
					disableSelectionKey={['Print']}
					selectedTabName={selectedTabName ?? ""}
					tabAlignment={"horizontal"}
					headerText={props.title}
					useContainer={false}
					handleSelectedTab={handleMouse}

				/> : props.title}
			</div>}

			<div className={`nz-svg-container ${visibleSvgImageObj && visibleSvgImageObj.length === 1 ? "nz-single-svg" : ""}`}>
				{shouldRenderSvgViews && visibleSvgImageObj?.map((item) => {
					return <div className={`nz-svg-device-preview ${item.tabName === selectedTabName || visibleSvgImageObj.length === 1 ? "" : "nz-hidden"}`}
						key={item.uniqueName || item.tabName} >

						{/* 3D View */}
						{item.tabName === "3D" && selectedTabName === "3D" && props.selectedNode && props.SvgParentJSONForThreeD && (
							<div className='nz-3d-view'>
								<ThreeDView
									ParentJSON={props.SvgParentJSONForThreeD}
									label={props.viewLabel ?? item.label}
									handleMouse={(event, entID) => props.handleMouse?.(event, entID)}
								/>
							</div>
						)}
						{/* Responsive SVG View */}
						{item.tabName !== "3D" && props.responsive && props.selectedNode && (
							<ResponsiveDeviceView
								{...item}
								key={item.uniqueName}
								selectedTabName={selectedTabName}
								imageSource={item.image.source as string}
								label={props.viewLabel ?? item.label}
								allowZoom={props.disableZoom}
								outputFormat="JSX"
								selectedDeviceViewId={props.selectedDeviceViewId}
								selectedNode={props.selectedNode}
								handleMouse={(event, actionCode) =>
									props.handleMouse?.(event, actionCode)
								}
								handleMouseDoubleClick={(event, actionCode) =>
									props.handleMouseDoubleClick?.(event, actionCode)
								}
							/>
						)}

						{/* Default SVG Preview */}
						{item.tabName !== "3D" && !props.responsive && (
							<DevicePreview
								{...item}
								label={props.viewLabel ?? item.label}
								allowZoom={props.disableZoom}
								handleMouse={(event) => props.handleMouse?.(event, props.entID)}
							/>
						)}

					</div>
				})}

				{/* Rack, Chart and Ask rendering */}
				{shouldRenderRack && props.MountedRackProps && (
					<div className='nz-Rack-view'>
						<MountedRack {...props.MountedRackProps} />
					</div>
				)}
				{shouldRenderChart && props.selectedNode && (
					<div className="nz-chart-view-wrapper" style={{ width: '100%', height: '100%' }}>
						<DashboardChart
							hideHeader={true}
							title='Dashboardchart'
							uniqueName={props.uniqueName}
							featureId={props.featureId ?? ""}
							outputFormat={"jsx"}
							displayPerRow={1}
							isDashboard={false}
							selectedNode={props.selectedNode}
							parentClassName={props.selectedNode?.NodeType === "MountedDevice" ? 'nz-chart-mounted-device' : 'nz-chart-device-preview'}
							handleFinishApiCall={() => {
							}} />
					</div>
				)}
				{
					shouldRenderAsk && <div className='nz-Floor-ask-componet'>
						{isAskLoading || !selectedNodeAllProperties ? (
							<div className="nz-w-100 nz-h-100 nz-d-flex-hv-left">Loading...</div>
						) : (
							<AIContainer uniqueName={`${props.uniqueName}-fqa-info`}
								selectedNode={props.selectedNode}
								featureId={props.featureId ?? ""}
								sessionVars={sessionContext.SessionList}
								selectedAllProperties={selectedNodeAllProperties} />
						)}
					</div>
				}
			</div>
			{isReportDialogOpen && <GeneratePdf
				uniqueName={`${props.uniqueName}-device-view-report`}
				isOpen={isReportDialogOpen}
				reportJson={reportTemplateJson}
				title="Device View Report"
				selectedNode={props.selectedNode}
				onClose={() => {
					setIsReportDialogOpen(false);
					setReportTemplateJson(null);
				}}
			/>}
		</div>
	)
}

export { ViewContainer }

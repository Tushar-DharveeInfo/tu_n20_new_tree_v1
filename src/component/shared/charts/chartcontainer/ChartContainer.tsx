
import { type JSX, useEffect, useState } from 'react'
import { AgCharts } from 'ag-charts-community'
import { AreaChart, BarOrLineChart, ChartDefault, DialChart, MultiBarChart, NumberChart, PieChart, RadialGaugeChart } from './Charts';
import { Download24x24, Excel24x24, Fullscreen24x24, Print24x24, Printer24x24 } from '@n20a/libicon';
import type { IChartContainer, IChartTypographyProps, ILegendLabel } from '../../allinterface/charts/IChartContainer';
import '../../allcss/charts/ChartContainer.css';

/** Safely convert ChartData.legend into ILegendLabel. */
const toLegendLabel = (legend: unknown): ILegendLabel | undefined => {
    if (!legend || typeof legend !== 'object') {
        return undefined;
    }
    const value = legend as Record<string, unknown>;
    if (typeof value.label !== 'string') {
        return undefined;
    }
    return {
        label: value.label,
        color: typeof value.color === 'string' ? value.color : undefined,
        fontWeight: typeof value.fontWeight === 'string' ? value.fontWeight : undefined,
        fontSize: typeof value.fontSize === 'string' ? value.fontSize : undefined,
    };
};

/** Read font sizes from ChartData first, then fall back to series[0]. */
const getChartTypographyProps = (chartRow: Record<string, unknown>): IChartTypographyProps => {
    const seriesList = Array.isArray(chartRow.series) ? chartRow.series : [];
    const seriesItem = (seriesList[0] ?? {}) as Record<string, unknown>;
    const pickNumber = (key: keyof IChartTypographyProps) =>
        (chartRow[key] ?? seriesItem[key]) as number | undefined;
    const pickString = (key: keyof IChartTypographyProps) =>
        (chartRow[key] ?? seriesItem[key]) as string | undefined;

    return {
        titleFontSize: pickNumber('titleFontSize'),
        subtitleFontSize: pickNumber('subtitleFontSize'),
        legendFontSize: pickNumber('legendFontSize'),
        labelFontSize: pickNumber('labelFontSize'),
        labelColor: pickString('labelColor'),
        axisLabelFontSize: pickNumber('axisLabelFontSize'),
        axisTitleFontSize: pickNumber('axisTitleFontSize'),
    };
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const response = await fetch(dataUrl);
    if (!response.ok) {
        throw new Error('Failed to convert chart image data URL to blob');
    }
    return response.blob();
};

/**
 * Waits for the AG Charts instance behind `.chart-{uniqueName}`, skips animation,
 * and resolves after the chart has fully rendered series/data.
 */
const waitForReadyAgChart = async (
    uniqueName: string,
    isCancelled: () => boolean,
    maxAttempts = 80,
    intervalMs = 100,
) => {
    const selector = `.chart-${uniqueName}`;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (isCancelled()) {
            return null;
        }

        const host = document.querySelector(selector) as HTMLElement | null;
        const instance = host ? AgCharts.getInstance(host) : undefined;

        if (instance) {
            const options = instance.getOptions() as {
                series?: unknown[];
                data?: unknown[];
            };
            const hasSeries = Array.isArray(options.series) && options.series.length > 0;
            const hasData = Array.isArray(options.data) && options.data.length > 0;

            // Series config is enough to proceed; empty data still exports a valid empty chart.
            if (hasSeries || hasData) {
                instance.skipAnimations();
                await instance.waitForUpdate();
                if (isCancelled()) {
                    return null;
                }
                // One extra frame after waitForUpdate for final canvas flush.
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
                if (isCancelled()) {
                    return null;
                }
                return instance;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return null;
};

const ChartContainer = (chartsProps: IChartContainer) => {
    const [visibleCharts, setVisibleCharts] = useState<JSX.Element>();
    const [showPanel, setShowPanel] = useState(false);
    const isImageExport =
        chartsProps.outputFormat === 'png' || chartsProps.outputFormat === 'svg';

    // Build chart JSX when ChartData or theme changes; skip render when outputFormat is "data".
    useEffect(() => {
        if (chartsProps.ChartData) {
            try {
                if (chartsProps.outputFormat === "data") {
                    chartsProps.SaveAsDataset?.(chartsProps.ChartData)
                } else {
                    const chartData = chartsProps.ChartData as Record<string, any>;
                    const chart = prepareCardChart(chartData, chartsProps.chartTheme);
                    setVisibleCharts(chart);
                }
            } catch (error) {
                console.error('Error rendering chart:', error);
                setVisibleCharts(undefined);
            }
        }

    }, [chartsProps.ChartData, chartsProps.chartTheme, chartsProps.outputFormat]);

    // Capture PNG/SVG as blob memory URLs after AG Charts reports a finished update.
    useEffect(() => {
        if (!isImageExport || !visibleCharts) {
            return;
        }

        let cancelled = false;
        let memoryUrl: string | null = null;
        let handedOffMemoryUrl = false;

        const exportChartImage = async () => {
            try {
                const instance = await waitForReadyAgChart(
                    chartsProps.uniqueName,
                    () => cancelled,
                );

                if (cancelled) {
                    return;
                }

                let pngDataUrl = "";

                if (instance) {
                    pngDataUrl = await instance.getImageDataURL({
                        width: 1800,
                        height: 900,
                    });
                } else {
                    console.warn(`AG Charts instance not ready for chart: ${chartsProps.uniqueName}, checking canvas/svg fallback`);
                    const host = document.querySelector(`.chart-${chartsProps.uniqueName}`)
                        ?? document.querySelector(`[class*="${chartsProps.uniqueName}"]`)
                        ?? document.querySelector('.nz-chart-memory-url');

                    const canvas = host?.querySelector('canvas') as HTMLCanvasElement | null;
                    if (canvas && typeof canvas.toDataURL === "function") {
                        pngDataUrl = canvas.toDataURL('image/png');
                    } else {
                        const svgEl = host?.querySelector('svg') as SVGSVGElement | null;
                        if (svgEl) {
                            const serializer = new XMLSerializer();
                            const svgStr = serializer.serializeToString(svgEl);
                            const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                            memoryUrl = URL.createObjectURL(svgBlob);
                            handedOffMemoryUrl = true;
                            chartsProps.SaveAs?.({ dataURL: memoryUrl });
                            return;
                        }
                    }
                }

                if (cancelled || !pngDataUrl) {
                    return;
                }

                if (chartsProps.outputFormat === 'svg') {
                    const svg = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="1800" height="900">
                            <image href="${pngDataUrl}" width="1800" height="900" />
                        </svg>
                    `;
                    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                    memoryUrl = URL.createObjectURL(svgBlob);
                } else {
                    const pngBlob = await dataUrlToBlob(pngDataUrl);
                    if (cancelled) {
                        return;
                    }
                    memoryUrl = URL.createObjectURL(pngBlob);
                }

                if (cancelled) {
                    if (memoryUrl) {
                        URL.revokeObjectURL(memoryUrl);
                        memoryUrl = null;
                    }
                    return;
                }

                // Caller owns this blob memory URL; do not revoke after SaveAs.
                handedOffMemoryUrl = true;
                chartsProps.SaveAs?.({ dataURL: memoryUrl });
            } catch (error) {
                if (!cancelled) {
                    console.error('Error generating chart image:', error);
                }
            }
        };

        void exportChartImage();

        return () => {
            cancelled = true;
            if (!handedOffMemoryUrl && memoryUrl) {
                URL.revokeObjectURL(memoryUrl);
            }
        };
    }, [isImageExport, chartsProps.outputFormat, chartsProps.uniqueName, chartsProps.SaveAs, visibleCharts]);


    /** Map ChartType to the matching NZChart component and forward typography props. */
    function prepareCardChart(thisChartRow: any, chartTheme: unknown) {
        const DashboardName = thisChartRow && thisChartRow?.ChartType && String(thisChartRow.ChartType).replaceAll(" ", "");
        const typographyProps = getChartTypographyProps(thisChartRow);
        const legend = toLegendLabel(thisChartRow.legend);
        const seriesList = Array.isArray(thisChartRow.series) ? thisChartRow.series : [];
        const firstSeries = seriesList.length ? seriesList[0] : undefined;
        const disableAnimation = isImageExport;

        switch (DashboardName) {
            case "bar":
            case "line": return (
                <BarOrLineChart
                    uniqueName={chartsProps.uniqueName}
                    onDoubleClick={() => {
                        chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                    }}
                    direction={thisChartRow.direction ?? "vertical"}
                    charttype={thisChartRow.ChartType}
                    series={firstSeries}
                    title={thisChartRow.title}
                    subtitle={thisChartRow.subtitle}
                    chartTheme={chartTheme}
                    noLabel={thisChartRow.noLabel}
                    disableAnimation={disableAnimation}
                    {...typographyProps}
                />
            )
            case "multibar": return (
                <MultiBarChart
                    uniqueName={chartsProps.uniqueName}
                    onDoubleClick={() => {
                        chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                    }}
                    legend={legend}
                    series={seriesList}
                    title={thisChartRow.title}
                    subtitle={thisChartRow.subtitle}
                    chartTheme={chartTheme}
                    noLabel={thisChartRow.noLabel}
                    disableAnimation={disableAnimation}
                    {...typographyProps}
                />
            )
            case "area": return (
                <AreaChart
                    uniqueName={chartsProps.uniqueName}
                    onDoubleClick={() => {
                        chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                    }}
                    charttype={thisChartRow.ChartType}
                    title={thisChartRow.title}
                    subtitle={thisChartRow.subtitle}
                    series={seriesList}
                    chartTheme={chartTheme}
                    noLabel={thisChartRow.noLabel}
                    disableAnimation={disableAnimation}
                    {...typographyProps}
                />
            )

            case "radial-gauge": return (
                <RadialGaugeChart
                    uniqueName={chartsProps.uniqueName}
                    onDoubleClick={() => {
                        chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                    }}
                    title={thisChartRow.title}
                    subtitle={thisChartRow.subtitle}
                    series={thisChartRow.series}
                    chartTheme={chartTheme}
                    noLabel={thisChartRow.noLabel}
                    disableAnimation={disableAnimation}
                    {...typographyProps}
                />
            )

            case "pie": return (
                <PieChart
                    uniqueName={chartsProps.uniqueName}
                    onDoubleClick={() => {
                        chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                    }}
                    legend={legend}
                    series={firstSeries}
                    title={thisChartRow.title}
                    subtitle={thisChartRow.subtitle}
                    chartTheme={chartTheme}
                    charttype={thisChartRow.ChartType}
                    angleKey={firstSeries?.angleKey ?? "angleKey"}
                    sectorLabel={firstSeries?.sectorLabel ?? "sectorLabel"}
                    sectorLabelKey={firstSeries?.sectorLabelKey ?? "sectorLabelKey"}
                    calloutLabelKey={firstSeries?.calloutLabelKey ?? "calloutLabelKey"}
                    noLabel={thisChartRow.noLabel}
                    disableAnimation={disableAnimation}
                    {...typographyProps}
                />
            )
            case "dialchart": return (
                <DialChart
                    uniqueName={chartsProps.uniqueName}
                    onDoubleClick={() => {
                        chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                    }}
                    title={thisChartRow.title}
                    subtitle={thisChartRow.subtitle}
                    chartTheme={chartTheme}
                    value={thisChartRow.value}
                    max={thisChartRow.max}
                    noLabel={thisChartRow.noLabel}
                    {...typographyProps}
                />
            )

            case "numberchart": return (
                <NumberChart
                    uniqueName={chartsProps.uniqueName}
                    onDoubleClick={() => {
                        chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                    }}
                    title={thisChartRow.title}
                    subtitle={thisChartRow.subtitle}
                    chartTheme={chartTheme}
                    value={thisChartRow.value}
                    noLabel={thisChartRow.noLabel}
                    {...typographyProps}
                />
            )
            default:
                return (
                    <ChartDefault
                        uniqueName={chartsProps.uniqueName}
                        onDoubleClick={() => {
                            chartsProps.onDoubleClick && chartsProps.onDoubleClick(thisChartRow.data, thisChartRow.title);
                        }}
                        charttype={thisChartRow.ChartType}
                        series={firstSeries}
                        title={thisChartRow.title}
                        subtitle={thisChartRow.subtitle}
                        chartTheme={chartTheme}
                        direction={'horizontal'}
                        noLabel={thisChartRow.noLabel}
                        disableAnimation={disableAnimation}
                        {...typographyProps}
                    />
                );

        }
    }


    return (
        <div
            key={chartsProps.uniqueName}
            className={chartsProps.outputFormat === 'jsx' ? "chart-smallcard" : "chart-wh-100"}
            style={{ position: "relative", height: isImageExport ? '100%' : undefined, width: isImageExport ? '100%' : undefined }}
            onMouseEnter={() => {
                setShowPanel(true);
            }}
            onMouseLeave={() => {
                setShowPanel(false);
            }}
        >
            {showPanel && chartsProps.outputFormat === 'jsx' && (chartsProps?.SaveAs || chartsProps?.SaveAsExcel) && (
                <div className='ke-control-panel-overlay'>
                    <div className='ke-control-panel-section'>
                        {chartsProps?.onPrint && (
                            <button
                                type="button"
                                className="ke-control-panel-btn"
                                title="Click to print chart"
                                onClick={() => { chartsProps.onPrint?.(chartsProps.ChartData); }}
                            >
                                <Printer24x24
                                    size={16}
                                    fill="none"
                                    strokeWidth={1}
                                    stroke="currentColor" />
                            </button>
                        )}
                        {chartsProps?.SaveAs && (
                            <button
                                type="button"
                                className="ke-control-panel-btn"
                                title="Click to download chart image"
                                onClick={() => { chartsProps.SaveAs?.({ className: `chart-${chartsProps.uniqueName}` }); }}
                            >
                                <Download24x24
                                    size={16}
                                    fill="none"
                                    strokeWidth={1}
                                    stroke="currentColor" />
                            </button>
                        )}
                        {chartsProps?.SaveAsExcel && (
                            <button
                                type="button"
                                className="ke-control-panel-btn"
                                title="save as excel"
                                onClick={() => {
                                    chartsProps.SaveAsExcel?.(chartsProps.ChartData);
                                }}
                            >
                                <Excel24x24
                                    size={16}
                                    fill="none"
                                    strokeWidth={1}
                                    stroke="currentColor"
                                />
                            </button>
                        )}
                        {chartsProps?.Fullscreen && (
                            <button
                                type="button"
                                className="ke-control-panel-btn"
                                title="fullscreen"
                                onClick={() => { chartsProps.Fullscreen?.(chartsProps.ChartData); }}
                            >
                                <Fullscreen24x24
                                    size={16}
                                    fill="none"
                                    strokeWidth={1}
                                    stroke="currentColor"
                                />
                            </button>
                        )}

                    </div>
                </div>
            )}

            <div
                className='chart-main-div'
                style={{
                    // Keep fully painted for png/svg; host is already off-screen in GenerateChartFromData.
                    opacity: 1,
                    height: '100%',
                    width: '100%',
                }}
            >
                {visibleCharts}
            </div>
        </div >
    )
}

export { ChartContainer }

import { useRef, useEffect, useState } from 'react';

import { AgCharts, AgGauge } from 'ag-charts-react';
import type {
    ChartFontProps,
    IAreaChart,
    IBasicChart,
    IChartCaption,
    IDialChart,
    IMultiSeriesChart,
    INumberChart,
    IPieChart,
    IRadialGaugeChart,
    ISeries,
} from '../../allinterface/charts/IChartContainer';
import type { AgChartInstance } from 'ag-charts-community';

// Returns caption display text from a plain string or { text } object.
const resolveCaptionText = (value?: string | IChartCaption): string => {
    if (value == null) {
        return '';
    }
    return typeof value === 'string' ? value : (value.text ?? '');
};

// Resolves font size: explicit prop wins, then caption object, then default.
const resolveCaptionFontSize = (
    value?: string | IChartCaption,
    overrideSize?: number,
    defaultSize = 10
): number => {
    if (overrideSize != null) {
        return overrideSize;
    }
    if (value != null && typeof value === 'object') {
        const size = value.fontSize ?? value.font;
        if (size != null) {
            return Number(size);
        }
    }
    return defaultSize;
};

// Coerces legend fontSize (number or string) to a numeric pixel value.
const toNumericFontSize = (size?: number | string): number | undefined => {
    if (size == null) {
        return undefined;
    }
    if (typeof size === 'number') {
        return size;
    }
    const parsed = parseInt(size, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};

// Builds the resolved font-size map used by all chart wrappers.
const getChartFonts = (props: ChartFontProps) => {
    const titleFontSize = resolveCaptionFontSize(props.title, props.titleFontSize, 10);
    const subtitleFontSize = resolveCaptionFontSize(props.subtitle, props.subtitleFontSize, 8);
    const legendFontSize = toNumericFontSize(props.legendFontSize ?? props.legend?.fontSize) ?? 10;
    const labelFontSize = props.labelFontSize ?? 6;
    const labelColor = props.labelColor ?? '#000000';
    const axisLabelFontSize = props.axisLabelFontSize;
    const axisTitleFontSize = props.axisTitleFontSize;
    return {
        titleFontSize,
        subtitleFontSize,
        legendFontSize,
        labelFontSize,
        labelColor,
        axisLabelFontSize,
        axisTitleFontSize,
    };
};

/** Animation config — disabled for png/svg export so memory URL captures finished paint. */

// Returns AG Charts axis title config with optional custom fontSize.
const buildAxisTitleStyle = (titleText: string, fontSize?: number) => ({
    text: titleText,
    ...(fontSize != null ? { fontSize } : {}),
});

// Returns AG Charts axis label config with optional custom fontSize.
const buildAxisLabelStyle = (enabled: boolean, fontSize?: number) => ({
    enabled,
    ...(fontSize != null ? { fontSize } : {}),
});

type CartesianAxisType = 'category' | 'number';

// Builds one AG Charts v13 axis entry (used under axes.x / axes.y).
const buildCartesianAxis = (
    type: CartesianAxisType,
    position: 'bottom' | 'left',
    titleText: string,
    labelsEnabled: boolean,
    labelFontSize?: number,
    titleFontSize?: number,
) => ({
    type,
    position,
    title: buildAxisTitleStyle(titleText, titleFontSize),
    line: { enabled: labelsEnabled },
    tick: { enabled: labelsEnabled },
    label: buildAxisLabelStyle(labelsEnabled, labelFontSize),
});

// Standard vertical bar/line axes: category on x, number on y.
const buildVerticalCartesianAxes = (
    xTitle: string,
    yTitle: string,
    labelsEnabled: boolean,
    axisLabelFontSize?: number,
    axisTitleFontSize?: number,
) => ({
    x: buildCartesianAxis('category', 'bottom', xTitle, labelsEnabled, axisLabelFontSize, axisTitleFontSize),
    y: buildCartesianAxis('number', 'left', yTitle, labelsEnabled, axisLabelFontSize, axisTitleFontSize),
});

// Horizontal bar axes: number on x, category on y.
const buildHorizontalCartesianAxes = (
    xTitle: string,
    yTitle: string,
    labelsEnabled: boolean,
    axisLabelFontSize?: number,
    axisTitleFontSize?: number,
) => ({
    x: buildCartesianAxis('number', 'bottom', xTitle, labelsEnabled, axisLabelFontSize, axisTitleFontSize),
    y: buildCartesianAxis('category', 'left', yTitle, labelsEnabled, axisLabelFontSize, axisTitleFontSize),
});

// Returns AG Charts legend config respecting noLabel and legendFontSize.
const buildLegendOptions = (props: ChartFontProps) => {
    const { legendFontSize } = getChartFonts(props);
    return {
        enabled: !props.noLabel,
        ...(legendFontSize != null ? { item: { label: { fontSize: legendFontSize } } } : {}),
    };
};

interface ILabel {
    uniqueName: string;
    label: Exclude<string, ''>;
    tooltip?: string;
    fontSize?: string;
    fontStyle?: 'normal' | 'italic';
    fontWeight?: 'normal' | string;
    color?: string;
}

// Simple styled text label used by DialChart and NumberChart headers.
const Label = (labelProps: ILabel) => {
    const dynamicStyleLabel = {
        fontSize: labelProps.fontSize || '14px',
        fontStyle: labelProps.fontStyle || 'normal',
        fontWeight: labelProps.fontWeight || 'inherit',
        color: labelProps.color || 'black',
    };
    return (
        <div key={labelProps.uniqueName} className='chart-label-container' title={labelProps.tooltip} style={dynamicStyleLabel}>
            <span>{labelProps.label}</span>
        </div>
    );
};

// Merges multiple series rows into one flat dataset keyed by xKey for multi-series charts.
function combineChartData(seriesList: ISeries[]): Record<string, any>[] {
    if (!seriesList || seriesList.length === 0) {
        return [];
    }

    const mergedData: Record<string, any> = {};

    for (const series of seriesList) {
        if (!series || !series.data) continue;

        const xKey = series.xKey;
        const yKey = series.yKey;

        for (const item of series.data) {
            if (!item) continue;

            const xValue: any = item[xKey];
            if (xValue === undefined || xValue === null) continue;

            if (!mergedData[xValue]) {
                mergedData[xValue] = { [xKey]: xValue };
            }
            mergedData[xValue][yKey] = item[yKey];
        }
    }

    return Object.values(mergedData);
}

// Renders a single-series bar or line chart via AG Charts.
const BarOrLineChart = (barProps: IBasicChart) => {
    const BarOrLineRef = useRef<HTMLDivElement>(null);
    // null until options are ready — avoids AgCharts.create({}) empty-axes capture.
    const [chartOptions, setChartOptions] = useState<Record<string, unknown> | null>(null);
    const chartRef = useRef<AgChartInstance | null>(null);

    useEffect(() => {
        try {
            const fonts = getChartFonts(barProps);
            const isBarChart = barProps.charttype === 'bar';
            const isHorizontal = barProps.direction === 'horizontal';
            const labelsEnabled = !barProps.noLabel;
            const xTitle = barProps?.series?.xName || '';
            const yTitle = barProps?.series?.yName || '';

            const axes = isBarChart && isHorizontal
                ? buildHorizontalCartesianAxes(xTitle, yTitle, labelsEnabled, fonts.axisLabelFontSize, fonts.axisTitleFontSize)
                : buildVerticalCartesianAxes(xTitle, yTitle, labelsEnabled, fonts.axisLabelFontSize, fonts.axisTitleFontSize);

            setChartOptions({
                title: { text: resolveCaptionText(barProps.title), fontSize: fonts.titleFontSize },
                subtitle: { text: resolveCaptionText(barProps.subtitle), fontSize: fonts.subtitleFontSize },
                series: [{
                    type: barProps.charttype,
                    direction: barProps.direction,
                    xKey: barProps?.series?.xKey,
                    yKey: barProps?.series?.yKey,
                    yName: barProps?.series?.yName,
                    xName: barProps?.series?.xName,
                    label: { enabled: labelsEnabled, fontSize: fonts.labelFontSize, color: fonts.labelColor },
                }],
                data: barProps?.series?.data,
                theme: barProps.chartTheme,
                legend: buildLegendOptions(barProps),
                axes,
            });
        } catch (error) {
            console.error('Error setting up bar/line chart:', error);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current = null;
            }
        };
    }, [barProps, barProps.chartTheme]);

    return (
        <>
            <div key={barProps.uniqueName + 'barorline'} ref={BarOrLineRef} className={barProps.ChartClassName} onDoubleClick={barProps.onDoubleClick}>
                {chartOptions && (
                    <AgCharts ref={chartRef} options={chartOptions} className={'chart-main-div' + ' ' + `chart-${barProps.uniqueName}`} />
                )}
            </div>
        </>
    );
};

// Renders a grouped/stacked multi-bar chart with merged series data.
const MultiBarChart = (multiBarChart: IMultiSeriesChart) => {
    const refMultiBarChart = useRef<HTMLDivElement>(null);
    const [chartOptions, setChartOptions] = useState<Record<string, unknown> | null>(null);
    const chartRef = useRef<AgChartInstance | null>(null);

    useEffect(() => {
        try {
            if (multiBarChart?.series) {
                const fonts = getChartFonts(multiBarChart);
                const labelsEnabled = !multiBarChart.noLabel;
                const updatedSeries = multiBarChart.series.map((s: any) => ({
                    ...s,
                    label: {
                        ...(s.label || {}),
                        enabled: labelsEnabled,
                        fontSize: fonts.labelFontSize,
                        color: fonts.labelColor,
                    },
                }));
                const data = combineChartData(multiBarChart.series);
                setChartOptions({
                    title: {
                        text: resolveCaptionText(multiBarChart.title),
                        fontSize: fonts.titleFontSize,
                    },
                    subtitle: {
                        text: resolveCaptionText(multiBarChart.subtitle),
                        fontSize: fonts.subtitleFontSize,
                    },
                    legend: buildLegendOptions(multiBarChart),
                    series: updatedSeries,
                    data,
                    theme: multiBarChart.chartTheme,
                    axes: buildVerticalCartesianAxes('', '', labelsEnabled, fonts.axisLabelFontSize, fonts.axisTitleFontSize),
                });
            }
        } catch (error) {
            console.error('Error setting up multi-bar chart:', error);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current = null;
            }
        };
    }, [multiBarChart]);

    return (
        <>
            <div key={multiBarChart.uniqueName + 'multiBarChart'} ref={refMultiBarChart} className={multiBarChart.ChartClassName} onDoubleClick={multiBarChart.onDoubleClick}>
                {chartOptions && (
                    <AgCharts ref={chartRef} options={chartOptions} className={'chart-main-div' + ' ' + `chart-${multiBarChart.uniqueName}`} />
                )}
            </div>
        </>
    );
};

// Renders a pie/donut chart with optional sector and callout labels.
const PieChart = (pieProps: IPieChart) => {
    const refPieChart = useRef<HTMLDivElement>(null);
    const [chartOptions, setChartOptions] = useState<Record<string, unknown> | null>(null);
    const chartRef = useRef<AgChartInstance | null>(null);

    useEffect(() => {
        try {
            const fonts = getChartFonts(pieProps);
            setChartOptions({
                title: { text: resolveCaptionText(pieProps.title), fontSize: fonts.titleFontSize },
                subtitle: { text: resolveCaptionText(pieProps.subtitle), fontSize: fonts.subtitleFontSize },
                legend: buildLegendOptions(pieProps),
                series: [{
                    type: pieProps.charttype,
                    angleKey: pieProps.angleKey,
                    calloutLabelKey: !pieProps.noLabel ? pieProps.calloutLabelKey : undefined,
                    calloutLabel: pieProps.noLabel ? undefined : {
                        fontSize: fonts.labelFontSize ?? 12,
                    },
                    sectorLabelKey: !pieProps.noLabel ? pieProps.sectorLabelKey : undefined,
                    sectorLabel: pieProps.noLabel ? undefined : {
                        color: 'black',
                        fontSize: fonts.labelFontSize,
                    },
                }],
                data: pieProps?.series?.data,
                theme: pieProps.chartTheme,
            });
        } catch (error) {
            console.error('Error setting up pie chart:', error);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current = null;
            }
        };
    }, [pieProps]);

    return (
        <>
            <div key={pieProps.uniqueName + 'pie'} ref={refPieChart} className={pieProps.ChartClassName} onDoubleClick={pieProps.onDoubleClick}>
                {chartOptions && (
                    <AgCharts ref={chartRef} options={chartOptions} className={'chart-main-div' + ' ' + `chart-${pieProps.uniqueName}`} />
                )}
            </div>
        </>
    );
};

// Renders a multi-series area chart with combined x-axis data.
const AreaChart = (areaProps: IAreaChart) => {
    const [options, setOptions] = useState<any>();
    const chartRef = useRef<AgChartInstance | null>(null);

    useEffect(() => {
        try {
            const fonts = getChartFonts(areaProps);
            const labelsEnabled = !areaProps.noLabel;
            if (areaProps?.series) {
                const data = combineChartData(areaProps?.series);
                const updatedSeries = areaProps.series.map((s: any) => ({
                    ...s,
                    label: {
                        ...(s.label || {}),
                        enabled: labelsEnabled,
                        fontSize: fonts.labelFontSize,
                        color: fonts.labelColor,
                    },
                }));
                setOptions({
                    title: { text: resolveCaptionText(areaProps.title), fontSize: fonts.titleFontSize },
                    subtitle: { text: resolveCaptionText(areaProps.subtitle), fontSize: fonts.subtitleFontSize },
                    data,
                    axes: buildVerticalCartesianAxes('', '', labelsEnabled, fonts.axisLabelFontSize, fonts.axisTitleFontSize),
                    series: updatedSeries,
                    legend: buildLegendOptions(areaProps),
                    theme: areaProps.chartTheme,
                });
            }
        } catch (error) {
            console.error('Error setting up area chart:', error);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current = null;
            }
        };
    }, [areaProps?.series, areaProps.chartTheme, areaProps.noLabel, areaProps]);

    return (
        <div className={areaProps.ChartClassName} onDoubleClick={areaProps.onDoubleClick} key={areaProps.uniqueName + 'area'}>
            {options &&
                <AgCharts ref={chartRef} options={options} className={'chart-main-div' + ' ' + `chart-${areaProps.uniqueName}`} />
            }
        </div>
    );
};

// Fallback chart renderer used when ChartType does not match a known case.
function ChartDefault(ChartRow: IBasicChart) {
    const refdefault = useRef<HTMLDivElement>(null);
    const [chartOptions, setChartOptions] = useState<Record<string, unknown> | null>(null);
    const chartRef = useRef<AgChartInstance | null>(null);

    useEffect(() => {
        try {
            const fonts = getChartFonts(ChartRow);
            setChartOptions({
                title: { text: resolveCaptionText(ChartRow.title), fontSize: fonts.titleFontSize },
                subtitle: { text: resolveCaptionText(ChartRow.subtitle), fontSize: fonts.subtitleFontSize },
                series: [{
                    type: ChartRow.charttype,
                    xKey: ChartRow?.series?.xKey,
                    yKey: ChartRow.series?.yKey,
                    xName: ChartRow.series?.xName,
                    yName: ChartRow.series?.yName,
                    label: {
                        enabled: !ChartRow.noLabel,
                        fontSize: fonts.labelFontSize,
                        color: fonts.labelColor,
                    },
                }],
                data: ChartRow?.series?.data,
                legend: buildLegendOptions(ChartRow),
                theme: ChartRow.chartTheme,
            });
        } catch (error) {
            console.error('Error setting up default chart:', error);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current = null;
            }
        };
    }, [ChartRow]);

    return (
        <>
            <div key={ChartRow.uniqueName + 'chart'} ref={refdefault} className={ChartRow.ChartClassName} onDoubleClick={ChartRow.onDoubleClick}>
                {chartOptions && (
                    <AgCharts ref={chartRef} options={chartOptions} className={'chart-main-div' + ' ' + `chart-${ChartRow.uniqueName}`} />
                )}
            </div>
        </>
    );
}

// Renders a radial gauge using AG Gauge with computed or explicit value.
const RadialGaugeChart = (config: IRadialGaugeChart) => {
    const [options, setOptions] = useState<any>({});

    useEffect(() => {
        try {
            const fonts = getChartFonts(config);
            const series = config.series;
            const yKey = series?.yKey;
            const data = series?.data || [];

            const defaultValue =
                config.series.value ??
                (data.length && yKey
                    ? Math.round(
                        data.reduce((sum: any, d: any) => sum + (Number(d[yKey]) || 0), 0) / data.length
                    )
                    : 0);

            setOptions({
                type: 'radial-gauge',
                value: defaultValue,
                scale: {
                    min: config.series?.min ?? 0,
                    max: config.series?.max ?? 100,
                },
                segmentation: {
                    enabled: true,
                    interval: config.series?.interval ?? { count: 5 },
                    spacing: 2,
                },
                label: {
                    text: `${defaultValue}`,
                    fontSize: fonts.labelFontSize,
                    color: '#fff',
                },
                track: {
                    fill: '#3a3a3a',
                },
                title: {
                    text: resolveCaptionText(config.title),
                    fontSize: fonts.titleFontSize,
                    color: '#eee',
                },
                subtitle: {
                    text: resolveCaptionText(config.subtitle),
                    fontSize: fonts.subtitleFontSize,
                    color: '#aaa',
                },
            });
        } catch (error) {
            console.error('Error setting up radial gauge chart:', error);
        }
    }, [config]);

    return (
        <div className={config.ChartClassName} onDoubleClick={config.onDoubleClick} key={config.uniqueName + 'radial'}>
            {options &&
                <AgGauge
                    options={options}
                    className={'chart-main-div' + ' ' + `chart-${config.uniqueName}`}
                />
            }
        </div>
    );
};

// Custom SVG dial chart showing value as an arc and centered number.
const DialChart = ({
    value,
    max,
    size = 120,
    title,
    subtitle,
    uniqueName,
    onDoubleClick,
    noLabel,
    titleFontSize,
    subtitleFontSize,
}: IDialChart) => {
    const clampedValue = Math.max(0, Math.min(value, max));
    const radius = size / 2 - 10;
    const center = size / 2;
    const strokeWidth = 12;
    const angle = (clampedValue / max) * 270 - 135;

    const startX = center + radius * Math.cos((-135 * Math.PI) / 180);
    const startY = center + radius * Math.sin((-135 * Math.PI) / 180);
    const endX = center + radius * Math.cos((angle * Math.PI) / 180);
    const endY = center + radius * Math.sin((angle * Math.PI) / 180);
    const largeArcFlag = clampedValue / max > 0.5 ? 1 : 0;

    const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

    const dialTitleSize = `${resolveCaptionFontSize(title, titleFontSize, 10)}px`;
    const dialSubtitleSize = `${resolveCaptionFontSize(subtitle, subtitleFontSize, 9)}px`;

    return (
        <div className='chart-dial-chart-container' onDoubleClick={onDoubleClick} key={uniqueName + 'dial'}>
            {!noLabel && (
                <div className='chart-dial-chart-title'>
                    <Label uniqueName={'dial-chart-title' + uniqueName} label={resolveCaptionText(title)} fontSize={dialTitleSize} />
                    <div className='chart-dial-chart-subtitle'>
                        <Label uniqueName={'dial-chart-subtitle' + uniqueName} label={resolveCaptionText(subtitle) || 'subtitle'} fontSize={dialSubtitleSize} color='gray' />
                    </div>
                </div>
            )}
            <div className='chart-dial-chart'>
                <svg width={size} height={size}>
                    <path
                        d={`M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${center + radius * Math.cos((135 * Math.PI) / 180)} ${center + radius * Math.sin((135 * Math.PI) / 180)}`}
                        stroke="#eee"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <path
                        d={arcPath}
                        stroke="#3b82f6"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                    />
                    {!noLabel && (
                        <text
                            x={center}
                            y={center}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={size / 4}
                            fontFamily="sans-serif"
                            fill="#222"
                        >
                            {clampedValue}
                        </text>
                    )}
                </svg>
            </div>
        </div>
    );
};

// Custom SVG number display chart with title/subtitle headers.
const NumberChart = ({
    value,
    fontSize = 48,
    uniqueName,
    title,
    subtitle,
    onDoubleClick,
    titleFontSize,
    subtitleFontSize,
}: INumberChart) => {
    const text = value.toString();
    const numberTitleSize = `${resolveCaptionFontSize(title, titleFontSize, 10)}px`;
    const numberSubtitleSize = `${resolveCaptionFontSize(subtitle, subtitleFontSize, 9)}px`;

    return (
        <div className='chart-number-chart-container' onDoubleClick={onDoubleClick} key={uniqueName + 'number'}>
            <div className='chart-number-chart-title'>
                <Label uniqueName={'number-chart-title' + uniqueName} label={resolveCaptionText(title)} fontSize={numberTitleSize} />
                <div className='chart-number-chart-subtitle'>
                    <Label uniqueName={'number-chart-subtitle' + uniqueName} label={resolveCaptionText(subtitle) || 'subtitle'} fontSize={numberSubtitleSize} color='gray' />
                </div>
            </div>
            <div className='chart-number-chart'>
                <svg width={fontSize * text.length} height={fontSize * 1.2}>
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fontSize}
                        fontFamily="sans-serif"
                        fill="currentColor"
                    >
                        {text}
                    </text>
                </svg>
            </div>
        </div>
    );
};

export { BarOrLineChart, MultiBarChart, PieChart, AreaChart, ChartDefault, RadialGaugeChart, DialChart, NumberChart };

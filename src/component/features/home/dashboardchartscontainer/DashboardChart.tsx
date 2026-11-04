
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, JSX, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useTheme } from 'styled-components'
import { registerAgCharts } from '@n20a/libchart'
registerAgCharts()
import { ChartContainer } from '@n20a/libchart'
import '@n20a/libchart/ChartContainer.css'
import { useChartProfileContext } from '../../../shared/context/hooks/ChartProfileHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { useCommonVariableContext } from '../../../shared/context/hooks/CommonVariableHooks';
import { CHART, EM } from '../../../shared/interceptors/EndPoints';
import '../../allcss/home/DashboardChart.css'
import { IChartDataPayload, IChartDataSetItem, IChartOptions, IDashboardChart, TChartProfileRow, TChartRecord, TSeriesRecord } from '../../../shared/allinterface/charts/IDashboardChart'
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { Close24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { FnCopyToClipboard } from '../../../shared/allcommon/basic/FnCopyToClipboard';
import { JsonViewer } from '../../../shared/jsonviewer/JsonViewer';
import { FnGetChartImageUrlsByClassName } from './FnGetChartImageUrlByClassName';
import { FnDownloadImageFromDataUrl } from './FnDownloadImageFromDataUrl';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { FnHandleAPIResponse } from '../../../shared/allcommon/basic/FnHandleAPIResponse';
import { SettingGroups } from '../../../constants/Feature';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { FEnums } from '../../../constants/Feature';
import { IApItem } from '../../../shared/context/allinterface/IMainApp';
import { IChartProfileItem } from '../../../shared/context/allinterface/IChartProfile';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { IChartTypographyProps } from '../../../shared/allinterface/charts/IChartContainer'
import { FnCreateReportForPrint } from '../../../shared/allcommon/generatepdf/FnCreateReportForPrint'
import { TReportLayoutJson } from '../../../shared/allinterface/IGeneratePdf'
import { GeneratePdf } from '../../../shared/generatepdf/GeneratePdf'


enum EChartCharLength {
    TitleSubtitle = 32,
    AxisLabel = 16,
}

const TYPOGRAPHY_KEYS: (keyof IChartTypographyProps)[] = [
    'titleFontSize',
    'subtitleFontSize',
    'legendFontSize',
    'labelFontSize',
    'labelColor',
    'axisLabelFontSize',
    'axisTitleFontSize',
];


// Reads font sizes from chart row first, then falls back to series[0].
const extractChartTypography = (
    source: Record<string, unknown>,
    seriesItem?: Record<string, unknown>
): IChartTypographyProps => {
    const pickNumber = (key: keyof IChartTypographyProps) =>
        (source[key] ?? seriesItem?.[key]) as number | undefined;
    const pickString = (key: keyof IChartTypographyProps) =>
        (source[key] ?? seriesItem?.[key]) as string | undefined;
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

// Removes typography-only keys so they are not passed through to AG Charts series.
const stripChartTypography = <T extends Record<string, unknown>>(item: T): T => {
    const result = { ...item };
    for (const key of TYPOGRAPHY_KEYS) {
        delete result[key];
    }
    return result;
};

const isNumericChartValue = (value: unknown): boolean => {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return false;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed !== '' && !isNaN(Number(trimmed));
    }
    return false;
};

// Parses ChartOptions from profile config (JSON string or object).
const parseChartOptions = (chartOptions: unknown): IChartOptions => {
    if (chartOptions == null) {
        return { series: [] };
    }

    if (typeof chartOptions === "string") {
        const trimmed = chartOptions.trim();
        if (!trimmed || trimmed.toLowerCase() === "null") {
            return { series: [] };
        }
        try {
            const parsed = FnParseJsonSafely(trimmed) as unknown;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as IChartOptions;
            }
        } catch (error) {
            console.error("Error in parse ChartOptions:", error);
        }
        return { series: [] };
    }

    if (typeof chartOptions === "object" && !Array.isArray(chartOptions)) {
        return chartOptions as IChartOptions;
    }

    return { series: [] };
};

// Checks if static API data is found inside ChartOptions -> data or ChartOptions -> series -> data
const hasStaticChartData = (chartOptions: unknown): boolean => {
    const parsed = parseChartOptions(chartOptions);
    if (!parsed || typeof parsed !== "object") {
        return false;
    }
    const directData = parsed.data;
    if (Array.isArray(directData) && directData.length > 0) {
        return true;
    }
    return false;
};

// Extracts static API data rows from ChartOptions -> data, falling back to ChartOptions -> series -> data
const getStaticChartData = (chartOptions: unknown): unknown[] | null => {
    const parsed = parseChartOptions(chartOptions);
    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    // 1. Check ChartOptions -> data (or Data) as static API data
    const directData = parsed.data
    if (Array.isArray(directData)) {
        return directData;
    }

    // 2. Check ChartOptions -> series -> data
    if (Array.isArray(parsed.series) && parsed.series.length > 0) {
        const allRows: unknown[] = [];
        let hasDataKey = false;
        for (const item of parsed.series) {
            if (item && typeof item === "object") {
                const seriesData = (item as Record<string, unknown>).data;
                if (Array.isArray(seriesData)) {
                    hasDataKey = true;
                    allRows.push(...seriesData);
                }
            }
        }
        if (hasDataKey) {
            return allRows;
        }
    }

    return null;
};

const hasEmbeddedSeriesData = hasStaticChartData;
const getEmbeddedSeriesData = getStaticChartData;

const normalizeChartName = (value: string): string => {
    const base = value.toLowerCase().split(/[\\/]/).pop() ?? "";
    return base.replace(/[^a-z0-9]+/g, "").replace(/^get/, "");
};

const extractApiChartRows = (chartData: unknown): unknown[] => {
    if (!chartData) {
        return [];
    }
    if (Array.isArray(chartData)) {
        return chartData;
    }
    if (typeof chartData !== "object") {
        return [];
    }

    const record = chartData as Record<string, unknown>;
    if (Array.isArray(record.Data)) {
        return record.Data;
    }
    if (Array.isArray(record.data)) {
        return record.data;
    }
    if (record.ChartData && typeof record.ChartData === "object") {
        const nested = record.ChartData as Record<string, unknown>;
        if (Array.isArray(nested.Data)) {
            return nested.Data;
        }
        if (Array.isArray(record.ChartData)) {
            return record.ChartData as unknown[];
        }
    }
    return [];
};

const resolveChartDataPayload = (response: unknown): IChartDataPayload | null => {
    if (!response) {
        return null;
    }
    if (typeof response === "string") {
        return FnParseJsonSafely(response) as IChartDataPayload | null;
    }
    if (typeof response !== "object") {
        return null;
    }

    const payload = response as Record<string, unknown>;
    if (typeof payload.chartJson === "string") {
        return FnParseJsonSafely(payload.chartJson) as IChartDataPayload | null;
    }
    if (payload.chartJson && typeof payload.chartJson === "object") {
        return payload.chartJson as IChartDataPayload;
    }
    if (Array.isArray(payload.ChartDataSet)) {
        return payload as IChartDataPayload;
    }
    return null;
};

const findMatchingChartRows = (
    dataByName: Record<string, unknown[]>,
    chartProfile: TChartProfileRow
): unknown[] | undefined => {
    const candidates = [
        chartProfile._ChartProfile,
        chartProfile.ChartDatasetAPI,
    ]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => normalizeChartName(value));

    const entries = Object.entries(dataByName);
    for (const candidate of candidates) {
        const match = entries.find(([key]) => normalizeChartName(key) === candidate);
        if (match) {
            return match[1];
        }
    }
    return undefined;
};

const resolveRowKey = (row: Record<string, unknown>, key: string): string | undefined => {
    if (!key) {
        return undefined;
    }
    if (Object.prototype.hasOwnProperty.call(row, key)) {
        return key;
    }
    const lower = key.toLowerCase();
    return Object.keys(row).find((rowKey) => rowKey.toLowerCase() === lower);
};

// True when ChartOptions already has series keys the chart type can render.
const hasUsableSeriesConfig = (
    series: IChartOptions["series"],
    chartType: string | undefined
): boolean => {
    if (!Array.isArray(series) || series.length === 0) {
        return false;
    }

    const normalizedType = (chartType ?? "").toLowerCase();
    return series.every((item) => {
        if (!item || typeof item !== "object") {
            return false;
        }
        const metric = item as TSeriesRecord;
        if (normalizedType === "pie" || normalizedType === "donut") {
            return Boolean(metric.angleKey);
        }
        if (normalizedType === "radial-gauge") {
            return Boolean(metric.value ?? metric.yKey);
        }
        return Boolean(metric.xKey && metric.yKey);
    });
};

// Infers default series from the first row of API data when ChartOptions.series is empty.
// For pie/donut charts: uses the first numeric key as angleKey and first string key as calloutLabelKey.
// For cartesian charts (bar/line/area/stacked/multibar): uses the first non-numeric key as xKey
// and all remaining numeric keys as separate yKey series.
// For radial-gauge: uses the first numeric key as the value key.
const buildDefaultSeriesFromData = (
    chartData: unknown[],
    chartType: string | undefined
): TSeriesRecord[] => {
    if (!chartData.length) {
        return [];
    }

    const firstRow = chartData[0];
    if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow)) {
        return [];
    }

    const rowObj = firstRow as Record<string, unknown>;
    const keys = Object.keys(rowObj);

    const numericKeys = keys.filter((k) => isNumericChartValue(rowObj[k]));
    const categoryKeys = keys.filter((k) => !numericKeys.includes(k));

    const normalizedType = (chartType ?? '').toLowerCase();

    // Pie / Donut chart
    if (normalizedType === 'pie' || normalizedType === 'donut') {
        const angleKey = numericKeys[0] ?? keys[0];
        const labelKey = categoryKeys[0] ?? keys.find((k) => k !== angleKey) ?? '';
        if (!angleKey) return [];
        const series: TSeriesRecord = {
            type: normalizedType === 'donut' ? 'donut' : 'pie',
            angleKey,
            ...(labelKey ? { calloutLabelKey: labelKey, sectorLabelKey: labelKey } : {}),
        };
        return [series];
    }

    // Radial gauge
    if (normalizedType === 'radial-gauge') {
        const valueKey = numericKeys[0] ?? keys[0];
        if (!valueKey) return [];
        return [{ type: 'radial-gauge', value: valueKey }];
    }

    // Cartesian charts: bar / line / area / stacked / multibar
    const xKey = categoryKeys[0] ?? keys[0];
    const yKeys = numericKeys.filter((k) => k !== xKey);

    if (!xKey || !yKeys.length) {
        // If no clear x/y split, fallback to first key as x and second as y
        if (keys.length >= 2) {
            return [{ type: normalizedType === 'line' ? 'line' : 'bar', xKey: keys[0], yKey: keys[1] }];
        }
        return [];
    }

    const seriesType = normalizedType === 'line' ? 'line' : normalizedType === 'area' ? 'area' : 'bar';
    const isStacked = normalizedType === 'stacked' || normalizedType === 'multibar';

    return yKeys.map((yKey) => ({
        type: seriesType,
        xKey,
        yKey,
        yName: yKey,
        xName: xKey,
        ...(isStacked ? { stacked: true } : {}),
    }));
};

// Builds ChartOptions from API rows when the profile did not supply a usable series config.
const buildChartOptionsFromApiData = (
    chartData: unknown[],
    chartProfile: TChartProfileRow,
    existingOptions?: IChartOptions
): IChartOptions => ({
    ...existingOptions,
    series: buildDefaultSeriesFromData(chartData, chartProfile.ChartType),
    title: existingOptions?.title ?? chartProfile._ChartProfile,
    subtitle: existingOptions?.subtitle ?? chartProfile.Description,
});

// Truncates string values (or text/label object properties) longer than maxLength, appending '...'.
const truncateChartText = (value: unknown, maxLength: number): unknown => {
    if (typeof value === 'string') {
        return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.text === 'string') {
            return {
                ...obj,
                text: obj.text.length > maxLength ? `${obj.text.slice(0, maxLength)}...` : obj.text,
            };
        }
        if (typeof obj.label === 'string') {
            return {
                ...obj,
                label: obj.label.length > maxLength ? `${obj.label.slice(0, maxLength)}...` : obj.label,
            };
        }
    }
    return value;
};

// Title and Subtitle: truncate if string length is greater than 32 characters
const truncateTitleOrSubtitle = (value: unknown): unknown => truncateChartText(value, EChartCharLength.TitleSubtitle);

// X and Y axis labels / categories: truncate after 16 characters
const truncateAxisLabel = (value: unknown): unknown => truncateChartText(value, EChartCharLength.AxisLabel);

// Builds a stable combined key for row de-duplication and series field names.
const buildCompositeKey = (...parts: unknown[]): string =>
    parts
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join("::");

const buildSeriesFieldKey = (splitValue: string, yKey: string): string =>
    `${splitValue}__${yKey}`.replace(/[^a-zA-Z0-9_]/g, "_");

// Reads flat chart rows from API arrays or pre-built chart payloads.
const extractChartRows = (
    chartData: unknown,
    xKey?: string,
    splitBy?: string
): TChartRecord[] => {
    const rowMap = new Map<string, TChartRecord>();

    const addRows = (rows: unknown[]) => {
        for (const row of rows) {
            if (!row || typeof row !== "object" || Array.isArray(row)) {
                continue;
            }

            const record = row as TChartRecord;
            const dedupeKey = xKey
                ? buildCompositeKey(
                    record[xKey],
                    splitBy ? record[splitBy] : undefined
                )
                : buildCompositeKey(record);

            if (!rowMap.has(dedupeKey)) {
                rowMap.set(dedupeKey, record);
            }
        }
    };

    if (!chartData) {
        return [];
    }

    if (Array.isArray(chartData)) {
        addRows(chartData);
        return Array.from(rowMap.values());
    }

    if (typeof chartData === "object") {
        const chartRecord = chartData as TChartRecord;
        const seriesList = Array.isArray(chartRecord.series) ? chartRecord.series : [];
        for (const seriesItem of seriesList) {
            if (!seriesItem || typeof seriesItem !== "object") {
                continue;
            }
            const seriesData = (seriesItem as TSeriesRecord).data;
            if (Array.isArray(seriesData)) {
                addRows(seriesData);
            }
        }
    }

    return Array.from(rowMap.values());
};

const isGroupedStackedChartProfile = (
    chartType: string | undefined,
    seriesOptions: IChartOptions
): boolean => {
    const isStackedType = chartType?.toLowerCase() === "stacked" || chartType?.toLowerCase() === "multibar" || chartType?.toLowerCase() === "bar";
    if (!isStackedType || !seriesOptions.splitBy) {
        return false;
    }

    const metricSeries = seriesOptions.series ?? [];
    if (!metricSeries.length) {
        return false;
    }

    return metricSeries.every((metric) => Boolean(metric?.yKey))
        && metricSeries.some((metric) => Boolean(metric?.xKey));
};

// Builds grouped + stacked multibar config from ChartOptions (splitBy + series[]).
const buildGroupedStackedChartConfig = (
    chartProfile: TChartProfileRow,
    seriesOptions: IChartOptions
): TChartRecord => {
    const metricSeries = (seriesOptions.series ?? []) as TSeriesRecord[];
    const firstSeriesConfig = metricSeries.find((metric) => metric?.xKey) ?? metricSeries[0];
    const splitBy = String(seriesOptions.splitBy);
    const defaultXKey = String(firstSeriesConfig?.xKey ?? "");
    const defaultXName = String(firstSeriesConfig?.xName ?? defaultXKey);
    const rows = extractChartRows(chartProfile.ChartData ?? getEmbeddedSeriesData(seriesOptions), defaultXKey, splitBy);
    const typography = extractChartTypography(
        seriesOptions as Record<string, unknown>,
        firstSeriesConfig
    );

    const isBeginAtZero = Boolean(
        (seriesOptions as Record<string, unknown>).beginAtZero ??
        metricSeries.some((metric) => metric?.beginAtZero)
    );

    // Calculate average value for each metric across the rows to sort stack order from small to bigger
    const metricAvgMap = new Map<string, number>();
    for (const metric of metricSeries) {
        const yKey = String(metric.yKey ?? "");
        if (!yKey) continue;
        const validValues = rows
            .map((r) => Number(r[yKey]))
            .filter((v) => !isNaN(v) && isFinite(v));
        const avg = validValues.length
            ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length
            : 0;
        metricAvgMap.set(yKey, avg);
    }

    // Sort metric series from smallest to largest average value
    const sortedMetricSeries = [...metricSeries].sort((a, b) => {
        const avgA = metricAvgMap.get(String(a.yKey ?? "")) ?? 0;
        const avgB = metricAvgMap.get(String(b.yKey ?? "")) ?? 0;
        return avgA - avgB;
    });

    const splitValues = [...new Set(
        rows
            .map((row) => String(row[splitBy] ?? "").trim())
            .filter(Boolean)
    )].sort((left, right) => left.localeCompare(right));

    // When beginAtZero is true, precompute row deltas so the stacked segments build up accurately from zero
    const rowDeltaMap = new Map<string, Record<string, number | undefined>>();
    const rawValueMap = new Map<string, unknown>();
    if (isBeginAtZero) {
        for (const row of rows) {
            const splitVal = String(row[splitBy] ?? "").trim();
            const xVal = String(row[defaultXKey] ?? "");
            const compositeKey = `${splitVal}::${xVal}`;

            if (!rowDeltaMap.has(compositeKey)) {
                const deltas: Record<string, number | undefined> = {};
                let prevVal = 0;

                for (const metric of sortedMetricSeries) {
                    const yKey = String(metric.yKey ?? "");
                    const rawVal = row[yKey];
                    const seriesYKey = buildSeriesFieldKey(splitVal, yKey);
                    rawValueMap.set(`${compositeKey}::${seriesYKey}`, rawVal);
                    rawValueMap.set(`${compositeKey}::${yKey}`, rawVal);

                    if (rawVal === undefined || rawVal === null) {
                        deltas[yKey] = undefined;
                        continue;
                    }
                    const numVal = Number(rawVal);
                    if (isNaN(numVal)) {
                        deltas[yKey] = undefined;
                        continue;
                    }
                    const delta = Math.max(0, numVal - prevVal);
                    deltas[yKey] = delta;
                    prevVal = Math.max(prevVal, numVal);
                }
                rowDeltaMap.set(compositeKey, deltas);
            }
        }
    }

    const groupedSeries: TSeriesRecord[] = [];

    for (const metric of sortedMetricSeries) {
        const yKey = String(metric.yKey ?? "");
        const xKey = String(metric.xKey ?? defaultXKey);
        if (!yKey || !xKey) {
            continue;
        }

        const yName = String(metric.yName ?? yKey);
        const xName = String(metric.xName ?? defaultXName);
        const seriesType = String(metric.type ?? "bar");

        for (const splitValue of splitValues) {
            const seriesYKey = buildSeriesFieldKey(splitValue, yKey);
            const splitLabel = String(metric.splitLabel ?? splitValue);
            const legendName = metric.legendName
                ? String(metric.legendName).replace("{split}", splitLabel).replace("{metric}", yName)
                : `${splitLabel} ${yName}`;
            // Same stackGroup per split value so Min/Avg/Max stack into one bar;
            // different split values stay side-by-side (grouped stacked).
            const stackGroup = String(metric.stackGroup ?? splitValue);

            const seriesObj: TSeriesRecord = {
                ...stripChartTypography(metric),
                type: seriesType,
                xKey,
                xName: truncateAxisLabel(xName) as string,
                yKey: seriesYKey,
                yName: legendName,
                stacked: metric.stacked ?? true,
                stackGroup,
                beginAtZero: metric.beginAtZero ?? isBeginAtZero,
                data: rows
                    .filter((row) => String(row[splitBy] ?? "").trim() === splitValue)
                    .map((row) => {
                        const xVal = String(row[xKey] ?? "");
                        let val = row[yKey];
                        if (isBeginAtZero) {
                            const compositeKey = `${splitValue}::${xVal}`;
                            const deltas = rowDeltaMap.get(compositeKey);
                            if (deltas && deltas[yKey] !== undefined) {
                                val = deltas[yKey];
                            }
                        }
                        return {
                            [xKey]: truncateAxisLabel(row[xKey]),
                            [seriesYKey]: typeof val === 'string' ? truncateAxisLabel(val) : val,
                        };
                    }),
            };

            if (isBeginAtZero) {
                seriesObj.label = {
                    formatter: (params: { datum?: Record<string, unknown>; yKey?: string; value?: unknown }) => {
                        const xVal = String(params?.datum?.[xKey] ?? "");
                        const rawKey = `${splitValue}::${xVal}::${seriesYKey}`;
                        const rawVal = rawValueMap.get(rawKey) ?? rawValueMap.get(`${splitValue}::${xVal}::${yKey}`);
                        if (rawVal !== undefined && rawVal !== null) {
                            return String(rawVal);
                        }
                        return params?.value != null ? String(params.value) : "";
                    }
                };
                seriesObj.tooltip = {
                    renderer: (params: { datum?: Record<string, unknown>; yKey?: string; yName?: string }) => {
                        const xVal = String(params?.datum?.[xKey] ?? "");
                        const rawKey = `${splitValue}::${xVal}::${seriesYKey}`;
                        const rawVal = rawValueMap.get(rawKey) ?? rawValueMap.get(`${splitValue}::${xVal}::${yKey}`);
                        const displayVal = rawVal !== undefined && rawVal !== null ? rawVal : params?.datum?.[seriesYKey];
                        return {
                            title: params?.yName ?? legendName,
                            data: [
                                {
                                    label: params?.yName ?? legendName,
                                    value: String(displayVal ?? ""),
                                }
                            ]
                        };
                    }
                };
            }

            groupedSeries.push(seriesObj);
        }
    }

    return {
        IsNZ: chartProfile.IsNZ ? 1 : 0,
        EntityName: "Dashboard",
        GroupName: chartProfile.GroupName,
        Description: chartProfile.Description,
        ChartType: "multibar",
        SortOrder: chartProfile.SortOrder,
        Enabled: chartProfile.Enabled ? 1 : 0,
        noLabel: false,
        series: groupedSeries,
        data: rows,
        ChartData: rows,
        ChartDatasetAPI: chartProfile.ChartDatasetAPI,
        title: truncateTitleOrSubtitle(seriesOptions?.title ?? chartProfile._ChartProfile ?? "Default Title"),
        subtitle: truncateTitleOrSubtitle(seriesOptions?.subtitle ?? chartProfile.Description ?? "Default Subtitle"),
        legend: seriesOptions?.legend,
        _ChartProfile: chartProfile._ChartProfile,
        Name: (chartProfile as any)?.Name,
        CPName: (chartProfile as any)?.CPName,
        ChartOptions: chartProfile.ChartOptions,
        ...typography,
    };
};

function DashboardChart(ChartsProps: IDashboardChart) {
    const [selectedChart, setSelectedChart] = useState(''); //no selected chart means all charts are needed
    const [visibleCharts, setVisibleCharts] = useState<JSX.Element[]>([]);
    const [chartRecords, setChartRecords] = useState<TChartRecord[]>();
    const [numberOfColumnsChart, setNumberOfColumnsChart] = useState<number>(5);
    const [selectedCard, setSelectedCard] = useState<TChartRecord[] | '' | null>(null);
    const [showSelectedCard, setShowSelectedCard] = useState<JSX.Element[] | null>(null)
    const [loading, setLoading] = useState<boolean>(true);
    const [fullscreenChart, setFullscreenChart] = useState<TChartRecord | null>(null);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);

    const styledTheme = useTheme();
    const themeName = (styledTheme as { name?: string }).name ?? 'light';
    const chartTheme = useMemo(() => ({
        params: {
            backgroundColor: styledTheme.colors.bgExplorer,
            foregroundColor: '#000000',
            chromeBackgroundColor: styledTheme.colors.ChartButtonBackground,
            chromeTextColor: '#000000',
        }
    }), [styledTheme]);

    const commonVariableContext = useCommonVariableContext();
    const chartProfileContext = useChartProfileContext()
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();

    const containerRef = useRef<HTMLDivElement | null>(null)
    const fullscreenContainerRef = useRef<HTMLDivElement | null>(null)
    const chartFetchRequestIdRef = useRef(0);

    const chartFetchKey = useMemo(() => {
        if (ChartsProps.isDashboard === false) {
            const nodeEntId = ChartsProps.selectedNode?.NodeEntID || (ChartsProps.selectedNode as any)?.key || (ChartsProps.selectedNode as any)?.entID;
            const nodeEntityName = ChartsProps.selectedNode?.NodeEntityname || ChartsProps.selectedNode?.NodeType;
            if (!nodeEntId || !nodeEntityName) {
                return null;
            }
            return [
                ChartsProps.featureId,
                ChartsProps.purpose ?? '',
                nodeEntId,
                nodeEntityName.toString().toLowerCase(),
            ].join('|');
        }

        return [
            ChartsProps.featureId,
            'dashboard',
            ChartsProps.purpose ?? '',
        ].join('|');
    }, [
        ChartsProps.featureId,
        ChartsProps.isDashboard,
        ChartsProps.purpose,
        ChartsProps.selectedNode?.NodeEntID,
        (ChartsProps.selectedNode as any)?.key,
        (ChartsProps.selectedNode as any)?.entID,
        ChartsProps.selectedNode?.NodeEntityname,
        ChartsProps.selectedNode?.NodeType,
    ]);

    useEffect(() => {
        if (mainAppContext.apRecords) {
            if (!ChartsProps.displayPerRow) {
                const dashboardsPerRow = mainAppContext.apRecords.filter((item: IApItem) => item.Name === "DashboardsPerRow" && item.GroupName === SettingGroups.AdminConfiguration && item.Value);
                if (dashboardsPerRow.length) {
                    setNumberOfColumnsChart(Number(dashboardsPerRow[0].Value ? dashboardsPerRow[0].Value : dashboardsPerRow[0].DefaultAPValue) ?? 5)
                }
            } else {
                setNumberOfColumnsChart(ChartsProps.displayPerRow)
            }
        }
    }, [mainAppContext, ChartsProps.displayPerRow])
    const handlSaveAsDataset = useCallback((data: unknown, title: string) => {
        const dataObj = (data && typeof data === "object") ? data as TChartRecord : {};
        const series = Array.isArray(dataObj.series) ? dataObj.series as TChartRecord[] : [];

        const saveAsDataset = series.length > 0 ? (series[0].data ?? [dataObj]) : [dataObj];
        if (ChartsProps.SaveAsDataset) {
            ChartsProps.SaveAsDataset(saveAsDataset)
        } else {

            //make data and download Excel
            FnCopyToClipboard(JSON.stringify(saveAsDataset), title, true);
        }

    }, [ChartsProps.SaveAsDataset]);

    const exitChartFullscreen = useCallback(() => {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => undefined);
        }
        setFullscreenChart(null);
    }, []);

    const isSameFullscreenChart = (left: TChartRecord, right: TChartRecord): boolean =>
        String(left.title ?? '') === String(right.title ?? '')
        && String(left.ChartType ?? '').toLowerCase() === String(right.ChartType ?? '').toLowerCase();

    const handleChartFullscreen = useCallback((chartRow: TChartRecord) => {
        const nextChart = { ...chartRow, noLabel: false };
        if (fullscreenChart && isSameFullscreenChart(fullscreenChart, nextChart)) {
            exitChartFullscreen();
            return;
        }
        setFullscreenChart(nextChart);
    }, [fullscreenChart, exitChartFullscreen]);

    useEffect(() => {
        if (!fullscreenChart) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            fullscreenContainerRef.current?.requestFullscreen?.().catch(() => undefined);
        });

        return () => cancelAnimationFrame(frame);
    }, [fullscreenChart]);

    const prepareCardChart = useCallback((thisChartRow: TChartRecord, activeChartTheme: unknown, chartIndex: number) => {

        return (<Fragment key={`nz-chart-${chartIndex}-${themeName}`
        }>
            <ChartContainer
                uniqueName={`${thisChartRow?.ChartType}-${chartIndex}-${themeName}`}
                chartTheme={activeChartTheme}
                chartType={thisChartRow?.ChartType as "bar" | "line" | "pie" | 'area' | 'multibar' | 'radial-gauge'}
                SaveAsDataset={
                    function (_data: TChartRecord): void {
                        // if output format is data then it will return data set of chart
                    }
                }
                onPrint={
                    async function (_data: TChartRecord): Promise<void> {
                        const chartToPrint = (_data && typeof _data === 'object' && Object.keys(_data).length > 0) ? _data : thisChartRow;

                        const result = await FnCreateReportForPrint("Chart", statusBarContext, chartToPrint, undefined);
                        if (result && result.template) {
                            setReportTemplateJson(result.template);
                            setIsReportDialogOpen(true);
                        } else {
                            statusBarContext?.setUserActionData?.("Chart Report Template not found.");
                        }
                    }
                }
                onDoubleClick={(_data: TChartRecord, _title: string) => {
                    setSelectedCard([thisChartRow]);
                }}

                SaveAsExcel={
                    function (data: TChartRecord): void {

                        handlSaveAsDataset(data, thisChartRow?.title as string);
                    }
                }
                Fullscreen={
                    (data: TChartRecord) => {
                        handleChartFullscreen((data && typeof data === 'object') ? data : thisChartRow);
                    }
                }

                SaveAs={
                    async (data: {
                        className?: string;
                        dataURL?: string;
                    }) => {

                        if (data.className) {
                            // download png image
                            FnGetChartImageUrlsByClassName(data.className).then((url) => {
                                FnDownloadImageFromDataUrl(url, 'png', thisChartRow.title as string);
                            });
                        } else {
                            // chart png url data we can set as local state variable
                            const dataURL = data.dataURL;
                        }
                    }}
                outputFormat={'jsx'}
                ChartData={thisChartRow}
            />
        </Fragment>)

    }, [handlSaveAsDataset, handleChartFullscreen, themeName]);

    const handleContainerKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!containerRef.current) {
            return;
        }

        const focusableSelectors = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');

        const focusableElements = Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((element) => element.offsetParent !== null);

        if (!focusableElements.length) {
            return;
        }

        const activeIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        const currentIndex = activeIndex >= 0 ? activeIndex : 0;

        const moveFocusTo = (index: number) => {
            const boundedIndex = Math.max(0, Math.min(index, focusableElements.length - 1));
            focusableElements[boundedIndex]?.focus();
        };

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            moveFocusTo(currentIndex + 1);
            return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveFocusTo(currentIndex - 1);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            moveFocusTo(0);
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            moveFocusTo(focusableElements.length - 1);
        }
    }, []);

    const buildChartConfig = useCallback((chartProfile: TChartProfileRow) => {
        const parsedChartOptions = parseChartOptions(chartProfile.ChartOptions);

        if (isGroupedStackedChartProfile(chartProfile.ChartType, parsedChartOptions)) {
            return buildGroupedStackedChartConfig(chartProfile, parsedChartOptions);
        }

        const embeddedData = getEmbeddedSeriesData(parsedChartOptions);
        const chartData = extractApiChartRows(chartProfile?.ChartData ?? embeddedData);

        const effectiveChartType = chartProfile.ChartType || (parsedChartOptions.series?.[0]?.type as string) || "bar";
        const usedProvidedChartOptions = hasUsableSeriesConfig(parsedChartOptions.series, effectiveChartType);
        const firstDataRow = (chartData[0] && typeof chartData[0] === "object" && !Array.isArray(chartData[0]))
            ? chartData[0] as Record<string, unknown>
            : undefined;

        const providedSeriesKeysMatchData = usedProvidedChartOptions && !!firstDataRow && (parsedChartOptions.series ?? []).every((item) => {
            const metric = item as TSeriesRecord;
            const normalizedType = effectiveChartType.toLowerCase();
            if (normalizedType === "pie" || normalizedType === "donut") {
                return Boolean(resolveRowKey(firstDataRow, String(metric.angleKey ?? "")));
            }
            if (normalizedType === "radial-gauge") {
                return Boolean(resolveRowKey(firstDataRow, String(metric.value ?? metric.yKey ?? "")));
            }
            return Boolean(
                resolveRowKey(firstDataRow, String(metric.xKey ?? ""))
                && resolveRowKey(firstDataRow, String(metric.yKey ?? ""))
            );
        });

        // Use ChartOptions from the profile when series keys match API columns; otherwise build them from API data.
        const resolvedSeriesOptions: IChartOptions = providedSeriesKeysMatchData
            ? parsedChartOptions
            : buildChartOptionsFromApiData(chartData, chartProfile, parsedChartOptions);

        const isStacked = chartProfile.ChartType?.toLowerCase() === "stacked" || (resolvedSeriesOptions.series || []).some((s) => (s as TSeriesRecord)?.stacked || (s as TSeriesRecord)?.beginAtZero);
        const isBeginAtZero = Boolean(
            (resolvedSeriesOptions as Record<string, unknown>).beginAtZero ??
            (resolvedSeriesOptions.series || []).some((s) => (s as TSeriesRecord)?.beginAtZero)
        );

        let metricSeries = ((resolvedSeriesOptions.series || []) as TSeriesRecord[]);

        if (isStacked && metricSeries.length > 1) {
            // Sort series from small to bigger average value
            const metricAvgMap = new Map<string, number>();
            for (const metric of metricSeries) {
                const yKey = String(metric.yKey ?? "");
                if (!yKey) continue;
                const validValues = chartData
                    .map((r) => Number((r as Record<string, unknown>)?.[yKey]))
                    .filter((v) => !isNaN(v) && isFinite(v));
                const avg = validValues.length
                    ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length
                    : 0;
                metricAvgMap.set(yKey, avg);
            }

            metricSeries = [...metricSeries].sort((a, b) => {
                const avgA = metricAvgMap.get(String(a.yKey ?? "")) ?? 0;
                const avgB = metricAvgMap.get(String(b.yKey ?? "")) ?? 0;
                return avgA - avgB;
            });
        }

        const rawValueMap = new Map<string, unknown>();
        if (isStacked && isBeginAtZero && metricSeries.length > 1) {
            for (const row of chartData) {
                const rowObj = (row && typeof row === "object") ? row as Record<string, unknown> : {};
                const firstMetric = metricSeries[0];
                const xKey = String(firstMetric?.xKey ?? "");
                const xVal = String(rowObj[xKey] ?? "");
                for (const m of metricSeries) {
                    const mKey = String(m.yKey ?? "");
                    const rawVal = rowObj[mKey];
                    rawValueMap.set(`${xVal}::${mKey}`, rawVal);
                }
            }
        }

        const firstSeriesConfig = metricSeries[0] as TSeriesRecord | undefined;
        const typography = extractChartTypography(
            resolvedSeriesOptions as Record<string, unknown>,
            firstSeriesConfig
        );

        const series = metricSeries.map((s: TSeriesRecord) => {
            const resolvedXKey = firstDataRow ? resolveRowKey(firstDataRow, String(s.xKey ?? "")) : String(s.xKey ?? "");
            const resolvedYKey = firstDataRow ? resolveRowKey(firstDataRow, String(s.yKey ?? "")) : String(s.yKey ?? "");
            const yKey = String(resolvedYKey ?? s.yKey ?? "");
            const xKey = String(resolvedXKey ?? s.xKey ?? "");
            const resolvedAngleKey = firstDataRow && s.angleKey ? resolveRowKey(firstDataRow, String(s.angleKey)) : undefined;
            const resolvedCalloutKey = firstDataRow && s.calloutLabelKey ? resolveRowKey(firstDataRow, String(s.calloutLabelKey)) : undefined;
            const resolvedSectorKey = firstDataRow && s.sectorLabelKey ? resolveRowKey(firstDataRow, String(s.sectorLabelKey)) : undefined;
            const yName = String(s.yName ?? yKey);
            const seriesObj: TSeriesRecord = {
                ...stripChartTypography(s),
                ...(xKey ? { xKey } : {}),
                ...(yKey ? { yKey } : {}),
                ...(resolvedAngleKey ? { angleKey: resolvedAngleKey } : {}),
                ...(resolvedCalloutKey ? { calloutLabelKey: resolvedCalloutKey } : {}),
                ...(resolvedSectorKey ? { sectorLabelKey: resolvedSectorKey } : {}),
                ...(isStacked ? { stacked: s.stacked ?? true } : {}),
                ...(isBeginAtZero ? { beginAtZero: s.beginAtZero ?? isBeginAtZero } : {}),
                ...(s.xName !== undefined ? { xName: truncateAxisLabel(s.xName) } : {}),
                ...(s.yName !== undefined ? { yName: truncateAxisLabel(s.yName) } : {}),
                data: (Array.isArray(s.data) && s.data.length > 0 ? (s.data as unknown[]) : chartData).filter((row: unknown) => {
                    const rowData = (row && typeof row === "object") ? row as TChartRecord : {};
                    return (!xKey || rowData[xKey] !== undefined) && (!yKey || rowData[yKey] !== undefined);
                }).map((row: unknown) => {
                    const rowData = (row && typeof row === "object") ? { ...(row as TChartRecord) } : {};

                    if (isStacked && isBeginAtZero && metricSeries.length > 1) {
                        let prevVal = 0;
                        for (const m of metricSeries) {
                            const mKey = String(m.yKey ?? "");
                            const rawVal = (row as Record<string, unknown>)?.[mKey];
                            if (rawVal === undefined || rawVal === null) continue;
                            const numVal = Number(rawVal);
                            if (isNaN(numVal)) continue;
                            const delta = Math.max(0, numVal - prevVal);
                            if (mKey === yKey) {
                                rowData[yKey] = delta;
                                break;
                            }
                            prevVal = Math.max(prevVal, numVal);
                        }
                    }

                    if (xKey && rowData[xKey] !== undefined) {
                        rowData[xKey] = truncateAxisLabel(rowData[xKey]);
                    }
                    if (yKey && typeof rowData[yKey] === 'string') {
                        rowData[yKey] = truncateAxisLabel(rowData[yKey]);
                    }
                    if (s.calloutLabelKey && typeof rowData[String(s.calloutLabelKey)] === 'string') {
                        rowData[String(s.calloutLabelKey)] = truncateAxisLabel(rowData[String(s.calloutLabelKey)]);
                    }
                    if (s.sectorLabelKey && typeof rowData[String(s.sectorLabelKey)] === 'string') {
                        rowData[String(s.sectorLabelKey)] = truncateAxisLabel(rowData[String(s.sectorLabelKey)]);
                    }

                    return rowData;
                })
            };

            if (isStacked && isBeginAtZero && metricSeries.length > 1) {
                seriesObj.label = {
                    formatter: (params: { datum?: Record<string, unknown>; yKey?: string; value?: unknown }) => {
                        const xVal = String(params?.datum?.[xKey] ?? "");
                        const rawKey = `${xVal}::${yKey}`;
                        const rawVal = rawValueMap.get(rawKey);
                        if (rawVal !== undefined && rawVal !== null) {
                            return String(rawVal);
                        }
                        return params?.value != null ? String(params.value) : "";
                    }
                };
                seriesObj.tooltip = {
                    renderer: (params: { datum?: Record<string, unknown>; yKey?: string; yName?: string }) => {
                        const xVal = String(params?.datum?.[xKey] ?? "");
                        const rawKey = `${xVal}::${yKey}`;
                        const rawVal = rawValueMap.get(rawKey);
                        const displayVal = rawVal !== undefined && rawVal !== null ? rawVal : params?.datum?.[yKey];
                        return {
                            title: params?.yName ?? yName,
                            data: [
                                {
                                    label: params?.yName ?? yName,
                                    value: String(displayVal ?? ""),
                                }
                            ]
                        };
                    }
                };
            }

            return seriesObj;
        });

        const profileChartType = effectiveChartType.toLowerCase();
        const shouldUseMultiSeriesChart = !providedSeriesKeysMatchData
            && series.length > 1
            && (profileChartType === "bar" || profileChartType === "line");

        return {
            IsNZ: chartProfile.IsNZ ? 1 : 0,
            EntityName: "Dashboard",
            GroupName: chartProfile.GroupName,
            Description: chartProfile.Description,
            ChartType: profileChartType === "stacked" || shouldUseMultiSeriesChart ? "multibar" : profileChartType,
            SortOrder: chartProfile.SortOrder,
            Enabled: chartProfile.Enabled ? 1 : 0,
            noLabel: false,
            series: series,
            data: chartData,
            ChartData: chartData,
            ChartDatasetAPI: chartProfile.ChartDatasetAPI,
            title: truncateTitleOrSubtitle(resolvedSeriesOptions?.title ?? chartProfile._ChartProfile ?? "Default Title"),
            subtitle: truncateTitleOrSubtitle(resolvedSeriesOptions?.subtitle ?? chartProfile.Description ?? "Default Subtitle"),
            legend: resolvedSeriesOptions?.legend,
            _ChartProfile: chartProfile._ChartProfile,
            Name: (chartProfile as any)?.Name,
            CPName: (chartProfile as any)?.CPName,
            ChartOptions: chartProfile.ChartOptions,
            ...typography,
        };
    }, []);

    const apiCallForChartProfile = useCallback(async () => {
        if (chartProfileContext.ChartProfiles.length > 0) {
            return chartProfileContext.ChartProfiles;
        }

        const data = await new Promise<IChartProfileItem[]>((resolve, reject) => {
            try {
                axiosInterceptor(
                    {
                        url: EM.GetEntityRecords,
                        data: {
                            entityName: "ChartProfile",
                            entIDs: "",
                            tableName: `_ChartProfile`,
                            filterJsonString: null,
                            andor: "OR",
                            startRec: 0,
                            endRec: 0,
                        },
                        setFetchData: async (getEntityRecordsApiResponse: unknown, status?: string) => {
                            try {
                                if (
                                    status === "200" &&
                                    getEntityRecordsApiResponse &&
                                    typeof getEntityRecordsApiResponse === "string"
                                ) {
                                    const parsedData = FnHandleAPIResponse(
                                        getEntityRecordsApiResponse,
                                        "Dataset"
                                    );
                                    if (
                                        typeof parsedData === "object" &&
                                        parsedData !== null &&
                                        Array.isArray((parsedData as Record<string, unknown>)[`_ChartProfile`])
                                    ) {
                                        const chartProfiles = (parsedData as Record<string, unknown>)[`_ChartProfile`] as IChartProfileItem[];
                                        chartProfileContext.setChartProfiles(chartProfiles);
                                        resolve(chartProfiles);
                                        return;
                                    }
                                }
                                resolve([]); // fallback if invalid response
                            } catch (err) {
                                reject(err);
                            }
                        },
                    },
                    statusBarContext
                );
            } catch (err) {
                console.error("Error in GetEntityRecords:", err);
            }

        });

        return data;
    }, [chartProfileContext.ChartProfiles, chartProfileContext.setChartProfiles, statusBarContext]);

    const loadChartRecords = useCallback(async (
        requestId: number,
        isStale: () => boolean
    ) => {
        if (selectedChart !== '') {
            setSelectedCard('');
            setLoading(false);
            return;
        }

        setLoading(true);
        setChartRecords(undefined);

        try {
            const chartProfiles = await apiCallForChartProfile();
            if (isStale() || requestId !== chartFetchRequestIdRef.current) {
                return;
            }

            const reportRecords = chartProfiles;
            let chartDataSet: TChartProfileRow[] = [];
            if (ChartsProps.isDashboard === false) {
                const nodeEntityName = ChartsProps.selectedNode?.NodeEntityname || ChartsProps.selectedNode?.NodeType;
                if (nodeEntityName) {
                    const selectedNodeEntityName = nodeEntityName.toString().toLowerCase();
                    const entityNameWithoutUnderscore = selectedNodeEntityName.replace(/^_/, "");
                    chartDataSet = reportRecords.filter((item) => {
                        if (!item.EntityNames || !item.Enabled) {
                            return false;
                        }
                        const lowerEntities = item.EntityNames.toString().toLowerCase();
                        return (
                            lowerEntities.includes(selectedNodeEntityName) ||
                            lowerEntities.includes(entityNameWithoutUnderscore)
                        );
                    });
                    if (ChartsProps.purpose) {
                        chartDataSet = chartDataSet.filter((item) =>
                            item.Purpose?.toLowerCase() === ChartsProps.purpose?.toLowerCase()
                        );
                    } else {
                        chartDataSet = chartDataSet.filter((item) =>
                            item.Purpose?.toLowerCase() === "chart"
                        );
                    }
                }
            } else {
                chartDataSet = reportRecords.filter((item) =>
                    ChartsProps.featureId === FEnums.Dashboard
                        ? item.GroupName.toLowerCase() === "enterprise"
                        : item.Purpose?.toLowerCase() === "dashboard"
                );
            }
            if (!chartDataSet.length) {
                setChartRecords([]);
                return;
            }

            const chartProfileNames: string[] = [];
            for (const element of chartDataSet) {
                // If data key found inside ChartOptions -> series -> data, do not call api
                if (hasEmbeddedSeriesData(element.ChartOptions)) {
                    continue;
                }
                if (typeof element._ChartProfile === "string") {
                    chartProfileNames.push(element._ChartProfile);
                }
            }

            let parallelCallResp: Record<string, unknown[]> = {};
            if (chartProfileNames.length > 0) {
                const chartNames = [...new Set(chartProfileNames)].join(';');
                const response = await new Promise<unknown>((resolve, reject) => {
                    axiosInterceptor(
                        {
                            url: CHART.GetData,
                            data: { chartNames },
                            allowShowLoader: true,
                            setFetchData: (apiResponse: unknown, status?: string) => {
                                if (status === '200') {
                                    resolve(apiResponse);
                                } else {
                                    reject(new Error("Something went wrong"));
                                }
                            }
                        },
                        statusBarContext
                    ).catch(reject);
                });
                if (isStale() || requestId !== chartFetchRequestIdRef.current) {
                    return;
                }

                const mapChartsDynamically = (apiResponse: unknown) => {
                    const parsed = resolveChartDataPayload(apiResponse);
                    return parsed?.ChartDataSet?.reduce(
                        (acc: Record<string, unknown[]>, item: IChartDataSetItem) => {
                            if (!item?.CPName) return acc;
                            const rows = extractApiChartRows(item.ChartData);
                            const key = item.CPName.toLowerCase().startsWith('get') ? item.CPName.toLowerCase()
                                .replace(/[^a-z0-9]+/g, '_')
                                .replace(/^_|_$/g, '') : `get_${item.CPName
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '_')
                                    .replace(/^_|_$/g, '')}`;

                            acc[key] = rows;
                            return acc;
                        },
                        {}
                    );
                };

                const formattedResponse = mapChartsDynamically(response);
                parallelCallResp = formattedResponse || {};
            }

            const chartApiData: TChartProfileRow[] = [];

            for (const element of chartDataSet) {
                const embeddedData = getEmbeddedSeriesData(element.ChartOptions);
                if (embeddedData !== null) {
                    element.ChartData = embeddedData;
                    element.ChartData = buildChartConfig(element);
                    element._ChartProfile = (element._ChartProfile as string) || (element.ChartData as TChartRecord)?.title as string || "Chart";
                    chartApiData.push(element);
                    continue;
                }

                if (!element.ChartDatasetAPI) {
                    continue;
                }

                const matchedRows = findMatchingChartRows(parallelCallResp, element);

                if (matchedRows) {
                    element.ChartData = matchedRows;
                    element.ChartData = buildChartConfig(element);
                    element._ChartProfile = element._ChartProfile as string;
                    chartApiData.push(element);
                } else {
                    element.ChartData = null;
                    chartApiData.push(element);
                }
            }

            const records = chartApiData
                .map((thisChartRow) => thisChartRow.ChartData as TChartRecord | null)
                .filter((chartData): chartData is TChartRecord => !!chartData);

            setChartRecords(records);

            if (records.length > 0) {
                const chartPane = document.querySelectorAll(`.nz-device-view-container .${ChartsProps.parentClassName}.nz-chart-hidden`);
                chartPane.forEach(el => {
                    el.classList.remove('nz-chart-hidden');
                });
            }

            ChartsProps.handleFinishApiCall?.();
        } catch (error) {
            if (!isStale() && requestId === chartFetchRequestIdRef.current) {
                console.error("Error fetching data in ChartProfile:", error);
            }
        } finally {
            if (!isStale() && requestId === chartFetchRequestIdRef.current) {
                setLoading(false);
            }
        }
    }, [
        ChartsProps.featureId,
        ChartsProps.isDashboard,
        ChartsProps.purpose,
        ChartsProps.selectedNode?.NodeEntityname,
        ChartsProps.selectedNode?.NodeType,
        ChartsProps.parentClassName
    ]);

    useEffect(() => {
        if (!chartFetchKey) {
            return;
        }

        let cancelled = false;
        const requestId = ++chartFetchRequestIdRef.current;
        const isStale = () => cancelled || requestId !== chartFetchRequestIdRef.current;

        // Debounce so rapid tree selection changes only trigger one CHART.GetData call.
        const debounceTimer = window.setTimeout(() => {
            void loadChartRecords(requestId, isStale);
        }, 200);

        return () => {
            cancelled = true;
            clearTimeout(debounceTimer);
        };
    }, [chartFetchKey, loadChartRecords]);

    useEffect(() => {
        if (!chartRecords?.length) {
            setVisibleCharts([]);
            return;
        }

        setVisibleCharts(
            chartRecords?.map((thisChartRow, chartIndex) =>
                prepareCardChart(thisChartRow, chartTheme, chartIndex)
            )
        );
    }, [chartRecords, chartTheme, prepareCardChart]);

    useEffect(() => {
        if (selectedCard && Array.isArray(selectedCard)) {
            const myCharts: JSX.Element[] = selectedCard.map((thisChartRow: TChartRecord, chartIndex: number) => {
                return prepareCardChart({ ...thisChartRow, noLabel: false }, chartTheme, chartIndex)
            });
            setShowSelectedCard(myCharts)
        }
    }, [selectedCard, chartTheme, prepareCardChart])

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') {
                return;
            }
            if (fullscreenChart || document.fullscreenElement) {
                exitChartFullscreen();
                return;
            }
            if (selectedCard) {
                setSelectedCard(null);
                setShowSelectedCard(null);
            }
        };

        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [fullscreenChart, selectedCard, exitChartFullscreen]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setFullscreenChart(null);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        if (!loading && chartRecords?.length === 0) {
            ChartsProps.handleShowUserMessage?.("Charts data not found to display")
        }
    }, [chartRecords, loading, ChartsProps.handleShowUserMessage])


    const handleMouse = useCallback(() => {
        setSelectedCard(null);
        setShowSelectedCard(null);
    }, []);


    return (
        <>
            {commonVariableContext.diagnosticLevel === "4" ? <JsonViewer uniqueName={ChartsProps.uniqueName} jsonData={ChartsProps} /> :
                <>
                    {!ChartsProps.hideHeader && <div className="nz-form-title-bar nz-grid-container-header" >
                        <div className="nz-form-title-header nz-main-header-title" >
                            <div className='nz-property-main-header' >
                                <span className="nz-property-bar-title-span" >
                                    {ChartsProps.title}
                                </span>
                            </div>
                        </div >
                    </div>}
                    <div
                        className={((showSelectedCard && Array.isArray(showSelectedCard) && showSelectedCard?.length > 0)) ? 'nz-dashbord-main nz-selected' : 'nz-dashbord-main'}
                        tabIndex={1}
                        onKeyDown={handleContainerKeyDown}
                    >

                        {visibleCharts && Array.isArray(visibleCharts) && visibleCharts?.length ? <div ref={containerRef} className={`nz-dashbord-chart-container ${showSelectedCard && showSelectedCard?.length > 0 ? ('nz-dashbord-chart-selected') : ''}`}>
                            <Fragment key='nz-chart' >
                                <div key='nz' className={`nz-dashbord-chart  grid-cols-${visibleCharts.length < numberOfColumnsChart ? visibleCharts.length : numberOfColumnsChart}  ${(showSelectedCard && showSelectedCard?.length > 0) ? 'nz-hide-chart' : ''}`}>
                                    {visibleCharts}
                                </div>
                            </Fragment>

                            {showSelectedCard && showSelectedCard?.length > 0 && (
                                <div className='nz-dashbord-chart-sigle'>
                                    <div className={`${ChartsProps.uniqueName === `chart-for-rtm-${ChartsProps.featureId}` ? ("nz-dashbord-chart-closeSelectedCard") : 'dashboard-chart-close'}`}>
                                        <ActionImage
                                            image={
                                                {
                                                    uniqueName: "cancel",
                                                    source: <Close24x24
                                                        size={20}
                                                        fill='none'
                                                        strokeWidth={1.5} />,
                                                    type: "svg",
                                                    w: "20px",
                                                    h: "20px",
                                                    tooltip: "Close Chart"
                                                }
                                            }
                                            uniqueName='cancelIcon'
                                            actionCode='cancel'
                                            w='20px'
                                            h='20px'
                                            handleMouse={handleMouse}
                                        />
                                    </div>
                                    {showSelectedCard}
                                </div>
                            )}

                        </div> : <span className={`nz-wh-100 nz-d-flex-hv-left`}>{loading ? "Loading..." : "No Charts to display"}</span >}

                    </div >
                    {fullscreenChart && (
                        <div
                            ref={fullscreenContainerRef}
                            className="nz-dashbord-chart-fullscreen"
                        >
                            <div className="nz-dashbord-chart-fullscreen-close">
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
                                        tooltip: "Exit Fullscreen (Esc)"
                                    }}
                                    uniqueName='fullscreenCancelIcon'
                                    actionCode='cancel'
                                    w='var(--node_height)'
                                    handleMouse={exitChartFullscreen}
                                />
                            </div>
                            <div className="nz-dashbord-chart-fullscreen-content">
                                {prepareCardChart(fullscreenChart, chartTheme, -1)}
                            </div>
                        </div>
                    )}
                    <GeneratePdf
                        uniqueName={`${ChartsProps.uniqueName}-chart-report`}
                        isOpen={isReportDialogOpen}
                        container={document.fullscreenElement === fullscreenContainerRef.current
                            ? fullscreenContainerRef.current as HTMLElement
                            : undefined}
                        reportJson={reportTemplateJson}
                        title="Chart Report"
                        onClose={() => {
                            setIsReportDialogOpen(false);
                            setReportTemplateJson(null);
                        }}
                    />
                </>}
        </>
    )
}
export { DashboardChart }

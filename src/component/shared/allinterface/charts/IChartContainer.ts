

interface IChartContainer {
    uniqueName: string;
    chartTheme: unknown; // Theme for the chart
    chartType: "bar" | "line" | "pie" | 'area' | 'multibar' | 'radial-gauge'; // Type of the chart
    outputFormat: 'data' | "jsx" | 'png' | 'svg'
    ChartData: Record<string, unknown>;// dataset to make chart.  
    allowHeader?: boolean
    tabIndex?: string | number;
    SaveAsDataset?: (data: Record<string, unknown>) => void
    onDoubleClick?: (data: Record<string, unknown>, title: string) => void; // Function to handle double click on the chart
    Fullscreen?: (data: Record<string, unknown>) => void // hide icon if not provided
    SaveAsExcel?: (data: Record<string, unknown>) => void   //hide icon if not provided
    SaveAs?: (data: {
        className?: string;
        dataURL?: string;
    }) => void     //hide icon if not provided
    onPrint?: (data: Record<string, unknown>) => void     //hide icon if not provided
}

interface IChartCaption {
    text?: string;
    fontSize?: number;
    /** Alias used in ChartOptions JSON (`font` instead of `fontSize`). */
    font?: number;
}
// Props used to resolve title, subtitle, legend, label, and axis font sizes.
type ChartFontProps = {
    title?: string | IChartCaption;
    subtitle?: string | IChartCaption;
    titleFontSize?: number;
    subtitleFontSize?: number;
    legendFontSize?: number;
    labelFontSize?: number;
    /** Color for series data labels (bar/line/area value text). */
    labelColor?: string;
    axisLabelFontSize?: number;
    axisTitleFontSize?: number;
    legend?: ILegendLabel;
    noLabel?: boolean;
};

interface IChartProfile {
    uniqueName: string;      //unique name of the chart
    chartTheme: unknown;    //?? what is the theme of the chart
    title: string | IChartCaption;           //only one
    subtitle?: string | IChartCaption;        //only one like text: 'sub title here' 
    ChartClassName?: string;
    noLabel?: boolean;
    /** Disables AG Charts animation (used for png/svg memory-url export). */
    disableAnimation?: boolean;
    onDoubleClick?: () => void; // function to handle double click on chart
    titleFontSize?: number;
    subtitleFontSize?: number;
    legendFontSize?: number;
    labelFontSize?: number;
    /** Color for series data labels (bar/line/area value text). */
    labelColor?: string;
    axisLabelFontSize?: number;
    /** Font size for x/y axis title text (e.g. xName, yName). */
    axisTitleFontSize?: number;
}

interface IChartTypographyProps {
    titleFontSize?: number;
    subtitleFontSize?: number;
    legendFontSize?: number;
    labelFontSize?: number;
    /** Color for series data labels (bar/line/area value text). */
    labelColor?: string;
    axisLabelFontSize?: number;
    axisTitleFontSize?: number;
}

interface ISeries {
    xKey: string;           //The property (name in json) to used for plotting X axis
    xName: string;          //xKey is also tooltip; instead you can provide xName for tooltip 
    yKey: string;           //The property (name in json) to used for plotting Y axis
    yName: string;          //yKey is also tooltip; instead you can provide yName for tooltip  
    data: { [key: string]: unknown }[];    //json of chart data
    legendposition?: string; //you can provide legend position like 'bottom' | 'right';
}
interface IAreaSeries {
    xKey: string;           //The property (name in json) to used for plotting X axis
    xName?: string;          //xKey is also tooltip; instead you can provide xName for tooltip 
    yKey?: string;           //The property (name in json) to used for plotting Y axis
    yName?: string;          //yKey is also tooltip; instead you can provide yName for tooltip  
    legendposition?: string; //you can provide legend position like 'bottom' | 'right';
}

interface ILegendLabel {
    label: string;          //label for the legend
    color?: string;          //color of the legend
    fontWeight?: string;     //font weight of the legend
    fontSize?: string;      //optional font size of the legend
}

interface IBasicChart extends IChartProfile    //'line', 'bar'
{
    charttype: string;    // e.g., 'line', 'bar'
    direction?: "vertical" | "horizontal",
    series?: ISeries;      //array of series
    legend?: ILegendLabel; //also used as calloutlabel for pie chart
}

interface IMultiSeriesChart extends IChartProfile //like multi bar, multiline or mixed line and bar or stacked bar
{
    series?: ISeries[];      //array of series
    legend?: ILegendLabel; //also used as calloutlabel for pie chart
}

interface IPieChart extends IChartProfile {
    charttype: string;    // e.g., 'line', 'bar'
    angleKey: string;               //property representing the pie         
    series?: ISeries;      //array of series
    legend?: ILegendLabel; //also used as calloutlabel for pie chart
    sectorLabel?: string;
    sectorLabelKey?: string;
    calloutLabelKey?: string;
}


interface IAreaChart extends IChartProfile {
    charttype: string;
    series?: ISeries[];
}

interface RadialGaugeSeries {
    value: number;
    min?: number;
    max?: number;
    interval?: any; // { step?, count?, values? }
    yKey: string;
    data: Record<string, any>[];

}
interface IRadialGaugeChart extends IChartProfile {
    series: RadialGaugeSeries;
}


interface INumberChart extends IChartProfile {
    value: number;
    fontSize?: number;
}


interface IDialChart extends IChartProfile {
    value: number; // Number to display inside the dial
    max: number;   // Maximum value for the dial
    size?: number; // Diameter of the SVG
}


export type { IChartContainer, IChartCaption, ChartFontProps, IChartProfile, IChartTypographyProps, ISeries, ILegendLabel, IBasicChart, IMultiSeriesChart, IPieChart, IAreaChart, IAreaSeries, IRadialGaugeChart, INumberChart, IDialChart }

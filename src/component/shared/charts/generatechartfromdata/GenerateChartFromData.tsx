import { createRoot } from "react-dom/client";
import { registerAgCharts } from '@n20a/libchart'
registerAgCharts()
import { ChartContainer } from "../chartcontainer/ChartContainer";
import '../../allcss/charts/GenerateChartFromData.css'

const EXPORT_TIMEOUT_MS = 15000;
const MEMORY_EXPORT_FONT_SIZE = 32;

/** Applies export typography defaults for off-screen chart memory URLs. */
const withMemoryExportTypography = (chartData: Record<string, unknown>): Record<string, unknown> => {
    const legend =
        chartData.legend && typeof chartData.legend === "object"
            ? {
                ...(chartData.legend as Record<string, unknown>),
                fontSize: String(MEMORY_EXPORT_FONT_SIZE),
            }
            : chartData.legend;

    return {
        ...chartData,
        titleFontSize: MEMORY_EXPORT_FONT_SIZE,
        subtitleFontSize: MEMORY_EXPORT_FONT_SIZE,
        legendFontSize: MEMORY_EXPORT_FONT_SIZE,
        labelFontSize: MEMORY_EXPORT_FONT_SIZE,
        axisLabelFontSize: MEMORY_EXPORT_FONT_SIZE,
        axisTitleFontSize: MEMORY_EXPORT_FONT_SIZE,
        legend,
    };
};

/** Renders a chart off-screen and resolves with a PNG blob memory URL once it has painted. */
const GenerateChartFromData = (chartData: any, chartType: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        let settled = false;
        const exportChartData = withMemoryExportTypography(
            chartData && typeof chartData === "object" ? chartData : {}
        );
        const container = document.createElement("div");
        container.className = "nz-chart-memory-host";
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = "1800px";
        container.style.height = "900px";
        container.style.overflow = "hidden";
        document.body.appendChild(container);

        const root = createRoot(container);

        const cleanup = () => {
            try {
                root.unmount();
            } catch {
                // ignore unmount races
            }
            container.remove();
        };

        const finish = (url: string) => {
            if (settled) {
                return;
            }
            settled = true;
            window.clearTimeout(timeoutId);
            cleanup();
            resolve(url);
        };

        const fail = (error: unknown) => {
            if (settled) {
                return;
            }
            settled = true;
            window.clearTimeout(timeoutId);
            cleanup();
            reject(error instanceof Error ? error : new Error(String(error)));
        };

        const timeoutId = window.setTimeout(() => {
            const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
            if (canvas && typeof canvas.toDataURL === "function") {
                try {
                    const dataUrl = canvas.toDataURL("image/png");
                    if (dataUrl && dataUrl.length > 100) {
                        finish(dataUrl);
                        return;
                    }
                } catch {
                    // ignore error
                }
            }
            fail(new Error(`Timed out generating chart image for type: ${chartType}`));
        }, EXPORT_TIMEOUT_MS);

        try {
            root.render(
                <div className='nz-chart-memory-url'>
                    <ChartContainer
                        uniqueName={`${String(chartType ?? 'chart')}-tmp`}
                        chartTheme={{}}
                        chartType={chartType}
                        ChartData={exportChartData}
                        outputFormat="png"
                        SaveAs={(data) => {
                            const url = data.dataURL ?? "";
                            if (!url) {
                                fail(new Error('Chart export returned an empty image URL'));
                                return;
                            }
                            finish(url);
                        }}
                    />
                </div>
            );
        } catch (error) {
            fail(error);
        }
    });
}

export { GenerateChartFromData }

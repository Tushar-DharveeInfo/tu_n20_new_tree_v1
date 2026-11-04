import { createRoot } from "react-dom/client";
import { ResponsiveDeviceView } from "../responsivedeviceview/ResponsiveDeviceView";
import { IResponsiveDeviceView } from "../../allinterface/deviceview/IResponsiveDeviceView";

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 2400;
const RENDER_SIZE = 1800;
const EXPORT_TIMEOUT_MS = 15000;

const waitForSvgInContainer = (
    container: HTMLElement,
    timeoutMs: number
): Promise<SVGSVGElement> =>
    new Promise((resolve, reject) => {
        const started = Date.now();

        const check = () => {
            const svg = container.querySelector("svg");
            if (svg instanceof SVGSVGElement) {
                const contentNode = getContentSvgElement(svg);
                const bbox = contentNode.getBBox();
                if (bbox.width > 0 && bbox.height > 0) {
                    resolve(svg);
                    return;
                }
            }

            if (Date.now() - started > timeoutMs) {
                reject(new Error("Timed out waiting for device view SVG"));
                return;
            }

            requestAnimationFrame(check);
        };

        check();
    });

const getContentSvgElement = (svg: SVGSVGElement): SVGGraphicsElement => {
    const svgBody = svg.querySelector("#SVGBody");
    if (svgBody instanceof SVGGraphicsElement) {
        return svgBody;
    }

    const firstGroup = svg.querySelector("g");
    if (firstGroup instanceof SVGGraphicsElement) {
        return firstGroup;
    }

    return svg;
};

const buildExportSvgString = (
    svg: SVGSVGElement,
    width: number,
    height: number
): string => {
    const contentNode = getContentSvgElement(svg);
    const bbox = contentNode.getBBox();
    const viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;

    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute("viewBox", viewBox);
    clonedSvg.setAttribute("width", String(width));
    clonedSvg.setAttribute("height", String(height));
    clonedSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    clonedSvg.removeAttribute("transform");
    clonedSvg.style.background = "transparent";

    return new XMLSerializer().serializeToString(clonedSvg);
};

const svgStringToPngUrl = (svgString: string, width: number, height: number): Promise<string> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                URL.revokeObjectURL(svgUrl);
                reject(new Error("Canvas not supported"));
                return;
            }

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(svgUrl);
                if (!blob) {
                    reject(new Error("PNG conversion failed"));
                    return;
                }
                resolve(URL.createObjectURL(blob));
            }, "image/png");
        };

        img.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            reject(new Error("SVG load failed"));
        };

        img.src = svgUrl;
    });

const exportRenderedDeviceView = async (container: HTMLElement): Promise<string> => {
    const svg = await waitForSvgInContainer(container, EXPORT_TIMEOUT_MS);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const exportSvg = buildExportSvgString(svg, CANVAS_WIDTH, CANVAS_HEIGHT);
    return svgStringToPngUrl(exportSvg, CANVAS_WIDTH, CANVAS_HEIGHT);
};

const GenerateViewFromData = (viewData: IResponsiveDeviceView): Promise<string> =>
    new Promise((resolve, reject) => {
        let settled = false;

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "0";
        container.style.top = "0";
        container.style.width = `${RENDER_SIZE}px`;
        container.style.height = `${RENDER_SIZE}px`;
        container.style.opacity = "0";
        container.style.pointerEvents = "none";
        container.style.zIndex = "-1";
        container.style.overflow = "hidden";
        container.style.background = "transparent";
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
            fail(new Error("Timed out generating device view image"));
        }, EXPORT_TIMEOUT_MS);

        root.render(
            <div
                className="nz-generate-view-export-host"
                style={{ width: "100%", height: "100%" }}
            >
                <style>{`
                    .nz-generate-view-export-host .nz-devicePreview-div {
                        width: 100% !important;
                        height: 100% !important;
                        padding: 0 !important;
                    }
                    .nz-generate-view-export-host .react-transform-wrapper,
                    .nz-generate-view-export-host .react-transform-component,
                    .nz-generate-view-export-host .nz-img-container {
                        width: 100% !important;
                        height: 100% !important;
                    }
                    .nz-generate-view-export-host .nz-img-container svg {
                        width: 100% !important;
                        height: 100% !important;
                        display: block;
                    }
                    .nz-generate-view-export-host .nz-devicepreviw-label {
                        display: none;
                    }
                `}</style>
                <ResponsiveDeviceView
                    imageSource={viewData.imageSource}
                    label={viewData.label}
                    uniqueName={`${viewData.uniqueName}-tmp`}
                    selectedDeviceViewId={viewData.selectedDeviceViewId}
                    selectedNode={viewData.selectedNode}
                    outputFormat="JSX"
                    selectedTabName={viewData.selectedTabName ?? ""}
                    tabName={viewData.tabName ?? ""}
                />
            </div>
        );

        void exportRenderedDeviceView(container).then(finish).catch(fail);
    });

export { GenerateViewFromData };

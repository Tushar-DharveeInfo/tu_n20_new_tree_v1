import html2canvas from "html2canvas";
import { IBsDiagram } from "../../allinterface/it/IBsDiagram";
import { RenderBsDiagramContainer } from "../../../features/it/BsDiagram";
import { createMapObjectURL } from "../generatenetworktracefromdata/GenerateNetworkTraceFromData";

interface MapSVGObject {
    svg: string;
    width: number;
    height: number;
    timestamp: number;
}

const createMapSVGObject = async (
    mapElement: HTMLElement
): Promise<MapSVGObject> => {
    if (!mapElement) {
        throw new Error("Map element is required");
    }

    const rect = mapElement.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
        throw new Error("Map element has invalid dimensions");
    }

    const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    if (!imgData || imgData === "data:,") {
        throw new Error("Failed to generate image data from canvas");
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}">
            <image width="${rect.width}" height="${rect.height}" xlink:href="${imgData}"/>
        </svg>`;

    return {
        svg,
        width: rect.width,
        height: rect.height,
        timestamp: Date.now(),
    };
};

const createBsDiagramOffscreen = async (
    props: IBsDiagram,
    width: number = 800,
    height: number = 600
): Promise<MapSVGObject> => {
    if (width <= 0 || height <= 0) {
        throw new Error("Width and height must be positive numbers");
    }

    if (!props.selectedNode?.NodeEntID && !props.selectedNode?.EntID) {
        throw new Error("BsDiagram requires selectedNode to render");
    }

    const container = document.createElement("div");
    container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${width}px;
    height: ${height}px;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
  `;

    document.body.appendChild(container);

    let unmount: (() => void) | undefined;

    try {
        await new Promise<void>((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                reject(new Error("BsDiagram render timed out waiting for onRendered"));
            }, 20000);

            const handle = RenderBsDiagramContainer(container, {
                ...props,
                onRendered: () => {
                    window.clearTimeout(timeoutId);
                    resolve();
                },
            });
            unmount = handle.unmount;
        });

        const diagramContainer =
            (container.querySelector(".nz-wh-100") as HTMLElement | null) ?? container;

        diagramContainer.style.width = `${width}px`;
        diagramContainer.style.height = `${height}px`;

        let attempts = 0;
        const maxAttempts = 16;
        while (attempts < maxAttempts) {
            const treeSvg = diagramContainer.querySelector("svg");
            const treeCanvas = diagramContainer.querySelector("canvas");
            const treeImages = diagramContainer.querySelectorAll("img");

            if (treeSvg || treeCanvas || treeImages.length > 0) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
            attempts++;
        }

        const rect = diagramContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            throw new Error(`BsDiagram container has invalid dimensions: ${rect.width}x${rect.height}`);
        }

        return await createMapSVGObject(diagramContainer);
    } finally {
        try {
            unmount?.();
        } catch (cleanupError) {
            console.error("Error unmounting offscreen BsDiagram:", cleanupError);
        }
        try {
            document.body.removeChild(container);
        } catch (cleanupError) {
            console.error("Error removing offscreen BsDiagram container:", cleanupError);
        }
    }
};

const GenerateBsDiagramFromData = async (props: IBsDiagram) => {
    try {
        const svgObject = await createBsDiagramOffscreen(props, 1800, 900);
        if (!svgObject?.svg) {
            throw new Error("Failed to create BS diagram SVG object");
        }

        const { url } = await createMapObjectURL(svgObject);
        if (!url) {
            throw new Error("Failed to create memory URL");
        }

        return url;
    } catch (error) {
        console.error("Error creating BS diagram memory URL:", error);
        return "";
    }
};

export { GenerateBsDiagramFromData };

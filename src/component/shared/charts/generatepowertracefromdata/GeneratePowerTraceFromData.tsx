import html2canvas from "html2canvas";
import { IPowerTrace } from "../../allinterface/cabling/IPowerTrace";
import { createMapObjectURL } from "../generatenetworktracefromdata/GenerateNetworkTraceFromData";
import { RenderPowerTraceContainer } from "../../../features/cabling/powertrace/PowerTrace";

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
        throw new Error('Map element is required');
    }

    const rect = mapElement.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
        throw new Error('Map element has invalid dimensions');
    }

    let canvas: HTMLCanvasElement | null = null;

    try {
        canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
        });

        if (!canvas) {
            throw new Error('Failed to create canvas from map element');
        }

        const imgData = canvas.toDataURL('image/png');

        if (!imgData || imgData === 'data:,') {
            throw new Error('Failed to generate image data from canvas');
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
    } catch (error) {
        console.error('Error in createMapSVGObject:', error);
        throw error instanceof Error
            ? error
            : new Error('Unknown error occurred while creating map SVG object');
    }
};

const createPowerTraceOffscreen = async (
    props: IPowerTrace,
    width: number = 800,
    height: number = 600
): Promise<MapSVGObject> => {
    if (width <= 0 || height <= 0) {
        console.error('Width and height must be positive numbers');
    }

    if (!props.ApiData && !props.selectedNode?.node?.NodeEntID) {
        console.error('PowerTrace requires ApiData or selectedNode to render');
    }

    const container = document.createElement('div');
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

    container.setAttribute('data-offscreen-map', 'true');
    document.body.appendChild(container);

    let unmount: (() => void) | undefined;

    try {
        // Wait until PowerTrace has ApiData → D3Tree painted (onRendered fires ~1s after jsonData)
        await new Promise<void>((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                reject(new Error('PowerTrace render timed out waiting for onRendered'));
            }, 20000);

            const handle = RenderPowerTraceContainer(container, {
                ...props,
                onRendered: () => {
                    window.clearTimeout(timeoutId);
                    resolve();
                },
            });
            unmount = handle.unmount;
        });

        const powerTraceContainer = container.querySelector('.nz-power-trace') as HTMLElement;

        if (!powerTraceContainer) {
            throw new Error('powerTraceContainer not found after rendering');
        }

        powerTraceContainer.style.width = `${width}px`;
        powerTraceContainer.style.height = `${height}px`;

        // D3Tree renders SVG; wait briefly for layout/icons if needed
        let attempts = 0;
        const maxAttempts = 16;

        while (attempts < maxAttempts) {
            const treeSvg = powerTraceContainer.querySelector('svg');
            const treeCanvas = powerTraceContainer.querySelector('canvas');
            const treeImages = powerTraceContainer.querySelectorAll('img');

            if (treeSvg || treeCanvas || treeImages.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        const rect = powerTraceContainer.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            throw new Error(`powerTraceContainer has invalid dimensions: ${rect.width}x${rect.height}`);
        }

        return await createMapSVGObject(powerTraceContainer);
    } catch (error) {
        console.error('Error creating offscreen map:', error);
        throw error instanceof Error
            ? error
            : new Error('Unknown error occurred while creating offscreen map');
    } finally {
        try {
            unmount?.();
        } catch (cleanupError) {
            console.error('Error unmounting offscreen PowerTrace:', cleanupError);
        }
        try {
            document.body.removeChild(container);
        } catch (cleanupError) {
            console.error('Error removing offscreen container:', cleanupError);
        }
    }
};

const GeneratePowerTraceFromData = async (props: IPowerTrace) => {
    let returnUrl: string = '';
    const createMap = async () => {
        try {
            const svgObject: MapSVGObject = await createPowerTraceOffscreen(props, 1800, 900);

            if (!svgObject || !svgObject.svg) {
                throw new Error("Failed to create map SVG object");
            }

            const { url } = await createMapObjectURL(svgObject);

            if (!url) {
                throw new Error("Failed to create memory URL");
            }

            return url ?? "";

        } catch (error) {
            console.error("Error creating map object:", error);
            return ''
        }
    };


    returnUrl = await createMap();
    return returnUrl;

};

export { GeneratePowerTraceFromData }

import html2canvas from "html2canvas";
import { INetworkTrace } from "../../allinterface/cabling/INetworkTrace";
import { RenderNetoworkTraceContainer } from "../../../features/cabling/networktrace/NetworkTrace";

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

const createNetworkTraceOffscreen = async (
    props: INetworkTrace,
    width: number = 800,
    height: number = 600
): Promise<MapSVGObject> => {
    if (width <= 0 || height <= 0) {
        console.error('Width and height must be positive numbers');
    }

    if (!props.ApiData && !props.selectedNode?.node?.NodeEntID) {
        console.error('NetworkTrace requires ApiData or selectedNode to render');
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
        // Wait until NetworkTrace has ApiData → diagram painted (onRendered fires ~1s after jsonData)
        await new Promise<void>((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                reject(new Error('NetworkTrace render timed out waiting for onRendered'));
            }, 20000);

            const handle = RenderNetoworkTraceContainer(container, {
                ...props,
                onRendered: () => {
                    window.clearTimeout(timeoutId);
                    resolve();
                },
            });
            unmount = handle.unmount;
        });

        const networkTraceContainer = container.querySelector('.nz-network-trace') as HTMLElement;

        if (!networkTraceContainer) {
            throw new Error('Networktrace not found after rendering');
        }

        networkTraceContainer.style.width = `${width}px`;
        networkTraceContainer.style.height = `${height}px`;

        // NetworkDiagram renders SVG; wait briefly for layout/icons if needed
        let attempts = 0;
        const maxAttempts = 16;

        while (attempts < maxAttempts) {
            const treeSvg = networkTraceContainer.querySelector('svg');
            const treeCanvas = networkTraceContainer.querySelector('canvas');
            const treeImages = networkTraceContainer.querySelectorAll('img');

            if (treeSvg || treeCanvas || treeImages.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        const rect = networkTraceContainer.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            throw new Error(`networkTraceContainer has invalid dimensions: ${rect.width}x${rect.height}`);
        }

        return await createMapSVGObject(networkTraceContainer);
    } catch (error) {
        console.error('Error creating offscreen map:', error);
        throw error instanceof Error
            ? error
            : new Error('Unknown error occurred while creating offscreen map');
    } finally {
        try {
            unmount?.();
        } catch (cleanupError) {
            console.error('Error unmounting offscreen NetworkTrace:', cleanupError);
        }
        try {
            document.body.removeChild(container);
        } catch (cleanupError) {
            console.error('Error removing offscreen container:', cleanupError);
        }
    }
};
export const createMapObjectURL = async (
    mapObject: MapSVGObject
): Promise<{ url: string; release: () => void }> => {
    if (!mapObject || !mapObject.svg) {
        throw new Error('Invalid map object: SVG data is required');
    }

    if (typeof mapObject.svg !== 'string' || mapObject.svg.length === 0) {
        throw new Error('Invalid SVG data: must be a non-empty string');
    }

    let pngUrl: string | null = null;
    let isReleased = false;

    try {
        const svgBlob = new Blob([mapObject.svg], {
            type: 'image/svg+xml;charset=utf-8',
        });

        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();

        const loadImage = () =>
            new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = svgUrl;
            });

        await loadImage();

        const canvas = document.createElement('canvas');
        const width = img.width || 300;
        const height = img.height || 300;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas not supported');
        }

        ctx.drawImage(img, 0, 0, width, height);

        //  Convert to PNG blob URL
        const pngBlob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) reject('PNG conversion failed');
                else resolve(blob);
            }, 'image/png');
        });

        pngUrl = URL.createObjectURL(pngBlob);

        // cleanup SVG URL
        URL.revokeObjectURL(svgUrl);

        const release = () => {
            if (isReleased) {
                console.warn('URL already released');
                return;
            }

            if (pngUrl) {
                URL.revokeObjectURL(pngUrl);
                isReleased = true;
            }
        };

        return { url: pngUrl, release };
    } catch (error) {
        if (pngUrl) {
            URL.revokeObjectURL(pngUrl);
        }

        console.error('Error in createMapObjectURL:', error);
        throw error instanceof Error
            ? error
            : new Error('Unknown error occurred while creating PNG URL');
    }
};

const GenerateNetworkTraceFromData = async (props: INetworkTrace) => {
    let returnUrl: string = '';
    const createMap = async () => {
        try {
            const svgObject: MapSVGObject = await createNetworkTraceOffscreen(props, 1800, 900);

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

export { GenerateNetworkTraceFromData }

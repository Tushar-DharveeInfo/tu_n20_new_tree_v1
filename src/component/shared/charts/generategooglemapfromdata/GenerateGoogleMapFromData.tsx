
import { RenderGoogleMapContainer } from "../../../features/home/googlemap/GoogleMap";
import { IGoogleMap } from "../../allinterface/IGoogleMap";
import html2canvas from 'html2canvas';
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

const createMapOffscreen = async (
    GoogleMapProps: IGoogleMap,
    width: number = 800,
    height: number = 600
): Promise<MapSVGObject> => {
    if (width <= 0 || height <= 0) {
        throw new Error('Width and height must be positive numbers');
    }

    if (!GoogleMapProps.selectedNodeInfo) {
        throw new Error('GoogleMap requires selectedNodeInfo to render');
    }

    if (!GoogleMapProps.statusBarContext) {
        throw new Error('GoogleMap requires statusBarContext to render');
    }

    // Create container overlay (must be in viewport for Google Maps to render)
    // Note: Cannot use z-index: -1 as it causes height: 0
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
        // Wait until GoogleMap finishes loading and calls onRendered
        await new Promise<void>((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                reject(new Error('GoogleMap render timed out waiting for onRendered'));
            }, 60000);

            const handle = RenderGoogleMapContainer(container, {
                ...GoogleMapProps,
                onRendered: () => {
                    window.clearTimeout(timeoutId);
                    resolve();
                },
            });
            unmount = handle.unmount;
        });

        const gmapContainer = container.querySelector('.nz-home-map-iframe') as HTMLElement;

        if (!gmapContainer) {
            throw new Error('gmapcontainer not found after rendering');
        }

        gmapContainer.style.width = `${width}px`;
        gmapContainer.style.height = `${height}px`;

        // Wait for Google Maps canvas/tiles if present
        let attempts = 0;
        const maxAttempts = 16;

        while (attempts < maxAttempts) {
            const mapCanvas = gmapContainer.querySelector('canvas');
            const mapImages = gmapContainer.querySelectorAll('img');

            if (mapCanvas || mapImages.length > 5) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        const rect = gmapContainer.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            throw new Error(`gmapcontainer has invalid dimensions: ${rect.width}x${rect.height}`);
        }

        return await createMapSVGObject(gmapContainer);
    } catch (error) {
        console.error('Error creating offscreen map:', error);
        throw error instanceof Error
            ? error
            : new Error('Unknown error occurred while creating offscreen map');
    } finally {
        try {
            unmount?.();
        } catch (cleanupError) {
            console.error('Error unmounting offscreen GoogleMap:', cleanupError);
        }
        try {
            document.body.removeChild(container);
        } catch (cleanupError) {
            console.error('Error removing offscreen container:', cleanupError);
        }
    }
};


const GenerateGoogleMapFromData = async (props: IGoogleMap) => {
    let returnUrl: string = '';
    const createMap = async () => {
        try {
            const svgObject: MapSVGObject = await createMapOffscreen(props, 1800, 900);

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

export { GenerateGoogleMapFromData }

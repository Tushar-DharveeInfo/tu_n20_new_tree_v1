import html2canvas from 'html2canvas';
import { RenderEditFloorLayoutContainer } from "../../../features/plan/editfloorlayout/EditFloorLayout";
import { IEditFloorLayout } from "../../allinterface/plan/IEditFloorLayout";
import { createMapObjectURL } from '../generatenetworktracefromdata/GenerateNetworkTraceFromData';

interface MapSVGObject {
    svg: string;
    width: number;
    height: number;
    timestamp: number;
}

const FLOOR_LAYOUT_CONTAINER_SELECTOR = '.nz-edit-floor-layout-container';
const CONTAINER_WAIT_TIMEOUT_MS = 30000;
const CONTAINER_POLL_MS = 250;
const RENDER_SETTLE_MS = 1000;

/** Dedupes concurrent GenerateFloorLayoutFromData calls for the same floor node. */
const inFlightByKey = new Map<string, Promise<string>>();

const waitForFloorLayoutContainer = async (
    root: HTMLElement,
    timeoutMs: number = CONTAINER_WAIT_TIMEOUT_MS
): Promise<HTMLElement | null> => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const found = root.querySelector(FLOOR_LAYOUT_CONTAINER_SELECTOR) as HTMLElement | null;
        if (found) {
            return found;
        }
        await new Promise((resolve) => setTimeout(resolve, CONTAINER_POLL_MS));
    }

    return null;
};

const createMapSVGObject = async (
    mapElement: HTMLElement
): Promise<MapSVGObject> => {
    if (!mapElement) {
        throw new Error('Floor layout element is required');
    }

    const rect = mapElement.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
        throw new Error('Floor layout element has invalid dimensions');
    }

    try {
        const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
        });

        if (!canvas) {
            throw new Error('Failed to create canvas from floor layout element');
        }

        const imgData = canvas.toDataURL('image/png');

        if (!imgData || imgData === 'data:,') {
            throw new Error('Failed to generate image data from floor layout canvas');
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
            : new Error('Unknown error occurred while creating floor layout SVG object');
    }
};

const createFloorLayoutOffscreen = async (
    FloorLayoutProps: IEditFloorLayout,
    width: number = 800,
    height: number = 600
): Promise<MapSVGObject> => {
    if (width <= 0 || height <= 0) {
        throw new Error('Width and height must be positive numbers');
    }

    // Offscreen host must stay in the viewport so Konva can measure/layout.
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

    container.setAttribute('data-offscreen-floor-layout', 'true');
    document.body.appendChild(container);

    let unmount: (() => void) | undefined;

    try {
        const handle = RenderEditFloorLayoutContainer(container, FloorLayoutProps);
        unmount = handle.unmount;

        // EditFloorLayout shows a loading state first; wait until the real container mounts.
        const floorLayoutContainer = await waitForFloorLayoutContainer(container);

        if (!floorLayoutContainer) {
            throw new Error(
                `Floor layout container (${FLOOR_LAYOUT_CONTAINER_SELECTOR}) was not found after rendering`
            );
        }

        floorLayoutContainer.style.width = `${width}px`;
        floorLayoutContainer.style.height = `${height}px`;

        // Wait for Konva canvas / content to paint.
        let attempts = 0;
        const maxAttempts = 16;

        while (attempts < maxAttempts) {
            const mapCanvas = floorLayoutContainer.querySelector('canvas');
            if (mapCanvas) {
                await new Promise((resolve) => setTimeout(resolve, RENDER_SETTLE_MS));
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
            attempts++;
        }

        const rect = floorLayoutContainer.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            throw new Error(
                `Floor layout container has invalid dimensions: ${rect.width}x${rect.height}`
            );
        }

        return await createMapSVGObject(floorLayoutContainer);
    } catch (error) {
        console.error('Error creating offscreen floor layout:', error);
        throw error instanceof Error
            ? error
            : new Error('Unknown error occurred while creating offscreen floor layout');
    } finally {
        try {
            unmount?.();
        } catch (cleanupError) {
            console.error('Error unmounting offscreen floor layout:', cleanupError);
        }
        try {
            if (container.parentNode) {
                document.body.removeChild(container);
            }
        } catch (cleanupError) {
            console.error('Error removing offscreen floor layout container:', cleanupError);
        }
    }
};

const GenerateFloorLayoutFromData = async (props: IEditFloorLayout): Promise<string> => {
    const dedupeKey =
        props.selectedFloorNode?.NodeEntID ??
        props.uniqueName ??
        'floor-layout';

    const existing = inFlightByKey.get(dedupeKey);
    if (existing) {
        return existing;
    }

    const run = (async (): Promise<string> => {
        try {
            const svgObject = await createFloorLayoutOffscreen(props, 1800, 900);

            if (!svgObject?.svg) {
                throw new Error('Failed to create floor layout SVG object');
            }

            const { url } = await createMapObjectURL(svgObject);

            if (!url) {
                throw new Error('Failed to create floor layout memory URL');
            }

            return url;
        } catch (error) {
            console.error('Error creating floor layout image:', error);
            return '';
        }
    })();

    inFlightByKey.set(dedupeKey, run);

    try {
        return await run;
    } finally {
        if (inFlightByKey.get(dedupeKey) === run) {
            inFlightByKey.delete(dedupeKey);
        }
    }
};

export { GenerateFloorLayoutFromData };

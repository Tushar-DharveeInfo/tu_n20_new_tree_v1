import html2canvas from "html2canvas";
import { IRowOfRacksContainer } from "../../allinterface/rackandstack/IRowOfRacksContainer";
import { RenderRowOfRacksContainer } from "../../../features/rackandstack/rowofrackscontainer/RowOfRacksContainer";
import { createMapObjectURL } from "../generatenetworktracefromdata/GenerateNetworkTraceFromData";

interface MapSVGObject {
    svg: string;
    width: number;
    height: number;
    timestamp: number;
}

type TStyleSnapshot = {
    el: HTMLElement;
    overflow: string;
    overflowX: string;
    overflowY: string;
    height: string;
    maxHeight: string;
    width: string;
    maxWidth: string;
};

const EXPORT_WIDTH = 1800;
const RENDER_SETTLE_DELAY_MS = 1500;

const waitForLayoutToSettle = async (delay = RENDER_SETTLE_DELAY_MS) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, delay));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const getVisibleRowOfRacksElement = () => {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(".nz-row-of-racks-container"));

    return candidates.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }) ?? null;
};

const getCaptureDimensions = (root: HTMLElement) => {
    let width = Math.max(root.scrollWidth, root.clientWidth, EXPORT_WIDTH);
    let height = Math.max(root.scrollHeight, root.clientHeight);

    Array.from(root.querySelectorAll<HTMLElement>("*")).forEach((element) => {
        const elementRight = element.offsetLeft + Math.max(element.scrollWidth, element.clientWidth);
        const elementBottom = element.offsetTop + Math.max(element.scrollHeight, element.clientHeight);

        width = Math.max(width, elementRight);
        height = Math.max(height, elementBottom);
    });

    return { width, height };
};

/** Expands overflow containers so html2canvas can capture full scrolled content. */
const expandElementForFullCapture = (root: HTMLElement): (() => void) => {
    const snapshots: TStyleSnapshot[] = [];
    const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

    elements.forEach((element) => {
        const style = window.getComputedStyle(element);
        const shouldExpand =
            style.overflow !== "visible" ||
            style.overflowX !== "visible" ||
            style.overflowY !== "visible" ||
            element.scrollHeight > element.clientHeight ||
            element.scrollWidth > element.clientWidth;

        if (!shouldExpand) {
            return;
        }

        snapshots.push({
            el: element,
            overflow: element.style.overflow,
            overflowX: element.style.overflowX,
            overflowY: element.style.overflowY,
            height: element.style.height,
            maxHeight: element.style.maxHeight,
            width: element.style.width,
            maxWidth: element.style.maxWidth,
        });

        element.style.overflow = "visible";
        element.style.overflowX = "visible";
        element.style.overflowY = "visible";

        if (element.scrollHeight > element.clientHeight) {
            element.style.height = `${element.scrollHeight}px`;
            element.style.maxHeight = "none";
        }

        if (element.scrollWidth > element.clientWidth) {
            element.style.width = `${Math.max(element.scrollWidth, element.clientWidth)}px`;
            element.style.maxWidth = "none";
        }
    });

    return () => {
        snapshots.forEach((snapshot) => {
            snapshot.el.style.overflow = snapshot.overflow;
            snapshot.el.style.overflowX = snapshot.overflowX;
            snapshot.el.style.overflowY = snapshot.overflowY;
            snapshot.el.style.height = snapshot.height;
            snapshot.el.style.maxHeight = snapshot.maxHeight;
            snapshot.el.style.width = snapshot.width;
            snapshot.el.style.maxWidth = snapshot.maxWidth;
        });
    };
};

const createMapSVGObject = async (
    mapElement: HTMLElement
): Promise<MapSVGObject> => {
    const restoreStyles = expandElementForFullCapture(mapElement);

    try {
        await waitForLayoutToSettle();

        const { width, height } = getCaptureDimensions(mapElement);

        if (width === 0 || height === 0) {
            throw new Error("Map element has invalid dimensions");
        }

        const canvas = await html2canvas(mapElement, {
            width,
            height,
            windowWidth: width,
            windowHeight: height,
            scrollX: 0,
            scrollY: 0,
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
            width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <image width="${width}" height="${height}" xlink:href="${imgData}"/>
        </svg>`;

        return {
            svg,
            width,
            height,
            timestamp: Date.now(),
        };
    } finally {
        restoreStyles();
    }
};

const createRowOfRacksFromLiveDom = async (): Promise<MapSVGObject | null> => {
    const liveElement = getVisibleRowOfRacksElement();
    if (!liveElement) {
        return null;
    }

    const container = document.createElement("div");
    const liveRect = liveElement.getBoundingClientRect();

    container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${Math.max(liveElement.scrollWidth, Math.ceil(liveRect.width), EXPORT_WIDTH)}px;
    min-height: 1px;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    overflow: visible;
    background: #ffffff;
  `;
    document.body.appendChild(container);

    try {
        const clonedElement = liveElement.cloneNode(true) as HTMLElement;
        const printButton = clonedElement.querySelector("button");
        if (printButton instanceof HTMLElement) {
            printButton.style.display = "none";
        }

        clonedElement.style.width = `${Math.max(liveElement.scrollWidth, Math.ceil(liveRect.width), EXPORT_WIDTH)}px`;
        clonedElement.style.height = "auto";
        clonedElement.style.maxHeight = "none";
        clonedElement.style.overflow = "visible";

        container.appendChild(clonedElement);
        await waitForLayoutToSettle();

        return await createMapSVGObject(clonedElement);
    } finally {
        try {
            document.body.removeChild(container);
        } catch (cleanupError) {
            console.error("Error removing live RowOfRacks clone container:", cleanupError);
        }
    }
};

const createRowOfRacksOffscreen = async (
    props: IRowOfRacksContainer
): Promise<MapSVGObject> => {
    const liveDomSvgObject = await createRowOfRacksFromLiveDom();
    if (liveDomSvgObject) {
        return liveDomSvgObject;
    }

    const container = document.createElement("div");
    container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${EXPORT_WIDTH}px;
    min-height: 1px;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    overflow: visible;
  `;
    document.body.appendChild(container);

    let unmount: (() => void) | undefined;

    try {
        await new Promise<void>((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                reject(new Error("RowOfRacks render timed out waiting for onRendered"));
            }, 20000);

            const handle = RenderRowOfRacksContainer(container, {
                ...props,
                onRendered: () => {
                    window.clearTimeout(timeoutId);
                    resolve();
                },
            });
            unmount = handle.unmount;
        });

        const rackContainer =
            (container.querySelector(".nz-row-of-racks-container") as HTMLElement | null) ?? container;

        const printButton = rackContainer.querySelector("button");
        if (printButton instanceof HTMLElement) {
            printButton.style.display = "none";
        }

        rackContainer.style.width = `${EXPORT_WIDTH}px`;
        rackContainer.style.height = "auto";
        rackContainer.style.overflow = "visible";
        rackContainer.style.maxHeight = "none";
        rackContainer.style.paddingTop = "1px";

        let attempts = 0;
        const maxAttempts = 16;
        while (attempts < maxAttempts) {
            const images = rackContainer.querySelectorAll("img");
            const svg = rackContainer.querySelector("svg");
            const canvas = rackContainer.querySelector("canvas");

            if (svg || canvas || images.length > 0) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
            attempts++;
        }

        await waitForLayoutToSettle();

        return await createMapSVGObject(rackContainer);
    } finally {
        try {
            unmount?.();
        } catch (cleanupError) {
            console.error("Error unmounting offscreen RowOfRacks:", cleanupError);
        }
        try {
            document.body.removeChild(container);
        } catch (cleanupError) {
            console.error("Error removing offscreen RowOfRacks container:", cleanupError);
        }
    }
};

const GenerateRowOfRacksFromData = async (props: IRowOfRacksContainer) => {
    try {
        const svgObject = await createRowOfRacksOffscreen(props);
        if (!svgObject?.svg) {
            throw new Error("Failed to create RowOfRacks SVG object");
        }

        const { url } = await createMapObjectURL(svgObject);
        if (!url) {
            throw new Error("Failed to create memory URL");
        }

        return url;
    } catch (error) {
        console.error("Error creating RowOfRacks memory URL:", error);
        return "";
    }
};

export { GenerateRowOfRacksFromData };

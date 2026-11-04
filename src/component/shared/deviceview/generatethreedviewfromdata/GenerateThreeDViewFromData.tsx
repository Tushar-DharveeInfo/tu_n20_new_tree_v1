
import { createRoot } from "react-dom/client";
import { IThreeDView } from "../../allinterface/deviceview/IThreeDView";
import { ThreeDView } from "../threedview/ThreeDView";

const GenerateThreeDViewFromData = (props: IThreeDView): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            // -------------------------------------------------------------
            // 1. Create hidden DOM container
            // -------------------------------------------------------------
            const container = document.createElement("div");
            container.style.position = "absolute";
            container.style.left = "-99999px";
            container.style.top = "-99999px";
            container.style.width = "1800px";
            container.style.height = "900px";
            container.style.overflow = "hidden";
            document.body.appendChild(container);

            // -------------------------------------------------------------
            // 2. Render <ThreeDView />
            // -------------------------------------------------------------
            const root = createRoot(container);

            // IMPORTANT:
            // We extend props by injecting onRendered callback
            root.render(
                <ThreeDView
                    {...props}
                    onRendered={() => handleRenderCompleted()}
                />
            );

            // -------------------------------------------------------------
            // 3. When rendered → extract SVG or Canvas
            // -------------------------------------------------------------
            const handleRenderCompleted = () => {
                try {
                    const svgElement = container.querySelector("svg");
                    const canvasElement = container.querySelector("canvas");

                    if (!svgElement && !canvasElement) {
                        throw new Error("3D View did not render SVG or Canvas");
                    }

                    let url: string;

                    // -----------------------------------------------------
                    // SVG → convert to SVG Blob URL
                    // -----------------------------------------------------
                    if (svgElement) {
                        const serialized = new XMLSerializer().serializeToString(svgElement);
                        const blob = new Blob([serialized], { type: "image/svg+xml" });
                        url = URL.createObjectURL(blob);
                        const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
                        const svgUrl = URL.createObjectURL(svgBlob);

                        const img = new Image();

                        img.onload = () => {
                            try {
                                const canvas = document.createElement("canvas");
                                canvas.width = svgElement.clientWidth || 1800;
                                canvas.height = svgElement.clientHeight || 900;

                                const ctx = canvas.getContext("2d");
                                if (!ctx) {
                                    cleanup();
                                    reject("Canvas context not available");
                                    return;
                                }

                                ctx.drawImage(img, 0, 0);

                                canvas.toBlob((blob) => {
                                    if (!blob) {
                                        cleanup();
                                        reject("PNG conversion failed");
                                        return;
                                    }

                                    const pngUrl = URL.createObjectURL(blob);

                                    URL.revokeObjectURL(svgUrl); // cleanup svg url
                                    cleanup();
                                    resolve(pngUrl);
                                }, "image/png");
                            } catch (err) {
                                cleanup();
                                reject(err);
                            }
                        };

                        img.onerror = (e) => {
                            cleanup();
                            reject("SVG to Image load failed");
                        };

                        img.src = svgUrl;
                        return;
                    }

                    // -----------------------------------------------------
                    // Canvas → PNG Blob URL
                    // -----------------------------------------------------
                    canvasElement?.toBlob((blob) => {
                        if (!blob) {
                            cleanup();
                            reject("Canvas conversion failed");
                            return;
                        }
                        url = URL.createObjectURL(blob);
                        cleanup();
                        resolve(url);
                    });
                } catch (err) {
                    cleanup();
                    reject(err);
                }
            };

            // -------------------------------------------------------------
            // Cleanup Logic
            // -------------------------------------------------------------
            const cleanup = () => {
                try {
                    root.unmount();
                    if (container.parentNode) container.remove();
                } catch { }
            };

        } catch (err) {
            reject(err);
        }
    });
};


export { GenerateThreeDViewFromData }



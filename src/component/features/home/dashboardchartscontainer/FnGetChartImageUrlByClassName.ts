async function FnGetChartImageUrlsByClassName(
    className: string
): Promise<{ png?: string; svg?: string } | null> {
    try {
        if (!className || typeof className !== "string") {
            return null;
        }

        const container = document.querySelector(`.${className}`);
        if (!container) {
            console.warn(`No element found with class: ${className}`);
            return null;
        }

        const result: { png?: string; svg?: string } = {};

        // --- PNG ---
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas && typeof canvas.toDataURL === "function") {
            try {
                result.png = canvas.toDataURL('image/png');
            } catch (err) {
                console.warn('PNG conversion failed', err);
            }
        } else {
            console.warn(`No canvas found in container: ${className}`);
        }

        // --- SVG ---
        const svgEl = container.querySelector('svg') as SVGSVGElement | null;
        if (svgEl) {
            try {
                const cloned = svgEl.cloneNode(true) as SVGSVGElement;

                cloned.setAttribute(
                    'xmlns',
                    cloned.getAttribute('xmlns') || ''
                );
                cloned.setAttribute(
                    'xmlns:xlink',
                    cloned.getAttribute('xmlns:xlink') || ''
                );

                const svgString = new XMLSerializer().serializeToString(cloned);
                const svgBlob = new Blob([svgString], {
                    type: 'image/svg+xml;charset=utf-8'
                });

                const svgBlobUrl = URL.createObjectURL(svgBlob);

                try {
                    const response = await fetch(svgBlobUrl);
                    const blob = await response.blob();

                    result.svg = await new Promise<string>((res, rej) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (typeof reader.result === 'string') res(reader.result);
                            else rej('Unexpected reader result type');
                        };
                        reader.onerror = rej;
                        reader.readAsDataURL(blob);
                    });
                } catch (fetchErr) {
                    console.warn('SVG fetch/reader failed', fetchErr);
                } finally {
                    URL.revokeObjectURL(svgBlobUrl);
                }

            } catch (err) {
                console.warn('SVG conversion failed', err);
            }
        } else {
            console.warn(`No SVG found in container: ${className}`);
        }

        return result;

    } catch (error) {
        console.error("FnGetChartImageUrlsByClassName error:", error);
        return null;
    }
}
export { FnGetChartImageUrlsByClassName }
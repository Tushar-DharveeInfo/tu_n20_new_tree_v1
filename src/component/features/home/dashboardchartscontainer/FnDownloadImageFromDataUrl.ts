
function FnDownloadImageFromDataUrl(
    urlObj: any,
    type: "png" | "svg",
    fileName: string = "chart"
) {
    try {
        if (!urlObj || typeof urlObj !== "object") return;

        let dataUrl = urlObj[type];
        if (!dataUrl || typeof dataUrl !== "string") return;

        //  Handle SVG
        if (type === "svg" && dataUrl.startsWith("data:image/svg+xml;base64,")) {
            const parts = dataUrl.split(",");
            if (parts.length < 2) return;

            const base64 = parts[1];

            let svgText = "";
            try {
                svgText = atob(base64);
            } catch (e) {
                console.error("Invalid base64 SVG data");
                return;
            }

            const blob = new Blob([svgText], {
                type: "image/svg+xml;charset=utf-8",
            });

            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

        } else if (type === "png") {
            //  Handle PNG
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `${fileName}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

    } catch (error) {
        console.error("FnDownloadImageFromDataUrl error:", error);
        return;
    }
}
export { FnDownloadImageFromDataUrl }
/**
 * Builds a centered error message and returns it as an in-memory (blob:) URL.
 * Uses native SVG <text> (not foreignObject) so it renders correctly in <img>.
 *
 * @param name - Dynamic name shown in the message
 * @returns blob: URL, or "" on failure
 *
 * @example
 * const url = FnCreateFailedMemoryUrl("PowerTrace");
 * // Message: "Not able to create memory url of PowerTrace"
 */
const FnCreateFailedMemoryUrl = (name: string): string => {
    try {
        const displayName = String(name ?? "").trim() || "unknown";
        const escapedName = displayName
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

        const width = 1800;
        const height = 900;
        const fontSize = 56; // ~h1/h2 readable when shown in reports
        const lineHeight = 72;
        const maxCharsPerLine = 42;

        const fullMessage = `Not able to create memory url of ${escapedName}`;

        // Wrap long names so text stays readable and centered.
        const lines: string[] = [];
        let remaining = fullMessage;
        while (remaining.length > maxCharsPerLine) {
            let breakAt = remaining.lastIndexOf(" ", maxCharsPerLine);
            if (breakAt <= 0) {
                breakAt = maxCharsPerLine;
            }
            lines.push(remaining.slice(0, breakAt).trim());
            remaining = remaining.slice(breakAt).trim();
        }
        if (remaining) {
            lines.push(remaining);
        }

        const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
        const textLines = lines
            .map((line, index) => {
                const y = startY + index * lineHeight;
                return `<tspan x="${width / 2}" y="${y}">${line}</tspan>`;
            })
            .join("");

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#000000"
  >${textLines}</text>
</svg>`;

        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("FnCreateFailedMemoryUrl error:", error);
        return "";
    }
};

export { FnCreateFailedMemoryUrl };

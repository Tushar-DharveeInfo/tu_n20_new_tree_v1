
function blobToPngMemoryUrl(blob: Blob): Promise<{
    url: string;
    revoke: () => void;
}> {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            const tempUrl = URL.createObjectURL(blob);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const width = img.width || 500;
                const height = img.height || 500;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject("Canvas not supported");
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                //  Convert to PNG BLOB (not base64)
                canvas.toBlob((pngBlob) => {
                    if (!pngBlob) {
                        reject("PNG conversion failed");
                        return;
                    }
                    const pngUrl = URL.createObjectURL(pngBlob);
                    // cleanup temp SVG/image URL
                    URL.revokeObjectURL(tempUrl);
                    resolve({
                        url: pngUrl,
                        revoke: () => URL.revokeObjectURL(pngUrl),
                    });
                }, "image/png");
            };
            img.onerror = reject;
            img.src = tempUrl;
        } catch (error) {
            console.error('Error in creating png memory url:', error);
            reject(error);
        }
    });
}

const FnGetUrlOfPublicFile = async (
    path: string
): Promise<string> => {
    try {
        if (!path || typeof path !== "string") {
            return "";
        }
        const baseUrl =
            window.location.origin;
        const normalizedPath =
            path.replace(/^\/+/, "");
        const fullUrl =
            `${baseUrl}/${normalizedPath}`;
        let response: Response;
        try {
            response = await fetch(fullUrl);
        } catch (error) {
            console.error(
                "Error fetching public file:",
                error
            );
            const fallbackUrl =
                `${baseUrl}/icons/favicon.svg`;
            response = await fetch(
                fallbackUrl
            );
        }
        let contentType =
            response.headers.get(
                "content-type"
            );
        const isRealFile =
            response.ok &&
            contentType &&
            !contentType.includes(
                "text/html"
            );
        if (!isRealFile) {
            console.warn(
                `File missing, using fallback favicon: ${fullUrl}`
            );
            const fallbackUrl =
                `${baseUrl}/icons/favicon.svg`;
            response = await fetch(
                fallbackUrl
            );
            contentType =
                response.headers.get(
                    "content-type"
                );
        }
        if (!response.ok) {
            console.error(
                "Failed to fetch fallback file"
            );
            return "";
        }
        const blob =
            await response.blob();
        const { url } =
            await blobToPngMemoryUrl(
                blob
            );
        return url;
    } catch (error) {
        console.error(
            "Error in get url of public file:",
            error
        );
        return "";
    }
};
export { FnGetUrlOfPublicFile };

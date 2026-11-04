
function FnGetFileCategoryFromFile(file: Blob): string {
    if (!file?.type) return "unknown";

    const mime = file.type?.toLowerCase();

    if (mime.startsWith("image/")) return "image";
    if (mime === "application/pdf") return "Text";
    if (mime === "text/plain") return "Text";

    if (mime.includes("spreadsheet") || mime.includes("excel")) return "other";
    if (mime.includes("word")) return "other";
    if (mime.includes("powerpoint")) return "other";

    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";

    return "unknown";
}

function FnGetExtensionFromMime(fileType: string, fileName: string): string {
    if (!fileType) return "";

    // If audio or video → use MIME type
    if (fileType.startsWith("audio/") || fileType.startsWith("video/")) {
        const parts = fileType.split("/");
        return parts[1]?.toLowerCase() ?? "";
    }

    // Otherwise → use filename
    if (fileName) {
        const lastDot = fileName.lastIndexOf(".");
        if (lastDot !== -1) {
            return fileName.substring(lastDot + 1).toLowerCase();
        }
    }

    return "";
}

export { FnGetFileCategoryFromFile, FnGetExtensionFromMime }
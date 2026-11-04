
const FnDestroyInMemoryUrl = (objectUrl?: string): void => {
    if (!objectUrl) return;

    try {
        URL.revokeObjectURL(objectUrl);
    } catch (err) {
        console.warn("Failed to revoke object URL:", objectUrl, err);
    }
};

export { FnDestroyInMemoryUrl };

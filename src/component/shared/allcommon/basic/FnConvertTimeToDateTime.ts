
const FnConvertTimeToDateTime = (
    value?: string | null
): string | null => {
    try {
        if (!value || typeof value !== "string") return null;

        value = value.trim();
        if (!value) return null;

        // HH:mm or H:mm
        const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
            const [, h, m, s = "00"] = timeMatch;

            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T${h.padStart(2, "0")}:${m}:${s}`;
        }

        // Any valid date/datetime
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const seconds = String(date.getSeconds()).padStart(2, "0");

            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        }

        return null;
    } catch {
        return null;
    }
};

export { FnConvertTimeToDateTime }
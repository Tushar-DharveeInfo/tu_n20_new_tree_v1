
type DateInput = string | Date;

function FnIsValidDateInput(value: DateInput): boolean {
    try {
        // Case 1: Date object
        if (value instanceof Date) {
            return !isNaN(value.getTime());
        }

        // Case 2: Must be string
        if (typeof value !== "string") {
            return false;
        }

        const trimmed = value.trim();

        if (!trimmed) {
            return false;
        }

        // Case 3: DD/MM/YYYY or MM/DD/YYYY
        const localRegex = /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/;
        const localMatch = trimmed.match(localRegex);

        if (localMatch) {
            const first = Number(localMatch[1]);
            const second = Number(localMatch[2]);
            const year = Number(localMatch[3]);

            const isValidDate = (day: number, month: number, year: number) => {
                const date = new Date(year, month - 1, day);

                return (
                    date.getFullYear() === year &&
                    date.getMonth() === month - 1 &&
                    date.getDate() === day
                );
            };

            // DD/MM/YYYY
            const ddmmyyyy = isValidDate(first, second, year);

            // MM/DD/YYYY
            const mmddyyyy = isValidDate(second, first, year);

            return ddmmyyyy || mmddyyyy;
        }

        // Case 4: ISO format only
        const isoRegex =
            /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z)?)?$/;

        if (isoRegex.test(trimmed)) {
            const isoDate = new Date(trimmed);

            if (isNaN(isoDate.getTime())) {
                return false;
            }

            // Extra validation for overflow dates
            const [year, month, day] = trimmed.split("T")[0].split("-").map(Number);

            return (
                isoDate.getUTCFullYear() === year &&
                isoDate.getUTCMonth() + 1 === month &&
                isoDate.getUTCDate() === day
            );
        }

        return false;
    } catch (error) {
        console.error("Error in validate date:", error);
        return false;
    }
}

export { FnIsValidDateInput };
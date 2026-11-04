
import { getDateFormat } from "../../shared/context/contextandprovider/ExplorerTree";

const FnConvertDateToSave = (dateInput: string): string => {
    if (!dateInput || typeof dateInput !== "string") {
        return "";
    }

    const format = getDateFormat();

    const pad = (n: number) => n.toString().padStart(2, "0");

    try {
        const trimmedInput = dateInput.trim();

        // Already in SQL format (yyyy-MM-dd or yyyy-MM-dd HH:mm:ss)
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmedInput)) {
            return trimmedInput;
        }

        const [datePart, timePart, ampm] = trimmedInput.split(/\s+/);

        const dateParts = datePart.split("/").map(Number);

        let day = 0;
        let month = 0;
        let year = 0;

        if (format === "MM/dd/yyyy") {
            [month, day, year] = dateParts;
        } else {
            [day, month, year] = dateParts;
        }

        if (!year || !month || !day) {
            return "";
        }

        let hours = 0;
        let minutes = 0;
        let seconds = 0;

        if (timePart) {
            const timeParts = timePart.split(":").map(Number);

            hours = timeParts[0] || 0;
            minutes = timeParts[1] || 0;
            seconds = timeParts[2] || 0;

            if (ampm) {
                const upper = ampm.toUpperCase();

                if (upper === "PM" && hours < 12) {
                    hours += 12;
                } else if (upper === "AM" && hours === 12) {
                    hours = 0;
                }
            }
        }

        const sqlDate = `${year}-${pad(month)}-${pad(day)}`;

        if (!timePart) {
            return sqlDate;
        }

        return `${sqlDate} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } catch (error) {
        console.error("Error in FnConvertDateToSave:", error);
        return "";
    }
};

export { FnConvertDateToSave };
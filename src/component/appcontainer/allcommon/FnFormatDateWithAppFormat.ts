
import { getDateFormat } from "../../shared/context/contextandprovider/ExplorerTree";

const FnFormatDateWithAppFormat = (
  dateInput: string | Date,
  showTime: boolean = true,
  muForSite?: string
): string => {
  try {
    //  Basic validation

    if (!dateInput) {
      console.warn("FnFormatDate: Empty date input");
      return "";
    }

    //  Convert to Date safely
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      console.error("FnFormatDate: Invalid date input →", dateInput);
      return "";
    }

    const format = muForSite ? muForSite.toLowerCase() === "europe" ? "dd/MM/yyyy" : "MM/dd/yyyy" : getDateFormat(); // "MM/dd/yyyy" or "dd/MM/yyyy"

    const pad = (n: number) => n.toString().padStart(2, "0");

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    let formattedDate = "";

    //  Format handling
    if (format === "MM/dd/yyyy") {
      formattedDate = `${month}/${day}/${year}`;
    } else if (format === "dd/MM/yyyy") {
      formattedDate = `${day}/${month}/${year}`;
    } else {
      console.warn("FnFormatDate: Unsupported format →", format);
      formattedDate = `${day}/${month}/${year}`; // fallback
    }

    //  If only date required
    if (!showTime) return formattedDate;

    //  Time formatting
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${formattedDate} ${pad(hours)}:${minutes} ${ampm}`;

  } catch (error) {
    //  Catch unexpected runtime errors
    console.error("FnFormatDate: Unexpected error →", error);
    return "";
  }
};

export { FnFormatDateWithAppFormat };
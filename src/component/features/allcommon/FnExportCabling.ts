import { IErrorData } from "../../shared/allinterface/IApiResponse";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { CABLING } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

interface IExportCablingResponse {
    cablingJson: string;
}

const isExportCablingResponse = (response: unknown): response is IExportCablingResponse => {
    return Boolean(
        response &&
        typeof response === "object" &&
        "cablingJson" in response &&
        typeof response.cablingJson === "string"
    );
};

const ApiCallExportCabling = (statusBarContext: IStatusBar, isPower: boolean, startDeviceID?: string): Promise<IExportCablingResponse> => {
    return new Promise((resolve, reject) => {
        axiosInterceptor(
            {
                url: CABLING.ExportCabling,
                data: { isPower: isPower, startDeviceID: startDeviceID ?? null },
                allowShowLoader: true,
                setFetchData: (response: unknown, status?: string, errData?: IErrorData[]) => {
                    if (status === "200" && isExportCablingResponse(response)) {
                        resolve(response);
                    } else {
                        const message =
                            errData?.[0]?.errString ||
                            (status === "200"
                                ? "Export cabling data not found or invalid."
                                : `API Error ${status ?? "unknown"}`);
                        reject(new Error(message));
                    }
                }
            },
            statusBarContext
        );
    });
};

// Export cabling API data without the ID column and download it as an Excel file.
const FnExportCabling = async (
    statusBarContext: IStatusBar,
    fileName: string,
    isPower: boolean,
    startDeviceID: string | undefined
): Promise<void> => {
    try {
        const response = await ApiCallExportCabling(statusBarContext, isPower, startDeviceID);
        const parsedData: unknown = JSON.parse(response.cablingJson);

        if (!Array.isArray(parsedData)) {
            throw new Error("Export cabling data must be an array.");
        }

        const cablingRows = parsedData.filter(
            (row): row is Record<string, unknown> =>
                row !== null && typeof row === "object" && !Array.isArray(row)
        );

        if (cablingRows.length !== parsedData.length) {
            throw new Error("Export cabling data contains invalid rows.");
        }

        const rowsWithoutId = cablingRows.map((row) =>
            Object.fromEntries(
                Object.entries(row).filter(([columnName]) => columnName.toLowerCase() !== "id")
            )
        );

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rowsWithoutId);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cabling");

        const workbookData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([workbookData], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const trimmedFileName = fileName.trim() || "Cabling";
        const exportFileName = trimmedFileName.toLowerCase().endsWith(".xlsx")
            ? trimmedFileName
            : `${trimmedFileName}.xlsx`;

        saveAs(blob, exportFileName);
    } catch (error) {
        console.error("Error in Export cabling function:", error);
    }

};

export { FnExportCabling };

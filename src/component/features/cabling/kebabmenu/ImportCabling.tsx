import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import '../../allcss/cabling/kebabmenu/ImportCabling.css';
import { IImportCabling } from "../../allinterface/cabling/kebabmenu/IImportCabling";
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks";
import { FnIsValidDateInput } from "../../../appcontainer/allcommon/FnIsValidDateInput";
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor";
import { CABLING, EM } from "../../../shared/interceptors/EndPoints";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { Label } from "../../../shared/basic/label/Label";
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage";
import { Upload24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { FileSelectControl } from "@n20a/libform";
import { BasicGrid } from "../../../shared/tablegrid/BasicGrid";
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer";

const ImportCabling = (props: IImportCabling) => {
    const [workBook, setWorkBook] = useState<XLSX.WorkBook | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<Record<string, any>>({});
    const [validWorksheetList, setValidWorksheetList] = useState<Record<string, any>[]>([]);
    const [disableImport, setDisableImport] = useState<boolean>(true);
    const [selectedColDef, setSelectedColDef] = useState<Record<string, any>[]>([]);
    const [selectRowData, setSelectedRowData] = useState<Record<string, any>[]>([]);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

    const statusBarContext = useStatusBarContext();
    // clear state variables before loading a new file
    const ClearAllState = (): void => {
        setWorkBook(null);
        setValidWorksheetList([]);
        setSelectedSheet({});
        setSelectedColDef([]);
        setSelectedRowData([]);
        setDisableImport(true);
    };
    // load grid columns and rows for the selected worksheet tab.
    const LoadSelectedSheet = (
        sheetIndex: number,
        sheetList?: Record<string, any>[]
    ): void => {
        const sourceList = sheetList || validWorksheetList;
        const currentSheet = sourceList[sheetIndex];
        if (!currentSheet) {
            return;
        }
        setSelectedColDef([...(currentSheet.column || [])]);
        setSelectedRowData([...(currentSheet.rowData || [])]);
        setSelectedSheet({
            ...currentSheet,
        });
    };
    // make valid worksheet list from the workbook
    const makeValidWorksheetList = async (): Promise<void> => {
        try {
            if (!workBook || !workBook.SheetNames) {
                return;
            }
            const rowDataTabArray: Record<string, any>[] = [];
            for (let i = 0; i < workBook.SheetNames.length; i++) {
                const wsname = workBook.SheetNames[i];
                const ws = workBook.Sheets[wsname];
                const data: unknown[][] = XLSX.utils.sheet_to_json(ws, {
                    header: 1,
                    raw: false,
                    blankrows: false,
                });
                let header: string[] = Array.isArray(data[0])
                    ? (data[0] as string[])
                    : [];
                if (!header.length) {
                    continue;
                }
                const headerArray: Record<string, any>[] = [
                    {
                        field: "ErrorString",
                        resizable: true,
                        headerName: "ErrorString",
                    },
                ];
                header = header.map((column: string) => {
                    const trimmedColumn = String(column || "").trim();
                    const objCol: Record<string, any> = {
                        field: trimmedColumn,
                        resizable: true,
                        headerName: trimmedColumn,
                    };
                    if (
                        trimmedColumn.toLowerCase() === "lastupdated" ||
                        trimmedColumn.toLowerCase().includes("date")
                    ) {
                        objCol.cellRenderer = (params: Record<string, any>) => {
                            return (
                                <span>
                                    {params.value && FnIsValidDateInput(params.value)
                                        ? FnConvertDateToUtcOrUtcToDate(params.value, false, true)
                                        : params.value}
                                </span>
                            );
                        };
                    }
                    headerArray.push(objCol);
                    return trimmedColumn;
                });
                const excelData: Record<string, any>[] = [];
                for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
                    const currentRow = data[rowIndex];
                    if (!Array.isArray(currentRow)) {
                        continue;
                    }
                    const firstCharacter =
                        typeof currentRow[0] === "undefined"
                            ? ""
                            : Array.from(String(currentRow[0]))[0];
                    if (firstCharacter === "!") {
                        continue;
                    }
                    const rowObject: Record<string, any> = {};
                    header.forEach((columnName: string, index: number) => {
                        rowObject[columnName] =
                            currentRow[index] !== undefined ? String(currentRow[index]) : "";
                    });
                    excelData.push(rowObject);
                }
                if (excelData.length > 0) {
                    excelData[0].ErrorString = "";
                }
                rowDataTabArray.push({
                    sheetName: wsname,
                    column: headerArray,
                    rowData: excelData,
                    checkboxSelected: true,
                    isError: 0,
                });
            }
            if (rowDataTabArray.length === 0) {
                setDisableImport(true);
                return;
            }
            let sheetJsonFormat
            rowDataTabArray.forEach((sheet: Record<string, any>) => {
                sheetJsonFormat = sheet.rowData;
            });
            const payload = {
                jsonString: JSON.stringify(sheetJsonFormat),
            };
            const response = await axiosInterceptor(
                {
                    url: CABLING.ValidateCabling,
                    data: payload,
                    setFetchData: (_response: unknown, status?: string) => {
                        if (status !== "200") {
                            return;
                        }
                    },
                },
                statusBarContext
            );
            if (response?.status !== 200) {
                return;
            }
            const responseData = FnParseJsonSafely(
                String(response?.data?.jsonStringOutput || "{}")
            );
            rowDataTabArray.forEach((sheet: Record<string, any>) => {
                const newData = responseData;
                if (!newData) {
                    return;
                }
                const errorList = newData.filter(
                    (el: Record<string, any>) =>
                        typeof el.ErrorType !== "undefined" && el.ErrorType === 2
                );
                sheet.isError = errorList.length > 0 ? 1 : 0;
                sheet.rowData = newData;
            });
            setValidWorksheetList([...rowDataTabArray]);

            if (rowDataTabArray.length > 0) {
                LoadSelectedSheet(0, rowDataTabArray);
            }
            setDisableImport(false);
        } catch (error) {
            console.error("makeValidWorksheetList Error:", error);
            setDisableImport(true);
            setConfirmMessage("Failed to validate worksheet.");
            setIsConfirmOpen(true);
        }
    };
    // call makeValidWorksheetList
    useEffect(() => {
        if (workBook) {
            makeValidWorksheetList();
        }
    }, [workBook]);
    // handle on file change function 
    const handleOnFileChange = async (file: File): Promise<void> => {
        try {
            ClearAllState();
            if (!(file instanceof File)) {
                setConfirmMessage("Invalid file selected.");
                setIsConfirmOpen(true);
                return;
            }
            const validExtensions = [".xlsx", ".xls"];
            const fileName = String(file.name || "").toLowerCase();
            const isValidFile = validExtensions.some((extension: string) =>
                fileName.endsWith(extension)
            );
            if (!isValidFile) {
                setConfirmMessage("Please select a valid Excel file (.xlsx or .xls).");
                setIsConfirmOpen(true);
                return;
            }
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, {
                type: "array",
            });
            if (
                !workbook ||
                !workbook.SheetNames ||
                workbook.SheetNames.length === 0
            ) {
                setConfirmMessage("Selected Excel file contains no worksheets.");
                setIsConfirmOpen(true);
                return;
            }
            setWorkBook(workbook);
        } catch (error) {
            console.error("handleOnFileChange Error:", error);
            setDisableImport(true);
            setConfirmMessage(
                error instanceof Error ? error.message : "Failed to read Excel file."
            );
            setIsConfirmOpen(true);
        }
    };
    // below function to import file in to cabling
    const handleImport = async (): Promise<void> => {
        try {
            const selectedSheets = validWorksheetList.filter(
                (sheet: Record<string, any>) => sheet.checkboxSelected === true
            );
            if (selectedSheets.length === 0) {
                setConfirmMessage("Select worksheet to import.");
                setIsConfirmOpen(true);
                return;
            }
            const errorSheets = selectedSheets.filter(
                (sheet: Record<string, any>) => sheet.isError === 1
            );
            if (errorSheets.length > 0) {
                setConfirmMessage("You must fix error in each worksheet first.");
                setIsConfirmOpen(true);
                return;
            }
            let sheetJsonFormat: Record<string, any>[] = []
            selectedSheets.forEach((sheet: Record<string, any>) => {
                sheetJsonFormat = sheet.rowData;
            });
            const payload = {
                jsonString: JSON.stringify(sheetJsonFormat),
            };
            const response = await axiosInterceptor(
                {
                    url: CABLING.ImportCabling,
                    data: payload,
                    setFetchData: (_response: unknown, status?: string) => {
                        if (status !== "200") {
                            return;
                        }
                    },
                },
                statusBarContext
            );
            if (response?.status !== 200) {
                return;
            }
            const responseData = response?.data;
            if (!responseData?.jsonStringOutput) {
                ClearAllState();
                setConfirmMessage(
                    String(responseData?.stepsCompleted || "Import Successfully").replace(
                        /\\n/g,
                        "\n\n"
                    )
                );
                setIsConfirmOpen(true);
                return;
            }
            const outputSheetData = FnParseJsonSafely(
                String(responseData.jsonStringOutput)
            );
            const updatedSheets = validWorksheetList.map(
                (sheet: Record<string, any>) => {
                    const newData = outputSheetData[sheet.sheetName];
                    if (!newData) {
                        return sheet;
                    }
                    const anyError = newData.filter(
                        (el: Record<string, any>) =>
                            typeof el.ErrorType !== "undefined" && el.ErrorType === 2
                    );
                    const updatedColumns = Array.isArray(sheet.column)
                        ? [...sheet.column]
                        : [];
                    ["ErrorString", "RecID", "EntID"].forEach((field: string) => {
                        const exists = updatedColumns.find(
                            (column: Record<string, any>) => column.field === field
                        );
                        if (!exists) {
                            updatedColumns.push({
                                field,
                                resizable: true,
                            });
                        }
                    });
                    return {
                        ...sheet,
                        rowData: newData,
                        isError: anyError.length > 0 ? 1 : 0,
                        column: updatedColumns,
                    };
                }
            );
            setValidWorksheetList(updatedSheets);
            setConfirmMessage(
                String(responseData?.stepsCompleted || "Import Successfully").replace(
                    /\\n/g,
                    "\n\n"
                )
            );
            ClearAllState();
            setIsConfirmOpen(true);
        } catch (error) {
            console.error("handleImport Error:", error);
            setConfirmMessage(
                error instanceof Error ? error.message : "Import failed."
            );
            setIsConfirmOpen(true);
        }
    };



    return (
        <div className="nz-import-container nz-create-table-properties">
            <div className="nz-import-header">
                <div className="nz-sub-header">
                    <Label
                        uniqueName={`${props.uniqueName}-header`}
                        label={props.headerText || ""}
                    />
                    <ActionImage
                        image={{
                            uniqueName: "import",
                            source: (
                                <Upload24x24
                                    size={FnGetCssVariable("--image-size-2")}
                                    fill="none"
                                    strokeWidth={1}
                                />
                            ),
                            type: "svg",
                            w: "var(--image-size-2)",
                            h: "var(--image-size-2)",
                            tooltip: "Import File",
                        }}
                        disabled={disableImport}
                        uniqueName="import"
                        w="var(--node_height)"
                        h="var(--node_height)"
                        actionCode="import"
                        handleMouse={handleImport}
                    />
                </div>
            </div>
            <p className="nz-warning-para-for-file">
                Do not upload untrusted external files.
            </p>
            <div className="nz-import-file-control-div">
                <div className="nz-file-label">
                    <Label
                        uniqueName={`${props.uniqueName}-file`}
                        label={"Excel File:"}
                    />
                </div>
                <div className="nz-file-control">
                    <FileSelectControl
                        tooltip="Only .xlsx files are allowed"
                        required={true}
                        name={"file-select-control-1"}
                        accept=".xlsx,.xls"
                        multiple={false}
                        onChange={(files: File[]) => {
                            if (files?.length > 0) {
                                handleOnFileChange(files[0]);
                            }
                        }}
                    />
                </div>
            </div>
            <div className={`nz-import-grid-list`}>
                {validWorksheetList.length === 0 ? (
                    <div className="nz-no-data-found">
                        <Label
                            uniqueName={`${props.uniqueName}-file`}
                            label={"Select file to view data here"}
                            fontWeight="bold"
                            fontSize="18px"
                        />
                    </div>
                ) : (
                    <div className="nz-import-right-side">
                        <div className="nz-sub-header">
                            <Label
                                uniqueName={`${props.uniqueName}-header`}
                                label={"Records by Sheets"}
                            />
                        </div>
                        <div className="nz-import-grid">
                            {selectRowData.length === 0 ? (
                                <div className="nz-no-data-found">
                                    <Label
                                        uniqueName={`${props.uniqueName}-file`}
                                        label={"No records to show"}
                                        fontWeight="bold"
                                        fontSize="18px"
                                    />
                                </div>
                            ) : (
                                <div className="ng-import-dataGridDiv">
                                    <BasicGrid
                                        allowAutoSizeColumn={true}
                                        className="nz-impro-grid"
                                        instanceName="import_table"
                                        featureId={props.featureId}
                                        isExportOnCopy={true}
                                        allowColumnFilter={true}
                                        allowColumnResize={true}
                                        exportFileName={
                                            selectedSheet.sheetName
                                                ? selectedSheet.sheetName
                                                : "ImportData"
                                        }
                                        rowData={selectRowData}
                                        isReadOnly={true}
                                        containerName="import_table"
                                        columnDefs={selectedColDef}
                                        allowPagination={true}
                                        dynamicPagination={true}
                                        paginationAutoPageSize={true}
                                        uniqueName={props.uniqueName + "-import-grid"}
                                        showGrid={true}
                                        featureData={undefined}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={props.uniqueName + "confirmbox"}
                message={confirmMessage}
                showOkButton={true}
                handleOkButtonClick={() => {
                    setIsConfirmOpen(false);
                }}
            />
        </div>
    );
};
export { ImportCabling };

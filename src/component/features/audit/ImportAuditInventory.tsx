
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../shared/interceptors/Interceptor';
import * as XLSX from 'xlsx';
import '../allcss/audit/kebabmenu/ImportAuditInventory.css';
import { AUDIT, EM } from '../../shared/interceptors/EndPoints';
import { Close24x24, Upload24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../appcontainer/allcommon/FnGetCssVariable';
import { IImportAuditInventory } from '../allinterface/audit/kebabmenu/IImportAuditInventory';
import { IListItem } from "../../shared/allinterface/basic/ICheckedListPanel";
import { ActionImage } from "../../shared/basic/actionimage/ActionImage";
import { Label } from "../../shared/basic/label/Label";
import { CheckedListPanel } from "../../shared/basic/checkedlistpanel/CheckedListPanel";
import { DELIMITER } from '../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid';
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { IBasicGridColDef } from '../../shared/allinterface/tablegrid/IBasicGrid';
import { FileSelectControl } from '@n20a/libform';
import { BasicGrid } from '../../shared/tablegrid/BasicGrid';
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely';

const ImportAuditInventory = (props: IImportAuditInventory) => {
    //#region const variables
    const [workBook, setWorkBook] = useState<any>({});
    const dataFetchedRef = useRef(false);
    const [selectedSheet, setSelectedSheet] = useState<any>({});
    const [validWorksheetList, setValidWorksheetList] = useState<any>([]);
    const [disableImport, setDisableImport] = useState(true);
    const [selectedColDef, setSelectedColDef] = useState<any>([])
    const [selectRowData, setSelectedRowData] = useState<any>([])
    const [validList, setValidList] = useState<any>([])
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>();
    const [showImportDialog, setShowImportDialog] = useState(true);
    const [isFileSelected, setIsFileSelected] = useState<boolean>(false);
    const [isReloadNeeded, setIsReloadNeeded] = useState<boolean>(false);
    const statusBarContext = useStatusBarContext();

    useEffect(() => {
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;

    }, []);


    const makeValidWorksheetList = useCallback(() => {
        const loadWorkSheetWithoutValidation = () => {

            let rowDataTabArray: any = [];

            for (let i = 0; i < workBook.SheetNames.length; i++) {
                const wsname = workBook.SheetNames[i];
                const ws = workBook.Sheets[wsname];

                let firstCell = ws["A1"]; // check first cell has value or not
                if (firstCell) {
                    let firstCellValue = firstCell.v;
                    if (firstCellValue) {
                        const data = XLSX.utils.sheet_to_json(ws, {
                            header: 1,
                            raw: false,
                            blankrows: false,
                            defval: ""
                        });
                        let header: any = data[0];

                        if (header) {
                            let headerArray: any = [];

                            header.map((data: any) => {
                                headerArray.push({
                                    field: data,
                                    resizable: true,
                                    headerName: data
                                });
                            });

                            let excelData = [];
                            for (let x = 1; x < data.length; x++) {
                                let objetRow: any = data[x];
                                let dataObject: any = {};

                                let firstCharacter = typeof objetRow[0] === 'undefined' ? "" : Array.from(objetRow[0])[0];
                                if (firstCharacter != "!") {
                                    header.map((data: any, index: any) => {
                                        dataObject["" + data + ""] =
                                            objetRow[index] !== undefined
                                                ? String(objetRow[index])
                                                : "";
                                    });
                                    excelData.push(dataObject);
                                }
                            }
                            rowDataTabArray.push({
                                sheetName: wsname,
                                column: headerArray,
                                rowData: excelData,
                                checkboxSelected: true,
                                isError: 0
                            });
                        }
                    }
                }
            }
            setValidWorksheetList((prevArray: any) => [
                ...prevArray,
                ...rowDataTabArray,
            ]);
        }

        const databaseValidationOnSheet = (sheetdata: any) => {

            let sheetJsonFormat: any = {};

            let selectedEntity = props.selectedNodeInfo.node;
            for (let i = 0; i < sheetdata.length; i++) {
                if (sheetdata[i].rowData?.length > 0) {
                    sheetdata[i].rowData.map((element: any) => {
                        element[`_${selectedEntity.NodeEntityname}`] = selectedEntity[`Name`];
                        element.GroupName = selectedEntity.GroupName;
                    })
                }
                sheetJsonFormat[sheetdata[i].sheetName] = sheetdata[i].rowData;
            }
            axiosInterceptor({
                url: EM.ValidateEntitySheet,
                data: {
                    mode: "IMPORT",
                    entityName: selectedEntity.NodeEntityname,
                    jsonString: JSON.stringify(sheetJsonFormat),
                },
                setFetchData: (validateEntitySheetApiResponse: unknown) => {
                    if (validateEntitySheetApiResponse && typeof validateEntitySheetApiResponse === "string") {
                        let responseData = FnParseJsonSafely(validateEntitySheetApiResponse as string);
                        for (let j = 0; j < sheetdata.length; j++) {
                            let newData = responseData[sheetdata[j].sheetName];
                            let errorList = newData.filter(function (el: any) {
                                return el.ErrorType == 2;
                            });
                            if (errorList.length > 0) {
                                sheetdata[j].isError = 1;
                                setDisableImport(true);
                            }
                            else {
                                sheetdata[j].isError = 0;
                                setDisableImport(false);
                            }
                            sheetdata[j].rowData = newData;
                        }
                        setValidWorksheetList((prevArray: any) => [
                            ...prevArray,
                            ...sheetdata,
                        ]);
                    }
                }
            }, statusBarContext)

        }
        if (workBook.SheetNames) {
            const sheetCount = workBook.SheetNames.length;
            setValidWorksheetList([]);
            if (sheetCount > 0) {

                let selectedEntity = props.selectedNodeInfo.node;
                let entityName: any = selectedEntity.NodeEntityname;

                if (entityName?.toLowerCase() == "em") {
                    loadWorkSheetWithoutValidation();
                    return false;
                }
                let requiredTableList = ['PG.AuditInventory'];


                let userSheetnames = workBook.SheetNames;
                let missingSheetsErr = "";
                // check missing worksheet
                for (let j = 0; j < requiredTableList.length; j++) {
                    let tablenName = requiredTableList[j];

                    let sheetExists = userSheetnames.filter(function (el: any) {
                        return el?.toLowerCase() == tablenName?.toLowerCase();
                    });

                    if (sheetExists.length == 0) {
                        if (missingSheetsErr == "") {
                            missingSheetsErr = tablenName;
                        }
                        else {
                            missingSheetsErr += ", " + tablenName;
                        }
                    }
                }
                if (missingSheetsErr != "") {
                    setErrorMessage(missingSheetsErr + " Worksheet(s) are missing for selected table")
                    return false;
                }

                let validUserShets: string[] = [];
                for (let j = 0; j < userSheetnames.length; j++) {
                    let sheetName = userSheetnames[j];

                    let sheetExists = requiredTableList.filter(function (el: any) {
                        return el?.toLowerCase() == sheetName?.toLowerCase();
                    })

                    if (sheetExists && sheetExists.length > 0) {
                        validUserShets.push(sheetExists[0]);
                    }
                }
                if (validUserShets.length == 0) {

                    setErrorMessage("Your excel file doesn't contain any valid worksheets.");
                    return false;
                }
                let requiredSheetNames = "";
                //IMPORT MODE
                for (let k = 0; k < requiredTableList.length; k++) {
                    let requiredSheetExists = validUserShets.filter(function (el: any) {
                        return el?.toLowerCase() == requiredTableList[k]?.toLowerCase();
                    });
                    if (requiredSheetExists.length == 0) {
                        if (requiredSheetNames == "")
                            requiredSheetNames = requiredTableList[k];
                        else
                            requiredSheetNames += "," + requiredTableList[k];
                    }
                }

                if (requiredSheetNames) {
                    return false;
                }
                let tableNamesCommaSeperated = validUserShets.join(DELIMITER.separator);

                axiosInterceptor({
                    url: EM.GetFieldList,
                    data: {
                        mode: "IMPORT",
                        entityName: selectedEntity.NodeEntityname,
                        tableNames: tableNamesCommaSeperated,
                    },
                    setFetchData: (getFieldListApiResponse: unknown) => {
                        if (getFieldListApiResponse && Array.isArray(getFieldListApiResponse)) {
                            let fieldListAll = getFieldListApiResponse;
                            let rowDataTabArray: any = [];

                            for (let i = 0; i < validUserShets.length; i++) {
                                const wsname: any = validUserShets[i];
                                let fieldList = fieldListAll.filter(function (el: any) {
                                    return el.tableName?.toLowerCase() == wsname?.toLowerCase();
                                });
                                let requiredFieds = [];
                                if (fieldList.length > 0) {
                                    requiredFieds = fieldList.filter(function (el: any) {
                                        return el.requiredToAddRecord == true;
                                    });
                                }
                                const excelSheetFind = workBook.SheetNames.filter(function (el: any) {
                                    return el?.toLowerCase() == wsname?.toLowerCase();
                                });

                                const ws = workBook.Sheets[excelSheetFind[0]];

                                const data = XLSX.utils.sheet_to_json(ws, {
                                    header: 1,
                                    raw: false,
                                    blankrows: false
                                })
                                let header: any = data[0];

                                if (header) {


                                    let headerArray: any = [];
                                    headerArray.push({
                                        field: "ErrorString",
                                        resizable: true,
                                        headerName: "ErrorString"
                                    });
                                    let ignoreColumns: any = [];
                                    header = header.map((data: any) => {
                                        let checkValidField = fieldList.filter(function (el: any) {
                                            return el.pName?.toLowerCase().trim() == data?.toLowerCase().trim();
                                        });
                                        if (checkValidField.length == 0) {
                                            data = data.trim();
                                            if (data?.toLowerCase().trim() != "recid" && data?.toLowerCase().trim() != "entid")
                                                ignoreColumns.push(data);
                                            else {
                                                headerArray.push({
                                                    field: data,
                                                    resizable: true,
                                                    headerName: data
                                                });
                                            }
                                        }
                                        else {
                                            data = checkValidField[0].pName.trim();

                                            headerArray.push({
                                                field: data,
                                                resizable: true,
                                                headerName: data
                                            });
                                        }

                                        return data
                                    });

                                    let excelData = [];
                                    for (let x = 1; x < data.length; x++) {
                                        let objetRow: any = data[x];
                                        let dataObject: any = {};
                                        // ignore row that has starting cell value = "!"
                                        let firstCharacter = typeof objetRow[0] === 'undefined' ? "" : Array.from(objetRow[0])[0];
                                        if (firstCharacter != "!") {
                                            header.map((data: any, index: number) => {
                                                dataObject["" + data + ""] =
                                                    objetRow[index] !== undefined
                                                        ? String(objetRow[index])
                                                        : "";
                                            });
                                            excelData.push(dataObject);
                                        }
                                    }
                                    for (let i = 0; i < excelData.length; i++) {
                                        for (let j = 0; j < ignoreColumns.length; j++) {
                                            delete excelData[i][ignoreColumns[j]];
                                        }
                                    }

                                    const uniq = headerArray
                                        .map((hd: any) => {
                                            return {
                                                count: 1,
                                                name: hd.field?.toLowerCase().trim()
                                            };
                                        }).reduce((result: any, b: any) => {
                                            result[b.name] = (result[b.name] || 0) + b.count;
                                            return result;
                                        }, {});

                                    let errorString = "";

                                    const duplicateHeader: any = Object.keys(uniq).filter((a: any) => uniq[a] > 1);
                                    if (duplicateHeader.length > 0) {
                                        errorString = "Duplicate columns found : " + duplicateHeader.toString()
                                    }

                                    if (!errorString) {
                                        let missingColumns = "";
                                        requiredFieds.map((data: any) => {
                                            let fieldName = data.pName;

                                            let isFieldExists = header.filter(function (el: any) {
                                                return el?.toLowerCase() == fieldName?.toLowerCase();
                                            });
                                            if (isFieldExists.length == 0) {
                                                if (missingColumns == "") {
                                                    missingColumns = fieldName;
                                                }
                                                else {
                                                    missingColumns += "," + fieldName;
                                                }
                                            }

                                        });
                                        errorString = missingColumns == "" ? "" : missingColumns + " fields required in sheet."
                                    }


                                    headerArray = headerArray.filter(function (el: any) {
                                        return el.field?.toLowerCase() != "entid" && el.field?.toLowerCase() != "recid"
                                    });

                                    if (excelData.length > 0) {
                                        excelData[0].ErrorString = errorString;
                                        rowDataTabArray.push({
                                            sheetName: wsname,
                                            column: headerArray,
                                            rowData: excelData,
                                            checkboxSelected: true,
                                            isError: errorString ? 1 : 0
                                        });
                                    }
                                    else {
                                        rowDataTabArray.push({
                                            sheetName: wsname,
                                            column: headerArray,
                                            rowData: excelData,
                                            checkboxSelected: true,
                                            isError: 0
                                        });
                                    }
                                }


                            }

                            let errorList = rowDataTabArray.filter(function (el: any) {
                                return el.isError == 1
                            });
                            if (errorList.length > 0 || entityName?.toLowerCase() == "staticdata") {
                                setValidWorksheetList((prevArray: any) => [
                                    ...prevArray,
                                    ...rowDataTabArray,
                                ]);
                            }
                            else {

                                databaseValidationOnSheet(rowDataTabArray);
                            }
                        }
                    }
                }, statusBarContext)


            }
        }
    }, [workBook])

    useEffect(() => {
        makeValidWorksheetList();
    }, [workBook, makeValidWorksheetList]);
    useEffect(() => {
        if (validWorksheetList.length > 0) {
            const validateArr: IListItem[] = []
            for (let index = 0; index < validWorksheetList.length; index++) {
                const element = validWorksheetList[index];
                const obj = {
                    label: element.sheetName,
                    id: index,
                    isAuthorized: element.isError > 0 ? false : true,
                    selected: index === 0,
                    ...element
                }
                validateArr.push(obj)
            }
            setValidList(validateArr)
            const columns: IBasicGridColDef[] = [];
            for (let index = 0; index < validWorksheetList[0].column.length; index++) {
                const element = validWorksheetList[0].column[index];
                if (index === validWorksheetList[0].column.length - 1) {
                    element.flex = 1;
                    element.minWidth = 100
                }
                columns.push(element)
            }
            const colDef = columns
            const rowData = validWorksheetList[0].rowData
            setSelectedColDef([...colDef])
            setSelectedRowData([...rowData])
            setSelectedSheet({ ...validWorksheetList[0] })

        } else {
            setSelectedColDef([])
            setSelectedRowData([])
        }

    }, [validWorksheetList]);

    // Function to read Base64 string and handle file based on extension
    const readBase64File = (base64String: string, extension: string) => {
        // Decode Base64 into a Uint8Array
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        let mimeType = "";

        // Determine MIME type based on file extension
        switch (extension?.toLowerCase()) {
            case "xlsx":
                mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                break;
            case "xls":
                mimeType = "application/vnd.ms-excel";
                break;
            case "csv":
                mimeType = "text/csv";
                break;
            default:
                mimeType = "application/octet-stream"; // Default for other types
                break;
        }

        const blob = new Blob([byteArray], { type: mimeType });

        // Read Blob as Binary String
        const reader = new FileReader();
        reader.onload = (evt: any) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            setWorkBook(wb);

        };
        reader.onerror = (error) => console.error("FileReader Error:", error);

        reader.readAsArrayBuffer(blob); // Read as binary string
    };

    const handleImport = () => {
        let selectedEntity = props.selectedNodeInfo?.node;

        let entityName: any = selectedEntity.NodeEntityname;
        let sheetJsonFormat: any = {};
        let selectedSheet: any = validWorksheetList
            .filter(function (el: any) {
                return el.checkboxSelected === true;
            });

        if (selectedSheet.length == 0) {

            setErrorMessage("Select worksheet to import.");
            return false;
        }


        let errorSelectedSheet: any = selectedSheet
            .filter(function (el: any) {
                return el.isError === 1;
            });
        if (errorSelectedSheet.length > 0) {

            setErrorMessage("You must fix error in each worksheet first.");
            return false;
        }

        for (let i = 0; i < selectedSheet.length; i++) {
            sheetJsonFormat[selectedSheet[i].sheetName] = selectedSheet[i].rowData;
        }
        axiosInterceptor({
            url: EM.ImportEntitySheet,
            data: {
                mode: "IMPORT",
                entityName: entityName,
                jsonString: JSON.stringify(sheetJsonFormat)
            },
            setFetchData: (importEntitySheetApiResponse: unknown) => {
                if (importEntitySheetApiResponse && typeof importEntitySheetApiResponse === "object" && 'jsonStringOutput' in importEntitySheetApiResponse) {

                    if (importEntitySheetApiResponse.jsonStringOutput == '' || importEntitySheetApiResponse.jsonStringOutput == null) {

                        ClearAllState();
                        let stepsCompleted = 'stepsCompleted' in importEntitySheetApiResponse ? importEntitySheetApiResponse.stepsCompleted as string : "";
                        if (stepsCompleted == "" || stepsCompleted == null) {
                            setConfirmMessage("Import success");
                            setIsConfirmOpen(true);
                            setShowImportDialog(false);
                        }
                        else {
                            setConfirmMessage(stepsCompleted);
                            setIsConfirmOpen(true);
                            setShowImportDialog(false);
                        }


                    }
                    else {
                        let outputSheetData = FnParseJsonSafely(importEntitySheetApiResponse.jsonStringOutput as string);

                        for (let j = 0; j < validWorksheetList.length; j++) {
                            let newData = outputSheetData[validWorksheetList[j].sheetName];
                            if (newData) {
                                let anyError = newData.filter(function (el: any) {
                                    return typeof el.ErrorType == 'undefined' && el.ErrorType == 2;
                                });
                                let isErrorOnAnySheet = 0;
                                if (anyError.length > 0) {
                                    isErrorOnAnySheet = 1;
                                }
                                validWorksheetList[j].rowData = newData;
                                validWorksheetList[j].isError = isErrorOnAnySheet;
                                let columnIndex = validWorksheetList[j].column.findIndex((x: any) => x.field == "ErrorString");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "ErrorString",
                                        resizable: true
                                    });
                                }
                                columnIndex = validWorksheetList[j].column.findIndex((x: any) => x.field == "RecID");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "RecID",
                                        resizable: true
                                    });
                                }

                                columnIndex = validWorksheetList[j].column.findIndex((x: any) => x.field == "EntID");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "EntID",
                                        resizable: true
                                    });
                                }
                            }
                        }
                        let isErrorOnAnySheet = validWorksheetList.filter(function (el: any) {
                            return el.isError == 1 && el.checkboxSelected == true;
                        });
                        if (isErrorOnAnySheet.length > 0) {
                            setValidWorksheetList([...validWorksheetList]);
                            let stepsCompleted = 'stepsCompleted' in importEntitySheetApiResponse ? importEntitySheetApiResponse.stepsCompleted as string : "";
                            setConfirmMessage(stepsCompleted);
                            setIsConfirmOpen(true);
                            setShowImportDialog(false);
                        }
                        else {
                            ClearAllState();
                            let stepsCompleted = 'stepsCompleted' in importEntitySheetApiResponse ? importEntitySheetApiResponse.stepsCompleted as string : "";
                            if (stepsCompleted == "" || stepsCompleted == null) {

                                setConfirmMessage("Import success");
                                setIsConfirmOpen(true);
                                setShowImportDialog(false);
                            }
                            else {

                                setConfirmMessage(stepsCompleted);
                                setIsConfirmOpen(true);
                                setShowImportDialog(false);
                            }
                            if (props.selectedNodeInfo.node.NodeEntID) {
                                axiosInterceptor({
                                    url: AUDIT.GetAuditDeviceCount,
                                    data: {
                                        auditID: props.selectedNodeInfo.node.NodeEntID
                                    },
                                    setFetchData: (getAuditDeviceCountApiResponse: unknown, status?: string) => {
                                        if (status === "200" && getAuditDeviceCountApiResponse !== undefined) {
                                            setIsReloadNeeded(true)


                                        }
                                    }
                                }, statusBarContext)
                            }
                        }
                    }
                }
            }
        }, statusBarContext)

    }




    const ClearAllState = () => {
        setWorkBook({});
        setValidWorksheetList([]);
        setSelectedSheet({});
    }


    const LoadSelectedSheet = (sheetIndex: any) => {
        const colDef = validWorksheetList[sheetIndex].column

        const rowData = validWorksheetList[sheetIndex].rowData

        setSelectedColDef([...colDef])
        setSelectedRowData([...rowData])
        setSelectedSheet(validWorksheetList[sheetIndex]);
    }



    const checkListData = {
        uniqueName: `${props.uniqueName}-checklist-panel`,
        allowCheckbox: false,
        allowRightIcon: true,
        allowMulticheck: false,
        allowCustomCheckLogic: false,
        allowHeader: true,
        headerText: "",
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
    };


    const handleOnFileChange = async (file: File) => {
        ClearAllState();

        if (!file) return;


        const _validFileExtensions = [".xlsx", ".xls"];

        const isValid = _validFileExtensions.some((ext) =>
            file.name.toLowerCase().endsWith(ext.toLowerCase())
        );

        if (!isValid) {
            setDisableImport(true);
            return;
        }

        const reader = new FileReader();

        reader.onload = (evt: ProgressEvent<FileReader>) => {
            const data = evt.target?.result;

            if (!data) return;

            const wb = XLSX.read(data, { type: "array" });
            setWorkBook(wb);
            setDisableImport(false);
        };

        reader.onerror = (error) => {
            console.error("FileReader Error:", error);
        };

        reader.readAsArrayBuffer(file);
    };
    return (
        <div key={props.uniqueName} className="nz-import-audit-inventory-container">
            {showImportDialog && <div className='nz-popup-overlay'>
                <div className='nz-popup-container'>
                    <div className="nz-import-header">
                        <div className='nz-sub-header'>
                            <Label uniqueName={`${props.uniqueName}-header`}
                                label={props.headerText || ""}
                            />
                            <div className='nz-dialog-action'>
                                <ActionImage
                                    image={{
                                        uniqueName: "import",
                                        source: <Upload24x24
                                            size={FnGetCssVariable('--image-size-2')}
                                            fill='none'
                                            strokeWidth={1} />,
                                        type: "svg",
                                        w: "var(--image-size-2)",
                                        h: "var(--image-size-2)",
                                        tooltip: "Import File"
                                    }}
                                    disabled={disableImport}
                                    uniqueName="import"
                                    w='var(--node_height)'
                                    h='var(--node_height)'
                                    actionCode="import"
                                    handleMouse={handleImport}
                                />
                                <ActionImage
                                    handleMouse={() => {
                                        props.handleCloseDialog(isReloadNeeded)
                                    }}
                                    image={{
                                        uniqueName: props.uniqueName + "cancel",
                                        source: <Close24x24
                                            size={FnGetCssVariable('--image-size-2')}
                                            fill='none'
                                            strokeWidth={1} />,
                                        type: "svg",
                                        w: "var(--image-size-2)",
                                        h: "var(--image-size-2)",
                                        tooltip: "close"
                                    }}
                                    uniqueName={props.uniqueName + 'cancelIcon'}
                                    actionCode='cancel'
                                    w='var(--node_height)'
                                    h='var(--node_height)'
                                />
                            </div>

                        </div>
                    </div>
                    <p className="nz-warning-para-for-file">Do not upload untrusted external files.</p>
                    <div className="nz-import-file-control-div">
                        <div className="nz-file-label">
                            <Label uniqueName={`${props.uniqueName}-file`}
                                label={"Excel File:"}
                            />
                        </div>
                        <div className="nz-file-control">

                            <FileSelectControl label="Upload File"
                                tooltip='Only .xlsx files are allowed'
                                required={true}
                                name={`${props.uniqueName}-fileselect-control`}
                                accept='.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
                                multiple={false}
                                onChange={(files: File[]) => {
                                    if (files?.length > 0) {
                                        handleOnFileChange(files[0]);
                                    }
                                }} />
                        </div>
                    </div>
                    <div className={`nz-import-grid-list`}>
                        {validWorksheetList.length === 0 ? <div className="nz-no-data-found">
                            {errorMessage ? <Label uniqueName={`${props.uniqueName}-file-error`}
                                label={errorMessage}
                                fontWeight='bold'
                                fontSize="18px" color='red' /> : !isFileSelected ? <Label uniqueName={`${props.uniqueName}-file`}
                                    label={"Select file to view data here"}
                                    fontWeight='bold'
                                    fontSize="18px"
                                /> : <></>}

                        </div> : <>
                            <div className="nz-import-left-side">

                                {validList && <CheckedListPanel
                                    {...checkListData}
                                    headerText={`Worksheet (${validList.length})`}
                                    listItems={validList}
                                    handleCustomCheck={(
                                        value: string,
                                        name: string,
                                        isDefault?: boolean
                                    ) => {
                                    }}
                                    handleUpdatedData={(updatedItem: IListItem[]) => {
                                    }}
                                    handleItemSelect={(item: IListItem, listItems: IListItem[]) => {
                                        LoadSelectedSheet(item.id)
                                    }}
                                />}
                            </div>
                            <div className="nz-import-right-side">
                                <div className='nz-sub-header'>
                                    <Label uniqueName={`${props.uniqueName}-header`}
                                        label={'Records by Sheets'}
                                    />
                                </div>
                                <div className="nz-import-grid">
                                    {
                                        selectRowData.length === 0 ? <div className="nz-no-data-found">
                                            <Label uniqueName={`${props.uniqueName}-file`}
                                                label={"No records to show"}
                                                fontWeight='bold'
                                                fontSize="18px"
                                            />
                                        </div> : <div className='ng-import-dataGridDiv'>
                                            <BasicGrid
                                                allowAutoSizeColumn={true}
                                                className='nz-impro-grid'
                                                instanceName='import_table'
                                                featureId={props.featureId}
                                                isExportOnCopy={false}
                                                allowColumnFilter={true}
                                                allowColumnResize={true}
                                                exportFileName={selectedSheet.sheetName ? selectedSheet.sheetName : "ImportData"}
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
                                            ></BasicGrid>
                                        </div>}

                                </div>
                            </div>

                        </>}
                    </div>
                </div>
            </div>}
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={`${props.uniqueName}-error-message`}
                message={confirmMessage}
                showOkButton={true}
                handleYesButtonClick={function (): void {
                }}
                handleNoButtonClick={function (): void {
                }}
                handleOkButtonClick={
                    () => {
                        setIsConfirmOpen(false)
                        props.handleCloseDialog(isReloadNeeded);
                    }
                } />
        </div>
    )
}
export { ImportAuditInventory }
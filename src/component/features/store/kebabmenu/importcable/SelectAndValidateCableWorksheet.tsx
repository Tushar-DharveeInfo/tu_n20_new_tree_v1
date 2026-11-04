import { useCallback, useEffect, useRef, useState } from 'react'
import * as XLSX from "xlsx";
import "../../../allcss/store/kebabmenu/SelectAndValidateCableWorksheet.css";
import { ISelectAndValidateCableWorksheet, TWorkbookState, TWorksheetColumn, TWorksheetRow, TWorksheetSheet } from '../../../allinterface/store/kebabmenu/ISelectAndValidateCableWorksheet';
import { Label } from '../../../../shared/basic/label/Label';
import { FnGetNodeDetailsBaseOnEntID } from '../../../../shared/allcommon/basic/FnGetNodeDetailsBaseOnEntID';
import { DELIMITER } from '../../../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid';
import { ImportCableWorkSheet } from './ImportCableWorkSheet';
import { YesNoFormContainer } from '../../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { CheckedListPanel } from '../../../../shared/basic/checkedlistpanel/CheckedListPanel';
import { IListItem } from '../../../../shared/allinterface/basic/ICheckedListPanel';
import { axiosInterceptor } from '../../../../shared/interceptors/Interceptor';
import { CABLING, EM } from '../../../../shared/interceptors/EndPoints';
import { useStatusBarContext } from '../../../../shared/context/hooks/StatusBarHooks';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { FileSelectControl } from '@n20a/libform';
import { IFnCreateForensiclog } from '../../../../appcontainer/allinterface/IFnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { FnCreateForensiclog } from '../../../../appcontainer/allcommon/FnCreateForensiclog';
import { useSessionContext } from '../../../../shared/context/hooks/SessionHooks';
import { useMainAppContext } from '../../../../shared/context/hooks/MainAppHooks';
import { BasicGrid } from '../../../../shared/tablegrid/BasicGrid';
import { ITreeNode } from '../../../../shared/allinterface/tree/ITreeControl';
import { FnParseJsonSafely } from '../../../../appcontainer/allcommon/FnParseJsonSafely';
import { Key } from 'rc-tree/lib/interface';

// Returns first character from a cell value for row skip logic.
const getFirstCharacter = (value: unknown): string => {
    if (value === undefined || value === null) {
        return "";
    }
    return String(value).charAt(0);
};

const SelectAndValidateCableWorksheet = (props: ISelectAndValidateCableWorksheet) => {
    const [disabledImportBtnMain, setDisabledImportBtnMain] = useState(true);
    const [workBook, setWorkBook] = useState<TWorkbookState>(null);
    const [selectedSheet, setSelectedSheet] = useState<TWorksheetSheet | null>(null);
    const [validWorksheetList, setValidWorksheetList] = useState<TWorksheetSheet[]>([]);
    const [validList, setValidList] = useState<IListItem[]>([])
    const [showImportLoader, setShowImportLoader] = useState(false);
    const [mode, setMode] = useState("IMPORT");
    const [updateOnly, setUpdateOnly] = useState<boolean>(false);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [checkAllKey, setCheckAllkey] = useState<Key[]>([]);
    const [halfChecked, setHalfChecked] = useState<Key[]>([]);
    const [parentNodeData, setParentNodeData] = useState<ITreeNode[]>([])
    const [selectedColDef, setSelectedColDef] = useState<TWorksheetColumn[]>([])
    const [selectRowData, setSelectedRowData] = useState<TWorksheetRow[]>([])
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(0)
    const statusBarContext = useStatusBarContext();
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();

    const checkListData = {
        uniqueName: props.uniqueName + 'check-list',
        allowCheckbox: false,
        allowRightIcon: true,
        allowMulticheck: false,
        allowCustomCheckLogic: false,
        allowHeader: true,
        headerText: "Worksheet",
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
    };
    // Reset all import worksheet state to initial values.
    const clearStateVariable = () => {
        setDisabledImportBtnMain(true)
        setWorkBook(null)
        setSelectedSheet(null)
        setValidWorksheetList([])
        setValidList([])
        setShowImportLoader(false)
        setUpdateOnly(false)
        setTreeData([])
        setCheckAllkey([])
        setParentNodeData([])
        setHalfChecked([])
        setSelectedRowData([])
        setSelectedColDef([])
        setLastSelectedIndex(0)

    }
    // Build parent node chain from entity ID for column context.
    const getParentNodeFromEntID = useCallback(async (treeData: ITreeNode[], parentEntID: string | null | undefined, _isClear = false) => {
        const parentNode: ITreeNode[] = [];
        for (let index = 0; index < 1000; index++) {
            const data = FnGetNodeDetailsBaseOnEntID(treeData, parentEntID as string) as { parentNodeData?: { node?: ITreeNode } } | null;
            if (data?.parentNodeData) {
                if (data.parentNodeData.node) {
                    parentNode.push(data.parentNodeData.node)
                    parentEntID = data.parentNodeData.node.parentEntID
                }
                if (!data?.parentNodeData?.node?.parentEntID) {
                    break;
                }
            } else {
                break;
            }
        }
        parentNode.push(props.selectedNodeInfo.node as ITreeNode)
        setParentNodeData(parentNode)
    }, [props.selectedNodeInfo])

    // Sync tree selection and import mode from parent props.
    useEffect(() => {
        setCheckAllkey(props.checkedNodeKeys ?? []);
        setHalfChecked(props.halfCheckedNodeKeys ?? []);
        setTreeData(props.treeData);
        setUpdateOnly(props.updateOnly);
        if (props.updateOnly) {
            setMode("UPDATE");
        }
        else {
            setMode("IMPORT");
        }
        if (props.selectedNodeInfo) {
            if (props.selectedNodeInfo.node.parentEntID) {
                getParentNodeFromEntID(props.explorerTreeData, props.selectedNodeInfo.node.parentEntID)

            }
        }
    }, [props.checkedNodeKeys, props.explorerTreeData, props.selectedNodeInfo, props.halfCheckedNodeKeys, props.treeData, props.updateOnly, getParentNodeFromEntID])

    // Update preview grid when validated worksheet list or selection index changes.
    useEffect(() => {
        if (validWorksheetList.length > 0) {

            const colDef = validWorksheetList[lastSelectedIndex].column
            const rowData = validWorksheetList[lastSelectedIndex].rowData
            const lastDef = colDef.length
            for (let index = 0; index < colDef.length; index++) {
                const element = colDef[index];
                if (index === (lastDef - 1)) {
                    element.flex = 1
                    element.minWidth = 120
                    element.resizable = false
                } else {
                    element.resizable = true
                }
            }
            setSelectedColDef([...colDef])
            setSelectedRowData([...rowData])
            setSelectedSheet({ ...validWorksheetList[lastSelectedIndex] })
            // 
            let validateErrorConut = 0
            for (let index = 0; index < validWorksheetList.length; index++) {
                const element = validWorksheetList[index];
                validateErrorConut += element.isError

            }

            if (validateErrorConut === 0) {
                setDisabledImportBtnMain(true)
            }
        } else {
            setSelectedColDef([])
            setSelectedRowData([])
        }

    }, [validWorksheetList, lastSelectedIndex]);
    const makeValidWorksheetListRef = useRef<(() => Promise<boolean | void>) | null>(null);

    // Keep latest makeValidWorksheetList callback in ref for workbook effect.
    useEffect(() => {
        makeValidWorksheetListRef.current = makeValidWorksheetList;
    });

    // Validate uploaded workbook sheets against selected tree tables.
    const makeValidWorksheetList = async () => {
        setDisabledImportBtnMain(true);
        if (workBook?.SheetNames) {
            const sheetCount = workBook.SheetNames.length;
            setValidWorksheetList([]);

            if (sheetCount > 0) {
                const entityData = await getCheckedEntityList();

                if (entityData.length == 0) {
                    setConfirmMessage("No table is selected to import");
                    setIsConfirmOpen(true);
                    return false;
                }

                const selectedEntity = entityData[0];
                const entityName = selectedEntity.NodeEntityname;

                if (entityName?.toLowerCase() == "em") {
                    loadWorkSheetWithoutValidation();
                    return false;
                }
                const requiredTableList = selectedEntity.children?.filter(function (el) {
                    return checkAllKey.includes(el.key) || halfChecked.includes(el.key);
                });

                const userSheetnames = workBook.SheetNames;
                let missingSheetsErr = "";
                // check missing worksheet
                for (let j = 0; j < requiredTableList.length; j++) {
                    const tablenName = requiredTableList[j].Name;

                    const sheetExists = userSheetnames.filter(function (el) {
                        return el?.toLowerCase() == tablenName?.toLowerCase();
                    });

                    if (sheetExists.length == 0) {
                        if (missingSheetsErr == "") {
                            missingSheetsErr = tablenName as string;
                        }
                        else {
                            missingSheetsErr += ", " + tablenName;
                        }
                    }
                }

                if (missingSheetsErr != "") {
                    setDisabledImportBtnMain(true);
                    setConfirmMessage(missingSheetsErr + " Worksheet(s) are missing for selected table");
                    setIsConfirmOpen(true);
                    return false;
                }

                const validUserShets: ITreeNode[] = [];
                for (let j = 0; j < userSheetnames.length; j++) {
                    const sheetName = userSheetnames[j];

                    const sheetExists = requiredTableList.filter(function (el) {
                        return el.Name?.toLowerCase() == sheetName?.toLowerCase();
                    })

                    if (sheetExists && sheetExists.length > 0) {
                        validUserShets.push(sheetExists[0]);
                    }
                }
                if (validUserShets.length == 0) {
                    setConfirmMessage("Your excel file doesn't contain any valid worksheets.");
                    setIsConfirmOpen(true);
                    return false;
                }
                let requiredSheetNames = "";
                //IMPORT MODE
                if (updateOnly == false) {
                    const requiredToAddSheet = selectedEntity.children?.filter(function (el) {
                        return checkAllKey.includes(el.key) || halfChecked.includes(el.key);
                    });


                    for (let k = 0; k < requiredToAddSheet.length; k++) {
                        const requiredSheetExists = validUserShets.filter(function (el) {
                            return el.Name?.toLowerCase() == requiredToAddSheet[k].Name?.toLowerCase();
                        });
                        if (requiredSheetExists.length == 0) {
                            if (requiredSheetNames == "")
                                requiredSheetNames = requiredToAddSheet[k].Name as string;
                            else
                                requiredSheetNames += "," + requiredToAddSheet[k].Name;
                        }
                    }
                }
                else if (updateOnly == true) {
                    const requiredToUpdateSheet = selectedEntity.children?.filter(function (el) {
                        return checkAllKey.includes(el.key) || halfChecked.includes(el.key);
                    });
                    for (let k = 0; k < requiredToUpdateSheet.length; k++) {
                        const requiredSheetExists = validUserShets.filter(function (el) {
                            return el.Name?.toLowerCase() == requiredToUpdateSheet[k].Name?.toLowerCase();
                        });
                        if (requiredSheetExists.length == 0) {
                            if (requiredSheetNames == "")
                                requiredSheetNames = requiredToUpdateSheet[k].Name as string;
                            else
                                requiredSheetNames += "," + requiredToUpdateSheet[k].Name;
                        }
                    }
                }
                if (requiredSheetNames) {
                    return false;
                }
                let tableNamesCommaSeperated = '';
                for (let i = 0; i < validUserShets.length; i++) {
                    tableNamesCommaSeperated += DELIMITER.separator + validUserShets[i].Name;
                }
                setShowImportLoader(true);

                try {
                    const handleGetFieldListResponse = async (response: unknown) => {
                        let fieldListAll = response;
                        let rowDataTabArray: TWorksheetSheet[] = [];

                        for (let i = 0; i < validUserShets.length; i++) {
                            const wsname = validUserShets[i].Name;
                            let fieldList = (fieldListAll as ITreeNode[]).filter(function (el) {
                                return el.tableName?.toLowerCase() == wsname?.toLowerCase();
                            });
                            let requiredFieds: ITreeNode[] = [];
                            if (fieldList.length > 0) {
                                if (updateOnly) {
                                    requiredFieds = fieldList.filter(function (el) {
                                        return el.requiredToUpdateRecord == true;
                                    });
                                }
                                else {
                                    requiredFieds = fieldList.filter(function (el) {
                                        return el.requiredToAddRecord == true;
                                    });
                                }
                            }
                            const excelSheetFind = workBook.SheetNames.filter(function (el) {
                                return el?.toLowerCase() == wsname?.toLowerCase();
                            });

                            const ws = workBook.Sheets[excelSheetFind[0]];

                            const data = XLSX.utils.sheet_to_json(ws, {
                                header: 1,
                                raw: false,
                                blankrows: false
                            })
                            let header = data[0] as string[] | undefined;

                            if (header) {
                                let headerArray: TWorksheetColumn[] = [];
                                headerArray.push({
                                    field: "ErrorString",
                                    resizable: true,
                                    headerName: "ErrorString"
                                });
                                let ignoreColumns: string[] = [];
                                let dataMissing = await getMissingColFromSheet(requiredFieds, header)
                                let parentObj: Record<string, string | undefined> = {}
                                for (let index = 0; index < dataMissing.parentColumns.length; index++) {
                                    const element = dataMissing.parentColumns[index];
                                    for (let j = 0; j < parentNodeData.length; j++) {
                                        const dataNode = parentNodeData[j];
                                        if (element == dataNode.PGClassName) {
                                            parentObj[element] = dataNode.Name as string
                                            if (dataMissing.missingColumns.includes(element)) {
                                                header.push(element)
                                            }

                                        }


                                    }

                                }

                                header = header.map((data) => {
                                    let checkValidField = fieldList.filter(function (el) {
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
                                    let objetRow = data[x] as unknown[];
                                    let dataObject: TWorksheetRow = {};
                                    // ignore row that has starting cell value = "!"
                                    let firstCharacter = getFirstCharacter(objetRow[0]);
                                    if (firstCharacter != "!") {
                                        header.map((data, index: number) => {
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

                                let updatedRowData: TWorksheetRow[] = []
                                if (excelData) {
                                    const mergedObjects = (obj1: TWorksheetRow, obj2: Record<string, string | undefined>) => {
                                        const merged = { ...obj1 };

                                        Object.keys(obj2).forEach((key) => {
                                            const obj2Value = obj2[key];
                                            if (obj2Value !== null && !Object.prototype.hasOwnProperty.call(merged, key)) {
                                                merged[key] = obj2Value ?? '';
                                            } else if (Object.prototype.hasOwnProperty.call(merged, key) && !String(merged[key] ?? '').length) {
                                                merged[key] = obj2Value ?? ''
                                            }
                                        });

                                        return merged;
                                    }; for (let i = 0; i < excelData.length; i++) {
                                        let element = excelData[i];
                                        if (Object.keys(parentObj)) {
                                            element = mergedObjects(element, parentObj);
                                        }
                                        element.ErrorString = ""
                                        element.isError = 0
                                        updatedRowData.push(element)

                                    }

                                }
                                excelData = updatedRowData;
                                const uniq = headerArray
                                    .map((hd) => {
                                        return {
                                            count: 1,
                                            name: hd.field?.toLowerCase().trim()
                                        };
                                    }).reduce((result: Record<string, number>, b) => {
                                        result[b.name] = (result[b.name] || 0) + b.count;
                                        return result;
                                    }, {});

                                let errorString = "";

                                const duplicateHeader = Object.keys(uniq).filter((a) => uniq[a] > 1);
                                if (duplicateHeader.length > 0) {
                                    errorString = "Duplicate columns found : " + duplicateHeader.toString()
                                }

                                if (!errorString) {
                                    let missingColumns = "";
                                    requiredFieds.map((data) => {
                                        let fieldName = data.pName;

                                        let isFieldExists = header?.filter(function (el) {
                                            return el?.toLowerCase() == fieldName?.toLowerCase();
                                        });
                                        if (isFieldExists?.length == 0) {
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

                                if (!updateOnly) {
                                    headerArray = headerArray.filter(function (el) {
                                        return el.field?.toLowerCase() != "entid" && el.field?.toLowerCase() != "recid"
                                    });
                                }
                                if (excelData.length > 0) {
                                    excelData[0].ErrorString = errorString;
                                    rowDataTabArray.push({
                                        sheetName: wsname as string,
                                        column: headerArray,
                                        rowData: excelData,
                                        checkboxSelected: true,
                                        isError: errorString ? 1 : 0
                                    });
                                }
                                else {
                                    rowDataTabArray.push({
                                        sheetName: wsname as string,
                                        column: headerArray,
                                        rowData: excelData,
                                        checkboxSelected: true,
                                        isError: 0
                                    });
                                }

                            }


                        }

                        let errorList = rowDataTabArray.filter(function (el) {
                            return el.isError == 1
                        });
                        if (errorList.length > 0 || entityName?.toLowerCase() == "staticdata") {
                            setShowImportLoader(false);
                            setDisabledImportBtnMain(true);
                            setValidWorksheetList((prevArray) => [
                                ...prevArray,
                                ...rowDataTabArray,
                            ]);
                            let validateArr: IListItem[] = []
                            for (let index = 0; index < rowDataTabArray.length; index++) {
                                const element = rowDataTabArray[index];
                                let obj = {
                                    label: element.sheetName,
                                    id: index.toString(),
                                    isAuthorized: element.isError > 0 ? false : true,
                                    selected: index === 0,
                                    ...element
                                }
                                validateArr.push(obj as IListItem)
                            }

                            setValidList(validateArr)
                        }
                        else {

                            setDisabledImportBtnMain(false);
                            await databaseValidationOnSheet(rowDataTabArray);
                        }
                    }
                    const payload = {
                        "mode": mode,
                        "entityName": selectedEntity.NodeEntityname,
                        "tableNames": tableNamesCommaSeperated,
                    }
                    axiosInterceptor({
                        url: EM.GetFieldList,
                        data: payload,
                        allowShowLoader: true,
                        setFetchData: handleGetFieldListResponse
                    }, statusBarContext)

                } catch (error) {
                    console.error("GetFieldLists Error:", error);
                }
            }
        }
    }

    // Run worksheet validation when a new workbook is loaded.
    useEffect(() => {
        if (workBook) {
            makeValidWorksheetListRef.current?.();
        }
    }, [workBook]);


    // Compare sheet headers against required fields and return missing columns.
    const getMissingColFromSheet = async (requiredFieds: ITreeNode[], header: string[]) => {
        const missingColumns: string[] = []
        const parentColumns: string[] = []
        requiredFieds.map((data) => {
            const fieldName = data.pName;
            if (!fieldName?.toLowerCase()?.includes("id")) {
                const isFieldExists = header.filter(function (el) {
                    return el?.toLowerCase() == fieldName?.toLowerCase();
                });
                if (isFieldExists.length == 0) {
                    missingColumns.push(fieldName);
                }
                parentColumns.push(fieldName)
            }


        });
        return { missingColumns, parentColumns }
    }

    // Load all workbook sheets without server-side validation (EM entity).
    const loadWorkSheetWithoutValidation = () => {

        const rowDataTabArray: TWorksheetSheet[] = [];
        if (workBook) {
            for (let i = 0; i < workBook.SheetNames.length; i++) {
                const wsname = workBook.SheetNames[i];
                const ws = workBook.Sheets[wsname];

                const firstCell = ws["A1"]; // check first cell has value or not
                if (firstCell) {
                    const firstCellValue = firstCell.v;
                    if (firstCellValue) {
                        const data = XLSX.utils.sheet_to_json(ws, {
                            header: 1,
                            raw: false,
                            blankrows: false,
                            defval: ""
                        });
                        const header = data[0] as string[] | undefined;

                        if (header) {
                            const headerArray: TWorksheetColumn[] = [];

                            header.map((data) => {
                                headerArray.push({
                                    field: data,
                                    resizable: true,
                                    headerName: data
                                });
                            });

                            const excelData = [];
                            for (let x = 1; x < data.length; x++) {
                                const objetRow = data[x] as unknown[];
                                const dataObject: TWorksheetRow = {};

                                const firstCharacter = getFirstCharacter(objetRow[0]);

                                if (firstCharacter != "!") {
                                    header.map((data, index: number) => {
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
            setValidWorksheetList((prevArray) => [
                ...prevArray,
                ...rowDataTabArray,
            ]);
        }
    }


    // Send sheet data to server for entity validation and update error state.
    const databaseValidationOnSheet = async (sheetdata: TWorksheetSheet[]) => {

        const sheetJsonFormat: Record<string, TWorksheetRow[]> = {};
        for (let i = 0; i < sheetdata.length; i++) {
            sheetJsonFormat[sheetdata[i].sheetName] = sheetdata[i].rowData;
        }
        const entityData = await getCheckedEntityList();
        const selectedEntity = entityData[0];
        try {
            const handleValidateEntitySheetResponse = (response: unknown, status?: string) => {
                if (status !== '200') {
                    console.error("ValidateEntitySheet Error:", response);
                }
                let responseData: Record<string, TWorksheetRow[]>;
                try {
                    responseData = FnParseJsonSafely(String(response)) as Record<string, TWorksheetRow[]>;
                } catch (error) {
                    console.error("ValidateEntitySheet parse error:", error);
                    setShowImportLoader(false);
                    setDisabledImportBtnMain(true);
                    return;
                }
                setDisabledImportBtnMain(false);

                for (let j = 0; j < sheetdata.length; j++) {
                    const newData = responseData[sheetdata[j].sheetName];
                    const errorList = newData.filter(function (el: Record<string, unknown>) {
                        return el.ErrorType === 2;
                    });
                    if (errorList.length > 0) {
                        sheetdata[j].isError = 1;
                        setDisabledImportBtnMain(true);
                    }
                    else {
                        sheetdata[j].isError = 0;
                    }
                    sheetdata[j].rowData = newData;
                }
                setShowImportLoader(false);
                setValidWorksheetList([
                    ...sheetdata,
                ]);

            }
            const payload = {
                "mode": updateOnly ? "UPDATE" : "IMPORT",
                "entityName": selectedEntity.NodeEntityname,
                "jsonString": JSON.stringify(sheetJsonFormat),
            }
            axiosInterceptor({
                url: EM.ValidateEntitySheet,
                data: payload,
                allowShowLoader: true,
                setFetchData: handleValidateEntitySheetResponse
            }, statusBarContext)

        } catch (err) {
            console.error("ValidateEntitySheet Error:", err);
        }
    }


    // Build sheet tab list and sync grid after validation completes.
    useEffect(() => {
        if (validWorksheetList.length > 0) {
            const validateArr: IListItem[] = []
            for (let index = 0; index < validWorksheetList.length; index++) {
                const element = validWorksheetList[index];
                const obj = {
                    label: element.sheetName,
                    id: index.toString(),
                    isAuthorized: element.isError > 0 ? false : true,
                    selected: index === 0,
                    ...element
                }
                validateArr.push(obj as IListItem)
            }
            setValidList(validateArr)
            const colDef = validWorksheetList[lastSelectedIndex].column
            const rowData = validWorksheetList[lastSelectedIndex].rowData
            let col = []
            for (let index = 0; index < colDef.length; index++) {
                let element = colDef[index];
                if (element.field === "ErrorString") {
                    element.sortable = true
                }
                if (index === colDef.length - 1) {
                    element.minWidth = 200
                }
                col.push(element)
            }
            setSelectedColDef([...col])
            setSelectedRowData([...rowData])
            setSelectedSheet({ ...validWorksheetList[lastSelectedIndex] })
            // 
            let validateErrorConut = 0
            for (let index = 0; index < validWorksheetList.length; index++) {
                const element = validWorksheetList[index];
                validateErrorConut += element.isError

            }

            if (validateErrorConut === 0) {
                setDisabledImportBtnMain(false)
            } else {
                setDisabledImportBtnMain(true)
            }
        } else {
            setSelectedColDef([])
            setSelectedRowData([])
        }

    }, [validWorksheetList, lastSelectedIndex]);

    // Clear workbook and worksheet state before loading a new file.
    const ClearAllState = () => {
        setWorkBook(null);
        setValidWorksheetList([]);
        setSelectedSheet(null);
        setLastSelectedIndex(0)
    }
    // Load grid columns and rows for the selected worksheet tab.
    const LoadSelectedSheet = (sheetIndex: number) => {
        const colDef = validWorksheetList[sheetIndex].column
        const rowData = validWorksheetList[sheetIndex].rowData
        setSelectedColDef([...colDef])
        setSelectedRowData([...rowData])
        setSelectedSheet({ ...validWorksheetList[sheetIndex] });
    }

    // Read and parse selected Excel file into workbook state.
    const handleOnFileChange = async (
        params: File | { FPFileContent?: string; FPFileExtension?: string; FPFileName?: string }
    ): Promise<void> => {
        try {
            ClearAllState();
            let fileName = "";
            let workbook: XLSX.WorkBook | null = null;

            // -----------------------------
            // NEW FILE CONTROL SUPPORT
            // -----------------------------
            if (params instanceof File) {
                fileName = String(params.name || "");
                const validExtensions = [
                    ".xlsx",
                    ".xls"
                ];
                const lowerFileName = fileName.toLowerCase();
                const isValidFile =
                    validExtensions.some(
                        (extension: string) =>
                            lowerFileName.endsWith(
                                extension
                            )
                    );
                if (!isValidFile) {
                    setDisabledImportBtnMain(true);
                    setConfirmMessage(
                        "Select valid excel file"
                    );
                    setIsConfirmOpen(true);
                    return;
                }
                const arrayBuffer =
                    await params.arrayBuffer();
                workbook = XLSX.read(
                    arrayBuffer,
                    {
                        type: "array"
                    }
                );
            }

            // -----------------------------
            // OLD FILE OBJECT SUPPORT
            // -----------------------------

            else if (
                params?.FPFileContent &&
                params?.FPFileExtension
            ) {
                fileName = `${params.FPFileName}.${params.FPFileExtension}`;
                const validExtensions = [
                    ".xlsx",
                    ".xls"
                ];
                const lowerFileName = fileName.toLowerCase();
                const isValidFile =
                    validExtensions.some(
                        (extension: string) =>
                            lowerFileName.endsWith(
                                extension
                            )
                    );

                if (!isValidFile) {
                    setDisabledImportBtnMain(true);
                    setConfirmMessage(
                        "Select valid excel file"
                    );
                    setIsConfirmOpen(true);
                    return;
                }

                const byteCharacters = atob(params.FPFileContent);
                const byteNumbers = new Array(
                    byteCharacters.length
                );
                for (
                    let i = 0;
                    i < byteCharacters.length;
                    i++
                ) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                workbook = XLSX.read(
                    byteArray,
                    {
                        type: "array"
                    }
                );
            }
            // -----------------------------
            // INVALID PARAMS
            // -----------------------------
            else {
                setDisabledImportBtnMain(true);
                setConfirmMessage(
                    "Invalid file selected."
                );
                setIsConfirmOpen(true);
                return;
            }

            // -----------------------------
            // FINAL WORKBOOK VALIDATION
            // -----------------------------

            if (
                !workbook ||
                !workbook.SheetNames ||
                workbook.SheetNames.length === 0
            ) {
                setDisabledImportBtnMain(true);
                setConfirmMessage(
                    "Selected Excel file contains no worksheets."
                );
                setIsConfirmOpen(true);
                return;
            }
            setWorkBook(workbook);
        } catch (error) {
            console.error(
                "handleOnFileChange Error:",
                error
            );
            setDisabledImportBtnMain(true);
            setConfirmMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to read Excel file."
            );
            setIsConfirmOpen(true);
        }
    };

    // Collect checked entity nodes from the import tree.
    const getCheckedEntityList = async () => {
        const entityData: ITreeNode[] = [];
        treeData.forEach((item) => {
            if (item.NodeType == "EntityNode") {
                if (checkAllKey.includes(item.key) || halfChecked.includes(item.key)) {
                    entityData.push(item);
                }
            }
            else {
                item.children?.forEach((subItem) => {
                    if (subItem.NodeType == "EntityNode") {
                        if (checkAllKey.includes(subItem.key) || halfChecked.includes(subItem.key)) {
                            entityData.push(subItem);
                        }
                    }
                })
            }
        });
        return entityData;
    }

    // Validate selection and submit checked worksheets for cable import.
    const handleImport = async () => {
        const entityData = await getCheckedEntityList();
        if (entityData.length == 0) {
            setConfirmMessage("No table is selected to import");
            setIsConfirmOpen(true);
            return false;
        }
        const sheetJsonFormat: Record<string, TWorksheetRow[]> = {};
        const selectedSheet = validWorksheetList.filter(function (el) {
            return el.checkboxSelected === true;
        });
        if (selectedSheet.length == 0) {
            setConfirmMessage("Select worksheet to import.");
            setIsConfirmOpen(true);
            return false;
        }

        let requiredSheetErr = "";
        for (let i = 0; i < entityData[0].children?.length; i++) {
            const tableProp = entityData[0].children[i];
            let isRequired = false;
            const tableName = tableProp.tableName;
            if (!updateOnly) {
                if (tableProp.requiredToAddRecord == true) {
                    isRequired = true;
                }
            } else {
                if (tableProp.requiredToUpdateRecord == true) {
                    isRequired = true;
                }
            }
            if (isRequired) {
                const isRequieredShhetExists = selectedSheet.filter(function (el) {
                    return el.sheetName?.toLowerCase() === tableName?.toLowerCase();
                });
                if (isRequieredShhetExists.length == 0) {
                    if (requiredSheetErr == "") {
                        requiredSheetErr = tableName;
                    } else {
                        requiredSheetErr += "," + tableName;
                    }
                }
            }
        }

        if (requiredSheetErr != "") {
            setConfirmMessage("You must select required worksheet(s) i.e ${requiredSheetErr} to import or update.");
            setIsConfirmOpen(true);
            return false;
        }
        const errorSelectedSheet = selectedSheet.filter(function (el) {
            return el.isError === 1;
        });
        if (errorSelectedSheet.length > 0) {
            setConfirmMessage("You must fix error in each worksheet first.");
            setIsConfirmOpen(true);
            return false;
        }
        let sheetName: string[] = []
        for (let i = 0; i < selectedSheet.length; i++) {
            sheetName.push(selectedSheet[i].sheetName);
            sheetJsonFormat[selectedSheet[i].sheetName] = selectedSheet[i].rowData;
        }
        setShowImportLoader(true);
        statusBarContext.setIsLoading(true);
        if (showImportLoader == false) {
            try {
                const handleApiImportCable = (response: Record<string, unknown>, status?: string) => {
                    setShowImportLoader(false);
                    if (status === '200') {
                        const payload: IFnCreateForensiclog = {
                            logType: 'UserAction',
                            GroupName: LogGroupName.ForensicLogTemplate,
                            _Forensiclog: LogSubGroupName.Entities,
                            SubGroupName: LogSubGroupName.Entities,
                            LogName: LogName.Import,
                            actionObject: {
                                FeatureName: "Cable Import",
                                tableNames: sheetName.join(", ")
                            },
                            sessionContext: sessionContext,
                            statusBarContext: statusBarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        }
                        FnCreateForensiclog(payload)
                        statusBarContext.setIsLoading(true);

                        const handleValidateInputResponse = (responseValidate: Record<string, unknown>) => {
                            setShowImportLoader(false);
                            statusBarContext.setIsLoading(false);
                            if (responseValidate.missing == false) {
                                axiosInterceptor({
                                    url: CABLING.ImportCables,
                                    data: {},
                                    setFetchData: () => { }
                                }, statusBarContext)
                                setShowImportLoader(true);
                                if (
                                    response && response.jsonStringOutput == "" ||
                                    response && response.jsonStringOutput == null
                                ) {

                                    const outputSheetData = FnParseJsonSafely(response.jsonStringOutput as string);

                                    for (let j = 0; j < validWorksheetList.length; j++) {
                                        let newData = outputSheetData[validWorksheetList[j].sheetName];
                                        if (newData) {
                                            const anyError = newData.filter(function (el: Record<string, unknown>) {
                                                return (
                                                    typeof el.ErrorString !== "undefined" &&
                                                    el.ErrorString != ""
                                                );
                                            });
                                            let isErrorOnAnySheet = 0;
                                            if (anyError.length > 0) {
                                                isErrorOnAnySheet = 1;
                                            }
                                            validWorksheetList[j].rowData = newData;
                                            validWorksheetList[j].isError = isErrorOnAnySheet;
                                            let columnIndex = validWorksheetList[j].column.findIndex(
                                                (x: TWorksheetColumn) => x.field == "ErrorString"
                                            );
                                            if (columnIndex === -1) {
                                                validWorksheetList[j].column.push({
                                                    field: "ErrorString",
                                                    resizable: true,
                                                });
                                            }
                                            columnIndex = validWorksheetList[j].column.findIndex(
                                                (x: TWorksheetColumn) => x.field == "RecID"
                                            );
                                            if (columnIndex === -1) {
                                                validWorksheetList[j].column.push({
                                                    field: "RecID",
                                                    resizable: true,
                                                });
                                            }

                                            columnIndex = validWorksheetList[j].column.findIndex(
                                                (x: TWorksheetColumn) => x.field == "EntID"
                                            );
                                            if (columnIndex === -1) {
                                                validWorksheetList[j].column.push({
                                                    field: "EntID",
                                                    resizable: true,
                                                });
                                            }
                                        }
                                    }
                                    let isErrorOnAnySheet = validWorksheetList.filter(function (
                                        el
                                    ) {
                                        return el.isError == 1 && el.checkboxSelected == true;
                                    });
                                    if (isErrorOnAnySheet.length > 0) {
                                        setValidWorksheetList([...validWorksheetList]);
                                        let stepsCompleted = response.stepsCompleted;
                                        setConfirmMessage(
                                            String(stepsCompleted || "")
                                                .replace(/\\n/g, "\n\n")
                                        );
                                        setIsConfirmOpen(true);
                                    } else {
                                        ClearAllState();
                                        let stepsCompleted = response.stepsCompleted;
                                        if (stepsCompleted == "" || stepsCompleted == null) {
                                            setConfirmMessage("Import success");
                                            setIsConfirmOpen(true);
                                        } else {
                                            setConfirmMessage(
                                                String(stepsCompleted || "")
                                                    .replace(/\\n/g, "\n\n")
                                            );
                                            setIsConfirmOpen(true);
                                        }

                                    }
                                } else if (typeof response === 'string' && response === '') {
                                    setConfirmMessage("Import success");
                                    setIsConfirmOpen(true);
                                }
                            }
                            else {
                                let missingEqId = responseValidate.eqidList
                                setConfirmMessage("EQIDs: " + missingEqId && (missingEqId as string).toString() + ' are not found in library. Please review it and try again.');
                                setIsConfirmOpen(true);
                            }
                        }
                        axiosInterceptor({
                            url: CABLING.ValidateInput,
                            data: null,
                            allowShowLoader: true,
                            setFetchData: handleValidateInputResponse
                        }, statusBarContext)

                    }
                }
                axiosInterceptor({
                    url: CABLING.ImportCable,
                    data: { jsonString: JSON.stringify(sheetJsonFormat) },
                    allowShowLoader: true,
                    setFetchData: handleApiImportCable
                }, statusBarContext)
            } catch (error) {
                console.error("ImportCable Error:", error);
            }
        }
    }

    // Trigger import when import button is clicked.
    const handleClick = (_event: unknown, _actionCode: unknown) => {
        handleImport()
    }


    return (
        <div className="nz-import-container">
            <ImportCableWorkSheet
                uniqueName={props.uniqueName}
                disabled={disabledImportBtnMain}
                handleMouse={(event: unknown, actionCode: unknown) => handleClick(event, actionCode)}
                headerText={props.headerText}
            />
            <p className="nz-warning-para-for-file">Do not upload untrusted external files.</p>
            <div className="nz-import-file-control-div">
                <div className="nz-file-label">
                    <Label uniqueName={`${props.uniqueName}-file`}
                        label={"Excel File:"}
                    />
                </div>
                <div className="nz-file-control">
                    <FileSelectControl
                        tooltip='Only .xlsx files are allowed'
                        required={true}
                        name={'file-select-control-1'}
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
                {validList.length === 0 ? <div className="nz-no-data-found">
                    <Label uniqueName={`${props.uniqueName}-file`}
                        label={"Select file to view data here"}
                        fontWeight='bold'
                        fontSize="18px"
                    />
                </div> : <>
                    <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                        <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-explorer-pane">
                            <div className="nz-import-left-side">

                                {validList && <CheckedListPanel
                                    {...checkListData}
                                    headerText={`Worksheet (${validList.length})`}
                                    listItems={validList}
                                    handleItemSelect={(item: IListItem, listItems: IListItem[]) => {
                                        LoadSelectedSheet(Number(item.id))
                                    }}
                                />}
                            </div>
                        </SplitterPanel>
                        <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane">
                            <div className="nz-import-right-side">
                                <div className='nz-sub-header'>
                                    <Label uniqueName={`${props.uniqueName}-header`}
                                        label={'Records by Sheets'}
                                        fontWeight='bold' />
                                </div>
                                <div className="nz-import-grid">
                                    {selectRowData.length === 0 ? <div className="nz-no-data-found">
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
                                            allowColumnFilter={true}
                                            allowColumnResize={true}
                                            isExportOnCopy={true}
                                            exportFileName={selectedSheet?.sheetName ? selectedSheet.sheetName : "ImportData"}
                                            rowData={selectRowData}
                                            isReadOnly={true}
                                            containerName="import_table"
                                            columnDefs={selectedColDef}
                                            allowPagination={true}
                                            dynamicPagination={true}
                                            paginationAutoPageSize={true}
                                            uniqueName={"nz-impro-grid"}
                                            showGrid={true}
                                        ></BasicGrid>
                                    </div>}

                                </div>
                            </div>
                        </SplitterPanel>
                    </Splitter>
                </>}
            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={props.uniqueName + "confirmbox"}
                message={confirmMessage}
                showOkButton={true}
                handleOkButtonClick={
                    () => {
                        setIsConfirmOpen(false)
                        clearStateVariable()
                        props.handleClearSelection && props.handleClearSelection()
                    }
                } />
        </div >
    )
}



export { SelectAndValidateCableWorksheet }
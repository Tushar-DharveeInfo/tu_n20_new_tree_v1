import { useCallback, useEffect, useState } from 'react'
import * as XLSX from "xlsx";
import { Splitter, SplitterPanel } from 'primereact/splitter';
import "../../../allcss/rackandstack/kebabmenu/SelectAndValidateDeviceWorksheet.css";
import { useMainAppContext } from '../../../../shared/context/hooks/MainAppHooks.ts';
import {
    IEntityFieldListItem,
    IImportEntitySheetResponse,
    ISelectAndValidateDeviceWorksheet,
    IValidateInputResponse,
    TSelectedSheetState,
    TWorkbookState,
    TWorksheetColumn,
    TWorksheetRow,
    TWorksheetSheet
} from '../../../allinterface/rackandstack/kebabmenu/ISelectAndValidateDeviceWorksheet.ts';
import { Label } from '../../../../shared/basic/label/Label.tsx';

import { FnGetNodeDetailsBaseOnEntID } from '../../../../shared/allcommon/basic/FnGetNodeDetailsBaseOnEntID.ts';
import { DELIMITER } from '../../../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid.ts';
import { CheckedListPanel } from '../../../../shared/basic/checkedlistpanel/CheckedListPanel.tsx';
import { IListItem } from '../../../../shared/allinterface/basic/ICheckedListPanel.ts';
import { ImportDeviceWorkSheet } from './ImportDeviceWorkSheet.tsx';
import { axiosInterceptor } from '../../../../shared/interceptors/Interceptor.ts';
import { DEVICE, EM } from '../../../../shared/interceptors/EndPoints.ts';
import { useStatusBarContext } from '../../../../shared/context/hooks/StatusBarHooks.ts';
import { YesNoFormContainer } from '../../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx';
import { FnUpdateStatisticsAndRefresh } from '../../../../appcontainer/allcommon/FnUpdateStatisticsAndRefresh.ts';
import { FileSelectControl } from '@n20a/libform';
import { useSessionContext } from '../../../../shared/context/hooks/SessionHooks.ts';
import { IFnCreateForensiclog } from '../../../../appcontainer/allinterface/IFnCreateForensiclog.ts';
import { LogGroupName, LogName, LogSubGroupName } from '../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog.ts';
import { FnCreateForensiclog } from '../../../../appcontainer/allcommon/FnCreateForensiclog.ts';
import { BasicGrid } from '../../../../shared/tablegrid/BasicGrid.tsx';
import { ITreeNode } from '../../../../shared/allinterface/tree/ITreeControl';
import { Key } from 'rc-tree/lib/interface';
import { FnPortImport } from '../../../../appqa/allcommon/FnPostImport.ts';

const getFirstCharacter = (value: unknown): string => {
    if (typeof value === 'undefined') {
        return "";
    }
    return String(Array.from(value as string | ArrayLike<unknown>)[0] ?? "");
};

const SelectAndValidateDeviceWorksheet = (props: ISelectAndValidateDeviceWorksheet) => {
    const [disabledImportBtnMain, setDisabledImportBtnMain] = useState(true);
    const [workBook, setWorkBook] = useState<TWorkbookState>({});
    const [selectedSheet, setSelectedSheet] = useState<TSelectedSheetState>({});
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
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();

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

            if (props.selectedNodeInfo.node.parentEntID && props.explorerTreeData) {
                getParentNodeFromEntID(props.explorerTreeData, props.selectedNodeInfo.node.parentEntID)

            }
        }
    }, [props.checkedNodeKeys, props.selectedNodeInfo])
    useEffect(() => {
        if (validWorksheetList.length > 0) {
            let colDef = validWorksheetList[lastSelectedIndex].column
            let rowData = validWorksheetList[lastSelectedIndex].rowData
            let lastDef = colDef.length
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

        } else {
            setSelectedColDef([])
            setSelectedRowData([])
        }

    }, [validWorksheetList, lastSelectedIndex]);



    const getParentNodeFromEntID = async (treeData: ITreeNode[], parentEntID: string | null | undefined, _isClear = false) => {
        const parentNode: ITreeNode[] = [];
        for (let index = 0; index < 1000; index++) {
            const data = FnGetNodeDetailsBaseOnEntID(treeData, parentEntID as string) as { parentNodeData?: { node?: ITreeNode } } | null;
            if (data?.parentNodeData) {
                parentNode.push(data.parentNodeData.node as ITreeNode)
                parentEntID = data.parentNodeData.node?.parentEntID
                if (!data?.parentNodeData?.node?.parentEntID) {
                    break;
                }
            } else {
                break;
            }
        }
        parentNode.push(props.selectedNodeInfo?.node as ITreeNode)
        setParentNodeData(parentNode)
    }

    const getMissingColFromSheet = async (requiredFieds: IEntityFieldListItem[], header: string[]) => {
        const missingColumns: string[] = []
        const parentColumns: string[] = []
        requiredFieds.map((data) => {
            const fieldName = data.pName;
            if (!fieldName?.toLowerCase()?.includes("id")) {
                const isFieldExists = header.filter(function (el) {
                    return el?.toLowerCase() == fieldName?.toLowerCase();
                });
                if (isFieldExists.length == 0) {
                    missingColumns.push(fieldName as string);
                }
                parentColumns.push(fieldName as string)
            }


        });
        return { missingColumns, parentColumns }
    }

    const getCheckedEntityList = useCallback(async () => {
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
    }, [treeData, checkAllKey, halfChecked])
    const loadWorkSheetWithoutValidation = useCallback(() => {

        const rowDataTabArray: TWorksheetSheet[] = [];

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
                    let header = data[0] as string[] | undefined;

                    if (header) {
                        const headerArray: TWorksheetColumn[] = [];

                        header.map((data) => {
                            headerArray.push({
                                field: data,
                                resizable: true,
                                headerName: data
                            });
                        });

                        const excelData: TWorksheetRow[] = [];
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
    }, [workBook])

    const makeValidWorksheetList = useCallback(async (workBook: XLSX.WorkBook) => {
        setDisabledImportBtnMain(true);
        if (workBook.SheetNames) {

            let sheetCount = workBook.SheetNames.length;
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
                }) ?? [];

                const userSheetnames = workBook.SheetNames;
                let missingSheetsErr = "";
                // check missing worksheet
                for (let j = 0; j < requiredTableList.length; j++) {
                    let tablenName = requiredTableList[j].Name as string;

                    let sheetExists = userSheetnames.filter(function (el) {
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
                    }) ?? [];


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
                    }) ?? [];
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
                    setConfirmMessage(requiredSheetNames + " sheets required.");
                    setIsConfirmOpen(true);
                    return false;
                }
                let tableNamesCommaSeperated = '';
                for (let i = 0; i < validUserShets.length; i++) {
                    tableNamesCommaSeperated += DELIMITER.separator + validUserShets[i].Name;
                }
                setShowImportLoader(true);
                try {
                    const handleGetFieldListResponse = async (response: unknown) => {
                        const fieldListAll = response as IEntityFieldListItem[];
                        const rowDataTabArray: TWorksheetSheet[] = [];

                        for (let i = 0; i < validUserShets.length; i++) {
                            const wsname = validUserShets[i].Name as string;
                            const fieldList = fieldListAll.filter(function (el) {
                                return el.tableName?.toLowerCase() == wsname?.toLowerCase();
                            });
                            let requiredFieds: IEntityFieldListItem[] = [];
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
                                const ignoreColumns: string[] = [];
                                const dataMissing = await getMissingColFromSheet(requiredFieds, header)
                                const parentObj: Record<string, string | undefined> = {}
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
                                    const checkValidField = fieldList.filter(function (el) {
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
                                        data = checkValidField[0].pName
                                            ? (checkValidField[0].pName as string).trim() : "";

                                        headerArray.push({
                                            field: data,
                                            resizable: true,
                                            headerName: data
                                        });
                                    }

                                    return data
                                });
                                let excelData: TWorksheetRow[] = [];
                                for (let x = 1; x < data.length; x++) {
                                    const objetRow = data[x] as unknown[];
                                    const dataObject: TWorksheetRow = {};
                                    // ignore row that has starting cell value = "!"
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
                                            if (obj2[key] !== null && !merged.hasOwnProperty(key)) {
                                                merged[key] = obj2[key] ?? "";
                                            } else if (merged.hasOwnProperty(key) && !(merged[key] as string | undefined)?.length) {
                                                merged[key] = obj2[key] ?? ""
                                            }
                                        });

                                        return merged;
                                    };





                                    for (let i = 0; i < excelData.length; i++) {
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
                                        const fieldName = data.pName;

                                        const isFieldExists = header?.filter(function (el) {
                                            return el?.toLowerCase() == fieldName?.toLowerCase();
                                        });
                                        if (isFieldExists?.length == 0) {
                                            if (missingColumns == "") {
                                                missingColumns = fieldName as string;
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

                        const errorList = rowDataTabArray.filter(function (el) {
                            return el.isError == 1
                        });
                        if (errorList.length > 0 || entityName?.toLowerCase() == "staticdata") {
                            setShowImportLoader(false);
                            setDisabledImportBtnMain(true);
                            setValidWorksheetList((prevArray) => [
                                ...prevArray,
                                ...rowDataTabArray,
                            ]);
                            const validateArr: IListItem[] = []
                            for (let index = 0; index < rowDataTabArray.length; index++) {
                                const element = rowDataTabArray[index];
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
                        }
                        else {
                            setValidWorksheetList((prevArray) => [
                                ...prevArray,
                                ...rowDataTabArray,
                            ]);
                            const validateArr: IListItem[] = []
                            for (let index = 0; index < rowDataTabArray.length; index++) {
                                const element = rowDataTabArray[index];
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
                } catch (err) {
                    console.error("err in GetFieldList", err);
                }
            }
        }
    }, [checkAllKey, halfChecked, updateOnly, getCheckedEntityList])


    useEffect(() => {
        if (Object.values(workBook).length) {
            makeValidWorksheetList(workBook as XLSX.WorkBook);
        }
    }, [workBook, makeValidWorksheetList]);
    const databaseValidationOnSheet = async (sheetdata: TWorksheetSheet[]) => {

        const sheetJsonFormat: Record<string, TWorksheetRow[]> = {};
        for (let i = 0; i < sheetdata.length; i++) {
            sheetJsonFormat[sheetdata[i].sheetName] = sheetdata[i].rowData;
        }
        const entityData = await getCheckedEntityList();
        const selectedEntity = entityData[0];
        try {
            const handleValidateEntitySheetResponse = (response: unknown) => {
                let responseData: Record<string, TWorksheetRow[]>;
                try {
                    responseData = JSON.parse(String(response)) as Record<string, TWorksheetRow[]>;
                } catch (parseError) {
                    console.error("ValidateEntitySheet parse error:", parseError);
                    setShowImportLoader(false);
                    setDisabledImportBtnMain(true);
                    return;
                }
                setDisabledImportBtnMain(false);

                for (let j = 0; j < sheetdata.length; j++) {
                    const newData = responseData[sheetdata[j].sheetName];
                    const errorList = newData.filter(function (el) {
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
                setValidWorksheetList((prevArray) => [
                    ...prevArray,
                    ...sheetdata,
                ]);

            }
            const payload = {
                "mode": updateOnly ? "UPDATE" : "IMPORT",
                "entityName": props.entityName ?? selectedEntity.NodeEntityname,
                "jsonString": JSON.stringify(sheetJsonFormat),
            }
            axiosInterceptor({
                url: EM.ValidateEntitySheet,
                data: payload,
                allowShowLoader: true,
                setFetchData: handleValidateEntitySheetResponse
            }, statusBarContext)
        } catch (e) {
            console.error("Error in ValidateEntitySheet", e)
        }
    }



    const ClearAllState = () => {
        setWorkBook({});
        setValidWorksheetList([]);
        setSelectedSheet({});
        setLastSelectedIndex(0)
    }
    const LoadSelectedSheet = (sheetIndex: string | number) => {
        const colDef = validWorksheetList[sheetIndex as number].column
        const rowData = validWorksheetList[sheetIndex as number].rowData
        setSelectedColDef([...colDef])
        setSelectedRowData([...rowData])
        setSelectedSheet({ ...validWorksheetList[sheetIndex as number] });
    }

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

                fileName =
                    String(params.name || "");

                const validExtensions = [
                    ".xlsx",
                    ".xls"
                ];

                const lowerFileName =
                    fileName.toLowerCase();

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

                fileName =
                    `${params.FPFileName}.${params.FPFileExtension}`;

                const validExtensions = [
                    ".xlsx",
                    ".xls"
                ];

                const lowerFileName =
                    fileName.toLowerCase();

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

                const byteCharacters =
                    atob(params.FPFileContent);

                const byteNumbers =
                    new Array(
                        byteCharacters.length
                    );

                for (
                    let i = 0;
                    i < byteCharacters.length;
                    i++
                ) {

                    byteNumbers[i] =
                        byteCharacters.charCodeAt(i);
                }

                const byteArray =
                    new Uint8Array(byteNumbers);

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


    const handleImport = async () => {
        statusBarContext.setIsLoading(true)
        const entityData = await getCheckedEntityList();

        if (entityData.length == 0) {
            setConfirmMessage("No table is selected to import");
            setIsConfirmOpen(true);
            return false;
        }
        const entityName = props.entityName ?? entityData[0].NodeEntityname;

        const sheetJsonFormat: Record<string, TWorksheetRow[]> = {};
        const selectedSheet = validWorksheetList
            .filter(function (el) {
                return el.checkboxSelected === true;
            });

        if (selectedSheet.length == 0) {
            setConfirmMessage("Select worksheet to import.");
            setIsConfirmOpen(true);
            return false;
        }

        let requiredSheetErr = "";
        for (let i = 0; i < entityData[0].children?.length; i++) {
            let tableProp = entityData[0].children[i];
            let isRequired = false;
            let tableName = tableProp.tableName;
            if (!updateOnly) {
                if (tableProp.requiredToAddRecord == true) {
                    isRequired = true;
                }
            }
            else {
                if (tableProp.requiredToUpdateRecord == true) {
                    isRequired = true;
                }
            }
            if (isRequired) {
                let isRequieredShhetExists = selectedSheet
                    .filter(function (el) {
                        return el.sheetName?.toLowerCase() === tableName?.toLowerCase();
                    });
                if (isRequieredShhetExists.length == 0) {
                    if (requiredSheetErr == "") {
                        requiredSheetErr = tableName;
                    }
                    else {
                        requiredSheetErr += "," + tableName;
                    }
                }
            }
        }

        if (requiredSheetErr != "") {
            setConfirmMessage(`You must select required worksheet(s) i.e ${requiredSheetErr} to import or update.`);
            setIsConfirmOpen(true);
            return false;
        }
        const errorSelectedSheet = selectedSheet
            .filter(function (el) {
                return el.isError === 1;
            });
        if (errorSelectedSheet.length > 0) {
            setConfirmMessage("You must fix error in each worksheet first.");
            setIsConfirmOpen(true);
            return false;
        }
        let sheetName: string[] = []
        for (let i = 0; i < selectedSheet.length; i++) {
            sheetName.push(selectedSheet[i].sheetName)
            sheetJsonFormat[selectedSheet[i].sheetName] = selectedSheet[i].rowData;
        }
        setShowImportLoader(true);
        statusBarContext.setIsLoading(true)
        if (showImportLoader == false) {
            try {
                const handleImportEntitySheetResponse = async (response: IImportEntitySheetResponse, status?: string) => {
                    setShowImportLoader(false);
                    try {
                        statusBarContext.setIsLoading(true)
                        await FnUpdateStatisticsAndRefresh(statusBarContext, mainAppContext)

                    } catch (e) {
                        statusBarContext.setIsLoading(false)
                        console.error("UpdateGlobalStatistics Error:", e);
                    }
                    if (status === "200") {
                        const payload: IFnCreateForensiclog = {
                            logType: 'UserAction',
                            GroupName: LogGroupName.ForensicLogTemplate,
                            _Forensiclog: LogSubGroupName.Entities,
                            SubGroupName: LogSubGroupName.Entities,
                            LogName: LogName.Import,
                            actionObject: {
                                FeatureName: "Device Import",
                                tableNames: sheetName.join(", ")
                            },
                            sessionContext: sessionContext,
                            statusBarContext: statusBarContext,
                            RefTableItems: mainAppContext.refTableRecords
                        }
                        FnCreateForensiclog(payload)
                        FnPortImport(selectedSheet, statusBarContext)
                    }
                    if (response.jsonStringOutput == '' || response.jsonStringOutput == null) {
                        if (entityName?.toLowerCase() == "device") {
                            try {


                                setShowImportLoader(true);

                                statusBarContext.setIsLoading(true)
                                const handleValidateInputResponse = (response: IValidateInputResponse) => {
                                    setShowImportLoader(false);
                                    if (response.missing == false) {
                                        statusBarContext.setIsLoading(true)
                                        setShowImportLoader(true);
                                        const handleImportMountingResponse = async (_respImoprtMounting: unknown, status?: string) => {
                                            statusBarContext.setIsLoading(false)
                                            if (status === '200') {
                                                setShowImportLoader(true);
                                                ClearAllState();
                                                setConfirmMessage('Import success');
                                                setIsConfirmOpen(true);
                                            }
                                        }

                                        axiosInterceptor({
                                            url: DEVICE.ImportMounting,
                                            data: null,
                                            setFetchData: handleImportMountingResponse
                                        }, statusBarContext)
                                    }
                                    else {
                                        statusBarContext.setIsLoading(false)
                                        let missingEqId = response.eqidList ?? "";
                                        setConfirmMessage("EQIDs: " + missingEqId.toString() + ' are not found in library. Please review it and try again.');
                                        setIsConfirmOpen(true);
                                    }
                                }
                                axiosInterceptor({
                                    url: DEVICE.ValidateInput,
                                    data: null,
                                    setFetchData: handleValidateInputResponse
                                }, statusBarContext)
                            } catch (err) {
                                statusBarContext.setIsLoading(false)
                                console.error("error ValidateInput", err);
                            }
                        }
                        else {
                            ClearAllState();
                            let stepsCompleted = response.stepsCompleted;
                            if (stepsCompleted == "" || stepsCompleted == null) {
                                setConfirmMessage('Import success');
                                setIsConfirmOpen(true);
                            }
                            else {
                                setConfirmMessage(
                                    String(stepsCompleted || "")
                                        .replace(/\\n/g, "\n\n")
                                );
                                setIsConfirmOpen(true);
                            }
                            statusBarContext.setIsLoading(false)
                        }
                    }
                    else {
                        let outputSheetData: Record<string, TWorksheetRow[]>;
                        try {
                            outputSheetData = JSON.parse(String(response.jsonStringOutput)) as Record<string, TWorksheetRow[]>;
                        } catch (parseError) {
                            console.error("ImportEntitySheet output parse error:", parseError);
                            statusBarContext.setIsLoading(false);
                            setShowImportLoader(false);
                            return;
                        }

                        for (let j = 0; j < validWorksheetList.length; j++) {
                            const newData = outputSheetData[validWorksheetList[j].sheetName];
                            if (newData) {
                                const anyError = newData.filter(function (el) {
                                    return typeof el.ErrorString !== 'undefined' && el.ErrorString != "";
                                });
                                let isErrorOnAnySheet = 0;
                                if (anyError.length > 0) {
                                    isErrorOnAnySheet = 1;
                                }
                                validWorksheetList[j].rowData = newData;
                                validWorksheetList[j].isError = isErrorOnAnySheet;
                                let columnIndex = validWorksheetList[j].column.findIndex((x) => x.field == "ErrorString");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "ErrorString",
                                        resizable: true
                                    });
                                }
                                columnIndex = validWorksheetList[j].column.findIndex((x) => x.field == "RecID");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "RecID",
                                        resizable: true
                                    });
                                }

                                columnIndex = validWorksheetList[j].column.findIndex((x) => x.field == "EntID");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "EntID",
                                        resizable: true
                                    });
                                }
                            }
                        }
                        const isErrorOnAnySheet = validWorksheetList.filter(function (el) {
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
                            setDisabledImportBtnMain(true);
                            statusBarContext.setIsLoading(false)
                        }
                        else {
                            ClearAllState();
                            let stepsCompleted = response.stepsCompleted;
                            if (stepsCompleted == "" || stepsCompleted == null) {
                                setConfirmMessage("Import success");
                                setIsConfirmOpen(true);
                                statusBarContext.setIsLoading(false)
                            }
                            else {
                                statusBarContext.setIsLoading(false)
                                setConfirmMessage("Import success");
                                setIsConfirmOpen(true);
                            }
                        }
                    }
                }

                const payload = {
                    "mode": updateOnly ? "UPDATE" : "IMPORT",
                    "entityName": entityName,
                    "jsonString": JSON.stringify(sheetJsonFormat),
                }
                axiosInterceptor({
                    url: EM.ImportEntitySheet,
                    data: payload,
                    setFetchData: handleImportEntitySheetResponse
                }, statusBarContext)
            } catch (err) {
                statusBarContext.setIsLoading(false)
                console.error("ImportEntitySheet Error:", err);
            }
        }


    }

    const handleClick = (_event: unknown, _actionCode: unknown) => {
        handleImport()
    }


    function handleClickisAuthorized(event: unknown, actionCode?: string, payload?: IListItem): void {
        if (actionCode === "Not Authorized") {
            props.handleClickisAuthorized && props.handleClickisAuthorized(event, actionCode, payload)
        }
    }


    return (
        <div className="nz-import-container">
            <ImportDeviceWorkSheet
                uniqueName={props.uniqueName}
                disabled={disabledImportBtnMain}
                handleMouse={(_event: unknown, _actionCode: unknown) => handleClick(_event, _actionCode)}
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
                                        LoadSelectedSheet(item.id)
                                    }}
                                    handleClickisAuthorized={handleClickisAuthorized}
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
                                            allowColumnResize={true}
                                            allowColumnFilter={true}
                                            isExportOnCopy={false}
                                            exportFileName={'sheetName' in selectedSheet && selectedSheet.sheetName ? selectedSheet.sheetName : "ImportData"}
                                            rowData={selectRowData}
                                            isReadOnly={true}
                                            containerName="import_table"
                                            columnDefs={selectedColDef}
                                            allowPagination={true}
                                            dynamicPagination={true}
                                            paginationAutoPageSize={true}
                                            uniqueName={"import_table"}
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
                        props.handleClearSelection && props.handleClearSelection()
                    }
                } />
        </div >
    )
}

export { SelectAndValidateDeviceWorksheet }

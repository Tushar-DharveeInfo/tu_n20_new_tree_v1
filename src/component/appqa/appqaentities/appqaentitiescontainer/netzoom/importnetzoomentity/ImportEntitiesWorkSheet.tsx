
import { useCallback, useEffect, useState } from "react";
import { Key } from "rc-tree/lib/interface";
import * as XLSX from "xlsx";
import { useStatusBarContext } from "../../../../../shared/context/hooks/StatusBarHooks";
import { useMainAppContext } from "../../../../../shared/context/hooks/MainAppHooks";
import { axiosInterceptor } from "../../../../../shared/interceptors/Interceptor";
import "../../../../allcss/appqaentitiescontainer/netzoom/ImportEntitiesWorkSheet.css";
import { EM, FS, LOG } from "../../../../../shared/interceptors/EndPoints";
import { DELIMITER } from "../../../../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid";
import { FileGroupNameEnums } from "../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { IListItem } from "../../../../../shared/allinterface/basic/ICheckedListPanel";
import { Upload24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../appcontainer/allcommon/FnGetCssVariable";
import { FnGetSessionVariableFromStorage } from "../../../../../shared/allcommon/basic/FnGetSessionVariableFromStorage";
import { IBasicGridColDef } from "../../../../../shared/allinterface/tablegrid/IBasicGrid";
import { IImportEntitiesWorkSheet, IValidWorksheetList } from "../../../../allinterface/iappqaentitiescontainer/netzoom/IImportEntitiesWorkSheet";
import { FnGetRefList } from "../../../../../shared/allcommon/basic/FnGetRefList";
import { ActionImage } from "../../../../../shared/basic/actionimage/ActionImage";
import { CheckedListPanel } from "../../../../../shared/basic/checkedlistpanel/CheckedListPanel";
import { Label } from "../../../../../shared/basic/label/Label";
import { YesNoFormContainer } from "../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { useSessionContext } from "../../../../../shared/context/hooks/SessionHooks";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { UploadFolder24x24 } from "@n20a/libicon"
import { FileSelectControl, FolderSelectControl, IChangeMeta } from "@n20a/libform";
import { IFnCreateForensiclog } from "../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { FnCreateForensiclog } from "../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { ITreeNode } from "../../../../../shared/allinterface/tree/ITreeControl";
import { BasicGrid } from "../../../../../shared/tablegrid/BasicGrid";
import { FnParseJsonSafely } from "../../../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnPortImport } from "../../../../allcommon/FnPostImport";

const ImportEntitiesWorkSheet = (props: IImportEntitiesWorkSheet) => {
    const [workBook, setWorkBook] = useState<Record<string, any>>({});
    const [selectedSheet, setSelectedSheet] = useState<Record<string, any>>({});
    const [validWorksheetList, setValidWorksheetList] = useState<IValidWorksheetList[]>([]);
    const [validList, setValidList] = useState<IListItem[]>([])
    const [updateOnly, setUpdateOnly] = useState<boolean | undefined>(false);
    const [showImportLoader, setShowImportLoader] = useState(false);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [checkAllKey, setCheckAllkey] = useState<Key[]>([]);
    const [halfChecked, setHalfChecked] = useState<Key[]>([]);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [disabledImportBtnMain, setDisabledImportBtnMain] = useState(true);
    const [rowDataFileUpload, setRowDataFileUpload] = useState<Record<string, any>[]>([]);
    const [savebtnOnData, setsavebtnOnData] = useState(true)
    const [selectedColDef, setSelectedColDef] = useState<IBasicGridColDef[]>([])
    const [selectRowData, setSelectedRowData] = useState<Record<string, any>[]>([])
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(0)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const [UploadInfo, setUploadInfo] = useState<string>('You have selected to import Files; Please select the file folder name, where files are available to upload.')
    const [errorCount, setErrorCount] = useState<number>(0);


    const checkListData = {
        uniqueName: "sampleListPanel1",
        allowCheckbox: false,
        allowRightIcon: true,
        allowMulticheck: false,
        allowCustomCheckLogic: false,
        allowHeader: true,
        headerText: "Team",
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
    };

    useEffect(() => {
        setCheckAllkey(props.checkedNodeKeys);
        setHalfChecked(props.halfCheckedNodeKeys);
        setTreeData(props.treeData);
        setUpdateOnly(props.updateOnly);
    }, [props.checkedNodeKeys, props.halfCheckedNodeKeys, props.treeData, props.updateOnly])

    const loadWorkSheetWithoutValidation = useCallback(() => {
        try {
            if (!workBook || !Array.isArray(workBook.SheetNames)) return;

            const rowDataTabArray: IValidWorksheetList[] = [];

            for (let i = 0; i < workBook.SheetNames.length; i++) {
                const wsname: string = workBook.SheetNames[i];
                const ws = workBook.Sheets?.[wsname];

                if (!ws || typeof ws !== "object") continue;

                const firstCell = ws["A1"] as XLSX.CellObject | undefined;
                if (!firstCell || !firstCell.v) continue;

                let data: unknown[][] = [];

                try {
                    data = XLSX.utils.sheet_to_json(ws, {
                        header: 1,
                        raw: false,
                        blankrows: false,
                        defval: ""
                    }) as unknown[][];
                } catch (e) {
                    console.error("sheet_to_json error:", e);
                    continue;
                }

                const header: string[] = Array.isArray(data?.[0])
                    ? (data[0] as string[])
                    : [];

                if (!header.length) continue;

                const headerArray: {
                    field: string;
                    resizable: boolean;
                    headerName: string;
                    flex?: number;
                    sortable: boolean;
                }[] = [];

                header.forEach((col: string, index: number) => {
                    headerArray.push({
                        field: col,
                        resizable: header.length === index + 1 ? false : true,
                        headerName: col,
                        flex: index === header.length - 1 ? 1 : undefined,
                        sortable: index === 0,
                    });
                });

                const excelData: Record<string, string>[] = [];

                for (let x = 1; x < data.length; x++) {
                    const objectRow = Array.isArray(data[x]) ? data[x] : [];
                    const dataObject: Record<string, string> = {};

                    const firstCharacter =
                        typeof objectRow[0] === "string"
                            ? Array.from(objectRow[0])[0]
                            : "";

                    if (firstCharacter !== "!") {
                        header.forEach((col: string, index: number) => {
                            dataObject[col] =
                                objectRow[index] !== undefined
                                    ? String(objectRow[index])
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

            setValidWorksheetList((prevArray: IValidWorksheetList[]) => [
                ...prevArray,
                ...rowDataTabArray,
            ]);

        } catch (error) {
            console.error("loadWorkSheetWithoutValidation error:", error);
        }
    }, [workBook]);
    const getCheckedEntityList = useCallback((): ITreeNode[] => {
        try {
            if (!Array.isArray(treeData)) return [];

            const entityData: ITreeNode[] = [];

            treeData.forEach((item: ITreeNode) => {
                if (!item || typeof item !== "object") return;

                if (item.NodeType === "EntityNode") {
                    if (
                        checkAllKey.includes(item.key) ||
                        halfChecked.includes(item.key)
                    ) {
                        entityData.push(item);
                    }
                } else {
                    if (Array.isArray(item.children)) {
                        item.children.forEach((subItem: ITreeNode) => {
                            if (!subItem || typeof subItem !== "object") return;

                            if (subItem.NodeType === "EntityNode") {
                                if (
                                    checkAllKey.includes(subItem.key) ||
                                    halfChecked.includes(subItem.key)
                                ) {
                                    entityData.push(subItem);
                                }
                            }
                        });
                    }
                }
            });

            return entityData;

        } catch (error) {
            console.error("getCheckedEntityList error:", error);
            return [];
        }
    }, [treeData, checkAllKey, halfChecked]);

    const makeValidWorksheetList = useCallback(async (workBook: Record<string, any>) => {
        setDisabledImportBtnMain(true);
        if (workBook.SheetNames) {
            const sheetCount = workBook.SheetNames.length;
            setValidWorksheetList([]);

            if (sheetCount > 0) {


                const entityData: ITreeNode[] = await getCheckedEntityList();

                if (entityData.length === 0) {
                    setConfirmMessage('No table is selected to import');
                    setIsConfirmOpen(true);
                    return false;
                }

                const selectedEntity = entityData[0];
                const entityName: string = selectedEntity.NodeEntityname ? selectedEntity.NodeEntityname : "";

                if (entityName?.toLowerCase() === "em") {
                    loadWorkSheetWithoutValidation();
                    return false;
                }
                const requiredTableList = selectedEntity.children?.filter(function (el: ITreeNode) {
                    return checkAllKey.includes(el.key) || halfChecked.includes(el.key);
                });


                const userSheetnames = workBook.SheetNames;
                let missingSheetsErr = "";
                // check missing worksheet
                for (let j = 0; j < requiredTableList.length; j++) {
                    const tablenName = requiredTableList[j].Name ?? "";

                    const sheetExists = userSheetnames.filter(function (el: Record<string, any>) {
                        return el?.toLowerCase() === tablenName?.toLowerCase();
                    });

                    if (sheetExists.length === 0) {
                        if (missingSheetsErr === "") {
                            missingSheetsErr = tablenName;
                        }
                        else {
                            missingSheetsErr += ", " + tablenName;
                        }
                    }
                }
                if (missingSheetsErr !== "") {

                    setConfirmMessage(missingSheetsErr + " Worksheet(s) are missing for selected table");
                    setIsConfirmOpen(true);
                    return false;
                }

                const validUserShets: Record<string, any>[] = [];
                for (let j = 0; j < userSheetnames.length; j++) {
                    const sheetName = userSheetnames[j];

                    const sheetExists = requiredTableList.filter(function (el: Record<string, any>) {
                        return el.Name?.toLowerCase() === sheetName?.toLowerCase();
                    })

                    if (sheetExists && sheetExists.length > 0) {
                        validUserShets.push(sheetExists[0]);
                    }
                }
                if (validUserShets.length === 0) {

                    setConfirmMessage("Your excel file doesn't contain any valid worksheets.");
                    setIsConfirmOpen(true);
                    return false;
                }
                let requiredSheetNames = "";
                //IMPORT MODE
                if (updateOnly === false) {
                    const requiredToAddSheet = selectedEntity.children?.filter(function (el: Record<string, any>) {
                        return checkAllKey.includes(el.key) || halfChecked.includes(el.key);
                    });

                    for (let k = 0; k < requiredToAddSheet.length; k++) {
                        const requiredSheetExists = validUserShets.filter(function (el: Record<string, any>) {
                            return el.Name?.toLowerCase() === requiredToAddSheet[k].Name?.toLowerCase();
                        });
                        if (requiredSheetExists.length === 0) {
                            if (requiredSheetNames === "")
                                requiredSheetNames = requiredToAddSheet[k].Name ?? "";
                            else
                                requiredSheetNames += "," + requiredToAddSheet[k].Name;
                        }
                    }
                }
                else if (updateOnly === true) {
                    const requiredToUpdateSheet = selectedEntity.children?.filter(function (el: Record<string, any>) {
                        return checkAllKey.includes(el.key) || halfChecked.includes(el.key);
                    });
                    for (let k = 0; k < requiredToUpdateSheet.length; k++) {
                        const requiredSheetExists = validUserShets.filter(function (el: Record<string, any>) {
                            return el.Name?.toLowerCase() === requiredToUpdateSheet[k].Name?.toLowerCase();
                        });
                        if (requiredSheetExists.length === 0) {
                            if (requiredSheetNames === "")
                                requiredSheetNames = requiredToUpdateSheet[k].Name ?? "";
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
                    if (validUserShets.length > 1)
                        tableNamesCommaSeperated += DELIMITER.separator + validUserShets[i].Name;
                    else
                        tableNamesCommaSeperated += validUserShets[i].Name;
                }
                setShowImportLoader(true);
                try {
                    const handleGetFieldListResponse = async (response: unknown, status?: string) => {
                        if (status !== '200') {
                            throw new Error("IMPORT API request failed");
                        }
                        if (response && Array.isArray(response)) {
                            const fieldListAll = response ?? [];
                            const rowDataTabArray: IValidWorksheetList[] = [];
                            let errorCount = 0
                            for (let i = 0; i < validUserShets.length; i++) {
                                const wsname: string = validUserShets[i].Name;
                                const fieldList = fieldListAll.filter(function (el: Record<string, string | number | boolean>) {
                                    return el.tableName.toString()?.toLowerCase() === wsname?.toLowerCase();
                                });
                                let requiredFieds: Record<string, string | number | boolean>[] = [];
                                if (fieldList.length > 0) {
                                    if (updateOnly) {
                                        requiredFieds = fieldList.filter(function (el: Record<string, string | number | boolean>) {
                                            return el.requiredToUpdateRecord === true;
                                        });
                                    }
                                    else {
                                        requiredFieds = fieldList.filter(function (el: Record<string, string | number | boolean>) {
                                            return el.requiredToAddRecord === true;
                                        });
                                    }
                                }
                                const excelSheetFind = workBook.SheetNames.filter(function (el: string) {
                                    return el?.toLowerCase() === wsname?.toLowerCase();
                                });

                                const ws = excelSheetFind && excelSheetFind.length > 0 && workBook.Sheets[excelSheetFind[0]];

                                const data: string[] = XLSX.utils.sheet_to_json(ws, {
                                    header: 1,
                                    raw: false,
                                    blankrows: false
                                })
                                let header: string | string[] = data && data.length ? data[0] : [];

                                if (Array.isArray(header)) {
                                    let headerArray: Record<string, string | number | boolean>[] = [];
                                    headerArray.push({
                                        field: "ErrorString",
                                        resizable: true,
                                        headerName: "ErrorString"
                                    });
                                    const ignoreColumns: string[] = [];
                                    header = header.map((data: string, index: number) => {
                                        const checkValidField = fieldList.filter(function (el: Record<string, string | number | boolean>) {
                                            return el.pName?.toString()?.toLowerCase().trim() === data?.toString()?.toLowerCase().trim();
                                        });
                                        if (checkValidField.length === 0) {
                                            const value = data?.toString().trim();
                                            if (value?.toLowerCase().trim() !== "recid" && value?.toLowerCase().trim() !== "entid")
                                                ignoreColumns.push(data);
                                            else {
                                                headerArray.push({
                                                    field: value,
                                                    resizable: header.length === index + 1 ? false : true,
                                                    headerName: value,
                                                    flex: index === header.length - 1 ? 1 : 0, // flex only for last column
                                                    sortable: index === 0, // sortable only for first column
                                                });
                                            }
                                        }
                                        else {
                                            const value = checkValidField[0].pName.trim();

                                            headerArray.push({
                                                field: value,
                                                resizable: header.length === index + 1 ? false : true,
                                                headerName: value,
                                                flex: index === header.length - 1 ? 1 : 0, // flex only for last column
                                                sortable: index === 0, // sortable only for first column
                                            });
                                        }

                                        return data
                                    });

                                    let excelData = [];
                                    for (let x = 1; x < data.length; x++) {
                                        const objetRow: string = data[x];
                                        const dataObject: Record<string, string | number | boolean> = {};
                                        // ignore row that has starting cell value = "!"
                                        const firstCharacter = typeof objetRow[0] === 'undefined' ? "" : Array.from(objetRow[0])[0];
                                        if (firstCharacter !== "!") {
                                            header.forEach((data: any, index: number) => {
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
                                        .map((hd: Record<string, string | number | boolean>) => {
                                            return {
                                                count: 1,
                                                name: hd.field?.toString().toLowerCase().trim()
                                            };
                                        })
                                        .filter((item) => item.name)
                                        .reduce((result: Record<string, number>, b: { name: string; count: number }) => {
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
                                        requiredFieds.forEach((data: Record<string, string | number | boolean>) => {
                                            const fieldName = data.pName.toString();

                                            const isFieldExists = Array.isArray(header) && header.filter(function (el: string) {
                                                return el?.toLowerCase() === fieldName?.toLowerCase();
                                            });
                                            if (isFieldExists && isFieldExists.length === 0) {
                                                if (missingColumns === "") {
                                                    missingColumns = fieldName;
                                                }
                                                else {
                                                    missingColumns += "," + fieldName;
                                                }
                                            }

                                        });
                                        errorString = missingColumns === "" ? "" : missingColumns + " fields required in sheet."
                                    }

                                    if (!updateOnly) {
                                        headerArray = headerArray.filter(function (el: Record<string, string | number | boolean>) {
                                            return el.field.toString()?.toLowerCase() !== "entid" && el.field.toString()?.toLowerCase() !== "recid"
                                        });
                                    }


                                    if (excelData.length > 0) {

                                        errorCount += errorString ? 1 : 0;
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

                            const errorList = rowDataTabArray.filter(function (el: IValidWorksheetList) {
                                return el.isError === 1
                            });
                            if (errorList.length > 0 || entityName?.toLowerCase() === "staticdata") {
                                setShowImportLoader(false);
                                setValidWorksheetList([...rowDataTabArray]);

                            }
                            else {

                                await databaseValidationOnSheet(rowDataTabArray);
                            }

                        }
                    }
                    const payload = {
                        "mode": "IMPORT",
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
                    console.error("Error while getting field list", error)
                }

            }
        }
    }, [checkAllKey, halfChecked, updateOnly, getCheckedEntityList, loadWorkSheetWithoutValidation])
    useEffect(() => {
        if (Object.values(workBook).length) {

            makeValidWorksheetList(workBook);
        }
    }, [workBook, makeValidWorksheetList]);

    useEffect(() => {
        if (validWorksheetList.length > 0) {
            const labelSet = new Set<string>();
            const validateArr: IListItem[] = [];

            for (let index = 0; index < validWorksheetList.length; index++) {
                const element = validWorksheetList[index];

                if (labelSet.has(element.sheetName)) continue;
                labelSet.add(element.sheetName);
                const obj: IListItem = {
                    label: element.sheetName,
                    id: index.toString(),
                    isAuthorized: typeof element.isError === "number" && element.isError && element.isError > 0 ? false : true,
                    selected: validateArr.length === 0,
                    ...element
                };

                validateArr.push(obj);
            }

            setValidList(validateArr);
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
            let checkFile = false
            for (let index = 0; index < validWorksheetList.length; index++) {
                const element = validWorksheetList[index];
                validateErrorConut += typeof element.isError === "number" && element.isError ? element.isError : 0
                if ((element.sheetName === "PG.FileProfile") && element.rowData.length > 0) {
                    checkFile = true
                }
            }
            if (validateErrorConut === 0 && checkFile === true) {
                setDisabledImportBtnMain(true)
                setShowEditDialog(true)
            }
        } else {
            setSelectedColDef([])
            setSelectedRowData([])
        }

    }, [validWorksheetList, lastSelectedIndex]);


    const updateDataWithUploadId = async (data: Record<string, any>[]) => {
        try {
            const pgFile = validWorksheetList.filter((item: IValidWorksheetList) => {
                return item.sheetName === "PG.FileProfile"
            })

            let isValid = true
            const rowData = pgFile.length > 0 && pgFile[0].rowData
            let EntityName = rowData && rowData?.length > 0 ? rowData[0].EntityName : null
            const newRow: any = []

            const cleanedData = [...validWorksheetList];
            const pgFileProfile = rowData
            const matchRowData = []
            if (pgFileProfile && pgFileProfile.length > 0) {
                let pgClassData = null;

                pgClassData = cleanedData
                    .filter((sheet: IValidWorksheetList) => sheet.sheetName && sheet.sheetName.startsWith('_'))
                    .map((sheet: IValidWorksheetList) => ({
                        value: sheet.rowData || [],
                        key: sheet.sheetName
                    }))

                if (pgClassData && pgClassData[0]?.value) {

                    for (let i = 0; i < pgFileProfile.length; i++) {
                        const fileProfile = { ...pgFileProfile[i] }; // clone to avoid mutation

                        const matching = pgClassData[0].value.find(
                            (entry: Record<string, any>) =>
                                fileProfile[pgClassData[0].key] === entry[pgClassData[0].key]
                        );

                        if (matching) {
                            matchRowData.push(fileProfile);
                        }


                    }


                }

                for (let index = 0; index < data.length; index++) {
                    const element = data[index];

                    const matching = matchRowData.find(
                        (entry: Record<string, any>) =>
                            element.docName === entry.uploadDocName
                    );

                    if (matching) {
                        let userNameSession = FnGetSessionVariableFromStorage("RequestedBy", "LoginShortName", sessionContext.SessionList);

                        let userName: string | null = userNameSession && userNameSession?.length > 0 ? userNameSession[0].SessionValue : "";
                        const fileExt = "." + element?.docName?.split(".")[1]
                        element.fileExtension = element.fileExtension ? element.fileExtension : fileExt
                        const payload = {
                            "fileCategory": element.FileCategory,
                            "fileExtension": element.fileExtension,
                            "fileBlob": element.base64,
                            "fileName": element.docName,
                            "prefix": FileGroupNameEnums.Other,
                            "userName": userName,
                            "entityname": EntityName,
                            "EntID": element.EntID
                        }
                        const { response, status }: Record<string, any> = await new Promise((resolve) => {
                            try {
                                axiosInterceptor({
                                    url: FS.UploadFileStream,
                                    data: payload,
                                    allowShowLoader: true,
                                    setFetchData: (response: unknown, status?: string) => {
                                        resolve({ response, status });
                                    },

                                }, statusBarContext);
                            } catch (error) {
                                console.error("FileReader Error:", error);
                            }
                        });

                        if ((response && response.fileUID) && status.toString() == "200") {
                            const parsed = FnParseJsonSafely(response.jsonStringOutput);
                            const fileProfiles = parsed["PG.FileProfile"];
                            let name = element.docName
                            let fileExt = element.fileExtension

                            let updateErrorRowData: Record<string, string | number | boolean>[] = []
                            rowData.map((ele: Record<string, any>) => {
                                if ((ele.DocName === name && ele.FileExtension === fileExt) || ele?.TemplateFileName == name) {
                                    ele.ErrorString = (ele.ErrorString != '' ? `Document uploaded,` : ele.ErrorString) + "Document uploaded"
                                    ele.FileUID = response.fileUID
                                    ele.RecID = fileProfiles[0].RecID
                                }
                                updateErrorRowData.push(ele)
                            })

                            let sheetData: IValidWorksheetList[] = []
                            validWorksheetList.map((item: IValidWorksheetList) => {
                                if (item.sheetName == pgFile[0].sheetName) {
                                    item.rowData = updateErrorRowData
                                }
                                sheetData.push(item)
                            })

                            setValidWorksheetList([...sheetData])
                        } else {

                            const payloadForDelete = {
                                "entityName": EntityName,
                                "entIDs": element.EntID
                            }
                            try {

                                axiosInterceptor({
                                    url: EM.DeleteEntityRecords,
                                    data: payloadForDelete,
                                    allowShowLoader: true,
                                    setFetchData: () => { }

                                }, statusBarContext);
                            } catch (error) {
                                console.error("FileReader Error:", error);
                            }
                            isValid = false
                            var message = ''
                            let name = element.docName
                            let fileExt = element.fileExtension
                            let updateErrorRowData: Record<string, string | number | boolean>[] = []
                            rowData.map((ele: Record<string, string | number | boolean>) => {
                                if ((ele.DocName === name && ele.FileExtension === fileExt) || ele?.TemplateFileName == name) {
                                    ele.ErrorString = (ele.ErrorString != '' ? `${ele.ErrorString},` : ele.ErrorString) + message
                                }
                                updateErrorRowData.push(ele)
                            })
                            let sheetData: IValidWorksheetList[] = []
                            validWorksheetList.map((item: IValidWorksheetList) => {
                                if (item.sheetName == pgFile[0].sheetName) {
                                    item.rowData = updateErrorRowData
                                }
                                sheetData.push(item)
                            })
                            setValidWorksheetList([...sheetData])
                        }
                    }


                }
            }

            return { newRow, isValid }
        } catch (error) {
            console.error("Error in uploadFile:", error);
            return error
        }
    }
    const importBtnClick = async () => {
        setsavebtnOnData(true)
        setDisabledImportBtnMain(false)
        setRowDataFileUpload([])
        await handleImport()
    }

    // Function to read Base64 string and handle file based on extension
    const readBase64File = (file: File) => {
        try {
            if (!file) {
                console.error("No file provided");
                return;
            }

            const reader = new FileReader();

            reader.onload = (evt: ProgressEvent<FileReader>) => {
                try {
                    const data = evt.target?.result;

                    if (!data) {
                        console.error("File data is empty or unreadable");
                        return;
                    }

                    const wb = XLSX.read(data, { type: "array" });
                    setWorkBook(wb);
                } catch (parseError) {
                    console.error("Error while parsing Excel file:", parseError);
                }
            };

            reader.onerror = (error) => {
                console.error("FileReader Error:", error);
            };

            reader.onabort = () => {
                console.warn("File reading was aborted");
            };

            reader.readAsArrayBuffer(file);
        } catch (err) {
            console.error("Unexpected error while reading file:", err);
        }
    };
    const handleOnFileChange = async (file: File) => {
        try {
            ClearAllState();

            if (!file) return;

            const fileName = file.name;

            const _validFileExtensions = [".xlsx", ".xls"];

            let isValid = false;

            for (let j = 0; j < _validFileExtensions.length; j++) {
                const sCurExtension = _validFileExtensions[j];

                if (fileName.toLowerCase().endsWith(sCurExtension.toLowerCase())) {
                    isValid = true;
                    break;
                }
            }

            if (isValid) {
                readBase64File(file); //  unchanged behavior
            } else {
                console.warn("Invalid file type:", fileName); //  added log only
                setDisabledImportBtnMain(true); //  unchanged
            }
        } catch (error) {
            console.error("Error in handleOnFileChange:", error); //  safe catch
            setDisabledImportBtnMain(true); // fallback safety (does not break logic)
        }
    };

    const handleImport = async () => {
        setDisabledImportBtnMain(true);
        const entityData: ITreeNode[] = getCheckedEntityList();

        if (entityData.length === 0) {
            setConfirmMessage("No table is selected to import");
            setIsConfirmOpen(true);
            return false;
        }
        const sheetJsonFormat: any = {};
        const selectedSheet: IValidWorksheetList[] = validWorksheetList
            .filter(function (el: any) {
                return el.checkboxSelected === true;
            });

        if (selectedSheet.length === 0) {

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
                if (tableProp.requiredToAddRecord === true) {
                    isRequired = true;
                }
            }
            else {
                if (tableProp.requiredToUpdateRecord === true) {
                    isRequired = true;
                }
            }
            if (isRequired) {
                const isRequieredShhetExists = selectedSheet
                    .filter(function (el: IValidWorksheetList) {
                        return el.sheetName?.toLowerCase() === tableName?.toLowerCase();
                    });
                if (isRequieredShhetExists.length === 0) {
                    if (requiredSheetErr === "") {
                        requiredSheetErr = tableName;
                    }
                    else {
                        requiredSheetErr += "," + tableName;
                    }
                }
            }
        }

        if (requiredSheetErr !== "") {
            setConfirmMessage(`You must select required worksheet(s) i.e ${requiredSheetErr} to import or update.`);
            setIsConfirmOpen(true);
            return false;
        }
        const errorSelectedSheet: IValidWorksheetList[] = selectedSheet
            .filter(function (el: IValidWorksheetList) {
                return el.isError === 1;
            });
        if (errorSelectedSheet.length > 0) {
            setConfirmMessage("You must fix error in each worksheet first.");
            setIsConfirmOpen(true);
            return false;
        }
        let sheetName: string[] = []
        for (let i = 0; i < selectedSheet.length; i++) {
            if (selectedSheet[i].sheetName === "PG.FileProfile") {
                for (let index = 0; index < selectedSheet[i].rowData.length; index++) {
                    const element = selectedSheet[i].rowData[index];
                    element.ErrorString = element.ErrorString.toString().replace("Document uploaded", "")
                }
            }
            sheetName.push(selectedSheet[i].sheetName);
            sheetJsonFormat[selectedSheet[i].sheetName] = selectedSheet[i].rowData;
        }
        setShowImportLoader(true);
        if (showImportLoader === false) {
            let entityData: any = getCheckedEntityList();
            let selectedEntity = entityData[0];
            const cleanedData = { ...sheetJsonFormat };
            delete cleanedData["PG.FileProfile"];
            const handleImportEntitySheetResponse = async (response: unknown, status?: string) => {
                if (status === "200") {
                    const payload: IFnCreateForensiclog = {
                        logType: 'UserAction',
                        GroupName: LogGroupName.ForensicLogTemplate,
                        _Forensiclog: LogSubGroupName.Entities,
                        SubGroupName: LogSubGroupName.Entities,
                        LogName: LogName.Import,
                        actionObject: {
                            FeatureName: props?.selectedFeatureItem?.Label,
                            tableNames: sheetName.join(", ")
                        },
                        sessionContext: sessionContext,
                        statusBarContext: statusBarContext,
                        RefTableItems: mainAppContext.refTableRecords
                    }
                    FnCreateForensiclog(payload)
                    FnPortImport(selectedSheet, statusBarContext)
                }
                if (
                    typeof response === "object" &&
                    response !== null &&
                    "jsonStringOutput" in response &&
                    ((response as any).jsonStringOutput === "" || (response as any).jsonStringOutput === null)
                ) {
                    const stepsCompleted = (response as any).stepsCompleted;

                    if (stepsCompleted == null || stepsCompleted === "") {
                        setConfirmMessage("Import success");
                    } else {
                        setConfirmMessage(
                            stepsCompleted.replace(/\\n/g, "\n\n")
                        );
                    }

                    setIsConfirmOpen(true);
                }
                else {
                    if (typeof response === "object" &&
                        response !== null && "jsonStringOutput" in response) {
                        let outputSheetData = response.jsonStringOutput && typeof response.jsonStringOutput === "string" ? FnParseJsonSafely(response.jsonStringOutput) : null;
                        for (let j = 0; j < validWorksheetList.length; j++) {
                            let newData = outputSheetData[validWorksheetList[j].sheetName];
                            if (newData) {
                                let anyError = newData.filter(function (el: IValidWorksheetList) {
                                    return typeof el.ErrorType == 'undefined' || el.ErrorType == 2;
                                });
                                let isErrorOnAnySheet = 0;
                                if (anyError.length > 0) {
                                    isErrorOnAnySheet = 1;
                                }
                                validWorksheetList[j].rowData = newData;
                                validWorksheetList[j].isError = isErrorOnAnySheet;
                                let columnIndex = validWorksheetList[j].column.findIndex((x: Record<string, number | string | boolean>) => x.field == "ErrorString");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "ErrorString",
                                        resizable: true,
                                        sortable: true, // sortable only for first column
                                    });
                                }
                                columnIndex = validWorksheetList[j].column.findIndex((x: Record<string, number | string | boolean>) => x.field == "RecID");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "RecID",
                                        resizable: true
                                    });
                                }

                                columnIndex = validWorksheetList[j].column.findIndex((x: Record<string, number | string | boolean>) => x.field == "EntID");
                                if (columnIndex === -1) {
                                    validWorksheetList[j].column.push({
                                        field: "EntID",
                                        resizable: true
                                    });
                                }
                            }
                        }
                        let isErrorOnAnySheet = validWorksheetList.filter(function (el: IValidWorksheetList) {
                            return el.isError == 1 && el.checkboxSelected == true;
                        });
                        if (isErrorOnAnySheet.length > 0) {
                            setValidWorksheetList([...validWorksheetList]);
                            let stepsCompleted = (response as Record<string, number | string | boolean>).stepsCompleted;

                            setConfirmMessage((stepsCompleted || "Import success").toString()
                                .replace(/\\n/g, "\n\n"));
                            setIsConfirmOpen(true);
                            setDisabledImportBtnMain(true);
                        }
                        else {

                            let stepsCompleted = (response as Record<string, number | string | boolean>).stepsCompleted;
                            if (stepsCompleted == "" || stepsCompleted == null) {
                                setConfirmMessage("Import success");
                                setIsConfirmOpen(true);
                            }
                            else {
                                setConfirmMessage((stepsCompleted || "Import success").toString()
                                    .replace(/\\n/g, "\n\n"));
                                setIsConfirmOpen(true);
                            }

                        }
                    }
                }
                const cleanedData = { ...sheetJsonFormat };

                const pgFileProfile = cleanedData["PG.FileProfile"] || [];

                if (pgFileProfile.length > 0) {
                    let pgClassData = null;

                    for (const key in cleanedData) {
                        if (key.startsWith('_')) {
                            pgClassData = {
                                key,
                                value: cleanedData[key]
                            };
                        }
                    }

                    if (pgClassData?.value) {
                        let updatedPGFileProfile = [];

                        for (let i = 0; i < pgFileProfile.length; i++) {
                            const fileProfile = { ...pgFileProfile[i] }; // clone to avoid mutation

                            const matchingCompany = pgClassData.value.find(
                                (entry: Record<string, number | string | boolean>) =>
                                    entry.EntID &&
                                    fileProfile[pgClassData.key] === entry[pgClassData.key]
                            );

                            if (matchingCompany) {
                                fileProfile.EntID = matchingCompany.EntID;
                                fileProfile.EntityName = matchingCompany.EntityName;
                            }

                            updatedPGFileProfile.push(fileProfile);
                        }

                        let rowDataForUpload = []
                        for (let index = 0; index < rowDataFileUpload.length; index++) {
                            const element = rowDataFileUpload[index];
                            const matchingCompany = updatedPGFileProfile.find(
                                (entry: Record<string, number | string | boolean>) =>
                                    entry.DocName === element.docName
                            );

                            if (matchingCompany) {
                                element.EntID = matchingCompany.EntID;
                                element.EntityName = matchingCompany.EntityName;
                            }
                            rowDataForUpload.push(element);

                        }

                        await updateDataWithUploadId(rowDataForUpload)
                        ClearAllState();
                    }
                }
                else {
                    ClearAllState();
                }
            }

            const payload = {
                "mode": updateOnly ? "UPDATE" : "IMPORT",
                "entityName": selectedEntity.NodeEntityname,
                "jsonString": JSON.stringify(cleanedData),
            }
            try {
                axiosInterceptor({
                    url: EM.ImportEntitySheet,
                    data: payload,
                    allowShowLoader: true,
                    setFetchData: handleImportEntitySheetResponse
                }, statusBarContext)

            } catch (error) {
                console.error("ImportEntitySheet Error:", error);
            }

        }
    }

    const LoadSelectedSheet = (sheetIndex: number) => {
        if (validWorksheetList && validWorksheetList.length) {
            const colDef = validWorksheetList[sheetIndex].column
            const rowData = validWorksheetList[sheetIndex].rowData
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
            setSelectedSheet(validWorksheetList[sheetIndex]);
        }
    }
    const databaseValidationOnSheet = async (sheetdata: IValidWorksheetList[]) => {

        const sheetJsonFormat: Record<string, any> = {};
        for (let i = 0; i < sheetdata.length; i++) {
            sheetJsonFormat[sheetdata[i].sheetName] = sheetdata[i].rowData;
        }
        let entityData: ITreeNode[] = await getCheckedEntityList();
        let selectedEntity = entityData[0];
        try {
            const handleValidateEntitySheetResponse = (
                response: unknown,
                status: string | undefined
            ) => {
                try {
                    const responseData: Record<string, any> | null =
                        typeof response === "string" ? FnParseJsonSafely(response) : null;

                    if (responseData && status === '200') {
                        setDisabledImportBtnMain(false);

                        let errorCount = 0;

                        for (let j = 0; j < sheetdata.length; j++) {
                            const sheetName = sheetdata[j].sheetName;

                            const newData: Record<string, any>[] = responseData[sheetName];

                            if (!Array.isArray(newData)) continue; //  safe guard

                            const errorList = newData.filter((el: Record<string, any>) => {
                                return el.ErrorType === 2;
                            });

                            if (errorList.length > 0) {
                                errorCount = errorCount + 1;
                                sheetdata[j].isError = 1;

                                setDisabledImportBtnMain(true);
                            } else {
                                sheetdata[j].isError = 0;
                            }

                            sheetdata[j].rowData = newData;
                        }



                        setShowImportLoader(false);

                        setValidWorksheetList((prevArray: typeof sheetdata) => [
                            ...prevArray,
                            ...sheetdata,
                        ]);
                    }
                } catch (error) {
                    console.error("Error in handleValidateEntitySheetResponse:", error);
                    setShowImportLoader(false);
                }
            };
            const payload = {
                "mode": updateOnly ? "UPDATE" : "IMPORT",
                "entityName": selectedEntity.NodeEntityname,
                "jsonString": JSON.stringify(sheetJsonFormat),
            }
            axiosInterceptor({
                url: EM.ValidateEntitySheet,
                data: payload,
                allowShowLoader: true,
                setFetchData: handleValidateEntitySheetResponse,
            }, statusBarContext)
        } catch (err) {
            console.error("ValidateEntitySheet Error:", err);
        }
    }
    const ClearAllState = () => {
        setWorkBook({});
        setValidWorksheetList([]);
        setSelectedSheet({});
        setSelectedColDef([])
        setSelectedRowData([])
        setLastSelectedIndex(0)
        setShowEditDialog(false)
        setValidList([])
        setErrorCount(0)
    }
    interface ICreateMessagePayload {
        projectInitial: string;
        msgID: string;
        optionalMessage: string;
        customMessage: string;
        errorMessage: string;
    }

    interface ICreateMessageResponse {
        finalMessage?: string;
    }

    const createMessage = async (
        projectInitial: string,
        msgID: string,
        optionalMessage: string = "",
        customMessage: string = "",
        errorMessage: string = ""
    ): Promise<void> => {
        const payload: ICreateMessagePayload = {
            projectInitial,
            msgID,
            optionalMessage,
            customMessage,
            errorMessage
        };

        try {
            axiosInterceptor(
                {
                    url: LOG.CreateMessage,
                    data: payload,
                    setFetchData: (resp: unknown) => {
                        try {
                            if (resp && typeof resp === "object") {
                                const response = resp as ICreateMessageResponse;

                                if (response.finalMessage) {
                                    setConfirmMessage(response.finalMessage);
                                    setIsConfirmOpen(true);
                                } else {
                                    setIsConfirmOpen(false);
                                    setConfirmMessage("");
                                }
                            } else {
                                setIsConfirmOpen(false);
                                setConfirmMessage("");
                            }
                        } catch (innerErr) {
                            console.error("Response handling error:", innerErr);
                            setIsConfirmOpen(false);
                            setConfirmMessage("");
                        }
                    }
                },
                statusBarContext
            );
        } catch (err) {
            console.error("CreateMessage Error:", err);
        }
    };
    const handleOnFolderChange = async (directoryHandle: FileSystemDirectoryHandle) => {
        try {
            const files: File[] = [];

            for await (const [, handle] of directoryHandle.entries()) {

                if (handle.kind === "file") {

                    const file = await handle.getFile();

                    files.push(file);
                }
            }
            const pgFile = validWorksheetList.filter((item: IValidWorksheetList) => {
                return item.sheetName === "PG.FileProfile"
            })
            let fileValidateArr: any = []
            const rowData = pgFile[0].rowData
            let valid = true
            const dataRefData: any = []


            const resp = FnGetRefList("refFileExtension", mainAppContext.refTableRecords)

            if (resp) {
                dataRefData.push(resp)
            } else {
                valid = false
            }
            if (dataRefData.length > 0) {
                for (let i = 0; i < rowData.length; i++) {
                    const item = rowData[i]
                    const DocName = rowData[i]?.DocName ? rowData[i]?.DocName : rowData[i]?.TemplateFileName

                    let FileExtension = rowData[i].FileExtension
                    const TemplateFileName = rowData[i]?.TemplateFileName

                    if (FileExtension || DocName || TemplateFileName) {

                        if (DocName === undefined && TemplateFileName === undefined) {
                            valid = false
                            setsavebtnOnData(true)
                            // File not exists in selected folder.
                            createMessage("EM", "168")
                        } else {
                            let checkFile: File[] = []
                            for (let index = 0; index < files.length; index++) {
                                const ele = files[index];
                                const fullFileName = ele?.name
                                const name = ele?.name?.split(".")[0];
                                const fileExt = "." + ele?.name?.split(".")[1]
                                if (TemplateFileName === fullFileName) {
                                    FileExtension = fileExt
                                }
                                if ((DocName === name && FileExtension === fileExt) || TemplateFileName === fullFileName) {
                                    checkFile.push(ele)
                                }
                            }

                            if (checkFile.length > 0) {
                                let result = await getBase64(checkFile[0])
                                fileValidateArr.push({
                                    docName: DocName,
                                    errorMsg: "",
                                    base64: result,
                                    FileCategory: item.FileCategory,
                                    fileExtension: item.FileExtension ? item.FileExtension : FileExtension

                                })
                                item.uploadDocName = DocName

                            } else {
                                valid = false
                                setsavebtnOnData(true)
                                // File is not valid,file name miss match !
                                createMessage("EM", "169")
                            }
                        }

                    }

                };
                if (valid) {
                    setsavebtnOnData(false)

                }
                const sheetData: IValidWorksheetList[] = []
                validWorksheetList.forEach((item: IValidWorksheetList) => {
                    if (item.sheetName === pgFile[0].sheetName) {
                        item.rowData = rowData
                    }
                    sheetData.push(item)
                })
                setValidWorksheetList([...sheetData])
                setRowDataFileUpload([...fileValidateArr])
            } else {
                createMessage("EM", "171")
            }
        } catch (error) {
            console.error("Error in handleOnFolderChange:", error);
        }
    }
    const getBase64 = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () => {
                try {
                    const result = reader.result;

                    if (typeof result === "string") {
                        const base64result = result.split(";base64,")[1];
                        resolve(base64result);
                    } else {
                        console.error("Unexpected result type from FileReader");
                        resolve("");
                    }
                } catch (err) {
                    console.error("Error processing base64:", err);
                    resolve("");
                }
            };

            reader.onerror = (error) => {
                console.error("FileReader error:", error);
                resolve(""); //  keep behavior safe
            };
        });
    };

    useEffect(() => {
        if (selectRowData.length > 0) {
            let errCount = 0
            for (let index = 0; index < selectRowData.length; index++) {
                const element = selectRowData[index];
                if (element.ErrorString && element.ErrorString.length) {
                    if (!element.ErrorString?.toLowerCase().includes("document uploaded")) {
                        errCount++
                    }
                }

            }

            if (selectRowData.length > 0 && selectedColDef) {

                const errorRows = selectRowData.some((row: Record<string, any>) => row.ErrorString !== '' && row.ErrorString);
                const newColumnDefs = selectedColDef.map((colDef: Record<string, any>) => ({
                    ...colDef,
                    hide: colDef.field === "ErrorString" ? !errorRows : false,  // hide if field not found or falsy
                }));
                setSelectedColDef([...newColumnDefs]);
            }
            setErrorCount(errCount)
        }
    }, [selectRowData])
    function handleClickisAuthorized(event: any, actionCode?: string | undefined, payload?: any): void {
        if (actionCode === "Not Authorized") {
            props.handleClickisAuthorized && props.handleClickisAuthorized(event, actionCode, payload)
        }
    }
    function handleMouseUpload(event: any, actionCode?: string | undefined, payload?: any): void {
        importBtnClick()
    }

    return <div className="nz-import-container">
        <div className="nz-import-header">
            <div className='nz-sub-header'>
                <Label uniqueName={`${props.uniqueName}-header`}
                    label={props.headerText || ""}
                />
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
                        tooltip: errorCount === 0 ? "Start Importing" : "There are errors in data"
                    }}
                    disabled={disabledImportBtnMain}
                    uniqueName="import"
                    w='var(--node_height)'
                    h='var(--node_height)'
                    actionCode="import"
                    tooltip={errorCount === 0 ? "Start Importing" : "There are errors in data"}
                    handleMouse={handleMouseUpload}
                />
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
        {showEditDialog && (<div className=" nz-import-folder">
            <div className="nz-folder-control-div">
                <div className="nz-file-label">
                    <Label uniqueName={`${props.uniqueName}-folder`}
                        label={"Select File Folder:"}
                    />
                </div>
                <div className="nz-fileupload-control">
                    <FolderSelectControl name="folder" onChange={(directoryHandle: FileSystemDirectoryHandle | null, meta: IChangeMeta) => {
                        setUploadInfo('Files have been selected click <b>Upload</b> to begin upload.');
                        if (directoryHandle)
                            handleOnFolderChange(directoryHandle);
                    }} />
                </div>
            </div>
            <div className="nz-upload-folder-icon">
                <ActionImage
                    image={{
                        uniqueName: "upload folder",
                        source: <UploadFolder24x24 size={FnGetCssVariable('--image-size-2')}
                            fill="none"
                            strokeWidth={1} />,
                        type: "svg",
                        w: "var(--image-size-2)",
                        h: "var(--image-size-2)",
                        tooltip: "Upload Folder"
                    }}
                    disabled={savebtnOnData}
                    uniqueName="Upload"
                    w='var(--node_height)'
                    h='var(--node_height)'
                    actionCode="Upload"
                    handleMouse={handleMouseUpload}
                />
            </div>
        </div>)}
        {showEditDialog && <div className="nz-folder-info-line">
            <div dangerouslySetInnerHTML={{ __html: typeof UploadInfo === "string" ? UploadInfo : "" }} />

        </div>}
        <div className="nz-import-error-msg" style={{ display: errorCount === 0 && (selectRowData && selectRowData.length < 5000) ? 'none' : 'block' }}>
            {errorCount > 0 && (
                <div>{`There ${errorCount === 1 ? 'is' : 'are'} ${errorCount} error${errorCount === 1 ? '' : 's'} in the data.`}</div>
            )}

            {selectRowData && selectRowData.length > 5000 && (
                <div> There are more records current view…</div>
            )}
        </div>
        <div className={`nz-import-grid-list ${showEditDialog ? 'nz-show-grid-with-folder-div' : ""}`}>
            {validList.length === 0 ? <div className="nz-no-data-found">
                <Label uniqueName={`${props.uniqueName}-file`}
                    label={"Select file to preview data before importing"}
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
                                handleClickisAuthorized={handleClickisAuthorized}
                            />}
                        </div>
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane">
                        <div className="nz-import-right-side">
                            <div className='nz-sub-header'>
                                <Label uniqueName={`${props.uniqueName}-header`}
                                    label={'Records by Sheets'}
                                />
                            </div>
                            <div className="nz-import-grid">
                                {selectRowData.length === 0 && selectedColDef.length > 0 ? <div className="nz-no-data-found">
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
                                        isExportOnCopy={true}
                                        allowColumnFilter={true}
                                        allowColumnResize={true}
                                        exportFileName={selectedSheet.sheetName ? selectedSheet.sheetName : "ImportData"}
                                        rowData={selectRowData}
                                        isReadOnly={true}
                                        containerName="import_table"
                                        columnDefs={selectedColDef}
                                        uniqueName={"import=" + props.uniqueName + "table"}
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
                    setIsConfirmOpen(false);

                    setTimeout(() => {
                        props.handleClearSelection?.();
                    }, 0);
                }
            } />
    </div >;
};

export { ImportEntitiesWorkSheet }
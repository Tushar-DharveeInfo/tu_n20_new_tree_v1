
import { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { Key } from "rc-tree/lib/interface";
import * as XLSX from 'xlsx';
import { axiosInterceptor } from "../../../../../shared/interceptors/Interceptor";
import { useStatusBarContext } from "../../../../../shared/context/hooks/StatusBarHooks";
import "../../../../allcss/appqaentitiescontainer/netzoom/ExportEntitiesWorkSheet.css";
import { Export24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../appcontainer/allcommon/FnGetCssVariable";
import { FnConvertDateToUtcOrUtcToDate } from "../../../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { FnIsValidDateInput } from "../../../../../appcontainer/allcommon/FnIsValidDateInput";
import { EM, FS } from "../../../../../shared/interceptors/EndPoints";
import { DELIMITER } from "../../../../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid";
import { IExportEntitiesWorkSheet } from "../../../../allinterface/iappqaentitiescontainer/netzoom/IExportEntitiesWorkSheet";
import { ISelectedNodeInfo, ITreeNode } from "../../../../../shared/allinterface/tree/ITreeControl";
import { ActionImage } from "../../../../../shared/basic/actionimage/ActionImage";
import { Label } from "../../../../../shared/basic/label/Label";
import { BasicGrid } from "../../../../../shared/tablegrid/BasicGrid";
import { FnParseJsonSafely } from "../../../../../appcontainer/allcommon/FnParseJsonSafely";


const ExportEntitiesWorkSheet = (props: IExportEntitiesWorkSheet) => {
    const [selectedSheet, setSelectedSheet] = useState<Record<string, any>>({});
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [checkAllKey, setCheckAllkey] = useState<Key[]>([]);
    const [halfChecked, setHalfChecked] = useState<Key[]>([]);
    const [disabledDownload, setDisabledDownload] = useState(true);
    const statusBarContext = useStatusBarContext();
    const fileDownloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileExportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    useEffect(() => {
        return () => {
            fileDownloadTimeoutRef.current && clearTimeout(fileDownloadTimeoutRef.current);
            fileExportTimeoutRef.current && clearTimeout(fileExportTimeoutRef.current);
        }
    }, [])

    useEffect(() => {
        setCheckAllkey(props.checkedNodeKeys);
        setHalfChecked(props.halfCheckedNodeKeys);
        if (props.treeData)
            setTreeData(props.treeData);
    }, [props.checkedNodeKeys, props.halfCheckedNodeKeys, props.treeData]);
    const handleSubCategorySelection = (info: ISelectedNodeInfo) => {

        let selectedSheetData: Record<string, any> = {}
        selectedSheetData.tableName = info.node.Name;
        selectedSheetData.TableLabel = info.node.TableLabel;
        try {
            const handleApiGetEntityRecordsForExport = (response: unknown) => {
                try {
                    if (!response || !Array.isArray(response)) return;

                    const outputSheetData = response;

                    if (outputSheetData?.length > 0) {
                        let rowData: Record<string, any>[] = [];
                        let columnArrayData: Record<string, any>[] = [];

                        try {
                            rowData = outputSheetData[0]?.jsonData
                                ? FnParseJsonSafely(outputSheetData[0].jsonData)
                                : [];
                        } catch (e) {
                            console.error("jsonData parse error:", e);
                            rowData = [];
                        }

                        try {
                            columnArrayData = outputSheetData[0]?.columnArray
                                ? FnParseJsonSafely(outputSheetData[0].columnArray)
                                : [];
                        } catch (e) {
                            console.error("columnArray parse error:", e);
                            columnArrayData = [];
                        }

                        const columnArr: Record<string, any>[] = [];

                        if (Array.isArray(columnArrayData)) {
                            columnArrayData.forEach((element: Record<string, any>, index: number) => {
                                if (!element || typeof element !== "object") return;

                                const obj: Record<string, any> = {
                                    field: element.ColumnName,
                                    resizable: columnArrayData.length === index + 1 ? false : true,
                                    headerName: element.ColumnName,
                                    minWidth: 120,
                                    autoSize: false,
                                };

                                if (
                                    typeof element.ColumnName === "string" &&
                                    (
                                        element.ColumnName.toLowerCase() === "lastupdated" ||
                                        element.ColumnName.toLowerCase().includes("date")
                                    )
                                ) {
                                    obj.cellRenderer = (params: Record<string, any>) => {
                                        return (
                                            <span>
                                                {params.value &&
                                                    FnIsValidDateInput(params.value)
                                                    ? FnConvertDateToUtcOrUtcToDate(
                                                        params.value,
                                                        false,
                                                        true
                                                    )
                                                    : params.value}
                                            </span>
                                        );
                                    };
                                }

                                if (columnArrayData.length === index + 1) {
                                    obj.flex = 1;
                                }

                                columnArr.push(obj);
                            });
                        }

                        selectedSheetData.column = columnArr;
                        selectedSheetData.rowData = Array.isArray(rowData) ? rowData : [];
                    } else {
                        selectedSheetData.column = [];
                        selectedSheetData.rowData = [];
                    }

                    setSelectedSheet({ ...selectedSheetData });

                } catch (error) {
                    console.error("handleApiGetEntityRecordsForExport error:", error);
                }
            };

            const payload = {
                "mode": "GRID",
                "entityName": info.node.EntityName,
                "tableNames": info.node.Name,
                "excludeRecordId": props.excludeRecID,
                "entIDs": "",
            }
            axiosInterceptor({
                url: EM.GetEntityRecordsForExport,
                data: payload,
                setFetchData: handleApiGetEntityRecordsForExport
            }, statusBarContext)
        } catch (error) {
            console.error("Error in GetEntityRecordsForExport:", error);
        }



    };
    const handleSubCategorySelectionRef = useRef(handleSubCategorySelection);
    useEffect(() => {
        if (props.selectedNodeInfo?.selected && props.selectedNodeInfo && props.selectedNodeInfo.node && props.selectedNodeInfo.node.treetype?.toLowerCase() === "emtable") {
            handleSubCategorySelectionRef.current(props.selectedNodeInfo);
        } else {
            setSelectedSheet({});
        }
    }, [props.selectedNodeInfo]);

    useEffect(() => {
        if (props.checkedNodeKeys && props.checkedNodeKeys?.length > 0) {
            setDisabledDownload(false);
        }
    }, [props.checkedNodeKeys])

    // });
    const handleExport = async () => {
        const dataFilter: Key[] = checkAllKey.filter(function (element) {
            return element !== undefined;
        });
        const data = [...dataFilter, ...halfChecked];
        const entityData: ITreeNode[] = [];
        treeData.forEach((item: ITreeNode) => {
            if (item.NodeType === "EntityNode") {
                if (data.includes(item.key)) {
                    entityData.push(item);
                }
            } else {
                item.children?.forEach((subItem: ITreeNode) => {
                    if (subItem.NodeType === "EntityNode") {
                        if (data.includes(subItem.key)) {
                            entityData.push(subItem);
                        }
                    }
                });
            }
        });
        if (entityData?.length > 0) {
            for (let i = 0; i < entityData.length; i++) {
                const entity = entityData[i];
                let tableNames = "";
                entity &&
                    entity?.children?.forEach((subcat: ITreeNode) => {
                        if (checkAllKey.includes(subcat.key)) {
                            if (tableNames === "") tableNames = subcat.Name ?? "";
                            else tableNames += DELIMITER.separator + subcat.Name;
                        }
                    });
                try {
                    const handleApiGetEntityRecordsForExport = async (response: Record<string, any>[]) => {
                        if (response) {
                            try {
                                const responseData: Record<string, any>[] = response;
                                if (responseData) {
                                    const dataFilter = responseData.filter((item: Record<string, any>) => {
                                        return item.tableName === "PG.FileProfile";
                                    });
                                    if (dataFilter && dataFilter.length > 0) {
                                        fileExportTimeoutRef.current = setTimeout(() => {
                                            handleFiledownload(dataFilter[0].jsonData);
                                        }, 3000);
                                    }
                                }
                                const workbook: XLSX.WorkBook = XLSX.utils.book_new();

                                for (let i = 0; i < responseData.length; i++) {
                                    const sheetName = `${responseData[i].tableName}`;
                                    const parsedData = FnParseJsonSafely(responseData[i].columnArray);
                                    const headers: string[] = [];
                                    const descriptions: string[] = [];
                                    const required: string[] = [];
                                    let sortedColumnKeys: string[] = [];

                                    if (parsedData?.length > 0) {
                                        const sortedData = [...parsedData].sort((a, b) => {
                                            return (b.IsRequired === true ? 1 : 0) - (a.IsRequired === true ? 1 : 0);
                                        });

                                        sortedData.forEach((item: Record<string, any>, index: number) => {
                                            headers.push(item.ColumnName);
                                            sortedColumnKeys.push(item.ColumnName);
                                            descriptions.push(index === 0 ? `! ${item.Description}` : item.Description);
                                            required.push(index === 0 ? `! ${item.IsRequired ? item.IsRequired && item.IsDistinct ? "Required*" : "Required" : ""}` : `${item.IsRequired ? item.IsRequired && item.IsDistinct ? "Required*" : "Required" : ""}`);
                                        });
                                    }

                                    const rows: any[][] = [];

                                    if (headers.length > 0) {
                                        rows.push(headers);
                                        rows.push(descriptions);
                                        rows.push(required);
                                    }

                                    if (responseData[i].jsonData) {
                                        const data = FnParseJsonSafely(responseData[i].jsonData);
                                        data.forEach((dataRow: Record<string, any>) => {
                                            const orderedRow = sortedColumnKeys.map((key) => dataRow[key] ?? '');
                                            rows.push(orderedRow);
                                        });
                                    } else {
                                        rows.push([]);
                                    }

                                    const worksheet = XLSX.utils.aoa_to_sheet(rows);
                                    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
                                }

                                // Export workbook
                                const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                                const blob = new Blob([wbout], {
                                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                });
                                saveAs(blob, `${entity.NodeEntityname}.xlsx`);
                            } catch (error) {
                                console.error("Error in GetEntityRecordsForExport:", error);
                            }
                        }
                    }
                    const payload = {
                        "mode": "EXPORT",
                        "entityName": entity.NodeEntityname,
                        "tableNames": tableNames,
                        "excludeRecordId": props.excludeRecID,
                        "entIDs": "",
                    }
                    axiosInterceptor({
                        url: EM.GetEntityRecordsForExport,
                        data: payload,
                        setFetchData: handleApiGetEntityRecordsForExport
                    }, statusBarContext)
                } catch (err) {
                    console.error("Error in GetEntityRecordsForExport:", err);
                }

            }
        }
    };
    // below function (handleFiledownload and downloadfiles) when use check PG.FileProfile node.
    const handleFiledownload = async (data: string) => {
        try {
            let rowData = FnParseJsonSafely(data);
            if (rowData?.length > 0) {
                for (let index = 0; index < rowData.length; index++) {
                    const element = rowData[index];
                    try {
                        const handleApiGetFileStream = (response: unknown) => {
                            try {
                                if (!response || typeof response !== "object") return;
                                if (!element || typeof element !== "object") return;

                                const fileExt =
                                    typeof element.FileExtension === "string"
                                        ? element.FileExtension.split(".")[1]
                                        : undefined;

                                if (!fileExt) return;

                                const fileBlob = (response as any)?.fileBlob;
                                if (!fileBlob) return;

                                fileDownloadTimeoutRef.current = setTimeout(
                                    async () => {
                                        try {
                                            await downloadfiles(
                                                fileExt,
                                                fileBlob,
                                                element.DocName,
                                                element.FileExtension
                                            );
                                        } catch (err) {
                                            console.error("downloadfiles error:", err);
                                        }
                                    },
                                    index * 200 // Delay download every 200ms
                                );

                            } catch (error) {
                                console.error("handleApiGetFileStream error:", error);
                            }
                        };
                        let payload = {
                            "fileCategory": element.FileCategory,
                            "fileUID": element.FileUID,
                            "fileExtension": element.FileExtension
                        }
                        axiosInterceptor({
                            url: FS.GetFileStream,
                            data: payload,
                            setFetchData: handleApiGetFileStream
                        }, statusBarContext)
                    } catch (err) {
                        console.error("Error in GetFileStream:", err);
                    }
                }
            }
        } catch (err) {
            console.error("Error in GetFileStream:", err);
        }

    };
    const downloadfiles = async (
        ext: string,
        fileBlob: string,
        docName: string,
        fileExtension: string
    ) => {
        try {
            let fetchDataModified = `data:application/${ext};base64,${fileBlob}`;
            let a = document.createElement(`a`);
            a.href = fetchDataModified;
            a.download = docName + fileExtension;
            a.click();
        } catch (err) {
            console.error("Error in downloadfiles", err);
        }
    };
    return (
        <div className="nz-export-entites-container">
            <div className="nz-sub-header">
                {selectedSheet && selectedSheet.TableLabel ? (
                    <Label
                        uniqueName={`Entities-header`}
                        label={`Sample records (max. 100) in ${selectedSheet.TableLabel} [${selectedSheet.tableName}]`}
                    />
                ) : (
                    <Label
                        uniqueName={`Entities-header`}
                        label={`Export`}
                    />
                )}
                {((selectedSheet && selectedSheet.TableLabel) || checkAllKey.length > 0) && (
                    <ActionImage
                        image={{
                            uniqueName: "download",
                            source: <Export24x24
                                size={FnGetCssVariable('--image-size-2')}
                                fill='none'
                                strokeWidth={1} />,
                            type: "svg",
                            w: "var(--image-size-2)",
                            h: "var(--image-size-2)",
                            tooltip: "Click to export file",
                        }}
                        disabled={disabledDownload}
                        w='var(--node_height)'
                        h='var(--node_height)'
                        uniqueName="download"
                        actionCode="download click"
                        handleMouse={handleExport}
                    />
                )}
            </div>
            <div className="nz-export-grid">
                {selectedSheet.rowData?.length > 0 ? (
                    <BasicGrid
                        showGrid={true}
                        uniqueName="export-grid"
                        allowAutoSizeColumn={true}
                        instanceName="export_table"
                        featureId={props.featureId}
                        allowColumnFilter={true}
                        isExportOnCopy={false}
                        allowColumnResize={true}
                        exportFileName={
                            selectedSheet.TableLabel ? selectedSheet.TableLabel : "ExportData"
                        }
                        rowData={selectedSheet.rowData}
                        isReadOnly={true}
                        containerName="export_table"
                        columnDefs={selectedSheet.column}
                        allowPagination={true}
                        dynamicPagination={true}
                        paginationAutoPageSize={true}

                    ></BasicGrid>
                ) : <div className="nz-no-data-to-show nz-wh-100 nz-d-flex-hv-left">
                    <Label uniqueName={"No-data-found"} label={"Select table to view records"} />
                </div>}
            </div>
        </div>
    );
};
export { ExportEntitiesWorkSheet }
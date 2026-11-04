
import { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from 'xlsx';
import { ICellRendererParams } from "ag-grid-community";
import "../../../allcss/rackandstack/kebabmenu/ExportDeviceWorksheet.css";
import { Export24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../appcontainer/allcommon/FnGetCssVariable";
import { FnIsValidDateInput } from "../../../../appcontainer/allcommon/FnIsValidDateInput";
import { FnConvertDateToUtcOrUtcToDate } from "../../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { DELIMITER } from "../../../../shared/alldefaultprops/tablegrid/DefaultPropsOneToManyGrid";
import {
  IExportDeviceColumnArrayItem,
  IExportDeviceEntityRecordsExportItem,
  IExportDeviceFileProfileRecord,
  IExportDeviceFileStreamResponse,
  IExportDeviceGridColumnDef,
  IExportDeviceSelectedSheetState,
  IExportDeviceWorksheet,
} from "../../../allinterface/rackandstack/kebabmenu/IExportDeviceWorksheet";
import { Label } from '../../../../shared/basic/label/Label'
import { ActionImage } from "../../../../shared/basic/actionimage/ActionImage";
import { axiosInterceptor } from "../../../../shared/interceptors/Interceptor";
import { EM, FS } from "../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../shared/context/hooks/StatusBarHooks";
import { ISelectedNodeInfo, ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";
import { Key } from "rc-tree/lib/interface";
import { BasicGrid } from "../../../../shared/tablegrid/BasicGrid";
import { FnParseJsonSafely } from "../../../../appcontainer/allcommon/FnParseJsonSafely";

// Returns true when API response is an export records array.
const isEntityRecordsExportResponse = (
  value: unknown
): value is IExportDeviceEntityRecordsExportItem[] =>
  Array.isArray(value);

// Returns true when parsed JSON is a row data array.
const isRowDataArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value);

// Returns true when value is a file profile record object.
const isFileProfileRecord = (value: unknown): value is IExportDeviceFileProfileRecord =>
  value !== null && typeof value === "object";

// Returns true when API response contains file stream data.
const isFileStreamResponse = (value: unknown): value is IExportDeviceFileStreamResponse =>
  value !== null && typeof value === "object";

// Right pane: preview selected device table and export checked entities to Excel.
const ExportDeviceWorksheet = (props: IExportDeviceWorksheet) => {
  const [selectedSheet, setSelectedSheet] = useState<IExportDeviceSelectedSheetState>({});
  const [treeData, setTreeData] = useState<ITreeNode[]>([]);
  const [checkAllKey, setCheckAllkey] = useState<Key[]>([]);
  const [halfChecked, setHalfChecked] = useState<Key[]>([]);
  const [disabledDownload, setDisabledDownload] = useState(true);
  const statusBarContext = useStatusBarContext();


  const fileDownloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileExportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending file download/export timers on unmount.
  useEffect(() => {
    return () => {
      fileDownloadTimeoutRef.current && clearTimeout(fileDownloadTimeoutRef.current);
      fileExportTimeoutRef.current && clearTimeout(fileExportTimeoutRef.current);
    }
  }, [])
  // Sync tree selection from parent and enable download when nodes are checked.
  useEffect(() => {
    if (props.checkedNodeKeys) {
      setCheckAllkey(props.checkedNodeKeys);
    }
    if (props.halfCheckedNodeKeys) {
      setHalfChecked(props.halfCheckedNodeKeys);
    }
    setTreeData(props.treeData);
    if (props.checkedNodeKeys && props.checkedNodeKeys?.length > 0) {
      ;
      setDisabledDownload(false);
    } else {
      setDisabledDownload(true);
    }
  }, [
    props.checkedNodeKeys,
    props.halfCheckedNodeKeys,
    props.treeData,
    props.excludeRecID,
  ]);

  // Load sample grid data when user selects an EM table node in the tree.
  const handleSubCategorySelection = (info: ISelectedNodeInfo) => {
    if (info) {
      const selectedSheetData: IExportDeviceSelectedSheetState = {
        tableName: info.node.Name,
        TableLabel: info.node.TableLabel,
      };
      try {
        // Build preview grid columns and rows from GRID mode API response.
        const handleApiGetEntityRecordsForExport = (response: unknown, status?: string) => {
          if (response && isEntityRecordsExportResponse(response)) {
            try {
              if (status !== '200') {
                throw new Error("API request failed");
              }
              const outputSheetData = response;
              if (outputSheetData?.length > 0) {
                const rowData = outputSheetData && outputSheetData.length && outputSheetData[0].jsonData && FnParseJsonSafely(outputSheetData[0].jsonData);
                const columnArrayData: IExportDeviceColumnArrayItem[] | false = outputSheetData && outputSheetData.length && outputSheetData[0].columnArray && JSON.parse(outputSheetData[0].columnArray);

                const columnArr: IExportDeviceGridColumnDef[] = [];

                columnArrayData && columnArrayData.forEach((element: IExportDeviceColumnArrayItem, index: number) => {
                  const obj: IExportDeviceGridColumnDef = {
                    field: element.ColumnName,
                    resizable: columnArrayData.length === index + 1 ? false : true,
                    headerName: element.ColumnName,
                    minWidth: 120,
                    autoSize: false,
                  };
                  // Format date columns for display in the preview grid.
                  if (element.ColumnName?.toLowerCase() === "lastupdated" || element.ColumnName?.toLowerCase().includes('date')) {
                    obj.cellRenderer = (params: ICellRendererParams<Record<string, unknown>>) => {
                      return <span>{params.value && FnIsValidDateInput(params.value) ? FnConvertDateToUtcOrUtcToDate(params.value, false, true) : params.value}</span>;
                    }
                  };
                  if (columnArrayData.length === index + 1) {
                    obj.flex = 1;
                  }
                  columnArr.push(obj);
                });

                selectedSheetData.column = columnArr;
                selectedSheetData.rowData = rowData;
              } else {
                selectedSheetData.column = [];
                selectedSheetData.rowData = [];
              }
              setSelectedSheet({ ...selectedSheetData });

            } catch (error) {
              console.error("Error in GetEntityRecordsForExport", error);
            }


          }
        }

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
          allowShowLoader: true,
          setFetchData: handleApiGetEntityRecordsForExport
        }, statusBarContext)
      } catch (e) {
        console.error("Error in GetEntityRecordsForExport", e);
      }

    }
  };
  const handleSubCategorySelectionRef = useRef(handleSubCategorySelection)
  // Refresh preview when selected tree node changes.
  useEffect(() => {
    if (props.selectedNodeInfo?.selected && props.selectedNodeInfo && props.selectedNodeInfo.node && props.selectedNodeInfo.node.treetype?.toLowerCase() === "emtable") {
      handleSubCategorySelectionRef.current(props.selectedNodeInfo);
    } else {
      setSelectedSheet({});
    }
  }, [props.selectedNodeInfo]);

  // Export checked device entities to Excel and download related file profiles.
  const handleExport = async () => {

    let dataFilter: Key[] = checkAllKey.filter(function (element) {
      return element !== undefined;
    });
    let data = [...dataFilter, ...halfChecked];
    let entityData: ITreeNode[] = [];
    // Collect checked entity nodes from the export tree.
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
        let entity = entityData[i];
        let tableNames = "";
        entity &&
          entity?.children?.forEach((subcat: ITreeNode) => {
            if (checkAllKey.includes(subcat.key)) {
              if (tableNames === "") tableNames = subcat.Name ?? "";
              else tableNames += DELIMITER.separator + subcat.Name;
            }
          });
        try {
          // Build Excel workbook from EXPORT mode API response per entity.
          const handleApiGetEntityRecordsForExport = async (response: unknown, status?: string) => {
            try {
              if (status !== '200') {
                throw new Error("API request failed");
              }
              if (response && isEntityRecordsExportResponse(response)) {
                const responseData = response;
                if (responseData) {
                  // Download file attachments when PG.FileProfile is included.
                  const dataFilter = responseData.filter((item: IExportDeviceEntityRecordsExportItem) => {
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
                    const sortedData = [...parsedData].sort((a: IExportDeviceColumnArrayItem, b: IExportDeviceColumnArrayItem) => {
                      return (b.IsRequired === true ? 1 : 0) - (a.IsRequired === true ? 1 : 0);
                    });

                    sortedData.forEach((item: IExportDeviceColumnArrayItem, index: number) => {
                      headers.push(item.ColumnName);
                      sortedColumnKeys.push(item.ColumnName);
                      descriptions.push(index === 0 ? `! ${item.Description ?? ''}` : (item.Description ?? ''));
                      required.push(index === 0 ? `! ${item.IsRequired ? item.IsRequired && item.IsDistinct ? "Required*" : "Required" : ""}` : `${item.IsRequired ? item.IsRequired && item.IsDistinct ? "Required*" : "Required" : ""}`);

                    });
                  }

                  const rows: (string | unknown)[][] = [];

                  if (headers.length > 0) {
                    rows.push(headers);
                    rows.push(descriptions);
                    rows.push(required);
                  }

                  if (responseData[i].jsonData) {
                    const parsedJsonData = FnParseJsonSafely(responseData[i].jsonData);
                    if (isRowDataArray(parsedJsonData)) {
                      parsedJsonData.forEach((dataRow: Record<string, unknown>) => {
                        const orderedRow = sortedColumnKeys.map((key) => dataRow[key] ?? '');
                        rows.push(orderedRow);
                      });
                    }
                  } else {
                    rows.push([]);
                  }

                  const worksheet = XLSX.utils.aoa_to_sheet(rows);
                  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
                }

                const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                saveAs(blob, `${entity.NodeEntityname}.xlsx`);

              }
            } catch (err) {
              console.error("Error in GetEntityRecordsForExport", err);
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
            allowShowLoader: true,
            setFetchData: handleApiGetEntityRecordsForExport
          }, statusBarContext)
        } catch (err) {
          console.error("Error in GetEntityRecordsForExport", err);
        }
      }
    }
  };
  // Download file stream for each PG.FileProfile record after export.
  const handleFiledownload = async (data: string) => {
    const rowData: unknown = FnParseJsonSafely(data);
    if (isRowDataArray(rowData) && rowData.length > 0) {
      for (let index = 0; index < rowData.length; index++) {
        const element = rowData[index];
        try {
          const handleApiGetFileStream = (response: unknown) => {
            try {
              if (!isFileStreamResponse(response)) return;
              if (!isFileProfileRecord(element)) return;

              const fileExt =
                typeof element.FileExtension === "string"
                  ? element.FileExtension.split(".")[1]
                  : undefined;

              if (!fileExt) return;

              const fileBlob = response.fileBlob;
              if (!fileBlob) return;

              fileDownloadTimeoutRef.current = setTimeout(
                async () => {
                  try {
                    await downloadfiles(
                      fileExt,
                      fileBlob,
                      element.DocName as string,
                      element.FileExtension as string
                    );
                  } catch (err) {
                    console.error("downloadfiles error:", err);
                  }
                },
                index * 200 // Stagger downloads to avoid browser blocking.
              );

            } catch (error) {
              console.error("handleApiGetFileStream error:", error);
            }
          };

          let payload = {
            fileCategory: element?.FileCategory,
            fileUID: element?.FileUID,
            fileExtension: element?.FileExtension
          };

          axiosInterceptor(
            {
              url: FS.GetFileStream,
              data: payload,
              setFetchData: handleApiGetFileStream
            },
            statusBarContext
          );


        } catch (err) {
          console.error("Error in GetFileStream", err);
        }
      }
    }
  };
  // Trigger browser download for a base64-encoded file blob.
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
            fontWeight="bold"
          />
        ) : (
          <Label
            uniqueName={`Entities-header`}
            label={`Export`}
          />
        )}
        {((selectedSheet && selectedSheet.TableLabel) || checkAllKey.length > 0) && <ActionImage
          image={{
            uniqueName: "download",
            source: <Export24x24
              size={FnGetCssVariable('--image-size-2')}
              fill='none'
              strokeWidth={1} />,
            type: "svg",
            w: "var(--image-size-2)",
            h: "var(--image-size-2)",
            tooltip: "Click to Download file",
          }}
          disabled={disabledDownload}
          w='var(--node_height)'
          h='var(--node_height)'
          uniqueName="download"
          actionCode="download click"

          handleMouse={handleExport}
        />}
      </div>
      <div className="nz-export-grid">
        {selectedSheet.rowData && selectedSheet.rowData?.length > 0 ? (
          <BasicGrid
            showGrid={true}
            uniqueName="export-grid"
            allowAutoSizeColumn={true}
            instanceName="export_table"
            featureId={props.featureId}
            isExportOnCopy={false}
            allowColumnFilter={true}
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
export { ExportDeviceWorksheet }

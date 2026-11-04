import { useEffect, useMemo, useState } from "react";
import "../allcss/power/IntelRawDataGrid.css";
import { IBasicGridColDef } from "../../shared/allinterface/tablegrid/IBasicGrid";
import { BasicGrid } from "../../shared/tablegrid/BasicGrid";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { Label } from "../../shared/basic/label/Label";
import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { ICellRendererParams } from "ag-grid-community";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { EM } from "../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../shared/context/hooks/StatusBarHooks";
import { OpenSidebar24x24 } from "@n20a/libicon";
import { ActionImage } from "../../shared/basic/actionimage/ActionImage";
import { FnGetCssVariable } from "../../appcontainer/allcommon/FnGetCssVariable";

export interface IRawDataGridRow {
    id: string;
    Name: string;
    Value: string;
}

export interface IIntelRawDataGridProps {
    uniqueName?: string;
    rawData?: unknown;
    selectedNode?: ITreeNode;
    title?: string;
    isLoading?: boolean;
    featureId?: string;
    hideSideBarCloseBtn?: boolean;
    handleSidebarOpenClose?: (action: 'open' | 'close') => void;
}

/**
 * Extracts and parses RawData from the API response into Name/Value row entries.
 */
export const parseRawDataToRows = (dataInput: unknown): IRawDataGridRow[] => {
    if (!dataInput) return [];

    let current: unknown = dataInput;

    // 1. If input is a JSON string, parse it
    if (typeof current === "string") {
        current = FnParseJsonSafely(current);
    }

    // 2. Unwrap jsonStringOutput or dataJson if present
    if (current && typeof current === "object") {
        const obj = current as Record<string, unknown>;
        if (typeof obj.jsonStringOutput === "string") {
            const parsed = FnParseJsonSafely(obj.jsonStringOutput);
            if (parsed) {
                current = parsed;
            }
        } else if (typeof obj.dataJson === "string") {
            const parsed = FnParseJsonSafely(obj.dataJson);
            if (parsed) {
                current = parsed;
            }
        }
    }

    // 3. If still a string after unwrapping, parse again
    if (typeof current === "string") {
        current = FnParseJsonSafely(current);
    }

    // 4. Extract records array from PG.IntelRawData or similar table property
    let records: unknown[] = [];
    if (current && typeof current === "object") {
        if (Array.isArray(current)) {
            records = current;
        } else {
            const obj = current as Record<string, unknown>;
            const intelKey = Object.keys(obj).find((k) =>
                k.toLowerCase().includes("intelrawdata")
            );
            if (intelKey && obj[intelKey]) {
                const tableVal = obj[intelKey];
                if (Array.isArray(tableVal)) {
                    records = tableVal;
                } else if (tableVal && typeof tableVal === "object") {
                    records = [tableVal];
                }
            } else if ("PG.IntelRawData" in obj) {
                const tableVal = obj["PG.IntelRawData"];
                if (Array.isArray(tableVal)) {
                    records = tableVal;
                } else if (tableVal && typeof tableVal === "object") {
                    records = [tableVal];
                }
            } else {
                // If any property contains an array of records
                const arrayKey = Object.keys(obj).find(
                    (k) => Array.isArray(obj[k]) && (obj[k] as unknown[]).length > 0
                );
                if (arrayKey) {
                    records = obj[arrayKey] as unknown[];
                } else {
                    records = [current];
                }
            }
        }
    }

    if (records.length === 0) return [];

    // 5. Use the first row of table records
    const firstRec = records[0];
    if (!firstRec || typeof firstRec !== "object") return [];

    const firstRecObj = firstRec as Record<string, unknown>;

    // 6. Look for RawData property in the first row (case-insensitive)
    let rawDataValue: unknown = undefined;
    for (const key of Object.keys(firstRecObj)) {
        if (key.toLowerCase() === "rawdata") {
            rawDataValue = firstRecObj[key];
            break;
        }
    }

    if (rawDataValue === undefined) {
        if (
            !("LastUpdated" in firstRecObj) &&
            !("EntityName" in firstRecObj) &&
            !("jsonStringOutput" in firstRecObj) &&
            !("dataJson" in firstRecObj)
        ) {
            rawDataValue = firstRecObj;
        }
    }

    // 7. RawData is a JSON-encoded string of key-value pairs
    if (typeof rawDataValue === "string") {
        rawDataValue = FnParseJsonSafely(rawDataValue);
    }

    // 8. Map key-value pairs into Name and Value rows
    if (rawDataValue && typeof rawDataValue === "object" && !Array.isArray(rawDataValue)) {
        return Object.entries(rawDataValue as Record<string, unknown>).map(([key, value], idx) => ({
            id: String(idx + 1),
            Name: key,
            Value: value !== null && value !== undefined ? String(value) : ""
        }));
    }

    return [];
};

const IntelRawDataGrid = (props: IIntelRawDataGridProps) => {
    const statusBarContext = useStatusBarContext();
    const uniqueName = props.uniqueName || "intel-raw-data";

    const [fetchedData, setFetchedData] = useState<unknown>(null);
    const [isInternalLoading, setIsInternalLoading] = useState<boolean>(false);

    // If rawData is not passed from parent, fetch it internally when selectedNode is provided
    useEffect(() => {
        if (props.rawData !== undefined) {
            setFetchedData(props.rawData);
            return;
        }

        if (!props.selectedNode) {
            setFetchedData(null);
            return;
        }

        const entId =
            props.selectedNode.NodeEntID ||
            props.selectedNode.MountedDeviceEntID ||
            (props.selectedNode.key ? String(props.selectedNode.key) : "") ||
            "3fa85f64-5717-4562-b3fc-2c963f66afa6";

        setIsInternalLoading(true);
        axiosInterceptor(
            {
                url: EM.GetTableRecord,
                data: {
                    tableName: "PG.IntelRawData",
                    recID: entId,
                    entID: entId
                },
                allowShowLoader: false,
                setFetchData: (response: unknown, status?: string) => {
                    setIsInternalLoading(false);
                    if (status === "200" && response) {
                        let parsed: unknown = response;
                        if (typeof response === "object" && response !== null) {
                            const resObj = response as Record<string, unknown>;
                            if (typeof resObj.jsonStringOutput === "string") {
                                const unwrapped = FnParseJsonSafely(resObj.jsonStringOutput);
                                if (unwrapped) parsed = unwrapped;
                            } else if (typeof resObj.dataJson === "string") {
                                const unwrapped = FnParseJsonSafely(resObj.dataJson);
                                if (unwrapped) parsed = unwrapped;
                            }
                        }
                        setFetchedData(parsed);
                    } else {
                        setFetchedData(null);
                    }
                }
            },
            statusBarContext
        );
    }, [props.rawData, props.selectedNode, statusBarContext]);

    const activeData = props.rawData !== undefined ? props.rawData : fetchedData;
    const isLoading = props.isLoading !== undefined ? props.isLoading : isInternalLoading;

    const rowData: IRawDataGridRow[] = useMemo(() => {
        return parseRawDataToRows(activeData);
    }, [activeData]);

    const columnDefs: IBasicGridColDef[] = useMemo(
        () => [
            { field: "id", hide: true },
            {
                field: "Name",
                headerName: "Name",
                minWidth: 160,
                width: 240,
                resizable: true,
                editable: false,
                sortable: true,
                filter: false,
                cellRenderer: (params: ICellRendererParams<IRawDataGridRow>) => (
                    <span title={String(params.data?.Name ?? "")}>
                        {String(params.data?.Name ?? "")}
                    </span>
                )
            },
            {
                field: "Value",
                headerName: "Value",
                minWidth: 160,
                flex: 1,
                resizable: true,
                editable: false,
                sortable: true,
                filter: false,
                cellRenderer: (params: ICellRendererParams<IRawDataGridRow>) => (
                    <span title={String(params.data?.Value ?? "")}>
                        {String(params.data?.Value ?? "")}
                    </span>
                )
            }
        ],
        []
    );

    const relativeTitle =
        props.title ||
        (props.selectedNode?.Name
            ? `DCM Data: ${props.selectedNode.Name}`
            : "DCM Data");

    return (
        <div className="nz-intel-raw-data-container nz-wh-100 nz-d-flex-column">
            <div className="nz-intel-raw-data-header nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header">
                <Label label={relativeTitle} uniqueName={`${uniqueName}-title`} />
                {!props.hideSideBarCloseBtn && props.handleSidebarOpenClose && (
                    <ActionImage
                        uniqueName={`${uniqueName}-explorer-tree-info-ai`}
                        image={{
                            uniqueName: `${uniqueName}-explorer-tree-info-image`,
                            source: (
                                <OpenSidebar24x24
                                    size={FnGetCssVariable('--image-size-2')}
                                    fill="none"
                                    strokeWidth={1}
                                />
                            ),
                            w: 'var(--image-size-2)',
                            tooltip: "Click to view node details in sidebar",
                            type: "svg"
                        }}
                        w={'var(--node_height)'}
                        h={'var(--node_height)'}
                        actionCode={'information'}
                        handleMouse={() => {
                            props.handleSidebarOpenClose?.('open');
                        }}
                    />
                )}
            </div>
            <div className="nz-intel-raw-grid-content nz-wh-100">
                {isLoading ? (
                    <div className="nz-intel-raw-grid-placeholder">
                        <span>Loading...</span>
                    </div>
                ) : rowData.length > 0 ? (
                    <BasicGrid
                        uniqueName={`${uniqueName}-grid`}
                        instanceName="intel_raw_data_grid"
                        showGrid={true}
                        isReadOnly={true}
                        allowPagination={false}
                        allowEdit={false}
                        allowDeleteButton={false}
                        allowEditButton={false}
                        allowColumnResize={true}
                        allowAutoSizeColumn={true}
                        allowSort={true}
                        allowFilter={false}
                        columnDefs={columnDefs}
                        rowData={rowData}
                        containerName="intel_raw_data"
                        featureId={props.featureId}
                        className="nz-wh-100"
                    />
                ) : (
                    <div className="nz-intel-raw-grid-placeholder">
                        <Label
                            uniqueName={`${uniqueName}-no-data`}
                            label="No DCM Data available"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export { IntelRawDataGrid };
export default IntelRawDataGrid;

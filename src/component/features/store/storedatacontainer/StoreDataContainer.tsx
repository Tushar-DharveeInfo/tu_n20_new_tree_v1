
import { useEffect, useMemo, useRef, useState } from "react"
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";
import '../../allcss/store/StoreDataContainer.css'
import { IStoreDataContainer } from "../../allinterface/store/IStoreDataContainer"
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor"
import { DATAGRID, EXPLORER } from "../../../shared/interceptors/EndPoints"
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks"
import { BasicGrid } from "../../../shared/tablegrid/BasicGrid"
import { IBasicGridColDef } from "../../../shared/allinterface/tablegrid/IBasicGrid"
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely"
import { FnFindNearestNodeByType } from "../../../shared/allcommon/FnFindNearestNodeByType"

const StoreDataContainer = ({ uniqueName, featureId, selectedNode, selectedFloorNode, treeData, handleShowUserMessage }: IStoreDataContainer) => {
    const [hierarchyJson, setHierarchyJson] = useState<Record<string, any>[]>();
    const [hierarchyLoaded, setHierarchyLoaded] = useState(false);
    const [columnDefs, setColumnDefs] = useState<IBasicGridColDef[]>([]);
    const [columnWidthStored, setColumnWidthStored] = useState<Record<string, any>[]>();
    const [loading, setLoading] = useState(true);
    const statusBarContext = useStatusBarContext();
    const shownEmptyPopupKeyRef = useRef<string | null>(null);

    const refreshKey = selectedNode?.refreshKey ?? selectedFloorNode?.refreshKey;

    const baseColumnDefs: IBasicGridColDef[] = useMemo(() => {
        const isAllCables =
            selectedFloorNode?.Type?.toLowerCase() === "all cables";

        const columns: IBasicGridColDef[] = [
            { headerName: "Bin Name", field: "LocationName" },
            {
                headerName: isAllCables ? "Cable Name" : "Device Name",
                field: "DeviceName"
            },
            { headerName: "Description", field: "DeviceDescription" },
            { headerName: "Manufacturer", field: "ManufacturerName" },
            { headerName: "EqType", field: "DeviceEQType" },
            { headerName: "EQID", field: "DeviceEQID" },

            // Don't show Slots Needed for All Cables
            ...(!isAllCables
                ? [{
                    headerName: "Slots Needed",
                    field: "DeviceSlotsNeeded"
                }]
                : []),

            { headerName: "Width", field: "DeviceWidth" },
            { headerName: "Height", field: "DeviceHeight" },
            {
                headerName: "Length",
                field: "DeviceLength",
                flex: 1,
                minWidth: 100
            },
        ];

        return columns;
    }, [selectedFloorNode?.Type]);

    useEffect(() => {
        const abortController = new AbortController();
        const { signal } = abortController;


        setLoading(true);
        setHierarchyLoaded(false);
        setHierarchyJson(undefined);
        shownEmptyPopupKeyRef.current = null;

        if (!selectedFloorNode?.NodeEntID) {
            setLoading(false);
            return () => abortController.abort();
        }

        const applyIfActive = (action: () => void) => {
            if (!signal.aborted) {
                action();
            }
        };

        const loadColumnWidths = () => {
            axiosInterceptor({
                url: DATAGRID.GetDatagridJsonColwidtharray,
                allowShowLoader: true,
                data: { dataGridNames: "storedatacontainer" },
                setFetchData: (resp: unknown, status?: string) => {
                    if (signal.aborted) {
                        return;
                    }

                    if (status !== "200" || !Array.isArray(resp) || !resp?.length) {
                        applyIfActive(() => setColumnDefs(baseColumnDefs));
                        return;
                    }

                    let storedColumns: Record<string, any>[] = [];
                    try {
                        storedColumns = JSON.parse(resp[0].colWidthJsonArray || '[]')
                            .filter((c: any) => c.colname);
                    } catch (error) {
                        console.error('Error in parse json string :', error);
                        applyIfActive(() => setColumnDefs(baseColumnDefs));
                        return;
                    }

                    applyIfActive(() => setColumnWidthStored(storedColumns));
                }
            }, statusBarContext).catch((error) => {
                if (!signal.aborted) {
                    console.error('Failed to load store grid column widths:', error);
                    applyIfActive(() => setColumnDefs(baseColumnDefs));
                }
            });
        };

        const isRefresh = Boolean(refreshKey);
        const payload = {
            floorID: selectedFloorNode.NodeEntID,
            exploreType: 1,
            isRefresh
        };

        loadColumnWidths();

        axiosInterceptor({
            url: EXPLORER.FloorDevicesConfigurationHierarchyReduced,
            data: payload,
            allowShowLoader: true,
            setFetchData: (_resp: unknown, status?: string) => {
                if (signal.aborted) {
                    return;
                }

                if (status === "200" && _resp && typeof _resp === "object" && 'hierarchyJson' in _resp && _resp.hierarchyJson) {
                    const parsedJson = FnParseJsonSafely(_resp.hierarchyJson as string);
                    applyIfActive(() => {
                        if (parsedJson?.Floor && Array.isArray(parsedJson.Floor)) {
                            setHierarchyJson(parsedJson.Floor);
                        } else {
                            setHierarchyJson(undefined);
                        }
                        setLoading(false);
                        setHierarchyLoaded(true);
                    });
                } else {
                    applyIfActive(() => {
                        setHierarchyJson(undefined);
                        setLoading(false);
                        setHierarchyLoaded(true);
                    });
                }
            }
        }, statusBarContext).catch((error) => {
            if (!signal.aborted) {
                console.error('Failed to load store hierarchy:', error);
                applyIfActive(() => {
                    setHierarchyJson(undefined);
                    setLoading(false);
                    setHierarchyLoaded(true);
                });
            }
        });

        return () => {
            abortController.abort();
        };
    }, [
        selectedFloorNode?.NodeEntID,
        refreshKey,
        featureId
    ]);

    useEffect(() => {
        if (columnWidthStored?.length) {
            const mergedColumnDefs = baseColumnDefs.map(col => {
                const matchedCol = columnWidthStored.find(
                    (s: any) => s.colname === col.field
                );

                return {
                    ...col,
                    width: matchedCol?.colwidth ?? 200,
                    hide: matchedCol?.isHidden ?? false
                };
            });

            setColumnDefs(mergedColumnDefs);
        } else {
            setColumnDefs(baseColumnDefs);
        }
    }, [columnWidthStored, baseColumnDefs]);

    const rowData = useMemo(() => {
        if (!hierarchyJson?.length) return [];

        const seen = new Set<string>();
        let rows: Record<string, any>[] = [];

        for (let i = 0; i < hierarchyJson.length; i++) {
            const item = hierarchyJson[i];

            if (
                item.DeviceEntID != null &&
                !seen.has(item.DeviceEntID)
            ) {
                seen.add(item.DeviceEntID);

                rows.push({
                    LocationEntID: item.LocationEntID,
                    LocationName: item.LocationName,
                    DeviceEntID: item.DeviceEntID,
                    DeviceName: item.DeviceName,
                    DeviceDescription: item.DeviceDescription,
                    ManufacturerName: item.ManufacturerName,
                    DeviceEQID: item.DeviceEQID,
                    DeviceEQType: item.EqtypeName,
                    DeviceSlotsNeeded: item.DeviceSlotsNeeded,
                    DeviceWidth: item.DeviceWidth,
                    DeviceHeight: item.DeviceHeight,
                    DeviceLength: item.DeviceLength,
                    DeviceParentID: item.DeviceParentID
                });
            }
        }

        if (!selectedNode) {
            return rows;
        }

        const nodeType =
            selectedNode.NodeType?.trim().toLowerCase();

        const selectedName =
            selectedNode.Name?.trim().toLowerCase();

        // ---------------------------------------------
        // BIN
        // ---------------------------------------------
        if (
            nodeType === "bin" &&
            selectedNode.NodeEntID
        ) {
            return rows.filter(
                row =>
                    row.DeviceParentID ===
                    selectedNode.NodeEntID
            );
        }

        // ---------------------------------------------
        // MANUFACTURER
        // ---------------------------------------------
        if (
            nodeType === "manufacturer" &&
            selectedName && treeData
        ) {
            const parentBin = FnFindNearestNodeByType(
                treeData,
                selectedNode,
                "Bin"
            );

            const parentBinID =
                parentBin?.NodeEntID;

            return rows.filter((row) => {
                const manufacturerMatch =
                    row.ManufacturerName
                        ?.trim()
                        .toLowerCase() === selectedName;

                const binMatch =
                    !parentBinID ||
                    row.LocationEntID === parentBinID;

                return (
                    manufacturerMatch &&
                    binMatch
                );
            });
        }

        // ---------------------------------------------
        // EQTYPE
        // ---------------------------------------------
        if (
            nodeType === "eqtype" &&
            selectedName && treeData
        ) {
            const parentBin = FnFindNearestNodeByType(
                treeData,
                selectedNode,
                "Bin"
            );

            const parentBinID =
                parentBin?.NodeEntID;
            const manufacturerName =
                selectedNode.parentEntID
                    ?.split("##")[1]
                    ?.trim()
                    .toLowerCase();

            return rows.filter((row) => {
                const isEQTypeMatch =
                    row.DeviceEQType
                        ?.trim()
                        .toLowerCase() === selectedName;

                const binMatch =
                    !parentBinID ||
                    row.LocationEntID === parentBinID;

                const isManufacturerMatch =
                    row.ManufacturerName
                        ?.trim()
                        .toLowerCase() === manufacturerName;

                return (
                    isEQTypeMatch &&
                    isManufacturerMatch &&
                    binMatch
                );
            });
        }

        return rows;

    }, [
        hierarchyJson,
        selectedNode?.NodeEntID,
        selectedNode?.NodeType,
        selectedNode?.Name,
        selectedNode?.parentEntID,
        treeData
    ]);

    const emptyLabel = selectedNode?.Name ?? selectedFloorNode?.Name ?? "selection";


    const handleDownloadData = async () => {
        if (!rowData || rowData.length === 0) {
            handleShowUserMessage?.("No data found to download.");
            return;
        }

        try {
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            const headers: string[] = [];
            const sortedColumnKeys: string[] = [];

            const effectiveColumns = (columnDefs && columnDefs.length > 0 ? columnDefs : baseColumnDefs)
                .filter((col) => !col.hide && col.field);

            effectiveColumns.forEach((col) => {
                headers.push(col.headerName || col.field || '');
                if (col.field) {
                    sortedColumnKeys.push(col.field);
                }
            });

            const rows: (string | number)[][] = [];
            if (headers.length > 0) {
                rows.push(headers);
            }

            rowData.forEach((dataRow: Record<string, any>) => {
                const orderedRow = sortedColumnKeys.map((key) => {
                    const cellValue = dataRow[key];
                    if (cellValue == null) {
                        return '';
                    }
                    if (typeof cellValue === 'string' || typeof cellValue === 'number') {
                        return cellValue;
                    }
                    return String(cellValue);
                });
                rows.push(orderedRow);
            });

            const rawName = (selectedNode?.Name || selectedFloorNode?.Name || 'storedatacontainer').trim();
            const sanitizedFileName = rawName.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'storedatacontainer';
            const sheetName = rawName.replace(/[:\\/?*\[\]]/g, '_').substring(0, 31) || 'storedatacontainer';

            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            // Export workbook
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `${sanitizedFileName}.xlsx`);
        } catch (error) {
            console.error('StoreDataContainer: failed to export store data', error);
            handleShowUserMessage?.('Unable to export store data. Please try again.');
        }
    };

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }

    if (!hierarchyLoaded || !rowData?.length) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">
                {`No data found to show for: ${emptyLabel}`}
            </div>
        );
    }
    return (
        <div className="nz-store-bin-grid-container" key={`${uniqueName}-${refreshKey ?? "initial"}`}>
            <BasicGrid uniqueName={uniqueName + "data-grid"}
                instanceName={"storedatacontainer"}
                showGrid={true}
                rowData={rowData}
                containerName={"storedatacontainer"}
                columnDefs={columnDefs}
                allowColumnResize={true}
                allowAutoSizeColumn={false}
                paginationAutoPageSize={true}
                allowColumnFilter={true}
                isExportOnCopy={true}
                exportFileName={selectedNode?.Name || selectedFloorNode?.Name || "storedatacontainer"}
                handleDownloadData={handleDownloadData}
                allowPagination={true} />
        </div>
    )
}

export { StoreDataContainer }

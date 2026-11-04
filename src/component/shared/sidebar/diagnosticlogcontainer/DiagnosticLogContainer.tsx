
import { useEffect, useRef, useState } from 'react'
import { ICellRendererParams, RowClassRules } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import '../../allcss/sidebar/DiagnosticLogContainer.css'
import { IDiagnosticLogContainer } from '../../allinterface/sidebar/IDiagnosticLogContainer';
import { ISessionVariable } from '../../allinterface/basic/ISessionVariable';
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../interceptors/Interceptor';
import { SESSION } from '../../interceptors/EndPoints';
import { FnHandleAPIResponse } from '../../allcommon/basic/FnHandleAPIResponse';
import { IBasicGridColDef } from '../../allinterface/tablegrid/IBasicGrid';
import { FnCellEditorSelector } from '../../allcommon/tablegrid/FnCellEditorSelector';
import { SessionContainer } from './SessionContainer';
import { Label } from '../../basic/label/Label';
import { BasicGrid } from '../../tablegrid/BasicGrid';


const DiagnosticLogContainer = (props: IDiagnosticLogContainer) => {
    const [actionData, setActionData] = useState<Record<string, any>[]>([]);
    const [isGridReady, setIsGridReady] = useState(false);
    const [sessionData, setSessionData] = useState<ISessionVariable[]>([]);
    const statusBarContext = useStatusBarContext();
    const gridRef = useRef<AgGridReact>(null);

    useEffect(() => {
        if (props.actionData) {
            let newArray: Record<string, any>[] = [...props.actionData].sort((a, b) => b.id - a.id);
            setActionData(newArray);
        }
        else {
            setActionData([])
        }

    }, [props.actionData]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (gridRef.current) {
                setIsGridReady(true);

                const sessionContainer = document.querySelector<HTMLElement>('#DiagnosticLogContainerDiv');
                if (sessionContainer) {
                    sessionContainer.style.display = 'flex';
                }

                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [props.featureId]);

    useEffect(() => {
        axiosInterceptor({
            url: SESSION.GetSessionVariables,
            data: {},
            setFetchData: (handleGetSessionVariablesApiResp: unknown, status?: string) => {
                if (status === "200" && handleGetSessionVariablesApiResp && typeof handleGetSessionVariablesApiResp === "object" && 'jsonSessionOutput' in handleGetSessionVariablesApiResp) {
                    const sessionVars = FnHandleAPIResponse(handleGetSessionVariablesApiResp.jsonSessionOutput, "Dataset");
                    if (sessionVars.length > 0) {
                        setSessionData([...sessionVars]);
                    }
                }
            }
        }, statusBarContext);
    }, [props.selectedNode?.NodeEntID])



    const rowClassRules: RowClassRules = {
        "row-error": (params: any) => {
            return params.data.isErr === true
        }
    }
    const gridColumnsForEditFrom: IBasicGridColDef[] = [

        {
            field: "timeStamp",
            headerName: "Time",
            resizable: true,
            width: 150,
            cellRenderer: (params: ICellRendererParams) => {
                const timestamp = params?.data?.timeStamp;
                const date = new Date(timestamp);
                // Get the time up to milliseconds
                const timeWithMilliseconds = isNaN(date.getTime()) ? params?.data?.timeStamp : date.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                    <span className='d-flex align-items-center justify-content-between w-100' >
                        {`${timestamp == null ? "" : timeWithMilliseconds}${params?.data?.difference ? ` (${params?.data.difference})` : ""}`}
                    </span>
                );
            },
        },
        {
            field: "errString",
            headerName: "Message",
            resizable: false,
            flex: 1,
            minWidth: 250,
            cellRenderer: (params: ICellRendererParams) => {
                return (
                    <div className='nz-cell-scroll'>{`${params?.data?.errString}${params?.data?.isErr ? ` (Code:${params?.data?.errCode})` : ""}`}</div>
                );
            },
            cellEditorSelector: (params) => {
                return FnCellEditorSelector(params)
            },
        }
    ];

    return (
        <div key={props.uniqueName} className='nz-actionlog-container'>
            {sessionData && <SessionContainer uniqueName={`${props.uniqueName}-session-cotainer`} showGrid={true} featureId={props.featureId} sessionData={sessionData} />}
            <div id="DiagnosticLogContainerDiv" style={{ display: 'none' }}>
                {props.showGrid && isGridReady && actionData.length ? <div className='nz-sub-header'>
                    <Label label='Action Log' uniqueName='resizeble-label' fontWeight='bold' />
                </div> : <></>}

                {actionData.length > 0 ? <div className='nz-div-actionlog-content'>
                    <BasicGrid
                        hideCopyRowIcon={true}
                        allowColumnFilter={true}
                        instanceName='infobar_action_data'
                        featureId={props.featureId}
                        isExportOnCopy={true}
                        exportFileName="Action Log"
                        rowData={actionData}
                        descRowNumber={true}
                        allowColumnResize={true}
                        rowClassRules={rowClassRules}
                        isReadOnly={true}
                        containerName="infobar_action_data"
                        columnDefs={gridColumnsForEditFrom}
                        className={"nz-infobar-actionlog"}
                        uniqueName={'info-action'}
                        showGrid={props.showGrid}
                        gridRef={gridRef}
                        featureData={props.featureData} />

                </div> : <></>}
            </div>

        </div>
    )
}
export { DiagnosticLogContainer }

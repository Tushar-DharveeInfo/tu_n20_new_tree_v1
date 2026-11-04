
import { useEffect, useRef, useState } from 'react'
import { GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import '../../allcss/sidebar//SessionContainer.css'
import { ISessionContainer } from '../../allinterface/sidebar/ISessionContainer';
import { ISessionVariable } from '../../allinterface/basic/ISessionVariable';
import { Label } from '../../basic/label/Label';
import { BasicGrid } from '../../tablegrid/BasicGrid';
import { IBasicGridColDef } from '../../allinterface/tablegrid/IBasicGrid';

const SessionContainer = (props: ISessionContainer) => {

    const [sessionData, setSessionData] = useState<ISessionVariable[]>([]);
    const gridRef = useRef<AgGridReact>(null);
    useEffect(() => {
        if (props.sessionData.length) {
            setSessionData(props.sessionData);
        }
    }, [props.sessionData]);

    const gridColumnsForEditFrom: IBasicGridColDef[] = [
        {
            field: "VariableContext",
            headerName: "Context",
            sortable: true,
            resizable: true,
            minWidth: 150,


        },
        {
            field: "VariableName",
            headerName: "Name",
            resizable: true,
            sortable: true,
            minWidth: 150,

        },
        {
            field: "SessionValue",
            headerName: "Value",
            resizable: false,
            sortable: true,
            minWidth: 250,
            flex: 1

        }
    ];


    const handleGridReady = (params: GridReadyEvent) => {
        if (params) {
            const sessionContainer = document.querySelector<HTMLElement>('.nz-sidebar .nz-session-container');
            if (sessionContainer) {
                sessionContainer.style.display = 'flex';
            }
        }
    }

    return (
        <div className='nz-session-container' key={props.uniqueName} style={{ display: 'none' }}>
            {props.showGrid && <div className='nz-sub-header'>
                <Label label='Session Variables' uniqueName='resizeble-label' />
            </div>}
            {props.showGrid && sessionData.length > 0 && <div className='nz-session-variables'>
                <BasicGrid
                    hideCopyRowIcon={false}
                    instanceName='infobar_session_data'
                    featureId={props.featureId}
                    isExportOnCopy={true}
                    allowColumnResize={true}
                    gridRef={gridRef}
                    exportFileName="Session Variables"
                    rowData={sessionData}
                    isReadOnly={true}
                    allowColumnFilter={true}
                    containerName="infobar_session_data"
                    columnDefs={gridColumnsForEditFrom}
                    className={"nz-infobar-actionlog"}
                    uniqueName={'session-variables'}
                    showGrid={true}
                    featureData={props.featureData}
                    handleGridReady={handleGridReady}
                />
            </div>}
        </div>
    )
}
export { SessionContainer }
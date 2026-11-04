
import { useRef } from 'react'
import { IBaseAdminTool } from '../../../../allinterface/iappqasettingscontainer/admintool/IBaseAdminTool';
import { BasicGrid } from '../../../../../shared/tablegrid/BasicGrid';
import { FeatureState } from '../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';

const BaseAdminTool = (baseAdminToolProps: IBaseAdminTool) => {
    const gridRef = useRef(null);
    return (
        <div className='nz-admin-container'>
            <div className="nz-admin-task-grid" >
                <BasicGrid
                    uniqueName={baseAdminToolProps.uniqueName}
                    containerName='admin-tasks'
                    gridRef={gridRef}
                    tableLabel={baseAdminToolProps.tableLabel}
                    hideCopyIcon={true}
                    rowData={baseAdminToolProps.rowData}
                    instanceName="admin-tasks"
                    columnDefs={baseAdminToolProps.columnDefs}
                    allowPagination={false}
                    rowSelection={"multiple"}
                    showGrid={true}
                    allowColumnResize={true}
                    handleMouseEvent={() => { }}
                    onSelectionChanged={() => { }}
                ></BasicGrid>

            </div>
            <div className='nz-action-div'>

                <button onClick={baseAdminToolProps.handleStart} title='Start performing pending Tasks' disabled={baseAdminToolProps.featureState !== FeatureState.Stopped} >Start</button>
                <button onClick={baseAdminToolProps.handlePause} title='Stop performing pending tasks' disabled={baseAdminToolProps.featureState !== FeatureState.Running} >Pause</button>
                <button onClick={baseAdminToolProps.handleResume} title='Resume performing pending Tasks' disabled={baseAdminToolProps.featureState !== FeatureState.Paused} >Resume</button>
                <button onClick={baseAdminToolProps.handleStop} title='Cancel all pending Tasks' disabled={baseAdminToolProps.featureState === FeatureState.Stopped} >Stop</button>
            </div>
        </div>
    )
}

export { BaseAdminTool }
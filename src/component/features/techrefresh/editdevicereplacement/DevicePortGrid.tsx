import { Label } from "../../../shared/basic/label/Label";
import { IBasicGridColDef } from "../../../shared/allinterface/tablegrid/IBasicGrid";
import { BasicGrid } from "../../../shared/tablegrid/BasicGrid"
import { IDevicePortGrid } from "../../allinterface/techrefresh/IEditDeviceReplacement"

const DevicePortGrid = (devicePortGridProps: IDevicePortGrid) => {
    return (
        <div key={devicePortGridProps.uniqueName} className="nz-h-auto nz-edit-device-replacement-port-grid">
            {devicePortGridProps.allowHeader &&
                <div className='nz-sub-header  nz-d-flex-row nz-align-center'>
                    <Label uniqueName={`${devicePortGridProps.uniqueName}-header`} label={devicePortGridProps.headerText} />
                </div>}
            <BasicGrid
                uniqueName={`${devicePortGridProps.uniqueName}-grid`}
                instanceName={devicePortGridProps.instanceName}
                showGrid={true}
                rowNumber={true}
                hideCopyIcon={true}
                allowAutoSizeColumn={true}
                rowData={devicePortGridProps.rowData}
                containerName={devicePortGridProps.portType}
                columnDefs={devicePortGridProps.columnDefs as IBasicGridColDef[]}
                onFirstDataRendered={devicePortGridProps.onFirstDataRendered}
                onRowDataUpdated={devicePortGridProps.onRowDataUpdated}
            />
        </div>
    )
}

export { DevicePortGrid }
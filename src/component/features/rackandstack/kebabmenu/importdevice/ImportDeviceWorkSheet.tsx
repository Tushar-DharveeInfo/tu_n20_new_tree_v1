
import { Upload24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../../../appcontainer/allcommon/FnGetCssVariable'
import { Label } from '../../../../shared/basic/label/Label'
import { ActionImage } from '../../../../shared/basic/actionimage/ActionImage'
import { IImportDeviceWorkSheet } from '../../../allinterface/rackandstack/kebabmenu/IImportDeviceWorkSheet'

const ImportDeviceWorkSheet = (props: IImportDeviceWorkSheet) => {
    return (
        <div>
            <div className="nz-import-header">
                <div className='nz-sub-header'>
                    <Label uniqueName={`${props.uniqueName}-header`}
                        label={props.headerText || ""}
                        fontWeight='bold' />
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
                            tooltip: "Import File"
                        }}
                        disabled={props.disabled}
                        uniqueName="import"
                        w='var(--node_height)'
                        h='var(--node_height)'
                        actionCode="import"
                        handleMouse={(event: any, actionCode: any) => props.handleMouse(event, actionCode)}
                    />
                </div>
            </div>
        </div>
    )
}
export { ImportDeviceWorkSheet }

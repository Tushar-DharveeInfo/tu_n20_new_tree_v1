
import { useEffect, useState } from 'react'
import '../../../../../allcss/appqaentitiescontainer/device/DialogGridContainer.css'
import { Close24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../../../../../appcontainer/allcommon/FnGetCssVariable'
import { IImage } from '../../../../../../shared/allinterface/basic/IImage'
import { IDialogGridContainer } from '../../../../../allinterface/iappqaentitiescontainer/device/IDialogGridContainer'
import { Label } from '../../../../../../shared/basic/label/Label'
import { ActionImage } from '../../../../../../shared/basic/actionimage/ActionImage'
import { SettingsLibForm } from '../../../../../../shared/settingsform/settingslibform/SettingsLibForm'
import { IControl } from '../../../../../../shared/allinterface/settingsform/ISettingsLibForm'
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from '../../../../../../shared/allcommon/basic/FnHandleContainerKeyDown'

const DialogGridContainer = (dialogContainerProps: IDialogGridContainer) => {
    const [dialogWidth, setDialogWidth] = useState(0);
    const [dialogHeight, setDialogHeight] = useState(0);
    const [dialogLeft, setDialogLeft] = useState(0);
    const [dialogTop, setDialogTop] = useState(0);
    const [columnDefs, setColumnDefs] = useState<Record<string, any>[]>([]);
    const [rowData, setRowData] = useState<IControl[]>([]);


    const imageObjClose: IImage = {
        uniqueName: `${dialogContainerProps.uniqueName}-image-close`,
        source: <Close24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: "var(--image-size-2)",
        h: "var(--image-size-2)"
    }

    useEffect(() => {
        if (dialogContainerProps.showDialog && dialogContainerProps.containerClass) {
            const element: HTMLDivElement | null = document.querySelector(`.${dialogContainerProps.containerClass}`);
            if (element) {

                const position: DOMRect = element.getBoundingClientRect();
                setDialogWidth(position.width);
                setDialogLeft(position.left);  // ← precise alignment
                setDialogTop(position.top + 10);

                setDialogHeight(position.height);
            }
        }
    }, [dialogContainerProps.showDialog, dialogContainerProps.containerClass])

    useEffect(() => {
        if (dialogContainerProps.rowData) {
            if (rowData.length === 0 && columnDefs.length === 0) {
                setRowData(dialogContainerProps.rowData)
            }
        }
    }, [dialogContainerProps.rowData])

    const closeDialog = (event: Record<string, any>, actionCode?: string, payload?: Record<string, any>) => {
        dialogContainerProps.handleDialogAction(event, actionCode)
        setColumnDefs([])
        setRowData([])
    }

    return (
        <>
            {dialogContainerProps.showDialog && dialogWidth && dialogHeight && (
                <div className="nz-custom-dialog-overlay nz-dialog-grid-container">
                    <div
                        className="nz-custom-dialog"
                        style={{
                            left: `${dialogLeft}px`,
                            top: `${dialogTop}px`,
                            width: `${dialogWidth}px`,
                            minHeight: '300px',
                            maxHeight: 'calc(100vh - 60px)', // leave some space from bottom
                            height: 'auto',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div className="nz-custom-dialog-header nz-sub-header">
                            <Label
                                uniqueName={`${dialogContainerProps.uniqueName}-dialog-header`}
                                label={dialogContainerProps.headerText}
                            />
                            <ActionImage
                                uniqueName={`${dialogContainerProps.uniqueName}-close`}
                                image={imageObjClose}
                                w='var(--node_height)'
                                h='var(--node_height)'
                                actionCode={'close'}
                                handleMouse={closeDialog}
                            />
                        </div>

                        <div
                            className="nz-custom-dialog-content nz-dialog-grid-content editor"
                            style={{ maxWidth: '100%', width: '100%' }}
                            onKeyDownCapture={handleFormControlsKeyDown}
                            onKeyDown={handleFormControlsBubbleKeyDown}
                        >
                            <SettingsLibForm
                                uniqueName={`${dialogContainerProps.uniqueName}-popup-grid`}
                                controls={rowData}
                                profileString={''}
                                allowShowHeader={false}
                                isDisableForm={false}
                                isAutoSave={false}
                                handleSaveForm={dialogContainerProps.handleSaveForm}
                            />
                        </div>


                    </div>
                </div>
            )}

        </>

    )
}
export { DialogGridContainer }
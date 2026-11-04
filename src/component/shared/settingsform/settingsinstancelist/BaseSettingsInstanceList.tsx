
import React from 'react'
import { Cross, Edit24x24, Plus, Preflight24x24, TestAPI24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable.ts';
import { IImage } from '../../allinterface/basic/IImage.ts';
import { IActionLabelStrip } from '../../allinterface/basic/IActionLabelStrip.ts';
import { IBaseSettingsInstanceList } from '../../allinterface/settingsform/IBaseSettingsInstanceList.ts';
import { ActionLabelStrip } from '../../basic/actionlabelstrip/ActionLabelStrip.tsx';
import { ActionImage } from '../../basic/actionimage/ActionImage.tsx';



const BaseSettingsInstanceList = (baseSettingsInstanceListProps: IBaseSettingsInstanceList) => {
    // --- Images ---
    const addImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-iadd`,
        source: <Plus
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        type: "svg",
        w: 'var(--image-size-2)',
        tooltip: "Click to Add"
    }
    const editImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-iedit`,
        source: <Edit24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Edit"
    }
    const deleteImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-idelete`,
        source: <Cross
            size={FnGetCssVariable('--image-size-2')}
            fill='red' />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Delete"
    }
    const testApiImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-itestapi`,
        source: <TestAPI24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Test selected API"
    }
    const preflightImage: IImage = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-ipreflight`,
        source: <Preflight24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Preflight all"
    }

    const actionLabelStrip: IActionLabelStrip = {
        uniqueName: `${baseSettingsInstanceListProps.uniqueName}-als`,
        actionLabels: baseSettingsInstanceListProps.actionLabels,
        h: '100%',
        border: 'none',
        isVertical: true,
        handleMouse: baseSettingsInstanceListProps.handleSelectListItem,
        w: '100%',
        tabIndex: -1,
    }

    const actions: { allow: boolean; image: IImage; code: string; disabled?: boolean }[] = [
        { allow: baseSettingsInstanceListProps.allowAdd, image: addImage, code: 'add', disabled: baseSettingsInstanceListProps.disableAdd },
        { allow: baseSettingsInstanceListProps.showEditButton, image: editImage, code: 'edit', disabled: baseSettingsInstanceListProps.disableEdit },
        { allow: baseSettingsInstanceListProps.allowDelete, image: deleteImage, code: 'delete', disabled: baseSettingsInstanceListProps.disableDelete },
        { allow: baseSettingsInstanceListProps.allowTestApi, image: testApiImage, code: 'testapi', disabled: baseSettingsInstanceListProps.disableTestApi },
        { allow: baseSettingsInstanceListProps.allowPreflight, image: preflightImage, code: 'preflightall', disabled: false },
    ];

    return (
        <>
            <div className='nz-list-data'>
                <ActionLabelStrip {...actionLabelStrip} isAddMode={baseSettingsInstanceListProps.isAddMode} />
            </div>

            {actions.some(a => a.allow) && (
                <div className='nz-action-panel'>
                    <div className='nz-action-panel-actions'>
                        {actions.map((a, index) =>
                            a.allow && (
                                <div
                                    key={a.code}
                                    tabIndex={-1}
                                    data-action-code={a.code}
                                    style={{ display: "inline-block" }}
                                >
                                    <ActionImage
                                        image={a.image}
                                        w={'var(--node_height)'}
                                        h={'var(--node_height)'}
                                        uniqueName={`${baseSettingsInstanceListProps.uniqueName}-ai${a.code}`}
                                        actionCode={a.code}
                                        disabled={a.disabled}
                                        handleMouse={baseSettingsInstanceListProps.handleMouseClick}
                                    />
                                </div>
                            )
                        )}
                    </div>

                    {baseSettingsInstanceListProps.recordLabel ? <div className='nz-action-panel-count'>
                        {baseSettingsInstanceListProps.recordLabel}
                    </div> : <></>}
                </div>
            )}
        </>
    )
}

export { BaseSettingsInstanceList }

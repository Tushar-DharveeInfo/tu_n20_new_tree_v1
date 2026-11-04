
import React, { useEffect, useState } from 'react'
import '../../allcss/basic/CheckedListPanel.css'
import { Check, Cross, Edit24x24, Plus } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { IImage } from '../../allinterface/basic/IImage';
import { ICheckedListPanel, IListItem } from '../../allinterface/basic/ICheckedListPanel';
import { Label } from '../label/Label';
import { ActionImage } from '../actionimage/ActionImage';
import { IChangeMeta, YesNoControl } from '@n20a/libform';

const CheckedListPanel = (checkedListPanelProps: ICheckedListPanel) => {
    const [listItems, setListItems] = useState<IListItem[]>([]);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    useEffect(() => {
        if (checkedListPanelProps.listItems && checkedListPanelProps.listItems.length > 0) {
            setListItems(checkedListPanelProps.listItems);
        }
        else {
            setListItems([]);
        }
    }, [checkedListPanelProps.listItems])

    const handleValueChange = (
        value: string,
        name: string,
        isDefault?: boolean | undefined
    ) => {

        if (
            checkedListPanelProps.allowCustomCheckLogic &&
            checkedListPanelProps.allowCheckbox &&
            checkedListPanelProps.handleCustomCheck
        ) {

            checkedListPanelProps.handleCustomCheck(
                value,
                name,
                isDefault
            );
        }
        else {
            if (!isDefault) {

                let allowCheck = true;

                if (checkedListPanelProps.handleUpdatedData) {

                    const response =
                        checkedListPanelProps.handleUpdatedData(
                            listItems,
                            {
                                name,
                                value
                            }
                        );

                    if (typeof response === "boolean") {
                        allowCheck = response;
                    }
                }

                if (allowCheck) {

                    for (
                        let index = 0;
                        index < listItems.length;
                        index++
                    ) {

                        const element = listItems[index];

                        if (element.id === name) {

                            element.checked = !element.checked;
                        }
                        else {

                            if (
                                !checkedListPanelProps.allowMulticheck
                            ) {
                                element.checked = false;
                            }
                        }
                    }

                    setListItems([...listItems]);
                }
            }
        }
    }
    const handleSelectItem = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, item: IListItem) => {
        if (!checkedListPanelProps.allowCustomCheckLogic) {
            for (let index = 0; index < listItems.length; index++) {
                const element = listItems[index];
                if (element.id === item.id) {
                    if (!checkedListPanelProps.isNotAllowSelectionWithCheckList) {
                        element.checked = true;
                        element.disableCheck = checkedListPanelProps.isNotAllowSelectionUnCheck
                    }
                    element.selected = true;
                }
                else {
                    if (!checkedListPanelProps.allowMulticheck) {
                        element.checked = false;
                    }
                    element.selected = false;
                    element.disableCheck = false
                }
            }
            setListItems([...listItems]);
            checkedListPanelProps.handleItemSelect?.(item, listItems);
        }
        else {
            checkedListPanelProps.handleItemSelect?.(item, listItems);
        }
    }

    const addImage: IImage = {
        uniqueName: `${checkedListPanelProps.uniqueName}-iadd`,
        source: <Plus
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        type: "svg",
        w: 'var(--image-size-2)',
        tooltip: "Click to Add"
    }
    const editImage: IImage = {
        uniqueName: `${checkedListPanelProps.uniqueName}-iedit`,
        source: <Edit24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Edit"
    }
    const deleteImage: IImage = {
        uniqueName: `${checkedListPanelProps.uniqueName}-idelete`,
        source: <Cross
            size={FnGetCssVariable('--image-size-2')}
            fill='red' />,
        w: 'var(--image-size-2)',
        type: "svg",
        tooltip: "Click to Delete"
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement> | any) => {
        if (!listItems.length) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => {
                const next = (Number(prev) + 1) % listItems.length;
                return next;
            });
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => {
                const next = (Number(prev) - 1 + listItems.length) % listItems.length;
                return next;
            });
        } else if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            if (Number(activeIndex) >= 0) {
                handleSelectItem(event, listItems[Number(activeIndex)])
            }
        }
    };
    return (
        <>
            <div key={checkedListPanelProps.uniqueName} className={`nz-checked-list-panel-container`}>
                {checkedListPanelProps.allowHeader &&
                    <div className='nz-sub-header'>
                        <Label uniqueName={`${checkedListPanelProps.uniqueName}-header`}
                            label={checkedListPanelProps.headerText || ""}
                        />
                    </div>
                }
                {listItems && listItems.length > 0 &&
                    <div className={`nz-list-item-container`} onKeyDown={handleKeyDown} >
                        {listItems.map((item: IListItem, index: number) => {

                            return (
                                <div key={`${item.id}`} title={item.description} className={`nz-checked-list-item${item.selected ? " nz-selected" : ""}${item.disabled ? " nz-disabled" : ""}`}
                                    style={{ background: index === activeIndex ? "var(--bg-color-qamenu)" : "" }}
                                >
                                    {checkedListPanelProps.allowCheckbox &&
                                        <YesNoControl
                                            name={`${item.id}`}
                                            label=''
                                            disabled={item.disableCheck}
                                            value={item.checked ? true : false}
                                            onChange={(value: boolean, meta: IChangeMeta) => {
                                                handleValueChange(String(value), item.id)
                                            }}
                                        />
                                    }
                                    <div className='nz-checked-list-item-label' onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleSelectItem(event, item)}>

                                        <Label
                                            uniqueName={`${item.id}`}
                                            label={item.label}
                                        />
                                        {checkedListPanelProps.allowRightIcon && item.isAuthorized !== undefined &&
                                            <ActionImage
                                                image={{
                                                    uniqueName: `${item.label}-${index}-status`,
                                                    source: item.isAuthorized ? <Check
                                                        size={FnGetCssVariable('--image-size-1')}
                                                        fill='none' /> : <></>,
                                                    w: 'var(--image-size-1)',
                                                    tooltip: item.isAuthorized ? "Authorized" : "Not Authorized",
                                                    type: 'svg'
                                                }}
                                                w={'var(--node_height)'}
                                                h={'var(--node_height)'}
                                                uniqueName={`${checkedListPanelProps.uniqueName}-aiadd`}
                                                actionCode={item.isAuthorized ? "Authorized" : "Not Authorized"}
                                                payload={item}
                                                handleMouse={(event: any, actionCode?: string, payload?: any) => {
                                                    checkedListPanelProps.handleClickisAuthorized && checkedListPanelProps.handleClickisAuthorized(event, actionCode, payload);
                                                }}
                                            />
                                        }

                                    </div>
                                </div>
                            )
                        })
                        }
                    </div>
                }
                {(checkedListPanelProps.allowAdd || checkedListPanelProps.allowDelete || checkedListPanelProps.allowEdit) && checkedListPanelProps.handleMouseClick &&
                    <div className='nz-action-panel' tabIndex={-1}>
                        {checkedListPanelProps.allowAdd &&
                            <ActionImage image={addImage} w={'var(--node_height)'} h={'var(--node_height)'}
                                uniqueName={`${checkedListPanelProps.uniqueName}-aiadd`}
                                actionCode={'add'}
                                disabled={checkedListPanelProps.disableAdd || false}
                                handleMouse={checkedListPanelProps.handleMouseClick} />
                        }
                        {checkedListPanelProps.allowEdit &&
                            <ActionImage image={editImage} w={'var(--node_height)'} h={'var(--node_height)'}
                                uniqueName={`${checkedListPanelProps.uniqueName}-aiedit`}
                                actionCode={'edit'}
                                disabled={checkedListPanelProps.disableEdit || false}
                                handleMouse={checkedListPanelProps.handleMouseClick} />
                        }
                        {checkedListPanelProps.allowDelete &&
                            <ActionImage image={deleteImage} w={'var(--node_height)'} h={'var(--node_height)'}
                                uniqueName={`${checkedListPanelProps.uniqueName}-aidelete`}
                                actionCode={'delete'}
                                disabled={checkedListPanelProps.disableDelete || false}
                                handleMouse={checkedListPanelProps.handleMouseClick} />
                        }
                    </div>
                }
            </div>
        </>
    )
}
export { CheckedListPanel }
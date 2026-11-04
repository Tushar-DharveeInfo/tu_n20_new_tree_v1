import { Close24x24, Site24x24 } from '@n20a/libicon'
import React, { KeyboardEvent, useState } from 'react'
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { CardLayout } from '../../cardlayout/CardLayout'
import { ICardLayoutField } from '../../allinterface/cardlayout/ICardLayout'
import {
    IDciRecord,
    IDciSessionFindPayload,
    IDciToSiteNode,
    IShowDatacenterInterconnect,
} from '../../allinterface/IShowDatacenterInterconnect'
import { Label } from '../../basic/label/Label'
import '../../../features/allcss/cabling/kebabmenu/ShowDatacenterInterconnect.css'
import { Button } from '@mui/material'
import { ActionImage } from '../../basic/actionimage/ActionImage'
import { FnBuildUrlForFind } from '../../allcommon/FnBuildSessionPayloadForFind'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks'

const DETAIL_FONT_SIZE = '10px';

/*Returns true when value is a plain object (not null or array). */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

/*Maps DCI to-site node fields into session Find payload keys. */
const transformDciToSiteData = (data: IDciToSiteNode): IDciSessionFindPayload => ({
    _Site: data.SiteName,
    SiteID: data.SiteID,
    _Room: data.RoomName,
    RoomID: data.RoomID,
    _Floor: data.FloorName,
    FloorID: data.FloorID,
    _Location: data.LocationName,
    LocationID: data.LocationID,
    _Device: data.DeviceName,
    DeviceID: data.DeviceID,
});

/*Builds CardLayout name/value rows from a DCI record. */
const buildDciCardFields = (
    item: IDciRecord,
    uniqueName: string,
    index: number
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: '',
            Value: item.Name ?? '',
            Header: 1,
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-name${index}`}
                    label={item.Name ?? ''}
                    fontWeight="bold"
                />
            ),
        },
        {
            Name: 'Dci to SiteName',
            Value: item.DCIToSiteNode?.SiteName ?? '',
            ValueContent: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label="Dci to SiteName : "
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label={item.DCIToSiteNode?.SiteName ?? ''}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                </div>
            ),
        },
    ];

    if (item.DCIToSiteNode?.RoomName) {
        fields.push({
            Name: 'Dci to RoomName',
            Value: item.DCIToSiteNode.RoomName,
            ValueContent: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label="Dci to RoomName : "
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label={item.DCIToSiteNode.RoomName}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                </div>
            ),
        });
    }

    if (item.DCIToSiteNode?.FloorName) {
        fields.push({
            Name: 'Dci to FloorName',
            Value: item.DCIToSiteNode.FloorName,
            ValueContent: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label="Dci to FloorName : "
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label={item.DCIToSiteNode.FloorName}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                </div>
            ),
        });
    }

    if (item.DCIToSiteNode?.DeviceName) {
        fields.push({
            Name: 'Dci to DeviceName',
            Value: item.DCIToSiteNode.DeviceName,
            ValueContent: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label="Dci to DeviceName : "
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-desc${index}`}
                        label={item.DCIToSiteNode.DeviceName}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                </div>
            ),
        });
    }

    return fields;
};

/*Popup to pick a DCI and redirect to cabling feature at the to-site device. */
const ShowDatacenterInterconnect = (props: IShowDatacenterInterconnect) => {
    const [showSaveButton, setShowSaveButton] = useState(false);
    const [selectedDci, setSelectedDci] = useState<IDciRecord>();
    const statusbarContext = useStatusBarContext();

    /*Selects a DCI card and enables the Redirect button. */
    function handleNodeMenuOnClick(event: React.MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, data: unknown) {
        try {
            if (!isRecord(data)) {
                console.error('ShowDatacenterInterconnect: invalid DCI card data');
                return;
            }
            setSelectedDci(data as IDciRecord);
            setShowSaveButton(true);
        } catch (error) {
            console.error('ShowDatacenterInterconnect: failed to select DCI', error);
        }
    }

    /*Creates a session with to-site context and opens cabling feature in a new tab. */
    const handleRedirectButton = () => {
        try {
            if (!selectedDci) {
                return;
            }

            const selectedDCI = props.dciRecords.find((item) => item.Name === selectedDci.Name);
            if (!selectedDCI) {
                console.error('ShowDatacenterInterconnect: DCI not found');
                return;
            }

            if (!selectedDCI.DCIToSiteNode) {
                console.error('ShowDatacenterInterconnect: DCI to site not found');
                return;
            }

            const dciToSiteNode = transformDciToSiteData(selectedDCI.DCIToSiteNode);
            let name = '';
            if (dciToSiteNode._Device) {
                name = dciToSiteNode._Device;
            }

            const sessionId = statusbarContext.userSessionId;
            if (!sessionId) {
                console.error('ShowDatacenterInterconnect: user session not found');
                return;
            }
            const hierarchyUrl = FnBuildUrlForFind([dciToSiteNode]);


            const url = `${window.location.origin}/feature/${props.featureId}?isnew=true&id=${sessionId}&eqid=${name ?? ''}${hierarchyUrl}`;

            //  safer open
            const newTab = window.open(url, "_blank");

            if (!newTab) {
                console.error("Popup blocked");
            }
        } catch (error) {
            console.error('ShowDatacenterInterconnect: handleRedirectButton failed', error);
        }
    };

    return (
        <div className='nz-dci-popup-container'>
            <div className="nz-sub-header">
                <span className="nz-dialog-title">Select Datacenter Interconnect </span>
                <ActionImage
                    handleMouse={() => {
                        setShowSaveButton(false);
                        setSelectedDci(undefined);
                        props.handleClose();
                    }}
                    image={{
                        uniqueName: props.uniqueName + 'cancel',
                        source: <Close24x24 size={FnGetCssVariable('--image-size-2')}
                            fill="none"
                            strokeWidth={1} />,
                        type: "svg",
                        w: "var(--image-size-2)",
                        h: "var(--image-size-2)",
                        tooltip: "close"
                    }}
                    uniqueName={props.uniqueName + 'cancelIcon'}
                    actionCode='cancel'
                    w='var(--node_height)'
                    h='var(--node_height)'
                />
            </div>
            <div className='nz-dci-list'>
                {
                    props.dciRecords && props.dciRecords.length > 0 ? (
                        props.dciRecords.map((item, index) => {
                            return (
                                <CardLayout
                                    key={index}
                                    ContentImage={{
                                        uniqueName: `${props.uniqueName}-reporti-${index}`,
                                        source: <Site24x24
                                            size={FnGetCssVariable('--image-size-2')}
                                            fill='none'
                                            strokeWidth={1} />,
                                        w: 'var(--image-size-2)',
                                        tooltip: "Background Task",
                                        type: "svg",
                                    }}
                                    isSelected={selectedDci && selectedDci.Name === item.Name}
                                    fields={buildDciCardFields(item, props.uniqueName, index)}
                                    data={item}
                                    uniqueName={"task" + index}
                                    featureId={props.featureId}
                                    containerName='Dci'
                                    onClick={handleNodeMenuOnClick}
                                />
                            );
                        })
                    ) : (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                            No Datacenter Interconnect records found.
                        </div>
                    )
                }
            </div>
            <div className='nz-dci-footer'>
                <Button className={`nz-set-btn ${showSaveButton === false ? 'nz-disabled ' : ''}`} onClick={() => {
                    handleRedirectButton();
                }} >
                    <Label label="Redirect" uniqueName={`${props.uniqueName}-Redirect`} />
                </Button>
            </div>
        </div >
    );
};

export default ShowDatacenterInterconnect;

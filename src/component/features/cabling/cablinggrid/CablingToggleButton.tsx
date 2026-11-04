

import '../../allcss/cabling/CablingToggleButton.css'
import { ICablingToggleButton } from '../../allinterface/cabling/ICablingToggleButton'
import { OverlayTab } from '../../../shared/basic/overlaytab/OverlayTab'
import { useState } from 'react'

const CablingToggleButton = (props: ICablingToggleButton) => {
    const [selectedTabName, setSelectedTabName] = useState<string>("");
    const tabs = [
        {
            label: props.cablingButtonObject.fromPort ? "Show From Devices" : "Hide From Devices ",
            value: "fromDevice",
            tooltip: props.cablingButtonObject.fromPort ? "Show From Ports" : "Hide From Ports"
        },
        {
            label: props.cablingButtonObject.cable ? "Show Cables" : "Hide Cables",
            value: "cable",
            tooltip: props.cablingButtonObject.cable ? "Show Cables" : "Hide Cables"
        },
        {
            label: props.cablingButtonObject.toDevicePort ? "Show To Devices" : "Hide To Devices",
            value: "toDevice",
            tooltip: props.cablingButtonObject.toDevicePort ? "Show ToDevice Ports" : "Hide ToDevice Ports"
        }
    ]
    function handleMousetabs(tab: string[]): void {
        if (tab[0].includes('From Device')) {
            props.handleMouse(!props.cablingButtonObject.fromPort, props.cablingButtonObject.cable, props.cablingButtonObject.toDevicePort)
        } else if (tab[0].includes('Cable')) {
            props.handleMouse(props.cablingButtonObject.fromPort, !props.cablingButtonObject.cable, props.cablingButtonObject.toDevicePort)
        } else if (tab[0].includes('To Device')) {
            props.handleMouse(props.cablingButtonObject.fromPort, props.cablingButtonObject.cable, !props.cablingButtonObject.toDevicePort)
        }
        setSelectedTabName(tab[0])
    }

    return (
        <div className='nz-cabling-toggle-button-container' key={props.uniqueName}>
            <OverlayTab
                uniqueName={`${props.uniqueName}-replacement-overlay`}
                tabs={tabs && tabs.map((t, index) => ({
                    uniqueName: `${props.uniqueName}-overlay-tab-${index}`,
                    label: {
                        uniqueName: `${props.uniqueName}-overlay-tab-${index}-label`,
                        label: t.label,
                        tooltip: t.tooltip
                    },
                    w: "auto",
                    h: "calc(var(--node_height) - var(--spacing-1))",
                    actionCode: t.label,
                    handleMouse: function (event: any, actionCode?: string): void {
                    }
                }))}
                allowUnSelect={false}
                selectedTabName={selectedTabName}
                tabAlignment={"horizontal"}
                headerText={props.headerText}
                // allowIcon={true}
                useContainer={false}
                handleSelectedTab={handleMousetabs}

            />

        </div>
    )
}

export { CablingToggleButton }
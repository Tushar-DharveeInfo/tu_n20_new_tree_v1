

interface ICablingToggleButton {
    uniqueName: string;
    headerText: string;
    cablingButtonObject: { fromPort: boolean, cable: boolean, toDevicePort: boolean }
    handleMouse: (fromPort: boolean, cable: boolean, toDevicePort: boolean) => void
}

export type { ICablingToggleButton }
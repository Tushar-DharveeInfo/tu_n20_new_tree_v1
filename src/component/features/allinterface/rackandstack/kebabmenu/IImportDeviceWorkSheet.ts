


interface IImportDeviceWorkSheet {
    uniqueName: string
    headerText: string //for show header
    handleMouse: (event: React.MouseEvent<HTMLDivElement>, actionCode: string) => void;
    disabled?: boolean;
}
export type { IImportDeviceWorkSheet }
import { IMenuItem } from "../../../../shared/allinterface/menu/IMainMenu";

interface IImportNetZoomEntity {
    uniqueName: string
    featureId: string
    selectedFeatureItem?: IMenuItem
}

export type { IImportNetZoomEntity }
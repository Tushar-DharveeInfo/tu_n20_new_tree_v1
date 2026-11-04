
import { IMenuItem } from "./menu/IMainMenu";

interface IAppqaSettingsContainer {
    uniqueName: string;// unique identifier for the controls
    selectedFeatureItem: IMenuItem;// selected node from exporer pane
    featureId: string;// selected feature id
}
type PayloadValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | IPayloadObject
    | PayloadValue[];

interface IPayloadObject {
    [key: string]: PayloadValue;
}


export type { IAppqaSettingsContainer, IPayloadObject, PayloadValue }
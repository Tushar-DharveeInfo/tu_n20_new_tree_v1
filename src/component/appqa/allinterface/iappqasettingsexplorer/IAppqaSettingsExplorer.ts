
import { IMenuItem } from "../../../shared/allinterface/menu/IMainMenu";

interface IAppqaSettingsExplorer {
    uniqueName: string; // Unique name for the container instance
    featureId: string; // Unique identifier for the feature being represented
    featureData: IMenuItem[]
    handleSelect: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, actionCode?: string | undefined, payload?: any) => void
}

export type { IAppqaSettingsExplorer }


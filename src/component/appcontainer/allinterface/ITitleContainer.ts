import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";

interface ITitleContainer {
    uniqueName: string;//unique identifier for the control
    handleThemeChange: (theme: unknown) => void;// handler for theme change 
    selectedAppqa?: IMenuItem;//selected appqa
    handleAppqaSelect?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any) => void;//handle appqa selected
    handleMenuSelect: (value: string | number | boolean | unknown, actionCode?: string, payload?: IMenuItem | unknown) => void;
    featureData?: IMenuItem[];
    selectedFeature: IMenuItem | null;
    isMenuOpen?: boolean;
    handleMenuMouse?: (isOpen: boolean) => void;
}
export type { ITitleContainer }
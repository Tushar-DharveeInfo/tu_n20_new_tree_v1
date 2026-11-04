
import { IAppContextWrapper } from "./allinterface/IAppContextWrapper";
import { AlertProfileProvider } from "./contextandprovider/AlertProfile";
import { ApProfileProvider } from "./contextandprovider/ApProfile";
import { ChartProfileProvider } from "./contextandprovider/ChartProfile";
import { CommonVariableProvider } from "./contextandprovider/CommonVariable";
import { DcmConsoleProvider } from "./contextandprovider/DcmConsole";
import { DragProvider } from "./contextandprovider/DragContext";
import { EditEntitiesProvider } from "./contextandprovider/EditEntities";
import { EmPgTableProvider } from "./contextandprovider/EmPgTable";
import { ExplorerTreeProvider } from "./contextandprovider/ExplorerTree";
import { HelpTipProvider } from "./contextandprovider/Helptip";
import { MainAppProvider } from "./contextandprovider/MainApp";
import { PlacementProvider } from "./contextandprovider/Placement";
import { ReportProvider } from "./contextandprovider/Report";
import { SelectedNodeProvider } from "./contextandprovider/SelectedNode";
import { SessionProvider } from "./contextandprovider/Session";
import { StatusBarProvider } from "./contextandprovider/StatusBar";

const AppContextWrapper = ({ children }: IAppContextWrapper) => {
    /*
    Ar of context providers to apply in order
    make sure the order of providers is correct based on their dependencies (if any) and
    are valid React components — not plain objects or factory functions. 
    */
    const providers = [
        MainAppProvider,
        ExplorerTreeProvider,
        SessionProvider,
        EmPgTableProvider,
        ApProfileProvider,
        HelpTipProvider,
        StatusBarProvider,
        CommonVariableProvider,
        SelectedNodeProvider,
        DcmConsoleProvider,
        ReportProvider,
        AlertProfileProvider,
        ChartProfileProvider,
        PlacementProvider,
        EditEntitiesProvider,
        DragProvider
    ];

    // Wrap the children with all providers from right to left
    const wrappedChildren = providers.reduceRight((acc, Comp) => {
        // acc: accumulated JSX element (initially the children)
        // Comp: current provider component being applied
        return <Comp>{acc}</Comp>;
    }, children); // Start with the original children

    // Return the fully wrapped component tree
    return <>{wrappedChildren}</>;
};

export { AppContextWrapper }
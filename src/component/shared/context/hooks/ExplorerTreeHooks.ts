
import { useContext } from "react";
import { ExplorerTreeContext } from "../contextandprovider/ExplorerTree";

const useExplorerTreeContext = () => {
    const context = useContext(ExplorerTreeContext);
    if (context === undefined) {
        throw new Error('useExplorerTreeContext must be used within an ExplorerTreeProvider');
    }
    return context;
};

export { useExplorerTreeContext };

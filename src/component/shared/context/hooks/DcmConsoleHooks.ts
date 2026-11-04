
import { useContext } from "react";
import { DcmConsoleContext } from "../contextandprovider/DcmConsole";

const useDcmConsoleContext = () => {
    const context = useContext(DcmConsoleContext);
    if (context === undefined) {
        throw new Error('useDcmConsoleContext must be used within a DcmConsoleProvider');
    }
    return context;
};

export { useDcmConsoleContext };

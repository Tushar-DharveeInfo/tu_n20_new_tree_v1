
import { useState, createContext, JSX, useMemo } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IDcmConsole } from "../allinterface/IDcmConsole";

const DcmConsoleContext = createContext<IDcmConsole | undefined>(undefined);

function DcmConsoleProvider({ children }: IAppContextWrapper) {
    const [dcmConsole, setDCMConsole] = useState<JSX.Element | null>();

    const contextValue: IDcmConsole = useMemo(() => ({
        dcmConsole,
        setDCMConsole
    }), [dcmConsole]);

    return (
        <DcmConsoleContext.Provider value={contextValue}>
            {children}
        </DcmConsoleContext.Provider>
    );
}
export { DcmConsoleProvider, DcmConsoleContext };

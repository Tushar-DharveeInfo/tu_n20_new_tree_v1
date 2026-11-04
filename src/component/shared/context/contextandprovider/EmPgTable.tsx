
import { createContext, useMemo, useState } from "react";
import { IEmPgTable, IEmPgItem } from "../allinterface/IEmPgTable";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";


const EmPgTableContext = createContext<IEmPgTable | undefined>(undefined);

function EmPgTableProvider({ children }: IAppContextWrapper) {
    const [EmPgTableRecords, setEmPgTableRecords] = useState<IEmPgItem[]>();

    const providers: IEmPgTable = useMemo(() => ({
        EmPgTableRecords,
        setEmPgTableRecords
    }), [EmPgTableRecords]);

    return (
        <EmPgTableContext.Provider value={providers} >
            {children}
        </EmPgTableContext.Provider>
    );
}

export { EmPgTableContext };
export { EmPgTableProvider };

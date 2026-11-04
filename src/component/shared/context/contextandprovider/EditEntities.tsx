
import { createContext, useMemo, useState } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IEditEntities } from "../allinterface/IEditEntities";


const EditEntitiesContext = createContext<IEditEntities | undefined>(undefined);

function EditEntitiesProvider({ children }: IAppContextWrapper) {

    const [hwEntityvsEqid, setHwEntityvsEqid] = useState<Record<string, any>[] | undefined>();

    const providers: IEditEntities = useMemo(() => ({
        hwEntityvsEqid,
        setHwEntityvsEqid
    }), [hwEntityvsEqid]);

    return (
        <EditEntitiesContext.Provider value={providers} >
            {children}
        </EditEntitiesContext.Provider>
    );
}

export { EditEntitiesContext };
export { EditEntitiesProvider };

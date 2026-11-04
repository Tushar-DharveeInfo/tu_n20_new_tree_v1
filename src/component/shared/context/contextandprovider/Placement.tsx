
import { createContext, useMemo, useState } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IPlacement } from "../allinterface/IPlacement";
import { IinboundLocation } from "../../allinterface/plan/IPlacementExplorer";


// Create a context with default values
const PlacementContext = createContext<IPlacement | undefined>(undefined);

function PlacementProvider({ children }: IAppContextWrapper) {
    const [lastSelectedInboundLocation, setLastSelectedInboundLocation] = useState<IinboundLocation>();
    const contextValue: IPlacement = useMemo(
        () => ({
            lastSelectedInboundLocation,
            setLastSelectedInboundLocation
        }),
        [
            lastSelectedInboundLocation,
        ]
    );
    return (
        <PlacementContext.Provider value={contextValue}>
            {children}
        </PlacementContext.Provider>
    );
}

export { PlacementContext, PlacementProvider };

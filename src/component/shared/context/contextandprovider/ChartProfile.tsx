
import { createContext, useMemo, useState } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IChartProfile } from "../allinterface/IChartProfile";
import { IChartProfileItem } from "../allinterface/IChartProfile";


const ChartProfileContext = createContext<IChartProfile | undefined>(undefined);

function ChartProfileProvider({ children }: IAppContextWrapper) {

    const [ChartProfiles, setChartProfiles] = useState<IChartProfileItem[]>([]);

    const providers: IChartProfile = useMemo(() => ({
        ChartProfiles,
        setChartProfiles
    }), [ChartProfiles]);

    return (
        <ChartProfileContext.Provider value={providers} >
            {children}
        </ChartProfileContext.Provider>
    );
}

export { ChartProfileContext };
export { ChartProfileProvider };

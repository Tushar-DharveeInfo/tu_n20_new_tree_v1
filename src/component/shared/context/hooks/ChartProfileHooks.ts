
import { useContext } from "react";
import { ChartProfileContext } from "../contextandprovider/ChartProfile";

const useChartProfileContext = () => {
    const context = useContext(ChartProfileContext);
    if (context === undefined) {
        throw new Error('useChartProfileContext must be used within a ChartProfileProvider');
    }
    return context;
};

export { useChartProfileContext };

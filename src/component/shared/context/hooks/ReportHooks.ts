
import { useContext } from "react";
import { ReportContext } from "../contextandprovider/Report";

const useReportContext = () => {
    const context = useContext(ReportContext);
    if (context === undefined) {
        throw new Error('useReportContext must be used within a ReportProvider');
    }
    return context;
};

export { useReportContext };

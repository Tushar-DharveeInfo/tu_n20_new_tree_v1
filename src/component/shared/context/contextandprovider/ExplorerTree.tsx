import { createContext, useEffect, useMemo, useState, useContext } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IExplorerTree } from "../allinterface/IExplorerTree";
import { getMeasurementUnit } from "./CommonVariable";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { MainAppContext } from "./MainApp";

let measurementUnitForSite: string = getMeasurementUnit() ?? "USA";

const ExplorerTreeContext = createContext<IExplorerTree | undefined>(undefined);

const getMuForSite = (): string => measurementUnitForSite;
const getDateFormat = (): string => measurementUnitForSite.toLowerCase() === "europe" ? "dd/MM/yyyy" : "MM/dd/yyyy";

function ExplorerTreeProvider({ children }: IAppContextWrapper) {
    const mainAppContext = useContext(MainAppContext);
    const [floorDeviceHierarchyRecords, setFloorDeviceHierarchyRecords] = useState<Record<string, any>>({});
    const [floorDeviceHierarchyRecordsForInventory, setFloorDeviceHierarchyRecordsForInventory] = useState<Record<string, any>>({});
    const [allTenantRecords, setAllTenantRecords] = useState<Record<string, any>>({});
    const [originalTreeData, setOriginalTreeData] = useState<ITreeNode[]>([]);
    const [isRefreshed, setIsRefreshed] = useState<boolean>(false);
    const [isSiteChanged, setIsSiteChanged] = useState<boolean>(false);
    const [muForSite, setMuForSite] = useState<string>("USA");

    useEffect(() => {
        try {
            const allSitesHierarchy = mainAppContext?.allSitesHierarchyRecords;
            const dcHierarchy = allSitesHierarchy?.DCHierarchy;
            if (dcHierarchy && typeof dcHierarchy === "object") {
                let firstRecord: Record<string, unknown> | undefined;
                if ('Site' in dcHierarchy && Array.isArray((dcHierarchy as Record<string, unknown[]>).Site) && (dcHierarchy as Record<string, unknown[]>).Site.length) {
                    firstRecord = (dcHierarchy as Record<string, unknown[]>).Site[0] as Record<string, unknown>;
                } else if (Array.isArray(dcHierarchy)) {
                    firstRecord = dcHierarchy.find((row) => row && typeof row === 'object' && ((row as Record<string, unknown>).NodeType === 'Site' || (row as Record<string, unknown>).NodeType === 'site')) as Record<string, unknown> | undefined;
                }
                const measurement = firstRecord?.Measurement ?? firstRecord?.measurement;
                if (typeof measurement === "string" && measurement) {
                    measurementUnitForSite = measurement;
                    setMuForSite(measurement);
                }
            }
        } catch (error) {
            console.error("Error updating measurement unit:", error);
        }
    }, [mainAppContext?.allSitesHierarchyRecords]);

    const providers = useMemo(
        () => ({
            floorDeviceHierarchyRecords,
            setFloorDeviceHierarchyRecords,
            floorDeviceHierarchyRecordsForInventory,
            setFloorDeviceHierarchyRecordsForInventory,
            isRefreshed,
            setIsRefreshed,
            isSiteChanged,
            setIsSiteChanged,
            muForSite,
            setMuForSite,
            allTenantRecords,
            setAllTenantRecords,
            originalTreeData,
            setOriginalTreeData
        }),
        [
            floorDeviceHierarchyRecords,
            floorDeviceHierarchyRecordsForInventory,
            isRefreshed,
            muForSite,
            isSiteChanged,
            allTenantRecords,
            originalTreeData
        ]
    );

    return (
        <ExplorerTreeContext.Provider value={providers}>
            {children}
        </ExplorerTreeContext.Provider>
    );
}

export { ExplorerTreeContext, ExplorerTreeProvider, getMuForSite, getDateFormat };

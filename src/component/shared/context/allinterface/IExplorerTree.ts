import { ITreeNode } from "../../allinterface/tree/ITreeControl";

interface IExplorerTree {
    floorDeviceHierarchyRecords: Record<string, any>;
    setFloorDeviceHierarchyRecords: React.Dispatch<
        React.SetStateAction<Record<string, any>>
    >;

    floorDeviceHierarchyRecordsForInventory: Record<string, any>;
    setFloorDeviceHierarchyRecordsForInventory: React.Dispatch<
        React.SetStateAction<Record<string, any>>
    >;

    originalTreeData: ITreeNode[];
    setOriginalTreeData: React.Dispatch<React.SetStateAction<ITreeNode[]>>;

    allTenantRecords: Record<string, any>;
    setAllTenantRecords: React.Dispatch<
        React.SetStateAction<Record<string, any>>
    >;

    isRefreshed: boolean;
    setIsRefreshed: React.Dispatch<
        React.SetStateAction<boolean>>;

    isSiteChanged: boolean;
    setIsSiteChanged: React.Dispatch<
        React.SetStateAction<boolean>>;

    muForSite: string;
    setMuForSite: React.Dispatch<
        React.SetStateAction<string>>;
}

export type { IExplorerTree };

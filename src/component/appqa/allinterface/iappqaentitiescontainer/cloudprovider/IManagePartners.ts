import { IStatusBar } from "../../../../shared/context/allinterface/IStatusBar";

interface IManagePartners {
    uniqueName: string;
    statusbarContext: IStatusBar;
    entityName: string;
    selectedSubGroup: string
    relationship: 'Tenant' | 'Vendor' | 'Team' | 'Cloud Provider' | 'Tag'
}

export type { IManagePartners }
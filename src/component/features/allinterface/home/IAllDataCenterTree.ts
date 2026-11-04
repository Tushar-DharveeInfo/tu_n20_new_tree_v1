
import { Key } from "rc-tree/lib/interface";
import { CheckInfo } from "rc-tree/lib/Tree";
import { ISelectedNodeInfo } from "../../../shared/allinterface/tree/ITreeControl";
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";
import { IFeatureItem } from "../../../shared/context/allinterface/IMainApp";
import { IActionImageForSubMenu } from "../../../shared/allinterface/basic/IActionImageList";

type IGetAllTenantsApiResponse = {
    tenantJson?: string;
};

type IAllDcTreeApiData = {
    Tenants: unknown[];
};

type IAllDcFilterTreeNodeData = {
    SiteID: string;
    SiteName: string;
    RoomID: string;
    RoomName: string;
};

interface IAllDataCenterTree {
    uniqueName: string; // Unique name for the container instance
    featureId: string; // Unique identifier for the feature being represented
    featureData: IFeatureItem[];
    allowAdd?: boolean; // Enables the ability to add new items (optional)
    allowEdit?: boolean; // Enables the ability to edit existing items (optional)
    allowDelete?: boolean; // Enables the ability to delete items (optional)
    treeDataFor?: string;// used to handle conditions for drag and drop event
    handleAIClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void;
    handleNodeCheck?: (checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => void;
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[], TreeData?: ITreeNode[], isSiteByTenant?: "AllSites" | "TenantsBySite" | "SitesByTenant") => void;
    handleKebabMenuSelect?: (selectedItem: IActionImageForSubMenu) => void;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    selectDcExplorer?: (site?: string, tenant?: string, entityName?: string, entId?: string, dateFormat?: string) => void;
    handleClearNodeSelection?: () => void;
    handleShowUserMessage?: (messageText: string) => void;
}

export type {
    IAllDataCenterTree,
    IGetAllTenantsApiResponse,
    IAllDcTreeApiData,
    IAllDcFilterTreeNodeData
}

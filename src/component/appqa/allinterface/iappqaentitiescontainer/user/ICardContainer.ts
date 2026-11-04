import { ReactNode } from "react";

interface ICardContainer {
    uniqueName?: string;
    header: ReactNode;
    component: ReactNode;
    className?: string;
    allowCollapse?: boolean;
    defaultCollapsed?: boolean;
    isCollapsed?: boolean;
    isShowSidebar?: boolean;
    handleCollapseChange?: (isCollapsed: boolean) => void;
    handleSidebarOpen?: () => void;
}
export type { ICardContainer }
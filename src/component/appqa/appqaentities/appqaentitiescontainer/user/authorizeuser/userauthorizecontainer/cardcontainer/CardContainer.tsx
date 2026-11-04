
import { useEffect, useState } from "react";
import "../../../../../../allcss/appqaentitiescontainer/user/CardContainer.css";
import { ICardContainer } from "../../../../../../allinterface/iappqaentitiescontainer/user/ICardContainer";
import { ActionImage } from "../../../../../../../shared/basic/actionimage/ActionImage";
import { Down24x24, OpenSidebar24x24, Up24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../../appcontainer/allcommon/FnGetCssVariable";

const CardContainer = (cardContainerProps: ICardContainer) => {
    const uniqueName = cardContainerProps.uniqueName ?? "card-container";
    const [isCollapsed, setIsCollapsed] = useState<boolean>(cardContainerProps.defaultCollapsed ?? false);

    useEffect(() => {
        if (typeof cardContainerProps.isCollapsed === "boolean") {
            setIsCollapsed(cardContainerProps.isCollapsed);
        }
    }, [cardContainerProps.isCollapsed]);

    const handleToggleCollapse = () => {
        const nextCollapsed = !isCollapsed;

        if (typeof cardContainerProps.isCollapsed !== "boolean") {
            setIsCollapsed(nextCollapsed);
        }

        cardContainerProps.handleCollapseChange?.(nextCollapsed);
    }

    return (
        <div className={`nz-card-container ${isCollapsed ? "nz-card-container-collapsed" : ""} ${cardContainerProps.className ?? ""}`} key={uniqueName}>
            <div className="nz-card-container-header">
                <div className="nz-card-container-header-content">
                    {cardContainerProps.allowCollapse && (
                        <ActionImage uniqueName={`${cardContainerProps.uniqueName}-open-card`}
                            image={{
                                uniqueName: `${cardContainerProps.uniqueName}-open-card-image`,
                                source: isCollapsed ? <Down24x24
                                    size={FnGetCssVariable("--image-size-2")}
                                    fill="none"
                                    strokeWidth={1}
                                /> : <Up24x24
                                    size={FnGetCssVariable("--image-size-2")}
                                    fill="none"
                                    strokeWidth={1}
                                />,
                                w: "var(--image-size-1)",
                                tooltip: isCollapsed ? "Click to view details" : "Click to close",
                                type: "svg"
                            }}
                            w={"var(--node_height)"}
                            h={"var(--node_height)"}
                            actionCode={"open-card"}
                            handleMouse={function (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: Record<string, any>): void {
                                handleToggleCollapse();
                            }} />
                    )}
                    <div className="nz-card-container-header-titile-with-sidebar-open">
                        {cardContainerProps.header}

                        {cardContainerProps.isShowSidebar && !isCollapsed && < ActionImage uniqueName={`${cardContainerProps.uniqueName}-open-card`}
                            image={{
                                uniqueName: `${cardContainerProps.uniqueName}-open-card-image`,
                                source: <OpenSidebar24x24
                                    size={FnGetCssVariable("--image-size-2")}
                                    fill="none"
                                    strokeWidth={1}
                                />,
                                w: "var(--image-size-2)",
                                tooltip: "Click to view node details in sidebar",
                                type: "svg"
                            }}
                            w={"var(--node_height)"}
                            h={"var(--node_height)"}
                            actionCode={"open-card"}
                            handleMouse={function (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: Record<string, any>): void {
                                cardContainerProps.handleSidebarOpen?.();
                            }} />}

                    </div>
                </div>

            </div>

            <div className="nz-card-container-content" style={{ display: isCollapsed ? "none" : "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                {cardContainerProps.component}
            </div>
        </div>
    )
}

export { CardContainer };

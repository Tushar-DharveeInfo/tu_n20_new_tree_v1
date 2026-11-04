
import { Splitter, SplitterPanel } from "primereact/splitter"
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { FloorLayout24x24, OpenSidebar24x24, RowOfRacks24x24 } from "@n20a/libicon"
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage"
import { Label } from "../../../shared/basic/label/Label"
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks"
import DeviceViewContainer from "../../../shared/deviceview/deviceviewcontainer/DeviceViewContainer"

import { EditFloorLayout } from "../../plan/editfloorlayout/EditFloorLayout"
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable"
import type { IDeviceFloorLayoutContainer } from "../../allinterface/dc/IDeviceFloorLayoutContainer"
import { InMemoryUrlProvider } from "../../../shared/context/contextandprovider/InMemoryUrl"
import { useEffect, useState } from "react"
import { FnFindNearestNodeByType } from "../../../shared/allcommon/FnFindNearestNodeByType"
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl"
import { MountedDeviceViewContainer } from "../../../shared/deviceview/mounteddeviceviewcontainer/MountedDeviceViewContainer"
import { RowOfRacksContainer } from "../../rackandstack/rowofrackscontainer/RowOfRacksContainer";

const DeviceFloorLayoutContainer = (deviceFloorLayoutContainerProps: IDeviceFloorLayoutContainer) => {
    const [deviceNode, setDeviceNode] = useState<ITreeNode>();
    const [showRowOfRacks, setShowRowOfRacks] = useState<boolean>(false);
    const [nodeToShowRowOfRacks, setNodeToShowRowOfRacks] = useState<ITreeNode>()
    const statusBarContext = useStatusBarContext();
    const isMountedDevice = deviceFloorLayoutContainerProps.selectedNode.NodeType?.toLowerCase() === "mounteddevice";

    const FnFindRackInHierarchy = (node?: ITreeNode): ITreeNode | undefined => {
        if (!node) return undefined;

        // Current node itself is a Rack
        if (node.NodeType?.toLowerCase() === "rack") {
            return node;
        }

        // Recursively check all children
        if (node.children?.length) {
            for (const child of node.children) {
                const rackNode = FnFindRackInHierarchy(child);

                if (rackNode) {
                    return rackNode;
                }
            }
        }

        return undefined;
    };

    useEffect(() => {
        const { treeData, selectedNode } = deviceFloorLayoutContainerProps;

        if (!selectedNode || !treeData) return;

        // Handle Device Node
        if (selectedNode.NodeType?.toLowerCase() === "mounteddevice") {
            const foundDeviceNode = FnFindNearestNodeByType(
                treeData,
                selectedNode,
                "Device"
            );

            if (foundDeviceNode) {
                setDeviceNode(foundDeviceNode);
            }
        } else {
            setDeviceNode(selectedNode);
        }

        // Find nearest Location parent
        const locationNode = FnFindNearestNodeByType(
            treeData,
            selectedNode,
            "Location"
        );

        let rackNode: ITreeNode | undefined;

        if (locationNode) {
            // Check Rack anywhere under Location
            rackNode = FnFindRackInHierarchy(locationNode);
        } else if (deviceFloorLayoutContainerProps.selectedFloorNode) {
            // If parent is not Location,
            // check Rack anywhere under selectedFloorNode
            // including Location -> Rack hierarchy
            rackNode = FnFindRackInHierarchy(deviceFloorLayoutContainerProps.selectedFloorNode);
        }
        setNodeToShowRowOfRacks(rackNode);

    }, [
        deviceFloorLayoutContainerProps.selectedNode.NodeType,
        deviceFloorLayoutContainerProps.selectedNode.NodeEntID,
        deviceFloorLayoutContainerProps.selectedFloorNode.NodeEntID
    ]);

    const handleViewClick = (entID: string) => {
        deviceFloorLayoutContainerProps.selectDcExplorer?.(undefined, undefined, undefined, entID);
    }

    const handleSidebarOpen = () => {
        deviceFloorLayoutContainerProps.handleSidebarOpenClose?.("open");
    }

    const handleSwitchLayout = (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>, actionCode?: string | undefined, payload?: Record<string, any> | undefined) => {
        setShowRowOfRacks(!showRowOfRacks)
    }

    return (
        <div key={deviceFloorLayoutContainerProps.uniqueName} className="nz-wh-100 nz-d-flex-column" tabIndex={1} onKeyDown={handleContainerKeyDown}>
            {!deviceFloorLayoutContainerProps.hideHeader && (
                <div className="nz-sub-header">
                    <div className="nz-sub-header-left">
                        {nodeToShowRowOfRacks ? <ActionImage
                            uniqueName={`${deviceFloorLayoutContainerProps.uniqueName}-open-sidebar`}
                            image={{
                                uniqueName: `${deviceFloorLayoutContainerProps.uniqueName}-open-sidebar-image`,
                                source: showRowOfRacks ? <FloorLayout24x24
                                    size={FnGetCssVariable("--image-size-1")}
                                    fill="none"
                                    strokeWidth={1}
                                /> : <RowOfRacks24x24
                                    size={FnGetCssVariable("--image-size-1")}
                                    fill="none"
                                    strokeWidth={1}
                                />,
                                w: "var(--image-size-1)",
                                tooltip: showRowOfRacks ? "Click to view Floor Layout" : "Click to view Row of Racks",
                                type: "svg"
                            }}
                            w={"var(--image-size-2)"}
                            h={"var(--image-size-2)"}
                            actionCode={"open-sidebar"}
                            handleMouse={handleSwitchLayout}
                        /> : <></>}
                        <Label
                            uniqueName={`${deviceFloorLayoutContainerProps.uniqueName}-title`}
                            label={showRowOfRacks ? `Row of Racks: ${nodeToShowRowOfRacks?.Name ?? deviceFloorLayoutContainerProps.selectedNode.Name}` : `Floor Layout: ${deviceFloorLayoutContainerProps.selectedFloorNode.Name}`}
                        />
                    </div>
                    <ActionImage
                        uniqueName={`${deviceFloorLayoutContainerProps.uniqueName}-open-sidebar`}
                        image={{
                            uniqueName: `${deviceFloorLayoutContainerProps.uniqueName}-open-sidebar-image`,
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
                        actionCode={"open-sidebar"}
                        handleMouse={handleSidebarOpen}
                    />
                </div>
            )}

            {showRowOfRacks ? <RowOfRacksContainer uniqueName={`${deviceFloorLayoutContainerProps.uniqueName}-row-of-racks`}
                featureId={deviceFloorLayoutContainerProps.featureId}
                selectedNode={deviceFloorLayoutContainerProps.selectedNode}
                handleShowUserMessage={deviceFloorLayoutContainerProps.handleShowUserMessage}
            /> : <Splitter className="nz-wh-100 nz-device-floor-layout-content" style={{ flexGrow: 1, overflow: "hidden" }} tabIndex={-1}>
                <SplitterPanel size={50} minSize={25} className="nz-wh-100 nz-floor-layout-pane" tabIndex={-1}>
                    <InMemoryUrlProvider><EditFloorLayout
                        uniqueName={`${deviceFloorLayoutContainerProps.uniqueName}-edit-floor-layout`}
                        selectedFloorNode={deviceFloorLayoutContainerProps.selectedFloorNode}
                        featureId={deviceFloorLayoutContainerProps.featureId}
                        selectedNode={deviceNode}
                        mode={"canvas"}
                        handleMouse={() => {
                            deviceFloorLayoutContainerProps.handleSidebarOpenClose?.("close");
                        }}
                        selectDcExplorer={deviceFloorLayoutContainerProps.selectDcExplorer}
                        allowEdit={false}
                        statusBarContext={statusBarContext}
                    /></InMemoryUrlProvider>
                </SplitterPanel>
                <SplitterPanel size={50} minSize={25} className="nz-wh-100" tabIndex={-1}>
                    {isMountedDevice ?
                        <MountedDeviceViewContainer
                            uniqueName={`${deviceFloorLayoutContainerProps.uniqueName}-mounted-device-view`}
                            featureId={deviceFloorLayoutContainerProps.featureId}
                            selectedNode={deviceFloorLayoutContainerProps.selectedNode}
                            treeData={deviceFloorLayoutContainerProps.treeData}
                            handleViewClick={handleViewClick}
                            isShowSidebarBtn={false}
                            splitterLayout={'vertical'}
                            isSidebarOpen={deviceFloorLayoutContainerProps.isSidebarOpen}
                            handleSidebarOpenClose={deviceFloorLayoutContainerProps.handleSidebarOpenClose}
                        />
                        :
                        <DeviceViewContainer
                            uniqueName={`${deviceFloorLayoutContainerProps.uniqueName}-device-view`}
                            featureId={deviceFloorLayoutContainerProps.featureId}
                            selectedNode={deviceFloorLayoutContainerProps.selectedNode}
                            treeData={deviceFloorLayoutContainerProps.treeData}
                            viewType={"device"}
                            isShowSidebarBtn={false}
                            handleViewClick={handleViewClick}
                            isSidebarOpen={deviceFloorLayoutContainerProps.isSidebarOpen}
                            handleSidebarOpenClose={deviceFloorLayoutContainerProps.handleSidebarOpenClose}
                            handleShowUserMessage={deviceFloorLayoutContainerProps.handleShowUserMessage}
                        />
                    }
                </SplitterPanel>
            </Splitter>}
        </div>
    )
}

export { DeviceFloorLayoutContainer }

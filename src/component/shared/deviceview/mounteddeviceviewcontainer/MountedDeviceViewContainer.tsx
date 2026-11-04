
import { Suspense, useEffect, useState } from "react"
import '../../allcss/deviceview/MountedDeviceViewContainer.css'
import { IMountedDeviceViewContainer } from "../../allinterface/deviceview/IMountedDeviceViewContainer"
import { ITreeNode } from "../../allinterface/tree/ITreeControl"
import { FnFindNearestNodeByType } from "../../allcommon/FnFindNearestNodeByType";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { DeviceViewContainer } from "../../../appcontainer/layoutcontainer/LayoutContainer";
import { Loader } from "../../loader/Loader";
import ErrorBoundary from "../../errorboundary/ErrorBoundary";


const MountedDeviceViewContainer = (mountedDeviceViewContainerProps: IMountedDeviceViewContainer) => {
    const [deviceNode, setDeviceNode] = useState<ITreeNode>();
    const [mountedDeviceNode, setMountedDeviceNode] = useState<ITreeNode>();
    const [selectedEntid, setSelectedEntID] = useState<string>('')
    useEffect(() => {
        if (mountedDeviceViewContainerProps.selectedNode && mountedDeviceViewContainerProps.treeData) {
            const foundDeviceNode = FnFindNearestNodeByType(mountedDeviceViewContainerProps.treeData, mountedDeviceViewContainerProps.selectedNode, "Device");
            if (foundDeviceNode) {
                setDeviceNode(foundDeviceNode)
                setMountedDeviceNode(mountedDeviceViewContainerProps.selectedNode);
            }
        }
    }, [mountedDeviceViewContainerProps.selectedNode, mountedDeviceViewContainerProps.treeData])

    function handleSelectedTabChanges(selectedTabName: string, selectedTabData: any): void {
        if (selectedTabData.length) {
            setSelectedEntID(selectedTabData[0].uniqueName)
        } else {
            setSelectedEntID(mountedDeviceViewContainerProps.selectedNode.NodeEntID ?? "")
        }

    }

    return (
        <div key={mountedDeviceViewContainerProps.uniqueName} className="nz-wh-100 nz-d-flex-row nz-mounted-device-preview">
            <Splitter className="nz-wh-100" tabIndex={-1} layout={mountedDeviceViewContainerProps.splitterLayout}>
                <SplitterPanel tabIndex={-1} minSize={25} >
                    {deviceNode &&
                        <ErrorBoundary>
                            <Suspense fallback={<Loader />}>
                                <DeviceViewContainer
                                    uniqueName={`${mountedDeviceViewContainerProps.uniqueName}-device-preview`}
                                    featureId={mountedDeviceViewContainerProps.featureId}
                                    selectedNode={deviceNode}
                                    treeData={mountedDeviceViewContainerProps.treeData}
                                    selectedDeviceViewId={selectedEntid}
                                    viewType={"device"}
                                    isShowSidebarBtn={false}
                                    hideHeader={mountedDeviceViewContainerProps.hideHeader}
                                    handleViewClick={mountedDeviceViewContainerProps.handleViewClick}
                                />
                            </Suspense>
                        </ErrorBoundary>}
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} minSize={25} className="nz-mounted-pane">
                    {mountedDeviceNode &&
                        <ErrorBoundary>
                            <Suspense fallback={<Loader />}>
                                <DeviceViewContainer
                                    uniqueName={`${mountedDeviceViewContainerProps.uniqueName}-mounted-device-preview`}
                                    featureId={mountedDeviceViewContainerProps.featureId}
                                    selectedNode={mountedDeviceNode}
                                    treeData={mountedDeviceViewContainerProps.treeData}
                                    headerTitle="Mounted Device Preview"
                                    viewType={"mounted"}
                                    hideHeader={mountedDeviceViewContainerProps.hideHeader}
                                    isShowSidebarBtn={mountedDeviceViewContainerProps.isShowSidebarBtn ?? true}
                                    handleSelectedTabChanges={handleSelectedTabChanges}
                                    handleViewClick={mountedDeviceViewContainerProps.handleViewClick}
                                    isSidebarOpen={mountedDeviceViewContainerProps.isSidebarOpen}
                                    handleSidebarOpenClose={mountedDeviceViewContainerProps.handleSidebarOpenClose}
                                />
                            </Suspense>
                        </ErrorBoundary>
                    }
                </SplitterPanel>
            </Splitter>
        </div>
    )
}
export { MountedDeviceViewContainer }
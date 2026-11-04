import { ParentJSON } from "@n20a/libbox3d";
import { DEVICE, DEVICEMODEL } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { GenerateViewFromData } from "../../deviceview/generateviewfromdata/GenerateViewFromData";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { GenerateThreeDViewFromData } from "../../deviceview/generatethreedviewfromdata/GenerateThreeDViewFromData";

const getDeviceViewSideName = (view: any): string =>
    String(view?.ViewShortName ?? view?.DeviceViewName ?? view?.ViewName ?? "").toLowerCase();

const isRearDeviceView = (view: any): boolean => {
    const name = getDeviceViewSideName(view);
    return name.includes("rear") || name === "r";
};

const isFrontDeviceView = (view: any): boolean => {
    const name = getDeviceViewSideName(view);
    return name.includes("front") || name === "f";
};

const getDeviceViewBySide = (tabData: any[], diplayDeviceView?: string) => {
    const wantRear = (diplayDeviceView ?? "front").toLowerCase() === "rear";
    const matchedView = tabData.find((view) =>
        wantRear ? isRearDeviceView(view) : isFrontDeviceView(view)
    );

    if (matchedView) {
        return matchedView;
    }

    return wantRear ? (tabData[1] ?? tabData[0]) : tabData[0];
};

const FnGetUrlFromDeviceView = async (props: {
    selectedNode: ITreeNode, isThreeDView: boolean, isMultiple: boolean, ApiName: string, statusBarContext: IStatusBar,
    diplayDeviceView?: "front" | "rear" | string
}) => {
    try {
        let viewURL: string[] = []
        function getSvgData(deviceViewEntID: number, statusBarContext: IStatusBar): Promise<any> {
            return new Promise((resolve, reject) => {

                const handleGetSvgdata = (response: unknown) => {
                    try {
                        if (response && typeof response === "object" && "svgJson" in response) {
                            const parsed = JSON.parse((response as any).svgJson);
                            if (parsed.Parent) {
                                resolve(parsed);
                            }
                            // Resolve final transformed data
                        } else {
                            reject(new Error("Invalid SVG data response"));
                        }
                    } catch (err) {
                        reject(err);
                    }
                };

                axiosInterceptor(
                    {
                        url: DEVICE.GetSvgdata,
                        data: {
                            deviceView: deviceViewEntID,
                        },
                        setFetchData: handleGetSvgdata,
                    },
                    statusBarContext
                );
            });
        }
        function getDeviceModelViews(entID: string, statusBarContext: IStatusBar): Promise<any[]> {
            return new Promise((resolve, reject) => {
                const handleDeviceViews = (response: unknown) => {
                    try {
                        if (response && typeof response === "object" && "devicePreviewJson" in response) {
                            const parsed = JSON.parse((response as any).devicePreviewJson);

                            if (parsed?.DeviceView) {


                                resolve(parsed.DeviceView);
                                return;
                            }

                            // DeviceView does not exist
                            resolve([]);
                        } else {
                            resolve([]);
                        }
                    } catch (err) {
                        reject(err);
                    }
                };

                axiosInterceptor(
                    {
                        url: DEVICEMODEL.GetDeviceModelViews,
                        data: { deviceEntID: entID },
                        setFetchData: handleDeviceViews,
                    },
                    statusBarContext
                );
            });
        }
        const getDeviceViewFor3D = async (
            deviceViewID: string,
            statusBarContext: IStatusBar
        ): Promise<ParentJSON | null> => {
            return new Promise(async (resolve, reject) => {
                try {
                    await axiosInterceptor(
                        {
                            url: DEVICE.GetSvgdatanew,
                            data: {
                                deviceView: deviceViewID,
                                preview: true
                            },
                            setFetchData: (response: unknown) => {
                                try {
                                    if (response && typeof response === "object" && "svgJson" in response) {
                                        const data = JSON.parse((response as any).svgJson);
                                        resolve(data as ParentJSON);
                                    } else {
                                        resolve(null); // no data
                                    }
                                } catch (err) {
                                    console.error("3D parse error:", err);
                                    reject(err);
                                }
                            }
                        },
                        statusBarContext
                    );
                } catch (err) {
                    reject(err);
                }
            });
        };
        const apiCallForDeviceView = async (
            selectedNode: ITreeNode,
            isMultiple: boolean,
            statusBarContext: IStatusBar,
            is3d: boolean
        ) => {

            if (!selectedNode) return;

            if (selectedNode.NodeEntID) {

                const tabData = await getDeviceModelViews(selectedNode.NodeEntID, statusBarContext);
                if (!tabData.length) {
                    return;
                }

                if (is3d) {
                    const selectedView = getDeviceViewBySide(tabData, props.diplayDeviceView);
                    const svgData = await getDeviceViewFor3D(selectedView.DeviceViewID, statusBarContext);

                    if (svgData) {
                        const url = await GenerateThreeDViewFromData({ label: selectedNode.Name as string, ParentJSON: svgData });
                        viewURL = [url];
                    }
                } else if (isMultiple) {
                    const Svg = await Promise.all(
                        tabData.map(async (element: any) => {
                            const svgData = await getSvgData(element.DeviceViewID, statusBarContext);

                            return await GenerateViewFromData({
                                imageSource: JSON.stringify(svgData),
                                label: element.DeviceViewName,
                                uniqueName: element.DeviceViewName,
                                selectedDeviceViewId: element.DeviceViewID,
                                selectedNode: selectedNode,
                                outputFormat: "SVG",
                                selectedTabName: "",
                                tabName: ""
                            });
                        })
                    );

                    viewURL = Svg;
                } else {
                    const selectedView = getDeviceViewBySide(tabData, props.diplayDeviceView);
                    const svgData = await getSvgData(selectedView.DeviceViewID, statusBarContext);

                    const url = await GenerateViewFromData({
                        imageSource: JSON.stringify(svgData),
                        label: selectedView.DeviceViewName,
                        uniqueName: selectedView.DeviceViewName,
                        selectedDeviceViewId: selectedView.DeviceViewID,
                        selectedNode: selectedNode,
                        outputFormat: "SVG",
                        selectedTabName: selectedView.ViewShortName ?? "",
                        tabName: selectedView.ViewShortName ?? ""
                    });

                    viewURL = [url];
                }
            }
        };


        await apiCallForDeviceView(props.selectedNode, props.isMultiple, props.statusBarContext, props.isThreeDView)

        return viewURL;
    } catch (err) {
        console.error("FnGetUrlFromDeviceView error:", err);
    }
}

export { FnGetUrlFromDeviceView }
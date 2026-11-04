import React, { useEffect, useState } from 'react'
import { ViewContainer } from '../../../shared/deviceview/viewcontainer/ViewContainer'
import { DEVICE } from '../../../shared/interceptors/EndPoints';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { INavigationView } from '../../allinterface/cabling/INavigationView';
import '../../allcss/cabling/NavigationView.css'
import { IView } from '../../../shared/allinterface/deviceview/IView';


const NavigationView = (props: INavigationView) => {
    const [viewsFrom, setViewsFrom] = useState<IView[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const statusBarContext = useStatusBarContext();

    const renderViewLoading = () => (
        <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>
    )
    function transformShapeData(input: Record<string, any>): { views: IView[] } {
        return {
            views: input.Parent.map((item: any) => ({
                svg: item.SVGFile, // mapped from 'SVGFile'
                viewTitle: item._Device, // using '_Device' as a possible view title
                uniqueName: item.ShapeID,
                tab: {
                    label: props.ViewName,
                    tooltip: item._Device
                }
            }))
        };
    }

    useEffect(() => {
        if (props.DeviceViewID) {
            setIsLoading(true);
            const handleGetSvgdata = async (response: unknown, status?: string) => {
                try {
                    if (status === "200" && response && typeof response === "object" && 'svgJson' in response) {
                        const data = transformShapeData(JSON.parse(response.svgJson as string))
                        setViewsFrom([...data.views])
                    } else {
                        setViewsFrom([])
                    }
                } finally {
                    setIsLoading(false);
                }
            }
            axiosInterceptor({
                url: DEVICE.GetSvgdata,
                data: {
                    deviceView: props.DeviceViewID
                },
                setFetchData: handleGetSvgdata
            }, statusBarContext)
        } else {
            setViewsFrom([])
            setIsLoading(false);
        }

    }, [props.DeviceViewID, props.ViewName])

    return (
        <div className='nz-device-view-container nz-cabling-view'>
            <div className='nz-cabling-views-container-div'>
                <div className='nz-device-view-from'>
                    {isLoading ? renderViewLoading() : <ViewContainer
                        views={viewsFrom}
                        responsive={false}
                        selectedTabName={''}
                        featureId={props.featureId}
                        uniqueName={"deviceview"}
                        title='Device View'
                        hideTreeDView={true}
                        isEncrypted={true}
                        hideChartAndAsk={true}
                        entID={""}
                        selectedNode={props.selectedNode.node}
                        viewType={'device'}
                        SvgParentJSONForThreeD={undefined}
                        viewLabel={undefined} />}
                </div>
            </div>
        </div>
    )
}
export { NavigationView }
import '../../allcss/deviceview/ThreeDView.css'
import { IThreeDView } from '../../allinterface/deviceview/IThreeDView'
import { Label } from '../../basic/label/Label'
import { DeviceSvg3d, ParentJSON } from '@n20a/libbox3d'
import { useEffect, useState } from 'react'

const ThreeDView = (props: IThreeDView) => {
    const [boxJson, setBoxJson] = useState<ParentJSON | undefined>();

    useEffect(() => {
        setBoxJson(undefined);
        const t = setTimeout(() => {
            setBoxJson(props.ParentJSON);
        }, 50);
        let t2 = undefined
        if (props.onRendered && props.ParentJSON) {
            t2 = setTimeout(() => {
                props.onRendered && props.onRendered();
            }, 1000)
        }
        return () => {
            clearTimeout(t);
            if (t2) clearTimeout(t2);
        };
    }, [props.ParentJSON]);

    return (
        <div className='nz-device-view-3d-container'>
            <div className={`nz-devicePreview-div`}>
                <div className='nz-threed-div'>
                    {boxJson &&
                        <DeviceSvg3d boxJson={boxJson}
                            dataProp={'Temp'}
                            initialAngle={30}
                            fnSelectDcExplorer={(entId: string) => {

                                props.handleMouse && props.handleMouse(null, entId)
                            }} />}
                </div>
                <div className='nz-devicepreviw-label'>
                    <Label uniqueName="devicePreView" label={props.label} />
                </div>
            </div>
        </div>

    )
}
export { ThreeDView }
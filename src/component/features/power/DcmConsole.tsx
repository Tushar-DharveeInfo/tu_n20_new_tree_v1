
import { useCallback, useEffect, useState } from "react";
import "../allcss/power/DcmConsole.css";
import '@n20a/libdcmconsole/index.css'
import { IDcmCredentialsWithNode } from "@n20a/libdcmconsole";
import { CreateHiddenFrame } from "@n20a/libdcmconsole";
import { useCommonVariableContext } from "../../shared/context/hooks/CommonVariableHooks";
import { JsonViewer } from "../../shared/jsonviewer/JsonViewer";
import { IDcmConsole } from "../allinterface/power/IDcmConsole";
import { axiosInterceptorForPostResponse } from "../../shared/interceptors/Interceptor";
import { EXPAPI } from "../../shared/interceptors/EndPoints";
import { useMainAppContext } from "../../shared/context/hooks/MainAppHooks";
import { FnGetPrefixStringFromApProfile } from "../../shared/allcommon/settingsform/FnGetPrefixStringFromApProfile";
import { SettingSubgroups } from "../../constants/Feature";
import { FnGetExpApiUrlBasedOnEndPoint } from "../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint";
import { IServerEnvItem } from "../../shared/allinterface/IGoogleMap";
import { Label } from "../../shared/basic/label/Label";
import { ActionImage } from "../../shared/basic/actionimage/ActionImage";
import { OpenSidebar24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../appcontainer/allcommon/FnGetCssVariable";

const DcmConsole = (props: IDcmConsole) => {
    const [dcmClientProps, setDcmClientProps] = useState<IDcmCredentialsWithNode>();
    const [frameElement, setFrameElement] = useState(false);
    const [isDcmProfileFound, setIsDcmProfileFound] = useState(false);

    const commonVariableContext = useCommonVariableContext();
    const mainAppContext = useMainAppContext();

    const prefixString = FnGetPrefixStringFromApProfile(SettingSubgroups.DCM, mainAppContext.apProfileRecords)

    const loadIframe = useCallback((dcmClientPropsData: IDcmCredentialsWithNode) => {
        if (!frameElement) {
            const iframeElement = document.getElementById("dcmConsole") as HTMLIFrameElement;
            if (!iframeElement) {
                console.error("useeffect iFrame is NOT loaded");
            }
            else {
                setFrameElement(true);
            }
        }
        else {
            if (!commonVariableContext.isDcmConsoleLoaded) {
                commonVariableContext.setIsDcmConsoleLoaded(true);
            }
            const iframeElement = document.getElementById("dcmConsole") as HTMLIFrameElement;
            //we should send message with new site node etc - need DCM to enhance this
            iframeElement.contentWindow?.postMessage(JSON.stringify(dcmClientPropsData), "*");
            setTimeout(() => {
                iframeElement.style.visibility = 'visible';
            }, 1500)
            iframeElement.classList.remove('invisible');
        }
    }, [frameElement, commonVariableContext]);

    // useEffect to load frame 
    useEffect(() => {
        if (dcmClientProps) {
            loadIframe(dcmClientProps);
        }
    }, [dcmClientProps, props.selectedNode, loadIframe]);

    // useEffect to set dcm client props based on selected node 
    useEffect(() => {
        if (!props.selectedNode || !isDcmProfileFound) return
        if (props.selectedNode.DcmId) {
            setDcmClientProps((prev) => (prev ? { ...prev, entityid: props.selectedNode && props.selectedNode.DcmId } : undefined))
        }

    }, [props.selectedNode, isDcmProfileFound])

    // useEffect to call api to get env variables for DCM 
    useEffect(() => {
        axiosInterceptorForPostResponse(FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv), {
            prefixString: prefixString
        }).then(async (apiResponse: unknown) => {
            if (apiResponse && typeof apiResponse === "object" && 'response' in apiResponse) {
                const payload = apiResponse.response; // this is your parsed JSON or text
                if (payload && typeof payload === "object" && 'success' in payload && payload.success
                    && 'data' in payload && typeof payload.data === "object" && payload.data
                ) {
                    const mapData = (payload.data as IServerEnvItem[]).reduce<
                        Record<string, string>
                    >((acc, item) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});

                    if (!mapData) {
                        setDcmClientProps(undefined);
                        setIsDcmProfileFound(false)
                        return;
                    }
                    const dcmClientpayload: IDcmCredentialsWithNode = {
                        user: mapData["DCM_USER"]?.trim(),
                        psw: mapData["DCM__PSW"]?.trim(),
                        action: mapData["DCM_ACTION"]?.trim(),
                        domain: mapData["DCM_DOMAIN"]?.trim(),
                        account: mapData["DCM_ACCOUNT"]?.trim() ? Number(mapData["DCM_ACCOUNT"]?.trim()) : 0,
                        iFrameSrc: mapData["DCM_IFRAME_SRC"]?.trim(),
                        entityid: mapData["DCM_ENTITYID"]?.trim(), // trims if it's a string
                    }
                    setDcmClientProps(dcmClientpayload)
                    setIsDcmProfileFound(true)
                }
                else {
                    setDcmClientProps(undefined);
                    setIsDcmProfileFound(false)
                }
            }
            else {
                setDcmClientProps(undefined);
                setIsDcmProfileFound(false)
            }
        }).catch(error => {
            console.error(error);

            setDcmClientProps(undefined);
            setIsDcmProfileFound(false)
        });
    }, [])


    return (
        <div key={props.uniqueName} className="nz-dcm-console-container">
            <div className='nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header '>
                <div className="nz-d-flex-row nz-align-center nz-w-100">
                    <div className='nz-sub-header'>
                        <Label label={`Workorders for: ${props.selectedNode?.Name}`} uniqueName={`${props.uniqueName}-title`} />
                    </div>
                </div>
                {props.isShowSidebarBtn && <ActionImage uniqueName={`${props.uniqueName}-explorer-tree-info-ai`}
                    image={{
                        uniqueName: `${props.uniqueName}-explorer-tree-info-image`,
                        source: <OpenSidebar24x24 size={FnGetCssVariable('--image-size-2')}
                            fill="none"
                            strokeWidth={1} />,
                        w: 'var(--image-size-2)',
                        tooltip: "Click to view node details in sidebar",
                        type: "svg"

                    }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'}
                    handleMouse={() => {
                        props.handleSidebarOpenClose?.('open')
                    }} />
                }

            </div>
            <div className="nz-dcm-content">

                {dcmClientProps && dcmClientProps.iFrameSrc ? commonVariableContext.diagnosticLevel === "4" ? <JsonViewer uniqueName={`jsonviewer-for-googlemap`} jsonData={dcmClientProps} /> :
                    <CreateHiddenFrame {...dcmClientProps} /> : <></>}
            </div>
        </div>
    );
};

export { DcmConsole };

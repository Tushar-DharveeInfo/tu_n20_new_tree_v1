
import { useEffect, useState } from "react"
import '../../../../allcss/appqasettingscontainer/adminconfiguration/EnvExpApi.css'
import { IEnvApiResponse, IEnvDcmListener } from "../../../../allinterface/iappqasettingscontainer/adminconfiguration/IEnvDcmListener"
import { axiosInterceptorForPostResponse } from "../../../../../shared/interceptors/Interceptor"
import { JsonViewerControl } from "../../../../../shared/basic/jsonviewercontrol/JsonViewerControl"
import { FnGetEnvVariableByKey } from "../../../../../appcontainer/allcommon/FnGetEnvVariableByKey"
import { envVarEnums } from "../../../../../appcontainer/alldefaultprops/DefaultPropsAppContainer"

const EnvDcmListener = (envProps: IEnvDcmListener) => {
    const [envVars, setEnvVars] = useState<string>()
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>()

    useEffect(() => {
        const loadEnvironment = async () => {
            const baseUrlDcmListenerApi = FnGetEnvVariableByKey(
                envVarEnums.DCMLISTENER_API_URL
            );

            if (!baseUrlDcmListenerApi) {
                setLoading(false);
                setErrorMessage(
                    "Api url is not found to fetch data."
                );
                return;
            }

            try {
                const apiResponse =
                    await axiosInterceptorForPostResponse(
                        `${baseUrlDcmListenerApi}/getallenv`,
                        {
                            prefixString: "DEPLOYMENT_"
                        }
                    ) as IEnvApiResponse;

                if (!apiResponse) {
                    setErrorMessage("No response from server.");
                    return;
                }

                if (apiResponse.status !== 200) {
                    setErrorMessage(
                        `Server returned status ${apiResponse.status}`
                    );
                    return;
                }

                const response = apiResponse.response;

                if (!response?.success) {
                    setErrorMessage(
                        "Invalid environment response."
                    );
                    return;
                }

                const env = response.data;

                if (!Array.isArray(env) || env.length === 0) {
                    setErrorMessage(
                        "Environment configuration not found."
                    );
                    return;
                }

                setEnvVars(JSON.stringify(env));
            } catch (error) {
                console.error(
                    "Failed to fetch environment configuration:",
                    error
                );

                setErrorMessage(
                    "Failed to fetch environment configuration."
                );
            } finally {
                setLoading(false);
            }
        };

        loadEnvironment();
    }, []);

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading environment variables...</div>;
    }

    if (!envVars) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">{errorMessage ?? "Environment variables not found"}</div>;
    }
    return (
        <div key={envProps.uniqueName} className="nz-env-container">
            <JsonViewerControl
                uniqueName={envProps.uniqueName + "env-json"}
                label={""}
                isRenderAsForm={false}
                value={envVars}
                isRequired={false}
                showAsDiv={false}
                containerName={""} />
        </div>
    )
}

export default EnvDcmListener
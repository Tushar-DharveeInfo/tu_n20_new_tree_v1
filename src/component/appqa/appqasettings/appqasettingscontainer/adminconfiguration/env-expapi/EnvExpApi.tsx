
import { useEffect, useState } from "react"
import '../../../../allcss/appqasettingscontainer/adminconfiguration/EnvExpApi.css'
import { IEnvExpApi } from "../../../../allinterface/iappqasettingscontainer/adminconfiguration/IEnvExpApi"
import { EXPAPI } from "../../../../../shared/interceptors/EndPoints"
import { JsonViewerControl } from "../../../../../shared/basic/jsonviewercontrol/JsonViewerControl"
import { axiosInterceptorForPostResponse } from "../../../../../shared/interceptors/Interceptor"
import { FnGetExpApiUrlBasedOnEndPoint } from "../../../../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint"

const EnvExpApi = (envProps: IEnvExpApi) => {
    const [envVars, setEnvVars] = useState<string>()
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>()

    // Load deployment environment configuration on component mount.
    useEffect(() => {
        const loadEnvironmentConfig = async (): Promise<void> => {
            try {
                const apiResponse = await axiosInterceptorForPostResponse(
                    FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv),
                    {
                        prefixString: "DEPLOYMENT_"
                    }
                );

                if (!apiResponse) {
                    setErrorMessage("No response from server.");
                    return;
                }
                if (
                    apiResponse &&
                    typeof apiResponse === "object" &&
                    "response" in apiResponse
                ) {
                    const payload = (apiResponse as any).response;
                    const processEnv = payload.data ?
                        payload.data : [];

                    if (!Array.isArray(processEnv) || processEnv.length === 0) {
                        setErrorMessage(
                            "Environment configuration not found."
                        );
                        return;
                    }

                    setEnvVars(JSON.stringify(processEnv));
                }


            } catch (error) {
                console.error("Failed to load environment configuration:", error);

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to load environment configuration."
                );
            } finally {
                setLoading(false);
            }
        };

        loadEnvironmentConfig();
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

export default EnvExpApi
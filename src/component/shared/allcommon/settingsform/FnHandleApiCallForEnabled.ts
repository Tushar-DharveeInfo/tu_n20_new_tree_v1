
import { EXPAPI } from "../../interceptors/EndPoints";
import { SettingsIntegrationFormUniquName } from "../../alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { axiosInterceptorForPostResponse } from "../../interceptors/Interceptor";
import { IEnabledApiResult } from "../../allinterface/settingsform/ISettingsLibForm";
import { FnGetExpApiUrlBasedOnEndPoint } from "../../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint";


const FnHandleApiCallForEnabled = async (
    containerName: string,
    prefixString: string
): Promise<IEnabledApiResult | null> => {
    try {

        const handleStatusApiResponse = (
            apiResponse: unknown,
            containerName: string
        ): IEnabledApiResult | null => {
            try {

                if (
                    apiResponse &&
                    typeof apiResponse === "object" &&
                    "response" in apiResponse
                ) {
                    const payload = (apiResponse as any).response;

                    if (
                        payload &&
                        typeof payload === "object" &&
                        payload.success &&
                        payload.data
                    ) {
                        return {
                            success: true,
                            data: payload.data,
                            error: payload.error
                        };
                    }
                    else if (
                        payload &&
                        typeof payload === "object" &&
                        payload.success === false &&
                        payload.error
                    ) {
                        return {
                            success: false,
                            error: payload.error
                        };
                    }
                }

            }
            catch (error) {
                console.error('Error in handle api call for integrtion: ', error);
                return null;
            }
            return { success: false, error: { message: `No configuration found for the ${containerName} to Enable` } };
        };
        const googleMapPrefix = containerName === SettingsIntegrationFormUniquName.GoogleMap ? "GOOGLEMAP_" : undefined;
        const apiResponse = await axiosInterceptorForPostResponse(FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv), {
            prefixString: googleMapPrefix ?? prefixString
        });
        return handleStatusApiResponse(apiResponse, containerName)
    } catch (error) {
        console.error('Error in call API for integration: ', error);
        return null;
    }
}

export { FnHandleApiCallForEnabled }
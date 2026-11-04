
import { FnGetEnvVariableByKey } from "../../../appcontainer/allcommon/FnGetEnvVariableByKey";
import { envVarEnums } from "../../../appcontainer/alldefaultprops/DefaultPropsAppContainer";

const FnCheckAndUpdateBaseUrl = (profileString: string): string | null => {
    try {
        const parsedProfile = JSON.parse(profileString);

        const produrl =
            window?.location?.origin ?? "";

        const isProd = import.meta.env.PROD;


        if (Array.isArray(parsedProfile) && parsedProfile.length) {
            const element = parsedProfile[0];
            if (element.BaseURL && typeof element.BaseURL === "string" && (element.BaseURL as string).toLowerCase().startsWith("baseurlapp")) {
                element.BaseURL = JSON.stringify({
                    baseurlApp: FnGetEnvVariableByKey(envVarEnums.N20_API_URL) ?? (isProd
                        ? `${produrl}/n20api`
                        : "https://n20a.netzoom.com/n20api")
                })
                return JSON.stringify([element])
            }

        }
        return null;
    } catch (error) {
        console.error('Error in update base url:', error);
    }
    return null;
}
export { FnCheckAndUpdateBaseUrl }

import { FnGetEnvVariableByKey } from "../../../appcontainer/allcommon/FnGetEnvVariableByKey";
import { envVarEnums } from "../../../appcontainer/alldefaultprops/DefaultPropsAppContainer";

const FnGetBaseUrlFromKey = (baseURL: unknown): string => {
    if (typeof baseURL !== "string" || !baseURL.trim()) return "";

    if (baseURL.toLowerCase().startsWith("baseurlapp")) {
        return FnGetEnvVariableByKey(envVarEnums.N20_API_URL) ?? "";
    }

    try {
        const parsed = JSON.parse(baseURL);
        return parsed?.baseurlApp || parsed?.BaseURLApp || "";
    } catch (error) {
        console.error('Error in parse json from FnGetBaseUrlFromKey:', error);
        return "";
    }
}

export { FnGetBaseUrlFromKey }
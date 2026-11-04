import { envVarEnums } from "../alldefaultprops/DefaultPropsAppContainer"
import { FnGetEnvVariableByKey } from "./FnGetEnvVariableByKey"

const FnGetExpApiUrlBasedOnEndPoint = (endPoint: string) => {
    const expApiUrl = FnGetEnvVariableByKey(envVarEnums.EXPSERVER_API_URL);
    if (expApiUrl) {
        return `${expApiUrl}${endPoint}`
    }
    return `/expapi/${endPoint}`
}

export { FnGetExpApiUrlBasedOnEndPoint }
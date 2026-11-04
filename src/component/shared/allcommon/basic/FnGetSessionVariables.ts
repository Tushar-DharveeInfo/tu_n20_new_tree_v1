
import { ISession } from "../../context/allinterface/ISession";

// This function returns session variables for variableContexts and variable Name passed
const FnGetSessionVariables = (variableContexts: string[], variableName: string, sessionData?: ISession[]) => {

    if (sessionData && sessionData.length > 0) {
        return sessionData.filter((ele) => {

            // Check VariableContext for 'Location' or 'Node'
            const contextMatches = variableContexts.includes(ele.VariableContext) && ele.VariableName.includes(variableName);
            // Return only if all conditions are met
            return contextMatches;
        });
    } else {
        return null;
    }
};

export { FnGetSessionVariables }
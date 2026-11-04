
// For session table 
interface ISessionVariable {
    VariableContext: string;
    VariableName: string;
    SessionValue: string | null;
}

export type { ISessionVariable }
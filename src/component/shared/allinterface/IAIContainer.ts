
import { ITreeNode } from "./tree/ITreeControl";
import { AgentType } from "./IAiApp";
import { ISessionVariable } from "./basic/ISessionVariable";

interface IAgentConfig {
    type: AgentType;
    name: string;
    icon: string;
    apiKey?: string;
}

interface IChatResponse {
    content: string;
    error?: string;
}


interface IAIContainer {
    uniqueName: string;
    featureId: string;
    selectedAllProperties?: object;
    context?: string;
    selectedNode?: ITreeNode;
    sessionVars?: ISessionVariable[];
    answer?: string;
}

export type { IAIContainer, IAgentConfig, IChatResponse }
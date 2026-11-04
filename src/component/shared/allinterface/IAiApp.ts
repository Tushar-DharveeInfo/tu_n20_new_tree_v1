
interface IAiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: string;
}
type AgentType = 'netzoom' | 'gemini' | 'openai';

interface IAiApp {
    uniqueName: string
    Agents: { label: string, value: string, tooltip: string }[]
    Prompts?: { label: string, value: string, tooltip: string }[];
    resolvePrompt?: (str: string) => Promise<string>
    responseHandler?: (str: string) => void
    errorHandler?: (errorStr: string) => void
}
export type { IAiApp, IAiMessage, AgentType }

import { useState, useEffect } from 'react';
import { IAIContainer } from '../allinterface/IAIContainer';
import { ASK, EM, EXPAPI } from '../interceptors/EndPoints';
import { axiosInterceptor, axiosInterceptorForPostResponse } from '../interceptors/Interceptor';
import { useStatusBarContext } from '../context/hooks/StatusBarHooks';
import { FnHandleAPIResponse } from '../allcommon/basic/FnHandleAPIResponse';
import { useSessionContext } from '../context/hooks/SessionHooks';
import { FnResolveStringWithPlaceholders } from '../allcommon/sidebar/FnResolveStringWithPlaceholders';
import { ErrorBoundary, SafeAsync } from './ErrorHandling';
import { AgentType, AiMcp, IAgent } from '@n20a/libmcpclient';
import '@n20a/libmcpclient/style.css';
import { FEnums } from '../../constants/Feature';
import { useMainAppContext } from '../context/hooks/MainAppHooks';
import { FnGetPrefixStringFromApProfile } from '../allcommon/settingsform/FnGetPrefixStringFromApProfile';
import { SettingSubgroups } from '../../constants/Feature';
import { FnGetExpApiUrlBasedOnEndPoint } from '../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint';
import { IServerEnvItem } from '../allinterface/IGoogleMap';


function AIContainer(appGeminiProps: IAIContainer) {

    const [options, setOptions] = useState<IAgent[]>([]);
    const [AIProfile, setAIProfile] = useState<any>();
    const [aiKeys, setAiKeys] = useState<Record<AgentType, string>>()
    const [dataSet, setDataSet] = useState<Record<string, any>>();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();
    const prefixString = FnGetPrefixStringFromApProfile(SettingSubgroups.AIGemini, mainAppContext.apProfileRecords)

    const agents: IAgent[] = [
        {
            label: "mcp-sqlserver",
            value: "mcp-sqlserver",
            tooltip: "use MCP SQL Server agent",
        },
        {
            label: "mcp-json",
            value: "mcp-json",
            tooltip: "use MCP JSON agent",
        },
        {
            label: "gemini",
            value: "gemini",
            tooltip: "use Gemini AI",
        },
        {
            label: "openai",
            value: "openai",
            tooltip: "use OpenAI",
        }]
    const agentForFloor: IAgent[] = [{
        label: "gemini",
        value: "gemini",
        tooltip: "use Gemini AI",
    }]
    useEffect(() => {
        if (appGeminiProps.selectedNode?.NodeEntityname && appGeminiProps.selectedAllProperties) {
            axiosInterceptor({
                url: EM.GetEntityRecords,
                data: {
                    entityName: "AIProfile",
                    tableName: "_AIProfile"
                },
                allowShowLoader: true,
                setFetchData: async (response: unknown, status?: string) => {
                    if (response && typeof response === "string" && status === "200") {
                        const dataSet = FnHandleAPIResponse(response, "Dataset");
                        const aiProfiles = dataSet?._AIProfile ?? [];

                        const filteredProfiles = aiProfiles.filter(
                            (item: any) => ((appGeminiProps.selectedNode && item?.Entity?.toLowerCase().includes(appGeminiProps.selectedNode.NodeEntityname?.toLowerCase()) || appGeminiProps.selectedNode && item?.Entity?.toLowerCase().includes(appGeminiProps.selectedNode.PGClassName?.toLowerCase()) || item?.Entity === "") && item.Enabled === true)
                        );
                        setAIProfile(filteredProfiles);
                        let result = filteredProfiles.map((item: any) => ({
                            label: item._AIProfile,
                            value: item._AIProfile,
                            tooltip: item.Tooltip,
                        }));
                        result = result.sort((a: any, b: any) => a.label.localeCompare(b.label));
                        setOptions(result);
                    }
                }
            }, statusBarContext);
        }
        axiosInterceptorForPostResponse(FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv), {
            prefixString: prefixString
        }).then((apiResponse) => {

            if (!apiResponse) {

                return;
            }

            if (apiResponse.status !== 200) {

                return;
            }
            const response = apiResponse.response;

            if (!response || typeof response !== 'object' || !('success' in response) || !response?.success
                || !('data' in response)) {

                return;
            }
            const mapData = (response.data as IServerEnvItem[]).reduce<
                Record<string, string>
            >((acc, item) => {
                acc[item.key] = item.value;
                return acc;
            }, {});
            if (!mapData) {
                setAiKeys(undefined);
                return;
            }
            setAiKeys({
                'gemini': mapData["AIGEMINI__API_KEY"],
                'openai': '',
                'mcp-sqlserver': '',
                'mcp-json': ''
            })

        });
    }, [appGeminiProps.selectedNode, appGeminiProps.selectedAllProperties, sessionContext]);

    const adjustOverflow = (): void => {
        try {
            let currentScrollHeight = 0;
            let threshold = 0;

            try {
                const textAreaDiv = document.querySelector('.nz-ask-gemini-wrapper') as HTMLElement | null;
                currentScrollHeight = textAreaDiv?.scrollHeight ?? 0;
                threshold = window?.innerHeight * 0.4;
            } catch (err) {
                console.error("Scroll height calculation error:", err);
            }

            const textarea = document.querySelector<HTMLTextAreaElement>(
                "#askGeminicontainer .nz-fc-textarea-control textarea"
            );

            if (textarea) {
                try {
                    if (currentScrollHeight > threshold) {
                        textarea.classList.add("nz-gemini-overflow-scroll");
                        textarea.classList.remove("nz-gemini-overflow-hidden");
                    } else {
                        textarea.classList.add("nz-gemini-overflow-hidden");
                        textarea.classList.remove("nz-gemini-overflow-scroll");
                    }
                } catch (err) {
                    console.error("Textarea class update error:", err);
                }
            }

        } catch (error) {
            console.error("adjustOverflow error:", error);
        }
    };

    useEffect(() => {
        adjustOverflow();
        window.addEventListener("resize", adjustOverflow);

        return () => {
            window.removeEventListener("resize", adjustOverflow);
        };
    }, []);
    const resolvePrompt = async (str: string): Promise<string> => {
        const safe = new SafeAsync();

        const result = await safe.execute<string>(
            async () => {
                try {
                    if (!str) return "";

                    let template = "";

                    try {
                        if (Array.isArray(AIProfile)) {
                            AIProfile.forEach((item: any) => {
                                if (item?._AIProfile === str) {
                                    template = item?.Prompt ?? "";
                                }
                            });
                        }
                    } catch (err) {
                        console.error("AIProfile processing error:", err);
                    }

                    let resolved = "";

                    try {
                        resolved = FnResolveStringWithPlaceholders(
                            template,
                            sessionContext,
                            appGeminiProps?.selectedNode,
                            appGeminiProps?.selectedAllProperties
                        );
                    } catch (err) {
                        console.error("Placeholder resolving error:", err);
                    }

                    return resolved ?? "";
                } catch (err) {
                    console.error("resolvePrompt inner error:", err);
                    return "";
                }
            },
            (err: any) => {
                try {
                    statusBarContext?.setFetchError?.([
                        "Prompt resolving failed: " + (err?.message || err),
                    ]);
                } catch (error) {
                    console.error("Error handler failure:", error);
                }
            }
        );

        return result ?? "";
    };
    useEffect(() => {
        if (appGeminiProps.selectedNode) {
            if (appGeminiProps.selectedNode.NodeType === "Site" || appGeminiProps.selectedNode.NodeType === "Floor" || appGeminiProps.selectedNode.treetype === "Device") {
                const url = appGeminiProps.selectedNode.NodeType === "Site" ? ASK.SiteDataset :
                    appGeminiProps.selectedNode.NodeType === "Floor" ? ASK.FloorDataset :
                        ASK.DeviceDataset;
                const data = appGeminiProps.selectedNode.NodeType === "Floor" ? {
                    placement: appGeminiProps.featureId === FEnums.AssetPlacement ? true : false,
                } : {}
                axiosInterceptor({
                    url: url,
                    data: data,
                    allowShowLoader: true,
                    setFetchData: async (response: unknown, status?: string) => {

                        if (status === "200" && response && typeof response === "object" && "askJson" in response && response.askJson !== null) {
                            setDataSet(response.askJson as Record<string, any>);
                        }
                    }
                }, statusBarContext);
            }
        }
    }, [appGeminiProps.selectedNode])
    // agentChange - called when user selects a different agent
    const handleAgentChange = (agentType: string) => {
        if (import.meta.env.DEV)
            console.log('Agent changed to:', agentType);
        // Add your custom logic here
    };

    // promptChange - called when user selects a prompt from dropdown
    const handlePromptChange = (promptValue: string) => {
        if (import.meta.env.DEV)
            console.log('Prompt changed to:', promptValue);
        // Add your custom logic here
    };
    return (
        <div className='nz-ai-container nz-wh-100'>
            <ErrorBoundary boundaryName="AIContainer">
                {aiKeys && <AiMcp
                    Agents={appGeminiProps.selectedNode?.NodeType === "Floor"
                        ? agentForFloor : agents}
                    Prompts={options}
                    keys={aiKeys}
                    DataContext={JSON.stringify(dataSet)}
                    resolvePrompt={resolvePrompt}
                    responseHandler={function (str: string): void {
                        if (import.meta.env.DEV)
                            console.log("AI Response:", str);
                    }}
                    errorHandler={function (errorStr: string): void {
                        console.error("AI Error:", errorStr);
                        statusBarContext.setFetchError([errorStr]);
                    }}
                    onAgentChange={handleAgentChange}
                    onPromptChange={handlePromptChange}
                    uniqueName={appGeminiProps.selectedNode?.NodeType === "Site" ?
                        'SiteInstance' : appGeminiProps.selectedNode?.NodeType === "Floor"
                            ?
                            "FloorInstance" : "DeviceInstance"} selectedAgent={''} />}
            </ErrorBoundary>
        </div>
    );
}

export { AIContainer };

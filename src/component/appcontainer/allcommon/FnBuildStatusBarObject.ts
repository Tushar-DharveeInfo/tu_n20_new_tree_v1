
import { FEnums } from "../../constants/Feature";
import { WhatToShowInStatusBar } from "../alldefaultprops/DefaultPropsStatusBarContainer";
import { FnGetNodeTypeCountsFromNodeAsString } from "./FnGetNodeTypeCountsFromNodeAsString";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { IStatsJson } from "../allinterface/IStatusBarContainer";

function FnGetStatusBarStringBasedOnFeature(tree: ITreeNode[], featureId: string): string[] | undefined {
    try {
        if (!Array.isArray(tree) || !featureId) {
            return undefined;
        }

        if (featureId === FEnums.DCMConsole) {
            let discoverableCount = 0;

            const traverse = (nodes: ITreeNode[]) => {
                for (const node of nodes) {
                    try {
                        if (node.IntelDCMState?.toLowerCase() === "discoverable") {
                            discoverableCount++;
                        }

                        if (Array.isArray(node.children) && node.children.length > 0) {
                            traverse(node.children);
                        }
                    } catch (error) {
                        console.error("Failed to process discoverable node", error);
                    }
                }
            };

            traverse(tree);

            return discoverableCount > 0
                ? [`Discoverable: ${discoverableCount}`]
                : undefined;
        }

        if (featureId === FEnums.Discover || featureId === FEnums.Monitor) {
            let discoveredCount = 0;
            let monitoredCount = 0;

            const traverse = (nodes: ITreeNode[]) => {
                for (const node of nodes) {
                    try {
                        const nodeType = node.NodeType?.toLowerCase();
                        if (node.IntelDCMState?.toLowerCase() === "discovered" && nodeType && ["device", "mounteddevice"].includes(nodeType)) {
                            discoveredCount++;
                        }
                        else if (node.IntelDCMState?.toLowerCase() === "monitored" && nodeType && ["device", "mounteddevice"].includes(nodeType)) {
                            monitoredCount++;
                        }

                        if (Array.isArray(node.children) && node.children.length > 0) {
                            traverse(node.children);
                        }
                    } catch (error) {
                        console.error("Failed to process monitored node", error);
                    }
                }
            };

            traverse(tree);

            const parts: string[] = [];

            if (discoveredCount > 0) {
                parts.push(`Discovered: ${discoveredCount}`);
            }

            if (monitoredCount > 0 && featureId === FEnums.Monitor) {
                parts.push(`Monitored: ${monitoredCount}`);
            }

            return parts.length ? parts : undefined;
        }

        return undefined;
    } catch (error) {
        console.error("Failed to build feature status bar", error);
        return undefined;
    }
}

const FnBuildStatusBarObject = (
    level: string,
    statsJson?: string,
    selectedNode?: ITreeNode,
    parentNodeData?: ITreeNode[],
    featureId?: string,
): Record<string, string | number | undefined> | undefined => {
    try {
        let parsedStats: IStatsJson = {};

        try {
            if (statsJson) {
                const parsedJson = JSON.parse(statsJson);

                parsedStats = Array.isArray(parsedJson)
                    ? parsedJson[0] || {}
                    : {};
            }
        } catch (error) {
            console.error("Failed to parse statsJson", error);
        }

        const safeLevel =
            level && level in WhatToShowInStatusBar
                ? level
                : "Site";

        const fieldsToShow =
            (WhatToShowInStatusBar as Record<string, string[]>)[safeLevel];

        if (!Array.isArray(fieldsToShow)) {
            return undefined;
        }

        const result: Record<string, string | number | undefined> = {};
        const counters: string[] = [];

        for (const field of fieldsToShow) {
            try {
                if (!field.includes('|') && field.endsWith('s')) {
                    counters.push(field.substring(0, field.length - 1));
                    continue;
                }

                const [fieldLabel, fieldNameRaw] = field.split('|');
                const fieldName = fieldNameRaw ?? fieldLabel;

                if (!fieldLabel || !fieldName) {
                    continue;
                }

                const value =
                    parsedStats[fieldName as keyof IStatsJson];

                if (typeof value === "number") {
                    result[fieldLabel] =
                        value > 0 ? value : undefined;
                }
                else if (value === undefined || value === null) {
                    let nodeVal: unknown;

                    if (selectedNode) {
                        const nodeData =
                            selectedNode as Record<string, unknown>;

                        nodeVal =
                            level === fieldName
                                ? nodeData["Name"]
                                : nodeData[fieldName];
                    }

                    if (nodeVal) {
                        result[fieldLabel] = String(nodeVal);
                    }
                    else if (parentNodeData?.length) {
                        const filteredSession =
                            parentNodeData.find(
                                item => item.NodeType === fieldName
                            );

                        result[fieldLabel] =
                            filteredSession?.Name ?? "";
                    }
                }
                else {
                    result[fieldLabel] =
                        typeof value === "string" ||
                            typeof value === "number"
                            ? value
                            : undefined;
                }
            } catch (error) {
                console.error(`Failed to process field ${field}`, error);
            }
        }

        if (counters.length && selectedNode) {
            try {
                if (
                    featureId === FEnums.DCMConsole ||
                    featureId === FEnums.Discover ||
                    featureId === FEnums.Monitor
                ) {
                    const data =
                        FnGetStatusBarStringBasedOnFeature(
                            [selectedNode],
                            featureId
                        );

                    if (data?.length) {
                        for (const item of data) {
                            try {
                                const [label, val] =
                                    item.split(':').map(
                                        s => s.trim()
                                    );

                                if (!label) {
                                    continue;
                                }

                                result[label] =
                                    isNaN(Number(val))
                                        ? val
                                        : Number(val);
                            } catch (error) {
                                console.error("Failed to process counter", error);
                            }
                        }
                    }
                }
                else {
                    const counterString =
                        featureId === FEnums.Server
                            ? "Server"
                            : counters.join("|");

                    const countsRecord =
                        FnGetNodeTypeCountsFromNodeAsString(
                            [selectedNode],
                            counterString
                        );

                    if (
                        countsRecord &&
                        typeof countsRecord === "object" &&
                        Object.keys(countsRecord).length
                    ) {
                        Object.assign(result, countsRecord);
                    }
                }
            } catch (error) {
                console.error("Failed to process counters", error);
            }
        }

        return Object.keys(result).length
            ? result
            : undefined;
    } catch (error) {
        console.error("Failed to build status bar object", error);
        return undefined;
    }
};


export { FnBuildStatusBarObject };

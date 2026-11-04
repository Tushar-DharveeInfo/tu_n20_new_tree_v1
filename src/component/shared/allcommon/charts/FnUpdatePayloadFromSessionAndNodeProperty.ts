import { ISessionVariable } from "../../allinterface/basic/ISessionVariable";
import { ISelectedNodeProperty } from "../../context/allinterface/ISelectedNode";

const FnUpdatePayloadFromSessionAndNodeProperty = (
    payload: Record<string, any>,
    sessionList: ISessionVariable[],
    selectedNodeProps?: ISelectedNodeProperty,
    selectedAllProperties?: object
): Record<string, any> => {
    try {
        const updatedPayload: Record<string, any> = {};

        function convertToCorrectType(value: any): any {
            if (typeof value !== "string") return value;

            const trimmed = value.trim()?.toLowerCase();

            if (trimmed === "true") return true;
            if (trimmed === "false") return false;
            if (trimmed === "") return ""; // handle empty string

            if (!isNaN(Number(trimmed))) return Number(trimmed);

            return value;
        }

        function resolvePlaceholder(val: string): any {
            const isPlaceholder = /^<[^<>?]+(\?)?>$/.test(val);
            if (!isPlaceholder) return convertToCorrectType(val);

            const isOptional = val.includes("?>");
            const key = val.replace(/^<|[\?>]*>$/g, "");

            const sessionItem = sessionList.find(item => item.VariableName === key);
            const sessionValue = sessionItem?.SessionValue;

            let resolved = sessionValue;

            if (resolved === undefined && selectedNodeProps && key in selectedNodeProps) {
                resolved = selectedNodeProps[key];
            }

            if (resolved === undefined && selectedAllProperties && key in selectedAllProperties) {
                resolved = (selectedAllProperties as Record<string, any>)[key];
            }

            if (resolved !== undefined) return convertToCorrectType(resolved);

            return isOptional ? undefined : ""; // Rule 4: Omit optional if undefined
        }

        function processValue(value: any): any {
            if (Array.isArray(value)) {
                return value
                    .map(item => processValue(item))
                    .filter(item => item !== undefined); // Remove undefined optional placeholders
            } else if (value && typeof value === "object") {
                const result: Record<string, any> = {};
                for (const k in value) {
                    const processed = processValue(value[k]);
                    if (processed !== undefined) {
                        result[k] = processed;
                    }
                }
                return result;
            } else if (typeof value === "string") {
                return resolvePlaceholder(value);
            } else {
                return convertToCorrectType(value);
            }
        }

        for (const key in payload) {
            if (key === "sessionId") continue;
            const processed = processValue(payload[key]);
            if (processed !== undefined) {
                updatedPayload[key] = processed;
            }
        }

        return updatedPayload;
    } catch (error) {
        console.error("FnUpdatePayloadFromSessionAndNodeProperty error:", error);
        return {};
    }
};


export { FnUpdatePayloadFromSessionAndNodeProperty }
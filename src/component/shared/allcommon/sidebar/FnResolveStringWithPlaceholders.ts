import { ITreeNode } from "../../allinterface/tree/ITreeControl";

function FnResolveStringWithPlaceholders(input: string, sessionContext: any, selectedNode: ITreeNode | undefined, selectedNodeAllProperties: any): string {
    const originalInput = input;

    function getReplacementValue(key: string): string | undefined {
        try {
            const sessionList = Array.isArray(sessionContext?.SessionList) ? sessionContext.SessionList : [];
            const sessionItem = sessionList.find((item: any) => item.VariableName === key);
            const sessionValue = sessionItem?.SessionValue;
            const nodeValue = selectedNode?.[key];
            const nodePropertyValue = selectedNodeAllProperties?.[key];
            return sessionValue ?? nodeValue ?? nodePropertyValue;
        } catch (error) {
            console.error("FnResolveStringWithPlaceholders replacement error:", error);
            return undefined;
        }
    }

    try {
        //step 1 : Replace #key#
        input = input.replace(/#([^#]+?)#/g, (_match, key: string) => {
            const val = getReplacementValue(key);
            return val !== undefined && val !== null && val !== "" ? String(val) : `#${key}#`;
        });

        // Step 2: Replace <key> or <key?>
        input = input.replace(/<([^<>]+?)>/g, (_match, rawKey: string) => {
            const key = rawKey.replace(/\?$/, ""); // remove ? if present
            const val = getReplacementValue(key);
            return val !== undefined && val !== null && val !== "" ? String(val) : `<${rawKey}>`;
        });

        // Step 3: Replace [Label:<key>], [Label <key>], [<key>], and [Name] (new logic)
        return input.replace(/\[([^\[\]]+)\]/g, (_match, content: string) => {
            const trimmed = content.trim();

            // Match: Label:<key> or Label <key>
            const labelKeyMatch = trimmed.match(/^([^:<>\[\]]+)[\s:]+<([^<>]+)>$/);
            if (labelKeyMatch) {
                const [, label, key] = labelKeyMatch;
                const val = getReplacementValue(key);
                return val !== undefined && val !== null && val !== "" ? `${label}:${val}` : `[${content}]`;
            }

            // Match: <key>
            const angleKeyMatch = trimmed.match(/^<([^<>]+)>$/);
            if (angleKeyMatch) {
                const key = angleKeyMatch[1];
                const val = getReplacementValue(key);
                return val !== undefined && val !== null && val !== "" ? `${val}` : `[${content}]`;
            }

            // Match: [Name] style - treat 'Name' as key
            const key = trimmed;
            const val = getReplacementValue(key);
            return val !== undefined && val !== null && val !== "" ? `${val}` : `[${content}]`;
        });
    } catch (error) {
        console.error("FnResolveStringWithPlaceholders error:", error);
        return originalInput;
    }
}
export { FnResolveStringWithPlaceholders }

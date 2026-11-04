
import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";

const FnRemovePrefixFromJsonKeys = (
    jsonString: string
): string => {
    const parsedData = FnParseJsonSafely(jsonString);
    if (!Array.isArray(parsedData)) {
        return jsonString;
    }
    const updatedData = parsedData.map((item) => {
        if (!item || typeof item !== "object") {
            return item;
        }
        const updatedItem: Record<string, any> = {};
        Object.entries(item).forEach(([key, value]) => {
            const separatorIndex = key.indexOf("_");
            const updatedKey =
                separatorIndex >= 0
                    ? key.substring(separatorIndex + 1)
                    : key;
            updatedItem[updatedKey] = value;
        });
        return updatedItem;
    });
    return JSON.stringify(updatedData);
};

export { FnRemovePrefixFromJsonKeys }
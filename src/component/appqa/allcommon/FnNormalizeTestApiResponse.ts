import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";

const FnIsJsonContainerString = (value: string): boolean => {
    const trimmed = value.trim();
    return trimmed.startsWith("{") || trimmed.startsWith("[");
};

/**
 * Normalizes a Test API response for display (top level only):
 * - string starting with { or [ → parse JSON
 * - object → parse string values on keys that start with { or [
 * Does not walk nested keys/values beyond that first level.
 */
const FnNormalizeTestApiResponse = (apiResponse: unknown): unknown => {
    try {
        if (typeof apiResponse === "string") {
            if (!FnIsJsonContainerString(apiResponse)) {
                return apiResponse;
            }
            return FnParseJsonSafely(apiResponse, { fallback: apiResponse });
        }

        if (apiResponse && typeof apiResponse === "object" && !Array.isArray(apiResponse)) {
            const result: Record<string, unknown> = {
                ...(apiResponse as Record<string, unknown>)
            };

            for (const key of Object.keys(result)) {
                const value = result[key];
                if (typeof value === "string" && FnIsJsonContainerString(value)) {
                    result[key] = FnParseJsonSafely(value, { fallback: value });
                }
            }

            return result;
        }

        return apiResponse;
    } catch (error) {
        console.error(
            "Error in function(FnNormalizeTestApiResponse): ",
            error
        );
        return apiResponse;
    }
};

export { FnNormalizeTestApiResponse };

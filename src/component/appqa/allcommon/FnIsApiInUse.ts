import * as ApiConstants from "../../shared/interceptors/EndPoints";

// Check whether an API endpoint exists in any exported API group.
const FnIsApiInUse = (apiName: string, apiUsage: string | undefined): boolean => {
    if (!apiName?.trim()) {
        return false;
    }
    if (apiUsage && ["integration", "chart", "report", "task"].includes(apiUsage?.toLowerCase())) {
        return true;
    }

    const normalizedApiName = apiName.trim().replace(/^\/+/, "");

    return Object.values(ApiConstants).some((group) => {
        if (typeof group !== "object" || group === null) {
            return false;
        }

        return Object.values(group).some((endpoint) =>
            typeof endpoint === "string" &&
            endpoint.replace(/^\/+/, "") === normalizedApiName
        );
    });
};

export { FnIsApiInUse };
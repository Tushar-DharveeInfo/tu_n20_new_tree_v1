
type ITenantFilterRecord = Record<string, unknown>;

const FnFilterTenantDataWithDevices = (
    data: { Tenants: unknown[] },
    showAllSite?: boolean
) => {
    try {
        if (!data || typeof data !== "object" || !Array.isArray(data.Tenants) || !data.Tenants.length) {
            return data;
        }

        return {
            ...data,
            Tenants: data.Tenants.map((item) => {
                if (!item || typeof item !== "object") return item;

                const tenantItem = item as ITenantFilterRecord;
                const hasDevice =
                    tenantItem.TenantHasDevices === true ||
                    tenantItem.TenantHasDevices === "true";

                if (hasDevice && !showAllSite) return item;

                // Clear tenant fields only
                return {
                    ...tenantItem,
                    TenantEntID: "",
                    TenantName: "",
                    TenantDescription: "",
                    TenantEntityName: "",
                    TenantAddress: "",
                    TenantGPS: "",
                    TenantSecured: false,
                    TenantIsNZ: false,
                    TenantLastUpdated: "",
                    TenantNodeType: "",
                    TenantContact: "",
                    TenantHasDevices: false
                };
            })
        };

    } catch (error) {
        console.error("FnFilterTenantDataWithDevices error:", error);
        return data;
    }
};

export { FnFilterTenantDataWithDevices };
import { DEVICE } from "../../interceptors/EndPoints";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import { IControl } from "../../allinterface/settingsform/ISettingsLibForm";
import { IStatusBar } from "../../context/allinterface/IStatusBar";

const FnGetPartnerFilterOptions = (
    siteId: string,
    statusBarContext: IStatusBar
): Promise<Record<string, string>[]> => {

    function convertPartnersToSingleArray(data: Record<string, any>) {
        try {
            const partner = data?.Partners?.[0];

            const tenants = Array.isArray(partner?.tenant)
                ? partner.tenant.map((item: Record<string, any>) => ({
                    label: item.TenantName,
                    tenant: item.TenantName,
                    value: item.TenantID,
                    Selected: item.Selected
                }))
                : [];

            const teams = Array.isArray(partner?.team)
                ? partner.team.map((item: Record<string, any>) => ({
                    label: item.TeamName,
                    team: item.TeamName,
                    value: item.TeamID,
                    Selected: item.Selected
                }))
                : [];

            const tags = Array.isArray(partner?.tag)
                ? partner.tag.map((item: Record<string, any>) => ({
                    label: item.TagName,
                    tag: item.TagName,
                    value: item.TagID,
                    Selected: item.Selected
                }))
                : [];

            const vendors = Array.isArray(partner?.vendor)
                ? partner.vendor.map((item: Record<string, any>) => ({
                    label: item.VendorName,
                    vendor: item.VendorName,
                    value: item.VendorID,
                    Selected: item.Selected
                }))
                : [];

            return [...tenants, ...teams, ...tags, ...vendors];

        } catch (error) {
            console.error("convertPartnersToSingleArray error:", error);
            return [];
        }
    }

    return new Promise((resolve) => {
        try {
            if (!siteId || typeof siteId !== "string") {
                resolve([]);
                return;
            }

            axiosInterceptor(
                {
                    url: DEVICE.PartnerArray,
                    data: { siteID: siteId },
                    setFetchData: (_resp: any, status?: string) => {
                        try {
                            if (status === "200" && _resp?.partnerJson) {
                                try {
                                    const parsed = JSON.parse(_resp.partnerJson);

                                    if (Array.isArray(parsed?.Partners)) {
                                        const partnerData = convertPartnersToSingleArray(parsed);
                                        resolve(partnerData);
                                        return;
                                    }
                                } catch (e) {
                                    console.error("Partner parse error", e);
                                }
                            }

                            resolve([]);

                        } catch (innerError) {
                            console.error("setFetchData error:", innerError);
                            resolve([]);
                        }
                    }
                },
                statusBarContext
            );

        } catch (error) {
            console.error("FnGetPartnerFilterOptions error:", error);
            resolve([]);
        }
    });
};

const FnGetFilteredControls = (
    controls: IControl[],
    options: Record<string, any>[]
): IControl[] => {
    try {
        if (!Array.isArray(controls) || !Array.isArray(options) || !controls.length || !options.length) {
            return [];
        }

        return controls.filter(control => {
            if (!control || typeof control !== "object") return false;

            const key = typeof control.Name === "string"
                ? control.Name.toLowerCase()
                : "";

            return options.some(opt => {
                if (!opt || typeof opt !== "object") return false;

                return Object.keys(opt).some(k =>
                    typeof k === "string" && k.toLowerCase() === key
                );
            });
        });

    } catch (error) {
        console.error("FnGetFilteredControls error:", error);
        return [];
    }
};
export { FnGetPartnerFilterOptions, FnGetFilteredControls }
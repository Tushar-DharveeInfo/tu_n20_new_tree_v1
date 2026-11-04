
import { ISiteProperties } from "../context/allinterface/IMainApp";
import { IStatusBar } from "../context/allinterface/IStatusBar";
import { NODE } from "../interceptors/EndPoints";
import { axiosInterceptor } from "../interceptors/Interceptor";

type SetSitePropertiesParams = {
    siteId: string;
    statusbarContext: IStatusBar;
    setSiteProperties: (data: ISiteProperties) => void;
};

type SiteResponse = {
    propertyJson?: string;
};

const FnSetSelectedSiteProperties = ({
    siteId,
    statusbarContext,
    setSiteProperties
}: SetSitePropertiesParams): Promise<unknown> => {
    try {
        if (
            !siteId ||
            typeof siteId !== "string" ||
            !statusbarContext ||
            typeof setSiteProperties !== "function"
        ) {
            return Promise.resolve();
        }
        return axiosInterceptor(
            {
                url: NODE.GetKebabMenuData,
                data: {
                    entID: siteId,
                    entityName: "Site",
                    kebabMenuTableName: "_Site"
                },
                setFetchData: (
                    response: unknown,
                    status?: string
                ) => {
                    try {
                        if (
                            status !== "200" ||
                            !response ||
                            typeof response !== "object"
                        ) {
                            return;
                        }
                        const siteResponse = response as SiteResponse;
                        if (
                            !siteResponse.propertyJson ||
                            typeof siteResponse.propertyJson !== "string"
                        ) {
                            return;
                        }
                        const parsed = JSON.parse(
                            siteResponse.propertyJson
                        ) as Record<string, unknown>;
                        const tableData = parsed?._Site;
                        if (
                            !Array.isArray(tableData) ||
                            tableData.length === 0
                        ) {
                            return;
                        }
                        const siteData = tableData[0];
                        if (
                            siteData &&
                            typeof siteData === "object"
                        ) {
                            setSiteProperties(
                                siteData as ISiteProperties
                            );
                        }
                    } catch (error) {
                        console.error(
                            "FnSetSiteProperties: Failed to process response",
                            error
                        );
                    }
                }
            },
            statusbarContext
        );
    } catch (error) {
        console.error(
            "FnSetSiteProperties: Unexpected error",
            error
        );
        return Promise.resolve();
    }
};

export { FnSetSelectedSiteProperties }
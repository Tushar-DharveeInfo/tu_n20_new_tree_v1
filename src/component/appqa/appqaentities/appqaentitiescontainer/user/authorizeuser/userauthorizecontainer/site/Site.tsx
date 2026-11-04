import { useEffect, useRef, useState } from "react";
import { axiosInterceptor } from "../../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../../../shared/context/hooks/StatusBarHooks";
import { FnHandleAPIResponse } from "../../../../../../../shared/allcommon/basic/FnHandleAPIResponse";
import "../../../../../../allcss/appqaentitiescontainer/user/Site.css";
import { IFnCreateForensiclog } from "../../../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useMainAppContext } from "../../../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../../../shared/context/hooks/SessionHooks";
import { FnCreateForensiclog } from "../../../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { Site24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { CardLayout } from "../../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { ISiteProps, ISiteRecord } from "../../../../../../allinterface/iappqaentitiescontainer/user/ISite";
import { sortAuthorizeUserCards } from "../../../../../../allcommon/FnSortAuthorizeUserCards";
import { FnGetAddressDisplay, FnGetDisplayValue } from "../../../../../../allcommon/FnGetAddressDisplay";

const SITE_CARD_NAME_KEYS = ["_Site", "Site", "Name"];

const isSelected = (value: unknown): boolean => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
    }

    return value === 1;
}

/** Builds CardLayout name/value rows from a site record. */
const buildSiteCardFields = (
    siteName: string,
    address: string,
    description: string,
    managed: boolean,
    dateFormat: string,
    measurement: string
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "Site",
            Value: siteName || "—",
            Header: 1,
        },
    ];

    if (address) {
        fields.push({ Name: "Address", Value: address });
    }
    if (description) {
        fields.push({ Name: "Description", Value: description });
    }

    fields.push({
        Name: "Managed",
        Value: managed ? "✓" : "X",
        Group: "details-row",
        Row: "inline",
    });
    if (dateFormat) {
        fields.push({
            Name: "DateFormat",
            Value: dateFormat,
            Group: "details-row",
            Row: "inline",
        });
    }
    if (measurement) {
        fields.push({
            Name: "Measurement",
            Value: measurement,
            Group: "details-row",
            Row: "inline",
        });
    }

    return fields;
}

const Site = (siteProps: ISiteProps) => {
    const uniqueName = siteProps.uniqueName ?? "site-card";
    const [sites, setSites] = useState<ISiteRecord[]>([]);
    const [isLoadingSites, setIsLoadingSites] = useState<boolean>(false);
    const [loadedUserId, setLoadedUserId] = useState<string>();
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext()
    const selectedUserId = siteProps.selectedUser?.EntID;

    useEffect(() => {
        if (!selectedUserId) {
            setSites([]);
            setLoadedUserId(undefined);
            return;
        }

        const handleGetSitesByUserResponse = (response: unknown, status?: string) => {
            setIsLoadingSites(false);
            setLoadedUserId(selectedUserId);

            const data = FnHandleAPIResponse(response, "Dataset");
            if (status === "200" && Array.isArray(data)) {
                setSites(sortAuthorizeUserCards(data, SITE_CARD_NAME_KEYS));
                return;
            }

            setSites([]);
        }

        setIsLoadingSites(true);
        axiosInterceptor({
            url: AUTH.GetSitesByUser,
            data: {
                userId: selectedUserId
            },
            allowShowLoader: true,
            setFetchData: handleGetSitesByUserResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingSites(false);
            setLoadedUserId(selectedUserId);
            setSites([]);
        });
    }, [selectedUserId]);

    const isWaitingForSelectedUser = Boolean(selectedUserId) && loadedUserId !== selectedUserId;
    const shouldShowLoading = isLoadingSites || isWaitingForSelectedUser;
    const shouldShowNoData = !shouldShowLoading && loadedUserId === selectedUserId && sites.length === 0;
    const handleOnChangeYesNo = async (value: boolean, site: ISiteRecord) => {
        if (!siteProps.selectedUser) return
        let ownerEntityJson = [{
            EntID: siteProps.selectedUser.EntID,
            OwnerEntity: siteProps.selectedUser.LoginUser,
            Selected: true
        }]
        let authEntityJson = []
        const authEntityNames: string[] = []
        for (let index = 0; index < sites.length; index++) {
            const element = sites[index];
            if (element.EntID === site.EntID) {
                element.Selected = value
                element.selected = value
                authEntityNames.push(element._Site ?? "")
            }
            if (element.Selected || element.selected) {
                authEntityNames.push(element._Site ?? "")
            }
            element.AuthEntity = element._Site
            authEntityJson.push({
                EntID: element.EntID,
                Selected: element.Selected,
                AuthEntity: element._Site
            })
        }

        let userNameArr: string[] = []

        const apiPayload = {
            authEntityName: "Site",
            ownerEntityName: "User",
            ownerEntityJson: JSON.stringify(ownerEntityJson),
            authEntityJson: JSON.stringify(authEntityJson)
        }

        axiosInterceptor({
            url: AUTH.AddAuthByEntity,
            data: apiPayload,
            allowShowLoader: true,
            setFetchData: (handleResp: unknown, status?: string) => {
                if (status !== "200" || handleResp === undefined) return

                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Auth,
                    SubGroupName: LogSubGroupName.Auth,
                    LogName: LogName.AssignEntity,
                    actionObject: {
                        entityType: "Site",
                        entityList: authEntityNames.join(", "),
                        userList: userNameArr.join(", ")
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)

            }
        }, statusBarContext)
    }
    return (
        <div className="nz-site-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-site-card-status-message">Loading...</div>
            ) : sites.length ? sites.map((site: ISiteRecord, index: number) => {
                const siteName = FnGetDisplayValue(site, ["_Site", "Site", "Name"]);
                const description = FnGetDisplayValue(site, ["Desc250"]);
                const dateFormat = FnGetDisplayValue(site, ["DateFormat"]);
                const measurement = FnGetDisplayValue(site, ["Measurement"]);
                const address = FnGetAddressDisplay(site);
                const cardFields = buildSiteCardFields(
                    siteName,
                    address,
                    description,
                    isSelected(site.Managed),
                    dateFormat,
                    measurement
                );

                return (
                    <CardLayout
                        key={`${uniqueName}-${site.EntID}-${index}`}
                        uniqueName={`${uniqueName}-${index}`}
                        className="nz-site-card-main"
                        data={site}
                        fields={cardFields}
                        showCheckboxInHeader
                        checkboxName={`${uniqueName}-selected-${index}`}
                        checkboxValue={isSelected(site.Selected)}
                        onCheckboxChange={(value) => handleOnChangeYesNo(value, site)}
                        hideRightMouseMenu={true}
                        ContentImage={{
                            uniqueName: `${uniqueName}-site-image-${index}`,
                            source: <Site24x24
                                size={FnGetCssVariable("--image-size-2")}
                                fill="none"
                                strokeWidth={1} />,
                            w: "var(--image-size-2)",
                            tooltip: "Site",
                            type: "svg",
                        }}
                    />
                )
            }) : shouldShowNoData ? (
                <div className="nz-site-card-status-message">No Data Found</div>
            ) : null}
        </div>
    )
}

export { Site };

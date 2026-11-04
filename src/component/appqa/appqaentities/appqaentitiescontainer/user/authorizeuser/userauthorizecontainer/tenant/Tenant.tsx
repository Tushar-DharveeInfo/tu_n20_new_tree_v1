import { useEffect, useRef, useState } from "react";
import { axiosInterceptor } from "../../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../../../shared/context/hooks/StatusBarHooks";
import { FnHandleAPIResponse } from "../../../../../../../shared/allcommon/basic/FnHandleAPIResponse";
import "../../../../../../allcss/appqaentitiescontainer/user/Tenant.css";
import { IFnCreateForensiclog } from "../../../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useMainAppContext } from "../../../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../../../shared/context/hooks/SessionHooks";
import { FnCreateForensiclog } from "../../../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { Tenant24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { CardLayout } from "../../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { ITenantProps, ITenantRecord } from "../../../../../../allinterface/iappqaentitiescontainer/user/ITenant";
import { sortAuthorizeUserCards } from "../../../../../../allcommon/FnSortAuthorizeUserCards";
import { FnIsTruthyFlag } from "../../../../../../../shared/allcommon/basic/FnIsTruthyFlag";
import { FnGetAddressDisplay, FnGetDisplayValue } from "../../../../../../allcommon/FnGetAddressDisplay";

const TENANT_CARD_NAME_KEYS = ["_Partner", "Partner", "Name", "_Tenant", "Tenant"];

const isSelected = (value: unknown): boolean => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
    }
    return value === 1;
};

/** Builds CardLayout name/value rows from a tenant record. */
const buildTenantCardFields = (tenant: ITenantRecord): ICardLayoutField[] => {
    const tenantName = FnGetDisplayValue(tenant, ["_Partner", "Partner", "Name", "_Tenant", "Tenant"]);
    const description = FnGetDisplayValue(tenant, ["Desc250", "Description"]);
    const contactName = FnGetDisplayValue(tenant, ["ContactName"]);
    const email = FnGetDisplayValue(tenant, ["Email", "EmailAddress", "PrimaryEmail"]);
    const emailOptin = tenant["EmailOptin"];
    const phone = FnGetDisplayValue(tenant, ["Phone"]);
    const phoneType = FnGetDisplayValue(tenant, ["PhoneType"]);
    const address = FnGetAddressDisplay(tenant);
    const Purpose = FnGetDisplayValue(tenant, ["Purpose"]);

    const fields: ICardLayoutField[] = [
        {
            Name: "Tenant",
            Value: Purpose ? `${tenantName} (${Purpose})` : tenantName || "—",
            Header: 1,
        },
    ];
    if (email) {
        if (email) {
            fields.push({
                Name: "Email",
                Value: email,
                Group: "email-row",
                Row: "inline",
            });
            fields.push({
                Name: "OptIn",
                Value: FnIsTruthyFlag(emailOptin) ? "✓" : "X",
                Group: "email-row",
                Row: "inline",
            });
        }
    }
    if (contactName) {
        fields.push({
            Name: "Contact", Value: contactName, Group: "contact-row",
            Row: "inline",
        });
    }
    if (phone) {
        fields.push({
            Name: "Phone",
            Value: phoneType ? `${phone} (${phoneType})` : phone,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (address) {
        fields.push({ Name: "Address", Value: address });
    }
    if (description) {
        fields.push({ Name: "Description", Value: description });
    }

    return fields;
};

const Tenant = (tenantProps: ITenantProps) => {
    const uniqueName = tenantProps.uniqueName ?? "tenant-card";
    const [tenants, setTenants] = useState<ITenantRecord[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState<boolean>(false);
    const [loadedUserId, setLoadedUserId] = useState<string>();
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const selectedUserId = tenantProps.selectedUser?.EntID;

    useEffect(() => {
        if (!selectedUserId) {
            setTenants([]);
            setLoadedUserId(undefined);
            return;
        }

        const handleGetTenantsByUserResponse = (response: unknown, status?: string) => {
            setIsLoadingTenants(false);
            setLoadedUserId(selectedUserId);

            const data = FnHandleAPIResponse(response, "Dataset");
            if (status === "200" && Array.isArray(data)) {
                setTenants(sortAuthorizeUserCards(data, TENANT_CARD_NAME_KEYS));
                return;
            }

            setTenants([]);
        };

        setIsLoadingTenants(true);
        const payload = {
            userId: selectedUserId
        };
        axiosInterceptor({
            url: AUTH.GetTenantsByUser,
            data: payload,
            allowShowLoader: true,
            setFetchData: handleGetTenantsByUserResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingTenants(false);
            setLoadedUserId(selectedUserId);
            setTenants([]);
        });
    }, [selectedUserId]);

    const isWaitingForSelectedUser = Boolean(selectedUserId) && loadedUserId !== selectedUserId;
    const shouldShowLoading = isLoadingTenants || isWaitingForSelectedUser;
    const shouldShowNoData = !shouldShowLoading && loadedUserId === selectedUserId && tenants.length === 0;

    const handleOnChangeYesNo = async (value: boolean, tenant: ITenantRecord) => {
        if (!tenantProps.selectedUser) return;

        const ownerEntityJson = [{
            EntID: tenantProps.selectedUser.EntID,
            OwnerEntity: tenantProps.selectedUser.LoginUser,
            Selected: true
        }];
        const authEntityJson: ITenantRecord[] = [];
        const authEntityNames: string[] = [];

        for (let index = 0; index < tenants.length; index++) {
            const element = tenants[index];
            if (element.EntID === tenant.EntID) {
                element.Selected = value;
                element.selected = value;
                authEntityNames.push(element._Tenant ?? "");
            }
            if (element.Selected || element.selected) {
                authEntityNames.push(element._Tenant ?? "");
            }
            element.AuthEntity = element._Partner;
            authEntityJson.push(element);
        }

        const userNameArr: string[] = [];

        const apiPayload = {
            ownerEntityName: "User",
            authEntityName: "Partner",
            ownerEntityJson: JSON.stringify(ownerEntityJson),
            authEntityJson: JSON.stringify(authEntityJson)
        };

        axiosInterceptor({
            url: AUTH.AddAuthByEntity,
            data: apiPayload,
            allowShowLoader: true,
            setFetchData: (handleResp: unknown, status?: string) => {
                if (status !== "200" || handleResp === undefined) return;

                const payload: IFnCreateForensiclog = {
                    logType: "UserAction",
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Auth,
                    SubGroupName: LogSubGroupName.Auth,
                    LogName: LogName.AssignEntity,
                    actionObject: {
                        entityType: "Tenant",
                        entityList: authEntityNames.join(", "),
                        userList: userNameArr.join(", ")
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                };
                FnCreateForensiclog(payload);
            }
        }, statusBarContext);
    };

    return (
        <div className="nz-tenant-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-tenant-card-status-message">Loading...</div>
            ) : tenants.length ? tenants.map((tenant: ITenantRecord, index: number) => {
                const tenantName = FnGetDisplayValue(tenant, ["_Partner", "Partner", "Name", "_Tenant", "Tenant"]);
                const cardFields = buildTenantCardFields(tenant);

                return (
                    <CardLayout
                        key={`${uniqueName}-${tenant.EntID ?? tenant.RecID ?? tenantName}-${index}`}
                        uniqueName={`${uniqueName}-${index}`}
                        className="nz-tenant-card-item"
                        data={tenant}
                        fields={cardFields}
                        showCheckboxInHeader
                        checkboxName={`${uniqueName}-selected-${index}`}
                        checkboxValue={isSelected(tenant.Selected ?? tenant.selected)}
                        onCheckboxChange={(value) => handleOnChangeYesNo(value, tenant)}
                        hideRightMouseMenu={true}
                        ContentImage={{
                            uniqueName: `${uniqueName}-tenant-image-${index}`,
                            source: <Tenant24x24
                                size={FnGetCssVariable("--image-size-2")}
                                fill="none"
                                strokeWidth={1} />,
                            w: "var(--image-size-2)",
                            tooltip: "Tenant",
                            type: "svg",
                        }}
                    />
                );
            }) : shouldShowNoData ? (
                <div className="nz-tenant-card-status-message">No Data Found</div>
            ) : null}
        </div>
    );
};

export { Tenant };

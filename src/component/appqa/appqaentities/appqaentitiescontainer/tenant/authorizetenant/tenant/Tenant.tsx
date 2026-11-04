import { KeyboardEvent, useEffect, useRef, useState } from "react";
import "../../../../../allcss/appqaentitiescontainer/tenant/Tenant.css";
import { useStatusBarContext } from "../../../../../../shared/context/hooks/StatusBarHooks";
import { useSessionContext } from "../../../../../../shared/context/hooks/SessionHooks";
import { FnHandleAPIResponse } from "../../../../../../shared/allcommon/basic/FnHandleAPIResponse";
import { axiosInterceptor } from "../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../shared/interceptors/EndPoints";
import { Tenant24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { CardLayout } from "../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { ITenantProps, ITenantRecord } from "../../../../../allinterface/iappqaentitiescontainer/tenant/ITenant";
import { sortAuthorizeUserCards } from "../../../../../allcommon/FnSortAuthorizeUserCards";
import { FnIsTruthyFlag } from "../../../../../../shared/allcommon/basic/FnIsTruthyFlag";
import { FnGetAddressDisplay, FnGetDisplayValue } from "../../../../../allcommon/FnGetAddressDisplay";

const TENANT_CARD_NAME_KEYS = ["Name"];



const getTenantId = (tenant: ITenantRecord): string =>
    FnGetDisplayValue(tenant, ["EntID", "RecID"])
    || FnGetDisplayValue(tenant, ["Name", "_Partner", "_Tenant"]);



/** Builds CardLayout name/value rows from a tenant record. */
const buildTenantCardFields = (tenant: ITenantRecord): ICardLayoutField[] => {
    const tenantName = FnGetDisplayValue(tenant, ["Name"]);
    const description = FnGetDisplayValue(tenant, ["Desc250", "Description"]);
    const contactName = FnGetDisplayValue(tenant, ["ContactName"]);
    const email = FnGetDisplayValue(tenant, ["Email", "EmailAddress", "PrimaryEmail"]);
    const emailOptin = tenant.EmailOptin;
    const address = FnGetAddressDisplay(tenant);
    const phone = FnGetDisplayValue(tenant, ["Phone"]);
    const phoneType = FnGetDisplayValue(tenant, ["PhoneType"]);
    const Purpose = FnGetDisplayValue(tenant, ["Purpose"]);

    const fields: ICardLayoutField[] = [
        {
            Name: "Tenant",
            Value: description.length ? `${tenantName} (${description})` : tenantName || "—",
            Header: 1,
        },
    ];
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
    if (contactName) {
        fields.push({
            Name: "Contact",
            Value: contactName,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (phone) {
        fields.push({
            Name: "Phone",
            Value: `${phone} (${phoneType})`,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (address) {
        fields.push({ Name: "Address", Value: address.trim(), Row: "inline" });
    }

    return fields;
};

const Tenant = (tenantProps: ITenantProps) => {
    const uniqueName = tenantProps.uniqueName ?? "tenant-card";
    const [tenants, setTenants] = useState<ITenantRecord[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState<boolean>(false);
    const [hasRequestedTenants, setHasRequestedTenants] = useState<boolean>(false);
    const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(tenantProps.selectedTenantId);
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const sessionContext = useSessionContext();
    const tenantPropsRef = useRef(tenantProps);
    const hasLoadedTenants = useRef<boolean>(false);
    const sessionId = sessionContext?.SessionList?.find((item: any) => item.VariableName?.toLowerCase() === "sessionid")?.SessionValue;

    useEffect(() => {
        tenantPropsRef.current = tenantProps;
    }, [tenantProps]);

    useEffect(() => {
        setSelectedTenantId(tenantProps.selectedTenantId);
    }, [tenantProps.selectedTenantId]);

    useEffect(() => {
        if (hasLoadedTenants.current) {
            return;
        }
        hasLoadedTenants.current = true;

        const handleGetTenantsResponse = (response: unknown, status?: string) => {
            setIsLoadingTenants(false);
            if (status === "200" && response && typeof response === "object" && "entitiesJson" in response) {
                const parsedData = FnHandleAPIResponse(response.entitiesJson, "Tenants");
                if (parsedData && Array.isArray(parsedData)) {
                    const sortedTenants = sortAuthorizeUserCards(parsedData, TENANT_CARD_NAME_KEYS);
                    setTenants(sortedTenants);
                    if (sortedTenants.length && !tenantPropsRef.current.selectedTenantId) {
                        const firstTenant = sortedTenants[0] as ITenantRecord;
                        setSelectedTenantId(getTenantId(firstTenant));
                        tenantPropsRef.current.handleSelectedCard?.(firstTenant);
                    }
                } else {
                    setTenants([]);
                }
            } else {
                setTenants([]);
            }
        };

        setHasRequestedTenants(true);
        setIsLoadingTenants(true);
        axiosInterceptor({
            url: AUTH.GetEntitiesForFeatureAuth,
            data: {
                entityName: "Tenant",
                pageType: 1,
                sessionId: sessionId
            },
            allowShowLoader: true,
            setFetchData: handleGetTenantsResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingTenants(false);
            setTenants([]);
        });
    }, [sessionId]);

    const shouldShowLoading = isLoadingTenants;
    const shouldShowNoData = hasRequestedTenants && !isLoadingTenants && tenants.length === 0;

    const handleTenantClick = (_event: React.MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, data: unknown) => {
        const selectedTenant = data as ITenantRecord;
        setSelectedTenantId(getTenantId(selectedTenant));
        tenantProps.handleSelectedCard?.(selectedTenant);
    };

    return (
        <div className="nz-tenant-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-tenant-card-status-message">Loading...</div>
            ) : tenants.length ? tenants.map((tenant: ITenantRecord, index: number) => {
                const tenantId = getTenantId(tenant);
                const cardFields = buildTenantCardFields(tenant);

                return (
                    <CardLayout
                        key={`${uniqueName}-${tenantId}-${index}`}
                        uniqueName={`${uniqueName}-${index}`}
                        className="nz-tenant-card-main"
                        data={tenant}
                        fields={cardFields}
                        isSelected={selectedTenantId === tenantId}
                        onClick={handleTenantClick}
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

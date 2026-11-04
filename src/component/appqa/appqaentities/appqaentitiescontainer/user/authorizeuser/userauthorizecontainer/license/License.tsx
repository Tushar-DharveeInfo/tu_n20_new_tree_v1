import { useEffect, useRef, useState } from "react";
import { axiosInterceptor } from "../../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../../../shared/context/hooks/StatusBarHooks";
import { FnHandleAPIResponse } from "../../../../../../../shared/allcommon/basic/FnHandleAPIResponse";
import "../../../../../../allcss/appqaentitiescontainer/user/License.css";
import { IFnCreateForensiclog } from "../../../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useMainAppContext } from "../../../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../../../shared/context/hooks/SessionHooks";
import { FnCreateForensiclog } from "../../../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { FnConvertDateToUtcOrUtcToDate } from "../../../../../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { CardLayout } from "../../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { ILicenseProps, ILicenseRecord } from "../../../../../../allinterface/iappqaentitiescontainer/user/ILicense";
import { YesNoFormContainer } from "../../../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { sortAuthorizeUserCards } from "../../../../../../allcommon/FnSortAuthorizeUserCards";
import { FnGetDisplayValue } from "../../../../../../allcommon/FnGetAddressDisplay";

const LICENSE_CARD_NAME_KEYS = ["_NZLicenseKey", "NZLicenseKey", "License", "LicenseKey", "Name"];

/* Exact product name for the base NetZoom license (not ReadOnly / Colo variants). */
const NETZOOM_PRODUCT = "netzoom";
const NETZOOM_READONLY_PRODUCT = "netzoom readonly";
const NETZOOM_COLO_PRODUCT = "netzoom colo";

/*
 * Returns allowed ProductName values for a basic role.
 * Admin / Enterprise / Site / API → NetZoom only
 * ReadOnly → NetZoom, NetZoom ReadOnly
 * Colo → NetZoom, NetZoom Colo
 */
const getAllowedLicenseProductsForRole = (role: string | null | undefined): string[] => {
    const normalizedRole = (role ?? "").trim().toLowerCase();
    switch (normalizedRole) {
        case "readonly":
            return [NETZOOM_PRODUCT, NETZOOM_READONLY_PRODUCT];
        case "colo":
            return [NETZOOM_PRODUCT, NETZOOM_COLO_PRODUCT];
        case "admin":
        case "enterprise":
        case "site":
        case "api":
            return [NETZOOM_PRODUCT];
        default:
            return [NETZOOM_PRODUCT];
    }
};

/* Filters license list to products allowed for the given basic role. */
const filterLicensesByRole = (licenses: ILicenseRecord[], role: string | null | undefined): ILicenseRecord[] => {
    const allowedProducts = getAllowedLicenseProductsForRole(role);
    return licenses.filter((license) => {
        const productName = FnGetDisplayValue(license, ["ProductName"]).trim().toLowerCase();
        return allowedProducts.includes(productName);
    });
};

const isSelected = (value: unknown): boolean => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
    }
    return value === 1;
};

/* Builds CardLayout name/value rows from a license record. */
const buildLicenseCardFields = (
    licenseName: string,
    productName: string,
    startDate: string,
    endDate: string,
    userCount: string,
    RackCount: number, disable: boolean
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "License",
            Value: licenseName || "—",
            Header: 1,
            disabledCheckbox: disable
        },
    ];

    if (productName) {
        fields.push({ Name: "ProductName", Value: productName, Header: 2 });
    }
    if (startDate) {
        fields.push({
            Name: "StartDate",
            Value: FnConvertDateToUtcOrUtcToDate(startDate, false, false),
            Header: 3
        });
    }
    if (endDate) {
        fields.push({
            Name: "EndDate",
            Value: FnConvertDateToUtcOrUtcToDate(endDate, false, false),
            Header: 4
        });
    }
    if (RackCount > 0) {
        fields.push({ Name: "RackCount", Value: RackCount.toString(), Header: 5 });
    } else if (userCount) {
        fields.push({ Name: "UserCount", Value: userCount, Header: 5 });
    }

    return fields;
};

const License = (licenseProps: ILicenseProps) => {
    const uniqueName = licenseProps.uniqueName ?? "license-card";
    const [licenses, setLicenses] = useState<ILicenseRecord[]>([]);
    const [originalApiLicense, setOriginalApiLicense] = useState<ILicenseRecord[]>([]);
    const [isLoadingLicenses, setIsLoadingLicenses] = useState<boolean>(false);
    const [loadedUserId, setLoadedUserId] = useState<string>();
    const [showOkButtonOnly, setShowOkButtonOnly] = useState<boolean>(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const selectedUserId = licenseProps.selectedUser?.EntID;

    useEffect(() => {
        if (!selectedUserId) {
            setLicenses([]);
            setOriginalApiLicense([]);
            setLoadedUserId(undefined);
            return;
        }

        const handleGetLicensesByUserResponse = (response: unknown, status?: string) => {
            setIsLoadingLicenses(false);
            setLoadedUserId(selectedUserId);

            const data = FnHandleAPIResponse(response, "Dataset");
            if (status === "200" && Array.isArray(data)) {
                const sortedLicenses = sortAuthorizeUserCards(data, LICENSE_CARD_NAME_KEYS);
                setOriginalApiLicense(sortedLicenses);
                const roleForFilter = licenseProps.selectedRole ?? licenseProps.selectedUser?.BasicRole;

                setLicenses(filterLicensesByRole(sortedLicenses, roleForFilter));
                return;
            }
            setOriginalApiLicense([]);
            setLicenses([]);
        };

        setIsLoadingLicenses(true);
        const payload = {
            userId: selectedUserId
        };
        axiosInterceptor({
            url: AUTH.GetLicensesByUser,
            data: payload,
            allowShowLoader: true,
            setFetchData: handleGetLicensesByUserResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingLicenses(false);
            setLoadedUserId(selectedUserId);
            setLicenses([]);
        });
    }, [selectedUserId]);

    // Re-filter cached licenses when the user's basic role selection changes.
    useEffect(() => {
        if (!originalApiLicense.length) {
            return;
        }
        const roleForFilter = licenseProps.selectedRole ?? licenseProps.selectedUser?.BasicRole;
        if (!roleForFilter) {
            return;
        }
        setLicenses(filterLicensesByRole(originalApiLicense, roleForFilter));
    }, [licenseProps.selectedRole, originalApiLicense]);

    const isWaitingForSelectedUser = Boolean(selectedUserId) && loadedUserId !== selectedUserId;
    const shouldShowLoading = isLoadingLicenses || isWaitingForSelectedUser;
    const shouldShowNoData = !shouldShowLoading && loadedUserId === selectedUserId && licenses.length === 0;

    const handleOnChangeYesNo = async (value: boolean, license: ILicenseRecord) => {

        if (!licenseProps.selectedUser) return;
        if (license.AssignedUserCount === license.UserCount) {

            setConfirmMessage(` License may only be assigned to ${license.UserCount} users.You may unassign a user to assign the license to another user.`)
            setIsConfirmOpen(true);
            setShowOkButtonOnly(true);
            return;
        }
        const ownerEntityJson = [{
            EntID: licenseProps.selectedUser.EntID,
            OwnerEntity: licenseProps.selectedUser.LoginUser,
            Selected: true
        }];
        const authEntityJson: ILicenseRecord[] = [];
        const authEntityNames: string[] = [];

        for (let index = 0; index < licenses.length; index++) {
            const element = licenses[index];
            if (element.EntID === license.EntID) {
                element.Selected = value;
                element.selected = value;
                authEntityNames.push(element._NZLicenseKey ?? "");
            }
            if (element.Selected || element.selected) {
                authEntityNames.push(element._NZLicenseKey ?? "");
            }

            element.AuthEntity = element._NZLicenseKey;
            authEntityJson.push(element);
        }

        const userNameArr: string[] = [];

        const apiPayload = {
            ownerEntityName: "User",
            authEntityName: "NZLicenseKey",
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
                        entityType: "License",
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
    const isCurrentOrPastDate = (dateString: string): boolean => {
        const inputDate = new Date(dateString);
        const currentDate = new Date();

        // Ignore time
        inputDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        return inputDate <= currentDate;
    };
    return (
        <div className="nz-license-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-license-card-status-message">Loading...</div>
            ) : licenses.length ? licenses.map((license: ILicenseRecord, index: number) => {
                const licenseName = FnGetDisplayValue(license, ["_NZLicenseKey", "NZLicenseKey", "License", "LicenseKey", "Name"]);
                const startDate = FnGetDisplayValue(license, ["StartDate"]);
                const endDate = FnGetDisplayValue(license, ["EndDate"]);
                const productName = FnGetDisplayValue(license, ["ProductName"]);
                const userCount = `${FnGetDisplayValue(license, ["AssignedUserCount"])}/${FnGetDisplayValue(license, ["UserCount"])}`;
                const RackCount = FnGetDisplayValue(license, ["RackCount"])
                const disable = endDate ? isCurrentOrPastDate(endDate as string) : false
                const cardFields = buildLicenseCardFields(
                    licenseName,
                    productName,
                    startDate,
                    endDate,
                    userCount,
                    Number(RackCount),
                    disable
                );

                return (
                    <CardLayout
                        key={`${uniqueName}-${license.EntID ?? license.RecID ?? licenseName}-${index}`}
                        uniqueName={`${uniqueName}-${index}`}
                        className="nz-license-card-item"
                        data={license}
                        fields={cardFields}
                        showCheckboxInHeader
                        checkboxName={`${uniqueName}-selected-${index}`}
                        checkboxValue={isSelected(license.Selected ?? license.selected)}
                        onCheckboxChange={(value) => handleOnChangeYesNo(value, license)}
                        hideRightMouseMenu={true}
                    />
                );
            }) : shouldShowNoData ? (
                <div className="nz-license-card-status-message">No Data Found</div>
            ) : null}
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'license-confirm'}
                message={confirmMessage}
                showOkButton={showOkButtonOnly}
                handleOkButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }} />
        </div>
    );
};

export { License };

import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { Check, User24x24 } from "@n20a/libicon";
import "../../../../../allcss/appqaentitiescontainer/user/User.css";
import { IUserContactEntity, IUserProps } from "../../../../../allinterface/iappqaentitiescontainer/user/IUser";
import { useStatusBarContext } from "../../../../../../shared/context/hooks/StatusBarHooks";
import { axiosInterceptor } from "../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../shared/interceptors/EndPoints";
import { FnGetCssVariable } from "../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { CardLayout } from "../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { Image } from "../../../../../../shared/basic/image/Image";
import { sortAuthorizeUserCards } from "../../../../../allcommon/FnSortAuthorizeUserCards";
import { FnIsTruthyFlag } from "../../../../../../shared/allcommon/basic/FnIsTruthyFlag";
import { FnGetAddressDisplay, FnGetDisplayValue } from "../../../../../allcommon/FnGetAddressDisplay";
import { filterEnabledUsers } from "../../../../../allcommon/FnIsAuthorizedUser";

const USER_CARD_NAME_KEYS = ["UserName"];

const parseJsonValue = (value: unknown): unknown => {
    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

const isUserRecord = (value: unknown): value is IUserContactEntity => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const record = value as Record<string, unknown>;
    return Boolean(
        record.EntID ||
        record._User ||
        record.LoginUser ||
        record.UserName ||
        record.User ||
        record.ContactName ||
        record.BasicRole ||
        record.Email
    );
}

const isEnabledUser = (user: IUserContactEntity): boolean => {
    const value = (user as Record<string, unknown>).Enabled;

    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        (typeof value === "string" &&
            ["true", "yes"].includes(value.toLowerCase()))
    );
};

const findUsersArray = (value: unknown): IUserContactEntity[] => {
    try {
        const parsedValue = parseJsonValue(value);

        if (Array.isArray(parsedValue)) {
            if (parsedValue.some(isUserRecord)) {
                return sortAuthorizeUserCards(
                    parsedValue.filter(
                        (user): user is IUserContactEntity =>
                            isUserRecord(user) && isEnabledUser(user)
                    ),
                    USER_CARD_NAME_KEYS
                );
            }

            for (const item of parsedValue) {
                const childArray = findUsersArray(item);
                if (childArray.length) {
                    return childArray;
                }
            }
        }

        if (parsedValue && typeof parsedValue === "object") {
            const objectValue = parsedValue as Record<string, unknown>;

            for (const key of Object.keys(objectValue)) {
                const childArray = findUsersArray(objectValue[key]);
                if (childArray.length) {
                    return childArray;
                }
            }
        }
    } catch (error) {
        console.error("Error while finding users array:", error);
    }

    return [];
};

const getUserId = (user: IUserContactEntity): string =>
    FnGetDisplayValue(user, ["EntID", "RecID"])
    || FnGetDisplayValue(user, ["_User", "LoginUser", "UserName", "User"]);

const isSelectedValue = (value: unknown): boolean => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
    }

    return value === 1;
}

const getRecordDisplayValue = (record: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && String(value).trim()) {
            return String(value).trim();
        }
    }

    return "";
}

const findEntityCollection = (value: unknown, collectionName: string): unknown => {
    const parsedValue = parseJsonValue(value);

    if (Array.isArray(parsedValue)) {
        for (const item of parsedValue) {
            const foundCollection = findEntityCollection(item, collectionName);
            if (foundCollection) {
                return foundCollection;
            }
        }
    }

    if (parsedValue && typeof parsedValue === "object") {
        const objectValue = parsedValue as Record<string, unknown>;
        const matchingKey = Object.keys(objectValue).find((key) => key.toLowerCase() === collectionName.toLowerCase());

        if (matchingKey) {
            return objectValue[matchingKey];
        }

        for (const key of Object.keys(objectValue)) {
            const foundCollection = findEntityCollection(objectValue[key], collectionName);
            if (foundCollection) {
                return foundCollection;
            }
        }
    }

    return null;
}

const collectSelectedEntityValues = (value: unknown, displayKeys: string[], selectedValues: string[] = []): string[] => {
    const parsedValue = parseJsonValue(value);

    if (Array.isArray(parsedValue)) {
        parsedValue.forEach((item) => collectSelectedEntityValues(item, displayKeys, selectedValues));
        return selectedValues;
    }

    if (parsedValue && typeof parsedValue === "object") {
        const objectValue = parsedValue as Record<string, unknown>;

        if (isSelectedValue(objectValue.Selected)) {
            const displayValue = getRecordDisplayValue(objectValue, displayKeys);
            if (displayValue && !selectedValues.includes(displayValue)) {
                selectedValues.push(displayValue);
            }
        }

        Object.keys(objectValue).forEach((key) => {
            collectSelectedEntityValues(objectValue[key], displayKeys, selectedValues);
        });
    }

    return selectedValues;
}

const getShortEntityLabel = (values: string): string => {
    if (!values.length) {
        return "";
    }
    const checkString = values.split(",")
    return checkString.length > 1 ? `${checkString[0]},...` : checkString[0];
}

const makeUserName = (userName: string, role?: string) => {
    if (role?.length) {
        return `${userName} (${role})`;
    } else {
        return userName
    }
}


/** Builds CardLayout name/value rows from a user contact entity. */
const buildUserCardFields = (
    IsAuthorized: string,
    userName: string,
    role: string,
    contactName: string,
    email: string,
    emailOptin: string,
    phone: string,
    address: string,
    selectedSites: string,
    selectedRoles: string,
    selectedLicenses: string,
    selectedTeams: string,
    selectedTenants: string,
    selectedFeatures: string,
    phoneType: string,
    isEnabled: string
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "Username",
            Value: makeUserName(userName, selectedRoles) || "—",
            Header: 1,
        },
    ];
    if (isEnabled === 'true') {
        fields.push({
            Name: "", Value: "", Header: 2, ValueContent: <Image
                source={
                    <Check
                        size={FnGetCssVariable("--image-size-1")}
                        fill="none"
                        strokeWidth={1}
                    />
                }
                uniqueName={`${userName}-icheck`}
                w="var(--image-size-2)"
                tooltip="Enabled"
                type="svg"
            />
        })
    } else if (IsAuthorized === 'true') {
        fields.push({
            Name: "", Value: "", Header: 2, ValueContent: <p title="User is Authorized">✓</p>
        })
    }
    if (selectedLicenses.length > 0) {
        fields.push({ Name: "License", Value: getShortEntityLabel(selectedLicenses) });
    }
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

    if (phone) {
        fields.push({
            Name: "Phone",
            Value: `${phone} (${phoneType})`,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (address) {
        fields.push({ Name: "Address", Value: address.trim(), Row: "inline", });
    }
    if (selectedSites.length > 0) {
        fields.push({ Name: "Site", Value: getShortEntityLabel(selectedSites) });
    }
    if (selectedTeams.length > 0) {
        fields.push({ Name: "Team", Value: getShortEntityLabel(selectedTeams) });
    }
    if (selectedTenants.length > 0) {
        fields.push({ Name: "Tenant", Value: getShortEntityLabel(selectedTenants) });
    }
    if (selectedFeatures.length > 0) {
        fields.push({ Name: "Feature", Value: getShortEntityLabel(selectedFeatures) });
    }

    return fields;
}

const User = (userProps: IUserProps) => {
    const uniqueName = userProps.uniqueName ?? "user-card";
    const [users, setUsers] = useState<IUserContactEntity[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>(userProps.selectedUserId);
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const userPropsRef = useRef(userProps);
    const hasLoadedUsers = useRef<boolean>(false);

    useEffect(() => {
        userPropsRef.current = userProps;
    }, [userProps]);

    useEffect(() => {
        setSelectedUserId(userProps.selectedUserId);
    }, [userProps.selectedUserId]);

    // Below useEffect is to update user roles after authorization, we are update only data we are not calling api agin 
    useEffect(() => {
        if (typeof userProps.checkRoleName === "string" && userProps.selectedUserId) {
            const user = users.find(
                item => item.EntID === userProps.selectedUserId
            );
            if (user) {
                const updatedUser = {
                    ...user,
                    Roles: userProps.checkRoleName,
                    BasicRole: userProps.checkBasicRole ?? undefined
                };
                userPropsRef.current.handleSelectedCard?.(updatedUser)
                const userCards: Record<string, any>[] = sortAuthorizeUserCards(
                    users.map(item =>
                        item.EntID === userProps.selectedUserId ? updatedUser : item
                    ),
                    USER_CARD_NAME_KEYS
                )
                setUsers(userCards.filter((item: Record<string, any>) => item && item.Enabled));
            }
        }
    }, [userProps.checkRoleName, userProps.selectedUserId]);

    useEffect(() => {

        if (hasLoadedUsers.current) {
            return;
        }

        hasLoadedUsers.current = true;

        const handleUsersContactsEntitiesResponse = (response: unknown, status?: string) => {
            setIsLoadingUsers(false);

            if (status !== "200" || !response) {
                setUsers([]);
                return;
            }

            const responseObject = response as Record<string, unknown>;
            const jsonResponse = responseObject.usersJson
            const userRecords = findUsersArray(jsonResponse)

            setUsers(userRecords);

            if (userRecords.length && !userPropsRef.current.selectedUserId) {
                const firstUser = userRecords[0];
                setSelectedUserId(getUserId(firstUser));
                userPropsRef.current.handleSelectedCard?.(firstUser);
            }
        }

        setIsLoadingUsers(true);
        axiosInterceptor({
            url: AUTH.GetUsersContactsEntities,
            data: {
                includeCurrentUser: false
            },
            allowShowLoader: true,
            setFetchData: handleUsersContactsEntitiesResponse
        }, statusBarContextRef.current)
    }, []);

    const handleUserClick = (_event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, data: unknown): void => {
        const selectedUser = data as IUserContactEntity;
        setSelectedUserId(getUserId(selectedUser));
        userProps.handleSelectedCard?.(selectedUser);
    }

    return (
        <div className="nz-user-card-container" key={uniqueName}>
            <div className="nz-user-card-list">
                {isLoadingUsers ? (
                    <div className="nz-user-card-status-message">Loading...</div>
                ) : users.length ? users.map((item: IUserContactEntity, index: number) => {
                    const userName = FnGetDisplayValue(item, ["UserName"]);
                    const userId = getUserId(item);
                    const role = FnGetDisplayValue(item, ["BasicRole", "Role", "UserRole"]);
                    const IsAuthorized = item?.IsAuthorized ? "true" : "false";
                    const isEnabled = item?.Enabled ? "true" : "false";
                    const contactName = FnGetDisplayValue(item, ["ContactName"]);
                    const email = FnGetDisplayValue(item, ["Email", "EmailAddress", "PrimaryEmail"]);
                    const emailOptin = FnGetDisplayValue(item, ["EmailOptin"]);
                    const address = FnGetAddressDisplay(item);
                    const phone = FnGetDisplayValue(item, ["Phone"]);
                    const selectedSites = FnGetDisplayValue(item, ["Sites"]);
                    const selectedRoles = FnGetDisplayValue(item, ["Roles"]);
                    const selectedLicenses = FnGetDisplayValue(item, ["Licenses"]);
                    const selectedTeams = FnGetDisplayValue(item, ["Teams"]);
                    const selectedTenants = FnGetDisplayValue(item, ["Tenants"]);
                    const selectedFeatures = FnGetDisplayValue(item, ["Features"]);
                    const phonetype = FnGetDisplayValue(item, ["PhoneType"]);

                    const cardFields = buildUserCardFields(
                        IsAuthorized,
                        userName,
                        role,
                        contactName,
                        email,
                        emailOptin,
                        phone,
                        address,
                        selectedSites,
                        selectedRoles,
                        selectedLicenses,
                        selectedTeams,
                        selectedTenants,
                        selectedFeatures,
                        phonetype,
                        isEnabled
                    );

                    return (
                        <CardLayout
                            key={`${uniqueName}-${userId}-${index}`}
                            uniqueName={`${uniqueName}-${index}`}
                            className="nz-user-card-main"
                            featureId={userProps.featureId}
                            data={item}
                            fields={cardFields}
                            isSelected={selectedUserId === userId}
                            onClick={handleUserClick}
                            hideRightMouseMenu={true}
                            ContentImage={{
                                uniqueName: `${uniqueName}-user-image-${index}`,
                                source: <User24x24
                                    size={FnGetCssVariable("--image-size-2")}
                                    fill="none"
                                    strokeWidth={1} />,
                                w: "var(--image-size-2)",
                                tooltip: "User",
                                type: "svg",
                            }}
                        />
                    )
                }) : (
                    <div className="nz-user-card-status-message">No Data Found</div>
                )}
            </div>
        </div>
    )
}

export { User };

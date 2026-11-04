/**
 * DelegateToAnotherUser
 *
 * Allows users to:
 * - View available delegate users.
 * - Enable or disable delegation.
 * - Configure delegation date ranges.
 * - Persist delegation changes automatically.
 *
 * Workflow:
 * 1. Load delegate users on component mount.
 * 2. Display each delegate user in a card layout.
 * 3. Save delegation when a user is enabled or dates are updated.
 * 4. Remove delegation when disabled.
 * 5. Refresh data after successful updates.
 */

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks';
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks';
import { axiosInterceptor } from '../../shared/interceptors/Interceptor';
import '../allcss/DelegateToAnotherUser.css'
import { DELEGATE, EM } from '../../shared/interceptors/EndPoints';
import { Check, User24x24 } from '@n20a/libicon';
import { DateRangeControl, EuropeanDateRangeControl } from '@n20a/libform';
import { FnGetCssVariable } from '../../appcontainer/allcommon/FnGetCssVariable';
import { FnCreateForensiclog } from '../../appcontainer/allcommon/FnCreateForensiclog';
import { FnFormatDateWithAppFormat } from '../../appcontainer/allcommon/FnFormatDateWithAppFormat';
import { FnConvertDateToUtcOrUtcToDate } from '../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';
import { FnHandleAPIResponse } from '../../shared/allcommon/settingsform/FnHandleAPIResponse';
import { FnGetSessionVariableFromStorage } from '../../shared/allcommon/basic/FnGetSessionVariableFromStorage';
import { useSessionContext } from '../../shared/context/hooks/SessionHooks';
import { IDelegateToAnotherUser, IDelegateUser } from '../allinterface/IAppqaDelegate';
import { IFnCreateForensiclog } from '../../appcontainer/allinterface/IFnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { Label } from '../../shared/basic/label/Label';
import { CardLayout } from '../../shared/cardlayout/CardLayout';
import { ICardLayoutField } from '../../shared/allinterface/cardlayout/ICardLayout';
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely';
import { Image } from '../../shared/basic/image/Image';
import { FnIsTruthyFlag } from '../../shared/allcommon/basic/FnIsTruthyFlag';
import { FnGetAddressDisplay, FnGetDisplayValue } from '../allcommon/FnGetAddressDisplay';
import { getDateFormat, getMuForSite } from '../../shared/context/contextandprovider/ExplorerTree';

const DelegateToAnotherUser = (delegateToAnotherUserProps: IDelegateToAnotherUser) => {
    // State variables
    const [userList, setUserList] = useState<IDelegateUser[]>([]);
    const [originalDelegateUsers, setOriginalDelegateUsers] = useState<IDelegateUser[]>([]);
    const [currentSetDateData, setCurrentSetDateData] = useState<IDelegateUser | null>(null);
    const [checkedItem, setCheckedItem] = useState<IDelegateUser | null>(null);
    const [isLoadingDelegateUsers, setIsLoadingDelegateUsers] = useState(true);
    const statusBarContext = useStatusBarContext();
    const sessionData = useSessionContext();
    const mainAppContext = useMainAppContext();
    const showStartEndDate = delegateToAnotherUserProps.showStartEndDate ?? true;
    const muForSite = getMuForSite();

    // Fetch user data on component mount
    useEffect(() => {
        getDelegateUserList(true);
    }, []);

    const showMessage = (message: string): void => {
        delegateToAnotherUserProps.handleShowUserMessage?.(message);
    };

    // Function to fetch delegate user list
    const getDelegateUserList = async (isFirstLoad = false) => {
        const date = new Date();
        const callApiToGetDelegateData = () => {
            const handleGetAllDelegatesApiResponse = (getAllDelegatesApiResponse: unknown, status?: string) => {
                setIsLoadingDelegateUsers(false);
                if (status === "200" && getAllDelegatesApiResponse && typeof getAllDelegatesApiResponse === "object" && 'userDelegateJson' in getAllDelegatesApiResponse) {
                    const parsedRecords = FnHandleAPIResponse(getAllDelegatesApiResponse.userDelegateJson, "Dataset") as IDelegateUser[] | null;
                    if (!parsedRecords?.length) {
                        showMessage("No delegate users found.");
                        return;
                    }

                    let userId: string | null = null;
                    const userVar = FnGetSessionVariableFromStorage(
                        "RequestedBy",
                        "LoginUserID",
                        sessionData.SessionList
                    );
                    if (userVar && userVar.length > 0) {
                        userId = userVar[0].SessionValue;
                    }

                    let loginUserName: string | null = null;
                    const loginUserVar = FnGetSessionVariableFromStorage(
                        "RequestedBy",
                        "LoginShortName",
                        sessionData.SessionList
                    ) || FnGetSessionVariableFromStorage(
                        "RequestedBy",
                        "LoginUser",
                        sessionData.SessionList
                    );
                    if (loginUserVar && loginUserVar.length > 0) {
                        loginUserName = loginUserVar[0].SessionValue;
                    }

                    const cleanId = (id: string | null | undefined) =>
                        id ? String(id).replace(/[{}]/g, "").trim().toLowerCase() : "";

                    const cleanUser = (name: string | null | undefined) =>
                        name ? String(name).replace(/^.*\\/, "").trim().toLowerCase() : "";

                    const filteredRecords = parsedRecords.filter((element: IDelegateUser) => {
                        if (userId && element.DelegateUserEntID) {
                            if (cleanId(element.DelegateUserEntID) === cleanId(userId)) {
                                return false;
                            }
                        }
                        if (loginUserName && element.DelegateUser) {
                            if (cleanUser(element.DelegateUser) === cleanUser(loginUserName)) {
                                return false;
                            }
                        }
                        return true;
                    });

                    if (!filteredRecords?.length) {
                        setOriginalDelegateUsers([]);
                        setUserList([]);
                        showMessage("No delegate users found.");
                        return;
                    }

                    const delegateUsers: IDelegateUser[] = [];
                    if (filteredRecords && filteredRecords.length > 0) {
                        setOriginalDelegateUsers(FnParseJsonSafely(JSON.stringify(filteredRecords)));
                        const dateFormat = muForSite ? muForSite.toLowerCase() === "europe" ? "dd/MM/yyyy" : "MM/dd/yyyy" : getDateFormat();
                        filteredRecords.forEach((element: IDelegateUser) => {
                            const startDate = element.StartDate ? FnFormatDateWithAppFormat(element.StartDate, false, muForSite) : format(date, dateFormat);
                            const endDate = element.EndDate ? FnFormatDateWithAppFormat(element.EndDate, false, muForSite) : format(date, dateFormat);
                            const user: IDelegateUser = {
                                ...element,
                                tempId: crypto.randomUUID(),
                                _User: element.LoginUser,
                                LoginUser: element.LoginUser,
                                EntID: element.EntID,
                                RecID: element.RecID,
                                checked: !!element.StartDate,
                                DelegateUser: element.DelegateUser,
                                DelegateUserEntID: element.DelegateUserEntID,
                                DelegateUserRole: element.DelegateUserRole,
                                StartDate: startDate,
                                EndDate: endDate,
                                LastUpdated: element.LastUpdated,
                                EntityName: element.EntityName,
                            };
                            delegateUsers.push(user);
                        });
                        setUserList(delegateUsers);
                    } else {
                        setOriginalDelegateUsers([]);
                        setUserList([]);
                    }
                } else {
                    setOriginalDelegateUsers([]);
                    setUserList([]);
                }
            };
            if (isFirstLoad) {
                setIsLoadingDelegateUsers(true);
            }
            axiosInterceptor({
                url: DELEGATE.GetAllDelegates,
                data: {},
                allowShowLoader: true,
                setFetchData: handleGetAllDelegatesApiResponse
            }, statusBarContext).catch(() => {
                setIsLoadingDelegateUsers(false);
                setOriginalDelegateUsers([]);
                setUserList([]);
                showMessage("Failed to load delegate users.");
            });
        };

        callApiToGetDelegateData();
    };

    const convertToYYYYMMDD = (dateString: string | null): string => {
        if (!dateString) return "";

        // If dateString is already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            return dateString.substring(0, 10);
        }

        const separator = dateString.includes("/") ? "/" : dateString.includes("-") ? "-" : "";
        if (!separator) return dateString;

        const parts = dateString.split(separator);
        if (parts.length !== 3) return "";

        let day: string;
        let month: string;
        let year: string;

        const isEuropean = muForSite ? muForSite.toLowerCase() === "europe" : getDateFormat() === "dd/MM/yyyy";

        if (isEuropean) {
            [day, month, year] = parts;
        } else {
            [month, day, year] = parts;
        }

        if (!isEuropean && Number(month) > 12) {
            [day, month] = [month, day];
        }

        const formattedMonth = month.padStart(2, "0");
        const formattedDay = day.padStart(2, "0");

        return `${year}-${formattedMonth}-${formattedDay}`;
    };

    // Save changes made in the grid
    const handleSaveDelegateUsers = async (selectedUsers: IDelegateUser[], originalDelegateUserList: IDelegateUser[]) => {
        const recordsToAdd: IDelegateUser[] = [];
        const recordsToUpdate: IDelegateUser[] = [];
        const DelegateUser: string[] = [];

        let userId: string | null = null;
        const userVar = FnGetSessionVariableFromStorage(
            "RequestedBy",
            "LoginUserID",
            sessionData.SessionList
        );

        if (userVar && userVar?.length) {
            userId = userVar[0].SessionValue;
        }
        if (!userId) {
            showMessage("Current user not found in session table");
            return;
        }

        const loginUserVar = FnGetSessionVariableFromStorage(
            "RequestedBy",
            "LoginShortName",
            sessionData.SessionList
        ) || FnGetSessionVariableFromStorage(
            "RequestedBy",
            "LoginUser",
            sessionData.SessionList
        );
        const loginUserName = (loginUserVar && loginUserVar.length > 0) ? loginUserVar[0].SessionValue : "";

        for (const item of selectedUsers ?? []) {
            const element = { ...item };

            element.StartDate = convertToYYYYMMDD(item.StartDate);
            element.EndDate = convertToYYYYMMDD(item.EndDate);
            DelegateUser.push(item.DelegateUser);

            if (!element.RecID) {
                const existingOriginal = originalDelegateUserList?.find(
                    (orig) => orig.DelegateUser === item.DelegateUser && orig.RecID
                );
                if (existingOriginal?.RecID) {
                    element.RecID = existingOriginal.RecID;
                }
            }

            if (!element.EntID) element.EntID = userId;
            if (!element.EntityName) element.EntityName = "User";
            if (!element._User && loginUserName) element._User = loginUserName;

            if (element.RecID) {
                recordsToUpdate.push(element);
            } else {
                recordsToAdd.push(element);
            }
        }

        const upsertRecords = [...recordsToAdd, ...recordsToUpdate];

        if (upsertRecords && upsertRecords.length > 0) {
            const payload = { ["PG.Delegate"]: upsertRecords };
            try {
                await new Promise<void>((resolve, reject) => {
                    axiosInterceptor({
                        url: EM.AddUpdateTableRecord,
                        data: { jsonString: JSON.stringify(payload) },
                        allowShowLoader: true,
                        setFetchData: (_resp, status) => {
                            if (status === "200") {
                                const logPayload: IFnCreateForensiclog = {
                                    logType: 'UserAction',
                                    GroupName: LogGroupName.ForensicLogTemplate,
                                    _Forensiclog: LogSubGroupName.Auth,
                                    SubGroupName: LogSubGroupName.Auth,
                                    LogName: LogName.DelegateToAnotherUser,
                                    actionObject: {
                                        users: DelegateUser.join(', ')
                                    },
                                    sessionContext: sessionData,
                                    statusBarContext: statusBarContext,
                                    RefTableItems: mainAppContext.refTableRecords
                                };
                                FnCreateForensiclog(logPayload);
                                const targetUsers = DelegateUser.filter(Boolean).join(', ');
                                const successMessage = targetUsers
                                    ? `Delegation saved successfully for ${targetUsers}.`
                                    : "Delegate settings saved successfully.";
                                showMessage(successMessage);
                                resolve();
                            } else {
                                reject(new Error("Save failed"));
                            }
                        }
                    }, statusBarContext);
                });
            } catch (error) {
                console.error('Failed to save delegate settings :', error);
                showMessage("Failed to save delegate settings.");
            }
        }

        getDelegateUserList();
    };

    const handleOnChangeYesNo = async (value: boolean, item: IDelegateUser) => {
        setUserList((current) => {
            return current.map((u) => {
                if (u.DelegateUser === item.DelegateUser) {
                    return {
                        ...u,
                        checked: value
                    };
                }
                return u;
            });
        });

        if (value) {
            // If user checks the card without changing dates, use default dates on item.
            // If user previously set dates, use currentSetDateData.
            const dateData = (currentSetDateData?.DelegateUser === item.DelegateUser)
                ? currentSetDateData
                : item;

            if (dateData.StartDate && dateData.EndDate) {
                const userToSave: IDelegateUser = {
                    ...item,
                    StartDate: dateData.StartDate,
                    EndDate: dateData.EndDate,
                    checked: true
                };
                await handleSaveDelegateUsers([userToSave], originalDelegateUsers);
            }
            setCheckedItem(item);
        } else {
            let userId: string | null = null;
            const userVar = FnGetSessionVariableFromStorage(
                "RequestedBy",
                "LoginUserID",
                sessionData.SessionList
            );
            if (userVar && userVar.length > 0) {
                userId = userVar[0].SessionValue;
            }

            const recId = item.RecID || originalDelegateUsers.find(u => u.DelegateUser === item.DelegateUser)?.RecID;
            const entId = item.EntID || userId;

            if (recId && entId) {
                axiosInterceptor({
                    url: EM.DeleteTableRecords,
                    data: {
                        tableName: "PG.Delegate",
                        recIDs: recId,
                        entIDs: entId
                    },
                    allowShowLoader: true,
                    setFetchData: (resp: unknown, status?: string) => {
                        if (status === '200') {
                            showMessage(`Delegation removed for ${item.DelegateUser}.`);
                            getDelegateUserList();
                        } else {
                            showMessage(`Failed to remove delegation for ${item.DelegateUser}.`);
                        }
                    }
                }, statusBarContext);
            }

            if (checkedItem?.DelegateUser === item.DelegateUser) {
                setCheckedItem(null);
            }
            if (currentSetDateData?.DelegateUser === item.DelegateUser) {
                setCurrentSetDateData(null);
            }
        }
    };

    const handleChangeDateRange = (value: { startDate: string, endDate: string }, item: IDelegateUser) => {
        setUserList((current) => {
            return current.map((u) => {
                if (u.DelegateUser === item.DelegateUser) {
                    return {
                        ...u,
                        StartDate: value.startDate,
                        EndDate: value.endDate
                    };
                }
                return u;
            });
        });
        setCurrentSetDateData({ ...item, StartDate: value.startDate, EndDate: value.endDate });
        if (checkedItem?.DelegateUser === item.DelegateUser || item.checked) {
            handleSaveDelegateUsers([{ ...item, StartDate: value.startDate, EndDate: value.endDate, checked: true }], originalDelegateUsers);
        }
    };

    const makeUserName = (userName: string, role?: string) => {
        if (role?.length) {
            return `${userName} (${role})`;
        } else {
            return userName;
        }
    };

    /** Builds CardLayout name/value rows for a delegate user card. */
    const buildDelegateUserCardFields = (
        delegateUserName: string,
        lastUpdated: string,
        role: string,
        loginUserName: string,
        contactName: string,
        email: string,
        emailOptin: unknown,
        phone: string,
        address: string,
        IsAuthorized: string,
        PhoneType: string,
        DelegateUserEnabled: boolean
    ): ICardLayoutField[] => {
        const fields: ICardLayoutField[] = [
            {
                Name: "Delegate User",
                Value: makeUserName(delegateUserName, role) || "—",
                Header: 1,
            },
        ];

        if (FnIsTruthyFlag(DelegateUserEnabled)) {
            fields.push({
                Name: "", Value: "", Header: 2, ValueContent: <Image uniqueName={"Enabled"}
                    source={<Check />}
                    tooltip="Enabled"
                    w={"var(--image-size-1)"} />
            });
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
                Value: `${phone} (${PhoneType})`,
                Group: "contact-row",
                Row: "inline",
            });
        }
        if (address) {
            fields.push({
                Name: "Address", Value: address,
                Row: "inline",
            });
        }
        if (lastUpdated) {
            fields.push({
                Name: "Last Updated",
                Value: FnConvertDateToUtcOrUtcToDate(lastUpdated, false, true),
                Row: "space-between",
            });
        }

        return fields;
    };

    return (
        <div className='nz-delegate-to-container'>
            <div className="nz-sub-header">
                <Label uniqueName={`${delegateToAnotherUserProps.uniqueName}-in`} label='Delegate to other Users' />
            </div>
            <div className='nz-del-card-container'>
                {isLoadingDelegateUsers
                    ?
                    <div className='nz-delegate-status-message'>Loading...</div>
                    :
                    userList && userList.length ? userList.map((item: IDelegateUser, index: number) => {
                        const delegateUserName = FnGetDisplayValue(item, ["DelegateUserShortName"]);
                        const IsAuthorized = item?.IsAuthorized ? "true" : "false";
                        const loginUserName = FnGetDisplayValue(item, ["_User", "LoginUser"]);
                        const delegateUserRole = FnGetDisplayValue(item, ["DelegateUserRole"]);
                        const lastUpdated = FnGetDisplayValue(item, ["LastUpdated"]);
                        const contactName = FnGetDisplayValue(item, ["FullName", "ContactName"]);
                        const email = FnGetDisplayValue(item, ["Email", "EmailAddress", "PrimaryEmail"]);
                        const emailOptin = FnGetDisplayValue(item, ["EmailOptin"]);
                        const phone = FnGetDisplayValue(item, ["Phone", "PhoneNumber", "Mobile"]);
                        const address = FnGetAddressDisplay(item);
                        const phonetype = FnGetDisplayValue(item, ["PhoneType"]);
                        const cardFields = buildDelegateUserCardFields(
                            delegateUserName || item.DelegateUser,
                            lastUpdated,
                            delegateUserRole,
                            loginUserName,
                            contactName,
                            email,
                            item.EmailOptin ?? emailOptin,
                            phone,
                            address,
                            IsAuthorized,
                            phonetype,
                            item.DelegateUserEnabled ?? false
                        );

                        return (
                            <CardLayout
                                key={item.tempId || item.RecID || `delegate-${index}`}
                                uniqueName={`${delegateToAnotherUserProps.uniqueName}-delegate-card-${index}`}
                                className="nz-del-card-main"
                                data={item}
                                fields={cardFields}
                                showCheckboxInHeader
                                checkboxName={delegateUserName || item.DelegateUser}
                                checkboxValue={item.checked}
                                onCheckboxChange={(value) => handleOnChangeYesNo(value, item)}
                                hideRightMouseMenu
                                ContentImage={{
                                    uniqueName: `${delegateToAnotherUserProps.uniqueName}-reporti-${index}`,
                                    source: (
                                        <User24x24
                                            size={FnGetCssVariable('--image-size-2')}
                                            fill="none"
                                            strokeWidth={1}
                                        />
                                    ),
                                    w: 'var(--image-size-2)',
                                    tooltip: "Background Task",
                                    type: "svg",
                                }}
                                renderForm={
                                    showStartEndDate ? muForSite.toLowerCase() === "europe" ? (
                                        <EuropeanDateRangeControl
                                            value={
                                                item.StartDate && item.EndDate
                                                    ? {
                                                        startDate: item.StartDate,
                                                        endDate: item.EndDate,
                                                    }
                                                    : undefined
                                            }
                                            onChange={(value) => {
                                                handleChangeDateRange(value, item);
                                            }}
                                        />
                                    ) : (
                                        <DateRangeControl
                                            value={
                                                item.StartDate && item.EndDate
                                                    ? {
                                                        startDate: item.StartDate,
                                                        endDate: item.EndDate,
                                                    }
                                                    : undefined
                                            }
                                            onChange={(value) => {
                                                handleChangeDateRange(value, item);
                                            }}
                                        />
                                    ) : undefined
                                }
                            />
                        );
                    }) : <div className='nz-delegate-status-message'>No Data Found</div>}
            </div>
        </div >
    );
};

export { DelegateToAnotherUser };

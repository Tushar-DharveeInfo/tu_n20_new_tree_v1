
import React, { useEffect, useRef, useState } from 'react'
import { handleContainerKeyDown } from '../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks'
import { axiosInterceptor } from '../../shared/interceptors/Interceptor'
import '../allcss/AppqaDelegate.css'
import { DELEGATE } from '../../shared/interceptors/EndPoints'
import { FnHandleAPIResponse } from '../../shared/allcommon/basic/FnHandleAPIResponse'
import { FnGetIconForUser } from '../allcommon/FnGetIconForUser'
import { IAppqaDelegate, IUserDelegation } from '../allinterface/IAppqaDelegate'
import { Label } from '../../shared/basic/label/Label'
import { CardLayout } from '../../shared/cardlayout/CardLayout'
import { ICardLayoutField } from '../../shared/allinterface/cardlayout/ICardLayout'
import { FnGetCssVariable } from '../../appcontainer/allcommon/FnGetCssVariable'
import { DelegateToAnotherUser } from './DelegateToAnotherUser'
import { UserProfileContainer } from './UserProfileContainer'
import { useSessionContext } from '../../shared/context/hooks/SessionHooks'
import { FnConvertDateToUtcOrUtcToDate } from '../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate'
import { FnIsTruthyFlag } from '../../shared/allcommon/basic/FnIsTruthyFlag'
import { Image } from '../../shared/basic/image/Image'
import { Check } from '@n20a/libicon'
import { getDateFormat } from '../../shared/context/contextandprovider/ExplorerTree'

const padDatePart = (value: number): string => value.toString().padStart(2, "0");

/**
 * A delegation range is a calendar date. When the value has no time, or the
 * time is 00:00:00, converting it to local time shifts the day backward.
 */
const isDateOnlyOrMidnight = (dateInput: string): boolean => {
    const timeMatch = dateInput.match(/(?:T|\s+)(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
    if (!timeMatch) {
        return true;
    }

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = timeMatch[3] == null ? 0 : Number(timeMatch[3]);
    return hours === 0 && minutes === 0 && seconds === 0;
};

const formatCalendarDate = (dateInput: string): string => {
    const isoParts = dateInput.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoParts) {
        const year = isoParts[1];
        const month = padDatePart(Number(isoParts[2]));
        const day = padDatePart(Number(isoParts[3]));
        return getDateFormat() === "dd/MM/yyyy"
            ? `${day}/${month}/${year}`
            : `${month}/${day}/${year}`;
    }

    const slashParts = dateInput.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashParts) {
        return `${padDatePart(Number(slashParts[1]))}/${padDatePart(Number(slashParts[2]))}/${slashParts[3]}`;
    }

    return dateInput;
};

const formatDelegationDate = (dateInput: string | undefined): string => {
    const value = dateInput?.trim() ?? "";
    if (!value) {
        return "";
    }

    if (isDateOnlyOrMidnight(value)) {
        return formatCalendarDate(value);
    }

    return FnConvertDateToUtcOrUtcToDate(value, false, true);
};

const AppqaDelegate = (appqaDelegateProps: IAppqaDelegate) => {
    const [delegatedUsers, setDelegatedUsers] = useState<IUserDelegation[]>([]);
    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();

    const impUserContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {

        const handleAllDelegatesForUserResponse = (response: unknown, status?: string) => {
            if (status === "200" && response && typeof response === "object" && 'jsonString' in response && response.jsonString) {
                let parsedData = FnHandleAPIResponse(response.jsonString, "Dataset");
                if (parsedData) {
                    setDelegatedUsers(parsedData);
                }
                else {
                    appqaDelegateProps.handleShowUserMessage?.("No users to impersonate", impUserContainerRef.current ?? undefined);
                    setDelegatedUsers([]);
                }
            }
        }
        axiosInterceptor({
            url: DELEGATE.GetAllDelegatesForUser,
            data: null,
            setFetchData: handleAllDelegatesForUserResponse,
        }, statusBarContext)

        return () => {
            setDelegatedUsers([]);
        }

    }, [])

    const handleDelegateUserClick = (
        _event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        user: IUserDelegation
    ) => {
        if (user.ImpersonatedUser && user.ImpersonatedUserID) {
            const sessionId = statusBarContext.userSessionId;
            if (sessionId?.length) {
                window.open(`${window.location.href.split('?')[0]}?isnew=true&id=${sessionId}&impuser=${user.ImpersonatedUser}&impuserid=${user.ImpersonatedUserID}`, "_blank", 'noopener=true');
            }
        }
    }

    function getSecondPartFirstLetter(path: string): string {
        if (!path?.trim()) {
            return "";
        }

        const parts = path.split("\\").filter((part) => part.length > 0);
        const rawPart = parts.length > 1 ? parts[1] : (parts[0] ?? "");
        const name = rawPart.replace(/^\.\\*/, "").trim();

        return name.charAt(0) ?? "";
    }

    const renderIconForUser = (userIconName: string) => {
        const Icon = FnGetIconForUser(userIconName);
        return <Icon size={'100%'}
            fill='none'
            strokeWidth={1} />
    }

    const buildImpersonateUserCardFields = (user: IUserDelegation): ICardLayoutField[] => {
        const fields: ICardLayoutField[] = [
            {
                Name: "",
                Value: user.ImpersonatedShortName + ` (${formatDelegationDate(user.StartDate)} - ${formatDelegationDate(user.EndDate)})` || "—",
                Header: 1,
            }
        ];
        if (user.Enabled) {
            fields.push({
                Name: "", Value: "", Header: 2, ValueContent: <Image uniqueName={"Enabled"}
                    source={<Check />}
                    tooltip="Enabled"
                    w={"var(--image-size-1)"} />
            });
        }

        if (user.Email) {
            fields.push({
                Name: "Email",
                Value: user.Email,
                Group: "email-row",
                Row: "inline",
            });
            fields.push({
                Name: "OptIn",
                Value: FnIsTruthyFlag(user.EmailOptin) ? "✓" : "X",
                Group: "email-row",
                Row: "inline",
            });
        }

        if (user.Phone) {
            fields.push({
                Name: "Phone",
                Value: `${user.Phone} (${user.PhoneType})`,
                Group: "contact-row",
                Row: "inline",
            });
        }
        if (user.Address) {
            fields.push({ Name: "Address", Value: user.Address.trim(), Row: "inline", });
        }

        return fields;
    };


    return (
        <div key={appqaDelegateProps.uniqueName} className="nz-delegate-user-container" tabIndex={1} onKeyDown={handleContainerKeyDown}>
            <Splitter tabIndex={-1} className='nz-wh-100' layout='horizontal'>
                <SplitterPanel tabIndex={-1} size={33} minSize={20}>
                    <div className='nz-impersonated-user-container' ref={impUserContainerRef}>
                        <div className="nz-sub-header">
                            <div className="nz-form-title-header">
                                <Label uniqueName={`${appqaDelegateProps.uniqueName}-in`} label='Available Users to Impersonate' />
                            </div>
                        </div>
                        <div className="nz-delegate-user-wrapper" data-card-layout-list role="listbox" aria-label="Available users to impersonate">
                            {delegatedUsers.map((user, index) => (
                                <CardLayout
                                    key={user.ImpersonatedUserID || `impersonate-${index}`}
                                    uniqueName={`${appqaDelegateProps.uniqueName}-impersonate-card-${index}`}
                                    className="nz-impersonate-user-card"
                                    data={user}
                                    fields={buildImpersonateUserCardFields(user)}
                                    hideRightMouseMenu
                                    onClick={(_event, data) => {
                                        handleDelegateUserClick(_event, data as IUserDelegation);
                                    }}
                                    ContentImage={{
                                        uniqueName: `${appqaDelegateProps.uniqueName}-useri-${index}`,
                                        source: renderIconForUser(`${getSecondPartFirstLetter(user.ImpersonatedUser)}128x128`),
                                        w: FnGetCssVariable('--image-size-3'),
                                        tooltip: user.ImpersonatedUser,
                                        type: "svg",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={66} minSize={50}>
                    <Splitter>
                        <SplitterPanel tabIndex={-1} minSize={25} size={25}>
                            <DelegateToAnotherUser
                                uniqueName={appqaDelegateProps.uniqueName + 'delegate-user'}
                                handleShowUserMessage={appqaDelegateProps.handleShowUserMessage}
                            />
                        </SplitterPanel>
                        <SplitterPanel tabIndex={-1} minSize={20}>
                            <UserProfileContainer uniqueName={'user-profile'} sessionList={sessionContext.SessionList} featureId={appqaDelegateProps.featureId} />
                        </SplitterPanel>
                    </Splitter>
                </SplitterPanel>
            </Splitter>
        </div>
    )
}
export default AppqaDelegate
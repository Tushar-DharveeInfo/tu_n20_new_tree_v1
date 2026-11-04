
import { useEffect, useState } from 'react'
import { IOpenSessions } from '../../allinterface/IAppqaTask';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { SESSION } from '../../../shared/interceptors/EndPoints';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { OptionsFilter } from '../../../shared/basic/optionsfilter/OptionsFilter';
import { Label } from '../../../shared/basic/label/Label';
import { CardLayout } from '../../../shared/cardlayout/CardLayout';
import { ICardLayoutField } from '../../../shared/allinterface/cardlayout/ICardLayout';
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';
import { AppQA } from '../../../constants/Feature';
import { IActionImageForSubMenu } from '../../../shared/allinterface/basic/IActionImageList';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { RightMouseMenuGrid } from '../../../constants/Feature';
import { FnCreateMessage } from '../../allcommon/FnCreateMessage';
import { LogGroupName, LogName, LogSubGroupName } from '../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { IFnCreateForensiclog } from '../../../appcontainer/allinterface/IFnCreateForensiclog';
import { FnCreateForensiclog } from '../../../appcontainer/allcommon/FnCreateForensiclog';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { IOptionItem } from '../../../shared/allinterface/basic/IOptionsFilter';

const DETAIL_FONT_SIZE = "12px";

const isSessionRecord = (value: unknown): value is Record<string, any> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const formatSessionDateTime = (value: unknown): string =>
    value ? FnConvertDateToUtcOrUtcToDate(String(value), false) : "";

/** Builds CardLayout name/value rows from an open session record. */
const buildOpenSessionCardFields = (
    item: Record<string, any>,
    uniqueName: string,
    index: number
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "",
            Value: item.State || "—",
            Header: 1,
            ValueContent: (
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                    <Label
                        uniqueName={`${uniqueName}-label-state-${index}`}
                        label={`${item.State ?? ""}`}
                        fontWeight="bold"
                    />
                    &nbsp;&nbsp;
                    <Label
                        uniqueName={`${uniqueName}-label-session-id-${index}`}
                        label={`SessionID: ${item.UserSessionID ?? ""}`}

                    />
                </div>

            ),
        },
        {
            Name: "",
            Value: item.UserSessionNameID || "—",
            Header: 2,
            ValueContent: (
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                    <Label
                        uniqueName={`${uniqueName}-label-created-${index}`}
                        label={`Created: ${formatSessionDateTime(item.DateCreated)} `}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                </div>
            ),
        }
        ,
        {
            Name: "",
            Value: item.ShortName || "",
            Group: "session-footer",
            ValueContent: (
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--spacing-1)" }}>

                    <Label
                        uniqueName={`${uniqueName}-label-user-${index}`}
                        label={`${item.UserSessionNameID ?? ""}`}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-user-${index}`}
                        label={`User : ${item.ShortName ?? ""}`}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                </div>
            ),
        },

        {
            Name: "",
            Value: formatSessionDateTime(item.LastUsed),
            Group: "session-footer",
            Row: "space-between",
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-last-used-${index}`}
                    label={`LastUsed: ${formatSessionDateTime(item.LastUsed)}`}
                    fontSize={DETAIL_FONT_SIZE}
                />
            ),
        },
    ];

    return fields;
};

let savedOpenSessionFilter = "";

const OpenSessions = (openSessionsProps: IOpenSessions) => {
    const activeFilter = openSessionsProps.savedFilter ?? savedOpenSessionFilter ?? "";
    const [sessionList, setSessionList] = useState<Record<string, any>[]>([]);
    const [sessionListOriginal, setSessionListOriginal] = useState<Record<string, any>[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [sessionCount, setSessionCount] = useState(0);
    const [filterSelectedSession, setFilterSelectedSession] = useState(activeFilter);
    const [userListOptions, setUserListOptions] = useState<IOptionItem[]>([]);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
    const [menu, setMenu] = useState<Record<string, any> | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();

    useEffect(() => {
        fillOpenSession();
    }, [openSessionsProps.featureId]);

    const fillOpenSession = async () => {
        try {
            setIsLoading(true);

            axiosInterceptor(
                {
                    url: SESSION.GetOpenSession,
                    data: {},
                    setFetchData: (data: unknown, status?: string | number) => {
                        try {
                            let varTaskList: Record<string, any>[] = [];

                            if ((status === "200" || status === 200) && data && typeof data === "object" && "jsonSessionOutput" in data && data.jsonSessionOutput) {

                                let varResp: Record<string, any> = {};

                                try {
                                    varResp = data.jsonSessionOutput && typeof data.jsonSessionOutput === "string" ? FnParseJsonSafely(data.jsonSessionOutput as string) : {};
                                } catch (err) {
                                    console.error("JSON parse error:", err);
                                    varResp = {};
                                }

                                const session = varResp?.Sessions;
                                const rowData = session && Array.isArray(session) && session[0]?.UserSessions || [];

                                varTaskList.push(...rowData);

                                let openSessions = 0;
                                if (varTaskList && varTaskList.length > 0) {
                                    for (let index = 0; index < varTaskList.length; index++) {
                                        const element = varTaskList[index];
                                        if (element?.State === "Open") {
                                            openSessions++;
                                        }
                                    }
                                }


                                let sortedList: Record<string, any>[] = [];

                                try {
                                    sortedList = [...varTaskList].sort((a, b) => {
                                        const userCompare = (a?.UserName || "").localeCompare(b?.UserName || "");
                                        if (userCompare !== 0) {
                                            return userCompare;
                                        }

                                        const dateA = new Date(a?.LastUsed || 0).getTime();
                                        const dateB = new Date(b?.LastUsed || 0).getTime();
                                        return dateB - dateA;
                                    });
                                } catch (err) {
                                    console.error("Sorting error:", err);
                                }

                                setSessionListOriginal(sortedList);
                                const isAll = !activeFilter || activeFilter.toLowerCase() === "all";
                                if (!isAll) {
                                    const filtered = sortedList.filter(
                                        (item: Record<string, any>) => item.UserName?.toLowerCase() === activeFilter.toLowerCase()
                                    );
                                    setSessionList(filtered);
                                    setSessionCount(filtered?.length || 0);
                                    setFilterSelectedSession(activeFilter);
                                } else {
                                    setSessionList(sortedList);
                                    setSessionCount(varTaskList.length || 0);
                                    setFilterSelectedSession("");
                                }


                                let uniqueUsers: Record<string, any>[] = [];

                                try {
                                    uniqueUsers = Array.from(
                                        new Map(
                                            varTaskList.map((item: Record<string, any>) => [
                                                item?.UserName,
                                                item
                                            ])
                                        ).values()
                                    );
                                } catch (err) {
                                    console.error("Unique user mapping error:", err);
                                }

                                let formattedUsers: IOptionItem[] = [];

                                try {
                                    formattedUsers = [
                                        {
                                            uniqueName: "All",
                                            isRenderAsForm: true,
                                            label: "All",
                                            value: isAll ? "1" : "0",
                                            isDefault: isAll,
                                            tooltip: "All Users",
                                            disabled: false
                                        },
                                        ...uniqueUsers.map((item: Record<string, any>) => {
                                            const isMatch = !isAll && item?.UserName?.toLowerCase() === activeFilter.toLowerCase();
                                            return {
                                                uniqueName: item?.UserName,
                                                isRenderAsForm: true,
                                                label: item?.UserName,
                                                value: isMatch ? "1" : "0",
                                                isDefault: isMatch,
                                                tooltip: item?.UserName,
                                                disabled: false
                                            };
                                        })
                                    ];
                                } catch (err) {
                                    console.error("User formatting error:", err);
                                }

                                setUserListOptions(formattedUsers);
                                openSessionsProps?.handleOpenSessionCount?.(varTaskList.length || 0);


                            } else {
                                setSessionList([]);

                            }

                        } catch (err) {
                            console.error("setFetchData error:", err);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                },
                statusBarContext
            );

        } catch (error) {
            console.error("fillOpenSession error:", error);
            setIsLoading(false);

        }
    };
    const handleSessionFilterSelect = (value: Record<string, any>): void => {
        const selectedVal = value.uniqueName === "All" ? "" : value.uniqueName;
        savedOpenSessionFilter = selectedVal;
        openSessionsProps.handleFilterChange?.(selectedVal);
        if (value.uniqueName === "All") {
            setSessionList(sessionListOriginal)
            setSessionCount(sessionListOriginal.length || 0)
            setFilterSelectedSession("")
        } else {
            const filtered = sessionListOriginal?.filter(
                (item: Record<string, any>) => item.UserName?.toLowerCase() === value.uniqueName?.toLowerCase()
            );
            setSessionList(filtered);
            setSessionCount(filtered?.length || 0);
            setFilterSelectedSession(value.label)
        }
    }

    const handleOpenSessionNodeMenu = async (
        menu: IActionImageForSubMenu,
        selectedRow: Record<string, any>,
        containerName: string
    ) => {
        setSelectedRow(selectedRow);
        setMenu(menu);
        if (selectedRow && containerName === "open_session" && (menu?.payload && menu?.payload.Label === RightMouseMenuGrid.OSClose.toString()
            || menu?.payload && menu?.payload.Label === RightMouseMenuGrid.OSResume.toString()
            || menu?.payload && menu?.payload.Label === RightMouseMenuGrid.OSPause.toString())) {

            let errorMsg = `${menu?.payload && menu?.payload.Label} ${selectedRow?.UserSessionNameID}`;
            // Are you sure you want to {#status}?
            const result = await FnCreateMessage('audit', '151', errorMsg, statusBarContext, undefined, undefined)
            if (result?.length) {
                setIsConfirmOpen(true);
                setConfirmMessage(result)
            }
        }
    }

    const handleNodeMenuOnClick = (
        menu: IActionImageForSubMenu,
        selectedRow: unknown,
        containerName: string
    ): void => {
        if (!isSessionRecord(selectedRow)) {
            return;
        }

        void handleOpenSessionNodeMenu(menu, selectedRow, containerName);
    }
    const createLogForStatusChange = (status: string, taskName: string) => {
        const payload: IFnCreateForensiclog = {
            logType: 'UserAction',
            GroupName: LogGroupName.ForensicLogTemplate,
            _Forensiclog: LogSubGroupName.AppQatask,
            SubGroupName: LogSubGroupName.AppQatask,
            LogName: LogName.task,
            actionObject: {
                taskName: taskName,
                StatusName: status,
                taskType: "Open Session"
            },
            sessionContext: sessionContext,
            statusBarContext: statusBarContext,
            RefTableItems: mainAppContext.refTableRecords
        }
        FnCreateForensiclog(payload)
    }

    const createApiCallForSession = async (menu: string, UserSessionID: string, Name: string) => {
        if (menu === RightMouseMenuGrid.OSClose.toString()) {
            await axiosInterceptor({
                url: SESSION.CloseSession,
                data: { foreClose: false, sessionId: UserSessionID },
                setFetchData: (resp: unknown, status?: string) => {
                    if (resp !== undefined && status === "200") {
                        createLogForStatusChange(RightMouseMenuGrid.OSClose, Name)
                        fillOpenSession();
                    }
                }

            }, statusBarContext)
        } else if (menu === RightMouseMenuGrid.OSResume.toString()) {
            await axiosInterceptor({
                url: SESSION.ResumeSession,
                data: {
                    sessionId: UserSessionID,
                },
                setFetchData: (resp: unknown, status?: string) => {
                    if (resp !== undefined && status === "200") {
                        createLogForStatusChange(RightMouseMenuGrid.OSResume, Name)
                        fillOpenSession();
                    }
                }
            }, statusBarContext)
        } else if (menu === RightMouseMenuGrid.OSPause.toString()) {
            let payload = {
                sessionId: UserSessionID,
            }
            await axiosInterceptor({
                url: SESSION.PauseSession,
                data: payload,
                setFetchData: (resp: unknown, status?: string) => {
                    if (resp !== undefined && status === "200") {
                        createLogForStatusChange(RightMouseMenuGrid.OSPause, Name)
                        fillOpenSession();
                    }

                }

            }, statusBarContext)
        }
    }
    const handleConfirmYesClick = (): void => {
        if (selectedRow?.UserSessionID) {
            if (menu?.payload.Label === RightMouseMenuGrid.OSClose.toString() && selectedRow?.UserSessionID) {

                createApiCallForSession(menu?.payload.Label, selectedRow?.UserSessionID, selectedRow.UserSessionNameID);
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.OSResume.toString() && selectedRow.UserSessionNameID) {
                createApiCallForSession(menu?.payload.Label, selectedRow?.UserSessionID, selectedRow.UserSessionNameID);
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.OSPause.toString() && selectedRow?.UserSessionID) {
                createApiCallForSession(menu?.payload.Label, selectedRow?.UserSessionID, selectedRow.UserSessionNameID);
            }
        }
        setConfirmMessage("");
        setIsConfirmOpen(false)
    }

    return (
        <div>
            {sessionList ?
                <div id='opensession' className={"nz-OnetoOne-Grid nz-hw-prop-table-multi BackgroundSessionTasks h-100 nz-session-list-container"}>
                    <div className='nz-sub-header'>
                        {sessionListOriginal && sessionListOriginal?.length > 0 ?
                            <OptionsFilter showIcon={true} uniqueName={'app-qa-filter'} container={'ap-filter'}
                                handleSelect={handleSessionFilterSelect}
                                options={userListOptions}
                                disableUncheck={true}
                            />
                            :
                            null
                        }
                        <Label uniqueName={`${openSessionsProps.uniqueName}-task-header`} label={`Active Sessions Except Current Session ${sessionList.length > 0 ? `(${sessionCount})` : ""} ${filterSelectedSession ? `(${filterSelectedSession})` : ""}`} />
                    </div>
                    {isLoading ? (
                        <div className="nz-loading-message">Loading...</div>
                    ) : !sessionList?.length ? (
                        <div className="nz-no-data-message">Sessions are not found to display</div>
                    ) : (
                        <>
                            <div key={openSessionsProps.uniqueName} className="nz-appqa-task-container">
                                {sessionList.map((item: Record<string, any>, index: number) => {
                                    const cardFields = buildOpenSessionCardFields(
                                        item,
                                        openSessionsProps.uniqueName ?? "open-session",
                                        index
                                    );

                                    return (
                                        <CardLayout
                                            key={`task-session-card-${index}`}
                                            uniqueName={`opensession${index}`}
                                            className="nz-open-session-card-item"
                                            data={item}
                                            fields={cardFields}
                                            featureId={AppQA.Task}
                                            featureData={openSessionsProps.featureData}
                                            containerName="open_session"
                                            handleNodeMenuOnClick={handleNodeMenuOnClick}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                :
                <></>
            }
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'appqatask-confirm'}
                message={confirmMessage}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={function (): void {
                    setConfirmMessage("");
                    setIsConfirmOpen(false)
                }} />
        </div>
    )
}

export { OpenSessions }
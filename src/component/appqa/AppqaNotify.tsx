
import { useEffect, useState } from "react"
import { handleContainerKeyDown } from '../shared/allcommon/basic/FnHandleContainerKeyDown';
import { Splitter, SplitterPanel } from "primereact/splitter"
import { INote, Notes } from "@n20a/libavnotes"
import { Check, User24x24 } from "@n20a/libicon"
import { useStatusBarContext } from "../shared/context/hooks/StatusBarHooks.ts"
import { axiosInterceptor } from "../shared/interceptors/Interceptor.ts"
import './allcss/AppqaNotify.css'
import { ALERT, AUTH, FS } from "../shared/interceptors/EndPoints.ts"
import { IListItem } from "../shared/allinterface/basic/ICheckedListPanel.ts"
import { IAlertProfileItem } from "../shared/context/allinterface/IAlertProfile.ts"
import { IAppqaNotify } from "./allinterface/IAppqaNotify.ts"
import { YesNoFormContainer } from "../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx"
import { useMainAppContext } from "../shared/context/hooks/MainAppHooks.ts"
import { Label } from "../shared/basic/label/Label.tsx"
import { FnConvertBase64Blob } from "../shared/allcommon/sidebar/FnConvertBase64Blob.ts"
import { FnGenerateUID } from "../shared/allcommon/settingsform/FnGenerateUID.ts"
import { FnGetRefListForLibControl } from "./allcommon/FnGetRefListForLibControl.ts"
import { ComboBoxControl, IOptionItem } from "@n20a/libform"
import { SettingSubgroups, SettingGroups } from "../constants/Feature.ts"
import { SettingApNames } from "../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer.ts"
import { FnGetApplicationParameter } from "../shared/allcommon/basic/FnGetApplicationParameter.ts"
import { FnCreateMessage } from "./allcommon/FnCreateMessage.ts"
import { FnGetCssVariable } from "../appcontainer/allcommon/FnGetCssVariable.ts"
import { FnGetFileCategoryFromFile, FnGetExtensionFromMime } from "../appcontainer/allcommon/FnGetFileCategoryFromFile.ts"
import { CardLayout } from "../shared/cardlayout/CardLayout.tsx"
import { ICardLayoutField } from "../shared/allinterface/cardlayout/ICardLayout.ts"
import { Image } from "../shared/basic/image/Image.tsx"
import { FnIsTruthyFlag } from "../shared/allcommon/basic/FnIsTruthyFlag.ts"
import { FnGetAddressDisplay, FnGetDisplayValue } from "./allcommon/FnGetAddressDisplay.ts"

const parseJsonValue = (value: unknown): unknown => {
    if (typeof value !== "string") {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const findUsersArray = (value: unknown): IListItem[] => {
    try {
        const parsedValue = parseJsonValue(value);

        if (Array.isArray(parsedValue)) {
            if (parsedValue.some(item => item && typeof item === "object" && "UserName" in item)) {
                return (parsedValue as IListItem[])
                    .filter(user => user.Enabled === true)
                    .sort((a, b) =>
                        (a.UserName?.trim() ?? "").localeCompare(
                            b.UserName?.trim() ?? "",
                            undefined,
                            { sensitivity: "base" }
                        )
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

const makeUserName = (userName: string, role?: string) => {
    if (role?.length) {
        return `${userName} (${role})`;
    } else {
        return userName
    }
}

/** Builds CardLayout name/value rows from a user list item. */
const buildUserCardFields = (
    item: IListItem,
    userName: string,
    basicRole: string,
    description: string,
    contactName: string,
    email: string,
    emailOptin: string,
    phone: string,
    address: string,
    IsAuthorized: string,
    phoneType: string
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "Username",
            Value: makeUserName(userName, basicRole) || "—",
            Header: 1,
        },
    ];
    if (item.Enabled) {
        fields.push({
            Name: "", Value: "", Header: 2, ValueContent: <Image uniqueName={"Enabled"}
                source={<Check />}
                tooltip="Enabled"
                w={"var(--image-size-1)"} />
        });
    }
    if (description) {
        fields.push({ Name: "Description", Value: description });
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
    if (contactName || phone) {
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
    }
    if (address) {
        fields.push({ Name: "Address", Value: address, Row: "inline" });
    }

    return fields;
};

const AppqaNotify = (appqaNotifyProps: IAppqaNotify) => {
    const [userList, setUserList] = useState<IListItem[]>([]);
    const [checkedUserList, setCheckedUserList] = useState<IListItem[]>();
    const [severity, setSeverity] = useState<string>("Critical");
    const [alertProfiles, setAlertProfiles] = useState<IAlertProfileItem[]>();
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>();
    const [noteDetails, setNoteDetails] = useState<INote>();
    const [optionData, setOptionData] = useState<IOptionItem[]>();
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
    const [refreshToken, setRefreshToken] = useState(0);
    const [maxRecordingTime, setMaxRecordingTime] = useState<{
        maxAudioRecordingTime: number,
        maxVideoRecordingTime: number
    }>()
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();

    const syncCheckedUsers = (users: IListItem[]) => {
        setCheckedUserList(users.filter((item) => item.checked));
    };

    const handleUserCheckedChange = (checked: boolean, userId: string) => {
        setUserList((current) => {
            const updated = current.map((user) =>
                user.id === userId ? { ...user, checked } : user
            );
            syncCheckedUsers(updated);
            return updated;
        });
    };

    useEffect(() => {
        const setNodeDetails = async () => {
            const getConfigValue = (name: string) =>
                FnGetApplicationParameter(
                    SettingGroups.AdminConfiguration,
                    SettingSubgroups.Configure,
                    mainAppContext.apRecords,
                    undefined,
                    name
                );

            const maxAudioRecordingTimeRes = getConfigValue(
                SettingApNames.maxAudioRecordingTime
            );

            const maxVideoRecordingTimeRes = getConfigValue(
                SettingApNames.maxVideoRecordingTime
            );
            const maxAudioRecordingTime = maxAudioRecordingTimeRes.length && Number(maxAudioRecordingTimeRes[0]?.Value || 1)
            const maxVideoRecordingTime = maxVideoRecordingTimeRes.length && Number(maxVideoRecordingTimeRes[0]?.Value || 1)

            setMaxRecordingTime({
                maxAudioRecordingTime: maxAudioRecordingTime * 1000,
                maxVideoRecordingTime: maxVideoRecordingTime * 1000
            })
            setNoteDetails(
                {
                    maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
                    maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds
                    noteId: "1",
                    noteTitle: "",
                    notecontent: "",
                    notefile: undefined,
                    noteaudio: undefined,
                    notevideo: undefined,
                    noteCreatedAt: new Date(),
                });
        }
        setNodeDetails()

    }, [mainAppContext.apRecords])

    useEffect(() => {
        if (mainAppContext.alertProfileRecords.length) {
            setAlertProfiles(mainAppContext.alertProfileRecords);
        }
    }, [mainAppContext.alertProfileRecords])

    useEffect(() => {
        FnGetRefListForLibControl('refAlertSeverity', 'severity', mainAppContext.refTableRecords, statusBarContext).then((options) => {
            if (options) {
                setOptionData(options)
            }
            else {
                setOptionData([])
            }
        })
    }, [mainAppContext.refTableRecords.length])

    useEffect(() => {
        const handleGetUsersApiResponse = (response: unknown, status?: string) => {
            setIsLoadingUsers(false);
            if (status !== "200" || !response || typeof response !== "object") {
                setUserList([]);
                setCheckedUserList([]);
                return;
            }
            const usersJson = "usersJson" in response
                ? (response as { usersJson: unknown }).usersJson
                : response;
            const userData = findUsersArray(usersJson);
            if (userData.length > 0) {
                const users: IListItem[] = userData.map((element) => ({
                    ...element,
                    label: String(
                        element.Shortname
                        ?? element.LoginUser
                        ?? element.label
                        ?? ""
                    ),
                    id: String(element.EntID ?? element.id ?? ""),
                    checked: false,
                    selected: false
                }));

                setUserList(users);
                setCheckedUserList([]);
            } else {
                setUserList([]);
                setCheckedUserList([]);
                appqaNotifyProps.handleShowUserMessage?.("User list not found.");
            }
        };

        setIsLoadingUsers(true);
        axiosInterceptor({
            url: AUTH.GetUsers,
            data: {},
            allowShowLoader: true,
            setFetchData: handleGetUsersApiResponse
        }, statusBarContext).catch(() => {
            setIsLoadingUsers(false);
            setUserList([]);
            setCheckedUserList([]);
            appqaNotifyProps.handleShowUserMessage?.("Failed to load users.");
        });
    }, []);

    const handleValueChange = (newValue: string, name: string, isDefault?: boolean | undefined) => {
        setSeverity(newValue);
    }

    const handleApiForMessageSending = async (EntID: string, messageText: string, _AlertProfile: unknown, fileUID?: string, fileType?: string) => {
        axiosInterceptor({
            url: ALERT.CreateAlertMessage,
            data: {
                alertID: EntID
            },
            setFetchData: (handleCreateAlertMessageResponse: unknown, status?: string) => {
                if (status === "200" && handleCreateAlertMessageResponse && typeof handleCreateAlertMessageResponse === "object" && 'finalMessage' in handleCreateAlertMessageResponse && handleCreateAlertMessageResponse.finalMessage) {

                    const html = handleCreateAlertMessageResponse.finalMessage as string;
                    try {

                        if (checkedUserList?.length) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, "text/html");

                            let form = doc.querySelector("#userList");
                            if (!form) {
                                form = doc.createElement("form");
                                form.id = "userList";
                                doc.body.appendChild(form)
                            }
                            // Append hidden inputs
                            checkedUserList.forEach((user: any, index: number) => {
                                const extraHTML = `<input type="hidden" name="user${index + 1}" value="${user.label}" />`;
                                form.insertAdjacentHTML("beforeend", extraHTML);
                            });

                            //  Insert message into a div
                            let msgDiv = doc.querySelector("#messageContent"); // Example target div with id
                            if (!msgDiv) {
                                // If div doesn’t exist, create one at the end of body
                                msgDiv = doc.createElement("div");
                                msgDiv.id = "messageContent";
                                doc.body.appendChild(msgDiv);
                            }
                            msgDiv.textContent = messageText;

                            // Convert back to string
                            const updatedHTML = doc.body.innerHTML;

                            axiosInterceptor(
                                {
                                    url: ALERT.AddToAlertQueue,
                                    data: {
                                        "alertQueueName": "",
                                        "messageSource": "Message",
                                        "message": updatedHTML,
                                        "alertSeverity": severity,
                                        "alertProfileName": _AlertProfile,
                                        "entID": null,
                                        "entityName": "",
                                        "fileUID": fileUID ? fileUID : undefined,
                                        "FileType": fileType ? fileType : undefined
                                    },
                                    setFetchData: (
                                        addTableRecordApiResponse: unknown,
                                        status?: string
                                    ) => {
                                        if (status === "200" &&
                                            addTableRecordApiResponse) {
                                            setIsConfirmOpen(true)
                                            setConfirmMessage("Message sent successfully.")
                                        }
                                        else {
                                            appqaNotifyProps.handleShowUserMessage?.("Something went wrong in send message.")
                                        }
                                    }
                                },
                                statusBarContext
                            );
                        }
                    } catch (error) {
                        console.error('Error in create alert message :', error);
                        appqaNotifyProps.handleShowUserMessage?.("Something went wrong in create message from template.")
                    }
                }
            }
        }, statusBarContext)
    }

    const handleSendMessage = async (message: INote) => {
        if (!checkedUserList?.length) {
            setNoteDetails(message);
            const userMsg = await FnCreateMessage("Notify", "9", "", statusBarContext);
            appqaNotifyProps.handleShowUserMessage?.(userMsg || "Please! Select users to send message");
            setRefreshToken(prev => prev + 1);
            return;
        }
        const alertProfile = alertProfiles?.find(
            (item) => item._AlertProfile === "SendMessage"
        );
        if (!alertProfile || !alertProfile.HTML || !alertProfile.EntID) {
            appqaNotifyProps.handleShowUserMessage?.("Alert profile record not found to send message")
            return
        }
        function getFirst10Chars(text: string): string {
            if (!text) return "";
            return text.substring(0, 10);
        }
        let base64String;
        let fileName;
        let fileType: string = "Message";
        let fileObject;
        if (message.notevideo) {
            base64String = await FnConvertBase64Blob(message.notevideo, "toBase64", message.notevideo.type)
            fileName = getFirst10Chars(message.notecontent)
            fileType = "Video"
            fileObject = message.notevideo
        } else if (message.notefile) {
            base64String = await FnConvertBase64Blob(message.notefile, "toBase64", message.notefile.type)
            fileName = message.notefile && (message.notefile as Record<string, any>).name ? (message.notefile as Record<string, any>).name : getFirst10Chars(message.notecontent)

            fileType = "image"
            fileObject = message.notefile
        } else if (message.noteaudio) {
            base64String = await FnConvertBase64Blob(message.noteaudio, "toBase64", message.noteaudio.type)
            fileName = getFirst10Chars(message.notecontent)

            fileType = "Audio"
            fileObject = message.noteaudio
        }


        if (!message.notefile && !message.notevideo && !message.noteaudio) {
            handleApiForMessageSending(alertProfile.EntID, message.notecontent, alertProfile._AlertProfile);

        } else {
            //upload file 
            let entid = FnGenerateUID();

            await axiosInterceptor({
                url: FS.UploadFileStream,
                data: {
                    "fileCategory": FnGetFileCategoryFromFile(fileObject as Blob),
                    "fileExtension": FnGetExtensionFromMime(fileObject?.type as string, fileName),
                    "fileBlob": base64String,
                    "fileName": fileName,
                    "prefix": "AlertProfile",
                    EntityName: "AlertProfile",
                    EntID: entid
                },
                allowShowLoader: true,
                setFetchData: async (uploadFileStreamResponse: unknown, status?: string) => {
                    if (status === "200" && uploadFileStreamResponse && typeof uploadFileStreamResponse === 'object' && 'fileUID' in uploadFileStreamResponse) {
                        handleApiForMessageSending(alertProfile.EntID, message.notecontent, alertProfile._AlertProfile, uploadFileStreamResponse.fileUID as string, fileType);
                    }
                    else {
                        appqaNotifyProps.handleShowUserMessage?.("Something went wrong in send message.")
                    }
                }

            }, statusBarContext)
        }
    };

    const handleOkButtonClick = () => {
        setIsConfirmOpen(false);
        const users = userList.map((element) => ({
            ...element,
            label: element._User ?? element.UserName ?? element.label ?? "",
            id: String(element.EntID ?? element.id ?? ""),
            checked: false,
            selected: false
        }));
        setUserList(users);
        setCheckedUserList([]);
        setNoteDetails(
            {
                maxAudioRecordingTime: maxRecordingTime?.maxAudioRecordingTime ?? 1000, // milliseconds, load from _ap and set here
                maxVideoRecordingTime: maxRecordingTime?.maxVideoRecordingTime ?? 1000, // milliseconds
                noteId: "1",
                noteTitle: "",
                notecontent: "",
                notefile: undefined,
                noteaudio: undefined,
                notevideo: undefined,
                noteCreatedAt: new Date(),
            });
    };


    function handleDeleteNotes(objectType: "audio" | "video" | "file", objectData?: Blob | File | undefined): void {
        if (import.meta.env.DEV)
            console.log("handleDeleteNotes", objectType, objectData)
    }
    return (
        <div className="nz-w-100 nz-h-100 nz-appqa-notify-container" tabIndex={1} onKeyDown={handleContainerKeyDown} key={appqaNotifyProps.uniqueName}>
            <div className='nz-sub-header'>
                <Label uniqueName={`${appqaNotifyProps.uniqueName}-task-header`} label={appqaNotifyProps.headerText} />
            </div>
            <Splitter tabIndex={-1} className='nz-w-100 nz-h-100' >
                <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-appqa-notify-left-pane nz-pane-1">
                    <div className="nz-w-100 nz-severity-combobox-container">
                        <ComboBoxControl options={optionData ?? []} label={"Severity"} value={severity} required={true}
                            onChange={(value) => {
                                handleValueChange(value?.toString() ?? "", 'severity')
                            }} />
                    </div>
                    <div className="nz-w-100 nz-h-100 nz-messagebox-container">
                        {noteDetails &&
                            <Notes {...noteDetails} key={refreshToken} sendTooltip={"Send notification"} handleDelete={handleDeleteNotes} sendNote={handleSendMessage} />
                        }
                    </div>
                </SplitterPanel>
                <SplitterPanel tabIndex={-1} size={25} minSize={20} className={`nz-d-flex-column nz-justify-center nz-appqa-notify-right-pane nz-pane-2`} >
                    <div
                        className="nz-message-user-card-list"
                    >
                        <div className='nz-sub-header'>
                            <Label
                                uniqueName={`${appqaNotifyProps.uniqueName}-user-header`}
                                label="Select users to receive message"
                                fontWeight="bold"
                            />
                        </div>
                        <div className="nz-message-user-card-scroll">
                            {isLoadingUsers ? (
                                <div className="nz-message-user-card-status">Loading…</div>
                            ) : userList.length ? (
                                userList.map((item, index) => {
                                    const userName = FnGetDisplayValue(item, [
                                        "UserName",
                                        "label"
                                    ]);
                                    const IsAuthorized = item?.IsAuthorized ? "true" : "false";
                                    const basicRole = FnGetDisplayValue(item, ["Role", "RoleName"]);
                                    const description = FnGetDisplayValue(item, [
                                        "Desc250",
                                        "Description"
                                    ]);
                                    const contactName = FnGetDisplayValue(item, [
                                        "FullName",
                                        "ContactName"
                                    ]);
                                    const email = FnGetDisplayValue(item, [
                                        "Email",
                                    ]);
                                    const emailOptin = FnGetDisplayValue(item, ["EmailOptin"]);
                                    const phone = FnGetDisplayValue(item, [
                                        "Phone",
                                        "Mobile"
                                    ]);
                                    const address = FnGetAddressDisplay(item);
                                    const phonetype = FnGetDisplayValue(item, ["PhoneType"]);
                                    const cardFields = buildUserCardFields(
                                        item,
                                        userName,
                                        basicRole,
                                        description,
                                        contactName,
                                        email,
                                        emailOptin,
                                        phone,
                                        address,
                                        IsAuthorized,
                                        phonetype
                                    );
                                    return (
                                        <CardLayout
                                            key={`${appqaNotifyProps.uniqueName}-user-${item.id}`}
                                            uniqueName={`${appqaNotifyProps.uniqueName}-user-card-${index}`}
                                            className="nz-message-user-card-main"
                                            data={item}
                                            fields={cardFields}
                                            showCheckboxInHeader
                                            checkboxName={`${appqaNotifyProps.uniqueName}-user-check-${item.id}`}
                                            checkboxValue={!!item.checked}
                                            onCheckboxChange={(checked) =>
                                                handleUserCheckedChange(checked, item.id)
                                            }
                                            hideRightMouseMenu
                                            ContentImage={{
                                                uniqueName: `${appqaNotifyProps.uniqueName}-user-image-${index}`,
                                                source: (
                                                    <User24x24
                                                        size={FnGetCssVariable("--image-size-2")}
                                                        fill="none"
                                                        strokeWidth={1}
                                                    />
                                                ),
                                                w: "var(--image-size-2)",
                                                tooltip: "User",
                                                type: "svg"
                                            }}
                                        />
                                    );
                                })
                            ) : (
                                <div className="nz-message-user-card-status">
                                    No Data Found
                                </div>
                            )}
                        </div>
                    </div>
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={`${appqaNotifyProps.uniqueName}-confirm-ok`}
                message={confirmMessage ?? ""}
                showOkButton={true}
                handleOkButtonClick={handleOkButtonClick}
                handleYesButtonClick={function (): void {

                }} handleNoButtonClick={function (): void {

                }} />
        </div>
    )
}
export default AppqaNotify 
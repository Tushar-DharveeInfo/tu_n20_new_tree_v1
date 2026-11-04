
import { MouseEvent, useEffect, useRef, useState } from 'react';
import { handleContainerKeyDown, handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from '../shared/allcommon/basic/FnHandleContainerKeyDown';
import { axiosInterceptor } from '../shared/interceptors/Interceptor.ts';
import { useStatusBarContext } from '../shared/context/hooks/StatusBarHooks.ts';
import { useMainAppContext } from '../shared/context/hooks/MainAppHooks.ts';
import './allcss/AppqaReminder.css'
import { IAppqaReminder } from './allinterface/IAppqaReminder.ts';
import { EM, FS, LOG, MISC, NODE, REMINDER } from '../shared/interceptors/EndPoints.ts';
import { FnHandleAPIResponse } from '../shared/allcommon/basic/FnHandleAPIResponse.ts';
import { OptionsFilter } from '../shared/basic/optionsfilter/OptionsFilter.tsx';
import { Label } from '../shared/basic/label/Label.tsx';
import { FnConvertDateToUtcOrUtcToDate } from '../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts';
import { Attach24x24, Close24x24, Download24x24, HideSidebar24x24, Info24x24, Mic24x24, OpenSidebar24x24, Reminder24x24, Video24x24 } from '@n20a/libicon';
import { useSessionContext } from '../shared/context/hooks/SessionHooks.ts';
import { SettingSubgroups, SettingGroups } from '../constants/Feature.ts';
import { SettingApNames } from '../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer.ts';
import { FnGenerateUID } from '../shared/allcommon/settingsform/FnGenerateUID.ts';
import { FnGetApplicationParameter } from '../shared/allcommon/basic/FnGetApplicationParameter.ts';
import { FnConvertBase64Blob } from '../shared/allcommon/sidebar/FnConvertBase64Blob.ts';
import { FnGetSessionVariableFromStorage } from '../shared/allcommon/basic/FnGetSessionVariableFromStorage.ts';
import { FnGetCssVariable } from '../appcontainer/allcommon/FnGetCssVariable.ts';
import { FnGetFileCategoryFromFile, FnGetExtensionFromMime } from '../appcontainer/allcommon/FnGetFileCategoryFromFile.ts';
import { IActionImageForSubMenu } from '../shared/allinterface/basic/IActionImageList.ts';
import { INote, Notes } from '@n20a/libavnotes';
import { IControl } from '../shared/allinterface/settingsform/ISettingsLibForm.ts';
import { ActionImage } from '../shared/basic/actionimage/ActionImage.tsx';
import { Image } from '../shared/basic/image/Image.tsx';
import { InfoMessage } from '../shared/sidebar/notes/InfoMessage.tsx';
import { Video } from '../shared/sidebar/notes/Video.tsx';
import { Audio } from '../shared/sidebar/notes/Audio.tsx';
import { NodeMenu } from '../shared/menu/nodemenu/NodeMenu.tsx';
import { RightMouseMenuGrid } from '../constants/Feature.ts';
import { YesNoFormContainer } from '../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx';
import { SettingsLibForm } from '../shared/settingsform/settingslibform/SettingsLibForm.tsx';
import { FnParseJsonSafely } from '../appcontainer/allcommon/FnParseJsonSafely.ts';
import { IOptionItem } from '../shared/allinterface/basic/IOptionsFilter.ts';
import { getDateFormat } from '../shared/context/contextandprovider/ExplorerTree.tsx';
import { FnConvertDateToSave } from '../appcontainer/allcommon/FnConvertDateToSave.ts';

function AppqaReminder(appqaReminderProps: IAppqaReminder) {
  const [selectedFilterString, setSelectedFilterString] = useState<string>("Reminders");
  const [selectedKebabMenuAction, setSelectedKebabMenuAction] = useState<string>()
  const [selectedKebabMenuItem, setSelectedKebabMenuItem] = useState<Record<string, any>>()
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [controls, setControls] = useState<IControl[]>([])
  const [uniqueKey, setUniqueKey] = useState<string>(FnGenerateUID());
  const [selectedNoteProps, setSelectedNoteProps] = useState<INote>()
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null)
  const [EditSelectedItem, setEditSelectedItem] = useState<Record<string, any> | null>(null)
  const [reminders, setReminders] = useState<Record<string, any>[] | null>(null);
  const [remindersOriginalData, setRemindersOriginalData] = useState<Record<string, any>[]>([]);
  const [columnDefs, setColumnDefs] = useState<Record<string, any>[]>([])
  const [showMessage, setShowMessage] = useState<boolean>(false)
  const [noteDetails, setNoteDetails] = useState<INote>();
  const [showNotesFrom, setShowNotesFrom] = useState<boolean>(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [showOkButton, setShowOkButton] = useState<boolean>(false)
  const [filterOptions, setFilterOptions] = useState<IOptionItem[]>();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isDataProcessed, setIsDataProcessed] = useState(false);
  const [initNoteJson, setInitNoteJson] = useState<INote>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const mainAppContext = useMainAppContext();
  const statusBarContext = useStatusBarContext();
  const sessionContext = useSessionContext();
  const LoginUserName = FnGetSessionVariableFromStorage("RequestedBy", "LoginShortName", sessionContext.SessionList);
  const userName = LoginUserName?.length ? LoginUserName[0].SessionValue : "";
  const controlRef = useRef<IControl[]>([]);
  const notesScrollObserverRef = useRef<MutationObserver | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  const disconnectNotesScrollObserver = () => {
    if (notesScrollObserverRef.current) {
      notesScrollObserverRef.current.disconnect();
      notesScrollObserverRef.current = null;
    }
  };

  /** Scroll notes list to bottom once DOM updates; disconnects after first hit or on replace. */
  const scrollNotesListToBottom = () => {
    disconnectNotesScrollObserver();

    const scrollNow = () => {
      const scrollDiv = document.querySelector('.nz-notes-list-scroll');
      if (scrollDiv) {
        scrollDiv.scrollTop = scrollDiv.scrollHeight;
        return true;
      }
      return false;
    };

    if (scrollNow()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (scrollNow()) {
        disconnectNotesScrollObserver();
      }
    });
    notesScrollObserverRef.current = observer;
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  useEffect(() => {
    setFilterOptions([
      {
        uniqueName: "All",//unique identifier name for the controls
        isRenderAsForm: true, //Indicates whether render as form or not 
        label: "All", //Label to show for the toggle 
        value: "1", // Indicates the toggle is ON (can be "0" for OFF)
        isDefault: false, // Whether value set by default or not
        tooltip: "Show All Reminders", //Tooltip to show on the controls
        disabled: false, // Disable the toggle controls

      },
      {
        uniqueName: "Closed",//unique identifier name closed the controls
        isRenderAsForm: true, //Indicates whether render as form
        label: "Closed", //Label to show Close the toggle 
        value: "0", // Indicates the toggle is ON (can be "0" closed)
        isDefault: false, // Whether value set by default close not
        tooltip: "Show Closed Reminders", //Tooltip to show on the controls
        disabled: false, // Disable the toggle controls

      },
      {
        uniqueName: "Open",//unique identifier name fProcessing the controls
        isRenderAsForm: true, //Indicates whether render as fProcessingm Processing not 
        label: "Open", //Label to show fProcessing the toggle 
        value: "0", // Indicates the toggle is ON (can be "0" fProcessing OFF)
        isDefault: false, // Whether value set by default Processing not
        tooltip: "Show Pending Reminders", //Tooltip to show on the controls
        disabled: false, // Disable the toggle controls

      },
      {
        uniqueName: "Deleted",//unique identifier name fProcessing the controls
        isRenderAsForm: true, //Indicates whether render as fProcessingm Processing not 
        label: "Deleted", //Label to show fProcessing the toggle 
        value: "0", // Indicates the toggle is ON (can be "0" fProcessing OFF)
        isDefault: false, // Whether value set by default Processing not
        tooltip: "Show Deleted Reminders", //Tooltip to show on the controls
        disabled: false, // Disable the toggle controls

      },
    ])
    return () => {
      disconnectNotesScrollObserver();
    };
  }, []);

  const getRecordingTimes = () => {
    try {
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

      return {
        maxAudioRecordingTime: maxAudioRecordingTimeRes && maxAudioRecordingTimeRes.length && Number(maxAudioRecordingTimeRes[0]?.Value || 1),
        maxVideoRecordingTime: maxVideoRecordingTimeRes && maxVideoRecordingTimeRes.length && Number(maxVideoRecordingTimeRes[0]?.Value || 1)
      };

    } catch (error) {
      console.error("Error fetching recording times:", error);
      return {
        maxAudioRecordingTime: 0,
        maxVideoRecordingTime: 0
      };
    }
  };

  useEffect(() => {
    const data = getRecordingTimes()
    if (typeof data === "object") {
      const maxAudioRecordingTime = data.maxAudioRecordingTime && Number(data.maxAudioRecordingTime || 0)
      const maxVideoRecordingTime = data.maxVideoRecordingTime && Number(data.maxVideoRecordingTime || 0)
      const notes = {
        maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
        maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds

        noteId: "1",
        noteTitle: "",
        notecontent: "",
        notefile: undefined,
        noteaudio: undefined,
        notevideo: undefined,
        noteCreatedAt: new Date(),
      }
      setNoteDetails(notes);

      setInitNoteJson(notes)
    }
  }, [mainAppContext.apRecords])


  useEffect(() => {
    if (!isDataProcessed) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      if (!reminders || reminders.length === 0) {
        appqaReminderProps.handleShowUserMessage?.("Reminders are not found.");
      }
    }
  }, [reminders, isDataProcessed]);

  const fetchGetAllReminders = () => {
    return new Promise((resolve, reject) => {
      axiosInterceptor(
        {
          url: MISC.GetAllReminders,
          data: {},
          allowShowLoader: true,
          setFetchData: (response: unknown, status?: string) => {
            if (status === "200" && response && typeof response === "object" && 'reminderJsonString' in response) {
              setIsLoading(false)
              let parseData = FnHandleAPIResponse(response.reminderJsonString, "Reminders")

              if (parseData && Array.isArray(parseData) && parseData.length > 0) {
                let resposeData = { "_Reminder": parseData }
                let statusBarString: Record<string, string | number | undefined> = { "All": parseData.length };
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let overdueCount = 0;
                let pendingCount = 0;

                for (const reminder of parseData) {
                  if (!reminder.DateDue) continue;

                  const dueDate = new Date(reminder.DateDue);
                  dueDate.setHours(0, 0, 0, 0);

                  if (dueDate < today) {
                    overdueCount++;
                  } else {
                    pendingCount++;
                  }
                }
                if (overdueCount > 0) {
                  statusBarString["Overdue"] = overdueCount;
                }
                if (pendingCount > 0) {
                  statusBarString["Pending"] = pendingCount;
                }
                if (appqaReminderProps.updateStatusBarData)
                  appqaReminderProps.updateStatusBarData(JSON.stringify(statusBarString), true);
                const reminder = [...resposeData._Reminder].sort((a, b) => {
                  return new Date(a.LastUpdated).getTime() - new Date(b.LastUpdated).getTime();
                });
                resolve(reminder);
              } else {
                setShowForm(true)
                setIsLoading(false)
                resolve([]);
              }
            } else {
              setIsLoading(false)
              resolve([]);
            }
          }
        },
        statusBarContext
      );
    });
  };

  useEffect(() => {
    const handleAppQASelectionChange = async () => {

      const fetchGetTableVsProperty = () => {
        return new Promise((resolve, reject) => {
          axiosInterceptor(
            {
              url: EM.GetTableVsProperty,
              data: {
                entityName: "Reminder",
                tableName: ""
              },
              allowShowLoader: true,
              setFetchData: (response: unknown, status?: string) => {
                if (status === "200" && response && Array.isArray(response)) {

                  response = response.map((obj: Record<string, any>) => {
                    obj.isOneToManyRelation = true
                    return obj
                  })
                  resolve(response);  // pass response
                }
                else {
                  reject("Something went wrong.")
                }
              }
            },
            statusBarContext
          );
        });
      };


      const [tableVsPropertyResponse, allRemindersResponse] = await Promise.all([
        fetchGetTableVsProperty(),
        fetchGetAllReminders()
      ]);
      const cols: Record<string, any>[] =
        Array.isArray(tableVsPropertyResponse) &&
          tableVsPropertyResponse.length > 0 &&
          tableVsPropertyResponse[0]?.properties
          ? FnParseJsonSafely(tableVsPropertyResponse[0].properties as string)
          : [];


      setReminders(allRemindersResponse as Record<string, any>[]);
      setRemindersOriginalData(allRemindersResponse as Record<string, any>[]);
      setIsDataProcessed(true);
      const array: Record<string, any>[] = [];
      const LoginUserName = FnGetSessionVariableFromStorage("RequestedBy", "LoginShortName", sessionContext.SessionList);
      const userName = LoginUserName?.length ? LoginUserName[0].SessionValue : "";
      const notAllowcontrol = [
        "Secured",
        "IsNZ",
        "_Reminder",
        "EntityName",
        "LastUpdated",
        "FileUID",
        "ReminderType"
      ];

      //  Filter first
      const filteredCols = cols.filter(
        (element) => !notAllowcontrol.includes(element.PName)
      );

      //  Then apply index-based logic
      filteredCols.forEach((element, index: number) => {
        const value =
          element.PName === "ReminderBy"
            ? userName
            :
            element.Value ??
            (element.IsRequired ? element.DefaultAPValue : "");

        array.push({
          RecID: element.RecID,
          CanChange: element.CanChange,
          IsRequired: element.RequiredToAddRecord === true && element.RequiredToUpdateRecord === true ? true : false,

          GroupName: element.GroupName,
          GroupNameDesc: element.GroupNameDesc,

          SubGroupName: element.SubGroupName,
          SubGroupNameDesc: element.SubGroupNameDesc,

          EntID: element.EntID,
          EntityName: element.EntityName,

          _AP: element.PName,
          Name: element.PName,
          NameDesc: element.NameDesc,

          PropertyLabel: element.PropertyLabel,
          DefaultAPValue: element.DefaultAPValue,
          Value: value,
          ValueDesc: element.ValueDesc,

          SortOrder: element.SortOrder,
          MaxInstances: element.MaxInstances,

          InputMask: element.InputMask,
          RegEx: element.RegEx,

          DisplayGroupControl: element.DisplayGroupControl,
          DisplayControl: element.DisplayControl,
          ChangeEvent: element.ChangeEvent,

          IsNZ: element.IsNZ,
          LastUpdated: element.LastUpdated,

          IsSaved: false,
          OldValue: element.Value,

          // index now works correctly
          isNewLine: index % 2 == 0,

          IsReadOnly: element.DisplayControl === "TextControl",
          disabled: false
        });
      });


      setControls(array as IControl[]);
      setProfileData({ UserName: userName })
      controlRef.current = array as IControl[];
      setColumnDefs(cols as Record<string, any>[]);
    }
    if (appqaReminderProps.featureId) {
      isInitialLoadRef.current = true;
      handleAppQASelectionChange()
    }
  }, [appqaReminderProps.featureId])


  const createMessage = (projectInitial: string, msgID: string, optionalMessage: string = "", customMessage: string = "", errorMessage: string = "",) => {
    let payload = {
      projectInitial: projectInitial,
      msgID: msgID,
      optionalMessage: optionalMessage,
      customMessage: customMessage,
      errorMessage: errorMessage
    }
    axiosInterceptor({
      url: LOG.CreateMessage,
      data: payload,
      allowShowLoader: true,
      setFetchData: (resp: unknown, status?: string) => {
        if (status === "200" && resp && typeof resp === "object" && 'finalMessage' in resp && resp.finalMessage) {
          setShowOkButton(false);
          setConfirmMessage(resp.finalMessage as string);
          setIsConfirmOpen(true);
        } else {
          setIsConfirmOpen(false)
          appqaReminderProps.handleShowUserMessage?.(`Message template(${projectInitial}-${msgID}) not found to confirm`);
        }
      }
    }, statusBarContext)
  }

  function handleNodeMenuOnClick(menu: IActionImageForSubMenu, selectedRow: Record<string, any>, containerName: string) {
    if (menu.payload && menu.payload.Label) {
      const kebabeMenuAction = menu.payload.Label;
      setSelectedKebabMenuItem(selectedRow);

      if (kebabeMenuAction === RightMouseMenuGrid.Delete) {
        createMessage("Audit", "151", kebabeMenuAction);
        setSelectedKebabMenuAction(kebabeMenuAction);
      }
      else if (kebabeMenuAction === RightMouseMenuGrid.Reopen) {
        createMessage("Audit", "151", kebabeMenuAction);
        setSelectedKebabMenuAction(kebabeMenuAction);
      }
      else if (kebabeMenuAction === RightMouseMenuGrid.Close) {
        createMessage("Audit", "151", kebabeMenuAction);
        setSelectedKebabMenuAction(kebabeMenuAction);
      }
    }
  }

  const handleFilterSelect = (value: Record<string, any>) => {

    if (value.uniqueName === "All") {
      setSelectedFilterString("Reminders (" + value.uniqueName + ")");
      setReminders(remindersOriginalData)
    } else if (value.uniqueName === "Closed") {
      setSelectedFilterString("Reminders (" + value.uniqueName + ")");
      setReminders(remindersOriginalData?.filter((item) => item.ReminderStatus?.toLowerCase() === 'closed'))
    } else {
      setSelectedFilterString("Reminders (" + value.uniqueName + ")");
      value.uniqueName && setReminders(remindersOriginalData?.filter((item) => item.ReminderStatus?.toLowerCase() === value.uniqueName?.toLowerCase()))
    }

  }
  const apiCallForAddUpdate = (payload: Record<string, any>) => {
    const isAddMode = !EditSelectedItem && !payload.RecID;
    let Entity = { "_Reminder": [payload] }
    const handleReminderAddApi = async (response: unknown, status?: string) => {
      if (status === "200" && response) {
        const reminders: unknown = await fetchGetAllReminders()
        if (reminders && Array.isArray(reminders)) {
          setReminders([...reminders]);
          setRemindersOriginalData([...reminders]);
        }
        setProfileData({ UserName: userName })
        const id = FnGenerateUID()
        setUniqueKey(id);
        setControls([...controlRef.current])
        scrollNotesListToBottom();
        setEditSelectedItem(null);
        setShowOkButton(true);
        setConfirmMessage(isAddMode ? "Reminder added successfully." : "Reminder updated successfully.");
        setIsConfirmOpen(true);
      }
    }
    axiosInterceptor({
      url: EM.AddUpdateTableRecord,
      data: { jsonString: JSON.stringify(Entity) },
      disableLog: true,
      allowShowLoader: true,
      setFetchData: handleReminderAddApi
    }, statusBarContext)
  }

  const sendNotes = async (message: INote) => {
    let reminderData = profileData
    reminderData._Reminder = message.notecontent
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
      fileName = message.notecontent.length && getFirst10Chars(message.notecontent)
      fileType = "Video"
      fileObject = message.notevideo
      reminderData.ReminderType = "Video"
    } else if (message.notefile) {
      base64String = await FnConvertBase64Blob(message.notefile, "toBase64", message.notefile.type)
      fileName = message.notefile && (message.notefile as Record<string, any>).name ? (message.notefile as Record<string, any>).name : getFirst10Chars(message.notecontent)

      fileType = "image"
      fileObject = message.notefile
      reminderData.ReminderType = "file"
    } else if (message.noteaudio) {
      base64String = await FnConvertBase64Blob(message.noteaudio, "toBase64", message.noteaudio.type)
      fileName = getFirst10Chars(message.notecontent)

      fileType = "Audio"
      fileObject = message.noteaudio
      reminderData.ReminderType = "audio"
    }
    if (!reminderData.UserName) {
      const LoginUserName = FnGetSessionVariableFromStorage("RequestedBy", "LoginShortName", sessionContext.SessionList);
      const userName = LoginUserName?.length ? LoginUserName[0].SessionValue : "";
      reminderData.UserName = userName
    }
    if (!reminderData.DateDue) {
      const currentDate = new Date();
      const today = FnConvertDateToSave(currentDate.toLocaleDateString());
      reminderData.DateDue = today
      const purgeReminderAfterDays = FnGetApplicationParameter(SettingGroups.AdminScheduler, SettingSubgroups.SchedulePurge, mainAppContext.apRecords, undefined, "PurgeReminderAfterDays", true)

      if (purgeReminderAfterDays && purgeReminderAfterDays.length > 0) {
        const dayCount = purgeReminderAfterDays[0].Value
          ? Number(purgeReminderAfterDays[0].Value)
          : purgeReminderAfterDays[0].DefaultAPValue;
        const formattedDate = addDaysToDate(today, dayCount);
        reminderData.AutoPurgeDate = FnConvertDateToSave(formattedDate); // formattedDate
      }
    }
    else {
      if (reminderData.DateDue) {
        reminderData.DateDue = FnConvertDateToSave(reminderData.DateDue);
      }

      if (reminderData.AutoPurgeDate) {
        reminderData.AutoPurgeDate = FnConvertDateToSave(reminderData.AutoPurgeDate);
      }
    }
    if (!message.notefile && !message.notevideo && !message.noteaudio) {
      const payload: Record<string, any> = {
        ReminderType: fileType,
        _Reminder: message.notecontent,
        ...reminderData
      }
      apiCallForAddUpdate(payload)
    } else {
      let entid = reminderData.EntID ?? FnGenerateUID();
      const removeFileExtension = (fileName: string): string => {
        return fileName.replace(/\.[^/.]+$/, '');
      };
      await axiosInterceptor({
        url: FS.UploadFileStream,
        data: {
          "fileCategory": FnGetFileCategoryFromFile(fileObject as Blob),
          "fileExtension": FnGetExtensionFromMime(fileObject?.type as string, fileName),
          "fileBlob": base64String,
          "fileName": removeFileExtension(fileName),
          "prefix": "Reminder",
          entityName: "Reminder",
          entID: entid,
          userName: reminderData.UserName
        },
        allowShowLoader: true,
        setFetchData: async (uploadFileStreamResponse: unknown, status?: string) => {
          if (status === '200' && uploadFileStreamResponse && typeof uploadFileStreamResponse === 'object' && 'fileUID' in uploadFileStreamResponse) {
            const payload = {
              ...reminderData,
              EntID: entid,
              ReminderType: fileType,
              _Reminder: message.notecontent,
              FileUID: uploadFileStreamResponse.fileUID,
              EntityName: "Reminder",
            }
            apiCallForAddUpdate(payload)
          }


        }

      }, statusBarContext)
      //upload files 

    }

  }

  const handleSvgFileName = (item: Record<string, any>) => {
    if (item.ReminderType?.toLowerCase() === "image") {
      if (item.fileObj) {
        return {
          icon: <Download24x24 size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />, iconName: "Download_24x24.svg"
        }
      } else {
        return {
          icon: <Attach24x24 size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />, iconName: "Attach_24x24.svg"
        }
      }
    } else if (item.ReminderType?.toLowerCase() === "video") {
      return {
        icon: <Video24x24 size={FnGetCssVariable('--image-size-1')}
          fill='none'
          strokeWidth={1} />, iconName: "Video_24x24.svg"
      }
    } else if (item.ReminderType?.toLowerCase() === "audio") {
      return {
        icon: <Mic24x24 size={FnGetCssVariable('--image-size-1')}
          fill='none'
          strokeWidth={1} />, iconName: "Mic_24x24.svg"
      }
    } else {
      return {
        icon: <Info24x24 size={FnGetCssVariable('--image-size-1')}
          fill='none'
          strokeWidth={1} />, iconName: "Info_24x24.svg"
      }
    }
  }
  const handleSvgFileTooltip = (item: Record<string, any>) => {
    if (item.ReminderType?.toLowerCase() === "image") {
      return "Download File"
    } else if (item.ReminderType?.toLowerCase() === "video") {
      return 'View video'
    } else if (item.ReminderType?.toLowerCase() === "audio") {
      return 'View Audio'
    } else {
      return "Info"
    }
  }

  const handleAIClick = async (item: Record<string, any>, iconName: string) => {

    const fileObj = await getFileTableData(item.EntID, item.EntityName)
    const filterFile =
      Array.isArray(fileObj)
        ? fileObj.find((file) => file.FileUID === item.FileUID)
        : undefined;
    if (filterFile) {

      await axiosInterceptor({
        url: FS.GetFileStream,
        data: {
          "entID": filterFile.EntID,
          "entityName": filterFile.entityName,
          "fileCategory": filterFile.FileCategory,
          "fileName": filterFile.DocName,
          "fileExtension": filterFile.FileExtension,
          "fileUID": filterFile.FileUID
        },
        allowShowLoader: true,
        setFetchData: async (uploadFileStreamResponse: unknown, status?: string) => {
          if (status === '200' && uploadFileStreamResponse &&
            typeof uploadFileStreamResponse === "object" &&
            "fileBlob" in uploadFileStreamResponse) {
            if (filterFile.FileCategory?.toLowerCase() !== "audio" && filterFile.FileCategory?.toLowerCase() !== "video") {
              downloadBase64File(uploadFileStreamResponse.fileBlob as string, filterFile.DocName, filterFile.FileExtension)
              setSelectedItem(null)
            } else {
              setSelectedItem(item)
              setControls([])
              setNoteDetails(undefined);
              const blob: Blob = base64ToBlob(uploadFileStreamResponse.fileBlob as string, filterFile.FileCategory === "audio" ? "audio" : "video")
              const data = getRecordingTimes()
              const maxAudioRecordingTime = data.maxAudioRecordingTime && Number(data.maxAudioRecordingTime || 0)
              const maxVideoRecordingTime = data.maxVideoRecordingTime && Number(data.maxVideoRecordingTime || 0)
              if (blob) {
                const note: INote = {
                  maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
                  maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds
                  noteId: filterFile.EntID,
                  noteTitle: filterFile.DocName,
                  notecontent: filterFile.DocName,
                  noteCreatedAt: new Date(),
                  noteaudio: filterFile.FileCategory === "audio" ? blob : undefined,
                  notevideo: filterFile.FileCategory === "video" ? blob : undefined,
                }
                setSelectedNoteProps(note)
              }
              setShowMessage(true)
            }
          }

        }
      }, statusBarContext)
    }
  }

  function getPropertyLabelByPName(
    data: Record<string, any>[],
    propertyName: string
  ): string | null {
    const matchedItem = data.find(
      item => item.PName === propertyName
    );

    return matchedItem ? matchedItem.PropertyLabel : null;
  }

  function addDaysToDate(value: string | Date, dayCount: number): string {
    const format = getDateFormat();

    // Parse input date
    let date: Date;
    if (value instanceof Date) {
      date = new Date(value);
    } else {
      const [d, m, y] = value.split(/[/\-]/).map(Number);

      if (format?.toLowerCase().startsWith("dd")) {
        // DD/MM/YYYY
        date = new Date(y, m - 1, d);
      } else {
        // MM/DD/YYYY
        date = new Date(y, d - 1, m);
      }
    }

    // Add days
    date.setDate(date.getDate() + Number(dayCount));

    // Format back
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());

    return format
      .replace(/dd/i, dd)
      .replace(/mm/i, mm)
      .replace(/yyyy/i, yyyy);
  }

  const checkValidation = (value: string) => {
    if (value.length === 0) return "";

    const selectedDate = new Date(FnConvertDateToUtcOrUtcToDate(value, true))
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time


    // ADD MODE: Don't allow today or future dates
    if (selectedDate < today) {
      const errorElement = document.querySelector('[data-key="DateDue"] .nz-error-message');
      if (errorElement instanceof HTMLElement) {
        errorElement.style.display = "block"; // ensure it's visible
        errorElement.classList.add('nz-start-date-errror')
        errorElement.textContent = "Only today and future dates are allowed"; // set your custom message
      }
      return today
    } else {
      const errorElement = document.querySelector('[data-key="DateDue"] .nz-error-message');
      if (errorElement instanceof HTMLElement) {
        errorElement.style.display = "none"; // ensure it's visible
        errorElement.classList.remove('nz-start-date-errror')
        errorElement.textContent = ""; // set your custom message
      }
      return value
    }

  }
  const handleValueChange = async (value: string | boolean | number, name: string | undefined, isDefault?: boolean | undefined) => {
    if (!isDefault) {
      if (name) {
        if (name === "DateDue") {
          const DateDue = checkValidation(value as string);
          const purgeReminderAfterDays = FnGetApplicationParameter(SettingGroups.AdminScheduler, SettingSubgroups.SchedulePurge, mainAppContext.apRecords, undefined, "PurgeReminderAfterDays", true)

          if (purgeReminderAfterDays && purgeReminderAfterDays.length > 0) {
            const dayCount = purgeReminderAfterDays[0].Value
              ? Number(purgeReminderAfterDays[0].Value)
              : purgeReminderAfterDays[0].DefaultAPValue;
            const formattedDate = addDaysToDate(DateDue, dayCount);
            (profileData || {})["AutoPurgeDate"] = FnConvertDateToUtcOrUtcToDate(formattedDate, false, false)
            const parentDiv = document.getElementById('AutoPurgeDate');

            const label = parentDiv?.querySelector('label.nz-fc-label-control');

            // Update label text if found
            if (label) {
              label.textContent = FnConvertDateToUtcOrUtcToDate(formattedDate, false, false); // new date value
            }
          }
          (profileData || {})[name] = DateDue;
        } else {
          (profileData || {})[name] = value;
        }
        setProfileData({ ...profileData });
      }

    }

  }
  const handleClickYes = async () => {

    setIsConfirmOpen(false);
    if (selectedKebabMenuAction) {
      if (selectedKebabMenuAction === RightMouseMenuGrid.Delete && selectedKebabMenuItem?.EntID) {
        const payload = {
          tableName: "_Reminder",
          recIDs: selectedKebabMenuItem?.RecID,
          entIDs: selectedKebabMenuItem?.EntID
        }
        axiosInterceptor({
          url: EM.DeleteTableRecords,
          data: payload,
          allowShowLoader: true,
          setFetchData: async (deleteTableRecordApiResp: unknown, status?: string) => {
            if (status === "200" && deleteTableRecordApiResp != undefined) {
              const reminders = await fetchGetAllReminders()
              if (reminders && Array.isArray(reminders)) {
                setReminders(reminders as Record<string, any>[]);
                setRemindersOriginalData(reminders as Record<string, any>[]);
              }
              setProfileData({ UserName: userName })
              const id = FnGenerateUID()
              setUniqueKey(id);
              setControls([...controlRef.current])
              scrollNotesListToBottom();
              setEditSelectedItem(null);
              setSelectedNoteProps(undefined)

            }
          }

        }, statusBarContext)
      }
      else if ((selectedKebabMenuAction === RightMouseMenuGrid.Reopen || selectedKebabMenuAction === RightMouseMenuGrid.Close) && selectedKebabMenuItem?.EntID) {
        axiosInterceptor({
          url: REMINDER.SetReminderStatus,
          data: {
            entID: selectedKebabMenuItem.EntID,
            action: selectedKebabMenuAction
          },
          allowShowLoader: true,
          setFetchData: async (setReminderStatusApiResp: unknown, status?: string) => {
            if (status === "200" && setReminderStatusApiResp != undefined) {
              const reminders = await fetchGetAllReminders()
              if (reminders && Array.isArray(reminders)) {
                setReminders(reminders as Record<string, any>[]);
                setRemindersOriginalData(reminders as Record<string, any>[]);
              }
            }
          }

        }, statusBarContext)
      }
    }


  };
  const handleClickNo = async () => {
    setIsConfirmOpen(false);

  };
  const handleOkButtonClick = () => {
    setIsConfirmOpen(false);
    setShowOkButton(false);
  }
  const getFileTableData = async (EntID: string, EntityName: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await axiosInterceptor(
          {
            url: NODE.GetKebabMenuData,
            data: {
              entID: EntID,
              entityName: EntityName,
              kebabMenuTableName: "PG.FileProfile",
            },
            allowShowLoader: true,
            setFetchData: async (resp: unknown, status?: string) => {
              if (status === "200" && resp && typeof resp === "object" && 'propertyJson' in resp) {

                try {
                  // resp.propertyJson is a string → convert to object
                  const parsed = resp.propertyJson && typeof resp.propertyJson === "string" && FnParseJsonSafely(resp.propertyJson as string);

                  // Extract the array from "PG.FileProfile"
                  const resultArray = parsed["PG.FileProfile"] || [];

                  resolve(resultArray); // return ONLY the array
                } catch (err) {
                  console.error("KebabMenu data parse error:", err);
                  statusBarContext?.setFetchError([
                    "Invalid response from kebab menu API.",
                  ]);
                  reject(err);
                }
              }
              else {
                reject("Something went wrong in get File Table data")
              }
            },
          },
          statusBarContext
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  function downloadBase64File(
    base64: string,
    fileName: string,
    extension: string
  ) {
    try {
      const bytes = Uint8Array.from(
        atob(base64),
        c => c.charCodeAt(0)
      );

      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${extension}`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error in download.", err);
    }
  }

  function base64ToBlob(base64: string, contentType = ""): Blob {
    statusBarContext.setIsLoading(true)
    // Remove base64 prefix if present (e.g., data:image/png;base64,)
    const cleanedBase64 = base64.includes(",") ? base64.split(",")[1] : base64;

    const byteCharacters = atob(cleanedBase64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    statusBarContext.setIsLoading(false)
    return new Blob([byteArray], { type: contentType });
  }
  async function handleSelectCard(event: MouseEvent, item: Record<string, any>) {
    setShowForm(true);
    setProfileData(item)
    setEditSelectedItem(item)
    setSelectedNoteProps(undefined)
    setNoteDetails(undefined)
    setControls([...controlRef.current])

    if (item.FileUID) {
      const fileObj = await getFileTableData(item.EntID, item.EntityName)
      const filterFile =
        Array.isArray(fileObj)
          ? fileObj.find((file) => file.FileUID === item.FileUID)
          : undefined;
      if (filterFile) {

        await axiosInterceptor({
          url: FS.GetFileStream,
          data: {
            "entID": filterFile.EntID,
            "entityName": filterFile.entityName,
            "fileCategory": filterFile.FileCategory,
            "fileName": filterFile.DocName,
            "fileExtension": filterFile.FileExtension,
            "fileUID": filterFile.FileUID
          },
          allowShowLoader: true,
          setFetchData: async (uploadFileStreamResponse: unknown, status?: string) => {
            if (status === "200" && uploadFileStreamResponse &&
              typeof uploadFileStreamResponse === "object" &&
              "fileBlob" in uploadFileStreamResponse) {

              const blob: Blob = base64ToBlob(uploadFileStreamResponse.fileBlob as string, filterFile.FileCategory)
              const data = getRecordingTimes()
              const maxAudioRecordingTime = data.maxAudioRecordingTime && Number(data.maxAudioRecordingTime || 1)
              const maxVideoRecordingTime = data.maxVideoRecordingTime && Number(data.maxVideoRecordingTime || 1)
              if (blob) {
                const note: INote = {
                  maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
                  maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds
                  noteId: filterFile.EntID,
                  noteTitle: filterFile.DocName,
                  notecontent: item._Reminder,
                  noteCreatedAt: new Date(),
                  noteaudio: filterFile.FileCategory === "audio" ? blob : undefined,
                  notevideo: filterFile.FileCategory === "video" ? blob : undefined,
                  notefile: filterFile.FileCategory === "image" ? blob : undefined,
                  notefileName: filterFile.FileCategory === "image" ? filterFile.DocName : undefined,
                }

                setNoteDetails(note)
              }
              // }
            }

          }
        }, statusBarContext)
      }
    } else {
      const data = getRecordingTimes()
      const maxAudioRecordingTime = data.maxAudioRecordingTime && Number(data.maxAudioRecordingTime || 1)
      const maxVideoRecordingTime = data.maxVideoRecordingTime && Number(data.maxVideoRecordingTime || 1)
      const note: INote = {
        maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
        maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds
        noteId: item.EntID,
        noteTitle: item.DocName,
        notecontent: item._Reminder,
        noteCreatedAt: new Date(),
        noteaudio: undefined,
        notevideo: undefined,
      }

      setNoteDetails({ ...note })
    }
  }
  async function handleDeleteFile(objectType: 'audio' | 'video' | 'file', objectData?: Blob | File | undefined): Promise<void> {
    if (EditSelectedItem) {
      const fileObj = await getFileTableData(EditSelectedItem.EntID, EditSelectedItem.EntityName)
      if (fileObj && Array.isArray(fileObj)) {
        const filterFile =
          Array.isArray(fileObj)
            ? fileObj.find((file) => file.FileUID === EditSelectedItem.FileUID)
            : undefined;

        await axiosInterceptor({
          url: FS.DeleteFileStream,
          data: {
            "fileCategory": filterFile.FileCategory,
            "fileExtension": filterFile.FileExtension,
            fileUID: filterFile.FileUID,
          },
          allowShowLoader: true,
          setFetchData: async (deleteFileStreamResponse: unknown, status?: string) => {
            if (status === "200") {
              let reminderData: Record<string, any> = { ...profileData, fileUID: "", ReminderType: "message" }
              delete reminderData.FileUID
              apiCallForAddUpdate(reminderData)
              const data = getRecordingTimes()
              const maxAudioRecordingTime = data.maxAudioRecordingTime && Number(data.maxAudioRecordingTime || 1)
              const maxVideoRecordingTime = data.maxVideoRecordingTime && Number(data.maxVideoRecordingTime || 1)
              const note: INote = {
                maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
                maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds
                noteId: filterFile.EntID,
                noteTitle: filterFile.DocName,
                notecontent: reminderData._Reminder,
                noteCreatedAt: new Date(),
                noteaudio: undefined,
                notevideo: undefined,
              }

              setNoteDetails({ ...note })
            }
          }
        }, statusBarContext)
      }

    }
  }
  const convertDateOnly = (dateInput: string): string => {
    if (!dateInput) return "";

    const format = getDateFormat(); // "MM/dd/yyyy" or "dd/MM/yyyy"
    const pad = (n: number) => n.toString().padStart(2, "0");

    let year = 0,
      month = 0,
      day = 0;

    // Case 1: ISO format from DB (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      const parts = dateInput.split("T")[0].split("-");
      [year, month, day] = parts.map(Number);
    }
    // Case 2: UI formatted date
    else {
      const parts = dateInput.split(/[\/\-]/).map(Number);

      if (format === "MM/dd/yyyy") {
        [month, day, year] = parts;
      } else {
        [day, month, year] = parts;
      }
    }

    if (!year || !month || !day) {
      console.error("Invalid date input for convertDateOnly:", dateInput);
      return "";
    }

    //  NO timezone conversion here
    if (format === "MM/dd/yyyy") {
      return `${pad(month)}/${pad(day)}/${year}`;
    }

    return `${pad(day)}/${pad(month)}/${year}`;
  };
  useEffect(() => {
    if (profileData && controls) {
      const hasAllRequiredProfileValues = (
        controls: IControl[],
        profileData: Record<string, any>
      ): boolean => {
        return controls
          .filter(control => control.IsRequired)
          .every(control => {
            const profileValue = profileData[control.Name];
            const controlValue = control.Value;

            const value =
              profileValue !== undefined &&
                profileValue !== null &&
                String(profileValue).trim() !== ""
                ? profileValue
                : controlValue;

            return (
              value !== undefined &&
              value !== null &&
              String(value).trim() !== ""
            );
          });
      };
      setShowNotesFrom(hasAllRequiredProfileValues(controls, profileData))
    }
  }, [profileData, controls])

  const clearForm = () => {

    setProfileData({ UserName: userName })
    setEditSelectedItem(null)
    setControls([...controlRef.current])
    const note = { ...initNoteJson, noteId: FnGenerateUID() as string, }
    setNoteDetails(note as INote)
  }

  return (
    <div key={appqaReminderProps.uniqueName} className="nz-w-100 nz-h-100 nz-d-flex-column nz-app-qa-reminder">
      {appqaReminderProps.allowShowHeader &&
        <div className='nz-sub-header  nz-d-flex-row nz-w-100 nz-h-40-px'>
          <Label uniqueName={appqaReminderProps.uniqueName + "header"} label={appqaReminderProps.headerText} fontWeight="bold" />
        </div>
      }
      <div className='nz-w-100 nz-h-100 nz-d-flex-column nz-app-qa-reminder-container' tabIndex={1} onKeyDown={handleContainerKeyDown}>
        {selectedFilterString &&
          <div className='nz-sub-header'>
            {(reminders && reminders.length > 0 && filterOptions) &&
              <OptionsFilter showIcon={true} uniqueName={'app-qa-filter'} container={'ap-filter'}
                handleSelect={handleFilterSelect}
                options={filterOptions}
              />
            }
            <div className='nz-reminder-header-open-icon'>
              <Label uniqueName={`${appqaReminderProps.uniqueName}-task-header`} label={selectedFilterString} />
              <ActionImage uniqueName={`${appqaReminderProps.uniqueName}-open-card`}
                image={{
                  uniqueName: `${appqaReminderProps.uniqueName}-open-card-image`,
                  source: <OpenSidebar24x24
                    size={FnGetCssVariable("--image-size-2")}
                    fill="none"
                    strokeWidth={1}
                  />,
                  w: "var(--image-size-2)",
                  tooltip: "Show from",
                  type: "svg"
                }}
                w={"var(--node_height)"}
                h={"var(--node_height)"}
                actionCode={"open-card"}
                handleMouse={function (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: Record<string, any>): void {
                  setShowForm(true)
                }} />
            </div>
          </div>
        }
        <div className='nz-reminder-main-content'>
          {isLoading ? (
            <div className="nz-wh-100 nz-d-flex-hv-left">Loading…</div>
          ) : reminders && reminders.length > 0 ?
            <div className="nz-app-qa-reminder-content-container">
              <div className={selectedItem ? 'nz-reminder-only' : 'nz-notes-list-scroll'}>
                {reminders.map((item, index) => {
                  function handleUpdateData(message: INote): void {
                  }
                  return (
                    <div className={`nz-node-list-box ${EditSelectedItem?.EntID === item.EntID ? 'nz-dynamic-selected-card' : ''}`} key={index}
                      onClick={(event) => handleSelectCard(event, item)}>
                      <div className='nz-node-list-delete nz-node-reminder-delete-button'>
                        <div
                          className="nz-dynamic-card-node-menu"
                          style={{ width: 20 }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <NodeMenu
                            uniqueName='basic-grid'
                            container={'reminder_grid'}
                            featureId={appqaReminderProps.featureId}
                            selectedRow={item}
                            handleSelect={(value: IActionImageForSubMenu) => {
                              handleNodeMenuOnClick(value, item, "dynamicCard-nodemenu")
                            }}
                            showIcon={true}
                            featureData={appqaReminderProps?.featureData || []}
                            allowAddCopyIconInOverlay={false}
                          />
                        </div>
                        <div className='nz-reminder-node-header'>
                          <div className='nz-note-date'>
                            <Reminder24x24 size={FnGetCssVariable('--image-size-1')}
                              fill='none'
                              strokeWidth={1} />
                            <Label uniqueName='ReminderStatus' label={item.ReminderStatus} color={item.ColorName} fontWeight='bold' />
                            <Label uniqueName='date' label={`Due: ` + convertDateOnly(item.DateDue)} color={item.ColorName} />
                            <Label uniqueName='user' label={`${item.UserName}`} color={item.ColorName} />
                          </div>
                          <div className='nz-note-user'>
                            <Label uniqueName='NotesSeverity' label={`${item.NotesSeverity}`} color={item.ColorName} />
                          </div>
                        </div>
                      </div>
                      {!selectedItem || selectedItem !== item ?
                        <div className='nz-info-div'>
                          {
                            item.ReminderType && typeof item.ReminderType === "string" && item.ReminderType?.toLowerCase() === "image" || item.ReminderType?.toLowerCase() === "audio" || item.ReminderType?.toLowerCase() === "video" ?
                              <ActionImage image={{
                                uniqueName: `info-icon`,
                                source: handleSvgFileName(item).icon,
                                w: 'var(--image-size-2)',
                                type: "svg",
                                tooltip: handleSvgFileTooltip(item)
                              }} w={'var(--node_height)'} h={'var(--node_height)'}
                                uniqueName={`deleteicon`}
                                actionCode={'info-icon'}
                                allowEventPropagation={true}
                                disabled={false}
                                handleMouse={(e) => {
                                  handleAIClick(item, handleSvgFileName(item).iconName)
                                }} />
                              :
                              <div className='nz-info-image'> <Image
                                uniqueName={'info'}
                                source={handleSvgFileName(item).icon}
                                w={'var(--image-size-2)'}
                                tooltip={handleSvgFileTooltip(item)}
                              /></div>
                          }
                          <div className='nz-nodes-text nz-reminder-text' >
                            {item?.FileUID && item?.ReminderType?.toLowerCase() === "image" ?
                              <div className='nz-downlaod-file-name'>
                                <Label uniqueName='notes' label={item.fileObj && item.fileObj?.fileName as string} />
                              </div>
                              :
                              ""
                            }
                            {item._Reminder.length >= 64 ?
                              <>
                                <div className='nz-notes-text-like-link '>
                                  <div className='nz-reminder-card-line'>
                                    <Label uniqueName='_Reminder' label={item._Reminder} color={item.ColorName} />
                                    <Label uniqueName='LastUpdated' label={`${getPropertyLabelByPName(columnDefs, "LastUpdated")}: ` + convertDateOnly(item.LastUpdated)} color={item.ColorName} />
                                  </div>
                                </div>

                              </>
                              :
                              <>
                                <div className='nz-reminder-card-line'>
                                  <Label uniqueName='_Reminder' label={item._Reminder} color={item.ColorName} />
                                  <Label uniqueName='LastUpdated' label={`${getPropertyLabelByPName(columnDefs, "LastUpdated")}: ` + convertDateOnly(item.LastUpdated)} color={item.ColorName} />
                                </div>

                              </>
                            }
                          </div>
                        </div >
                        :
                        <>
                          {showMessage && item.ReminderType?.toLowerCase() === "message" &&
                            <InfoMessage message={selectedItem.NotesMAX} handleClose={() => {
                              setShowMessage(false)
                              setSelectedItem(null)
                            }} />
                          }
                          {showMessage && item.ReminderType?.toLowerCase() === "video" && selectedNoteProps &&
                            <Video handleClose={() => {
                              setSelectedItem(null)
                              setControls([...controlRef.current])
                              setNoteDetails(initNoteJson)
                              setSelectedNoteProps(undefined)
                              setShowMessage(false)
                            }} noteProps={selectedNoteProps} sendNotes={handleUpdateData} />
                          }
                          {showMessage && item.ReminderType?.toLowerCase() === "audio" && selectedNoteProps &&
                            <Audio
                              handleClose={() => {
                                setSelectedItem(null)
                                setControls([...controlRef.current])
                                setNoteDetails(initNoteJson)
                                setSelectedNoteProps(undefined)
                                setShowMessage(false)
                              }}
                              noteProps={selectedNoteProps} />
                          }
                        </>
                      }
                    </div >
                  )
                })}
              </div >
            </div>
            : <div className='nz-wh-100 nz-d-flex-hv-left'>
              No Data found
            </div>
          }

        </div>
      </div>
      {
        !showMessage && showForm && <div className={"nz-reminder-container-main-div"}>
          <div className='nz-reminder-add-from-header nz-sub-header'>

            <div className='nz-reminder-header-open-icon'>
              {EditSelectedItem ? "Edit Reminder" : "Add New Reminder"}
              <div style={{ display: 'flex', gap: 'var(--spacing-0)' }}>
                {EditSelectedItem &&
                  <ActionImage
                    handleMouse={() => {
                      clearForm();
                    }}
                    image={{
                      uniqueName: appqaReminderProps.uniqueName + "cancel",
                      source: <Close24x24 size={20}
                        fill="none"
                        strokeWidth={1} />,
                      type: "svg",
                      w: "var(--image-size-2)",
                      h: "var(--image-size-2)",
                      tooltip: "clear"
                    }}
                    uniqueName={appqaReminderProps.uniqueName + 'cancelIcon'}
                    actionCode='cancel'
                    w='var(--node_height)'
                    h='var(--node_height)'
                  />
                }
                <ActionImage
                  image={{
                    uniqueName: "cancel",
                    source: <HideSidebar24x24
                      size={FnGetCssVariable('--image-size-2')}
                      fill='none'
                      strokeWidth={1} />,
                    type: "svg",
                    w: "var(--image-size-2)",
                    h: "var(--image-size-2)",
                    tooltip: "Hide from"
                  }}
                  uniqueName='cancelIcon'
                  actionCode='cancel'
                  w='var(--node_height)'
                  h='var(--node_height)'
                  handleMouse={() => {
                    setShowForm(false)
                    clearForm()
                  }}
                />
              </div>
            </div>

          </div>

          <div className='nz-reminder-notes-componet' style={{ overflow: 'hidden' }}>
            {controls && noteDetails && !selectedNoteProps ?
              <>
                <div className='nz-reminder-add-from' onKeyDownCapture={handleFormControlsKeyDown}
                  onKeyDown={handleFormControlsBubbleKeyDown}>
                  <SettingsLibForm
                    uniqueName={`${appqaReminderProps.uniqueName}-fc-${uniqueKey}`}
                    controls={controls}
                    profileString={JSON.stringify([profileData])}
                    isAutoSave={true}
                    handleValueChange={handleValueChange}
                    featureId={appqaReminderProps.featureId}
                    id={EditSelectedItem?.EntID ?? ""}
                    isDisableForm={false}
                    allowShowHeader={false} />
                </div>
              </> : <div className='nz-wh-100 nz-d-flex-hv-left'>Loading...</div>
            }
            {noteDetails && !selectedNoteProps &&
              <div className='nz-reminder-note-controls'>
                <div className='nz-reminder-notes-label'>
                  <Label uniqueName={`${appqaReminderProps.uniqueName}-notes-label`} label="Reminder" />
                  <span className='nz-reminder-notes-required'>*</span>
                </div>
                <div className='nz-reminder-notes-control'>
                  <Notes key={noteDetails.noteId || Date.now()} {...noteDetails} ReadOnly={showNotesFrom ? false : true} sendNote={sendNotes} handleDelete={handleDeleteFile} />
                </div>
              </div>
            }
          </div>

        </div>
      }
      <YesNoFormContainer
        isOpen={isConfirmOpen}
        uniqueName="onetomanyDelete"
        message={confirmMessage}
        handleYesButtonClick={handleClickYes}
        handleNoButtonClick={handleClickNo}
        showOkButton={showOkButton}
        handleOkButtonClick={handleOkButtonClick}
      />
    </div>
  );
}

export default AppqaReminder

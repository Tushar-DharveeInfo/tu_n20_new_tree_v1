
import { useEffect, useState } from "react";
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks";
import { axiosInterceptor } from "../../../shared/interceptors/Interceptor";
import { EM, TQ } from "../../../shared/interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../../shared/allcommon/basic/FnHandleAPIResponse";
import { CardLayout } from "../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../shared/allinterface/cardlayout/ICardLayout";
import { Label } from "../../../shared/basic/label/Label";
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { AppQA } from "../../../constants/Feature";
import { RightMouseMenuGrid } from "../../../constants/Feature";
import { IActionImageForSubMenu } from "../../../shared/allinterface/basic/IActionImageList";
import { OptionsFilter } from "../../../shared/basic/optionsfilter/OptionsFilter";
import { FnCreateMessage } from "../../allcommon/FnCreateMessage";
import { IBackgroundTasks } from "../../allinterface/IAppqaTask";
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { IFnCreateForensiclog } from "../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { FnCreateForensiclog } from "../../../appcontainer/allcommon/FnCreateForensiclog";
import { useMainAppContext } from "../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks";
import { IOptionItem } from "../../../shared/allinterface/basic/IOptionsFilter";

const DETAIL_FONT_SIZE = "11px";

const isTaskRecord = (value: unknown): value is Record<string, any> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const formatTaskDateTime = (value: unknown): string =>
    value ? FnConvertDateToUtcOrUtcToDate(String(value), false) : "";

/** Builds CardLayout name/value rows from a background task record. */
const buildBackgroundTaskCardFields = (
    item: Record<string, any>,
    uniqueName: string,
    index: number
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "",
            Value: item.TaskProfile || "—",
            Header: 1,
            ValueContent: (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Label
                        uniqueName={`${uniqueName}-label-status-${index}`}
                        label={`${item.TaskStatus ?? ""}`}
                        fontWeight="bold"
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-status-${index}`}
                        label={`${item.TaskProfile} `}
                    />
                </div>
            ),
        }
    ];

    if (item.Description) {
        fields.push({
            Name: "",
            Value: item.Description,
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-description-${index}`}
                    label={item.Description}
                    fontSize={DETAIL_FONT_SIZE}
                />
            ),
        });
    }

    if (item.TaskError) {
        fields.push({
            Name: "",
            Value: item.TaskError,
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-error-${index}`}
                    label={item.TaskError}
                    fontSize={DETAIL_FONT_SIZE}
                />
            ),
        });
    }

    fields.push({
        Name: "",
        Value: String(item.TaskPercent ?? ""),
        ValueContent: (
            <div style={{ display: "flex", alignItems: "center" }}>
                <Label
                    uniqueName={`${uniqueName}-label-percent-name-${index}`}
                    label={" TaskPercent : "}
                    fontSize={DETAIL_FONT_SIZE}
                />
                <Label
                    uniqueName={`${uniqueName}-label-percent-value-${index}`}
                    label={item.TaskPercent}
                    fontSize={DETAIL_FONT_SIZE}
                />
            </div>
        ),
    });

    fields.push(
        {
            Name: "",
            Value: "",
            Group: "task-footer",
            Row: "space-between",
            ValueContent: (
                <div style={{ display: "flex", alignItems: "center" }}>
                    <Label
                        uniqueName={`${uniqueName}-label-added-name-${index}`}
                        label={"TaskAdded : "}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-added-value-${index}`}
                        label={formatTaskDateTime(item.TaskAddedDateTime)}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    &nbsp; | &nbsp;
                    <Label
                        uniqueName={`${uniqueName}-label-started-name-${index}`}
                        label={" TaskStarted : "}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-started-value-${index}`}
                        label={formatTaskDateTime(item.TaskStartedDateTime)}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    &nbsp; | &nbsp;
                    <Label
                        uniqueName={`${uniqueName}-label-finished-name-${index}`}
                        label={" TaskFinished : "}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                    <Label
                        uniqueName={`${uniqueName}-label-finished-value-${index}`}
                        label={formatTaskDateTime(item.TaskFinishedDateTime)}
                        fontSize={DETAIL_FONT_SIZE}
                    />
                </div>
            ),
        },
        {
            Name: "",
            Value: item.TaskOwner || "",
            Group: "task-footer",
            Row: "space-between",
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-owner-${index}`}
                    label={`Task Owner : ${item.TaskOwner ?? ""}`}
                    fontSize={DETAIL_FONT_SIZE}
                />
            ),
        }
    );

    return fields;
};

let savedBackgroundTaskFilter = "Processing";

const BackgroundTasks = ({ uniqueName, featureId, handleOpenTaskCount, featureData, savedFilter, handleFilterChange }: IBackgroundTasks) => {
    const activeFilter = savedFilter || savedBackgroundTaskFilter || "Processing";
    const [taskList, setTaskList] = useState<Record<string, any>[]>([]);
    const [taskListOriginal, setTaskListOriginal] = useState<Record<string, any>[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
    const [menu, setMenu] = useState<IActionImageForSubMenu | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [isShowOkOnly, setIsShowOkOnly] = useState<boolean>(false)
    const [filterOptions, setFilterOptions] = useState<IOptionItem[]>();
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [filterSelectedBackground, setFilterSelectedBackground] = useState<string>(activeFilter);

    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();

    useEffect(() => {
        setFilterOptions([
            {
                uniqueName: "All",//unique identifier name for the control
                isRenderAsForm: true, //Indicates whether render as form or not 
                label: "All", //Label to show for the toggle 
                value: activeFilter.toLowerCase() === "all" ? "1" : "0", // Indicates the toggle is ON (can be "0" for OFF)
                isDefault: false, // Whether value set by default or not
                tooltip: "All", //Tooltip to show on the control
                disabled: false, // Disable the toggle control

            },
            {
                uniqueName: "Waiting",//unique identifier name fWaiting the control
                isRenderAsForm: true, //Indicates whether render as fWaitingm Waiting not 
                label: "Waiting", //Label to show fWaiting the toggle 
                value: activeFilter.toLowerCase() === "waiting" ? "1" : "0", // Indicates the toggle is ON (can be "0" fWaiting OFF)
                isDefault: false, // Whether value set by default Waiting not
                tooltip: "Waiting", //Tooltip to show on the control
                disabled: false, // Disable the toggle control

            },
            {
                uniqueName: "Suspended",//unique identifier name fSuspended the control
                isRenderAsForm: true, //Indicates whether render as fSuspendedm Suspended not 
                label: "Suspended", //Label to show fSuspended the toggle 
                value: activeFilter.toLowerCase() === "suspended" ? "1" : "0", // Indicates the toggle is ON (can be "0" fSuspended OFF)
                isDefault: false, // Whether value set by default Suspended not
                tooltip: "Suspended", //Tooltip to show on the control
                disabled: false, // Disable the toggle control

            },
            {
                uniqueName: "Processing",//unique identifier name fProcessing the control
                isRenderAsForm: true, //Indicates whether render as fProcessingm Processing not 
                label: "Processing", //Label to show fProcessing the toggle 
                value: activeFilter.toLowerCase() === "processing" ? "1" : "0", // Indicates the toggle is ON (can be "0" fProcessing OFF)
                isDefault: false, // Whether value set by default Processing not
                tooltip: "Processing", //Tooltip to show on the control
                disabled: false, // Disable the toggle control

            },
            {
                uniqueName: "Closed",//unique identifier name fProcessing the control
                isRenderAsForm: true, //Indicates whether render as fProcessingm Processing not 
                label: "Closed", //Label to show fProcessing the toggle 
                value: activeFilter.toLowerCase() === "closed" ? "1" : "0", // Indicates the toggle is ON (can be "0" fProcessing OFF)
                isDefault: false, // Whether value set by default Processing not
                tooltip: "Closed", //Tooltip to show on the control
                disabled: false, // Disable the toggle control

            },
        ])
    }, [])

    useEffect(() => {
        fetchTasks(activeFilter.toLowerCase());
    }, [featureId]);

    const fetchTasks = async (filterBy: string) => {
        try {
            setIsLoading(true);

            axiosInterceptor(
                {
                    url: TQ.GetBackgroundTasks,
                    data: { taskStatusFilter: "" },
                    setFetchData: (data: unknown, status?: string | number) => {
                        try {
                            if ((status === "200" || status === 200) && data && typeof data === "object" && "taskJson" in data && data.taskJson) {

                                let parsed: Record<string, any>[] = [];

                                try {
                                    parsed = FnHandleAPIResponse(data.taskJson as string, "Dataset") || [];
                                } catch (err) {
                                    console.error("API response parsing error:", err);
                                    parsed = [];
                                }

                                let pending = 0;

                                pending = parsed.filter(
                                    (t: Record<string, any>) => t?.TaskStatus === "Open"
                                ).length;

                                let Processinglist: Record<string, any>[] = [];

                                try {
                                    if (!filterBy || filterBy.toLowerCase() === "all") {
                                        Processinglist = [...parsed].sort(
                                            (a: Record<string, any>, b: Record<string, any>) =>
                                                new Date(b?.TaskAddedDateTime || 0).getTime() -
                                                new Date(a?.TaskAddedDateTime || 0).getTime()
                                        );
                                    } else {
                                        Processinglist = parsed
                                            .filter(
                                                (t: Record<string, any>) =>
                                                    (t?.TaskStatus || "").toLowerCase() ===
                                                    filterBy.toLowerCase()
                                            )
                                            .sort(
                                                (a: Record<string, any>, b: Record<string, any>) =>
                                                    new Date(b?.TaskAddedDateTime || 0).getTime() -
                                                    new Date(a?.TaskAddedDateTime || 0).getTime()
                                            );
                                    }
                                } catch (err) {
                                    console.error("Filtering/sorting error:", err);
                                }

                                try {
                                    setTaskList(Processinglist);
                                    setTaskListOriginal(parsed);
                                    handleOpenTaskCount?.(pending);
                                } catch (err) {
                                    console.error("State update error:", err);
                                }

                            } else {
                                // API success but no data
                                setTaskList([]);
                                setTaskListOriginal([]);

                            }
                        } catch (err) {
                            console.error("setFetchData error:", err);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
                statusBarContext
            );

        } catch (error) {
            console.error("fetchTasks error:", error);
            setIsLoading(false);
        }
    };

    const handleBackgroundTaskNodeMenu = async (
        menu: IActionImageForSubMenu,
        selectedRow: Record<string, any>
    ) => {
        try {
            try {
                setSelectedRow(selectedRow);
                setMenu(menu);
            } catch (err) {
                console.error("State update error:", err);
            }

            const label = menu?.payload?.Label;

            if (
                typeof label === "string" && label &&
                (label === RightMouseMenuGrid.LowerPriority.toString() ||
                    label === RightMouseMenuGrid.RaisePriority.toString() ||
                    label === RightMouseMenuGrid.Suspend.toString() ||
                    label === RightMouseMenuGrid.Kill.toString() ||
                    label === RightMouseMenuGrid.Delete.toString() ||
                    label === RightMouseMenuGrid.OSResume.toString())
            ) {

                let errorMsg = "";
                errorMsg = `${label} ${selectedRow?._BackgroundTaskQueue}`;

                try {
                    const result = await FnCreateMessage(
                        'audit',
                        '151',
                        errorMsg,
                        statusBarContext,
                        undefined,
                        undefined
                    );

                    if (result?.length) {
                        setIsShowOkOnly(false);
                        setIsConfirmOpen(true);
                        setConfirmMessage(result);
                    }
                } catch (err) {
                    console.error("FnCreateMessage error:", err);
                }

            } else if (label === RightMouseMenuGrid.Refresh.toString()) {

                try {
                    fetchTasks(filterSelectedBackground);
                } catch (err) {
                    console.error("fetchTasks error:", err);
                }
            }

        } catch (error) {
            console.error("handleNodeMenuOnClick error:", error);
        }
    };

    const handleNodeMenuOnClick = (
        menu: IActionImageForSubMenu,
        selectedRow: unknown,
        _containerName: string
    ): void => {

        if (!isTaskRecord(selectedRow)) {
            return;
        }

        void handleBackgroundTaskNodeMenu(menu, selectedRow);
    };
    const handleFilterSelect = (value: Record<string, any>) => {
        try {
            if (!value) return;

            const selectedValue = value?.uniqueName || value?.label || "";
            savedBackgroundTaskFilter = selectedValue;
            handleFilterChange?.(selectedValue);

            const list = Array.isArray(taskListOriginal) ? taskListOriginal : [];

            if (value?.uniqueName === "All") {

                let Processinglist = [...list].sort(
                    (a: Record<string, any>, b: Record<string, any>) =>
                        new Date(b?.TaskAddedDateTime || 0).getTime() -
                        new Date(a?.TaskAddedDateTime || 0).getTime()
                );

                setTaskList(Processinglist);

            } else {

                const filtered = list
                    .filter(
                        (item: Record<string, any>) =>
                            (item?.TaskStatus || "")
                                .toLowerCase() ===
                            (value?.uniqueName || "").toLowerCase()
                    )
                    .sort(
                        (a: Record<string, any>, b: Record<string, any>) =>
                            new Date(b?.TaskAddedDateTime || 0).getTime() -
                            new Date(a?.TaskAddedDateTime || 0).getTime()
                    );

                setTaskList(filtered);
            }

            try {
                setFilterSelectedBackground(value?.label);
            } catch (err) {
                console.error("setFilterSelectedBackground error:", err);
            }

        } catch (error) {
            console.error("handleFilterSelect error:", error);
        }
    };

    const handleConfirmYesClick = (): void => {
        try {
            if (selectedRow?.RecID) {

                const label = menu?.payload?.Label;

                if (
                    selectedRow?.TaskStatus && typeof label === "string" && label &&
                    (
                        label === RightMouseMenuGrid.Kill.toString() ||
                        label === RightMouseMenuGrid.Suspend.toString() ||
                        label === RightMouseMenuGrid.LowerPriority.toString() ||
                        label === RightMouseMenuGrid.RaisePriority.toString()
                    )
                ) {

                    let status = "";

                    try {
                        if (label === RightMouseMenuGrid.Kill) {
                            status = "Killed";
                        } else if (label === RightMouseMenuGrid.Suspend) {
                            status = "Suspended";
                        } else if (label === RightMouseMenuGrid.RaisePriority) {
                            status = "RaisePriority";
                        } else if (label === RightMouseMenuGrid.LowerPriority) {
                            status = "LowerPriority";
                        } else {
                            status = "Delete";
                        }
                    } catch (err) {
                        console.error("Status mapping error:", err);
                    }

                    const payloadFinalizeBackgroundtask = {
                        backgroundTaskID: selectedRow?.EntID,
                        taskStatus: status,
                        taskError: ""
                    };

                    const handleFinalizeBackgroundtaskResponse = (resp: unknown, status?: string | number) => {
                        try {
                            if ((status === "200" || status === 200) && resp !== undefined) {

                                const payload: IFnCreateForensiclog = {
                                    logType: 'UserAction',
                                    GroupName: LogGroupName.ForensicLogTemplate,
                                    _Forensiclog: LogSubGroupName.AppQatask,
                                    SubGroupName: LogSubGroupName.AppQatask,
                                    LogName: LogName.task,
                                    actionObject: {
                                        taskName: selectedRow?._BackgroundTaskQueue,
                                        StatusName: status,
                                        taskType: "Background Task"
                                    },
                                    sessionContext: sessionContext,
                                    statusBarContext: statusBarContext,
                                    RefTableItems: mainAppContext?.refTableRecords
                                };

                                try {
                                    FnCreateForensiclog(payload);
                                } catch (err) {
                                    console.error("Forensic log error:", err);
                                }

                                try {
                                    fetchTasks(filterSelectedBackground);
                                } catch (err) {
                                    console.error("fetchTasks error:", err);
                                }
                            }
                        } catch (err) {
                            console.error("Finalize API response error:", err);
                        }
                    };

                    axiosInterceptor(
                        {
                            url: TQ.FinalizeBackgroundtask,
                            data: payloadFinalizeBackgroundtask,
                            setFetchData: handleFinalizeBackgroundtaskResponse
                        },
                        statusBarContext
                    );


                } else if (
                    label === RightMouseMenuGrid.Delete.toString() &&
                    selectedRow?.EntID &&
                    selectedRow?.RecID
                ) {

                    if (selectedRow?.IsNZ) {
                        setIsShowOkOnly(true);
                        setConfirmMessage(
                            "This record cannot be deleted because it is a required record for application to work."
                        );
                        setIsConfirmOpen(true);
                        return;
                    }

                    axiosInterceptor(
                        {
                            url: EM.DeleteEntityRecords,
                            data: {
                                entityName: selectedRow?.EntityName,
                                entIDs: selectedRow?.EntID
                            },
                            setFetchData: (deleteEntityRecordsApiResponse: unknown, status?: string | number) => {
                                try {
                                    if ((status === "200" || status === 200) && deleteEntityRecordsApiResponse === "") {

                                        const payload: IFnCreateForensiclog = {
                                            logType: 'UserAction',
                                            GroupName: LogGroupName.ForensicLogTemplate,
                                            _Forensiclog: LogSubGroupName.AppQatask,
                                            SubGroupName: LogSubGroupName.AppQatask,
                                            LogName: LogName.taskDelete,
                                            actionObject: {
                                                taskName: selectedRow?._BackgroundTaskQueue,
                                                taskType: "Background Task"
                                            },
                                            sessionContext: sessionContext,
                                            statusBarContext: statusBarContext,
                                            RefTableItems: mainAppContext?.refTableRecords
                                        };

                                        try {
                                            FnCreateForensiclog(payload);
                                        } catch (err) {
                                            console.error("Forensic log error:", err);
                                        }

                                        try {
                                            fetchTasks(filterSelectedBackground);
                                        } catch (err) {
                                            console.error("fetchTasks error:", err);
                                        }
                                    }
                                } catch (err) {
                                    console.error("Delete API response error:", err);
                                }
                            }
                        },
                        statusBarContext
                    );

                }
            }

            try {
                setConfirmMessage("");
                setIsConfirmOpen(false);
            } catch (err) {
                console.error("Cleanup state error:", err);
            }

        } catch (error) {
            console.error("handleConfirmYesClick error:", error);
        }
    };

    const getNoDataMessage = (): string => {
        if (Array.isArray(taskListOriginal) && taskListOriginal.length > 0) {
            const statusLabel = filterSelectedBackground?.trim() || "selected";
            return `No ${statusLabel.toLowerCase() === "all" ? "" : statusLabel.toLowerCase()} background tasks.`;
        }
        return "Background tasks are not found";
    };

    return (
        <div className='nz-task-container'>
            <div id="backgroundtask" className="nz-background-task-container">
                <div className='nz-sub-header'>
                    {filterOptions && Array.isArray(taskListOriginal) && taskListOriginal && taskListOriginal?.length > 0 ?
                        <OptionsFilter showIcon={true} uniqueName={'app-qa-filter'} container={'ap-filter'}
                            handleSelect={handleFilterSelect}
                            options={filterOptions}
                            disableUncheck={true}
                        />
                        :
                        null
                    }
                    <Label uniqueName={`${uniqueName}-task-header`} label={`Background Task ${taskList.length > 0 ? `(${taskList.length})` : ""} ${filterSelectedBackground ? `(${filterSelectedBackground})` : ""} `} />
                </div>
                {isLoading ? (
                    <div className="nz-loading-message">Loading...</div>
                ) : !taskList?.length ? (
                    <div className="nz-no-data-message">{getNoDataMessage()}</div>
                ) : (
                    <>
                        <div key={uniqueName} className="nz-appqa-task-container">
                            {taskList.map((item: Record<string, any>, index: number) => {
                                const cardFields = buildBackgroundTaskCardFields(item, uniqueName ?? "background-task", index);

                                return (
                                    <CardLayout
                                        key={`task-background-card-${index}`}
                                        uniqueName={`task${index}`}
                                        className="nz-background-task-card-item"
                                        data={item}
                                        fields={cardFields}
                                        featureId={AppQA.Task}
                                        featureData={featureData}
                                        containerName="background_tasks"
                                        handleNodeMenuOnClick={handleNodeMenuOnClick}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'appqatask-confirm'}
                message={confirmMessage}
                showOkButton={isShowOkOnly}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={function (): void {
                    setConfirmMessage("");
                    setIsConfirmOpen(false)
                }}
                handleOkButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false)
                }} />
        </div>
    );
};

export { BackgroundTasks };

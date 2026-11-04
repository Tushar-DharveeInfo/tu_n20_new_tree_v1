
import { useEffect, useState } from 'react';
import { ISqlJobs } from '../../allinterface/IAppqaTask'
import { OptionsFilter } from '../../../shared/basic/optionsfilter/OptionsFilter';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { SQLJOB } from '../../../shared/interceptors/EndPoints';
import { Label } from '../../../shared/basic/label/Label';
import { CardLayout } from '../../../shared/cardlayout/CardLayout';
import { ICardLayoutField } from '../../../shared/allinterface/cardlayout/ICardLayout';
import { AppQA } from '../../../constants/Feature';
import { IActionImageForSubMenu } from '../../../shared/allinterface/basic/IActionImageList';
import { RightMouseMenuGrid } from '../../../constants/Feature';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { FnCreateMessage } from '../../allcommon/FnCreateMessage';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { IFnCreateForensiclog } from '../../../appcontainer/allinterface/IFnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { FnCreateForensiclog } from '../../../appcontainer/allcommon/FnCreateForensiclog';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { IOptionItem } from '../../../shared/allinterface/basic/IOptionsFilter';

const sqljobOptions = [
    {
        uniqueName: "All",//unique identifier name for the control
        isRenderAsForm: true, //Indicates whether render as form or not 
        label: "All", //Label to show for the toggle 
        value: "1", // Indicates the toggle is ON (can be "0" for OFF)
        isDefault: false, // Whether value set by default or not
        tooltip: "All", //Tooltip to show on the control
        disabled: false, // Disable the toggle control

    },
    {
        uniqueName: "Enable",//unique identifier name Enable the control
        isRenderAsForm: true, //Indicates whether render as Enable Waiting not 
        label: "Enable", //Label to show Enable the toggle 
        value: "0", // Indicates the toggle is ON (can be "0" Enable OFF)
        isDefault: false, // Whether value set by default Waiting not
        tooltip: "Enable", //Tooltip to show on the control
        disabled: false, // Disable the toggle control

    },
    {
        uniqueName: "Disable",//unique identifier name Disable the control
        isRenderAsForm: true, //Indicates whether render as Disable Waiting not 
        label: "Disable", //Label to show Disable the toggle 
        value: "0", // Indicates the toggle is ON (can be "0" Disable OFF)
        isDefault: false, // Whether value set by default Waiting not
        tooltip: "Disable", //Tooltip to show on the control
        disabled: false, // Disable the toggle control

    }
]

const DETAIL_FONT_SIZE = "10px";

const isSqlJobRecord = (value: unknown): value is Record<string, any> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

/** Builds CardLayout name/value rows from a SQL job record. */
const buildSqlJobCardFields = (
    item: Record<string, any>,
    uniqueName: string,
    index: number
): ICardLayoutField[] => [
        {
            Name: "",
            Value: item.JobName || "—",
            Header: 1,
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-name-${index}`}
                    label={item.JobName}
                    fontWeight="bold"
                />
            ),
        },
        {
            Name: "",
            Value: item.JobDescription || "",
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-description-${index}`}
                    label={`${item.JobDescription ?? ""}`}
                    fontSize={DETAIL_FONT_SIZE}
                />
            ),
        },
        {
            Name: "",
            Value: item.JobStatus || "",
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-status-${index}`}
                    label={`Job Status : ${item.JobStatus ?? ""}`}
                    fontSize={DETAIL_FONT_SIZE}
                />
            ),
        },
    ];

let savedSqlJobFilter = "";

const SqlJobs = (sqlJobsProps: ISqlJobs) => {
    const activeFilter = sqlJobsProps.savedFilter ?? savedSqlJobFilter ?? "";
    const [sqlRow, setSqlRow] = useState<Record<string, any>[]>([]);
    const [sqlRowOriginal, setSqlRowOriginal] = useState<Record<string, any>[]>([]);
    const [sqlJobCount, setSqlJobCount] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [filterSelectedSqljob, setFilterSelectedSqljob] = useState(activeFilter);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
    const [menu, setMenu] = useState<Record<string, any> | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();

    const isAll = !activeFilter || activeFilter.toLowerCase() === "all";
    const currentOptions: IOptionItem[] = [
        {
            uniqueName: "All",
            isRenderAsForm: true,
            label: "All",
            value: isAll ? "1" : "0",
            isDefault: isAll,
            tooltip: "All",
            disabled: false,
        },
        {
            uniqueName: "Enable",
            isRenderAsForm: true,
            label: "Enable",
            value: (!isAll && activeFilter.toLowerCase() === "enable") ? "1" : "0",
            isDefault: !isAll && activeFilter.toLowerCase() === "enable",
            tooltip: "Enable",
            disabled: false,
        },
        {
            uniqueName: "Disable",
            isRenderAsForm: true,
            label: "Disable",
            value: (!isAll && activeFilter.toLowerCase() === "disable") ? "1" : "0",
            isDefault: !isAll && activeFilter.toLowerCase() === "disable",
            tooltip: "Disable",
            disabled: false,
        }
    ];

    useEffect(() => {
        getalljobs();
    }, [sqlJobsProps.featureId]);

    const getalljobs = async () => {
        setIsLoading(true);
        axiosInterceptor({
            url: SQLJOB.GetAllJobs,
            data: {},
            setFetchData: (resp: unknown, status?: string) => {
                if (status === "200" && resp && typeof resp === "object" && "sqlJobsJson" in resp && resp.sqlJobsJson) {
                    let apiData = FnParseJsonSafely(resp.sqlJobsJson as string)
                    if (apiData) {
                        let apiObj = Object.values(apiData)
                        if (Array.isArray(apiObj) && apiObj.length) {
                            let data: any = apiObj[0]
                            let firstKey = data && Object.keys(data[0])[0];
                            const sortedData = [...data].sort((a, b) =>
                                (a[firstKey] || "").toString().localeCompare(
                                    (b[firstKey] || "").toString()
                                )
                            );
                            setSqlRowOriginal(sortedData);
                            const isAllSelected = !activeFilter || activeFilter.toLowerCase() === "all";
                            if (!isAllSelected) {
                                const isEnabled = activeFilter.toLowerCase() === "enable";
                                const filtered = sortedData.filter(
                                    (item: Record<string, any>) => item.Enable === isEnabled
                                );
                                setSqlRow(filtered);
                                setSqlJobCount(filtered.length || 0);
                                setFilterSelectedSqljob(activeFilter);
                            } else {
                                setSqlRow(sortedData);
                                setSqlJobCount(sortedData.length);
                                setFilterSelectedSqljob("");
                            }
                            sqlJobsProps.handleSqlJobCount?.(sortedData.length);
                        }
                        else {
                            setSqlJobCount(0);
                            setSqlRow([]);
                        }
                    }
                    else {
                        setSqlJobCount(0);
                        setSqlRow([]);
                    }
                } else {
                    setSqlJobCount(0);
                    setSqlRow([]);
                }
                setIsLoading(false);
            }
        }, statusBarContext);
    };
    const handleSqlJobFilterSelect = (value: Record<string, any>): void => {
        const selectedVal = value.uniqueName === "All" ? "" : value.uniqueName;
        savedSqlJobFilter = selectedVal;
        sqlJobsProps.handleFilterChange?.(selectedVal);
        if (value.uniqueName === "All") {
            setSqlRow(sqlRowOriginal);
            setSqlJobCount(sqlRowOriginal.length || 0);
            setFilterSelectedSqljob("");
        } else {
            const isEnabled = value.uniqueName === "Enable";
            const filtered = sqlRowOriginal.filter(
                (item: Record<string, any>) => item.Enable === isEnabled
            );

            setSqlRow(filtered);
            setSqlJobCount(filtered.length || 0);
            setFilterSelectedSqljob(value.label);
        }
    }

    const handleSqlJobNodeMenu = async (
        menu: IActionImageForSubMenu,
        selectedRow: Record<string, any>
    ) => {
        setSelectedRow(selectedRow);
        setMenu(menu);

        if (selectedRow && menu?.payload?.Label === RightMouseMenuGrid.SQLJobStart.toString()
            || menu?.payload?.Label === RightMouseMenuGrid.SQLJobStop.toString()
            || menu?.payload?.Label === RightMouseMenuGrid.SQLJobDelete.toString()
            || menu?.payload?.Label === RightMouseMenuGrid.SQLJobStartAll.toString()
            || menu?.payload?.Label === RightMouseMenuGrid.SQLJobStopAll.toString()
            || menu?.payload?.Label === RightMouseMenuGrid.SQLJobDeleteAll.toString()) {
            let errorMsg = `${menu?.payload.Label} ${selectedRow?.JobName}`;
            // Are you sure you want to {#status}?
            const result = await FnCreateMessage('audit', '151', errorMsg, statusBarContext, undefined, undefined)
            if (result?.length) {
                setIsConfirmOpen(true);
                setConfirmMessage(result)
            }

        } else if (menu?.payload && menu?.payload.Label === RightMouseMenuGrid.Refresh.toString()) {
            getalljobs();
        }
    }

    const handleNodeMenuOnClick = (
        menu: IActionImageForSubMenu,
        selectedRow: unknown,
        _containerName: string
    ): void => {
        if (!isSqlJobRecord(selectedRow)) {
            return;
        }

        void handleSqlJobNodeMenu(menu, selectedRow);
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
                taskType: "SQL Job"
            },
            sessionContext: sessionContext,
            statusBarContext: statusBarContext,
            RefTableItems: mainAppContext.refTableRecords
        }
        FnCreateForensiclog(payload)
    }
    const callApiForJob = async (jobName: string, actionName: string) => {
        if (menu) {
            await axiosInterceptor({
                url: SQLJOB.SetAction,
                data: {
                    jobName: jobName,
                    actionName: actionName
                },
                setFetchData: (resp: unknown, status?: string) => {
                    if (resp !== undefined && status === "200") {
                        createLogForStatusChange(actionName, jobName)
                        getalljobs();
                    }
                }
            }, statusBarContext)
        }
    }

    const handleConfirmYesClick = (): void => {
        if (selectedRow?.JobName) {

            if (menu?.payload.Label === RightMouseMenuGrid.SQLJobStart.toString()) {
                callApiForJob(selectedRow?.JobName, "start");
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.SQLJobStop.toString()) {
                callApiForJob(selectedRow?.JobName, "stop");
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.SQLJobDelete.toString()) {
                callApiForJob(selectedRow?.JobName, "delete");
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.SQLJobStartAll.toString()) {
                callApiForJob("", "start");
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.SQLJobStopAll.toString()) {
                callApiForJob("", "stop");
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.SQLJobDeleteAll.toString()) {
                callApiForJob("", "delete");
            }
        }
        setConfirmMessage("");
        setIsConfirmOpen(false)
    }

    return (
        <div>
            {sqlRow ?
                <div id='sqljobs' className={"nz-OnetoOne-Grid nz-hw-prop-table-multi BackgroundTasks nz-sqljob-list-container"}>
                    <div className='nz-sub-header'>
                        {sqlRowOriginal && sqlRowOriginal?.length > 0 ?
                            <OptionsFilter showIcon={true} uniqueName={'app-qa-filter'} container={'ap-filter'}
                                handleSelect={handleSqlJobFilterSelect}
                                options={currentOptions}
                                disableUncheck={true}
                            />
                            :
                            null
                        }
                        <Label uniqueName={`${sqlJobsProps.uniqueName}-task-header`} label={`SQL Jobs${sqlRow?.length > 0 ? ` (${sqlJobCount})` : ""} ${filterSelectedSqljob ? `(${filterSelectedSqljob})` : ""}`} />

                    </div>
                    {isLoading ? (
                        <div className="nz-loading-message">Loading...</div>
                    ) : !sqlRow?.length ? (
                        <div className="nz-no-data-message">Sql Jobs are not found to display</div>
                    ) : (
                        <>
                            <div key={sqlJobsProps.uniqueName} className="nz-appqa-task-container">
                                {sqlRow.map((item: Record<string, any>, index: number) => {
                                    const cardFields = buildSqlJobCardFields(
                                        item,
                                        sqlJobsProps.uniqueName ?? "sql-job",
                                        index
                                    );

                                    return (
                                        <CardLayout
                                            key={`task-sqljob-card-${index}`}
                                            uniqueName={`sql_job${index}`}
                                            className="nz-sqljob-card-item"
                                            data={item}
                                            fields={cardFields}
                                            featureId={AppQA.Task}
                                            featureData={sqlJobsProps.featureData}
                                            containerName="sql_job"
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

export { SqlJobs }
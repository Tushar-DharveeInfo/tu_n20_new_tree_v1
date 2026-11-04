
import { useCallback, useEffect, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import '../../../allcss/appqasettingscontainer/admintool/AdminTool.css';
import { FeatureState } from '../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { FnGetTaskCompletionMessage } from '../../../allcommon/FnGetTaskCompletionMessage';
import { IAdminTool } from '../../../allinterface/iappqasettingscontainer/admintool/IAdminTool';
import { BaseAdminTool } from './baseadmintool/BaseAdminTool';

const taskJson = [
    {
        "FeatureName": "Signout",
        "Required": true,
        "Skip": false,
        "TaskLabel": "CloseOpenSessions",
        "TaskName": "CloseOpenSessions",
        "TaskResponse": null,
        "TaskTooltip": "Close all open Session of the current user"
    },
    {
        "FeatureName": "Signout",
        "Required": true,
        "Skip": false,
        "TaskLabel": "CloseBrowserTabs",
        "TaskName": "CloseBrowserTabs",
        "TaskResponse": null,
        "TaskTooltip": "Close all open Browser Tabs except one of thecurrent user"
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "CloseAllSessions",
        "TaskName": "CloseAllSessions",
        "TaskResponse": null,
        "TaskTooltip": "Except current Session, Close all open sessions of users "
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "Purge Task Queue",
        "TaskName": "Purge Task Queue",
        "TaskResponse": null,
        "TaskTooltip": "Purge NetZoom's internal background Task Queue"
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "Database Backup",
        "TaskName": "Database Backup",
        "TaskResponse": null,
        "TaskTooltip": "Perform NetZoom Database backup"
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "DB Purge",
        "TaskName": "DB Purge",
        "TaskResponse": null,
        "TaskTooltip": "Purge system logs as per AP settings "
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "Archive Table",
        "TaskName": "Archive Table",
        "TaskResponse": null,
        "TaskTooltip": "Archive records from tables as per AP settings "
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "Re-Index Database",
        "TaskName": "Re-Index Database",
        "TaskResponse": null,
        "TaskTooltip": "Re-index NetZoom Database"
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": true,
        "Skip": false,
        "TaskLabel": "Shrink Database",
        "TaskName": "Shrink Database",
        "TaskResponse": null,
        "TaskTooltip": "Shrink NetZoom Database"
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": true,
        "Skip": false,
        "TaskLabel": "Shrink Temp DB",
        "TaskName": "Shrink Temp DB",
        "TaskResponse": null,
        "TaskTooltip": "Shrink temp tables used by NetZoom Database"
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "Database Integrity",
        "TaskName": "Database Integrity",
        "TaskResponse": null,
        "TaskTooltip": "Perform Database Integrity"
    },
    {
        "FeatureName": "Optimize NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "Update Statistics",
        "TaskName": "Update Statistics",
        "TaskResponse": null,
        "TaskTooltip": "Update NetZoom Database Statistics for performance improvement"
    },
    {
        "FeatureName": "Start NetZoom",
        "Required": false,
        "Skip": false,
        "TaskLabel": "CloseAllSessions",
        "TaskName": "CloseAllSessions",
        "TaskResponse": null,
        "TaskTooltip": "Except current Session, Close all open sessions of users "
    },
    {
        "FeatureName": "Start NetZoom",
        "Required": true,
        "Skip": true,
        "TaskLabel": "Reconfigure",
        "TaskName": "Reconfigure",
        "TaskResponse": null,
        "TaskTooltip": "Reconfigure NetZoom"
    },
    {
        "FeatureName": "Start NetZoom",
        "Required": true,
        "Skip": false,
        "TaskLabel": "StartNetZoom",
        "TaskName": "StartNetZoom",
        "TaskResponse": null,
        "TaskTooltip": "Start NetZoom"
    },
    {
        "FeatureName": "Stop NetZoom",
        "Required": true,
        "Skip": false,
        "TaskLabel": "CloseAllSessions",
        "TaskName": "CloseAllSessions",
        "TaskResponse": null,
        "TaskTooltip": "Except current Session, Close all open sessions of users "
    },
    {
        "FeatureName": "Stop NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "T2",
        "TaskName": "T2",
        "TaskResponse": null,
        "TaskTooltip": "T2 tooltip"
    },
    {
        "FeatureName": "Stop NetZoom",
        "Required": null,
        "Skip": false,
        "TaskLabel": "T3",
        "TaskName": "T3",
        "TaskResponse": null,
        "TaskTooltip": "T3  tooltip"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "CloseAllSessions",
        "TaskName": "CloseAllSessions",
        "TaskResponse": null,
        "TaskTooltip": "Except current Session, Close all open sessions of users "
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "CreateNewDatabase",
        "TaskName": "CreateNewDatabase",
        "TaskResponse": null,
        "TaskTooltip": "CreateNewDatabase"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "MigrateNetZoomEntities",
        "TaskName": "MigrateNetZoomEntities",
        "TaskResponse": null,
        "TaskTooltip": "Migrate NetZoom Entities"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "MigrateDeviceEntities",
        "TaskName": "MigrateDeviceEntities",
        "TaskResponse": null,
        "TaskTooltip": "MigrateDeviceEntities"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "DBPurge",
        "TaskName": "DBPurge",
        "TaskResponse": null,
        "TaskTooltip": "Purge NetZoom's internal background Task Queue"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "Re-IndexDatabase",
        "TaskName": "Re-IndexDatabase",
        "TaskResponse": null,
        "TaskTooltip": "Re-index NetZoom Database"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "ShrinkDatabase",
        "TaskName": "ShrinkDatabase",
        "TaskResponse": null,
        "TaskTooltip": "Shrink NetZoom Database"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "ShrinkTempDB",
        "TaskName": "ShrinkTempDB",
        "TaskResponse": null,
        "TaskTooltip": "Shrink temp tables used by NetZoom Database"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": null,
        "Skip": false,
        "TaskLabel": "DatabaseIntegrity",
        "TaskName": "DatabaseIntegrity",
        "TaskResponse": null,
        "TaskTooltip": "Perform Database Integrity"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": null,
        "Skip": false,
        "TaskLabel": "UpdateStatistics",
        "TaskName": "UpdateStatistics",
        "TaskResponse": null,
        "TaskTooltip": "Update NetZoom Database Statistics for performance improvement"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "Reconfigure",
        "TaskName": "Reconfigure",
        "TaskResponse": null,
        "TaskTooltip": "Reconfigure NetZoom"
    },
    {
        "FeatureName": "Migrate Version 18",
        "Required": true,
        "Skip": false,
        "TaskLabel": "StartNetZoom",
        "TaskName": "StartNetZoom",
        "TaskResponse": null,
        "TaskTooltip": "Start NetZoom"
    }
]


const AdminTool = (adminTasksProps: IAdminTool) => {
    const [rowData, setRowData] = useState<any[]>([]);
    const [featureState, setFeatureState] = useState<FeatureState>(FeatureState.Stopped);

    const [featureLabel, setFeatureLabel] = useState<string | null>(null)
    const featureStateRef = useRef<FeatureState>(featureState);
    const columnDefs: ColDef[] = [
        {
            headerName: 'Skip',
            field: 'skip',
            cellRenderer: (params: any) => {
                const { data, node, api } = params;
                const isRequired = data.required;

                const isChecked = Boolean(data.skip || data.checked);

                return (
                    <div
                        className={`nz-checkbox-group ${isRequired ? "nz-disabled" : ""}`}
                        title={isRequired ? "Disabled" : ""}
                        onClick={() => {
                            if (isRequired) return;

                            const updated = !isChecked;

                            // update this row only
                            node.setData({
                                ...data,
                                checked: updated,
                                skip: false
                            });
                        }}
                    >
                        <div className="nz-toggle-label">
                            <input
                                type="checkbox"
                                className="nz-native-checkbox"
                                checked={isChecked}
                                readOnly      /* AG-GRID OWNS THE CLICK */
                                tabIndex={-1}
                            />
                            <span className="nz-checkbox-container">
                                <span className="nz-checkbox-box"></span>
                            </span>
                        </div>
                    </div>
                );
            },
            minWidth: 40,
            width: 80
        },
        {
            headerName: 'Task',
            field: 'taskLabel',
            tooltipField: 'taskTooltip',
            minWidth: 250,
            cellClass: (params) => params.data.required ? 'disabled-task-label' : '',
        },
        { headerName: 'Status', field: 'response', flex: 1, resizable: false }
    ];

    useEffect(() => {
        setFeatureLabel(adminTasksProps.featureLabel);
    }, [adminTasksProps.featureLabel])


    useEffect(() => {
        if (featureLabel && taskJson) {

            const filteredTasks = taskJson.filter((task) => featureLabel.includes(task.FeatureName));

            const taskRows = filteredTasks.map((task, index) => ({
                id: index + 1,
                required: task.Required ? true : false,
                skip: false,
                taskLabel: task.TaskLabel,
                taskTooltip: task.TaskTooltip,
                response: task.TaskResponse,
                taskName: task.TaskName,
                // checked: false
            }));

            setRowData(taskRows);

        }
    }, [featureLabel]);


    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleStart = async () => {
        setFeatureState(FeatureState.Running);
    };

    const handlePause = () => {
        setFeatureState(FeatureState.Paused);
    };

    const handleResume = () => {
        setFeatureState(FeatureState.Running);
        handleStart();
    };

    const handleStop = () => {
        setFeatureState(FeatureState.Stopped);

        const updatedRows = rowData.map(row => {
            if (!row.checked && !row.skip && !row.required) {
                row.response = "Cancelled";
            }
            return row;
        });
        setRowData(updatedRows);
    };

    const processTasks = useCallback(async () => {
        let i = 0;
        let isPaused: boolean = false;
        while (i < rowData.length) {
            const row = rowData[i];

            if (!row.checked && !row.skip && !row.required) {
                if (featureStateRef.current === FeatureState.Running) {
                    const startTime = Date.now();
                    await delay(1000);

                    const taskCompletionMessage = await FnGetTaskCompletionMessage(row.taskName);

                    const endTime = Date.now();
                    const timeTaken = endTime - startTime;
                    row.response = `(${timeTaken}ms) ${taskCompletionMessage}`;
                    row.skip = true;

                    setRowData([...rowData]);
                }

                if (featureStateRef.current === FeatureState.Paused || featureStateRef.current === FeatureState.Stopped) {
                    isPaused = true;
                    break;
                }
            }
            i++;
        }
        if (isPaused === false) {
            setFeatureState(FeatureState.Stopped);
        }
    }, [rowData]);

    useEffect(() => {
        featureStateRef.current = featureState;
        if (featureState === FeatureState.Running) {
            processTasks();
        }
    }, [featureState, processTasks]);




    return (
        <div key={adminTasksProps.uniqueName} className='nz-admin-tasks-container'>
            <BaseAdminTool
                uniqueName={adminTasksProps.uniqueName}
                featureLabel={`Admin/${featureLabel}`}
                description={adminTasksProps.featureDescription}
                tableLabel={featureLabel || ""}
                rowData={rowData}
                columnDefs={columnDefs}
                featureState={featureState}
                handleStart={handleStart}
                handlePause={handlePause}
                handleResume={handleResume}
                handleStop={handleStop} />
        </div>
    )
}

export { AdminTool }
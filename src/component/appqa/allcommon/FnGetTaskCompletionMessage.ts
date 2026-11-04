
// this function returns the task completion mesage based on task name 
 const FnGetTaskCompletionMessage = async (taskName: string) => {
    switch (taskName) {
        case 'CloseOpenSessions':
            return 'All open sessions for the current user have been closed.';

        case 'CloseBrowserTabs':
            return 'All browser tabs (except one) for the current user have been closed.';

        case 'CloseAllSessions':
            return 'All open sessions (except the current session) have been closed.';

        case 'Purge Task Queue':
            return 'NetZoom\'s internal background task queue has been purged.';

        case 'Database Backup':
            return 'NetZoom database backup has been performed successfully.';

        case 'DB Purge':
            return 'System logs have been purged as per AP settings.';

        case 'Archive Table':
            return 'Records from tables have been archived as per AP settings.';

        case 'Re-Index Database':
            return 'NetZoom database has been re-indexed successfully.';

        case 'Shrink Database':
            return 'NetZoom database has been shrunk successfully.';

        case 'Shrink Temp DB':
            return 'Temporary tables used by NetZoom database have been shrunk.';

        case 'Database Integrity':
            return 'Database integrity check has been performed successfully.';

        case 'Update Statistics':
            return 'NetZoom database statistics have been updated for performance improvement.';

        case 'Reconfigure':
            return 'NetZoom has been reconfigured successfully.';

        case 'StartNetZoom':
            return 'NetZoom has been started successfully.';

        case 'CreateNewDatabase':
            return 'A new database has been created successfully.';

        case 'MigrateNetZoomEntities':
            return 'NetZoom entities have been migrated successfully.';

        case 'MigrateDeviceEntities':
            return 'Device entities have been migrated successfully.';

        case 'DBPurge':
            return 'NetZoom\'s internal background task queue has been purged successfully.';

        case 'Re-IndexDatabase':
            return 'NetZoom database has been re-indexed successfully.';

        case 'ShrinkDatabase':
            return 'NetZoom database has been shrunk successfully.';

        case 'ShrinkTempDB':
            return 'Temporary tables used by NetZoom database have been shrunk.';

        default:
            return `Task ${taskName} completed successfully.`;
    }
};

export {FnGetTaskCompletionMessage}
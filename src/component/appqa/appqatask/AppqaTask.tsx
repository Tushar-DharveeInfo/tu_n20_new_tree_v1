
import { useEffect, useState } from 'react'
import '../allcss/AppqaTask.css'
import { IAppqaTask } from '../allinterface/IAppqaTask';
import { OpenSessions } from './opensessions/OpenSessions';
import { WindowsServices } from './windowsservices/WindowsServices';
import { SqlJobs } from './sqljobs/SqlJobs';
import { BackgroundTasksContainer } from './backgroundtaskscontainer/BackgroundTasksContainer';
import { Label } from '../../shared/basic/label/Label';

interface IAppqaTaskSavedFilters {
	backgroundTasks: string;
	openSessions: string;
	windowsServices: string;
	sqlJobs: string;
}

// Stored outside component so when feature container is shown and AppqaTask re-renders/remounts,
// the selected filters remain saved to apply.
const savedTaskFilters: IAppqaTaskSavedFilters = {
	backgroundTasks: "Processing",
	openSessions: "",
	windowsServices: "",
	sqlJobs: ""
};

function AppqaTask(appQATaskProps: IAppqaTask) {
	const refreshInterval = 50000;
	const [bgTaskCount, setBgTaskCount] = useState<number>(0);
	const [openSessionCount, setOpenSessionCount] = useState<number>(0);
	const [windowsServiceCount, setWindowsServiceCount] = useState<number>(0);
	const [sqlJobCount, setSqlJobCount] = useState<number>(0);
	const [currentFilters, setCurrentFilters] = useState<IAppqaTaskSavedFilters>(savedTaskFilters);

	useEffect(() => {
		if (bgTaskCount >= 0 && openSessionCount >= 0 && sqlJobCount >= 0 && windowsServiceCount >= 0) {
			const statusBarString: Record<string, string | number | undefined> = {};
			if (bgTaskCount > 0) {
				statusBarString["PendingTasks"] = bgTaskCount;
			}
			if (openSessionCount > 0) {
				statusBarString["OpenSessions"] = openSessionCount;
			}
			if (windowsServiceCount > 0) {
				statusBarString["Services"] = windowsServiceCount;
			}
			if (sqlJobCount > 0) {
				statusBarString["Jobs"] = sqlJobCount;
			}
			if (appQATaskProps.updateStatusBarData)
				appQATaskProps.updateStatusBarData(JSON.stringify(statusBarString), true);
		}

	}, [bgTaskCount, openSessionCount, sqlJobCount, windowsServiceCount])


	const handleOpenTaskCount = (openTasks: number) => {
		setBgTaskCount(openTasks);
	}

	const handleOpenSessionCount = (openSessions: number): void => {
		setOpenSessionCount(openSessions);
	}

	const handleWindowsServiceCount = (windowsServices: number): void => {
		setWindowsServiceCount(windowsServices);
	}

	const handleSqlJobCount = (sqlJobs: number): void => {
		setSqlJobCount(sqlJobs);
	}

	const handleBackgroundTaskFilterChange = (filter: string) => {
		savedTaskFilters.backgroundTasks = filter;
		setCurrentFilters(prev => ({ ...prev, backgroundTasks: filter }));
	}

	const handleOpenSessionFilterChange = (filter: string) => {
		savedTaskFilters.openSessions = filter;
		setCurrentFilters(prev => ({ ...prev, openSessions: filter }));
	}

	const handleWindowsServiceFilterChange = (filter: string) => {
		savedTaskFilters.windowsServices = filter;
		setCurrentFilters(prev => ({ ...prev, windowsServices: filter }));
	}

	const handleSqlJobFilterChange = (filter: string) => {
		savedTaskFilters.sqlJobs = filter;
		setCurrentFilters(prev => ({ ...prev, sqlJobs: filter }));
	}

	return (
		<div className="nz-appqa-task-main-container" key={appQATaskProps.uniqueName}>
			{appQATaskProps.allowShowHeader &&
				<div className='nz-sub-header  nz-d-flex-row nz-w-100 nz-h-40-px'>
					<Label uniqueName={appQATaskProps.uniqueName + "header"} label={appQATaskProps.headerText} fontWeight="bold" />
				</div>
			}
			<div className='nz-app-qa-task-content'>
				<BackgroundTasksContainer uniqueName={appQATaskProps.uniqueName + '-background-tasks'}
					featureId={appQATaskProps.featureId} featureData={appQATaskProps.featureData}
					interval={refreshInterval}
					handleOpenTaskCount={handleOpenTaskCount}
					savedFilter={currentFilters.backgroundTasks}
					handleFilterChange={handleBackgroundTaskFilterChange} />
				<OpenSessions uniqueName={appQATaskProps.uniqueName + '-open-sessions'}
					featureId={appQATaskProps.featureId} featureData={appQATaskProps.featureData}
					handleOpenSessionCount={handleOpenSessionCount}
					savedFilter={currentFilters.openSessions}
					handleFilterChange={handleOpenSessionFilterChange} />
				<WindowsServices uniqueName={appQATaskProps.uniqueName + '-windows-services'}
					featureId={appQATaskProps.featureId} featureData={appQATaskProps.featureData}
					handleWindowsServiceCount={handleWindowsServiceCount}
					savedFilter={currentFilters.windowsServices}
					handleFilterChange={handleWindowsServiceFilterChange} />
				<SqlJobs uniqueName={appQATaskProps.uniqueName + '-sql-jobs'}
					featureId={appQATaskProps.featureId} featureData={appQATaskProps.featureData}
					handleSqlJobCount={handleSqlJobCount}
					savedFilter={currentFilters.sqlJobs}
					handleFilterChange={handleSqlJobFilterChange} />
			</div>
		</div>
	)
}
export { savedTaskFilters }
export type { IAppqaTaskSavedFilters }
export default AppqaTask
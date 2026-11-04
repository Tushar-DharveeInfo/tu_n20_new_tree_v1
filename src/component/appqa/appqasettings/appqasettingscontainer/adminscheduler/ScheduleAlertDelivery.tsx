
import { useEffect, useState } from 'react';
import { AlertSchedulerForm } from '@n20a/libform';
import '@n20a/libform/style.css';
import { IScheduleAlertDelivery } from '../../../allinterface/iappqasettingscontainer/adminscheduler/IScheduleAlertDelivery';
import { FnGetEnvVariableByKey } from '../../../../appcontainer/allcommon/FnGetEnvVariableByKey';
import { envVarEnums } from '../../../../appcontainer/alldefaultprops/DefaultPropsAppContainer';
import { axiosInterceptorForPostResponse } from '../../../../shared/interceptors/Interceptor';
import { FnGetExpApiUrlBasedOnEndPoint } from '../../../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint';
import { EXPAPI } from '../../../../shared/interceptors/EndPoints';

const ALERT_DELIVERY_SCHEDULER_ENV_PREFIX = 'ALERTSCHEDULER_';

// Converts expapi env response into schedulerConfigProps for ReportSchedulerForm.
const buildSchedulerConfigProps = (response: unknown): Record<string, string> | null => {
    if (!response || typeof response !== 'object') {
        return null;
    }
    const payload = response as Record<string, unknown>;
    if (Array.isArray(payload.data)) {
        return Object.fromEntries(
            payload.data.map((item: { key?: string; value?: unknown }) => [
                item.key ?? '',
                item.value == null ? '' : String(item.value),
            ])
        );
    }
    const data = payload.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        return Object.fromEntries(
            Object.entries(data as Record<string, unknown>).map(([key, value]) => [
                key,
                value == null ? '' : String(value),
            ])
        );
    }
    return null;
};

const ScheduleAlertDelivery = (scheduleDailyTasksProps: IScheduleAlertDelivery) => {
    const { uniqueName } = scheduleDailyTasksProps;
    const [schedulerConfigProps, setSchedulerConfigProps] = useState<Record<string, string>>();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string>();
    const apiRootUrl = FnGetEnvVariableByKey(envVarEnums.EXPSERVER_API_URL) ?? '/expapi';

    // ReportSchedulerForm manages its own save flow,
    // so hide the settings header save action.
    //
    // Load REPORTSCHEDULER_* environment variables
    // from expserver for the scheduler form.
    useEffect(() => {
        let cancelled = false;

        const hideHeaderSaveButton = (): void => {
            const saveButton = document.querySelector<HTMLDivElement>(
                ".nz-form-action-header .nz-form-header-action-save"
            );

            if (saveButton) {
                saveButton.style.display = "none";
            }
        };

        const loadSchedulerConfig = async (): Promise<void> => {
            try {
                const apiResponse = await axiosInterceptorForPostResponse(
                    FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerEnv),
                    {
                        prefixString: ALERT_DELIVERY_SCHEDULER_ENV_PREFIX,
                    }
                );

                if (cancelled) {
                    return;
                }

                if (!apiResponse) {
                    setErrorMessage("No response from server.");
                    return;
                }

                if (apiResponse.status !== 200) {
                    setErrorMessage(
                        `Server returned status ${apiResponse.status}`
                    );
                    return;
                }

                const configProps = buildSchedulerConfigProps(
                    apiResponse.response
                );

                if (!configProps || Object.keys(configProps).length === 0) {
                    setErrorMessage(
                        "Report scheduler environment configuration not found."
                    );
                    return;
                }

                setSchedulerConfigProps(configProps);
                setErrorMessage(undefined);
            } catch (error) {
                console.error(
                    "Failed to load report scheduler configuration:",
                    error
                );

                if (!cancelled) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "Failed to load report scheduler configuration."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        hideHeaderSaveButton();
        void loadSchedulerConfig();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading report scheduler configuration...</div>;
    }

    if (errorMessage || !schedulerConfigProps) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">
                {errorMessage ?? 'Report scheduler configuration not found'}
            </div>
        );
    }

    return (
        <div
            key={uniqueName}
            style={{ padding: 'var(--spacing-1)', paddingLeft: '0px' }}
            className="nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form"
        >
            <AlertSchedulerForm schedulerConfigProps={schedulerConfigProps} apiRootUrl={apiRootUrl} />
        </div>
    );
};
export { ScheduleAlertDelivery };

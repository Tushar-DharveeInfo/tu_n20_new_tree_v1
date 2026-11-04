
import { useEffect, useState } from 'react';
import { KeyValueForm, type IKeyValueSections } from '@n20a/libform';
import '@n20a/libform/style.css';
import '../../../allcss/appqasettingscontainer/admintool/AdminTool.css';
import { IServerStatus } from '../../../allinterface/iappqasettingscontainer/admintool/IServerStatus';
import { axiosInterceptorForPostResponse } from '../../../../shared/interceptors/Interceptor';
import { EXPAPI } from '../../../../shared/interceptors/EndPoints';
import { FnGetExpApiUrlBasedOnEndPoint } from '../../../../appcontainer/allcommon/FnGetExpApiUrlBasedOnEndPoint';
import {
    DEFAULT_SERVER_STATUS_SECTION,
    FnMapServerStatusToKeyValueSections,
} from '../../../allcommon/FnMapServerStatusToKeyValueSections';

const ServerStatus = (serverStatusProps: IServerStatus) => {
    const { uniqueName } = serverStatusProps;
    const [sections, setSections] = useState<IKeyValueSections>();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        let cancelled = false;

        const loadServerStatus = async (): Promise<void> => {
            try {
                const apiResponse = await axiosInterceptorForPostResponse(
                    FnGetExpApiUrlBasedOnEndPoint(EXPAPI.ServerStatus),
                    {}
                );

                if (!apiResponse) {
                    if (!cancelled) {
                        setErrorMessage('No response from server.');
                    }
                    return;
                }

                if (apiResponse.status !== 200) {
                    if (!cancelled) {
                        setErrorMessage(`Server returned status ${apiResponse.status}`);
                    }
                    return;
                }

                const mappedSections = FnMapServerStatusToKeyValueSections(apiResponse.response);
                if (!mappedSections || !Object.keys(mappedSections).length) {
                    if (!cancelled) {
                        setErrorMessage('Server status data not found.');
                    }
                    return;
                }

                if (!cancelled) {
                    setSections(mappedSections);
                    setErrorMessage(undefined);
                }
            } catch (error) {
                console.error('Failed to load server status:', error);
                if (!cancelled) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : 'Failed to load server status.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadServerStatus();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">
                Loading server status...
            </div>
        );
    }

    if (!sections) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">
                {errorMessage ?? 'Server status not found'}
            </div>
        );
    }

    return (
        <div
            key={uniqueName}
            className="nz-wh-100 nz-d-flex nz-overflow-hidden"
        >
            <KeyValueForm
                title={DEFAULT_SERVER_STATUS_SECTION}
                sections={sections}
                DisableForm={true}
            />
        </div>
    );
};

export { ServerStatus };

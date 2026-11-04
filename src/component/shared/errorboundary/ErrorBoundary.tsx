import { Component, ReactNode, ErrorInfo, useContext } from 'react';
import { SessionContext } from '../context/contextandprovider/Session';
import { StatusBarContext } from '../context/contextandprovider/StatusBar';
import { MainAppContext } from '../context/contextandprovider/MainApp';
import { FnCreateForensiclog } from '../../appcontainer/allcommon/FnCreateForensiclog';
import { IFnCreateForensiclog } from '../../appcontainer/allinterface/IFnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { ISessionContextProps } from '../context/allinterface/ISession';
import { IStatusBar } from '../context/allinterface/IStatusBar';
import { IMainApp } from '../context/allinterface/IMainApp';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    disableForensicLog?: boolean;
    boundaryName?: string;
}

interface InternalErrorBoundaryProps extends ErrorBoundaryProps {
    sessionContext?: ISessionContextProps;
    statusBarContext?: IStatusBar;
    mainAppContext?: IMainApp;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Internal Error Boundary Class Component
 * Catches React component errors and prevents app crashes
 */
class ErrorBoundaryInner extends Component<InternalErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: InternalErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to monitoring service in production
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        if (!this.props.disableForensicLog && this.props.sessionContext && this.props.statusBarContext) {
            try {
                const details = [
                    `[React ErrorBoundary Error]`,
                    this.props.boundaryName ? `Boundary: ${this.props.boundaryName}` : undefined,
                    typeof window !== 'undefined' && window.location ? `URL: ${window.location.href}` : undefined,
                    `Time: ${new Date().toISOString()}`,
                    `Error Name: ${error?.name || 'Error'}`,
                    `Error Message: ${error?.message || 'No error message provided'}`,
                    (error as any)?.cause ? `Error Cause: ${JSON.stringify((error as any).cause)}` : undefined,
                    error?.stack ? `Stack Trace:\n${error.stack}` : undefined,
                    errorInfo?.componentStack ? `Component Stack:\n${errorInfo.componentStack}` : undefined
                ].filter(Boolean).join('\n\n');

                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Error,
                    SubGroupName: LogSubGroupName.Error,
                    LogName: LogName.FetchError,
                    LogString: details,
                    sessionContext: this.props.sessionContext,
                    statusBarContext: this.props.statusBarContext,
                    RefTableItems: this.props.mainAppContext?.refTableRecords || [],
                    allowShowLoader: false
                };

                const logPromise = FnCreateForensiclog(payload);
                if (logPromise && typeof (logPromise as any).catch === 'function') {
                    (logPromise as Promise<any>).catch((err) => {
                        console.error('Failed to log ErrorBoundary error to ForensicLog:', err);
                    });
                }
            } catch (logErr) {
                console.error('Failed to dispatch ForensicLog for ErrorBoundary:', logErr);
            }
        }
    }

    override render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    padding: '20px',
                    margin: '20px',
                    border: '1px solid #ff6b6b',
                    borderRadius: '8px',
                    backgroundColor: '#ffe0e0'
                }}>
                    <h2 style={{ color: '#c92a2a', marginBottom: '10px' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#5c5c5c', marginBottom: '10px' }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#228be6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Error Boundary Component
 * Wraps ErrorBoundaryInner to safely supply session, status bar, and app context for forensic logging
 */
const ErrorBoundary = (props: ErrorBoundaryProps) => {
    const sessionContext = useContext(SessionContext);
    const statusBarContext = useContext(StatusBarContext);
    const mainAppContext = useContext(MainAppContext);

    return (
        <ErrorBoundaryInner
            {...props}
            sessionContext={sessionContext}
            statusBarContext={statusBarContext}
            mainAppContext={mainAppContext}
        />
    );
};

export default ErrorBoundary;
export { ErrorBoundary };
export type { ErrorBoundaryProps };

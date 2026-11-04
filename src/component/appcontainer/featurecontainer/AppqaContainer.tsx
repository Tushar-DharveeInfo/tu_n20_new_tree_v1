
import { lazy, Suspense } from 'react'
import { AppqaSettingsProvider } from '../../shared/context/contextandprovider/AppqaSettingsVar.tsx';
import { InMemoryUrlProvider } from '../../shared/context/contextandprovider/InMemoryUrl.tsx';
import ErrorBoundary from '../../shared/errorboundary/ErrorBoundary.tsx';
import { AppQA } from '../../constants/Feature.ts';
import { Loader } from '../../shared/loader/Loader.tsx';
import { IAppqaContainer } from '../allinterface/IAppqaContainer.ts';
import AppqaHelp from '../../shared/Help.tsx';
import AppqaSettings from '../../appqa/appqasettings/AppqaSettings.tsx';

const AppqaReminder = lazy(() => import('../../appqa/AppqaReminder.tsx'));
const AppqaReport = lazy(() => import('../../appqa/AppqaReport.tsx'));
const AppqaDelegate = lazy(() => import('../../appqa/appqadelegate/AppqaDelegate.tsx'));
const AppqaTask = lazy(() => import('../../appqa/appqatask/AppqaTask.tsx'))
const AppqaNotify = lazy(() => import('../../appqa/AppqaNotify.tsx'))
const AppqaAlerts = lazy(() => import('../../appqa/appqaalerts/AppqaAlerts.tsx'))
const AppqaLog = lazy(() => import('../../appqa/AppqaLog.tsx'))
const AppqaSignout = lazy(() => import('../../appqa/AppqaSignout.tsx'))
const AppqaLaunch = lazy(() => import('../../appqa/AppqaLaunch.tsx'))
const AppqaEntities = lazy(() => import('../../appqa/appqaentities/AppqaEntities.tsx'));

function AppQaContainer(appQaContainerProps: IAppqaContainer) {
    const {
        allowAppQaToRender,
        featureContainerProps,
        featureRecords,
        selectedFeatureNameForHelp,
        handleSelectedMenuItem,
        handleShowUserMessage
    } = appQaContainerProps;

    if (!allowAppQaToRender || !featureContainerProps.appqaId) {
        return null;
    }

    switch (featureContainerProps.appqaId) {
        case AppQA.Reminder:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaReminder
                            uniqueName={'app-qa-reminder'}
                            allowShowHeader={false}
                            headerText={""}
                            featureData={featureRecords}
                            featureId={featureContainerProps.appqaId}
                            selectedAppQAData={featureContainerProps.selectedFeatureData}
                            updateStatusBarData={featureContainerProps.updateStatusBarData}
                            handleShowUserMessage={handleShowUserMessage}
                        />
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Report:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <InMemoryUrlProvider>
                            <AppqaReport
                                uniqueName={'app-qa-report'}
                                featureId={featureContainerProps.appqaId}
                                handleShowUserMessage={handleShowUserMessage}
                            />
                        </InMemoryUrlProvider>
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Launch:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaLaunch />
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Signout:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaSignout uniqueName={'app-qa-signout'} />
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Task:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaTask
                            uniqueName={'app-qa-task'}
                            allowShowHeader={false}
                            headerText={""}
                            featureData={featureRecords}
                            featureId={featureContainerProps.appqaId}
                            selectedAppQAData={featureContainerProps.selectedFeatureData}
                            updateStatusBarData={featureContainerProps.updateStatusBarData}
                        />
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Delegate:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaDelegate
                            uniqueName={'app-qa-delegate'}
                            featureId={featureContainerProps.appqaId}
                            handleShowUserMessage={handleShowUserMessage}
                        />
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Help:
            return (
                <ErrorBoundary>
                    <AppqaHelp
                        uniqueName={'app-qa-user'}
                        headerText={featureContainerProps.headerText}
                        featureId={featureContainerProps.appqaId}
                        featureName={selectedFeatureNameForHelp ?? "Help"}
                        handleShowUserMessage={handleShowUserMessage}
                    />
                </ErrorBoundary>
            );

        case AppQA.Message:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaNotify
                            uniqueName={"app-qa-message"}
                            headerText='Notify'
                            handleShowUserMessage={handleShowUserMessage}
                        />
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Settings:
            return featureContainerProps.selectedFeatureData ? (
                <ErrorBoundary>
                    <AppqaSettingsProvider>
                        <AppqaSettings
                            uniqueName={'setting-menu'}
                            featureId={featureContainerProps.appqaId}
                            allowShowHeader={true}
                            headerText={"Settings"}
                            selectedAppQAData={featureContainerProps.selectedFeatureData}
                            handleSelectedMenuItem={handleSelectedMenuItem}
                            handleShowUserMessage={handleShowUserMessage}
                        />
                    </AppqaSettingsProvider>
                </ErrorBoundary>
            ) : null;

        case AppQA.Entities:
            return featureContainerProps.selectedFeatureData ? (
                <ErrorBoundary>
                    <AppqaSettingsProvider>
                        <Suspense fallback={<Loader />}>
                            <AppqaEntities
                                uniqueName={'appqa-entities'}
                                featureId={featureContainerProps.appqaId}
                                allowShowHeader={true}
                                headerText={"Entities"}
                                selectedAppQAData={featureContainerProps.selectedFeatureData}
                                handleSelectedMenuItem={handleSelectedMenuItem}
                                handleShowUserMessage={handleShowUserMessage}
                            />
                        </Suspense>
                    </AppqaSettingsProvider>
                </ErrorBoundary>
            ) : null;

        case AppQA.Alerts:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaAlerts
                            uniqueName={`${featureContainerProps.uniqueName}-alert-log`}
                            headerText={featureContainerProps.headerText}
                            handleShowUserMessage={handleShowUserMessage}
                        />
                    </Suspense>
                </ErrorBoundary>
            );

        case AppQA.Log:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaLog
                            uniqueName={`${featureContainerProps.uniqueName}-alert-log`}
                            headerText={featureContainerProps.headerText ?? "Log"}
                            featureId={featureContainerProps.featureId}
                        />
                    </Suspense>
                </ErrorBoundary>
            );

        default:
            return null;
    }
}

export { AppQaContainer }

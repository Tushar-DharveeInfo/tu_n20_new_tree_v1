/*
  This is the main entry point of the application. It manages the overall flow of the authentication and authorization process, as well as the loading of the main application component (NzApp). The application flow is divided into three main stages:

  1. Authentication: The user is authenticated using the Authentication component. Upon successful authentication, the user's session data is stored and the application moves to the next stage. 

  Note: 
  eqid, isnew,id are the params that are handled  here

  If the URL contains the query parameter "isnew", the application will skip the authentication stage and move directly to the authorization stage. This is useful for testing purposes.

  2. Authorization: The Authorization component verifies the user's permissions and retrieves session variables. If authorization is successful, the application proceeds to load the main application component (NzApp). If there is an error during authorization, an error message is displayed. 

  3. Main Application: Once authentication and authorization are successfully completed, the main application component (NzApp) is loaded and rendered.
*/

import './App.css'
import { AuthSession } from '@n20a/libauth';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { IAuthorizeResult, Stage } from './stages/IAuthorization';
import { SplashLoader } from './stages/SplashLoader';
import { ISession } from './component/shared/context/allinterface/ISession';
import { IDeploymentVar } from './component/allinterface/INzApp';
import { Authentication } from './stages/Authentication';
import { Authorization } from './stages/Authorization';
import ErrorBoundary from './component/shared/errorboundary/ErrorBoundary';
import { IUserData } from './component/shared/context/allinterface/IMainApp';
import { FnSignOut } from './component/shared/allcommon/basic/FnSignOut';

const NzApp = lazy(() => import('./component/NzApp'));

function App() {
  const isMountedRef = useRef(true);
  const [isNewParam] = useState(() => new URLSearchParams(window.location.search).get("isnew"));

  const [currentStage, setCurrentStage] = useState<Stage>(1);
  const [userData, setUserData] = useState<IUserData>();
  const [userSessionId, setUserSessionId] = useState<string>();
  const [sessionVariables, setSessionVariables] = useState<ISession[]>();
  const [isNewSession, setIsNewSession] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loginUserName, setLoginUserName] = useState<string>();
  const [isAppLoaded, setIsAppLoaded] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>();
  const [apiBaseUrl, setApiBaseUrl] = useState<string>()
  const [deploymentEnv, setDeploymentEnv] = useState<IDeploymentVar[]>()

  const callEnvToGetData = async () => {
    try {
      if (!window.APP_CONFIG?.DEPLOYMENT_N20_API_URL) {
        await FnSignOut({ closeSession: false });
        setAuthError("Deployment API URL is missing.");
        return;
      }

      setApiBaseUrl(window.APP_CONFIG.DEPLOYMENT_N20_API_URL as string);
      setDeploymentEnv([window.APP_CONFIG] as IDeploymentVar[]);
    } catch (error) {
      console.error("Authentication environment fetch failed:", error);
      await FnSignOut({ closeSession: false });
      setAuthError("Failed to load environment configuration.");
    }
  }

  //Global BroadcastChannel listener to handle signout across all tabs
  useEffect(() => {
    const channel = new BroadcastChannel('nz-tab-control');

    channel.onmessage = (event) => {
      if (event.data?.action === 'signout-all-tabs' && document.title.startsWith('NZ-')) {
        // Clear session storage
        window.sessionStorage.removeItem('session_variables');

        // Try to close the tab
        window.close();

        // Fallback: if tab doesn't close after 1 second (shouldn't happen for window.open tabs)
        // navigate to about:blank so user knows this tab needs manual closure
        setTimeout(() => {
          if (!window.closed) {
            window.location.replace('about:blank');
          }
        }, 1000);
      }
    };
    return () => {
      isMountedRef.current = false;
      channel.close();
    };
  }, []);

  useEffect(() => {
    if (isNewParam) {
      callEnvToGetData();
    }
  }, [isNewParam])

  const handleAuthenticationSuccess = async (user: AuthSession) => {
    console.time('createandinitsession_nk');
    await callEnvToGetData();
    //isMountedRef pattern prevents memory leaks, if the component unmounts during the async callEnvToGetData() operation
    if (!isMountedRef.current) return;

    let bid = user.email?.split('@')[1]?.trim().toLowerCase().split('.')[0] ?? "";

    let cid = user.email ?? user.id;
    const bidCid = {
      bid: "bid_108",
      cid: "cid_bid_108_1"
    };
    bid = bidCid?.bid;
    cid = bidCid?.cid;
    setUserData({ ...user, bid, cid } as IUserData);
    setCurrentStage(2);
  };

  const handleAuthorizationSuccess = (authData: IAuthorizeResult) => {
    setUserSessionId(authData.sessionId);
    if (authData.sessionVariables.length) {
      const userNameData = authData.sessionVariables.find((item) => item.VariableName === "LoginShortName");
      if (userNameData?.SessionValue) {
        setLoginUserName(userNameData.SessionValue);
      }
    }
    setSessionVariables(authData.sessionVariables);
    setIsNewSession(authData.isNewSession)
    setCurrentStage(3);
  }

  const handleAuthorizationError = (error: string) => {
    setAuthError(error);
  }

  const handleNzAppError = (error: string) => {
    setErrorMessage(error);
    setAuthError(error);
  }

  const handleNzAppSuccess = () => {
    setIsAppLoaded(true);
  }

  return (
    <div className="app-container">
      <ErrorBoundary disableForensicLog={true}>
        <Suspense fallback={<SplashLoader uniqueName="suspense-fallback" allowSplashScreen={false} message={null} currentStage={currentStage} loadingMessage="" />}>
          {currentStage === 1 && (<Authentication uniqueName={'user-authentication'}
            onSuccess={handleAuthenticationSuccess} />)}
          {currentStage === 2 && apiBaseUrl && (<Authorization uniqueName={'user-authorization'}
            userData={userData}
            apiBaseUrl={apiBaseUrl}
            onSuccess={handleAuthorizationSuccess}
            onError={handleAuthorizationError} />)}
          {currentStage === 3 && deploymentEnv && apiBaseUrl && userSessionId && sessionVariables && (<NzApp
            uniqueName={'nz-app'} sessionId={userSessionId} sessionVariables={sessionVariables}
            isNewSession={isNewSession}
            deploymentVars={deploymentEnv}
            apiBaseUrl={apiBaseUrl}
            userAuthSession={userData}
            onError={handleNzAppError} onSuccess={handleNzAppSuccess} />)}
        </Suspense>
      </ErrorBoundary>
      {!isAppLoaded && !authError && <SplashLoader
        uniqueName="user-auth-splash"
        allowSplashScreen={isNewParam ? false : true}
        message={errorMessage ?? null}
        currentStage={currentStage}
        loadingMessage={loginUserName ? `${loginUserName}` : ""}
      />
      }
      {authError && (
        <div className="nz-auth-error-overlay">
          <div className="nz-auth-error-box">

            {/* Header */}
            <div className="nz-auth-error-header">
              <span className="nz-auth-error-icon">!</span>
              <span className="nz-auth-error-title">Authorization Failed</span>
            </div>

            {/* Body */}
            <div className="nz-auth-error-body">
              {authError}
            </div>

            {/* Footer */}
            <div className="nz-auth-error-footer">
              <button
                className="nz-btn nz-btn-primary"
                onClick={async () => {
                  await FnSignOut({ sessionId: userSessionId, apiBaseUrl, closeSession: true });
                  window.location.replace("about:blank");
                }}
              >
                OK
              </button>
            </div>

          </div>
        </div>

      )}

    </div>
  )
}

export { App }

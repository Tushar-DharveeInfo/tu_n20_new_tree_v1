
import { useCallback, useEffect, useState } from 'react';
import { getRuntimeConfig } from "@n20a/libauth";
import { axiosInterceptor } from '../shared/interceptors/Interceptor.ts';
import { SESSION } from '../shared/interceptors/EndPoints.ts';
import { YesNoFormContainer } from '../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx';
import { FnHandleAPIResponse } from '../shared/allcommon/basic/FnHandleAPIResponse.ts';
import { FnGetSessionVariableFromStorage } from '../shared/allcommon/basic/FnGetSessionVariableFromStorage.ts';
import { FnSignOut } from '../shared/allcommon/basic/FnSignOut';
import { useSessionContext } from '../shared/context/hooks/SessionHooks.ts';
import { useStatusBarContext } from '../shared/context/hooks/StatusBarHooks.ts';
import { useMainAppContext } from '../shared/context/hooks/MainAppHooks.ts';
import { IAppqaSignout } from './allinterface/IAppqaSignout.ts';
import { IFnCreateForensiclog } from '../appcontainer/allinterface/IFnCreateForensiclog.ts';
import { LogGroupName, LogName, LogSubGroupName } from '../appcontainer/alldefaultprops/DefaultPropsForensiclog.ts';
import { FnCreateForensiclog } from '../appcontainer/allcommon/FnCreateForensiclog.ts';

const cleanUser = (name?: string | null): string => {
  if (!name) return '';
  return name.replace(/^.*\\/, '').trim().toLowerCase();
};

function AppqaSignout(appqasignoutprops: IAppqaSignout) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openSessions, setOpenSessions] = useState<Record<string, any>[]>();
  const sessionContext = useSessionContext();
  const statusBarContext = useStatusBarContext();
  const mainAppContext = useMainAppContext();
  const { AUTH_TYPE } = getRuntimeConfig();

  useEffect(() => {
    axiosInterceptor(
      {
        url: SESSION.GetOpenSession,
        data: {
          excludeCurrentSessionID: false
        },
        allowShowLoader: true,
        setFetchData: (handleOpenSessionResp: unknown, status?: string) => {
          if (
            status === "200" &&
            handleOpenSessionResp &&
            typeof handleOpenSessionResp === "object" &&
            'jsonSessionOutput' in handleOpenSessionResp
          ) {
            try {
              const parsedSession = FnHandleAPIResponse(
                handleOpenSessionResp.jsonSessionOutput,
                "UserSessions"
              );

              const closeAndSignOut = () => {
                axiosInterceptor(
                  {
                    url: SESSION.CloseSession,
                    data: {
                      forceClose: true
                    },
                    allowShowLoader: true,
                    setFetchData: async (
                      handleCloseSessionResp: unknown,
                      status?: string
                    ) => {
                      if (
                        status === "200" &&
                        handleCloseSessionResp !== undefined
                      ) {
                        await FnSignOut({ closeSession: false });
                        window.close();
                      }
                    }
                  },
                  statusBarContext
                );
              };

              const loginShortName = (
                sessionContext.SessionList?.find((item) => item.VariableName?.toLowerCase() === "loginshortname")?.SessionValue ||
                FnGetSessionVariableFromStorage("RequestedBy", "LoginShortName", sessionContext.SessionList)?.[0]?.SessionValue ||
                ""
              ).trim();

              const loginUserName = (
                sessionContext.SessionList?.find((item) => item.VariableName?.toLowerCase() === "loginusername")?.SessionValue ||
                FnGetSessionVariableFromStorage("RequestedBy", "LoginUserName", sessionContext.SessionList)?.[0]?.SessionValue ||
                ""
              ).trim();

              const authUsername = (mainAppContext?.userAuthSession?.username || "").trim();
              const authDisplayName = (mainAppContext?.userAuthSession?.displayName || "").trim();

              const isMatchingUser = (sessionItem: Record<string, any>): boolean => {
                const sessionUserName = (sessionItem?.UserName || "").toString().trim();
                const sessionShortName = (sessionItem?.ShortName || "").toString().trim();

                const cleanSessionUser = cleanUser(sessionUserName);
                const cleanSessionShort = cleanUser(sessionShortName);

                const cleanLoginUser = cleanUser(loginUserName);
                const cleanLoginShort = cleanUser(loginShortName);
                const cleanAuthUser = cleanUser(authUsername);
                const cleanAuthDisplay = cleanUser(authDisplayName);

                if (cleanLoginShort) {
                  if (cleanSessionShort === cleanLoginShort || cleanSessionUser === cleanLoginShort) {
                    return true;
                  }
                }

                if (cleanLoginUser) {
                  if (cleanSessionUser === cleanLoginUser || cleanSessionShort === cleanLoginUser) {
                    return true;
                  }
                }

                if (cleanAuthUser) {
                  if (cleanSessionUser === cleanAuthUser || cleanSessionShort === cleanAuthUser) {
                    return true;
                  }
                }

                if (cleanAuthDisplay) {
                  if (cleanSessionUser === cleanAuthDisplay || cleanSessionShort === cleanAuthDisplay) {
                    return true;
                  }
                }

                if (loginShortName && (sessionShortName.toLowerCase() === loginShortName.toLowerCase() || sessionUserName.toLowerCase() === loginShortName.toLowerCase())) {
                  return true;
                }

                if (loginUserName && (sessionUserName.toLowerCase() === loginUserName.toLowerCase() || sessionShortName.toLowerCase() === loginUserName.toLowerCase())) {
                  return true;
                }

                return false;
              };

              if (
                parsedSession &&
                Array.isArray(parsedSession) &&
                parsedSession.length > 0
              ) {
                const userSessions = parsedSession.filter((session: Record<string, any>) => isMatchingUser(session));
                if (userSessions.length > 0) {
                  setOpenSessions(userSessions);
                  setIsOpen(true);
                } else {
                  closeAndSignOut();
                }
              }
              else {
                closeAndSignOut();
              }
            } catch (error) {
              console.error(error);
              appqasignoutprops.handleCloseFailed?.(
                error instanceof Error
                  ? error
                  : new Error("Failed to load open sessions")
              );
            }
          }
        }
      },
      statusBarContext
    );
  }, []);

  const closeSession = (
    sessionId: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      axiosInterceptor(
        {
          url: SESSION.CloseSession,
          data: {
            sessionId,
            forceClose: true
          },
          allowShowLoader: true,
          setFetchData: (_resp: unknown, status?: string) => {
            if (status === "200") {
              resolve();
            }
            else {
              reject(status);
            }
          }
        },
        statusBarContext
      );
    });
  };

  const handleYesButtonClick = useCallback(async () => {
    if (!openSessions?.length) {
      return;
    }
    try {
      const payload: IFnCreateForensiclog = {
        logType: 'UserAction',
        GroupName: LogGroupName.ForensicLogTemplate,
        _Forensiclog: LogSubGroupName.Auth,
        SubGroupName: LogSubGroupName.Auth,
        LogName: LogName.SignOut,
        sessionContext: sessionContext,
        statusBarContext: statusBarContext,
        RefTableItems: mainAppContext.refTableRecords
      };
      await FnCreateForensiclog(payload);
      const promises: Promise<void>[] = [];
      for (const session of openSessions) {
        if (session.UserSessionID) {
          promises.push(
            closeSession(session.UserSessionID)
          );
        }
      }

      // Use allSettled to ensure all sessions are attempted even if any one fails
      const results = await Promise.allSettled(promises);

      // Check for any failures and log them
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`Failed to close ${failures.length} of ${results.length} sessions:`, failures);
      }

      // Sign out all browser tabs whose label begins with "NZ-"
      try {
        if (import.meta.env.DEV)
          console.log('Broadcasting signout command to all NZ- tabs');
        const channel = new BroadcastChannel('nz-tab-control');

        // Send the message multiple times with longer intervals to ensure delivery
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            channel.postMessage({ action: 'signout-all-tabs' });
            if (import.meta.env.DEV)
              console.log(`Broadcast sent (attempt ${i + 1})`);
          }, i * 50);
        }

        // Close channel after all messages have been sent
        setTimeout(() => {
          channel.close();
          if (import.meta.env.DEV)
            console.log('Broadcast channel closed');
        }, 600);
      } catch (error) {
        console.warn('Failed to broadcast signout message:', error);
      }

      // Clear session storage and sign out current tab
      await FnSignOut({ closeSession: false });

      // Close or navigate current tab after giving broadcasts time to reach other tabs
      setTimeout(() => {
        if (document.title.startsWith('NZ-')) {
          if (import.meta.env.DEV)
            console.log('Current tab is NZ- tab, attempting to close');
          window.close();

          // Fallback if this is the last tab and can't be closed
          setTimeout(() => {
            if (!window.closed) {
              if (import.meta.env.DEV)
                console.log('Could not close current tab, navigating to blank page');
              window.location.replace('about:blank');
            }
          }, 500);
        } else {
          if (import.meta.env.DEV)
            console.log('Current tab is not NZ- tab, navigating to home');
          window.location.replace('/');
        }
      }, 700);
    } catch (error) {
      console.error(error);
      appqasignoutprops.handleCloseFailed?.(
        error instanceof Error
          ? error
          : new Error("Failed to close sessions")
      );
    }
  }, [
    openSessions,
    sessionContext,
    statusBarContext,
    mainAppContext.refTableRecords
  ]);

  const handleNoButtonClick = useCallback(() => {
    setIsOpen(false);
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.replace("/");
    }
    appqasignoutprops.handleCloseFailed?.(new Error("User cancelled session close"));
  }, [appqasignoutprops]);

  return (
    <>
      {
        isOpen &&
        <YesNoFormContainer
          uniqueName={`${appqasignoutprops.uniqueName}-close-popup`}
          message={
            "Are you sure you want to close all open sessions? \n\n If you select 'Yes', all open Sessions will be closed and all browser tabs will be closed."
          }
          isOpen={isOpen}
          handleYesButtonClick={handleYesButtonClick}
          handleNoButtonClick={handleNoButtonClick}
          dialogTitle="Close Sessions"
        />
      }
    </>
  );
}
export default AppqaSignout;

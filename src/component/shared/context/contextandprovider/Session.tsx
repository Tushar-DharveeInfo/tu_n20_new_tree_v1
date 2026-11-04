
import { useState, createContext, useMemo, useCallback } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { ISession, ISessionContextProps } from "../allinterface/ISession";

const SessionContext = createContext<ISessionContextProps | undefined>(undefined);

function SessionProvider({ children }: IAppContextWrapper) {
  const [sessionList, setSessionList] = useState<ISession[]>([]);

  const UpdateRowName = useCallback((row: ISession) => {
    try {
      setSessionList((prevList) =>
        prevList.map((thisRow) => {
          if (
            thisRow.VariableName === row.VariableName &&
            thisRow.VariableContext === row.VariableContext
          ) {
            return { ...thisRow, SessionValue: row.SessionValue };
          }
          return thisRow;
        })
      );
    } catch (error) {
      console.error("Error updating session row:", error);
    }
  }, []);

  const FnAvailableSessionVariables = useCallback(() => {
    return sessionList;
  }, [sessionList]);

  const FnGetLocationData = useCallback((isInventory: boolean) => {
    try {
      const context = isInventory ? "inventory" : "location";
      return sessionList
        .filter(
          (item) =>
            item.VariableContext?.toLowerCase() === context &&
            item.VariableName?.toLowerCase().endsWith("name")
        )
        .reduce((acc, item) => {
          if (item.VariableName) {
            acc[item.VariableName] = item.SessionValue;
          }
          return acc;
        }, {} as Record<string, any>);
    } catch (error) {
      console.error("Error getting location data:", error);
      return {} as Record<string, any>;
    }
  }, [sessionList]);

  const contextValue = useMemo(() => ({
    SessionList: sessionList,
    UpdateRowName,
    setSessionList,
    FnAvailableSessionVariables,
    FnGetLocationData
  }), [sessionList, UpdateRowName, FnAvailableSessionVariables, FnGetLocationData]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export { SessionProvider, SessionContext };

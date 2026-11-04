import { ISession } from "../../context/allinterface/ISession"

// check current user permission
const FnCheckUserPermission = (sessionData: ISession[]) => {
  if (sessionData) {
    let returnVal: string | null = ""
    const ImpersonatedUserIDVal = sessionData.find((ele) => {
      return ele.VariableName === "ImpersonatedUserID"
    })
    if (ImpersonatedUserIDVal?.SessionValue === "") {
      const LoginUserRW = sessionData.find((ele) => {
        return ele.VariableName === "LoginUserRW"
      })
      returnVal = LoginUserRW?.SessionValue ?? null
    } else {
      const ImpersonatedUserRW = sessionData.find((ele) => {
        return ele.VariableName === "ImpersonatedUserRW"
      })
      returnVal = ImpersonatedUserRW?.SessionValue ?? null
    }
    return returnVal
  }
}
export { FnCheckUserPermission }
import { useEffect, useRef, useState } from "react";
import { axiosInterceptor } from "../../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../../shared/interceptors/EndPoints";
import { useStatusBarContext } from "../../../../../../../shared/context/hooks/StatusBarHooks";
import { FnHandleAPIResponse } from "../../../../../../../shared/allcommon/basic/FnHandleAPIResponse";
import "../../../../../../allcss/appqaentitiescontainer/user/Team.css";
import { IFnCreateForensiclog } from "../../../../../../../appcontainer/allinterface/IFnCreateForensiclog";
import { LogGroupName, LogName, LogSubGroupName } from "../../../../../../../appcontainer/alldefaultprops/DefaultPropsForensiclog";
import { useMainAppContext } from "../../../../../../../shared/context/hooks/MainAppHooks";
import { useSessionContext } from "../../../../../../../shared/context/hooks/SessionHooks";
import { FnCreateForensiclog } from "../../../../../../../appcontainer/allcommon/FnCreateForensiclog";
import { Team24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { CardLayout } from "../../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { ITeamProps, ITeamRecord } from "../../../../../../allinterface/iappqaentitiescontainer/user/ITeam";
import { sortAuthorizeUserCards } from "../../../../../../allcommon/FnSortAuthorizeUserCards";
import { FnGetDisplayValue } from "../../../../../../allcommon/FnGetAddressDisplay";

const TEAM_CARD_NAME_KEYS = ["_Partner", "_Team", "Team", "Name"];



const isSelected = (value: unknown): boolean => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
    }

    return value === 1;
}

/** Builds CardLayout name/value rows from a team record. */
const buildTeamCardFields = (
    teamName: string,
    description: string,
    purpose: string
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "Team",
            Value: purpose ? `${teamName} (${purpose})` : teamName || "—",
            Header: 1,
        },
    ];

    if (description) {
        fields.push({ Name: "Description", Value: description });
    }

    return fields;
};

const Team = (teamProps: ITeamProps) => {
    const uniqueName = teamProps.uniqueName ?? "team-card";
    const [teams, setTeams] = useState<ITeamRecord[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(false);
    const [loadedUserId, setLoadedUserId] = useState<string>();
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const selectedUserId = teamProps.selectedUser?.EntID;

    useEffect(() => {
        if (!selectedUserId) {
            setTeams([]);
            setLoadedUserId(undefined);
            return;
        }

        const handleGetTeamsByUserResponse = (response: unknown, status?: string) => {
            setIsLoadingTeams(false);
            setLoadedUserId(selectedUserId);

            const data = FnHandleAPIResponse(response, "Dataset");
            if (status === "200" && Array.isArray(data)) {
                setTeams(sortAuthorizeUserCards(data, TEAM_CARD_NAME_KEYS));
                return;
            }

            setTeams([]);
        }

        setIsLoadingTeams(true);
        axiosInterceptor({
            url: AUTH.GetTeamsByUser,
            data: {
                userId: selectedUserId
            },
            allowShowLoader: true,
            setFetchData: handleGetTeamsByUserResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingTeams(false);
            setLoadedUserId(selectedUserId);
            setTeams([]);
        });
    }, [selectedUserId]);

    const isWaitingForSelectedUser = Boolean(selectedUserId) && loadedUserId !== selectedUserId;
    const shouldShowLoading = isLoadingTeams || isWaitingForSelectedUser;
    const shouldShowNoData = !shouldShowLoading && loadedUserId === selectedUserId && teams.length === 0;

    const handleOnChangeYesNo = async (value: boolean, team: ITeamRecord) => {
        if (!teamProps.selectedUser) return
        let ownerEntityJson = [{
            EntID: teamProps.selectedUser.EntID,
            OwnerEntity: teamProps.selectedUser.LoginUser,
            Selected: true
        }]
        let authEntityJson = []
        const authEntityNames: string[] = []
        for (let index = 0; index < teams.length; index++) {
            const element = teams[index];
            if (element.EntID === team.EntID) {
                element.Selected = value
                element.selected = value
                authEntityNames.push(element._Team ?? "")
            }
            if (element.Selected || element.selected) {
                authEntityNames.push(element._Team ?? "")
            }
            element.AuthEntity = element._Partner
            authEntityJson.push(element)
        }

        let userNameArr: string[] = []

        const apiPayload = {
            ownerEntityName: "User",
            authEntityName: "Partner",
            ownerEntityJson: JSON.stringify(ownerEntityJson),
            authEntityJson: JSON.stringify(authEntityJson)
        }

        axiosInterceptor({
            url: AUTH.AddAuthByEntity,
            data: apiPayload,
            allowShowLoader: true,
            setFetchData: (handleResp: unknown, status?: string) => {
                if (status !== "200" || handleResp === undefined) return

                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Auth,
                    SubGroupName: LogSubGroupName.Auth,
                    LogName: LogName.AssignEntity,
                    actionObject: {
                        entityType: "Team",
                        entityList: authEntityNames.join(", "),
                        userList: userNameArr.join(", ")
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)

            }
        }, statusBarContext)
    }

    return (
        <div className="nz-team-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-team-card-status-message">Loading...</div>
            ) : teams.length ? teams.map((team: ITeamRecord, index: number) => {
                const teamName = FnGetDisplayValue(team, ["_Partner"]);
                const Purpose = FnGetDisplayValue(team, ["Purpose"]);
                const description = FnGetDisplayValue(team, ["Desc250", "Description"]);
                const cardFields = buildTeamCardFields(teamName, description, Purpose);

                return (
                    <CardLayout
                        key={`${uniqueName}-${team.EntID ?? team.RecID ?? teamName}-${index}`}
                        uniqueName={`${uniqueName}-${index}`}
                        className="nz-team-card-item"
                        data={team}
                        fields={cardFields}
                        showCheckboxInHeader
                        checkboxName={`${uniqueName}-selected-${index}`}
                        checkboxValue={isSelected(team.Selected ?? team.selected)}
                        onCheckboxChange={(value) => handleOnChangeYesNo(value, team)}
                        hideRightMouseMenu={true}
                        ContentImage={{
                            uniqueName: `${uniqueName}-user-image-${index}`,
                            source: <Team24x24
                                size={FnGetCssVariable("--image-size-2")}
                                fill="none"
                                strokeWidth={1} />,
                            w: "var(--image-size-2)",
                            tooltip: "User",
                            type: "svg",
                        }}
                    />
                )
            }) : shouldShowNoData ? (
                <div className="nz-team-card-status-message">No Data Found</div>
            ) : null}
        </div>
    )
}

export { Team };

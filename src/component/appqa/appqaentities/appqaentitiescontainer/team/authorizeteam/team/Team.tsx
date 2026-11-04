import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";
import "../../../../../allcss/appqaentitiescontainer/team/Team.css";
import { useStatusBarContext } from "../../../../../../shared/context/hooks/StatusBarHooks";
import { useSessionContext } from "../../../../../../shared/context/hooks/SessionHooks";
import { FnHandleAPIResponse } from "../../../../../../shared/allcommon/basic/FnHandleAPIResponse";
import { axiosInterceptor } from "../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../shared/interceptors/EndPoints";
import { CardLayout } from "../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { Team24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { ITeamProps, ITeamRecord } from "../../../../../allinterface/iappqaentitiescontainer/team/ITeam";
import { sortAuthorizeUserCards } from "../../../../../allcommon/FnSortAuthorizeUserCards";
import { FnIsTruthyFlag } from "../../../../../../shared/allcommon/basic/FnIsTruthyFlag";
import { FnGetAddressDisplay, FnGetDisplayValue } from "../../../../../allcommon/FnGetAddressDisplay";

const TEAM_CARD_NAME_KEYS = ["Name"];


/** Builds CardLayout name/value rows from an authorize team record. */
const buildAuthorizeTeamCardFields = (
    teamName: string,
    description: string,
    contactName: string,
    email: string,
    emailOptin: string,
    phone: string,
    address: string,
    phonetype: string,
    purpose: string
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "Team",
            Value: description.length ? `${teamName} (${description})` : teamName || "—",
            Header: 1,
        },
    ];


    if (email) {
        fields.push({
            Name: "Email",
            Value: email,
            Group: "email-row",
            Row: "inline",
        });
        fields.push({
            Name: "OptIn",
            Value: FnIsTruthyFlag(emailOptin) ? "✓" : "X",
            Group: "email-row",
            Row: "inline",
        });
    }
    if (contactName) {
        fields.push({
            Name: "Contact",
            Value: contactName,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (phone) {
        fields.push({
            Name: "Phone",
            Value: `${phone} (${phonetype})`,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (address) {
        fields.push({ Name: "Address", Value: address.trim() });
    }

    return fields;
};

const Team = (teamProps: ITeamProps) => {
    const uniqueName = teamProps.uniqueName ?? "team-card";
    const [teams, setTeams] = useState<ITeamRecord[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(false);
    const [hasRequestedTeams, setHasRequestedTeams] = useState<boolean>(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(teamProps.selectedTeamId);
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const sessionContext = useSessionContext();
    const teamPropsRef = useRef(teamProps);
    const hasLoadedTeams = useRef<boolean>(false);
    const sessionId = sessionContext?.SessionList?.find((item: any) => item.VariableName?.toLowerCase() === "sessionid")?.SessionValue;

    useEffect(() => {
        teamPropsRef.current = teamProps;
    }, [teamProps]);

    useEffect(() => {
        setSelectedTeamId(teamProps.selectedTeamId);
    }, [teamProps.selectedTeamId]);

    useEffect(() => {
        if (hasLoadedTeams.current) {
            return;
        }
        hasLoadedTeams.current = true;

        const handleGetTeamsResponse = (response: unknown, status?: string) => {
            setIsLoadingTeams(false);
            if (status === "200" && response && typeof response === "object"
                && 'entitiesJson' in response) {
                const parsedData = FnHandleAPIResponse(response.entitiesJson, "Teams");
                if (parsedData && Array.isArray(parsedData)) {
                    const sortedTeams = sortAuthorizeUserCards(parsedData, TEAM_CARD_NAME_KEYS);
                    setTeams(sortedTeams);
                    if (sortedTeams.length && !teamPropsRef.current.selectedTeamId) {
                        const firstTeam = sortedTeams[0] as ITeamRecord;
                        const firstTeamId = firstTeam.EntID ?? firstTeam.RecID ?? FnGetDisplayValue(firstTeam, ["Name", "_Partner", "_Team"]);
                        setSelectedTeamId(firstTeamId);
                        teamPropsRef.current.handleSelectedCard?.(firstTeam);
                    }
                } else {
                    setTeams([]);
                }
            } else {
                setTeams([]);
            }

        };

        setHasRequestedTeams(true);
        setIsLoadingTeams(true);
        axiosInterceptor({
            url: AUTH.GetEntitiesForFeatureAuth,
            data: {
                entityName: "Team",
                pageType: 1,
                sessionId: sessionId
            },
            allowShowLoader: true,
            setFetchData: handleGetTeamsResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingTeams(false);
            setTeams([]);
        });
    }, [sessionId]);

    const shouldShowLoading = isLoadingTeams;
    const shouldShowNoData = hasRequestedTeams && !isLoadingTeams && teams.length === 0;

    const handleTeamClick = (_event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, data: unknown) => {
        const selectedTeam = data as ITeamRecord;
        const teamId = selectedTeam.EntID ?? selectedTeam.RecID ?? FnGetDisplayValue(selectedTeam, ["Name", "_Partner", "_Team"]);
        setSelectedTeamId(teamId);
        teamProps.handleSelectedCard?.(selectedTeam);
    };

    return (
        <div className="nz-team-card-container" key={uniqueName}>
            {shouldShowLoading ? (
                <div className="nz-team-card-status-message">Loading...</div>
            ) : teams.length ? teams.map((team: ITeamRecord, index: number) => {
                const teamName = FnGetDisplayValue(team, ["Name"]);
                const description = FnGetDisplayValue(team, ["Desc250", "Description"]);
                const contactName = FnGetDisplayValue(team, ["ContactName"]);
                const email = FnGetDisplayValue(team, ["Email", "EmailAddress", "PrimaryEmail"]);
                const emailOptin = FnGetDisplayValue(team, ["EmailOptin"]);
                const address = FnGetAddressDisplay(team);
                const phone = FnGetDisplayValue(team, ["Phone"]);
                const teamId = team.EntID ?? team.RecID ?? FnGetDisplayValue(team, ["Name", "_Partner", "_Team"]);
                const phonetype = FnGetDisplayValue(team, ["PhoneType"]);
                const purpose = FnGetDisplayValue(team, ["Purpose"]);
                const cardFields = buildAuthorizeTeamCardFields(
                    teamName,
                    description,
                    contactName,
                    email,
                    emailOptin,
                    phone,
                    address,
                    phonetype,
                    purpose
                );

                return (
                    <CardLayout
                        key={`${uniqueName}-${team.EntID ?? team.RecID ?? teamName}-${index}`}
                        uniqueName={`${uniqueName}-${index}`}
                        className="nz-team-card-item"
                        data={team}
                        fields={cardFields}
                        isSelected={selectedTeamId === teamId}
                        onClick={handleTeamClick}
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

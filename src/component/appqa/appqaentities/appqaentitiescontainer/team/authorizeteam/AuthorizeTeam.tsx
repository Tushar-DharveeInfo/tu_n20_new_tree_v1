import { useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import "../../../../allcss/appqaentitiescontainer/team/AuthorizeTeam.css";
import { Team } from "./team/Team";
import { IAuthorizeTeam } from "../../../../allinterface/iappqaentitiescontainer/team/IAuthorizeTeam";
import { ITeamRecord } from "../../../../allinterface/iappqaentitiescontainer/team/ITeam";
import { AuthorizeContainer } from "./authorizecontainer/AuthorizeContainer";



const AuthorizeTeam = (AuthorizeTeamProps: IAuthorizeTeam) => {
    const uniqueName = AuthorizeTeamProps.uniqueName ?? "team-authorize";
    const [selectedTeam, setSelectedTeam] = useState<ITeamRecord | null>(null);


    return (
        <div className="nz-team-authorize" key={uniqueName}>
            <div className="nz-team-authorize-container">
                <Splitter tabIndex={-1} className="nz-w-100 nz-h-100">
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">
                        <div className="nz-team-authorize-card-pane">
                            <Team
                                uniqueName={`${uniqueName}-card`}
                                selectedTeamId={selectedTeam?.EntID}
                                handleSelectedCard={(team) => {
                                    setSelectedTeam(team);
                                }}
                            />
                        </div>
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-pane-2">
                        {selectedTeam && (
                            <AuthorizeContainer
                                uniqueName={uniqueName}
                                selectedCard={selectedTeam}
                                ownerEntityName={"Partner"}
                                entityName={"Team"}
                                allowCollapse={true}
                                sectionToHide="entities"
                                featureId={AuthorizeTeamProps.featureId}
                            />
                        )}
                    </SplitterPanel>
                </Splitter>
            </div>
        </div>
    )
}

export default AuthorizeTeam;

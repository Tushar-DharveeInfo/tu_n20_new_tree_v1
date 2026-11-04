import { useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import "../../../../allcss/appqaentitiescontainer/role/AuthorizeRole.css";
import { Role } from "./role/Role";
import { IAuthorizeRole } from "../../../../allinterface/iappqaentitiescontainer/role/IAuthorizeRole";
import { IRoleRecord } from "../../../../allinterface/iappqaentitiescontainer/role/IRole";
import { AuthorizeContainer } from "../../team/authorizeteam/authorizecontainer/AuthorizeContainer";

const AuthorizeRole = (authorizeRoleProps: IAuthorizeRole) => {
    const uniqueName = authorizeRoleProps.uniqueName ?? "role-authorize";
    const [selectedRole, setSelectedRole] = useState<IRoleRecord | null>(null);

    return (
        <div className="nz-role-authorize" key={uniqueName}>
            <div className="nz-role-authorize-container">
                <Splitter tabIndex={-1} className="nz-w-100 nz-h-100">
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">
                        <div className="nz-role-authorize-card-pane">
                            <Role
                                uniqueName={`${uniqueName}-card`}
                                selectedRoleId={selectedRole?.EntID}
                                handleSelectedCard={(role) => {
                                    setSelectedRole(role);
                                }}
                            />
                        </div>
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-pane-2">
                        {selectedRole && (
                            <AuthorizeContainer
                                uniqueName={uniqueName}
                                selectedCard={selectedRole}
                                ownerEntityName={"Role"}
                                entityName={"Role"}
                                allowCollapse={true}
                                featureId={authorizeRoleProps.featureId}
                            />
                        )}
                    </SplitterPanel>
                </Splitter>
            </div>
        </div>
    );
};

export default AuthorizeRole;

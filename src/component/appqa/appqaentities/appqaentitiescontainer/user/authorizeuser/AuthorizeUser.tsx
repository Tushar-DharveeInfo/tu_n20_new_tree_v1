
import { useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import "../../../../allcss/appqaentitiescontainer/user/AuthorizeUser.css";
import { IUserContactEntity } from "../../../../allinterface/iappqaentitiescontainer/user/IUser";
import { User } from "./user/User";
import { IAuthorizeUser } from "../../../../allinterface/iappqaentitiescontainer/user/IAuthorizeUser";
import { AuthorizeUserContainer } from "./userauthorizecontainer/AuthorizeUserContainer";

const AuthorizeUser = (AuthorizeUserProps: IAuthorizeUser) => {
    const uniqueName = AuthorizeUserProps.uniqueName ?? "user-authorize";
    const [selectedUser, setSelectedUser] = useState<IUserContactEntity | null>(null);
    const [Role, setRole] = useState<string | null>(null);
    const [basicRole, SetBasicRole] = useState<string | null>(null);
    const handleRefreshUsers = (role: string, basicRole: string) => {
        setRole(role)
        SetBasicRole(basicRole)
    };


    return (
        <div className="nz-user-authorize" key={uniqueName}>
            <div className="nz-user-authorize-container">
                <Splitter tabIndex={-1} className="nz-w-100 nz-h-100">
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">
                        <div className="nz-user-authorize-card-pane">
                            <User
                                uniqueName={`${uniqueName}-card`}
                                featureId={AuthorizeUserProps.featureId}
                                selectedUserId={selectedUser?.EntID}
                                checkRoleName={Role}
                                checkBasicRole={basicRole}
                                handleSelectedCard={(user) => {
                                    setRole(null)
                                    setSelectedUser(user);
                                }}
                            />
                        </div>
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={20} className="nz-d-flex-column nz-align-center nz-pane-2">
                        {selectedUser && (
                            <AuthorizeUserContainer
                                uniqueName={uniqueName}
                                selectedUser={selectedUser}
                                allowCollapse={true}
                                featureId={AuthorizeUserProps.featureId}
                                handleRefreshUsersData={handleRefreshUsers}
                            />
                        )}
                    </SplitterPanel>
                </Splitter>
            </div>
        </div>
    )
}

export default AuthorizeUser;

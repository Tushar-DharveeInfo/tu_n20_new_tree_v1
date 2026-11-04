
import { useEffect, useState } from "react";
import { IUserProfileContainer } from "../allinterface/IUserProfileContainer";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";
import { EntityNameEnums } from "../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { PropertyFormContainer } from "../../shared/sidebar/propertyformcontainer/PropertyFormContainer";
import { Label } from "../../shared/basic/label/Label";

const UserProfileContainer = ({ sessionList, uniqueName, featureId }: IUserProfileContainer) => {

    const [selectedUserNode, setSelectedUserNode] = useState<ITreeNode>();

    useEffect(() => {
        if (!sessionList?.length) return;

        const loginUser = sessionList.find(
            item => item.VariableName?.toLowerCase() === "loginuserid"
        );
        if (loginUser && loginUser.SessionValue?.length) {
            setSelectedUserNode({
                key: loginUser.SessionValue,
                NodeEntID: loginUser.SessionValue,
                NodeEntityname: EntityNameEnums.User,
                children: [],
                stepNo: 1,
                parentEntID: null,
                NodeState: null,
                Description: null,
                title: "User",
                treetype: "User",
                Name: "User",
                Type: "User",
                icon: null,
                HasChildren: 0,
            })
        }
        else {
            setSelectedUserNode(undefined)
        }

    }, [sessionList.length]);

    return (
        <div className="nz-wh-100 nz-d-flex-column" >
            <div className="nz-sub-header">
                <Label uniqueName={`${uniqueName}-in`} label='Edit User Profile' />
            </div>
            <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                {selectedUserNode ?
                    <PropertyFormContainer uniqueName={uniqueName + "user-profile"} featureId={featureId}
                        selectedNode={selectedUserNode}
                        selectedNodeMenu={undefined}
                        pgTableToShow="PG.Contact"
                        showPgTableOneToOne={true} />
                    :
                    <></>
                }
            </div>
        </div>
    )
}

export { UserProfileContainer }
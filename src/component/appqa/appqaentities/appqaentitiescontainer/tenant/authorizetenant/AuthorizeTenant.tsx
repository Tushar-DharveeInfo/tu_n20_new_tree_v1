import { useState } from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import "../../../../allcss/appqaentitiescontainer/tenant/AuthorizeTenant.css";
import { Tenant } from "./tenant/Tenant";
import { IAuthorizeTenant } from "../../../../allinterface/iappqaentitiescontainer/tenant/IAuthorizeTenant";
import { ITenantRecord } from "../../../../allinterface/iappqaentitiescontainer/tenant/ITenant";
import { AuthorizeContainer } from "../../team/authorizeteam/authorizecontainer/AuthorizeContainer";

const AuthorizeTenant = (authorizeTenantProps: IAuthorizeTenant) => {
    const uniqueName = authorizeTenantProps.uniqueName ?? "tenant-authorize";
    const [selectedTenant, setSelectedTenant] = useState<ITenantRecord | null>(null);

    return (
        <div className="nz-tenant-authorize" key={uniqueName}>
            <div className="nz-tenant-authorize-container">
                <Splitter tabIndex={-1} className="nz-w-100 nz-h-100">
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">
                        <div className="nz-tenant-authorize-card-pane">
                            <Tenant
                                uniqueName={`${uniqueName}-card`}
                                selectedTenantId={selectedTenant?.EntID}
                                handleSelectedCard={(tenant) => {
                                    setSelectedTenant(tenant);
                                }}
                            />
                        </div>
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center nz-pane-2">
                        {selectedTenant && (
                            <AuthorizeContainer
                                uniqueName={uniqueName}
                                selectedCard={selectedTenant}
                                ownerEntityName={"Partner"}
                                entityName={"Tenant"}
                                allowCollapse={true}
                                sectionToHide="entities"
                                featureId={authorizeTenantProps.featureId}
                            />
                        )}
                    </SplitterPanel>
                </Splitter>
            </div>
        </div>
    );
};

export default AuthorizeTenant;

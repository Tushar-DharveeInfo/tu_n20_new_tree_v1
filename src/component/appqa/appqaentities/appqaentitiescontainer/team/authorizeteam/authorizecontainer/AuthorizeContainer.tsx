import { Label } from '../../../../../../shared/basic/label/Label';
import { Feature } from '../../../user/authorizeuser/userauthorizecontainer/feature/Feature';
import { CardContainer } from '../../../user/authorizeuser/userauthorizecontainer/cardcontainer/CardContainer';
import { ITeamRecord } from '../../../../../allinterface/iappqaentitiescontainer/team/ITeam';
import { Entities } from '../../../user/authorizeuser/userauthorizecontainer/entities/Entities';
import { IAuthorizeContainer } from '../../../../../allinterface/iappqaentitiescontainer/team/IAuthorizeContainer';
import { useState } from 'react';
import '../../../../../allcss/appqaentitiescontainer/team/AuthorizeTeam.css';

const AuthorizeContainer = (props: IAuthorizeContainer) => {
    const [isCollapsedFeature, setIsCollapsedFeature] = useState<boolean>(true)
    const [isCollapsedEntities, setIsCollapsedEntities] = useState<boolean>(true)
    const [isSidebarOpenbtn, setIsSidebarOpenbtn] = useState<boolean>(false)

    return (
        <div className="nz-team-authorize-right-side">
            <div className="nz-sub-header">
                <Label uniqueName={"team-Authorize-Header"} label={`${props.entityName}: ` + props.selectedCard?.Name} fontWeight="bold" />
            </div>
            <div className="nz-team-authorize-sections">
                {props.sectionToHide !== 'feature' && (
                    <div className={`nz-team-authorize-section${isCollapsedFeature ? "" : " is-expanded"}`}>
                        <CardContainer
                            uniqueName={`${props.uniqueName}-feature-card-container`}
                            header="Features"
                            allowCollapse={props.allowCollapse}
                            defaultCollapsed={true}
                            handleCollapseChange={(isCollapsed: boolean) => {
                                setIsCollapsedFeature(isCollapsed)
                                if (!isCollapsed) {
                                    setIsCollapsedEntities(true)
                                }
                            }}
                            isCollapsed={isCollapsedFeature}
                            component={
                                <Feature
                                    uniqueName={`${props.uniqueName}-feature-card`}
                                    selectedCard={props.selectedCard!}
                                    featureId={props.featureId}
                                    ownerEntityName={props.ownerEntityName}
                                    entityName={props.entityName}
                                    isCollapsed={isCollapsedFeature}
                                />
                            }
                        />
                    </div>
                )}
                {props.sectionToHide !== 'entities' && (
                    <div className={`nz-team-authorize-section${isCollapsedEntities ? "" : " is-expanded"}`}>
                        <CardContainer
                            uniqueName={`${props.uniqueName}-entities-card-container`}
                            header="Entities"
                            allowCollapse={props.allowCollapse}
                            defaultCollapsed={true}
                            handleCollapseChange={(isCollapsed: boolean) => {
                                setIsCollapsedEntities(isCollapsed)
                                if (!isCollapsed) {
                                    setIsCollapsedFeature(true)
                                }
                            }}
                            isCollapsed={isCollapsedEntities}
                            isShowSidebar={isSidebarOpenbtn}
                            handleSidebarOpen={() => {
                                setIsSidebarOpenbtn(false)
                            }}
                            component={
                                <Entities
                                    uniqueName={`${props.uniqueName}-entities-card`}
                                    selectedCard={props.selectedCard as ITeamRecord}
                                    featureId={props.featureId}
                                    isSidebarOpen={!isSidebarOpenbtn}
                                    ownerEntityName={props.ownerEntityName}
                                    isCollapsed={isCollapsedEntities}
                                    handleCloseSidebar={() => {
                                        setIsSidebarOpenbtn(true)
                                    }}
                                    handleShowSidebarOpenBtn={(hide) => {
                                        setIsSidebarOpenbtn(hide)
                                    }}
                                />
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export { AuthorizeContainer };

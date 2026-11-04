
import { Label } from '../../../../../../shared/basic/label/Label'
import { IAuthorizeUserContainer } from '../../../../../allinterface/iappqaentitiescontainer/user/IAuthorizeUserContainer'
import { License } from './license/License'
import { CardContainer } from './cardcontainer/CardContainer'
import { Tenant } from './tenant/Tenant'
import { Team } from './team/Team'
import { Site } from './site/Site'
import { Role } from './role/Role'
import { Feature } from './feature/Feature'
import { Entities } from './entities/Entities'
import { IUserContactEntity } from '../../../../../allinterface/iappqaentitiescontainer/user/IUser'
import { RefObject, useEffect, useRef, useState } from 'react'
import { ITreeNode } from '../../../../../../shared/allinterface/tree/ITreeControl'

const AuthorizeUserContainer = (props: IAuthorizeUserContainer) => {
    const [isCollapsedFeature, setIsCollapsedFeature] = useState<boolean>(true)
    const [isCollapsedEntities, setIsCollapsedEntities] = useState<boolean>(true)
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isSidebarOpenbtn, setIsSidebarOpenbtn] = useState<boolean>(false)

    const selectedUserid = useRef<string | null>(null)
    const authorizeContainerRef = useRef<HTMLDivElement | null>(null)
    const roleCardRef = useRef<HTMLDivElement | null>(null)
    const licenseCardRef = useRef<HTMLDivElement | null>(null)
    const siteCardRef = useRef<HTMLDivElement | null>(null)
    const teamCardRef = useRef<HTMLDivElement | null>(null)
    const tenantCardRef = useRef<HTMLDivElement | null>(null)
    const featureCardRef = useRef<HTMLDivElement | null>(null)
    const entitiesCardRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (selectedUserid.current !== props.selectedUser?.EntID) {
            selectedUserid.current = props.selectedUser?.EntID ?? ""
            setSelectedRole(null)
        }
    }, [props.selectedUser])

    // Scroll the authorize list so the target card header aligns at top.
    const scrollCardToTop = (cardRef?: RefObject<HTMLDivElement | null>) => {
        const container = authorizeContainerRef.current;
        const card = cardRef?.current;
        if (!container || !card) return;

        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const targetTop = cardRect.top - containerRect.top + container.scrollTop;

        container.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'auto'
        });
    };

    // Defer scrolling until collapse animation/layout updates complete.
    const requestCardScroll = (cardRef?: RefObject<HTMLDivElement | null>) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollCardToTop(cardRef);
            });
        });
    };

    // Update collapse state and scroll to the opened card.
    const handleCardCollapseChange = (
        isCollapsed: boolean,
        cardRef?: RefObject<HTMLDivElement | null>,
        callback?: (isCollapsed: boolean) => void
    ) => {
        callback?.(isCollapsed);
        if (!isCollapsed) {
            requestCardScroll(cardRef);
        }
    };

    return (
        <div className="nz-user-authorize-right-side">
            <div className="nz-sub-header">
                <Label uniqueName={"User-Authorize-Header"} label={"User: " + props.selectedUser?.UserName} fontWeight="bold" />
            </div>
            <div ref={authorizeContainerRef} className="nz-user-authorize-container">
                <div ref={roleCardRef}>
                    <CardContainer
                        uniqueName={`${props.uniqueName}-role-card-container`}
                        header="Roles"
                        allowCollapse={props.allowCollapse}
                        defaultCollapsed={false}
                        handleCollapseChange={(isCollapsed: boolean) => {
                            handleCardCollapseChange(isCollapsed, roleCardRef);
                        }}
                        component={
                            <Role
                                uniqueName={`${props.uniqueName}-role-card`}
                                selectedUser={props.selectedUser}
                                featureId={props.featureId}
                                handleRefreshUsersData={(role: string, info?: ITreeNode) => {
                                    setSelectedRole(info?.GroupName as string)

                                    props.handleRefreshUsersData?.(role, info?.GroupName as string);
                                }}
                            />
                        }
                    />
                </div>
                {props.selectedUser?.Roles &&
                    <>
                        <div ref={licenseCardRef}>
                            <CardContainer
                                uniqueName={`${props.uniqueName}-license-card-container`}
                                header="Licenses"
                                allowCollapse={props.allowCollapse}
                                defaultCollapsed={false}
                                handleCollapseChange={(isCollapsed: boolean) => {
                                    handleCardCollapseChange(isCollapsed, licenseCardRef);
                                }}
                                component={
                                    <License
                                        uniqueName={`${props.uniqueName}-license-card`}
                                        selectedUser={props.selectedUser}
                                        selectedRole={selectedRole}
                                    />
                                }
                            />
                        </div>
                        <div ref={siteCardRef}>
                            <CardContainer
                                uniqueName={`${props.uniqueName}-site-card-container`}
                                header="Sites"
                                allowCollapse={props.allowCollapse}
                                defaultCollapsed={false}
                                handleCollapseChange={(isCollapsed: boolean) => {
                                    handleCardCollapseChange(isCollapsed, siteCardRef);
                                }}
                                component={
                                    <Site
                                        uniqueName={`${props.uniqueName}-site-card`}
                                        selectedUser={props.selectedUser}
                                    />
                                }
                            />
                        </div>

                        <div ref={teamCardRef}>
                            <CardContainer
                                uniqueName={`${props.uniqueName}-team-card-container`}
                                header="Teams"
                                allowCollapse={props.allowCollapse}
                                defaultCollapsed={false}
                                handleCollapseChange={(isCollapsed: boolean) => {
                                    handleCardCollapseChange(isCollapsed, teamCardRef);
                                }}
                                component={
                                    <Team
                                        uniqueName={`${props.uniqueName}-team-card`}
                                        selectedUser={props.selectedUser}
                                    />
                                }
                            />
                        </div>
                        <div ref={tenantCardRef}>
                            <CardContainer
                                uniqueName={`${props.uniqueName}-tenant-card-container`}
                                header="Tenants"
                                allowCollapse={props.allowCollapse}
                                defaultCollapsed={false}
                                handleCollapseChange={(isCollapsed: boolean) => {
                                    handleCardCollapseChange(isCollapsed, tenantCardRef);
                                }}
                                component={
                                    <Tenant
                                        uniqueName={`${props.uniqueName}-tenant-card`}
                                        selectedUser={props.selectedUser}
                                    />
                                }
                            />
                        </div>

                        <div ref={featureCardRef}>
                            <CardContainer
                                uniqueName={`${props.uniqueName}-feature-card-container`}
                                header="Features"
                                allowCollapse={props.allowCollapse}
                                defaultCollapsed={true}
                                handleCollapseChange={(isCollapsed: boolean) => {
                                    handleCardCollapseChange(isCollapsed, featureCardRef, (nextCollapsed) => {
                                        setIsCollapsedFeature(nextCollapsed)
                                    })
                                }}
                                component={
                                    <Feature
                                        uniqueName={`${props.uniqueName}-feature-card`}
                                        selectedCard={props.selectedUser as IUserContactEntity}
                                        featureId={props.featureId}
                                        ownerEntityName={"User"}
                                        entityName={"User"}
                                        isCollapsed={isCollapsedFeature}
                                        onContentReady={() => {
                                            requestCardScroll(featureCardRef);
                                        }}
                                    />
                                }
                            />
                        </div>
                        <div ref={entitiesCardRef}>
                            <CardContainer
                                uniqueName={`${props.uniqueName}-entities-card-container`}
                                header="Entities"
                                allowCollapse={props.allowCollapse}
                                defaultCollapsed={true}
                                handleCollapseChange={(isCollapsed: boolean) => {
                                    handleCardCollapseChange(isCollapsed, entitiesCardRef, (nextCollapsed) => {
                                        setIsCollapsedEntities(nextCollapsed)
                                    })
                                }}
                                isShowSidebar={isSidebarOpenbtn}
                                handleSidebarOpen={() => {
                                    setIsSidebarOpenbtn(false)
                                }}
                                component={
                                    <Entities
                                        uniqueName={`${props.uniqueName}-entities-card`}
                                        selectedCard={props.selectedUser as IUserContactEntity}
                                        featureId={props.featureId}
                                        ownerEntityName={"User"}
                                        isCollapsed={isCollapsedEntities}
                                        isSidebarOpen={!isSidebarOpenbtn}
                                        onContentReady={() => {
                                            requestCardScroll(entitiesCardRef);
                                        }}
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
                    </>}
            </div>
        </div>
    )
}
export { AuthorizeUserContainer }

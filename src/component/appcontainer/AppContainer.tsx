
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IMainMenu, IMenuItem } from '../shared/allinterface/menu/IMainMenu'
import './allcss/AppContainer.css'
import { IAppContainer } from "./allinterface/IAppContainer"
import { FeatureRouteContainer } from "./featurecontainer/FeatureRouteContainer"
import { TitleContainer } from "./titlecontainer/TitleContainer"
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FnGenerateUID } from '../shared/allcommon/settingsform/FnGenerateUID'
import { AppQA, AppQARange } from '../constants/Feature'
import { axiosInterceptor } from '../shared/interceptors/Interceptor'
import { SESSION } from '../shared/interceptors/EndPoints'
import { useStatusBarContext } from '../shared/context/hooks/StatusBarHooks'
import { FnHandleAPIResponse } from '../shared/allcommon/basic/FnHandleAPIResponse'
import { useSessionContext } from '../shared/context/hooks/SessionHooks'
import { ISession } from '../shared/context/allinterface/ISession'
import { FnGetSessionVariableFromStorage } from '../shared/allcommon/basic/FnGetSessionVariableFromStorage'
import { FEnums } from '../constants/Feature'
import { useMainAppContext } from '../shared/context/hooks/MainAppHooks'
import { IFeatureItem } from '../shared/context/allinterface/IMainApp'
import { FnUpdateFeatureLabelFromSession } from '../shared/allcommon/basic/FnUpdateFeatureLabelFromSession'
import { IFnCreateForensiclog } from './allinterface/IFnCreateForensiclog'
import { FnCreateForensiclog } from './allcommon/FnCreateForensiclog'
import { LogGroupName, LogName, LogSubGroupName } from './alldefaultprops/DefaultPropsForensiclog'
import { MainMenu } from '../shared/menu/mainmenu/MainMenu'

// Type guard for IMenuItem validation
const isMenuItem = (item: unknown): item is IMenuItem => {
    return (
        typeof item === "object" &&
        item !== null &&
        "_Feature" in item &&
        "Label" in item &&
        (typeof (item as IMenuItem)._Feature === "string" || typeof (item as IMenuItem)._Feature === "number") &&
        typeof (item as IMenuItem).Label === "string"
    );
};

// Feature type constants
const AUDIT_FEATURES = [
    FEnums.AuditSession.toString(),
    FEnums.InventoryCollection.toString(),
    FEnums.InventoryConfiguration.toString()
];

const IT_FEATURES = [
    FEnums.ModelBusinessService.toString(),
    FEnums.ManageBusinessService.toString()
];

const HOME_FEATURES = [
    FEnums.Dashboard.toString(),
    FEnums.SelectDataCenterSite.toString(),
    FEnums.PowerBI.toString(),
    FEnums.AnalyticsAndCharts.toString()
]

const STORE_FEATURES = [
    FEnums.InventoryManagement.toString(),
    FEnums.InventoryConfiguration.toString()
];

const CHANGE_FEATURES = [
    FEnums.MoveAddChange.toString(),
    FEnums.ConfigureDevice.toString(),
    FEnums.EditPowerCabling.toString(),
    FEnums.EditNetworkCabling.toString(),
    FEnums.EditFloorLayout.toString(),
    FEnums.DCMConsole.toString(),
    FEnums.Discover.toString(),
    FEnums.Monitor.toString(),
    FEnums.Server.toString(),
    FEnums.CloudCompute.toString(),
    FEnums.VirtualCompute.toString()
];

const isAppQaFeatureId = (featureId?: string | number | null): boolean => {
    if (featureId === undefined || featureId === null || featureId === "") {
        return false;
    }
    const numericId = Number(featureId);
    return Number.isFinite(numericId) && numericId < AppQARange.MAX;
};

const isImpersonatingSession = (sessionVariables: ISession[]): boolean => {
    const impersonatedUserId = sessionVariables.find(
        (variable) => variable.VariableName === "ImpersonatedUserID"
    )?.SessionValue;
    return Boolean(String(impersonatedUserId ?? "").trim());
};

const getNonAppQaFeature = (
    featureData: IFeatureItem[],
    preferredFeatureId?: string
): IFeatureItem | undefined => {
    if (preferredFeatureId && !isAppQaFeatureId(preferredFeatureId)) {
        const preferredFeature = featureData.find(
            (item) => String(item._Feature) === String(preferredFeatureId)
        );
        if (preferredFeature) {
            return preferredFeature;
        }
    }

    return featureData.find(
        (item) =>
            !isAppQaFeatureId(item._Feature)
            && item.MenuID
            && String(item.MenuID) !== String(item._Feature)
    ) ?? featureData.find((item) => !isAppQaFeatureId(item._Feature));
};

const AppContainer = (appContainerProps: IAppContainer) => {
    const [searchParams] = useSearchParams();
    const siteId = searchParams.get("siteid");

    const [selectedFeatureData, setSelectedFeatureData] = useState<IMenuItem | null>(null);
    const [selectedAppQAData, setSelectedAppQAData] = useState<IMenuItem | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();
    const selectedFeatureIdRef = useRef<string | undefined>(undefined);

    const isManualFeatureChangeRef = useRef(false);

    const menuFeatureData: IMainMenu | null = useMemo(() => {
        if (!mainAppContext.featureRecords?.length) return null;

        return {
            uniqueName: "Menu",
            menuSize: "sm",
            w: "200px",
            h: "100%",
            isIconVertical: false,
            isVertical: false,
            compact: false,
            allowDND: true,
            featureData: [...mainAppContext.featureRecords]
        };
    }, [mainAppContext.featureRecords]);


    const callApiToUpdateSession = async (isForFeature: boolean, payload: IMenuItem) => {
        const handleUpdateSessionApiResponse = (updateSessionApiResponse: unknown, status?: string) => {
            if (status === "200" && updateSessionApiResponse && typeof updateSessionApiResponse === "object" && 'jsonSessionOutput' in updateSessionApiResponse) {
                const extractedData = FnHandleAPIResponse(updateSessionApiResponse.jsonSessionOutput, 'Dataset');
                if (extractedData && Array.isArray(extractedData)) {
                    sessionContext.setSessionList(extractedData);
                }
            }
        }

        let jsonstring: ISession[] = [];
        if (payload._Feature && isForFeature) {
            jsonstring.push(
                { VariableContext: "Feature", VariableName: "FeatureID", SessionValue: payload._Feature ? payload._Feature.toString() : "" },
                { VariableContext: "Feature", VariableName: "FeatureName", SessionValue: payload.Label },
                { VariableContext: "Feature", VariableName: "MenuName", SessionValue: payload.parentName },
                { VariableContext: "Feature", VariableName: "AppQAID", SessionValue: "" },
                { VariableContext: "Feature", VariableName: "AppQAName", SessionValue: "" },
                { VariableContext: "Feature", VariableName: "AppQAMenuName", SessionValue: "" },
                { VariableContext: "Feature", VariableName: "AppQAFeatureName", SessionValue: "" }
            );
        }
        else {
            jsonstring.push(
                { VariableContext: "Feature", VariableName: "AppQAID", SessionValue: payload._Feature ? payload._Feature.toString() : "" },
                { VariableContext: "Feature", VariableName: "AppQAName", SessionValue: payload.Label }
            );
        }
        if (isForFeature) {
            if (payload._Feature && AUDIT_FEATURES.includes(payload._Feature.toString()) && selectedFeatureIdRef.current && AUDIT_FEATURES.includes(selectedFeatureIdRef.current)) {
                jsonstring.push(
                    { VariableContext: "AuditSessionNode", VariableName: "AuditSessionID", SessionValue: "" },
                    { VariableContext: "AuditSessionNode", VariableName: "AuditSessionName", SessionValue: "" }
                );
            }
            else if (payload._Feature && AUDIT_FEATURES.includes(payload._Feature.toString()) && selectedFeatureIdRef.current && !AUDIT_FEATURES.includes(selectedFeatureIdRef.current)) {
                jsonstring.push(
                    { VariableContext: "Location", VariableName: "RoomID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "RoomName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationName", SessionValue: "" }
                );
            }
            else if (payload._Feature && CHANGE_FEATURES.includes(payload._Feature.toString())) {
                jsonstring.push(
                    { VariableContext: "Location", VariableName: "RoomID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "RoomName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationName", SessionValue: "" },
                    { VariableContext: "Node", VariableName: "SelectedNodeID", SessionValue: "" },
                    { VariableContext: "Node", VariableName: "SelectedNodeName", SessionValue: "" },
                    { VariableContext: "Node", VariableName: "SelectedNodeEntity", SessionValue: "" }
                );
            }
            else if (payload._Feature && STORE_FEATURES.includes(payload._Feature.toString()) && selectedFeatureIdRef.current && STORE_FEATURES.includes(selectedFeatureIdRef.current)) {
                jsonstring.push(
                    { VariableContext: "Inventory", VariableName: "InventoryID", SessionValue: "" },
                    { VariableContext: "Inventory", VariableName: "InventoryName", SessionValue: "" },
                    { VariableContext: "Inventory", VariableName: "StoreID", SessionValue: "" },
                    { VariableContext: "Inventory", VariableName: "StoreName", SessionValue: "" },
                    { VariableContext: "Inventory", VariableName: "BinID", SessionValue: "" },
                    { VariableContext: "Inventory", VariableName: "BinName", SessionValue: "" },
                    { VariableContext: "Inventory", VariableName: "MfgName", SessionValue: "" },
                    { VariableContext: "Inventory", VariableName: "EqTypeName", SessionValue: "" }
                );
            }
            else if (payload._Feature && IT_FEATURES.includes(payload._Feature.toString()) && selectedFeatureIdRef.current && IT_FEATURES.includes(selectedFeatureIdRef.current)) {
                jsonstring.push(
                    { VariableContext: "BusinessServiceNode", VariableName: "BusinessServiceID", SessionValue: "" },
                    { VariableContext: "BusinessServiceNode", VariableName: "BusinessServiceName", SessionValue: "" }
                );
            } else if (payload._Feature && HOME_FEATURES.includes(payload._Feature.toString()) && selectedFeatureIdRef.current && HOME_FEATURES.includes(selectedFeatureIdRef.current)) {
                jsonstring.push(
                    { VariableContext: "Location", VariableName: "RoomID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "RoomName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "FloorName", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationName", SessionValue: "" },
                    { VariableContext: "Node", VariableName: "SelectedNodeID", SessionValue: "" },
                    { VariableContext: "Node", VariableName: "SelectedNodeName", SessionValue: "" },
                    { VariableContext: "Node", VariableName: "SelectedNodeEntity", SessionValue: "" }
                );
            }
            else {
                jsonstring.push(
                    { VariableContext: "Location", VariableName: "LocationID", SessionValue: "" },
                    { VariableContext: "Location", VariableName: "LocationName", SessionValue: "" },
                    { VariableContext: "DeviceNode", VariableName: "AssetID", SessionValue: "" },
                    { VariableContext: "DeviceNode", VariableName: "AssetName", SessionValue: "" }
                );
            }
        }
        if (jsonstring.length) {
            await axiosInterceptor({
                url: SESSION.UpdateSession,
                data: {
                    jsonSession: JSON.stringify(jsonstring)
                },
                setFetchData: handleUpdateSessionApiResponse
            }, statusBarContext)
        }
    }

    const handleMenuSelect = async (
        _value: string | number | boolean | unknown,
        _actionCode?: string,
        payload?: unknown
    ): Promise<boolean> => {
        if (!isMenuItem(payload) || !payload._Feature) {
            return false;
        }
        const featureId = String(payload._Feature);

        // Prevent session redirect while manually changing feature
        isManualFeatureChangeRef.current = true;

        setSelectedFeatureData(payload);
        setSelectedAppQAData(null);

        selectedFeatureIdRef.current = featureId;

        try {
            await callApiToUpdateSession(
                true,
                payload
            );

            mainAppContext.setSelectedFeatureForHelp({
                featureID: featureId,
                featureName: payload.Label
            });
            // Navigate to newly selected feature
            navigate(
                `/feature/${featureId}`,
                {
                    state: payload
                }
            );
        } finally {
            // Keep protection until navigation/render is completed
            requestAnimationFrame(() => {
                isManualFeatureChangeRef.current = false;
            });
        }

        return true;
    };

    const handleAppqaSelect = async (
        _event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined,
        actionCode?: string,
        payload?: unknown
    ) => {
        if (selectedAppQAData && actionCode && selectedAppQAData._Feature === actionCode) {
            setSelectedAppQAData(null);
            const filteredSession = FnGetSessionVariableFromStorage("Feature", "FeatureID", sessionContext.SessionList);
            if (filteredSession && filteredSession.length > 0) {
                const featureFromSession = mainAppContext.featureRecords.find((item) => { return item._Feature === filteredSession[0].SessionValue });
                if (featureFromSession) {
                    const updatedPayload = { ...featureFromSession, IsAppqa: false };
                    setSelectedFeatureData(featureFromSession)
                    await callApiToUpdateSession(true, featureFromSession);
                    navigate(`/feature/${featureFromSession._Feature}`, { state: updatedPayload });
                    return;
                }
            }
        }
        // Validate payload
        if (!isMenuItem(payload) || !payload._Feature) {
            return;
        }

        setSelectedFeatureData(null);
        setSelectedAppQAData(payload);

        // Update help context
        if (payload._Feature !== AppQA.Help) {

            mainAppContext.setSelectedFeatureForHelp({
                featureID: String(payload._Feature),
                featureName: payload.Label
            });
        }
        await callApiToUpdateSession(false, payload);
        const updatedPayload = { ...payload, IsAppqa: true };
        navigate(`/feature/${actionCode}`, { state: updatedPayload });
    }

    const handleSelectForSubMenu = (value: any, actionCode?: string | undefined, payload?: any): void => {
        if (payload.parentName && !payload.subMenu && menuFeatureData) {
            const payloadData = { ...payload, key: FnGenerateUID() }
            if (handleMenuSelect) {
                handleMenuSelect(value, actionCode, payloadData).then(() => {
                    setIsOpen(false)
                });
            }
        }
    }

    useEffect(() => {
        if (location.state && isMenuItem(location.state)) {
            const featureId = location.state._Feature?.toString();
            if (featureId === AppQA.Help || featureId === AppQA.Reminder || featureId === AppQA.Task || featureId === AppQA.Settings || featureId === AppQA.Delegate) {
            }
            else {
                setSelectedFeatureData(location.state);
            }
        }
    }, [location?.state])

    useEffect(() => {
        return () => {
            selectedFeatureIdRef.current = undefined;
        }
    }, [])

    const redirectBaseOnSession = useCallback(
        async (
            sessionVariables: ISession[],
            featureData: IFeatureItem[]
        ) => {
            if (isManualFeatureChangeRef.current) {
                return;
            }
            if (!sessionVariables?.length || !featureData.length) return;
            const isAppqa = location.state?.IsAppqa === true;
            // Get Feature ID from URL
            // Example: /feature/123
            const pathParts = location.pathname
                .split("/")
                .filter(Boolean);

            const featureIdFromUrl =
                pathParts[0]?.toLowerCase() === "feature"
                    ? pathParts[1]
                    : undefined;

            const isImpersonating = isImpersonatingSession(sessionVariables);
            const shouldSkipUrlFeature =
                isImpersonating && isAppQaFeatureId(featureIdFromUrl);

            /*
             * CASE 1:
             * URL contains Feature ID + siteid 
             */
            if (featureIdFromUrl && siteId && !shouldSkipUrlFeature) {
                // Check whether URL feature is available to the user
                const featureFromUrl = featureData.find(
                    feature =>
                        String(feature._Feature).toLowerCase() ===
                        featureIdFromUrl.toLowerCase()
                );

                // User doesn't have access to this feature.
                // Do nothing and don't perform session redirect.
                if (!featureFromUrl) {
                    return;
                }

                const hierarchy = searchParams.get("hierarchy");
                const deviceId = searchParams.get("deviceid");

                // Handle URL redirect only when both params exist
                if (siteId && (hierarchy || deviceId)) {
                    // UpdateSession succeeded.
                    // Continue with feature processing.
                    const parentFeature = featureData.find(
                        item =>
                            item._Feature ===
                            featureFromUrl.MenuID
                    );

                    const featureWithParent = {
                        ...featureFromUrl,
                        parentName: parentFeature?.Label
                    };

                    const updatedFeature =
                        FnUpdateFeatureLabelFromSession(
                            [featureWithParent],
                            sessionVariables
                        );

                    const finalFeature = updatedFeature[0];

                    // Update help context
                    if (finalFeature?._Feature) {
                        mainAppContext.setSelectedFeatureForHelp({
                            featureID:
                                finalFeature._Feature.toString(),
                            featureName:
                                finalFeature.Label
                        });
                    }
                    // Navigate with entid ONLY after
                    // SESSION.UpdateSession succeeds
                    const params = new URLSearchParams();
                    if (hierarchy) {
                        params.set("hierarchy", hierarchy);
                    }
                    if (deviceId) {
                        params.set("deviceid", deviceId);
                    }
                    if (searchParams.get("appqaLaunch") === "true") {
                        params.set("appqaLaunch", "true");
                    }
                    navigate(
                        `/feature/${featureIdFromUrl}?${params.toString()}`,
                        {
                            replace: true,
                            state: {
                                ...finalFeature,
                                IsAppqa: false
                            }
                        }
                    );
                    return;
                }
            }
            else if (featureIdFromUrl && !isAppqa && !shouldSkipUrlFeature) {

                // Check whether URL feature is available to the user
                const featureFromUrl = featureData.find(
                    feature =>
                        String(feature._Feature).toLowerCase() ===
                        featureIdFromUrl.toLowerCase()
                );

                // User have access to this feature.
                // Do nothing and don't perform session redirect.
                if (featureFromUrl) {
                    const parentFeature = featureData.find(
                        feature =>
                            String(feature._Feature).toLowerCase() ===
                            featureFromUrl.MenuID.toLowerCase()
                    );
                    if (parentFeature) {
                        featureFromUrl.parentName = parentFeature.Label
                    }
                    await callApiToUpdateSession(
                        true,
                        featureFromUrl
                    );

                    return;
                }
            }

            /*
             * CASE 2:
             * No URL-based redirect.
             * Use existing session-based redirect.
             */
            const featureVar = sessionVariables.find(
                variable =>
                    variable.VariableContext === "Feature" &&
                    variable.VariableName === "FeatureID"
            );

            let feature: IFeatureItem | undefined;

            if (isImpersonating) {
                feature = getNonAppQaFeature(featureData, featureVar?.SessionValue ?? undefined);
            } else if (featureVar?.SessionValue) {
                feature = featureData.find(
                    item =>
                        String(item._Feature) ===
                        String(featureVar.SessionValue)
                );
            }

            if (!feature) return;

            const parentFeature = featureData.find(
                item =>
                    item._Feature === feature.MenuID
            );

            const featureWithParent = {
                ...feature,
                parentName: parentFeature?.Label
            };

            const updatedFeature =
                FnUpdateFeatureLabelFromSession(
                    [featureWithParent],
                    sessionVariables
                );

            if (updatedFeature[0]?._Feature) {
                mainAppContext.setSelectedFeatureForHelp({
                    featureID:
                        updatedFeature[0]._Feature.toString(),
                    featureName:
                        updatedFeature[0].Label
                });
            }
            navigate(
                searchParams.get("appqaLaunch") === "true"
                    ? `/feature/${feature._Feature}?appqaLaunch=true`
                    : `/feature/${feature._Feature}`,
                {
                    replace: true,
                    state: {
                        ...updatedFeature[0],
                        IsAppqa: false
                    }
                }
            );
        },
        [
            location.pathname,
            siteId,
            mainAppContext.setSelectedFeatureForHelp
        ]
    );

    useEffect(() => {
        const rafIds: number[] = [];

        if (sessionContext.SessionList.length > 0 && mainAppContext.featureRecords.length > 0) {
            // This is to prevent redirect based on session when we have query params to redirect on perticular feature
            const eqid = searchParams?.get("eqid");
            const wo = searchParams?.get("wo");
            if (!eqid && !wo) {
                const rafId1 = requestAnimationFrame(() => {
                    redirectBaseOnSession(sessionContext.SessionList, mainAppContext.featureRecords);
                });
                rafIds.push(rafId1);
            }
            const rafId2 = requestAnimationFrame(() => {
                const title_ele = document.getElementById("nz_title_tab");
                if (title_ele && sessionContext.SessionList.length) {
                    const sessionIdVar = sessionContext.SessionList.find((ele: ISession) => {
                        return ele.VariableContext === "Session" && ele.VariableName === "UserSessionNameID"
                    });
                    if (sessionIdVar)
                        title_ele.innerHTML = "NZ-" + (sessionIdVar.SessionValue ? sessionIdVar.SessionValue as string : "0");
                    else
                        title_ele.innerHTML = "NZ"
                }
            });
            rafIds.push(rafId2);

            if (appContainerProps.isNewSession) {

                const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Auth,
                    SubGroupName: LogSubGroupName.Auth,
                    LogName: LogName.LogIn,
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)
            }

        }

        return () => {
            rafIds.forEach(id => cancelAnimationFrame(id));
        };
    }, [mainAppContext.featureRecords.length, mainAppContext.refTableRecords.length, sessionContext.SessionList.length, appContainerProps.isNewSession])

    /*
    renders titlebar with appqa items
    render menu based on feature records where MenuID === _Feature (parent menu)
    on menu select, call handleMenuSelect with selected menu item data and close the menu on success
    
    render feature route container to display selected feature's component based on routing
    Statusbar is rendered inside feature components as needed
    */
    return (
        <div key={appContainerProps.uniqueName} id="appcontainer" className="nz-app-container" >
            {/* appcontainer */}
            <div key={`${appContainerProps.uniqueName}-ui`} id="UiContainer" className="nz-ui-container">
                <TitleContainer
                    uniqueName={`${appContainerProps.uniqueName}-ui-title`}
                    selectedAppqa={selectedAppQAData || undefined}
                    handleThemeChange={appContainerProps.handleThemeChange}
                    handleAppqaSelect={handleAppqaSelect}
                    handleMenuSelect={handleMenuSelect}
                    featureData={undefined}
                    selectedFeature={selectedFeatureData}
                    isMenuOpen={isOpen}
                    handleMenuMouse={(isOpenMenu: boolean) => {
                        setIsOpen(isOpenMenu);
                    }}
                />
                <div className="nz-ui-content">
                    <div className={`nz-action-list-menu ${isOpen ? 'nz-action-list-menu-open' : 'nz-action-list-menu-closed'}`}>
                        {menuFeatureData && (
                            <MainMenu
                                {...menuFeatureData}
                                selectedFeature={selectedFeatureData ?? undefined}
                                handleSelect={handleSelectForSubMenu}
                                handleMouseLeave={() => { setIsOpen(false); }}
                                hideSearchControl={true}
                            />
                        )}
                    </div>
                    <FeatureRouteContainer uniqueName={`${appContainerProps.uniqueName}-ui-feature-route-container`} />
                </div>
            </div>
        </div>
    )
}
export { AppContainer }

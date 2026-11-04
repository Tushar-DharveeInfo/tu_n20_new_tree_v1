
import { useEffect, useRef, useState } from "react";
import { useStatusBarContext } from "../../shared/context/hooks/StatusBarHooks";
import { useMainAppContext } from "../../shared/context/hooks/MainAppHooks";
import '../allcss/AppqaEntities.css'
import { IAppqaEntities } from "../allinterface/IAppqaEntities";
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";
import { IFeatureItem } from "../../shared/context/allinterface/IMainApp";
import { FnDeepClone } from "../../shared/allcommon/basic/FnDeepClone";
import { AppqaEntitiesExplorer } from "./appqaentitiesexplorer/AppqaEntitiesExplorer";
import { AppqaEntitiesContainer } from "./appqaentitiescontainer/AppqaEntitiesContainer";
import { Label } from "../../shared/basic/label/Label";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { SESSION } from "../../shared/interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../shared/allcommon/basic/FnHandleAPIResponse";
import { useSessionContext } from "../../shared/context/hooks/SessionHooks";
import { handleContainerKeyDown } from "../../shared/allcommon/basic/FnHandleContainerKeyDown";


const AppqaEntities = (appqaEntitiesProps: IAppqaEntities) => {
    const [selectedSubGroupItem, setSelectedSubGroupItem] = useState<IMenuItem>();
    const [featureData, setFeatureData] = useState<IFeatureItem[]>([]);
    const mainAppContext = useMainAppContext();
    const featureIdRef = useRef<string>(undefined);
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    /**
     * Loads default AppQA feature data
     */
    const handleAppQASelectionChange = (): void => {
        if (!mainAppContext.featureRecords?.length) {
            setFeatureData([]);
            return;
        }
        setFeatureData(FnDeepClone(mainAppContext.featureRecords));
    };


    /**
     * Handles feature selection changes
     */
    useEffect(() => {
        if (appqaEntitiesProps.featureId === featureIdRef.current) {
            return;
        }
        featureIdRef.current = appqaEntitiesProps.featureId;

        handleAppQASelectionChange();
    }, [
        appqaEntitiesProps.featureId,
        mainAppContext.featureRecords
    ]);

    /**
     * Cleanup selected subgroup on unmount
     */
    useEffect(() => {
        return () => {
            setSelectedSubGroupItem(undefined);
        };
    }, []);

    /**
     * Handles subgroup item selection
     */
    const handleSubGroupSelect = async (
        event?: React.MouseEvent<HTMLDivElement, MouseEvent>,
        _actionCode?: string | IMenuItem,
        payload?: IMenuItem
    ) => {
        if (!payload) {
            return;
        }

        // Update selected subgroup item
        const shouldUpdateSelection =
            !!event || (!event && !selectedSubGroupItem);

        if (shouldUpdateSelection) {
            if (!payload.subMenu?.length && payload.parentName) {
                await axiosInterceptor({
                    url: SESSION.UpdateSession,
                    data: {
                        jsonSession: JSON.stringify([
                            { VariableContext: "Feature", VariableName: "AppQAMenuName", SessionValue: payload.parentName },
                            { VariableContext: "Feature", VariableName: "AppQAFeatureName", SessionValue: payload.Label }
                        ])
                    },
                    setFetchData: (updateSessionApiResponse: unknown, status?: string) => {
                        if (status === "200" && updateSessionApiResponse && typeof updateSessionApiResponse === "object" && 'jsonSessionOutput' in updateSessionApiResponse) {
                            const extractedData = FnHandleAPIResponse(updateSessionApiResponse.jsonSessionOutput, 'Dataset');
                            if (extractedData && Array.isArray(extractedData)) {
                                sessionContext.setSessionList(extractedData);
                            }
                        }
                    }
                }, statusBarContext)
            }
            setSelectedSubGroupItem(payload);
            // Notify parent component
            appqaEntitiesProps.handleSelectedMenuItem?.(payload);
        }

        // Update help context
        if (payload.parentFeatureId && payload._Feature) {
            mainAppContext.setSelectedFeatureForHelp({
                featureID: String(payload._Feature),
                featureName: payload.Label
            });
        }
    };
    const headerTitle = [
        appqaEntitiesProps.headerText,
        selectedSubGroupItem?.parentName && `[${selectedSubGroupItem.parentName}]`,
        selectedSubGroupItem?.Label && `[${selectedSubGroupItem.Label}]`
    ].filter(Boolean)
        .join(" ");

    return (
        <div
            key={appqaEntitiesProps.uniqueName}
            className='nz-w-100 nz-h-100 nz-d-flex-column'
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
        >
            {appqaEntitiesProps.allowShowHeader &&
                <div className='nz-sub-header  nz-d-flex-row nz-w-100 nz-h-40-px'>
                    <Label uniqueName={appqaEntitiesProps.uniqueName + "header"} label={headerTitle} fontWeight="bold" />
                </div>
            }
            <div className='nz-w-100 nz-h-100 nz-d-flex-row nz-app-qa-entities'>
                {/* 
                       Entities Explorer Render logic:
                       - Renders only when feature data exists
                       - Displays entities navigation hierarchy
                   */}
                {featureData.length > 0 && (
                    <AppqaEntitiesExplorer
                        uniqueName={appqaEntitiesProps.uniqueName}
                        featureId={appqaEntitiesProps.featureId}
                        featureData={featureData}
                        handleSelect={handleSubGroupSelect}
                    />
                )}
                {/*
                       Entities Content Render logic :
                       - Renders only after subgroup selection
                       - Dynamically loads selected entities panel
                   */}
                {selectedSubGroupItem && (
                    <AppqaEntitiesContainer
                        uniqueName={`${appqaEntitiesProps.uniqueName}-entities-components`}
                        selectedFeatureItem={selectedSubGroupItem}
                        featureId={appqaEntitiesProps.featureId}
                    />
                )}
            </div>
        </div>
    );
}

export default AppqaEntities 
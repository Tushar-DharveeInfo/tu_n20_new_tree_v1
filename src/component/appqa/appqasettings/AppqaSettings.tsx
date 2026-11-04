
import { useEffect, useRef, useState } from 'react';
import { axiosInterceptor } from '../../shared/interceptors/Interceptor';
import { EXPLORER, SESSION } from '../../shared/interceptors/EndPoints';
import '../allcss/AppqaSettings.css';
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks';
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks';
import { FEnums } from '../../constants/Feature';
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely';
import { FnDeepClone } from '../../shared/allcommon/basic/FnDeepClone';
import { IAppqaSettings } from '../allinterface/IAppqaSettings';
import { IFeatureItem } from '../../shared/context/allinterface/IMainApp';
import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu';
import { AppqaSettingsContainer } from './appqasettingscontainer/AppqaSettingsContainer';
import { AppqaSettingsExplorer } from './appqasettingsexplorer/AppqaSettingsExplorer';
import { Label } from '../../shared/basic/label/Label';
import { FnHandleAPIResponse } from '../../shared/allcommon/basic/FnHandleAPIResponse';
import { useSessionContext } from '../../shared/context/hooks/SessionHooks';
import { handleNestedZoneContainerKeyDown } from '../../shared/allcommon/basic/FnHandleContainerKeyDown';

const AppqaSettings = (settingsContainerProps: IAppqaSettings) => {
    const [selectedSubGroupItem, setSelectedSubGroupItem] = useState<IMenuItem>();
    const [featureData, setFeatureData] = useState<IFeatureItem[]>([]);

    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();

    const featureIdRef = useRef<string>(undefined);

    /**
     * Converts API hierarchy data into feature records
     */
    const transformHelpTipData = (input: Record<string, any>): IFeatureItem[] => {
        if (!input?.NetZoomSettings?.length) {
            return [];
        }
        const transformedData: IFeatureItem[] = [];
        input.NetZoomSettings.forEach((setting: Record<string, any>) => {
            setting?.Group?.forEach((group: Record<string, any>, groupIndex: number) => {
                const groupFeatureId = `${100 + groupIndex}`;
                transformedData.push({
                    MenuID: groupFeatureId,
                    _Feature: groupFeatureId,
                    Label: group?.Name ?? '',
                    NodeType: group?.NodeType ?? '',
                    Tooltip: group?.Description ?? '',
                    SortOrder: 100 + groupIndex,
                    DefaultQA: false,
                    FilterForm: '',
                    SearchPrompt: null,
                    Secured: true,
                    IsNZ: true,
                    EntID: setting?.EntID ?? '',
                    RecID: crypto.randomUUID(),
                    LastUpdated: new Date().toISOString(),
                    EntityName: 'Feature',
                    PopupQa: false,
                    FeatureTag: '',
                });
                group?.SubGroup?.forEach((subGroup: Record<string, any>, subIndex: number) => {
                    const subFeatureId = `${groupFeatureId}-${subIndex + 1}`;
                    transformedData.push({
                        MenuID: groupFeatureId,
                        _Feature: subFeatureId,
                        Label: subGroup?.Name ?? '',
                        NodeType: subGroup?.NodeType ?? '',
                        Tooltip: subGroup?.Description ?? '',
                        SortOrder: subIndex + 1,
                        DefaultQA: false,
                        FilterForm: subGroup?.DisplayControl ?? '',
                        SearchPrompt: null,
                        Secured: true,
                        IsNZ: true,
                        EntID: subGroup?.SubGroupEntID ?? '',
                        RecID: crypto.randomUUID(),
                        LastUpdated: new Date().toISOString(),
                        EntityName: 'Feature',
                        PopupQa: false,
                        FeatureTag: '',
                    });
                });
            });
        });

        return transformedData;
    };

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
     * Loads Configure Monitor settings
     */
    const handleConfigureMonitorData = async (): Promise<void> => {
        try {
            await axiosInterceptor({
                url: EXPLORER.ExploreSettings,
                data: {
                    isMySetting: 2
                },
                setFetchData: (exploreSettingApiResponse: unknown, status?: string) => {
                    if (status !== "200") return;
                    if (
                        !exploreSettingApiResponse ||
                        typeof exploreSettingApiResponse !== 'object' ||
                        !('hierarchyJson' in exploreSettingApiResponse)
                    ) {
                        settingsContainerProps.handleShowUserMessage?.('Invalid ExploreSettings response');
                        setFeatureData([]);
                        return;
                    }
                    const parsedData = FnParseJsonSafely(
                        exploreSettingApiResponse.hierarchyJson as string
                    );
                    if (!parsedData) {
                        settingsContainerProps.handleShowUserMessage?.("No data found to show Configure")
                        setFeatureData([]);
                        return;
                    }
                    const transformedData = transformHelpTipData(parsedData);
                    setFeatureData(
                        transformedData.length > 0
                            ? FnDeepClone(transformedData)
                            : []
                    );
                }
            }, statusBarContext);
        }
        catch (error) {
            console.error('Failed to load Configure Monitor data:', error);
            setFeatureData([]);
        }
    };

    /**
     * Handles feature selection changes
     */
    useEffect(() => {
        if (settingsContainerProps.featureId === featureIdRef.current) {
            return;
        }
        featureIdRef.current = settingsContainerProps.featureId;
        if (settingsContainerProps.featureId === FEnums.Configure) {
            handleConfigureMonitorData();
        }
        else {
            handleAppQASelectionChange();
        }
    }, [
        settingsContainerProps.featureId,
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
        }

        // Update help context
        if (payload.parentFeatureId && payload._Feature) {
            mainAppContext.setSelectedFeatureForHelp({
                featureID: String(payload._Feature),
                featureName: payload.Label
            });
        }

        // Notify parent component
        settingsContainerProps.handleSelectedMenuItem?.(payload);
    };

    const headerTitle = [
        settingsContainerProps.headerText,
        selectedSubGroupItem?.parentName && `[${selectedSubGroupItem.parentName}]`,
        selectedSubGroupItem?.Label && `[${selectedSubGroupItem.Label}]`
    ].filter(Boolean)
        .join(" ");
    return (
        <div
            key={settingsContainerProps.uniqueName}
            className='nz-w-100 nz-h-100 nz-d-flex-column'
            tabIndex={1}
            onKeyDown={handleNestedZoneContainerKeyDown}
        >
            {settingsContainerProps.allowShowHeader &&
                <div className='nz-sub-header  nz-d-flex-row nz-w-100 nz-h-40-px'>
                    <Label uniqueName={settingsContainerProps.uniqueName + "header"} label={headerTitle} fontWeight="bold" />
                </div>
            }
            <div className='nz-w-100 nz-h-100 nz-d-flex-row nz-app-qa-setting'>
                {/* 
                    Settings Explorer Render logic:
                    - Renders only when feature data exists
                    - Displays settings navigation hierarchy
                */}
                {featureData.length > 0 && (
                    <AppqaSettingsExplorer
                        uniqueName={settingsContainerProps.uniqueName}
                        featureId={settingsContainerProps.featureId}
                        featureData={featureData}
                        handleSelect={handleSubGroupSelect}
                    />
                )}
                {/*
                    Settings Content Render logic :
                    - Renders only after subgroup selection
                    - Dynamically loads selected settings panel
                */}
                {selectedSubGroupItem && (
                    <AppqaSettingsContainer
                        uniqueName={`${settingsContainerProps.uniqueName}-settings-components`}
                        selectedFeatureItem={selectedSubGroupItem}
                        featureId={settingsContainerProps.featureId}
                    />
                )}
            </div>
        </div>
    );
};

export default AppqaSettings;

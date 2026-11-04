
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Key } from 'rc-tree/lib/interface'
import { CheckInfo } from 'rc-tree/lib/Tree'
import { Close24x24, Filter24x24 } from '@n20a/libicon'
import { RadioButtonGroupControl } from '@n20a/libform'
import { FEnums } from '../../../constants/Feature'

import '@n20a/libform/index.css'
import '../../allcss/searchfilter/FilterFormContainer.css'

import { useSessionContext } from '../../context/hooks/SessionHooks'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks'
import { useMainAppContext } from '../../context/hooks/MainAppHooks'
import { IFeatureItem } from '../../context/allinterface/IMainApp'

import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { formControlsDcExplorerFilter } from '../../../../sampledata/formControlsDcExplorerFilter'
import { FnGetFilteredControls, FnGetPartnerFilterOptions } from '../../allcommon/searchfilter/FnGetPartnerFilterOptions'
import { FnGetSessionVariableFromStorage } from '../../allcommon/basic/FnGetSessionVariableFromStorage'
import { IDirtyFlagImage } from '../../allinterface/basic/IDirtyFlagImage'
import { IControl } from '../../allinterface/settingsform/ISettingsLibForm'
import { IFilterFormContainer } from '../../allinterface/searchfilter/IFilterFormContainer'
import { ITreeNode } from '../../allinterface/tree/ITreeControl'

import { DirtyFlagImage } from '../../basic/dirtyflagimage/DirtyFlagImage'
import { Label } from '../../basic/label/Label'
import { SettingsLibForm } from '../../settingsform/settingslibform/SettingsLibForm'
import { FilterTreeContainer } from './FilterTreeContainer'
import { handleContainerKeyDown, handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown'
import { ActionImage } from '../../basic/actionimage/ActionImage'

// Normalizes unknown form values to a comparable string.
function toFilterValueString(value: unknown): string {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    return String(value);
}

const FilterFormContainer = (filterFormContainerProps: IFilterFormContainer) => {
    const { featureId: paramFeatureId } = useParams<{ featureId?: string }>();
    const currentFeatureId = filterFormContainerProps.featureId || paramFeatureId;
    const isInventoryFeature =
        currentFeatureId === FEnums.InventoryManagement ||
        currentFeatureId === FEnums.InventoryConfiguration ||
        String(currentFeatureId) === FEnums.InventoryManagement.toString() ||
        String(currentFeatureId) === FEnums.InventoryConfiguration.toString();

    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();

    const isMacMenuFeature = useMemo(() => {
        if (!currentFeatureId) return false;
        const featureIdStr = String(currentFeatureId).trim();

        const featureRecord = mainAppContext.featureRecords?.find(
            (item: IFeatureItem) => item._Feature === featureIdStr
        );
        const parentMenu = featureRecord?.MenuID
            ? mainAppContext.featureRecords?.find(
                (item: IFeatureItem) => item._Feature === featureRecord.MenuID
            )
            : undefined;

        const parentMenuLabel = (parentMenu?.Label || "").toLowerCase().trim();
        if (
            parentMenuLabel === "plan" ||
            parentMenuLabel === "rack and stack" ||
            parentMenuLabel === "tech refresh"
        ) {
            return true;
        }

        const featureLabel = (featureRecord?.Label || "").toLowerCase().trim();
        if (
            featureLabel === "plan" ||
            featureLabel === "rack and stack" ||
            featureLabel === "tech refresh"
        ) {
            return true;
        }

        const macFeatureIds = new Set([
            FEnums.EditFloorLayout,
            FEnums.AssetPlacement,
            FEnums.AssetAssignmentPlan,
            FEnums.Relocate,
            FEnums.Transfer,
            FEnums.Delete,
            FEnums.InboundAssetPlacement,
            FEnums.InboundAssets,
            FEnums.Workorder,
            FEnums.ReplacementProfile,
            FEnums.Replace,
        ].map(String));

        if (macFeatureIds.has(featureIdStr)) {
            return true;
        }

        const numericId = Number(featureIdStr);
        if (!isNaN(numericId) && numericId >= 200 && numericId < 300) {
            return true;
        }

        return false;
    }, [currentFeatureId, mainAppContext.featureRecords]);

    const MAC_TAGS = useMemo(() => new Set(["delete", "relocate", "replace", "transfer"]), []);

    const getSessionSiteId = (): Key | undefined => {
        const siteIdFromSession = FnGetSessionVariableFromStorage(
            "Location",
            "SiteID",
            sessionContext.SessionList
        );
        return siteIdFromSession?.[0]?.SessionValue ?? undefined;
    };

    const getSessionRoomId = (): Key | undefined => {
        const roomIdFromSession = FnGetSessionVariableFromStorage(
            "Filter",
            "FilterRoomID",
            sessionContext.SessionList
        );
        return roomIdFromSession?.[0]?.SessionValue ?? undefined;
    };

    const [controls, setControls] = useState<IControl[]>([]);
    const [isShowFilterForm, setIsShowFilterForm] = useState<boolean>(false);
    const [defaultSelectedSiteId, setDefaultSelectedSiteId] = useState<Key | undefined>(getSessionSiteId);
    const [defaultSelectedRoomId, setDefaultSelectedRoomId] = useState<Key | undefined>(getSessionRoomId);
    const [filterControls, setFilterControls] = useState<IControl[]>();
    const [rawFilterOptionData, setRawFilterOptionData] = useState<Record<string, string>[]>();

    const filterOptionData = useMemo(() => {
        if (!rawFilterOptionData) return undefined;
        if (isMacMenuFeature) return rawFilterOptionData;
        return rawFilterOptionData.filter((item) => {
            if ("tag" in item) {
                const tagName = (item.tag || item.label || "").toString().trim().toLowerCase();
                return !MAC_TAGS.has(tagName);
            }
            return true;
        });
    }, [rawFilterOptionData, isMacMenuFeature, MAC_TAGS]);
    const [profileString, setProfileString] = useState<string>(
        JSON.stringify([filterFormContainerProps.controlValues])
    );
    const treeDivRef = useRef<HTMLDivElement>(null);
    const filterFormContainerRef = useRef<HTMLDivElement>(null);
    const [formVersion, setFormVersion] = useState(0);
    const [isTreeLoading, setIsTreeLoading] = useState<boolean>(
        () => !!filterFormContainerProps.allowFilterTree
    );

    const handleTreeLoadingChange = useCallback((loading: boolean) => {
        setIsTreeLoading(loading);
    }, []);

    // Forces SettingsLibForm remount when partner filter controls change.
    useEffect(() => {
        setFormVersion(v => v + 1);
    }, [filterControls]);

    // Syncs profile string when parent control values change.
    useEffect(() => {
        setProfileString(JSON.stringify([filterFormContainerProps.controlValues]));
    }, [filterFormContainerProps.controlValues]);

    // Loads site/room defaults from session and applies passed form controls.
    useEffect(() => {
        try {
            const siteId = getSessionSiteId();
            const roomId = getSessionRoomId();
            setDefaultSelectedSiteId(siteId);
            setDefaultSelectedRoomId(roomId);
        } catch (error) {
            console.error("Failed to load filter form session defaults", error);
        }
        setControls(filterFormContainerProps.controls.length > 0 ? filterFormContainerProps.controls : []);
    }, [sessionContext.SessionList, filterFormContainerProps.controls]);

    // Loads partner filter options and pre-fills controls from session names.
    useEffect(() => {
        if (!defaultSelectedSiteId || !filterFormContainerProps.allowFilterTree || isInventoryFeature) return;

        const siteData = sessionContext.SessionList.find(
            (item) => item.VariableName?.toLowerCase() === "siteid"
        );
        const siteId = siteData?.SessionValue ?? String(defaultSelectedSiteId);
        let isActive = true;
        const loadPartnerFilterOptions = async () => {
            try {
                const data = await FnGetPartnerFilterOptions(siteId, statusBarContext);
                if (!isActive) return;
                setRawFilterOptionData(data);
                const updatedControls = formControlsDcExplorerFilter.map((control) => {
                    const sessionValue = sessionContext.SessionList.find(
                        (s) => s.VariableName?.toLowerCase() === `${control.Name?.toLowerCase()}name`
                    );
                    if (sessionValue) {
                        return {
                            ...control,
                            Value: sessionValue.SessionValue
                        };
                    }
                    return control;
                });
                setFilterControls(updatedControls);
            } catch (error) {
                if (!isActive) return;
                console.error("Failed to load partner filter options", error);
                setRawFilterOptionData([]);
            }
        };

        void loadPartnerFilterOptions();
        return () => {
            isActive = false;
        };
    }, [defaultSelectedSiteId, filterFormContainerProps.allowFilterTree, sessionContext.SessionList]);

    // Observes filter form width and toggles row layout for responsive controls.
    useEffect(() => {
        const container = document.querySelector('.nz-filter-form-container');
        if (!container || controls.length === 0) {
            setIsShowFilterForm(true);
            return;
        }

        const observerRefs = {
            resizeObserver: null as ResizeObserver | null,
            mutationObserver: null as MutationObserver | null,
            resizeTimeout: undefined as ReturnType<typeof setTimeout> | undefined,
        };

        const applyLayout = (width: number, formControls: NodeListOf<Element>) => {
            if (width < 400) {
                formControls.forEach(div => div.classList.remove('row-layout'));
                container.classList.remove('nz-div-row-layout');
            } else {
                formControls.forEach(div => div.classList.add('row-layout'));
                container.classList.add('nz-div-row-layout');
            }
        };

        const startResizeObserver = (formControls: NodeListOf<Element>) => {
            if (!formControls.length) return;

            observerRefs.resizeObserver = new ResizeObserver(entries => {
                if (observerRefs.resizeTimeout) {
                    clearTimeout(observerRefs.resizeTimeout);
                }
                observerRefs.resizeTimeout = setTimeout(() => {
                    for (const entry of entries) {
                        applyLayout(entry.contentRect.width, formControls);
                        setIsShowFilterForm(true);
                    }
                }, 100);
            });

            observerRefs.resizeObserver.observe(container);
            applyLayout(container.clientWidth, formControls);
            setIsShowFilterForm(true);
        };

        observerRefs.mutationObserver = new MutationObserver(() => {
            const formControls = container.querySelectorAll('.nz-form-control-labeled');
            if (formControls.length > 0) {
                observerRefs.mutationObserver?.disconnect();
                startResizeObserver(formControls);
            }
        });

        observerRefs.mutationObserver.observe(container, { childList: true, subtree: true });

        return () => {
            if (observerRefs.resizeTimeout) {
                clearTimeout(observerRefs.resizeTimeout);
            }
            observerRefs.resizeObserver?.disconnect();
            observerRefs.mutationObserver?.disconnect();
        };
    }, [controls]);

    // Forwards filter icon click to parent handler.
    function handleActionImageClick(event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string): void {
        filterFormContainerProps.handleActionImageClick?.(event, actionCode);
    }

    // Propagates form value changes and resolves partner option ids by label.
    function handleValueChange(value: unknown, name: string | undefined, isDefault?: boolean): void {
        if (name && !isDefault && filterFormContainerProps.handleFilterFormChange) {
            const valueText = toFilterValueString(value);
            // Keeps only one active partner filter by clearing other control values.
            if (filterFormContainerProps.allowFilterTree && name !== "dc-type") {
                setFilterControls((prevControls) =>
                    (prevControls || []).map((control) => ({
                        ...control,
                        Value: control.Name === name ? valueText : ""
                    }))
                );
            }
            const filteredOption = filterOptionData?.find(
                (item) => item.label?.toLowerCase() === valueText.toLowerCase()
            );
            filterFormContainerProps.handleFilterFormChange(valueText, name, filteredOption?.value ?? "");
        }
    }

    // Reloads partner options when site selection changes in filter tree.
    function handleNodeCheck(checked: { checked: Key[]; halfChecked: Key[] }, info: CheckInfo<ITreeNode>): void {
        if (!isInventoryFeature && info.node.NodeEntID && info.node.treetype?.toLowerCase() === "site") {
            setProfileString('');
            setFilterControls((prevControls) =>
                (prevControls || []).map((control) => ({
                    ...control,
                    Value: ""
                }))
            );
            const siteId = info.node.NodeEntID.toString();
            FnGetPartnerFilterOptions(siteId, statusBarContext)
                .then((data) => setRawFilterOptionData(data))
                .catch((error) => {
                    console.error("Failed to reload partner filter options for site", error);
                    setRawFilterOptionData([]);
                });
        }
        filterFormContainerProps.handleNodeCheck?.(checked, info);
    }

    const filterIcon: IDirtyFlagImage = {
        image: {
            w: 'var(--image-size-2)',
            h: 'var(--image-size-2)',
            uniqueName: "filtericon",
            source: <Filter24x24
                size={FnGetCssVariable('--image-size-2')}
                fill='none'
                strokeWidth={1} />,
            type: "svg",
            tooltip: "Filter"
        },
        uniqueName: 'test-image',
        w: 'var(--node_height)',
        h: 'var(--node_height)',
        bgColor: "#FFFF99",
        allowBorder: false,
    }
    const visibleControls = FnGetFilteredControls(filterControls || [], filterOptionData || []);
    return (
        <div key={filterFormContainerProps.uniqueName} className='nz-filter-form-container' tabIndex={1} onKeyDown={handleContainerKeyDown}>
            {filterFormContainerProps.allowHeader && <div className='nz-sub-header'>
                <Label uniqueName={`${filterFormContainerProps.uniqueName}-fheader`} label={filterFormContainerProps.headerText || ""}
                />
                <div className='nz-d-flex-row' style={{ gap: 'var(--spacing-1)' }}>
                    <ActionImage uniqueName={`${filterFormContainerProps.uniqueName}-explorer-tree-info-ai`}
                        image={{
                            uniqueName: `${filterFormContainerProps.uniqueName}-explorer-tree-info-image`,
                            source: <Close24x24 size={FnGetCssVariable('--image-size-2')}
                                fill="none"
                                strokeWidth={1} />,
                            w: 'var(--image-size-2)',
                            tooltip: "Cancel",
                            type: "svg"

                        }} w={'var(--node_height)'} h={'var(--node_height)'} actionCode={'information'}
                        handleMouse={(event) => {
                            filterFormContainerProps.handleActionImageClick?.(event, 'close')
                        }} />
                    {filterFormContainerProps.isFilterChange && <div className='nz-filter-icon'>
                        <DirtyFlagImage {...filterIcon} handleMouse={handleActionImageClick} isDirty={filterFormContainerProps.isFilterChange ? true : false} />
                    </div>}
                </div>
            </div>}
            <div ref={filterFormContainerRef} className={`nz-filter-form-content${!isShowFilterForm ? " nz-hide-filter-form" : ""}`}
                onKeyDownCapture={handleFormControlsKeyDown}
                onKeyDown={handleFormControlsBubbleKeyDown}>

                {filterFormContainerProps.uniqueName === "all-dc-filter-form" ? <RadioButtonGroupControl
                    name='dc-type'
                    options={[{ label: "All Sites", value: "AllSites" }, { label: "Tenants by Site", value: "TenantsBySite" }, { label: "Sites by Tenant", value: "SitesByTenant" }]}
                    value={filterFormContainerProps.customValue ? filterFormContainerProps.customValue : 'AllSites'}
                    onChange={(value) => {
                        handleValueChange(value, 'dc-type')
                    }} /> : <>
                    {!isInventoryFeature && (
                        controls.length > 0 ? <SettingsLibForm uniqueName={`${filterFormContainerProps.uniqueName}-settings-form`}
                            controls={controls}
                            profileString={''}
                            isAutoSave={true}
                            allowShowHeader={false}
                            handleActionImageClick={handleActionImageClick}
                            handleValueChange={handleValueChange}
                            isDisableForm={false}
                        /> :
                            <div className='nz-filter-form-one-only' key={`${filterFormContainerProps.uniqueName}-settings-lib-form-2`}
                            >

                                {visibleControls.length > 0 && (
                                    <SettingsLibForm
                                        key={formVersion}
                                        uniqueName={filterFormContainerProps.uniqueName + 'filter'}
                                        controls={visibleControls}
                                        profileString={profileString}
                                        allowShowHeader={false}
                                        refDataObject={filterOptionData}
                                        isAutoSave={true}
                                        isDisableForm={false}
                                        handleValueChange={handleValueChange}
                                    />
                                )}
                            </div>
                    )}

                    <div className='nz-filter-data-center-site' key={`${filterFormContainerProps.uniqueName}-dc-sites-container`}>
                        <div className="nz-form-section-header">
                            Select Data Center
                        </div>
                        <div className="nz-form-section-body" ref={treeDivRef}>
                            {filterFormContainerProps.allowFilterTree && (
                                <>
                                    {isTreeLoading && (
                                        <div className="nz-filter-tree-loading">
                                            <Label
                                                uniqueName={`${filterFormContainerProps.uniqueName}-tree-loading`}
                                                label="Loading..."
                                            />
                                        </div>
                                    )}
                                    <div className={isTreeLoading ? 'nz-filter-tree-loading-hidden' : ''}>
                                        <FilterTreeContainer
                                            uniqueName={`${filterFormContainerProps.uniqueName}-ftree`}
                                            defaultSiteEntID={defaultSelectedSiteId ?? null}
                                            defaultRoomEntID={defaultSelectedRoomId}
                                            featureId={filterFormContainerProps.featureId}
                                            handleNodeCheck={handleNodeCheck}
                                            onTreeLoadingChange={handleTreeLoadingChange}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>


                </>}
            </div>
        </div>
    )
}

export { FilterFormContainer }




import { useEffect, useState } from 'react'
import { useAppqaSettingsVarContext } from '../../../shared/context/hooks/AppqaSettingsVarHooks';
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import '../../allcss/appqasettingscontainer/AppqaSettingsContainer.css'
import { EntitiesSubGroups, EntitesGroups } from '../../../constants/Feature';
import { EntityNameEnums } from '../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { IHelpTipProperty } from '../../../shared/context/allinterface/IHelpTip';
import { Label } from '../../../shared/basic/label/Label';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { Refresh24x24 } from '@n20a/libicon';
import { IImage } from '../../../shared/allinterface/basic/IImage';
import { IAppqaEntitiesContainer } from '../../allinterface/iappqaentitiescontainer/IAppqaEntitiesContainer';
import { ManagePartners } from './cloudprovider/managepartners/ManagePartners';
import { DataCenterHierarchy } from './site/DataCenterHierarchy';
import { InventoryStoreAndBins } from './site/InventoryStoreAndBins';
import { EditDeviceEntityMapping } from './device/editdeviceentitymapping/EditDeviceEntityMapping';
import { EditNetZoomEntityMapping } from './netzoom/editnetzoomentitymapping/EditNetZoomEntityMapping';
import { ExportNetZoomEntity } from './netzoom/exportnetzoomentity/ExportNetZoomEntity';
import { ImportNetZoomEntity } from './netzoom/importnetzoomentity/ImportNetZoomEntity';
import { ImportNewTablesAndProperties } from './manageentitytables/importnewtablesandproperties/ImportNewTablesAndProperties';
import { PurgeEntityDataTable } from './manageentitytables/purgeentitydatatable/PurgeEntityDataTable';
import AuthorizeUser from './user/authorizeuser/AuthorizeUser';
import ValidateXlsx from './validatexlsx/validatexlsx/ValidateXlsx';
import AuthorizeTeam from './team/authorizeteam/AuthorizeTeam';
import { ManageUser } from './user/manageuser/ManageUser';
import Help, { Helptip } from '../../../shared/Help';
import AuthorizeTenant from './tenant/authorizetenant/AuthorizeTenant';
import AuthorizeRole from './role/authorizerole/AuthorizeRole';
import ManageRole from './role/managerole/ManageRole';
import { ManageLicense } from './license/ManageLicense';
import { ImportDeviceContainer } from '../../../features/rackandstack/kebabmenu/importdevice/ImportDeviceContainer';
import { ExportDeviceContainer } from '../../../features/rackandstack/kebabmenu/exportdevice/ExportDeviceContainer';
import { AssetAssignment } from './team/AssetAssignment';

const AppqaEntitiesContainer = (appqaEntitiesContainerProps: IAppqaEntitiesContainer) => {
    const [isShowHelptip, setIsShowHelptip] = useState<boolean>(false);
    const [helptipString, setHelptipString] = useState<string>("");
    const [allowToShowHeader, setAllowToShowHeader] = useState<boolean>(true);
    const [isShowConfirmDialog, setIsShowConfirmDialog] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isShowOkOnly, setIsShowOkOnly] = useState<boolean>(false);
    const [keyRefresh, setKeyRefresh] = useState<number>(0);
    const [isRefresh, setIsRefresh] = useState<boolean>(false);

    const appqaSettingsContext = useAppqaSettingsVarContext();
    const helpTipsContext = useHelpTipContext();
    const statusBarContext = useStatusBarContext();

    const getHelpTips = (name: string) => {
        const normalizedName = name?.toLowerCase().replace(/\s+/g, "_");
        return helpTipsContext.helpTipRecords.filter((item: IHelpTipProperty) =>
            item.featureid?.toLowerCase().includes(normalizedName)
        );
    }

    useEffect(() => {
        let cancelled = false; // guard to prevent stale async updates

        const run = () => {
            const feature = appqaEntitiesContainerProps.selectedFeatureItem;
            if (!feature) {
                setIsShowHelptip(false);
                return;
            }

            if (feature.NodeType?.toLowerCase() === "helptip" || feature.NodeType?.toLowerCase() === "subhelptip") {
                const data: IHelpTipProperty[] = getHelpTips(feature._Feature?.toString() ?? "");
                if (!cancelled) {
                    if (data.length) {
                        setHelptipString(data[0].tip);
                    } else {
                        setHelptipString(`SC- Need helptip for ${feature._Feature?.toString()}`);
                    }
                    setIsShowHelptip(true);
                }
            } else {
                if (feature.parentName && feature.Label) {
                    let data: IHelpTipProperty[] = getHelpTips(feature._Feature?.toString() ?? "");
                    if (!cancelled) {
                        if (data.length) {
                            setHelptipString(data[0]?.tip ?? "");
                        } else {
                            setHelptipString(`SC- Need helptip for ${feature._Feature?.toString()}`);
                        }
                    }

                    if (!cancelled) {
                        const entitiesThatHeaderNotRequired = [
                            EntitiesSubGroups.EditDeviceEntityMapping.toString(),
                            EntitiesSubGroups.EditNetZoomEntityMapping.toString(),
                            EntitiesSubGroups.EditCableEntityMapping.toString()
                        ]
                        if (entitiesThatHeaderNotRequired.includes(feature.Label)) {
                            setAllowToShowHeader(false);
                        } else {
                            setAllowToShowHeader(true);
                        }
                    }
                }
                if (!cancelled) setIsShowHelptip(false);
            }
            if (appqaEntitiesContainerProps.selectedFeatureItem.NodeType === "" && appqaEntitiesContainerProps.selectedFeatureItem.subMenu?.length) {
                statusBarContext.setFetchError([`Selected menu(${appqaEntitiesContainerProps.selectedFeatureItem.Label}) does not have NodeType.`]);
            }
        };
        run();

        return () => {
            cancelled = true; // stop old async work
            appqaSettingsContext?.setIsFormValid(undefined);
        };
    }, [
        appqaEntitiesContainerProps.selectedFeatureItem
    ]);

    const handleShowUserMessage = (messageText: string) => {
        setIsShowOkOnly(true);
        setConfirmMessage(messageText)
        setIsShowConfirmDialog(true);
    }

    const resetImageData: IImage = {
        source: <Refresh24x24
            size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Refesh",
        uniqueName: 'user-profile-ireset',
        type: 'svg'
    }


    return (
        <div key={appqaEntitiesContainerProps.uniqueName} className='nz-w-100 nz-h-100 nz-setting-component-container'>
            {appqaEntitiesContainerProps.selectedFeatureItem.NodeType === "SubHelpTip" && helptipString
                && <div className='nz-w-100 nz-h-100 nz-d-flex-column'>
                    <Help uniqueName={`${appqaEntitiesContainerProps.uniqueName}-helptip`}
                        featureId={appqaEntitiesContainerProps.featureId} />
                </div>}
            {!isShowHelptip && appqaEntitiesContainerProps.selectedFeatureItem && <div className='nz-w-100 nz-h-100 nz-d-flex-column'>
                {allowToShowHeader &&
                    <div className='nz-sub-header'>
                        <Label uniqueName={`${appqaEntitiesContainerProps.uniqueName}-subgroup-header`} label={`${appqaEntitiesContainerProps.selectedFeatureItem.Label}` || ""} />
                        {(appqaEntitiesContainerProps.selectedFeatureItem.Label?.toLowerCase() === EntitiesSubGroups.EditDeviceEntityMapping.toLowerCase()
                            || appqaEntitiesContainerProps.selectedFeatureItem.Label?.toLowerCase() === EntitiesSubGroups.EditCableEntityMapping.toLowerCase()) &&
                            <ActionImage uniqueName={'user-profile-aireset'} image={resetImageData} w={'var(--node_height)'} h={'var(--node_height)'} handleMouse={() => {
                                setKeyRefresh(prev => prev + 1);
                                setIsRefresh(true)
                                setTimeout(() => setIsRefresh(false), 2000);
                            }} actionCode={'reset'} />
                        }
                    </div>}
                {helptipString && allowToShowHeader &&
                    <Helptip uniqueName={`${appqaEntitiesContainerProps.uniqueName}-helptip`}
                        mdString={helptipString} />
                }
                {!appqaEntitiesContainerProps.selectedFeatureItem.subMenu ? <div className='nz-setting-subgroup-container'>
                    {(() => {
                        switch (appqaEntitiesContainerProps.selectedFeatureItem.Label?.toLowerCase()) {

                            // /*Cloud Provider*/ 
                            case EntitiesSubGroups.ManageCloudProvider.toLowerCase():
                                return (<ManagePartners selectedSubGroup={appqaEntitiesContainerProps.selectedFeatureItem.Label} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-cloude-providers`} statusbarContext={statusBarContext} entityName={EntityNameEnums.Partner} relationship='Cloud Provider' />);
                                {/*Datacenter Hierarchy */ }
                            case EntitiesSubGroups.DataCenterHierarchy.toLowerCase():
                                return (<DataCenterHierarchy uniqueName={`${appqaEntitiesContainerProps.uniqueName}-data-center-hierarchy`} selectedFeatureItem={appqaEntitiesContainerProps.selectedFeatureItem} featureId={appqaEntitiesContainerProps.featureId} handleShowUserMessage={handleShowUserMessage} />);
                            case EntitiesSubGroups.InventoryStoreAndBins.toLowerCase():
                                return (<InventoryStoreAndBins uniqueName={`${appqaEntitiesContainerProps.uniqueName}-inventory-hierarchy`} selectedFeatureItem={appqaEntitiesContainerProps.selectedFeatureItem} featureId={appqaEntitiesContainerProps.featureId} handleShowUserMessage={handleShowUserMessage} />);
                                {/* Device */ }
                            case EntitiesSubGroups.EditDeviceEntityMapping.toLowerCase():
                                return (<EditDeviceEntityMapping helptipString={helptipString} selectedFeatureItem={appqaEntitiesContainerProps.selectedFeatureItem} group={EntitesGroups.DeviceEntity} subGroup={EntitiesSubGroups.EditDeviceEntityMapping} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-edit-device-entities`} featureId={appqaEntitiesContainerProps.featureId} isRefresh={isRefresh} key={keyRefresh} />);
                            case EntitiesSubGroups.ImportDeviceEntity.toLowerCase():
                                return (<ImportDeviceContainer uniqueName={appqaEntitiesContainerProps.uniqueName} featureId={appqaEntitiesContainerProps.featureId} entityName={undefined} />)
                            case EntitiesSubGroups.ExportDeviceEntity.toLowerCase():
                                return (<ExportDeviceContainer uniqueName={appqaEntitiesContainerProps.uniqueName} featureId={appqaEntitiesContainerProps.featureId} />)

                                {/*Manage Entity Tables */ }
                            case EntitiesSubGroups.ImportNewTablesAndProperties.toLowerCase():
                                return (<ImportNewTablesAndProperties uniqueName={`${appqaEntitiesContainerProps.uniqueName}-create-new-tables-and-properties`} headerText={EntitiesSubGroups.ImportNewTablesAndProperties} featureId={appqaEntitiesContainerProps.featureId} />);
                            case EntitiesSubGroups.PurgeEntityDataTable.toLowerCase():
                                return (<PurgeEntityDataTable uniqueName={`${appqaEntitiesContainerProps.uniqueName}-purge-entity-data`} featureId={appqaEntitiesContainerProps.featureId} />);
                                {/*NetZoom */ }
                            case EntitiesSubGroups.EditNetZoomEntityMapping.toLowerCase():
                                return (<EditNetZoomEntityMapping helptipString={helptipString} selectedFeatureItem={appqaEntitiesContainerProps.selectedFeatureItem} group={EntitesGroups.NetZoomEntity} subGroup={EntitiesSubGroups.EditNetZoomEntityMapping} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-edit-netzoom-entities`} featureId={appqaEntitiesContainerProps.featureId} />);
                            case EntitiesSubGroups.ExportNetZoomEntity.toLowerCase():
                                return (
                                    <ExportNetZoomEntity uniqueName={`${appqaEntitiesContainerProps.uniqueName}-export-netzoom-entities`}
                                        featureId={appqaEntitiesContainerProps.featureId}
                                    />
                                );
                            case EntitiesSubGroups.ImportNetZoomEntity.toLowerCase():
                                return (<ImportNetZoomEntity selectedFeatureItem={appqaEntitiesContainerProps.selectedFeatureItem} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-import-netzoom-entities`} featureId={appqaEntitiesContainerProps.featureId} />);
                                {/*Role */ }
                            case EntitiesSubGroups.ManageRole.toLowerCase():
                                return (<ManageRole uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-roles`} featureId={appqaEntitiesContainerProps.featureId} handleShowUserMessage={handleShowUserMessage} />);
                            case EntitiesSubGroups.AuthorizeRole.toLowerCase():
                                return (<AuthorizeRole uniqueName={`${appqaEntitiesContainerProps.uniqueName}-role`} featureId={appqaEntitiesContainerProps.featureId} />)

                                {/*Tag */ }
                            case EntitiesSubGroups.ManageTag.toLowerCase():
                                return (<ManagePartners selectedSubGroup={appqaEntitiesContainerProps.selectedFeatureItem.Label} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-tags`} statusbarContext={statusBarContext} entityName={EntityNameEnums.Partner} relationship='Tag' />);
                                {/*Team */ }
                            case EntitiesSubGroups.ManageTeam.toLowerCase():
                                return (<ManagePartners selectedSubGroup={appqaEntitiesContainerProps.selectedFeatureItem.Label} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-teams`} statusbarContext={statusBarContext} entityName={EntityNameEnums.Partner} relationship='Team' />);
                            case EntitiesSubGroups.AuthorizeTeam.toLowerCase():
                                return (<AuthorizeTeam uniqueName={`${appqaEntitiesContainerProps.uniqueName}-user`} featureId={appqaEntitiesContainerProps.featureId} />)
                            case EntitiesSubGroups.AssetAssignment.toLowerCase(): {
                                const parentName = (
                                    appqaEntitiesContainerProps.selectedFeatureItem?.parentName ??
                                    appqaEntitiesContainerProps.selectedFeatureItem?.ParentName ??
                                    ''
                                ).toLowerCase().trim();

                                const assignmentType: 'tag' | 'team' | 'tenant' | 'vendor' =
                                    parentName === 'tenant'
                                        ? 'tenant'
                                        : parentName === 'vendor'
                                            ? 'vendor'
                                            : 'team';

                                return (
                                    <AssetAssignment
                                        key={`${appqaEntitiesContainerProps.uniqueName}-${assignmentType}`}
                                        uniqueName={appqaEntitiesContainerProps.uniqueName}
                                        assignmentType={assignmentType}
                                        selectedFeatureItem={appqaEntitiesContainerProps.selectedFeatureItem}
                                        handleShowUserMessage={handleShowUserMessage}
                                    />
                                );
                            }
                                {/*Tenant */ }
                            case EntitiesSubGroups.ManageTenant.toLowerCase():
                                return (<ManagePartners selectedSubGroup={appqaEntitiesContainerProps.selectedFeatureItem.Label} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-tenants`} statusbarContext={statusBarContext} entityName={EntityNameEnums.Partner} relationship='Tenant' />);
                            case EntitiesSubGroups.AuthorizeTenant.toLowerCase():
                                return (<AuthorizeTenant uniqueName={`${appqaEntitiesContainerProps.uniqueName}-user`} featureId={appqaEntitiesContainerProps.featureId} />)

                                {/*User */ }
                            case EntitiesSubGroups.ManageUser.toLowerCase():
                                return (<ManageUser uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-user`} entityName={EntityNameEnums.User} pgTableName='PG.Contact' pgTableLabel='Contact Details' handleShowUserMessage={handleShowUserMessage} />);
                            case EntitiesSubGroups.AuthorizeUser.toLowerCase():
                                return (<AuthorizeUser uniqueName={`${appqaEntitiesContainerProps.uniqueName}-user`} featureId={appqaEntitiesContainerProps.featureId} />)

                                {/*Validate Xlsx */ }
                            case EntitiesSubGroups.ValidateXlsx.toLowerCase():
                                return (<ValidateXlsx uniqueName={`${appqaEntitiesContainerProps.uniqueName}-xlsx-container`} handleShowUserMessage={handleShowUserMessage} />);
                                {/*Vendor */ }
                            case EntitiesSubGroups.ManageVendor.toLowerCase():
                                return (<ManagePartners selectedSubGroup={appqaEntitiesContainerProps.selectedFeatureItem.Label} uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-vendors`} statusbarContext={statusBarContext} entityName={EntityNameEnums.Partner} relationship='Vendor' />);
                                {/*License */ }
                            case EntitiesSubGroups.ManageLicense.toLowerCase():
                                return (<ManageLicense uniqueName={`${appqaEntitiesContainerProps.uniqueName}-manage-license`} entityName={EntityNameEnums.NZLicenseKey} handleShowUserMessage={handleShowUserMessage} />);
                            default:
                                return null;
                        }
                    })()}
                </div> : <></>}
            </div >}
            <YesNoFormContainer uniqueName={`${appqaEntitiesContainerProps.uniqueName}-confirm`}
                isOpen={isShowConfirmDialog}
                message={confirmMessage}
                showOkButton={isShowOkOnly}
                handleOkButtonClick={() => {
                    setIsShowConfirmDialog(false);
                }} />
        </div >
    )
}
export { AppqaEntitiesContainer }



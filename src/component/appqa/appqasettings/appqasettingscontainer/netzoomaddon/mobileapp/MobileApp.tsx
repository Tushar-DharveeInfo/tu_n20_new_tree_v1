
import { IMobileApp } from '../../../../allinterface/iappqasettingscontainer/netzoomaddon/IMobileApp'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const MobileApp = (mobileAppOptionsProps: IMobileApp) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (mobileAppOptionsProps.handleSaveAction) {
            mobileAppOptionsProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={mobileAppOptionsProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${mobileAppOptionsProps.uniqueName}-form-container`}
                formControls={mobileAppOptionsProps.formControls}
                allowActionList={mobileAppOptionsProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={mobileAppOptionsProps.profileItems}
                allowAdd={mobileAppOptionsProps.allowAdd}
                allowDelete={mobileAppOptionsProps.allowDelete}
                featureId={mobileAppOptionsProps.featureId}
                group={mobileAppOptionsProps.group}
                subGroup={mobileAppOptionsProps.subGroup}
                subFeatureId={mobileAppOptionsProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={mobileAppOptionsProps.handleValueChange}
                isAutoSave={mobileAppOptionsProps.isAutoSave}
                profileString={mobileAppOptionsProps.profileString}
                id={mobileAppOptionsProps.id}
            />
        </div>
    )
}
export { MobileApp }
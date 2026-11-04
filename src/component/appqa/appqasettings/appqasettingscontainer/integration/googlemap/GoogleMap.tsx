
import { IGoogleMap } from '../../../../allinterface/iappqasettingscontainer/integration/IGoogleMap'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const GoogleMap = (googleMapProps: IGoogleMap) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (googleMapProps.handleSaveAction) {
            googleMapProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (googleMapProps.handleValueChange) {
            googleMapProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={googleMapProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${googleMapProps.uniqueName}-form-container`}
                formControls={googleMapProps.formControls}
                allowActionList={googleMapProps.allowActionList}
                allowShowHeader={false}
                headerText={!googleMapProps.allowActionList ? `${googleMapProps.id ? "Edit " : "Add "}${googleMapProps.selectedProfileItem?.label ?? googleMapProps.subGroup}` : undefined}
                actionLabelItems={googleMapProps.profileItems}
                selectedActionLabelItem={googleMapProps.selectedProfileItem}
                allowAdd={googleMapProps.allowAdd}
                allowDelete={googleMapProps.allowDelete}
                featureId={googleMapProps.featureId}
                group={googleMapProps.group}
                subGroup={googleMapProps.subGroup}
                subFeatureId={googleMapProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={googleMapProps.isAutoSave}
                profileString={googleMapProps.profileString}
                id={googleMapProps.id}
                handleActionImageClick={googleMapProps.handleActionImageClick}
            />
        </div>
    )
}

export { GoogleMap }


import { IConfigure } from '../../../../allinterface/iappqasettingscontainer/adminconfiguration/IConfigure'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const Configure = (customizationProps: IConfigure) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (customizationProps.handleSaveAction) {
            customizationProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    return (
        <div key={customizationProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${customizationProps.uniqueName}-form-container`}
                formControls={customizationProps.formControls}
                allowActionList={customizationProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={customizationProps.profileItems}
                allowAdd={customizationProps.allowAdd}
                allowDelete={customizationProps.allowDelete}
                featureId={customizationProps.featureId}
                group={customizationProps.group}
                subGroup={customizationProps.subGroup}
                subFeatureId={customizationProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={customizationProps.handleValueChange}
                isAutoSave={customizationProps.isAutoSave}
                isAddressFormRequired={false}
                profileString={customizationProps.profileString}
                id={customizationProps.id}
            />
        </div>
    )
}
export { Configure }
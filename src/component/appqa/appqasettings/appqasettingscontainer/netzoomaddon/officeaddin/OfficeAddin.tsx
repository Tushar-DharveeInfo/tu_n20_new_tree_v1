
import { IOfficeAddin } from '../../../../allinterface/iappqasettingscontainer/netzoomaddon/IOfficeAddin'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const OfficeAddin = (officeAddinFiltersProps: IOfficeAddin) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (officeAddinFiltersProps.handleSaveAction) {
            officeAddinFiltersProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={officeAddinFiltersProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${officeAddinFiltersProps.uniqueName}-form-container`}
                formControls={officeAddinFiltersProps.formControls}
                allowActionList={officeAddinFiltersProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={officeAddinFiltersProps.profileItems}
                allowAdd={officeAddinFiltersProps.allowAdd}
                allowDelete={officeAddinFiltersProps.allowDelete}
                featureId={officeAddinFiltersProps.featureId}
                group={officeAddinFiltersProps.group}
                subGroup={officeAddinFiltersProps.subGroup}
                subFeatureId={officeAddinFiltersProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={officeAddinFiltersProps.handleValueChange}
                isAutoSave={officeAddinFiltersProps.isAutoSave}
                profileString={officeAddinFiltersProps.profileString}
                id={officeAddinFiltersProps.id}

            />
        </div>
    )
}
export { OfficeAddin }
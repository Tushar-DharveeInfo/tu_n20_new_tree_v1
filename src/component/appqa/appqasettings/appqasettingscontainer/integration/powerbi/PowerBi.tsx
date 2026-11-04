
import { IPowerBi } from '../../../../allinterface/iappqasettingscontainer/integration/IPowerBi'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const PowerBi = (powerBiProps: IPowerBi) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (powerBiProps.handleSaveAction) {
            powerBiProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (powerBiProps.handleValueChange) {
            powerBiProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={powerBiProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${powerBiProps.uniqueName}-form-container`}
                formControls={powerBiProps.formControls}
                allowActionList={powerBiProps.allowActionList}
                allowShowHeader={false}
                headerText={!powerBiProps.allowActionList ? `${powerBiProps.id ? "Edit " : "Add "}${powerBiProps.selectedProfileItem?.label ?? powerBiProps.subGroup}` : undefined}
                actionLabelItems={powerBiProps.profileItems}
                selectedActionLabelItem={powerBiProps.selectedProfileItem}
                allowAdd={powerBiProps.allowAdd}
                allowDelete={powerBiProps.allowDelete}
                featureId={powerBiProps.featureId}
                group={powerBiProps.group}
                subGroup={powerBiProps.subGroup}
                subFeatureId={powerBiProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={powerBiProps.isAutoSave}
                profileString={powerBiProps.profileString}
                id={powerBiProps.id}
                handleActionImageClick={powerBiProps.handleActionImageClick}
            />
        </div>
    )
}

export { PowerBi }

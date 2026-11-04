
import { ITwilio } from '../../../../allinterface/iappqasettingscontainer/integration/ITwilio'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const Twilio = (twilioProps: ITwilio) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (twilioProps.handleSaveAction) {
            twilioProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (twilioProps.handleValueChange) {
            twilioProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={twilioProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${twilioProps.uniqueName}-form-container`}
                formControls={twilioProps.formControls}
                allowActionList={twilioProps.allowActionList}
                allowShowHeader={false}
                headerText={!twilioProps.allowActionList ? `${twilioProps.id ? "Edit " : "Add "}${twilioProps.selectedProfileItem?.label ?? twilioProps.subGroup}` : undefined}
                actionLabelItems={twilioProps.profileItems}
                selectedActionLabelItem={twilioProps.selectedProfileItem}
                allowAdd={twilioProps.allowAdd}
                allowDelete={twilioProps.allowDelete}
                featureId={twilioProps.featureId}
                group={twilioProps.group}
                subGroup={twilioProps.subGroup}
                subFeatureId={twilioProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={twilioProps.isAutoSave}
                profileString={twilioProps.profileString}
                id={twilioProps.id}
                handleActionImageClick={twilioProps.handleActionImageClick}
            />
        </div>
    )
}

export { Twilio }

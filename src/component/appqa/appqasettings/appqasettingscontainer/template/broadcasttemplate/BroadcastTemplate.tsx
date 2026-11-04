
import { IBroadcastTemplate } from '../../../../allinterface/iappqasettingscontainer/template/IBroadcastTemplate'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const BroadcastTemplate = (broadcastTemplateProps: IBroadcastTemplate) => {
    const minDateValue = new Date();
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (broadcastTemplateProps.handleSaveAction) {
            broadcastTemplateProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (broadcastTemplateProps.handleValueChange) {
            broadcastTemplateProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={broadcastTemplateProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${broadcastTemplateProps.uniqueName}-form-container`}
                formControls={broadcastTemplateProps.formControls}
                allowActionList={broadcastTemplateProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={broadcastTemplateProps.profileItems}
                selectedActionLabelItem={broadcastTemplateProps.selectedProfileItem}
                allowAdd={broadcastTemplateProps.allowAdd}
                allowDelete={broadcastTemplateProps.allowDelete}
                featureId={broadcastTemplateProps.featureId}
                group={broadcastTemplateProps.group}
                subGroup={broadcastTemplateProps.subGroup}
                minDate={minDateValue}
                subFeatureId={broadcastTemplateProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={broadcastTemplateProps.isAutoSave}
                profileString={broadcastTemplateProps.profileString}
                id={broadcastTemplateProps.id}
                handleActionImageClick={broadcastTemplateProps.handleActionImageClick}

            />
        </div>
    )
}

export { BroadcastTemplate }

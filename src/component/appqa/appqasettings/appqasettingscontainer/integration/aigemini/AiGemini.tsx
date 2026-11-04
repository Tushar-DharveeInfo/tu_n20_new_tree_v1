
import { IAiGemini } from '../../../../allinterface/iappqasettingscontainer/integration/IAiGemini'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const AiGemini = (aiGeminiProps: IAiGemini) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (aiGeminiProps.handleSaveAction) {
            aiGeminiProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (aiGeminiProps.handleValueChange) {
            aiGeminiProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={aiGeminiProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${aiGeminiProps.uniqueName}-form-container`}
                formControls={aiGeminiProps.formControls}
                allowActionList={aiGeminiProps.allowActionList}
                allowShowHeader={false}
                headerText={!aiGeminiProps.allowActionList ? `${aiGeminiProps.id ? "Edit " : "Add "}${aiGeminiProps.selectedProfileItem?.label ?? aiGeminiProps.subGroup}` : undefined}
                actionLabelItems={aiGeminiProps.profileItems}
                selectedActionLabelItem={aiGeminiProps.selectedProfileItem}
                allowAdd={aiGeminiProps.allowAdd}
                allowDelete={aiGeminiProps.allowDelete}
                featureId={aiGeminiProps.featureId}
                group={aiGeminiProps.group}
                subGroup={aiGeminiProps.subGroup}
                subFeatureId={aiGeminiProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={aiGeminiProps.isAutoSave}
                profileString={aiGeminiProps.profileString}
                id={aiGeminiProps.id}
                handleActionImageClick={aiGeminiProps.handleActionImageClick}
            />
        </div>
    )
}

export { AiGemini }

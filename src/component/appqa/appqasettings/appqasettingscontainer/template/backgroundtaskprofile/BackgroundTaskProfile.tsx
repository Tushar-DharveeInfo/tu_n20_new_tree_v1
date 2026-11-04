
import { IBackgroundTaskProfile } from '../../../../allinterface/iappqasettingscontainer/template/IBackgroundTaskProfile'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const BackgroundTaskProfile = (backgroundTaskProfileProps: IBackgroundTaskProfile) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (backgroundTaskProfileProps.handleSaveAction) {
            backgroundTaskProfileProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (backgroundTaskProfileProps.handleValueChange) {
            backgroundTaskProfileProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={backgroundTaskProfileProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${backgroundTaskProfileProps.uniqueName}-form-container`}
                formControls={backgroundTaskProfileProps.formControls}
                allowActionList={backgroundTaskProfileProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={backgroundTaskProfileProps.profileItems}
                selectedActionLabelItem={backgroundTaskProfileProps.selectedProfileItem}
                allowAdd={backgroundTaskProfileProps.allowAdd}
                allowDelete={backgroundTaskProfileProps.allowDelete}
                featureId={backgroundTaskProfileProps.featureId}
                group={backgroundTaskProfileProps.group}
                subGroup={backgroundTaskProfileProps.subGroup}
                subFeatureId={backgroundTaskProfileProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                handleActionImageClick={backgroundTaskProfileProps.handleActionImageClick}
                isAutoSave={backgroundTaskProfileProps.isAutoSave}
                profileString={backgroundTaskProfileProps.profileString}
                id={backgroundTaskProfileProps.id}
            />
        </div>
    )
}

export { BackgroundTaskProfile }

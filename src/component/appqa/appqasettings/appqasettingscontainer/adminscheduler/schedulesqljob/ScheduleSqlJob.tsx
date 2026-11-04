
import { IScheduleSqlJob } from '../../../../allinterface/iappqasettingscontainer/adminscheduler/IScheduleSqlJob'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const ScheduleSqlJob = (scheduleSqlJobProps: IScheduleSqlJob) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (scheduleSqlJobProps.handleSaveAction) {
            scheduleSqlJobProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (scheduleSqlJobProps.handleValueChange) {
            scheduleSqlJobProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={scheduleSqlJobProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${scheduleSqlJobProps.uniqueName}-form-container`}
                formControls={scheduleSqlJobProps.formControls}
                allowActionList={scheduleSqlJobProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={scheduleSqlJobProps.profileItems}
                selectedActionLabelItem={scheduleSqlJobProps.selectedProfileItem}
                allowAdd={scheduleSqlJobProps.allowAdd}
                allowDelete={scheduleSqlJobProps.allowDelete}
                featureId={scheduleSqlJobProps.featureId}
                group={scheduleSqlJobProps.group}
                subGroup={scheduleSqlJobProps.subGroup}
                subFeatureId={scheduleSqlJobProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={scheduleSqlJobProps.isAutoSave}
                profileString={scheduleSqlJobProps.profileString}
                id={scheduleSqlJobProps.id}
                handleActionImageClick={scheduleSqlJobProps.handleActionImageClick}
            />
        </div>
    )
}

export { ScheduleSqlJob }


import { IScheduleWindowsService } from '../../../../allinterface/iappqasettingscontainer/adminscheduler/IScheduleWindowsService'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const ScheduleWindowsService = (scheduleWindowsServiceProps: IScheduleWindowsService) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (scheduleWindowsServiceProps.handleSaveAction) {
            scheduleWindowsServiceProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={scheduleWindowsServiceProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${scheduleWindowsServiceProps.uniqueName}-form-container`}
                formControls={scheduleWindowsServiceProps.formControls}
                allowActionList={scheduleWindowsServiceProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={scheduleWindowsServiceProps.profileItems}
                allowAdd={scheduleWindowsServiceProps.allowAdd}
                allowDelete={scheduleWindowsServiceProps.allowDelete}
                featureId={scheduleWindowsServiceProps.featureId}
                group={scheduleWindowsServiceProps.group}
                subGroup={scheduleWindowsServiceProps.subGroup}
                subFeatureId={scheduleWindowsServiceProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={scheduleWindowsServiceProps.handleValueChange}
                isAutoSave={scheduleWindowsServiceProps.isAutoSave}
                profileString={scheduleWindowsServiceProps.profileString}
                id={scheduleWindowsServiceProps.id}
            />
        </div>
    )
}
export { ScheduleWindowsService }
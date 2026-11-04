
import { IScheduleDataArchive } from '../../../../allinterface/iappqasettingscontainer/adminscheduler/IScheduleDataArchive'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const ScheduleDataArchive = (archivePlanProps: IScheduleDataArchive) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (archivePlanProps.handleSaveAction) {
            archivePlanProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={archivePlanProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${archivePlanProps.uniqueName}-form-container`}
                formControls={archivePlanProps.formControls}
                allowActionList={archivePlanProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={archivePlanProps.profileItems}
                allowAdd={archivePlanProps.allowAdd}
                allowDelete={archivePlanProps.allowDelete}
                featureId={archivePlanProps.featureId}
                group={archivePlanProps.group}
                subGroup={archivePlanProps.subGroup}
                subFeatureId={archivePlanProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={archivePlanProps.handleValueChange}
                isAutoSave={archivePlanProps.isAutoSave}
                profileString={archivePlanProps.profileString}
                id={archivePlanProps.id}
            />
        </div>
    )
}
export { ScheduleDataArchive }
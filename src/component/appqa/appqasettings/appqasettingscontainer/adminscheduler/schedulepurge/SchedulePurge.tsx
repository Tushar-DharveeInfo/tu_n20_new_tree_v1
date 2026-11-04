
import { ISchedulePurge } from '../../../../allinterface/iappqasettingscontainer/adminscheduler/ISchedulePurge'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const SchedulePurge = (purgePlanProps: ISchedulePurge) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (purgePlanProps.handleSaveAction) {
            purgePlanProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={purgePlanProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${purgePlanProps.uniqueName}-form-container`}
                formControls={purgePlanProps.formControls}
                allowActionList={purgePlanProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={purgePlanProps.profileItems}
                allowAdd={purgePlanProps.allowAdd}
                allowDelete={purgePlanProps.allowDelete}
                featureId={purgePlanProps.featureId}
                group={purgePlanProps.group}
                subGroup={purgePlanProps.subGroup}
                subFeatureId={purgePlanProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={purgePlanProps.handleValueChange}
                isAutoSave={purgePlanProps.isAutoSave}
                profileString={purgePlanProps.profileString}
                id={purgePlanProps.id}
            />
        </div>
    )
}
export { SchedulePurge }
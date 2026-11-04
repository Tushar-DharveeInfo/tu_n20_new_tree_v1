
import { ISelectPredefinedEventsAndAlerts } from '../../../allinterface/power/ISelectPredefinedEventsAndAlerts';
import { SettingsContainer } from "../../../../shared/settingsform/settingscontainer/SettingsContainer";

const SelectPredefinedEventsAndAlerts = (selectPredefinedEventsAndAlertsprops: ISelectPredefinedEventsAndAlerts) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (selectPredefinedEventsAndAlertsprops.handleSaveAction) {
            selectPredefinedEventsAndAlertsprops.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={selectPredefinedEventsAndAlertsprops.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${selectPredefinedEventsAndAlertsprops.uniqueName}-form-container`}
                formControls={selectPredefinedEventsAndAlertsprops.formControls}
                allowActionList={selectPredefinedEventsAndAlertsprops.allowActionList}
                allowShowHeader={false}
                actionLabelItems={selectPredefinedEventsAndAlertsprops.profileItems}
                allowAdd={selectPredefinedEventsAndAlertsprops.allowAdd}
                allowDelete={selectPredefinedEventsAndAlertsprops.allowDelete}
                featureId={selectPredefinedEventsAndAlertsprops.featureId}
                subFeatureId={selectPredefinedEventsAndAlertsprops.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={selectPredefinedEventsAndAlertsprops.handleValueChange}
                isAutoSave={selectPredefinedEventsAndAlertsprops.isAutoSave}
                profileString={selectPredefinedEventsAndAlertsprops.profileString}
                id={selectPredefinedEventsAndAlertsprops.id}
            />
        </div>
    )
}

export { SelectPredefinedEventsAndAlerts }

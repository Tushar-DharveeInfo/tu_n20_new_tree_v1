
import { ISelectDeviceEventsAndAlerts } from '../../../allinterface/power/ISelectDeviceEventsAndAlerts';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const SelectDeviceEventsAndAlerts = (selectDeviceEventsAndAlertsProps: ISelectDeviceEventsAndAlerts) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (selectDeviceEventsAndAlertsProps.handleSaveAction) {
            selectDeviceEventsAndAlertsProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (selectDeviceEventsAndAlertsProps.handleValueChange) {
            selectDeviceEventsAndAlertsProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={selectDeviceEventsAndAlertsProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${selectDeviceEventsAndAlertsProps.uniqueName}-form-container`}
                formControls={selectDeviceEventsAndAlertsProps.formControls}
                allowActionList={selectDeviceEventsAndAlertsProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={selectDeviceEventsAndAlertsProps.profileItems}
                selectedActionLabelItem={selectDeviceEventsAndAlertsProps.selectedProfileItem}
                allowAdd={selectDeviceEventsAndAlertsProps.allowAdd}
                allowDelete={selectDeviceEventsAndAlertsProps.allowDelete}
                featureId={selectDeviceEventsAndAlertsProps.featureId}
                subFeatureId={selectDeviceEventsAndAlertsProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={selectDeviceEventsAndAlertsProps.isAutoSave}
                profileString={selectDeviceEventsAndAlertsProps.profileString}
                id={selectDeviceEventsAndAlertsProps.id}
                handleActionImageClick={selectDeviceEventsAndAlertsProps.handleActionImageClick}
            />
        </div>
    )
}

export { SelectDeviceEventsAndAlerts }


import { IDeviceHealth } from "../../../allinterface/power/IDeviceHealth";
import { SettingsContainer } from "../../../../shared/settingsform/settingscontainer/SettingsContainer";

const DeviceHealth = (devicehealthprops: IDeviceHealth) => {

    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (devicehealthprops.handleSaveAction) {
            devicehealthprops.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={devicehealthprops.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${devicehealthprops.uniqueName}-form-container`}
                formControls={devicehealthprops.formControls}
                allowActionList={devicehealthprops.allowActionList}
                allowShowHeader={false}
                actionLabelItems={devicehealthprops.profileItems}
                allowAdd={devicehealthprops.allowAdd}
                allowDelete={devicehealthprops.allowDelete}
                featureId={devicehealthprops.featureId}
                subFeatureId={devicehealthprops.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={devicehealthprops.handleValueChange}
                isAutoSave={devicehealthprops.isAutoSave}
                profileString={devicehealthprops.profileString}
                id={devicehealthprops.id}
            />
        </div>
    )
}

export { DeviceHealth }

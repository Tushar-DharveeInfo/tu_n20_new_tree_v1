
import { IServiceNow } from '../../../../allinterface/iappqasettingscontainer/integration/IServiceNow'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const ServiceNow = (serviceNowProps: IServiceNow) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (serviceNowProps.handleSaveAction) {
            serviceNowProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (serviceNowProps.handleValueChange) {
            serviceNowProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={serviceNowProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${serviceNowProps.uniqueName}-form-container`}
                formControls={serviceNowProps.formControls}
                allowActionList={serviceNowProps.allowActionList}
                allowShowHeader={false}
                headerText={!serviceNowProps.allowActionList ? `${serviceNowProps.id ? "Edit " : "Add "}${serviceNowProps.selectedProfileItem?.label ?? serviceNowProps.subGroup}` : undefined}
                actionLabelItems={serviceNowProps.profileItems}
                selectedActionLabelItem={serviceNowProps.selectedProfileItem}
                allowAdd={serviceNowProps.allowAdd}
                allowDelete={serviceNowProps.allowDelete}
                featureId={serviceNowProps.featureId}
                group={serviceNowProps.group}
                subGroup={serviceNowProps.subGroup}
                subFeatureId={serviceNowProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={serviceNowProps.isAutoSave}
                profileString={serviceNowProps.profileString}
                id={serviceNowProps.id}
                handleActionImageClick={serviceNowProps.handleActionImageClick}
            />
        </div>
    )
}

export { ServiceNow }

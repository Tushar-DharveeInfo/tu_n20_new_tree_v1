
import { IServiceCharges } from '../../../../allinterface/iappqasettingscontainer/adminconfiguration/IServiceCharges'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const ServiceCharges = (serviceRateProps: IServiceCharges) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (serviceRateProps.handleSaveAction) {
            serviceRateProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={serviceRateProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${serviceRateProps.uniqueName}-form-container`}
                formControls={serviceRateProps.formControls}
                allowActionList={serviceRateProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={serviceRateProps.profileItems}
                allowAdd={serviceRateProps.allowAdd}
                allowDelete={serviceRateProps.allowDelete}
                featureId={serviceRateProps.featureId}
                group={serviceRateProps.group}
                subGroup={serviceRateProps.subGroup}
                subFeatureId={serviceRateProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={serviceRateProps.handleValueChange}
                isAutoSave={serviceRateProps.isAutoSave}
                profileString={serviceRateProps.profileString}
                id={serviceRateProps.id}
            />
        </div>
    )
}
export { ServiceCharges }
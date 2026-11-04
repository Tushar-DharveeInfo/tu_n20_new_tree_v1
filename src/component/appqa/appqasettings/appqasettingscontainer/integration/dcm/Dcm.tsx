
import { IDcm } from '../../../../allinterface/iappqasettingscontainer/integration/IDcm'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const Dcm = (dcmProps: IDcm) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (dcmProps.handleSaveAction) {
            dcmProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (dcmProps.handleValueChange) {
            dcmProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={dcmProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${dcmProps.uniqueName}-form-container`}
                formControls={dcmProps.formControls}
                allowActionList={dcmProps.allowActionList}
                allowShowHeader={false}
                headerText={!dcmProps.allowActionList ? `${dcmProps.id ? "Edit " : "Add "}${dcmProps.selectedProfileItem?.label ?? dcmProps.subGroup}` : undefined}
                actionLabelItems={dcmProps.profileItems}
                selectedActionLabelItem={dcmProps.selectedProfileItem}
                allowAdd={dcmProps.allowAdd}
                allowDelete={dcmProps.allowDelete}
                featureId={dcmProps.featureId}
                group={dcmProps.group}
                subGroup={dcmProps.subGroup}
                subFeatureId={dcmProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={dcmProps.isAutoSave}
                profileString={dcmProps.profileString}
                id={dcmProps.id}
                handleActionImageClick={dcmProps.handleActionImageClick}
            />
        </div>
    )
}

export { Dcm }

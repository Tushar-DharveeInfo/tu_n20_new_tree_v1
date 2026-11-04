
import { IWatermarkTemplate } from '../../../../allinterface/iappqasettingscontainer/template/IWatermarkTemplate'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const WatermarkTemplate = (watermarkTemplateProps: IWatermarkTemplate) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (watermarkTemplateProps.handleSaveAction) {
            watermarkTemplateProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (watermarkTemplateProps.handleValueChange) {
            watermarkTemplateProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={watermarkTemplateProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${watermarkTemplateProps.uniqueName}-form-container`}
                formControls={watermarkTemplateProps.formControls}
                allowActionList={watermarkTemplateProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={watermarkTemplateProps.profileItems}
                selectedActionLabelItem={watermarkTemplateProps.selectedProfileItem}
                allowAdd={watermarkTemplateProps.allowAdd}
                allowDelete={watermarkTemplateProps.allowDelete}
                featureId={watermarkTemplateProps.featureId}
                group={watermarkTemplateProps.group}
                subGroup={watermarkTemplateProps.subGroup}
                subFeatureId={watermarkTemplateProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={watermarkTemplateProps.isAutoSave}
                profileString={watermarkTemplateProps.profileString}
                id={watermarkTemplateProps.id}
                handleActionImageClick={watermarkTemplateProps.handleActionImageClick}
            />
        </div>
    )
}

export { WatermarkTemplate }

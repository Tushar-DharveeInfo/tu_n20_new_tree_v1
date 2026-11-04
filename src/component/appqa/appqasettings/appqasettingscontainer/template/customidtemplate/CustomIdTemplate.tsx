
import { ICustomIdTemplate } from '../../../../allinterface/iappqasettingscontainer/template/ICustomIdTemplate'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const CustomIdTemplate = (customIdTemplateProps: ICustomIdTemplate) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (customIdTemplateProps.handleSaveAction) {
            customIdTemplateProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (customIdTemplateProps.handleValueChange) {
            customIdTemplateProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={customIdTemplateProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${customIdTemplateProps.uniqueName}-form-container`}
                formControls={customIdTemplateProps.formControls}
                allowActionList={customIdTemplateProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={customIdTemplateProps.profileItems}
                allowAdd={customIdTemplateProps.allowAdd}
                allowDelete={customIdTemplateProps.allowDelete}
                featureId={customIdTemplateProps.featureId}
                group={customIdTemplateProps.group}
                subGroup={customIdTemplateProps.subGroup}
                subFeatureId={customIdTemplateProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={customIdTemplateProps.isAutoSave}
                profileString={customIdTemplateProps.profileString}
                id={customIdTemplateProps.id}
                handleActionImageClick={customIdTemplateProps.handleActionImageClick}

            />
        </div>
    )
}

export { CustomIdTemplate }


import { IInformation } from '../../../../allinterface/iappqasettingscontainer/aboutnetzoom/IInformation'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const Information = (productInformationProps: IInformation) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (productInformationProps.handleSaveAction) {
            productInformationProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={productInformationProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${productInformationProps.uniqueName}-form-container`}
                formControls={productInformationProps.formControls}
                allowActionList={productInformationProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={productInformationProps.profileItems}
                allowAdd={productInformationProps.allowAdd}
                allowDelete={productInformationProps.allowDelete}
                featureId={productInformationProps.featureId}
                group={productInformationProps.group}
                subGroup={productInformationProps.subGroup}
                subFeatureId={productInformationProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={productInformationProps.handleValueChange}
                isAutoSave={productInformationProps.isAutoSave}
                profileString={productInformationProps.profileString}
                id={productInformationProps.id}
            />
        </div>
    )
}
export { Information }
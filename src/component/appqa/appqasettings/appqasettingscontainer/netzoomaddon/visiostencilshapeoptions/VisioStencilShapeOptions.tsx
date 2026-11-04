
import { IVisioStencilShapeOptions } from '../../../../allinterface/iappqasettingscontainer/netzoomaddon/IVisioStencilShapeOptions'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const VisioStencilShapeOptions = (visioStencilShapeOptionsProps: IVisioStencilShapeOptions) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (visioStencilShapeOptionsProps.handleSaveAction) {
            visioStencilShapeOptionsProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={visioStencilShapeOptionsProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${visioStencilShapeOptionsProps.uniqueName}-form-container`}
                formControls={visioStencilShapeOptionsProps.formControls}
                allowActionList={visioStencilShapeOptionsProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={visioStencilShapeOptionsProps.profileItems}
                allowAdd={visioStencilShapeOptionsProps.allowAdd}
                allowDelete={visioStencilShapeOptionsProps.allowDelete}
                featureId={visioStencilShapeOptionsProps.featureId}
                group={visioStencilShapeOptionsProps.group}
                subGroup={visioStencilShapeOptionsProps.subGroup}
                subFeatureId={visioStencilShapeOptionsProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={visioStencilShapeOptionsProps.handleValueChange}
                isAutoSave={visioStencilShapeOptionsProps.isAutoSave}
                profileString={visioStencilShapeOptionsProps.profileString}
                id={visioStencilShapeOptionsProps.id}

            />
        </div>
    )
}
export { VisioStencilShapeOptions }
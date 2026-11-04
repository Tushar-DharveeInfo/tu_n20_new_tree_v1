
import { ISetDcmInstanceAndItsCredentials } from '../../../allinterface/power/ISetDcmInstanceAndItsCredentials';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const SetDcmInstanceAndItsCredentials = (setDcmInstanceAndItsCredentialsProps: ISetDcmInstanceAndItsCredentials) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (setDcmInstanceAndItsCredentialsProps.handleSaveAction) {
            setDcmInstanceAndItsCredentialsProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={setDcmInstanceAndItsCredentialsProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${setDcmInstanceAndItsCredentialsProps.uniqueName}-form-container`}
                formControls={setDcmInstanceAndItsCredentialsProps.formControls}
                allowActionList={setDcmInstanceAndItsCredentialsProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={setDcmInstanceAndItsCredentialsProps.profileItems}
                selectedActionLabelItem={setDcmInstanceAndItsCredentialsProps.selectedProfileItem}
                allowAdd={setDcmInstanceAndItsCredentialsProps.allowAdd}
                allowDelete={setDcmInstanceAndItsCredentialsProps.allowDelete}
                featureId={setDcmInstanceAndItsCredentialsProps.featureId}
                subFeatureId={setDcmInstanceAndItsCredentialsProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={setDcmInstanceAndItsCredentialsProps.handleValueChange}
                isAutoSave={setDcmInstanceAndItsCredentialsProps.isAutoSave}
                profileString={setDcmInstanceAndItsCredentialsProps.profileString}
                id={setDcmInstanceAndItsCredentialsProps.id}
                handleActionImageClick={setDcmInstanceAndItsCredentialsProps.handleActionImageClick}
            />
        </div>
    )
}

export { SetDcmInstanceAndItsCredentials }

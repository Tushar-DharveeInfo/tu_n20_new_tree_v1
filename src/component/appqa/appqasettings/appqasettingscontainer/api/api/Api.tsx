
import { IApi } from '../../../../allinterface/iappqasettingscontainer/api/IApi'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const Api = (apiProps: IApi) => {
    const handleSaveAction = (profileData: string, id?: string | undefined, isSilent?: boolean) => {
        if (apiProps.handleSaveAction) {
            apiProps.handleSaveAction(profileData, id, isSilent);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }


    return (
        <div key={apiProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>
            <SettingsContainer
                uniqueName={`${apiProps.uniqueName}-form-container`}
                formControls={apiProps.formControls}
                allowActionList={apiProps.allowActionList}
                allowShowHeader={true}
                actionLabelItems={apiProps.profileItems}
                selectedActionLabelItem={apiProps.selectedProfileItem}
                allowAdd={apiProps.allowAdd}
                allowDelete={apiProps.allowDelete}
                allowTestApi={apiProps.allowTestApi}
                allowPreflight={apiProps.allowPreflight}
                featureId={apiProps.featureId}
                allowFilter={apiProps.allowFilter}
                testApiJson={apiProps.testApiJson}
                group={apiProps.group}
                subGroup={apiProps.subGroup}
                subFeatureId={apiProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={apiProps.handleValueChange}
                isAutoSave={apiProps.isAutoSave}
                profileString={apiProps.profileString}
                id={apiProps.id}
                allowHelp={apiProps.allowHelp}
                allowRecordLabel={apiProps.allowRecordLabel}
                handleActionImageClick={apiProps.handleActionImageClick}
            />
        </div>
    )
}

export { Api }

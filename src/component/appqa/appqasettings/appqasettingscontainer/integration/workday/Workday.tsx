
import { IWorkday } from '../../../../allinterface/iappqasettingscontainer/integration/IWorkday'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const Workday = (workdayProps: IWorkday) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (workdayProps.handleSaveAction) {
            workdayProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (workdayProps.handleValueChange) {
            workdayProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={workdayProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${workdayProps.uniqueName}-form-container`}
                formControls={workdayProps.formControls}
                allowActionList={workdayProps.allowActionList}
                allowShowHeader={false}
                headerText={!workdayProps.allowActionList ? `${workdayProps.id ? "Edit " : "Add "}${workdayProps.selectedProfileItem?.label ?? workdayProps.subGroup}` : undefined}
                actionLabelItems={workdayProps.profileItems}
                selectedActionLabelItem={workdayProps.selectedProfileItem}
                allowAdd={workdayProps.allowAdd}
                allowDelete={workdayProps.allowDelete}
                featureId={workdayProps.featureId}
                group={workdayProps.group}
                subGroup={workdayProps.subGroup}
                subFeatureId={workdayProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={workdayProps.isAutoSave}
                profileString={workdayProps.profileString}
                id={workdayProps.id}
                handleActionImageClick={workdayProps.handleActionImageClick}
            />
        </div>
    )
}

export { Workday }

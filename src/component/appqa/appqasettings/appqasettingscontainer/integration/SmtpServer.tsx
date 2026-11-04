
import { SettingsContainer } from "../../../../shared/settingsform/settingscontainer/SettingsContainer";
import { ISmtpServer } from "../../../allinterface/iappqasettingscontainer/integration/ISmtpServer";

const SmtpServer = (smtpServerProps: ISmtpServer) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (smtpServerProps.handleSaveAction) {
            smtpServerProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (smtpServerProps.handleValueChange) {
            smtpServerProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={smtpServerProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${smtpServerProps.uniqueName}-form-container`}
                formControls={smtpServerProps.formControls}
                allowActionList={smtpServerProps.allowActionList}
                allowShowHeader={false}
                headerText={!smtpServerProps.allowActionList ? `${smtpServerProps.id ? "Edit " : "Add "}${smtpServerProps.selectedProfileItem?.label ?? smtpServerProps.subGroup}` : undefined}
                actionLabelItems={smtpServerProps.profileItems}
                selectedActionLabelItem={smtpServerProps.selectedProfileItem}
                allowAdd={smtpServerProps.allowAdd}
                allowDelete={smtpServerProps.allowDelete}
                featureId={smtpServerProps.featureId}
                group={smtpServerProps.group}
                subGroup={smtpServerProps.subGroup}
                subFeatureId={smtpServerProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={smtpServerProps.isAutoSave}
                profileString={smtpServerProps.profileString}
                id={smtpServerProps.id}
                handleActionImageClick={smtpServerProps.handleActionImageClick}
            />
        </div>
    )
}

export { SmtpServer }

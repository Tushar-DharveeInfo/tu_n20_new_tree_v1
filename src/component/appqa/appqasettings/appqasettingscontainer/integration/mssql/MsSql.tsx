
import { IMsSql } from '../../../../allinterface/iappqasettingscontainer/integration/IMsSql'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const MsSql = (msSqlProps: IMsSql) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (msSqlProps.handleSaveAction) {
            msSqlProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
        if (msSqlProps.handleValueChange) {
            msSqlProps.handleValueChange(value, name, isDefault);
        }
    }
    return (
        <div key={msSqlProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${msSqlProps.uniqueName}-form-container`}
                formControls={msSqlProps.formControls}
                allowActionList={msSqlProps.allowActionList}
                allowShowHeader={false}
                headerText={!msSqlProps.allowActionList ? `${msSqlProps.id ? "Edit " : "Add "}${msSqlProps.selectedProfileItem?.label ?? msSqlProps.subGroup}` : undefined}
                actionLabelItems={msSqlProps.profileItems}
                selectedActionLabelItem={msSqlProps.selectedProfileItem}
                allowAdd={msSqlProps.allowAdd}
                allowDelete={msSqlProps.allowDelete}
                featureId={msSqlProps.featureId}
                group={msSqlProps.group}
                subGroup={msSqlProps.subGroup}
                subFeatureId={msSqlProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={handleValueChange}
                isAutoSave={msSqlProps.isAutoSave}
                profileString={msSqlProps.profileString}
                id={msSqlProps.id}
                handleActionImageClick={msSqlProps.handleActionImageClick}
            />
        </div>
    )
}

export { MsSql }

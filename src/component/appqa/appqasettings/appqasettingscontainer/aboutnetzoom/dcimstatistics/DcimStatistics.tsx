
import { IDcimStatistics } from '../../../../allinterface/iappqasettingscontainer/aboutnetzoom/IDcimStatistics'
import { SettingsContainer } from '../../../../../shared/settingsform/settingscontainer/SettingsContainer';

const DcimStatistics = (dcimStatisticsProps: IDcimStatistics) => {
    const handleSaveAction = (profileData: string, id?: string | undefined) => {
        if (dcimStatisticsProps.handleSaveAction) {
            dcimStatisticsProps.handleSaveAction(profileData, id);
        }
        else {
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
    }

    return (
        <div key={dcimStatisticsProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

            <SettingsContainer
                uniqueName={`${dcimStatisticsProps.uniqueName}-form-container`}
                formControls={dcimStatisticsProps.formControls}
                allowActionList={dcimStatisticsProps.allowActionList}
                allowShowHeader={false}
                actionLabelItems={dcimStatisticsProps.profileItems}
                allowAdd={dcimStatisticsProps.allowAdd}
                allowDelete={dcimStatisticsProps.allowDelete}
                featureId={dcimStatisticsProps.featureId}
                group={dcimStatisticsProps.group}
                subGroup={dcimStatisticsProps.subGroup}
                subFeatureId={dcimStatisticsProps.selectedFeatureItem._Feature?.toString() || ""}
                handleSaveAction={handleSaveAction}
                handleValueChange={dcimStatisticsProps.handleValueChange}
                isAutoSave={dcimStatisticsProps.isAutoSave}
                profileString={dcimStatisticsProps.profileString}
                id={dcimStatisticsProps.id}
            />
        </div>
    )
}

export { DcimStatistics }

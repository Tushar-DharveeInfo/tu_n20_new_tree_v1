
import { IStepTwoOutbandIcmp } from '../../../allinterface/power/IStepTwoOutbandIcmp';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const StepTwoOutbandIcmp = (StepTwoOutbandIcmpProps: IStepTwoOutbandIcmp) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (StepTwoOutbandIcmpProps.handleSaveAction) {
      StepTwoOutbandIcmpProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (StepTwoOutbandIcmpProps.handleValueChange) {
      StepTwoOutbandIcmpProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={StepTwoOutbandIcmpProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${StepTwoOutbandIcmpProps.uniqueName}-form-container`}
        formControls={StepTwoOutbandIcmpProps.formControls}
        allowActionList={StepTwoOutbandIcmpProps.allowActionList}
        allowShowHeader={false}
        actionLabelItems={StepTwoOutbandIcmpProps.profileItems}
        selectedActionLabelItem={StepTwoOutbandIcmpProps.selectedProfileItem}
        allowAdd={StepTwoOutbandIcmpProps.allowAdd}
        allowDelete={StepTwoOutbandIcmpProps.allowDelete}
        featureId={StepTwoOutbandIcmpProps.featureId}
        subFeatureId={StepTwoOutbandIcmpProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={StepTwoOutbandIcmpProps.isAutoSave}
        profileString={StepTwoOutbandIcmpProps.profileString}
        id={StepTwoOutbandIcmpProps.id}
        handleActionImageClick={StepTwoOutbandIcmpProps.handleActionImageClick}
      />
    </div>
  )
}

export { StepTwoOutbandIcmp }


import { IStepTwoOutbandSsh } from "../../../allinterface/power/IStepTwoOutbandSsh";
import { SettingsContainer } from "../../../../shared/settingsform/settingscontainer/SettingsContainer";

const StepTwoOutbandSsh = (StepTwoOutbandSshProps: IStepTwoOutbandSsh) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (StepTwoOutbandSshProps.handleSaveAction) {
      StepTwoOutbandSshProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (StepTwoOutbandSshProps.handleValueChange) {
      StepTwoOutbandSshProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={StepTwoOutbandSshProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${StepTwoOutbandSshProps.uniqueName}-form-container`}
        formControls={StepTwoOutbandSshProps.formControls}
        allowActionList={StepTwoOutbandSshProps.allowActionList}
        allowShowHeader={false}
        actionLabelItems={StepTwoOutbandSshProps.profileItems}
        selectedActionLabelItem={StepTwoOutbandSshProps.selectedProfileItem}
        allowAdd={StepTwoOutbandSshProps.allowAdd}
        allowDelete={StepTwoOutbandSshProps.allowDelete}
        featureId={StepTwoOutbandSshProps.featureId}
        subFeatureId={StepTwoOutbandSshProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={StepTwoOutbandSshProps.isAutoSave}
        profileString={StepTwoOutbandSshProps.profileString}
        id={StepTwoOutbandSshProps.id}
        handleActionImageClick={StepTwoOutbandSshProps.handleActionImageClick}
      />
    </div>
  )
}

export { StepTwoOutbandSsh }

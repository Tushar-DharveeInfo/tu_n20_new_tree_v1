
import { IStepTwoOutbandWsman } from '../../../allinterface/power/IStepTwoOutbandWsman';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const StepTwoOutbandWsman = (StepTwoOutbandWsmanProps: IStepTwoOutbandWsman) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (StepTwoOutbandWsmanProps.handleSaveAction) {
      StepTwoOutbandWsmanProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (StepTwoOutbandWsmanProps.handleValueChange) {
      StepTwoOutbandWsmanProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={StepTwoOutbandWsmanProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${StepTwoOutbandWsmanProps.uniqueName}-form-container`}
        formControls={StepTwoOutbandWsmanProps.formControls}
        allowActionList={StepTwoOutbandWsmanProps.allowActionList}
        allowShowHeader={false}
        actionLabelItems={StepTwoOutbandWsmanProps.profileItems}
        selectedActionLabelItem={StepTwoOutbandWsmanProps.selectedProfileItem}
        allowAdd={StepTwoOutbandWsmanProps.allowAdd}
        allowDelete={StepTwoOutbandWsmanProps.allowDelete}
        featureId={StepTwoOutbandWsmanProps.featureId}
        subFeatureId={StepTwoOutbandWsmanProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={StepTwoOutbandWsmanProps.isAutoSave}
        profileString={StepTwoOutbandWsmanProps.profileString}
        id={StepTwoOutbandWsmanProps.id}
        handleActionImageClick={StepTwoOutbandWsmanProps.handleActionImageClick}
      />
    </div>
  )
}

export { StepTwoOutbandWsman }

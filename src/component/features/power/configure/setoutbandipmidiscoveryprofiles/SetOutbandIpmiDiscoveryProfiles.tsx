
import { ISetOutbandIpmiDiscoveryProfiles } from '../../../allinterface/power/ISetOutbandIpmiDiscoveryProfiles';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const SetOutbandIpmiDiscoveryProfiles = (setOutbandIpmiDiscoveryProfilesProps: ISetOutbandIpmiDiscoveryProfiles) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (setOutbandIpmiDiscoveryProfilesProps.handleSaveAction) {
      setOutbandIpmiDiscoveryProfilesProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (setOutbandIpmiDiscoveryProfilesProps.handleValueChange) {
      setOutbandIpmiDiscoveryProfilesProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={setOutbandIpmiDiscoveryProfilesProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${setOutbandIpmiDiscoveryProfilesProps.uniqueName}-form-container`}
        formControls={setOutbandIpmiDiscoveryProfilesProps.formControls}
        allowActionList={setOutbandIpmiDiscoveryProfilesProps.allowActionList}
        allowShowHeader={false}
        actionLabelItems={setOutbandIpmiDiscoveryProfilesProps.profileItems}
        selectedActionLabelItem={setOutbandIpmiDiscoveryProfilesProps.selectedProfileItem}
        allowAdd={setOutbandIpmiDiscoveryProfilesProps.allowAdd}
        allowDelete={setOutbandIpmiDiscoveryProfilesProps.allowDelete}
        featureId={setOutbandIpmiDiscoveryProfilesProps.featureId}
        subFeatureId={setOutbandIpmiDiscoveryProfilesProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={setOutbandIpmiDiscoveryProfilesProps.isAutoSave}
        profileString={setOutbandIpmiDiscoveryProfilesProps.profileString}
        id={setOutbandIpmiDiscoveryProfilesProps.id}
        handleActionImageClick={setOutbandIpmiDiscoveryProfilesProps.handleActionImageClick}
      />
    </div>
  )
}

export { SetOutbandIpmiDiscoveryProfiles }

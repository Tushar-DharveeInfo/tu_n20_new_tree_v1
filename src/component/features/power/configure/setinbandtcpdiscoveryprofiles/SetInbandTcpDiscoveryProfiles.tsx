
import { ISetInbandTcpDiscoveryProfiles } from "../../../allinterface/power/ISetInbandTcpDiscoveryProfiles";
import { SettingsContainer } from "../../../../shared/settingsform/settingscontainer/SettingsContainer";

const SetInbandTcpDiscoveryProfiles = (setInbandTcpDiscoveryProfilesProps: ISetInbandTcpDiscoveryProfiles) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (setInbandTcpDiscoveryProfilesProps.handleSaveAction) {
      setInbandTcpDiscoveryProfilesProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (setInbandTcpDiscoveryProfilesProps.handleValueChange) {
      setInbandTcpDiscoveryProfilesProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={setInbandTcpDiscoveryProfilesProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${setInbandTcpDiscoveryProfilesProps.uniqueName}-form-container`}
        formControls={setInbandTcpDiscoveryProfilesProps.formControls}
        allowActionList={setInbandTcpDiscoveryProfilesProps.allowActionList}
        allowShowHeader={true}
        actionLabelItems={setInbandTcpDiscoveryProfilesProps.profileItems}
        selectedActionLabelItem={setInbandTcpDiscoveryProfilesProps.selectedProfileItem}
        allowAdd={setInbandTcpDiscoveryProfilesProps.allowAdd}
        allowDelete={setInbandTcpDiscoveryProfilesProps.allowDelete}
        featureId={setInbandTcpDiscoveryProfilesProps.featureId}
        subFeatureId={setInbandTcpDiscoveryProfilesProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={setInbandTcpDiscoveryProfilesProps.isAutoSave}
        profileString={setInbandTcpDiscoveryProfilesProps.profileString}
        id={setInbandTcpDiscoveryProfilesProps.id}
        handleActionImageClick={setInbandTcpDiscoveryProfilesProps.handleActionImageClick}
      />
    </div>
  )
}

export { SetInbandTcpDiscoveryProfiles }

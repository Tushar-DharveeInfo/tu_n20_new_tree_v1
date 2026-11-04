
import { ISetInbandIcmpDiscoveryProfiles } from "../../../allinterface/power/ISetInbandIcmpDiscoveryProfiles";
import { SettingsContainer } from "../../../../shared/settingsform/settingscontainer/SettingsContainer";

const SetInbandIcmpDiscoveryProfiles = (setInbandIcmpDiscoveryProfilesProps: ISetInbandIcmpDiscoveryProfiles) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (setInbandIcmpDiscoveryProfilesProps.handleSaveAction) {
      setInbandIcmpDiscoveryProfilesProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (setInbandIcmpDiscoveryProfilesProps.handleValueChange) {
      setInbandIcmpDiscoveryProfilesProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={setInbandIcmpDiscoveryProfilesProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${setInbandIcmpDiscoveryProfilesProps.uniqueName}-form-container`}
        formControls={setInbandIcmpDiscoveryProfilesProps.formControls}
        allowActionList={setInbandIcmpDiscoveryProfilesProps.allowActionList}
        allowShowHeader={false}
        actionLabelItems={setInbandIcmpDiscoveryProfilesProps.profileItems}
        selectedActionLabelItem={setInbandIcmpDiscoveryProfilesProps.selectedProfileItem}
        allowAdd={setInbandIcmpDiscoveryProfilesProps.allowAdd}
        allowDelete={setInbandIcmpDiscoveryProfilesProps.allowDelete}
        featureId={setInbandIcmpDiscoveryProfilesProps.featureId}
        subFeatureId={setInbandIcmpDiscoveryProfilesProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={setInbandIcmpDiscoveryProfilesProps.isAutoSave}
        profileString={setInbandIcmpDiscoveryProfilesProps.profileString}
        id={setInbandIcmpDiscoveryProfilesProps.id}
        handleActionImageClick={setInbandIcmpDiscoveryProfilesProps.handleActionImageClick}
      />
    </div>
  )
}

export { SetInbandIcmpDiscoveryProfiles }

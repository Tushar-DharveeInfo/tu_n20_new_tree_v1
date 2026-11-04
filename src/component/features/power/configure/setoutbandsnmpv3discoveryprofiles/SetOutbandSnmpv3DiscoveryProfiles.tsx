
import { ISetOutbandSnmpv3DiscoveryProfiles } from '../../../allinterface/power/ISetOutbandSnmpv3DiscoveryProfiles';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const SetOutbandSnmpv3DiscoveryProfiles = (setOutbandSnmpv3DiscoveryProfilesProps: ISetOutbandSnmpv3DiscoveryProfiles) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (setOutbandSnmpv3DiscoveryProfilesProps.handleSaveAction) {
      setOutbandSnmpv3DiscoveryProfilesProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (setOutbandSnmpv3DiscoveryProfilesProps.handleValueChange) {
      setOutbandSnmpv3DiscoveryProfilesProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={setOutbandSnmpv3DiscoveryProfilesProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${setOutbandSnmpv3DiscoveryProfilesProps.uniqueName}-form-container`}
        formControls={setOutbandSnmpv3DiscoveryProfilesProps.formControls}
        allowActionList={setOutbandSnmpv3DiscoveryProfilesProps.allowActionList}
        allowShowHeader={false}
        actionLabelItems={setOutbandSnmpv3DiscoveryProfilesProps.profileItems}
        selectedActionLabelItem={setOutbandSnmpv3DiscoveryProfilesProps.selectedProfileItem}
        allowAdd={setOutbandSnmpv3DiscoveryProfilesProps.allowAdd}
        allowDelete={setOutbandSnmpv3DiscoveryProfilesProps.allowDelete}
        featureId={setOutbandSnmpv3DiscoveryProfilesProps.featureId}
        subFeatureId={setOutbandSnmpv3DiscoveryProfilesProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={setOutbandSnmpv3DiscoveryProfilesProps.isAutoSave}
        profileString={setOutbandSnmpv3DiscoveryProfilesProps.profileString}
        id={setOutbandSnmpv3DiscoveryProfilesProps.id}
        handleActionImageClick={setOutbandSnmpv3DiscoveryProfilesProps.handleActionImageClick}
      />
    </div>
  )
}

export { SetOutbandSnmpv3DiscoveryProfiles }

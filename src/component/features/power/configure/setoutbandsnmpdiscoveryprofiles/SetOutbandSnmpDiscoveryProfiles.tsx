
import { ISetOutbandSnmpDiscoveryProfiles } from '../../../allinterface/power/ISetOutbandSnmpDiscoveryProfiles';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const SetOutbandSnmpDiscoveryProfiles = (setOutbandSnmpDiscoveryProfilesProps: ISetOutbandSnmpDiscoveryProfiles) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (setOutbandSnmpDiscoveryProfilesProps.handleSaveAction) {
      setOutbandSnmpDiscoveryProfilesProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (setOutbandSnmpDiscoveryProfilesProps.handleValueChange) {
      setOutbandSnmpDiscoveryProfilesProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={setOutbandSnmpDiscoveryProfilesProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${setOutbandSnmpDiscoveryProfilesProps.uniqueName}-form-container`}
        formControls={setOutbandSnmpDiscoveryProfilesProps.formControls}
        allowActionList={setOutbandSnmpDiscoveryProfilesProps.allowActionList}
        allowShowHeader={true}
        actionLabelItems={setOutbandSnmpDiscoveryProfilesProps.profileItems}
        selectedActionLabelItem={setOutbandSnmpDiscoveryProfilesProps.selectedProfileItem}
        allowAdd={setOutbandSnmpDiscoveryProfilesProps.allowAdd}
        allowDelete={setOutbandSnmpDiscoveryProfilesProps.allowDelete}
        featureId={setOutbandSnmpDiscoveryProfilesProps.featureId}
        subFeatureId={setOutbandSnmpDiscoveryProfilesProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={setOutbandSnmpDiscoveryProfilesProps.isAutoSave}
        profileString={setOutbandSnmpDiscoveryProfilesProps.profileString}
        id={setOutbandSnmpDiscoveryProfilesProps.id}
        handleActionImageClick={setOutbandSnmpDiscoveryProfilesProps.handleActionImageClick}
      />
    </div>
  )
}

export { SetOutbandSnmpDiscoveryProfiles }

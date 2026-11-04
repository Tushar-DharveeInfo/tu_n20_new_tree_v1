
import { ISetInbandWmiDiscoveryProfiles } from '../../../allinterface/power/ISetInbandWmiDiscoveryProfiles';
import { SettingsContainer } from '../../../../shared/settingsform/settingscontainer/SettingsContainer';

const SetInbandWmiDiscoveryProfiles = (setInbandWmiDiscoveryProfilesProps: ISetInbandWmiDiscoveryProfiles) => {
  const handleSaveAction = (profileData: string, id?: string | undefined) => {
    if (setInbandWmiDiscoveryProfilesProps.handleSaveAction) {
      setInbandWmiDiscoveryProfilesProps.handleSaveAction(profileData, id);
    }
    else {
      const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
      if (saveButton) {
        saveButton.style.display = "none";
      }
    }
  }

  const handleValueChange = (value: string | number | boolean | unknown, name: string | undefined, isDefault?: boolean | undefined) => {
    if (setInbandWmiDiscoveryProfilesProps.handleValueChange) {
      setInbandWmiDiscoveryProfilesProps.handleValueChange(value, name, isDefault);
    }
  }
  return (
    <div key={setInbandWmiDiscoveryProfilesProps.uniqueName} className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>

      <SettingsContainer
        uniqueName={`${setInbandWmiDiscoveryProfilesProps.uniqueName}-form-container`}
        formControls={setInbandWmiDiscoveryProfilesProps.formControls}
        allowActionList={setInbandWmiDiscoveryProfilesProps.allowActionList}
        allowShowHeader={true}
        actionLabelItems={setInbandWmiDiscoveryProfilesProps.profileItems}
        selectedActionLabelItem={setInbandWmiDiscoveryProfilesProps.selectedProfileItem}
        allowAdd={setInbandWmiDiscoveryProfilesProps.allowAdd}
        allowDelete={setInbandWmiDiscoveryProfilesProps.allowDelete}
        featureId={setInbandWmiDiscoveryProfilesProps.featureId}
        subFeatureId={setInbandWmiDiscoveryProfilesProps.selectedFeatureItem._Feature?.toString() || ""}
        handleSaveAction={handleSaveAction}
        handleValueChange={handleValueChange}
        isAutoSave={setInbandWmiDiscoveryProfilesProps.isAutoSave}
        profileString={setInbandWmiDiscoveryProfilesProps.profileString}
        id={setInbandWmiDiscoveryProfilesProps.id}
        handleActionImageClick={setInbandWmiDiscoveryProfilesProps.handleActionImageClick}
      />
    </div>
  )
}

export { SetInbandWmiDiscoveryProfiles }

import { IActionLabelItem } from "../../shared/allinterface/basic/IActionLabelItem";
import { IApProfileItem } from "../../shared/context/allinterface/IApProfile";
import { IApItem } from "../../shared/context/allinterface/IMainApp";
import { SettingForIntegration } from "../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { FnGetApplicationParameter } from "../../shared/allcommon/basic/FnGetApplicationParameter";
import { FnGetApProfileData } from "./FnGetApProfileData";

// This function will return _AP table data and PG.ApProfile data based on group and subgroup
const FnGetApProfilesWithControls = (
    group: string,
    subGroup: string,
    apData: IApItem[],
    apuserValues?: any[],
    apProfileData?: IApProfileItem[],
    recID?: string,
    isProfile?: boolean
) => {
    try {
        const profileItems: IActionLabelItem[] = [];

        const appData = FnGetApplicationParameter(
            group,
            subGroup,
            apData,
            apuserValues,
            "",
            false
        );

        if (!Array.isArray(appData) || appData.length !== 1) {
            return null;
        }

        const controls = FnGetApplicationParameter(
            appData[0]?.DisplayControl,
            "FormControl",
            apData,
            apuserValues,
            "",
            false
        );

        if (!Array.isArray(controls) || controls.length === 0) {
            return null;
        }

        if (isProfile) {
            const profileData = FnGetApProfileData(
                group,
                subGroup,
                apProfileData,
                recID
            );

            if (
                Array.isArray(profileData) &&
                profileData.length > 0
            ) {
                for (const element of profileData) {
                    try {
                        if (!element) {
                            continue;
                        }

                        profileItems.push({
                            label: element.InstanceName,
                            tooltip: element.InstanceDesc,
                            actionCode: element.RecID,
                            profileString:
                                element.ProfileString,
                            subGroupName:
                                element.SubGroupName,
                            groupName: element.GroupName
                        });
                    } catch (profileError) {
                        console.error(
                            "Profile item error:",
                            profileError
                        );
                    }
                }
            }
        }

        if (SettingForIntegration.includes(subGroup)) {
            const item = controls.find(
                (c: any) => c?._AP === "EnvPrefix"
            );

            if (item) {
                item.DefaultAPValue =
                    `${subGroup.toUpperCase()}_`;
            }
        }

        return {
            controls,
            profileItems,
            maxInstances: appData[0]?.MaxInstances
        };
    } catch (error) {
        console.error(
            "Error:",
            error
        );

        return null;
    }
};

export { FnGetApProfilesWithControls };
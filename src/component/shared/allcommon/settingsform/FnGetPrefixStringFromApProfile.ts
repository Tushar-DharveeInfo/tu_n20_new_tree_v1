
import { SettingGroups } from "../../../constants/Feature";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { IApProfileItem } from "../../context/allinterface/IMainApp";

const FnGetPrefixStringFromApProfile = (
    integrationName: string,
    apProfileRecords?: IApProfileItem[]
) => {
    try {
        const defaultPrefix = `${integrationName?.toUpperCase?.() || ""}_`;

        if (!apProfileRecords?.length) {
            return defaultPrefix;
        }

        const apProfile = apProfileRecords.find(
            (item) =>
                item?.GroupName === SettingGroups.Integration &&
                item?.SubGroupName === integrationName
        );

        if (!apProfile?.ProfileString?.length) {
            return defaultPrefix;
        }

        const parsed = FnParseJsonSafely(apProfile.ProfileString);

        if (
            parsed &&
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            typeof parsed[0]?.EnvPrefix === "string" &&
            parsed[0].EnvPrefix.trim().length > 0
        ) {
            return parsed[0].EnvPrefix;
        }

        return defaultPrefix;
    }
    catch (error) {
        console.error("Error in get prefix string from profile string: ", error);

        return `${integrationName?.toUpperCase?.() || ""}_`;
    }
};

export { FnGetPrefixStringFromApProfile };
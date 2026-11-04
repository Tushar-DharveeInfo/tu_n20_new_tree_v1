
import { IApProfileItem } from "../../shared/context/allinterface/IApProfile";

// This function returns PG.APProfile table data from cache
const FnGetApProfileData = (
    group: string,
    subGroup: string,
    apProfileData?: IApProfileItem[],
    recID?: string
): IApProfileItem[] | null => {
    try {
        if (
            !group?.length ||
            !subGroup?.length ||
            !Array.isArray(apProfileData) ||
            apProfileData.length === 0
        ) {
            return null;
        }

        const normalizedGroup = group.trim().toLowerCase();
        const normalizedSubGroup = subGroup.trim().toLowerCase();
        const normalizedRecID = recID?.trim().toLowerCase();

        return apProfileData.filter((item) => {
            try {
                const itemGroup =
                    item?.GroupName?.trim().toLowerCase();

                const itemSubGroup =
                    item?.SubGroupName?.trim().toLowerCase();

                const itemInstance =
                    item?.InstanceName?.trim().toLowerCase();

                const itemRecID =
                    item?.RecID?.trim().toLowerCase();

                return (
                    itemGroup === normalizedGroup &&
                    itemSubGroup === normalizedSubGroup &&
                    itemInstance !== "template" &&
                    (!normalizedRecID ||
                        itemRecID === normalizedRecID)
                );
            } catch {
                return false;
            }
        });
    } catch (error) {
        console.error(
            "Error in filter:",
            error
        );

        return null;
    }
};

export { FnGetApProfileData };
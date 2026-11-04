
import { IApItem } from "../../context/allinterface/IMainApp";

// this function returns the _AP table data based on group and sub group
const FnGetApplicationParameter = (
    group: string,
    subGroup: string,
    apData: IApItem[],
    apUserValue?: any,
    name: string = "",
    isApplyUserValue: boolean = false,
    applyCanChange: number | null = null,
    userName: string = ""
) => {
    try {
        if (
            !group ||
            !Array.isArray(apData) ||
            apData.length === 0
        ) {
            return [];
        }

        const filterArr: any[] = [];

        const normalizedGroup = group.trim().toLowerCase();
        const normalizedSubGroup = subGroup
            ?.trim()
            .toLowerCase();

        const normalizedName = name?.trim().toLowerCase();

        const normalizedUserName = userName
            ?.replace(/\./g, "")
            ?.replace(/\\/g, "")
            ?.trim()
            .toLowerCase();

        for (const element of apData) {
            try {
                if (!element) {
                    continue;
                }

                const elementGroup =
                    element.GroupName?.trim().toLowerCase();

                const elementSubGroup =
                    element.SubGroupName?.trim().toLowerCase();

                const elementName =
                    element.Name?.trim().toLowerCase();

                let matchRecord: any = null;

                if (
                    elementGroup === normalizedGroup &&
                    elementSubGroup === normalizedSubGroup &&
                    elementName === normalizedName
                ) {
                    matchRecord = { ...element };
                } else if (
                    elementGroup === normalizedGroup &&
                    elementSubGroup === normalizedSubGroup &&
                    !normalizedName?.length
                ) {
                    matchRecord = { ...element };
                } else if (
                    elementGroup === normalizedGroup &&
                    !elementSubGroup &&
                    !normalizedName?.length
                ) {
                    matchRecord = { ...element };
                }

                if (
                    normalizedUserName &&
                    isApplyUserValue &&
                    Array.isArray(apUserValue) &&
                    apUserValue.length > 0 &&
                    matchRecord
                ) {
                    const userApRecord = apUserValue.find(
                        (item: any) => {
                            const itemUserName = item?.UserName
                                ?.replace(/\./g, "")
                                ?.replace(/\\/g, "")
                                ?.trim()
                                .toLowerCase();

                            return (
                                itemUserName ===
                                normalizedUserName &&
                                item?.GroupName
                                    ?.trim()
                                    .toLowerCase() ===
                                elementGroup &&
                                item?.SubGroupName
                                    ?.trim()
                                    .toLowerCase() ===
                                elementSubGroup &&
                                item?.Name
                                    ?.trim()
                                    .toLowerCase() ===
                                elementName
                            );
                        }
                    );

                    if (userApRecord) {
                        matchRecord.Value =
                            userApRecord.Value;
                    }
                }

                if (matchRecord) {
                    matchRecord._AP = element.Name;

                    if (
                        element.CanChange ===
                        applyCanChange
                    ) {
                        filterArr.push(matchRecord);
                    } else if (
                        applyCanChange === null ||
                        applyCanChange === 0
                    ) {
                        filterArr.push(matchRecord);
                    }
                }
            } catch (itemError) {
                console.error(
                    "FnGetApplicationParameter item error:",
                    itemError
                );
            }
        }

        if (filterArr.length > 0) {
            filterArr.sort((a: any, b: any) =>
                (a?.SortOrder ?? 0) >
                    (b?.SortOrder ?? 0)
                    ? 1
                    : -1
            );
        }

        return filterArr;
    } catch (error) {
        console.error(
            "FnGetApplicationParameter error:",
            error
        );

        return [];
    }
};

export { FnGetApplicationParameter };
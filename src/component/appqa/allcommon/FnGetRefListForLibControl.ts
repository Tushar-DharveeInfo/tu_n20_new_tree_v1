
import { IOptionItem } from "@n20a/libform";
import { MISC } from "../../shared/interceptors/EndPoints";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { FnGetRefList } from "../../shared/allcommon/basic/FnGetRefList";
import { DisplayControlEnums } from "../../shared/alldefaultprops/basic/DefaultPropsFormContainer";
import { IRefData } from "../../shared/allinterface/basic/IRefData";
import { IRefItem } from "../../shared/context/allinterface/IMainApp";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";

const FnGetRefListForLibControl = async (
    inputMask: string,
    controlName: string,
    refTableRecords: IRefItem[],
    statusBarContext: IStatusBar,
    uniqueName?: string
): Promise<IOptionItem[] | null> => {
    try {
        const normalizeValues = (
            data: IRefData[]
        ): IOptionItem[] | null => {
            try {
                if (!data?.length) {
                    return null;
                }

                const values = data
                    .filter(
                        (d) =>
                            d.Value &&
                            d.Value?.toLowerCase() !==
                            "undefined"
                    )
                    .map((d) => ({
                        value: d.Value,
                        label: d.Value,
                        tooltip: d.Description
                    }));

                return values.length ? values : null;
            } catch (error) {
                console.error(
                    "Error normalizing values:",
                    error
                );

                return null;
            }
        };

        if (uniqueName === "regex") {
            try {
                if (refTableRecords.length) {
                    const filteredRegex =
                        refTableRecords.find(
                            (item) =>
                                item.Name?.toLowerCase() ===
                                inputMask?.toLowerCase()
                        );

                    if (filteredRegex?.RefValue) {
                        return [
                            {
                                value:
                                    filteredRegex.RefValue,
                                label:
                                    filteredRegex.RefValue
                            }
                        ];
                    }
                }

                return null;
            } catch (error) {
                console.error(
                    "Error processing regex values:",
                    error
                );

                return null;
            }
        }

        const getInputMaskData = async (): Promise<IOptionItem[] | null> => {
            try {
                // Cache
                const refData = FnGetRefList(
                    inputMask,
                    refTableRecords
                );

                const cached =
                    normalizeValues(refData);

                if (
                    cached &&
                    (
                        controlName ===
                        DisplayControlEnums.EditTextControl ||
                        controlName ===
                        DisplayControlEnums.ListBoxControl ||
                        controlName ===
                        DisplayControlEnums.ComboBoxControl
                    )
                ) {
                    return cached;
                }

                // API
                return new Promise((resolve) => {
                    try {
                        axiosInterceptor(
                            {
                                url: MISC.GetRefList,
                                data: {
                                    groupNameCollection:
                                        inputMask
                                },
                                disableLog: true,
                                setFetchData: (
                                    response: any
                                ) => {
                                    try {
                                        if (
                                            !response?.jsonString
                                        ) {
                                            resolve(null);

                                            return;
                                        }

                                        const parsed: IRefData[] =
                                            JSON.parse(
                                                response.jsonString
                                            );

                                        resolve(
                                            normalizeValues(
                                                parsed
                                            )
                                        );
                                    } catch (err) {
                                        console.error(
                                            "RefList parse failed",
                                            err
                                        );

                                        resolve(null);
                                    }
                                }
                            },
                            statusBarContext
                        );
                    } catch (error) {
                        console.error(
                            "Error calling axiosInterceptor:",
                            error
                        );

                        resolve(null);
                    }
                });
            } catch (error) {
                console.error(
                    "Error in getInputMaskData:",
                    error
                );

                return null;
            }
        };

        return await getInputMaskData();
    } catch (error) {
        console.error(
            "FnGetRefListForLibControl error:",
            error
        );

        return null;
    }
};

export { FnGetRefListForLibControl };
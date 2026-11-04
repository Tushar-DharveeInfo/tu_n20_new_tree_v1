
import { IWorkorderRecord } from "@n20a/libform";
import { axiosInterceptor } from "../../shared/interceptors/Interceptor";
import { DEVICE } from "../../shared/interceptors/EndPoints";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";

type UnknownRecord = Record<string, unknown>;

const getString = (value: unknown): string => {
    return value == null ? "" : String(value);
};

const toDate = (value: unknown): Date | undefined => {
    if (!value) return undefined;

    const date = new Date(String(value));

    return Number.isNaN(date.getTime()) ? undefined : date;
};

const FnGetWorkorderProfile = async (
    workorderName: string,
    statusBarContext: IStatusBar
): Promise<IWorkorderRecord | null> => {
    return new Promise((resolve) => {
        axiosInterceptor(
            {
                url: DEVICE.WorkorderDetails,
                data: { woid: workorderName },

                setFetchData: (resp: unknown, status?: string) => {
                    if (status !== "200" || !resp || typeof resp !== "object") {
                        resolve(null);
                        return;
                    }

                    try {
                        const responseData = resp as UnknownRecord;

                        const deviceJsonValue =
                            responseData.deviceJson ??
                            responseData.devicesJson;

                        const deviceJson =
                            typeof deviceJsonValue === "string"
                                ? JSON.parse(deviceJsonValue)
                                : deviceJsonValue;

                        const detailsData =
                            typeof (deviceJson as UnknownRecord)?.Data === "string"
                                ? JSON.parse(
                                    (deviceJson as UnknownRecord).Data as string
                                )
                                : (deviceJson as UnknownRecord)?.Data;

                        const profiles: UnknownRecord[] = Array.isArray(detailsData)
                            ? detailsData
                            : detailsData
                                ? [detailsData as UnknownRecord]
                                : [];

                        const matchedProfile = profiles.find((profile) => {
                            const profileName = getString(
                                profile._WorkorderProfile ??
                                profile._workorderProfile ??
                                profile._workorderprofile
                            );

                            return (
                                profileName.trim().toLowerCase() ===
                                workorderName.trim().toLowerCase()
                            );
                        });

                        if (!matchedProfile) {
                            resolve(null);
                            return;
                        }

                        const workorderRecord: IWorkorderRecord = {
                            _Workorder: getString(matchedProfile._WorkorderProfile),
                            WorkorderType: getString(matchedProfile.WorkorderType),
                            Desc250: getString(matchedProfile.Desc250),
                            _Site: getString(matchedProfile.Site),
                            _Room: getString(matchedProfile.Room),
                            _Floor: getString(matchedProfile.Floor),

                            DateCreated: toDate(matchedProfile.DateCreated),
                            CreatedBy: getString(matchedProfile.CreatedBy),

                            DateApproved: toDate(matchedProfile.DateApproved),
                            ApprovedBy: getString(matchedProfile.ApprovedBy),

                            DateExecuted: toDate(matchedProfile.DateExecuted),
                            ExecutedBy: getString(matchedProfile.ExecutedBy),

                            DateAssigned: toDate(matchedProfile.DateAssigned),
                            AssignedBy: getString(matchedProfile.AssignedBy),

                            AssignedTo: getString(matchedProfile.AssignedTo),
                            Instructions: getString(matchedProfile.Instructions),
                            Status: getString(matchedProfile.Status)
                        };

                        resolve(workorderRecord);
                    } catch (error) {
                        console.error(
                            "Error parsing WorkorderDetails response:",
                            error
                        );
                        resolve(null);
                    }
                }
            },
            statusBarContext
        );
    });
};

export { FnGetWorkorderProfile }
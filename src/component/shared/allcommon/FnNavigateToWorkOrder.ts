
import { FEnums } from "../../constants/Feature";
import { ISession } from "../context/allinterface/ISession";

const FnNavigateToWorkOrder = async (
    workOrderName: string,
    sessionId: string,
    sessionData?: ISession[],
) => {
    try {

        if (!sessionId || !workOrderName) return;


        // Get value from existing session table
        const getSessionValue = (variableName: string) =>
            sessionData?.find(
                (item) => item.VariableName === variableName
            )?.SessionValue;

        // Build hierarchy from existing session
        const hierarchyParts = [
            getSessionValue("SiteName") &&
            `Site:${getSessionValue("SiteName")}`,

            getSessionValue("RoomName") &&
            `Room:${getSessionValue("RoomName")}`,

            getSessionValue("FloorName") &&
            `Floor:${getSessionValue("FloorName")}`
        ].filter(Boolean);

        const hierarchyPath = hierarchyParts.join("/");

        const url = `${window.location.origin}/feature/${FEnums.Workorder}?isnew=true&id=${sessionId}&hierarchy=${encodeURIComponent(hierarchyPath)}&wo=${workOrderName}`;

        //  safer open
        const newTab = window.open(url, "_blank");

        if (!newTab) {
            console.error(
                "Popup blocked"
            );
        }
    } catch (error) {
        console.error(
            "Error in function(FnNavigateToWorkOrder): ",
            error
        );

    }
};

export { FnNavigateToWorkOrder }
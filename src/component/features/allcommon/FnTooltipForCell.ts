import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";
import { ICablingGridRow, ICablingGridSection } from "../../shared/allinterface/tablegrid/ICablingGrid";

/**
 * Workflow:
 *
 * 1. Validate that the tooltip is requested for a device port column.
 * 2. Extract the PortID from the current device port status.
 * 3. If the port is not connected, return the current port name.
 * 4. Find the cable connected to the current port.
 * 5. Determine the cable connection type (1-1, 1-N, or N-N).
 * 6. Find the opposite end of the cable.
 * 7. Locate the device connected to the opposite cable end.
 * 8. Generate the tooltip based on the connection state:
 *    - Port only
 *    - Port cabled
 *    - 1-1 connection
 *    - 1-N connection
 *    - N-N connection
 */

const FnTooltipForCell = (row: ICablingGridRow, tableData: ICablingGridSection[], columnName: string) => {
    type CableConnectionType = "1-1" | "1-N" | "N-N";
    type FindCableResult = {
        item: ICablingGridRow;
        connectedToPortA: boolean;
        connectionType: CableConnectionType;
    };

    const getPortId = (status: string): string | null => {
        if (!status?.toLowerCase().includes("portid")) {
            return null;
        }

        const parsed = FnParseJsonSafely(status);
        return parsed?.PortID ?? parsed ?? null;
    };

    const findCable = (
        portId: string,
        tableData: ICablingGridSection[]
    ): FindCableResult | null => {

        let cableRow: ICablingGridRow | null = null;
        let connectedToPortA = false;

        // Step 1 - Find the cable row
        outerLoop:
        for (const section of tableData) {
            for (const item of section.rowData ?? []) {

                if (item.PortAEntityID === portId) {
                    cableRow = item;
                    connectedToPortA = true;
                    break outerLoop;
                }

                if (item.PortBEntityID === portId) {
                    cableRow = item;
                    connectedToPortA = false;
                    break outerLoop;
                }
            }
        }

        if (!cableRow) {
            return null;
        }

        // Step 2 - Find all rows for the same cable
        const sameCableRows: ICablingGridRow[] = [];

        for (const section of tableData) {
            for (const item of section.rowData ?? []) {
                if (item.CableName === cableRow.CableName) {
                    sameCableRows.push(item);
                }
            }
        }

        // Step 3 - Count unique front and rear cable ports
        const frontPorts = new Set<string>();
        const rearPorts = new Set<string>();

        for (const row of sameCableRows) {
            if (row.PortACompositeName) {
                frontPorts.add(row.PortACompositeName);
            }

            if (row.PortBCompositeName) {
                rearPorts.add(row.PortBCompositeName);
            }
        }

        // Step 4 - Determine connection type
        let connectionType: CableConnectionType = "1-1";

        if (frontPorts.size > 1 && rearPorts.size > 1) {
            connectionType = "N-N";
        } else if (frontPorts.size > 1 || rearPorts.size > 1) {
            connectionType = "1-N";
        }

        return {
            item: cableRow,
            connectedToPortA,
            connectionType
        };
    };

    const findConnectedDevice = (
        portId: string,
        tableData: ICablingGridSection[]
    ) => {
        for (const section of tableData) {
            for (const row of section.rowData ?? []) {

                if (getPortId(row.FromDevicePortStatus ?? "") === portId) {
                    return row;
                }

                if (getPortId(row.ToDevicePortStatus ?? "") === portId) {
                    return row;
                }
            }
        }

        return null;
    };

    const isFrom = columnName === "FromDeviceCompositePortName";
    const isTo = columnName === "ToDeviceCompositePortName";

    if (!isFrom && !isTo) {
        return columnName;
    }

    const currentPortName = isFrom
        ? row.FromDeviceCompositePortName
        : row.ToDeviceCompositePortName;

    const currentStatus = isFrom
        ? row.FromDevicePortStatus
        : row.ToDevicePortStatus;

    const portId = getPortId(currentStatus as string);

    //------------------------------------------------------
    // Case 1 - Device port is not connected
    // Tooltip: <PortName>
    //------------------------------------------------------
    if (!portId) {
        return currentPortName;
    }

    const cable = findCable(portId, tableData);

    if (!cable) {
        return currentPortName;
    }

    const otherEndPortId = cable.connectedToPortA
        ? cable.item.PortBEntityID
        : cable.item.PortAEntityID;

    //------------------------------------------------------
    // Case 2 - Connected only to cable
    // Tooltip: <PortName> cabled
    //------------------------------------------------------
    if (!otherEndPortId) {
        return `${currentPortName} cabled`;
    }

    const connectedDevice = findConnectedDevice(
        otherEndPortId,
        tableData
    );

    if (!connectedDevice) {
        return `${currentPortName} cabled`;
    }

    const connectedPort = isFrom
        ? (
            connectedDevice.ToDeviceCompositePortName ??
            connectedDevice.FromDeviceCompositePortName
        )
        : (
            connectedDevice.FromDeviceCompositePortName ??
            connectedDevice.ToDeviceCompositePortName
        );

    //------------------------------------------------------
    // Case 3 - Standard 1:1 cable
    // Tooltip:
    // <FromPort> -> <ToPort>
    //------------------------------------------------------
    if (cable.connectionType === "1-1") {
        return `${currentPortName} -> ${connectedPort}`;
    }

    //------------------------------------------------------
    // Case 4 - 1:N cable
    // Tooltip:
    // <FromPort> using <CableName> -> <devicePortName> >>
    //------------------------------------------------------
    if (cable.connectionType === "1-N") {
        return `${isTo ? "<<" : ""} ${currentPortName} using ${cable.item.CableName} -> ${connectedPort} ${isFrom ? ">>" : ""}`;
    }

    //------------------------------------------------------
    // Case 5 - N:N cable
    // Tooltip:
    // << <FromPort> using <CableName> -> <devicePortName> >>
    //------------------------------------------------------
    if (cable.connectionType === "N-N") {
        return `<< ${currentPortName} using ${cable.item.CableName} -> ${connectedPort} >>`;
    }

    // Fallback
    return currentPortName;
}

export { FnTooltipForCell }

/*
  * Sorting Workflow
  * ----------------
  * 1. Sort the FromDevice data.
  *
  * 2. Check whether ToDevice data exists.
  *
  *    a. If ToDevice does NOT exist:
  *       - Return the sorted FromDevice data with its corresponding Cable data.
  *       - No ToDevice sorting or merging is required.
  *
  *    b. If ToDevice exists:
  *       - Split the data into three separate arrays:
  *         • FromDevice[]
  *         • Cable[] (includes PortA, Cable, and PortB)
  *         • ToDevice[]
  *
  *       - Sort the FromDevice array.
  *       - Sort the ToDevice array.
  *
  *       - Merge the arrays based on their lengths:
  *
  *         i. If FromDevice.length >= ToDevice.length:
  *            - Iterate through the FromDevice array.
  *            - Combine:
  *              • FromDevice
  *              • Corresponding Cable
  *              • Corresponding ToDevice (if available)
  *
  *         ii. If ToDevice.length > FromDevice.length:
  *             - Iterate through the ToDevice array.
  *             - Combine:
  *               • Corresponding FromDevice (if available)
  *               • Corresponding Cable (if available)
  *               • ToDevice
  */

const FnSortGetCablingData = (
    data: Record<string, any>
) => {
    const getSortKey = (
        item: any,
        viewField: string,
        compositeField: string
    ) => ({
        view: item[viewField] ?? "",
        port: FnConvertCellName(item[compositeField] ?? ""),
    });

    const compare = (
        a: any,
        b: any,
        viewField: string,
        compositeField: string
    ) => {
        const aKey = getSortKey(a, viewField, compositeField);
        const bKey = getSortKey(b, viewField, compositeField);

        const viewCompare = aKey.view.localeCompare(
            bKey.view,
            undefined,
            { sensitivity: "base" }
        );

        if (viewCompare !== 0) {
            return viewCompare;
        }

        return aKey.port.localeCompare(
            bKey.port,
            undefined,
            {
                numeric: true,
                sensitivity: "base",
            }
        );
    };

    // Sort From Device
    const fromSorted = [...data.Cabling].sort((a, b) =>
        compare(
            a,
            b,
            "FromDeviceViewName",
            "FromDeviceCompositePortName"
        )
    );

    // If ToDevice doesn't exist, return From sort only
    if (
        !fromSorted.some(
            x => x.ToDeviceCompositePortName
        )
    ) {
        return {
            ...data,
            Cabling: fromSorted,
        };
    } else {
        //----------------------------------------
        // Split into 3 arrays
        //----------------------------------------

        const fromDevices = data.Cabling.map((x: any) => ({
            ID: x.ID,
            FromDeviceEntityName: x.FromDeviceEntityName,
            FromDeviceEntityID: x.FromDeviceEntityID,
            FromDeviceAssetID: x.FromDeviceAssetID,
            FromDevicePath: x.FromDevicePath,
            FromDeviceName: x.FromDeviceName,
            FromDeviceDescription: x.FromDeviceDescription,
            FromDeviceViewName: x.FromDeviceViewName,
            FromDeviceViewID: x.FromDeviceViewID,
            FromDevicePortID: x.FromDevicePortID,
            FromDevicePortIndex: x.FromDevicePortIndex,
            FromDeviceCompositePortName: x.FromDeviceCompositePortName,
            FromDevicePortDesc: x.FromDevicePortDesc,
            FromDevicePortGender: x.FromDevicePortGender,
            FromDevicePortStatus: x.FromDevicePortStatus,
            FromDevicePortNodeType: x.FromDevicePortNodeType,
            FromDevicePortPortType: x.FromDevicePortPortType ?? x.FromDevicePortType ?? x.PortType,
        }));

        const cableDetails = data.Cabling.map((x: any) => ({
            ID: x.ID,
            PortAViewName: x.PortAViewName,
            PortAEntityID: x.PortAEntityID,
            PortAStatus: x.PortAStatus,
            PortACompositeName: x.PortACompositeName,
            PortADesc: x.PortADesc,
            PortAGender: x.PortAGender,
            PortASortOrder: x.PortASortOrder,
            PortANodeType: x.PortANodeType,
            PortAPortType: x.PortAPortType ?? x.PortAType ?? x.PortType,
            PortACableViewID: x.PortACableViewID,

            CableEntityName: x.CableEntityName,
            CableEntityID: x.CableEntityID,
            CableAssetID: x.CableAssetID,
            CableName: x.CableName,
            CableDescription: x.CableDescription,

            PortBCableViewID: x.PortBCableViewID,
            PortBStatus: x.PortBStatus,
            PortBCompositeName: x.PortBCompositeName,
            PortBDesc: x.PortBDesc,
            PortBEntityID: x.PortBEntityID,
            PortBViewName: x.PortBViewName,
            PortBSortOrder: x.PortBSortOrder,
            PortBGender: x.PortBGender,
            PortBNodeType: x.PortBNodeType,
            PortBPortType: x.PortBPortType ?? x.PortBType ?? x.PortType,
        }));

        const toDevices = data.Cabling
            .filter((x: any) => x.ToDeviceCompositePortName)
            .map((x: any) => ({
                ID: x.ID,
                ToDeviceEntityName: x.ToDeviceEntityName,
                ToDeviceEntityID: x.ToDeviceEntityID,
                ToDeviceAssetID: x.ToDeviceAssetID,
                ToDevicePath: x.ToDevicePath,
                ToDeviceName: x.ToDeviceName,
                ToDeviceDescription: x.ToDeviceDescription,
                ToDeviceViewName: x.ToDeviceViewName,
                ToDeviceViewID: x.ToDeviceViewID,
                ToDevicePortID: x.ToDevicePortID,
                ToDevicePortIndex: x.ToDevicePortIndex,
                ToDeviceCompositePortName: x.ToDeviceCompositePortName,
                ToDevicePortDesc: x.ToDevicePortDesc,
                ToDevicePortGender: x.ToDevicePortGender,
                ToDevicePortStatus: x.ToDevicePortStatus,
                ToDevicePortNodeType: x.ToDevicePortNodeType,
                ToDevicePortPortType: x.ToDevicePortPortType ?? x.ToDevicePortType ?? x.PortType,
            }));

        //----------------------------------------
        // Sort
        //----------------------------------------

        fromDevices.sort((a: any, b: any) =>
            compare(
                a,
                b,
                "FromDeviceViewName",
                "FromDeviceCompositePortName"
            )
        );

        toDevices.sort((a: any, b: any) => {
            const devCompare = (a.ToDeviceName ?? "").localeCompare(
                b.ToDeviceName ?? "",
                undefined,
                { sensitivity: "base" }
            );
            if (devCompare !== 0) {
                return devCompare;
            }
            return compare(
                a,
                b,
                "ToDeviceViewName",
                "ToDeviceCompositePortName"
            );
        });

        //----------------------------------------
        // Merge
        //----------------------------------------

        const result: any[] = [];

        const maxLength = Math.max(
            fromDevices.length,
            toDevices.length
        );

        for (let i = 0; i < maxLength; i++) {

            if (fromDevices.length >= toDevices.length) {

                result.push({
                    ...(fromDevices[i] ?? {}),
                    ...(cableDetails[i] ?? {}),
                    ...(toDevices[i] ?? {})
                });

            } else {

                result.push({
                    ...(fromDevices[i] ?? {}),
                    ...(cableDetails[i] ?? {}),
                    ...(toDevices[i] ?? {})
                });

            }
        }

        return {
            ...data,
            Cabling: result,
        };
    }

};

/*
 * Sorting Workflow
 * ----------------
 * 1. Sort all ports by ViewName.
 *    - Front ports are displayed before Rear ports.
 *
 * 2. Within each view, sort by CompositePortName.
 *    - Convert the port name to an orientation-only format
 *      (e.g., "Front-Slot1...", "Rear-Slot1...") using
 *      convertToOrientationOnly().
 *
 * 3. Perform a natural sort on the converted port names.
 *    - Ensures Slot2 < Slot10 < Slot36 instead of
 *      lexicographical ordering.
 *
 * 4. Return the original data structure with the Ports
 *    array sorted.
 */

const FnSortGetDevicePort = (
    data: Record<string, any>
) => {
    if (!data?.Ports || !Array.isArray(data.Ports)) {
        return data;
    }
    const getSortKey = (item: any) => {
        const view = item.ViewName ?? "";

        const port = FnConvertCellName(item.CompositePortName ?? "")
        return { view, port };
    };

    return {
        ...data,
        Ports: [...data.Ports].sort((a, b) => {
            const aKey = getSortKey(a);
            const bKey = getSortKey(b);

            // Front before Rear
            const viewCompare = aKey.view.localeCompare(bKey.view, undefined, { sensitivity: "base" });
            if (viewCompare !== 0) {
                return viewCompare;
            }

            // Slot4 < Slot36 < Slot40
            return aKey.port.localeCompare(bKey.port, undefined, {
                numeric: true,
                sensitivity: "base",
            });
        }),
    };

};

function FnConvertCellName(input: string): string {
    if (!input || typeof input !== "string") {
        return "";
    }
    return input
        .replace(/.*\((R)\)\./, ' Rear-')
        .replace(/.*\((F)\)\./, ' Front-');
}
export { FnSortGetCablingData, FnSortGetDevicePort, FnConvertCellName };
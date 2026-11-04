
import { useEffect, useRef, useState } from 'react';
import type { IFloorRack, IMountedDevice, IRenderMountedRackProps } from '../../allinterface/deviceview/IMountedRack';
import '../../allcss/deviceview/MountedRack.css';
import { BasicGrid } from '../../tablegrid/BasicGrid';
import { usePlacementContext } from '../../context/hooks/PlacementHooks';
import { AgGridReact } from 'ag-grid-react';
import { IBasicGridColDef } from '../../allinterface/tablegrid/IBasicGrid';

const MountedRack = ({ rack, rackmountedDevices, proposedPlacements, availablePositions, availableRackData, selectedRU, disabledSelectionRU, handleSelectRU, treeData, views, slots }: IRenderMountedRackProps) => {

    const [selectedRUs, setSelectedRUs] = useState<number[]>([]);
    const [rowData, setRowData] = useState<Record<string, any>[]>([])
    const placementContext = usePlacementContext();
    const gridRef: React.RefObject<AgGridReact> | any = useRef<any>(null);

    // Resolve slot EntID for a given RU number
    const findSlotEntId = (ruNumber: number): string | undefined => {
        const targetName1 = `RU#${ruNumber}`;
        const targetName2 = `RU ${ruNumber}`;
        const targetName3 = `RU#0${ruNumber}`;

        // 1. Check direct slots prop
        const allSlotsList: any[] = Array.isArray(slots) ? [...slots] : [];

        // Also extract from views if available
        if (Array.isArray(views)) {
            for (const v of views) {
                try {
                    const raw = v.svg || v.Parent;
                    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                    if (Array.isArray(parsed?.Parent?.[0]?.Slots)) {
                        allSlotsList.push(...parsed.Parent[0].Slots);
                    }
                } catch (e) { }
            }
        }

        // Check in rack.slots / rack.Slots
        const rSlots = (rack as any)?.slots || (rack as any)?.Slots;
        if (Array.isArray(rSlots)) {
            allSlotsList.push(...rSlots);
        }

        for (const s of allSlotsList) {
            if (!s) continue;
            const name = (s.SlotName || s.SlotComposite || s.Name || "").trim();
            const idx = Number(s.SlotIndex ?? s.SlotMountIndex ?? s.MountPosition ?? s.RU);
            if (
                name.toLowerCase() === targetName1.toLowerCase() ||
                name.toLowerCase() === targetName2.toLowerCase() ||
                name.toLowerCase() === targetName3.toLowerCase() ||
                idx === ruNumber
            ) {
                if (s.SlotID) return s.SlotID;
                if (s.EntId || s.EntID || s.SlotId) return s.EntId || s.EntID || s.SlotId;
            }
        }

        // 2. Check treeData
        if (treeData && rack?.EntId) {
            function searchNode(node: any): string | undefined {
                if (!node?.children?.length) return undefined;
                for (const child of node.children) {
                    const childName = (child.Name || (typeof child.title === "string" ? child.title : "")).trim();
                    if (
                        childName.toLowerCase() === targetName1.toLowerCase() ||
                        childName.toLowerCase() === targetName2.toLowerCase() ||
                        childName.toLowerCase() === targetName3.toLowerCase()
                    ) {
                        return child.NodeEntID || child.key;
                    }
                    const found = searchNode(child);
                    if (found) return found;
                }
                return undefined;
            }
            for (const rootNode of treeData) {
                const found = searchNode(rootNode);
                if (found) return found;
            }
        }

        // 3. Check DOM SVG slot elements if present
        try {
            const el = document.querySelector(`rect.SVGSlot[desc="${targetName1}"], rect.SVGSlot[desc="${targetName2}"]`);
            if (el) {
                const id = el.getAttribute("id");
                if (id) return id;
            }
        } catch (e) { }

        return undefined;
    };
    const columnDefs: IBasicGridColDef[] = [
        {
            headerName: "Capacity",
            field: "capacity",
            width: 150,
        },
        {
            headerName: "Before",
            field: "before",
            width: 80,
        },
        {
            headerName: "After",
            field: "after",
            flex: 1,
        },
    ];
    useEffect(() => {
        if (rack && proposedPlacements && availableRackData) {

            const matchRack = availableRackData.find((item: any) => item.RackName === rack.RackName)
            if (matchRack) {
                const row = getCapacityRowData(rack, proposedPlacements)
                if (row.length) {
                    setRowData(row)
                }
            } else {
                setRowData([])
            }
        }
    }, [proposedPlacements, rack, availableRackData])
    function getCapacityRowData(
        rack: IFloorRack,
        proposedPlacements: IMountedDevice[]
    ) {
        if (!rack && !proposedPlacements) {
            return []
        }
        // Convert string values to numbers and sum usage
        const totalRUUsed = proposedPlacements.reduce(
            (sum, d) => sum + Number(d.RURequired || 0),
            0
        );

        const totalPowerUsed = proposedPlacements.reduce(
            (sum, d) => sum + Number(d.Power || 0),
            0
        );

        const totalThermalUsed = proposedPlacements.reduce(
            (sum, d) => sum + Number(d.Thermal || 0),
            0
        );

        const totalPowerPortsUsed = proposedPlacements.reduce(
            (sum, d) => sum + Number(d.PowerPort || 0),
            0
        );

        const totalNetworkPortsUsed = proposedPlacements.reduce(
            (sum, d) => sum + Number(d.NetworkPort || 0),
            0
        );

        const totalWeightUsed = proposedPlacements.reduce(
            (sum, d) => sum + Number(d.Weight || 0),
            0
        );

        return [
            {
                capacity: "RU",
                before: rack.FreeRU,
                after: (rack.FreeRU ?? 0) - totalRUUsed,
            },
            {
                capacity: "Power",
                before: rack.FreePowerAvailable,
                after: (rack.FreePowerAvailable ?? 0) - totalPowerUsed,
            },
            {
                capacity: "Thermal",
                before: rack.FreeThermal,
                after: (rack.FreeThermal ?? 0) - totalThermalUsed,
            },
            {
                capacity: "Power Ports",
                before: rack.FreePowerPort,
                after: (rack.FreePowerPort ?? 0) - totalPowerPortsUsed,
            },
            {
                capacity: "Network Ports",
                before: rack.FreeNetworkPort,
                after: (rack.FreeNetworkPort ?? 0) - totalNetworkPortsUsed,
            },
            {
                capacity: "Weight",
                before: rack.FreeWeight,
                after: (rack.FreeWeight ?? 0) - totalWeightUsed,
            },
        ];
    }
    // Calculate remaining power for this rack
    const getRackRemainingPower = (): number => {
        const totalPower = rackmountedDevices.reduce((sum, mountedDevice) => sum + (mountedDevice.Power ?? 0), 0);
        return (rack.FreePowerAvailable ?? 0) - totalPower;
    };
    useEffect(() => {
        if (!selectedRU) return;
        const matchRack = availableRackData?.find((item: any) => item.RackName === rack.RackName || item.EntId === rack.EntId);
        const lastLoc = placementContext.lastSelectedInboundLocation;
        const isRackMatched = (
            (matchRack && (
                lastLoc?.Rack === matchRack.RackName ||
                lastLoc?.Rack === matchRack.EntId ||
                lastLoc?.RackEntId === matchRack.EntId
            )) ||
            lastLoc?.Rack === rack.RackName ||
            lastLoc?.Rack === rack.EntId ||
            lastLoc?.RackEntId === rack.EntId
        );

        if (isRackMatched) {
            const ruArray = selectedRU
                .split(",")
                .map(item => item.trim())
                .map(item => Number(item.replace(/RU#?\s*/i, "").replace(/^#/, "")))
                .filter(num => !isNaN(num));

            setSelectedRUs(ruArray);
        } else {
            setSelectedRUs([]);
        }

    }, [selectedRU, placementContext.lastSelectedInboundLocation]);

    const remainingPower = getRackRemainingPower();
    const currentRackAvailablePositions = (availableRackData?.find((item: any) => item.RackName === rack.RackName)?.availablePositions ?? availablePositions) as number[] ?? [];

    return (
        <div className='nz-mounted-rack'>
            <div className="nz-MountedRack-container">
                <h5 className="nz-MountedRack-header">
                    <span
                        className="nz-MountedRack-rack-name-badge" title={`Power: ${remainingPower}W`}>
                        {rack.RackName}
                    </span>
                </h5>

                {/* RU ordered by ID Z-A (highest to lowest) - with auto scroll */}
                <div className="nz-MountedRack-ru-grid-container">
                    <div className="nz-MountedRack-ru-grid">
                        {Array.from({ length: rack.totalRU }, (_, index) => {
                            // Order RU from highest to lowest (Z-A)
                            const ruId = rack.totalRU - index;
                            const occupyingDevice = rackmountedDevices.find(mountedDevice =>
                                ruId >= mountedDevice.StartMountIndex && ruId < mountedDevice.StartMountIndex + (mountedDevice?.RURequired ?? 0)
                            );

                            const isOccupied = Boolean(occupyingDevice?.EntId);
                            const isAvailable = currentRackAvailablePositions.includes(ruId);

                            const cellClass = `nz-MountedRack-ru-cell
  ${isOccupied ? 'nz-MountedRack-ru-cell-occupied' : isAvailable ? 'nz-MountedRack-ru-cell-available' : "nz-MountedRack-ru-cell-free"}
  ${selectedRUs.includes(ruId) ? 'nz-MountedRack-ru-cell-selected' : ''}`;

                            const displayDevice = occupyingDevice;
                            const deviceType = occupyingDevice ? occupyingDevice?.EntId ? 'Occupied' : 'empty' : 'Available';

                            return (
                                <div
                                    key={ruId}
                                    title={displayDevice ? `${deviceType}: ${displayDevice.Name || displayDevice.EntId}` : selectedRUs.includes(ruId) && proposedPlacements ?
                                        `Device in placement can be placed at RU: <${proposedPlacements[0].Name || proposedPlacements[0].EntId}>`
                                        : `Available ru ${ruId}`}
                                    className={cellClass}
                                    onClick={() => {
                                        const matchRack = availableRackData.find((item: any) => item.RackName === rack.RackName)
                                        if (deviceType !== 'Available' || disabledSelectionRU || !matchRack) return
                                        const device = proposedPlacements?.[0];
                                        const ruRequired = Number(device?.RURequired || 1);

                                        // Generate RU range
                                        const ruRange: number[] = Array.from({ length: ruRequired }, (_, i) => ruId + i);

                                        //  Check if all RUs are available
                                        const isValid = ruRange.every((ru) => currentRackAvailablePositions.includes(ru));

                                        if (!isValid) {
                                            //   check if all RUs are empty (no mounted device)
                                            const isAllEmpty = ruRange.every((ru: number) => {
                                                const occupyingDevice = rackmountedDevices.find((mountedDevice) =>
                                                    ru >= mountedDevice.StartMountIndex &&
                                                    ru < mountedDevice.StartMountIndex + (mountedDevice?.RURequired ?? 0)
                                                );
                                                return !occupyingDevice;
                                            });

                                            if (!isAllEmpty) {
                                                return;
                                            } else {
                                                const slotEntId = findSlotEntId(ruId);
                                                setSelectedRUs(ruRange);
                                                handleSelectRU(ruRange.map(r => `RU ${r}`).join(", "), slotEntId);
                                            }

                                        } else {
                                            const slotEntId = findSlotEntId(ruId);
                                            setSelectedRUs(ruRange);
                                            handleSelectRU(ruRange.map(r => `RU ${r}`).join(", "), slotEntId);
                                        }
                                        // 


                                    }}
                                >
                                    <div className='nz-MountedRack-ru-content'>
                                        <span style={{ fontWeight: '400', color: 'black', }}>RU {ruId}</span>
                                        {displayDevice && (
                                            <span>- {displayDevice.Name || displayDevice.EntId}{displayDevice.Power && displayDevice.Power > 0 ? ` (${displayDevice.Power}W)` : ''}</span>
                                        )}
                                        {selectedRUs.includes(ruId) && proposedPlacements && (
                                            <span>- {proposedPlacements[0].Name || proposedPlacements[0].EntId}{(proposedPlacements[0].Power ?? (proposedPlacements[0] as any).power) && (proposedPlacements[0].Power ?? (proposedPlacements[0] as any).power) > 0 ? ` (${proposedPlacements[0].Power ?? (proposedPlacements[0] as any).power}W)` : ''}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="nz-MountedRack-legend-container">
                            <div className="nz-MountedRack-legend-item">
                                <span className="nz-MountedRack-legend-box nz-MountedRack-legend-occupied" />
                                Occupied
                            </div>

                            <div className="nz-MountedRack-legend-item">
                                <span className="nz-MountedRack-legend-box nz-MountedRack-legend-available" />
                                Available
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {
                rowData && rowData.length > 0 && <div className='nz-mounted-rack-grid'>
                    <BasicGrid
                        uniqueName={'rack-mounted'}
                        instanceName={'rack-mounted'}
                        gridRef={gridRef}
                        showGrid={true}
                        columnDefs={columnDefs}
                        rowData={rowData}
                        containerName={'rack-mounted'} />
                </div>
            }
        </div >
    );
};

export { MountedRack };

/*
TU: How to use
import { FindRackPositions, IAvailableRack } from '../utils/FindRackPositions';
const availableRacks = FindRackPositions({ racks, items, targetItem });
*/

import { IAvailableRack, IFloorRack, IMountedDevice, IPlacementDevice } from "../../shared/allinterface/plan/IEditFloorLayout";


// Props interface for the FindRackPositions function
interface ItemPlacementProps {
  racks: IFloorRack[];
  items: IMountedDevice[];
  targetItem: IPlacementDevice;
}

// Calculate remaining budgets for a rack
const getRackRemainingBudgets = (rack: IFloorRack, items: IMountedDevice[]) => {

  return {
    remainingRU: rack.FreeRU ?? 0,
    remainingPower: rack.FreePowerAvailable ?? 0,
    remainingThermal: rack.FreeThermal ?? 0,
    remainingPowerPort: rack.FreePowerPort ?? 0,
    remainingNetworkPort: rack.FreeNetworkPort ?? 0,
    remainingWeight: rack.FreeWeight ?? 0,
  };
};

// Check if a rack has contiguous RU available
const findAvailablePositions = (rack: IFloorRack, items: IMountedDevice[], requiredRU: number): number[] => {
  const rackItems = items.filter(item => item.RackName === rack.RackName);
  const occupiedRU = new Set<number>();

  // Mark all occupied RU
  rackItems.forEach(item => {
    for (let i = item.StartMountIndex; i < item.StartMountIndex + Number(item.RURequired ?? 0); i++) {
      occupiedRU.add(i);
    }
  });

  const availablePositions: number[] = [];
  // Check each possible starting position
  for (let startRu = 1; startRu <= rack.totalRU - Number(requiredRU) + 1; startRu++) {
    let canPlace = true;
    // Check if all required consecutive RU are available
    for (let ru = startRu; ru < startRu + Number(requiredRU); ru++) {
      if (occupiedRU.has(ru)) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      availablePositions.push(startRu);
    }
  }

  return availablePositions;
};

// Check if rack meets all resource constraints
const checkResourceConstraints = (
  targetItem: Partial<IMountedDevice>,
  budgets: {
    remainingRU: number;
    remainingPower: number;
    remainingThermal: number;
    remainingPowerPort: number;
    remainingNetworkPort: number;
    remainingWeight: number;
  }
): boolean => {
  // If a resource is undefined or 0, treat it as available (no requirement)
  const resourceStatus = {
    ru: !targetItem.RURequired || targetItem.RURequired === 0 || Number(targetItem.RURequired) <= Number(budgets.remainingRU),
    power: !targetItem.Power || targetItem.Power === 0 || Number(targetItem.Power) <= Number(budgets.remainingPower),
    thermal: !targetItem.Thermal || targetItem.Thermal === 0 || Number(targetItem.Thermal) <= Number(budgets.remainingThermal),
    powerPort: !targetItem.PowerPort || targetItem.PowerPort === 0 || Number(targetItem.PowerPort) <= Number(budgets.remainingPowerPort),
    networkPort: !targetItem.NetworkPort || targetItem.NetworkPort === 0 || Number(targetItem.NetworkPort) <= Number(budgets.remainingNetworkPort),
    weight: !targetItem.Weight || targetItem.Weight === 0 || Number(targetItem.Weight) <= Number(budgets.remainingWeight),
  };

  // All resource constraints must pass
  return resourceStatus.ru && resourceStatus.power && resourceStatus.thermal &&
    resourceStatus.powerPort && resourceStatus.networkPort && resourceStatus.weight;
};

/**
 * Get racks with available positions for placing a target item
 * Returns only racks that have at least one available position and meet all resource constraints
 * 
 * racks - Array of floor racks
 * items - Array of mounted devices
 * targetItem - The item to analyze for placement
 * returns Array of racks with available positions
 */
const FindRackPositions = ({ racks, items, targetItem }: ItemPlacementProps): IAvailableRack[] => {
  // Validate target item has minimum required fields
  if (!targetItem.RURequired || targetItem.RURequired === 0) {
    return [];
  }

  const availableRacks: IAvailableRack[] = [];

  for (const rack of racks) {

    // Get available positions for this rack
    const availablePositions = findAvailablePositions(rack, items, targetItem.RURequired);
    // Skip if no physical space available
    if (availablePositions.length === 0) {
      continue;
    }

    // Check resource constraints
    const budgets = getRackRemainingBudgets(rack, items);
    const meetsResourceConstraints = checkResourceConstraints(targetItem, budgets);
    // Only include racks that have space AND meet resource requirements
    if (meetsResourceConstraints) {
      availableRacks.push({
        RackName: rack.RackName,
        EntityName: rack.EntityName,
        EntId: rack.EntId,
        availablePositions: availablePositions,
      });
    }
  }

  return availableRacks;
};

export { FindRackPositions };

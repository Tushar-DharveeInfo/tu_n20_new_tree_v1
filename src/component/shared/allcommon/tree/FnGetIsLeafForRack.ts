import { FEnums } from "../../../constants/Feature";
import { FnProcessStringToCompare } from "../basic/FnProcessStringToCompare";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

/**
 * Determines whether a rack node is a leaf (isLeaf = true/false).
 * - For power cabling features: checks HasMountedPowerDevice > 0 (false if > 0, true if <= 0)
 * - For network cabling features: checks HasMountedNetworkDevice > 0 (false if > 0, true if <= 0)
 * - For server feature: checks HasMountedServer > 0 (false if > 0, true if <= 0)
 * - For configuration features: checks HasChildren > 0 (false if > 0, true if <= 0)
 * - For monitor feature: checks IntelDCMState matches "discovered" or "monitored" (false if match, true otherwise)
 * - For discover feature: checks IntelDCMState is present and not "Monitored" and not "Not Discoverable" (false if match, true otherwise)
 * - For EditFloorLayout / AuditSession: racks cannot be expanded (isLeaf = true)
 * - For other features: checks HasMountedDevice > 0 (false if > 0, true if <= 0)
 * 
 * Only applied to rack nodes; leaves other node types unchanged.
 */
export const FnGetIsLeafForRack = (
    node: ITreeNode,
    featureId?: string | number | null
): boolean => {
    if (node.NodeType && node.NodeType.toLowerCase() !== "rack") {
        return node.isLeaf ?? false;
    }

    const fId = featureId != null ? featureId.toString() : "";

    if (
        fId === FEnums.EditFloorLayout.toString() ||
        fId === FEnums.Relocate.toString() ||
        fId === FEnums.AuditSession.toString()
    ) {
        return true;
    }

    const isPower = [
        FEnums.ReviewPowerCabling.toString(),
        FEnums.PowerTrace.toString(),
        FEnums.PowerNavigate.toString(),
        FEnums.EditPowerCabling.toString(),
    ].includes(fId);

    const isNetwork = [
        FEnums.ReviewNetworkCabling.toString(),
        FEnums.NetworkTrace.toString(),
        FEnums.NetworkNavigate.toString(),
        FEnums.EditNetworkCabling.toString(),
    ].includes(fId);

    const isServer = fId === FEnums.Server.toString();

    const isConfigurationFeature =
        fId === FEnums.AssetConfiguration.toString() ||
        fId === FEnums.ConfigureDevice.toString() ||
        fId === FEnums.InventoryConfiguration.toString();

    if (isPower) {
        const hasMountedPower = Number(node.HasMountedPowerDevice) || 0;
        return hasMountedPower <= 0;
    }

    if (isNetwork) {
        const hasMountedNetwork = Number(node.HasMountedNetworkDevice) || 0;
        return hasMountedNetwork <= 0;
    }

    if (isServer) {
        const hasMountedServer = Number(node.HasMountedServer) || 0;
        return hasMountedServer <= 0;
    }

    if (isConfigurationFeature) {
        const hasChildren = Number(node.HasChildren) || 0;
        return hasChildren <= 0;
    }

    if (fId === FEnums.Monitor.toString()) {
        if (!node.IntelDCMState) {
            return true;
        }
        const states = node.IntelDCMState.split(",").map(s => s.trim().toLowerCase());
        if (states.some(s => s === "discovered" || s === "monitored")) {
            return false;
        }
        return true;
    }

    if (fId === FEnums.Discover.toString()) {
        if (!node.IntelDCMState) {
            return true;
        }
        const states = node.IntelDCMState.split(",").map(s => s.trim());
        if (
            states.some(
                s =>
                    s &&
                    !FnProcessStringToCompare(s, "Monitored") &&
                    !FnProcessStringToCompare(s, "Not Discoverable")
            )
        ) {
            return false;
        }
        return true;
    }

    // features other than above conditions use HasMountedDevice
    const hasMounted = Number(node.HasMountedDevice) || 0;
    return hasMounted <= 0;
};

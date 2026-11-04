import { FEnums } from "../../../constants/Feature";

// This function check whether node should be skipped or not 
const FnCheckToSkipNode = (nodeType: string, featureId: string): boolean => {
    // Define the types that should be skipped for certain featureIds

    const skippableNodeTypesByFeature: Record<string, string[]> = {
        [FEnums.Assets]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Assets
        [FEnums.AssetAssignment]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.AssetAssignment
        [FEnums.AssetAssignmentPlan]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.AssetAssignmentPlan
        [FEnums.Relocate]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port", "MountedDevice"], // Skip these for FeatureId FEnums.Relocate
        [FEnums.AssetPlacement]: ["Location/Device", "Rack/Device", "MountedDevice", "FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.AssetPlacement
        [FEnums.Transfer]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Transfer
        [FEnums.Delete]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Delete
        [FEnums.InboundAssetPlacement]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.InboundAssetPlacement
        [FEnums.ReplacementProfile]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.ReplacementProfile
        [FEnums.Replace]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Replace
        [FEnums.Workorder]: ["Location/Device", "Rack/Device", "MountedDevice", "FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Workorder
        [FEnums.AnalyticsAndCharts]: ["Location/Device", "Rack/Device", "MountedDevice", "FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.AnalyticsAndCharts
        [FEnums.ReviewPowerCabling]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.ReviewPowerCabling
        [FEnums.PowerTrace]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.PowerTrace
        [FEnums.PowerNavigate]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.PowerNavigate
        [FEnums.ReviewNetworkCabling]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.ReviewNetworkCabling
        [FEnums.NetworkTrace]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.NetworkTrace
        [FEnums.NetworkNavigate]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.NetworkNavigate
        [FEnums.MoveAddChange]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.MoveAddChange
        [FEnums.EditPowerCabling]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.EditPowerCabling
        [FEnums.EditNetworkCabling]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.EditNetworkCabling
        [FEnums.Discover]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Discover
        [FEnums.DCMConsole]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.DCMConsole
        [FEnums.Monitor]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Monitor
        [FEnums.Server]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.Server
        [FEnums.AuditSession]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port", "MountedDevice"], // Skip these for FeatureId FEnums.AuditSession
        [FEnums.InventoryCollection]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.InventoryCollection
        [FEnums.InventoryReconciliation]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.InventoryReconciliation
        [FEnums.ModelBusinessService]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.ModelBusinessService
        [FEnums.ManageBusinessService]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.ManageBusinessService
        [FEnums.EditFloorLayout]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port", "MountedDevice"], // Skip these for FeatureId FEnums.EditFloorLayout
        [FEnums.InboundAssets]: ["FrontView/RearView", "PM/Slot/RU/InOutPlug/Port"], // Skip these for FeatureId FEnums.InboundAssets
        // Add other feature-specific skippable node types as needed
    }

    // Check if the current featureId has any skippable node types
    if (skippableNodeTypesByFeature[featureId]) {
        const skippableNodeTypes = skippableNodeTypesByFeature[featureId];
        // Check if the nodeType is part of any skippable hierarchy step
        for (const skipType of skippableNodeTypes) {
            if (skipType.split("/").includes(nodeType)) {

                return true;
            }
        }
    }

    return false; // Do not skip if the nodeType isn't defined for this featureId
}

export { FnCheckToSkipNode }
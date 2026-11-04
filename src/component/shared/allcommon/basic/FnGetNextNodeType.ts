
import { FeatureHierarchies } from "../../alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer";

// this function return the next node type to render 
const FnGetNextNodeType = (featureId: string, nodeType: string): string | null => {
    // get node type index 
    const FnGetNodeTypeIndex = (hierarchy: string[], nodeType: string): number => {
        for (let i = 0; i < hierarchy.length; i++) {
            const types = hierarchy[i].split("/"); // Split combined types like 'Location/FloorDevice'
            if (types.includes(nodeType)) {
                return i;
            }
        }
        return -1; // Return -1 if not found
    }
    const hierarchy = FeatureHierarchies[featureId];
    const currentIndex = FnGetNodeTypeIndex(hierarchy, nodeType);
    if (currentIndex >= 0 && currentIndex < hierarchy.length - 1) {
        return hierarchy[currentIndex + 1];
    }
    return null;
}

export { FnGetNextNodeType }
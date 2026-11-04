
import { useContext } from "react";
import { PlacementContext } from "../contextandprovider/Placement";

const usePlacementContext = () => {
    const context = useContext(PlacementContext);
    if (context === undefined) {
        throw new Error('usePlacementContext must be used within a PlacementProvider');
    }
    return context;
};

export { usePlacementContext };

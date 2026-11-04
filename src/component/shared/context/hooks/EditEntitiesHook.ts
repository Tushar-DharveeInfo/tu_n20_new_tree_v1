
import { useContext } from "react";
import { EditEntitiesContext } from "../contextandprovider/EditEntities";

const useEditEntitiesContext = () => {
    const context = useContext(EditEntitiesContext);
    if (context === undefined) {
        throw new Error('useEditEntitiesContext must be used within an EditEntitiesProvider');
    }
    return context;
};

export { useEditEntitiesContext };


import { useContext } from "react";
import { DragContext } from "../contextandprovider/DragContext";

const useDragContext = () => {
    const context = useContext(DragContext);
    if (context === undefined) {
        throw new Error('useDragContext must be used within a DragProvider');
    }
    return context;
};

export { useDragContext };

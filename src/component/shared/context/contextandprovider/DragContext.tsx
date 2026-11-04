
import { createContext, useMemo, useState, useCallback } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IDrag, IDragItem, IInventoryDeviceDetails, IReloadTree } from "../allinterface/IDrag";

const DragContext = createContext<IDrag | undefined>(undefined);

function DragProvider({ children }: IAppContextWrapper) {

    const [dragItem, setDragItem] = useState<IDragItem>();
    const [reloadTreeFor, setReloadTreeFor] = useState<IReloadTree>();
    const [inventoryDeviceDetails, setInventoryDeviceDetails] = useState<IInventoryDeviceDetails | undefined>();

    const handleSetDragItem = useCallback((item: IDragItem | undefined) => {
        try {
            setDragItem(item);
        } catch (error) {
            console.error("Error setting drag item:", error);
        }
    }, []);

    const handleSetReloadTreeFor = useCallback((reload: IReloadTree | undefined) => {
        try {
            setReloadTreeFor(reload);
        } catch (error) {
            console.error("Error setting reload tree:", error);
        }
    }, []);

    const handleSetInventoryDeviceDetails = useCallback((details: IInventoryDeviceDetails | undefined) => {
        try {
            setInventoryDeviceDetails(details);
        } catch (error) {
            console.error("Error setting inventory device details:", error);
        }
    }, []);

    const providers: IDrag = useMemo(() => ({
        dragItem,
        setDragItem: handleSetDragItem,
        reloadTreeFor,
        setReloadTreeFor: handleSetReloadTreeFor,
        inventoryDeviceDetails,
        setInventoryDeviceDetails: handleSetInventoryDeviceDetails
    }), [dragItem, reloadTreeFor, inventoryDeviceDetails, handleSetDragItem, handleSetReloadTreeFor, handleSetInventoryDeviceDetails]);

    return (
        <DragContext.Provider value={providers} >
            {children}
        </DragContext.Provider>
    );
}

export { DragContext };
export { DragProvider };

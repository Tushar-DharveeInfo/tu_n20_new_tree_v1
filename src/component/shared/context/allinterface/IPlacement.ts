import { IinboundLocation } from "../../allinterface/plan/IPlacementExplorer";


interface IPlacement {
    lastSelectedInboundLocation?: IinboundLocation;
    setLastSelectedInboundLocation: (lastSelectedPlacement?: IinboundLocation) => void
}

export type { IPlacement }
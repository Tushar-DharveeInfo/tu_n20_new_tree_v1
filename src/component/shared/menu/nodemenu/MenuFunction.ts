
import { ChartEntityNameArr } from "../../alldefaultprops/menu/DefaultPropsNodeMenu"
import { FnGetImmediateParentTreeInfoUsingDiv } from "../../allcommon/basic/FnGetImmediateParentTreeInfoUsingDiv"
import { FnGetSessionVariableFromStorage } from "../../allcommon/basic/FnGetSessionVariableFromStorage"
import { INodeMenu } from "../../allinterface/menu/INodeMenu"
import { ISession } from "../../context/allinterface/ISession"
import { ISelectedNodeInfo, ITreeNode } from "../../allinterface/tree/ITreeControl"

const FnHasChildren = (hasChildren: number) => {
    if (hasChildren === 1)
        return true
    else
        return false
}
//////////////////////////////////////////////////////////////////////////
// FnHasChildren()
// {
// If ExplorerNode.HasChildren === 1 then return true else return false
// }
//////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////
// FnHasPowerPort()
// {
// If ExplorerNode.HasPowerPort > 0 then return true else return false
// }
///////////////////////////////////////////////////////////////////////
const FnHasPowerPort = (hasPowerPort: number) => {
    if (hasPowerPort > 0)
        return true
    else
        return false
}

const FnDiagnostic = (diagnosticLevel: boolean) => {
    if (diagnosticLevel) {
        return true
    } else {
        return false
    }
}

// Write a fnIncludeForInUseInventory to use in nodetype prop in feature table to include certain kebab menu when store or bin are “in -use *”
// For node, Store or Bin if name.includes(“in -use”,) offer the kebab menu
const FnIncludeForInUseInventory = (selectedNodeInfo: ISelectedNodeInfo) => {
    if (selectedNodeInfo.node.Name && selectedNodeInfo.node.Name.toLowerCase().includes("in-use")) {
        return true
    } else {
        return false
    }
}

///////////////////////////////////////////////////////////////////////////////////
// FnHasNetworkPort()
// {
// If ExplorerNode.HasNetworkPort > 0 then return true else return false
// }
///////////////////////////////////////////////////////////////////////////////////
// Determine whether the selected node represents a supported device model node.

const FnHasNetworkPort = (HasNetworkPort: number) => {
    if (HasNetworkPort > 0)
        return true
    else
        return false
}

const FnClearWatermark = (SelectedNodeInfo: ITreeNode, isRecordFound: boolean) => {
    if (SelectedNodeInfo.NodeEntityname?.toLowerCase().includes('rack') && isRecordFound) {
        return true
    } else {
        return false
    }
}

const FnClearWatermarkForSubNodes = (SelectedNodeInfo: ITreeNode, isRecordFound: boolean) => {
    if (SelectedNodeInfo.NodeEntityname?.toLowerCase().includes('rack') && isRecordFound && SelectedNodeInfo.children.length > 0) {
        return true
    } else {
        return false
    }
}

/*
For backup 
// function isMatchInFromNode(data: Record<string, any>[], searchValue: string): boolean {
    //     const search = searchValue.toLowerCase();

    //     return data.some((item) => {
    //         const node = item.DCIFromSiteNode;

    //         if (!node) return false;

    //         return Object.values(node).some((value) => {
    //             if (value === null || value === undefined) return false;
    //             return value.toString().toLowerCase().includes(search);
    //         });
    //     });
    // }

    // if (dciRecords && isMatchInFromNode(dciRecords, SelectedNodeInfo.Name as string)) {
    return true;
    // }
    // return false;
*/
const FnDci = (SelectedNodeInfo: ITreeNode, dciRecords: Record<string, any>[] | undefined) => {
    return true;
}


const fnIsInUse = (SelectedNodeInfo: ISelectedNodeInfo, nodeType: string) => {
    if (SelectedNodeInfo.node.ParentNodeType?.toLowerCase()?.includes("in-use")) {
        return false;
    } else {
        if (SelectedNodeInfo?.node?.NodeType && nodeType.includes(SelectedNodeInfo?.node?.NodeType?.toLowerCase())) {
            return true
        }
        return false;
    }
}
const fnAllowCopyPaste = (Managed: boolean, selectedNodeInfo: ISelectedNodeInfo, nodeType: string) => {
    if (Managed) {
        return false
    }
    else {
        if (nodeType && selectedNodeInfo.node.NodeType && nodeType.toLowerCase().includes(selectedNodeInfo.node.NodeType?.toLowerCase()))
            return true
        else
            return false
    }
}


const FnFloorDevice = (SelectedNodeInfo: ISelectedNodeInfo): boolean => {
    const parentNode: any = FnGetImmediateParentTreeInfoUsingDiv(SelectedNodeInfo.node);

    if (
        parentNode &&
        typeof parentNode === "object" &&
        "NodeType" in parentNode && (parentNode?.NodeType === "Floor" ||
            parentNode?.NodeType === "Location")
    ) {
        return true
    } else {
        return false
    }

};
/////////////////////////////////////////////////////////////////////////////
//We are returning NodeType = RU and PortStatus: MountedFilled
//FnRUNormalAllowed - PortStatus <> MountedFilled AND (PortStatus <> Normal)
//FnRUNormal: PortStatus is Normal

// Offer Normal RU – FnRUNormalAllowed 
// Offer BAD, Reserved, Block – FnRUNormal
/////////////////////////////////////////////////////////////////////////////
const FnRUNormalAllowed = (SelectedNodeInfo: ISelectedNodeInfo) => {

    if ((SelectedNodeInfo?.node?.NodeType === "RU") &&
        (SelectedNodeInfo?.node?.PortStatus !== null && (SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "blocked" || SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "reserved"))) {
        return true
    } else {
        return false
    }
}
const FnRUNormal = (SelectedNodeInfo: ISelectedNodeInfo) => {

    if ((SelectedNodeInfo?.node?.NodeType === "RU") &&
        (SelectedNodeInfo?.node?.PortStatus === null || SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "normal")) {

        return true
    } else {
        return false
    }
}

//////////////////////////////////////////////////////////////////////////////////////////
// for Port
// FnPortNormalAllowed - PortStatus <> Cabled AND(PortStatus <> Normal)
// FnPortNormal: PortStatus is Normal
// FnPortCabled - PortStatus <> Cabled

// Offer Normal RU – FnPortNormalAllowed 
// Offer BAD, Reserved, Block – FnPortNormal

// Offer Disconnect cable, Disconnect Port: FnPortCabled
/////////////////////////////////////////////////////////////////////////////////////////////
const FnPortNormalAllowed = (SelectedNodeInfo: ISelectedNodeInfo, props: INodeMenu) => {
    if (props.container === "cabling_componet_deviceA" && SelectedNodeInfo?.node?.FromDevicePortStatus?.toLowerCase() === "normal") {
        return false
    }
    else if (props.container === "cabling_componet_deviceC" && SelectedNodeInfo?.node?.ToDevicePortStatus?.toLowerCase() === "normal") {
        return false
    } else if ((props.container === "cabling_componet_deviceA" && SelectedNodeInfo?.node?.FromDevicePortStatus.toLowerCase() === "connected")
        || (props.container === "cabling_componet_deviceC" && SelectedNodeInfo?.node?.ToDevicePortStatus.toLowerCase() === "connected")) {
        return false
    }
    else {
        if (props.container === "cabling_componet_deviceA" &&
            SelectedNodeInfo?.node?.FromDevicePortStatus &&
            !SelectedNodeInfo?.node?.FromDevicePortStatus.toLowerCase().includes("portid") &&
            SelectedNodeInfo?.node?.FromDevicePortStatus.toLowerCase() !== "cabled") {
            return true
        } if (props.container === "cabling_componet_deviceC" &&
            SelectedNodeInfo?.node?.ToDevicePortStatus &&
            !SelectedNodeInfo?.node?.ToDevicePortStatus.toLowerCase().includes("portid") &&
            SelectedNodeInfo?.node?.ToDevicePortStatus.toLowerCase() !== "cabled") {
            return true
        } else {
            return false
        }
    }

}
const FnPortNormal = (SelectedNodeInfo: ISelectedNodeInfo, props: INodeMenu) => {
    if (props.container === "cabling_componet_deviceA" && (SelectedNodeInfo?.node?.FromDevicePortStatus?.toLowerCase() === "normal" || SelectedNodeInfo?.node?.FromDevicePortStatus === null || !SelectedNodeInfo?.node?.FromDevicePortStatus)) {
        return true
    } else if (props.container === "cabling_componet_deviceC" && (SelectedNodeInfo?.node?.ToDevicePortStatus?.toLowerCase() === "normal" || SelectedNodeInfo?.node?.ToDevicePortStatus === null || !SelectedNodeInfo?.node?.ToDevicePortStatus)) {
        return true
    } else {
        return false
    }

}


////////////////////////////////////////////////////////////////////////////
// FnPortConnected()
// {
// If ExplorerNode.PortStatus<> ”Cabled” then return true else return false
// }
/////////////////////////////////////////////////////////////////////////////
const FnPortConnected = (SelectedNodeInfo: ISelectedNodeInfo, props: INodeMenu) => {
    if (props.container === "cabling_componet_deviceA" || props.container === "cabling_componet_deviceC") {
        if ((props.container === "cabling_componet_deviceA" && SelectedNodeInfo?.node?.FromDevicePortNodeType === "DevicePortNode" && (SelectedNodeInfo?.node?.FromDevicePortStatus && SelectedNodeInfo?.node?.FromDevicePortStatus?.toLowerCase().includes("portid")))
            || (props.container === "cabling_componet_deviceC" && SelectedNodeInfo?.node?.ToDevicePortNodeType === "DevicePortNode" && (SelectedNodeInfo?.node?.ToDevicePortStatus && SelectedNodeInfo?.node?.ToDevicePortStatus?.toLowerCase().includes("portid")))) {
            return true
        } else {
            return false
        }
    } else {
        if (SelectedNodeInfo?.node?.NodeType === "Port" && (SelectedNodeInfo.node.PortStatus?.toLowerCase() === "cabled")) {
            return true
        } else {
            return false
        }
    }

}

/////////////////////////////////////////////////////////////////////////
// FnDiscoverable
// {
// If ExplorerNode.NodeType ===”Device” then return true else return false
// }
/////////////////////////////////////////////////////////////////////////
const FnDiscoverable = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo.node.NodeType === "Site" || SelectedNodeInfo.node.NodeType === "Room"
        || SelectedNodeInfo.node.NodeType === "Floor" || SelectedNodeInfo.node.NodeType === "Location"
        || SelectedNodeInfo.node.NodeType === "Rack"
    ) {
        return true
    }
    else if ((SelectedNodeInfo.node.NodeType?.toLowerCase() === "device" || SelectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") && (SelectedNodeInfo.node.IntelDCMState?.toLowerCase() === "discoverable" || SelectedNodeInfo.node.IntelDCMState?.toLowerCase() === "discovered")) {
        return true;
    }
    else { return false }
}

const fnDiscovered = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo.node.NodeType?.toLowerCase() === "device" || SelectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") && SelectedNodeInfo.node.IntelDCMState?.toLowerCase() === "discovered") {
        return true;
    }
    else { return false }
}

const fnMonitored = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo.node.NodeType?.toLowerCase() === "device" || SelectedNodeInfo.node.NodeType?.toLowerCase() === "mounteddevice") && SelectedNodeInfo.node.IntelDCMState?.toLowerCase() === "monitored") {
        return true;
    }
    else { return false }
}
///////////////////////////////////////////////////////////////////////////////////
// FnMonitorable
// {
// If ExplorerNode.NodeType ===”Device” then return true else return false
// }
///////////////////////////////////////////////////////////////////////////////////
const FnMonitorable = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo.node.NodeType === "Device") {
        return true
    } else { return false }
}
////////////////////////////////////////////////////////////////////////////////
// FnPortMapNeeded()
// {
// If ExplorerNode.EntityName ===”_PatchPanel” then return true else return false
// }
////////////////////////////////////////////////////////////////////////////////

const FnPortMapNeeded = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo?.node?.NodeEntityname === "_PatchPanel") {
        return true
    } else {
        return false
    }
}
////////////////////////////////////////////////////////////////////////////////////
// FnPasteSource;//defined in NZPG.Session.pasteSource  in Session table
// {
//     If(Explorer.Node.NodeType
//         in (Floor; SubFloor; Ceiling; Wall; Location) OR FnSlotAvailable) AND(NZPG.Session.pasteSource<> ””) then return true else return false
// }
////////////////////////////////////////////////////////////////////////////////////
const FnPasteSource = (SelectedNodeInfo: ISelectedNodeInfo, sessionData: ISession[], Managed: boolean) => {

    if (sessionData) {
        let PasteSource = sessionData.find((item) => {
            return item.VariableName === "PasteSource" ? item : null
        })
        if (((SelectedNodeInfo.node.NodeType === "Floor" ||
            SelectedNodeInfo.node.NodeType === "SubFloor" ||
            SelectedNodeInfo.node.NodeType === "Ceiling" ||
            SelectedNodeInfo.node.NodeType === "Bin" ||
            SelectedNodeInfo.node.NodeType === "Wall" ||
            SelectedNodeInfo.node.NodeType === "Location") ||
            FnSlotAvailable(SelectedNodeInfo)) &&
            PasteSource && PasteSource.SessionValue !== "") {
            if (Managed) {
                return false
            }
            else {
                return true
            }
        } else {
            return false
        }
    }
}
//////////////////////////////////////////////////////////////////////////////
//     FnDeviceImportBin()
//     {
//         If((ExplorerNode.NodeType ===”Bin”) AND
//             (ExplorerNode.Name =”New” OR  ExplorerNode.Name =”Other”))
//  then return true else return false
//     }
/////////////////////////////////////////////////////////////////////////////////////
const FnDeviceImportBin = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo.node.NodeType === "Bin") && (SelectedNodeInfo?.node?.Name === "New" || SelectedNodeInfo?.node?.Name === "Other")) {
        return true
    } else {
        return false
    }
}
///////////////////////////////////////////////////////////////////////////////////////
// FnPowerCableImportBin()
// {
//     If((ExplorerNode.NodeType ===”Bin”) AND
//         (ExplorerNode.Name =”Network Cables” OR ExplorerNode.Name =”Power Cables”))
//  then return true else return false
// }

///////////////////////////////////////////////////////////////////////////////////////
const FnPowerCableImportBin = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo.node.NodeType === "Bin") && SelectedNodeInfo?.node?.Name === "Power Cables") {
        return true
    } else {
        return false
    }
}
///////////////////////////////////////////////////////////////////////////////////////

// FnNetworkCableImportBin()
// {
//     If((ExplorerNode.NodeType ===”Bin”) AND
//         (ExplorerNode.Name =”Network Cables” OR  ExplorerNode.Name =”Power Cables”))
//  then return true else return false
// }
///////////////////////////////////////////////////////////////////////////////////////

const FnNetworkCableImportBin = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo.node.NodeType === "Bin") && SelectedNodeInfo?.node?.Name === "Network Cables") {
        return true
    } else {
        return false
    }
}
///////////////////////////////////////////////////////////////////////////////////////
// FnBinMoveToUnused;
//{
//         If(<Node>.NodeType===Bin and <Node>.Type===New or Other) return true else return false
// }
///////////////////////////////////////////////////////////////////////////////////////
const FnBinMoveToUnused = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo?.node?.NodeType === "Bin" && (SelectedNodeInfo?.node?.Type === "New" || SelectedNodeInfo?.node?.Type === "Other")) {
        return true;
    } else {
        return false;
    }
}
///////////////////////////////////////////////////////////////////////////////////////
//FnBinMoveToDisposable;
//{
//         If((<Node>.NodeType===Bin and <Node>.Type ===Unused) return true else return false
//}
///////////////////////////////////////////////////////////////////////////////////////
const FnBinMoveToDisposable = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo?.node?.NodeType === "Bin" && SelectedNodeInfo?.node?.Type === "Unused") {
        return true
    } else {
        return false
    }
}
///////////////////////////////////////////////////////////////////////////////////////
//FnBinDispose;
//{
//                 If((<Node>.NodeType===Bin and <Node>.Type ===Disposable) return true else return false
//}    
///////////////////////////////////////////////////////////////////////////////////////
const FnBinDispose = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo?.node?.NodeType === "Bin" && SelectedNodeInfo?.node?.Type === "Disposable") {
        return true
    } else {
        return false
    }
}
///////////////////////////////////////////////////////////////////////////////////////
// FnSwapMountedDevice
// {
//returns true if mounted device views can be swapped
//     If(NodeType === MountedDevice AND(ParentNode.NodeType === SLOT OR(ParentNode.NodeType === RU)
// Then Return true
// Else return false
// }
/////////////////////////////////////////////////////////////////////////////////////
const FnSwapMountedDevice = (SelectedNodeInfo: ISelectedNodeInfo) => {
    const ParentNode: any = FnGetImmediateParentTreeInfoUsingDiv(SelectedNodeInfo.node)
    if (SelectedNodeInfo?.node?.MountedDeviceID && (ParentNode?.NodeType === "SLOT" || ParentNode?.NodeType === "RU")) {
        return true
    } else {
        return false
    }
}

/////////////////////////////////////////////////////////////////////////////////////
// FnSlotAvailable(); used for RU, Slot and PORT only
// {//We are sending status or RU, Slot also as a PortStatus
// If ExplorerNode.PortStatus === “Avaialble” or "0”) then return true else return false
// }
/////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////
//     TU - You developed this function, please remove this one
//     FnSlotAvailable

// Now Develop these functions
//     a.FnRUAvailable		check NodeType = RU
//     b.FnSlotAvailable		check NodeType = SLOT
//     c.FnPortAvailable		check NodeType = Port
//     d.FnPortConnected
//     {
//         a.Return false; this logic will be implemented after cabling is done.
// }

//     e.FnFloorDevice
//     {
//         if (ParentEntID.NodeType === Floor or ParentEntID.NodeType === Location) 
// then Return true 
// else return false
// }
/////////////////////////////////////////////////////////////////////////////////////////

const FnRUAvailable = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo?.node?.NodeType === "RU" && (SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "available" ||
        SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "normal" ||
        SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "" || SelectedNodeInfo?.node?.PortStatus === null))) {
        return true
    }
    else {
        return false
    }
}
const FnSlotAvailable = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo?.node?.NodeType?.toLowerCase() === "slot" && (SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "available" ||
        SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "normal" ||
        SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "" || SelectedNodeInfo?.node?.PortStatus === null))) {
        return true
    }
    else {
        return false
    }
}
const FnPortAvailable = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if ((SelectedNodeInfo?.node?.NodeType?.toLowerCase() === "port" && (SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "available" ||
        SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "normal" ||
        SelectedNodeInfo?.node?.PortStatus?.toLowerCase() === "" || SelectedNodeInfo?.node?.PortStatus === null))) {
        return true
    }
    else {
        return false
    }
}

const FnMapPort = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo.node.IsPatchPort) {
        return true
    } else {
        return false
    }
}

// Audit Session RTM Functions

/**
 * Show Approve
 * Condition:
 * - Audit Session is created
 * - Not approved
 * - Not opened
 * - Not closed
 */
const IsSelectedAuditSessionApprove = (
    SelectedNodeInfo: ISelectedNodeInfo
): boolean => {

    const node = SelectedNodeInfo?.node;

    return !!(
        node?.DateCreated &&
        !node?.DateApproved &&
        !node?.OpenDate &&
        !node?.CloseDate
    );
};

/**
 * Show Unapprove
 * Condition:
 * - Audit Session is created
 * - Approved
 * - Not opened
 * - Not closed
 */
const IsSelectedAuditSessionUnapprove = (
    SelectedNodeInfo: ISelectedNodeInfo
): boolean => {

    const node = SelectedNodeInfo?.node;

    return !!(
        node?.DateCreated &&
        node?.DateApproved &&
        !node?.OpenDate &&
        node?.AuditSessionStatus?.toLowerCase() !== "reject" &&
        !node?.CloseDate
    );
};

/**
 * Show Reject
 * Condition:
 * - Session is currently open
 * - Status is not already Rejected
 */
const IsSelectedAuditSessionReject = (
    SelectedNodeInfo: ISelectedNodeInfo
): boolean => {

    const node = SelectedNodeInfo?.node;

    return !!(
        node?.OpenDate &&
        node?.AuditSessionStatus?.toLowerCase() !== "reject" &&
        node?.AuditSessionProgress?.toLowerCase() !== "executed"
    );
};

/**
 * Show Open
 * Conditions:
 * 1. Approved but not yet opened
 * OR
 * 2. Closed session that is not Executed
 *    and not Rejected
 */
const IsSelectedAuditSessionOpen = (
    SelectedNodeInfo: ISelectedNodeInfo
): boolean => {

    const node = SelectedNodeInfo?.node;

    return !!(
        (
            node?.DateCreated &&
            node?.DateApproved &&
            !node?.OpenDate &&
            node?.AuditSessionStatus?.toLowerCase() !== "reject" &&
            !node?.CloseDate
        ) ||
        (
            node?.CloseDate &&
            node?.AuditSessionProgress?.toLowerCase() !== "executed" &&
            node?.AuditSessionStatus?.toLowerCase() !== "reject"
        )
    );
};

/**
 * Show Close
 * Condition:
 * - Created
 * - Approved
 * - Opened
 * - Not yet closed
 */
const IsSelectedAuditSessionClose = (
    SelectedNodeInfo: ISelectedNodeInfo
): boolean => {

    const node = SelectedNodeInfo?.node;

    return !!(
        node?.DateCreated &&
        node?.DateApproved &&
        node?.OpenDate &&
        node?.AuditSessionStatus?.toLowerCase() !== "reject" &&
        !node?.CloseDate
    );
};

/**
 * Show Snapshot
 * Condition:
 * - Created
 * - Approved
 * - Opened
 * - Not yet closed
 */
const IsSelectedAuditSessionSnapshot = (
    SelectedNodeInfo: ISelectedNodeInfo
): boolean => {

    const node = SelectedNodeInfo?.node;

    return !!(
        node?.DateCreated &&
        node?.DateApproved &&
        node?.OpenDate &&
        node?.AuditSessionStatus?.toLowerCase() !== "reject" &&
        !node?.CloseDate
    );
};

/**
 * Show Delete
 * Condition:
 * - Not an AuditSessions node
 * - No audited inventory/devices exist
 */
const IsSelectedAuditSessionDelete = (
    SelectedNodeInfo: ISelectedNodeInfo
): boolean => {

    const node = SelectedNodeInfo?.node;

    return !!(
        node?.DateCreated &&
        node?.NodeType &&
        node.NodeType.toLowerCase() !== "auditsessions" &&
        !node.TotalAuditedDevices
    );
};

// IsSelectedAuditSession
// If (AuditSessionNode AND
// SelectedAuditsession.DateCreated = true	AND
// SelectedAuditsession.DateApproved = true 	AND
// SelectedAuditsession. OpenDate = true 		AND
// SelectedAuditsession. CloseDate = true
// ) return =true
// else if !SelectedAuditsession.DateApproved return true;  else return false;
const IsSelectedAuditSession = (SelectedNodeInfo: ISelectedNodeInfo) => {
    if (SelectedNodeInfo?.node && SelectedNodeInfo.node.NodeType && SelectedNodeInfo.node.NodeType.toLowerCase() !== "auditsessions"
        && (SelectedNodeInfo?.node?.CloseDate || SelectedNodeInfo?.node?.TotalAuditedDevices)) {
        return true;
    }
    else {
        return false;
    }
}

// Function  IsAdminNZTaskNode
// If (NZTaskNode AND
//     Session.RequestedBy.LoginUserBasicRoleName = “Admin”
// ) return =true else return false;
const IsAdminNZTaskNode = (SelectedNodeInfo: ISelectedNodeInfo) => {
    const sessionVar = FnGetSessionVariableFromStorage("RequestedBy", "LoginUserBasicRoleName");
    if (SelectedNodeInfo && sessionVar && sessionVar?.length > 0 && sessionVar[0].SessionValue === "Admin") {
        return true;
    }
    else {
        return false;
    }
}

// Function  IsAdminNZSessionNode
// If (NZSessionNode AND
//     Session.RequestedBy.LoginUserBasicRoleName = “Admin”
// ) return =true else return false;
const IsAdminNZSessionNode = (SelectedNodeInfo: ISelectedNodeInfo) => {
    const sessionVar = FnGetSessionVariableFromStorage("RequestedBy", "LoginUserBasicRoleName");
    if (SelectedNodeInfo && sessionVar && sessionVar?.length > 0 && sessionVar[0].SessionValue === "Admin") {
        return true;
    }
    else {
        return false;
    }
}

// Function  IsAdminNZWinSVCNode
// If (NZWinSVCNode AND
//     Session.RequestedBy.LoginUserBasicRoleName = “Admin”
// ) return =true else return false;
const IsAdminNZWinSVCNode = (SelectedNodeInfo: ISelectedNodeInfo) => {
    const sessionVar = FnGetSessionVariableFromStorage("RequestedBy", "LoginUserBasicRoleName");
    if (SelectedNodeInfo && sessionVar && sessionVar?.length > 0 && sessionVar[0].SessionValue === "Admin") {
        return true;
    }
    else {
        return false;
    }
}
const FnMigrationEnabled = (SelectedNodeInfo: ISelectedNodeInfo) => {
    return true
}
const FnCharts = (SelectedNodeInfo: ISelectedNodeInfo, nodeType: string) => {
    const splitData: string[] = nodeType.split(";").map(item => item.trim());
    if (SelectedNodeInfo.node.NodeEntityname && splitData.includes(SelectedNodeInfo.node.NodeEntityname)) {
        if (ChartEntityNameArr.EntityNames.includes(SelectedNodeInfo.node.NodeEntityname)) {
            return true
        } else {
            return true
        }
    } else {
        return false
    }
}
const FnDeviceModel = (selectedNode: ITreeNode): boolean => {
    return (
        (
            selectedNode.Name?.toLowerCase() === "spare devices" &&
            selectedNode.NodeType?.toLowerCase() === "store"
        ) ||
        (
            ["new", "other"].includes(
                selectedNode.Name?.toLowerCase() ?? ""
            ) &&
            selectedNode.NodeType?.toLowerCase() === "bin"
        )
    );
};

const FnCableModel = (selectedNode: ITreeNode): boolean => {
    const name = selectedNode.Name?.toLowerCase() ?? "";
    const nodeType = selectedNode.NodeType?.toLowerCase() ?? "";
    const type = selectedNode.Type?.toLowerCase() ?? "";
    return (
        type === "all cables" ||
        ((nodeType === "bin" || nodeType === "store") &&
            (name === "network cables" || name === "power cables" || name === "all cables"))
    );
}
export {
    FnBinDispose, FnBinMoveToDisposable, FnRUNormal, FnRUNormalAllowed
    , FnBinMoveToUnused, FnCharts, FnDeviceImportBin, FnDiscoverable, FnFloorDevice
    , FnHasChildren, FnHasNetworkPort, FnHasPowerPort, FnMapPort, FnMigrationEnabled, FnMonitorable
    , FnNetworkCableImportBin, FnPasteSource, FnPortAvailable, FnPortConnected, FnPortMapNeeded
    , FnPortNormal, FnPortNormalAllowed, FnPowerCableImportBin, FnRUAvailable, FnSlotAvailable, FnSwapMountedDevice, IsAdminNZSessionNode, IsAdminNZTaskNode
    , IsAdminNZWinSVCNode, IsSelectedAuditSessionApprove
    , IsSelectedAuditSessionUnapprove, IsSelectedAuditSessionClose
    , IsSelectedAuditSessionDelete, IsSelectedAuditSessionOpen, IsSelectedAuditSessionReject
    , IsSelectedAuditSessionSnapshot, FnDci, fnAllowCopyPaste
    , IsSelectedAuditSession, fnIsInUse, fnDiscovered, fnMonitored, FnDiagnostic, FnIncludeForInUseInventory,
    FnClearWatermarkForSubNodes, FnClearWatermark, FnCableModel, FnDeviceModel

}
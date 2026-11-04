import { SESSION } from "../interceptors/EndPoints";
import { axiosInterceptor } from "../interceptors/Interceptor";
import { FEnums } from "../../constants/Feature";
import { FnHandleAPIResponse } from "./basic/FnHandleAPIResponse";
import { FnProcessStringToCompare } from "./basic/FnProcessStringToCompare";
import { ISessionVariable } from "../allinterface/basic/ISessionVariable";
import { ISessionContextProps } from "../context/allinterface/ISession";
import { IStatusBar } from "../context/allinterface/IStatusBar";
import { ReuseDataForFeatures } from "../alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer";
import { ITreeNode } from "../allinterface/tree/ITreeControl";

const FnCallApiToUpdateSessionForExpandedNodes = async (expandedNodes: ITreeNode[], selectedNodeInfo: ITreeNode, featureId: string, sessionContext: ISessionContextProps, statusBarContext: IStatusBar) => {
    const sessionData: ISessionVariable[] = [];
    try {

        if (expandedNodes && expandedNodes.length > 0) {
            expandedNodes.forEach((element: ITreeNode) => {
                if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Site")) {
                    sessionData.push({ VariableContext: "Location", VariableName: "SiteName", SessionValue: element.Name });
                    sessionData.push({ VariableContext: "Location", VariableName: "SiteID", SessionValue: element.NodeEntID });
                }
                if (featureId === FEnums.InventoryManagement || featureId === FEnums.InventoryConfiguration) {
                    if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Inventory")) {
                        sessionData.push({ VariableContext: "Inventory", VariableName: "InventoryName", SessionValue: element.Name });
                        sessionData.push({ VariableContext: "Inventory", VariableName: "InventoryID", SessionValue: element.NodeEntID });
                    }
                    else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Store")) {
                        sessionData.push({ VariableContext: "Inventory", VariableName: "StoreName", SessionValue: element.Name });
                        sessionData.push({ VariableContext: "Inventory", VariableName: "StoreID", SessionValue: element.NodeEntID });
                    }
                    else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Bin")) {
                        sessionData.push({ VariableContext: "Inventory", VariableName: "BinName", SessionValue: element.Name });
                        sessionData.push({ VariableContext: "Inventory", VariableName: "BinID", SessionValue: element.NodeEntID });
                    }
                    else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Mfg")) {
                        sessionData.push({ VariableContext: "Inventory", VariableName: "MfgName", SessionValue: element.Name });
                    }
                    else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Eqtype")) {
                        sessionData.push({ VariableContext: "Inventory", VariableName: "EqTypeName", SessionValue: element.Name });
                    }
                }
                else {
                    if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Room")) {
                        sessionData.push({ VariableContext: "Location", VariableName: "RoomName", SessionValue: element.Name });
                        sessionData.push({ VariableContext: "Location", VariableName: "RoomID", SessionValue: element.NodeEntID });
                    }
                    else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Floor")) {
                        sessionData.push({ VariableContext: "Location", VariableName: "FloorName", SessionValue: element.Name });
                        sessionData.push({ VariableContext: "Location", VariableName: "FloorID", SessionValue: element.NodeEntID });
                    }
                    else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Location")) {
                        sessionData.push({ VariableContext: "Location", VariableName: "LocationName", SessionValue: element.Name });
                        sessionData.push({ VariableContext: "Location", VariableName: "LocationID", SessionValue: element.NodeEntID });
                    }
                    else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Tenant")) {
                        const splitResult = element.NodeEntID ? element.NodeEntID.split("##") : [];
                        sessionData.push({ VariableContext: "Filter", VariableName: "TenantName", SessionValue: element.Name });
                        sessionData.push({ VariableContext: "Filter", VariableName: "TenantID", SessionValue: splitResult.length > 0 ? splitResult[0] : element.NodeEntID });
                    }
                }
            });
            if (selectedNodeInfo) {
                sessionData.push({ VariableContext: "Location", VariableName: `${selectedNodeInfo.NodeType}ID`, SessionValue: selectedNodeInfo.NodeEntID });
                sessionData.push({ VariableContext: "Location", VariableName: `${selectedNodeInfo.NodeType}Name`, SessionValue: selectedNodeInfo.Name });
                sessionData.push({ VariableContext: "Node", VariableName: "SelectedNodeID", SessionValue: selectedNodeInfo.NodeEntID });
                sessionData.push({ VariableContext: "Node", VariableName: "SelectedNodeName", SessionValue: selectedNodeInfo.Name });
                sessionData.push({ VariableContext: "Node", VariableName: "SelectedNodeEntity", SessionValue: selectedNodeInfo.NodeEntityname });
            }
            if (sessionData.length > 0 && (ReuseDataForFeatures.includes(featureId) || featureId === FEnums.SelectDataCenterSite.toString()
                || featureId === FEnums.InventoryManagement.toString()
                || featureId === FEnums.InventoryConfiguration.toString())) {
                //API call to update session

                const handleApiForSessionUpdate = (sessionUpdateApiResponse: unknown) => {
                    if (sessionUpdateApiResponse && typeof sessionUpdateApiResponse === "object" && 'jsonSessionOutput' in sessionUpdateApiResponse) {
                        const parsedData = FnHandleAPIResponse(sessionUpdateApiResponse.jsonSessionOutput, "Dataset")
                        if (parsedData && parsedData.length > 0) {
                            sessionContext.setSessionList(parsedData);
                        }
                    }
                }
                // Call API to get florr device configuration
                await axiosInterceptor({
                    url: SESSION.UpdateSession,
                    data: {
                        jsonSession: JSON.stringify(sessionData)
                    },
                    setFetchData: handleApiForSessionUpdate
                }, statusBarContext);
            }
        }
    } catch (error) {
        console.error(
            "Error in function(FnCallApiToUpdateSessionForExpandedNodes): ",
            error
        );
    }
}

export { FnCallApiToUpdateSessionForExpandedNodes }
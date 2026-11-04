
import { FEnums } from "../../../constants/Feature";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { EntityNameEnums } from "../../alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { AppQA } from "../../../constants/Feature";

//This function return whether checkbox on node allowed or not
const FnCheckAllowCheckbox = (treeNode: ITreeNode, featureId: string, instanceName?: string) => {
    try {
        if (featureId.toString() === AppQA.Settings || featureId.toString() === AppQA.Entities) {
            if (instanceName === "SecureData_tree") {
                return true;
            }
            if (treeNode.NodeType === "Floor" || treeNode.NodeType === "AlertProfileNode" || treeNode.NodeType === "Site" || treeNode.NodeType === "Room"
                || treeNode.NodeType === "SecuredDataNode" || treeNode.NodeType === "SecuredData"
                || (treeNode.GroupName && treeNode.GroupName?.length > 0 && treeNode.NodeType === "RoleNode")
                || treeNode.NodeType === "AppQA" || treeNode.NodeType === "Menu" || treeNode.NodeType === "AppQANode"
                || treeNode.NodeType === "MenuNode" || treeNode.NodeType === "FeatureNode" || treeNode.NodeType === "Features"
                || treeNode.treetype === "Dataset" || treeNode.treetype === "HWEntity" || treeNode.treetype === "ReportProfile"
                || treeNode.NodeType === "EntityNode" || treeNode.NodeType === "TableNode"
                || treeNode.NodeType === "ReportProfile" || treeNode.NodeType === "ReportProfileNode" || treeNode.NodeType === "Report"
                || treeNode.NodeEntityname === "ReportProfile" || treeNode.NodeEntityname === EntityNameEnums.ReportProfile
            )
                return true;
            else if ((instanceName === "report_delivery" && treeNode.NodeEntityname === EntityNameEnums.ReportProfile)
                || (instanceName === "alert_delivery" && treeNode.NodeEntityname === EntityNameEnums.AlertProfile)) {
                return true
            }
            else
                return false;
        }
        else if (featureId.toString() === FEnums.InventoryManagement || featureId.toString() === FEnums.InventoryConfiguration) {
            if (treeNode.PGClassName?.toLowerCase()?.includes("cable")) {
                return false
            }
            else if (treeNode.NodeType?.toLowerCase() === "device" || treeNode.NodeType?.toLowerCase() === "rack" || treeNode.NodeType?.toLowerCase() === "mounteddevice"
                || treeNode.NodeType?.toLowerCase() === "tablenode" || treeNode.NodeType?.toLowerCase() === "entitynode") {
                return true;
            }
            return false;
        }
        else if (featureId.toString() === FEnums.ConfigureDevice || featureId.toString() === FEnums.MoveAddChange) {
            if (treeNode.NodeType?.toLowerCase() === "device" || treeNode.NodeType?.toLowerCase() === "rack" || (treeNode.MountedDeviceID && (treeNode.NodeType?.toLowerCase() === "frontview" || treeNode.NodeType?.toLowerCase() === "rearview"))
                || treeNode.NodeType?.toLowerCase() === "tablenode" || treeNode.NodeType?.toLowerCase() === "entitynode") {
                return true;
            }
            return false;
        }
        const showCheckbox = treeNode.NodeType === "Site" || treeNode.NodeType === "Room"
            || treeNode.NodeType === "Floor" || treeNode.NodeType === "Location"
            || ((treeNode.NodeType === "Device" || treeNode.NodeType === "MountedDevice") && (
                featureId.toString() !== FEnums.EditPowerCabling
                && featureId.toString() !== FEnums.EditNetworkCabling))
            || treeNode.NodeType === "FrontView"
            || treeNode.NodeType === "Rack"
            || treeNode.NodeType === "RearView"
            || treeNode.NodeType?.toLowerCase() === "port"
            || treeNode.treetype?.toLowerCase() === "deviceslot"
            || treeNode.NodeType === "EntityVsTable" ? false : true;

        return showCheckbox;
    } catch (error) {
        console.error(
            "Error in function(FnCheckAllowCheckbox): ",
            error
        );
        return false;
    }
}
export { FnCheckAllowCheckbox }
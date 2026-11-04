import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Key } from 'rc-tree/lib/interface'
import { CheckInfo } from 'rc-tree/lib/Tree'
import { NodeDragEventParams } from 'rc-tree/lib/contextTypes'
import { Device, getObjectTemplate, Location } from '@n20a/liblayout'
import { AcceptNumberForm, ConfigureMounting, IMountingConfig, IWorkorderRecord, SelectWorkorder } from '@n20a/libform'

import '@n20a/libform/style.css'
import '../allcss/DCExplorerContainer.css'

import { useCommonVariableContext } from '../context/hooks/CommonVariableHooks.ts'
import { useDragContext } from '../context/hooks/DragHooks.ts'
import { useExplorerTreeContext } from '../context/hooks/ExplorerTreeHooks.ts'
import { useMainAppContext } from '../context/hooks/MainAppHooks.ts'
import { useSelectedNodeContext } from '../context/hooks/SelectedNodeHooks.ts'
import { useSessionContext } from '../context/hooks/SessionHooks.ts'
import { useStatusBarContext } from '../context/hooks/StatusBarHooks.ts'
import { FnApproveWorkorderApiCall, FnAutoExecuteWorkOrder, FnCallApiForUpdateDeviceWoProfile, FnCreateWorkOrderApiCalls, FnGetWorkOrderProfile, FnReturnNodeNameObject } from '../../appcontainer/allcommon/FnCreateWorkOrderApiCalls.ts'
import { FnBuildStatusBarObject } from '../../appcontainer/allcommon/FnBuildStatusBarObject.ts'
import { FnCreateForensiclog } from '../../appcontainer/allcommon/FnCreateForensiclog.ts'
import { FnGetDeviceIdFromEntID } from '../../appcontainer/allcommon/FnGetDeviceIdFromEntID.ts'
import { FnOrderSubNodes } from '../../appcontainer/allcommon/FnOrderSubNodes.ts'
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely.ts'
import { FnUpdateStatisticsAndRefresh } from '../../appcontainer/allcommon/FnUpdateStatisticsAndRefresh.ts'
import { FindInInventoryVariables, TreeNodeTypes } from '../../appcontainer/alldefaultprops/DefaultPropsFeatureContainer.ts'
import { LogGroupName, LogName, LogSubGroupName } from '../../appcontainer/alldefaultprops/DefaultPropsForensiclog.ts'
import { FnGenerateUniqueId } from '../allcommon/basic/FnGenerateUniqueId.ts'
import { FEnums, RightMouseMenuTreeNode } from '../../constants/Feature.ts'
import { FnCallApiToUpdateSessionForExpandedNodes } from '../allcommon/FnCallApiToUpdateSessionForExpandedNodes.ts'
import { FnFindNearestNodeByType } from '../allcommon/FnFindNearestNodeByType.ts'
import { FnGetFilterDataUsingType } from '../allcommon/FnGetFilterDataUsingType.ts'
import { FnGetParentObjGivenTreeTypeTreeUsingDiv } from '../allcommon/FnGetParentObjGivenTreeTypeTreeUsingDiv.ts'
import { FnGetParentTreeInfoUsingDiv } from '../allcommon/FnGetParentTreeInfoUsingDiv.ts'
import { FnNavigateToWorkOrder } from '../allcommon/FnNavigateToWorkOrder.ts'
import { FnRemoveNodesByKeys } from '../allcommon/FnRemoveNodesByKeys.ts'
import { FnSearchKeywordInLocalTree } from '../allcommon/FnSearchKeywordInLocalTree.ts'
import { FnFetchSearchKeywordNew, FnTraverseHierarchyRecord, ISearchKeywordNewRecord } from '../allcommon/FnSearchKeywordUsingAPICall.ts'
import { FnUpdateTreeNodesBasedOnFeatureId } from '../allcommon/FnUpdateTreeNodesBasedOnFeatureId.ts'
import { FnUpdateVisibleTreeData } from '../allcommon/FnUpdateVisibleTreeData.ts'
import { FnDeepClone } from '../allcommon/basic/FnDeepClone.ts'
import { FnHandleAPIResponse } from '../allcommon/basic/FnHandleAPIResponse.ts'
import { FnProcessStringToCompare } from '../allcommon/basic/FnProcessStringToCompare.ts'
import { FnGenerateUID } from '../allcommon/settingsform/FnGenerateUID.ts'
import { FnGetNodeDetailsBaseOnKey } from '../allcommon/sidebar/FnGetNodeDetailsBaseOnKey.ts'
import { FnFindNodeAndParents } from '../allcommon/tablegrid/FnFindNodeAndParents.ts'
import { FnAddSubNode } from '../allcommon/tree/FnAddSubNode.ts'
import { FnConvertFlatDataToHierarchyData } from '../allcommon/tree/FnConvertFlatDataToHierarchyData.ts'
import { FnFindChildrenBasedOnKey } from '../allcommon/tree/FnFindChildrenBasedOnKey.ts'
import { FnFindParentNode } from '../allcommon/tree/FnFindParentNode.ts'
import { FnGetNodeDetailsBasedOnKey } from '../allcommon/tree/FnGetNodeDetailsBasedOnKey.ts'
import { FnGetSelectionFromHierarchy } from '../allcommon/tree/FnGetSelectionFromHierarchy.ts'
import { FnRemoveChildrenNodes } from '../allcommon/tree/FnRemoveChildrenNodes.ts'
import { FnGetIsLeafForRack } from '../allcommon/tree/FnGetIsLeafForRack.ts'
import { FnUpdateNodeWithTitleAndIcon } from '../allcommon/tree/FnUpdateNodeWithTitleAndIcon.ts'
import { FnUpdateTreeNodeBasedOnKey } from '../allcommon/tree/FnUpdateTreeNodeBasedOnKey.ts'
import { ExcludeFeaturesFromFilterNodes, FeaturesThatNeedToUpdateInSession, ReuseDataForFeatures } from '../alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer.ts'
import { DeviceModelFEnums } from '../alldefaultprops/sidebar/DeviceModelEnums.ts'
import { axiosInterceptor } from '../interceptors/Interceptor.ts'
import { CABLING, DC, DCI, DEVICE, EM, EXPLORER, INTEL, KWD, LOG, PROPERTY, SESSION } from '../interceptors/EndPoints.ts'

import { IFnCreateForensiclog } from '../../appcontainer/allinterface/IFnCreateForensiclog.ts'
import { IFnCreateWorkOrderApiCall } from '../../appcontainer/allinterface/IFnCreateWorkOrderApiCalls.ts'
import { IActionImageForSubMenu } from '../allinterface/basic/IActionImageList.ts'
import { ISessionVariable } from '../allinterface/basic/ISessionVariable.ts'
import { IDialogActionBtn } from '../allinterface/basic/IYesNoFormContainer.ts'
import { IErrorData } from '../allinterface/IApiResponse.ts'
import { IDcExplorerContainer, IAddLibraryDevicePayload, IAutoExpandTreeNodesResult, IDeviceJsonResponse, IDeviceMorePropertyRow, IDevicePropertyItem, IDciRecord, IEmPropertyDefaults, IExplorerPrevDeps, IFlatExplorerApiData, IHierarchyJsonResponse, IKebabMenuPayload, ISessionUpdateApiResponse, ITreeDropInfo, IWorkOrderResultData } from '../allinterface/IDcExplorerContainer.ts'
import { IDCFilterControlValues } from '../allinterface/searchfilter/IFilterFormContainer.ts'
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from '../allinterface/tree/ITreeControl.ts'
import { IFeatureTree, ITreeForFlatDataContainer } from '../allinterface/tree/ITreeForFlatDataContainer.ts'
import { IStrictCheckedKeys, TNodeCheckState } from '../allinterface/tree/ITreeForHierarchicalDataContainer.ts'
import { IDragItem } from '../context/allinterface/IDrag.ts'
import { IEmItem, ISiteProperties } from '../context/allinterface/IMainApp.ts'
import { ISession } from '../context/allinterface/ISession.ts'

import ShowDatacenterInterconnect from '../cabling/kebabmenu/ShowDatacenterInterconnect.tsx'
import { YesNoFormContainer } from '../basic/yesnoformcontainer/YesNoFormContainer.tsx'
import { FilterFormContainer } from '../searchfilter/filterformcontainer/FilterFormContainer.tsx'
import { SearchControl } from '../searchfilter/searchcontrol/SearchControl.tsx'
import { TreeControl } from '../tree/treecontrol/TreeControl.tsx'
import { FnSetSelectedSiteProperties } from '../allcommon/FnSetSelectedSiteProperties.ts'
import { FnReplaceNodeForRefresh } from '../allcommon/tree/FnReplaceNodeForRefresh.ts'
import { FnRecreateFloorLayout } from '../allcommon/basic/FnRecreateFloorLayout.ts'
import { FnGetVisibleNodesBasedOnExpandedKeys } from '../allcommon/tree/FnGetVisibleNodesBasedOnExpandedKeys.ts'
import { FnDeleteTableRecords } from '../allcommon/FnDeleteTableRecords.ts'
import { FnCallApiToGetDataForTree } from '../allcommon/tree/FnCallApiToGetDataForTree.ts'
import { FnCallApiToGetDataForTreeForFloor } from '../allcommon/tree/FnCallApiToGetDataForTreeForFloor.ts'
import { FnBuildUrlForFindHierarchy } from '../allcommon/FnBuildSessionPayloadForFind.ts'
import { EntityNameEnums } from '../alldefaultprops/basic/DefaultPropsAppqaSettingsContainer.ts'
import { FnUpdateSession } from '../allcommon/FnUpdateSession.ts'
import { FnDeleteAndRefreshTree } from '../allcommon/tree/FnDeleteAndRefreshTree.ts'
import { FnInternalDragDropRefreshTree } from '../allcommon/tree/FnInternalDragDropRefreshTree.ts'
import { FnCutPasteRefreshTree } from '../allcommon/tree/FnCutPasteRefreshTree.ts'
import { FnFilterTreeById } from '../allcommon/tree/FnFilterTreeById.ts'
import { FnGetSessionVariables } from '../allcommon/basic/FnGetSessionVariables.ts'
import { FnFilterSiteHierarchyFromAllSites, getSiteIdFromSessionList } from '../allcommon/tree/FnFilterSiteHierarchyFromAllSites.ts'

// Returns true when checkbox state uses strict checked/halfChecked shape.

interface ISearchKeywordCache {
  keyword: string;
  searchAllWord: boolean;
  records: ISearchKeywordNewRecord[];
  currentIndex: number;
}

function isStrictCheckedKeys(checked: TNodeCheckState): checked is IStrictCheckedKeys {
  return !Array.isArray(checked);
}

// Parses hierarchyJson from an explorer API response object.
function parseHierarchyJsonResponse(response: unknown): unknown {
  if (!response || typeof response !== 'object' || !('hierarchyJson' in response)) {
    return null;
  }
  const hierarchyJson = (response as IHierarchyJsonResponse).hierarchyJson;
  if (!hierarchyJson) {
    return null;
  }
  try {
    return FnParseJsonSafely(hierarchyJson);
  } catch (error) {
    console.error('Failed to parse hierarchyJson:', error);
    return null;
  }
}

// Parses deviceJson from a mounted-device hierarchy API response.
function parseDeviceJsonResponse(response: unknown): unknown {
  if (!response || typeof response !== 'object' || !('deviceJson' in response)) {
    return null;
  }
  const deviceJson = (response as IDeviceJsonResponse).deviceJson;
  if (!deviceJson) {
    return null;
  }
  try {
    return FnParseJsonSafely(deviceJson);
  } catch (error) {
    console.error('Failed to parse deviceJson:', error);
    return null;
  }
}

// Maps feature id to explorer API exploreType value.
function getExploreTypeForFeature(featureId: string): number {
  if (featureId === FEnums.AssetConfiguration) {
    return 2;
  }
  if (featureId === FEnums.ConfigureDevice) {
    return 3;
  }
  if (featureId === FEnums.InventoryManagement || featureId === FEnums.InventoryConfiguration) {
    return 1;
  }
  return 2;
}

// Converts null to undefined for optional string API fields.
function optionalString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

// Extracts partner filter variables (tenant, tag, vendor, team) from session data.
function getSessionFilterParams(sessionList?: ISession[]): { partnerToFilter: string | null } {
  if (!sessionList?.length) return { partnerToFilter: null };
  const locationData = FnGetSessionVariables(["Filter"], "ID", sessionList);
  const tenantID = locationData?.find((item) => item.VariableName === "TenantID")?.SessionValue || null;
  const tagID = locationData?.find((item) => item.VariableName === "TagID")?.SessionValue || null;
  const vendorID = locationData?.find((item) => item.VariableName === "VendorID")?.SessionValue || null;
  const teamID = locationData?.find((item) => item.VariableName === "TeamID")?.SessionValue || null;
  const partnerToFilter = tenantID ?? tagID ?? vendorID ?? teamID ?? null;
  return { partnerToFilter };
}

// Extracts newSlotID from move_floor_to_slot response.
function extractNewSlotIdFromResponse(resp: unknown): string | undefined {
  if (!resp) return undefined;
  let parsed: any = resp;
  if (typeof resp === "string") {
    try {
      parsed = JSON.parse(resp);
    } catch {
      return undefined;
    }
  }
  const id =
    parsed?.newSlotID ??
    parsed?.newSlotId ??
    parsed?.NewSlotID ??
    parsed?.data?.newSlotID ??
    parsed?.data?.newSlotId ??
    parsed?.data?.NewSlotID;
  return id ? String(id) : undefined;
}

// Resolves valid mountType for device/move_floor_to_slot:
// RM for rack-mountable RU slot, PM for pole mount / 0-slot, InOutPlug for InOut, Slot for chassis slot.
function getMoveFloorToSlotMountType(dropNode?: ITreeNode | null, currentMountInput?: string, slotsNeeded?: number): string {
  const nodeType = dropNode?.NodeType?.trim().toLowerCase() || "";
  const treeType = dropNode?.treetype?.trim().toLowerCase() || "";
  const nodeName = dropNode?.Name?.trim().toLowerCase() || "";

  const isRU = nodeType === "ru" || treeType === "ru" || nodeName.startsWith("ru#") || nodeName === "ru";
  if (isRU) {
    if (slotsNeeded !== undefined && slotsNeeded !== null) {
      return slotsNeeded > 0 ? "RU" : "PM";
    }
    return currentMountInput === "pole" ? "PM" : "RU";
  }

  if (currentMountInput === "pole" || nodeType === "pm" || treeType === "pm" || nodeName.includes("pole") || nodeName.startsWith("pm#") || nodeName === "pm") {
    return "PM";
  }
  if (nodeType === "inoutplug" || treeType === "inoutplug" || nodeType === "inout" || treeType === "inout" || nodeType === "inpoutplug" || nodeName.includes("inout")) {
    return "InOutPlug";
  }
  if (nodeType === "slot" || treeType === "slot" || treeType === "deviceslot" || nodeName.startsWith("slot")) {
    return "Slot";
  }
  return dropNode?.NodeType ?? "Slot";
}

// Normalizes an optional tree node to null when missing.
function treeNodeOrNull(node: ITreeNode | undefined | null): ITreeNode | null {
  return node ?? null;
}

// Checks if a tree node represents a front view
function isFrontViewNode(node?: ITreeNode | null): boolean {
  if (!node) return false;
  const nt = (node.NodeType || "").toLowerCase();
  const name = (node.Name || "").toLowerCase();
  return nt === "frontview" || nt === "front" || nt === "f" || name.includes("front") || name === "f";
}

// Checks if a tree node represents a rear view
function isRearViewNode(node?: ITreeNode | null): boolean {
  if (!node) return false;
  const nt = (node.NodeType || "").toLowerCase();
  const name = (node.Name || "").toLowerCase();
  return nt === "rearview" || nt === "rear" || nt === "r" || name.includes("rear") || name === "r";
}

function isValidDeviceGuid(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

function resolveDeviceGuid(...candidates: (string | null | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (c && typeof c === "string" && !c.includes("##")) {
      if (isValidDeviceGuid(c)) {
        return c.trim();
      }
    }
  }
  for (const c of candidates) {
    if (c && typeof c === "string" && !c.includes("##") && c.trim() !== "" && c !== "Front" && c !== "Rear" && c !== "F" && c !== "R") {
      return c.trim();
    }
  }
  return undefined;
}

// Finds the parent device node for a dragged device or device view
function findDragParentDevice(
  dragNode: ITreeNode,
  currentTreeData?: ITreeNode[]
): ITreeNode | null {
  const isDragNodeDevice =
    dragNode.NodeType?.toLowerCase() === "device" ||
    dragNode.treetype?.toLowerCase() === "device" ||
    dragNode.treetype?.toLowerCase() === "product" ||
    dragNode.NodeType?.toLowerCase() === "product";
  if (isDragNodeDevice) {
    return dragNode;
  }
  if (currentTreeData) {
    const fromTree =
      FnFindNearestNodeByType(currentTreeData, dragNode, "Device") ||
      FnFindNearestNodeByType(currentTreeData, dragNode, "MountedDevice") ||
      FnFindNearestNodeByType(currentTreeData, dragNode, "Product");
    if (fromTree && !fromTree.NodeEntID?.includes("##")) return fromTree;
    if (dragNode.parentEntID) {
      const findInTree = (nodes: ITreeNode[]): ITreeNode | null => {
        for (const n of nodes) {
          if (
            (n.NodeEntID === dragNode.parentEntID || n.key === dragNode.parentEntID) &&
            !n.NodeEntID?.includes("##")
          ) {
            return n;
          }
          if (n.children?.length) {
            const found = findInTree(n.children);
            if (found) return found;
          }
        }
        return null;
      };
      const foundByParent = findInTree(currentTreeData);
      if (foundByParent) return foundByParent;
    }
  }
  const ParentDragraObj = FnGetParentObjGivenTreeTypeTreeUsingDiv(dragNode, "Device", true);
  const candidates = ParentDragraObj?.filter((n) => !n.NodeEntID?.includes("##")) ?? [];
  return (
    candidates.find(
      (n) =>
        n.treetype?.toLowerCase() === "device" ||
        n.NodeType?.toLowerCase() === "device" ||
        n.treetype?.toLowerCase() === "product" ||
        n.NodeType?.toLowerCase() === "product"
    ) ??
    candidates[0] ??
    null
  );
}

// Resolves front and rear view nodes for a dragged node and its device
function resolveDragDeviceViews(
  dragNode: ITreeNode,
  dragParentDevice?: ITreeNode | null
): { dragfrontView: ITreeNode | null; dragRearView: ITreeNode | null } {
  const isDragNodeDevice =
    dragNode.NodeType?.toLowerCase() === "device" ||
    dragNode.treetype?.toLowerCase() === "device";

  let dragfrontView: ITreeNode | null = null;
  let dragRearView: ITreeNode | null = null;

  if (isDragNodeDevice) {
    const dragNodeView = dragNode.children || [];
    dragfrontView = treeNodeOrNull(FnGetFilterDataUsingType(dragNodeView, "Front"))
      || dragNodeView.find(isFrontViewNode)
      || null;
    dragRearView = treeNodeOrNull(FnGetFilterDataUsingType(dragNodeView, "Rear"))
      || dragNodeView.find(isRearViewNode)
      || null;
  } else {
    if (isFrontViewNode(dragNode)) {
      dragfrontView = dragNode;
    } else if (isRearViewNode(dragNode)) {
      dragRearView = dragNode;
    }
    const deviceChildren = dragParentDevice?.children || [];
    if (!dragfrontView) {
      dragfrontView = treeNodeOrNull(FnGetFilterDataUsingType(deviceChildren, "Front"))
        || deviceChildren.find(isFrontViewNode)
        || null;
    }
    if (!dragRearView) {
      dragRearView = treeNodeOrNull(FnGetFilterDataUsingType(deviceChildren, "Rear"))
        || deviceChildren.find(isRearViewNode)
        || null;
    }
  }

  return { dragfrontView, dragRearView };
}

// Retrieves accurate SlotsNeeded for a mount operation
function getSlotsNeededForMount(
  dragNode: ITreeNode,
  dragParentDevice?: ITreeNode | null
): number {
  return Number(
    dragParentDevice?.SlotsNeeded ??
    (dragParentDevice as Record<string, unknown> | null)?.DeviceSlotsNeeded ??
    dragNode?.SlotsNeeded ??
    (dragNode as Record<string, unknown> | null)?.DeviceSlotsNeeded ??
    0
  );
}

// Retrieves accurate moduleDeviceID for a mount operation
function getModuleDeviceIdForMount(
  dragNode: ITreeNode,
  dragParentDevice?: ITreeNode | null
): string | undefined {
  const isDragNodeDevice =
    dragNode.NodeType?.toLowerCase() === "device" ||
    dragNode.treetype?.toLowerCase() === "device";
  if (isDragNodeDevice) {
    return dragNode.NodeEntID ?? dragNode.DeviceEntId ?? undefined;
  }
  const ParentDragraObj = FnGetParentObjGivenTreeTypeTreeUsingDiv(dragNode, "Device", true);
  const deviceDrag = FnGetFilterDataUsingType(ParentDragraObj, "DeviceSlot");
  return (
    dragParentDevice?.NodeEntID ??
    dragParentDevice?.DeviceEntId ??
    ParentDragraObj?.[0]?.NodeEntID ??
    deviceDrag?.MountedDeviceEntID ??
    dragNode.parentEntID ??
    undefined
  );
}

// Type guard for session update API responses.
function isSessionUpdateApiResponse(value: unknown): value is ISessionUpdateApiResponse {
  return typeof value === "object" && value !== null && "jsonSessionOutput" in value;
}

// Returns library drag source tree data when available on a drag item.
function getDragSourceTreeData(drag: IDragItem | ISelectedNodeInfo): ITreeNode[] | undefined {
  return "sourceTreeData" in drag ? drag.sourceTreeData : undefined;
}

// Coerces unknown payload values to a safe string.
function recordString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Safely trims and lowercases a string value.
function safe(val?: string | null): string {
  return val?.trim().toLowerCase() || "";
}

// Converts nullable node key values to rc-tree Key type.
function toTreeKey(value: string | null | undefined): Key | undefined {
  return value ?? undefined;
}

// Parses min and max values from an InputMask string like "{60;2400}".
function parseInputMaskMinMax(inputMask?: string | unknown): { min: number; max: number } | null {
  if (typeof inputMask !== "string") {
    return null;
  }
  const match = inputMask.match(/\{?\s*(-?\d+(?:\.\d+)?)\s*;\s*(-?\d+(?:\.\d+)?)\s*\}?/);
  if (match) {
    const val1 = parseFloat(match[1]);
    const val2 = parseFloat(match[2]);
    if (!isNaN(val1) && !isNaN(val2)) {
      return {
        min: Math.min(val1, val2),
        max: Math.max(val1, val2),
      };
    }
  }
  return null;
}

// Builds a selected-node info object for tree selection events.
// Checks if a tree node represents RU, PM, InOutPlug, Slot, or Port
function isRuPmInOutSlotPort(node?: ITreeNode | null): boolean {
  if (!node) return false;
  const nt = node.NodeType?.trim().toLowerCase() || "";
  const tt = node.treetype?.trim().toLowerCase() || "";
  const name = node.Name?.trim().toLowerCase() || "";

  const matchedTypes = [
    "ru",
    "pm",
    "inoutplug",
    "inpoutplug",
    "inout",
    "slot",
    "deviceslot",
    "port",
    "devicenetworkport",
    "devicepowerport",
    "powerport",
    "networkport"
  ];

  if (matchedTypes.includes(nt) || matchedTypes.includes(tt)) {
    return true;
  }

  if (
    name.startsWith("ru#") ||
    name === "ru" ||
    name.startsWith("pm#") ||
    name === "pm" ||
    name.includes("pole") ||
    name.includes("inout") ||
    name.startsWith("slot#") ||
    name.startsWith("slot ") ||
    name === "slot" ||
    name.startsWith("port#") ||
    name.startsWith("port ") ||
    name === "port"
  ) {
    return true;
  }

  return false;
}

// Checks if a tree node represents a Port
function isPortNode(node?: ITreeNode | null): boolean {
  if (!node) return false;
  const nt = (node.NodeType ?? "").trim().toLowerCase();
  const tt = (node.treetype ?? "").trim().toLowerCase();
  const name = (node.Name ?? "").trim().toLowerCase();
  return (
    nt === "port" ||
    nt === "devicenetworkport" ||
    nt === "devicepowerport" ||
    nt === "powerport" ||
    nt === "networkport" ||
    tt === "port" ||
    tt === "devicenetworkport" ||
    tt === "devicepowerport" ||
    tt === "powerport" ||
    tt === "networkport");
}

// Checks if a tree node represents a view node (e.g. Front, Rear, FrontView, RearView, View).
function isViewNode(node?: ITreeNode | null): boolean {
  if (!node) return false;
  const nt = (node.NodeType ?? "").trim().toLowerCase();
  const tt = (node.treetype ?? "").trim().toLowerCase();
  const name = (node.Name ?? node.title ?? "").toString().trim().toLowerCase();
  return (
    nt === "frontview" ||
    nt === "rearview" ||
    nt === "view" ||
    tt === "view" ||
    name === "front" ||
    name === "rear" ||
    name === "front view" ||
    name === "rear view"
  );
}

// Checks if a tree node represents a Rack.
// View nodes (Front / Rear) under racks must NEVER be identified as a Rack node.
function isRackNode(node?: ITreeNode | null): boolean {
  if (!node) return false;

  // View nodes are views of the rack, NEVER the rack itself!
  if (isViewNode(node)) return false;

  const nt = (node.NodeType ?? "").trim().toLowerCase();
  const tt = (node.treetype ?? "").trim().toLowerCase();
  const en = (node.NodeEntityname ?? "").trim().toLowerCase();
  const type = (node.Type ?? "").trim().toLowerCase();
  const eqType = ((node as any).EQType ?? "").toString().trim().toLowerCase();

  return (
    nt === "rack" ||
    tt === "rack" ||
    en === "rack" ||
    (en === "__rack" && (nt === "device" || tt === "device" || type === "floordevice" || type === "device")) ||
    type === "rack" ||
    eqType === "rack"
  );
}

// Checks if a tree node represents a MountedDevice (or DeviceView) in configuration features.
function isMountedDeviceNode(node?: ITreeNode | null): boolean {
  if (!node) return false;

  // Rack view nodes (e.g. Front, Rear) and Rack nodes are not mounted devices
  if (isViewNode(node) || isRackNode(node)) return false;

  // Under configuration features, mounteddevice shows as deviceview and will have MountedDeviceEntID or MountedDeviceID
  const mdEntId = (node.MountedDeviceEntID ?? "").toString().trim();
  const mdId = (node.MountedDeviceID ?? (node as any).MounteDeviceID ?? "").toString().trim();
  const hasMdId = mdEntId.length > 0 || mdId.length > 0;

  if (hasMdId) {
    return true;
  }

  const nt = (node.NodeType ?? "").trim().toLowerCase();
  const tt = (node.treetype ?? "").trim().toLowerCase();

  if (nt === "mounteddevice" || tt === "mounteddevice") {
    return true;
  }

  return false;
}

// Checks if an RU, PM, InOutPlug, Slot, or Port node is strictly under a Rack
// (i.e. not under an intermediate MountedDevice / DeviceView).
function isNodeUnderRackOnly(
  tree: ITreeNode[],
  node: ITreeNode
): { isUnderRack: boolean; rackNode: ITreeNode | null } {
  if (!node || !tree || !tree.length || isPortNode(node)) {
    return { isUnderRack: false, rackNode: null };
  }

  const findInTree = (nodes: ITreeNode[], id: string): ITreeNode | null => {
    const lower = id.toLowerCase();
    for (const item of nodes) {
      if (
        (item.key && item.key.toString().toLowerCase() === lower) ||
        (item.NodeEntID && item.NodeEntID.toString().toLowerCase() === lower)
      ) {
        return item;
      }
      if (item.children?.length) {
        const found = findInTree(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Primary: find full ancestor chain using FnFindNodeAndParents
  const targetKey = (node.key ?? node.NodeEntID ?? "").toString();
  let path = targetKey ? FnFindNodeAndParents(tree, targetKey) : null;
  if (!path && node.NodeEntID) {
    path = FnFindNodeAndParents(tree, node.NodeEntID.toString());
  }

  if (path && path.length > 1) {
    // Ancestors from nearest parent upwards to root (excluding the target node itself)
    const ancestors = path.slice(0, -1).reverse();
    for (const ancestor of ancestors) {
      const ant = (ancestor.NodeType ?? "").toLowerCase().trim();
      const att = (ancestor.treetype ?? "").toLowerCase().trim();
      if (
        isMountedDeviceNode(ancestor) ||
        ant === "device" ||
        att === "device" ||
        att === "deviceslot" ||
        att === "deviceview"
      ) {
        // Node is under a MountedDevice -> not under rack only
        return { isUnderRack: false, rackNode: null };
      }
      if (isRackNode(ancestor)) {
        // Nearest container is a Rack with no MountedDevice in between
        return { isUnderRack: true, rackNode: ancestor };
      }
    }
  }

  // Fallback 1: traverse upwards using parentEntID
  let currentParentId = node.parentEntID?.toString();
  const visited = new Set<string>();
  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId);
    const parent = findInTree(tree, currentParentId);
    if (!parent) {
      break;
    }
    const pnt = (parent.NodeType ?? "").toLowerCase().trim();
    const ptt = (parent.treetype ?? "").toLowerCase().trim();
    if (
      isMountedDeviceNode(parent) ||
      pnt === "device" ||
      ptt === "device" ||
      ptt === "deviceslot" ||
      ptt === "deviceview"
    ) {
      return { isUnderRack: false, rackNode: null };
    }
    if (isRackNode(parent)) {
      return { isUnderRack: true, rackNode: parent };
    }
    currentParentId = parent.parentEntID?.toString();
  }

  // Fallback 2: locate nearest Rack using FnFindNearestNodeByType
  const nearestRack = FnFindNearestNodeByType(tree, node, "Rack");
  if (nearestRack) {
    // Verify no intermediate MountedDevice exists between node and nearestRack
    let curr: ITreeNode | null = node;
    let hasIntermediateMd = false;
    const visitedNodes = new Set<string>();
    while (curr && curr.parentEntID) {
      const pid = curr.parentEntID.toString();
      if (visitedNodes.has(pid)) break;
      visitedNodes.add(pid);
      const parent = findInTree(tree, pid);
      if (!parent) break;
      if (
        (parent.key && (parent.key === nearestRack.key || parent.key === nearestRack.NodeEntID)) ||
        (parent.NodeEntID && (parent.NodeEntID === nearestRack.NodeEntID || parent.NodeEntID === nearestRack.key)) ||
        isRackNode(parent)
      ) {
        break;
      }
      const pnt = (parent.NodeType ?? "").toLowerCase().trim();
      const ptt = (parent.treetype ?? "").toLowerCase().trim();
      if (
        isMountedDeviceNode(parent) ||
        pnt === "device" ||
        ptt === "device" ||
        ptt === "deviceslot" ||
        ptt === "deviceview"
      ) {
        hasIntermediateMd = true;
        break;
      }
      curr = parent;
    }
    if (!hasIntermediateMd) {
      return { isUnderRack: true, rackNode: nearestRack };
    }
  }

  return { isUnderRack: false, rackNode: null };
}

function toSelectedNodeInfo(node: ITreeNode): ISelectedNodeInfo {
  return { node, event: "select", selected: true, selectedNodes: [] };
}

function logDcExplorerSession(source: string, payload: Record<string, unknown>) {
  if (import.meta.env.DEV)
    console.log(`[DcExplorer][session] ${source}`, payload);
}

const APPQA_LAUNCH_STORAGE_KEY = "appqaLaunch";

function getAppqaLaunchFlag(searchParams: URLSearchParams): boolean | undefined {
  if (searchParams.get("appqaLaunch") === "true") {
    return true;
  }
  if (sessionStorage.getItem(APPQA_LAUNCH_STORAGE_KEY) === "true") {
    return true;
  }
  return undefined;
}

const DcExplorerContainer = (dcExplorerContainerProps: IDcExplorerContainer) => {
  console.log('dcExplorerContainerProps', dcExplorerContainerProps)
  const [featureTreeProps, setFeatureTreeProps] = useState<IFeatureTree | null>(null);
  const [searchText, setSearchText] = useState<string | null>(null);
  const [apiData, setApiData] = useState<IFlatExplorerApiData>(null);
  const [isApiCalled, setIsApiCalled] = useState<boolean>(false);
  const [isShowFilterForm, setIsShowFilterForm] = useState<boolean>(false);
  const [isFilterChange, setIsFilterChange] = useState<boolean>(false);
  const [filterFormData, setFilterFormData] = useState<IDCFilterControlValues>({});
  const [filterTreeNodeData, setFilterTreeNodeData] = useState({ SiteID: "", SiteName: "", RoomID: "", RoomName: "", SiteDateFormat: "" });
  const [mountInput, setMountInput] = useState<'pole' | 'sides' | 'angle'>('pole');
  const [treeData, setTreeData] = useState<ITreeNode[]>();
  const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
  const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
  const [defaultCheckedKeys, setDefaultCheckedKeys] = useState<Key[]>([]);
  const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null)
  const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<{
    checked: Key[];
    halfChecked: Key[];
  }>();
  const [originalTreeData, setOriginalTreeData] = useState<ITreeNode[]>([]);
  const [originalTreeDataForInventory, setOriginalTreeDataForInventory] = useState<ITreeNode[]>([]);
  const [originalTreeDataWithoutFilter, setOriginalTreeDataWithoutFilter] = useState<ITreeNode[]>([]);
  const [treeContainerFlatDataProps, setTreeContainerFlatDataProps] = useState<ITreeForFlatDataContainer>();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [selectedKebabMenu, setSelectedKebabMenu] = useState<IKebabMenuPayload>();
  const [showOkButtonOnly, setShowOkButtonOnly] = useState<boolean>(false)
  const [dropNode, setDropNode] = useState<ITreeNode | null>(null)
  const [isOpenLibFormDialog, setIsOpenLibFormDialog] = useState<boolean>(false);
  const [isConfigureMounting, setIsConfigureMounting] = useState<boolean>(false);
  const [libFormDialogTitle, setLibFormDialogTitle] = useState<string>();
  const [workorderRecords, setWorkorderRecords] = useState<IWorkorderRecord[]>([]);
  const [showSelectWorkorder, setShowSelectWorkorder] = useState<boolean>(false);
  const [createWorkOrderPayload, setCreateWorkOrderPayload] = useState<IFnCreateWorkOrderApiCall>();
  const [dragNodeInfoForWO, setDragNodeInfoForWO] = useState<ITreeNode | null>(null)
  const [dragNodeInfo, setDragNodeInfo] = useState<ISelectedNodeInfo | null>(null)
  const [dropNodeInfoForWO, setDropNodeInfoForWO] = useState<ITreeNode | null>(null)
  const [isInternalDropWO, setIsInternalDropWO] = useState<boolean>(false)
  const [customButtons, setCustomButtons] = useState<IDialogActionBtn[]>();
  const [workOrderData, setWorkOrderData] = useState<IWorkOrderResultData | unknown[]>();
  const [showDciPopup, setShowDciPopup] = useState<boolean>(false);
  const [dciRecords, setDciRecords] = useState<IDciRecord[]>();
  const [isSiteFilterApplied, setIsSiteFilterApplied] = useState<boolean>(false);

  const sessionContext = useSessionContext();
  const statusBarContext = useStatusBarContext();
  const commonVariableContext = useCommonVariableContext();
  const selectedNodeContext = useSelectedNodeContext();
  const explorerTreeContext = useExplorerTreeContext();
  const mainAppContext = useMainAppContext();
  const { dragItem, setDragItem, setReloadTreeFor, inventoryDeviceDetails } = useDragContext();

  const needToUpdateTreeNodeRef = useRef<boolean>(false);
  const isSiteFilterChangedRef = useRef<boolean>(false);
  const isSiteChangedRef = useRef<boolean>(explorerTreeContext.isSiteChanged);
  const siteHierarchyVersionRef = useRef(0);
  const searchCacheRef = useRef<ISearchKeywordCache | null>(null);
  const eqidRef = useRef(
    searchParams?.get("eqid") ?? undefined);

  const searchParamsRef = useRef({
    isDisableSearch:
      searchParams.get("disablesearch") ? true : false,

    eqidToSearch:
      searchParams.get("eqid") ?? undefined,

    entId:
      searchParams.get("entid") ?? undefined,

    hierarchyToSearch:
      searchParams.get("hierarchy") ?? undefined,

    isAppqaLaunch: getAppqaLaunchFlag(searchParams)
  });
  const featureId = dcExplorerContainerProps.featureId;
  const isInventoryFeature =
    featureId === FEnums.InventoryConfiguration ||
    featureId === FEnums.InventoryManagement ||
    featureId === FEnums.InventoryCollection;
  // Generates a unique suffix for duplicate device or location names.
  const generateUniqueId = (type: string): string => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `${type}-${timestamp}-${randomPart}`;
  };


  const displayTreeData = treeData;

  /* Flat Tree logic start */
  // Builds visible tree nodes from hierarchy data and syncs selection with parent handlers.
  const displayOnlyVisibleNode = async (
    hierarchyData: ITreeNode[],
    treeProps: IFeatureTree,
    selectedFeatureId: string,
    selectedExplorerNode: ISelectedNodeInfo | null = null,
    treeContainerFlatProps: ITreeForFlatDataContainer | null = null,
    sessionList: ISession[]
  ) => {
    const loadGeneration = treeLoadGenerationRef.current;
    if (treeProps && treeContainerFlatProps) {
      // Capture current search params (URL + sessionStorage fallback for App QA Launch)
      const currentSearchParams = {
        ...searchParamsRef.current,
        isAppqaLaunch:
          searchParamsRef.current.isAppqaLaunch ??
          getAppqaLaunchFlag(searchParams)
      };

      // Clear immediately so feature change cannot reuse them
      searchParamsRef.current = {
        isDisableSearch: false,
        eqidToSearch: undefined,
        entId: undefined,
        hierarchyToSearch: undefined,
        isAppqaLaunch: undefined
      };
      if (currentSearchParams.isAppqaLaunch) {
        sessionStorage.removeItem(APPQA_LAUNCH_STORAGE_KEY);
      }
      const result = await FnGetSelectionFromHierarchy(hierarchyData, selectedFeatureId, treeProps, selectedExplorerNode ? selectedExplorerNode : dcExplorerContainerProps.selectedNodeExplorer ?? null, statusBarContext, sessionList, undefined, floorDeviceHierarchyRecordsRef.current
        , currentSearchParams
      );
      // Feature switched while this load was in flight — discard stale result.
      if (loadGeneration !== treeLoadGenerationRef.current) {
        return;
      }
      if (result) {
        // clear search params 
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname
        );
        if (!treeContainerFlatProps.isFloorTree) {
          if (selectedFeatureId === FEnums.InventoryManagement || selectedFeatureId === FEnums.InventoryConfiguration) {
            setOriginalTreeDataForInventory(result.originalTreeData);
          }
          else if (ReuseDataForFeatures.includes(selectedFeatureId)) {
            setOriginalTreeData(result.originalTreeData);
          }
          else {
            setOriginalTreeDataWithoutFilter(result.originalTreeData)
          }
        }
        setDefaultExpandedKeys(result.expandKeys);
        let newSelectedNodeKeys: string[] = [result.selectedNodeKey];
        const newSelectedNodeInfo: ISelectedNodeInfo | null = result.selectedNode;
        needToUpdateTreeNodeRef.current = true;
        if (ExcludeFeaturesFromFilterNodes.includes(selectedFeatureId)) {
          const updatedTree = FnUpdateNodeWithTitleAndIcon(hierarchyData, treeProps, dcExplorerContainerProps.subTreeFeatureId ?? selectedFeatureId)
          if (loadGeneration !== treeLoadGenerationRef.current) {
            return;
          }
          setTreeData(updatedTree);
        }
        else {
          const isInventoryFeature =
            selectedFeatureId === FEnums.InventoryManagement ||
            selectedFeatureId === FEnums.InventoryConfiguration;

          const shouldApplyFilter =
            (dcExplorerContainerProps.applyFilter ?? true) &&
            !isInventoryFeature;

          const { partnerToFilter } = shouldApplyFilter
            ? getSessionFilterParams(sessionList)
            : { partnerToFilter: null };

          const isFilterActive = Boolean(partnerToFilter);

          const sourceForInitialRender = (shouldApplyFilter && isFilterActive)
            ? FnFilterTreeById(result.originalTreeData, partnerToFilter ?? undefined)
            : result.originalTreeData;

          const filtered_tree = await FnGetVisibleNodesBasedOnExpandedKeys(hierarchyData, result.expandKeys, treeProps, selectedFeatureId, result.selectedNode?.node || undefined, sourceForInitialRender);
          if (loadGeneration !== treeLoadGenerationRef.current) {
            return;
          }
          if (filtered_tree.selectedNodeInfo && newSelectedNodeInfo) {
            newSelectedNodeInfo.node = filtered_tree.selectedNodeInfo
            newSelectedNodeKeys = [filtered_tree.selectedNodeInfo.key];
          }
          console.timeEnd('treecreation_nk');
          console.log('nk_treedata', filtered_tree.visibleTree)
          setTreeData(filtered_tree.visibleTree ? filtered_tree.visibleTree : []);
        }
        if (dcExplorerContainerProps.updateOriginalTreeDataset) {
          dcExplorerContainerProps.updateOriginalTreeDataset(result.originalTreeData, result.expandKeys, newSelectedNodeKeys, treeData ?? [])
        }
        setDefaultSelectedKeys([...newSelectedNodeKeys]);
        setDefaultSelectedNodeInfo(newSelectedNodeInfo || null);
        // Do not carry checkboxes/checked keys across features (Log → Cabling / Floor Layout).
        checkedNodeKeysRef.current = [];
        checkedNodeKeysToCutRef.current = [];
        cutSourceFloorNodeRef.current = null;
        cutSourceNodeRef.current = null;
        setDefaultCheckedKeys([]);
        setDefaultStrictlyCheckedKeys(undefined);
        if (dcExplorerContainerProps.handleNodeSelect && newSelectedNodeInfo) {
          logDcExplorerSession("initial tree load → handleNodeSelect", {
            event: (newSelectedNodeInfo as ISelectedNodeInfo).event,
            selected: (newSelectedNodeInfo as ISelectedNodeInfo).selected,
            nodeKey: (newSelectedNodeInfo as ISelectedNodeInfo).node?.key,
            nodeName: (newSelectedNodeInfo as ISelectedNodeInfo).node?.Name,
            nodeType: (newSelectedNodeInfo as ISelectedNodeInfo).node?.NodeType,
            selectedKeys: newSelectedNodeKeys,
            featureId: dcExplorerContainerProps.featureId,
          });
          dcExplorerContainerProps.handleNodeSelect(newSelectedNodeKeys, newSelectedNodeInfo, result.expandKeys, result.originalTreeData);
        }
        if (FeaturesThatNeedToUpdateInSession.includes(dcExplorerContainerProps.featureId) && result.expandedNodes && result.expandedNodes.length > 0 && newSelectedNodeInfo && (newSelectedNodeInfo as unknown as ISelectedNodeInfo).node) {
          logDcExplorerSession("initial tree load → FnCallApiToUpdateSessionForExpandedNodes", {
            event: (newSelectedNodeInfo as ISelectedNodeInfo).event,
            nodeKey: (newSelectedNodeInfo as ISelectedNodeInfo).node?.key,
            nodeName: (newSelectedNodeInfo as ISelectedNodeInfo).node?.Name,
            nodeType: (newSelectedNodeInfo as ISelectedNodeInfo).node?.NodeType,
            expandedNodeCount: result.expandedNodes.length,
            expandedNodeTypes: result.expandedNodes.map((n: ITreeNode) => n.NodeType),
            featureId: dcExplorerContainerProps.featureId,
          });
          await FnCallApiToUpdateSessionForExpandedNodes(result.expandedNodes, (newSelectedNodeInfo as unknown as ISelectedNodeInfo).node, dcExplorerContainerProps.featureId, sessionContext, statusBarContext);
        }
      }
    }
  }

  const treeDataRef = useRef(treeData);
  const lastHandledKeyRef = useRef<Key | null>(null);
  const checkedNodeKeysRef = useRef<Key[]>([]);
  const checkedNodeKeysToCutRef = useRef<Key[]>([]);
  const cutSourceFloorNodeRef = useRef<ITreeNode | null>(null);
  const cutSourceNodeRef = useRef<ITreeNode | null>(null);
  const displayOnlyVisibleNodeRef = useRef(displayOnlyVisibleNode);
  const originalTreeDataRef = useRef(originalTreeData); // Track changes without rendering
  const originalTreeDataForInventoryRef = useRef(originalTreeDataForInventory);
  const floorDeviceHierarchyRecordsRef = useRef(explorerTreeContext.floorDeviceHierarchyRecords);
  const activeDragFloorIdRef = useRef<string | null>(null);
  const previousSearchRef = useRef<string | undefined>(undefined);
  // Bumps on feature change so late async tree loads cannot overwrite the new feature UI.
  const treeLoadGenerationRef = useRef(0);



  // Keeps floor device hierarchy ref aligned with explorer context.
  useEffect(() => {
    floorDeviceHierarchyRecordsRef.current =
      explorerTreeContext.floorDeviceHierarchyRecords;
  }, [explorerTreeContext.floorDeviceHierarchyRecords]);

  // Syncs default checked keys from container props.
  useEffect(() => {
    if (dcExplorerContainerProps.defaultCheckedKeys) {
      setDefaultCheckedKeys(dcExplorerContainerProps.defaultCheckedKeys as Key[])
    } else {
      setDefaultCheckedKeys([])
    }
  }, [dcExplorerContainerProps.defaultCheckedKeys])

  // Mirrors originalTreeData state into a ref for async handlers.
  useEffect(() => {
    originalTreeDataRef.current = originalTreeData;
  }, [originalTreeData]);

  // Mirrors inventory original tree data into a ref.
  useEffect(() => {
    originalTreeDataForInventoryRef.current = originalTreeDataForInventory;
  }, [originalTreeDataForInventory]);

  // Tracks treeData in a ref and clears it on unmount.
  useEffect(() => {
    if (treeDataRef.current !== treeData) {
      treeDataRef.current = treeData;
    }
    return () => {
      treeDataRef.current = [];
    };
  }, [treeData]);

  // Converts flat API data into hierarchy tree state when apiData changes.
  useEffect(() => {
    const handleAPIDataChange = async () => {
      if (
        treeContainerFlatDataProps?.featureTreeProps &&
        treeContainerFlatDataProps?.featureId &&
        isApiCalled &&
        apiData
      ) {
        try {
          const hierarchyData = await FnConvertFlatDataToHierarchyData(
            apiData,
            null,
            treeContainerFlatDataProps.featureId
          );
          if (
            hierarchyData?.length &&
            !treeContainerFlatDataProps.featureTreeProps.openAllNodes
          ) {
            displayOnlyVisibleNode(
              hierarchyData,
              treeContainerFlatDataProps.featureTreeProps,
              treeContainerFlatDataProps.featureId,
              dcExplorerContainerProps.selectedNodeExplorer ?? null,
              treeContainerFlatDataProps,
              sessionContext.SessionList
            );
          } else if (hierarchyData?.length) {
            const updatedTree = FnUpdateNodeWithTitleAndIcon(
              hierarchyData,
              treeContainerFlatDataProps.featureTreeProps,
              dcExplorerContainerProps.subTreeFeatureId ?? treeContainerFlatDataProps.featureId
            );
            setTreeData(updatedTree);
            if (
              treeContainerFlatDataProps.featureId === FEnums.InventoryManagement ||
              treeContainerFlatDataProps.featureId === FEnums.InventoryConfiguration
            ) {
              setOriginalTreeDataForInventory(updatedTree);
            } else if (ReuseDataForFeatures.includes(treeContainerFlatDataProps.featureId)) {
              setOriginalTreeData(updatedTree);
            } else {
              setOriginalTreeDataWithoutFilter(updatedTree);
            }
          } else {
            setTreeData([]);
          }
        } catch (error) {
          console.error("Failed to convert flat API data to hierarchy:", error);
          setTreeData([]);
        }
      }
    };
    handleAPIDataChange();
  }, [
    apiData,
    isApiCalled,
    treeContainerFlatDataProps?.featureTreeProps,
    treeContainerFlatDataProps?.featureId
  ]);

  // Runs keyword search when eqid or shared search param is present.
  useEffect(() => {
    if (!treeData?.length) return;
    const searchValue = selectedNodeContext.searchParaToSelect?.entID;

    if (!searchValue) return;

    if (previousSearchRef.current !== searchValue) {
      previousSearchRef.current = searchValue;
      setSearchHistory([]);
      handleKeywordSearch(searchValue, !!eqidRef.current);
    }
  }, [selectedNodeContext.searchParaToSelect?.entID, treeData]);

  useEffect(() => {
    if (!selectedNodeContext.dcNodeToRefresh?.nodeToRefresh)
      return;
    handleRefreshCurrentNode(selectedNodeContext.dcNodeToRefresh?.nodeToRefresh, selectedNodeContext.dcNodeToRefresh?.nodeToSelect ?? defaultSelectedNodeInfo?.node);

  }, [selectedNodeContext.dcNodeToRefresh?.nodeToRefresh.NodeEntID])


  /**
   * Refreshes parent of source node and parent of destination node after Cut & Paste
   * (and similar relocation/transfer operations) based on DcExplorer_Tree_Refresh_Cases.md (Category 3).
   */
  const handleCutPasteRefresh = async (
    pastedEntityId?: string,
    destNode?: ITreeNode
  ) => {
    const targetDestNode = destNode ?? defaultSelectedNodeInfo?.node;
    if (!targetDestNode || !treeData || !treeContainerFlatDataProps) return;

    await FnCutPasteRefreshTree({
      sourceNode: cutSourceNodeRef.current,
      sourceContainerNode: cutSourceFloorNodeRef.current,
      cutNodeKeys: checkedNodeKeysToCutRef.current,
      destNode: targetDestNode,
      pastedEntityId,
      treeData,
      originalTreeData,
      originalTreeDataForInventory,
      featureId: dcExplorerContainerProps.featureId,
      statusBarContext,
      sessionList: sessionContext.SessionList,
      sessionContext,
      featureTreeProps: treeContainerFlatDataProps.featureTreeProps,
      setTreeData,
      setOriginalTreeData,
      originalTreeDataRef,
      setOriginalTreeDataForInventory,
      originalTreeDataForInventoryRef,
      needToUpdateTreeNodeRef,
      defaultExpandedKeys,
      setDefaultExpandedKeys,
      setDefaultSelectedKeys,
      setDefaultSelectedNodeInfo,
      setDefaultCheckedKeys,
      lastHandledKeyRef,
      setIsRefreshed: explorerTreeContext.setIsRefreshed,
      checkedNodeKeysToCutRef,
      cutSourceNodeRef,
      cutSourceFloorNodeRef,
      handleNodeSelect: dcExplorerContainerProps.handleNodeSelect,
      updateOriginalTreeDataset: dcExplorerContainerProps.updateOriginalTreeDataset,
      allSitesHierarchyRecords: mainAppContext.allSitesHierarchyRecords,
      setAllSitesHierarchyRecords: mainAppContext.setAllSitesHierarchyRecords
    });
  };

  /**
   * Refreshes an RU, PM, InOutPlug, Slot, or Port node that is under a Rack only
   * in configuration features.
   * 1. Calls mounteddevicehierarchynew for the parent Rack passing rackid.
   * 2. If HasChildren > 0 for the target node, calls mounteddevicehierarchynew for
   *    the selected RU/child node passing its entid and attaches its children.
   * 3. Replaces Rack children in both original tree data and UI tree data.
   */
  const handleRefreshRackChildNode = async (
    selectedNode: ITreeNode,
    rackNode: ITreeNode,
    nodeToSelect?: ITreeNode,
    nodeToRefresh?: ITreeNode
  ): Promise<boolean> => {
    try {
      if (!treeContainerFlatDataProps?.featureTreeProps || !treeData) {
        return false;
      }

      const rackId = (
        rackNode.NodeEntID ??
        (rackNode as any).entID ??
        (rackNode as any).RackID ??
        rackNode.key ??
        ""
      ).toString();
      if (!rackId) return false;

      const isInventoryFeature =
        dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;

      let originalTree = isInventoryFeature ? originalTreeDataForInventory : originalTreeData;
      let treeDataCloned = [...treeData];

      // 1. First API call: for parent Rack using FnCallApiToGetDataForTree
      const rackNodeForApi: ITreeNode = {
        ...rackNode,
        treetype: "Device",
        MountedDeviceEntID: ""
      };

      const rackResult = await FnCallApiToGetDataForTree(
        originalTree,
        rackNodeForApi,
        dcExplorerContainerProps.featureId,
        statusBarContext,
        sessionContext.SessionList,
        true,
        rackId,
        dcExplorerContainerProps.applyFilter
      );

      let formattedRackChildren = rackResult.formattedTree;
      if (!formattedRackChildren || formattedRackChildren.length === 0) {
        dcExplorerContainerProps.handleShowUserMessage?.("No data found for current node to refresh");
        if (!nodeToSelect) {
          explorerTreeContext.setIsRefreshed(true);
        }
        selectedNodeContext.setDcNodeToRefresh(undefined);
        return true;
      }

      if (rackResult.originalTreeData) {
        originalTree = rackResult.originalTreeData;
      }

      // 2. Find selected RU / PM / InOutPlug / Slot / Port node in rack children
      const selectedEntId = (
        selectedNode.NodeEntID ??
        (selectedNode as any).entID ??
        selectedNode.key ??
        ""
      ).toString();

      const findNodeInHierarchy = (nodes: ITreeNode[], id: string): ITreeNode | null => {
        if (!nodes || !Array.isArray(nodes)) return null;
        const lowerId = id.toLowerCase();
        for (const n of nodes) {
          if (
            (n.NodeEntID && n.NodeEntID.toString().toLowerCase() === lowerId) ||
            (n.key && n.key.toString().toLowerCase() === lowerId) ||
            ((n as any).entID && (n as any).entID.toString().toLowerCase() === lowerId)
          ) {
            return n;
          }
          if (n.children?.length) {
            const found = findNodeInHierarchy(n.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const targetChildInRack = findNodeInHierarchy(formattedRackChildren, selectedEntId);

      // 3. Check if HasChildren > 0; only call second API if HasChildren > 0
      const hasChildren = Number(targetChildInRack?.HasChildren ?? selectedNode.HasChildren ?? 0) > 0;

      const ruDeviceIdForCall = (
        selectedNode.MountedDeviceEntID ||
        targetChildInRack?.MountedDeviceEntID ||
        (selectedNode as any).MountedDeviceID ||
        (targetChildInRack as any)?.MountedDeviceID ||
        ""
      ).toString();

      if (hasChildren && ruDeviceIdForCall) {
        // Second API call: for selected RU node using FnCallApiToGetDataForTree passing MountedDeviceEntID
        const ruNodeForApi: ITreeNode = {
          ...selectedNode,
          ...(targetChildInRack ?? {}),
          treetype: "DeviceSlot",
          MountedDeviceEntID: ruDeviceIdForCall
        };

        const ruResult = await FnCallApiToGetDataForTree(
          originalTree,
          ruNodeForApi,
          dcExplorerContainerProps.featureId,
          statusBarContext,
          sessionContext.SessionList,
          true,
          selectedEntId,
          dcExplorerContainerProps.applyFilter
        );

        let ruFormattedChildren = ruResult.formattedTree;
        if ((!ruFormattedChildren || ruFormattedChildren.length === 0) && ruDeviceIdForCall !== selectedEntId) {
          const altRuResult = await FnCallApiToGetDataForTree(
            originalTree,
            ruNodeForApi,
            dcExplorerContainerProps.featureId,
            statusBarContext,
            sessionContext.SessionList,
            true,
            ruDeviceIdForCall,
            dcExplorerContainerProps.applyFilter
          );
          if (altRuResult.formattedTree?.length) {
            ruFormattedChildren = altRuResult.formattedTree;
          }
        }

        if (targetChildInRack) {
          if (ruFormattedChildren && ruFormattedChildren.length > 0) {
            targetChildInRack.children = ruFormattedChildren;
            targetChildInRack.isLeaf = false;
            targetChildInRack.HasChildren = ruFormattedChildren.length;
          } else {
            targetChildInRack.children = [];
            targetChildInRack.isLeaf = true;
            targetChildInRack.HasChildren = 0;
          }
        }
      } else if (targetChildInRack) {
        targetChildInRack.children = [];
        targetChildInRack.isLeaf = true;
        targetChildInRack.HasChildren = 0;
      }

      // 4. Replace nodes in original tree and UI tree
      setDefaultSelectedKeys([]);
      lastHandledKeyRef.current = null;

      const rackKey = (rackNode.key ?? rackNode.NodeEntID ?? rackId).toString();

      const updatedOriginalTreeData = await FnReplaceNodeForRefresh(
        originalTree,
        rackKey,
        formattedRackChildren,
        treeContainerFlatDataProps.featureTreeProps,
        dcExplorerContainerProps.featureId,
        true,
        rackNode.stepNo,
        true
      );

      if (isInventoryFeature) {
        setOriginalTreeDataForInventory(updatedOriginalTreeData);
      } else {
        setOriginalTreeData(updatedOriginalTreeData);
      }

      const clonedData = FnDeepClone(formattedRackChildren);
      const refreshedNodes = (await FnRemoveChildrenNodes(
        clonedData,
        selectedNode.key,
        dcExplorerContainerProps.featureId,
        treeContainerFlatDataProps.featureTreeProps,
        updatedOriginalTreeData
      )) ?? [];

      const updatedTreeData = (await FnReplaceNodeForRefresh(
        treeDataCloned,
        rackKey,
        refreshedNodes,
        treeContainerFlatDataProps.featureTreeProps,
        dcExplorerContainerProps.featureId,
        false,
        rackNode.stepNo,
        true
      )) ?? [];

      // 5. Update selection and expansion
      const targetNode = nodeToSelect ?? nodeToRefresh ?? selectedNode;
      const targetKey = (targetNode.key ?? targetNode.NodeEntID ?? "").toString();

      let expandedNodeKeys = defaultExpandedKeys;
      const parents = FnFindNodeAndParents(updatedTreeData, targetKey);
      if (parents?.length) {
        const keys = parents
          .filter((item) => item.key !== targetKey)
          .map((item) => item.key);

        if (
          hasChildren &&
          defaultExpandedKeys.includes(targetKey) &&
          !keys.includes(targetKey)
        ) {
          keys.push(targetKey);
        }
        expandedNodeKeys = keys;
        setDefaultExpandedKeys(keys);
      }

      setTreeData([...updatedTreeData]);

      const refreshedSelectedNode = {
        ...targetNode,
        ...(targetChildInRack ? targetChildInRack : {}),
        refreshKey: FnGenerateUID()
      };
      setDefaultSelectedKeys([targetKey]);
      needToUpdateTreeNodeRef.current = true;
      setDefaultSelectedNodeInfo({
        event: "select",
        node: refreshedSelectedNode,
        selected: true,
        selectedNodes: []
      });

      if (nodeToSelect) {
        dcExplorerContainerProps.handleNodeSelect?.(
          [targetKey],
          {
            event: "select",
            node: nodeToSelect,
            selected: true,
            selectedNodes: []
          },
          expandedNodeKeys,
          updatedTreeData
        );
      } else if (dcExplorerContainerProps.handleNodeSelect) {
        dcExplorerContainerProps.handleNodeSelect(
          [targetKey],
          {
            event: "select",
            node: refreshedSelectedNode,
            selected: true,
            selectedNodes: []
          },
          expandedNodeKeys,
          updatedTreeData
        );
      }

      selectedNodeContext.setDcNodeToRefresh(undefined);
      explorerTreeContext.setIsRefreshed(true);
      return true;
    } catch (err) {
      console.error("Error in handleRefreshRackChildNode:", err);
      explorerTreeContext.setIsRefreshed(false);
      return false;
    }
  };

  // Refreshes child nodes for the selected floor, device, or site via API.
  const handleRefreshTreeNodes = async (commandText?: string, idToFind?: string) => {
    try {
      if (!defaultSelectedNodeInfo?.node || !treeContainerFlatDataProps || !treeData) {
        return;
      }

      // Delegate Cut & Paste to FnCutPasteRefreshTree to refresh source parent and dest parent
      if (commandText === RightMouseMenuTreeNode.Paste) {
        await handleCutPasteRefresh(idToFind, defaultSelectedNodeInfo.node);
        return;
      }

      const selectedNode = defaultSelectedNodeInfo.node;
      const isConfigurationFeature =
        dcExplorerContainerProps.featureId === FEnums.AssetConfiguration ||
        dcExplorerContainerProps.featureId === FEnums.ConfigureDevice ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;

      if (isConfigurationFeature && !isPortNode(selectedNode) && isRuPmInOutSlotPort(selectedNode)) {
        const { isUnderRack, rackNode } = isNodeUnderRackOnly(treeData, selectedNode);
        if (isUnderRack && rackNode) {
          const handled = await handleRefreshRackChildNode(selectedNode, rackNode);
          if (handled) return;
        }
      }

      const isInventoryFeature =
        dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;
      const nodeType = selectedNode.NodeType ?? selectedNode.treetype;
      const treeType = selectedNode.treetype;
      let parentNodeByType: ITreeNode | null = null;
      let apiNode: ITreeNode | null = null;

      const findFloorNode = (node: ITreeNode, tree: ITreeNode[]): ITreeNode | null => {
        const nt = (node.NodeType ?? node.treetype ?? "").toLowerCase();
        if (nt === "floor" || nt === "store") {
          return node;
        }
        const nearest = FnFindNearestNodeByType(tree, node, "Floor") ??
          FnFindNearestNodeByType(tree, node, "Store");
        if (nearest) return nearest;

        const nodeKey = (node.key ?? node.NodeEntID ?? "").toString();
        if (nodeKey) {
          const path = FnFindNodeAndParents(tree, nodeKey);
          if (path && path.length > 0) {
            return path.slice().reverse().find(n => {
              const pnt = (n.NodeType ?? n.treetype ?? "").toLowerCase();
              return pnt === "floor" || pnt === "store";
            }) ?? null;
          }
        }
        return null;
      };

      if (commandText === RightMouseMenuTreeNode.Paste) {
        const destFloor = findFloorNode(selectedNode, treeData) ?? selectedNode;
        parentNodeByType = destFloor;
        apiNode = destFloor;
      } else if (commandText === RightMouseMenuTreeNode.AddLocation && selectedNode.NodeType?.toLowerCase() === "floor") {
        parentNodeByType = selectedNode;
      } else if (
        nodeType?.toLowerCase() === "site" ||
        nodeType?.toLowerCase() === "floor" ||
        nodeType?.toLowerCase() === "store"
      ) {
        parentNodeByType = selectedNode;
      } else if (treeType && ["deviceslot", "deviceview"].includes(treeType.toLowerCase())) {
        parentNodeByType =
          FnFindNearestNodeByType(treeData, selectedNode, "DeviceSlot") ??
          FnFindNearestNodeByType(treeData, selectedNode, "Floor");
      } else {
        parentNodeByType = FnFindNearestNodeByType(treeData, selectedNode, "Slot");
        parentNodeByType ??=
          FnFindNearestNodeByType(treeData, selectedNode, "Floor");
        parentNodeByType ??=
          FnFindNearestNodeByType(treeData, selectedNode, "Store");
        parentNodeByType ??=
          FnFindNearestNodeByType(treeData, selectedNode, "Site");
      }

      if (!parentNodeByType) {
        return;
      }

      if (commandText !== RightMouseMenuTreeNode.Paste) {
        const parentApiType = parentNodeByType.NodeType ?? parentNodeByType.treetype;
        if (
          parentApiType?.toLowerCase() === "site" ||
          parentApiType?.toLowerCase() === "floor" ||
          parentApiType?.toLowerCase() === "store" ||
          parentApiType?.toLowerCase() === "rack"
        ) {
          apiNode = parentNodeByType;
        } else {
          apiNode =
            FnFindNearestNodeByType(treeData, parentNodeByType, "Floor") ??
            FnFindNearestNodeByType(treeData, parentNodeByType, "Site") ??
            parentNodeByType;
        }
      }

      const selectedKey = JSON.stringify(defaultSelectedKeys);
      setDefaultSelectedKeys([]);
      lastHandledKeyRef.current = null;
      let originalTree = isInventoryFeature ? originalTreeDataForInventory : originalTreeData;
      let treeDataCloned = [...treeData];

      if (checkedNodeKeysToCutRef.current?.length) {
        originalTree = FnRemoveNodesByKeys(originalTree, checkedNodeKeysToCutRef.current);
        treeDataCloned = FnRemoveNodesByKeys(treeDataCloned, checkedNodeKeysToCutRef.current);
        checkedNodeKeysToCutRef.current = [];
        setDefaultCheckedKeys([]);
      }

      // If Paste occurred, refresh the source floor from which the node was cut (if different from destination floor)
      if (commandText === RightMouseMenuTreeNode.Paste) {
        let sourceFloor = cutSourceFloorNodeRef.current;
        if (!sourceFloor && cutSourceNodeRef.current) {
          sourceFloor = findFloorNode(cutSourceNodeRef.current, treeData);
        }
        if (sourceFloor && sourceFloor.key !== parentNodeByType.key) {
          const sourceHierarchyParentId = sourceFloor.NodeEntID;
          const sourceResultData = await FnCallApiToGetDataForTree(
            originalTree,
            sourceFloor,
            dcExplorerContainerProps.featureId,
            statusBarContext,
            sessionContext.SessionList,
            true,
            sourceHierarchyParentId ?? undefined,
            dcExplorerContainerProps.applyFilter,
            mainAppContext.allSitesHierarchyRecords,
            mainAppContext.setAllSitesHierarchyRecords
          );
          if (sourceResultData.formattedTree) {
            originalTree = await FnAddSubNode(
              originalTree,
              sourceFloor.key,
              sourceResultData.formattedTree,
              treeContainerFlatDataProps.featureTreeProps,
              dcExplorerContainerProps.featureId,
              true,
              sourceFloor.stepNo
            );
            const clonedSourceData = FnDeepClone(sourceResultData.formattedTree);
            const removedSourceNodes = await FnRemoveChildrenNodes(
              clonedSourceData,
              sourceFloor.key,
              dcExplorerContainerProps.featureId,
              treeContainerFlatDataProps.featureTreeProps,
              originalTree,
              sourceResultData?.filterApplied
            );
            treeDataCloned = await FnAddSubNode(
              treeDataCloned,
              sourceFloor.key,
              removedSourceNodes as ITreeNode[],
              treeContainerFlatDataProps.featureTreeProps,
              dcExplorerContainerProps.featureId,
              false,
              sourceFloor.stepNo
            );
          }
        }
        cutSourceFloorNodeRef.current = null;
        cutSourceNodeRef.current = null;
      }

      const hierarchyParentId = parentNodeByType.NodeEntID;
      const resultData = await FnCallApiToGetDataForTree(originalTree, apiNode ?? parentNodeByType, dcExplorerContainerProps.featureId, statusBarContext, sessionContext.SessionList, true, hierarchyParentId ?? undefined, dcExplorerContainerProps.applyFilter, mainAppContext.allSitesHierarchyRecords, mainAppContext.setAllSitesHierarchyRecords);
      if (!resultData.formattedTree) {
        explorerTreeContext.setIsRefreshed(true);
        return;
      }

      let updatedOriginalTreeData: ITreeNode[];
      let updatedTreeData: ITreeNode[];
      let expandedNodeKeys = defaultExpandedKeys;
      let selectedNodeKeys = defaultSelectedKeys;
      let currentTreeData = treeData;


      updatedOriginalTreeData = await FnAddSubNode(
        originalTree,
        parentNodeByType.key,
        resultData.formattedTree,
        treeContainerFlatDataProps.featureTreeProps,
        dcExplorerContainerProps.featureId,
        true,
        parentNodeByType.stepNo
      );

      if (isInventoryFeature) {
        setOriginalTreeDataForInventory(updatedOriginalTreeData);
        originalTreeDataForInventoryRef.current = updatedOriginalTreeData;
      } else {
        setOriginalTreeData(updatedOriginalTreeData);
        originalTreeDataRef.current = updatedOriginalTreeData;
      }

      const clonnedData = FnDeepClone(resultData.formattedTree);
      const removedNodes = await FnRemoveChildrenNodes(
        clonnedData,
        parentNodeByType.key,
        dcExplorerContainerProps.featureId,
        treeContainerFlatDataProps.featureTreeProps,
        updatedOriginalTreeData,
        resultData.filterApplied
      );
      updatedTreeData = await FnAddSubNode(
        treeDataCloned,
        parentNodeByType.key,
        removedNodes as ITreeNode[],
        treeContainerFlatDataProps.featureTreeProps,
        dcExplorerContainerProps.featureId,
        false,
        parentNodeByType.stepNo
      );

      if (idToFind) {
        const foundParents = FnFindNodeAndParents(updatedTreeData, idToFind);
        if (foundParents?.length) {
          const keysToExpand: Key[] = [];
          let nodeToSelect: ITreeNode | undefined = undefined;
          for (let index = 0; index < foundParents.length; index++) {
            const element = foundParents[index];
            if (
              element.key.toLowerCase() !== idToFind.toLowerCase() &&
              element.NodeEntID?.toLowerCase() !== idToFind.toLowerCase()
            ) {
              keysToExpand.push(element.key);
            } else {
              nodeToSelect = element;
            }
          }
          if (nodeToSelect) {
            logDcExplorerSession("refresh tree → Sidebar", {
              event: "select",
              nodeKey: nodeToSelect.key,
              nodeName: nodeToSelect.Name,
              nodeType: nodeToSelect.NodeType,
            });
            axiosInterceptor({
              url: SESSION.UpdateSession,
              data: {
                jsonSession: JSON.stringify([{ VariableContext: "Optional", VariableName: "Sidebar", SessionValue: "1" }])
              },
              setFetchData: (sessionUpdateApiResponse: unknown, status?: string) => {
                if (status === "200" && isSessionUpdateApiResponse(sessionUpdateApiResponse) && sessionUpdateApiResponse.jsonSessionOutput) {
                  const parsedData = FnHandleAPIResponse(sessionUpdateApiResponse.jsonSessionOutput, "Dataset")
                  if (parsedData && parsedData.length > 0) {
                    sessionContext.setSessionList(parsedData);
                  }
                }
              }
            }, statusBarContext);
            const mergedExpandedKeys = Array.from(new Set([...defaultExpandedKeys, ...keysToExpand]));
            currentTreeData = updatedTreeData;
            setTreeData(updatedTreeData);
            expandedNodeKeys = mergedExpandedKeys;
            setDefaultExpandedKeys(mergedExpandedKeys);
            needToUpdateTreeNodeRef.current = true;
            selectedNodeKeys = [nodeToSelect.key];
            setDefaultSelectedKeys([nodeToSelect.key]);
            setDefaultSelectedNodeInfo({
              event: "select",
              node: nodeToSelect,
              selected: true,
              selectedNodes: []
            });
            if (dcExplorerContainerProps.handleNodeSelect) {
              dcExplorerContainerProps.handleNodeSelect([nodeToSelect.key], {
                event: "select",
                node: nodeToSelect,
                selected: true,
                selectedNodes: []
              }, mergedExpandedKeys, updatedTreeData, undefined, true)
            }
          }
        }
      } else {
        if (parentNodeByType.NodeType && parentNodeByType.NodeType?.toLowerCase() !== "site") {
          currentTreeData = updatedTreeData;
          setTreeData(updatedTreeData);

          if (parentNodeByType.key === selectedNode.key) {
            const parentNodes = FnFindNodeAndParents(updatedTreeData, parentNodeByType.key);
            if (parentNodes?.length) {
              const expandedKeys = parentNodes
                .filter(item => item.key !== parentNodeByType.key)
                .map(item => item.key);
              expandedNodeKeys = expandedKeys;
              setDefaultExpandedKeys(expandedKeys);
            }
          }
          const parsedKeys = FnParseJsonSafely(selectedKey);
          needToUpdateTreeNodeRef.current = true;
          selectedNodeKeys = parsedKeys;
          setDefaultSelectedKeys([...parsedKeys]);
        } else {

          const parentNodes = FnFindNodeAndParents(updatedTreeData, selectedNode.key);
          let expandedKeys = [...defaultExpandedKeys];
          if (parentNodes?.length) {
            expandedKeys = parentNodes
              .filter(item => item.key !== selectedNode.key)
              .map(item => item.key);
            expandedNodeKeys = expandedKeys;
            setDefaultExpandedKeys(expandedKeys);
          }

          currentTreeData = updatedTreeData;
          setTreeData(updatedTreeData);

          const newSelectedKeys = [selectedNode.key];
          needToUpdateTreeNodeRef.current = true;
          selectedNodeKeys = newSelectedKeys;
          setDefaultSelectedKeys([...newSelectedKeys]);
          setDefaultSelectedNodeInfo({
            event: "select",
            node: selectedNode,
            selected: true,
            selectedNodes: []
          });
          if (dcExplorerContainerProps.handleNodeSelect) {
            dcExplorerContainerProps.handleNodeSelect([selectedNode.key], {
              event: "select",
              node: selectedNode,
              selected: true,
              selectedNodes: []
            }, expandedKeys, updatedTreeData)
          }
        }
      }

      if (dcExplorerContainerProps.updateOriginalTreeDataset) {
        dcExplorerContainerProps.updateOriginalTreeDataset(updatedOriginalTreeData, expandedNodeKeys, selectedNodeKeys, currentTreeData);
      }
      explorerTreeContext.setIsRefreshed(true);
    } catch (error) {
      console.error("Error in handleRefreshTreeNodes:", error);
      explorerTreeContext.setIsRefreshed(false);
    }
  }

  // Refreshes child nodes for the selected floor, device, or site via API.
  const handleRefreshCurrentNode = async (nodeToRefresh?: ITreeNode, nodeToSelect?: ITreeNode) => {
    try {
      const isRefreshAndSelect = nodeToRefresh && nodeToSelect ? true : false;
      const selectedNode = nodeToRefresh ?? defaultSelectedNodeInfo?.node;
      if (!selectedNode || !treeContainerFlatDataProps || !treeData) {
        return;
      }
      const isConfigurationFeature =
        dcExplorerContainerProps.featureId === FEnums.AssetConfiguration ||
        dcExplorerContainerProps.featureId === FEnums.ConfigureDevice ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;
      const isInventoryFeature =
        dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;

      if (isConfigurationFeature && !isPortNode(selectedNode) && isRuPmInOutSlotPort(selectedNode)) {
        const { isUnderRack, rackNode } = isNodeUnderRackOnly(treeData, selectedNode);
        if (isUnderRack && rackNode) {
          const refreshed = await handleRefreshRackChildNode(
            selectedNode,
            rackNode,
            nodeToSelect,
            nodeToRefresh
          );
          if (refreshed) {
            return;
          }
        }
      }
      const isRack = isRackNode(selectedNode);
      const isPort = isPortNode(selectedNode);
      const isDevice =
        (selectedNode.NodeType ?? "").toLowerCase().trim() === "device" ||
        (selectedNode.treetype ?? "").toLowerCase().trim() === "device";
      const isInventoryConfiguration =
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;
      const nodeType = (selectedNode.NodeType ?? selectedNode.treetype ?? "").toLowerCase().trim();
      const treeType = (selectedNode.treetype ?? selectedNode.NodeType ?? "").toLowerCase().trim();
      const isView =
        isViewNode(selectedNode) ||
        treeType === "deviceview" ||
        nodeType === "deviceview" ||
        treeType === "view" ||
        nodeType === "view";

      const isSelectedNodeMountedDevice =
        !isPort &&
        !isView &&
        !isRack &&
        !isDevice &&
        (nodeType === "mounteddevice" ||
          treeType === "mounteddevice" ||
          (selectedNode.NodeType ?? "").toLowerCase().trim() === "mounteddevice" ||
          (selectedNode.treetype ?? "").toLowerCase().trim() === "mounteddevice" ||
          isMountedDeviceNode(selectedNode));

      let apiCalled: "site" | "floor" | "mounteddevice" = "site";
      let parentNodeByType: ITreeNode | null = null;
      let apiNodeForTree: ITreeNode | null = null;
      let idToRefreshForTree: string | undefined = undefined;

      if (isView) {
        apiCalled = "mounteddevice";
        const viewKey = (selectedNode.key ?? selectedNode.NodeEntID ?? "").toString();
        const ancestors = viewKey ? FnFindNodeAndParents(treeData, viewKey) ?? [] : [];
        const ruAncestor = ancestors.slice(0, -1).reverse().find(isRuPmInOutSlotPort);
        const rackAncestor = ancestors.slice(0, -1).reverse().find(isRackNode);

        if (ruAncestor && rackAncestor) {
          // Mounted device view inside an RU slot
          const mountedDeviceId = (
            (selectedNode as any).DeviceEntId ||
            (selectedNode as any).MountedDeviceID ||
            selectedNode.MountedDeviceEntID ||
            selectedNode.parentEntID ||
            ""
          ).toString();
          apiNodeForTree = {
            ...selectedNode,
            treetype: "Device",
            NodeType: "Device",
            NodeEntID: mountedDeviceId,
            MountedDeviceEntID: mountedDeviceId
          };
          parentNodeByType = ruAncestor;
          idToRefreshForTree = selectedNode.NodeEntID?.toString();
        } else if (rackAncestor) {
          // Rack view (e.g. Front or Rear view of a rack)
          parentNodeByType = rackAncestor;
          apiNodeForTree = {
            ...rackAncestor,
            treetype: "Device",
            MountedDeviceEntID: ""
          };
          idToRefreshForTree = selectedNode.NodeEntID?.toString();
        } else {
          // Floor device / chassis view
          const deviceAncestor = ancestors.slice(0, -1).reverse().find(a =>
            (a.NodeType ?? a.treetype ?? "").toLowerCase() === "device"
          ) ?? FnFindNearestNodeByType(treeData, selectedNode, "Device");
          parentNodeByType = deviceAncestor ?? selectedNode;
          apiNodeForTree = parentNodeByType;
          idToRefreshForTree = selectedNode.NodeEntID?.toString();
        }
      } else if (isPort) {
        apiCalled = "mounteddevice";
        const portKey = (selectedNode.key ?? selectedNode.NodeEntID ?? "").toString();
        const ancestors = portKey ? FnFindNodeAndParents(treeData, portKey) ?? [] : [];

        // 1. Find enclosing device ancestor
        const deviceAncestor = ancestors.slice(0, -1).reverse().find(a => {
          const nt = (a.NodeType ?? "").toLowerCase().trim();
          const tt = (a.treetype ?? "").toLowerCase().trim();
          return nt === "device" || tt === "device" || isMountedDeviceNode(a) || Boolean(a.MountedDeviceEntID);
        }) ?? FnFindNearestNodeByType(treeData, selectedNode, "Device") ?? FnFindNearestNodeByType(treeData, selectedNode, "MountedDevice");

        const ruAncestor = ancestors.slice(0, -1).reverse().find(a => {
          const nt = (a.NodeType ?? a.treetype ?? "").toLowerCase().trim();
          return nt === "ru" || Boolean(a.MountedDeviceEntID);
        });

        // 2. Resolve device ID for API
        const deviceId = resolveDeviceGuid(
          deviceAncestor?.MountedDeviceEntID,
          (deviceAncestor as any)?.DeviceEntId,
          (deviceAncestor as any)?.MountedDeviceID,
          deviceAncestor?.NodeEntID,
          ruAncestor?.MountedDeviceEntID,
          (selectedNode as any)?.DeviceEntId,
          selectedNode.MountedDeviceEntID
        ) ?? deviceAncestor?.NodeEntID?.toString();

        // 3. API node must be the Device
        apiNodeForTree = {
          ...(deviceAncestor ?? selectedNode),
          treetype: "Device",
          NodeType: "Device",
          NodeEntID: deviceId ?? null,
          MountedDeviceEntID: deviceId ?? ""
        };

        // 4. Immediate parent of the port whose children (ports) will be replaced
        const immediateParent = ancestors.length > 1 ? ancestors[ancestors.length - 2] : null;
        parentNodeByType = immediateParent ?? deviceAncestor ?? selectedNode;

        // 5. idToRefreshForTree must be the parent's ID so FnConvertFlatDataToHierarchyData extracts all ports under this parent
        idToRefreshForTree = (selectedNode.parentEntID ?? immediateParent?.NodeEntID ?? immediateParent?.key)?.toString();
      } else if (
        nodeType === "site" ||
        nodeType === "floor" ||
        nodeType === "store" ||
        isRack ||
        ((nodeType === "rack" ||
          nodeType === "device" ||
          isDevice) && isConfigurationFeature)
      ) {
        parentNodeByType = selectedNode;
      } else if (isSelectedNodeMountedDevice || (treeType && ["deviceslot", "mounteddevice", "devicenetworkport", "devicepowerport"].includes(treeType)) || (nodeType && ["deviceslot", "mounteddevice", "devicenetworkport", "devicepowerport"].includes(nodeType))) {
        parentNodeByType = FnFindNearestNodeByType(treeData, selectedNode, "DeviceSlot");
        if (!parentNodeByType) {
          parentNodeByType = FnFindNearestNodeByType(treeData, selectedNode, "Device");
        }
        if (!parentNodeByType) {
          parentNodeByType = FnFindNearestNodeByType(treeData, selectedNode, "Rack");
        }
        if (!parentNodeByType) {
          parentNodeByType = FnFindNearestNodeByType(treeData, selectedNode, "Floor");
        }
      } else {
        parentNodeByType = FnFindNearestNodeByType(treeData, selectedNode, "Slot");
        parentNodeByType ??=
          FnFindNearestNodeByType(treeData, selectedNode, "Floor");
        parentNodeByType ??=
          FnFindNearestNodeByType(treeData, selectedNode, "Store");
        parentNodeByType ??=
          FnFindNearestNodeByType(treeData, selectedNode, "Site");
      }
      if (!parentNodeByType) {
        return;
      }
      else if (parentNodeByType.NodeType || parentNodeByType.treetype) {
        const parentType = (parentNodeByType.NodeType ?? parentNodeByType.treetype ?? "").toLowerCase().trim();
        if (isRack || isRackNode(parentNodeByType)) {
          apiCalled = "mounteddevice";
        }
        else if (isDevice && isInventoryConfiguration) {
          apiCalled = "mounteddevice";
        }
        else if (["rack", "device", "deviceslot", "pm", "ru", "port", "inpoutplug"].includes(parentType) && isConfigurationFeature) {
          apiCalled = "mounteddevice";
        }
        else if (["mounteddevice"].includes(nodeType) || isSelectedNodeMountedDevice) {
          apiCalled = "mounteddevice";
        }
        else if (["floor", "store", "rack", "device"].includes(parentType)) {
          apiCalled = "floor";
        }
      }
      const previousSelectedKeys = JSON.stringify(nodeToRefresh ? [nodeToRefresh.key] : defaultSelectedKeys);
      let originalTree = isInventoryFeature
        ? originalTreeDataForInventory
        : originalTreeData;
      const isCallMountedDeviceApi = !isSelectedNodeMountedDevice && (apiCalled === "mounteddevice" || (isDevice && isInventoryConfiguration));
      const resolvedIdToRefresh = idToRefreshForTree ?? (
        isSelectedNodeMountedDevice
          ? (selectedNode.parentEntID ?? parentNodeByType.NodeEntID ?? selectedNode.NodeEntID ?? undefined)
          : (isRack || nodeType === "rack" || isCallMountedDeviceApi)
            ? (selectedNode.NodeEntID ?? selectedNode.parentEntID ?? undefined)
            : (selectedNode.parentEntID ?? undefined)
      );
      let filteredResult = await FnCallApiToGetDataForTree(
        originalTree,
        apiNodeForTree ?? parentNodeByType,
        dcExplorerContainerProps.featureId,
        statusBarContext,
        sessionContext.SessionList,
        nodeToSelect ? false : true,
        resolvedIdToRefresh,
        dcExplorerContainerProps.applyFilter,
        mainAppContext.allSitesHierarchyRecords,
        mainAppContext.setAllSitesHierarchyRecords
      );

      if (!filteredResult.formattedTree || filteredResult.formattedTree.length === 0) {
        dcExplorerContainerProps.handleShowUserMessage?.("No data found for current node to refresh")
        if (!nodeToSelect)
          explorerTreeContext.setIsRefreshed(true);
        selectedNodeContext.setDcNodeToRefresh(undefined);
        return;
      }
      else {
        setDefaultSelectedKeys([]);
        lastHandledKeyRef.current = null;
      }
      let treeDataCloned = [...treeData];

      const selectedNodeKey =
        nodeToRefresh ? nodeToRefresh.key : defaultSelectedKeys[0] ??
          selectedNode.key ??
          parentNodeByType.key;
      let expandedNodeKeys = defaultExpandedKeys;
      let selectedNodeKeys = nodeToRefresh ? [nodeToRefresh.key] : defaultSelectedKeys;
      let currentTreeData = treeData;
      const isRackRefresh = !isView && (isRack || isRackNode(parentNodeByType));
      const isMountedDevice = isView || isPort || (selectedNode.parentEntID && apiCalled === "mounteddevice") || isRackRefresh || (isDevice && isInventoryConfiguration) ? true : false;
      const nodeIdToRefresh = isView
        ? selectedNodeKey.toString()
        : isPort
          ? (parentNodeByType?.key ?? parentNodeByType?.NodeEntID ?? selectedNode.parentEntID ?? selectedNodeKey)?.toString()
          : (
            isRackRefresh
              ? (parentNodeByType.key ?? parentNodeByType.NodeEntID ?? selectedNodeKey)
              : apiCalled === "mounteddevice" && (["device", "rack"].includes(nodeType.toLowerCase()) || isDevice)
                ? (parentNodeByType.key ?? parentNodeByType.NodeEntID ?? selectedNodeKey)
                : apiCalled === "mounteddevice"
                  ? (selectedNode.parentEntID ?? selectedNodeKey)
                  : selectedNodeKey
          )?.toString() ?? selectedNodeKey.toString();
      const selectedNodeTypeLower = (selectedNode.NodeType ?? "").toLowerCase().trim();
      const selectedTreeTypeLower = (selectedNode.treetype ?? "").toLowerCase().trim();
      const isInvMfgEqTypeOrProduct =
        isInventoryFeature &&
        (["manufacturer", "eqtype", "product"].includes(selectedNodeTypeLower) ||
          ["manufacturer", "eqtype", "product"].includes(selectedTreeTypeLower));

      const findSelectedRecord = (nodes: ITreeNode[] | null | undefined): ITreeNode | null => {
        if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return null;

        const selKey = selectedNode.key?.toString();
        const selEntId = selectedNode.NodeEntID?.toString();
        const selName = selectedNode.Name?.toLowerCase().trim();
        const selType = (selectedNode.NodeType ?? selectedNode.treetype ?? "").toLowerCase().trim();

        // 1. Direct match by key
        let match = nodes.find(n => selKey && n.key?.toString() === selKey);
        if (match) return match;

        // 2. Direct match by NodeEntID
        match = nodes.find(n => selEntId && n.NodeEntID?.toString() === selEntId);
        if (match) return match;

        // 3. Cross match key / NodeEntID
        match = nodes.find(n =>
          (selKey && n.NodeEntID?.toString() === selKey) ||
          (selEntId && n.key?.toString() === selEntId)
        );
        if (match) return match;

        // 4. Match by Name and Type
        if (selName) {
          match = nodes.find(n => {
            const nName = n.Name?.toLowerCase().trim();
            const nType = (n.NodeType ?? n.treetype ?? "").toLowerCase().trim();
            return nName === selName && (!selType || !nType || nType === selType);
          });
          if (match) return match;
        }

        // 5. Deep search in children
        for (const n of nodes) {
          if (n.children && n.children.length > 0) {
            const childMatch = findSelectedRecord(n.children);
            if (childMatch) return childMatch;
          }
        }

        return null;
      };

      const selectedRecordOriginal = isInvMfgEqTypeOrProduct
        ? findSelectedRecord(filteredResult.formattedTree)
        : null;
      const nodeToReplaceOriginal = isRefreshAndSelect || isMountedDevice
        ? filteredResult.formattedTree
        : isInvMfgEqTypeOrProduct
          ? (selectedRecordOriginal ?? filteredResult.formattedTree[0] ?? filteredResult.formattedTree)
          : (filteredResult.formattedTree[0] ?? filteredResult.formattedTree);
      if (!nodeToReplaceOriginal) {
        return;
      }
      const updatedOriginalTreeData = await FnReplaceNodeForRefresh(
        originalTree,
        nodeIdToRefresh ?? selectedNodeKey.toString(),
        nodeToReplaceOriginal,
        treeContainerFlatDataProps.featureTreeProps,
        dcExplorerContainerProps.featureId,
        true,
        parentNodeByType.stepNo,
        true
      );

      if (isInventoryFeature) {
        setOriginalTreeDataForInventory(updatedOriginalTreeData);
      } else {
        setOriginalTreeData(updatedOriginalTreeData);
      }
      let refreshedNodes: ITreeNode[] | null = [];
      if (isRackRefresh && !isConfigurationFeature) {
        // Non-configuration features show mounted devices directly under the rack
        let foundMountedDevices = FnFindChildrenBasedOnKey(
          updatedOriginalTreeData,
          (parentNodeByType.key ?? parentNodeByType.NodeEntID ?? "").toString(),
          dcExplorerContainerProps.featureId
        );
        if (foundMountedDevices && foundMountedDevices.length > 0) {
          foundMountedDevices = FnUpdateNodeWithTitleAndIcon(
            foundMountedDevices,
            treeContainerFlatDataProps.featureTreeProps,
            dcExplorerContainerProps.featureId
          );
        }
        refreshedNodes = foundMountedDevices ?? [];
      } else if (selectedNode.parentEntID && (nodeType === "mounteddevice" || isSelectedNodeMountedDevice)) {
        refreshedNodes = FnFindChildrenBasedOnKey(updatedOriginalTreeData, selectedNode.parentEntID, dcExplorerContainerProps.featureId);
        if (refreshedNodes?.length && !isMountedDevice) {
          refreshedNodes = refreshedNodes.filter((item) => item.NodeEntID === selectedNode.NodeEntID);
        }
      }
      else {
        const clonedData = FnDeepClone(filteredResult.formattedTree);
        refreshedNodes = await FnRemoveChildrenNodes(
          clonedData,
          selectedNode.key,
          dcExplorerContainerProps.featureId,
          treeContainerFlatDataProps.featureTreeProps,
          updatedOriginalTreeData,
          filteredResult.filterApplied
        );
        if (refreshedNodes.length > 1 && !isRefreshAndSelect && !isMountedDevice) {
          if (isInvMfgEqTypeOrProduct) {
            const matched = findSelectedRecord(refreshedNodes);
            refreshedNodes = matched ? [matched] : refreshedNodes;
          } else {
            refreshedNodes = refreshedNodes.filter((item) => item.NodeEntID === selectedNode.NodeEntID);
          }
        }
      }
      if (!refreshedNodes) {
        return;
      }
      if (refreshedNodes.length === 0 && isRackRefresh) {
        const targetRack = FnFindNodeAndParents(treeDataCloned, nodeIdToRefresh)?.pop();
        if (targetRack) {
          targetRack.children = [];
          targetRack.isLeaf = true;
          targetRack.HasChildren = 0;
        }
      }
      const selectedRecordTree = isInvMfgEqTypeOrProduct
        ? findSelectedRecord(refreshedNodes)
        : null;
      const nodeToReplaceTree = isRefreshAndSelect || isMountedDevice
        ? refreshedNodes
        : isInvMfgEqTypeOrProduct
          ? (selectedRecordTree ?? refreshedNodes[0] ?? refreshedNodes)
          : (refreshedNodes[0] ?? refreshedNodes);
      if (!nodeToReplaceTree) {
        return;
      }
      let updatedTreeData = await FnReplaceNodeForRefresh(
        treeDataCloned,
        nodeIdToRefresh ?? selectedNodeKey.toString(),
        nodeToReplaceTree,
        treeContainerFlatDataProps.featureTreeProps,
        dcExplorerContainerProps.featureId,
        false,
        parentNodeByType.stepNo,
        true
      );
      const updateExpandedKeys = (
        key: Key,
        expandCurrentNode = false
      ): Key[] => {
        const parents = FnFindNodeAndParents(updatedTreeData, key.toString());

        if (!parents?.length) {
          return defaultExpandedKeys;
        }

        const keys = parents
          .filter(item => item.key !== key)
          .map(item => item.key);

        if (expandCurrentNode) {
          const currentNode = parents.find(item => item.key === key);

          if (
            currentNode &&
            Number(currentNode.HasChildren ?? 0) > 0 &&
            !keys.includes(key.toString())
          ) {
            keys.push(key.toString());
          }
        }

        setDefaultExpandedKeys(keys);

        return keys;
      };
      const updateTree = (tree: ITreeNode[]) => {
        currentTreeData = tree;
        setTreeData(tree);
      };
      const targetNodeForExpansion = nodeToSelect ?? selectedNode;
      const isExpandCurrentNode =
        (isInventoryFeature && dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration && targetNodeForExpansion.NodeType?.toLowerCase() === "device") ||
          isRuPmInOutSlotPort(targetNodeForExpansion)
          ? false
          : true;
      if (nodeToSelect) {
        expandedNodeKeys = updateExpandedKeys(nodeToSelect.key, isExpandCurrentNode);

        updateTree(updatedTreeData);
        const newSelectedKeys = [nodeToSelect.key];
        needToUpdateTreeNodeRef.current = true;
        selectedNodeKeys = newSelectedKeys;
        setDefaultSelectedKeys([...newSelectedKeys]);
        setDefaultSelectedNodeInfo({
          event: "select",
          node: nodeToSelect,
          selected: true,
          selectedNodes: []
        });
        dcExplorerContainerProps.handleNodeSelect?.(
          [nodeToSelect.key],
          {
            event: "select",
            node: nodeToSelect,
            selected: true,
            selectedNodes: []
          },
          expandedNodeKeys,
          updatedTreeData
        );
        selectedNodeContext.setDcNodeToRefresh(undefined)
      }
      else if (
        parentNodeByType.NodeType &&
        parentNodeByType.NodeType.toLowerCase() !== "site"
      ) {
        updateTree(updatedTreeData);

        expandedNodeKeys = updateExpandedKeys(selectedNode.key, isExpandCurrentNode);
        const parsedKeys = FnParseJsonSafely(previousSelectedKeys);
        needToUpdateTreeNodeRef.current = true;
        selectedNodeKeys = parsedKeys;
        setDefaultSelectedKeys([...parsedKeys]);
        if (nodeToRefresh) {
          updateTree(updatedTreeData);
        }
        const targetRefreshedNode = isInvMfgEqTypeOrProduct
          ? (selectedRecordTree ?? selectedRecordOriginal ?? selectedNode)
          : selectedNode;
        const refreshedSelectedNode = { ...targetRefreshedNode, refreshKey: FnGenerateUID() };
        setDefaultSelectedNodeInfo({
          event: "select",
          node: refreshedSelectedNode,
          selected: true,
          selectedNodes: []
        });
        if (dcExplorerContainerProps.handleNodeSelect) {
          dcExplorerContainerProps.handleNodeSelect(
            [selectedNode.key],
            {
              event: "select",
              node: refreshedSelectedNode,
              selected: true,
              selectedNodes: []
            },
            expandedNodeKeys,
            updatedTreeData
          );
        }
      }
      else {
        expandedNodeKeys = updateExpandedKeys(selectedNode.key, isExpandCurrentNode);
        updateTree(updatedTreeData);
        const newSelectedKeys = [selectedNode.key];
        needToUpdateTreeNodeRef.current = true;
        selectedNodeKeys = newSelectedKeys;
        setDefaultSelectedKeys([...newSelectedKeys]);
        const targetRefreshedNodeElse = isInvMfgEqTypeOrProduct
          ? (selectedRecordTree ?? selectedRecordOriginal ?? selectedNode)
          : selectedNode;
        setDefaultSelectedNodeInfo({
          event: "select",
          node: { ...targetRefreshedNodeElse, refreshKey: FnGenerateUID() },
          selected: true,
          selectedNodes: []
        });
        if (dcExplorerContainerProps.handleNodeSelect) {
          dcExplorerContainerProps.handleNodeSelect(
            [selectedNode.key],
            {
              event: "select",
              node: { ...targetRefreshedNodeElse, refreshKey: FnGenerateUID() },
              selected: true,
              selectedNodes: []
            },
            expandedNodeKeys,
            updatedTreeData
          );
        }
      }
      if (dcExplorerContainerProps.updateOriginalTreeDataset) {
        dcExplorerContainerProps.updateOriginalTreeDataset(
          updatedOriginalTreeData,
          expandedNodeKeys,
          selectedNodeKeys,
          currentTreeData
        );
      }
      if (!nodeToSelect)
        explorerTreeContext.setIsRefreshed(true);
    } catch (error) {
      console.error("Error in handleRefreshCurrentNode:", error);
      explorerTreeContext.setIsRefreshed(false);
    }
  };

  const refreshTreeAfterDelete = () => {
    if (defaultSelectedNodeInfo?.node.parentEntID && treeDataRef.current) {
      const parentNode = FnGetNodeDetailsBaseOnKey(treeDataRef.current, defaultSelectedNodeInfo.node.parentEntID, true);
      if (parentNode.nodeData?.node) {
        handleRefreshCurrentNode(parentNode.nodeData.node);
      } else {
        handleRefreshCurrentNode();
      }
    } else {
      handleRefreshCurrentNode();
    }
  };

  /**
   * External delete/empty refresh handler.
   * 1. Resolves the node to select (parent for actual deletes, self for empty/dispose).
   * 2. Builds the correct session hierarchy based on featureId:
   *      - InventoryManagement / InventoryConfiguration → Inventory context (Store, Bin, Mfg…)
   *      - All other DC features                        → Location context (Site, Floor, Room…)
   * 3. Calls UpdateSession so the backend knows which node is now selected.
   * 4. Refreshes the tree at the resolved node.
   *
   * - mode 'parent' → the node was removed, refresh its parent (Delete, DeleteBin, DeleteLocation).
   * - mode 'self'   → the node itself still exists but its children changed (Empty*, DeleteAll, DisposeAll).
   */
  const handleDeleteRefresh = async (mode: 'parent' | 'self') => {
    if (!defaultSelectedNodeInfo?.node || !treeDataRef.current) {
      handleRefreshCurrentNode();
      return;
    }
    await FnDeleteAndRefreshTree({
      selectedNode: defaultSelectedNodeInfo.node,
      treeData: treeDataRef.current,
      mode,
      featureId: dcExplorerContainerProps.featureId,
      sessionContext,
      statusBarContext,
      onRefresh: (nodeToRefresh) => handleRefreshCurrentNode(nodeToRefresh),
    });
  };

  /**
   * Separate handler for tree refresh after an internal drag-and-drop operation.
   * If the drag and drop are within a single Floor (or Store), it executes a single
   * API call passing isRefresh: false to reload the entire floor hierarchy.
   */
  const handleInternalDragDropRefresh = async (
    dragNode: ITreeNode,
    dropNode: ITreeNode
  ) => {
    if (!treeData || !treeContainerFlatDataProps) return;
    await FnInternalDragDropRefreshTree({
      dragNode,
      dropNode,
      treeData,
      originalTreeData,
      originalTreeDataForInventory,
      featureId: dcExplorerContainerProps.featureId,
      statusBarContext,
      sessionList: sessionContext.SessionList,
      featureTreeProps: treeContainerFlatDataProps.featureTreeProps,
      setTreeData,
      setOriginalTreeData,
      originalTreeDataRef,
      setOriginalTreeDataForInventory,
      originalTreeDataForInventoryRef,
      needToUpdateTreeNodeRef,
      defaultExpandedKeys,
      setDefaultExpandedKeys,
      setDefaultSelectedKeys,
      setDefaultSelectedNodeInfo,
      lastHandledKeyRef,
      setIsRefreshed: explorerTreeContext.setIsRefreshed,
      handleNodeSelect: dcExplorerContainerProps.handleNodeSelect,
      updateOriginalTreeDataset: dcExplorerContainerProps.updateOriginalTreeDataset,
      allSitesHierarchyRecords: mainAppContext.allSitesHierarchyRecords,
      setAllSitesHierarchyRecords: mainAppContext.setAllSitesHierarchyRecords,
    });
  };

  // Re-selects and expands tree nodes after drag-and-drop using node entity ids.
  const handleRefreshTreeForDragAndDropById = async (
    dragNodeId: Key,
    dropNodeId: Key,
    newSlotId?: Key
  ) => {
    if (!treeData || !treeContainerFlatDataProps) return;
    let currentTreeData = [...treeData];
    let expandedNodeKeys: Key[] = [];
    let selectedNodeKeys: Key[] = [];
    let updatedOriginalTreeData: ITreeNode[] = dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
      dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration
      ? originalTreeDataForInventory
      : originalTreeData;
    /* -------------------------------------------------------
       Helper: Find node by key
       ------------------------------------------------------- */
    const findNodeByKey = async (key: Key, source: ITreeNode[]) => {
      const keyStr = key.toString();
      let result = FnFindNodeAndParents(source, keyStr);
      if (!result?.length) {
        const lower = keyStr.toLowerCase();
        const searchRecursive = (nodes: ITreeNode[], parents: ITreeNode[] = []): ITreeNode[] | null => {
          for (const node of nodes) {
            if (!node || typeof node !== "object") continue;
            const nKey = (node.key ?? "").toString().toLowerCase();
            const nEntId = (node.NodeEntID ?? "").toString().toLowerCase();
            const nEqId = (node.EQID ?? "").toString().toLowerCase();
            const nSlotId = ((node as any).SlotID ?? (node as any).slotID ?? "").toString().toLowerCase();
            if (
              nKey === lower ||
              nEntId === lower ||
              nEqId === lower ||
              nSlotId === lower ||
              nKey.split("##")[0] === lower ||
              nEntId.split("##")[0] === lower
            ) {
              return [...parents, node];
            }
            if (Array.isArray(node.children)) {
              const res = searchRecursive(node.children, [...parents, node]);
              if (res) return res;
            }
          }
          return null;
        };
        result = searchRecursive(source);
      }
      return result?.length ? result[result.length - 1] : undefined;
    };
    /* -------------------------------------------------------
       Helper: Find nearest Floor/Site
       ------------------------------------------------------- */
    const findNearestFloor = (node: ITreeNode, sourceTree: ITreeNode[]) =>
      FnFindNearestNodeByType(sourceTree, node, dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration ? "Device" : "DeviceSlot") ||
      FnFindNearestNodeByType(sourceTree, node, "Floor") ||
      FnFindNearestNodeByType(sourceTree, node, "Site");
    /* -------------------------------------------------------
       Helper: Refresh tree via API (NO SELECTION HERE)
       ------------------------------------------------------- */
    const refreshTreeByParent = async (parentNode: ITreeNode) => {
      const filteredResult = await FnCallApiToGetDataForTree(
        updatedOriginalTreeData,
        parentNode,
        dcExplorerContainerProps.featureId,
        statusBarContext,
        sessionContext.SessionList,
        false,
        undefined,
        dcExplorerContainerProps.applyFilter,
        mainAppContext.allSitesHierarchyRecords,
        mainAppContext.setAllSitesHierarchyRecords
      );

      if (!filteredResult.formattedTree) return;

      updatedOriginalTreeData = filteredResult.originalTreeData;
      if (
        dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration
      ) {
        setOriginalTreeDataForInventory(updatedOriginalTreeData);
        originalTreeDataForInventoryRef.current = updatedOriginalTreeData;
      } else {
        setOriginalTreeData(updatedOriginalTreeData);
        originalTreeDataRef.current = updatedOriginalTreeData;
      }
      const clonedFormattedData = FnDeepClone(filteredResult.formattedTree);
      const removedNodes = await FnRemoveChildrenNodes(
        clonedFormattedData,
        parentNode.key,
        dcExplorerContainerProps.featureId,
        treeContainerFlatDataProps.featureTreeProps,
        filteredResult.originalTreeData,
        filteredResult.filterApplied
      );
      currentTreeData = await FnAddSubNode(
        currentTreeData,
        parentNode.key,
        removedNodes as ITreeNode[],
        treeContainerFlatDataProps.featureTreeProps,
        dcExplorerContainerProps.featureId,
        false,
        parentNode.stepNo
      );
      setTreeData(currentTreeData);
    };
    /* -------------------------------------------------------
        Resolve DROP node from OLD tree
       ------------------------------------------------------- */
    const dropNode =
      (await findNodeByKey(dropNodeId, currentTreeData)) ||
      (newSlotId ? await findNodeByKey(newSlotId, currentTreeData) : undefined);
    if (!dropNode) return;

    const isRack =
      dropNode.NodeType?.toLowerCase() === "rack" ||
      dropNode.NodeEntityname?.toLowerCase() === "rack" ||
      dropNode.treetype?.toLowerCase() === "rack";

    const isRUOrSlot =
      isRack ||
      Boolean(newSlotId) ||
      dropNode.NodeType?.toLowerCase() === "ru" ||
      dropNode.treetype?.toLowerCase() === "ru" ||
      dropNode.Name?.toLowerCase().startsWith("ru#") ||
      dropNode.NodeType?.toLowerCase() === "slot" ||
      dropNode.treetype?.toLowerCase() === "slot" ||
      dropNode.treetype?.toLowerCase() === "deviceslot" ||
      dropNode.NodeType?.toLowerCase() === "inoutplug" ||
      dropNode.NodeType?.toLowerCase() === "pm";

    let dropParents = FnFindNodeAndParents(currentTreeData, dropNode.key.toString());
    const rackNode = isRack
      ? dropNode
      : (isRUOrSlot && dropParents
        ? (dropParents.slice(0, -1).reverse().find(p =>
          p.NodeType?.toLowerCase() === "rack" ||
          p.NodeEntityname?.toLowerCase() === "rack" ||
          p.treetype?.toLowerCase() === "rack"
        ) ||
          dropParents.slice(0, -1).reverse().find(p =>
            p.NodeType?.toLowerCase() === "device" ||
            p.treetype?.toLowerCase() === "device"
          ) ||
          FnFindNearestNodeByType(currentTreeData, dropNode, "Rack") ||
          FnFindNearestNodeByType(currentTreeData, dropNode, "Device"))
        : (isRUOrSlot
          ? (FnFindNearestNodeByType(currentTreeData, dropNode, "Rack") ||
            FnFindNearestNodeByType(currentTreeData, dropNode, "Device"))
          : null));

    if (isRUOrSlot && rackNode) {
      /* -------------------------------------------------------
         RU / Slot drop:
         1. Refresh source floor if device was moved from floor
         2. Refresh Rack first via relative API
         3. Find and Refresh Slot using newSlotId (or dropNodeId)
         4. Find and Select dropped device in refreshed slot
         ------------------------------------------------------- */
      setDefaultSelectedKeys([]);
      lastHandledKeyRef.current = null;

      // 1. Source floor refresh if dragged from floor
      const dragNode = dragNodeId ? await findNodeByKey(dragNodeId, currentTreeData) : undefined;
      const dragParent = dragNode ? findNearestFloor(dragNode, currentTreeData) : undefined;
      if (dragParent && dragParent.key !== rackNode.key) {
        await refreshTreeByParent(dragParent);
      }

      // 2. Refresh Rack
      const targetRackNode =
        (await findNodeByKey(rackNode.key, currentTreeData)) ||
        (rackNode.NodeEntID ? await findNodeByKey(rackNode.NodeEntID, currentTreeData) : undefined) ||
        rackNode;
      await refreshTreeByParent(targetRackNode);

      // 3. Find and Refresh Slot using newSlotId (fallback to dropNodeId / dropNode.key)
      const refreshedDropNode =
        (newSlotId ? await findNodeByKey(newSlotId, currentTreeData) : undefined) ||
        (await findNodeByKey(dropNodeId, currentTreeData)) ||
        (await findNodeByKey(dropNode.key, currentTreeData));

      if (refreshedDropNode) {
        await refreshTreeByParent(refreshedDropNode);
      }

      // 4. Find Dropped Node in refreshed slot (checking MountedDeviceID / MounteDeviceID / EQID / NodeEntID)
      const targetId = dragNodeId ? dragNodeId.toString().toLowerCase() : "";
      const latestDropNode = refreshedDropNode
        ? ((await findNodeByKey(refreshedDropNode.key, currentTreeData)) ||
          (newSlotId ? await findNodeByKey(newSlotId, currentTreeData) : null))
        : null;

      let droppedNode: ITreeNode | undefined;

      if (latestDropNode?.children?.length) {
        const findInDescendants = (nodes: ITreeNode[]): ITreeNode | undefined => {
          for (const child of nodes) {
            const mId = (child.MountedDeviceID ?? (child as any).MounteDeviceID ?? child.MountedDeviceEntID ?? "")?.toString().toLowerCase();
            const eqId = (child.EQID ?? "")?.toString().toLowerCase();
            const entId = (child.NodeEntID ?? "")?.toString().toLowerCase();
            const key = (child.key ?? "")?.toString().toLowerCase();
            if (
              targetId &&
              (mId === targetId ||
                eqId === targetId ||
                entId === targetId ||
                key === targetId ||
                mId.split("##")[0] === targetId ||
                entId.split("##")[0] === targetId ||
                key.split("##")[0] === targetId)
            ) {
              return child;
            }
            if (child.children?.length) {
              const res = findInDescendants(child.children);
              if (res) return res;
            }
          }
          return undefined;
        };
        droppedNode = findInDescendants(latestDropNode.children) || latestDropNode.children[0];
      }

      const nodeToSelect = droppedNode || latestDropNode || dropNode;
      const parentsOfSelected = FnFindNodeAndParents(currentTreeData, nodeToSelect.key.toString()) || [nodeToSelect];

      needToUpdateTreeNodeRef.current = true;
      selectedNodeKeys = [nodeToSelect.key];
      expandedNodeKeys = parentsOfSelected
        .filter(p => p.key !== nodeToSelect.key)
        .map(p => p.key);

      setDefaultExpandedKeys(expandedNodeKeys);
      setDefaultSelectedKeys(selectedNodeKeys);
      const selectInfo: ISelectedNodeInfo = {
        event: "select",
        node: { ...nodeToSelect, refreshKey: FnGenerateUID() },
        selected: true,
        selectedNodes: []
      };
      setDefaultSelectedNodeInfo(selectInfo);
      dcExplorerContainerProps.handleNodeSelect?.(
        selectedNodeKeys,
        selectInfo,
        expandedNodeKeys,
        currentTreeData,
        undefined,
        true
      );
      dcExplorerContainerProps.updateOriginalTreeDataset?.(
        dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
          dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration
          ? originalTreeDataForInventory
          : updatedOriginalTreeData,
        expandedNodeKeys,
        selectedNodeKeys,
        currentTreeData
      );
      explorerTreeContext.setIsRefreshed(true);
      return;
    }

    /* -------------------------------------------------------
       Existing Flow for Non-RU/Slot Drops (Floor, Store, etc.)
       ------------------------------------------------------- */
    let dropParent = findNearestFloor(dropNode, currentTreeData);
    if (
      dropNode.NodeType?.toLowerCase() === "floor" &&
      dropNode.isLeaf === false
    ) {
      dropParent = dropNode;
    }
    if (!dropParent) return;
    /* -------------------------------------------------------
       2️⃣ Refresh DROP parent FIRST
       ------------------------------------------------------- */
    setDefaultSelectedKeys([]);
    lastHandledKeyRef.current = null;
    await refreshTreeByParent(dropParent);
    /* -------------------------------------------------------
       3️⃣ Find DRAG node from REFRESHED tree
       ------------------------------------------------------- */
    const parents = FnFindNodeAndParents(
      currentTreeData,
      dragNodeId.toString()
    );
    needToUpdateTreeNodeRef.current = true;
    if (!parents?.length) {
      selectedNodeKeys = [dropNode.key];
      setDefaultSelectedKeys(selectedNodeKeys);
      setDefaultSelectedNodeInfo({
        event: "select",
        node: { ...dropNode, refreshKey: FnGenerateUID() },
        selected: true,
        selectedNodes: []
      });
      dcExplorerContainerProps.handleNodeSelect?.(
        selectedNodeKeys,
        {
          event: "select",
          node: { ...dropNode, refreshKey: FnGenerateUID() },
          selected: true,
          selectedNodes: []
        },
        expandedNodeKeys,
        currentTreeData,
        undefined,
        true
      );
      dcExplorerContainerProps.updateOriginalTreeDataset?.(
        updatedOriginalTreeData,
        expandedNodeKeys,
        selectedNodeKeys,
        currentTreeData
      );
      explorerTreeContext.setIsRefreshed(true);
      return;
    }
    const selectedNode =
      parents.find(p => p.key === dragNodeId || p.EQID === dragNodeId || p.NodeEntID === dragNodeId) ||
      parents[parents.length - 1];
    if (!selectedNode) return;
    expandedNodeKeys = parents
      .filter(p => p.key !== selectedNode.key && p.key !== dragNodeId)
      .map(p => p.key);
    needToUpdateTreeNodeRef.current = true;
    selectedNodeKeys = [selectedNode.key];
    setDefaultExpandedKeys(expandedNodeKeys);
    setDefaultSelectedKeys(selectedNodeKeys);
    const selectInfo: ISelectedNodeInfo = {
      event: "select",
      node: { ...selectedNode, refreshKey: FnGenerateUID() },
      selected: true,
      selectedNodes: []
    };
    setDefaultSelectedNodeInfo(selectInfo);
    dcExplorerContainerProps.handleNodeSelect?.(
      selectedNodeKeys,
      selectInfo,
      expandedNodeKeys,
      currentTreeData,
      undefined,
      true
    );
    dcExplorerContainerProps.updateOriginalTreeDataset?.(
      dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration
        ? originalTreeDataForInventory
        : originalTreeData,
      expandedNodeKeys,
      selectedNodeKeys,
      currentTreeData
    );
  };

  // Reloads tree when common context signals a post-drag refresh.
  useEffect(() => {
    if (commonVariableContext.reloadTreeFor && commonVariableContext.reloadTreeFor.featureId !== FEnums.ModelBusinessService) {
      const entIdToFind = commonVariableContext.reloadTreeFor.entId;
      const dropEntId = commonVariableContext.reloadTreeFor.dropNodeEntId;
      if (entIdToFind && dropEntId) {
        handleRefreshTreeForDragAndDropById(entIdToFind, dropEntId);
      }
      else {
        handleRefreshCurrentNode()
      }
    }
  }, [commonVariableContext.reloadTreeFor])

  // Handles right-click kebab menu actions on the selected tree node.
  const handleKebabMenuSelect = useCallback(async (selectedItem: IActionImageForSubMenu) => {

    if (selectedItem && selectedItem.payload && typeof selectedItem.payload === "object") {
      if ('Label' in selectedItem.payload) {
        if (selectedItem.payload.Label === RightMouseMenuTreeNode.Refresh && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeContainerFlatDataProps?.featureTreeProps) {
          handleRefreshCurrentNode();
        } else if ((selectedItem.payload.Label === RightMouseMenuTreeNode.BlockAll || selectedItem.payload.Label === RightMouseMenuTreeNode.unblockAll) && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
          if (treeData && mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);
            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
              sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
              EntityName: "WorkorderProfile",
              WorkorderType: "Change Slot",
              action: selectedItem.payload.Label === RightMouseMenuTreeNode.BlockAll ? "Block All" : "Unblock All",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
              ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              RUPosition: undefined,
              SlotStatus: selectedItem.payload.Label
            })
          } else {
            const handleBlockAvailableRusApiResponse = (response: unknown, status?: string) => {
              if (status === "200" && response !== undefined) {
                if (treeData) {
                  const payload: IFnCreateForensiclog = {
                    logType: 'UserAction',
                    GroupName: LogGroupName.ForensicLogTemplate,
                    _Forensiclog: LogSubGroupName.Device,
                    SubGroupName: LogSubGroupName.Device,
                    LogName: LogName.StatusChange,
                    actionObject: {
                      deviceName: defaultSelectedNodeInfo.node.Name,
                      Status: selectedItem.payload?.Label
                    },
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    RefTableItems: mainAppContext.refTableRecords
                  }
                  FnCreateForensiclog(payload)
                  dcExplorerContainerProps.handleShowUserMessage?.(`All available RUs ${selectedItem.payload?.Label === RightMouseMenuTreeNode.BlockAll ? "blocked" : "unblocked"} successfully.`)
                  handleRefreshCurrentNode();
                }
              }
            }
            axiosInterceptor({
              url: DEVICE.BlockAvailableRus,
              data: {
                "block": selectedItem.payload.Label === RightMouseMenuTreeNode.BlockAll ? true : false,
                entID: defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: handleBlockAvailableRusApiResponse
            }, statusBarContext)
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.OrderSubnodes && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
          setDefaultSelectedKeys([]);
          lastHandledKeyRef.current = null;
          const orderedNodes = FnOrderSubNodes(
            treeData,
            defaultSelectedNodeInfo.node.key,
            selectedItem.payload.Label,
            defaultSelectedNodeInfo.node
          );
          setTreeData(orderedNodes.updatedTree);
          if (orderedNodes.selectedNode) {
            const selectedKey = [orderedNodes.selectedNode.key]
            needToUpdateTreeNodeRef.current = true;
            setDefaultSelectedKeys([...selectedKey]);
            setDefaultSelectedNodeInfo({
              event: "select",
              node: orderedNodes.selectedNode,
              selected: true,
              selectedNodes: []
            });
            if (dcExplorerContainerProps.handleNodeSelect) {
              dcExplorerContainerProps.handleNodeSelect([orderedNodes.selectedNode.key], {
                event: "select",
                node: orderedNodes.selectedNode,
                selected: true,
                selectedNodes: []
              }, defaultExpandedKeys, orderedNodes.updatedTree)
            }
          }
        } else if ((selectedItem.payload.Label === RightMouseMenuTreeNode.BlockRU
          || selectedItem.payload.Label === RightMouseMenuTreeNode.ReserveRU
          || selectedItem.payload.Label === RightMouseMenuTreeNode.NormalRU) && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData
        ) {
          if (treeData && mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            const parentNodeByType = FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Device");
            setSelectedKebabMenu(selectedItem.payload)
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);
            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
              sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
              EntityName: "WorkorderProfile",
              WorkorderType: "Change Slot",
              action: "Change Slot",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: parentNodeByType?.NodeEntityname ?? "",
              ParentID: parentNodeByType?.NodeEntID ?? "",
              RUPosition: undefined,
              SlotStatus: selectedItem.payload.Label
            })
          } else {
            const handleSetSlotStatusApiResponse = (response: unknown, status?: string) => {
              if (response !== undefined && status === '200') {
                const payload: IFnCreateForensiclog = {
                  logType: 'UserAction',
                  GroupName: LogGroupName.ForensicLogTemplate,
                  _Forensiclog: LogSubGroupName.Device,
                  SubGroupName: LogSubGroupName.Device,
                  LogName: LogName.StatusChange,
                  actionObject: {
                    deviceName: defaultSelectedNodeInfo.node.Name,
                    Status: selectedItem.payload?.Label
                  },
                  sessionContext: sessionContext,
                  statusBarContext: statusBarContext,
                  RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payload)
                handleRefreshCurrentNode();
              }
            }
            axiosInterceptor({
              url: DEVICE.SetSlotStatus,
              data: {
                "block": selectedItem.payload.Label === RightMouseMenuTreeNode.BlockRU ? true : false,
                "reserved": selectedItem.payload.Label === RightMouseMenuTreeNode.ReserveRU ? true : false,
                "normal": selectedItem.payload.Label === RightMouseMenuTreeNode.NormalRU ? true : false,
                "entID": defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: handleSetSlotStatusApiResponse
            }, statusBarContext)
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.DonotOrderSubnodes && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
          setDefaultSelectedKeys([]);
          lastHandledKeyRef.current = null;
          const orderedNodes = FnOrderSubNodes(treeData, defaultSelectedNodeInfo.node.key, selectedItem.payload.Label);
          setTreeData(orderedNodes.updatedTree);
          if (orderedNodes.selectedNode) {
            const selectedKey = [orderedNodes.selectedNode.key]
            needToUpdateTreeNodeRef.current = true;
            setDefaultSelectedKeys([...selectedKey]);
            setDefaultSelectedNodeInfo({
              event: "select",
              node: orderedNodes.selectedNode,
              selected: true,
              selectedNodes: []
            });
            if (dcExplorerContainerProps.handleNodeSelect) {
              dcExplorerContainerProps.handleNodeSelect([orderedNodes.selectedNode.key], {
                event: "select",
                node: orderedNodes.selectedNode,
                selected: true,
                selectedNodes: []
              }, defaultExpandedKeys, orderedNodes.updatedTree)
            }
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.FindInInventory && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
          if (defaultSelectedNodeInfo.node.treetype != TreeNodeTypes.Site.toString()
            && defaultSelectedNodeInfo.node.treetype != TreeNodeTypes.Room.toString()
            && defaultSelectedNodeInfo.node.treetype != TreeNodeTypes.Floor.toString()
            && defaultSelectedNodeInfo.node.treetype != TreeNodeTypes.Location.toString()) {
            let EQID: string | number | null = null;
            if (defaultSelectedNodeInfo.node.EQID) {
              EQID = defaultSelectedNodeInfo.node.EQID;
            }
            else {
              const deviceId = FnGetDeviceIdFromEntID(treeData, defaultSelectedNodeInfo.node.NodeEntID ?? defaultSelectedNodeInfo.node.key);
              if (deviceId) {
                const handleGetPropertyValueApiResponse = (getPropertyValueApiResponse: unknown, status?: string) => {
                  if (status === "200" && getPropertyValueApiResponse && typeof getPropertyValueApiResponse === "object" && 'currentValue' in getPropertyValueApiResponse) {
                    let parsedData = FnParseJsonSafely(getPropertyValueApiResponse.currentValue as string);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                      EQID = parsedData[0].CurrentValue;
                    }
                  }
                }
                await axiosInterceptor({
                  url: PROPERTY.GetPropertyValue,
                  data: {
                    "entID": deviceId,
                    "entityName": defaultSelectedNodeInfo.node.NodeEntityname?.replace("__", ""),
                    "pgName": FindInInventoryVariables.PGHardware.toString(),
                    "propertyName": FindInInventoryVariables.EQID.toString()
                  },
                  setFetchData: handleGetPropertyValueApiResponse
                }, statusBarContext)
              }
            }
            if (!EQID) {
              dcExplorerContainerProps.handleShowUserMessage?.("Unable to find EQID for the selected node.");
            }
            else {
              axiosInterceptor({
                url: EXPLORER.SearchKeyword,
                data: {
                  keyword: EQID,
                  searchAllWord: true,
                  exploreType: 0,
                  excludedEntIDs: undefined
                },
                setFetchData: (searchKeywordApiResponse: unknown, status?: string) => {
                  const sessionId = statusBarContext.userSessionId
                  const showRedirectError = () => {
                    dcExplorerContainerProps.handleShowUserMessage?.(`Device Model (${EQID}) is not found in Spare inventory`);
                  };
                  if (status === "200" && sessionId && searchKeywordApiResponse && typeof searchKeywordApiResponse === "object" && 'searchEntIDsJson' in searchKeywordApiResponse) {
                    if (searchKeywordApiResponse.searchEntIDsJson) {
                      const parsedJson = FnParseJsonSafely(searchKeywordApiResponse.searchEntIDsJson as string);
                      if (parsedJson && Array.isArray(parsedJson) && parsedJson.length > 0) {
                        const siteName = sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "sitename")
                        if (siteName?.SessionValue) {
                          const hierarchyUrl = FnBuildUrlForFindHierarchy(parsedJson, siteName?.SessionValue);
                          const url = `${window.location.origin}/feature/${FEnums.InventoryManagement}?isnew=true&location=${FEnums.InventoryManagement}&id=${sessionId}${hierarchyUrl}`;

                          const newTab = window.open(url, "_blank");
                          if (!newTab) {
                            dcExplorerContainerProps.handleShowUserMessage?.("Popup blocked");
                          }
                          else {
                            axiosInterceptor({
                              url: KWD.DropSessionKeywordTable,
                              data: {},
                              setFetchData: (data: unknown) => {
                                if (import.meta.env.DEV)
                                  console.log('data :', data);
                              }
                            }, statusBarContext)
                          }
                          return;
                        }
                      }
                    }
                  }
                  showRedirectError();
                }
              }, statusBarContext)
            }
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Cut) {
          const currentTree = treeDataRef.current || treeData || [];
          const cutNode = defaultSelectedNodeInfo?.node;
          if (checkedNodeKeysRef.current && checkedNodeKeysRef.current.length > 0) {
            checkedNodeKeysToCutRef.current = [...checkedNodeKeysRef.current];
          } else if (cutNode) {
            checkedNodeKeysToCutRef.current = [cutNode.key];
          }

          if (cutNode || (checkedNodeKeysToCutRef.current && checkedNodeKeysToCutRef.current.length > 0)) {
            const targetNode = cutNode;
            cutSourceNodeRef.current = targetNode ?? null;
            let sourceFloor: ITreeNode | null = null;
            if (targetNode) {
              const nt = (targetNode.NodeType ?? targetNode.treetype ?? "").toLowerCase();
              if (nt === "floor" || nt === "store") {
                sourceFloor = targetNode;
              } else {
                sourceFloor = FnFindNearestNodeByType(currentTree, targetNode, "Floor") ??
                  FnFindNearestNodeByType(currentTree, targetNode, "Store");
                if (!sourceFloor) {
                  const targetKey = (targetNode.key ?? targetNode.NodeEntID ?? "").toString();
                  if (targetKey) {
                    const parents = FnFindNodeAndParents(currentTree, targetKey);
                    if (parents && parents.length > 0) {
                      sourceFloor = parents.slice().reverse().find(n => {
                        const pnt = (n.NodeType ?? n.treetype ?? "").toLowerCase();
                        return pnt === "floor" || pnt === "store";
                      }) ?? null;
                    }
                  }
                }
              }
            }
            cutSourceFloorNodeRef.current = sourceFloor;

            try {
              axiosInterceptor({
                url: DEVICE.SetPasteSource,
                data: {
                  entIDList: checkedNodeKeysToCutRef.current,
                  command: "cut"
                },
                setFetchData: (setPasteSourceApiResponse: unknown, status?: string) => {
                  if (status === "200" && setPasteSourceApiResponse !== undefined) {
                    dcExplorerContainerProps.handleShowUserMessage?.(
                      checkedNodeKeysRef.current && checkedNodeKeysRef.current.length > 0
                        ? "Checked nodes cut successfully"
                        : "Selected node cut successfully"
                    );
                  }
                }
              }, statusBarContext)
            } catch (error) {
              console.error('error :', error);
            }
            finally {
              checkedNodeKeysRef.current = [];
              setDefaultCheckedKeys([]);
              setDefaultStrictlyCheckedKeys({ checked: [], halfChecked: [] })
            }
          } else {
            dcExplorerContainerProps.handleShowUserMessage?.("No node selected to cut");
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Paste && defaultSelectedNodeInfo?.node) {
          axiosInterceptor({
            url: DEVICE.Paste,
            data: {
              destEntID: defaultSelectedNodeInfo.node.NodeEntID,
              destNodeType: defaultSelectedNodeInfo.node.NodeType
            },
            setFetchData: (pasteApiResponse: unknown, status?: string) => {
              if (pasteApiResponse && status === "200") {
                const newId = typeof pasteApiResponse === "object" && 'newDeviceID' in pasteApiResponse
                  ? (pasteApiResponse.newDeviceID as string)
                  : undefined;
                handleCutPasteRefresh(newId, defaultSelectedNodeInfo.node);
              }
            }
          }, statusBarContext)
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Delete || selectedItem.payload.Label === RightMouseMenuTreeNode.DeleteAll) {
          if (defaultSelectedNodeInfo?.node.IsNZ) {
            dcExplorerContainerProps.handleShowUserMessage?.("This record cannot be deleted because it is a required record for application to work.");
            return
          }
          setSelectedKebabMenu(selectedItem.payload)
          axiosInterceptor({
            url: LOG.CreateMessage,
            data: {
              projectInitial: "Common",
              msgID: "151"
            },
            setFetchData: (createMessageApiResponse: unknown, status?: string) => {
              if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                setShowOkButtonOnly(false);
                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                setIsConfirmOpen(true);
              }
            }
          }, statusBarContext)
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.DisposeAll) {
          setSelectedKebabMenu(selectedItem.payload)
          let errorMsg = `${selectedItem.payload.Label} devices of ${defaultSelectedNodeInfo?.node.Name ?? "selected node"}`;
          axiosInterceptor({
            url: LOG.CreateMessage,
            data: {
              projectInitial: "Audit",
              msgID: "151",
              optionalMessage: errorMsg
            },
            setFetchData: (createMessageApiResponse: unknown, status?: string) => {
              if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                setShowOkButtonOnly(false);
                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                setIsConfirmOpen(true);
              }
            }
          }, statusBarContext)
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.EmptyFloor) {
          if (defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && defaultSelectedNodeInfo.node.HasChildren === 0) {
            axiosInterceptor({
              url: DC.EmptyFloor,
              data: {
                floorId: defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: (emptyFloorApiResponse: unknown, status?: string) => {
                if (status === "200" && emptyFloorApiResponse !== undefined) {
                  handleRefreshCurrentNode();
                }
              }
            }, statusBarContext);
          }
          else {
            //silent mode
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Monitor && defaultSelectedNodeInfo) {
          axiosInterceptor({
            url: INTEL.MonitorDevice,
            data: {
              nodeID: defaultSelectedNodeInfo.node.NodeEntID
            },
            setFetchData: (_apiResp: unknown, status?: string, errData?: IErrorData[]) => {
              if (status === "200" && _apiResp !== undefined) {
                handleRefreshCurrentNode();
                dcExplorerContainerProps.handleShowUserMessage?.(`Monitoring ${defaultSelectedNodeInfo.node.Name} finished successfully.`)
              }
              else {
                const errorData = errData?.find((item) => item.errCode > 0);
                dcExplorerContainerProps.handleShowUserMessage?.(`Something got wrong in monitoring.${errorData ? ` Error:${errorData.errString}` : ""}`)
              }
            }
          }, statusBarContext);
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.DoNotMonitor && defaultSelectedNodeInfo) {
          const inteldcmPayload = {
            "PG.IntelDCM": [
              {
                OutbandMonitored: 0,
                Monitored: 0,
                EntID: defaultSelectedNodeInfo.node.NodeEntID,
                EntityName: defaultSelectedNodeInfo.node.NodeEntityname
              }
            ]
          }
          axiosInterceptor({
            url: EM.AddUpdateTableRecord,
            data: {
              jsonString: JSON.stringify(inteldcmPayload)
            },
            setFetchData: (_apiResp: unknown, status?: string, errData?: IErrorData[]) => {
              if (status === "200" && _apiResp !== undefined) {
                handleRefreshCurrentNode();
                dcExplorerContainerProps.handleShowUserMessage?.(`${defaultSelectedNodeInfo.node.Name} is removed from Monitored successfully.`)
              }
              else {
                const errorData = errData?.find((item) => item.errCode > 0);
                dcExplorerContainerProps.handleShowUserMessage?.(`Something got wrong in remove from monitoring.${errorData ? ` Error:${errorData.errString}` : ""}`)
              }
            }
          }, statusBarContext);
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ResetToDiscover && defaultSelectedNodeInfo?.node) {
          axiosInterceptor({
            url: INTEL.ResetDcmData,
            data: {
              nodeID: defaultSelectedNodeInfo.node.NodeEntID
            },
            allowShowLoader: true,
            setFetchData: (_apiResp: unknown, status?: string) => {
              if (status === "200" && _apiResp !== undefined) {
                handleRefreshCurrentNode();
              }
            }
          }, statusBarContext);
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.UpdateAggregates && defaultSelectedNodeInfo?.node) {
          axiosInterceptor({
            url: INTEL.SyncDcmDailyPduPowerAggregates,
            data: {},
            allowShowLoader: true,
            setFetchData: (_apiResp: unknown, status?: string) => {
              if (status === "200" && _apiResp !== undefined) {
                handleRefreshCurrentNode();
                dcExplorerContainerProps.handleShowUserMessage?.(`Aggregates updated successfully.`)
              }
            }
          }, statusBarContext);
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Discover
          || selectedItem.payload.Label === RightMouseMenuTreeNode.ReDiscover
        ) {
          const nodeType = defaultSelectedNodeInfo?.node?.NodeType?.toLowerCase();
          if (nodeType && defaultSelectedNodeInfo?.node.NodeEntID && ["site", "room", "floor", "location", "rack"].includes(nodeType)) {
            axiosInterceptor({
              url: INTEL.DiscoverHierarchy,
              data: {
                nodeID: defaultSelectedNodeInfo.node.NodeEntID
              },
              allowShowLoader: true,
              setFetchData: (_apiResp: unknown, status?: string, errData?: IErrorData[]) => {
                if (status === "200" && _apiResp !== undefined) {
                  handleRefreshCurrentNode();
                  dcExplorerContainerProps.handleShowUserMessage?.(`Discovery for ${defaultSelectedNodeInfo.node.Name} finished successfully.`)
                }
                else {
                  const errorData = errData?.find((item) => item.errCode > 0);
                  dcExplorerContainerProps.handleShowUserMessage?.(`Something got wrong in discovery.${errorData ? ` Error:${errorData.errString}` : ""}`)
                }
              }
            }, statusBarContext);
          }
          else if (nodeType && defaultSelectedNodeInfo?.node.NodeEntID && ["device", "mounteddevice"].includes(nodeType)) {
            axiosInterceptor({
              url: INTEL.DiscoverSingleIp,
              data: {
                nodeID: defaultSelectedNodeInfo.node.NodeEntID
              },
              allowShowLoader: true,
              setFetchData: (_apiResp: unknown, status?: string, errData?: IErrorData[]) => {
                if (status === "200" && _apiResp !== undefined) {
                  handleRefreshCurrentNode();
                  dcExplorerContainerProps.handleShowUserMessage?.(`Discovery for ${defaultSelectedNodeInfo.node.Name} finished successfully.`)
                }
                else {
                  const errorData = errData?.find((item) => item.errCode > 0);
                  dcExplorerContainerProps.handleShowUserMessage?.(`Something got wrong in discovery.${errorData ? ` Error:${errorData.errString}` : ""}`)
                }
              }
            }, statusBarContext);
          }
          else {
            //silent mode
          }
        } else if ((selectedItem.payload.Label === RightMouseMenuTreeNode.MoveUp || selectedItem.payload.Label === RightMouseMenuTreeNode.MoveDown) && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            if (treeData) {
              function getDestinationNode(
                deviceNode: ITreeNode,
                currentRU: string,
                direction: "MoveUp" | "MoveDown"
              ): ITreeNode | false {
                if (!deviceNode?.children || !Array.isArray(deviceNode.children)) {
                  return false;
                }
                const children = deviceNode.children;
                // Extract RU number (RU#22 → 22)
                const getNum = (ru: string) => Number(ru.replace("RU#", ""));
                const currentNum = getNum(currentRU);
                const targetNum =
                  direction === "MoveUp"
                    ? currentNum + 1   // because your data is 42 → 1
                    : currentNum - 1;
                const targetName = `RU#${targetNum}`;
                //  This node object
                const targetNode = children.find((node) => node.Name === targetName);
                return targetNode || false;
              }
              let deviceNodePerent: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Device");
              let deviceNodePerentView: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "DeviceView");
              let deviceNodeSlot: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "RU");
              if (deviceNodePerentView && deviceNodeSlot) {
                const findDest = getDestinationNode(deviceNodePerentView, deviceNodeSlot.Name as string, selectedItem.payload.Label === RightMouseMenuTreeNode.MoveUp ? "MoveUp" : "MoveDown")
                if (findDest) {
                  const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
                  setWorkorderRecords(workOrderProfile);
                  setShowSelectWorkorder(true);
                  setCreateWorkOrderPayload({
                    treeData: treeData,
                    sourceNodeEntID: defaultSelectedNodeInfo.node?.NodeEntID ?? "",
                    sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                    sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                    EntityName: "WorkorderProfile",
                    WorkorderType: "Move",
                    action: selectedItem.payload.Label === RightMouseMenuTreeNode.MoveUp ? "Move Up" : "Move Down",
                    SeqNo: 1,
                    sessionContext: sessionContext,
                    statusBarContext: statusBarContext,
                    _WorkOrderProfile: undefined,
                    ParentEntityName: deviceNodePerent?.NodeEntityname ?? "",
                    ParentID: deviceNodePerent?.NodeEntID ?? '',
                    destNodeEntID: findDest.NodeEntID ?? "",
                    destNodeEntityname: findDest.NodeEntityname ?? "",
                    extraSouceObj: {
                      EntId: defaultSelectedNodeInfo.node.MountedDeviceID ?? defaultSelectedNodeInfo.node.NodeEntID,
                      SlotID: deviceNodeSlot.NodeEntID
                    },
                    extraDestObj: {
                      SlotID: findDest.NodeEntID ?? ""
                    },
                    networkPort: defaultSelectedNodeInfo.node.HasNetworkPorts ?? 0,
                    powerPort: defaultSelectedNodeInfo.node.HasPowerPorts ?? 0
                  })
                } else {
                  setConfirmMessage(`No destination found for this ${selectedItem.payload.Label}.`)
                  setShowOkButtonOnly(true);
                  setIsConfirmOpen(true);
                }
              }
            }
          } else {
            axiosInterceptor({
              url: DEVICE.MoveUpdownMountedDevice,
              data: {
                entID: defaultSelectedNodeInfo.node.MountedDeviceID ?? defaultSelectedNodeInfo.node.NodeEntID,
                up: selectedItem.payload.Label === RightMouseMenuTreeNode.MoveUp ? true : false
              },
              setFetchData: async (ApiResponse: unknown, status?: string) => {
                if (status === "200" && ApiResponse !== undefined) {
                  if (treeData) {
                    const parentNode = FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Device");
                    if (parentNode) {
                      const sessionData: ISessionVariable[] = [{ VariableContext: "Node", VariableName: "SelectedNodeID", SessionValue: parentNode.NodeEntID },
                      { VariableContext: "Node", VariableName: "SelectedNodeName", SessionValue: parentNode.Name },
                      { VariableContext: "Node", VariableName: "SelectedNodeEntity", SessionValue: parentNode.NodeEntityname }]
                      logDcExplorerSession("MoveUp/MoveDown → FnUpdateSession", {
                        event: "select",
                        nodeKey: parentNode.key,
                        nodeName: parentNode.Name,
                        nodeType: parentNode.NodeType,
                        sessionData,
                      });
                      await FnUpdateSession(sessionData, sessionContext, statusBarContext)
                      handleRefreshCurrentNode(parentNode);
                    }
                  }
                }
              }
            }, statusBarContext);
          }
        } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.SwapDeviceViews && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
          let parentNodeByType = FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Floor");
          if (parentNodeByType && parentNodeByType.NodeEntID) {
            const moduleId = defaultSelectedNodeInfo.node?.MountedDeviceID ? defaultSelectedNodeInfo.node?.NodeEntID : parentNodeByType.NodeEntID;
            if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
              if (treeData) {
                const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
                setWorkorderRecords(workOrderProfile);
                setShowSelectWorkorder(true);
                let deviceNodePerent: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Device");
                setCreateWorkOrderPayload({
                  treeData: treeData,
                  sourceNodeEntID: defaultSelectedNodeInfo.node?.NodeEntID ?? "",
                  sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                  sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                  EntityName: "WorkorderProfile",
                  WorkorderType: "Move",
                  action: "Move",
                  SeqNo: 1,
                  sessionContext: sessionContext,
                  statusBarContext: statusBarContext,
                  _WorkOrderProfile: undefined,
                  ParentEntityName: deviceNodePerent?.NodeEntityname ?? "",
                  ParentID: deviceNodePerent?.NodeEntID ?? '',
                  extraSouceObj: { moduleViewID: moduleId },
                  networkPort: defaultSelectedNodeInfo.node.HasNetworkPorts ?? 0,
                  powerPort: defaultSelectedNodeInfo.node.HasPowerPorts ?? 0
                })
              }
            } else {
              axiosInterceptor({
                url: DEVICE.SwapviewMountedDevice,
                data: {
                  moduleDeviceViewID: moduleId,
                },
                setFetchData: async (ApiResponse: unknown, status?: string) => {
                  if (status === "200" && ApiResponse !== undefined) {
                    if (defaultSelectedNodeInfo.node) {
                      const parentNode = FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Device");
                      if (parentNode) {
                        const sessionData: ISessionVariable[] = [{ VariableContext: "Node", VariableName: "SelectedNodeID", SessionValue: parentNode.NodeEntID },
                        { VariableContext: "Node", VariableName: "SelectedNodeName", SessionValue: parentNode.Name },
                        { VariableContext: "Node", VariableName: "SelectedNodeEntity", SessionValue: parentNode.NodeEntityname }]
                        logDcExplorerSession("SwapDeviceViews → FnUpdateSession", {
                          event: "select",
                          nodeKey: parentNode.key,
                          nodeName: parentNode.Name,
                          nodeType: parentNode.NodeType,
                          sessionData,
                        });
                        await FnUpdateSession(sessionData, sessionContext, statusBarContext)
                        handleRefreshCurrentNode(parentNode);
                      }
                    }
                  }
                }
              }, statusBarContext);
            }
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.EmptyDevice
          || selectedItem.payload.Label === RightMouseMenuTreeNode.EmptyStore
          || selectedItem.payload.Label === RightMouseMenuTreeNode.EmptyRack
          || selectedItem.payload.Label === RightMouseMenuTreeNode.EmptyBin
        ) {
          setSelectedKebabMenu(selectedItem.payload)
          if (defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
            axiosInterceptor({
              url: LOG.CreateMessage,
              data: {
                projectInitial: "Audit",
                msgID: "151",
                optionalMessage: selectedItem.payload.Label,
                customMessage: "",
                errorMessage: ""
              },
              setFetchData: (createMessageApiResponse: unknown, status?: string) => {
                if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                  setShowOkButtonOnly(false);
                  setConfirmMessage(createMessageApiResponse.finalMessage as string);
                  setIsConfirmOpen(true);
                }
              }
            }, statusBarContext)
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.DeleteBin) {
          if (defaultSelectedNodeInfo?.node.IsNZ) {
            setShowOkButtonOnly(true);
            setConfirmMessage("This record cannot be deleted because it is a required record for application to work.");
            setIsConfirmOpen(true);
            return
          }
          setSelectedKebabMenu(selectedItem.payload)
          axiosInterceptor({
            url: LOG.CreateMessage,
            data: {
              projectInitial: "Common",
              msgID: "151"
            },
            setFetchData: (createMessageApiResponse: unknown, status?: string) => {
              if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                setShowOkButtonOnly(false);
                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                setIsConfirmOpen(true);
              }
            }
          }, statusBarContext)
        } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.EmptyFloorLocation) {
          setSelectedKebabMenu(selectedItem.payload)
          axiosInterceptor({
            url: LOG.CreateMessage,
            data: {
              projectInitial: "Audit",
              msgID: "151",
              optionalMessage: selectedItem.payload.Label,
              customMessage: "",
              errorMessage: ""
            },
            setFetchData: (createMessageApiResponse: unknown, status?: string) => {
              if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                setShowOkButtonOnly(false);
                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                setIsConfirmOpen(true);
              }
            }
          }, statusBarContext)

        } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.AddLocation && defaultSelectedNodeInfo && defaultSelectedNodeInfo.node && treeData) {
          const emPgTableRecords = mainAppContext && mainAppContext.emRecords && mainAppContext?.emRecords.filter(
            (item: IEmItem) =>
              item.TableName?.toLowerCase() === "_location"
          );
          const locationValues = emPgTableRecords.reduce<IEmPropertyDefaults>((acc, item) => {
            if (
              item.PName &&
              item.PName !== "EntID" &&
              item.PName !== "RecID" &&
              item.PName !== "LastUpdated"
            ) {
              acc[item.PName] = item.DefaultValue;
            }
            return acc;
          }, {});
          const parentData = FnFindNodeAndParents(treeData, defaultSelectedNodeInfo.node.key);
          if (parentData) {
            const generateUniqueId = (type: string): string => {
              const timestamp = Date.now().toString(36);
              const randomPart = Math.random().toString(36).substring(2, 9);
              return `${type}-${timestamp}-${randomPart}`;
            };
            const locationName = generateUniqueId('loc');
            const updatedObj = { ...locationValues };
            parentData.forEach(({ NodeType, Name }) => {
              const key = `_${NodeType}`;
              if (!(key in updatedObj)) return;
              updatedObj[key] = Name ?? "";
            });
            updatedObj["_Location"] = locationName;
            updatedObj["ParentID"] = defaultSelectedNodeInfo.node.NodeEntID ?? "";
            const data = { "_Location": [updatedObj] }
            axiosInterceptor({
              url: EM.AddUpdateTableRecord,
              data: { jsonString: JSON.stringify(data) },
              disableLog: true,
              allowShowLoader: true,
              setFetchData: (apiResp: unknown, status?: string) => {
                if (apiResp && status === "200" && typeof apiResp === "object" && 'jsonStringOutput' in apiResp) {
                  try {
                    const parsedData = FnParseJsonSafely(apiResp.jsonStringOutput as string);
                    if (Array.isArray(parsedData["_Location"]) && parsedData["_Location"].length) {
                      const locationId = parsedData["_Location"][0].EntID;
                      const id = FnGenerateUniqueId();
                      const locationNode: Record<string, any> = getObjectTemplate('location', id);
                      locationNode.name = locationName;
                      locationNode.entId = locationId;
                      locationNode.entityName = EntityNameEnums.Location;
                      if (locationNode.w && locationNode.h) {
                        locationNode.w = Number(locationNode.w);
                        locationNode.h = Number(locationNode.h);
                      }
                      locationNode.x = -1;
                      locationNode.y = -1;
                      const locationLayoutRecord: Record<string, any> = {
                        Width: locationNode.w,
                        Length: locationNode.h,
                        BorderWidth: locationNode.border?.borderpx,
                        LocationLayoutConfig: locationNode,
                        BorderColor: locationNode.border?.bordercolor,
                        Style: locationNode.border?.borderstyle,
                        LeftPos: locationNode.x,
                        TopPos: locationNode.y,
                        EntID: locationNode.entId,
                        SiteID: "",
                        RoomID: "",
                        FloorID: "",
                        LocationID: locationNode.entId,
                        _Location: locationName,
                        EntityName: locationNode.entityName
                      };

                      parentData.forEach(({ NodeType, NodeEntID, Name }) => {
                        const key = `${NodeType?.trim()}ID`;

                        if (key in locationLayoutRecord) {
                          locationLayoutRecord[key] = NodeEntID ?? "";
                        }
                        const keyForName = `_${NodeType}`;
                        if (!(keyForName in updatedObj)) return;
                        locationLayoutRecord[keyForName] = Name ?? "";
                      });
                      axiosInterceptor({
                        url: EM.AddUpdateTableRecord,
                        data: {
                          jsonString: JSON.stringify({
                            'PG.LocationLayout': [locationLayoutRecord]
                          })
                        },
                        disableLog: true,
                        allowShowLoader: true,
                        setFetchData: (apiRespLayout: unknown, status?: string) => {
                          if (apiRespLayout && status === "200") {
                            try {
                              handleRefreshTreeNodes(selectedItem.payload?.Label, locationId);
                            } catch (error) {
                              console.error('error :', error);
                            }
                          }
                          else {
                            handleRefreshTreeNodes(selectedItem.payload?.Label, locationId);
                          }
                        }
                      }, statusBarContext)
                    }
                  } catch (error) {
                    console.error('error in create location :', error);
                  }
                }
              }
            }, statusBarContext)
          }
        } else if (selectedItem.payload.Label === RightMouseMenuTreeNode.FindDataCenterInterconnect) {
          const currentNode = defaultSelectedNodeInfo?.node;
          const currentTree = treeData || explorerTreeContext.originalTreeData || [];

          const siteNode = currentNode
            ? (FnFindNearestNodeByType(currentTree, currentNode, 'Site') ||
              (currentNode.NodeType?.toLowerCase() === 'site' ? currentNode : null))
            : null;
          const roomNode = currentNode
            ? (FnFindNearestNodeByType(currentTree, currentNode, 'Room') ||
              (currentNode.NodeType?.toLowerCase() === 'room' ? currentNode : null))
            : null;
          const floorNode = currentNode
            ? (FnFindNearestNodeByType(currentTree, currentNode, 'Floor') ||
              (currentNode.NodeType?.toLowerCase() === 'floor' ? currentNode : null))
            : null;
          const locationNode = currentNode
            ? (FnFindNearestNodeByType(currentTree, currentNode, 'Location') ||
              (currentNode.NodeType?.toLowerCase() === 'location' ? currentNode : null))
            : null;
          const deviceNode = currentNode
            ? (FnFindNearestNodeByType(currentTree, currentNode, 'Device') ||
              FnFindNearestNodeByType(currentTree, currentNode, 'Rack') ||
              (['device', 'rack'].includes(currentNode.NodeType?.toLowerCase() ?? '') ? currentNode : null))
            : null;

          const siteName = (siteNode?.Name || mainAppContext.siteProperties?._Site || '').trim().toLowerCase();
          const siteId = (siteNode?.NodeEntID || siteNode?.key || mainAppContext.siteProperties?.EntID || '').trim().toLowerCase();
          const roomName = (roomNode?.Name || '').trim().toLowerCase();
          const roomId = (roomNode?.NodeEntID || roomNode?.key || '').trim().toLowerCase();
          const floorName = (floorNode?.Name || '').trim().toLowerCase();
          const floorId = (floorNode?.NodeEntID || floorNode?.key || '').trim().toLowerCase();
          const locationName = (locationNode?.Name || '').trim().toLowerCase();
          const locationId = (locationNode?.NodeEntID || locationNode?.key || '').trim().toLowerCase();
          const deviceName = (deviceNode?.Name || (currentNode?.NodeType?.toLowerCase() === 'device' ? currentNode?.Name : '') || '').trim().toLowerCase();
          const deviceId = (deviceNode?.NodeEntID || deviceNode?.DeviceID || deviceNode?.key || '').toString().trim().toLowerCase();
          const selectedName = (currentNode?.Name || '').trim().toLowerCase();
          const selectedNodeType = (currentNode?.NodeType || '').trim().toLowerCase();

          function isEndpointMatch(endpoint?: Record<string, any> | null): boolean {
            if (!endpoint || typeof endpoint !== 'object') return false;

            // 1. Direct name match fallback (if any field directly contains the selected node name)
            if (selectedName) {
              const directMatch = Object.values(endpoint).some(
                (v) => v !== null && v !== undefined && v.toString().trim().toLowerCase() === selectedName
              );
              if (directMatch) return true;
            }

            // 2. Hierarchy match:
            const endpointSiteName = (endpoint.SiteName ?? '').trim().toLowerCase();
            const endpointSiteId = (endpoint.SiteID ?? '').trim().toLowerCase();

            const siteMatches =
              (endpointSiteId && siteId && endpointSiteId === siteId) ||
              (endpointSiteName && siteName && endpointSiteName === siteName);

            if (!siteMatches) {
              return false;
            }

            // If selected node is the Site, return all DCIs in this site
            if (selectedNodeType === 'site') {
              return true;
            }

            // If DCI endpoint specifies a Device, the selected device must match
            const endpointDevice = (endpoint.DeviceName ?? '').trim().toLowerCase();
            const endpointDeviceId = (endpoint.DeviceID ?? '').trim().toLowerCase();
            if (endpointDevice || endpointDeviceId) {
              return (
                (endpointDeviceId && deviceId && endpointDeviceId === deviceId) ||
                (endpointDevice && deviceName && endpointDevice === deviceName) ||
                (endpointDevice && selectedName && endpointDevice === selectedName)
              );
            }

            // If DCI endpoint specifies a Location, the selected location must match
            const endpointLocation = (endpoint.LocationName ?? '').trim().toLowerCase();
            const endpointLocationId = (endpoint.LocationID ?? '').trim().toLowerCase();
            if (endpointLocation || endpointLocationId) {
              return (
                (endpointLocationId && locationId && endpointLocationId === locationId) ||
                (endpointLocation && locationName && endpointLocation === locationName) ||
                (endpointLocation && selectedName && endpointLocation === selectedName)
              );
            }

            // If DCI endpoint specifies a Floor, the selected floor must match
            const endpointFloor = (endpoint.FloorName ?? '').trim().toLowerCase();
            const endpointFloorId = (endpoint.FloorID ?? '').trim().toLowerCase();
            if (endpointFloor || endpointFloorId) {
              return (
                (endpointFloorId && floorId && endpointFloorId === floorId) ||
                (endpointFloor && floorName && endpointFloor === floorName) ||
                (endpointFloor && selectedName && endpointFloor === selectedName)
              );
            }

            // If DCI endpoint specifies a Room, the selected room must match
            const endpointRoom = (endpoint.RoomName ?? '').trim().toLowerCase();
            const endpointRoomId = (endpoint.RoomID ?? '').trim().toLowerCase();
            if (endpointRoom || endpointRoomId) {
              return (
                (endpointRoomId && roomId && endpointRoomId === roomId) ||
                (endpointRoom && roomName && endpointRoom === roomName) ||
                (endpointRoom && selectedName && endpointRoom === selectedName)
              );
            }

            // Site-to-site DCI (no device/location/floor/room): applies to all equipment within the site
            return true;
          }

          function isMatchInFromNode(data: Record<string, any>[], searchValue: string): boolean {
            const search = searchValue.toLowerCase();

            return data.some((item) => {
              const node = item.DCIFromSiteNode;

              if (!node) return false;

              return Object.values(node).some((value) => {
                if (value === null || value === undefined) return false;
                return value.toString().toLowerCase().includes(search);
              });
            });
          }

          const fetchDciHierarchy = (): Promise<Record<string, any>[]> => {
            return new Promise((resolve) => {
              axiosInterceptor(
                {
                  url: DCI.DciHierarchy,
                  data: {},
                  allowShowLoader: true,
                  setFetchData: (response: unknown, status?: string) => {
                    try {
                      if (status === "200" && response && typeof response === "object") {
                        let records: any[] = [];
                        if ('dciJson' in response && response.dciJson) {
                          const parsed = typeof response.dciJson === 'string'
                            ? FnParseJsonSafely(response.dciJson as string)
                            : response.dciJson;
                          if (parsed && typeof parsed === 'object') {
                            if (Array.isArray((parsed as any).DCIs)) {
                              records = (parsed as any).DCIs;
                            } else if (Array.isArray(parsed)) {
                              records = parsed;
                            } else if (Array.isArray((parsed as any).Dataset)) {
                              records = (parsed as any).Dataset;
                            }
                          }
                        } else if ('DCIs' in response && Array.isArray((response as any).DCIs)) {
                          records = (response as any).DCIs;
                        } else if ('Dataset' in response && Array.isArray((response as any).Dataset)) {
                          records = (response as any).Dataset;
                        } else if (Array.isArray(response)) {
                          records = response;
                        }
                        if (records.length > 0) {
                          mainAppContext.setDciRecords(records);
                        }
                        resolve(records);
                        return;
                      }
                    } catch (err) {
                      console.error("Error parsing DCI hierarchy response:", err);
                    }
                    resolve([]);
                  },
                },
                statusBarContext
              ).catch((err) => {
                console.error("DCI hierarchy API call error:", err);
                resolve([]);
              });
            });
          };

          const rawDciRecords = await fetchDciHierarchy();
          const dciRecords = rawDciRecords.length > 0 ? rawDciRecords : (mainAppContext.dciRecords ?? []);

          const formattedData: IDciRecord[] = (dciRecords as any[]).flatMap((item) => {
            const currentItem = typeof item === 'string' ? FnParseJsonSafely(item) : item;
            const dataset = typeof currentItem?.Dataset === 'string' ? FnParseJsonSafely(currentItem.Dataset) : currentItem?.Dataset;
            if (Array.isArray(dataset)) {
              return dataset;
            }
            return currentItem ? [currentItem] : [];
          });

          if (!dciRecords || dciRecords.length === 0 || (!isMatchInFromNode(dciRecords, (currentNode?.Name || "") as string) && !isMatchInFromNode(formattedData, (currentNode?.Name || "") as string))) {
            const noMatchMsg = `No Datacenter Interconnect records found for ${currentNode?.Name ?? 'the selected node'}.`;
            setConfirmMessage(noMatchMsg);
            setIsConfirmOpen(true);
            setShowOkButtonOnly(true);
            dcExplorerContainerProps.handleShowUserMessage?.(noMatchMsg);
            return;
          }

          const data = formattedData.filter((item) => {
            return isEndpointMatch(item.DCIFromSiteNode) || isEndpointMatch(item.DCIToSiteNode);
          });

          const finalData = data.length > 0 ? data : formattedData.filter((item) => {
            const node = item.DCIFromSiteNode;
            if (!node) return false;
            const search = (currentNode?.Name ?? '').toLowerCase();
            return Object.values(node).some((value) => {
              if (value === null || value === undefined) return false;
              return value.toString().toLowerCase().includes(search);
            });
          });

          if (finalData && finalData.length > 0) {
            setDciRecords(finalData);
            setShowDciPopup(true);
          } else {
            const noMatchMsg = `No Datacenter Interconnect records found for ${currentNode?.Name ?? 'the selected node'}.`;
            setConfirmMessage(noMatchMsg);
            setIsConfirmOpen(true);
            setShowOkButtonOnly(true);
            dcExplorerContainerProps.handleShowUserMessage?.(noMatchMsg);
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.RecreateLayout && defaultSelectedNodeInfo && treeData) {

          const floorNode = FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Floor");
          if (!floorNode) {
            dcExplorerContainerProps.handleShowUserMessage?.(`Floor node not found to ${selectedItem.payload.Label}`)
            return
          }
          const isRecreated = await FnRecreateFloorLayout(floorNode, statusBarContext, explorerTreeContext.originalTreeData);
          if (isRecreated) {
            dcExplorerContainerProps.handleShowUserMessage?.(`Floor Layout recreated successfully`);
          }
          else {
            dcExplorerContainerProps.handleShowUserMessage?.(`Something went wrong in recreate floor layout`);
          }
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.DeleteFromLayout && defaultSelectedNodeInfo && treeData) {
          const nodeType = defaultSelectedNodeInfo.node.NodeType?.toLowerCase();
          if (!nodeType || !defaultSelectedNodeInfo.node?.NodeEntID) {
            dcExplorerContainerProps.handleShowUserMessage?.(`Node detail is not found for ${selectedItem.payload.Label}`)
            return
          }
          const floorNode = FnFindNearestNodeByType(treeData, defaultSelectedNodeInfo.node, "Floor");
          if (!floorNode) {
            dcExplorerContainerProps.handleShowUserMessage?.(`Floor node not found to ${selectedItem.payload.Label}`)
            return
          }
          const tableNameToDelete = ["rack", "device"].includes(nodeType) ? "PG.DeviceLayout" : "PG.LocationLayout";
          axiosInterceptor({
            url: EM.DeleteTableRecords,
            data: {
              tableName: tableNameToDelete,
              entIDs: defaultSelectedNodeInfo.node?.NodeEntID
            },
            setFetchData: async (_apiResp: unknown, status?: string, errData?: IErrorData[]) => {
              if (status === "200" && _apiResp !== undefined) {
                const isRecreated = await FnRecreateFloorLayout(floorNode, statusBarContext, explorerTreeContext.originalTreeData);
                if (isRecreated) {
                  dcExplorerContainerProps.handleShowUserMessage?.(`Floor Layout recreated successfully`);
                }
                else {
                  dcExplorerContainerProps.handleShowUserMessage?.(`Something went wrong in recreate floor layout`);
                }
                explorerTreeContext.setIsRefreshed(true);
              }
              else {
                const errorData = errData?.find((item) => item.errCode > 0);
                dcExplorerContainerProps.handleShowUserMessage?.(`Something got wrong in recreate layout.${errorData ? ` Error:${errorData.errString}` : ""}`)
              }
            }
          }, statusBarContext);
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.ClearWatermark
          || selectedItem.payload.Label === RightMouseMenuTreeNode.DeleteLocation
          || selectedItem.payload.Label === RightMouseMenuTreeNode.ClearWatermarkforSubnodes
        ) {

          setSelectedKebabMenu(selectedItem.payload)
          axiosInterceptor({
            url: LOG.CreateMessage,
            data: {
              projectInitial: "Audit",
              msgID: "151",
              optionalMessage: selectedItem.payload.Label
            },
            setFetchData: (createMessageApiResponse: unknown, status?: string) => {
              if (status === "200" && createMessageApiResponse && typeof createMessageApiResponse === "object" && 'finalMessage' in createMessageApiResponse) {
                setShowOkButtonOnly(false);
                setConfirmMessage(createMessageApiResponse.finalMessage as string);
                setIsConfirmOpen(true);
              }
            }
          }, statusBarContext)
        }
        else if (selectedItem.payload.Label === RightMouseMenuTreeNode.Recalculate && defaultSelectedNodeInfo && treeData) {
          if (!defaultSelectedNodeInfo.node?.NodeEntID || !defaultSelectedNodeInfo.node.NodeEntityname) {
            dcExplorerContainerProps.handleShowUserMessage?.(`Node detail is not found for ${selectedItem.payload.Label}`)
            return
          }
          axiosInterceptor({
            url: DEVICE.Recalculate,
            data: {
              entID: defaultSelectedNodeInfo.node.NodeEntID,
              entityType: defaultSelectedNodeInfo.node.NodeEntityname ?? defaultSelectedNodeInfo.node.NodeType ?? "",
              curEntIDOnly: true
            },
            allowShowLoader: true,
            setFetchData: (_apiResp: unknown, status?: string, errData?: IErrorData[]) => {
              if (status === "200" && _apiResp !== undefined) {
                dcExplorerContainerProps.handleShowUserMessage?.(`Recalculate for ${defaultSelectedNodeInfo.node.Name} finished successfully.`)
              }
              else {
                const errorData = errData?.find((item) => item.errCode > 0);
                dcExplorerContainerProps.handleShowUserMessage?.(`Something got wrong in recalculate.${errorData ? ` Error:${errorData.errString}` : ""}`)
              }
            }
          }, statusBarContext);
        }
        else {
          dcExplorerContainerProps && defaultSelectedNodeInfo && dcExplorerContainerProps.handleKebabMenuSelect && dcExplorerContainerProps.handleKebabMenuSelect(selectedItem, defaultSelectedNodeInfo, treeDataRef.current);
        }
      }
    }
  }, [dcExplorerContainerProps, originalTreeData, defaultSelectedNodeInfo]);

  // Updates copy/kebab menu state when the selected tree key changes.
  const handleSelectedKeyChange = useCallback(async (currentTreeData: ITreeNode[]) => {
    if (treeContainerFlatDataProps) {
      const updatedTreeData = await FnUpdateTreeNodeBasedOnKey(
        currentTreeData, // Pass dynamic treeData explicitly
        defaultSelectedKeys[0],
        treeContainerFlatDataProps.featureTreeProps.hideCopyIcon === false,
        treeContainerFlatDataProps.featureTreeProps.hideKebabMenu === false,
        treeContainerFlatDataProps,
        treeContainerFlatDataProps.selectedNodeExplorer,
        handleKebabMenuSelect
      );
      needToUpdateTreeNodeRef.current = false;
      // Only update if data has changed to prevent infinite loops
      setTreeData([...updatedTreeData]);
    }
  }, [defaultSelectedKeys, treeContainerFlatDataProps, handleKebabMenuSelect]);

  // Effect to handle changes in defaultSelectedKeys — refreshes node action icons when enabled.
  useEffect(() => {
    const selectedKey = defaultSelectedKeys?.[0];
    const shouldTrigger =
      !!selectedKey &&
      (!featureTreeProps?.hideCopyIcon || !featureTreeProps?.hideKebabMenu);
    const isAlreadyHandled = lastHandledKeyRef.current === selectedKey;
    if (shouldTrigger && treeData && treeData.length > 0 && !isAlreadyHandled && needToUpdateTreeNodeRef.current === true) {
      lastHandledKeyRef.current = selectedKey;
      handleSelectedKeyChange(treeData); //  use actual updated data
    }
  }, [treeData, defaultSelectedKeys, handleSelectedKeyChange, featureTreeProps]);

  // Persists expanded/selected state to parent cache and local original tree copies.
  const updateOriginalTreeDataset = async (updatedTreedata: ITreeNode[], expandedKeys: Key[], selectedKeys: Key[], userTreeData: ITreeNode[] | null) => {
    if (dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration) {
      setOriginalTreeDataForInventory(updatedTreedata);
    }
    else if (dcExplorerContainerProps.featureId && ReuseDataForFeatures.includes(dcExplorerContainerProps.featureId)) {
      setOriginalTreeData(updatedTreedata);
    }
    else {
      setOriginalTreeDataWithoutFilter(updatedTreedata)
    }
    setDefaultExpandedKeys(expandedKeys);
    needToUpdateTreeNodeRef.current = true;
    setDefaultSelectedKeys(selectedKeys);
    if (dcExplorerContainerProps.updateOriginalTreeDataset) {
      dcExplorerContainerProps.updateOriginalTreeDataset(updatedTreedata, expandedKeys, selectedKeys, userTreeData)
    }
  }

  // Propagates checkbox changes and applies strict parent/child check rules when enabled.
  function handleNodeCheck(checked: TNodeCheckState, info: CheckInfo<ITreeNode>): void {
    let newChecked: TNodeCheckState = checked;
    if (featureTreeProps && featureTreeProps.allowCheckStrictly && !featureTreeProps.allowCustomCheck) {
      if (!isStrictCheckedKeys(checked) || !treeData) {
        dcExplorerContainerProps.handleNodeCheck?.(checked, info);
        return;
      }
      const defaultCheck = checked;
      // Collects descendant keys for strict checkbox propagation.
      const getAllChildKeys = (node: ITreeNode): Key[] => {
        const keys: Key[] = [];
        if (node.children) {
          node.children.forEach((child) => {
            keys.push(child.key);
            const childKeys = getAllChildKeys(child);
            keys.push(...childKeys);
          });
        }
        return keys;
      };
      if (info.checked) {
        const childCheckedKeys = getAllChildKeys(info.node);
        const baseMergedArray = [...new Set([...defaultCheck.checked, ...childCheckedKeys])];
        const parentNode = FnFindParentNode(treeData, info.node.key);
        if (parentNode) {
          const isHalfChecked = parentNode.children.some((nodeItem) => !baseMergedArray.includes(nodeItem.key));
          const halfChecked = isHalfChecked
            ? [...new Set([...defaultCheck.halfChecked, parentNode.key])]
            : defaultCheck.halfChecked.filter(key => key !== parentNode.key);
          const mergedArray = isHalfChecked
            ? baseMergedArray
            : [...baseMergedArray, parentNode.key];
          newChecked = { checked: mergedArray, halfChecked };
        } else {
          newChecked = {
            checked: baseMergedArray,
            halfChecked: defaultCheck.halfChecked,
          };
        }
        setDefaultStrictlyCheckedKeys(newChecked)
      }
      else {
        const childKeysToRemove = getAllChildKeys(info.node);
        const baseRemovedCheckKeys = defaultCheck.checked.filter(key => !childKeysToRemove.includes(key));
        const parentNode = FnFindParentNode(treeData, info.node.key);
        if (parentNode) {
          const isHalfChecked = parentNode.children.some((nodeItem) => baseRemovedCheckKeys.includes(nodeItem.key));
          const removedCheckKeys = baseRemovedCheckKeys.filter(key => key !== parentNode.key);
          const halfChecked = isHalfChecked
            ? [...new Set([...defaultCheck.halfChecked, parentNode.key])]
            : defaultCheck.halfChecked.filter(key => key !== parentNode.key);
          newChecked = { checked: removedCheckKeys, halfChecked };
        } else {
          newChecked = {
            checked: baseRemovedCheckKeys,
            halfChecked: defaultCheck.halfChecked,
          };
        }
        setDefaultStrictlyCheckedKeys(newChecked)
      }
    }
    else if (!featureTreeProps?.allowCustomCheck && Array.isArray(checked)) {
      checkedNodeKeysRef.current = checked;
      checkedNodeKeysToCutRef.current = checked;
      setDefaultCheckedKeys(checked);
      const selectedNode: ISelectedNodeInfo = {
        event: "select",
        selected: true,
        node: info.node,
        selectedNodes: [info.node],
        nativeEvent: info.nativeEvent
      }
      needToUpdateTreeNodeRef.current = true;
      setDefaultSelectedNodeInfo(selectedNode)
      setDefaultSelectedKeys(info.node ? [info.node.key] : []);
    }
    dcExplorerContainerProps.handleNodeCheck?.(newChecked, info);
  }

  // Fetches lazy-loaded child hierarchy data for floor, device, or site nodes.
  const FnAPICallsForGetChildrenNodes = async (newNode: ITreeNode, featureId: string) => {
    if (!ExcludeFeaturesFromFilterNodes.includes(featureId)) {
      if (newNode.NodeType && (FnProcessStringToCompare(newNode.NodeType, "Floor") || FnProcessStringToCompare(newNode.NodeType, "Store"))) {
        if (newNode.NodeEntID && featureId) {
          const exploreType = getExploreTypeForFeature(featureId);
          return new Promise((resolve) => {
            const handleAPIForFloorNode = (floorNodeApiResponse: unknown, status?: string) => {
              if (status === "200") {
                resolve(parseHierarchyJsonResponse(floorNodeApiResponse));
              } else {
                resolve(null);
              }
            }
            // Call API to get florr device configuration
            axiosInterceptor({
              url: EXPLORER.FloorDevicesConfigurationHierarchyReduced,
              data: {
                floorID: newNode.NodeEntID,
                exploreType: exploreType,
                isRefresh: false
              },
              allowShowLoader: true,
              setFetchData: handleAPIForFloorNode
            }, statusBarContext)
          });
        }
      }
      else if (newNode.treetype === "DeviceSlot" && newNode.MountedDeviceEntID && (featureId === FEnums.AssetConfiguration
        || featureId === FEnums.ConfigureDevice
        || featureId === FEnums.EditNetworkCabling
        || featureId === FEnums.EditPowerCabling
        || featureId === FEnums.InventoryManagement
        || featureId === FEnums.InventoryConfiguration)) {
        const exploreType = getExploreTypeForFeature(featureId);
        return new Promise((resolve) => {
          const handleAPIForDeviceNode = (deviceNodeApiResponse: unknown, status?: string) => {
            if (status === "200") {
              resolve(parseDeviceJsonResponse(deviceNodeApiResponse));
            } else {
              resolve(null);
            }
          }
          // Call API to get mounted device configuration
          axiosInterceptor({
            url: EXPLORER.MountedDeviceConfigurationHierarchyNew,
            data: {
              deviceID: newNode.MountedDeviceEntID,
              isSearch: false,
              keyword: "",
              searchAllWord: false,
              exploreType: exploreType
            },
            allowShowLoader: true,
            setFetchData: handleAPIForDeviceNode
          }, statusBarContext)
        });
      }
      else if (((newNode.treetype ?? "").toLowerCase().trim() === "device" || (newNode.NodeType ?? "").toLowerCase().trim() === "device") && newNode.NodeEntID && featureId === FEnums.InventoryConfiguration) {
        return new Promise((resolve) => {
          const handleAPIForDeviceNode = (deviceNodeApiResponse: unknown, status?: string) => {
            if (status === "200") {
              resolve(parseDeviceJsonResponse(deviceNodeApiResponse));
            } else {
              resolve(null);
            }
          }
          // Call API to get mounted device configuration
          axiosInterceptor({
            url: EXPLORER.MountedDeviceConfigurationHierarchyNew,
            data: {
              deviceID: newNode.NodeEntID,
              isSearch: false,
              keyword: "",
              searchAllWord: false,
              exploreType: 1
            },
            allowShowLoader: true,
            setFetchData: handleAPIForDeviceNode
          }, statusBarContext)
        });
      }
      else if (newNode.NodeType && FnProcessStringToCompare(newNode.NodeType, "Site")) {
        if (featureId) {
          const isInv = featureId === FEnums.InventoryManagement || featureId === FEnums.InventoryConfiguration;
          const targetSiteId = newNode.NodeEntID || getSiteIdFromSessionList(sessionContext.SessionList);
          const filteredData = FnFilterSiteHierarchyFromAllSites(
            mainAppContext.allSitesHierarchyRecords,
            targetSiteId,
            isInv
          );

          return filteredData ?? null;
        }
      }
    }
    return null;
  }

  // Expands a node and auto-selects children based on flat-tree explorer rules.
  async function handleNodeExpand(expandedNodeKeys: Key[], info: IExpandedNodeInfo) {
    if (info && info.node && treeContainerFlatDataProps) {
      //Auto expand nodes based on logic
      const isConfigurationFeature =
        dcExplorerContainerProps.featureId === FEnums.AssetConfiguration ||
        dcExplorerContainerProps.featureId === FEnums.ConfigureDevice ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;

      const isInventoryFeature =
        dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
        dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;

      const shouldApplyFilter =
        (dcExplorerContainerProps.applyFilter ?? true) &&
        !isInventoryFeature;

      const { partnerToFilter } = shouldApplyFilter
        ? getSessionFilterParams(sessionContext.SessionList)
        : { partnerToFilter: null };

      const isFilterActive = Boolean(partnerToFilter);

      const getRenderSourceTree = (sourceOriginalData: ITreeNode[]) => {
        if (shouldApplyFilter && isFilterActive) {
          const filtered = FnFilterTreeById(sourceOriginalData, partnerToFilter ?? undefined);
          return filtered.length ? filtered : sourceOriginalData;
        }
        return sourceOriginalData;
      };

      const FnAutoExpandTreeNodes = async (node: ITreeNode, expandedNodeKeys: Key[], originalTreeData: ITreeNode[], treeDataToUpdate: ITreeNode[], treeContainerProps: ITreeForFlatDataContainer) => {
        let updatedTreeData = treeDataToUpdate;
        let updatedOriginalData = originalTreeData;
        const currentExpandedKeys = expandedNodeKeys;
        const expandSelection = {
          selectedNodeKey: null as Key[] | null,
          selectedNodeData: null as ISelectedNodeInfo | null,
        };

        const expandedNodes: ITreeNode[] = [node];
        const apiFetchedNodeKeys = new Set<string>();
        const canCallChildrenApi = (treeNode: ITreeNode) => {
          const nodeType = (treeNode.NodeType ?? "").toLowerCase();
          const treetype = treeNode.treetype.toLowerCase();

          if (["floor", "store"].includes(nodeType))
            return true;
          else if (!isConfigurationFeature && ["rack"].includes(nodeType)) {
            return treeNode.isLeaf === true ? false : !FnGetIsLeafForRack(treeNode, treeContainerProps.featureId);
          }
          else if (isConfigurationFeature && ["device"].includes(treetype)) {
            return true;
          }
          else if (["deviceslot"].includes(treetype)) {
            return true;
          }
          else
            return false;
        };
        const findAndAppendChildren = async (newNode: ITreeNode) => {
          if (newNode && !newNode.children?.length && updatedOriginalData) {
            const sourceForRender = getRenderSourceTree(updatedOriginalData);
            const resultData = FnFindChildrenBasedOnKey(sourceForRender, newNode.key, treeContainerProps.featureId);
            if (resultData && resultData.length > 1) {
              const removedChildren = resultData.map((node: ITreeNode) => ({ ...node, children: [] }));
              updatedTreeData = await FnAddSubNode(updatedTreeData, newNode.key, removedChildren, treeContainerProps.featureTreeProps, treeContainerProps.featureId, false, newNode.stepNo);
              expandSelection.selectedNodeKey = [removedChildren[0].key];
              expandSelection.selectedNodeData = toSelectedNodeInfo(removedChildren[0]);
              return;
            }
            else if (resultData && resultData.length === 1) {
              const removedChildren = resultData.map((node: ITreeNode) => ({ ...node, children: [] }));
              updatedTreeData = await FnAddSubNode(updatedTreeData, newNode.key, removedChildren, treeContainerProps.featureTreeProps, treeContainerProps.featureId, false, newNode.stepNo);
              currentExpandedKeys.push(resultData[0].key);
              expandedNodes.push(resultData[0]);
              await findAndAppendChildren(removedChildren[0]);
            }
            else {
              // Only floor/store/inoutplug/slot/ru/port may fetch children; never re-call the same node API.
              if (!canCallChildrenApi(newNode) || apiFetchedNodeKeys.has(newNode.key)) {
                expandSelection.selectedNodeKey = [newNode.key];
                expandSelection.selectedNodeData = toSelectedNodeInfo(newNode);
                return;
              }

              apiFetchedNodeKeys.add(newNode.key);
              const apiResult = await FnCallApiToGetDataForTreeForFloor(
                updatedOriginalData,
                newNode,
                treeContainerProps.featureId,
                statusBarContext,
                sessionContext,
                sessionContext.SessionList,
                expandedNodes,
                dcExplorerContainerProps.applyFilter
              );
              if (apiResult.originalTreeData) {
                updatedOriginalData = FnDeepClone(apiResult.originalTreeData);
                if (apiResult.formattedTree) {
                  const sourceForRender = getRenderSourceTree(updatedOriginalData);
                  const filteredData = FnFindChildrenBasedOnKey(sourceForRender, newNode.key, treeContainerProps.featureId);
                  if (filteredData && filteredData.length === 1) {
                    const isRack = filteredData[0].NodeType?.toLowerCase() === "rack";
                    const hasChildren = isRack
                      ? (filteredData[0].isLeaf === true ? false : !FnGetIsLeafForRack(filteredData[0], treeContainerProps.featureId))
                      : ((filteredData[0].HasChildren != null && filteredData[0].HasChildren > 0)
                        || (filteredData[0].children?.length ?? 0) > 0);
                    const removedChildren = filteredData.map((node: ITreeNode) => ({ ...node, children: [] }));
                    updatedTreeData = await FnAddSubNode(updatedTreeData, newNode.key, removedChildren, treeContainerProps.featureTreeProps, treeContainerProps.featureId, false, newNode.stepNo);
                    if (hasChildren) {
                      currentExpandedKeys.push(filteredData[0].key);
                      expandedNodes.push(filteredData[0]);
                      await findAndAppendChildren(removedChildren[0]);
                    }
                    else {
                      expandSelection.selectedNodeKey = [removedChildren[0].key];
                      expandSelection.selectedNodeData = toSelectedNodeInfo(removedChildren[0]);
                      return;
                    }
                  }
                  else if (filteredData && filteredData.length > 1) {
                    const removedChildren = filteredData.map((node: ITreeNode) => ({ ...node, children: [] }));
                    updatedTreeData = await FnAddSubNode(updatedTreeData, newNode.key, removedChildren, treeContainerProps.featureTreeProps, treeContainerProps.featureId, false, newNode.stepNo);
                    expandSelection.selectedNodeKey = [removedChildren[0].key];
                    expandSelection.selectedNodeData = toSelectedNodeInfo(removedChildren[0]);
                    return;
                  }
                }
                else {
                  setDefaultSelectedKeys([]);
                  lastHandledKeyRef.current = null;
                  newNode.isLeaf = true;
                  expandSelection.selectedNodeKey = [newNode.key];
                  expandSelection.selectedNodeData = toSelectedNodeInfo(newNode);
                  return;
                }
              }
              else {
                setDefaultSelectedKeys([]);
                lastHandledKeyRef.current = null;
                newNode.isLeaf = true;
                expandSelection.selectedNodeKey = [newNode.key];
                expandSelection.selectedNodeData = toSelectedNodeInfo(newNode);
                return;
              }
            }
            //add childnodes and expand 
          }
          else {
            if (newNode && newNode.children && newNode.children.length > 1) {
              expandSelection.selectedNodeKey = [newNode.children[0].key];
              expandSelection.selectedNodeData = toSelectedNodeInfo(newNode.children[0]);
              return;
            }
            else if (newNode && newNode.children && newNode.children.length === 1) {
              currentExpandedKeys.push(newNode.children[0].key);
              expandedNodes.push(newNode.children[0]);
              await findAndAppendChildren(newNode.children[0]);
            }
            else {
              expandSelection.selectedNodeKey = [newNode.key];
              expandSelection.selectedNodeData = toSelectedNodeInfo(newNode);
              return;
            }
            //if children auto expand
          }
        }
        await findAndAppendChildren(node);
        const floorNode = expandSelection.selectedNodeData?.node;
        if (floorNode?.NodeType?.toLowerCase() === "floor" && floorNode.HasChildren && !apiFetchedNodeKeys.has(floorNode.key)) {
          const apiResult = await FnCallApiToGetDataForTreeForFloor(
            updatedOriginalData,
            floorNode,
            treeContainerProps.featureId,
            statusBarContext,
            sessionContext,
            sessionContext.SessionList,
            expandedNodes,
            dcExplorerContainerProps.applyFilter
          );
          if (apiResult.originalTreeData?.length) {
            updatedOriginalData = apiResult.originalTreeData
          }
        }
        return { updatedTreeData, currentExpandedKeys, selectedNodeKey: expandSelection.selectedNodeKey, selectedNodeData: expandSelection.selectedNodeData, updatedOriginalData, expandedNodes }
      }
      FnAutoExpandTreeNodes(info.node, expandedNodeKeys, (dcExplorerContainerProps.featureId === FEnums.InventoryManagement || treeContainerFlatDataProps.featureId === FEnums.InventoryConfiguration) ? originalTreeDataForInventory : treeContainerFlatDataProps.featureId && ReuseDataForFeatures.includes(treeContainerFlatDataProps.featureId) ? originalTreeData : originalTreeDataWithoutFilter, treeData ?? [], treeContainerFlatDataProps).then(async (result: IAutoExpandTreeNodesResult | undefined) => {
        if (result) {
          const sessionData: ISessionVariable[] = [];
          if (result.expandedNodes && result.expandedNodes.length > 0) {
            result.expandedNodes.forEach((element: ITreeNode) => {
              if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Site")) {
                sessionData.push({ VariableContext: "Location", VariableName: "SiteName", SessionValue: element.Name });
                sessionData.push({ VariableContext: "Location", VariableName: "SiteID", SessionValue: element.NodeEntID });
              }
              else if (element.NodeType && FnProcessStringToCompare(element.NodeType, "Tenant")) {
                const splitResult = element.NodeEntID ? element.NodeEntID.split("##") : [];
                sessionData.push({ VariableContext: "Filter", VariableName: "TenantName", SessionValue: element.Name });
                sessionData.push({ VariableContext: "Filter", VariableName: "TenantID", SessionValue: splitResult.length > 0 ? splitResult[0] : element.NodeEntID });
              }
            });
          }
          if (sessionData.length > 0
            && !treeContainerFlatDataProps.isFloorTree
            && (treeContainerFlatDataProps.featureId === FEnums.SelectDataCenterSite.toString()
              || treeContainerFlatDataProps.featureId === FEnums.AuditSession.toString()
            )) {
            logDcExplorerSession("handleNodeExpand → SESSION.UpdateSession", {
              event: result.selectedNodeData?.event,
              nodeKey: result.selectedNodeData?.node?.key,
              nodeName: result.selectedNodeData?.node?.Name,
              nodeType: result.selectedNodeData?.node?.NodeType,
              sessionData,
              featureId: treeContainerFlatDataProps.featureId,
            });
            //API call to update session
            const handleApiForSessionUpdate = (sessionUpdateApiResponse: unknown, status?: string) => {
              if (status === "200" && isSessionUpdateApiResponse(sessionUpdateApiResponse) && sessionUpdateApiResponse.jsonSessionOutput) {
                const parsedData = FnHandleAPIResponse(sessionUpdateApiResponse.jsonSessionOutput, "Dataset")
                if (parsedData && parsedData.length > 0) {
                  sessionContext.setSessionList(parsedData);
                }
              }
            }
            // Call API to get florr device configuration
            axiosInterceptor({
              url: SESSION.UpdateSession,
              data: {
                jsonSession: JSON.stringify(sessionData)
              },
              setFetchData: handleApiForSessionUpdate
            }, statusBarContext);
          }
          setTreeData(result.updatedTreeData);
          setDefaultExpandedKeys(result.currentExpandedKeys);
          needToUpdateTreeNodeRef.current = true;
          setDefaultSelectedKeys(result.selectedNodeKey ? result.selectedNodeKey : []);
          setDefaultSelectedNodeInfo(result.selectedNodeData || null);
          if (result.selectedNodeData) {
            logDcExplorerSession("handleNodeExpand → handleNodeSelect", {
              event: result.selectedNodeData.event,
              selected: result.selectedNodeData.selected,
              nodeKey: result.selectedNodeData.node?.key,
              nodeName: result.selectedNodeData.node?.Name,
              nodeType: result.selectedNodeData.node?.NodeType,
              selectedKeys: result.selectedNodeKey,
              featureId: dcExplorerContainerProps.featureId,
            });
          }
          dcExplorerContainerProps.handleNodeSelect && result.selectedNodeData && dcExplorerContainerProps.handleNodeSelect(result.selectedNodeKey ? result.selectedNodeKey : [], result.selectedNodeData, result.currentExpandedKeys, result.updatedTreeData);
          if (!treeContainerFlatDataProps.isFloorTree && (ReuseDataForFeatures.includes(treeContainerFlatDataProps.featureId) || (treeContainerFlatDataProps.featureId === FEnums.InventoryManagement || treeContainerFlatDataProps.featureId === FEnums.InventoryConfiguration))) {
            await updateOriginalTreeDataset(result.updatedOriginalData, result.currentExpandedKeys, result.selectedNodeKey ? result.selectedNodeKey : [], result.updatedTreeData);
          }
        }
        else {
          setDefaultExpandedKeys(expandedNodeKeys);
        }
      })
    }
  }

  // Selects a node and lazily loads children when the node has no cached children.
  async function handleNodeSelect(selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[], isCalledFromExpand?: boolean) {
    logDcExplorerSession("handleNodeSelect", {
      event: info.event,
      selected: info.selected,
      nodeKey: info.node?.key,
      nodeName: info.node?.Name,
      nodeType: info.node?.NodeType,
      previousSelectedKey: defaultSelectedNodeInfo?.node?.key,
      sameNode: info.node?.key === defaultSelectedNodeInfo?.node?.key,
      isCalledFromExpand,
      selectedKeys,
      featureId: dcExplorerContainerProps.featureId,
    });

    const FnAddChildrenOnSelect = async (node: ITreeNode, originalTreeData: ITreeNode[], treeDataToUpdate: ITreeNode[], treeContainerProps: ITreeForFlatDataContainer) => {
      let updatedTreeData = treeDataToUpdate;
      let updatedOriginalData = originalTreeData;
      const findAndAppendChildren = async (newNode: ITreeNode) => {
        if (newNode && !newNode.children?.length && updatedOriginalData) {
          const resultData = FnFindChildrenBasedOnKey(updatedOriginalData, newNode.key, treeContainerProps.featureId);
          if (resultData && resultData.length > 0) {
            const removedChildren = resultData.map((node: ITreeNode) => ({ ...node, children: [] }));
            updatedTreeData = await FnAddSubNode(updatedTreeData, newNode.key, removedChildren, treeContainerProps.featureTreeProps, treeContainerProps.featureId, false, newNode.stepNo);
            return;
          }
          else {
            const result = await FnAPICallsForGetChildrenNodes(newNode, treeContainerProps.featureId);
            if (result) {
              const formattedData = await FnConvertFlatDataToHierarchyData(result, newNode.NodeEntID, treeContainerProps.featureId);
              if (formattedData?.length) {
                updatedOriginalData = await FnAddSubNode(updatedOriginalData, newNode.key, formattedData, treeContainerProps.featureTreeProps, treeContainerProps.featureId, true, newNode.stepNo);
                const filteredData = FnFindChildrenBasedOnKey(updatedOriginalData, newNode.key, treeContainerProps.featureId);
                if (filteredData && filteredData.length > 0) {
                  const removedChildren = filteredData.map((node: ITreeNode) => ({ ...node, children: [] }));
                  updatedTreeData = await FnAddSubNode(updatedTreeData, newNode.key, removedChildren, treeContainerProps.featureTreeProps, treeContainerProps.featureId, false, newNode.stepNo);
                  return;
                }
              }
              else {
                if (import.meta.env.PROD)
                  console.log('setleaf true:', newNode);
                newNode.isLeaf = true;
                return;
              }
            }
            else {
              if (import.meta.env.PROD)
                console.log('setleaf true:', newNode);
              newNode.isLeaf = true;
              return;
            }
          }
          //add childnodes and expand 
        }
      }
      await findAndAppendChildren(node);
      return { updatedTreeData, updatedOriginalData }
    }
    if (info.node.key === defaultSelectedNodeInfo?.node.key) {
      logDcExplorerSession("handleNodeSelect same node → still forward", {
        event: info.event,
        nodeKey: info.node?.key,
        nodeName: info.node?.Name,
        nodeType: info.node?.NodeType,
      });
      dcExplorerContainerProps.handleNodeSelect && dcExplorerContainerProps.handleNodeSelect([info.node.key], info, defaultExpandedKeys, treeData);
      return;
    }
    let currentTreeData = [...treeData ?? []];
    let isDataUpdated = false;
    let originalTreeData = dcExplorerContainerProps.originalTreeData ? [...dcExplorerContainerProps.originalTreeData] : [];
    if ((info.event === "select" || info.event === "found-select" || info.event === "auto-select") && !info.node.isLeaf && dcExplorerContainerProps.featureId !== FEnums.AuditSession && !info.node.children.length && dcExplorerContainerProps.originalTreeData && treeContainerFlatDataProps) {
      const treeDataAfterAddNodes = await FnAddChildrenOnSelect(info.node, dcExplorerContainerProps.originalTreeData, treeData ?? [], treeContainerFlatDataProps);
      if (treeDataAfterAddNodes.updatedTreeData) {
        currentTreeData = treeDataAfterAddNodes.updatedTreeData;
        originalTreeData = treeDataAfterAddNodes.updatedOriginalData;
      }
      isDataUpdated = true;
    }
    needToUpdateTreeNodeRef.current = true;
    if (expandedNodeKeys) {
      setDefaultExpandedKeys(expandedNodeKeys);
    }
    setDefaultSelectedKeys([info.node.key]);
    setDefaultSelectedNodeInfo(info);
    if (isDataUpdated && treeContainerFlatDataProps && !treeContainerFlatDataProps?.isFloorTree && originalTreeData
      && (ReuseDataForFeatures.includes(treeContainerFlatDataProps.featureId) || (treeContainerFlatDataProps.featureId === FEnums.InventoryManagement || treeContainerFlatDataProps.featureId === FEnums.InventoryConfiguration))) {
      await updateOriginalTreeDataset(originalTreeData, expandedNodeKeys ?? defaultExpandedKeys, [info.node.key], currentTreeData);
    }
    logDcExplorerSession("handleNodeSelect → ExplorerContainer", {
      event: info.event,
      selected: info.selected,
      nodeKey: info.node?.key,
      nodeName: info.node?.Name,
      nodeType: info.node?.NodeType,
      isDataUpdated,
    });
    dcExplorerContainerProps.handleNodeSelect && dcExplorerContainerProps.handleNodeSelect([info.node.key], info, defaultExpandedKeys, currentTreeData);
  }

  /* Flat Tree logic end */
  const prevDepsRef = useRef<IExplorerPrevDeps>({});

  // Loads site hierarchy and tree props when feature or cache dependencies change.
  useEffect(() => {
    if (!dcExplorerContainerProps.featureId) return;
    const prevDeps = prevDepsRef.current;
    //  DETECT feature change FIRST
    const isFeatureChanged =
      prevDeps.featureId !== dcExplorerContainerProps.featureId;
    //  RESET HERE (before anything else)
    if (isFeatureChanged) {
      isSiteFilterChangedRef.current = false;
      // Invalidate in-flight tree loads from the previous feature.
      treeLoadGenerationRef.current += 1;
      checkedNodeKeysRef.current = [];
      checkedNodeKeysToCutRef.current = [];
      cutSourceFloorNodeRef.current = null;
      cutSourceNodeRef.current = null;
      setDefaultCheckedKeys([]);
      setDefaultStrictlyCheckedKeys(undefined);
      setSearchHistory([]);
      setSearchText("");
    }
    const currentDeps: IExplorerPrevDeps = {
      featureId: dcExplorerContainerProps.featureId,
      nodeId: dcExplorerContainerProps.selectedNodeExplorer?.node.NodeEntID,
      subTreeFeatureId: dcExplorerContainerProps.subTreeFeatureId,
      uniqueName: dcExplorerContainerProps.uniqueName,
      reloadCache: dcExplorerContainerProps.isReloadTreeCache,
    };
    const otherDependencyChanged =
      prevDeps.featureId !== currentDeps.featureId ||
      prevDeps.nodeId !== currentDeps.nodeId ||
      prevDeps.subTreeFeatureId !== currentDeps.subTreeFeatureId ||
      prevDeps.uniqueName !== currentDeps.uniqueName ||
      prevDeps.reloadCache !== currentDeps.reloadCache;
    prevDepsRef.current = currentDeps;
    // CLEAR before setting new fetch logic
    setIsApiCalled(false);
    setApiData(null);
    const isShowCheckbox = dcExplorerContainerProps.featureId == FEnums.Monitor || dcExplorerContainerProps.featureId == FEnums.Discover
      || dcExplorerContainerProps.featureId == FEnums.Server || dcExplorerContainerProps.featureId == FEnums.VirtualCompute || dcExplorerContainerProps.featureId == FEnums.CloudCompute ? false : true;
    const featureProps: IFeatureTree = {
      hideKebabMenu:
        dcExplorerContainerProps.hideKebabMenu !== undefined
          ? dcExplorerContainerProps.hideKebabMenu
          : (dcExplorerContainerProps.subTreeFeatureId ? true : false),
      allowCheckbox: dcExplorerContainerProps.subTreeFeatureId ? false : isShowCheckbox,
      allowIcon: true,
      hideCopyIcon:
        dcExplorerContainerProps.hideKebabMenu !== undefined
          ? dcExplorerContainerProps.hideKebabMenu
          : false,
      hideFloorLayout:
        dcExplorerContainerProps.hideFloorLayout !== undefined
          ? dcExplorerContainerProps.hideFloorLayout
          : false,
      reuseFromCache: dcExplorerContainerProps.subTreeFeatureId ? false : ReuseDataForFeatures.includes(dcExplorerContainerProps.featureId),
      instanceName: "dc_explorer_tree",
      isAllowDrag: dcExplorerContainerProps.subTreeFeatureId &&
        (dcExplorerContainerProps.featureId === FEnums.AuditSession || dcExplorerContainerProps.featureId === FEnums.ModelBusinessService)
        ? true : (dcExplorerContainerProps.featureId === FEnums.ConfigureDevice || dcExplorerContainerProps.featureId === FEnums.EditFloorLayout ||
          dcExplorerContainerProps.featureId === FEnums.MoveAddChange || dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration) ? true : false,
      isAllowDrop: dcExplorerContainerProps.featureId === FEnums.ConfigureDevice || dcExplorerContainerProps.featureId === FEnums.MoveAddChange || dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration ? true : false,
      allowCheckStrictly: false,
      allowInternalDrag: dcExplorerContainerProps.featureId === FEnums.ConfigureDevice || dcExplorerContainerProps.featureId === FEnums.MoveAddChange || dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration ? true : false,
      multiRootNode: false,
      openAllNodes: false,
      allowCustomCheck: false,
      disableSelection: false
    }
    setFeatureTreeProps(featureProps);
    // Fetches or restores site hierarchy when feature props are initialized.
    const handleFeatureChange = async () => {
      // New load generation — any older in-flight displayOnlyVisibleNode is ignored.
      treeLoadGenerationRef.current += 1;
      setIsShowFilterForm(false);
      setIsFilterChange(false)
      setSearchText("");
      setSearchHistory([]);
      checkedNodeKeysRef.current = [];
      checkedNodeKeysToCutRef.current = [];
      setDefaultCheckedKeys([]);
      setDefaultStrictlyCheckedKeys(undefined);
      const treeContainerFlatProps: ITreeForFlatDataContainer = {
        uniqueName: `${dcExplorerContainerProps.uniqueName}-dce-flat`,
        flatAPIData: null,
        featureId: dcExplorerContainerProps.featureId,
        featureTreeProps: featureProps,
      }
      setTreeContainerFlatDataProps(treeContainerFlatProps);
      console.timeEnd('createandinitsession_nk');
      console.time('treecreation_nk');
      if (dcExplorerContainerProps.originalTreeData?.length && !dcExplorerContainerProps.isReloadTreeCache) {
        displayOnlyVisibleNodeRef.current(dcExplorerContainerProps.originalTreeData, featureProps, dcExplorerContainerProps.featureId, dcExplorerContainerProps.selectedNodeExplorer ?? null, treeContainerFlatProps, sessionContext.SessionList);
      }
      else {
        setIsApiCalled(true);
        const isInv = dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;
        const currentSiteId = getSiteIdFromSessionList(sessionContext.SessionList);
        const filteredAllSitesData = FnFilterSiteHierarchyFromAllSites(
          mainAppContext.allSitesHierarchyRecords,
          currentSiteId,
          isInv
        );

        if (filteredAllSitesData) {
          setIsApiCalled(true);
          setApiData(filteredAllSitesData as IFlatExplorerApiData);
        } else {
          setTreeData([]);
          setApiData(null);
        }
      }
      // call API based on the featureId to get the data
    }
    if (!isSiteFilterChangedRef.current && otherDependencyChanged) {
      handleFeatureChange();
    }
    return () => {
      lastHandledKeyRef.current = null;
      checkedNodeKeysRef.current = [];
      checkedNodeKeysToCutRef.current = [];
      setDefaultExpandedKeys([]);
      setDefaultSelectedKeys([]);
      setDefaultSelectedNodeInfo(null);
      setDefaultCheckedKeys([]);
      setDefaultStrictlyCheckedKeys(undefined);
    };
  }, [dcExplorerContainerProps.featureId, dcExplorerContainerProps.selectedNodeExplorer?.node.NodeEntID, dcExplorerContainerProps.subTreeFeatureId, dcExplorerContainerProps.uniqueName,
  dcExplorerContainerProps.isReloadTreeCache,
  ])

  const sendStatusBarData = (data: Record<string, string | number | undefined>) => {
    dcExplorerContainerProps.updateStatusBarData && dcExplorerContainerProps.updateStatusBarData(JSON.stringify(data), true);
  };

  // Updates status bar device counts when inventory selection changes.
  useEffect(() => {
    const featureToExcludeForStatusBarUpdate = [
      FEnums.AuditSession.toString(),
      FEnums.InventoryCollection.toString(),
      FEnums.InventoryReconciliation.toString(),
      FEnums.ModelBusinessService.toString(),
      FEnums.ManageBusinessService.toString()
    ]
    if (!defaultSelectedNodeInfo?.node || !treeDataRef.current) return;
    const nodeType = defaultSelectedNodeInfo.node.NodeType?.toLowerCase();
    const node = defaultSelectedNodeInfo.node;
    const featureId = dcExplorerContainerProps.featureId;
    let statusBarData: Record<string, string | number | undefined> = {
    }
    if (featureId === FEnums.InventoryConfiguration || featureId === FEnums.InventoryManagement) {
      function countDevicesByAncestorNames(tree: ITreeNode[], ancestorNames: string[]): Record<string, number> {
        const counts: Record<string, number> = {};
        // Initialize counts
        for (const name of ancestorNames) {
          counts[name] = 0;
        }
        function traverse(nodes: ITreeNode[], ancestors: string[]) {
          for (const node of nodes) {
            if (node.NodeType?.toLowerCase() === "device") {
              for (const name of ancestorNames) {
                if (ancestors.some(a => a?.toLowerCase() === name?.toLowerCase())) {
                  counts[name]++;
                  break; // Stop checking after first match
                }
              }
            }
            if (node.children?.length && node.Name) {
              traverse(node.children, [...ancestors, node.Name]);
            }
          }
        }
        traverse(tree, []);
        return counts;
      }
      if (nodeType && ["site", "inventory", "store"].includes(nodeType)) {
        const parentNode = FnFindNearestNodeByType(treeDataRef.current, node, "Site");
        if (parentNode) {
          statusBarData = {
            "Site": parentNode.Name ?? undefined
          }
        }
        else {
          statusBarData = {
            "Site": node.Name ?? undefined
          }
        }
        if (nodeType === "store") {
          if (node.Name && node.Name?.toLowerCase() === "all cables" && node.children.length) {
            const statusBarObject = countDevicesByAncestorNames(node.children, ["Network Cables", "Power Cables"]);
            statusBarData = {
              ...statusBarData,
              ...statusBarObject
            }
          }
          else if (node.Name && node.Name?.toLowerCase() === "in-use devices" && node.children.length) {
            const statusBarObject = countDevicesByAncestorNames(node.children, ["Rack", "PDU"]);
            statusBarData = {
              ...statusBarData,
              ...statusBarObject
            }
          }
          else if (node.Name && node.Name?.toLowerCase() === "spare devices" && node.children.length) {
            const statusBarObject = countDevicesByAncestorNames(node.children, ["New", "Used", "Other", "Disposable"]);
            statusBarData = {
              ...statusBarData,
              ...statusBarObject
            }
          }
        }
      }
      sendStatusBarData(statusBarData);
    }
    else if (nodeType && !featureToExcludeForStatusBarUpdate.includes(dcExplorerContainerProps.featureId)) {
      const parentNodes = treeDataRef.current ? FnFindNodeAndParents(treeDataRef.current, node.key) : [];
      const statusBarObject = FnBuildStatusBarObject(nodeType, undefined, node, parentNodes ?? [], featureId);
      if (statusBarObject) {
        sendStatusBarData(statusBarObject)
      }
    }
  }, [defaultSelectedNodeInfo, treeDataRef.current, dcExplorerContainerProps.featureId])

  // Forwards AI action clicks to the parent feature container.
  const handleAIClick = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => {
    if (dcExplorerContainerProps.handleAIClick) {
      dcExplorerContainerProps.handleAIClick(event, actionCode);
    }
    else {
      alert("Handle Action Image click")
    }
  }

  // Opens or applies the site/tenant filter panel from the search toolbar.
  const handleFilterActionClick = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => {
    if (event) {
      if (actionCode === "close") {
        setFilterFormData(() => ({
          tenant: undefined,
          team: undefined,
          tag: undefined,
          vendor: undefined,
          tenantID: undefined,
          teamID: undefined,
          tagID: undefined,
          vendorID: undefined,
        }));
        setIsFilterChange(false);
        setIsShowFilterForm(!isShowFilterForm);
      }
      else {
        searchCacheRef.current = null;
        setSearchText(null);
        handleFilterClick();
      }
    }
  }

  // Updates tenant/team/tag/vendor filter form values and marks filter dirty.
  const handleFilterFormChange = (value: string | undefined, name: string, id?: string) => {
    if (value === undefined) return;
    setFilterFormData(() => ({
      tenant: name.toLowerCase() === "tenant" ? value : undefined,
      team: name.toLowerCase() === "team" ? value : undefined,
      tag: name.toLowerCase() === "tag" ? value : undefined,
      vendor: name.toLowerCase() === "vendor" ? value : undefined,
      tenantID: name.toLowerCase() === "tenant" ? id : undefined,
      teamID: name.toLowerCase() === "team" ? id : undefined,
      tagID: name.toLowerCase() === "tag" ? id : undefined,
      vendorID: name.toLowerCase() === "vendor" ? id : undefined,
    }));
    setIsFilterChange(true);
  }

  // Syncs site/room selection from the filter tree checkbox state.
  const handleFilterTreeNodeCheck = (checked: { checked: Key[]; halfChecked: Key[] }, info: CheckInfo<ITreeNode>) => {
    setIsSiteFilterApplied(true);
    searchCacheRef.current = null;
    setSearchText(null);
    if (info.checkedNodes.length > 0) {
      filterTreeNodeData.RoomID = "";
      filterTreeNodeData.RoomName = "";
      info.checkedNodes.forEach((node: ITreeNode) => {
        if (node.treetype && FnProcessStringToCompare(node.treetype, "site")) {
          filterTreeNodeData.SiteID = node.NodeEntID || "";
          filterTreeNodeData.SiteName = node.Name || "";
          filterTreeNodeData.SiteDateFormat = node.SiteDateFormat || "";
        }
        else if (node.treetype && FnProcessStringToCompare(node.treetype, "room")) {
          filterTreeNodeData.RoomID = node.NodeEntID || "";
          filterTreeNodeData.RoomName = node.Name || "";
        }
      });
      setFilterFormData(() => ({
        tenant: undefined,
        team: undefined,
        tag: undefined,
        vendor: undefined,
        tenantID: undefined,
        teamID: undefined,
        tagID: undefined,
        vendorID: undefined,
      }));
      setFilterTreeNodeData({ ...filterTreeNodeData });
    }
    setIsFilterChange(true)
  }

  // Toggles filter panel and reloads hierarchy when filter values changed.
  const handleFilterClick = async () => {
    if (isShowFilterForm) {
      if (isFilterChange) {
        statusBarContext.setIsLoading(true);
        setTreeData(undefined);
        setApiData(null);
        if (filterTreeNodeData.SiteID?.length) {
          const newSiteName = filterTreeNodeData.SiteName || filterTreeNodeData.SiteID;
          sendStatusBarData({
            Site: newSiteName,
            ...(filterTreeNodeData.RoomName ? { Room: filterTreeNodeData.RoomName } : {})
          });
        }
        try {
          // call API to reload the tree data
          let jsonstring: ISession[] = [];
          if (filterTreeNodeData.SiteID?.length) {
            jsonstring.push({ VariableContext: "Location", VariableName: "SiteID", SessionValue: filterTreeNodeData.SiteID });
            jsonstring.push({ VariableContext: "Location", VariableName: "SiteName", SessionValue: filterTreeNodeData.SiteName });
            if (filterTreeNodeData.SiteDateFormat) {
              jsonstring.push({ VariableContext: "Location", VariableName: "SiteDateFormat", SessionValue: filterTreeNodeData.SiteDateFormat });
            }
            jsonstring.push({ VariableContext: "Location", VariableName: "RoomID", SessionValue: "" });
            jsonstring.push({ VariableContext: "Location", VariableName: "RoomName", SessionValue: "" });
            jsonstring.push({ VariableContext: "Filter", VariableName: "FilterRoomID", SessionValue: filterTreeNodeData.RoomID });
            jsonstring.push({ VariableContext: "Filter", VariableName: "FilterRoomName", SessionValue: filterTreeNodeData.RoomName });
            jsonstring.push({ VariableContext: "Location", VariableName: "FloorID", SessionValue: "" });
            jsonstring.push({ VariableContext: "Location", VariableName: "FloorName", SessionValue: "" });
            jsonstring.push({ VariableContext: "Location", VariableName: "LocationID", SessionValue: "" });
            jsonstring.push({ VariableContext: "Location", VariableName: "LocationName", SessionValue: "" });
            jsonstring.push({ VariableContext: "Node", VariableName: "SelectedNodeID", SessionValue: "" });
            jsonstring.push({ VariableContext: "Node", VariableName: "SelectedNodeName", SessionValue: "" });
            jsonstring.push({ VariableContext: "Node", VariableName: "SelectedNodeEntity", SessionValue: "" });
          }
          if (filterFormData) {
            const tenant = filterFormData.tenant ?? "";
            const team = filterFormData.team ?? "";
            const tag = filterFormData.tag ?? "";
            const vendor = filterFormData.vendor ?? "";
            let tenantVal = "";
            let teamVal = "";
            let tagVal = "";
            let vendorVal = "";
            if (tenant) {
              tenantVal = tenant;
            } else if (team) {
              teamVal = team;
            } else if (tag) {
              tagVal = tag;
            } else if (vendor) {
              vendorVal = vendor;
            }
            jsonstring.push(
              { VariableContext: "Filter", VariableName: "TenantName", SessionValue: tenantVal },
              { VariableContext: "Filter", VariableName: "TenantID", SessionValue: filterFormData.tenantID ?? "" },
              { VariableContext: "Filter", VariableName: "TeamName", SessionValue: teamVal },
              { VariableContext: "Filter", VariableName: "TeamID", SessionValue: filterFormData.teamID ?? "" },
              { VariableContext: "Filter", VariableName: "TagName", SessionValue: tagVal },
              { VariableContext: "Filter", VariableName: "TagID", SessionValue: filterFormData.tagID ?? "" },
              { VariableContext: "Filter", VariableName: "VendorName", SessionValue: vendorVal },
              { VariableContext: "Filter", VariableName: "VendorID", SessionValue: filterFormData.vendorID ?? "" }
            );
          }
          logDcExplorerSession("filter apply → SESSION.UpdateSession", {
            event: "select",
            sessionData: jsonstring,
            siteId: filterTreeNodeData.SiteID,
            roomId: filterTreeNodeData.RoomID,
          });

          let updateSessionSuccess = false;
          await axiosInterceptor({
            url: SESSION.UpdateSession,
            data: {
              jsonSession: JSON.stringify(jsonstring)
            },
            setFetchData: (updateSessionApiResponse: unknown, status?: string) => {
              if (status === "200" && updateSessionApiResponse && typeof updateSessionApiResponse === "object" && 'jsonSessionOutput' in updateSessionApiResponse) {
                const extractedData = FnHandleAPIResponse(updateSessionApiResponse.jsonSessionOutput, 'Dataset');
                if (extractedData && Array.isArray(extractedData)) {
                  sessionContext.setSessionList(extractedData);
                }
                updateSessionSuccess = true;
              }
            }
          }, statusBarContext);

          if (updateSessionSuccess) {
            const isInv = dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration;
            const filteredAllSitesData = FnFilterSiteHierarchyFromAllSites(
              mainAppContext.allSitesHierarchyRecords,
              filterTreeNodeData.SiteID,
              isInv
            );

            if (filteredAllSitesData && typeof filteredAllSitesData === "object") {
              const sitePropsPromise = FnSetSelectedSiteProperties({
                siteId: filterTreeNodeData.SiteID,
                statusbarContext: statusBarContext,
                setSiteProperties: (data: ISiteProperties) => {
                  mainAppContext.setSiteProperties(data);
                }
              });
              const payload: IFnCreateForensiclog = {
                logType: 'UserAction',
                GroupName: LogGroupName.ForensicLogTemplate,
                _Forensiclog: LogSubGroupName.Filter,
                SubGroupName: LogSubGroupName.Filter,
                LogName: LogName.ChangeSite,
                actionObject: {
                  SiteName: filterTreeNodeData.SiteName
                },
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                RefTableItems: mainAppContext.refTableRecords,
                allowShowLoader: false
              };
              const forensicLogPromise = FnCreateForensiclog(payload);
              await Promise.allSettled([sitePropsPromise, forensicLogPromise]);

              dcExplorerContainerProps.clearCacheTreeData?.();
              isSiteFilterChangedRef.current = true;
              explorerTreeContext.setIsSiteChanged(true);
              setIsApiCalled(true);
              setApiData(filteredAllSitesData as IFlatExplorerApiData);

              if (filterTreeNodeData.SiteID?.length) {
                const newSiteName = filterTreeNodeData.SiteName || filterTreeNodeData.SiteID;
                sendStatusBarData({
                  Site: newSiteName,
                  ...(filterTreeNodeData.RoomName ? { Room: filterTreeNodeData.RoomName } : {})
                });
              }
            } else {
              dcExplorerContainerProps.clearCacheTreeData?.();
              setTreeData([]);
              setApiData(null);
            }
          } else {
            dcExplorerContainerProps.clearCacheTreeData?.();
            setTreeData([]);
            setApiData(null);
          }
        } catch (error) {
          console.error("Failed to change site in filter:", error);
          dcExplorerContainerProps.clearCacheTreeData?.();
          setTreeData([]);
          setApiData(null);
        } finally {
          statusBarContext.setIsLoading(false);
        }
      }
      setIsFilterChange(false);
    }
    else {
      isSiteFilterChangedRef.current = false;
      siteHierarchyVersionRef.current += 1;
      explorerTreeContext.setIsSiteChanged(false);
    }
    setIsShowFilterForm(!isShowFilterForm);
  }

  // Searches the local tree cache first, then calls the explorer search API.
  const handleKeywordSearch = async (searchText: string, searchAllWord: boolean) => {
    if (treeData) {
      try {
        //Search in user tree data.
        let foundedNode = FnSearchKeywordInLocalTree(searchText, treeData, searchHistory);
        let foundFromCache = false;
        let cachedTreeData = [...originalTreeData];
        if (foundedNode && foundedNode.foundNode == null && dcExplorerContainerProps.featureId) {
          //Filter cached tree data based on selected feature
          cachedTreeData = await FnUpdateTreeNodesBasedOnFeatureId(cachedTreeData, dcExplorerContainerProps.subTreeFeatureId ?? dcExplorerContainerProps.featureId);
          //Search in Cached data. 
          foundedNode = FnSearchKeywordInLocalTree(searchText, cachedTreeData, searchHistory);
          foundFromCache = foundedNode && foundedNode.foundNode ? true : false;
        }
        if (foundedNode && foundedNode.foundNode === null && featureTreeProps) {
          let exploreType = 2
          if (dcExplorerContainerProps.featureId === FEnums.AssetConfiguration) {
            exploreType = 2
          } else if (dcExplorerContainerProps.featureId === FEnums.ConfigureDevice) {
            exploreType = 3
          }
          else if (dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration) {
            exploreType = 1
          }
          const originalTreeDataToSearch = (dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration) ? originalTreeDataForInventory : originalTreeData;

          let records = searchCacheRef.current?.records;
          let isFromCache = false;

          // Check if valid cache exists for this keyword and AND/OR condition
          if (
            searchCacheRef.current &&
            searchCacheRef.current.keyword === searchText &&
            searchCacheRef.current.searchAllWord === searchAllWord &&
            searchCacheRef.current.records.length > 0
          ) {
            isFromCache = true;
            records = searchCacheRef.current.records;
          } else {
            // First time search or criteria changed: call SearchKeywordNew API
            searchCacheRef.current = null;
            records = await FnFetchSearchKeywordNew(searchText, searchAllWord, exploreType, statusBarContext);
            if (!records || records.length === 0) {
              dcExplorerContainerProps.handleShowUserMessage?.("No results found for the entered keyword.");
              return;
            }
            searchCacheRef.current = {
              keyword: searchText,
              searchAllWord,
              records,
              currentIndex: -1
            };
          }

          // Pick next record excluding previous results from list (searchHistory)
          let targetRecord: ISearchKeywordNewRecord | undefined;
          let targetIndex = -1;

          if (isFromCache && searchCacheRef.current) {
            for (let i = searchCacheRef.current.currentIndex + 1; i < records.length; i++) {
              const r = records[i];
              if (r.EntID && !searchHistory.includes(r.EntID)) {
                targetRecord = r;
                targetIndex = i;
                break;
              }
            }
            if (!targetRecord) {
              for (let i = 0; i <= searchCacheRef.current.currentIndex; i++) {
                const r = records[i];
                if (r.EntID && !searchHistory.includes(r.EntID)) {
                  targetRecord = r;
                  targetIndex = i;
                  break;
                }
              }
            }
            if (!targetRecord) {
              dcExplorerContainerProps.handleShowUserMessage?.("Reached end of search results.");
              return;
            }
          } else {
            targetRecord = records[0];
            targetIndex = 0;
          }

          if (searchCacheRef.current) {
            searchCacheRef.current.currentIndex = targetIndex;
          }

          // Call API to expand node based on hierarchy given in the record
          const result = await FnTraverseHierarchyRecord(
            originalTreeDataToSearch,
            targetRecord,
            dcExplorerContainerProps.featureId,
            exploreType,
            featureTreeProps,
            statusBarContext
          );

          if (result && Array.isArray(result.parentNodes) && result.parentNodes.length > 0) {
            const parentNodeKeys = result.parentNodes
              .map(item => item.EntID)
              .filter((key): key is string => key !== undefined);
            if (featureTreeProps && parentNodeKeys.length > 0) {
              if (dcExplorerContainerProps.featureId === FEnums.InventoryManagement || dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration) {
                setOriginalTreeDataForInventory(result.originalTreeData);
              }
              else if (dcExplorerContainerProps.featureId && ReuseDataForFeatures.includes(dcExplorerContainerProps.featureId)) {
                setOriginalTreeData(result.originalTreeData);
              }
              else {
                setOriginalTreeDataWithoutFilter(result.originalTreeData)
              }
              setOriginalTreeData(result.originalTreeData);
              const targetKey = result.selectedNodeKey || parentNodeKeys[parentNodeKeys.length - 1];
              const targetEntId = result.parentNodes[result.parentNodes.length - 1]?.EntID;
              const allParentKeys = Array.from(new Set([...(result.expandKeys ?? []), ...parentNodeKeys]))
                .filter(key => key !== targetKey && key !== targetEntId);
              const updatedTree = await FnUpdateVisibleTreeData(result.originalTreeData, treeData, allParentKeys, featureTreeProps, dcExplorerContainerProps.featureId, false);
              setTreeData(updatedTree.visibleTree);
              const updatedExpandedKeys = Array.from(new Set([...allParentKeys, ...defaultExpandedKeys]))
                .filter(key => key !== targetKey && key !== targetEntId);
              setDefaultExpandedKeys(updatedExpandedKeys);
              needToUpdateTreeNodeRef.current = true;
              setDefaultSelectedKeys([targetKey]);
              const foundNodeForKey = FnGetNodeDetailsBasedOnKey(updatedTree.visibleTree, targetKey);
              const foundNodeKey = foundNodeForKey?.node?.key ?? targetKey;
              const foundNodeEntId = foundNodeForKey?.node?.NodeEntID ?? targetEntId;
              const finalExpandedKeys = updatedExpandedKeys.filter(key => key !== foundNodeKey && key !== foundNodeEntId);
              if (finalExpandedKeys.length !== updatedExpandedKeys.length) {
                setDefaultExpandedKeys(finalExpandedKeys);
              }
              if (foundNodeForKey) {
                logDcExplorerSession("keyword search API → handleNodeSelect", {
                  event: "found-select",
                  nodeKey: foundNodeForKey.node?.key,
                  nodeName: foundNodeForKey.node?.Name,
                  nodeType: foundNodeForKey.node?.NodeType,
                });
                setDefaultSelectedNodeInfo({
                  event: "select",
                  node: foundNodeForKey.node,
                  selected: true,
                  selectedNodes: []
                })
                dcExplorerContainerProps.handleNodeSelect && dcExplorerContainerProps.handleNodeSelect([foundNodeForKey.node.key], {
                  event: "found-select",
                  node: foundNodeForKey.node,
                  selected: true,
                  selectedNodes: []
                }, finalExpandedKeys, updatedTree.visibleTree);
              }
              if (dcExplorerContainerProps.updateOriginalTreeDataset) {
                dcExplorerContainerProps.updateOriginalTreeDataset(result.originalTreeData, finalExpandedKeys, [foundNodeForKey?.node.key ?? targetKey], updatedTree.visibleTree)
              }
              setSearchHistory(prev => {
                const historyItem = targetRecord?.EntID || parentNodeKeys[parentNodeKeys.length - 1];
                return Array.from(new Set([...prev, historyItem, ...(targetRecord?.EntID ? [targetRecord.EntID] : [])]));
              });
            }
          }
          else {
            dcExplorerContainerProps.handleShowUserMessage?.("No results found for the entered keyword.");
          }
        }
        else if (foundedNode && foundedNode.foundNode) {
          const targetKey = foundedNode.foundNode.key;
          const targetEntId = foundedNode.foundNode.NodeEntID;
          const parentNodeKeys = foundedNode.parentNodes
            .map((item: ITreeNode) => item.key)
            .filter(key => key !== targetKey && key !== targetEntId);
          let visibleTree: ITreeNode[] = treeData;
          if (foundFromCache) {
            if (featureTreeProps && parentNodeKeys.length > 0 && dcExplorerContainerProps.featureId) {
              const updatedTree = await FnUpdateVisibleTreeData(cachedTreeData, treeData, parentNodeKeys, featureTreeProps, dcExplorerContainerProps.featureId, foundFromCache);
              visibleTree = updatedTree.visibleTree;
              setTreeData(updatedTree.visibleTree);
            }
          }
          const updatedExpandedKeys = Array.from(new Set([...parentNodeKeys, ...defaultExpandedKeys]))
            .filter(key => key !== targetKey && key !== targetEntId);
          setDefaultExpandedKeys(updatedExpandedKeys);
          needToUpdateTreeNodeRef.current = true;
          setDefaultSelectedKeys([foundedNode.foundNode.key]);
          logDcExplorerSession("keyword search local → handleNodeSelect", {
            event: "found-select",
            nodeKey: foundedNode.foundNode.key,
            nodeName: foundedNode.foundNode.Name,
            nodeType: foundedNode.foundNode.NodeType,
          });
          setDefaultSelectedNodeInfo({
            event: "select",
            node: foundedNode.foundNode,
            selected: true,
            selectedNodes: []
          });
          dcExplorerContainerProps.handleNodeSelect && dcExplorerContainerProps.handleNodeSelect([foundedNode.foundNode.key], {
            event: "found-select",
            node: foundedNode.foundNode,
            selected: true,
            selectedNodes: []
          }, updatedExpandedKeys, visibleTree);
          setSearchHistory([...searchHistory, foundedNode.foundNode.key]);
        }
      } catch (error) {
      }
      finally {
        selectedNodeContext.setSearchParaToSelect(undefined);
        setSearchParams({});
      }
    }
  }

  // Writes a forensic log entry for the selected node action.
  const CreateLogForNode = async (LogName: string, selectedNode: ITreeNode, DestNodeEntID?: string, SelectedRadioButton?: string, SubGroupName?: string) => {
    try {
      function convertObjectToPath(data: Record<string, unknown>): string {
        return Object.values(data)
          .filter(value => value !== undefined && value !== null && value !== "")
          .map(value => String(value))
          .join("->");
      }
      if (treeData && selectedNode) {
        const Name = selectedNode.Name
        const data = await FnReturnNodeNameObject(treeData, selectedNode?.NodeEntID as string)
        const path = convertObjectToPath(data)
        let destPath = ''
        if (DestNodeEntID) {
          const Destdata = await FnReturnNodeNameObject(treeData, DestNodeEntID as string)
          destPath = convertObjectToPath(Destdata)
        }
        const payload: IFnCreateForensiclog = {
          logType: 'UserAction',
          GroupName: LogGroupName.ForensicLogTemplate,
          _Forensiclog: SubGroupName ?? LogSubGroupName.Device,
          SubGroupName: SubGroupName ?? LogSubGroupName.Device,
          LogName: LogName,
          actionObject: {
            deviceName: Name,
            sourcePath: path,
            destPath: destPath,
            DragDeviceName: Name,
            SelectedRadioButton: SelectedRadioButton
          },
          sessionContext: sessionContext,
          statusBarContext: statusBarContext,
          RefTableItems: mainAppContext.refTableRecords
        }
        FnCreateForensiclog(payload)
      }
    } catch (err) {
      console.error(err)
      throw new Error("Failed to create forensic log")
    }
  }

  // Confirms delete/empty actions or dismisses the work order success dialog.
  const handleConfirmYesClick = async () => {

    if (workOrderData) {
      setWorkOrderData([]);
      setConfirmMessage("");
      setIsConfirmOpen(false);
      // we have to call api to execute workorder
      return;
    }
    if (defaultSelectedNodeInfo && defaultSelectedNodeInfo.node) {
      if (selectedKebabMenu && typeof selectedKebabMenu === "object" && 'Label' in selectedKebabMenu) {
        if (selectedKebabMenu.Label === RightMouseMenuTreeNode.Delete) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            if (treeData) {
              const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
              setWorkorderRecords(workOrderProfile);
              setShowSelectWorkorder(true);
              setCreateWorkOrderPayload({
                treeData: treeData,
                sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Delete",
                action: "Delete",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
                ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                extraSouceObj: {
                  MountedDeviceEntID: defaultSelectedNodeInfo.node.MountedDeviceID,
                  MountedDeviceName: defaultSelectedNodeInfo.node.MountedDeviceID ? defaultSelectedNodeInfo.node.Name : "",
                }
              })
            }
            setIsConfirmOpen(false);
            setConfirmMessage("");
          } else {
            axiosInterceptor({
              url: DEVICE.DeleteDevice,
              data: {
                entID: defaultSelectedNodeInfo.node.MountedDeviceID ?? defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: (deleteDeviceApiResponse: unknown, status?: string) => {
                if (deleteDeviceApiResponse !== null && status === "200") {
                  CreateLogForNode(LogName.Delete, defaultSelectedNodeInfo.node);
                  handleDeleteRefresh('parent');
                }
                setIsConfirmOpen(false);
                setConfirmMessage("");
              }
            }, statusBarContext)
          }
        }
        else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.DeleteBin) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            if (treeData) {
              const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
              setWorkorderRecords(workOrderProfile);
              setShowSelectWorkorder(true);
              setCreateWorkOrderPayload({
                treeData: treeData,
                sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Delete",
                action: "Delete",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
                ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              })
            }
            setIsConfirmOpen(false);
            setConfirmMessage("");
          } else {

            axiosInterceptor({
              url: EM.DeleteEntityRecords,
              data: {
                entityName: defaultSelectedNodeInfo.node.NodeEntityname,
                entIDs: defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: (deleteDeviceApiResponse: unknown, status?: string) => {
                if (deleteDeviceApiResponse !== null && status === "200") {
                  CreateLogForNode(LogName.Delete, defaultSelectedNodeInfo.node)
                  handleDeleteRefresh('parent');
                }
                setIsConfirmOpen(false);
                setConfirmMessage("");
              }
            }, statusBarContext)
          }
        } else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.EmptyFloorLocation) {
          axiosInterceptor({
            url: DC.EmptyLocation,
            data: {
              locationId: defaultSelectedNodeInfo?.node?.NodeEntID
            },
            allowShowLoader: true,
            setFetchData: (ApiResponse: unknown, status?: string) => {
              if (status === "200") {
                setIsConfirmOpen(false);
                setConfirmMessage("");
                refreshTreeAfterDelete();
              }
            }
          }, statusBarContext)
          // }
        }
        else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.EmptyDevice && defaultSelectedNodeInfo.node) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            if (treeData) {
              const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
              setWorkorderRecords(workOrderProfile);
              setShowSelectWorkorder(true);
              setCreateWorkOrderPayload({
                treeData: treeData,
                sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Empty",
                action: "Empty Device",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
                ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              })
            }
            setIsConfirmOpen(false);
            setConfirmMessage("");
          } else {
            axiosInterceptor({
              url: DEVICE.EmptyDevice,
              data: {
                entID: defaultSelectedNodeInfo.node.MountedDeviceID ?? defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: (emptyDeviceApiResponse: unknown, status?: string) => {
                if (emptyDeviceApiResponse !== undefined && status === "200") {
                  CreateLogForNode(LogName.Empty, defaultSelectedNodeInfo.node)
                  handleDeleteRefresh('self');
                }
                setIsConfirmOpen(false);
                setConfirmMessage("");
              }
            }, statusBarContext);
          }
        } else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.EmptyRack && defaultSelectedNodeInfo.node) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            if (treeData) {
              const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
              setWorkorderRecords(workOrderProfile);
              setShowSelectWorkorder(true);
              setCreateWorkOrderPayload({
                treeData: treeData,
                sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Empty",
                action: "Empty Device",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
                ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              })
            }
            setIsConfirmOpen(false);
            setConfirmMessage("");
          } else {
            axiosInterceptor({
              url: DEVICE.EmptyRack,
              data: {
                entID: defaultSelectedNodeInfo.node.MountedDeviceID ?? defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: (emptyDeviceApiResponse: unknown, status?: string) => {
                if (emptyDeviceApiResponse !== undefined && status === "200") {
                  CreateLogForNode(LogName.Empty, defaultSelectedNodeInfo.node)
                  handleDeleteRefresh('self');
                }
                setIsConfirmOpen(false);
                setConfirmMessage("");
              }
            }, statusBarContext);
          }
        }
        else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.EmptyStore && defaultSelectedNodeInfo.node) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            if (treeData) {
              const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
              setWorkorderRecords(workOrderProfile);
              setShowSelectWorkorder(true);
              setCreateWorkOrderPayload({
                treeData: treeData,
                sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Empty",
                action: "Empty Device",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
                ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              })
            }
            setIsConfirmOpen(false);
            setConfirmMessage("");
          } else {
            axiosInterceptor({
              url: DC.EmptyStore,
              data: {
                storeId: defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: (emptyStoreApiResponse: unknown, status?: string) => {
                if (emptyStoreApiResponse !== undefined && status === "200") {
                  handleDeleteRefresh('self');
                  CreateLogForNode(LogName.Empty, defaultSelectedNodeInfo.node)
                }
                setIsConfirmOpen(false);
                setConfirmMessage("");
              }
            }, statusBarContext);
          }
        }
        else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.EmptyBin && defaultSelectedNodeInfo.node) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            if (treeData) {
              const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
              setWorkorderRecords(workOrderProfile);
              setShowSelectWorkorder(true);
              setCreateWorkOrderPayload({
                treeData: treeData,
                sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
                sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
                sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Empty",
                action: "Empty Device",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
                ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              })
            }
            setIsConfirmOpen(false);
            setConfirmMessage("");
          } else {
            axiosInterceptor({
              url: DC.EmptyBin,
              data: {
                binId: defaultSelectedNodeInfo.node.NodeEntID
              },
              setFetchData: (emptyStoreApiResponse: unknown, status?: string) => {
                if (emptyStoreApiResponse !== undefined && status === "200") {
                  handleDeleteRefresh('self');
                  CreateLogForNode(LogName.Empty, defaultSelectedNodeInfo.node)
                }
                setIsConfirmOpen(false);
                setConfirmMessage("");
              }
            }, statusBarContext);
          }
        }
        else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.DeleteAll && treeData && defaultSelectedNodeInfo.node.key) {
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);
            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
              sourceNodeName: defaultSelectedNodeInfo.node.Name ?? "",
              sourceNodeType: defaultSelectedNodeInfo.node.NodeType ?? "",
              EntityName: "WorkorderProfile",
              WorkorderType: "Delete",
              action: "Delete",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: defaultSelectedNodeInfo.node.NodeEntityname ?? "",
              ParentID: defaultSelectedNodeInfo.node.NodeEntID ?? "",
            })
            setIsConfirmOpen(false);
            setConfirmMessage("");
          } else {
            const parentNodes = FnFindNodeAndParents(treeData, defaultSelectedNodeInfo.node.key)
            if (!parentNodes?.length) {
              return;
            }
            const payload: Record<string, unknown> = {};
            for (let index = 0; index < parentNodes.length; index++) {
              const element = parentNodes[index];
              if (element.NodeType?.toLowerCase() === "bin") {
                payload["binID"] = element.NodeEntID;
              }
              else if (element.NodeType?.toLowerCase() === "manufacturer") {
                payload["manufacturer"] = element.Name
              }
              else if (element.NodeType?.toLowerCase() === "eqtype") {
                payload["eqtype"] = element.Name
              }
            }
            axiosInterceptor({
              url: DEVICE.DeleteAllChildren,
              data: payload,
              setFetchData: (emptyStoreApiResponse: unknown, status?: string) => {
                if (emptyStoreApiResponse !== undefined && status === "200") {
                  handleDeleteRefresh('parent');
                }
                setIsConfirmOpen(false);
                setConfirmMessage("");
              }
            }, statusBarContext);
          }
        }
        else if (selectedKebabMenu.Label === RightMouseMenuTreeNode.DisposeAll && treeData && defaultSelectedNodeInfo.node.NodeEntID) {
          const payload: Record<string, unknown> = {
            binId: defaultSelectedNodeInfo.node.NodeEntID,
            onlyDevices: true
          };
          axiosInterceptor({
            url: DC.DeleteBin,
            data: payload,
            setFetchData: (deleteBinApiResponse: unknown, status?: string) => {
              if (deleteBinApiResponse !== undefined && status === "200") {
                const payloadLog: IFnCreateForensiclog = {
                  GroupName: LogGroupName.ForensicLogTemplate,
                  SubGroupName: LogSubGroupName.KebabMenu,
                  LogName: LogName.DisposeAll,
                  logType: 'UserAction',
                  actionObject: {
                    Name: defaultSelectedNodeInfo.node.Name
                  },
                  _Forensiclog: LogSubGroupName.KebabMenu,
                  sessionContext: sessionContext,
                  statusBarContext: statusBarContext,
                  RefTableItems: mainAppContext.refTableRecords
                }
                FnCreateForensiclog(payloadLog)
                handleDeleteRefresh('self');
              }
              setIsConfirmOpen(false);
              setConfirmMessage("");
            }
          }, statusBarContext);
        }
        else if ((selectedKebabMenu.Label === RightMouseMenuTreeNode.ClearWatermark
          || selectedKebabMenu.Label === RightMouseMenuTreeNode.ClearWatermarkforSubnodes) && treeData && defaultSelectedNodeInfo.node.NodeEntID
        ) {
          const entIdsToClear: string[] = [defaultSelectedNodeInfo.node.NodeEntID];
          if (selectedKebabMenu.Label === RightMouseMenuTreeNode.ClearWatermarkforSubnodes && defaultSelectedNodeInfo.node.children.length) {

          }
          if (entIdsToClear.length) {
            const isCleared = await FnDeleteTableRecords("PG.Watermark", statusBarContext, entIdsToClear);
            if (!isCleared) {
              dcExplorerContainerProps.handleShowUserMessage?.(`Something went wrong in: ${selectedKebabMenu.Label}`)
            }
            else {
              setIsConfirmOpen(false);
              setConfirmMessage("");
            }
          }
        }
        else if ((selectedKebabMenu.Label === RightMouseMenuTreeNode.DeleteLocation)
          && treeData && defaultSelectedNodeInfo.node.NodeEntID
        ) {
          axiosInterceptor({
            url: DC.MoveDevicesToFloorAndDeleteLocation,
            data: {
              locationId: defaultSelectedNodeInfo.node.NodeEntID
            },
            setFetchData: (deleteLocationApiResponse: unknown, status?: string) => {
              if (deleteLocationApiResponse !== undefined && status === "200") {
                handleDeleteRefresh('parent');
              }
              setIsConfirmOpen(false);
              setConfirmMessage("");
            }
          }, statusBarContext);
        }
      }
    }
  }

  // Handles internal tree drag-and-drop for devices, slots, racks, and library items.
  const onDrop = async (info: ITreeDropInfo) => {
    activeDragFloorIdRef.current = null;
    const dropNodeInfo = info.node
    const dragNodeInfo = info.dragNode
    if (!canAcceptInternalDrop(dropNodeInfo, dragNodeInfo)) {
      return;
    }
    const drag: ISelectedNodeInfo = {
      node: dragNodeInfo, event: "select", selected: true,
      selectedNodes: []
    }
    setDragNodeInfo(drag)
    setDragNodeInfoForWO(dragNodeInfo)
    setDropNodeInfoForWO(dropNodeInfo)
    setIsInternalDropWO(true)

    const dropNodeType = dropNodeInfo?.NodeType?.toLowerCase();
    const dropTreeType = dropNodeInfo?.treetype?.toLowerCase();
    const isDropFloorOrLocation = dropNodeType === "floor" || dropNodeType === "location" || dropTreeType === "floor" || dropTreeType === "location";

    //move device to other node like floor and location
    if (dragNodeInfo.treetype === "Device" && dragNodeInfo?.NodeType !== "MountedDevice") {
      if (isDropFloorOrLocation
        || ((isInventoryFeature)
          && (dropNodeType === "bin" || dropTreeType === "bin"))) {
        if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
          if (treeData) {
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);
            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: optionalString(dragNodeInfo.NodeEntID),
              sourceNodeName: optionalString(dragNodeInfo.Name),
              sourceNodeType: dragNodeInfo.NodeType ?? "",
              EntityName: "WorkorderProfile",
              WorkorderType: "Move",
              action: "Move Device",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: optionalString(dragNodeInfo.NodeEntityname),
              ParentID: optionalString(dragNodeInfo.NodeEntID),
              RUPosition: undefined,
              destNodeEntityname: optionalString(dropNodeInfo.NodeEntityname),
              destNodeEntID: optionalString(dropNodeInfo.NodeEntID),
              networkPort: dragNodeInfo.HasNetworkPorts ?? 0,
              powerPort: dragNodeInfo.HasPowerPorts ?? 0
            })
          }
        } else {
          const handleMoveFloorDevices = async (resp: unknown, status?: string) => {
            if (status === "200") {
              defaultSelectedNodeInfo && CreateLogForNode(LogName.Move, defaultSelectedNodeInfo.node, optionalString(dropNodeInfo.NodeEntID))
              handleInternalDragDropRefresh(dragNodeInfo, dropNodeInfo);
            }
          }
          const payload = {
            entIDList: [dragNodeInfo.NodeEntID],
            parentEntID: dropNodeInfo.NodeEntID,
            parentNodeType: dropNodeInfo.NodeType,
          }
          axiosInterceptor({
            url: DEVICE.MoveFloorDevices,
            data: payload,
            setFetchData: handleMoveFloorDevices
          }, statusBarContext)
        }
      }
    }
    if ((dragNodeInfo?.NodeType == "Device" || dragNodeInfo?.NodeType === "MountedDevice" || dragNodeInfo?.treetype === "DeviceView")
      && dropNodeInfo.treetype === "DeviceSlot") {
      let dragNodePerent: ITreeNode[] = FnGetParentObjGivenTreeTypeTreeUsingDiv(dragNodeInfo, "DeviceSlot", true);
      let deviceNodePerent: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, dragNodeInfo, "Device");
      if (dragNodePerent.length > 0 && dragNodePerent[0].MountedDeviceViewEntID && dragNodeInfo.treetype === "DeviceView") {
        if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
          if (treeData) {
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);
            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: optionalString(dragNodeInfo.NodeEntID),
              sourceNodeName: optionalString(dragNodeInfo.Name),
              sourceNodeType: dragNodeInfo.NodeType ?? "",
              EntityName: "WorkorderProfile",
              WorkorderType: "Move",
              action: "Move Device Slot to Slot",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: deviceNodePerent?.NodeEntityname ?? "",
              ParentID: deviceNodePerent?.NodeEntID ?? '',
              RUPosition: undefined,
              destNodeEntityname: optionalString(dropNodeInfo.NodeEntityname),
              destNodeEntID: optionalString(dropNodeInfo.NodeEntID),
              extraSouceObj: {
                moduleDeviceViewID: dragNodePerent[0].MountedDeviceViewEntID,
                MountedDeviceEntID: dragNodeInfo.MountedDeviceID,
                MountedDeviceName: dragNodeInfo.Name,
                SlotID: dragNodePerent[0].NodeEntID
              },
              extraDestObj: {
                SlotID: dropNodeInfo.NodeEntID
              },
              networkPort: dragNodeInfo.HasNetworkPorts ?? 0,
              powerPort: dragNodeInfo.HasPowerPorts ?? 0
            })
          }
        } else {
          const handleMoveMountedDeviceToSlot = (resp: unknown, status?: string) => {
            if (status === "200") {
              defaultSelectedNodeInfo && CreateLogForNode(LogName.Move, defaultSelectedNodeInfo.node, optionalString(dropNodeInfo.NodeEntID))
              handleInternalDragDropRefresh(dragNodeInfo, dropNodeInfo);
            }
          }
          const payload = {
            moduleDeviceViewID: dragNodePerent[0].MountedDeviceViewEntID,
            newParentSlotID: dropNodeInfo.NodeEntID,
            newParentNodeType: dropNodeInfo.treetype,
          }
          axiosInterceptor({
            url: DEVICE.MoveMountedDeviceToSlot,
            data: payload,
            setFetchData: handleMoveMountedDeviceToSlot
          }, statusBarContext)
        }
      } else {
        const ShowConfigDialogBox = () => {
          setIsOpenLibFormDialog(true);
          setIsConfigureMounting(true);
          setDropNode(dropNodeInfo);
          setLibFormDialogTitle(
            "Configure the mounting parameters for your installation."
          );
        }
        const ShowMessage = (msg: string) => {
          setConfirmMessage(msg);
          setIsConfirmOpen(true);
          setShowOkButtonOnly(true);
        }
        const apiCallForAddDevice = async () => {
          const dragParentDevice = findDragParentDevice(dragNodeInfo, treeData);
          const { dragfrontView, dragRearView } = resolveDragDeviceViews(dragNodeInfo, dragParentDevice);

          const ParentDropObj = FnGetParentObjGivenTreeTypeTreeUsingDiv(dropNodeInfo, "Device", true);
          const deviceDrop = FnGetFilterDataUsingType(ParentDropObj, "Device")
            || (treeData && FnFindNearestNodeByType(treeData, dropNodeInfo, "Device"))
            || (treeData && FnFindNearestNodeByType(treeData, dropNodeInfo, "Rack"));
          const viewDrop = FnGetFilterDataUsingType(ParentDropObj, "DeviceView")
            || (treeData && FnFindNearestNodeByType(treeData, dropNodeInfo, "DeviceView"));

          const slotsNeeded = Number(
            getDevicePropertyValue((dragNodeInfo?.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
            getDevicePropertyValue((dragParentDevice?.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
            getSlotsNeededForMount(dragNodeInfo, dragParentDevice) ??
            (dragNodeInfo?.SlotsNeeded ? Number(dragNodeInfo.SlotsNeeded) : 0)
          );
          const moduleDeviceID = getModuleDeviceIdForMount(dragNodeInfo, dragParentDevice);

          const frontViewId = dragfrontView?.NodeEntID ?? dragfrontView?.DeviceViewEntId ?? null;
          const rearViewId = dragRearView?.NodeEntID ?? dragRearView?.DeviceViewEntId ?? null;

          let moduleViewID1: string | null = null;
          let moduleViewID2: string | null = null;
          let bothSides = false;

          if (frontViewId && rearViewId) {
            moduleViewID1 = frontViewId;
            moduleViewID2 = rearViewId;
            bothSides = true;
          } else if (isRearViewNode(dragNodeInfo)) {
            moduleViewID1 = rearViewId ?? frontViewId;
            moduleViewID2 = null;
            bothSides = false;
          } else {
            moduleViewID1 = frontViewId ?? rearViewId;
            moduleViewID2 = null;
            bothSides = false;
          }

          let sides = false
          if (mountInput === 'sides' && dragNodeInfoForWO) {
            sides = dragNodeInfoForWO.treetype === "View" ? false : (dragNodeInfoForWO.children?.length ?? 0) > 1
          }
          const payload: Record<string, unknown> = {
            parentDeviceID: deviceDrop?.NodeEntID,
            parentViewID1: viewDrop?.NodeEntID,
            parentSlotID1: dropNodeInfo.NodeEntID,
            moduleDeviceID: moduleDeviceID,
            moduleViewID1: moduleViewID1,
            moduleViewID2: moduleViewID2,
            slotsNeeded: slotsNeeded,
            mountAngle: 0,
            bothSides: bothSides,
            mountType: getMoveFloorToSlotMountType(dropNodeInfo, mountInput, slotsNeeded),
            mountLeft: true,
            internal: false,
          }
          if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
            let deviceNodePerent: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, dragNodeInfo, "Device");
            if (treeData) {
              const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
              setWorkorderRecords(workOrderProfile);
              setShowSelectWorkorder(true);
              setCreateWorkOrderPayload({
                treeData: treeData,
                sourceNodeEntID: optionalString(moduleDeviceID ?? dragNodeInfo.NodeEntID),
                sourceNodeName: optionalString(dragParentDevice?.Name ?? dragNodeInfo.Name),
                sourceNodeType: dragParentDevice?.NodeType ?? dragNodeInfo.NodeType ?? "",
                EntityName: "WorkorderProfile",
                WorkorderType: "Move",
                action: "Move Device Floor to Slot",
                SeqNo: 1,
                sessionContext: sessionContext,
                statusBarContext: statusBarContext,
                _WorkOrderProfile: undefined,
                ParentEntityName: deviceNodePerent?.NodeEntityname ?? "",
                ParentID: deviceNodePerent?.NodeEntID ?? '',
                RUPosition: undefined,
                destNodeEntityname: optionalString(dropNodeInfo.NodeEntityname),
                destNodeEntID: optionalString(dropNodeInfo.NodeEntID),
                extraSouceObj: {
                  moduleDeviceID: payload.moduleDeviceID,
                  moduleViewID1: payload.moduleViewID1,
                  moduleViewID2: payload.moduleViewID2,
                  slotsNeeded: payload.slotsNeeded,
                  mountAngle: 0,
                  mountType: (payload.mountType as string) ?? "RU",
                  bothSides: "True",
                  ...((payload.mountType as string) === "PM" ? { mountLeft: "True" } : {}),
                },
                extraDestObj: {
                  parentDeviceID: deviceDrop?.NodeEntID,
                  parentViewID1: viewDrop?.NodeEntID,
                  SlotID: dropNodeInfo.NodeEntID
                },
                networkPort: dragParentDevice?.HasNetworkPorts ?? dragNodeInfo.HasNetworkPorts ?? 0,
                powerPort: dragParentDevice?.HasPowerPorts ?? dragNodeInfo.HasPowerPorts ?? 0
              })
            }
          } else {
            const handleMoveFloorToSlot = async (resp: unknown, status?: string) => {
              if (status === "200" || (resp as any)?.success) {
                const newSlotID = extractNewSlotIdFromResponse(resp);
                defaultSelectedNodeInfo && CreateLogForNode(LogName.Move, defaultSelectedNodeInfo.node, optionalString(dropNodeInfo.NodeEntID));
                await handleRefreshTreeForDragAndDropById(
                  moduleDeviceID ?? dragParentDevice?.NodeEntID ?? dragNodeInfo.NodeEntID ?? dragNodeInfo.key,
                  dropNodeInfo.NodeEntID ?? dropNodeInfo.key,
                  newSlotID
                );
              }
            };
            axiosInterceptor({
              url: DEVICE.MoveFloorToSlot,
              data: payload,
              setFetchData: handleMoveFloorToSlot
            }, statusBarContext)
          }
        }
        const dragParentDeviceForCheck = findDragParentDevice(dragNodeInfo, treeData);
        const slotsNeeded = Number(
          getDevicePropertyValue((dragNodeInfo?.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
          getDevicePropertyValue((dragParentDeviceForCheck?.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
          getSlotsNeededForMount(dragNodeInfo, dragParentDeviceForCheck) ??
          (dragNodeInfo?.SlotsNeeded ? Number(dragNodeInfo.SlotsNeeded) : 0)
        );
        const isRackmountable = slotsNeeded > 0;

        const dropNodeTypeLower = safe(dropNodeInfo.NodeType);
        const dropTreeTypeLower = safe(dropNodeInfo.treetype);
        const dropNameLower = dropNodeInfo.Name?.toLowerCase() ?? "";

        const isDropToPole =
          dropNodeTypeLower === "pm" ||
          dropTreeTypeLower === "pm" ||
          dropNodeTypeLower === "polemount" ||
          dropTreeTypeLower === "polemount" ||
          dropNameLower.includes("pole");

        const isRU =
          dropNodeTypeLower === "ru" ||
          dropTreeTypeLower === "ru" ||
          dropNameLower.startsWith("ru#") ||
          dropNameLower === "ru";

        if (dropNodeInfo?.NodeType?.toLowerCase() === "inoutplug" && treeData) {
          const findParentsDevice = FnGetParentTreeInfoUsingDiv(dropNodeInfo, true);
          const findParent = findParentsDevice?.find((item) => item.NodeEntID === dropNodeInfo.parentEntID)
          if (findParent?.MountedDeviceID) {// if user tries to drop a device on an inout plug on any other device(like shelf) do not prompt angle
            apiCallForAddDevice();
            return;
          } else if (!isRackmountable) {    // if user tries to drop a device on an inout plug on Rack, prompt the angle
            setMountInput("angle")
            ShowConfigDialogBox()
            return;
          } else {
            apiCallForAddDevice();
            return;
          }
        } else if (isDropToPole && slotsNeeded === 0) {
          setMountInput("angle");
          ShowConfigDialogBox();
          return;
        } else {
          const isDropOnRUZiro = dropNodeInfo.Name?.toLowerCase() == 'ru#0' && (dragNodeInfo.Name?.toLowerCase().includes('front')
            || dragNodeInfo.Name?.toLowerCase().includes('rear'))
          const DropOnAnyRU = (!dragNodeInfo.Name?.toLowerCase().includes('front') || !dragNodeInfo.Name?.toLowerCase().includes('rear'))
          if (dropNodeInfo.Name?.toLowerCase() == 'ru#0') {
            if (isDropOnRUZiro) {
              setMountInput("angle")
              ShowConfigDialogBox()
            } else {
              // RU0 means top of rack
              // zero - ru mounting is on side poles of the rack on any RU
              // user must drag only F / R device view not a device
              ShowMessage("This device not allowed to Drop in RU#0.");
            }
          } else if (DropOnAnyRU || isRU) {
            // If dragging a device with slotsneeded=0 to RU, prompt left/right and angle ("pole")
            // If slotsneeded > 0 to RU, prompt both sides ("sides")
            if (slotsNeeded === 0) {
              setMountInput("pole");
            } else {
              setMountInput("sides");
            }
            ShowConfigDialogBox();
          } else {
            await apiCallForAddDevice();
          }
        }
      }
    }
    if ((dragNodeInfo?.NodeType === "MountedDevice" || dragNodeInfo.MountedDeviceID) && isDropFloorOrLocation) {
      if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
        let deviceNodePerent: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, dragNodeInfo, "Device");
        if (treeData) {
          const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
          setWorkorderRecords(workOrderProfile);
          setShowSelectWorkorder(true);
          setCreateWorkOrderPayload({
            treeData: treeData,
            sourceNodeEntID: optionalString(dragNodeInfo.NodeEntID),
            sourceNodeName: optionalString(dragNodeInfo.Name),
            sourceNodeType: dragNodeInfo.NodeType ?? "",
            EntityName: "WorkorderProfile",
            WorkorderType: "Move",
            action: "Move Device to Floor",
            SeqNo: 1,
            sessionContext: sessionContext,
            statusBarContext: statusBarContext,
            _WorkOrderProfile: undefined,
            ParentEntityName: deviceNodePerent?.NodeEntityname ?? "",
            ParentID: deviceNodePerent?.NodeEntID ?? '',
            RUPosition: undefined,
            destNodeEntityname: optionalString(dropNodeInfo.NodeEntityname),
            destNodeEntID: optionalString(dropNodeInfo.NodeEntID),
            networkPort: dragNodeInfo.HasNetworkPorts ?? 0,
            powerPort: dragNodeInfo.HasPowerPorts ?? 0,
            extraSouceObj: {
              MountedDeviceID: dragNodeInfo.MountedDeviceID
            }
          })
        }
      } else {
        const handleUnmount = (resp: unknown, status?: string) => {
          if (status === "200") {
            defaultSelectedNodeInfo && CreateLogForNode(LogName.Move, defaultSelectedNodeInfo.node, optionalString(dropNodeInfo.NodeEntID))
            handleInternalDragDropRefresh(dragNodeInfo, dropNodeInfo);
          }
        }
        axiosInterceptor({
          url: DEVICE.Unmount,
          data: { entID: dragNodeInfo.NodeEntID },
          setFetchData: handleUnmount
        }, statusBarContext)
      }
    }
  }

  const canAcceptExternalDrop = (targetNode: ITreeNode): boolean => {

    const type = targetNode?.Type?.trim().toLowerCase() || "";
    const nodeType = targetNode?.NodeType?.trim().toLowerCase() || "";
    const treeType = targetNode?.treetype?.trim().toLowerCase() || "";
    // ---- Inventory Feature Logic ----
    if (isInventoryFeature) {
      const basicTypes = ["new", "other"];
      const cableTypes = ["network cables", "power cables"];
      const configNodeTypes = ["ru", "slot", "inoutplug", "pm"];
      const isBasicDropType =
        basicTypes.includes(type) ||
        nodeType === "bin" ||
        treeType === "bin" ||
        basicTypes.includes(targetNode?.Name?.trim().toLowerCase() || "");
      const isCableDrop = cableTypes.includes(type);
      const isConfigSpecificDrop =
        featureId === FEnums.InventoryConfiguration &&
        configNodeTypes.includes(nodeType);
      return isBasicDropType || isCableDrop || isConfigSpecificDrop;
    }
    // ---- Other Features Logic ----
    const allowedNodeTypes = ["ru", "slot", "inoutplug", "pm", "floor", "location"];
    return (
      allowedNodeTypes.includes(nodeType) ||
      allowedNodeTypes.includes(treeType) ||
      targetNode?.Name?.toLowerCase().startsWith("ru#") ||
      false
    );
  };

  // Builds a fast lookup map from node key/NodeEntID to its enclosing floor ID.
  const nodeToFloorMap = useMemo(() => {
    const map = new Map<string, string>();

    const isFloor = (n?: ITreeNode | null): boolean => {
      if (!n) return false;
      const nt = (n.NodeType ?? "").toLowerCase();
      const tt = (n.treetype ?? "").toLowerCase();
      const entity = (n.NodeEntityname ?? "").toLowerCase();
      return nt === "floor" || tt === "floor" || entity === "floor";
    };

    const traverse = (nodes: ITreeNode[], currentFloorId: string | null) => {
      if (!nodes || !Array.isArray(nodes)) return;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;
        let floorId = currentFloorId;
        if (isFloor(node)) {
          floorId = String(node.NodeEntID || node.key);
        }
        if (floorId) {
          if (node.key != null) {
            map.set(String(node.key), floorId);
            map.set(String(node.key).toLowerCase(), floorId);
          }
          if (node.NodeEntID != null) {
            map.set(String(node.NodeEntID), floorId);
            map.set(String(node.NodeEntID).toLowerCase(), floorId);
          }
        }
        if (node.children && Array.isArray(node.children) && node.children.length > 0) {
          traverse(node.children, floorId);
        }
      }
    };

    if (originalTreeDataRef.current && originalTreeDataRef.current.length > 0) {
      traverse(originalTreeDataRef.current, null);
    }
    if (dcExplorerContainerProps.originalTreeData && dcExplorerContainerProps.originalTreeData.length > 0) {
      traverse(dcExplorerContainerProps.originalTreeData, null);
    }
    if (treeData && treeData.length > 0) {
      traverse(treeData, null);
    }
    return map;
  }, [treeData, dcExplorerContainerProps.originalTreeData]);

  const isFloorNode = useCallback((n?: ITreeNode | null): boolean => {
    if (!n) return false;
    const nt = (n.NodeType ?? "").toLowerCase();
    const tt = (n.treetype ?? "").toLowerCase();
    const entity = (n.NodeEntityname ?? "").toLowerCase();
    return nt === "floor" || tt === "floor" || entity === "floor";
  }, []);

  const getFloorIdForNode = useCallback((node: ITreeNode | undefined | null): string | null => {
    if (!node) return null;
    const key = node.key != null ? String(node.key) : "";
    const entId = node.NodeEntID != null ? String(node.NodeEntID) : "";

    if (key) {
      if (nodeToFloorMap.has(key)) return nodeToFloorMap.get(key)!;
      if (nodeToFloorMap.has(key.toLowerCase())) return nodeToFloorMap.get(key.toLowerCase())!;
    }
    if (entId) {
      if (nodeToFloorMap.has(entId)) return nodeToFloorMap.get(entId)!;
      if (nodeToFloorMap.has(entId.toLowerCase())) return nodeToFloorMap.get(entId.toLowerCase())!;
    }

    if (isFloorNode(node)) {
      const fid = entId || key;
      if (key) nodeToFloorMap.set(key, fid);
      if (entId) nodeToFloorMap.set(entId, fid);
      return fid;
    }

    // Fallback: search parents using FnFindNodeAndParents which traverses children from roots
    const searchTrees = [treeData, originalTreeDataRef.current, dcExplorerContainerProps.originalTreeData];
    const searchKeys = [key, entId].filter(Boolean);

    for (const tree of searchTrees) {
      if (!tree || tree.length === 0) continue;
      for (const k of searchKeys) {
        const path = FnFindNodeAndParents(tree, k);
        if (path && path.length > 0) {
          const floorNode = path.find(p => isFloorNode(p));
          if (floorNode) {
            const fid = String(floorNode.NodeEntID || floorNode.key);
            if (key) nodeToFloorMap.set(key, fid);
            if (entId) nodeToFloorMap.set(entId, fid);
            return fid;
          }
        }
      }
    }

    if (treeData && treeData.length > 0) {
      const floorNode = FnFindNearestNodeByType(treeData, node, "Floor");
      if (floorNode) {
        const fid = String(floorNode.NodeEntID || floorNode.key);
        if (key) nodeToFloorMap.set(key, fid);
        if (entId) nodeToFloorMap.set(entId, fid);
        return fid;
      }
    }

    return null;
  }, [nodeToFloorMap, treeData, dcExplorerContainerProps.originalTreeData, isFloorNode]);

  const canAcceptInternalDrop = (targetNode: ITreeNode, sourceNode?: ITreeNode): boolean => {
    if (dcExplorerContainerProps.featureId === FEnums.EditFloorLayout) {
      return false;
    }

    if (!targetNode) return false;

    // Cannot drop onto itself
    if (sourceNode && (targetNode.key === sourceNode.key || (targetNode.NodeEntID && targetNode.NodeEntID === sourceNode.NodeEntID))) {
      return false;
    }

    const nodeType = targetNode?.NodeType?.trim().toLowerCase() || "";
    const treeType = targetNode?.treetype?.trim().toLowerCase() || "";
    const nodeName = targetNode?.Name?.trim().toLowerCase() || "";

    const isFloor = nodeType === "floor" || treeType === "floor";
    const isLocation = nodeType === "location" || treeType === "location";
    const isRU = nodeType === "ru" || treeType === "ru" || nodeName.startsWith("ru#") || nodeName === "ru";
    const isSlot = nodeType === "slot" || treeType === "slot" || treeType === "deviceslot" || nodeType === "inoutplug" || nodeType === "pm";
    const isBin = isInventoryFeature && (nodeType === "bin" || treeType === "bin");

    if (!(isFloor || isLocation || isRU || isSlot || isBin)) {
      return false;
    }

    // In Rack and Stack (Move Add Change, Configure Device), do not allow dropping outside the current floor.
    const isRackAndStackFeature =
      dcExplorerContainerProps.featureId === FEnums.MoveAddChange ||
      dcExplorerContainerProps.featureId === FEnums.ConfigureDevice;

    if (isRackAndStackFeature && sourceNode && targetNode) {
      const sourceFloorId = activeDragFloorIdRef.current || getFloorIdForNode(sourceNode);
      const targetFloorId = getFloorIdForNode(targetNode);
      // If both floor IDs are resolved and they are different, block the drop
      if (sourceFloorId && targetFloorId && sourceFloorId === targetFloorId) {
        return true;
      }
      else return false;
    }
    else {
      return true;
    }
  };

  const getDevicePropertyValue = (
    data: Record<string, unknown>[],
    propertyLabel: string
  ): string | undefined => {
    const device = data.find(
      (item) => item.TableLabel === "_Device"
    );
    if (!device?.Properties || typeof device.Properties !== "string") return undefined;
    try {
      const properties = FnParseJsonSafely(device.Properties) as IDevicePropertyItem[];
      const property = properties.find(
        (item) => item.PropertyLabel === propertyLabel
      );
      return property?.PropertyValue;
    } catch (error) {
      console.error("Failed to parse device properties:", error);
      return undefined;
    }
  };
  const fnAddDeviceFromLibToSlot = async (dropDetails: ITreeNode) => {
    const dragNode = dragItem ?? dragNodeInfo;
    const drop = dropDetails ?? dropNode;
    if (dragNode && drop) {
      if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
        if (treeData) {
          const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext)
          setWorkorderRecords(workOrderProfile);
          setShowSelectWorkorder(true);
          setCreateWorkOrderPayload({
            treeData: treeData,
            sourceNodeEntID: dragItem?.node.NodeEntID ?? "",
            sourceNodeName: dragItem?.node.Name ?? "",
            sourceNodeType: dragItem?.node.NodeType ?? "",
            EntityName: "WorkorderProfile",
            WorkorderType: "Add",
            action: "Add Device",
            SeqNo: 1,
            sessionContext: sessionContext,
            statusBarContext: statusBarContext,
            _WorkOrderProfile: undefined,
            ParentEntityName: dragItem?.node.NodeEntityname ?? "",
            ParentID: dragItem?.node.NodeEntID ?? "",
            RUPosition: undefined,
            destNodeEntityname: drop?.NodeEntityname ?? "",
            destNodeEntID: drop?.NodeEntID ?? "",
            EQID: dragItem?.node.EQID?.toString() ?? "",
            sourceTreeData: dragItem?.sourceTreeData
          })
        }
      } else {
        let payloadRU: Record<string, unknown> = {};
        let ParentObj = FnGetParentTreeInfoUsingDiv(drop, true);
        const dragSourceTreeData = getDragSourceTreeData(dragNode) ?? treeData;
        const dragParentEntId = toTreeKey(dragNode.node.parentEntID);
        if (drop?.NodeType == "Floor" || drop?.treetype == "Floor" && dragNode) {
          let eqid = dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID;
          let name = dragNode.node.Name;
          if (dragNode.node.ParentEQID && dragSourceTreeData && dragParentEntId) {
            let parentNodeData = FnGetNodeDetailsBaseOnKey(dragSourceTreeData, dragParentEntId);
            name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
          }
          payloadRU = {
            eqid: eqid,
            deviceName: name,
            floor: drop.Name,
            location: ""
          };
        } else if (drop?.NodeType == "Location" || drop?.treetype == "Location" && dragNode.node) {
          let eqid = dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID;
          let name = dragNode.node.Name;
          if (dragNode.node.ParentEQID && dragSourceTreeData && dragParentEntId) {
            let parentNodeData = FnGetNodeDetailsBaseOnKey(dragSourceTreeData, dragParentEntId);
            name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
          }
          payloadRU = {
            eqid: eqid,
            deviceName: name,
            location: drop.Name
          };
        }
        for (let index = 0; index < ParentObj.length; index++) {
          const element = ParentObj[index];
          if (dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration || dcExplorerContainerProps.featureId === FEnums.InventoryManagement) {
            let keyType = element.treetype?.toLowerCase();
            payloadRU = { ...payloadRU, [keyType]: element.Name?.trim() ?? "" };
          }
          else {
            let keyType = element.NodeType?.toLowerCase();
            if (FnProcessStringToCompare(element.treetype, "Device")) {
              keyType = "device";
            }
            else if (FnProcessStringToCompare(element.treetype, "DeviceView")) {
              keyType = "deviceView";
            }
            if (keyType)
              payloadRU = { ...payloadRU, [keyType]: element.Name?.trim() ?? "" };
          }
        }
        let eqid = dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID;
        let name = dragNode.node.Name;
        let mountview = "F";
        if (dragNode.node.ParentEQID && dragSourceTreeData && dragParentEntId) {
          let parentNodeData = FnGetNodeDetailsBaseOnKey(dragSourceTreeData, dragParentEntId);
          name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
          mountview = dragNode.node.Name ? dragNode.node.Name?.toLowerCase().includes("front") ? "F" : "R" : "F";
        }
        let slotIndex = drop.Name && drop.Name.split("#")[1] ? drop.Name.split("#")[1] : 0;

        let sides = false
        if (mountInput === 'sides' && dragNodeInfoForWO) {
          sides = dragNode.node.treetype === "View" ? false : (dragNode.node?.children?.length ?? 0) > 1
        }

        const payloadFinalRU = {
          mountedEQID: eqid,
          mountedDeviceName: name,
          site: payloadRU.site,
          room: payloadRU.room,
          floor: payloadRU.floor,
          location: payloadRU.location,
          device: payloadRU.device,
          deviceView: recordString(payloadRU.deviceView).toLowerCase() === "front" ? "F" : "R",
          mountedView: mountview,
          slotMountType: drop?.NodeType,
          slotIndex: slotIndex,
          bothSides: sides,
          mountType: drop?.NodeType,
          mountAngle: 0,
          mountLeft: false
        }
        const handleAddMounteddeviceFromLibrary = (resp: unknown, status?: string) => {
          setIsOpenLibFormDialog(false);
          setIsConfigureMounting(false);
          setDropNode(null);
          setLibFormDialogTitle(
            ""
          );
          if (status === "200") {
            handleUpdateStatic()
            drop.NodeEntID && dragItem && CreateLogForNode(LogName.AddDevice, dragNode.node, optionalString(drop.NodeEntID), dragItem.subSource, LogSubGroupName.DeviceModel)
            handleRefreshTreeForDragAndDropById((dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID) ?? "", drop.NodeEntID ?? "");
          }
        }
        axiosInterceptor({
          url: DEVICE.AddMounteddeviceFromLibrary,
          data: payloadFinalRU,
          allowShowLoader: true,
          setFetchData: handleAddMounteddeviceFromLibrary
        }, statusBarContext)
      }
    }
  }

  // Handles drag-and-drop from the device model library onto explorer nodes.
  const handleExternalDrop = async (
    event: React.DragEvent<HTMLSpanElement>,
    targetNode: ITreeNode
  ): Promise<void> => {
    const showMessage = (msg: string) => {
      dcExplorerContainerProps.handleShowUserMessage?.(msg);
    }
    const safe = (val?: string) => val?.trim().toLowerCase() || "";
    if (dragItem?.source !== "devicemodel") {
      showMessage(`Drag action is not allowed from ${dragItem?.source ?? "this source"}.`);
      return;
    }
    const dragNode: ITreeNode = dragItem?.node;
    const drop: ITreeNode = targetNode;
    setDropNodeInfoForWO(drop)
    setDragNodeInfoForWO(dragNode)
    setIsInternalDropWO(false)
    const slotsNeeded = getDevicePropertyValue((dragItem.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded");
    const FnCheckDragNodeisRackmountable = (dragNode: ITreeNode, slotsNeeded: number): boolean => {
      return slotsNeeded > 0 && dragNode.NodeEntityname !== "Rack" ? true : false;
    }
    // ================= LIBRARY DROP =================
    if (
      dragItem?.subSource === DeviceModelFEnums.NetZoomDeviceLibrary ||
      dragItem?.subSource === DeviceModelFEnums.NetZoomCableLibrary
    ) {
      const nodeType = safe(drop?.NodeType);
      const treeType = safe(drop?.treetype);
      const ShowConfigDialogBox = () => {
        setIsOpenLibFormDialog(true);
        setIsConfigureMounting(true);
        setDropNode(drop);
        setLibFormDialogTitle(
          "Configure the mounting parameters for your installation."
        );
      }
      const ShowMessage = (msg: string) => {
        setConfirmMessage(msg);
        setIsConfirmOpen(true);
        setShowOkButtonOnly(true);
      }
      if (nodeType.toLowerCase() === "ru" || treeType.toLowerCase() === "slot" || nodeType.toLowerCase() === "inoutplug" || nodeType.toLowerCase() === "pm") {
        const apiCallForAddDevice = async () => {
          let payloadRU: Record<string, unknown> = {};
          let ParentObj = FnGetParentTreeInfoUsingDiv(drop, true);
          for (let index = 0; index < ParentObj.length; index++) {
            const element = ParentObj[index];
            if (dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration || dcExplorerContainerProps.featureId === FEnums.InventoryManagement) {
              let keyType = element.treetype?.toLowerCase();
              payloadRU = { ...payloadRU, [keyType]: element.Name?.trim() };
            }
            else {
              let keyType = element.NodeType?.toLowerCase();
              if (FnProcessStringToCompare(element.treetype, "Device")) {
                keyType = "device";
              }
              else if (FnProcessStringToCompare(element.treetype, "DeviceView")) {
                keyType = "deviceView";
              }
              if (keyType)
                payloadRU = { ...payloadRU, [keyType]: element.Name?.trim() ?? "" };
            }
          }
          let eqid = dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID;
          let name = dragItem.node.Name;
          let mountview = "F";
          if (dragItem.node.ParentEQID && dragItem.sourceTreeData && dragItem.node.parentEntID) {
            let parentNodeData = FnGetNodeDetailsBaseOnKey(dragItem.sourceTreeData, dragItem.node.parentEntID);
            name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
            mountview = dragItem.node.Name ? dragItem.node.Name?.toLowerCase().includes("front") ? "F" : "R" : "F";
          }
          let slotIndex = drop.Name && drop.Name.split("#")[1] ? drop.Name.split("#")[1] : 0;
          const payloadFinalRU = {
            mountedEQID: eqid,
            mountedDeviceName: name,
            site: payloadRU.site,
            room: payloadRU.room,
            floor: payloadRU.floor,
            location: payloadRU.location,
            device: payloadRU.device,
            deviceView: recordString(payloadRU.deviceView).toLowerCase() === "front" ? "F" : "R",
            mountedView: mountview,
            slotMountType: drop?.NodeType,
            slotIndex: slotIndex,
            bothSides: dragItem.node.treetype === "View" ? false : (dragItem.node?.children?.length ?? 0) > 1,
            mountType: drop?.NodeType,
            mountAngle: 0,
            mountleft: true
          }
          const handleAddMounteddeviceFromLibrary = (resp: unknown, status?: string) => {
            if (status === "200") {
              drop.NodeEntID && CreateLogForNode(LogName.AddDevice, dragItem.node, optionalString(drop.NodeEntID), dragItem.subSource, LogSubGroupName.DeviceModel)
              handleUpdateStatic()
              handleRefreshTreeForDragAndDropById((dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID) ?? "", drop.NodeEntID ?? "");
            }
          }
          axiosInterceptor({
            url: DEVICE.AddMounteddeviceFromLibrary,
            data: payloadFinalRU,
            allowShowLoader: true,
            setFetchData: handleAddMounteddeviceFromLibrary
          }, statusBarContext)
        }
        const isRackmountable = FnCheckDragNodeisRackmountable(dragNode, Number(slotsNeeded));
        // if dragged item is not rackmountable
        if (nodeType.toLowerCase() === "inoutplug" && treeData) {
          const findParentsDevice = FnGetParentTreeInfoUsingDiv(drop, true);
          const findParent = findParentsDevice.find((item) => item.NodeEntID === drop.parentEntID)
          if (findParent?.MountedDeviceID) {// if user tries to drop a device on an inout plug on any other device(like shelf) do not prompt angle
            apiCallForAddDevice();
            return;
          } else if (!isRackmountable) {    // if user tries to drop a device on an inout plug on Rack, prompt the angle
            setMountInput("angle")
            ShowConfigDialogBox()
            return;
          } else {
            apiCallForAddDevice();
            return;
          }
        }
        const isDropOnRUZiro = drop.Name?.toLowerCase() == 'ru#0' && (dragNode.Name?.toLowerCase().includes('front')
          || dragNode.Name?.toLowerCase().includes('rear'))
        const DropOnAnyRU = (!dragNode.Name?.toLowerCase().includes('front') || !dragNode.Name?.toLowerCase().includes('rear'))
        if (drop.Name?.toLowerCase() == 'ru#0') {
          if (isDropOnRUZiro) {
            setMountInput("angle")
            ShowConfigDialogBox()
          } else {
            // RU0 means top of rack
            // zero - ru mounting is on side poles of the rack on any RU
            // user must drag only F / R device view not a device
            ShowMessage("This device not allowed to Drop in RU#0.");
          }
        } else if (DropOnAnyRU) {
          // if dragged device is for rackmountable device, allow drop in any available RU and
          // prompt for one / two sided mounted
          setMountInput(isRackmountable ? "sides" : "pole")
          ShowConfigDialogBox()
        } else {
          apiCallForAddDevice();
        }
      } else {
        if (drop.treetype.toLowerCase() === "deviceslot") {
          // If a device is dragged from the Device Library and dropped into a Device Slot, the device should be added directly to the slot without prompting the user to select a side.
          fnAddDeviceFromLibToSlot(drop)
        } else {
          setIsOpenLibFormDialog(true);
          setDropNode(drop);
          setLibFormDialogTitle("How many instances ?");
        }
      }
      return;
    }

    // ================= DRAG TYPE VALIDATION =================
    const isViewDrag =
      ["productnumber", "product", "view", "views"].includes(safe(dragNode?.treetype)) ||
      ["f", "r", "front", "rear", "frontview", "rearview"].includes(safe(dragNode?.NodeType)) ||
      isFrontViewNode(dragNode) ||
      isRearViewNode(dragNode);

    if (!dragNode || !isViewDrag) {
      showMessage("Only product, view, or product number can be dragged.");
      return;
    }
    const featureId = dcExplorerContainerProps.featureId;
    const isInventoryFeature =
      featureId === FEnums.InventoryConfiguration ||
      featureId === FEnums.InventoryManagement ||
      featureId === FEnums.InventoryCollection;
    const dropType = safe(drop?.Type ?? "");
    const dropNodeType = safe(drop?.NodeType);
    const dropTreeType = safe(drop?.treetype);
    const eqType = safe(dragNode?.EQType);
    // ================= CONDITIONS =================
    const isBasicDropType =
      ["new", "other"].includes(dropType) ||
      ["bin"].includes(dropNodeType) ||
      ["bin"].includes(dropTreeType) ||
      ["new", "other"].includes(safe(drop?.Name ?? undefined));
    const isCableDrop =
      ["network cables", "power cables"].includes(dropType) &&
      eqType === "cable";
    const isConfigSpecificDrop =
      featureId === FEnums.InventoryConfiguration &&
      ["ru", "slot"].includes(dropNodeType);
    const allowedTypes = ["ru", "slot", "deviceslot", "inoutplug", "pm", "floor", "location", "raisedfloor", "room"];
    const isAllowedNonInventory =
      allowedTypes.includes(dropNodeType) ||
      allowedTypes.includes(dropTreeType) ||
      drop?.Name?.toLowerCase().startsWith("ru#");
    const isValidDrop =
      (isInventoryFeature &&
        (isBasicDropType || isCableDrop || isConfigSpecificDrop)) ||
      (!isInventoryFeature && isAllowedNonInventory);
    if (!isValidDrop) {
      showMessage("This item cannot be dropped on the selected target.");
      return;
    }
    // ================= MAIN LOGIC =================
    if (
      dragItem.subSource === DeviceModelFEnums.Inventory &&
      drop &&
      drop.NodeType &&
      drop.NodeEntID &&
      dragItem.node &&
      dragItem.node.NodeEntID
    ) {
      if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
        if (treeData) {
          const dropNodeType = safe(drop.NodeType);
          const dropTreeType = safe(drop.treetype);
          const dropName = drop.Name?.toLowerCase() ?? "";

          const isRU =
            dropNodeType === "ru" ||
            dropTreeType === "ru" ||
            dropName.startsWith("ru#") ||
            dropName === "ru";

          const isPoleMount =
            dropNodeType === "pm" ||
            dropTreeType === "pm" ||
            dropNodeType === "polemount" ||
            dropTreeType === "polemount" ||
            dropName.includes("pole");

          const isInOut =
            dropNodeType === "inoutplug" ||
            dropTreeType === "inoutplug" ||
            dropNodeType === "inout" ||
            dropTreeType === "inout" ||
            dropNodeType === "inpoutplug" ||
            dropName.includes("inout");

          const isSlotOrRU =
            isRU ||
            isPoleMount ||
            isInOut ||
            ["slot", "deviceslot"].includes(dropNodeType) ||
            ["slot", "deviceslot"].includes(dropTreeType);

          const invDetails = dragItem.inventoryDeviceDetails ?? inventoryDeviceDetails;
          const dragParentDevice = findDragParentDevice(dragItem.node, dragItem.sourceTreeData);
          const slotsNeeded = Number(
            invDetails?.slotsNeeded ??
            getDevicePropertyValue((dragItem.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
            getSlotsNeededForMount(dragItem.node, dragParentDevice) ??
            (dragItem.node?.SlotsNeeded ? Number(dragItem.node.SlotsNeeded) : 0)
          );

          if (isSlotOrRU) {
            let promptType: "sides" | "pole" | "angle" | null = null;
            if (isRU && slotsNeeded > 0) {
              // Rule 1: If dragging a device with slotsneeded >0 to RU, prompt both sides.
              promptType = "sides";
            } else if (isRU && slotsNeeded === 0) {
              // Rule 2: If dragging a device with slotsneeded =0 to RU, prompt left/right and angle.
              promptType = "pole";
            } else if (isPoleMount && slotsNeeded === 0) {
              // Rule 3: If dragging a device with slotsneeded =0 to polemount slot, prompt angle.
              promptType = "angle";
            } else if (isInOut) {
              // Rule 4: If dragging any device to Inout, prompt angle.
              promptType = "angle";
            }

            if (promptType) {
              setMountInput(promptType);
              setIsConfigureMounting(true);
              setIsOpenLibFormDialog(true);
              setDropNode(drop);
              setLibFormDialogTitle(
                "Configure the mounting parameters for your installation."
              );
              return;
            }

            // Unprompted slot drop in Managed site
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext);
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);

            // When rack mounting a device from Inventory, use Move Device Floor to Slot logic for workorder
            const ParentDropObj = FnGetParentObjGivenTreeTypeTreeUsingDiv(drop, "Device", true);
            const deviceDrop = FnGetFilterDataUsingType(ParentDropObj, "Device");
            const viewDrop = FnGetFilterDataUsingType(ParentDropObj, "DeviceView");

            let dragfrontView: ITreeNode | null = null;
            let dragRearView: ITreeNode | null = null;

            if (dragItem.node.NodeType === "Product") {
              const dragNodeView = dragItem.node.children;
              dragfrontView = treeNodeOrNull(FnGetFilterDataUsingType(dragNodeView, "Front"));
              dragRearView = treeNodeOrNull(FnGetFilterDataUsingType(dragNodeView, "Rear"));
            } else {
              dragfrontView =
                dragItem.node.NodeType === "F" || dragItem.node.NodeType === "FrontView"
                  ? dragItem.node
                  : null;
              dragRearView =
                dragItem.node.NodeType === "R" || dragItem.node.NodeType === "RearView"
                  ? dragItem.node
                  : null;
            }

            const moduleDeviceID =
              resolveDeviceGuid(
                invDetails?.moduleDeviceID,
                dragItem.node.DeviceEntId,
                dragParentDevice?.DeviceEntId,
                dragParentDevice?.NodeEntID,
                dragItem.node.parentEntID,
                dragItem.node.NodeEntID
              ) || dragItem.node.NodeEntID;

            const moduleViewID1 =
              invDetails?.moduleViewID1 ||
              dragfrontView?.DeviceViewEntId ||
              dragfrontView?.NodeEntID ||
              null;

            const moduleViewID2 =
              invDetails?.moduleViewID2 ||
              dragRearView?.DeviceViewEntId ||
              dragRearView?.NodeEntID ||
              null;

            const deviceName =
              invDetails?.deviceName ||
              (dragItem.node.NodeType === "Product"
                ? dragItem.node.Name
                : dragParentDevice?.Name ?? dragItem.node.Name);

            const sourceNodePath =
              invDetails?.sourcePath ||
              dragParentDevice?.NodePath ||
              dragItem.node.NodePath;

            let resolvedMountType = "RU";
            if (isRU) {
              resolvedMountType = slotsNeeded > 0 ? "RU" : "PM";
            } else if (isPoleMount) {
              resolvedMountType = "PM";
            } else if (isInOut) {
              resolvedMountType = "InOut";
            }

            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: optionalString(moduleDeviceID),
              sourceNodeName: optionalString(deviceName),
              sourceNodePath: optionalString(sourceNodePath),
              sourceNodeType: "Device",
              EntityName: "WorkorderProfile",
              WorkorderType: "Move",
              action: "Move Device Floor to Slot",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: optionalString(dragParentDevice?.NodeEntityname ?? dragItem.node.NodeEntityname),
              ParentID: optionalString(moduleDeviceID),
              RUPosition: undefined,
              destNodeEntityname: optionalString(drop.NodeEntityname),
              destNodeEntID: optionalString(drop.NodeEntID),
              extraSouceObj: {
                moduleDeviceID: moduleDeviceID,
                moduleViewID1: moduleViewID1,
                moduleViewID2: moduleViewID2,
                slotsNeeded: slotsNeeded,
                mountAngle: 0,
                mountType: resolvedMountType,
                bothSides: "True",
                ...(resolvedMountType === "PM" ? { mountLeft: "True" } : {}),
              },
              extraDestObj: {
                parentDeviceID: deviceDrop?.NodeEntID,
                parentViewID1: viewDrop?.NodeEntID,
                SlotID: drop.NodeEntID,
              },
              networkPort: invDetails?.networkPort ?? dragItem.node.HasNetworkPorts ?? 0,
              powerPort: invDetails?.powerPort ?? dragItem.node.HasPowerPorts ?? 0,
              EQID: invDetails?.EQID ?? dragItem.node.EQID?.toString() ?? "",
              sourceTreeData: dragItem.sourceTreeData,
              isFloorDevice: true,
            });
          } else {
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext);
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);
            // When adding a floor device from Inventory, use Move Device logic for workorder
            const dragParentDevice = findDragParentDevice(dragItem.node, dragItem.sourceTreeData);

            const deviceEntId =
              resolveDeviceGuid(
                invDetails?.moduleDeviceID,
                dragItem.node.DeviceEntId,
                dragParentDevice?.DeviceEntId,
                dragParentDevice?.NodeEntID,
                dragItem.node.parentEntID,
                dragItem.node.NodeEntID
              ) || dragItem.node.NodeEntID;

            const deviceName =
              invDetails?.deviceName ||
              (dragItem.node.NodeType === "Product"
                ? dragItem.node.Name
                : dragParentDevice?.Name ?? dragItem.node.Name);

            const sourceNodePath =
              invDetails?.sourcePath ||
              dragParentDevice?.NodePath ||
              dragItem.node.NodePath;

            const slotsNeeded =
              invDetails?.slotsNeeded ??
              (dragItem.node?.SlotsNeeded ? Number(dragItem.node.SlotsNeeded) : 0);

            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: optionalString(deviceEntId),
              sourceNodeName: optionalString(deviceName),
              sourceNodePath: optionalString(sourceNodePath),
              sourceNodeType: "Device",
              EntityName: "WorkorderProfile",
              WorkorderType: "Move",
              action: "Move Device",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: optionalString(dragParentDevice?.NodeEntityname ?? dragItem.node.NodeEntityname),
              ParentID: optionalString(deviceEntId),
              RUPosition: undefined,
              destNodeEntityname: optionalString(drop.NodeEntityname),
              destNodeEntID: optionalString(drop.NodeEntID),
              extraSouceObj: {
                moduleDeviceID: deviceEntId,
                slotsNeeded: slotsNeeded,
              },
              networkPort: invDetails?.networkPort ?? dragItem.node.HasNetworkPorts ?? 0,
              powerPort: invDetails?.powerPort ?? dragItem.node.HasPowerPorts ?? 0,
              EQID: invDetails?.EQID ?? dragItem.node.EQID?.toString() ?? "",
              sourceTreeData: dragItem.sourceTreeData,
            });
          }
        }
      } else {
        const invDetails = dragItem.inventoryDeviceDetails ?? inventoryDeviceDetails;
        const dragParentDevice = findDragParentDevice(dragItem.node, dragItem.sourceTreeData);

        const resolvedDeviceEntId = resolveDeviceGuid(
          invDetails?.moduleDeviceID,
          dragItem.node.DeviceEntId,
          dragParentDevice?.DeviceEntId,
          dragParentDevice?.NodeEntID,
          dragItem.node.parentEntID,
          dragItem.node.NodeEntID
        );

        let name = dragItem.node.Name;
        if (dragItem.node.parentEntID) {
          const parentSourceTree = dragItem.sourceTreeData ?? treeData;
          const parentNodeData = parentSourceTree
            ? FnGetNodeDetailsBaseOnKey(parentSourceTree, dragItem.node.parentEntID)
            : null;
          if (parentNodeData?.nodeData?.node?.Name) {
            name = parentNodeData.nodeData.node.Name;
          }
        }
        // ================= CABLE FLOW =================
        if (
          (dcExplorerContainerProps.featureId == FEnums.InventoryConfiguration ||
            dcExplorerContainerProps.featureId == FEnums.InventoryManagement) &&
          name &&
          name.toLowerCase().includes("cable")
        ) {
          let payload: Record<string, unknown> = {};
          const ParentObj = FnGetParentTreeInfoUsingDiv(drop, true);
          if (drop?.NodeType === "Bin") {
            const eqid = dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID;
            payload = {
              eqid: eqid,
              deviceName: name,
              location: drop.Name,
            };
          }
          if (ParentObj?.length) {
            for (let element of ParentObj) {
              if (element.NodeType === "Site") {
                payload.site = element.Name ?? "";
              } else if (element.NodeType === "Inventory") {
                payload.Inventory = element.Name ?? "";
              } else if (element.NodeType === "Store") {
                payload.Store = element.Name ?? "";
              }
            }
          }
          let eqid = dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID;
          const cablePayload = {
            eqid: eqid,
            cableName: dragItem.node.Name,
            site: recordString(payload.site),
            inventory: recordString(payload.Inventory),
            store: recordString(payload.Store),
            bin: recordString(payload.location),
          };
          const handleAddCableFromLibrary = (resp: unknown, status?: string) => {
            if (status === "200") {
              handleUpdateStatic();
              drop.NodeEntID && CreateLogForNode(LogName.AddDevice, dragItem.node, optionalString(drop.NodeEntID), dragItem.subSource, LogSubGroupName.DeviceModel)
              handleRefreshTreeForDragAndDropById(dragItem.node?.NodeEntID ?? "", drop.NodeEntID ?? "")
            }
          };
          axiosInterceptor(
            {
              url: CABLING.AddCableFromLibrary,
              data: cablePayload,
              allowShowLoader: true,
              setFetchData: handleAddCableFromLibrary,
            },
            statusBarContext
          );
        }
        // ================= MOVE TO SLOT =================
        else if (
          ["ru", "slot", "deviceslot", "inoutplug", "pm"].includes(safe(drop?.NodeType)) ||
          ["ru", "slot", "deviceslot", "inoutplug", "pm"].includes(safe(drop?.treetype)) ||
          drop?.Name?.toLowerCase().startsWith("ru#")
        ) {
          const { dragfrontView, dragRearView } = resolveDragDeviceViews(dragItem.node, dragParentDevice);

          const ParentDropObj = FnGetParentObjGivenTreeTypeTreeUsingDiv(drop, "Device", true);
          const deviceDrop =
            FnGetFilterDataUsingType(ParentDropObj, "Device") ||
            (treeData && FnFindNearestNodeByType(treeData, drop, "Device")) ||
            (treeData && FnFindNearestNodeByType(treeData, drop, "Rack"));
          const viewDrop =
            FnGetFilterDataUsingType(ParentDropObj, "DeviceView") ||
            (treeData && FnFindNearestNodeByType(treeData, drop, "DeviceView"));

          const moduleViewID1 =
            invDetails?.moduleViewID1 ||
            dragfrontView?.DeviceViewEntId ||
            dragfrontView?.NodeEntID ||
            null;

          const moduleViewID2 =
            invDetails?.moduleViewID2 ||
            dragRearView?.DeviceViewEntId ||
            dragRearView?.NodeEntID ||
            null;

          const slotsNeeded = Number(
            invDetails?.slotsNeeded ??
            getDevicePropertyValue((dragItem.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
            getSlotsNeededForMount(dragItem.node, dragParentDevice) ??
            (dragItem.node?.SlotsNeeded ? Number(dragItem.node.SlotsNeeded) : 0)
          );

          const isDropToRU =
            safe(drop?.NodeType) === "ru" ||
            safe(drop?.treetype) === "ru" ||
            drop?.Name?.toLowerCase().startsWith("ru#") ||
            drop?.Name?.toLowerCase() === "ru";

          // If dropping on RU in Free Site:
          // If slotsNeeded === 0, prompt left/right and angle and use mountType = PM
          if (isDropToRU && slotsNeeded === 0) {
            setMountInput("pole");
            setIsConfigureMounting(true);
            setIsOpenLibFormDialog(true);
            setDropNode(drop);
            setLibFormDialogTitle(
              "Configure the mounting parameters for your installation."
            );
            return;
          }

          let resolvedMountType: string;
          if (isDropToRU) {
            resolvedMountType = slotsNeeded > 0 ? "RU" : "PM";
          } else {
            resolvedMountType = getMoveFloorToSlotMountType(drop, mountInput, slotsNeeded);
          }

          const payload: Record<string, unknown> = {
            parentDeviceID: deviceDrop?.NodeEntID,
            parentViewID1: viewDrop?.NodeEntID,
            parentSlotID1: drop.NodeEntID,
            moduleDeviceID: resolvedDeviceEntId,
            moduleViewID1: moduleViewID1,
            moduleViewID2: moduleViewID2,
            slotsNeeded: slotsNeeded,
            mountAngle: 0,
            bothSides: !!moduleViewID2,
            mountType: resolvedMountType,
            mountLeft: true,
            internal: false,
          };

          const handleMoveFloorToSlot = async (
            resp: unknown,
            status?: string
          ) => {
            if (status === "200" || (resp as any)?.success) {
              if (treeData) {
                const newSlotID = extractNewSlotIdFromResponse(resp);
                drop.NodeEntID && CreateLogForNode(LogName.AddDevice, dragItem.node, optionalString(drop.NodeEntID), dragItem.subSource, LogSubGroupName.DeviceModel);
                setReloadTreeFor({
                  source: "devicemodel",
                  nodeToRemove: dragItem.node,
                });
                handleUpdateStatic();
                await handleRefreshTreeForDragAndDropById(
                  resolvedDeviceEntId ?? dragItem.node?.NodeEntID ?? "",
                  drop.NodeEntID ?? drop.key,
                  newSlotID
                );
              }
            }
          };

          axiosInterceptor(
            {
              url: DEVICE.MoveFloorToSlot,
              data: payload,
              allowShowLoader: true,
              setFetchData: handleMoveFloorToSlot,
            },
            statusBarContext
          );
        }
        // ================= MOVE FLOOR DEVICES =================
        else {
          const handleMoveFloorDevices = (resp: unknown, status?: string) => {
            if (status !== "200") return;
            drop.NodeEntID && CreateLogForNode(LogName.AddDevice, dragItem.node, optionalString(drop.NodeEntID), dragItem.subSource, LogSubGroupName.DeviceModel);
            setReloadTreeFor({
              source: "devicemodel",
              nodeToRemove: dragItem.node,
            });
            handleUpdateStatic();
            handleRefreshTreeForDragAndDropById(resolvedDeviceEntId ?? dragItem.node?.NodeEntID ?? "", drop.NodeEntID ?? "");
          };

          let intIds: string[] = [];
          if (resolvedDeviceEntId) {
            intIds.push(resolvedDeviceEntId);
          }
          if (!intIds.length) return;

          const payload = {
            entIDList: intIds,
            parentEntID: drop.NodeEntID,
            parentNodeType: drop.NodeType,
          };

          axiosInterceptor(
            {
              url: DEVICE.MoveFloorDevices,
              data: payload,
              allowShowLoader: true,
              setFetchData: handleMoveFloorDevices,
            },
            statusBarContext
          );
        }
      }
    }
  };

  // Refreshes dashboard statistics after library add or move operations.
  const handleUpdateStatic = async () => {
    await FnUpdateStatisticsAndRefresh(statusBarContext, mainAppContext)
  }

  // Submits mount configuration and calls move/add device APIs or work orders.
  const handleBtnClickConfigureMounting = async (label: string, index: number, config: IMountingConfig) => {

    if (label.toLowerCase() === "cancel") {
      setLibFormDialogTitle("");
      setIsConfigureMounting(false);
      setIsOpenLibFormDialog(false);
      setDropNode(null);
      setIsInternalDropWO(false);
    } else {
      const dragNode = isInternalDropWO ? (dragNodeInfo ?? dragItem) : (dragItem ?? dragNodeInfo);
      if (!dragNode || !dropNode) {
        return;
      }
      const isInventoryDrop = !isInternalDropWO && dragItem?.subSource === DeviceModelFEnums.Inventory;
      if (isInternalDropWO || isInventoryDrop) {
        const mountedDragNode = dragNode.node;
        const dropNodeInfo = dropNode;
        if (!dropNodeInfo || !mountedDragNode) return;
        const dragSourceTree = isInternalDropWO ? treeData : (dragItem?.sourceTreeData ?? treeData);
        const dragParentDevice = findDragParentDevice(mountedDragNode, dragSourceTree);
        const { dragfrontView, dragRearView } = resolveDragDeviceViews(mountedDragNode, dragParentDevice);

        const ParentDropObj = FnGetParentObjGivenTreeTypeTreeUsingDiv(dropNodeInfo, "Device", true);
        const deviceDrop = FnGetFilterDataUsingType(ParentDropObj, "Device")
          || (treeData && FnFindNearestNodeByType(treeData, dropNodeInfo, "Device"))
          || (treeData && FnFindNearestNodeByType(treeData, dropNodeInfo, "Rack"));
        const viewDrop = FnGetFilterDataUsingType(ParentDropObj, "DeviceView")
          || (treeData && FnFindNearestNodeByType(treeData, dropNodeInfo, "DeviceView"));

        const invDetails = isInventoryDrop ? (dragItem?.inventoryDeviceDetails ?? inventoryDeviceDetails) : undefined;
        const slotsNeeded = Number(
          invDetails?.slotsNeeded ??
          getDevicePropertyValue((dragItem?.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
          getDevicePropertyValue((dragNode?.node?.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
          getDevicePropertyValue((dragParentDevice?.MorePropertyData ?? []) as IDeviceMorePropertyRow[], "SlotsNeeded") ??
          getSlotsNeededForMount(mountedDragNode, dragParentDevice) ??
          (mountedDragNode?.SlotsNeeded ? Number(mountedDragNode.SlotsNeeded) : 0)
        );
        const moduleDeviceID =
          (isInventoryDrop
            ? resolveDeviceGuid(
              invDetails?.moduleDeviceID,
              mountedDragNode.DeviceEntId,
              dragParentDevice?.DeviceEntId,
              dragParentDevice?.NodeEntID,
              mountedDragNode.parentEntID,
              mountedDragNode.NodeEntID
            )
            : null) || getModuleDeviceIdForMount(mountedDragNode, dragParentDevice);

        const frontViewId = invDetails?.moduleViewID1 || dragfrontView?.NodeEntID || dragfrontView?.DeviceViewEntId || null;
        const rearViewId = invDetails?.moduleViewID2 || dragRearView?.NodeEntID || dragRearView?.DeviceViewEntId || null;

        let moduleViewID1: string | null = null;
        let moduleViewID2: string | null = null;
        let bothSides = false;

        if (config.mountBothSides && frontViewId && rearViewId) {
          moduleViewID1 = frontViewId;
          moduleViewID2 = rearViewId;
          bothSides = true;
        } else if (isRearViewNode(mountedDragNode)) {
          moduleViewID1 = rearViewId ?? frontViewId;
          moduleViewID2 = null;
          bothSides = false;
        } else {
          moduleViewID1 = frontViewId ?? rearViewId;
          moduleViewID2 = null;
          bothSides = false;
        }

        const mountAngle = Math.max(
          config.angle > 0 ? config.angle : 0,
          config.leftpoleAngle > 0 ? config.leftpoleAngle : 0,
          config.rightpoleAngle > 0 ? config.rightpoleAngle : 0
        );
        let sides = false;
        if (mountInput === 'sides' && dragNodeInfoForWO) {
          sides = dragNodeInfoForWO.treetype === "View" ? false : (dragNodeInfoForWO.children?.length ?? 0) > 1;
        }
        if (config.mountBothSides) {
          sides = true;
        }

        const dropNodeTypeLower = safe(dropNodeInfo.NodeType);
        const dropTreeTypeLower = safe(dropNodeInfo.treetype);
        const dropNameLower = dropNodeInfo.Name?.toLowerCase() ?? "";

        const isDropToRU =
          dropNodeTypeLower === "ru" ||
          dropTreeTypeLower === "ru" ||
          dropNameLower.startsWith("ru#") ||
          dropNameLower === "ru";

        const isDropToPole =
          dropNodeTypeLower === "pm" ||
          dropTreeTypeLower === "pm" ||
          dropNodeTypeLower === "polemount" ||
          dropTreeTypeLower === "polemount" ||
          dropNameLower.includes("pole");

        const isDropToInOut =
          dropNodeTypeLower === "inoutplug" ||
          dropTreeTypeLower === "inoutplug" ||
          dropNodeTypeLower === "inout" ||
          dropTreeTypeLower === "inout" ||
          dropNodeTypeLower === "inpoutplug" ||
          dropNameLower.includes("inout");

        let resolvedMountType: string;
        if (isDropToRU) {
          resolvedMountType = slotsNeeded > 0 ? "RU" : "PM";
        } else if (isDropToPole) {
          resolvedMountType = "PM";
        } else if (isDropToInOut) {
          resolvedMountType = "InOut";
        } else {
          resolvedMountType = getMoveFloorToSlotMountType(dropNodeInfo, mountInput, slotsNeeded);
        }

        const mountLeft = (config.rightpoleAngle !== undefined && config.rightpoleAngle !== null && config.rightpoleAngle >= 0) ? false : true;
        const mountLeftStr = mountLeft ? "True" : "False";
        const bothSidesStr = (config.mountBothSides !== undefined && config.mountBothSides !== null)
          ? (config.mountBothSides ? "True" : "False")
          : "True";

        const payload: Record<string, unknown> = {
          parentDeviceID: deviceDrop?.NodeEntID,
          parentViewID1: viewDrop?.NodeEntID,
          parentSlotID1: dropNodeInfo?.NodeEntID ?? "",
          moduleDeviceID: moduleDeviceID,
          moduleViewID1: moduleViewID1,
          moduleViewID2: moduleViewID2,
          slotsNeeded: slotsNeeded,
          mountAngle: mountAngle,
          bothSides: bothSides,
          mountType: resolvedMountType,
          mountLeft: mountLeft,
          internal: false,
        };
        if (mainAppContext.siteProperties?.Managed && !isInventoryFeature) {
          setIsInternalDropWO(false);
          setIsOpenLibFormDialog(false);
          setIsConfigureMounting(false);
          setDropNode(null);
          setLibFormDialogTitle("");

          let deviceNodePerent: ITreeNode | null | undefined = treeData && FnFindNearestNodeByType(treeData, mountedDragNode, "Device");
          if (treeData) {
            const workOrderProfile = await FnGetWorkOrderProfile(sessionContext, statusBarContext);
            setWorkorderRecords(workOrderProfile);
            setShowSelectWorkorder(true);
            setCreateWorkOrderPayload({
              treeData: treeData,
              sourceNodeEntID: optionalString(moduleDeviceID ?? mountedDragNode.NodeEntID),
              sourceNodeName: optionalString(dragParentDevice?.Name ?? mountedDragNode.Name),
              sourceNodeType: dragParentDevice?.NodeType ?? mountedDragNode.NodeType ?? "",
              EntityName: "WorkorderProfile",
              WorkorderType: "Move",
              action: "Move Device Floor to Slot",
              SeqNo: 1,
              sessionContext: sessionContext,
              statusBarContext: statusBarContext,
              _WorkOrderProfile: undefined,
              ParentEntityName: optionalString(deviceNodePerent?.NodeEntityname),
              ParentID: optionalString(deviceNodePerent?.NodeEntID),
              RUPosition: undefined,
              destNodeEntityname: optionalString(dropNodeInfo?.NodeEntityname),
              destNodeEntID: optionalString(dropNodeInfo?.NodeEntID),
              extraSouceObj: {
                moduleDeviceID: payload.moduleDeviceID,
                moduleViewID1: payload.moduleViewID1,
                moduleViewID2: payload.moduleViewID2,
                slotsNeeded: payload.slotsNeeded,
                mountAngle: mountAngle,
                mountType: resolvedMountType,
                bothSides: bothSidesStr,
                ...(resolvedMountType === "PM" ? { mountLeft: mountLeftStr } : {}),
              },
              extraDestObj: {
                parentDeviceID: deviceDrop?.NodeEntID,
                parentViewID1: viewDrop?.NodeEntID,
                SlotID: dropNodeInfo?.NodeEntID
              },
              networkPort: dragParentDevice?.HasNetworkPorts ?? mountedDragNode.HasNetworkPorts ?? 0,
              powerPort: dragParentDevice?.HasPowerPorts ?? mountedDragNode.HasPowerPorts ?? 0,
              EQID: invDetails?.EQID ?? mountedDragNode.EQID?.toString() ?? "",
              sourceTreeData: isInternalDropWO ? treeData : dragItem?.sourceTreeData,
              isFloorDevice: true,
            });
          }
        } else {
          const handleMoveFloorToSlot = async (resp: unknown, status?: string) => {
            setIsInternalDropWO(false);
            setIsOpenLibFormDialog(false);
            setIsConfigureMounting(false);
            setDropNode(null);
            setLibFormDialogTitle("");
            if ((status === "200" || (resp as any)?.success) && dropNodeInfo) {
              const newSlotID = extractNewSlotIdFromResponse(resp);
              dropNodeInfo.NodeEntID && CreateLogForNode(LogName.AddDevice, dragParentDevice ?? mountedDragNode, optionalString(dropNodeInfo.NodeEntID), "subSource" in dragNode ? dragNode.subSource : undefined, LogSubGroupName.DeviceModel);
              if (isInventoryDrop && dragItem) {
                setReloadTreeFor({
                  source: "devicemodel",
                  nodeToRemove: dragItem.node,
                });
              }
              handleUpdateStatic();
              await handleRefreshTreeForDragAndDropById(
                moduleDeviceID ?? dragParentDevice?.NodeEntID ?? mountedDragNode.NodeEntID ?? mountedDragNode.key,
                dropNodeInfo.NodeEntID ?? dropNodeInfo.key,
                newSlotID
              );
            }
          };
          axiosInterceptor({
            url: DEVICE.MoveFloorToSlot,
            data: payload,
            setFetchData: handleMoveFloorToSlot
          }, statusBarContext)
        }
      } else {
        if (dropNode && dragNode && (FnProcessStringToCompare(dropNode.NodeType ?? "", "RU") || FnProcessStringToCompare(dropNode?.NodeType ?? "", "Slot") || FnProcessStringToCompare(dropNode.NodeType ?? "", "inoutplug") || FnProcessStringToCompare(dropNode.NodeType ?? "", "pm"))) {
          let payloadRU: Record<string, unknown> = {};
          let ParentObj = FnGetParentTreeInfoUsingDiv(dropNode, true);
          const dragSourceTreeData = getDragSourceTreeData(dragNode) ?? treeData;
          const dragParentEntId = toTreeKey(dragNode.node.parentEntID);
          if (dropNode?.NodeType == "Floor" || dropNode?.treetype == "Floor" && dragNode) {
            let eqid = dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID;
            let name = dragNode.node.Name;
            if (dragNode.node.ParentEQID && dragSourceTreeData && dragParentEntId) {
              let parentNodeData = FnGetNodeDetailsBaseOnKey(dragSourceTreeData, dragParentEntId);
              name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
            }
            payloadRU = {
              eqid: eqid,
              deviceName: name,
              floor: dropNode.Name,
              location: ""
            };
          } else if (dropNode?.NodeType == "Location" || dropNode?.treetype == "Location" && dragNode.node) {
            let eqid = dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID;
            let name = dragNode.node.Name;
            if (dragNode.node.ParentEQID && dragSourceTreeData && dragParentEntId) {
              let parentNodeData = FnGetNodeDetailsBaseOnKey(dragSourceTreeData, dragParentEntId);
              name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
            }
            payloadRU = {
              eqid: eqid,
              deviceName: name,
              location: dropNode.Name
            };
          }
          for (let index = 0; index < ParentObj.length; index++) {
            const element = ParentObj[index];
            if (dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration || dcExplorerContainerProps.featureId === FEnums.InventoryManagement) {
              let keyType = element.treetype?.toLowerCase();
              payloadRU = { ...payloadRU, [keyType]: element.Name?.trim() ?? "" };
            }
            else {
              let keyType = element.NodeType?.toLowerCase();
              if (FnProcessStringToCompare(element.treetype, "Device")) {
                keyType = "device";
              }
              else if (FnProcessStringToCompare(element.treetype, "DeviceView")) {
                keyType = "deviceView";
              }
              if (keyType)
                payloadRU = { ...payloadRU, [keyType]: element.Name?.trim() ?? "" };
            }
          }
          let eqid = dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID;
          let name = dragNode.node.Name;
          let mountview = "F";
          if (dragNode.node.ParentEQID && dragSourceTreeData && dragParentEntId) {
            let parentNodeData = FnGetNodeDetailsBaseOnKey(dragSourceTreeData, dragParentEntId);
            name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
            mountview = dragNode.node.Name ? dragNode.node.Name?.toLowerCase().includes("front") ? "F" : "R" : "F";
          }
          let slotIndex = dropNode.Name && dropNode.Name.split("#")[1] ? dropNode.Name.split("#")[1] : 0;
          const mountAngle = Math.max(
            config.angle > 0 ? config.angle : 0,
            config.leftpoleAngle > 0 ? config.leftpoleAngle : 0,
            config.rightpoleAngle > 0 ? config.rightpoleAngle : 0
          );
          let sides = false
          if (mountInput === 'sides' && dragNodeInfoForWO) {
            sides = dragNode.node.treetype === "View" ? false : (dragNode.node?.children?.length ?? 0) > 1
          }
          if (config.mountBothSides) {
            sides = true
          }
          const payloadFinalRU = {
            mountedEQID: eqid,
            mountedDeviceName: name,
            site: payloadRU.site,
            room: payloadRU.room,
            floor: payloadRU.floor,
            location: payloadRU.location,
            device: payloadRU.device,
            deviceView: recordString(payloadRU.deviceView).toLowerCase() === "front" ? "F" : "R",
            mountedView: mountview,
            slotMountType: dropNode?.NodeType,
            slotIndex: slotIndex,
            bothSides: sides,
            mountType: mountInput === "pole" ? "PM" : dropNode?.NodeType,
            mountAngle: mountAngle,
            mountLeft: config.leftpoleAngle ? false : true
          }
          const handleAddMounteddeviceFromLibrary = (resp: unknown, status?: string) => {
            setIsOpenLibFormDialog(false);
            setIsConfigureMounting(false);
            setDropNode(null);
            setLibFormDialogTitle(
              ""
            );
            if (status === "200") {
              handleUpdateStatic()
              dropNode.NodeEntID && dragItem && CreateLogForNode(LogName.AddDevice, dragNode.node, optionalString(dropNode.NodeEntID), dragItem.subSource, LogSubGroupName.DeviceModel)
              handleRefreshTreeForDragAndDropById((dragNode.node.EQID ? dragNode.node.EQID : dragNode.node.ParentEQID) ?? "", dropNode.NodeEntID ?? "");
            }
          }
          axiosInterceptor({
            url: DEVICE.AddMounteddeviceFromLibrary,
            data: payloadFinalRU,
            allowShowLoader: true,
            setFetchData: handleAddMounteddeviceFromLibrary
          }, statusBarContext)
        }
      }
    }
  }

  // Adds multiple library devices or cables based on the accepted quantity.
  const handleBtnClickAcceptNumber = async (label: string, index: number, value: number) => {
    if (label.toLowerCase() === "cancel") {
      setLibFormDialogTitle("");
      setIsOpenLibFormDialog(false);
    } else {
      if (!dragItem || !dragItem.node || !dropNode)
        return;
      setIsOpenLibFormDialog(false)
      let makeDropNodeUnicName = false
      if (dropNode && dropNode.children.length) {
        for (let index = 0; index < dropNode.children.length; index++) {
          const element = dropNode.children[index];
          if (element.Name?.toLowerCase() === dragItem?.node?.Name?.toLowerCase()) {
            makeDropNodeUnicName = true
          }
        }
      }
      if ((dragItem.subSource === DeviceModelFEnums.NetZoomDeviceLibrary || dragItem.subSource === DeviceModelFEnums.NetZoomCableLibrary) && dragItem && dropNode) {
        let payload: IAddLibraryDevicePayload = {};
        let ParentObj = treeData && FnFindNodeAndParents(treeData, (dropNode.NodeEntID ?? dropNode.key ?? "").toString());
        const isDropOnBin =
          dropNode?.NodeType?.toLowerCase() === "bin" ||
          dropNode?.treetype?.toLowerCase() === "bin" ||
          dropNode?.Type?.toLowerCase() === "new" ||
          dropNode?.Type?.toLowerCase() === "other" ||
          dropNode?.Name?.toLowerCase() === "new" ||
          dropNode?.Name?.toLowerCase() === "other";

        if (dropNode?.NodeType == "Floor" || dropNode?.treetype == "Floor" && dragItem.node) {
          let eqid = dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID;
          let name = dragItem.node.Name;
          if (dragItem.node.ParentEQID && dragItem.sourceTreeData && dragItem.node.parentEntID) {
            let parentNodeData = FnGetNodeDetailsBaseOnKey(dragItem.sourceTreeData, dragItem.node.parentEntID);
            name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
          }
          payload = {
            eqid: eqid,
            deviceName: name,
            floor: dropNode.Name,
            location: ""
          };
        } else if (dropNode?.NodeType == "Location" || dropNode?.treetype == "Location" && dragItem) {
          let eqid = dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID;
          let name = dragItem.node.Name;
          if (dragItem.node.ParentEQID && dragItem.sourceTreeData && dragItem.node.parentEntID) {
            let parentNodeData = FnGetNodeDetailsBaseOnKey(dragItem.sourceTreeData, dragItem.node.parentEntID);
            name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
          }
          payload = {
            eqid: eqid,
            deviceName: name,
            location: dropNode.Name
          };
        } else if (isDropOnBin && dragItem.node) {
          let eqid = dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID;
          let name = dragItem.node.Name;
          if (dragItem.node.ParentEQID && dragItem.sourceTreeData && dragItem.node.parentEntID) {
            let parentNodeData = FnGetNodeDetailsBaseOnKey(dragItem.sourceTreeData, dragItem.node.parentEntID);
            name = parentNodeData?.nodeData && parentNodeData.nodeData.node ? parentNodeData.nodeData.node.Name : "";
          }
          payload = {
            eqid: eqid,
            deviceName: name,
            bin: dropNode.Name
          };
        }
        if (ParentObj) {
          for (let index = 0; index < ParentObj.length; index++) {
            const element = ParentObj[index];
            if (
              dcExplorerContainerProps.featureId === FEnums.InventoryConfiguration ||
              dcExplorerContainerProps.featureId === FEnums.InventoryManagement ||
              dcExplorerContainerProps.featureId === FEnums.InventoryCollection
            ) {
              let keyType = element.treetype?.toLowerCase() || element.NodeType?.toLowerCase();
              if (keyType) {
                payload = { ...payload, [keyType]: element.Name?.trim() ?? "" };
              }
            }
            else {
              let keyType = element.NodeType?.toLowerCase();
              if (FnProcessStringToCompare(element.treetype, "Device")) {
                keyType = "device";
              }
              else if (FnProcessStringToCompare(element.treetype, "DeviceView")) {
                keyType = "deviceView";
              }
              if (keyType)
                payload = { ...payload, [keyType]: element.Name?.trim() ?? "" };
            }
          }
        }
        if (payload && payload?.eqid) {
          if (dragItem.node?.EQType.toLowerCase() === "cable") {
            let name = dragItem.node.Name;
            let eqid = dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID;
            for (let index = 0; index < value; index++) {
              let cablePayload = {
                eqid: eqid,
                cableName: (!makeDropNodeUnicName && index == 0) ? name : generateUniqueId(name as string),
                site: payload?.site,
                inventory: (payload?.inventory as string | undefined) ?? payload?.room,
                store: (payload?.store as string | undefined) ?? payload?.floor,
                bin: (payload?.bin as string | undefined) ?? payload?.location
              }
              const handleAddCableFromLibrary = (resp: unknown, status?: string) => {
                if (status !== "200" || index !== value - 1) return;
                dragItem.node.NodeEntID && dropNode.NodeEntID && CreateLogForNode(
                  LogName.AddDevice,
                  dragItem.node,
                  optionalString(dropNode.NodeEntID),
                  dragItem.subSource,
                  LogSubGroupName.DeviceModel)
                handleUpdateStatic()
                handleRefreshTreeForDragAndDropById((dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID) ?? "", (dropNode.NodeEntID ?? dropNode.key ?? "").toString());
              }
              axiosInterceptor({
                url: CABLING.AddCableFromLibrary,
                data: cablePayload,
                allowShowLoader: true,
                setFetchData: handleAddCableFromLibrary
              }, statusBarContext)
            }
          } else {
            for (let index = 0; index < value; index++) {
              const deviceNameForRequest = !makeDropNodeUnicName && index === 0
                ? recordString(payload.deviceName)
                : generateUniqueId(recordString(payload.deviceName));
              const handleAddDeviceFromLibrary = (resp: unknown, status?: string) => {
                if (status === "200") {
                  if (index === value - 1) {
                    dragItem.node.NodeEntID && dropNode.NodeEntID && CreateLogForNode(LogName.AddDevice, dragItem.node, optionalString(dropNode.NodeEntID), dragItem.subSource, LogSubGroupName.DeviceModel)
                    handleUpdateStatic();
                    handleRefreshTreeForDragAndDropById((dragItem.node.EQID ? dragItem.node.EQID : dragItem.node.ParentEQID) ?? "", (dropNode.NodeEntID ?? dropNode.key ?? "").toString());
                  }
                }
              }
              const addDevicePayload: IAddLibraryDevicePayload = {
                ...payload,
                deviceName: deviceNameForRequest,
              };
              axiosInterceptor({
                url: DEVICE.AddDeviceFromLibrary,
                data: addDevicePayload,
                allowShowLoader: true,
                setFetchData: handleAddDeviceFromLibrary
              }, statusBarContext)
            }
          }
        }
      }
    }
  }

  // Returns whether internal drag is allowed for the current feature and node.
  const canAllowDragDrop = (sourceNode: ITreeNode): boolean => {
    const hasWOID = Boolean(
      (sourceNode.WOID != null && (typeof sourceNode.WOID === "string" ? sourceNode.WOID.trim().length > 0 : Boolean(sourceNode.WOID))) ||
      (sourceNode.woid != null && (typeof sourceNode.woid === "string" ? sourceNode.woid.trim().length > 0 : Boolean(sourceNode.woid)))
    );
    const hasReplacementTemplateWOID = Boolean(
      (sourceNode.ReplacementTemplateWOID != null && (typeof sourceNode.ReplacementTemplateWOID === "string" ? sourceNode.ReplacementTemplateWOID.trim().length > 0 : Boolean(sourceNode.ReplacementTemplateWOID))) ||
      (sourceNode.replacementTemplateWOID != null && (typeof sourceNode.replacementTemplateWOID === "string" ? sourceNode.replacementTemplateWOID.trim().length > 0 : Boolean(sourceNode.replacementTemplateWOID)))
    );

    if (hasWOID || hasReplacementTemplateWOID) {
      return false;
    }

    if (dcExplorerContainerProps.featureId === FEnums.EditFloorLayout) {
      const isDraggableType = ["location", "device"].includes(
        sourceNode.treetype?.toLowerCase()
      );

      return isDraggableType;
    }
    else if (dcExplorerContainerProps.featureId === FEnums.ModelBusinessService) {
      if (sourceNode.NodeType?.toLowerCase() === "mounteddevice" || (sourceNode.treetype?.toLowerCase() === "device" && sourceNode.NodeType?.toLowerCase() !== "rack")) {
        return true;
      }
    }
    else if (
      dcExplorerContainerProps.featureId === FEnums.MoveAddChange ||
      dcExplorerContainerProps.featureId === FEnums.ConfigureDevice
    ) {
      const nodeType = sourceNode.NodeType?.toLowerCase() || "";
      const treeType = sourceNode.treetype?.toLowerCase() || "";
      const isDraggableDevice =
        nodeType === "mounteddevice" ||
        ((treeType === "device" || nodeType === "device") && nodeType !== "rack") ||
        treeType === "deviceview" ||
        nodeType === "frontview" ||
        nodeType === "rearview";

      return isDraggableDevice;
    }
    return treeContainerFlatDataProps?.featureTreeProps.allowInternalDrag ? true : false
  }

  // Prepares drag payload for floor layout or hierarchical explorer drags.
  const handleDragStart = (info: NodeDragEventParams<ITreeNode>) => {
    if (!canAllowDragDrop(info.node)) {
      info.event?.preventDefault?.();
      return;
    }

    activeDragFloorIdRef.current = getFloorIdForNode(info.node);

    if (dcExplorerContainerProps.featureId === FEnums.EditFloorLayout) {
      const isLocation =
        info.node.NodeType?.toLowerCase() === "location" ||
        info.node.treetype?.toLowerCase() === "location";

      const isDevice =
        info.node.treetype?.toLowerCase() === "device" ||
        info.node.NodeType?.toLowerCase() === "device" ||
        info.node.NodeType?.toLowerCase() === "rack" ||
        info.node.Type?.toLowerCase() === "floordevice" ||
        info.node.Type?.toLowerCase() === "device";

      const targetTableName = isLocation
        ? "pg.locationlayout"
        : isDevice
          ? "pg.devicelayout"
          : "";

      if (targetTableName && mainAppContext.emRecords) {
        const widthDef = mainAppContext.emRecords.find(
          (item) =>
            item.TableName?.toLowerCase() === targetTableName &&
            item.PName?.toLowerCase() === "width"
        );
        const lengthDef = mainAppContext.emRecords.find(
          (item) =>
            item.TableName?.toLowerCase() === targetTableName &&
            item.PName?.toLowerCase() === "length"
        );

        const widthMask = (widthDef as Record<string, unknown> | undefined)?.InputMask ?? (widthDef as Record<string, unknown> | undefined)?.inputMask;
        const lengthMask = (lengthDef as Record<string, unknown> | undefined)?.InputMask ?? (lengthDef as Record<string, unknown> | undefined)?.inputMask;

        const widthMinMax = parseInputMaskMinMax(widthMask);
        const lengthMinMax = parseInputMaskMinMax(lengthMask);

        let currentWidth = parseFloat(info.node.Width ?? "");
        if (widthMinMax) {
          if (isNaN(currentWidth) || currentWidth < widthMinMax.min || currentWidth > widthMinMax.max) {
            info.node.Width = widthMinMax.min.toString();
          }
        }

        let currentLength = parseFloat((info.node.Length ?? info.node.Height) ?? "");
        if (lengthMinMax) {
          if (isNaN(currentLength) || currentLength < lengthMinMax.min || currentLength > lengthMinMax.max) {
            info.node.Length = lengthMinMax.min.toString();
          } else if (!info.node.Length && info.node.Height) {
            info.node.Length = info.node.Height;
          }
        }
      }

      const hasValidSize =
        Number(info.node.Width) > 0 &&
        Number(info.node.Length ?? info.node.Height) > 0;

      if (!hasValidSize) {
        dcExplorerContainerProps.handleShowUserMessage?.(
          "Define location dimensions first before adding to floor"
        );

        // Just exit. Do not call preventDefault or stopPropagation.
        return;
      }
      info.node.title = "";
      info.node.icon = null;
      let objectToTransfer: Device | Location | ITreeNode = info.node;
      if (info.node.NodeType?.toLowerCase() === "location" && info.node.Name && info.node.NodeEntID) {
        const id = FnGenerateUniqueId();
        const locationNode = getObjectTemplate('location', id) as Location;
        locationNode.name = info.node.Name;
        locationNode.entId = info.node.NodeEntID ?? "";
        locationNode.entityName = info.node.NodeEntityname ?? "";
        if (info.node.Width && info.node.Length) {
          locationNode.w = parseFloat(info.node.Width) || Number(locationNode.w);
          locationNode.h = parseFloat(info.node.Length) || Number(locationNode.h);
        }
        objectToTransfer = locationNode;
      }
      else if ((info.node.Type?.toLowerCase() === "floordevice" || info.node.treetype?.toLowerCase() === "device" || info.node.NodeType?.toLowerCase() === "device" || info.node.NodeType?.toLowerCase() === "rack") && info.node.Name && info.node.NodeEntID) {
        const id = FnGenerateUniqueId();
        const parentNode = info.node.parentEntID && treeData ? FnGetNodeDetailsBasedOnKey(treeData, info.node.parentEntID) : undefined
        const deviceNode = getObjectTemplate('device', id) as Device;
        deviceNode.name = info.node.Name;
        deviceNode.entityName = info.node.NodeEntityname ?? "";
        deviceNode.entId = info.node.NodeEntID;
        deviceNode.deviceType = info.node.Type ?? "floordevice";
        if (parentNode?.node.NodeType?.toLowerCase() === "location") {
          deviceNode.locationEntId = parentNode?.node.NodeEntID ?? undefined
          deviceNode.locationEntityName = parentNode?.node.NodeEntityname ?? undefined
        }
        if (info.node.Width && info.node.Length) {
          deviceNode.w = parseFloat(info.node.Width) || Number(deviceNode.w);
          deviceNode.h = parseFloat(info.node.Length) || Number(deviceNode.h);
        }
        objectToTransfer = deviceNode;
      }
      // Optional: Set some data for the drop target to use
      if (info.event.dataTransfer) {
        info.event.dataTransfer.setData("objectTemplate", JSON.stringify(objectToTransfer));
      }
    }
    else if (dcExplorerContainerProps.featureId === FEnums.ModelBusinessService) {
      setDragItem(
        {
          source: "it",
          node: info.node,
          sourceTreeData: treeData
        }
      )
    }
    else {
      info.event.dataTransfer.setData("sourceTree", treeContainerFlatDataProps?.uniqueName ?? "dce-tree");
    }
  }

  const handleDragEnd = (_info: NodeDragEventParams<ITreeNode>) => {
    activeDragFloorIdRef.current = null;
  }

  // Creates a work order from pending payload and optionally auto-executes it.
  const handleSelectWorkorder = async (workorderId: string) => {
    // In this function, we first create a work order, and then perform API calls for operations like delete, drag-and-drop, etc...
    setShowSelectWorkorder(false)

    const findWorkOrder = workorderRecords.find(x => x._Workorder === workorderId);
    if (createWorkOrderPayload) {
      const payload: IFnCreateWorkOrderApiCall = { ...createWorkOrderPayload, _WorkOrderProfile: findWorkOrder ? [findWorkOrder] : undefined }
      const result = await FnCreateWorkOrderApiCalls(payload)
      if (result) {
        setShowSelectWorkorder(false)
        setWorkorderRecords([])
        function getWorkorderProfileName(data: any): string | null {
          return data?.workorderProfile?.[0]?._WorkorderProfile ?? null;
        }
        if (["device", "product"].includes(createWorkOrderPayload.sourceNodeType?.toLowerCase() ?? "") && createWorkOrderPayload.sourceNodeEntID && createWorkOrderPayload.sourceNodeName) {
          // Call the API to update the device workorder profile
          FnCallApiForUpdateDeviceWoProfile(
            createWorkOrderPayload.sourceNodeEntID,
            getWorkorderProfileName(result) ?? "",
            statusBarContext
          )
          handleRefreshCurrentNode();
        }
        if (mainAppContext.autoExecuteWorkorder) {
          function getWorkorderProfileName(data: IWorkOrderResultData): string | null {
            return data?.workorderProfile?.[0]?._WorkorderProfile ?? null;
          }
          const actions: IDialogActionBtn[] = [
            {
              label: "No",
              onClick: () => {
                setIsConfirmOpen(false)
                setConfirmMessage("");
                setCustomButtons(undefined);
              }
            },
            {
              label: "Yes",
              onClick: async () => {
                // Call the API to auto execute the workorder
                if (result.workorderProfile) {
                  const isApproved = await FnApproveWorkorderApiCall(result.workorderProfile?.[0], sessionContext, statusBarContext);
                  if (isApproved) {
                    const resp: unknown = FnAutoExecuteWorkOrder(getWorkorderProfileName(result) ?? "", statusBarContext);
                    if (resp) {
                      if (isInternalDropWO && dragNodeInfoForWO && dropNodeInfoForWO) {
                        dragNodeInfoForWO && dropNodeInfoForWO.NodeEntID && CreateLogForNode(LogName.Move, dragNodeInfoForWO, optionalString(dropNodeInfoForWO.NodeEntID))
                        handleInternalDragDropRefresh(dragNodeInfoForWO, dropNodeInfoForWO);
                      } else if (dragNodeInfoForWO && dropNodeInfoForWO) {
                        dragNodeInfoForWO && dropNodeInfoForWO.NodeEntID && CreateLogForNode(LogName.Move, dragNodeInfoForWO, optionalString(dropNodeInfoForWO.NodeEntID))
                        handleRefreshTreeForDragAndDropById((dragNodeInfoForWO.EQID ? dragNodeInfoForWO.EQID : dragNodeInfoForWO.ParentEQID) ?? "", dropNodeInfoForWO.NodeEntID ?? "");
                      }
                    }
                  } else {
                    throw new Error("Failed to auto execute workorder")
                  }
                } else {
                  throw new Error("Failed to auto execute workorder")
                }
                setIsInternalDropWO(false)
                setDropNodeInfoForWO(null)
                setDragNodeInfoForWO(null)
                setIsConfirmOpen(false)
                setConfirmMessage("");
                setCustomButtons(undefined);
              },
              autoFocus: true
            },
            {
              label: "Workorders",
              onClick: () => {
                const name = getWorkorderProfileName(result)
                if (name) {
                  FnNavigateToWorkOrder(name, statusBarContext.userSessionId, sessionContext.SessionList);
                }
              },
              className: "highlight-btn"
            }
          ];
          setShowOkButtonOnly(false);
          setCustomButtons(actions);
          setConfirmMessage(`Workorder (${getWorkorderProfileName(result)}) is ${workorderId ? "append" : "created"} successfully. 
                Would you like to auto execute workorder: ${getWorkorderProfileName(result)}? `)
          setIsConfirmOpen(true)
          setWorkOrderData(result)
        } else {
          setShowOkButtonOnly(true);
          setCustomButtons(undefined);
          setConfirmMessage(`Workorder (${getWorkorderProfileName(result)}) is ${workorderId ? "append" : "created"} successfully.`);
          setIsConfirmOpen(true);
        }
      }
    }
  }
  if (treeData === undefined) {
    return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
  }

  if (!displayTreeData || !displayTreeData.length) {
    return <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>;
  }

  return (
    <div className='nz-dc-explorer-container'>
      {!isShowFilterForm ? <div className='nz-wh-100 nz-dce-search-tree-container'>
        <div className='nz-dce-search-container'>
          <SearchControl
            uniqueName={`${dcExplorerContainerProps.uniqueName} -search`}
            searchTooltip="Search keyword separator ‘;’"
            isShowFilterControl={
              dcExplorerContainerProps.hideFilterControl !== undefined
                ? !dcExplorerContainerProps.hideFilterControl
                : (dcExplorerContainerProps.subTreeFeatureId ? false : true)
            }
            lensDirty={(searchText || "")?.length > 0}
            filterDirty={isFilterChange}
            searchInputValue={searchText || ""}
            hideSearchControl={isShowFilterForm}
            hideRightMouseMenu={dcExplorerContainerProps.subTreeFeatureId ? true : isShowFilterForm}
            onConditionChange={(condition: string) => {
              searchCacheRef.current = null;
              setSearchHistory([]);
            }}
            searchValueChange={(value: string) => {
              setSearchText(value);
              setSearchHistory([]);
              if (searchCacheRef.current && searchCacheRef.current.keyword !== value) {
                searchCacheRef.current = null;
              }
              if (value === "") {
                searchCacheRef.current = null;
                axiosInterceptor({
                  url: KWD.DropSessionKeywordTable,
                  data: {},
                  setFetchData: (data: unknown) => {
                    if (import.meta.env.DEV)
                      console.log('data :', data);
                  }
                }, statusBarContext)
              }
            }}
            handleFilterMouse={() => {
              handleFilterClick();
            }}
            handleLensMouse={(selectedCondion: "AND" | string = "AND") => {
              if (searchText && (searchText || "").length > 0) {
                const cond = (selectedCondion || "AND").toUpperCase();
                const searchAllWord = cond === "AND";
                if (
                  searchCacheRef.current &&
                  (searchCacheRef.current.keyword !== searchText ||
                    searchCacheRef.current.searchAllWord !== searchAllWord)
                ) {
                  searchCacheRef.current = null;
                  setSearchHistory([]);
                }
                handleKeywordSearch(searchText, searchAllWord);
              }
            }} />
        </div>
        <div className={`nz-dce-tree-container${isShowFilterForm ? " nz-dce-filter-form" : ""} `}>
          {featureTreeProps && treeContainerFlatDataProps && displayTreeData && displayTreeData.length > 0 ? <TreeControl
            key={`dce-tree-${treeContainerFlatDataProps.featureId}-${treeContainerFlatDataProps.uniqueName}`}
            uniqueName={treeContainerFlatDataProps.uniqueName}
            treeData={displayTreeData}
            featureId={treeContainerFlatDataProps.featureId}
            autoFocus={dcExplorerContainerProps.subTreeFeatureId ? false : true}
            defaultExpandedKeys={defaultExpandedKeys}
            defaultSelectedKeys={defaultSelectedKeys}
            defaultCheckedKeys={defaultCheckedKeys}
            defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
            allowAPICallOnExpand={treeContainerFlatDataProps.allowAPICallOnExpand}
            allowAdd={dcExplorerContainerProps.allowAdd}
            allowEdit={dcExplorerContainerProps.allowEdit}
            allowDelete={dcExplorerContainerProps.allowDelete}
            allowCheckStrictly={featureTreeProps.allowCheckStrictly}
            allowCheckbox={featureTreeProps.allowCheckbox}
            allowDefaultExpandAll={featureTreeProps.openAllNodes}
            allowIcon={featureTreeProps.allowIcon}
            allowInternalDrag={featureTreeProps.allowInternalDrag}
            allowMultiple={false}
            className={`nz-dce-tree-for-flat-data`}
            defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
            disableSelection={featureTreeProps.disableSelection}
            handleAIClick={handleAIClick}
            handleNodeCheck={handleNodeCheck}
            handleNodeExpand={handleNodeExpand}
            handleNodeSelect={handleNodeSelect}
            canAcceptExternalDrop={canAcceptExternalDrop}
            canAcceptInternalDrop={canAcceptInternalDrop}
            handleExternalDrop={handleExternalDrop}
            canAllowDragDrop={canAllowDragDrop}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            onDrop={onDrop}
          /> : <></>}
        </div>
      </div> : <FilterFormContainer uniqueName={`${dcExplorerContainerProps.uniqueName + siteHierarchyVersionRef.current.toString()}-filter-form`}
        allowHeader={true}
        controls={[]}
        allowFilterTree={true}
        featureId={dcExplorerContainerProps.featureId}
        isFilterChange={isFilterChange}
        controlValues={filterFormData}
        headerText='Select Filter and Data Center'
        handleActionImageClick={handleFilterActionClick}
        handleFilterFormChange={handleFilterFormChange}
        handleNodeCheck={handleFilterTreeNodeCheck}
      />
      }
      <YesNoFormContainer
        isOpen={isConfirmOpen}
        uniqueName={'appqatask-confirm'}
        message={confirmMessage}
        buttons={customButtons}
        showOkButton={showOkButtonOnly}
        handleYesButtonClick={handleConfirmYesClick}
        handleNoButtonClick={() => {
          setConfirmMessage("");
          setIsConfirmOpen(false);
        }}
        handleOkButtonClick={() => {
          setConfirmMessage("");
          setIsConfirmOpen(false);
        }} />
      {
        isOpenLibFormDialog &&
        <div className="nz-dialog-overlay">
          <div
            className="nz-dialog-container"
            style={{ width: 500 }}
            role="dialog"
            aria-modal="true"
          >
            {isConfigureMounting ? <ConfigureMounting style={{ backgroundColor: "var(--bgfeaturepane1)" }} title={"Configure Mounting"}
              message={libFormDialogTitle} buttonLabels={["Save", "Cancel"]}
              mountInput={mountInput}
              onButtonClickWithValue={handleBtnClickConfigureMounting}
            /> :
              <AcceptNumberForm style={{ backgroundColor: "var(--bgfeaturepane1)" }} title={"Create instances"}
                message={libFormDialogTitle} inputmask={'{1;10;1}'} buttonLabels={['Save', 'Cancel']}
                onButtonClickWithValue={handleBtnClickAcceptNumber} />
            }
          </div>
        </div>
      }
      {showSelectWorkorder &&
        <div className="nz-dialog-overlay">
          <div
            className="nz-wo-dialog-container "
            style={{ width: '100%', height: 500, overflow: 'auto' }}
            role="dialog"
            aria-modal="true"
          >
            <SelectWorkorder workorderRecords={workorderRecords} onSelect={handleSelectWorkorder} onCancel={() => {
              setShowSelectWorkorder(false)
              setWorkorderRecords([])
            }} />
          </div>
        </div>
      }
      {
        showDciPopup && dciRecords &&
        <div className="nz-dialog-overlay">
          <div
            className="nz-dialog-container"
            style={{ width: 500, maxHeight: '50%' }}
            role="dialog"
            aria-modal="true"
          >
            <ShowDatacenterInterconnect
              uniqueName={`${dcExplorerContainerProps.uniqueName} -show - dci`}
              dciRecords={dciRecords}
              featureId={dcExplorerContainerProps.featureId}
              handleClose={() => {
                setShowDciPopup(false)
                setDciRecords(undefined)
              }}
            />
          </div>
        </div>
      }
    </div>
  )
}
export { DcExplorerContainer }

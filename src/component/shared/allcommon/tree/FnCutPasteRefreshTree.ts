import type { Key } from 'react';
import type React from 'react';
import { ITreeNode } from '../../allinterface/tree/ITreeControl.ts';
import { IFeatureTree } from '../../allinterface/tree/ITreeForFlatDataContainer.ts';
import { IStatusBar } from '../../context/allinterface/IStatusBar.ts';
import { ISession, ISessionContextProps } from '../../context/allinterface/ISession.ts';
import { ISessionUpdateApiResponse } from '../../allinterface/IDcExplorerContainer.ts';
import { FEnums } from '../../../constants/Feature.ts';
import { FnFindNearestNodeByType } from '../FnFindNearestNodeByType.ts';
import { FnFindNodeAndParents } from '../tablegrid/FnFindNodeAndParents.ts';
import { FnCallApiToGetDataForTree } from './FnCallApiToGetDataForTree.ts';
import { FnRemoveChildrenNodes } from './FnRemoveChildrenNodes.ts';
import { FnRemoveNodesByKeys } from '../FnRemoveNodesByKeys.ts';
import { FnAddSubNode } from './FnAddSubNode.ts';
import { FnDeepClone } from '../basic/FnDeepClone.ts';
import { FnGenerateUID } from '../settingsform/FnGenerateUID.ts';
import { FnHandleAPIResponse } from '../basic/FnHandleAPIResponse.ts';
import { axiosInterceptor } from '../../interceptors/Interceptor.ts';
import { SESSION } from '../../interceptors/EndPoints.ts';
import { IAllSitesHierarchy } from '../../context/allinterface/IMainApp.ts';

export interface IFnCutPasteRefreshTreeOptions {
  /** The source node that was cut (if known). */
  sourceNode?: ITreeNode | null;
  /** Cached source container node (e.g. cutSourceFloorNodeRef). */
  sourceContainerNode?: ITreeNode | null;
  /** Keys of the nodes that were cut (to remove from tree). */
  cutNodeKeys?: Key[];

  /** The destination node where paste occurred. */
  destNode: ITreeNode;
  /** Optional ID of the newly pasted entity returned from API (for selection and expansion). */
  pastedEntityId?: string;

  /** Active tree data */
  treeData: ITreeNode[];
  /** Cached original tree data */
  originalTreeData: ITreeNode[];
  /** Cached original tree data for inventory features */
  originalTreeDataForInventory?: ITreeNode[];
  /** Active feature ID */
  featureId: string;
  /** Status bar context for API loaders */
  statusBarContext: IStatusBar;
  /** Session variables */
  sessionList?: ISession[];
  /** Session context props (for session updates) */
  sessionContext?: ISessionContextProps;
  /** Feature tree properties */
  featureTreeProps?: IFeatureTree;

  /** State setters and refs */
  setTreeData: (data: ITreeNode[]) => void;
  setOriginalTreeData: (data: ITreeNode[]) => void;
  originalTreeDataRef: React.RefObject<ITreeNode[]>;
  setOriginalTreeDataForInventory?: (data: ITreeNode[]) => void;
  originalTreeDataForInventoryRef?: React.RefObject<ITreeNode[]>;

  needToUpdateTreeNodeRef: React.RefObject<boolean>;
  defaultExpandedKeys?: Key[];
  setDefaultExpandedKeys: (keys: Key[]) => void;
  setDefaultSelectedKeys: (keys: Key[]) => void;
  setDefaultSelectedNodeInfo: (info: any) => void;
  setDefaultCheckedKeys?: (keys: Key[]) => void;
  lastHandledKeyRef?: React.RefObject<Key | null>;
  setIsRefreshed?: (refreshed: boolean) => void;

  /** Refs to clear after cut-paste is processed */
  checkedNodeKeysToCutRef?: React.RefObject<Key[]>;
  cutSourceNodeRef?: React.RefObject<ITreeNode | null>;
  cutSourceFloorNodeRef?: React.RefObject<ITreeNode | null>;
  allSitesHierarchyRecords?: IAllSitesHierarchy;
  setAllSitesHierarchyRecords?: React.Dispatch<React.SetStateAction<IAllSitesHierarchy | undefined>> | ((records: IAllSitesHierarchy | undefined) => void);
  handleNodeSelect?: (
    selectedKeys: Key[],
    info: any,
    expandedKeys: Key[],
    currentTreeData?: ITreeNode[],
    isSiteByTenant?: any,
    isShowSidebar?: boolean
  ) => void;
  updateOriginalTreeDataset?: (
    updatedOriginalTree: ITreeNode[],
    expandedNodeKeys: Key[],
    selectedNodeKeys: Key[],
    currentTreeData: ITreeNode[]
  ) => void;
}

// Type guard for session update API response
function isSessionUpdateApiResponse(value: unknown): value is ISessionUpdateApiResponse {
  return typeof value === 'object' && value !== null && 'jsonSessionOutput' in value;
}

/**
 * Resolves the API-refreshable parent container node for any given tree node.
 *
 * API Logic Considerations:
 * - Floor / Store: Handled via EXPLORER.FloorDevicesConfigurationHierarchyReduced.
 *   Covers Racks, RUs, Mounted Devices, Locations, Rooms, Rows, Bins, Shelves.
 * - Device / DeviceSlot: Handled via EXPLORER.MountedDeviceConfigurationHierarchyNew.
 *   Covers Modules, Cards, Ports, Slots, DeviceViews within a chassis.
 * - Site: Handled via EXPLORER.SiteHierarchy.
 */
export const findRefreshContainer = (
  node: ITreeNode,
  tree: ITreeNode[]
): ITreeNode | null => {
  if (!node) return null;
  const nt = (node.NodeType ?? node.treetype ?? '').toLowerCase();
  const tt = (node.treetype ?? '').toLowerCase();

  // Root / container level directly
  if (nt === 'floor' || nt === 'store' || nt === 'site') {
    return node;
  }

  // 1. Device chassis / module hierarchy (ConfigureDevice or DeviceSlot context)
  const isChassisComponent =
    ['deviceslot', 'mounteddevice', 'deviceview', 'devicenetworkport', 'devicepowerport', 'slot', 'port', 'module', 'card'].includes(tt) ||
    ['deviceslot', 'mounteddevice', 'deviceview'].includes(nt);

  if (isChassisComponent) {
    const parentSlot = FnFindNearestNodeByType(tree, node, 'DeviceSlot');
    if (parentSlot && parentSlot.key !== node.key) return parentSlot;
    const parentDevice = FnFindNearestNodeByType(tree, node, 'Device');
    if (parentDevice && parentDevice.key !== node.key) return parentDevice;
  }

  // 2. Floor or Store container (Racks, RUs, Mounted Devices, Locations, Bins)
  const nearestFloorOrStore =
    FnFindNearestNodeByType(tree, node, 'Floor') ??
    FnFindNearestNodeByType(tree, node, 'Store');
  if (nearestFloorOrStore) return nearestFloorOrStore;

  // 3. Fallback: Site
  const nearestSite = FnFindNearestNodeByType(tree, node, 'Site');
  if (nearestSite) return nearestSite;

  // 4. Ancestor path traversal using FnFindNodeAndParents
  const nodeKey = (node.key ?? node.NodeEntID ?? '').toString();
  if (nodeKey) {
    const path = FnFindNodeAndParents(tree, nodeKey);
    if (path && path.length > 0) {
      const reversed = path.slice().reverse();
      // Look for DeviceSlot/Device if chassis component
      if (isChassisComponent) {
        const foundChassis = reversed.find(n => {
          if (n.key === node.key) return false;
          const ptt = (n.treetype ?? '').toLowerCase();
          const pnt = (n.NodeType ?? '').toLowerCase();
          return ptt === 'deviceslot' || ptt === 'device' || pnt === 'device';
        });
        if (foundChassis) return foundChassis;
      }
      // Look for Floor, Store, or Site
      const foundContainer = reversed.find(n => {
        const pnt = (n.NodeType ?? n.treetype ?? '').toLowerCase();
        return pnt === 'floor' || pnt === 'store' || pnt === 'site';
      });
      if (foundContainer) return foundContainer;
    }
  }

  return null;
};

/**
 * Handles tree node refresh after a Cut and Paste operation (and similar transfer/move operations).
 *
 * Refreshes:
 * 1. The parent container of the source node (to remove/purge the cut entity from original location).
 * 2. The parent container of the destination node (to reflect the newly pasted entity).
 *
 * Optimizations & API Considerations:
 * - If source and destination belong to the SAME container (e.g. same Floor, Store, or Device),
 *   the API call is executed only once to prevent duplicate requests and race conditions.
 * - If source and destination are in DIFFERENT containers, both parent containers are refreshed sequentially.
 * - Cut node keys are purged from tree state before refreshing.
 * - Once refreshed, the newly pasted entity (or destination node) is expanded and selected,
 *   with session and sidebar state properly updated.
 *
 * Covers:
 * - Category 3 (Case 3.1: Cut & Paste) in DcExplorer_Tree_Refresh_Cases.md
 * - Category 10 (Case 10.2: Work Order Executed for move / transfer)
 * - Similar cross-container relocation and move operations.
 */
export const FnCutPasteRefreshTree = async (
  options: IFnCutPasteRefreshTreeOptions
): Promise<void> => {
  const {
    sourceNode,
    sourceContainerNode,
    cutNodeKeys,
    destNode,
    pastedEntityId,
    treeData,
    originalTreeData,
    originalTreeDataForInventory,
    featureId,
    statusBarContext,
    sessionList,
    sessionContext,
    featureTreeProps,
    setTreeData,
    setOriginalTreeData,
    originalTreeDataRef,
    setOriginalTreeDataForInventory,
    originalTreeDataForInventoryRef,
    needToUpdateTreeNodeRef,
    defaultExpandedKeys = [],
    setDefaultExpandedKeys,
    setDefaultSelectedKeys,
    setDefaultSelectedNodeInfo,
    setDefaultCheckedKeys,
    lastHandledKeyRef,
    setIsRefreshed,
    checkedNodeKeysToCutRef,
    cutSourceNodeRef,
    cutSourceFloorNodeRef,
    handleNodeSelect,
    updateOriginalTreeDataset,
    allSitesHierarchyRecords,
    setAllSitesHierarchyRecords
  } = options;

  if (!treeData || !destNode) return;

  const isInventory =
    featureId === FEnums.InventoryManagement ||
    featureId === FEnums.InventoryConfiguration;

  let currentTreeData = [...treeData];
  let updatedOriginalTreeData: ITreeNode[] =
    isInventory && originalTreeDataForInventory
      ? originalTreeDataForInventory
      : originalTreeData;

  // Clear pending selection state during refresh
  setDefaultSelectedKeys([]);
  if (lastHandledKeyRef) lastHandledKeyRef.current = null;

  /* ---------------- Step 1: Purge Cut Nodes from Local Tree ---------------- */
  const keysToRemove = cutNodeKeys?.length
    ? cutNodeKeys
    : checkedNodeKeysToCutRef?.current?.length
      ? checkedNodeKeysToCutRef.current
      : sourceNode?.key
        ? [sourceNode.key]
        : [];

  if (keysToRemove.length > 0) {
    updatedOriginalTreeData = FnRemoveNodesByKeys(updatedOriginalTreeData, keysToRemove);
    currentTreeData = FnRemoveNodesByKeys(currentTreeData, keysToRemove);
  }

  /* ---------------- Step 2: Resolve Source & Destination Containers ---------------- */
  let sourceContainer: ITreeNode | null = sourceContainerNode ?? null;
  if (!sourceContainer && sourceNode) {
    sourceContainer = findRefreshContainer(sourceNode, treeData);
  }
  if (!sourceContainer && keysToRemove.length > 0) {
    const firstCutKey = keysToRemove[0].toString();
    const cutParents = FnFindNodeAndParents(treeData, firstCutKey);
    if (cutParents?.length) {
      const targetInTree = cutParents[cutParents.length - 1];
      sourceContainer = findRefreshContainer(targetInTree, treeData);
    }
  }

  const destContainer = findRefreshContainer(destNode, treeData) ?? destNode;

  // Check if both source and destination belong to the same parent container
  const isSameContainer =
    sourceContainer &&
    destContainer &&
    (sourceContainer.key === destContainer.key ||
      (Boolean(sourceContainer.NodeEntID) &&
        Boolean(destContainer.NodeEntID) &&
        sourceContainer.NodeEntID === destContainer.NodeEntID));

  /* ---------------- Helper: Refresh a Single Container Node ---------------- */
  const refreshContainerNode = async (containerNode: ITreeNode): Promise<boolean> => {
    const hierarchyParentId = containerNode.NodeEntID;
    const resultData = await FnCallApiToGetDataForTree(
      updatedOriginalTreeData,
      containerNode,
      featureId,
      statusBarContext,
      sessionList,
      false,
      hierarchyParentId ?? undefined,
      undefined,
      allSitesHierarchyRecords,
      setAllSitesHierarchyRecords
    );

    if (!resultData.formattedTree) {
      return false;
    }

    updatedOriginalTreeData = resultData.originalTreeData;

    if (isInventory && setOriginalTreeDataForInventory && originalTreeDataForInventoryRef) {
      setOriginalTreeDataForInventory(updatedOriginalTreeData);
      originalTreeDataForInventoryRef.current = updatedOriginalTreeData;
    } else {
      setOriginalTreeData(updatedOriginalTreeData);
      originalTreeDataRef.current = updatedOriginalTreeData;
    }
    const clonedData = FnDeepClone(resultData.formattedTree);
    const removedNodes = await FnRemoveChildrenNodes(
      clonedData,
      containerNode.key,
      featureId,
      featureTreeProps as IFeatureTree,
      updatedOriginalTreeData
    );

    currentTreeData = await FnAddSubNode(
      currentTreeData,
      containerNode.key,
      removedNodes as ITreeNode[],
      featureTreeProps as IFeatureTree,
      featureId,
      false,
      containerNode.stepNo
    );

    return true;
  };

  /* ---------------- Step 3: Execute Parent Container Refresh ---------------- */
  if (isSameContainer && destContainer) {
    // Single container: refresh destination container once (updates both source and dest locations)
    await refreshContainerNode(destContainer);
  } else {
    // Cross-container: refresh source parent first, then destination parent
    if (sourceContainer) {
      await refreshContainerNode(sourceContainer);
    }
    if (destContainer) {
      await refreshContainerNode(destContainer);
    }
  }

  setTreeData(currentTreeData);

  /* ---------------- Step 4: Selection and Expansion ---------------- */
  let nodeToSelect: ITreeNode | undefined;
  let keysToExpand: Key[] = [];

  if (pastedEntityId) {
    const foundParents = FnFindNodeAndParents(currentTreeData, pastedEntityId);
    if (foundParents?.length) {
      for (let index = 0; index < foundParents.length; index++) {
        const element = foundParents[index];
        const isMatch =
          element.key.toString().toLowerCase() === pastedEntityId.toLowerCase() ||
          element.NodeEntID?.toString().toLowerCase() === pastedEntityId.toLowerCase();
        if (!isMatch) {
          keysToExpand.push(element.key);
        } else {
          nodeToSelect = element;
        }
      }
    }
  }

  // Fallback if pastedEntityId was not resolved: select destination node or destination container
  if (!nodeToSelect) {
    const fallbackNode = destNode ?? destContainer;
    if (fallbackNode) {
      const parents = FnFindNodeAndParents(currentTreeData, fallbackNode.key.toString());
      if (parents?.length) {
        keysToExpand = parents.filter(p => p.key !== fallbackNode.key).map(p => p.key);
        nodeToSelect = parents.find(p => p.key === fallbackNode.key) ?? fallbackNode;
      } else {
        nodeToSelect = fallbackNode;
      }
    }
  }

  if (nodeToSelect) {
    // Update session sidebar
    if (sessionContext) {
      axiosInterceptor(
        {
          url: SESSION.UpdateSession,
          data: {
            jsonSession: JSON.stringify([{ VariableContext: 'Optional', VariableName: 'Sidebar', SessionValue: '1' }])
          },
          setFetchData: (sessionUpdateApiResponse: unknown, status?: string) => {
            if (
              status === '200' &&
              isSessionUpdateApiResponse(sessionUpdateApiResponse) &&
              sessionUpdateApiResponse.jsonSessionOutput
            ) {
              const parsedData = FnHandleAPIResponse(sessionUpdateApiResponse.jsonSessionOutput, 'Dataset');
              if (parsedData && parsedData.length > 0) {
                sessionContext.setSessionList(parsedData);
              }
            }
          }
        },
        statusBarContext
      );
    }

    const mergedExpandedKeys = Array.from(new Set([...defaultExpandedKeys, ...keysToExpand]));
    setDefaultExpandedKeys(mergedExpandedKeys);
    needToUpdateTreeNodeRef.current = true;
    setDefaultSelectedKeys([nodeToSelect.key]);

    const selectedInfo = {
      event: 'select',
      node: { ...nodeToSelect, refreshKey: FnGenerateUID() },
      selected: true,
      selectedNodes: []
    };
    setDefaultSelectedNodeInfo(selectedInfo);

    handleNodeSelect?.(
      [nodeToSelect.key],
      selectedInfo,
      mergedExpandedKeys,
      currentTreeData,
      undefined,
      true
    );

    updateOriginalTreeDataset?.(
      updatedOriginalTreeData,
      mergedExpandedKeys,
      [nodeToSelect.key],
      currentTreeData
    );
  }

  /* ---------------- Step 5: Clean Up Cut State Refs ---------------- */
  if (checkedNodeKeysToCutRef) checkedNodeKeysToCutRef.current = [];
  if (cutSourceNodeRef) cutSourceNodeRef.current = null;
  if (cutSourceFloorNodeRef) cutSourceFloorNodeRef.current = null;
  setDefaultCheckedKeys?.([]);

  setIsRefreshed?.(true);
};

/** Alias for similar cases (e.g. source-destination parent refresh on relocation/transfer) */
export const FnRefreshSourceAndDestParents = FnCutPasteRefreshTree;

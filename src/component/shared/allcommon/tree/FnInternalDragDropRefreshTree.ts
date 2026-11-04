import type { Key } from 'react';
import type React from 'react';
import { ITreeNode } from '../../allinterface/tree/ITreeControl.ts';
import { IFeatureTree } from '../../allinterface/tree/ITreeForFlatDataContainer.ts';
import { IStatusBar } from '../../context/allinterface/IStatusBar.ts';
import { ISession } from '../../context/allinterface/ISession.ts';
import { FEnums } from '../../../constants/Feature.ts';
import { IAllSitesHierarchy } from '../../context/allinterface/IMainApp.ts';
import { FnFindNearestNodeByType } from '../FnFindNearestNodeByType.ts';
import { FnFindNodeAndParents } from '../tablegrid/FnFindNodeAndParents.ts';
import { FnCallApiToGetDataForTree } from './FnCallApiToGetDataForTree.ts';
import { FnRemoveChildrenNodes } from './FnRemoveChildrenNodes.ts';
import { FnReplaceNodeForRefresh } from './FnReplaceNodeForRefresh.ts';
import { FnAddSubNode } from './FnAddSubNode.ts';
import { FnDeepClone } from '../basic/FnDeepClone.ts';
import { FnGenerateUID } from '../settingsform/FnGenerateUID.ts';

export interface IFnInternalDragDropRefreshTreeOptions {
  /** The dragged tree node */
  dragNode: ITreeNode;
  /** The target tree node where drop occurred */
  dropNode: ITreeNode;
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
  lastHandledKeyRef?: React.RefObject<Key | null>;
  setIsRefreshed?: (refreshed: boolean) => void;

  handleNodeSelect?: (
    selectedKeys: Key[],
    info: any,
    expandedKeys: Key[],
    currentTreeData?: ITreeNode[],
    isSiteByTenant?: any,
    isShowSidebar?: boolean
  ) => void;
  allSitesHierarchyRecords?: IAllSitesHierarchy;
  setAllSitesHierarchyRecords?: React.Dispatch<React.SetStateAction<IAllSitesHierarchy | undefined>> | ((records: IAllSitesHierarchy | undefined) => void);
  updateOriginalTreeDataset?: (
    updatedOriginalTree: ITreeNode[],
    expandedNodeKeys: Key[],
    selectedNodeKeys: Key[],
    currentTreeData: ITreeNode[]
  ) => void;
}

/**
 * Checks if a tree node represents a view node (e.g. Front, Rear, View).
 */
const isViewNode = (node?: ITreeNode | null): boolean => {
  if (!node) return false;
  const nt = (node.NodeType ?? '').trim().toLowerCase();
  const tt = (node.treetype ?? '').trim().toLowerCase();
  const name = (node.Name ?? node.title ?? '').toString().trim().toLowerCase();
  return (
    nt === 'frontview' ||
    nt === 'rearview' ||
    nt === 'view' ||
    tt === 'view' ||
    name === 'front' ||
    name === 'rear' ||
    name === 'front view' ||
    name === 'rear view'
  );
};

/**
 * Checks if a tree node represents a Rack.
 * View nodes under racks are views of the rack, never the rack itself.
 */
const isRackNode = (node?: ITreeNode | null): boolean => {
  if (!node) return false;
  if (isViewNode(node)) return false;

  const nt = (node.NodeType ?? '').trim().toLowerCase();
  const tt = (node.treetype ?? '').trim().toLowerCase();
  const en = (node.NodeEntityname ?? '').trim().toLowerCase();
  const type = ((node as any).Type ?? '').trim().toLowerCase();
  const eqType = ((node as any).EQType ?? '').toString().trim().toLowerCase();

  return (
    nt === 'rack' ||
    tt === 'rack' ||
    en === 'rack' ||
    (en === '__rack' && (nt === 'device' || tt === 'device' || type === 'floordevice' || type === 'device')) ||
    type === 'rack' ||
    eqType === 'rack'
  );
};

/**
 * Checks if a node represents an RU slot, PM slot, or DeviceSlot.
 */
const isRuOrSlotNode = (node?: ITreeNode | null): boolean => {
  if (!node) return false;
  const nt = (node.NodeType ?? '').trim().toLowerCase();
  const tt = (node.treetype ?? '').trim().toLowerCase();
  const name = (node.Name ?? '').trim().toLowerCase();

  const matched = [
    'ru',
    'pm',
    'inoutplug',
    'inpoutplug',
    'inout',
    'slot',
    'deviceslot',
    'port',
    'devicenetworkport',
    'devicepowerport'
  ];
  if (matched.includes(nt) || matched.includes(tt)) return true;
  if (
    name.startsWith('ru#') ||
    name === 'ru' ||
    name.startsWith('pm#') ||
    name === 'pm' ||
    name.includes('inout') ||
    name.startsWith('slot#') ||
    name.startsWith('slot ') ||
    name === 'slot'
  ) {
    return true;
  }
  return false;
};

/**
 * Resolves the parent Rack node for any given tree node.
 */
const findRackNode = (node: ITreeNode, tree: ITreeNode[]): ITreeNode | null => {
  if (!node) return null;
  if (isRackNode(node)) return node;

  const nodeKey = (node.key ?? node.NodeEntID ?? '').toString();
  if (nodeKey) {
    const path = FnFindNodeAndParents(tree, nodeKey);
    if (path && path.length > 0) {
      for (let i = path.length - 1; i >= 0; i--) {
        if (isRackNode(path[i])) {
          return path[i];
        }
      }
    }
  }

  if (node.NodeEntID) {
    const path = FnFindNodeAndParents(tree, node.NodeEntID.toString());
    if (path && path.length > 0) {
      for (let i = path.length - 1; i >= 0; i--) {
        if (isRackNode(path[i])) {
          return path[i];
        }
      }
    }
  }

  const nearest = FnFindNearestNodeByType(tree, node, 'Rack');
  if (nearest && isRackNode(nearest)) {
    return nearest;
  }

  return null;
};

/**
 * Recursively searches a tree hierarchy for a node matching the predicate.
 */
const findNodeInHierarchy = (
  nodes: ITreeNode[],
  predicate: (n: ITreeNode) => boolean | unknown
): ITreeNode | null => {
  if (!nodes || !Array.isArray(nodes)) return null;
  for (const n of nodes) {
    if (Boolean(predicate(n))) return n;
    if (n.children?.length) {
      const found = findNodeInHierarchy(n.children, predicate);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Preserves existing already-loaded children of other RU slots in the rack,
 * ensuring vacated and destination slots are not incorrectly overwritten.
 */
const preserveExistingRuChildren = (
  newRackChildren: ITreeNode[],
  prevRackNode: ITreeNode | null,
  vacatedSlotNode?: ITreeNode | null,
  targetSlotNode?: ITreeNode | null
): void => {
  if (!prevRackNode?.children?.length || !newRackChildren?.length) return;
  const vacatedEntId = vacatedSlotNode?.NodeEntID?.toString();
  const vacatedKey = vacatedSlotNode?.key?.toString();
  const vacatedName = vacatedSlotNode?.Name?.trim().toLowerCase();

  const targetEntId = targetSlotNode?.NodeEntID?.toString();
  const targetKey = targetSlotNode?.key?.toString();
  const targetName = targetSlotNode?.Name?.trim().toLowerCase();

  for (const node of newRackChildren) {
    if (node.children?.length) {
      preserveExistingRuChildren(node.children, prevRackNode, vacatedSlotNode, targetSlotNode);
    }
    if (isRuOrSlotNode(node) && Number(node.HasChildren ?? 0) > 0 && node.NodeEntID) {
      // Do NOT preserve for the slot that was vacated
      const isVacatedSlot = Boolean(
        (vacatedEntId && node.NodeEntID && node.NodeEntID.toString() === vacatedEntId) ||
        (vacatedKey && node.key && node.key.toString() === vacatedKey) ||
        (vacatedName && node.Name && node.Name.trim().toLowerCase() === vacatedName)
      );

      if (isVacatedSlot) {
        node.children = [];
        node.isLeaf = true;
        node.HasChildren = 0;
        node.MountedDeviceEntID = '';
        continue;
      }

      // Do NOT preserve for the destination target slot (its children are loaded fresh)
      const isTargetSlot = Boolean(
        (targetEntId && node.NodeEntID && node.NodeEntID.toString() === targetEntId) ||
        (targetKey && node.key && node.key.toString() === targetKey) ||
        (targetName && node.Name && node.Name.trim().toLowerCase() === targetName)
      );

      if (isTargetSlot) continue;

      // Only preserve other untouched RU slots if they don't already have children loaded
      if (!node.children || node.children.length === 0) {
        const prevSlot = findNodeInHierarchy(prevRackNode.children, p =>
          Boolean(
            (p.NodeEntID && node.NodeEntID && p.NodeEntID.toString() === node.NodeEntID.toString()) ||
            (p.key && node.key && p.key.toString() === node.key.toString())
          )
        );
        if (
          prevSlot?.children?.length &&
          prevSlot.MountedDeviceEntID === node.MountedDeviceEntID
        ) {
          node.children = prevSlot.children;
          node.isLeaf = false;
        }
      }
    }
  }
};

/**
 * Helper to locate the nearest Floor, Store, or Site container for a given node.
 * Uses upward parentEntID traversal first, falling back to tree DFS parent path.
 */
const findFloorOrContainer = (node: ITreeNode, tree: ITreeNode[]): ITreeNode | null => {
  const nt = (node.NodeType ?? node.treetype ?? '').toLowerCase();
  if (nt === 'floor' || nt === 'store' || nt === 'site') {
    return node;
  }

  // 1. Try finding nearest Floor or Store upwards via parentEntID
  const nearest =
    FnFindNearestNodeByType(tree, node, 'Floor') ??
    FnFindNearestNodeByType(tree, node, 'Store') ??
    FnFindNearestNodeByType(tree, node, 'Site');
  if (nearest) return nearest;

  // 2. Fallback: search ancestors using FnFindNodeAndParents
  const nodeKey = (node.key ?? node.NodeEntID ?? '').toString();
  if (nodeKey) {
    const path = FnFindNodeAndParents(tree, nodeKey);
    if (path && path.length > 0) {
      return (
        path.slice().reverse().find(n => {
          const pnt = (n.NodeType ?? n.treetype ?? '').toLowerCase();
          return pnt === 'floor' || pnt === 'store' || pnt === 'site';
        }) ?? null
      );
    }
  }
  return null;
};

/**
 * Handles tree refresh after an internal drag-and-drop operation (relocation/reordering).
 *
 * Covers Category 2 in DcExplorer_Tree_Refresh_Cases.md:
 * - Case 2.1: Move Device within Same Rack (RU A -> RU B)
 * - Case 2.2: Move Device between Different Racks (Rack A -> Rack B)
 * - Case 2.3: Move Module / Card between Different Slots or Devices
 * - Case 2.4: Move Rack between Floors or Rooms
 * - Case 2.5: Move Device between Floor/Rack and Inventory Store/Bin (Unrack / Re-rack)
 */
export const FnInternalDragDropRefreshTree = async (
  options: IFnInternalDragDropRefreshTreeOptions
): Promise<void> => {
  const {
    dragNode,
    dropNode,
    treeData,
    originalTreeData,
    originalTreeDataForInventory,
    featureId,
    statusBarContext,
    sessionList,
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
    lastHandledKeyRef,
    setIsRefreshed,
    handleNodeSelect,
    updateOriginalTreeDataset,
    allSitesHierarchyRecords,
    setAllSitesHierarchyRecords
  } = options;

  if (!treeData) return;

  let currentTreeData = [...treeData];
  const isInventory =
    featureId === FEnums.InventoryManagement ||
    featureId === FEnums.InventoryConfiguration;

  let updatedOriginalTreeData: ITreeNode[] =
    isInventory && originalTreeDataForInventory
      ? originalTreeDataForInventory
      : originalTreeData;

  /* ---------------- Helper: Apply Selection ---------------- */
  const applySelection = (
    node: ITreeNode,
    parents: ITreeNode[],
    updatedOriginalTree: ITreeNode[]
  ) => {
    const ancestorKeys = parents
      .filter(p => p.key !== node.key)
      .map(p => p.key);
    const expandedNodeKeys = Array.from(new Set([...defaultExpandedKeys.filter(k => k !== node.key), ...ancestorKeys]));
    const selectedNodeKeys = [node.key];
    needToUpdateTreeNodeRef.current = true;
    setDefaultExpandedKeys(expandedNodeKeys);
    setDefaultSelectedKeys(selectedNodeKeys);

    const selectedInfo = {
      event: 'select',
      node: { ...node, refreshKey: FnGenerateUID() },
      selected: true,
      selectedNodes: []
    };
    setDefaultSelectedNodeInfo(selectedInfo);

    handleNodeSelect?.(
      selectedNodeKeys,
      selectedInfo,
      expandedNodeKeys,
      currentTreeData,
      undefined,
      true
    );

    updateOriginalTreeDataset?.(
      updatedOriginalTree,
      expandedNodeKeys,
      selectedNodeKeys,
      currentTreeData
    );
  };

  /* ---------------- Helper: Refresh a Rack and optionally populate destination RU ---------------- */
  const refreshRackNode = async (
    rackNode: ITreeNode,
    targetSlotNode?: ITreeNode | null,
    vacatedSlotNode?: ITreeNode | null,
    movedNodeInfo?: ITreeNode | null
  ): Promise<ITreeNode[] | null> => {
    const rackId = (rackNode.NodeEntID ?? rackNode.key ?? '').toString();
    if (!rackId) return null;

    const rackNodeForApi: ITreeNode = {
      ...rackNode,
      treetype: 'Device',
      MountedDeviceEntID: ''
    };

    const rackResult = await FnCallApiToGetDataForTree(
      updatedOriginalTreeData,
      rackNodeForApi,
      featureId,
      statusBarContext,
      sessionList,
      true,
      rackId,
      undefined,
      allSitesHierarchyRecords,
      setAllSitesHierarchyRecords
    );

    let formattedRackChildren = rackResult.formattedTree;
    if (!formattedRackChildren || formattedRackChildren.length === 0) {
      return null;
    }

    if (rackResult.originalTreeData) {
      updatedOriginalTreeData = rackResult.originalTreeData;
    }

    // Explicitly vacate the source RU slot in the refreshed rack hierarchy
    if (vacatedSlotNode) {
      const slotInRack = findNodeInHierarchy(formattedRackChildren, n =>
        Boolean(
          (vacatedSlotNode.NodeEntID && n.NodeEntID && n.NodeEntID.toString() === vacatedSlotNode.NodeEntID.toString()) ||
          (vacatedSlotNode.key && n.key && n.key.toString() === vacatedSlotNode.key.toString()) ||
          (vacatedSlotNode.Name && n.Name && n.Name.trim().toLowerCase() === vacatedSlotNode.Name.trim().toLowerCase())
        )
      );
      if (slotInRack) {
        slotInRack.children = [];
        slotInRack.isLeaf = true;
        slotInRack.HasChildren = 0;
        slotInRack.MountedDeviceEntID = '';
      }
    }

    // If destination target slot is specified, fetch its MountedDevice children (DeviceView in config)
    if (targetSlotNode) {
      const targetChildInRack = findNodeInHierarchy(formattedRackChildren, n =>
        Boolean(
          (targetSlotNode.NodeEntID && n.NodeEntID && n.NodeEntID.toString() === targetSlotNode.NodeEntID.toString()) ||
          (targetSlotNode.key && n.key && n.key.toString() === targetSlotNode.key.toString()) ||
          (targetSlotNode.Name && n.Name && n.Name.trim().toLowerCase() === targetSlotNode.Name.trim().toLowerCase())
        )
      );

      const ruDeviceIdForCall = (
        targetChildInRack?.MountedDeviceEntID ||
        (targetChildInRack as any)?.MountedDeviceID ||
        (vacatedSlotNode as any)?.MountedDeviceEntID ||
        (vacatedSlotNode as any)?.MountedDeviceID ||
        (movedNodeInfo as any)?.DeviceEntId ||
        (movedNodeInfo as any)?.MountedDeviceID ||
        movedNodeInfo?.MountedDeviceEntID ||
        (movedNodeInfo as any)?.MountedDeviceViewEntID ||
        (movedNodeInfo as any)?.EQID ||
        movedNodeInfo?.parentEntID ||
        movedNodeInfo?.NodeEntID ||
        ''
      ).toString();

      if (targetChildInRack && ruDeviceIdForCall) {
        const ruNodeForApi: ITreeNode = {
          ...targetChildInRack,
          treetype: 'DeviceSlot',
          MountedDeviceEntID: ruDeviceIdForCall
        };

        const targetSlotEntId = (targetChildInRack.NodeEntID ?? targetSlotNode.NodeEntID ?? '').toString();

        // Pass ruDeviceIdForCall as idToRefresh so FnBuildRcTreeData properly resolves DeviceView root children
        let ruResult = await FnCallApiToGetDataForTree(
          updatedOriginalTreeData,
          ruNodeForApi,
          featureId,
          statusBarContext,
          sessionList,
          true,
          ruDeviceIdForCall,
          undefined,
          allSitesHierarchyRecords,
          setAllSitesHierarchyRecords
        );

        let ruFormattedChildren = ruResult.formattedTree;
        if (
          (!ruFormattedChildren || ruFormattedChildren.length === 0) &&
          ruDeviceIdForCall !== targetSlotEntId
        ) {
          const altRuResult = await FnCallApiToGetDataForTree(
            updatedOriginalTreeData,
            ruNodeForApi,
            featureId,
            statusBarContext,
            sessionList,
            true,
            targetSlotEntId,
            undefined,
            allSitesHierarchyRecords,
            setAllSitesHierarchyRecords
          );
          if (altRuResult.formattedTree?.length) {
            ruFormattedChildren = altRuResult.formattedTree;
          }
        }

        if (ruFormattedChildren && ruFormattedChildren.length > 0) {
          targetChildInRack.children = ruFormattedChildren;
          targetChildInRack.isLeaf = false;
          targetChildInRack.HasChildren = ruFormattedChildren.length;
          targetChildInRack.MountedDeviceEntID = ruDeviceIdForCall;
        }
      }
    }

    // Preserve existing children of other untouched RU slots in this rack
    preserveExistingRuChildren(formattedRackChildren, rackNode, vacatedSlotNode, targetSlotNode);

    const rackKey = (rackNode.key ?? rackNode.NodeEntID ?? rackId).toString();
    updatedOriginalTreeData = await FnReplaceNodeForRefresh(
      updatedOriginalTreeData,
      rackKey,
      formattedRackChildren,
      featureTreeProps as IFeatureTree,
      featureId,
      true,
      rackNode.stepNo ?? 1,
      true
    );

    if (isInventory && setOriginalTreeDataForInventory && originalTreeDataForInventoryRef) {
      setOriginalTreeDataForInventory(updatedOriginalTreeData);
      originalTreeDataForInventoryRef.current = updatedOriginalTreeData;
    } else {
      setOriginalTreeData(updatedOriginalTreeData);
      originalTreeDataRef.current = updatedOriginalTreeData;
    }

    const clonedRackData = FnDeepClone(formattedRackChildren);
    const refreshedNodes = (await FnRemoveChildrenNodes(
      clonedRackData,
      rackKey,
      featureId,
      featureTreeProps as IFeatureTree,
      updatedOriginalTreeData
    )) ?? [];

    currentTreeData = (await FnReplaceNodeForRefresh(
      currentTreeData,
      rackKey,
      refreshedNodes,
      featureTreeProps as IFeatureTree,
      featureId,
      false,
      rackNode.stepNo ?? 1,
      true
    )) ?? [];

    return formattedRackChildren;
  };

  /* ---------------- Step 1: RU / Rack Drag & Drop Detection ---------------- */
  const dragKey = (dragNode.key ?? dragNode.NodeEntID ?? '').toString();
  const dragParents = dragKey ? FnFindNodeAndParents(currentTreeData, dragKey) ?? [] : [];
  const sourceSlot =
    dragParents.slice(0, -1).reverse().find(isRuOrSlotNode) ??
    (isRuOrSlotNode(dragNode) ? dragNode : null);
  const fromRack =
    dragParents.slice(0, -1).reverse().find(isRackNode) ??
    findRackNode(dragNode, currentTreeData);

  const dropKey = (dropNode.key ?? dropNode.NodeEntID ?? '').toString();
  const dropParents = dropKey ? FnFindNodeAndParents(currentTreeData, dropKey) ?? [] : [];
  const toRack =
    dropParents.slice(0, -1).reverse().find(isRackNode) ??
    findRackNode(dropNode, currentTreeData);
  const targetSlot =
    isRuOrSlotNode(dropNode) ? dropNode : (dropParents.slice().reverse().find(isRuOrSlotNode) ?? dropNode);

  const isRuMove = Boolean(
    fromRack &&
    toRack &&
    (isRuOrSlotNode(targetSlot) || targetSlot.treetype === 'DeviceSlot')
  );

  if (isRuMove && fromRack && toRack) {
    setDefaultSelectedKeys([]);
    if (lastHandledKeyRef) lastHandledKeyRef.current = null;

    const isSameRack =
      fromRack.key === toRack.key ||
      (Boolean(fromRack.NodeEntID) &&
        Boolean(toRack.NodeEntID) &&
        fromRack.NodeEntID === toRack.NodeEntID);

    if (isSameRack) {
      // Single Rack move (RU A -> RU B within same rack)
      await refreshRackNode(toRack, targetSlot, sourceSlot, dragNode);
    } else {
      // Cross Rack move (Rack A -> Rack B)
      // 1. Refresh source rack first and explicitly vacate source slot
      await refreshRackNode(fromRack, null, sourceSlot, null);
      // 2. Then refresh destination rack and load newly mounted device
      await refreshRackNode(toRack, targetSlot, null, dragNode);
    }

    setTreeData(currentTreeData);

    // Locate toRack specifically in currentTreeData to avoid picking nodes from other racks
    const toRackKey = (toRack.key ?? toRack.NodeEntID ?? '').toString();
    const toRackInCurrentTree = findNodeInHierarchy(currentTreeData, n =>
      Boolean(
        (n.key && n.key.toString() === toRackKey) ||
        (n.NodeEntID && toRack.NodeEntID && n.NodeEntID.toString() === toRack.NodeEntID.toString()) ||
        (isRackNode(n) && n.Name && toRack.Name && n.Name.trim().toLowerCase() === toRack.Name.trim().toLowerCase())
      )
    ) ?? toRack;

    // Locate destination RU slot ONLY within the destination rack's subtree
    const refreshedDropSlot = toRackInCurrentTree?.children
      ? findNodeInHierarchy(toRackInCurrentTree.children, n =>
          Boolean(
            (targetSlot.NodeEntID && n.NodeEntID && n.NodeEntID.toString() === targetSlot.NodeEntID.toString()) ||
            (targetSlot.key && n.key && n.key.toString() === targetSlot.key.toString()) ||
            (targetSlot.Name && n.Name && n.Name.trim().toLowerCase() === targetSlot.Name.trim().toLowerCase())
          )
        )
      : null;

    // In configuration features, children of RU slot are DeviceView of the MountedDevice
    let droppedDeviceNode: ITreeNode | null = null;
    if (refreshedDropSlot?.children?.length) {
      // 1. Try matching by view Name (e.g. Front, Rear)
      if (dragNode.Name) {
        droppedDeviceNode = refreshedDropSlot.children.find(
          c => Boolean(c.Name && dragNode.Name && c.Name.trim().toLowerCase() === dragNode.Name.trim().toLowerCase())
        ) ?? null;
      }
      // 2. Try matching by MountedDeviceViewEntID
      if (!droppedDeviceNode && (dragNode as any).MountedDeviceViewEntID) {
        droppedDeviceNode = refreshedDropSlot.children.find(
          c => (c as any).MountedDeviceViewEntID === (dragNode as any).MountedDeviceViewEntID
        ) ?? null;
      }
      // 3. Try finding any child with treetype === 'DeviceView' or NodeType === 'MountedDevice'
      if (!droppedDeviceNode) {
        droppedDeviceNode = refreshedDropSlot.children.find(c => {
          const ctt = (c.treetype ?? c.NodeType ?? '').toLowerCase();
          return ctt === 'deviceview' || ctt === 'mounteddevice';
        }) ?? null;
      }
      // 4. Fallback to first child
      if (!droppedDeviceNode) {
        droppedDeviceNode = refreshedDropSlot.children[0];
      }
    }

    const targetNodeToSelect = droppedDeviceNode ?? refreshedDropSlot ?? targetSlot;
    const targetKey = (targetNodeToSelect.key ?? targetNodeToSelect.NodeEntID ?? '').toString();
    const parents = FnFindNodeAndParents(currentTreeData, targetKey) ?? [];

    if (targetNodeToSelect && parents.length) {
      applySelection(targetNodeToSelect, parents, updatedOriginalTreeData);
    }

    setIsRefreshed?.(true);
    return;
  }

  /* ---------------- Fallback: Non-Rack Container Refresh (Floor / Store / Site) ---------------- */
  const refreshTreeByParent = async (
    parentNode: ITreeNode,
    applySelectionFlag: boolean
  ) => {
    // Single container refresh uses isRefresh = false to reload full container hierarchy
    const filteredResult = await FnCallApiToGetDataForTree(
      updatedOriginalTreeData,
      parentNode,
      featureId,
      statusBarContext,
      sessionList,
      false,
      undefined,
      undefined,
      allSitesHierarchyRecords,
      setAllSitesHierarchyRecords
    );

    if (!filteredResult.formattedTree) return;

    updatedOriginalTreeData = filteredResult.originalTreeData;
    if (isInventory && setOriginalTreeDataForInventory && originalTreeDataForInventoryRef) {
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
      featureId,
      featureTreeProps as IFeatureTree,
      updatedOriginalTreeData
    );

    currentTreeData = await FnAddSubNode(
      currentTreeData,
      parentNode.key,
      removedNodes as ITreeNode[],
      featureTreeProps as IFeatureTree,
      featureId,
      false,
      parentNode.stepNo
    );

    /* ---------------- Selection Logic ---------------- */
    if (applySelectionFlag) {
      setTreeData(currentTreeData);

      // Try finding moved node by dragNode key or NodeEntID
      let parents = FnFindNodeAndParents(
        currentTreeData,
        dragNode.key?.toString() ?? ''
      );
      if (!parents?.length && dragNode.NodeEntID) {
        parents = FnFindNodeAndParents(
          currentTreeData,
          dragNode.NodeEntID.toString()
        );
      }

      let selectedNode = parents?.find(
        p => p.key === dragNode.key || p.NodeEntID === dragNode.NodeEntID
      );

      // Fallback to dropNode if moved node is not resolved
      if (!selectedNode) {
        parents = FnFindNodeAndParents(
          currentTreeData,
          dropNode.key?.toString() ?? ''
        );
        if (!parents?.length && dropNode.NodeEntID) {
          parents = FnFindNodeAndParents(
            currentTreeData,
            dropNode.NodeEntID.toString()
          );
        }
        selectedNode = parents?.find(
          p => p.key === dropNode.key || p.NodeEntID === dropNode.NodeEntID
        );
      }

      if (selectedNode && parents?.length) {
        applySelection(selectedNode, parents, updatedOriginalTreeData);
      }
    }
  };

  /* ---------------- Container Resolution ---------------- */
  const dragContainer = findFloorOrContainer(dragNode, currentTreeData);
  let dropContainer = findFloorOrContainer(dropNode, currentTreeData);
  if (
    dropNode.NodeType?.toLowerCase() === 'floor' &&
    dropNode.isLeaf === false
  ) {
    dropContainer = dropNode;
  }

  // Check if both drag and drop belong to the same Floor / Store
  const isSingleFloor =
    dragContainer &&
    dropContainer &&
    (dragContainer.key === dropContainer.key ||
      (dragContainer.NodeEntID &&
        dropContainer.NodeEntID &&
        dragContainer.NodeEntID === dropContainer.NodeEntID));

  if (isSingleFloor && dropContainer) {
    // Internal drag drop in single Floor: call API once passing isRefresh: false
    setDefaultSelectedKeys([]);
    if (lastHandledKeyRef) lastHandledKeyRef.current = null;
    await refreshTreeByParent(dropContainer, true);
  } else {
    // Cross-container move: refresh source first, then destination with selection
    if (dragContainer) {
      await refreshTreeByParent(dragContainer, !dropContainer);
    }
    if (dropContainer) {
      setDefaultSelectedKeys([]);
      if (lastHandledKeyRef) lastHandledKeyRef.current = null;
      await refreshTreeByParent(dropContainer, true);
    }
  }

  setIsRefreshed?.(true);
};

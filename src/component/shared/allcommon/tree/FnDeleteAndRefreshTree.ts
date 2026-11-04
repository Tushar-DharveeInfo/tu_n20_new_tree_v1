
import { FnGetNodeDetailsBasedOnKey } from './FnGetNodeDetailsBasedOnKey.ts';
import { FnUpdateSession } from '../FnUpdateSession.ts';
import { ITreeNode } from '../../allinterface/tree/ITreeControl.ts';
import { ISessionContextProps } from '../../context/allinterface/ISession.ts';
import { IStatusBar } from '../../context/allinterface/IStatusBar.ts';
import { ISessionVariable } from '../../allinterface/basic/ISessionVariable.ts';
import { FEnums } from '../../../constants/Feature.ts';

/**
 * Delete refresh modes:
 * - 'parent' : The selected node is removed → refresh its parent node (Delete, DeleteBin, DeleteLocation).
 * - 'self'   : The selected node still exists but its children changed → refresh the node itself
 *              (EmptyDevice, EmptyRack, EmptyStore, EmptyBin, DeleteAll, DisposeAll).
 */
export type TDeleteRefreshMode = 'parent' | 'self';

export interface IFnDeleteAndRefreshTreeOptions {
  /** The node that was acted upon (currently selected in the tree). */
  selectedNode: ITreeNode;
  /** Current flat tree data (used to find parent node and build hierarchy). */
  treeData: ITreeNode[];
  /** Which refresh strategy to apply. */
  mode: TDeleteRefreshMode;
  /** Feature ID — determines which session variables to set (Inventory vs Location hierarchy). */
  featureId: string;
  /** Session context — used to update backend session. */
  sessionContext: ISessionContextProps;
  /** Status bar context — used by the session API call. */
  statusBarContext: IStatusBar;
  /**
   * Callback that performs the actual tree refresh.
   * Receives the resolved node to refresh (parent or self).
   * If no node could be resolved, called with undefined so the caller falls back to default behaviour.
   */
  onRefresh: (nodeToRefresh?: ITreeNode) => void;
}

// ---------------------------------------------------------------------------
// Hierarchy helpers (mirrors ExplorerContainer.tsx updateSessionFromNode /
// updateInventorySessionFromNode logic)
// ---------------------------------------------------------------------------

const isNodeMatch = (node: ITreeNode, target: ITreeNode | string): boolean => {
  if (!node) return false;
  if (typeof target === 'object' && target !== null) {
    if (node === target) return true;
    const targetKey = target.key != null ? String(target.key) : '';
    const targetEntId = target.NodeEntID != null ? String(target.NodeEntID) : '';
    if (targetKey && isNodeMatch(node, targetKey)) return true;
    if (targetEntId && isNodeMatch(node, targetEntId)) return true;
    return false;
  }

  if (target === undefined || target === null || target === '') return false;

  const tStr = String(target).toLowerCase();
  const tBase = tStr.split('##')[0];

  const nodeKey = node.key != null ? String(node.key).toLowerCase() : '';
  const nodeKeyBase = nodeKey.split('##')[0];

  const nodeEntId = node.NodeEntID != null ? String(node.NodeEntID).toLowerCase() : '';
  const nodeEntIdBase = nodeEntId.split('##')[0];

  return (
    nodeKey === tStr ||
    nodeKey === tBase ||
    nodeKeyBase === tStr ||
    (nodeKeyBase !== '' && tBase !== '' && nodeKeyBase === tBase) ||
    nodeEntId === tStr ||
    nodeEntId === tBase ||
    nodeEntIdBase === tStr ||
    (nodeEntIdBase !== '' && tBase !== '' && nodeEntIdBase === tBase)
  );
};

/** Walks the tree to collect the ancestor path from root down to the target node (inclusive). */
const getParentHierarchy = (treeData: ITreeNode[], target: ITreeNode | string): ITreeNode[] => {
  const path: ITreeNode[] = [];
  const dfs = (nodes: ITreeNode[], current: ITreeNode[]): boolean => {
    for (const node of nodes) {
      const next = [...current, node];
      if (isNodeMatch(node, target)) {
        path.push(...next);
        return true;
      }
      if (node.children && dfs(node.children, next)) return true;
    }
    return false;
  };
  if (Array.isArray(treeData)) {
    dfs(treeData, []);
  }
  return path;
};

/**
 * Resolves the parent node of `target` in `treeData`.
 * 1. Traverses `treeData` top-down to find the ancestor path down to `target`.
 *    If found, the parent is the node immediately before `target` in the path.
 * 2. If hierarchy lookup does not yield a parent, falls back to `target.parentEntID`.
 * 3. Fallback to candidate parent keys (FloorEntID, RoomEntID, StoreEntID, etc.).
 * 4. Fallback for Location nodes: searches `treeData` for the containing or nearest Floor node.
 */
const findParentOfNode = (treeData: ITreeNode[], target: ITreeNode): ITreeNode | undefined => {
  if (!treeData || !target) return undefined;

  // 1. Direct hierarchy path lookup (top-down DFS)
  const path = getParentHierarchy(treeData, target);
  if (path.length >= 2) {
    return path[path.length - 2];
  }

  // 2. Lookup by parentEntID if present
  if (target.parentEntID) {
    const parentPath = getParentHierarchy(treeData, target.parentEntID);
    if (parentPath.length > 0) {
      return parentPath[parentPath.length - 1];
    }
    const basedOnKey = FnGetNodeDetailsBasedOnKey(treeData, target.parentEntID);
    if (basedOnKey?.node) {
      return basedOnKey.node;
    }
  }

  // 3. Fallback for specific parent ID properties on target
  const anyTarget = target as any;
  const parentIdCandidate =
    anyTarget.FloorEntID ??
    anyTarget.FloorID ??
    anyTarget.StoreEntID ??
    anyTarget.StoreID ??
    anyTarget.RoomEntID ??
    anyTarget.SiteEntID;

  if (parentIdCandidate) {
    const candidatePath = getParentHierarchy(treeData, String(parentIdCandidate));
    if (candidatePath.length > 0) {
      return candidatePath[candidatePath.length - 1];
    }
    const candidateNode = FnGetNodeDetailsBasedOnKey(treeData, String(parentIdCandidate));
    if (candidateNode?.node) {
      return candidateNode.node;
    }
  }

  // 4. Fallback for Location node: find the parent Floor node
  const nodeType = (target.NodeType || target.treetype || '').toLowerCase();
  if (nodeType === 'location') {
    let floorNode: ITreeNode | undefined;
    const findFloor = (nodes: ITreeNode[], currentFloor?: ITreeNode): boolean => {
      for (const n of nodes) {
        const isFloor = (n.NodeType || n.treetype || '').toLowerCase() === 'floor';
        const activeFloor = isFloor ? n : currentFloor;
        if (isNodeMatch(n, target)) {
          floorNode = activeFloor;
          return true;
        }
        if (n.children && findFloor(n.children, activeFloor)) {
          return true;
        }
      }
      return false;
    };
    findFloor(treeData);
    if (floorNode) return floorNode;
  }

  return undefined;
};

/** Builds a `NodeType → ITreeNode` lookup from a flat hierarchy array. */
const toHierarchyMap = (hierarchy: ITreeNode[]): Record<string, ITreeNode> => {
  const map: Record<string, ITreeNode> = {};
  hierarchy.forEach(node => {
    const type = (node.NodeType || node.treetype || (node as any).Type || '').toLowerCase();
    if (type) map[type] = node;
  });
  return map;
};

const push = (
  session: ISessionVariable[],
  context: string,
  name: string,
  value: unknown
) => {
  session.push({ VariableContext: context, VariableName: name, SessionValue: (value ?? '') as string });
};

/**
 * Builds session variables for Inventory features (InventoryManagement / InventoryConfiguration).
 * Mirrors ExplorerContainer.tsx `updateInventorySessionFromNode`.
 */
const buildInventorySession = (node: ITreeNode, treeData: ITreeNode[]): ISessionVariable[] => {
  const session: ISessionVariable[] = [];
  const hierarchy = getParentHierarchy(treeData, node);
  const map = toHierarchyMap(hierarchy);

  // Base node variables
  push(session, 'Node', 'SelectedNodeID', node.NodeEntID?.split('##')[0] ?? node.NodeEntID);
  push(session, 'Node', 'SelectedNodeName', node.Name);
  push(session, 'Node', 'SelectedNodeEntity', node.NodeEntityname || node.NodeType || node.treetype || '');

  // Inventory hierarchy
  push(session, 'Inventory', 'SiteID', map['site']?.NodeEntID);
  push(session, 'Inventory', 'SiteName', map['site']?.Name);
  push(session, 'Inventory', 'InventoryID', map['inventory']?.NodeEntID);
  push(session, 'Inventory', 'InventoryName', map['inventory']?.Name);
  push(session, 'Inventory', 'StoreID', map['store']?.NodeEntID);
  push(session, 'Inventory', 'StoreName', map['store']?.Name);
  push(session, 'Inventory', 'BinID', map['bin']?.NodeEntID);
  push(session, 'Inventory', 'BinName', map['bin']?.Name);
  push(session, 'Inventory', 'MfgName', map['manufacturer']?.Name ?? '');
  push(session, 'Inventory', 'EqTypeName', map['eqtype']?.Name ?? '');

  return session;
};

/**
 * Builds session variables for normal DC features.
 * Mirrors ExplorerContainer.tsx `updateSessionFromNode`.
 */
const buildLocationSession = (node: ITreeNode, treeData: ITreeNode[]): ISessionVariable[] => {
  const session: ISessionVariable[] = [];
  const hierarchy = getParentHierarchy(treeData, node);
  const map = toHierarchyMap(hierarchy);

  // Base node variables
  push(session, 'Node', 'SelectedNodeID', node.NodeEntID?.split('##')[0] ?? node.NodeEntID);
  push(session, 'Node', 'SelectedNodeName', node.Name);
  push(session, 'Node', 'SelectedNodeEntity', node.NodeEntityname || node.NodeType || node.treetype || '');

  // Location hierarchy (Site → Room → Floor → Location)
  (['site', 'room', 'floor', 'location'] as const).forEach(type => {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    push(session, 'Location', `${cap}ID`, map[type]?.NodeEntID);
    push(session, 'Location', `${cap}Name`, map[type]?.Name);
  });

  // Clear mounted device and selected port if current node is not mounted device / port
  const currentType = (node.NodeType || node.treetype || '').toLowerCase();
  if (currentType !== 'mounteddevice') {
    push(session, 'MountedDevice', 'MountedDeviceNodeID', '');
    push(session, 'MountedDevice', 'MountedDeviceNodeName', '');
  }
  if (!['port', 'inoutplug', 'slot', 'ru', 'pm'].includes(currentType)) {
    push(session, 'SelectedPortNode', 'PortEntID', '');
    push(session, 'SelectedPortNode', 'PortContainedByEntityName', '');
  }

  return session;
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * After a delete/empty operation:
 *  1. Resolves the correct node to select (parent for actual deletes, self for empty/dispose).
 *  2. Only for 'parent' mode: builds the correct session hierarchy and calls UpdateSession
 *       so the backend knows the parent node is now selected.
 *       Skipped for 'self' mode — the node still exists, no selection change needed.
 *  3. Calls `onRefresh` with the resolved node to refresh the tree.
 */
export const FnDeleteAndRefreshTree = async (options: IFnDeleteAndRefreshTreeOptions): Promise<void> => {
  const { selectedNode, treeData, mode, featureId, sessionContext, statusBarContext, onRefresh } = options;

  // Step 1 — resolve which node to refresh / select
  let nodeToRefresh: ITreeNode | undefined;

  if (mode === 'parent') {
    // The node was deleted — move selection up to its parent.
    nodeToRefresh = findParentOfNode(treeData, selectedNode);

    // Step 2 — update backend session to reflect the new selection (parent node).
    // Only done in 'parent' mode because in 'self' mode the selected node doesn't change.
    if (nodeToRefresh) {
      const isInventory =
        featureId === FEnums.InventoryManagement ||
        featureId === FEnums.InventoryConfiguration;

      const sessionData = isInventory
        ? buildInventorySession(nodeToRefresh, treeData)
        : buildLocationSession(nodeToRefresh, treeData);

      await FnUpdateSession(sessionData, sessionContext, statusBarContext);
    }
  } else {
    // 'self' mode — the node itself still exists, keep selection on it.
    // No UpdateSession call needed: the selected node hasn't changed.
    nodeToRefresh = selectedNode;
  }

  // Step 3 — refresh the tree at the resolved node
  onRefresh(nodeToRefresh);
};

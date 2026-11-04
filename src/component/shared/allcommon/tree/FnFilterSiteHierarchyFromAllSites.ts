import { IAllSitesHierarchy } from '../../context/allinterface/IMainApp';
import { ISession } from '../../context/allinterface/ISession';

/**
 * Extracts the active SiteID from session variable list.
 */
export const getSiteIdFromSessionList = (
  sessionList?: Array<ISession | { VariableName?: string; SessionValue?: string }>
): string => {
  if (!Array.isArray(sessionList)) return '';
  const siteItem = sessionList.find(
    (item) => item?.VariableName?.toLowerCase() === 'siteid'
  );
  return siteItem?.SessionValue ? String(siteItem.SessionValue) : '';
};

/**
 * Checks whether a flat hierarchy row matches the target site ID.
 */
export const isRecordMatchingSite = (row: unknown, targetSiteId: string): boolean => {
  if (!row || typeof row !== 'object') return false;
  const item = row as Record<string, unknown>;
  const rawSiteEntId = String(item.SiteEntID ?? item.SiteID ?? '');
  if (rawSiteEntId) {
    if (rawSiteEntId === targetSiteId || rawSiteEntId.split('##')[0] === targetSiteId) {
      return true;
    }
  }
  const entId = String(item.EntID ?? item.NodeEntID ?? '');
  if (entId === targetSiteId) {
    return true;
  }
  return false;
};

/**
 * Filters allSitesHierarchyRecords (StoreHierarchy for inventory, DCHierarchy for others)
 * by the given siteId and returns flat hierarchy data suitable for tree conversion.
 */
export const FnFilterSiteHierarchyFromAllSites = (
  allSitesHierarchy?: IAllSitesHierarchy | null,
  siteId?: string | null,
  isInventory: boolean = false
): Record<string, unknown[]> | null => {
  if (!allSitesHierarchy || !siteId) {
    return null;
  }

  const rawHierarchy = isInventory
    ? allSitesHierarchy.StoreHierarchy
    : allSitesHierarchy.DCHierarchy;

  if (!rawHierarchy) {
    return null;
  }

  const hierarchyKey = isInventory ? 'StoreHierarchy' : 'DCHierarchy';

  if (Array.isArray(rawHierarchy)) {
    const filtered = rawHierarchy.filter((row) => isRecordMatchingSite(row, siteId));
    if (!filtered.length) {
      return null;
    }
    return { [hierarchyKey]: filtered };
  }

  if (typeof rawHierarchy === 'object') {
    const result: Record<string, unknown[]> = {};
    let hasMatches = false;

    for (const [key, value] of Object.entries(rawHierarchy)) {
      if (Array.isArray(value)) {
        const filtered = value.filter((row) => isRecordMatchingSite(row, siteId));
        result[key] = filtered;
        if (filtered.length > 0) {
          hasMatches = true;
        }
      } else {
        result[key] = value as unknown[];
      }
    }

    return hasMatches ? result : null;
  }

  return null;
};

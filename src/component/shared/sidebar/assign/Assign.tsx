
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SelectedItems } from '@n20a/libform'
import type { IGroups } from '@n20a/libform'
import '@n20a/libform/style.css'
import { AssignmentItem, IAssign } from '../../allinterface/sidebar/IAssign'
import { DEVICE, EM, MISC } from '../../interceptors/EndPoints'
import { axiosInterceptor } from '../../interceptors/Interceptor'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks'
import { FnHideShowSaveIconForForm } from '../../allcommon/basic/FnHideShowSaveIconForForm'
import { DELIMITER } from '../../alldefaultprops/basic/DefaultPropsChekedListBoxControl'
import { FnGetSessionVariableFromStorage } from '../../allcommon/basic/FnGetSessionVariableFromStorage'
import { useSessionContext } from '../../context/hooks/SessionHooks'
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely'
import { FEnums } from '../../../constants/Feature'

type AssignmentRecord = Record<string, unknown>

type AssignmentSelectGroup = IGroups['GroupArray'][number] & {
    selectOne?: boolean;
};

const TAG_GROUP_NAME = 'Tag';
const TRAY_GROUP_NAME = 'Plan Tray';

// Read the first available field from the API record and return it as text.
const getTextValue = (item: AssignmentRecord, keys: string[], defaultValue = '') => {
    const value = keys.map((key) => item[key]).find((keyValue) => keyValue !== undefined && keyValue !== null && keyValue !== '');
    return value !== undefined && value !== null ? String(value) : defaultValue;
}

// Plan Tray records are tag partners flagged with isnz / isNZ / IsNZ.
const isTrayRecord = (item: AssignmentRecord): boolean => {
    const isnzValue = item.isnz ?? item.isNZ ?? item.IsNZ;
    if (typeof isnzValue === 'boolean') {
        return isnzValue;
    }
    if (typeof isnzValue === 'number') {
        return isnzValue === 1;
    }
    if (typeof isnzValue === 'string') {
        const normalized = isnzValue.trim().toLowerCase();
        return normalized === 'true' || normalized === '1';
    }
    return false;
};

// Plan Tray UI group still persists under the Tag assignment group in the API.
const getAssignmentSaveGroupName = (uiGroupName: string, itemGroupName?: string): string => {
    if (uiGroupName === TRAY_GROUP_NAME) {
        return TAG_GROUP_NAME;
    }
    return itemGroupName || uiGroupName;
};

// Map one authorized partner record to a SelectedItems assignment row.
const mapRecordToAssignmentItem = (
    itemRecord: AssignmentRecord,
    saveGroupName: string
): AssignmentItem => {
    const name = getTextValue(itemRecord, ['_Partner', 'PartnerName', 'Name']);
    const desc = getTextValue(
        itemRecord,
        ['Purpose', 'Desc', 'description', 'Description', '_Desc', '_Description'],
        name
    );
    const partnerCount = getTextValue(itemRecord, ['partner_count']);
    const selectedValue = itemRecord.Selected ?? itemRecord.selected;

    return {
        assigned: Boolean(selectedValue),
        name: `${name}${Number(partnerCount) > 0 ? ` (${partnerCount})` : ""}`,
        desc,
        groupName: saveGroupName,
        partnerEntID: getTextValue(itemRecord, ['EntID', 'PartnerEntID', 'PartnerID']),
        partnerEntityName: getTextValue(itemRecord, ['PartnerEntityName', 'EntityName'], 'Partner'),
        recID: getTextValue(
            itemRecord,
            ['RecID', 'SelectedID', 'selectedID'],
            typeof selectedValue === 'string' ? selectedValue : ''
        )
    };
};

// Sort assignment rows by display name (A to Z).
const sortAssignmentItemsByName = (items: AssignmentItem[]): AssignmentItem[] =>
    [...items].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
    );

// Sort assignment groups and their items by name (A to Z).
const sortAssignmentGroupsByName = (groups: AssignmentSelectGroup[]): AssignmentSelectGroup[] =>
    [...groups]
        .map((group) => ({
            ...group,
            Items: sortAssignmentItemsByName(group.Items as AssignmentItem[]),
        }))
        .sort((left, right) =>
            left.GroupName.localeCompare(right.GroupName, undefined, { sensitivity: 'base' })
        );

// Plan Tray/Tag is UI-only: both save to API as GroupName "Tag".
// isnz true  -> Plan Tray section (selectOne / single check)
// isnz false -> Tag section (multiple check)
const buildAssignmentSelectGroups = (
    groupName: string,
    records: AssignmentRecord[]
): AssignmentSelectGroup[] => {
    const authorizedRecords = records.filter((item) => Boolean(item?.Authorized));

    if (groupName.toLowerCase() !== TAG_GROUP_NAME.toLowerCase()) {
        return [{
            GroupName: groupName,
            Items: authorizedRecords.map((item) => mapRecordToAssignmentItem(item, groupName))
        }];
    }

    const trayItems = authorizedRecords
        .filter(isTrayRecord)
        .map((item) => mapRecordToAssignmentItem(item, TAG_GROUP_NAME));

    const tagItems = authorizedRecords
        .filter((item) => !isTrayRecord(item))
        .map((item) => mapRecordToAssignmentItem(item, TAG_GROUP_NAME));

    const groups: AssignmentSelectGroup[] = [];

    if (trayItems.length > 0) {
        groups.push({
            GroupName: TRAY_GROUP_NAME,
            selectOne: true,
            Items: trayItems
        });
    }

    if (tagItems.length > 0) {
        groups.push({
            GroupName: TAG_GROUP_NAME,
            Items: tagItems
        });
    }

    return groups;
};

// Convert the assignment API response into the grouped format required by SelectedItems.
const getAssignmentGroups = (
    data: AssignmentRecord,
    isReadOnly: boolean,
    assignmentType?: IAssign['assignmentType'] | string,
    featureId?: string
): IGroups => {
    const normalizedAssignmentType = assignmentType?.trim().toLowerCase();

    const groupArray = Array.isArray(data?.Partners)
        ? data.Partners
            .filter((group) => {
                const groupRecord = group as AssignmentRecord;
                const groupName = getTextValue(groupRecord, ['Name', 'GroupName']);

                const authorizedRecords = Array.isArray(groupRecord?.Records)
                    ? groupRecord.Records.filter(
                        (item: AssignmentRecord) => Boolean(item?.Authorized)
                    )
                    : [];

                if (authorizedRecords.length === 0 || groupName === "Licensee") {
                    return false;
                }

                if (normalizedAssignmentType) {
                    const normalizedGroupName = groupName.trim().toLowerCase();
                    if (normalizedAssignmentType === TRAY_GROUP_NAME.toLowerCase()) {
                        return normalizedGroupName === TAG_GROUP_NAME.toLowerCase();
                    }
                    return normalizedGroupName === normalizedAssignmentType;
                }

                return true;
            })
            .flatMap((group) => {
                const groupRecord = group as AssignmentRecord;
                const groupName = getTextValue(groupRecord, ['Name', 'GroupName']);
                const records = Array.isArray(groupRecord.Records) ? groupRecord.Records as AssignmentRecord[] : [];
                return buildAssignmentSelectGroups(groupName, records);
            })
            .filter((group) => {
                const groupNameLower = group.GroupName.toLowerCase();
                const isTray = groupNameLower === TRAY_GROUP_NAME.toLowerCase();
                const isTag = groupNameLower === TAG_GROUP_NAME.toLowerCase();

                if (String(featureId).trim() === FEnums.AssetAssignment && isTray) {
                    return false;
                }
                if (String(featureId).trim() === FEnums.AssetAssignmentPlan && isTag) {
                    return false;
                }
                if (normalizedAssignmentType === TRAY_GROUP_NAME.toLowerCase()) {
                    return isTray;
                }
                return true;
            })
        : [];

    return {
        Readonly: isReadOnly ?? false,
        Title: 'Device Assignments',
        GroupArray: sortAssignmentGroupsByName(groupArray)
    };
};

// Get existing assignment table records so we can reuse RecID when updating or deleting.
const getAssignmentData = (statusBarContext: ReturnType<typeof useStatusBarContext>): Promise<AssignmentRecord[]> => {
    return new Promise((resolve, reject) => {
        axiosInterceptor(
            {
                url: MISC.GetTableData,
                data: {
                    tableName: 'pg.assignment',
                },
                setFetchData: (response: unknown, status?: string) => {
                    try {
                        if (
                            status === "200" &&
                            response &&
                            typeof response === 'object' &&
                            'dataJson' in response &&
                            response.dataJson
                        ) {
                            const parsed = JSON.parse(response.dataJson as string);
                            resolve(Array.isArray(parsed) ? parsed : []);
                        } else {
                            resolve([]);
                        }
                    } catch (error) {
                        console.error('Error in handle api response  :', error);
                        reject(error);
                    }
                },
            },
            statusBarContext
        );
    });
}


// Find an already saved assignment for the same group, partner, and device.
const findAssignmentRecord = (
    tableData: AssignmentRecord[],
    tableItem: AssignmentRecord
) => tableData.find((item) =>
    String(item.GroupName).toLowerCase() === String(tableItem.GroupName).toLowerCase() &&
    String(item.PartnerEntID) === String(tableItem.PartnerEntID) &&
    String(item.EntID) === String(tableItem.EntID)
);

const Assign = (propsAssing: IAssign) => {
    const [assignmentGroups, setAssignmentGroups] = useState<IGroups | null>(null);
    const [assignmentVersion, setAssignmentVersion] = useState(0);
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const sessionContext = useSessionContext();
    useEffect(() => {
        statusBarContextRef.current = statusBarContext;
    }, [statusBarContext])

    // Keep this callback dependent on the selected device and assignment type to avoid repeated reloads.
    const loadAssignmentData = useCallback(() => {
        if (!propsAssing.selectedNode?.NodeEntID) {
            setAssignmentGroups(null);
            return;
        }

        axiosInterceptor({
            url: DEVICE.AssignmentArray,
            data: {
                deviceID: propsAssing.selectedNode.NodeEntID
            },
            setFetchData: async (apiResp: unknown, status?: string) => {
                if (status === '200' && apiResp && typeof apiResp === 'object' && 'partnerJson' in apiResp) {

                    setAssignmentGroups(
                        getAssignmentGroups(
                            FnParseJsonSafely(apiResp.partnerJson as string),
                            propsAssing.isReadOnly as boolean,
                            propsAssing.assignmentType,
                            propsAssing.featureId
                        )
                    );
                    setAssignmentVersion((version) => version + 1);
                }
            }
        }, statusBarContextRef.current);
    }, [propsAssing.selectedNode?.NodeEntID, propsAssing.assignmentType, propsAssing.isReadOnly, propsAssing.featureId])

    useEffect(() => {
        loadAssignmentData();
    }, [loadAssignmentData])

    async function handleSaveAssignments(changedGroups: IGroups) {

        if (!propsAssing.selectedNode?.NodeEntID) return;
        const siteName = FnGetSessionVariableFromStorage('Location', "SiteName", sessionContext.SessionList);
        const SiteID = FnGetSessionVariableFromStorage('Location', "SiteID", sessionContext.SessionList);
        const roomName = FnGetSessionVariableFromStorage('Location', "RoomName", sessionContext.SessionList);
        const RoomID = FnGetSessionVariableFromStorage('Location', "RoomID", sessionContext.SessionList);
        const floorName = FnGetSessionVariableFromStorage('Location', "FloorName", sessionContext.SessionList);
        const floorID = FnGetSessionVariableFromStorage('Location', "FloorID", sessionContext.SessionList);
        const locationName = FnGetSessionVariableFromStorage('Location', "LocationName", sessionContext.SessionList);
        const Locationid = FnGetSessionVariableFromStorage('Location', "LocationID", sessionContext.SessionList);

        const locationObj = {
            SiteEntityName: "Site",
            FloorEntityName: "Floor",
            RoomEntityName: "Room",
            LocationEntityName: "Location",

            SiteName: siteName?.[0]?.SessionValue ?? "",
            SiteEntID: SiteID?.[0]?.SessionValue ?? "",
            RoomName: roomName?.[0]?.SessionValue ?? "",
            RoomEntID: RoomID?.[0]?.SessionValue ?? " ",

            FloorName: floorName?.[0]?.SessionValue ?? "",
            FloorEntID: floorID?.[0]?.SessionValue ?? "",

            LocationName: locationName?.[0]?.SessionValue ?? "",
            LocationEntID: Locationid?.[0]?.SessionValue ?? ""
        };
        const oldData = await getAssignmentData(statusBarContext);
        const payload: AssignmentRecord[] = [];
        const deleteRecIDs: string[] = [];
        const deleteEntIDs: string[] = [];
        const trayPartnerEntIDs = (assignmentGroups?.GroupArray.find(
            (group) => group.GroupName === TRAY_GROUP_NAME
        )?.Items ?? [])
            .map((trayItem) => String((trayItem as AssignmentItem).partnerEntID))
            .filter(Boolean);

        // Tray UI selection is stored as Tag in PG.Assignment (same as regular tags).
        changedGroups.GroupArray.forEach((group) => {
            group.Items.forEach((changedItem) => {
                const item = changedItem as AssignmentItem;

                const assignmentPayload: AssignmentRecord = {
                    GroupName: getAssignmentSaveGroupName(group.GroupName, item.groupName),
                    PartnerEntID: item.partnerEntID,
                    PartnerEntityName: item.partnerEntityName || 'Partner',
                    EntityName: propsAssing.selectedNode.NodeEntityname,
                    EntID: propsAssing.selectedNode.NodeEntID,
                    RecID: item.recID || undefined
                };

                const existingRecord = findAssignmentRecord(oldData, assignmentPayload);
                if (existingRecord?.RecID) {
                    assignmentPayload.RecID = existingRecord.RecID;
                }

                if (item.assigned) {
                    if (group.GroupName === TRAY_GROUP_NAME) {
                        oldData.forEach((record) => {
                            const partnerEntID = String(record.PartnerEntID ?? '');
                            const recID = record.RecID ? String(record.RecID) : '';
                            if (
                                String(record.GroupName).toLowerCase() === TAG_GROUP_NAME.toLowerCase() &&
                                trayPartnerEntIDs.includes(partnerEntID) &&
                                partnerEntID !== String(item.partnerEntID) &&
                                recID &&
                                !deleteRecIDs.includes(recID)
                            ) {
                                deleteRecIDs.push(recID);
                                deleteEntIDs.push(String(propsAssing.selectedNode.NodeEntID));
                            }
                        });
                    }

                    payload.push({ ...assignmentPayload, ...locationObj });
                } else if (assignmentPayload.RecID) {
                    deleteRecIDs.push(String(assignmentPayload.RecID));
                    deleteEntIDs.push(String(assignmentPayload.EntID));
                }

            });
        });

        if (payload.length) {
            const updatedPayload = payload.map((item) => {
                if (!item.LocationEntityName) {
                    item.LocationEntityName = 'Location';
                }
                return item;
            })

            axiosInterceptor({
                url: EM.AddUpdateMultipleTableRecords,
                data: {
                    jsonString: JSON.stringify({
                        'PG.Assignment': updatedPayload,
                    })
                },
                allowShowLoader: true,
                setFetchData: (_resp: unknown, status?: string) => {
                    FnHideShowSaveIconForForm('hide');
                    // When delete also runs, let the delete response refresh the data once.
                    if (status === '200' && !deleteRecIDs.length) {
                        loadAssignmentData();
                    }
                }
            }, statusBarContext);
        }

        if (deleteRecIDs.length) {
            axiosInterceptor({
                url: EM.DeleteTableRecords,
                data: {
                    tableName: 'PG.Assignment',
                    recIDs: deleteRecIDs.join(DELIMITER.separator),
                    entIDs: deleteEntIDs.join(DELIMITER.separator)
                },
                allowShowLoader: !payload.length,
                setFetchData: (_resp: unknown, status?: string) => {
                    FnHideShowSaveIconForForm('hide');
                    if (status === '200') {
                        loadAssignmentData();
                    }
                }
            }, statusBarContext);
        }
    }
    return (
        <div className='nz-assign-container'>
            {assignmentGroups && (
                <SelectedItems
                    key={`${propsAssing.selectedNode?.NodeEntID || propsAssing.uniqueName}-${propsAssing.assignmentType || ''}-${propsAssing.featureId || ''}-${assignmentVersion}`}
                    groups={assignmentGroups}
                    onSave={handleSaveAssignments}
                />
            )}
        </div>
    )
}
export { Assign }

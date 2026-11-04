type AuthorizeUserCardRecord = Record<string, unknown>;

const getRecordSortName = (record: AuthorizeUserCardRecord, nameKeys: string[]): string => {
    for (const key of nameKeys) {
        const value = record[key];
        if (value !== undefined && value !== null && String(value).trim()) {
            return String(value).trim();
        }
    }
    return '';
};

// Sorts authorize-user card records by display name (A to Z).
const sortAuthorizeUserCards = <T extends AuthorizeUserCardRecord>(
    records: T[],
    nameKeys: string[]
): T[] =>
    [...records].sort((left, right) =>
        getRecordSortName(left, nameKeys).localeCompare(
            getRecordSortName(right, nameKeys),
            undefined,
            { sensitivity: 'base' }
        )
    );

export {
    sortAuthorizeUserCards,
};

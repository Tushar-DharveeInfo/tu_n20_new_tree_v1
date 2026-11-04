
const FnMergeTableDataWithPrifixKeys = (
    entity: Record<string, any>,
    pgRecord: Record<string, any> | undefined,
    entityPrefix: string,
    pgPrefix: string
): Record<string, any> => {
    const merged: Record<string, any> = {};

    const getPrefix = (prefix: string) => prefix.replace(/\s+/g, "");

    const entityKeyPrefix = getPrefix(entityPrefix);
    const pgKeyPrefix = getPrefix(pgPrefix);

    if (pgRecord) {
        Object.entries(pgRecord).forEach(([key, value]) => {
            merged[`${pgKeyPrefix}_${key}`] = value;
        });
    }

    Object.entries(entity).forEach(([key, value]) => {
        merged[`${entityKeyPrefix}_${key}`] = value;
    });

    return merged;
};
export { FnMergeTableDataWithPrifixKeys }
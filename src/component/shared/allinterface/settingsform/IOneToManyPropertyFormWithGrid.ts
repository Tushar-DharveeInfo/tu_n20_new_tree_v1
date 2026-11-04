
interface IOneToManyPropertyFormWithGrid {
    uniqueName: string;
    headerText: string;
    propertyData: string | Record<string, any>[];
    allowAdd?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    handleValueChange?: (records: Record<string, any>[], name: string, isDefault?: boolean) => void;
}

export type { IOneToManyPropertyFormWithGrid }
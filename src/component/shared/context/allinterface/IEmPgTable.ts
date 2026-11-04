
interface IEmPgItem {
  TableName: string;
  PName: string;
  RequiredToAddRecord: boolean;
  RequiredToUpdateRecord: boolean;
  DefaultValue: string;
  DisplayControl: string;
  ExcludeDataGridField?: boolean | number | string;
  [key: string]: unknown; // Allow additional properties
}

interface IEmPgTable {
  EmPgTableRecords: IEmPgItem[] | undefined;
  setEmPgTableRecords: (data: IEmPgItem[]) => void;
}

export type { IEmPgTable, IEmPgItem }
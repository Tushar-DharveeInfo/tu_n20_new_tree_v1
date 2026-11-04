
import { Key } from 'rc-tree/lib/interface';
import { ITreeNode } from '../../../../shared/allinterface/tree/ITreeControl';

interface IImportDeviceContainer {
    uniqueName: string;
    featureId: string; // featureId for condition
    entityName?: string;
}

interface ICheckedTreeKeys {
    checked: Key[];
    halfChecked: Key[];
}

interface IFnGetKeyFromEntIdResult {
    key: Key | "";
    node: { node: ITreeNode } | null;
}

export type { IImportDeviceContainer, ICheckedTreeKeys, IFnGetKeyFromEntIdResult }
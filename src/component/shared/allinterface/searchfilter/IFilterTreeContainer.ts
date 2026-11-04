
import { Key } from "rc-tree/lib/interface";
import { CheckInfo } from "rc-tree/lib/Tree";
import { ITreeNode } from "../tree/ITreeControl";

interface IFilterTreeContainer {
    uniqueName: string;//Unique identifier for the control
    defaultSiteEntID: Key | null; // default site id to set checked
    defaultRoomEntID?: Key;
    featureId?: string;
    handleNodeCheck?: (checked: { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => void; // callback event to handle node check 
    onTreeLoadingChange?: (isLoading: boolean) => void;
}

export type { IFilterTreeContainer }
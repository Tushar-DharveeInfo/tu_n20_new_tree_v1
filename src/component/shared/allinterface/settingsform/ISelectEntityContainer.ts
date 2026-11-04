
import { CheckInfo } from "rc-tree/lib/Tree";
import { Key } from "rc-tree/lib/interface";
import { ITreeNode, ISelectedNodeInfo } from "../tree/ITreeControl";

// This interface will be used in the Import Tree component
interface ISelectEntityContainer {
  uniqueName: "import-tree" | 'export-tree' | string; //uniqueName for the control and required
  handleCheckNode: (
    checked:
      | {
        checked: Key[];
        halfChecked: Key[];
      }
      | Key[],
    info: CheckInfo<ITreeNode>,
    treeData: ITreeNode[]
  ) => void; // this function returns check tree data
  isShowUpdateOnly: boolean;
  isShowExcludeRecID: boolean;
  featureId: string;
  entityName?: string;
  featureName?: string;
  defaultStrictlyCheckedKeys?: {
    checked: Key[];
    halfChecked: Key[];
  }; // default strictly checked keys to set if already tree data generated
  hideSelectAll?: boolean;
  isRefeshTree?: boolean;
  handleNodeSelect: (selectedKeys: Key[], info: ISelectedNodeInfo, treedata?: ITreeNode[]) => void; // Event handler for selecting nodes
  handleValueChangeForExcludeRecID?: (value: string) => void;
  handleCheckboxChange?: (name: string, value: string) => void
  removeRefeshVariable?: () => void

}
export type { ISelectEntityContainer }
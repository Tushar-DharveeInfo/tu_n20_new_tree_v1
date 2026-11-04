
import { Key } from "rc-tree/lib/interface";
import { CheckInfo } from "rc-tree/lib/Tree";
import { IControl } from "../../../../shared/allinterface/settingsform/ISettingsLibForm";
import { IFeatureTree } from "../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITreeNode, ISelectedNodeInfo } from "../../../../shared/allinterface/tree/ITreeControl";
import { IActionImage } from "../../../../shared/allinterface/basic/IActionImage";
import { JSX } from "react";


interface ITreeWithFormEditor {
    uniqueName: string; // Unique identifier for the form container
    formControls: IControl[]; // Array of form control configurations
    treeData: ITreeNode[];// Hierarchical API data to render tree 
    featureTreeProps: IFeatureTree;// for control tree actions
    allowShowHeader: boolean; // indicates whether to show header of form or not
    isDisableForm: boolean;// whether to disable form or not
    entityName?: string;
    headerTextForTree?: string; // if passed it will show header in for tree
    defaultExpandedKeys?: Key[]; // default expanded keys to set if already tree data generated
    defaultSelectedKeys?: Key[]; // default selected keys to set if already tree data generated
    defaultCheckedKeys?: Key[]; // default checked keys to set if already tree data generated
    defaultStrictlyCheckedKeys?: {
        checked: Key[];
        halfChecked: Key[];
    }; // default strictly checked keys to set if already tree data generated
    defaultSelectedNodeInfo?: ISelectedNodeInfo;// selected Node info if initially selection needed 
    headerText?: string; // if provided it will show custom header text else it will show the header based on id
    allowAdd?: boolean; // Flag to allow adding items in the action list
    allowDelete?: boolean; // Flag to allow deleting items in the action list
    customIcons?: IActionImage[]; // To allow custom icons
    componentToRender?: JSX.Element;// to render component instead of form 
    showEditButton?: boolean; // Flag to show the edit button in the action list
    disableAdd?: boolean; // To disable Add
    disableEdit?: boolean; //To disable Edit
    disableDelete?: boolean; // To disable Delete
    isAutoSave?: boolean; // Enables auto-save functionality
    featureId?: string; // Feature ID for tracking or identification purposes
    profileString?: string; // Profilestring to pass for edit mode 
    id?: string; // pass if in edit mode 
    handleSaveAction?: (profileData: string, id?: string | undefined) => void;// This will be called if allowActionList===false 
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean | undefined) => Promise<boolean>;//if isAutoSave is true then it will be used to get updated data
    handleAIClick?: (event: any, actionCode?: string) => void; // Callback for AI button click
    handleNodeCheck?: (checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => void;
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => void;
    handleKebabMenuSelect?: (selectedItem: any) => void;//Handle kebabmeu select action if needed
}

export type { ITreeWithFormEditor }
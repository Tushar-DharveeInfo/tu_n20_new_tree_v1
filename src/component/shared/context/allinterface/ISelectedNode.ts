
import { IWorkorderRecord } from "@n20a/libform";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

interface ISelectedNodeProperty {
    RecID: string;                // Unique record ID
    EntID: string;                // Entity ID
    EntityName: string;          // Type of entity, e.g., "Room"
    LastUpdated?: string;        // ISO or formatted datetime string
    _Site?: string;
    _Room?: string;
    Desc250?: string;
    RoomType?: string;
    Width?: number;
    Length?: number;
    Height?: number;
    Secured?: boolean;
    IsNZ?: boolean;
    // Index signature for flexibility
    [key: string]: any;
}

interface ISearchParams {
    entID: string;
    entityName: string;
    name?: string
}

interface INodeToRefresh {
    nodeToRefresh: ITreeNode;
    nodeToSelect?: ITreeNode
}
interface ISelectedNode {
    selectedNode?: ITreeNode;
    selectedNodeExplorer?: ITreeNode; // Optional, can be used to store the selected node in the explorer
    selectedNodeProperty?: ISelectedNodeProperty;
    selectedWorkorderRecord?: IWorkorderRecord;
    selectedNodeAllProperties?: {
        [key: string]: string | number | boolean | undefined;
    }; // Optional, can be used to store all properties of the selected node
    searchParaToSelect?: ISearchParams;
    checkedNode?: ITreeNode;
    dcNodeToRefresh?: INodeToRefresh;
    setSelectedNode: (treeNode?: ITreeNode) => void;
    setCheckedNode: (treeNode?: ITreeNode) => void;
    setSelectedNodeProperty: (selectedNodeProperty: ISelectedNodeProperty) => void;
    setSelectedWorkorderRecord: (selectedWorkorderRecord: IWorkorderRecord) => void;
    setSelectedNodeAllProperties: (selectedNodeAllProperties: {
        [key: string]: string | number | boolean | undefined;
    }) => void;
    setSelectedNodeExplorer: (selectedNodeExplorer?: ITreeNode) => void;
    setSearchParaToSelect: (searchParaToSelect?: ISearchParams) => void;
    setDcNodeToRefresh: (dcNodeToRefresh?: INodeToRefresh) => void;
}
export type { ISelectedNode, ISelectedNodeProperty, ISearchParams, INodeToRefresh }
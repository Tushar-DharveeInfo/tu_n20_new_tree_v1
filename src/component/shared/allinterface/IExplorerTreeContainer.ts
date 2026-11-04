import { EventDataNode, Key } from "rc-tree/lib/interface";
import { ISelectedNodeInfo, ITreeNode } from "./tree/ITreeControl";
import { IActionImageForSubMenu } from "./basic/IActionImageList";
import { NodeDragEventParams } from "rc-tree/lib/contextTypes";
import { DraggableConfig, DraggableFn } from "rc-tree/lib/Tree";
import { IHierarchicalApiData } from "./tree/ITreeForHierarchicalDataContainer";

type IHierarchyJsonApiResponse = {
    hierarchyJson?: string;
};

type IBsJsonApiResponse = {
    bsJson?: string;
};

type IAuditSessionsApiResponse = {
    data?: string;
};

type IPowerBiReportItem = {
    reportId: string;
    reportName: string;
    workspaceId: string;
    embedUrl: string;
    embedToken: string;
};

type IPowerBiReportsData = {
    reports?: IPowerBiReportItem[];
    error?: string;
};

interface IExplorerTreeContainer {
    uniqueName: string; // unique identifier for the control 
    featureId: string;//selected feature id 
    apiData: unknown;// Api Data ffor hierarchy 
    allowSearchControl: boolean;//to show search control or not and it will be without filter
    allowDrag?: boolean;
    allowDrop?: boolean;
    allowInternalDrag?: boolean | DraggableFn | DraggableConfig;
    defaultSelectedNodeKey?: Key;
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[], treeData?: ITreeNode[]) => void;
    handleKebabMenuSelect?: (selectedItem: IActionImageForSubMenu, selectedNodeInfo: ISelectedNodeInfo) => void;//Handle kebabmenu select action if needed
    onDrop?: (info: NodeDragEventParams<ITreeNode> & {
        dragNode: EventDataNode<ITreeNode>;
        dragNodesKeys: Key[];
        dropPosition: number;
        dropToGap: boolean;
    }) => void; // it will be called when drag and drop enabled
    handleDragStart?: (info: NodeDragEventParams<ITreeNode>) => void;// to handle drag start
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    handleShowMessage?: (isShowOkButton: boolean, errorMessage: string) => void;
    handleExternalDrop?: (event: React.DragEvent<HTMLSpanElement>, targetNode: ITreeNode) => void;
    canAcceptExternalDrop?: (targetNode: ITreeNode) => boolean;
    canAllowDragDrop?: (sourceNode: ITreeNode) => boolean;
    handleShowUserMessage?: (messageText: string, container?: HTMLDivElement, isShowAsPrompt?: boolean) => void;
}

export type {
    IExplorerTreeContainer,
    IHierarchicalApiData,
    IHierarchyJsonApiResponse,
    IBsJsonApiResponse,
    IAuditSessionsApiResponse,
    IPowerBiReportItem,
    IPowerBiReportsData,
}
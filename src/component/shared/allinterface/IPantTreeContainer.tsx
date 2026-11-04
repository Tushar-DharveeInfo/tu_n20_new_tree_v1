import { Key } from "react";
import { ISelectedNodeInfo, ITreeNode } from "./tree/ITreeControl";

type IPlantHierarchyJsonApiResponse = {
    hierarchyJson?: string;
    jsonStringOutput?: string;
    data?: string | Record<string, unknown>;
};

interface IPlantTreeContainer {
    uniqueName?: string;
    featureId?: string;
    tagName: string;
    selectedNodeKey?: string;
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys: Key[], treeData?: ITreeNode[]) => void;
}
export type {
    IPlantTreeContainer,
    IPlantHierarchyJsonApiResponse
}
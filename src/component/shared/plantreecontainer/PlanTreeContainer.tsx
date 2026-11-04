import { useEffect, useMemo, useRef, useState } from 'react'
import { Key } from 'rc-tree/lib/interface'
import { useParams, useSearchParams } from 'react-router-dom'

import { useStatusBarContext } from '../context/hooks/StatusBarHooks'

import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely'
import { FEnums } from '../../constants/Feature'
import { FnConvertFlatDataToHierarchyData } from '../allcommon/tree/FnConvertFlatDataToHierarchyData'
import { FnGetAutoExpandNodeKeys } from '../allcommon/tree/FnGetAutoExpandNodeKeys'
import { FnUpdateNodeWithTitleAndIcon } from '../allcommon/tree/FnUpdateNodeWithTitleAndIcon'
import { FnFindNodeAndParents } from '../allcommon/tablegrid/FnFindNodeAndParents'
import { axiosInterceptor } from '../interceptors/Interceptor'
import { EXPLORER } from '../interceptors/EndPoints'

import { IPlantHierarchyJsonApiResponse, IPlantTreeContainer } from '../allinterface/IPantTreeContainer'
import { ISelectedNodeInfo, ITreeNode } from '../allinterface/tree/ITreeControl'

import { TreeControl } from '../tree/treecontrol/TreeControl'

// Resolves API tagName from feature id when plan explorer uses a fixed filter.
function getTagNameForFeature(featureId: string | undefined, selectedTagName: string): string {
    if (featureId === FEnums.Transfer) return "Transfer";
    if (featureId === FEnums.Delete) return "Delete";
    if (featureId === FEnums.Relocate) return "Relocate";
    if (featureId === FEnums.ReplacementProfile || featureId === FEnums.Replace) return "Replace";
    return selectedTagName;
}

// Extracts flat hierarchy payload from site-hierarchy API response.
function getFlatHierarchyData(response: unknown): Record<string, unknown> | null {
    if (!response || typeof response !== "object") return null;

    const data = response as IPlantHierarchyJsonApiResponse & Record<string, unknown>;
    const jsonPayload = data.hierarchyJson ?? data.jsonStringOutput ?? data.data;

    if (typeof jsonPayload === "string" && jsonPayload.length) {
        try {
            const parsedData = FnParseJsonSafely<Record<string, unknown>>(jsonPayload);
            if (parsedData && typeof parsedData === "object") {
                return parsedData;
            }
            return null;
        } catch (error) {
            console.error("Failed to parse plant tree hierarchy data", error);
            return null;
        }
    }

    return data;
}

interface INodePathResult {
    pathObject: Record<string, string>;
}

// Builds a hierarchical path string and NodeType -> Name object from root parents down to target node
function buildNodePath(treeData: ITreeNode[] | undefined, targetNode: ITreeNode): INodePathResult {
    const defaultName = targetNode.Name || (typeof targetNode.title === "string" ? targetNode.title : "");
    const defaultObj: Record<string, string> = {};
    const targetType = targetNode.NodeType ?? "";
    const lowerTargetType = targetType.toLowerCase();
    if (targetType && defaultName && lowerTargetType !== "root" && lowerTargetType !== "device" && lowerTargetType !== "rackmounteddevice") {
        defaultObj[targetType] = defaultName;
    }

    const targetTreeType = (targetNode.treetype ?? "").toLowerCase();
    if (targetTreeType === "mounteddevice") {
        const entId = targetNode.MountedDeviceEntID || targetNode.NodeEntID || targetNode.MountedDeviceID || (targetNode.key ? targetNode.key.toString() : "");
        const name = targetNode.MountedDeviceName || defaultName;
        if (entId) {
            defaultObj["MountedDeviceEntID"] = entId;
        }
        if (name) {
            defaultObj["MountedDeviceName"] = name;
        }
    }

    if (!treeData || !treeData.length) {
        return { pathObject: defaultObj };
    }
    const targetKey = (targetNode.key ?? targetNode.NodeEntID ?? "").toString();
    if (!targetKey) {
        return { pathObject: defaultObj };
    }
    const chain = FnFindNodeAndParents(treeData, targetKey);
    if (chain && chain.length > 0) {
        const filteredChain = chain.filter((n) => (n.NodeType ?? "").toLowerCase() !== "root");

        const pathObject: Record<string, string> = {};
        for (const ele of filteredChain) {
            const eleTreeType = (ele.treetype ?? "").toLowerCase();
            if (eleTreeType === "mounteddevice") {
                const entId = ele.MountedDeviceEntID || ele.NodeEntID || ele.MountedDeviceID || (ele.key ? ele.key.toString() : "");
                const devName = ele.MountedDeviceName || ele.Name || (typeof ele.title === "string" ? ele.title : "");
                if (entId) {
                    pathObject["MountedDeviceEntID"] = entId;
                }
                if (devName) {
                    pathObject["MountedDeviceName"] = devName;
                }
            }

            const eleType = ele.NodeType ?? "";
            const lowerEleType = eleType.toLowerCase();
            const name = ele.Name || (typeof ele.title === "string" ? ele.title : "");
            if (eleType && name && lowerEleType !== "root" && lowerEleType !== "device" && lowerEleType !== "rackmounteddevice") {
                pathObject[eleType] = name;
                const formattedKey = eleType.charAt(0).toUpperCase() + eleType.slice(1);
                if (formattedKey !== eleType) {
                    pathObject[formattedKey] = name;
                }
            }
        }

        if (targetTreeType === "mounteddevice") {
            const entId = targetNode.MountedDeviceEntID || targetNode.NodeEntID || targetNode.MountedDeviceID || (targetNode.key ? targetNode.key.toString() : "");
            const devName = targetNode.MountedDeviceName || defaultName;
            if (entId && !pathObject["MountedDeviceEntID"]) {
                pathObject["MountedDeviceEntID"] = entId;
            }
            if (devName && !pathObject["MountedDeviceName"]) {
                pathObject["MountedDeviceName"] = devName;
            }
        }

        return { pathObject };
    }
    return { pathObject: defaultObj };
}

const PlanTreeContainer = ({
    uniqueName = "plant-tree-container",
    featureId,
    tagName,
    selectedNodeKey,
    handleNodeSelect
}: IPlantTreeContainer) => {
    const [searchParams] = useSearchParams();
    const params = useParams();
    const statusBarContext = useStatusBarContext();
    const isMountedRef = useRef(true);
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo>();
    const [isLoading, setIsLoading] = useState(true);

    const selectedTagName = useMemo(() => {
        return tagName
            ?? searchParams.get("tagName")
            ?? searchParams.get("tagname")
            ?? params.tagName
            ?? params.tagname
            ?? "";
    }, [params.tagName, params.tagname, searchParams, tagName]);

    // Loads plant explorer hierarchy and auto-selects the first expanded node.
    useEffect(() => {
        isMountedRef.current = true;

        const loadPlantTreeData = async () => {
            setIsLoading(true);
            setTreeData([]);
            setDefaultExpandedKeys([]);
            setDefaultSelectedKeys([]);
            setDefaultSelectedNodeInfo(undefined);

            const requestTagName = getTagNameForFeature(featureId, selectedTagName);

            await axiosInterceptor({
                url: EXPLORER.SiteHierarchyWithFilter,
                data: {
                    tagName: requestTagName
                },
                allowShowLoader: true,
                setFetchData: async (response: unknown, status?: string) => {
                    if (!isMountedRef.current) return;

                    if (status !== "200") {
                        setIsLoading(false);
                        return;
                    }

                    try {
                        const flatHierarchyData = getFlatHierarchyData(response);
                        if (!flatHierarchyData) {
                            setIsLoading(false);
                            return;
                        }

                        const hierarchyData = await FnConvertFlatDataToHierarchyData(flatHierarchyData, null, FEnums.Assets);

                        if (!isMountedRef.current) return;

                        if (!hierarchyData?.length) {
                            setIsLoading(false);
                            return;
                        }

                        const { keysToExpand, nodeToSelect } = await FnGetAutoExpandNodeKeys(hierarchyData);
                        let selectedNode = nodeToSelect ?? hierarchyData[0];
                        let finalKeysToExpand = keysToExpand;

                        if (selectedNodeKey) {
                            const foundChain = FnFindNodeAndParents(hierarchyData, selectedNodeKey);
                            if (foundChain && foundChain.length > 0) {
                                selectedNode = foundChain[foundChain.length - 1];
                                const parentKeys = foundChain.slice(0, -1).map((n) => n.key);
                                finalKeysToExpand = Array.from(new Set([...keysToExpand, ...parentKeys]));
                            }
                        }

                        const treePorps = { instanceName: FEnums.Assets, allowIcon: true };
                        const treeDataUpdated = FnUpdateNodeWithTitleAndIcon(hierarchyData, treePorps, featureId ?? "");

                        let finalSelectedNode = selectedNode;
                        const isDevice = (selectedNode.NodeType ?? "").toLowerCase() === "device"
                            || (selectedNode.treetype ?? "").toLowerCase() === "device"
                            || (selectedNode.treetype ?? "").toLowerCase() === "mounteddevice"
                            || (selectedNode.NodeType ?? "").toLowerCase() === "mounteddevice";
                        if (isDevice) {
                            const { pathObject } = buildNodePath(treeDataUpdated, selectedNode);

                            (selectedNode as any).DevicePathObject = pathObject;
                            finalSelectedNode = {
                                ...selectedNode,
                                DevicePathObject: pathObject
                            };
                        }

                        const selectedInfo: ISelectedNodeInfo = {
                            event: "auto-select",
                            selected: true,
                            node: finalSelectedNode,
                            selectedNodes: [finalSelectedNode]
                        };

                        setTreeData(treeDataUpdated);
                        setDefaultExpandedKeys(finalKeysToExpand);
                        setDefaultSelectedKeys([finalSelectedNode.key]);
                        setDefaultSelectedNodeInfo(selectedInfo);
                        handleNodeSelect?.([finalSelectedNode.key], selectedInfo, finalKeysToExpand, treeDataUpdated);
                        setIsLoading(false);
                    } catch (error) {
                        console.error("Failed to process plant tree hierarchy data", error);
                        if (isMountedRef.current) {
                            setIsLoading(false);
                        }
                    }
                }
            }, statusBarContext).catch((error) => {
                console.error("Failed to load plant tree data", error);
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            });
        };

        loadPlantTreeData();

        return () => {
            isMountedRef.current = false;
        }
    }, [selectedTagName]);

    // Forwards tree selection to parent and keeps local default keys in sync.
    const handlePlantNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[]) => {
        if (!info.selected || !info.node) {
            handleNodeSelect?.(selectedKeys, info, expandedNodeKeys ?? defaultExpandedKeys, treeData);
            return;
        }

        let updatedNode = info.node;
        const isDevice = (info.node.NodeType ?? "").toLowerCase() === "device"
            || (info.node.treetype ?? "").toLowerCase() === "device"
            || (info.node.treetype ?? "").toLowerCase() === "mounteddevice"
            || (info.node.NodeType ?? "").toLowerCase() === "mounteddevice";
        if (isDevice) {
            const { pathObject } = buildNodePath(treeData, info.node);
            (info.node as any).DevicePathObject = pathObject;
            updatedNode = {
                ...info.node,
                DevicePathObject: pathObject
            };
        }

        const updatedInfo: ISelectedNodeInfo = {
            ...info,
            node: updatedNode,
            selectedNodes: info.selectedNodes?.length
                ? info.selectedNodes.map((n) => (n.key === updatedNode.key ? updatedNode : n))
                : [updatedNode]
        };

        setDefaultSelectedKeys(selectedKeys);
        setDefaultSelectedNodeInfo(updatedInfo);
        if (expandedNodeKeys) {
            setDefaultExpandedKeys(expandedNodeKeys);
        }
        handleNodeSelect?.(selectedKeys, updatedInfo, expandedNodeKeys ?? defaultExpandedKeys, treeData);
    }

    return (
        <div className='nz-wh-100 nz-overflow-hidden'>
            {isLoading ? <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div> :
                treeData.length > 0 ? <TreeControl
                    uniqueName={uniqueName}
                    treeData={treeData}
                    defaultExpandedKeys={defaultExpandedKeys}
                    defaultSelectedKeys={defaultSelectedKeys}
                    defaultCheckedKeys={[]}
                    defaultSelectedNodeInfo={defaultSelectedNodeInfo}
                    allowAPICallOnExpand={false}
                    allowCheckbox={false}
                    allowDefaultExpandAll={false}
                    allowIcon={true}
                    allowInternalDrag={false}
                    allowMultiple={false}
                    featureId={featureId}
                    handleNodeExpand={(expandedNodeKeys) => setDefaultExpandedKeys(expandedNodeKeys)}
                    handleNodeSelect={handlePlantNodeSelect}
                /> : <div className="nz-wh-100 nz-d-flex-hv-left">{`There are no assets to ${getTagNameForFeature(featureId, selectedTagName)}`}</div>}
        </div>
    )
}

export { PlanTreeContainer, buildNodePath }
export type { INodePathResult }

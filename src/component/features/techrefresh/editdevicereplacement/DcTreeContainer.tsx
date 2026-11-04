
import { Key, useEffect, useRef, useState } from 'react';
import { DCI, DEVICE } from '../../../shared/interceptors/EndPoints';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { IDcTreeContainer } from '../../allinterface/techrefresh/IEditDeviceReplacement';
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';
import { ITreeForFlatDataContainer } from '../../../shared/allinterface/tree/ITreeForFlatDataContainer';
import { TreeControl } from '../../../shared/tree/treecontrol/TreeControl';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { FnConvertHierarchicalDataToTree } from '../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree';
import { FnAddSubNode } from '../../../shared/allcommon/tree/FnAddSubNode';
import { FnGetKeyFromEntId } from '../../../shared/allcommon/settingsform/FnGetKeyFromEntId';
import { FnUpdateTreeNodeUI } from '../../../appcontainer/allcommon/FnUpdateTreeNodeUI';
import { IConvertedTreeResponse } from '../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer';
import { Label } from '../../../shared/basic/label/Label';
import { FEnums } from '../../../constants/Feature';

const DcTreeContainer = (props: IDcTreeContainer) => {
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
    const [selectedNode, setSelectedNode] = useState<ISelectedNodeInfo>();
    const [isTreeLoading, setIsTreeLoading] = useState<boolean>(false);
    const statusBarContext = useStatusBarContext();
    const lastAutoSelectedEqidRef = useRef<string>("");

    const treeContainerPropsFrom: ITreeForFlatDataContainer = {
        uniqueName: props.uniqueName,
        featureId: props.featureId,
        featureTreeProps: {
            instanceName: "dc_explorer_tree",
            hideKebabMenu: true,
            allowCheckbox: false,
            allowIcon: true,
            isAllowDrag: false,
            hideCopyIcon: true,
            reuseFromCache: false,
            isAllowDrop: false,
            allowInternalDrag: false,
            openAllNodes: false
        },
        isSiteByTenant: false,
        isFloorTree: false,
        allowAPICallOnExpand: false,
        allowAdd: false,
        allowEdit: false,
        allowDelete: false,
        allowMultiple: false,
        className: "tree-container",
        selectedNodeExplorer: undefined,
        flatAPIData: undefined
    }

    const selectedDeviceId = props.selectedDevice?.DeviceID || props.selectedDevice?.EntId;

    //  Prevent multiple API calls

    /**
     *  Fetch hierarchy (ONLY once or when context is empty)
     */
    useEffect(() => {
        if (!selectedDeviceId) return;

        if (props.hasReplacementProfile === false) {
            setTreeData([]);
            props.handleNodeSelect(undefined, []);
            return;
        }

        if (props.isProfileLoading) {
            setIsTreeLoading(true);
            setTreeData([]);
            return;
        }

        const isReplaceFeature = props.featureId === FEnums.Replace || props.featureId?.toString() === FEnums.Replace.toString();
        const targetEqid = (props.targetEqid || "").trim();

        if (isReplaceFeature && !targetEqid) {
            lastAutoSelectedEqidRef.current = "";
            setIsTreeLoading(false);
            setTreeData([]);
            props.handleNodeSelect(undefined, []);
            return;
        }

        setIsTreeLoading(true);
        setTreeData([]);

        axiosInterceptor({
            url: DEVICE.AssetsForBin,
            data: {},
            setFetchData: (apiResponse: unknown) => {
                try {
                    if (apiResponse && typeof apiResponse === "object" && 'deviceJson' in apiResponse) {
                        const parsedData = JSON.parse(apiResponse.deviceJson as string);
                        if (parsedData) {

                            const hasWoid = (a: any): boolean => {
                                const val = a?.WOID ?? a?.woid ?? a?._WorkorderProfile ?? a?.WorkorderProfile ?? a?._Workorder ?? a?.Workorder;
                                if (val !== undefined && val !== null) {
                                    const str = String(val).trim().toLowerCase();
                                    if (str !== "" && str !== "null" && str !== "undefined" && str !== "0") {
                                        return true;
                                    }
                                }
                                return false;
                            };

                            function filterBinsNewAndOther(
                                data: Record<string, any>,
                                displayAllBins: boolean,
                                allowIsInInboundLocationRecords?: boolean,
                                notIncludeBins?: string | string[]
                            ) {
                                if (!data || !Array.isArray(data["Spare Devices"])) return data;

                                const result = { ...data };
                                const excludedBins = Array.isArray(notIncludeBins)
                                    ? notIncludeBins
                                    : notIncludeBins
                                        ? [notIncludeBins]
                                        : [];
                                const shouldIncludeBin = (bin: any) => !excludedBins.includes(bin.Name);

                                // 🔹 Helper for asset filtering
                                const filterAssets = (assets: any[]) => {
                                    if (!Array.isArray(assets)) return assets;

                                    let filtered = assets;

                                    // 1. Exclude devices that have WOID (only keep devices that do NOT have WOID)
                                    filtered = filtered.filter((a) => !hasWoid(a));

                                    // 2. If target eqid passed and featureid is FEnums.Replace, filter by target eqid
                                    const isTargetEqidReplace = Boolean(
                                        props.targetEqid &&
                                        (props.featureId === FEnums.Replace || props.featureId?.toString() === FEnums.Replace.toString())
                                    );

                                    if (isTargetEqidReplace) {
                                        const targetRaw = (props.targetEqid || "").trim().toLowerCase();
                                        const targetNorm = targetRaw.replace(/[^a-z0-9#]+/g, "");

                                        if (targetNorm) {
                                            filtered = filtered.filter((a) => {
                                                const rawEq = (a?.EQID || a?.eqid || "").toString().trim().toLowerCase();
                                                const normEq = rawEq.replace(/[^a-z0-9#]+/g, "");
                                                return (rawEq && rawEq === targetRaw) || (normEq && normEq === targetNorm);
                                            });
                                        }
                                    }

                                    // 3. Inbound location filtering
                                    if (allowIsInInboundLocationRecords === true) {
                                        filtered = filtered.filter((a) => a.IsInInboundLocation === 1 && a.EQID);
                                    } else if (allowIsInInboundLocationRecords === false) {
                                        filtered = filtered.filter((a) => a.IsInInboundLocation !== 1);
                                    }

                                    return filtered;
                                };

                                // 🔹 Helper for asset sorting A-Z
                                const sortAssetsAZ = (assetsList: any[]) => {
                                    if (!Array.isArray(assetsList)) return assetsList;
                                    return [...assetsList].sort((a: any, b: any) => {
                                        const aName = String(a.Name || a._Device || a.Label || a.DeviceName || "").trim();
                                        const bName = String(b.Name || b._Device || b.Label || b.DeviceName || "").trim();
                                        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
                                    });
                                };

                                // 🔹 Helper for bin sorting A-Z
                                const sortBinsAZ = (binsList: any[]) => {
                                    if (!Array.isArray(binsList)) return binsList;
                                    return [...binsList].sort((a: any, b: any) => {
                                        const aName = String(a.Name || a.Label || a._Bin || "").trim();
                                        const bName = String(b.Name || b.Label || b._Bin || "").trim();
                                        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
                                    });
                                };

                                result["Spare Devices"] = data["Spare Devices"]
                                    .map((store: any) => {
                                        if (!Array.isArray(store.Bins)) return store;

                                        //  displayAllBins = true → no transformation
                                        if (displayAllBins) {
                                            return {
                                                ...store,
                                                Bins: sortBinsAZ(store.Bins.filter(shouldIncludeBin))
                                                    .map((bin: any) => {
                                                        const assets = sortAssetsAZ(filterAssets(bin.Assets));

                                                        return {
                                                            ...bin,
                                                            HasChildren: assets?.length > 0 ? true : false,
                                                            Assets: assets?.map((asset: any) => ({
                                                                ...asset,
                                                                HasChildren: 0,
                                                                rackMountable: asset.SlotsNeeded > 0
                                                            }))
                                                        };
                                                    })
                                                    .filter((bin: any) => bin.Assets && bin.Assets.length > 0)
                                            };
                                        }

                                        //  displayAllBins = false → filter + transform
                                        return {
                                            ...store,
                                            Bins: sortBinsAZ(
                                                store.Bins
                                                    .filter(
                                                        (bin: any) =>
                                                            shouldIncludeBin(bin) &&
                                                            (bin.Name === "New" || bin.Name === "Other") &&
                                                            Array.isArray(bin.Assets) &&
                                                            bin.Assets.length > 0
                                                    )
                                            )
                                                .map((bin: any) => {
                                                    const assets = sortAssetsAZ(filterAssets(bin.Assets));

                                                    return {
                                                        ...bin,
                                                        HasChildren: assets.length > 0,
                                                        Assets: assets.map((asset: any) => ({
                                                            ...asset,
                                                            HasChildren: 0,
                                                            rackMountable: asset.SlotsNeeded > 0
                                                        }))
                                                    };
                                                })
                                                .filter((bin: any) => bin.Assets && bin.Assets.length > 0)
                                        };
                                    })
                                    .filter((store: any) => Array.isArray(store.Bins) && store.Bins.length > 0);

                                return result;
                            }
                            const result = filterBinsNewAndOther(parsedData,
                                true,
                                false
                            );
                            const findNodeByEqid = (
                                nodes: ITreeNode[],
                                target: string,
                                path: Key[] = []
                            ): { node: ITreeNode; path: Key[] } | null => {
                                if (!target) return null;
                                const targetNorm = target.toLowerCase().replace(/[^a-z0-9#]+/g, "").trim();
                                for (const node of nodes) {
                                    const currentPath = [...path, node.key];
                                    const nodeEqid = (
                                        node.EQID ||
                                        (node as any).eqid ||
                                        (node as any).NodeDetail?.EQID ||
                                        ""
                                    ).toString().toLowerCase().replace(/[^a-z0-9#]+/g, "").trim();

                                    if (nodeEqid && nodeEqid === targetNorm) {
                                        return { node, path: currentPath };
                                    }
                                    if (node.children?.length) {
                                        const found = findNodeByEqid(node.children, target, currentPath);
                                        if (found) return found;
                                    }
                                }
                                return null;
                            };

                            FnConvertHierarchicalDataToTree(result, treeContainerPropsFrom as any).then(
                                (result: IConvertedTreeResponse | undefined) => {
                                    if (result) {
                                        const sortTreeNodesChildren = (nodes: ITreeNode[]): ITreeNode[] => {
                                            return nodes.map((node) => {
                                                let children = node.children;
                                                if (children && children.length > 0) {
                                                    children = sortTreeNodesChildren(children);
                                                    children = [...children].sort((a, b) => {
                                                        const aName = String(a.Name || a.title || "").trim();
                                                        const bName = String(b.Name || b.title || "").trim();
                                                        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
                                                    });
                                                }
                                                return { ...node, children };
                                            });
                                        };
                                        const sortedTreeData = sortTreeNodesChildren(result.treeData);
                                        setTreeData(sortedTreeData);
                                        setExpandedKeys(result.expandedKeys);
                                        if (props.targetEqid) {
                                            const found = findNodeByEqid(sortedTreeData, props.targetEqid);
                                            if (found) {
                                                lastAutoSelectedEqidRef.current = props.targetEqid;
                                                setSelectedKeys([found.node.key]);
                                                setExpandedKeys((prev) => Array.from(new Set([...prev, ...found.path])));
                                                setSelectedNode({
                                                    event: "select",
                                                    selected: true,
                                                    node: found.node,
                                                    selectedNodes: [found.node],
                                                });
                                                props.handleNodeSelect(found.node, sortedTreeData);
                                                setIsTreeLoading(false);
                                                return;
                                            } else {
                                                lastAutoSelectedEqidRef.current = props.targetEqid;
                                                props.handleNodeSelect(undefined, sortedTreeData, true);
                                                setIsTreeLoading(false);
                                                return;
                                            }
                                        }

                                        if (result.selectedKey) {

                                            setSelectedKeys([result.selectedKey]);
                                            result.selectedNode &&
                                                setSelectedNode({
                                                    event: "select",
                                                    selected: true,
                                                    node: result.selectedNode,
                                                    selectedNodes: [result.selectedNode],
                                                });
                                            props.handleNodeSelect(result.selectedNode, sortedTreeData);
                                        } else {
                                            props.handleNodeSelect(undefined, sortedTreeData, false);
                                        }
                                    }
                                    else {
                                        setTreeData([]);
                                        props.handleNodeSelect(undefined, []);
                                    }
                                    setIsTreeLoading(false);
                                }
                            );
                        }
                        else {
                            setTreeData([]);
                            props.handleNodeSelect(undefined, []);
                            setIsTreeLoading(false);
                        }

                    } else {
                        setTreeData([]);
                        props.handleNodeSelect(undefined, []);
                        setIsTreeLoading(false);
                    }
                } catch (error) {
                    console.error("error AssetsForBin", error);
                    setTreeData([]);
                    props.handleNodeSelect(undefined, []);
                    setIsTreeLoading(false);
                }
            }
        }, statusBarContext);

    }, [
        selectedDeviceId,
        props.treeRefreshKey,
        props.hasReplacementProfile,
        props.targetEqid,
        props.featureId,
        props.isProfileLoading
    ]);

    // Auto-select node when props.targetEqid arrives or changes
    useEffect(() => {
        if (!props.targetEqid) {
            lastAutoSelectedEqidRef.current = "";
            return;
        }
        if (!treeData.length) return;
        if (lastAutoSelectedEqidRef.current === props.targetEqid) return;

        const findNodeByEqid = (
            nodes: ITreeNode[],
            target: string,
            path: Key[] = []
        ): { node: ITreeNode; path: Key[] } | null => {
            if (!target) return null;
            const targetNorm = target.toLowerCase().replace(/[^a-z0-9#]+/g, "").trim();
            for (const node of nodes) {
                const currentPath = [...path, node.key];
                const nodeEqid = (
                    node.EQID ||
                    (node as any).eqid ||
                    (node as any).NodeDetail?.EQID ||
                    ""
                ).toString().toLowerCase().replace(/[^a-z0-9#]+/g, "").trim();

                if (nodeEqid && nodeEqid === targetNorm) {
                    return { node, path: currentPath };
                }
                if (node.children?.length) {
                    const found = findNodeByEqid(node.children, target, currentPath);
                    if (found) return found;
                }
            }
            return null;
        };

        const found = findNodeByEqid(treeData, props.targetEqid);
        if (found) {
            lastAutoSelectedEqidRef.current = props.targetEqid;
            setSelectedKeys([found.node.key]);
            setExpandedKeys((prev) => Array.from(new Set([...prev, ...found.path])));
            setSelectedNode({
                event: "select",
                selected: true,
                node: found.node,
                selectedNodes: [found.node],
            });
            props.handleNodeSelect(found.node, treeData);
        } else if (treeData.length > 0) {
            lastAutoSelectedEqidRef.current = props.targetEqid;
            props.handleNodeSelect(undefined, treeData, true);
        }
    }, [props.targetEqid, treeData]);

    useEffect(() => {
        if (!selectedDeviceId) return;

        lastAutoSelectedEqidRef.current = "";
        //  Reset only UI state (not apiData)
        setTreeData([]);
        setExpandedKeys([]);
        setSelectedKeys([]);
        setSelectedNode(undefined);
        props.handleNodeSelect(undefined, []);

    }, [selectedDeviceId]);


    const filterRackDevices = (nodes: ITreeNode[], runeeded: number): ITreeNode[] => {
        return nodes
            .map(node => {

                let filteredChildren = node.children?.length
                    ? filterRackDevices(node.children, runeeded)
                    : [];

                //  If RackMountedDevice → apply condition
                if (node.NodeType?.toLowerCase() === "rackmounteddevice") {
                    const slotsNeeded = Number(node?.SlotsNeeded || 0);

                    if (slotsNeeded <= runeeded) {
                        return null; //  remove node
                    }
                }

                const isLeafNode = !filteredChildren.length;

                return {
                    ...node,
                    children: filteredChildren,
                    isLeaf: isLeafNode //  IMPORTANT
                };
            })
            .filter(Boolean) as ITreeNode[];
    };

    const autoExpandAndSelect = async (
        updatedTree: ITreeNode[],
        parentKey: string
    ) => {

        const nodeData = FnGetKeyFromEntId(updatedTree, parentKey, true);
        if (!nodeData?.node) return;

        const node = nodeData.node.node;
        const children = node.children || [];

        if (!children.length) return;

        //  SINGLE CHILD CASE
        if (children.length === 1) {
            const child = children[0];
            const childKey = child.key;

            //  If child is LEAF → SELECT it
            if (!child.children || child.children.length === 0) {

                setSelectedKeys([childKey]);

                const selectedNodeData = FnGetKeyFromEntId(updatedTree, childKey, true);

                if (selectedNodeData?.node) {
                    const selNode = selectedNodeData.node.node;
                    setSelectedNode({
                        event: "select",
                        node: selNode,
                        selected: true,
                        selectedNodes: [selNode]
                    });
                    props.handleNodeSelect(selNode, updatedTree);
                }

                return; //  stop here
            }

            //  If NOT leaf → expand and recurse
            setExpandedKeys(prev => {
                const newKeys = new Set(prev);
                newKeys.add(childKey);
                return Array.from(newKeys);
            });

            await autoExpandAndSelect(updatedTree, childKey);
        }
        else {
            //  MULTIPLE CHILDREN → select first
            const firstChildKey = children[0].key;

            setSelectedKeys([firstChildKey]);

            const selectedNodeData = FnGetKeyFromEntId(updatedTree, firstChildKey, true);

            if (selectedNodeData?.node) {
                const selNode = selectedNodeData.node.node;
                setSelectedNode({
                    event: "select",
                    node: selNode,
                    selected: true,
                    selectedNodes: [selNode]
                });
                props.handleNodeSelect(selNode, updatedTree);
            }
        }
    };

    const handleNodeExpand = (expandedNodeKeys: Key[], info: IExpandedNodeInfo): void => {

        setExpandedKeys(expandedNodeKeys as string[]);

        if (info.node.NodeType?.toLowerCase() === "floor" && !info.node.children.length) {

            //  CLEAR OLD SELECTION (fix flicker)
            setSelectedKeys([]);
            setSelectedNode(undefined);

            axiosInterceptor({
                url: DCI.ContainedByDevices,
                data: { floorID: info.node.NodeEntID },
                setFetchData: async (_resp: unknown, status?: string) => {

                    if (status === "200" && _resp && typeof _resp === "object" && 'dciJson' in _resp) {

                        const parsedData = FnParseJsonSafely(_resp.dciJson as string);
                        const convertedData = await FnConvertHierarchicalDataToTree(parsedData, treeContainerPropsFrom as any);

                        if (convertedData?.treeData?.length) {
                            const updatedUITree = FnUpdateTreeNodeUI(
                                convertedData.treeData,
                                treeContainerPropsFrom.featureTreeProps,
                                props.featureId
                            );
                            const runeeded = Number(props.selectedDevice?.RUNeeded || 2);

                            let newNodes =
                                updatedUITree.length > 1
                                    ? updatedUITree
                                    : updatedUITree[0].children;

                            newNodes = filterRackDevices(newNodes, runeeded);

                            const updatedTree = await FnAddSubNode(
                                treeData,
                                info.node.key,
                                newNodes,
                                treeContainerPropsFrom.featureTreeProps,
                                props.featureId,
                                false,
                                info.node.stepNo
                            );

                            setTreeData(updatedTree);

                            setTimeout(() => {
                                autoExpandAndSelect(updatedTree, info.node.key);
                            }, 0);
                        }
                    }
                }
            }, statusBarContext);
        }
    };

    const handleNodeSelect = (selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[] | undefined): void => {
        setExpandedKeys(expandedNodeKeys ? expandedNodeKeys : expandedKeys)
        props.handleNodeSelect(info?.node, treeData);
        setSelectedKeys([info.node.key])
        setSelectedNode(info)
    }

    if (!props.selectedDevice) {
        return (
            <div className="nz-error-message" style={{ padding: "16px", textAlign: "center" }}>
                <Label label={"Please Select Device to Replace"} uniqueName={`${props.uniqueName}-no-selected`} />
            </div>
        );
    }

    if (props.hasReplacementProfile === false) {
        return (
            <div className="nz-error-message" style={{ padding: "16px", textAlign: "center" }}>
                <Label label={"No replacement profile found for selected device model"} uniqueName={`${props.uniqueName}-no-profile`} />
            </div>
        );
    }

    const isAnyLoading = Boolean(props.isProfileLoading || isTreeLoading);

    if (isAnyLoading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }

    const isReplaceFeature = props.featureId === FEnums.Replace || props.featureId?.toString() === FEnums.Replace.toString();
    const targetEqid = (props.targetEqid || "").trim();

    if (isReplaceFeature && !targetEqid) {
        return (
            <div className="nz-error-message" style={{ padding: "16px", textAlign: "center" }}>
                <Label label={"No target EQID found for replacement"} uniqueName={`${props.uniqueName}-no-target-eqid`} />
            </div>
        );
    }

    if (!treeData.length) {
        const noDevicesMessage = (targetEqid && isReplaceFeature)
            ? `No available replacement device found matching EQID "${props.targetEqid}" in inventory`
            : "No available replacement devices in inventory";

        return (
            <div className="nz-error-message" style={{ padding: "16px", textAlign: "center" }}>
                <Label label={noDevicesMessage} uniqueName={`${props.uniqueName}-no-devices`} />
            </div>
        );
    }

    return (
        <div className='nz-wh-100'>
            <TreeControl
                uniqueName={props.uniqueName}
                treeData={treeData}
                allowIcon={true}
                defaultExpandedKeys={expandedKeys}
                defaultSelectedKeys={selectedKeys}
                defaultCheckedKeys={[]}
                handleNodeExpand={handleNodeExpand}
                handleNodeSelect={handleNodeSelect} />
        </div>
    );
};

export { DcTreeContainer };

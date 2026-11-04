
import { useEffect, useRef, useState } from "react";
import { Key } from "rc-tree/lib/interface";
import { useStatusBarContext } from "../../context/hooks/StatusBarHooks";
import { axiosInterceptor } from "../../interceptors/Interceptor";
import "../../allcss/settingsform/SelectEntityContainer.css";
import { EM } from "../../interceptors/EndPoints";
import { FnHandleAPIResponse } from "../../allcommon/settingsform/FnHandleAPIResponse";
import { FnConvertHierarchicalDataToTree } from "../../allcommon/tree/FnConvertHierarchicalDataToTree";
import { FnSearchKeywordInLocalTree } from "../../allcommon/settingsform/FnSearchKeywordInLocalTree";
import { FnGetAllKeysOfTree } from "../../allcommon/tree/FnGetAllKeysOfTree";
import { FnGetNodeDetailsBasedOnKey } from "../../allcommon/tree/FnGetNodeDetailsBasedOnKey";
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from "../../allinterface/tree/ITreeControl";
import { ISelectEntityContainer } from "../../allinterface/settingsform/ISelectEntityContainer";
import { IFeatureTree } from "../../allinterface/tree/ITreeForHierarchicalDataContainer";
import { TreeForHierarchicalDataContainer } from "../../tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { SearchControl } from "../../searchfilter/searchcontrol/SearchControl";
import { TreeNodeTitle } from "../../tree/treenodetitle/TreeNodeTitle";
import { AppQA } from "../../../constants/Feature";
import { YesNoControl } from "@n20a/libform";
import { CheckInfo } from "rc-tree/lib/Tree";
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";

const SelectEntityContainer = (props: ISelectEntityContainer) => {
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
    const [SearchText, setSearchText] = useState<string>("");
    const [SearchHistory, setSearchHistory] = useState<string[]>([]);
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<{ checked: Key[]; halfChecked: Key[]; }>();
    const [selectAll, setSelecetAll] = useState<boolean>(false);
    const [uploadOnly, setUploadOnly] = useState<boolean>(false);
    const [excludeRecID, setExcludeRecID] = useState<boolean>(false);
    const statusBarContext = useStatusBarContext();
    const featureTreeProps: IFeatureTree = {
        instanceName: "Import_export_tree",
        hideKebabMenu: true,
        allowCheckbox: true,
        allowIcon: true,
        isAllowDrag: false,
        hideCopyIcon: false,
        reuseFromCache: false,
        isAllowDrop: false,
        allowInternalDrag: false,
        openAllNodes: false,
        allowCheckStrictly: true,
    };

    const treeProps = {
        uniqueName: props.uniqueName, // Unique identifier
        apiData: null, // Flat API data
        featureId: props.featureId ? props.featureId : AppQA.Settings, // Feature ID
        featureTreeProps: featureTreeProps, // Tree control properties
        allowGenerateTreeData: false, // indicates whether need to generate treedata from API data
        defaultExpandedKeys: [], // default expanded keys to set if already tree data generated
        defaultSelectedKeys: [], // default selected keys to set if already tree data generated
        defaultCheckedKeys: [], // default checked keys to set if already tree data generated
        defaultSelectedNodeInfo: undefined, // default selected node set if needed
        isSiteByTenant: false, // Enables tenant-specific hierarchy
        isFloorTree: false, // Indicates this is not a Floor Pane tree
        allowAPICallOnExpand: true, // Enables API calls on node expansion
        allowAdd: false, // Allows adding new nodes
        allowEdit: false, // Allows editing nodes
        allowDelete: false, // Allows deleting nodes
        disableAdd: true, // disable adding new nodes
        disableEdit: false, // disable editing nodes
        disableDelete: false, // disable deleting nodes
        allowMultiple: true, // Allows multiple selections
        className: "tree-container", // Custom CSS class
        selectedNodeExplorer: undefined, // Selected node data
    };
    const treePropsRef = useRef(treeProps);

    useEffect(() => {
        if (props.defaultStrictlyCheckedKeys) {
            setDefaultStrictlyCheckedKeys(props.defaultStrictlyCheckedKeys)
        }
    }, [props.defaultStrictlyCheckedKeys])

    useEffect(() => {
        try {
            const handleApiEntityVsTable = (response: any, status?: string) => {
                if (status === '200') {
                    setDefaultExpandedKeys([])
                    setDefaultStrictlyCheckedKeys({ checked: [], halfChecked: [] })
                    if (response.hierarchyJson) {
                        FnConvertHierarchicalDataToTree(FnParseJsonSafely(response.hierarchyJson), treePropsRef.current).then(
                            (result: any) => {

                                setDefaultExpandedKeys(result.expandedKeys);
                                setDefaultSelectedKeys([result.selectedKey]);
                                const info: ISelectedNodeInfo = {
                                    event: "select",
                                    selected: true,
                                    node: result.selectedNode,
                                    selectedNodes: [result.selectedNode],
                                }
                                result.selectedNode &&
                                    setDefaultSelectedNodeInfo(info);
                                props.handleNodeSelect([result.selectedKey], info, result.treeData);
                                if (props.entityName === "Cable" || props.entityName === "Device") {
                                    try {
                                        const handleUpDateRecordCount = (RecordCountResponse: unknown, status?: string) => {
                                            if (status === '200') {
                                                try {
                                                    const handleApiEntityVsTable = async (EntityVsTableResponse: Record<string, unknown>, status?: string) => {
                                                        if (status == "200") {
                                                            let parsedData: Record<string, any> = FnHandleAPIResponse(EntityVsTableResponse.hierarchyJson, "EntityVsTable");
                                                            if (parsedData?.length > 0) {
                                                                let updateTreeData = result.treeData
                                                                updateTreeData.map((element: Record<string, any>) => {
                                                                    if (element.children?.length > 0) {
                                                                        element.children.map((childEle: Record<string, any>) => {
                                                                            if (parsedData[0]?.EmTable?.length > 0 && parsedData[0].Name == childEle.Name && childEle?.children?.length > 0) {
                                                                                childEle?.children.map((childL2: ITreeNode) => {
                                                                                    let filtered = parsedData[0]?.EmTable?.filter((subEle: any) => { return subEle.Name == childL2.Name });
                                                                                    if (filtered?.length > 0) {
                                                                                        childL2.RecordCount = filtered[0].RecordCount;
                                                                                        childL2.title = TreeNodeTitle(childL2, treeProps.featureTreeProps, props?.featureId, false, false, undefined);
                                                                                    }

                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                                setTreeData([...updateTreeData])
                                                            }
                                                        }

                                                    }
                                                    axiosInterceptor({
                                                        url: EM.GetEntityVsTable,
                                                        data: { entityName: info.node.NodeEntityname },
                                                        allowShowLoader: true,
                                                        setFetchData: handleApiEntityVsTable
                                                    }, statusBarContext)
                                                } catch (error) {
                                                    console.error("Error in fetching entity vs table", error)
                                                }
                                            }
                                        }
                                        axiosInterceptor({
                                            url: EM.UpdateRecordCount,
                                            data: { entityName: info.node.NodeEntityname },
                                            allowShowLoader: true,
                                            setFetchData: handleUpDateRecordCount
                                        }, statusBarContext)
                                    } catch (error) {
                                        console.error("Error in fetching entity vs table", error)
                                    }
                                } else {
                                    setTreeData(result.treeData);
                                }
                            }
                        );
                    }
                    if (props.isRefeshTree) {
                        props.removeRefeshVariable && props.removeRefeshVariable()
                    }
                }
            }
            axiosInterceptor({
                url: EM.GetEntityVsTable,
                data: {
                    entityName: props.entityName ?? "",
                    featureName: props.featureName ?? undefined
                },
                allowShowLoader: true,
                setFetchData: handleApiEntityVsTable
            }, statusBarContext)
        } catch (error) {
            console.error("Error in fetching entity vs table", error)
        }



    }, [treePropsRef, props.entityName, props.isRefeshTree]);

    const handleSearchDeviceEntities = async (isNext: boolean = false, isRegex: boolean = false) => {
        if (SearchText.length > 0 && treeData) {
            const historyToExclude = isNext ? SearchHistory : [];
            //Search in user tree data.
            let foundedNode = FnSearchKeywordInLocalTree(
                SearchText,
                treeData,
                historyToExclude,
                [],
                isRegex
            );

            if (foundedNode && foundedNode.foundNode) {
                let parentNodeKeys = foundedNode.parentNodes.map(
                    (item: ITreeNode) => item.key
                );
                setDefaultExpandedKeys([...parentNodeKeys, ...defaultExpandedKeys]);
                setDefaultSelectedKeys([foundedNode.foundNode.key]);
                setSearchHistory(prev => isNext ? [...prev, foundedNode.foundNode!.key] : [foundedNode.foundNode!.key]);
            } else {
                if (!isNext) {
                    setSearchHistory([]);
                }
                const message = isNext ? "No next node found" : "No data found in local search if needed call API for search";
                alert(message);
            }
        }
    };

    const handleValueChangeForSelectAll = (
        value: boolean
    ) => {

        if (value) {
            let data = FnGetAllKeysOfTree(treeData);
            setDefaultStrictlyCheckedKeys({ checked: data, halfChecked: [] });
        } else {
            setDefaultStrictlyCheckedKeys({ checked: [], halfChecked: [] });
        }
        setSelecetAll(value);
    };

    const handleValueChangeForUpdateOnly = (
        value: boolean
    ) => {

        setUploadOnly(value);
        let checkedNodeKeys: Key[] = defaultStrictlyCheckedKeys?.checked
            ? defaultStrictlyCheckedKeys?.checked
            : [];
        let checked = value ? false : true;
        let halfChecked: Key[] = defaultStrictlyCheckedKeys?.halfChecked
            ? defaultStrictlyCheckedKeys?.halfChecked
            : [];
        treeData.map((item: ITreeNode) => {
            if (item.children?.length > 0) {
                item.children.map((itemL1: ITreeNode) => {
                    if (
                        itemL1.NodeType === "EntityNode" &&
                        itemL1.children?.length > 1
                    ) {
                        let isCheckedPgTable: ITreeNode[] = itemL1.children?.filter(
                            (itemL3: any) => {
                                return (
                                    itemL3.Name !== `_${itemL1.Name}` &&
                                    checkedNodeKeys.includes(itemL3.key)
                                );
                            }
                        );
                        itemL1.children.map((itemL2: ITreeNode) => {
                            if (
                                itemL2.Name === `_${itemL1.Name}` &&
                                checkedNodeKeys.includes(itemL2.key)
                            ) {
                                itemL2.disabled =
                                    checked || isCheckedPgTable?.length === 0 ? false : true;
                            } else if (
                                itemL2.Name === `_${itemL1.Name}` &&
                                isCheckedPgTable?.length > 0 &&
                                checked === false
                            ) {
                                itemL2.disabled = checked ? false : true;
                                checkedNodeKeys.push(itemL2.key);
                            }
                            return itemL2;
                        });
                        let isAllChecked: ITreeNode[] = itemL1.children.filter((itemL4: ITreeNode) => {
                            return !checkedNodeKeys.includes(itemL4.key);
                        });
                        if (isAllChecked?.length === 0) {
                            checkedNodeKeys.push(itemL1.key);
                            if (halfChecked.includes(itemL1.key)) {
                                halfChecked = halfChecked.filter((element: any) => {
                                    return element !== itemL1.key;
                                });
                            }
                        }
                    }
                    return itemL1;
                });
            }
            return item;
        });
        setTreeData([...treeData]);
        props.handleCheckboxChange && props.handleCheckboxChange("Update Only", value ? "1" : "0")
    };
    const handleCheckedNode = (checked: { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => {

        let checkedKey: Key[] = [...checked.checked];
        let halfCheckedKey: Key[] = [...checked.halfChecked];
        let disableNeeded: boolean = uploadOnly;
        let updateOnlyFlag: Boolean = uploadOnly || props.uniqueName === "export-tree" ? true : false;
        let parentNodeKey: string | null = null;
        let pgClassKey: string | null = null;

        if (info.checked) {
            if (info.node.children?.length > 0) {
                // logic to set child nodes checked
                info.node.children.forEach((item: ITreeNode) => {
                    checkedKey.push(item.key);
                });
                setDefaultStrictlyCheckedKeys({
                    checked: Array.from(new Set(checkedKey)),
                    halfChecked: Array.from(new Set(halfCheckedKey)),
                });
                // logic to find whether disable node is needed or not
                if (info.node.children?.length > 1) {
                    disableNeeded = updateOnlyFlag ? false : true;
                    parentNodeKey = info.node.key;
                    let pgClassRecord = info.node.children.filter((item: ITreeNode) => {
                        return item.Name?.includes("_");
                    });
                    pgClassKey = pgClassRecord?.length > 0 ? pgClassRecord[0].key : null;
                }
            } else {
                // function called to get parent node from parentEntID
                let result = FnGetNodeDetailsBasedOnKey(
                    treeData,
                    info.node.parentEntID as string
                );
                if (result?.node && result?.node) {
                    if (result?.node?.children?.length > 0) {
                        // logic to find out the pg class record, no of checked nodes and pg table records
                        let pgclassRecord = result?.node?.children.filter((item: ITreeNode) => {
                            return item.Name?.includes("_");
                        });
                        let checkedCount = result?.node?.children.filter((item: ITreeNode) => {
                            return (
                                !item.Name?.includes("_") && checked.checked?.includes(item.key)
                            );
                        });
                        let pgTableRecord = result?.node?.children.filter((item: ITreeNode) => {
                            return !item.Name?.includes("_");
                        });
                        if (
                            pgclassRecord?.length > 0 &&
                            info.node.key === pgclassRecord[0].key
                        ) {
                            // logic to handle if checked node is pg class node
                            if (checkedCount?.length > 0) {
                                disableNeeded = updateOnlyFlag ? false : true;
                                parentNodeKey = result.key;
                                pgClassKey =
                                    pgclassRecord?.length > 0 ? pgclassRecord[0].key : null;
                            }
                            if (
                                (checkedCount?.length > 0 &&
                                    pgTableRecord?.length !== checkedCount?.length) ||
                                (checkedCount?.length === 0 && pgTableRecord?.length > 0)
                            ) {
                                // it will add the halfCheckedKey if all child nodes are not checked
                                halfCheckedKey.push(result.key);
                                checkedKey = checkedKey.filter(
                                    (element: Key) => result.key !== element
                                );
                            } else {
                                // it will remove the halfCheckedKey and add checked key if all child nodes are checked
                                checkedKey.push(result.key);
                                halfCheckedKey = halfCheckedKey.filter(
                                    (element: Key) => result.key !== element
                                );
                            }
                            setDefaultStrictlyCheckedKeys({
                                checked: Array.from(new Set(checkedKey)),
                                halfChecked: Array.from(new Set(halfCheckedKey)),
                            });
                        } else {
                            // logic to handle if checked node is pg table node
                            if (checkedCount?.length > 0) {
                                disableNeeded = updateOnlyFlag ? false : true;
                                parentNodeKey = result.key;
                                pgClassKey =
                                    pgclassRecord?.length > 0 && !updateOnlyFlag
                                        ? pgclassRecord[0].key
                                        : null;
                            }
                            if (!updateOnlyFlag || props.uniqueName === "export-tree") {
                                checkedKey.push(pgclassRecord[0].key);
                            }
                            if (pgTableRecord?.length !== checkedCount?.length) {
                                halfCheckedKey.push(result.key);
                            } else {
                                checkedKey.push(result.key);
                            }
                            setDefaultStrictlyCheckedKeys({
                                checked: Array.from(new Set(checkedKey)),
                                halfChecked: Array.from(new Set(halfCheckedKey)),
                            });
                        }
                    }
                }
            }
        } else {
            if (info.node.children?.length > 0) {
                // logic to set child nodes unchecked
                info.node.children.forEach((item: ITreeNode) => {
                    if (checkedKey.includes(item.key)) {
                        checkedKey = checkedKey.filter(
                            (element: Key) => item.key !== element
                        );
                    }
                });

                disableNeeded = (props.entityName?.toLowerCase() === "cable" || props.entityName?.toLowerCase() === "device" || props.uniqueName === "nz-cable-tree" || props.uniqueName === "import-tree") ? false : (updateOnlyFlag ? false : true);
                parentNodeKey = info.node.key;
                let pgClassRecord = info.node.children.filter((item: ITreeNode) => {
                    return item?.Name?.includes("_");
                });
                pgClassKey = pgClassRecord?.length > 0 ? pgClassRecord[0].key : null;
                checkedKey = checkedKey.filter(
                    (element: Key) => info.node.key !== element
                );
                halfCheckedKey = halfCheckedKey.filter(
                    (element: Key) => info.node.key !== element
                );
                setDefaultStrictlyCheckedKeys({
                    checked: Array.from(new Set(checkedKey)),
                    halfChecked: Array.from(new Set(halfCheckedKey)),
                });
            } else {
                // function called to get parent node from parentEntID
                let result = FnGetNodeDetailsBasedOnKey(
                    treeData,
                    info.node.parentEntID as string
                );
                if (result?.node && result?.node) {
                    if (result?.node.children?.length > 0) {
                        // logic to find out the pg class record
                        let pgclassRecord = result?.node.children.filter((item: ITreeNode) => {
                            return item?.Name?.includes("_");
                        });

                        if (
                            pgclassRecord?.length > 0 &&
                            info.node.key === pgclassRecord[0].key
                        ) {
                            // logic to handle pgclass node unchecked
                            checkedKey = checkedKey.filter(
                                (element: Key) => result?.key !== element
                            );
                            checkedKey = checkedKey.filter(
                                (element: Key) => info.node.key !== element
                            );
                            let childChecked = result?.node?.children.filter((item: ITreeNode) => {
                                return (
                                    !item?.Name?.includes("_") &&
                                    checked.checked?.includes(item.key)
                                );
                            });
                            // remove from halfcheckedkey
                            if (childChecked?.length === 0) {
                                halfCheckedKey = halfCheckedKey.filter(
                                    (element: Key) => result?.key !== element
                                );
                            }
                            setDefaultStrictlyCheckedKeys({
                                checked: Array.from(new Set(checkedKey)),
                                halfChecked: Array.from(new Set(halfCheckedKey)),
                            });
                        } else {
                            // logic to handle pg table node unchecked
                            let checkedCount = result?.node?.children.filter((item: ITreeNode) => {
                                return (
                                    !item?.Name?.includes("_") &&
                                    checked.checked?.includes(item.key) &&
                                    item.key !== info.node.key
                                );
                            });

                            if (checkedCount?.length > 0) {
                                disableNeeded = updateOnlyFlag ? false : true;
                                parentNodeKey = result.key;
                                pgClassKey =
                                    pgclassRecord?.length > 0 ? pgclassRecord[0].key : null;
                            } else {
                                disableNeeded = updateOnlyFlag ? false : true;
                                parentNodeKey = result.key;
                                pgClassKey =
                                    pgclassRecord?.length > 0 ? pgclassRecord[0].key : null;
                            }
                            checkedKey = checkedKey.filter(
                                (element: Key) => info.node.key !== element
                            );
                            if (checkedCount?.length > 0) {
                                halfCheckedKey.push(result.key);
                                checkedKey = checkedKey.filter(
                                    (element: Key) => result?.key !== element
                                );
                            }
                            let childChecked = result?.node?.children.filter((item: ITreeNode) => {
                                return checked.checked?.includes(item.key);
                            });
                            if (childChecked?.length === 0) {
                                halfCheckedKey = halfCheckedKey.filter(
                                    (element: Key) => result?.key !== element
                                );
                            }
                            setDefaultStrictlyCheckedKeys({
                                checked: Array.from(new Set(checkedKey)),
                                halfChecked: Array.from(new Set(halfCheckedKey)),
                            });
                        }
                    }
                }
            }
        }
        if (parentNodeKey && pgClassKey) {
            treeData.map((item: ITreeNode) => {
                if (item.children?.length > 0) {
                    item.children.map((itemL1: ITreeNode) => {
                        if (itemL1.key === parentNodeKey && itemL1.children?.length > 1) {
                            itemL1.children.map((itemL2: ITreeNode) => {
                                if (itemL2.key === pgClassKey) {
                                    itemL2.disabled = disableNeeded;
                                }
                                return itemL2;
                            });
                        }
                        return itemL1;
                    });
                }
                return item;
            });
        }
        if (props.uniqueName === "import-tree" && ((checked.checked.length === 0 && checked.halfChecked.length === 0) || info.checked === false && info.node.NodeType === "EntityNode")) {
            treeData.map((item: ITreeNode) => {
                if (item.children?.length > 0) {
                    item.children.map((itemL1: ITreeNode) => {
                        if ((info.checked === false && info.node.NodeType === "EntityNode" && itemL1.key === info.node.key && itemL1.children?.length > 1) || (checked.checked.length === 0 && checked.halfChecked.length === 0)) {
                            itemL1.children.map((itemL2: ITreeNode) => {
                                itemL2.disabled = false;
                                return itemL2;
                            });
                        }
                        return itemL1;
                    });
                }
                return item;
            });
        }
        let checkedKeyData: { checked: Key[]; halfChecked: Key[]; } = {
            checked: checkedKey,
            halfChecked: halfCheckedKey,
        };
        setDefaultStrictlyCheckedKeys({ ...checkedKeyData });
        setTreeData(treeData);
        props.handleCheckNode(checkedKeyData, info, treeData);
    };

    const handleValueChangeForExcludeRecID = (
        value: boolean
    ) => {
        setExcludeRecID(value);
        props.handleValueChangeForExcludeRecID && props.handleValueChangeForExcludeRecID(value ? "1" : "0");
    };

    const handleNodeExpand = (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => {
        try {
            const handleUpDateRecordCount = (RecordCountResponse: unknown, status?: string) => {
                if (status === '200') {
                    try {
                        const handleApiEntityVsTable = async (EntityVsTableResponse: Record<string, unknown>, status?: string) => {
                            if (status === '200') {
                                let parsedData: Record<string, any> = FnHandleAPIResponse(EntityVsTableResponse.hierarchyJson, "EntityVsTable");
                                if (parsedData?.length > 0) {
                                    let updateTreeData = treeData
                                    updateTreeData.map((element: Record<string, any>) => {
                                        if (element.children?.length > 0) {
                                            element.children.map((childEle: Record<string, any>) => {
                                                if (parsedData[0]?.EmTable?.length > 0 && parsedData[0].Name == childEle.Name && childEle?.children?.length > 0) {
                                                    childEle?.children.map((childL2: ITreeNode) => {
                                                        let filtered = parsedData[0]?.EmTable?.filter((subEle: Record<string, any>) => { return subEle.Name == childL2.Name });
                                                        if (filtered?.length > 0) {
                                                            childL2.RecordCount = filtered[0].RecordCount;
                                                            childL2.title = TreeNodeTitle(childL2, treeProps.featureTreeProps, props?.featureId, false, false, undefined);
                                                        }

                                                    })
                                                }
                                            })
                                        }
                                    })
                                    setTreeData([...updateTreeData])
                                }
                            }

                        }
                        axiosInterceptor({
                            url: EM.GetEntityVsTable,
                            data: { entityName: info.node.NodeEntityname },
                            allowShowLoader: true,
                            setFetchData: handleApiEntityVsTable
                        }, statusBarContext)
                    } catch (error) {
                        console.error("Error in GetEntityVsTable", error)
                    }
                }
            }
            axiosInterceptor({
                url: EM.UpdateRecordCount,
                data: { entityName: info.node.NodeEntityname },
                allowShowLoader: true,
                setFetchData: handleUpDateRecordCount
            }, statusBarContext)
            setDefaultExpandedKeys(expandedNodeKeys)
        } catch (error) {
            console.error("Error in UpdateRecordCount", error)
        }
    }

    if (!treeData || !treeData.length) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No data found</div>;
    }

    return (
        <div className="nz-import-export-tree" key={props.uniqueName}>
            <div className="nz-import-export-tree-search">
                <SearchControl
                    uniqueName={`tree-search`}
                    isShowFilterControl={false}
                    lensDirty={SearchText.length > 0}
                    filterDirty={false}
                    searchValueChange={(value: string) => {
                        setSearchText(value);
                        setSearchHistory([]);
                    }}
                    handleLensMouse={() => {
                        const isNext = SearchHistory.length > 0;
                        handleSearchDeviceEntities(isNext);
                    }}
                    hideRightMouseMenu={true}
                    searchInputValue={SearchText} handleFilterMouse={function (): void {
                    }} />
                <div className="nz-checkbox-button">
                    {!props.hideSelectAll && <YesNoControl
                        name="selectAll"
                        label="Select All"
                        value={selectAll}
                        tooltip="Select All"
                        disabled={false}
                        onChange={handleValueChangeForSelectAll}
                    />}
                    {props.isShowUpdateOnly && <YesNoControl
                        name="Update Only"
                        label="Update Only"
                        value={uploadOnly}
                        tooltip="Update Only"
                        disabled={false}
                        onChange={handleValueChangeForUpdateOnly}
                    />}
                    {props.isShowExcludeRecID && <YesNoControl
                        name="Exclude RecID"
                        label="Exclude RecID"
                        value={excludeRecID}
                        tooltip="Exclude RecID"
                        disabled={false}
                        onChange={handleValueChangeForExcludeRecID}
                    />}
                </div>
                <div className="nz-import-export-tree-div">
                    {treeData && (
                        <TreeForHierarchicalDataContainer
                            {...treeProps}
                            apiData={treeData}
                            defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
                            defaultExpandedKeys={defaultExpandedKeys}
                            defaultSelectedKeys={defaultSelectedKeys}
                            defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                            handleNodeCheck={(checked: { checked: Key[]; halfChecked: Key[]; } | Key[], info) => {
                                setDefaultStrictlyCheckedKeys(checked as { checked: Key[]; halfChecked: Key[]; });
                                handleCheckedNode(checked as { checked: Key[]; halfChecked: Key[]; }, info);
                            }} // Node check callback
                            handleNodeSelect={(
                                selectedKeys: Key[],
                                info: ISelectedNodeInfo,
                                expandedKeys: Key[]
                            ) => {
                                setDefaultExpandedKeys(expandedKeys);
                                setDefaultSelectedKeys([info.node.key]);
                                props.handleNodeSelect(selectedKeys, info, treeData);
                            }} // Node select callback

                            handleNodeExpand={handleNodeExpand}
                        />

                    )}
                </div>
            </div>
        </div>
    );
};
export { SelectEntityContainer };
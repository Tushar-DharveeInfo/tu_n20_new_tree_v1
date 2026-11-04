
import { useEffect, useRef, useState } from "react";
import isEqual from "lodash/isEqual"
import { Key } from "rc-tree/lib/interface";
import { useStatusBarContext } from "../../../../../../shared/context/hooks/StatusBarHooks";
import { useMainAppContext } from "../../../../../../shared/context/hooks/MainAppHooks";
import { axiosInterceptor } from "../../../../../../shared/interceptors/Interceptor";
import "../../../../../allcss/appqasettingscontainer/datacenterinterconnect/DciContainer.css";
import { DCI, EM, EXPLORER } from "../../../../../../shared/interceptors/EndPoints";
import { RtmLabelForDCI } from "../../../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { Save24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { FnConvertHierarchicalDataToTree } from "../../../../../../shared/allcommon/tree/FnConvertHierarchicalDataToTree";
import { FnProcessStringToCompare } from "../../../../../../shared/allcommon/basic/FnProcessStringToCompare";
import { FnFindNodeAndParents } from "../../../../../../shared/allcommon/tablegrid/FnFindNodeAndParents";
import { FnParseJsonSafely } from "../../../../../../appcontainer/allcommon/FnParseJsonSafely";
import { FnAddSubNode } from "../../../../../../shared/allcommon/tree/FnAddSubNode";
import { FnGetKeyFromEntId } from '../../../../../../shared/allcommon/settingsform/FnGetKeyFromEntId';
import { IApItem } from "../../../../../../shared/context/allinterface/IMainApp";
import { IControl } from "../../../../../../shared/allinterface/settingsform/ISettingsLibForm";
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from "../../../../../../shared/allinterface/tree/ITreeControl";
import { IDciContainer } from "../../../../../allinterface/iappqasettingscontainer/datacenterinterconnect/IDciContainer";
import { IConvertedTreeResponse, ITreeForHierarchicalDataContainer } from "../../../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { SettingsContainer } from "../../../../../../shared/settingsform/settingscontainer/SettingsContainer";
import { TreeForHierarchicalDataContainer } from "../../../../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";
import { ActionImage } from "../../../../../../shared/basic/actionimage/ActionImage";
import { PropertyFormContainer } from "../../../../../../shared/sidebar/propertyformcontainer/PropertyFormContainer";
import { YesNoFormContainer } from "../../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { IActionImageForSubMenu } from "../../../../../../shared/allinterface/basic/IActionImageList";


const DciContainer = (dciContainerProps: IDciContainer) => {
    const [TreeDataFrom, setTreeDataFrom] = useState<ITreeNode[]>([]);
    const [dciTreeSelectedNode, setDciTreeSelectedNode] = useState<ITreeNode | null>(null)
    const [selectedKeysFromSite, setselectedKeysFromSite] = useState<Key[]>([]);
    const [selectedKebabMenu, setSelectedKebabMenu] = useState<IActionImageForSubMenu | null>(null);
    const [defaultSelectedNodeInfoFrom, setdefaultSelectedNodeInfoFrom] = useState<ISelectedNodeInfo | null>(null);
    const [expandedKeysFrom, setExpandedKeysFrom] = useState<Key[]>([]);
    const [expandedKeysTo, setExpandedKeysTo] = useState<Key[]>([]);
    const [TreeDataTo, setTreeDataTo] = useState<ITreeNode[]>([]);
    const [selectedKeysToSite, setselectedKeysToSite] = useState<Key[]>([]);
    const [segmentProFileStr, setSegmentProfileStr] = useState<string | undefined>(undefined);
    const [defaultSelectedNodeInfoTo, setdefaultSelectedNodeInfoTo] = useState<ISelectedNodeInfo | null>(null);
    const [formControlsSegment, setFromControlSegment] = useState<IControl[] | null>()
    const [formControlDci, setFormControlDci] = useState<IControl[] | null>()

    const [dciUpdateData, setDciUpdateData] = useState<object>()
    const [ToUpdateData, setToUpdateData] = useState<object>()
    const [fromUpdateData, setFromUpdateData] = useState<object>()
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [showOkButtonOnly, setShowOkButtonOnly] = useState<boolean>(false);
    const [showSaveBtn, setShowSaveBtn] = useState<boolean>(false)

    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const selectedDciRef = useRef<any>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isAutoExpandingFromRef = useRef(false);
    const isAutoExpandingToRef = useRef(false);

    const expandPathFromRef = useRef<any[]>([]);
    const expandPathToRef = useRef<any[]>([]);
    const lastAutoExpandedFromRef = useRef<string | null>(null);
    const lastAutoExpandedToRef = useRef<string | null>(null);

    const treeContainerPropsFrom: ITreeForHierarchicalDataContainer = {
        uniqueName: dciContainerProps.uniqueName,
        apiData: null,
        featureId: dciContainerProps.featureId,
        featureTreeProps: {
            instanceName: "fromSite_tree",
            hideKebabMenu: true,
            allowCheckbox: false,
            allowIcon: false,
            isAllowDrag: false,
            hideCopyIcon: true,
            reuseFromCache: false,
            isAllowDrop: false,
            allowInternalDrag: false,
            openAllNodes: false
        },
        allowGenerateTreeData: false,
        defaultExpandedKeys: [],
        defaultCheckedKeys: [],
        isSiteByTenant: false,
        isFloorTree: false,
        allowAPICallOnExpand: false,
        allowAdd: false,
        allowEdit: false,
        allowDelete: false,
        allowMultiple: false,
        className: "tree-container",
        selectedNodeExplorer: undefined,
    }

    useEffect(() => {
        const handleDataCenterHierarchyApiResponse = (response: unknown, status?: string) => {
            if (status === "200" && response && typeof response === "object" &&
                'hierarchyJson' in response && response.hierarchyJson) {
                const apiData = FnParseJsonSafely(response.hierarchyJson as string)
                FnConvertHierarchicalDataToTree(apiData, treeContainerPropsFrom).then(
                    (result: IConvertedTreeResponse | undefined) => {
                        if (result) {

                            setTreeDataFrom(result.treeData);
                            setTreeDataTo(result.treeData);
                            setExpandedKeysFrom(result.expandedKeys);
                            setExpandedKeysTo(result.expandedKeys);
                            if (result.selectedKey && result.selectedNode) {

                                setselectedKeysFromSite([result.selectedKey]);
                                setselectedKeysToSite([result.selectedKey]);
                                result.selectedNode &&
                                    setdefaultSelectedNodeInfoFrom({
                                        event: "select",
                                        selected: true,
                                        node: result.selectedNode,
                                        selectedNodes: [result.selectedNode],
                                    });

                                result.selectedNode &&
                                    setdefaultSelectedNodeInfoTo({
                                        event: "select",
                                        selected: true,
                                        node: result.selectedNode,
                                        selectedNodes: [result.selectedNode],
                                    });
                            }
                        }
                        else {
                            setTreeDataFrom([]);
                            setTreeDataTo([]);
                        }
                    }
                );
            }
        }
        axiosInterceptor({
            url: EXPLORER.DatacenterHierarchy,
            data: { isDCI: true },
            setFetchData: handleDataCenterHierarchyApiResponse
        }, statusBarContext)
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, []);

    useEffect(() => {
        if (mainAppContext.apRecords) {
            const segmentControls = mainAppContext.apRecords?.filter((item) => { return item.GroupName?.toLowerCase().includes("apform_dcisegment") });
            if (segmentControls && segmentControls.length > 0) {
                mapFormControlToInterface(segmentControls, "segment")
            }
            const DciFrom = mainAppContext.apRecords?.filter((item) => { return item.GroupName === "APForm_DCI" });
            if (DciFrom && DciFrom.length > 0) {
                mapFormControlToInterface(DciFrom, "DCI")
            }
        }
    }, [mainAppContext.apRecords, dciTreeSelectedNode])

    useEffect(() => {
        if (dciContainerProps.selectedNode && dciContainerProps.selectedNodeEntID !== selectedDciRef.current) {
            setSelectedKebabMenu(null);
            setSegmentProfileStr('')
            setDciTreeSelectedNode(dciContainerProps.selectedNode)
        }
    }, [dciContainerProps.selectedNode])

    useEffect(() => {
        let checkNode = !isEqual(selectedDciRef.current, dciContainerProps.selectedNodeEntID)
        if (dciContainerProps.selectedNodeEntID && checkNode) {
            selectedDciRef.current = dciContainerProps
        }
    }, [dciContainerProps.selectedNodeEntID])

    useEffect(() => {
        if (dciContainerProps.selectedKebabMenu) {
            setSelectedKebabMenu(dciContainerProps.selectedKebabMenu);

        } else {
            setSelectedKebabMenu(null);
        }
    }, [dciContainerProps.selectedKebabMenu]);

    useEffect(() => {
        if (selectedKebabMenu && selectedKebabMenu.uniqueName == RtmLabelForDCI.AddDCI && TreeDataFrom && TreeDataTo) {
            if (TreeDataFrom.length) {
                const defaultFrom = TreeDataFrom[0].children && TreeDataFrom[0].children[0]
                setselectedKeysFromSite([defaultFrom.key])
                createApiPayloadForUpdateData("fromSite", defaultFrom)
                setdefaultSelectedNodeInfoFrom({
                    event: "select",
                    selected: true,
                    node: defaultFrom,
                    selectedNodes: [defaultFrom],
                });

            }
            if (TreeDataTo.length) {
                const defaultSite = TreeDataTo[0].children && TreeDataTo[0].children[0]
                setselectedKeysToSite([defaultSite.key])
                createApiPayloadForUpdateData("toSite", defaultSite)

                setdefaultSelectedNodeInfoTo({
                    event: "select",
                    selected: true,
                    node: defaultSite,
                    selectedNodes: [defaultSite],
                });
            }
        }
    }, [selectedKebabMenu, TreeDataFrom, TreeDataTo])

    const buildPath = (data: Record<string, any>) => {
        const path: Record<string, any>[] = [];
        Object.keys(data).forEach((item) => {
            if (FnProcessStringToCompare(item, "SiteName")) {
                path.push({ Name: "Sites", NodeType: "Helptip" });
                path.push({ Name: data[item], NodeType: "Site" });
            } else if (FnProcessStringToCompare(item, "RoomName")) {
                if (data[item]) path.push({ Name: data[item], NodeType: "Room" });
            } else if (FnProcessStringToCompare(item, "FloorName")) {
                if (data[item]) path.push({ Name: data[item], NodeType: "Floor" });
            } else if (FnProcessStringToCompare(item, "LocationName")) {
                if (data[item]) path.push({ Name: data[item], NodeType: "Location" });
            } else if (FnProcessStringToCompare(item, "DeviceName")) {
                if (data[item]) path.push({ Name: data[item], NodeType: "Device" });
            } else if (FnProcessStringToCompare(item, "PortName")) {
                if (data[item]) path.push({ Name: data[item], NodeType: "Port" });
            }
        });

        return path;
    };

    const autoExpandFrom = async (treeData: ITreeNode[], index: number) => {
        const path = expandPathFromRef.current;

        if (!path || index >= path.length) {
            isAutoExpandingFromRef.current = false;
            return;
        }

        const current = path[index];
        const nodeData = FnGetKeyFromEntId(treeData, current.Name, true);

        if (!nodeData?.node) {
            isAutoExpandingFromRef.current = false;
            return;
        }

        const node = nodeData.node.node;

        setExpandedKeysFrom(prev =>
            prev.includes(nodeData.key) ? prev : [...prev, nodeData.key]
        );

        if (index === path.length - 1) {
            setselectedKeysFromSite([nodeData.key]);
            setdefaultSelectedNodeInfoFrom({
                event: 'select',
                node: nodeData.node.node,
                selected: true,
                selectedNodes: []
            });
            isAutoExpandingFromRef.current = false;
            return;
        }

        if (node.NodeType?.toLowerCase() === "floor") {
            axiosInterceptor({
                url: DCI.ContainedByDevices,
                data: { floorID: node.NodeEntID },
                setFetchData: async (_resp: unknown, status?: string) => {
                    if (status === "200" && _resp && typeof _resp === "object" && 'dciJson' in _resp && _resp?.dciJson) {
                        const parsed = FnParseJsonSafely(_resp.dciJson as string);
                        const converted = await FnConvertHierarchicalDataToTree(parsed, treeContainerPropsFrom);
                        if (converted) {

                            const updatedTree = await FnAddSubNode(
                                TreeDataFrom,
                                node.key,
                                converted.treeData.length > 1
                                    ? converted.treeData
                                    : converted.treeData[0].children,
                                treeContainerPropsFrom.featureTreeProps,
                                dciContainerProps.featureId,
                                false,
                                node.stepNo
                            );

                            setTreeDataFrom(updatedTree);

                            setTimeout(() => {
                                autoExpandFrom(updatedTree, index + 1);
                            }, 0);
                        }
                        else {
                            setTreeDataFrom([]

                            )
                        }
                    }
                }
            }, statusBarContext);
        } else {
            autoExpandFrom(node.children || [], index + 1);
        }
    };

    const autoExpandTo = async (treeData: ITreeNode[], index: number) => {
        const path = expandPathToRef.current;

        if (!path || index >= path.length) {
            isAutoExpandingToRef.current = false;
            return;
        }

        const current = path[index];
        const nodeData = FnGetKeyFromEntId(treeData, current.Name, true);

        if (!nodeData?.node) {
            isAutoExpandingToRef.current = false;
            return;
        }

        const node = nodeData.node.node;

        setExpandedKeysTo(prev =>
            prev.includes(nodeData.key) ? prev : [...prev, nodeData.key]
        );

        if (index === path.length - 1) {
            setselectedKeysToSite([nodeData.key]);
            setdefaultSelectedNodeInfoTo({
                event: 'select',
                node: nodeData.node.node,
                selected: true,
                selectedNodes: []
            });
            isAutoExpandingToRef.current = false;
            return;
        }

        if (node.NodeType?.toLowerCase() === "floor") {
            axiosInterceptor({
                url: DCI.ContainedByDevices,
                data: { floorID: node.NodeEntID },
                setFetchData: async (_resp: unknown, status?: string) => {
                    if (status === "200" && _resp && typeof _resp === "object" && 'dciJson' in _resp && _resp?.dciJson) {
                        const parsed = FnParseJsonSafely(_resp.dciJson as string);
                        const converted = await FnConvertHierarchicalDataToTree(parsed, treeContainerPropsFrom);
                        if (converted) {
                            const updatedTree = await FnAddSubNode(
                                TreeDataTo,
                                node.key,
                                converted.treeData.length > 1
                                    ? converted.treeData
                                    : converted.treeData[0].children,
                                treeContainerPropsFrom.featureTreeProps,
                                dciContainerProps.featureId,
                                false,
                                node.stepNo
                            );

                            setTreeDataTo(updatedTree);

                            setTimeout(() => {
                                autoExpandTo(updatedTree, index + 1);
                            }, 0);
                        }
                        else {
                            setTreeDataTo([])
                        }
                    }
                }
            }, statusBarContext);
        } else {
            autoExpandTo(node.children || [], index + 1);
        }
    };

    useEffect(() => {
        const currentNodeId = dciContainerProps.selectedNode?.DCIFromSiteNode?.EntID;

        if (
            currentNodeId &&
            TreeDataFrom.length > 0 &&
            !isAutoExpandingFromRef.current &&
            lastAutoExpandedFromRef.current !== currentNodeId
        ) {
            lastAutoExpandedFromRef.current = currentNodeId;

            const path = dciContainerProps.selectedNode && dciContainerProps.selectedNode &&
                dciContainerProps.selectedNode.DCIFromSiteNode ? buildPath(dciContainerProps.selectedNode.DCIFromSiteNode) : [];
            expandPathFromRef.current = path;
            isAutoExpandingFromRef.current = true;

            autoExpandFrom(TreeDataFrom, 0);
        }

        const currentToNodeId = dciContainerProps.selectedNode?.DCIToSiteNode?.EntID;

        if (
            currentToNodeId &&
            TreeDataTo.length > 0 &&
            !isAutoExpandingToRef.current &&
            lastAutoExpandedToRef.current !== currentToNodeId
        ) {
            lastAutoExpandedToRef.current = currentToNodeId;

            const path = dciContainerProps.selectedNode && dciContainerProps.selectedNode &&
                dciContainerProps.selectedNode.DCIToSiteNode ? buildPath(dciContainerProps.selectedNode.DCIToSiteNode) : []
            expandPathToRef.current = path;
            isAutoExpandingToRef.current = true;
            autoExpandTo(TreeDataTo, 0);
        }
    }, [
        dciContainerProps.selectedNode?.DCIFromSiteNode,
        dciContainerProps.selectedNode?.DCIToSiteNode,
        TreeDataFrom,
        TreeDataTo
    ]);

    useEffect(() => {
        let checkNode = !isEqual(selectedDciRef.current, dciTreeSelectedNode)
        if (dciTreeSelectedNode && dciTreeSelectedNode.NodeType === "DCISegmentNode" && checkNode) {
            const jsonProfile = JSON.stringify([{
                RecID: dciTreeSelectedNode.RecId,
                EntID: dciTreeSelectedNode.EntID,
                EntityName: dciTreeSelectedNode.EntityName,
                Name: dciTreeSelectedNode.Name,
                Desc250: dciTreeSelectedNode.Description,
                CableType: dciTreeSelectedNode.CableType,
                CableWidth: dciTreeSelectedNode.CableWidth,
                CableColor: dciTreeSelectedNode.CableColor,
                SegmentAttribute: dciTreeSelectedNode.SegmentAttribute,
                SegmentDeployment: dciTreeSelectedNode.SegmentDeployment,
                SegmentLandingPoint: dciTreeSelectedNode.SegmentDeployment,
                SegmentGPSWayPoints: dciTreeSelectedNode.SegmentGPSWayPoints,
                NodeType: dciTreeSelectedNode.NodeType,
            }]);
            setSegmentProfileStr(jsonProfile)
        }
    }, [dciTreeSelectedNode]);

    const createApiPayloadForUpdateData = async (name: string, selectedNode: ITreeNode | any, returnDataNotCallApi?: boolean, DCIName?: string) => {
        let objTreeDataApi = null
        let treedata = name === "fromSite" ? TreeDataFrom : TreeDataTo
        let parentObj: ITreeNode[] | null = await FnFindNodeAndParents(treedata, selectedNode.key)
        let DataObject: Record<string, any> = { _Site: "", SiteID: "", RoomID: "", FloorID: "", LocationID: "", DeviceID: "", _Room: "", _Floor: "", _Device: "", _Location: "", PortName: "", PortEntityName: "", PortEntID: "" }
        parentObj && parentObj.forEach((element: ITreeNode) => {
            if (element?.NodeType === "Site") {
                DataObject._Site = element.Name
                DataObject.SiteID = element.NodeEntID
            } else if (element?.NodeType === "Room") {
                DataObject._Room = element.Name
                DataObject.RoomID = element.NodeEntID
            } else if (element?.NodeType === "Floor") {
                DataObject._Floor = element.Name
                DataObject.FloorID = element.NodeEntID
            } else if (element?.treetype.toLowerCase() === "device") {
                DataObject._Device = element.Name
                DataObject.DeviceID = element.NodeEntID
            } else if (element?.NodeType === "Location") {
                DataObject._Location = element.Name
                DataObject.LocationID = element.NodeEntID
            } else if (element?.NodeType === "Port") {
                DataObject.PortName = element.Name
                DataObject.PortEntityName = element.NodeEntityname
                DataObject.PortEntID = element.NodeEntID
            } else {
                DataObject.PortName = ""
                DataObject.PortEntityName = ""
                DataObject.PortEntID = ""
            }
        });
        if (name === "toSite") {
            if (dciContainerProps?.selectedNode && dciContainerProps?.selectedNode && dciContainerProps?.selectedNode?.DCIToSiteNode && !returnDataNotCallApi) {
                let siteObj = dciContainerProps?.selectedNode?.DCIToSiteNode
                if (siteObj) {
                    let dataObj = { ...DataObject }
                    dataObj.FromToFlag = "To"
                    dataObj.EntID = siteObj.EntID
                    dataObj.RecID = siteObj.RecID
                    dataObj.DCIEntID = siteObj.EntID
                    dataObj._DCI = siteObj.Name
                    if (dataObj)
                        setToUpdateData(dataObj)
                }
            } else {
                let dataObj = { ...DataObject }
                dataObj.FromToFlag = "To"
                dataObj.EntityName = 'DCI'
                dataObj._DCI = DCIName
                objTreeDataApi = dataObj
            }
        }
        if (name === "fromSite") {
            let siteObj = dciContainerProps?.selectedNode?.DCIFromSiteNode
            if (siteObj && !returnDataNotCallApi) {
                let dataObj = { ...DataObject }
                dataObj.FromToFlag = "From"
                dataObj.EntID = siteObj.EntID
                dataObj.RecID = siteObj.RecID
                dataObj.DCIEntID = siteObj.EntID
                dataObj._DCI = siteObj.Name
                if (dataObj)
                    setFromUpdateData(dataObj)
            } else {
                let dataObj = { ...DataObject }
                dataObj.FromToFlag = "From"
                dataObj.EntityName = 'DCI'
                dataObj._DCI = DCIName
                objTreeDataApi = dataObj
            }

        }
        return objTreeDataApi
    }

    const apiCallforDCI = async (treeSelectData: Record<string, any>, entityTable: string) => {
        let jsonData = { [entityTable]: [treeSelectData] };
        axiosInterceptor({
            url: EM.UpdateTableRecord,
            data: { jsonString: JSON.stringify(jsonData) },
            setFetchData: (_resp: unknown, status?: string) => {
                if (status === "200") {
                    if ((!fromUpdateData && !ToUpdateData) && dciUpdateData) {
                        dciContainerProps.handleReloadDCITree(dciTreeSelectedNode?.RecID ?? "")
                    }
                    setShowSaveBtn(false)
                }
            }
        }, statusBarContext)

    }
    const handleSelectTree = (treeName: string, info: ISelectedNodeInfo) => {
        createApiPayloadForUpdateData(treeName, info.node)
    }

    const handleSaveAction = async (entityName: string, propertyJson: string, id: string | undefined) => {
        if (defaultSelectedNodeInfoFrom?.node.NodeEntID === defaultSelectedNodeInfoTo?.node.NodeEntID) {
            setConfirmMessage("Interconnect is not allowed when From and To node are same.")
            setShowOkButtonOnly(true);
            setDeleteOpen(true)
            return
        }
        const handleAddResponse = (response: unknown, status?: string) => {
            if (status === "200" && response && typeof response === "object" && 'jsonStringOutput' in response && response.jsonStringOutput) {
                let data = FnParseJsonSafely(response.jsonStringOutput as string)
                if (entityName === "PG.DCIPathSegment") {
                    if (data) {
                        data = Object.values(data)[0]
                        if (data[0].RecID) {
                            dciContainerProps.handleReloadDCITree(data[0].RecID ?? "")
                            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
                            if (saveButton) {
                                saveButton.style.display = "none";
                            }
                        } else {
                            dciContainerProps.handleReloadDCITree(dciTreeSelectedNode?.RecID ?? "")
                        }
                    }


                } else {
                    if (data) {
                        data = Object.values(data)[0]
                        if (data[0].RecID) {
                            dciContainerProps.handleReloadDCITree(data[0].RecID ?? "")
                            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
                            if (saveButton) {
                                saveButton.style.display = "none";
                            }

                        } else {
                            dciContainerProps.handleReloadDCITree(dciTreeSelectedNode?.RecID ?? "")
                        }
                    } else {
                        dciContainerProps.handleReloadDCITree(dciTreeSelectedNode?.RecID ?? "")
                    }
                    setDciTreeSelectedNode(null)
                    setSegmentProfileStr('')
                    setShowSaveBtn(false);
                }
                setSelectedKebabMenu(null)
            }
            else {
                setConfirmMessage("Something went wrong in Add DataCenter Interconntect.")
                setShowOkButtonOnly(true);
                setDeleteOpen(true)
            }
        }
        let payloadJson = propertyJson && typeof propertyJson === 'string' && FnParseJsonSafely(propertyJson)
        if (entityName === "PG.DCIPathSegment" && payloadJson.length) {
            if (id) {
                payloadJson = {
                    ...payloadJson[0],
                    EntID: dciTreeSelectedNode?.NodeEntID,
                    EntityName: dciTreeSelectedNode?.NodeEntityname,
                    RecID: id
                }
            } else {
                payloadJson = {
                    ...payloadJson[0],
                    EntID: dciTreeSelectedNode?.NodeEntID,
                    EntityName: dciTreeSelectedNode?.NodeEntityname
                }
            }
        }
        if (id) {
            const payload = {
                [entityName]: [payloadJson]
            }
            axiosInterceptor({
                url: EM.UpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payload)
                },
                setFetchData: handleAddResponse
            }, statusBarContext);
        } else {
            if (entityName === "PG.DCIPathSegment") {
                const payload = {
                    [entityName]: [payloadJson]
                }
                axiosInterceptor({
                    url: EM.AddTableRecord,
                    data: {
                        jsonString: JSON.stringify(payload)
                    },
                    setFetchData: handleAddResponse
                }, statusBarContext);
            } else {
                let dci = propertyJson && typeof propertyJson === 'string' && FnParseJsonSafely(propertyJson)
                let fromData = await createApiPayloadForUpdateData("fromSite", defaultSelectedNodeInfoFrom && defaultSelectedNodeInfoFrom.node, true, dci[0]._DCI)
                let toData = await createApiPayloadForUpdateData("toSite", defaultSelectedNodeInfoTo && defaultSelectedNodeInfoTo.node, true, dci[0]._DCI)

                const payload = {
                    [entityName]: payloadJson,
                    "PG.DCINode": [fromData, toData]
                }
                axiosInterceptor({
                    url: EM.AddUpdateMultipleTableRecords,
                    data: {
                        jsonString: JSON.stringify(payload)
                    },
                    setFetchData: handleAddResponse
                }, statusBarContext);
            }

        }
    }

    const mapFormControlToInterface = (controls: IApItem[], entityName: string) => {
        var array: IControl[] = [];
        controls.forEach((element) => {
            array.push({
                RecID: element.RecID,
                CanChange: element.CanChange,
                GroupName: element.GroupName,
                DefaultAPValue: element.DefaultAPValue,
                GroupNameDesc: element.GroupNameDesc,
                SubGroupName: element.SubGroupName,
                SubGroupNameDesc: element.SubGroupNameDesc,
                ChangeEvent: element.ChangeEvent,
                EntID: element.EntID,
                EntityName: element.EntityName,
                PropertyLabel: element.PropertyLabel,
                _AP: element.Name,
                Name: element.Name,
                NameDesc: element.NameDesc,
                Value: element.Value ? element.Value : element.IsRequired ? element.DefaultAPValue : "",
                ValueDesc: element.ValueDesc,
                MaxInstances: element.MaxInstances,
                IsNZ: element.IsNZ,
                IsRequired: element.IsRequired,
                LastUpdated: element.LastUpdated,
                SortOrder: element.SortOrder,
                DisplayControl: element.DisplayControl,
                InputMask: element.InputMask,
                RegEx: element.RegEx,
                DisplayGroupControl: element.DisplayGroupControl,
                IsSaved: false,
                OldValue: element.Value,
                IsReadOnly: element.DisplayControl === "TextControl" ? true : false,
                SubGroupEntID: "",
                Secured: false,
                disabled: false
            });

        });
        array.sort((a, b) => a.SortOrder > b.SortOrder ? 1 : -1)
        if (entityName === "DCI") {
            setFormControlDci(array)
        } else {
            setFromControlSegment(array)
        }
    }

    const handleApValueChange = (propertyData?: Record<string, any>): boolean => {
        let dataObj = propertyData ?? {}
        setDciUpdateData(dataObj)
        setShowSaveBtn(true)
        return true;
    }

    const handleSaveDci = () => {
        if (dciUpdateData) {
            apiCallforDCI(dciUpdateData, "_DCI")
        }
        if (fromUpdateData || ToUpdateData) {
            if (defaultSelectedNodeInfoFrom?.node.NodeEntID === defaultSelectedNodeInfoTo?.node.NodeEntID) {
                setConfirmMessage("Interconnect is not allowed when From and To node are same.")
                setShowOkButtonOnly(true);
                setDeleteOpen(true)
                return
            }
            // popup on 
            setConfirmMessage("All waypoints will be lost! Do you wish to continue ?")
            setShowOkButtonOnly(false);
            setDeleteOpen(true)
        }
        setDciUpdateData(undefined)
    }

    const handleConfirmYesClick = async () => {
        setConfirmMessage('')
        setDeleteOpen(false)
        let entityTableName = `PG.DCINode`;

        if (fromUpdateData) {
            await apiCallforDCI(fromUpdateData, entityTableName)
        }
        if (ToUpdateData) {
            await apiCallforDCI(ToUpdateData, entityTableName)
        }
        setFromUpdateData(undefined)
        setToUpdateData(undefined)

        if (dciTreeSelectedNode?.children.length) {
            let RecID = []
            for (let index = 0; index < dciTreeSelectedNode?.children.length; index++) {
                const element = dciTreeSelectedNode?.children[index];
                RecID.push(element.RecID)
            }
            axiosInterceptor({
                url: EM.DeleteTableRecords,
                data: { tableName: 'PG.DCIPathSegment', recIDs: RecID.join(";") },
                setFetchData: () => {
                    if ((!fromUpdateData && !ToUpdateData) && dciUpdateData) {
                        dciContainerProps.handleReloadDCITree(dciTreeSelectedNode?.RecID ?? "")
                    }

                    setShowSaveBtn(false)
                }
            }, statusBarContext)

        } else {
            timeoutRef.current = setTimeout(() => {
                dciContainerProps.handleReloadDCITree(dciTreeSelectedNode?.RecID ?? "")
            }, 500)
        }

    }

    const handleRefreshUpdatedRecord = (newAddedId: string, newAddedName: string, action?: "save" | "back" | undefined): void => {
        dciContainerProps.handleReloadDCITree(newAddedId)
    }

    const handleNodeExpandFrom = (expandedNodeKeys: Key[], info: IExpandedNodeInfo): void => {
        if (info.node.NodeType?.toLowerCase() === "floor") {
            axiosInterceptor({
                url: DCI.ContainedByDevices,
                data: { floorID: info.node.NodeEntID },
                setFetchData: async (_resp: unknown, status?: string) => {
                    if (status === "200" && _resp && typeof _resp === "object" && 'dciJson' in _resp) {

                        const parsedData = FnParseJsonSafely(_resp.dciJson as string)
                        const convertedData = await FnConvertHierarchicalDataToTree(parsedData, treeContainerPropsFrom)
                        if (convertedData && convertedData.treeData && convertedData.treeData.length > 0) {

                            const updatedTree = await FnAddSubNode(TreeDataFrom, info.node.key, convertedData.treeData.length > 1 ? convertedData.treeData : convertedData.treeData[0].children, treeContainerPropsFrom.featureTreeProps, dciContainerProps.featureId, false, info.node.stepNo);

                            const newSelectedKey = convertedData.treeData.length > 1
                                ? convertedData.treeData[0].key
                                : convertedData.treeData[0].children[0].key;
                            setTreeDataFrom(updatedTree);

                            setExpandedKeysFrom(prev => {
                                const newKeys = new Set(prev);
                                newKeys.add(info.node.key);
                                return Array.from(newKeys);
                            });

                            setTimeout(async () => {
                                const nodeData = await FnGetKeyFromEntId(updatedTree, newSelectedKey, true);

                                if (nodeData?.node) {
                                    setselectedKeysFromSite([nodeData.key]);

                                    setdefaultSelectedNodeInfoFrom({
                                        event: "select",
                                        node: nodeData.node.node,
                                        selected: true,
                                        selectedNodes: [nodeData.node.node]
                                    });
                                }
                            }, 0);

                        }
                    }
                }
            }, statusBarContext)
        }
    }
    const handleNodeExpandTo = (expandedNodeKeys: Key[], info: IExpandedNodeInfo): void => {
        if (info.node.NodeType?.toLowerCase() === "floor") {
            axiosInterceptor({
                url: DCI.ContainedByDevices,
                data: { floorID: info.node.NodeEntID },
                setFetchData: async (_resp: unknown, status?: string) => {
                    if (status === "200" && _resp && typeof _resp === "object" && 'dciJson' in _resp) {

                        const parsedData = FnParseJsonSafely(_resp.dciJson as string);
                        const convertedData = await FnConvertHierarchicalDataToTree(parsedData, treeContainerPropsFrom);

                        if (convertedData && convertedData.treeData && convertedData.treeData.length > 0) {

                            const updatedTree = await FnAddSubNode(
                                TreeDataTo,
                                info.node.key,
                                convertedData.treeData.length > 1
                                    ? convertedData.treeData
                                    : convertedData.treeData[0].children,
                                treeContainerPropsFrom.featureTreeProps,
                                dciContainerProps.featureId,
                                false,
                                info.node.stepNo
                            );

                            const newSelectedKey = convertedData.treeData.length > 1
                                ? convertedData.treeData[0].key
                                : convertedData.treeData[0].children[0].key;

                            setTreeDataTo(updatedTree);

                            setExpandedKeysTo(prev => {
                                const newKeys = new Set(prev);
                                newKeys.add(info.node.key);
                                return Array.from(newKeys);
                            });

                            setTimeout(async () => {
                                const nodeData = FnGetKeyFromEntId(updatedTree, newSelectedKey, true);

                                if (nodeData?.node) {
                                    setselectedKeysToSite([nodeData.key]);

                                    setdefaultSelectedNodeInfoTo({
                                        event: "select",
                                        node: nodeData.node.node,
                                        selected: true,
                                        selectedNodes: [nodeData.node.node]
                                    });
                                }
                            }, 0);
                        }
                    }
                }
            }, statusBarContext);
        }
    };
    return (
        <div className="nz-dci-container-main">
            {formControlsSegment &&
                dciTreeSelectedNode && dciTreeSelectedNode.NodeType === "DCISegmentNode" ? (
                <>
                    <SettingsContainer
                        uniqueName={"DCI_segment"}
                        formControls={formControlsSegment as IControl[]}
                        allowActionList={false}
                        allowAdd={false}
                        allowDelete={false}
                        isAutoSave={false}
                        featureId={""}
                        group="DCISegment"
                        subGroup="DCISegment"
                        showEditButton={false}
                        allowShowHeader={true}
                        headerText={'Edit DCI Segment'}
                        profileString={
                            segmentProFileStr
                        }
                        id={segmentProFileStr && dciTreeSelectedNode?.NodeType === "DCISegmentNode" ? dciTreeSelectedNode?.RecID : ""}
                        handleSaveAction={(profileData: string, id?: string) => {
                            handleSaveAction("PG.DCIPathSegment", profileData, id)
                        }}
                    />
                </>
            ) : (
                <>
                    {dciTreeSelectedNode && dciTreeSelectedNode.NodeType !== "DCISegmentNode" &&
                        <>
                            <div className="nz-dci-container-grid">
                                {selectedKebabMenu &&
                                    selectedKebabMenu?.uniqueName === RtmLabelForDCI.AddDCI && formControlDci ? (
                                    <SettingsContainer
                                        headerText={selectedKebabMenu?.uniqueName}
                                        uniqueName={"DCI"}
                                        formControls={formControlDci}
                                        allowActionList={false}
                                        allowAdd={true}
                                        allowDelete={false}
                                        isAutoSave={false}
                                        group="DCI"
                                        subGroup={"DCI"}
                                        featureId=""
                                        profileString=""
                                        showEditButton={false}
                                        allowShowHeader={true}
                                        handleSaveAction={(profileData: string, id?: string) => {
                                            handleSaveAction("_DCI", profileData, id)
                                        }}
                                    />
                                ) : (
                                    dciTreeSelectedNode && (<div className="nz-dci-container-grid-container">
                                        <div className="nz-sub-header">
                                            <div className="nz-qa-bar-title">
                                                {`${dciTreeSelectedNode?.NodeEntityname
                                                    ? dciTreeSelectedNode?.NodeEntityname?.replace("__", "")
                                                    : ""
                                                    }${dciTreeSelectedNode?.Name
                                                        ? dciTreeSelectedNode?.NodeEntityname
                                                            ? `: ${dciTreeSelectedNode?.Name}`
                                                            : `${dciTreeSelectedNode?.Name}`
                                                        : ""
                                                    } `}
                                            </div>
                                            <div className={`saveButton  
                                            nz-save-yellow-background 
                                                 ${!showSaveBtn ? 'nz-hide-save-button' : ''}
                                            `} >

                                                <ActionImage
                                                    image={{
                                                        uniqueName: "Save",
                                                        source: <Save24x24
                                                            size={FnGetCssVariable('--image-size-1')}
                                                            fill='none'
                                                            strokeWidth={1} />,
                                                        type: "svg",
                                                        w: "var(--image-size-2)",
                                                        h: "var(--image-size-2)",
                                                        tooltip: 'Save Changes'
                                                    }}
                                                    w='var(--node_height)'
                                                    h='var(--node_height)'
                                                    uniqueName='Save icon'
                                                    actionCode='Save click'
                                                    handleMouse={() => {
                                                        handleSaveDci()
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <PropertyFormContainer
                                            uniqueName={"PropertyPaneForDci"}
                                            featureId={dciContainerProps.featureId}
                                            selectedNode={dciTreeSelectedNode}
                                            selectedNodeMenu={undefined}
                                            isAllowCustomAction={false}
                                            isReadOnly={false}
                                            handlePropertyChange={handleApValueChange}
                                            handleRefreshUpdatedRecord={handleRefreshUpdatedRecord} />


                                    </div>)
                                )}
                            </div>
                            <div className="nz-dci-container-tree">
                                <div className="nz-dci-tree-one">
                                    <div className="nz-sub-header">
                                        <div className="nz-qa-bar-title">From Site</div>
                                    </div>
                                    {TreeDataFrom && selectedKeysFromSite && (
                                        <TreeForHierarchicalDataContainer
                                            uniqueName={"fromSite"}
                                            apiData={TreeDataFrom}
                                            featureId={"95"}
                                            featureTreeProps={{
                                                instanceName: "fromSite_tree",
                                                hideKebabMenu: true,
                                                allowCheckbox: false,
                                                allowIcon: false,
                                                isAllowDrag: false,
                                                hideCopyIcon: true,
                                                reuseFromCache: false,
                                                isAllowDrop: false,
                                                allowInternalDrag: false,
                                                openAllNodes: false
                                            }}
                                            allowGenerateTreeData={false}
                                            defaultExpandedKeys={expandedKeysFrom}
                                            defaultCheckedKeys={[]}
                                            isSiteByTenant={false}
                                            isFloorTree={false}
                                            allowAPICallOnExpand={false}
                                            allowAdd={false}
                                            allowEdit={false}
                                            allowDelete={false}
                                            allowMultiple={false}
                                            className={"tree-container"}
                                            selectedNodeExplorer={undefined}
                                            defaultSelectedKeys={selectedKeysFromSite}
                                            defaultSelectedNodeInfo={
                                                defaultSelectedNodeInfoFrom || undefined
                                            }
                                            handleNodeSelect={(
                                                selectedKeysFromSite: Key[],
                                                info: ISelectedNodeInfo,
                                                expandedKeys: Key[]
                                            ) => {

                                                if (info && info.node) {
                                                    setselectedKeysFromSite([info.node.key]);
                                                    setExpandedKeysFrom(expandedKeys);
                                                    setdefaultSelectedNodeInfoFrom(info);
                                                    handleSelectTree('fromSite', info);

                                                    setShowSaveBtn(true)
                                                }
                                            }}
                                            handleNodeExpand={handleNodeExpandFrom}
                                        />
                                    )}
                                </div>
                                <div className="nz-dci-tree-two">
                                    <div className="nz-sub-header">
                                        <div className="nz-qa-bar-title">To Site</div>
                                    </div>
                                    {TreeDataTo && selectedKeysToSite && (
                                        <TreeForHierarchicalDataContainer
                                            uniqueName={"toSite"}
                                            apiData={TreeDataTo}
                                            featureId={"95"}
                                            featureTreeProps={{
                                                instanceName: "fromSite_tree",
                                                hideKebabMenu: true,
                                                allowCheckbox: false,
                                                allowIcon: false,
                                                isAllowDrag: false,
                                                hideCopyIcon: true,
                                                reuseFromCache: false,
                                                isAllowDrop: false,
                                                allowInternalDrag: false,
                                                openAllNodes: false
                                            }}
                                            allowGenerateTreeData={false}
                                            defaultExpandedKeys={expandedKeysTo}
                                            defaultCheckedKeys={[]}
                                            isSiteByTenant={false}
                                            isFloorTree={false}
                                            allowAPICallOnExpand={false}
                                            allowAdd={false}
                                            allowEdit={false}
                                            allowDelete={false}
                                            allowMultiple={false}
                                            className={"tree-container"}
                                            selectedNodeExplorer={undefined}
                                            defaultSelectedKeys={selectedKeysToSite}
                                            defaultSelectedNodeInfo={
                                                defaultSelectedNodeInfoTo || undefined
                                            }
                                            handleNodeSelect={(
                                                selectedKeysToSite: Key[],
                                                info: ISelectedNodeInfo,
                                                expandedKeys: Key[]
                                            ) => {

                                                if (info && info.node) {
                                                    setselectedKeysToSite([info.node.key]);
                                                    setExpandedKeysTo(expandedKeys);
                                                    setdefaultSelectedNodeInfoTo(info);
                                                    handleSelectTree('toSite', info);

                                                    setShowSaveBtn(true)
                                                }
                                            }}
                                            handleNodeExpand={handleNodeExpandTo}
                                        />
                                    )}
                                </div>
                            </div>
                        </>}
                </>
            )}
            <YesNoFormContainer
                isOpen={deleteOpen}
                uniqueName={dciContainerProps.uniqueName}
                message={confirmMessage}
                showOkButton={showOkButtonOnly}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={() => {
                    setDeleteOpen(false);
                    setToUpdateData(undefined)
                    setFromUpdateData(undefined)
                }}
                handleOkButtonClick={() => {
                    setDeleteOpen(false);
                }}
            />
        </div>
    );
};
export { DciContainer }
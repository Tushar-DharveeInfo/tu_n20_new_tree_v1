
import { GoogleMapAllSiteRootNode, GoogleMapTenantRootNode, GoogleMapTreeRootNode } from "../../alldefaultprops/tree/DefaultPropsTreeForFlatDataContainer";
import { FEnums } from "../../../constants/Feature";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { AppQA } from "../../../constants/Feature";

// This function convert flat data to Hierarchy data 
function FnBuildRcTreeData(data: any[], currentNodeId: string | null = null, featureId: string | null = null, selectedDC: "AllSites" | "TenantsBySite" | "SitesByTenant" = "AllSites", instanceName?: string, disableSort?: boolean): ITreeNode[] {
    try {
        const nodeMap: { [key: string]: ITreeNode } = {};

        const nodeTypePropertyMap: { [key: string]: string[] } = {
            'Site': ['SiteAddress', 'SiteGPS', 'SiteContact', 'SiteStats'],
            'Tenant': ['TenantAddress', 'TenantGPS', 'TenantContact', 'TenantStats']
            // Add more node types as needed
        };

        // Function to extract properties based on the node type
        const extractProperties = (item: any, nodeType: string): Partial<ITreeNode> => {
            const nodeProperties = nodeTypePropertyMap[nodeType] || [];
            const nodeData: Partial<ITreeNode> = {};

            // Dynamically assign properties from the item to the node based on the node type's properties
            nodeProperties.forEach(prop => {
                const propKey = prop.replace(nodeType, ''); // Remove node type prefix for cleaner property names
                nodeData[propKey] = item[prop];
            });

            return nodeData;
        };
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            if (instanceName !== "DeviceModel" && (featureId === AppQA.Settings || featureId === FEnums.InventoryManagement || featureId === FEnums.InventoryConfiguration) && item.ManufacturerName && item.EqtypeName && item.ManufacturerName.length > 0) {
                item.ManufacturerEntID = `${item.LocationEntID}##${item.ManufacturerName}`;
                item.ManufacturerParentID = item.LocationEntID;
                item.EqtypeEntID = `${item.LocationEntID}##${item.ManufacturerName}##${item.EqtypeName}`;
                item.EqtypeParentID = `${item.LocationEntID}##${item.ManufacturerName}`;
                item.DeviceParentID = `${item.LocationEntID}##${item.ManufacturerName}##${item.EqtypeName}`;
            }
            else if (featureId === FEnums.SelectDataCenterSite.toString()) {
                item.RoomEntID = null;
                item.FloorEntID = null;
                item.RootEntID = selectedDC === "SitesByTenant" ? GoogleMapTenantRootNode.RootEntID : selectedDC === "AllSites" ? GoogleMapAllSiteRootNode.RootEntID : GoogleMapTreeRootNode.RootEntID;
                item.RootName = selectedDC === "SitesByTenant" ? GoogleMapTenantRootNode.RootName : selectedDC === "AllSites" ? GoogleMapAllSiteRootNode.RootName : GoogleMapTreeRootNode.RootName;
                item.RootDescription = selectedDC === "SitesByTenant" ? GoogleMapTenantRootNode.RootDescription : selectedDC === "AllSites" ? GoogleMapAllSiteRootNode.RootDescription : GoogleMapTreeRootNode.RootDescription;
                item.RootNodeType = selectedDC === "SitesByTenant" ? GoogleMapTenantRootNode.RootNodeType : selectedDC === "AllSites" ? GoogleMapAllSiteRootNode.RootNodeType : GoogleMapTreeRootNode.RootNodeType
                item.RootHasChildren = selectedDC === "SitesByTenant" ? GoogleMapTenantRootNode.RootHasChildren : selectedDC === "AllSites" ? GoogleMapAllSiteRootNode.RootHasChildren : GoogleMapTreeRootNode.RootHasChildren
                if (item.TenantEntID) {

                    if (selectedDC === "SitesByTenant") {
                        item.TenantParentID = item.RootEntID;
                        item.SiteParentID = item.TenantEntID;
                        item.SiteEntID = `${item.SiteEntID}##${item.TenantEntID}`
                        item.TenantHasChildren = 1;
                        item.SiteHasChildren = 0
                    }
                    else {
                        item.SiteParentID = item.RootEntID;
                        item.TenantParentID = item.SiteEntID;
                        item.TenantEntID = `${item.TenantEntID}##${item.SiteEntID}`
                        item.TenantHasChildren = 0;
                        item.SiteHasChildren = 1;
                    }
                }
                else if (selectedDC !== "SitesByTenant") {

                    item.SiteParentID = item.RootEntID;
                    item.SiteHasChildren = 0;
                }
                else {
                    continue
                }
            }
            const nodeTypes = ['Site', 'Tenant', 'Room', 'Floor', 'Location', 'Manufacturer', 'Eqtype', 'Product', 'View', 'Device', 'DeviceView', 'DeviceSlot', 'DeviceNetworkPort', 'DevicePowerPort', 'Entity', 'PropertyGroup', 'Property', 'Root', 'Group', 'SubGroup', 'MountedDevice'];
            for (let i = 0; i < nodeTypes.length; i++) {
                const deviceParentType = item["LocationType"];
                const nodeType = nodeTypes[i];
                const id = item[`${nodeType}EntID`];
                const parentId = item[`${nodeType}ParentID`] ? item[`${nodeType}ParentID`] : item[`${nodeType}ParentEntID`];
                if (id) {
                    if (!nodeMap[id]) {
                        const nodeData = extractProperties(item, nodeType);
                        const showCheckbox = (item[`${nodeType}NodeType`] || '') === "Site" || (item[`${nodeType}NodeType`] || '') === "Room"
                            || (item[`${nodeType}NodeType`] || '') === "Floor" || (item[`${nodeType}NodeType`] || '') === "Location"
                            || ((item[`${nodeType}NodeType`] || '') === "Device" && (featureId !== FEnums.ConfigureDevice && featureId !== FEnums.EditPowerCabling && featureId !== FEnums.EditNetworkCabling))
                            || (item[`${nodeType}NodeType`] || '') === "FrontView"
                            || (item[`${nodeType}NodeType`] || '') === "Rack"
                            || (item[`${nodeType}NodeType`] || '') === "RearView" ? false : true;

                        nodeMap[id] = {
                            title: item[`${nodeType}Name`] || '',
                            key: id,
                            NodeEntID: id,
                            NodeEntityname: item[`${nodeType}EntityName`] || '',
                            Name: item[`${nodeType}Name`] || '',
                            PGClassName: item[`${nodeType}PGClassName`] || '',
                            Description: item[`${nodeType}Description`] || '',
                            Type: item[`${nodeType}Type`] || '',
                            icon: null,
                            NodeType: item[`${nodeType}NodeType`] || '',
                            HasChildren: item[`${nodeType}HasChildren`] || 0,
                            IsNZ: item[`${nodeType}IsNZ`] || false,
                            Secured: item[`${nodeType}Secured`] || false,
                            NodeState: item[`${nodeType}NodeState`] || "Ready",
                            stepNo: item[`${nodeType}StepNo`] || nodeTypes.indexOf(nodeType) + 1,
                            parentEntID: parentId || null,
                            treetype: nodeType,
                            checkable: showCheckbox,
                            isLeaf: (item[`${nodeType}HasChildren`] || 0) >= 1 ? false : true,
                            MountedDeviceEntID: item[`${nodeType}MountedDeviceEntID`] || "",
                            MountedDeviceViewEntID: item[`${nodeType}MountedDeviceViewEntID`] || "",
                            MountedDeviceName: item[`${nodeType}MountedDeviceName`] || "",
                            MountedDeviceNodeType: item[`${nodeType}MountedDeviceNodeType`] || "",
                            MountedDeviceDescription: item[`${nodeType}MountedDeviceDescription`] || "",
                            MountedDeviceHasPowerPort: item[`${nodeType}MountedDeviceHasPowerPort`] || 0,
                            MountedDeviceHasNetworkPort: item[`${nodeType}MountedDeviceHasNetworkPort`] || 0,
                            MountedDeviceIntelDCMState: item[`${nodeType}MountedDeviceIntelDCMState`] || "",
                            MountedDeviceEntityName: item[`${nodeType}MountedDeviceEntityName`] || "",
                            MountedDeviceWidth: item[`${nodeType}MountedDeviceWidth`] || "",
                            MountedDeviceHeight: item[`${nodeType}MountedDeviceHeight`] || "",
                            MountedDeviceLength: item[`${nodeType}MountedDeviceLength`] || "",
                            MountedDeviceSlotsNeeded: item[`${nodeType}MountedDeviceSlotsNeeded`] || "",
                            MountedDeviceSecured: item[`${nodeType}MountedDeviceSecured`] || "",
                            EQID: item[`${nodeType}EQID`] || "",
                            ParentEQID: item[`${nodeType}ParentEQID`] || "",
                            HasNetworkPorts: item[`${nodeType}HasNetworkPorts`] || 0,
                            HasPowerPorts: item[`${nodeType}HasPowerPorts`] || 0,
                            IntelDCMState: item[`${nodeType}IntelDCMState`] || "",
                            Gender: item[`${nodeType}Gender`] || null,
                            IsPortFiber: item[`${nodeType}IsPortFiber`] || null,
                            PortStatus: item[`${nodeType}PortStatus`] || "Normal",
                            SlotsNeeded: item[`${nodeType}SlotsNeeded`] || 0,
                            ShapeID: item[`${nodeType}ShapeID`] || null,
                            ViewShortName: item[`${nodeType}ShortName`] || null,
                            ParentName: item[`${nodeType}ParentName`] || null,
                            MaxInstances: item[`${nodeType}MaxInstances`] || 0,
                            IsPatchPort: item[`${nodeType}IsPatchPort`] || false,
                            DisplayOrder: item[`${nodeType}DisplayOrder`] || 0,
                            MountPosition: item[`${nodeType}MountPosition`] || -1,
                            DetailsJson: item[`${nodeType}DetailsJson`] || "",
                            HasLayout: item[`${nodeType}HasLayout`] ?? undefined,
                            EQType: item[`${nodeType}EQType`] || "",
                            Height: item[`${nodeType}Height`] || "0",
                            Width: item[`${nodeType}Width`] || "0",
                            Length: item[`${nodeType}Length`] || "0",
                            DeviceEntId: item[`${nodeType}DeviceEntId`] || "",
                            DeviceViewEntId: item[`${nodeType}DeviceViewEntId`] || "",
                            WOID: item[`${nodeType}WOID`] || "",
                            TeamIDList: item[`${nodeType}TeamIDList`],
                            TagIDList: item[`${nodeType}TagIDList`],
                            TenantIDList: item[`${nodeType}TenantIDList`],
                            VendorIDList: item[`${nodeType}VendorIDList`],
                            MountedDeviceTenantIDList: item[`${nodeType}MountedDeviceTenantIDList`] || undefined,
                            MountedDeviceTeamIDList: item[`${nodeType}MountedDeviceTeamIDList`] || undefined,
                            MountedDeviceTagIDList: item[`${nodeType}MountedDeviceTagIDList`] || undefined,
                            MountedDeviceVendorIDList: item[`${nodeType}MountedDeviceVendorIDList`] || undefined,
                            ContainedByDeviceID: item[`${nodeType}ContainedByDeviceID`],
                            WOExists: item[`${nodeType}WOExists`] || false,
                            HasMountedDevice: item[`${nodeType}HasMountedDevice`] || 0,
                            HasMountedNetworkDevice: item[`${nodeType}HasMountedNetworkDevice`] || 0,
                            HasMountedPowerDevice: item[`${nodeType}HasMountedPowerDevice`] || 0,
                            HasMountedServer: item[`${nodeType}HasMountedServer`] || 0,
                            DateFormat: item[`${nodeType}DateFormat`] || "",
                            NodePath: item[`${nodeType}NodePath`] || "",
                            ReplacementTemplateWOID: item[`${nodeType}ReplacementWOID`] || undefined,
                            children: [],
                            ParentNodeType: nodeType.toLowerCase() === "device" ? deviceParentType : "",
                            ...nodeData
                        };
                    }
                }
            };
        };
        // Establish parent-child relationships
        for (let index = 0; index < data.length; index++) {
            const item = data[index];

            const nodeTypes = ['Site', 'Tenant', 'Room', 'Floor', 'Location', 'Manufacturer', 'Eqtype', 'Product', 'View', 'Device', 'DeviceView', 'DeviceSlot', 'DeviceNetworkPort', 'DevicePowerPort', 'Entity', 'PropertyGroup', 'Property', 'Root', 'Group', 'SubGroup', 'MountedDevice'];
            for (let index = 0; index < nodeTypes.length; index++) {
                const nodeType = nodeTypes[index];
                const id = item[`${nodeType}EntID`];
                const parentId = item[`${nodeType}ParentID`] ? item[`${nodeType}ParentID`] : item[`${nodeType}ParentEntID`];

                if (parentId && nodeMap[parentId]) {
                    if (id && nodeMap[id]) {
                        if (!nodeMap[parentId].children!.find(child => child.key === id)) {
                            nodeMap[parentId].children!.push(nodeMap[id]);
                        }
                    }
                }
            };
        };

        let rootData: ITreeNode[] = [];
        // Extract root nodes (nodes with no parent)
        if (currentNodeId) {
            rootData = Object.values(nodeMap).filter(node => node.parentEntID === currentNodeId);
        }
        else {
            rootData = Object.values(nodeMap).filter(node => !node.parentEntID);
        }
        const sortTreeNodes = (nodes: ITreeNode[], parentNode?: ITreeNode) => {
            if (!Array.isArray(nodes) || nodes.length === 0) return;
            const parentType = parentNode?.treetype?.toLowerCase();
            const isRackParent =
                parentNode?.NodeEntityname?.toLowerCase() === "__rack" ||
                parentNode?.NodeType?.toLowerCase() === "rack" ||
                parentNode?.treetype?.toLowerCase() === "rack";
            const isDeviceViewParent = parentType === "deviceview";
            const isViewNodes = nodes.length > 0 && nodes.every(n => n.treetype?.toLowerCase() === "view");
            const isSlotsType = nodes?.length && nodes.every(n => n.treetype?.toLowerCase() === "deviceslot");
            if (isViewNodes) {
                nodes.sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""));
            } else if (isRackParent || isDeviceViewParent || (isSlotsType && !parentNode)) {
                // Group children by NodeType
                const groupedByType: Record<string, ITreeNode[]> = {};

                nodes.forEach(node => {
                    const typeKey = node.Name ? node.Name.split('#')[0] : node.NodeType?.toLowerCase() ?? "unknown";
                    if (!groupedByType[typeKey]) groupedByType[typeKey] = [];
                    groupedByType[typeKey].push(node);
                });
                // Sort each NodeType group by DisplayOrder 
                Object.keys(groupedByType).forEach(typeKey => {
                    groupedByType[typeKey].sort((a, b) => {
                        const getOrder = (n: ITreeNode) => {
                            if (n.DisplayOrder != null && n.DisplayOrder !== 0) return n.DisplayOrder;
                            if (n.MountPosition != null && n.MountPosition !== -1) return n.MountPosition;
                            const match = n.Name?.match(/#(\d+)/);
                            if (match) return Number(match[1]);
                            return n.DisplayOrder ?? 0;
                        };
                        const orderA = getOrder(a);
                        const orderB = getOrder(b);
                        return isRackParent || isSlotsType ? orderB - orderA : orderA - orderB;
                    });
                });

                // Merge all groups into a single array, maintaining NodeType grouping order
                const sortedKeys = Object.keys(groupedByType).sort((a, b) => {
                    return isRackParent || isSlotsType ? b.localeCompare(a) : a.localeCompare(b);
                });
                const mergedNodes = sortedKeys.flatMap(key => groupedByType[key]);

                // Replace nodes content with sorted result
                nodes.splice(0, nodes.length, ...mergedNodes);
            } else {
                // Normal ascending sort
                nodes.sort((a, b) => {
                    const orderA = a.DisplayOrder ?? 0;
                    const orderB = b.DisplayOrder ?? 0;
                    return orderA - orderB;
                });
            }

            // Recurse for all children
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    sortTreeNodes(node.children, node);
                }
            });
        };

        if (!disableSort) {
            sortTreeNodes(rootData);
        }
        if (featureId === FEnums.SelectDataCenterSite.toString()) {
            const rootConfig =
                selectedDC === "SitesByTenant"
                    ? GoogleMapTenantRootNode
                    : selectedDC === "AllSites"
                        ? GoogleMapAllSiteRootNode
                        : GoogleMapTreeRootNode;

            const rootId = rootConfig.RootEntID;

            // If root not in map → create it
            if (!nodeMap[rootId]) {
                nodeMap[rootId] = {
                    key: rootId,
                    NodeEntID: rootId,
                    title: rootConfig.RootName,
                    Name: rootConfig.RootName,
                    NodeEntityname: rootConfig.RootNodeType,
                    NodeType: rootConfig.RootNodeType,
                    parentEntID: null,
                    children: [],
                    HasChildren: rootConfig.RootHasChildren,
                    isLeaf: false,
                    checkable: false,
                    treetype: "Root"
                } as unknown as ITreeNode;
            }

            // Attach all top-level nodes under root
            const topLevelNodes = Object.values(nodeMap).filter(
                node => node.parentEntID === rootId
            );

            nodeMap[rootId].children = topLevelNodes;
            nodeMap[rootId].isLeaf = topLevelNodes.length === 0;

            // (optional but consistent)
            nodeMap[rootId].HasChildren = topLevelNodes.length;
            // Force root as only root node
            rootData = [nodeMap[rootId]];
        }
        return rootData;
    } catch (error) {
        console.error(
            "Error in function(FnBuildRcTreeData): ",
            error
        );
        return [];
    }
}

export { FnBuildRcTreeData }
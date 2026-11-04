
import React, { useEffect, useRef, useState } from 'react'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../interceptors/Interceptor';
import { Kebab24x24 } from '@n20a/libicon';
import '../../allcss/menu/NodeMenu.css';
import { EM, NODE, PROPERTY } from '../../interceptors/EndPoints';
import { RightMouseMenuTreeNode } from '../../../constants/Feature';
import { FEnums } from '../../../constants/Feature';
import { KebabMenuRange } from '../../../constants/Feature';
import { fnAllowCopyPaste, FnBinDispose, FnBinMoveToDisposable, FnBinMoveToUnused, FnCharts, FnClearWatermark, FnClearWatermarkForSubNodes, FnDci, FnDeviceImportBin, FnDiscoverable, fnDiscovered, FnFloorDevice, FnHasChildren, FnHasNetworkPort, FnHasPowerPort, FnIncludeForInUseInventory, fnIsInUse, FnMapPort, FnMigrationEnabled, FnMonitorable, fnMonitored, FnNetworkCableImportBin, FnPasteSource, FnPortAvailable, FnPortConnected, FnPortMapNeeded, FnPortNormal, FnPortNormalAllowed, FnPowerCableImportBin, FnRUAvailable, FnRUNormal, FnRUNormalAllowed, FnSlotAvailable, FnSwapMountedDevice, IsAdminNZSessionNode, IsAdminNZTaskNode, IsAdminNZWinSVCNode, IsSelectedAuditSession, IsSelectedAuditSessionApprove, IsSelectedAuditSessionClose, IsSelectedAuditSessionDelete, IsSelectedAuditSessionOpen, IsSelectedAuditSessionReject, IsSelectedAuditSessionSnapshot, IsSelectedAuditSessionUnapprove } from './MenuFunction';
import { IMenuImage } from '../../allinterface/menu/IMenuImage';
import { IFeatureItem, INodeMenu } from '../../allinterface/menu/INodeMenu';
import { MenuImage } from '../menuimage/MenuImage';
import { useCommonVariableContext } from '../../context/hooks/CommonVariableHooks';
import { AppQA } from '../../../constants/Feature';
import { useSessionContext } from '../../context/hooks/SessionHooks';
import OverlayIconStrip from '../overlayiconstrip/OverlayIconStrip';
import { FnCopyToClipboard } from '../../allcommon/basic/FnCopyToClipboard';
import { useMainAppContext } from '../../context/hooks/MainAppHooks';
import { ISelectedNodeInfo, ITreeNode } from '../../allinterface/tree/ITreeControl';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';

const NodeMenu = (nodeMenuProps: INodeMenu) => {
    const [menuData, setMenuData] = useState<IFeatureItem[]>();
    const [selectedItem, setSelectedItem] = useState<IFeatureItem>();
    const [selectedNodeData, setSelectedNodeData] = useState<ISelectedNodeInfo | undefined>(undefined);
    const [showKebabIcon, setShowKebabIcon] = useState<boolean>(false)
    const [isShowMenu, setIsShowMenu] = useState(false);
    const [menuImageProps, setMenuImageProps] = useState<IMenuImage>();
    const [actionMenuData, setActionMenuData] = useState<IFeatureItem[]>([])
    const [kebabMenuData, setKebabMenuData] = useState<IFeatureItem[]>([])
    const [isRecordFoundInWaterMark, setIsRecordFoundInWaterMark] = useState<boolean>(false)

    const CommonVariableContext = useCommonVariableContext()
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext()
    const mainAppContext = useMainAppContext();

    useEffect(() => {
        if (nodeMenuProps.MenuImage) {
            setMenuImageProps(nodeMenuProps.MenuImage)
        } else {
            let kebebImage: IMenuImage = {
                uniqueName: "bi1",
                image: {
                    uniqueName: "Kebabimage",
                    source: <Kebab24x24
                        size={20}
                        fill='none'
                        strokeWidth={1} />,
                    type: "svg",
                    w: "var(--image-size-2)",
                    h: "var(--image-size-2)",
                    tooltip: "click to use commands"
                },
                w: 'var(--image-size-2)',
                h: 'var(--image-size-2)',
                allowAnimations: false
            }
            setMenuImageProps(kebebImage)
        }
    }, [nodeMenuProps.MenuImage, nodeMenuProps.MenuImage?.selected])
    const handleAnimationImage = (active?: boolean) => {
        if (menuImageProps && menuImageProps.allowAnimations) {
            setMenuImageProps({ ...menuImageProps, active: active });
        }
    }
    const getNodeMenuForProperty = () => {
        const handleApiGetKebabMenu = (data: any) => {
            if (data.kebabJson) {
                const nodeData = FnParseJsonSafely(data.kebabJson)
                if (nodeData.KebabMenu) {
                    const data = nodeData.KebabMenu.fitler((item: any) => (item.TotalCount !== 0))
                    setMenuData(data)
                    setShowKebabIcon(true)
                } else {
                    setShowKebabIcon(false)
                }
            } else {
                setShowKebabIcon(false)
            }
        }
        const payload = {
            selectedNodeEntity: nodeMenuProps.selectedNode?.NodeEntityname,
            selectedNodeType: nodeMenuProps.selectedNode?.NodeType
        }

        axiosInterceptor({
            url: PROPERTY.GetKebabMenu,
            data: payload,
            setFetchData: handleApiGetKebabMenu
        }, statusBarContext)
    }
    const handleClick = async (event: React.MouseEvent<HTMLDivElement> | null) => {
        if (event) {
            handleAnimationImage(true)
            setIsShowMenu(true);
        }
        let kebabMenuList: IFeatureItem[] = [];
        if (nodeMenuProps.container === "entity_mfg_eqtype_tree") {
            const menu = [{ Label: `Create New Device Entity`, Tooltip: "Create New Device Entity" }];
            kebabMenuList = menu

        } else if (nodeMenuProps.container === "entity_mfg_eqtype_tree_cable") {
            const menu = [{ Label: `Create New Cable Entity`, Tooltip: "Create New Cable Entity" }];
            kebabMenuList = menu
        } else if (nodeMenuProps.container === "cabling_componet_cable") {
            const menu = [{ Label: "Remove Cable", Tooltip: "Remove cable" }];
            kebabMenuList = menu
        } else if (nodeMenuProps.container === "edit_report_layout") {

            const type = nodeMenuProps.selectedNode?.type?.toLowerCase();
            const isCustom = nodeMenuProps.selectedNode?.custom;
            if (type && type === "layout") {
                kebabMenuList = [{ Label: "Save As", Tooltip: "Save As json file" }];
            } else if (type && (type === "header" || type === "footer" || type === "page")) {
                kebabMenuList = [{ Label: "Add Group", Tooltip: "Add Group" }];
            } else if (type && (type === "group")) {
                kebabMenuList = [
                    { Label: "Add Text", Tooltip: "Add Text" },
                    { Label: "Add Image", Tooltip: "Add Image" },
                    { Label: "Add Chart", Tooltip: "Add Chart" },
                    { Label: "Add Table", Tooltip: "Add Table" },
                    { Label: "Add HSpace", Tooltip: "Add Horizontal Space" },
                    { Label: "Add VSpace", Tooltip: "Add Vertical Space" },
                    { Label: "Delete Group", Tooltip: "Delete Group" }
                ];

            }
            else if (type && (type === "text" || type === "image" || type === "table" || type === "chart" || type === "hspace" || type === "vspace")) {
                kebabMenuList = [
                    { Label: "Delete", Tooltip: `click to delete ${type}` }
                ];
                if (type === "table") {
                    kebabMenuList.push({ Label: "Add Column", Tooltip: `click to custom column` })
                }
            }
            else if (isCustom !== undefined) {
                kebabMenuList = [
                    { Label: "Delete", Tooltip: `click to delete Column` }
                ];
            }

        } else if (nodeMenuProps.container === "edit_floor_layout") {

            const type = nodeMenuProps.selectedNode?.type?.toLowerCase();

            if (type && type === "layout") {
                kebabMenuList = [{ Label: "Save As", Tooltip: "Save As json file" }];
            } else if (type && (type === "location")) {
                kebabMenuList = [
                    { Label: "Add Rect", Tooltip: "Add Rectangle" },
                    { Label: "Add Circle", Tooltip: "Add Circle" },
                    { Label: "Add Text", Tooltip: "Add Text" },
                    { Label: "Add Image", Tooltip: "Add Image" },
                    { Label: "Add Chart", Tooltip: "Add Chart" },
                    { Label: "Add HSpace", Tooltip: "Add Horizontal Space" },
                    { Label: "Add VSpace", Tooltip: "Add Vertical Space" },
                    { Label: "Delete Location", Tooltip: "Delete Location" }
                ];

            }
            else if (type && (type === "text" || type === "image" || type === "device" || type === "rect" || type === "circle" || type === "chart" || type === "hspace" || type === "vspace")) {
                kebabMenuList = [
                    { Label: "Delete", Tooltip: `click to delete ${type}` }
                ];
                if (type === "device") {
                    kebabMenuList.push({ Label: "Select in DC explorer", Tooltip: `click to Select in DC explorer` })
                }
            }


        } else if (nodeMenuProps.container === "helpTip") {

            const menu: IFeatureItem[] = []
            nodeMenuProps.featureData.forEach((item, index: number) => {
                if (selectedItem && selectedItem.Label) {
                    menu.push({ Label: item.Label, selected: selectedItem && selectedItem.Label === item.Label ? true : false, mdString: item.mdString })
                } else {
                    menu.push({ Label: item.Label, selected: index === 0 ? true : false, mdString: item.mdString })
                }
            })

            kebabMenuList = menu
        } else if (nodeMenuProps.container === "dashboard_chart") {
            const menu = [{ Label: "Show Data", Tooltip: "Show Chart Data" }];
            kebabMenuList = menu
        }
        else if (nodeMenuProps.container === "cabling_componet_deviceA" || nodeMenuProps.container === "cabling_componet_cableB" || nodeMenuProps.container === "cabling_componet_deviceC" || nodeMenuProps.container === "mapping_FrontA" || nodeMenuProps.container === "mapping_FrontB") {

            let menu: IFeatureItem[] = [];
            if (nodeMenuProps.featureData) {
                if (selectedNodeData && selectedNodeData.node) {
                    menu = getKebabMenuForCablingGridRow(null);

                }

                if (menu?.length > 0) {
                    //remove duplicate recodes
                    const unique: string[] = [];
                    const uniqueMenu = menu.filter((element: IFeatureItem) => {
                        const isDuplicate = unique.includes(element.Label);

                        if (!isDuplicate) {
                            unique.push(element.Label);
                            return true;
                        }
                        return false;
                    });
                    kebabMenuList = uniqueMenu
                }
                else {
                    kebabMenuList = []
                }
            }
        }
        else if (nodeMenuProps.container === "search_keyword") {
            const selectedMenu = selectedItem && selectedItem.Label ? selectedItem.Label : "AND"
            const menu = [{ Label: "AND", Tooltip: "AND", isCheckbox: true, checked: selectedMenu === "AND" ? true : false }, { Label: "OR", Tooltip: "OR", isCheckbox: true, checked: selectedMenu === "OR" ? true : false }];
            kebabMenuList = menu
        }
        else if (nodeMenuProps.container === "data_grid" && nodeMenuProps.selectedRow) {
            kebabMenuList = []
        }
        else if (nodeMenuProps.container === "background_tasks" && nodeMenuProps.featureId === AppQA.Task && nodeMenuProps.featureData && nodeMenuProps.selectedRow) {
            const featureData = nodeMenuProps.featureData?.filter((item) => {
                return item.MenuID === nodeMenuProps.featureId && (item?.NodeType?.includes(nodeMenuProps?.selectedRow?.NodeType) || item.NodeType === '')
            })

            kebabMenuList = featureData

        }
        else if (nodeMenuProps.container === "open_session" && nodeMenuProps.featureId === AppQA.Task && nodeMenuProps.featureData && nodeMenuProps.selectedRow) {
            const featureData = nodeMenuProps.featureData?.filter((item) => {
                return item.MenuID === nodeMenuProps.featureId && (item?.NodeType?.includes(nodeMenuProps?.selectedRow?.NodeType) || item.NodeType === '')
            })
            kebabMenuList = featureData
        }
        else if ((nodeMenuProps.container === "audit_inventory" || nodeMenuProps.container === "audit_reconciliation") && nodeMenuProps.featureData && nodeMenuProps.selectedRow) {
            const featureData = nodeMenuProps.featureData?.filter((item) => {
                return item.MenuID === nodeMenuProps.featureId && (item._Feature as number) > KebabMenuRange.MIN && (item?.NodeType?.includes(nodeMenuProps?.selectedRow?.NodeType) || item.NodeType === '')
            })
            if (nodeMenuProps.selectedRow?.AuditedDeviceState) {
                featureData.map((item) => item.selected = item.Label?.toLowerCase() === nodeMenuProps.selectedRow?.AuditedDeviceState.toLowerCase())

            }
            kebabMenuList = featureData
        }
        else if (nodeMenuProps.container === "background_window_service" && nodeMenuProps.featureId === AppQA.Task && nodeMenuProps.featureData && nodeMenuProps.selectedRow) {
            const featureData = nodeMenuProps.featureData?.filter((item) => {
                return item.MenuID === nodeMenuProps.featureId && (item?.NodeType?.includes(nodeMenuProps?.selectedRow?.NodeType) || item.NodeType === '')
            })
            kebabMenuList = featureData
        }
        else if (nodeMenuProps.container === "sql_job" && nodeMenuProps.featureId === AppQA.Task && nodeMenuProps.featureData && nodeMenuProps.selectedRow) {
            const featureData = nodeMenuProps.featureData?.filter((item) => {
                return item.MenuID === nodeMenuProps.featureId && (item?.NodeType?.includes(nodeMenuProps?.selectedRow?.NodeType) || item.NodeType === '')
            })
            kebabMenuList = featureData
        }
        else if (nodeMenuProps.container === "datacenter_hierarchy_treeview" || nodeMenuProps.container === "inventory_hierarchy_treeview" || nodeMenuProps.container === "dci_left_tree") {
            if (nodeMenuProps.featureData && selectedNodeData) {
                if (selectedNodeData && selectedNodeData.node) {
                    const menuData = await getExplorerMenuData(nodeMenuProps.featureId);
                    if (menuData && menuData?.length > 0) {
                        //remove duplicate recodes
                        const unique: string[] = [];
                        const uniqueMenu = menuData.filter((element) => {
                            const isDuplicate = unique.includes(element.Label);
                            if (!isDuplicate) {
                                unique.push(element.Label);
                                return true;
                            }
                            return false;
                        });
                        kebabMenuList = uniqueMenu
                    }
                    else {
                        kebabMenuList = []

                    }
                }
            }
        }
        else if (nodeMenuProps.container === "explorer_tree") {
            let menu: IFeatureItem[] = [];
            if (nodeMenuProps.featureData) {
                if (selectedNodeData && selectedNodeData.node) {
                    menu = await getExplorerMenuData() ?? [];
                }
                if (menu && menu?.length > 0) {
                    const unique: string[] = [];
                    const uniqueMenu = menu.filter((element) => {
                        const isDuplicate = unique.includes(element.Label);

                        if (!isDuplicate) {
                            unique.push(element.Label);
                            return true;
                        }
                        return false;
                    });
                    kebabMenuList = uniqueMenu
                }
                else {
                    kebabMenuList = []
                }
            }

        } else if (nodeMenuProps.container === "fqa_property_tab") {

            getNodeMenuForProperty()
            return true;
        } else if (nodeMenuProps.container === "reminder_grid") {
            const reminderStatus = nodeMenuProps?.selectedRow?.ReminderStatus?.toLowerCase();
            let featureData = nodeMenuProps.featureData?.filter((item) => {
                return item.MenuID === nodeMenuProps.featureId && (item?.NodeType?.includes(nodeMenuProps?.selectedRow?.NodeType) || item.NodeType === '')
            }) ?? []

            if (featureData.length && reminderStatus) {
                featureData = featureData.filter((item) => {
                    const label = item.Label?.toLowerCase();
                    if (reminderStatus === "open" && label === "reopen") {
                        return false;
                    }
                    if ((reminderStatus === "closed" || reminderStatus === "close") && label === "close") {
                        return false;
                    }
                    return true;
                })
            }
            kebabMenuList = featureData
        }

        setMenuData(kebabMenuList);
        if (event) {
            const submenudiv = document.getElementById('nz-sub-menu-node')
            if (submenudiv) {
                submenudiv.focus();
            }

            if (nodeMenuProps.handleMouse && nodeMenuProps.MenuImage) {

                nodeMenuProps.handleMouse(nodeMenuProps.MenuImage)
            }
        }


    }
    const getKebabMenuForCablingGridRow = (featureId: string | null) => {
        const menu: IFeatureItem[] = [];
        if (selectedNodeData) {
            nodeMenuProps.featureData.forEach((item) => {
                if ((item.MenuID === featureId || featureId === null) && item._Feature && (item._Feature as number) > KebabMenuRange.MIN && item.Label !== "") {
                    if (item.NodeType && item.NodeType?.toLowerCase().includes('fnportnormalallowed')) {
                        if (FnPortNormalAllowed(selectedNodeData, nodeMenuProps)) {
                            menu.push(item)
                        }
                    } else if (item.NodeType && item.NodeType?.toLowerCase().includes('fnportnormal')) {
                        if (FnPortNormal(selectedNodeData, nodeMenuProps)) {
                            menu.push(item)
                        }
                    } else if (item.NodeType && item.NodeType?.toLowerCase().includes("fnportconnected")) {
                        if (FnPortConnected(selectedNodeData, nodeMenuProps)) {
                            menu.push(item)
                        }
                    }
                }
                return;
            });
        }
        return menu;
    }
    function handleSelectNode(value: any, _actionCode?: string | undefined, payload?: any): void {
        handleAnimationImage(false);
        setIsShowMenu(false);
        setSelectedItem(payload as IFeatureItem)
        const selectedMenu = {
            payload: payload,
            field: nodeMenuProps.field,
            container: nodeMenuProps.container,
            rowIndex: nodeMenuProps.rowIndex,
            selectedRow: nodeMenuProps.selectedRow,
        }
        if (payload.Label === "Copy" && selectedNodeData) {
            FnCopyToClipboard(selectedNodeData.node.TableLabel ? `${selectedNodeData.node.TableLabel}` : (selectedNodeData.node.Name ? selectedNodeData.node.Name : ""));
            return;
        }
        CommonVariableContext.setSelectedNodeMenu(selectedMenu)
        nodeMenuProps.handleSelect(value)

    }
    const getCheckFunctionAndNodeTypeData = (featureItem: IFeatureItem, selectedNodeData: ISelectedNodeInfo, isRecordFoundInWaterMark: boolean) => {
        const type = (featureItem.NodeType as string).split(';')
        const NodeTypeString = (featureItem.NodeType as string)
        let isFn = false
        let FnChildrenDisplayOrderToggleStatus = selectedNodeData && selectedNodeData?.node && selectedNodeData.node.DisplayOrder
        if (type.length) {
            const NodeTypes = type
                .map(item => item.toLowerCase().trim())
                .filter(item => !item.startsWith("fn"));

            const fnNames = type
                .map(item => item.toLowerCase().trim())
                .filter(item => item.startsWith("fn") || item.startsWith("is"));

            if (fnNames.includes("fnhaschildren")) {
                if (FnHasChildren(selectedNodeData?.node?.HasChildren ?? 0)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnisinuse")) {
                if (fnIsInUse(selectedNodeData, NodeTypeString?.toLowerCase())) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnclearwatermarkforsubnodes")) {
                if (FnClearWatermarkForSubNodes(selectedNodeData.node, isRecordFoundInWaterMark)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnclearwatermark")) {
                if (FnClearWatermark(selectedNodeData.node, isRecordFoundInWaterMark)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnallowcopypaste")) {
                if (fnNames.includes("fnpastesource")) {
                    if (FnPasteSource(selectedNodeData, sessionContext.SessionList, mainAppContext.siteProperties?.Managed ?? false)) {
                        isFn = true;
                    }
                } else if (fnAllowCopyPaste(mainAppContext.siteProperties?.Managed ?? false, selectedNodeData, NodeTypeString)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fndisplayorder")) {
                if (FnDisplayOrder(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fndci")) {
                if (FnDci(selectedNodeData?.node, mainAppContext.dciRecords)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnhasnetworkport")) {
                if (FnHasNetworkPort(selectedNodeData?.node?.HasNetworkPorts ?? 0)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnhaspowerport")) {
                if (FnHasPowerPort(selectedNodeData?.node?.HasPowerPorts ?? 0)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnchildrendisplayordertoggle")) {
                if (selectedNodeData?.node?.children && selectedNodeData?.node?.children.length > 1) {
                    if (selectedNodeData?.node.NodeType?.toLowerCase() === "device" || selectedNodeData?.node.NodeType?.toLowerCase() === "rack" || selectedNodeData?.node.treetype?.toLowerCase() === "deviceview") {
                        if (selectedNodeData?.node.NodeType?.toLowerCase() === "rack" && (nodeMenuProps.featureId !== FEnums.ConfigureDevice && nodeMenuProps.featureId !== FEnums.AssetConfiguration)) {
                            isFn = true
                        }
                        else {
                            isFn = false;
                        }
                    }
                    else {
                        if (!FnChildrenDisplayOrderToggleStatus && featureItem.Label === RightMouseMenuTreeNode.OrderSubnodesAsc) {
                            isFn = true;
                        } else if (FnChildrenDisplayOrderToggleStatus && featureItem.Label === RightMouseMenuTreeNode.DonotOrderSubnodes) {
                            isFn = true;
                        }
                    }
                    FnChildrenDisplayOrderToggleStatus = FnChildrenDisplayOrderToggleStatus === 1 ? 0 : 1
                }
            }
            if (fnNames.includes("fnportconnected")) {
                if (FnPortConnected(selectedNodeData, nodeMenuProps)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnportmapneeded")) {
                if (FnPortMapNeeded(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnpastesource")) {
                if (FnPasteSource(selectedNodeData, sessionContext.SessionList, mainAppContext.siteProperties?.Managed ?? false)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnmonitorable")) {
                if (FnMonitorable(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fndiscoverable")) {
                if (FnDiscoverable(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fndiscovered")) {
                if (fnDiscovered(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnmonitored")) {
                if (fnMonitored(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fndeviceimportbin")) {
                if (FnDeviceImportBin(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnnetworkcableimportbin")) {
                if (FnNetworkCableImportBin(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes("fnpowercableimportbin")) {
                if (FnPowerCableImportBin(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnslotavailable')) {
                if (FnSlotAvailable(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnbinmovetounused')) {
                if (FnBinMoveToUnused(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnbinmovetodisposable')) {
                if (FnBinMoveToDisposable(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames && (fnNames.includes('fnbindispose')
                || fnNames.includes('fnincludeforinuseinventory'))) {
                if (FnBinDispose(selectedNodeData)) {
                    isFn = true;
                } else if (fnNames.includes('fnincludeforinuseinventory')) {
                    if (FnIncludeForInUseInventory(selectedNodeData)) {
                        isFn = true;
                    }
                }
            }
            if (fnNames.includes('fnswapmounteddevice')) {
                if (FnSwapMountedDevice(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnruavailable')) {
                if (FnRUAvailable(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnportavailable')) {
                if (FnPortAvailable(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnfloordevice')) {
                if (FnFloorDevice(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsessionapprove')) {
                if (IsSelectedAuditSessionApprove(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsessionunapprove')) {
                if (IsSelectedAuditSessionUnapprove(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsessionreject')) {
                if (IsSelectedAuditSessionReject(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsessionopen')) {
                if (IsSelectedAuditSessionOpen(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsessionclose')) {
                if (IsSelectedAuditSessionClose(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsessionsnapshot')) {
                if (IsSelectedAuditSessionSnapshot(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsessiondelete')) {
                if (IsSelectedAuditSessionDelete(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isselectedauditsession')) {
                if (IsSelectedAuditSession(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isadminnztasknode')) {
                if (IsAdminNZTaskNode(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isadminnzsessionnode')) {
                if (IsAdminNZSessionNode(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('isadminnzwinsvcnode')) {
                if (IsAdminNZWinSVCNode(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnmapport')) {
                if (FnMapPort(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnmigrationenabled')) {
                if (FnMigrationEnabled(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fncharts')) {
                if (FnCharts(selectedNodeData, NodeTypeString)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnrunormalallowed')) {
                if (FnRUNormalAllowed(selectedNodeData)) {
                    isFn = true;
                }
            }

            if (fnNames.includes('fnrunormal')) {
                if (FnRUNormal(selectedNodeData)) {
                    isFn = true;
                }
            }
            if (fnNames.includes('mounteddevice') && selectedNodeData?.node?.MountedDeviceID) {
                if (selectedNodeData?.node?.MountedDeviceID && selectedNodeData?.node?.treetype?.toLowerCase() === "deviceview") {
                    isFn = true;
                }
            }
            if (fnNames.includes('fnincludeforinuseinventory')) {
                if (FnIncludeForInUseInventory(selectedNodeData)) {
                    isFn = true;
                }
            }
            //check Nodetypes
            if (selectedNodeData?.node?.NodeType) {
                NodeTypes.forEach((element) => {
                    if ((nodeMenuProps.featureId === FEnums.InventoryManagement.toString() || nodeMenuProps.featureId === FEnums.InventoryConfiguration.toString()) &&
                        (
                            featureItem.Label?.toLowerCase() === RightMouseMenuTreeNode.Cut.toLowerCase()
                        ) &&
                        selectedNodeData?.node?.PGClassName?.toLowerCase()?.includes("cable")
                    ) {
                        return;
                    }
                    if (element?.toLowerCase() === selectedNodeData?.node?.NodeType?.toLowerCase()) {
                        isFn = true;
                    }
                })
            }
        }
        return isFn
    }
    const getRecordForWaterMarks = (selectedNodeData: ITreeNode): Promise<Record<string, unknown>[]> => {
        return new Promise((resolve) => {
            axiosInterceptor(
                {
                    url: NODE.GetKebabMenuData,
                    data: {
                        entID: selectedNodeData.NodeEntID,
                        entityName: selectedNodeData.NodeEntityname,
                        kebabMenuTableName: "PG.Watermark",
                    },
                    allowShowLoader: true,
                    setFetchData: async (resp: unknown, status?: string) => {
                        if (status === "200" && resp && typeof resp === "object" && 'propertyJson' in resp) {
                            try {
                                const parsed = typeof (resp as { propertyJson?: unknown }).propertyJson === "string"
                                    ? FnParseJsonSafely((resp as { propertyJson: string }).propertyJson)
                                    : (resp as { propertyJson?: unknown }).propertyJson;

                                const watermarkRecords =
                                    parsed &&
                                        typeof parsed === "object" &&
                                        Array.isArray((parsed as Record<string, unknown>)["PG.Watermark"])
                                        ? ((parsed as Record<string, unknown>)["PG.Watermark"] as Record<string, unknown>[])
                                        : [];

                                resolve(watermarkRecords);
                            } catch (error) {
                                console.error("Error parsing watermark propertyJson:", error);
                                resolve([]);
                            }
                        } else {
                            resolve([]);
                        }
                    }
                },
                statusBarContext
            );
        });
    };
    const watermarkRequestIdRef = useRef(0);
    const lastWatermarkNodeIdRef = useRef<string | null>(null);

    useEffect(() => {
        const node = selectedNodeData?.node;
        const nodeEntId = String(node?.NodeEntID ?? '');
        const isEligible =
            !!node &&
            (nodeMenuProps.featureId === FEnums.MoveAddChange ||
                nodeMenuProps.featureId === FEnums.ConfigureDevice) &&
            String(node.NodeEntityname ?? '').toLowerCase().includes('rack');

        if (!isEligible) {
            lastWatermarkNodeIdRef.current = null;
            setIsRecordFoundInWaterMark(false);
            return;
        }

        // Same rack node already fetched — skip duplicate API call.
        if (lastWatermarkNodeIdRef.current === nodeEntId) {
            return;
        }
        lastWatermarkNodeIdRef.current = nodeEntId;

        const requestId = ++watermarkRequestIdRef.current;
        let cancelled = false;

        const fnInit = async () => {
            const data = await getRecordForWaterMarks(node);
            if (cancelled || requestId !== watermarkRequestIdRef.current) {
                return;
            }
            setIsRecordFoundInWaterMark(data.length > 0);
        };

        void fnInit();

        return () => {
            cancelled = true;
        };
    }, [
        selectedNodeData?.node?.NodeEntID,
        selectedNodeData?.node?.NodeEntityname,
        nodeMenuProps.featureId,
    ]);
    const getExplorerMenuData = async (featureId: string | null = null) => {
        if (selectedNodeData) {
            const menu: IFeatureItem[] = [];


            nodeMenuProps.featureData.forEach((item) => {
                if (item.MenuID.toString() === (featureId ? featureId : nodeMenuProps.featureId) && item._Feature && (item._Feature as number) > KebabMenuRange.MIN && item.Label !== "") {
                    if (item.NodeType === "") {
                        menu.push(item)
                    } else {
                        if (getCheckFunctionAndNodeTypeData(item, selectedNodeData, isRecordFoundInWaterMark)) {
                            menu.push(item)
                        }
                    }

                }
            });
            if (menu?.length > 0) {
                setShowKebabIcon(true);
            }
            else {
                setShowKebabIcon(false);
            }
            return menu;
        }
    }
    const getExplorerMenuDataRef = useRef(getExplorerMenuData)

    ///////////////////////////////////////////////////////////////////////////////////////
    // function work flow
    //     FnDisplayOrder()
    //     {
    // 	If ExplorerNode.DisplayOrder === 0
    //         then
    //         {
    //             ExplorerNode.DisplayOrder = !ExplorerNode.DisplayOrder
    //             return true
    //         }
    // else
    // {
    //     ExplorerNode.DisplayOrder = !ExplorerNode.DisplayOrder
    //     return false
    // }
    // }
    ///////////////////////////////////////////////////////////////////////////////////////

    const FnDisplayOrder = (selectednode: any) => {
        let data: any = selectednode
        if (selectednode?.node?.DisplayOrder === 1) {
            data = { node: { ...selectednode.node, DisplayOrder: !selectednode?.node?.DisplayOrder } }
            setSelectedNodeData(data)
            return true
        }
        else {
            data = { node: { ...selectednode.node, DisplayOrder: !selectednode?.node?.DisplayOrder } }
            setSelectedNodeData(data)
            return false

        }
    }

    const getKebabMenuForGridRow = (selectedRow: any) => {
        const menu: IFeatureItem[] = [];
        nodeMenuProps.featureData.forEach((item) => {
            if (item.MenuID === nodeMenuProps.featureId && item._Feature && (item._Feature as number) > KebabMenuRange.MIN && item.Label !== "") {

                if (item.NodeType === "") {
                    menu.push(item)
                } else {
                    if (item.NodeType && item.NodeType?.toLowerCase().includes('isadminnztasknode')) {
                        if (IsAdminNZTaskNode(selectedRow)) {
                            menu.push(item)
                        }
                    }
                    else if (item.NodeType && item.NodeType?.toLowerCase().includes('isadminnzsessionnode')) {
                        if (IsAdminNZSessionNode(selectedRow)) {
                            menu.push(item)
                        }
                    }
                    else if (item.NodeType && item.NodeType?.toLowerCase().includes('isadminnzwinsvcnode')) {
                        if (IsAdminNZWinSVCNode(selectedRow)) {
                            menu.push(item)
                        }
                    }
                    else {
                        if (item.NodeType) {

                            let nodeTypeArray = item.NodeType.split(";");
                            nodeTypeArray = nodeTypeArray.map((el) => {
                                return el.trim();
                            });

                            if (selectedRow?.NodeType) {

                                nodeTypeArray.forEach((element) => {
                                    if (element?.toLowerCase() === selectedRow?.NodeType?.toLowerCase()) {
                                        menu.push(item)
                                    }
                                })
                            }
                        }

                    }
                }

            }
        });
        return menu;
    }
    const getKebabMenuForGridRowRef = useRef(getKebabMenuForGridRow)
    useEffect(() => {
        if (nodeMenuProps.selectedNode) {
            setSelectedNodeData({ node: nodeMenuProps.selectedNode } as ISelectedNodeInfo);
            handleClick(null)

        } else {
            setSelectedNodeData(undefined);
        }
    }, [nodeMenuProps.selectedNode])

    useEffect(() => {
        if (nodeMenuProps.selectedRow) {
            handleClick(null)
            const menuItems: IFeatureItem[] = getKebabMenuForGridRowRef.current(nodeMenuProps.selectedRow);
            if (nodeMenuProps.selectedRow && (nodeMenuProps.container === "cabling_componet_deviceA" || nodeMenuProps.container === "cabling_componet_cableB" || nodeMenuProps.container === "cabling_componet_deviceC" || nodeMenuProps.container === "mapping_FrontA" || nodeMenuProps.container === "mapping_FrontB")) {
                setShowKebabIcon(true);
                setSelectedNodeData({ node: nodeMenuProps.selectedRow } as ISelectedNodeInfo)

            } else {
                setShowKebabIcon(false);
            }
            if (menuItems?.length > 0) {
                setShowKebabIcon(true);
            } else {
                setShowKebabIcon(true);
            }
        }
        else {
            setShowKebabIcon(false);
        }
    }, [nodeMenuProps?.selectedRow?.NodeType, getKebabMenuForGridRowRef])

    useEffect(() => {
        const init = async () => {
            if (nodeMenuProps.container === "explorer_tree") {

                if (nodeMenuProps.featureData) {
                    if (selectedNodeData && selectedNodeData.node) {
                        let menuData = await getExplorerMenuData();
                        if (menuData && menuData?.length > 0) {

                            setShowKebabIcon(true);
                        }
                        else {
                            setShowKebabIcon(false);
                        }
                        handleClick(null)

                    }
                }
            } else if (nodeMenuProps.container === "entity_mfg_eqtype_tree" || nodeMenuProps.container === "entity_mfg_eq_tree_cable") {
                if (selectedNodeData && selectedNodeData.node && (selectedNodeData.node.treetype?.toLowerCase() === "product" || selectedNodeData.node.NodeType?.toLowerCase() === "devicetype" || selectedNodeData.node.NodeType?.toLowerCase() === "cabletype")) {
                    setShowKebabIcon(true);
                }
                else {
                    setShowKebabIcon(false);
                }
                handleClick(null)
            } else if (nodeMenuProps.container === "dashboard_chart") {
                setShowKebabIcon(true);
                handleClick(null)
            } else if (nodeMenuProps.container === "datacenter_hierarchy_treeview"
                || nodeMenuProps.container === "inventory_hierarchy_treeview"
                || nodeMenuProps.container === "dci_left_tree") {

                if (nodeMenuProps.featureData && nodeMenuProps.selectedNode) {
                    if (selectedNodeData && selectedNodeData.node) {
                        const menuData = await getExplorerMenuDataRef.current(nodeMenuProps.featureId);
                        if (menuData && menuData?.length > 0) {
                            setShowKebabIcon(true);
                        }
                        else {
                            setShowKebabIcon(false);
                        }
                    }
                    handleClick(null)
                }

            }
            else if (nodeMenuProps.container === "fqa_property_tab") {

                if (selectedNodeData) {
                    setSelectedItem(undefined)
                    getNodeMenuForProperty()
                    handleClick(null)
                }
                else {
                    setShowKebabIcon(false);
                }
            } else if (nodeMenuProps.container === 'helpTip') {

                if (nodeMenuProps.featureData.length > 0) {
                    setShowKebabIcon(true);
                    handleClick(null)
                }
            }
            else if (nodeMenuProps.container === "edit_report_layout") {

                const type = nodeMenuProps.selectedNode?.type?.toLowerCase();
                const isCustom = nodeMenuProps.selectedNode?.custom;
                if (type && (type === "layout" || type === "header" || type === "footer"
                    || type === "page" || type === "group" || type === "text" || type === "image"
                    || type === "table" || type === "chart" || type === "hspace"
                    || type === "vspace")) {

                    setShowKebabIcon(true);
                    handleClick(null)
                }
                else if (isCustom !== undefined) {
                    setShowKebabIcon(true);
                    handleClick(null)
                }
            }
            else if (nodeMenuProps.container === "edit_floor_layout") {

                const type = nodeMenuProps.selectedNode?.type?.toLowerCase();
                if (type && (type === "layout" || type === "location" || type === "device"
                    || type === "text" || type === "image" || type === "rect" || type === "circle" || type === "chart" || type === "hspace" || type === "vspace"
                )) {

                    setShowKebabIcon(true);
                }
                handleClick(null)
            }
            else {
                setShowKebabIcon(true);
                handleClick(null)
            }
        }
        init();
    }, [selectedNodeData, isRecordFoundInWaterMark])


    useEffect(() => {

        if (menuData?.length && !nodeMenuProps.disabledOverlay) {
            let action = []
            let kebab = []
            let firstSeparatorFound: boolean = false
            for (let index = 0; index < menuData.length; index++) {
                const element = menuData[index];
                const isSeparator = element.NodeType?.toLowerCase().includes("separator");

                if (!firstSeparatorFound) {
                    action.push(element);

                    // Set only when first separator is encountered
                    if (isSeparator) {
                        firstSeparatorFound = true;
                    }
                } else {
                    kebab.push(element);
                }
            }
            let copyJson = { Label: "Copy", _Feature: "0999", NodeType: "", MenuID: "999", Tooltip: "Copy to clipboard" }
            if (action.length) {
                if (nodeMenuProps.allowAddCopyIconInOverlay) {
                    setActionMenuData([copyJson, ...action])
                } else {
                    setActionMenuData([...action])
                }
            } else {
                setActionMenuData([])
            }
            if (kebab.length) {
                setKebabMenuData(kebab)
            }
        }
    }, [menuData])

    return (
        <div key={nodeMenuProps.uniqueName} className='nz-node-menu'>

            {menuData && menuData?.length > 0 && !nodeMenuProps.disabledOverlay && <OverlayIconStrip
                uniqueName={nodeMenuProps.uniqueName + "overlay-icon-strip"}
                OverlayActions={actionMenuData}
                KebabMenuActions={kebabMenuData}
                OverlayActionProps={{
                    "isVertical": false,
                    "w": "100%",
                    "h": "100%",
                    "bgColor": "var(--bg-color-menu)",
                    "border": "none",
                    "menuSize": "sm",
                    "actionImageW": 24,
                    "actionImageH": 24,
                    "imageW": "18px",
                    "spacing": "0px 2px",
                    "isIconVertical": true,
                    "hideLabel": true
                }}
                handleSelect={handleSelectNode}>
                <div className="nz-node-menu-image" >
                    {/* show kebab icon */}
                    {showKebabIcon && nodeMenuProps.showIcon && menuImageProps && <MenuImage
                        {...menuImageProps}
                        handleMouse={(event: any, _actionCode: string) => {
                            if (!isShowMenu) {
                                handleClick(event);
                            }
                        }}
                        handleMouseEnter={handleClick}
                    />}
                </div>
            </OverlayIconStrip>}
            {nodeMenuProps.disabledOverlay && <div className="nz-node-menu-image" >
                {/* show kebab icon */}
                {showKebabIcon && nodeMenuProps.showIcon && menuImageProps && <MenuImage
                    {...menuImageProps}
                    handleMouse={(event: any, _actionCode: string) => {
                        if (!isShowMenu) {
                            handleClick(event);
                        }
                    }}
                    handleMouseEnter={handleClick}
                />}
            </div>}


        </div >
    )
}
export { NodeMenu }
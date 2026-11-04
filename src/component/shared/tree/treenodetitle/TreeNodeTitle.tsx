
import { Fragment } from 'react'
import { Check, Secured24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { FnGetIconForTreeNode } from '../../allcommon/tree/FnGetIconForTreeNode';
import { getSessionVarsForTreeNode } from '../../context/contextandprovider/CommonVariable';
import { getfeaturesData } from '../../context/contextandprovider/MainApp';
import { FnGetTooltipForTreeNode } from '../../allcommon/tree/FnGetTooltipForTreeNode';
import { IActionImageForSubMenu } from '../../allinterface/basic/IActionImageList';
import { IMenuItem } from '../../allinterface/menu/IMainMenu';
import { ITreeNode, ISelectedNodeInfo } from '../../allinterface/tree/ITreeControl';
import { IFeatureTree } from '../../allinterface/tree/ITreeForFlatDataContainer';
import { ISessionVars } from '../../context/allinterface/ICommonVariable';
import { Image } from '../../basic/image/Image';
import { NodeMenu } from '../../menu/nodemenu/NodeMenu';
import { FEnums } from '../../../constants/Feature';

const TreeNodeTitle = (treeNode: ITreeNode, treeDataProps: IFeatureTree, featureId: string, showKebabIcon?: boolean, showCopyIcon?: boolean, selectedNodeExplorer?: ISelectedNodeInfo, handleKebabMenuSelect?: (selectedItem: IActionImageForSubMenu) => void) => {
    const featureData = getfeaturesData() as IMenuItem[] ?? null
    const sessionVars = getSessionVarsForTreeNode() as ISessionVars ?? null;
    const iconToShowForSecure = sessionVars.basicRole?.toLowerCase() === "admin" ? treeNode.Secured ? "Secured" : null : null;
    const clonedNode = { ...treeNode, title: "", icon: null, children: [] };
    const nodeTooltip = sessionVars.diagnosticLevel === "0" ? `${treeNode.Description ?? ""}${treeNode.WOID ? ` (${treeNode.WOID})` : ""}` : FnGetTooltipForTreeNode(treeNode);
    const titleContent = `${treeNode.Name} ${treeNode.Desc250 ? ` (${treeNode.Desc250.trim()})` : ""}` || "";
    const nodeType = treeNode.NodeType?.toLowerCase();
    const isLocation = nodeType === "location";
    const isInv = ([FEnums.InventoryManagement, FEnums.InventoryConfiguration] as string[]).includes(featureId);
    const isFloorLayoutHidden =
        Boolean(treeDataProps?.hideFloorLayout) ?? false
    const isDevice =
        nodeType === "device" ||
        treeNode.treetype?.toLowerCase() === "device";
    const missingLayout = treeNode.HasLayout !== undefined && (treeNode.HasLayout?.toString() === "0" || treeNode.HasLayout?.toString() === "false") && (isLocation || isDevice) ? true : false;

    const renderAuthIcon = () => {
        if (!treeNode.IsAuthorized) {
            return <></>
        }
        return <Image source={
            <Check
                size={FnGetCssVariable('--image-size-1')}
                fill='none'
                strokeWidth={1} />
        }
            uniqueName={`${treeNode.Name}-icheck`} w={'var(--image-size-2)'}
            tooltip='Authorized' type='svg' />
    };

    const renderNodeName = () => {
        const nodeName = treeNode.TableLabel ? (treeNode.Type === "Table" ? `${treeNode.TableLabel} (${treeNode.Name})` : treeNode.TableLabel) : treeNode.Name;

        return (
            <Fragment key={`node-title-content-${treeNode.key}`}>
                {treeDataProps.instanceName === "Import_export_tree" ? nodeName : treeNode.TableLabel || titleContent}
                {treeNode.RecordCount >= 0 ? ` (${treeNode.RecordCount})` : ""}
                {treeNode.HwEntityName ? ` (${treeNode.HwEntityName})` : ""}
            </Fragment>
        );
    };

    const container = treeNode.HwEntityName || treeNode.NodeType?.toLowerCase() === "hwentity" || treeDataProps.instanceName === "model_by_type_treeview" || treeDataProps.instanceName === "model_by_type_treeview_cable" ? `entity_mfg_eqtype_tree${treeDataProps.instanceName === "model_by_type_treeview_cable" ? "_cable" : ""}` : (treeDataProps.instanceName === "datacenter_hierarchy_treeview" || treeDataProps.instanceName === "inventory_hierarchy_treeview" || treeDataProps.instanceName === "dci_left_tree" || treeDataProps.instanceName === "edit_report_layout" || treeDataProps.instanceName === "edit_floor_layout") ? treeDataProps.instanceName : "explorer_tree"
    const renderIcon = () => {

        const dcmState =
            treeNode.MountedDeviceIntelDCMState || treeNode.IntelDCMState;
        // Discovered,Discoverable,Monitored
        let rawStatus =
            treeNode.NodeEntityname === "AuditSession" &&
                treeNode.NodeType === "AuditSessionNode" &&
                treeNode.AuditSessionProgress?.toLowerCase() === "executed"
                ? "Executed"
                : treeNode.AuditSessionStatus?.trim()
                    ? treeNode.AuditSessionStatus
                    : (treeNode.AuditSessionProgress?.toLowerCase() === "approved"
                        ? "Approved"
                        : null);

        // Normalize status safely
        const status =
            rawStatus
                ? rawStatus === "Executed"
                    ? rawStatus :
                    rawStatus === "Closed" ? "Close"
                        : rawStatus === "Approved" ? "Approve"
                            : rawStatus.replace(/ed$/i, "")
                : null;

        const newTreeNode = { ...treeNode };

        // Only resolve icon if status exists

        let statusIconName: string | null = null;

        // Existing status logic
        if (status) {
            statusIconName = `${status}24x24`;
        }
        if (treeNode.WOID) {
            rawStatus = treeNode.WOID;
            statusIconName = `WO24x24`;
        }
        else if (treeNode.WOExists && featureId === FEnums.Workorder) {
            rawStatus = "";
            statusIconName = `WO24x24`;
        }

        // Intel DCM state logic for Discover & Monitor
        if (
            (featureId === FEnums.Discover ||
                featureId === FEnums.Monitor) && nodeType?.toLowerCase() !== "rack"
        ) {
            rawStatus = dcmState ?? null;
            statusIconName = null;
            const normalizedDcmState =
                dcmState?.trim()?.toLowerCase();

            if (normalizedDcmState === "discoverable") {
                statusIconName = "Discoverable24x24";
            } else if (normalizedDcmState?.includes("discovered") && featureId === FEnums.Discover) {
                statusIconName = "Discovered24x24";
            } else if ((normalizedDcmState?.includes("monitored") || normalizedDcmState?.includes("discovered")) && featureId === FEnums.Monitor) {
                rawStatus = normalizedDcmState?.includes("monitored") ? "Monitored" : "Discovered";
                statusIconName = normalizedDcmState?.includes("monitored") ? "Monitored24x24" : "Discovered24x24";
            }
        }

        if (
            treeNode.NodeState &&
            ['Preparing', 'Processing'].includes(treeNode.NodeState)
        ) {
            rawStatus = "Preparing..."
            statusIconName = 'Preparing24x24';
        }

        const StatusIcon =
            statusIconName
                ? FnGetIconForTreeNode(statusIconName)
                : null;

        // Only show when HasLayout is explicitly false/0 (same rule as missingLayout).
        const NoFloorLayoutIcon = !isInv && !isFloorLayoutHidden && missingLayout
            ? FnGetIconForTreeNode("NotOnFloor24x24")
            : null;

        const ProfileIcon = featureId === FEnums.ReplacementProfile && treeNode.ReplacementTemplateWOID && treeNode.ReplacementTemplateWOID.trim() !== ""
            ? FnGetIconForTreeNode("RT24x24")
            : null;

        return (
            <span className="nz-tree-node-icons-wrapper" key={`node-icons-${treeNode.key}`}>
                {(iconToShowForSecure || StatusIcon || ProfileIcon || NoFloorLayoutIcon) && (
                    <span key={`node-icons-secure-status-${treeNode.key}`} className={"nz-tree-node-nz-icon-div" + (iconToShowForSecure ? " nz-treenode-secure-icon" : "")}>
                        {iconToShowForSecure && (
                            <span key={`secure-image-${treeNode.key}`}>
                                <Image
                                    source={<Secured24x24
                                        size={FnGetCssVariable('--image-size-1')}
                                        fill='none'
                                        strokeWidth={1} />}
                                    uniqueName={`${treeNode.key}-icon-secure`}
                                    w={16}
                                    tooltip={iconToShowForSecure.includes("Secure") ? "Secured" : ""}
                                    type='svg'
                                />
                            </span>
                        )}
                        {StatusIcon && (
                            <span key={`status-image-${treeNode.key}`} className="nz-tree-node-status-icon">
                                <Image
                                    source={<StatusIcon
                                        fill='none'
                                        strokeWidth={1}
                                        size={FnGetCssVariable('--image-size-1')} />}
                                    uniqueName={`${treeNode.key}-icon-status`}
                                    w={16}
                                    tooltip={rawStatus ?? undefined}
                                    type='svg'
                                />
                            </span>
                        )}
                        {ProfileIcon && (
                            <span key={`profile-image-${treeNode.key}`} className="nz-tree-node-status-icon nz-tree-node-profile-icon">
                                <Image
                                    source={<ProfileIcon
                                        fill='none'
                                        strokeWidth={1}
                                        size={FnGetCssVariable('--image-size-1')} />}
                                    uniqueName={`${treeNode.key}-icon-profile`}
                                    w={16}
                                    tooltip={treeNode.ReplacementTemplateWOID ? `Replacement Template (${treeNode.ReplacementTemplateWOID.trim()})` : "Replacement Profile"}
                                    type='svg'
                                />
                            </span>
                        )}
                        {NoFloorLayoutIcon && (
                            <span key={`floor-layout-image-${treeNode.key}`} className="nz-tree-node-status-icon">
                                <Image
                                    source={<NoFloorLayoutIcon
                                        fill='none'
                                        strokeWidth={1}
                                        size={FnGetCssVariable('--image-size-1')} />}
                                    uniqueName={`${treeNode.key}-icon-floor-layout`}
                                    w={16}
                                    tooltip={"Not positioned in Floor Layout"}
                                    type='svg'
                                />
                            </span>
                        )}
                    </span>
                )}

                {(showCopyIcon || showKebabIcon) && (
                    <span key={`node-icons-kebabmenu-${treeNode.key}`} className="nz-tree-node-nz-icon-div nz-node-kebab-copy-icon">
                        {showKebabIcon && handleKebabMenuSelect && (
                            <NodeMenu
                                showIcon={true}
                                uniqueName={`kebab-${treeNode.key}`}
                                handleSelect={handleKebabMenuSelect}
                                featureId={featureId}
                                selectedNode={selectedNodeExplorer?.node || newTreeNode}
                                container={container}
                                featureData={featureData}
                                allowAddCopyIconInOverlay={true}
                            />
                        )}
                    </span>
                )}
            </span>
        );
    };

    if (
        treeDataProps.instanceName && ["auth_by_role_treeview", "RoleByUser_for_userAuth"].includes(treeDataProps.instanceName) &&
        treeNode.GroupName !== "" &&
        treeNode.Name !== "Roles"
    ) {
        return (
            <div key={`node-title-auth-icon-${treeNode.key}`} className="d-flex justify-content-between align-items-center" style={{ paddingRight: 3 }}>
                <span key={`auth-title-${treeNode.key}`} title={titleContent}>{titleContent}</span>
                <Fragment key={`auth-icon-${treeNode.key}`}>{renderAuthIcon()}</Fragment>
            </div>
        );
    }

    return (
        <span
            key={`node-title-${treeNode.key}`}
            rel="tooltip"
            title={nodeTooltip}
            data-html="true"
            className={'nz-tree-node-title'}
            style={{ fontWeight: `${treeNode.IsNZ || treeNode.IsTemplate ? "600" : "inherit"}` }}
            id={treeNode.EntID || treeNode.key}
            node-info={JSON.stringify(clonedNode)}
        >
            <span className="nz-tree-node-content">
                <span key={`node-title-name-${treeNode.key}`} className={treeNode.EntID} node-info={JSON.stringify(clonedNode)}>
                    {renderNodeName()}
                </span>
                <Fragment key={`node-title-icon-${treeNode.key}`}>
                    {renderIcon()}
                </Fragment>
            </span>
        </span>
    );
}
export { TreeNodeTitle }

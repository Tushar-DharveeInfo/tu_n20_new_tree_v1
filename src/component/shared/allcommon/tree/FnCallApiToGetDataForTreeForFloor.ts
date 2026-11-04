import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { ISession, ISessionContextProps } from "../../context/allinterface/ISession";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { FnCallApiToUpdateSessionForExpandedNodes } from "../FnCallApiToUpdateSessionForExpandedNodes";
import { FnFindNearestNodeByType } from "../FnFindNearestNodeByType";
import { FnProcessStringToCompare } from "../basic/FnProcessStringToCompare";
import { FnCallApiToGetDataForTree } from "./FnCallApiToGetDataForTree";

const getFloorSessionHierarchy = (
    originalTreeData: ITreeNode[],
    floorNode: ITreeNode,
    expandedNodes?: ITreeNode[]
): ITreeNode[] => {
    const siteNode =
        FnFindNearestNodeByType(originalTreeData, floorNode, "Site") ??
        expandedNodes?.find((element) => element.NodeType && FnProcessStringToCompare(element.NodeType, "Site"));
    const roomNode =
        FnFindNearestNodeByType(originalTreeData, floorNode, "Room") ??
        expandedNodes?.find((element) => element.NodeType && FnProcessStringToCompare(element.NodeType, "Room"));
    const hierarchy: ITreeNode[] = [];
    if (siteNode) {
        hierarchy.push(siteNode);
    }
    if (roomNode) {
        hierarchy.push(roomNode);
    }
    return hierarchy;
};

const FnCallApiToGetDataForTreeForFloor = async (
    originalTreeData: ITreeNode[],
    selectedNode: ITreeNode,
    featureId: string,
    statusBarContext: IStatusBar,
    sessionContext: ISessionContextProps,
    sessionData?: ISession[],
    expandedNodes?: ITreeNode[],
    applyFilter: boolean = true
) => {
    if ((selectedNode.NodeType ?? "").toLowerCase() === "floor") {
        const sessionHierarchy = getFloorSessionHierarchy(originalTreeData, selectedNode, expandedNodes);
        await FnCallApiToUpdateSessionForExpandedNodes(
            sessionHierarchy,
            selectedNode,
            featureId,
            sessionContext,
            statusBarContext
        );
    }

    return FnCallApiToGetDataForTree(
        originalTreeData,
        selectedNode,
        featureId,
        statusBarContext,
        sessionData,
        undefined,
        undefined,
        applyFilter
    );
};

export { FnCallApiToGetDataForTreeForFloor };

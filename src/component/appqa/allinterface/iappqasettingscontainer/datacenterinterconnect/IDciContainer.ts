import { IActionImageForSubMenu } from "../../../../shared/allinterface/basic/IActionImageList";
import { ITreeNode } from "../../../../shared/allinterface/tree/ITreeControl";

interface IDciContainer {
	uniqueName: string;
	selectedNode: ITreeNode | null // selected node of DCI tree
	featureId: string// feature id
	selectedKebabMenu?: IActionImageForSubMenu // DCI tree right mouse menu 
	selectedNodeEntID?: string;
	handleReloadDCITree: (EntID: string, dciSegmentData?: any) => void // reload dci tree
}

export type { IDciContainer }

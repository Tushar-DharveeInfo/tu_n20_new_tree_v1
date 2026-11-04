import { ParentJSON } from "@n20a/libbox3d"

interface IThreeDView {
    ParentJSON: ParentJSON;
    label: string;
    handleMouse?: (event: React.MouseEvent | null, actionCode?: string) => void
    onRendered?: () => void;
}

export type { IThreeDView }

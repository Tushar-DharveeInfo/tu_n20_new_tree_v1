
import { ITreeNode } from "../allinterface/tree/ITreeControl";

const FnGetFilterDataUsingType = (
    object: ITreeNode[],
    type: string
): ITreeNode | undefined => {
    try {
        if (
            !Array.isArray(object) ||
            !type ||
            typeof type !== "string"
        ) {
            return undefined;
        }

        const data = object.filter(
            (item) =>
                item?.treetype === type ||
                item?.Name === type
        );

        if (data.length) {
            return data[0];
        }

        return undefined;
    } catch (error) {
        console.error(
            "Error in function(FnGetFilterDataUsingType): ",
            error
        );

        return undefined;
    }
}

export { FnGetFilterDataUsingType }
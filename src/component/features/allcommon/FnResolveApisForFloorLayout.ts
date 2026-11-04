import { DataTable, Device, ImageObject, layoutConfig, Location, TextObject } from "@n20a/liblayout";
import { FnInMemoryUrlForAPI } from "../../shared/allcommon/charts/FnInMemoryUrlForAPI";
import { IMemoryVariables } from "../../shared/allinterface/plan/IEditFloorLayout";

const FnResolveApisForFloorLayout = async (layoutJson: layoutConfig, memoryVars: IMemoryVariables) => {
    try {
        function evaluateFormulaSafe(formula: string, context: Record<string, unknown>): string {
            try {
                const fn = new Function(...Object.keys(context), `return (${formula});`);
                const result = fn(...Object.values(context));
                return String(result);
            } catch (err) {
                console.warn("Formula error:", formula, err);
                return "#ERR";
            }
        }
        const processForApiResolve = async (
            objectArray: TextObject[] | ImageObject[] | DataTable[] | undefined,
            type: 'text' | 'image' | 'datatable'
        ) => {
            if (!objectArray?.length) return;

            for (let index = 0; index < objectArray.length; index++) {
                const element = objectArray[index];

                if (type === 'text') {
                    if (memoryVars.sessionContext) {
                        const objectData = Object.fromEntries(
                            memoryVars.sessionContext.SessionList.map(item => [item.VariableName, item.SessionValue])
                        );
                        if (typeof (element as TextObject).label === 'string' && (element as TextObject).label.trim().startsWith('=')) {
                            const formula = (element as TextObject).label.trim().substring(1);
                            (element as TextObject).label = evaluateFormulaSafe(formula, objectData);
                        }
                    }
                }
                else if (type === 'image') {

                    if ((element as ImageObject).api) {
                        try {
                            const data = JSON.parse((element as ImageObject).api as string)
                            if (data.source) {
                                (element as ImageObject).inmemoryUrl = await FnInMemoryUrlForAPI(data,
                                    memoryVars.InMemoryUrlContext,
                                    memoryVars.statusBarContext,
                                    memoryVars.chartProfileContext,
                                    memoryVars.sessionContext,
                                    memoryVars.apiProfiles,
                                    memoryVars.isReturnCurrentURL,
                                    memoryVars.sendPrompt
                                ) as string;

                            }
                        } catch (e) {
                            console.warn(`API call failed for key "${(element as ImageObject).name}":`, e);
                            (element as ImageObject).inmemoryUrl = undefined;
                        }
                    }
                }
                else {
                    if ((element as ImageObject).api) {
                        try {
                            const data = JSON.parse((element as DataTable).api as string)
                            if (data.source) {
                                (element as DataTable).inmemoryUrl = await FnInMemoryUrlForAPI(data,
                                    memoryVars.InMemoryUrlContext,
                                    memoryVars.statusBarContext,
                                    memoryVars.chartProfileContext,
                                    memoryVars.sessionContext,
                                    memoryVars.apiProfiles,
                                    memoryVars.isReturnCurrentURL,
                                    memoryVars.sendPrompt
                                ) as string;

                            }
                        } catch (e) {
                            console.warn(`API call failed for key "${(element as DataTable).name}":`, e);
                            (element as DataTable).inmemoryUrl = undefined;
                        }
                    }

                }
            }
        };

        const traverseNodeForDeviceAndLocation = async (
            objectArray: Device[] | Location[],
            type: 'device' | 'location'
        ) => {
            if (type === 'device') {
                for (let index = 0; index < objectArray.length; index++) {
                    const element = objectArray[index] as Device;
                    await processForApiResolve(element.textArray, 'text');
                }
            }
            else {
                for (let index = 0; index < objectArray.length; index++) {
                    const element = objectArray[index] as Location;

                    await processForApiResolve(element.textArray, 'text');
                    await processForApiResolve(element.imageArray, 'image');
                    await processForApiResolve(element.datatableArray, 'datatable');

                    if (element.deviceArray?.length) {
                        traverseNodeForDeviceAndLocation(element.deviceArray, 'device');
                    }
                }
            }
        };

        // ---------- ROOT LEVEL PROCESSING ----------
        await processForApiResolve(layoutJson.textArray, 'text');
        await processForApiResolve(layoutJson.imageArray, 'image');
        await processForApiResolve(layoutJson.datatableArray, 'datatable');

        if (layoutJson.deviceArray?.length) {
            await traverseNodeForDeviceAndLocation(layoutJson.deviceArray, 'device');
        }

        if (layoutJson.locationArray?.length) {
            await traverseNodeForDeviceAndLocation(layoutJson.locationArray, 'location');
        }


        // IMPORTANT: Return updated layoutJson
        return layoutJson;
    } catch (e) {
        console.error("Error in FnResolveApisForFloorLayout", e);
        return layoutJson;
    }
};

export { FnResolveApisForFloorLayout };

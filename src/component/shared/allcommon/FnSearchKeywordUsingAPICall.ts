import { IFeatureTree } from "../allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITreeNode } from "../allinterface/tree/ITreeControl";
import { IStatusBar } from "../context/allinterface/IStatusBar";
import { axiosInterceptor } from "../interceptors/Interceptor";
import { EXPLORER } from "../interceptors/EndPoints";
import { FnTraverseTreeByHierarchy, IHierarchySearchItem, IHierarchySearchResult } from "./tree/FnTraverseTreeByHierarchy";
import { FnParseJsonSafely } from "../../appcontainer/allcommon/FnParseJsonSafely";

interface ISearchKeywordResult {
    EntID: string;
    EntityName: string;
    ParentNameDeviceID: string | null;
}

interface ISearchKeywordApiResponse {
    searchEntIDsJson: string;
}

interface ISearchKeywordNewHierarchyItem {
    EntID: string | null;
    EntityName: string;
    ParentNameDeviceID: string | null;
    Name?: string;
}

interface ISearchKeywordNewRecord {
    EntID: string;
    HierarchyJson: ISearchKeywordNewHierarchyItem[] | string;
}

const FnSearchKeyword = async (
    keyword: string,
    searchAllWord: boolean,
    exploreType: number,
    excludedEntIDs: string,
    statusBarContext: IStatusBar
): Promise<ISearchKeywordResult[]> => {
    try {
        const response = await new Promise<ISearchKeywordApiResponse>(
            (resolve, reject) => {
                try {
                    const request = axiosInterceptor(
                        {
                            url: EXPLORER.SearchKeyword,
                            data: {
                                keyword: keyword || "",
                                searchAllWord,
                                exploreType,
                                excludedEntIDs
                            },
                            allowShowLoader: true,
                            setFetchData: (
                                response: ISearchKeywordApiResponse
                            ) => {
                                resolve(response);
                            }
                        },
                        statusBarContext
                    );

                    if (
                        request &&
                        typeof (request as Promise<unknown>).catch === "function"
                    ) {
                        (request as Promise<unknown>).catch(reject);
                    }
                } catch (error) {
                    reject(error);
                }
            }
        );

        if (!response?.searchEntIDsJson) {
            return [];
        }

        const result: ISearchKeywordResult[] = JSON.parse(
            response.searchEntIDsJson
        );

        return Array.isArray(result) ? result : [];
    } catch (error) {
        console.error(
            "Error in function(FnSearchKeyword):",
            error
        );

        return [];
    }
};

const FnFetchSearchKeywordNew = async (
    keyword: string,
    searchAllWord: boolean,
    exploreType: number,
    statusBarContext: IStatusBar
): Promise<ISearchKeywordNewRecord[]> => {
    return new Promise((resolve) => {
        try {
            axiosInterceptor(
                {
                    url: EXPLORER.SearchKeywordNew,
                    data: {
                        keyword: keyword ?? "",
                        searchAllWord,
                        exploreType,
                        excludedEntIDs: ""
                    },
                    allowShowLoader: true,
                    setFetchData: (response: unknown) => {
                        try {
                            if (!response || typeof response !== "object") {
                                resolve([]);
                                return;
                            }
                            const rawJson =
                                (response as Record<string, any>).searchEntIDsJson ??
                                (response as Record<string, any>).data?.searchEntIDsJson ??
                                (response as Record<string, any>).data;

                            let parsed: any[] = [];
                            if (typeof rawJson === "string") {
                                parsed = FnParseJsonSafely(rawJson) ?? [];
                            } else if (Array.isArray(rawJson)) {
                                parsed = rawJson;
                            } else if (Array.isArray(response)) {
                                parsed = response as any[];
                            }

                            if (Array.isArray(parsed)) {
                                resolve(parsed as ISearchKeywordNewRecord[]);
                            } else {
                                resolve([]);
                            }
                        } catch (e) {
                            console.error("Error parsing SearchKeywordNew response:", e);
                            resolve([]);
                        }
                    }
                },
                statusBarContext
            );
        } catch (e) {
            console.error("Error calling SearchKeywordNew:", e);
            resolve([]);
        }
    });
};

const FnTraverseHierarchyRecord = async (
    originalTreeData: ITreeNode[],
    record: ISearchKeywordNewRecord,
    featureId: string,
    exploreType: number,
    treeDataProps: IFeatureTree,
    statusBarContext: IStatusBar
) => {
    const rawHierarchy: any[] = Array.isArray(record.HierarchyJson)
        ? record.HierarchyJson
        : (typeof record.HierarchyJson === "string" ? FnParseJsonSafely(record.HierarchyJson) : []) ?? [];

    const hierarchySearchItems: IHierarchySearchItem[] = rawHierarchy
        .filter((h: any) => h && h.EntID)
        .map((h: any) => ({
            EntityName: h.EntityName ?? "",
            EntID: h.EntID,
            Name: h.Name ?? ""
        }));

    if (record.EntID && !hierarchySearchItems.some(item => item.EntID?.toLowerCase() === record.EntID.toLowerCase())) {
        const lastEntity = rawHierarchy[rawHierarchy.length - 1];
        hierarchySearchItems.push({
            EntityName: lastEntity?.EntityName ?? "Device",
            EntID: record.EntID,
            Name: lastEntity?.Name ?? ""
        });
    }

    const traversalResult = await FnTraverseTreeByHierarchy(
        originalTreeData,
        hierarchySearchItems,
        featureId,
        exploreType,
        treeDataProps,
        statusBarContext
    );

    return {
        parentNodes: hierarchySearchItems,
        originalTreeData: traversalResult.originalTreeData,
        selectedNodeKey: traversalResult.selectedNodeKey,
        selectedNode: traversalResult.selectedNode,
        expandKeys: traversalResult.expandKeys,
        expandedNodes: traversalResult.expandedNodes
    };
};

const FnSearchKeywordUsingAPICall = async (
    originalTreeData: ITreeNode[],
    keyword: string,
    searchAllWord: boolean,
    exploreType: number,
    excludedEntIDs: string,
    featureId: string,
    treeDataProps: IFeatureTree,
    statusBarContext: IStatusBar
) => {
    let hierarchySearchItems: IHierarchySearchItem[] = [];
    let updatedTreeData = originalTreeData;
    let traversalResult: IHierarchySearchResult | undefined;

    try {
        await new Promise<void>((resolve, reject) => {

            const handleSearchKeywordApiResponse = async (
                searchKeywordApiResponse: unknown
            ) => {
                try {
                    if (
                        !searchKeywordApiResponse ||
                        typeof searchKeywordApiResponse !== "object" ||
                        !("searchEntIDsJson" in searchKeywordApiResponse)
                    ) {
                        resolve();
                        return;
                    }

                    const searchEntIDsJson =
                        searchKeywordApiResponse.searchEntIDsJson;

                    if (typeof searchEntIDsJson !== "string") {
                        resolve();
                        return;
                    }

                    const apiData = FnParseJsonSafely(searchEntIDsJson);

                    if (!Array.isArray(apiData) || !apiData.length) {
                        resolve();
                        return;
                    }

                    hierarchySearchItems = apiData.map(
                        (item: Record<string, any>): IHierarchySearchItem => ({
                            EntityName: item.EntityName ?? "",
                            EntID: item.EntID,
                            Name: item.Name ?? ""
                        })
                    );
                    // IMPORTANT:
                    // Wait for the complete hierarchy traversal
                    const result = await FnTraverseTreeByHierarchy(
                        updatedTreeData,
                        hierarchySearchItems,
                        featureId,
                        exploreType,
                        treeDataProps,
                        statusBarContext
                    );

                    traversalResult = result;
                    updatedTreeData = result.originalTreeData;

                    // Only resolve AFTER traversal is complete
                    resolve();

                } catch (error) {
                    reject(error);
                }
            };

            axiosInterceptor(
                {
                    url: EXPLORER.SearchKeyword,
                    data: {
                        keyword: keyword ?? "",
                        searchAllWord,
                        exploreType,
                        excludedEntIDs
                    },
                    allowShowLoader: true,
                    setFetchData: handleSearchKeywordApiResponse
                },
                statusBarContext
            );
        });

    } catch (error) {
        console.error(
            "Error in function(FnSearchKeywordUsingAPICall): ",
            error
        );
    }

    return {
        parentNodes: hierarchySearchItems,
        originalTreeData: updatedTreeData,
        selectedNodeKey: traversalResult?.selectedNodeKey,
        selectedNode: traversalResult?.selectedNode,
        expandKeys: traversalResult?.expandKeys,
        expandedNodes: traversalResult?.expandedNodes
    };
};

export type { ISearchKeywordNewRecord, ISearchKeywordNewHierarchyItem };
export { FnSearchKeywordUsingAPICall, FnSearchKeyword, FnFetchSearchKeywordNew, FnTraverseHierarchyRecord };

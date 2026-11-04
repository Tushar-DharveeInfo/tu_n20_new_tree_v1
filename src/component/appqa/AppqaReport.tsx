import { FnGetApiProfiles } from "../shared/allcommon/FnGetApiProfiles";

import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { updateLayoutWithSessionVars } from "@n20a/libreport";
import { useAgent } from "@n20a/libmcpclient";
import { useCommonVariableContext } from "../shared/context/hooks/CommonVariableHooks";
import { useChartProfileContext } from "../shared/context/hooks/ChartProfileHooks";
import { useStatusBarContext } from "../shared/context/hooks/StatusBarHooks";
import { useReportContext } from "../shared/context/hooks/ReportHooks";
import { useSessionContext } from "../shared/context/hooks/SessionHooks";
import { useInMemoryUrlContext } from "../shared/context/hooks/InMemoryUrlHooks";
import { useSelectedNodeContext } from "../shared/context/hooks/SelectedNodeHooks";
import { axiosInterceptor } from "../shared/interceptors/Interceptor";
import "./allcss/AppqaReport.css";
import "@n20a/libreport/style.css";
import { Report24x24 } from "@n20a/libicon";
import { ALERT, EM, FS, NODE } from "../shared/interceptors/EndPoints";
import { EntityNameEnums } from "../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer";
import { FnHandleAPIResponse } from "../shared/allcommon/basic/FnHandleAPIResponse";
import { FnGetCssVariable } from "../appcontainer/allcommon/FnGetCssVariable";
import { FnInMemoryUrlForAPI } from "../shared/allcommon/charts/FnInMemoryUrlForAPI";
import { FnInMemoryUrlToJson } from "../shared/allcommon/charts/FnJsonToInMemoryUrl";
import PdfMakerContainer from "../shared/pdfmakercontainer/PdfMakerContainer";
import {
    FnActivateOptionForReport,
    FnCreateFiltersForReport,
} from "./allcommon/FnCreateFiltersForReport";
import { IAppqaReport } from "./allinterface/IAppqaReport";
import { IReportProfileItem } from "../shared/context/allinterface/IReport";
import { IMemoryUrlItem } from "../shared/context/allinterface/IInMemoryUrl";
import { Label } from "../shared/basic/label/Label";
import { OptionsFilter } from "../shared/basic/optionsfilter/OptionsFilter";
import { YesNoFormContainer } from "../shared/basic/yesnoformcontainer/YesNoFormContainer";
import { OverlayTab } from "../shared/basic/overlaytab/OverlayTab";
import { FnParseJsonSafely } from "../appcontainer/allcommon/FnParseJsonSafely";
import { IOptionItem } from "../shared/allinterface/basic/IOptionsFilter";
import { CardLayout } from "../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../shared/allinterface/cardlayout/ICardLayout";
import { FnFormatDateWithAppFormat } from "../appcontainer/allcommon/FnFormatDateWithAppFormat";
import { useMainAppContext } from "../shared/context/hooks/MainAppHooks";
import { getMuForSite } from "../shared/context/contextandprovider/ExplorerTree";
import { envVarEnums } from "../appcontainer/alldefaultprops/DefaultPropsAppContainer";
import { FnGetEnvVariableByKey } from "../appcontainer/allcommon/FnGetEnvVariableByKey";
import { FnGetWorkorderProfile } from "./allcommon/FnGetWorkorderProfile";
import { IWorkorderRecord } from "@n20a/libform";
import { FnGetKebabMenuDataByEntity } from "./allcommon/FnGetKebabMenuDataByEntity";
import { ISelectedNodeProperty } from "../shared/context/allinterface/ISelectedNode";
// Maps API report record into IReportProfileItem shape.

const mapToReportProfileItem = (
    data: Record<string, any>
): IReportProfileItem => {
    try {
        // Validate input
        if (!data || typeof data !== "object") {
            console.warn("Invalid input provided to mapToReportProfileItem:", data);
            return {
                _ReportProfile: "",
                Description: "",
                EntityNames: "",
            } as IReportProfileItem;
        }
        return {
            _ReportProfile: data.Name ?? "", // unique identifier
            Description: data.Description ?? "", // required field
            EntityNames: data.EntityNames ?? "", // required field
            ...Object.fromEntries(
                Object.entries(data).filter(
                    ([key]) =>
                        !["_ReportProfile", "Description", "EntityNames"].includes(key)
                )
            ),
        };
    } catch (error) {
        console.error("Error in mapToReportProfileItem:", error);
        // Fallback safe object (same structure)
        return {
            _ReportProfile: "",
            Description: "",
            EntityNames: "",
        } as IReportProfileItem;
    }
};

// Builds CardLayout fields for a single report card.
const buildReportCardFields = (
    report: IReportProfileItem
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "Report",
            Value: `${report._ReportProfile || "—"}`,
            Header: 1,
            Group: "header",
        },
    ];
    if (report.LastUpdated) {
        fields.push({
            Name: "Last Updated",
            Value: FnFormatDateWithAppFormat(report.LastUpdated, true),
            Header: 3,
            Row: "inline",
            Group: "header",
        });
    }
    if (report.Description) {
        fields.push({ Name: "Description", Value: report.Description });
    }
    if (report.TemplateFileName) {
        fields.push({ Name: "Template", Value: report.TemplateFileName });
    }
    return fields;
};

// Returns true when report Enable/Enabled flag is on.
const isReportEnabled = (report: IReportProfileItem): boolean => {
    const enableValue = report.Enable ?? report.Enabled;
    return (
        enableValue === true ||
        enableValue === 1 ||
        enableValue === "1" ||
        enableValue === "true"
    );
};

// Returns true when report belongs to the "default" group.
const isDefaultReport = (report: IReportProfileItem): boolean =>
    String(report?.GroupName ?? "").trim().toLowerCase() === "default";

// Sort reports A–Z by report name.
const sortReportsAZ = (reports: IReportProfileItem[]): IReportProfileItem[] =>
    [...reports].sort((a, b) =>
        String(a._ReportProfile ?? "").localeCompare(String(b._ReportProfile ?? ""), undefined, {
            sensitivity: "base",
        })
    );

// Renders available report profiles with filter, preview, PDF, and Excel actions.
const AppqaReport = (appqaReportProps: IAppqaReport) => {
    const [reportData, setReportData] = useState<IReportProfileItem[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string>("");
    const [selectedReport, setSelectedReport] = useState<IReportProfileItem | null>(null);
    const [reportDataOriginal, setReportDataOriginal] = useState<IReportProfileItem[]>([]);
    const [filterValue, setFilterValue] = useState<IOptionItem[]>([]);
    const [reportHeader, setReportHeader] = useState<string>("Available Reports");
    const [reportConfigContent, setReportConfigContent] = useState<any>();
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [diagnosticLevel, setDiagnosticLevel] = useState<number>(1);
    const [selectedFilter, setSelectedFilter] = useState<string>();
    const [isDataProcessed, setIsDataProcessed] = useState(false);
    const [isLoadingReports, setIsLoadingReports] = useState(true);
    const [workorderProfileRecord, setWorkorderProfileRecord] = useState<IWorkorderRecord>();
    const hasRequestedReports = useRef(false);
    const loadedFeatureId = useRef<string | undefined>(undefined);

    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const reportContext = useReportContext();
    const sessionContext = useSessionContext();
    const selectedNodeContext = useSelectedNodeContext();
    const commonVariableContext = useCommonVariableContext();
    const chartProfileContext = useChartProfileContext();
    const InMemoryUrlContext = useInMemoryUrlContext();

    const workOrder = sessionContext?.SessionList?.find(
        (item) => item.VariableName?.toLowerCase() === "selectedworkorder"
    )?.SessionValue;
    const { sendPrompt } = useAgent();

    // Helper function to get session variables for JS evaluation
    const getSessionVars = (): Record<string, any> => {
        const sessionObj: Record<string, string | null> = {};
        sessionContext.SessionList.forEach((s) => {
            if (s.VariableContext && s.VariableName && s.AllowInReport) {
                const key = `${s.VariableName}`;
                sessionObj[key] = s.SessionValue ?? null;
            }
        });

        const configObj: Record<string, string | null> = {};
        const filteredAp = mainAppContext.apRecords.filter((item) => item.SubGroupName.toLowerCase() === "configure");
        if (filteredAp.length) {
            for (let index = 0; index < filteredAp.length; index++) {
                const element = filteredAp[index];
                configObj[`${element.Name}`] = element.Value;
            }
        }
        const selectedNodeObj: Record<string, any> = {};
        if (selectedNodeContext.selectedNodeProperty) {
            Object.keys(selectedNodeContext.selectedNodeProperty).forEach((key) => {
                const value = selectedNodeContext.selectedNodeProperty?.[key];
                if (value !== undefined && typeof value !== "object") {
                    selectedNodeObj[key] = value;
                }
            });
        }
        const finalObj = {
            session: sessionObj,
            selectednode: selectedNodeObj,
            configure: configObj,
            sessionid: statusBarContext.userSessionId,
            workorder: workorderProfileRecord,
            deployment: {
                N20_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.N20_API_URL
                ),
                DCMLISTENER_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.DCMLISTENER_API_URL
                ),
                EXPSERVER_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.EXPSERVER_API_URL
                ),
                NZINTHUB_API_URL: FnGetEnvVariableByKey(
                    envVarEnums.NZINTHUB_API_URL
                )
            }
        };
        return finalObj
    };

    // Clears report list state and destroys in-memory URLs when component unmounts.
    useEffect(() => {
        return () => {
            setReportData([]);
            setFilterValue([]);
            InMemoryUrlContext?.FnDestroyInMemoryUrls();
        };
    }, []);

    useEffect(() => {
        if (!workOrder) return;

        const loadWorkorderProfile = async () => {
            const workorderRecord = await FnGetWorkorderProfile(
                workOrder,
                statusBarContext
            );

            if (!workorderRecord) return;
            setWorkorderProfileRecord(workorderRecord)

            // use workorderRecord here
        };

        loadWorkorderProfile();
    }, [workOrder]);

    // When reports are shown for the selected node, load latest node property for getSessionVars.
    useEffect(() => {
        if (selectedFilter !== "Selected Node") {
            return;
        }

        const currentNode =
            selectedNodeContext.selectedNodeExplorer ??
            selectedNodeContext.selectedNode;

        if (
            !currentNode ||
            selectedNodeContext.selectedNodeProperty?.EntID === currentNode.NodeEntID
        ) {
            return;
        }

        const loadSelectedNodeProperty = async () => {
            if (!currentNode.NodeEntityname || !currentNode.NodeEntID) {
                return;
            }

            const kebabData = await FnGetKebabMenuDataByEntity(
                currentNode.NodeEntityname,
                currentNode.NodeType?.toLowerCase(),
                currentNode.NodeEntID,
                statusBarContext
            );

            if (typeof kebabData === "object" && kebabData && Object.values(kebabData).length) {
                const record = Object.values(
                    kebabData as Record<string, ISelectedNodeProperty[]>
                )?.[0]?.[0];

                if (record) {
                    selectedNodeContext.setSelectedNodeProperty(record);
                }
            }

            if (workOrder) {
                const workorderRecord = await FnGetWorkorderProfile(
                    workOrder,
                    statusBarContext
                );

                if (!workorderRecord) {
                    return;
                }
                selectedNodeContext.setSelectedWorkorderRecord(workorderRecord);
            }
        };

        void loadSelectedNodeProperty();
    }, [
        selectedFilter,
        selectedNodeContext.selectedNode,
        selectedNodeContext.selectedNodeExplorer,
        selectedNodeContext.selectedNodeProperty?.EntID,
        workOrder,
    ]);



    // Loads report profiles from context or API and applies enabled/filter rules.
    useEffect(() => {
        if (!appqaReportProps.featureId) {
            setIsLoadingReports(false);
            setIsDataProcessed(true);
            setReportData([]);
            return;
        }
        if (loadedFeatureId.current !== appqaReportProps.featureId) {
            loadedFeatureId.current = appqaReportProps.featureId;
            hasRequestedReports.current = false;
            setIsDataProcessed(false);
            setIsLoadingReports(true);
        }
        const reportProfiles = reportContext.reportProfiles;
        let options = FnCreateFiltersForReport();
        let filteredReport: IReportProfileItem[] = [];
        if (reportProfiles.length > 0) {
            const enabledReportProfiles = reportProfiles.filter(isReportEnabled);
            // Filter by selected node
            const nodeEntityName =
                (selectedNodeContext.selectedNodeExplorer ??
                    selectedNodeContext.selectedNode)?.NodeEntityname;
            if (nodeEntityName?.length) {
                filteredReport = enabledReportProfiles.filter((item) =>
                    item.EntityNames?.includes(nodeEntityName)
                );
                if (filteredReport.length) {
                    options = FnActivateOptionForReport(options, "Selected Node");
                    setSelectedFilter("Selected Node");
                    setReportHeader(
                        `Available Reports for: ${nodeEntityName}`
                    );
                }
            }
            // Filter by feature or menu from session
            if (!filteredReport.length && sessionContext.SessionList.length) {
                const featureName = sessionContext.SessionList.find(
                    (s) => s.VariableName.toLowerCase() === "featurename"
                )?.SessionValue;
                if (featureName?.length) {
                    filteredReport = enabledReportProfiles.filter((item) =>
                        item.GroupName?.includes(featureName) &&
                        !isDefaultReport(item)
                    );
                    if (filteredReport.length) {
                        options = FnActivateOptionForReport(options, "Selected Feature");
                        setSelectedFilter("Selected Feature");
                        setReportHeader(`Available Reports for: ${featureName}`);
                    }
                }
                if (!filteredReport.length) {
                    const menuName = sessionContext.SessionList.find(
                        (s) => s.VariableName.toLowerCase() === "menuname"
                    )?.SessionValue;
                    if (menuName?.length) {
                        filteredReport = enabledReportProfiles.filter((item) =>
                            item.GroupName?.includes(menuName) &&
                            !isDefaultReport(item)
                        );
                        if (filteredReport.length) {
                            options = FnActivateOptionForReport(options, "Selected Feature");
                            setSelectedFilter("Selected Feature");
                            setReportHeader(`Available Reports for: ${menuName}`);
                        }
                    }
                }
            }
            // Fallback to All
            if (!filteredReport.length) {
                filteredReport = enabledReportProfiles.filter(
                    (item) => !item.EntityNames && !isDefaultReport(item)
                );
                options = FnActivateOptionForReport(options, "All");
                setSelectedFilter("All");
                setReportHeader(`Available Reports`);
            }
            // Deduplicate + sort
            const sortedData = filteredReport
                .filter(
                    (item, index, self) =>
                        index ===
                        self.findIndex(
                            (t) =>
                                t[`_${EntityNameEnums.ReportProfile}`] ===
                                item[`_${EntityNameEnums.ReportProfile}`]
                        )
                )
                .sort((a, b) =>
                    String(a._ReportProfile ?? "").localeCompare(String(b._ReportProfile ?? ""), undefined, {
                        sensitivity: "base",
                    })
                );
            setFilterValue(options);
            setReportData(sortedData);
            setReportDataOriginal(enabledReportProfiles);
            setIsDataProcessed(true);
            setIsLoadingReports(false);
        } else if (hasRequestedReports.current) {
            setReportData([]);
            setIsDataProcessed(true);
            setIsLoadingReports(false);
        } else {
            hasRequestedReports.current = true;
            setIsLoadingReports(true);
            axiosInterceptor(
                {
                    url: ALERT.GetAlertProfiles,
                    data: {
                        entityName: EntityNameEnums.ReportProfile,
                    },
                    allowShowLoader: true,
                    setFetchData: (handleReportProfiles: unknown, status?: string) => {
                        if (
                            status === "200" &&
                            handleReportProfiles &&
                            typeof handleReportProfiles === "object" &&
                            "alertJson" in handleReportProfiles
                        ) {
                            const reportRecords = FnHandleAPIResponse(
                                handleReportProfiles.alertJson,
                                "Dataset"
                            );
                            if (Array.isArray(reportRecords)) {
                                const reports: IReportProfileItem[] = [];
                                for (let index = 0; index < reportRecords.length; index++) {
                                    const element = reportRecords[index];
                                    reports.push(mapToReportProfileItem(element));
                                }
                                if (reports.length > 0) {
                                    reportContext.setReportProfiles(reports);
                                    return;
                                }
                                reportContext.setReportProfiles([]);
                                setReportData([]);
                                setFilterValue(FnCreateFiltersForReport());
                            } else {
                                setReportData([]);
                            }
                        } else {
                            setReportData([]);
                        }
                        setIsDataProcessed(true);
                        setIsLoadingReports(false);
                    },
                },
                statusBarContext
            ).catch(() => {
                setReportData([]);
                setIsDataProcessed(true);
                setIsLoadingReports(false);
            });
        }
    }, [
        appqaReportProps.featureId,
        reportContext.reportProfiles,
        selectedNodeContext.selectedNode,
        selectedNodeContext.selectedNodeExplorer,
        sessionContext.SessionList.length,
    ]);

    // Recursively collects API config strings from report layout JSON.
    function FnExtractApiValues(
        obj: unknown,
        isReturnJsonApiData: boolean
    ): { key: string; value: string }[] {
        const result: { key: string; value: string }[] = [];
        // Walks nested layout nodes to find API string values.
        function recurse(value: unknown): void {
            try {
                if (Array.isArray(value)) {
                    value.forEach(recurse);
                } else if (typeof value === "object" && value !== null) {
                    const entries = Object.entries(value as Record<string, unknown>);
                    for (const [key, val] of entries) {
                        try {
                            if (
                                typeof key === "string" &&
                                key.toLowerCase().includes("api") &&
                                typeof val === "string" &&
                                val !== ""
                            ) {
                                result.push({
                                    key: (value as any)?.id ?? key,
                                    value: val,
                                });
                            }
                            recurse(val);
                        } catch (innerError) {
                            console.warn("Error processing key:", key, innerError);
                        }
                    }
                }
            } catch (error) {
                console.error("Error in recurse:", error);
            }
        }
        try {
            recurse(obj);
        } catch (error) {
            console.error("Error executing FnExtractApiValues:", error);
        }
        // filtering WITHOUT changing output
        if (isReturnJsonApiData) {
            return result.filter((item) => {
                try {
                    const parsed = JSON.parse(item.value);
                    return parsed?.source === "JsonApi";
                } catch {
                    return false;
                }
            });
        }
        return result;
    }

    // Exports selected report payload as Excel via PDF download flow.
    const handleClickSaveAsExcel = async (payload?: string) => {
        try {
            if (!payload || typeof payload !== "string") {
                appqaReportProps.handleShowUserMessage?.(
                    "Invalid payload: Must be a JSON string."
                );
                return;
            }
            const reportData = FnParseJsonSafely(payload);
            handleClickDownloadPdf(undefined, reportData, true);
        } catch (error) {
            console.error("Error in save excel :", error);
            appqaReportProps.handleShowUserMessage?.(
                "Something went wrong in save as Excel"
            );
        }
    };

    // Evaluates a layout label formula against session/context values.
    function evaluateFormulaSafe(
        formula: string,
        context: Record<string, unknown>
    ): string {
        try {
            const helpers = {
                GETDATE: () => {
                    const now = new Date();

                    const pad = (n: number) => String(n).padStart(2, "0");

                    const dd = pad(now.getDate());
                    const MM = pad(now.getMonth() + 1);
                    const yyyy = now.getFullYear();
                    const HH = pad(now.getHours());
                    const mm = pad(now.getMinutes());
                    const ss = pad(now.getSeconds());

                    return getMuForSite() === "europe"
                        ? `${dd}/${MM}/${yyyy} ${HH}:${mm}:${ss}`
                        : `${MM}/${dd}/${yyyy} ${HH}:${mm}:${ss}`;
                },
                TODAY: () => {
                    const now = new Date();
                    return new Intl.DateTimeFormat("en-GB").format(now);
                },
                NOW: () => new Date(),
            };

            const scope = { ...context, ...helpers };

            const fn = new Function(
                ...Object.keys(scope),
                `return (${formula});`
            );

            return String(fn(...Object.values(scope)));
        } catch (err) {
            console.warn("Formula error:", formula, err);
            return "#ERR";
        }
    }

    // Traverses layout JSON and resolves formula labels plus field name conversions.
    async function traverseAndEvaluateLabelsSafe(
        node: unknown,
        apiProfiles?: unknown[],
        context: Record<string, unknown> = {}
    ): Promise<unknown> {
        try {
            if (typeof node !== "object" || node === null) return node;
            const safeNode: Record<string, unknown> = {
                ...(node as Record<string, unknown>),
            };
            // Evaluate label if it's a formula string
            try {
                if (
                    typeof safeNode.label === "string" &&
                    safeNode.label.trim().startsWith("=")
                ) {
                    const formula = safeNode.label.trim().substring(1);
                    safeNode.label = evaluateFormulaSafe(formula, context);
                }
            } catch (labelError) {
                console.warn("Error evaluating label:", labelError);
            }
            // Recursively check each key for array of objects
            for (const key in safeNode) {
                try {
                    const value = safeNode[key];
                    // Convert field names
                    if (key === "EntID") {
                        safeNode.id = safeNode.EntID;
                        delete safeNode.EntID;
                    }
                    if (key === "Name") {
                        safeNode.name = safeNode.Name;
                        delete safeNode.Name;
                    }
                    // Numeric conversions
                    if (key === "w" || key === "h" || key === "px" || key === "py") {
                        const num = Number(value);
                        safeNode[key] = isNaN(num) ? 0 : num;
                    } else if (
                        Array.isArray(value) &&
                        value.every((v) => typeof v === "object" && v !== null)
                    ) {
                        safeNode[key] = await Promise.all(
                            value.map((v) =>
                                traverseAndEvaluateLabelsSafe(v, apiProfiles, context)
                            )
                        );
                    }
                } catch (keyError) {
                    console.warn(`Error processing key: ${key}`, keyError);
                }
            }
            return safeNode;
        } catch (error) {
            console.error("Error in traverseAndEvaluateLabelsSafe:", error);
            return node; // fallback without breaking flow
        }
    }

    // Executes layout API configs and returns in-memory URL lookup items.
    const MakeApiCallsForMemoryURL = async (
        Apis: { key: string; value: string }[],
        apiProfiles?: unknown[]
    ) => {
        try {
            let urlsObj: IMemoryUrlItem[] = [];
            for (let index = 0; index < Apis.length; index++) {
                const element = Apis[index];
                if (!element?.value) continue;
                const data = JSON.parse(element.value);
                if (!data?.source) continue;
                //  attach id inside payload (not source)
                data.payload = {
                    ...data.payload,
                    id: element.key,
                };
                urlsObj = (await FnInMemoryUrlForAPI(
                    data,
                    InMemoryUrlContext,
                    statusBarContext,
                    chartProfileContext,
                    sessionContext,
                    apiProfiles,
                    false,
                    sendPrompt,
                    selectedNodeContext.selectedNode,
                    undefined,
                    selectedNodeContext
                )) as IMemoryUrlItem[];
            }
            return urlsObj;
        } catch (error) {
            console.error("MakeApiCallsForMemoryURL error:", error);
            return [];
        }
    };

    // Finds in-memory URL for a layout node by its API id key.
    function getMemoryUrlById(
        id: string,
        memoryUrlLookup: { key: string; memoryUrl: string }[]
    ): string | null {
        const found = memoryUrlLookup.find((item) => item.key === id);
        return found ? found.memoryUrl : null;
    }

    // Injects resolved in-memory URLs into layout image/table/markdown arrays.
    function injectMemoryUrlsAndReturn(
        node: Record<string, any>,
        memoryUrlLookup: { key: string; memoryUrl: string }[]
    ): Record<string, any> {
        try {
            if (!node || typeof node !== "object") return node;
            // Shallow clone
            const updatedNode = { ...node };
            // imageArray
            try {
                if (Array.isArray(updatedNode.imageArray)) {
                    updatedNode.imageArray = updatedNode.imageArray.map((img: any) => {
                        try {
                            const memoryUrl = img?.id
                                ? getMemoryUrlById(img.id, memoryUrlLookup)
                                : null;
                            return memoryUrl
                                ? { ...img, inmemoryUrl: memoryUrl, format: "png" }
                                : img;
                        } catch (imgError) {
                            console.warn("Error processing imageArray item:", imgError);
                            return img;
                        }
                    });
                }
            } catch (error) {
                console.warn("Error in imageArray:", error);
            }
            // datatableArray
            try {
                if (Array.isArray(updatedNode.datatableArray)) {
                    updatedNode.datatableArray = updatedNode.datatableArray.map(
                        (dt: any) => {
                            try {
                                const memoryUrl = dt?.id
                                    ? getMemoryUrlById(dt.id, memoryUrlLookup)
                                    : null;
                                return memoryUrl
                                    ? { ...dt, inmemoryUrl: memoryUrl, embeddedContent: "", format: "png" }
                                    : dt;
                            } catch (dtError) {
                                console.warn("Error processing datatableArray item:", dtError);
                                return dt;
                            }
                        }
                    );
                }
            } catch (error) {
                console.warn("Error in datatableArray:", error);
            }
            // markdownArray
            try {
                if (Array.isArray(updatedNode.markdownArray)) {
                    updatedNode.markdownArray = updatedNode.markdownArray.map(
                        (dt: any) => {
                            try {
                                const memoryUrl = dt?.id
                                    ? getMemoryUrlById(dt.id, memoryUrlLookup)
                                    : null;
                                return memoryUrl
                                    ? { ...dt, inmemoryUrl: memoryUrl, format: "png" }
                                    : dt;
                            } catch (mdError) {
                                console.warn("Error processing markdownArray item:", mdError);
                                return dt;
                            }
                        }
                    );
                }
            } catch (error) {
                console.warn("Error in markdownArray:", error);
            }
            // recurse through locationArray
            try {
                if (Array.isArray(updatedNode.locationArray)) {
                    updatedNode.locationArray = updatedNode.locationArray.map(
                        (loc: any) => {
                            try {
                                return injectMemoryUrlsAndReturn(loc, memoryUrlLookup);
                            } catch (locError) {
                                console.warn("Error processing locationArray item:", locError);
                                return loc;
                            }
                        }
                    );
                }
            } catch (error) {
                console.warn("Error in locationArray:", error);
            }
            return updatedNode;
        } catch (error) {
            console.error("Error in injectMemoryUrlsAndReturn:", error);
            return node; // fallback without breaking flow
        }
    }

    // Writes multiple datatable API responses into one Excel workbook file.
    function exportMultipleDatatablesToExcel(
        dataArray: Record<string, any>[],
        fileName: string = "Report.xlsx"
    ): void {
        if (!Array.isArray(dataArray) || dataArray.length === 0) return;
        try {
            const workbook = XLSX?.utils?.book_new();
            if (!workbook) {
                console.error("Failed to create workbook");
                return;
            }
            dataArray.forEach((tableObj, index) => {
                try {
                    if (!tableObj || typeof tableObj !== "object") return;
                    const tableKey = Object.keys(tableObj)[0];
                    const tableData = tableObj[tableKey];
                    if (!tableData || typeof tableData !== "object") return;
                    const entityKey = Object.keys(tableData)[0];
                    const entityData = tableData[entityKey]?.[0];
                    if (!entityData?.ColumnList || !entityData?.Dataset) return;
                    const { ColumnList, Dataset } = entityData;
                    // Headers
                    const headers = ColumnList.map((col: Record<string, any>) => {
                        try {
                            return col?.PropertyLabel?.trim() || col?.PName;
                        } catch {
                            return col?.PName || "";
                        }
                    });
                    // Rows
                    const rows = Dataset.map((row: Record<string, any>) => {
                        try {
                            return ColumnList.map(
                                (col: Record<string, any>) => row?.[col?.PName] ?? ""
                            );
                        } catch {
                            return [];
                        }
                    });
                    const sheetData = [headers, ...rows];
                    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
                    // Excel sheet name max length = 31
                    const sheetName = (tableKey || `Sheet${index + 1}`).substring(0, 31);
                    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
                } catch (sheetError) {
                    console.error(
                        `Error processing table at index ${index}:`,
                        sheetError
                    );
                }
            });
            try {
                XLSX.writeFile(workbook, fileName);
            } catch (writeError) {
                console.error("Error writing Excel file:", writeError);
            }
        } catch (error) {
            console.error("Error in exportMultipleDatatablesToExcel:", error);
        } finally {
            try {
                // ALWAYS cleanup in-memory URLs
                InMemoryUrlContext?.FnDestroyInMemoryUrls?.();
            } catch (cleanupError) {
                console.warn("Error during cleanup:", cleanupError);
            }
        }
    }
    const FnParseApiToInMemoryUrlJson = async (config: Record<string, unknown>) => {
        let updatedConfig = {}
        const objectData = Object.fromEntries(
            sessionContext.SessionList.map((item) => [
                item.VariableName,
                item.SessionValue,
            ])
        );
        const updatedReportConfig =
            await traverseAndEvaluateLabelsSafe(
                config,
                undefined,
                objectData
            ) as object;
        // Extracts API configs from layout JSON and fetches in-memory URLs.
        const apis = FnExtractApiValues(updatedReportConfig, false);
        if (apis.length) {
            // Fetches API profiles and builds report output from in-memory data.
            const profiles = await FnGetApiProfiles(mainAppContext, statusBarContext);
            // create memory urls for all the API calls in the layout json
            const inmemoryUrls = await MakeApiCallsForMemoryURL(
                apis,
                profiles
            );
            // Inject in-memory URLs into layout JSON
            const updatedJson = injectMemoryUrlsAndReturn(
                updatedReportConfig,
                inmemoryUrls
            );
            if (typeof updatedJson === "object") {
                const safeNode: Record<string, unknown> = {
                    ...updatedJson,
                };
                if (
                    (
                        safeNode.NodeType as string
                    )?.toLowerCase() === "layout"
                ) {
                    if (Array.isArray(safeNode.header)) {
                        safeNode.header = Object.assign(
                            {},
                            ...safeNode.header
                        );
                    }
                    if (Array.isArray(safeNode.footer)) {
                        safeNode.footer = Object.assign(
                            {},
                            ...safeNode.footer
                        );
                    }
                    if (Array.isArray(safeNode.page)) {
                        safeNode.page = Object.assign(
                            {},
                            ...safeNode.page
                        );
                    }
                }

                updatedConfig = safeNode;
            }


        } else {

            if (typeof updatedReportConfig === "object") {
                const safeNode: Record<string, unknown> = {
                    ...updatedReportConfig,
                };
                if (
                    (safeNode.NodeType as string)?.toLowerCase() ===
                    "layout"
                ) {
                    if (Array.isArray(safeNode.header)) {
                        safeNode.header = Object.assign(
                            {},
                            ...safeNode.header
                        );
                    }
                    if (Array.isArray(safeNode.footer)) {
                        safeNode.footer = Object.assign(
                            {},
                            ...safeNode.footer
                        );
                    }
                    if (Array.isArray(safeNode.page)) {
                        safeNode.page = Object.assign(
                            {},
                            ...safeNode.page
                        );
                    }
                }
                updatedConfig = safeNode;
            }
        }
        return updatedConfig
    }

    // Loads report template file and opens PDF preview or Excel export.
    const handleClickDownloadPdf = async (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined,
        selectedReport: IReportProfileItem,
        ExportExcel?: boolean
    ) => {
        if (
            commonVariableContext.diagnosticLevel &&
            commonVariableContext.diagnosticLevel?.toString() === "0"
        ) {
            setDiagnosticLevel(0);
        }
        if (!selectedReport || typeof selectedReport !== "object") {
            statusBarContext?.setUserActionData("Invalid payload: Must be a JSON ");
            return;
        }
        statusBarContext.setIsLoading(true);
        try {
            await axiosInterceptor(
                {
                    url: NODE.GetKebabMenuData,
                    data: {
                        entID: selectedReport.EntID,
                        entityName: selectedReport.EntityName,
                        kebabMenuTableName: "PG.FileProfile",
                    },

                    setFetchData: async (
                        getKebabMenuDataApiResponse: unknown,
                        stutus?: string
                    ) => {
                        try {
                            if (
                                stutus === "200" &&
                                (!getKebabMenuDataApiResponse ||
                                    typeof getKebabMenuDataApiResponse !== "object" ||
                                    !getKebabMenuDataApiResponse ||
                                    !("propertyJson" in getKebabMenuDataApiResponse))
                            ) {
                                statusBarContext?.setUserActionData(
                                    "File is not found for the selected report."
                                );
                                return;
                            }
                            const parsed = FnParseJsonSafely(
                                (getKebabMenuDataApiResponse as Record<string, any>)
                                    .propertyJson as string
                            );
                            const layoutArray = parsed?.["PG.FileProfile"];
                            if (!Array.isArray(layoutArray) || layoutArray.length === 0) {
                                statusBarContext?.setUserActionData(
                                    "Layout file profile data not found."
                                );
                                return;
                            }
                            const fileData = layoutArray[0];
                            statusBarContext.setIsLoading(true);
                            await axiosInterceptor(
                                {
                                    url: FS.GetFileStream,
                                    data: {
                                        entID: fileData.EntID,
                                        entityName: fileData.EntityName,
                                        fileCategory: fileData.FileCategory,
                                        fileName: fileData.DocName,
                                        fileExtension: fileData.FileExtension,
                                        fileUID: fileData.FileUID,
                                    },
                                    setFetchData: async (
                                        fileStreamApiResponse: unknown,
                                        status?: string
                                    ) => {
                                        try {
                                            if (
                                                status === "200" &&
                                                (typeof fileStreamApiResponse !== "object" ||
                                                    !fileStreamApiResponse ||
                                                    !("fileBlob" in fileStreamApiResponse) ||
                                                    !fileStreamApiResponse.fileBlob)
                                            ) {
                                                statusBarContext?.setUserActionData(
                                                    "File stream not available."
                                                );
                                                return;
                                            }
                                            const base64ToJson = (base64: string) =>
                                                JSON.parse(atob(base64));
                                            const json = base64ToJson(
                                                (fileStreamApiResponse as Record<string, any>)
                                                    .fileBlob as string
                                            );
                                            if (!json) {
                                                statusBarContext?.setUserActionData(
                                                    "Decoded file is empty or invalid."
                                                );
                                                return;
                                            }

                                            if (!ExportExcel) {
                                                statusBarContext.setIsLoading(true);
                                                const updatedConfig = await FnParseApiToInMemoryUrlJson(
                                                    json
                                                );
                                                setSelectedReport(selectedReport);
                                                setReportConfigContent(updatedConfig);
                                                statusBarContext.setIsLoading(false);
                                            } else {
                                                const apis = FnExtractApiValues(json, true);
                                                if (apis.length) {
                                                    const profiles = await FnGetApiProfiles(mainAppContext, statusBarContext);
                                                    const inmemoryUrls = await MakeApiCallsForMemoryURL(
                                                        apis,
                                                        profiles
                                                    );
                                                    const apiData = [];
                                                    for (
                                                        let index = 0;
                                                        index < inmemoryUrls.length;
                                                        index++
                                                    ) {
                                                        const element = inmemoryUrls[index];
                                                        const tableJson = await FnInMemoryUrlToJson(
                                                            element.memoryUrl as string
                                                        );
                                                        apiData.push({ [`${element.key}`]: tableJson });
                                                    }
                                                    exportMultipleDatatablesToExcel(apiData);
                                                } else {
                                                    statusBarContext?.setFetchError([
                                                        "Datatable not found.",
                                                    ]);
                                                }
                                            }
                                        } catch (error) {
                                            console.error("File stream processing error:", error);
                                            statusBarContext?.setFetchError([
                                                "Error reading layout file data.",
                                            ]);
                                        }
                                    },
                                },
                                statusBarContext
                            );
                        } catch (error) {
                            console.error("KebabMenu data parse error:", error);
                            statusBarContext?.setFetchError([
                                "Invalid response from kebab menu API.",
                            ]);
                        }
                    },
                },
                statusBarContext
            );
        } catch (error) {
            console.error("Payload parsing error:", error);
            statusBarContext?.setFetchError([
                "Failed to parse report profile payload.",
            ]);
        } finally {
            statusBarContext.setIsLoading(false);
        }
    };

    // Applies selected filter option to the enabled report list.
    const handleFilterSelect = (option: { uniqueName?: string }) => {
        try {
            if (!option?.uniqueName) return;
            try {
                setFilterValue((prev) =>
                    FnActivateOptionForReport(prev, option.uniqueName!)
                );
            } catch (filterError) {
                console.warn("Error updating filter value:", filterError);
            }
            const filterKey = option.uniqueName.toLowerCase();
            switch (filterKey) {
                case "all":
                    try {
                        setReportData(sortReportsAZ(reportDataOriginal
                            ? reportDataOriginal.filter((item) =>
                                !item?.EntityNames && !isDefaultReport(item)
                            )
                            : []));
                        setReportHeader(`Available Reports`);
                    } catch (allError) {
                        console.warn("Error in 'all' case:", allError);
                    }
                    break;
                case "selected node": {
                    try {
                        const nodeEntityName =
                            (selectedNodeContext?.selectedNodeExplorer ??
                                selectedNodeContext?.selectedNode)?.NodeEntityname;
                        if (nodeEntityName) {
                            setReportData(sortReportsAZ(
                                reportDataOriginal.filter((item) =>
                                    item?.EntityNames?.includes(nodeEntityName)
                                )
                            ));
                            setReportHeader(
                                `Available Reports for: ${nodeEntityName}`
                            );
                        } else {
                            setReportData(sortReportsAZ(
                                reportDataOriginal.filter((item) =>
                                    !item?.EntityNames && !isDefaultReport(item)
                                )
                            ));
                            setReportHeader(`Available Reports`);
                        }
                    } catch (nodeError) {
                        console.warn("Error in 'selected node' case:", nodeError);
                    }
                    break;
                }
                case "selected feature": {
                    try {
                        const featureName = sessionContext?.SessionList?.find(
                            (s) => s?.VariableName?.toLowerCase() === "featurename"
                        )?.SessionValue;
                        const filteredReports = featureName
                            ? reportDataOriginal.filter((item) =>
                                item?.GroupName?.includes(featureName) &&
                                !isDefaultReport(item)
                            )
                            : [];
                        if (filteredReports.length) {
                            setReportData(sortReportsAZ(filteredReports));
                            setReportHeader(`Available Reports: ${featureName}`);
                        } else {
                            const menuName = sessionContext?.SessionList?.find(
                                (s) => s?.VariableName?.toLowerCase() === "menuname"
                            )?.SessionValue;
                            const menuFilteredReports = menuName
                                ? reportDataOriginal.filter((item) =>
                                    item?.GroupName?.includes(menuName) &&
                                    !isDefaultReport(item)
                                )
                                : [];
                            setReportData(sortReportsAZ(menuFilteredReports));
                            setReportHeader(menuName ? `Available Reports: ${menuName}` : "Available Reports");
                        }
                    } catch (featureError) {
                        console.warn("Error in 'selected feature' case:", featureError);
                    }
                    break;
                }
                default:
                    try {
                        setReportData(sortReportsAZ(
                            reportDataOriginal.filter((item) => !isDefaultReport(item))
                        ));
                    } catch (defaultError) {
                        console.warn("Error in default case:", defaultError);
                    }
            }
            try {
                setSelectedFilter(option.uniqueName);
            } catch (selectionError) {
                console.warn("Error setting selected filter:", selectionError);
            }
        } catch (error) {
            console.error("Error in handleFilterSelect:", error);
        }
    };

    const handleClosePdfMaker = () => {
        setReportConfigContent(undefined);
        setSelectedReport(null);
        setSelectedReportId("");
        InMemoryUrlContext?.FnDestroyInMemoryUrls();
    };

    const shouldShowLoading = isLoadingReports || !isDataProcessed;
    const shouldShowNoData = !shouldShowLoading && reportData.length === 0;

    return (
        <div
            key={appqaReportProps.uniqueName}
            className="nz-appqa-report-container"
        >
            {reportConfigContent ? (
                <PdfMakerContainer
                    uniqueName={`${appqaReportProps.uniqueName}-pdf-maker`}
                    headerText={selectedReport?._ReportProfile || selectedReport?.Name || "Download Report"}
                    outputfilename={`${selectedReport?._ReportProfile || selectedReport?.Name || "report"}.pdf`}
                    pdfOutput={selectedReport?._ReportProfile || selectedReport?.Name || "report.pdf"}
                    config={updateLayoutWithSessionVars(reportConfigContent, getSessionVars)}
                    autoGenerate={true}
                    diagnosticLevel={diagnosticLevel}
                    onClose={handleClosePdfMaker}
                />
            ) : (
                <>
                    <div className="nz-sub-header">
                        {filterValue.length > 1 && (
                            <OptionsFilter
                                showIcon={true}
                                disableUncheck={true}
                                uniqueName={"app-qa-filter"}
                                container={"ap-filter"}
                                handleSelect={handleFilterSelect}
                                options={filterValue}
                            />
                        )}
                        <Label
                            uniqueName={`${appqaReportProps.uniqueName}-task-header`}
                            label={`${reportHeader}${reportData.length ? ` (${reportData.length})` : ""}`}
                        />
                    </div>
                    <div className="nz-appqa-report-content">
                        {shouldShowLoading ? (
                            <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>
                        ) : shouldShowNoData ? (
                            <div className="nz-wh-100 nz-d-flex-hv-left">No Data Found</div>
                        ) : (
                            reportData.map((report, index) => (
                                <CardLayout
                                    key={index}
                                    uniqueName={`${appqaReportProps.uniqueName}-report-${index}`}
                                    className={`nz-report-card${report.OutputFormat !== "excel" ? " nz-clickable-report" : ""
                                        } ${report.IsTemplate ? "nz-template-report" : ""} ${report.IsDeprecated ? "nz-deprecated-report" : ""
                                        }`}
                                    data={report}
                                    fields={buildReportCardFields(report)}
                                    isSelected={selectedReportId === report.EntID}
                                    hideRightMouseMenu={true}
                                    onClick={(event) => {
                                        if (
                                            (event.target as HTMLElement).closest(".nz-excel-icon-wrapper")
                                        ) {
                                            return;
                                        }
                                        setSelectedReport(report);
                                        setSelectedReportId(report.EntID);
                                        handleClickDownloadPdf(event, report);
                                    }}
                                    ContentImage={{
                                        uniqueName: `${appqaReportProps.uniqueName}-reporti-${index}`,
                                        source: (
                                            <Report24x24
                                                size={FnGetCssVariable("--image-size-2")}
                                                fill="none"
                                                strokeWidth={1}
                                            />
                                        ),
                                        w: "var(--image-size-2)",
                                        tooltip: report._ReportProfile,
                                        type: "svg",
                                    }}
                                    renderForm={
                                        report.OutputFormat === "excel" ? (
                                            <div className="nz-excel-icon-wrapper">
                                                <OverlayTab
                                                    uniqueName={`${appqaReportProps.uniqueName}-replacement-overlay`}
                                                    ShowOnlyIcon={true}
                                                    hideDrager={true}
                                                    tabs={[
                                                        {
                                                            uniqueName: `${appqaReportProps.uniqueName}-overlay-tab-${index}`,
                                                            label: {
                                                                uniqueName: `${appqaReportProps.uniqueName}-overlay-tab-${index}-label`,
                                                                label: "Excel",
                                                                tooltip: "Save as Excel",
                                                            },
                                                            w: "auto",
                                                            h: "calc(var(--node_height) - var(--spacing-1))",
                                                            actionCode: "Excel",
                                                            handleMouse: function (
                                                                event: any,
                                                                actionCode?: string
                                                            ): void { },
                                                        },
                                                    ]}
                                                    allowUnSelect={true}
                                                    selectedTabName={""}
                                                    tabAlignment={"horizontal"}
                                                    useContainer={false}
                                                    handleSelectedTab={() => {
                                                        handleClickSaveAsExcel(JSON.stringify(report));
                                                    }}
                                                    headerText={""}
                                                />
                                            </div>
                                        ) : null
                                    }
                                />
                            ))
                        )}
                    </div>
                </>
            )}
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={appqaReportProps.uniqueName + "confirmbox"}
                message={confirmMessage}
                showOkButton={true}
                handleOkButtonClick={() => {
                    setIsConfirmOpen(false);
                }}
            />
        </div>
    );
};
export default AppqaReport;

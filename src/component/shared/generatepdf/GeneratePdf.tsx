import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@mui/material";
import { useAgent } from "@n20a/libmcpclient";
import { updateLayoutWithSessionVars } from "@n20a/libreport";
import { Close24x24 } from "@n20a/libicon";
import "../allcss/generatepdf/GeneratePdf.css";
import "@n20a/libreport/style.css";
import { FnGetCssVariable } from "../../appcontainer/allcommon/FnGetCssVariable";
import { FnGetApiProfiles } from "../allcommon/FnGetApiProfiles";
import { useChartProfileContext } from "../context/hooks/ChartProfileHooks";
import { useCommonVariableContext } from "../context/hooks/CommonVariableHooks";
import { useInMemoryUrlContext } from "../context/hooks/InMemoryUrlHooks";
import { useMainAppContext } from "../context/hooks/MainAppHooks";
import { useSelectedNodeContext } from "../context/hooks/SelectedNodeHooks";
import { useSessionContext } from "../context/hooks/SessionHooks";
import { useStatusBarContext } from "../context/hooks/StatusBarHooks";
import { ActionImage } from "../basic/actionimage/ActionImage";
import { Label } from "../basic/label/Label";
import { IGeneratePdf } from "../allinterface/IGeneratePdf";
import { FnResolvedMemoryUrlsofReport } from "../allcommon/generatepdf/FnResolvedMemoryUrlsofReport";
import PdfMakerContainer from "../pdfmakercontainer/PdfMakerContainer";
import { FnGetEnvVariableByKey } from "../../appcontainer/allcommon/FnGetEnvVariableByKey";
import { envVarEnums } from "../../appcontainer/alldefaultprops/DefaultPropsAppContainer";

/** Evaluates a layout label formula against session/context values. */
const evaluateFormulaSafe = (formula: string, context: Record<string, unknown>): string => {
    try {
        const fn = new Function(...Object.keys(context), `return (${formula});`);
        const result = fn(...Object.values(context));
        return String(result);
    } catch (err) {
        console.warn("Formula error:", formula, err);
        return "#ERR";
    }
};

/** Traverses layout JSON and resolves formula labels plus field name conversions. */
const traverseAndEvaluateLabelsSafe = async (
    node: unknown,
    context: Record<string, unknown> = {}
): Promise<unknown> => {
    if (typeof node !== "object" || node === null) {
        return node;
    }

    const safeNode: Record<string, unknown> = { ...(node as Record<string, unknown>) };

    if (typeof safeNode.label === "string" && safeNode.label.trim().startsWith("=")) {
        const formula = safeNode.label.trim().substring(1);
        safeNode.label = evaluateFormulaSafe(formula, context);
    }

    for (const key in safeNode) {
        const value = safeNode[key];

        if (key === "EntID") {
            safeNode.id = safeNode.EntID;
            delete safeNode.EntID;
        }
        if (key === "Name") {
            safeNode.name = safeNode.Name;
            delete safeNode.Name;
        }
        if (key === "w" || key === "h" || key === "px" || key === "py") {
            const num = Number(value);
            safeNode[key] = Number.isNaN(num) ? 0 : num;
        } else if (Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null)) {
            safeNode[key] = await Promise.all(
                value.map((item) => traverseAndEvaluateLabelsSafe(item, context))
            );
        }
    }

    return safeNode;
};

/** Normalizes legacy layout header/footer/page array shapes for PdfMaker. */
const normalizeLayoutNode = (node: Record<string, unknown>): Record<string, unknown> => {
    const safeNode = { ...node };

    if ((safeNode.NodeType as string)?.toLowerCase() === "layout") {
        if (Array.isArray(safeNode.header)) {
            safeNode.header = Object.assign({}, ...safeNode.header);
        }
        if (Array.isArray(safeNode.footer)) {
            safeNode.footer = Object.assign({}, ...safeNode.footer);
        }
        if (Array.isArray(safeNode.page)) {
            safeNode.page = Object.assign({}, ...safeNode.page);
        }
    }

    return safeNode;
};

/** Builds report layout JSON with resolved in-memory URLs for PdfMaker. */
const GeneratePdf = (props: IGeneratePdf) => {
    const [dialogContent, setDialogContent] = useState<any>();
    const [diagnosticLevel, setDiagnosticLevel] = useState<number>(1);
    const [isProcessing, setIsProcessing] = useState(false);

    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext();
    const chartProfileContext = useChartProfileContext();
    const selectedNodeContext = useSelectedNodeContext();
    const commonVariableContext = useCommonVariableContext();
    const inMemoryUrlContext = useInMemoryUrlContext();
    const mainAppContext = useMainAppContext();
    const { sendPrompt } = useAgent();

    const getSessionVars = useCallback((): Record<string, unknown> => {
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
            workorder: selectedNodeContext.selectedWorkorderRecord,
            sessionid: statusBarContext.userSessionId,
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
    }, [sessionContext?.SessionList, selectedNodeContext.selectedWorkorderRecord, mainAppContext.apRecords, selectedNodeContext.selectedNodeProperty, statusBarContext.userSessionId]);

    const processReportJson = useCallback(
        async (reportJson: Record<string, unknown>) => {
            setIsProcessing(true);
            statusBarContext?.setIsLoading?.(true);

            try {
                const objectData = Object.fromEntries(
                    (sessionContext?.SessionList ?? []).map((item) => [
                        item.VariableName,
                        item.SessionValue,
                    ])
                );

                // Prefer cached ApiProfile records; fetch _ApiProfile only when missing.
                const apiProfiles = await FnGetApiProfiles(mainAppContext, statusBarContext);

                // Resolve all layout API entries into in-memory URLs and return full JSON.
                const resolvedJson = await FnResolvedMemoryUrlsofReport({
                    reportJson,
                    apiProfiles,
                    inMemoryUrlContext,
                    statusBarContext,
                    chartProfileContext,
                    sessionContext,
                    sendPrompt,
                    selectedNode: props.selectedNode ?? selectedNodeContext.selectedNode,
                    featureId: props.featureId,
                    selectedNodeContext
                });

                const updatedJson = await traverseAndEvaluateLabelsSafe(resolvedJson, objectData);
                if (typeof updatedJson === "object" && updatedJson) {
                    setDialogContent(
                        normalizeLayoutNode(updatedJson as Record<string, unknown>)
                    );
                }
            } catch (error) {
                console.error("GeneratePdf processReportJson error:", error);
                statusBarContext?.setFetchError?.(["Failed to prepare report for PDF."]);
            } finally {
                setIsProcessing(false);
                statusBarContext?.setIsLoading?.(false);
            }
        },
        [
            chartProfileContext,
            inMemoryUrlContext,
            mainAppContext,
            props.featureId,
            props.selectedNode,
            selectedNodeContext.selectedNode,
            sendPrompt,
            sessionContext.setSessionList,
        ]
    );

    useEffect(() => {
        if (commonVariableContext.diagnosticLevel?.toString() === "0") {
            setDiagnosticLevel(0);
        }
    }, [commonVariableContext.diagnosticLevel]);

    const processReportJsonRef = useRef(processReportJson);
    processReportJsonRef.current = processReportJson;

    useEffect(() => {
        if (!props.isOpen || !props.reportJson) {
            return;
        }

        setDialogContent(undefined);
        void processReportJsonRef.current(props.reportJson);
    }, [props.isOpen, props.reportJson]);

    const handleClose = () => {
        setDialogContent(undefined);
        inMemoryUrlContext?.FnDestroyInMemoryUrls?.();
        props.onClose();
    };

    if (!props.isOpen) {
        return null;
    }

    return (
        <Dialog
            open={props.isOpen}
            container={props.container}
            className="nz-dialog-container nz-generatePdf-dialog"
            maxWidth={false}
            hideBackdrop
            style={{ zIndex: 9999 }}
        >
            <DialogContent
                className={!dialogContent || isProcessing ? "nz-generatePdf-dialog-loading" : undefined}
                style={{ padding: 0, width: "100%", height: "100%", overflow: "hidden" }}
            >
                {!dialogContent || isProcessing ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            className="nz-sub-header nz-d-flex-row nz-justify-between nz-align-center"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <Label
                                uniqueName={`${props.uniqueName}-dialog-title`}
                                label={props.title ?? "Download Report"}
                                fontWeight="bold"
                            />
                            <ActionImage
                                handleMouse={handleClose}
                                image={{
                                    uniqueName: `${props.uniqueName}-i-close`,
                                    source: (
                                        <Close24x24
                                            size={FnGetCssVariable("--image-size-2")}
                                            fill="none"
                                            strokeWidth={1}
                                        />
                                    ),
                                    type: "svg",
                                    w: "var(--image-size-2)",
                                    h: "var(--image-size-2)",
                                    tooltip: "Close",
                                }}
                                uniqueName={`${props.uniqueName}-ai-close`}
                                actionCode="cancel"
                                w="var(--node_height)"
                                h="var(--node_height)"
                            />
                        </div>
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span className="nz-generatePdf-status">
                                {isProcessing ? "Loading..." : "Report not available."}
                            </span>
                        </div>
                    </div>
                ) : (
                    <PdfMakerContainer
                        uniqueName={`${props.uniqueName}-pdf-maker`}
                        headerText={props.title ?? "Download Report"}
                        outputfilename={`${props.title ?? "report"}.pdf`}
                        pdfOutput={props.title ?? "report.pdf"}
                        config={updateLayoutWithSessionVars(dialogContent, getSessionVars)}
                        autoGenerate={true}
                        diagnosticLevel={diagnosticLevel}
                        onClose={handleClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export { GeneratePdf };

/*
  PowerBiReport.tsx
  Component to embed and display a Power BI report using the Power BI JavaScript client library.
  Handles embedding, loading, rendering, and error events.
*/

import { useEffect, useRef, useState, useCallback } from "react";
import { models, service, Report } from "powerbi-client";
import type { IPowerBIReportProps } from "../../allinterface/home/IPowerBIReportProps";

type PowerBIErrorEvent = {
  detail?: {
    message?: string;
  } | string;
};

const PowerBiReport = ({
  embedUrl,
  embedToken,
  reportId,
  reportName,
  workspaceId,
}: IPowerBIReportProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const embeddedReportRef = useRef<Report | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setEmbedError = useCallback((message: string) => {
    setError(message);
    setIsLoading(false);
    console.error(message);
  }, []);

  const handleError = useCallback((event?: PowerBIErrorEvent) => {
    const errorMessage =
      typeof event?.detail === "string"
        ? event.detail
        : event?.detail?.message ||
        "Unknown error occurred while embedding report.";

    setError(errorMessage);
    setIsLoading(false);

    console.error("Power BI embed error:", event?.detail ?? event);
  }, []);

  const handleLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setError(null);
    setIsLoading(true);

    if (!embedUrl) {
      setEmbedError("Embed URL is missing.");
      return;
    }

    if (!embedToken) {
      setEmbedError("Embed token is missing.");
      return;
    }

    if (!reportId || !workspaceId) {
      setEmbedError("Report ID or Workspace ID is missing.");
      return;
    }

    const container = reportRef.current;

    if (!container) {
      setEmbedError("Report container not found.");
      return;
    }

    const powerbi = (window as typeof window & {
      powerbi?: service.Service;
    }).powerbi;

    if (!powerbi) {
      setEmbedError("Power BI client library not loaded.");
      return;
    }

    powerbi.reset(container);

    const reportConfig: models.IReportEmbedConfiguration = {
      type: "report",
      tokenType: models.TokenType.Embed,
      id: reportId,
      embedUrl,
      accessToken: embedToken,
      groupId: workspaceId,
      settings: {
        panes: {
          filters: { visible: false },
          pageNavigation: { visible: true },
        },
        layoutType: models.LayoutType.Custom,
        customLayout: {
          displayOption: models.DisplayOption.FitToWidth,
        },
      },
    };

    try {
      if (import.meta.env.DEV) {
        console.log(`Embedding report: ${reportName} (ID: ${reportId})`);
      }

      const report = powerbi.embed(container, reportConfig) as Report;

      embeddedReportRef.current = report;

      report.on("error", handleError);
      report.on("loaded", handleLoaded);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to embed Power BI report.";

      setError(errorMessage);
      setIsLoading(false);

      console.error("Failed to embed Power BI report:", err);
    }

    return () => {
      const report = embeddedReportRef.current;

      if (report) {
        try {
          report.off("error");
          report.off("loaded");

          embeddedReportRef.current = null;
        } catch (err) {
          console.warn("Error during report cleanup:", err);
        }
      }

      try {
        powerbi.reset(container);
      } catch (err) {
        console.warn("Error resetting Power BI container:", err);
      }
    };
  }, [
    embedUrl,
    embedToken,
    reportId,
    reportName,
    workspaceId,
    handleError,
    handleLoaded,
    setEmbedError,
  ]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {error && (
        <div
          role="alert"
          style={{
            color: "#dc2626",
            fontWeight: 600,
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "4px",
            marginBottom: "8px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {isLoading && !error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          Loading Power BI report...
        </div>
      )}

      <div
        ref={reportRef}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "600px",
        }}
      />
    </div>
  );
};

export { PowerBiReport };
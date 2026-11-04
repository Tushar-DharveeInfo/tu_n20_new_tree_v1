import { AgentType } from "@n20a/libmcpclient";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

/**
 * Convert markdown string to a Blob and return in-memory URL.
 */
function mdStringToMemoryUrl(mdString: string): string {
  try {
    // Validate input
    if (typeof mdString !== "string") {
      console.error("mdStringToMemoryUrl: Input must be a string");
      return "";
    }

    if (!mdString.trim()) {
      console.warn("mdStringToMemoryUrl: Empty markdown string");
      return "";
    }

    // Step 1: Create Blob safely
    let blob: Blob;
    try {
      blob = new Blob([mdString], { type: "text/markdown" });
    } catch (blobError) {
      console.error("Failed to create Blob:", blobError);
      return "";
    }

    // Step 2: Create URL safely
    let url: string;
    try {
      url = URL.createObjectURL(blob);
    } catch (urlError) {
      console.error("Failed to create object URL:", urlError);
      return "";
    }

    return url;
  } catch (error) {
    console.error("Unexpected error in mdStringToMemoryUrl:", error);
    return "";
  }
}


export const FnCreateSvgMemoryUrlFromMarkdown = async (
  questionText: string,
  apiKey: string,
  AgentType: AgentType,
  sendPrompt: any
) => {
  try {
    // Basic validation
    if (!questionText || !apiKey || !AgentType || typeof sendPrompt !== "function") {
      return;
    }

    const response = await sendPrompt(AgentType, questionText, apiKey);

    if (response?.error) {
      return response.error;
    }

    if (!response || !response.content) {
      return;
    }

    const url = mdStringToMemoryUrl(response.content);

    return url;

  } catch (error) {
    console.error("FnCreateSvgMemoryUrlFromMarkdown error:", error);
    return;
  }
};
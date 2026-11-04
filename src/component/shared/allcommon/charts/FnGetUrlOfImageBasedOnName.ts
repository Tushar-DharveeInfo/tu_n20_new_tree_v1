
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FnResolveIcons } from "../menu/FnResolveIcons";

function svgStringToPngUrl(svgString: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            const svgBlob = new Blob([svgString], {
                type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const width = img.width || 300;
                const height = img.height || 300;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject("Canvas not supported");
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                //  PNG URL (NOT SVG, NOT blob)
                const pngUrl = canvas.toDataURL("image/png");
                URL.revokeObjectURL(url);
                resolve(pngUrl);
            };
            img.onerror = reject;
            img.src = url;
        } catch (error) {
            console.error(
                "svgStringToPngUrl error:",
                error
            );
            reject(error);
        }
    });
}

const FnGetUrlOfImageBasedOnName = async (fileName: string): Promise<string | null> => {
    try {
        const resolveIcon =
            FnResolveIcons();
        const Component =
            resolveIcon(fileName);
        if (!Component) {
            return null;
        }
        const element =
            React.createElement(
                Component
            );
        const svgString =
            renderToStaticMarkup(
                element
            );
        return await svgStringToPngUrl(
            svgString
        );
    } catch (error) {
        console.error(
            "Error in generate icon memory url:",
            error
        );
        return null;
    }
};
export { FnGetUrlOfImageBasedOnName }

interface ITitleLogoWithTagline {
    uniqueName: string;
    logoImageSource: string;
    logoFallbackSrc: string;
    logoImageTooltip?: string;
    redirectUrl?: string;
    tagLineContent?: string;
}

export type { ITitleLogoWithTagline }
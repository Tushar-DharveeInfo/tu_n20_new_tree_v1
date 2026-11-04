
import { ICol } from '@n20a/liblayout';
import { FnGenerateUniqueId } from '../../shared/allcommon/basic/FnGenerateUniqueId';
import { DataTable, ImageObject, inchesToPixels, layoutConfig, Location, MarkdownObject, TextObject, IRect } from "@n20a/libreport";

const defaultRect = (newtype: string, newname: string, newpx?: number, newpy?: number, w?: number, h?: number): IRect => {
    return ({
        update: false,
        parentId: "",

        id: FnGenerateUniqueId() as string,  // unique identifier for the control
        type: newtype, // can be text|image|table|chart|hspace|vspace 
        name: newname,
        description: "",
        x: newpx || 0,
        y: newpy || 0,
        w: w || 3, //px
        h: h || 5, //px
        rotation: 0,
        background: "transparent", // e.g. #ffffff, rgb(255,255,255), rgba(255,255,255,1)
        border: {
            bordercolor: 'black',
            borderpx: 1,
            borderstyle: 'solid'
        },
        opacity: 1,
        zIndex: 0,
        ishidden: false,
        isLocked: false,
        isSelected: false,
        isDraggable: true,
        isResizable: true,
        isRotatable: true,
        isCloneable: true,
        isDeletable: true
    });
}

const defaultCol: ICol =
{
    id: FnGenerateUniqueId() as string, // unique identifier for the column
    colName: "Column",
    colWidth: 100,
    colWrap: true,
    textAlign: "left",
    font: {
        fontfamily: "Calibri",
        fontsize: 8,
        fontstyle: "normal",
        fontcolor: "black",
    }
};


const defaultText = (newtype: string, newname: string, newpx: number, newpy: number): TextObject => {
    const basic = defaultRect(newtype, newname, newpx, newpy, 150, 30);
    return {
        ...basic,
        label: "Test Label",
        textalign: "left",
        font: {
            fontfamily: "Arial, Helvetica, sans-serif",
            fontsize: 12, // px
            fontweight: "normal", // normal, bold, bolder, lighter
            fontstyle: "normal", // normal, italic, oblique
            fontcolor: "#000000", // e.g. #000000, rgb(0,0,0), rgba(0,0,0,1)
        }
    };
}

const defaultImage = (newtype: string, newname: string, newpx: number, newpy: number, apiName?: string): ImageObject => {
    const basic = defaultRect(newtype, newname, newpx, newpy, 40, 40);
    return {
        ...basic,
        format: "PNG",
        api: undefined,
        inmemoryUrl: ""
    };
}

const defaultDataTable = (newtype: string, newname: string, newpx: number, newpy: number): DataTable => {
    const basic = defaultRect(newtype, newname, newpx, newpy, 400, 150);
    return {
        ...basic,
        api: undefined,
        inmemoryUrl: "",
        tableData: []
    };
}

const defaultChart = (newtype: string, newname: string, newpx: number, newpy: number): ImageObject => {
    const basic = defaultRect(newtype, newname, newpx, newpy, 60, 60);
    return {
        ...basic,
        format: "PNG",
        api: undefined,
        inmemoryUrl: "",
    };
}

// true for vertical space, false for horizontal space
const defaultSpace = (newtype: string, newname: string, newpx: number, newpy: number): ImageObject => {
    const basic = defaultRect(newtype, newname, newpx, newpy, 60, 60);
    return {
        ...basic,
        api: undefined,
        inmemoryUrl: "",
    };
}


const defaultHeader = (newtype: string, newname: string, newpx: number, newpy: number, parentId: string, isLandscape: boolean): Location => {

    return {
        update: false,
        parentId: parentId,
        id: FnGenerateUniqueId() as string,
        type: newtype,
        name: newname,
        description: "Reserved header location",
        x: 0,
        y: 0,
        w: isLandscape ? inchesToPixels(11.7) : inchesToPixels(8.3),
        h: isLandscape ? 40 : 80,
        rotation: 0,
        background: 'transparent',
        border: {
            borderpx: 1,
            bordercolor: '#000000',
            borderstyle: 'solid'
        },
        opacity: 1,
        zIndex: 0,
        ishidden: false,
        isLocked: false,
        isSelected: false,
        isDraggable: false,
        isResizable: true,
        isRotatable: false,
        align: "left",
        entityName: "location",
        entId: "header-reserved"
    };
}

const defaultFooter = (newtype: string, newname: string, newpx: number, newpy: number, parentId: string, isLandscape: boolean): Location => {
    return {
        update: false,
        parentId: parentId,
        id: FnGenerateUniqueId() as string,
        type: newtype,
        name: newname,
        description: "Reserved footer location",
        x: 0,
        y: 870,
        w: isLandscape ? inchesToPixels(11.7) : inchesToPixels(8.3),
        h: isLandscape ? 40 : 80,
        rotation: 0,
        background: 'transparent',
        border: {
            borderpx: 1,
            bordercolor: '#000000',
            borderstyle: 'solid'
        },
        opacity: 1,
        zIndex: 0,
        ishidden: false,
        isLocked: false,
        isSelected: false,
        isDraggable: false,
        isResizable: true,
        isRotatable: false,
        align: "left",
        entityName: "location",
        entId: "footer-reserved"
    };
}

const defaultPage = (newtype: string, newname: string, newpx: number, newpy: number, parentId: string, isLandscape: boolean): Location => {
    return {
        update: false,
        parentId: parentId,
        id: FnGenerateUniqueId() as string,
        type: newtype,
        name: newname,
        description: "Reserved page location",
        x: 0,
        y: 82,
        w: isLandscape ? inchesToPixels(11.7) : inchesToPixels(8.3),
        h: isLandscape ? 100 : 788,
        rotation: 0,
        background: 'transparent',
        border: {
            borderpx: 1,
            bordercolor: '#000000',
            borderstyle: 'solid'
        },
        opacity: 1,
        zIndex: 0,
        ishidden: false,
        isLocked: false,
        isSelected: false,
        isDraggable: false,
        isResizable: true,
        isRotatable: false,
        align: "left",
        entityName: "location",
        entId: "page-reserved",

    };
}

const defaultLayout = (newtype: string, newname: string, newpx: number, newpy: number, isLandscape: boolean = false): layoutConfig => {
    //newname is received as variable to match the name of the floor name
    const id = FnGenerateUniqueId() as string;
    const header = defaultHeader("header", "Header", 0, 0, id, isLandscape);
    const footer = defaultFooter("footer", "Footer", 0, 0, id, isLandscape);
    const page = defaultPage("page", "Page", 0, 0, id, isLandscape);
    return {

        id: id, // unique identifier for the control
        type: newtype, // can be text|image|table|chart|hspace|vspace 
        name: newname || "Main Page",
        description: "Primary page containing all locations",
        x: newpx || 0,
        y: newpy || 0,
        w: isLandscape ? inchesToPixels(11.7) : inchesToPixels(8.3),
        h: isLandscape ? inchesToPixels(8.3) : inchesToPixels(11.7), // px

        fillcolor: "",
        entId: "page-1",
        RulerSize: 30,
        crosshair: true,
        majorGrid: false,
        minorGrid: true,
        locationArray: [header, page, footer],
        pageWidthInches: 0,
        pageHeightInches: 0,
        marginTopInches: 0,
        marginBottomInches: 0,
        marginLeftInches: 0,
        marginRightInches: 0,
        DPI: 0,
    };
};

const defaultColumn = (isCustom: boolean, newname: string): ICol => {

    return {
        ...defaultCol, id: FnGenerateUniqueId() as string, colName: newname, colWidth: 100, custom: isCustom ? "" : undefined
    } as ICol;
}

const defaultMarkdown = (newtype: string, newname: string, newpx: number, newpy: number): MarkdownObject => {
    const basic = defaultRect(newtype, newname, newpx, newpy, 60, 60);
    return {
        ...basic,

    };
}
export { defaultText, defaultImage, defaultDataTable, defaultChart, defaultSpace, defaultHeader, defaultFooter, defaultPage, defaultLayout, defaultColumn, defaultMarkdown };


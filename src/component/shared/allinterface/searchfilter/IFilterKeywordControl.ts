

interface IFilterKeywordControl {
    uniqueName: string; // unique name of control
    filterDirty: boolean;// if true then change background color of filter icon
    searchInputValue: string; // search input text
    filterIconTooltip?: string;
    searchValueChange: (value: string) => void;// to pass input value of parent control.
    handleFilterMouse: () => void; // handle mouse event for filter
}

export type { IFilterKeywordControl }
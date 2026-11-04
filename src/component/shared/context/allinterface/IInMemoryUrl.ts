
interface IMemoryUrlItem {
    key: string;
    memoryUrl: string;
}

interface IInMemoryUrl {
    InMemoryUrlRecords: IMemoryUrlItem[];
    setInMemoryUrlRecords: (data: IMemoryUrlItem[]) => void;
    FnDestroyInMemoryUrls: (keys?: IMemoryUrlItem[]) => void;
}

export type { IInMemoryUrl, IMemoryUrlItem }
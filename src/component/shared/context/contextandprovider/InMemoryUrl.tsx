import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IInMemoryUrl, IMemoryUrlItem } from "../allinterface/IInMemoryUrl";
import { FnDestroyInMemoryUrl } from "../../allcommon/basic/FnDestroyInMemoryUrl";

// Create context
const InMemoryUrlContext = createContext<IInMemoryUrl | undefined>(undefined);

function InMemoryUrlProvider({ children }: IAppContextWrapper) {

    const [InMemoryUrlRecords, setInMemoryUrlRecords] = useState<IMemoryUrlItem[]>([]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const FnDestroyInMemoryUrls = useCallback((items?: IMemoryUrlItem[]) => {
        // Cancel previous timeout to prevent race conditions
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setInMemoryUrlRecords(currentRecords => {
                if (items && items.length > 0) {
                    const itemSet = new Set(items.map(i => i.key));
                    const remainingRecords = currentRecords.filter(record => {
                        if (itemSet.has(record.key)) {
                            FnDestroyInMemoryUrl(record.memoryUrl);
                            return false;
                        }
                        return true;
                    });

                    return remainingRecords;
                } else {
                    // Destroy all URLs
                    currentRecords.forEach(item => {
                        FnDestroyInMemoryUrl(item.memoryUrl);
                    });
                    return [];
                }
            });
        }, 2000);
    }, []);

    const contextValue: IInMemoryUrl = useMemo(
        () => ({
            InMemoryUrlRecords,
            setInMemoryUrlRecords,
            FnDestroyInMemoryUrls,
        }),
        [InMemoryUrlRecords, FnDestroyInMemoryUrls]
    );

    return (
        <InMemoryUrlContext.Provider value={contextValue}>
            {children}
        </InMemoryUrlContext.Provider>
    );
}

export { InMemoryUrlContext, InMemoryUrlProvider };

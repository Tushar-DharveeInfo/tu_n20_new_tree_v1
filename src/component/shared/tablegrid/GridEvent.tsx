
import { AppQA } from "../../constants/Feature";
import { FnCopyToClipboard } from "../allcommon/basic/FnCopyToClipboard";
import { IBasicGrid } from "../allinterface/tablegrid/IBasicGrid";
import { CellClickedEvent, CellMouseDownEvent, GridApi, GridReadyEvent, RowClickedEvent } from "ag-grid-community";

const deferGridTask = (task: () => void, delayMs: number): ReturnType<typeof setTimeout> =>
    setTimeout(task, delayMs);

// after rending component this function will call
const onGridReady = (params: GridReadyEvent, props: IBasicGrid) => {


    if (props.containerName === "nz_forcensic_log" && props.featureId && props.featureId !== AppQA.Settings) {
        deferGridTask(() => {

            const sidebarContainer: HTMLElement | null = document.querySelector('.nz-qa-sidebar-container');
            if (sidebarContainer) {
                // Select all AG Grids inside the sidebar only
                const gridPanelsInSidebar = sidebarContainer.querySelectorAll('.nz-qa-sidebar-container .ag-paging-panel');

                gridPanelsInSidebar.forEach((panel) => {
                    const recordCount = panel.querySelector('.custom-record-count') as HTMLElement;
                    const summaryPanel = panel.querySelector('.ag-paging-row-summary-panel') as HTMLElement;

                    const width = panel.getBoundingClientRect().width;

                    if (recordCount) {
                        recordCount.style.display = width < 475 ? 'none' : 'inline-block';
                    }
                    if (summaryPanel) {
                        summaryPanel.style.display = width < 375 ? 'none' : 'inline-block';
                    }
                });
            }
        }, 500);

    }

    if (props?.allowAutoSizeColumn) {
        // Initial auto-size when grid is ready
        if (props.instanceName == "CablingGrid") {
            params.api.deselectAll();
            if (props.id === 'cabling-last-grid') {
                deferGridTask(() => {
                    const cablingDiv = document.querySelectorAll('.nz-cabling-div .ag-row-focus')
                    const cablingDivHighlightedGrids = document.querySelectorAll('.nz-cabling-div .nz-highlight-header')
                    const cablingDivLastGridHeader = document.querySelector('#cabling-last-grid .ag-header')
                    if (cablingDivHighlightedGrids) {
                        cablingDivHighlightedGrids.forEach(row => {
                            row.classList.remove('nz-highlight-header');
                        });
                    }
                    if (cablingDivLastGridHeader) {
                        cablingDivLastGridHeader.classList.add('nz-highlight-header');
                    }
                    if (cablingDiv) {
                        cablingDiv.forEach(row => {
                            row.classList.remove('ag-row-focus');
                        });
                    }

                    const firstRow = params.api.getDisplayedRowAtIndex(0);
                    if (firstRow) {
                        firstRow.setSelected(true); // Select it
                        params.api.ensureIndexVisible(0); // Scroll to first row
                        params.api.setFocusedCell(0, params.api.getAllDisplayedColumns()[0].getColId());
                    }
                }, 100); // 100ms delay helps with async rowData
            }
            function autoSizeHtmlColumn(params: any, colId: string) {
                const { api } = params;

                const cellEls = document.querySelectorAll(`.ag-cell[col-id="${colId}"]`);
                let maxWidth = 0;

                cellEls.forEach(cell => {
                    // Find the innermost value-containing element
                    const valueEl = cell.querySelector('span[title]') || cell.querySelector('span.ag-cell-value span:last-child') || cell;

                    const computedStyle = getComputedStyle(valueEl);
                    const width = valueEl.scrollWidth +
                        parseInt(computedStyle.marginLeft) +
                        parseInt(computedStyle.marginRight);

                    if (width > maxWidth) {
                        maxWidth = width;
                    }
                });

                if (maxWidth > 0) {
                    api?.setColumnWidth && api?.setColumnWidth(colId, maxWidth + 24); // add padding to avoid clipping
                }
            }

            const colIds: string[] = params.api?.getAllGridColumns().filter((col: any) => {
                const colDef = col.getColDef();
                return (
                    !colDef.flex &&
                    // Non-empty header name (you mentioned this)
                    colDef.headerName !== '' &&
                    // Not hidden (you mentioned this)
                    !colDef.hide
                );

            }).map(c => c.getColId());
            deferGridTask(() => {
                for (let index = 0; index < colIds.length; index++) {
                    const element = colIds[index];
                    autoSizeHtmlColumn(params, element);
                }
                params.api?.refreshHeader?.();
            }, 200);
        }
    }
    else {
        document.getElementById('gc-app-para')?.classList.remove('hidden');
    }

    if (props.instanceName === 'cabling-navigation') {
        deferGridTask(() => {
            if (props.id == 'cabling-navigation0') {
                const gridContainer = document.querySelector('#cabling-navigation-other-grid') ||
                    document.querySelector('.ag-center-cols-container');

                if (gridContainer) {
                    // Remove row focus from all rows
                    const focusedRows = gridContainer.querySelectorAll('.ag-row-focus');
                    focusedRows.forEach(row => row.classList.remove('ag-row-focus'));

                    // Remove cell focus from all cells
                    const focusedCells = gridContainer.querySelectorAll('.ag-cell-focus');
                    focusedCells.forEach(cell => cell.classList.remove('ag-cell-focus'));
                }
            }
            if (props.rowData.length === 1) {
                const cablingDiv = document.querySelector(`#${props.id} .ag-center-cols-container .ag-column-last`)
                if (cablingDiv) {
                    cablingDiv.classList.add('nz-cabling-navigation-cell-highlight');
                    cablingDiv.classList.add('ag-row-focus');
                }
            }
        }, 2000);
    }


    const headerElement = document.querySelector('.nz-jsonPropertyGrid .ag-pinned-left-header');
    const addButton = document.querySelector('.nz-swapgrid-addbtn') as HTMLElement | null;
    if (headerElement && addButton) {
        const rect = headerElement.getBoundingClientRect();
        addButton.style.left = `${(rect.right - rect.left) / 2}px`;
    }

    // Ensure all grid containers are visible
    document.querySelectorAll('.nz-ag-container').forEach(el => {
        (el as HTMLDivElement).style.display = 'block';
    });
    deferGridTask(() => {
        hideShowPaginatation(props)
    }, 200);
}


let isHandlingClick = false
// when cell is clicked
const handleMouseEvent = async (event: CellClickedEvent | RowClickedEvent | CellMouseDownEvent, gridRef: any, props: IBasicGrid) => {

    if (event.type === 'cellClicked') {
        if (isHandlingClick) return;
        isHandlingClick = true;
        let pointerEvent = null
        try {
            if (
                props?.instanceName === "CablingGrid" ||
                props?.instanceName === "cabling-navigation" ||
                props?.instanceName === "PatchPanelGrid" ||
                props?.instanceName === "open_session"
            ) {

                if (props?.onCellClicked)
                    props?.onCellClicked(event, gridRef);
            } else {
                pointerEvent = event.event;

                const observePopupEditor = () => {
                    const popupEditor = document.querySelector(`div[data-key*="${props.uniqueName}"] .ag-popup-editor`) as HTMLDivElement;
                    const cellEditor = document.querySelector(`div[data-key*="${props.uniqueName}"] .ag-cell-popup-editing`) as HTMLDivElement;
                    const gridBody = document.querySelector(`div[data-key*="${props.uniqueName}"] .ag-root`) as HTMLDivElement;

                    if (!popupEditor || !cellEditor || !gridBody) return;

                    const rowRect = cellEditor.getBoundingClientRect();
                    const gridRect = gridBody.getBoundingClientRect();
                    const topOffset = rowRect.top - gridRect.top;

                    const computedStyles = window.getComputedStyle(cellEditor);
                    const width = computedStyles.width;

                    const overridePosition = () => {
                        popupEditor.style.setProperty('top', `calc(${topOffset}px - var(--spacing-0))`, 'important');
                        popupEditor.style.setProperty('width', width, 'important');
                    };

                    overridePosition();

                    const observer = new MutationObserver(() => {
                        overridePosition();
                    });

                    observer.observe(popupEditor, { attributes: true, attributeFilter: ['style'] });

                    deferGridTask(() => observer.disconnect(), 2000);
                };

                deferGridTask(observePopupEditor, 0);
            }
            if (props.handleMouseEvent)
                props.handleMouseEvent(event, gridRef)
            return pointerEvent
        } finally {
            isHandlingClick = false; // reset after a small delay
        }

    } else if (event.type === "cellMouseDown") {
        if (
            props?.instanceName === "CablingGrid") {
            if (props?.onCellClicked)
                props?.onCellClicked(event, gridRef);
        }
    }
};


// custom logic for hide pagination and show dynamicaly base on data
const getGridElement = (props: IBasicGrid): HTMLElement | null => {
    const id = props.id ? String(props.id) : `ag-grid-${props.uniqueName}`;
    return document.getElementById(id);
};

const getPaginationPanel = (props: IBasicGrid): HTMLElement | null => {
    const root = getGridElement(props);
    return root?.querySelector('.ag-paging-panel') as HTMLElement | null;
};

const applyPaginationSync = (props: IBasicGrid, api: GridApi | null | undefined) => {
    const paginationPanel = getPaginationPanel(props);
    if (!paginationPanel || !api || props.totalRecords == null) {
        return;
    }

    if (props.instanceName !== 'nz_forcensic_log') {
        return;
    }

    const pageSize = api.paginationGetPageSize();
    if (!pageSize) {
        return;
    }
    const currentPage = api.paginationGetCurrentPage();
    const total = Number(props.totalRecords);
    const first = total === 0 ? 0 : currentPage * pageSize + 1;
    let last = (currentPage + 1) * pageSize;
    if (last > total) {
        last = total;
    }
    if (first > total) {
        last = first;
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage >= totalPages && totalPages > 0 && currentPage > 0) {
        api.paginationGoToPage(0);
        return;
    }

    let recordCountElement = paginationPanel.querySelector('.custom-record-count') as HTMLElement | null;
    if (!recordCountElement) {
        recordCountElement = document.createElement('span');
        recordCountElement.className = 'custom-record-count';
        paginationPanel.insertBefore(recordCountElement, paginationPanel.firstChild);
    }
    recordCountElement.innerText = `Total : ${total}`;

    const summaryPanel = paginationPanel.querySelector('.ag-paging-row-summary-panel') as HTMLElement | null;
    if (summaryPanel) {
        summaryPanel.textContent = total > 0 ? `${first} to ${last} of ${total}` : '0 to 0 of 0';
    }

    const lbTotal = paginationPanel.querySelector('[data-ref="lbTotal"]') as HTMLElement | null;
    if (lbTotal) {
        lbTotal.innerText = String(totalPages);
    }
    const lbCurrent = paginationPanel.querySelector('[data-ref="lbCurrent"]') as HTMLElement | null;
    if (lbCurrent) {
        lbCurrent.innerText = String(currentPage + 1);
    }
    const btNext = paginationPanel.querySelector('[data-ref="btNext"]') as HTMLElement | null;
    const btLast = paginationPanel.querySelector('[data-ref="btLast"]') as HTMLElement | null;
    const btFirst = paginationPanel.querySelector('[data-ref="btFirst"]') as HTMLElement | null;
    const btPrevious = paginationPanel.querySelector('[data-ref="btPrevious"]') as HTMLElement | null;

    if (currentPage + 1 < totalPages) {
        btNext?.classList.remove('ag-disabled');
        btLast?.classList.remove('ag-disabled');
        btNext?.removeAttribute('aria-disabled');
        btLast?.removeAttribute('aria-disabled');
        if (btNext) {
            btNext.style.pointerEvents = 'auto';
            btNext.style.cursor = 'pointer';
            btNext.style.opacity = '1';
        }
        if (btLast) {
            btLast.style.pointerEvents = 'auto';
            btLast.style.cursor = 'pointer';
            btLast.style.opacity = '1';
        }
    } else {
        btNext?.classList.add('ag-disabled');
        btLast?.classList.add('ag-disabled');
        btNext?.setAttribute('aria-disabled', 'true');
        btLast?.setAttribute('aria-disabled', 'true');
        if (btNext) {
            btNext.style.pointerEvents = 'none';
            btNext.style.cursor = 'default';
            btNext.style.opacity = '0.38';
        }
        if (btLast) {
            btLast.style.pointerEvents = 'none';
            btLast.style.cursor = 'default';
            btLast.style.opacity = '0.38';
        }
    }

    if (currentPage > 0) {
        btFirst?.classList.remove('ag-disabled');
        btPrevious?.classList.remove('ag-disabled');
        btFirst?.removeAttribute('aria-disabled');
        btPrevious?.removeAttribute('aria-disabled');
        if (btFirst) {
            btFirst.style.pointerEvents = 'auto';
            btFirst.style.cursor = 'pointer';
            btFirst.style.opacity = '1';
        }
        if (btPrevious) {
            btPrevious.style.pointerEvents = 'auto';
            btPrevious.style.cursor = 'pointer';
            btPrevious.style.opacity = '1';
        }
    } else {
        btFirst?.classList.add('ag-disabled');
        btPrevious?.classList.add('ag-disabled');
        btFirst?.setAttribute('aria-disabled', 'true');
        btPrevious?.setAttribute('aria-disabled', 'true');
        if (btFirst) {
            btFirst.style.pointerEvents = 'none';
            btFirst.style.cursor = 'default';
            btFirst.style.opacity = '0.38';
        }
        if (btPrevious) {
            btPrevious.style.pointerEvents = 'none';
            btPrevious.style.cursor = 'default';
            btPrevious.style.opacity = '0.38';
        }
    }
};

const syncPaginationDisplay = (props: IBasicGrid, api: GridApi | null | undefined) => {
    applyPaginationSync(props, api);
    setTimeout(() => applyPaginationSync(props, api), 0);
    setTimeout(() => applyPaginationSync(props, api), 60);
    setTimeout(() => applyPaginationSync(props, api), 150);
    setTimeout(() => applyPaginationSync(props, api), 300);
};

const hideShowPaginatation = (props: IBasicGrid) => {
    const api = props.gridRef?.current?.api as GridApi | undefined;
    syncPaginationDisplay(props, api);

    if (props?.dynamicPagination === true) {
        function hasPagingNumberGreaterThanOne(parentId: string): boolean {
            const parent = document.getElementById(parentId);
            if (!parent) return false;

            const elements = parent.querySelectorAll('.ag-paging-number');
            return Array.from(elements).some((el: any) => {
                const num = parseInt(el.textContent.trim(), 10);
                return !isNaN(num) && num > 1;
            });
        }
        const isShowPagination = hasPagingNumberGreaterThanOne(props.id ? props.id : `ag-grid-${props.uniqueName}`)
        const parent = document.getElementById(props.id ? props.id : `ag-grid-${props.uniqueName}`);
        if (isShowPagination) {
            if (!parent) return false;
            const getPaginationDiv: any = parent.querySelector('.ag-paging-panel')
            if (getPaginationDiv) {
                getPaginationDiv.style.display = 'flex';
            }
        } else {
            if (!parent) return false;
            const getPaginationDiv: any = parent.querySelector('.ag-paging-panel')
            if (getPaginationDiv) {
                getPaginationDiv.style.display = 'none';
            }
        }
    }
};

// Copy data to clipboard
const copyDisplayedColumnsData = (props: IBasicGrid, gridRef: any) => {

    const api =
        props.gridRef?.current?.api ??
        gridRef?.current?.api;

    if (!api) return;

    const displayedColumns = api.getAllDisplayedColumns();
    const dataToCopy: any[] = [];

    api.forEachNodeAfterFilterAndSort((node: any) => {
        // skip group rows if needed
        if (node.group) return;

        const rowData: any = {};

        displayedColumns.forEach((column: any) => {
            const value = api.getCellValue({
                rowNode: node,
                colKey: column.getColId()
            });

            rowData[column.getColDef().headerName] = value;
        });

        dataToCopy.push(rowData);
    });

    if (!dataToCopy.length) {
        console.error("No rows to copy.");
        return;
    }
    const cleanedData = Object.fromEntries(
        Object.entries(dataToCopy).map(([outerKey, innerObj]) => {
            if (innerObj && typeof innerObj === 'object') {
                const cleanedInner = Object.fromEntries(
                    Object.entries(innerObj).filter(
                        ([key]) => key && key.trim() !== ''
                    )
                );
                return [outerKey, cleanedInner];
            }
            return [outerKey, innerObj];
        })
    );
    const jsonData = JSON.stringify(
        cleanedData,
        null,
        2
    );

    FnCopyToClipboard(jsonData, props.exportFileName, props.isExportOnCopy);
};



// widwow resize the it will call
const handleResize = (props: IBasicGrid) => {
    deferGridTask(() => {
        const row: HTMLDivElement | null = document.querySelector(
            ".nz-add-edit-row-dialog .MuiPaper-root"
        );
        if (row) {
            const data: HTMLDivElement | null = document.querySelector(".nz-form-title-bar");
            if (data) {
                row.style.width = data.offsetWidth + "px";
            }
        }
    }, 100);
    const cell: HTMLDivElement | null = props.className
        ? document.querySelector(`.${props.className} .ag-cell-popup-editing`)
        : document.querySelector(`.ag-cell-popup-editing`);
    const popupEditor: HTMLDivElement | null = props.className
        ? document.querySelector(`.${props.className} .ag-popup-editor`)
        : document.querySelector(`.ag-popup-editor`);
    if (popupEditor && cell) {
        popupEditor.style.width = cell.offsetWidth + "px";
    }

    hideShowPaginatation(props);
    setTimeout(() => hideShowPaginatation(props), 50);
    setTimeout(() => hideShowPaginatation(props), 150);
    setTimeout(() => hideShowPaginatation(props), 300);
};

//set popup with of cell
const setWidthPopup = (_props: IBasicGrid) => {
    const spilterPrimary: HTMLDivElement | null = document.querySelector(".nz-form-title-bar");
    if (spilterPrimary) {
        const width = spilterPrimary.offsetWidth;
        const popup: HTMLDivElement | null = document.querySelector(
            ".nz-add-edit-row-dialog .MuiPaper-root"
        );

        if (popup) {
            popup.style.width = width + "px";
        }
    }
};

export { onGridReady, handleMouseEvent, hideShowPaginatation, syncPaginationDisplay, copyDisplayedColumnsData, handleResize, setWidthPopup }
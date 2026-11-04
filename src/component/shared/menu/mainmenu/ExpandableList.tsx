
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { isEqual } from 'lodash'
import '../../allcss/menu/ExpandableList.css'
import { Setting24x24, SettingFeature24x24, Up24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { FnGetIconForExpandableMenu } from '../../allcommon/menu/FnGetIconForExpandableMenu'
import { handleExpandableMenuKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown'
import { IExpandableList } from '../../allinterface/menu/IExpandableList'
import { IMenuItem } from '../../allinterface/menu/IMainMenu'
import { Image } from '../../basic/image/Image'
import { FilterKeywordControl } from '../../searchfilter/filterkeywordcontrol/FilterKeywordControl'

/** Local search UI state; handleFilterMouse and searchValueChange are wired on FilterKeywordControl at render. */
type ExpandableListSearchState = {
    uniqueName: string;
    isShowFilterControl: boolean;
    lensDirty: boolean;
    filterDirty: boolean;
    searchInputValue: string;
};

/** Drag handlers pass list props as actionCode and the dragged menu row as payload. */
type ExpandableListDragAction = string | IExpandableList;

const searchProps: ExpandableListSearchState = {
    uniqueName: "filtericon",
    isShowFilterControl: true, //show filter control.
    lensDirty: false,
    filterDirty: false,
    searchInputValue: "",
};

const ExpandableList = (props: IExpandableList) => {
    const isConfigureMenu = props.uniqueName === "configure";
    const isSettingsMenu = props.uniqueName === "setting-menu";
    const isEntitiesMenu = props.uniqueName === "appqa-entities";
    const isTargetMenu = isConfigureMenu || isSettingsMenu || isEntitiesMenu;
    const [mainMenu, setMainMenu] = useState<IMenuItem[] | null>(null);
    const [searchControlProps, setSearchControlProps] = useState<ExpandableListSearchState>(searchProps);
    const [originalMenuMenu, setOriginalMenuMenu] = useState<IMenuItem[] | null>(null);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedEntId, setSelectedEntId] = useState<string | undefined>();
    const [activeMainIndex, setActiveMainIndex] = useState<number | null>(null);
    const [selectedMenuIndex, setSelectedMenuIndex] = useState<number>(props.uniqueName === "Menu" ? -1 : 0);
    const [activeSubIndex, setActiveSubIndex] = useState<number | null>(null);
    const mainRefs = useRef<(HTMLDivElement | null)[]>([]);
    const subRefs = useRef<{ [key: number]: (HTMLDivElement | null)[] }>({});
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const configureDefaultSelectedRef = useRef(false);
    const lastFeatureIdRef = useRef<string | null>(null);
    const searchValueRef = useRef<string>("");

    const isSubActive = useCallback((sub: IMenuItem): boolean => {
        const subFeatureId = sub._Feature != null ? String(sub._Feature) : "";
        const subEntId = sub.EntID ? String(sub.EntID) : "";

        if (props.uniqueName === "Menu") {
            const selFeatureId = props.selectedFeature?._Feature != null ? String(props.selectedFeature._Feature) : "";
            const selEntId = props.selectedFeature?.EntID ? String(props.selectedFeature.EntID) : "";

            // If selectedFeature is provided, it is the sole authoritative source of truth.
            if (selFeatureId || selEntId) {
                if (selFeatureId && subFeatureId && selFeatureId === subFeatureId) return true;
                if (selEntId && subEntId && selEntId === subEntId) return true;
                return false;
            }

            // Fallback when no selectedFeature is passed
            if (selectedEntId && subEntId) {
                return String(selectedEntId) === subEntId;
            }
            if (lastFeatureIdRef.current) {
                if (subFeatureId && subFeatureId === lastFeatureIdRef.current) return true;
                if (subEntId && subEntId === lastFeatureIdRef.current) return true;
                return false;
            }
            return !!sub.isSelected;
        }

        // For other menus (configure, setting-menu, appqa-entities, etc.)
        if (selectedEntId && subEntId) {
            return String(selectedEntId) === subEntId;
        }
        if (props.selectedFeature) {
            const selFeatureId = props.selectedFeature._Feature != null ? String(props.selectedFeature._Feature) : "";
            const selEntId = props.selectedFeature?.EntID ? String(props.selectedFeature.EntID) : "";
            if (selFeatureId && subFeatureId && selFeatureId === subFeatureId) return true;
            if (selEntId && subEntId && selEntId === subEntId) return true;
            return false;
        }
        return !!sub.isSelected;
    }, [props.uniqueName, props.selectedFeature, selectedEntId]);

    const isMainActive = useCallback((element: IMenuItem, index: number): boolean => {
        // Folders/accordion headers with submenus must NEVER be selected.
        if (element.subMenu && element.subMenu.length > 0) {
            return false;
        }

        // If any submenu item across any group is active, no main item can be active.
        if (mainMenu && mainMenu.some((m) => m.subMenu?.some(isSubActive))) {
            return false;
        }

        const mainFeatureId = element._Feature != null ? String(element._Feature) : "";
        const mainEntId = element.EntID ? String(element.EntID) : "";

        if (props.uniqueName === "Menu") {
            const selFeatureId = props.selectedFeature?._Feature != null ? String(props.selectedFeature._Feature) : "";
            const selEntId = props.selectedFeature?.EntID ? String(props.selectedFeature.EntID) : "";

            if (selFeatureId || selEntId) {
                if (selFeatureId && mainFeatureId && selFeatureId === mainFeatureId) return true;
                if (selEntId && mainEntId && selEntId === mainEntId) return true;
                return false;
            }

            if (selectedEntId && mainEntId) {
                return String(selectedEntId) === mainEntId;
            }

            return activeSubIndex === null && activeMainIndex === index;
        }

        if (selectedEntId && mainEntId) {
            return String(selectedEntId) === mainEntId;
        }
        if (element.isSelected && activeSubIndex === null) {
            return true;
        }
        return selectedMenuIndex === index && activeSubIndex === null;
    }, [mainMenu, isSubActive, props.uniqueName, props.selectedFeature, selectedEntId, activeMainIndex, activeSubIndex, selectedMenuIndex]);

    const isGroupActive = useCallback((element: IMenuItem): boolean => {
        return !!element.subMenu?.some(isSubActive);
    }, [isSubActive]);

    const applyFirstMenuItemSelection = (menu: IMenuItem[]): IMenuItem[] => {
        if (!menu || menu.length === 0) {
            return menu;
        }

        const resetMenuItem = (ele: IMenuItem, isFirst: boolean) => {
            ele.isSelected = isFirst;
            ele.isOpen = isConfigureMenu ? Boolean(ele.subMenu?.length) : false;
            ele.subMenu?.forEach((sub) => {
                sub.isSelected = false;
            });
        };

        if (props.menuData && props.menuData.length > 0) {
            props.menuData.forEach((ele, idx) => resetMenuItem(ele, idx === 0));
        }

        menu.forEach((ele, idx) => resetMenuItem(ele, idx === 0));

        const nextMenu = menu.map((ele, idx) => ({
            ...ele,
            isSelected: idx === 0,
            isOpen: isConfigureMenu ? Boolean(ele.subMenu?.length) : false,
            subMenu: ele.subMenu?.map((sub) => ({
                ...sub,
                isSelected: false,
            })),
        }));

        const firstEle = nextMenu[0];
        setSelectedEntId(firstEle.EntID as string | undefined);
        setActiveMainIndex(0);
        setActiveSubIndex(null);
        setSelectedMenuIndex(0);

        const syntheticEvent = {
            type: "click",
            stopPropagation: () => { },
            preventDefault: () => { },
        } as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>;

        props.handleMouseEvent(syntheticEvent, "expandleList", firstEle);

        return nextMenu;
    };

    const openAllConfigureMenuGroups = (menu: IMenuItem[]): IMenuItem[] =>
        menu.map((ele) => ({
            ...ele,
            isOpen: ele.subMenu && ele.subMenu.length > 0 ? true : ele.isOpen,
        }));

    const applyConfigureDefaultSelection = (menu: IMenuItem[]): IMenuItem[] => {
        if (configureDefaultSelectedRef.current || selectedEntId) {
            return menu;
        }

        const firstGroup = menu.find((ele) => ele.subMenu && ele.subMenu.length > 0);
        const defaultSub = firstGroup?.subMenu?.[0];
        if (!firstGroup || !defaultSub) {
            return menu;
        }

        firstGroup.isSelected = true;
        defaultSub.isSelected = true;
        setSelectedEntId(defaultSub.EntID as string | undefined);
        setSelectedMenuIndex(-1);
        configureDefaultSelectedRef.current = true;
        props.handleMouseEvent(undefined, "expandleList", defaultSub);

        return menu.map((ele) => ({
            ...ele,
            isSelected: ele.EntID === firstGroup.EntID,
            subMenu: ele.subMenu?.map((sub) => ({
                ...sub,
                isSelected: sub.EntID === defaultSub.EntID,
            })),
        }));
    };

    useEffect(() => {
        if (props.menuData && props.menuData.length > 0) {
            if (!isEqual(props.menuData, originalMenuMenu)) {
                const menu: IMenuItem[] = [...props.menuData];
                // One group, one child: open group and select the child on load.
                if (!isConfigureMenu && menu.length === 1 && menu[0].subMenu?.length === 1) {
                    menu[0].isOpen = true
                    menu[0].subMenu[0].isSelected = true
                    setSelectedEntId(menu[0].subMenu[0].EntID as string | undefined)
                    props.handleMouseEvent(undefined, "expandleList", menu[0].subMenu[0])
                    setSelectedMenuIndex(-1)
                    menu[0].isSelected = false
                }

                if (props.uniqueName === "Menu") {
                    menu.forEach((element: IMenuItem) => {
                        if (mainMenu && mainMenu.length > 0) {
                            const existing = mainMenu.find((m) =>
                                (m.EntID && element.EntID && String(m.EntID) === String(element.EntID)) ||
                                (m._Feature != null && element._Feature != null && String(m._Feature) === String(element._Feature)) ||
                                (m.Label && element.Label && m.Label === element.Label)
                            );
                            if (existing && existing.isOpen !== undefined) {
                                element.isOpen = existing.isOpen;
                            }
                        }
                        if (isGroupActive(element)) {
                            element.isOpen = true;
                        }
                    });
                }

                const nextMenu = isConfigureMenu
                    ? applyConfigureDefaultSelection(openAllConfigureMenuGroups(menu))
                    : menu;
                setOriginalMenuMenu([...nextMenu]);

                // This condition depends on searchValue
                if (!searchValueRef.current) {
                    setMainMenu([...nextMenu]);
                }
            }
        }
    }, [props.menuData, isConfigureMenu]); // avoid overwriting filtered mainMenu while user is searching
    useEffect(() => {
        if (!props.selectedFeature) return;

        const selFeature = props.selectedFeature;
        const selFeatureId = selFeature._Feature != null ? String(selFeature._Feature) : "";
        const selEntId = selFeature.EntID ? String(selFeature.EntID) : "";

        if (!selFeatureId && !selEntId) return;

        lastFeatureIdRef.current = selFeatureId || selEntId;

        if (mainMenu && mainMenu.length > 0) {
            let matchedMainIdx = -1;
            let matchedSubIdx = -1;
            let matchedEntId: string | undefined = undefined;

            for (let mIdx = 0; mIdx < mainMenu.length; mIdx++) {
                const subMenu = mainMenu[mIdx].subMenu;
                if (!subMenu?.length) continue;
                for (let sIdx = 0; sIdx < subMenu.length; sIdx++) {
                    const sub = subMenu[sIdx];
                    const subFeatureId = sub._Feature != null ? String(sub._Feature) : "";
                    const subEntId = sub.EntID ? String(sub.EntID) : "";
                    const isMatch = (selFeatureId && subFeatureId && selFeatureId === subFeatureId) ||
                        (selEntId && subEntId && selEntId === subEntId);
                    if (isMatch) {
                        matchedMainIdx = mIdx;
                        matchedSubIdx = sIdx;
                        matchedEntId = sub.EntID as string | undefined;
                        break;
                    }
                }
                if (matchedMainIdx >= 0) break;
            }

            if (matchedMainIdx < 0) {
                for (let mIdx = 0; mIdx < mainMenu.length; mIdx++) {
                    const ele = mainMenu[mIdx];
                    const mainFeatureId = ele._Feature != null ? String(ele._Feature) : "";
                    const mainEntId = ele.EntID ? String(ele.EntID) : "";
                    const isMatch = (selFeatureId && mainFeatureId && selFeatureId === mainFeatureId) ||
                        (selEntId && mainEntId && selEntId === mainEntId);
                    if (isMatch) {
                        matchedMainIdx = mIdx;
                        matchedSubIdx = -1;
                        matchedEntId = ele.EntID as string | undefined;
                        break;
                    }
                }
            }

            if (matchedMainIdx >= 0) {
                if (matchedEntId !== undefined) {
                    setSelectedEntId(matchedEntId);
                }
                setActiveMainIndex(matchedMainIdx);
                setActiveSubIndex(matchedSubIdx >= 0 ? matchedSubIdx : null);
                setSelectedMenuIndex(matchedSubIdx >= 0 ? -1 : matchedMainIdx);

                const updatedMenu = mainMenu.map((ele, mIdx) => {
                    const isGroupOfActiveChild = mIdx === matchedMainIdx && matchedSubIdx >= 0;
                    const isDirectActive = mIdx === matchedMainIdx && matchedSubIdx < 0;

                    const newSubs = ele.subMenu?.map((sub, sIdx) => ({
                        ...sub,
                        isSelected: mIdx === matchedMainIdx && sIdx === matchedSubIdx,
                    }));

                    let newIsOpen = ele.isOpen;
                    if (props.uniqueName === "Menu") {
                        if (isGroupOfActiveChild) {
                            newIsOpen = true;
                        } else if (ele.subMenu?.length) {
                            newIsOpen = false;
                        }
                    } else if (isConfigureMenu) {
                        newIsOpen = true;
                    } else if (isGroupOfActiveChild) {
                        newIsOpen = true;
                    }

                    return {
                        ...ele,
                        isSelected: isDirectActive || (props.uniqueName === "Menu" ? isGroupOfActiveChild : false),
                        isOpen: newIsOpen,
                        subMenu: newSubs,
                    };
                });

                setMainMenu(updatedMenu);
            }
        }
    }, [props.selectedFeature, props.uniqueName, isConfigureMenu]);

    useEffect(() => {
        return () => {
            setMainMenu(null);
            setOriginalMenuMenu(null);
            configureDefaultSelectedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, [])
    const handleSubListItemClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        index: number,
        item: IMenuItem) => {
        if (!mainMenu) {
            return;
        }
        try {

            setSelectedEntId(item.EntID as string | undefined);
            if (props.uniqueName === "Menu") {
                const currentFeatureId = String(item._Feature ?? item.EntID ?? "");
                lastFeatureIdRef.current = currentFeatureId;
            }
            mainMenu.map((ele: IMenuItem) => {
                ele.isSelected = false;
                let hasTargetSub = false;
                ele.subMenu?.forEach((sub: IMenuItem) => {
                    const isTargetSub = props.uniqueName === "Menu"
                        ? ((sub.EntID && item.EntID && String(sub.EntID) === String(item.EntID)) ||
                            (sub._Feature != null && item._Feature != null && String(sub._Feature) === String(item._Feature)))
                        : sub.EntID === item.EntID;
                    if (isTargetSub) {
                        sub.isSelected = true;
                        hasTargetSub = true;
                    }
                    else {
                        sub.isSelected = false;
                    }
                });
                if (props.uniqueName === "Menu") {
                    if (hasTargetSub) {
                        ele.isSelected = true;
                        ele.isOpen = true;
                    } else if (ele.subMenu?.length) {
                        ele.isOpen = false;
                    }
                } else if (hasTargetSub) {
                    ele.isSelected = true;
                }
                return ele;
            });
            setMainMenu([...mainMenu]);

            props.handleMouseEvent(event, "expandleList", item)
            setSelectedMenuIndex(-1)

            for (let mainIndex = 0; mainIndex < mainMenu.length; mainIndex++) {
                const subIndex = mainMenu[mainIndex].subMenu?.findIndex((sub) => sub.EntID === item.EntID) ?? -1;
                if (subIndex >= 0) {
                    setActiveMainIndex(mainIndex);
                    setActiveSubIndex(subIndex);
                    break;
                }
            }
        }
        catch (e) {
            console.error("Error in handleSubListItemClick:", e);
        }

    }
    const handleListItemClick = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        index: number,
        item: IMenuItem) => {
        if (!mainMenu) {
            return;
        }
        try {

            timeoutRef.current = setTimeout(() => {
                let div = document.getElementById(`nz-nav-open`)
                if (div) {
                    div?.scrollIntoView({ block: "start", behavior: 'smooth' });
                }
            }, 300);
            const subMenuLength = item.subMenu?.length ?? 0;

            // One child under this group: select the child, not the parent.
            if (subMenuLength === 1 && item.subMenu) {
                handleSubListItemClick(event, index, item.subMenu[0]);
                return;
            }

            const hasSubMenu = subMenuLength > 0;

            mainMenu.forEach((ele: IMenuItem) => {
                const isClickedItem = props.uniqueName === "Menu"
                    ? ((ele.EntID && item.EntID && String(ele.EntID) === String(item.EntID)) ||
                        (ele._Feature != null && item._Feature != null && String(ele._Feature) === String(item._Feature)))
                    : ele.EntID === item.EntID;
                const elementHasSubMenu = !!ele.subMenu?.length;

                if (isClickedItem) {
                    ele.isSelected = true;
                    if (elementHasSubMenu) {
                        if (props.uniqueName === "Menu") {
                            if (isGroupActive(ele)) {
                                // Active submenu's parent menu cannot be closed by the user
                                ele.isOpen = true;
                            } else {
                                ele.isOpen = ele.isOpen === undefined ? true : !ele.isOpen;
                            }
                        } else if (isConfigureMenu) {
                            ele.isOpen = true;
                        } else {
                            ele.isOpen = ele.isOpen === undefined ? true : !ele.isOpen;
                        }
                    }
                } else {
                    if (props.uniqueName === "Menu") {
                        if (!isGroupActive(ele)) {
                            ele.isSelected = false;
                        }
                    } else {
                        ele.isSelected = false;
                        if (!isConfigureMenu && elementHasSubMenu) {
                            ele.isOpen = false;
                        }
                    }
                }

                const shouldClearSubs = props.uniqueName === "Menu"
                    ? (ele.subMenu?.length && !hasSubMenu)
                    : ele.subMenu?.length;

                if (shouldClearSubs) {
                    ele.subMenu?.forEach((sub: IMenuItem) => {
                        if (isSettingsMenu || isEntitiesMenu || !isClickedItem) {
                            sub.isSelected = false;
                        }
                    });
                }
            });

            if (isSettingsMenu || isEntitiesMenu) {
                setSelectedEntId(item.EntID as string | undefined);
                if (originalMenuMenu) {
                    originalMenuMenu.forEach((ele: IMenuItem) => {
                        ele.subMenu?.forEach((sub: IMenuItem) => {
                            sub.isSelected = false;
                        });
                    });
                }
                if (props.menuData) {
                    props.menuData.forEach((ele: IMenuItem) => {
                        ele.subMenu?.forEach((sub: IMenuItem) => {
                            sub.isSelected = false;
                        });
                    });
                }
            }

            setMainMenu([...mainMenu]);

            if (hasSubMenu) {
                // Parent click only expands/collapses; do not run submenu selection sync.
                setActiveMainIndex(index);
                setActiveSubIndex(null);
                props.handleMouseEvent(event, "expandleList", item);
                return;
            }

            setSelectedEntId(item.EntID as string | undefined);
            setActiveMainIndex(index);
            setActiveSubIndex(null);
            setSelectedMenuIndex(index);
            props.handleMouseEvent(event, "expandleList", item);
        } catch (error) {
            console.error("Error in handleListItemClick:", error);
        }
    }
    const searchValueChange = (value: string) => {
        searchValueRef.current = value;

        const baseMenu = (originalMenuMenu && originalMenuMenu.length > 0) ? originalMenuMenu : props.menuData;

        if (baseMenu && baseMenu.length > 0 && !value) {
            if (isTargetMenu) {
                const nextMenu = applyFirstMenuItemSelection(baseMenu);
                setOriginalMenuMenu([...nextMenu]);
                setMainMenu([...nextMenu]);
            } else {
                const restored = baseMenu.map((ele: IMenuItem) => {
                    const subMenu = ele.subMenu?.map((sub: IMenuItem) => ({
                        ...sub,
                        isSelected: props.uniqueName === "Menu" ? isSubActive(sub) : sub.EntID === selectedEntId,
                    })) || [];

                    const isAnySubSelected = subMenu.some((s: IMenuItem) => s.isSelected);
                    const isSelected = ele.EntID === selectedEntId || isAnySubSelected;

                    return {
                        ...ele,
                        isSelected: isSelected,
                        isOpen: isConfigureMenu
                            ? Boolean(ele.subMenu?.length)
                            : isAnySubSelected,
                        subMenu: subMenu,
                    };
                });

                setMainMenu(isConfigureMenu ? openAllConfigureMenuGroups(restored) : [...restored]);
            }
        }

        setSearchValue(value);
        setSearchControlProps({
            ...searchControlProps,
            searchInputValue: value,
            filterDirty: value ? true : false,
        });
    };

    /** Runs when the filter icon is clicked; applies searchValue to mainMenu (IFilterKeywordControl contract). */
    const handleKeywordSearchResult = (): void => {

        let filterData: IMenuItem[] = [];
        if (originalMenuMenu && originalMenuMenu.length > 0 && searchValue) {
            if (props.uniqueName === "Menu" || props.uniqueName === "setting-menu" || props.uniqueName === "appqa-entities" || props.uniqueName === "configure") {
                const filteredData = originalMenuMenu.map((element: IMenuItem) => {
                    return {
                        ...element,
                        subMenu: (element.subMenu ?? []).filter(
                            (subElement: IMenuItem) =>
                                subElement.Label?.toLowerCase().includes(searchValue?.toLowerCase()) ===
                                true ||
                                subElement.Tooltip?.toLowerCase().includes(
                                    searchValue?.toLowerCase()
                                ) === true
                        ),
                    };
                });
                filterData = filteredData.filter((element: IMenuItem) => {
                    return (
                        element.Label?.toLowerCase().includes(searchValue?.toLowerCase()) ===
                        true ||
                        element.Tooltip?.toLowerCase().includes(searchValue?.toLowerCase()) ===
                        true ||
                        // Keep parent rows when any child matched the filter above.
                        (element.subMenu?.length ?? 0) > 0
                    );
                });
                setMainMenu(isConfigureMenu ? openAllConfigureMenuGroups(filterData) : [...filterData]);

            } else {
                const filteredData = originalMenuMenu.map((element: IMenuItem) => {
                    return {
                        ...element,
                    };
                });
                filterData = filteredData.filter((element: IMenuItem) => {
                    return (
                        element.Label?.toLowerCase().includes(searchValue?.toLowerCase()) === true
                    );
                });
                setMainMenu([...filterData]);
            }
        } else if (
            ((originalMenuMenu && originalMenuMenu?.length > 0) || (props.menuData && props.menuData.length > 0)) &&
            (searchValue === "" || searchValue === null || searchValue === undefined)
        ) {
            const baseMenu = (originalMenuMenu && originalMenuMenu.length > 0) ? originalMenuMenu : props.menuData!;
            if (isTargetMenu) {
                const nextMenu = applyFirstMenuItemSelection(baseMenu);
                setOriginalMenuMenu([...nextMenu]);
                setMainMenu([...nextMenu]);
            } else {
                filterData = isConfigureMenu
                    ? openAllConfigureMenuGroups(baseMenu)
                    : baseMenu;
                setMainMenu([...filterData]);
            }
        }
    };
    const handleDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: ExpandableListDragAction, payload?: IMenuItem) => {
        props.handleDrag && props.handleDrag(event, actionCode, payload);
    };


    const handleEndDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: ExpandableListDragAction, payload?: IMenuItem) => {
        const clientX: number = event.clientX;
        const clientY: number = event.clientY;
        const DropDiv: HTMLElement | null = document.elementFromPoint(clientX, clientY) as HTMLElement;

        if (!DropDiv) return;

        const attrib = DropDiv.getAttribute("allow-drop");
        if (attrib) {
            props.handleEndDrag && props.handleEndDrag(event, actionCode, payload);
        }
    }

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, actionCode?: ExpandableListDragAction, payload?: IMenuItem) => {
        props.handleStartDrag && props.handleStartDrag(event, actionCode, payload)
    };

    const openMainMenuGroup = (index: number) => {
        if (!mainMenu) {
            return;
        }
        const item = mainMenu[index];
        if (!item?.subMenu?.length) {
            return;
        }

        mainMenu.forEach((ele, menuIndex) => {
            if (menuIndex === index) {
                ele.isOpen = true;
                ele.isSelected = true;
                return;
            }
            if (!isConfigureMenu && ele.subMenu?.length) {
                ele.isOpen = false;
            }
        });
        setMainMenu([...mainMenu]);
    };

    const closeMainMenuGroup = (index: number) => {
        if (!mainMenu || isConfigureMenu) {
            return;
        }
        const item = mainMenu[index];
        if (props.uniqueName === "Menu" && item && isGroupActive(item)) {
            return;
        }
        if (item?.subMenu?.length && item.isOpen) {
            item.isOpen = false;
            setMainMenu([...mainMenu]);
        }
    };

    /** Find main/sub row indices for the item that is actually selected in menu data. */
    const resolveSelectionIndices = useCallback((): { mainIndex: number; subIndex: number | null } => {
        if (!mainMenu || mainMenu.length === 0) {
            return { mainIndex: 0, subIndex: null };
        }

        for (let mainIndex = 0; mainIndex < mainMenu.length; mainIndex++) {
            const subMenu = mainMenu[mainIndex].subMenu;
            if (!subMenu?.length) {
                continue;
            }
            for (let subIndex = 0; subIndex < subMenu.length; subIndex++) {
                const sub = subMenu[subIndex];
                if (isSubActive(sub)) {
                    return { mainIndex, subIndex };
                }
            }
        }

        for (let mainIndex = 0; mainIndex < mainMenu.length; mainIndex++) {
            const element = mainMenu[mainIndex];
            if (isMainActive(element, mainIndex)) {
                return { mainIndex, subIndex: null };
            }
        }

        if (selectedMenuIndex >= 0 && selectedMenuIndex < mainMenu.length && !mainMenu[selectedMenuIndex]?.subMenu?.length) {
            return { mainIndex: selectedMenuIndex, subIndex: null };
        }

        return { mainIndex: 0, subIndex: null };
    }, [mainMenu, isSubActive, isMainActive, selectedMenuIndex]);

    const syncKeyboardToSelection = useCallback(() => {
        if (!mainMenu?.length) {
            return;
        }
        const { mainIndex, subIndex } = resolveSelectionIndices();
        if (
            subIndex !== null
            && mainMenu[mainIndex]?.subMenu?.length
            && !mainMenu[mainIndex]?.isOpen
            && !isConfigureMenu
        ) {
            openMainMenuGroup(mainIndex);
        }
        setActiveMainIndex(mainIndex);
        setActiveSubIndex(subIndex);
    }, [mainMenu, resolveSelectionIndices, isConfigureMenu]);

    // Align keyboard focus when user selects a different menu item (click or app state).
    useEffect(() => {
        syncKeyboardToSelection();
    }, [selectedEntId, props.selectedFeature?._Feature, props.selectedFeature?.EntID]);

    const handleMenuContainerFocus = (event: React.FocusEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && mainMenu?.length) {
            syncKeyboardToSelection();
        }
    };

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!mainMenu || mainMenu.length === 0) {
            return;
        }

        const asMouseEvent = (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) =>
            keyboardEvent as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>;

        let navMainIndex = activeMainIndex;
        let navSubIndex = activeSubIndex;

        // First key press: start from the selected row, not index 0.
        if (navMainIndex === null) {
            const selection = resolveSelectionIndices();
            navMainIndex = selection.mainIndex;
            navSubIndex = selection.subIndex;
            setActiveMainIndex(navMainIndex);
            setActiveSubIndex(navSubIndex);
            if (
                navSubIndex !== null
                && !mainMenu[navMainIndex]?.isOpen
                && !isConfigureMenu
            ) {
                openMainMenuGroup(navMainIndex);
            }
        }

        handleExpandableMenuKeyDown(event, {
            ignoreInsideSelector: '.nz-menu-search',
            mainItemCount: mainMenu.length,
            activeMainIndex: navMainIndex,
            activeSubIndex: navSubIndex,
            resolveMainIndex: () => navMainIndex as number,
            getSubItemCount: (mainIndex) => mainMenu[mainIndex]?.subMenu?.length ?? 0,
            hasSubMenu: (mainIndex) => (mainMenu[mainIndex]?.subMenu?.length ?? 0) > 0,
            isSubMenuOpen: (mainIndex) => !!mainMenu[mainIndex]?.isOpen,
            onInitMainIndex: () => {
                const selection = resolveSelectionIndices();
                navMainIndex = selection.mainIndex;
                navSubIndex = selection.subIndex;
                setActiveMainIndex(navMainIndex);
                setActiveSubIndex(navSubIndex);
            },
            onMainIndexChange: (index) => {
                setActiveMainIndex(index);
                setActiveSubIndex(null);
            },
            onSubIndexChange: (index) => {
                setActiveSubIndex(index);
            },
            onOpenSubMenu: (mainIndex) => {
                if (!mainMenu[mainIndex]?.isOpen) {
                    openMainMenuGroup(mainIndex);
                }
            },
            onCloseSubMenu: closeMainMenuGroup,
            onSelectMain: (keyboardEvent, mainIndex) => {
                const current = mainMenu[mainIndex];
                if (current) {
                    handleListItemClick(asMouseEvent(keyboardEvent as React.KeyboardEvent<HTMLDivElement>), mainIndex, current);
                }
            },
            onSelectSub: (keyboardEvent, mainIndex, subIndex) => {
                const currentSub = mainMenu[mainIndex]?.subMenu?.[subIndex];
                if (currentSub) {
                    handleSubListItemClick(asMouseEvent(keyboardEvent as React.KeyboardEvent<HTMLDivElement>), subIndex, currentSub);
                }
            },
        });
    }, [activeMainIndex, activeSubIndex, mainMenu, resolveSelectionIndices, isConfigureMenu]);

    const handleIconForMenu = (
        label: string,
        isShowSettingIcon?: boolean,
        isSubMenu?: boolean
    ) => {
        // Remove anything inside (...) and trim spaces
        const name = label.replace(/\s*\([^)]*\)/g, "").trim();

        if (isShowSettingIcon) {
            if (isSubMenu) {
                return (
                    <SettingFeature24x24
                        size={FnGetCssVariable('--image-size-2')}
                        fill="none"
                        strokeWidth={1}
                    />
                );
            }

            return (
                <Setting24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill="none"
                    strokeWidth={1}
                />
            );
        }

        const sanitizedName = name.replace(/[^0-9A-Za-z_-]/g, "");

        // If name already ends with a number, don't append 24x24
        const iconName = /\d$/.test(sanitizedName)
            ? sanitizedName
            : `${sanitizedName}`;

        const Icon = FnGetIconForExpandableMenu(iconName);

        return (
            <Icon
                size={FnGetCssVariable('--image-size-2')}
                fill="none"
                strokeWidth={1}
            />
        );
    };
    useEffect(() => {
        const id = setTimeout(() => {
            if (activeMainIndex == null) {
                return;
            }

            const focusSubItem = () => {
                subRefs.current[activeMainIndex]?.[activeSubIndex as number]?.focus();
            };

            if (activeSubIndex == null) {
                mainRefs.current[activeMainIndex]?.focus();
                return;
            }

            const mainItem = mainMenu?.[activeMainIndex];
            if (mainItem?.subMenu?.length && !mainItem.isOpen && !isConfigureMenu) {
                openMainMenuGroup(activeMainIndex);
                setTimeout(focusSubItem, 100);
                return;
            }

            focusSubItem();
        }, 0);
        return () => clearTimeout(id);
    }, [activeMainIndex, activeSubIndex, mainMenu, isConfigureMenu]);

    return (
        <div
            className={`nz-nav-bar nz-nav-open ${props.uniqueName === "Menu" || props.isMenuWithAbsolute ? "nz-expandable-list-absolute" : ""}`}
            tabIndex={1}
            onFocus={handleMenuContainerFocus}
            onKeyDown={handleKeyDown}
        >
            {!props.hideSearchControl && searchControlProps && (
                <div className="nz-menu-search">
                    <FilterKeywordControl
                        {...searchControlProps}
                        handleFilterMouse={handleKeywordSearchResult}
                        searchValueChange={searchValueChange}
                        filterIconTooltip='Filter'
                    />
                </div>
            )}
            <Box
                className="nz-expandable-list"
                role="presentation"
                key={props.uniqueName}
                onMouseLeave={(event: React.MouseEvent<HTMLDivElement>) => {
                    if (props.handleMouseLeave) {
                        const relatedTarget = event.relatedTarget as HTMLElement;
                        // Prevent closing if focus is inside the search filter control
                        if (relatedTarget && relatedTarget?.closest &&
                            (relatedTarget.closest(".nz-menu-search") || relatedTarget.closest(".MuiInputBase-input"))

                        ) {
                            return;
                        } else {
                            event.preventDefault();
                            props.handleMouseLeave()
                        }
                    }

                }}
            >
                <List className='nz-nav-ul-main'>
                    {
                        mainMenu && mainMenu.map((element: IMenuItem, index: number) => {
                            return (
                                <Fragment key={index}>
                                    <li key={index}
                                        className='nz-nav-link' id={(isConfigureMenu && element.subMenu?.length) || element.isOpen ? `nz-nav-open` : "nz-nav-close"}>
                                        {/* Menu Item */}
                                        <ListItemButton
                                            ref={(el) => {
                                                mainRefs.current[index] = el;
                                            }}
                                            tabIndex={-1}
                                            key={element.EntID + "_" + index.toString()}
                                            selected={isMainActive(element, index)}
                                            className={`nz-nav-li-button nz-nav-li-menu  ${isMainActive(element, index) ? ' nz-nav-li-button-selected' : ''}`}
                                            title={element.Tooltip}
                                            onClick={(event) => {
                                                handleListItemClick(event, index, element)

                                            }}>

                                            {!props.hideIcon && <ListItemIcon className='nz-nav-li-icon'>
                                                <div className="nz-feature-icon">
                                                    <Image uniqueName='menu-image' source={
                                                        handleIconForMenu(element.Alias?.length ? element.Alias : element.Label, (props.uniqueName === "setting-menu" || props.uniqueName === "appqa-entities" || props.uniqueName === "configure") ? true : false)}
                                                        type='svg' w='var(--image-size-2)' />

                                                </div>

                                            </ListItemIcon>}
                                            <ListItemText className={`nz-nav-menu-text ${props.hideIcon ? 'nz-only-show-label' : ""}`} primary={element.Label} style={{ opacity: 1 }} />
                                            {element.subMenu && element.subMenu.length > 0 && !isConfigureMenu && (<>
                                                <div
                                                    className={`nz-nav-i-arrow ${element.isOpen ? '' : 'closed'}`}
                                                >
                                                    <Image uniqueName='up-down' source={<Up24x24 size={FnGetCssVariable('--image-size-2')}
                                                        fill='none'
                                                        strokeWidth={1} />}
                                                        type='svg' w='var(--image-size-1)' />
                                                </div>

                                            </>)}
                                        </ListItemButton>
                                    </li>
                                    <Collapse key={"Clps_" + index.toString()} in={isConfigureMenu ? true : Boolean(element.isOpen)} timeout="auto" unmountOnExit>
                                        {/*submenu Items*/}
                                        <List component="div" key={"Cli_" + index.toString()} disablePadding>
                                            {element.subMenu && element.subMenu.map((subEle: IMenuItem, subIndex: number) => {

                                                return (
                                                    <li key={subIndex}
                                                        className='nz-nav-link'>
                                                        <div className='nz-image-list-data'
                                                            style={{ width: "100%", height: '100%' }}
                                                            key={props.uniqueName + index}
                                                            draggable={props.allowDND}
                                                            onDrag={(e: React.DragEvent<HTMLDivElement>) => handleDrag(e, props, subEle)}
                                                            onDragEnd={(e: React.DragEvent<HTMLDivElement>) => handleEndDrag(e, props, subEle)}
                                                            onDragStart={handleDragStart}
                                                        >
                                                            <ListItemButton
                                                                ref={(el) => {
                                                                    if (!subRefs.current[index]) subRefs.current[index] = [];
                                                                    subRefs.current[index][subIndex] = el;
                                                                }}
                                                                tabIndex={-1}
                                                                key={subEle.EntID + "_" + subIndex.toString()} sx={{ pl: 4 }}
                                                                selected={isSubActive(subEle)}
                                                                title={subEle.Tooltip}
                                                                className='nz-nav-li-button nz-nav-sub-menu'
                                                                onClick={(event) => handleSubListItemClick(event, subIndex, subEle)}>
                                                                {!props.hideIcon && <ListItemIcon className='nz-nav-li-icon'>
                                                                    <Image uniqueName='menu-image' source={handleIconForMenu(subEle.Alias?.length ? subEle.Alias : subEle.Label, (props.uniqueName === "setting-menu" || props.uniqueName === "appqa-entities" || props.uniqueName === "configure") ? true : false, true)}
                                                                        type='svg' w='var(--image-size-2)' />
                                                                </ListItemIcon>}
                                                                <ListItemText primary={subEle.Label} className='nz-nav-sub-menu-text' />
                                                            </ListItemButton>
                                                        </div>
                                                        {subEle.NodeType && subEle.NodeType?.toLowerCase().includes('separator') &&
                                                            <hr className='nz-image-list-separator' />
                                                        }
                                                    </li>)

                                            })}
                                        </List>
                                    </Collapse>
                                    {element.separator && <hr className='nz-image-list-separator' />}
                                </Fragment>)
                        })
                    }
                </List>
            </Box>
        </div>
    )
}
export { ExpandableList }



import { useRef, useCallback, useEffect, useState } from "react";
import Tree, { TreeNodeProps } from "rc-tree";
import { CaretRight24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { IBaseTree } from '../../allinterface/tree/IBaseTree';
import { Image } from "../../basic/image/Image";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

const BaseTree = (baseTreeProps: IBaseTree) => {
    const isDraggingRef = useRef(false);
    const dragNodeRef = useRef<ITreeNode | null>(null);
    const isDragDropMatchRef = useRef(false);
    const dragHoverKeyRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const baseTreePropsRef = useRef(baseTreeProps);
    baseTreePropsRef.current = baseTreeProps;
    const nodeMapRef = useRef<Map<string, ITreeNode>>(new Map());
    const [containerHeight, setContainerHeight] = useState<number>(0);

    useEffect(() => {
        if (!baseTreeProps.allowVirtual) return;
        const el = containerRef.current;
        if (!el) return;

        const updateHeight = () => {
            const h = el.clientHeight;
            if (h > 0) {
                setContainerHeight(prev => (prev === h ? prev : h));
            }
        };
        updateHeight();

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const h = Math.floor(entry.contentRect.height);
                if (h > 0) {
                    setContainerHeight(prev => (prev === h ? prev : h));
                }
            }
        });
        resizeObserver.observe(el);

        return () => {
            resizeObserver.disconnect();
        };
    }, [baseTreeProps.allowVirtual]);

    // Update nodeMap whenever treeData changes
    useEffect(() => {
        const map = new Map<string, ITreeNode>();
        const traverse = (nodes: ITreeNode[]) => {
            for (const n of nodes) {
                map.set(String(n.key), n);
                if (n.children && n.children.length > 0) {
                    traverse(n.children);
                }
            }
        };
        if (baseTreeProps.treeData) {
            traverse(baseTreeProps.treeData);
        }
        nodeMapRef.current = map;
    }, [baseTreeProps.treeData]);

    // Attach native capturing dragover and dragend listeners to ensure dropEffect='none' (🚫) on invalid targets
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleNativeDragOver = (e: DragEvent) => {
            if (!isDraggingRef.current) return;

            const target = e.target as HTMLElement | null;
            const treeNodeEl = target?.closest?.('.rc-tree-treenode') as HTMLElement | null;

            if (!treeNodeEl) {
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "none";
                }
                return;
            }

            const keyAttr = treeNodeEl.querySelector('[data-node-key]')?.getAttribute('data-node-key');
            const targetNode = keyAttr != null ? nodeMapRef.current.get(keyAttr) : undefined;

            const canDrop = targetNode && baseTreePropsRef.current.canAcceptInternalDrop
                ? baseTreePropsRef.current.canAcceptInternalDrop(targetNode, dragNodeRef.current ?? undefined)
                : !baseTreePropsRef.current.canAcceptInternalDrop;

            if (!canDrop) {
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "none";
                }
            } else {
                e.preventDefault();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "move";
                }
            }
        };

        const handleNativeDragEnd = (e: DragEvent) => {
            isDraggingRef.current = false;
            dragNodeRef.current = null;
            isDragDropMatchRef.current = false;
            dragHoverKeyRef.current = null;
            baseTreePropsRef.current.handleDragEnd?.(e as any);
        };

        el.addEventListener('dragover', handleNativeDragOver, { capture: true });
        window.addEventListener('dragend', handleNativeDragEnd);

        return () => {
            el.removeEventListener('dragover', handleNativeDragOver, { capture: true });
            window.removeEventListener('dragend', handleNativeDragEnd);
        };
    }, []);

    // Cleanup drag state on unmount to prevent race conditions
    useEffect(() => {
        return () => {
            isDraggingRef.current = false;
            dragNodeRef.current = null;
            isDragDropMatchRef.current = false;
            dragHoverKeyRef.current = null;
        };
    }, []);

    const switcher = useCallback((obj: TreeNodeProps) => {
        if (obj.isLeaf) {
            return;
        }
        return (
            <div key={`${obj.eventKey}-caret-div`}
                data-node-key={String(obj.eventKey)}
                className={obj.expanded
                    ? `rc-cst-tree-node-expanded ${obj.className}`
                    : "rc-cst-tree-node"}
                onMouseDown={(e) => {
                    e.preventDefault();
                }} style={{ cursor: 'pointer' }}>
                <Image
                    uniqueName={`${obj.eventKey}-caret`}
                    source={<CaretRight24x24
                        size={FnGetCssVariable('--node_height')}
                        fill='none'
                        strokeWidth={1} />}
                    w={"var(--node_height)"}
                />
            </div>
        );
    }, []);

    // Helper to reset drag state
    const resetDragState = useCallback(() => {
        dragHoverKeyRef.current = null;
        isDragDropMatchRef.current = false;
    }, []);

    // Helper to set drag state
    const setDragState = useCallback((key: string) => {
        isDragDropMatchRef.current = true;
        dragHoverKeyRef.current = key;
    }, []);

    // Handle external drag over
    const handleExternalDragOver = useCallback((event: React.DragEvent, canDropHere: boolean) => {
        const sourceTree = event.dataTransfer?.getData("sourceTree");
        const isExternalDrag = sourceTree !== baseTreeProps.treeId;

        if (!isExternalDrag) return; // Internal drag handled by rc-tree

        if (!event.dataTransfer) return;

        event.dataTransfer.dropEffect = canDropHere ? "move" : "none";

        if (canDropHere) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, [baseTreeProps.treeId]);

    // Handle internal drag over
    const handleInternalDragOver = useCallback(({ event, node }: { event: React.DragEvent, node: any }) => {
        event.preventDefault();

        const canDropHere = baseTreeProps.canAcceptInternalDrop
            ? baseTreeProps.canAcceptInternalDrop(node as ITreeNode, dragNodeRef.current ?? undefined)
            : true;

        const target = event.target as HTMLElement;
        const treeNodeEl = target.closest('.rc-tree-treenode') as HTMLElement;

        if (!treeNodeEl || !canDropHere) {
            resetDragState();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "none";
            }
            return;
        }

        setDragState(node.key as string);
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
        }
    }, [resetDragState, setDragState, baseTreeProps]);

    // Render title with external drag/drop support
    const renderTitle = useCallback((node: any) => {
        const treeNode = node as ITreeNode;
        const canDropHere = baseTreeProps.canAcceptExternalDrop(treeNode);

        return (
            <span
                data-node-key={String(treeNode.key)}
                style={{
                    display: "inline-block",
                    width: "100%",
                    padding: "2px 0",
                }}
                onDragOver={(event) => {
                    if (isDraggingRef.current) {
                        const canInternalDrop = baseTreeProps.canAcceptInternalDrop
                            ? baseTreeProps.canAcceptInternalDrop(treeNode, dragNodeRef.current ?? undefined)
                            : true;
                        if (event.dataTransfer) {
                            event.dataTransfer.dropEffect = canInternalDrop ? "move" : "none";
                        }
                    } else {
                        handleExternalDragOver(event, canDropHere);
                    }
                }}
                onDrop={(event) => {
                    const sourceTree = event.dataTransfer?.getData("sourceTree");

                    // ONLY external
                    if (sourceTree !== baseTreeProps.treeId) {
                        if (!canDropHere) return;

                        event.preventDefault();
                        event.stopPropagation();

                        baseTreeProps.handleExternalDrop?.(event, treeNode);
                    }

                    // internal handled by rc-tree
                }}
            >
                {treeNode.title}
            </span>
        );
    }, [baseTreeProps, handleExternalDragOver]);

    return (
        <div
            ref={containerRef}
            style={{
                height: "100%",
                overflow: baseTreeProps.allowVirtual ? "hidden" : "auto",
                // paddingBottom: "var(--tree-scroll-padding, 40px)"
            }}
        >
            <Tree
                tabIndex={1}
                className={
                    baseTreeProps.className ? baseTreeProps.className : "ng-treeview-setting nz-setting-tree"
                }
                onClick={baseTreeProps.handleNodeClick}
                onDoubleClick={baseTreeProps.handleNodeDoubleClick}
                onExpand={baseTreeProps.handleNodeExpand}
                showLine={true}
                checkable={baseTreeProps.allowCheckbox}
                treeData={baseTreeProps.treeData}
                ref={baseTreeProps.treeRef}
                multiple={baseTreeProps.allowMultiple}
                selectable={baseTreeProps.selectable}
                showIcon={baseTreeProps.allowIcon}
                defaultExpandAll={baseTreeProps.allowDefaultExpandAll}
                draggable={{
                    icon: false,
                    nodeDraggable: () => true,
                }}
                allowDrop={(options) => {
                    if (baseTreeProps.canAcceptInternalDrop) {
                        return baseTreeProps.canAcceptInternalDrop(options.dropNode as ITreeNode, options.dragNode as ITreeNode);
                    }
                    return true;
                }}
                onDrop={baseTreeProps.onDrop}
                titleRender={renderTitle}
                switcherIcon={switcher}
                dropIndicatorRender={(props) => {
                    const { dropPosition } = props;
                    const finalPosition = dropPosition < 0 ? -1 : 1;
                    if (!isDragDropMatchRef.current) {
                        return (<></>)
                    }
                    return (
                        <div
                            style={{
                                height: 1,
                                backgroundColor: "var(--drop-indicator-color, #115c31)",
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: finalPosition < 0 ? 0 : undefined,
                                bottom: finalPosition > 0 ? 0 : undefined,
                            }}
                        />
                    );
                }}
                itemHeight={24}
                height={baseTreeProps.allowVirtual ? (containerHeight > 0 ? containerHeight : 500) : undefined}
                virtual={baseTreeProps.allowVirtual ? true : false}
                activeKey={isDraggingRef.current ? dragHoverKeyRef.current : (baseTreeProps.allowVirtual ? undefined : baseTreeProps.activeKey)}
                expandedKeys={baseTreeProps.expandedKeys}
                checkStrictly={baseTreeProps.allowCheckStrictly}
                onSelect={baseTreeProps.handleNodeSelect}
                onCheck={baseTreeProps.handleNodeCheck}
                checkedKeys={baseTreeProps.allowCheckStrictly ? baseTreeProps.strictlyCheckedKeys : baseTreeProps.checkedKeys}
                selectedKeys={baseTreeProps.selectedKeys}
                onRightClick={baseTreeProps.handleRightClick}
                onKeyDown={baseTreeProps.handleKeyDown}
                onActiveChange={
                    isDraggingRef.current ? undefined : baseTreeProps.onActiveChange
                }
                onDragStart={(info) => {
                    const fullNode = (info.node?.key != null ? nodeMapRef.current.get(String(info.node.key)) : null) || (info.node as ITreeNode);
                    if (!baseTreeProps.canAllowDragDrop(fullNode)) {
                        info.event?.preventDefault?.();
                        info.event?.stopPropagation?.();
                        isDraggingRef.current = false;
                        dragNodeRef.current = null;
                        return;
                    }
                    isDraggingRef.current = true;
                    dragNodeRef.current = fullNode;
                    if (info.event?.dataTransfer) {
                        info.event.dataTransfer.effectAllowed = "move";
                    }
                    baseTreeProps.handleDragStart?.(info);
                }}
                onDragOver={handleInternalDragOver}
                onDragEnd={(info) => {
                    isDraggingRef.current = false;
                    dragNodeRef.current = null;
                    isDragDropMatchRef.current = false;
                    dragHoverKeyRef.current = null;
                    baseTreeProps.handleDragEnd?.(info);
                }}

                onBlur={(e) => {
                    e.preventDefault();
                }}
            ></Tree>
        </div>
    )
}
export { BaseTree }

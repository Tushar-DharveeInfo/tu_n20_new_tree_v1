
import React, { useEffect, useRef, useState } from 'react';
import '../../allcss/menu/MenuImage.css';
import { DefaultPropsMenuImage } from '../../alldefaultprops/menu/DefaultPropsMenuImage';
import { IMenuImage } from '../../allinterface/menu/IMenuImage';
import { Image } from '../../basic/image/Image';
import { Label } from '../../basic/label/Label';

const MOUSE_ENTER_DELAY_MS = 200;

const MenuImage = (menuImageProps: IMenuImage) => {
    const [dynamicStyle, setDynamicStyle] = useState<object | null>(null)
    const [hasEntered, setHasEntered] = useState(false);
    const mouseEnterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const imageProps = menuImageProps.image;
    const labelProps = menuImageProps.label || null;
    const dynamicStyleContainer = {
        width: (typeof menuImageProps.w === "string" ? menuImageProps.w : `${menuImageProps.w}px`) || DefaultPropsMenuImage.Width,
        height: (typeof menuImageProps.h === "string" ? menuImageProps.h : `${menuImageProps.h}px`) || DefaultPropsMenuImage.Height,
        border: menuImageProps.border ? menuImageProps.border : DefaultPropsMenuImage.Border,
        cursor: menuImageProps.handleMouse ? "pointer" : DefaultPropsMenuImage.Cursor,
        backgroundColor: menuImageProps.BGColor ? menuImageProps.BGColor : DefaultPropsMenuImage.BGColor
    }
    useEffect(() => {
        setDynamicStyle(dynamicStyleContainer)
        return () => {
            clearMouseEnterTimeout();
        };
    }, [])

    // Cancel pending delayed mouse-enter callback.
    const clearMouseEnterTimeout = () => {
        if (mouseEnterTimeoutRef.current) {
            clearTimeout(mouseEnterTimeoutRef.current);
            mouseEnterTimeoutRef.current = null;
        }
    };

    // Forward click event to parent menu image handler.
    const handleMouseEvent = (event: React.MouseEvent<HTMLDivElement>) => {
        if (menuImageProps.handleMouse) {
            menuImageProps.handleMouse(event, menuImageProps.actionCode ? menuImageProps.actionCode : "")
        }
    }
    // Apply hover style and notify parent after a short enter delay.
    const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
        clearMouseEnterTimeout();
        mouseEnterTimeoutRef.current = setTimeout(() => {
            mouseEnterTimeoutRef.current = null;
            if (menuImageProps.hoverBGColor) {
                const setHoverColor = { ...dynamicStyle, backgroundColor: menuImageProps.hoverBGColor }
                setDynamicStyle({ ...setHoverColor })
            }
            menuImageProps.handleMouseEnter && menuImageProps.handleMouseEnter(event, menuImageProps.actionCode ? menuImageProps.actionCode : "")
        }, MOUSE_ENTER_DELAY_MS);
    }

    return (
        <>
            {dynamicStyle && <div
                key={menuImageProps.uniqueName}
                style={dynamicStyle}
                className={`nz-menu-image-container ${menuImageProps.selected ? "nz-menu-selected" : ""}`}
                onClick={(event: React.MouseEvent<HTMLDivElement>) => { handleMouseEvent(event) }}
                onMouseEnter={(event: React.MouseEvent<HTMLDivElement>) => {
                    if (!hasEntered) {
                        setHasEntered(true)
                        handleMouseEnter(event)
                    }
                }}
                onMouseLeave={(event: React.MouseEvent<HTMLDivElement>) => {
                    clearMouseEnterTimeout();
                    setHasEntered(false)
                    if (menuImageProps.hoverBGColor) {
                        const removeHoverColor = { ...dynamicStyle, backgroundColor: menuImageProps.BGColor }
                        setDynamicStyle({ ...removeHoverColor })
                    }
                }}
                onMouseMove={() => {
                    if (menuImageProps.hoverBGColor) {
                        const setHoverColor = { ...dynamicStyle, backgroundColor: menuImageProps.hoverBGColor }
                        setDynamicStyle({ ...setHoverColor })
                    }
                }}
                onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleMouseEvent(event as unknown as React.MouseEvent<HTMLDivElement>);
                    }
                }}
                tabIndex={1}

            >
                <div className={`${menuImageProps.allowAnimations === true && menuImageProps.active ? " nz-menu-active" : "nz-menu-inactive"}`}>
                    <Image {...imageProps} />
                    {labelProps?.label && menuImageProps.showLabel && <Label {...labelProps} />}
                </div>
            </div >}
        </>

    )
}

export { MenuImage }
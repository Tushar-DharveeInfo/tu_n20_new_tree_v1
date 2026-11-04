


import { useEffect, useRef, useState } from 'react';
import '../allcss/ComponentsWrapperContainer.css';
import { IComponentsWrapperContainer } from '../allinterface/IComponentsWrapperContainer';
import { StatusBarContainer } from '../statusbarcontainer/StatusBarContainer';
import { OptionalContainer } from '../../shared/basic/actionimagestrip/OptionalContainer';
import { Helptip } from '../../shared/Help';

const ComponentsWrapperContainer = (props: IComponentsWrapperContainer) => {

    const [overlayPosition, setOverlayPosition] = useState({
        x: props.overlayContainer?.x || 0,
        y: props.overlayContainer?.y || 0
    });
    const [isDragging, setIsDragging] = useState(false);

    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const mainWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return () => {
            mainWrapperRef.current = null
        }
    }, [])

    if (!props.featureId) {
        return (
            <div className='nz-w-100 nz-d-flex-row-hv-center'>
                No feature implemented
            </div>
        );
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!props.overlayContainer?.isVisible) return;

        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {

        if (!isDragging || !mainWrapperRef.current) return;

        const mainRect = mainWrapperRef.current.getBoundingClientRect();
        const newX = e.clientX - mainRect.left - dragOffset.x;
        const newY = e.clientY - mainRect.top - dragOffset.y;

        // Get the overlay element to check its actual width
        const overlayElement = mainWrapperRef.current.querySelector('.nz-overlay-container') as HTMLElement;
        const overlayWidth = overlayElement ? overlayElement.offsetWidth : 100; // fallback width

        // Constrain within main wrapper bounds
        const maxX = mainRect.width - overlayWidth; // overlay actual width
        const maxY = mainRect.height - overlayElement.offsetHeight; // overlay height

        setOverlayPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div ref={mainWrapperRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className='nz-componets-wrapper-container'
            style={{ position: 'relative' }}
        >
            {props.helptipContainer.isVisible && <Helptip uniqueName={`${props.uniqueName}-helptip`} mdString={props.helptipContainer.helptext} />}
            {props.chartContainer && props.chartContainer.isVisible && (
                <div className="nz-wrapper-chart-container" style={{ minHeight: '100px', alignItems: 'center', justifyContent: 'start', display: 'flex', padding: '5px' }}>
                    There is no chart to show.
                </div>
            )}

            <div className='nz-wrapper-componets-container'>
                {props.PropsComponent && <OptionalContainer
                    data={props.PropsComponent}
                />}
            </div>
            {props.statusBarContainer.isVisible && <StatusBarContainer uniqueName={`${props.uniqueName}-statusbar-container`} StatusBartype={props.statusBarContainer.StatusBarType}
                featureId={props.featureId}
                statusBarData={props.statusBarContainer.statusBarData} />}
        </div>
    );
};

export { ComponentsWrapperContainer };

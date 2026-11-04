import React, { useState } from 'react';
import { FlipPdf } from '@n20a/libflippdf';
import '@n20a/libflippdf/style.css';
import { CustomCheckbox } from '@n20a/libform';
import { ActionImage } from '../../shared/basic/actionimage/ActionImage';
import { Label } from '../../shared/basic/label/Label';
import { Close24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../allcommon/FnGetCssVariable';
import ErrorBoundary from '../../shared/errorboundary/ErrorBoundary';
import { IWhatsNewContainer } from '../allinterface/IWhatsNewContainer';
import '../allcss/WhatsNewContainer.css';

const WhatsNewContainer: React.FC<IWhatsNewContainer> = ({
    uniqueName = 'whats-new-container',
    headerText = "What's New",
    pdfUrl,
    onClose,
    onDontShowAgain
}) => {
    const [dontShowAgainChecked, setDontShowAgainChecked] = useState<boolean>(false);

    const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setDontShowAgainChecked(isChecked);
        if (isChecked) {
            await onDontShowAgain();
            onClose();
        }
    };

    return (
        <div className="nz-whatsnew-container" id={uniqueName}>
            <div className="nz-whatsnew-header nz-sub-header">
                <div className="nz-whatsnew-header-left">
                    <Label
                        uniqueName={`${uniqueName}-header-label`}
                        label={headerText}
                        fontWeight="bold"
                        fontSize="14px"
                    />
                </div>
                <div className="nz-whatsnew-header-right">
                    <label
                        className="nz-whatsnew-checkbox-label"
                        title="Don't show again"
                    >
                        <CustomCheckbox
                            id={`${uniqueName}-dont-show-again`}
                            name="dontShowAgain"
                            checked={dontShowAgainChecked}
                            onChange={handleCheckboxChange}
                        />
                        <span>Don't show again</span>
                    </label>
                    <div className="nz-whatsnew-close-btn">
                        <ActionImage
                            image={{
                                uniqueName: `${uniqueName}-close-img`,
                                source: (
                                    <Close24x24
                                        size={18}
                                        fill="none"
                                        stroke={FnGetCssVariable('--textprimary') || '#333333'}
                                        strokeWidth={2}
                                    />
                                ),
                                type: 'svg',
                                w: 'var(--image-size-2)',
                                h: 'var(--image-size-2)'
                            }}
                            uniqueName={`${uniqueName}-close`}
                            actionCode="close"
                            w="var(--image-size-2)"
                            h="var(--image-size-2)"
                            tooltip="Close"
                            handleMouse={onClose}
                        />
                    </div>
                </div>
            </div>
            <div className="nz-whatsnew-body">
                <ErrorBoundary disableForensicLog={true}>
                    <FlipPdf
                        documentTitle={headerText}
                        pdfUrl={pdfUrl}
                        tocWidthPercent={20}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default WhatsNewContainer;
export { WhatsNewContainer };

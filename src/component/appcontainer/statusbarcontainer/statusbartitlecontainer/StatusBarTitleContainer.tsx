
import { JSX, useEffect, useMemo, useState } from 'react';
import { Close24x24, Copy24x24, Down24x24, NoInternet, Secured24x24, Up24x24 } from '@n20a/libicon';
import '../../allcss/StatusBarTitleContainer.css'
import { FnGetCssVariable } from '../../allcommon/FnGetCssVariable.ts';
import { FnCopyToClipboard } from '../../../shared/allcommon/basic/FnCopyToClipboard.ts';
import { IStatusBarTitleContainer } from '../../allinterface/IStatusBarContainer.ts'
import { Label } from '../../../shared/basic/label/Label.tsx';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage.tsx';
import { Image } from '../../../shared/basic/image/Image.tsx';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks.ts';


const StatusBarTitleContainer = (statusBarTitleContainerProps: IStatusBarTitleContainer) => {
    const [titleContent, setTitleContent] = useState<JSX.Element>();
    const [contentToCopy, setContentToCopy] = useState<string>();

    const sessionContext = useSessionContext();
    const { isOpen, cardsCount, criticalAlertCount, isError } = statusBarTitleContainerProps;

    const isNormalStatusString =
        cardsCount === 0 &&
        !isError &&
        statusBarTitleContainerProps.titleData !== "DataError";

    const loginName = useMemo(() => {
        if (statusBarTitleContainerProps.loginName) {
            return statusBarTitleContainerProps.loginName;
        }

        return "";
    }, [statusBarTitleContainerProps.loginName, sessionContext?.SessionList]);
    useEffect(() => {
        if (Array.isArray(statusBarTitleContainerProps.titleData)) {
            const renderTitleContent = () => {
                const { titleData, isShowFullTitle, handleShowFullTitle } = statusBarTitleContainerProps;

                if (!Array.isArray(titleData) || titleData.length === 0) return <></>;

                // Full title mode
                if (isShowFullTitle) {
                    return (
                        <>
                            {titleData.map((str, idx) => (
                                <span key={idx}>
                                    {str}
                                    {idx < titleData.length - 1 && (
                                        <span style={{ color: 'var(--bgexplorer)', padding: '0 4px' }}>|</span>
                                    )}
                                </span>
                            ))}
                        </>
                    );
                }

                // Collapsed mode — include items until first "Site:" then add "..." if more items exist
                const hasContext = titleData.some(
                    (e) =>
                        e.startsWith('Tenant:') ||
                        e.startsWith('Team:') ||
                        e.startsWith('Tag:')
                );
                const filteredTitleData: string[] = [];
                for (const element of titleData) {
                    filteredTitleData.push(element);
                    if (hasContext) {
                        if (
                            element.startsWith('Tenant:') ||
                            element.startsWith('Team:') ||
                            element.startsWith('Tag:')
                        ) {
                            break;
                        }
                    } else {
                        if (element.startsWith('Site:')) {
                            break;
                        }
                    }
                }

                const showEllipsis = filteredTitleData.length < titleData.length;

                return (
                    <>
                        {filteredTitleData.map((str, idx) => (
                            <span key={idx}>
                                {str}
                                {idx < filteredTitleData.length - 1 && (
                                    <span style={{ color: 'var(--bgexplorer)', padding: '0 4px' }}>|</span>
                                )}
                                {idx === filteredTitleData.length - 1 && showEllipsis && (
                                    <span
                                        onClick={handleShowFullTitle}
                                        title='Click to view status'
                                        style={{
                                            cursor: 'pointer',
                                            paddingLeft: 'var(--spacing-0)',
                                            fontWeight: 600,
                                            color: 'var(--textprimary)',
                                        }}
                                    >
                                        ...
                                    </span>
                                )}
                            </span>
                        ))}
                    </>
                );
            };

            // Usage
            setTitleContent(renderTitleContent());

            if (cardsCount === 0 && !isError) {
                setContentToCopy(statusBarTitleContainerProps.titleData.join('|'));
            } else {
                setContentToCopy(undefined);
            }
        } else if (typeof statusBarTitleContainerProps.titleData === "string") {
            setTitleContent(
                <Label
                    fontWeight='bold'
                    uniqueName={`${statusBarTitleContainerProps.uniqueName}-header`}
                    label={statusBarTitleContainerProps.titleData}
                />
            );
            if (cardsCount === 0 && !isError && statusBarTitleContainerProps.titleData !== "DataError") {
                setContentToCopy(statusBarTitleContainerProps.titleData);
            } else {
                setContentToCopy(undefined);
            }
        } else {
            setTitleContent(<></>);
            setContentToCopy(undefined);
        }

    }, [statusBarTitleContainerProps.titleData
        , statusBarTitleContainerProps.isInternetAvailable
        , statusBarTitleContainerProps.uniqueName
        , statusBarTitleContainerProps.isShowFullTitle
        , statusBarTitleContainerProps.handleShowFullTitle
    ])


    return (
        <div className={"nz-statusbar-title-container"}>
            <div className='nz-statusbar-title-left'>
                {statusBarTitleContainerProps.cardsCount > 0 && <ActionImage
                    image={{
                        uniqueName: "up-down-i",
                        source: isOpen ? <Down24x24
                            size={FnGetCssVariable('--image-size-1')}
                            fill='none'
                            strokeWidth={1} /> : <Up24x24
                            size={FnGetCssVariable('--image-size-1')}
                            fill='none'
                            strokeWidth={1} />,
                        type: "svg",
                        w: "var(--image-size-1)",
                        h: "var(--image-size-1)",
                        tooltip: isOpen ? "Close" : "Open"
                    }}
                    uniqueName='up-down-ai'
                    w='var(--node_height)'
                    h='var(--node_height)'
                    actionCode={'copymdstring'}
                    handleMouse={() => {
                        statusBarTitleContainerProps.handleOpenCloseStatusBar();
                    }}
                />}
                {!statusBarTitleContainerProps.cardsCount && (
                    <>
                        {!statusBarTitleContainerProps.isInternetAvailable && (
                            <Image
                                uniqueName="no-internet-i"
                                source={<NoInternet
                                    size={FnGetCssVariable('--image-size-1')}
                                    fill='none'
                                    strokeWidth={1}
                                />}
                                type="svg"
                                w="var(--image-size-1)"
                                h="var(--image-size-1)"
                                tooltip="No Internet Found"
                            />
                        )}

                        {statusBarTitleContainerProps.isSiteLocked ? (
                            <Image
                                uniqueName="lock-i"
                                source={<Secured24x24
                                    size={FnGetCssVariable('--image-size-1')}
                                    fill='none'
                                    strokeWidth={1}
                                />}
                                type="svg"
                                w="var(--image-size-1)"
                                h="var(--image-size-1)"
                                tooltip="This Site is Locked, you may contact NetZoom Administrator"
                            />
                        ) : !statusBarTitleContainerProps.isSiteManaged ? (
                            <Label
                                uniqueName="site-managed-label"
                                label="Free | "
                                fontWeight='bold'
                                color='green'
                                tooltip="Changes to this Site are not tracked, you may contact NetZoom Administrator"
                            />
                        ) : null}
                    </>
                )}

                <div className='nz-statusbar-title-content'>
                    {!isOpen ? (
                        <>
                            {titleContent}
                            {isNormalStatusString && contentToCopy ? (
                                <ActionImage
                                    image={{
                                        uniqueName: "copy",
                                        source: <Copy24x24
                                            size={FnGetCssVariable('--image-size-1')}
                                            fill='none'
                                            strokeWidth={1} />,
                                        type: "svg",
                                        w: "var(--image-size-1)",
                                        h: "var(--image-size-1)",
                                        tooltip: "Copy Data"
                                    }}
                                    uniqueName='copy'
                                    w="var(--node_height)"
                                    h="var(--node_height)"
                                    actionCode={'copymdstring'}
                                    handleMouse={() => {
                                        if (contentToCopy)
                                            FnCopyToClipboard(contentToCopy)
                                    }}
                                />
                            ) : null}
                        </>
                    ) : (
                        `Notification${cardsCount > 0 ? ` (${cardsCount}${criticalAlertCount ? `, Critical : ${criticalAlertCount}` : ""})` : ""}`
                    )}
                </div>

            </div>
            <div className={`nz-statusbar-info-action-icons`}>
                <Label
                    uniqueName={`${statusBarTitleContainerProps.uniqueName}-login-name`}
                    label={`Login name: ${loginName}`}
                    tooltip={loginName ? `Login name: ${loginName}` : undefined}
                />

                {statusBarTitleContainerProps.cardsCount > 0 && <div className='nz-statusbar-close-error'>
                    <div className={statusBarTitleContainerProps.isError ? ' nz-pulse' : ""}>
                        <ActionImage uniqueName={`${statusBarTitleContainerProps.uniqueName}-close-error`}
                            image={{
                                uniqueName: `${statusBarTitleContainerProps.uniqueName}-close-image`,
                                source: <Close24x24
                                    size={FnGetCssVariable('--image-size-1')}
                                    fill='none'
                                    strokeWidth={1} />,
                                type: "svg",
                                w: "var(--image-size-1)",
                                h: "var(--image-size-1)",
                                tooltip: "Clear all notification",
                            }
                            } w={'var(--node_height)'} actionCode={'close'} handleMouse={(event: any, actionCode?: string, payload?: any) => {
                                if (statusBarTitleContainerProps.handleClearClick) {
                                    statusBarTitleContainerProps.handleClearClick()
                                }
                            }} />

                    </div>

                </div>}
            </div>

        </div>
    )
}
export { StatusBarTitleContainer }
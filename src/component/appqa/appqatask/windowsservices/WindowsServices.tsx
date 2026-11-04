
import { useEffect, useState } from 'react'
import { IWindowsServices } from '../../allinterface/IAppqaTask'
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { WINSVC } from '../../../shared/interceptors/EndPoints';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { OptionsFilter } from '../../../shared/basic/optionsfilter/OptionsFilter';
import { Label } from '../../../shared/basic/label/Label';
import { CardLayout } from '../../../shared/cardlayout/CardLayout';
import { ICardLayoutField } from '../../../shared/allinterface/cardlayout/ICardLayout';
import { AppQA } from '../../../constants/Feature';
import { IActionImageForSubMenu } from '../../../shared/allinterface/basic/IActionImageList';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { RightMouseMenuGrid } from '../../../constants/Feature';
import { FnCreateMessage } from '../../allcommon/FnCreateMessage';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { IFnCreateForensiclog } from '../../../appcontainer/allinterface/IFnCreateForensiclog';
import { LogGroupName, LogName, LogSubGroupName } from '../../../appcontainer/alldefaultprops/DefaultPropsForensiclog';
import { FnCreateForensiclog } from '../../../appcontainer/allcommon/FnCreateForensiclog';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { IOptionItem } from '../../../shared/allinterface/basic/IOptionsFilter';

const DETAIL_FONT_SIZE = "11px";

const isWindowsServiceRecord = (value: unknown): value is Record<string, any> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

/** Builds CardLayout name/value rows from a Windows service record. */
const buildWindowsServiceCardFields = (
    item: Record<string, any>,
    uniqueName: string,
    index: number
): ICardLayoutField[] => [
        {
            Name: "",
            Value: item.Status || "—",
            Header: 1,
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-status-${index}`}
                    label={`${item.Status ?? ""}`}
                    fontWeight="bold"
                />

            ),
        },
        {
            Name: "",
            Value: item.ServiceName || "—",
            Header: 2,
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-name-${index}`}
                    label={item.ServiceName}

                />
            ),
        },
        {
            Name: "",
            Value: item.Description || "",
            Header: 3,
            ValueContent: (
                <Label
                    uniqueName={`${uniqueName}-label-description-${index}`}
                    label={`${item.Description ?? ""}`}
                    fontSize={DETAIL_FONT_SIZE}
                />
            ),
        },
    ];

let savedWindowsServiceFilter = "";

const WindowsServices = (windowsServicesProps: IWindowsServices) => {
    const activeFilter = windowsServicesProps.savedFilter ?? savedWindowsServiceFilter ?? "";
    const [serviceList, setServiceList] = useState<Record<string, any>[]>([]);
    const [serviceListOriginal, setServiceListOriginal] = useState<Record<string, any>[]>([]);
    const [serviceCount, setServiceCount] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [serviceOptions, setServiceOptions] = useState<IOptionItem[]>();
    const [filterSelectedService, setFilterSelectedService] = useState(activeFilter);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
    const [menu, setMenu] = useState<Record<string, any> | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();

    useEffect(() => {
        fillWindowsService();
    }, [windowsServicesProps.featureId]);

    const fillWindowsService = async () => {
        setIsLoading(true);
        axiosInterceptor({
            url: WINSVC.GetAllWindowsServices,
            data: { prefix: "NZ" },
            setFetchData: (resp: unknown, status?: string) => {
                let varTaskList: any = [];
                if (status === "200" && resp && typeof resp === "object" && "winSvcJson" in resp && resp.winSvcJson) {
                    let jsonParse = FnParseJsonSafely(resp.winSvcJson as string);
                    varTaskList.push(...jsonParse?.WinSVCs)
                    const sortedList = [...varTaskList].sort((a, b) =>
                        a.ServiceName?.localeCompare(b.ServiceName)
                    );

                    setServiceListOriginal([...sortedList]);
                    const isAll = !activeFilter || activeFilter.toLowerCase() === "all";
                    if (!isAll) {
                        const filtered = sortedList?.filter(
                            (item: any) => item.Status?.toLowerCase() === activeFilter.toLowerCase()
                        );
                        setServiceList(filtered);
                        setServiceCount(filtered?.length || 0);
                        setFilterSelectedService(activeFilter);
                    } else {
                        setServiceList([...sortedList]);
                        setServiceCount(varTaskList.length || 0);
                        setFilterSelectedService("");
                    }


                    const uniqueStatuses: string[] = Array.from(
                        new Set(
                            varTaskList
                                .map((item: any) => item.Status)
                                .filter((status: string | undefined): status is string => Boolean(status))
                        )
                    );


                    const Status = [
                        {
                            uniqueName: "All",
                            isRenderAsForm: true,
                            label: "All",
                            value: isAll ? "1" : "0",
                            isDefault: isAll,
                            tooltip: "All Services",
                            disabled: false
                        },
                        ...uniqueStatuses.map((status: string) => {
                            const isMatch = !isAll && status.toLowerCase() === activeFilter.toLowerCase();
                            return {
                                uniqueName: status,
                                isRenderAsForm: true,
                                label: status,
                                value: isMatch ? "1" : "0",
                                isDefault: isMatch,
                                tooltip: status,
                                disabled: false
                            };
                        })
                    ];
                    setServiceOptions(Status)
                    windowsServicesProps.handleWindowsServiceCount?.(varTaskList.length);

                }
                else {
                    setServiceList([]);
                }
                setIsLoading(false);
            }
        }, statusBarContext);
    };
    const handleWindowServiceFilterSelect = (value: Record<string, any>): void => {
        const selectedVal = value.uniqueName === "All" ? "" : value.uniqueName;
        savedWindowsServiceFilter = selectedVal;
        windowsServicesProps.handleFilterChange?.(selectedVal);
        if (value.uniqueName === "All") {
            setServiceList(serviceListOriginal)
            setServiceCount(serviceListOriginal.length || 0)
            setFilterSelectedService("")
        } else {
            const filtered = serviceListOriginal?.filter(
                (item: Record<string, any>) => item.Status?.toLowerCase() === value.uniqueName?.toLowerCase()
            );
            setServiceList(filtered);
            setServiceCount(filtered?.length || 0);
            setFilterSelectedService(value.label)
        }
    }

    const handleWindowsServiceNodeMenu = async (
        menu: IActionImageForSubMenu,
        selectedRow: Record<string, any>
    ) => {
        setSelectedRow(selectedRow);
        setMenu(menu);
        if (selectedRow && menu?.payload && (menu?.payload.Label === RightMouseMenuGrid.WSStop.toString()
            || menu?.payload.Label === RightMouseMenuGrid.WSStart.toString()
            || menu?.payload.Label === RightMouseMenuGrid.WSPause.toString())) {
            let errorMsg = `${menu?.payload.Label} ${selectedRow?.ServiceName}`;
            // Are you sure you want to {#status}?
            const result = await FnCreateMessage('audit', '151', errorMsg, statusBarContext, undefined, undefined)
            if (result?.length) {
                setIsConfirmOpen(true);
                setConfirmMessage(result)
            }

        }
    }

    const handleNodeMenuOnClick = (
        menu: IActionImageForSubMenu,
        selectedRow: unknown,
        _containerName: string
    ): void => {
        if (!isWindowsServiceRecord(selectedRow)) {
            return;
        }

        void handleWindowsServiceNodeMenu(menu, selectedRow);
    }
    const createLogForStatusChange = (status: string, taskName: string) => {
        const payload: IFnCreateForensiclog = {
            logType: 'UserAction',
            GroupName: LogGroupName.ForensicLogTemplate,
            _Forensiclog: LogSubGroupName.AppQatask,
            SubGroupName: LogSubGroupName.AppQatask,
            LogName: LogName.task,
            actionObject: {
                taskName: taskName,
                StatusName: status,
                taskType: "Windows Service"
            },
            sessionContext: sessionContext,
            statusBarContext: statusBarContext,
            RefTableItems: mainAppContext.refTableRecords
        }
        FnCreateForensiclog(payload)
    }
    const callApiCallForWindowService = async (menu: string, serviceName: string, serverName: string, timeoutMilliseconds: number) => {

        if (menu === RightMouseMenuGrid.WSStop.toString()) {
            let payloadBackgoundWindowService = {
                serviceName: serviceName,
                serverName: serverName,
                timeoutMilliseconds: timeoutMilliseconds
            }
            await axiosInterceptor({
                url: WINSVC.StopWindowsService,
                data: payloadBackgoundWindowService,
                setFetchData: (resp: unknown, status?: string) => {
                    if (resp !== undefined && status === "200") {
                        createLogForStatusChange(RightMouseMenuGrid.WSStop, serviceName)
                        fillWindowsService();
                    }
                }
            }, statusBarContext)
        } else if (menu === RightMouseMenuGrid.WSStart.toString()) {
            let payloadStartWindowsService = {
                serviceName: serviceName,
                serverName: serverName,
                timeoutMilliseconds: timeoutMilliseconds
            }
            await axiosInterceptor({
                url: WINSVC.StartWindowsService,
                data: payloadStartWindowsService,
                setFetchData: (resp: unknown, status?: string) => {
                    if (resp !== undefined && status === "200") {
                        createLogForStatusChange(RightMouseMenuGrid.WSStart, serviceName)
                        fillWindowsService();
                    }
                }
            }, statusBarContext)
        } else if (menu === RightMouseMenuGrid.WSPause.toString()) {
            let payloadPauseWindowsService = {
                serviceName: serviceName,
                serverName: serverName,
                timeoutMilliseconds: timeoutMilliseconds > 0 ? timeoutMilliseconds : 100000
            }

            await axiosInterceptor({
                url: WINSVC.PauseWindowsService,
                data: payloadPauseWindowsService,
                setFetchData: (resp: unknown, status?: string) => {
                    if (resp !== undefined && status === "200") {
                        createLogForStatusChange(RightMouseMenuGrid.WSPause, serviceName)
                        fillWindowsService();
                    }
                }
            }, statusBarContext)
        }
    }

    const handleConfirmYesClick = (): void => {
        if (selectedRow?.ServiceName) {

            if (menu?.payload.Label === RightMouseMenuGrid.WSStop.toString()) {
                callApiCallForWindowService(menu?.payload.Label, selectedRow.ServiceName, '', 0);
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.WSStart.toString()) {
                callApiCallForWindowService(menu?.payload.Label, selectedRow.ServiceName, '', 0);
            }
            else if (menu?.payload.Label === RightMouseMenuGrid.WSPause.toString()) {
                callApiCallForWindowService(menu?.payload.Label, selectedRow.ServiceName, '', 0);
            }
        }
        setConfirmMessage("");
        setIsConfirmOpen(false)
    }

    return (
        <div>
            {serviceList ?
                <div id='winservice' className={"nz-OnetoOne-Grid nz-hw-prop-table-multi BackgroundTasks nz-service-list-container"}>
                    <div className='nz-sub-header'>
                        {serviceListOriginal && serviceListOriginal?.length > 0 && serviceOptions ?
                            <OptionsFilter showIcon={true} uniqueName={'app-qa-filter'} container={'ap-filter'}
                                handleSelect={handleWindowServiceFilterSelect}
                                options={serviceOptions}
                                disableUncheck={true}
                            />
                            :
                            null
                        }
                        <Label uniqueName={`${windowsServicesProps.uniqueName}-task-header`} label={`Windows Service ${serviceList.length > 0 ? `(${serviceCount})` : ''} ${filterSelectedService ? `(${filterSelectedService})` : ''}`} />
                    </div>
                    {isLoading ? (
                        <div className="nz-loading-message">Loading...</div>
                    ) : !serviceList?.length ? (
                        <div className="nz-no-data-message">Windows services are not found to display</div>
                    ) : (
                        <>
                            <div key={windowsServicesProps.uniqueName} className="nz-appqa-task-container">
                                {serviceList.map((item: Record<string, any>, index: number) => {
                                    const cardFields = buildWindowsServiceCardFields(
                                        item,
                                        windowsServicesProps.uniqueName ?? "windows-service",
                                        index
                                    );

                                    return (
                                        <CardLayout
                                            key={`task-service-card-${index}`}
                                            uniqueName={`Windows Service${index}`}
                                            className="nz-windows-service-card-item"
                                            data={item}
                                            fields={cardFields}
                                            featureId={AppQA.Task}
                                            featureData={windowsServicesProps.featureData}
                                            containerName="background_window_service"
                                            handleNodeMenuOnClick={handleNodeMenuOnClick}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                :
                <></>
            }
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'appqatask-confirm'}
                message={confirmMessage}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={function (): void {
                    setConfirmMessage("");
                    setIsConfirmOpen(false)
                }} />
        </div>
    )
}

export { WindowsServices }

import { useCallback, useEffect, useState } from 'react'
import { IMountedDevice, IRack, RowofRacks } from '@n20a/libform';
import '@n20a/libform/style.css'
import { IRowOfRacksContainer } from '../../../shared/allinterface/rackandstack/IRowOfRacksContainer'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks'
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { ASK } from '../../../shared/interceptors/EndPoints';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';
import { createRoot } from 'react-dom/client';
import { StatusBarProvider } from '../../../shared/context/contextandprovider/StatusBar';
import { GeneratePdf } from '../../../shared/generatepdf/GeneratePdf';
import { TReportLayoutJson } from '../../../shared/allinterface/IGeneratePdf';

const RowOfRacksContainer = ({
    uniqueName,
    featureId,
    selectedNode,
    handleShowUserMessage,
    onRendered,
}: IRowOfRacksContainer) => {
    const [loading, setLoading] = useState(true);
    const [rackList, setRackList] = useState<IRack[]>();
    const [mountedDeviceList, setMountedDeviceList] = useState<IMountedDevice[]>()
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportTemplateJson, setReportTemplateJson] = useState<TReportLayoutJson | null>(null);
    const statusBarContext = useStatusBarContext();

    useEffect(() => {
        axiosInterceptor({
            url: ASK.FloorDataset,
            data: { placement: true },
            allowShowLoader: true,
            setFetchData: async (response: unknown, status?: string) => {
                try {
                    if (status === "200" &&
                        response &&
                        typeof response === "object" &&
                        "askJson" in response &&
                        response.askJson !== null
                    ) {
                        const data = FnParseJsonSafely(response.askJson as string);

                        const racks = data?.[0]?.Racks ?? [];
                        const mounted = data?.[0]?.MountedDevices ?? [];

                        const mappedRacks: IRack[] = racks.map((r: any) => ({
                            rackId: String(r.ID),
                            rackName: r.RackName,
                            EntId: r.EntId,
                            EntityName: r.EntityName,
                            Power: `${r.FreePowerAvailable ?? 0}/${r.TotalPowerAvailable ?? 0}`,
                            Thermal: `${r.FreeThermal ?? 0}/${r.TotalThermal ?? 0}`,
                            Weight: `${r.FreeWeight ?? 0}/${r.TotalWeight ?? 0}`,
                            RU: `${r.FreeRU ?? 0}/${r.totalRU ?? 0}`,
                            PowerPort: `${r.FreePowerPort ?? 0}/${r.TotalPowerPort ?? 0}`,
                            NetworkPort: `${r.FreeNetworkPort ?? 0}/${r.TotalNetworkPort ?? 0}`
                        }));

                        const mappedDevices: IMountedDevice[] = mounted.map((d: any) => ({
                            Name: d.Name,
                            EntityName: d.EntityName,
                            EntId: d.RackName, //  FIXED (you had bug here)
                            rackName: d.RackName,
                            RackEntName: d.RackEntName,
                            RackEntId: d.RackEntId,
                            StartMountIndex: d.StartMountIndex,
                            RURequired: d.RURequired ?? 0,
                            power: d.Power ?? 0,
                            thermal: d.Thermal ?? 0,
                            powerport: d.PowerPort ?? 0,
                            networkport: d.NetworkPort ?? 0,
                            Weight: d.Weight ?? 0
                        }));
                        if (!mappedRacks.length) {
                            handleShowUserMessage?.("Rack details not found to display: " + selectedNode.Name);
                            setRackList([]);
                            setMountedDeviceList([]);
                            return;
                        }
                        setRackList(mappedRacks);
                        setMountedDeviceList(mappedDevices);
                    }
                    else {
                        setRackList([]);
                        setMountedDeviceList([]);
                        handleShowUserMessage?.("Rack details not found to display: " + selectedNode.Name)
                    }
                } catch (error) {
                    console.error('Error in get Floor dataset :', error);
                    handleShowUserMessage?.("Rack details not found to display: " + selectedNode.Name);
                    setRackList([]);
                    setMountedDeviceList([]);
                }
                finally {
                    setLoading(false);
                }

            }
        }, statusBarContext);
    }, [selectedNode]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (!loading && rackList?.length) {
            timeout = setTimeout(() => {
                onRendered?.();
            }, 500);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [loading, onRendered, rackList]);

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }
    if (!rackList || !rackList.length) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Row of Racks are not found</div>;
    }

    return (
        <div key={uniqueName} className='nz-wh-100 nz-overflow-hidden nz-row-of-racks-container'>
            <RowofRacks
                racks={rackList}
                columns={3}
                capacity={['Power', 'Thermal', 'RU', 'Weight', 'PowerPort', 'NetworkPort']}
                mountedDevices={mountedDeviceList} />
            {isReportDialogOpen && (
                <GeneratePdf
                    uniqueName={`${uniqueName}-row-of-racks-report`}
                    isOpen={isReportDialogOpen}
                    reportJson={reportTemplateJson}
                    title="Row of Racks Report"
                    featureId={featureId}
                    selectedNode={selectedNode}
                    onClose={() => {
                        setIsReportDialogOpen(false);
                        setReportTemplateJson(null);
                    }}
                />
            )}
        </div>
    )
}

function RenderRowOfRacksContainer(container: HTMLElement, props: IRowOfRacksContainer) {
    const root = createRoot(container);
    root.render(
        <StatusBarProvider>
            <RowOfRacksContainer {...props} />
        </StatusBarProvider>
    );
    return {
        unmount: () => root.unmount()
    };
}

export { RowOfRacksContainer, RenderRowOfRacksContainer }
import { useCallback, useEffect, useRef, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { DeviceModel } from '../../../shared/sidebar/devicemodel/DeviceModel'
import { IInboundAssetContainer } from '../../allinterface/plan/IInboundAssetContainer'
import '../../allcss/plan/InboundAssetContainer.css'
import { IInboundAsset, InboundAsset, InboundAssets } from '@n20a/libform'
import { DeviceModelFEnums } from '../../../shared/alldefaultprops/sidebar/DeviceModelEnums'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks'
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor'
import { DC, DEVICE, EM, MISC } from '../../../shared/interceptors/EndPoints'
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely'
import { FnBuildUrlForFind } from '../../../shared/allcommon/FnBuildSessionPayloadForFind'
import { FEnums } from '../../../constants/Feature'
import { FnGenerateUID } from '../../../shared/allcommon/settingsform/FnGenerateUID'
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer'
import { IExternalSearch } from '../../../shared/allinterface/sidebar/IDeviceModel'

const InboundAssetContainer = (props: IInboundAssetContainer) => {
    const [externalSearch, setExternalSearch] = useState<IExternalSearch>({
        Source: DeviceModelFEnums.NetZoomDeviceLibrary,
        Keywords: '',
        mfg: '',
        eqtype: '',
        productnumber: '',
        eqid: ''
    });
    const [inboundAssets, setInboundAssets] = useState<InboundAssets>([]);
    const [loadAllAssets, setLoadAllAssets] = useState<boolean>(false);
    const [inboundAssetsOriginal, setInboundAssetsOriginal] = useState<InboundAssets>([]);
    const [inboundAssetKey, setInboundAssetKey] = useState<string>(props.uniqueName);
    const [selectedAsset, setSelectedAsset] = useState<IInboundAsset>();
    const [isShowDeviceModel, setIsShowDeviceModel] = useState<boolean>(false);
    const [showOkButtonOnly, setShowOkButtonOnly] = useState<boolean>(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");

    const hasInboundAssetDataLoaded = useRef<boolean>(false);
    const hasRequestedInboundAssets = useRef<boolean>(false);
    const loadAllAssetsRef = useRef<boolean>(false);

    const statusBarContext = useStatusBarContext();

    // Load inbound assets from API and filter unassigned records for the list.
    const getAssests = useCallback(() => {
        try {

            const getString = (value: unknown): string => (typeof value === 'string' ? value : '');
            const getOptionalString = (value: unknown): string | undefined => {
                if (value === null || value === undefined || value === '') return undefined;
                return String(value);
            };
            const formatToIsoDateOnly = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const parseUtcDateToLocal = (
                dateInput: string | Date | undefined | null
            ): string => {
                if (!dateInput) return "";

                let date: Date;

                if (dateInput instanceof Date) {
                    date = dateInput;
                } else {
                    const str = String(dateInput).trim();
                    if (!str) return "";

                    // 1. Date-only: YYYY-MM-DD or YYYY/MM/DD
                    const dateOnlyMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);

                    if (dateOnlyMatch) {
                        const [, year, month, day] = dateOnlyMatch.map(Number);
                        date = new Date(year, month - 1, day);

                        return isNaN(date.getTime())
                            ? ""
                            : formatToIsoDateOnly(date);
                    }

                    // 2. Date-only: MM/DD/YYYY
                    const usDateMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                    if (usDateMatch) {
                        const [, month, day, year] = usDateMatch.map(Number);
                        date = new Date(year, month - 1, day);

                        return isNaN(date.getTime())
                            ? ""
                            : formatToIsoDateOnly(date);
                    }

                    // 3. DateTime with Z or explicit offset
                    if (/Z$/i.test(str) || /[+-]\d{2}(:?\d{2})?$/.test(str)) {
                        date = new Date(str);
                    }

                    // 4. Naive ISO DateTime - treat as UTC
                    else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/i.test(str)) {
                        date = new Date(`${str.replace(' ', 'T')}Z`);
                    }

                    // 5. Fallback
                    else {
                        date = new Date(str);
                    }
                }

                if (isNaN(date.getTime())) {
                    return "";
                }

                return formatToIsoDateOnly(date);
            };

            // API payload shape can vary; normalize unknown record values to safe strings.
            const mapInboundAsset = (item: Record<string, unknown>): IInboundAsset => ({
                LastUpdated: item.LastUpdated ? parseUtcDateToLocal(getString(item.LastUpdated)) : "",
                InboundAssetId: getOptionalString(item.InboundAssetId),
                InboundAssetName: getOptionalString(item._InboundAsset),
                Source:
                    getString(item.Source).toLowerCase() === "snow"
                        ? "snow"
                        : getString(item.Source).toLowerCase() === "wd"
                            ? "wd"
                            : "other",
                Site: getString(item.Site),
                CreatedBy: getOptionalString(item.CreatedBy),
                Instructions: getOptionalString(item.Instructions),
                EQID: getString(item.EQID),
                EntityName: getOptionalString(item.EntityName),
                EntId: getOptionalString(item.EntID),
                _WorkorderProfile: getOptionalString(item.WorkorderProfile),
                sysid: getString(item.sysid) || getString(item.RecID),
                InvEntityName: getOptionalString(item.InvEntityName),
                InvEntID: getOptionalString(item.InvEntID),
                _InboundAsset: getOptionalString(item._InboundAsset),
                assetid: getOptionalString(item.RecID),
                Manufacturer: getString(item.Manufacturer),
                EqType: getOptionalString(item.EqType),
                MfgProdNo: getString(item.MfgProdNo),
                MfgDesc: getOptionalString(item.MfgDesc),
                Room: getOptionalString(item.Room),
                Floor: getOptionalString(item.Floor),
                Location: getOptionalString(item.Location),
                Rack: getOptionalString(item.Rack),
                RUPos: getOptionalString(item.RUPos),
                MountType: getOptionalString(item.MountType),
            });
            axiosInterceptor({
                url: MISC.GetTableData,
                data: {
                    "tableName": "_InboundAsset",
                },
                setFetchData: (_respTableRec: unknown, status?: string) => {
                    if (status === "200" && _respTableRec && typeof _respTableRec === "object" && 'dataJson' in _respTableRec) {
                        const parsedData = FnParseJsonSafely(_respTableRec.dataJson as string);
                        const safeData: Record<string, unknown>[] = Array.isArray(parsedData)
                            ? parsedData.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
                            : [];
                        const result: IInboundAsset[] = safeData.map(mapInboundAsset);

                        const filterByEntIDAndEntityName = result.filter((item) => {
                            return !item.EntityName && !item.EntId;
                        });

                        setInboundAssetsOriginal(result);
                        if (loadAllAssetsRef.current) {
                            setInboundAssets(result);
                        } else {
                            setInboundAssets(filterByEntIDAndEntityName);
                        }
                        setInboundAssetKey(FnGenerateUID());
                    }
                }
            }, statusBarContext);
        } catch (error) {
            console.error("Error in getInboundAssets", error)
        }
    }, [])

    // Fetch inbound assets once when the container mounts.
    useEffect(() => {
        if (hasRequestedInboundAssets.current) return;
        hasRequestedInboundAssets.current = true;
        getAssests()
    }, [getAssests])

    // Helper to match assets by available identifiers when EntId is missing or unassigned
    const isMatchById = (a?: IInboundAsset, b?: IInboundAsset): boolean => {
        if (!a || !b) return false;
        if (a === b) return true;
        if (a.EntId && b.EntId && String(a.EntId).trim() === String(b.EntId).trim()) return true;
        if (a.assetid && b.assetid && String(a.assetid).trim() === String(b.assetid).trim()) return true;
        if (a.sysid && b.sysid && String(a.sysid).trim() === String(b.sysid).trim()) return true;
        if (a.InboundAssetId && b.InboundAssetId && String(a.InboundAssetId).trim() === String(b.InboundAssetId).trim()) return true;
        if (a.InvEntID && b.InvEntID && String(a.InvEntID).trim() === String(b.InvEntID).trim()) return true;

        // Cross-match assetid and sysid since both can represent RecID
        const aRecId = a.assetid || a.sysid;
        const bRecId = b.assetid || b.sysid;
        if (aRecId && bRecId && String(aRecId).trim() === String(bRecId).trim()) return true;

        return false;
    };

    // Persist edited inbound asset fields and refresh the asset list.
    const handleOnSave = (updatedAssets: InboundAssets, currentSelectedAsset?: IInboundAsset): void => {
        const targetAsset = currentSelectedAsset || selectedAsset;

        let findSelectedItem = targetAsset
            ? updatedAssets.find((item) => isMatchById(item, targetAsset))
            : undefined;

        if (!findSelectedItem && targetAsset) {
            findSelectedItem = targetAsset;
        }

        if (!findSelectedItem) {
            findSelectedItem = updatedAssets.find((item) => {
                const orig = inboundAssetsOriginal.find((o) => isMatchById(o, item));
                if (!orig) return false;
                return (
                    item.EQID !== orig.EQID ||
                    item.Site !== orig.Site ||
                    item.Room !== orig.Room ||
                    item.Floor !== orig.Floor ||
                    item.Location !== orig.Location ||
                    item.Manufacturer !== orig.Manufacturer ||
                    item.MfgProdNo !== orig.MfgProdNo ||
                    item.EqType !== orig.EqType
                );
            });
        }

        if (!findSelectedItem && updatedAssets.length === 1) {
            findSelectedItem = updatedAssets[0];
        }

        if (!findSelectedItem) {
            return;
        }

        const originalAsset = inboundAssetsOriginal.find((item) => isMatchById(item, findSelectedItem));
        const recId = findSelectedItem?.assetid || findSelectedItem?.sysid || originalAsset?.assetid || originalAsset?.sysid;

        if (!recId) {
            setShowOkButtonOnly(true);
            setConfirmMessage("Record ID not found for asset");
            setIsConfirmOpen(true);
            return;
        }

        setSelectedAsset({ ...findSelectedItem, EQID: '' });

        const payloadToUpdate = {
            ["_InboundAsset"]: [{
                RecID: recId,
                EQID: ''
            }]
        };

        axiosInterceptor({
            url: EM.UpdateTableRecord,
            data: {
                jsonString: JSON.stringify(payloadToUpdate)
            },
            allowShowLoader: true,
            setFetchData: (async (_response: unknown, status) => {
                if (status === '200') {
                    setShowOkButtonOnly(true);
                    setConfirmMessage("Asset updated successfully");
                    setIsConfirmOpen(true);
                } else {
                    setShowOkButtonOnly(true);
                    setConfirmMessage("Failed to update asset");
                    setIsConfirmOpen(true);
                }
            })
        }, statusBarContext);
    };

    // Open device model panel or assign EQID to the selected asset when an eqid is found.
    function handleShowModel(eqid: string, selectedAsset: IInboundAsset): void {
        const cleanEqid = (eqid && typeof eqid === 'string' && !eqid.includes('|')) ? eqid.trim() : '';
        const assetEqid = (selectedAsset?.EQID && typeof selectedAsset.EQID === 'string' && !selectedAsset.EQID.includes('|')) ? selectedAsset.EQID.trim() : '';
        const identifiedEqid = cleanEqid || assetEqid;

        if (identifiedEqid) {
            const originalAsset = inboundAssetsOriginal.find((item) => isMatchById(item, selectedAsset));
            const recId = selectedAsset?.assetid || selectedAsset?.sysid || originalAsset?.assetid || originalAsset?.sysid;

            if (!recId) {
                setShowOkButtonOnly(true);
                setConfirmMessage("Record ID not found for asset");
                setIsConfirmOpen(true);
                return;
            }

            const payloadToUpdate = {
                ["_InboundAsset"]: [{
                    RecID: recId,
                    EQID: identifiedEqid
                }]
            };

            axiosInterceptor({
                url: EM.UpdateTableRecord,
                data: {
                    jsonString: JSON.stringify(payloadToUpdate)
                },
                allowShowLoader: true,
                setFetchData: (async (_response: unknown, status) => {
                    if (status === '200') {
                        setShowOkButtonOnly(true);
                        setConfirmMessage("Asset updated successfully");
                        setIsConfirmOpen(true);
                    } else {
                        setShowOkButtonOnly(true);
                        setConfirmMessage("Failed to update asset EQID");
                        setIsConfirmOpen(true);
                    }
                })
            }, statusBarContext);
            return;
        }

        setIsShowDeviceModel(true);
        if (selectedAsset) {
            setSelectedAsset(selectedAsset);
            const mfg = selectedAsset.Manufacturer?.trim() || '';
            const eqtype = selectedAsset.EqType?.trim() || '';
            const productnumber = selectedAsset.MfgProdNo?.trim() || '';
            const rawKw = productnumber || selectedAsset._InboundAsset || selectedAsset.InboundAssetName || mfg || '';
            const cleanKw = rawKw.replace(/\|/g, ' ').replace(/_/g, ' ').trim();

            setExternalSearch({
                Source: DeviceModelFEnums.NetZoomDeviceLibrary,
                Keywords: cleanKw,
                mfg: mfg,
                eqtype: eqtype,
                productnumber: productnumber,
                eqid: ''
            });
        }
    }

    // Look up device EQID and open Asset Assignment in a new browser tab.
    function handleFindNetzoom(params: { EntityName?: string | undefined; EntId?: string | undefined }): void {
        try {
            let EQID: string | number | null = null;
            const sessionId = statusBarContext.userSessionId;
            if (!sessionId || !params.EntityName || !params.EntId) return;
            axiosInterceptor({
                url: MISC.GetTableData,
                data: {
                    "entityName": params.EntityName,
                    "tableName": "_Device",
                    "entIDList": params.EntId
                },
                setFetchData: (_respTableRec: unknown, status?: string) => {
                    if (status === "200" && _respTableRec && typeof _respTableRec === "object" && 'dataJson' in _respTableRec) {
                        const parsedData = FnParseJsonSafely(_respTableRec.dataJson as string);
                        const safeData: Record<string, unknown>[] = Array.isArray(parsedData)
                            ? parsedData.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
                            : [];
                        if (safeData.length) {
                            EQID = safeData[0].EQID ? String(safeData[0].EQID) : EQID;
                            const hierarchyUrl = FnBuildUrlForFind(parsedData);

                            const sessionId = statusBarContext.userSessionId;

                            if (!sessionId) {
                                setConfirmMessage("Session ID missing");
                                setShowOkButtonOnly(true);
                                setIsConfirmOpen(true)
                                return;
                            }
                            const url = `${window.location.origin}/feature/${FEnums.Assets}?isnew=true&id=${sessionId}${hierarchyUrl}`;

                            //  safer open
                            const newTab = window.open(url, "_blank");

                            if (!newTab) {
                                setConfirmMessage("Popup blocked");
                                setShowOkButtonOnly(true);
                                setIsConfirmOpen(true)
                            }
                        }
                    }
                }
            }, statusBarContext)
        } catch (error) {
            console.error("Error in handleFindNetzoom", error)
        }
    }

    // Placeholder validation hook required by InboundAsset form control.
    function handleValidateAssetDetails(_site: string, _room?: string, _floor?: string, _location?: string, _selectedAsset?: IInboundAsset) {
        return false;
    }

    const handleCreateInventoryInNetZoom = (asset: IInboundAsset): Promise<{ success?: boolean | undefined; error: string; EntityName?: string | undefined; EntId?: string | undefined }> => {
        return new Promise((resolve) => {
            const originalAsset = inboundAssetsOriginal.find((item) => isMatchById(item, asset));
            const sourceName = asset.Source?.trim() || originalAsset?.Source?.trim() || 'other';
            const eqid = asset.EQID?.trim() || originalAsset?.EQID?.trim();
            if (!eqid) {
                setShowOkButtonOnly(true);
                setConfirmMessage("EQID is required to create device in inventory");
                setIsConfirmOpen(true);
                resolve({ success: false, error: 'EQID is required' });
                return;
            }

            const deviceName = asset.MfgProdNo?.trim() ||
                originalAsset?.MfgProdNo?.trim() ||
                asset.InboundAssetName?.trim() ||
                originalAsset?.InboundAssetName?.trim() ||
                asset._InboundAsset?.trim() ||
                originalAsset?._InboundAsset?.trim() ||
                sourceName;

            axiosInterceptor({
                url: DC.AddBin,
                data: {
                    binName: sourceName
                },
                allowShowLoader: true,
                setFetchData: (binResp: unknown, binStatus?: string) => {
                    if (binStatus === '200' && binResp && typeof binResp === 'object') {
                        let binRecord: Record<string, unknown> | null = null;
                        if ('binJson' in binResp) {
                            const parsed = typeof (binResp as any).binJson === 'string'
                                ? FnParseJsonSafely((binResp as any).binJson)
                                : (binResp as any).binJson;
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                binRecord = parsed[0] as Record<string, unknown>;
                            } else if (parsed && typeof parsed === 'object') {
                                binRecord = parsed as Record<string, unknown>;
                            }
                        } else if ('dataJson' in binResp) {
                            const parsed = typeof (binResp as any).dataJson === 'string'
                                ? FnParseJsonSafely((binResp as any).dataJson)
                                : (binResp as any).dataJson;
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                binRecord = parsed[0] as Record<string, unknown>;
                            } else if (parsed && typeof parsed === 'object') {
                                binRecord = parsed as Record<string, unknown>;
                            }
                        } else if (Array.isArray(binResp) && binResp.length > 0) {
                            binRecord = binResp[0] as Record<string, unknown>;
                        } else {
                            binRecord = binResp as Record<string, unknown>;
                        }

                        if (binRecord) {
                            const siteName = String(binRecord.SiteName ?? binRecord.Site ?? binRecord.site ?? asset.Site ?? originalAsset?.Site ?? '').trim();
                            const inventoryName = String(binRecord.InventoryName ?? binRecord.Inventoryame ?? binRecord.Inventory ?? binRecord.inventory ?? asset.Room ?? originalAsset?.Room ?? '').trim();
                            const storeName = String(binRecord.StoreName ?? binRecord.Store ?? binRecord.store ?? asset.Floor ?? originalAsset?.Floor ?? '').trim();
                            const binName = String(binRecord.BinName ?? binRecord.Bin ?? binRecord.bin ?? asset.Location ?? originalAsset?.Location ?? sourceName).trim();

                            const addDevicePayload = {
                                eqid: eqid,
                                deviceName: deviceName,
                                site: siteName,
                                room: inventoryName,
                                floor: storeName,
                                location: binName,
                                Inventory: inventoryName,
                                Store: storeName
                            };

                            axiosInterceptor({
                                url: DEVICE.AddDeviceFromLibrary,
                                data: addDevicePayload,
                                allowShowLoader: true,
                                setFetchData: (_deviceResp: unknown, _deviceStatus?: string) => {
                                    if (_deviceStatus === '200') {
                                        let entId: string | undefined = undefined;
                                        let entityName: string = 'Device';

                                        if (_deviceResp && typeof _deviceResp === 'object') {
                                            const respObj = _deviceResp as Record<string, unknown>;
                                            entId = (respObj.EntID || respObj.entId || respObj.EntId || respObj.NodeEntID) as string | undefined;
                                            if (respObj.EntityName || respObj.entityName) {
                                                entityName = String(respObj.EntityName || respObj.entityName);
                                            }
                                            if ('deviceJson' in respObj && typeof respObj.deviceJson === 'string') {
                                                const parsedDev = FnParseJsonSafely(respObj.deviceJson);
                                                if (Array.isArray(parsedDev) && parsedDev.length > 0) {
                                                    entId = entId || parsedDev[0].EntID || parsedDev[0].entId || parsedDev[0].EntId;
                                                    entityName = parsedDev[0].EntityName || parsedDev[0].entityName || entityName;
                                                }
                                            }
                                            if ('dataJson' in respObj && typeof respObj.dataJson === 'string') {
                                                const parsedData = FnParseJsonSafely(respObj.dataJson);
                                                if (Array.isArray(parsedData) && parsedData.length > 0) {
                                                    entId = entId || parsedData[0].EntID || parsedData[0].entId || parsedData[0].EntId;
                                                    entityName = parsedData[0].EntityName || parsedData[0].entityName || entityName;
                                                }
                                            }
                                        }

                                        const recId = asset.assetid || asset.sysid || originalAsset?.assetid || originalAsset?.sysid;
                                        if (entId && recId) {
                                            const updatePayload = {
                                                ["_InboundAsset"]: [{
                                                    RecID: recId,
                                                    EntityName: entityName,
                                                    EntID: entId,
                                                    InvEntityName: entityName,
                                                    InvEntID: entId
                                                }]
                                            };
                                            axiosInterceptor({
                                                url: EM.UpdateTableRecord,
                                                data: { jsonString: JSON.stringify(updatePayload) },
                                                allowShowLoader: false,
                                                setFetchData: () => {
                                                    getAssests();
                                                }
                                            }, statusBarContext);
                                        } else {
                                            getAssests();
                                        }

                                        setShowOkButtonOnly(true);
                                        setConfirmMessage("Device created in inventory successfully");
                                        setIsConfirmOpen(true);
                                        resolve({ success: true, error: '', EntityName: entityName, EntId: entId });
                                    } else {
                                        setShowOkButtonOnly(true);
                                        setConfirmMessage("Failed to create device in inventory");
                                        setIsConfirmOpen(true);
                                        resolve({ success: false, error: 'Failed to add device from library' });
                                    }
                                }
                            }, statusBarContext);
                        } else {
                            setShowOkButtonOnly(true);
                            setConfirmMessage("Failed to resolve bin in inventory");
                            setIsConfirmOpen(true);
                            resolve({ success: false, error: 'Failed to resolve bin record' });
                        }
                    } else {
                        setShowOkButtonOnly(true);
                        setConfirmMessage("Failed to add bin in inventory");
                        setIsConfirmOpen(true);
                        resolve({ success: false, error: 'Failed to add bin' });
                    }
                }
            }, statusBarContext);
        });
    };

    return (
        <div className='nz-Inbound-Assets-Container'>

            <Splitter tabIndex={-1} className='nz-wh-100'>
                <SplitterPanel tabIndex={-1} minSize={25}>
                    <div className='nz-Inbound-assest-wrapper'>
                        <InboundAsset
                            key={inboundAssetKey}
                            InboundAssets={inboundAssets}
                            onSave={handleOnSave}
                            showModel={handleShowModel}
                            validateAssetDetails={handleValidateAssetDetails}
                            FindinNetZoom={handleFindNetzoom}
                            LoadAll={(checked: boolean) => {
                                loadAllAssetsRef.current = checked;
                                setLoadAllAssets(checked);
                                if (checked) {
                                    setInboundAssets(inboundAssetsOriginal);
                                    setInboundAssetKey(FnGenerateUID());
                                }
                                else {
                                    const filterByEntIDAndEntityName = inboundAssetsOriginal.filter((item) => {
                                        return !item.EntityName && !item.EntId;
                                    });
                                    setInboundAssets(filterByEntIDAndEntityName);
                                    setInboundAssetKey(FnGenerateUID());
                                }
                            }}
                            loadAllChecked={loadAllAssets}
                            CreateInventoryInNetZoom={handleCreateInventoryInNetZoom}
                        />
                    </div>
                </SplitterPanel>

                <SplitterPanel
                    tabIndex={-1}
                    minSize={25}
                    className="nz-mounted-pane"
                    style={{ display: isShowDeviceModel ? 'block' : 'none' }}
                >
                    {isShowDeviceModel && (
                        <DeviceModel
                            featureId={props.featureId}
                            ShowOnlyLibraryRedio={true}
                            uniqueName={'Device-Model'}
                            selectedNode={props.selectedNodeInfo.node}
                            allowDrag={true}
                            externalSearch={externalSearch as IExternalSearch}
                        />
                    )}
                </SplitterPanel>
            </Splitter>
            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'inbound-confirm'}
                message={confirmMessage}
                showOkButton={showOkButtonOnly}
                handleNoButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }}
                handleOkButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }} />
        </div>
    )
}
export { InboundAssetContainer }

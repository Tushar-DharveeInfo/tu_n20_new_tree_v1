
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { saveAs } from 'file-saver';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import * as XLSX from 'xlsx';
import { Close24x24, Download24x24, SetProperty24x24, Upload24x24 } from '@n20a/libicon';
import { YesNoControl } from '@n20a/libform';
import '../../allcss/store/kebabmenu/ManageDeviceData.css';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { IActionLabel } from '../../../shared/allinterface/basic/IActionLabel';
import { IImage } from '../../../shared/allinterface/basic/IImage';
import { IListItem } from '../../../shared/allinterface/basic/ICheckedListPanel';
import { IControl } from '../../../shared/allinterface/settingsform/ISettingsLibForm';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { ActionLabelStrip } from '../../../shared/basic/actionlabelstrip/ActionLabelStrip';
import { CheckedListPanel } from '../../../shared/basic/checkedlistpanel/CheckedListPanel';
import { Label } from '../../../shared/basic/label/Label';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { axiosInterceptor } from '../../../shared/interceptors/Interceptor';
import { SettingsLibForm } from '../../../shared/settingsform/settingslibform/SettingsLibForm';
import { IManageDeviceData, ManageDeviceDataProperty, ManageDeviceDataTable, PgGroupApiItem, PgGroupPropApiItem } from '../../allinterface/store/kebabmenu/IManageDeviceData';
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { EM, PROPERTY } from '../../../shared/interceptors/EndPoints';

// Workflow: selected node entity -> load pane 1 PG tables -> select one PG table -> load pane 2 editable properties.

// Build a common ActionImage object for toolbar icons.
const buildActionImage = (
    uniqueName: string,
    tooltip: string,
    source: React.ReactNode
): IImage => ({
    uniqueName,
    source,
    type: 'svg',
    w: 'var(--image-size-2)',
    h: 'var(--image-size-2)',
    tooltip,
});

// Build one Set popup form control row.
const buildSetPropertyControl = (
    name: string,
    propertyLabel: string,
    value: unknown,
    displayControl: 'TextControl' | 'EditTextControl',
    sortOrder: number
): IControl => ({
    RecID: '',
    EntID: '',
    EntityName: '',
    IsNZ: true,
    CanChange: 0,
    IsRequired: 1,
    GroupName: '',
    GroupNameDesc: '',
    SubGroupEntID: '',
    SubGroupName: 'Value',
    SubGroupNameDesc: '',
    _AP: name,
    NameDesc: '',
    Value: value as string,
    ValueDesc: '',
    SortOrder: sortOrder,
    MaxInstances: 0,
    InputMask: '',
    DisplayControl: displayControl,
    ChangeEvent: '',
    PropertyLabel: propertyLabel,
    Name: name,
    DefaultAPValue: '',
    disabled: displayControl === 'TextControl',
    DisplayGroupControl: 'Set Property',
    LastUpdated: '',
    RegEx: '',
    Secured: false,
});

// Build the Set popup controls: selected PG table, checked property name, and editable value.
const buildSetPropertyValueControl = (
    property: ManageDeviceDataProperty | undefined,
    table: ManageDeviceDataTable | undefined,
    value: unknown
): IControl[] => [

        buildSetPropertyControl('TableName', 'PG Table', table?.pgTable ?? '', 'TextControl', 1),
        buildSetPropertyControl('PropertyName', 'Property Name', property?.name ?? '', 'TextControl', 2),
        buildSetPropertyControl('Value', 'Value', value, 'EditTextControl', 3),
    ];

// Parse the API entityJson string and return the requested array.
const parseEntityJsonArray = <T,>(apiResponse: unknown, key: string): T[] => {
    if (!apiResponse || typeof apiResponse !== 'object' || !('entityJson' in apiResponse)) {
        return [];
    }

    try {
        const parsedData = JSON.parse((apiResponse as { entityJson?: string }).entityJson ?? '{}');
        const list = parsedData?.[key];
        return Array.isArray(list) ? list : [];
    } catch (error) {
        console.error(`Error parsing ${key} response:`, error);
        return [];
    }
};

const getSafeWorksheetName = (name: string, usedNames: Set<string>): string => {
    const fallbackName = 'Sheet';
    const sanitizedName = (name || fallbackName).replace(/[\\/?*[\]:]/g, '_').slice(0, 31) || fallbackName;
    let worksheetName = sanitizedName;
    let suffix = 1;

    while (usedNames.has(worksheetName)) {
        const suffixText = `_${suffix}`;
        worksheetName = `${sanitizedName.slice(0, 31 - suffixText.length)}${suffixText}`;
        suffix += 1;
    }

    usedNames.add(worksheetName);
    return worksheetName;
};

const isJsonRecordArray = (value: unknown): value is Record<string, unknown>[] => (
    Array.isArray(value) && value.every((row) => row !== null && typeof row === 'object' && !Array.isArray(row))
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
    value !== null && typeof value === 'object' && !Array.isArray(value)
);

const downloadEntityJsonWorkbook = (apiResponse: unknown, fileName: string) => {
    if (!apiResponse || typeof apiResponse !== 'object' || !('entityJson' in apiResponse)) {
        throw new Error('Download API returned invalid data.');
    }

    const parsedData = JSON.parse((apiResponse as { entityJson?: string }).entityJson ?? '{}') as Record<string, unknown>;
    const workbook = XLSX.utils.book_new();
    const usedWorksheetNames = new Set<string>();

    Object.entries(parsedData).forEach(([pgTableName, rows]) => {
        if (!isJsonRecordArray(rows)) {
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, getSafeWorksheetName(pgTableName, usedWorksheetNames));
    });

    if (!workbook.SheetNames.length) {
        throw new Error('Download API returned no export rows.');
    }

    const workbookData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([workbookData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const exportFileName = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

    saveAs(blob, exportFileName);
};

// Return the sort number used for API records.
const getSortValue = (item: { SortOrder?: number; ID?: number }) => item.SortOrder ?? item.ID ?? 0;

// Convert required columns from API string or array into an array.
const getRequiredColumns = (requiredColumns?: string[] | string): string[] => {
    if (Array.isArray(requiredColumns)) {
        return requiredColumns;
    }
    return requiredColumns ? requiredColumns.split(',').map((item) => item.trim()).filter(Boolean) : [];
};

// Convert pane-one PG group API records into table rows.
const mapPgGroupsToTables = (pgGroups: PgGroupApiItem[]): ManageDeviceDataTable[] => (
    pgGroups.sort((first, second) => getSortValue(first) - getSortValue(second)).map((item) => ({
        pgTable: item.Name,
        label: item.Label + ` (${item.Name})`,
        description: item.Description,
        recordCount: item.RecordCount ?? 0,
        requiredColumns: getRequiredColumns(item.RequiredColumns),
        properties: [],
    }))
);

// Convert pane-two PG property API records into editable checkbox rows.
const mapPgGroupPropsToProperties = (pgGroupProps: PgGroupPropApiItem[]): ManageDeviceDataProperty[] => (
    pgGroupProps
        .filter((item) => (item.DisplayControl ?? 'EditControl').toLowerCase() === 'editcontrol')
        .sort((first, second) => getSortValue(first) - getSortValue(second))
        .map((item) => ({
            id: String(item.ID),
            name: item.PropName,
            label: item.PropertyLabel,
            displayControl: item.DisplayControl ?? 'EditControl',
            currentValue: '',
            description: item.Description,
        }))
);

// Render and manage the two-pane Manage Device Data UI.
const ManageDeviceData = (props: IManageDeviceData) => {
    const uniqueName = props.uniqueName ?? 'manage-device-data';
    const [pgTables, setPgTables] = useState<ManageDeviceDataTable[]>([]);
    const [selectedPgTable, setSelectedPgTable] = useState<string>('');
    const [properties, setProperties] = useState<ManageDeviceDataProperty[]>([]);
    const [isPaneOneLoading, setIsPaneOneLoading] = useState(false);
    const [isPaneTwoLoading, setIsPaneTwoLoading] = useState(false);
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    const [isSetCountLoading, setIsSetCountLoading] = useState(false);
    const [isSetCountConfirmOpen, setIsSetCountConfirmOpen] = useState(false);
    const [updatableRecordCount, setUpdatableRecordCount] = useState(0);
    const [isSetPopupOpen, setIsSetPopupOpen] = useState(false);
    const [setValue, setSetValue] = useState<unknown>('');
    const [showSetSaveButton, setShowSetSaveButton] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isUpdateLoading, setIsUpdateLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const statusBarContext = useStatusBarContext();
    const selectedEntityName = props.entityName ?? props.selectedNodeInfo?.node?.NodeEntityname ?? '';

    // Load pane-one PG tables when selected node entity changes.
    useEffect(() => {
        let isCancelled = false;

        setPgTables([]);
        setSelectedPgTable('');
        setProperties([]);
        setIsSetPopupOpen(false);
        setIsSetCountConfirmOpen(false);
        setShowSetSaveButton(false);
        setSuccessMessage('');

        if (!selectedEntityName) {
            setIsPaneOneLoading(false);
            setIsPaneTwoLoading(false);
            return () => {
                isCancelled = true;
            };
        }

        setIsPaneOneLoading(true);
        setIsPaneTwoLoading(true);

        axiosInterceptor({
            url: EM.GetPgGroups,
            data: {
                entityName: selectedEntityName,
            },
            setFetchData: (apiResponse: unknown) => {
                if (isCancelled) {
                    return;
                }

                const nextTables = mapPgGroupsToTables(parseEntityJsonArray<PgGroupApiItem>(apiResponse, 'PGGroups'));
                setPgTables(nextTables);
                setSelectedPgTable(nextTables[0]?.pgTable ?? '');
                setIsPaneOneLoading(false);
                if (!nextTables.length) {
                    setIsPaneTwoLoading(false);
                }
            }
        }, statusBarContext).catch((error) => {
            if (!isCancelled) {
                console.error('Error fetching PG groups:', error);
                setPgTables([]);
                setProperties([]);
                setIsPaneOneLoading(false);
                setIsPaneTwoLoading(false);
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [selectedEntityName]);

    // Load pane-two editable properties when selected PG table changes.
    useEffect(() => {
        let isCancelled = false;

        setProperties([]);
        setIsSetPopupOpen(false);
        setIsSetCountConfirmOpen(false);
        setShowSetSaveButton(false);

        if (!selectedPgTable) {
            setIsPaneTwoLoading(false);
            return () => {
                isCancelled = true;
            };
        }

        setIsPaneTwoLoading(true);

        axiosInterceptor({
            url: EM.GetPgGroupProps,
            data: {
                pgGroupName: selectedPgTable,
            },
            setFetchData: (apiResponse: unknown) => {
                if (isCancelled) {
                    return;
                }

                const nextProperties = mapPgGroupPropsToProperties(parseEntityJsonArray<PgGroupPropApiItem>(apiResponse, 'PGGroupProps'));
                setProperties(nextProperties);
                setIsPaneTwoLoading(false);
            }
        }, statusBarContext).catch((error) => {
            if (!isCancelled) {
                console.error('Error fetching PG group properties:', error);
                setProperties([]);
                setIsPaneTwoLoading(false);
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [selectedPgTable]);

    // Find the currently selected pane-one PG table.
    const selectedTable = useMemo(
        () => pgTables.find((item) => item.pgTable === selectedPgTable) ?? pgTables[0],
        [pgTables, selectedPgTable]
    );

    // Find all checked pane-two properties.
    const checkedProperties = useMemo(
        () => properties.filter((item) => item.checked),
        [properties]
    );

    const hasCheckedProperties = checkedProperties.length > 0;
    const canSetProperty = checkedProperties.length === 1;
    const isAllPropertiesChecked = properties.length > 0 && checkedProperties.length === properties.length;

    // Build pane-one action label rows from PG tables.
    const tableActionLabels: IActionLabel[] = useMemo(
        () => pgTables.map((item) => ({
            uniqueName: `${uniqueName}-${item.pgTable}`,
            label: {
                uniqueName: `${uniqueName}-label-${item.pgTable}`,
                label: item.label,
                tooltip: item.description || item.pgTable,
                fontWeight: item.pgTable === selectedPgTable ? '600' : '400',
            },
            w: '100%',
            h: 'auto',
            align: 'left',
            actionCode: item.pgTable,
            selected: item.pgTable === selectedPgTable,
            handleMouse: function () { },
        })),
        [pgTables, selectedPgTable, uniqueName]
    );

    // Build pane-two checkbox rows from editable properties.
    const propertyListItems: IListItem[] = useMemo(
        () => properties.map((item) => ({
            id: item.id,
            label: item.label,
            description: `${item.description}`,
            checked: !!item.checked,
            selected: !!item.checked,
            propertyName: item.name,
            currentValue: item.currentValue,
        })),
        [properties]
    );

    // Select one PG table in pane one.
    const handleSelectPgTable = (
        _event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => {
        if (actionCode) {
            setSelectedPgTable(actionCode);
            setIsSetPopupOpen(false);
            setIsSetCountConfirmOpen(false);
            setShowSetSaveButton(false);
        }
    };

    // Toggle one property checkbox in pane two.
    const handleToggleProperty = (_value: string, name: string) => {
        setIsSetCountConfirmOpen(false);
        setIsSetPopupOpen(false);
        setShowSetSaveButton(false);
        setProperties((currentProperties) => currentProperties.map((property) => (
            property.id === name
                ? { ...property, checked: !property.checked }
                : property
        )));
    };

    // Check every property in pane two.
    const handleCheckAll = () => {
        if (isSetPopupOpen) {
            return;
        }
        setProperties((currentProperties) => currentProperties.map((property) => ({ ...property, checked: true })));
    };

    // Uncheck every property in pane two.
    const handleUncheckAll = () => {
        if (isSetPopupOpen) {
            return;
        }
        setProperties((currentProperties) => currentProperties.map((property) => ({ ...property, checked: false })));
    };

    // Prepare download payload for checked properties.
    const handleDownload = () => {
        if (!hasCheckedProperties || !selectedTable) {
            return;
        }

        const selectedPGGroupProps = checkedProperties.map((property) => property.name).join(';');

        setIsDownloadLoading(true);

        axiosInterceptor({
            url: EM.DownloadProps,
            allowShowLoader: true,
            data: {
                pgGroupName: selectedTable.pgTable,
                selectedPGGroupProps,
            },
            setFetchData: (apiResponse: unknown, status?: string) => {
                setIsDownloadLoading(false);

                if (status !== '200') {
                    console.error('Error downloading selected properties. API status:', status);
                    return;
                }

                try {
                    downloadEntityJsonWorkbook(apiResponse, selectedTable.pgTable);
                } catch (error) {
                    console.error('Error exporting selected properties:', error);
                }
            }
        }, statusBarContext).catch((error) => {
            setIsDownloadLoading(false);
            console.error('Error downloading selected properties:', error);
        });
    };

    // Handle Excel file selected by the hidden file input.
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Reset input so the same file can be re-selected if needed.
        event.target.value = '';

        if (!file || !selectedTable) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            try {
                const data = new Uint8Array(readerEvent.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0] ?? '';

                // Validate: sheet name must match selected PG table name (case-insensitive).
                if (firstSheetName.trim().toLowerCase() !== selectedTable.pgTable.trim().toLowerCase()) {
                    setErrorMessage(
                        `Sheet name "${firstSheetName}" does not match the selected table "${selectedTable.pgTable}". Please select a valid Excel file.`
                    );
                    return;
                }

                // Parse sheet rows to JSON records.
                const worksheet = workbook.Sheets[firstSheetName];
                const sheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

                setIsUpdateLoading(true);

                axiosInterceptor({
                    url: EM.AddUpdateMultipleTableRecords,
                    allowShowLoader: true,
                    data: {
                        jsonString: JSON.stringify({
                            [`${selectedTable.pgTable}`]: sheetData,
                        }),
                    },
                    setFetchData: (_apiResponse: unknown, status?: string) => {
                        setIsUpdateLoading(false);

                        if (status !== '200') {
                            setErrorMessage(`Import failed for "${selectedTable.pgTable}". Please try again.`);
                            return;
                        }

                        setSuccessMessage(`"${selectedTable.pgTable}" records imported and updated successfully.`);
                    }
                }, statusBarContext).catch((error) => {
                    setIsUpdateLoading(false);
                    console.error('Error calling AddUpdateTableRecord:', error);
                    setErrorMessage(`Import failed for "${selectedTable.pgTable}". Please try again.`);
                });
            } catch (error) {
                console.error('Error reading Excel file:', error);
                setErrorMessage('Failed to read the selected Excel file. Please ensure it is a valid .xlsx file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Open the hidden file input to prompt Excel file selection.
    const handleUpdate = () => {
        if (!selectedTable) {
            return;
        }
        fileInputRef.current?.click();
    };

    // Open Set popup for the single checked property.
    const handleOpenSetPopup = () => {
        if (!canSetProperty) {
            return;
        }

        const selectedProperty = checkedProperties[0];
        const payloadForGetUpdatableRecordCount = {
            entID: props.entID ?? props.selectedNodeInfo?.node?.NodeEntID ?? '',
            entityName: selectedEntityName,
            pgName: selectedTable?.pgTable ?? '',
            propertyName: selectedProperty.name,
        };

        setIsSetCountLoading(true);

        axiosInterceptor({
            url: PROPERTY.GetUpdatableRecordCount,
            data: payloadForGetUpdatableRecordCount,
            setFetchData: (apiResponse: unknown, status?: string) => {
                setIsSetCountLoading(false);

                if (status !== '200' || !isRecord(apiResponse)) {
                    console.error('Error fetching updatable record count. API status:', status);
                    return;
                }

                const count = Number(apiResponse.updateCount ?? 0);
                setUpdatableRecordCount(count);

                if (count > 0) {
                    setIsSetCountConfirmOpen(true);
                } else {
                    setSuccessMessage(`Update will apply to ${count} records. Please select another property.`);
                }
            }
        }, statusBarContext).catch((error) => {
            setIsSetCountLoading(false);
            console.error('Error fetching updatable record count:', error);
        });
    };

    // Open Set popup after confirming the updatable record count.
    const handleConfirmSetCount = () => {
        if (!canSetProperty) {
            setIsSetCountConfirmOpen(false);
            return;
        }

        setIsSetCountConfirmOpen(false);
        setSetValue(checkedProperties[0]?.currentValue ?? '');
        setShowSetSaveButton(false);
        setIsSetPopupOpen(true);
    };

    // Close Set count confirmation without opening the Set popup.
    const handleCancelSetCount = () => {
        setIsSetCountConfirmOpen(false);
    };

    // Call Set Property API and show success message on success.
    const handleApplySetValue = () => {
        const selectedPropertyId = checkedProperties[0]?.id;
        const selectedProperty = checkedProperties[0];

        if (!selectedPropertyId || !selectedProperty || !selectedTable) {
            return;
        }

        const payloadForSetPropertyValue = {
            entID: props.entID ?? props.selectedNodeInfo?.node?.NodeEntID ?? '',
            entityName: props.entityName ?? props.selectedNodeInfo?.node?.NodeEntityname ?? 'Device',
            pgName: selectedTable.pgTable,
            propertyName: selectedProperty.name,
            propertyValue: setValue,
        };

        axiosInterceptor({
            url: PROPERTY.SetPropertyValue,
            data: payloadForSetPropertyValue,
            setFetchData: (_apiResponse: unknown, status?: string) => {
                if (status !== '200') {
                    setShowSetSaveButton(false);
                    setIsSetPopupOpen(false);
                    return;
                }

                setProperties((currentProperties) => currentProperties.map((property) => (
                    property.id === selectedPropertyId
                        ? { ...property, currentValue: String(setValue ?? '') }
                        : property
                )));
                setSuccessMessage(`${selectedProperty.label} set successfully.`);
                setShowSetSaveButton(false);
                setIsSetPopupOpen(false);
            }
        }, statusBarContext)
    };

    // Track the Set popup value change.
    const handleSetValueChange = (
        fieldValue: unknown,
        name: string | undefined
    ): void | Promise<boolean> | Promise<void> => {
        if (name?.toLowerCase() === 'value') {
            setSetValue(fieldValue);
            setShowSetSaveButton(true);
        } else {
            setShowSetSaveButton(false);
        }
    };

    // Close the Set popup.
    const handleCloseSetPopup = () => {
        setShowSetSaveButton(false);
        setIsSetPopupOpen(false);
    };

    // Close the success message dialog.
    const handleCloseSuccessMessage = () => {
        setSuccessMessage('');
    };

    // Route pane-one toolbar clicks.
    const handlePaneOneAction = (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (actionCode === 'download') {
            handleDownload();
        } else if (actionCode === 'update') {
            handleUpdate();
        }
    };

    // Toggle between check all and uncheck all.
    const handleCheckAllChange = (value: boolean) => {
        if (value) {
            handleCheckAll();
        } else {
            handleUncheckAll();
        }
    };

    // Route pane-two toolbar clicks.
    const handlePaneTwoAction = (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (actionCode === 'set') {
            handleOpenSetPopup();
        }
    };

    return (
        <div className='nz-w-100 nz-h-100 nz-container-manage-device-data' >
            <div className='nz-w-100 nz-h-100 nz-container-panes'>
                <Splitter tabIndex={-1} className='nz-w-100 nz-h-100'>
                    <SplitterPanel tabIndex={-1} size={30} minSize={20} className='nz-d-flex-column nz-align-center nz-justify-center nz-pane-1'>
                        <div className='nz-action-list-container nz-action-with-buttons nz-w-100 nz-h-100'>
                            <div className='nz-sub-header'>
                                <Label uniqueName={`${props.uniqueName}-header`}
                                    label={props.headerText || "Manage Device Data"}
                                />
                            </div>
                            <div className='nz-list-data' onKeyDown={handleContainerKeyDown} tabIndex={1}>
                                {isPaneOneLoading ? (
                                    <div className='nz-wh-100 nz-d-flex-hv-left'>
                                        <Label uniqueName={`${uniqueName}-tables-loading`} label='Loading...' />
                                    </div>
                                ) : tableActionLabels.length ? (
                                    <ActionLabelStrip
                                        uniqueName={`${uniqueName}-tables`}
                                        actionLabels={tableActionLabels}
                                        h='100%'
                                        border='none'
                                        isVertical={true}
                                        w='100%'
                                        tabIndex={-1}
                                        handleMouse={handleSelectPgTable}
                                    />
                                ) : (
                                    <div className='nz-wh-100 nz-d-flex-hv-left'>
                                        <Label uniqueName={`${uniqueName}-tables-no-data`} label='No data found' />
                                    </div>
                                )}
                            </div>
                            <div className='nz-action-panel'>
                                <div className='nz-action-panel-actions'>
                                    <ActionImage
                                        image={buildActionImage(
                                            `${uniqueName}-download`,
                                            'Download selected properties',
                                            <Download24x24 size={FnGetCssVariable('--image-size-2')} fill='none' strokeWidth={1} />
                                        )}
                                        w='var(--node_height)'
                                        h='var(--node_height)'
                                        uniqueName={`${uniqueName}-ai-download`}
                                        actionCode='download'
                                        disabled={!hasCheckedProperties || isDownloadLoading}
                                        handleMouse={handlePaneOneAction}
                                    />
                                    <ActionImage
                                        image={buildActionImage(
                                            `${uniqueName}-update`,
                                            'Update selected properties',
                                            <Upload24x24 size={FnGetCssVariable('--image-size-2')} fill='none' strokeWidth={1} />
                                        )}
                                        w='var(--node_height)'
                                        h='var(--node_height)'
                                        uniqueName={`${uniqueName}-ai-update`}
                                        actionCode='update'
                                        disabled={!selectedTable || isUpdateLoading}
                                        handleMouse={handlePaneOneAction}
                                    />
                                </div>
                            </div>
                        </div>
                    </SplitterPanel>

                    <SplitterPanel tabIndex={-1} size={70} minSize={30} className='nz-d-flex-column nz-align-center nz-pane-2'>
                        <div className='nz-action-list-container nz-action-with-buttons nz-w-100 nz-h-100' onKeyDown={handleContainerKeyDown} tabIndex={1}>
                            {isPaneTwoLoading ? (
                                <div className='nz-wh-100 nz-d-flex-hv-left'>
                                    <Label uniqueName={`${uniqueName}-properties-loading`} label='Loading...' />
                                </div>
                            ) : propertyListItems.length ? (
                                <>
                                    <div className='nz-manage-device-property-header nz-sub-header'>
                                        <YesNoControl
                                            name={`${uniqueName}-properties-check-all`}
                                            label=''
                                            disabled={isSetPopupOpen}
                                            value={isAllPropertiesChecked}
                                            onChange={(value: boolean) => handleCheckAllChange(value)}
                                        />
                                        <Label
                                            uniqueName={`${uniqueName}-properties-header`}
                                            label={selectedTable ? `${selectedTable.label} Properties` : 'Properties'}
                                        />
                                    </div>
                                    <CheckedListPanel
                                        uniqueName={`${uniqueName}-properties`}
                                        listItems={propertyListItems}
                                        allowCheckbox={true}
                                        allowRightIcon={false}
                                        allowMulticheck={true}
                                        allowCustomCheckLogic={true}
                                        allowHeader={false}
                                        handleCustomCheck={handleToggleProperty}
                                    />
                                </>
                            ) : (
                                <div className='nz-wh-100 nz-d-flex-hv-left'>
                                    <Label uniqueName={`${uniqueName}-properties-no-data`} label='No data found' />
                                </div>
                            )}
                            <div className='nz-action-panel'>
                                <div className='nz-action-panel-actions'>
                                    <ActionImage
                                        image={buildActionImage(
                                            `${uniqueName}-set`,
                                            'Set selected property',
                                            <SetProperty24x24 size={FnGetCssVariable('--image-size-2')} fill='none' strokeWidth={1} />
                                        )}
                                        w='var(--node_height)'
                                        h='var(--node_height)'
                                        uniqueName={`${uniqueName}-ai-set`}
                                        actionCode='set'
                                        disabled={!canSetProperty || isSetCountLoading}
                                        handleMouse={handlePaneTwoAction}
                                    />
                                </div>
                            </div>
                        </div>
                    </SplitterPanel>
                </Splitter>
            </div>

            {isSetPopupOpen && (
                <div className='nz-set-property'>
                    <div className='nz-popup-overlay'>
                        <div className='nz-popup-container'>
                            <div className='nz-set-ai-container nz-sub-header'>
                                <Label uniqueName={`${uniqueName}-set-header`} label='Set Property' />
                                <ActionImage
                                    image={buildActionImage(
                                        `${uniqueName}-set-close`,
                                        'close',
                                        <Close24x24 size={FnGetCssVariable('--image-size-2')} fill="none"
                                            strokeWidth={1} />
                                    )}
                                    w='var(--node_height)'
                                    h='var(--node_height)'
                                    uniqueName={`${uniqueName}-ai-set-close`}
                                    actionCode='close'
                                    handleMouse={handleCloseSetPopup}
                                />
                            </div>
                            <div className='nz-Edit-form-content'>
                                <div className='nz-contener-setproperty'>
                                    <div className='nz-settings-helptip-container'>
                                        <Label
                                            uniqueName={`${uniqueName}-set-help`}
                                            label={`This feature will update ${checkedProperties[0]?.label ?? 'the selected property'} for matching ${selectedTable?.label ?? 'device data'} records.`}
                                        />
                                    </div>
                                    <div className='nz-form-setproperty'>
                                        <div className='nz-control-setproperty'>
                                            <SettingsLibForm
                                                controls={buildSetPropertyValueControl(checkedProperties[0], selectedTable, setValue)}
                                                uniqueName={`${uniqueName}-set-form-container`}
                                                handleValueChange={handleSetValueChange}
                                                allowShowHeader={true}
                                                headerText='Property Value'
                                                isDisableForm={false}
                                                profileString=''
                                                isAutoSave={true}
                                                handleValueChangeExternal={(values: Record<string, unknown>) => {
                                                    if (values) {
                                                        setShowSetSaveButton(true);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='nz-grid-popup-footer'>
                                <Button
                                    className={`nz-set-btn ${!showSetSaveButton ? 'nz-disabled ' : ''}`}
                                    onClick={handleApplySetValue}
                                    disabled={!showSetSaveButton}
                                >
                                    <Label label='Set' uniqueName={`${uniqueName}-set`} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <YesNoFormContainer
                isOpen={!!successMessage}
                uniqueName={`${uniqueName}-set-success-message`}
                message={successMessage}
                showOkButton={true}
                handleOkButtonClick={handleCloseSuccessMessage}
            />
            <YesNoFormContainer
                isOpen={isSetCountConfirmOpen}
                uniqueName={`${uniqueName}-set-record-count-message`}
                message={`Update will apply to ${updatableRecordCount} records. Are you sure you want to continue?`}
                handleYesButtonClick={handleConfirmSetCount}
                handleNoButtonClick={handleCancelSetCount}
            />
            <YesNoFormContainer
                isOpen={!!errorMessage}
                uniqueName={`${uniqueName}-update-error-message`}
                message={errorMessage}
                showOkButton={true}
                handleOkButtonClick={() => setErrorMessage('')}
            />
            {/* Hidden file input for Excel import */}
            <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx'
                style={{ display: 'none' }}
                onChange={handleFileSelected}
            />
        </div>
    );
};

export { ManageDeviceData };

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CascadingComboForm, ICombo } from '@n20a/libform';
import { useSessionContext } from '../../context/hooks/SessionHooks';
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks';
import { FnGetSessionVariableFromStorage } from '../../allcommon/basic/FnGetSessionVariableFromStorage';
import { getSessionCascadePreferences } from '../../allcommon/basic/FnCascadeSessionDefaults';
import { axiosInterceptor } from '../../interceptors/Interceptor';
import { AUTH, MISC } from '../../interceptors/EndPoints';
import { IRefData } from '../../allinterface/basic/IRefData';
import { ICascadeComboOption, ICascadingComboInitialValues, ISiteRefOption, ISiteTenantUserCascade, ITenantRecord, ITenantSiteData, ITenantUserRecord }
    from '../../allinterface/sidebar/ISiteTenantUserCascade';
import { ISession } from '../../context/allinterface/ISession';

const SITE_COMBO_ID = 'Site Name';
const TENANT_COMBO_ID = 'Tenant Name';
const USER_COMBO_ID = 'User Name';
const ALL_OPTION = 'All';

const isAllSelection = (value: string | null | undefined): boolean =>
    String(value ?? '').trim().toLowerCase() === 'all';

const normalizeCascadeSelection = (value: string | null | undefined): string => {
    const normalized = String(value ?? '').trim();
    if (!normalized || normalized.toLowerCase() === 'all') {
        return '';
    }
    return normalized;
};

const withAllOption = (options: ICascadeComboOption[]): ICascadeComboOption[] => {
    if (options.some((option) => option.Option === ALL_OPTION)) {
        return options;
    }
    return [{ Option: ALL_OPTION }, ...options];
};

const toDisplayValue = (
    value: string,
    options: ICascadeComboOption[]
): string | null => {
    if (value) {
        return value;
    }
    if (options.some((option) => option.Option === ALL_OPTION)) {
        return ALL_OPTION;
    }
    return null;
};

/** Single real option → select it; multiple → All (empty string). */
const resolveDefaultCascadeSelection = <T,>(
    items: T[],
    FnGetDisplayValue: (item: T) => string
): string => {
    if (items.length === 1) {
        return FnGetDisplayValue(items[0]);
    }
    return '';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

/*Extracts JSON payload from standard UI-API response wrappers. */
const parseApiJsonPayload = (response: unknown): unknown => {
    if (!isRecord(response)) {
        return response;
    }

    if (typeof response.jsonStringOutput === 'string' && response.jsonStringOutput.trim()) {
        try {
            return JSON.parse(response.jsonStringOutput);
        } catch (error) {
            console.error('Error in parse json string :', error);
            return response;
        }
    }

    if (typeof response.jsonString === 'string' && response.jsonString.trim()) {
        try {
            return JSON.parse(response.jsonString);
        } catch (error) {
            console.error('Error in parse json string :', error);
            return response;
        }
    }

    return response;
};

/*Parses refsites API response into site options (name + EntID). */
const parseRefSitesResponse = (response: unknown): IRefData[] => {
    const payload = parseApiJsonPayload(response);
    return Array.isArray(payload) ? payload as IRefData[] : [];
};

const normalizeUserName = (userName: string): string => userName.trim().toLowerCase();

const toTenantUserRecord = (value: unknown): ITenantUserRecord | null => {
    if (!isRecord(value)) {
        return null;
    }

    const userName = String(value.UserName ?? value.AuthEntityName ?? value.Name ?? '').trim();
    const userId = String(value.UserID ?? value.AuthEntID ?? value.EntID ?? '').trim();
    if (!userName) {
        return null;
    }

    return {
        UserID: userId,
        UserName: userName,
    };
};

const toTenantRecord = (value: unknown): ITenantRecord | null => {
    if (!isRecord(value)) {
        return null;
    }

    const tenantName = String(value.TenantName ?? '').trim();
    const tenantId = String(value.TenantID ?? '').trim();
    if (!tenantName) {
        return null;
    }

    const usersSource = Array.isArray(value.Users) ? value.Users : [];
    const users = usersSource
        .map(toTenantUserRecord)
        .filter((user): user is ITenantUserRecord => user !== null);

    return {
        TenantID: tenantId,
        TenantName: tenantName,
        Users: users,
    };
};

/*Parses get_tenant_user_for_site response { Tenants: [...] }. */
const parseTenantDataResponse = (response: unknown): ITenantRecord[] => {
    const parsePayload = (payload: unknown): ITenantRecord[] => {
        if (!isRecord(payload)) {
            return [];
        }

        const tenantsSource = payload.Tenants ?? payload.tenants;
        if (!Array.isArray(tenantsSource)) {
            return [];
        }

        return tenantsSource
            .map(toTenantRecord)
            .filter((tenant): tenant is ITenantRecord => tenant !== null);
    };

    const directTenants = parsePayload(response);
    if (directTenants.length) {
        return directTenants;
    }

    return parsePayload(parseApiJsonPayload(response));
};

/*Parses get_tenant_user_for_site response { Users: [...] }. */
const parseTenantUsersResponse = (response: unknown): ITenantUserRecord[] => {
    const parsePayload = (payload: unknown): ITenantUserRecord[] => {
        if (!isRecord(payload)) {
            return [];
        }

        const usersSource = payload.Users ?? payload.users;
        if (!Array.isArray(usersSource)) {
            return [];
        }

        return usersSource
            .map(toTenantUserRecord)
            .filter((user): user is ITenantUserRecord => user !== null);
    };

    const directUsers = parsePayload(response);
    if (directUsers.length) {
        return directUsers;
    }

    return parsePayload(parseApiJsonPayload(response));
};

const toSiteComboOptions = (sites: ISiteRefOption[]): ICascadeComboOption[] =>
    withAllOption(sites.map((site) => ({ Option: site.value })));

const findSiteOption = (
    mappedSites: ISiteRefOption[],
    siteName: string
): ISiteRefOption | undefined => {
    const normalizedSiteName = normalizeCascadeSelection(siteName).toLowerCase();
    if (!normalizedSiteName) {
        return undefined;
    }

    return mappedSites.find(
        (site) =>
            site.value.toLowerCase() === normalizedSiteName ||
            site.label.toLowerCase() === normalizedSiteName
    );
};

const toSiteRefOptions = (sites: IRefData[]): ISiteRefOption[] =>
    sites
        .map((site) => ({
            label: String(site.Label ?? site.Value ?? site.Name ?? '').trim(),
            value: String(site.Value ?? site.Name ?? '').trim(),
            entId: String(site.EntID ?? site.RefValue ?? '').trim(),
        }))
        .filter((site) => site.label && site.value);

/*Resolves default site from session — SiteName first (Location/SiteName), then SiteID. */
const resolveDefaultSiteFromSession = (
    mappedSites: ISiteRefOption[],
    sessionList: ISession[]
): ISiteRefOption | null => {
    const defaultSite: ISession[] | null = FnGetSessionVariableFromStorage(
        'Location',
        'SiteName',
        sessionList
    );
    const sessionSiteName = defaultSite?.[0]?.SessionValue?.trim() ?? '';

    if (sessionSiteName) {
        const matchedByName = findSiteOption(mappedSites, sessionSiteName);
        if (matchedByName) {
            return matchedByName;
        }
    }

    const defaultSiteId: ISession[] | null = FnGetSessionVariableFromStorage(
        'Location',
        'SiteID',
        sessionList
    );
    const sessionSiteId = defaultSiteId?.[0]?.SessionValue?.trim() ?? '';
    if (sessionSiteId) {
        const matchedById = mappedSites.find((site) => site.entId === sessionSiteId);
        if (matchedById) {
            return matchedById;
        }
    }

    return null;
};

const toTenantComboOptions = (tenants: ITenantRecord[]): ICascadeComboOption[] =>
    withAllOption(tenants.map((tenant) => ({ Option: tenant.TenantName })));

const toUserComboOptions = (users: ITenantUserRecord[]): ICascadeComboOption[] =>
    withAllOption(
        users
            .map((user) => user.UserName)
            .filter(Boolean)
            .map((userName) => ({ Option: userName }))
    );

const resolveTenantName = (
    tenants: ITenantRecord[],
    preferredTenantName?: string
): string => {
    if (preferredTenantName !== undefined) {
        const normalizedPreferred = normalizeCascadeSelection(preferredTenantName);
        if (!normalizedPreferred) {
            return '';
        }

        const matchedTenant = tenants.find(
            (tenant) =>
                tenant.TenantName === normalizedPreferred ||
                tenant.TenantName.toLowerCase() === normalizedPreferred.toLowerCase()
        );
        return matchedTenant?.TenantName ?? '';
    }

    return resolveDefaultCascadeSelection(tenants, (tenant) => tenant.TenantName);
};

const resolveUserName = (
    users: ITenantUserRecord[],
    preferredUserName?: string
): string => {
    if (preferredUserName !== undefined) {
        const normalizedPreferred = normalizeCascadeSelection(preferredUserName);
        if (!normalizedPreferred) {
            return '';
        }
        const normalizedUserName = normalizeUserName(normalizedPreferred);

        const matchedUser = users.find(
            (user) => normalizeUserName(user.UserName) === normalizedUserName
        );
        return matchedUser?.UserName ?? '';
    }

    return resolveDefaultCascadeSelection(users, (user) => user.UserName);
};

const getUsersForTenant = (
    tenants: ITenantRecord[],
    tenantName: string
): ITenantUserRecord[] => {
    const normalizedTenantName = tenantName.trim().toLowerCase();
    const matchedTenant = tenants.find(
        (tenant) => tenant.TenantName.trim().toLowerCase() === normalizedTenantName
    );
    return matchedTenant?.Users ?? [];
};

const toOutputUserName = (userName: string): string => {
    const normalized = normalizeCascadeSelection(userName);
    if (!normalized) {
        return '';
    }
    return normalizeUserName(normalized);
};

const toCascadeOutputValues = (
    siteName: string,
    tenantName: string,
    userName: string
) => ({
    SiteName: normalizeCascadeSelection(siteName),
    TenantName: normalizeCascadeSelection(tenantName),
    UserName: toOutputUserName(userName),
});

function SiteTenantUserCascade(props: ISiteTenantUserCascade) {
    const [siteOptions, setSiteOptions] = useState<ISiteRefOption[]>([]);
    const [cascadeInitialValues, setCascadeInitialValues] = useState<ICascadingComboInitialValues>();
    const [cascadeFormKey, setCascadeFormKey] = useState<string>('cascade-init');
    const sessionContext = useSessionContext();
    const statusBarContext = useStatusBarContext();
    const isSiteLocked = props.loginType?.toLowerCase() === 'node';

    const sitesLoadedRef = useRef(false);
    const sessionDefaultAppliedRef = useRef(false);
    const tenantRequestSiteIdRef = useRef<string>('');
    const siteOptionsRef = useRef<ISiteRefOption[]>([]);
    const tenantRecordsRef = useRef<ITenantRecord[]>([]);
    const tenantOptionsRef = useRef<ICascadeComboOption[]>([]);
    const userOptionsRef = useRef<ICascadeComboOption[]>([]);
    const siteAuthorizedUsersRef = useRef<ITenantUserRecord[]>([]);
    const selectedSiteIdRef = useRef<string>('');
    const selectedTenantNameRef = useRef<string>('');

    const notifyValuesChange = useCallback((
        siteName: string,
        tenantName: string,
        userName: string,
        isDefault = false
    ) => {
        props.onValuesChange(toCascadeOutputValues(siteName, tenantName, userName), { isDefault });
    }, [props.onValuesChange]);

    const applyTenantUserSelection = useCallback((
        siteName: string,
        tenantName: string,
        userName: string,
        isDefault = false
    ) => {
        selectedTenantNameRef.current = tenantName;

        const nextTenantOptions = toTenantComboOptions(tenantRecordsRef.current);
        const users = tenantName
            ? getUsersForTenant(tenantRecordsRef.current, tenantName)
            : siteAuthorizedUsersRef.current;
        const nextUserOptions = toUserComboOptions(users);
        tenantOptionsRef.current = nextTenantOptions;
        userOptionsRef.current = nextUserOptions;

        const siteComboOptions = toSiteComboOptions(siteOptionsRef.current);
        setCascadeInitialValues({
            [SITE_COMBO_ID]: toDisplayValue(siteName, siteComboOptions),
            [TENANT_COMBO_ID]: toDisplayValue(tenantName, nextTenantOptions),
            [USER_COMBO_ID]: toDisplayValue(userName, nextUserOptions),
        });
        setCascadeFormKey(
            `${selectedSiteIdRef.current}-${tenantName}-${nextTenantOptions.length}-${nextUserOptions.length}`
        );

        notifyValuesChange(siteName, tenantName, userName, isDefault);
    }, [notifyValuesChange]);

    const loadTenantDataForSite = useCallback((
        siteId: string,
        preferredTenantName?: string,
        preferredUserName?: string,
        forceReload = false
    ): Promise<ITenantSiteData> => {
        if (!siteId) {
            tenantRecordsRef.current = [];
            tenantOptionsRef.current = toTenantComboOptions([]);
            userOptionsRef.current = toUserComboOptions([]);
            siteAuthorizedUsersRef.current = [];
            tenantRequestSiteIdRef.current = '';
            return Promise.resolve({
                tenants: [],
                defaultTenantName: '',
                defaultUserName: '',
            });
        }

        if (!forceReload && tenantRequestSiteIdRef.current === siteId) {
            if (tenantRecordsRef.current.length) {
                const tenantName = resolveTenantName(tenantRecordsRef.current, preferredTenantName);
                const users = tenantName
                    ? getUsersForTenant(tenantRecordsRef.current, tenantName)
                    : siteAuthorizedUsersRef.current;
                return Promise.resolve({
                    tenants: tenantRecordsRef.current,
                    defaultTenantName: tenantName,
                    defaultUserName: resolveUserName(users, preferredUserName),
                });
            }

            if (siteAuthorizedUsersRef.current.length) {
                const users = siteAuthorizedUsersRef.current;
                return Promise.resolve({
                    tenants: [],
                    defaultTenantName: '',
                    defaultUserName: resolveUserName(users, preferredUserName),
                });
            }
        }

        tenantRequestSiteIdRef.current = siteId;

        return new Promise((resolve) => {
            axiosInterceptor(
                {
                    url: AUTH.GetTenantUserForSite,
                    data: {
                        siteID: siteId,
                    },
                    disableLog: true,
                    setFetchData: (response: unknown) => {
                        try {
                            const tenants = parseTenantDataResponse(response);
                            const users = parseTenantUsersResponse(response);

                            if (tenants.length > 0) {
                                tenantRecordsRef.current = tenants;
                                siteAuthorizedUsersRef.current = users.length > 0
                                    ? users
                                    : tenants.flatMap((t) => t.Users);

                                const defaultTenantName = resolveTenantName(tenants, preferredTenantName);
                                const userList = defaultTenantName
                                    ? getUsersForTenant(tenants, defaultTenantName)
                                    : siteAuthorizedUsersRef.current;
                                const defaultUserName = resolveUserName(userList, preferredUserName);

                                const comboOptions = toTenantComboOptions(tenants);
                                const userComboOptions = toUserComboOptions(userList);
                                tenantOptionsRef.current = comboOptions;
                                userOptionsRef.current = userComboOptions;

                                resolve({
                                    tenants,
                                    defaultTenantName,
                                    defaultUserName,
                                });
                                return;
                            }

                            // No tenants returned — use Users from get_tenant_user_for_site directly
                            tenantRecordsRef.current = [];
                            siteAuthorizedUsersRef.current = users;

                            const defaultUserName = resolveUserName(users, preferredUserName);
                            const comboOptions = toTenantComboOptions([]);
                            const userComboOptions = toUserComboOptions(users);
                            tenantOptionsRef.current = comboOptions;
                            userOptionsRef.current = userComboOptions;

                            resolve({
                                tenants: [],
                                defaultTenantName: '',
                                defaultUserName,
                            });
                        } catch (error) {
                            console.error('SiteTenantUserCascade: failed to parse tenant data', error);
                            tenantRecordsRef.current = [];
                            siteAuthorizedUsersRef.current = [];
                            tenantOptionsRef.current = toTenantComboOptions([]);
                            userOptionsRef.current = toUserComboOptions([]);
                            resolve({
                                tenants: [],
                                defaultTenantName: '',
                                defaultUserName: '',
                            });
                        }
                    },
                },
                statusBarContext
            ).catch((error) => {
                console.error('SiteTenantUserCascade: get_tenant_user_for_site failed', error);
                tenantRequestSiteIdRef.current = '';
                tenantRecordsRef.current = [];
                siteAuthorizedUsersRef.current = [];
                tenantOptionsRef.current = toTenantComboOptions([]);
                userOptionsRef.current = toUserComboOptions([]);
                resolve({
                    tenants: [],
                    defaultTenantName: '',
                    defaultUserName: '',
                });
            });
        });
    }, [statusBarContext]);

    const applySiteSelection = useCallback(async (
        siteName: string,
        siteId: string,
        preferredTenantName?: string,
        preferredUserName?: string,
        isDefault = false,
        forceReload = false
    ) => {
        if (!siteId) {
            return;
        }

        const siteChanged = selectedSiteIdRef.current !== siteId;
        selectedSiteIdRef.current = siteId;

        const tenantData = await loadTenantDataForSite(
            siteId,
            preferredTenantName,
            preferredUserName,
            forceReload || siteChanged
        );

        applyTenantUserSelection(
            siteName,
            tenantData.defaultTenantName,
            tenantData.defaultUserName,
            isDefault
        );
    }, [applyTenantUserSelection, loadTenantDataForSite]);

    const handleSiteChange = useCallback(async (siteName: string | null) => {
        if (isSiteLocked) {
            return;
        }

        const normalizedSiteName = normalizeCascadeSelection(siteName);
        const matchedSite = normalizedSiteName
            ? findSiteOption(siteOptionsRef.current, normalizedSiteName)
            : undefined;

        if (!matchedSite?.entId) {
            tenantRequestSiteIdRef.current = '';
            tenantRecordsRef.current = [];
            tenantOptionsRef.current = toTenantComboOptions([]);
            userOptionsRef.current = toUserComboOptions([]);
            siteAuthorizedUsersRef.current = [];
            selectedSiteIdRef.current = '';
            selectedTenantNameRef.current = '';

            setCascadeInitialValues({
                [SITE_COMBO_ID]: isAllSelection(siteName) ? ALL_OPTION : (normalizedSiteName || null),
                [TENANT_COMBO_ID]: ALL_OPTION,
                [USER_COMBO_ID]: ALL_OPTION,
            });
            setCascadeFormKey(`site-${normalizedSiteName || 'all'}-empty`);
            notifyValuesChange('', '', '');
            return;
        }

        tenantOptionsRef.current = toTenantComboOptions([]);
        userOptionsRef.current = toUserComboOptions([]);
        setCascadeFormKey(`site-${matchedSite.entId}-loading`);

        await applySiteSelection(matchedSite.value, matchedSite.entId, undefined, undefined, false, true);
    }, [applySiteSelection, isSiteLocked, notifyValuesChange]);

    const handleTenantChange = useCallback((tenantName: string | null) => {
        const normalizedTenantName = normalizeCascadeSelection(tenantName);
        const matchedSite = siteOptionsRef.current.find(
            (site) => site.entId === selectedSiteIdRef.current
        );
        const siteName = matchedSite?.value ?? '';

        if (!normalizedTenantName) {
            const authorizedUsers = siteAuthorizedUsersRef.current;
            userOptionsRef.current = toUserComboOptions(authorizedUsers);
            const defaultUserName = resolveUserName(authorizedUsers, undefined);
            applyTenantUserSelection(siteName, '', defaultUserName);
            return;
        }

        const users = getUsersForTenant(tenantRecordsRef.current, normalizedTenantName);
        const nextUserOptions = toUserComboOptions(users);
        userOptionsRef.current = nextUserOptions;

        const defaultUserName = resolveUserName(users, undefined);
        applyTenantUserSelection(siteName, normalizedTenantName, defaultUserName);
    }, [applyTenantUserSelection]);

    const handleUserChange = useCallback((userName: string | null) => {
        const normalizedUser = normalizeCascadeSelection(userName);
        const matchedSite = siteOptionsRef.current.find(
            (site) => site.entId === selectedSiteIdRef.current
        );

        const siteName = matchedSite?.value ?? '';
        const tenantName = selectedTenantNameRef.current;
        const siteComboOptions = toSiteComboOptions(siteOptionsRef.current);
        const tenantComboOptions = tenantOptionsRef.current;
        const userComboOptions = userOptionsRef.current;

        setCascadeInitialValues({
            [SITE_COMBO_ID]: toDisplayValue(siteName, siteComboOptions),
            [TENANT_COMBO_ID]: toDisplayValue(tenantName, tenantComboOptions),
            [USER_COMBO_ID]: toDisplayValue(normalizedUser, userComboOptions),
        });
        notifyValuesChange(siteName, tenantName, normalizedUser);
    }, [notifyValuesChange]);

    const siteTenantUserComboConfig = useMemo((): ICombo[] | undefined => {
        const tenantUserCombos: ICombo[] = [
            {
                id: TENANT_COMBO_ID,
                label: TENANT_COMBO_ID,
                populateOptions: () => tenantOptionsRef.current,
                onChange: (value) => {
                    handleTenantChange(value);
                },
            },
            {
                id: USER_COMBO_ID,
                label: USER_COMBO_ID,
                populateOptions: () => userOptionsRef.current,
                onChange: (value) => {
                    handleUserChange(value);
                },
            },
        ];

        return [
            {
                id: SITE_COMBO_ID,
                label: SITE_COMBO_ID,
                disable: isSiteLocked,
                populateOptions: () => toSiteComboOptions(siteOptionsRef.current),
                onChange: (value) => {
                    void handleSiteChange(value);
                },
            },
            ...tenantUserCombos,
        ];
    }, [
        handleSiteChange,
        handleTenantChange,
        handleUserChange,
        isSiteLocked,
        siteOptions,
    ]);

    const cascadeFormInitialValues = useMemo((): ICascadingComboInitialValues => {
        if (cascadeInitialValues) {
            return cascadeInitialValues;
        }

        if (isSiteLocked) {
            const siteName = props.profileSiteName?.trim() ?? '';
            return {
                [SITE_COMBO_ID]: siteName || ALL_OPTION,
                [TENANT_COMBO_ID]: ALL_OPTION,
                [USER_COMBO_ID]: ALL_OPTION,
            };
        }

        return {
            [SITE_COMBO_ID]: ALL_OPTION,
            [TENANT_COMBO_ID]: ALL_OPTION,
            [USER_COMBO_ID]: ALL_OPTION,
        };
    }, [cascadeInitialValues, isSiteLocked, props.profileSiteName]);

    const showCascade = Boolean(
        siteTenantUserComboConfig &&
        (!isSiteLocked || cascadeFormInitialValues[SITE_COMBO_ID])
    );

    useEffect(() => {
        siteOptionsRef.current = siteOptions;
    }, [siteOptions]);

    useEffect(() => {
        if (sitesLoadedRef.current) {
            return;
        }

        const loadSiteOptions = async () => {
            try {
                const sites = await new Promise<IRefData[]>((resolve) => {
                    axiosInterceptor(
                        {
                            url: MISC.GetRefList,
                            data: { groupNameCollection: 'refsites' },
                            disableLog: true,
                            setFetchData: (response: unknown) => {
                                resolve(parseRefSitesResponse(response));
                            },
                        },
                        statusBarContext
                    ).catch((error) => {
                        console.error('SiteTenantUserCascade: get_ref_list refsites failed', error);
                        resolve([]);
                    });
                });

                const mappedSites = toSiteRefOptions(sites);
                siteOptionsRef.current = mappedSites;
                setSiteOptions(mappedSites);
                sitesLoadedRef.current = true;
            } catch (error) {
                console.error('SiteTenantUserCascade: failed to load site options', error);
            }
        };

        void loadSiteOptions();
    }, []);

    useEffect(() => {
        if (!sitesLoadedRef.current || sessionDefaultAppliedRef.current) {
            return;
        }

        const applyAllCascadeDefaults = () => {
            sessionDefaultAppliedRef.current = true;
            tenantOptionsRef.current = toTenantComboOptions([]);
            userOptionsRef.current = toUserComboOptions([]);
            setCascadeInitialValues({
                [SITE_COMBO_ID]: ALL_OPTION,
                [TENANT_COMBO_ID]: ALL_OPTION,
                [USER_COMBO_ID]: ALL_OPTION,
            });
            setCascadeFormKey('cascade-all-default');
            notifyValuesChange('', '', '', true);
        };

        if (!siteOptions.length) {
            applyAllCascadeDefaults();
            return;
        }

        const storedSiteName = props.initialSiteName?.trim();
        const hasStoredTenant = props.initialTenantName !== undefined && props.initialTenantName !== null;
        const hasStoredUser = props.initialUserName !== undefined && props.initialUserName !== null;

        if (storedSiteName) {
            const matchedSite = findSiteOption(siteOptions, storedSiteName);
            if (!matchedSite?.entId) {
                applyAllCascadeDefaults();
                return;
            }

            sessionDefaultAppliedRef.current = true;
            void applySiteSelection(
                matchedSite.value,
                matchedSite.entId,
                hasStoredTenant ? String(props.initialTenantName ?? '').trim() : undefined,
                hasStoredUser ? String(props.initialUserName ?? '').trim() : undefined,
                false,
                true
            );
            return;
        }

        if (!sessionContext.SessionList.length) {
            return;
        }

        const sessionPrefs = getSessionCascadePreferences(sessionContext.SessionList);
        const lockedSiteName = isSiteLocked ? props.profileSiteName?.trim() ?? '' : '';
        const sessionSite = resolveDefaultSiteFromSession(siteOptions, sessionContext.SessionList);
        const matchedSite = (lockedSiteName
            ? findSiteOption(siteOptions, lockedSiteName)
            : undefined)
            ?? sessionSite
            ?? (siteOptions.length === 1 ? siteOptions[0] : null);

        if (!matchedSite?.entId) {
            applyAllCascadeDefaults();
            return;
        }

        sessionDefaultAppliedRef.current = true;

        void applySiteSelection(
            matchedSite.value,
            matchedSite.entId,
            sessionPrefs.tenantName,
            sessionPrefs.userName,
            true,
            true
        );
    }, [
        applySiteSelection,
        isSiteLocked,
        notifyValuesChange,
        props.initialSiteName,
        props.initialTenantName,
        props.initialUserName,
        props.profileSiteName,
        sessionContext.SessionList,
        siteOptions,
    ]);

    if (!showCascade || !siteTenantUserComboConfig) {
        return null;
    }

    return (
        <div className='nz-search-filter-site-user-cascade'>
            <CascadingComboForm
                key={cascadeFormKey}
                initialValues={cascadeFormInitialValues}
                cascadingComboArray={siteTenantUserComboConfig}
                buttons={[]}
                autoSubmit={true}
            />
        </div>
    );
}

export { SiteTenantUserCascade };

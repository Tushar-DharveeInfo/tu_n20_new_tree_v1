import type { IKeyValuePair, IKeyValueSections } from '@n20a/libform';

const DEFAULT_SERVER_STATUS_SECTION = 'NetZoom Server';

const SERVER_STATUS_KEYS = [
    'uptime',
    'SERVER_MAX_REQUEST_SIZE',
    'SERVER_PORT',
    'SERVER_RATE_LIMIT_MAX',
    'SERVER_RATE_LIMIT_WINDOW_MS',
    'SERVER_REQUEST_TIMEOUT',
] as const;

const environmentToRecord = (environment: unknown): Record<string, string> => {
    if (!Array.isArray(environment)) {
        return {};
    }

    return environment.reduce<Record<string, string>>((record, item) => {
        if (item && typeof item === 'object' && 'key' in item) {
            const { key, value } = item as IKeyValuePair;
            record[String(key)] = value == null ? '' : String(value);
        }
        return record;
    }, {});
};

// Maps expapi /server/status response: uptime from root, server settings from environment array.
const FnMapServerStatusToKeyValueSections = (response: unknown): IKeyValueSections | null => {
    if (!response || typeof response !== 'object') {
        return null;
    }

    const payload = response as Record<string, unknown>;
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const envRecord = environmentToRecord(data.environment);

    const values: Record<string, string> = {
        ...envRecord,
        uptime: data.uptime == null ? '' : String(data.uptime),
    };

    const pairs: IKeyValuePair[] = SERVER_STATUS_KEYS.map((key) => ({
        key,
        value: values[key] ?? '',
    }));

    if (!pairs.some((pair) => pair.value !== '')) {
        return null;
    }

    return {
        [DEFAULT_SERVER_STATUS_SECTION]: pairs,
    };
};

export { FnMapServerStatusToKeyValueSections, DEFAULT_SERVER_STATUS_SECTION, SERVER_STATUS_KEYS };

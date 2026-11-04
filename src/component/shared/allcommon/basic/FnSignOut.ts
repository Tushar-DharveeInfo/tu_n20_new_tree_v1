import { getRuntimeConfig, signOut as libAuthSignOut } from "@n20a/libauth";

export interface IFnSignOutOptions {
    /** Session ID to close on server, if any */
    sessionId?: string | null;
    /** Custom base URL for the API */
    apiBaseUrl?: string;
    /** Whether to call the CloseSession API on server. Defaults to true if sessionId is present */
    closeSession?: boolean;
    /** Whether to broadcast signout to other NZ- tabs. Defaults to true */
    broadcast?: boolean;
    /** Whether to remove session items from sessionStorage. Defaults to true */
    clearStorage?: boolean;
}

/**
 * Common sign-out function for the application.
 * Handles:
 * 1. Closing the active server session via CloseSession API (if session was created)
 * 2. Broadcasting signout to all other NZ- tabs via BroadcastChannel
 * 3. Clearing session-related keys from sessionStorage
 * 4. Calling libauth signOut (Firebase signOut for 'fb', etc.)
 */
const FnSignOut = async (options?: IFnSignOutOptions): Promise<void> => {
    const shouldCloseSession = options?.closeSession ?? Boolean(options?.sessionId);

    // 1. Close session on server if session ID is provided and closing is requested
    if (shouldCloseSession && options?.sessionId) {
        try {
            const prodUrl = window?.location?.origin ?? "";
            const isProd = import.meta.env.PROD;
            let baseUrl = options?.apiBaseUrl;

            if (!baseUrl) {
                if (window.APP_CONFIG?.DEPLOYMENT_N20_API_URL) {
                    baseUrl = String(window.APP_CONFIG.DEPLOYMENT_N20_API_URL);
                } else if (isProd) {
                    const runtimeConfig = getRuntimeConfig();
                    baseUrl = `${prodUrl}/${runtimeConfig?.API_AT ?? "n20api"}`;
                } else {
                    baseUrl = "https://n20a.netzoom.com/n20api";
                }
            }

            const cleanBase = baseUrl.replace(/\/+$/, '');
            const closeSessionUrl = `${cleanBase}/session/close_session`;

            await fetch(closeSessionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `nzSessionId ${options.sessionId}`
                },
                body: JSON.stringify({
                    sessionId: options.sessionId,
                    forceClose: true
                }),
                keepalive: true
            });
        } catch (error) {
            console.warn("FnSignOut: Failed to close session on server:", error);
        }
    }

    // 2. Broadcast signout to all other browser tabs whose title starts with NZ-
    if (options?.broadcast !== false) {
        try {
            const channel = new BroadcastChannel('nz-tab-control');
            channel.postMessage({ action: 'signout-all-tabs' });
            channel.close();
        } catch (error) {
            console.warn('FnSignOut: Failed to broadcast signout message:', error);
        }
    }

    // 3. Clear session storage items
    if (options?.clearStorage !== false) {
        try {
            window.sessionStorage.removeItem('session_variables');
            window.sessionStorage.removeItem('server_status_ok');
            window.sessionStorage.removeItem('user_session');
            window.sessionStorage.removeItem('selected_theme');
            window.sessionStorage.removeItem('appqaLaunch');
        } catch (error) {
            console.warn('FnSignOut: Failed to clear session storage:', error);
        }
    }

    // 4. Sign out from auth provider (Firebase for 'fb', etc.)
    try {
        const { AUTH_TYPE } = getRuntimeConfig();
        await libAuthSignOut(AUTH_TYPE);
    } catch (error) {
        console.warn('FnSignOut: Failed to sign out from auth provider:', error);
    }
};

export { FnSignOut };

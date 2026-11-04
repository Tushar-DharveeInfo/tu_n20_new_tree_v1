
import { useEffect, useRef } from "react";
import { getRuntimeConfig } from '@n20a/libauth'
import {
    IApiResponse,
    IAuthorization,
    ICreateSessionResponse,
    IIsSessionOpenResponse,
    IJsonSessionOutput
} from "./IAuthorization";
import { ISession } from "../component/shared/context/allinterface/ISession";
import { FnSignOut } from "../component/shared/allcommon/basic/FnSignOut";


const FnCheckServerStatus = async (): Promise<{
    ok: boolean;
    error?: string;
}> => {
    try {

        const cached = sessionStorage.getItem("server_status_ok");

        if (cached) {
            return { ok: true };
        }

        // Determine base URL
        const produrl = window.location.origin;

        const isProd = import.meta.env.PROD;

        const baseUrl = isProd
            ? `${produrl}/expapi`
            : "/expapi";

        // POST API call
        const res = await fetch(`${baseUrl}/server/status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prefixString: "SERVER_"
            })
        });

        if (!res.ok) {
            return {
                ok: false,
                error: `No configuration found for the server (${res.status})`
            };
        }

        const apiResponse = await res.json();

        if (!apiResponse) {
            return {
                ok: false,
                error: "No configuration found for the server"
            };
        }

        // Cache success
        sessionStorage.setItem("server_status_ok", "1");

        return { ok: true };

    } catch (err: any) {

        return {
            ok: false,
            error: err?.message ?? "Unknown server error"
        };
    }
};

const Authorization = ({ onSuccess, onError, apiBaseUrl, userData }: IAuthorization) => {
    const { API_AT } = getRuntimeConfig();
    const initializedRef = useRef(false);
    const produrl = window.location.origin;
    const isProd = import.meta.env.PROD;
    const baseUrl = isProd
        ? `${produrl}/${API_AT ?? "n20api"}`
        : apiBaseUrl ?? "";

    /* ---------------- FETCH ---------------- */

    const fetchJson = async <T,>(
        url: string,
        options?: RequestInit
    ): Promise<IApiResponse<T>> => {
        const res = await fetch(`${baseUrl}${url}`, {
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {})
            },
            ...options
        });

        if (!res.ok) {
            let errMsg = `API failed: ${res.status}`;
            try {
                const errJson = await res.json();
                errMsg = errJson?.errData?.map((e: any) => e.errString).join("\n") ?? errMsg;
            } catch { /* response body is not JSON (e.g. 502 HTML page) */ }
            throw new Error(errMsg);
        }

        const json = await res.json();

        return json;
    };
    const fail = (message: string) => {
        onError?.(message);
    };
    /* ---------------- HELPERS ---------------- */

    const parseJsonSessionOutput = (
        json?: string
    ): ISession[] => {
        if (!json) return [];

        try {
            const parsed = JSON.parse(json) as IJsonSessionOutput;

            if (Array.isArray(parsed.SessionValues)) {
                return parsed.SessionValues;
            }
            if (Array.isArray((parsed as any).SessionVariables)) {
                return (parsed as any).SessionVariables;
            }
        } catch (error) {
            console.error('Error in parse json string :', error);
            /* ignore */
        }
        return [];
    };

    const handleErrData = (resp: { errData?: any[] }) => {
        if (resp.errData?.length) {
            const msg = resp.errData
                .filter(e => e.isErr)
                .map(e => e.errString)
                .join("\n");

            if (msg) throw new Error(msg);
        }
    };

    /* ---------------- API ---------------- */
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("appqaLaunch") === "true") {
        sessionStorage.setItem("appqaLaunch", "true");
    }

    const isNewParam = searchParams.get("isnew");
    const idParam = searchParams.get("id");
    const impUserParam = searchParams.get("impuser");
    const impUserIdParam = searchParams.get("impuserid");
    const featureId = searchParams.get("location");

    const createSession = async (sessionId?: string) =>


        fetchJson<ICreateSessionResponse>('/session/create_session', {
            method: "POST",
            headers: {
                Authorization: sessionId ? `nzSessionId ${sessionId}` : "",
                nz_jsonsession: impUserParam && impUserIdParam
                    ? JSON.stringify([
                        {
                            VariableContext: "Impersonation",
                            VariableName: "ImpersonatedUserID",
                            SessionValue: impUserIdParam
                        },
                        {
                            VariableContext: "Impersonation",
                            VariableName: "ImpersonatedUserName",
                            SessionValue: impUserParam
                        }
                    ])
                    : userData?.email || userData?.username ? JSON.stringify([{
                        VariableContext: "RequestedBy",
                        VariableName: "LoginUserName",
                        SessionValue: import.meta.env.DEV ? "" : userData?.username
                    },
                    {
                        VariableContext: "RequestedBy",
                        VariableName: "LoginUserEmail",
                        SessionValue: import.meta.env.DEV ? "" : userData?.email
                    }]) : featureId ? JSON.stringify([{
                        VariableContext: "Feature",
                        VariableName: "FeatureID",
                        SessionValue: featureId
                    }])
                        : "",

                nz_issystemsessionid: 'false',
                Nz_isfromui: 'true'
            }
        });

    const isSessionOpen = async (sessionId: string) =>
        fetchJson<IIsSessionOpenResponse>('/session/is_session_open', {
            method: "POST",
            body: JSON.stringify({ sessionId })
        });


    /* ---------------- SESSION HANDLER ---------------- */

    const handleCreateSessionResponse = async (
        resp: IApiResponse<ICreateSessionResponse>
    ) => {
        handleErrData(resp);

        const { newSessionID, jsonSessionOutput } = resp.data;

        if (!newSessionID) {
            await FnSignOut({ apiBaseUrl: baseUrl, closeSession: false });
            throw new Error("Session ID missing");
        }

        const isValid = await FnCheckServerStatus();
        if (!isValid.ok && isValid.error) {
            await FnSignOut({ sessionId: newSessionID, apiBaseUrl: baseUrl, closeSession: true });
            fail(isValid.error);
            return;
        }


        onSuccess({
            sessionId: newSessionID,
            sessionVariables: parseJsonSessionOutput(jsonSessionOutput),
            isNewSession: true
        });
    };

    const handleOpenSessionResponse = async (
        resp: IApiResponse<IIsSessionOpenResponse>,
        sessionId: string
    ) => {
        handleErrData(resp);
        const isValid = await FnCheckServerStatus();
        if (!isValid.ok && isValid.error) {
            await FnSignOut({ sessionId, apiBaseUrl: baseUrl, closeSession: true });
            fail(isValid.error);
            return;
        }

        onSuccess({
            sessionId,
            sessionVariables: parseJsonSessionOutput(resp.data.jsonStringOutput),
            isNewSession: false
        });
    };


    /* ---------------- INIT ---------------- */

    const init = async () => {
        if (isNewParam === "false" && idParam) {
            const openResp = await isSessionOpen(idParam);

            if (openResp.data.isOpen === true) {
                await handleOpenSessionResponse(openResp, idParam);
                return;
            }

            await FnSignOut({ apiBaseUrl: baseUrl, closeSession: false });
            fail("Session is not open or invalid");
            return;
        }

        const createResp = await createSession(idParam ?? undefined);

        if (createResp.status === 100) {
            const errorData = createResp.errData?.find((item) => item.errCode > 0);
            const msg = errorData?.errString ?? "Session not found";
            await FnSignOut({ apiBaseUrl: baseUrl, closeSession: false });
            fail(msg);
            return;
        }
        await handleCreateSessionResponse(createResp);
    };


    /* ---------------- EFFECT ---------------- */

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        init().catch(async (err) => {
            console.error("Authorization failed:", err);
            await FnSignOut({ apiBaseUrl: baseUrl, closeSession: false });
            fail(err.message);
        });
    }, []);

    return null;
};

export { Authorization };

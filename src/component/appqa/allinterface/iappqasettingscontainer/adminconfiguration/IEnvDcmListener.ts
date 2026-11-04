
interface IEnvDcmListener {
    uniqueName: string;//unique identifier for the control
    featureId: string //feature id of selected menu
}

interface IEnvApiResponse {
    status: number;
    response: {
        success: boolean;
        data: unknown[];
    };
}

export type { IEnvDcmListener, IEnvApiResponse }

interface IAppqaSignout {
    uniqueName: string;//unique identifier for the control
    handleCloseFailed?: (error: Error) => void; // Optional callback for handling close failures
}

export type { IAppqaSignout }
